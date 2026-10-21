/* GTA Melito — Lotto 15: dialoghi con volto (prototipo per la storyline). PROVVISORIO, da approvare da Simone.
 * Decisione di Simone (21/10/2026): le battute delle missioni vanno in una BARRA nella parte bassa dello
 * schermo, con accanto il RIQUADRO del volto di chi parla (illustrazioni cel-shaded di CODEX-GH, 256×256).
 * Il modulo non è agganciato alle missioni esistenti: si prova da PAUSA › NOVITÀ › «dialogo-volti» › PROVA.
 *
 * Uso: openDialogue([{speaker:'nonna',name:'Nonna Assunta',text:'…'},…]) → la barra #dialogue compare,
 * il testo scorre a macchina da scrivere; un tocco/click sulla barra, INVIO, SPAZIO o il pulsante AVANTI
 * completano la riga oppure passano alla battuta dopo; dopo l'ultima la barra si chiude. ESC chiude subito.
 * Mentre è aperta game.mjs azzera i comandi di movimento (il mondo e l'orologio NPC vanno avanti).
 * Come si aggiunge un volto: PNG 256×256 in assets/portraits/ e una riga in PORTRAITS. */
export const PORTRAIT_DIR='./assets/portraits/';
export const PORTRAIT_SIZE=256;
export const PORTRAIT_AUTHOR='CODEX-GH · lotto 15';
/* id → file e nome di ruolo (il nome da mostrare lo decide ogni battuta con `name`; se manca si usa questo). */
export const PORTRAITS=Object.freeze({
 nonna:Object.freeze({file:'nonna.png',name:'Nonna',ruolo:'nonna severa',lotto:'15 · 01'}),
 meccanico:Object.freeze({file:'meccanico.png',name:'Meccanico',ruolo:'meccanico',lotto:'15 · 02'}),
 'ragazza-cuffie':Object.freeze({file:'ragazza-cuffie.png',name:'Ragazza',ruolo:'ragazza con le cuffie',lotto:'15 · 03'}),
 vigile:Object.freeze({file:'vigile.png',name:'Vigile urbano',ruolo:'vigile urbano',lotto:'15 · 04'}),
 barista:Object.freeze({file:'barista.png',name:'Barista',ruolo:'barista anziano',lotto:'15 · 05'}),
 ragazzo:Object.freeze({file:'ragazzo.png',name:'Ragazzo',ruolo:'ragazzo quindicenne',lotto:'15 · 06'})
});
export const PORTRAIT_IDS=Object.freeze(Object.keys(PORTRAITS));
export function portraitSrc(id){const p=PORTRAITS[id];return p?PORTRAIT_DIR+p.file:'';}

/* Dialogo di esempio: sei battute, una per volto, personaggi inventati, tono di paese. Nessuna persona reale. */
export const DEMO_DIALOGUE=Object.freeze([
 {speaker:'nonna',name:'Nonna Assunta',text:'Guagliò, a quest’ora ancora in giro? Vai a prendere il pane prima che chiude, e piano con quel motorino.'},
 {speaker:'meccanico',name:'Ciro il meccanico',text:'La Panda te la tengo pronta per domani. Oggi mi manca un pezzo, è rimasto dal ricambista a Giugliano.'},
 {speaker:'ragazza-cuffie',name:'Marika',text:'Se passi dal mercato prendimi le olive al banco vicino alla fontana. Ti aspetto in piazza, davanti alla chiesa.'},
 {speaker:'vigile',name:'Il vigile',text:'Qui non si parcheggia, c’è la fermata del pullman. Sposta la macchina adesso e non ne parliamo più.'},
 {speaker:'barista',name:'Don Peppino',text:'Caffè e cornetto, come sempre? Il giornale sta sul bancone: stamattina parlano del mercato del venerdì.'},
 {speaker:'ragazzo',name:'Totò',text:'Zì, mi dai un passaggio fino al campetto? Ti faccio vedere la strada corta dietro la chiesa.'}
].map(Object.freeze));

export const TYPE_MS=26;// millisecondi per lettera (macchina da scrivere)
const IDS={bar:'dialogue',portrait:'dialogue-portrait',name:'dialogue-name',text:'dialogue-text',next:'dialogue-next',counter:'dialogue-counter'};
let current=null;// {lines,index,shown,typing,timer,onClose,doc,charMs,els}

const $=(doc,id)=>doc?.getElementById?doc.getElementById(id):null;
const elements=doc=>{const els={};for(const [k,id] of Object.entries(IDS))els[k]=$(doc,id);return els;};
/* Le battute si ripuliscono: speaker sconosciuto → senza volto, nome dal ritratto se manca, testo sempre stringa. */
export function normaliseLines(lines){
 return (Array.isArray(lines)?lines:[]).filter(l=>l&&typeof l==='object').map(l=>{
  const speaker=PORTRAITS[l.speaker]?String(l.speaker):null;
  const name=String(l.name??(speaker?PORTRAITS[speaker].name:'')).trim();
  return {speaker,name,text:String(l.text??'').trim()};
 }).filter(l=>l.text);
}

