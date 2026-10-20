/* Q29 — Video poker da cabinato «POKER DEL GOLFO»: secondo minigioco, distinto dalla slot della Q28.
 * SOLO CREDITI VIRTUALI DI GIOCO: non si comprano, non si ricaricano a pagamento, non valgono denaro
 * e non sono collegati a scommesse o servizi esterni. Separati dagli euro della Q06 e dai crediti della
 * slot: ogni cabinato ha il suo contatore, come nelle sale giochi, e i due giochi non si toccano a vicenda.
 * Regole: Jacks or Better semplificato. Si ricevono 5 carte, si scelgono quelle da tenere, un solo cambio.
 * Ogni mano è decisa da un mazzo mescolato con seme (seme salvato + numero della mano): stessa mano,
 * stesse carte. La puntata si toglie e si salva alla distribuzione, la vincita si aggiunge e si salva al
 * cambio, in un solo passo: ricaricare a metà mano riporta la stessa mano, senza rimborsi né doppioni.
 * Aggancio per il cabinato della Q27: openPokerMachine({onExit}). Grafica provvisoria, da approvare. */
import {makeRng} from './minigame-slot.mjs?v=001';
export const POKER_SAVE_KEY='gta-melito-poker-v1';
export const POKER_RULES=Object.freeze({startCredits:100,restartCredits:50,bets:Object.freeze([1,2,3,4,5]),dealStep:.09});
export const SUITS=Object.freeze(['picche','cuori','quadri','fiori']);
const RED=new Set(['cuori','quadri']);
export const RANK_LABEL=Object.freeze({11:'J',12:'Q',13:'K',14:'A'});
export const rankLabel=r=>RANK_LABEL[r]||String(r);
// Moltiplicatori per credito puntato, dal più ricco al più povero (come sulla tabella a schermo).
export const POKER_PAYTABLE=Object.freeze([
 Object.freeze({kind:'scala-reale',label:'SCALA REALE',pay:250}),
 Object.freeze({kind:'scala-colore',label:'SCALA COLORE',pay:50}),
 Object.freeze({kind:'poker',label:'POKER',pay:25}),
 Object.freeze({kind:'full',label:'FULL',pay:9}),
 Object.freeze({kind:'colore',label:'COLORE',pay:6}),
 Object.freeze({kind:'scala',label:'SCALA',pay:4}),
 Object.freeze({kind:'tris',label:'TRIS',pay:3}),
 Object.freeze({kind:'doppia-coppia',label:'DOPPIA COPPIA',pay:2}),
 Object.freeze({kind:'coppia',label:'COPPIA DI J O PIÙ',pay:1})
]);
const PAY=Object.fromEntries(POKER_PAYTABLE.map(r=>[r.kind,r]));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

// Mazzo intero ordinato: 52 carte, rango 2–14 (asso = 14).
export function freshDeck(){
 const deck=[];for(const suit of SUITS)for(let rank=2;rank<=14;rank++)deck.push({rank,suit});
 return deck;
}
// Mazzo mescolato per la mano n (Fisher–Yates con il generatore della slot).
export function shuffledDeck(seed,handIndex){
 const rng=makeRng((Number(seed)>>>0)^Math.imul((handIndex|0)+1,0x85EBCA6B)),deck=freshDeck();
 for(let i=deck.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[deck[i],deck[j]]=[deck[j],deck[i]];}
 return deck;
}
export const cardKey=c=>c.rank+'-'+c.suit;
// Le carte della mano n: le prime 5 del mazzo; i cambi arrivano in ordine dalla sesta in poi.
export function dealHand(seed,handIndex){return shuffledDeck(seed,handIndex).slice(0,5);}
export function drawHand(seed,handIndex,held){
 const deck=shuffledDeck(seed,handIndex),hand=deck.slice(0,5);let next=5;
 return hand.map((card,i)=>held[i]?card:deck[next++]);
}

// Valutazione di 5 carte. Restituisce la riga della tabella (o 'niente').
export function evaluateHand(cards){
 const ranks=cards.map(c=>c.rank).sort((a,b)=>a-b),counts=new Map();
 for(const r of ranks)counts.set(r,(counts.get(r)||0)+1);
 const groups=[...counts.entries()].sort((a,b)=>b[1]-a[1]||b[0]-a[0]),sizes=groups.map(g=>g[1]);
 const flush=cards.every(c=>c.suit===cards[0].suit);
 const unique=counts.size===5,wheel=unique&&ranks.join()==='2,3,4,5,14';
 const straight=unique&&(ranks[4]-ranks[0]===4||wheel);
 let kind='niente';
 if(straight&&flush)kind=ranks[0]===10?'scala-reale':'scala-colore';
 else if(sizes[0]===4)kind='poker';
 else if(sizes[0]===3&&sizes[1]===2)kind='full';
 else if(flush)kind='colore';
 else if(straight)kind='scala';
 else if(sizes[0]===3)kind='tris';
 else if(sizes[0]===2&&sizes[1]===2)kind='doppia-coppia';
 else if(sizes[0]===2&&groups[0][0]>=11)kind='coppia';
 const row=PAY[kind];
 return {kind,label:row?row.label:'NIENTE',pay:row?row.pay:0};
}

