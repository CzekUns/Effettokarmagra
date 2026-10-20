import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {CAR_SPRITES,STREET_VENDOR_VEHICLES,CAR_TRAFFIC_SPRITE_IDS,drawCarSprite,carSpriteReady,loadCarSprites} from './car-sprites.mjs';
import {FRYER_ATLAS_PATH,FRYER_CELL,drawFryerSprite,fryerSpriteReady,loadFryerSprite} from './friggitore-sprites.mjs';

test('Ape and fritti van are 88×132 pixel transparent palette PNGs loaded from the game',async()=>{
 assert.deepEqual(STREET_VENDOR_VEHICLES,['ape-car-azzurra','furgone-fritti']);
 for(const key of STREET_VENDOR_VEHICLES){
  assert.ok(CAR_TRAFFIC_SPRITE_IDS.includes(key));
  const file=await readFile(new URL(CAR_SPRITES[key],import.meta.url));
  assert.equal(file.subarray(0,8).toString('hex'),'89504e470d0a1a0a',key);
  assert.equal(file.readUInt32BE(16),88,key+' width');
  assert.equal(file.readUInt32BE(20),132,key+' height');
  assert.equal(file[25],3,'pixel palette, not expensive RGB');
  assert.ok(file.includes(Buffer.from('tRNS')),key+' has a transparent background');
  assert.ok(file.length<16000,'compact on Android');
 }
});

test('top-facing PNGs render at appropriate scale and orientation for street traffic',()=>{
 const original=globalThis.Image;
 class Img{complete=true;naturalWidth=88;naturalHeight=132;set src(x){this._src=x;}}
 try{
  globalThis.Image=Img;loadCarSprites();
  assert.equal(carSpriteReady('ape-car-azzurra'),true);
  assert.equal(carSpriteReady('furgone-fritti'),true);
  const ops=[],ctx={save(){},restore(){},translate(){},rotate(a){ops.push(['rotate',a]);},
   drawImage(...args){ops.push(['img',...args]);},strokeRect(){}};
  assert.ok(drawCarSprite(ctx,0,0,0,'ape-car-azzurra'));
  assert.equal(ops[0][1],Math.PI/2);
  assert.deepEqual(ops[1].slice(2),[-2.05,-3.125,4.1,6.25]);
  ops.length=0;
  assert.ok(drawCarSprite(ctx,5,6,Math.PI,'furgone-fritti'));
  assert.equal(ops[0][1],Math.PI*1.5);
  assert.deepEqual(ops[1].slice(2),[-2.825,-4.325,5.65,8.65]);
 }finally{if(original===undefined)delete globalThis.Image;else globalThis.Image=original;}
});

test('white-coated cook atlas supplies four walking directions and four actual frames',async()=>{
 const file=await readFile(new URL(FRYER_ATLAS_PATH,import.meta.url));
 assert.equal(file.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
 assert.equal(file.readUInt32BE(16),96);
 assert.equal(file.readUInt32BE(20),160);
 assert.equal(file[25],3);
 assert.ok(file.includes(Buffer.from('tRNS')));
 assert.deepEqual(FRYER_CELL,{width:24,height:40,directions:4,frames:4});
 const original=globalThis.Image;
 class Img{complete=true;naturalWidth=96;naturalHeight=160;set src(v){this._src=v;}}
 try{
  globalThis.Image=Img;loadFryerSprite();
  assert.equal(fryerSpriteReady(),true);
  let args;const ctx={drawImage(...a){args=a;}};
  assert.equal(drawFryerSprite(ctx,9,8,-Math.PI/2,0,false,1,0),true);
  assert.equal(args[1],0);assert.equal(args[2],0);
  assert.equal(drawFryerSprite(ctx,9,8,Math.PI/2,.5,true,1,0),true);
  assert.equal(args[2],40);
  assert.equal(args[3],24);assert.equal(args[4],40);
  assert.ok(args[7]<=3.3&&args[8]<=4.7);
 }finally{if(original===undefined)delete globalThis.Image;else globalThis.Image=original;}
});

test('city runtime integrates food-truck crews, professions and traffic Ape',async()=>{
 const [game,art,html]=await Promise.all([
  readFile(new URL('./game.mjs',import.meta.url),'utf8'),
  readFile(new URL('./city-art.mjs',import.meta.url),'utf8'),
  readFile(new URL('./index.html',import.meta.url),'utf8')]);
 assert.match(game,/k===2\?'ape-car-azzurra':k===5\?'furgone-fritti'/);
 assert.match(game,/loadFryerSprite\(\)/);
 assert.match(game,/loadProfessionSprites\(\)/);
 assert.match(game,/placeStreetFoodVendors\(state.graph,state.cars/);
 assert.match(game,/createStreetProfessionActors\(state.graph,state.foodVendors/);
 assert.match(game,/trafficApeModel\(i\)/);
 assert.match(art,/drawProfessionSprite\(c,x,y,angle,p.profession/);
 assert.match(art,/drawFryerSprite\(c,x,y,angle,clock,moving,p.speed,p.seed\)/);
 assert.ok(Number((game.match(/car\-sprites\.mjs\?v=(\d+)/)||[])[1])>=108,'car-sprites.mjs almeno v=108');
 assert.ok(Number((game.match(/city\-art\.mjs\?v=(\d+)/)||[])[1])>=129,'city-art.mjs almeno v=129');
 assert.ok(Number((html.match(/game\.mjs\?v=(\d+)/)||[])[1])>=154,'game.mjs almeno v=154');
});
