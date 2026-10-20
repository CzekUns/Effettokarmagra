/* Q28 — Slot machine arcade «SLOT DEL VESUVIO»: minigioco a sé, con schermata pixel art propria.
 * SOLO CREDITI VIRTUALI DI GIOCO: non si comprano, non si ricaricano a pagamento, non valgono denaro
 * e non sono collegati a scommesse o servizi esterni. Sono separati dagli euro di gioco della Q06.
 * Ogni giro è deciso da un generatore con seme (seme salvato + numero del giro): lo stesso giro dà
 * sempre lo stesso risultato e il saldo viene salvato PRIMA dell'animazione, quindi ricaricare la
 * pagina a metà giro non duplica né annulla una vincita.
 * Aggancio per il cabinato della Q27: openSlotMachine({onExit}). Grafica provvisoria, da approvare. */
export const SLOT_SAVE_KEY='gta-melito-slot-v1';
export const SLOT_RULES=Object.freeze({startCredits:100,restartCredits:50,bets:Object.freeze([1,2,5]),spinSeconds:1.25,reelStops:Object.freeze([.55,.9,1.25])});
// Simboli napoletani di fantasia; il cornetto rosso è il simbolo più ricco.
export const SLOT_SYMBOLS=Object.freeze(['limone','caffe','pizza','baba','sfogliatella','pulcinella','vesuvio','cornetto']);
export const SLOT_NAMES=Object.freeze({limone:'LIMONI',caffe:'CAFFÈ',pizza:'PIZZE',baba:'BABÀ',sfogliatella:'SFOGLIATELLE',
 pulcinella:'PULCINELLA',vesuvio:'VESUVI',cornetto:'CORNETTI'});
// Rullo: più simboli comuni, pochi rari. Lo stesso nastro per i tre rulli.
export const SLOT_REEL=Object.freeze(['limone','caffe','pizza','limone','baba','caffe','sfogliatella','limone','pizza',
 'pulcinella','caffe','baba','limone','vesuvio','pizza','sfogliatella','caffe','cornetto']);
// Vincita = puntata × moltiplicatore. Tris su tutta la riga; coppia solo sui primi due rulli.
// Sul nastro reale rende in media circa 0,9 crediti per credito puntato: si perde piano, si vince ogni tanto.
export const SLOT_PAYTABLE=Object.freeze({
 tris:Object.freeze({limone:8,caffe:10,pizza:15,baba:25,sfogliatella:30,pulcinella:60,vesuvio:100,cornetto:200}),
 coppia:Object.freeze({limone:3,caffe:3,pizza:4,baba:5,sfogliatella:5,pulcinella:8,vesuvio:10,cornetto:15})
});
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
// mulberry32: piccolo, veloce e uguale ovunque.
export function makeRng(seed){
 let a=(Number(seed)>>>0)||1;
 return ()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};
}
// Posizione di arresto dei tre rulli per il giro n con il seme dato.
export function reelStops(seed,spinIndex){
 const rng=makeRng((Number(seed)>>>0)^Math.imul((spinIndex|0)+1,0x9E3779B1));
 return [0,1,2].map(()=>Math.floor(rng()*SLOT_REEL.length));
}
export const symbolsAt=stops=>stops.map(i=>SLOT_REEL[((i%SLOT_REEL.length)+SLOT_REEL.length)%SLOT_REEL.length]);
export function evaluate(symbols,bet){
 const [a,b,c]=symbols;
 if(a===b&&b===c)return {kind:'tris',symbol:a,win:bet*SLOT_PAYTABLE.tris[a]};
 if(a===b)return {kind:'coppia',symbol:a,win:bet*SLOT_PAYTABLE.coppia[a]};
 return {kind:'niente',symbol:null,win:0};
}
export function freshSlotSave(seed=Date.now()){
 return {version:1,credits:SLOT_RULES.startCredits,spins:0,seed:(Number(seed)>>>0)||1,bet:1,best:0,lastWin:0};
}
export function readSlotSave(storage){
 try{
  const raw=storage?.getItem?.(SLOT_SAVE_KEY);if(!raw)return null;
  const s=JSON.parse(raw);if(!s||s.version!==1)return null;
  return {version:1,credits:Math.max(0,Math.floor(Number(s.credits)||0)),spins:Math.max(0,Math.floor(Number(s.spins)||0)),
   seed:(Number(s.seed)>>>0)||1,bet:SLOT_RULES.bets.includes(s.bet)?s.bet:1,best:Math.max(0,Number(s.best)||0),lastWin:Math.max(0,Number(s.lastWin)||0)};
 }catch(_){return null;}
}
export function writeSlotSave(storage,save){try{storage?.setItem?.(SLOT_SAVE_KEY,JSON.stringify(save));}catch(_){}}
export const canSpin=save=>save.credits>=save.bet;
/* Un giro: toglie la puntata, calcola il risultato e aggiunge la vincita in un solo passo.
 * Restituisce null se i crediti non bastano (nessun credito negativo). */
