/* GTA Melito urban fabric fill. Synthetic buildings are NOT geographic facts.
 * Keep real OSM footprints and centerlines untouched. These visual stand-ins
 * occupy plausible uncharted urban gaps and are deliberately non-collidable. */
const widths={motorway:1.42,trunk:1.55,primary:1.75,secondary:1.90,tertiary:2.08,unclassified:2.18,residential:2.20,living_street:2.12,service:2,track:1.55,pedestrian:1.35,footway:1.2,path:1.18,steps:1.1};
const hash=n=>{let x=n|0;x=Math.imul(x^x>>>16,2246822519);x=Math.imul(x^x>>>13,3266489917);return (x^x>>>16)>>>0;};
const random=n=>hash(n)/4294967295;
const cell=45;
const key=(x,y)=>Math.floor(x/cell)+','+Math.floor(y/cell);
function put(bins,obj,x0,y0,x1,y1){
 for(let gx=Math.floor(x0/cell);gx<=Math.floor(x1/cell);gx++)
 for(let gy=Math.floor(y0/cell);gy<=Math.floor(y1/cell);gy++){
  const k=gx+','+gy;let list=bins.get(k);
  if(!list){list=[];bins.set(k,list)}list.push(obj);
 }
}
function nearby(bins,x,y,spread=1){
 const out=new Set(),gx=Math.floor(x/cell),gy=Math.floor(y/cell);
 for(let a=-spread;a<=spread;a++)for(let b=-spread;b<=spread;b++)
 for(const item of bins.get((gx+a)+','+(gy+b))||[])out.add(item);
 return out;
}
const distSeg=(x,y,s)=>{
 const dx=s.bx-s.ax,dy=s.by-s.ay,den=dx*dx+dy*dy;
 const t=den?Math.max(0,Math.min(1,((x-s.ax)*dx+(y-s.ay)*dy)/den)):0;
 return Math.hypot(s.ax+dx*t-x,s.ay+dy*t-y);
};
function pointIn(p,x,y){
 let yes=false;
 for(let i=0,j=p.length-2;i<p.length;j=i,i+=2){
  const ax=p[i],ay=p[i+1],bx=p[j],by=p[j+1];
  if((ay>y)!==(by>y)&&x<(bx-ax)*(y-ay)/(by-ay)+ax)yes=!yes;
 }
 return yes;
}
const rectanglesHit=(a,b,pad=0)=>a.x0<b.x1+pad&&a.x1>b.x0-pad&&a.y0<b.y1+pad&&a.y1>b.y0-pad;
const toBox=p=>{
 let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;
 for(let i=0;i<p.length;i+=2){x0=Math.min(x0,p[i]);y0=Math.min(y0,p[i+1]);x1=Math.max(x1,p[i]);y1=Math.max(y1,p[i+1]);}
 return {x0,y0,x1,y1};
};
function footprint(x,y,theta,w,h){
 const ca=Math.cos(theta),sa=Math.sin(theta),a=w/2,b=h/2;
 const corners=[[-a,-b],[a,-b],[a,b],[-a,b]].map(([u,v])=>[x+ca*u-sa*v,y+sa*u+ca*v]);
 const p=corners.flat();p.push(p[0],p[1]);return p;
}
function roadDistance(segments,x,y,max=100){
 let best=max,s=null;
 for(const seg of nearby(segments,x,y,2)){
  const d=distSeg(x,y,seg);
  if(d<best){best=d;s=seg;}
 }
 return {distance:best,segment:s};
}
export function generateUrbanInfill(map,{pitch=23.5,max=2600}={}){
 if(!map?.buildings?.length||!map?.roads?.length||!map?.border?.length)throw Error('OSM map required');
 const occupied=new Map(),roads=new Map(),realCenters=new Map(),sources=[];
 for(const b of map.buildings){
  const box=toBox(b.p),obj={...box};
  put(occupied,obj,box.x0-4,box.y0-4,box.x1+4,box.y1+4);
  const cx=(box.x0+box.x1)/2,cy=(box.y0+box.y1)/2;
  put(realCenters,{x:cx,y:cy},cx,cy,cx,cy);
 }
 for(const road of map.roads){
  if(road.t==='steps'||road.t==='path')continue;
  const w=(widths[road.t]||1.6)*(road.w||5),p=road.p;
  for(let j=2;j<p.length;j+=2){
   const ax=p[j-2],ay=p[j-1],bx=p[j],by=p[j+1],length=Math.hypot(bx-ax,by-ay);
   if(length<.3)continue;
   const seg={ax,ay,bx,by,a:Math.atan2(by-ay,bx-ax),w,t:road.t};
   put(roads,seg,Math.min(ax,bx)-45,Math.min(ay,by)-45,Math.max(ax,bx)+45,Math.max(ay,by)+45);
  }
 }
 const buildings=[],boxBin=new Map(),stats={tested:0,excludedReal:0,excludedRoad:0,excludedOpen:0,excludedBorder:0,excludedPiazza:0};
 const P=map.projection;
 for(let gy=0;gy<Math.floor(P.height/pitch);gy++)for(let gx=0;gx<Math.floor(P.width/pitch);gx++){
  if(buildings.length>=max)break;
  const seed=hash(gx*73009+gy*170141),x=(gx+.5)*pitch+(random(seed+8)-.5)*5,
   y=(gy+.5)*pitch+(random(seed+17)-.5)*5;stats.tested++;
  if(!pointIn(map.border,x,y)){stats.excludedBorder++;continue;}
  // Public squares and mission locations must remain readable and open.
  if(Math.hypot(x-1096,y-1150)<57||
     (map.pois||[]).some(p=>p.k==='townhall'&&Math.hypot(x-p.p[0],y-p.p[1])<27)){
   stats.excludedPiazza++;continue;
  }
  // Do not fill genuinely isolated fringe fields just because OSM has gaps.
  let nearCount=0,nearDist=Infinity;
  for(const b of nearby(realCenters,x,y,2)){
   const d=Math.hypot(x-b.x,y-b.y);
   if(d<85){nearCount++;nearDist=Math.min(nearDist,d);}
  }
  const street=roadDistance(roads,x,y,100),road=street.segment;
  if(!road||street.distance>48||nearCount<1||nearDist>80){stats.excludedOpen++;continue;}
  // Accept or omit small 2×2 cell clusters as a unit. This gives invented
  // infill a coherent block rhythm instead of peppering isolated footprints.
  const cluster=hash(Math.floor(gx/2)*73856093^Math.floor(gy/2)*19349663);
  const fillRate=nearCount>=5?.82:.68;
  if(random(cluster)>fillRate){stats.excludedOpen++;continue;}
  const w=11+Math.floor(random(seed+3)*8),d=10+Math.floor(random(seed+5)*9);
  // Orient with the nearest actual street segment; no fabricated street grid.
  const p=footprint(x,y,road.a,w,d),box=toBox(p);
  const corners=[x,y,...p.slice(0,-2)].reduce((out,v,i,arr)=>{if(i%2===0)out.push([v,arr[i+1]]);return out;},[]);
  if(corners.some(([px,py])=>!pointIn(map.border,px,py))){stats.excludedBorder++;continue;}
  const nearSegments=new Set();for(const [px,py] of corners)for(const seg of nearby(roads,px,py,1))nearSegments.add(seg);
  if([...nearSegments].some(seg=>corners.some(([px,py])=>
    distSeg(px,py,seg)<seg.w/2+3.3))){stats.excludedRoad++;continue;}
  // Conservative polygon AABB clearance. May leave gaps, never overwrites OSM.
  if([...nearby(occupied,x,y,2)].some(real=>rectanglesHit(real,box,2.4))||
     [...nearby(boxBin,x,y,1)].some(other=>rectanglesHit(other,box,2.2))){
   stats.excludedReal++;continue;
  }
  const t=nearCount>=4&&random(seed+7)>.4?'residential':
    nearCount<3&&w*d>220?'commercial':'residential';
  const model={id:-(1+gx+gy*10000),n:'',p,h:8+(hash(seed+15)%4)*3,t,lv:null,roof:'',material:'',usage:'',
   inferred:true,confidence:'visual-placeholder-not-OSM',
   nearbyRoad:road.t,purpose:'fill-urban-block-not-surveyed-building'};
  buildings.push(model);put(boxBin,box,box.x0,box.y0,box.x1,box.y1);
 }
 const center=b=>{const box=toBox(b.p);return[(box.x0+box.x1)/2,(box.y0+box.y1)/2];};
 // Drop solitary stands in empty OSM space. Infill remains a visual estimate,
 // but each retained footprint now belongs to a small, readable cluster.
 const centers=buildings.map(center),clustered=buildings.filter((b,i)=>
  centers.some((q,j)=>j!==i&&Math.hypot(q[0]-centers[i][0],q[1]-centers[i][1])<=29));
 stats.excludedOpen+=buildings.length-clustered.length;
 return {buildings:clustered,stats:{...stats,generated:clustered.length,candidates:buildings.length,
  excludedIsolated:buildings.length-clustered.length,osmBuildings:map.buildings.length,
  accuracy:'synthetic visual infill, not verified real building footprints'}};
}
