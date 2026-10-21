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

/* Lotto 2 (CODEX-GH, 2026-10-21): third sheet, four more street NPCs whose frames are
 * adapted zone by zone from the first atlas (same poses, pivot and scale). Separate cache:
 * if this PNG is missing the people fall back to the first sheet. Grafica PROVVISORIA. */
export const LOTTO2_PEDESTRIAN_ATLAS_PATH='./assets/people/pedoni-lotto2-4x4frames-24x40-rgba.png';
export const LOTTO2_PEDESTRIAN_IDENTITIES=Object.freeze(['signora-anziana-borsa','ragazzo-zaino','uomo-giacca-lavoro','ragazza-cappotto-rosso']);
export const LOTTO2_PEDESTRIAN_CELL=Object.freeze({width:24,height:40,columns:16,rows:4});
// NPC kinds 0–3: first sheet, 4–6: second sheet (identities 1–3), 7–10: lotto 2 (identities 0–3).
export const LOTTO2_PEDESTRIAN_NPC_START_KIND=7;
export const PEDESTRIAN_KIND_COUNT=LOTTO2_PEDESTRIAN_NPC_START_KIND+LOTTO2_PEDESTRIAN_IDENTITIES.length;
let lotto2=null;
export function loadLotto2PedestrianSprites(){
 if(lotto2||typeof Image==='undefined')return;
 const picture=new Image();
 lotto2=picture;
 picture.onerror=()=>console.warn('GTA Melito: lotto 2 pedestrian atlas unavailable; using the first sheets');
 picture.src=new URL(LOTTO2_PEDESTRIAN_ATLAS_PATH,import.meta.url).href;
}
export function lotto2PedestrianSpriteReady(){
 return !!(lotto2?.complete&&lotto2.naturalWidth===384&&lotto2.naturalHeight===160);
}
export function drawLotto2PedestrianSprite(ctx,x,y,angle,identity=0,clock=0,moving=true,speed=1,seed=0){
 if(!lotto2PedestrianSpriteReady()||!Number.isInteger(identity)||identity<0||identity>=LOTTO2_PEDESTRIAN_IDENTITIES.length)return false;
 const dir=pedestrianDirection(angle);
 const phase=((Math.floor(clock*Math.max(3,Math.abs(speed||0)*3)+seed*.013)%4)+4)%4;
 const frame=moving?phase:0;
 const width=ps(3.25),height=ps(4.7);// same destination as the other sheets (BF14 PERSON_SCALE)
 ctx.drawImage(lotto2,(identity*4+frame)*LOTTO2_PEDESTRIAN_CELL.width,dir*LOTTO2_PEDESTRIAN_CELL.height,
  LOTTO2_PEDESTRIAN_CELL.width,LOTTO2_PEDESTRIAN_CELL.height,x-width/2,y-height+ps(.8),width,height);
 return true;
}
