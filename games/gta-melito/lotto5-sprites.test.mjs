/* Lotto 5 (2026-10-21, Claude + CODEX-GH): Fiat Tipo hatchback 2016 and Fiat 500L 2012 in the traffic.
 * Atlas drawn by code by CODEX-GH (assets/vehicles/sources/tipo-500l-16-genera.py); PROVISIONAL art. */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {inflateSync} from 'node:zlib';
import {EXTRA_CAR_ATLASES,EXTRA_CAR_VARIANTS,CAR_TRAFFIC_SPRITE_IDS,CAR_TRAFFIC_STRIDE,CAR_PARKED_SPRITE_IDS,CAR_ATLAS_CELL,carDrawSize} from './car-sprites.mjs';
import {handlingProfile} from './vehicle-handling.mjs';
import {vehicleShape} from './traffic-collision.mjs';
import {NOVITA,novitaAvailable} from './novita.mjs';

const ATLAS='@tipo-500l-atlas';
const TIPO=['white','silver','graphite','sand','bronze','red','blue','black'];
const L500=['white','red','silver','graphite','black','blue','yellow','green'];
const IDS=[...TIPO.map(c=>'tipo-hatchback-2016-'+c),...L500.map(c=>'fiat-500l-2012-'+c)];

// Minimal reader of a non-interlaced 8-bit RGBA PNG (colour type 6), enough for the alpha channel.
function decodeRGBA(bytes){
 assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
 const w=bytes.readUInt32BE(16),h=bytes.readUInt32BE(20);
 assert.equal(bytes[24],8,'8-bit samples');assert.equal(bytes[25],6,'true RGBA PNG');assert.equal(bytes[28],0,'not interlaced');
 const idats=[];let at=8;
 while(at<bytes.length){
  const len=bytes.readUInt32BE(at),tag=bytes.toString('ascii',at+4,at+8);
  if(tag==='IDAT')idats.push(bytes.subarray(at+8,at+8+len));
  at+=12+len;if(tag==='IEND')break;
 }
 const raw=inflateSync(Buffer.concat(idats)),stride=w*4,px=Buffer.alloc(h*stride),prev=Buffer.alloc(stride);
 let c=0;
 for(let y=0;y<h;y++){
  const f=raw[c++],row=Buffer.from(raw.subarray(c,c+stride));c+=stride;
  for(let x=0;x<stride;x++){
   const a=x>=4?row[x-4]:0,b=prev[x],d=x>=4?prev[x-4]:0;
   if(f===1)row[x]=(row[x]+a)&255;else if(f===2)row[x]=(row[x]+b)&255;
   else if(f===3)row[x]=(row[x]+Math.floor((a+b)/2))&255;
   else if(f===4){const p=a+b-d,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-d);row[x]=(row[x]+(pa<=pb&&pa<=pc?a:pb<=pc?b:d))&255;}
   else assert.equal(f,0,'known filter');
  }
  row.copy(px,y*stride);row.copy(prev);
 }
 return {w,h,alpha:(x,y)=>px[y*stride+x*4+3]};
}

test('lotto 5: the atlas is a 160x240 RGBA PNG with 16 cells, transparent corners and solid bodies',async()=>{
 const path=EXTRA_CAR_ATLASES[ATLAS];
 assert.equal(path,'./assets/vehicles/tipo-500l-16-rgba.png');
 const bin=await readFile(new URL(path,import.meta.url));
 const png=decodeRGBA(bin);
 assert.equal(png.w,160);assert.equal(png.h,240);
 assert.ok(bin.length<18000,'compact for mobile');
 assert.deepEqual(CAR_ATLAS_CELL,{width:40,height:60,columns:4,rows:4});
 for(let i=0;i<16;i++){
  const ox=i%4*40,oy=Math.floor(i/4)*60;
  for(const [x,y] of [[0,0],[39,0],[0,59],[39,59],[1,1],[38,58]])assert.equal(png.alpha(ox+x,oy+y),0,'cell '+i+' corner '+x+','+y);
  // Bonnet, cabin and boot are all solid pixels down the middle of the car.
  for(const y of [12,30,48])assert.equal(png.alpha(ox+20,oy+y),255,'cell '+i+' body at y='+y);
  let opaque=0;for(let y=0;y<60;y++)for(let x=0;x<40;x++)if(png.alpha(ox+x,oy+y)===255)opaque++;
  assert.ok(opaque>900&&opaque<2000,'cell '+i+' has a car-sized body: '+opaque);
 }
 // The generator and CODEX-GH's notes travel with the atlas; neither is used by the game.
 for(const f of ['tipo-500l-16-genera.py','tipo-500l-16-NOTE.md'])
  assert.ok((await readFile(new URL('./assets/vehicles/sources/'+f,import.meta.url))).length>1000,f);
});

