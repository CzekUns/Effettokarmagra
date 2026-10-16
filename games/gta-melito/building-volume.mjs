/* GTA Melito: consistent 2.5D extrusion for EVERY OSM or placeholder footprint.
 * All dimensions are arcade projections, never surveyed real heights.
 * The footprint stays unchanged for OSM identity and collision geometry. */
const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
export function signedFootprintArea(path){
 let value=0;
 for(let i=2;i<path.length;i+=2)value+=path[i-2]*path[i+1]-path[i]*path[i-1];
 return value/2;
}
export function buildingVolume(building){
 const art=building?.art;
 if(!art||!building.p||building.p.length<6)return null;
 const floors=art.surveyFeatures?.stories;
 const mapped=Number(art.renderHeight)||0;
 const height=Number(building.h)||0;
 const inferredFloors=Number.isFinite(floors)&&floors>0?floors:Math.max(1,Math.round(Math.max(height,mapped,7)/3.4));
 const stories=clamp(Math.round(inferredFloors),1,9);
 const vertical=clamp(6+Math.max(height,mapped,stories*3)*.67,9,27);
 // Keep the 2.5D relief readable without projecting walls across nearby roads.
 const dx=clamp(vertical*.16,1.4,4.3),dy=clamp(vertical*.18,1.6,4.8);
 return {stories,vertical,dx,dy,areaSign:Math.sign(signedFootprintArea(building.p))||1,
  visual:true,measured:!!art.surveyFeatures?.storiesMeasured};
}
export function exposedFacade(edgeX,edgeY,volume){
 // For clockwise and anticlockwise OSM rings. Rear walls remain hidden by
 // the roof; only facades facing the projected viewer are visible.
 return (edgeX*volume.dy-edgeY*volume.dx)*volume.areaSign < -0.0001;
}
export function facadePoints(path,index,volume){
 const x1=path[index-2],y1=path[index-1],x2=path[index],y2=path[index+1];
 return {
  x1,y1,x2,y2,
  x3:x2+volume.dx,y3:y2+volume.dy,
  x4:x1+volume.dx,y4:y1+volume.dy,
  length:Math.hypot(x2-x1,y2-y1)
 };
}
export function shiftColor(hex,delta){
 const parsed=/^#([0-9a-f]{6})$/i.exec(String(hex||''));
 if(!parsed)return '#8f897b';
 const n=parseInt(parsed[1],16);
 const c=channel=>clamp(((n>>channel)&255)+delta,0,255);
 return '#'+[c(16),c(8),c(0)].map(x=>Math.round(x).toString(16).padStart(2,'0')).join('');
}
