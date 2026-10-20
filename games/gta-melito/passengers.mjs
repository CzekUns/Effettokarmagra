/* GTA Melito — Q21: posti e passeggeri su auto, Ape, furgoni e scooter.
 * Ogni veicolo ha una capienza di passeggeri (guidatore escluso). Un posto è libero oppure
 * occupato da UN solo NPC: associazione stabile NPC ↔ mezzo ↔ posto (vehicle.seats[i] ↔
 * npc.aboard={vehicle,seat}). Gli NPC a bordo del giocatore sono pedoni veri tolti dal
 * marciapiede finché viaggiano; quelli del traffico sono identità fisse legate al mezzo
 * (seed del mezzo), sempre gli stessi sugli stessi posti.
 * Misure e posizioni sono in unità di gioco del corpo disegnato: con `scale` seguono una scala
 * generale dei veicoli (BF14) senza toccare il resto.
 * Le teste si vedono attraverso parabrezza e lunotto; sullo scooter il passeggero siede dietro,
 * disegnato sotto il guidatore e con casco e giacca diversi, così non sembra un'unica figura. */
export const PASSENGER_RULES=Object.freeze({
 reach:5.2,        // distanza massima tra fianco del mezzo e chi chiede il passaggio
 hintRange:15,     // da qui si vede il cartello «PASSAGGIO?»
 stopSpeed:1.2,    // il mezzo deve essere quasi fermo per far salire o scendere
 hitchEvery:5,     // circa un passante anonimo su 5 accetta o chiede un passaggio
 tip:4,            // mancia se lo lasci a destinazione
 arrive:32,        // raggio della destinazione
 trip:[160,620]    // lunghezza in linea d'aria della corsa richiesta
});
const hash=n=>{let x=(n|0)^0x2c1b3c6d;x=Math.imul(x^x>>>16,0x297a2d39);x=Math.imul(x^x>>>15,0x623d1a2f);return (x^x>>>16)>>>0;};
const HAIR=['#2a211e','#4b3425','#1c1e23','#8d877b','#6c4a2b','#3a2c26'];
const JACKETS=['#3f6b86','#8e3b36','#5d6b48','#7b6a8a','#c49a3a','#4a4f57'];
const HELMETS=['#e9e6dc','#c0392b','#2f3e4f','#d9b44a'];
const isBike=v=>v?.vehicleType==='motorcycle';
// Passeggeri trasportabili oltre al guidatore.
export function seatCapacity(v){
 if(!v||v.vendorStand)return 0;
 if(isBike(v))return 1;
 const m=String(v.model||'');
 if(m.startsWith('ape-'))return 1;
 if(m.startsWith('furgone')||m.startsWith('food-'))return 2;
 return 4;
}
export function ensureSeats(v){
 const n=seatCapacity(v);
 if(!Array.isArray(v.seats)||v.seats.length!==n){
  const old=Array.isArray(v.seats)?v.seats:[];
  v.seats=Array.from({length:n},(_,i)=>old[i]||null);
 }
 return v.seats;
}
export function occupantsOf(v){return v&&Array.isArray(v.seats)?v.seats.filter(Boolean):[];}
export function freeSeat(v){const s=ensureSeats(v);return s.indexOf(null);}
/* Sale a bordo: mai due volte, mai oltre la capienza, mai su un mezzo di un altro NPC. */
export function boardPassenger(v,npc){
 if(!v||!npc||npc.aboard||v.npcRider)return -1;
 const seat=freeSeat(v);
 if(seat<0)return -1;
 v.seats[seat]=npc;npc.aboard={vehicle:v,seat};npc.indoors=true;npc.braking=true;
 return seat;
}
export function alightPassenger(v,seat){
 const s=ensureSeats(v),npc=s[seat]||null;
 if(!npc)return null;
 s[seat]=null;npc.aboard=null;npc.indoors=false;
 return npc;
}
/* Chi può chiedere o accettare un passaggio: un passante anonimo libero, non residenti con
 * agenda, mestieri, pendolari, clienti del mercato, gruppi, eventi, urti o attraversamenti.
 * Chi è appena sceso (noLift) non ne chiede un altro: niente risalite a ripetizione. */
