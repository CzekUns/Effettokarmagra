import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {interiorFor,barLayoutFor,BAR_BIG_FOOTPRINT,BAR_GAMES,interiorGameNear,startBarGame,endBarGame,enterShop,
 shopInteriorWalkable,stepShopInteriorPlayer,interiorCounterNear,resolveShopEntrances,footprintArea,poolFits,
 drawShopInterior,INTERIOR_OVERRIDES} from './shop-interiors.mjs';
import {BANK_ROOM} from './bank-interior.mjs';

const big={kind:'bar',name:'Bar grande di prova',id:10,x:50,y:7,a:0,side:1};
const small={kind:'bar',name:'Bar piccolo di prova',id:11,x:50,y:7,a:0,side:1,footprint:56};
const cafe={kind:'cafe',name:'Caffè di prova',id:12,x:50,y:7,a:0,side:1,footprint:3200};

// Grid flood fill from the doorway: every hotspot and the counter must be reachable between the furniture.
function reachableSet(room,from){
 const step=.5,key=(x,y)=>Math.round(x/step)+':'+Math.round(y/step),seen=new Set([key(from.x,from.y)]),queue=[from],pts=[from];
 while(queue.length){
  const p=queue.shift();
  for(const [dx,dy] of [[step,0],[-step,0],[0,step],[0,-step]]){
   const q={x:p.x+dx,y:p.y+dy},k=key(q.x,q.y);
   if(seen.has(k)||!shopInteriorWalkable(room,q.x,q.y))continue;seen.add(k);queue.push(q);pts.push(q);
  }
 }
 return target=>pts.some(p=>Math.hypot(p.x-target.x,p.y-target.y)<.8);
}

test('Q27 deterministic layout by kind and footprint: big bar, small bar, cafés always small, override wins',()=>{
 assert.equal(barLayoutFor(big),'grande','footprint unknown: the Q25 80×60 bar stays the big one');
 assert.equal(barLayoutFor(small),'piccolo');
 assert.equal(barLayoutFor({kind:'bar',id:1},BAR_BIG_FOOTPRINT),'grande');
 assert.equal(barLayoutFor({kind:'bar',id:1},BAR_BIG_FOOTPRINT-1),'piccolo');
 assert.equal(barLayoutFor(cafe),'piccolo','a café is small whatever the building');
 INTERIOR_OVERRIDES[99]={layout:'piccolo'};
 try{assert.equal(barLayoutFor({kind:'bar',id:99},5000),'piccolo');}finally{delete INTERIOR_OVERRIDES[99];}
 assert.deepEqual(interiorFor(big),interiorFor(big),'same shop, same room');
 const bank=BANK_ROOM.width*BANK_ROOM.height;
 for(const shop of [big,small]){const r=interiorFor(shop);const share=r.width*r.height/bank;assert.ok(share<=1/4+1e-9&&share>=1/6-1e-9);}
 assert.equal(footprintArea([0,0,10,0,10,5,0,5]),50);
});

test('Q27 big bar: counter, stools, tables, slot and video poker cabinets and a pool table, all solid',()=>{
 const room=interiorFor(big);
 assert.equal(room.layout,'grande');
 assert.deepEqual(room.games.map(g=>g.type),['slot','poker','pool']);
 assert.ok(room.pool,'pool table only where there is room for it');
 assert.equal(room.stools.length,4);assert.equal(room.tables.length,2);
 for(const box of [room.counter.box,...room.stools,...room.tables.map(t=>t.table),...room.games.map(g=>g.box)]){
  assert.equal(shopInteriorWalkable(room,(box[0]+box[2])/2,(box[1]+box[3])/2),false,'solid '+box);
  assert.ok(room.solids.includes(box));
 }
 const inner=enterShop({shop:big,room},{x:0,y:0,a:0}),reach=reachableSet(room,inner.player);
 assert.ok(reach(room.counter),'counter reachable');
 for(const game of room.games){
  assert.ok(shopInteriorWalkable(room,game.x,game.y),game.type+' hotspot on free floor');
  assert.ok(reach(game),game.type+' hotspot reachable from the door');
 }
 assert.equal(BAR_GAMES.slot.label,'GIOCA SLOT');assert.equal(BAR_GAMES.poker.label,'GIOCA VIDEO POKER');assert.equal(BAR_GAMES.pool.label,'GIOCA A BILIARDO');
});

test('Q27 small bar: no pool table, one cabinet, free passages; the pool table needs real space',()=>{
 for(const shop of [small,cafe,{...small,id:12}]){
  const room=interiorFor(shop);
  assert.equal(room.layout,'piccolo');assert.equal(room.pool,null,'no bulky table in a small bar');
  assert.equal(room.games.length,1);assert.ok(['slot','poker'].includes(room.games[0].type));
  assert.ok(!room.games.some(g=>g.type==='pool'));
  const inner=enterShop({shop,room},{x:0,y:0,a:0}),reach=reachableSet(room,inner.player);
  assert.ok(reach(room.counter)&&reach(room.games[0]),'counter and cabinet reachable');
 }
 assert.notEqual(interiorFor(small).games[0].type,interiorFor({...small,id:12}).games[0].type,'cabinet type picked from the shop id');
 const room={width:64,height:50};
 assert.equal(poolFits(room,[20,20,42,31],[],null),true);
 assert.equal(poolFits(room,[20,20,42,31],[[40,30,45,35]],null),false,'touching furniture');
 assert.equal(poolFits(room,[2,20,24,31],[],null),false,'no room for the cue against the wall');
 assert.equal(poolFits(room,[20,20,42,31],[],[27,18,37,50]),false,'never in the door→counter aisle');
});

