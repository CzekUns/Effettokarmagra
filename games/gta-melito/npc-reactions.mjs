/* GTA Melito — Q13: reazioni dei passanti e del traffico.
 * - Scansarsi: un pedone sulla traiettoria di un mezzo in arrivo (traffico o giocatore, anche sul
 *   marciapiede) reagisce a gradi: si gira a guardarlo, affretta il passo, salta di lato su un punto
 *   calpestabile; poi torna al suo percorso con il recupero esistente. Cooldown per pedone.
 * - Varco: al cordolo di un incrocio e prima di attraversare a metà isolato il pedone aspetta che
 *   nessun mezzo in movimento arrivi entro il tempo che gli serve per passare.
 * - Attraversamento a metà isolato verso il marciapiede opposto (le auto NPC frenano: roads.mjs).
 * - Vetrine: chi passa davanti a un negozio si ferma qualche secondo a guardare.
 * - Clacson NPC solo se a bloccare è il giocatore o un pedone in carreggiata; cooldown e limite.
 * Ogni posizione nuova passa da ctx.canStand: niente pedoni dentro muri o edifici. */
import {lanePosition,DRIVABLE} from './roads.mjs?v=161';
import {vehicleShape,vehicleHitsPedestrian} from './traffic-collision.mjs?v=128';

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const rand=n=>{const x=Math.sin(n*12.9898)*43758.5453;return x-Math.floor(x);};
export const REACTION_RULES=Object.freeze({
 range:40,corridor:1.1,lookTtc:2.8,hurryTtc:1.7,jumpTtc:1.1,jumpDistance:3.6,lookSeconds:.5,
 // il salto porta il pedone fuori dalla sagoma del mezzo più jumpClear metri, al massimo jumpMax
 hurryFactor:1.9,hurrySeconds:1.3,jumpSpeed:4.6,jumpClear:1.3,jumpMax:3.2,cooldown:4,
 // varco: tempo per passare = larghezza / passo + margine; il margine cala un po' con l'attesa
 crossSpeed:1.35,gapMargin:1.3,gapMinMargin:.35,impatience:.06,maxCrossWait:14,kerbReach:1.6,
 crossEvery:3,crossCooldown:[30,70],crossNear:140,minStreet:5,maxStreet:24,nodeClear:12,
 shopRange:6.5,shopEvery:[50,110],shopSeconds:[2.5,5],
 hornStall:1.6,hornPedestrianWait:2,hornRange:60,hornCar:12,hornGlobal:4,hornWindow:20,hornMax:3,
 bubbleCooldown:6
});
export function createReactions(seed=1313){
 return {seed,clock:0,checks:0,alarm:null,horns:{last:-1e9,byCar:new WeakMap(),recent:[]},
  lastBubble:-1e9,shopUsed:new WeakMap(),log:[],crossRequests:new Map()};
}
const note=(r,type,extra={})=>{r.log.push({type,t:+r.clock.toFixed(2),...extra});if(r.log.length>200)r.log.shift();};

/* Rischio che un mezzo in movimento porta a un pedone: ttc = secondi prima che il muso arrivi
 * al pedone, se il pedone è nel corridoio del mezzo; null se non è sulla sua strada. */
