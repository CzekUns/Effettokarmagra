import {test} from 'node:test';
import assert from 'node:assert/strict';
import {RADIO_STATIONS,nextRadioIndex,createCarRadio} from './car-radio.mjs';
function setup({block=false}={}){
 const calls=[],storage=new Map(),updates=[];
 const player={
  src:'',volume:0,preload:'',listeners:{},
  addEventListener(type,fn){this.listeners[type]=fn;},
  load(){calls.push(['load',this.src]);},
  pause(){calls.push(['pause']);},
  removeAttribute(key){if(key==='src')this.src='';},
  play(){calls.push(['play',this.src]);return block?Promise.reject(Object.assign(Error('gesture required'),{name:'NotAllowedError'})):Promise.resolve();}
 };
 return {calls,player,updates,storage,radio:createCarRadio({audioFactory:()=>player,onChange:s=>updates.push({...s}),storage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)}})};
}
test('six specific radio stations are distinct HTTPS sources with official sites',()=>{
 assert.deepEqual(RADIO_STATIONS.map(x=>x.id),['marte','kisskissnapoli','crc','nuovasangiorgio','norba','napoli']);
 for(const station of RADIO_STATIONS){assert.match(station.stream,/^https:\/\//);assert.match(station.site,/^https:\/\//);}
 assert.equal(nextRadioIndex(0,-1),5);
 assert.equal(nextRadioIndex(5,1),0);
});
test('enter, tune, switch off and leave never stream on foot',async()=>{
 const {radio,calls,storage,player}=setup();
 assert.equal(radio.snapshot().status,'off');
 await radio.enterVehicle();
 assert.equal(radio.snapshot().status,'live');
 assert.equal(player.volume,.52);
 assert.equal(calls.filter(([kind])=>kind==='play').length,1);
 await radio.next();
 assert.equal(radio.snapshot().station.id,'kisskissnapoli');
 await radio.previous();
 assert.equal(radio.snapshot().station.id,'marte');
 await radio.toggle();
 assert.equal(radio.snapshot().status,'off');
 assert.equal(radio.snapshot().enabled,false);
 assert.equal(player.src,'');
 assert.equal(JSON.parse(storage.get('gta-melito-radio-v1')).enabled,false);
 await radio.next();
 assert.equal(radio.snapshot().station.id,'kisskissnapoli');
 radio.leaveVehicle();
 assert.equal(player.src,'');
 assert.equal(radio.snapshot().inVehicle,false);
 const count=calls.filter(([kind])=>kind==='play').length;
 await radio.next();
 assert.equal(calls.filter(([kind])=>kind==='play').length,count);
});
test('autoplay restriction leaves a visible tap-to-play recovery state',async()=>{
 const {radio,player}=setup({block:true});
 await radio.enterVehicle();
 assert.equal(radio.snapshot().status,'tap');
 assert.equal(radio.snapshot().inVehicle,true);
 player.listeners.error();
 assert.equal(radio.snapshot().status,'unavailable');
});
test('late play resolution cannot re-enable radio after exit',async()=>{
 let resolve;
 const audio={addEventListener(){},pause(){},removeAttribute(){this.src='';},load(){},play(){return new Promise(r=>resolve=r);}};
 const tuner=createCarRadio({audioFactory:()=>audio});
 const pending=tuner.enterVehicle();
 assert.equal(tuner.snapshot().status,'connecting');
 tuner.leaveVehicle();resolve();await pending;
 assert.equal(tuner.snapshot().status,'off');
});
