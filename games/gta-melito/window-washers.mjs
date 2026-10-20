/* GTA Melito — BF08: lavavetri ai semafori (di gioco, simulati: vedi junctions.mjs).
 * Il lavavetri aspetta sul marciapiede accanto al palo. Col rosso, quando la prima auto della coda
 * è ferma da almeno un secondo e il rosso che resta basta, scende, passa davanti al paraurti sulle
 * strisce e si ferma al finestrino del LATO GUIDA (in Italia a sinistra rispetto al senso di
 * marcia), lava il parabrezza per qualche secondo e torna sul marciapiede. Parte solo se il rosso
 * che resta basta per arrivare e lavare; al giallo o al verde rientra subito, e l'auto davanti alla
 * quale ripassa aspetta che lui sia passato (è un pedone del sistema di collisioni).
 * Moto e scooter vengono ignorati. Lo sprite è quello esistente del lavavetri (fermo durante il
 * lavaggio, nessun «camminare sul posto»); il tergivetro sul vetro è un piccolo effetto disegnato. */
import {signalAspect} from './junctions.mjs?v=003';
import {roadTrafficLaneOffset} from './road-widths.mjs?v=043';
import {vehicleShape,vehicleHitsPedestrian,nearbyColliders} from './traffic-collision.mjs?v=129';

export const WASHER_RULES=Object.freeze({walkSpeed:2.2,minWash:3,maxWash:6,stillBefore:1,margin:1,
 cooldown:[5,11],minLane:2.7,bubbleChance:.45,maxWashers:7});
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const hash=n=>{let x=(Number(n)||1)|0;x=Math.imul(x^x>>>16,2246822519);x=Math.imul(x^x>>>13,3266489917);return (x^x>>>16)>>>0;};
const rand=n=>hash(n)/4294967295;
const LINES_ASK=['Pulisco il vetro?','Vetro pulito, capo!','Una lavata, dottò?'];
const LINES_THANKS=['Grazie, capo!','Buona giornata!','Grazie assai!'];

/* Un posto per incrocio con semaforo: sul marciapiede dell'accesso più importante con spazio a
 * sinistra delle auto (corsia abbastanza lontana dalla mezzeria), un passo dietro al palo. */
