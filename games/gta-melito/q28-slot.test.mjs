import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {makeRng,reelStops,symbolsAt,evaluate,freshSlotSave,readSlotSave,writeSlotSave,spinOnce,canSpin,restartCredits,changeBet,
 resultText,SLOT_RULES,SLOT_REEL,SLOT_SYMBOLS,SLOT_PAYTABLE,SLOT_SAVE_KEY,drawSymbol,drawSlotScreen,openSlotMachine,isSlotOpen} from './minigame-slot.mjs';

const memory=()=>{const m=new Map();return {getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),m};};

test('Q28 seeded RNG: same seed and spin give the same reels, different spins differ',()=>{
 const a=makeRng(42),b=makeRng(42);for(let i=0;i<20;i++)assert.equal(a(),b());
 assert.deepEqual(reelStops(1234,7),reelStops(1234,7));
 const seen=new Set();for(let i=0;i<40;i++)seen.add(reelStops(1234,i).join(','));
 assert.ok(seen.size>30,'spins are not all alike');
 for(const st of reelStops(99,3))assert.ok(st>=0&&st<SLOT_REEL.length);
 for(const s of SLOT_REEL)assert.ok(SLOT_SYMBOLS.includes(s));
});

test('Q28 rules: tris on the line, pair on the first two reels, nothing otherwise',()=>{
 assert.deepEqual(evaluate(['cornetto','cornetto','cornetto'],2),{kind:'tris',symbol:'cornetto',win:2*SLOT_PAYTABLE.tris.cornetto});
 assert.deepEqual(evaluate(['pizza','pizza','limone'],5),{kind:'coppia',symbol:'pizza',win:5*SLOT_PAYTABLE.coppia.pizza});
 assert.equal(evaluate(['pizza','limone','pizza'],5).win,0,'a pair must be on the first two reels');
 assert.equal(evaluate(['caffe','baba','vesuvio'],1).kind,'niente');
 assert.match(resultText({kind:'tris',symbol:'vesuvio',win:30}),/TRIS DI VESUVI! \+30 CREDITI/);
 // expected return under 1 on the real reel strip (an arcade slot that does not pay out for ever)
 let paid=0,n=0;for(const a of SLOT_REEL)for(const b of SLOT_REEL)for(const c of SLOT_REEL){paid+=evaluate([a,b,c],1).win;n++;}
 assert.ok(paid/n<.97&&paid/n>.8,'return per credit '+(paid/n).toFixed(3));
});

test('Q28 credits: a spin takes the bet and adds the win in one step, never below zero, no spin without credits',()=>{
 const save=freshSlotSave(7);assert.equal(save.credits,SLOT_RULES.startCredits);
 let total=save.credits;
 for(let i=0;i<60;i++){
  const before=save.credits,r=spinOnce(save);if(!r)break;
  assert.equal(save.credits,before-r.bet+r.win);assert.ok(save.credits>=0);total=save.credits;
 }
 save.credits=0;assert.equal(canSpin(save),false);assert.equal(spinOnce(save),null,'no free spin, no negative credits');
 assert.equal(restartCredits(save),true);assert.equal(save.credits,SLOT_RULES.restartCredits);
 assert.equal(restartCredits(save),false,'only when credits are over');
 assert.equal(changeBet(save,1),2);assert.equal(changeBet(save,1),5);assert.equal(changeBet(save,1),5);assert.equal(changeBet(save,-5),2);assert.equal(changeBet(save,-1),1);
 assert.ok(Number.isFinite(total));
});

