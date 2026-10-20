import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createCityAudio,audioMix,engineTone,pickNpcHorn,AUDIO_STORAGE_KEY,TRAFFIC_VOICES,HEAR_RANGE} from './city-audio.mjs';

// Contesto Web Audio finto: registra nodi, avvii, sospensioni e valori dei parametri.
function fakeContext(){
 const log=[],param=v=>({value:v,setTargetAtTime(x){this.value=x;},setValueAtTime(x){this.value=x;},linearRampToValueAtTime(x){this.value=x;}});
 const node=extra=>({connect(){},...extra});
 const ctx={state:'suspended',currentTime:0,sampleRate:8000,destination:{},log,
  createGain:()=>node({gain:param(1)}),
  createOscillator:()=>{const o=node({type:'sine',frequency:param(440),start(){log.push('osc-start');},stop(t){log.push('osc-stop@'+t);}});return o;},
  createBiquadFilter:()=>node({type:'lowpass',frequency:param(350),Q:param(1)}),
  createStereoPanner:()=>node({pan:param(0)}),
  createBuffer:(c,len)=>({getChannelData:()=>new Float32Array(len)}),
  createBufferSource:()=>node({start(){log.push('noise-start');}}),
  resume(){ctx.state='running';log.push('resume');},suspend(){ctx.state='suspended';log.push('suspend');}};
 return ctx;
}
const memory=()=>{const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v)};};
const street={player:{x:0,y:0,inVehicle:true,vehicleType:'car',speed:12,throttle:1},traffic:[]};

test('Q09 nothing is created before a user gesture; the first gesture builds and resumes the sound once',()=>{
 let made=0;const ctx=fakeContext(),audio=createCityAudio({contextFactory:()=>{made++;return ctx;}});
 audio.update(street);
 assert.equal(made,0,'no AudioContext without a gesture');assert.equal(audio.started,false);assert.equal(audio.contextState,'none');
 assert.equal(audio.start(),true);assert.equal(made,1);assert.equal(ctx.state,'running');
 assert.ok(ctx.log.filter(x=>x==='osc-start').length>=2+TRAFFIC_VOICES*2,'engine and traffic voices running');
 assert.equal(ctx.log.filter(x=>x==='noise-start').length,4,'city background, rain, tyre-squeal and (BF10) driving-noise loops');
 audio.start();assert.equal(made,1,'one context only');
 const broken=createCityAudio({contextFactory:()=>{throw Error('no audio');}});
 assert.equal(broken.start(),false,'a browser without Web Audio simply stays silent');
});

test('Q09 engines: car hum vs scooter buzz, pitch and level with speed, silence on foot and inside the bank',()=>{
 const car=engineTone('car',20),moto=engineTone('motorcycle',20);
 assert.ok(moto.freq>car.freq&&moto.cutoff>car.cutoff,'the scooter is higher and buzzier');
 assert.ok(engineTone('car',30).freq>engineTone('car',5).freq);
 const fast=audioMix({...street,player:{...street.player,speed:28}}),slow=audioMix({...street,player:{...street.player,speed:3,throttle:0}});
 assert.ok(fast.engine.gain>slow.engine.gain&&fast.engine.freq>slow.engine.freq);
 assert.equal(audioMix({...street,player:{x:0,y:0,inVehicle:false}}).engine.gain,0,'on foot: no engine');
 const bank=audioMix({...street,interior:true,traffic:[{x:5,y:0,speed:9}]});
 assert.equal(bank.engine.gain,0);assert.deepEqual(bank.voices,[]);assert.ok(bank.ambient.gain<.01);
 const switched=audioMix({...street,player:{...street.player,vehicleType:'motorcycle'}});
 assert.equal(switched.engine.kind,'moto','changing vehicle changes the sound');
});

test('Q09 traffic is heard by distance: the closest four, quieter far away, panned left or right',()=>{
 const traffic=[{x:50,y:0,speed:9},{x:-8,y:0,speed:9},{x:20,y:0,speed:9},{x:3,y:2,speed:0},{x:70,y:0,speed:9},{x:30,y:5,speed:9},{x:40,y:1,speed:9,vehicleType:'motorcycle'}];
 const mix=audioMix({...street,traffic});
 assert.equal(mix.voices.length,TRAFFIC_VOICES);
 assert.deepEqual(mix.voices.map(v=>Math.round(v.distance)),[8,20,30,40],'nearest moving vehicles first; stopped and out-of-range ones silent');
 for(let i=1;i<mix.voices.length;i++)assert.ok(mix.voices[i].gain<mix.voices[i-1].gain,'farther is quieter');
 assert.ok(mix.voices[0].pan<0&&mix.voices[1].pan>0,'left and right');
 assert.equal(mix.voices[3].kind,'moto');
 assert.equal(audioMix({...street,traffic:[{x:HEAR_RANGE+1,y:0,speed:9}]}).voices.length,0);
});

