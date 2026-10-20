import {vs,ps} from './world-scale.mjs?v=001';
// Small world-space bins avoid scanning every NPC for each steering decision.
export function makeCollisionIndex(items,cell=16){
 const bins=new Map(),index={bins,cell};
 for(const item of new Set(items))addToCollisionIndex(index,item);
 return index;
}
const cellKey=(x,y,cell)=>Math.floor(x/cell)+','+Math.floor(y/cell);
export function addToCollisionIndex(index,item){
 // Q03: a resident inside a building is out of the street until it walks out of its door.
 if(!item||item.indoors||!Number.isFinite(item.x)||!Number.isFinite(item.y))return;
 const key=cellKey(item.x,item.y,index.cell);
 if(!index.bins.has(key))index.bins.set(key,new Set());index.bins.get(key).add(item);
}
export function moveInCollisionIndex(index,item,oldX,oldY){
 const before=cellKey(oldX,oldY,index.cell),after=cellKey(item.x,item.y,index.cell);
 if(item.indoors){index.bins.get(before)?.delete(item);return;}
 if(before===after)return;
 index.bins.get(before)?.delete(item);
 if(!index.bins.has(after))index.bins.set(after,new Set());
 index.bins.get(after).add(item);
}
export function nearbyColliders(index,x,y,radius=8){
 const found=new Set(),cell=index.cell;
 for(let gx=Math.floor((x-radius)/cell);gx<=Math.floor((x+radius)/cell);gx++)
  for(let gy=Math.floor((y-radius)/cell);gy<=Math.floor((y+radius)/cell);gy++)
   for(const item of index.bins.get(gx+','+gy)||[])found.add(item);
 return found;
}
/* BF01: collision boxes scaled from each sprite's opaque body with the same ratio as the
 * reference car (box ≈ 0,66 × width and 0,78 × length of the drawn body). Car width stays
 * 3,4: two-way service streets keep their lanes only 4,6 apart. Food-truck awnings are not
 * part of the solid body. */
// BF14: every box is VEHICLE_SCALE of the measured one, like the drawn sprites (world-scale.mjs).
const box=(halfLength,halfWidth)=>Object.freeze({halfLength:vs(halfLength),halfWidth:vs(halfWidth)});
const MODEL_SHAPES=Object.freeze([
 ['ape-car',box(2.3,.95)],
 ['ape-',box(2.5,1.3)],
 ['food-',box(3.35,1.45)]
]);
const CAR_SHAPE=box(3.15,1.7),BIKE_SHAPE=box(2.8,1.05);
// BF14: room kept around a walker (its body shrinks with PERSON_SCALE).
export const PEDESTRIAN_PAD=ps(.8);
export function vehicleShape(v){
 if(v?.vehicleType==='motorcycle')return BIKE_SHAPE;
 const model=v?.model;
 if(typeof model==='string')for(const [prefix,shape] of MODEL_SHAPES)if(model.startsWith(prefix))return shape;
 return CAR_SHAPE;
}
/* BF01: smallest push that takes body a out of body b (separating-axis test on the two
 * boxes). Null when they do not overlap. */
