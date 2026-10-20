// Q37 — Smartphone come schermata PAUSA/START. Il tasto PAUSA (Esc/P, START sul telefono) apre un
// telefono in pixel art con una home di app. Impostazioni contiene i due volumi separati (BF10) e
// «Sviluppatore», dove finisce tutto il vecchio menu PAUSA (BF11, NOVITÀ BF15, strumenti BF13):
// gli elementi HTML vengono SPOSTATI, non ricreati, così nessun ID usato da game.mjs va perso.
// Grafica provvisoria, da far approvare al committente.

export const PHONE_APPS=Object.freeze([
 {id:'drive',label:'DRIVE',color:'#2f8fbf',kind:'gioco'},
 {id:'rider',label:'RIDER',color:'#d8a020',kind:'gioco'},
 {id:'garage',label:'GARAGE',color:'#8a5a3a',kind:'gioco'},
 {id:'mappa',label:'MAPPA',color:'#4f8a4a',kind:'gioco'},
 {id:'missioni',label:'MISSIONI',color:'#b8443c',kind:'gioco'},
 {id:'profilo',label:'PROFILO',color:'#6a5aa8',kind:'gioco'},
 {id:'impostazioni',label:'IMPOSTAZIONI',color:'#5d6b66',kind:'sistema'}]);
export const PHONE_COLUMNS=4;
// App il cui modulo arriverà con le Q successive: se esiste la funzione globale la si usa.
export const EXTERNAL_APPS=Object.freeze({rider:'openRiderApp',garage:'openGarageApp'});
export const DEV_TOOLS=Object.freeze(['zoom','reset','confronto strade','satellite','novità','prove minigiochi','crediti']);

// Icone 12×12: X = disegno chiaro, o = dettaglio scuro, Y = giallo.
export const PHONE_ICONS=Object.freeze({
 drive:['....XXXX....','...XXXXXX...','..XXXooXXX..','..XXo..oXX..','..XXo..oXX..','..XXXooXXX..','...XXXXXX...','....XXXX....','.....XX.....','.....XX.....','..oooooooo..','............'],
 rider:['......YYYY..','......YoYY..','..XXX.YYYY..','....X.......','....XXXXX...','...XXXXXXX..','.XXXXXXXXXX.','XooX....XooX','XooX....XooX','.XX......XX.','............','............'],
 garage:['.....XX.....','....XXXX....','...XXXXXX...','..XXXXXXXX..','.XXXXXXXXXX.','..X......X..','..X.oooo.X..','..X.XXXX.X..','..X.oooo.X..','..X.XXXX.X..','..XXXXXXXX..','............'],
 mappa:['............','XXX.XXX.XXX.','XoX.XXX.XoX.','XXXoXXXoXXX.','XXX.XoX.XXX.','XXX.XXX.XXX.','XoXoXXXoXXX.','XXX.XXX.XoX.','XXX.XoX.XXX.','XXX.XXX.XXX.','............','............'],
 missioni:['.....XX.....','.....XX.....','....XXXX....','XXXXXXXXXXXX','.XXXXXXXXXX.','..XXXXXXXX..','...XXXXXX...','...XXXXXX...','..XXX..XXX..','..XX....XX..','.XX......XX.','............'],
 profilo:['....XXXX....','...XXXXXX...','...XoXXoX...','...XXXXXX...','....XooX....','.....XX.....','..XXXXXXXX..','.XXXXXXXXXX.','.XXXXXXXXXX.','.XXXXXXXXXX.','............','............'],
 impostazioni:['.....XX.....','..X.XXXX.X..','..XXXXXXXX..','...XXooXX...','.XXXo..oXXX.','.XXXo..oXXX.','...XXooXX...','..XXXXXXXX..','..X.XXXX.X..','.....XX.....','............','............']});

export function createPhone(){return {screen:'home',focus:0,stack:[],title:'',soon:null,log:[]};}

