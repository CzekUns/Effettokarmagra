/* Q35 — garage di gioco e archivio persistente dei veicoli posseduti.
 * I DUE GARAGE SONO DI FANTASIA: punti plausibili scelti sulla mappa OSM (una saracinesca sul
 * marciapiede, davanti alla facciata di un edificio OSM, a 1,8 m dal bordo della carreggiata), non
 * attività reali. Regola arcade visibile: un'auto parcheggiata o presa in strada è «temporanea»;
 * appena la metti in un garage diventa «registrata» (tua), con modello, colore e futuro tuning.
 * L'archivio vive nel salvataggio della campagna (progress.garage) e ha al massimo 6 posti.
 * Un veicolo è sempre in UN solo posto: in garage (stored) oppure in strada (ownedId sull'auto).
 * Al ricaricamento un'auto registrata rimasta in strada torna nel suo garage: mai persa né doppia. */
import {CAR_ATLAS_VARIANTS,EXTRA_CAR_VARIANTS,APE_CAR_VARIANTS} from './car-sprites.mjs?v=116';

export const GARAGE_SLOTS=6;
export const GARAGE_RADIUS={car:9,foot:6};
// door: saracinesca sul marciapiede (fuori carreggiata); face: verso l'edificio; road: centro strada
// davanti; spawn: corsia lato marciapiede dove ricompare l'auto; along: direzione della strada.
export const GARAGES=Object.freeze([
 Object.freeze({id:'abete',nome:'Garage Abete',kind:'garage',strada:'Via Don Raffaele Abete',fantasia:true,
  door:Object.freeze({x:1051.3,y:1416}),face:-1.553,road:Object.freeze({x:1051.15,y:1425.45}),along:.018}),
 Object.freeze({id:'cervi',nome:'Garage e officina Cervi',kind:'officina',strada:'Via Fratelli Cervi',fantasia:true,
  door:Object.freeze({x:1388.5,y:1424.3}),face:1.576,road:Object.freeze({x:1388.5,y:1414.85}),along:3.1364})
]);
export const GARAGE_LANE_OFFSET=3.6;

const VARIANT_TABLES=[CAR_ATLAS_VARIANTS,EXTRA_CAR_VARIANTS,APE_CAR_VARIANTS];
export function spriteVariant(model){for(const t of VARIANT_TABLES)if(t[model])return t[model];return null;}
// Auto e Ape del traffico/parcheggi: sì. Moto, Ape del mercato e furgoni degli ambulanti: no
// (appartengono ai banchi e alle bancarelle, toglierli romperebbe il mercato).
export function canStoreVehicle(vehicle){
 if(!vehicle||vehicle.vehicleType==='motorcycle'||vehicle.vendor||vehicle.market)return false;
 const model=String(vehicle.model||'');
 if(model==='ape-car-azzurra'||model==='furgone-fritti')return false;
 return !!spriteVariant(model)||model==='panda-modern-white'||model==='panda-fire-red';
}
export const freshTuning=()=>({perf:0,neon:null,paintPaid:0});
export function freshGarageSave(){return {next:1,vehicles:[],spent:0};}
const cleanTuning=t=>({perf:[0,5,10,15].includes(Number(t?.perf))?Number(t.perf):0,
 neon:typeof t?.neon==='string'&&t.neon.length<20?t.neon:null,paintPaid:Math.max(0,Number(t?.paintPaid)||0)});
