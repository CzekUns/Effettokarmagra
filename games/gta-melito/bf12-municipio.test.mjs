import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {prepareWaterTowers,towerPoint,towerRevealTarget,checker,markRuinPool,UP,drawWaterTower,drawRuinPool,drawRuinPoolPuddles} from './municipio-landmarks.mjs';
import {exposedFacade,shiftColor} from './building-volume.mjs';

const read=f=>readFile(new URL('./'+f,import.meta.url),'utf8');
const [mapText,dataText]=await Promise.all([read('data/melito-map.json'),read('data/enclosures.json')]);
const map=JSON.parse(mapText),data=JSON.parse(dataText);
const drum=map.buildings.find(b=>b.id===733703519);
const inside=(x,y,p)=>{let yes=false;for(let i=0,j=p.length-2;i<p.length;j=i,i+=2){const ax=p[i],ay=p[i+1],bx=p[j],by=p[j+1];if(((ay>y)!==(by>y))&&(x<(bx-ax)*(y-ay)/(by-ay)+ax))yes=!yes;}return yes;};
// A canvas stand-in that records the calls: the drawing code runs for real without a browser.
function fakeCanvas(){
 const calls=[];const g={addColorStop(){}};
 return new Proxy({calls},{get(t,k){if(k in t)return t[k];if(k==='createRadialGradient'||k==='createLinearGradient')return ()=>g;return (...a)=>{calls.push(k);};},set(t,k,v){t[k]=v;return true;}});
}

test('BF12 Municipio: tower and ruined pool are honest data on the real round building of via Madrid',()=>{
 const tower=data.landmark.find(l=>l.tipo==='torre-serbatoio'),pool=data.landmark.find(l=>l.tipo==='piscina-rudere');
 assert.ok(tower&&pool);
 assert.equal(tower.verificato,false,'colours and height are estimates');assert.match(tower.note,/STIME/);
 assert.match(tower.fonte,/Esri World Imagery/);assert.match(pool.fonte,/Melitonline, 23\/02\/2025/);
 assert.ok(drum,'OSM building 733703519 is in the map');assert.equal(pool.edificio,733703519);
 assert.ok(inside(tower.x,tower.y,drum.p),'the shaft stands inside the round building');
 const v=pool.vasca,c=Math.cos(v.angolo*Math.PI/180),s=Math.sin(v.angolo*Math.PI/180);
 for(const [u,w] of [[-1,-1],[1,-1],[1,1],[-1,1]])
  assert.ok(inside(v.x+c*u*v.lunghezza/2-s*w*v.larghezza/2,v.y+s*u*v.lunghezza/2+c*w*v.larghezza/2,drum.p),'the pool fits inside the ruin');
 const shaftToPool=Math.abs(tower.y-v.y)-v.larghezza/2;
 assert.ok(shaftToPool>tower.raggioFusto,'the shaft does not stand in the pool');
 const complex=data.recinti.find(e=>e.id==='complesso-municipio');
 assert.match(complex.note,/nessuna insegna/,'no CARABINIERI sign while the building is not identified');
});

test('BF12 water tower: lifted like the buildings, checkered, see-through when the player is under or beside it',()=>{
 const [t]=prepareWaterTowers(data);
 assert.ok(t&&t.height>=30&&t.tank>t.shaft*3);
 const top=towerPoint(t,t.height);
 assert.ok(Math.abs((top.x-t.x)/t.height-UP.x)<1e-9&&Math.abs((top.y-t.y)/t.height-UP.y)<1e-9,'same lift direction as the roofs');
 assert.equal(checker(0,0,t.colors),t.colors[0]);assert.equal(checker(0,1,t.colors),t.colors[1]);assert.equal(checker(1,1,t.colors),t.colors[0]);
 const under=towerPoint(t,t.height*.86);
 assert.equal(towerRevealTarget(t,[{x:under.x+2,y:under.y}]),.3,'under the tank');
 assert.equal(towerRevealTarget(t,[{x:t.x+1,y:t.y-3}]),.3,'beside the shaft');
 assert.equal(towerRevealTarget(t,[{x:t.x+60,y:t.y+60}]),1,'far away: solid');
 const ctx=fakeCanvas();drawWaterTower(ctx,t,{alpha:.5,zoom:2});
 assert.ok(ctx.calls.filter(k=>k==='fill').length>60,'shadow, checker shaft, checker tank and cap are painted');
});

test('BF12 ruined pool: art flag only (polygon untouched), drawn with the sunken basin; puddles only when wet',()=>{
 const b=JSON.parse(JSON.stringify(drum)),before=b.p.slice();
 let xs=[],ys=[];for(let i=0;i<b.p.length;i+=2){xs.push(b.p[i]);ys.push(b.p[i+1]);}
 b.art={x0:Math.min(...xs),y0:Math.min(...ys),w:Math.max(...xs)-Math.min(...xs),h:Math.max(...ys)-Math.min(...ys)};
 assert.equal(markRuinPool([b],data),1);
 assert.deepEqual(b.p,before);assert.equal(b.art.ruinPool.w,22);
 const ctx=fakeCanvas();drawRuinPool(ctx,b,{exposedFacade,shiftColor});
 assert.ok(ctx.calls.includes('clip')&&ctx.calls.filter(k=>k==='fillRect').length>40,'walls, rubble, basin, tiles, weeds');
 const dry=fakeCanvas();drawRuinPoolPuddles(dry,b,0,0);assert.equal(dry.calls.length,0,'dry: no puddles');
 const wet=fakeCanvas();drawRuinPoolPuddles(wet,b,.8,1.2);assert.ok(wet.calls.filter(k=>k==='ellipse').length>=6,'rain: puddles and rings');
});

test('BF12 Municipio wiring: ruin in the building renderer, tower above the city with fade and night light',async()=>{
 const [game,art]=await Promise.all(['game.mjs','city-art.mjs'].map(read));
 assert.match(art,/import \{drawRuinPool\} from '\.\/municipio-landmarks\.mjs\?v=\d+'/);
 assert.match(art,/if\(a\.ruinPool\)\{drawRuinPool\(c,b,\{exposedFacade,shiftColor\}\);continue;\}/);
 assert.match(game,/markRuinPool\(state\.buildings,enclosureData\);\n state\.waterTowers=prepareWaterTowers\(enclosureData\);/);
 const sig=game.indexOf('drawSignals(c,state.graph.signals'),tower=game.indexOf('drawWaterTower(c,t,',sig),night=game.indexOf('drawNightLighting([x0,y0,x1,y1]',sig);
 assert.ok(sig>0&&tower>sig&&tower<night,'above cars and people, below the night shade');
 assert.ok(game.indexOf('drawWaterTowerLight(c,t,',night)>night,'the warning light shines through the night');
 assert.match(game,/towerRevealTarget\(t,\[p\.car>=0\?state\.cars\[p\.car\]:p\]\)/);
 assert.match(game,/drawRuinPoolPuddles\(c,b,state\.weather\.wetness,state\.clock\)/);
});
