/* Q08: meteo — sereno, nuvoloso, pioggia.
 * Funzione pura dell'orologio NPC: blocchi di 3 ore con passaggi graduali di 25 minuti,
 * stesso orario = stesso tempo (si ferma con pausa e banca come la luce della Q04).
 * La prima mattina della partita è sempre serena. Il tempo è inventato, non è il meteo reale.
 * Effetti solo visivi e di luce: velo grigio, ombre delle nuvole, gocce, asfalto bagnato,
 * pozzanghere con cerchi, ombrelli; nessun cambio di aderenza (la guida è il tema della Q10). */
export const WEATHER_PERIOD=180;
export const WEATHER_FADE=25;
export const WEATHER_LABEL=Object.freeze({sereno:'SERENO',nuvoloso:'NUVOLOSO',pioggia:'PIOGGIA'});
const LEVELS={sereno:{cloud:0,rain:0},nuvoloso:{cloud:.65,rain:0},pioggia:{cloud:1,rain:1}};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const smooth=x=>{const t=clamp(x,0,1);return t*t*(3-2*t);};
const hash=n=>{let x=(n|0)^0x7f4a7c15;x=Math.imul(x^x>>>16,2246822519);x=Math.imul(x^x>>>13,3266489917);return (x^x>>>16)>>>0;};
export function weatherStateAt(period,seed=77){
 // Blocco delle 06:00–09:00 del primo giorno: sempre sereno, per iniziare con la città leggibile.
 if(period===2)return 'sereno';
 const r=hash(seed+period*2654435761)%100;
 return r<50?'sereno':r<78?'nuvoloso':'pioggia';
}
// Livelli continui: l'ultimo tratto di ogni blocco sfuma verso il successivo.
function levelsAt(minutes,seed,forced){
 if(forced)return LEVELS[forced];
 const k=Math.floor(minutes/WEATHER_PERIOD),into=minutes-k*WEATHER_PERIOD;
 const a=LEVELS[weatherStateAt(k,seed)],b=LEVELS[weatherStateAt(k+1,seed)];
 const t=smooth((into-(WEATHER_PERIOD-WEATHER_FADE))/WEATHER_FADE);
 return {cloud:a.cloud+(b.cloud-a.cloud)*t,rain:a.rain+(b.rain-a.rain)*t};
}
// Bagnato: si inzuppa in ~15 minuti di pioggia e si asciuga in ~60 dopo che smette.
function wetnessAt(minutes,seed,forced){
 if(forced)return forced==='pioggia'?1:0;
 let wet=0;
 for(let m=minutes-120;m<=minutes;m+=2){
  const rain=levelsAt(m,seed,null).rain;
  wet=rain>.05?Math.min(1,wet+rain*2/15):Math.max(0,wet-2/60);
 }
 return wet;
}
export function weatherAt(minutes,{seed=77,forced=null}={}){
 const m=Math.max(0,Number(minutes)||0),f=WEATHER_LABEL[forced]?forced:null;
 const {cloud,rain}=levelsAt(m,seed,f),wetness=wetnessAt(m,seed,f);
 const state=rain>.5?'pioggia':cloud>.32?'nuvoloso':'sereno';
 return {state,label:WEATHER_LABEL[state],cloud,rain,wetness,
  // Cielo coperto: un velo grigio-azzurro anche di giorno.
  dim:cloud*.15+rain*.12};
}
/* Unisce meteo e luce del giorno: il velo prende il massimo, la tinta vira al grigio,
 * lampioni e fari si accendono prima quando piove. */
