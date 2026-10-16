import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {prepareCityStyles} from '../city-art.mjs';
import {applySurveyDrafts} from './visual-profiles.mjs';
const read=async name=>JSON.parse(await readFile(new URL(name,import.meta.url),'utf8'));
const [map,registry,sector]=await Promise.all([
 read('../data/melito-map.json'),read('./building-register.json'),read('./sector-001-002.json')
]);
test('all 2056 buildings are uniquely registered and cannot be silently skipped',()=>{
 assert.equal(registry.buildings.length,map.buildings.length);
 assert.equal(registry.totals.registered,map.buildings.length);
 assert.deepEqual(new Set(registry.buildings.map(b=>b.id)),new Set(map.buildings.map(b=>b.id)));
 assert.equal(registry.buildings.filter(b=>b.stage==='osm-draft').length,47);
 assert.equal(registry.buildings.filter(b=>b.stage==='photo-verified').length,0);
 assert.equal(registry.sectors.reduce((sum,x)=>sum+x.n,0),map.buildings.length);
 assert.ok(registry.sectors.every(s=>s.n>0));
 assert.equal(registry.nextSector,'S003');
});
test('municipal-border sector traversal is spatially contiguous and deterministic',()=>{
 assert.equal(registry.sectors[0].sector,'S001');
 assert.equal(registry.sectors[0].row,0);
 assert.equal(registry.sectors[0].col,0);
 assert.equal(registry.sectors[1].sector,'S002');
 assert.equal(registry.sectors[1].row,0);
 assert.equal(registry.sectors[1].col,1);
 assert.equal(registry.sectors[0].bbox[2],registry.sectors[1].bbox[0]);
 for(const b of registry.buildings){
  const s=registry.sectors.find(q=>q.sector===b.sector);
  assert.ok(s, 'sector missing for '+b.id);
  assert.ok(b.x>=s.bbox[0]&&b.x<s.bbox[2]&&b.y>=s.bbox[1]&&b.y<s.bbox[3],
   'building located outside own sector '+b.id);
 }
});
test('first border sectors have 47 individual OSM keyed draft palettes',()=>{
 assert.equal(sector.count,47);
 assert.equal(sector.photoVerified,0);
 assert.equal(sector.profiles.length,47);
 const indexed=new Map(map.buildings.map(b=>[b.id,b]));
 const ids=new Set();
 for(const p of sector.profiles){
  assert.ok(!ids.has(p.id));ids.add(p.id);
  const b=indexed.get(p.id);assert.ok(b,'unknown building '+p.id);
  assert.ok(p.evidence.includes('osm:way/'+p.id));
  assert.equal(p.status,'osm-draft');assert.equal(p.photoVerified,false);
  assert.match(p.facade,/^#[0-9a-f]{6}$/i);
  assert.match(p.roof,/^#[0-9a-f]{6}$/i);
  assert.ok(p.areaM2>2);
  assert.ok(p.longAxisDeg>=0&&p.longAxisDeg<180);
 }
});
test('the actual renderer applies these 47 drafts, without altering building geometry',()=>{
 const all=map.buildings.map(b=>({...b,p:b.p.slice()}));
 const before=all.map(b=>b.p.slice());
 prepareCityStyles(all,map.pois);
 const stats=applySurveyDrafts(all,[sector]);
 assert.equal(stats.applied,47);assert.equal(stats.verified,0);
 assert.deepEqual(all.map(b=>b.p),before);
 const first=sector.profiles[0],model=all.find(b=>b.id===first.id);
 assert.equal(model.art.roofTint,first.roof);assert.equal(model.art.facadeTint,first.facade);
 const blank=all.find(b=>!sector.profiles.some(p=>p.id===b.id));
 assert.ok(blank&&!blank.art.roofTint);
});
test('Street View navigation is external: there is no downloaded Google imagery',async()=>{
 const viewer=await readFile(new URL('./viewer.mjs',import.meta.url),'utf8');
 const html=await readFile(new URL('./index.html',import.meta.url),'utf8');
 assert.ok(viewer.includes('https://www.google.com/maps/@?api=1&map_action=pano&viewpoint='));
 assert.ok(viewer.includes('https://www.google.com/maps/@?api=1&map_action=map&center='));
 assert.match(html,/Nessuna foto di Google è stata copiata/);
});
