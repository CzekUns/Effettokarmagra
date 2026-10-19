import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {stepVehicle,applyGrip,handlingProfile,CAR_HANDLING,MOTORCYCLE_HANDLING,SCOOTER_HANDLING,MOTO_HANDLING} from './vehicle-handling.mjs';
import {stepDriving} from './driving-controls.mjs';
import {stepMotorcycle} from './motorcycles.mjs';

const dt=1/60;
const accelTime=(p,target)=>{let s=0,a=0,t=0;while(s<target&&t<20){({speed:s,angle:a}=stepVehicle(s,a,{x:0,y:-1},false,dt,false,p));t+=dt;}return t;};
const topSpeed=p=>{let s=0,a=0;for(let i=0;i<900;i++)({speed:s,angle:a}=stepVehicle(s,a,{x:0,y:-1},false,dt,false,p));return s;};
const brakeDistance=(p,v0,wet=0)=>{let s=v0,a=0,d=0;for(let i=0;i<900&&s>0;i++){({speed:s,angle:a}=stepVehicle(s,a,{x:0,y:0},false,dt,true,p,wet));d+=Math.max(0,s)*dt;}return d;};
const turnAt=(p,speed)=>{let s=speed,a=0;for(let i=0;i<60;i++){({speed:s,angle:a}=stepVehicle(s,a,{x:1,y:-.5},false,dt,false,p));}return a;};
const car=handlingProfile({model:'panda-modern-white'}),scooter=handlingProfile({vehicleType:'motorcycle',model:'moto-scooter-sh-red'}),moto=handlingProfile({vehicleType:'motorcycle',model:'moto-moto-sport-blue'});

test('Q10 without a profile the old car and motorcycle physics are untouched',()=>{
 let seed=11;const r=()=>{seed=(seed*1103515245+12345)>>>0;return seed/4294967295;};
 for(let i=0;i<3000;i++){
  const s=(r()-.3)*50,a=(r()-.5)*6,axis={x:(r()-.5)*2,y:(r()-.5)*2},hb=r()<.2,step=r()*.06,sb=r()<.2;
  assert.deepEqual(stepDriving(s,a,axis,hb,step,sb),stepVehicle(s,a,axis,hb,step,sb,CAR_HANDLING));
  assert.deepEqual(stepMotorcycle(s,a,axis,hb,step,sb),stepVehicle(s,a,axis,hb,step,sb,MOTORCYCLE_HANDLING));
 }
 assert.equal(handlingProfile({model:'qualcosa-di-nuovo'}),CAR_HANDLING);
 assert.equal(handlingProfile({vehicleType:'motorcycle',model:'boh'}),MOTORCYCLE_HANDLING);
});

test('Q10 car, scooter and motorbike feel different: pick-up, top speed, brakes and steering',()=>{
 assert.equal(scooter,SCOOTER_HANDLING);assert.equal(moto,MOTO_HANDLING);
 assert.ok(topSpeed(scooter)<topSpeed(moto)&&topSpeed(moto)<topSpeed(car),'scooter < moto < car at the top end');
 assert.ok(accelTime(moto,20)<accelTime(scooter,20),'the motorbike pulls harder than the scooter');
 assert.ok(brakeDistance(moto,20)<brakeDistance(car,20),'a bike stops shorter than a car');
 assert.ok(turnAt(scooter,10)>turnAt(moto,10),'the scooter is the most nimble');
 assert.ok(turnAt(moto,28)<turnAt(moto,10),'every vehicle steers less at speed');
 const punto=handlingProfile({model:'punto-188-red'}),uno=handlingProfile({model:'fiat-uno-1983-white'});
 assert.ok(topSpeed(punto)>topSpeed(uno)&&accelTime(punto,25)<accelTime(uno,25),'a Punto is livelier than an old Uno');
 assert.ok(turnAt(handlingProfile({model:'smart-fortwo-2007-red'}),10)>turnAt(car,10),'the Smart turns tighter');
});

test('Q10 wheel and pedals keep their rules on every vehicle: no gas from steering, brake never reverses, RETRO reverses',()=>{
 for(const p of [CAR_HANDLING,car,scooter,moto,handlingProfile({model:'seicento-1998-blue'})]){
  const still=stepVehicle(0,0,{x:1,y:0},false,.05,false,p);
  assert.deepEqual(still,{speed:0,angle:0},'steering alone neither moves nor pivots');
  let s=20;for(let i=0;i<120;i++)s=stepVehicle(s,0,{x:.6,y:-1},false,dt,true,p).speed;
  assert.equal(s,0,'service brake with gas held stops, and does not reverse');
  let back=0;for(let i=0;i<60;i++)back=stepVehicle(back,0,{x:0,y:1},false,dt,false,p).speed;
  assert.ok(back<0&&back>=-p.reverse,'RETRO moves backwards within its limit');
 }
});

