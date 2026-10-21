import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {inflateSync} from 'node:zlib';
import {PEDESTRIAN_SHEETS,PEDESTRIAN_KIND_COUNT,PEDESTRIAN_VARIANT_FIRST_KIND,
 pedestrianSheet,pedestrianSheetForKind} from './extra-pedestrian-sprites.mjs';
import {NOVITA,novitaTarget} from './novita.mjs';

const SOURCES=['madre','lotto2','lotto10','lotto11','lotto12','lotto13','lotto14','lotto17','lotto18','lotto19','lotto20'];
const SKIN_COLORS=new Set(['226,152,100','163,112,79','211,145,101','229,175,127','174,111,79','191,128,88','197,145,115','183,123,88','174,116,85','222,159,113','141,96,76','130,82,58','122,76,56','159,106,73']);
const path=id=>new URL(`./assets/people/pedoni-${id}-4x4frames-24x40-rgba.png`,import.meta.url);
const basePath=id=>id==='madre'?new URL('./assets/people/pedoni-4x4frames-24x40-rgba.png',import.meta.url):path(id);
function decodePNG(bytes){
 assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
 const w=bytes.readUInt32BE(16),h=bytes.readUInt32BE(20);
 assert.equal(bytes[24],8);const color=bytes[25];assert.ok(color===3||color===6);assert.equal(bytes[28],0);
 const chunks=[];let palette=null,transparency=null;
 for(let at=8;at<bytes.length;){const n=bytes.readUInt32BE(at),tag=bytes.toString('ascii',at+4,at+8);
  if(tag==='IDAT')chunks.push(bytes.subarray(at+8,at+8+n));
  if(tag==='PLTE')palette=bytes.subarray(at+8,at+8+n);
  if(tag==='tRNS')transparency=bytes.subarray(at+8,at+8+n);
  at+=n+12;if(tag==='IEND')break;}
 const raw=inflateSync(Buffer.concat(chunks)),channels=color===6?4:1,stride=w*channels,reconstructed=Buffer.alloc(h*stride);let cursor=0;
 for(let y=0;y<h;y++){
  const filter=raw[cursor++],row=Buffer.from(raw.subarray(cursor,cursor+stride));cursor+=stride;
  const previous=y?reconstructed.subarray((y-1)*stride,y*stride):Buffer.alloc(stride);
  for(let x=0;x<stride;x++){
   const left=x>=channels?row[x-channels]:0,up=previous[x],corner=x>=channels?previous[x-channels]:0;
   if(filter===1)row[x]=(row[x]+left)&255;
   else if(filter===2)row[x]=(row[x]+up)&255;
   else if(filter===3)row[x]=(row[x]+((left+up)>>1))&255;
   else if(filter===4){const p=left+up-corner,a=Math.abs(p-left),b=Math.abs(p-up),c=Math.abs(p-corner);
    row[x]=(row[x]+(a<=b&&a<=c?left:b<=c?up:corner))&255;}
   else assert.equal(filter,0);
  }
  row.copy(reconstructed,y*stride);
 }
 if(color===6)return {w,h,data:reconstructed};
 const rgba=Buffer.alloc(w*h*4);
 for(let i=0;i<w*h;i++){
  const index=reconstructed[i],dest=i*4,entry=index*3;
  rgba[dest]=palette[entry];rgba[dest+1]=palette[entry+1];rgba[dest+2]=palette[entry+2];
  rgba[dest+3]=index<transparency.length?transparency[index]:255;
 }
 return {w,h,data:rgba};
}

