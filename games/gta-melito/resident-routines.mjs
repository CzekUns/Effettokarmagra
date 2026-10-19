/* Q01: Small deterministic street-side cohort near Via Roma.
 * These stops are simulated; no real building, shop or civic number is claimed.
 * The route stays on one validated OSM pavement. No in-camera teleport or separate NPC duplicate.
 * Q03: with a door finder the resident lives behind a door (invented 'portone') and its
 * outing ends behind another one; it walks from the pavement to the threshold, vanishes
 * only there (agent.indoors: not drawn, not collidable), stays inside, and comes out of
 * the same door. Doors of named OSM shops are marked 'osm-poi', the others 'inventata'. */
import {makeCollisionIndex,addToCollisionIndex,nearbyColliders,collidesWithTraffic,trafficMoveBlocked} from './traffic-collision.mjs?v=126';
import {makeResidentAgenda,residentDepartureWindow} from './npc-agenda.mjs?v=001';
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const hash=n=>{let x=(Number(n)||1)|0;x=Math.imul(x^x>>>16,2246822519);x=Math.imul(x^x>>>13,3266489917);return (x^x>>>16)>>>0;};
const rand=n=>hash(n)/4294967295;
const DRIVABLE=new Set(['motorway','trunk','primary','secondary','tertiary','unclassified','residential','living_street','service','track']);
function pose(graph,edgeId,t,side){
 const e=graph.edges[edgeId],a=graph.nodes[e.from],b=graph.nodes[e.to];
 const offset=DRIVABLE.has(e.roadType)?side*(e.streetWidth/2+1.7):0;
 return {x:a.x+(b.x-a.x)*t-Math.sin(e.angle)*offset,
  y:a.y+(b.y-a.y)*t+Math.cos(e.angle)*offset,a:e.angle};
}
const towardsBuildings=(e,side)=>({x:-Math.sin(e.angle)*side,y:Math.cos(e.angle)*side});
// A door reachable straight from the pavement at about t (within a few metres).
function doorBeside(graph,edgeId,side,t,doorAt,maxShift=3){
 const e=graph.edges[edgeId];
 for(const shift of [0,1,-1,2,-2,3,-3]){
  if(Math.abs(shift)>maxShift)continue;
  const tt=t+shift/e.len;if(tt<.06||tt>.94)continue;
  const o=pose(graph,edgeId,tt,side),door=doorAt(o,towardsBuildings(e,side));
  if(!door)continue;
  return Object.assign(door,{edge:edgeId,side,t:tt,
   lateral:(door.x-o.x)*-Math.sin(e.angle)+(door.y-o.y)*Math.cos(e.angle)});
 }
 return null;
}
// The pavement position in front of an existing door (e.g. a named OSM shop).
export function attachDoorToPavement(graph,door,doorAt,maxReach=7){
 let best=null;
 for(const id of graph.walkStarts){
  const e=graph.edges[id],a=graph.nodes[e.from],b=graph.nodes[e.to];
  if(!(e.len>=21))continue;
  const along=((door.x-a.x)*(b.x-a.x)+(door.y-a.y)*(b.y-a.y))/(e.len*e.len);
  const across=Math.abs((door.x-a.x)*(b.y-a.y)-(door.y-a.y)*(b.x-a.x))/e.len;
  if(along<.05||along>.95||across>(e.streetWidth||0)/2+1.7+maxReach+.5)continue;
  for(const side of [1,-1]){
   const o=pose(graph,id,0,side),dx=b.x-a.x,dy=b.y-a.y;
   const t=((door.x-o.x)*dx+(door.y-o.y)*dy)/(e.len*e.len);
   if(t<.08||t>.92)continue;
   const q=pose(graph,id,t,side),n=towardsBuildings(e,side);
   const ahead=(door.x-q.x)*n.x+(door.y-q.y)*n.y,off=Math.hypot(door.x-q.x,door.y-q.y);
   if(ahead<-.2||off>maxReach)continue;
   if(!best||off<best.off)best={id,side,t,off};
  }
 }
 if(!best)return null;
 const found=doorBeside(graph,best.id,best.side,best.t,doorAt,1);
 if(!found||Math.hypot(found.x-door.x,found.y-door.y)>1.6)return null;
 return Object.assign(found,{source:door.source,label:door.label??found.label,kind:door.kind??found.kind});
}
// Door lookups are cached per pavement metre and capped, so a phone never spends
// more than a short, bounded time placing the cohort.
function doorFinder(graph,doorAt,budget=700){
 if(!doorAt)return null;
 const cache=new Map();let probes=0;
 return (edgeId,side,t)=>{
  const e=graph.edges[edgeId],m=Math.round(t*e.len);
  for(const shift of [0,1,-1,2,-2,3,-3]){
   const tt=(m+shift)/e.len;if(tt<.06||tt>.94)continue;
   const key=edgeId+':'+side+':'+(m+shift);
   if(!cache.has(key)){
    if(probes>=budget)return null;
    probes++;cache.set(key,doorBeside(graph,edgeId,side,tt,doorAt,0));
   }
   const door=cache.get(key);if(door)return door;
  }
  return null;
 };
}
function residentAgent(graph,plan,seed,i,kindIndex=i){
 const at=pose(graph,plan.edge,plan.homeT,plan.side),door=plan.homeDoor;
 if(door){plan.lateral=door.lateral;plan.lateralGoal=door.lateral;}
 const start=door?{x:door.x,y:door.y,a:Math.atan2(-door.ny,-door.nx)}:at;
 return {...start,edge:plan.edge,t:plan.homeT,speed:.85+rand(seed+i*19)*.34,
  kind:kindIndex%7,seed:seed+i*17,wait:1.1+rand(seed+i*17)*2.3,body:'walk',side:plan.side,
  routine:'resident',segments:0,residentRoutine:plan,braking:true,indoors:!!door,
  home:{x:at.x,y:at.y,edge:plan.edge,side:plan.side,radius:90,returnEdges:[plan.edge]}};
}
const pavementClear=(graph,edge,side,t0,t1,validWalk)=>{
 for(let k=0;k<=8;k++){const p=pose(graph,edge,t0+(t1-t0)*k/8,side);if(!validWalk(p.x,p.y))return false;}
 return true;
};
const spacedOut=(occupied,at)=>!collidesWithTraffic(at,'walk',occupied)&&
 ![...nearbyColliders(occupied,at.x,at.y,2)].some(other=>other.body==='walk'&&Math.hypot(at.x-other.x,at.y-other.y)<2.2);
