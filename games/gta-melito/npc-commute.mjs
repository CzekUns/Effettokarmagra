/* Q12: ciclo NPC a piedi ↔ scooter.
 * Un residente (di fantasia) esce dal suo portone, sale sul SUO scooter parcheggiato davanti
 * casa (un mezzo vero tra i parcheggiati: il giocatore può rubarlo), segue un percorso
 * pianificato sulle strade fino a un negozio OSM, parcheggia, scende, entra, esce, torna allo
 * scooter e rientra. Un solo personaggio e un solo mezzo: quando guida il pedone non è in
 * strada e lo scooter ha il pilota; quando cammina lo scooter è parcheggiato e vuoto.
 * Se lo scooter manca (rubato o portato via) se ne accorge, aspetta un po' e va a piedi su un
 * percorso di marciapiedi; al giro dopo riprende lo scooter se è tornato vicino a casa.
 * Nessun teletrasporto: ogni spostamento è continuo, anche nelle curve. */
import {lanePosition} from './roads.mjs?v=147';
import {trafficMoveBlocked,nearbyColliders,vehicleHitsPedestrian} from './traffic-collision.mjs?v=127';
import {makeResidentAgenda,residentDepartureWindow} from './npc-agenda.mjs?v=001';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const COMMUTE_RULES=Object.freeze({walkSpeed:1.05,rideSpeed:9.5,rideAccel:5,parkSpeed:2.4,
 stay:[22,40],waitForBike:45,bikeNear:6,bikeHome:12,mountReach:.35});
