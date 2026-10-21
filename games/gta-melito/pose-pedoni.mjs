/* Pose ferme derivate dai fogli pedoni: 4 colonne di personaggi × 4 righe.
 * 0 seduto, 1–2 in piedi con piccolo gesto, 3 appoggiato. Solo grafica. */
import {ps} from './world-scale.mjs?v=001';
import {PEDESTRIAN_SHEETS,PEDESTRIAN_KIND_COUNT,pedestrianSheetForKind} from './extra-pedestrian-sprites.mjs?v=007';

export const IDLE_POSE_CELL=Object.freeze({width:24,height:40,columns:4,rows:4});
export const IDLE_POSE_SHEETS=Object.freeze(['madre','secondo-lotto',...PEDESTRIAN_SHEETS.map(s=>s.id)]);
export const idlePoseSourceForKind=kind=>{
 if(!Number.isInteger(kind)||kind<0||kind>=PEDESTRIAN_KIND_COUNT)return null;
 if(kind<4)return {id:'madre',identity:kind};
 if(kind<7)return {id:'secondo-lotto',identity:kind-3};
 const sheet=pedestrianSheetForKind(kind);
 return sheet?{id:sheet.id,identity:kind-sheet.startKind}:null;
};
const images=new Map();
export function loadIdlePoseSheets(){
 if(typeof Image==='undefined')return;
 for(const id of IDLE_POSE_SHEETS){
  if(images.has(id))continue;
  const img=new Image();images.set(id,img);
  img.onerror=()=>console.warn('GTA Melito: pose pedoni mancanti: '+id);
  img.src=new URL(`./assets/people/pose-${id}.png`,import.meta.url).href;
 }
}
export function idlePoseReady(id){
 const img=images.get(id);
 return !!(img?.complete&&img.naturalWidth===96&&img.naturalHeight===160);
}
export function idlePoseRow(person,clock){
 if(person.activity==='bench')return 0;
 if(person.pose==='leaning')return 3;
 return 1+((Math.floor(clock/1.5+(person.seed%11)/11))&1);
}
export function drawIdlePose(ctx,x,y,person,clock){
 const source=idlePoseSourceForKind(person.kind);
 if(!source||!idlePoseReady(source.id))return false;
 const row=idlePoseRow(person,clock),width=ps(3.25),height=ps(4.7);
 const flip=row===3?Math.cos(person.a||0)<0:Math.cos(person.a||0)>0;
 ctx.save();
 if(flip){ctx.translate(2*x,0);ctx.scale(-1,1);}
 ctx.drawImage(images.get(source.id),source.identity*24,row*40,24,40,
  x-width/2,y-height+ps(.8),width,height);
 ctx.restore();
 return true;
}

/* Solo durante la giocata a carte: sovrappone la manica del frame del gesto
 * al busto già seduto, senza far alzare il personaggio. */
export function drawIdleCardGesture(ctx,x,y,person){
 const source=idlePoseSourceForKind(person.kind);if(!source||!idlePoseReady(source.id))return false;
 const width=ps(3.25),height=ps(4.7),dx=x-width/2,dy=y-height+ps(.8);
 ctx.drawImage(images.get(source.id),source.identity*24+14,80+16,9,16,
  dx+14/24*width,dy+21/40*height,9/24*width,16/40*height);
 return true;
}