// Velocità vera: per il traffico NPC `speed` è la crociera, quella reale è `v` (BF05); ferma se frena.
export function speedOf(v){
 if(v.edge!=null&&v.body==='car')return v.braking?0:Number.isFinite(v.v)?v.v:Number(v.speed)||0;
 return Number(v.speed)||0;
}
export function vehicleThreat(ped,v){
 const speed=speedOf(v);
 if(Math.abs(speed)<1.5)return null;
 const dir=speed<0?-1:1,hx=Math.cos(v.a)*dir,hy=Math.sin(v.a)*dir;
 const dx=ped.x-v.x,dy=ped.y-v.y,along=dx*hx+dy*hy,lateral=Math.abs(-dx*hy+dy*hx);
 const shape=vehicleShape(v);
 if(along<=0||lateral>shape.halfWidth+REACTION_RULES.corridor)return null;
 const gap=Math.max(0,along-shape.halfLength);
 return {ttc:gap/Math.abs(speed),gap,lateral,along,side:Math.sign(-dx*hy+dy*hx)||1,hx,hy};
}
// I lavavetri (BF08) hanno la loro routine al semaforo: window-washers.mjs li muove e li tiene al sicuro.
const reactive=a=>a&&a.body==='walk'&&!a.indoors&&!a.commuter&&!a.frozen&&!a.washer&&!(a.impactTime>0);
// Il salto di lato è riservato a chi cammina libero (non dentro una porta, non in sella).
const canJump=a=>reactive(a)&&!a.residentRoutine?.doorStep&&!a.crossing;
function say(r,ctx,agent,text){
 if(!ctx.say||r.clock-r.lastBubble<REACTION_RULES.bubbleCooldown)return;
 r.lastBubble=r.clock;ctx.say(agent,text);
}
function startHurry(a){
 if(!(a.hurry>0))a.baseSpeed=a.speed;
 a.hurry=REACTION_RULES.hurrySeconds;a.speed=a.baseSpeed*REACTION_RULES.hurryFactor;
}
function endHurry(a){if(a.baseSpeed!==undefined){a.speed=a.baseSpeed;delete a.baseSpeed;}a.hurry=0;}
// Di lato, fuori dalla sagoma del mezzo: prima il lato verso cui è già spostato e fuori dalla
// carreggiata; mai in un muro (ogni punto del salto passa da canStand).
function jumpVector(a,t,v,ctx){
 const R=REACTION_RULES,half=vehicleShape(v).halfWidth+R.jumpClear;
 const options=[t.side,-t.side].map(s=>({s,x:-t.hy*s,y:t.hx*s,reach:half+(s===t.side?-t.lateral:t.lateral)}))
  .filter(q=>q.reach<=R.jumpMax).map(q=>({...q,reach:Math.max(.8,q.reach)}));
 const ok=q=>{for(const f of [.25,.5,.75,1]){if(!ctx.canStand(a.x+q.x*q.reach*f,a.y+q.y*q.reach*f))return false;}return true;};
 const good=options.filter(ok);
 if(!good.length)return null;
 good.sort((p,q)=>(ctx.onRoad?.(a.x+p.x*p.reach,a.y+p.y*p.reach)?1:0)-(ctx.onRoad?.(a.x+q.x*q.reach,a.y+q.y*q.reach)?1:0)||
  p.reach-q.reach);
 return good[0];
}
function stepJump(r,a,dt,ctx){
 const R=REACTION_RULES,step=Math.min(a.dodge,dt),nx=a.x+a.dodgeV.x*R.jumpSpeed*step,ny=a.y+a.dodgeV.y*R.jumpSpeed*step;
 if(ctx.canStand(nx,ny)&&!(ctx.vehicles||[]).some(v=>vehicleHitsPedestrian(v,{x:nx,y:ny},.15))){a.x=nx;a.y=ny;}
 a.a=Math.atan2(a.dodgeV.y,a.dodgeV.x);a.braking=false;
 a.dodge=Math.max(0,a.dodge-dt);
 if(a.dodge<=0){
  a.dodge=0;a.dodgeV=null;a.reactCool=R.cooldown;
  // Torna al suo marciapiede con il recupero esistente (roads.mjs / resident-routines.mjs);
  // chi lavora a un posto fisso (friggitore, vigile, lavavetri) ci ritorna da solo.
  if(!a.stationary&&Math.hypot(a.x-a.dodgeFrom.x,a.y-a.dodgeFrom.y)>.2)a.needsRoutineRecovery=true;
  a.dodgeFrom=null;
 }
}
// Il mezzo più pericoloso per questo pedone, tra quelli in movimento (lista fatta una volta per passo).
function worstThreat(a,ctx){
 let best=null;const range=REACTION_RULES.range;
 for(const v of ctx.moving||ctx.vehicles||[]){
  if(v===a||Math.abs(v.x-a.x)>range||Math.abs(v.y-a.y)>range)continue;
  const t=vehicleThreat(a,v);
  if(t&&(!best||t.ttc<best.t.ttc))best={v,t};
 }
 return best;
}
/* Un passo di reazioni per tutti i pedoni vicini al giocatore (gli altri non hanno pubblico). */
export function stepReactions(r,dt,ctx){
 const R=REACTION_RULES;r.clock+=dt;
 // Solo i mezzi che si muovono davvero possono minacciare qualcuno: una lista sola per tutto il passo.
 ctx={...ctx,moving:(ctx.vehicles||[]).filter(v=>Math.abs(speedOf(v))>=1.5)};
 const alarm=r.alarm&&r.clock-(r.alarm.t??-1e9)<.5?r.alarm:null;
 for(const a of ctx.people){
  if(!reactive(a))continue;
  if(a.reactCool>0)a.reactCool=Math.max(0,a.reactCool-dt);
  if(a.shopStop>0)a.shopStop=a.wait>0?Math.max(0,a.shopStop-dt):0;
  if(a.kerbGo!=null&&(a.edge!==a.kerbGo||a.t<.5))a.kerbGo=null;
  if(a.hurry>0){a.hurry-=dt;if(a.hurry<=0)endHurry(a);}
  if(a.dodge>0){stepJump(r,a,dt,ctx);continue;}
  if(a.crossing){stepCrossing(r,a,dt,ctx);continue;}
  if(ctx.focus&&Math.hypot(a.x-ctx.focus.x,a.y-ctx.focus.y)>ctx.focusRadius)continue;
  // Un clacson vicino: chi è davanti all'auto si sbriga.
  if(alarm&&!(a.hurry>0)&&Math.hypot(alarm.x-a.x,alarm.y-a.y)<12){startHurry(a);note(r,'hurry',{why:'clacson'});}
  if(a.lookAt){a.lookAt.time-=dt;a.a=Math.atan2(a.lookAt.y-a.y,a.lookAt.x-a.x);a.braking=true;if(a.lookAt.time<=0)a.lookAt=null;}
  const hit=worstThreat(a,ctx);
  if(!hit){a.lookAt=null;continue;}
  const {v,t}=hit;
  // Il salto è una salvezza: anche durante il cooldown, ma solo se l'urto è davvero vicino.
  if((t.ttc<R.jumpTtc||t.gap<R.jumpDistance)&&canJump(a)&&(!(a.reactCool>0)||t.ttc<.6)){
   const dir=jumpVector(a,t,v,ctx);
   if(dir){
    a.lookAt=null;a.dodge=dir.reach/R.jumpSpeed;a.dodgeV={x:dir.x,y:dir.y};a.dodgeFrom={x:a.x,y:a.y};
    // Una chiacchiera, una sosta in vetrina o un'attesa al cordolo finiscono qui.
    a.wait=0;a.shopStop=0;a.kerbWait=false;
    const byPlayer=v.isPlayer||v===ctx.playerVehicle;
    note(r,'jump',{by:byPlayer?'player':'npc'});
    say(r,ctx,a,byPlayer?'Uè, piano!':'Mamma mia!');
    continue;
   }
  }
  if(t.ttc<R.hurryTtc){
   a.lookAt=null;
   if(!(a.hurry>0)){startHurry(a);note(r,'hurry',{why:'mezzo'});}
  }else if(t.ttc<R.lookTtc&&!(a.reactCool>0)&&!a.lookAt&&!(a.hurry>0)&&!ctx.onRoad?.(a.x,a.y)){
   // Fuori dalla carreggiata: si gira a guardare il mezzo che arriva, poi decide.
   a.lookAt={x:v.x,y:v.y,time:R.lookSeconds};a.reactCool=R.cooldown*.5;note(r,'look');
  }
 }
 r.checks++;
 if(ctx.graph&&r.checks%Math.round(R.crossEvery/Math.max(dt,.01))===0)planCrossings(r,ctx);
 if(ctx.shops?.length)windowShopping(r,ctx);
}

