import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {prepareCityStyles,prepareUrbanGround,drawCityStreets,drawCityBuildings,drawCityPeople,drawCityCar,drawCityPlayer,drawTerrain} from './city-art.mjs';
import {prepareStorefronts,drawStorefronts} from './storefronts.mjs';
const map=JSON.parse(await readFile(new URL('./data/melito-map.json',import.meta.url),'utf8'));
test('real OSM geometry is preserved and gets appropriate stylistic classifications',()=>{
 const before=map.buildings.map(b=>b.p.slice());
 const counts=prepareCityStyles(map.buildings,map.pois);
 assert.equal(map.buildings.length,2056);
 assert.equal(counts.church,2);
 assert.ok(counts.historic>=50);
 assert.ok(counts.apartment>=150);
 assert.equal(counts.civic,1);
 assert.ok(counts.market>=4);
 assert.deepEqual(map.buildings.map(b=>b.p),before,'art must not move OSM footprints');
});
test('Piazza Santo Stefano landmark church and nearby town hall are visually distinct',()=>{
 const church=map.buildings.find(b=>b.n==='Chiesa di Santa Maria delle Grazie');
 const chapel=map.buildings.find(b=>b.n==='Chiesa Maria SS. di Piedigrotta');
 const townhall=map.buildings.find(b=>b.id===733703600);
 assert.ok(church&&chapel&&townhall);
 assert.equal(church.art.type,'church');
 assert.equal(chapel.art.type,'church');
 assert.equal(townhall.art.type,'civic');
 const townpoi=map.pois.find(p=>p.n==='Municipio di Melito di Napoli');
 assert.ok(townpoi);
 assert.ok(Math.hypot(townhall.art.cx-townpoi.p[0],townhall.art.cy-townpoi.p[1])<35);
});
test('storefront designs are tied to named OSM POIs and actual streets',()=>{
 const shops=prepareStorefronts(map.pois,map.roads);
 assert.ok(shops.length>25);
 const names=new Set(map.pois.map(p=>p.n));
 assert.ok(shops.every(s=>names.has(s.name)));
 assert.ok(shops.every(s=>Number.isFinite(s.x)&&Number.isFinite(s.y)&&Number.isFinite(s.a)));
 assert.ok(shops.some(s=>s.kind==='supermarket'));
 assert.ok(shops.some(s=>s.kind==='post_office'));
});
test('Canvas functions paint world/cars/people without depending on external assets',()=>{
 const ctx=new Proxy({},{get(o,k){return k in o?o[k]:()=>{}},set(o,k,v){o[k]=v;return true;}});
 const near=map.buildings.filter(b=>Math.hypot(b.art.cx-1100,b.art.cy-1140)<150);
 const roads=map.roads.filter(r=>r.p.some((v,i)=>i%2===0&&v>800&&v<1450));
 const p=[800,800,1420,1390];
 assert.doesNotThrow(()=>drawTerrain(ctx,p,2.5));
 assert.doesNotThrow(()=>drawCityStreets(ctx,roads.slice(0,30),2.5));
 assert.doesNotThrow(()=>drawCityBuildings(ctx,near,2.5));
 const graph={edges:[{streetWidth:7}]};
 assert.doesNotThrow(()=>drawCityPeople(ctx,[{x:1000,y:1200,a:1,edge:0,kind:1,seed:51,speed:2}],graph,1.5,[900,1000,1300,1500]));
 for(const type of [0,1,2,3,4,5,6])assert.doesNotThrow(()=>drawCityCar(ctx,1200,1000,1,type,type===2));
 assert.doesNotThrow(()=>drawCityPlayer(ctx,{x:1200,y:1200,a:.5,car:-1},1,true));
 assert.doesNotThrow(()=>drawStorefronts(ctx,prepareStorefronts(map.pois,map.roads).slice(0,12),3));
});
test('mobile controls prevent selection but retain accessibility and mission UI',async()=>{
 const html=await readFile(new URL('./index.html',import.meta.url),'utf8');
 const game=await readFile(new URL('./game.mjs',import.meta.url),'utf8');
 for(const prop of ['user-select:none','-webkit-user-select:none','-webkit-touch-callout:none','touch-action:none'])
  assert.ok(html.includes(prop),prop);
 assert.match(html,/mission-panel-toggle.*aria-expanded="false"/);
 assert.match(html,/id="mission-panel" hidden/);
 assert.match(html,/button:focus-visible/);
 assert.ok(game.includes("addEventListener('selectstart'"));
 assert.ok(game.includes("addEventListener('contextmenu'"));
 assert.ok(game.includes("mission-panel-toggle"));
});
test('terrain derives urban versus open land from real OSM building and road geometry',()=>{
 const grid=prepareUrbanGround(map.buildings,map.roads);
 assert.ok(grid.size>2000);
 assert.ok([...grid.values()].some(v=>v>=2));
 const again=prepareUrbanGround(map.buildings,map.roads);
 assert.deepEqual([...grid],[...again]);
});


test('mobile play is landscape-only with analog movement, two action buttons and pause drawer',async()=>{
 const html=await readFile(new URL('./index.html',import.meta.url),'utf8');
 const game=await readFile(new URL('./game.mjs',import.meta.url),'utf8');
 assert.match(html,/id="rotate-screen"/);
 assert.match(html,/RUOTA LO SCHERMO/);
 assert.match(html,/id="touch-stick"/);
 assert.match(html,/id="radar"/);
 assert.match(html,/id="action"/);
 assert.match(html,/id="sprint"/);
 assert.match(html,/id="pause-toggle"/);
 assert.match(html,/id="pause-menu" hidden/);
 assert.match(html,/\.pause-menu\[hidden\]\{display:none\}/);
 assert.match(html,/orientation:landscape/);
 assert.match(game,/setPointerCapture\(e\.pointerId\)/);
 assert.match(game,/screen\.orientation\?\.lock/);
 assert.match(game,/function moveAxes\(/);
 assert.match(game,/activeKey=\(\)=>id==='sprint'&&state\.player\.car>=0\?'handbrake':key/);
});
test('browser page zoom is locked without disabling in-game camera zoom',async()=>{
 const html=await readFile(new URL('./index.html',import.meta.url),'utf8');
 const game=await readFile(new URL('./game.mjs',import.meta.url),'utf8');
 assert.match(html,/name="viewport"[^>]*maximum-scale=1,user-scalable=no/);
 assert.match(html,/html,body\{touch-action:none;overscroll-behavior:none\}/);
 assert.match(game,/e\.ctrlKey\|\|e\.metaKey/);
 assert.match(game,/gesturestart','gesturechange','gestureend/);
 assert.match(game,/canvas\.addEventListener\('wheel'/,'ordinary wheel remains mapped to camera zoom');
});
