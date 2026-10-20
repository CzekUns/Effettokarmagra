/* GTA Melito — BF07: incroci con buon senso e semafori di gioco.
 * Gli incroci sono quelli veri del grafo OSM (nodi dove si incontrano almeno tre strade carrabili).
 * SEMAFORI SIMULATI: l'istantanea OSM del gioco (data/melito-map.json) non contiene nodi
 * highway=traffic_signals, quindi i semafori sono POSIZIONAMENTI DI GIOCO scelti con una regola
 * sugli incroci principali, NON semafori rilevati né attribuiti alla città reale. */
import {roadTrafficLaneOffset} from './road-widths.mjs?v=043';
import {NPC_MINUTES_PER_SECOND} from './npc-agenda.mjs?v=001';
import {vehicleShape,vehiclesOverlap,nearbyColliders} from './traffic-collision.mjs?v=130';

// Nessun semaforo nei dati: quelli in gioco sono simulati (vedi README e scheda PAUSA).
export const SIGNALS_SIMULATED=true;
export const SIGNAL_NOTE='Semafori di gioco, non rilevati: posizionati sugli incroci principali, non sono quelli reali di Melito.';
export const ROAD_RANK=Object.freeze({motorway:6,trunk:6,primary:5,secondary:4,tertiary:3,unclassified:2,
 residential:1,living_street:1,service:0,track:0});
// Ciclo di 30 s (divide i 1.440 minuti del giorno: alla stessa ora corrisponde la stessa fase).
export const SIGNAL_TIMING=Object.freeze({cycle:30,green:10,yellow:3,allRed:2});
export const JUNCTION_RULES=Object.freeze({look:28,stallSeconds:6,reserveTimeout:5,yieldHorizon:2.5,
 comfortDecel:4.5,stopDecel:5});
const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const hash=n=>{let x=(Number(n)||1)|0;x=Math.imul(x^x>>>16,2246822519);x=Math.imul(x^x>>>13,3266489917);return (x^x>>>16)>>>0;};
const rank=type=>ROAD_RANK[type]??1;

// Le strisce pedonali di visuals.mjs (drawCrosswalks): stessa regola, così la linea d'arresto sta prima.
function crosswalkEdges(graph,nodeId){
 const node=graph.nodes[nodeId],cars=node.out.filter(id=>graph.edges[id].car);
 if(cars.length<3)return new Set();
 if(new Set(cars.map(id=>Math.round(graph.edges[id].angle*20))).size<3)return new Set();
 return new Set(cars.slice(0,4).filter(id=>graph.edges[id].len>=9));
}
/* Tutti gli incroci carrabili. r = mezza larghezza della via più larga (come junctionClearance di
 * BF03); stop = distanza dal centro della linea d'arresto di ogni accesso (dopo le strisce, se ci sono). */