export function sanitizeGarageSave(raw){
 const save=freshGarageSave();
 if(!raw||typeof raw!=='object')return save;
 const seen=new Set();
 for(const v of Array.isArray(raw.vehicles)?raw.vehicles:[]){
  if(save.vehicles.length>=GARAGE_SLOTS)break;
  if(!v||typeof v.id!=='string'||seen.has(v.id)||!canStoreVehicle({model:v.model}))continue;
  const garage=GARAGES.some(g=>g.id===v.garage)?v.garage:GARAGES[0].id;
  seen.add(v.id);
  // Rimasta in strada alla chiusura: torna nel suo garage (mai persa, mai doppia).
  save.vehicles.push({id:v.id,model:v.model,type:Number.isInteger(v.type)?v.type:0,garage,stored:true,
   damage:Math.max(0,Math.min(1,Number(v.damage)||0)),tuning:cleanTuning(v.tuning)});
 }
 const maxId=save.vehicles.reduce((m,v)=>Math.max(m,Number(v.id.slice(1))||0),0);
 save.next=Math.max(maxId+1,Number.isInteger(raw.next)?raw.next:1);
 save.spent=Math.max(0,Number(raw.spent)||0);
 return save;
}
export function garageById(id){return GARAGES.find(g=>g.id===id)||null;}
export function nearestGarage(garages,point,inCar){
 const radius=inCar?GARAGE_RADIUS.car:GARAGE_RADIUS.foot;let best=null;
 for(const g of garages||GARAGES){
  const d=Math.hypot(g.door.x-point.x,g.door.y-point.y);
  if(d<=radius&&(!best||d<best.distance))best={garage:g,distance:d};
 }
 return best?.garage||null;
}
export const ownedCount=save=>save?.vehicles?.length||0;
export function ownedEntry(save,id){return save?.vehicles?.find(v=>v.id===id)||null;}
/* Mette in garage il veicolo guidato. Se è già registrato riprende il SUO posto (nessun posto
 * nuovo, nessun doppione); altrimenti occupa un posto libero. Il chiamante toglie l'auto dalla strada. */
export function depositVehicle(save,vehicle,garageId){
 if(!save||!garageById(garageId))return {ok:false,reason:'garage'};
 if(!canStoreVehicle(vehicle))return {ok:false,reason:'non-ammesso'};
 let entry=vehicle.ownedId?ownedEntry(save,vehicle.ownedId):null;
 if(entry){
  entry.stored=true;entry.garage=garageId;entry.model=vehicle.model;entry.damage=Math.max(0,Math.min(1,Number(vehicle.damage)||0));
  return {ok:true,entry,already:true};
 }
 if(save.vehicles.length>=GARAGE_SLOTS)return {ok:false,reason:'pieno'};
 entry={id:'v'+save.next++,model:vehicle.model,type:Number.isInteger(vehicle.type)?vehicle.type:0,garage:garageId,stored:true,
  damage:Math.max(0,Math.min(1,Number(vehicle.damage)||0)),tuning:{...freshTuning(),...(vehicle.tuning?cleanTuning(vehicle.tuning):{})}};
 save.vehicles.push(entry);
 return {ok:true,entry,already:false};
}
// Ritira un veicolo da questo garage: dopo, il veicolo è «in strada» finché non torna in un garage.
export function takeVehicle(save,id,garageId){
 const entry=ownedEntry(save,id);
 if(!entry)return {ok:false,reason:'sconosciuto'};
 if(!entry.stored)return {ok:false,reason:'gia-fuori'};
 if(entry.garage!==garageId)return {ok:false,reason:'altro-garage'};
 entry.stored=false;
 return {ok:true,entry};
}
// L'auto da mettere in strada: stesso modello/colore/tuning, legata al posto con ownedId.
export function vehicleFromEntry(entry,pose){
 return {x:pose.x,y:pose.y,a:pose.a,speed:0,model:entry.model,type:entry.type||0,vehicleType:'car',
  ownedId:entry.id,damage:entry.damage||0,tuning:entry.tuning};
}
/* Punti davanti alla saracinesca dove far ricomparire l'auto (corsia lato marciapiede), dal più
 * vicino; il chiamante prende il primo libero da collisioni (auto, traffico, persone, edifici). */
