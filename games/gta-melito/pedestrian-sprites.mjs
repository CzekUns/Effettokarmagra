/* GTA Melito — 4 top-down/three-quarter NPC sprites, 4 facing directions
 * and 4 walking frames. One transparent 384x160 palette PNG, 24x40 cells.
 * Visual-only layer: actor position, pathfinding and collision stay unchanged.
 * Canvas fallback remains in city-art while the atlas is pending/unavailable.
 */
import {VEHICLE_SCALE,PERSON_SCALE,vs,ps} from './world-scale.mjs?v=001';
export const PEOPLE_ATLAS_PATH='./assets/people/pedoni-4x4frames-24x40-rgba.png';
export const PEOPLE_ATLAS_CELL=Object.freeze({width:24,height:40,columns:16,rows:4});
export const PEOPLE_SPRITE_TYPES=Object.freeze(['man-blue','woman-red','elder-beige','rider-yellow']);
export const PEOPLE_DIRECTIONS=Object.freeze(['up','down','left','right']);
let atlas=null;
export function loadPedestrianSprites(){
 if(atlas||typeof Image==='undefined')return;
 const img=new Image();
 atlas=img;
 img.onerror=()=>console.warn('GTA Melito: pedestrian atlas missing, using procedural NPCs');
 img.src=new URL(PEOPLE_ATLAS_PATH,import.meta.url).href;
}
export function pedestrianSpriteReady(){
 return !!(atlas?.complete&&atlas.naturalWidth===384&&atlas.naturalHeight===160);
}
export function pedestrianDirection(angle){
 const a=Number.isFinite(angle)?angle:0;
 return Math.abs(Math.cos(a))>=Math.abs(Math.sin(a))?(Math.cos(a)>=0?3:2):(Math.sin(a)>=0?1:0);
}
export function drawPedestrianSprite(ctx,x,y,angle,kind=0,clock=0,moving=true,speed=1,seed=0){
 if(!pedestrianSpriteReady())return false;
 const character=((Number(kind)||0)%4+4)%4;
 const dir=pedestrianDirection(angle);
 const phase=((Math.floor(clock*Math.max(3,Math.abs(speed||0)*3)+seed*.013)%4)+4)%4;
 const frame=moving?phase:0;
 const sx=(character*4+frame)*PEOPLE_ATLAS_CELL.width;
 const sy=dir*PEOPLE_ATLAS_CELL.height;
 // Render-size tuned to the existing cars (~5.3 x 8.6 world units);
 // shadow is part of the supplied sprite, feet near collision centre.
 const width=ps(3.25),height=ps(4.7);// BF14: people at PERSON_SCALE (world-scale.mjs)
 ctx.drawImage(atlas,sx,sy,PEOPLE_ATLAS_CELL.width,PEOPLE_ATLAS_CELL.height,
  x-width/2,y-height+ps(.8),width,height);
 return true;
}
