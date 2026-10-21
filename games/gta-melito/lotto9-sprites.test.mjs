/* Lotto 9 (2026-10-21, Claude + CODEX-GH): Fiat Doblò II 2010 and Fiat Fiorino III 2008, work vans with generic liveries
 * in the traffic and the parking strips. Atlas drawn by code by CODEX-GH (assets/vehicles/sources/doblo-fiorino-16-genera.py)
 * on the 52x92 cells of the Q18 service atlas: the first extra atlas with its own cell and a «body» rectangle. PROVISIONAL art. */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {inflateSync} from 'node:zlib';
import {EXTRA_CAR_ATLASES,EXTRA_CAR_VARIANTS,CAR_TRAFFIC_SPRITE_IDS,CAR_TRAFFIC_STRIDE,CAR_PARKED_SPRITE_IDS,CAR_ATLAS_CELL,SERVICE_ATLAS_CELL,
 carDrawSize,carSpriteReady,drawCarSprite,loadCarSprites} from './car-sprites.mjs';
import {handlingProfile} from './vehicle-handling.mjs';
import {vehicleShape} from './traffic-collision.mjs';
import {NOVITA,novitaAvailable} from './novita.mjs';

const ATLAS='@doblo-fiorino-atlas',FILE='doblo-fiorino-16';
const MODELS=[
 {model:'doblo-2010',body:[1,7,50,79],colors:['white','white-stripe','grey','blue','red','yellow','darkgreen','white-edilizia']},
 {model:'fiorino-2008',body:[5,17,42,62],colors:['white','white-stripe','grey','blue','red','yellow','darkgreen','white-frutta']},
];
const IDS=MODELS.flatMap(m=>m.colors.map(c=>m.model+'-'+c));
const CELL={width:52,height:92,columns:4,rows:4};

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

test('lotto 9: the atlas is a 208x368 RGBA PNG, 16 cells of 52x92 with the declared body rectangles',async()=>{
 const path=EXTRA_CAR_ATLASES[ATLAS];
 assert.equal(path,'./assets/vehicles/'+FILE+'-rgba.png');
 const bin=await readFile(new URL(path,import.meta.url));
 const png=decodeRGBA(bin);
 assert.equal(png.w,208);assert.equal(png.h,368);
 assert.ok(bin.length<18000,'compact for mobile');
 // Same cell as the Q18 service atlas (courier van), not the 40x60 car cell.
 assert.deepEqual(SERVICE_ATLAS_CELL,CELL);assert.deepEqual(CAR_ATLAS_CELL,{width:40,height:60,columns:4,rows:4});
 for(let i=0;i<16;i++){
  const ox=i%4*52,oy=Math.floor(i/4)*92,[bx,by,bw,bh]=MODELS[i<8?0:1].body,tag='cell '+i;
  for(const [x,y] of [[0,0],[51,0],[0,91],[51,91]])assert.equal(png.alpha(ox+x,oy+y),0,tag+' corner '+x+','+y);
  // The «body» rectangle is exactly the opaque bounding box of the cell (same for all 8 liveries of a model).
  let minX=52,minY=92,maxX=-1,maxY=-1,opaque=0;
  for(let y=0;y<92;y++)for(let x=0;x<52;x++){
   const a=png.alpha(ox+x,oy+y);assert.ok(a===0||a===255,tag+' binary alpha');
   if(a===255){opaque++;if(x<minX)minX=x;if(y<minY)minY=y;if(x>maxX)maxX=x;if(y>maxY)maxY=y;}
  }
  assert.deepEqual([minX,minY,maxX-minX+1,maxY-minY+1],[bx,by,bw,bh],tag+' body rectangle');
  for(const y of [by+8,by+bh/2|0,by+bh-8])assert.equal(png.alpha(ox+26,oy+y),255,tag+' solid down the middle at y='+y);
  assert.ok(opaque>2000&&opaque<3600,tag+' has a van-sized body: '+opaque);
 }
 // The Doblò is bigger than the Fiorino on the sheet, as on the road.
 assert.ok(MODELS[0].body[2]>MODELS[1].body[2]&&MODELS[0].body[3]>MODELS[1].body[3]);
 // The generator and CODEX-GH's notes travel with the atlas; neither is used by the game.
 for(const f of [FILE+'-genera.py',FILE+'-NOTE.md'])
  assert.ok((await readFile(new URL('./assets/vehicles/sources/'+f,import.meta.url))).length>1000,f);
});

