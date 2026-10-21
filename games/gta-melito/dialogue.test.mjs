/* Lotto 15 — dialoghi con volto: volti 256×256, PORTRAITS coerente, HTML con gli id, modulo in Node con DOM finto
 * (apertura, macchina da scrivere, avanzamento, chiusura), voce NOVITÀ con PROVA, collegamento nel gioco, registri, versioni. */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {PORTRAITS,PORTRAIT_IDS,PORTRAIT_DIR,PORTRAIT_SIZE,DEMO_DIALOGUE,TYPE_MS,portraitSrc,normaliseLines,
 openDialogue,closeDialogue,isDialogueOpen,advanceDialogue,dialogueState} from './dialogue.mjs';
import {NOVITA,renderNovita} from './novita.mjs';

const read=f=>readFile(new URL('./'+f,import.meta.url),'utf8');
const EXPECTED={nonna:'nonna.png',meccanico:'meccanico.png','ragazza-cuffie':'ragazza-cuffie.png',vigile:'vigile.png',barista:'barista.png',ragazzo:'ragazzo.png'};

test('lotto 15: sei volti PNG 256×256 in assets/portraits, uno per id di PORTRAITS, con le note di CODEX-GH',async()=>{
 assert.deepEqual(PORTRAIT_IDS,Object.keys(EXPECTED));
 assert.equal(PORTRAIT_SIZE,256);
 for(const [id,file] of Object.entries(EXPECTED)){
  assert.equal(PORTRAITS[id].file,file);
  assert.ok(PORTRAITS[id].name&&PORTRAITS[id].ruolo&&PORTRAITS[id].lotto,'nome, ruolo e lotto per '+id);
  assert.equal(portraitSrc(id),PORTRAIT_DIR+file);
  const png=await readFile(new URL('./assets/portraits/'+file,import.meta.url));
  assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a',file+' è un PNG');
  assert.equal(png.subarray(12,16).toString(),'IHDR');
  assert.equal(png.readUInt32BE(16),256,file+' larghezza');assert.equal(png.readUInt32BE(20),256,file+' altezza');
 }
 assert.equal(portraitSrc('sconosciuto'),'');
 assert.ok(Object.isFrozen(PORTRAITS)&&Object.isFrozen(PORTRAITS.nonna));
 const note=await read('assets/portraits/sources/lotto15-NOTE.md');
 assert.match(note,/Lotto 15/);assert.match(note,/Nessun volto raffigura una persona reale/);
});

test('lotto 15: dialogo di esempio con sei battute, una per volto, in italiano, senza nomi di persone reali',()=>{
 assert.equal(DEMO_DIALOGUE.length,6);
 assert.deepEqual(DEMO_DIALOGUE.map(l=>l.speaker),PORTRAIT_IDS,'una battuta per volto, nell’ordine del lotto');
 for(const l of DEMO_DIALOGUE){assert.ok(l.name&&l.text.length>20&&l.text.length<200,'battuta breve per '+l.speaker);}
 assert.ok(Object.isFrozen(DEMO_DIALOGUE)&&Object.isFrozen(DEMO_DIALOGUE[0]));
 const clean=normaliseLines([{speaker:'nonna',text:' ciao '},{speaker:'boh',name:'Tizio',text:'x'},{speaker:'vigile'},null,{text:''},{speaker:'barista',text:'ok'}]);
 assert.deepEqual(clean,[{speaker:'nonna',name:'Nonna',text:'ciao'},{speaker:null,name:'Tizio',text:'x'},{speaker:'barista',name:'Barista',text:'ok'}],
  'speaker sconosciuto → senza volto; nome dal ritratto se manca; battute vuote scartate');
});

