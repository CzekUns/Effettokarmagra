import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {inflateSync} from 'node:zlib';
import {SERVICE_ATLAS_PATH,SERVICE_ATLAS_CELL,SERVICE_VARIANTS,COURIER_IDS,REFUSE_TRUCK_IDS,CAR_TRAFFIC_SPRITE_IDS,CAR_PARKED_SPRITE_IDS} from './car-sprites.mjs';
import {handlingProfile,TRUCK_HANDLING,VAN_HANDLING,CAR_HANDLING,stepVehicle} from './vehicle-handling.mjs';
import {vehicleShape,vehiclesOverlap} from './traffic-collision.mjs';
import {nearestEnterableVehicle} from './vehicle-entry.mjs';
import {BAY_RULES} from './parking-bays.mjs';

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
 return {w,h,alpha:(x,y)=>out[y*stride+x*4+3],rgb:(x,y)=>[out[y*stride+x*4],out[y*stride+x*4+1],out[y*stride+x*4+2]]};
}

test('Q18 service atlas: 16 cells of 52x92, transparent corners and margins, a solid body in every cell, no light halo',async()=>{
 const png=await readRGBA(SERVICE_ATLAS_PATH),{width:W,height:H}=SERVICE_ATLAS_CELL;
 assert.deepEqual([png.w,png.h],[W*4,H*4]);
 for(let i=0;i<16;i++){
  const x0=(i%4)*W,y0=Math.floor(i/4)*H;
  for(const [x,y] of [[x0,y0],[x0+W-1,y0],[x0,y0+H-1],[x0+W-1,y0+H-1]])assert.equal(png.alpha(x+(x===x0?0:0),y),0,'corner of cell '+i);
  assert.equal(png.alpha(x0+26,y0+46),255,'body of cell '+i);
  // the outermost opaque pixel of every row is the dark outline, never a white/beige matte
  for(let y=y0;y<y0+H;y++){
   let x=x0;while(x<x0+W&&png.alpha(x,y)===0)x++;
   if(x<x0+W){assert.equal(png.alpha(x,y),255);assert.ok(Math.max(...png.rgb(x,y))<90,`outline at row ${y-y0} of cell ${i}`);}
  }
 }
});

test('Q18 two new models, eight plain liveries each, not mixed into the car lists',()=>{
 assert.equal(COURIER_IDS.length,8);assert.equal(REFUSE_TRUCK_IDS.length,8);
 assert.equal(SERVICE_VARIANTS['corriere-bianco'].index,0);assert.equal(SERVICE_VARIANTS['nettezza-verde'].index,8);
 for(const id of [...COURIER_IDS,...REFUSE_TRUCK_IDS]){
  assert.ok(!CAR_TRAFFIC_SPRITE_IDS.includes(id)&&!CAR_PARKED_SPRITE_IDS.includes(id),'cars unchanged: '+id);
  assert.doesNotMatch(id,/dhl|ups|gls|brt|sda|tnt|fedex|poste|asia|amazon/i,'no real brand names');
 }
});

test('Q18 bodies: van fits a stall, truck longer; both pass a car parked in its bay and cross on a service street',()=>{
 const van=vehicleShape({model:'corriere-azzurro'}),truck=vehicleShape({model:'nettezza-bianco-verde'}),car=vehicleShape({model:'panda-modern-white'});
 assert.ok(van.halfLength>car.halfLength&&van.halfLength*2<=BAY_RULES.stall,'a van fits one 7,2 m stall');
 assert.ok(truck.halfLength>van.halfLength&&truck.halfWidth>=car.halfWidth);
 for(const s of [van,truck])assert.ok(s.halfWidth<=1.7+.25-.05,'its lane edge stays clear of the bay gap');
 assert.ok(truck.halfWidth*2<4.6,'two trucks still cross on a 4,6 m lane gap');
 // nose to tail in one lane: the truck body is really longer than a car's
 assert.equal(vehiclesOverlap({x:0,y:0,a:0,model:'nettezza-verde'},{x:8,y:0,a:0,model:'panda-modern-white'}),true);
 assert.equal(vehiclesOverlap({x:0,y:0,a:0,model:'panda-modern-white'},{x:8,y:0,a:0,model:'panda-modern-white'}),false);
});

test('Q18 handling: the van drives like a van, the refuse truck is slow, brakes long and turns wide',()=>{
 assert.equal(handlingProfile({model:'corriere-bianco'}),VAN_HANDLING);
 assert.equal(handlingProfile({model:'nettezza-arancio'}),TRUCK_HANDLING);
 assert.ok(TRUCK_HANDLING.top<VAN_HANDLING.top&&TRUCK_HANDLING.brake<VAN_HANDLING.brake);
 const radius=(profile,speed)=>{let a=0;const dt=.05;for(let i=0;i<20;i++)({angle:a}=stepVehicle(speed,a,{x:1,y:-1},false,dt,false,profile));return speed/(a/(20*dt));};
 for(const v of [4,8,12])assert.ok(radius(TRUCK_HANDLING,v)>radius(CAR_HANDLING,v)*1.2,`at ${v} the truck turns wider`);
 // 0 -> 10 s at full throttle: the truck is clearly slower than a car
 const run=p=>{let s=0;for(let i=0;i<200;i++)({speed:s}=stepVehicle(s,0,{x:0,y:-1},false,.05,false,p));return s;};
 assert.ok(run(TRUCK_HANDLING)<run(CAR_HANDLING)*.7);
});

test('Q18 the player can drive both when parked',()=>{
 for(const model of ['corriere-blu-notte','nettezza-verde-scuro']){
  const v={x:10,y:0,a:0,vehicleType:'car',model};
  assert.equal(nearestEnterableVehicle([v],{x:13,y:1})?.vehicle,v,model);
 }
});

test('Q18 game wiring: vans and trucks in traffic and in the stalls (truck only where it fits), own bodies, versions',async()=>{
 const [game,html,sprites]=await Promise.all(['game.mjs','index.html','car-sprites.mjs'].map(f=>readFile(new URL('./'+f,import.meta.url),'utf8')));
 assert.match(game,/i%13===5\?COURIER_IDS\[/,'courier vans in NPC traffic');
 assert.match(game,/i%31===20\?REFUSE_TRUCK_IDS\[/,'refuse trucks in NPC traffic');
 assert.match(game,/serviceFits\(REFUSE_TRUCK_IDS\[/,'a truck parks only where its body fits');
 assert.match(game,/fitsParkingBay\(state\.parkingBays,v,vehicleShape\(v\)\)&&!carBlocked\(v\.x,v\.y,v\.a,-1,v\)&&!state\.cars\.some\(o=>vehiclesOverlap\(v,o\)\)/);
 assert.match(game,/const ownBody=v=>!isMotorcycle\(v\)&&\/\^\(ape-\|corriere-\|nettezza-\)\/\.test/);
 assert.match(sprites,/'@service-atlas':SERVICE_ATLAS_PATH/);
 assert.match(sprites,/'corriere':\[7\.43,13\.14\],'nettezza':\[7\.43,13\.14\]/);
 assert.ok(Number((html.match(/game\.mjs\?v=(\d+)/)||[])[1])>=171);
});
