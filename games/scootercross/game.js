(function(){
"use strict";
const W=480,H=270,FINISH=4200,G=650,MAX=208;
const get=id=>document.getElementById(id),cv=get("game"),g=cv.getContext("2d",{alpha:false});
g.imageSmoothingEnabled=false;
const ui={score:get("score"),best:get("best"),time:get("time"),lives:get("lives"),progress:get("progress"),coins:get("coins"),speed:get("speed"),boost:get("boost"),status:get("status"),veil:get("veil"),tag:get("tag"),title:get("title"),message:get("message"),play:get("play"),share:get("share"),shareTop:get("share-top"),wheelie:get("wheelie-hud"),wheelieFill:get("wheelie-fill"),wheelieScore:get("wheelie-score"),wheelieTip:get("wheelie-tip"),sound:get("sound")};
const art=new Image();art.src="./assets/biagio-scooter-illustrated.png";art.onerror=function(){art.onerror=null;art.src="./assets/biagio-side-pixel.svg";};
const control={gas:false,brake:false,up:false,down:false,wheelie:false};
const ramps=[
[0,207],[380,207],[462,204],[560,194],[626,211],[825,211],
[952,206],[1025,183],[1102,209],[1300,209],[1410,204],[1490,185],[1562,210],
[1770,210],[1870,204],[1950,184],[2036,211],[2240,211],[2340,205],[2420,184],[2494,210],
[2700,210],[2830,202],[2905,187],[2978,210],[3150,209],[3280,205],[3365,182],[3445,211],
[3630,211],[3750,204],[3834,191],[3920,208],[FINISH+180,208]];
const obstacles=[455,852,1338,1740,2178,2585,3000,3460,3860];
const colors=["#dfb488","#c7b1a5","#e5c39b","#bfc2b6","#ccad99","#deb98c"];
const signs=["CAFFE","PANIFICIO","BAR","TABACCHI","MARKET","OTTICA","PIZZERIA","EDICOLA"];
const state={mode:"ready",dist:0,time:0,score:0,best:0,coins:0,lives:3,cam:0,mute:false,audio:null,lastBeat:-1,last:0,invincible:0,jumpCount:0,boost:100,boostTime:0,notice:"",noticeTimer:0,particles:[],pickups:[],barrels:[],screenShake:0,wheelieBalance:0,wheelieStreak:0,wheelieFraction:0,wheelieVisibleFor:0,wheelieFallTimer:0,wheelieLocked:false};
const player={x:70,y:195,vy:0,speed:0,angle:0,ground:true,airTime:0};
try{state.best=Math.max(0,Number(localStorage.getItem("biagio-scootercross-best")||0));}catch(_){}
const clamp=(a,lo,hi)=>Math.max(lo,Math.min(hi,a));
function terrain(x){
 if(x<0)return ramps[0][1];
 for(let i=1;i<ramps.length;i++){const a=ramps[i-1],b=ramps[i];if(x<=b[0])return a[1]+(b[1]-a[1])*(x-a[0])/(b[0]-a[0]);}
 return ramps[ramps.length-1][1];
}
function slope(x){return Math.atan2(terrain(x+12)-terrain(x-12),24);}
function rnd(n){let v=(Math.imul(n|0,1664525)+1013904223)|0;v^=v>>>16;v=Math.imul(v,2246822519);return ((v^(v>>>13))>>>0)/4294967296;}
function rect(color,x,y,w,h){g.fillStyle=color;g.fillRect(Math.round(x),Math.round(y),Math.ceil(w),Math.ceil(h));}
function text(t,x,y,size=9,color="#f6ecce",align="center"){g.font="bold "+size+"px monospace";g.textAlign=align;g.fillStyle="#172a38";g.fillText(t,x+1,y+1);g.fillStyle=color;g.fillText(t,x,y);}
function audio(){
 if(state.mute)return null;
 try{if(!state.audio){const Ac=window.AudioContext||window.webkitAudioContext;if(!Ac)return null;state.audio=new Ac();}
 if(state.audio.state==="suspended"&&state.audio.resume)state.audio.resume().catch(()=>{});
 return state.audio;}catch(_){return null;}
}
function note(freq,len=.1,vol=.012,type="square",slide=1){
 const a=audio();if(!a)return;const t=a.currentTime,o=a.createOscillator(),v=a.createGain();
 o.type=type;o.frequency.setValueAtTime(freq,t);
 if(slide!==1)o.frequency.exponentialRampToValueAtTime(Math.max(38,freq*slide),t+len);
 v.gain.setValueAtTime(vol,t);v.gain.exponentialRampToValueAtTime(.0001,t+len);
 o.connect(v).connect(a.destination);o.start(t);o.stop(t+len+.01);
}
function playMusic(){
 let beat=Math.floor(state.time/.20);
 if(beat===state.lastBeat)return;
 state.lastBeat=beat;
 const m=[392,440,523,440,349,392,493,392,330,392,440,523,493,440,392,294];
 if(beat%2===0)note(m[Math.floor(beat/2)%m.length],.09,.008,"square");
 if(beat%4===0)note([110,130,98,147][Math.floor(beat/8)%4],.17,.013,"triangle");
}
function particles(x,y,n,color){
 for(let i=0;i<n;i++)state.particles.push({x,y,vx:(Math.random()-.5)*115,vy:(Math.random()-.7)*80,life:.3+Math.random()*.65,t:0,color});
 if(state.particles.length>100)state.particles.splice(0,state.particles.length-100);
}
function reset(){
 state.mode="ready";state.time=0;state.score=0;state.coins=0;state.lives=3;state.cam=0;
 state.last=0;state.lastBeat=-1;state.invincible=0;state.jumpCount=0;state.boost=100;state.boostTime=0;
 state.notice="";state.noticeTimer=0;state.screenShake=0;state.particles=[];
 state.wheelieBalance=0;state.wheelieStreak=0;state.wheelieFraction=0;state.wheelieVisibleFor=0;state.wheelieFallTimer=0;state.wheelieLocked=false;
 state.barrels=obstacles.map((x,i)=>({x,type:i%4===3?"pothole":"barrel",done:false}));
 state.pickups=Array.from({length:38},(_,i)=>{let x=180+i*101;return{x,y:terrain(x)-(i%4===1?69:48),done:false};});
 Object.assign(player,{x:70,y:terrain(70)-11,vy:0,speed:0,angle:0,ground:true,airTime:0});
 for(const k in control)control[k]=false;
 if(ui.share)ui.share.hidden=true;ui.wheelie.hidden=true;ui.wheelie.classList.remove("danger");hud();
}
function earn(v){
 state.score+=v;if(state.score>state.best){state.best=state.score;
 try{localStorage.setItem("biagio-scootercross-best",String(state.best));}catch(_){}
 }
}
function callout(s,t=1.3){state.notice=s;state.noticeTimer=t;}
function hud(){
 ui.score.textContent=String(Math.round(state.score)).padStart(5,"0");
 ui.best.textContent=String(Math.round(state.best)).padStart(5,"0");
 ui.time.textContent=String(Math.floor(state.time/60)).padStart(2,"0")+":"+String(Math.floor(state.time%60)).padStart(2,"0");
 ui.lives.textContent="♥".repeat(state.lives)||"—";
 ui.coins.textContent="◉ "+state.coins;
 ui.speed.textContent=Math.round(player.speed*.52)+" km/h";
 ui.boost.textContent="TURBO "+Math.round(state.boost)+"%";
 ui.progress.style.width=(clamp(100*player.x/FINISH,0,100))+"%";
 const approaching=state.barrels.find(b=>!b.done&&b.x-player.x>15&&b.x-player.x<105);
 ui.status.textContent=state.noticeTimer>0?state.notice:approaching?"⚠ "+(approaching.type==="pothole"?"BUCA":"BARILE")+" · PREMI SALTA!":"VIA ROMA · MELITO DI NAPOLI";
 ui.wheelie.hidden=state.wheelieVisibleFor<=0&&state.wheelieBalance<1;
 ui.wheelieFill.style.width=clamp(state.wheelieBalance,0,100)+"%";
 ui.wheelieScore.textContent="+"+Math.floor(state.wheelieStreak);
 const danger=state.wheelieBalance>=80;
 ui.wheelie.classList.toggle("danger",danger);
 ui.wheelieTip.textContent=danger?"PERICOLO! RILASCIA IMPENNA":player.speed<68?"ACCELERA PER IMPENNARE":"TIENI PREMUTO · RILASCIA PRIMA DEL ROSSO";
 ui.shareTop.href=whatsAppUrl();
}
function whatsAppUrl(){
 const url="https://czekuns.github.io/Effettokarmagra/games/scootercross/";
 return "https://wa.me/?text="+encodeURIComponent("🛵 Ho fatto "+Math.round(state.score)+" punti a *Biagio Gelo: Scootercross* su Via Roma a Melito di Napoli! Vuoi battermi? Gioca qui: "+url);
}
function popup(tag,title,message,btn,share){
 ui.tag.textContent=tag;ui.title.textContent=title;ui.message.textContent=message;ui.play.textContent=btn;
 ui.share.hidden=!share;if(share)ui.share.href=whatsAppUrl();ui.shareTop.href=whatsAppUrl();ui.veil.classList.remove("hidden");
}
function start(){reset();state.mode="playing";ui.veil.classList.add("hidden");audio();note(560,.13,.023);}
function resume(){state.mode="playing";state.last=0;ui.veil.classList.add("hidden");}
function pause(){if(state.mode==="playing"){state.mode="paused";release();popup("PAUSA","GIOCO IN PAUSA","Riprendi la corsa su Via Roma.","RIPRENDI ▶",false);}else if(state.mode==="paused")resume();}
function end(won){
 if(state.mode!=="playing")return;state.mode=won?"won":"lost";
 if(won)earn(Math.max(0,Math.floor((70-state.time)*22)));
 release();note(won?880:155,.28,.032,won?"square":"sawtooth");
 popup(won?"TRAGUARDO · VIA ROMA":"PARTITA TERMINATA",won?"TRAGUARDO!":"GAME OVER",
 won?"Hai completato Via Roma in "+state.time.toFixed(1)+" secondi, raccogliendo "+state.coins+" monete. Totale: "+state.score+" punti.":"Hai terminato le tre vite. Punteggio: "+state.score+". Riprova e sfida gli amici.","RIGIOCA ↻",true);hud();
}
function jump(){
 if(state.mode!=="playing"||!player.ground)return;
 player.ground=false;player.vy=-250;player.airTime=0;player.y-=1;state.jumpCount++;
 particles(player.x-26,player.y+11,6,"#eac39a");note(610,.09,.023,"square",1.5);
}
function boost(){
 if(state.mode!=="playing"||state.boost<30||state.boostTime>0)return;
 state.boost-=30;state.boostTime=1.3;player.speed=Math.min(250,player.speed+45);
 callout("TURBO!");note(365,.17,.022,"sawtooth",2);
}
function crash(reason="AHI! VITA PERSA"){
 if(state.invincible>0||state.mode!=="playing")return;
 state.lives--;state.invincible=1.6;state.screenShake=5;player.speed=Math.min(player.speed,65);
 state.wheelieBalance=0;state.wheelieFraction=0;state.wheelieVisibleFor=reason.includes("RIBALTATO")?1.5:0;
 particles(player.x,player.y,12,"#ffe2b1");callout(reason,1.6);
 note(180,.24,.034,"sawtooth",.45);
 if(state.lives<=0)end(false);
}
function updateWheelie(dt){
 state.wheelieVisibleFor=Math.max(0,state.wheelieVisibleFor-dt);
 state.wheelieFallTimer=Math.max(0,state.wheelieFallTimer-dt);
 const canWheelie=state.mode==="playing"&&player.ground&&player.speed>=68&&state.invincible<=0&&state.wheelieFallTimer<=0;
 const pulling=control.wheelie&&!state.wheelieLocked&&canWheelie;
 if(control.wheelie)state.wheelieVisibleFor=Math.max(state.wheelieVisibleFor,1.1);
 if(pulling){
  state.wheelieBalance+=dt*(17+player.speed*.14);
  const gained=dt*(14+state.wheelieBalance*.85);
  state.wheelieFraction+=gained;
  const whole=Math.floor(state.wheelieFraction);
  if(whole>0){earn(whole);state.wheelieStreak+=whole;state.wheelieFraction-=whole;}
  if(state.wheelieBalance>=100){
   state.wheelieBalance=100;state.wheelieLocked=true;
   crash("RIBALTATO ALL'INDIETRO!");
   state.wheelieFallTimer=.75;
   state.wheelieVisibleFor=1.8;
   note(115,.3,.045,"sawtooth",.36);
  }
 }else{
  state.wheelieBalance=Math.max(0,state.wheelieBalance-dt*53);
  if(state.wheelieBalance<=.1&&state.wheelieVisibleFor<=0){
   state.wheelieStreak=0;state.wheelieFraction=0;
  }
 }
}
function tick(dt){
 state.time+=dt;state.invincible=Math.max(0,state.invincible-dt);
 state.noticeTimer=Math.max(0,state.noticeTimer-dt);state.boostTime=Math.max(0,state.boostTime-dt);
 state.screenShake=Math.max(0,state.screenShake-dt*12);state.boost=clamp(state.boost+3*dt,0,100);
 let acceleration=control.gas?165:0,friction=player.ground?24:9;
 player.speed=clamp(player.speed+(acceleration-(control.brake?240:0)-friction)*dt,0,MAX+(state.boostTime>0?45:0));
 if(state.boostTime>0)player.speed=Math.max(165,player.speed);
 player.x+=player.speed*dt;
 updateWheelie(dt);
 const road=terrain(player.x)-11,groundAngle=slope(player.x);
 if(player.ground){
  player.y=road;
  // Lift the front wheel when balancing, and show a brief overturn animation on failure.
  const tilt=state.wheelieFallTimer>0?-1.37-(.75-state.wheelieFallTimer)*1.75:-(state.wheelieBalance/100)*.85;
  const target=groundAngle+tilt;
  player.angle+=(target-player.angle)*Math.min(1,dt*(state.wheelieFallTimer>0?16:7));
 }else{
  player.airTime+=dt;player.vy+=G*dt;player.y+=player.vy*dt;
  if(control.up)player.angle-=1.8*dt;
  if(control.down)player.angle+=1.8*dt;
  player.angle=clamp(player.angle,-1.2,1.2);
  if(player.y>=road&&player.vy>0){
   const diff=Math.abs(player.angle-groundAngle),air=player.airTime;
   player.y=road;player.vy=0;player.ground=true;player.airTime=0;
   if(diff>1.05&&player.speed>95)crash();
   else if(air>.34){earn(Math.floor(Math.min(air,1.5)*60));callout("BUON ATTERRAGGIO");particles(player.x,road+12,6,"#d1b598");}
   player.angle+=(groundAngle-player.angle)*.7;
  }
 }
 for(const o of state.barrels){
  if(o.done)continue;
  if(player.x-o.x>24){o.done=true;continue;}
  if(Math.abs(player.x-o.x)<15){
   const clearance=terrain(player.x)-11-player.y;
   if(clearance>25){o.done=true;earn(90);callout("OSTACOLO SALTATO +90");note(900,.085,.023);}
   else if(clearance<10){o.done=true;crash();}
  }
 }
 for(const p of state.pickups){
  if(p.done)continue;
  if(Math.abs(player.x-p.x)<22&&Math.abs((player.y-17)-p.y)<30){
   p.done=true;state.coins++;earn(100);state.boost=Math.min(100,state.boost+8);note(670,.06,.02);particles(p.x,p.y,4,"#ffe486");
  }
 }
 if(player.ground&&player.speed>75&&Math.random()<dt*8)particles(player.x-35,player.y+10,1,"#c5aa8d");
 for(const p of state.particles){p.t+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=180*dt;}
 state.particles=state.particles.filter(p=>p.t<p.life);
 if(player.x>=FINISH){end(true);return;}
 playMusic();hud();
}
function outlined(x,y,w,h,fill,outline="#29313b",rim="#e2c9a8"){
 rect(outline,x-2,y-2,w+4,h+4);
 rect(fill,x,y,w,h);
 if(rim)rect(rim,x+2,y+2,w-5,2);
}
function windowBlock(x,y,variation){
 rect("#5c554e",x-3,y-3,22,28);
 rect("#ebdebd",x-2,y-2,20,25);
 rect("#3c5b67",x+1,y,15,20);
 rect("#83b4b3",x+2,y+1,12,13);
 rect("#d7cfc0",x+8,y,2,19);
 rect("#547178",x+1,y+13,15,2);
 // Shutters in alternating sand/teal colors.
 let shutter=variation%3===0?"#518476":"#aa7864";
 rect(shutter,x-4,y,4,21);rect(shutter,x+17,y,4,21);
 for(let k=0;k<4;k++){rect("#e2bda0",x-4,y+k*5,3,1);rect("#c5af87",x+17,y+k*5,4,1);}
 rect("#e9cbae",x-5,y+22,27,3);
}
function balcony(x,y,w,variant){
 rect("#404c56",x-5,y,w+10,4);
 rect("#d4b3a0",x-4,y+1,w+8,2);
 for(let i=0;i<w;i+=8)rect("#344855",x+i,y+3,2,11);
 rect("#344855",x-5,y+12,w+10,3);
 if(variant%2===0){
  rect("#907063",x+5,y-3,12,4);rect("#398060",x+5,y-8,10,6);
  rect("#548a62",x+8,y-11,3,5);
 }
}
function roofAntenna(x,y,k){
 rect("#5d6267",x+13,y-19,2,19);
 rect("#d2dbd7",x+6,y-15,17,1);rect("#d2dbd7",x+8,y-9,12,1);
 if(k%3===0){rect("#455869",x+32,y-13,13,12);rect("#202e43",x+30,y-14,16,3);}
}
function storefront(x,wallTop,w,index){
 let theme=["#243e56","#4b3140","#28565a","#63513e","#343e60"][((index%5)+5)%5];
 const sign=signs[((index%signs.length)+signs.length)%signs.length];
 const shopTop=138+Math.floor(rnd(index*17+3)*9);
 // Large shady storefronts rather than identical tiny squares.
 rect("#d4b99a",x+4,shopTop-5,w-8,5);
 rect("#32343d",x+5,shopTop,w-10,15);
 rect(theme,x+7,shopTop+2,w-14,11);
 text(sign,x+w/2,shopTop+11,Math.min(9,sign.length>8?7:8),"#ffebbd");
 rect("#263541",x+7,shopTop+15,w-14,41);
 rect("#8ec4bf",x+10,shopTop+18,w-20,32);
 rect("#42636d",x+14,shopTop+18,w-28,32);
 rect("#b8d5c7",x+18,shopTop+20,11,16);
 rect("#718f95",x+w-27,shopTop+20,12,17);
 rect("#c3cab5",x+29,shopTop+18,3,31);
 if(index%3===0){
  rect("#b66d56",x+10,shopTop+33,16,10);
  rect("#ecb875",x+12,shopTop+35,12,7);
 }
 if(index%4===0){ // striped awnings hanging over the windows
  rect("#323c43",x+2,shopTop+13,w-4,4);
  for(let k=0;k<w-4;k+=10)rect(k%20===0?"#b94d50":"#ffe9d2",x+2+k,shopTop+17,9,10);
  rect("#7c534b",x+2,shopTop+27,w-4,2);
 }
}
function drawTownBlock(x,index){
 const variation=((index%6)+6)%6;
 const widths=[124,146,108,137,132,118],w=widths[variation];
 const tops=[12,29,40,17,6,32],top=tops[variation];
 const facade=["#d6a185","#d2c3ad","#e7b58e","#b2bab0","#e2bb93","#c9ad9f"][variation];
 const shadow=["#986f6a","#9e9389","#af7f76","#7f9089","#bb927e","#9c8482"][variation];
 const outline="#39434a";
 // Different buildings with brick-red roofs, parapets and setbacks.
 rect("#3c434c",x-4,top-3,w+9,190-top);
 rect(shadow,x,top,w,190-top);
 rect(facade,x+3,top+3,w-11,178-top);
 rect("#f1d3b0",x+6,top+4,w-20,3);
 rect("#705453",x-2,top-6,w+4,5);
 rect("#a87164",x-1,top-9,w+2,3);
 rect("#6e534e",x+w-8,top+2,8,178-top);
 // Ornamental narrow façade bands.
 for(let j=0;j<3;j++)rect(shadow,x+6+j*37,top+8,2,116-top);
 // Balconies on upper floors.
 const floorY=[top+19,top+65,top+105],columns=w>125?3:2;
 for(let f=0;f<3;f++){
  if(floorY[f]>127)continue;
  for(let j=0;j<columns;j++){
   const px=x+13+j*(columns===3?38:49),py=floorY[f];
   windowBlock(px,py,variation+j+f);
   if((j+f+variation)%3!==1)balcony(px-4,py+20,30,variation+j);
   if((j+f+variation)%6===2){ // lowered canvas awning on some balconies
    for(let k=0;k<4;k++)rect(k%2?"#f1d2bd":"#5d9094",px-7+k*8,py+8,7,7);
   }
  }
 }
 if(variation%2===1)roofAntenna(x+10,top,variation);
 if(variation===3){ // inset stairwell tower on the left
  rect("#b0a8a2",x+5,top-12,29,16);rect("#8fb8aa",x+12,top-7,15,9);
  rect("#5f717a",x+17,top-7,2,9);
 }
 if(variation===2){ // Italian apartment satellite dishes
  rect("#c7c6be",x+w-19,top-17,15,9);rect("#475968",x+w-12,top-10,2,10);
 }
 storefront(x,top,w, index);
 return w;
}
function parkedCar(x,y,k){
 const body=k%3===0?"#b34d4d":k%3===1?"#436884":"#dfc38f";
 rect("#222c38",x+8,y+14,42,6);
 rect("#262b37",x+4,y+9,8,10);rect("#262b37",x+45,y+9,8,10);
 rect("#161d29",x+10,y+16,8,7);rect("#161d29",x+41,y+16,8,7);
 rect("#87969a",x+12,y+17,5,4);rect("#87969a",x+43,y+17,5,4);
 rect(body,x,y+7,56,12);
 rect("#243340",x+8,y,34,12);rect(body,x+13,y-3,28,4);
 rect("#b6ced1",x+11,y+1,11,7);rect("#bdd0cd",x+25,y+1,14,7);
 rect("#d2af91",x+2,y+10,5,4);rect("#f1c86e",x+50,y+10,4,3);
}
function streetTree(x,y,k){
 rect("#514d45",x-2,y-32,5,34);
 rect("#756754",x-3,y-20,3,7);
 for(let p of [[-12,-57,23,30],[3,-65,28,35],[-20,-48,29,26]]){
  rect("#264c43",x+p[0]-2,y+p[1]-2,p[2]+4,p[3]+4);
  rect((k%2)?"#46735b":"#356d57",x+p[0],y+p[1],p[2],p[3]);
  rect("#6a9168",x+p[0]+4,y+p[1]+4,Math.max(5,p[2]-11),3);
 }
}
function backdrop(){
 const cam=state.cam;
 // Original limited palette reminiscent of 1990s 16-bit arcade hardware.
 rect("#6eafb9",0,0,W,184);
 rect("#8cc0c5",0,45,W,61);
 rect("#bfd6c7",0,96,W,84);
 // Sky gradients rendered as broad color bands.
 rect("#6a9dac",0,0,W,24);rect("#81b5bd",0,24,W,23);
 for(let i=-1;i<7;i++){
   const x=((i*141-Math.floor(cam*.11))%(W+160)+W+160)%(W+160)-60,y=14+(i+8)%3*17;
   rect("#d8e6d6",x,y+7,52,9);
   rect("#f2e7d8",x+10,y+2,34,10);rect("#f2e7d8",x+18,y-3,18,6);
   rect("#b5ccca",x+2,y+16,60,3);
 }
 // Remote skyline: minarets/rooftops / flat urban silhouettes.
 const par=.19,shift=Math.floor(cam*par);
 for(let i=-1;i<20;i++){
  const x=i*48-shift%48,w=33+Math.floor(rnd(i*11)*21),t=93+Math.floor(rnd(i*29)*20);
  rect(i%2?"#899b98":"#91ada9",x,t,w,183-t);
  rect("#637f82",x+4,t-2,16,3);
  if(i%3===0){rect("#879992",x+12,t-12,3,12);rect("#b4c2b5",x+5,t-11,16,2);}
 }
 // Street-facing buildings: varied widths and silhouette.
 const widths=[124,146,108,137,132,118],prefix=[0,124,270,378,515,647],period=765;
 const offset=Math.floor(cam*.44),cycle=Math.floor(offset/period);
 for(let lap=cycle-1;lap<=cycle+1;lap++){
  for(let j=0;j<6;j++){
   const x=lap*period+prefix[j]-offset;
   if(x>W+5||x+widths[j]<-5)continue;
   drawTownBlock(x,lap*6+j);
  }
 }
 // Continuous raised stone pavement with curb texture.
 rect("#807d72",0,179,W,12);
 rect("#c9bda7",0,181,W,8);
 rect("#faf0da",0,179,W,2);
 rect("#585e5f",0,190,W,7);
 rect("#ded0b7",0,190,W,3);
 for(let x=-(Math.floor(cam*.69)%32);x<W+32;x+=32){
   rect("#a59886",x,185,2,6);rect("#6a6e6a",x+15,192,14,2);
 }
 // Near layer: trees, scooters, poles, newspaper stalls, urban street furniture.
 const mov=Math.floor(cam*.68);
 for(let i=Math.floor(mov/166)-2;i<Math.floor(mov/166)+7;i++){
  const x=i*166-mov;
  if(i%3===0){
   streetTree(x+123,181,i);
  }else if(i%3===1){
   rect("#454d58",x+74,115,3,70);rect("#e8dbc4",x+65,113,19,4);
   rect("#f9d6a3",x+81,112,6,6);rect("#48596a",x+80,115,3,2);
   parkedCar(x-20,162,i);
  }else{
   rect("#5a6067",x+101,134,3,51);rect("#587c82",x+99,136,13,17);
   rect("#c9d7c7",x+101,138,9,5);
   parkedCar(x-22,162,i);
  }
 }
 // Town plate integrated into the scene (small, avoids covering gameplay).
 rect("#263943",7,6,102,24);rect("#c2a58b",9,8,98,20);rect("#294a55",11,10,94,16);
 text("VIA ROMA",58,18,10,"#fff0c3");text("MELITO DI NAPOLI",58,24,6,"#d4e3d8");
}
function track(){
 let camera=state.cam;
 g.save();g.translate(-camera,0);
 g.beginPath();g.moveTo(camera-20,H+15);
 for(let x=Math.floor((camera-24)/4)*4;x<camera+W+40;x+=4)g.lineTo(x,terrain(x));
 g.lineTo(camera+W+50,H+15);g.closePath();g.fillStyle="#49545e";g.fill();
 for(let x=Math.floor(camera/48)*48-48;x<camera+W+70;x+=48){
  let y=terrain(x);rect("#c6bbb0",x,y+34,22,2);
  rect("#686d72",x+12,y+21,3,2);
  rect("#586069",x+29,y+49,8,2);
  rect("#636e75",x+7,y+27,5,1);
 }
 g.beginPath();for(let x=Math.floor((camera-15)/3)*3;x<camera+W+20;x+=3){if(x===Math.floor((camera-15)/3)*3)g.moveTo(x,terrain(x));else g.lineTo(x,terrain(x));}
 g.strokeStyle="#222e36";g.lineWidth=9;g.stroke();
 g.strokeStyle="#f1d8b6";g.lineWidth=3;g.stroke();
 // Lower lane stripe, road repairs and asphalt grit.
 for(let x=Math.floor(camera/31)*31-31;x<camera+W+40;x+=31){
  const y=terrain(x),n=Math.floor(x/31);
  rect(n%2?"#5f696c":"#5c6369",x+12,y+12,3,1);
  rect("#687176",x+23,y+19,7,1);
  if(n%5===0)rect("#c4bc9e",x+4,y+27,16,2);
  if(n%7===3){rect("#394850",x+17,y+42,18,3);rect("#8a8d85",x+18,y+42,5,1);}
 }
 // Motion shadows on the tarmac.
 rect("#263740",player.x-42,terrain(player.x)+6,87,6);
 // Striped curb and decorative crossings.
 for(let i=0;i<ramps.length-1;i++){
  if(i%5!==2)continue;
  let wx=ramps[i][0],yy=terrain(wx);
  if(wx<camera-50||wx>camera+W+60)continue;
  for(let j=0;j<5;j++)rect(j%2?"#e0dfcc":"#a7a9a4",wx+j*10,yy+6,7,15);
 }
 for(const o of state.barrels){
  if(o.done||o.x<camera-40||o.x>camera+W+40)continue;
  let y=terrain(o.x);
  if(o.type==="pothole"){
    rect("#202d35",o.x-19,y-3,38,10);rect("#303a42",o.x-14,y-5,28,9);
    rect("#171f28",o.x-10,y-2,19,4);rect("#778080",o.x-19,y-4,10,2);
   }else{
    rect("#152530",o.x-14,y-24,28,26);rect("#733544",o.x-12,y-25,24,23);
    rect("#d1584e",o.x-10,y-24,20,20);rect("#ed8462",o.x-7,y-22,9,17);
    rect("#ffb97d",o.x-8,y-22,5,5);rect("#24313b",o.x-13,y-18,26,4);
    rect("#f7ead7",o.x-11,y-17,22,3);rect("#d58f69",o.x-10,y-13,20,2);
    rect("#3b2733",o.x-12,y-5,24,5);rect("#f7ead7",o.x-10,y-7,20,2);
    rect("#1a222a",o.x-8,y,16,2);
   }
 }
 for(const p of state.pickups){
  if(p.done||p.x<camera-24||p.x>camera+W+24)continue;
  let half=4+Math.round(Math.abs(Math.cos(state.time*7+p.x*.03))*6);
  rect("#665039",p.x-half-2,p.y-11,half*2+4,22);
  rect("#d58b36",p.x-half-1,p.y-10,half*2+2,20);
  rect("#ffe08a",p.x-half+1,p.y-8,half*2-2,16);
  rect("#fff5b4",p.x-half+3,p.y-8,2,6);
  if(half>6)text("★",p.x,p.y+4,11,"#bc832e");
 }
 let fy=terrain(FINISH);
 rect("#ddd7be",FINISH-1,fy-110,5,110);
 for(let i=0;i<5;i++)for(let j=0;j<3;j++)rect((i+j)%2?"#101c2b":"#fff4d9",FINISH+4+i*9,fy-106+j*9,9,9);
 text("TRAGUARDO",FINISH+21,fy-118,12,"#fff4cf");
 if(state.invincible<=0||Math.floor(state.time*12)%2===0){
  g.save();g.translate(player.x,player.y);g.rotate(player.angle);
  if(art.complete&&art.naturalWidth){g.imageSmoothingEnabled=false;g.drawImage(art,-62,-94,124,105);}
  else{
   rect("#171e29",-36,-11,16,15);rect("#171e29",24,-11,16,15);
   rect("#8a2a46",-40,-27,78,28);rect("#3169b1",-17,-45,39,29);
   rect("#e9c19b",-18,-62,30,18);rect("#c93e48",-20,-68,34,8);
   rect("#f1eee0",-18,-56,26,3);
  }
  if(state.boostTime>0){rect("#fca049",-60,-19,14,6);rect("#ffdb6a",-71,-17,11,3);}
  g.restore();
 }
 for(const p of state.particles){g.globalAlpha=clamp((p.life-p.t)/p.life,0,1);rect(p.color,p.x,p.y,2,2);}
 g.globalAlpha=1;g.restore();
}
function render(){
 state.cam=clamp(player.x-140,0,FINISH-W+150);
 g.save();if(state.screenShake>0)g.translate((Math.random()-.5)*state.screenShake,(Math.random()-.5)*state.screenShake);
 backdrop();track();g.restore();
 if(state.noticeTimer>0){rect("#172c42",140,30,200,18);text(state.notice,240,43,10,"#ffe2a0");}
}
function release(){for(const k in control)control[k]=false;state.wheelieLocked=false;document.querySelectorAll("[data-control]").forEach(el=>el.classList.remove("pressed"));}
function events(){
 const map={ArrowRight:"gas",d:"gas",D:"gas",ArrowLeft:"brake",a:"brake",A:"brake",ArrowUp:"wheelie",w:"wheelie",W:"wheelie",ArrowDown:"down",s:"down",S:"down"};
 window.addEventListener("keydown",e=>{
  if(map[e.key]){e.preventDefault();control[map[e.key]]=true;}
  if(e.code==="Space"){e.preventDefault();if(state.mode==="ready"||state.mode==="won"||state.mode==="lost")start();else if(!e.repeat)jump();}
  if(e.key==="Shift"){e.preventDefault();if(!e.repeat)boost();}
  if((e.key==="p"||e.key==="P")&&!e.repeat)pause();
 });
 window.addEventListener("keyup",e=>{if(map[e.key]){e.preventDefault();control[map[e.key]]=false;if(map[e.key]==="wheelie")state.wheelieLocked=false;}});
 document.querySelectorAll("[data-control]").forEach(el=>{
  const c=el.dataset.control;
  el.addEventListener("pointerdown",e=>{e.preventDefault();if(state.mode!=="playing")return;control[c]=true;el.classList.add("pressed");try{el.setPointerCapture(e.pointerId);}catch(_){}});
  for(const key of ["pointerup","pointercancel","lostpointercapture"])el.addEventListener(key,()=>{control[c]=false;if(c==="wheelie")state.wheelieLocked=false;el.classList.remove("pressed");});
 });
 get("jump").addEventListener("pointerdown",e=>{e.preventDefault();jump();});
 get("turbo").addEventListener("pointerdown",e=>{e.preventDefault();boost();});
 ui.shareTop.addEventListener("click",()=>{ui.shareTop.href=whatsAppUrl();});
 ui.play.addEventListener("click",()=>{if(state.mode==="paused")resume();else start();});
 ui.sound.addEventListener("click",()=>{state.mute=!state.mute;ui.sound.textContent=state.mute?"♫ OFF":"♫ ON";if(!state.mute)note(660,.08);});
 window.addEventListener("blur",release);
 document.addEventListener("visibilitychange",()=>{if(document.hidden&&state.mode==="playing")pause();});
}
function frame(t){
 let dt=state.last?clamp((t-state.last)/1000,0,.04):0;state.last=t;
 if(state.mode==="playing")tick(dt);
 render();requestAnimationFrame(frame);
}
reset();events();requestAnimationFrame(frame);
})();