/* Q04: giorno/notte guidato dall'orologio simulato degli NPC (npc-agenda.mjs).
 * Tutto è una funzione pura dei minuti: la stessa ora dà sempre la stessa luce,
 * le transizioni sono graduali e l'orologio si ferma con pausa e banca.
 * Colori e orari sono una resa arcade, non dati astronomici di Melito. */
const DAY=24*60;
const modulo=(n,m)=>((n%m)+m)%m;
const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
export const smoothstep=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
export const NIGHT_DARKNESS=.58;
// [minuto, oscurità (opacità del velo), colore del velo]
export const DAY_KEYFRAMES=Object.freeze([
 [0,NIGHT_DARKNESS,[18,26,60]],
 [4*60+40,NIGHT_DARKNESS,[18,26,60]],
 [5*60+40,.42,[58,42,92]],
 [6*60+30,.16,[255,150,92]],
 [7*60+20,0,[255,196,140]],
 [17*60+10,0,[255,196,140]],
 [18*60+20,.13,[255,138,62]],
 [19*60+20,.3,[118,62,96]],
 [20*60+20,.5,[26,32,72]],
 [21*60,NIGHT_DARKNESS,[18,26,60]],
 [DAY,NIGHT_DARKNESS,[18,26,60]]
]);
// Quota di finestre accese: sera piena, notte fonda poche, risveglio all'alba.
const WINDOW_KEYS=[[0,.34],[60,.24],[3*60,.12],[5*60,.16],[6*60+10,.32],[7*60+20,.08],[17*60+40,.08],[19*60,.34],[20*60+30,.55],[23*60,.48],[DAY,.34]];
function track(keys,m,pick){
 for(let i=1;i<keys.length;i++){
  const [m0]=keys[i-1],[m1]=keys[i];
  if(m<=m1){const t=smoothstep(m0,m1,m);return pick(keys[i-1],keys[i],t);}
 }
 return pick(keys[keys.length-1],keys[keys.length-1],0);
}
const mix=(a,b,t)=>a+(b-a)*t;
export function daylightAt(minutes){
 const m=modulo(Number(minutes)||0,DAY);
 const darkness=track(DAY_KEYFRAMES,m,(a,b,t)=>mix(a[1],b[1],t));
 const tint=track(DAY_KEYFRAMES,m,(a,b,t)=>a[2].map((v,k)=>Math.round(mix(v,b[2][k],t))));
 const windowShare=track(WINDOW_KEYS,m,(a,b,t)=>mix(a[1],b[1],t));
 // Luci artificiali: si accendono quando il velo supera ~0,2 e si spengono all'alba allo stesso modo.
 const lamps=smoothstep(.16,.36,darkness);
 return {minutes:m,darkness,tint,lamps,headlights:smoothstep(.22,.42,darkness),
  windows:lamps*windowShare,windowShare,phase:darkness<.02?'giorno':darkness>=NIGHT_DARKNESS-.01?'notte':m<12*60?'alba':'tramonto'};
}
// Una finestra è accesa se il suo seme cade sotto la quota corrente: si spengono una alla volta, senza sfarfallio.
export function windowIsLit(seed,share){
 let x=(seed|0)^0x5bd1e995;x=Math.imul(x^x>>>15,2246822519);x=Math.imul(x^x>>>13,3266489917);
 return ((x^x>>>16)>>>0)/4294967295<share;
}
export const WINDOW_SHARE_STEPS=8;
export const windowShareStep=share=>Math.round(clamp(share,0,1)*WINDOW_SHARE_STEPS);
/* Velo notturno con luci "bucate" su una mappa luminosa a mezza risoluzione.
 * lights: {x,y,r,strength,stretch?,angle?} in coordinate mondo; view: trasformazione mondo→schermo. */
