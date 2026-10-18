import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {WHEEL_MAX_ANGLE,pointerWheelAngle,turnSteeringWheel,steeringInput,returnSteeringWheel} from './steering-wheel.mjs';
import {stepDriving} from './driving-controls.mjs';
import {stepMotorcycle} from './motorcycles.mjs';

test('finger movement rotates a true wheel with positive right and negative left steering',()=>{
 const top=pointerWheelAngle(60,10,60,60);
 const right=pointerWheelAngle(110,60,60,60);
 const left=pointerWheelAngle(10,60,60,60);
 assert.ok(turnSteeringWheel(0,top,right)>0,'clockwise turn goes right');
 assert.ok(turnSteeringWheel(0,top,left)<0,'counterclockwise turn goes left');
 assert.ok(Math.abs(steeringInput(WHEEL_MAX_ANGLE)-1)<1e-8);
 assert.equal(steeringInput(-WHEEL_MAX_ANGLE),-1);
 assert.ok(turnSteeringWheel(0,top,top+10)<=WHEEL_MAX_ANGLE);
});
test('wheel rotation wraps across the atan2 discontinuity and returns to center on release',()=>{
 const start=Math.PI-.05,end=-Math.PI+.06;
 const angle=turnSteeringWheel(.2,start,end);
 assert.ok(angle>.2&&angle<.4,'boundary crossing must not jump to opposite lock');
 let current=WHEEL_MAX_ANGLE;
 for(let i=0;i<60;i++)current=returnSteeringWheel(current,1/60);
 assert.ok(Math.abs(current)<.02,'wheel self-centers smoothly after a second');
});
test('car and motorcycle cannot accelerate by steering, and brake overrules gas pedal',()=>{
 assert.equal(stepDriving(0,0,{x:1,y:0},false,.05).speed,0);
 assert.equal(stepMotorcycle(0,0,{x:1,y:0},false,.05).speed,0);
 const car=stepDriving(24,0,{x:1,y:-1},false,.05,true);
 const bike=stepMotorcycle(22,0,{x:1,y:-1},false,.05,true);
 assert.ok(car.speed<24&&bike.speed<22);
 assert.ok(stepDriving(0,0,{x:.8,y:-1},false,.05).speed>0);
 assert.ok(stepMotorcycle(0,0,{x:.8,y:-1},false,.05).speed>0);
});
test('responsive UI swaps thumbstick for steering wheel only while riding and has stacked pedals',async()=>{
 const [html,game]=await Promise.all([
  readFile(new URL('./index.html',import.meta.url),'utf8'),
  readFile(new URL('./game.mjs',import.meta.url),'utf8')
 ]);
 assert.match(html,/id="steering-wheel"/);
 assert.match(html,/id="steering-face"/);
 assert.match(html,/class="pedals"[\s\S]*id="accelerator"[\s\S]*id="brake"/);
 assert.match(html,/\.stage\.driving \.touch-stick\{display:none!important\}/);
 assert.match(html,/\.stage\.driving \.steering-wheel\{display:flex\}/);
 assert.match(html,/\.controls\.driving \.pedals\{display:flex\}/);
 assert.match(html,/game\.mjs\?v=135/);
 assert.match(game,/const axes=driveAxes\(\)/);
 assert.match(game,/pressed\.handbrake,dt,pressed\.brake/);
 assert.match(game,/turnSteeringWheel\(wheel\.angle,wheel\.pointerAngle,next\)/);
 assert.match(game,/document\.querySelector\('\.controls'\)\?\.classList\.toggle\('driving',driving\)/);
});
