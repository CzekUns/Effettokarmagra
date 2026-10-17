import {test} from 'node:test';
import assert from 'node:assert/strict';
import {reboundCar,advanceRecoil} from './car-rebound.mjs';
import {stepDriving} from './driving-controls.mjs';

test('a forward wall impact moves the car to a safe pose and gives a brief reverse impulse',()=>{
 const hit=reboundCar({x:0,y:0},22,0,(x)=>x>-.4);
 assert.ok(hit.x<-.4&&hit.x>=-1.4);
 assert.equal(hit.angle,0);
 assert.ok(hit.speed<0&&hit.speed>=-5);
 assert.ok(hit.recoil>0);
 const after=advanceRecoil(hit.speed,hit.recoil,.05);
 assert.ok(after.speed>hit.speed&&after.speed<=0);
 assert.ok(after.recoil<hit.recoil);
});

test('recoil avoids a nearby obstacle and stops if no safe separation exists',()=>{
 const around=reboundCar({x:0,y:0},15,0,(x,y)=>x>-.4||y>=0);
 assert.ok(around.x<-.4&&around.y<0,'tries the open side after a blocked straight retreat');
 const trapped=reboundCar({x:0,y:0},15,0,()=>true);
 assert.equal(trapped.speed,0);
 assert.equal(trapped.recoil,0);
 assert.equal(trapped.x,0);
 const reverse=reboundCar({x:0,y:0},-12,0,x=>x<.4);
 assert.ok(reverse.x>.4&&reverse.speed>0,'reverse impact recoils forward');
});

test('holding acceleration against a wall never penetrates it or leaves the car frozen on contact',()=>{
 let car={x:-3,y:0,angle:0,speed:18,recoil:0},hits=0,released=false;
 const blocked=x=>x>0;
 for(let i=0;i<150;i++){
  const dt=1/60;
  const motion=car.recoil>0?advanceRecoil(car.speed,car.recoil,dt):stepDriving(car.speed,0,{x:0,y:-1},false,dt);
  car.speed=motion.speed;car.recoil=motion.recoil||0;
  const next=car.x+car.speed*dt;
  if(blocked(next)){
   if(car.recoil){car.speed=0;car.recoil=0;}
   else{const bounce=reboundCar(car,car.speed,0,blocked);Object.assign(car,bounce);hits++;}
  }else car.x=next;
  assert.ok(car.x<=0,'vehicle must not enter the wall');
  if(car.speed<0&&car.x<-.4)released=true;
 }
 assert.ok(hits>0&&hits<12,'impacts are separated by a short recoil');
 assert.ok(released,'car moves away from the wall while the player keeps pressing forward');
});
