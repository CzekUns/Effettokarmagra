/* GTA Melito — single vehicle interaction decision for mouse, touch and E.
 * Bike/body art, collision, and movement live in their existing modules.
 * Prefer a nearby scooter to a slightly closer parked car, but never select
 * a remote scooter when the player is already standing right by a car.
 */
export const MOTORCYCLE_ENTRY_RADIUS=8.5;
export const CAR_ENTRY_RADIUS=9.5;
export function nearestEnterableVehicle(vehicles,player){
 if(!vehicles?.length||!Number.isFinite(player?.x)||!Number.isFinite(player?.y))return null;
 let chosen=null;
 for(let i=0;i<vehicles.length;i++){
  const v=vehicles[i];
  if(!v||!Number.isFinite(v.x)||!Number.isFinite(v.y))continue;
  const bike=v.vehicleType==='motorcycle',d=Math.hypot(v.x-player.x,v.y-player.y);
  if(d>(bike?MOTORCYCLE_ENTRY_RADIUS:CAR_ENTRY_RADIUS))continue;
  const score=d-(bike?1.75:0);
  if(!chosen||score<chosen.score-1e-6||(Math.abs(score-chosen.score)<1e-6&&d<chosen.distance))
   chosen={index:i,vehicle:v,bike,distance:d,score};
 }
 return chosen;
}
export function starterMotorcycleCandidates(start,starterCar,roadWidth){
 const a=start.a,dx=Math.cos(a),dy=Math.sin(a);
 const carSide=-(starterCar.x-start.x)*dy+(starterCar.y-start.y)*dx;
 const opposite=carSide>=0?-1:1;
 const shoulder=Math.max(2.35,Number(roadWidth)/2+.2);
 const positions=[];
 // Near enough to touch the entry button right after spawning, parked
 // on the opposite side of the Panda whenever geometry allows it.
 for(const side of [opposite,-opposite])for(const offset of [shoulder,Math.max(2.2,shoulder-.8),Math.max(1.8,shoulder-1.6)])
  for(const ahead of [2.5,3.5,1.1,4.5]){
   const x=start.x+dx*ahead-dy*offset*side;
   const y=start.y+dy*ahead+dx*offset*side;
   if(Math.hypot(x-start.x,y-start.y)<=MOTORCYCLE_ENTRY_RADIUS-.4)
    positions.push({x,y,a,side});
  }
 return positions;
}