/* ---- Varco ---- */
/* Varco vero, corsia per corsia: un mezzo in arrivo conta solo se passerà sul punto in cui il
 * pedone attraversa la SUA traiettoria mentre il pedone è lì (più un margine). Chi passa prima che
 * il pedone arrivi alla sua corsia, o arriva dopo che l'ha lasciata, non chiude il varco. Un mezzo
 * fermo sopra il passaggio lo chiude. `waited` riduce un poco il margine (pazienza), mai sotto il
 * minimo. Ritorna il mezzo più vicino nel tempo che chiude il varco, o null. */
export function crossingThreat(from,to,vehicles,waited=0){
 const R=REACTION_RULES,len=Math.hypot(to.x-from.x,to.y-from.y)||1,cx=(to.x-from.x)/len,cy=(to.y-from.y)/len;
 const margin=Math.max(R.gapMinMargin,R.gapMargin-R.impatience*waited);
 let worst=null;
 for(const v of vehicles){
  const speed=Math.abs(speedOf(v)),shape=vehicleShape(v);
  if(speed<1){
   for(let k=0;k<=8;k++){const q={x:from.x+cx*len*k/8,y:from.y+cy*len*k/8};if(vehicleHitsPedestrian(v,q,.4))return {time:0,v};}
   continue;
  }
  const dir=speedOf(v)<0?-1:1,hx=Math.cos(v.a)*dir,hy=Math.sin(v.a)*dir;
  const den=cx*hy-cy*hx;
  // Traiettoria del mezzo quasi parallela al passaggio: conta solo se è già lì vicino, davanti.
  if(Math.abs(den)<.25){
   const t=vehicleThreat({x:from.x+cx*len/2,y:from.y+cy*len/2},v);
   if(t&&t.gap<20){const time=t.gap/speed;if(!worst||time<worst.time)worst={time,v};}
   continue;
  }
  // from + c·s = v + h·u  →  s lungo il passaggio, u davanti al mezzo
  const wx=v.x-from.x,wy=v.y-from.y,s=(wx*hy-wy*hx)/den,u=(wx*cy-wy*cx)/den;
  // già passato con tutta la sagoma: non conta
  if(s<-2||s>len+2||u<-(shape.halfLength+.5))continue;
  const arrive=Math.max(0,u-shape.halfLength-.5)/speed,leave=(u+shape.halfLength+.5)/speed;
  const pedIn=Math.max(0,s-shape.halfWidth-.6)/R.crossSpeed,pedOut=(s+shape.halfWidth+.6)/R.crossSpeed;
  if(arrive<pedOut+margin&&leave>pedIn-margin&&(!worst||arrive<worst.time))worst={time:arrive,v};
 }
 return worst;
}
/* Al cordolo di un incrocio senza semaforo (roads.mjs → world.kerbWait): true = aspetta.
 * Il cordolo è dove inizia la carreggiata della traversa più larga; si guarda il passaggio dritto
 * fino al cordolo opposto. Chi è già sceso dal cordolo non torna indietro. */