// Le vie OSM spesso si toccano senza condividere lo stesso punto: per i percorsi i nodi entro 6 m
// contano come lo stesso incrocio (lo scooter e il pedone attraversano quel piccolo stacco in linea retta).
export const SNAP_METRES=6;
const snaps=new WeakMap();
function nearNodes(graph,i){
 let s=snaps.get(graph);
 if(!s){const grid=new Map(),cell=16;graph.nodes.forEach((n,k)=>{const key=Math.floor(n.x/cell)+','+Math.floor(n.y/cell);if(!grid.has(key))grid.set(key,[]);grid.get(key).push(k);});s={grid,cell,cache:new Map()};snaps.set(graph,s);}
 if(s.cache.has(i))return s.cache.get(i);
 const n=graph.nodes[i],out=[];
 for(let gx=Math.floor((n.x-SNAP_METRES)/s.cell);gx<=Math.floor((n.x+SNAP_METRES)/s.cell);gx++)
  for(let gy=Math.floor((n.y-SNAP_METRES)/s.cell);gy<=Math.floor((n.y+SNAP_METRES)/s.cell);gy++)
   for(const j of s.grid.get(gx+','+gy)||[])if(Math.hypot(graph.nodes[j].x-n.x,graph.nodes[j].y-n.y)<=SNAP_METRES)out.push(j);
 s.cache.set(i,out);return out;
}
// Percorso minimo (Dijkstra) su tratti percorribili in auto o a piedi, dal tratto di partenza a uno
// dei tratti d'arrivo (goal: un tratto o un elenco, es. i due sensi della stessa via).
export function planRoute(graph,start,goal,mode='car'){
 if(start==null||goal==null)return null;
 const goals=new Set(Array.isArray(goal)?goal:[goal]);
 if(goals.has(start))return [start];
 const ok=e=>mode==='car'?e.car:e.walk;
 const dist=new Map([[start,0]]),prev=new Map(),open=[[0,start]];
 while(open.length){
  let bi=0;for(let i=1;i<open.length;i++)if(open[i][0]<open[bi][0])bi=i;
  const [d,id]=open.splice(bi,1)[0];
  if(goals.has(id)){goal=id;break;}
  if(d>(dist.get(id)??Infinity))continue;
  const e=graph.edges[id];
  for(const next of nearNodes(graph,e.to).flatMap(k=>graph.nodes[k].out)){
   const n=graph.edges[next];if(!ok(n))continue;
   if(n.to===e.from&&graph.nodes[e.to].out.length>1)continue;// niente inversioni a U dove si può proseguire
   const nd=d+n.len;
   if(nd<(dist.get(next)??Infinity)){dist.set(next,nd);prev.set(next,id);open.push([nd,next]);}
  }
 }
 if(Array.isArray(goal)||!prev.has(goal))return null;
 const path=[goal];while(path[0]!==start)path.unshift(prev.get(path[0]));
 return path;
}
export function routeLength(graph,path){return (path||[]).reduce((s,id)=>s+graph.edges[id].len,0);}
export function reverseEdge(graph,id){const e=graph.edges[id];return graph.nodes[e.to].out.find(o=>graph.edges[o].to===e.from)??null;}
// Il tratto percorribile in auto dello stesso pezzo di strada (le porte stanno su tratti pedonali).
export function carEdgeFor(graph,edgeId,t){
 const e=graph.edges[edgeId];
 if(e.car)return {edge:edgeId,t};
 const back=graph.nodes[e.to].out.find(id=>graph.edges[id].to===e.from&&graph.edges[id].car);
 return back==null?null:{edge:back,t:1-t};
}
// Posto per lo scooter sul bordo del marciapiede, dalla parte della porta (come gli scooter parcheggiati).
export function kerbSpot(graph,door){
 const e=graph.edges[door.edge],a=graph.nodes[e.from],b=graph.nodes[e.to];
 const off=door.side*Math.max(3.65,e.streetWidth/2+1.4);
 return {x:a.x+(b.x-a.x)*door.t-Math.sin(e.angle)*off,y:a.y+(b.y-a.y)*door.t+Math.cos(e.angle)*off,a:e.angle};
}
const pavementPoint=(graph,door)=>lanePosition(graph,door.edge,door.t,'walk',door.side);
export function createCommuter({graph,homeDoor,shopDoor,bike,seed=1201,index=0}){
 const home=carEdgeFor(graph,homeDoor.edge,homeDoor.t),shop=carEdgeFor(graph,shopDoor.edge,shopDoor.t);
 if(!home||!shop)return null;
 const out=planRoute(graph,home.edge,shop.edge,'car'),back=planRoute(graph,shop.edge,home.edge,'car');
 if(!out||!back)return null;
 // Sullo stesso tratto si può solo andare avanti: una meta alle spalle non è un percorso valido.
 if((out.length===1&&shop.t<=home.t)||(back.length===1&&home.t<=shop.t))return null;
 const spot=kerbSpot(graph,homeDoor);
 Object.assign(bike,{x:spot.x,y:spot.y,a:spot.a,speed:0,rider:false,commuterBike:true,prevX:spot.x,prevY:spot.y,prevA:spot.a});
 const npc={x:homeDoor.x,y:homeDoor.y,a:Math.atan2(-homeDoor.ny,-homeDoor.nx),speed:COMMUTE_RULES.walkSpeed,kind:5,seed,wait:0,
  body:'walk',side:homeDoor.side,routine:'commuter',segments:0,commuter:true,indoors:true,braking:true,
  edge:homeDoor.edge,t:homeDoor.t,home:{x:spot.x,y:spot.y,edge:homeDoor.edge,side:homeDoor.side,radius:90,returnEdges:[homeDoor.edge]}};
 const plan={phase:'HOME',homeDoor,shopDoor,home,shop,routes:{out,back},homeSpot:spot,shopSpot:kerbSpot(graph,shopDoor),
  agenda:makeResidentAgenda(seed,index),cycles:0,onFoot:false,log:[]};
 return {npc,bike,plan};
}
function setPhase(c,phase){c.plan.phase=phase;c.plan.log.push(phase);if(c.plan.log.length>80)c.plan.log.shift();}
// Un mezzo blocca il pedone se il passo lo porta dentro la sua sagoma (il proprio scooter no:
// ci sta salendo o scendendo).
function walkerBlocked(npc,next,index,ownBike){
 if(!index)return false;
 for(const other of nearbyColliders(index,next.x,next.y,8)){
  if(other===npc||other===ownBike||(other.body||'car')!=='car')continue;
  if(vehicleHitsPedestrian(other,next,.8)&&(!vehicleHitsPedestrian(other,npc,.8)||
   Math.hypot(next.x-other.x,next.y-other.y)<Math.hypot(npc.x-other.x,npc.y-other.y)))return true;
 }
 return false;
}
// Passo a piedi in linea retta verso un punto: a passo d'uomo, solo su punti camminabili, fermo se un mezzo è davanti.
function walkTowards(npc,target,dt,world){
 const dx=target.x-npc.x,dy=target.y-npc.y,d=Math.hypot(dx,dy),step=COMMUTE_RULES.walkSpeed*dt;
 if(d<=1e-6){npc.braking=true;return true;}
 const k=Math.min(1,step/d),next={x:npc.x+dx*k,y:npc.y+dy*k,a:Math.atan2(dy,dx)};
 if((world.valid&&!world.valid(next.x,next.y))||walkerBlocked(npc,next,world.index,world.ownBike)){npc.braking=true;return false;}
 Object.assign(npc,next,{braking:false});
 return d<=step+1e-6;
}
// Segue una sequenza di punti a piedi.
function walkWaypoints(c,points,dt,world){
 const p=c.plan;p.wp??=0;
 while(p.wp<points.length&&Math.hypot(points[p.wp].x-c.npc.x,points[p.wp].y-c.npc.y)<1e-6)p.wp++;
 if(p.wp>=points.length){p.wp=0;return true;}
 if(walkTowards(c.npc,points[p.wp],dt,world))p.wp++;
 if(p.wp>=points.length){p.wp=0;return true;}
 return false;
}
const bikeShape={vehicleType:'motorcycle',body:'car'};
function bikeFree(c,world,spot,near=COMMUTE_RULES.bikeNear){
 const b=c.bike;
 return !b.rider&&world.playerVehicle!==b&&!(b.impactTime>0)&&Math.hypot(b.x-spot.x,b.y-spot.y)<=near;
}
function moveBike(c,next,world){
 const b=c.bike,pose={...next,vehicleType:'motorcycle',body:'car'};
 if(world.index&&trafficMoveBlocked({...b,...bikeShape},pose,'car',world.index,b))return false;
 b.prevX??=b.x;b.x=pose.x;b.y=pose.y;b.a=pose.a;return true;
}
// Uscita/entrata dal parcheggio: spostamento continuo tra il posto sul bordo e la corsia.
function slideBike(c,from,to,dt,world){
 const p=c.plan;p.slide??=0;
 const len=Math.max(.5,Math.hypot(to.x-from.x,to.y-from.y)),step=COMMUTE_RULES.parkSpeed*dt/len;
 const s=Math.min(1,p.slide+step),x=from.x+(to.x-from.x)*s,y=from.y+(to.y-from.y)*s;
 const moving=Math.hypot(to.x-from.x,to.y-from.y)>.05?Math.atan2(to.y-from.y,to.x-from.x):to.a;
 const a=s>=1?to.a:moving;
 if(!moveBike(c,{x,y,a},world)){c.bike.speed=0;return false;}
 p.slide=s;c.bike.speed=COMMUTE_RULES.parkSpeed;
 if(s>=1){p.slide=0;c.bike.speed=0;return true;}
 return false;
}
// Guida lungo il percorso, sulla corsia di destra. A ogni incrocio (o dopo un urto) lo scooter
// va dritto dal punto in cui si trova all'inizio della corsia successiva: come una svolta vera,
// alla sua velocità, senza salti.
function ride(c,dt,world){
 const p=c.plan,b=c.bike,r=p.ride,graph=world.graph;
 if(b.impactTime>0){b.speed=0;r.connector=null;r.reblend=true;return false;}
 const vmax=COMMUTE_RULES.rideSpeed*(world.wet?.85:1);
 const speed=Math.min(vmax,(b.speed||0)+COMMUTE_RULES.rideAccel*dt);
 if(r.reblend){const e=graph.edges[r.path[r.cursor]];r.t=Math.min(r.cursor===r.path.length-1?r.goalT:1,r.t+2/e.len);r.connector=lanePosition(graph,r.path[r.cursor],r.t,'car');r.reblend=false;}
 for(const factor of [1,.5,.25]){
  const step=speed*dt*factor;
  let cursor=r.cursor,t=r.t,connector=r.connector,x=b.x,y=b.y,left=step;
  if(connector){
   const d=Math.hypot(connector.x-x,connector.y-y);
   if(d>left){x+=(connector.x-x)*left/d;y+=(connector.y-y)*left/d;left=0;}
   else{x=connector.x;y=connector.y;left-=d;connector=null;}
  }
  while(left>1e-9&&!connector){
   const e=graph.edges[r.path[cursor]],last=cursor===r.path.length-1,stop=last?r.goalT:1,room=(stop-t)*e.len;
   if(left<room){t+=left/e.len;left=0;const q=lanePosition(graph,r.path[cursor],t,'car');x=q.x;y=q.y;break;}
   t=stop;left-=Math.max(0,room);
   const q=lanePosition(graph,r.path[cursor],t,'car');x=q.x;y=q.y;
   if(last){left=0;break;}
   cursor++;const n=graph.edges[r.path[cursor]];t=Math.min(cursor===r.path.length-1?r.goalT:1,4/n.len);
   connector=lanePosition(graph,r.path[cursor],t,'car');
   const d=Math.hypot(connector.x-x,connector.y-y);
   if(d>left){x+=(connector.x-x)*left/d;y+=(connector.y-y)*left/d;left=0;}
   else{x=connector.x;y=connector.y;left-=d;connector=null;}
  }
  const dir=Math.hypot(x-b.x,y-b.y)>.005?Math.atan2(y-b.y,x-b.x):b.a;
  if(!moveBike(c,{x,y,a:dir},world))continue;
  r.cursor=cursor;r.t=t;r.connector=connector;b.speed=speed*factor;
  return !connector&&r.cursor===r.path.length-1&&r.t>=r.goalT-1e-9;
 }
 b.speed=0;return false;
}
function mount(c){c.npc.indoors=true;c.npc.riding=true;c.bike.rider=true;c.bike.npcRider=c.npc;c.npc.braking=true;}
function dismount(c,at){
 Object.assign(c.npc,at,{indoors:false,riding:false,braking:true});
 c.bike.rider=false;c.bike.npcRider=null;c.bike.speed=0;
}
function beside(spot,door){
 // Accanto allo scooter, dalla parte del marciapiede (verso la porta).
 const dx=door.x-spot.x,dy=door.y-spot.y,d=Math.hypot(dx,dy)||1;
 return {x:spot.x+dx/d*.9,y:spot.y+dy/d*.9,a:Math.atan2(dy,dx)};
}
function startRide(c,which,from){
 const p=c.plan,path=p.routes[which],start=which==='out'?p.home:p.shop,goal=which==='out'?p.shop:p.home;
 p.ride={path,cursor:0,t:start.t,goalT:goal.t,connector:null,reblend:false,from:{x:from.x,y:from.y,a:from.a}};
}
/* Percorso a piedi (quando lo scooter manca): tratti della rete pedonale fino alla via della porta,
 * camminando sul marciapiede; agli incroci si va dritti al marciapiede successivo se il passaggio è
 * libero, altrimenti passando per il centro dell'incrocio (si attraversa la strada). */