export function createRoutineResidents(graph,count=10,seed=405,center={x:0,y:0},avoid=[],validWalk=()=>true,options={}){
 const near=[];
 for(const id of graph.walkStarts){
  const e=graph.edges[id],a=graph.nodes[e.from],b=graph.nodes[e.to];
  if(e.len<21||!Number.isFinite(e.len))continue;
  const dx=b.x-a.x,dy=b.y-a.y;
  const t=clamp(((center.x-a.x)*dx+(center.y-a.y)*dy)/(e.len*e.len),0,1);
  const distance=Math.hypot(a.x+dx*t-center.x,a.y+dy*t-center.y);
  if(distance>190)continue;
  near.push({id,t,distance,via:/\bvia roma\b/i.test(e.name||'')});
 }
 const preferred=near.filter(q=>q.via);
 const options2=(preferred.length?preferred:near).sort((a,b)=>a.distance-b.distance||a.id-b.id).slice(0,22);
 if(!options2.length)return [];
 const findDoor=doorFinder(graph,options.doorAt);
 const residents=[],occupied=makeCollisionIndex(avoid);
 for(let i=0;i<count;i++)for(let attempt=0;attempt<72;attempt++){
  const choice=options2[hash(seed+i*503+attempt*71)%options2.length],e=graph.edges[choice.id];
  const side=(i+attempt)%2?1:-1,spread=Math.min(.23,95/e.len);
  let homeT=clamp(choice.t+(rand(seed+i*313+attempt*59)-.5)*2*spread,.08,.92);
  const distanceT=Math.min(.68,Math.max(.12,42/e.len));
  const direction=(hash(seed+i*17+attempt*31)&1)?1:-1;
  let targetT=homeT+direction*distanceT>=.94||homeT+direction*distanceT<=.06?
   homeT-direction*distanceT:homeT+direction*distanceT;
  if(targetT<.06||targetT>.94||Math.abs(targetT-homeT)*e.len<12)continue;
  let homeDoor=null,targetDoor=null;
  // Q03: the first attempts insist on a real-looking door at both ends; only if
  // none fits, the resident keeps the Q01 street-side home and stop.
  if(findDoor&&attempt<48){
   homeDoor=findDoor(choice.id,side,homeT);
   targetDoor=homeDoor&&findDoor(choice.id,side,targetT);
   if(!homeDoor||!targetDoor)continue;
   homeT=homeDoor.t;targetT=targetDoor.t;
   if(Math.abs(targetT-homeT)*e.len<12)continue;
  }
  if(!pavementClear(graph,choice.id,side,homeT,targetT,validWalk))continue;
  const at=pose(graph,choice.id,homeT,side);
  if(!spacedOut(occupied,at))continue;
  const plan={edge:choice.id,side,homeT,targetT,phase:'AT_HOME',cycles:0,agenda:makeResidentAgenda(seed+i*17,i)};
  if(homeDoor){plan.homeDoor=homeDoor;plan.targetDoor=targetDoor;}
  residents.push(residentAgent(graph,plan,seed,i));
  addToCollisionIndex(occupied,{x:at.x,y:at.y,a:at.a,body:'walk'});break;
 }
 return residents;
}
/* Q03: a few residents whose outing ends inside a named OSM shop (door 'osm-poi').
 * Their home door is invented, on the same pavement, 26-66 m away. */
