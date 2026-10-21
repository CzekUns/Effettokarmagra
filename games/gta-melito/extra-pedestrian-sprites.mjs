/* GTA Melito — second approved sheet: red-hoodie hero plus three street NPCs.
 * 4 identities × 4 directions × 4 walking frames, transparent 384×160 atlas.
 * No changes to collision radius, AI pathfinding or player movement.
 */
import {VEHICLE_SCALE,PERSON_SCALE,vs,ps} from './world-scale.mjs?v=001';
import {pedestrianDirection} from './pedestrian-sprites.mjs?v=002';
export const EXTRA_PEDESTRIAN_ATLAS_PATH='./assets/people/pedoni-secondo-lotto-4x4frames-24x40-rgba.png';
export const EXTRA_PEDESTRIAN_IDENTITIES=Object.freeze(['protagonist-red-hoodie','woman-white','man-green-tracksuit','worker-orange-vest']);
export const EXTRA_PEDESTRIAN_CELL=Object.freeze({width:24,height:40,columns:16,rows:4});
export const EXTRA_PEDESTRIAN_NPC_START_KIND=4;
let image=null;
export function loadExtraPedestrianSprites(){
 if(image||typeof Image==='undefined')return;
 const picture=new Image();
 image=picture;
 picture.onerror=()=>console.warn('GTA Melito: second pedestrian atlas unavailable; using original art');
 picture.src=new URL(EXTRA_PEDESTRIAN_ATLAS_PATH,import.meta.url).href;
}
export function extraPedestrianSpriteReady(){
 return !!(image?.complete&&image.naturalWidth===384&&image.naturalHeight===160);
}
export function drawExtraPedestrianSprite(ctx,x,y,angle,identity=0,clock=0,moving=true,speed=1,seed=0){
 if(!extraPedestrianSpriteReady()||!Number.isInteger(identity)||identity<0||identity>=EXTRA_PEDESTRIAN_IDENTITIES.length)return false;
 const dir=pedestrianDirection(angle);
 const phase=((Math.floor(clock*Math.max(3,Math.abs(speed||0)*3)+seed*.013)%4)+4)%4;
 const frame=moving?phase:0;
 const width=ps(3.25),height=ps(4.7);// BF14: people at PERSON_SCALE (world-scale.mjs)
 ctx.drawImage(image,(identity*4+frame)*24,dir*40,24,40,x-width/2,y-height+ps(.8),width,height);
 return true;
}

/* Fogli extra dei pedoni (CODEX-GH, 2026-10-21): lotto 2, 10–14 e 17–20. Ogni foglio è un atlante
 * 384×160 (4 identità × 4 frame nelle colonne, 4 direzioni nelle righe, celle 24×40) con i frame
 * adattati a zone dalla tavola madre (stesse pose, pivot e scala). I kind degli NPC proseguono in
 * sequenza dopo i 4 originali e i 3 del secondo lotto: lotto 2 = 7–10, lotto 10 = 11–14,
 * lotto 11 = 15–18, lotto 12 = 19–22, lotto 13 = 23–26, lotto 14 = 27–30,
 * lotti 17–20 = 31–46. Le varianti cromatiche dei fogli esistenti iniziano da 47.
 * I ragazzini dei lotti 13 e 20 sono più bassi nella cella.
 * Una cache per immagine: se un PNG manca, i suoi kind
 * ricadono sui fogli precedenti (city-art.mjs). Grafica PROVVISORIA, da approvare da Simone. */
export const PEDESTRIAN_SHEET_CELL=Object.freeze({width:24,height:40,columns:16,rows:4});
export const PEDESTRIAN_SHEET_SIZE=Object.freeze({width:384,height:160});
// NPC kinds 0–3: first sheet, 4–6: second sheet (identities 1–3), from 7 on: the extra sheets below.
export const PEDESTRIAN_SHEET_START_KIND=EXTRA_PEDESTRIAN_NPC_START_KIND+EXTRA_PEDESTRIAN_IDENTITIES.length-1;
const BASE_SHEET_LIST=[
 ['lotto2',['signora-anziana-borsa','ragazzo-zaino','uomo-giacca-lavoro','ragazza-cappotto-rosso']],
 ['lotto10',['signora-anziana-cappotto-borsa','ragazzo-felpa-zaino','donna-giacca-tracolla','uomo-giacca-cravatta-valigetta']],
 ['lotto11',['ragazza-telefono','uomo-robusto-righe','donna-vestito-corallo','sportivo-tuta']],
 ['lotto12',['nonno-coppola-bastone','nonna-vestito-fiori','ragazzo-cuffie','ragazza-giacca-jeans']],
 ['lotto13',['operaio-gilet','signora-carrello','ragazzino-pallone','barista-grembiule']],
 ['lotto14',['uomo-canottiera','signora-elegante-cappello','studente-occhiali','donna-velo']],
 ['lotto17',['postino-borsa','pizzaiolo-cartoni','netturbino-scopa','prete-talare']],
 ['lotto18',['turista-fotocamera','ragazzo-skateboard','donna-tailleur-cartella','anziano-giornale']],
 ['lotto19',['mamma-bambino','ragazza-cane','uomo-sedia-rotelle','ragazzo-delivery']],
 ['lotto20',['nonna-grembiule-scopa','ragazzino-scuola','uomo-tuta-telefono','donna-carrello-mercato']]
];
export const PEDESTRIAN_VARIANT_FIRST_KIND=PEDESTRIAN_SHEET_START_KIND+BASE_SHEET_LIST.length*4;
const VARIANT_SOURCES=[['madre',['man-blue','woman-red','elder-beige','rider-yellow']],...BASE_SHEET_LIST];
const VARIANT_SHEET_LIST=[1,2].flatMap(variant=>VARIANT_SOURCES.map(([source,identities])=>
 [source+'-var'+variant,identities.map(name=>name+'-var'+variant)]));