test('Q10 wet roads (Q08) brake a little longer, never dramatically',()=>{
 for(const p of [car,scooter,moto]){
  const dry=brakeDistance(p,20),wet=brakeDistance(p,20,1);
  assert.ok(wet>dry*1.1&&wet<dry*1.35,p.kind+': '+dry.toFixed(1)+' m dry, '+wet.toFixed(1)+' m wet');
 }
});

function slide(p,{handbrakeFor=.6,wet=0,speed=25}={}){
 let s=speed,a=0,state={travel:0},max=0,trace=[];
 for(let i=0;i<150;i++){
  const handbrake=i*dt<handbrakeFor,steer=i*dt<handbrakeFor?1:0;
  ({speed:s,angle:a}=stepVehicle(s,a,{x:steer,y:-.4},handbrake,dt,false,p,wet));
  const g=applyGrip(state,{angle:a,speed:s,dt,handbrake,profile:p,wet,steer});
  state.travel=g.travel;s=g.speed;max=Math.max(max,Math.abs(g.slip));trace.push({t:i*dt,slip:Math.abs(g.slip),speed:s});
 }
 return {max,trace};
}

test('Q10 handbrake turns make the car slide, and it always grips again by itself',()=>{
 const run=slide(car);
 assert.ok(run.max>.3,'a real slide: '+run.max.toFixed(2)+' rad');
 assert.ok(run.max<=CAR_HANDLING.maxSlip+1e-9,'never a full spin');
 const after=run.trace.filter(q=>q.t>=.6+1);
 assert.ok(after.every(q=>q.slip<.05),'back in line within a second of letting go');
 assert.ok(run.trace.at(-1).speed>5,'the slide costs speed but does not stop the car');
 const wet=slide(car,{wet:1});
 const recovered=q=>q.trace.find(x=>x.t>.6&&x.slip<.05)?.t;
 assert.ok(recovered(wet)>=recovered(run),'on a wet road it takes a little longer to grip again');
 assert.ok(recovered(wet)<.6+1.6,'but it still recovers');
 assert.ok(slide(scooter).max<run.max,'a scooter barely slides');
});

test('Q10 no sliding in reverse, at walking pace or while the car rebounds',()=>{
 for(const speed of [-6,-1,0,2]){
  const g=applyGrip({travel:1},{angle:.3,speed,dt,handbrake:true,profile:car});
  assert.equal(g.slip,0);assert.equal(g.travel,.3,'travel follows the bonnet exactly');assert.equal(g.speed,speed);
 }
 const straight=applyGrip({travel:0},{angle:0,speed:30,dt,profile:car});
 assert.equal(straight.slip,0);assert.equal(straight.sliding,false);
});

test('Q10 game wiring: model profile and wet road passed to the physics, travel direction moves the car, marks and squeal',async()=>{
 const [game,audio]=await Promise.all(['game.mjs','city-audio.mjs'].map(f=>readFile(new URL('./'+f,import.meta.url),'utf8')));
 assert.match(game,/\(isMotorcycle\(car\)\?stepMotorcycle:stepDriving\)\(car\.speed\|\|0,car\.a,axes,pressed\.handbrake,dt,pressed\.brake,handlingProfile\(car\),state\.weather\?\.wetness\|\|0\)/);
 assert.match(game,/const nx=car\.x\+Math\.cos\(car\.travel\)\*speed\*dt,ny=car\.y\+Math\.sin\(car\.travel\)\*speed\*dt;/);
 assert.match(game,/car\.travel=bounce\.angle;car\.slip=0;/,'a rebound cancels the slide');
 assert.match(game,/if\(grip\.sliding&&speed>8\)addSkidMarks\(car\);/);
 assert.ok(game.indexOf('drawSkidMarks([x0,y0,x1,y1]);')<game.indexOf('drawCityPeople(c,state.people'),'marks on the ground, under people and cars');
 assert.match(game,/skid:car&&car\.speed>8\?Math\.min\(1,Math\.abs\(car\.slip\|\|0\)\/\.45\):0/);
 assert.match(audio,/skid:\{gain:interior\|\|!player\.inVehicle\?0:\.09\*clamp\(skid,0,1\)\}/);
});
