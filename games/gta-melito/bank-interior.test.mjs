import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {resolveBankEntrances,nearestBankEntrance,drawBankEntrance,drawBankInterior} from './bank-interior.mjs';
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
 assert.match(page,/game\.mjs\?v=130/);
 assert.match(game,/bank-interior\.mjs\?v=001/);
});
