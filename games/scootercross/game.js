(function(){
"use strict";
const W=480,H=270,FINISH=4200,G=650,MAX=208;
const get=id=>document.getElementById(id),cv=get("game"),g=cv.getContext("2d",{alpha:false});
g.imageSmoothingEnabled=false;
const ui={score:get("score"),best:get("best"),time:get("time"),lives:get("lives"),progress:get("progress"),coins:get("coins"),speed:get("speed"),boost:get("boost"),status:get("status"),veil:get("veil"),tag:get("tag"),title:get("title"),message:get("message"),play:get("play"),share:get("share"),sound:get("sound")};
const art=new Image();art.src="./assets/biagio-side-pixel.svg";
const control={gas:false,brake:false,up:false,down:false};
const ramps=[
[0,207],[380,207],[462,204],[560,194],[626,211],[825,211],
[952,206],[1025,183],[1102,209],[1300,209],[1410,204],[1490,185],[1562,210],
[1770,210],[1870,204],[1950,184],[2036,211],[2240,211],[2340,205],[2420,184],[2494,210],
[2700,210],[2830,202],[2905,187],[2978,210],[3150,209],[3280,205],[3365,182],[3445,211],
[3630,211],[3750,204],[3834,191],[3920,208],[FINISH+180,208]];
const obstacles=[455,852,1338,1740,2178,2585,3000,3460,3860];
const colors=["#dfb488","#c7b1a5","#e5c39b","#bfc2b6","#ccad99","#deb98c"];
const signs=["CAFFE","PANIFICIO","BAR","TABACCHI","MARKET","OTTICA","PIZZERIA","EDICOLA"];
const state={mode:"ready",dist:0,time:0,score:0,best:0,coins:0,lives:3,cam:0,mute:false,audio:null,lastBeat:-1,last:0,invincible:0,jumpCount:0,boost:100,boostTime:0,notice:"",noticeTimer:0,particles:[],pickups:[],barrels:[],screenShake:0};
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
 state.barrels=obstacles.map((x,i)=>({x,type:i%4===3?"pothole":"barrel",done:false}));
 state.pickups=Array.from({length:38},(_,i)=>{let x=180+i*101;return{x,y:terrain(x)-(i%4===1?69:48),done:false};});
 Object.assign(player,{x:70,y:terrain(70)-11,vy:0,speed:0,angle:0,ground:true,airTime:0});
 for(const k in control)control[k]=false;
 if(ui.share)ui.share.hidden=true;hud();
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
}
function whatsAppUrl(){
 const url="https://czekuns.github.io/Effettokarmagra/games/scootercross/";
 return "https://wa.me/?text="+encodeURIComponent("🛵 Ho fatto "+Math.round(state.score)+" punti a *Biagio Gelo: Scootercross* su Via Roma a Melito di Napoli! Vuoi battermi? Gioca qui: "+url);
}
function popup(tag,title,message,btn,share){
 ui.tag.textContent=tag;ui.title.textContent=title;ui.message.textContent=message;ui.play.textContent=btn;
 ui.share.hidden=!share;if(share)ui.share.href=whatsAppUrl();ui.veil.classList.remove("hidden");
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
function crash(){
 if(state.invincible>0||state.mode!=="playing")return;
 state.lives--;state.invincible=1.6;state.screenShake=5;player.speed=Math.min(player.speed,65);
 particles(player.x,player.y,12,"#ffe2b1");callout("AHI! VITA PERSA");
 note(180,.24,.034,"sawtooth",.45);
 if(state.lives<=0)end(false);
}
function tick(dt){
 state.time+=dt;state.invincible=Math.max(0,state.invincible-dt);
 state.noticeTimer=Math.max(0,state.noticeTimer-dt);state.boostTime=Math.max(0,state.boostTime-dt);
 state.screenShake=Math.max(0,state.screenShake-dt*12);state.boost=clamp(state.boost+3*dt,0,100);
 let acceleration=control.gas?165:0,friction=player.ground?24:9;
 player.speed=clamp(player.speed+(acceleration-(control.brake?240:0)-friction)*dt,0,MAX+(state.boostTime>0?45:0));
 if(state.boostTime>0)player.speed=Math.max(165,player.speed);
 player.x+=player.speed*dt;
 const road=terrain(player.x)-11,groundAngle=slope(player.x);
 if(player.ground){
  player.y=road;player.angle+=(groundAngle-player.angle)*Math.min(1,dt*6);
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
function backdrop(){
 const cam=state.cam;
 rect("#7fb8d1",0,0,W,H);rect("#9fd4e5",0,65,W,78);
 for(let i=0;i<9;i++){let x=((i*167-Math.floor(cam*.09))%(W+150)+W+150)%(W+150)-50,y=14+i%3*20;
  rect("#e6ecdf",x,y,36,8);rect("#f6eee0",x+8,y-4,20,5);rect("#e2ece0",x-12,y+6,58,7);}
 // Via Roma streetscape: apartment buildings, balconies, shutters, striped awnings.
 const parallax=.46,step=86,offset=Math.floor(cam*parallax),first=Math.floor(offset/step)-1;
 for(let i=first;i<first+9;i++){
  let x=i*step-offset,variant=Math.floor(rnd(i*29)*colors.length),roof=37+Math.floor(rnd(i*31)*24);
  rect("#4a4a55",x+1,roof,83,143);
  rect(colors[variant],x+3,roof+2,79,137);
  rect("#866d69",x+2,roof+2,81,4);
  for(let row=0;row<2;row++)for(let col=0;col<3;col++){
   const xx=x+11+col*23, yy=roof+18+row*39;
   rect("#677b88",xx-2,yy-2,17,25);rect("#b3cec6",xx,yy,13,18);
   rect("#5b7b75",xx,yy,4,18);rect("#c8b79c",xx,yy+15,13,3);
   rect("#3b4c57",xx-6,yy+22,25,3);
   for(let b=0;b<3;b++)rect("#465966",xx-5+b*8,yy+24,2,6);
  }
  rect("#3b4f5f",x+5,roof+102,75,12);
  text(signs[((i%signs.length)+signs.length)%signs.length],x+43,roof+111,7,"#ffe5ba");
  for(let j=0;j<9;j++)rect(j%2?"#e3e1d2":"#9c4350",x+5+j*8,roof+114,8,9);
  rect("#405969",x+7,roof+123,31,22);rect("#a5c9c6",x+9,roof+125,27,16);
  rect("#405969",x+45,roof+123,31,22);rect("#a5c9c6",x+47,roof+125,27,16);
 }
 rect("#a3a29c",0,183,W,9);rect("#737979",0,191,W,6);
 for(let i=Math.floor(cam*.58/165)-1;i<Math.floor(cam*.58/165)+5;i++){
  let x=i*165-Math.floor(cam*.58);
  rect("#4e5756",x+61,138,3,49);rect("#28394a",x+58,138,18,3);rect("#f0e0a0",x+70,139,7,5);
  rect("#5b5549",x+110,170,4,24);rect("#3b8063",x+98,148,31,29);rect("#4a8e69",x+105,142,20,20);
  // parked car silhouette behind pavement
  if(i%2===0){rect("#344151",x-22,176,42,13);rect("#7f5060",x-18,170,32,11);rect("#a8cfcb",x-12,171,18,7);rect("#202a33",x-15,188,8,7);rect("#202a33",x+8,188,8,7);}
 }
 // Nameplate.
 rect("#22334a",350,4,123,26);rect("#b78c63",352,6,119,22);rect("#2b4254",354,8,115,18);
 text("VIA ROMA",412,16,10,"#ffe1a1");text("MELITO DI NAPOLI",412,24,6,"#d2e8dd");
}
function track(){
 let camera=state.cam;
 g.save();g.translate(-camera,0);
 g.beginPath();g.moveTo(camera-20,H+15);
 for(let x=Math.floor((camera-24)/4)*4;x<camera+W+40;x+=4)g.lineTo(x,terrain(x));
 g.lineTo(camera+W+50,H+15);g.closePath();g.fillStyle="#49545e";g.fill();
 for(let x=Math.floor(camera/48)*48-48;x<camera+W+70;x+=48){
  let y=terrain(x);rect("#bdbbae",x,y+35,23,2);
  rect("#5f6568",x+12,y+20,3,2);
 }
 g.beginPath();for(let x=Math.floor((camera-15)/3)*3;x<camera+W+20;x+=3){if(x===Math.floor((camera-15)/3)*3)g.moveTo(x,terrain(x));else g.lineTo(x,terrain(x));}
 g.strokeStyle="#363e43";g.lineWidth=8;g.stroke();g.strokeStyle="#dbc398";g.lineWidth=3;g.stroke();
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
  if(o.type==="pothole"){rect("#222d32",o.x-18,y-2,36,9);rect("#35373c",o.x-14,y+1,28,4);}
  else{rect("#342c31",o.x-13,y-24,26,24);rect("#a54546",o.x-11,y-23,22,20);rect("#d36854",o.x-10,y-22,20,4);rect("#e1c1a5",o.x-11,y-16,22,3);rect("#f5e0c5",o.x-11,y-6,22,3);}
 }
 for(const p of state.pickups){
  if(p.done||p.x<camera-24||p.x>camera+W+24)continue;
  let half=4+Math.round(Math.abs(Math.cos(state.time*7+p.x*.03))*6);
  rect("#906622",p.x-half-2,p.y-10,half*2+4,20);rect("#ffda68",p.x-half,p.y-8,half*2,16);
  if(half>6)text("★",p.x,p.y+4,12,"#fff1b4");
 }
 let fy=terrain(FINISH);
 rect("#ddd7be",FINISH-1,fy-110,5,110);
 for(let i=0;i<5;i++)for(let j=0;j<3;j++)rect((i+j)%2?"#101c2b":"#fff4d9",FINISH+4+i*9,fy-106+j*9,9,9);
 text("TRAGUARDO",FINISH+21,fy-118,12,"#fff4cf");
 if(state.invincible<=0||Math.floor(state.time*12)%2===0){
  g.save();g.translate(player.x,player.y);g.rotate(player.angle);
  if(art.complete&&art.naturalWidth){g.imageSmoothingEnabled=false;g.drawImage(art,-52,-64,105,77);}
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
function release(){for(const k in control)control[k]=false;document.querySelectorAll("[data-control]").forEach(el=>el.classList.remove("pressed"));}
function events(){
 const map={ArrowRight:"gas",d:"gas",D:"gas",ArrowLeft:"brake",a:"brake",A:"brake",ArrowUp:"up",w:"up",W:"up",ArrowDown:"down",s:"down",S:"down"};
 window.addEventListener("keydown",e=>{
  if(map[e.key]){e.preventDefault();control[map[e.key]]=true;}
  if(e.code==="Space"){e.preventDefault();if(state.mode==="ready"||state.mode==="won"||state.mode==="lost")start();else if(!e.repeat)jump();}
  if(e.key==="Shift"){e.preventDefault();if(!e.repeat)boost();}
  if((e.key==="p"||e.key==="P")&&!e.repeat)pause();
 });
 window.addEventListener("keyup",e=>{if(map[e.key]){e.preventDefault();control[map[e.key]]=false;}});
 document.querySelectorAll("[data-control]").forEach(el=>{
  const c=el.dataset.control;
  el.addEventListener("pointerdown",e=>{e.preventDefault();if(state.mode!=="playing")return;control[c]=true;el.classList.add("pressed");try{el.setPointerCapture(e.pointerId);}catch(_){}});
  for(const key of ["pointerup","pointercancel","lostpointercapture"])el.addEventListener(key,()=>{control[c]=false;el.classList.remove("pressed");});
 });
 get("jump").addEventListener("pointerdown",e=>{e.preventDefault();jump();});
 get("turbo").addEventListener("pointerdown",e=>{e.preventDefault();boost();});
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