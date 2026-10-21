import {visualRoadWidth,roadTrafficLaneOffset} from './road-widths.mjs?v=044';
import {stepResidentRoutine,restoreResidentRoutine} from './resident-routines.mjs?v=010';
import {PEDESTRIAN_KIND_COUNT} from './extra-pedestrian-sprites.mjs?v=004';
import {makeCollisionIndex,addToCollisionIndex,moveInCollisionIndex,nearbyColliders,collidesWithTraffic,trafficMoveBlocked,trafficMoveBlocker,vehicleSeparation,vehiclesOverlap,vehicleHitsPedestrian,vehicleShape} from './traffic-collision.mjs?v=131';
import {handlingProfile,npcCruise,npcSpeedStep} from './vehicle-handling.mjs?v=010';
import {vs,ps} from './world-scale.mjs?v=001';
// BF14: following distance between two cars on the same edge (centre to centre).
const QUEUE=Object.freeze({stop:vs(6.3)+1,window:vs(7)});
import {buildJunctions,chooseSignals,junctionDecision,pruneReservations,pedestrianMayCross,clockSecondsFromMinutes,crosswalkYield} from './junctions.mjs?v=003';
import {findBorderGates,gateMouthClear,borderRing,GATE_RULES} from './border-gates.mjs?v=002';
/* GTA Melito — real OSM road topology (no invented rectangular street grid).
 * OSM ways share survey nodes; quantized coordinates preserve intersections.
 * Simulates moving traffic through intersections with legal one-way exits. */
