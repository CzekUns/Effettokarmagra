import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createCityAudio,audioMix,engineSound,readAudioPrefs,AUDIO_STORAGE_KEY,RADIO_DEFAULT_VOLUME} from './city-audio.mjs';
import {createCarRadio} from './car-radio.mjs';
import {handlingProfile,gearAt} from './vehicle-handling.mjs';

const memory=(init={})=>{const m=new Map(Object.entries(init));return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v)};};
const punto={vehicleType:'car',model:'punto-188-red',throttle:1};
const shiftsOf=model=>{const p=handlingProfile(model);return p.gears.map(g=>g*p.top);};

test('BF10 car engine follows the gears: pitch rises with the revs, drops at every shift, voice dips for a moment',()=>{
 const shifts=shiftsOf(punto);
 assert.equal(shifts.length,4,'five implicit gears on the Punto');
 // inside each gear the pitch climbs with speed
 let prev=engineSound({...punto,speed:.2});
 for(let s=.4;s<shifts[0]-.05;s+=.2){const now=engineSound({...punto,speed:s});assert.ok(now.freq>prev.freq,'first gear climbs at '+s.toFixed(1));prev=now;}
 for(const [i,at] of shifts.entries()){
  const before=engineSound({...punto,speed:at-.05}),after=engineSound({...punto,speed:at+.05});
  assert.equal(before.gear,i+1);assert.equal(after.gear,i+2,'gear '+(i+2)+' engaged');
  assert.ok(after.freq<before.freq*.9,'pitch drops at the shift '+(i+1)+'→'+(i+2)+': '+before.freq.toFixed(0)+' → '+after.freq.toFixed(0)+' Hz');
  assert.ok(after.shift<.9&&before.shift===1,'short dip of the engine voice right after the shift (BF05 shiftDip)');
  assert.ok(engineSound({...punto,speed:at+2.5}).shift>.99,'and back to full voice within the gear');
 }
 // the drop is smaller in the long gears (closer ratios), as on a real gearbox
 const drop=at=>engineSound({...punto,speed:at-.05}).freq/engineSound({...punto,speed:at+.05}).freq;
 assert.ok(drop(shifts[3])<drop(shifts[0]));
 // the same gear and revs as the BF05 drive model
 const s=20,g=gearAt(handlingProfile(punto),s);
 assert.deepEqual([engineSound({...punto,speed:s}).gear,+engineSound({...punto,speed:s}).rpm.toFixed(6)],[g.gear,+g.rpm.toFixed(6)]);
});

test('BF10 more driving noise in the high gears and at speed; grittier on the throttle, softer when lifting off',()=>{
 const shifts=shiftsOf(punto),noise=speed=>engineSound({...punto,speed}).noise;
 assert.equal(noise(0).gain,0,'standing still: no rolling noise');
 const perGear=[2,...shifts.map(x=>x+2)].map(noise);
 for(let i=1;i<perGear.length;i++)assert.ok(perGear[i].gain>perGear[i-1].gain&&perGear[i].cutoff>perGear[i-1].cutoff,'gear '+(i+1)+' louder and brighter');
 assert.ok(noise(39).gain>noise(10).gain*5,'top gear roar well above town speed: '+noise(39).gain.toFixed(3)+' vs '+noise(10).gain.toFixed(3));
 const gas=engineSound({...punto,speed:25,throttle:1}),lift=engineSound({...punto,speed:25,throttle:0});
 assert.ok(gas.noise.gain>lift.noise.gain&&gas.cutoff>lift.cutoff,'throttle opens the sound, lift-off softens it');
 // levels stay moderate: the whole driving layer is a background, below the engine voice
 const mix=audioMix({player:{x:0,y:0,inVehicle:true,...punto,speed:39}});
 assert.ok(mix.drive.gain>0&&mix.drive.gain<.1&&mix.drive.gain<mix.engine.gain/2,'noise '+mix.drive.gain.toFixed(3)+' under engine '+mix.engine.gain.toFixed(3));
 assert.equal(audioMix({player:{x:0,y:0,inVehicle:false}}).drive.gain,0,'on foot: no driving noise');
 assert.equal(audioMix({interior:true,player:{x:0,y:0,inVehicle:true,...punto,speed:20}}).drive.gain,0,'inside the bank: silent');
});

