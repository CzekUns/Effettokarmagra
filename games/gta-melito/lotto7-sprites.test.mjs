/* Lotti 7 e 8 (2026-10-21, Claude + CODEX-GH): Opel Corsa E 2014 and Peugeot 208 2012 (lotto 7), Nissan Qashqai J11 2013
 * and Dacia Duster 2010 (lotto 8) in the traffic. Atlases drawn by code by CODEX-GH
 * (assets/vehicles/sources/corsa-e-208-16-genera.py, qashqai-duster-16-genera.py); PROVISIONAL art. */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {inflateSync} from 'node:zlib';
import {EXTRA_CAR_ATLASES,EXTRA_CAR_VARIANTS,CAR_TRAFFIC_SPRITE_IDS,CAR_TRAFFIC_STRIDE,CAR_PARKED_SPRITE_IDS,CAR_ATLAS_CELL,carDrawSize} from './car-sprites.mjs';
import {handlingProfile} from './vehicle-handling.mjs';
import {vehicleShape} from './traffic-collision.mjs';
import {NOVITA,novitaAvailable} from './novita.mjs';

const SHEETS=[
 {lotto:7,atlas:'@corsa-e-208-atlas',file:'corsa-e-208-16',novita:'lotto7-auto',
  models:[{model:'corsa-e-2014',colors:['white','red','blue','silver','graphite','black','yellow','orange']},
          {model:'peugeot-208-2012',colors:['white','red','silver','sharkgrey','black','virtualblue','darkblue','orangepower']}]},
 {lotto:8,atlas:'@qashqai-duster-atlas',file:'qashqai-duster-16',novita:'lotto8-auto',
  models:[{model:'qashqai-j11-2013',colors:['white','red','silver','graphite','black','blue','bronze','burgundy']},
          {model:'duster-2010',colors:['white','beige','darkgreen','silver','graphite','black','blue','brown']}]},
];
const idsOf=sheet=>sheet.models.flatMap(m=>m.colors.map(c=>m.model+'-'+c));
const IDS=SHEETS.flatMap(idsOf);

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

test('lotti 7-8: each atlas is a 160x240 RGBA PNG with 16 cells, transparent corners and solid bodies',async()=>{
 for(const sheet of SHEETS){
  const path=EXTRA_CAR_ATLASES[sheet.atlas];
  assert.equal(path,'./assets/vehicles/'+sheet.file+'-rgba.png');
  const bin=await readFile(new URL(path,import.meta.url));
  const png=decodeRGBA(bin);
  assert.equal(png.w,160);assert.equal(png.h,240);
  assert.ok(bin.length<18000,'compact for mobile: '+sheet.file);
  assert.deepEqual(CAR_ATLAS_CELL,{width:40,height:60,columns:4,rows:4});
  for(let i=0;i<16;i++){
   const ox=i%4*40,oy=Math.floor(i/4)*60,tag='lotto '+sheet.lotto+' cell '+i;
   for(const [x,y] of [[0,0],[39,0],[0,59],[39,59],[1,1],[38,58]])assert.equal(png.alpha(ox+x,oy+y),0,tag+' corner '+x+','+y);
   // Bonnet, cabin and boot are all solid pixels down the middle of the car.
   for(const y of [12,30,48])assert.equal(png.alpha(ox+20,oy+y),255,tag+' body at y='+y);
   let opaque=0;for(let y=0;y<60;y++)for(let x=0;x<40;x++)if(png.alpha(ox+x,oy+y)===255)opaque++;
   assert.ok(opaque>900&&opaque<2000,tag+' has a car-sized body: '+opaque);
  }
  // The generator and CODEX-GH's notes travel with the atlas; neither is used by the game.
  for(const f of [sheet.file+'-genera.py',sheet.file+'-NOTE.md'])
   assert.ok((await readFile(new URL('./assets/vehicles/sources/'+f,import.meta.url))).length>1000,f);
 }
});

