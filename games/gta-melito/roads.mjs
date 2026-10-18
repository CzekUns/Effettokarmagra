import {visualRoadWidth,roadTrafficLaneOffset} from './road-widths.mjs?v=043';
import {makeCollisionIndex,addToCollisionIndex,moveInCollisionIndex,nearbyColliders,collidesWithTraffic,trafficMoveBlocked} from './traffic-collision.mjs?v=115';
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
 const throughStarts=trafficStarts.filter(id=>hasThroughExit({nodes,edges},id));
 return {nodes,edges,trafficStarts,throughStarts,walkStarts,junctions};
}
function position(graph,edgeIndex,t,body='walk',side=1){
 const e=graph.edges[edgeIndex],a=graph.nodes[e.from],b=graph.nodes[e.to];
 const offset=body==='car'?roadTrafficLaneOffset(e.streetWidth):
  e.car?side*(e.streetWidth/2+1.7):0;
 return {x:a.x+(b.x-a.x)*t-Math.sin(e.angle)*offset,y:a.y+(b.y-a.y)*t+Math.cos(e.angle)*offset,a:e.angle};
}
export function createAgents(graph,count,seed=10,kind='car',avoid=[]){
 // An NPC should not materialize on a one-way terminal or a spur whose only
 // legal exit is an immediate U-turn. Keep such links in the road graph for
 // the player and for unavoidable routes, but prefer through streets for AI.
 const through=kind==='car'?(graph.throughStarts||graph.trafficStarts.filter(id=>hasThroughExit(graph,id))):[];
 const options=kind==='car'?(through.length?through:graph.trafficStarts):graph.walkStarts;
 const agents=[],occupied=makeCollisionIndex(avoid);
 if(!options.length)return agents;
 for(let i=0;i<count;i++){
  for(let attempt=0;attempt<24;attempt++){
   const edgeIndex=options[hash(seed+i*65537+attempt*7349)%options.length];
   const edge=graph.edges[edgeIndex];
   if(kind==='car'&&edge.roadType==='service'&&i%3!==0&&attempt<12)continue;
   const t=.05+rand(seed+i*7+13+attempt*181)*.85,side=i%2?1:-1;
   const at=position(graph,edgeIndex,t,kind,side);
   if(collidesWithTraffic(at,kind,occupied))continue;
   if(kind==='car'&&[...nearbyColliders(occupied,at.x,at.y,10)].some(other=>
    (other.body||'car')==='car'&&Math.hypot(at.x-other.x,at.y-other.y)<9))continue;
   const agent={...at,edge:edgeIndex,t,speed:kind==='car'?7+rand(i*13+seed)*7:.75+rand(i*11+seed)*.55,
    kind:i%7,seed:seed+i*17,wait:0,body:kind,side};
   agents.push(agent);addToCollisionIndex(occupied,agent);break;
  }
 }
 return agents;
}
function hasThroughExit(graph,id){
 const edge=graph.edges[id];
 return graph.nodes[edge.to].out.some(next=>graph.edges[next].car&&graph.edges[next].to!==edge.from);
}
export function chooseTurn(graph,nodeId,oldEdge,agent,allowed){
 const node=graph.nodes[nodeId],incoming=graph.edges[oldEdge];
 const exits=node.out.filter(id=>allowed(graph.edges[id],id));
 if(!exits.length)return null;
 let pool=exits.filter(id=>graph.edges[id].to!==incoming.from);
 if(!pool.length)pool=exits;
 if(agent.body==='car'){
  const through=pool.filter(id=>hasThroughExit(graph,id));
  if(through.length)pool=through;
 }
 // Prefer continuing and plausible turns, vary destination by seeded tie breaker.
 const choice=pool.map(id=>{
  const edge=graph.edges[id],a=Math.abs(Math.atan2(Math.sin(edge.angle-incoming.angle),Math.cos(edge.angle-incoming.angle)));
  const isTurn=a>.35;
  const weight=a<.25?2.8:a<1.9?1.3:.35;
  return {id,weight:weight*(isTurn?1:1),road:edge.roadId};
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
  agent.seed=path.seed;agent.a=path.angle;agent.corner=null;}
 agent.braking=false;
}
function nextPose(graph,agent,distance){
 const route={edge:agent.edge,t:agent.t,seed:agent.seed,side:agent.side||1};
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
 return {...route,...position(graph,route.edge,route.t,agent.body,route.side)};
}
export function stepAgent(graph,agent,dt,others=[],player=null,index=null){
 if(!Number.isFinite(dt)||dt<=0)return;
 const elapsed=Math.min(dt,.1);
 if(agent.wait>0){agent.wait=Math.max(0,agent.wait-elapsed);return;}
 const edge=graph.edges[agent.edge];if(!edge||!(agent.body==='car'?edge.car:edge.walk))return;
 let speed=agent.speed;
 if(agent.body==='walk'){
  if(agent.corner){stepSidewalkCorner(agent,speed*elapsed,index);return;}
  if(agent.t*edge.len+speed*elapsed>=edge.len){
   const plans=new Map();
   for(const id of graph.nodes[edge.to].out){
    if(!graph.edges[id].walk)continue;
    const plan=sidewalkTurn(graph,agent.edge,id,agent.side||1);
    if(plan)plans.set(id,plan);
   }
   const route={seed:agent.seed,body:'walk'};
   const chosen=chooseTurn(graph,edge.to,agent.edge,route,(_,id)=>plans.has(id));
   if(chosen!=null){
    const at=position(graph,agent.edge,1,'walk',agent.side);
    if(index&&trafficMoveBlocked(agent,at,'walk',index,agent)){agent.braking=true;return;}
    Object.assign(agent,at,{t:1,corner:{...plans.get(chosen),edge:chosen,angle:graph.edges[chosen].angle,seed:route.seed,at:0},braking:false});
    return;
   }
  }
 }
 if(agent.body==='car'){
  // Following distance is checked only for traffic on this nearby segment.
  const near=index?nearbyColliders(index,agent.x,agent.y,18):others;
  for(const other of near){
   if(other===agent||other.body!=='car'||other.edge!==agent.edge)continue;
   const ahead=(other.t-agent.t)*edge.len;
   if(ahead>0&&ahead<12)speed=Math.min(speed,agent.speed*clamp((ahead-5)/7,0,1));
  }
 }
 // Try reduced motion before stopping; this lets traffic queue naturally.
 for(const factor of [1,.5,.25]){
  const next=nextPose(graph,agent,speed*elapsed*factor);
  if(index&&trafficMoveBlocked(agent,next,agent.body,index,agent))continue;
  Object.assign(agent,next);agent.braking=false;return;
 }
 agent.braking=true;
}
export function stepAgents(graph,agents,dt,player=null,world={}){
 const playerBody=player&&Number.isFinite(player.x)&&Number.isFinite(player.y)?
  {x:player.x,y:player.y,a:player.a||0,body:player.car>=0?'car':'walk',vehicleType:player.vehicleType||'car'}:null;
 const index=makeCollisionIndex([...agents,...(world.parked||[]),...(world.traffic||[]),...(world.people||[]),playerBody]);
 for(const agent of agents){
  const x=agent.x,y=agent.y;
  stepAgent(graph,agent,dt,agents,player,index);
  if(agent.body==='car'){
   agent.stalled=Math.hypot(agent.x-x,agent.y-y)<.02?
    (agent.stalled||0)+dt:0;
   // Retire a genuine deadlock only when both the old and replacement car
   // are outside the camera. The player never sees a vehicle teleport.
   const view=world.view;
   if(agent.stalled>8&&view&&
      (x<view[0]-15||x>view[2]+15||y<view[1]-15||y>view[3]+15)){
    const options=graph.throughStarts?.length?graph.throughStarts:graph.trafficStarts;
    for(let attempt=0;attempt<32;attempt++){
     const edgeId=options[hash(agent.seed+attempt*3253)%options.length];
     const t=.15+rand(agent.seed+attempt*1459)*.7;
     const at=position(graph,edgeId,t,'car');
     if(at.x>=view[0]-15&&at.x<=view[2]+15&&at.y>=view[1]-15&&at.y<=view[3]+15)continue;
     if(collidesWithTraffic(at,'car',index,agent)||[...nearbyColliders(index,at.x,at.y,10)].some(other=>
       other!==agent&&(other.body||'car')==='car'&&Math.hypot(at.x-other.x,at.y-other.y)<9))continue;
     Object.assign(agent,at,{edge:edgeId,t,seed:agent.seed+attempt+1,wait:0,stalled:0,
      prevX:at.x,prevY:at.y,prevA:at.a,braking:false});
     break;
    }
    if(agent.stalled>8)agent.stalled=6;
   }
  }
  if(agent.x!==x||agent.y!==y)moveInCollisionIndex(index,agent,x,y);
 }
}
