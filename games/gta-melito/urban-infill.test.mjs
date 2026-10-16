import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {generateUrbanInfill} from './urban-infill.mjs';
import {CAMERA_ZOOM_MAX,CAMERA_ZOOM_MIN,targetCameraZoom,advanceCameraZoom,describeCameraZoom} from './camera-zoom.mjs';
import {prepareCityStyles,prepareUrbanGround,drawTerrain,drawCityBuildings} from './city-art.mjs';
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
test('synthetic roof rectangles do not cover the axis-aligned bounds of mapped buildings',()=>{
 const existing=map.buildings.map(b=>bbox(b.p));
 for(const p of generated().buildings){
  const box=bbox(p.p);
  assert.ok(existing.every(real=>separate(real,box,1.8)),'overlap with real OSM building '+p.id);
 }
});
test('urban infill is deterministic and covers more than the church neighborhood',()=>{
 const one=generated(),two=generateUrbanInfill(map);
 assert.deepEqual(one.buildings.map(b=>b.p),two.buildings.map(b=>b.p));
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
 assert.equal(CAMERA_ZOOM_MAX,5);
 assert.equal(targetCameraZoom({inVehicle:false}),5);
 assert.equal(targetCameraZoom({inVehicle:false,moving:true,running:true}),4.65);
 const idle=targetCameraZoom({inVehicle:true,speed:0}),city=targetCameraZoom({inVehicle:true,speed:11});
 const fast=targetCameraZoom({inVehicle:true,speed:28});
 assert.ok(idle<5&&idle>3);
 assert.ok(city<idle&&city>fast);
 assert.ok(fast>=CAMERA_ZOOM_MIN&&fast<2.1);
 assert.ok(targetCameraZoom({inVehicle:true,speed:-28})===idle,
  'the game passes the magnitude of vehicle speed explicitly');
 assert.equal(targetCameraZoom({inVehicle:false},1.35),5,'always clamp to maximum');
 assert.ok(targetCameraZoom({inVehicle:false},.7)<5,'manual zoom bias persists');
 assert.match(describeCameraZoom({inVehicle:true,speed:22}),/IN CORSA/);
});
test('camera interpolation is frame independent and avoids jarring jumps',()=>{
 const old=5,target=2.4;
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
 assert.ok(game.includes('drawCityBuildings(c,[...inferred,...buildings]'));
 assert.ok(html.includes('id="inferred-count"'));
 assert.ok(html.includes('id="camera-mode"'));
 assert.ok(html.includes('id="zoom-auto"'));
 assert.ok(html.includes('game.mjs?v=075'));
});