test('lotti 7-8: 32 variant ids, four models with eight colours each on the right cells',()=>{
 assert.equal(IDS.length,32);assert.equal(new Set(IDS).size,32);
 for(const id of IDS)assert.ok(EXTRA_CAR_VARIANTS[id],'variant '+id);
 for(const sheet of SHEETS){
  sheet.models.forEach(({model,colors},m)=>colors.forEach((color,i)=>
   assert.deepEqual(EXTRA_CAR_VARIANTS[model+'-'+color],{index:m*8+i,model,color,atlas:sheet.atlas})));
  assert.equal(Object.keys(EXTRA_CAR_VARIANTS).filter(id=>EXTRA_CAR_VARIANTS[id].atlas===sheet.atlas).length,16);
 }
 // Draw sizes: CODEX-GH's prudent proposals. Lotto 7: superminis around the Punto 188 ([5.5,8.9] Corsa, [5.4,8.8] 208).
 // Lotto 8: crossovers a bit bigger than every hatchback ([5.8,9.4] Qashqai, [5.7,9.2] Duster) but never wider than
 // 5.8 world units, so they stay inside their lane and never touch the opposite one.
 const corsa=carDrawSize('corsa-e-2014-red'),p208=carDrawSize('peugeot-208-2012-virtualblue');
 const qashqai=carDrawSize('qashqai-j11-2013-bronze'),duster=carDrawSize('duster-2010-darkgreen');
 const punto=carDrawSize('punto-188-red'),golf=carDrawSize('golf-vii-2012-red'),van=carDrawSize('furgone-ambulante');
 assert.deepEqual(corsa,[5.5,8.9]);assert.deepEqual(p208,[5.4,8.8]);
 assert.deepEqual(qashqai,[5.8,9.4]);assert.deepEqual(duster,[5.7,9.2]);
 assert.ok(corsa[1]>punto[1]&&p208[1]>punto[1],'both superminis a touch longer than the Punto 188');
 assert.ok(Math.abs(corsa[0]-punto[0])<.1&&Math.abs(p208[0]-punto[0])<.1,'both superminis as wide as the Punto 188');
 assert.ok(qashqai[0]>golf[0]&&qashqai[1]>golf[1]&&duster[0]>golf[0]&&duster[1]>=golf[1],'crossovers bigger than the Golf VII');
 assert.ok(qashqai[0]<=5.8&&duster[0]<=5.8&&qashqai[0]<van[0],'crossovers no wider than 5.8 units, narrower than the market van');
});

test('lotti 7-8: all four models are in the AI traffic and in the parked cars, with their own driving profile',()=>{
 for(const id of IDS){
  assert.ok(CAR_TRAFFIC_SPRITE_IDS.includes(id),'traffic '+id);
  assert.ok(CAR_PARKED_SPRITE_IDS.includes(id),'parked '+id);
 }
 // The traffic picks ids with stride CAR_TRAFFIC_STRIDE (game.mjs): over a full cycle EVERY car id is spawned.
 // With 130 ids the stride is 7 again (130 = 2·5·13, coprime with 7); the parked step (k*7)%146 is coprime too.
 const gcd=(a,b)=>b?gcd(b,a%b):a;
 assert.equal(CAR_TRAFFIC_SPRITE_IDS.length,130);assert.equal(CAR_TRAFFIC_STRIDE,7);
 assert.equal(gcd(CAR_TRAFFIC_STRIDE,CAR_TRAFFIC_SPRITE_IDS.length),1);
 assert.equal(CAR_PARKED_SPRITE_IDS.length,146);assert.equal(gcd(7,CAR_PARKED_SPRITE_IDS.length),1);
 const seen=new Set();for(let i=0;i<CAR_TRAFFIC_SPRITE_IDS.length;i++)seen.add(CAR_TRAFFIC_SPRITE_IDS[(i*CAR_TRAFFIC_STRIDE)%CAR_TRAFFIC_SPRITE_IDS.length]);
 for(const id of IDS)assert.ok(seen.has(id),'spawned '+id);
 assert.equal(seen.size,CAR_TRAFFIC_SPRITE_IDS.length,'every traffic car id is reachable');
 const corsa=handlingProfile({model:'corsa-e-2014-blue'}),p208=handlingProfile({model:'peugeot-208-2012-darkblue'}),clio=handlingProfile({model:'clio-iv-2012-blue'});
 const qashqai=handlingProfile({model:'qashqai-j11-2013-burgundy'}),duster=handlingProfile({model:'duster-2010-beige'});
 assert.equal(corsa.model,'corsa-e-2014');assert.equal(p208.model,'peugeot-208-2012');
 assert.equal(qashqai.model,'qashqai-j11-2013');assert.equal(duster.model,'duster-2010');
 // Lotto 7: like the Clio IV.
 for(const p of [corsa,p208]){assert.equal(p.accel,clio.accel);assert.equal(p.top,clio.top);assert.equal(p.brake,clio.brake);assert.equal(p.grip,clio.grip);assert.equal(p.steer,clio.steer);}
 // Lotto 8: crossovers, slower off the line, top 40, slightly slower steering, grip 7.0.
 for(const p of [qashqai,duster]){
  assert.ok(p.accel<clio.accel,'crossover slower in acceleration');assert.equal(p.top,40);
  assert.ok(p.steer<clio.steer,'crossover steers a bit slower');assert.equal(p.grip,7);assert.equal(p.kind,clio.kind);
 }
 assert.ok(duster.accel<qashqai.accel,'Duster a touch slower than the Qashqai');
 // Collision box of the standard car (no model-specific shape).
 for(const id of ['corsa-e-2014-white','peugeot-208-2012-red','qashqai-j11-2013-silver','duster-2010-brown'])
  assert.deepEqual(vehicleShape({model:id}),vehicleShape({model:'punto-188-white'}),id);
});