test('lotto 5: 16 variant ids, two models with eight colours each on the right cells',()=>{
 assert.equal(IDS.length,16);
 for(const id of IDS)assert.ok(EXTRA_CAR_VARIANTS[id],'variant '+id);
 TIPO.forEach((color,i)=>assert.deepEqual(EXTRA_CAR_VARIANTS['tipo-hatchback-2016-'+color],{index:i,model:'tipo-hatchback-2016',color,atlas:ATLAS}));
 L500.forEach((color,i)=>assert.deepEqual(EXTRA_CAR_VARIANTS['fiat-500l-2012-'+color],{index:8+i,model:'fiat-500l-2012',color,atlas:ATLAS}));
 assert.equal(Object.keys(EXTRA_CAR_VARIANTS).filter(id=>EXTRA_CAR_VARIANTS[id].atlas===ATLAS).length,16);
 // Draw sizes: a little longer (Tipo) / wider (500L) than the Punto 188, but prudent: never past
 // CODEX-GH's proposals ([5.88,9.91] and [5.84,9.41]) so they stay inside the lane.
 const tipo=carDrawSize('tipo-hatchback-2016-red'),l500=carDrawSize('fiat-500l-2012-yellow'),punto=carDrawSize('punto-188-red');
 assert.deepEqual(tipo,[5.5,9.2]);assert.deepEqual(l500,[5.55,9]);
 assert.ok(tipo[1]>punto[1]&&tipo[1]<9.91,'Tipo longer than the Punto 188, under the proposal');
 assert.ok(l500[0]>punto[0]&&l500[0]<5.84,'500L wider than the Punto 188, under the proposal');
 assert.ok(tipo[0]<=5.6&&l500[0]<=5.6,'both narrower than 5.6 world units');
 assert.ok(l500[1]<tipo[1],'500L shorter than the Tipo');
});

test('lotto 5: both models are in the AI traffic and in the parked cars, with their own driving profile',()=>{
 for(const id of IDS){
  assert.ok(CAR_TRAFFIC_SPRITE_IDS.includes(id),'traffic '+id);
  assert.ok(CAR_PARKED_SPRITE_IDS.includes(id),'parked '+id);
 }
 // The traffic picks ids with stride CAR_TRAFFIC_STRIDE (game.mjs): over a full cycle every new variant is spawned.
 const seen=new Set();for(let i=0;i<CAR_TRAFFIC_SPRITE_IDS.length;i++)seen.add(CAR_TRAFFIC_SPRITE_IDS[(i*CAR_TRAFFIC_STRIDE)%CAR_TRAFFIC_SPRITE_IDS.length]);
 for(const id of IDS)assert.ok(seen.has(id),'spawned '+id);
 const tipo=handlingProfile({model:'tipo-hatchback-2016-blue'}),l500=handlingProfile({model:'fiat-500l-2012-green'}),p188=handlingProfile({model:'punto-188-blue'});
 assert.equal(tipo.model,'tipo-hatchback-2016');assert.equal(l500.model,'fiat-500l-2012');
 assert.ok(tipo.top>p188.top&&tipo.accel>p188.accel,'Tipo a bit quicker than the Punto 188');
 assert.ok(l500.top<p188.top&&l500.accel<p188.accel&&l500.steer<p188.steer,'500L slower and softer than the Punto 188');
 assert.equal(tipo.kind,p188.kind);assert.equal(l500.kind,p188.kind);
 // Collision box of the standard car (no model-specific shape).
 assert.deepEqual(vehicleShape({model:'tipo-hatchback-2016-white'}),vehicleShape({model:'punto-188-white'}));
 assert.deepEqual(vehicleShape({model:'fiat-500l-2012-red'}),vehicleShape({model:'punto-188-white'}));
});

test('lotto 5: NOVITÀ entry, registers and cache versions',async()=>{
 const entry=NOVITA.find(e=>e.id==='lotto5-auto');
 assert.ok(entry,'novita lotto5-auto');
 assert.match(entry.cosa,/Tipo/);assert.match(entry.cosa,/500L/);
 const roads=[{n:'Via Roma',p:[100,100,200,100,300,100,400,100]}];
 assert.deepEqual(entry.trova({roads,traffic:[],cars:[]}),{x:300,y:100});
 assert.equal(novitaAvailable(entry,{traffic:[{model:'fiat-500l-2012-red'}]}),true);
 const read=f=>readFile(new URL('./'+f,import.meta.url),'utf8');
 const [game,page,doc,log,visual,guide]=await Promise.all(['game.mjs','index.html','NOVITA_DA_APPROVARE.md','WORK_LOG.md','VISUAL_PROGRESS.md','VEHICLE_ART_GUIDE.md'].map(read));
 assert.ok(doc.includes('`lotto5-auto`'));
 assert.match(log,/lotto 5 grafica: Fiat Tipo 2016 e Fiat 500L 2012/);assert.match(log,/PROVVISORIO/);
 assert.match(visual,/Tipo/);assert.match(visual,/500L/);
 assert.match(guide,/Fiat Tipo hatchback\*\* .*lotto 5/i);assert.match(guide,/Fiat 500L\*\* .*lotto 5/i);
 const v=(src,mod)=>Number((src.match(new RegExp(mod.replace('.','\\.')+'\\?v=(\\d+)'))||[])[1]);
 assert.ok(v(game,'car-sprites.mjs')>=115,'car-sprites v115');
 assert.ok(v(game,'vehicle-handling.mjs')>=7,'vehicle-handling v007');
 assert.ok(v(game,'novita.mjs')>=5,'novita v005');
 assert.ok(v(page,'game.mjs')>=203,'game v203');
 // One version per module, everywhere it is imported.
 for(const f of ['garages.mjs','tuning.mjs','street-professions.mjs'])assert.equal(v(await read(f),'car-sprites.mjs'),v(game,'car-sprites.mjs'),f);
 for(const f of ['driving-controls.mjs','motorcycles.mjs','city-audio.mjs','roads.mjs'])assert.equal(v(await read(f),'vehicle-handling.mjs'),v(game,'vehicle-handling.mjs'),f);
});