export function washerSpots(graph,signals,{walkerOK=()=>true,occupied=[],max=WASHER_RULES.maxWashers}={}){
 const spots=[];
 for(const J of signals||[]){
  if(spots.length>=max)break;
  const approaches=[...J.approaches.values()].filter(A=>A.post&&roadTrafficLaneOffset(A.width)>=WASHER_RULES.minLane)
   .sort((a,b)=>b.rank-a.rank||a.edge-b.edge);
  for(const A of approaches){
   const e=graph.edges[A.edge],ux=Math.cos(e.angle),uy=Math.sin(e.angle),nx=-Math.sin(e.angle),ny=Math.cos(e.angle);
   let spot=null;
   for(const back of [.6,1.6,2.6]){
    const d=A.stop+.4+back,side=A.width/2+1.05,at={x:J.x-ux*d+nx*side,y:J.y-uy*d+ny*side,a:e.angle+Math.PI};
    if(walkerOK(at)&&occupied.every(q=>!q||Math.hypot(q.x-at.x,q.y-at.y)>=2.2)){spot=at;break;}
   }
   if(spot){spots.push({J,A,...spot});break;}
  }
 }
 return spots;
}
// Il mezzo fermo per primo alla linea d'arresto di questo accesso (traffico o auto del giocatore).
function firstInQueue(w,ctx){
 const {J,A}=w.washer,e=ctx.graph.edges[A.edge],ux=Math.cos(e.angle),uy=Math.sin(e.angle),nx=-Math.sin(e.angle),ny=Math.cos(e.angle);
 const candidates=[...ctx.traffic];
 if(ctx.playerCar)candidates.push(ctx.playerCar);
 let best=null,bestGap=Infinity;
 for(const v of candidates){
  if(!v||v.vehicleType==='motorcycle'||v.body==='walk')continue;
  const rx=v.x-J.x,ry=v.y-J.y,along=-(rx*ux+ry*uy),lateral=rx*nx+ry*ny,shape=vehicleShape(v);
  const gap=along-shape.halfLength-A.stop;
  if(gap<-1||gap>2.2||lateral<-.5||lateral>A.width/2)continue;
  if(Math.abs(Math.atan2(Math.sin(v.a-e.angle),Math.cos(v.a-e.angle)))>.6)continue;
  if(gap<bestGap){bestGap=gap;best=v;}
 }
 return best;
}
// Percorso: dal marciapiede davanti al paraurti (sulle strisce), poi lungo il fianco sinistro fino al
// finestrino del guidatore. Mai attraverso la carrozzeria.
function pathTo(w,car){
 const sh=vehicleShape(car),ca=Math.cos(car.a),sa=Math.sin(car.a),lx=Math.sin(car.a),ly=-Math.cos(car.a);
 const side=sh.halfWidth*1.4+.5,front=sh.halfLength*1.2+.9;
 const P=(f,l)=>({x:car.x+ca*f+lx*l,y:car.y+sa*f+ly*l});
 return {points:[{x:w.post.x,y:w.post.y},P(front,-side),P(front,side),P(sh.halfLength*.35,side)],window:P(sh.halfLength*.35,side),
  face:Math.atan2(car.y-(car.y+ly*side),car.x-(car.x+lx*side))};
}
const pathLength=points=>points.slice(1).reduce((s,p,i)=>s+Math.hypot(p.x-points[i].x,p.y-points[i].y),0);
function walkAlong(w,dt,ctx){
 const r=w.washer,pts=r.path;let left=WASHER_RULES.walkSpeed*dt;
 while(left>0&&r.at<pts.length){
  const q=pts[r.at],dx=q.x-w.x,dy=q.y-w.y,d=Math.hypot(dx,dy);
  if(d<1e-6){r.at++;continue;}
  const s=Math.min(1,left/d),nx=w.x+dx*s,ny=w.y+dy*s;
  // Non entra mai in un mezzo: se uno gli si para davanti, aspetta.
  for(const v of nearbyColliders(ctx.index,nx,ny,6)){
   if(v===w||(v.body||'car')!=='car')continue;
   if(vehicleHitsPedestrian(v,{x:nx,y:ny},.25)){w.braking=true;return false;}
  }
  w.a=Math.atan2(dy,dx);w.x=nx;w.y=ny;w.braking=false;left-=d*s;
  if(s<1)return false;
  r.at++;
 }
 return r.at>=pts.length;
}
function say(w,ctx,lines){
 const r=w.washer;
 if(rand(w.seed+(r.rounds||0)*31)>WASHER_RULES.bubbleChance)return;
 ctx.say?.(w,lines[(r.rounds||0)%lines.length]);
}
/* Un passo della routine. ctx: {graph,signalSeconds,traffic,playerCar,index,say}. */
export function stepWasher(w,dt,ctx){
 const r=w.washer;if(!r)return;
 r.clock=(r.clock||0)+dt;
 // Urtato: lascia la routine; la logica dei mestieri lo riporta al suo posto senza salti.
 if(w.impactTime>0||w.needsRoutineRecovery){if(r.phase!=='KERB'){r.phase='KERB';r.car=null;w.scripted=false;r.cool=r.clock+3;}return;}
 const aspect=signalAspect(r.J,r.A,ctx.signalSeconds);
 const red=aspect?.color==='red'?aspect.remaining:0;
 if(r.phase==='KERB'){
  w.scripted=false;
  if(!(red>0)||r.clock<(r.cool||0)){r.watch=null;return;}
  const car=firstInQueue(w,ctx);
  if(!car){r.watch=null;return;}
  // Ferma da almeno un secondo (le auto del traffico tengono la posizione esatta alla linea).
  if(r.watch?.car!==car||Math.hypot(car.x-r.watch.x,car.y-r.watch.y)>.05||Math.abs(car.speed||0)>.3&&car===ctx.playerCar){r.watch={car,x:car.x,y:car.y,since:r.clock};return;}
  if(r.clock-r.watch.since<WASHER_RULES.stillBefore)return;
  const plan=pathTo(w,car),walk=pathLength(plan.points)/WASHER_RULES.walkSpeed;
  const wash=WASHER_RULES.minWash+rand(w.seed+(r.rounds||0)*7)*(WASHER_RULES.maxWash-WASHER_RULES.minWash);
  if(red<walk+WASHER_RULES.minWash+WASHER_RULES.margin)return;
  Object.assign(r,{phase:'TO_CAR',car,path:plan.points,at:1,window:plan.window,face:plan.face,
   wash,player:car===ctx.playerCar,carAt:{x:car.x,y:car.y}});
  w.scripted=true;say(w,ctx,LINES_ASK);return;
 }
 // Ritorno sui propri passi: dal punto in cui si trova ai punti già raggiunti, fino al marciapiede.
 const visited=()=>[{x:w.x,y:w.y},...r.path.slice(0,Math.min(r.at,r.path.length)).reverse()];
 const back=()=>{r.path=visited();r.at=1;r.phase='BACK';};
 const carMoved=!r.car||Math.hypot(r.car.x-r.carAt.x,r.car.y-r.carAt.y)>.4;
 if(r.phase==='TO_CAR'){
  if(!(red>0)||carMoved){back();return;}
  if(walkAlong(w,dt,ctx)){r.phase='WASH';r.washStart=r.clock;w.a=r.face;w.braking=true;}
  return;
 }
 if(r.phase==='WASH'){
  w.a=r.face;w.braking=true;
  if(!(red>0)||carMoved||r.clock-r.washStart>=r.wash){
   if(!carMoved&&r.clock-r.washStart>=r.wash)say(w,ctx,LINES_THANKS);
   r.rounds=(r.rounds||0)+1;r.at=r.path.length;back();
  }
  return;
 }
 if(r.phase==='BACK'){
  if(walkAlong(w,dt,ctx)){
   Object.assign(w,{x:w.post.x,y:w.post.y,a:w.post.a??w.a,braking:true});w.scripted=false;
   r.phase='KERB';r.car=null;r.watch=null;
   r.cool=r.clock+WASHER_RULES.cooldown[0]+rand(w.seed+(r.rounds||0)*13)*(WASHER_RULES.cooldown[1]-WASHER_RULES.cooldown[0]);
  }
 }
}
// Il tergivetro sul parabrezza dal lato guida, avanti e indietro, con qualche goccia che brilla.
export function drawWasherEffects(c,washers,clock){
 for(const w of washers||[]){
  const r=w.washer;if(r?.phase!=='WASH'||!r.car)continue;
  const car=r.car,sh=vehicleShape(car),ca=Math.cos(car.a),sa=Math.sin(car.a),lx=Math.sin(car.a),ly=-Math.cos(car.a);
  const swing=Math.sin((clock-(r.washStart||0))*5.2),f=sh.halfLength*.62,l=sh.halfWidth*(.25+.45*(swing*.5+.5));
  const x=car.x+ca*f+lx*l,y=car.y+sa*f+ly*l;
  c.save();c.translate(x,y);c.rotate(car.a);
  c.fillStyle='#1d2b33';c.fillRect(-.12,-.75,.24,1.5);
  c.fillStyle='#8fd3ff';c.fillRect(.12,-.65,.18,1.3);
  c.restore();
  c.fillStyle='#e8f8ffb0';
  for(let k=0;k<3;k++){
   const s=Math.sin(clock*7+k*2.1+w.seed)*.5+.5,g=f-.4+k*.35,h=sh.halfWidth*(.15+.6*s);
   c.fillRect(car.x+ca*g+lx*h-.11,car.y+sa*g+ly*h-.11,.22,.22);
  }
 }
}
