import {visualRoadWidth,roadTrafficLaneOffset} from './road-widths.mjs?v=043';
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
function position(graph,edgeIndex,t,lane=false){
 const e=graph.edges[edgeIndex],a=graph.nodes[e.from],b=graph.nodes[e.to];
 const offset=lane?roadTrafficLaneOffset(e.streetWidth):0;
 return {x:a.x+(b.x-a.x)*t-Math.sin(e.angle)*offset,y:a.y+(b.y-a.y)*t+Math.cos(e.angle)*offset,a:e.angle};
}
export function createAgents(graph,count,seed=10,kind='car'){
 const options=kind==='car'?graph.trafficStarts:graph.walkStarts;
 const agents=[];
 if(!options.length)return agents;
 for(let i=0;i<count;i++){
  let edgeIndex=options[hash(seed+i*65537)%options.length];
  const e=graph.edges[edgeIndex];
  if(kind==='car'&&e.roadType==='service'&&i%3!==0){edgeIndex=options[hash(seed+i*2227+9)%options.length];}
  const t=.05+rand(seed+i*7+13)*.85,at=position(graph,edgeIndex,t,kind==='car');
  agents.push({...at,edge:edgeIndex,t,speed:kind==='car'?7+rand(i*13+seed)*7:.75+rand(i*11+seed)*.55,
   kind:kind==='car'?i%7:i%5,seed:seed+i*17,wait:0,body:kind});
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
export function stepAgent(graph,agent,dt,others=[],player=null){
 if(!Number.isFinite(dt)||dt<=0)return;
 let left=Math.min(dt,.1),hops=0;
 while(left>0.00001&&hops++<8){
  const edge=graph.edges[agent.edge];if(!edge)break;
  const target=agent.body==='car'?edge.car:edge.walk;
  if(!target){break;}
  let speed=agent.speed;
  if(agent.body==='car'){
   const current=position(graph,agent.edge,agent.t,true);
   if(player&&Math.hypot(player.x-current.x,player.y-current.y)<7)speed*=.18;
   for(const other of others){
    if(other===agent||other.body!=='car'||other.edge!==agent.edge)continue;
    const ahead=(other.t-agent.t)*edge.len;
    if(ahead>0&&ahead<12){speed*=clamp((ahead-4)/8,0,1);}
   }
  }
  if(agent.wait>0){agent.wait=Math.max(0,agent.wait-left);return;}
  const remaining=(1-agent.t)*edge.len;
  const distance=speed*left;
  if(distance<remaining){agent.t+=distance/edge.len;left=0;}
  else{
   left=(distance-remaining)/Math.max(.1,speed);
   const next=chooseTurn(graph,edge.to,agent.edge,agent,e=>agent.body==='car'?e.car:e.walk);
   if(next==null){
    // Terminal one-way has no legal exit: recycle a distant traffic agent.
    const pool=agent.body==='car'?graph.trafficStarts:graph.walkStarts;
    if(pool.length){agent.edge=pool[hash(++agent.seed)%pool.length];agent.t=.05;}
    agent.wait=.3;left=0;
   }else{agent.edge=next;agent.t=0;}
  }
 }
 const p=position(graph,agent.edge,agent.t,agent.body==='car');
 agent.x=p.x;agent.y=p.y;agent.a=p.a;
}
export function stepAgents(graph,agents,dt,player=null){
 for(const agent of agents)stepAgent(graph,agent,dt,agent.body==='car'?agents:[],player);
}
