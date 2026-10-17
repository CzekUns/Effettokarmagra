/* GTA Melito — top-down PNG vehicle skins. Panda PNGs unchanged.
 * Punto 188 and Ypsilon 2003: 16 cropped cars, 4x4 PNG atlas, 40x60/cell.
 * Body colors are illustrative, not all factory paint codes verified.
 */
import {restoreVehicleAtlasTransparency} from './vehicle-alpha.mjs?v=104';
export const CAR_SPRITES=Object.freeze({
 'panda-modern-white':'./assets/vehicles/panda-modern-white.png',
 'panda-fire-red':'./assets/vehicles/panda-fire-red.png',
});
export const CAR_ATLAS_PATH='./assets/vehicles/punto-ypsilon-16colors-atlas.png';
export const CAR_ATLAS_CELL=Object.freeze({width:40,height:60,columns:4,rows:4});
const PUNTO=['white','red','blue','silver','graphite','black','mint','champagne'];
const YPSILON=['white','black','silver','graphite','navy','lightblue','burgundy','champagne'];
export const CAR_ATLAS_VARIANTS=Object.freeze(Object.fromEntries([
 ...PUNTO.map((color,i)=>['punto-188-'+color,{index:i,model:'punto-188',color}]),
 ...YPSILON.map((color,i)=>['ypsilon-2003-'+color,{index:i+8,model:'ypsilon-2003',color}])
]));
export const CAR_ATLAS_VARIANT_IDS=Object.freeze(Object.keys(CAR_ATLAS_VARIANTS));
const cache=new Map();
let attempted=false;
export function loadCarSprites(){
 if(attempted||typeof Image==='undefined')return;
 attempted=true;
 for(const [model,path] of Object.entries({...CAR_SPRITES,'@punto-ypsilon-atlas':CAR_ATLAS_PATH})){
  const img=new Image();
  const isAtlas=model==='@punto-ypsilon-atlas';
  // Never allow the old opaque atlas into drawImage: it contained an entire
  // dark rectangle around EVERY Punto/Ypsilon. Only the alpha-repaired
  // offscreen canvas is promoted into the sprite cache.
  if(!isAtlas)cache.set(model,img);
  img.onerror=()=>console.warn('Optional GTA Melito vehicle PNG unavailable:',model);
  if(isAtlas)img.onload=()=>{
   try{
    const restored=restoreVehicleAtlasTransparency(img,(w,h)=>{
     if(typeof document==='undefined')return null;
     const cvs=document.createElement('canvas');cvs.width=w;cvs.height=h;return cvs;
    });
    if(restored)cache.set(model,restored);
    else console.warn('Vehicle atlas alpha could not be restored; using procedural car fallback');
   }catch(error){console.warn('Vehicle atlas alpha repair failed; using procedural car fallback:',error);}
  };
  img.src=new URL(path,import.meta.url).href;
 }
}
function loadedImage(model){
 const key=CAR_ATLAS_VARIANTS[model]?'@punto-ypsilon-atlas':model;
 return cache.get(key);
}
export function carSpriteReady(model){
 const img=loadedImage(model);
 if(CAR_ATLAS_VARIANTS[model])return !!(img?.width===160&&img?.height===240);
 return !!(img?.complete&&img.naturalWidth>0&&img.naturalHeight>0);
}
export function drawCarSprite(ctx,x,y,angle,model,focused=false){
 if(!model)return false;
 if(!attempted)loadCarSprites();
 const img=loadedImage(model);
 if(!carSpriteReady(model))return false;
 const variant=CAR_ATLAS_VARIANTS[model];
 const modern=model==='panda-modern-white';
 const width=variant?(variant.model==='punto-188'?5.45:5.25):(modern?5.5:5.1);
 const length=variant?(variant.model==='punto-188'?8.75:8.55):(modern?8.75:8.55);
 ctx.save();ctx.translate(x,y);ctx.rotate(angle+Math.PI/2);ctx.imageSmoothingEnabled=false;
 if(variant){
  const {width:sw,height:sh,columns}=CAR_ATLAS_CELL;
  const sx=(variant.index%columns)*sw,sy=Math.floor(variant.index/columns)*sh;
  ctx.drawImage(img,sx,sy,sw,sh,-width/2,-length/2,width,length);
 }else ctx.drawImage(img,-width/2,-length/2,width,length);
 if(focused){
  ctx.strokeStyle='#f5d887';ctx.lineWidth=.18;
  ctx.strokeRect(-width/2-.12,-length/2-.12,width+.24,length+.24);
 }
 ctx.restore();
 return true;
}
