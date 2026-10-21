import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {inflateSync} from 'node:zlib';
import {IDLE_POSE_SHEETS,idlePoseSourceForKind,idlePoseRow} from './pose-pedoni.mjs';
import {PEDESTRIAN_SHEETS,PEDESTRIAN_KIND_COUNT} from './extra-pedestrian-sprites.mjs';
import {createIdlePeople} from './npc-idle.mjs';

function png(buffer){
 assert.equal(buffer.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
 const width=buffer.readUInt32BE(16),height=buffer.readUInt32BE(20),type=buffer[25];
 assert.equal(buffer[24],8);assert.ok(type===3||type===6);
 let palette,alpha,blocks=[];
 for(let i=8;i<buffer.length;){const n=buffer.readUInt32BE(i),tag=buffer.toString('ascii',i+4,i+8);
  if(tag==='PLTE')palette=buffer.subarray(i+8,i+8+n);
  if(tag==='tRNS')alpha=buffer.subarray(i+8,i+8+n);
  if(tag==='IDAT')blocks.push(buffer.subarray(i+8,i+8+n));
  i+=12+n;if(tag==='IEND')break;}
 const raw=inflateSync(Buffer.concat(blocks)),channels=type===6?4:1,stride=width*channels;
 const data=Buffer.alloc(width*height*4),prior=Buffer.alloc(stride);let pos=0;
 for(let y=0;y<height;y++){
  const filter=raw[pos++],row=Buffer.from(raw.subarray(pos,pos+stride));pos+=stride;
  for(let x=0;x<stride;x++){
   const a=x>=channels?row[x-channels]:0,b=prior[x],c=x>=channels?prior[x-channels]:0;
   if(filter===1)row[x]=(row[x]+a)&255;
   else if(filter===2)row[x]=(row[x]+b)&255;
   else if(filter===3)row[x]=(row[x]+((a+b)>>1))&255;
   else if(filter===4){const p=a+b-c,da=Math.abs(p-a),db=Math.abs(p-b),dc=Math.abs(p-c);
    row[x]=(row[x]+(da<=db&&da<=dc?a:db<=dc?b:c))&255;}
   else assert.equal(filter,0);
  }
  for(let x=0;x<width;x++){
   const o=(y*width+x)*4,j=x*channels;
   if(type===6)row.copy(data,o,j,j+4);
   else{const k=row[j];data[o]=palette[k*3];data[o+1]=palette[k*3+1];data[o+2]=palette[k*3+2];data[o+3]=k<(alpha?.length||0)?alpha[k]:255;}
  }
  row.copy(prior);
 }
 return {width,height,data};
}
const base=id=>new URL(`./assets/people/${id==='madre'?'pedoni':'pedoni-'+id}-4x4frames-24x40-rgba.png`,import.meta.url);
const pose=id=>new URL(`./assets/people/pose-${id}.png`,import.meta.url);
const pixel=(im,x,y)=>im.data.subarray((y*im.width+x)*4,(y*im.width+x)*4+4);

test('34 fogli pose: misure, alpha, quattro pose distinte, peso complessivo sotto 1 MB',async()=>{
 assert.equal(IDLE_POSE_SHEETS.length,34);
 let total=0;
 for(const id of IDLE_POSE_SHEETS){
  const [out,src]=await Promise.all([readFile(pose(id)).then(png),readFile(base(id)).then(png)]);
  total+=(await stat(pose(id))).size;
  assert.deepEqual([out.width,out.height],[96,160],id);
  assert.deepEqual([src.width,src.height],[384,160],id);
  for(let person=0;person<4;person++)for(let row=0;row<4;row++){
   let opaque=0,diff=0;
   for(let y=0;y<40;y++)for(let x=0;x<24;x++){
    const a=pixel(out,person*24+x,row*40+y),b=pixel(src,person*96+x,(row===3?80:40)+y);
    if(a[3]){opaque++;assert.ok(x>0&&x<23&&y>0&&y<39,`${id} ${person},${row}: bordo`);}
    if(!a.equals(b))diff++;
   }
   assert.ok(opaque>20,`${id} ${person},${row}: vuota`);
   assert.ok(diff>5,`${id} ${person},${row}: identica al frame fermo`);
  }
  for(let person=0;person<4;person++){
   let diff=0;
   for(let y=0;y<40;y++)for(let x=0;x<24;x++)if(!pixel(out,person*24+x,40+y).equals(pixel(out,person*24+x,80+y)))diff++;
   assert.ok(diff>0,`${id} ${person}: gesto fermo`);
  }
 }
 assert.ok(total<1_000_000,`${total} byte`);
});

test('tutti i kind mantengono la propria identità e le attività usano le pose giuste',()=>{
 assert.equal(PEDESTRIAN_KIND_COUNT,135);
 assert.deepEqual(IDLE_POSE_SHEETS.slice(2),PEDESTRIAN_SHEETS.map(s=>s.id));
 assert.deepEqual(idlePoseSourceForKind(0),{id:'madre',identity:0});
 assert.deepEqual(idlePoseSourceForKind(6),{id:'secondo-lotto',identity:3});
 for(let kind=0;kind<PEDESTRIAN_KIND_COUNT;kind++){
  const map=idlePoseSourceForKind(kind);assert.ok(map&&IDLE_POSE_SHEETS.includes(map.id)&&map.identity>=0&&map.identity<4);
 }
 assert.equal(idlePoseSourceForKind(135),null);
 assert.equal(idlePoseRow({activity:'bench',seed:1},2),0);
 assert.equal(idlePoseRow({activity:'chat',pose:'leaning',seed:1},2),3);
 const a={activity:'chat',pose:'relaxed',seed:2};
 assert.notEqual(idlePoseRow(a,0),idlePoseRow(a,1.6));
});

test('generator, renderer, NOVITÀ e registri collegati',async()=>{
 const names=['assets/people/sources/pose-genera.py','npc-idle.mjs','game.mjs','index.html','novita.mjs',
  'WORK_LOG.md','VISUAL_PROGRESS.md','PIXEL_ART_MODUS.md','NOVITA_DA_APPROVARE.md'];
 const [generator,idle,game,html,novita,...docs]=await Promise.all(names.map(f=>readFile(new URL(f,import.meta.url),'utf8')));
 assert.match(generator,/def seated/);assert.match(generator,/def relaxed/);assert.match(generator,/def leaning/);
 assert.match(idle,/drawIdlePose/);assert.match(idle,/pose:activity==='bench'\?'seated'/);
 assert.match(game,/drawIdlePeople\(c,state\.idle/);assert.match(game,/loadIdlePoseSheets\(\)/);
 assert.match(game,/npc-idle\.mjs\?v=003/);assert.match(game,/novita\.mjs\?v=020/);
 assert.match(html,/game\.mjs\?v=220/);assert.match(novita,/id:'pose-fermi'/);
 for(const doc of docs)assert.match(doc,/pose ferme/i);
});