// Apre un'app. Restituisce l'azione per il gioco: 'screen' (schermata del telefono), 'map', 'missions',
// 'external' (funzione di una Q futura) o 'soon' (app non ancora pronta: «in arrivo»).
export function openPhoneApp(phone,id,env=globalThis){
 const go=(screen,title)=>{phone.stack.push(phone.screen);phone.screen=screen;phone.title=title;return 'screen';};
 const app=PHONE_APPS.find(a=>a.id===id);
 phone.log.push(id);
 if(id==='mappa')return 'map';
 if(id==='missioni')return 'missions';
 if(EXTERNAL_APPS[id]){
  const fn=env&&env[EXTERNAL_APPS[id]];
  if(typeof fn==='function'){fn();return 'external';}
  phone.soon=app.label;go('soon',app.label);return 'soon';
 }
 if(id==='drive')return go('drive','DRIVE');
 if(id==='profilo')return go('profilo','PROFILO');
 if(id==='impostazioni')return go('settings','IMPOSTAZIONI');
 if(id==='sviluppatore')return go('developer','SVILUPPATORE');
 return null;
}
// Indietro: dalla home chiude il telefono e riprende il gioco.
export function phoneBack(phone){
 if(!phone.stack.length){phone.screen='home';return 'close';}
 phone.screen=phone.stack.pop();phone.title='';return 'back';
}
export function phoneHome(phone){phone.stack=[];phone.screen='home';phone.title='';return phone;}
export function resetPhone(phone){phoneHome(phone);phone.focus=0;return phone;}

// Tastiera nella home: frecce sulla griglia, INVIO apre, ESC chiude. Fuori dalla home ESC torna indietro.
export function phoneKey(phone,key,env){
 if(phone.screen!=='home'){
  if(key==='Escape'||key==='Backspace')return phoneBack(phone);
  return null;
 }
 const n=PHONE_APPS.length,c=PHONE_COLUMNS;
 const move={ArrowLeft:-1,ArrowRight:1,ArrowUp:-c,ArrowDown:c}[key];
 if(move){const f=phone.focus+move;phone.focus=f<0?(move===-1?n-1:phone.focus):f>=n?(move===1?0:phone.focus):f;return 'focus';}
 if(key==='Enter')return openPhoneApp(phone,PHONE_APPS[phone.focus].id,env);
 if(key==='Escape')return 'close';
 return null;
}

function iconCanvas(doc,id,color){
 const c=doc.createElement('canvas');c.width=16;c.height=16;c.className='phone-icon';
 const g=c.getContext?.('2d');if(!g)return c;
 g.fillStyle='#0d1410';g.fillRect(0,0,16,16);g.fillStyle=color;g.fillRect(1,1,14,14);
 g.fillStyle='#ffffff30';g.fillRect(1,1,14,1);g.fillStyle='#00000040';g.fillRect(1,14,14,1);
 const map=PHONE_ICONS[id]||[];
 map.forEach((row,y)=>[...row].forEach((ch,x)=>{
  const fill={X:'#fff4d0',o:'#1b2a20',Y:'#ffd23a'}[ch];if(fill){g.fillStyle=fill;g.fillRect(x+2,y+2,1,1);}
 }));
 return c;
}

