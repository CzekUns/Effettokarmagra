/* Q36 — officina di tuning dei veicoli posseduti (Q35): vernice, prestazioni, neon sottoscocca.
 * Vernice: solo i colori già disegnati dello STESSO modello (atlanti di car-sprites), nessun
 * tinting finto; le Panda hanno un solo colore e non si riverniciano (fallback dichiarato).
 * Prestazioni: +5/+10/+15% di accelerazione e velocità massima, sempre calcolati sul profilo BASE
 * del modello (vehicle-handling BF05): mai moltiplicazioni cumulative, tetto al 15%.
 * Neon: bagliore colorato sotto la scocca, tenue di giorno e ben visibile di notte.
 * Si paga in euro di gioco del salvataggio (economia Q06); tutto resta nel posto del garage. */
import {CAR_ATLAS_VARIANTS,EXTRA_CAR_VARIANTS,APE_CAR_VARIANTS} from './car-sprites.mjs?v=114';

export const PERF_LEVELS=Object.freeze([0,5,10,15]);
export const PERF_CAP=15;
// prezzo di ogni gradino: da 0 a 15 si spende 300+500+800 = 1600 €
export const PERF_STEP_PRICES=Object.freeze({5:300,10:500,15:800});
export const PAINT_PRICE=150;
export const NEON_PRICE=250;
export const NEON_COLORS=Object.freeze({rosa:'255,70,200',azzurro:'70,200,255',verde:'90,255,130',viola:'170,100,255',arancio:'255,160,50'});

const TABLES=[CAR_ATLAS_VARIANTS,EXTRA_CAR_VARIANTS,APE_CAR_VARIANTS];
const variantOf=model=>{for(const t of TABLES)if(t[model])return {table:t,v:t[model]};return null;};
// Colori disponibili per lo stesso modello (id sprite), quello attuale compreso.
export function paintOptions(model){
 const found=variantOf(model);
 if(!found)return [model];
 const {table,v}=found;
 return Object.keys(table).filter(id=>table[id].model===v.model&&!!table[id].worn===!!v.worn);
}
export function paintName(model){const v=variantOf(model)?.v;return String(v?.color||v?.paint||'unico').toUpperCase();}
export function perfPrice(from,to){
 let total=0;
 for(const level of PERF_LEVELS)if(level>from&&level<=to)total+=PERF_STEP_PRICES[level];
 return total;
}
export const clampPerf=p=>{const n=Number(p)||0;return PERF_LEVELS.filter(l=>l<=Math.min(PERF_CAP,n)).pop()||0;};
// Profilo di guida col tuning: sempre dal profilo base, quindi niente bonus sommati.
export function tunedProfile(base,tuning){
 const perf=clampPerf(tuning?.perf);
 if(!base||!perf)return base;
 const k=1+perf/100;
 return Object.freeze({...base,accel:base.accel*k,top:base.top*k,tuned:perf});
}
const fail=(reason,progress,extra={})=>({ok:false,reason,balance:progress?.money??0,...extra});
function pay(progress,price){progress.money-=price;if(progress.garage)progress.garage.spent=(progress.garage.spent||0)+price;}
/* Compra una modifica per il posto `entry` (veicolo posseduto) e, se c'è, l'auto in strada.
 * kind: 'paint' (value = id sprite dello stesso modello), 'perf' (0/5/10/15), 'neon' (colore o null). */
export function buyTuning(progress,entry,kind,value,street=null){
 if(!progress||!entry)return fail('sconosciuto',progress);
 entry.tuning=entry.tuning||{perf:0,neon:null,paintPaid:0};
 let price=0;
 if(kind==='paint'){
  if(value===entry.model)return fail('uguale',progress);
  if(!paintOptions(entry.model).includes(value))return fail('colore',progress);
  price=PAINT_PRICE;
 }else if(kind==='perf'){
  const level=Number(value);
  if(!PERF_LEVELS.includes(level))return fail('livello',progress);
  if(level===entry.tuning.perf)return fail('uguale',progress);
  price=perfPrice(entry.tuning.perf,level);   // scendere di livello è gratis (nessun rimborso)
 }else if(kind==='neon'){
  if(value!==null&&!NEON_COLORS[value])return fail('colore',progress);
  if(value===entry.tuning.neon)return fail('uguale',progress);
  price=value===null?0:NEON_PRICE;
 }else return fail('sconosciuto',progress);
 if(!(progress.money>=price))return fail('fondi-insufficienti',progress,{need:price});
 pay(progress,price);
 if(kind==='paint'){entry.model=value;entry.tuning.paintPaid=(entry.tuning.paintPaid||0)+price;}
 else if(kind==='perf')entry.tuning.perf=Number(value);
 else entry.tuning.neon=value;
 if(street){street.model=entry.model;street.tuning=entry.tuning;street.tunedProfile=null;}
 return {ok:true,price,balance:progress.money,entry};
}
export function tuningMessage(result){
 if(result.ok)return result.price?'FATTO · PAGATI € '+result.price:'FATTO';
 return {'fondi-insufficienti':'SALDO INSUFFICIENTE · SERVONO € '+(result.need??0),uguale:'È GIÀ COSÌ',
  colore:'COLORE NON DISPONIBILE PER QUESTO MODELLO',livello:'LIVELLO NON PREVISTO',sconosciuto:'VEICOLO NON TROVATO'}[result.reason]||'NON RIUSCITO';
}
/* Neon sottoscocca (grafica provvisoria): un'ellisse sfumata appena più larga della scocca. */
export function drawNeonUnderglow(ctx,vehicle,night=0,clock=0){
 const rgb=NEON_COLORS[vehicle?.tuning?.neon];if(!rgb)return false;
 const n=Math.max(0,Math.min(1,Number(night)||0));
 const alpha=(.32+.5*n)*(.92+.08*Math.sin(clock*6));
 ctx.save();ctx.translate(vehicle.x,vehicle.y);ctx.rotate(vehicle.a);ctx.scale(1.75,1);
 const g=ctx.createRadialGradient(0,0,0,0,0,3.4);
 g.addColorStop(0,`rgba(${rgb},${alpha.toFixed(3)})`);g.addColorStop(.6,`rgba(${rgb},${(alpha*.55).toFixed(3)})`);g.addColorStop(1,`rgba(${rgb},0)`);
 ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,3.4,0,Math.PI*2);ctx.fill();
 ctx.restore();return true;
}
// Di notte: luce colorata sull'asfalto (sopra la mappa del buio, come i fari).
export function neonNightGlows(vehicle,level){
 const rgb=NEON_COLORS[vehicle?.tuning?.neon];if(!rgb||!(level>0))return {lights:[],glows:[]};
 return {lights:[{x:vehicle.x,y:vehicle.y,r:6.5,strength:.55*level}],
  glows:[{x:vehicle.x,y:vehicle.y,r:6.2,strength:level,alpha:.42,color:rgb}]};
}