test('Q27 hotspots in front of each object; counter keeps priority; walking away loses the hotspot',()=>{
 const room=interiorFor(big),inner=enterShop({shop:big,room},{x:0,y:0,a:0});
 for(const game of room.games){Object.assign(inner.player,{x:game.x,y:game.y});assert.equal(interiorGameNear(inner),game);}
 Object.assign(inner.player,{x:room.counter.x,y:room.counter.y});
 assert.ok(interiorCounterNear(inner));assert.equal(interiorGameNear(inner),null);
 Object.assign(inner.player,{x:room.width/2,y:room.height-6});assert.equal(interiorGameNear(inner),null);
});

test('Q27 minigames: called only if defined, otherwise «in arrivo"; the player returns to the same bar spot',()=>{
 const room=interiorFor(big),inner=enterShop({shop:big,room},{x:0,y:0,a:0});
 const slot=room.games.find(g=>g.type==='slot');Object.assign(inner.player,{x:slot.x,y:slot.y,a:0});
 const missing=startBarGame(inner,slot,{slot:null},{clock:10});
 assert.deepEqual(missing,{ok:false,reason:'in-arrivo'});
 assert.match(inner.notice.text,/IN ARRIVO/);assert.equal(inner.playing??null,null);
 let call=null;
 const ok=startBarGame(inner,slot,{slot:arg=>{call=arg;}},{clock:11});
 assert.equal(ok.ok,true);assert.equal(inner.playing,'slot');
 assert.equal(call.game,'slot');assert.equal(call.shop,big);assert.equal(typeof call.onExit,'function');
 const spot={x:inner.player.x,y:inner.player.y,a:inner.player.a};
 assert.equal(stepShopInteriorPlayer(inner,{x:0,y:1},false,.05),null);
 Object.assign(inner.player,{x:5,y:5,a:2});   // the minigame may move things around
 call.onExit();
 assert.deepEqual({x:inner.player.x,y:inner.player.y,a:inner.player.a},spot,'same position in the bar');
 assert.equal(inner.playing,null);
 const broken=startBarGame(inner,slot,{slot:()=>{throw new Error('x');}},{clock:12});
 assert.equal(broken.reason,'errore');assert.equal(inner.playing,null);
 assert.equal(endBarGame(inner),inner,'idempotent');
});

function fakeContext(){
 const calls={fill:0,text:[]};
 return {calls,ctx:new Proxy({},{get:(t,k)=>k==='fillText'?(s)=>calls.text.push(s):k==='fillRect'?()=>calls.fill++:k in t?t[k]:()=>{},set:(t,k,v)=>{t[k]=v;return true;}})};
}
test('Q27 drawing: both bar layouts draw, games are declared fantasy, the notice shows',()=>{
 for(const shop of [big,small]){
  const {ctx,calls}=fakeContext(),room=interiorFor(shop),inner=enterShop({shop,room},{x:0,y:0,a:0});
  inner.notice={text:'SLOT MACHINE · IN ARRIVO',x:room.games[0].x,y:room.games[0].y,until:5};
  drawShopInterior(ctx,800,450,1.2,inner,6.6,null);
  assert.ok(calls.fill>80);assert.ok(calls.text.some(t=>/GIOCHI DI FANTASIA/.test(t)));
  assert.ok(calls.text.includes('SLOT MACHINE · IN ARRIVO'));
 }
});

test('Q27 entrances read the OSM footprint behind the door',()=>{
 const building=(x,y)=>y>=11&&y<=40&&x>=0&&x<=400,walk=(x,y)=>!building(x,y)&&y>=-20&&y<=60;
 const probe=(origin,normal)=>{for(let s=0;s<6.5;s+=.25){const x=origin.x+normal.x*s,y=origin.y+normal.y*s;if(building(x,y+.45))return {x,y,nx:-normal.x,ny:-normal.y};}return null;};
 const seen=[];
 const doors=resolveShopEntrances([{...big},{...big,id:20,x:150}],{probe,isWalkable:walk,onRoad:(x,y)=>Math.abs(y)<4,
  footprintAt:(x,y)=>{seen.push([x,y]);assert.ok(building(x,y),'point inside the building');return x<100?80:400;}});
 assert.deepEqual(doors.map(d=>d.room.layout),['piccolo','grande']);
 assert.equal(seen.length,2);
});

test('Q27 game wiring: launchers only if defined, GIOCA prompt, return to the same spot, cache',async()=>{
 const [game,html]=await Promise.all(['game.mjs','index.html'].map(f=>readFile(new URL('./'+f,import.meta.url),'utf8')));
 for(const fn of ['openSlotGame','openPokerGame','openPoolGame'])assert.ok(game.includes("typeof "+fn+"==='function'?"+fn+":null"),fn);
 assert.match(game,/const game=interiorGameNear\(inner\);\n  if\(game\)\{playBarGame\(game\);return;\}/);
 assert.match(game,/boardPrompt\(counter\?'COMPRA · '\+counter\.label:game\?game\.label:'ESCI DAL NEGOZIO'\)/);
 assert.match(game,/startBarGame\(inner,game,barGameLaunchers\(\),\{clock:state\.clock,onExit:returnFromBarGame\}\)/);
 assert.match(game,/function returnFromBarGame\(inner\)\{\n if\(!inner\)return;\n endBarGame\(inner\);state\.shopInterior=inner;/);
 assert.match(game,/footprintAt\}\);/);
 assert.ok(Number((html.match(/game\.mjs\?v=(\d+)/)||[])[1])>=188);
});