export function freshPokerSave(seed=Date.now()){
 return {version:1,credits:POKER_RULES.startCredits,hands:0,seed:(Number(seed)>>>0)||1,bet:1,phase:'idle',held:[false,false,false,false,false],best:0,lastWin:0,lastKind:'niente'};
}
export function readPokerSave(storage){
 try{
  const raw=storage?.getItem?.(POKER_SAVE_KEY);if(!raw)return null;
  const s=JSON.parse(raw);if(!s||s.version!==1)return null;
  const held=Array.isArray(s.held)&&s.held.length===5?s.held.map(Boolean):[false,false,false,false,false];
  return {version:1,credits:Math.max(0,Math.floor(Number(s.credits)||0)),hands:Math.max(0,Math.floor(Number(s.hands)||0)),
   seed:(Number(s.seed)>>>0)||1,bet:POKER_RULES.bets.includes(s.bet)?s.bet:1,phase:s.phase==='hold'?'hold':'idle',held,
   best:Math.max(0,Number(s.best)||0),lastWin:Math.max(0,Number(s.lastWin)||0),
   lastKind:PAY[s.lastKind]||s.lastKind==='niente'?s.lastKind:'niente'};
 }catch(_){return null;}
}
export function writePokerSave(storage,save){try{storage?.setItem?.(POKER_SAVE_KEY,JSON.stringify(save));}catch(_){}}
export const canDeal=save=>save.phase==='idle'&&save.credits>=save.bet;
/* Distribuzione: toglie la puntata e apre la mano (fase 'hold'). null se non si può. */
export function dealOnce(save){
 if(!canDeal(save))return null;
 save.credits-=save.bet;save.phase='hold';save.held=[false,false,false,false,false];
 return {hand:dealHand(save.seed,save.hands),bet:save.bet,credits:save.credits};
}
export function toggleHold(save,i){
 if(save.phase!=='hold'||!(i>=0&&i<5))return false;
 save.held[i]=!save.held[i];return true;
}
/* Cambio: sostituisce le carte non tenute, valuta, aggiunge la vincita e chiude la mano in un passo. */
export function drawOnce(save){
 if(save.phase!=='hold')return null;
 const hand=drawHand(save.seed,save.hands,save.held),result=evaluateHand(hand),win=result.pay*save.bet;
 save.credits+=win;save.hands+=1;save.phase='idle';save.lastWin=win;save.lastKind=result.kind;save.best=Math.max(save.best,win);
 const held=save.held.slice();save.held=[false,false,false,false,false];
 return {hand,held,...result,win,bet:save.bet,credits:save.credits};
}
// La mano in corso, ricostruita dal seme (anche dopo un ricaricamento).
export const currentHand=save=>dealHand(save.seed,save.hands);
// Crediti finiti a mano chiusa: si ricomincia gratis da 50. Non è un acquisto e non dà nulla di reale.
export function restartPokerCredits(save){
 if(save.phase!=='idle'||save.credits>=POKER_RULES.bets[0])return false;
 save.credits=POKER_RULES.restartCredits;return true;
}
export function changePokerBet(save,dir){
 if(save.phase!=='idle')return save.bet;
 const bets=POKER_RULES.bets,i=clamp(bets.indexOf(save.bet)+Math.sign(dir),0,bets.length-1);
 save.bet=bets[i];return save.bet;
}
export function pokerResultText(result){
 if(!result)return 'CREDITI INSUFFICIENTI';
 if(result.win>0)return result.label+'! +'+result.win+' CREDITI';
 return 'NIENTE STAVOLTA · RITENTA';
}

/* ---------- Pixel art (tutto disegnato in codice) ---------- */
const PAL={ink:'#1b1410',cream:'#f4e6c4',paper:'#f6f2ea',paperD:'#d8d2c4',red:'#c8322a',redD:'#7d1b17',gold:'#e9b949',goldD:'#9b6b1d',
 felt:'#1f5a3c',feltD:'#143d29',feltL:'#2f7a52',blue:'#23466e',blueD:'#162c46'};
