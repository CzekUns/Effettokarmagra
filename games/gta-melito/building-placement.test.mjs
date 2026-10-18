import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {placeBuildings} from './building-placement.mjs';
import {roadFootprintDistance} from './urban-infill.mjs';
import {visualRoadWidth} from './road-widths.mjs';
import {SIDEWALK_OUTER} from './sidewalk.mjs';

const read=async p=>JSON.parse(await readFile(new URL(p,import.meta.url)));
const [map,placement]=await Promise.all([read('./data/melito-map.json'),read('./data/building-placement.json')]);

test('placement keeps source OSM geometry, landmark identities and collision footprints coherent',()=>{
 const before=map.buildings.map(b=>b.p.slice());
 const placed=placeBuildings(map,placement);
 assert.equal(placement.sourceCreated,map.created);
 assert.equal(placed.length,2056);
 assert.ok(placement.improved>1000);
 for(let i=0;i<placed.length;i++){
  const old=map.buildings[i],next=placed[i];
  assert.equal(next.id,old.id);
  assert.deepEqual(old.p,before[i]);
  const dx=next.p[0]-old.p[0],dy=next.p[1]-old.p[1];
  assert.ok(Math.hypot(dx,dy)<=12.1,'excessive displacement '+old.id);
  for(let j=0;j<next.p.length;j+=2){
   assert.ok(Math.abs(next.p[j]-old.p[j]-dx)<.001);
   assert.ok(Math.abs(next.p[j+1]-old.p[j+1]-dy)<.001);
  }
 }
 for(const id of [733703815,733703600]){
  const original=map.buildings.find(b=>b.id===id);
  assert.deepEqual(placed.find(b=>b.id===id).p,original.p,'mapped landmark moved '+id);
 }
 assert.equal(placeBuildings(map,{...placement,sourceCreated:'stale'}),map.buildings);
});

test('corrected buildings reduce measured intrusion into real road and sidewalk corridors',()=>{
 const placed=placeBuildings(map,placement);
 const segments=[];
 for(const road of map.roads){
  if(['steps','path','track'].includes(road.t))continue;
  for(let j=2;j<road.p.length;j+=2)segments.push({
   ax:road.p[j-2],ay:road.p[j-1],bx:road.p[j],by:road.p[j+1],
   clearance:visualRoadWidth(road)/2+SIDEWALK_OUTER+.7
  });
 }
 const score=(p,near)=>near.reduce((total,s)=>{
  const d=roadFootprintDistance(p,s);
  return total+Math.max(0,s.clearance-d)**2;
 },0);
 let before=0,after=0;
 for(let i=0;i<placed.length;i++){
  const source=map.buildings[i],corrected=placed[i];
  if(source===corrected)continue;
  const xs=source.p.filter((_,j)=>j%2===0),ys=source.p.filter((_,j)=>j%2===1);
  const x0=Math.min(...xs)-65,x1=Math.max(...xs)+65,y0=Math.min(...ys)-65,y1=Math.max(...ys)+65;
  const near=segments.filter(s=>Math.min(s.ax,s.bx)<x1&&Math.max(s.ax,s.bx)>x0&&
   Math.min(s.ay,s.by)<y1&&Math.max(s.ay,s.by)>y0);
  before+=score(source.p,near);after+=score(corrected.p,near);
 }
 assert.ok(after<before*.45,'road intrusion barely improved: '+after+'/'+before);
});