export function paintLightMap(map,view,light,lights){
 const g=map.getContext('2d');
 g.setTransform(1,0,0,1,0,0);g.globalCompositeOperation='source-over';
 g.clearRect(0,0,map.width,map.height);
 const [r,gr,b]=light.tint;
 g.fillStyle=`rgba(${r},${gr},${b},${light.darkness.toFixed(3)})`;g.fillRect(0,0,map.width,map.height);
 if(!lights.length)return 0;
 g.globalCompositeOperation='destination-out';
 g.setTransform(view.scale,0,0,view.scale,view.offsetX,view.offsetY);
 let drawn=0;
 for(const q of lights){
  const strength=clamp(q.strength,0,1);if(strength<=.01)continue;
  g.save();g.translate(q.x,q.y);if(q.angle)g.rotate(q.angle);if(q.stretch)g.scale(q.stretch,1);
  const grad=g.createRadialGradient(0,0,0,0,0,q.r);
  grad.addColorStop(0,`rgba(0,0,0,${(.92*strength).toFixed(3)})`);
  grad.addColorStop(.55,`rgba(0,0,0,${(.5*strength).toFixed(3)})`);
  grad.addColorStop(1,'rgba(0,0,0,0)');
  g.fillStyle=grad;g.beginPath();g.arc(0,0,q.r,0,Math.PI*2);g.fill();
  g.restore();drawn++;
 }
 g.globalCompositeOperation='source-over';g.setTransform(1,0,0,1,0,0);
 return drawn;
}
// Alone caldo additivo sopra il velo (lampade, fari, porte aperte).
export function paintGlows(c,glows){
 if(!glows.length)return;
 c.save();c.globalCompositeOperation='lighter';
 for(const q of glows){
  const a=clamp(q.strength,0,1)*(q.alpha??.35);if(a<=.01)continue;
  const grad=c.createRadialGradient(q.x,q.y,0,q.x,q.y,q.r);
  grad.addColorStop(0,`rgba(${q.color||'255,214,140'},${a.toFixed(3)})`);
  grad.addColorStop(1,`rgba(${q.color||'255,214,140'},0)`);
  c.fillStyle=grad;c.beginPath();c.arc(q.x,q.y,q.r,0,Math.PI*2);c.fill();
 }
 c.restore();
}
// Fari: punto davanti al muso e lunghezza del cono, per auto e moto.
// Il cono parte dal muso e si allunga davanti di circa 2 semiassi (15 m auto, 10 m moto).
export function headlightLights(vehicle,level){
 if(!(level>0))return [];
 const moto=vehicle.vehicleType==='motorcycle',front=moto?2.4:3.2,half=moto?5.2:7.8,stretch=moto?1.7:1.9;
 const ca=Math.cos(vehicle.a),sa=Math.sin(vehicle.a),reach=front+half*.9;
 return [{x:vehicle.x+ca*reach,y:vehicle.y+sa*reach,r:half/stretch,stretch,angle:vehicle.a,strength:level}];
}
// Fanali: due punti bianchi davanti e due rossi dietro (uno per lato in moto).
export function vehicleLamps(vehicle,level){
 if(!(level>0))return [];
 const moto=vehicle.vehicleType==='motorcycle',ca=Math.cos(vehicle.a),sa=Math.sin(vehicle.a);
 const front=moto?2.3:3.05,rear=moto?2.4:3.1,side=moto?[0]:[-1.15,1.15],out=[];
 for(const k of side){
  out.push({x:vehicle.x+ca*front-sa*k,y:vehicle.y+sa*front+ca*k,r:1.5,color:'255,246,214',strength:level,alpha:.85});
  out.push({x:vehicle.x-ca*rear-sa*k,y:vehicle.y-sa*rear+ca*k,r:1.05,color:'255,52,36',strength:level,alpha:.8});
 }
 return out;
}
// Telefoni in affanno di notte: si rinuncia prima alle finestre accese (la parte più costosa);
// velo, lampioni e fari restano. Sotto 30 fotogrammi al secondo si spengono, sopra 45 tornano.
export function nightQuality(previous,frameSeconds){
 if(!(frameSeconds>0))return previous;
 if(previous!==0&&frameSeconds>1/30)return 0;
 if(previous===0&&frameSeconds<1/45)return 1;
 return previous??1;
}
// Path2D delle finestre accese di un edificio per un dato scalino di quota (memorizzato).
export function litWindowPath(panes,cache,share){
 const step=windowShareStep(share);
 if(!step||typeof Path2D!=='function')return null;
 if(cache.has(step))return cache.get(step);
 const path=new Path2D();let any=false;
 for(const pane of panes){
  if(!windowIsLit(pane.seed,step/WINDOW_SHARE_STEPS))continue;
  const q=pane.quad;path.moveTo(q[0],q[1]);path.lineTo(q[2],q[3]);path.lineTo(q[4],q[5]);path.lineTo(q[6],q[7]);path.closePath();any=true;
 }
 cache.set(step,any?path:null);
 return cache.get(step);
}
