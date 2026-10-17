import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {generateUrbanInfill,roadFootprintDistance,mapFingerprint,footprintsClear} from './urban-infill.mjs';
import {CAMERA_ZOOM_MAX,CAMERA_ZOOM_MIN,targetCameraZoom,advanceCameraZoom,describeCameraZoom} from './camera-zoom.mjs';
import {prepareCityStyles,prepareUrbanGround,drawTerrain,drawCityBuildings} from './city-art.mjs';
import {resolveLandmarks} from './campaign.mjs';
const map=JSON.parse(await readFile(new URL('./data/melito-map.json',import.meta.url),'utf8'));
let cached;
const generated=()=>cached||(cached=generateUrbanInfill(map));
const bbox=p=>{let x0=Infinity,x1=-Infinity,y0=Infinity,y1=-Infinity;for(let j=0;j<p.length;j+=2){x0=Math.min(x0,p[j]);x1=Math.max(x1,p[j]);y0=Math.min(y0,p[j+1]);y1=Math.max(y1,p[j+1]);}return{x0,x1,y0,y1};};
const separate=(a,b,pad)=>a.x1+pad<=b.x0||a.x0>=b.x1+pad||a.y1+pad<=b.y0||a.y0>=b.y1+pad;

test('urban infill adds honest placeholders only, preserving original OSM footprints',()=>{
 const first=map.buildings.map(b=>b.p.slice());
 const inf=generated();
 assert.ok(inf.buildings.length>=250&&inf.buildings.length<1600, 'sufficient but constrained urban infill');
 assert.ok(inf.stats.generated===inf.buildings.length);
 assert.equal(inf.stats.osmBuildings,2056);
 assert.equal(new Set(inf.buildings.map(b=>b.id)).size,inf.buildings.length);
 for(const b of inf.buildings){
  assert.ok(b.id<0,'negative synthetic ID prevents OSM attribution');
  assert.equal(b.inferred,true);
  assert.match(b.confidence,/placeholder/);
  assert.equal(b.p[0],b.p.at(-2));
  assert.equal(b.p[1],b.p.at(-1));
 }
 assert.deepEqual(map.buildings.map(b=>b.p),first);
});
test('synthetic polygons stay separate from actual mapped polygons, including rotated footprints',()=>{
 const existing=map.buildings.map(b=>({box:bbox(b.p),p:b.p}));
 for(const p of generated().buildings){
  const box=bbox(p.p);
  assert.ok(existing.every(real=>separate(real.box,box,1.8)||footprintsClear(real.p,p.p,1.8)),
   'overlap with real OSM building '+p.id);
 }
});
test('empty corners of rotated footprint bounds permit infill but real edge crossings do not',()=>{
 const diamond=[0,10,10,0,20,10,10,20,0,10];
 const corner=[0,0,2,0,2,2,0,2,0,0];
 const crossing=[8,8,12,8,12,12,8,12,8,8];
 assert.equal(footprintsClear(diamond,corner,2),true);
 assert.equal(footprintsClear(diamond,crossing,2),false);
});
test('urban infill is deterministic, grouped and covers more than the church neighborhood',()=>{
 const one=generated(),two=generateUrbanInfill(map);
 assert.deepEqual(one.buildings.map(b=>b.p),two.buildings.map(b=>b.p));
 const centers=one.buildings.map(b=>bbox(b.p)).map(b=>[(b.x0+b.x1)/2,(b.y0+b.y1)/2]);
 const real=map.buildings.map(b=>bbox(b.p)).map(b=>[(b.x0+b.x1)/2,(b.y0+b.y1)/2]);
 assert.ok(centers.every((p,i)=>Math.hypot(p[0]-1096,p[1]-1150)<650||
  centers.some((q,j)=>i!==j&&Math.hypot(p[0]-q[0],p[1]-q[1])<=29)||
  real.some(q=>Math.hypot(p[0]-q[0],p[1]-q[1])<=45)),
  'continuity can come from mapped buildings as well as synthetic neighbors');
 const quadrants=new Set(one.buildings.map(b=>Math.floor(b.p[0]/550)+','+Math.floor(b.p[1]/550)));
 assert.ok(quadrants.size>=12,'must be broadly distributed across Melito');
});
test('existing urban painting API accepts generated roofs and paved ground',()=>{
 const all=[...map.buildings.map(b=>({...b})),...generated().buildings.map(b=>({...b}))];
 prepareCityStyles(all,map.pois);
 const ground=prepareUrbanGround(all,map.roads);
 assert.ok(ground.size>1500);
 const ctx=new Proxy({},{get:(t,k)=>k in t?t[k]:(..._args)=>{},set:(t,k,v)=>{t[k]=v;return true}});
 assert.doesNotThrow(()=>drawCityBuildings(ctx,all.slice(-45),5));
 assert.doesNotThrow(()=>drawTerrain(ctx,[500,900,850,1200],5,ground));
});
test('automatic camera starts at the maximum on foot and progressively pulls back in cars',()=>{
 assert.equal(CAMERA_ZOOM_MAX,6);
 assert.equal(targetCameraZoom({inVehicle:false}),6);
 assert.equal(targetCameraZoom({inVehicle:false,moving:true,running:true}),5.55);
 const idle=targetCameraZoom({inVehicle:true,speed:0}),city=targetCameraZoom({inVehicle:true,speed:11});
 const fast=targetCameraZoom({inVehicle:true,speed:40});
 assert.ok(idle<5&&idle>3);
 assert.ok(city<idle&&city>fast);
 assert.ok(fast>=CAMERA_ZOOM_MIN&&fast<2.1);
 assert.ok(targetCameraZoom({inVehicle:true,speed:-28})===idle,
  'the game passes the magnitude of vehicle speed explicitly');
 assert.equal(targetCameraZoom({inVehicle:false},1.35),6,'always clamp to maximum');
 assert.ok(targetCameraZoom({inVehicle:false},.7)<6,'manual zoom bias persists');
 assert.match(describeCameraZoom({inVehicle:true,speed:22}),/IN CORSA/);
});
test('camera interpolation is frame independent and avoids jarring jumps',()=>{
 const old=6,target=2.4;
 const single=advanceCameraZoom(old,target,.05);
 const double=advanceCameraZoom(advanceCameraZoom(old,target,.025),target,.025);
 assert.ok(single<old&&single>target);
 assert.ok(Math.abs(double-single)<1e-9);
 assert.equal(advanceCameraZoom(old,target,0),old);
});
test('game exposes placeholder count and camera mode to the player',async()=>{
 const game=await readFile(new URL('./game.mjs',import.meta.url),'utf8');
 const html=await readFile(new URL('./index.html',import.meta.url),'utf8');
 assert.ok(game.includes('generateUrbanInfill(map)'));
 assert.ok(game.includes('targetCameraZoom(movement,state.zoomBias)'));
 assert.ok(game.includes('advanceCameraZoom'));
 assert.ok(game.includes('drawCityBuildings(ctx,[...inferred,...buildings],zoom)'));
 assert.ok(html.includes('id="inferred-count"'));
 assert.ok(html.includes('id="camera-mode"'));
 assert.ok(html.includes('id="zoom-auto"'));
 assert.ok(html.includes('game.mjs?v=099'));
 assert.ok(game.includes('urban-infill.mjs?v=091'));
});

