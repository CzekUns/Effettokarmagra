/* GTA Melito — compact top-down PNG vehicle skins. Panda PNGs unchanged.
 * Punto 188 and Ypsilon 2003: 16 recolored cars, clean transparent 4x4 PNG atlas, 40x60/cell.
 * Body colors are illustrative, not all factory paint codes verified.
 */
export const CAR_SPRITES=Object.freeze({
 'panda-modern-white':'./assets/vehicles/panda-modern-white.png',
 'panda-fire-red':'./assets/vehicles/panda-fire-red.png',
 'ape-car-azzurra':'./assets/vehicles/ape-car-top.png',
 'furgone-fritti':'./assets/vehicles/furgone-fritti-top.png',
});
export const CAR_ATLAS_PATH='./assets/vehicles/punto-ypsilon-16colors-rgba.png';
export const CAR_ATLAS_CELL=Object.freeze({width:40,height:60,columns:4,rows:4});
const PUNTO=['white','red','blue','silver','graphite','black','mint','champagne'];
const YPSILON=['white','black','silver','graphite','navy','lightblue','burgundy','champagne'];
export const CAR_ATLAS_VARIANTS=Object.freeze(Object.fromEntries([
 ...PUNTO.map((color,i)=>['punto-188-'+color,{index:i,model:'punto-188',color}]),
 ...YPSILON.map((color,i)=>['ypsilon-2003-'+color,{index:i+8,model:'ypsilon-2003',color}])
]));
export const CAR_ATLAS_VARIANT_IDS=Object.freeze(Object.keys(CAR_ATLAS_VARIANTS));

/* Additional 4x4 compact atlases, 8 illustrative colors per car generation. */
export const EXTRA_CAR_ATLASES=Object.freeze({
 '@seicento-500-atlas':'./assets/vehicles/seicento-500-16colors-rgba.png',
 '@uno-smart-atlas':'./assets/vehicles/uno-smart-16colors-rgba.png',
});
const EXTRA_MODELS=Object.freeze([
 {model:'seicento-1998',atlas:'@seicento-500-atlas',offset:0,colors:['white','red','blue','silver','black','yellow','green','champagne']},
 {model:'fiat-500-2007',atlas:'@seicento-500-atlas',offset:8,colors:['white','black','red','lightblue','blue','silver','cream','graphite']},
 {model:'fiat-uno-1983',atlas:'@uno-smart-atlas',offset:0,colors:['white','red','blue','silver','graphite','black','green','champagne']},
 {model:'smart-fortwo-2007',atlas:'@uno-smart-atlas',offset:8,colors:['white','black','red','lightblue','blue','silver','yellow','green']},
]);
export const EXTRA_CAR_VARIANTS=Object.freeze(Object.fromEntries(
 EXTRA_MODELS.flatMap(({model,atlas,offset,colors})=>
  colors.map((color,i)=>[model+'-'+color,{index:offset+i,model,color,atlas}]))
));
export const STREET_VENDOR_VEHICLES=Object.freeze(['ape-car-azzurra','furgone-fritti']);
export const CAR_TRAFFIC_SPRITE_IDS=Object.freeze([...CAR_ATLAS_VARIANT_IDS,...Object.keys(EXTRA_CAR_VARIANTS),...STREET_VENDOR_VEHICLES]);
const MODEL_DRAW_SIZE=Object.freeze({
 'punto-188':[5.45,8.75],'ypsilon-2003':[5.25,8.55],
 'seicento-1998':[4.9,7.6],'fiat-500-2007':[5.15,8],
 'fiat-uno-1983':[5.1,8.15],'smart-fortwo-2007':[4.7,6.45],
 'ape-car-azzurra':[4.1,6.25],'furgone-fritti':[5.65,8.65],
});

const cache=new Map();
let attempted=false;
export function loadCarSprites(){
 if(attempted||typeof Image==='undefined')return;
 attempted=true;
 for(const [model,path] of Object.entries({...CAR_SPRITES,'@punto-ypsilon-atlas':CAR_ATLAS_PATH,...EXTRA_CAR_ATLASES})){
  const img=new Image();
  // New atlas is natively transparent: never matte-key or mask at runtime.
  cache.set(model,img);
  img.onerror=()=>console.warn('Optional GTA Melito vehicle PNG unavailable:',model);
  img.src=new URL(path,import.meta.url).href;
 }
}
function loadedImage(model){
 const key=CAR_ATLAS_VARIANTS[model]?'@punto-ypsilon-atlas':(EXTRA_CAR_VARIANTS[model]?.atlas||model);
 return cache.get(key);
}
export function carSpriteReady(model){
 const img=loadedImage(model);
 if(CAR_ATLAS_VARIANTS[model]||EXTRA_CAR_VARIANTS[model])return !!(img?.complete&&img.naturalWidth===160&&img.naturalHeight===240);
 return !!(img?.complete&&img.naturalWidth>0&&img.naturalHeight>0);
}
export function drawCarSprite(ctx,x,y,angle,model,focused=false){
 if(!model)return false;
 if(!attempted)loadCarSprites();
 const img=loadedImage(model);
 if(!carSpriteReady(model))return false;
 const variant=CAR_ATLAS_VARIANTS[model]||EXTRA_CAR_VARIANTS[model];
 const [width,length]=MODEL_DRAW_SIZE[variant?.model||model]||(model==='panda-modern-white'?[5.5,8.75]:[5.1,8.55]);
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