export function canHitchhike(a){
 return !!a&&a.body==='walk'&&!a.indoors&&!a.aboard&&!a.noLift&&!a.residentRoutine&&!a.commuter&&!a.profession&&
  !a.stationary&&!a.scripted&&!a.washer&&!a.market&&!a.social?.hold&&!(a.impactTime>0)&&
  !a.needsRoutineRecovery&&!a.crossing&&!(a.dodge>0)&&!a.corner&&a.edge!=null&&
  (hash(a.seed|0)%PASSENGER_RULES.hitchEvery)===0;
}
// Distanza dal bordo del mezzo (non dal centro): chi sta accanto alla portiera di un'auto lunga conta.
export function sideDistance(v,p){
 const c=Math.cos(v.a||0),s=Math.sin(v.a||0),dx=p.x-v.x,dy=p.y-v.y;
 const f=dx*c+dy*s,r=-dx*s+dy*c,hl=isBike(v)?1.6:2.9,hw=isBike(v)?.6:1.6;
 return Math.hypot(Math.max(0,Math.abs(f)-hl),Math.max(0,Math.abs(r)-hw));
}
export function hitchhikersNear(people,v,range=PASSENGER_RULES.hintRange,skip=()=>false){
 const out=[];
 for(const a of people||[]){
  if(!canHitchhike(a)||skip(a))continue;
  const d=sideDistance(v,a);
  if(d<=range)out.push({npc:a,distance:d});
 }
 return out.sort((p,q)=>p.distance-q.distance);
}
export function liftCandidate(people,v,{speed=0,skip}={}){
 if(!v||Math.abs(speed)>PASSENGER_RULES.stopSpeed||freeSeat(v)<0||v.npcRider)return null;
 const near=hitchhikersNear(people,v,PASSENGER_RULES.reach,skip)[0];
 return near?near.npc:null;
}
/* Una meta credibile: un marciapiede reale a 160–620 m, scelta in modo stabile dal passeggero. */
export function liftDestination(graph,from,seed,{valid=()=>true,place}={}){
 const starts=graph?.walkStarts||[];
 if(!starts.length)return null;
 const [lo,hi]=PASSENGER_RULES.trip;
 for(let k=0;k<160;k++){
  const id=starts[hash(seed*31+k*7919)%starts.length],e=graph.edges[id];
  if(!e||!e.walk)continue;
  const t=.2+(hash(seed+k*131)%600)/1000,at=place?place(id,t):null;
  if(!at)continue;
  const d=Math.hypot(at.x-from.x,at.y-from.y);
  if(d<lo||d>hi||!valid(at.x,at.y))continue;
  return {x:at.x,y:at.y,edge:id,name:e.name||''};
 }
 return null;
}
/* Dove si apre la portiera: prima il lato passeggero (destra), poi l'altro; sullo scooter accanto alla sella. */
export function doorSpots(v){
 const c=Math.cos(v.a||0),s=Math.sin(v.a||0),off=isBike(v)?1.9:3.6;
 return [1,-1].map(side=>({x:v.x-s*off*side,y:v.y+c*off*side,a:(v.a||0)+side*Math.PI/2,side}));
}
/* Il tratto di marciapiede più vicino (tratto, t e lato giusti) su cui chi scende torna a
 * camminare: ci arriva a piedi dalla portiera con il recupero normale, senza salti. */
export function alightSpot(graph,v,{place,valid=()=>true,blocked=()=>false,maxDistance=14}={}){
 if(!graph?.edges||!place)return null;
 let best=null;
 for(let id=0;id<graph.edges.length;id++){
  const e=graph.edges[id];
  if(!e.walk)continue;
  const a=graph.nodes[e.from],b=graph.nodes[e.to],dx=b.x-a.x,dy=b.y-a.y,l2=dx*dx+dy*dy;
  if(!l2)continue;
  const t=Math.max(.02,Math.min(.98,((v.x-a.x)*dx+(v.y-a.y)*dy)/l2));
  const cx=a.x+dx*t,cy=a.y+dy*t;
  if(Math.hypot(cx-v.x,cy-v.y)>maxDistance+(e.streetWidth||0))continue;
  for(const side of [1,-1]){
   const at=place(id,t,side);
   if(!at)continue;
   const d=Math.hypot(at.x-v.x,at.y-v.y);
   if(d>maxDistance||(best&&d>=best.distance)||!valid(at.x,at.y)||blocked(at.x,at.y))continue;
   best={...at,edge:id,t,side,distance:d};
  }
 }
 return best;
}
/* Passeggeri del traffico: identità stabili legate al mezzo (stesso seed → stesse persone sugli
 * stessi posti). Circa 4 auto su 10 portano qualcuno, uno scooter su 4 ha il passeggero. */