export function spinOnce(save){
 if(!canSpin(save))return null;
 const stops=reelStops(save.seed,save.spins),symbols=symbolsAt(stops),result=evaluate(symbols,save.bet);
 save.credits=save.credits-save.bet+result.win;save.spins+=1;save.lastWin=result.win;save.best=Math.max(save.best,result.win);
 return {stops,symbols,...result,bet:save.bet,credits:save.credits};
}
// Crediti finiti: si ricomincia gratis da 50. Non è un acquisto e non dà nulla di reale.
export function restartCredits(save){
 if(save.credits>=SLOT_RULES.bets[0])return false;
 save.credits=SLOT_RULES.restartCredits;return true;
}
export function changeBet(save,dir){
 const bets=SLOT_RULES.bets,i=clamp(bets.indexOf(save.bet)+Math.sign(dir),0,bets.length-1);
 save.bet=bets[i];return save.bet;
}
export function resultText(result){
 if(!result)return 'CREDITI INSUFFICIENTI';
 if(result.kind==='tris')return 'TRIS DI '+SLOT_NAMES[result.symbol]+'! +'+result.win+' CREDITI';
 if(result.kind==='coppia')return 'COPPIA DI '+SLOT_NAMES[result.symbol]+' · +'+result.win;
 return 'NIENTE STAVOLTA · RITENTA';
}

/* ---------- Pixel art (tutto disegnato in codice, griglia logica 16×16 per simbolo) ---------- */
const PAL={ink:'#1b1410',cream:'#f4e6c4',red:'#c8322a',redD:'#7d1b17',gold:'#e9b949',goldD:'#9b6b1d',green:'#3f7a3a',
 yellow:'#f2d24b',yellowD:'#b8962a',brown:'#8a5228',brownD:'#55301a',white:'#f6f2ea',grey:'#8d8f8c',greyD:'#4f524f',
 sky:'#6fa6c8',smoke:'#d9d6cf',dough:'#e7b46a',doughD:'#a8702f',tomato:'#d0412e',basil:'#2f7d3a'};
