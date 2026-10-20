/* GTA Melito — street fryer in a white coat and white cook's cap.
 * The 96×160 indexed PNG contains 4 directions × 4 walk frames, 24×40 each.
 * Same origin and visual world scale as the existing city pedestrian sheets.
 */
import {VEHICLE_SCALE,PERSON_SCALE,vs,ps} from './world-scale.mjs?v=001';
import {pedestrianDirection} from './pedestrian-sprites.mjs?v=002';
export const FRYER_ATLAS_PATH='./assets/people/friggitore-bianco-4dir-4frames-24x40.png';
export const FRYER_CELL=Object.freeze({width:24,height:40,directions:4,frames:4});
let atlas=null;
export function loadFryerSprite(){
 if(atlas||typeof Image==='undefined')return;
 atlas=new Image();
 atlas.onerror=()=>console.warn('GTA Melito: friggitore sprite unavailable');
 atlas.src=new URL(FRYER_ATLAS_PATH,import.meta.url).href;
}
export function fryerSpriteReady(){
 return !!(atlas?.complete&&atlas.naturalWidth===96&&atlas.naturalHeight===160);
}
export function drawFryerSprite(ctx,x,y,angle,clock=0,moving=true,speed=1,seed=0){
 if(!fryerSpriteReady())return false;
 const dir=pedestrianDirection(angle);
 const phase=((Math.floor(clock*Math.max(3,Math.abs(speed||0)*3)+seed*.013)%4)+4)%4;
 const frame=moving?phase:0;
 const width=ps(3.25),height=ps(4.7);// BF14: people at PERSON_SCALE (world-scale.mjs)
 ctx.drawImage(atlas,frame*FRYER_CELL.width,dir*FRYER_CELL.height,
  FRYER_CELL.width,FRYER_CELL.height,x-width/2,y-height+ps(.8),width,height);
 return true;
}
