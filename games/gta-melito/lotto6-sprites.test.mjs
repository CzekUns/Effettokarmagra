/* Lotto 6 (2026-10-21, Claude + CODEX-GH): Renault Clio IV 2012 and Volkswagen Golf VII 2012 in the traffic.
 * Atlas drawn by code by CODEX-GH (assets/vehicles/sources/clio4-golf7-16-genera.py); PROVISIONAL art. */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {inflateSync} from 'node:zlib';
import {EXTRA_CAR_ATLASES,EXTRA_CAR_VARIANTS,CAR_TRAFFIC_SPRITE_IDS,CAR_TRAFFIC_STRIDE,CAR_PARKED_SPRITE_IDS,CAR_ATLAS_CELL,carDrawSize} from './car-sprites.mjs';
import {handlingProfile} from './vehicle-handling.mjs';
import {vehicleShape} from './traffic-collision.mjs';
import {NOVITA,novitaAvailable} from './novita.mjs';

const ATLAS='@clio4-golf7-atlas';
const CLIO=['white','red','blue','silver','graphite','black','yellow','brown'];
const GOLF=['white','red','silver','grey','black','nightblue','pacificblue','sunsetred'];
const IDS=[...CLIO.map(c=>'clio-iv-2012-'+c),...GOLF.map(c=>'golf-vii-2012-'+c)];

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

test('lotto 6: the atlas is a 160x240 RGBA PNG with 16 cells, transparent corners and solid bodies',async()=>{
 const path=EXTRA_CAR_ATLASES[ATLAS];
 assert.equal(path,'./assets/vehicles/clio4-golf7-16-rgba.png');
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
 for(const f of ['clio4-golf7-16-genera.py','clio4-golf7-16-NOTE.md'])
  assert.ok((await readFile(new URL('./assets/vehicles/sources/'+f,import.meta.url))).length>1000,f);
});

test('lotto 6: 16 variant ids, two models with eight colours each on the right cells',()=>{
 assert.equal(IDS.length,16);
 for(const id of IDS)assert.ok(EXTRA_CAR_VARIANTS[id],'variant '+id);
 CLIO.forEach((color,i)=>assert.deepEqual(EXTRA_CAR_VARIANTS['clio-iv-2012-'+color],{index:i,model:'clio-iv-2012',color,atlas:ATLAS}));
 GOLF.forEach((color,i)=>assert.deepEqual(EXTRA_CAR_VARIANTS['golf-vii-2012-'+color],{index:8+i,model:'golf-vii-2012',color,atlas:ATLAS}));
 assert.equal(Object.keys(EXTRA_CAR_VARIANTS).filter(id=>EXTRA_CAR_VARIANTS[id].atlas===ATLAS).length,16);
 // Draw sizes: CODEX-GH's own prudent proposals ([5.4,8.9] Clio, [5.6,9.2] Golf): the Clio a touch longer than the
 // Punto 188, the Golf the biggest hatchback, both still inside the lane (no wider than 5.6 world units).
 const clio=carDrawSize('clio-iv-2012-red'),golf=carDrawSize('golf-vii-2012-nightblue'),punto=carDrawSize('punto-188-red');
 assert.deepEqual(clio,[5.4,8.9]);assert.deepEqual(golf,[5.6,9.2]);
 assert.ok(clio[1]>punto[1]&&clio[0]<punto[0],'Clio a little longer and narrower than the Punto 188');
 assert.ok(golf[1]>clio[1]&&golf[0]>clio[0],'Golf longer and wider than the Clio');
 assert.ok(clio[0]<=5.6&&golf[0]<=5.6,'both no wider than 5.6 world units');
 assert.ok(golf[1]<=9.2,'Golf no longer than the lotto 5 Tipo');
});

