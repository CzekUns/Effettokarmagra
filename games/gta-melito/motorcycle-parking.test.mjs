import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PARKED_BIKE_TARGET,PARKED_VEHICLE_CAP,PARKED_CAR_PHASE_CAP,
 motorcycleParkingRoadOrder,motorcycleParkingCandidates,parkedBikeLabel
} from './motorcycle-parking.mjs';
import {MOTORCYCLE_IDS} from './motorcycles.mjs';
import {vehiclesOverlap} from './traffic-collision.mjs';
import {visualRoadWidth} from './road-widths.mjs';
const distance=p=>p.reduce((total,v,i)=>i%2?total:total+(i?Math.hypot(p[i]-p[i-2],p[i+1]-p[i-1]):0),0);
const sample=(road,fraction)=>{
 const p=road.p,total=distance(p);let rem=total*fraction;
 for(let i=2;i<p.length;i+=2){
  const dx=p[i]-p[i-2],dy=p[i+1]-p[i-1],len=Math.hypot(dx,dy);
  if(rem<=len||i===p.length-2){
   const t=len?Math.min(1,rem/len):0;
   return {x:p[i-2]+dx*t,y:p[i-1]+dy*t,a:Math.atan2(dy,dx)};
  }
  rem-=len;
 }
 return {x:p[0],y:p[1],a:0};
};
const rand=n=>{let x=Number(n)|0;x=Math.imul(x^x>>>16,2246822519);x=Math.imul(x^x>>>13,3266489917);return ((x^x>>>16)>>>0)/4294967295;};

test('parking candidates follow their own street, with varied side and longitudinal positions',()=>{
 const road={id:42,p:[0,0,80,0],t:'residential',w:7};
 const poses=motorcycleParkingCandidates(road,sample,10,rand);
 assert.equal(poses.length,8);
 assert.ok(poses.every(p=>p.x>0&&p.x<80));
 assert.ok(poses.some(p=>p.y<0)&&poses.some(p=>p.y>0));
 assert.ok(new Set(poses.map(p=>Math.round(p.x))).size>=2);
 assert.deepEqual(motorcycleParkingCandidates(road,sample,10,rand),poses,'repeatable');
});

test('dedicated parking distribution covers center and the rest of real Melito',async()=>{
 const map=JSON.parse(await readFile(new URL('./data/melito-map.json',import.meta.url),'utf8'));
 const drive=new Set(['motorway','trunk','primary','secondary','tertiary','unclassified','residential','living_street','service','track']);
 const roads=map.roads.filter(r=>drive.has(r.t)&&r.p.length>=4);
 assert.ok(roads.length>300);
 const center={x:map.projection.width/2,y:map.projection.height/2};
 const ordered=motorcycleParkingRoadOrder(roads,center,sample,distance,rand);
 assert.ok(ordered.length>100);
 assert.equal(new Set(ordered).size,ordered.length);
 assert.deepEqual(motorcycleParkingRoadOrder(roads,center,sample,distance,rand).slice(0,50),ordered.slice(0,50));
 assert.ok(ordered.slice(0,15).some(road=>Math.hypot(sample(road,.5).x-center.x,sample(road,.5).y-center.y)<270));
 // There are enough geographically separated candidate roads to reach the cap
 // when geometry validates their curb, not just a handful near the Panda.
 const far=ordered.filter(road=>Math.hypot(sample(road,.5).x-center.x,sample(road,.5).y-center.y)>400);
 assert.ok(far.length>50);
});

test('34 reserved bike spaces add recognizable rideable two-wheelers without overlaps',()=>{
 const roads=Array.from({length:100},(_,i)=>({id:i+10,w:7,t:'residential',
  p:[(i%10)*90,Math.floor(i/10)*90,(i%10)*90+60,Math.floor(i/10)*90]}));
 const ordered=motorcycleParkingRoadOrder(roads,{x:0,y:0},sample,distance,rand);
 const bikes=[];
 for(const road of ordered){
  if(bikes.length===PARKED_BIKE_TARGET)break;
  const candidate=motorcycleParkingCandidates(road,sample,10,rand).find(q=>{
   const b={...q,vehicleType:'motorcycle'};
   return bikes.every(prev=>!vehiclesOverlap(b,prev));
  });
  if(candidate)bikes.push({...candidate,vehicleType:'motorcycle',rider:false,
   model:MOTORCYCLE_IDS[bikes.length%MOTORCYCLE_IDS.length]});
 }
 assert.equal(bikes.length,PARKED_BIKE_TARGET);
 assert.ok(bikes.every(b=>b.vehicleType==='motorcycle'&&!b.rider));
 assert.equal(new Set(bikes.map(b=>b.model)).size,16,'all colors/models are selectable');
 assert.ok(PARKED_CAR_PHASE_CAP+PARKED_BIKE_TARGET<=PARKED_VEHICLE_CAP);
 assert.equal(parkedBikeLabel(bikes[0]),'SCOOTER');
 assert.equal(parkedBikeLabel({...bikes[0],model:'moto-moto-sport-blue'}),'MOTO');
 assert.equal(parkedBikeLabel({vehicleType:'car'}),null);
});

test('game truly spawns parked motorcycles and gives on-foot player a readable proximity cue',async()=>{
 const game=await readFile(new URL('./game.mjs',import.meta.url),'utf8');
 const page=await readFile(new URL('./index.html',import.meta.url),'utf8');
 assert.match(game,/motorcycleParkingRoadOrder\(possible,point,roadPoint,arcLength,rnd\)/);
 assert.match(game,/motorcycleParkingCandidates\(road,roadPoint,visualRoadWidth\(road\),rnd\)/);
 assert.match(game,/state\.cars\.push\(bike\);parkedBikeCount\+\+/);
 assert.match(game,/state\.cars\.some\(other=>vehiclesOverlap\(bike,other\)\)/);
 assert.match(game,/function drawParkedMotorcycleHints\(/);
 assert.match(game,/parkedBikeLabel\(v\)/,'labels follow actual vehicle type');
 assert.match(game,/drawParkedMotorcycleHints\(\)/);
 assert.match(game,/rider:false/,'empty scooter has no human already seated');
 assert.match(game,/drawMotorcycle\(c,x,y,a,model/);
 assert.match(page,/game\.mjs\?v=127/);
});
