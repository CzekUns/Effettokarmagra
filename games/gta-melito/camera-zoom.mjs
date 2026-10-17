/* Camera automatico in GTA Melito.
 * Zoom is a Canvas scale: higher = closer, lower = more visible surroundings.
 * On foot start at the maximum. In vehicles the visible field expands with
 * speed to improve orientation and avoid driving into offscreen junctions. */
export const CAMERA_ZOOM_MAX=6;
export const CAMERA_ZOOM_MIN=1.65;
export const CAMERA_DEFAULT_FOOT=6;
export const CAMERA_DEFAULT_CAR=3.35;
export function targetCameraZoom({inVehicle=false,speed=0,running=false,moving=false}={},bias=1){
 const v=Math.max(0,Number(speed)||0);
 let desired;
 if(inVehicle){
  const t=Math.min(1,v/40);
  desired=CAMERA_DEFAULT_CAR-(1.48*t);
 }else desired=CAMERA_DEFAULT_FOOT-(running&&moving?0.45:0);
 const b=Math.max(.62,Math.min(1.35,Number(bias)||1));
 return Math.max(CAMERA_ZOOM_MIN,Math.min(CAMERA_ZOOM_MAX,desired*b));
}
export function advanceCameraZoom(current,target,dt){
 const safeDt=Math.max(0,Math.min(.1,Number(dt)||0));
 return current+(target-current)*(1-Math.exp(-4.2*safeDt));
}
export function describeCameraZoom({inVehicle=false,speed=0,running=false,moving=false}={}){
 return inVehicle?(Math.abs(speed)>3?'AUTO · IN CORSA':'AUTO · FERMA'):running&&moving?'A PIEDI · CORSA':'A PIEDI';
}