export function buildJunctions(graph){
 const near=graph.nodes.map(()=>new Set()),width=new Float64Array(graph.nodes.length);
 for(const e of graph.edges){
  if(!e.car)continue;
  near[e.from].add(e.to);near[e.to].add(e.from);
  width[e.from]=Math.max(width[e.from],e.streetWidth);width[e.to]=Math.max(width[e.to],e.streetWidth);
 }
 const byNode=new Map(),list=[];
 graph.edges.forEach((e,id)=>{
  if(!e.car||near[e.to].size<3)return;
  let j=byNode.get(e.to);
  if(!j){const n=graph.nodes[e.to];j={node:e.to,x:n.x,y:n.y,r:width[e.to]/2,approaches:new Map(),signal:null,
   reserved:new Map(),moves:new Map(),crosswalks:crosswalkEdges(graph,e.to)};byNode.set(e.to,j);list.push(j);}
  const back=graph.nodes[e.to].out.find(o=>graph.edges[o].to===e.from&&graph.edges[o].car);
  const zebra=back!=null&&j.crosswalks.has(back)?Math.min(8,graph.edges[back].len*.45)+4.4:0;
  j.approaches.set(id,{edge:id,rank:rank(e.roadType),angle:e.angle,width:e.streetWidth,twoWay:back!=null,
   stop:Math.max(j.r+1.5,zebra),axis:0,post:null});
 });
 return {list,byNode,clockSeconds:0};
}
// Incroci principali per i semafori simulati: almeno 3 accessi con coda possibile, una strada
// terziaria o maggiore, nessun altro incrocio entro 20 m, distanza minima fra semafori.
export function chooseSignals(graph,junctions,{max=10,spacing=130,minApproach=22}={}){
 const isJunction=id=>junctions.byNode.has(id);
 const approachLength=edgeId=>{
  let e=graph.edges[edgeId],len=e.len,prev=e.to,from=e.from,hops=0;
  while(!isJunction(from)&&hops++<30){
   const back=graph.edges.findIndex(x=>x.car&&x.to===from&&x.from!==prev);
   if(back<0)break;
   len+=graph.edges[back].len;prev=from;from=graph.edges[back].from;
  }
  return len;
 };
 const candidates=[];
 for(const j of junctions.list){
  const approaches=[...j.approaches.values()];
  if(approaches.length<3)continue;
  if(Math.max(...approaches.map(a=>a.rank))<3)continue;
  if(junctions.list.some(o=>o!==j&&Math.hypot(o.x-j.x,o.y-j.y)<20))continue;
  if(approaches.filter(a=>approachLength(a.edge)>=minApproach).length<3)continue;
  candidates.push({j,score:approaches.reduce((s,a)=>s+a.rank,0)});
 }
 candidates.sort((a,b)=>b.score-a.score||a.j.node-b.j.node);
 const chosen=[];
 for(const {j} of candidates){
  if(chosen.length>=max)break;
  if(chosen.some(o=>Math.hypot(o.x-j.x,o.y-j.y)<spacing))continue;
  chosen.push(j);
  // Due fasi per asse: l'accesso di rango maggiore definisce l'asse 0, gli accessi quasi
  // paralleli (±45°) vanno con lui, gli altri formano l'asse 1.
  const approaches=[...j.approaches.values()].sort((a,b)=>b.rank-a.rank||a.edge-b.edge);
  const base=approaches[0].angle;
  for(const a of approaches){const d=Math.abs(wrap(2*(a.angle-base)))/2;a.axis=d<Math.PI/4?0:1;}
  j.signal={offset:hash(j.node*7919+13)%SIGNAL_TIMING.cycle,simulated:SIGNALS_SIMULATED};
 }
 return chosen;
}
// Fase del semaforo per un accesso: dipende solo dall'orologio di gioco (minuti NPC).
export function signalAspect(junction,approach,clockSeconds){
 if(!junction?.signal||!approach)return null;
 const {cycle,green,yellow,allRed}=SIGNAL_TIMING,half=cycle/2;
 const t=((clockSeconds+junction.signal.offset)%cycle+cycle)%cycle;
 const local=approach.axis===0?t:(t+half)%cycle;
 if(local<green)return {color:'green',remaining:green-local};
 if(local<green+yellow)return {color:'yellow',remaining:green+yellow-local};
 // Tutto rosso: subito dopo il proprio giallo e subito prima del proprio verde.
 return {color:'red',remaining:cycle-local,allRed:local<half||local>=cycle-allRed};
}
export function clockSecondsFromMinutes(minutes){return minutes/NPC_MINUTES_PER_SECOND;}

