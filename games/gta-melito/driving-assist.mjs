/* Gentle road alignment for one-stick driving. Strong turns release the guide
 * briefly so an intersection or a sidewalk remains reachable. */
const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));

export function guideCar(angle,x,y,speed,steer,road,release=0,dt=0){
 const elapsed=clamp(Number(dt)||0,0,.05);
 release=Math.max(0,release-elapsed);
 if(Math.abs(steer)>.52)release=.85;
 if(release||speed<3||!road||road.distance>road.width/2+2.5)return {angle,release};
 const forward=wrap(road.a-angle);
 const reverse=wrap(road.a+Math.PI-angle);
 const difference=Math.abs(forward)<Math.abs(reverse)?forward:reverse;
 if(Math.abs(difference)>.58)return {angle,release};
 const heading=angle+difference;
 const lateral=-(x-road.x)*Math.sin(heading)+(y-road.y)*Math.cos(heading);
 // A small positional pull prevents drift, but never teleports the vehicle.
 const correction=clamp(-lateral*.025,-.14,.14);
 const strength=1-Math.abs(clamp(steer,-.52,.52))/.52;
 const target=wrap(difference+correction);
 return {angle:angle+target*(1-Math.exp(-2.5*strength*elapsed)),release};
}