export const DRIVABLE=new Set(['motorway','trunk','primary','secondary','tertiary','unclassified','residential','living_street','service','track']);
export const WALKABLE=new Set(['primary','secondary','tertiary','unclassified','residential','living_street','service','pedestrian','footway','path','steps','track']);
export const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export const hash=n=>{let x=(Number(n)||1)|0;x=Math.imul(x^x>>>16,2246822519);x=Math.imul(x^x>>>13,3266489917);return (x^x>>>16)>>>0;};
export const rand=n=>hash(n)/4294967295;
const key=(x,y)=>Math.round(x*10)+','+Math.round(y*10);
function circularRoadDirections(roads){
 // Some compact OSM traffic islands are represented as two open ways with
 // matching endpoints but no roundabout tag. Recognize only a broad, closed
 // ring; a narrow parallel road or a long block must remain two-way.
 const groups=new Map(),directions=new Map();
 for(const road of roads){
  const p=road.p||[];
  if(road.o||!DRIVABLE.has(road.t)||p.length<6)continue;
  const a=key(p[0],p[1]),b=key(p.at(-2),p.at(-1));
  if(a===b)continue;
  const id=[a,b].sort().join('|');
  if(!groups.has(id))groups.set(id,[]);groups.get(id).push(road);
 }
 for(const group of groups.values())for(let i=0;i<group.length;i++)for(let j=i+1;j<group.length;j++){
  const first=group[i],second=group[j],p=first.p,q=second.p;
  if(first.t!==second.t||key(p.at(-2),p.at(-1))!==key(q[0],q[1]))continue;
  const loop=[...p,...q.slice(2)],xs=[],ys=[];
  let area=0,length=0;
  for(let k=0;k<loop.length;k+=2){xs.push(loop[k]);ys.push(loop[k+1]);
   if(k){area+=loop[k-2]*loop[k+1]-loop[k]*loop[k-1];length+=Math.hypot(loop[k]-loop[k-2],loop[k+1]-loop[k-1]);}}
  const w=Math.max(...xs)-Math.min(...xs),h=Math.max(...ys)-Math.min(...ys);
  if(w<10||h<10||w>65||h>65||length>180||Math.abs(area/2)<w*h*.4)continue;
  // In screen coordinates a negative winding gives a right-hand outside
  // lane. Both arcs must travel the same way around the compact loop.
  const direction=area<0?1:-1;
  directions.set(first.id,direction);directions.set(second.id,direction);
 }
 return directions;
}
export function buildRoadGraph(roads,settings={}){
 const nodes=[],lookup=new Map(),edges=[],trafficStarts=[],walkStarts=[];
 const circular=circularRoadDirections(roads);
 function vertex(x,y){
  const id=key(x,y);let i=lookup.get(id);
  if(i===undefined){i=nodes.length;nodes.push({x,y,out:[]});lookup.set(id,i);}
  return i;
 }
 for(const road of roads){
  if(!DRIVABLE.has(road.t)&&!WALKABLE.has(road.t))continue;
  const p=road.p||[],car=DRIVABLE.has(road.t),walk=WALKABLE.has(road.t);
  for(let i=2;i<p.length;i+=2){
   const ax=p[i-2],ay=p[i-1],bx=p[i],by=p[i+1],len=Math.hypot(bx-ax,by-ay);
   if(!Number.isFinite(len)||len<.15||len>600)continue;
   const a=vertex(ax,ay),b=vertex(bx,by);
   if(a===b)continue;
   function add(from,to,angle,carAllowed){
    const edge={from,to,angle,len,roadId:road.id,name:road.n,streetWidth:visualRoadWidth(road),car:carAllowed,walk,roadType:road.t};
    const index=edges.length;edges.push(edge);nodes[from].out.push(index);
    if(carAllowed)trafficStarts.push(index);if(walk)walkStarts.push(index);
   }
   const direction=circular.get(road.id)||0;
   add(a,b,Math.atan2(by-ay,bx-ax),car&&direction>=0);
   // Cars obey one-way. Pedestrians may walk against a car-only one-way.
   if(!road.o||walk)add(b,a,Math.atan2(ay-by,ax-bx),car&&!road.o&&direction<=0);
  }
 }
 const junctions=nodes.filter(n=>n.out.filter(e=>edges[e].car).length>=3).length;
 // BF09: the last node of a car street cut by the municipal border is a gate to another town.
 const gates=settings.border?findBorderGates({nodes,edges},settings.border):[];
 // A gate whose way into the dark runs under a building drawn beyond the border is not used.
 for(const g of gates){g.blocked=!!settings.gateClear&&!gateMouthClear(g,settings.gateClear);if(!g.blocked)nodes[g.node].gate=g.index;}
 const liveCar=liveCarEdges(nodes,edges);
 const throughStarts=trafficStarts.filter(id=>liveCar[id]&&hasThroughExit({nodes,edges,liveCar,gates},id));
 const ring=borderRing(settings.border),center=ring.length?ring.reduce((c,p)=>({x:c.x+p[0]/ring.length,y:c.y+p[1]/ring.length}),{x:0,y:0}):null;
 const graph={nodes,edges,trafficStarts,throughStarts,walkStarts,junctions,liveCar,gates,borderCenter:center};
 // Q15: lanes clear of the building outlines on narrow streets (before the junction geometry uses them).
 if(settings.laneClear)graph.narrowedLanes=fitLanesToBuildings(graph,settings.laneClear);
 // BF07: incroci con linee d'arresto e precedenze; semafori SIMULATI sugli incroci principali.
 graph.intersections=buildJunctions(graph);
 graph.signals=chooseSignals(graph,graph.intersections);
 return graph;
}
// BF03: car edges from which traffic can keep driving for ever (a U-turn at a two-way dead end
// counts). An edge whose every route ends at a one-way terminal is a trap: in Melito a chain of
// one-way segments can lead there, so no NPC is spawned on it or turns into it.
// BF09: an edge that reaches a border gate leads out of the town, so it is never a trap.
function liveCarEdges(nodes,edges){
 const incoming=nodes.map(()=>[]),left=new Int32Array(edges.length),live=new Uint8Array(edges.length),dead=[];
 const sink=id=>nodes[edges[id].to].gate!==undefined;
 edges.forEach((e,id)=>{if(!e.car)return;incoming[e.to].push(id);live[id]=1;
  left[id]=nodes[e.to].out.filter(next=>edges[next].car).length;if(!left[id]&&!sink(id))dead.push(id);});
 while(dead.length){
  const id=dead.pop();live[id]=0;
  for(const before of incoming[edges[id].from])if(live[before]&&--left[before]===0&&!sink(before))dead.push(before);
 }
 return live;
}
// Q15: on narrow streets the visual road is wider than the gap between the OSM building outlines:
// the default lane ran under the walls (NPC cars drove through the corner of Santa Maria delle
// Grazie on Via Francesco Rossi). Each car edge keeps the widest lane, down to the usual minimum,
// whose outer flank stays clear of buildings along the whole edge.
export function laneOffsetOf(edge){return edge.laneOffset??roadTrafficLaneOffset(edge.streetWidth);}
// The lane never goes below the offset at which two cars in opposite directions still pass each other
// (minimum), and the last metres before each junction are left to the junction geometry (corners).
export function fitLanesToBuildings(graph,clear,{halfWidth=vs(1.7),margin=.25,step=3,minimum=vs(1.75),ends=5}={}){
 let narrowed=0;
 for(const e of graph.edges){
  if(!e.car||e.len<=2*ends)continue;
  const a=graph.nodes[e.from],b=graph.nodes[e.to],nx=-Math.sin(e.angle),ny=Math.cos(e.angle);
  const wanted=roadTrafficLaneOffset(e.streetWidth),flank=halfWidth+margin,floor=Math.min(wanted,minimum);
  const samples=Math.max(2,Math.ceil((e.len-2*ends)/step)+1);
  const fits=off=>{for(let i=0;i<samples;i++){const d=ends+(e.len-2*ends)*i/(samples-1),t=d/e.len,x=a.x+(b.x-a.x)*t+nx*off,y=a.y+(b.y-a.y)*t+ny*off;
   if(!clear(x,y)||!clear(x+nx*flank,y+ny*flank))return false;}return true;};
  let off=wanted;
  while(off>floor+1e-9&&!fits(off))off=Math.max(floor,off-.25);
  if(off<wanted-1e-9){e.laneOffset=off;narrowed++;}
 }
 return narrowed;
}
function position(graph,edgeIndex,t,body='walk',side=1){
 const e=graph.edges[edgeIndex],a=graph.nodes[e.from],b=graph.nodes[e.to];
 const offset=body==='car'?laneOffsetOf(e):
  DRIVABLE.has(e.roadType)?side*(e.streetWidth/2+1.7):0;
 return {x:a.x+(b.x-a.x)*t-Math.sin(e.angle)*offset,y:a.y+(b.y-a.y)*t+Math.cos(e.angle)*offset,a:e.angle};
}
export function createAgents(graph,count,seed=10,kind='car',avoid=[],settings={}){
 // An NPC should not materialize on a one-way terminal or a spur whose only
 // legal exit is an immediate U-turn. Keep such links in the road graph for
 // the player and for unavoidable routes, but prefer through streets for AI.
 // BF03: throughStarts also leave out the one-way chains that only end at a terminal.
 const through=kind==='car'?(graph.throughStarts||graph.trafficStarts.filter(id=>hasThroughExit(graph,id))):[];
 const options=kind==='car'?(through.length?through:graph.trafficStarts):graph.walkStarts;
 const agents=[],occupied=makeCollisionIndex(avoid);
 if(!options.length)return agents;
 const junctionGap=kind==='car'?junctionClearance(graph):null;
 for(let i=0;i<count;i++){
  for(let attempt=0;attempt<40;attempt++){
   const edgeIndex=options[hash(seed+i*65537+attempt*7349)%options.length];
   const edge=graph.edges[edgeIndex];
   if(kind==='car'&&edge.roadType==='service'&&i%3!==0&&attempt<12)continue;
   const t=.05+rand(seed+i*7+13+attempt*181)*.85,side=i%2?1:-1;
   const vehicleType=kind==='car'&&settings.motorcycleEvery&&i%settings.motorcycleEvery===2?'motorcycle':'car';
   const at={...position(graph,edgeIndex,t,kind,side),...(kind==='car'?{vehicleType}:{})};
   // BF03: the model is known before the checks, so the whole body of an Ape or a van is tested.
   if(kind==='car'&&settings.model)at.model=settings.model(i,vehicleType);
   if(kind==='car'&&isBusModel(at.model)&&!BUS_ROADS.has(edge.roadType))continue;
   if(collidesWithTraffic(at,kind,occupied))continue;
   if(kind==='walk'&&[...nearbyColliders(occupied,at.x,at.y,2)].some(other=>
    other.body==='walk'&&Math.hypot(at.x-other.x,at.y-other.y)<ps(1.5)))continue;
   if(kind==='car'&&[...nearbyColliders(occupied,at.x,at.y,10)].some(other=>
    (other.body||'car')==='car'&&Math.hypot(at.x-other.x,at.y-other.y)<vs(9)))continue;
   if(kind==='car'&&!carSpawnClear(graph,edgeIndex,t,at,occupied,junctionGap,settings))continue;
   const role=kind==='walk'?['commuter','errand','stroller'][hash(seed+i*31)%3]:
    ['through','local','courier'][hash(seed+i*31)%3];
   const agent={...at,edge:edgeIndex,t,speed:kind==='car'?(vehicleType==='motorcycle'?9:7)+rand(i*13+seed)*7:
    (role==='stroller'?.68:role==='commuter'?1.08:.85)+rand(i*11+seed)*.35,
    kind:kind==='walk'?i%PEDESTRIAN_KIND_COUNT:i%7,seed:seed+i*17,wait:0,body:kind,side,routine:role,segments:0,
    home:{x:at.x,y:at.y,edge:edgeIndex,side,radius:kind==='walk'?
     (role==='stroller'?58:role==='errand'?85:125):
     (role==='local'?185:role==='courier'?250:360)}};
   // Re-entry lanes are local to THIS agent's original neighborhood.
   // Cache once at spawn instead of sampling all of Melito on a recovery.
   const home=agent.home;
   home.returnEdges=options.filter(id=>{
    const e=graph.edges[id],a=graph.nodes[e.from],b=graph.nodes[e.to];
    const d=Math.min(Math.hypot(a.x-home.x,a.y-home.y),
     Math.hypot(b.x-home.x,b.y-home.y));
    return d<=home.radius*.55;
   });
   if(!home.returnEdges.includes(edgeIndex))home.returnEdges.unshift(edgeIndex);
   agents.push(agent);addToCollisionIndex(occupied,agent);break;
  }
 }
 return agents;
}
// BF03: half the width of the widest car street meeting at each junction node (0 elsewhere): a car
// is born with its whole body before that box, not across the crossing.
function junctionClearance(graph){
 const near=graph.nodes.map(()=>new Set()),width=new Float64Array(graph.nodes.length);
 for(const e of graph.edges){
  if(!e.car)continue;
  near[e.from].add(e.to);near[e.to].add(e.from);
  width[e.from]=Math.max(width[e.from],e.streetWidth);width[e.to]=Math.max(width[e.to],e.streetWidth);
 }
 return near.map((set,id)=>set.size>=3?width[id]/2:0);
}
// BF03: the whole body clear of the junctions, of vehicles (with a margin), of the player and of
// walls; an NPC is never born inside an obstacle and then left standing in its lane.
function carSpawnClear(graph,edgeIndex,t,at,occupied,junctionGap,settings){
 const edge=graph.edges[edgeIndex],shape=vehicleShape(at),reach=shape.halfLength+1.5;
 if(junctionGap[edge.from]&&t*edge.len<reach+junctionGap[edge.from])return false;
 if(junctionGap[edge.to]&&(1-t)*edge.len<reach+junctionGap[edge.to])return false;
 for(const other of nearbyColliders(occupied,at.x,at.y,12))
  if((other.body||'car')==='car'?vehiclesOverlap(at,other,.5):vehicleHitsPedestrian(at,other,1.5))return false;
 for(const spot of settings.keepClear||[])if(Math.hypot(at.x-spot.x,at.y-spot.y)<spot.r)return false;
 if(settings.clear){
  const c=Math.cos(at.a),s=Math.sin(at.a);
  for(const [f,l] of [[1,1],[1,-1],[-1,1],[-1,-1],[0,1],[0,-1]])
   if(!settings.clear(at.x+c*shape.halfLength*f-s*shape.halfWidth*l,at.y+s*shape.halfLength*f+c*shape.halfWidth*l))return false;
 }
 return true;
}
function hasThroughExit(graph,id){
 const edge=graph.edges[id],gate=graph.nodes[edge.to].gate;
 // BF09: the street goes on into the next town.
 if(gate!==undefined&&graph.gates?.[gate]?.exit===id)return true;
 // BF03: an exit into a trap does not count, or a car would drive up to it only to turn back.
 return graph.nodes[edge.to].out.some(next=>graph.edges[next].car&&graph.edges[next].to!==edge.from&&
  (!graph.liveCar||graph.liveCar[next]));
}
/* Q19: the urban bus is long (a 12,6 m body against the cars' 6,3): it is born, turns and is moved
 * off screen only on the main roads, where lanes and junctions are wide enough for it. */
