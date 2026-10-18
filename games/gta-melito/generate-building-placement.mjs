/* Generate visual-only offsets for mapped buildings beside widened streets.
 * Run from the repository root: node games/gta-melito/generate-building-placement.mjs
 * Original OSM polygons, way IDs and street centrelines remain untouched. */
import {readFile,writeFile} from 'node:fs/promises';
import {visualRoadWidth} from './road-widths.mjs';
import {SIDEWALK_OUTER} from './sidewalk.mjs';
import {roadFootprintDistance,footprintsClear} from './urban-infill.mjs';

const map=JSON.parse(await readFile(new URL('./data/melito-map.json',import.meta.url)));
const infill=JSON.parse(await readFile(new URL('./data/urban-infill.json',import.meta.url)));
const segments=[];
for(const road of map.roads){
 if(['steps','path','track'].includes(road.t))continue;
 for(let i=2;i<road.p.length;i+=2){
  const ax=road.p[i-2],ay=road.p[i-1],bx=road.p[i],by=road.p[i+1];
  segments.push({ax,ay,bx,by,clearance:visualRoadWidth(road)/2+SIDEWALK_OUTER+.7});
 }
}
function box(p){
 let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;
 for(let i=0;i<p.length;i+=2){x0=Math.min(x0,p[i]);x1=Math.max(x1,p[i]);y0=Math.min(y0,p[i+1]);y1=Math.max(y1,p[i+1]);}
 return {x0,y0,x1,y1};
}
const shifted=(p,dx,dy)=>p.map((n,i)=>Math.round((n+(i%2?dy:dx))*10)/10);
function intrusion(p,near){
 const b=box(p);let worst=0,total=0;
 for(const s of near){
  const reach=s.clearance;
  if(Math.min(s.ax,s.bx)-reach>b.x1||Math.max(s.ax,s.bx)+reach<b.x0||
   Math.min(s.ay,s.by)-reach>b.y1||Math.max(s.ay,s.by)+reach<b.y0)continue;
  const overlap=Math.max(0,reach-roadFootprintDistance(p,s));
  worst=Math.max(worst,overlap);total+=overlap*overlap;
 }
 return {worst,total};
}
const directions=Array.from({length:16},(_,i)=>[Math.cos(i*Math.PI/8),Math.sin(i*Math.PI/8)]);
const offsets={};let affected=0,cleared=0,improved=0,originalTotal=0,afterTotal=0,maximumShift=0;
const cell=80,grid=new Map();
for(const b of [...map.buildings,...infill.buildings]){
 const bb=box(b.p);
 for(let gx=Math.floor((bb.x0-50)/cell);gx<=Math.floor((bb.x1+50)/cell);gx++)
  for(let gy=Math.floor((bb.y0-50)/cell);gy<=Math.floor((bb.y1+50)/cell);gy++){
   const key=gx+','+gy,items=grid.get(key)||[];items.push(b);grid.set(key,items);
  }
}
const boundsOverlap=(a,b)=>a.x0<b.x1&&a.x1>b.x0&&a.y0<b.y1&&a.y1>b.y0;
function newNeighborContacts(p,original,neighbors){
 const bb=box(p);let contacts=0;
 for(const other of neighbors){
  const q=other.placedP||other.p;
  if(!boundsOverlap(bb,box(q)))continue;
  if(!footprintsClear(p,q,0)&&footprintsClear(original,other.p,0))contacts++;
 }
 return contacts;
}
const entries=map.buildings.map(b=>{
 const bb=box(b.p);
 const near=segments.filter(s=>Math.min(s.ax,s.bx)-65<bb.x1&&Math.max(s.ax,s.bx)+65>bb.x0&&
  Math.min(s.ay,s.by)-65<bb.y1&&Math.max(s.ay,s.by)+65>bb.y0);
 return {b,bb,near,original:intrusion(b.p,near)};
}).sort((a,b)=>b.original.worst-a.original.worst||a.b.id-b.b.id);
for(const {b,bb,near,original} of entries){
 if(original.worst<.05)continue;
 affected++;originalTotal+=original.total;
 // Distinct landmarks stay at their mapped positions.
 if(b.id===733703815||b.id===733703600){afterTotal+=original.total;continue;}
 const neighbors=new Set();
 for(let gx=Math.floor((bb.x0-42)/cell);gx<=Math.floor((bb.x1+42)/cell);gx++)
  for(let gy=Math.floor((bb.y0-42)/cell);gy<=Math.floor((bb.y1+42)/cell);gy++)
   for(const item of grid.get(gx+','+gy)||[])if(item!==b)neighbors.add(item);
 const nearbyBuildings=[...neighbors];
 let best={dx:0,dy:0,measure:original,score:original.total};
 // A large translation would put the entire block in a different street.
 // Leave cramped original OSM polygons to the existing roof reveal instead.
 for(const distance of [1.5,3,4.5,6,8,10,12]){
  for(const [ux,uy] of directions){
   const dx=Math.round(ux*distance*10)/10,dy=Math.round(uy*distance*10)/10;
   const p=shifted(b.p,dx,dy),measure=intrusion(p,near);
   if(newNeighborContacts(p,b.p,nearbyBuildings))continue;
   const score=measure.total+distance*distance*.3;
   if(score<best.score)best={dx,dy,measure,score};
  }
  if(best.measure.worst<.05)break;
 }
 const accepted=(best.dx||best.dy)&&best.measure.total<original.total*.85;
 afterTotal+=accepted?best.measure.total:original.total;
 if(accepted&&best.measure.worst<.05)cleared++;
 if(accepted){offsets[b.id]=[best.dx,best.dy];b.placedP=shifted(b.p,best.dx,best.dy);
  improved++;maximumShift=Math.max(maximumShift,Math.hypot(best.dx,best.dy));}
}
const output={schema:1,sourceCreated:map.created,affected,cleared,improved,maximumShift,
 originalIntrusion:Math.round(originalTotal),remainingIntrusion:Math.round(afterTotal),offsets};
await writeFile(new URL('./data/building-placement.json',import.meta.url),JSON.stringify(output)+'\n');
console.log({affected,cleared,improved,maximumShift,originalTotal:Math.round(originalTotal),afterTotal:Math.round(afterTotal)});
