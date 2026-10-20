import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {offersFor,buyOffer,sanitizeShopSave,OFFERS,nearestShop} from './local-shops.mjs';
import {outdoorShops,entranceAtSign,SIGN_RADIUS,interiorCounterNear,enterShop,interiorFor} from './shop-interiors.mjs';

const bar={name:'Bar di prova',kind:'bar',x:100,y:50},pane={name:'Panificio di prova',kind:'bakery',x:200,y:50};
const edicola={name:'Cartoleria',kind:'stationery',x:300,y:50};
const entrances=[{shop:bar,x:103,y:47,room:interiorFor(bar)},{shop:pane,x:203,y:47,room:interiorFor(pane)}];

test('Q26 the shops with an interior no longer sell from the pavement; the others still do',()=>{
 const outside=outdoorShops([bar,pane,edicola],entrances);
 assert.deepEqual(outside,[edicola]);
 assert.equal(nearestShop(outside,{x:100,y:51,car:-1}),null,'no COMPRA by the bar sign');
 assert.equal(nearestShop(outside,{x:300,y:51,car:-1}),edicola,'the stationer still sells outside');
});

test('Q26 by the sign of a shop with an interior the action is ENTRA',()=>{
 const hit=entranceAtSign(entrances,{x:101,y:52});
 assert.equal(hit.entrance.shop,bar);
 assert.equal(entranceAtSign(entrances,{x:100+SIGN_RADIUS+1,y:50}),null);
});

test('Q26 counter catalogues per kind: the old products stay, bar and minimarket add one each',()=>{
 const ids=kind=>offersFor(kind).map(o=>o.id);
 assert.deepEqual(ids('bar'),['caffe','cornetto','spremuta']);
 assert.deepEqual(ids('bakery'),['pane','sfogliatella']);
 assert.deepEqual(ids('convenience'),['acqua','snack']);
 for(const id of ['caffe','cornetto','sfogliatella','pane','acqua','cartolina','taglio','frittatina'])assert.ok(OFFERS[id],'kept '+id);
});

test('Q26 buying inside: same balance rules, insufficient funds change nothing, the save survives a reload',()=>{
 const progress={money:3,respect:0};
 const ok=buyOffer(progress,'spremuta',bar);
 assert.equal(ok.ok,true);assert.equal(progress.money,1);
 const poor=buyOffer(progress,'spremuta',bar);
 assert.equal(poor.ok,false);assert.equal(poor.reason,'fondi-insufficienti');assert.equal(progress.money,1);
 assert.equal(buyOffer(progress,'snack',bar).reason,'non-in-vendita','a bar does not sell snacks');
 const reloaded=sanitizeShopSave(JSON.parse(JSON.stringify(progress.shop)));
 assert.equal(reloaded.bought.spremuta,1,'one purchase, not two, after a reload');
});

test('Q26 the counter is reachable only standing in front of it, inside the room',()=>{
 const inner=enterShop(entrances[0],{x:103,y:48,a:0});
 assert.equal(interiorCounterNear(inner),null,'at the door: not at the counter');
 const c=inner.room.counter;Object.assign(inner.player,{x:c.x,y:c.y});
 assert.equal(interiorCounterNear(inner),c);
});

test('Q26 game wiring: COMPRA at the counter opens the Q06 panel, nothing sells outside, panel closed when leaving',async()=>{
 const game=await readFile(new URL('./game.mjs',import.meta.url),'utf8');
 assert.match(game,/state\.outdoorShops=outdoorShops\(state\.shops\|\|\[\],state\.shopEntrances\);/);
 assert.match(game,/const shop=nearestShop\(state\.outdoorShops\|\|state\.shops,p\)/);
 assert.match(game,/nearestShopEntrance\(state\.shopEntrances,p\)\|\|entranceAtSign\(state\.shopEntrances,p\)/);
 assert.match(game,/if\(counter\)\{\n   inner\.greet=[^\n]*\n   openShop\(inner\.shop\);return;/);
 assert.match(game,/boardPrompt\(counter\?'COMPRA · '\+counter\.label:(game\?game\.label:)?'ESCI DAL NEGOZIO'\)/,'Q27: games may sit between the counter and the exit');
 assert.match(game,/function leaveShop\(\)\{\n[^\n]*\n if\(state\.shopOpen\)closeShop\(\);/);
 assert.match(game,/if\(!interiorCounterNear\(inner\)\)\{inner\.greeted=false;if\(state\.shopOpen\)closeShop\(\);\}/);
 // the bank keeps its own entrance, untouched
 assert.match(game,/const entrance=nearestBankEntrance\(state\.bankEntrances,p\);/);
});