const CSS=`
#pause-menu.has-phone{padding:10px!important;display:flex!important;align-items:center;justify-content:center;overflow:hidden}
#pause-menu.has-phone[hidden]{display:none!important}
.phone{position:relative;display:flex;flex-direction:column;width:min(390px,100%);height:min(700px,calc(100vh - 24px));background:#1a2420;
 color:#f6ebce;font-family:inherit;padding:10px 10px 8px;box-sizing:border-box;image-rendering:pixelated;
 clip-path:polygon(0 12px,4px 12px,4px 8px,8px 8px,8px 4px,12px 4px,12px 0,calc(100% - 12px) 0,calc(100% - 12px) 4px,calc(100% - 8px) 4px,calc(100% - 8px) 8px,calc(100% - 4px) 8px,calc(100% - 4px) 12px,100% 12px,100% calc(100% - 12px),calc(100% - 4px) calc(100% - 12px),calc(100% - 4px) calc(100% - 8px),calc(100% - 8px) calc(100% - 8px),calc(100% - 8px) calc(100% - 4px),calc(100% - 12px) calc(100% - 4px),calc(100% - 12px) 100%,12px 100%,12px calc(100% - 4px),8px calc(100% - 4px),8px calc(100% - 8px),4px calc(100% - 8px),4px calc(100% - 12px),0 calc(100% - 12px));
 border:4px solid #c9b06a;box-shadow:inset 0 0 0 3px #0d1410}
.phone-bar{display:flex;justify-content:space-between;align-items:center;font:bold 10px monospace;color:#cfe7d6;background:#0d1410;padding:4px 8px;letter-spacing:.06em}
.phone-bar b{color:#ffd96b}
.phone-speaker{width:44px;height:4px;background:#0d1410;margin:0 auto 6px;box-shadow:0 0 0 2px #2e3c35}
.phone-screens{flex:1;min-height:0;position:relative;background:linear-gradient(#20352c,#122019);border:3px solid #0d1410;overflow:auto;padding:8px}
.phone-screen[hidden]{display:none}
.phone-screen h3.phone-title{margin:0 0 8px;font:bold 12px monospace;letter-spacing:.14em;color:#ffd96b;border-bottom:2px solid #3f5446;padding-bottom:4px}
.phone-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px 6px;padding:6px 2px}
.phone-app{display:flex;flex-direction:column;align-items:center;gap:4px;background:none;border:2px solid transparent;color:#f6ebce;padding:4px 0;font:bold 8px monospace;letter-spacing:.04em;min-height:auto;cursor:pointer}
.phone-app:focus,.phone-app.is-focus{outline:none;border-color:#ffd96b;background:#ffffff14}
.phone-icon{width:44px;height:44px;image-rendering:pixelated}
.phone-hint{font:9px monospace;color:#9fb3a5;text-align:center;margin:10px 0 0}
.phone-nav{display:flex;gap:6px;margin-top:6px}
.phone-nav button{flex:1;background:#30483f;border:2px solid #0d1410;color:#f2e0b9;font:bold 10px monospace;padding:7px 4px;min-height:34px}
.phone-nav #pause-close{background:#dfc27b;color:#1c2a23}
.phone-row{display:block;width:100%;text-align:left;background:#30483f;border:2px solid #0d1410;color:#f2e0b9;font:bold 11px monospace;padding:9px 10px;margin:0 0 6px;min-height:38px}
.phone-row:focus{outline:2px solid #ffd96b}
.phone-note{font:10px/1.5 monospace;color:#c6d0bf;margin:6px 0}
.phone-soon{font:bold 18px monospace;color:#ffd96b;text-align:center;margin:30px 0 8px;letter-spacing:.2em}
#phone-settings .pause-audio{flex-direction:column;align-items:stretch}
#phone-dev .pause-card{width:auto;margin:0;padding:0;border:0;box-shadow:none;background:none}
#phone-dev .pause-head{display:none}
#phone-dev .pause-section{display:block!important;margin:10px 0 0!important;padding:8px 0 0!important;border-top:1px solid #4d6150!important}
#phone-dev .pause-section h3{display:block!important}
#phone-dev .novita-list{max-height:none}
.drive-search{width:100%;box-sizing:border-box;font:bold 12px monospace;background:#0d1410;color:#f6ebce;border:2px solid #536951;padding:8px}
.drive-results{margin-top:6px}
.drive-status{font:bold 11px/1.5 monospace;color:#7fe0ff;margin:8px 0}
.drive-banner{position:absolute;z-index:4;top:10px;left:50%;transform:translateX(-50%);background:#0d1410e8;border:2px solid #4fd0ff;color:#e9fbff;
 font:bold 12px monospace;padding:6px 10px;letter-spacing:.04em;box-shadow:3px 3px #050b08;pointer-events:none;white-space:nowrap;max-width:46%;overflow:hidden;text-overflow:ellipsis}
.drive-banner[hidden]{display:none}
.drive-banner.arrived{border-color:#7dff8a;color:#d8ffd9}
@media (max-height:520px) and (orientation:landscape){
 .phone{width:min(500px,calc(100vw - 330px));min-width:300px;height:calc(100vh - 16px);padding:6px 8px}
 .phone-speaker{display:none}
 .phone-grid{grid-template-columns:repeat(7,1fr);gap:6px 2px}
 .phone-icon{width:36px;height:36px}
 .drive-banner{top:max(8px,env(safe-area-inset-top));font-size:10px;max-width:40%}
}`;