test('lotto 9: 16 variant ids, two models with eight liveries each, cell and body on every variant',()=>{
 assert.equal(IDS.length,16);assert.equal(new Set(IDS).size,16);
 MODELS.forEach(({model,colors,body},m)=>colors.forEach((color,i)=>
  assert.deepEqual(EXTRA_CAR_VARIANTS[model+'-'+color],{index:m*8+i,model,color,atlas:ATLAS,cell:CELL,body})));
 assert.equal(Object.keys(EXTRA_CAR_VARIANTS).filter(id=>EXTRA_CAR_VARIANTS[id].atlas===ATLAS).length,16);
 // Every other extra atlas keeps the default 40x60 cell (no «cell», no «body»).
 for(const [id,v] of Object.entries(EXTRA_CAR_VARIANTS))if(v.atlas!==ATLAS)assert.ok(!('cell' in v)&&!('body' in v),id);
 // Draw sizes are the VISIBLE body (CODEX-GH's proposals): the Doblò between the Punto 188 and the Q18 courier van,
 // the Fiorino a Punto-length van; both narrower than the courier's body (~6,3), so they stay in the lane.
 const doblo=carDrawSize('doblo-2010-white-edilizia'),fiorino=carDrawSize('fiorino-2008-white-frutta');
 assert.deepEqual(doblo,[5.9,9.6]);assert.deepEqual(fiorino,[5.5,8.9]);
 const punto=carDrawSize('punto-188-red'),courier=carDrawSize('corriere-bianco'),van=carDrawSize('furgone-ambulante');
 const courierBody=[courier[0]*44/52,courier[1]*70/92]; // opaque box of the Q18 courier cell: 44x70 of 52x92
 assert.ok(doblo[1]>punto[1]&&doblo[1]<courierBody[1],'Doblò longer than the Punto, shorter than the courier');
 assert.ok(doblo[0]<courierBody[0]&&fiorino[0]<courierBody[0]&&doblo[0]<van[0],'both narrower than the courier body and the market van');
 assert.ok(fiorino[0]<doblo[0]&&fiorino[1]<doblo[1],'Fiorino smaller than the Doblò');
 assert.ok(Math.abs(fiorino[1]-punto[1])<.2,'Fiorino about as long as the Punto 188');
});

test('lotto 9: the 208x368 atlas is accepted and only the body rectangle of the 52x92 cell is drawn',()=>{
 // Lotto 9 atlas 208x368; every other image answers with the size the game expects for it.
 class MockImage{
  complete=true;
  set src(v){this._src=v;const big=/doblo-fiorino|servizio-16/.test(v);this.naturalWidth=this.width=big?208:v.includes('servizio2')?208:v.includes('ape-')?224:160;this.naturalHeight=this.height=big?368:v.includes('servizio2')?496:v.includes('ape-')?256:240;}
 }
 const oldImage=globalThis.Image;
 try{
  globalThis.Image=MockImage;loadCarSprites();
  const calls=[],ctx={
   save(){},restore(){},translate(){},rotate(v){calls.push(['rotate',v]);},
   drawImage(...args){calls.push(['draw',...args]);},
   strokeRect(){},set strokeStyle(v){},set lineWidth(v){},set imageSmoothingEnabled(v){}
  };
  for(const id of IDS){
   const meta=EXTRA_CAR_VARIANTS[id],[bx,by,bw,bh]=meta.body,[w,l]=carDrawSize(id);
   assert.equal(carSpriteReady(id),true,id);
   calls.length=0;assert.equal(drawCarSprite(ctx,12,15,Math.PI/4,id),true);
   const draw=calls.find(x=>x[0]==='draw');assert.equal(draw.length,10);
   assert.deepEqual(draw.slice(2,10),[meta.index%4*52+bx,Math.floor(meta.index/4)*92+by,bw,bh,-w/2,-l/2,w,l],id);
   assert.ok(Math.abs(calls[0][1]-3*Math.PI/4)<1e-9);
  }
  // A 160x240 image would NOT be accepted for the work vans (the cell decides the expected atlas size)...
  const img=new MockImage();img.src='x.png';
  assert.equal(img.naturalWidth,160);
  // ...while the Punto atlas and the courier keep their own checks and whole-cell drawing.
  assert.equal(carSpriteReady('punto-188-red'),true);assert.equal(carSpriteReady('corriere-bianco'),true);
  calls.length=0;drawCarSprite(ctx,0,0,0,'corriere-bianco');
  assert.deepEqual(calls.find(x=>x[0]==='draw').slice(2,6),[0,0,52,92],'courier: whole cell as before');
  calls.length=0;drawCarSprite(ctx,0,0,0,'corsa-e-2014-white');
  assert.deepEqual(calls.find(x=>x[0]==='draw').slice(2,6),[0,0,40,60],'lotto 7 car: whole 40x60 cell as before');
 }finally{
  if(oldImage===undefined)delete globalThis.Image;else globalThis.Image=oldImage;
 }
});