function px(c,x,y,w,h,col){c.fillStyle=col;c.fillRect(x,y,w,h);}
// Seme 7×7 a pixel.
export function drawSuit(c,suit,x,y,col){
 const p=(dx,dy,w,h)=>px(c,x+dx,y+dy,w,h,col);
 switch(suit){
  case 'cuori':p(1,0,2,1);p(4,0,2,1);p(0,1,7,2);p(1,3,5,1);p(2,4,3,1);p(3,5,1,1);break;
  case 'quadri':p(3,0,1,1);p(2,1,3,1);p(1,2,5,1);p(0,3,7,1);p(1,4,5,1);p(2,5,3,1);p(3,6,1,1);break;
  case 'picche':p(3,0,1,1);p(2,1,3,1);p(1,2,5,1);p(0,3,7,2);p(3,5,1,1);p(2,6,3,1);break;
  case 'fiori':p(2,0,3,2);p(0,2,3,2);p(4,2,3,2);p(2,2,3,2);p(3,4,1,2);p(2,6,3,1);break;
 }
}
export const CARD_W=30,CARD_H=42;
// Carta scoperta o dorso; held = TIENI evidenziato.
export function drawCard(c,card,x,y,{faceDown=false,held=false}={}){
 px(c,x+1,y,CARD_W-2,CARD_H,PAL.ink);px(c,x,y+1,CARD_W,CARD_H-2,PAL.ink);
 if(faceDown){
  px(c,x+1,y+1,CARD_W-2,CARD_H-2,PAL.blue);px(c,x+3,y+3,CARD_W-6,CARD_H-6,PAL.blueD);
  for(let i=0;i<4;i++)for(let j=0;j<6;j++)if((i+j)%2===0)px(c,x+5+i*5,y+5+j*5,3,3,PAL.blue);
  px(c,x+12,y+18,6,6,PAL.gold);px(c,x+13,y+19,4,4,PAL.goldD);
  return;
 }
 px(c,x+1,y+1,CARD_W-2,CARD_H-2,held?PAL.cream:PAL.paper);px(c,x+1,y+CARD_H-4,CARD_W-2,3,PAL.paperD);
 const col=RED.has(card.suit)?PAL.red:PAL.ink,label=rankLabel(card.rank);
 c.fillStyle=col;c.font='bold 8px monospace';c.textAlign='left';c.fillText(label,x+3,y+10);
 drawSuit(c,card.suit,x+3,y+12,col);
 // Seme grande al centro (×2) e, per le figure, una corona dorata.
 c.save();c.translate(x+CARD_W/2-7,y+CARD_H/2-5);c.scale(2,2);drawSuit(c,card.suit,0,0,col);c.restore();
 if(card.rank>=11&&card.rank<=13){px(c,x+11,y+13,8,2,PAL.gold);px(c,x+11,y+11,2,2,PAL.gold);px(c,x+14,y+11,2,2,PAL.gold);px(c,x+17,y+11,2,2,PAL.gold);}
 c.textAlign='right';c.fillText(label,x+CARD_W-3,y+CARD_H-6);
 // TIENI: nastro dorato dentro la carta (fuori dalla tabella delle combinazioni).
 if(held){px(c,x,y,CARD_W,2,PAL.gold);px(c,x,y+CARD_H-2,CARD_W,2,PAL.gold);px(c,x+1,y+CARD_H-13,CARD_W-2,8,PAL.gold);
  c.fillStyle=PAL.ink;c.font='bold 6px monospace';c.textAlign='center';c.fillText('TIENI',x+CARD_W/2,y+CARD_H-7);}
}
const W=192,H=128;
export const CARD_X=Object.freeze([9,45,81,117,153]);
const CARD_Y=57;
// Schermata intera: cornice, tabella delle combinazioni, 5 carte, TIENI, crediti e messaggio.
export function drawPokerScreen(c,view){
 const {hand=[],faceDown=true,held=[],credits=0,bet=1,message='',highlight=null,flash=0,lights=0,revealed=5}=view;
 c.imageSmoothingEnabled=false;
 px(c,0,0,W,H,'#2a1612');px(c,3,3,W-6,H-6,PAL.feltD);px(c,5,5,W-10,H-10,PAL.felt);
 for(let i=0;i<12;i++){const on=(i+lights)%3===0;px(c,12+i*14,6,6,3,on?PAL.gold:'#6b4a1c');}
 c.fillStyle=PAL.cream;c.font='bold 8px monospace';c.textAlign='center';c.fillText('POKER DEL GOLFO',W/2,17);
 // Tabella: 2 colonne, la riga vinta lampeggia in oro.
 px(c,9,20,174,33,PAL.feltD);
 c.font='6px monospace';
 POKER_PAYTABLE.forEach((row,i)=>{
  const col=i<5?0:1,line=i<5?i:i-5,x=col?101:13,y=27+line*6;
  const on=highlight===row.kind;
  if(on)px(c,x-2,y-5,80,6,flash?PAL.goldD:PAL.feltL);
  c.fillStyle=on?PAL.cream:PAL.gold;c.textAlign='left';c.fillText(row.label,x,y);
  c.textAlign='right';c.fillText('×'+row.pay*bet,x+76,y);
 });
 for(let i=0;i<5;i++){
  const card=hand[i];
  drawCard(c,card,CARD_X[i],CARD_Y,{faceDown:faceDown||!card||i>=revealed,held:!!held[i]});
 }
 px(c,9,104,174,19,'#1e120e');
 c.fillStyle=PAL.gold;c.font='bold 7px monospace';c.textAlign='left';c.fillText('CREDITI '+credits,14,113);
 c.textAlign='right';c.fillText('PUNTATA '+bet,178,113);
 c.textAlign='center';c.fillStyle=flash?'#f2d24b':PAL.cream;c.font='6px monospace';c.fillText(String(message).slice(0,44),W/2,120);
}
// Da coordinate del canvas (pixel logici) alla carta toccata, o -1.
export function cardAt(x,y){
 if(y<CARD_Y-8||y>CARD_Y+CARD_H)return -1;
 return CARD_X.findIndex(cx=>x>=cx&&x<=cx+CARD_W);
}