function px(c,x,y,w,h,col){c.fillStyle=col;c.fillRect(x,y,w,h);}
export function drawSymbol(c,name,x,y){
 const p=(dx,dy,w,h,col)=>px(c,x+dx,y+dy,w,h,col);
 switch(name){
  case 'cornetto': // cornetto portafortuna rosso, ricurvo, con cappuccio dorato
   p(10,2,3,3,PAL.gold);p(9,4,4,2,PAL.goldD);p(8,6,4,2,PAL.red);p(7,8,4,2,PAL.red);p(5,10,4,2,PAL.red);p(3,12,4,2,PAL.redD);p(2,13,2,1,PAL.redD);
   p(9,6,1,2,PAL.redD);p(8,8,1,2,PAL.redD);p(6,10,1,2,PAL.redD);p(11,6,1,1,'#ff8a73');break;
  case 'pizza': // spicchio di pizza margherita
   p(2,3,12,2,PAL.doughD);p(3,5,10,2,PAL.dough);p(4,7,8,2,PAL.dough);p(5,9,6,2,PAL.dough);p(6,11,4,2,PAL.dough);p(7,13,2,1,PAL.dough);
   p(4,5,2,2,PAL.tomato);p(9,6,2,2,PAL.tomato);p(6,9,2,2,PAL.tomato);p(8,5,1,1,PAL.white);p(7,7,2,1,PAL.white);p(10,8,1,1,PAL.basil);break;
  case 'baba': // babà a fungo, lucido
   p(4,2,8,2,PAL.brown);p(3,4,10,3,PAL.doughD);p(5,7,6,6,PAL.dough);p(6,13,4,1,PAL.doughD);p(5,3,3,1,'#c98a52');p(4,5,2,1,'#f0c27f');p(6,8,1,4,'#f3cf93');break;
  case 'sfogliatella': // sfogliatella a conchiglia con le pieghe
   p(3,4,10,2,PAL.dough);p(2,6,12,3,PAL.dough);p(3,9,10,2,PAL.dough);p(5,11,6,2,PAL.doughD);
   for(let i=0;i<5;i++)p(4+i*2,5,1,6,PAL.doughD);p(2,6,1,3,PAL.doughD);p(13,6,1,3,PAL.doughD);p(6,3,4,1,PAL.white);break;
  case 'caffe': // tazzina di caffè con piattino e vapore
   p(3,11,10,2,PAL.white);p(2,13,12,1,PAL.grey);p(4,6,7,5,PAL.white);p(11,7,2,3,PAL.white);p(12,8,1,1,PAL.grey);p(5,6,5,1,PAL.brownD);
   p(5,2,1,3,PAL.smoke);p(7,1,1,3,PAL.smoke);p(9,2,1,3,PAL.smoke);p(4,10,7,1,PAL.grey);break;
  case 'limone': // limone di Sorrento con foglia
   p(4,5,8,7,PAL.yellow);p(3,6,1,5,PAL.yellow);p(12,6,1,5,PAL.yellow);p(5,12,6,1,PAL.yellowD);p(5,6,2,2,'#fff1a0');p(2,8,1,1,PAL.yellowD);p(13,8,1,1,PAL.yellowD);
   p(8,2,4,2,PAL.green);p(7,4,2,1,PAL.green);break;
  case 'pulcinella': // maschera nera di Pulcinella con cappello bianco a pan di zucchero
   p(6,1,4,2,PAL.white);p(5,3,6,2,PAL.white);p(4,5,8,1,PAL.white);p(4,6,8,5,PAL.ink);p(5,8,2,1,PAL.white);p(9,8,2,1,PAL.white);
   p(7,9,2,3,PAL.ink);p(6,12,4,2,'#e9c9a3');p(7,12,2,1,PAL.redD);break;
  case 'vesuvio': // Vesuvio con fumo e cielo
   p(1,12,14,2,PAL.greyD);p(2,10,12,2,PAL.grey);p(4,8,8,2,PAL.grey);p(6,6,4,2,PAL.greyD);p(9,10,2,2,PAL.greyD);
   p(6,3,2,2,PAL.smoke);p(8,1,3,2,PAL.smoke);p(5,2,1,1,PAL.smoke);p(7,6,2,1,PAL.red);break;
 }
}
const W=192,H=128,REEL_STEP=34;
// Schermata intera del cabinato: cornice, luci, finestra dei rulli, pannello crediti.
export function drawSlotScreen(c,view){
 const {reels=[0,0,0],offsets=[0,0,0],credits=0,bet=1,message='',flash=0,lights=0}=view;
 c.imageSmoothingEnabled=false;
 px(c,0,0,W,H,'#2a1612');px(c,4,4,W-8,H-8,'#4a221b');px(c,6,6,W-12,H-12,PAL.redD);
 for(let i=0;i<12;i++){const on=(i+lights)%3===0;px(c,12+i*14,8,6,4,on?PAL.gold:'#6b4a1c');px(c,12+i*14,H-12,6,4,on?'#6b4a1c':PAL.gold);}
 c.fillStyle=PAL.cream;c.font='bold 9px monospace';c.textAlign='center';c.fillText('SLOT DEL VESUVIO',W/2,22);
 // Finestra dei rulli: 3 rulli × 3 simboli visibili, riga centrale vincente.
 px(c,22,28,148,58,PAL.ink);
 for(let r=0;r<3;r++){
  const rx=26+r*48;px(c,rx,30,44,54,PAL.white);
  c.save();c.beginPath();c.rect(rx,30,44,54);c.clip();
  for(let k=-2;k<=2;k++){
   const idx=reels[r]+k,sym=SLOT_REEL[((idx%SLOT_REEL.length)+SLOT_REEL.length)%SLOT_REEL.length];
   // simbolo 16×16 ingrandito ×2: quello centrale intero, dei vicini si vede solo un bordo (rullo vero)
   const sy=Math.round(57+k*REEL_STEP+offsets[r]);
   c.save();c.translate(rx+6,sy-16);c.scale(2,2);drawSymbol(c,sym,0,0);c.restore();
  }
  c.restore();
 }
 px(c,22,56,148,1,flash?PAL.gold:PAL.red);px(c,22,58,4,2,PAL.gold);px(c,166,58,4,2,PAL.gold);
 // Pannello crediti e messaggio.
 px(c,16,92,160,24,'#1e120e');
 c.fillStyle=PAL.gold;c.font='bold 8px monospace';c.textAlign='left';c.fillText('CREDITI '+credits,22,103);
 c.textAlign='right';c.fillText('PUNTATA '+bet,170,103);
 c.textAlign='center';c.fillStyle=flash?PAL.yellow:PAL.cream;c.font='7px monospace';c.fillText(message.slice(0,40),W/2,112);
}

