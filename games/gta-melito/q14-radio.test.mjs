import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {RADIO_STATIONS,createCarRadio} from './car-radio.mjs';

const fakeAudio=()=>({src:'',volume:1,preload:'',listeners:{},addEventListener(t,f){this.listeners[t]=f;},load(){},pause(){},
 removeAttribute(k){if(k==='src')this.src='';},play(){return Promise.resolve();}});

test('Q14 streams: the URLs found in the official players, no stream that now plays another station',()=>{
 const by=Object.fromEntries(RADIO_STATIONS.map(s=>[s.id,s.stream]));
 assert.equal(by.nuovasangiorgio,'https://nr8.newradio.it:19675/stream?ext=.mp3','official player play5.newradio.it/player/index/3070');
 assert.equal(by.napoli,'https://kisskiss.fluidstream.eu/RadioNapoli.aac','official player players.fluidstream.it/RadioNapoli');
 assert.equal(by.kisskissnapoli,'https://kisskiss.fluidstream.eu/KKNapoli.aac','kisskissnapoli.it/wp-content/playerkiss/streams.js');
 assert.equal(by.marte,'https://stream1.xdevel.com/audio0s975753-313/stream/icecast.audio','embedded on radiomarte.it');
 assert.ok(!RADIO_STATIONS.some(s=>/ice15\.fluidstream\.net\/sangiorgio/.test(s.stream)),'the old URL redirected to Radio Italia Charleroy');
 assert.equal(new Set(RADIO_STATIONS.map(s=>s.stream)).size,6);
});

test('Q14 pause: the station is silenced but stays connected, and comes back with the chosen level',async()=>{
 const audio=fakeAudio();
 const radio=createCarRadio({audioFactory:()=>audio,volume:.6});
 await radio.enterVehicle();
 assert.equal(radio.snapshot().status,'live');assert.equal(audio.volume,.6);
 const src=audio.src;
 radio.duck(true);
 assert.equal(audio.volume,0,'silent in the pause menu');
 assert.equal(audio.src,src,'not disconnected: no new gesture needed');
 assert.equal(radio.snapshot().status,'live');
 radio.setVolume(.3);
 assert.equal(audio.volume,0,'changing RADIO/MUSICA in the pause keeps it silent');
 radio.duck(false);
 assert.equal(audio.volume,.3,'back with the level chosen in the pause');
});

test('Q14 a station started while the pause is open starts silent',async()=>{
 const audio=fakeAudio();
 const radio=createCarRadio({audioFactory:()=>audio});
 radio.duck(true);
 await radio.enterVehicle();
 assert.equal(audio.volume,0);
 radio.duck(false);
 assert.ok(audio.volume>0);
});

test('Q14 game wiring: the pause menu ducks and restores the radio',async()=>{
 const game=await readFile(new URL('./game.mjs',import.meta.url),'utf8');
 assert.match(game,/import \{createCarRadio\} from '\.\/car-radio\.mjs\?v=(\d+)'/);
 assert.ok(Number(game.match(/car-radio\.mjs\?v=(\d+)/)[1])>=3);
 assert.match(game,/const openPause=\(\)=>\{carRadio\.duck\(true\);/);
 assert.match(game,/const closePause=\(\)=>\{carRadio\.duck\(false\);/);
});

test('Q14 records: rights document says TEST feature, collaudo CSV has one coherent row per station',async()=>{
 const [doc,csv]=await Promise.all(['RADIO_DIRITTI.md','radio-collaudo.csv'].map(f=>readFile(new URL('./'+f,import.meta.url),'utf8')));
 assert.match(doc,/funzione DI PROVA, non definitiva/);
 assert.match(doc,/Radio Italia Charleroy/);
 const rows=csv.trim().split('\n');
 const cols=rows[0].split(',').length;
 assert.equal(rows.length,1+RADIO_STATIONS.length);
 for(const station of RADIO_STATIONS)assert.ok(csv.includes(station.stream),'collaudo of '+station.id);
 for(const r of rows.slice(1))assert.ok(r.length>20&&/,no,/.test(r),'no explicit third-party permission found');
 assert.ok(cols>=10);
});
