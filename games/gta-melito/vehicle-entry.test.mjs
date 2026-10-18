import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {nearestEnterableVehicle,starterMotorcycleCandidates,CAR_ENTRY_RADIUS,MOTORCYCLE_ENTRY_RADIUS} from './vehicle-entry.mjs';

const bike=(x,y)=>({x,y,a:0,vehicleType:'motorcycle',model:'moto-scooter-sh-white'});
const car=(x,y)=>({x,y,a:0,vehicleType:'car',model:'panda-modern-white'});

test('same selection can enter a nearby scooter rather than a slightly closer Panda',()=>{
 const objects=[car(5,0),bike(5.5,0)];
 const picked=nearestEnterableVehicle(objects,{x:0,y:0});
 assert.equal(picked.index,1);
 assert.equal(picked.bike,true);
 assert.equal(picked.vehicle,objects[1]);
 assert.equal(nearestEnterableVehicle(objects,{x:5,y:0}).index,0,'car genuinely adjacent wins');
 assert.equal(nearestEnterableVehicle([car(2,0),bike(8.4,0)],{x:0,y:0}).index,0,'do not teleport to farther scooter');
 assert.equal(nearestEnterableVehicle([bike(7.5,0)],{x:0,y:0}).index,0);
 assert.equal(nearestEnterableVehicle([bike(9,0)],{x:0,y:0}),null);
 assert.equal(nearestEnterableVehicle([car(10,0)],{x:0,y:0}),null);
 assert.ok(MOTORCYCLE_ENTRY_RADIUS<CAR_ENTRY_RADIUS);
});

test('no vehicle or out-of-range vehicle keeps player on foot',()=>{
 assert.equal(nearestEnterableVehicle([],{x:0,y:0}),null);
 assert.equal(nearestEnterableVehicle([bike(NaN,0)],{x:0,y:0}),null);
 assert.equal(nearestEnterableVehicle([car(0,0)],{x:NaN,y:0}),null);
});

test('starter bike candidates are all in actual boarding range, opposite Panda first',()=>{
 const start={x:20,y:30,a:0},panda=car(23,36);
 const options=starterMotorcycleCandidates(start,panda,7.2);
 assert.ok(options.length>=8,'several safe placement alternatives');
 assert.ok(options.every(q=>Math.hypot(q.x-start.x,q.y-start.y)<MOTORCYCLE_ENTRY_RADIUS));
 assert.ok(options[0].y<start.y,'opposite of parked Panda on positive side');
 const q=options[0];
 assert.equal(nearestEnterableVehicle([panda,bike(q.x,q.y)],start)?.bike,true);
});

test('legacy procedural motorcycle removed, and UI shares exact board selection with keyboard',async()=>{
 const game=await readFile(new URL('./game.mjs',import.meta.url),'utf8');
 const art=await readFile(new URL('./city-art.mjs',import.meta.url),'utf8');
 const page=await readFile(new URL('./index.html',import.meta.url),'utf8');
 assert.equal(game.split('nearestEnterableVehicle(state.cars,p)').length-1,3,
   'E, touch HUD and near-bike label share the same selection');
 assert.match(game,/p\.car=target\.index/);
 assert.match(game,/starterMotorcycleCandidates\(point,nearCar,visualRoadWidth\(chosen\.q\)\)/);
 assert.ok(!art.includes('if(type===5)'), 'old procedural scooter no longer appears among normal car variants');
 assert.match(game,/isMotorcycle\(vehicle\)/);
 assert.match(game,/drawMotorcycle\(c,x,y,a,model/);
 assert.ok(game.includes('city-art.mjs?v=125'));
 assert.ok(page.includes('game.mjs?v=136'));
});