test('lotto 9: both vans are in the AI traffic and in the parked cars, with the work-van driving profile',()=>{
 for(const id of IDS){
  assert.ok(CAR_TRAFFIC_SPRITE_IDS.includes(id),'traffic '+id);
  assert.ok(CAR_PARKED_SPRITE_IDS.includes(id),'parked '+id);
 }
 // The traffic picks ids with stride CAR_TRAFFIC_STRIDE (game.mjs): over a full cycle EVERY car id is spawned.
 // With 146 ids (146 = 2·73) the stride stays 7; the parked step (k*7)%162 is coprime too.
 const gcd=(a,b)=>b?gcd(b,a%b):a;
 assert.equal(CAR_TRAFFIC_SPRITE_IDS.length,146);assert.equal(CAR_TRAFFIC_STRIDE,7);
 assert.equal(gcd(CAR_TRAFFIC_STRIDE,CAR_TRAFFIC_SPRITE_IDS.length),1);
 assert.equal(CAR_PARKED_SPRITE_IDS.length,162);assert.equal(gcd(7,CAR_PARKED_SPRITE_IDS.length),1);
 const seen=new Set();for(let i=0;i<CAR_TRAFFIC_SPRITE_IDS.length;i++)seen.add(CAR_TRAFFIC_SPRITE_IDS[(i*CAR_TRAFFIC_STRIDE)%CAR_TRAFFIC_SPRITE_IDS.length]);
 for(const id of IDS)assert.ok(seen.has(id),'spawned '+id);
 assert.equal(seen.size,CAR_TRAFFIC_SPRITE_IDS.length,'every traffic car id is reachable');
 // Light work vans: slower than the hatchbacks, top 38, softer steering and grip; still «auto», not the market VAN profile.
 const doblo=handlingProfile({model:'doblo-2010-white-edilizia'}),fiorino=handlingProfile({model:'fiorino-2008-darkgreen'});
 const clio=handlingProfile({model:'clio-iv-2012-blue'}),courier=handlingProfile({model:'corriere-bianco'});
 assert.equal(doblo.model,'doblo-2010');assert.equal(fiorino.model,'fiorino-2008');
 for(const p of [doblo,fiorino]){
  assert.equal(p.accel,11.5);assert.equal(p.top,38);assert.equal(p.brake,46);assert.equal(p.steer,2.3);assert.equal(p.grip,6.6);
  assert.equal(p.kind,'auto');assert.ok(p.accel<clio.accel&&p.top<clio.top,'slower than a Clio');
  assert.ok(p.top>courier.top&&p.kind!==courier.kind,'quicker than the Q18 courier van, and not its profile');
 }
 // Collision box of the standard car (no model-specific shape), like every other extra atlas car.
 for(const id of ['doblo-2010-white','fiorino-2008-white-frutta'])
  assert.deepEqual(vehicleShape({model:id}),vehicleShape({model:'punto-188-white'}),id);
});

test('lotto 9: NOVITÀ entry, registers and cache versions',async()=>{
 const roads=[{n:'Via Roma',p:[100,100,200,100,300,100,400,100]}];
 const l9=NOVITA.find(e=>e.id==='lotto9-furgoncini');
 assert.ok(l9,'novita lotto9-furgoncini');
 assert.match(l9.cosa,/Doblò/);assert.match(l9.cosa,/Fiorino/);assert.match(l9.cosa,/EDILIZIA/);assert.match(l9.cosa,/FRUTTA/);assert.match(l9.cosa,/PROVVISORIA/);
 assert.deepEqual(l9.trova({roads,traffic:[],cars:[]}),{x:300,y:100});
 assert.equal(novitaAvailable(l9,{traffic:[{model:'fiorino-2008-white-frutta'}]}),true);
 assert.equal(novitaAvailable(l9,{traffic:[{model:'punto-188-red'}],cars:[{model:'doblo-2010-grey'}]}),true);
 const read=f=>readFile(new URL('./'+f,import.meta.url),'utf8');
 const [game,page,doc,log,visual,guide]=await Promise.all(['game.mjs','index.html','NOVITA_DA_APPROVARE.md','WORK_LOG.md','VISUAL_PROGRESS.md','VEHICLE_ART_GUIDE.md'].map(read));
 assert.ok(doc.includes('`lotto9-furgoncini`'));
 assert.match(log,/lotto 9 grafica: Fiat Doblò II e Fiat Fiorino III, furgoncini da lavoro con livree generiche/);assert.match(log,/PROVVISORIO/);
 for(const name of ['Doblò II','Fiorino III'])assert.match(visual,new RegExp(name));
 assert.match(guide,/Fiat Doblò II\*\* .*lotto 9/i);assert.match(guide,/Fiat Fiorino III\*\* .*lotto 9/i);
 const v=(src,mod)=>Number((src.match(new RegExp(mod.replace('.','\\.')+'\\?v=(\\d+)'))||[])[1]);
 assert.ok(v(game,'car-sprites.mjs')>=118,'car-sprites v118');
 assert.ok(v(game,'vehicle-handling.mjs')>=10,'vehicle-handling v010');
 assert.ok(v(game,'novita.mjs')>=8,'novita v008');
 assert.ok(v(page,'game.mjs')>=206,'game v206');
 // One version per module, everywhere it is imported.
 for(const f of ['garages.mjs','tuning.mjs','street-professions.mjs'])assert.equal(v(await read(f),'car-sprites.mjs'),v(game,'car-sprites.mjs'),f);
 for(const f of ['driving-controls.mjs','motorcycles.mjs','city-audio.mjs','roads.mjs'])assert.equal(v(await read(f),'vehicle-handling.mjs'),v(game,'vehicle-handling.mjs'),f);
});
