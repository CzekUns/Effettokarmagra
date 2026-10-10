(function(){
"use strict";
const C=document.getElementById("world"),g=C.getContext("2d"),W=320,H=317,S=32,MW=35,MH=24;
const R=window.NINOMON_RETRO,M=window.NINOMON_WORLD;
if(!M)throw new Error("world.js deve essere caricato prima del gioco");
if(!R||R.W!==W||R.H!==H)throw new Error("Caricare retro.js prima del gioco");
g.imageSmoothingEnabled=false;
const $=id=>document.getElementById(id);
const ui={place:$("place"),count:$("count"),tip:$("tip"),overlay:$("overlay"),tag:$("panel-tag"),title:$("panel-title"),text:$("panel-text"),actions:$("panel-actions"),portrait:$("portrait"),inspect:$("inspect"),dex:$("dex"),sound:$("sound")};
const B=window.NINOMON_BATTLE;
if(!B)throw new Error("battle.js deve essere caricato prima di game.js");
const Q=window.NINOMON_QUESTS;
if(!Q)throw new Error("quests.js deve essere caricato prima di game.js");
const battleCanvas=$("combat-art"),battleCtx=battleCanvas.getContext("2d");
battleCtx.imageSmoothingEnabled=false;
const battleUI={stage:$("battle-stage"),controls:$("battle-controls"),explore:$("explore-controls"),moves:$("battle-moves"),round:$("battle-round"),rest:$("rest"),guard:$("guard"),switch:$("switch"),partyOptions:$("party-options"),flee:$("flee")};
const ZONES=M.zones.map(z=>({title:z.name.toUpperCase(),short:z.region,entry:[16,18]}));
const ENCOUNTERS=[
 {id:"n01",number:"001",zone:0,x:9,y:15,name:"Topo sospetto",kind:"Creatura di scalo",description:"Nino sostiene che sia un esemplare rarissimo. Vincenzo vorrebbe prima controllare se si muove.",hint:"Una piccola sagoma vicino ai binari. Nino si ferma subito.",color:"#9eb5b3",glyph:"?",label:"NOME PROVVISORIO"},
 {id:"n02",number:"002",zone:1,x:22,y:15,name:"Piccione immobile",kind:"Creatura da sottopasso",description:"Da tre giorni occupa lo stesso posto. Secondo Nino sta usando una tecnica segreta.",hint:"C'è qualcosa accanto a una pozzanghera.",color:"#a4a9c5",glyph:"?",label:"NOME PROVVISORIO"},
 {id:"n03",number:"003",zone:2,x:24,y:14,name:"Pesce misterioso",kind:"Creatura da marciapiede",description:"Un mistero acquatico comparso lontano dall'acqua. Nino è già pronto a mandare una foto al gruppo.",hint:"Un oggetto dalla forma improbabile è finito sull'asfalto.",color:"#e1b59c",glyph:"?",label:"NOME PROVVISORIO"},
 {id:"n04",number:"004",zone:0,x:20,y:18,name:"Cane sfatto",kind:"Bestia di scalo",description:"Da quando gira intorno al magazzino, persino i treni hanno smesso di avvicinarsi.",hint:"Un cane spelacchiato ti fissa dalla strada sterrata.",color:"#b0a28a",glyph:"!",label:"SPRITE ORIGINALE"},
 {id:"n05",number:"005",zone:1,x:25,y:17,name:"Pagliaccio randagio",kind:"Creatura da tunnel",description:"Ride da solo sotto i piloni. Nessuno gli ha mai chiesto perché.",hint:"Una sagoma colorata dondola accanto a un pilone.",color:"#bd8aa6",glyph:"!",label:"SPRITE ORIGINALE"},
 {id:"n06",number:"006",zone:2,x:11,y:15,name:"Madama Leoparda",kind:"Divinità del marciapiede",description:"Si presenta sempre vestita per una serata che non inizia mai.",hint:"Tacco alto, orecchini enormi e un'aria poco rassicurante.",color:"#d4a8b2",glyph:"!",label:"SPRITE ORIGINALE"},
 {id:"n07",number:"007",zone:0,x:29,y:16,name:"Fumatore col cane",kind:"Coppia dello scalo",description:"Loro due pattugliano i binari dismessi, ognuno con il proprio odore.",hint:"Un tipo con le treccine non smette di fumare, nemmeno quando ti guarda.",color:"#a4a17c",glyph:"!",label:"SPRITE ORIGINALE"},
 {id:"n08",number:"008",zone:1,x:27,y:19,name:"Scimmia in felpa",kind:"Abitante del sottopasso",description:"Ha trovato una felpa rossa e da allora considera il ponte casa sua.",hint:"Una piccola figura col cappuccio sbuca da dietro un muro.",color:"#a96f5d",glyph:"!",label:"SPRITE ORIGINALE"},
 {id:"n09",number:"009",zone:2,x:31,y:16,name:"Sacco vivente",kind:"Ninomon da cassonetto",description:"La leggenda racconta che qualcuno abbia provato a portarlo via con l'umido.",hint:"Un sacco nero si muove controvento vicino ai cassonetti.",color:"#878989",glyph:"!",label:"SPRITE ORIGINALE"}
];
const TRAINERS=M.trainers.map(t=>({...t}));
const NPC=M.npcs.map(n=>({...n}));
const trainerCount=()=>TRAINERS.filter(t=>state.defeated[t.id]).length;
const intro=[
 {tag:"PROF. VINCENZO · 1/7",name:"PROF. VINCENZO",speaker:"V",text:"Oh, finalmente sei arrivato! Sono il professor Vincenzo. Ti aspettavo."},
 {tag:"PROF. VINCENZO · 2/7",name:"PROF. VINCENZO",speaker:"V",text:"Per le nostre strade vivono creature molto strane. Noi le chiamiamo NINOMON."},
 {tag:"PROF. VINCENZO · 3/7",name:"PROF. VINCENZO",speaker:"V",text:"Si nascondono fra i binari, sotto i ponti e nei vicoli pieni di graffiti."},
 {tag:"IL PRIMO NINOMON · 4/7",name:"GIALLUCA",speaker:"G",text:"Ti presento GIALLUCA! Da oggi è il tuo primo Ninomon. Occhio al Ruttino."},
 {tag:"IL TRAINER · 5/7",name:"NINO",speaker:"N",text:"Tu sei Nino, il writer. Sei sempre il primo ad accorgerti di cose strane per strada."},
 {tag:"LA NINODEX · 6/7",name:"PROF. VINCENZO",speaker:"V",text:"Ti affido la NINODEX. Sfida gli allenatori del quartiere, fotografa i loro Ninomon e registra gli avvistamenti."},
 {tag:"SI PARTE · 7/7",name:"PROF. VINCENZO",speaker:"V",text:"Comincia dallo scalo ferroviario. La città ha 64 quadranti. Apri MAPPA per orientarti: gli allenatori hanno un ! sopra la testa."}
];
const SCENERY=[
 {zone:0,x:18,y:13,name:"Orario sospeso",text:"Sul tabellone c'è scritto che il treno è in ritardo di 37 anni. Nino fotografa anche questo."},
 {zone:1,x:8,y:14,name:"Graffito misterioso",text:"Sul pilone qualcuno ha scritto: «I NINOMON ESISTONO». Vincenzo nega di essere stato lui."},
 {zone:2,x:19,y:15,name:"Scatola delle prove",text:"Tre sacchetti, un tappo e una foto sfocata. Qualcuno ha già cercato dei Ninomon qui."}
];
for(const npc of NPC){
 npc.home={x:npc.x,y:npc.y};
 npc.patrolIndex=0;npc.patrolClock=0;npc.visualX=npc.x;npc.visualY=npc.y;npc.facing="down";npc.motion=0;
}
const input={up:false,down:false,left:false,right:false};
const player={zone:0,x:16.5,y:18.5,facing:"down",walk:0,step:null,companion:{x:16.5,y:19.5,facing:"down",walk:0},companionStep:null};
const state={mode:"intro",intro:0,found:{},camera:{x:0,y:0},last:0,time:0,mute:false,ac:null,primary:null,discovered:0,firstComplete:false,lastInteract:0,battle:null,battleTarget:null,activeId:"starter",steps:0,wildCooldown:15,randomBattles:0,clues:{},defeated:{},visited:{0:true},quests:Q.blank(),introSeen:false,autosave:0};
try{const saved=JSON.parse(localStorage.getItem("ninomon-captured-v1")||"[]");if(Array.isArray(saved))for(const id of saved){if(ENCOUNTERS.some(e=>e.id===id))state.found[id]=true;}}catch(_){}
try{const id=localStorage.getItem("ninomon-active-v1");if(B.CREATURES[id]&&(id==="starter"||state.found[id]))state.activeId=id;}catch(_){}
try{
 const checkpoint=JSON.parse(localStorage.getItem("ninomon-save-v2")||"null");
 if(checkpoint&&Number.isInteger(checkpoint.zone)&&checkpoint.zone>=0&&checkpoint.zone<ZONES.length&&Number.isFinite(checkpoint.x)&&Number.isFinite(checkpoint.y)){
  if(checkpoint.x>=.5&&checkpoint.x<=MW-.5&&checkpoint.y>=.5&&checkpoint.y<=MH-.5){
   player.zone=checkpoint.zone;player.x=Math.floor(checkpoint.x)+.5;player.y=Math.floor(checkpoint.y)+.5;
  }
  if(checkpoint.defeated&&typeof checkpoint.defeated==="object")for(const t of TRAINERS)if(checkpoint.defeated[t.id]===true)state.defeated[t.id]=true;
  if(checkpoint.visited&&typeof checkpoint.visited==="object")for(let z=0;z<ZONES.length;z++)if(checkpoint.visited[z]===true)state.visited[z]=true;
  state.visited[checkpoint.zone]=true;
  state.steps=Math.max(0,Number(checkpoint.steps)||0);
  state.introSeen=checkpoint.introSeen===true;
  if(checkpoint.clues&&typeof checkpoint.clues==="object")for(const name of Object.keys(checkpoint.clues))if(SCENERY.some(item=>item.name===name))state.clues[name]=true;
   state.quests=Q.restore(checkpoint.quests);
 }
}catch(_){} 
Q.sync(state.quests,questSnapshot());
[player.x,player.y]=M.safeSpawn(player.zone,player.x,player.y,[...NPC,...TRAINERS]);
[player.companion.x,player.companion.y]=M.safeSpawn(player.zone,player.x,player.y+1,[...NPC,...TRAINERS,{zone:player.zone,x:Math.floor(player.x),y:Math.floor(player.y)}]);
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
const count=()=>ENCOUNTERS.filter(a=>state.found[a.id]).length;
function questSnapshot(){return{visited:state.visited,defeated:state.defeated,clues:state.clues,found:state.found};}
function questGoal(q){const step=Q.current(state.quests,q);if(!step)return "Missione non ancora iniziata.";const done=["visits","wins","photos"].includes(step.type)?Math.min(step.count,Q.targetCount(questSnapshot(),step.type))+"/"+step.count+" · ":"";return done+step.hint;}
function trackedQuest(){const q=Q.get(state.quests.tracked);return q&&Q.current(state.quests,q)?q:null;}
function save(){
 try{
  localStorage.setItem("ninomon-captured-v1",JSON.stringify(Object.keys(state.found)));
  localStorage.setItem("ninomon-discoveries",String(count()));
  localStorage.setItem("ninomon-save-v2",JSON.stringify({zone:player.zone,x:player.x,y:player.y,steps:state.steps,introSeen:state.introSeen,clues:state.clues,defeated:state.defeated,visited:state.visited,quests:state.quests}));
 }catch(_){}
}
function tone(freq=550,dur=.085,volume=.012){
 if(state.mute)return;
 try{
  if(!state.ac){const A=window.AudioContext||window.webkitAudioContext;if(!A)return;state.ac=new A();}
  if(state.ac.state==="suspended")state.ac.resume().catch(()=>{});
  const t=state.ac.currentTime,o=state.ac.createOscillator(),v=state.ac.createGain();
  o.type="square";o.frequency.setValueAtTime(freq,t);v.gain.setValueAtTime(volume,t);
  v.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(v).connect(state.ac.destination);o.start(t);o.stop(t+dur+.01);
 }catch(_){}
}
function updateHud(){
 ui.place.textContent=ZONES[player.zone].title;
 ui.count.textContent="NINODEX "+count()+"/"+ENCOUNTERS.length;
 const obj=nearby();
 if(state.mode==="walk"){
  ui.tip.textContent=obj?(obj.kind==="trainer"?(state.defeated[obj.data.id]?"Rivincita con ":"Sfida ")+obj.data.name:obj.kind==="clue"?"Indizio: "+obj.data.name:"Parla con "+obj.data.name)+" · A ESAMINA":(trackedQuest()?"★ "+questGoal(trackedQuest()):M.district(player.zone,player.x,player.y)+" · ! allenatore · MAPPA per orientarti");
 }
}
function addAction(label,callback,kind="main",href){
 const element=document.createElement(href?"a":"button");
 element.className="action "+(kind==="alt"?"alt":kind==="whatsapp"?"whatsapp":"");
 element.textContent=label;
 if(href){element.href=href;element.target="_blank";element.rel="noopener noreferrer";}
 else{element.type="button";element.addEventListener("click",()=>{tone(610,.055);callback();});}
 ui.actions.appendChild(element);
 if(!state.primary&&!href)state.primary=callback;
}
function panel(options){
 document.querySelectorAll(".city-map,.map-details").forEach(el=>el.remove());
 state.mode=options.mode||"dialog";
 state.primary=null;
 ui.tag.textContent=options.tag||"NINOMON";
 ui.title.textContent=options.title||"";
 ui.text.textContent=options.text||"";
 ui.portrait.textContent=options.icon||"?";
 ui.portrait.style.background=options.color||"#3d5260";
 ui.actions.textContent="";
 for(const action of options.actions)addAction(action.label,action.onClick,action.variant,action.href);
 ui.overlay.style.display="";
 ui.overlay.classList.remove("hidden");
 ui.overlay.classList.toggle("intro-scene",state.mode==="intro");
 ui.overlay.classList.toggle("title-scene",state.mode==="title");
 for(const k in input)input[k]=false;
}
function closePanel(){
 state.mode="walk";
 state.primary=null;
 state.introSeen=true;
 ui.overlay.classList.remove("intro-scene","title-scene");
 ui.overlay.classList.add("hidden");
 ui.overlay.style.display="none";
 for(const key in input)input[key]=false;
 save();updateHud();
 // Force a map draw on the same tap that ends the professor's speech.
 // This works even on phones that paused requestAnimationFrame during the intro.
 try{render();}catch(err){reportRenderFault(err);drawEmergencyWorld();}
}
function titlePanel(){
 state.intro=0;
 panel({mode:"title",tag:"NINOBOY STREET · NUOVA PARTITA",title:"I NINOMON",icon:"★",color:"#617a70",
  text:"Cronache di strada.\nIl professor Vincenzo ti aspetta.",
  actions:[{label:"INIZIA ▶",onClick:()=>{state.intro=0;introPanel();}}]});
}
function introPanel(){
 const t=intro[state.intro];
 panel({mode:"intro",tag:t.tag,title:t.name,text:t.text,icon:t.speaker,color:"#49646b",actions:[{label:state.intro===intro.length-1?"INIZIA L'AVVENTURA ▶":"AVANTI ▶",onClick(){
   state.intro++;
   if(state.intro>=intro.length)closePanel();else introPanel();
 }}]});
}
function walkBlocked(zone,x,y){return M.blocked(zone,x,y);}
function canStand(zone,x,y,ignoreNPC=false){
 const r=.22;
 if(walkBlocked(zone,x-r,y-r)||walkBlocked(zone,x+r,y-r)||walkBlocked(zone,x-r,y+r)||walkBlocked(zone,x+r,y+r))return false;
 if(!ignoreNPC&&NPC.some(n=>n.zone===zone&&Math.abs(n.x+.5-x)<.65&&Math.abs(n.y+.5-y)<.65))return false;
 if(TRAINERS.some(n=>n.zone===zone&&Math.abs(n.x+.5-x)<.65&&Math.abs(n.y+.5-y)<.65))return false;
 return true;
}
function changeZone(direction){
 const next=M.neighbor(player.zone,direction);if(next===null)return;
 const spawn={right:[1.5,16.5],left:[MW-1.5,16.5],down:[16.5,2.5],up:[16.5,MH-1.5]}[direction];
 player.zone=next;
 [player.x,player.y]=M.safeSpawn(next,...spawn,[...NPC,...TRAINERS]);
 player.facing=direction;player.step=null;player.companionStep=null;
 const [dx,dy]={right:[-1,0],left:[1,0],down:[0,-1],up:[0,1]}[direction];
 [player.companion.x,player.companion.y]=M.safeSpawn(next,player.x+dx,player.y+dy,[...NPC,...TRAINERS,{zone:next,x:Math.floor(player.x),y:Math.floor(player.y)}]);
 state.visited[next]=true;Q.sync(state.quests,questSnapshot());state.wildCooldown=12;state.zoneBannerUntil=state.time+2.5;
 tone(620,.12);save();updateHud();
}
function patrolNPCs(dt){
 for(const n of NPC){
  if(!n.patrol||n.zone!==player.zone)continue;
  const t=Math.min(1,dt/.17);
  n.visualX+=(n.x-n.visualX)*t;
  n.visualY+=(n.y-n.visualY)*t;
  n.motion=Math.abs(n.x-n.visualX)+Math.abs(n.y-n.visualY);
  if(Math.hypot(n.x+.5-player.x,n.y+.5-player.y)<2.4)continue;
  n.patrolClock+=dt;
  if(n.patrolClock<.75)continue;
  n.patrolClock=0;
  const next=(n.patrolIndex+1)%n.patrol.length;
  const [x,y]=n.patrol[next];
  if(!canStand(n.zone,x+.5,y+.5,true)||NPC.some(other=>other!==n&&other.zone===n.zone&&other.x===x&&other.y===y))continue;
  if(Math.abs(player.x-(x+.5))<1&&Math.abs(player.y-(y+.5))<1)continue;
  n.facing=x>n.x?"right":x<n.x?"left":y<n.y?"up":"down";
  n.x=x;n.y=y;n.patrolIndex=next;
 }
}
function wanderingEncounter(){
 if(count()===0||state.wildCooldown>0)return;
 // Rare secondary sightings in abandoned ground after the first discovery.
 const area=player.zone;
 const terrain=R.kind(area,Math.floor(player.x),Math.floor(player.y));
 const likely=["ballast","grass","weeds"].includes(terrain);
 if(likely&&Math.random()<.045){
  state.wildCooldown=23;state.randomBattles++;
  const choices=ENCOUNTERS.filter(c=>c.zone===M.zones[area].theme);
  const found={...choices[Math.floor(Math.random()*choices.length)],zone:area};
  panel({mode:"encounter",tag:"INCONTRO CASUALE",title:"QUALCOSA SI MUOVE!",icon:"?",color:found.color,
    text:"Nino ha visto un movimento tra i rifiuti. Potrebbe essere un "+found.name+". Vincenzo riceverà un'altra foto sfocata?",
    actions:[{label:"⚔ SFIDA",onClick:()=>startBattle(found)},{label:"LASCIA STARE",variant:"alt",onClick:closePanel}]});
 }
}
function completeStep(){
 player.x=Math.floor(player.x)+.5;player.y=Math.floor(player.y)+.5;
 state.steps++;
 state.wildCooldown=Math.max(0,state.wildCooldown-1);
 if(state.steps%2===0)save();
 wanderingEncounter();
 updateHud();
}
function move(dt){
 if(player.step){
  const step=player.step;
  step.elapsed+=dt;
  const k=Math.min(1,step.elapsed/.17);
  player.x=step.fromX+(step.toX-step.fromX)*k;
  player.y=step.fromY+(step.toY-step.fromY)*k;
  if(player.companionStep){
   const f=player.companionStep;
   player.companion.x=f.fromX+(f.toX-f.fromX)*k;
   player.companion.y=f.fromY+(f.toY-f.fromY)*k;
   player.companion.walk+=dt*12;
  }
  player.walk+=dt*12;
  if(k>=1){
   player.x=step.toX;player.y=step.toY;player.step=null;player.walk=0;
   player.companionStep=null;player.companion.walk=0;
   completeStep();
  }
  return;
 }
 let dir=null;
 if(input.up)dir="up";else if(input.down)dir="down";
 else if(input.left)dir="left";else if(input.right)dir="right";
 if(!dir)return;
 player.facing=dir;
 const [dx,dy]={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]}[dir];
 const tx=Math.floor(player.x)+.5+dx,ty=Math.floor(player.y)+.5+dy;
 if((tx<.5||tx>MW-.5||ty<.5||ty>MH-.5)&&M.exitDirection(player.zone,Math.floor(player.x),Math.floor(player.y))===dir){changeZone(dir);return;}
 if(!canStand(player.zone,tx,ty))return;
 player.companionStep={fromX:player.companion.x,fromY:player.companion.y,toX:player.x,toY:player.y};
 player.companion.facing=player.facing;
 player.step={fromX:player.x,fromY:player.y,toX:tx,toY:ty,elapsed:0};
}
function nearby(){
 let nearest=null,min=1.55;
 for(const c of TRAINERS.filter(x=>x.zone===player.zone)){
  const d=Math.hypot(c.x+.5-player.x,c.y+.5-player.y);
  if(d<min){nearest={kind:"trainer",data:c};min=d;}
 }
 for(const c of NPC.filter(x=>x.zone===player.zone)){
  const d=Math.hypot(c.x+.5-player.x,c.y+.5-player.y);
  if(d<min){nearest={kind:"person",data:c};min=d;}
 }
 for(const c of SCENERY.filter(x=>x.zone===player.zone)){
  const d=Math.hypot(c.x+.5-player.x,c.y+.5-player.y);
  if(d<min){nearest={kind:"clue",data:c};min=d;}
 }
 return nearest;
}
function inspect(){
 if(state.mode!=="walk")return;
 const n=nearby();
 if(!n){ui.tip.textContent="Qui non c'è nulla da esaminare. Avvicinati a un allenatore, un abitante oppure un cartello.";tone(230,.08);return;}
 tone(735,.09);
 if(n.kind==="person"){
  const npc=n.data;
  let message=npc.text;
  if(npc.name==="Vincenzo"&&count()>0)message="Nino, hai già fotografato "+count()+" Ninomon. Trova anche i tre indizi nascosti nelle zone: sulla ferrovia, sotto il ponte e dietro il mercato.";
  if(npc.name==="Vincenzo"&&Object.keys(state.clues).length===3)message="Hai trovato tutti gli indizi? Ho preparato un premio: tutta la tua squadra ha un punto Fiato in più in combattimento. Ora non fare altre foto sfocate!";
  const offers=Q.offers(state.quests,npc.name,player.zone);
  panel({mode:"talk",tag:"DIALOGO · "+ZONES[player.zone].title,title:npc.name,text:message+(offers.length?"\n\n★ "+offers.length+" missione/i disponibili.":""),icon:npc.role,color:npc.color,actions:[...offers.map(q=>({label:"★ "+q.title,onClick:()=>talkQuest(q,npc)})),{label:"CONTINUA",onClick:closePanel}]});
 }else if(n.kind==="clue"){
  const item=n.data,first=!state.clues[item.name];
  if(first){state.clues[item.name]=true;Q.sync(state.quests,questSnapshot());save();tone(840,.14,.021);}
  const total=Object.keys(state.clues).length;
  panel({mode:"clue",tag:"INDIZIO URBANO · "+total+"/3",title:item.name.toUpperCase(),icon:"!",color:"#899778",
   text:item.text+"\n\n"+(first?"Indizio aggiunto agli appunti di Nino.":"Hai già osservato questo indizio.")+(total===3?"\nHai scoperto tutti e tre gli indizi urbani! Ricompensa: FIATO MASSIMO +1 per tutta la squadra.":""),
   actions:[{label:"RIPRENDI",onClick:closePanel},{label:"VEDI NINODEX",variant:"alt",onClick:openDex}]});
 }else{
  const t=n.data,won=!!state.defeated[t.id],creature=ENCOUNTERS.find(p=>p.id===t.creature);
  const target={...creature,zone:t.zone,trainerId:t.id,trainerName:t.name};
  panel({mode:"encounter",tag:(won?"RIVINCITA":"ALLENATORE")+" · "+M.zones[t.zone].name,title:t.name,icon:won?"✓":"!",color:t.color,
   text:(won?t.after:t.intro)+"\n\nNinomon: "+creature.name+".\n"+(won?"Hai già vinto questa sfida.":"Vinci la sfida per registrarlo nella Ninodex."),
   actions:[{label:won?"RIVINCITA":"ACCETTA LA SFIDA",onClick:()=>startBattle(target)},{label:"CI VEDIAMO",variant:"alt",onClick:closePanel}]});
 }
}

/* Each encounter is now a proper fight before the photo is recorded.
 * Action buttons remain below the LCD inside the Game Boy safety bezel. */
// Battle actions resolve as ordered narrated events; visuals can be skipped by tapping the LCD.
function battleMode(on){
 battleUI.stage.hidden=!on;
 battleUI.controls.hidden=!on;
 battleUI.explore.hidden=on;
 if(!on){
  battleUI.moves.textContent="";
  battleUI.partyOptions.hidden=true;
  battleUI.controls.classList.remove("is-busy");
  state.battleBusy=false;state.battleFx=null;
 }
}
function showEnemyIntent(){
 const intent=state.battle&&state.battle.intent;
 const box=$("enemy-intent");
 if(!box)return;
 box.classList.toggle("danger",!!intent&&(intent.power>=27||(intent.action!=="rest"&&intent.type==="rutto"&&intent.power>=19)));
 if(state.battleBusy){
  box.children[0].children[0].textContent="IL TURNO È IN CORSO";
  box.children[0].children[1].textContent="Guarda i colpi sullo schermo; tocca il display per avanzare.";
  box.children[1].textContent="▶";
  return;
 }
 if(!intent){box.children[0].children[0].textContent="SCONTRO CONCLUSO";box.children[0].children[1].textContent="";box.children[1].textContent="★";return;}
 const move=B.MOVE[intent.action];
 const estimate=move?B.previewAttack(state.battle,move):null;
 box.children[0].children[0].textContent="NEMICO: "+intent.name.toUpperCase();
 box.children[0].children[1].textContent=intent.warning;
 box.children[1].textContent=move?(estimate.min+"–"+estimate.max+" PS"):"+ FIATO";
}
function updateBattleView(lines,preview){
 const fight=state.battle;if(!fight)return;
 const friendly=fight.player;
 battleCtx.imageSmoothingEnabled=false;
 if(!preview)R.battle(battleCtx,fight,player.zone,lines||fight.last||fight.log.slice(-1));
 const active=!!state.battleBusy;
 battleUI.controls.classList.toggle("is-busy",active);
 const battlePreview=active&&state.battleFx;
 const shownHp=battlePreview?(state.battleFx.partyHp[state.battleFx.activeId]??friendly.hp):friendly.hp;
 const shownFiato=battlePreview?(state.battleFx.partyFiato[state.battleFx.activeId]??friendly.fiato):friendly.fiato;
 battleUI.round.textContent="TURNO "+(active?fight.round:fight.round+1)+" · PS "+shownHp+"/"+friendly.maxHp+" · FIATO "+shownFiato+"/"+friendly.maxFiato;
 showEnemyIntent();
 battleUI.moves.textContent="";
 const isKO=friendly.hp<=0;
 for(let i=0;i<friendly.moves.length;i++){
  const move=B.MOVE[friendly.moves[i]],btn=document.createElement("button");
  btn.type="button";btn.className="move-btn";
  const prediction=B.previewAttack(fight,move,"player");
  if(prediction.effectiveness>1)btn.classList.add("good");
  if(prediction.effectiveness<1)btn.classList.add("bad");
  const title=document.createElement("b");
  title.textContent=(i+1)+" · "+move.name;
  const tag=document.createElement("small");
  const priority=move.tier===1?" · VELOCE":move.tier===4?" · LENTA":"";
  const eff=prediction.effectiveness>1?" ↑":prediction.effectiveness<1?" ↓":"";
  tag.textContent=move.type.toUpperCase()+eff+" · POT "+move.power+" · "+move.cost+" F · "+move.accuracy+"%"+priority;
  btn.appendChild(title);btn.appendChild(tag);
  btn.disabled=active||friendly.fiato<move.cost||isKO||!!fight.ended;
  btn.addEventListener("click",()=>battleTurn(move.id));
  battleUI.moves.appendChild(btn);
 }
 battleUI.rest.disabled=active||!!fight.ended||isKO;
 battleUI.guard.disabled=active||!!fight.ended||isKO;
 battleUI.switch.disabled=active||!!fight.ended||!Object.values(fight.party).some(p=>p.id!==fight.player.id&&p.hp>0);
 battleUI.flee.disabled=active||!!fight.ended;
 const hint=$("battle-hint");
 if(hint)hint.textContent=active?"Turno in corso · tocca lo schermo per saltare i messaggi.":isKO?"Ninomon KO! Scegli un compagno per continuare.":"▲ tipo efficace  ·  VELOCE agisce prima  ·  DIFENDI riduce i danni.";
 if(!active&&isKO&&!fight.ended)pickBattleParty(true);
}
function startBattle(p){
 if(state.mode!=="encounter"&&state.mode!=="walk")return;
 state.battleTarget=p;
 state.battle=B.make(state.activeId,p.id,M.zones[p.zone].theme,count(),["starter",...Object.keys(state.found)]);
 const bonus=(Object.keys(state.clues).length===SCENERY.length?1:0)+Q.fiatoBonus(state.quests);
 if(bonus)for(const fighter of Object.values(state.battle.party)){fighter.maxFiato+=bonus;fighter.fiato+=bonus;}
 state.mode="battle";state.primary=null;
 state.battleBusy=false;state.battleFx=null;
 ui.overlay.classList.add("hidden");ui.overlay.style.display="none";battleMode(true);
 updateBattleView([p.trainerName?p.trainerName+" manda in campo "+p.name+"!":"Nino manda in campo "+state.battle.player.name+"! "+p.name+" si prepara a combattere."]);
 for(const k in input)input[k]=false;
 tone(480,.1,.022);
}
function pickBattleParty(force=false){
 if(state.mode!=="battle"||!state.battle||state.battle.ended||state.battleBusy)return;
 const p=battleUI.partyOptions;
 if(!force&&!p.hidden){p.hidden=true;return;}
 p.textContent="";
 for(const unit of Object.values(state.battle.party)){
  const btn=document.createElement("button"),lab=document.createElement("b"),info=document.createElement("small");
  lab.textContent=unit.name;
  const marks=Object.keys(unit.status).filter(k=>unit.status[k]>0).join(" · ");
  info.textContent="PS "+unit.hp+"/"+unit.maxHp+(marks?" · "+marks:"");
  btn.type="button";btn.disabled=unit.id===state.battle.player.id||unit.hp<=0;
  btn.appendChild(lab);btn.appendChild(info);
  btn.addEventListener("click",()=>battleTurn("switch:"+unit.id));
  p.appendChild(btn);
 }
 p.hidden=false;
}
function battleProjection(fx){
 const b=state.battle,id=fx.activeId;
 return {...b,enemy:{...b.enemy,hp:fx.enemyHp},
  player:{...b.party[id],hp:fx.partyHp[id]??b.party[id].hp,fiato:fx.partyFiato[id]??b.party[id].fiato}};
}
function drawBattleEvent(){
 const fx=state.battleFx;
 if(!fx)return;
 let cue=null;
 if(fx.event){
  cue={kind:fx.event.kind,who:fx.event.who,target:fx.event.target,
    timestamp:state.time,startedAt:fx.eventAt,type:fx.event.type,effectiveness:fx.event.effectiveness,damage:fx.event.damage,status:fx.event.status};
 }
 R.battle(battleCtx,battleProjection(fx),player.zone,[fx.message],cue);
}
function finishBattleAnimation(){
 const fx=state.battleFx;
 if(!fx)return;
 state.battleFx=null;state.battleBusy=false;
 updateBattleView(state.battle.last);
 const ended=state.battle.ended;
 if(ended)finishBattleResult();
 else if(state.battle.player.hp<=0)pickBattleParty(true);
}
function advanceBattleAnimation(){
 const fx=state.battleFx;
 if(!fx||state.mode!=="battle")return;
 if(state.time>=fx.nextAt){
  if(fx.index>=fx.events.length){finishBattleAnimation();return;}
  const event=fx.events[fx.index++];
  // Distinct sounds and visual cues reinforce which action just happened.
  if(event.kind==="hit")tone(event.who==="player"?680:235,.065,.008);
  else if(event.kind==="miss")tone(200,.045,.006);
  else if(event.kind==="guard")tone(480,.075,.007);
  else if(event.kind==="victory")tone(880,.14,.013);
  fx.event=event;fx.eventAt=state.time;fx.message=event.text||"";
  if(event.kind==="switch"){
   fx.activeId=event.id;
  }else if(event.kind==="hit"||event.kind==="dot"){
   if(event.target==="enemy")fx.enemyHp=event.after;
   else fx.partyHp[fx.activeId]=event.after;
  }else if(event.kind==="rest"){
   const who=event.who==="player"?fx.activeId:state.battle.enemy.id;
   if(event.who==="player")fx.partyFiato[who]=Math.min(state.battle.party[who].maxFiato,fx.partyFiato[who]+event.amount);
  }
  const duration=event.kind==="hit"?.26:event.kind==="move"?.17:event.kind==="status"?.21:
   event.kind==="miss"?.24:event.kind==="ko"?.30:event.kind==="victory"?.38:.17;
  fx.nextAt=state.time+duration;
 }
 drawBattleEvent();
}
function battleTurn(action){
 if(state.mode!=="battle"||!state.battle||state.battleBusy)return;
 const b=state.battle;
 const hpParty=Object.fromEntries(Object.values(b.party).map(unit=>[unit.id,unit.hp]));
 const fiatoParty=Object.fromEntries(Object.values(b.party).map(unit=>[unit.id,unit.fiato]));
 const enemyHp=b.enemy.hp,activeId=b.player.id;
 battleUI.partyOptions.hidden=true;
 const result=B.takeTurn(b,action);
 if(!result.ok){
  R.battle(battleCtx,b,player.zone,[result.error]);
  const tip=$("battle-hint");if(tip)tip.textContent=result.error;
  tone(180,.07);updateBattleView([result.error]);return;
 }
 state.battleBusy=true;
 state.battleFx={events:result.events||[],index:0,event:null,eventAt:0,
  message:"Si decide il turno...",nextAt:state.time+.03,activeId,hpParty,partyHp:hpParty,
  partyFiato:fiatoParty,enemyHp};
 updateBattleView(null,true);
 drawBattleEvent();
 tone(b.ended?760:action==="rest"||action==="guard"?350:520,.08);
}
function finishBattleResult(){
 const outcome=state.battle.ended,target=state.battleTarget;
 battleMode(false);
 if(outcome==="win"){
  if(target.trainerId){state.defeated[target.trainerId]=true;Q.sync(state.quests,questSnapshot());save();}
  const seen=!!state.found[target.id];
  panel({mode:"battle-result",tag:"VITTORIA · TURNO "+state.battle.round,title:target.trainerName?target.trainerName+" BATTUTO!":"NINOMON SCONFITTO!",icon:"★",color:"#75967e",
    text:(target.trainerName?target.trainerName+": «Bella sfida, Nino.»\n":"")+"Hai battuto "+target.name+"! "+state.battle.log.slice(-3).join(" ")+"\n"+(seen?"Questo Ninomon è già nella tua Ninodex.":"Ora puoi scattare la foto che Nino vuole mandare a Vincenzo."),
    actions:[{label:seen?"TORNA ALLA MAPPA":"◎ FOTOGRAFA IL NINOMON",onClick:seen?closePanel:()=>photo(target)},{label:"UN'ALTRA SFIDA",variant:"alt",onClick:()=>{closePanel();startBattleFromMap(target);}}]});
 }else if(outcome==="lose"){
  panel({mode:"battle-result",tag:"BATTAGLIA FINITA",title:"NINO HA PERSO",icon:"!",color:"#997773",
    text:"Il Ninomon ha resistito. Recupera il Fiato e prova un'altra combinazione di mosse.",
    actions:[{label:"RIPROVA",onClick:()=>{closePanel();startBattleFromMap(target);}},{label:"TORNA IN STRADA",variant:"alt",onClick:closePanel}]});
 }else{
  panel({mode:"battle-result",tag:"RITIRATA",title:"NINO SI ALLONTANA",icon:"↩",color:"#7c8891",
    text:"La sfida è interrotta. Puoi tornare ad allenarti quando vuoi.",actions:[{label:"TORNA IN STRADA",onClick:closePanel}]});
 }
}
function startBattleFromMap(p){
 state.mode="walk";
 startBattle(p);
}
function chooseTeam(){
 const options=[{label:"◎ MASCOTTE",onClick:()=>selectTeam("starter")}];
 for(const creature of ENCOUNTERS)if(state.found[creature.id]){
  options.push({label:"▣ "+creature.name.toUpperCase(),onClick:()=>selectTeam(creature.id)});
 }
 options.push({label:"TORNA ALLA NINODEX",variant:"alt",onClick:openDex});
 panel({mode:"team",tag:"SQUADRA NINOMON · "+count()+" SCOPERTI",title:"SCEGLI CHI COMBATTE",icon:"◎",color:"#658b78",
  text:"Attivo: "+B.CREATURES[state.activeId].name+".\nOgni Ninomon può avere 4 mosse. Le tecniche più potenti si sbloccano registrando altri Ninomon, senza salire di livello.",
  actions:options});
}
function selectTeam(id){
 if(id!=="starter"&&!state.found[id])return;
 state.activeId=id;
 try{localStorage.setItem("ninomon-active-v1",id);}catch(_){}
 tone(730,.11);
 panel({mode:"team-select",tag:"SQUADRA AGGIORNATA",title:B.CREATURES[id].name.toUpperCase(),icon:B.CREATURES[id].symbol,color:B.CREATURES[id].color,
  text:"Mosse equipaggiate:\n"+B.loadout(id,count()).map(key=>{const m=B.MOVE[key];return m.name+" (Grado "+m.tier+")";}).join("\n"),
  actions:[{label:"RIPRENDI L'ESPLORAZIONE",onClick:closePanel},{label:"CAMBIA NINOMON",variant:"alt",onClick:chooseTeam}]});
 updateHud();
}

function photo(p){
 if(!state.found[p.id]){state.found[p.id]=true;Q.sync(state.quests,questSnapshot());save();tone(850,.15,.025);}
 const total=count(),done=total===ENCOUNTERS.length;
 panel({mode:"caught",tag:"NINODEX · NUOVO AVVISTAMENTO",title:p.name,text:"Fotografia simulata registrata!\n"+p.kind+". "+p.description+"\n\nAvvistamenti: "+total+"/"+ENCOUNTERS.length+".",
 icon:"◎",color:p.color,actions:[{label:done?"VEDI IL RIEPILOGO ▶":"CONTINUA ▶",onClick:()=>{if(done)finishChapter();else closePanel();}}]});
}
function shareUrl(){
 const url="https://czekuns.github.io/Effettokarmagra/games/ninomon/";
 const msg="📸 Io ho trovato "+count()+" Ninomon per strada! Riuscirai a riconoscerli tutti? Entra nel mondo dei Ninomon e prova anche tu: "+url;
 return "https://wa.me/?text="+encodeURIComponent(msg);
}
function finishChapter(){
 panel({mode:"complete",tag:"CAPITOLO 0 · COMPLETATO",title:"NINO, MA COS'HAI TROVATO?",icon:"★",color:"#688776",
  text:"Hai fotografato tutti e nove i Ninomon della prima esplorazione.\nVincenzo ha ricevuto le segnalazioni. Ha chiesto soltanto: «Nino, ma sei sicuro?».\n\nLa città continua: esplora i 64 quadranti e sfida le altre crew. La mappa tiene traccia dei luoghi visitati e degli allenatori battuti.",
  actions:[{label:"TORNA IN STRADA",onClick:closePanel},{label:"APRI NINODEX",variant:"alt",onClick:openDex},{label:"SQUADRA",variant:"alt",onClick:chooseTeam},{label:"CONDIVIDI SU WHATSAPP",variant:"whatsapp",href:shareUrl()}]});
}

function talkQuest(q,npc){
 const result=Q.talk(state.quests,q.id,npc.name,npc.zone,questSnapshot());
 if(!result)return;
 save();tone(result.done?950:770,.15,.021);
 const reward=q.reward;
 const message=result.done?"MISSIONE COMPLETATA!\nRicompensa: "+reward.item+" · "+reward.cred+" reputazione"+(reward.fiato?" · Fiato massimo +"+reward.fiato:"")+".":"PROSSIMA TAPPA: "+questGoal(q);
 panel({mode:"quest-talk",tag:(result.done?"MISSIONE COMPLETATA":result.started?"NUOVA MISSIONE":"MISSIONE AGGIORNATA")+" · "+q.kind,
  title:q.title,icon:result.done?"★":"!",color:result.done?"#688776":"#9d8e5f",
  text:result.step.line+"\n\n"+message,
  actions:[{label:"DIARIO MISSIONI",onClick:openQuests},{label:"TORNA IN STRADA",variant:"alt",onClick:closePanel}]});
 updateHud();
}
function questDetail(q){
 const unlocked=Q.unlocked(state.quests,q),progress=state.quests.progress[q.id]??0,done=Q.complete(state.quests,q.id);
 const where=done?"Completata. Puoi continuare a girare la città.":!unlocked?"Completa prima: "+q.requires.map(id=>Q.get(id).title).join(", ")+".":state.quests.progress[q.id]===undefined?"Inizia parlando con il personaggio indicato.":questGoal(q);
 const steps=q.steps.map((step,i)=>(i<progress?"✓ ":i===progress?"→ ":"· ")+step.hint).join("\n");
 const reward=q.reward.item+" · "+q.reward.cred+" reputazione"+(q.reward.fiato?" · +"+q.reward.fiato+" Fiato massimo":"");
 const actions=[];
 if(!done&&unlocked&&state.quests.progress[q.id]!==undefined&&state.quests.tracked!==q.id)actions.push({label:"★ SEGUI QUESTA",onClick:()=>{state.quests.tracked=q.id;save();updateHud();questDetail(q);}});
 actions.push({label:"TORNA AL DIARIO",onClick:openQuests},{label:"MAPPA",variant:"alt",onClick:openMap});
 panel({mode:"quest-detail",tag:q.kind+" · "+Q.stageLabel(state.quests,q),title:q.title,icon:done?"✓":"★",color:"#8a906c",
  text:where+"\n\n"+steps+"\n\nPREMIO: "+reward,actions});
}
function openQuests(){
 if(state.mode==="battle"||state.mode==="intro"||state.mode==="title")return;
 const active=Q.quests.filter(q=>!Q.complete(state.quests,q.id)&&state.quests.progress[q.id]!==undefined);
 const done=Q.quests.filter(q=>Q.complete(state.quests,q.id));
 const available=Q.quests.filter(q=>Q.unlocked(state.quests,q)&&state.quests.progress[q.id]===undefined);
 const locked=Q.quests.filter(q=>!Q.unlocked(state.quests,q));
 const followed=trackedQuest();
 panel({mode:"quests",tag:"DIARIO DI NINO · "+done.length+"/"+Q.quests.length+" COMPLETE",title:"MISSIONI DI STRADA",icon:"★",color:"#80775e",
  text:"REPUTAZIONE: "+Q.cred(state.quests)+" · BONUS FIATO: +"+Q.fiatoBonus(state.quests)+
    "\n\nIN CORSO\n"+(active.length?active.map(q=>(followed===q?"★ ":"• ")+q.title+" — "+questGoal(q)).join("\n"):"Nessuna missione attiva.")+
    "\n\nDA INIZIARE\n"+(available.length?available.map(q=>"• "+q.title+" — "+q.steps[0].hint).join("\n"):"Nessuna.")+
    "\n\nCOMPLETATE\n"+(done.length?done.map(q=>"✓ "+q.title).join("\n"):"Nessuna.")+
    (locked.length?"\n\nDA SBLOCCARE: "+locked.length:""),
  actions:[...Q.quests.filter(q=>Q.unlocked(state.quests,q)||Q.complete(state.quests,q.id)).map(q=>({label:(Q.complete(state.quests,q.id)?"✓ ":"★ ")+q.title,onClick:()=>questDetail(q),variant:"alt"})),
   {label:"RIPRENDI",onClick:closePanel},{label:"NINODEX",variant:"alt",onClick:openDex}]});
}
function openDex(){
 if(state.mode==="title"||state.mode==="intro")return;
 const rows=ENCOUNTERS.map(c=>state.found[c.id]?"#"+c.number+" · "+c.name+" — "+ZONES[c.zone].short:"#"+c.number+" · ??? — da scoprire");
 const notes=SCENERY.map(x=>(state.clues[x.name]?"✓ ":"? ")+x.name);
 panel({mode:"dex",tag:"LA NINODEX · "+count()+"/"+ENCOUNTERS.length,title:"ARCHIVIO DEGLI AVVISTAMENTI",icon:"▣",color:"#536d79",
 text:rows.join("\n")+"\n\nINDIZI URBANI "+Object.keys(state.clues).length+"/3:\n"+notes.join("\n")+"\n\nPREMIO INDIZI: "+(Object.keys(state.clues).length===3?"+1 Fiato a tutta la squadra":"Completa i 3 indizi")+".\nPuoi cambiare Ninomon attivo prima di una sfida.",
 actions:[{label:"RIPRENDI",onClick:closePanel},{label:"★ MISSIONI",variant:"alt",onClick:openQuests},{label:"MAPPA CITTÀ",variant:"alt",onClick:openMap},{label:"CAMBIA NINOMON",variant:"alt",onClick:chooseTeam},{label:"RIVEDI PROF. VINCENZO",variant:"alt",onClick:replayIntro},{label:"CONDIVIDI SU WHATSAPP",variant:"whatsapp",href:shareUrl()},{label:"NUOVA PARTITA",variant:"alt",onClick:confirmReset}]});
}
function quadrantCode(z){return String.fromCharCode(65+z%8)+(Math.floor(z/8)+1);}
function openMap(){
 if(state.mode==="battle"||state.mode==="intro"||state.mode==="title")return;
 panel({mode:"map",tag:"CITTÀ · "+Object.keys(state.visited).length+"/64 QUADRANTI",title:"MAPPA DEI QUARTIERI",icon:"▦",
  text:"Sei in "+quadrantCode(player.zone)+" · "+M.zones[player.zone].name+".\nAllenatori battuti: "+trainerCount()+"/"+TRAINERS.length+". Tocca un quadrante."+(trackedQuest()?"\n★ Missione: "+questGoal(trackedQuest()):""),
  actions:[{label:"RIPRENDI",onClick:closePanel},{label:"NINODEX",variant:"alt",onClick:openDex}]});
 const grid=document.createElement("div");grid.className="city-map";grid.setAttribute("role","group");grid.setAttribute("aria-label","64 quadranti: nord in alto");
 const details=document.createElement("p");details.className="map-details";details.setAttribute("aria-live","polite");
 for(let z=0;z<ZONES.length;z++){
  const btn=document.createElement("button");btn.type="button";btn.textContent=quadrantCode(z);
  const goal=trackedQuest()&&Q.current(state.quests,trackedQuest());
   btn.className="map-cell theme-"+M.zones[z].theme+(state.visited[z]?" visited":"")+(z===player.zone?" current":"")+(goal&&goal.zone===z?" quest-target":"");
  btn.setAttribute("aria-label",quadrantCode(z)+" "+M.zones[z].name+(z===player.zone?", posizione attuale":state.visited[z]?", visitato":", da visitare"));
  if(z===player.zone)btn.setAttribute("aria-current","location");
  btn.addEventListener("click",()=>{
   const ts=TRAINERS.filter(t=>t.zone===z),won=ts.filter(t=>state.defeated[t.id]).length;
   const links=[["N","up"],["E","right"],["S","down"],["O","left"]].map(([name,dir])=>{const n=M.neighbor(z,dir);return n===null?null:name+": "+quadrantCode(n);}).filter(Boolean);
   details.textContent=quadrantCode(z)+" · "+M.zones[z].name+"\n"+(state.visited[z]?"Visitato":"Da visitare")+" · Sfide "+won+"/"+ts.length+"\n"+links.join(" · ");
   grid.querySelectorAll(".selected").forEach(b=>b.classList.remove("selected"));btn.classList.add("selected");
  });grid.appendChild(btn);
 }
 ui.text.after(grid);grid.after(details);
 details.textContent="NORD ↑ · Ogni quadrante è collegato ai vicini.\nBordo chiaro: visitato · Rosso: sei qui.";
}
function replayIntro(){
 state.intro=0;
 introPanel();
}
function confirmReset(){
 panel({mode:"confirm",tag:"RIPARTIRE DA ZERO?",title:"NUOVA ESPLORAZIONE",icon:"!",color:"#755f55",
 text:"Vuoi cancellare gli avvistamenti salvati e ricominciare dall'introduzione di Vincenzo?",
 actions:[{label:"ANNULLA",variant:"alt",onClick:openDex},{label:"SÌ, RICOMINCIA",onClick:()=>{
   state.found={};state.clues={};state.defeated={};state.visited={0:true};state.quests=Q.blank();state.steps=0;state.introSeen=false;state.activeId="starter";state.wildCooldown=15;
  player.zone=0;player.x=16.5;player.y=18.5;player.step=null;player.companion.x=16.5;player.companion.y=19.5;player.companionStep=null;
  for(const n of NPC){n.x=n.home.x;n.y=n.home.y;n.patrolIndex=0;n.patrolClock=0;n.visualX=n.x;n.visualY=n.y;n.facing="down";n.motion=0;}
  try{localStorage.setItem("ninomon-active-v1","starter");}catch(_){}
  save();state.intro=0;titlePanel();updateHud();
 }}]});
}
/* 320x317 handheld framebuffer; only visible tiles and depth-sorted objects. */
function render(){
 // During battle the combat canvas renders independently; never redraw 120 street tiles per frame behind it.
 if(state.mode==="battle")return;
 if(state.mode==="title"){
  if(R.introStory)R.introStory(g,"title",state.time,0);
  else R.introLake(g,state.time,0);
  return;
 }
 if(state.mode==="intro"){
  const stage=state.intro<=2?"professor":state.intro===3||state.intro===5?"starter":state.intro===4?"trainer":"departure";
  if(R.introStory)R.introStory(g,stage,state.time,state.intro);
  else R.introLake(g,state.time,state.intro);
  return;
 }
 const cx=Math.floor(clamp(player.x*S-W/2,0,MW*S-W));
 const cy=Math.floor(clamp(player.y*S-H/2,0,MH*S-H));
 state.camera.x=cx;state.camera.y=cy;
 const z=player.zone,p=R.P[z];
 g.imageSmoothingEnabled=false;
 g.fillStyle=p[1];g.fillRect(0,0,W,H);
 const left=Math.max(0,Math.floor(cx/S));
 const top=Math.max(0,Math.floor(cy/S));
 const right=Math.min(MW-1,Math.ceil((cx+W)/S));
 const bottom=Math.min(MH-1,Math.ceil((cy+H)/S));
 for(let y=top;y<=bottom;y++)for(let x=left;x<=right;x++){
  const tx=x*S-cx,ty=y*S-cy;
  try{
   R.ground(g,z,x,y,tx,ty,walkBlocked(z,x+.5,y+.5));
  }catch(err){
   // Keep the street visible and input responsive if a phone rejects a tile.
   if(!state.rendererWarning){state.rendererWarning=true;console.error("Ninomon overworld tile",err);}
   g.fillStyle=p[2];g.fillRect(tx,ty,S,S);
   g.fillStyle=p[1];g.fillRect(tx,ty+S-3,S,2);
   g.fillRect(tx+4,ty+5,9,2);
  }
 }
 const actors=M.zones[z].structures.map(sc=>({kind:"structure",x:sc.x,y:sc.y+sc.h,data:sc}));
 for(const trainer of TRAINERS){
  if(trainer.zone===z)actors.push({y:trainer.y+.5,x:trainer.x+.5,kind:"trainer",data:trainer});
 }
 for(const npc of NPC){
  if(npc.zone===z)actors.push({y:npc.visualY+.5,x:npc.visualX+.5,kind:"person",data:npc});
 }
 for(const thing of SCENERY){
  if(thing.zone===z)actors.push({y:thing.y+.5,x:thing.x+.5,kind:"clue",data:thing});
 }
 actors.push({x:player.companion.x,y:player.companion.y,kind:"companion"});
 actors.push({x:player.x,y:player.y,kind:"player"});
 actors.sort((a,b)=>a.y-b.y);
 for(const a of actors){
  if(a.kind==="structure"){
   const sc=a.data,sx=Math.round(sc.x*S-cx),sy=Math.round(sc.y*S-cy);
   // Cull by the full bounding box, not only the left anchor; large wagons
   // must not disappear halfway through the camera crossing.
   if(sx+sc.w*S>0&&sx<W&&sy+sc.h*S>0&&sy-96<H)R.streetStructure(g,sc,z,cx,cy);
   continue;
  }
  const xx=Math.round(a.x*S-cx),yy=Math.round(a.y*S-cy);
  if(xx<-52||xx>W+52||yy<-52||yy>H+52)continue;
  if(a.kind==="player")R.person(g,xx,yy,"player",player.facing,player.walk);
  else if(a.kind==="companion"){
   if(state.activeId==="starter")R.person(g,xx,yy,"gialluca",player.companion.facing,player.companion.walk);
   else R.monster(g,state.activeId,xx-16,yy-30,1,false);
  }
  else if(a.kind==="person"){
   if(a.data.look==="guide")R.person(g,xx,yy,"guide",a.data.facing,a.data.motion>0.05?state.time*10:0);
   else R.human(g,xx,yy,a.data.look,a.data.facing,a.data.motion>0.05?state.time*10:0);
   if(Q.offers(state.quests,a.data.name,a.data.zone).length)R.marker(g,xx,yy,"Q");
   else if(nearby()?.data===a.data)R.marker(g,xx,yy,"…");
  }else if(a.kind==="clue"){
   g.fillStyle=p[0];g.fillRect(xx-14,yy-18,28,18);
   g.fillStyle=p[3];g.fillRect(xx-10,yy-14,20,10);
   g.fillStyle=p[0];g.fillRect(xx-2,yy-24,4,18);
   R.text(g,state.clues[a.data.name]?"OK":"!",xx-8,yy-43,p[0],12);
  }else{
   const t=a.data,dx=player.x-t.x-.5,dy=player.y-t.y-.5;
   const facing=Math.abs(dx)>Math.abs(dy)?(dx>0?"right":"left"):(dy>0?"down":"up");
   R.human(g,xx,yy,t.look,facing,0,t.color);
   const objective=trackedQuest()&&Q.current(state.quests,trackedQuest());
   R.marker(g,xx,yy,objective?.type==="win"&&objective.key===t.id?"Q":state.defeated[t.id]?"✓":"!",!!state.defeated[t.id]);
  }
 }
 // SNES-sized in-screen HUD, scaled with the new framebuffer.
 g.fillStyle=p[0];g.fillRect(0,0,W,24);
 g.fillStyle=p[5];g.fillRect(2,2,W-4,19);
 R.text(g,quadrantCode(z)+" "+ZONES[z].title.slice(0,24),7,6,p[0],11);
 R.text(g,count()+"/"+ENCOUNTERS.length,W-53,6,p[0],13);
 if(state.mode==="walk"&&state.time<(state.zoneBannerUntil||0)){
  g.fillStyle=p[0];g.fillRect(22,30,276,32);g.fillStyle=p[5];g.fillRect(24,32,272,28);
  R.text(g,M.zones[z].region+" · "+quadrantCode(z),31,40,p[0],12);
 }
 if(state.mode==="walk"&&nearby()){
   g.fillStyle=p[0];g.fillRect(85,255,150,27);
   g.fillStyle=p[5];g.fillRect(89,258,142,20);
   R.text(g,"A : ESAMINA",96,261,p[0],14);
 }

}
function bind(){
 window.addEventListener("keydown",e=>{
  if(state.mode==="battle"){
   if(state.battleBusy){
    if(e.key==="Enter"||e.key===" "||e.key==="Escape"){e.preventDefault();if(!e.repeat)finishBattleAnimation();}
    return;
   }
   if(e.key==="g"||e.key==="G"){e.preventDefault();if(!e.repeat)battleTurn("guard");return;}
   if(["1","2","3","4"].includes(e.key)){e.preventDefault();if(!e.repeat){const id=state.battle.player.moves[Number(e.key)-1];if(id)battleTurn(id);}return;}
   if(e.key==="f"||e.key==="F"){e.preventDefault();if(!e.repeat)battleTurn("rest");return;}
   if(e.key==="c"||e.key==="C"){e.preventDefault();if(!e.repeat)pickBattleParty();return;}
   if(e.key==="Escape"){e.preventDefault();if(!e.repeat)battleTurn("flee");return;}
   return;
  }
  const directions={ArrowUp:"up",ArrowDown:"down",ArrowLeft:"left",ArrowRight:"right",w:"up",W:"up",s:"down",S:"down",a:"left",A:"left",d:"right",D:"right"};
  if(directions[e.key]){e.preventDefault();if(state.mode==="walk")input[directions[e.key]]=true;return;}
  if(e.key==="e"||e.key==="E"||e.key==="Enter"||e.key===" "){
   e.preventDefault();if(e.repeat)return;
   if(state.mode==="walk")inspect();else if(state.primary)state.primary();
  }else if(e.key==="q"||e.key==="Q"){e.preventDefault();if(state.mode!=="intro"&&state.mode!=="title")openQuests();}
   else if(e.key==="m"||e.key==="M"){e.preventDefault();if(state.mode!=="intro"&&state.mode!=="title")openMap();}
  else if(e.key==="i"||e.key==="I"||e.key==="Tab"){e.preventDefault();openDex();}
  else if(e.key==="Escape"&&state.mode!=="intro"&&state.mode!=="title"){e.preventDefault();closePanel();}
 });
 window.addEventListener("keyup",e=>{
  const key={ArrowUp:"up",ArrowDown:"down",ArrowLeft:"left",ArrowRight:"right",w:"up",W:"up",s:"down",S:"down",a:"left",A:"left",d:"right",D:"right"}[e.key];
  if(key){e.preventDefault();input[key]=false;}
 });
 for(const b of document.querySelectorAll("[data-move]")){
  const key=b.dataset.move;
  b.addEventListener("pointerdown",e=>{e.preventDefault();if(state.mode!=="walk")return;input[key]=true;b.classList.add("active");try{b.setPointerCapture(e.pointerId);}catch(_){}});
  for(const type of ["pointerup","pointercancel","lostpointercapture"])b.addEventListener(type,()=>{input[key]=false;b.classList.remove("active");});
 }
 ui.inspect.addEventListener("click",()=>{if(state.mode==="walk")inspect();else if(state.mode!=="battle"&&state.primary)state.primary();});
 ui.dex.addEventListener("click",openDex);
  $("quests").addEventListener("click",openQuests);
 $("map").addEventListener("click",()=>{if(state.mode!=="intro"&&state.mode!=="title"&&state.mode!=="battle")openMap();});
 battleUI.rest.addEventListener("click",()=>battleTurn("rest"));battleUI.guard.addEventListener("click",()=>battleTurn("guard"));battleUI.stage.addEventListener("click",()=>{if(state.battleBusy)finishBattleAnimation();});battleUI.switch.addEventListener("click",pickBattleParty);battleUI.flee.addEventListener("click",()=>battleTurn("flee"));
 ui.sound.addEventListener("click",()=>{state.mute=!state.mute;ui.sound.textContent=state.mute?"♫ OFF":"♫ ON";tone(645,.1);});
 window.addEventListener("blur",()=>{for(const k in input)input[k]=false;});
 document.addEventListener("visibilitychange",()=>{if(document.hidden)for(const k in input)input[k]=false;});
}
let renderFaultReported=false;
function reportRenderFault(error){
 if(!renderFaultReported){renderFaultReported=true;console.error("Ninomon display recovery",error);}
}
// Minimal street fallback uses only solid canvas drawing operations, so an
// unavailable image cannot leave the LCD blank after the intro on Android.
function drawEmergencyWorld(){
 const z=player.zone,p=R.P[z]||R.P[0];
 const cx=Math.floor(clamp(player.x*S-W/2,0,MW*S-W));
 const cy=Math.floor(clamp(player.y*S-H/2,0,MH*S-H));
 g.imageSmoothingEnabled=false;
 g.fillStyle=p[2];g.fillRect(0,0,W,H);
 const x0=Math.max(0,Math.floor(cx/S)),x1=Math.min(MW-1,Math.ceil((cx+W)/S));
 const y0=Math.max(0,Math.floor(cy/S)),y1=Math.min(MH-1,Math.ceil((cy+H)/S));
 for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){
  const sx=x*S-cx,sy=y*S-cy,wall=walkBlocked(z,x+.5,y+.5);
  g.fillStyle=wall?p[1]:((x*11+y*7)%5===0?p[3]:p[2]);g.fillRect(sx,sy,S,S);
  g.fillStyle=p[1];g.fillRect(sx+2,sy+2,2,2);
  if(wall){g.fillStyle=p[0];g.fillRect(sx+3,sy+3,S-6,3);}
 }
 const px=Math.round(player.x*S-cx),py=Math.round(player.y*S-cy);
 const fx=Math.round(player.companion.x*S-cx),fy=Math.round(player.companion.y*S-cy);
 g.fillStyle="#6c4836";g.fillRect(fx-10,fy-17,20,16);
 g.fillStyle="#e8b886";g.fillRect(px-7,py-28,14,14);
 g.fillStyle="#a36a48";g.fillRect(px-10,py-13,20,14);
 g.fillStyle=p[0];g.fillRect(0,0,W,24);
 g.fillStyle=p[5];g.fillRect(2,2,W-4,19);
 g.font="bold 13px monospace";g.textAlign="left";g.textBaseline="top";
 g.fillStyle=p[0];g.fillText(ZONES[z].title,8,6);
}
function frame(now){
 const dt=state.last?clamp((now-state.last)/1000,0,.042):0;state.last=now;
 try{
  state.time+=dt;
  if(state.mode==="walk"){patrolNPCs(dt);move(dt);}
  if(state.mode==="battle"&&state.battleFx)advanceBattleAnimation();
  render();
 }catch(err){
  reportRenderFault(err);
  try{if(state.mode==="walk")drawEmergencyWorld();}
  catch(_){g.fillStyle="#536c69";g.fillRect(0,0,W,H);}
 }finally{
  requestAnimationFrame(frame);
 }
}
bind();
if(state.introSeen){state.mode="walk";ui.overlay.classList.add("hidden");}
else titlePanel();
updateHud();requestAnimationFrame(frame);
})();