test('whole footprint road clearance catches crossings missed by corner sampling',()=>{
 const p=[0,0,20,0,20,20,0,20,0,0];
 assert.equal(roadFootprintDistance(p,{ax:-10,ay:10,bx:30,by:10}),0);
 assert.equal(roadFootprintDistance(p,{ax:5,ay:5,bx:8,by:8}),0);
 assert.equal(roadFootprintDistance(p,{ax:-5,ay:-5,bx:25,by:-5}),5);
});
test('every synthetic footprint and its projected walls clear the complete road network',async()=>{
 const {ROAD_WIDTH_MULTIPLIER}=await import('./road-widths.mjs');
 const segments=map.roads.flatMap(r=>r.t==='steps'||r.t==='path'?[]:
  r.p.slice(2).flatMap((_,j)=>j%2?[]:[{ax:r.p[j],ay:r.p[j+1],bx:r.p[j+2],by:r.p[j+3],
   clearance:(r.w||5)*(ROAD_WIDTH_MULTIPLIER[r.t]||1.6)/2+6}]));
 for(const b of generated().buildings){
  const box=bbox(b.p);
  for(const seg of segments){
   if(Math.min(seg.ax,seg.bx)>box.x1+seg.clearance||Math.max(seg.ax,seg.bx)<box.x0-seg.clearance||
    Math.min(seg.ay,seg.by)>box.y1+seg.clearance||Math.max(seg.ay,seg.by)<box.y0-seg.clearance)continue;
   assert.ok(roadFootprintDistance(b.p,seg)>=seg.clearance-1e-7,'road intersects synthetic building '+b.id);
  }
 }
});
test('the added centre infill does not occupy campaign interaction points',()=>{
 const landmarks=resolveLandmarks(map,{x:map.projection.width/2,y:map.projection.height/2});
 const contains=(p,x,y)=>{let hit=false;for(let i=0,j=p.length-2;i<p.length;j=i,i+=2){
  const ax=p[i],ay=p[i+1],bx=p[j],by=p[j+1];
  if((ay>y)!==(by>y)&&x<(bx-ax)*(y-ay)/(by-ay)+ax)hit=!hit;
 }return hit;};
 for(const point of landmarks.values())for(const building of generated().buildings)
  assert.equal(contains(building.p,point.x,point.y),false,
   `infill ${building.id} blocks campaign interaction point ${point.id}`);
});

test('precomputed mobile art cache exactly matches generator and current OSM snapshot',async()=>{
 const cache=JSON.parse(await readFile(new URL('./data/urban-infill.json',import.meta.url),'utf8'));
 const {INFILL_VERSION}=await import('./urban-infill.mjs');
 assert.equal(cache.generatorVersion,INFILL_VERSION);
 assert.equal(cache.sourceCreated,map.created);
 assert.equal(cache.sourceFingerprint,mapFingerprint(map));
 assert.equal(cache.sourceOsmBuildings,map.buildings.length);
 assert.deepEqual(cache.buildings,generated().buildings);
 assert.deepEqual(cache.stats,generated().stats);
});
