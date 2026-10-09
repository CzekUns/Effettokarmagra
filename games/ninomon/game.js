(function(){
"use strict";
const C=document.getElementById("world"),g=C.getContext("2d"),W=320,H=288,S=32,MW=35,MH=24;
const R=window.NINOMON_RETRO;
if(!R||R.W!==W||R.H!==H)throw new Error("Caricare retro.js prima del gioco");
g.imageSmoothingEnabled=false;
const $=id=>document.getElementById(id);
const ui={place:$("place"),count:$("count"),tip:$("tip"),overlay:$("overlay"),tag:$("panel-tag"),title:$("panel-title"),text:$("panel-text"),actions:$("panel-actions"),portrait:$("portrait"),inspect:$("inspect"),dex:$("dex"),sound:$("sound")};
const B=window.NINOMON_BATTLE;
if(!B)throw new Error("battle.js deve essere caricato prima di game.js");
const battleCanvas=$("combat-art"),battleCtx=battleCanvas.getContext("2d");
battleCtx.imageSmoothingEnabled=false;
const battleUI={stage:$("battle-stage"),controls:$("battle-controls"),explore:$("explore-controls"),moves:$("battle-moves"),round:$("battle-round"),rest:$("rest"),switch:$("switch"),partyOptions:$("party-options"),flee:$("flee")};
const ZONES=[
 {title:"SCALO FERROVIARIO",short:"Binari fuori servizio",ground:"#6c6764",road:"#54585b",accent:"#ae9571",sky:"#83847d",entry:[16,18]},
 {title:"SOTTOPASSO",short:"Sotto la tangenziale",ground:"#49535b",road:"#424d56",accent:"#89adad",sky:"#62697b",entry:[2,16]},
 {title:"STRADA DI SERVIZIO",short:"Dietro il mercato",ground:"#74706b",road:"#576069",accent:"#bd907b",sky:"#909c99",entry:[2,16]}
];
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
const NPC=[
 {zone:0,x:14,y:16,name:"Vincenzo",color:"#a6d8ce",role:"V",text:"Nino, vieni qui. Sono il professor Vincenzo: ecco il tuo primo Ninomon, Gialluca. Usalo bene e fotografa gli altri che incontri."},
 {zone:0,x:24,y:18,name:"Capostazione",color:"#d6b890",role:"!",text:"Un treno oggi? Forse. Chiedi a quello del turno prima, se lo trovi."},
 {zone:1,x:11,y:15,name:"Passante col cappuccio",color:"#9e8dad",role:"…",text:"Qui sotto hanno trovato di tutto. Io preferisco non sapere cos'hai appena fotografato."},
 {zone:2,x:13,y:17,name:"Venditore",color:"#dab186",role:"!",text:"Nino, oggi cerchi un parcheggio o un'altra creatura? Non rispondere, ho già capito."},
 {zone:2,x:27,y:18,name:"Custode del deposito",color:"#bda784",role:"!",text:"Qui ogni settimana sparisce qualche cosa. Qualcuno pensa siano i Ninomon."}
];
const intro=[
 {tag:"PROFESSOR VINCENZO · 1/7",name:"VINCENZO",speaker:"V",text:"Benvenuto, Nino! Sono il professor Vincenzo. Ti aspettavo qui al lago."},
 {tag:"PROFESSOR VINCENZO · 2/7",name:"VINCENZO",speaker:"V",text:"Questo è il mondo dei NINOMON. Sono strane creature delle nostre strade."},
 {tag:"PROFESSOR VINCENZO · 3/7",name:"VINCENZO",speaker:"V",text:"Li puoi trovare tra binari, sottopassi, graffiti e cassonetti. Apri bene gli occhi."},
 {tag:"PROFESSOR VINCENZO · 4/7",name:"VINCENZO",speaker:"V",text:"Ecco il tuo primo Ninomon: GIALLUCA. È un tipo vivace e conosce il Ruttino."},
 {tag:"PROFESSOR VINCENZO · 5/7",name:"VINCENZO",speaker:"V",text:"Tu sei Nino, il writer. Segnala sul gruppo ogni nuovo avvistamento."},
 {tag:"PROFESSOR VINCENZO · 6/7",name:"VINCENZO",speaker:"V",text:"Porta Gialluca con te. Vinci gli incontri, fotografa i Ninomon e completa la Ninodex."},
 {tag:"PROFESSOR VINCENZO · 7/7",name:"VINCENZO",speaker:"V",text:"Vai allo scalo ferroviario. Trova i nove Ninomon e torna a dirmi come è andata!"}
];
const SCENERY=[
 {zone:0,x:18,y:13,name:"Orario sospeso",text:"Sul tabellone c'è scritto che il treno è in ritardo di 37 anni. Nino fotografa anche questo."},
 {zone:1,x:8,y:14,name:"Graffito misterioso",text:"Sul pilone qualcuno ha scritto: «I NINOMON ESISTONO». Vincenzo nega di essere stato lui."},
 {zone:2,x:19,y:15,name:"Scatola delle prove",text:"Tre sacchetti, un tappo e una foto sfocata. Qualcuno ha già cercato dei Ninomon qui."}
];
for(const npc of NPC){
 npc.home={x:npc.x,y:npc.y};npc.patrol=npc.name==="Capostazione"?[[24,18],[25,18],[25,17],[24,17]]:
 npc.name==="Passante col cappuccio"?[[11,15],[12,15],[13,15],[12,15]]:
 npc.name==="Custode del deposito"?[[27,18],[27,17],[28,17],[28,18]]:null;
 npc.patrolIndex=0;npc.patrolClock=0;npc.visualX=npc.x;npc.visualY=npc.y;npc.facing="down";npc.motion=0;
}
const input={up:false,down:false,left:false,right:false};
const player={zone:0,x:16.5,y:18.5,facing:"down",walk:0,step:null,companion:{x:16.5,y:19.5,facing:"down",walk:0},companionStep:null};
const state={mode:"intro",intro:0,found:{},camera:{x:0,y:0},last:0,time:0,mute:false,ac:null,primary:null,discovered:0,firstComplete:false,lastInteract:0,battle:null,battleTarget:null,activeId:"starter",steps:0,wildCooldown:15,randomBattles:0,clues:{},introSeen:false,autosave:0};
try{const saved=JSON.parse(localStorage.getItem("ninomon-captured-v1")||"[]");if(Array.isArray(saved))for(const id of saved){if(ENCOUNTERS.some(e=>e.id===id))state.found[id]=true;}}catch(_){}
try{const id=localStorage.getItem("ninomon-active-v1");if(B.CREATURES[id]&&(id==="starter"||state.found[id]))state.activeId=id;}catch(_){}
try{
 const checkpoint=JSON.parse(localStorage.getItem("ninomon-save-v2")||"null");
 if(checkpoint&&Number.isInteger(checkpoint.zone)&&checkpoint.zone>=0&&checkpoint.zone<3&&Number.isFinite(checkpoint.x)&&Number.isFinite(checkpoint.y)){
  if(checkpoint.x>=.5&&checkpoint.x<=MW-.5&&checkpoint.y>=2.5&&checkpoint.y<=MH-2.5){
   player.zone=checkpoint.zone;player.x=Math.floor(checkpoint.x)+.5;player.y=Math.floor(checkpoint.y)+.5;
  }
  state.steps=Math.max(0,Number(checkpoint.steps)||0);
  state.introSeen=checkpoint.introSeen===true;
  if(checkpoint.clues&&typeof checkpoint.clues==="object")for(const name of Object.keys(checkpoint.clues))if(SCENERY.some(item=>item.name===name))state.clues[name]=true;
 }
}catch(_){} 
player.companion.x=player.x;
player.companion.y=Math.min(MH-2.5,player.y+1);
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
const count=()=>ENCOUNTERS.filter(a=>state.found[a.id]).length;
function save(){
 try{
  localStorage.setItem("ninomon-captured-v1",JSON.stringify(Object.keys(state.found)));
  localStorage.setItem("ninomon-discoveries",String(count()));
  localStorage.setItem("ninomon-save-v2",JSON.stringify({zone:player.zone,x:player.x,y:player.y,steps:state.steps,introSeen:state.introSeen,clues:state.clues}));
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
  ui.tip.textContent=obj?(obj.kind==="creature"?(state.found[obj.data.id]?"Avvistato: puoi sfidarlo di nuovo.":"Ninomon sospetto: SFIDALO per poterlo fotografare!"):obj.kind==="clue"?"Qualcosa da esaminare: "+obj.data.name:"Vuoi parlare con "+obj.data.name+"?")+" Premi ESAMINA.":"SQUADRA: "+B.CREATURES[state.activeId].name+". Segui i ? e sfida i Ninomon; poi fotografali.";
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
 state.mode=options.mode||"dialog";
 state.primary=null;
 ui.tag.textContent=options.tag||"NINOMON";
 ui.title.textContent=options.title||"";
 ui.text.textContent=options.text||"";
 ui.portrait.textContent=options.icon||"?";
 ui.portrait.style.background=options.color||"#3d5260";
 ui.actions.textContent="";
 for(const action of options.actions)addAction(action.label,action.onClick,action.variant,action.href);
 ui.overlay.classList.remove("hidden");
 ui.overlay.classList.toggle("intro-scene",state.mode==="intro");
 for(const k in input)input[k]=false;
}
function closePanel(){state.mode="walk";state.primary=null;state.introSeen=true;ui.overlay.classList.add("hidden");save();updateHud();}
function introPanel(){
 const t=intro[state.intro];
 panel({mode:"intro",tag:t.tag,title:t.name,text:t.text,icon:t.speaker,color:"#49646b",actions:[{label:state.intro===intro.length-1?"INIZIA L'AVVENTURA ▶":"AVANTI ▶",onClick(){
   state.intro++;
   if(state.intro>=intro.length)closePanel();else introPanel();
 }}]});
}
function walkBlocked(zone,x,y){
 const a=Math.floor(x),b=Math.floor(y);
 if(b<2||b>=MH-2)return true;
 if(a<0||a>=MW)return true;
 if(zone===0){
  if(a>=3&&a<=12&&b>=5&&b<=8)return true; // stationary cargo wagons
  if(a>=24&&a<=32&&b>=3&&b<=8)return true; // storage warehouse
  if(a>=2&&a<=7&&b>=18&&b<=21)return true;
  if(b===11&&((a>=2&&a<=11)||(a>=24&&a<=31)))return true; // yard fence
 }else if(zone===1){
  if(b>=6&&b<=10&&((a>=4&&a<=6)||(a>=17&&a<=19)||(a>=29&&a<=31)))return true;
  if(a>=7&&a<=11&&b>=3&&b<=5)return true;
 }else{
  if(a>=3&&a<=10&&b>=3&&b<=8)return true;
  if(a>=22&&a<=31&&b>=3&&b<=8)return true;
  if(a>=4&&a<=7&&b>=18&&b<=21)return true;
 }
 return false;
}
function canStand(zone,x,y,ignoreNPC=false){
 const r=.22;
 if(walkBlocked(zone,x-r,y-r)||walkBlocked(zone,x+r,y-r)||walkBlocked(zone,x-r,y+r)||walkBlocked(zone,x+r,y+r))return false;
 if(!ignoreNPC&&NPC.some(n=>n.zone===zone&&Math.abs(n.x+.5-x)<.65&&Math.abs(n.y+.5-y)<.65))return false;
 if(ENCOUNTERS.some(n=>n.zone===zone&&Math.abs(n.x+.5-x)<.65&&Math.abs(n.y+.5-y)<.65))return false;
 return true;
}
function changeZone(direction){
 if(direction>0&&player.zone<ZONES.length-1){player.zone++;player.x=1.5;player.y=16.5;tone(620,.12);}
 else if(direction<0&&player.zone>0){player.zone--;player.x=MW-1.5;player.y=16.5;tone(390,.12);}
 player.step=null;
 player.companionStep=null;
 player.companion.x=Math.max(.5,Math.min(MW-.5,player.x+(direction>0?-1:1)));
 player.companion.y=player.y;
 state.wildCooldown=8;
 save();updateHud();
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
  if(!canStand(n.zone,x+.5,y+.5,true))continue;
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
 const likely=["ballast","weeds","crack","puddle","asphalt"].includes(terrain);
 if(likely&&Math.random()<.11){
  state.wildCooldown=23;state.randomBattles++;
  const found=ENCOUNTERS.find(c=>c.zone===area);
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
 if(tx<.5&&dir==="left"&&player.zone>0){changeZone(-1);return;}
 if(tx>MW-.5&&dir==="right"&&player.zone<ZONES.length-1){changeZone(1);return;}
 if(!canStand(player.zone,tx,ty))return;
 player.companionStep={fromX:player.companion.x,fromY:player.companion.y,toX:player.x,toY:player.y};
 player.companion.facing=player.facing;
 player.step={fromX:player.x,fromY:player.y,toX:tx,toY:ty,elapsed:0};
}
function nearby(){
 let nearest=null,min=1.55;
 for(const c of ENCOUNTERS.filter(x=>x.zone===player.zone)){
  const d=Math.hypot(c.x+.5-player.x,c.y+.5-player.y);
  if(d<min){nearest={kind:"creature",data:c};min=d;}
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
 if(!n){ui.tip.textContent="Qui non c'è nulla da esaminare. Avvicinati a un Ninomon, una persona oppure un cartello.";tone(230,.08);return;}
 tone(735,.09);
 if(n.kind==="person"){
  const npc=n.data;
  let message=npc.text;
  if(npc.name==="Vincenzo"&&count()>0)message="Nino, hai già fotografato "+count()+" Ninomon. Trova anche i tre indizi nascosti nelle zone: sulla ferrovia, sotto il ponte e dietro il mercato.";
  if(npc.name==="Vincenzo"&&Object.keys(state.clues).length===3)message="Hai trovato tutti gli indizi? Ho preparato un premio: tutta la tua squadra ha un punto Fiato in più in combattimento. Ora non fare altre foto sfocate!";
  panel({mode:"talk",tag:"DIALOGO · "+ZONES[player.zone].title,title:npc.name,text:message,icon:npc.role,color:npc.color,actions:[{label:"CONTINUA",onClick:closePanel}]});
 }else if(n.kind==="clue"){
  const item=n.data,first=!state.clues[item.name];
  if(first){state.clues[item.name]=true;save();tone(840,.14,.021);}
  const total=Object.keys(state.clues).length;
  panel({mode:"clue",tag:"INDIZIO URBANO · "+total+"/3",title:item.name.toUpperCase(),icon:"!",color:"#899778",
   text:item.text+"\n\n"+(first?"Indizio aggiunto agli appunti di Nino.":"Hai già osservato questo indizio.")+(total===3?"\nHai scoperto tutti e tre gli indizi urbani! Ricompensa: FIATO MASSIMO +1 per tutta la squadra.":""),
   actions:[{label:"RIPRENDI",onClick:closePanel},{label:"VEDI NINODEX",variant:"alt",onClick:openDex}]});
 }else{
  const p=n.data,seen=!!state.found[p.id];
  panel({mode:"encounter",tag:"AVVISTAMENTO · "+p.number,title:seen?p.name:"UN NINOMON?!",icon:"?",color:p.color,text:p.hint+"\n\n"+(seen?"Lo hai già registrato. Vuoi sfidarlo ancora?":"Nino: «Ho trovato un Ninomon!»\nSfidalo in battaglia per riuscire a fotografarlo."),actions:[{label:seen?"⚔ RIVINCITA":"⚔ INIZIA LA SFIDA",onClick:()=>startBattle(p)},{label:"LASCIA STARE",variant:"alt",onClick:closePanel}]});
 }
}

/* Each encounter is now a proper fight before the photo is recorded.
 * Action buttons remain below the LCD inside the Game Boy safety bezel. */
function battleMode(on){
 battleUI.stage.hidden=!on;
 battleUI.controls.hidden=!on;
 battleUI.explore.hidden=on;
 if(!on){battleUI.moves.textContent="";battleUI.partyOptions.hidden=true;}
}
function updateBattleView(lines){
 const fight=state.battle;if(!fight)return;
 const friendly=fight.player;
 battleCtx.imageSmoothingEnabled=false;
 R.battle(battleCtx,fight,player.zone,lines||fight.log.slice(-2));
 battleUI.round.textContent="TURNO "+(fight.round+1)+" · PS "+friendly.hp+"/"+friendly.maxHp+" · FIATO "+friendly.fiato+"/"+friendly.maxFiato;
 battleUI.moves.textContent="";
 for(let i=0;i<friendly.moves.length;i++){
  const move=B.MOVE[friendly.moves[i]],button=document.createElement("button");
  button.type="button";button.className="move-btn";
  const title=document.createElement("b");title.textContent=(i+1)+" ▶ "+move.name;
  const note=document.createElement("small");note.textContent=move.type.toUpperCase()+" · G"+move.tier+" · "+move.power+" PT · "+move.cost+" F";
  button.appendChild(title);button.appendChild(note);
  button.disabled=friendly.fiato<move.cost||fight.player.hp<=0||!!fight.ended;
  button.addEventListener("click",()=>battleTurn(move.id));
  battleUI.moves.appendChild(button);
 }
 battleUI.rest.disabled=!!fight.ended||fight.player.hp<=0;
 battleUI.switch.disabled=!!fight.ended||!Object.values(fight.party).some(p=>p.id!==fight.player.id&&p.hp>0);
 battleUI.flee.disabled=!!fight.ended;
}
function startBattle(p){
 if(state.mode!=="encounter"&&state.mode!=="walk")return;
 state.battleTarget=p;
 state.battle=B.make(state.activeId,p.id,p.zone,count(),["starter",...Object.keys(state.found)]);
 if(Object.keys(state.clues).length===SCENERY.length){
  for(const fighter of Object.values(state.battle.party)){fighter.maxFiato=7;fighter.fiato=7;}
 }
 state.mode="battle";state.primary=null;
 ui.overlay.classList.add("hidden");battleMode(true);
 updateBattleView(["Nino manda in campo "+state.battle.player.name+"! "+p.name+" si prepara a combattere."]);
 for(const k in input)input[k]=false;
 tone(480,.1,.022);
}
function pickBattleParty(){
 if(state.mode!=="battle"||!state.battle||state.battle.ended)return;
 const p=battleUI.partyOptions;
 if(!p.hidden){p.hidden=true;return;}
 p.textContent="";
 for(const unit of Object.values(state.battle.party)){
  const btn=document.createElement("button"),lab=document.createElement("b"),info=document.createElement("small");
  lab.textContent=unit.name;info.textContent="PS "+unit.hp+"/"+unit.maxHp;
  btn.type="button";btn.disabled=unit.id===state.battle.player.id||unit.hp<=0;
  btn.appendChild(lab);btn.appendChild(info);
  btn.addEventListener("click",()=>battleTurn("switch:"+unit.id));
  p.appendChild(btn);
 }
 p.hidden=false;
}
function battleTurn(action){
 if(state.mode!=="battle"||!state.battle)return;
 battleUI.partyOptions.hidden=true;
 const result=B.takeTurn(state.battle,action);
 if(!result.ok){R.battle(battleCtx,state.battle,player.zone,[result.error]);tone(180,.07);return;}
 updateBattleView(result.log);
 tone(state.battle.ended?760:action==="rest"?350:520,.08);
 if(!state.battle.ended)return;
 const outcome=state.battle.ended,target=state.battleTarget;
 battleMode(false);
 if(outcome==="win"){
  const seen=!!state.found[target.id];
  panel({mode:"battle-result",tag:"VITTORIA · TURNO "+state.battle.round,title:"NINOMON SCONFITTO!",icon:"★",color:"#75967e",
    text:"Hai battuto "+target.name+"! "+state.battle.log.slice(-3).join(" ")+"\\n"+(seen?"Questo Ninomon è già nella tua Ninodex.":"Ora puoi scattare la foto che Nino vuole mandare a Vincenzo."),
    actions:[{label:seen?"TORNA ALLA MAPPA":"◎ FOTOGRAFA IL NINOMON",onClick:seen?closePanel:()=>photo(target)},{label:"UN'ALTRA SFIDA",variant:"alt",onClick:()=>{closePanel();startBattleFromMap(target);}}]});
 }else if(outcome==="lose"){
  panel({mode:"battle-result",tag:"BATTAGLIA FINITA",title:"NINO HA PERSO",icon:"!",color:"#997773",
    text:"Il Ninomon ha resistito. Recupera il Fiato e prova un'altra combinazione di mosse.",
    actions:[{label:"RIPROVA",onClick:()=>{closePanel();startBattleFromMap(target);}},{label:"TORNA IN STRADA",variant:"alt",onClick:closePanel}]});
 }else{
  panel({mode:"battle-result",tag:"RITIRATA",title:"NINO SI ALLONTANA",icon:"↩",color:"#7c8891",
    text:"Questo avvistamento non è stato ancora registrato.",actions:[{label:"TORNA IN STRADA",onClick:closePanel}]});
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
  text:"Attivo: "+B.CREATURES[state.activeId].name+".\\nOgni Ninomon può avere 4 mosse. Le tecniche più potenti si sbloccano registrando altri Ninomon, senza salire di livello.",
  actions:options});
}
function selectTeam(id){
 if(id!=="starter"&&!state.found[id])return;
 state.activeId=id;
 try{localStorage.setItem("ninomon-active-v1",id);}catch(_){}
 tone(730,.11);
 panel({mode:"team-select",tag:"SQUADRA AGGIORNATA",title:B.CREATURES[id].name.toUpperCase(),icon:B.CREATURES[id].symbol,color:B.CREATURES[id].color,
  text:"Mosse equipaggiate:\\n"+B.loadout(id,count()).map(key=>{const m=B.MOVE[key];return m.name+" (Grado "+m.tier+")";}).join("\\n"),
  actions:[{label:"RIPRENDI L'ESPLORAZIONE",onClick:closePanel},{label:"CAMBIA NINOMON",variant:"alt",onClick:chooseTeam}]});
 updateHud();
}

function photo(p){
 if(!state.found[p.id]){state.found[p.id]=true;save();tone(850,.15,.025);}
 const total=count(),done=total===ENCOUNTERS.length;
 panel({mode:"caught",tag:"NINODEX · NUOVO AVVISTAMENTO",title:p.name,text:"Fotografia simulata registrata!\n"+p.kind+". "+p.description+"\n\nAvvistamenti: "+total+"/"+ENCOUNTERS.length+".\n(Grafica e nome provvisori fino alle referenze.)",
 icon:"◎",color:p.color,actions:[{label:done?"VEDI IL RIEPILOGO ▶":"CONTINUA ▶",onClick:()=>{if(done)finishChapter();else closePanel();}}]});
}
function shareUrl(){
 const url="https://czekuns.github.io/Effettokarmagra/games/ninomon/";
 const msg="📸 Io ho trovato "+count()+" Ninomon per strada! Riuscirai a riconoscerli tutti? Entra nel mondo dei Ninomon e prova anche tu: "+url;
 return "https://wa.me/?text="+encodeURIComponent(msg);
}
function finishChapter(){
 panel({mode:"complete",tag:"CAPITOLO 0 · COMPLETATO",title:"NINO, MA COS'HAI TROVATO?",icon:"★",color:"#688776",
  text:"Hai fotografato tutti e nove i Ninomon della prima esplorazione.\nVincenzo ha ricevuto le segnalazioni. Ha chiesto soltanto: «Nino, ma sei sicuro?».\n\nIl prossimo capitolo aggiungerà personaggi e Ninomon realizzati sulle referenze originali.",
  actions:[{label:"TORNA IN STRADA",onClick:closePanel},{label:"APRI NINODEX",variant:"alt",onClick:openDex},{label:"SQUADRA",variant:"alt",onClick:chooseTeam},{label:"CONDIVIDI SU WHATSAPP",variant:"whatsapp",href:shareUrl()}]});
}
function openDex(){
 const rows=ENCOUNTERS.map(c=>state.found[c.id]?"#"+c.number+" · "+c.name+" — "+ZONES[c.zone].short:"#"+c.number+" · ??? — da scoprire");
 const notes=SCENERY.map(x=>(state.clues[x.name]?"✓ ":"? ")+x.name);
 panel({mode:"dex",tag:"LA NINODEX · "+count()+"/"+ENCOUNTERS.length,title:"ARCHIVIO DEGLI AVVISTAMENTI",icon:"▣",color:"#536d79",
 text:rows.join("\n")+"\n\nINDIZI URBANI "+Object.keys(state.clues).length+"/3:\n"+notes.join("\n")+"\n\nPREMIO INDIZI: "+(Object.keys(state.clues).length===3?"+1 Fiato a tutta la squadra":"Completa i 3 indizi")+".\nPuoi cambiare Ninomon attivo prima di una sfida.",
 actions:[{label:"RIPRENDI",onClick:closePanel},{label:"CAMBIA NINOMON",variant:"alt",onClick:chooseTeam},{label:"RIVEDI PROF. VINCENZO",variant:"alt",onClick:replayIntro},{label:"CONDIVIDI SU WHATSAPP",variant:"whatsapp",href:shareUrl()},{label:"NUOVA PARTITA",variant:"alt",onClick:confirmReset}]});
}
function replayIntro(){
 state.intro=0;
 state.mode="intro";
 introPanel();
}
function confirmReset(){
 panel({mode:"confirm",tag:"RIPARTIRE DA ZERO?",title:"NUOVA ESPLORAZIONE",icon:"!",color:"#755f55",
 text:"Vuoi cancellare i avvistamenti salvati su questo dispositivo e ricominciare la storia dall'inizio?",
 actions:[{label:"ANNULLA",variant:"alt",onClick:openDex},{label:"SÌ, RICOMINCIA",onClick:()=>{
   state.found={};state.clues={};state.steps=0;state.introSeen=false;state.activeId="starter";state.wildCooldown=15;
  player.zone=0;player.x=16.5;player.y=18.5;player.step=null;player.companion.x=16.5;player.companion.y=19.5;player.companionStep=null;
  for(const n of NPC){n.x=n.home.x;n.y=n.home.y;n.patrolIndex=0;n.patrolClock=0;n.visualX=n.x;n.visualY=n.y;n.facing="down";n.motion=0;}
  try{localStorage.setItem("ninomon-active-v1","starter");}catch(_){}
  save();state.intro=0;introPanel();updateHud();
 }}]});
}
/* True 160×144 handheld framebuffer. Every environmental 16×16 metatile
   is constructed from original 8×8 four-colour pixel patterns in retro.js. */
function render(){
 if(state.mode==="intro"){R.introLake(g,state.time,state.intro);return;}
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
  R.ground(g,z,x,y,x*S-cx,y*S-cy,walkBlocked(z,x+.5,y+.5));
 }
 // Sort actors by feet so characters can stand before or behind other sprites.
 const actors=[];
 for(const encounter of ENCOUNTERS){
  if(encounter.zone===z)actors.push({y:encounter.y+.5,x:encounter.x+.5,kind:"creature",data:encounter});
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
  const xx=Math.round(a.x*S-cx),yy=Math.round(a.y*S-cy);
  if(xx<-52||xx>W+52||yy<-52||yy>H+52)continue;
  if(a.kind==="player")R.person(g,xx,yy,"player",player.facing,player.walk);
  else if(a.kind==="companion"){
   if(state.activeId==="starter")R.person(g,xx,yy,"gialluca",player.companion.facing,player.companion.walk);
   else R.monster(g,state.activeId,xx-16,yy-30,1,false);
  }
  else if(a.kind==="person"){
   R.person(g,xx,yy,a.data.name==="Vincenzo"?"guide":"npc",a.data.facing,a.data.motion>0.05?state.time*10:0);
   R.text(g,a.data.role,xx-3,yy-55,p[0],12);
  }else if(a.kind==="clue"){
   g.fillStyle=p[0];g.fillRect(xx-14,yy-18,28,18);
   g.fillStyle=p[3];g.fillRect(xx-10,yy-14,20,10);
   g.fillStyle=p[0];g.fillRect(xx-2,yy-24,4,18);
   R.text(g,state.clues[a.data.name]?"OK":"!",xx-8,yy-43,p[0],12);
  }else{
   R.monster(g,a.data.id,xx-16,yy-30,1,false);
   if(!state.found[a.data.id])R.symbol(g,xx-16,yy-58,z===1);
  }
 }
 // SNES-sized in-screen HUD, scaled with the new framebuffer.
 g.fillStyle=p[0];g.fillRect(0,0,W,24);
 g.fillStyle=p[5];g.fillRect(2,2,W-4,19);
 R.text(g,ZONES[z].title.toUpperCase(),8,6,p[0],13);
 R.text(g,count()+"/"+ENCOUNTERS.length,W-53,6,p[0],13);
 if(z>0){g.fillStyle=p[0];g.fillRect(0,124,10,39);R.text(g,"◀",0,132,p[5],15);}
 if(z<ZONES.length-1){g.fillStyle=p[0];g.fillRect(W-10,124,10,39);R.text(g,">",W-9,132,p[5],16);}
 if(state.mode==="walk"&&nearby()){
   g.fillStyle=p[0];g.fillRect(85,255,150,27);
   g.fillStyle=p[5];g.fillRect(89,258,142,20);
   R.text(g,"A : ESAMINA",96,261,p[0],14);
 }

}
function bind(){
 window.addEventListener("keydown",e=>{
  if(state.mode==="battle"){
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
  }else if(e.key==="i"||e.key==="I"||e.key==="Tab"){e.preventDefault();openDex();}
  else if(e.key==="Escape"&&state.mode!=="intro"){e.preventDefault();closePanel();}
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
 ui.inspect.addEventListener("click",inspect);ui.dex.addEventListener("click",openDex);
 battleUI.rest.addEventListener("click",()=>battleTurn("rest"));battleUI.switch.addEventListener("click",pickBattleParty);battleUI.flee.addEventListener("click",()=>battleTurn("flee"));
 ui.sound.addEventListener("click",()=>{state.mute=!state.mute;ui.sound.textContent=state.mute?"♫ OFF":"♫ ON";tone(645,.1);});
 window.addEventListener("blur",()=>{for(const k in input)input[k]=false;});
 document.addEventListener("visibilitychange",()=>{if(document.hidden)for(const k in input)input[k]=false;});
}
function frame(now){
 const dt=state.last?clamp((now-state.last)/1000,0,.042):0;state.last=now;
 state.time+=dt;if(state.mode==="walk"){patrolNPCs(dt);move(dt);}
 render();requestAnimationFrame(frame);
}
bind();if(state.introSeen){state.mode="walk";ui.overlay.classList.add("hidden");}else introPanel();updateHud();requestAnimationFrame(frame);
})();