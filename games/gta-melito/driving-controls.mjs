/* Arcade movement: the single stick steers and supplies gentle forward
 * throttle when held sideways. Pulling it down deliberately reverses. */
export const WALK_SPEED=8.5;
export const RUN_SPEED=13;
export const CAR_FORWARD_SPEED=40;
export const CAR_REVERSE_SPEED=12;

const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));

export function stepDriving(speed,angle,axis,braking,dt){
 const x=clamp(Number(axis.x)||0,-1,1),y=clamp(Number(axis.y)||0,-1,1);
 const elapsed=clamp(Number(dt)||0,0,.05);
 let throttle=y<-.08?-y:y>.18?-y:Math.abs(x)>.14?.62*Math.abs(x):0;
 if(Math.abs(throttle)>.08)speed+=46*elapsed*throttle;
 else speed-=Math.sign(speed)*Math.min(Math.abs(speed),12*elapsed);
 if(braking)speed*=Math.pow(.025,elapsed);
 speed=clamp(speed,-CAR_REVERSE_SPEED,CAR_FORWARD_SPEED);
 // Slow a little through tight corners without suddenly snapping speed down.
 const cornerLimit=CAR_FORWARD_SPEED-9*x*x;
 if(speed>cornerLimit)speed=Math.max(cornerLimit,speed-25*elapsed);
 if(Math.abs(x)>.08&&Math.abs(speed)>.25){
  const turnRate=clamp(2.4-Math.abs(speed)*.028,1.15,2.4)*clamp(Math.abs(speed)/7,.4,1);
  angle+=x*turnRate*elapsed*(speed<0?-1:1);
 }
 return {speed,angle};
}
