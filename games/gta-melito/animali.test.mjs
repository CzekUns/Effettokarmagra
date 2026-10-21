import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {inflateSync} from 'node:zlib';
import {createAnimals,stepAnimals,ANIMAL_LIMITS} from './animali.mjs';
import {NOVITA,novitaTarget} from './novita.mjs';

function rgbaPng(buffer){
 assert.equal(buffer.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
 const w=buffer.readUInt32BE(16),h=buffer.readUInt32BE(20),type=buffer[25];assert.equal(type,6);
 const chunks=[];for(let i=8;i<buffer.length;){const n=buffer.readUInt32BE(i),tag=buffer.toString('ascii',i+4,i+8);
  if(tag==='IDAT')chunks.push(buffer.subarray(i+8,i+8+n));i+=n+12;if(tag==='IEND')break;}
 const raw=inflateSync(Buffer.concat(chunks)),stride=w*4,out=Buffer.alloc(w*h*4),prev=Buffer.alloc(stride);let pos=0;
 for(let y=0;y<h;y++){
  const filter=raw[pos++],row=Buffer.from(raw.subarray(pos,pos+stride));pos+=stride;
  for(let x=0;x<stride;x++){
   const a=x>=4?row[x-4]:0,b=prev[x],c=x>=4?prev[x-4]:0;
   if(filter===1)row[x]=(row[x]+a)&255;
   else if(filter===2)row[x]=(row[x]+b)&255;
   else if(filter===3)row[x]=(row[x]+((a+b)>>1))&255;
   else if(filter===4){const p=a+b-c,da=Math.abs(p-a),db=Math.abs(p-b),dc=Math.abs(p-c);
    row[x]=(row[x]+(da<=db&&da<=dc?a:db<=dc?b:c))&255;}
   else assert.equal(filter,0);
  }
  row.copy(out,y*stride);row.copy(prev);
 }
 return {w,h,pixels:out};
}
const animalFile=name=>new URL('./assets/animals/'+name,import.meta.url);

test('fogli 8×8 e 12×8 con alpha: ogni frame visibile e angoli trasparenti',async()=>{
 for(const [name,w,h,cw,ch,cols,rows] of [['piccioni-8x8.png',32,16,8,8,4,2],['gatti-12x8.png',36,24,12,8,3,3]]){
  const image=rgbaPng(await readFile(animalFile(name)));assert.deepEqual([image.w,image.h],[w,h]);
  for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
   let opaque=0,clear=0;
   for(let y=0;y<ch;y++)for(let x=0;x<cw;x++){
    const a=image.pixels[((row*ch+y)*w+col*cw+x)*4+3];if(a)opaque++;else clear++;
    if((x===0||x===cw-1)&&(y===0||y===ch-1))assert.equal(a,0,`${name}: angolo ${col},${row}`);
   }
   assert.ok(opaque>=6&&clear>=6,`${name}: cella ${col},${row}`);
  }
 }
});

const roads=[{id:1,n:'Piazza Santo Stefano',p:[20,20,40,20,60,20]},
 {id:2,n:'Piazza Immacolata',p:[100,20,120,20,140,20]}];
const map={buildings:[{id:7,usage:'place_of_worship',p:[20,80,30,80,30,90,20,90]}]};
const enclosures={list:[{id:'villa-comunale',center:{x:110,y:90},loop:[[90,70],[130,70],[130,110],[90,110]]}]};
const market={stalls:[{x:180,y:80}]};
const parked=Array.from({length:16},(_,i)=>({x:15+i*12,y:145,vehicleType:'car'}));
const onRoad=(x,y)=>x>205,canStand=(x,y)=>x>=0&&x<205&&y>=0&&y<180;
const make=()=>createAnimals({map,roads,enclosures,market,parked,canStand,onRoad,doors:[{x:200,y:175}]});

test('stormi e gatti da luoghi esistenti: densità moderata e tutti fuori strada',()=>{
 const world=make();assert.ok(world.flocks.length>=3&&world.cats.length>=1);
 assert.ok(world.pigeons.length<=ANIMAL_LIMITS.pigeons&&world.cats.length<=ANIMAL_LIMITS.cats);
 for(const p of [...world.pigeons,...world.cats])assert.ok(canStand(p.x,p.y)&&!onRoad(p.x,p.y));
 assert.ok(world.flocks.some(f=>f.id.startsWith('piazza')));
 assert.ok(world.flocks.some(f=>f.id==='villa'));
});

test('piccioni in volo a 2 m da giocatore o auto: atterrano 10–15 m più in là',()=>{
 const world=make(),bird=world.pigeons[0],start={x:bird.x,y:bird.y};
 stepAnimals(world,.05,{player:{x:bird.x+1,y:bird.y},canStand,onRoad});
 assert.equal(bird.state,'flight');assert.ok(bird.target);
 const target=bird.target;assert.ok(Math.hypot(target.x-start.x,target.y-start.y)>=9.9);
 for(let i=0;i<20;i++)stepAnimals(world,.1,{canStand,onRoad});
 assert.equal(bird.state,'ground');assert.ok(canStand(bird.x,bird.y)&&!onRoad(bird.x,bird.y));
 const other=world.pigeons[1];stepAnimals(world,.05,{vehicles:[{x:other.x+.5,y:other.y,speed:5}],canStand,onRoad});
 assert.equal(other.state,'flight');
});

test('gatto si allontana con calma a 1,5 m e resta sul percorso pedonale',()=>{
 const world=make(),cat=world.cats[0],from={x:cat.x,y:cat.y};
 stepAnimals(world,.05,{player:{x:cat.x+1,y:cat.y},canStand,onRoad});
 assert.equal(cat.state,'walk');
 for(let i=0;i<10;i++)stepAnimals(world,.1,{canStand,onRoad});
 assert.ok(Math.hypot(cat.x-from.x,cat.y-from.y)>.5);
 assert.ok(canStand(cat.x,cat.y)&&!onRoad(cat.x,cat.y));
});

test('integrazione, NOVITÀ, versioni e registri',async()=>{
 const files=['game.mjs','index.html','novita.mjs','WORK_LOG.md','VISUAL_PROGRESS.md','PIXEL_ART_MODUS.md','NOVITA_DA_APPROVARE.md'];
 const [game,html,novita,...docs]=await Promise.all(files.map(f=>readFile(new URL(f,import.meta.url),'utf8')));
 assert.match(game,/animali\.mjs\?v=001/);assert.match(game,/createNeighbourhoodAnimals\(\)/);
 assert.match(game,/stepAnimals\(state\.animals/);assert.match(game,/drawAnimals\(c,state\.animals/);
 assert.doesNotMatch(game,/makeCollisionIndex\([^\n]*state\.animals/);
 assert.match(game,/novita\.mjs\?v=020/);assert.match(html,/game\.mjs\?v=220/);
 assert.match(novita,/id:'animali-di-strada'/);
 const entry=NOVITA.find(e=>e.id==='animali-di-strada');
 assert.deepEqual(novitaTarget(entry,{spawn:[0,0],animals:{flocks:[{center:{x:5,y:6}}]}}),{x:5,y:6});
 for(const doc of docs)assert.match(doc,/animali di strada/i);
});
