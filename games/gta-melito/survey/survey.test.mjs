import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {prepareCityStyles} from '../city-art.mjs';
import {applySurveyDrafts} from './visual-profiles.mjs';
const read=async name=>JSON.parse(await readFile(new URL(name,import.meta.url),'utf8'));
const [map,registry,sector,piazza]=await Promise.all([
 read('../data/melito-map.json'),read('./building-register.json'),read('./sector-001-002.json'),read('./piazza-santo-stefano.json')
]);
test('all 2056 buildings are uniquely registered and cannot be silently skipped',()=>{
 assert.equal(registry.buildings.length,map.buildings.length);
 assert.equal(registry.totals.registered,map.buildings.length);
 assert.deepEqual(new Set(registry.buildings.map(b=>b.id)),new Set(map.buildings.map(b=>b.id)));
 assert.equal(registry.buildings.filter(b=>b.stage==='osm-draft').length,104);
 assert.equal(registry.buildings.filter(b=>b.stage==='photo-verified').length,1);
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

test('Piazza Santo Stefano is now the active survey focus, without erasing the border-sector scan',()=>{
 assert.equal(registry.activeFocus.id,'PSS');
 assert.equal(registry.activeFocus.name,'Piazza Santo Stefano');
 assert.equal(registry.activeFocus.radiusMeters,190);
 assert.equal(registry.sectors.reduce((n,s)=>n+s.n,0),2056);
 assert.equal(piazza.profiles.length,58);
 assert.equal(piazza.stats.photoVerified,1);
 assert.equal(piazza.stats.draft,57);
 const ids=new Set(piazza.profiles.map(p=>p.id));
 assert.equal(ids.size,58);
 assert.deepEqual(ids,new Set(registry.buildings.filter(b=>b.focusArea==='PSS').map(b=>b.id)));
 const center=piazza.center;
 for(const b of piazza.profiles)assert.ok(Math.hypot(b.x-center.x,b.y-center.y)<=191,'Out-of-ring building: '+b.id);
 assert.equal(piazza.profiles[0].id,733703815);
});
test('the church is the ONLY photographically verified building in the first square ring',()=>{
 const found=piazza.profiles.filter(b=>b.photoVerified);
 assert.equal(found.length,1);
 assert.equal(found[0].id,733703815);
 assert.equal(found[0].status,'photo-verified');
 assert.ok(found[0].evidence.some(s=>s.includes('comune.melito.na.it')));
 assert.ok(found[0].evidence.some(s=>s.includes('fondoambiente.it')));
 assert.ok(found[0].evidence.some(s=>s.includes('ICCD')));
 assert.ok(found[0].observations.domeAppearance.includes('dark'));
 for(const b of piazza.profiles.filter(x=>!x.photoVerified)){
  assert.equal(b.status,'osm-draft');
  assert.deepEqual(b.evidence,['osm:way/'+b.id]);
 }
});
test('the renderer accepts the first square ring after the earlier two sectors',()=>{
 const buildings=map.buildings.map(b=>({...b,p:b.p.slice()}));
 prepareCityStyles(buildings,map.pois);
 const before=buildings.map(b=>b.p.slice());
 const stats=applySurveyDrafts(buildings,[sector,piazza]);
 assert.equal(stats.applied,47+58);
 assert.equal(stats.verified,1);
 const church=buildings.find(b=>b.id===733703815);
 assert.equal(church.art.surveyStatus,'photo-verified');
 assert.ok(church.art.surveyObservation.facadeAppearance.includes('baroque'));
 assert.deepEqual(buildings.map(b=>b.p),before);
});
test('viewer opens with Piazza Santo Stefano selected and offers traceable photo sources',async()=>{
 const viewer=await readFile(new URL('./viewer.mjs',import.meta.url),'utf8');
 const html=await readFile(new URL('./index.html',import.meta.url),'utf8');
 assert.ok(viewer.includes("setSector(init?.focusArea||init?.sector||'PSS')"));
 assert.ok(viewer.includes("fetch('./piazza-santo-stefano.json')"));
 assert.ok(viewer.includes("FOTO ICCD"));
 assert.ok(html.includes('fotografiche'));
});