export function kerbWait(r,a,graph,ctx){
 const waiting=kerbWaitDecision(r,a,graph,ctx);
 // Q22: chi non aspetta più al cordolo non chiede più la precedenza alle strisce.
 if(!waiting)r.crossRequests?.delete(a);
 return waiting;
}
function kerbWaitDecision(r,a,graph,ctx){
 const R=REACTION_RULES;
 if(a.residentRoutine||a.corner||a.edge==null||a.crossing)return false;
 const edge=graph.edges[a.edge];if(!edge)return false;
 if(a.kerbGo===a.edge)return false;
 // Semafori: sono di BF07 (graph.intersections), qui solo gli incroci senza.
 if(graph.intersections?.byNode?.get?.(edge.to)?.signal)return false;
 const node=graph.nodes[edge.to];
 const side=node.out.map(id=>graph.edges[id]).filter(e=>DRIVABLE.has(e.roadType)&&Math.abs(Math.sin(e.angle-edge.angle))>.5);
 if(!side.length){a.kerbGo=a.edge;return false;}
 const radius=Math.max(...side.map(e=>e.streetWidth/2))+1,left=(1-a.t)*edge.len;
 if(left>radius+R.kerbReach){a.kerbWait=false;a.kerbWaited=0;return false;}
 if(left<radius-1.5&&!a.kerbWait){a.kerbGo=a.edge;return false;}
 const waited=a.kerbWaited||0,ux=Math.cos(edge.angle),uy=Math.sin(edge.angle);
 const from={x:a.x,y:a.y},to={x:a.x+ux*(left+radius),y:a.y+uy*(left+radius)};
 // Q22: un'auto che si sta fermando per lasciarlo passare (giveWayTo) non chiude il varco.
 const threat=crossingThreat(from,to,(ctx.vehicles||[]).filter(v=>Math.hypot(v.x-node.x,v.y-node.y)<90&&
  !(v.giveWayTo===a&&Math.abs(speedOf(v))<4)),waited);
 if(threat&&waited<R.maxCrossWait){
  if(!a.kerbWait)note(r,'kerb-wait');
  a.kerbWait=true;a.kerbWaited=waited+(ctx.dt||.05);a.braking=true;
  // Q22: dopo 1 s al cordolo il pedone chiede la precedenza alle strisce (roads.mjs → crosswalkYield).
  if(a.kerbWaited>=1&&r.crossRequests)r.crossRequests.set(a,{ped:a,from,to});
  a.a=Math.atan2(threat.v.y-a.y,threat.v.x-a.x);
  return true;
 }
 if(a.kerbWait)note(r,'kerb-go',{waited:+waited.toFixed(1)});
 a.kerbWait=false;a.kerbWaited=0;a.kerbGo=a.edge;
 return false;
}