// Geometria della manovra dentro l'incrocio (corsia di ingresso → corsia di uscita), memorizzata.
function lanePoint(graph,edgeId,distanceFromNode,atEnd){
 const e=graph.edges[edgeId],node=graph.nodes[atEnd?e.to:e.from],u={x:Math.cos(e.angle),y:Math.sin(e.angle)};
 const off=roadTrafficLaneOffset(e.streetWidth),s=atEnd?-distanceFromNode:distanceFromNode;
 return {x:node.x+u.x*s-Math.sin(e.angle)*off,y:node.y+u.y*s+Math.cos(e.angle)*off};
}
export function movementOf(graph,junction,inEdge,outEdge){
 const key=inEdge+'>'+outEdge;
 if(junction.moves.has(key))return junction.moves.get(key);
 const a=graph.edges[inEdge],b=graph.edges[outEdge],r=Math.max(2.5,junction.r);
 const entry=lanePoint(graph,inEdge,r,true),exit=lanePoint(graph,outEdge,r,false);
 const turn=wrap(b.angle-a.angle);
 const points=[entry];
 if(Math.abs(turn)>.35&&Math.abs(turn)<2.8){
  // Spigolo della svolta: incontro delle due rette di corsia.
  const ux=Math.cos(a.angle),uy=Math.sin(a.angle),vx=Math.cos(b.angle),vy=Math.sin(b.angle);
  const cross=ux*vy-uy*vx,dx=exit.x-entry.x,dy=exit.y-entry.y,s=(dx*vy-dy*vx)/cross;
  if(Number.isFinite(s)&&s>0&&s<4*r)points.push({x:entry.x+ux*s,y:entry.y+uy*s});
 }else if(Math.abs(turn)>=2.8)points.push({x:junction.x,y:junction.y});
 points.push(exit);
 // In un'Italia con guida a destra (y verso il basso) la svolta a destra ha prodotto vettoriale > 0.
 const move={inEdge,outEdge,points,turn,kind:Math.abs(turn)<=.35?'straight':Math.abs(turn)>=2.8?'uturn':turn>0?'right':'left'};
 junction.moves.set(key,move);
 return move;
}
function segmentDistance(p,q,r,s){
 const d1x=q.x-p.x,d1y=q.y-p.y,d2x=s.x-r.x,d2y=s.y-r.y,den=d1x*d2y-d1y*d2x;
 if(Math.abs(den)>1e-9){
  const t=((r.x-p.x)*d2y-(r.y-p.y)*d2x)/den,u=((r.x-p.x)*d1y-(r.y-p.y)*d1x)/den;
  if(t>=0&&t<=1&&u>=0&&u<=1)return 0;
 }
 const point=(a,b,c)=>{const dx=c.x-b.x,dy=c.y-b.y,l=dx*dx+dy*dy,t=l?clamp(((a.x-b.x)*dx+(a.y-b.y)*dy)/l,0,1):0;
  return Math.hypot(a.x-b.x-dx*t,a.y-b.y-dy*t);};
 return Math.min(point(p,r,s),point(q,r,s),point(r,p,q),point(s,p,q));
}
// Due manovre sono in conflitto se finiscono nella stessa corsia o se i loro percorsi si avvicinano
// meno della somma delle mezze larghezze dei mezzi (due dritti opposti su corsie larghe non lo sono).
export function movementsConflict(m1,m2,width1=1.7,width2=1.7){
 // Dallo stesso accesso: è una coda, l'ordine lo danno la distanza e le collisioni.
 if(m1.inEdge===m2.inEdge)return false;
 if(m1.outEdge===m2.outEdge)return true;
 const limit=(width1+width2)*.92;
 for(let i=1;i<m1.points.length;i++)for(let k=1;k<m2.points.length;k++)
  if(segmentDistance(m1.points[i-1],m1.points[i],m2.points[k-1],m2.points[k])<limit)return true;
 return false;
}
// B arriva da destra rispetto ad A (precedenza a destra).
function fromRight(graph,ja,jb){
 const a=graph.edges[ja.inEdge],b=graph.edges[jb.inEdge];
 const bx=-Math.cos(b.angle),by=-Math.sin(b.angle);// dal centro verso il punto da cui arriva B
 return Math.cos(a.angle)*by-Math.sin(a.angle)*bx>.25;
}
function opposite(graph,ja,jb){
 const a=graph.edges[ja.inEdge],b=graph.edges[jb.inEdge];
 return Math.cos(a.angle)*Math.cos(b.angle)+Math.sin(a.angle)*Math.sin(b.angle)<-.7;
}
const stopped=v=>!!(v.braking||v.wait>0||v.impactTime>0||v.needsRoutineRecovery||v.backoff>0);

