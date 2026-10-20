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