export const BUS_ROADS=Object.freeze(new Set(['trunk','trunk_link','primary','primary_link','secondary','secondary_link','tertiary','tertiary_link']));
export const isBusModel=model=>/^autobus-/.test(model||'');
export function chooseTurn(graph,nodeId,oldEdge,agent,allowed){
 const node=graph.nodes[nodeId],incoming=graph.edges[oldEdge];
 let exits=node.out.filter(id=>allowed(graph.edges[id],id));
 if(!exits.length)return null;
 // BF03: a car never turns into a street that only leads to a one-way terminal, when it has a choice.
 if(agent.body==='car'&&graph.liveCar){const live=exits.filter(id=>graph.liveCar[id]);if(live.length)exits=live;}
 // Q19: the bus keeps to the main roads whenever the junction offers one.
 if(agent.mainOnly){const main=exits.filter(id=>BUS_ROADS.has(graph.edges[id].roadType));if(main.length)exits=main;}
 // Q12: an agent with a planned path follows it; everyone else keeps the usual wandering.
 if(agent.path){const k=agent.path.indexOf(oldEdge),want=k>=0?agent.path[k+1]:undefined;if(want!==undefined&&exits.includes(want))return want;}
 let pool=exits.filter(id=>graph.edges[id].to!==incoming.from);
 if(!pool.length)pool=exits;
 if(agent.body==='car'){
  const through=pool.filter(id=>hasThroughExit(graph,id));
  if(through.length)pool=through;
 }
 // Prefer continuing and plausible turns, vary destination by seeded tie breaker.
 const choice=pool.map(id=>{
  const edge=graph.edges[id],a=Math.abs(Math.atan2(Math.sin(edge.angle-incoming.angle),Math.cos(edge.angle-incoming.angle)));
  let weight=a<.25?2.8:a<1.9?1.3:.35;
  if(agent.routine==='commuter'||agent.routine==='through')weight*=a<.35?1.9:.8;
  if(agent.routine==='errand'||agent.routine==='local')weight*=a>.35&&a<2.1?1.8:1;
  if(agent.routine==='stroller')weight*=edge.roadType==='footway'||edge.roadType==='pedestrian'?2.2:1;
  if(agent.routine==='courier')weight*=edge.roadType==='service'||edge.roadType==='residential'?1.6:1;
  // Every civilian is assigned a deterministic home district at spawn.
  // When close to its edge, keep normal wandering; beyond it, prefer turns
  // pointing home instead of drifting across Melito forever.
  if(agent.home){
   const now=graph.nodes[nodeId],to=graph.nodes[edge.to],home=agent.home;
   const current=Math.hypot(now.x-home.x,now.y-home.y);
   if(current>home.radius*.7){
    const after=Math.hypot(to.x-home.x,to.y-home.y);
    weight*=clamp(Math.exp((current-after)/18),.18,10);
   }
  }
  return {id,weight};
 });
 const sum=choice.reduce((t,q)=>t+q.weight,0);
 let n=rand(++agent.seed)*sum;
 for(const q of choice){n-=q.weight;if(n<=0)return q.id;}
 return choice[choice.length-1].id;
}
function sidewalkTurn(graph,oldId,newId,side){
 const old=graph.edges[oldId],next=graph.edges[newId];
 const turn=Math.atan2(Math.sin(next.angle-old.angle),Math.cos(next.angle-old.angle));
 const nextSide=Math.abs(turn)>2.65?-side:side;
 const start=position(graph,oldId,1,'walk',side);
 const end=position(graph,newId,0,'walk',nextSide);
 const gap=Math.hypot(end.x-start.x,end.y-start.y);
 if(Math.abs(turn)<.32||Math.abs(turn)>2.65)
  return gap<4?{side:nextSide,points:[end]}:null;
 const ux=Math.cos(old.angle),uy=Math.sin(old.angle),vx=Math.cos(next.angle),vy=Math.sin(next.angle);
 const cross=ux*vy-uy*vx;
 if(Math.abs(cross)<.2)return null;
 const dx=end.x-start.x,dy=end.y-start.y;
 const approach=(dx*vy-dy*vx)/cross,depart=(dx*uy-dy*ux)/cross;
 // The outside corner extends forward from the old pavement and approaches
 // the next pavement from behind. An inside turn would cut across the road.
 if(approach<-.5||depart>.5||approach>22||depart< -22)return null;
 const corner={x:start.x+ux*approach,y:start.y+uy*approach};
 return {side:nextSide,points:[corner,end]};
}
// Q22: on the inside of a corner (turning towards its own pavement side) a pedestrian turns at the
// corner of the block, where the two pavements meet, instead of crossing the side street and back.
const INNER_REACH=18;
function innerTurn(graph,oldId,newId,side,left){
 const old=graph.edges[oldId],next=graph.edges[newId];
 const turn=Math.atan2(Math.sin(next.angle-old.angle),Math.cos(next.angle-old.angle));
 if(Math.abs(turn)<.32||Math.abs(turn)>2.65||Math.sign(turn)!==Math.sign(side))return null;
 const s1=position(graph,oldId,1,'walk',side),s2=position(graph,newId,0,'walk',side);
 const ux=Math.cos(old.angle),uy=Math.sin(old.angle),vx=Math.cos(next.angle),vy=Math.sin(next.angle);
 const cross=ux*vy-uy*vx;if(Math.abs(cross)<.2)return null;
 const dx=s2.x-s1.x,dy=s2.y-s1.y,a=(dx*vy-dy*vx)/cross,b=(dx*uy-dy*ux)/cross;
 // P = s1 + u·a = s2 + v·b: the corner, a little before the end of the old pavement and a little
 // after the start of the new one; it must still be ahead of the pedestrian.
 if(a>.5||a<-left+.2||b<-.5||b>Math.min(20,next.len*.6))return null;
 return {side,inner:true,points:[{x:s1.x+ux*a,y:s1.y+uy*a}],startT:Math.max(0,b)/next.len};
}
function stepSidewalkCorner(agent,distance,index){
 const path=agent.corner;
 while(distance>0&&path.at<path.points.length){
  const target=path.points[path.at],dx=target.x-agent.x,dy=target.y-agent.y,len=Math.hypot(dx,dy);
  const scale=len>0?Math.min(1,distance/len):1;
  const next={x:agent.x+dx*scale,y:agent.y+dy*scale,a:len>.01?Math.atan2(dy,dx):agent.a};
  if(index&&trafficMoveBlocked(agent,next,'walk',index,agent)){agent.braking=true;return;}
  Object.assign(agent,next);distance-=len*scale;
  if(scale<1)break;
  path.at++;
 }
 if(path.at===path.points.length){agent.edge=path.edge;agent.t=path.startT||0;agent.side=path.side;
  agent.seed=path.seed;agent.a=path.angle;agent.corner=null;
  agent.segments=(agent.segments||0)+1;
  if(agent.routine==='errand'&&agent.segments%5===0)agent.wait=1.5+rand(agent.seed)*2.5;
  if(agent.routine==='stroller'&&agent.segments%4===0)agent.wait=.8+rand(agent.seed)*1.7;
 }
 agent.braking=false;
}
function nextPose(graph,agent,distance){
 const route={edge:agent.edge,t:agent.t,seed:agent.seed,side:agent.side||1,body:agent.body,routine:agent.routine,home:agent.home,path:agent.path,mainOnly:isBusModel(agent.model)};
 let hops=0;
 while(distance>.00001&&hops++<8){
  const edge=graph.edges[route.edge];if(!edge)break;
  const remaining=(1-route.t)*edge.len;
  if(distance<remaining){route.t+=distance/edge.len;break;}
  distance-=remaining;
  // BF09: at a border gate a car of the traffic drives on into the dark instead of turning back.
  const gate=graph.nodes[edge.to].gate;
  if(gate!==undefined&&usesGates(agent)&&graph.gates[gate].exit===route.edge){route.t=1;route.reachGate=gate;break;}
  const next=chooseTurn(graph,edge.to,route.edge,route,e=>agent.body==='car'?e.car:e.walk);
  if(next==null){
   // A one-way endpoint has no legal exit. Remain there until the offscreen
   // deadlock recovery can choose a collision-free new route.
   route.t=1;route.wait=.3;break;
  }
  route.edge=next;route.t=0;
 }
 return {...route,...position(graph,route.edge,route.t,agent.body,route.side),vehicleType:agent.vehicleType,model:agent.model};
}
// BF07: the next junction on the route the car will really take: the same turns as nextPose
// (chooseTurn on a copy of the route, so the agent's own seed is untouched).
function nextJunction(graph,agent,maxDist){
 const junctions=graph.intersections;if(!junctions||agent.edge==null)return null;
 const route={edge:agent.edge,t:agent.t,seed:agent.seed,side:agent.side||1,body:agent.body,routine:agent.routine,home:agent.home,path:agent.path,mainOnly:isBusModel(agent.model)};
 let dist=0;
 for(let hops=0;hops<12;hops++){
  const edge=graph.edges[route.edge];if(!edge)return null;
  dist+=(1-route.t)*edge.len;
  const J=junctions.byNode.get(edge.to);
  const next=chooseTurn(graph,edge.to,route.edge,route,e=>e.car);
  if(next==null)return null;
  if(J)return {J,A:J.approaches.get(route.edge),dist,inEdge:route.edge,outEdge:next};
  if(dist>maxDist)return null;
  route.edge=next;route.t=0;
 }
 return null;
}
// BF01: reverse slowly along the current lane (never into another body), then wait.
function backOff(graph,agent,elapsed,index){
 const e=graph.edges[agent.edge],step=Math.min(agent.backoff,2*elapsed);
 const t=Math.max(0,agent.t-step/e.len),lane=position(graph,agent.edge,t,'car');
 const pose={x:lane.x,y:lane.y,a:agent.a,vehicleType:agent.vehicleType,model:agent.model};
 if(t<agent.t-1e-9&&!(index&&trafficMoveBlocked(agent,pose,'car',index,agent))){
  agent.x=pose.x;agent.y=pose.y;agent.t=t;agent.backoff-=step;agent.braking=false;agent.cannotYield=false;
 }else{agent.cannotYield=agent.backoff>=2.5;agent.backoff=0;}
 if(agent.backoff<=1e-6){agent.backoff=0;agent.wait=Math.max(agent.wait||0,1.5);agent.blockedBy=null;agent.braking=true;}
}
// BF01: a vehicle overlapping another one (after a shove or a spawn) slides out of it a little at a
// time, along the shortest way out, never into a wall; it does not drive on until it is free.
export function unstickVehicle(agent,index,world,dt){
 let px=0,py=0,count=0;
 for(const other of nearbyColliders(index,agent.x,agent.y,9)){
  if(other===agent||(other.body||'car')!=='car')continue;
  const sep=vehicleSeparation(agent,other);
  if(!sep)continue;
  px+=sep.nx*sep.depth;py+=sep.ny*sep.depth;count++;
 }
 if(!count)return false;
 const len=Math.hypot(px,py);
 if(len<1e-6)return false;
 const step=Math.min(len+.02,2.5*Math.min(dt,.1)),nx=agent.x+px/len*step,ny=agent.y+py/len*step;
 if(world.validRecovery&&!world.validRecovery(nx,ny,agent)){agent.braking=true;return true;}
 agent.x=nx;agent.y=ny;agent.braking=true;agent.unstuck=(agent.unstuck||0)+1;
 return true;
}
// The pavement continuations a pedestrian can take at the end of its edge (and its route copy).
function walkPlans(graph,agent,edge){
 const plans=new Map();
 for(const id of graph.nodes[edge.to].out){
  if(!graph.edges[id].walk)continue;
  const plan=sidewalkTurn(graph,agent.edge,id,agent.side||1);
  if(plan)plans.set(id,plan);
 }
 // Q13: never into a pavement whose line runs through a building (OSM footprints over the
 // sidewalk offset), as long as another way on is free.
 if(graph.isWalkBlocked&&plans.size>1){
  const free=[...plans].filter(([id,plan])=>!graph.isWalkBlocked(id,plan.side));
  if(free.length&&free.length<plans.size)for(const [id,plan] of [...plans])if(graph.isWalkBlocked(id,plan.side))plans.delete(id);
 }
 return {plans,route:{seed:agent.seed,body:'walk',routine:agent.routine,home:agent.home,path:agent.path}};
}
export {position as lanePosition,sidewalkTurn,innerTurn,nextPose as previewNextPose};
export function stepAgent(graph,agent,dt,others=[],player=null,index=null,clockMinutes=null,valid=null){
 if(!Number.isFinite(dt)||dt<=0||agent.impactTime>0||agent.needsRoutineRecovery)return;
 const elapsed=Math.min(dt,.1);
 // BF01: a knock sets a car's speed to 0; back on its lane it resumes its own cruising speed
 // (before, a struck NPC stayed stopped in the middle of the road for good).
 if(agent.body==='car'&&!(agent.speed>0)&&agent.resumeSpeed>0)agent.speed=agent.resumeSpeed;
 // BF01: the player keeps driving into this car while it stands still (game.mjs sets yieldToPlayer):
 // it backs off a couple of metres, so the player is never boxed in by traffic. A car merely
 // waiting behind the player (a queue, a red light) keeps waiting.
 if(agent.body==='car'&&agent.yieldToPlayer>0){
  agent.yieldToPlayer=Math.max(0,agent.yieldToPlayer-elapsed);
  if(agent.stalled>1&&!(agent.backoff>0)&&agent.edge!=null){agent.backoff=2.5;agent.yieldToPlayer=0;}
 }
 if(agent.residentRoutine){stepResidentRoutine(graph,agent,elapsed,index,clockMinutes,valid);return;}
 // BF01: the yielding car of a mutual block backs up along its own lane, then waits a moment.
 if(agent.body==='car'&&agent.backoff>0){backOff(graph,agent,elapsed,index);return;}
 if(agent.wait>0){agent.wait=Math.max(0,agent.wait-elapsed);return;}
 const edge=graph.edges[agent.edge];if(!edge||!(agent.body==='car'?edge.car:edge.walk))return;
 let speed=agent.speed;
 if(agent.body==='walk'){
  if(agent.corner){stepSidewalkCorner(agent,speed*elapsed,index);return;}
  // Q22: a few metres before the end of the pavement the pedestrian picks its way on; on the inside
  // of a corner it leaves the pavement at the corner of the block (no crossing, no detour).
  const before=(1-agent.t)*edge.len;
  if(agent.innerFor!==agent.edge&&before<=INNER_REACH){
   agent.innerFor=agent.edge;
   const {plans,route}=walkPlans(graph,agent,edge);
   for(const id of graph.nodes[edge.to].out){
    if(!graph.edges[id].walk)continue;
    const inner=innerTurn(graph,agent.edge,id,agent.side||1,before);
    if(inner&&!(graph.isWalkBlocked&&graph.isWalkBlocked(id,inner.side)))plans.set(id,inner);
   }
   const chosen=chooseTurn(graph,edge.to,agent.edge,route,(_,id)=>plans.has(id));
   agent.nextExit=chosen;
   const plan=chosen!=null?plans.get(chosen):null;
   if(plan?.inner){
    agent.corner={...plan,edge:chosen,angle:graph.edges[chosen].angle,seed:route.seed,at:0};agent.braking=false;
    stepSidewalkCorner(agent,speed*elapsed,index);return;
   }
  }
  // BF07: at a junction with (simulated) traffic lights a pedestrian who goes straight on crosses
  // the side street only with the green of its own street; it waits on the kerb, before the road.
  const signalled=graph.intersections?.byNode.get(edge.to);
  if(signalled?.signal){
   const left=(1-agent.t)*edge.len,kerb=signalled.r+1;
   if(left>=kerb-.05&&left-speed*elapsed<kerb){
    const {plans,route}=walkPlans(graph,agent,edge),chosen=chooseTurn(graph,edge.to,agent.edge,route,(_,id)=>plans.has(id));
    const turn=chosen==null?0:Math.abs(Math.atan2(Math.sin(graph.edges[chosen].angle-edge.angle),Math.cos(graph.edges[chosen].angle-edge.angle)));
    if(chosen!=null&&turn<.32&&!pedestrianMayCross(signalled,edge.angle,false,graph.intersections.clockSeconds)){
     Object.assign(agent,position(graph,agent.edge,1-kerb/edge.len,'walk',agent.side),{t:1-kerb/edge.len,braking:true,signalWait:true});
     return;
    }
   }
  }
  agent.signalWait=false;
  if(agent.t*edge.len+speed*elapsed>=edge.len){
   const {plans,route}=walkPlans(graph,agent,edge);
   // Q22: keep the way on picked at the corner check, when it is still possible.
   const chosen=agent.innerFor===agent.edge&&agent.nextExit!=null&&plans.has(agent.nextExit)?agent.nextExit:
    chooseTurn(graph,edge.to,agent.edge,route,(_,id)=>plans.has(id));
   if(chosen!=null){
    const at=position(graph,agent.edge,1,'walk',agent.side);
    if(index&&trafficMoveBlocked(agent,at,'walk',index,agent)){agent.braking=true;return;}
    Object.assign(agent,at,{t:1,corner:{...plans.get(chosen),edge:chosen,angle:graph.edges[chosen].angle,seed:route.seed,at:0},braking:false});
    return;
   }
   // At an unconnected pavement end, wait for offscreen recovery. Falling
   // through to nextPose could jump to the road centre at a junction.
   agent.t=1;agent.braking=true;return;
  }
 }
 let profile=null,limit=Infinity;
 if(agent.body==='car'){
  // BF05: crociera adatta al mezzo (Ape e furgoni più lenti) e spinta progressiva come il giocatore.
  profile=handlingProfile(agent);
  const cruise=npcCruise(profile,agent.speed);speed=cruise;
  // Following distance is checked only for traffic on this nearby segment.
  const near=index?nearbyColliders(index,agent.x,agent.y,18):others;
  agent.follows=null;
  // Q13: a pedestrian crossing or standing on the lane ahead: brake gently and stop before it
  // (before, the car only halted when it was about to touch the person).
  const hx=Math.cos(agent.a),hy=Math.sin(agent.a),body=vehicleShape(agent);let yieldPed=null;
  for(const other of near){
   if(other===agent)continue;
   if(other.body==='walk'){
    if(other.indoors)continue;
    const dx=other.x-agent.x,dy=other.y-agent.y,ahead=dx*hx+dy*hy,side=Math.abs(dy*hx-dx*hy);
    // workers at their post (vendors, washers) stand at the kerb: no braking for them while turning
    const onLane=other.crossing||other.dodge>0||other.isPlayer||ahead<9&&!other.stationary;
    if(onLane&&ahead>0&&ahead<16&&side<body.halfWidth+(other.crossing?1.2:.9)){
     speed=Math.min(speed,cruise*clamp((ahead-body.halfLength-1.6)/7,0,1));yieldPed=other;
    }
    continue;
   }
   if(other.body!=='car'||other.edge!==agent.edge)continue;
   const ahead=(other.t-agent.t)*edge.len;
   // BF14: queue gap and slow-down window follow the (smaller) vehicles: about 1 m between bumpers.
   if(ahead>0&&ahead<QUEUE.stop+QUEUE.window){const v=cruise*clamp((ahead-QUEUE.stop)/QUEUE.window,0,1);if(v<speed){speed=v;agent.follows=other;}}
  }
  agent.yieldPed=yieldPed;agent.yieldWait=yieldPed&&!(agent.v>.5)?(agent.yieldWait||0)+elapsed:0;
  // BF07: stop line of the next junction (red light, right of way, junction or exit not free).
  if(Number.isFinite(agent.jLimit)){limit=Math.max(0,agent.jLimit);speed=Math.min(speed,Math.sqrt(2*4.5*limit));}
  // Q24: a (fictional) speed bump ahead on this segment: slow down to cross it gently.
  if(edge.bumps){const at=agent.t*edge.len;for(const d of edge.bumps){const ahead=d-at;if(ahead>-2.5&&ahead<18)speed=Math.min(speed,ahead<2?3.2:3.2+(ahead-2)*.7);}}
  speed=npcSpeedStep(profile,agent.v,speed,elapsed);
 }
 if(limit<=1e-3){agent.braking=true;agent.blockedBy=null;if(profile)agent.v=0;return;}
 // Try reduced motion before stopping; this lets traffic queue naturally.
 // BF01: remember who blocks the move, so a mutual block at a junction can be untied.
 for(const factor of [1,.5,.25]){
  const next=nextPose(graph,agent,Math.min(speed*elapsed*factor,limit));
  const blocker=index?trafficMoveBlocker(agent,next,agent.body,index,agent):null;
  if(blocker){agent.blockedBy=blocker;continue;}
  Object.assign(agent,next);agent.braking=false;agent.blockedBy=null;
  if(profile)agent.v=Math.min(speed*factor,limit/elapsed);
  if(next.reachGate!==undefined){delete agent.reachGate;agent.gateMode={kind:'out',gate:next.reachGate,d:0};agent.gateFade=1;}
  return;
 }
 agent.braking=true;
 // Fermo davanti a un ostacolo: si riparte da zero, piano.
 if(profile)agent.v=0;
}
// Recover from an impact without snapping an on-screen NPC to a random
// highway. Return to a legal nearby lane/sidewalk; once offscreen, the agent
// may resume in its own original neighborhood instead.
function routinePosition(graph,agent,nearHome=false,index=null){
 let best=null,bestD=Infinity;
 const home=agent.home;
 for(let edgeId=0;edgeId<graph.edges.length;edgeId++){
  const e=graph.edges[edgeId];
  if(!(agent.body==='car'?e.car:e.walk))continue;
  const a=graph.nodes[e.from],b=graph.nodes[e.to];
  const dx=b.x-a.x,dy=b.y-a.y,denom=dx*dx+dy*dy;
  const base=nearHome&&home?home:agent;
  // Fast bounding-box rejection before the more expensive projection. Q13: the box of the whole
  // segment (before, both ends had to be within 80 m: on a long OSM edge such as Via Roma, 511 m,
  // a pedestrian knocked or jumping aside in the middle found no lane and stayed in recovery).
  if(base.x<Math.min(a.x,b.x)-80||base.x>Math.max(a.x,b.x)+80||
     base.y<Math.min(a.y,b.y)-80||base.y>Math.max(a.y,b.y)+80)continue;
  const t=clamp(denom?((base.x-a.x)*dx+(base.y-a.y)*dy)/denom:0,.06,.94);
  const pose=position(graph,edgeId,t,agent.body,agent.side||1);
  if(nearHome&&home&&Math.hypot(pose.x-home.x,pose.y-home.y)>Math.min(28,home.radius*.4))continue;
  const distance=Math.hypot(pose.x-base.x,pose.y-base.y);
  if(index&&collidesWithTraffic(pose,agent.body,index,agent))continue;
  if(distance<bestD){best={...pose,edge:edgeId,t};bestD=distance;}
 }
 return best;
}
function outsideView(x,y,view,padding=16){
 return !!view&&(x<view[0]-padding||x>view[2]+padding||y<view[1]-padding||y>view[3]+padding);
}
export function restoreAgentRoutine(graph,agent,dt,world={},index=null){
 if(!agent.needsRoutineRecovery)return false;
 if(agent.residentRoutine)return restoreResidentRoutine(graph,agent,dt,world,index);
 const offscreen=outsideView(agent.x,agent.y,world.view);
 const home=agent.home;
 const far=home&&Math.hypot(agent.x-home.x,agent.y-home.y)>home.radius*.85;
 if(offscreen&&far){
  const landing=routinePosition(graph,agent,true,index);
  if(landing&&outsideView(landing.x,landing.y,world.view,6)){
   Object.assign(agent,landing,{corner:null,wait:.3,stalled:0,braking:false,
    needsRoutineRecovery:false,prevX:landing.x,prevY:landing.y,prevA:landing.a});
   return true;
  }
 }
 // Prefer local rejoin, including pedestrian sidewalk offset.
 const pose=routinePosition(graph,agent,far&&offscreen,index);
 if(!pose)return true;
 const dx=pose.x-agent.x,dy=pose.y-agent.y,len=Math.hypot(dx,dy);
 if(len<1.2){
  Object.assign(agent,pose,{corner:null,wait:.15,stalled:0,braking:false,
   needsRoutineRecovery:false});
  return true;
 }
 const distance=Math.min(len,(agent.body==='car'?5.5:3.8)*Math.min(dt,.1));
 const nx=agent.x+dx/len*distance,ny=agent.y+dy/len*distance;
 // BF01: moves that take it out of a body it already overlaps are allowed (before, every step
 // still touched it and the NPC stayed stuck in plain view).
 // A car slides back keeping the direction of its lane (turning sideways next to another car
 // would sink a corner into it); a pedestrian simply walks there.
 const heading=agent.body==='car'?pose.a:Math.atan2(dy,dx);
 if((!world.validRecovery||world.validRecovery(nx,ny,agent))&&
    (!index||!trafficMoveBlocked(agent,{x:nx,y:ny,a:heading,
     vehicleType:agent.vehicleType,model:agent.model},agent.body,index,agent))){
  agent.x=nx;agent.y=ny;agent.a=heading;
 }
 agent.recoverySeconds=(agent.recoverySeconds||0)+dt;
 // If a building blocks a clear return route, defer the final reset until
 // hidden. Do not walk an NPC through an OSM building to reach its path.
 if(offscreen&&agent.recoverySeconds>3){
  const landing=routinePosition(graph,agent,true,index);
  if(landing&&outsideView(landing.x,landing.y,world.view,6)){
   Object.assign(agent,landing,{corner:null,wait:.3,stalled:0,braking:false,
    needsRoutineRecovery:false,prevX:landing.x,prevY:landing.y,prevA:landing.a,
    recoverySeconds:0});
  }
 }
 return true;
}
// BF03: the cars whose "blocked by" links close a ring (two at a crossing, up to four around a
// junction) wait for each other for ever. The one with the highest seed backs up; if it has no room
// behind it, the next one tries.
export function yieldsInGridlock(agent){
 const ring=[agent];
 for(let other=agent.blockedBy;other!==agent;other=other.blockedBy){
  if(!other||other.body!=='car'||ring.length>=4)return false;
  ring.push(other);
 }
 let pool=ring.filter(car=>!car.cannotYield);
 if(!pool.length){for(const car of ring)car.cannotYield=false;pool=ring;}
 return pool.includes(agent)&&pool.every(car=>car===agent||(agent.seed|0)>(car.seed|0));
}
/* BF09: border gates. A car of the moving traffic that reaches a gate on its way out drives on
 * into the dark beyond the cut and fades away; the same vehicle object then comes back as another
 * car from a free entry gate (out of the dark, so also in view: no pop-in in the middle of a road).
 * While beyond the border, t runs past the end of its edge (t>1 going out, t<0 coming in): the
 * lane position stays continuous and the cars behind keep their distance. */