export function isDialogueOpen(){return !!current;}
/* Stato per test e per il gioco: indice della battuta, totale, se sta ancora scrivendo e il testo visibile. */
export function dialogueState(){
 if(!current)return null;
 const line=current.lines[current.index];
 return {index:current.index,total:current.lines.length,typing:current.typing,speaker:line.speaker,name:line.name,shown:current.shown,text:line.text};
}

function paint(){
 if(!current)return;
 const {els}=current,line=current.lines[current.index];
 if(els.text)els.text.textContent=current.shown;
 if(els.counter)els.counter.textContent=(current.index+1)+' / '+current.lines.length;
 if(els.next)els.next.textContent=current.typing?'SALTA ›':(current.index+1<current.lines.length?'AVANTI ›':'CHIUDI ✕');
 if(els.name)els.name.textContent=line.name.toUpperCase();
}
function stopTimer(){if(current?.timer!=null){clearTimeout(current.timer);current.timer=null;}}
function showLine(){
 const {els}=current,line=current.lines[current.index];
 if(els.portrait){
  if(line.speaker){els.portrait.src=portraitSrc(line.speaker);els.portrait.alt=line.name;els.portrait.hidden=false;}
  else{els.portrait.removeAttribute?.('src');els.portrait.alt='';els.portrait.hidden=true;}
 }
 if(els.bar){els.bar.dataset.speaker=line.speaker||'';}
 current.shown='';current.typing=line.text.length>0;
 stopTimer();
 if(current.typing&&current.charMs>0){
  const step=()=>{if(!current||!current.typing)return;
   current.shown=current.lines[current.index].text.slice(0,current.shown.length+1);
   if(current.shown.length>=current.lines[current.index].text.length)current.typing=false;
   paint();
   if(current.typing)current.timer=setTimeout(step,current.charMs);else current.timer=null;};
  current.timer=setTimeout(step,current.charMs);
 }else{current.shown=line.text;current.typing=false;}
 paint();
}
/* Un tocco: se sta scrivendo mostra tutta la riga, altrimenti passa alla battuta dopo; dopo l'ultima chiude.
 * Ritorna 'completed' | 'next' | 'closed' | null (niente aperto). */
export function advanceDialogue(){
 if(!current)return null;
 if(current.typing){stopTimer();current.shown=current.lines[current.index].text;current.typing=false;paint();return 'completed';}
 if(current.index+1<current.lines.length){current.index++;showLine();return 'next';}
 closeDialogue();return 'closed';
}
const onKey=e=>{
 if(!current)return;
 const key=e.key||'';
 if(key==='Enter'||key===' '||e.code==='Space'||key==='Spacebar'){e.preventDefault?.();e.stopPropagation?.();if(!e.repeat)advanceDialogue();}
 else if(key==='Escape'){e.preventDefault?.();e.stopPropagation?.();closeDialogue();}
};
const onBarTap=e=>{e.preventDefault?.();advanceDialogue();};
const onNext=e=>{e.preventDefault?.();e.stopPropagation?.();advanceDialogue();};

/* Apre la barra con le battute date. Opzioni: document (per i test), charMs (0 = senza macchina da scrivere),
 * onClose() chiamato quando la barra si chiude. Se un dialogo è già aperto viene sostituito. */
export function openDialogue(lines,{document:doc=globalThis.document,charMs=TYPE_MS,onClose=null}={}){
 const clean=normaliseLines(lines);
 if(!clean.length||!doc)return false;
 if(current)closeDialogue();
 const els=elements(doc);
 current={lines:clean,index:0,shown:'',typing:false,timer:null,onClose,doc,charMs:Math.max(0,Number(charMs)||0),els};
 if(els.bar){els.bar.hidden=false;els.bar.addEventListener?.('click',onBarTap);els.bar.parentElement?.classList?.add?.('dialogue-open');}
 if(els.next)els.next.addEventListener?.('click',onNext);
 doc.addEventListener?.('keydown',onKey,{capture:true});
 showLine();
 return true;
}
export function closeDialogue(){
 if(!current)return false;
 const {els,doc,onClose}=current;
 stopTimer();
 if(els.bar){els.bar.hidden=true;els.bar.removeEventListener?.('click',onBarTap);els.bar.parentElement?.classList?.remove?.('dialogue-open');els.bar.dataset.speaker='';}
 if(els.next)els.next.removeEventListener?.('click',onNext);
 if(els.text)els.text.textContent='';
 doc.removeEventListener?.('keydown',onKey,{capture:true});
 current=null;
 if(typeof onClose==='function')onClose();
 return true;
}
