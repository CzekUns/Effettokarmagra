import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {generateTownStyles,TOWN_SCAN_RADII} from './town-generator.mjs';
import {applyApprovedArcadeRoofStyle,prepareCityStyles} from '../city-art.mjs';
import {applySurveyDrafts} from './visual-profiles.mjs';

const read=async p=>JSON.parse(await readFile(new URL(p,import.meta.url),'utf8'));
const [map,registry,town,church,older]=await Promise.all([
 read('../data/melito-map.json'),read('./building-register.json'),
 read('./town-visuals.json'),read('./piazza-santo-stefano.json'),
 read('./sector-001-002.json')
]);
const ids=arr=>new Set(arr.map(x=>x.id));

test('visual art now covers every unique OSM building across the WHOLE municipality',()=>{
 assert.equal(town.total,2056);
 assert.equal(town.profiles.length,map.buildings.length);
 assert.equal(ids(town.profiles).size,2056);
 assert.deepEqual(ids(town.profiles),ids(map.buildings));
 assert.equal(town.summary.visualProfiles,2056);
 assert.equal(town.summary.photographicallyVerified,1);
 assert.equal(registry.totals.visualModeled,2056);
 assert.equal(registry.totals.osmDraft,2055);
 assert.equal(registry.totals.photoVerified,1);
 assert.equal(registry.buildings.filter(b=>b.visualStatus).length,2056);
});
test('each OSM ID has its own classified textures and an explicit confidence label',()=>{
 const categories=new Set();
 const usedFacades=new Set(),usedRoofs=new Set();
 const mapById=new Map(map.buildings.map(b=>[b.id,b]));
 for(const p of town.profiles){
  const b=mapById.get(p.id);
  assert.ok(b,'unknown building way '+p.id);
  assert.equal(p.photoVerified,false);
  assert.equal(p.status,'osm-draft');
  assert.equal(p.scanStatus,'modeled-not-photographed');
  assert.equal(p.evidence[0],'osm:way/'+p.id);
  assert.ok(p.areaM2>=0);
  assert.ok(p.features.stories>=1);
  assert.equal(typeof p.features.storiesMeasured,'boolean');
  assert.match(p.facade,/^#[\da-f]{6}$/i);
  assert.match(p.roof,/^#[\da-f]{6}$/i);
  assert.ok(registry.buildings.find(row=>row.id===p.id&&row.sector===p.sector));
  categories.add(p.category);
  usedFacades.add(p.facade);usedRoofs.add(p.roof);
 }
 assert.ok(categories.size>=5,'variety in architectural classes');
 assert.ok(usedFacades.size>=12);
 assert.ok(usedRoofs.size>=8);
});
test('approved arcade style creates warm roofs on unverified drafts without inventing photo evidence',()=>{
 const all=map.buildings.map(b=>({...b,p:b.p.slice()}));
 prepareCityStyles(all,map.pois);
 applySurveyDrafts(all,[older,town,church]);
 const before=all.map(b=>b.p.slice());
 const count=applyApprovedArcadeRoofStyle(all);
 const clay=all.filter(b=>b.art.surveyFeatures?.roofKind==='pitched-clay');
 const verified=all.find(b=>b.id===733703815);
 assert.ok(count>=500,'the town should read as a compact terracotta-roofed arcade');
 assert.ok(clay.length>=count-2);
 assert.ok(clay.every(b=>b.art.surveyStatus==='osm-draft'&&/^#[bcd]/i.test(b.art.roofTint)));
 assert.equal(verified.art.surveyStatus,'photo-verified');
 assert.deepEqual(all.map(b=>b.p),before,'roof art must not alter OSM footprints');
});
test('radial sweep from Piazza Santo Stefano reaches every mapped building without gaps',()=>{
 assert.equal(TOWN_SCAN_RADII[0],190);
 assert.equal(town.rings.reduce((n,r)=>n+r.n,0),2056);
 assert.equal(town.rings[0].n,58);
 assert.ok(town.rings.length>=6);
 const ringNames=new Set(town.rings.map(r=>r.id));
 for(const p of town.profiles)assert.ok(ringNames.has(p.ring),'missing scan ring '+p.id);
 assert.equal(registry.sectors.reduce((n,s)=>n+s.visualModeled,0),2056);
 assert.equal(registry.sectors.length,34);
});
test('photo-verified church wins over the entire-city artistic draft',()=>{
 const all=map.buildings.map(b=>({...b,p:b.p.slice()}));
 prepareCityStyles(all,map.pois);
 const coords=all.map(b=>b.p.slice());
 const status=applySurveyDrafts(all,[older,town,church]);
 assert.deepEqual(status,{applied:2056,verified:1,total:2056});
 const churchB=all.find(x=>x.id===733703815);
 assert.equal(churchB.art.surveyStatus,'photo-verified');
 assert.equal(churchB.art.surveyFeatures,null);
 assert.equal(churchB.art.type,'church');
 assert.ok(churchB.art.surveyObservation.domeAppearance);
 const painted=all.filter(x=>x.art.surveyStatus).length;
 assert.equal(painted,2056);
 assert.deepEqual(all.map(b=>b.p),coords,'OSM footprints remain unchanged');
});
test('full scan can be regenerated deterministically without network or copied Google photos',()=>{
 const regenerated=generateTownStyles(map,registry);
 assert.deepEqual(regenerated.profiles,town.profiles);
 assert.deepEqual(regenerated.rings.map(r=>r.n),town.rings.map(r=>r.n));
 assert.equal(regenerated.photoVerified,0);
 const none=town.profiles.filter(b=>b.photoVerified);
 assert.equal(none.length,0);
});
test('the public survey and game actually load the city-wide set',async()=>{
 const game=await readFile(new URL('../game.mjs',import.meta.url),'utf8');
 const viewer=await readFile(new URL('./viewer.mjs',import.meta.url),'utf8');
 const page=await readFile(new URL('./index.html',import.meta.url),'utf8');
 assert.ok(game.includes("survey/town-visuals.json"));
 assert.ok(viewer.includes("fetch('./town-visuals.json')"));
 assert.ok(viewer.includes("sector:'CITY'"));
 assert.ok(viewer.includes("PSS-R"));
 assert.ok(page.includes('2.056'));
});
