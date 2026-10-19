import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {daylightAt,windowIsLit,paintLightMap,paintGlows,headlightLights,vehicleLamps,litWindowPath,nightQuality,NIGHT_DARKNESS,DAY_KEYFRAMES} from './daylight.mjs';
import {advanceNpcClock} from './npc-agenda.mjs';
import {drawCityBuildings,facadeWindowPanes,prepareCityStyles} from './city-art.mjs';
import {drawStreetProps} from './visuals.mjs';

// Canvas finto che registra le chiamate e segue la trasformazione affine corrente.
function recordingCanvas(){
 const calls=[];let m=[1,0,0,1,0,0];const stack=[];const state={fillStyle:'#000',globalCompositeOperation:'source-over',globalAlpha:1};
 const mul=(a,b)=>[a[0]*b[0]+a[2]*b[1],a[1]*b[0]+a[3]*b[1],a[0]*b[2]+a[2]*b[3],a[1]*b[2]+a[3]*b[3],a[0]*b[4]+a[2]*b[5]+a[4],a[1]*b[4]+a[3]*b[5]+a[5]];
 const apply=(x,y)=>[m[0]*x+m[2]*y+m[4],m[1]*x+m[3]*y+m[5]];
 const api={
  save(){stack.push([m,{...state}]);},restore(){const [mm,st]=stack.pop();m=mm;Object.assign(state,st);},
  translate(x,y){m=mul(m,[1,0,0,1,x,y]);},scale(x,y){m=mul(m,[x,0,0,y,0,0]);},
  rotate(a){m=mul(m,[Math.cos(a),Math.sin(a),-Math.sin(a),Math.cos(a),0,0]);},
  transform(a,b,c,d,e,f){m=mul(m,[a,b,c,d,e,f]);},setTransform(a,b,c,d,e,f){m=[a,b,c,d,e,f];},
  fillRect(x,y,w,h){calls.push({op:'fillRect',style:state.fillStyle,comp:state.globalCompositeOperation,alpha:state.globalAlpha,corners:[apply(x,y),apply(x+w,y),apply(x+w,y+h),apply(x,y+h)]});},
  arc(x,y,r){calls.push({op:'arc',comp:state.globalCompositeOperation,at:apply(x,y),r});},
  fill(){calls.push({op:'fill',style:state.fillStyle,comp:state.globalCompositeOperation});},
  createRadialGradient(){const stops=[];return {stops,addColorStop(o,c){stops.push([o,c]);}};},
  createLinearGradient(){return {addColorStop(){}};},
  clearRect(){calls.push({op:'clear'});}
 };
 const ctx=new Proxy(api,{get(o,k){if(k in o)return o[k];if(k in state)return state[k];return ()=>{};},set(o,k,v){state[k]=v;return true;}});
 return {ctx,calls};
}

test('Q04 light is a pure function of the clock: repeatable, daily, and paused with the clock',()=>{
 for(const m of [0,333,720,1111,1290,1439])assert.deepEqual(daylightAt(m),daylightAt(m+1440),'same hour on another day');
 assert.deepEqual(daylightAt(1170.5),daylightAt(1170.5));
 const before=1170;
 assert.deepEqual(daylightAt(advanceNpcClock(before,.05,{paused:true})),daylightAt(before),'pause freezes the light');
 assert.deepEqual(daylightAt(advanceNpcClock(before,.05,{interior:true})),daylightAt(before),'and so does the bank interior');
});

