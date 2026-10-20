/* GTA Melito — compact transparent motorcycles, distinct riding physics,
 * and a seated human drawn on top of the vehicle instead of a car silhouette.
 * 4 models × 4 paints, one 160×272 PNG (40×68 each cell).
 */
export const MOTORCYCLE_ATLAS_PATH='./assets/vehicles/moto-16-40x68-256.png';
export const MOTORCYCLE_MODELS=Object.freeze(['scooter-sh','scooter-retro','moto-naked','moto-sport']);
export const MOTORCYCLE_COLORS=Object.freeze(['white','red','black','blue']);
export const MOTORCYCLE_IDS=Object.freeze(MOTORCYCLE_MODELS.flatMap(m=>MOTORCYCLE_COLORS.map(c=>`moto-${m}-${c}`)));
export const MOTORCYCLE_CELL=Object.freeze({width:40,height:68,columns:4,rows:4});
import {stepVehicle,MOTORCYCLE_HANDLING} from './vehicle-handling.mjs?v=002';
export const isMotorcycle=v=>v?.vehicleType==='motorcycle';
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
let atlas=null;
export function loadMotorcycleSprites(){
 if(atlas||typeof Image==='undefined')return;
 const img=new Image();
 atlas=img;
 img.onerror=()=>console.warn('GTA Melito: motorcycle atlas unavailable, using canvas fallback');
 img.src=new URL(MOTORCYCLE_ATLAS_PATH,import.meta.url).href;
}
export function motorcycleSpriteReady(){return !!(atlas?.complete&&atlas.naturalWidth===160&&atlas.naturalHeight===272);}
export function motorcycleVariant(model){
 const index=MOTORCYCLE_IDS.indexOf(model);
 return index>=0?{index,column:index%4,row:Math.floor(index/4)}:null;
}
// Q10: same physics, numbers from a handling profile (default = the historical motorcycle values).
export function stepMotorcycle(speed,angle,axis,braking,dt,serviceBrake=false,profile=MOTORCYCLE_HANDLING,wet=0){
 return stepVehicle(speed,angle,axis,braking,dt,serviceBrake,profile,wet);
}

export function chooseMotorcycleDismount(vehicle,valid,blocked=()=>false){
 if(!vehicle||Math.abs(vehicle.speed||0)>2.3)return null;
 const a=vehicle.a,sideX=-Math.sin(a),sideY=Math.cos(a),fx=Math.cos(a),fy=Math.sin(a);
 // Prefer left, then right, then behind. Never teleport into a wall.
 const candidates=[[1,3.0],[-1,3.0],[1,4.0],[-1,4.0],[0,-3.4]];
 for(const [side,d] of candidates){
  const x=vehicle.x+sideX*side*(side?d:0)+(!side?fx*d:0);
  const y=vehicle.y+sideY*side*(side?d:0)+(!side?fy*d:0);
  if(valid(x,y)&&!blocked(x,y))return {x,y};
 }
 return null;
}
export function drawMotorcycle(ctx,x,y,angle,model,{rider=false,focused=false,jacket='#b7343b'}={}){
 const variant=motorcycleVariant(model);
 const bodyWidth=3.15,bodyLength=6.45;
 ctx.save();ctx.translate(x,y);ctx.rotate(angle+Math.PI/2);
 if(variant&&motorcycleSpriteReady()){
  ctx.imageSmoothingEnabled=false;
  ctx.drawImage(atlas,variant.column*40,variant.row*68,40,68,-bodyWidth/2,-bodyLength/2,bodyWidth,bodyLength);
 }else{
  // Fallback stays drivable even before the PNG loads.
  ctx.fillStyle='#242b30';ctx.fillRect(-.43,-2.8,.86,5.6);
  ctx.fillStyle='#b43d34';ctx.fillRect(-1,-1.85,2,3.7);
  ctx.fillStyle='#353b43';ctx.fillRect(-.58,-.5,1.16,2.3);
  ctx.strokeStyle='#cbd1cb';ctx.lineWidth=.16;
  ctx.beginPath();ctx.moveTo(-1.55,-1.5);ctx.lineTo(1.55,-1.5);ctx.stroke();
 }
 if(!rider){
  // A small kickstand keeps an unoccupied scooter visually distinct.
  ctx.strokeStyle='#171d21';ctx.lineWidth=.17;
  ctx.beginPath();ctx.moveTo(-.58,.95);ctx.lineTo(-1.4,1.68);ctx.stroke();
 }
 if(rider){
  // Helmet, shoulders, hands and legs. Face/helmet point toward bike front.
  ctx.fillStyle='#282c32';ctx.beginPath();ctx.ellipse(-.72,1.1,.31,.78,-.12,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.ellipse(.72,1.1,.31,.78,.12,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=jacket;
  ctx.beginPath();ctx.ellipse(0,-.45,.85,1.03,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#d4b58a';
  for(const s of [-1,1]){ctx.beginPath();ctx.ellipse(s*1.12,-1.23,.25,.28,0,0,Math.PI*2);ctx.fill();}
  ctx.fillStyle='#202832';ctx.beginPath();ctx.ellipse(0,-1.35,.65,.73,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#bbc8c8';ctx.fillRect(-.45,-1.83,.9,.26);
 }
 if(focused){
  ctx.strokeStyle='#f4d37c';ctx.lineWidth=.14;
  ctx.strokeRect(-bodyWidth/2-.2,-bodyLength/2-.1,bodyWidth+.4,bodyLength+.2);
 }
 ctx.restore();
 return true;
}
