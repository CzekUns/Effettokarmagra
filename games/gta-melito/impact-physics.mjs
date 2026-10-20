/* GTA Melito — non-lethal arcade collisions, in real world units.
 * An impact throws the actor, decays with friction, and then hands NPCs back
 * to their original road routine. Never destroys/removes an NPC or the player.
 */
import {vehicleHitsPedestrian,vehiclesOverlap} from './traffic-collision.mjs?v=129';
export const IMPACT_MIN_SPEED=3.4;
export const IMPACT_LOCK_SECONDS=.8;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const isCar=o=>(o?.body==='car'||o?.vehicleType==='car'||o?.vehicleType==='motorcycle'||o?.model!==undefined||o?.type!==undefined);
const heading=(actor)=>{
 const a=Number(actor?.a)||0,s=Number(actor?.speed)||0;
 return {x:Math.cos(a)*(s<0?-1:1),y:Math.sin(a)*(s<0?-1:1)};
};
export function impactSpeed(source,target){
 const a=heading(source),b=heading(target);
 const speed=Math.abs(Number(source?.speed)||0);
 const other=isCar(target)?Math.abs(Number(target?.speed)||0):0;
 // A vehicle striking one moving toward it has more closing energy.
 const delta=source?.speed<0?-1:1;
 return Math.max(0,speed+other*Math.max(-.45,-(a.x*b.x+a.y*b.y)*.65));
}
export function impactContact(vehicle,actor){
 if(!vehicle||!actor||vehicle===actor)return false;
 const body=isCar(actor)?'car':'walk';
 return body==='car'?vehiclesOverlap(vehicle,actor,.25):vehicleHitsPedestrian(vehicle,actor,1);
}
export function sweptVehicleContact(source,target,from,to){
 if(!source||!target||source===target||!from||!to)return false;
 const distance=Math.hypot(to.x-from.x,to.y-from.y);
 if(Math.hypot(target.x-to.x,target.y-to.y)>distance+11)return false;
 const count=Math.min(16,Math.max(1,Math.ceil(distance/1.25)));
 for(let i=0;i<=count;i++){
  const k=i/count;
  const probe={x:from.x+(to.x-from.x)*k,y:from.y+(to.y-from.y)*k,
   a:from.a+(to.a-from.a)*k,vehicleType:source.vehicleType};
  if(impactContact(probe,target))return true;
 }
 return false;
}
export function applyNonlethalImpact(source,target,relativeSpeed=null){
 if(!source||!target||source===target||target.impactLock>0)return null;
 const speed=relativeSpeed??impactSpeed(source,target);
 if(!Number.isFinite(speed)||speed<IMPACT_MIN_SPEED)return null;
 const h=heading(source),sepX=target.x-source.x,sepY=target.y-source.y;
 const mag=Math.hypot(sepX,sepY);
 const side=mag>1e-6?{x:sepX/mag,y:sepY/mag}:h;
 // Mostly in the vehicle's travel direction, with sideways deflection
 // for a glancing impact. Impact energy grows nonlinearly but is capped.
 const vx=h.x*.78+side.x*.22,vy=h.y*.78+side.y*.22,len=Math.hypot(vx,vy)||1;
 const velocity=clamp(4.8+Math.pow(speed,1.08)*.8,7,53)*(isCar(target)?.56:1);
 target.impactVX=vx/len*velocity;target.impactVY=vy/len*velocity;
 target.impactTime=clamp(.5+speed*.012,.55,1.15);
 target.impactLock=IMPACT_LOCK_SECONDS;
 target.impactReturning=!!target.home;
 target.braking=false;target.stalled=0;
 // BF01: the struck car stops, but remembers its cruising speed to drive off again afterwards.
 if(isCar(target)){if(target.speed>0)target.resumeSpeed=target.speed;target.speed=0;}
 return {strength:velocity,speed,dx:target.impactVX,dy:target.impactVY};
}
export function advanceNonlethalImpact(actor,dt,canMove=()=>true){
 if(!actor||dt<=0)return false;
 const elapsed=clamp(dt,0,.05);
 actor.impactLock=Math.max(0,(actor.impactLock||0)-elapsed);
 if(!(actor.impactTime>0))return false;
 const nx=actor.x+(actor.impactVX||0)*elapsed,ny=actor.y+(actor.impactVY||0)*elapsed;
 let moved=false;
 if(canMove(nx,actor.y,actor)){
  actor.x=nx;moved=true;
 }else actor.impactVX=0;
 if(canMove(actor.x,ny,actor)){
  actor.y=ny;moved=true;
 }else actor.impactVY=0;
 const damp=Math.exp(-2.55*elapsed);
 actor.impactVX=(actor.impactVX||0)*damp;
 actor.impactVY=(actor.impactVY||0)*damp;
 actor.impactTime=Math.max(0,actor.impactTime-elapsed);
 if(actor.impactTime===0||Math.hypot(actor.impactVX,actor.impactVY)<1.1){
  actor.impactTime=0;actor.impactVX=0;actor.impactVY=0;
  if(actor.home)actor.needsRoutineRecovery=true;
 }
 return moved;
}
export function tickImpactCooldown(actor,dt){
 if(actor&&actor.impactLock>0)actor.impactLock=Math.max(0,actor.impactLock-dt);
}
// After a shunt the struck car is slower, but can drive away; no explosions.
export function slowImpactSource(source,relativeSpeed){
 if(!source||!Number.isFinite(source.speed))return;
 const factor=relativeSpeed>18?.48:.7;
 source.speed*=factor;
}