test('Q04 day, dusk, night and dawn: gradual and in the right order',()=>{
 const noon=daylightAt(12*60),night=daylightAt(23*60+30);
 assert.equal(noon.darkness,0);assert.equal(noon.lamps,0);assert.equal(noon.headlights,0);assert.equal(noon.phase,'giorno');
 assert.equal(night.darkness,NIGHT_DARKNESS);assert.equal(night.lamps,1);assert.equal(night.headlights,1);assert.equal(night.phase,'notte');
 assert.ok(NIGHT_DARKNESS<=.6,'night never hides the city: the veil stays translucent');
 let previous=daylightAt(0);
 for(let m=1;m<=1440;m++){
  const now=daylightAt(m);
  assert.ok(Math.abs(now.darkness-previous.darkness)<=.012,'no sudden jump at minute '+m);
  assert.ok(now.tint.every((v,k)=>Math.abs(v-previous.tint[k])<=12),'colour shifts slowly at minute '+m);
  assert.ok(Math.abs(now.windowShare-previous.windowShare)<=.01);
  previous=now;
 }
 for(let m=17*60+10;m<21*60;m++)assert.ok(daylightAt(m+1).darkness>=daylightAt(m).darkness-1e-12,'dusk only darkens');
 for(let m=4*60+40;m<7*60+20;m++)assert.ok(daylightAt(m+1).darkness<=daylightAt(m).darkness+1e-12,'dawn only brightens');
 const dusk=daylightAt(18*60+30);
 assert.ok(dusk.darkness>.1&&dusk.darkness<.3&&dusk.tint[0]>dusk.tint[2],'a warm sunset before the night');
 assert.ok(daylightAt(19*60+30).lamps>.5,'lamps on while there is still some light');
 assert.equal(daylightAt(7*60+30).lamps,0,'and off after dawn');
 assert.ok(DAY_KEYFRAMES[0][0]===0&&DAY_KEYFRAMES.at(-1)[0]===1440);
});

test('Q04 windows switch on one by one: deterministic, nested, in proportion',()=>{
 const seeds=[...Array(4000).keys()].map(i=>i*7919+13);
 for(const share of [.1,.3,.55]){
  const lit=seeds.filter(s=>windowIsLit(s,share)).length/seeds.length;
  assert.ok(Math.abs(lit-share)<.03,'about '+share+' of the windows: '+lit.toFixed(3));
 }
 for(const s of seeds.slice(0,500))if(windowIsLit(s,.2))assert.equal(windowIsLit(s,.4),true,'a lit window stays lit as more switch on');
 assert.ok(daylightAt(21*60).windowShare>daylightAt(3*60).windowShare,'more lights in the evening than in the small hours');
});

test('Q04 rendering smoke: the veil is painted, lights are cut out of it, glows are additive',()=>{
 const {ctx,calls}=recordingCanvas();
 const map={width:200,height:120,getContext:()=>ctx};
 const light=daylightAt(23*60);
 const lights=[{x:10,y:10,r:8,strength:1},{x:30,y:5,r:6,strength:.5},{x:0,y:0,r:5,strength:0}];
 const drawn=paintLightMap(map,{scale:2,offsetX:5,offsetY:7},light,lights);
 assert.equal(drawn,2,'lights at zero strength are skipped');
 const veil=calls.find(c=>c.op==='fillRect');
 assert.ok(veil&&veil.style.startsWith('rgba(18,26,60,0.58'),'night veil with its colour and opacity');
 const cuts=calls.filter(c=>c.op==='arc');
 assert.equal(cuts.length,2);assert.ok(cuts.every(c=>c.comp==='destination-out'),'lights remove darkness');
 assert.deepEqual(cuts[0].at,[25,27],'world -> light map transform applied');
 assert.equal(ctx.globalCompositeOperation,'source-over','composite restored');
 const day=recordingCanvas(),noLights=paintLightMap({width:4,height:4,getContext:()=>day.ctx},{scale:1,offsetX:0,offsetY:0},daylightAt(720),[]);
 assert.equal(noLights,0);
 const glow=recordingCanvas();
 paintGlows(glow.ctx,[{x:1,y:2,r:3,strength:1}]);
 assert.ok(glow.calls.some(c=>c.op==='fill'&&c.comp==='lighter'));
 assert.equal(glow.ctx.globalCompositeOperation,'source-over');
});

test('Q04 headlights shine ahead of the vehicle, tail lights behind; nothing by day',()=>{
 const car={x:100,y:50,a:Math.PI/2,vehicleType:'car'},moto={...car,vehicleType:'motorcycle'};
 assert.deepEqual(headlightLights(car,0),[]);assert.deepEqual(vehicleLamps(car,0),[]);
 const [cone]=headlightLights(car,1);
 assert.ok(cone.y-car.y>3.2,'cone centred in front of the bonnet');
 assert.ok(Math.abs(cone.x-car.x)<1e-9);
 assert.ok(cone.y-car.y-cone.r*cone.stretch>-3.2,'and it does not reach behind the car');
 const lamps=vehicleLamps(car,1);
 assert.equal(lamps.filter(l=>l.color==='255,52,36').length,2);
 assert.ok(lamps.filter(l=>l.color==='255,52,36').every(l=>l.y<car.y),'red lights at the rear');
 assert.equal(vehicleLamps(moto,1).length,2,'a scooter has one headlight and one tail light');
});

