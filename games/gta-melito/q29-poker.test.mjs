import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {freshDeck,shuffledDeck,dealHand,drawHand,evaluateHand,cardKey,freshPokerSave,readPokerSave,writePokerSave,dealOnce,drawOnce,
 toggleHold,currentHand,canDeal,restartPokerCredits,changePokerBet,pokerResultText,POKER_RULES,POKER_PAYTABLE,POKER_SAVE_KEY,SUITS,
 drawCard,drawSuit,drawPokerScreen,cardAt,CARD_X,openPokerMachine,isPokerOpen} from './minigame-poker.mjs';

const memory=()=>{const m=new Map();return {getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),m};};
// 'AS' = asso di picche, 'TC' = dieci di cuori, ecc. (S picche, H cuori, D quadri, C fiori)
const SUIT={S:'picche',H:'cuori',D:'quadri',C:'fiori'},RANK={T:10,J:11,Q:12,K:13,A:14};
const hand=s=>s.split(' ').map(t=>({rank:RANK[t[0]]||Number(t[0]),suit:SUIT[t[1]]}));
const kind=s=>evaluateHand(hand(s)).kind;

test('Q29 deck: 52 different cards, seeded shuffle, deal and draw never repeat a card',()=>{
 assert.equal(new Set(freshDeck().map(cardKey)).size,52);
 const d=shuffledDeck(77,3);assert.equal(new Set(d.map(cardKey)).size,52);
 assert.deepEqual(shuffledDeck(77,3),d,'same seed and hand, same deck');
 assert.notDeepEqual(shuffledDeck(77,4).map(cardKey),d.map(cardKey),'the next hand is shuffled again');
 for(let n=0;n<30;n++){
  const first=dealHand(12345,n),final=drawHand(12345,n,[false,false,false,false,false]);
  const all=[...first,...final].map(cardKey);assert.equal(new Set(all).size,10,'discarded cards never come back');
 }
 for(const s of new Set(freshDeck().map(c=>c.suit)))assert.ok(SUITS.includes(s));
});

test('Q29 combinations: pair of jacks or better, two pair, trips, straight, flush, full house, four of a kind and the rest',()=>{
 assert.equal(kind('JS JH 2C 7D 9S'),'coppia');assert.equal(kind('AS AH 2C 7D 9S'),'coppia');
 assert.equal(kind('TS TH 2C 7D 9S'),'niente','a pair of tens does not pay (Jacks or Better)');
 assert.equal(kind('2S 2H 7C 7D 9S'),'doppia-coppia');
 assert.equal(kind('5S 5H 5C 7D 9S'),'tris');
 assert.equal(kind('5S 6H 7C 8D 9S'),'scala');
 assert.equal(kind('AS 2H 3C 4D 5S'),'scala','the wheel A-2-3-4-5 is a straight');
 assert.equal(kind('TS JH QC KD AS'),'scala','broadway');
 assert.equal(kind('QS KH AC 2D 3S'),'niente','no wrap-around straight');
 assert.equal(kind('2H 7H 9H JH KH'),'colore');
 assert.equal(kind('3S 3H 3C 9D 9S'),'full');
 assert.equal(kind('8S 8H 8C 8D 2S'),'poker');
 assert.equal(kind('5D 6D 7D 8D 9D'),'scala-colore');
 assert.equal(kind('TC JC QC KC AC'),'scala-reale');
 assert.equal(kind('2S 4H 6C 8D TS'),'niente');
 // the table on screen and the evaluation agree, richest first
 for(let i=1;i<POKER_PAYTABLE.length;i++)assert.ok(POKER_PAYTABLE[i-1].pay>POKER_PAYTABLE[i].pay);
 assert.equal(evaluateHand(hand('8S 8H 8C 8D 2S')).pay,25);
 assert.match(pokerResultText({...evaluateHand(hand('3S 3H 3C 9D 9S')),win:18}),/FULL! \+18 CREDITI/);
});

test('Q29 hold and discard: held cards stay, the others come from the deck in order',()=>{
 const seed=909,n=5,deck=shuffledDeck(seed,n),held=[true,false,true,false,false];
 const out=drawHand(seed,n,held);
 assert.deepEqual(out[0],deck[0]);assert.deepEqual(out[2],deck[2]);
 assert.deepEqual([out[1],out[3],out[4]],[deck[5],deck[6],deck[7]]);
 assert.deepEqual(drawHand(seed,n,[true,true,true,true,true]),deck.slice(0,5),'keeping all cards changes nothing');
});

test('Q29 credits: the bet is paid at the deal, the win added at the draw, one hand at a time, never below zero',()=>{
 const save=freshPokerSave(31);assert.equal(save.credits,POKER_RULES.startCredits);
 changePokerBet(save,1);changePokerBet(save,1);assert.equal(save.bet,3);
 const d=dealOnce(save);assert.equal(save.credits,97);assert.equal(save.phase,'hold');assert.equal(d.hand.length,5);
 assert.equal(dealOnce(save),null,'no second deal while a hand is open');
 assert.equal(changePokerBet(save,1),3,'the bet is locked during the hand');
 assert.equal(toggleHold(save,1),true);assert.equal(save.held[1],true);assert.equal(toggleHold(save,7),false);
 const r=drawOnce(save);assert.equal(save.credits,97+r.win);assert.equal(r.win,r.pay*3);assert.equal(save.phase,'idle');assert.equal(save.hands,1);
 assert.equal(drawOnce(save),null,'no draw without a hand');
 save.credits=0;assert.equal(canDeal(save),false);assert.equal(dealOnce(save),null);
 assert.equal(restartPokerCredits(save),true);assert.equal(save.credits,POKER_RULES.restartCredits);
 assert.equal(restartPokerCredits(save),false,'only when credits are over');
 // over many hands credits only move by bet and table wins
 const s2=freshPokerSave(4242);
 for(let i=0;i<200&&canDeal(s2);i++){const before=s2.credits;dealOnce(s2);s2.held=s2.held.map((_,k)=>k<2);const res=drawOnce(s2);
  assert.equal(s2.credits,before-s2.bet+res.win);assert.ok(s2.credits>=0);}
});