const usesGates=agent=>agent.body==='car'&&!agent.path&&!agent.commuter&&!agent.stationary&&
 !agent.residentRoutine&&agent.gates!==false;
function gateLimbo(agent,gate=null){
 Object.assign(agent,{gateMode:{kind:'wait',gate,d:0,retry:.4},gateFade:0,gateLimbo:true,
  x:-6000-(agent.seed%997)*12,y:-6000,braking:true,blockedBy:null,backoff:0,stalled:0,v:0});
}
function rehomeAtGate(graph,agent,gate){
 const node=graph.nodes[gate.node],radius=agent.home?.radius||250,c=graph.borderCenter;
 // A new driver lives some way inside the town, not on the border line.
 const k=c?Math.min(1,Math.min(radius*.6,200)/(Math.hypot(c.x-node.x,c.y-node.y)||1)):0;
 const home={x:node.x+(c?(c.x-node.x)*k:0),y:node.y+(c?(c.y-node.y)*k:0),edge:gate.entry,side:agent.side||1,radius};
 const options=graph.throughStarts?.length?graph.throughStarts:graph.trafficStarts;
 home.returnEdges=options.filter(id=>{
  const e=graph.edges[id],a=graph.nodes[e.from],b=graph.nodes[e.to];
  return Math.min(Math.hypot(a.x-home.x,a.y-home.y),Math.hypot(b.x-home.x,b.y-home.y))<=radius*.55;
 });
 if(!home.returnEdges.includes(gate.entry))home.returnEdges.unshift(gate.entry);
 agent.home=home;
}
function enterFromGate(graph,agent,index,skip=null){
 const entries=graph.entryGates||(graph.entryGates=(graph.gates||[]).filter(g=>g.entry!==null&&!g.blocked&&graph.liveCar?.[g.entry]));
 if(!entries.length)return false;
 for(let attempt=0;attempt<6;attempt++){
  const g=entries[hash(agent.seed*31+attempt*977+(agent.gateTrips||0)*131)%entries.length];
  if(g.index===skip&&entries.length>1)continue;
  const e=graph.edges[g.entry],t=-GATE_RULES.travel/e.len;
  const start={...position(graph,g.entry,t,'car'),vehicleType:agent.vehicleType,model:agent.model};
  const lane=position(graph,g.entry,0,'car');
  // Nobody in the mouth and on the first metres of the lane: one car at a time comes in.
  if(index&&(collidesWithTraffic(start,'car',index,agent)||[...nearbyColliders(index,lane.x,lane.y,14)].some(other=>
    other!==agent&&!other.gateLimbo&&Math.hypot(other.x-lane.x,other.y-lane.y)<(other.body==='walk'?4:10))))continue;
  Object.assign(agent,start,{edge:g.entry,t,gateMode:{kind:'in',gate:g.index,d:GATE_RULES.travel},gateFade:0,
   gateLimbo:false,wait:0,stalled:0,braking:false,blockedBy:null,backoff:0,needsRoutineRecovery:false,
   prevX:start.x,prevY:start.y,prevA:start.a,seed:agent.seed+attempt+1,respawnFails:0,v:0});
  rehomeAtGate(graph,agent,g);
  return true;
 }
 return false;
}
export function stepGate(graph,agent,dt,index){
 const m=agent.gateMode,elapsed=Math.min(dt,.1);
 if(m.kind==='wait'){
  m.retry-=elapsed;if(m.retry>0||agent.retire)return;
  if(!enterFromGate(graph,agent,index,m.gate))m.retry=.5;
  return;
 }
 const g=graph.gates[m.gate],edgeId=m.kind==='out'?g.exit:g.entry,e=graph.edges[edgeId];
 const speed=Math.max(3,npcCruise(handlingProfile(agent),agent.speed));
 const d=Math.max(0,m.kind==='out'?m.d+speed*elapsed:m.d-speed*elapsed);
 const t=m.kind==='out'?1+d/e.len:-d/e.len;
 const pose={...position(graph,edgeId,t,'car'),vehicleType:agent.vehicleType,model:agent.model};
 const blocker=index?trafficMoveBlocker(agent,pose,'car',index,agent):null;
 if(blocker){
  agent.braking=true;agent.v=0;agent.blockedBy=blocker;m.blocked=(m.blocked||0)+elapsed;
  // Kept out for long (a queue, the player standing at the border): try another gate.
  if(m.kind==='in'&&m.blocked>6&&m.d>GATE_RULES.fade*.6)gateLimbo(agent,m.gate);
  return;
 }
 m.blocked=0;m.d=d;
 Object.assign(agent,{x:pose.x,y:pose.y,a:pose.a,edge:edgeId,t,braking:false,blockedBy:null,v:speed});
 agent.gateFade=clamp(1-d/GATE_RULES.fade,0,1);
 if(m.kind==='out'&&d>=GATE_RULES.travel){
  agent.gateTrips=(agent.gateTrips||0)+1;agent.gateExits=(agent.gateExits||0)+1;
  const gate=m.gate;gateLimbo(agent,gate);
  if(agent.retire){agent.gone=true;return;}
  enterFromGate(graph,agent,index,gate);
  return;
 }
 if(m.kind==='in'&&d<=0){
  Object.assign(agent,position(graph,g.entry,0,'car'),{edge:g.entry,t:0});
  agent.gateMode=null;agent.gateFade=1;agent.gateEntries=(agent.gateEntries||0)+1;
 }
}
// A new vehicle for balanceTraffic: it waits beyond the border and comes in from a free gate.
export function createGateVehicle(graph,seed,{vehicleType='car',model=null}={}){
 const role=['through','local','courier'][hash(seed*31)%3];
 const first=(graph.gates||[]).find(g=>g.entry!==null);
 const agent={x:0,y:0,a:0,edge:first?first.entry:0,t:0,vehicleType,model,body:'car',
  speed:(vehicleType==='motorcycle'?9:7)+rand(seed*13)*7,kind:seed%7,seed,wait:0,side:seed%2?1:-1,
  routine:role,segments:0,home:{x:0,y:0,radius:role==='local'?185:role==='courier'?250:360,returnEdges:[]}};
 gateLimbo(agent);agent.gateMode.retry=0;
 return agent;
}
/* BF09: keeps the moving traffic at `target` vehicles through the border gates (e.g. rush hours,
 * Q13). Missing vehicles come in from a gate (out of the dark); extra ones are marked and leave at
 * the next gate they reach, or at once when they are out of sight. `make()` returns a new vehicle
 * (createGateVehicle) or null. Returns the vehicles added and removed in this call. */
