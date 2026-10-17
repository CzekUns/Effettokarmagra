/* GTA Melito 0.9.10 — user-drawn Panda top-down PNG sprites.
 * Front of each PNG points UP (-Y). The driving simulation uses +X as
 * heading angle 0, hence the +PI/2 canvas rotation.
 *
 * Each transparent 88×132 PNG is downsampled from the user's cropped artwork
 * without changing vehicle collision bounds or the game's road physics.
 */
export const CAR_SPRITES=Object.freeze({
 'panda-modern-white':'./assets/vehicles/panda-modern-white.png',
 'panda-fire-red':'./assets/vehicles/panda-fire-red.png',
});
const cache=new Map();
let attempted=false;
export function loadCarSprites(){
 if(attempted||typeof Image==='undefined')return;
 attempted=true;
 for(const [model,path] of Object.entries(CAR_SPRITES)){
  const img=new Image();
  cache.set(model,img);
  img.onerror=()=>console.warn('Optional GTA Melito vehicle PNG not available:',model);
  img.src=new URL(path,import.meta.url).href;
 }
}
export function carSpriteReady(model){
 const img=cache.get(model);
 return !!(img?.complete&&img.naturalWidth>0&&img.naturalHeight>0);
}
export function drawCarSprite(ctx,x,y,angle,model,focused=false){
 if(!model)return false;
 if(!attempted)loadCarSprites();
 const img=cache.get(model);
 if(!img?.complete||!img.naturalWidth||!img.naturalHeight)return false;
 const modern=model==='panda-modern-white';
 // The source concept looked too long: slightly shorter in game,
 // while preserving readable body shape and avoiding an oversized sprite.
 const width=modern?5.5:5.1,length=modern?8.75:8.55;
 ctx.save();
 ctx.translate(x,y);
 ctx.rotate(angle+Math.PI/2);
 ctx.imageSmoothingEnabled=false;
 ctx.drawImage(img,-width/2,-length/2,width,length);
 if(focused){
  ctx.strokeStyle='#f5d887';
  ctx.lineWidth=.18;
  ctx.strokeRect(-width/2-.12,-length/2-.12,width+.24,length+.24);
 }
 ctx.restore();
 return true;
}