test('Q09 mute and volume are saved; pause, stop and lost focus silence everything',()=>{
 const store=memory(),ctx=fakeContext(),audio=createCityAudio({contextFactory:()=>ctx,storage:store});
 audio.start();
 assert.ok(audio.update(street).master>0);
 assert.equal(audio.toggleMuted(),true);assert.equal(ctx.state,'suspended');assert.equal(audio.update(street).master,0);
 assert.deepEqual(JSON.parse(store.getItem(AUDIO_STORAGE_KEY)),{muted:true,effects:.7,radio:.52},'BF10: effects and radio saved separately');
 const again=createCityAudio({contextFactory:fakeContext,storage:store});
 assert.equal(again.muted,true,'still muted after a reload');
 audio.toggleMuted();assert.equal(ctx.state,'running');
 for(let i=0;i<20;i++)audio.changeVolume(.1);assert.equal(audio.volume,1);
 for(let i=0;i<20;i++)audio.changeVolume(-.1);assert.equal(audio.volume,0);assert.equal(audio.update(street).master,0);
 audio.changeVolume(.5);
 assert.equal(audio.update({...street,paused:true}).master,0,'pause menu, map, dialogs and shop');
 audio.focus(false);assert.equal(ctx.state,'suspended','tab hidden or window blurred');assert.equal(audio.update(street).master,0);
 audio.focus(true);assert.equal(ctx.state,'running');assert.ok(audio.update(street).master>0);
});

test('Q09 horns: two-tone car, single-tone scooter; never muted, unfocused or before the first gesture',()=>{
 const ctx=fakeContext(),audio=createCityAudio({contextFactory:()=>ctx});
 assert.equal(audio.horn('auto'),false,'not before a gesture');
 audio.start();ctx.log.length=0;
 assert.equal(audio.horn('auto'),true);
 assert.equal(ctx.log.filter(x=>x==='osc-start').length,2);assert.ok(ctx.log.every(x=>x==='osc-start'||x.startsWith('osc-stop@0.45')));
 ctx.log.length=0;audio.horn('moto');assert.equal(ctx.log.filter(x=>x==='osc-start').length,1);
 audio.toggleMuted();assert.equal(audio.horn('auto'),false);audio.toggleMuted();
 audio.focus(false);assert.equal(audio.horn('auto'),false);
});

test('Q09 NPC horns are rare: only stuck nearby cars, one every 5 s in town, one every 15 s per car',()=>{
 const mem={last:-1e9,byCar:new WeakMap()},player={x:0,y:0};
 const stuck={x:10,y:0,stuck:4},other={x:-12,y:3,stuck:4},far={x:80,y:0,stuck:9},waiting={x:5,y:0,stuck:1};
 assert.equal(pickNpcHorn(mem,[far,waiting],player,0),null,'too far or not stuck long enough');
 assert.equal(pickNpcHorn(mem,[stuck,other],player,1),stuck);
 assert.equal(pickNpcHorn(mem,[stuck,other],player,3),null,'global pause');
 assert.equal(pickNpcHorn(mem,[stuck,other],player,7),other,'same car waits its turn');
 assert.equal(pickNpcHorn(mem,[stuck],player,13),null);
 assert.equal(pickNpcHorn(mem,[stuck],player,17),stuck);
 assert.equal(pickNpcHorn(mem,[{x:3,y:0,stalled:5}],player,40)?.stalled,5,'works with the stalled timer of roads.mjs');
});

test('Q09 city background follows night and rain; a live radio ducks the engines',()=>{
 const day=audioMix({...street,night:0,rain:0}),night=audioMix({...street,night:1,rain:1});
 assert.ok(night.ambient.gain<day.ambient.gain,'quieter town at night');
 assert.equal(day.rain.gain,0);assert.ok(night.rain.gain>.06,'rain is heard');
 const radio=audioMix({...street,radioLive:true});
 assert.ok(Math.abs(radio.engine.gain-day.engine.gain*.55)<1e-9,'engine lowered under the radio');
});

test('Q09 game wiring: gesture start, focus, per-frame update, horn on H and on the wheel hub, pause controls',async()=>{
 const [game,html]=await Promise.all(['game.mjs','index.html'].map(f=>readFile(new URL('./'+f,import.meta.url),'utf8')));
 assert.match(game,/import \{createCityAudio\} from '\.\/city-audio\.mjs\?v=\d+'/);
 assert.match(game,/for\(const type of \['pointerdown','keydown'\]\)window\.addEventListener\(type,\(\)=>\{cityAudio\.start\(\);\},\{capture:true\}\);/);
 assert.match(game,/addEventListener\('visibilitychange',\(\)=>cityAudio\.focus\(document\.visibilityState!=='hidden'\)\)/);
 assert.match(game,/addEventListener\('blur',\(\)=>cityAudio\.focus\(false\)\)/);
 assert.match(game,/tick\(dt\);draw\(dt\);drawMini\(\);updateCityAudio\(\);/);
 assert.match(game,/e\.key\.toLowerCase\(\)==='h'&&!e\.repeat&&state\.player\.car>=0/);
 assert.match(game,/tap\?\.hub&&performance\.now\(\)-tap\.t<260/,'quick tap on the hub, not a drag');
 assert.match(game,/radioLive:radioStatus==='live'/);
 assert.match(game,/createCarRadio\(/,'the six radios are still created as before');
 for(const id of ['pause-sound','pause-volume-down','pause-volume-up'])assert.match(html,new RegExp('id="'+id+'"'));
});
