/* Four professions from the approved 384x160 RGBA atlas.
 * Columns 0-3 fryer, 4-7 vigile, 8-11 lavavetri, 12-15 contrabbandiere.
 * Rows: up, down, left, right; 24x40 per frame, feet at world anchor. */
import {pedestrianDirection} from './pedestrian-sprites.mjs?v=001';
export const PROFESSION_ATLAS_PATH='./assets/people/npc-mestieri-4chars-4dir-4frames-24x40.png';
export const PROFESSION_TYPES=Object.freeze(['friggitore','vigile','lavavetri','contrabbandiere']);
let image=null;
export function loadProfessionSprites(){
 if(image||typeof Image==='undefined')return;
 image=new Image();
 image.onerror=()=>console.warn('GTA Melito: professioni PNG non disponibile');
 image.src=new URL(PROFESSION_ATLAS_PATH,import.meta.url).href;
}
export function professionSpriteReady(){
 return !!(image?.complete&&image.naturalWidth===384&&image.naturalHeight===160);
}
export function drawProfessionSprite(ctx,x,y,angle,profession,clock=0,moving=false,speed=0,seed=0){
 const type=PROFESSION_TYPES.indexOf(profession);
 if(type<0)return false;
 if(!image)loadProfessionSprites();
 if(!professionSpriteReady())return false;
 const row=pedestrianDirection(angle);
 const phase=((Math.floor(clock*Math.max(3,Math.abs(speed)*3)+(seed||0)*.013)%4)+4)%4;
 const frame=moving?phase:0;
 const width=3.25,height=4.7;
 ctx.drawImage(image,(type*4+frame)*24,row*40,24,40,x-width/2,y-height+.8,width,height);
 return true;
}
