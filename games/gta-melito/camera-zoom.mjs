/* Camera automatico in GTA Melito.
 * Zoom is a Canvas scale: higher = closer, lower = more visible surroundings.
 * On foot start at the maximum. In vehicles the visible field expands with
 * speed to improve orientation and avoid driving into offscreen junctions. */
export const CAMERA_ZOOM_MAX=6.6;
export const CAMERA_ZOOM_MIN=1.815;
export const CAMERA_DEFAULT_FOOT=6.6;
export const CAMERA_DEFAULT_CAR=4.69;
export function targetCameraZoom({inVehicle=false,speed=0,running=false,moving=false}={},bias=1){
 const v=Math.max(0,Number(speed)||0);
 let desired;
 if(inVehicle){
  const t=Math.min(1,v/40);
  desired=CAMERA_DEFAULT_CAR-(2.072*t);
 }else desired=CAMERA_DEFAULT_FOOT-(running&&moving?0.495:0);
 const b=Math.max(.62,Math.min(1.35,Number(bias)||1));
 return Math.max(CAMERA_ZOOM_MIN,Math.min(CAMERA_ZOOM_MAX,desired*b));
}
// Keep the vehicle near the trailing edge while moving, so most of the
// viewport shows the road ahead. At rest it returns smoothly to the center.
export function vehicleCameraTarget({x=0,y=0,a=0,speed=0}={},width=0,height=0,zoom=1){
 const dx=Math.cos(a),dy=Math.sin(a),span=(Math.abs(dx)*Math.max(0,width)+Math.abs(dy)*Math.max(0,height))/Math.max(.01,zoom);
 const moving=Math.max(0,Math.min(1,Math.abs(Number(speed)||0)/12));
 // At full speed the vehicle sits 30% from the trailing edge, leaving
 // roughly 70% of the directional view ahead without pushing it to the edge.
 const trailingFraction=.5-.2*moving;
 const lead=span*(.5-trailingFraction);
 return {x:x+dx*lead,y:y+dy*lead};
}
export function advanceCameraZoom(current,target,dt){
 const safeDt=Math.max(0,Math.min(.1,Number(dt)||0));
 return current+(target-current)*(1-Math.exp(-2.8*safeDt));
}
export function describeCameraZoom({inVehicle=false,speed=0,running=false,moving=false}={}){
 return inVehicle?(Math.abs(speed)>3?'AUTO · IN CORSA':'AUTO · FERMA'):running&&moving?'A PIEDI · CORSA':'A PIEDI';
}