export function createDoorVisitors(graph,destinations,count=3,seed=811,avoid=[],validWalk=()=>true,doorAt=null){
 const findDoor=doorFinder(graph,doorAt,260);
 if(!findDoor)return [];
 const visitors=[],occupied=makeCollisionIndex(avoid);
 for(let i=0;i<destinations.length&&visitors.length<count;i++){
  const shop=destinations[i],e=graph.edges[shop?.edge];
  if(!e||!e.walk)continue;
  for(let attempt=0;attempt<10;attempt++){
   const direction=(hash(seed+i*29+attempt*7)&1)?1:-1,metres=26+rand(seed+i*41+attempt*13)*40;
   const homeDoor=findDoor(shop.edge,shop.side,shop.t+direction*metres/e.len);
   if(!homeDoor||Math.abs(homeDoor.t-shop.t)*e.len<12)continue;
   if(!pavementClear(graph,shop.edge,shop.side,homeDoor.t,shop.t,validWalk))continue;
   const at=pose(graph,shop.edge,homeDoor.t,shop.side);
   if(!spacedOut(occupied,at))continue;
   const n=visitors.length,plan={edge:shop.edge,side:shop.side,homeT:homeDoor.t,targetT:shop.t,phase:'AT_HOME',cycles:0,
    agenda:makeResidentAgenda(seed+n*17,n),homeDoor,targetDoor:shop,visitor:true};
   visitors.push(residentAgent(graph,plan,seed,n,n+3));
   addToCollisionIndex(occupied,{x:at.x,y:at.y,a:at.a,body:'walk'});break;
  }
 }
 return visitors;
}
const DOOR_OPEN_SECONDS=1.4;
const outwards=door=>Math.atan2(door.ny,door.nx);
// Leaves the building through its door; a vehicle parked on the threshold keeps the NPC inside.
function stepOutside(agent,plan,door,index){
 if(!agent.indoors)return true;
 if(!door){agent.indoors=false;return true;}
 const threshold={x:door.x,y:door.y,a:outwards(door)};
 if(index&&collidesWithTraffic(threshold,'walk',index,agent))return false;
 Object.assign(agent,threshold,{indoors:false,braking:false});
 door.open=DOOR_OPEN_SECONDS;plan.doorStep={mode:'EXIT',door};
 plan.lateral=door.lateral;plan.lateralGoal=door.lateral;plan.blocked=0;
 return true;
}
// Short straight walk between the pavement line and the threshold, at walking pace.
function stepDoorway(graph,agent,plan,elapsed,index,valid){
 const step=plan.doorStep,door=step.door,e=graph.edges[plan.edge];
 const goal=step.mode==='ENTER'?door.lateral:0,lat0=plan.lateral||0;
 const lat=lat0+clamp(goal-lat0,-agent.speed*elapsed,agent.speed*elapsed);
 const q=pose(graph,plan.edge,door.t,plan.side);
 const next={x:q.x-Math.sin(e.angle)*lat,y:q.y+Math.cos(e.angle)*lat,
  a:step.mode==='ENTER'?outwards(door)+Math.PI:outwards(door)};
 const blocked=(index&&trafficMoveBlocked(agent,next,'walk',index,agent))||
  (valid&&Math.abs(lat)>.001&&!valid(next.x,next.y,agent));
 if(blocked){
  agent.braking=true;plan.blocked=(plan.blocked||0)+elapsed;
  // A doorway kept blocked (e.g. a car left across it): the errand happens outside.
  if(step.mode==='ENTER'&&plan.blocked>8){plan.doorStep=null;plan.lateralGoal=lat0;plan.blocked=0;return 'GAVE_UP';}
  return 'WAIT';
 }
 plan.blocked=0;plan.lateral=lat;
 Object.assign(agent,next,{edge:plan.edge,t:door.t,braking:false});
 if(Math.abs(goal-lat)>.001)return 'MOVING';
 plan.lateral=goal;plan.lateralGoal=goal;plan.doorStep=null;
 if(step.mode==='EXIT')return 'OUT';
 agent.indoors=true;agent.braking=true;door.open=DOOR_OPEN_SECONDS;
 return 'INSIDE';
}
function arrive(agent,plan,indoors){
 agent.braking=true;
 if(plan.phase==='OUTBOUND'){
  plan.phase='ACTING';if(plan.agenda)plan.agenda.status='ACTING';
  // Inside a building the stay is longer: shopping or a visit, simulated off-screen.
  agent.wait=indoors?16+rand(agent.seed+plan.cycles*13)*22:2+rand(agent.seed+plan.cycles*11)*3.5;
 }else{
  plan.phase='AT_HOME';if(plan.agenda)plan.agenda.status='AT_HOME';plan.cycles++;
  agent.wait=1.4+rand(agent.seed+plan.cycles*19)*3;
 }
}
export function stepResidentRoutine(graph,agent,dt,index=null,clockMinutes=null,valid=null){
 const plan=agent.residentRoutine,e=graph.edges[plan.edge];
 if(!e||!e.walk)return;
 const elapsed=Math.min(Math.max(dt,0),.1);
 if(plan.doorStep){
  const result=stepDoorway(graph,agent,plan,elapsed,index,valid);
  if(result==='INSIDE'||result==='GAVE_UP')arrive(agent,plan,result==='INSIDE');
  return;
 }
 if(plan.phase==='AT_HOME'&&Number.isFinite(clockMinutes)){
  const run=residentDepartureWindow(plan.agenda,clockMinutes);
  agent.braking=true;
  if(run!==null&&run!==plan.agenda.lastRunId&&stepOutside(agent,plan,plan.homeDoor,index)){
   plan.agenda.lastRunId=run;plan.agenda.status='OUTBOUND';plan.phase='OUTBOUND';agent.wait=0;
  }
  return;
 }
 if(plan.phase==='AT_HOME'||plan.phase==='ACTING'){
  agent.braking=true;agent.wait=Math.max(0,(agent.wait||0)-elapsed);
  if(agent.wait<=0&&stepOutside(agent,plan,plan.phase==='AT_HOME'?plan.homeDoor:plan.targetDoor,index)){
   plan.phase=plan.phase==='AT_HOME'?'OUTBOUND':'RETURNING';if(plan.agenda)plan.agenda.status=plan.phase;
  }
  return;
 }
 const destination=plan.phase==='OUTBOUND'?plan.targetT:plan.homeT;
 const stride=agent.speed*elapsed;
 // Q02: un ostacolo fermo sul marciapiede (es. scooter parcheggiato) si aggira di lato,
 // a passo d'uomo: prima lo spostamento laterale, poi avanti, poi il rientro sulla linea.
 const lat0=plan.lateral||0,goal=plan.lateralGoal||0;
 const settled=Math.abs(goal-lat0)<.001,lat=settled?lat0:lat0+clamp(goal-lat0,-stride,stride);
 const delta=destination-agent.t,remaining=Math.abs(delta)*e.len;
 const advance=settled?Math.min(remaining,stride):0;
 const nextT=remaining<.00001?destination:agent.t+Math.sign(delta)*advance/e.len;
 const heading=delta<0?e.angle+Math.PI:e.angle;
 const at=(tt,l)=>{const q=pose(graph,plan.edge,clamp(tt,0,1),plan.side);return{x:q.x-Math.sin(e.angle)*l,y:q.y+Math.cos(e.angle)*l,a:heading};};
 const free=(q,l)=>(!index||!trafficMoveBlocked(agent,q,'walk',index,agent))&&(!l||!valid||valid(q.x,q.y,agent));
 const spot=(tt,l)=>{const q=at(tt,l);return(!index||!collidesWithTraffic(q,'walk',index,agent))&&(!l||!valid||valid(q.x,q.y,agent));};
 const lane=(l,metres)=>{for(let k=0;k<=Math.ceil(metres/.6);k++)if(!spot(agent.t+Math.sign(delta)*Math.min(k*.6,metres)/e.len,l))return false;return true;};
 const next=at(nextT,lat);
 if(!free(next,lat)){
  agent.braking=true;plan.blocked=(plan.blocked||0)+elapsed;
  if(!settled)plan.lateralGoal=lat0;
  else if(plan.blocked>1){
   for(const off of [.9,-.9,1.6,-1.6,2.1,-2.1,2.6,-2.6]){
    if(Math.abs(off-lat)<.05)continue;
    if(lane(off,Math.min(remaining,4.8))){plan.lateralGoal=off;plan.blocked=0;break;}
   }
  }
  return;
 }
 plan.blocked=0;plan.lateral=lat;
 Object.assign(agent,next,{edge:plan.edge,t:nextT,braking:false});
 if(settled&&goal!==0){
  if(lane(0,Math.min(remaining,1.2)))plan.lateralGoal=0;
 }
 if(remaining<=advance+.00001){
  agent.t=destination;agent.braking=true;
  const door=plan.phase==='OUTBOUND'?plan.targetDoor:plan.homeDoor;
  // Q03: the last metres lead straight to the threshold; the NPC vanishes only there.
  if(door){plan.doorStep={mode:'ENTER',door};plan.blocked=0;return;}
  arrive(agent,plan,false);
 }
}
export function restoreResidentRoutine(graph,agent,dt,world={},index=null){
 const plan=agent.residentRoutine,e=graph.edges[plan.edge];
 if(!e)return true;
 const a=graph.nodes[e.from],b=graph.nodes[e.to],dx=b.x-a.x,dy=b.y-a.y;
 const t=clamp(((agent.x-a.x)*dx+(agent.y-a.y)*dy)/(e.len*e.len),.02,.98);
 const target=pose(graph,plan.edge,t,plan.side);
 const len=Math.hypot(target.x-agent.x,target.y-agent.y);
 const clear=!index||!collidesWithTraffic(target,'walk',index,agent);
 const safe=!world.validRecovery||world.validRecovery(target.x,target.y,agent);
 // Back on the pavement line: any sidestep or doorway walk restarts from there.
 const settle=()=>{plan.lateral=0;plan.lateralGoal=0;plan.doorStep=null;plan.blocked=0;};
 if(len<1.2&&clear&&safe){
  Object.assign(agent,target,{edge:plan.edge,t,corner:null,braking:false,
   needsRoutineRecovery:false,recoverySeconds:0});
  settle();return true;
 }
 agent.recoverySeconds=(agent.recoverySeconds||0)+dt;
 const offscreen=(x,y,padding=16)=>!!world.view&&
  (x<world.view[0]-padding||x>world.view[2]+padding||
   y<world.view[1]-padding||y>world.view[3]+padding);
 if(offscreen(agent.x,agent.y)&&offscreen(target.x,target.y,6)&&
    agent.recoverySeconds>3&&clear&&safe){
  Object.assign(agent,target,{edge:plan.edge,t,corner:null,braking:false,
   needsRoutineRecovery:false,recoverySeconds:0,prevX:target.x,prevY:target.y,prevA:target.a});
  settle();return true;
 }
 if(len>.0001){
  const travel=Math.min(len,3.8*Math.min(dt,.1)),nx=agent.x+(target.x-agent.x)*travel/len,
   ny=agent.y+(target.y-agent.y)*travel/len;
  if((!world.validRecovery||world.validRecovery(nx,ny,agent))&&
     (!index||!collidesWithTraffic({x:nx,y:ny,a:agent.a},'walk',index,agent))){
   agent.x=nx;agent.y=ny;agent.a=Math.atan2(target.y-agent.y,target.x-agent.x);
  }
 }
 return true;
}