test('lotto 6: both models are in the AI traffic and in the parked cars, with their own driving profile',()=>{
 for(const id of IDS){
  assert.ok(CAR_TRAFFIC_SPRITE_IDS.includes(id),'traffic '+id);
  assert.ok(CAR_PARKED_SPRITE_IDS.includes(id),'parked '+id);
 }
 // The traffic picks ids with stride CAR_TRAFFIC_STRIDE (game.mjs): over a full cycle EVERY car id is spawned.
 // With 98 ids a fixed 7 would reach only 14 of them (7 divides 98): the stride must be coprime with the length
 // (it was 9 with 98 ids; lotti 7-8 brought the list to 130 ids, coprime with 7 again, lotto 9 to 146 = 2·73).
 assert.equal(CAR_TRAFFIC_SPRITE_IDS.length,146);assert.equal(CAR_TRAFFIC_STRIDE,7);
 const seen=new Set();for(let i=0;i<CAR_TRAFFIC_SPRITE_IDS.length;i++)seen.add(CAR_TRAFFIC_SPRITE_IDS[(i*CAR_TRAFFIC_STRIDE)%CAR_TRAFFIC_SPRITE_IDS.length]);
 for(const id of IDS)assert.ok(seen.has(id),'spawned '+id);
 assert.equal(seen.size,CAR_TRAFFIC_SPRITE_IDS.length,'every traffic car id is reachable');
 const clio=handlingProfile({model:'clio-iv-2012-blue'}),golf=handlingProfile({model:'golf-vii-2012-pacificblue'}),gp=handlingProfile({model:'grande-punto-2005-blue'});
 assert.equal(clio.model,'clio-iv-2012');assert.equal(golf.model,'golf-vii-2012');
 assert.equal(clio.top,gp.top);assert.equal(clio.brake,gp.brake);assert.ok(Math.abs(clio.accel-gp.accel)<.5,'Clio drives like the Grande Punto');
 assert.ok(golf.top>clio.top&&golf.accel>clio.accel&&golf.brake>clio.brake&&golf.grip>clio.grip,'Golf a bit faster and steadier than the Clio');
 assert.equal(clio.kind,gp.kind);assert.equal(golf.kind,gp.kind);
 // Collision box of the standard car (no model-specific shape).
 assert.deepEqual(vehicleShape({model:'clio-iv-2012-white'}),vehicleShape({model:'punto-188-white'}));
 assert.deepEqual(vehicleShape({model:'golf-vii-2012-red'}),vehicleShape({model:'punto-188-white'}));
});

test('lotto 6: NOVITÀ entry, registers and cache versions',async()=>{
 const entry=NOVITA.find(e=>e.id==='lotto6-auto');
 assert.ok(entry,'novita lotto6-auto');
 assert.match(entry.cosa,/Clio/);assert.match(entry.cosa,/Golf/);
 const roads=[{n:'Via Roma',p:[100,100,200,100,300,100,400,100]}];
 assert.deepEqual(entry.trova({roads,traffic:[],cars:[]}),{x:300,y:100});
 assert.equal(novitaAvailable(entry,{traffic:[{model:'golf-vii-2012-red'}]}),true);
 const read=f=>readFile(new URL('./'+f,import.meta.url),'utf8');
 const [game,page,doc,log,visual,guide]=await Promise.all(['game.mjs','index.html','NOVITA_DA_APPROVARE.md','WORK_LOG.md','VISUAL_PROGRESS.md','VEHICLE_ART_GUIDE.md'].map(read));
 assert.ok(doc.includes('`lotto6-auto`'));
 assert.match(log,/lotto 6 grafica: Renault Clio IV e VW Golf VII/);assert.match(log,/PROVVISORIO/);
 assert.match(visual,/Clio IV/);assert.match(visual,/Golf VII/);
 assert.match(guide,/Renault Clio IV\*\* .*lotto 6/i);assert.match(guide,/Volkswagen Golf VII\*\* .*lotto 6/i);
 const v=(src,mod)=>Number((src.match(new RegExp(mod.replace('.','\\.')+'\\?v=(\\d+)'))||[])[1]);
 assert.ok(v(game,'car-sprites.mjs')>=116,'car-sprites v116');
 assert.ok(v(game,'vehicle-handling.mjs')>=8,'vehicle-handling v008');
 assert.ok(v(game,'novita.mjs')>=6,'novita v006');
 assert.ok(v(page,'game.mjs')>=204,'game v204');
 // One version per module, everywhere it is imported.
 for(const f of ['garages.mjs','tuning.mjs','street-professions.mjs'])assert.equal(v(await read(f),'car-sprites.mjs'),v(game,'car-sprites.mjs'),f);
 for(const f of ['driving-controls.mjs','motorcycles.mjs','city-audio.mjs','roads.mjs'])assert.equal(v(await read(f),'vehicle-handling.mjs'),v(game,'vehicle-handling.mjs'),f);
});