// DOM minimo: gli id della barra, dataset, hidden, listener di click e keydown.
function fakeDocument(){
 class El{constructor(id){this.id=id;this.hidden=true;this.textContent='';this.dataset={};this.attrs={};this.listeners={};this.parentElement=null;}
  addEventListener(t,f){this.listeners[t]=f;}removeEventListener(t){delete this.listeners[t];}
  setAttribute(k,v){this.attrs[k]=v;}removeAttribute(k){delete this.attrs[k];delete this[k];}}
 const stage={classes:new Set(),classList:{add(c){stage.classes.add(c);},remove(c){stage.classes.delete(c);}}};
 const els={};for(const id of ['dialogue','dialogue-portrait','dialogue-name','dialogue-text','dialogue-next','dialogue-counter'])els[id]=new El(id);
 els.dialogue.parentElement=stage;
 const doc={listeners:{},getElementById:id=>els[id]||null,addEventListener(t,f){doc.listeners[t]=f;},removeEventListener(t){delete doc.listeners[t];}};
 return {doc,els,stage};
}
const wait=ms=>new Promise(r=>setTimeout(r,ms));

test('lotto 15: apertura, volto e nome della battuta, macchina da scrivere saltabile, AVANTI, chiusura dopo l’ultima',async()=>{
 const {doc,els,stage}=fakeDocument();let closed=0;
 assert.equal(isDialogueOpen(),false);assert.equal(dialogueState(),null);assert.equal(advanceDialogue(),null);
 assert.equal(openDialogue([],{document:doc}),false,'niente battute: non si apre');
 assert.equal(openDialogue([{speaker:'nonna',name:'Nonna Assunta',text:'Vai a prendere il pane.'},{speaker:'ragazzo',text:'Zì, un passaggio?'}],{document:doc,charMs:5,onClose:()=>closed++}),true);
 assert.equal(isDialogueOpen(),true);
 assert.equal(els.dialogue.hidden,false);assert.ok(stage.classes.has('dialogue-open'),'la plancia sa che la barra è aperta');
 assert.equal(els['dialogue-portrait'].src,'./assets/portraits/nonna.png');assert.equal(els['dialogue-portrait'].hidden,false);
 assert.equal(els['dialogue-name'].textContent,'NONNA ASSUNTA','nome in maiuscolo');
 assert.equal(els.dialogue.dataset.speaker,'nonna');
 assert.equal(els['dialogue-counter'].textContent,'1 / 2');
 let st=dialogueState();assert.equal(st.typing,true);assert.equal(st.shown,'');assert.equal(els['dialogue-next'].textContent,'SALTA ›');
 await wait(40);
 st=dialogueState();assert.ok(st.shown.length>0&&st.shown.length<st.text.length,'sta scrivendo: '+st.shown);
 assert.equal(els['dialogue-text'].textContent,st.shown);
 assert.equal(advanceDialogue(),'completed','un tocco mentre scrive mostra tutta la riga');
 assert.equal(els['dialogue-text'].textContent,'Vai a prendere il pane.');assert.equal(dialogueState().typing,false);
 assert.equal(els['dialogue-next'].textContent,'AVANTI ›');
 await wait(30);assert.equal(els['dialogue-text'].textContent,'Vai a prendere il pane.','il timer è fermo');
 // INVIO dal documento (capture) passa alla battuta dopo; il nome manca → quello del ritratto
 let prevented=0,stopped=0;
 doc.listeners.keydown({key:'Enter',preventDefault:()=>prevented++,stopPropagation:()=>stopped++});
 assert.equal(prevented,1);assert.equal(stopped,1);
 st=dialogueState();assert.equal(st.index,1);assert.equal(st.name,'Ragazzo');assert.equal(st.typing,true);
 assert.equal(els['dialogue-portrait'].src,'./assets/portraits/ragazzo.png');assert.equal(els['dialogue-name'].textContent,'RAGAZZO');
 assert.equal(els['dialogue-counter'].textContent,'2 / 2');
 doc.listeners.keydown({key:' ',code:'Space',preventDefault(){},stopPropagation(){}});// spazio: completa
 assert.equal(dialogueState().typing,false);assert.equal(els['dialogue-next'].textContent,'CHIUDI ✕');
 doc.listeners.keydown({key:'Enter',repeat:true,preventDefault(){},stopPropagation(){}});// tasto tenuto premuto: ignorato
 assert.equal(isDialogueOpen(),true);
 els['dialogue-next'].listeners.click({preventDefault(){},stopPropagation(){}});// AVANTI sull'ultima → chiude
 assert.equal(isDialogueOpen(),false);assert.equal(closed,1);
 assert.equal(els.dialogue.hidden,true);assert.ok(!stage.classes.has('dialogue-open'));
 assert.equal(els['dialogue-text'].textContent,'');assert.equal(doc.listeners.keydown,undefined,'listener tolto');
 assert.equal(els.dialogue.listeners.click,undefined);
});

