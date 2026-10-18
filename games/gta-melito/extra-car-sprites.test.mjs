import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {inflateSync} from 'node:zlib';
import {
 EXTRA_CAR_ATLASES,EXTRA_CAR_VARIANTS,CAR_ATLAS_VARIANT_IDS,CAR_TRAFFIC_SPRITE_IDS,
 CAR_ATLAS_CELL,drawCarSprite,loadCarSprites,carSpriteReady
} from './car-sprites.mjs';

function decodePNGAlpha(bytes){
 assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
 const w=bytes.readUInt32BE(16),h=bytes.readUInt32BE(20);
 assert.equal(bytes[24],8,'indexed PNG uses 8-bit pixels');
 assert.equal(bytes[25],3,'compact indexed PNG');
 const idats=[];let alphas=null,at=8;
 while(at<bytes.length){
  const len=bytes.readUInt32BE(at),tag=bytes.toString('ascii',at+4,at+8),data=bytes.subarray(at+8,at+8+len);at+=12+len;
  if(tag==='tRNS')alphas=data;
  if(tag==='IDAT')idats.push(data);
  if(tag==='IEND')break;
 }
 assert.ok(alphas,'real alpha palette in PNG');
 const compressed=inflateSync(Buffer.concat(idats));
 const indices=Buffer.alloc(w*h);
 const previous=Buffer.alloc(w);
 let cursor=0;
 for(let y=0;y<h;y++){
  const filter=compressed[cursor++];const row=Buffer.from(compressed.subarray(cursor,cursor+w));cursor+=w;
  for(let x=0;x<w;x++){
   const left=x?row[x-1]:0,up=previous[x],diagonal=x?previous[x-1]:0;
   if(filter===1)row[x]=(row[x]+left)&255;
   else if(filter===2)row[x]=(row[x]+up)&255;
   else if(filter===3)row[x]=(row[x]+Math.floor((left+up)/2))&255;
   else if(filter===4){
    const p=left+up-diagonal,pa=Math.abs(p-left),pb=Math.abs(p-up),pc=Math.abs(p-diagonal);
    row[x]=(row[x]+(pa<=pb&&pa<=pc?left:pb<=pc?up:diagonal))&255;
   }else assert.equal(filter,0,'known PNG filter');
  }
  row.copy(indices,y*w);row.copy(previous);
 }
 return {w,h,alpha:(x,y)=>alphas[indices[y*w+x]]??255};
}

test('four extra car families have eight distinct color variants each',()=>{
 const models=['seicento-1998','fiat-500-2007','fiat-uno-1983','smart-fortwo-2007'];
 assert.equal(CAR_ATLAS_VARIANT_IDS.length,16);
 assert.equal(Object.keys(EXTRA_CAR_VARIANTS).length,32);
 assert.equal(CAR_TRAFFIC_SPRITE_IDS.length,48);
 assert.equal(new Set(CAR_TRAFFIC_SPRITE_IDS).size,48);
 for(const model of models)assert.equal(Object.keys(EXTRA_CAR_VARIANTS).filter(x=>x.startsWith(model+'-')).length,8);
 assert.equal(EXTRA_CAR_VARIANTS['smart-fortwo-2007-green'].index,15);
 assert.equal(EXTRA_CAR_VARIANTS['fiat-uno-1983-white'].index,0);
 assert.deepEqual(CAR_ATLAS_CELL,{width:40,height:60,columns:4,rows:4});
});

test('both new PNG atlases have transparent corners and opaque car bodies',async()=>{
 for(const path of Object.values(EXTRA_CAR_ATLASES)){
  const bin=await readFile(new URL(path,import.meta.url));const a=decodePNGAlpha(bin);
  assert.equal(a.w,160);assert.equal(a.h,240);
  assert.ok(bin.length<18000,'each atlas is compact for mobile');
  for(let index=0;index<16;index++){
   const ox=index%4*40,oy=Math.floor(index/4)*60;
   for(const [x,y] of [[0,0],[39,0],[0,59],[39,59]])
    assert.equal(a.alpha(ox+x,oy+y),0,path+' sprite '+index+' corner');
   assert.ok(a.alpha(ox+20,oy+30)>200,path+' sprite '+index+' body');
  }
 }
});

test('new atlases draw right cells with model-specific dimensions',()=>{
 class MockImage{
  complete=true;naturalWidth=160;naturalHeight=240;width=160;height=240;
  set src(v){this._src=v;}
 }
 const oldImage=globalThis.Image;
 try{
  globalThis.Image=MockImage;loadCarSprites();
  const calls=[],ctx={
   save(){},restore(){},translate(){},rotate(v){calls.push(['rotate',v]);},
   drawImage(...args){calls.push(['draw',...args]);},
   strokeRect(){},set strokeStyle(v){},set lineWidth(v){},set imageSmoothingEnabled(v){}
  };
  const dimensions={};
  for(const [model,meta] of Object.entries(EXTRA_CAR_VARIANTS)){
   assert.equal(carSpriteReady(model),true,model);
   calls.length=0;assert.equal(drawCarSprite(ctx,12,15,Math.PI/4,model),true);
   const draw=calls.find(x=>x[0]==='draw');assert.equal(draw.length,10);
   assert.equal(draw[2],meta.index%4*40);assert.equal(draw[3],Math.floor(meta.index/4)*60);
   assert.equal(draw[4],40);assert.equal(draw[5],60);
   assert.ok(Math.abs(calls[0][1]-3*Math.PI/4)<1e-9);
   dimensions[meta.model]=[draw[8],draw[9]];
  }
  assert.ok(dimensions['smart-fortwo-2007'][1]<dimensions['fiat-uno-1983'][1]);
  assert.ok(dimensions['seicento-1998'][1]<dimensions['fiat-500-2007'][1]);
  assert.equal(carSpriteReady('panda-modern-white'),true);
 }finally{
  if(oldImage===undefined)delete globalThis.Image;else globalThis.Image=oldImage;
 }
});

test('AI and parked traffic use new variants without replacing starter Panda',async()=>{
 const game=await readFile(new URL('./game.mjs',import.meta.url),'utf8');
 const page=await readFile(new URL('./index.html',import.meta.url),'utf8');
 assert.ok(game.includes('CAR_TRAFFIC_SPRITE_IDS[(k*7)%CAR_TRAFFIC_SPRITE_IDS.length]'));
 assert.ok(game.includes('CAR_TRAFFIC_SPRITE_IDS[(i*7)%CAR_TRAFFIC_SPRITE_IDS.length]'));
 assert.ok(game.includes("model:'panda-modern-white'"));
 assert.ok(game.includes('car-sprites.mjs?v=106'));
 assert.ok(page.includes('game.mjs?v=126'));
});
