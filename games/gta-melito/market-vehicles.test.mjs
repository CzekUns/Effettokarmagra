import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {inflateSync} from 'node:zlib';
import {
 MARKET_ATLAS_PATH,MARKET_ATLAS_CELL,MARKET_VARIANT_IDS,MARKET_VARIANTS,
 CAR_TRAFFIC_SPRITE_IDS,CAR_PARKED_SPRITE_IDS,
 loadCarSprites,carSpriteReady,drawCarSprite
} from './car-sprites.mjs';

function decodeAlpha(bytes){
 assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
 const w=bytes.readUInt32BE(16),h=bytes.readUInt32BE(20);
 assert.equal(bytes[25],3,'PNG must use indexed color');
 let at=8,table,blocks=[];
 while(at<bytes.length){
  const length=bytes.readUInt32BE(at),type=bytes.toString('ascii',at+4,at+8),b=bytes.subarray(at+8,at+8+length);
  at+=12+length;
  if(type==='tRNS')table=b;
  if(type==='IDAT')blocks.push(b);
  if(type==='IEND')break;
 }
 assert.ok(table,'actual PNG alpha table required');
 const raw=inflateSync(Buffer.concat(blocks)),previous=Buffer.alloc(w),indexes=Buffer.alloc(w*h);
 let cursor=0;
 for(let y=0;y<h;y++){
  const filter=raw[cursor++],row=Buffer.from(raw.subarray(cursor,cursor+w));cursor+=w;
  for(let x=0;x<w;x++){
   const left=x?row[x-1]:0,up=previous[x],diagonal=x?previous[x-1]:0;
   if(filter===1)row[x]=(row[x]+left)&255;
   else if(filter===2)row[x]=(row[x]+up)&255;
   else if(filter===3)row[x]=(row[x]+Math.floor((left+up)/2))&255;
   else if(filter===4){
    const p=left+up-diagonal,pa=Math.abs(p-left),pb=Math.abs(p-up),pc=Math.abs(p-diagonal);
    row[x]=(row[x]+(pa<=pb&&pa<=pc?left:pb<=pc?up:diagonal))&255;
   }else assert.equal(filter,0,'supported PNG scanline filter');
  }
  row.copy(indexes,y*w);row.copy(previous);
 }
 return {w,h,alpha:(x,y)=>table[indexes[y*w+x]]??255};
}
test('vehicle sheet has 16 variants, eight Ape and eight food trucks',()=>{
 assert.deepEqual(MARKET_ATLAS_CELL,{width:56,height:64,columns:4,rows:4});
 assert.equal(MARKET_VARIANT_IDS.length,16);
 assert.deepEqual(MARKET_VARIANT_IDS.map(id=>MARKET_VARIANTS[id].index),Array.from({length:16},(_,i)=>i));
 assert.equal(MARKET_VARIANT_IDS.filter(id=>MARKET_VARIANTS[id].model==='ape-mercato').length,8);
 assert.equal(MARKET_VARIANT_IDS.filter(id=>MARKET_VARIANTS[id].model==='furgone-ambulante').length,8);
 assert.deepEqual(MARKET_VARIANT_IDS.slice(0,4),['ape-azzurra-vuota','ape-azzurra-ferro','ape-azzurra-ortofrutta','ape-azzurra-pesce']);
 assert.equal(MARKET_VARIANT_IDS[9],'food-pere-e-musso');
 assert.equal(MARKET_VARIANT_IDS[15],'food-misto');
 assert.equal(CAR_TRAFFIC_SPRITE_IDS.length,50,'vehicles with extended awnings are parked only');
 assert.deepEqual(CAR_PARKED_SPRITE_IDS.slice(50),MARKET_VARIANT_IDS);
 assert.equal(new Set(CAR_PARKED_SPRITE_IDS).size,66);
});
test('all 16 PNG cells: no opaque rectangular background, actual visible vehicle',async()=>{
 const file=await readFile(new URL(MARKET_ATLAS_PATH,import.meta.url));
 assert.ok(file.length<30000,'compact PNG for smartphone');
 const data=decodeAlpha(file);
 assert.deepEqual([data.w,data.h],[224,256]);
 for(let i=0;i<16;i++){
  const x=(i%4)*56,y=Math.floor(i/4)*64;
  for(const [dx,dy] of [[0,0],[55,0],[0,63],[55,63]])
   assert.equal(data.alpha(x+dx,y+dy),0,'sprite '+i+' corner is transparent');
  assert.ok(data.alpha(x+28,y+32)>0,'sprite '+i+' body is opaque');
 }
});
test('game draws each sprite from the correct source crop and follows GTA heading',()=>{
 const original=globalThis.Image;
 class Img {
  complete=true; naturalWidth=0; naturalHeight=0;
  set src(v){this._src=v; if(v.includes('ape-food-16-rgba.png')){this.naturalWidth=224;this.naturalHeight=256;}}
 }
 try{
  globalThis.Image=Img;loadCarSprites();
  const calls=[],ctx={save(){},restore(){},translate(){},rotate(v){calls.push(['rotate',v]);},
   drawImage(...a){calls.push(['img',...a]);},strokeRect(){},set imageSmoothingEnabled(v){}};
  for(const [id,meta] of Object.entries(MARKET_VARIANTS)){
   assert.equal(carSpriteReady(id),true,id);
   calls.length=0;assert.equal(drawCarSprite(ctx,2,3,0,id),true,id);
   const args=calls.find(a=>a[0]==='img');
   assert.equal(calls[0][1],Math.PI/2);
   assert.equal(args[2],meta.index%4*56);
   assert.equal(args[3],Math.floor(meta.index/4)*64);
   assert.equal(args[4],56);assert.equal(args[5],64);
   assert.ok(args[8]>0&&args[9]>0);
  }
 }finally{if(original===undefined)delete globalThis.Image;else globalThis.Image=original;}
});
test('food truck awnings stay parked while compact Ape models join moving traffic',async()=>{
 const [game,page]=await Promise.all([
  readFile(new URL('./game.mjs',import.meta.url),'utf8'),
  readFile(new URL('./index.html',import.meta.url),'utf8')]);
 assert.ok(game.includes('CAR_PARKED_SPRITE_IDS[(k*7)%CAR_PARKED_SPRITE_IDS.length]'));
 assert.ok(game.includes('CAR_TRAFFIC_SPRITE_IDS[(i*7)%CAR_TRAFFIC_SPRITE_IDS.length]'));
 assert.ok(game.includes("car-sprites.mjs?v=108"));
 assert.ok(game.includes('trafficApeModel(i)'));
 assert.ok(!game.includes("v.model='food-zeppole-panzerotti'"));
 assert.ok(page.includes('game.mjs?v=154'));
});
