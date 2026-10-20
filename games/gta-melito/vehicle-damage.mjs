/* Q23 — Danni progressivi visibili ai veicoli, solo da urti NON letali (impact-physics.mjs).
 * Punti di danno 0..100 dall'energia dell'urto; tre stati: integro, ammaccato, grave.
 * I segni (graffi, ammaccature, vetro incrinato) sono salvati in coordinate NORMALIZZATE della
 * carrozzeria (-1..1 sul disegno), quindi seguono lo sprite e qualsiasi scala dei veicoli.
 * Solo l'auto del giocatore perde un po' di prestazioni quando è grave; gli NPC sono danneggiati
 * solo nell'aspetto e tornano integri fuori vista. Riparazione a pagamento in un'«officina di gioco»
 * (punto simulato, nessuna attività reale). Grafica PROVVISORIA, da approvare dal committente.
 * Mai morte né game over. Scooter e moto: nessun danno (limite dichiarato). */
export const DAMAGE_RULES=Object.freeze({
 minSpeed:3.4,      // stessa soglia di IMPACT_MIN_SPEED
 perSpeed:2.1,      // punti per unità di velocità oltre la soglia
 max:100,
 dented:22,         // da qui: ammaccato
 severe:62,         // da qui: grave (fumo, prestazioni ridotte per il giocatore)
 maxMarks:7,
 cooldown:.35,      // secondi tra due urti contati sullo stesso mezzo
 strikerFactor:.55, // chi colpisce prende meno danno di chi è colpito
 wallFactor:.7,     // muri, paletti, bordi
 npcHeal:20,        // secondi fuori vista prima che un NPC torni integro
 repairBase:8,
 repairPerPoint:.45,
 severeTop:.85,     // velocità massima con danno grave
 severeAccel:.8     // spinta con danno grave
});
const R=DAMAGE_RULES;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const twoWheels=v=>v?.vehicleType==='motorcycle';
export function damagePoints(vehicle){return vehicle?.damage?.points||0;}
export function damageLevel(vehicle){
 const d=damagePoints(vehicle);
 return d>=R.severe?'grave':d>=R.dented?'ammaccato':'integro';
}
export const DAMAGE_LABEL=Object.freeze({integro:'',ammaccato:'AMMACCATA',grave:'DANNEGGIATA'});
// Direzione dell'urto nelle coordinate dello sprite (x verso destra del mezzo, y verso il retro),
// spinta sul bordo della carrozzeria.
function markSpot(vehicle,from){
 let u=0,v=-1;
 if(from&&Number.isFinite(from.x)&&Number.isFinite(from.y)&&Number.isFinite(vehicle.a)){
  const dx=from.x-vehicle.x,dy=from.y-vehicle.y,c=Math.cos(vehicle.a),s=Math.sin(vehicle.a);
  const forward=dx*c+dy*s,right=-dx*s+dy*c;
  if(Math.hypot(forward,right)>1e-6){u=right/2.5;v=-forward/4.2;}
 }
 const m=Math.max(Math.abs(u),Math.abs(v))||1;
 return {u:clamp(u/m*.78,-.78,.78),v:clamp(v/m*.82,-.82,.82)};
}
/* Aggiunge il danno di un urto. `speed` = velocità dell'urto (unità di gioco), `from` = punto
 * dell'altro corpo (o del muro), `factor` per chi colpisce o per i muri, `clock` per il cooldown.
 * Restituisce i punti aggiunti (0 se sotto soglia, in cooldown o su due ruote). */