/* ---- Attraversamento a metà isolato ---- */
function planCrossings(r,ctx){
 const R=REACTION_RULES,graph=ctx.graph;
 for(const a of ctx.people){
  if(!reactive(a)||a.residentRoutine||a.social?.hold||a.corner||a.crossing||a.dodge>0||a.wait>0||
     a.needsRoutineRecovery||a.kerbWait||a.edge==null||a.profession||a.stationary)continue;
  if(ctx.focus&&Math.hypot(a.x-ctx.focus.x,a.y-ctx.focus.y)>R.crossNear)continue;
  if((a.crossAt??0)>r.clock)continue;
  const edge=graph.edges[a.edge];
  // Anche un senso unico è una carreggiata da attraversare (l'arco opposto non è "car").
  if(!edge||!DRIVABLE.has(edge.roadType)||!(edge.streetWidth>=R.minStreet&&edge.streetWidth<=R.maxStreet))continue;
  const along=a.t*edge.len;
  if(along<R.nodeClear||edge.len-along<R.nodeClear+4)continue;
  const seed=(a.seed|0)*31+r.checks;
  a.crossAt=r.clock+R.crossCooldown[0]+rand(seed)*(R.crossCooldown[1]-R.crossCooldown[0]);
  const shopOpposite=(ctx.shops||[]).some(s=>Math.hypot(s.x-a.x,s.y-a.y)<30&&
   ((s.x-a.x)*-Math.sin(edge.angle)+(s.y-a.y)*Math.cos(edge.angle))*(a.side||1)<0);
  if(rand(seed+7)>(shopOpposite?.6:a.routine==='errand'?.35:.2))continue;
  if(startCrossing(r,a,ctx))note(r,'cross-plan',{shop:shopOpposite});
 }
}
/* Prepara l'attraversamento verso il marciapiede opposto dello stesso tratto, se il passaggio è
 * libero (niente muri, niente auto in sosta di mezzo). Il pedone poi aspetta il varco. */
export function startCrossing(r,a,ctx){
 const graph=ctx.graph,edge=graph.edges[a.edge];if(!edge)return false;
 const side=-(a.side||1),to=lanePosition(graph,a.edge,a.t,'walk',side);
 if(!ctx.canStand(to.x,to.y)||graph.isWalkBlocked?.(a.edge,side))return false;
 const len=Math.hypot(to.x-a.x,to.y-a.y);
 if(len<3||len>edge.streetWidth+6)return false;
 for(let k=1;k<12;k++){
  const q={x:a.x+(to.x-a.x)*k/12,y:a.y+(to.y-a.y)*k/12};
  if(!ctx.canStand(q.x,q.y)||(ctx.parked||[]).some(v=>Math.hypot(v.x-q.x,v.y-q.y)<6&&vehicleHitsPedestrian(v,q,.3)))return false;
 }
 a.crossing={phase:'wait',from:{x:a.x,y:a.y},to,edge:a.edge,t:a.t,side,len,waited:0,walked:0};
 a.braking=true;a.wait=0;
 return true;
}
function stepCrossing(r,a,dt,ctx){
 const R=REACTION_RULES,c=a.crossing;
 // Un urto o un recupero chiudono l'attraversamento senza lasciare stati appesi.
 if(a.needsRoutineRecovery||a.impactTime>0){a.crossing=null;return;}
 const toward=Math.atan2(c.to.y-c.from.y,c.to.x-c.from.x);
 if(c.phase==='wait'){
  const threat=crossingThreat(c.from,c.to,(ctx.vehicles||[]).filter(v=>Math.hypot(v.x-c.from.x,v.y-c.from.y)<220),c.waited);
  a.braking=true;
  if(!threat){c.phase='go';note(r,'cross-go',{waited:+c.waited.toFixed(1)});return;}
  c.waited+=dt;
  // Guarda il mezzo che arriva, poi di nuovo la strada.
  a.a=Math.floor(c.waited*1.4)%2?toward:Math.atan2(threat.v.y-a.y,threat.v.x-a.x);
  if(c.waited>R.maxCrossWait){a.crossing=null;a.braking=false;note(r,'cross-giveup');}
  return;
 }
 const dx=c.to.x-a.x,dy=c.to.y-a.y,d=Math.hypot(dx,dy);
 // In mezzo alla strada non si torna indietro: se arriva qualcuno si accelera.
 const danger=worstThreat(a,ctx);
 const speed=R.crossSpeed*(danger&&danger.t.ttc<2?1.7:1);
 const step=Math.min(d,speed*dt),nx=a.x+dx/d*step,ny=a.y+dy/d*step;
 a.a=toward;
 if(!ctx.canStand(nx,ny)||(ctx.vehicles||[]).some(v=>vehicleHitsPedestrian(v,{x:nx,y:ny},.1))){
  a.braking=true;c.blocked=(c.blocked||0)+dt;
  if(c.blocked>6){a.crossing=null;a.needsRoutineRecovery=true;note(r,'cross-abort');}
  return;
 }
 a.x=nx;a.y=ny;a.braking=false;c.walked+=step;
 if(d-step<.05){
  const pose=lanePosition(ctx.graph,c.edge,c.t,'walk',c.side);
  Object.assign(a,{x:pose.x,y:pose.y,a:pose.a,edge:c.edge,t:c.t,side:c.side,corner:null,crossing:null,braking:false});
  a.reactCool=R.cooldown;note(r,'crossed');
 }
}