// Monta il telefono attorno al vecchio menu PAUSA. env: onMap, onMissions, onResume, onScreen(screen, el).
export function mountPhone(doc,{menu,env={}}){
 const phone=createPhone(),stub={phone,key:()=>false,opened(){},show(){},elements:{}};
 if(!doc||!menu||!doc.head||typeof menu.querySelector!=='function')return stub;
 try{return buildPhone(doc,menu,env,phone);}catch(e){console.error('GTA Melito smartphone',e);return stub;}
}
function buildPhone(doc,menu,env,phone){
 const el=(tag,attrs={},html='')=>{const e=doc.createElement(tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,v);if(html)e.innerHTML=html;return e;};
 const style=el('style',{id:'phone-style'});style.textContent=CSS;doc.head.appendChild(style);
 const card=menu.querySelector('.pause-card'),audio=menu.querySelector('.pause-audio:not(.pause-satellite)'),close=doc.getElementById('pause-close');
 const body=el('div',{class:'phone',id:'phone',role:'dialog','aria-label':'Smartphone · pausa'});
 body.appendChild(el('div',{class:'phone-speaker','aria-hidden':'true'}));
 body.appendChild(el('div',{class:'phone-bar'},'<span id="phone-clock">07:30</span><b>PAUSA</b><span aria-hidden="true">▮▮▮ ▰▰▱</span>'));
 const screens=el('div',{class:'phone-screens'});body.appendChild(screens);
 const screen=(id,name,title)=>{const s=el('section',{class:'phone-screen',id,'data-screen':name});if(name!=='home')s.hidden=true;if(title)s.appendChild(el('h3',{class:'phone-title'},title));screens.appendChild(s);return s;};
 const home=screen('phone-home','home','');
 const grid=el('div',{class:'phone-grid',role:'list'});home.appendChild(grid);
 const appButtons=PHONE_APPS.map((app,i)=>{
  const b=el('button',{type:'button',class:'phone-app','data-app':app.id,'aria-label':app.label+(app.kind==='sistema'?' · impostazioni':' · app')});
  b.appendChild(iconCanvas(doc,app.id,app.color));b.appendChild(el('span',{},app.label));
  b.addEventListener('click',()=>{phone.focus=i;run(openPhoneApp(phone,app.id,env.global||globalThis));});
  grid.appendChild(b);return b;});
 home.appendChild(el('p',{class:'phone-hint'},'FRECCE · INVIO apre · ESC chiude · tocca un’app'));
 const drive=screen('phone-drive','drive','DRIVE · NAVIGATORE');
 const soon=screen('phone-soon','soon','');
 soon.appendChild(el('p',{class:'phone-soon'},'IN ARRIVO'));
 soon.appendChild(el('p',{class:'phone-note',id:'phone-soon-note'},''));
 const profile=screen('phone-profile','profilo','PROFILO');
 profile.appendChild(el('p',{class:'phone-note',id:'phone-profile-text'},''));
 const settings=screen('phone-settings','settings','IMPOSTAZIONI');
 settings.appendChild(el('p',{class:'phone-note'},'VOLUMI SEPARATI'));
 if(audio)settings.appendChild(audio);
 const devButton=el('button',{type:'button',class:'phone-row',id:'phone-open-dev'},'SVILUPPATORE ›');
 devButton.addEventListener('click',()=>run(openPhoneApp(phone,'sviluppatore')));
 settings.appendChild(devButton);
 settings.appendChild(el('p',{class:'phone-note'},'Sviluppatore: zoom, reset, confronto strade, satellite, NOVITÀ, prove minigiochi, crediti e licenze (© OpenStreetMap · ISTAT).'));
 const dev=screen('phone-dev','developer','SVILUPPATORE');
 const games=el('section',{class:'phone-minigames'});
 games.appendChild(el('p',{class:'phone-note'},'<b>PROVE MINIGIOCHI</b> · si attivano quando il gioco della Q è pronto'));
 for(const [label,fn] of [['CALCETTO (Q33)','testFootballMatch'],['SLOT / VIDEO POKER (Q27)','testArcadeSlot'],['BILIARDO (Q29)','testBilliards']]){
  const b=el('button',{type:'button',class:'phone-row','data-minigame':fn},label);
  b.addEventListener('click',()=>{const f=(env.global||globalThis)[fn];if(typeof f==='function'){env.onResume?.();f();}else b.textContent=label+' · IN ARRIVO';});
  games.appendChild(b);}
 dev.appendChild(games);
 if(card)dev.appendChild(card);
 const nav=el('div',{class:'phone-nav'});
 const back=el('button',{type:'button',id:'phone-back','aria-label':'Indietro'},'◀ INDIETRO');
 const homeBtn=el('button',{type:'button',id:'phone-home-button','aria-label':'Home del telefono'},'● HOME');
 back.addEventListener('click',()=>run(phoneBack(phone)));
 homeBtn.addEventListener('click',()=>{phoneHome(phone);show();});
 nav.appendChild(back);nav.appendChild(homeBtn);if(close){close.textContent='RIPRENDI ▶';nav.appendChild(close);}
 body.appendChild(nav);
 menu.appendChild(body);menu.classList.add('has-phone');
 const all={home,drive,soon,profilo:profile,settings,developer:dev};
 function show(focusFirst=true){
  for(const [name,s] of Object.entries(all))s.hidden=name!==phone.screen;
  if(phone.screen==='soon'){soon.querySelector('h3')?.remove();soon.prepend(el('h3',{class:'phone-title'},phone.soon||''));
   doc.getElementById('phone-soon-note').textContent=phone.soon+' arriva con le prossime Q (Rider Q39–Q40, Garage Q35–Q36).';}
  appButtons.forEach((b,i)=>b.classList.toggle('is-focus',i===phone.focus));
  env.onScreen?.(phone.screen,all[phone.screen]);
  if(focusFirst){const target=phone.screen==='home'?appButtons[phone.focus]:all[phone.screen].querySelector('input,button');target?.focus?.({preventScroll:true});}
 }
 function run(action){
  if(action==='map')env.onMap?.();
  else if(action==='missions')env.onMissions?.();
  else if(action==='close')env.onResume?.();
  else if(action==='external')env.onResume?.();
  else show();
 }
 // Tasti: true = consumato dal telefono (il gioco non lo riceve).
 function key(e){
  const typing=e.target&&/^(INPUT|TEXTAREA)$/.test(e.target.tagName||'')&&body.contains(e.target);
  if(typing&&e.key!=='Escape'){if(e.key==='Enter')e.target.dispatchEvent?.(new (globalThis.Event)('change'));return true;}
  if(typing&&e.key==='Escape'){e.preventDefault();e.target.blur?.();run(phoneBack(phone));return true;}
  if(phone.screen!=='home'&&['ArrowUp','ArrowDown'].includes(e.key)){
   e.preventDefault();const items=[...all[phone.screen].querySelectorAll('button:not([disabled]),input')].filter(x=>x.offsetParent!==null);
   const i=items.indexOf(doc.activeElement);items[(i+(e.key==='ArrowDown'?1:-1)+items.length)%items.length]?.focus();return true;}
  if(phone.screen!=='home'&&e.key==='Enter')return true;// il pulsante a fuoco riceve il click nativo
  const action=phoneKey(phone,e.key,env.global||globalThis);
  if(action===null)return /^Arrow/.test(e.key);
  if(action==='close')return false;// lo chiude il gestore originale di Esc
  e.preventDefault();run(action==='focus'?'screen':action);
  if(action==='focus')appButtons[phone.focus]?.focus?.({preventScroll:true});
  return true;
 }
 return {phone,key,show,opened(){resetPhone(phone);show();},elements:all};
}
