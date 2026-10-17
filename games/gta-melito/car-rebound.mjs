/* A short recoil after a blocked movement. Candidate positions are tested
 * against the same six-point collision used for ordinary driving. */
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));

export function reboundCar(car,impactSpeed,previousAngle,isBlocked){
 const direction=Math.sign(impactSpeed);
 if(!direction||Math.abs(impactSpeed)<1.2)return {x:car.x,y:car.y,angle:previousAngle,speed:0,recoil:0};
 const forwardX=Math.cos(previousAngle)*direction,forwardY=Math.sin(previousAngle)*direction;
 const sideX=-forwardY,sideY=forwardX;
 for(const distance of [.45,.9,1.4])for(const side of [0,-.55,.55]){
  const x=car.x-forwardX*distance+sideX*side;
  const y=car.y-forwardY*distance+sideY*side;
  if(!isBlocked(x,y,previousAngle))return {
   x,y,angle:previousAngle,
   speed:-direction*clamp(Math.abs(impactSpeed)*.18,1.4,5),recoil:.26
  };
 }
 return {x:car.x,y:car.y,angle:previousAngle,speed:0,recoil:0};
}

export function advanceRecoil(speed,recoil,dt){
 const elapsed=clamp(Number(dt)||0,0,.05);
 const remaining=Math.max(0,recoil-elapsed);
 const next=Math.sign(speed)*Math.max(0,Math.abs(speed)-15*elapsed);
 return {speed:next,recoil:next?remaining:0};
}
