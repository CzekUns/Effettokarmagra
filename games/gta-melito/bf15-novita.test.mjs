import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {NOVITA,NOVITA_STORAGE_KEY,novitaAvailable,novitaTarget,findStandingPoint,minutesAtHour,
 loadJudgements,saveJudgements,toggleJudgement,judgementSummary,renderNovita} from './novita.mjs';

const REQUIRED=['semafori','frecce','lavavetri','varchi','baie','recinti','guardiole','atlante','torre','piscina',
 'mercato','ombrelloni','posteggi','ape','ambulante','satellite','corsie','pulsante','scala','transenne','corriere','nettezza','passeggeri','lotto2-pedoni','lotto3-banchi','lotto10-12-pedoni','lotto13-14-pedoni','lotto17-20-pedoni','caricamento-artwork','dialogo-volti'];
// Una mappa finta con un esempio per ogni voce, vicino alla partenza.
const world=()=>({spawn:[100,100],
 graph:{signals:[{x:900,y:900},{x:120,y:110}]},
 people:[{profession:'lavavetri',x:130,y:100},{profession:'vigile',x:101,y:101}],
 borderGates:[{x:5,y:300},{x:400,y:5}],
 parkingBays:{strips:[{ax:0,ay:200,ux:1,uy:0,from:10,to:24,offset:5,side:1}]},
 enclosures:{list:[{id:'municipio',nome:'Complesso del Municipio',cx:300,cy:300,gates:[{x:290,y:300,barrier:true}]},
  {id:'villa-comunale',nome:'Villa comunale',cx:500,cy:500,gates:[{x:480,y:500,barrier:false}]}]},
 buildings:[{id:1,bounds:[10,10,20,20],art:{glass:true}},{id:2,bounds:[40,40,60,60],art:{ruinPool:true}},{id:733703815,bounds:[200,200,220,240],art:{}}],
 waterTowers:[{x:310,y:290}],
 market:{stalls:[{x:1160,y:940},{x:1180,y:950}]},
 cars:[{model:'panda-modern-white',x:105,y:105},{model:'ape-vissuta-verde',x:150,y:160}],traffic:[],
 foodVendors:[{fryer:{x:700,y:710}},{fryer:{x:140,y:120}}],
 roads:[{n:'Via Francesco Rossi',p:[0,0,50,0,100,0,150,0]}]});

test('BF15 every new provisional element has its entry, author, PR and what to look at',()=>{
 const ids=NOVITA.map(e=>e.id);
 assert.equal(new Set(ids).size,ids.length,'unique ids');
 for(const id of REQUIRED)assert.ok(ids.includes(id),'entry '+id);
 for(const e of NOVITA){
  assert.ok(e.nome&&e.lavoro&&e.pr&&e.cosa,'complete entry '+e.id);
  assert.ok(e.trova===null||typeof e.trova==='function');
  if(Number.isFinite(e.ora))assert.ok(e.ora>=0&&e.ora<1440);
 }
 assert.ok(Object.isFrozen(NOVITA)&&Object.isFrozen(NOVITA[0]));
});

test('BF15 VAI A VEDERE finds a real example for each entry (the closest to the start where it matters)',()=>{
 const s=world(),at=id=>novitaTarget(NOVITA.find(e=>e.id===id),s);
 assert.deepEqual(at('semafori'),{x:120,y:110},'the signal near the start, not the far one');
 assert.deepEqual(at('lavavetri'),{x:130,y:100},'only window washers');
 assert.deepEqual(at('varchi'),{x:5,y:300});
 assert.deepEqual(at('baie'),{x:17,y:205},'middle of the strip, at the stall offset on its side');
 assert.deepEqual(at('recinti'),{x:480,y:500},'the villa comunale');
 assert.deepEqual(at('guardiole'),{x:290,y:300},'a gate with a barrier');
 assert.deepEqual(at('atlante'),{x:15,y:15});
 assert.deepEqual(at('piscina'),{x:50,y:50});
 assert.deepEqual(at('torre'),{x:310,y:290});
 assert.deepEqual(at('mercato'),{x:1168,y:948});
 assert.deepEqual(at('ombrelloni'),{x:1160,y:940},'a stall of the market');
 assert.deepEqual(at('ape'),{x:150,y:160},'one of the 16 Ape Car variants');
 assert.deepEqual(at('ambulante'),{x:140,y:120});
 assert.deepEqual(at('satellite'),{x:210,y:220},'Santa Maria delle Grazie in Piazza Santo Stefano');
 assert.deepEqual(at('corsie'),{x:100,y:0});
 assert.equal(at('pulsante'),null,'phone-only entry: description, no jump');
});