export const PEDESTRIAN_SHEETS=Object.freeze([...BASE_SHEET_LIST,...VARIANT_SHEET_LIST].reduce((out,[id,identities])=>{
 const previous=out[out.length-1];
 const startKind=previous?previous.startKind+previous.identities.length:PEDESTRIAN_SHEET_START_KIND;
 out.push(Object.freeze({id,path:'./assets/people/pedoni-'+id+'-4x4frames-24x40-rgba.png',startKind,identities:Object.freeze(identities)}));
 return out;
},[]));
const LAST_SHEET=PEDESTRIAN_SHEETS[PEDESTRIAN_SHEETS.length-1];
export const PEDESTRIAN_KIND_COUNT=LAST_SHEET.startKind+LAST_SHEET.identities.length;
export const pedestrianSheet=id=>PEDESTRIAN_SHEETS.find(s=>s.id===id)||null;
const KIND_TO_SHEET=Array.from({length:PEDESTRIAN_KIND_COUNT},(_,kind)=>
 PEDESTRIAN_SHEETS.find(s=>kind>=s.startKind&&kind<s.startKind+s.identities.length)||null);
export const pedestrianSheetForKind=kind=>Number.isInteger(kind)?
 KIND_TO_SHEET[kind]||null:null;
const sheets=new Map();
export function loadPedestrianSheets(){
 if(typeof Image==='undefined')return;
 for(const sheet of PEDESTRIAN_SHEETS){
  if(sheets.has(sheet.id))continue;
  const picture=new Image();
  sheets.set(sheet.id,picture);
  picture.onerror=()=>console.warn('GTA Melito: pedestrian sheet '+sheet.id+' unavailable; using the previous sheets');
  picture.src=new URL(sheet.path,import.meta.url).href;
 }
}
export function pedestrianSheetReady(id){
 const picture=sheets.get(id);
 return !!(picture?.complete&&picture.naturalWidth===PEDESTRIAN_SHEET_SIZE.width&&picture.naturalHeight===PEDESTRIAN_SHEET_SIZE.height);
}
/* Draws the NPC of the given kind from the extra sheets; false if the kind belongs to the first
 * two sheets or its PNG is not ready (the caller then falls back). Same walking phase, pivot and
 * destination size as the other sheets (BF14 PERSON_SCALE). */
export function drawSheetPedestrianSprite(ctx,x,y,angle,kind,clock=0,moving=true,speed=1,seed=0){
 const sheet=pedestrianSheetForKind(kind);
 if(!sheet||!pedestrianSheetReady(sheet.id))return false;
 const identity=kind-sheet.startKind,dir=pedestrianDirection(angle);
 const phase=((Math.floor(clock*Math.max(3,Math.abs(speed||0)*3)+seed*.013)%4)+4)%4;
 const frame=moving?phase:0;
 const width=ps(3.25),height=ps(4.7);
 ctx.drawImage(sheets.get(sheet.id),(identity*4+frame)*PEDESTRIAN_SHEET_CELL.width,dir*PEDESTRIAN_SHEET_CELL.height,
  PEDESTRIAN_SHEET_CELL.width,PEDESTRIAN_SHEET_CELL.height,x-width/2,y-height+ps(.8),width,height);
 return true;
}

/* Lotto 2 names kept for the older callers and tests: same table, same cache. */
const LOTTO2=pedestrianSheet('lotto2');
export const LOTTO2_PEDESTRIAN_ATLAS_PATH=LOTTO2.path;
export const LOTTO2_PEDESTRIAN_IDENTITIES=LOTTO2.identities;
export const LOTTO2_PEDESTRIAN_CELL=PEDESTRIAN_SHEET_CELL;
export const LOTTO2_PEDESTRIAN_NPC_START_KIND=LOTTO2.startKind;
export const loadLotto2PedestrianSprites=loadPedestrianSheets;
export const lotto2PedestrianSpriteReady=()=>pedestrianSheetReady('lotto2');
export function drawLotto2PedestrianSprite(ctx,x,y,angle,identity=0,clock=0,moving=true,speed=1,seed=0){
 if(!Number.isInteger(identity)||identity<0||identity>=LOTTO2.identities.length)return false;
 return drawSheetPedestrianSprite(ctx,x,y,angle,LOTTO2.startKind+identity,clock,moving,speed,seed);
}