export function combineWeather(light,weather){
 if(!weather||weather.dim<=0)return light;
 const darkness=Math.max(light.darkness,weather.dim+light.darkness*.25);
 const grey=[58,68,82],w=clamp(weather.dim/(darkness||1),0,1)*.8;
 const tint=light.tint.map((v,i)=>Math.round(v+(grey[i]-v)*w));
 // A mezzogiorno i lampioni restano spenti anche con la pioggia; al crepuscolo si accendono prima.
 const lamps=light.darkness>.03?Math.max(light.lamps,smooth((darkness-.16)/.2)):light.lamps;
 const headlights=Math.max(light.headlights,weather.rain>.5?.6*weather.rain:0);
 return {...light,darkness,tint,lamps,headlights,windows:Math.max(light.windows,lamps*light.windowShare)};
}
// Gocce in coordinate schermo: poche linee oblique in un solo tracciato, posizione dal tempo.
export function rainStreaks(time,width,height,intensity,count=180){
 const n=Math.round(clamp(intensity,0,1)*count),out=[];
 for(let i=0;i<n;i++){
  const sx=hash(i*3+1)/4294967295,sy=hash(i*3+2)/4294967295,speed=520+hash(i*3+3)%260;
  const x=((sx*width+time*speed*.18)%width+width)%width,y=((sy*height+time*speed)%height+height)%height;
  out.push([x,y,x-speed*.012,y-speed*.045]);
 }
 return out;
}
export function drawRain(c,time,width,height,intensity){
 const streaks=rainStreaks(time,width,height,intensity);
 if(!streaks.length)return 0;
 c.save();c.setTransform(1,0,0,1,0,0);c.strokeStyle='rgba(206,222,236,.42)';c.lineWidth=1;
 c.beginPath();for(const [x0,y0,x1,y1] of streaks){c.moveTo(x0,y0);c.lineTo(x1,y1);}c.stroke();c.restore();
 return streaks.length;
}
// Ombre delle nuvole: poche grandi macchie morbide che scorrono col vento.
export function cloudShadows(bounds,cloud,time){
 if(cloud<=.02)return [];
 const [x0,y0,x1,y1]=bounds,out=[];
 for(let i=0;i<6;i++){
  const span=900,ox=hash(i*7+11)%span,oy=hash(i*7+12)%span,r=55+hash(i*7+13)%70;
  const x=x0+((ox+time*3.2)%span+span)%span-150,y=y0+((oy+time*1.1)%span+span)%span-150;
  if(x+r<x0||x-r>x1||y+r<y0||y-r>y1)continue;
  out.push({x,y,r,alpha:.16*cloud});
 }
 return out;
}
export function drawCloudShadows(c,bounds,cloud,time){
 for(const q of cloudShadows(bounds,cloud,time)){
  const g=c.createRadialGradient(q.x,q.y,0,q.x,q.y,q.r);
  g.addColorStop(0,`rgba(20,28,36,${q.alpha.toFixed(3)})`);g.addColorStop(1,'rgba(20,28,36,0)');
  c.fillStyle=g;c.beginPath();c.arc(q.x,q.y,q.r,0,Math.PI*2);c.fill();
 }
}
/* Pozzanghere: punti fissi sull'asfalto, solo dove nessun tetto o muro copre il suolo
 * (ctx.covered) e lontano dal bordo della carreggiata. */