/* Decisione di un'auto (o moto) del traffico che si avvicina al prossimo incrocio del suo percorso.
 * Ritorna la distanza che il centro del mezzo può ancora percorrere (Infinity = libero) e il motivo.
 * jx: {J,A,dist,inEdge,outEdge,landing} calcolato da roads.mjs sullo stesso percorso di nextPose. */
export function junctionDecision(graph,agent,jx,ctx){
 const J=jx.J,A=jx.A,shape=vehicleShape(agent),move=movementOf(graph,J,jx.inEdge,jx.outEdge);
 const gap=jx.dist-shape.halfLength-A.stop;
 // Freccia: lampeggia negli ultimi 30 m prima della svolta e finché il mezzo è nell'incrocio.
 agent.turnSignal=gap<30&&(move.kind==='left'||move.kind==='right')?move.kind:null;
 // Chi è già oltre la linea d'arresto libera sempre l'incrocio.
 if(gap<-.3||J.reserved.has(agent)){
  if(!J.reserved.has(agent))J.reserved.set(agent,{move,width:shape.halfWidth,since:ctx.time,dist:jx.dist});
  const own=J.reserved.get(agent);own.dist=Math.min(own.dist,jx.dist);
  // Un permesso dato a chi è ancora prima della linea scade se resta fermo (non monopolizza).
  if(gap>=0&&stopped(agent)&&ctx.time-own.since>JUNCTION_RULES.reserveTimeout)J.reserved.delete(agent);
  else return {limit:Infinity,reason:null};
 }
 // BF05: agent.v è la velocità vera (agent.speed è la crociera desiderata).
 const speed=Math.max(0,agent.braking?0:Number.isFinite(agent.v)?agent.v:agent.speed||0);
 if(gap>Math.max(JUNCTION_RULES.look,speed*speed/(2*JUNCTION_RULES.comfortDecel)+8))return {limit:Infinity,reason:null};
 let reason=null;
 // 1. Semaforo (simulato): rosso si ferma; giallo si ferma se ha lo spazio, altrimenti passa.
 const aspect=signalAspect(J,A,ctx.signalSeconds);
 if(aspect?.color==='red')reason='rosso';
 else if(aspect?.color==='yellow'&&gap>speed*speed/(2*JUNCTION_RULES.stopDecel)+.5)reason='giallo';
 const grantDistance=Math.max(3,speed*1.3+2);
 if(!reason&&gap>grantDistance)return {limit:Infinity,reason:null,aspect};
 // 2. Incrocio occupato da una manovra in conflitto (un'auto alla volta).
 if(!reason)for(const [other,held] of J.reserved){
  if(other===agent)continue;
  if(movementsConflict(move,held.move,shape.halfWidth,held.width)){reason='incrocio';agent.jBlocker=other;break;}
 }
 if(!reason&&ctx.player&&ctx.player.body==='car'&&Math.hypot(ctx.player.x-J.x,ctx.player.y-J.y)<J.r+2.5)reason='incrocio';
 // 3. Non impegnare l'incrocio se all'uscita non c'è posto per tutta la sagoma.
 if(!reason&&jx.landing){
  const pose={...jx.landing,vehicleType:agent.vehicleType,model:agent.model};
  for(const other of nearbyColliders(ctx.index,pose.x,pose.y,10)){
   if(other===agent||(other.body||'car')!=='car'||!(ctx.traffic.has(other)||other===ctx.player))continue;
   if((other===ctx.player||stopped(other))&&vehiclesOverlap(pose,other,.6)){reason='uscita';agent.jBlocker=other;break;}
  }
 }
 // 4. Precedenze: semaforo verde → chi gira a sinistra cede a chi arriva di fronte; senza semaforo
 // → strada di rango maggiore, a parità precedenza a destra. Fra mezzi fermi passa chi aspetta da
 // più tempo (nessun blocco circolare), e dopo stallSeconds si passa comunque se il resto è libero.
 if(!reason&&(agent.jWait||0)<JUNCTION_RULES.stallSeconds)for(const other of ctx.approaching.get(J)||[]){
  const ox=other.jx;
  if(other===agent||!ox||ox.inEdge===jx.inEdge||J.reserved.has(other))continue;
  const om=movementOf(graph,J,ox.inEdge,ox.outEdge);
  if(!movementsConflict(move,om,shape.halfWidth,vehicleShape(other).halfWidth))continue;
  const oAspect=signalAspect(J,ox.A,ctx.signalSeconds);
  let priority;
  if(J.signal){
   if(oAspect?.color==='red')continue;
   priority=move.kind==='left'&&om.kind!=='left'&&opposite(graph,jx,ox);
  }else{
   priority=ox.A.rank>A.rank||ox.A.rank===A.rank&&(fromRight(graph,jx,ox)||
    move.kind==='left'&&om.kind!=='left'&&opposite(graph,jx,ox));
  }
  if(!priority)continue;
  const oGap=ox.dist-vehicleShape(other).halfLength-ox.A.stop;
  const oSpeed=stopped(other)?0:Number.isFinite(other.v)?other.v:other.speed||0;
  if(oSpeed>.5){if(oGap<oSpeed*JUNCTION_RULES.yieldHorizon+3){reason='precedenza';agent.jBlocker=other;break;}}
  else if(oGap<1.5&&((other.jWait||0)>(agent.jWait||0)||(other.jWait||0)===(agent.jWait||0)&&(other.seed|0)<(agent.seed|0))){reason='precedenza';agent.jBlocker=other;break;}
 }
 if(!reason){J.reserved.set(agent,{move,width:shape.halfWidth,since:ctx.time,dist:jx.dist});return {limit:Infinity,reason:null,aspect};}
 return {limit:Math.max(0,gap),reason,aspect};
}
// Pulizia dei permessi: chi è uscito dall'incrocio (o è stato riposizionato) lo libera.
export function pruneReservations(junction){
 for(const [agent,held] of junction.reserved){
  // Sempre lo stesso passaggio: stesso accesso e distanza che cala (un giro dell'isolato che
  // riporta allo stesso incrocio è un nuovo passaggio, senza permesso).
  if(agent.jx?.J===junction&&agent.jx.inEdge===held.move.inEdge&&agent.jx.dist<=held.dist+3)continue;
  const reach=junction.r+vehicleShape(agent).halfLength+1;
  if(Math.hypot(agent.x-junction.x,agent.y-junction.y)>reach)junction.reserved.delete(agent);
 }
}
/* Pedoni agli incroci con semaforo: attraversano con il verde della strada parallela al loro
 * cammino (le auto che incrociano hanno rosso). crossingOwnRoad = attraversano la propria via. */
export function pedestrianMayCross(junction,walkAngle,crossingOwnRoad,clockSeconds,need=4){
 if(!junction?.signal)return true;
 let best=null,bestD=Infinity;
 for(const a of junction.approaches.values()){
  const d=Math.abs(wrap(2*(a.angle-walkAngle)))/2;
  if(d<bestD){bestD=d;best=a;}
 }
 if(!best)return true;
 const aspect=signalAspect(junction,best,clockSeconds);
 if(crossingOwnRoad)return aspect.color==='red'&&aspect.remaining>need;
 return aspect.color==='green'&&aspect.remaining>need;
}
