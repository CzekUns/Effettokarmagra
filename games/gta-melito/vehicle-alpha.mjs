/* GTA Melito — faithful alpha masks for 16 Punto/Ypsilon top-down PNGs.
 * The originally exported indexed atlas was accidentally flattened over a
 * dark rectangle. These silhouette masks were derived from the 16 correctly
 * transparent original RGBA crops, before shrinking to 40x60 per vehicle.
 * Each two bytes represent a row-wise silhouette envelope shared by the eight color variants of each model.
 * Transparent backgrounds must never be supplied to drawImage as opaque RGB. */
export const VEHICLE_ATLAS_CELL_WIDTH=40;
export const VEHICLE_ATLAS_CELL_HEIGHT=60;
export const VEHICLE_ATLAS_COLUMNS=4;
export const VEHICLE_ATLAS_ROWS=4;
export const VEHICLE_ALPHA_BOUNDS='KAAoABEXDBsKHAkdCR4IHggfCB8HHwcfByAHIAcgByAHIAcgBSEEIgQiBCIHIAcgByAHIAYgBiAGIAYgBiAHIAcgByAHIAcgByAHIAYgBiAGIAYgBiAHIAcgByAHIAcgByAHIAcfBx8IHwgfCB4JHQscDxgoACgAKAAoABAXDBsKHQkeCR4IHwgfByAHIAcgByAGIAcgByAHIAcgByAHIAYhBSIEIwQjBCMGIQYhBiEGIQYhBiEGIQYhBiEGIQYhBiEGIQYhBiEGIQYhBiEGIQYhBiEGIQYhBiEGIQcgByAHIAgfCB8JHgocDhkoACgA';
export function decodeVehicleAlphaBounds(){
 const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
 const bytes=[];let bits=0,buffer=0;
 for(const c of VEHICLE_ALPHA_BOUNDS){
  const n=alphabet.indexOf(c);if(n<0)continue;
  buffer=(buffer<<6)|n;bits+=6;
  if(bits>=8){bits-=8;bytes.push((buffer>>>bits)&255);}
 }
 if(bytes.length!==2*VEHICLE_ATLAS_CELL_HEIGHT*2)throw new Error('Vehicle alpha mask is incomplete');
 return Uint8Array.from(bytes);
}
export function maskVehicleAtlasPixels(bytes,width,height){
 if(width!==160||height!==240||bytes.length!==width*height*4)throw new RangeError('Unsupported Punto/Ypsilon vehicle atlas');
 const bounds=decodeVehicleAlphaBounds();
 for(let vehicle=0;vehicle<16;vehicle++){
  const tx=(vehicle%4)*40,ty=Math.floor(vehicle/4)*60;
  for(let y=0;y<60;y++){
   const row=(vehicle<8?0:60)+y;
   const left=bounds[row*2],right=bounds[row*2+1];
   for(let x=0;x<40;x++){
    if(x>=left&&x<=right)continue;
    const pixel=4*((ty+y)*width+tx+x);
    bytes[pixel]=0;bytes[pixel+1]=0;bytes[pixel+2]=0;bytes[pixel+3]=0;
   }
  }
 }
 return bytes;
}
export function restoreVehicleAtlasTransparency(img,makeCanvas){
 const w=img.naturalWidth,h=img.naturalHeight;
 if(w!==160||h!==240)return null;
 const canvas=makeCanvas(w,h),ctx=canvas?.getContext?.('2d',{willReadFrequently:true});
 if(!ctx)return null;
 ctx.drawImage(img,0,0);
 const imageData=ctx.getImageData(0,0,w,h);
 maskVehicleAtlasPixels(imageData.data,w,h);
 ctx.putImageData(imageData,0,0);
 return canvas;
}
