import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PHONE_APPS,PHONE_ICONS,EXTERNAL_APPS,createPhone,openPhoneApp,phoneBack,phoneKey,resetPhone} from './smartphone.mjs';

const html=await readFile(new URL('./index.html',import.meta.url),'utf8');
const game=await readFile(new URL('./game.mjs',import.meta.url),'utf8');
const phoneSrc=await readFile(new URL('./smartphone.mjs',import.meta.url),'utf8');

test('Q37 home: the seven apps with a pixel icon each, settings kept apart from the gameplay apps',()=>{
 assert.deepEqual(PHONE_APPS.map(a=>a.id),['drive','rider','garage','mappa','missioni','profilo','impostazioni']);
 for(const a of PHONE_APPS){const icon=PHONE_ICONS[a.id];assert.equal(icon.length,12,a.id);for(const row of icon)assert.equal(row.length,12,a.id);}
 assert.equal(PHONE_APPS.find(a=>a.id==='impostazioni').kind,'sistema');
 assert.ok(PHONE_APPS.filter(a=>a.id!=='impostazioni').every(a=>a.kind==='gioco'));
 assert.equal(/google/i.test(phoneSrc),false,'no real brand');
});

test('Q37 open and close: keyboard arrows, ENTER opens, ESC goes back and then closes',()=>{
 const p=createPhone();
 assert.equal(phoneKey(p,'ArrowRight'),'focus');assert.equal(p.focus,1);
 assert.equal(phoneKey(p,'ArrowDown'),'focus');assert.equal(p.focus,5);
 assert.equal(phoneKey(p,'ArrowDown'),'focus');assert.equal(p.focus,5,'no row below');
 assert.equal(phoneKey(p,'ArrowRight'),'focus');assert.equal(p.focus,6);
 assert.equal(phoneKey(p,'ArrowRight'),'focus');assert.equal(p.focus,0,'wraps');
 assert.equal(phoneKey(p,'ArrowLeft'),'focus');assert.equal(p.focus,6);
 assert.equal(phoneKey(p,'Enter'),'screen');assert.equal(p.screen,'settings');
 assert.equal(phoneKey(p,'Escape'),'back');assert.equal(p.screen,'home');
 assert.equal(phoneKey(p,'Escape'),'close');
 assert.equal(phoneKey(p,'x'),null,'other keys are left to the game');
 p.focus=3;resetPhone(p);assert.equal(p.focus,0);assert.equal(p.screen,'home');
});

test('Q37 apps: Drive and Settings screens, Map and Missions hand over to the game, Rider/Garage «in arrivo» or their function',()=>{
 const p=createPhone();
 assert.equal(openPhoneApp(p,'drive',{}),'screen');assert.equal(p.screen,'drive');phoneBack(p);
 assert.equal(openPhoneApp(p,'mappa',{}),'map');assert.equal(p.screen,'home');
 assert.equal(openPhoneApp(p,'missioni',{}),'missions');
 assert.equal(openPhoneApp(p,'profilo',{}),'screen');assert.equal(p.screen,'profilo');phoneBack(p);
 assert.equal(openPhoneApp(p,'rider',{}),'soon');assert.equal(p.screen,'soon');assert.equal(p.soon,'RIDER');phoneBack(p);
 assert.equal(openPhoneApp(p,'garage',{}),'soon');phoneBack(p);
 let called=[];
 const env={openRiderApp:()=>called.push('rider'),openGarageApp:()=>called.push('garage')};
 assert.equal(openPhoneApp(p,'rider',env),'external');assert.equal(openPhoneApp(p,'garage',env),'external');
 assert.deepEqual(called,['rider','garage']);assert.equal(p.screen,'home');
 assert.deepEqual(EXTERNAL_APPS,{rider:'openRiderApp',garage:'openGarageApp'});
 assert.match(phoneSrc,/typeof fn==='function'/);
});

test('Q37 settings: the two BF10 volumes and «Sviluppatore» with every old pause item, no ID lost',()=>{
 const p=createPhone();openPhoneApp(p,'impostazioni',{});openPhoneApp(p,'sviluppatore',{});
 assert.equal(p.screen,'developer');assert.equal(phoneBack(p),'back');assert.equal(p.screen,'settings');
 // the phone MOVES the old nodes: the audio block into Settings, the whole old pause card into Sviluppatore
 assert.match(phoneSrc,/menu\.querySelector\('\.pause-audio:not\(\.pause-satellite\)'\)/);
 assert.match(phoneSrc,/if\(audio\)settings\.appendChild\(audio\)/);
 assert.match(phoneSrc,/if\(card\)dev\.appendChild\(card\)/);
 assert.match(phoneSrc,/#phone-dev \.pause-section\{display:block!important/,'all sections visible on phones too');
 const pause=html.slice(html.indexOf('<div class="pause-menu" id="pause-menu" hidden>'),html.indexOf('<div class="rotate-screen"'));
 for(const id of ['pause-close','pause-missions','pause-map','pause-zoom-auto','pause-zoom-in','pause-zoom-out','pause-reset','pause-road-compare',
  'pause-sound','pause-volume-down','pause-volume-up','pause-fx-level','pause-radio-down','pause-radio-up','pause-radio-level',
  'road-width-compare','pause-satellite','pause-satellite-down','pause-satellite-up','novita-list','novita-copy','novita-back','pause-details','npc-clock'])
  assert.ok(pause.includes('id="'+id+'"'),id+' still in the pause menu markup');
 assert.ok(pause.includes('openstreetmap.org/copyright')&&pause.includes('ISTAT'),'OSM/ISTAT attribution reachable');
 assert.match(phoneSrc,/PROVE MINIGIOCHI/);
});

test('Q37 game wiring: phone mounted on the pause menu, keys to the phone first, inputs reset on open',()=>{
 assert.match(game,/import \{mountPhone\} from '\.\/smartphone\.mjs\?v=001';/);
 assert.match(game,/phoneUi=mountPhone\(document,\{menu:pause,/);
 assert.match(game,/window\.addEventListener\('keydown',e=>\{\n  \/\/ Q37[^\n]*\n  if\(!\$\('pause-menu'\)\.hidden&&phoneUi\?\.key\(e\)\)return;/);
 assert.match(game,/Object\.keys\(pressed\)\.forEach\(k=>pressed\[k\]=false\);stick\.x=0;stick\.y=0;resetDrivingControls\(\);pause\.hidden=false;phoneUi\?\.opened\(\);/,'no pedal held through the phone');
 assert.match(phoneSrc,/max-height:520px\) and \(orientation:landscape\)[\s\S]*width:min\(500px,calc\(100vw - 330px\)\)/,'landscape phone: between wheel and pedals');
 assert.match(html,/game\.mjs\?v=192/);
});
