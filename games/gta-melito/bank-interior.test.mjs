import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {resolveBankEntrances,nearestBankEntrance,drawBankEntrance,drawBankInterior,bankInteriorViewport,bankInteriorWalkable,stepBankInteriorPlayer} from './bank-interior.mjs';
import {inside} from './osm.mjs';
import {visualRoadWidth} from './road-widths.mjs';

const width=()=>4;

test('bank entrance resolves to a clear point beside a walkable road',()=>{
 const banks=resolveBankEntrances([
  {n:'Banco BPM',k:'bank',p:[5,2]},
  {n:'Office',k:'post_office',p:[5,2]},
 ],[{n:'Via Roma',t:'residential',p:[0,0,10,0]}],(x,y)=>y>=0,width);
 assert.equal(banks.length,1);
 assert.equal(banks[0].n,'Banco BPM');
 assert.ok(banks[0].y>=2.8&&banks[0].y<=5.1);
 assert.equal(banks[0].roadName,'Via Roma');
});

test('nearest bank activates only within the walking interaction radius',()=>{
 const entrances=[{n:'Banco BPM',x:10,y:20},{n:'Another Bank',x:30,y:20}];
 assert.equal(nearestBankEntrance(entrances,{x:15,y:20}).bank.n,'Banco BPM');
 assert.equal(nearestBankEntrance(entrances,{x:20,y:20}),null);
 assert.equal(nearestBankEntrance(entrances,{x:30,y:20},9).bank.n,'Another Bank');
});

test('the mapped Banco BPM gets a real on-foot entrance point',()=>{
 const map=JSON.parse(fs.readFileSync(new URL('./data/melito-map.json',import.meta.url),'utf8'));
 const poi=map.pois.find(item=>item.k==='bank');assert.ok(poi,'current OSM snapshot should contain a mapped bank');
 const near=(p)=>{
  let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;
  for(let i=0;i<p.length;i+=2){x0=Math.min(x0,p[i]);x1=Math.max(x1,p[i]);y0=Math.min(y0,p[i+1]);y1=Math.max(y1,p[i+1]);}
  return x0<poi.p[0]+28&&x1>poi.p[0]-28&&y0<poi.p[1]+28&&y1>poi.p[1]-28;
 };
 const roads=map.roads.filter(road=>near(road.p));
 const buildings=map.buildings.filter(building=>near(building.p));
 const [entrance]=resolveBankEntrances([poi],roads,(x,y)=>!buildings.some(building=>inside([x,y],building.p)),visualRoadWidth);
 assert.ok(entrance,'bank marker should resolve beside a walkable street without landing inside a mapped building');
 assert.ok(Math.hypot(entrance.x-poi.p[0],entrance.y-poi.p[1])<=24);
});

test('exterior marker and interior-only scene draw without touching street state',()=>{
 const calls=[];
 const ctx=new Proxy({roundRect(){calls.push(['roundRect']);}}, {get(target,key){
  if(key in target)return target[key];
  if(key==='measureText')return ()=>({width:20});
  return (...args)=>calls.push([key,...args]);
 },set(target,key,value){target[key]=value;return true;}});
 const bank={n:'Banco BPM',x:10,y:20};
 assert.doesNotThrow(()=>drawBankEntrance(ctx,bank,1));
 assert.doesNotThrow(()=>drawBankInterior(ctx,800,450,1,bank,{x:.5,y:.8}));
 assert.ok(calls.some(call=>call[0]==='fillRect'&&call[3]===800));
 const source=fs.readFileSync(new URL('./game.mjs',import.meta.url),'utf8');
 assert.match(source,/if\(state\.bankInterior\)\{drawBankInterior/);
 assert.match(source,/ENTRA IN BANCA/);
 assert.match(source,/ESCI DALLA BANCA/);
});

test('public game page loads the bank-scene build',()=>{
 const page=fs.readFileSync(new URL('./index.html',import.meta.url),'utf8');
 const game=fs.readFileSync(new URL('./game.mjs',import.meta.url),'utf8');
 assert.match(page,/game\.mjs\?v=131/);
 assert.match(game,/bank-interior\.mjs\?v=002/);
});

test('bank room keeps the street sprite scale and preserves compact device transform',()=>{
 const view=bankInteriorViewport(800,450);
 assert.ok(view.scale>=5&&view.scale<=7);
 assert.ok(view.x>=0&&view.y>=0);
 const mock=new Proxy({calls:[]}, {get(obj,k){return k in obj?obj[k]:(...args)=>{obj.calls.push([k,...args]);};},
  set(obj,k,v){obj[k]=v;return true;}});
 drawBankInterior(mock,800,450,1,{n:'BANCA'}, {x:.5,y:.82,a:-Math.PI/2,moving:false});
 assert.ok(mock.calls.some(c=>c[0]==='scale'&&c[1]===view.scale),
  'furniture and protagonist should share world scale');
 assert.ok(mock.calls.some(c=>c[0]==='rotate'),
  'when sprite is unavailable, exactly the same red-hoodie outdoor fallback is used');
 assert.equal(mock.calls.some(c=>c[0]==='setTransform'),false,
  'do not lose game.mjs compact devicePixelRatio transform');
});

test('bank player turns and cannot cross counters, ATM, chairs or walls',()=>{
 const p={x:.5,y:.82,a:0,moving:false};
 for(let i=0;i<110;i++)stepBankInteriorPlayer(p,{x:0,y:-1},false,.05);
 assert.ok(p.y>=28.5/64&&p.y<.82,'player should approach counter and stop');
 assert.equal(bankInteriorWalkable(.5,.3),false);
 assert.equal(bankInteriorWalkable(.12,.52),false);
 assert.equal(bankInteriorWalkable(.83,.70),false);
 const wasY=p.y;
 stepBankInteriorPlayer(p,{x:1,y:0},true,.05);
 assert.ok(p.x>.5);
 assert.equal(p.a,0);
 assert.equal(p.y,wasY);
 stepBankInteriorPlayer(p,{x:0,y:0},false,.05);
 assert.equal(p.moving,false);
 const game=fs.readFileSync(new URL('./game.mjs',import.meta.url),'utf8');
 assert.match(game,/stepBankInteriorPlayer\(local,axes,pressed\.run,dt\)/);
 assert.match(game,/player:\{x:\.5,y:\.82,a:-Math\.PI\/2,moving:false\}/);
 const bank=fs.readFileSync(new URL('./bank-interior.mjs',import.meta.url),'utf8');
 assert.match(bank,/drawCityPlayer\(ctx/);
});
