(function(){
"use strict";
const C=document.getElementById("world"),g=C.getContext("2d"),W=640,H=400,S=32,MW=35,MH=24;
g.imageSmoothingEnabled=false;
const $=id=>document.getElementById(id);
const ui={place:$("place"),count:$("count"),tip:$("tip"),overlay:$("overlay"),tag:$("panel-tag"),title:$("panel-title"),text:$("panel-text"),actions:$("panel-actions"),portrait:$("portrait"),inspect:$("inspect"),dex:$("dex"),sound:$("sound")};
const ZONES=[
 {title:"SCALO FERROVIARIO",short:"Binari fuori servizio",ground:"#6c6764",road:"#54585b",accent:"#ae9571",sky:"#83847d",entry:[16,18]},
 {title:"SOTTOPASSO",short:"Sotto la tangenziale",ground:"#49535b",road:"#424d56",accent:"#89adad",sky:"#62697b",entry:[2,16]},
 {title:"STRADA DI SERVIZIO",short:"Dietro il mercato",ground:"#74706b",road:"#576069",accent:"#bd907b",sky:"#909c99",entry:[2,16]}
];
const ENCOUNTERS=[
 {id:"n01",number:"001",zone:0,x:9,y:15,name:"Topo sospetto",kind:"Creatura di scalo",description:"Nino sostiene che sia un esemplare rarissimo. Gianlluca vorrebbe prima controllare se si muove.",hint:"Una piccola sagoma vicino ai binari. Nino si ferma subito.",color:"#9eb5b3",glyph:"?",label:"NOME PROVVISORIO"},
 {id:"n02",number:"002",zone:1,x:22,y:15,name:"Piccione immobile",kind:"Creatura da sottopasso",description:"Da tre giorni occupa lo stesso posto. Secondo Nino sta usando una tecnica segreta.",hint:"C'è qualcosa accanto a una pozzanghera.",color:"#a4a9c5",glyph:"?",label:"NOME PROVVISORIO"},
 {id:"n03",number:"003",zone:2,x:24,y:14,name:"Pesce misterioso",kind:"Creatura da marciapiede",description:"Un mistero acquatico comparso lontano dall'acqua. Nino è già pronto a mandare una foto al gruppo.",hint:"Un oggetto dalla forma improbabile è finito sull'asfalto.",color:"#e1b59c",glyph:"?",label:"NOME PROVVISORIO"}
];
const NPC=[
 {zone:0,x:14,y:16,name:"Gianlluca",color:"#a6d8ce",role:"?",text:"Nino, guarda bene dove metti i piedi. Per il resto, se trovi qualcosa, mandami una foto sul gruppo."},
 {zone:0,x:24,y:18,name:"Capostazione",color:"#d6b890",role:"!",text:"Un treno oggi? Forse. Chiedi a quello del turno prima, se lo trovi."},
 {zone:1,x:11,y:15,name:"Passante col cappuccio",color:"#9e8dad",role:"…",text:"Qui sotto hanno trovato di tutto. Io preferisco non sapere cos'hai appena fotografato."},
 {zone:2,x:13,y:17,name:"Venditore",color:"#dab186",role:"!",text:"Nino, oggi cerchi un parcheggio o un'altra creatura? Non rispondere, ho già capito."}
];
const intro=[
 {tag:"INTRODUZIONE · 01",name:"GIANLLUCA",speaker:"GL",text:"Oh, Nino! Benvenuto nel mondo dei NINOMON.\nIo sono Gianlluca. Sì, con due L.\nQui le creature più rare si incontrano nei posti dove nessuno si ferma a guardare."},
 {tag:"INTRODUZIONE · 02",name:"GIANLLUCA",speaker:"GL",text:"Tra binari deserti, sottopassi e strade di servizio, c'è sempre qualcosa da scoprire.\nAlcune persone le chiamano semplicemente cose trovate per terra. Nino ha una sua teoria."},
 {tag:"INTRODUZIONE · 03",name:"GIANLLUCA",speaker:"GL",text:"Quello lì sei tu: Nino. Il tuo talento è fotografare una cosa sospetta e scrivermi: «Gianlluca, ho trovato un Ninomon!».\nComincia dallo scalo ferroviario. Tre avvistamenti bastano per aprire la prima Ninodex."}
];
const input={up:false,down:false,left:false,right:false};
const player={zone:0,x:16,y:18,facing:"down",walk:0};
const state={mode:"intro",intro:0,found:{},camera:{x:0,y:0},last:0,time:0,mute:false,ac:null,primary:null,discovered:0,firstComplete:false,lastInteract:0};
try{const saved=JSON.parse(localStorage.getItem("ninomon-captured-v1")||"[]");if(Array.isArray(saved))for(const id of saved){if(ENCOUNTERS.some(e=>e.id===id))state.found[id]=true;}}catch(_){}
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
const count=()=>ENCOUNTERS.filter(a=>state.found[a.id]).length;
function save(){try{localStorage.setItem("ninomon-captured-v1",JSON.stringify(Object.keys(state.found)));localStorage.setItem("ninomon-discoveries",String(count()));}catch(_){}}
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
  ui.tip.textContent=obj?(obj.kind==="creature"?(state.found[obj.data.id]?"Già fotografato.":"Avvistamento sospetto!"):"Vuoi parlare con "+obj.data.name+"?")+" Premi ESAMINA.":"Esplora la zona. Vai verso destra per raggiungere la zona successiva. Oggetti con ? = possibili Ninomon.";
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
 for(const k in input)input[k]=false;
}
function closePanel(){state.mode="walk";state.primary=null;ui.overlay.classList.add("hidden");updateHud();}
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
function canStand(zone,x,y){
 const radius=.25;
 return !walkBlocked(zone,x-radius,y-radius)&&!walkBlocked(zone,x+radius,y-radius)&&!walkBlocked(zone,x-radius,y+radius)&&!walkBlocked(zone,x+radius,y+radius);
}
function changeZone(direction){
 if(direction>0&&player.zone<ZONES.length-1){player.zone++;player.x=1.2;player.y=16;state.lastInteract=0;tone(620,.12);}
 else if(direction<0&&player.zone>0){player.zone--;player.x=MW-1.3;player.y=16;state.lastInteract=0;tone(390,.12);}
 player.x=clamp(player.x,1,MW-1.1);updateHud();
}
function move(dt){
 const dx=Number(input.right)-Number(input.left),dy=Number(input.down)-Number(input.up);
 if(!dx&&!dy)return;
 let vx=dx,vy=dy;if(dx&&dy){vx*=.7071;vy*=.7071;}
 const speed=3.1;
 if(Math.abs(dx)>Math.abs(dy))player.facing=dx>0?"right":"left";
 else player.facing=dy>0?"down":"up";
 const nextX=player.x+vx*dt*speed,nextY=player.y+vy*dt*speed;
 if(nextX>MW-.5&&player.zone<ZONES.length-1){changeZone(1);return;}
 if(nextX<.4&&player.zone>0){changeZone(-1);return;}
 if(canStand(player.zone,nextX,player.y))player.x=nextX;
 if(canStand(player.zone,player.x,nextY))player.y=nextY;
 player.walk+=dt*9;updateHud();
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
 return nearest;
}
function inspect(){
 if(state.mode!=="walk")return;
 const n=nearby();
 if(!n){ui.tip.textContent="Qui non c'è nulla da esaminare. Avvicinati a un punto interrogativo o a una persona.";tone(230,.08);return;}
 tone(735,.09);
 if(n.kind==="person"){
  panel({mode:"talk",tag:"DIALOGO · "+ZONES[player.zone].title,title:n.data.name,text:n.data.text,icon:n.data.role,color:n.data.color,actions:[{label:"CONTINUA",onClick:closePanel}]});
 }else{
  const p=n.data,seen=!!state.found[p.id];
  panel({mode:"encounter",tag:"AVVISTAMENTO · "+p.number,title:seen?p.name:"UN NINOMON?!",icon:"?",color:p.color,text:p.hint+"\n\n"+(seen?"Questo avvistamento è già nella Ninodex.":"Nino: «Gianlluca! Ho trovato un Ninomon!»\nScatta una foto per registrarlo nella Ninodex."),actions:seen?[{label:"TORNA A ESPLORARE",onClick:closePanel}]:[{label:"◎ SCATTA FOTO",onClick:()=>photo(p)},{label:"LASCIA STARE",variant:"alt",onClick:closePanel}]});
 }
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
  text:"Hai fotografato tutti e tre i Ninomon della prima esplorazione.\nGianlluca ha ricevuto le segnalazioni. Ha chiesto soltanto: «Nino, ma sei sicuro?».\n\nIl prossimo capitolo aggiungerà personaggi e Ninomon realizzati sulle referenze originali.",
  actions:[{label:"TORNA IN STRADA",onClick:closePanel},{label:"APRl NINODEX",variant:"alt",onClick:openDex},{label:"CONDIVIDI SU WHATSAPP",variant:"whatsapp",href:shareUrl()}]});
}
function openDex(){
 const rows=ENCOUNTERS.map(c=>state.found[c.id]?"#"+c.number+" · "+c.name+" — "+ZONES[c.zone].short:"#"+c.number+" · ??? — da scoprire");
 panel({mode:"dex",tag:"LA NINODEX · "+count()+"/"+ENCOUNTERS.length,title:"ARCHIVIO DEGLI AVVISTAMENTI",icon:"▣",color:"#536d79",
 text:rows.join("\n")+"\n\nLe immagini definitive arriveranno con le referenze di Nino, Gianlluca e dei Ninomon.",
 actions:[{label:"RIPRENDI",onClick:closePanel},{label:"CONDIVIDI SU WHATSAPP",variant:"whatsapp",href:shareUrl()},{label:"NUOVA PARTITA",variant:"alt",onClick:confirmReset}]});
}
function confirmReset(){
 panel({mode:"confirm",tag:"RIPARTIRE DA ZERO?",title:"NUOVA ESPLORAZIONE",icon:"!",color:"#755f55",
 text:"Vuoi cancellare i tre avvistamenti salvati su questo dispositivo e ricominciare la storia dall'inizio?",
 actions:[{label:"ANNULLA",variant:"alt",onClick:openDex},{label:"SÌ, RICOMINCIA",onClick:()=>{
   state.found={};save();player.zone=0;player.x=16;player.y=18;state.intro=0;introPanel();updateHud();
 }}]});
}
function tile(z,x,y){
 if(y<0||y>=MH||x<0||x>=MW)return;
 let color=ZONES[z].road,fx=x*S,fy=y*S,r=hash(x*127+y*19+z*17);
 if(z===0){
  color=y<11?"#827d74":y<14?"#606264":"#52565b";
  if(y===9||y===10)color="#5a6063";
 }else if(z===1){
  color=y<11?"#3c444e":"#47535b";
 }else{
  color=y<10?"#978d81":"#60636a";
 }
 g.fillStyle=color;g.fillRect(fx,fy,S,S);
 if(r>.65){g.fillStyle=z===1?"#576671":"#8b8880";g.fillRect(fx+5,fy+24,3,2);g.fillRect(fx+23,fy+8,2,2);}
 if(r<.18){g.fillStyle="#334750";g.fillRect(fx+19,fy+20,8,2);}
 if(z===0&&(y===9||y===10)){
  g.fillStyle="#343f48";g.fillRect(fx,fy+8,S,3);g.fillRect(fx,fy+25,S,3);
  if(x%2===0){g.fillStyle="#ae9676";g.fillRect(fx+3,fy+6,5,25);g.fillRect(fx+21,fy+6,5,25);}
  g.fillStyle="#a9acaf";g.fillRect(fx,fy+8,S,2);g.fillRect(fx,fy+25,S,2);
 }
 if(z===0&&y===11&&((x>=2&&x<=11)||(x>=24&&x<=31))){
  g.fillStyle="#d2c2a2";g.fillRect(fx,fy+10,32,3);g.fillRect(fx,fy+22,32,3);
  g.fillStyle="#4c484a";g.fillRect(fx+4,fy+2,3,30);
 }
 if(z===1&&y<=10){
  g.fillStyle="#293646";g.fillRect(fx,fy,32,7);
  if(x%5===0){g.fillStyle="#8e8082";g.fillRect(fx+8,fy+4,7,5);}
 }
 if(z===2&&y===9){g.fillStyle="#bcb2a2";g.fillRect(fx,fy,32,4);g.fillStyle="#494f58";g.fillRect(fx,fy+27,32,4);}
 if((z===1||z===2)&&r>.86){g.fillStyle="#598084";g.fillRect(fx+8,fy+26,15,3);g.fillStyle="#729698";g.fillRect(fx+12,fy+27,5,2);}
}
function hash(n){let h=n|0;h=Math.imul(h^h>>>16,2246822507);h=Math.imul(h^h>>>13,3266489909);return ((h^h>>>16)>>>0)/4294967295;}
function rect(x,y,w,h,color){g.fillStyle=color;g.fillRect(x,y,w,h);}
function drawWorldTile(z,x,y){
 const xx=x*S,yy=y*S;
 if(!walkBlocked(z,x+.5,y+.5))return;
 // Rail wagons, warehouses, bridge piers and market stores.
 if(z===0&&x>=3&&x<=12&&y>=5&&y<=8){
  rect(xx+1,yy+1,30,30,"#685a56");rect(xx+4,yy+3,24,24,"#995b50");
  rect(xx+4,yy+7,24,4,"#be7f6c");
  if(x%3===0){rect(xx+7,yy+12,17,4,"#5a4d50");rect(xx+6,yy+26,7,4,"#272f3a");}
 }else if(z===0&&x>=24&&x<=32&&y>=3&&y<=8){
  rect(xx,yy,32,32,"#555f62");rect(xx+3,yy+2,26,24,"#8f8c82");
  if(y%2===0)rect(xx+5,yy+10,19,3,"#bcc2b8");
 }else if(z===1){
  rect(xx,yy,32,32,"#222e3e");rect(xx+4,yy,23,32,"#4e5760");rect(xx+11,yy+2,5,30,"#6f6b71");
 }else{
  rect(xx+1,yy+1,30,30,"#594f51");rect(xx+4,yy+3,24,26,"#ad9380");
  rect(xx+7,yy+6,17,15,"#516574");
  rect(xx+10,yy+7,13,7,"#84a39d");rect(xx+4,yy+25,24,4,"#66565a");
 }
}
function drawDecor(z,x,y){
 const xx=x*S,yy=y*S,seed=hash(x*85+y*157+z*263);
 if(walkBlocked(z,x+.5,y+.5))return;
 if((x+y*3)%17===0&&y>12){
  rect(xx+10,yy+6,3,21,"#887a65");rect(xx+5,yy+8,15,5,"#a3997d");
  rect(xx+7,yy+2,11,7,"#d9bd84");rect(xx+8,yy+3,9,5,"#ffe3aa");
 }
 if(z===1&&y===12&&x%7===2){
  rect(xx+4,yy+4,25,8,"#516477");rect(xx+6,yy+6,21,4,["#bd8880","#7bb7a2","#ad9aba"][x%3]);
 }
 if(z===2&&y===11&&x%5===1){
  rect(xx,yy+12,30,7,"#d0c7b6");rect(xx+4,yy+15,12,2,"#8c8c89");
 }
 if(seed>.91&&y>=13&&y<=20){
  rect(xx+18,yy+19,5,3,"#b0a08c");
 }
 if(z===0&&y===14&&x%8===2){
  rect(xx+2,yy+15,21,14,"#3a5360");
  rect(xx+4,yy+15,17,4,"#71959a");
 }
}
function drawAvatar(px,py,kind,color,facing="down",walk=0){
 const bounce=walk?Math.floor(Math.sin(walk)*2):0;
 const x=Math.round(px),y=Math.round(py)+bounce;
 // Placeholder tokens; replace with reference-based sprites later.
 rect(x-9,y-2,18,5,"#293b44");
 rect(x-8,y-15,16,18,color);
 rect(x-10,y-15,20,4,"#1b3041");
 rect(x-7,y-29,14,13,"#e4b58b");
 rect(x-8,y-31,16,5,kind==="player"?"#b47c48":"#404756");
 if(kind==="player"){rect(x-6,y-26,12,4,"#252e40");rect(x-5,y-24,10,2,"#e9e9da");rect(x-6,y-6,5,6,"#302f39");rect(x+1,y-6,5,6,"#302f39");}
 else{rect(x-4,y-6,5,6,"#3f4149");rect(x+2,y-6,5,6,"#3f4149");}
 if(facing==="up"){rect(x-7,y-28,14,7,kind==="player"?"#b47c48":"#505566");}
 if(facing==="left"||facing==="right")rect(x+(facing==="left"?-11:7),y-13,4,9,"#dfb48d");
}
function drawMarker(x,y,found,color,phase){
 const wobble=Math.sin(phase*3)*2;
 if(found){rect(x-9,y-8,18,9,"#556971");rect(x-5,y-13,10,6,"#95aa9c");}
 else{
  rect(x-12,y-6,24,12,"#293745");rect(x-10,y-9,20,13,color);
  rect(x-7,y-16,14,4,"#d3d1c0");
  g.font="bold 20px monospace";g.textAlign="center";g.fillStyle="#ffe4a8";g.fillText("?",x,y-19+wobble);
 }
}
function render(){
 const cx=clamp(player.x*S-W/2,0,MW*S-W),cy=clamp(player.y*S-H/2,0,MH*S-H);
 state.camera.x=cx;state.camera.y=cy;
 g.clearRect(0,0,W,H);g.save();g.translate(-Math.floor(cx),-Math.floor(cy));
 const startX=Math.max(0,Math.floor(cx/S)),endX=Math.min(MW-1,Math.floor((cx+W)/S));
 const startY=Math.max(0,Math.floor(cy/S)),endY=Math.min(MH-1,Math.floor((cy+H)/S));
 for(let y=startY;y<=endY;y++)for(let x=startX;x<=endX;x++)tile(player.zone,x,y);
 for(let y=startY;y<=endY;y++)for(let x=startX;x<=endX;x++)drawWorldTile(player.zone,x,y);
 for(let y=startY;y<=endY;y++)for(let x=startX;x<=endX;x++)drawDecor(player.zone,x,y);
 for(const m of ENCOUNTERS.filter(e=>e.zone===player.zone)){
   drawMarker(Math.round((m.x+.5)*S),Math.round((m.y+.5)*S),!!state.found[m.id],m.color,state.time);
 }
 for(const n of NPC.filter(e=>e.zone===player.zone)){
  const x=Math.round((n.x+.5)*S),y=Math.round((n.y+.5)*S);
  drawAvatar(x,y,"npc",n.color);
  rect(x-7,y-42,14,11,"#e5ca91");
  g.font="bold 9px monospace";g.fillStyle="#344454";g.textAlign="center";g.fillText(n.role,x,y-34);
 }
 drawAvatar(Math.round(player.x*S),Math.round(player.y*S),"player","#b3a27d",player.facing,player.walk);
 g.restore();
 // Exits are visually indicated on the right and left edge.
 if(player.zone<ZONES.length-1){
  rect(W-23,H/2-24,21,48,"#192f3bc8");g.textAlign="center";g.fillStyle="#f0dc9e";g.font="bold 22px monospace";g.fillText("›",W-12,H/2+7);
 }
 if(player.zone>0){
  rect(2,H/2-24,21,48,"#192f3bc8");g.textAlign="center";g.fillStyle="#f0dc9e";g.font="bold 22px monospace";g.fillText("‹",13,H/2+7);
 }
 const nearbyNow=nearby();
 if(state.mode==="walk"&&nearbyNow){
  rect(W/2-57,H-28,114,22,"#20394bed");g.font="bold 11px monospace";g.textAlign="center";g.fillStyle="#ffe0a5";g.fillText("◎ ESAMINA",W/2,H-12);
 }
}
function bind(){
 window.addEventListener("keydown",e=>{
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
 ui.sound.addEventListener("click",()=>{state.mute=!state.mute;ui.sound.textContent=state.mute?"♫ OFF":"♫ ON";tone(645,.1);});
 window.addEventListener("blur",()=>{for(const k in input)input[k]=false;});
 document.addEventListener("visibilitychange",()=>{if(document.hidden)for(const k in input)input[k]=false;});
}
function frame(now){
 const dt=state.last?clamp((now-state.last)/1000,0,.042):0;state.last=now;
 state.time+=dt;if(state.mode==="walk")move(dt);
 render();requestAnimationFrame(frame);
}
bind();introPanel();updateHud();requestAnimationFrame(frame);
})();