test('BF15 entries «in arrivo» stay off until their feature is really in the game',()=>{
 const s=world();
 for(const id of ['corriere','nettezza','passeggeri','scala','transenne']){
  const e=NOVITA.find(q=>q.id===id);
  assert.equal(novitaAvailable(e,s),false,id+' off');assert.equal(novitaTarget(e,s),null);
 }
 s.traffic.push({model:'furgone-corriere-giallo',x:111,y:111},{model:'camion-nettezza-urbana',x:112,y:112},{model:'panda-fire-red',x:113,y:113,passengers:[{seed:1}]});
 s.worldScale={vehicle:.75};
 assert.deepEqual(novitaTarget(NOVITA.find(q=>q.id==='corriere'),s),{x:111,y:111});
 assert.deepEqual(novitaTarget(NOVITA.find(q=>q.id==='nettezza'),s),{x:112,y:112});
 assert.deepEqual(novitaTarget(NOVITA.find(q=>q.id==='passeggeri'),s),{x:113,y:113});
 assert.equal(novitaAvailable(NOVITA.find(q=>q.id==='scala'),s),true);
 assert.equal(novitaAvailable(NOVITA.find(q=>q.id==='transenne'),s),false,'barriers are not in the game yet');
});

test('BF15 the player is placed on a free walkable spot near the example, facing it, never inside it',()=>{
 const target={x:0,y:0},walkable=(x,y)=>y>3,free=(x,y)=>!(Math.abs(x)<1&&y>3&&y<9);
 const p=findStandingPoint(target,{walkable,free},{min:6,max:20});
 const d=Math.hypot(p.x,p.y);
 assert.ok(d>=6-1e-9&&d<=20+1e-9,'between min and max: '+d);
 assert.ok(walkable(p.x,p.y)&&free(p.x,p.y));
 assert.ok(Math.abs(Math.atan2(-p.y,-p.x)-p.a)<1e-9,'looking at the example');
 assert.equal(findStandingPoint(target,{walkable:()=>false}),null,'nowhere to stand: no jump');
 assert.equal(findStandingPoint(null),null);
});

test('BF15 the clock jumps to the hour of the example on the same game day',()=>{
 assert.equal(minutesAtHour(1440*3+600,21*60+30),1440*3+1290);
 assert.equal(minutesAtHour(450,720),720);
});

