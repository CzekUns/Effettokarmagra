import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {CAR_SPRITES,loadCarSprites,carSpriteReady,drawCarSprite} from './car-sprites.mjs';

test('both Panda sprites are true transparent PNGs, cropped and game sized',async()=>{
 for(const [model,path] of Object.entries(CAR_SPRITES)){
  const buf=await readFile(new URL(path,import.meta.url));
  assert.equal(buf.subarray(0,8).toString('hex'),'89504e470d0a1a0a',model);
  assert.equal(buf.readUInt32BE(16),88);
  assert.equal(buf.readUInt32BE(20),132);
  const indexedPalette=buf[25]===3;
  assert.ok(indexedPalette,'compressed paletted pixel-art asset '+model);
  // Indexed PNG must include a transparency chunk, not a white/cream canvas.
  assert.ok(buf.includes(Buffer.from('tRNS')),'transparent background missing '+model);
 }
});
test('sprite renderer rotates a top-facing source sprite into positive-X car heading',()=>{
 class Img{
  complete=true;naturalWidth=88;naturalHeight=132;
  set src(url){this._src=url;}
 }
 const original=globalThis.Image;
 try{
  globalThis.Image=Img;
  loadCarSprites();
  assert.equal(carSpriteReady('panda-modern-white'),true);
  assert.equal(carSpriteReady('panda-fire-red'),true);
  const ops=[];
  const ctx={
   save(){ops.push(['save']);},restore(){ops.push(['restore']);},
   translate(x,y){ops.push(['translate',x,y]);},rotate(a){ops.push(['rotate',a]);},
   drawImage(_im,x,y,w,h){ops.push(['draw',x,y,w,h]);},
   strokeRect(){},set strokeStyle(_v){},set lineWidth(_v){}
  };
  assert.equal(drawCarSprite(ctx,125,200,0,'panda-modern-white',true),true);
  assert.deepEqual(ops[1],['translate',125,200]);
  assert.equal(ops[2][1],Math.PI/2);
  assert.deepEqual(ops[3],['draw',-2.75,-4.375,5.5,8.75]);
  ops.length=0;
  assert.equal(drawCarSprite(ctx,2,3,Math.PI/3,'panda-fire-red'),true);
  assert.equal(ops[2][1],Math.PI/3+Math.PI/2);
  assert.equal(drawCarSprite(ctx,2,3,0,'unknown'),false);
 }finally{
  if(original===undefined)delete globalThis.Image;else globalThis.Image=original;
 }
});
test('starter vehicle uses the new Panda asset but all traffic retains collision physics',async()=>{
 const game=await readFile(new URL('./game.mjs',import.meta.url),'utf8');
 const html=await readFile(new URL('./index.html',import.meta.url),'utf8');
 assert.match(game,/model:'panda-modern-white'/);
 assert.match(game,/k%8===1\?'panda-fire-red'/);
 assert.match(game,/if\(!drawCarSprite\(c,x,y,a,model,drive\)\)drawCityCar/);
 assert.match(game,/drawCar\(v\.x,v\.y,v\.a,v\.type,i===p\.car,v\.model,v\)/);
 assert.ok(Number((html.match(/game\.mjs\?v=(\d+)/)||[])[1])>=138,'game.mjs deve essere almeno alla v=138');
});