test('lotto 15: tocco sulla barra, ESC chiude subito, riapertura sostituisce, charMs 0 = testo intero, closeDialogue da fuori',()=>{
 const {doc,els}=fakeDocument();let closed=0;
 openDialogue(DEMO_DIALOGUE,{document:doc,charMs:0,onClose:()=>closed++});
 assert.equal(dialogueState().typing,false);assert.equal(els['dialogue-text'].textContent,DEMO_DIALOGUE[0].text);
 els.dialogue.listeners.click({preventDefault(){}});
 assert.equal(dialogueState().index,1,'il tocco sulla barra avanza');
 assert.equal(openDialogue([{speaker:'vigile',text:'Sposta la macchina.'}],{document:doc,charMs:0}),true);
 assert.equal(closed,1,'riaprire chiude il precedente (onClose chiamato)');
 assert.equal(dialogueState().total,1);assert.equal(els['dialogue-name'].textContent,'VIGILE URBANO');
 doc.listeners.keydown({key:'Escape',preventDefault(){},stopPropagation(){}});
 assert.equal(isDialogueOpen(),false,'ESC chiude');
 openDialogue([{speaker:null,name:'Voce',text:'Senza volto.'}],{document:doc,charMs:0});
 assert.equal(els['dialogue-portrait'].hidden,true,'speaker sconosciuto: riquadro vuoto');assert.equal(els.dialogue.dataset.speaker,'');
 assert.equal(closeDialogue(),true);assert.equal(closeDialogue(),false);
 assert.equal(openDialogue(DEMO_DIALOGUE,{document:null}),false,'senza documento non si apre');
 assert.ok(TYPE_MS>=15&&TYPE_MS<=60,'velocità di scrittura leggibile');
});

test('lotto 15: voce NOVITÀ «dialogo-volti» con il pulsante PROVA al posto di VAI A VEDERE',()=>{
 const entry=NOVITA.find(e=>e.id==='dialogo-volti');
 assert.ok(entry,'voce dialogo-volti');assert.equal(entry.prova,'dialogo');assert.equal(entry.trova,null);
 assert.match(entry.nome,/dialoghi con volto/i);assert.match(entry.cosa,/PROVVISORIA/);assert.match(entry.cosa,/6 battute/);
 class El{constructor(tag){this.tag=tag;this.children=[];this.dataset={};this.attrs={};this.listeners={};this.textContent='';this.disabled=false;this.className='';}
  append(...k){this.children.push(...k);}setAttribute(k,v){this.attrs[k]=v;}addEventListener(t,f){this.listeners[t]=f;}}
 const doc={createElement:tag=>new El(tag)},root=new El('div');root.ownerDocument=doc;
 const gone=[],proved=[];
 renderNovita(root,{state:{spawn:[0,0]},onGo:e=>gone.push(e.id),onProva:e=>proved.push(e.id)});
 const row=root.children.find(r=>r.dataset.novita==='dialogo-volti'),buttons=row.children.at(-1).children;
 assert.equal(buttons[0].textContent,'PROVA');assert.equal(buttons[0].disabled,false);
 buttons[0].listeners.click();assert.deepEqual(proved,['dialogo-volti']);assert.deepEqual(gone,[]);
 const torre=root.children.find(r=>r.dataset.novita==='torre');
 assert.equal(torre.children.at(-1).children[0].textContent,'VAI A VEDERE','le altre voci come prima');
});

