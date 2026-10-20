import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {inflateSync} from 'node:zlib';
import {APE_CAR_ATLAS_PATH,APE_CAR_VARIANTS,APE_CAR_IDS,APE_CAR_PAINTS,CAR_TRAFFIC_SPRITE_IDS} from './car-sprites.mjs';
import {handlingProfile,APE_HANDLING,CAR_HANDLING,stepVehicle} from './vehicle-handling.mjs';
import {vehicleShape} from './traffic-collision.mjs';
import {nearestEnterableVehicle} from './vehicle-entry.mjs';

// Minimal PNG reader (RGBA 8-bit, non-interlaced) to check the real alpha of every cell.
async function readRGBA(path){
 const buf=await readFile(new URL(path,import.meta.url));
 let o=8,w=0,h=0,type=0;const idat=[];
 while(o<buf.length){const len=buf.readUInt32BE(o),kind=buf.toString('ascii',o+4,o+8),data=buf.subarray(o+8,o+8+len);
  if(kind==='IHDR'){w=data.readUInt32BE(0);h=data.readUInt32BE(4);type=data[9];}
  if(kind==='IDAT')idat.push(data);o+=12+len;}
 assert.equal(type,6,'RGBA PNG');
 const raw=inflateSync(Buffer.concat(idat)),bpp=4,stride=w*bpp,out=Buffer.alloc(h*stride);
 for(let y=0;y<h;y++){const f=raw[y*(stride+1)],line=raw.subarray(y*(stride+1)+1,(y+1)*(stride+1));
  for(let x=0;x<stride;x++){const a=x>=bpp?out[y*stride+x-bpp]:0,b=y?out[(y-1)*stride+x]:0,c=x>=bpp&&y?out[(y-1)*stride+x-bpp]:0;
   const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);
   out[y*stride+x]=(line[x]+[0,a,b,(a+b)>>1,pa<=pb&&pa<=pc?a:pb<=pc?b:c][f])&255;}}
 return {w,h,alpha:(x,y)=>out[y*stride+x*4+3]};
}

test('Q16 Ape Car atlas: 16 cells of 56x64, really transparent corners, a solid body in every cell',async()=>{
 const png=await readRGBA(APE_CAR_ATLAS_PATH);
 assert.deepEqual([png.w,png.h],[224,256]);
 for(let i=0;i<16;i++){
  const x0=(i%4)*56,y0=Math.floor(i/4)*64;
  for(const [x,y] of [[x0,y0],[x0+55,y0],[x0,y0+63],[x0+55,y0+63],[x0+1,y0+1],[x0+54,y0+62]])assert.equal(png.alpha(x,y),0,'corner of cell '+i);
  assert.equal(png.alpha(x0+28,y0+32),255,'body of cell '+i);
 }
});

test('Q16 sixteen Ape Car variants: eight paints, clean and worn, never mixed into the car traffic list',()=>{
 assert.equal(APE_CAR_IDS.length,16);assert.equal(APE_CAR_PAINTS.length,8);
 assert.equal(APE_CAR_VARIANTS['ape-classica-rossa'].index,2);
 assert.equal(APE_CAR_VARIANTS['ape-vissuta-rossa'].index,10);assert.equal(APE_CAR_VARIANTS['ape-vissuta-rossa'].worn,true);
 assert.ok(APE_CAR_IDS.every(id=>!CAR_TRAFFIC_SPRITE_IDS.includes(id)),'cars and existing sprites unchanged');
});

test('Q16 a three-wheeler: Ape body and handling, slow but much tighter turns than a car',()=>{
 const ape={vehicleType:'car',model:'ape-classica-gialla'};
 assert.equal(handlingProfile(ape),APE_HANDLING);
 assert.ok(vehicleShape(ape).halfLength<3.15&&vehicleShape(ape).halfWidth<1.7,'short and narrow');
 assert.ok(APE_HANDLING.top<CAR_HANDLING.top/2,'about 60 km/h at most');
 // Turning radius at the same speed, full lock: speed / yaw rate.
 const radius=(profile,speed)=>{let a=0;const dt=.05;for(let i=0;i<20;i++)({angle:a}=stepVehicle(speed,a,{x:1,y:-1},false,dt,false,profile));return speed/(a/(20*dt));};
 for(const v of [4,8,12]){
  const rApe=radius(APE_HANDLING,v),rCar=radius(CAR_HANDLING,v);
  assert.ok(rApe<rCar*.85,`at ${v} the Ape turns tighter: ${rApe.toFixed(1)} vs ${rCar.toFixed(1)}`);
 }
});

test('Q16 the player can get into a parked Ape like any car',()=>{
 const ape={x:10,y:0,a:0,vehicleType:'car',model:'ape-vissuta-blu'};
 assert.equal(nearestEnterableVehicle([ape],{x:12,y:1})?.vehicle,ape);
});

test('Q16 game wiring: Apes parked and in traffic, own body for walls and kerbs, versions',async()=>{
 const [game,html]=await Promise.all(['game.mjs','index.html'].map(f=>readFile(new URL('./'+f,import.meta.url),'utf8')));
 assert.match(game,/k%9===8\?APE_CAR_IDS\[\(k\*5\)%APE_CAR_IDS\.length\]:/,'some parked Apes in the stalls');
 assert.match(game,/i%11===8\?APE_CAR_IDS\[Math\.floor\(i\/11\)%APE_CAR_IDS\.length\]:null/,'Ape Cars in NPC traffic');
 assert.match(game,/const bodyShape=v=>vehicleShape\(isMotorcycle\(v\)\?\{vehicleType:'motorcycle'\}:isApe\(v\)\?v:\{vehicleType:'car'\}\);/);
 assert.match(game,/const forwards=bike\?\[-2\.25,0,2\.25\]:ape\?\[-k\.halfLength\*\.83,0,k\.halfLength\*1\.08\]:\[-2\.6,0,3\.4\];/,'cars keep their probes');
 assert.ok(Number((html.match(/game\.mjs\?v=(\d+)/)||[])[1])>=169);
});