/* ---------- Pannello nel gioco ---------- */
let open=null;
export const isPokerOpen=()=>!!open;
function ensurePanel(doc){
 let panel=doc.getElementById('poker-panel');if(panel)return panel;
 panel=doc.createElement('section');panel.id='poker-panel';panel.className='slot-panel poker-panel';panel.hidden=true;
 panel.setAttribute('role','dialog');panel.setAttribute('aria-label','Video poker arcade con crediti virtuali');
 const holds=[0,1,2,3,4].map(i=>'<button id="poker-hold-'+i+'" type="button" class="poker-hold" aria-pressed="false" aria-label="Tieni o scarta la carta '+(i+1)+'">TIENI '+(i+1)+'</button>').join('');
 panel.innerHTML='<div class="slot-card"><canvas id="poker-canvas" width="'+W+'" height="'+H+'" aria-label="Carte del video poker"></canvas>'+
  '<div class="slot-controls poker-holds">'+holds+'</div>'+
  '<div class="slot-controls"><button id="poker-bet-down" type="button" aria-label="Puntata più bassa">PUNTATA −</button>'+
  '<button id="poker-deal" type="button" class="slot-spin">DAI CARTE</button>'+
  '<button id="poker-bet-up" type="button" aria-label="Puntata più alta">PUNTATA ＋</button>'+
  '<button id="poker-restart" type="button" hidden>RICOMINCIA DA 50</button>'+
  '<button id="poker-exit" type="button">ESCI</button></div>'+
  '<p class="slot-rules">Jacks or Better: 5 carte, scegli quali TENERE (tasti 1–5 o tocca la carta), un solo CAMBIO. '+
  'Vince da una coppia di J in su; la tabella mostra i crediti per la puntata. SPAZIO/INVIO dai/cambia · ←/→ puntata · ESC esce.</p>'+
  '<p class="slot-note">Solo crediti virtuali di gioco: non si comprano, non si ricaricano a pagamento, non valgono denaro. Video poker di fantasia, non collegato a scommesse.</p></div>';
 (doc.querySelector('.stage')||doc.body).appendChild(panel);
 return panel;
}
/* Apre il video poker sopra la scena (che resta in pausa: game.mjs controlla isPokerOpen()).
 * storage: dove salvare i crediti (localStorage nel gioco). onExit: richiamata all'uscita. */
