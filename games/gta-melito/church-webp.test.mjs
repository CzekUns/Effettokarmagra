import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {CHURCH_WEBP_PATH,loadChurchWebp,churchWebpReady,prepareCityStyles,drawCityBuildings} from './city-art.mjs';

const churchId=733703815;
test('authored church WebP is transparent, compact and kept separate from Google satellite imagery',async()=>{
 assert.match(CHURCH_WEBP_PATH,/assets\/buildings\/chiesa-santa-maria-delle-grazie-game\.webp$/);
 const bytes=await readFile(new URL(CHURCH_WEBP_PATH,import.meta.url));
 assert.equal(bytes.subarray(0,4).toString(),'RIFF');
 assert.equal(bytes.subarray(8,12).toString(),'WEBP');
 assert.ok(bytes.includes(Buffer.from('ALPH')),'WebP contains transparency information');
 assert.ok(bytes.length<12000,'church image is compact enough for mobile');
});

test('authored church image replaces the old roof without a polygon clip',async()=>{
 const map=JSON.parse(await readFile(new URL('./data/melito-map.json',import.meta.url),'utf8'));
 const building=map.buildings.find(b=>b.id===churchId);
 const chapel=map.buildings.find(b=>b.n==='Chiesa Maria SS. di Piedigrotta');
 assert.ok(building&&chapel);
 const coordinates=building.p.slice();
 prepareCityStyles([building,chapel],[]);
 const calls=[];
 let clips=0;const stack=[];
 const ctx=new Proxy({},{
  get(o,k){if(k==='drawImage')return (...args)=>calls.push(['image',clips,...args]);
   if(k==='save')return ()=>stack.push(clips);
   if(k==='restore')return ()=>{clips=stack.pop()??0;};
   if(k==='clip')return ()=>{clips++;};
    if(['fill','stroke','fillRect','strokeRect','translate','fillText'].includes(k))return (...args)=>calls.push([k,...args]);
   return k in o?o[k]:()=>{};},
  set(o,k,v){o[k]=v;return true;}
 });
 class MockImage {
  complete=true; naturalWidth=160; naturalHeight=136;
  set src(url){this._src=url; this.onload?.();}
 }
 const oldImage=globalThis.Image;
 try{
  globalThis.Image=MockImage;
  let updated=0;
  loadChurchWebp(()=>updated++);
  assert.equal(churchWebpReady(),true);
  assert.equal(updated,1,'raster tile invalidation callback is invoked on load');
  drawCityBuildings(ctx,[building],1.2);
  assert.equal(calls.filter(c=>c[0]==='image').length,1);
  assert.equal(calls.filter(c=>['fill','stroke','fillRect','strokeRect','translate','fillText'].includes(c[0])).length,0,
   'no old wall, roof, shadow or procedural bell tower drawn behind WebP');
  assert.equal(calls.find(c=>c[0]==='image')[1],0,'authored silhouette must remain complete');
  assert.deepEqual(building.p,coordinates,'do not change OSM collision geometry');
  calls.length=0;
  const {drawCityParcels}=await import('./city-art.mjs');
  drawCityParcels(ctx,[building]);
  assert.equal(calls.filter(c=>c[0]==='stroke').length,0,'no old lot contour under WebP');
  calls.length=0;
  drawCityBuildings(ctx,[chapel],3);
  assert.equal(calls.filter(c=>c[0]==='image').length,0,'other churches keep native Canvas artwork');
 }finally{
  if(oldImage===undefined)delete globalThis.Image;else globalThis.Image=oldImage;
 }
});

test('entrypoint invalidates cached tiles when church artwork becomes ready',async()=>{
 const game=await readFile(new URL('./game.mjs',import.meta.url),'utf8');
 const page=await readFile(new URL('./index.html',import.meta.url),'utf8');
 assert.ok(game.includes('loadChurchWebp(()=>{staticTiles.clear();pendingTile=null;})'));
 assert.ok(Number((game.match(/city\-art\.mjs\?v=(\d+)/)||[])[1])>=125,'city-art.mjs deve essere almeno alla v=125');
 assert.ok(Number((page.match(/game\.mjs\?v=(\d+)/)||[])[1])>=138,'game.mjs deve essere almeno alla v=138');
});