test('BF15 judgements: MI PIACE / DA RIFARE toggled, kept only in this browser, copied as text',()=>{
 const mem=new Map(),storage={getItem:k=>mem.get(k)??null,setItem:(k,v)=>mem.set(k,v)};
 let j=toggleJudgement({},'torre','ok');j=toggleJudgement(j,'ape','rifare');j=toggleJudgement(j,'ape','rifare');
 assert.deepEqual(j,{torre:'ok'},'a second click clears it');
 j=toggleJudgement(j,'mercato','boh');assert.deepEqual(j,{torre:'ok'},'only the two judgements');
 saveJudgements(storage,{...j,lavavetri:'rifare'});
 mem.set(NOVITA_STORAGE_KEY,JSON.stringify({...JSON.parse(mem.get(NOVITA_STORAGE_KEY)),inesistente:'ok'}));
 assert.deepEqual(loadJudgements(storage),{torre:'ok',lavavetri:'rifare'},'unknown entries dropped');
 assert.deepEqual(loadJudgements({getItem:()=>'{rotto'}),{},'broken data: empty');
 assert.deepEqual(loadJudgements({getItem:()=>{throw Error('no');}}),{});
 const text=judgementSummary({torre:'ok',lavavetri:'rifare'},{date:new Date('2026-10-20T12:00:00Z')});
 assert.match(text,/2026-10-20/);
 assert.match(text,/MI PIACE \(1\):\n- Torre del serbatoio a scacchi \(BF12, PR #50\)/);
 assert.match(text,/DA RIFARE \(1\):\n- Lavavetri ai semafori/);
 assert.match(text,/NON ANCORA GIUDICATE \(\d+\):/);
 assert.doesNotMatch(text,/Furgone del corriere/,'«in arrivo» entries are not asked for a judgement');
});

// DOM minimo per provare la lista senza browser
function fakeDocument(){
 class El{constructor(tag){this.tag=tag;this.children=[];this.dataset={};this.attrs={};this.listeners={};this.textContent='';this.disabled=false;this.className='';this.ownerDocument=doc;}
  append(...k){this.children.push(...k);}setAttribute(k,v){this.attrs[k]=v;}addEventListener(t,f){this.listeners[t]=f;}
  set textContent(v){this._t=v;if(v==='')this.children=[];}get textContent(){return this._t;}}
 const doc={createElement:tag=>new El(tag)};
 return {doc,root:new El('div')};
}
test('BF15 the pause-menu list: one row per entry, VAI A VEDERE and the two judgements wired, «in arrivo» disabled',()=>{
 const {root}=fakeDocument(),gone=[],judged=[];
 renderNovita(root,{state:world(),judgements:{torre:'ok'},onGo:e=>gone.push(e.id),onJudge:(id,v)=>judged.push(id+':'+v)});
 assert.equal(root.children.length,NOVITA.length);
 const row=id=>root.children.find(r=>r.dataset.novita===id),buttons=r=>r.children.at(-1).children;
 const torre=row('torre');
 assert.match(torre.children[1].textContent,/BF12 · PR #50 · PROVVISORIO · da approvare · MI PIACE/);
 assert.equal(buttons(torre)[1].attrs['aria-pressed'],'true');
 buttons(torre)[0].listeners.click();buttons(torre)[2].listeners.click();
 assert.deepEqual(gone,['torre']);assert.deepEqual(judged,['torre:rifare']);
 const corriere=row('corriere');
 assert.match(corriere.className,/novita-off/);assert.match(corriere.children[1].textContent,/IN ARRIVO/);
 assert.ok(buttons(corriere).every(b=>b.disabled));
 assert.equal(buttons(row('pulsante'))[0].disabled,true,'no jump for the phone-only entry');
});

test('BF15 game wiring: section in the PAUSE menu (also on phones), preview of hour/weather/market, way back, list for the merger',async()=>{
 const [game,html,agents,doc,log]=await Promise.all(['game.mjs','index.html','AGENTS.md','NOVITA_DA_APPROVARE.md','BUGFIX_TODO.md'].map(f=>readFile(new URL('./'+f,import.meta.url),'utf8')));
 assert.match(game,/import \{renderNovita,novitaTarget,findStandingPoint,minutesAtHour,loadJudgements,saveJudgements,toggleJudgement,judgementSummary,NOVITA\} from '\.\/novita\.mjs\?v=\d+'/);
 assert.equal((game.match(/weatherAt\(state\.npcClockMinutes,\{forced:state\.preview\?\.weather\|\|FORCED_WEATHER\}\)/g)||[]).length>=2,true,'weather preview where the weather is computed');
 assert.match(game,/force:FORCE_MARKET\|\|!!state\.preview\?\.market/);
 assert.match(game,/const openPause=\(\)=>\{carRadio\.duck\(true\);refreshNovita\(\);/,'refreshed on every opening');
 assert.match(game,/function goToNovita\(entry\)\{[\s\S]{0,1600}findStandingPoint\(target,\{walkable:novitaStandOK\}/);
 assert.match(game,/if\(!state\.preview\)state\.preview=\{back:\{x:p\.x,y:p\.y,a:p\.a,car:p\.car,minutes:state\.npcClockMinutes/,'the way back is the place before the first jump');
 assert.match(game,/function backFromNovita\(\)\{[\s\S]{0,1200}state\.npcClockMinutes=back\.minutes;state\.preview=null;/);
 const sections=[...html.matchAll(/<section class="pause-section ([a-z-]+)"/g)].map(m=>m[1]);
 assert.ok(sections.indexOf('pause-novita')===sections.indexOf('pause-play')+1,'right after map/zoom/sounds');
 for(const id of ['novita-list','novita-back','novita-copy','novita-export','novita-count'])assert.match(html,new RegExp('id="'+id+'"'));
 assert.match(html,/\.pause-section\.pause-novita\{display:block!important;/,'visible on phones too');
 assert.ok(Number((html.match(/game\.mjs\?v=(\d+)/)||[])[1])>=175);
 assert.match(agents,/NOVITA_DA_APPROVARE\.md/);
 for(const e of NOVITA)assert.ok(doc.includes('`'+e.id+'`'),'merger list has '+e.id);
 assert.match(log,/### \[ \] BF15 — Menu NOVITÀ/);
});
