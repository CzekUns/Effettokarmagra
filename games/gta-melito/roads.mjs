import {visualRoadWidth,roadTrafficLaneOffset} from './road-widths.mjs?v=043';
import {makeCollisionIndex,addToCollisionIndex,moveInCollisionIndex,nearbyColliders,collidesWithTraffic,trafficMoveBlocked} from './traffic-collision.mjs?v=100';
/* GTA Melito — real OSM road topology (no invented rectangular street grid).
 * OSM ways share survey nodes; quantized coordinates preserve intersections.
 * Simulates moving traffic through intersections with legal one-way exits. */
export const DRIVABLE=new Set(['motorway','trunk','primary','secondary','tertiary','unclassified','residential','living_street','service','track']);
export const WALKABLE=new Set(['primary','secondary','tertiary','unclassified','residential','living_street','service','pedestrian','footway','path','steps','track']);
export const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export const hash=n=>{let x=(Number(n)||1)|0;x=Math.imul(x^x>>>16,2246822519);x=Math.imul(x^x>>>13,3266489917);return (x^x>>>16)>>>0;};
export const rand=n=>hash(n)/4294967295;
const key=(x,y)=>Math.round(x*10)+','+Math.round(y*10);
export function buildRoadGraph(roads){
 const nodes=[],lookup=new Map(),edges=[],trafficStarts=[],walkStarts=[];
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
   add(a,b,Math.atan2(by-ay,bx-ax),car);
   // Cars obey one-way. Pedestrians may walk against a car-only one-way.
   if(!road.o||walk)add(b,a,Math.atan2(ay-by,ax-bx),car&&!road.o);
  }
 }
 const junctions=nodes.filter(n=>n.out.filter(e=>edges[e].car).length>=3).length;
 return {nodes,edges,trafficStarts,walkStarts,junctions};
}
function position(graph,edgeIndex,t,body='walk',side=1){
 const e=graph.edges[edgeIndex],a=graph.nodes[e.from],b=graph.nodes[e.to];
 const along=Math.min(t,1-t)*e.len;
 const offset=body==='car'?roadTrafficLaneOffset(e.streetWidth):
  e.car?side*Math.min(1,along/4)*(e.streetWidth/2+1.7):0;
 return {x:a.x+(b.x-a.x)*t-Math.sin(e.angle)*offset,y:a.y+(b.y-a.y)*t+Math.cos(e.angle)*offset,a:e.angle};
}
export function createAgents(graph,count,seed=10,kind='car',avoid=[]){
 const options=kind==='car'?graph.trafficStarts:graph.walkStarts;
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
   const agent={...at,edge:edgeIndex,t,speed:kind==='car'?7+rand(i*13+seed)*7:.75+rand(i*11+seed)*.55,
    kind:kind==='car'?i%7:i%5,seed:seed+i*17,wait:0,body:kind,side};
   agents.push(agent);addToCollisionIndex(occupied,agent);break;
  }
 }
 return agents;
}
export function chooseTurn(graph,nodeId,oldEdge,agent,allowed){
 const node=graph.nodes[nodeId],incoming=graph.edges[oldEdge];
 const exits=node.out.filter(id=>allowed(graph.edges[id]));
 if(!exits.length)return null;
 let pool=exits.filter(id=>graph.edges[id].to!==incoming.from);
 if(!pool.length)pool=exits;
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
   // Recycle a terminal route on the next tick, away from the dead end.
   const pool=agent.body==='car'?graph.trafficStarts:graph.walkStarts;
   if(pool.length){route.edge=pool[hash(++route.seed)%pool.length];route.t=.05;}
   route.wait=.3;break;
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
  {x:player.x,y:player.y,a:player.a||0,body:player.car>=0?'car':'walk'}:null;
 const index=makeCollisionIndex([...agents,...(world.parked||[]),...(world.traffic||[]),...(world.people||[]),playerBody]);
 for(const agent of agents){
  const x=agent.x,y=agent.y;
  stepAgent(graph,agent,dt,agents,player,index);
  if(agent.x!==x||agent.y!==y)moveInCollisionIndex(index,agent,x,y);
 }
}