export function vehicleSeparation(a,b){
 const da=vehicleShape(a),db=vehicleShape(b);
 const ca=Math.cos(a.a),sa=Math.sin(a.a),cb=Math.cos(b.a),sb=Math.sin(b.a);
 const dx=a.x-b.x,dy=a.y-b.y;
 let best=null;
 for(const [ux,uy] of [[ca,sa],[-sa,ca],[cb,sb],[-sb,cb]]){
  const ra=da.halfLength*Math.abs(ux*ca+uy*sa)+da.halfWidth*Math.abs(-ux*sa+uy*ca);
  const rb=db.halfLength*Math.abs(ux*cb+uy*sb)+db.halfWidth*Math.abs(-ux*sb+uy*cb);
  const along=dx*ux+dy*uy,depth=ra+rb-Math.abs(along);
  if(depth<=0)return null;
  if(!best||depth<best.depth){const s=along>=0?1:-1;best={nx:ux*s,ny:uy*s,depth};}
 }
 return best;
}
export function vehiclesOverlap(a,b,pad=.05){
 const da=vehicleShape(a),db=vehicleShape(b);
 const span=Math.hypot(da.halfLength+pad,da.halfWidth+pad)+Math.hypot(db.halfLength+pad,db.halfWidth+pad);
 if(Math.abs(a.x-b.x)>span||Math.abs(a.y-b.y)>span)return false;
 const ca=Math.cos(a.a),sa=Math.sin(a.a),cb=Math.cos(b.a),sb=Math.sin(b.a);
 const axes=[[ca,sa],[-sa,ca],[cb,sb],[-sb,cb]];
 const dx=b.x-a.x,dy=b.y-a.y;
 for(const [ux,uy] of axes){
  const ra=(da.halfLength+pad)*Math.abs(ux*ca+uy*sa)+(da.halfWidth+pad)*Math.abs(-ux*sa+uy*ca);
  const rb=(db.halfLength+pad)*Math.abs(ux*cb+uy*sb)+(db.halfWidth+pad)*Math.abs(-ux*sb+uy*cb);
  if(Math.abs(dx*ux+dy*uy)>=ra+rb)return false;
 }
 return true;
}
export function vehicleHitsPedestrian(car,ped,pad=PEDESTRIAN_PAD){
 const d=vehicleShape(car);
 const dx=ped.x-car.x,dy=ped.y-car.y,ca=Math.cos(car.a),sa=Math.sin(car.a);
 const forward=dx*ca+dy*sa,side=-dx*sa+dy*ca;
 return forward>=-d.halfLength-pad&&forward<=d.halfLength+pad&&Math.abs(side)<d.halfWidth+pad;
}
/* BF02: a vehicle still in its parking bay stands beside the pavement; pedestrians walk past it at
 * BAY_PEDESTRIAN_PAD from its side (parking-bays.mjs keeps 0,45 m). Moved by a knock or a driver,
 * it is an ordinary obstacle again. */
export const BAY_PEDESTRIAN_PAD=ps(.4);
export function inParkingBay(vehicle){
 const bay=vehicle?.parkingBay;
 return !!bay&&Math.abs(vehicle.x-bay.x)<.3&&Math.abs(vehicle.y-bay.y)<.3;
}
function touches(pose,body,other){
 const otherBody=other.body||'car';
 return body==='car'?(otherBody==='car'?vehiclesOverlap(pose,other):vehicleHitsPedestrian(pose,other)):
  otherBody==='car'&&vehicleHitsPedestrian(other,pose,inParkingBay(other)?BAY_PEDESTRIAN_PAD:PEDESTRIAN_PAD);
}
export function collidesWithTraffic(pose,body,index,self=null){
 for(const other of nearbyColliders(index,pose.x,pose.y,8)){
  if(other===self)continue;
  if(touches(pose,body,other))return other;
 }
 return null;
}
export function trafficMoveBlocker(current,next,body,index,self){
 // A route change can shift the lane several metres in a single simulation
 // tick. Check the swept pose so an NPC cannot jump across the player or a
 // car even when its final position would be clear.
 const dx=next.x-current.x,dy=next.y-current.y;
 const steps=Math.max(1,Math.min(24,Math.ceil(Math.hypot(dx,dy)/1.5)));
 const turn=Math.atan2(Math.sin(next.a-current.a),Math.cos(next.a-current.a));
 for(let i=1;i<=steps;i++){
  const t=i/steps,pose={x:current.x+dx*t,y:current.y+dy*t,a:current.a+turn*t,vehicleType:current.vehicleType,model:current.model};
  for(const other of nearbyColliders(index,pose.x,pose.y,8)){
   if(other===self||!touches(pose,body,other))continue;
   if(!touches(current,body,other))return other;
   // BF01: already in contact. Between two vehicles the move must really reduce the overlap
   // (a turn that sinks one corner deeper is refused); otherwise moving apart is enough.
   if(body==='car'&&(other.body||'car')==='car'){
    const now=vehicleSeparation(current,other),then=vehicleSeparation(pose,other);
    if(now&&then&&then.depth>=now.depth-1e-4)return other;
    if(now&&then)continue;
   }
   if(Math.hypot(pose.x-other.x,pose.y-other.y)<=Math.hypot(current.x-other.x,current.y-other.y)+.001)return other;
  }
 }
 return null;
}
export function trafficMoveBlocked(current,next,body,index,self){
 return !!trafficMoveBlocker(current,next,body,index,self);
}