export function addDamage(vehicle,speed,from=null,{factor=1,clock=null,seed=0}={}){
 if(!vehicle||twoWheels(vehicle)||!Number.isFinite(speed))return 0;
 const pts=Math.max(0,Math.abs(speed)-R.minSpeed)*R.perSpeed*factor;
 if(pts<.5)return 0;
 const d=vehicle.damage||(vehicle.damage={points:0,marks:[],lastHit:-1e9,hidden:0});
 if(clock!=null&&clock-d.lastHit<R.cooldown)return 0;
 if(clock!=null)d.lastHit=clock;
 const before=d.points;
 d.points=Math.min(R.max,d.points+pts);
 const spot=markSpot(vehicle,from);
 const kind=pts>=9?'ammaccatura':'graffio';
 const n=(d.marks.length*7919+Math.round(before*13)+seed)>>>0;
 if(d.marks.length<R.maxMarks)d.marks.push({...spot,kind,seed:n%997,size:clamp(.35+pts/30,.35,1)});
 else{const old=d.marks[n%d.marks.length];old.kind='ammaccatura';old.size=Math.min(1,old.size+.15);}
 // Vetro incrinato: urto frontale forte (spot verso il muso) oltre la soglia di ammaccatura.
 if(spot.v<-.5&&d.points>=R.dented&&!d.marks.some(q=>q.kind==='vetro'))d.marks.push({u:clamp(spot.u*.4,-.3,.3),v:-.42,kind:'vetro',seed:n%613,size:1});
 return d.points-before;
}
// Il profilo di guida del giocatore con danno grave: un po' meno spinta e velocità massima.
const severeCache=new WeakMap();
export function damagedProfile(profile,vehicle){
 if(!profile||damageLevel(vehicle)!=='grave')return profile;
 let p=severeCache.get(profile);
 if(!p){p=Object.freeze({...profile,accel:profile.accel*R.severeAccel,top:profile.top*R.severeTop,damaged:true});severeCache.set(profile,p);}
 return p;
}
export function repairCost(vehicle){
 const d=damagePoints(vehicle);
 return d<1?0:Math.ceil(R.repairBase+d*R.repairPerPoint);
}
/* Riparazione all'officina di gioco: scala il saldo della campagna (Q06), azzera i danni. */
export function payRepair(progress,vehicle){
 const cost=repairCost(vehicle);
 if(!cost)return {ok:false,reason:'integro',balance:progress?.money??0};
 if(!progress||!(progress.money>=cost))return {ok:false,reason:'fondi-insufficienti',need:cost,balance:progress?.money??0};
 progress.money-=cost;
 if(progress.shop&&Number.isFinite(progress.shop.spent))progress.shop.spent=Math.min(999999,progress.shop.spent+cost);
 vehicle.damage=null;
 return {ok:true,cost,balance:progress.money};
}
export function repairMessage(result){
 if(result.ok)return 'Riparata · −'+result.cost+' € · saldo '+result.balance+' €';
 if(result.reason==='fondi-insufficienti')return 'Fondi insufficienti: la riparazione costa '+result.need+' €, hai '+result.balance+' €.';
 return 'Il mezzo è già integro.';
}
const outside=(x,y,view)=>!view||x<view[0]||x>view[2]||y<view[1]||y>view[3];
/* Gli NPC danneggiati tornano integri solo dopo un po' fuori vista (mai davanti al giocatore). */
export function healOutOfView(vehicles,view,dt,keep=null){
 let healed=0;
 for(const v of vehicles){
  const d=v?.damage;if(!d||v===keep)continue;
  if(outside(v.x,v.y,view)){d.hidden=(d.hidden||0)+dt;if(d.hidden>=R.npcHeal){v.damage=null;healed++;}}
  else d.hidden=0;
 }
 return healed;
}
/* Disegno sopra lo sprite, nelle stesse coordinate di drawCarSprite (rotate(angle+PI/2), muso in alto).
 * `size` = [larghezza,lunghezza] disegnate dello sprite. Costo: pochi tratti, solo per i mezzi danneggiati. */
export function drawVehicleDamage(ctx,vehicle,x,y,angle,size,clock=0){
 const d=vehicle?.damage;if(!d||!d.marks?.length||!size)return false;
 const [w,l]=size,hw=w/2*.86,hl=l/2*.9,level=damageLevel(vehicle);
 ctx.save();ctx.translate(x,y);ctx.rotate(angle+Math.PI/2);
 for(const m of d.marks){
  const px=m.u*hw,py=m.v*hl,r=(.38+.42*m.size)*Math.min(1,w/5);
  const rnd=k=>((Math.sin((m.seed+1)*(k+1)*12.9898)*43758.5453)%1+1)%1;
  if(m.kind==='vetro'){
   ctx.strokeStyle='#f2fbfdee';ctx.lineWidth=.12;ctx.beginPath();
   for(let k=0;k<5;k++){const t=k/5*Math.PI*2+rnd(k)*.6,len=.35+rnd(k+5)*.45;ctx.moveTo(px,py);ctx.lineTo(px+Math.cos(t)*len*w*.16,py+Math.sin(t)*len*l*.07);}
   ctx.stroke();continue;
  }
  if(m.kind==='ammaccatura'){
   ctx.fillStyle='#16181b99';ctx.beginPath();ctx.ellipse(px,py,r*1.05,r*.72,rnd(1)*Math.PI,0,Math.PI*2);ctx.fill();
   ctx.fillStyle='#f4f1e866';ctx.beginPath();ctx.ellipse(px-r*.2,py-r*.18,r*.48,r*.28,rnd(1)*Math.PI,0,Math.PI*2);ctx.fill();
  }
  ctx.strokeStyle='#f6f3eae6';ctx.lineWidth=.13;ctx.beginPath();
  for(let k=0;k<3;k++){const ox=(rnd(k)-.5)*r,oy=(rnd(k+3)-.5)*r*.8,len=r*(.7+rnd(k+6)*.6),t=rnd(k+9)*.8-.4;
   ctx.moveTo(px+ox,py+oy);ctx.lineTo(px+ox+Math.cos(t)*len,py+oy+Math.sin(t)*len);}
  ctx.stroke();
 }
 // Fumo leggero dal cofano quando il danno è grave: 3 sbuffi che si allargano, nessuna particella salvata.
 if(level==='grave'){
  for(let k=0;k<3;k++){
   const t=((clock*.9+k/3)%1),rr=(.5+t*1.5)*Math.min(1,w/5);
   ctx.fillStyle='rgba(132,136,140,'+(.55*(1-t)).toFixed(3)+')';
   ctx.beginPath();ctx.arc((k-1)*.35,-hl*.62-t*1.4,rr,0,Math.PI*2);ctx.fill();
  }
 }
 ctx.restore();
 return true;
}
/* Officina di gioco: un punto sul marciapiede accanto a una strada carrabile, vicino all'ancora.
 * `nearestRoad(x,y)` → {x,y,a,width} oppure null; `ok(x,y)` → marciapiede camminabile e libero. */