export function exitSpots(garage){
 const nx=Math.cos(garage.face),ny=Math.sin(garage.face),ux=Math.cos(garage.along),uy=Math.sin(garage.along);
 const out=[];
 for(const shift of [0,7,-7,14,-14,21,-21])for(const a of [garage.along,garage.along+Math.PI])
  out.push({x:garage.road.x+nx*GARAGE_LANE_OFFSET+ux*shift,y:garage.road.y+ny*GARAGE_LANE_OFFSET+uy*shift,a,shift});
 return out;
}
export function chooseExitSpot(garage,isFree){
 for(const spot of exitSpots(garage))if(isFree(spot))return spot;
 return null;
}
export function garageMessage(result){
 if(result.ok)return result.already?'AUTO RIMESSA AL SUO POSTO':'AUTO REGISTRATA E MESSA IN GARAGE';
 return {pieno:'GARAGE PIENO · MAX '+GARAGE_SLOTS+' POSTI','non-ammesso':'QUESTO MEZZO NON ENTRA IN GARAGE',
  'gia-fuori':'È GIÀ IN STRADA','altro-garage':'È IN UN ALTRO GARAGE',sconosciuto:'VEICOLO NON TROVATO',
  garage:'NESSUN GARAGE QUI',bloccato:'NESSUNO SPAZIO LIBERO DAVANTI AL GARAGE'}[result.reason]||'NON RIUSCITO';
}
export function vehicleLabel(model){
 const v=spriteVariant(model);
 const base=String(v?.model||model).replace(/-\d{4}$/,'').replace(/-188$/,'').replace(/-/g,' ').toUpperCase();
 const color=v?.color||v?.paint||(model==='panda-fire-red'?'rossa':model==='panda-modern-white'?'bianca':'');
 return base.replace(/ (WHITE|RED)$/,'')+(color?' · '+String(color).toUpperCase():'');
}
/* Grafica provvisoria (da approvare): saracinesca a doghe sul marciapiede, rampa gialla verso la
 * strada, insegna; un anello pulsante quando il giocatore è vicino. */
export function drawGarage(ctx,garage,clock,near=false){
 const {x,y}=garage.door;
 ctx.save();ctx.translate(x,y);ctx.rotate(garage.face+Math.PI/2);
 // rampa (verso la strada, +y locale)
 ctx.fillStyle='rgba(70,72,76,.55)';ctx.fillRect(-3.4,-.2,6.8,2.3);
 ctx.strokeStyle='#e9c540';ctx.lineWidth=.22;ctx.setLineDash([.6,.5]);
 ctx.beginPath();ctx.moveTo(-3.4,2.1);ctx.lineTo(-3.4,-.2);ctx.moveTo(3.4,2.1);ctx.lineTo(3.4,-.2);ctx.stroke();ctx.setLineDash([]);
 // saracinesca
 ctx.fillStyle=garage.kind==='officina'?'#7b8a96':'#8d9298';ctx.fillRect(-3.2,-1.4,6.4,1.25);
 ctx.strokeStyle='#4b5157';ctx.lineWidth=.1;
 for(let i=-1.25;i<-.2;i+=.25){ctx.beginPath();ctx.moveTo(-3.2,i);ctx.lineTo(3.2,i);ctx.stroke();}
 ctx.strokeStyle='#2e3336';ctx.lineWidth=.22;ctx.strokeRect(-3.2,-1.4,6.4,1.25);
 ctx.restore();
 ctx.save();
 if(near){const pulse=.8+.2*Math.sin(clock*4.5);ctx.globalAlpha=.3;ctx.strokeStyle='#ffe36f';ctx.lineWidth=.5;
  ctx.beginPath();ctx.arc(x,y,3.4*pulse+1,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;}
 const label=garage.kind==='officina'?'GARAGE · TUNING':'GARAGE';
 ctx.font='bold 1.9px monospace';ctx.textAlign='center';
 const w=label.length*1.2+1.4;
 ctx.fillStyle='#1d2a33';ctx.fillRect(x-w/2,y-5.6,w,2.7);
 ctx.strokeStyle=garage.kind==='officina'?'#ff5fc8':'#f8d867';ctx.lineWidth=.2;ctx.strokeRect(x-w/2,y-5.6,w,2.7);
 ctx.fillStyle='#fff0b0';ctx.fillText(label,x,y-3.7);
 ctx.restore();
}