export function openPokerMachine({onExit=()=>{},storage=globalThis.localStorage,doc=globalThis.document,now=()=>performance.now()}={}){
 if(open||!doc)return false;
 const panel=ensurePanel(doc),canvas=doc.getElementById('poker-canvas'),c=canvas.getContext('2d');
 const save=readPokerSave(storage)||freshPokerSave();writePokerSave(storage,save);
 // Mano in corso dopo un ricaricamento: stesse carte, stessi TIENI, puntata già pagata.
 const view={hand:save.phase==='hold'?currentHand(save):[],faceDown:save.phase!=='hold',held:save.held.slice(),credits:save.credits,bet:save.bet,
  message:save.phase==='hold'?'MANO IN CORSO · SCEGLI E CAMBIA':canDeal(save)?'PUNTA E DAI CARTE':'CREDITI FINITI',highlight:null,flash:0,lights:0,revealed:5};
 let anim=null,raf=0;
 const $=id=>doc.getElementById(id);
 const refresh=()=>{
  view.bet=save.bet;view.held=save.phase==='hold'?save.held.slice():view.held;
  for(let i=0;i<5;i++){const b=$('poker-hold-'+i);b.disabled=save.phase!=='hold'||!!anim;b.setAttribute('aria-pressed',save.phase==='hold'&&save.held[i]?'true':'false');b.textContent=(save.phase==='hold'&&save.held[i]?'TENUTA ':'TIENI ')+(i+1);}
  $('poker-deal').textContent=save.phase==='hold'?'CAMBIA':'DAI CARTE';
  $('poker-deal').disabled=!!anim||(save.phase==='idle'&&!canDeal(save));
  $('poker-bet-down').disabled=$('poker-bet-up').disabled=save.phase!=='idle'||!!anim;
  $('poker-restart').hidden=!(save.phase==='idle'&&save.credits<POKER_RULES.bets[0]);
  drawPokerScreen(c,view);
 };
 const frame=()=>{
  raf=0;const t=now();view.lights=Math.floor(t/200);
  if(anim){
   const shown=Math.min(5,Math.floor((t-anim.start)/1000/POKER_RULES.dealStep)+1);view.revealed=shown;
   if(shown>=5){view.revealed=5;anim.done?.();anim=null;}
  }
  refresh();if(open)raf=requestAnimationFrame(frame);
 };
 const deal=()=>{
  if(anim)return;
  if(save.phase==='hold'){
   const result=drawOnce(save);if(!result)return;
   writePokerSave(storage,save); // vincita salvata subito, una volta sola
   view.hand=result.hand;view.faceDown=false;view.held=result.held;view.highlight=result.win>0?result.kind:null;view.flash=result.win>0?1:0;
   view.credits=save.credits;view.message=pokerResultText(result);refresh();return;
  }
  const r=dealOnce(save);if(!r){view.message='CREDITI INSUFFICIENTI · CAMBIA PUNTATA';refresh();return;}
  writePokerSave(storage,save); // puntata salvata subito: ricaricando torna questa stessa mano
  view.hand=r.hand;view.faceDown=false;view.held=[false,false,false,false,false];view.highlight=null;view.flash=0;view.credits=save.credits;
  view.revealed=0;view.message='SCEGLI LE CARTE DA TENERE, POI CAMBIA';anim={start:now()};
 };
 const hold=i=>{if(!anim&&toggleHold(save,i)){writePokerSave(storage,save);refresh();}};
 const bet=dir=>{if(!anim&&save.phase==='idle'){changePokerBet(save,dir);writePokerSave(storage,save);refresh();}};
 const close=()=>{
  if(!open)return;open=null;panel.hidden=true;if(raf)cancelAnimationFrame(raf);
  doc.removeEventListener('keydown',onKey,true);writePokerSave(storage,save);onExit({credits:save.credits,hands:save.hands,phase:save.phase});
 };
 const onKey=e=>{
  if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();close();return;}
  if(e.code==='Space'||e.key==='Enter'){e.preventDefault();e.stopImmediatePropagation();if(!e.repeat)deal();return;}
  if(/^[1-5]$/.test(e.key)){e.preventDefault();e.stopImmediatePropagation();hold(Number(e.key)-1);return;}
  if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();e.stopImmediatePropagation();bet(e.key==='ArrowRight'?1:-1);return;}
  e.stopImmediatePropagation();
 };
 for(let i=0;i<5;i++)$('poker-hold-'+i).onclick=()=>hold(i);
 canvas.onclick=e=>{const b=canvas.getBoundingClientRect();if(!b.width)return;const i=cardAt((e.clientX-b.left)*W/b.width,(e.clientY-b.top)*H/b.height);if(i>=0)hold(i);};
 $('poker-deal').onclick=deal;$('poker-exit').onclick=close;
 $('poker-bet-down').onclick=()=>bet(-1);$('poker-bet-up').onclick=()=>bet(1);
 $('poker-restart').onclick=()=>{if(restartPokerCredits(save)){writePokerSave(storage,save);view.message='SI RICOMINCIA DA 50 CREDITI';refresh();}};
 doc.addEventListener('keydown',onKey,true);
 open={close,save};panel.hidden=false;refresh();raf=requestAnimationFrame(frame);
 $('poker-deal').focus?.({preventScroll:true});
 return true;
}
export function closePokerMachine(){open?.close();}
