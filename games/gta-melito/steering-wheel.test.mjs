import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {WHEEL_MAX_ANGLE,pointerWheelAngle,turnSteeringWheel,steeringInput,returnSteeringWheel} from './steering-wheel.mjs';
import {stepDriving} from './driving-controls.mjs';
import {stepMotorcycle} from './motorcycles.mjs';
import {formatNpcClock,npcWeekday} from './npc-agenda.mjs';
import {cityEventAction} from './city-events.mjs';
import {nearestShop,boostSecondsLeft} from './local-shops.mjs';

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
 assert.match(html,/class="pedals"[\s\S]*id="brake"[\s\S]*id="accelerator"/,'BF06: FRENO sopra ACCELERA');
 assert.match(html,/\.stage\.driving \.touch-stick\{display:none!important\}/);
 assert.match(html,/\.stage\.driving \.steering-wheel\{display:flex\}/);
 assert.match(html,/\.controls\.driving \.pedals\{display:flex\}/);
 assert.ok(Number((html.match(/game\.mjs\?v=(\d+)/)||[])[1])>=139,'game.mjs deve essere almeno alla v=139');
 assert.match(game,/const axes=driveAxes\(\)/);
 assert.match(game,/pressed\.handbrake,dt,pressed\.brake/);
 assert.match(game,/turnSteeringWheel\(wheel\.angle,wheel\.pointerAngle,next\)/);
 assert.match(game,/document\.querySelector\?\.\('\.controls'\)\?\.classList\.toggle\('driving',driving\)/);
});

test('regression: vehicle state reaches the actual stage element, hiding the stuck joystick',async()=>{
 const [html,game]=await Promise.all([
  readFile(new URL('./index.html',import.meta.url),'utf8'),
  readFile(new URL('./game.mjs',import.meta.url),'utf8')
 ]);
 assert.match(html,/<div class="stage" id="stage">/,
  'the stage must have the exact ID looked up by updateHud');
 assert.match(game,/const stage=\$\('stage'\)\|\|document\.querySelector\?\.\('\.stage'\)/);
 assert.match(game,/stage\?\.classList\.toggle\('driving',driving\)/);
 assert.match(game,/stage\?\.classList\.toggle\('interior',!!state\.bankInterior(?:\|\|!!state\.shopInterior)?\)/);
 // Both visual modes depend on this CSS class, not on the keyboard state.
 assert.match(html,/\.stage\.driving \.touch-stick\{display:none!important\}/);
 assert.match(html,/\.stage\.driving \.steering-wheel\{display:flex\}/);
 assert.match(html,/\.controls\.driving \.pedals\{display:flex\}/);
});

test('real HUD switches visible controls between car, walking and interior scenes',async()=>{
 const [html,game]=await Promise.all([
  readFile(new URL('./index.html',import.meta.url),'utf8'),
  readFile(new URL('./game.mjs',import.meta.url),'utf8')
 ]);
 const ids=new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(match=>match[1]));
 assert.ok(ids.has('stage'),'the stage looked up by game.mjs must exist');
 const element=()=>({
  textContent:'',
  classes:new Set(),
  classList:{
   _owner:null,
   toggle(name,enabled){
    if(enabled)this._owner.classes.add(name);else this._owner.classes.delete(name);
   }
  },
  setAttribute(){}
 });
 const nodes=new Map([...ids].map(id=>{
  const node=element();node.classList._owner=node;return [id,node];
 }));
 const controls=element();controls.classList._owner=controls;
 const document={
  getElementById:id=>nodes.get(id)||null,
  querySelector:selector=>selector==='.controls'?controls:nodes.get('stage')
 };
 const state={player:{x:0,y:0,a:0,car:0},cars:[{speed:0,a:0,vehicleType:'car'}],
  bankInterior:null,roadGrid:null,bankEntrances:[],zoom:6.6};
 const start=game.indexOf('function updateHud(){');
 const end=game.indexOf('\nfunction drawLine(',start);
 assert.ok(start>0&&end>start);
 const update=new Function('state','document','pressed','nearestBankEntrance',
  'nearestEnterableVehicle','moveAxes','describeCameraZoom','interiorZoom',
  'isMotorcycle','nearest','formatNpcClock','cityEventAction','nearestShop','boostSecondsLeft','npcWeekday','nearestCounter','footShopTarget',[
   'const $=id=>document.getElementById(id);',
   game.slice(start,end),
   'return updateHud;'
  ].join('\n'))(state,document,{run:false},()=>null,()=>null,
  ()=>({x:0,y:0}),()=>'',()=>6.6,()=>false,()=>null,formatNpcClock,cityEventAction,nearestShop,boostSecondsLeft,npcWeekday,p=>nearestShop([],p),()=>null);
 update();
 assert.ok(nodes.get('stage').classes.has('driving'),'in the car the wheel must appear');
 assert.ok(controls.classes.has('driving'),'in the car the pedals must appear');
 state.player.car=-1;update();
 assert.ok(!nodes.get('stage').classes.has('driving'),'walking joystick returns after dismount');
 assert.ok(!controls.classes.has('driving'),'gas and brake hide on foot');
 state.bankInterior={bank:{n:'BANCA'}};update();
 assert.ok(nodes.get('stage').classes.has('interior'),'interior cutaway mode must be active');
 assert.ok(!nodes.get('stage').classes.has('driving'),'no wheel inside a bank');
});

