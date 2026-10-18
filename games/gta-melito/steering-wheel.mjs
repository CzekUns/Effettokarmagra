/* GTA Melito — actual steering wheel. Pointer rotates the rim; it cannot
 * accelerate the vehicle. Angle is in radians, positive clockwise on screen. */
export const WHEEL_MAX_ANGLE=Math.PI*0.84; // ±151.2 degrees of lock
const clamp=(n,lo,hi)=>Math.max(lo,Math.min(hi,n));
export function pointerWheelAngle(x,y,cx,cy){
 return Math.atan2(y-cy,x-cx);
}
export function turnSteeringWheel(current,previousPointer,currentPointer){
 const wrapped=Math.atan2(Math.sin(currentPointer-previousPointer),Math.cos(currentPointer-previousPointer));
 return clamp(current+wrapped,-WHEEL_MAX_ANGLE,WHEEL_MAX_ANGLE);
}
export function steeringInput(angle){
 return clamp((Number(angle)||0)/WHEEL_MAX_ANGLE,-1,1);
}
export function returnSteeringWheel(angle,dt){
 const elapsed=clamp(Number(dt)||0,0,.08);
 const next=(Number(angle)||0)*Math.exp(-5.3*elapsed);
 return Math.abs(next)<.004?0:next;
}
