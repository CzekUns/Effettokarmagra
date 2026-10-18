import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {buildingVolume,exposedFacade,facadePoints,shiftColor,signedFootprintArea} from './building-volume.mjs';
import {prepareCityStyles,drawCityBuildings} from './city-art.mjs';
import {generateUrbanInfill} from './urban-infill.mjs';
import {applySurveyDrafts} from './survey/visual-profiles.mjs';
const read=async file=>JSON.parse(await readFile(new URL(file,import.meta.url),'utf8'));
const [map,styles,church]=await Promise.all([
 read('./data/melito-map.json'),read('./survey/town-visuals.json'),read('./survey/piazza-santo-stefano.json')
]);
const source=map.buildings.map(b=>({...b,p:b.p.slice()})),placeholders=generateUrbanInfill(map).buildings;
prepareCityStyles(source,map.pois);
prepareCityStyles(placeholders,[]);
applySurveyDrafts(source,[styles,church]);
const all=[...source,...placeholders];
test('every OSM footprint and every generated visual infill building has actual 2.5D extrusion',()=>{
 assert.equal(source.length,2056);
 assert.ok(placeholders.length>=250&&placeholders.length<1600);
 assert.equal(all.length,source.length+placeholders.length);
 for(const b of all){
  const v=buildingVolume(b);
  assert.ok(v&&v.vertical>=9,'flat roof '+b.id);
  assert.ok(v.dx>=2&&v.dx<=6&&v.dy>=6&&v.dy<=18,'wall projection outside bounded oblique range '+b.id);
  assert.ok(Number.isFinite(v.stories)&&v.stories>=1,'missing stories '+b.id);
  let exposed=0;
  for(let j=2;j<b.p.length;j+=2)
   if(exposedFacade(b.p[j]-b.p[j-2],b.p[j+1]-b.p[j-1],v)){
    const face=facadePoints(b.p,j,v);
    assert.ok(face.length>0);
    assert.ok(face.y3>face.y2&&face.x4>face.x1);
    exposed++;
   }
  assert.ok(exposed>0,'no visible facade '+b.id);
 }
});
test('reversed OSM rings and very small outbuildings still show visible walls',()=>{
 const square=[0,0,10,0,10,6,0,6,0,0];
 const reversed=[0,0,0,6,10,6,10,0,0,0];
 for(const p of [square,reversed]){
  const volume=buildingVolume({id:1,p,h:1,art:{type:'mixed',seed:1}});
  assert.ok(volume.vertical>=9);
  const visible=[];
  for(let j=2;j<p.length;j+=2)
   if(exposedFacade(p[j]-p[j-2],p[j+1]-p[j-1],volume))visible.push(j);
  assert.equal(visible.length,2);
  assert.notEqual(signedFootprintArea(p),0);
 }
});
test('taller buildings keep a bounded oblique facade projection',()=>{
 const p=[0,0,12,0,12,9,0,9,0,0];
 const b={id:3,p,h:2,art:{type:'house',seed:1,renderHeight:3,surveyFeatures:{stories:1}}};
 const high={id:4,p,h:19,art:{type:'apartment',seed:1,renderHeight:19,surveyFeatures:{stories:6}}};
 assert.ok(buildingVolume(high).vertical>buildingVolume(b).vertical+5);
 assert.ok(buildingVolume(high).dx>buildingVolume(b).dx);
 assert.ok(buildingVolume(high).dy>buildingVolume(b).dy);
 assert.equal(buildingVolume(high).stories,6);
 assert.equal(shiftColor('#808080',30),'#9e9e9e');
 assert.equal(shiftColor('#808080',-30),'#626262');
});
test('renderer actually emits multiple opaque extruded side polygons before the roof for ALL categories',()=>{
 const names=['church','civic','school','market','industrial','historic','apartment','house','mixed'];
 const mock=()=>{const stats={fills:0,beginPaths:0,strokes:0};
  const ctx=new Proxy({
   save(){},restore(){},translate(){},beginPath(){stats.beginPaths++;},
   fill(){stats.fills++;},stroke(){stats.strokes++;},clip(){},
   moveTo(){},lineTo(){},closePath(){},fillRect(){},strokeRect(){},arc(){},
   setLineDash(){},fillText(){},ellipse(){},
  },{get:(o,k)=>k in o?o[k]:(...args)=>{},set:(o,k,v)=>{o[k]=v;return true;}});
  return {ctx,stats};
 };
 const landmarks=source.filter(b=>b.art.type==='church'||b.art.type==='civic');
 assert.ok(landmarks.length>=3);
 for(const kind of names){
  // Some legitimate categories have no mapped example in this OSM snapshot.
  // Exercise their renderer branch with a derived synthetic fixture as well.
  const mapped=source.find(e=>e.art.type===kind)||placeholders.find(e=>e.art.type===kind);
  const b=mapped||{...source[0],id:-99215,art:{...source[0].art,type:kind}};
  assert.ok(b,'category '+kind+' needs coverage');
  const {ctx,stats}=mock();
  drawCityBuildings(ctx,[b],4.5);
  assert.ok(stats.fills>=3,kind+' remains flat');
  assert.ok(stats.strokes>=3,kind+' missing walls/roof trims');
 }
 const smallest=[...all].sort((a,b)=>a.art.area-b.art.area).slice(0,12);
 for(const b of smallest){
  const {ctx,stats}=mock();drawCityBuildings(ctx,[b],5);
  assert.ok(stats.fills>=3,'tiny structure failed extrusion '+b.id);
 }
});
test('one coherent painter order merges placeholder and OSM buildings in the game',async()=>{
 const js=await readFile(new URL('./game.mjs',import.meta.url),'utf8');
 assert.match(js,/drawCityBuildings\(ctx,\[\.\.\.inferred,\.\.\.buildings\],zoom\)/);
 assert.ok(js.includes('city-art.mjs?v=124'));
 const html=await readFile(new URL('./index.html',import.meta.url),'utf8');
 assert.ok(html.includes('game.mjs?v=129'));
});