test('retromarcia has its own hold button below the accelerator and smaller touch dimensions',async()=>{
 const [html,game]=await Promise.all([
  readFile(new URL('./index.html',import.meta.url),'utf8'),
  readFile(new URL('./game.mjs',import.meta.url),'utf8')
 ]);
 assert.match(html,/id="brake"[^>]*>FRENO<\/button><button id="accelerator"[^>]*>ACCELERA<\/button><button id="reverse"[^>]*>RETRO<\/button>/);
 assert.match(html,/\.touch-actions \.pedals button\{width:clamp\(56px,12vw,72px\);height:clamp\(50px,11vw,64px\)/);
 assert.match(html,/\.touch-actions button\{border-radius:50%;width:clamp\(56px,13vw,76px\)/);
 assert.match(html,/\.touch-actions \.pedals #reverse\{/);
 assert.match(game,/for\(const \[id,key\] of \[\['accelerator','accelerate'\],\['brake','brake'\],\['reverse','reverse'\]/);
 assert.match(game,/for\(const id of \['touch-stick','steering-wheel','action','sprint','accelerator','brake','reverse'\]/);
 assert.match(game,/pressed\.reverse=false/,'reverse must clear on dismount, pause and focus loss');
});

test('reverse pedal actually reverses car and motorcycle; opposing pedals cancel',async()=>{
 const game=await readFile(new URL('./game.mjs',import.meta.url),'utf8');
 const begin=game.indexOf('function driveAxes(){');
 const end=game.indexOf('\nfunction resetDrivingControls()',begin);
 assert.ok(begin>=0&&end>begin);
 const pressed={accelerate:false,up:false,reverse:false,down:false,left:false,right:false};
 const driveAxes=new Function('pressed','wheel','steeringInput',[
  game.slice(begin,end),'return driveAxes;'
 ].join('\n'))(pressed,{angle:0},steeringInput);
 assert.equal(driveAxes().y,0);
 pressed.reverse=true;
 assert.equal(driveAxes().y,1,'reverse pedal feeds the drivetrain independently of the wheel');
 let car=0,bike=0;
 for(let i=0;i<15;i++){
  car=stepDriving(car,0,driveAxes(),false,.05).speed;
  bike=stepMotorcycle(bike,0,driveAxes(),false,.05).speed;
 }
 assert.ok(car< -4,'car must travel backwards when RETRO is held');
 assert.ok(bike< -.5,'motorcycle must travel backwards when RETRO is held');
 pressed.accelerate=true;
 assert.equal(driveAxes().y,0,'gas and reverse together must be neutral');
 pressed.reverse=false;
 assert.equal(driveAxes().y,-1,'gas resumes normally after RETRO release');
 assert.ok(stepDriving(-2,0,driveAxes(),false,.05).speed> -2);
 pressed.accelerate=false;
 pressed.down=true;
 assert.equal(driveAxes().y,1,'keyboard S continues to work as reverse');
});

test('BF06 touch pedals read FRENO, ACCELERA, RETRO from the top with unchanged ids, labels, colours and bindings',async()=>{
 const [html,game]=await Promise.all([
  readFile(new URL('./index.html',import.meta.url),'utf8'),
  readFile(new URL('./game.mjs',import.meta.url),'utf8')
 ]);
 const block=html.match(/<div class="pedals"[^>]*>([\s\S]*?)<\/div>/)[1];
 const order=[...block.matchAll(/<button id="([^"]+)"[^>]*aria-label="([^"]+)"[^>]*>([^<]+)<\/button>/g)].map(m=>[m[1],m[3],m[2]]);
 assert.deepEqual(order.map(o=>o[0]),['brake','accelerator','reverse'],'top to bottom: brake, accelerator, reverse');
 assert.deepEqual(order.map(o=>o[1]),['FRENO','ACCELERA','RETRO']);
 assert.deepEqual(order.map(o=>o[2]),['Tieni premuto per frenare','Tieni premuto per accelerare','Tieni premuto per andare in retromarcia']);
 // the column stays a plain flex column: DOM order is the visual order
 assert.match(html,/\.pedals\{display:none;flex-direction:column;/);
 assert.doesNotMatch(html,/\.pedals[^{]*\{[^}]*(column-reverse|[{;]\s*order:)/,'no CSS reordering that would desync DOM and screen');
 for(const id of ['accelerator','brake','reverse'])assert.doesNotMatch(html,new RegExp('#'+id+'\\{[^}]*[{;]\\s*order:'),'no per-button order override (border: is not order:)');
 // colours unchanged: green accelerator, red brake, ochre reverse
 assert.match(html,/\.touch-actions \.pedals #accelerator\{border-color:#b6eac1;background:linear-gradient\(160deg,#3b8a57,#174c35\)\}/);
 assert.match(html,/\.touch-actions \.pedals #brake\{border-color:#f5b4a0;background:linear-gradient\(160deg,#b64e43,#762d2b\)\}/);
 // functions and keyboard unchanged
 assert.match(game,/for\(const \[id,key\] of \[\['accelerator','accelerate'\],\['brake','brake'\],\['reverse','reverse'\]/);
});
