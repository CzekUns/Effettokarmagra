import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {OFFERS,VENDOR_KINDS,vendorShops,vendorOpen,nearestShop,offersFor,buyOffer,shopNote,sanitizeShopSave} from './local-shops.mjs';
import {FOOD_STALLS} from './street-professions.mjs';
import {MARKET_VARIANTS,CAR_SPRITES} from './car-sprites.mjs';

const fryerAt=(x,y)=>({x,y,post:{x,y,a:0},profession:'friggitore'});
const stall=(model,x=100,y=50)=>({vehicle:{x:x+4,y,a:0,model,vendorStand:true},fryer:fryerAt(x,y)});

test('Q17 every food truck model of the game has a counter with invented street food',()=>{
 const models=[...Object.keys(MARKET_VARIANTS).filter(id=>MARKET_VARIANTS[id].model==='furgone-ambulante'),'furgone-fritti'];
 assert.ok(CAR_SPRITES['furgone-fritti'],'the fryer van sprite exists');
 for(const model of models){
  const sale=VENDOR_KINDS[model];
  assert.ok(sale,'counter for '+model);
  const offers=offersFor(sale.kind);
  assert.ok(offers.length>=1&&offers.every(o=>o.price>0&&o.price<=5&&o.effect==='carica'),'cheap street food for '+model);
 }
 for(const s of FOOD_STALLS)assert.ok(VENDOR_KINDS[s.model],'the five stands of the map sell: '+s.name);
});

test('Q17 the counter is open only while the fryer stands at it; on foot, within reach',()=>{
 const shops=vendorShops([stall('food-zeppole-panzerotti'),{vehicle:{model:'panda-modern-white'},fryer:fryerAt(0,0)}]);
 assert.equal(shops.length,1,'only food trucks sell');
 const [s]=shops;
 assert.equal(s.vendor,true);assert.match(shopNote(s),/fantasia/);assert.match(shopNote(s),/inventati/);
 assert.equal(nearestShop(shops,{x:103,y:50,car:-1}),s,'next to the fryer');
 assert.equal(nearestShop(shops,{x:103,y:50,car:0}),null,'not from a vehicle');
 s.fryer.x+=4;assert.equal(vendorOpen(s),false);assert.equal(nearestShop(shops,{x:103,y:50,car:-1}),null,'fryer knocked away: closed');
 s.fryer.x-=4;s.fryer.impactTime=.5;assert.equal(vendorOpen(s),false,'while being shoved');
 s.fryer.impactTime=0;assert.equal(vendorOpen(s),true);
});

test('Q17 buying a frittatina takes the money, is refused without funds and survives a reload',()=>{
 const [s]=vendorShops([stall('furgone-fritti')]);
 const progress={money:3};
 const ok=buyOffer(progress,'frittatina',s);
 assert.equal(ok.ok,true);assert.equal(progress.money,1);assert.equal(progress.shop.bought.frittatina,1);
 assert.equal(buyOffer(progress,'frittatina',s).reason,'fondi-insufficienti');assert.equal(progress.money,1);
 assert.equal(buyOffer(progress,'taglio',s).reason,'non-in-vendita','a fryer does not cut hair');
 const reloaded=sanitizeShopSave(JSON.parse(JSON.stringify(progress.shop)));
 assert.equal(reloaded.bought.frittatina,1,'saved with the campaign');assert.equal(reloaded.spent,OFFERS.frittatina.price);
});

test('Q17 game wiring: counters from the placed food trucks, closest counter, vendor label and prompt',async()=>{
 const game=await readFile(new URL('./game.mjs',import.meta.url),'utf8');
 assert.match(game,/state\.vendorShops=vendorShops\(state\.foodVendors\);/);
 assert.match(game,/function nearestCounter\(p\)\{\n const shop=nearestShop\(state\.shops,p\),stall=nearestShop\(state\.vendorShops,p\);/);
 assert.match(game,/shop\.vendor\?'AMBULANTE'/);
 assert.match(game,/\$\('shop-note'\)\.textContent=shopNote\(shop\);/);
 assert.match(game,/shopNear\.vendor\?'COMPRA · '\+shopNear\.name\.toUpperCase\(\)/);
});
