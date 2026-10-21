/* GTA Melito — Q13: densità dei passanti per zona e per ora, senza pop-in.
 * Gli stessi passanti anonimi (non residenti con agenda, non mestieri, non pendolari) si
 * distribuiscono dove c'è vita: vicino ai negozi con nome OSM, in Via Roma e Piazza Santo
 * Stefano, sulle strade principali; pochi in periferia e di notte. Nessuno viene aggiunto o tolto:
 * - lontano dal giocatore (oltre farRadius) il passante è "simulato" in modo leggero: resta fermo
 *   e non costa nulla al passo di simulazione;
 * - se intorno al giocatore ce ne sono meno di quanti la zona e l'ora ne vogliono, uno dei
 *   lontani riappare FUORI DALLA VISTA su un marciapiede vicino (mai dentro la camera);
 * - se ce ne sono troppi (es. a notte fonda) uno di quelli fuori vista se ne va lontano.
 * Le posizioni sono quelle dei marciapiedi del grafo stradale OSM, controllate con canStand. */
import {lanePosition} from './roads.mjs?v=163';
import {collidesWithTraffic,nearbyColliders} from './traffic-collision.mjs?v=131';

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const hash=n=>{let x=(n|0)^0x9e3779b9;x=Math.imul(x^x>>>16,0x85ebca6b);x=Math.imul(x^x>>>13,0xc2b2ae35);return (x^x>>>16)>>>0;};
export const DENSITY_RULES=Object.freeze({
 // perMetre: passanti per metro di marciapiede "pesato" a pieno giorno entro lifeRadius dal giocatore
 // (Via Roma ≈ 40, una via di periferia ≈ 3-4).
 // chi arriva compare in una fascia appena fuori dalla camera (viewMargin…viewMargin+arrivalBand m;
 // viewMargin supera anche i 18 m di margine con cui il gioco disegna fuori schermo),
 // così entra in scena camminando poco dopo
 lifeRadius:150,farRadius:420,perMetre:.017,checkEvery:1,viewMargin:24,arrivalBand:40,maxIn:2,maxOut:1,overshoot:1.35,
 // in vista si può comparire solo uscendo da un portone Q03 (porta che si apre, due passi fino al
 // marciapiede): al massimo uno al secondo, ogni portone non più di una volta ogni doorCooldown s
 visibleShare:.3,doorCooldown:25,doorOpen:1.4,
 homeRadius:[60,110],landmarks:/^(via roma|piazza santo stefano|via santo stefano)$/i
});
// Ore → quanta gente in strada (curva continua, 1 = pieno giorno feriale).
const HOURS=[[0,.22],[5,.18],[6.5,.45],[8,.9],[11,1],[12.5,1.1],[14.5,.75],[16.5,1],[19,1.15],[21,.8],[23,.4],[24,.22]];
export function timeOfDayFactor(minutes){
 const h=((Number(minutes)||0)/60%24+24)%24;
 for(let i=1;i<HOURS.length;i++)if(h<=HOURS[i][0]){
  const [h0,v0]=HOURS[i-1],[h1,v1]=HOURS[i],k=(h-h0)/(h1-h0);return v0+(v1-v0)*k;
 }
 return HOURS[0][1];
}
const isWanderer=a=>a&&a.body==='walk'&&!a.residentRoutine&&!a.stationary&&!a.commuter&&!a.profession&&a.edge!=null;
const busy=a=>a.indoors||a.social?.hold||a.crossing||a.dodge>0||a.lookAt||a.needsRoutineRecovery||a.impactTime>0||a.kerbWait||a.wait>0;
/* Peso di vita per ogni tratto pedonale: negozi vicini, strade note del centro, gerarchia OSM. */
export function prepareWalkWeights(graph,{shops=[]}={}){
 const cell=60,grid=new Map();
 for(const s of shops){const k=Math.floor(s.x/cell)+','+Math.floor(s.y/cell);if(!grid.has(k))grid.set(k,[]);grid.get(k).push(s);}
 const near=(x,y,r)=>{let n=0;const cx=Math.floor(x/cell),cy=Math.floor(y/cell),span=Math.ceil(r/cell);
  for(let i=cx-span;i<=cx+span;i++)for(let j=cy-span;j<=cy+span;j++)for(const s of grid.get(i+','+j)||[])if(Math.hypot(s.x-x,s.y-y)<r)n++;
  return n;};
 const weights=new Float32Array(graph.edges.length);
 graph.edges.forEach((e,id)=>{
  if(!e.walk)return;
  const a=graph.nodes[e.from],b=graph.nodes[e.to],mx=(a.x+b.x)/2,my=(a.y+b.y)/2;
  let w=.35+Math.min(.7,near(mx,my,70)*.18);
  if(DENSITY_RULES.landmarks.test(e.name||''))w+=.5;
  w+=['primary','secondary','tertiary'].includes(e.roadType)?.15:e.roadType==='residential'?.08:
   ['service','track'].includes(e.roadType)?-.12:['pedestrian','footway','living_street'].includes(e.roadType)?.12:0;
  weights[id]=clamp(w,.2,1.4);
 });
 return weights;
}
// Distanza punto–tratto e metri del tratto che cadono dentro il cerchio (approssimati).
function segmentReach(graph,e,x,y,radius){
 const a=graph.nodes[e.from],b=graph.nodes[e.to],dx=b.x-a.x,dy=b.y-a.y,l2=dx*dx+dy*dy;
 const t=l2?clamp(((x-a.x)*dx+(y-a.y)*dy)/l2,0,1):0,d=Math.hypot(a.x+dx*t-x,a.y+dy*t-y);
 return d>radius?{d,inside:0}:{d,inside:Math.min(e.len,2*Math.sqrt(radius*radius-d*d))};
}
// Capienza della zona: metri di marciapiede entro il raggio, ciascuno pesato dalla sua vita.
export function zoneCapacity(graph,weights,x,y,radius=DENSITY_RULES.lifeRadius){
 let sum=0;
 for(let id=0;id<graph.edges.length;id++){
  if(!weights[id])continue;
  sum+=weights[id]*segmentReach(graph,graph.edges[id],x,y,radius).inside;
 }
 return sum;
}
export function createDensity(seed=1717){return {seed,clock:0,next:0,moves:0,log:[]};}
const outside=(x,y,view,m)=>!view||x<view[0]-m||x>view[2]+m||y<view[1]-m||y>view[3]+m;
// Distanza di un punto dal rettangolo della camera (0 se dentro).
const viewGap=(x,y,view)=>!view?Infinity:Math.hypot(Math.max(view[0]-x,0,x-view[2]),Math.max(view[1]-y,0,y-view[3]));
function relocate(d,a,graph,weights,ctx,near){
 const R=DENSITY_RULES,c=ctx.camera,view=ctx.view;
 const ids=[];let total=0;
 for(let id=0;id<graph.edges.length;id++){
  if(!weights[id])continue;
  const reach=segmentReach(graph,graph.edges[id],c.x,c.y,near?R.lifeRadius:R.farRadius*1.1);
  if(near?!reach.inside:reach.d<R.farRadius*1.1)continue;
  // in arrivo: meglio chi cammina verso la camera (entra presto in scena) che chi se ne allontana
  const e=graph.edges[id],p=graph.nodes[e.from],q=graph.nodes[e.to];
  const toward=near?((q.x-p.x)*(c.x-(p.x+q.x)/2)+(q.y-p.y)*(c.y-(p.y+q.y)/2)>0?2.5:.4):1;
  const w=weights[id]*(near?reach.inside:graph.edges[id].len)*toward;
  ids.push(id);total+=w;ids[ids.length-1]={id,w};
 }
 if(!ids.length)return false;
 for(let attempt=0;attempt<18;attempt++){
  let pick=(hash(d.seed+d.moves*7919+attempt*104729)%10000)/10000*total,id=ids[0].id;
  for(const k of ids){pick-=k.w;if(pick<=0){id=k.id;break;}}
  const t=.15+(hash(d.seed+attempt*31+d.moves)%700)/1000,side=hash(d.moves+attempt)%2?1:-1;
  const at=lanePosition(graph,id,t,'walk',side);
  if(!outside(at.x,at.y,view,R.viewMargin)||(near&&Math.hypot(at.x-c.x,at.y-c.y)>R.lifeRadius))continue;
  if(near&&view&&viewGap(at.x,at.y,view)>R.viewMargin+R.arrivalBand&&attempt<12)continue;
  if(ctx.canStand&&!ctx.canStand(at.x,at.y))continue;
  if(graph.isWalkBlocked?.(id,side))continue;
  if(ctx.index&&(collidesWithTraffic(at,'walk',ctx.index,a)||[...nearbyColliders(ctx.index,at.x,at.y,2)].some(o=>o!==a&&o.body==='walk'&&Math.hypot(o.x-at.x,o.y-at.y)<1.5)))continue;
  const radius=R.homeRadius[0]+hash(a.seed+d.moves)%(R.homeRadius[1]-R.homeRadius[0]);
  // la sua zona è quella del giocatore: gira qui intorno invece di restare ai margini della scena
  const home=near?{x:(at.x+c.x)/2,y:(at.y+c.y)/2,edge:id,side,radius:Math.max(radius,R.lifeRadius*.7)}:{x:at.x,y:at.y,edge:id,side,radius};
  home.returnEdges=ids.map(k=>k.id).filter(k=>segmentReach(graph,graph.edges[k],home.x,home.y,home.radius*.55).inside>0);
  if(!home.returnEdges.includes(id))home.returnEdges.unshift(id);
  if(a.hurry>0){a.speed=a.baseSpeed??a.speed;delete a.baseSpeed;a.hurry=0;}
  Object.assign(a,at,{edge:id,t,side,corner:null,wait:0,stalled:0,braking:false,frozen:false,kerbGo:null,
   prevX:at.x,prevY:at.y,prevA:at.a,home});
  d.moves++;return true;
 }
 return false;
}
// Un passante lontano esce da un portone in vista e va al marciapiede (passo scriptato di
// npc-reactions.mjs, lo stesso dell'attraversamento: niente salti, niente muri).
function emergeFromDoor(d,a,door,graph,ctx){
 const to=lanePosition(graph,door.edge,door.t,'walk',door.side),len=Math.hypot(to.x-door.x,to.y-door.y);
 if(len>6||(ctx.canStand&&(!ctx.canStand(door.x,door.y)||!ctx.canStand(to.x,to.y))))return false;
 if(ctx.index&&[...nearbyColliders(ctx.index,door.x,door.y,2.5)].some(o=>o!==a&&(o.body==='walk'||o.body==='car'||!o.body)&&Math.hypot(o.x-door.x,o.y-door.y)<1.6))return false;
 const c=ctx.camera,R=DENSITY_RULES;
 const home={x:(door.x+c.x)/2,y:(door.y+c.y)/2,edge:door.edge,side:door.side,radius:R.lifeRadius*.7};
 home.returnEdges=[];
 graph.edges.forEach((e,id)=>{if(e.walk&&segmentReach(graph,e,home.x,home.y,home.radius*.55).inside>0)home.returnEdges.push(id);});
 if(!home.returnEdges.includes(door.edge))home.returnEdges.unshift(door.edge);
 if(a.hurry>0){a.speed=a.baseSpeed??a.speed;delete a.baseSpeed;a.hurry=0;}
 Object.assign(a,{x:door.x,y:door.y,a:Math.atan2(to.y-door.y,to.x-door.x),edge:door.edge,t:door.t,side:door.side,corner:null,wait:0,stalled:0,
  braking:false,frozen:false,kerbGo:null,prevX:door.x,prevY:door.y,prevA:a.a,home,
  crossing:{phase:'go',from:{x:door.x,y:door.y},to,edge:door.edge,t:door.t,side:door.side,len,waited:0,walked:0,door:true}});
 door.open=R.doorOpen;door.lastEmerge=d.clock;d.moves++;
 return true;
}
/* Ogni secondo: passanti lontani fermi, riequilibrio intorno al giocatore. Ritorna il bilancio. */
export function stepDensity(d,dt,ctx){
 const R=DENSITY_RULES,c=ctx.camera,view=ctx.view,graph=ctx.graph,weights=ctx.weights;
 d.clock+=dt;
 if(!graph||!weights||!c)return null;
 // Lontano dal giocatore e fuori vista: simulato fermo (nessun costo, nessuno lo vede).
 for(const a of ctx.people){
  if(!isWanderer(a)){a.frozen=false;continue;}
  a.frozen=!busy(a)&&Math.hypot(a.x-c.x,a.y-c.y)>R.farRadius&&outside(a.x,a.y,view,R.viewMargin);
 }
 if(d.clock<d.next)return null;
 d.next=d.clock+R.checkEvery;
 const zone=zoneCapacity(graph,weights,c.x,c.y),time=timeOfDayFactor(ctx.minutes);
 const target=Math.round(R.perMetre*(ctx.scale??1)*zone*time);
 const around=ctx.people.filter(a=>a.body==='walk'&&!a.indoors&&Math.hypot(a.x-c.x,a.y-c.y)<R.lifeRadius);
 const report={target,around:around.length,zone:Math.round(zone),time:+time.toFixed(2),moved:0};
 if(around.length<target){
  const far=ctx.people.filter(a=>isWanderer(a)&&!busy(a)&&Math.hypot(a.x-c.x,a.y-c.y)>R.lifeRadius*1.5&&outside(a.x,a.y,view,R.viewMargin))
   .sort((a,b)=>Math.hypot(b.x-c.x,b.y-c.y)-Math.hypot(a.x-c.x,a.y-c.y));
  for(const a of far.slice(0,Math.min(R.maxIn,target-around.length)))if(relocate(d,a,graph,weights,ctx,true)){report.moved++;d.log.push({t:+d.clock.toFixed(1),k:'in'});}
 }else if(around.length>target*R.overshoot+1){
  const extra=around.filter(a=>isWanderer(a)&&!busy(a)&&outside(a.x,a.y,view,R.viewMargin));
  for(const a of extra.slice(0,R.maxOut))if(relocate(d,a,graph,weights,ctx,false)){report.moved--;d.log.push({t:+d.clock.toFixed(1),k:'out'});}
 }
 // In vista c'è troppo poca gente: uno esce da un portone che si vede (le porte Q03 sono valide).
 const screen=ctx.screen||view,inside=q=>screen&&q.x>screen[0]+3&&q.x<screen[2]-3&&q.y>screen[1]+3&&q.y<screen[3]-3;
 const shown=ctx.people.filter(a=>a.body==='walk'&&!a.indoors&&inside(a)).length;
 report.visible=shown;
 if(shown<Math.round(target*R.visibleShare)&&ctx.doors?.length){
  const door=ctx.doors.find(q=>q.edge!=null&&inside(q)&&!(q.open>0)&&(q.lastEmerge??-1e9)<d.clock-R.doorCooldown&&!graph.isWalkBlocked?.(q.edge,q.side));
  const who=door&&ctx.people.filter(a=>isWanderer(a)&&!busy(a)&&Math.hypot(a.x-c.x,a.y-c.y)>R.lifeRadius*1.5&&outside(a.x,a.y,view,R.viewMargin))
   .sort((a,b)=>Math.hypot(b.x-c.x,b.y-c.y)-Math.hypot(a.x-c.x,a.y-c.y))[0];
  if(who&&emergeFromDoor(d,who,door,graph,ctx)){report.moved++;d.log.push({t:+d.clock.toFixed(1),k:'door'});}
 }
 if(d.log.length>200)d.log.splice(0,d.log.length-200);
 d.last=report;
 return report;
}
