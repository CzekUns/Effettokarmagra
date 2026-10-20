import {visualRoadWidth,roadTrafficLaneOffset} from './road-widths.mjs?v=043';
import {stepResidentRoutine,restoreResidentRoutine} from './resident-routines.mjs?v=006';
import {makeCollisionIndex,addToCollisionIndex,moveInCollisionIndex,nearbyColliders,collidesWithTraffic,trafficMoveBlocked,trafficMoveBlocker,vehicleSeparation,vehiclesOverlap,vehicleHitsPedestrian,vehicleShape} from './traffic-collision.mjs?v=128';
import {handlingProfile,npcCruise,npcSpeedStep} from './vehicle-handling.mjs?v=002';
import {buildJunctions,chooseSignals,junctionDecision,pruneReservations,pedestrianMayCross,clockSecondsFromMinutes} from './junctions.mjs?v=001';
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
export function buildRoadGraph(roads){
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
 const liveCar=liveCarEdges(nodes,edges);
 const throughStarts=trafficStarts.filter(id=>liveCar[id]&&hasThroughExit({nodes,edges,liveCar},id));
 const graph={nodes,edges,trafficStarts,throughStarts,walkStarts,junctions,liveCar};
 // BF07: incroci con linee d'arresto e precedenze; semafori SIMULATI sugli incroci principali.
 graph.intersections=buildJunctions(graph);
 graph.signals=chooseSignals(graph,graph.intersections);
 return graph;
}
// BF03: car edges from which traffic can keep driving for ever (a U-turn at a two-way dead end
// counts). An edge whose every route ends at a one-way terminal is a trap: in Melito a chain of
// one-way segments can lead there, so no NPC is spawned on it or turns into it.
function liveCarEdges(nodes,edges){
 const incoming=nodes.map(()=>[]),left=new Int32Array(edges.length),live=new Uint8Array(edges.length),dead=[];
 edges.forEach((e,id)=>{if(!e.car)return;incoming[e.to].push(id);live[id]=1;
  left[id]=nodes[e.to].out.filter(next=>edges[next].car).length;if(!left[id])dead.push(id);});
 while(dead.length){
  const id=dead.pop();live[id]=0;
  for(const before of incoming[edges[id].from])if(live[before]&&--left[before]===0)dead.push(before);
 }
 return live;
}
function position(graph,edgeIndex,t,body='walk',side=1){
 const e=graph.edges[edgeIndex],a=graph.nodes[e.from],b=graph.nodes[e.to];
 const offset=body==='car'?roadTrafficLaneOffset(e.streetWidth):
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
   if(collidesWithTraffic(at,kind,occupied))continue;
   if(kind==='walk'&&[...nearbyColliders(occupied,at.x,at.y,2)].some(other=>
    other.body==='walk'&&Math.hypot(at.x-other.x,at.y-other.y)<1.5))continue;
   if(kind==='car'&&[...nearbyColliders(occupied,at.x,at.y,10)].some(other=>
    (other.body||'car')==='car'&&Math.hypot(at.x-other.x,at.y-other.y)<9))continue;
   if(kind==='car'&&!carSpawnClear(graph,edgeIndex,t,at,occupied,junctionGap,settings))continue;
   const role=kind==='walk'?['commuter','errand','stroller'][hash(seed+i*31)%3]:
    ['through','local','courier'][hash(seed+i*31)%3];
   const agent={...at,edge:edgeIndex,t,speed:kind==='car'?(vehicleType==='motorcycle'?9:7)+rand(i*13+seed)*7:
    (role==='stroller'?.68:role==='commuter'?1.08:.85)+rand(i*11+seed)*.35,
    kind:i%7,seed:seed+i*17,wait:0,body:kind,side,routine:role,segments:0,
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
 const edge=graph.edges[id];
 // BF03: an exit into a trap does not count, or a car would drive up to it only to turn back.
 return graph.nodes[edge.to].out.some(next=>graph.edges[next].car&&graph.edges[next].to!==edge.from&&
  (!graph.liveCar||graph.liveCar[next]));
}
export function chooseTurn(graph,nodeId,oldEdge,agent,allowed){
 const node=graph.nodes[nodeId],incoming=graph.edges[oldEdge];
 let exits=node.out.filter(id=>allowed(graph.edges[id],id));
 if(!exits.length)return null;
 // BF03: a car never turns into a street that only leads to a one-way terminal, when it has a choice.
 if(agent.body==='car'&&graph.liveCar){const live=exits.filter(id=>graph.liveCar[id]);if(live.length)exits=live;}
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
 if(path.at===path.points.length){agent.edge=path.edge;agent.t=0;agent.side=path.side;
  agent.seed=path.seed;agent.a=path.angle;agent.corner=null;
  agent.segments=(agent.segments||0)+1;
  if(agent.routine==='errand'&&agent.segments%5===0)agent.wait=1.5+rand(agent.seed)*2.5;
  if(agent.routine==='stroller'&&agent.segments%4===0)agent.wait=.8+rand(agent.seed)*1.7;
 }
 agent.braking=false;
}
function nextPose(graph,agent,distance){
 const route={edge:agent.edge,t:agent.t,seed:agent.seed,side:agent.side||1,body:agent.body,routine:agent.routine,home:agent.home,path:agent.path};
 let hops=0;
 while(distance>.00001&&hops++<8){
  const edge=graph.edges[route.edge];if(!edge)break;
  const remaining=(1-route.t)*edge.len;
  if(distance<remaining){route.t+=distance/edge.len;break;}
  distance-=remaining;
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
 const route={edge:agent.edge,t:agent.t,seed:agent.seed,side:agent.side||1,body:agent.body,routine:agent.routine,home:agent.home,path:agent.path};
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
 return {plans,route:{seed:agent.seed,body:'walk',routine:agent.routine,home:agent.home,path:agent.path}};
}
export {position as lanePosition,sidewalkTurn,nextPose as previewNextPose};
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
   const chosen=chooseTurn(graph,edge.to,agent.edge,route,(_,id)=>plans.has(id));
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
  for(const other of near){
   if(other===agent||other.body!=='car'||other.edge!==agent.edge)continue;
   const ahead=(other.t-agent.t)*edge.len;
   if(ahead>0&&ahead<12){const v=cruise*clamp((ahead-5)/7,0,1);if(v<speed){speed=v;agent.follows=other;}}
  }
  // BF07: stop line of the next junction (red light, right of way, junction or exit not free).
  if(Number.isFinite(agent.jLimit)){limit=Math.max(0,agent.jLimit);speed=Math.min(speed,Math.sqrt(2*4.5*limit));}
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
  // Fast bounding-box rejection before the more expensive projection.
  if(Math.abs(a.x-base.x)>80&&Math.abs(b.x-base.x)>80||
     Math.abs(a.y-base.y)>80&&Math.abs(b.y-base.y)>80)continue;
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
export function stepAgents(graph,agents,dt,player=null,world={}){
 const playerBody=player&&Number.isFinite(player.x)&&Number.isFinite(player.y)?
  {x:player.x,y:player.y,a:player.a||0,body:player.car>=0?'car':'walk',vehicleType:player.vehicleType||'car'}:null;
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
    if(agent.body!=='car'||agent.commuter||agent.stationary){continue;}
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
  if(agent.impactTime>0){agent.braking=true;continue;}
  if(agent.body==='car'&&unstickVehicle(agent,index,world,dt)){
   agent.stalled=0;if(agent.x!==x||agent.y!==y)moveInCollisionIndex(index,agent,x,y);continue;
  }
  // Vendors and junction-side washers hold an actual foot position, but after
  // nonlethal impacts they step back towards it instead of snapping on screen.
  if(agent.stationary){
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
     const t=.15+rand(agent.seed+attempt*1459)*.7;
     const at={...position(graph,edgeId,t,'car'),vehicleType:agent.vehicleType,model:agent.model};
     if(agent.home&&(agent.respawnFails||0)<2&&Math.hypot(at.x-agent.home.x,at.y-agent.home.y)>agent.home.radius*.65)continue;
     if(at.x>=view[0]-15&&at.x<=view[2]+15&&at.y>=view[1]-15&&at.y<=view[3]+15)continue;
     if(collidesWithTraffic(at,'car',index,agent)||[...nearbyColliders(index,at.x,at.y,10)].some(other=>
       other!==agent&&(other.body||'car')==='car'&&Math.hypot(at.x-other.x,at.y-other.y)<9))continue;
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
      other!==agent&&other.body==='walk'&&Math.hypot(at.x-other.x,at.y-other.y)<1.5))continue;
    Object.assign(agent,at,{edge:edgeId,t,seed:agent.seed+attempt+1,wait:0,stalled:0,
     corner:null,prevX:at.x,prevY:at.y,prevA:at.a,braking:false});
    break;
   }
   if(agent.stalled>12)agent.stalled=10;
  }
  if(agent.x!==x||agent.y!==y)moveInCollisionIndex(index,agent,x,y);
 }
}