/* ---------- Pannello nel gioco ---------- */
let open=null;
export const isSlotOpen=()=>!!open;
function ensurePanel(doc){
 let panel=doc.getElementById('slot-panel');if(panel)return panel;
 panel=doc.createElement('section');panel.id='slot-panel';panel.className='slot-panel';panel.hidden=true;
 panel.setAttribute('role','dialog');panel.setAttribute('aria-label','Slot machine arcade con crediti virtuali');
 panel.innerHTML='<div class="slot-card"><canvas id="slot-canvas" width="'+W+'" height="'+H+'" aria-label="Rulli della slot"></canvas>'+
  '<div class="slot-controls"><button id="slot-bet-down" type="button" aria-label="Puntata più bassa">PUNTATA −</button>'+
  '<button id="slot-spin" type="button" class="slot-spin">GIRA</button>'+
  '<button id="slot-bet-up" type="button" aria-label="Puntata più alta">PUNTATA ＋</button>'+
  '<button id="slot-restart" type="button" hidden>RICOMINCIA DA 50</button>'+
  '<button id="slot-exit" type="button">ESCI</button></div>'+
  '<p class="slot-rules">TRIS sulla riga: da ×8 (limoni) a ×200 (cornetti). COPPIA sui primi due rulli: da ×3 a ×15. '+
  'SPAZIO/INVIO gira · ←/→ puntata · ESC esce.</p>'+
  '<p class="slot-note">Solo crediti virtuali di gioco: non si comprano, non si ricaricano a pagamento, non valgono denaro. Slot di fantasia, non collegata a scommesse.</p></div>';
 (doc.querySelector('.stage')||doc.body).appendChild(panel);
 return panel;
}
/* Apre la slot sopra la scena (che resta in pausa: game.mjs controlla isSlotOpen()).
 * storage: dove salvare i crediti (localStorage nel gioco). onExit: richiamata all'uscita. */