test('Q04 lit windows are exactly the panes painted on the facades',()=>{
 const b={id:4242,h:12,p:[0,0,30,0,30,14,0,14,0,0]};
 prepareCityStyles([b],[]);
 b.art.type='apartment';
 const {ctx,calls}=recordingCanvas();
 drawCityBuildings(ctx,[b],3);
 const glass=calls.filter(c=>c.op==='fillRect'&&['#273e43','#344c50','#a9664c'].includes(c.style));
 const panes=facadeWindowPanes(b);
 assert.ok(panes.length>=4,'the test building has windows');
 assert.equal(glass.length,panes.length,'one lit pane per painted pane');
 for(const pane of panes){
  const match=glass.some(g=>g.corners.every(([x,y],k)=>Math.hypot(x-pane.quad[k*2],y-pane.quad[k*2+1])<1e-6));
  assert.ok(match,'pane '+pane.seed+' sits on a painted window');
 }
 assert.equal(facadeWindowPanes(b),panes,'cached per building');
 assert.equal(litWindowPath(panes,new Map(),.5),null,'no Path2D outside the browser: nothing drawn, no error');
 let added=0;globalThis.Path2D=class{moveTo(){added++;}lineTo(){}closePath(){}};
 try{
  const cache=new Map(),path=litWindowPath(panes,cache,1);
  assert.ok(path&&added===panes.length,'all windows at full share');
  assert.equal(litWindowPath(panes,cache,1),path,'reused while the share step is the same');
 }finally{delete globalThis.Path2D;}
});

test('Q04 game wiring: lamps are the real lamp props, night drawn over the world but under hints',async()=>{
 const {ctx,calls}=recordingCanvas();
 const lampKinds=[];
 for(let kind=0;kind<15;kind++){
  calls.length=0;drawStreetProps(ctx,[{x:0,y:0,a:0,kind}],2);
  if(calls.some(c=>c.op==='fillRect'&&c.style==='#ffe5a4'))lampKinds.push(kind);
 }
 const [game,html]=await Promise.all(['game.mjs','index.html'].map(f=>readFile(new URL('./'+f,import.meta.url),'utf8')));
 assert.deepEqual(lampKinds,JSON.parse('['+game.match(/LAMP_KINDS=new Set\(\[([\d,]+)\]\)/)[1]+']'),'lit exactly where a lamp is drawn');
 assert.match(game,/import \{daylightAt,[^}]*\} from '\.\/daylight\.mjs\?v=\d+'/);
 const order=['drawPlayer();','drawNightLighting([x0,y0,x1,y1]','drawParkedMotorcycleHints();','drawBankEntrance(c,bank,state.clock)'].map(s=>game.indexOf(s,game.indexOf('function draw(dt=0)')));
 assert.ok(order.every((v,i)=>v>0&&(i===0||v>order[i-1])),'world, then night, then readable hints and bank marker');
 assert.match(game,/if\(light\.darkness<\.004\)return;/,'daytime frames skip all lighting work');
 assert.match(game,/state\.nightQuality!==0\)\{\n  c\.save\(\);c\.fillStyle='#ffd27a'/,'lit windows obey the night quality switch');
 assert.match(game,/get\('ora'\)/,'?ora=HH:MM sets the starting time for repeatable checks');
 assert.match(game,/npcClockMinutes:START_MINUTE/);
 assert.ok(Number((html.match(/game\.mjs\?v=(\d+)/)||[])[1])>=143);
});

test('Q04 a struggling phone gives up lit windows first, and gets them back when it recovers',()=>{
 assert.equal(nightQuality(undefined,1/60),1,'full detail by default');
 assert.equal(nightQuality(1,1/50),1,'50 fps is fine');
 assert.equal(nightQuality(1,1/25),0,'25 fps at night: windows off');
 assert.equal(nightQuality(0,1/40),0,'hysteresis: not back at 40 fps');
 assert.equal(nightQuality(0,1/50),1,'back above 45 fps');
 assert.equal(nightQuality(1,0),1,'paused frames change nothing');
});