export function placePuddles(roads,ctx){
 const out=[];
 for(const road of roads){
  if(!ctx.drivable(road)||!road.p||road.p.length<4)continue;
  const width=ctx.roadWidth(road),seed=hash(road.id);
  let len=0;for(let i=2;i<road.p.length;i+=2)len+=Math.hypot(road.p[i]-road.p[i-2],road.p[i+1]-road.p[i-1]);
  for(let d=14+seed%17,k=0;d<len-8;d+=24+hash(seed+k)%28,k++){
   let left=d,at=null;
   for(let i=2;i<road.p.length&&!at;i+=2){const dx=road.p[i]-road.p[i-2],dy=road.p[i+1]-road.p[i-1],l=Math.hypot(dx,dy);
    if(l>0&&left<=l)at={x:road.p[i-2]+dx*left/l,y:road.p[i-1]+dy*left/l,a:Math.atan2(dy,dx)};else left-=l;}
   if(!at)continue;
   const lane=((hash(seed+k*5)%100)/100-.5)*(width-4),x=at.x-Math.sin(at.a)*lane,y=at.y+Math.cos(at.a)*lane;
   const rx=1.7+(hash(seed+k*3)%18)/10,ry=rx*(.45+(hash(seed+k*9)%20)/100);
   const reach=Math.max(rx,ry)+.4;
   if([[0,0],[reach,0],[-reach,0],[0,reach],[0,-reach]].some(([ox,oy])=>ctx.covered(x+ox,y+oy)))continue;
   out.push({x,y,a:at.a+((hash(seed+k*11)%60)-30)*Math.PI/180,rx,ry,seed:hash(seed+k*13)});
  }
 }
 return out;
}
export function drawPuddles(c,puddles,bounds,wetness,rain,time){
 if(wetness<=.02)return;
 const [x0,y0,x1,y1]=bounds;
 for(const q of puddles){
  if(q.x<x0-4||q.x>x1+4||q.y<y0-4||q.y>y1+4)continue;
  c.save();c.translate(q.x,q.y);c.rotate(q.a);c.scale(1,q.ry/q.rx);
  // Acqua che riflette il cielo: bordo scuro, specchio grigio-azzurro, riflesso chiaro.
  c.globalAlpha=.6*wetness;c.fillStyle='#1b2731';c.beginPath();c.arc(0,0,q.rx+.18,0,Math.PI*2);c.fill();
  c.globalAlpha=.5*wetness;c.fillStyle='#62798b';c.beginPath();c.arc(0,0,q.rx,0,Math.PI*2);c.fill();
  c.globalAlpha=.35*wetness;c.fillStyle='#c9d8e3';c.beginPath();c.arc(-q.rx*.28,-q.rx*.22,q.rx*.42,0,Math.PI*2);c.fill();
  if(rain>.2){
   // Cerchi delle gocce: due anelli che si allargano, sfalsati per pozzanghera.
   c.strokeStyle='#c8d9e4';c.lineWidth=.12/Math.max(.45,q.ry/q.rx);
   for(let j=0;j<2;j++){
    const phase=((time*1.6+(q.seed%97)/97+j*.5)%1),r=q.rx*(.15+phase*.75);
    c.globalAlpha=(1-phase)*.5*rain;c.beginPath();c.arc((j?.3:-.2)*q.rx,(j?-.1:.15)*q.rx,r,0,Math.PI*2);c.stroke();
   }
  }
  c.restore();
 }
}
// Ombrello sopra il pedone, deciso dal suo seme (circa 7 su 10 lo portano).
const UMBRELLAS=['#2b3440','#7a2731','#28536b','#3c6b3f','#6b4f86','#c9a13a'];
export function hasUmbrella(person){return (Math.abs(person.seed|0)%10)<7;}
export function drawUmbrella(c,x,y,person,rain){
 if(rain<=.3||!hasUmbrella(person))return;
 const color=UMBRELLAS[Math.abs(person.seed|0)%UMBRELLAS.length];
 c.save();c.translate(x,y-.4);c.globalAlpha=Math.min(1,(rain-.3)*3);
 c.fillStyle='#10161a55';c.beginPath();c.ellipse(.35,.5,1.05,.7,0,0,Math.PI*2);c.fill();
 c.fillStyle=color;c.beginPath();c.arc(0,0,1.05,0,Math.PI*2);c.fill();
 c.strokeStyle='#ffffff40';c.lineWidth=.1;
 for(let k=0;k<4;k++){const a=k*Math.PI/4;c.beginPath();c.moveTo(-Math.cos(a)*1.02,-Math.sin(a)*1.02);c.lineTo(Math.cos(a)*1.02,Math.sin(a)*1.02);c.stroke();}
 c.fillStyle='#e8e2d2';c.beginPath();c.arc(0,0,.12,0,Math.PI*2);c.fill();
 c.restore();
}