export function openSlotMachine({onExit=()=>{},storage=globalThis.localStorage,doc=globalThis.document,now=()=>performance.now()}={}){
 if(open||!doc)return false;
 const panel=ensurePanel(doc),canvas=doc.getElementById('slot-canvas'),c=canvas.getContext('2d');
 const save=readSlotSave(storage)||freshSlotSave();writeSlotSave(storage,save);
 const view={reels:reelStops(save.seed,Math.max(0,save.spins-1)),offsets:[0,0,0],credits:save.credits,bet:save.bet,
  message:canSpin(save)?'PUNTA E GIRA':'CREDITI FINITI',flash:0,lights:0};
 let anim=null,raf=0;
 const $=id=>doc.getElementById(id);
 const refresh=()=>{view.credits=anim?view.credits:save.credits;view.bet=save.bet;
  $('slot-restart').hidden=save.credits>=SLOT_RULES.bets[0];$('slot-spin').disabled=!!anim||!canSpin(save);drawSlotScreen(c,view);};
 const frame=()=>{
  raf=0;const t=now();view.lights=Math.floor(t/180);
  if(anim){
   const el=(t-anim.start)/1000;let done=true;
   for(let r=0;r<3;r++){
    if(el<SLOT_RULES.reelStops[r]){done=false;view.reels[r]=anim.from[r]+Math.floor(el*14);view.offsets[r]=((el*14)%1)*REEL_STEP;}
    else{view.reels[r]=anim.result.stops[r];view.offsets[r]=0;}
   }
   if(done){view.credits=save.credits;view.message=resultText(anim.result);view.flash=anim.result.win>0?1:0;anim=null;}
  }
  refresh();if(open)raf=requestAnimationFrame(frame);
 };
 const spin=()=>{
  if(anim)return;const from=view.reels.slice(),result=spinOnce(save);
  if(!result){view.message='CREDITI INSUFFICIENTI · CAMBIA PUNTATA';refresh();return;}
  writeSlotSave(storage,save); // salvato subito: la vincita conta una volta sola anche se si ricarica a metà giro
  view.credits=save.credits-result.win; // puntata già tolta, vincita mostrata a rulli fermi
  view.flash=0;view.message='GIRA…';anim={start:now(),from,result};
 };
 const close=()=>{
  if(!open)return;open=null;panel.hidden=true;if(raf)cancelAnimationFrame(raf);
  doc.removeEventListener('keydown',onKey,true);writeSlotSave(storage,save);onExit({credits:save.credits,spins:save.spins});
 };
 const onKey=e=>{
  if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();close();return;}
  if(e.code==='Space'||e.key==='Enter'){e.preventDefault();e.stopImmediatePropagation();if(!e.repeat)spin();return;}
  if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();e.stopImmediatePropagation();if(!anim)changeBet(save,e.key==='ArrowRight'?1:-1);writeSlotSave(storage,save);refresh();return;}
  e.stopImmediatePropagation();
 };
 $('slot-spin').onclick=spin;$('slot-exit').onclick=close;
 $('slot-bet-down').onclick=()=>{if(!anim){changeBet(save,-1);writeSlotSave(storage,save);refresh();}};
 $('slot-bet-up').onclick=()=>{if(!anim){changeBet(save,1);writeSlotSave(storage,save);refresh();}};
 $('slot-restart').onclick=()=>{if(restartCredits(save)){writeSlotSave(storage,save);view.message='SI RICOMINCIA DA 50 CREDITI';refresh();}};
 doc.addEventListener('keydown',onKey,true);
 open={close,save};panel.hidden=false;refresh();raf=requestAnimationFrame(frame);
 $('slot-spin').focus?.({preventScroll:true});
 return true;
}
export function closeSlotMachine(){open?.close();}