test('22 PNG pronti: 384×160, alpha identico per 64 celle, colori diversi, totale sotto 1 MB',async()=>{
 let total=0;
 for(const source of SOURCES){
  const original=decodePNG(await readFile(basePath(source)));
  for(const variant of [1,2]){
   const id=`${source}-var${variant}`,file=path(id),info=await stat(file),image=decodePNG(await readFile(file));
   total+=info.size;
   assert.deepEqual([image.w,image.h],[384,160],id);
   assert.deepEqual([original.w,original.h],[384,160],source);
   const changed=Array(64).fill(0);
   for(let y=0;y<160;y++)for(let x=0;x<384;x++){
    const offset=(y*384+x)*4,a=image.data[offset+3],before=original.data[offset+3];
    assert.equal(a,before,`${id}: alpha ${x},${y}`);
    if(a){
     if((x%24===0)||(x%24===23)||(y%40===0)||(y%40===39))assert.fail(`${id}: bordo opaco ${x},${y}`);
     if(SKIN_COLORS.has([...original.data.subarray(offset,offset+3)].join(',')))
      assert.deepEqual(image.data.subarray(offset,offset+3),original.data.subarray(offset,offset+3),`${id}: carnagione ${x},${y}`);
     if(image.data[offset]!==original.data[offset]||image.data[offset+1]!==original.data[offset+1]||image.data[offset+2]!==original.data[offset+2])
      changed[Math.floor(y/40)*16+Math.floor(x/24)]++;
    }
   }
   assert.ok(changed.every(n=>n>5),`${id}: tutte le celle cambiano colore (${changed})`);
  }
 }
 assert.ok(total<1_000_000,`nuovi PNG: ${total} byte`);
});

test('kind originali 0–46 invariati; 88 varianti nuove in sequenza fino a 134',()=>{
 assert.equal(PEDESTRIAN_VARIANT_FIRST_KIND,47);
 assert.equal(PEDESTRIAN_KIND_COUNT,135);
 assert.deepEqual(SOURCES.flatMap(source=>[1,2].map(variant=>`${source}-var${variant}`)).sort(),
  PEDESTRIAN_SHEETS.filter(s=>s.startKind>=47).map(s=>s.id).sort());
 for(const source of SOURCES){
  for(const variant of [1,2]){
   const sheet=pedestrianSheet(`${source}-var${variant}`);
   assert.equal(sheet.identities.length,4);assert.equal(sheet.path,`./assets/people/pedoni-${source}-var${variant}-4x4frames-24x40-rgba.png`);
   for(let k=sheet.startKind;k<sheet.startKind+4;k++)assert.equal(pedestrianSheetForKind(k),sheet);
  }
 }
 assert.deepEqual(['lotto2','lotto10','lotto11','lotto12','lotto13','lotto14','lotto17','lotto18','lotto19','lotto20'].map(id=>pedestrianSheet(id).startKind),[7,11,15,19,23,27,31,35,39,43]);
 for(const k of [135,-1,1.5,'47'])assert.equal(pedestrianSheetForKind(k),null);
});

test('tutti i generatori e i percorsi sono collegati a rotazione, NOVITÀ e cache',async()=>{
 const [game,html,novita,roads,residents,market,work,visual,approve]=await Promise.all([
  'game.mjs','index.html','novita.mjs','roads.mjs','resident-routines.mjs','market.mjs',
  'WORK_LOG.md','VISUAL_PROGRESS.md','NOVITA_DA_APPROVARE.md'
 ].map(name=>readFile(new URL(name,import.meta.url),'utf8')));
 assert.match(game,/extra-pedestrian-sprites\.mjs\?v=007/);
 assert.match(game,/novita\.mjs\?v=017/);
 assert.match(html,/game\.mjs\?v=215/);
 assert.match(roads,/kind:kind==='walk'\?i%PEDESTRIAN_KIND_COUNT:i%7/);
 assert.match(residents,/kind:kindIndex%PEDESTRIAN_KIND_COUNT/);
 assert.match(market,/kind:hash\(seed\)%PEDESTRIAN_KIND_COUNT/);
 assert.ok(NOVITA.some(e=>e.id==='varianti-pedoni'));
 assert.match(novita,/id:'varianti-pedoni'/);
 assert.match(work,/varianti di colore dei pedoni/i);
 assert.match(visual,/varianti di colore dei pedoni/i);
 assert.match(approve,/`varianti-pedoni`/);
 const entry=NOVITA.find(e=>e.id==='varianti-pedoni');
 assert.deepEqual(novitaTarget(entry,{spawn:[0,0],people:[{kind:12,x:1,y:1},{kind:47,x:8,y:9}],roads:[]}),{x:8,y:9});
});