test('Q28 saving: results are committed once, a reload never repeats or doubles a spin',()=>{
 const storage=memory(),save=freshSlotSave(2024);writeSlotSave(storage,save);
 const r1=spinOnce(save);writeSlotSave(storage,save);
 const reloaded=readSlotSave(storage);
 assert.equal(reloaded.credits,save.credits);assert.equal(reloaded.spins,1);
 // the next spin after a reload is spin #2, the same one the game would have played without reloading
 const twin=structuredClone(save),r2=spinOnce(reloaded),r2b=spinOnce(twin);
 assert.deepEqual(r2.stops,r2b.stops);assert.equal(reloaded.credits,twin.credits);
 assert.notDeepEqual(r1.stops.join(),'x');
 storage.setItem(SLOT_SAVE_KEY,'{rotto');assert.equal(readSlotSave(storage),null,'a broken save is ignored');
 storage.setItem(SLOT_SAVE_KEY,JSON.stringify({version:1,credits:-50,spins:3.7,seed:5,bet:999}));
 assert.deepEqual([readSlotSave(storage).credits,readSlotSave(storage).spins,readSlotSave(storage).bet],[0,3,1]);
});

test('Q28 virtual only: no money, purchase or betting service anywhere in the module',async()=>{
 const src=await readFile(new URL('./minigame-slot.mjs',import.meta.url),'utf8');
 assert.match(src,/SOLO CREDITI VIRTUALI DI GIOCO/);
 assert.doesNotMatch(src,/fetch\(|XMLHttpRequest|WebSocket|sendBeacon|€|progress\.money|paypal|stripe/i);
 assert.doesNotMatch(src,/localStorage\.setItem\('gta-melito-campaign/);
});

test('Q28 pixel art: every symbol and the whole screen draw on a canvas without errors',()=>{
 const calls=[];const c=new Proxy({},{get:(t,k)=>k in t?t[k]:(...a)=>{calls.push(k);},set:(t,k,v)=>{t[k]=v;return true;}});
 for(const s of SLOT_SYMBOLS){calls.length=0;drawSymbol(c,s,0,0);assert.ok(calls.filter(k=>k==='fillRect').length>=6,s+' has a drawing');}
 calls.length=0;drawSlotScreen(c,{reels:[0,5,9],offsets:[0,4,0],credits:100,bet:2,message:'PROVA',flash:1,lights:3});
 assert.ok(calls.includes('fillText')&&calls.filter(k=>k==='fillRect').length>100);
 assert.equal(openSlotMachine({doc:null}),false,'without a page it does nothing');assert.equal(isSlotOpen(),false);
});

test('Q28 game wiring: pause under the slot, radio ducked, PAUSE › STRUMENTI and ?minigioco=slot, hook for Q27',async()=>{
 const [game,html]=await Promise.all(['game.mjs','index.html'].map(f=>readFile(new URL('./'+f,import.meta.url),'utf8')));
 assert.match(game,/import \{openSlotMachine,isSlotOpen\} from '\.\/minigame-slot\.mjs\?v=\d+'/);
 assert.match(game,/state\.shopOpen(?:\|\|state\.riderOpen)?\|\|isSlotOpen\(\)(\|\|is\w+Open\(\))*\)\{\n  for\(const key of Object\.keys\(pressed\)\)pressed\[key\]=false;/,'the world stops under the slot');
 assert.match(game,/const paused=[^\n]*\|\|isSlotOpen\(\)(\|\|is\w+Open\(\))*;/,'city audio quiet');
 assert.match(game,/function openSlotGame\(\)\{[\s\S]{0,260}carRadio\.duck\(true\);[\s\S]{0,200}onExit:\(\)=>\{carRadio\.duck\(false\);/);
 assert.match(game,/get\('minigioco'\)==='slot'/);assert.match(game,/if\(SLOT_FROM_URL\)openSlotGame\(\);/);
 assert.match(game,/\$\('pause-slot'\)\.addEventListener\('click',\(\)=>\{closePause\(\);openSlotGame\(\);\}\);/);
 const tools=html.slice(html.indexOf('pause-h-tools'),html.indexOf('pause-h-credits'));
 assert.match(tools,/id="pause-slot"[^>]*>PROVA SLOT</);
 assert.match(html,/\.slot-panel\{position:fixed;inset:0;z-index:40;/);
 assert.ok(Number((html.match(/game\.mjs\?v=(\d+)/)||[])[1])>=182);
});