test('lotti 7-8: NOVITÀ entries, registers and cache versions',async()=>{
 const roads=[{n:'Via Roma',p:[100,100,200,100,300,100,400,100]}];
 const l7=NOVITA.find(e=>e.id==='lotto7-auto'),l8=NOVITA.find(e=>e.id==='lotto8-auto');
 assert.ok(l7,'novita lotto7-auto');assert.ok(l8,'novita lotto8-auto');
 assert.match(l7.cosa,/Corsa/);assert.match(l7.cosa,/208/);
 assert.match(l8.cosa,/Qashqai/);assert.match(l8.cosa,/Duster/);
 for(const e of [l7,l8])assert.deepEqual(e.trova({roads,traffic:[],cars:[]}),{x:300,y:100});
 assert.equal(novitaAvailable(l7,{traffic:[{model:'peugeot-208-2012-red'}]}),true);
 assert.equal(novitaAvailable(l8,{traffic:[{model:'duster-2010-darkgreen'}]}),true);
 const read=f=>readFile(new URL('./'+f,import.meta.url),'utf8');
 const [game,page,doc,log,visual,guide]=await Promise.all(['game.mjs','index.html','NOVITA_DA_APPROVARE.md','WORK_LOG.md','VISUAL_PROGRESS.md','VEHICLE_ART_GUIDE.md'].map(read));
 assert.ok(doc.includes('`lotto7-auto`'));assert.ok(doc.includes('`lotto8-auto`'));
 assert.match(log,/lotti 7 e 8 grafica: Opel Corsa E, Peugeot 208, Nissan Qashqai J11, Dacia Duster/);assert.match(log,/PROVVISORIO/);
 for(const name of ['Corsa E','Peugeot 208','Qashqai J11','Duster'])assert.match(visual,new RegExp(name));
 assert.match(guide,/Opel Corsa E\*\* .*lotto 7/i);assert.match(guide,/Peugeot 208\*\* .*lotto 7/i);
 assert.match(guide,/Nissan Qashqai J11\*\* .*lotto 8/i);assert.match(guide,/Dacia Duster\*\* .*lotto 8/i);
 const v=(src,mod)=>Number((src.match(new RegExp(mod.replace('.','\\.')+'\\?v=(\\d+)'))||[])[1]);
 assert.ok(v(game,'car-sprites.mjs')>=117,'car-sprites v117');
 assert.ok(v(game,'vehicle-handling.mjs')>=9,'vehicle-handling v009');
 assert.ok(v(game,'novita.mjs')>=7,'novita v007');
 assert.ok(v(page,'game.mjs')>=205,'game v205');
 // One version per module, everywhere it is imported.
 for(const f of ['garages.mjs','tuning.mjs','street-professions.mjs'])assert.equal(v(await read(f),'car-sprites.mjs'),v(game,'car-sprites.mjs'),f);
 for(const f of ['driving-controls.mjs','motorcycles.mjs','city-audio.mjs','roads.mjs'])assert.equal(v(await read(f),'vehicle-handling.mjs'),v(game,'vehicle-handling.mjs'),f);
});
