/* Q01: Small deterministic street-side cohort near Via Roma.
 * These stops are simulated; no real building, shop or civic number is claimed.
 * The route stays on one validated OSM pavement until the door/path system
 * is added in Q03. No in-camera teleport or separate NPC duplicate. */
import {makeCollisionIndex,addToCollisionIndex,nearbyColliders,collidesWithTraffic,trafficMoveBlocked} from './traffic-collision.mjs?v=125';
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
export function createRoutineResidents(graph,count=10,seed=405,center={x:0,y:0},avoid=[],validWalk=()=>true){
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
 const options=(preferred.length?preferred:near).sort((a,b)=>a.distance-b.distance||a.id-b.id).slice(0,22);
 if(!options.length)return [];
 const residents=[],occupied=makeCollisionIndex(avoid);
 for(let i=0;i<count;i++)for(let attempt=0;attempt<72;attempt++){
  const choice=options[hash(seed+i*503+attempt*71)%options.length],e=graph.edges[choice.id];
  const side=(i+attempt)%2?1:-1,spread=Math.min(.23,95/e.len);
  const homeT=clamp(choice.t+(rand(seed+i*313+attempt*59)-.5)*2*spread,.08,.92);
  const distanceT=Math.min(.68,Math.max(.12,42/e.len));
  const direction=(hash(seed+i*17+attempt*31)&1)?1:-1;
  const targetT=homeT+direction*distanceT>=.94||homeT+direction*distanceT<=.06?
   homeT-direction*distanceT:homeT+direction*distanceT;
  if(targetT<.06||targetT>.94||Math.abs(targetT-homeT)*e.len<12)continue;
  let clear=true;
  for(let k=0;k<=8;k++){
   const t=homeT+(targetT-homeT)*k/8,p=pose(graph,choice.id,t,side);
   if(!validWalk(p.x,p.y)){clear=false;break;}
  }
  if(!clear)continue;
  const at=pose(graph,choice.id,homeT,side);
  if(collidesWithTraffic(at,'walk',occupied))continue;
  if([...nearbyColliders(occupied,at.x,at.y,2)].some(other=>
   other.body==='walk'&&Math.hypot(at.x-other.x,at.y-other.y)<2.2))continue;
  const plan={edge:choice.id,side,homeT,targetT,phase:'AT_HOME',cycles:0,agenda:makeResidentAgenda(seed+i*17,i)};
  const agent={...at,edge:choice.id,t:homeT,speed:.85+rand(seed+i*19)*.34,
   kind:i%7,seed:seed+i*17,wait:1.1+rand(seed+i*17)*2.3,body:'walk',side,
   routine:'resident',segments:0,residentRoutine:plan,braking:true,
   home:{x:at.x,y:at.y,edge:choice.id,side,radius:90,returnEdges:[choice.id]}};
  residents.push(agent);addToCollisionIndex(occupied,agent);break;
 }
 return residents;
}
export function stepResidentRoutine(graph,agent,dt,index=null,clockMinutes=null){
 const plan=agent.residentRoutine,e=graph.edges[plan.edge];
 if(!e||!e.walk)return;
 const elapsed=Math.min(Math.max(dt,0),.1);
 if(plan.phase==='AT_HOME'&&Number.isFinite(clockMinutes)){
  const run=residentDepartureWindow(plan.agenda,clockMinutes);
  agent.braking=true;
  if(run!==null&&run!==plan.agenda.lastRunId){
   plan.agenda.lastRunId=run;plan.agenda.status='OUTBOUND';plan.phase='OUTBOUND';agent.wait=0;
  }
  return;
 }
 if(plan.phase==='AT_HOME'||plan.phase==='ACTING'){
  agent.braking=true;agent.wait=Math.max(0,(agent.wait||0)-elapsed);
  if(agent.wait<=0){plan.phase=plan.phase==='AT_HOME'?'OUTBOUND':'RETURNING';if(plan.agenda)plan.agenda.status=plan.phase;}
  return;
 }
 const destination=plan.phase==='OUTBOUND'?plan.targetT:plan.homeT;
 const delta=destination-agent.t,remaining=Math.abs(delta)*e.len;
 const advance=Math.min(remaining,agent.speed*elapsed);
 const nextT=remaining<.00001?destination:agent.t+Math.sign(delta)*advance/e.len;
 const next=pose(graph,plan.edge,nextT,plan.side);
 next.a=delta<0?e.angle+Math.PI:e.angle;
 if(index&&trafficMoveBlocked(agent,next,'walk',index,agent)){
  agent.braking=true;return;
 }
 Object.assign(agent,next,{edge:plan.edge,t:nextT,braking:false});
 if(remaining<=advance+.00001){
  agent.t=destination;agent.braking=true;
  if(plan.phase==='OUTBOUND'){
   plan.phase='ACTING';if(plan.agenda)plan.agenda.status='ACTING';agent.wait=2+rand(agent.seed+plan.cycles*11)*3.5;
  }else{
   plan.phase='AT_HOME';if(plan.agenda)plan.agenda.status='AT_HOME';plan.cycles++;
   agent.wait=1.4+rand(agent.seed+plan.cycles*19)*3;
  }
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
 if(len<1.2&&clear&&safe){
  Object.assign(agent,target,{edge:plan.edge,t,corner:null,braking:false,
   needsRoutineRecovery:false,recoverySeconds:0});
  return true;
 }
 agent.recoverySeconds=(agent.recoverySeconds||0)+dt;
 const offscreen=(x,y,padding=16)=>!!world.view&&
  (x<world.view[0]-padding||x>world.view[2]+padding||
   y<world.view[1]-padding||y>world.view[3]+padding);
 if(offscreen(agent.x,agent.y)&&offscreen(target.x,target.y,6)&&
    agent.recoverySeconds>3&&clear&&safe){
  Object.assign(agent,target,{edge:plan.edge,t,corner:null,braking:false,
   needsRoutineRecovery:false,recoverySeconds:0,prevX:target.x,prevY:target.y,prevA:target.a});
  return true;
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
