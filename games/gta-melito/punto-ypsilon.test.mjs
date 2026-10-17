import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {CAR_ATLAS_PATH,CAR_ATLAS_CELL,CAR_ATLAS_VARIANTS,CAR_ATLAS_VARIANT_IDS,loadCarSprites,carSpriteReady,drawCarSprite} from './car-sprites.mjs';

test('Punto 188 and Ypsilon 2003 contribute exactly 16 unique top-down color sprites',()=>{
 assert.equal(CAR_ATLAS_VARIANT_IDS.length,16);
 assert.equal(new Set(CAR_ATLAS_VARIANT_IDS).size,16);
 assert.equal(CAR_ATLAS_VARIANTS['punto-188-red'].index,1);
 assert.equal(CAR_ATLAS_VARIANTS['punto-188-champagne'].index,7);
 assert.equal(CAR_ATLAS_VARIANTS['ypsilon-2003-white'].index,8);
 assert.equal(CAR_ATLAS_VARIANTS['ypsilon-2003-burgundy'].index,14);
 assert.equal(CAR_ATLAS_CELL.width,40);
 assert.equal(CAR_ATLAS_CELL.height,60);
});

test('PNG atlas is 160x240 indexed transparent image with valid PNG signature',async()=>{
 const b=await readFile(new URL(CAR_ATLAS_PATH,import.meta.url));
 assert.equal(b.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
 assert.equal(b.readUInt32BE(16),160);
 assert.equal(b.readUInt32BE(20),240);
 assert.equal(b[25],3,'indexed PNG for compact mobile loading');
 assert.ok(b.includes(Buffer.from('tRNS')),'must not paint a white rectangle in-game');
 assert.ok(b.length<12000,'mobile optimized atlas');
});

test('sprite atlas crops the right cell for Punto, Ypsilon and preserves forward direction',()=>{
 class MockImage{complete=true;naturalWidth=160;naturalHeight=240;set src(v){this._src=v;}}
 const prev=globalThis.Image;
 try{
  globalThis.Image=MockImage;
  loadCarSprites();
  const calls=[];
  const ctx={save(){},restore(){},translate(x,y){calls.push(['position',x,y]);},
   rotate(a){calls.push(['rotation',a]);},drawImage(...args){calls.push(['image',...args]);},
   strokeRect(){},set strokeStyle(v){},set lineWidth(v){},set imageSmoothingEnabled(v){}
  };
  for(const model of CAR_ATLAS_VARIANT_IDS)assert.equal(carSpriteReady(model),true,model);
  for(const model of CAR_ATLAS_VARIANT_IDS){
   calls.length=0;
   assert.equal(drawCarSprite(ctx,11,17,Math.PI/4,model),true);
   assert.deepEqual(calls[0],['position',11,17]);
   assert.ok(Math.abs(calls[1][1]-3*Math.PI/4)<1e-9);
   const i=CAR_ATLAS_VARIANTS[model].index,cut=calls.find(x=>x[0]==='image');
   assert.equal(cut.length,10,'atlas drawImage must use nine arguments');
   assert.equal(cut[2],(i%4)*40);
   assert.equal(cut[3],Math.floor(i/4)*60);
   assert.equal(cut[4],40);
   assert.equal(cut[5],60);
   assert.ok(cut[8]>0&&cut[9]>0);
  }
 }finally{if(prev===undefined)delete globalThis.Image;else globalThis.Image=prev;}
});

test('moving AI traffic and parked cars use Punto/Ypsilon without changing driving physics',async()=>{
 const game=await readFile(new URL('./game.mjs',import.meta.url),'utf8');
 const page=await readFile(new URL('./index.html',import.meta.url),'utf8');
 assert.ok(game.includes('CAR_ATLAS_VARIANT_IDS'));
 assert.ok(game.includes('drawCar(x,y,a,ai.kind,false,ai.model)'));
 assert.ok(game.includes('drawCar(v.x,v.y,v.a,v.type,i===p.car,v.model)'));
 assert.ok(game.includes("model:'panda-modern-white'"),'starter car remains a Panda');
 assert.ok(page.includes('game.mjs?v=103'),'cache-busted entry module');
});
