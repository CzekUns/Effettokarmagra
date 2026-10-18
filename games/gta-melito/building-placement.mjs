/* Small, precomputed display/collision corrections for mapped buildings near
 * widened roads. The source OSM map, road centrelines and way IDs stay intact. */
export function placeBuildings(map,placement){
 const offsets=placement?.schema===1&&placement.sourceCreated===map.created?placement.offsets:null;
 if(!offsets)return map.buildings;
 return map.buildings.map(b=>{
  const offset=offsets[b.id];
  if(!Array.isArray(offset)||offset.length!==2)return b;
  const [dx,dy]=offset;
  if(!Number.isFinite(dx)||!Number.isFinite(dy)||Math.hypot(dx,dy)>12.1)return b;
  return {...b,p:b.p.map((v,i)=>Math.round((v+(i%2?dy:dx))*10)/10)};
 });
}
