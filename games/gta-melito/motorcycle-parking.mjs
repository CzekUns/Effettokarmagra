/* Parking two-wheelers is a separate deterministic pass from cars.
 * All candidates inherit actual OSM road heading and avoid arbitrary placements.
 * Game validates every candidate against streets, walls and existing vehicles.
 */
export const PARKED_BIKE_TARGET=34;
export const PARKED_VEHICLE_CAP=134;
export const PARKED_CAR_PHASE_CAP=99;

export function motorcycleParkingRoadOrder(roads,spawn,sample,length,rand){
 const eligible=roads.filter(road=>road?.p?.length>=4&&length(road.p)>28).map(road=>{
  const mid=sample(road,.5);
  return {road,distance:Math.hypot(mid.x-spawn.x,mid.y-spawn.y),priority:rand(road.id+7781)};
 });
 const nearby=eligible.filter(v=>v.distance<270)
  .sort((a,b)=>a.distance-b.distance||a.priority-b.priority);
 const nearSet=new Set(nearby);
 const distant=eligible.filter(v=>!nearSet.has(v))
  .sort((a,b)=>a.priority-b.priority||a.distance-b.distance);
 return [...nearby.slice(0,15),...distant,...nearby.slice(15)].map(v=>v.road);
}

export function motorcycleParkingCandidates(road,sample,streetWidth,rand){
 const random=rand(road.id+703),first=rand(road.id+79)<.5?1:-1;
 const t1=.24+random*.19,t2=.57+random*.17;
 const base=Math.max(3.65,streetWidth/2+1.4);
 const output=[];
 for(const t of [t1,t2]){
  const p=sample(road,t);
  for(const side of [first,-first]){
   // A bike can fit in a narrower curb niche than a car, but it must
   // still stay close enough to the street to be driveable.
   for(const off of [base,base-.65]){
    output.push({x:p.x-Math.sin(p.a)*off*side,
      y:p.y+Math.cos(p.a)*off*side,a:p.a,t,side});
   }
  }
 }
 return output;
}

export function parkedBikeLabel(vehicle){
 if(vehicle?.vehicleType!=='motorcycle')return null;
 return /scooter/i.test(vehicle.model||'')?'SCOOTER':'MOTO';
}