test('lotto 15: collegamento nel gioco, HTML con gli id, registri e versioni uguali in tutti gli import',async()=>{
 const [game,html,novita,agents,work,visual,approvare]=await Promise.all(['game.mjs','index.html','novita.mjs','AGENTS.md','WORK_LOG.md','VISUAL_PROGRESS.md','NOVITA_DA_APPROVARE.md'].map(read));
 assert.match(game,/import \{openDialogue,isDialogueOpen,DEMO_DIALOGUE\} from '\.\/dialogue\.mjs\?v=\d+'/);
 assert.match(game,/if\(isDialogueOpen\(\)\)\{for\(const key of Object\.keys\(pressed\)\)pressed\[key\]=false;stick\.x=0;stick\.y=0;\}/,'movimento fermo');
 assert.ok(!/isDialogueOpen\(\)\)\{[^}]*return;\s*\}\s*\n\s*\/\/ Q02/.test(game),'il dialogo non ferma il tick (l’orologio NPC va avanti)');
 assert.match(game,/if\(isDialogueOpen\(\)&&\$\('pause-menu'\)\.hidden\)return;/,'tasti di gioco fermi mentre la barra è aperta');
 assert.match(game,/onProva:entry=>\{if\(entry\.prova==='dialogo'\)\{closePause\(\);openDialogue\(DEMO_DIALOGUE\);\}\}/);
 assert.ok(!/openDialogue\(/.test(game.replace(/onProva:entry=>\{if\(entry\.prova==='dialogo'\)\{closePause\(\);openDialogue\(DEMO_DIALOGUE\);\}\}/,'')),'nessun aggancio alle missioni');
 for(const id of ['dialogue','dialogue-portrait','dialogue-name','dialogue-text','dialogue-next','dialogue-counter'])assert.match(html,new RegExp('id="'+id+'"'),'id '+id);
 assert.match(html,/<section class="dialogue" id="dialogue" hidden/,'nascosta per default');
 assert.match(html,/\.dialogue-portrait img\{[^}]*image-rendering:auto/,'il volto è un’illustrazione, non pixel art');
 assert.match(html,/\.dialogue-portrait\{[^}]*width:96px;height:96px/);assert.match(html,/\.dialogue-portrait\{width:72px;height:72px\}/,'72 px sul telefono');
 assert.match(html,/\.dialogue-name\{[^}]*text-transform:uppercase/);
 assert.match(html,/\(pointer:coarse\) and \(orientation:landscape\)\{\s*\.dialogue\{left:max\(184px/,'sul telefono fra levetta e pulsanti touch');
 assert.match(novita,/onProva/);
 assert.match(agents,/## Dialoghi con volto/);assert.match(agents,/openDialogue/);assert.match(agents,/PORTRAITS/);
 for(const [name,text] of [['WORK_LOG',work],['VISUAL_PROGRESS',visual],['NOVITA_DA_APPROVARE',approvare]])
  assert.ok(/dialoghi con volto/i.test(text)&&/PROVVISORI/.test(text),name+' aggiornato');
 assert.ok(approvare.includes('`dialogo-volti`'),'NOVITA_DA_APPROVARE elenca la voce');
 // versioni: una sola per modulo in tutti gli import (moduli non test + index.html)
 const names=(await readdir(new URL('./',import.meta.url))).filter(f=>(f.endsWith('.mjs')&&!f.endsWith('.test.mjs'))||f==='index.html');
 const sources=await Promise.all(names.map(read));
 for(const mod of ['dialogue','novita','game']){
  const found=new Set();
  for(const src of sources)for(const m of src.matchAll(new RegExp('\\./'+mod+'\\.mjs\\?v=(\\d+)','g')))found.add(m[1]);
  assert.equal(found.size,1,mod+'.mjs importato con una sola versione: '+[...found].join(','));
 }
 assert.ok(Number((game.match(/novita\.mjs\?v=(\d+)/)||[])[1])>=12);assert.match(game,/dialogue\.mjs\?v=001/);
 assert.ok(Number((html.match(/game\.mjs\?v=(\d+)/)||[])[1])>=209,'game.mjs?v= aggiornato');
});
