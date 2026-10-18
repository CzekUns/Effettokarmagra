import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {inflateSync} from 'node:zlib';
import {CAR_ATLAS_PATH,CAR_ATLAS_CELL,CAR_ATLAS_VARIANTS,CAR_ATLAS_VARIANT_IDS,loadCarSprites,carSpriteReady,drawCarSprite} from './car-sprites.mjs';

test('Punto 188 and Ypsilon 2003 provide 8 compact distinct colour sprites each',()=>{
 assert.equal(CAR_ATLAS_VARIANT_IDS.length,16);
 assert.equal(new Set(CAR_ATLAS_VARIANT_IDS).size,16);
 assert.equal(CAR_ATLAS_VARIANTS['punto-188-red'].index,1);
 assert.equal(CAR_ATLAS_VARIANTS['punto-188-champagne'].index,7);
 assert.equal(CAR_ATLAS_VARIANTS['ypsilon-2003-white'].index,8);
 assert.equal(CAR_ATLAS_VARIANTS['ypsilon-2003-burgundy'].index,14);
 assert.deepEqual(CAR_ATLAS_CELL,{width:40,height:60,columns:4,rows:4});
});

function decodeIndexedAtlas(buffer){
 assert.equal(buffer.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
 const w=buffer.readUInt32BE(16),h=buffer.readUInt32BE(20);
 assert.equal(buffer[24],8,'8 bit indexed colour');
 assert.equal(buffer[25],3,'indexed PNG');
 let p=8,alpha=null;const compressed=[];
 while(p<buffer.length){
  const n=buffer.readUInt32BE(p),tag=buffer.toString('ascii',p+4,p+8),chunk=buffer.subarray(p+8,p+8+n);p+=n+12;
  if(tag==='tRNS')alpha=chunk;
  if(tag==='IDAT')compressed.push(chunk);
  if(tag==='IEND')break;
 }
 assert.ok(alpha,'PNG must carry real per-colour transparency');
 const raw=inflateSync(Buffer.concat(compressed));
 const px=Buffer.alloc(w*h),prev=Buffer.alloc(w);let cursor=0;
 for(let y=0;y<h;y++){
  const filter=raw[cursor++];
  const row=Buffer.from(raw.subarray(cursor,cursor+w));cursor+=w;
  for(let x=0;x<w;x++){
   const a=x?row[x-1]:0,b=prev[x],c=x?prev[x-1]:0;
   if(filter===1)row[x]=(row[x]+a)&255;
   else if(filter===2)row[x]=(row[x]+b)&255;
   else if(filter===3)row[x]=(row[x]+Math.floor((a+b)/2))&255;
   else if(filter===4){const t=a+b-c,da=Math.abs(t-a),db=Math.abs(t-b),dc=Math.abs(t-c);row[x]=(row[x]+(da<=db&&da<=dc?a:db<=dc?b:c))&255;}
   else assert.equal(filter,0,'unknown PNG filter');
  }
  row.copy(px,y*w);row.copy(prev);
 }
 return {w,h,at(x,y){return alpha[px[y*w+x]]??255;}};
}

test('new 16-colour PNG atlas is compact and has no black/opaque matte',async()=>{
 assert.match(CAR_ATLAS_PATH,/16colors-rgba\.png$/);
 const png=await readFile(new URL(CAR_ATLAS_PATH,import.meta.url));
 const a=decodeIndexedAtlas(png);
 assert.equal(a.w,160);assert.equal(a.h,240);
 assert.ok(png.length<18000,'small mobile asset');
 for(let i=0;i<16;i++){
  const x=(i%4)*40,y=Math.floor(i/4)*60;
  for(const [dx,dy] of [[0,0],[39,0],[0,59],[39,59]])assert.equal(a.at(x+dx,y+dy),0,'transparent corner, car '+i);
  assert.ok(a.at(x+20,y+30)>220,'opaque body center, car '+i);
 }
});

test('all 16 atlas cells draw with correct crop and top-down forward rotation',()=>{
 class MockImage{
  width=160;height=240;complete=true;naturalWidth=160;naturalHeight=240;
  set src(value){this._src=value;}
 }
 const prevImage=globalThis.Image;
 try{
  globalThis.Image=MockImage;loadCarSprites();
  const calls=[];
  const ctx={save(){},restore(){},translate(x,y){calls.push(['position',x,y]);},
   rotate(a){calls.push(['rotation',a]);},drawImage(...args){calls.push(['image',...args]);},
   strokeRect(){},set strokeStyle(v){},set lineWidth(v){},set imageSmoothingEnabled(v){}
  };
  for(const model of CAR_ATLAS_VARIANT_IDS){
   assert.equal(carSpriteReady(model),true,model);calls.length=0;
   assert.equal(drawCarSprite(ctx,11,17,Math.PI/4,model),true);
   assert.deepEqual(calls[0],['position',11,17]);
   assert.ok(Math.abs(calls[1][1]-3*Math.PI/4)<1e-9);
   const i=CAR_ATLAS_VARIANTS[model].index,cut=calls.find(x=>x[0]==='image');
   assert.equal(cut.length,10);
   assert.equal(cut[2],(i%4)*40);assert.equal(cut[3],Math.floor(i/4)*60);
   assert.equal(cut[4],40);assert.equal(cut[5],60);
   assert.ok(cut[8]>0&&cut[9]>0);
  }
 }finally{if(prevImage===undefined)delete globalThis.Image;else globalThis.Image=prevImage;}
});

test('Punto/Ypsilon remain in AI traffic and starter Panda untouched',async()=>{
 const game=await readFile(new URL('./game.mjs',import.meta.url),'utf8');
 const page=await readFile(new URL('./index.html',import.meta.url),'utf8');
 const spriteCode=await readFile(new URL('./car-sprites.mjs',import.meta.url),'utf8');
 assert.match(game,/CAR_TRAFFIC_SPRITE_IDS/);
 assert.ok(game.includes('drawCar(x,y,a,ai.kind,false,ai.model)'));
 assert.ok(game.includes('drawCar(v.x,v.y,v.a,v.type,i===p.car,v.model)'));
 assert.ok(game.includes("model:'panda-modern-white'"));
 assert.ok(page.includes('game.mjs?v=121'));
 assert.ok(game.includes('car-sprites.mjs?v=106'));
 assert.doesNotMatch(spriteCode,/restoreVehicleAtlasTransparency/);
});
