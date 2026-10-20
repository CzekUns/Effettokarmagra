import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {OFFERS,offersFor,nearestShop,buyOffer,addBoost,boostFactor,boostSecondsLeft,purchaseMessage,sanitizeShopSave,shopNote,BOOST_FACTOR,SHOP_RADIUS} from './local-shops.mjs';
import {freshProgress,readProgress,saveProgress,SAVE_KEY} from './campaign.mjs';

const memory=()=>{const m=new Map();return {getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),raw:m};};
const bar={name:'Bar di prova',kind:'bar',x:100,y:50},barber={name:'Barbiere di prova',kind:'hairdresser',x:300,y:50};

test('Q06 catalogue: every product has a name and a whole-euro price; names real, products declared invented',()=>{
 for(const [id,offer] of Object.entries(OFFERS)){
  assert.ok(offer.name.length>2,id);assert.ok(Number.isInteger(offer.price)&&offer.price>0,id);
  assert.ok(['carica','rispetto','ricordo'].includes(offer.effect),id);
 }
 for(const kind of ['bar','cafe','pastry','bakery','supermarket','stationery','hairdresser'])assert.ok(offersFor(kind).length>0,kind);
 assert.deepEqual(offersFor('fuel'),[],'no counter where nothing is sold');
 assert.match(shopNote(),/OpenStreetMap/);assert.match(shopNote(),/inventati/);
});

test('Q06 a valid purchase spends mission money, records it and applies its effect',()=>{
 const p=freshProgress();p.money=20;
 const coffee=buyOffer(p,'caffe',bar);
 assert.equal(coffee.ok,true);assert.equal(p.money,19);assert.equal(coffee.balance,19);
 assert.deepEqual(p.shop,{bought:{caffe:1},spent:1});
 buyOffer(p,'caffe',bar);assert.equal(p.shop.bought.caffe,2);assert.equal(p.shop.spent,2);
 const cut=buyOffer(p,'taglio',barber);
 assert.equal(cut.ok,true);assert.equal(p.money,6);assert.equal(p.respect,3,'a service earns respect');
 assert.match(purchaseMessage(coffee),/Caffè al banco · −1 € · saldo 19 €/);
 assert.equal(buyOffer(p,'taglio',bar).reason,'non-in-vendita','a bar does not cut hair');
 assert.equal(buyOffer(p,'gelato',bar).reason,'sconosciuto');
 assert.equal(p.money,6,'refused purchases cost nothing');
});

test('Q06 insufficient funds: nothing changes and the player is told how much is missing',()=>{
 const p=freshProgress();p.money=5;p.respect=7;
 const before=JSON.parse(JSON.stringify(p));
 const result=buyOffer(p,'taglio',barber);
 assert.equal(result.ok,false);assert.equal(result.reason,'fondi-insufficienti');
 assert.deepEqual(p,before,'money, purchases and respect untouched');
 assert.equal(purchaseMessage(result),'Fondi insufficienti: servono 12 €, hai 5 €. Guadagnali con le missioni.');
 const broke=freshProgress();
 assert.equal(buyOffer(broke,'caffe',bar).ok,false,'a new game starts with no money');
});

test('Q06 purchases survive a reload; a tampered or old save is cleaned up',()=>{
 const store=memory(),p=freshProgress();p.money=30;p.mission=1;
 buyOffer(p,'cartolina',{kind:'stationery'});buyOffer(p,'caffe',bar);
 assert.equal(saveProgress(store,p),true);
 const again=readProgress(store);
 assert.equal(again.money,26);assert.deepEqual(again.shop,{bought:{cartolina:1,caffe:1},spent:4});
 store.setItem(SAVE_KEY,JSON.stringify({...p,shop:{bought:{caffe:3,gelato:9,cornetto:-2,acqua:1.5},spent:-50}}));
 assert.deepEqual(readProgress(store).shop,{bought:{caffe:3},spent:0},'unknown, negative or fractional entries dropped');
 store.setItem(SAVE_KEY,JSON.stringify({...p,shop:undefined}));
 assert.deepEqual(readProgress(store).shop,{bought:{},spent:0},'saves from before Q06 still load');
 assert.deepEqual(sanitizeShopSave({bought:{caffe:5000},spent:1e12}),{bought:{caffe:999},spent:999999});
});

test('Q06 coffee-type purchases make the walk faster for a while, stacking up to five minutes',()=>{
 let boost=null;
 boost=addBoost(boost,{effect:'carica',seconds:90},10);
 assert.equal(boostFactor(boost,50),BOOST_FACTOR);assert.equal(boostSecondsLeft(boost,50),50);
 assert.equal(boostFactor(boost,100.5),1,'then it wears off');
 boost=addBoost(boost,{effect:'carica',seconds:150},20);
 assert.equal(boost.until,250,'a second coffee adds up');
 for(let i=0;i<10;i++)boost=addBoost(boost,{effect:'carica',seconds:150},20);
 assert.equal(boost.until,320,'capped at five minutes from now');
 assert.equal(addBoost(boost,{effect:'ricordo'},20),boost,'a postcard does not make you run');
 assert.equal(boostFactor(null,0),1);
});

test('Q06 the counter is reachable only on foot, next to the shop, and only where something is sold',()=>{
 const shops=[bar,{name:'Distributore',kind:'fuel',x:104,y:50},barber];
 assert.equal(nearestShop(shops,{x:100+SHOP_RADIUS-.1,y:50,car:-1}),bar);
 assert.equal(nearestShop(shops,{x:100+SHOP_RADIUS+.5,y:50,car:-1}),null,'too far');
 assert.equal(nearestShop(shops,{x:100,y:50,car:0}),null,'not from the car');
 assert.equal(nearestShop([shops[1]],{x:104,y:50,car:-1}),null,'a fuel station has no counter here');
});

test('Q06 game wiring: counter opens with the action, pauses the world, money and purchases saved, HUD feedback',async()=>{
 const [game,html]=await Promise.all(['game.mjs','index.html'].map(f=>readFile(new URL('./'+f,import.meta.url),'utf8')));
 for(const id of ['shop-panel','shop-name','shop-balance','shop-offers','shop-feedback','shop-note','shop-close'])assert.match(html,new RegExp('id="'+id+'"'));
 assert.match(game,/import \{offersFor,nearestShop,buyOffer[^}]*\} from '\.\/local-shops\.mjs\?v=\d+'/);
 assert.match(game,/from '\.\/campaign\.mjs\?v=\d+'/,'campaign.mjs changed: its import carries a cache version');
 {const at=Math.max(game.indexOf('const shop=nearestCounter(p)'),game.indexOf('const target=footShopTarget(p)'));
 assert.ok(at>0&&at<game.indexOf('const entrance=nearestBankEntrance(state.bankEntrances,p)'),'counter (or Q25 shop door) before bank and vehicles');}
 assert.match(game,/\|\|state\.shopOpen\)\{/,'the world pauses while shopping');
 assert.match(game,/if\(result\.ok\)\{\n  saveProgress\(localStorage,state\.progress\);refreshCampaign\(\);/,'saved and HUD money refreshed right away');
 assert.match(game,/\$\('shop-balance'\)\.textContent='SALDO: € '\+money/);
 assert.match(game,/\*boostFactor\(state\.boost,state\.clock\)/,'the walking speed uses the boost');
 assert.match(game,/'COMPRA'/);
});