test('BF10 scooter variator: one continuous rise that settles, no shift drops; reverse is its own steady whine',()=>{
 const scooter={vehicleType:'motorcycle',model:'moto-scooter-sh-red',throttle:1};
 let prev=engineSound({...scooter,speed:0,throttle:0});
 assert.equal(prev.kind,'scooter');
 const steps=[];
 for(let s=.5;s<=27;s+=.5){const now=engineSound({...scooter,speed:s});assert.ok(now.freq>=prev.freq,'never drops at '+s);assert.equal(now.shift,1);steps.push(now.freq-prev.freq);prev=now;}
 const early=steps.slice(0,10).reduce((a,b)=>a+b,0),late=steps.slice(-10).reduce((a,b)=>a+b,0);
 assert.ok(early>late*3,'quick rise from the start, then nearly flat: '+early.toFixed(0)+' vs '+late.toFixed(0)+' Hz');
 const back=engineSound({...punto,speed:-6,throttle:0});
 assert.equal(back.gear,0,'reverse');assert.ok(back.freq>engineSound({...punto,speed:0,throttle:0}).freq);
});

test('BF10 each family sounds different: Ape buzzes, vans are deep, motorbikes are high and windy',()=>{
 const at=(o,speed)=>engineSound({throttle:1,...o,speed});
 const ape=at({vehicleType:'car',model:'ape-car-azzurra'},10),car=at(punto,10),van=at({vehicleType:'car',model:'furgone-fritti'},10),moto=at({vehicleType:'motorcycle',model:'moto-moto-naked-black'},10);
 assert.deepEqual([ape.kind,car.kind,van.kind,moto.kind],['ape','auto','furgone','moto']);
 assert.ok(ape.cutoff>car.cutoff*1.4,'the Ape single-cylinder buzz is brighter');
 assert.ok(van.freq<car.freq&&van.cutoff<car.cutoff,'vans are deeper');
 assert.ok(moto.freq>car.freq&&moto.cutoff>ape.cutoff,'motorbikes rev higher');
 assert.equal(shiftsOf({vehicleType:'car',model:'ape-car-azzurra'}).length,2,'the Ape has three short gears');
 // traffic voices use the model too, and the real speed passed by the game (agent.v)
 const mix=audioMix({player:{x:0,y:0},traffic:[{x:5,y:0,vehicleType:'car',model:'ape-verde-pesce',speed:6},{x:9,y:0,vehicleType:'car',model:'furgone-fritti',speed:6}]});
 assert.deepEqual(mix.voices.map(v=>v.kind),['ape','furgone']);
});

test('BF10 saved settings: old single volume becomes EFFETTI, radio starts at 52%; both persist, separately',()=>{
 const old=memory({[AUDIO_STORAGE_KEY]:JSON.stringify({muted:false,volume:.4})});
 assert.deepEqual(readAudioPrefs(old),{muted:false,effects:.4,radio:RADIO_DEFAULT_VOLUME},'migration of the Q09 preference');
 assert.deepEqual(readAudioPrefs(memory()),{muted:false,effects:.7,radio:.52},'first start');
 assert.deepEqual(readAudioPrefs(memory({[AUDIO_STORAGE_KEY]:'{broken'})),{muted:false,effects:.7,radio:.52});
 const levels=[],audio=createCityAudio({storage:old,onRadioLevel:l=>levels.push(l)});
 assert.equal(audio.effectsVolume,.4);assert.equal(audio.volume,.4,'historical name still works');assert.equal(audio.radioVolume,.52);
 assert.equal(audio.changeRadioVolume(.1),.62,'exact 10-point steps');assert.equal(audio.effectsVolume,.4,'radio does not move the effects');
 assert.equal(audio.changeVolume(-.1),.3);assert.equal(audio.radioVolume,.62,'effects do not move the radio');
 for(let i=0;i<12;i++)audio.changeRadioVolume(.1);assert.equal(audio.radioVolume,1);
 for(let i=0;i<12;i++)audio.changeRadioVolume(-.1);assert.equal(audio.radioVolume,0);
 audio.changeRadioVolume(.5);
 assert.deepEqual(JSON.parse(old.getItem(AUDIO_STORAGE_KEY)),{muted:false,effects:.3,radio:.5});
 const reloaded=createCityAudio({storage:old});
 assert.deepEqual([reloaded.effectsVolume,reloaded.radioVolume,reloaded.radioLevel],[.3,.5,.5],'same values after a reload');
 assert.equal(levels.at(-1),.5,'every radio change is handed to the stream');
});