export function trafficOccupants(agent){
 if(!agent||agent.body!=='car'||agent.commuter)return [];
 if(agent.occupantSeed===agent.seed&&Array.isArray(agent.occupants))return agent.occupants;
 const h=hash((agent.seed|0)*7+3),cap=Math.min(3,seatCapacity(agent));
 let n=0;
 if(isBike(agent))n=h%4===0?1:0;
 else{const r=h%100;n=r<58?0:r<86?1:r<97?2:3;}
 n=Math.min(n,cap);
 agent.occupants=Array.from({length:n},(_,i)=>personLook((agent.seed|0)*10+i+1,i));
 agent.occupantSeed=agent.seed;
 return agent.occupants;
}
export function personLook(id,seat=0){
 const h=hash(id);
 return {id,seat,hair:HAIR[h%HAIR.length],jacket:JACKETS[(h>>>4)%JACKETS.length],helmet:HELMETS[(h>>>8)%HELMETS.length]};
}
// Aspetto stabile di un pedone vero a bordo (dal suo seed).
export function lookOf(npc,seat){return npc?.look||personLook((npc?.seed|0)*13+97,seat);}
/* Posizioni dei posti (avanti f, destra r) in unità di gioco, sul corpo disegnato.
 * In Italia si guida a sinistra del mezzo: guidatore r<0. */
function seatPositions(v){
 const m=String(v.model||'');
 if(m.startsWith('ape-'))return {driver:[1.05,-.35],seats:[[1.05,.45]],head:.3};
 if(m.startsWith('furgone')||m.startsWith('food-'))return {driver:[2.35,-.8],seats:[[2.35,.05],[2.35,.85]],head:.36};
 return {driver:[1.45,-.78],seats:[[1.45,.78],[-1.6,-.82],[-1.6,.82],[-1.6,0]],head:.36};
}
/* Teste e spalle viste dall'alto attraverso parabrezza e lunotto (vetro leggermente azzurrato). */
export function drawCabinOccupants(ctx,x,y,a,v,people,{driver=true,driverLook=null,alpha=1,scale=1}={}){
 if(!ctx||isBike(v)||(!driver&&!people.length))return false;
 const pos=seatPositions(v),c=Math.cos(a),s=Math.sin(a);
 const list=[];
 if(driver)list.push({at:pos.driver,look:driverLook||personLook((v.seed|0)*10,0)});
 for(const p of people){const at=pos.seats[p.seat]||pos.seats[0];if(at)list.push({at,look:p.look||p});}
 ctx.save();ctx.globalAlpha*=.88*alpha;
 for(const {at:[f0,r0],look} of list){
  const f=f0*scale,r=r0*scale,px=x+c*f-s*r,py=y+s*f+c*r,hr=pos.head*scale;
  ctx.fillStyle=look.jacket||'#4a4f57';
  ctx.beginPath();ctx.ellipse(px-c*.42*scale,py-s*.42*scale,hr*1.55,hr*1.05,a+Math.PI/2,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=look.hair||'#2a211e';
  ctx.beginPath();ctx.arc(px,py,hr,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#ffffff22';ctx.beginPath();ctx.arc(px+c*hr*.35,py+s*hr*.35,hr*.42,0,Math.PI*2);ctx.fill();
 }
 // riflesso del vetro sopra le teste
 ctx.globalAlpha=.16*alpha;ctx.fillStyle='#bcd8e6';
 for(const {at:[f0,r0]} of list){const f=f0*scale,r=r0*scale,px=x+c*f-s*r,py=y+s*f+c*r;ctx.beginPath();ctx.arc(px,py,pos.head*1.25*scale,0,Math.PI*2);ctx.fill();}
 ctx.restore();
 return true;
}
