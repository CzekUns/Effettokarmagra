// Small world-space bins avoid scanning every NPC for each steering decision.
export function makeCollisionIndex(items,cell=16){
 const bins=new Map(),index={bins,cell};
 for(const item of new Set(items))addToCollisionIndex(index,item);
 return index;
}
const cellKey=(x,y,cell)=>Math.floor(x/cell)+','+Math.floor(y/cell);
export function addToCollisionIndex(index,item){
 if(!item||!Number.isFinite(item.x)||!Number.isFinite(item.y))return;
 const key=cellKey(item.x,item.y,index.cell);
 if(!index.bins.has(key))index.bins.set(key,new Set());index.bins.get(key).add(item);
}
export function moveInCollisionIndex(index,item,oldX,oldY){
 const before=cellKey(oldX,oldY,index.cell),after=cellKey(item.x,item.y,index.cell);
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
export function vehicleShape(v){
 return v?.vehicleType==='motorcycle'?{halfLength:2.8,halfWidth:1.05}:{halfLength:3.15,halfWidth:1.7};
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
export function vehicleHitsPedestrian(car,ped,pad=.8){
 const d=vehicleShape(car);
 const dx=ped.x-car.x,dy=ped.y-car.y,ca=Math.cos(car.a),sa=Math.sin(car.a);
 const forward=dx*ca+dy*sa,side=-dx*sa+dy*ca;
 return forward>=-d.halfLength-pad&&forward<=d.halfLength+pad&&Math.abs(side)<d.halfWidth+pad;
}
function touches(pose,body,other){
 const otherBody=other.body||'car';
 return body==='car'?(otherBody==='car'?vehiclesOverlap(pose,other):vehicleHitsPedestrian(pose,other)):
  otherBody==='car'&&vehicleHitsPedestrian(other,pose,.8);
}
export function collidesWithTraffic(pose,body,index,self=null){
 for(const other of nearbyColliders(index,pose.x,pose.y,8)){
  if(other===self)continue;
  if(touches(pose,body,other))return other;
 }
 return null;
}
export function trafficMoveBlocked(current,next,body,index,self){
 // A route change can shift the lane several metres in a single simulation
 // tick. Check the swept pose so an NPC cannot jump across the player or a
 // car even when its final position would be clear.
 const dx=next.x-current.x,dy=next.y-current.y;
 const steps=Math.max(1,Math.min(24,Math.ceil(Math.hypot(dx,dy)/1.5)));
 const turn=Math.atan2(Math.sin(next.a-current.a),Math.cos(next.a-current.a));
 for(let i=1;i<=steps;i++){
  const t=i/steps,pose={x:current.x+dx*t,y:current.y+dy*t,a:current.a+turn*t};
  for(const other of nearbyColliders(index,pose.x,pose.y,8)){
   if(other===self||!touches(pose,body,other))continue;
   if(!touches(current,body,other)||
    Math.hypot(pose.x-other.x,pose.y-other.y)<=Math.hypot(current.x-other.x,current.y-other.y)+.001)return true;
  }
 }
 return false;
}