test('BF10 SUONI OFF silences effects AND radio; the radio stream keeps its own volume when sound is back',()=>{
 const levels=[],audio=createCityAudio({storage:memory(),onRadioLevel:l=>levels.push(l)});
 audio.changeRadioVolume(.2);assert.equal(audio.radioLevel,.72);
 audio.toggleMuted();
 assert.equal(audio.radioLevel,0);assert.equal(levels.at(-1),0,'radio muted too');
 assert.equal(audio.update({player:{x:0,y:0,inVehicle:true,...punto,speed:10}}).master,0,'effects muted');
 audio.toggleMuted();assert.equal(levels.at(-1),.72,'radio back at its level');
 // the tuner applies the level to the real audio element, before and after it exists
 const player={volume:1,addEventListener(){},load(){},pause(){},removeAttribute(){},play:()=>Promise.resolve()};
 const radio=createCarRadio({audioFactory:()=>player,volume:.3});
 return radio.enterVehicle().then(()=>{
  assert.equal(player.volume,.3,'level chosen before entering the car');
  assert.equal(radio.setVolume(.8),.8);assert.equal(player.volume,.8,'live change while streaming');
  assert.equal(radio.setVolume(0),0);assert.equal(player.volume,0);assert.equal(radio.snapshot().status,'live','muted, not disconnected');
  assert.equal(radio.setVolume(7),1);assert.equal(createCarRadio({audioFactory:()=>player}).snapshot().volume,.52,'default unchanged');
 });
});

test('BF10 game wiring: model and real NPC speed to the audio, radio level to the stream, two volumes in the pause menu',async()=>{
 const [game,html,todo]=await Promise.all(['game.mjs','index.html','TODO.md'].map(f=>readFile(new URL('./'+f,import.meta.url),'utf8')));
 assert.match(game,/import \{createCityAudio\} from '\.\/city-audio\.mjs\?v=(\d+)'/);
 assert.ok(Number(game.match(/city-audio\.mjs\?v=(\d+)/)[1])>=3&&Number(game.match(/car-radio\.mjs\?v=(\d+)/)[1])>=2);
 assert.match(game,/createCityAudio\(\{storage:globalThis\.localStorage,onRadioLevel:level=>carRadio\.setVolume\(level\)\}\);\ncarRadio\.setVolume\(cityAudio\.radioLevel\);/);
 assert.match(game,/model:car\?\.model\|\|'',speed:car\?car\.speed:0/);
 assert.match(game,/speed:v\.braking\?0:\(Number\.isFinite\(v\.v\)\?v\.v:v\.speed\)/);
 for(const id of ['pause-sound','pause-volume-down','pause-volume-up','pause-fx-level','pause-radio-down','pause-radio-up','pause-radio-level'])assert.match(html,new RegExp('id="'+id+'"'));
 assert.match(html,/EFFETTI \/ AMBIENTE<\/span><button id="pause-volume-down"/);assert.match(html,/RADIO \/ MUSICA<\/span><button id="pause-radio-down"/);
 assert.ok(html.indexOf('class="pause-audio"')>html.indexOf('class="pause-shortcuts"')&&html.indexOf('class="pause-audio"')<html.indexOf('id="pause-details"'),'own block in the pause card');
 assert.match(game,/\$\('pause-radio-up'\)\.addEventListener\('click',\(\)=>\{cityAudio\.changeRadioVolume\(\.1\);soundLabel\(\);\}\);/);
 assert.match(todo,/\*\*Q37[\s\S]*?Nota 2026-10-20 \(committente\):\*\* l'app Impostazioni dello smartphone deve contenere i due volumi separati RADIO\/MUSICA ed EFFETTI\/AMBIENTE/);
});
