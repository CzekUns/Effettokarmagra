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
 // BF05: cambio automatico arcade — niente scatto: dopo 0,25 s si va ancora piano, dopo 2 s a
 // velocità da città, entro 10 s quasi in punta (prima si arrivava a 38 in 2 s).
 assert.ok(drive({x:0,y:-1},.25).speed<3,'soft start from a standstill');
 const city=drive({x:0,y:-1},2).speed;assert.ok(city>12&&city<30,'useful city speed after 2 s: '+city.toFixed(1));
 const flat=drive({x:0,y:-1},10).speed;assert.ok(flat>CAR_FORWARD_SPEED*.9&&flat<=CAR_FORWARD_SPEED,'near top speed within 10 s');
 assert.ok(drive({x:0,y:1}).speed>=-CAR_REVERSE_SPEED);
});

test('turning the steering wheel alone does NOT press the accelerator',()=>{
 const turn=drive({x:1,y:0},.8);
 assert.equal(turn.speed,0,'steering alone must not make the car move');
 assert.equal(turn.angle,0,'a stationary car does not pivot in place');
 const driven=drive({x:.7,y:-1},1);
 // BF05: con lo spunto progressivo in 1 s si arriva a ~9 (prima >20): resta vero che si muove e sterza.
 assert.ok(driven.speed>6&&driven.angle>.4);
 assert.ok(driven.speed<CAR_FORWARD_SPEED);
});

test('letting go slows down and the brake stops a moving car promptly',()=>{
 const coasting=stepDriving(20,0,{x:0,y:0},false,.05);
 const braking=stepDriving(20,0,{x:0,y:0},true,.05);
 assert.ok(coasting.speed<20&&coasting.speed>braking.speed);
 let speed=20;
 for(let i=0;i<30;i++)speed=stepDriving(speed,0,{x:0,y:0},true,1/60).speed;
 assert.ok(speed<5);
});

test('service brake is separate from accelerator, does not engage reverse, and works while steering',()=>{
 let speed=28;
 const brake=stepDriving(speed,0,{x:.8,y:-1},false,.05,true);
 assert.ok(brake.speed<speed);
 for(let i=0;i<20;i++)speed=stepDriving(speed,0,{x:.5,y:-1},false,.05,true).speed;
 assert.equal(speed,0,'the brake stops the car, even with accelerator still held');
 assert.equal(stepDriving(0,0,{x:0,y:0},false,.05,true).speed,0,
  'brake does not automatically reverse the car');
});