export function balanceTraffic(graph,traffic,target,world={},make=null,{maxAdd=2}={}){
 let added=0,removed=0;
 const view=world.view;
 for(let i=traffic.length-1;i>=0;i--){
  const v=traffic[i];
  if(v.gone||v.retire&&(v.gateLimbo||!v.gateMode&&view&&outsideView(v.x,v.y,view,15))){traffic.splice(i,1);removed++;}
 }
 if(!Number.isFinite(target))return {added,removed};
 let active=traffic.reduce((n,v)=>n+(v.retire?0:1),0);
 for(let i=traffic.length-1;i>=0&&active>target;i--)
  if(!traffic[i].retire&&usesGates(traffic[i])){traffic[i].retire=true;active--;}
 for(const v of traffic){if(active>=target)break;if(v.retire){v.retire=false;active++;}}
 while(make&&active<target&&added<maxAdd&&graph.gates?.length){
  const v=make();if(!v)break;
  traffic.push(v);active++;added++;
 }
 return {added,removed};
}
export function stepAgents(graph,agents,dt,player=null,world={}){
 const playerBody=player&&Number.isFinite(player.x)&&Number.isFinite(player.y)?
  {x:player.x,y:player.y,a:player.a||0,body:player.car>=0?'car':'walk',vehicleType:player.vehicleType||'car',isPlayer:true}:null;
 const index=makeCollisionIndex([...agents,...(world.parked||[]),...(world.traffic||[]),...(world.people||[]),playerBody]);
 // BF07: the next junction of every car, the cars approaching each junction, and the clock of the
 // (simulated) traffic lights: game clock when given, otherwise the simulated time.
 const junctions=graph.intersections;
 let jctx=null;
 if(junctions){
  if(Number.isFinite(world.npcClockMinutes))junctions.clockSeconds=clockSecondsFromMinutes(world.npcClockMinutes);
  else if(agents.some(a=>a.body==='car'))junctions.clockSeconds+=dt;
  if(agents.some(a=>a.body==='car')){
   jctx={approaching:new Map(),traffic:new Set(),index,player:playerBody,signalSeconds:junctions.clockSeconds,
    time:(junctions.time=(junctions.time||0)+dt)};
   for(const agent of agents){
    if(agent.body!=='car'||agent.commuter||agent.stationary||agent.serviceHold){continue;}
    jctx.traffic.add(agent);
    // Outside the map (varchi di confine, t oltre 0..1) there are no junctions to negotiate.
    agent.jx=agent.impactTime>0||agent.needsRoutineRecovery||agent.gateMode||!(agent.t>=0&&agent.t<=1)?null:nextJunction(graph,agent,70);
    if(!agent.jx){agent.turnSignal=null;continue;}
    let list=jctx.approaching.get(agent.jx.J);if(!list)jctx.approaching.set(agent.jx.J,list=[]);
    list.push(agent);
   }
   for(const J of junctions.list)if(J.reserved.size)pruneReservations(J);
  }
 }
 for(const agent of agents){
  const x=agent.x,y=agent.y;
  // BF09: beyond the border (leaving, coming in, or waiting for a free gate).
  if(agent.gateMode){
   if(agent.impactTime>0||agent.needsRoutineRecovery){agent.gateMode=null;agent.gateFade=1;agent.gateLimbo=false;}
   else{stepGate(graph,agent,dt,index);if(agent.x!==x||agent.y!==y)moveInCollisionIndex(index,agent,x,y);continue;}
  }
  if(agent.impactTime>0){agent.braking=true;continue;}
  // Q20: a service vehicle at work (courier stop, refuse collection, tow, bus stop) or a passer-by waiting at
  // a bus stop is moved by service-routines.mjs, a little at a time.
  if(agent.serviceHold){agent.braking=true;agent.stalled=0;agent.turnSignal=null;continue;}
  if(agent.body==='car'&&unstickVehicle(agent,index,world,dt)){
   agent.stalled=0;if(agent.x!==x||agent.y!==y)moveInCollisionIndex(index,agent,x,y);continue;
  }
  // Q13: a pedestrian jumping out of a vehicle's way, crossing mid-block or turning to look at an
  // oncoming vehicle is moved by npc-reactions.mjs; at a kerb it may wait for a gap in the traffic.
  if(agent.dodge>0||agent.crossing||agent.lookAt){agent.stalled=0;continue;}
  if(agent.body==='walk'&&world.kerbWait&&world.kerbWait(agent)){agent.stalled=0;continue;}
  // Vendors and junction-side washers hold an actual foot position, but after
  // nonlethal impacts they step back towards it instead of snapping on screen.
  if(agent.stationary){
   // BF08: a washer at work is moved by window-washers.mjs; back on the kerb it is a post again.
   if(agent.scripted)continue;
   const post=agent.post||agent.home;
   if(post){
    const dx=post.x-agent.x,dy=post.y-agent.y,d=Math.hypot(dx,dy);
    if(d>.12){
     const step=Math.min(d,dt*1.15),next={x:agent.x+dx*step/d,y:agent.y+dy*step/d,
      a:Math.atan2(dy,dx)};
     if((!world.validRecovery||world.validRecovery(next.x,next.y))&&
       !trafficMoveBlocked(agent,next,'walk',index,agent)){
      Object.assign(agent,next,{braking:false});
      moveInCollisionIndex(index,agent,x,y);
     }else agent.braking=true;
    }else{
     // BF04: back at the post the worker faces its counter again (e.g. the fryer).
     agent.braking=true;if(Number.isFinite(post.a))agent.a=post.a;
    }
   }
   continue;
  }
  // Q12: commuters (walk ↔ scooter) are moved and recovered by npc-commute.mjs, not by the wanderer.
  if(agent.commuter)continue;
  // Q11: chatting with an acquaintance; npc-social.mjs turns them face to face and lets go.
  if(agent.social?.hold){agent.braking=true;agent.stalled=0;continue;}
  if(restoreAgentRoutine(graph,agent,dt,world,index)){
   if(agent.x!==x||agent.y!==y)moveInCollisionIndex(index,agent,x,y);
   continue;
  }
  agent.jLimit=Infinity;agent.jHold=null;
  if(jctx&&agent.jx&&!(agent.backoff>0)&&!(agent.wait>0)){
   const jx=agent.jx,shape=vehicleShape(agent);
   // Where the whole car would stand once out of the junction (for "do not block the box").
   jx.landing=jx.dist-shape.halfLength-jx.A.stop<25?nextPose(graph,agent,jx.dist+jx.J.r+shape.halfLength+1):null;
   const decision=junctionDecision(graph,agent,jx,jctx);
   agent.jLimit=decision.limit;agent.jHold=decision.reason;
  }
  // Q22: strisce senza semaforo: precedenza al pedone che aspetta al cordolo (junctions.mjs).
  if(agent.body==='car'&&world.crossings?.size&&!(agent.backoff>0)&&!(agent.wait>0)){
   const give=crosswalkYield(agent,world.crossings,dt);
   agent.giveWayTo=give?give.ped:null;
   if(give&&give.limit<agent.jLimit){agent.jLimit=give.limit;agent.jHold=agent.jHold||'strisce';}
  }else agent.giveWayTo=null;
  stepAgent(graph,agent,dt,agents,player,index,world.npcClockMinutes,world.validRecovery);
  const moved=Math.hypot(agent.x-x,agent.y-y)>=.02;
  if(agent.body==='car'){
   agent.jWait=agent.jHold&&!moved?(agent.jWait||0)+dt:0;
   // Waiting at a red light (or queued behind a car that is) is not a deadlock: no recovery.
   const leader=agent.blockedBy||agent.follows;
   agent.redQueue=!moved&&(agent.jHold==='rosso'||agent.jHold==='giallo'||!!(leader&&(leader.jHold==='rosso'||leader.redQueue)));
  }
  agent.stalled=!moved&&!agent.redQueue&&!agent.signalWait?(agent.stalled||0)+dt:0;
  if(agent.body==='car'){
   // BF01: two cars blocking each other (typically across a junction) for over 2,5 s: the one with
   // the higher seed yields and backs up a couple of metres; the other one can then pass.
   // BF03: the same for three or four cars blocking one another in a ring around a junction.
   if(agent.blockedBy&&agent.stalled>2.5&&!(agent.backoff>0)&&agent.edge!=null&&yieldsInGridlock(agent))agent.backoff=2.5;
   // Retire a genuine deadlock only when both the old and replacement car
   // are outside the camera. The player never sees a vehicle teleport.
   const view=world.view;
   if(agent.stalled>8&&view&&
      (x<view[0]-15||x>view[2]+15||y<view[1]-15||y>view[3]+15)){
    const options=agent.home?.returnEdges?.length&&(agent.respawnFails||0)<2?agent.home.returnEdges:
     (graph.throughStarts?.length?graph.throughStarts:graph.trafficStarts);
    for(let attempt=0;attempt<32;attempt++){
     const edgeId=options[hash(agent.seed+attempt*3253)%options.length];
     if(isBusModel(agent.model)&&!BUS_ROADS.has(graph.edges[edgeId]?.roadType))continue;
     const t=.15+rand(agent.seed+attempt*1459)*.7;
     const at={...position(graph,edgeId,t,'car'),vehicleType:agent.vehicleType,model:agent.model};
     if(agent.home&&(agent.respawnFails||0)<2&&Math.hypot(at.x-agent.home.x,at.y-agent.home.y)>agent.home.radius*.65)continue;
     if(at.x>=view[0]-15&&at.x<=view[2]+15&&at.y>=view[1]-15&&at.y<=view[3]+15)continue;
     if(collidesWithTraffic(at,'car',index,agent)||[...nearbyColliders(index,at.x,at.y,10)].some(other=>
       other!==agent&&(other.body||'car')==='car'&&Math.hypot(at.x-other.x,at.y-other.y)<vs(9)))continue;
     Object.assign(agent,at,{edge:edgeId,t,seed:agent.seed+attempt+1,wait:0,stalled:0,
      prevX:at.x,prevY:at.y,prevA:at.a,braking:false,respawnFails:0,blockedBy:null,backoff:0});
     break;
    }
    // BF01: after two failed rounds (e.g. a one-way dead end far from any free lane at home) the
    // home-radius limit is relaxed, so the car does not stay parked there forever.
    if(agent.stalled>8){agent.stalled=6;agent.respawnFails=(agent.respawnFails||0)+1;}
   }
  }else if(!agent.residentRoutine&&agent.stalled>12&&world.view&&
   (x<world.view[0]-15||x>world.view[2]+15||y<world.view[1]-15||y>world.view[3]+15)){
   // Unconnected OSM sidewalk ends cannot hold a walker forever. Re-enter
   // on another pavement only when the whole move is outside the camera.
   for(let attempt=0;attempt<24;attempt++){
    const options=agent.home?.returnEdges?.length?agent.home.returnEdges:graph.walkStarts;
    const edgeId=options[hash(agent.seed+attempt*3253)%options.length];
    const t=.2+rand(agent.seed+attempt*1459)*.6;
    const at=position(graph,edgeId,t,'walk',agent.side);
    if(agent.home&&Math.hypot(at.x-agent.home.x,at.y-agent.home.y)>agent.home.radius*.65)continue;
    if(at.x>=world.view[0]-15&&at.x<=world.view[2]+15&&at.y>=world.view[1]-15&&at.y<=world.view[3]+15)continue;
    if(collidesWithTraffic(at,'walk',index,agent))continue;
    if([...nearbyColliders(index,at.x,at.y,2)].some(other=>
      other!==agent&&other.body==='walk'&&Math.hypot(at.x-other.x,at.y-other.y)<ps(1.5)))continue;
    Object.assign(agent,at,{edge:edgeId,t,seed:agent.seed+attempt+1,wait:0,stalled:0,
     corner:null,prevX:at.x,prevY:at.y,prevA:at.a,braking:false});
    break;
   }
   if(agent.stalled>12)agent.stalled=10;
  }
  if(agent.x!==x||agent.y!==y)moveInCollisionIndex(index,agent,x,y);
 }
}