export function walkWaypoints2(graph,from,goalDoor,valid){
 const back=reverseEdge(graph,goalDoor.edge),goalT=new Map([[goalDoor.edge,goalDoor.t],...(back!=null?[[back,1-goalDoor.t]]:[])]);
 const here=from.edge,rev=reverseEdge(graph,here),options=[];
 for(const [edge,t] of [[here,from.t],...(rev!=null&&graph.edges[rev].walk?[[rev,1-from.t]]:[])]){
  const path=planRoute(graph,edge,[...goalT.keys()],'walk');if(!path)continue;
  const end=goalT.get(path.at(-1)),e0=graph.edges[edge];
  const cost=path.length===1?(end>=t?(end-t)*e0.len:1e6):(1-t)*e0.len+routeLength(graph,path.slice(1,-1))+end*graph.edges[path.at(-1)].len;
  options.push({edge,t,path,cost});
 }
 options.sort((a,b)=>a.cost-b.cost);
 const best=options[0];if(!best||best.cost>=1e6)return null;
 const clear=(p,q)=>{const n=Math.ceil(Math.hypot(q.x-p.x,q.y-p.y)/.5);for(let i=1;i<n;i++)if(!valid(p.x+(q.x-p.x)*i/n,p.y+(q.y-p.y)*i/n))return false;return true;};
 const pts=[],pave=(edge,t,side)=>lanePosition(graph,edge,t,'walk',side);
 let side=null,last={x:from.x,y:from.y};
 best.path.forEach((edge,i)=>{
  const final=i===best.path.length-1,t0=i===0?best.t:0,t1=final?goalT.get(edge):1;
  // Sul tratto finale il lato della porta; altrove il lato più vicino a dove si arriva.
  const want=final?(edge===goalDoor.edge?goalDoor.side:-goalDoor.side):
   [1,-1].sort((a,b)=>Math.hypot(pave(edge,t0,a).x-last.x,pave(edge,t0,a).y-last.y)-Math.hypot(pave(edge,t0,b).x-last.x,pave(edge,t0,b).y-last.y))[0];
  const start=pave(edge,t0,want);
  if(!clear(last,start)){const node=graph.nodes[graph.edges[edge].from];pts.push({x:node.x,y:node.y});}
  pts.push(start,pave(edge,t1,want));last=pts.at(-1);side=want;
 });
 return {points:pts,path:best.path,side};
}
function walkRoute(c,goalDoor,world){
 const p=c.plan,npc=c.npc;
 const route=walkWaypoints2(world.graph,{edge:npc.edge,t:npc.t??0,x:npc.x,y:npc.y},goalDoor,world.valid||(()=>true));
 p.walkPoints=route?.points||[];p.wp=0;p.walkGoal=goalDoor;
}
/* world: {graph, index, valid(x,y), clockMinutes, playerVehicle, say(agent,text), wet} */
export function stepCommuter(c,dt,input){
 const world={...input,ownBike:c.bike};
 const p=c.plan,npc=c.npc,elapsed=clamp(Number(dt)||0,0,.1);
 if(npc.impactTime>0)return p.phase;
 if(npc.needsRoutineRecovery){npc.needsRoutineRecovery=false;npc.recoverySeconds=0;p.wp=0;}
 const say=(t)=>world.say?.(npc,t);
 switch(p.phase){
  case 'HOME':{
   const run=residentDepartureWindow(p.agenda,world.clockMinutes);
   if(run===null||run===p.agenda.lastRunId)break;
   p.agenda.lastRunId=run;
   Object.assign(npc,{x:p.homeDoor.x,y:p.homeDoor.y,indoors:false,braking:false});
   if(bikeFree(c,world,p.homeSpot,COMMUTE_RULES.bikeHome)){p.onFoot=false;setPhase(c,'TO_BIKE');}
   else{p.onFoot=true;say('Il motorino non c’è…');Object.assign(npc,{edge:p.homeDoor.edge,t:p.homeDoor.t,side:p.homeDoor.side});setPhase(c,'TO_PAVEMENT');}
   break;}
  case 'TO_BIKE':{
   const pts=[pavementPoint(world.graph,p.homeDoor),beside(c.bike,p.homeDoor)];
   if(!bikeFree(c,world,p.homeSpot,COMMUTE_RULES.bikeHome)){p.onFoot=true;say('Il motorino?!');Object.assign(npc,{edge:p.homeDoor.edge,t:p.homeDoor.t,side:p.homeDoor.side});setPhase(c,'TO_PAVEMENT');break;}
   if(walkWaypoints(c,pts,elapsed,world)){mount(c);startRide(c,'out',c.bike);setPhase(c,'PULL_OUT');}
   break;}
  case 'PULL_OUT':case 'PULL_OUT_BACK':{
   const r=p.ride,lane=lanePosition(world.graph,r.path[0],r.t,'car');
   if(slideBike(c,r.from,{...lane,a:lane.a},elapsed,world)){r.connector=null;setPhase(c,p.phase==='PULL_OUT'?'RIDE':'RIDE_BACK');}
   break;}
  case 'RIDE':case 'RIDE_BACK':{
   if(ride(c,elapsed,world)){p.parkFrom={x:c.bike.x,y:c.bike.y,a:c.bike.a};setPhase(c,p.phase==='RIDE'?'PARK':'PARK_HOME');}
   break;}
  case 'PARK':case 'PARK_HOME':{
   const spot=p.phase==='PARK'?p.shopSpot:p.homeSpot;
   if(slideBike(c,p.parkFrom,spot,elapsed,world)){
    const door=p.phase==='PARK'?p.shopDoor:p.homeDoor;
    dismount(c,beside(c.bike,door));setPhase(c,p.phase==='PARK'?'TO_SHOP':'TO_DOOR');
   }
   break;}
  case 'TO_SHOP':case 'TO_DOOR':{
   const door=p.phase==='TO_SHOP'?p.shopDoor:p.homeDoor;
   if(walkWaypoints(c,[pavementPoint(world.graph,door),{x:door.x,y:door.y}],elapsed,world)){
    npc.indoors=true;npc.braking=true;door.open=1.4;
    if(p.phase==='TO_SHOP'){p.stayUntil=(p.clock??0)+COMMUTE_RULES.stay[0]+((npc.seed+p.cycles*7)%100)/100*(COMMUTE_RULES.stay[1]-COMMUTE_RULES.stay[0]);setPhase(c,'SHOP');}
    else{p.cycles++;setPhase(c,'HOME');}
   }
   break;}
  case 'SHOP':{
   if((p.clock??0)<p.stayUntil)break;
   Object.assign(npc,{x:p.shopDoor.x,y:p.shopDoor.y,indoors:false,braking:false});p.shopDoor.open=1.4;
   if(p.onFoot){Object.assign(npc,{edge:p.shopDoor.edge,t:p.shopDoor.t,side:p.shopDoor.side});setPhase(c,'TO_PAVEMENT_BACK');}
   else setPhase(c,'TO_BIKE_BACK');
   break;}
  case 'TO_BIKE_BACK':{
   if(!bikeFree(c,world,p.shopSpot)){
    if(p.phase!=='WAIT_BIKE'){say('Il motorino?! Me l’hanno rubato!');p.waitUntil=(p.clock??0)+COMMUTE_RULES.waitForBike;setPhase(c,'WAIT_BIKE');}
    break;
   }
   if(walkWaypoints(c,[pavementPoint(world.graph,p.shopDoor),beside(c.bike,p.shopDoor)],elapsed,world)){mount(c);startRide(c,'back',c.bike);setPhase(c,'PULL_OUT_BACK');}
   break;}
  case 'WAIT_BIKE':{
   npc.braking=true;
   if(bikeFree(c,world,p.shopSpot)){say('Eccolo!');setPhase(c,'TO_BIKE_BACK');break;}
   if((p.clock??0)>=p.waitUntil){say('Torno a piedi…');p.onFoot=true;Object.assign(npc,{edge:p.shopDoor.edge,t:p.shopDoor.t,side:p.shopDoor.side});setPhase(c,'TO_PAVEMENT_BACK');}
   break;}
  case 'TO_PAVEMENT':case 'TO_PAVEMENT_BACK':{
   const door=p.phase==='TO_PAVEMENT'?p.homeDoor:p.shopDoor;
   if(walkWaypoints(c,[pavementPoint(world.graph,door)],elapsed,world)){
    walkRoute(c,p.phase==='TO_PAVEMENT'?p.shopDoor:p.homeDoor,world);setPhase(c,p.phase==='TO_PAVEMENT'?'WALK':'WALK_BACK');
   }
   break;}
  case 'WALK':case 'WALK_BACK':{
   if(walkWaypoints(c,p.walkPoints,elapsed,world)){setPhase(c,p.phase==='WALK'?'TO_SHOP':'TO_DOOR');}
   break;}
 }
 p.clock=(p.clock??0)+elapsed;
 if(npc.indoors)npc.braking=true;
 return p.phase;
}