test('Q29 saving: a reload during a hand gives back the same cards and holds, without refund or second payout',()=>{
 const storage=memory(),save=freshPokerSave(555);writePokerSave(storage,save);
 const d=dealOnce(save);toggleHold(save,0);toggleHold(save,4);writePokerSave(storage,save);
 const re=readPokerSave(storage);
 assert.equal(re.phase,'hold');assert.equal(re.credits,save.credits,'the bet is not refunded');
 assert.deepEqual(currentHand(re),d.hand,'same hand after reload');assert.deepEqual(re.held,[true,false,false,false,true]);
 const twin=structuredClone(save),a=drawOnce(re),b=drawOnce(twin);
 assert.deepEqual(a.hand,b.hand);assert.equal(re.credits,twin.credits);
 writePokerSave(storage,re);const again=readPokerSave(storage);
 assert.equal(drawOnce(again),null,'the closed hand cannot be paid twice');
 storage.setItem(POKER_SAVE_KEY,'{rotto');assert.equal(readPokerSave(storage),null,'a broken save is ignored');
 storage.setItem(POKER_SAVE_KEY,JSON.stringify({version:1,credits:-9,hands:2.6,seed:3,bet:99,phase:'boh',held:'x'}));
 const odd=readPokerSave(storage);assert.deepEqual([odd.credits,odd.hands,odd.bet,odd.phase,odd.held.length],[0,2,1,'idle',5]);
});

test('Q29 virtual only and separate: no money, no purchase, no betting service, own credits apart from the slot',async()=>{
 const src=await readFile(new URL('./minigame-poker.mjs',import.meta.url),'utf8');
 assert.match(src,/SOLO CREDITI VIRTUALI DI GIOCO/);
 assert.doesNotMatch(src,/fetch\(|XMLHttpRequest|WebSocket|sendBeacon|€|progress\.money|paypal|stripe/i);
 assert.notEqual(POKER_SAVE_KEY,'gta-melito-slot-v1');
});

test('Q29 pixel art: cards, suits and the whole screen draw without errors; taps find the right card',()=>{
 const calls=[];const c=new Proxy({},{get:(t,k)=>k in t?t[k]:(...a)=>{calls.push(k);},set:(t,k,v)=>{t[k]=v;return true;}});
 for(const s of SUITS){calls.length=0;drawSuit(c,s,0,0,'#000');assert.ok(calls.filter(k=>k==='fillRect').length>=4,s);}
 calls.length=0;drawCard(c,{rank:12,suit:'cuori'},0,0,{held:true});drawCard(c,null,0,0,{faceDown:true});
 assert.ok(calls.includes('fillText'));
 calls.length=0;drawPokerScreen(c,{hand:hand('TC JC QC KC AC'),faceDown:false,held:[true,true,false,false,true],credits:120,bet:2,message:'PROVA',highlight:'scala-reale',flash:1,lights:2});
 assert.ok(calls.filter(k=>k==='fillText').length>=POKER_PAYTABLE.length*2,'the table is on screen');
 for(let i=0;i<5;i++)assert.equal(cardAt(CARD_X[i]+10,80),i);
 assert.equal(cardAt(2,80),-1);assert.equal(cardAt(60,10),-1);
 assert.equal(openPokerMachine({doc:null}),false,'without a page it does nothing');assert.equal(isPokerOpen(),false);
});

test('Q29 game wiring: pause under the cabinet, radio ducked, PAUSE › STRUMENTI and ?minigioco=poker, hook for Q27',async()=>{
 const [game,html]=await Promise.all(['game.mjs','index.html'].map(f=>readFile(new URL('./'+f,import.meta.url),'utf8')));
 assert.match(game,/import \{openPokerMachine,isPokerOpen\} from '\.\/minigame-poker\.mjs\?v=\d+'/);
 assert.match(game,/function tick\(dt\)\{\n if\(!state\.ready\)return;\n if\(state\.mapOpen\|\|[^\n]*\|\|isSlotOpen\(\)\|\|isPokerOpen\(\)(?:\|\|is\w+Open\(\))*\)\{\n  for\(const key of Object\.keys\(pressed\)\)pressed\[key\]=false;/,'the world stops under the poker');
 assert.match(game,/const paused=state\.mapOpen\|\|[^\n]*\|\|isPokerOpen\(\)(?:\|\|is\w+Open\(\))*;/,'city audio quiet');
 assert.match(game,/function openPokerGame\(\)\{[\s\S]{0,260}carRadio\.duck\(true\);[\s\S]{0,200}onExit:\(\)=>\{carRadio\.duck\(false\);/);
 assert.match(game,/get\('minigioco'\)==='poker'/);assert.match(game,/else if\(POKER_FROM_URL\)openPokerGame\(\);/);
 assert.match(game,/\$\('pause-poker'\)\.addEventListener\('click',\(\)=>\{closePause\(\);openPokerGame\(\);\}\);/);
 const tools=html.slice(html.indexOf('pause-h-tools'),html.indexOf('pause-h-credits'));
 assert.match(tools,/id="pause-poker"[^>]*>PROVA VIDEO POKER</);
 assert.match(html,/#poker-canvas\{/);
 assert.ok(Number((html.match(/game\.mjs\?v=(\d+)/)||[])[1])>=184);
});
