import {test} from 'node:test';
import assert from 'node:assert/strict';
import {WALK_SPEED,RUN_SPEED,CAR_FORWARD_SPEED,CAR_REVERSE_SPEED,stepDriving} from './driving-controls.mjs';

function drive(axis,seconds=2){
 let speed=0,angle=0;
 for(let i=0;i<seconds*60;i++)({speed,angle}=stepDriving(speed,angle,axis,false,1/60));
 return {speed,angle};
}

test('walking and running are faster and the car reaches a useful city speed',()=>{
 assert.ok(WALK_SPEED>=8&&RUN_SPEED>WALK_SPEED);
 assert.ok(drive({x:0,y:-1}).speed>CAR_FORWARD_SPEED*.95);
 assert.ok(drive({x:0,y:1}).speed>=-CAR_REVERSE_SPEED);
});

test('sideways stick both moves and steers, diagonal steering remains controllable',()=>{
 const turn=drive({x:1,y:0},.8);
 assert.ok(turn.speed>10,'sideways input should move the car forward');
 assert.ok(turn.angle>.3,'sideways input should turn the car');
 const diagonal=drive({x:.7,y:-.7},1);
 assert.ok(diagonal.speed>20&&diagonal.angle>.4);
 assert.ok(diagonal.speed<CAR_FORWARD_SPEED);
});

test('letting go slows down and the brake stops a moving car promptly',()=>{
 const coasting=stepDriving(20,0,{x:0,y:0},false,.05);
 const braking=stepDriving(20,0,{x:0,y:0},true,.05);
 assert.ok(coasting.speed<20&&coasting.speed>braking.speed);
 let speed=20;
 for(let i=0;i<30;i++)speed=stepDriving(speed,0,{x:0,y:0},true,1/60).speed;
 assert.ok(speed<5);
});