/* ---- Vetrine ---- */
function windowShopping(r,ctx){
 const R=REACTION_RULES;
 if(r.checks%10)return;
 for(const a of ctx.people){
  if(!reactive(a)||a.residentRoutine||a.profession||a.stationary||a.social?.hold||a.corner||a.crossing||a.dodge>0||
     a.wait>0||a.braking||a.needsRoutineRecovery||a.kerbWait||a.edge==null)continue;
  if(ctx.focus&&Math.hypot(a.x-ctx.focus.x,a.y-ctx.focus.y)>R.crossNear)continue;
  if((a.shopAt??0)>r.clock)continue;
  const shop=(ctx.shops||[]).find(s=>Math.abs(s.x-a.x)<R.shopRange&&Math.abs(s.y-a.y)<R.shopRange&&
   Math.hypot(s.x-a.x,s.y-a.y)<R.shopRange&&(r.shopUsed.get(s)??-1e9)<r.clock-20);
  if(!shop)continue;
  const seed=(a.seed|0)*17+r.checks;
  a.shopAt=r.clock+R.shopEvery[0]+rand(seed)*(R.shopEvery[1]-R.shopEvery[0]);
  if(rand(seed+3)>(a.routine==='stroller'?.6:a.routine==='errand'?.45:.2))continue;
  if(!ctx.canStand(a.x,a.y))continue;
  r.shopUsed.set(shop,r.clock);
  a.wait=R.shopSeconds[0]+rand(seed+5)*(R.shopSeconds[1]-R.shopSeconds[0]);a.shopStop=a.wait;
  a.a=Math.atan2(shop.y-a.y,shop.x-a.x);a.braking=true;
  note(r,'shop',{name:shop.name});
 }
}

/* ---- Clacson NPC ---- */
/* Un'auto NPC ferma da un po' suona solo se a bloccarla è il giocatore (a piedi o in auto) o un
 * pedone in carreggiata; mai per la coda dietro un'altra auto. Una per auto ogni 12 s, una in
 * città ogni 4 s, al massimo 3 in 20 s, solo vicino al giocatore. */
export function pickBlockedHorn(r,traffic,ctx){
 const R=REACTION_RULES,h=r.horns,now=r.clock;
 if(now-h.last<R.hornGlobal)return null;
 h.recent=h.recent.filter(t=>now-t<R.hornWindow);
 if(h.recent.length>=R.hornMax)return null;
 for(const v of traffic){
  if(v.body!=='car'||v.commuterBike||!ctx.player||Math.hypot(v.x-ctx.player.x,v.y-ctx.player.y)>R.hornRange)continue;
  if((h.byCar.get(v)??-1e9)>now-R.hornCar)continue;
  const by=v.blockedBy,ped=v.yieldPed;
  const playerBlocks=by&&(by.isPlayer||by===ctx.playerVehicle);
  const pedBlocks=by&&by.body==='walk'&&!by.isPlayer&&ctx.onRoad?.(by.x,by.y);
  const pedWaits=ped&&(v.yieldWait||0)>R.hornPedestrianWait&&(ped.isPlayer||ctx.onRoad?.(ped.x,ped.y));
  if(!(((v.stalled||0)>R.hornStall&&(playerBlocks||pedBlocks))||pedWaits))continue;
  h.last=now;h.byCar.set(v,now);h.recent.push(now);
  note(r,'horn',{by:playerBlocks||ped?.isPlayer?'player':'pedone'});
  return v;
 }
 return null;
}
