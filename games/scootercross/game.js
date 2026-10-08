(function(){
"use strict";
const W=256,H=448,ROAD_LEFT=56,ROAD_RIGHT=200,PLAYER_Y=342,FINISH=6200,LANES=[80,128,176],STORE=["BAR","PIZZA","TABACCHI","CAFFE","MARKET","FARMACIA"],NOTES=[262,330,392,330,294,349,440,349,262,294,330,392,349,294,262,196];
const by=id=>document.getElementById(id),canvas=by("screen"),c=canvas.getContext("2d",{alpha:false});
c.imageSmoothingEnabled=false;
const ui={score:by("score"),time:by("time"),lives:by("lives"),coins:by("coins"),progress:by("progress"),overlay:by("overlay"),title:by("dialog-title"),message:by("dialog-message"),kicker:by("dialog-kicker"),start:by("start"),share:by("share"),audio:by("audio"),status:by("status"),boost:by("boost")};
const rider=new Image();rider.src="./assets/biagio-top-pixel.svg";
const input={left:false,right:false};
const s={phase:"ready",distance:0,time:0,score:0,coins:0,lives:3,best:0,lane:1,x:LANES[1],z:0,vz:0,jumpCooldown:0,immune:0,jumpCount:0,jumpedSinceLanding:false,turbo:100,turboTime:0,slowTime:0,objects:[],particles:[],last:0,sound:true,ac:null,lastBeat:-1,notice:"",noticeTime:0,fxTime:0,speed:170};
try{s.best=Number(localStorage.getItem("biagio-scootercross-best")||0)||0;}catch(e){}
function clamp(v,a,b){return Math.min(b,Math.max(a,v));}
function hash(n){let v=(Math.imul(n,1597334677)+3812015801)|0;v^=v>>>13;v=Math.imul(v,1597334677);return (v>>>0)/4294967295;}
function rect(x,y,w,h,color){if(w<=0||h<=0)return;c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.ceil(w),Math.ceil(h));}
function txt(t,x,y,color="#f9e5ac",size=9,align="center"){c.textAlign=align;c.font="bold "+size+"px monospace";c.fillStyle="#12243a";c.fillText(t,x+1,y+1);c.fillStyle=color;c.fillText(t,x,y);}
function audio(){if(!s.sound)return null;try{if(!s.ac){let A=window.AudioContext||window.webkitAudioContext;if(!A)return null;s.ac=new A();}if(s.ac.state==="suspended"&&s.ac.resume)s.ac.resume().catch(()=>{});return s.ac;}catch(_){return null;}}
function bleep(f,d=.075,type="square",volume=.021){const a=audio();if(!a)return;let o=a.createOscillator(),g=a.createGain(),t=a.currentTime;o.type=type;o.frequency.setValueAtTime(f,t);g.gain.setValueAtTime(volume,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g).connect(a.destination);o.start(t);o.stop(t+d+.01);}
function tune(){if(s.phase!=="playing")return;let beat=Math.floor(s.time/.16);if(beat!==s.lastBeat){s.lastBeat=beat;if(beat%2===0)bleep(NOTES[(beat/2)%NOTES.length]*2,.063,"square",.009);if(beat%4===0)bleep([110,146,130,98][Math.floor(beat/8)%4],.16,"triangle",.012);}}
function makeObjects(){
 s.objects=[];
 for(let i=0;i<24;i++){
  const at=420+i*238;
  const lane=[1,0,2,1,2,0,1,2,1,0,2,1][i%12];
  s.objects.push({type:i%4===3?"pothole":"barrel",lane,at,done:false});
  // Reward the risky lane with an approach coin and one after the hazard.
  s.objects.push({type:"coin",lane,at:at-100,done:false});
  s.objects.push({type:"coin",lane:(lane+1)%3,at:at+52,done:false});
  if(i%3===0)s.objects.push({type:"coin",lane:(lane+2)%3,at:at-40,done:false});
 }
 for(let i=0;i<8;i++)s.objects.push({type:"coin",lane:i%3,at:175+i*140,done:false});
}
function fresh(){
 Object.assign(s,{phase:"ready",distance:0,time:0,score:0,coins:0,lives:3,lane:1,x:LANES[1],z:0,vz:0,jumpCooldown:0,immune:0,jumpCount:0,jumpedSinceLanding:false,turbo:100,turboTime:0,slowTime:0,notice:"",noticeTime:0,fxTime:0,speed:170,lastBeat:-1,last:0});
 for(let k in input)input[k]=false;
 s.particles=[];makeObjects();updateUI();
}
function score(n){s.score+=n;if(s.score>s.best){s.best=s.score;try{localStorage.setItem("biagio-scootercross-best",String(s.best));}catch(_){}}}
function status(message,duration=1.4){s.notice=message;s.noticeTime=duration;}
function updateUI(){
 ui.score.textContent=String(Math.round(s.score)).padStart(5,"0");
 ui.time.textContent=String(Math.floor(s.time/60)).padStart(2,"0")+":"+String(Math.floor(s.time%60)).padStart(2,"0");
 ui.lives.textContent="♥".repeat(s.lives)||"—";
 ui.coins.textContent="◉ "+s.coins;
 ui.boost.textContent="⚡ "+Math.round(s.turbo)+"%";
 ui.progress.style.width=Math.min(100,Math.floor(100*s.distance/FINISH))+"%";
 const danger=s.objects.find(o=>!o.done&&o.type!=="coin"&&o.lane===s.lane&&o.at-s.distance>25&&o.at-s.distance<113);
 ui.status.textContent=s.noticeTime>0?s.notice:(s.phase==="playing"?(danger?(danger.type==="pothole"?"⚠ BUCA DAVANTI · PREMI SALTA!":"⚠ BARILE DAVANTI · PREMI SALTA!"):"CORSO EUROPA · MELITO"):"MELITO DI NAPOLI");
}
function show(kicker,title,message,action,share){
 ui.kicker.textContent=kicker;ui.title.textContent=title;ui.message.textContent=message;ui.start.textContent=action;
 ui.share.hidden=!share;
 if(share){
  const direct="https://czekuns.github.io/Effettokarmagra/games/scootercross/";
  const msg="🛵 Ho fatto "+Math.round(s.score)+" punti a *Biagio Gelo: Scootercross* sul Corso Europa di Melito! Riesci a superarmi? Gioca qui: "+direct;
  ui.share.href="https://wa.me/?text="+encodeURIComponent(msg);
 }
 ui.overlay.classList.remove("hidden");
}
function start(){fresh();s.phase="playing";ui.overlay.classList.add("hidden");audio();bleep(600,.15);updateUI();}
function finish(won){
 if(s.phase!=="playing")return;
 s.phase=won?"won":"over";
 if(won){let bonus=Math.max(0,Math.floor((55-s.time)*35));score(bonus);}
 show(won?"TRAGUARDO · CORSO EUROPA":"FINE CORSA",won?"GRANDE BIAGIO!":"GAME OVER",
  won?"Traguardo raggiunto in "+s.time.toFixed(1)+" secondi! "+s.coins+" monete e "+s.score+" punti. Sfida gli amici!":"Hai finito le tre vite. Hai conquistato "+s.score+" punti e "+s.coins+" monete. Riprova!","RIGIOCA ▶",true);
 bleep(won?820:156,.21,won?"square":"sawtooth",.038);updateUI();
}
function steer(dir){
 if(s.phase!=="playing")return;
 let next=clamp(s.lane+dir,0,2);if(next!==s.lane){s.lane=next;bleep(250,.033,"triangle",.006);}
}
function jump(){
 if(s.phase!=="playing"||s.z>0||s.jumpCooldown>0)return;
 s.vz=165;s.z=.01;s.jumpCooldown=.88;s.jumpedSinceLanding=false;
 bleep(490,.13,"square",.019);
 for(let i=0;i<5;i++)particle(s.x,PLAYER_Y+12,"#e1c0a0");
}
function turbo(){
 if(s.phase!=="playing"||s.turbo<32||s.turboTime>0)return;
 s.turbo-=32;s.turboTime=1.65;status("TURBO!");bleep(810,.16,"sawtooth",.02);
}
function particle(x,y,color){
 s.particles.push({x,y,dx:(Math.random()-.5)*55,dy:(Math.random()-.5)*70,life:.25+Math.random()*.4,t:0,color});
 if(s.particles.length>70)s.particles.splice(0,s.particles.length-70);
}
function crash(){
 if(s.immune>0||s.phase!=="playing")return;
 s.lives--;s.immune=1.7;s.slowTime=.75;s.fxTime=.4;
 status("AHI! UN BARILE!",1.25);bleep(145,.27,"sawtooth",.033);
 for(let i=0;i<12;i++)particle(s.x,PLAYER_Y+10,"#ffe7b0");
 if(s.lives<=0){finish(false);}
}
function update(dt){
 s.time+=dt;
 s.immune=Math.max(0,s.immune-dt);s.jumpCooldown=Math.max(0,s.jumpCooldown-dt);
 s.slowTime=Math.max(0,s.slowTime-dt);s.turboTime=Math.max(0,s.turboTime-dt);
 s.noticeTime=Math.max(0,s.noticeTime-dt);s.fxTime=Math.max(0,s.fxTime-dt);
 s.turbo=Math.min(100,s.turbo+dt*2.3);
 s.speed=s.turboTime>0?260:s.slowTime>0?105:176;
 s.distance+=dt*s.speed;
 s.x+=(LANES[s.lane]-s.x)*Math.min(1,dt*15);
 if(s.z>0||s.vz>0){
  s.z+=s.vz*dt;s.vz-=370*dt;
  if(s.z<=0){s.z=0;s.vz=0;s.jumpedSinceLanding=false;}
 }
 for(const o of s.objects){
  if(o.done)continue;
  const y=PLAYER_Y-(o.at-s.distance);
  if(y>PLAYER_Y+26){o.done=true;continue;}
  if(Math.abs(y-PLAYER_Y)<12&&Math.abs(LANES[o.lane]-s.x)<19){
    if(o.type==="coin"){
      o.done=true;s.coins++;score(100);s.turbo=Math.min(100,s.turbo+8);
      bleep(665,.072,"square",.02);for(let j=0;j<4;j++)particle(s.x,PLAYER_Y-12,"#ffe578");
    }else if(s.z>=15){
      if(!o.cleared){o.cleared=true;score(60);s.jumpedSinceLanding=true;status("SALTO PERFETTO +60",.8);bleep(780,.1);}
      o.done=true;
    }else{
      o.done=true;crash();
    }
  }
 }
 for(const p of s.particles){p.t+=dt;p.x+=p.dx*dt;p.y+=p.dy*dt;p.dy+=80*dt;}
 s.particles=s.particles.filter(p=>p.t<p.life);
 tune();
 if(s.distance>=FINISH){finish(true);return;}
 updateUI();
}
function drawBuilding(side,moduleY,index){
 const left=side===0,x=left?0:214,w=42;
 const palette=["#d8aa7d","#c7b3a2","#e2bd96","#b4b5ad","#ddae85","#c3d3ca"];
 const wall=palette[Math.floor(hash(index*9+side*41)*palette.length)];
 rect(x,moduleY,w,87,"#6d6c79");rect(x+2,moduleY+2,w-4,82,wall);
 rect(x+3,moduleY+1,w-6,5,"#755961");
 const isShop=(index+side)%3!==1;
 if(isShop){
  rect(x+3,moduleY+46,w-6,12,"#744d51");
  const stripes=["#9c283d","#1c8b85","#385a8f","#b6503b"][(index+side*2+1000)%4];
  for(let k=0;k<5;k++)rect(x+4+k*7,moduleY+47,7,10,k%2? "#ffe9cf":stripes);
  rect(x+5,moduleY+60,30,19,"#253f4e");
  rect(x+7,moduleY+61,12,14,"#86b8b4");rect(x+22,moduleY+61,11,14,"#91c8c0");
  rect(x+4,moduleY+35,w-8,9,"#26374d");
  if(moduleY>-18&&moduleY<H+20){txt(STORE[(Math.abs(index)*3+side)%STORE.length],x+21,moduleY+42,"#fff6d6",5);}
 }else{
  for(let row=0;row<2;row++)for(let col=0;col<2;col++){
   rect(x+5+col*18,moduleY+15+row*26,12,16,"#314955");
   rect(x+6+col*18,moduleY+16+row*26,10,10,"#a0c8c2");
   rect(x+5+col*18,moduleY+29+row*26,12,3,"#795967");
  }
  rect(x+3,moduleY+69,36,9,"#867364");
 }
 // facade edge and balcony
 rect(left?39:214,moduleY,3,87,"#8c827b");
}
function drawStreet(){
 rect(0,0,W,H,"#a9b4ab");
 const scroll=s.distance*.86, offset=((scroll%88)+88)%88;
 for(let i=-2;i<7;i++){
  const y=Math.floor(i*88+offset);
  const index=Math.floor(scroll/88)+i;
  drawBuilding(0,y,index);drawBuilding(1,y,index);
 }
 // Concrete sidewalks, curbs, road asphalt.
 rect(42,0,13,H,"#adaaa2");rect(201,0,13,H,"#adaaa2");
 rect(45,0,2,H,"#d8c8a9");rect(209,0,2,H,"#d8c8a9");
 rect(55,0,146,H,"#4a5760");rect(57,0,2,H,"#dfceab");rect(197,0,2,H,"#dfceab");
 // Asphalt texture and lane markings.
 let textureOffset=Math.floor(scroll*.37)%31;
 for(let i=0;i<60;i++){
  let seed=i+Math.floor(scroll/31)*60,x=60+Math.floor(hash(seed*29)*134),y=(i*17+textureOffset*3)%460-5;
  rect(x,y,1+Math.floor(hash(seed*13)*3),1,"#52616b");
 }
 for(let x of [104,152])for(let i=-2;i<29;i++){
  let y=i*24+scroll%24;rect(x,Math.floor(y),2,12,"#cfccc2");
 }
 // Painted crossings at regular intervals.
 for(let d=650;d<FINISH;d+=1080){
  const y=Math.round(PLAYER_Y-(d-s.distance));
  if(y>-30&&y<H+20){
    rect(56,y-11,144,5,"#d3c4a4");
    for(let i=0;i<9;i++)rect(61+i*16,y-6,10,10,"#ede9d6");
  }
 }
 // Roadside trees, lamp posts, scooters parked on sidewalks.
 for(let i=-2;i<8;i++){
  const y=Math.floor(i*88+offset),n=Math.floor(scroll/88)+i;
  if(n%3===0){
   for(const x of [49,207]){
    rect(x-2,y+6,4,14,"#5c5145");
    rect(x-6,y+1,12,8,"#28674d");rect(x-4,y-4,8,11,"#388660");
    rect(x-2,y-7,4,4,"#60a46c");
   }
  }else if(n%3===1){
   for(const x of [48,207]){
    rect(x-1,y+17,2,27,"#5d6770");rect(x-3,y+14,6,6,"#f5e9a3");
   }
  }
 }
 // Decorative sign with verified street name.
 rect(63,8,130,17,"#122941");rect(65,10,126,13,"#254968");
 txt("MELITO DI NAPOLI",128,17,"#ffedc3",7);
 txt("CORSO EUROPA",128,23,"#d9edd9",5);
}
function barrel(x,y){
 rect(x-12,y-9,24,22,"#25323b");rect(x-10,y-10,20,19,"#a34839");
 rect(x-9,y-10,18,4,"#d87550");rect(x-10,y-2,20,4,"#f1debd");rect(x-10,y+5,20,4,"#e9d8ba");
 rect(x-9,y+12,18,2,"#4b3033");
}
function pothole(x,y){
 rect(x-16,y-7,32,14,"#30383b");rect(x-13,y-4,25,10,"#293038");
 rect(x-8,y-4,8,3,"#3a4348");rect(x+4,y+3,7,2,"#474d4d");
}
function coin(x,y,angle){
 let w=Math.max(4,Math.round(12*Math.abs(Math.cos(angle))));rect(x-w/2-2,y-8,w+4,16,"#9d6e2b");
 rect(x-w/2,y-7,w,14,"#ffe078");
 rect(x-w/2+1,y-5,Math.max(2,w-2),10,"#ebb538");
 if(w>=7)txt("★",x,y+3,"#fff3b1",8);
}
function drawObjects(){
 for(const o of s.objects){
  if(o.done)continue;
  let x=LANES[o.lane],y=PLAYER_Y-(o.at-s.distance);
  if(y < -35||y>H+35)continue;
  if(o.type==="coin")coin(x,y,Math.floor(s.time*10+o.at%14)*.17);
  else if(o.type==="barrel")barrel(x,y);
  else pothole(x,y);
 }
 // Finish gate.
 let fy=Math.round(PLAYER_Y-(FINISH-s.distance));
 if(fy>-25&&fy<H+20){
  for(let i=0;i<14;i++)for(let k=0;k<2;k++)rect(58+i*10,fy+k*10,10,10,(i+k)%2?"#202833":"#f3efe4");
  txt("TRAGUARDO",128,fy-7,"#fff3af",10);
 }
}
function drawRider(){
 const x=Math.round(s.x),y=PLAYER_Y-Math.round(s.z);
 // shadow remains on asphalt when jumping.
 rect(x-17,PLAYER_Y+15,34,6,"#25313e");
 if(s.immune>0&&Math.floor(s.time*12)%2===0)return;
 if(rider.complete&&rider.naturalWidth){
   c.imageSmoothingEnabled=false;c.drawImage(rider,x-23,y-49,46,74);
 }else{
   rect(x-12,y-25,24,40,"#842a43");rect(x-10,y-28,20,16,"#3168b0");
   rect(x-9,y-39,18,12,"#dfbb91");rect(x-10,y-42,20,5,"#c23943");
   rect(x-10,y-31,20,3,"#fff1dd");rect(x-10,y+12,20,11,"#972b4a");
 }
 if(s.z>0){
   rect(x-18,y+20,36,2,"#f4deb3");rect(x-10,y+23,20,1,"#f0ac70");
 }
 if(s.turboTime>0){
   rect(x-6,y+24,5,12,"#ffc05c");rect(x+2,y+24,5,14,"#fa7a38");
 }
}
function drawParticles(){
 for(let p of s.particles){c.globalAlpha=clamp((p.life-p.t)/p.life,0,1);rect(p.x,p.y,2,2,p.color);}
 c.globalAlpha=1;
}
function render(){
 drawStreet();drawObjects();drawRider();drawParticles();
 if(s.noticeTime>0){
  rect(39,265,178,19,"#13263c");txt(s.notice,128,278,"#ffe19d",9);
 }
 if(s.phase==="ready"){rect(67,394,122,21,"#22384a");txt("PRESS START",128,408,"#ffe3a0",10);}
}
function release(){input.left=false;input.right=false;document.querySelectorAll("[data-dir]").forEach(b=>b.classList.remove("down"));}
function bind(){
 window.addEventListener("keydown",e=>{
  if(["ArrowLeft","ArrowRight","ArrowUp","ArrowDown"," ","Enter","a","d","A","D","w","W"].includes(e.key))e.preventDefault();
  if(e.code==="Space"||e.key==="ArrowUp"||e.key==="w"||e.key==="W"){if(s.phase==="playing"&&!e.repeat)jump();else if(s.phase!=="playing"&&!e.repeat)start();return;}
  if(e.key==="ArrowLeft"||e.key==="a"||e.key==="A"){if(!e.repeat)steer(-1);}
  if(e.key==="ArrowRight"||e.key==="d"||e.key==="D"){if(!e.repeat)steer(1);}
  if(e.key==="Shift"||e.key==="ArrowDown"){if(!e.repeat)turbo();}
  if(e.key==="Enter"&&s.phase!=="playing")start();
  if(e.key==="p"||e.key==="P"){if(s.phase==="playing"){s.phase="paused";show("PAUSA","IN PAUSA","Riprendi la tua corsa su Corso Europa.","RIPRENDI ▶",false);}else if(s.phase==="paused")resume();}
 });
 let down=null;
 canvas.addEventListener("pointerdown",e=>{down={x:e.clientX,y:e.clientY};if(s.phase==="playing")jump();});
 canvas.addEventListener("pointerup",e=>{if(!down)return;down=null;});
 document.querySelectorAll("[data-dir]").forEach(b=>{
  b.addEventListener("pointerdown",e=>{e.preventDefault();let dir=Number(b.dataset.dir);steer(dir);b.classList.add("down");});
  for(let t of ["pointerup","pointercancel","pointerleave","lostpointercapture"])b.addEventListener(t,()=>b.classList.remove("down"));
 });
 by("jump").addEventListener("pointerdown",e=>{e.preventDefault();jump();});
 by("turbo").addEventListener("pointerdown",e=>{e.preventDefault();turbo();});
 ui.start.addEventListener("click",()=>{if(s.phase==="paused")resume();else start();});
 ui.audio.addEventListener("click",()=>{s.sound=!s.sound;ui.audio.textContent=s.sound?"♫ ON":"♫ OFF";if(s.sound)bleep(710);});
 document.addEventListener("visibilitychange",()=>{if(document.hidden&&s.phase==="playing"){s.phase="paused";show("PAUSA","IN PAUSA","La partita è stata messa in pausa.","RIPRENDI ▶",false);}});
 window.addEventListener("blur",release);
}
function resume(){s.phase="playing";s.last=0;ui.overlay.classList.add("hidden");}
function frame(t){
 let dt=s.last?clamp((t-s.last)/1000,0,.04):0;s.last=t;
 if(s.phase==="playing")update(dt);
 render();requestAnimationFrame(frame);
}
fresh();bind();requestAnimationFrame(frame);
})();