export const WORKSHOP_ANCHOR=Object.freeze({x:1237,y:1382});
export const WORKSHOP_RADIUS=11;
/* `laneFree(x,y)`: il bordo della corsia davanti all'officina deve essere libero (niente stalli), così ci si ferma. */
export function placeWorkshop(nearestRoad,ok,anchor=WORKSHOP_ANCHOR,laneFree=()=>true){
 for(const step of [0,12,-12,24,-24,36,-36,48,-48,60,-60,80,-80]){
  const base=nearestRoad(anchor.x,anchor.y);if(!base)return null;
  const c=Math.cos(base.a),s=Math.sin(base.a),bx=base.x+c*step,by=base.y+s*step;
  const road=nearestRoad(bx,by);if(!road)continue;
  for(const side of [1,-1]){
   const nx=-Math.sin(road.a)*side,ny=Math.cos(road.a)*side,off=road.width/2+1.6;
   const x=road.x+nx*off,y=road.y+ny*off;
   const kx=road.x+nx*(road.width/2-1.2),ky=road.y+ny*(road.width/2-1.2);
   if(ok(x,y)&&[-5,0,5].every(d=>laneFree(kx+Math.cos(road.a)*d,ky+Math.sin(road.a)*d)))return {x,y,a:road.a,side,roadX:road.x+nx*road.width*.22,roadY:road.y+ny*road.width*.22,label:'OFFICINA DI GIOCO'};
  }
 }
 return null;
}
export function nearWorkshop(workshop,vehicle){
 return !!workshop&&!!vehicle&&Math.hypot(vehicle.x-workshop.roadX,vehicle.y-workshop.roadY)<=WORKSHOP_RADIUS;
}
// Cartello provvisorio dell'officina sul marciapiede: insegna verde con chiave inglese.
export function drawWorkshop(ctx,workshop,view){
 if(!workshop||outside(workshop.x,workshop.y,view&&[view[0]-6,view[1]-6,view[2]+6,view[3]+6]))return;
 ctx.save();ctx.translate(workshop.x,workshop.y);
 ctx.fillStyle='#00000045';ctx.fillRect(-2.05,-1.05,4.5,2.6);
 ctx.fillStyle='#2f5d43';ctx.fillRect(-2.25,-1.3,4.5,2.6);
 ctx.strokeStyle='#e9d9a6';ctx.lineWidth=.18;ctx.strokeRect(-2.25,-1.3,4.5,2.6);
 ctx.strokeStyle='#f3efe2';ctx.lineWidth=.32;ctx.lineCap='round';
 ctx.beginPath();ctx.moveTo(-1.6,.15);ctx.lineTo(-.7,-.65);ctx.stroke();
 ctx.beginPath();ctx.arc(-.55,-.78,.32,0,Math.PI*2);ctx.stroke();
 ctx.fillStyle='#f3efe2';ctx.font='bold .78px monospace';ctx.textAlign='center';ctx.fillText('OFFICINA',.45,.05);
 ctx.font='.5px monospace';ctx.fillText('DI GIOCO',.45,.85);
 ctx.restore();
}
