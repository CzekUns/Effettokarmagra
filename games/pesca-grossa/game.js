/* PESCA GROSSA 2.0 — input, disegno su canvas, pannelli e ciclo di gioco.
 * Le regole (pesci, combattimento, economia, giornate) stanno in rules.js. */
(function(){
"use strict";
const R=window.PESCA_RULES;
const W=800,H=760,WATER_TOP=214,TIP0={x:421,y:183},HAND={x:440,y:148};
const SAVE_KEY="biagio-pesca-carriera-v1",RECORD_KEY="biagio-pesca-record",PREFS_KEY="biagio-pesca-prefs";
const ARCADE_SECONDS=90,ARCADE_HOUR=7.2;
const ARCADE_GEAR={rod:"bolognese",reel:"frontale",line:"nylon20"};
const ARCADE_BAITS=["bigattini","pane","verme"];
const PAGE_URL="https://czekuns.github.io/Effettokarmagra/games/pesca-grossa/";
const $=id=>document.getElementById(id);
const canvas=$("lake"),ctx=canvas.getContext("2d");
const ui={hudLL:$("hud-l-label"),hudL:$("hud-l"),hudML:$("hud-m-label"),hudM:$("hud-m"),hudRL:$("hud-r-label"),hudR:$("hud-r"),
 shade:$("shade"),kicker:$("kicker"),headline:$("headline"),message:$("message"),menu:$("menu-actions"),share:$("share-score"),shareHint:$("share-hint"),
 sound:$("sound"),reel:$("reel"),left:$("side-left"),right:$("side-right"),status:$("status"),tip:$("tip"),hint:$("hint"),
 tension:$("tension-bar"),tensionNum:$("tension-num"),dragMark:$("drag-mark"),line:$("line-bar"),lineNum:$("line-num"),stamina:$("stamina-bar"),staminaNum:$("stamina-num"),
 chipBait:$("chip-bait"),baitName:$("bait-name"),baitCount:$("bait-count"),chipDrag:$("chip-drag"),dragName:$("drag-name"),chipMap:$("chip-map"),spotName:$("spot-name"),
 chipCooler:$("chip-cooler"),coolerLoad:$("cooler-load"),chipShop:$("chip-shop"),chipOrders:$("chip-orders"),ordersCount:$("orders-count"),chipDex:$("chip-dex"),dexCount:$("dex-count"),chipKarma:$("chip-karma"),karmaNum:$("karma-num"),
 modal:$("modal"),modalKicker:$("modal-kicker"),modalTitle:$("modal-title"),modalBody:$("modal-body"),modalFoot:$("modal-foot"),modalClose:$("modal-close")};
const biagio=new Image();biagio.src="../../assets/biaggio-power.svg";
const clamp=R.clamp,rnd=(a,b)=>a+Math.random()*(b-a),dist=(x,y,a,b)=>Math.hypot(x-a,y-b);
const euro=v=>(Math.round(v*100)/100).toLocaleString("it-IT",{minimumFractionDigits:v%1?2:0,maximumFractionDigits:2})+" €";
const num=v=>String(v).replace(".",",");
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));

const G={mode:"menu",phase:"menu",career:null,arcade:null,spot:"lago",weather:"sereno",wind:{x:.8,y:.6},
 fish:[],hook:{mode:"idle"},fight:null,input:{key:0,btn:0,drag:0},hold:{key:false,btn:false,canvas:false},
 aim:{x:400,y:440},aimVisible:false,frenzy:null,gulls:[],ripples:[],splashes:[],texts:[],drops:[],floaters:[],
 notice:"",noticeLife:0,elapsed:0,last:0,mute:false,actx:null,lastHour:-1,ageAcc:0,spawnAcc:0,sfxDrag:0,reelClick:0,lastMusic:-1,
 today:null,modalOpen:false,modalOnClose:null,waterCache:{},pendingDayEnd:false,best:0,shopTab:"esche"};

/* ---------- salvataggi ---------- */
function loadCareer(){try{const raw=localStorage.getItem(SAVE_KEY);return raw?R.migrateSave(JSON.parse(raw)):null;}catch(e){return null;}}
function saveCareer(){if(!G.career)return;try{localStorage.setItem(SAVE_KEY,JSON.stringify(G.career));}catch(e){}}
function loadBest(){try{G.best=Math.max(0,Number(localStorage.getItem(RECORD_KEY)||0)||0);}catch(e){}}
function saveBest(){try{localStorage.setItem(RECORD_KEY,String(G.best));}catch(e){}}
function loadPrefs(){try{const p=JSON.parse(localStorage.getItem(PREFS_KEY)||"{}");G.mute=!!p.mute;}catch(e){}}
function savePrefs(){try{localStorage.setItem(PREFS_KEY,JSON.stringify({mute:G.mute}));}catch(e){}}

/* ---------- contesto della partita ---------- */
function career(){return G.mode==="career"?G.career:null;}
function hourNow(){return G.mode==="career"&&G.career?G.career.minute/60:ARCADE_HOUR;}
function karmaNow(){const c=career();return c?c.karma:0;}
function isNight(){const h=hourNow();return h>=20.5||h<5;}
function hasExtra(id){const c=career();return !!c&&c.extras.includes(id);}
function gearNow(){
 const c=career();
 if(c)return{rod:R.gearOf(c,"rod"),reel:R.gearOf(c,"reel"),line:R.gearOf(c,"line"),drag:c.drag,guadino:c.extras.includes("guadino")};
 const g=s=>R.GEAR[s].find(x=>x.id===ARCADE_GEAR[s]);
 return{rod:g("rod"),reel:g("reel"),line:g("line"),drag:G.arcade?G.arcade.drag:"media",guadino:false};
}
function baitNow(){const c=career();return c?c.bait:G.arcade?G.arcade.bait:"bigattini";}
function baitLeft(id){const c=career();if(c)return c.baits[id]||0;return ARCADE_BAITS.includes(id)?Infinity:0;}
function rodRangePx(){return gearNow().rod.range*R.PX_PER_M;}
function sideInput(){return G.input.key||G.input.btn||G.input.drag||0;}
function reelHeld(){return G.hold.key||G.hold.btn||G.hold.canvas;}

/* ---------- audio ---------- */
function audio(){if(G.mute)return null;try{if(!G.actx){const A=window.AudioContext||window.webkitAudioContext;if(!A)return null;G.actx=new A();}if(G.actx.state==="suspended"&&G.actx.resume)G.actx.resume().catch(()=>{});return G.actx;}catch(e){return null;}}
function note(freq,length,type,volume,slide){
 const a=audio();if(!a)return;const t=a.currentTime,osc=a.createOscillator(),gain=a.createGain();
 osc.type=type||"square";osc.frequency.setValueAtTime(freq,t);if(slide)osc.frequency.exponentialRampToValueAtTime(Math.max(30,freq*slide),t+length);
 gain.gain.setValueAtTime(volume||.018,t);gain.gain.exponentialRampToValueAtTime(.0001,t+length);osc.connect(gain).connect(a.destination);osc.start(t);osc.stop(t+length+.01);
}
const sfx={
 cast(){note(470,.08,"triangle",.025,1.4);},
 plop(){note(260,.09,"sine",.03,.6);},
 nibble(){note(820,.04,"square",.016);},
 bite(){note(660,.1,"square",.04,1.5);setTimeout(()=>note(990,.12,"square",.03,1.2),70);},
 strike(){note(392,.08,"sawtooth",.035,1.8);},
 reel(){note(1500,.012,"square",.006);},
 drag(){note(170,.07,"sawtooth",.016,1.3);},
 snap(){note(180,.29,"sawtooth",.045,.4);},
 caught(big){note(big?880:660,.18,"square",.045,1.3);setTimeout(()=>note(big?1175:880,.2,"triangle",.035),140);},
 cash(){note(1320,.06,"square",.025);setTimeout(()=>note(1760,.09,"square",.022),70);},
 action(){note(520,.05,"triangle",.018,.8);},
 day(){[392,494,587,784].forEach((f,i)=>setTimeout(()=>note(f,.14,"triangle",.025),i*110));}
};
function melody(){
 const seq=[330,392,440,392,294,349,392,330,262,330,392,349,294,330,262,220];
 if(G.mute)return;const i=Math.floor(G.elapsed/.32);
 if(i!==G.lastMusic){G.lastMusic=i;if(i%2===0)note(seq[i%seq.length]*(isNight()?.75:1),.12,"triangle",G.fight?.005:.008);}
}
function buzz(ms){try{if(navigator.vibrate)navigator.vibrate(ms);}catch(e){}}

/* ---------- effetti ---------- */
function shout(msg,life){G.notice=msg;G.noticeLife=life||1.8;}
function floatText(x,y,text,color){G.texts.push({x,y,text,color:color||"#fff0b7",life:1.4});}
function ripple(x,y,color){G.ripples.push({x,y,r:4,life:1.2,color:color||"#dcf6e7"});}
function splash(x,y,size){for(let i=0;i<9;i++)G.splashes.push({x,y,vx:rnd(-70,70)*(size||1),vy:rnd(-150,-50)*(size||1),life:rnd(.35,.75),r:rnd(1.6,3.6)*(size||1)});}
function updateFx(dt){
 for(const r of G.ripples){r.r+=dt*48;r.life-=dt;}G.ripples=G.ripples.filter(r=>r.life>0);
 for(const s of G.splashes){s.x+=s.vx*dt;s.y+=s.vy*dt;s.vy+=320*dt;s.life-=dt;}G.splashes=G.splashes.filter(s=>s.life>0);
 for(const t of G.texts){t.y-=34*dt;t.life-=dt;}G.texts=G.texts.filter(t=>t.life>0);
 G.noticeLife=Math.max(0,G.noticeLife-dt);
 const wx=R.WEATHER[G.weather];
 const rain=G.weather==="pioggia"?70:G.weather==="burrasca"?140:0;
 while(G.drops.length<rain)G.drops.push({x:rnd(0,W),y:rnd(-H,0),v:rnd(520,760)});
 if(G.drops.length>rain)G.drops.length=rain;
 for(const d of G.drops){d.y+=d.v*dt;d.x+=G.wind.x*wx.wind*140*dt;if(d.y>H){d.y=rnd(-60,0);d.x=rnd(-40,W);if(Math.random()<.35)G.ripples.push({x:d.x,y:rnd(WATER_TOP,H),r:1,life:.45,color:"#d9f2ff"});}}
 if(G.fight&&G.fight.tele)G.fight.tele.life-=dt;
}

/* ---------- popolazione di pesci (ombre) ---------- */
function targetCount(){return{lago:9,porto:10,scogli:9,golfo:8}[G.spot]||9;}
function shadowSize(w){return clamp(9+15*Math.cbrt(w),9,48);}
function spawnShadow(opt){
 opt=opt||{};
 for(let tries=0;tries<16;tries++){
  const x=opt.x!=null?clamp(opt.x+rnd(-70,70),50,750):rnd(50,750);
  const y=opt.y!=null?clamp(opt.y+rnd(-50,50),WATER_TOP+30,735):rnd(WATER_TOP+30,735);
  const depth=R.depthAt(G.spot,x,y);
  let sp=null;
  if(opt.species){sp=R.SPECIES_BY_ID[opt.species];if(depth<sp.depth[0]||depth>sp.depth[1])continue;}
  else sp=R.pickSpecies({spot:G.spot,hour:hourNow(),weather:G.weather,depth,karma:karmaNow()},Math.random);
  if(!sp)continue;
  const c=career();
  const fish=R.rollFish(sp,Math.random,{pity:c?c.pity:0,karma:karmaNow(),night:isNight()});
  const dir=Math.random()<.5?-1:1,v=8+sp.speed*5;
  return{id:Math.random(),sp,fish,x,y,dir,vx:dir*rnd(v*.6,v),vy:rnd(-8,8),turn:rnd(.5,3),wiggle:rnd(0,6.3),state:"wander",scared:0,fade:opt.instant?1:0,leaving:false,wary:false,size:shadowSize(fish.weight)};
 }
 return null;
}
function populate(){G.fish=[];G.frenzy=null;G.gulls=[];for(let i=0;i<targetCount();i++){const s=spawnShadow({instant:true});if(s)G.fish.push(s);}}
function refreshPopulation(){
 for(const f of G.fish){if(f.state!=="wander")continue;if(R.speciesWeight(f.sp,{spot:G.spot,hour:hourNow(),weather:G.weather,depth:null,karma:karmaNow()})<=0)f.leaving=true;}
}
function topUpPopulation(){if(G.fish.filter(f=>!f.leaving).length<targetCount()){const s=spawnShadow();if(s)G.fish.push(s);}}
function maybeFrenzy(force){
 if(G.frenzy)return;if(!force&&Math.random()>.2)return;
 const h=hourNow();
 const list=R.SPECIES.filter(s=>(s.school||s.id==="cefalo")&&s.spots.includes(G.spot)&&R.activity(s,h)>0&&R.weatherOk(s,G.weather));
 if(!list.length)return;
 const sp=list[Math.floor(Math.random()*list.length)];
 for(let i=0;i<24;i++){
  const x=rnd(140,660),y=rnd(320,680),d=R.depthAt(G.spot,x,y);
  if(d<sp.depth[0]||d>sp.depth[1])continue;
  G.frenzy={x,y,r:90,species:sp.id,until:G.mode==="career"?G.career.minute+45:null,untilS:G.mode==="arcade"?G.arcade.seconds-14:null};
  for(let j=0;j<4;j++){const s=spawnShadow({x,y,species:sp.id});if(s)G.fish.push(s);}
  G.gulls=Array.from({length:5},(_,k)=>({a:k*1.25,r:rnd(30,72),s:rnd(.8,1.4)}));
  shout("MANGIANZA! I GABBIANI SI TUFFANO",2.2);return;
 }
}
function updateFish(dt){
 const h=G.hook;
 for(const f of G.fish){
  f.wiggle+=dt*(f.state==="interested"?9:5);f.turn-=dt;f.scared=Math.max(0,f.scared-dt);
  f.fade=f.leaving?f.fade-dt*.5:Math.min(1,f.fade+dt*.7);
  if(f.state==="interested"){
   if(h.mode!=="waiting"||h.fish!==f){f.state="wander";continue;}
   const d=Math.max(1,dist(f.x,f.y,h.x,h.y)),v=18+f.sp.speed*7;
   f.x+=(h.x-f.x)/d*v*dt;f.y+=(h.y-f.y)/d*v*dt;f.dir=h.x<f.x?-1:1;f.vx=f.dir*Math.abs(f.vx);
   if(d<16)startNibble(f);
   continue;
  }
  if(f.state==="nibbling"){
   if(h.fish!==f||(h.mode!=="nibble"&&h.mode!=="bite")){f.state="wander";continue;}
   const ang=G.elapsed*2+f.id*10,k=Math.min(1,dt*5);
   f.x+=(h.x+Math.cos(ang)*5-14*f.dir-f.x)*k;f.y+=(h.y+Math.sin(ang)*4-f.y)*k;continue;
  }
  if(f.turn<=0){f.turn=rnd(1,3.5);f.vy=rnd(-14,14);if(Math.random()<.3)f.vx=-f.vx;}
  let vx=f.vx,vy=f.vy;
  if(f.scared>0&&h.mode!=="idle"&&h.x!=null){const d=Math.max(1,dist(f.x,f.y,h.x,h.y));vx+=(f.x-h.x)/d*90;vy+=(f.y-h.y)/d*90;}
  const nx=f.x+vx*dt,ny=f.y+vy*dt,depth=R.depthAt(G.spot,nx,ny),dr=f.sp.depth;
  if(nx<45||nx>755||ny<WATER_TOP+22||ny>742||depth<dr[0]*.8||depth>dr[1]*1.2){f.vx=-f.vx;f.vy=-f.vy;}
  else{f.x=nx;f.y=ny;}
  if(f.vx)f.dir=f.vx<0?-1:1;
 }
 G.fish=G.fish.filter(f=>!(f.leaving&&f.fade<=0));
}

/* ---------- lancio, attesa, abboccata ---------- */
function cast(x,y){
 if(G.phase!=="playing"||G.modalOpen)return;
 const h=G.hook;if(h.mode==="fight"||h.mode==="casting")return;
 if(h.mode==="nibble"||h.mode==="bite"){strike();return;}
 const bait=baitNow();
 if(!(baitLeft(bait)>0)){shout("ESCA FINITA! Cambiala (B) o passa in bottega",2);return;}
 releaseInterest();
 let dx=x-TIP0.x,dy=y-TIP0.y,len=Math.hypot(dx,dy);const max=rodRangePx();
 if(len>max){dx*=max/len;dy*=max/len;len=max;}
 const w=R.WEATHER[G.weather].wind,k=len/max,jit=(5+w*12)*k;
 const tx=clamp(TIP0.x+dx+G.wind.x*w*26*k+rnd(-jit,jit),30,770),ty=clamp(TIP0.y+dy+G.wind.y*w*26*k+rnd(-jit,jit),WATER_TOP+14,745);
 G.hook={mode:"casting",x:TIP0.x,y:TIP0.y,fromX:TIP0.x,fromY:TIP0.y,destX:tx,destY:ty,t:0,arc:0,bait,artificial:R.BAITS[bait].kind==="artificiale",empty:false,fish:null,junk:null};
 G.aim={x:clamp(x,30,770),y:clamp(y,WATER_TOP+14,745)};
 const c=career();if(c)c.stats.casts++;
 sfx.cast();
}
function autoCast(){
 const max=rodRangePx();
 const options=G.fish.filter(f=>!f.leaving&&f.state==="wander"&&dist(f.x,f.y,TIP0.x,TIP0.y)<=max).sort((a,b)=>dist(a.x,a.y,TIP0.x,TIP0.y)-dist(b.x,b.y,TIP0.x,TIP0.y));
 const t=options[0];if(t)cast(t.x+t.vx*.6,t.y);else cast(G.aim.x,G.aim.y);
}
function releaseInterest(){for(const f of G.fish)if(f.state!=="wander")f.state="wander";}
function retrieve(msg){releaseInterest();G.hook={mode:"idle"};if(msg)shout(msg,1.1);}
function useBait(id){const c=career();if(!c||!id||!R.BAITS[id]||R.BAITS[id].kind!=="naturale")return;c.baits[id]=Math.max(0,(c.baits[id]||0)-1);}
function loseLure(id){const c=career();if(!c||!id||!R.BAITS[id]||R.BAITS[id].kind!=="artificiale")return;c.baits[id]=Math.max(0,(c.baits[id]||0)-1);floatText(TIP0.x,TIP0.y+60,"−1 "+R.BAITS[id].name,"#ffb0a0");}
function startNibble(f){const h=G.hook;h.mode="nibble";h.fish=f;f.state="nibbling";h.nibbles=h.artificial?0:R.nibbleCount(f.sp,Math.random);h.nibbleT=h.artificial?.05:rnd(.45,.95);h.dip=0;}
function fleeHooked(t){const h=G.hook;if(h.fish){h.fish.state="wander";h.fish.scared=t;}h.fish=null;}
function updateHook(dt){
 const h=G.hook;
 if(h.mode==="casting"){
  h.t+=dt/.55;const p=Math.min(1,h.t),e=1-Math.pow(1-p,2);
  h.x=h.fromX+(h.destX-h.fromX)*e;h.y=h.fromY+(h.destY-h.fromY)*e;h.arc=Math.sin(p*Math.PI)*60;
  if(p>=1){h.mode="waiting";h.wait=0;h.arc=0;h.depth=R.depthAt(G.spot,h.x,h.y);ripple(h.x,h.y);splash(h.x,h.y,.45);sfx.plop();}
  return;
 }
 if(h.mode==="waiting"){
  h.wait+=dt;h.moving=false;
  if(h.artificial&&reelHeld()){
   const d=Math.max(1,dist(h.x,h.y,TIP0.x,TIP0.y)),v=50;
   h.x+=(TIP0.x-h.x)/d*v*dt+Math.sin(G.elapsed*9)*14*dt;h.y+=(TIP0.y-h.y)/d*v*dt;h.moving=true;h.depth=R.depthAt(G.spot,h.x,h.y);
   if(G.elapsed-(h.reelT||0)>.12){h.reelT=G.elapsed;sfx.reel();}
   if(h.y<WATER_TOP+16||d<62){retrieve("ESCA RECUPERATA: RILANCIA");return;}
  }
  if(h.empty)return;
  // a volte si aggancia un rifiuto (o un tesoro) senza nessuna ombra
  if(Math.random()<R.SPOTS[G.spot].junk*.05*dt*(h.artificial?.5:1)){
   const item=R.rollJunk(G.spot,h.depth,Math.random);
   if(item){releaseInterest();h.mode="bite";h.fish=null;h.junk=item;h.biteT=0;h.window=1.3;h.dip=1;sfx.bite();buzz(60);ripple(h.x,h.y,"#f4e2a0");return;}
  }
  if(!h.fish){
   const radius=115*R.BAITS[h.bait].scent,inFrenzy=G.frenzy&&dist(h.x,h.y,G.frenzy.x,G.frenzy.y)<G.frenzy.r;
   for(const f of G.fish){
    if(f.leaving||f.state!=="wander"||f.scared>0||f.fade<.6)continue;
    if(dist(f.x,f.y,h.x,h.y)>radius)continue;
    if(h.depth<f.sp.depth[0]*.8||h.depth>f.sp.depth[1]*1.2)continue;
    let rate=R.interestRate(f.sp,{bait:h.bait,hour:hourNow(),weather:G.weather,moving:h.moving,frenzy:!!inFrenzy&&G.frenzy.species===f.sp.id});
    if(f.wary)rate*=.3;
    if(Math.random()<rate*dt){f.state="interested";h.fish=f;break;}
   }
  }
  return;
 }
 if(h.mode==="nibble"){
  h.nibbleT-=dt;h.dip=Math.max(0,(h.dip||0)-dt*3);
  if(h.nibbleT>0)return;
  if(h.nibbles>0){
   h.nibbles--;h.nibbleT=rnd(.45,1.1);h.dip=.6;sfx.nibble();ripple(h.x,h.y,"#cfe9ff");
   const thief=h.fish.sp.thief;
   if(thief&&!h.artificial&&Math.random()<thief){useBait(h.bait);h.empty=true;fleeHooked(1.5);h.mode="waiting";shout("TI HANNO SPOLPATO L'AMO! Ritira e rilancia",1.8);}
  }else{h.mode="bite";h.biteT=0;h.window=R.biteWindow(h.fish.sp);h.dip=1;sfx.bite();buzz(80);ripple(h.x,h.y,"#ffe9a8");splash(h.x,h.y,.4);}
  return;
 }
 if(h.mode==="bite"){
  h.biteT+=dt;
  if(h.biteT<=h.window)return;
  if(h.junk){h.mode="waiting";h.junk=null;shout("ERA SOLO UN PESO SUL FONDO",1.2);return;}
  if(!h.artificial){useBait(h.bait);h.empty=true;shout("TI HA MANGIATO L'ESCA!",1.6);}
  else shout("HA SPUTATO L'ESCA!",1.4);
  fleeHooked(2.5);h.mode="waiting";
 }
}
function strike(){
 const h=G.hook;
 if(h.mode==="bite"){beginFight(h.biteT<=h.window*.35);return;}
 if(h.mode==="nibble"){
  shout("TROPPO PRESTO! Il pesce si è spaventato",1.6);sfx.strike();
  if(!h.artificial&&Math.random()<.5){useBait(h.bait);h.empty=true;}
  fleeHooked(3);h.mode="waiting";
 }
}

/* ---------- combattimento ---------- */
function beginFight(perfect){
 const h=G.hook;
 const item=h.junk?{species:h.junk.id,len:0,weight:h.junk.weight,karmagra:false}:h.fish.fish;
 const meters=dist(h.x,h.y,TIP0.x,TIP0.y)/R.PX_PER_M+Math.min(h.depth||1,40)*.35;
 const structure=!h.junk&&R.structureNear(G.spot,h.x,h.y,45);
 const f=R.createFight(item,gearNow(),{distance:meters,perfect,structure,rand:Math.random});
 f.baseAngle=Math.atan2(h.y-TIP0.y,h.x-TIP0.x);f.shadow=h.fish||null;f.junk=h.junk||null;f.bait=h.bait;
 f.screenX=h.x;f.screenY=h.y;f.pxPerM=Math.max(4,dist(h.x,h.y,TIP0.x,TIP0.y)/f.dist);
 if(h.fish){const i=G.fish.indexOf(h.fish);if(i>=0)G.fish.splice(i,1);}
 G.fight=f;h.mode="fight";
 shout(h.junk?"HAI AGGANCIATO QUALCOSA...":perfect?"FERRATA PERFETTA!":"FERRATO!",1.2);
 sfx.strike();buzz(40);splash(h.x,h.y,.8);telegraph(f.action);
}
function telegraph(a,last){const f=G.fight;if(!f)return;f.tele={label:last?"ULTIMA FUGA!":R.ACTIONS[a.type].label,type:a.type,dir:a.dir,life:1.4};if(a.type!=="riposo")sfx.action();}
function updateFight(dt){
 const f=G.fight;
 const ev=R.stepFight(f,{reel:reelHeld(),side:sideInput()},dt,Math.random);
 const ang=f.baseAngle+f.lateral*.55,r=clamp(f.dist*f.pxPerM,18,640);
 f.screenX=clamp(TIP0.x+Math.cos(ang)*r,24,776);f.screenY=clamp(TIP0.y+Math.sin(ang)*r,WATER_TOP+10,750);
 if(reelHeld()&&G.elapsed-G.reelClick>.09){G.reelClick=G.elapsed;sfx.reel();}
 for(const e of ev){
  if(e.kind==="action"){telegraph(f.action,e.last);if(f.action.type==="salto")splash(f.screenX,f.screenY,1.2);}
  else if(e.kind==="drag"){if(G.elapsed-G.sfxDrag>.12){G.sfxDrag=G.elapsed;sfx.drag();}}
  else if(e.kind==="caught"){onCaught();return;}
  else if(e.kind==="lost"){onLost(e.reason,e.message);return;}
 }
 if(f.action.type==="salto"&&Math.random()<dt*6)splash(f.screenX,f.screenY,.6);
 if(f.action.type==="fuga"&&Math.random()<dt*4)ripple(f.screenX,f.screenY,"#cfe9ff");
}
function onCaught(){
 const f=G.fight,c=career(),sp=R.SPECIES_BY_ID[f.fish.species];
 const item={species:f.fish.species,len:f.fish.len,weight:f.fish.weight,karmagra:!!f.fish.karmagra,quality:f.junk?1:R.fightQuality(f),freshness:100,day:c?c.day:0};
 if(sp)useBait(f.bait);
 G.fight=null;G.hook={mode:"idle"};
 sfx.caught(!!sp&&(sp.rarity==="epico"||sp.rarity==="leggendario"));ripple(TIP0.x,TIP0.y+30,"#ffec96");
 if(G.mode==="arcade"){arcadeCatch(item);return;}
 c.stats.catches++;G.today.catches++;
 if(sp)c.pity=item.karmagra?0:Math.min(.25,(c.pity||0)+.004);
 showCatch(item);
}
function onLost(reason,msg){
 const f=G.fight,c=career();
 shout(msg,2.2);sfx.snap();buzz(120);ripple(f.screenX,f.screenY,"#f9a5a2");
 if(R.BAITS[f.bait]&&R.BAITS[f.bait].kind==="artificiale"){if(reason==="snap"||reason==="den"||reason==="spool")loseLure(f.bait);}
 else if(!f.junk)useBait(f.bait);
 if(f.shadow){const s=f.shadow;s.x=clamp(f.screenX,50,750);s.y=clamp(f.screenY,WATER_TOP+30,735);s.state="wander";s.scared=4;s.wary=true;s.fade=1;G.fish.push(s);}
 G.fight=null;G.hook={mode:"idle"};
 if(G.mode==="arcade")G.arcade.combo=0;
 if(c){c.stats.lost++;G.today.lost++;saveCareer();}
}

/* ---------- sfida a tempo ---------- */
function arcadeCatch(item){
 const a=G.arcade,sp=R.SPECIES_BY_ID[item.species];
 if(sp)a.combo++;
 const pts=R.arcadePoints(item,sp?a.combo-1:0);a.score+=pts;a.catches++;
 if(a.score>G.best){G.best=a.score;saveBest();}
 const name=sp?sp.name:R.ITEMS_BY_ID[item.species].name;
 shout((item.karmagra?"KARMAGRA! ":"")+name.toUpperCase()+(sp?" "+R.fmtKg(item.weight):"")+" +"+pts,1.9);
 floatText(TIP0.x,TIP0.y+40,"+"+pts);
 if(sp)topUpPopulation();
}
function startArcade(){
 G.mode="arcade";G.career=null;G.arcade={score:0,seconds:ARCADE_SECONDS,combo:0,catches:0,bait:"bigattini",drag:"media",frenzyT:rnd(14,22)};
 G.spot="lago";G.weather="sereno";newWind();populate();G.hook={mode:"idle"};G.fight=null;resetHolds();
 hideShade();G.phase="playing";audio();
 shout("90 SECONDI: VIA!",1.4);
}
function finishArcade(){
 G.phase="ended";G.fight=null;G.hook={mode:"idle"};resetHolds();releaseInterest();
 if(G.arcade.score>G.best){G.best=G.arcade.score;}saveBest();
 note(294,.22,"triangle",.036);
 showShade("TEMPO SCADUTO","FINE DELLA PESCA","Hai fatto "+G.arcade.score+" punti con "+G.arcade.catches+" catture. Il tuo record è "+G.best+". Pronto a tornare sul lago?",
  [{label:"PESCA ANCORA ↻",onClick:startArcade},{label:"MENU",alt:true,onClick:showMenu}],G.arcade.score);
}

/* ---------- carriera: tempo e giornate ---------- */
function newWind(){const a=Math.random()*Math.PI*2;G.wind={x:Math.cos(a),y:Math.sin(a)*.6};}
function newToday(){G.today={catches:0,lost:0,orders:0,startMoney:G.career.money};}
function startCareer(fresh){
 let c=fresh?null:loadCareer();
 if(!c)c=R.newCareer(Date.now());
 G.career=c;G.mode="career";G.arcade=null;G.spot=c.spot;G.weather=c.weather;newWind();newToday();
 populate();G.hook={mode:"idle"};G.fight=null;G.lastHour=Math.floor(c.minute/60);G.pendingDayEnd=false;resetHolds();
 hideShade();G.phase="playing";audio();saveCareer();
 if(c.minute<=R.DAY_START+1)showMorning();
 else shout("BENTORNATO! GIORNO "+c.day+", ORE "+R.fmtClock(c.minute),2);
}
function afterTime(mins){
 const c=G.career;G.ageAcc+=mins;
 if(G.ageAcc>=5){R.ageCooler(c,G.ageAcc);G.ageAcc=0;}
 const hr=Math.floor(c.minute/60);
 if(hr!==G.lastHour){G.lastHour=hr;refreshPopulation();maybeFrenzy(false);saveCareer();if(c.minute<R.dayEnd(c)&&R.dayEnd(c)-c.minute<=60)shout("MANCA UN'ORA ALLA FINE DELLA GIORNATA",1.8);}
 if(G.frenzy&&G.frenzy.until!=null&&c.minute>G.frenzy.until){G.frenzy=null;G.gulls=[];}
}
function spendTime(m){const c=career();if(!c)return;c.minute=Math.min(R.NIGHT_END,c.minute+m);afterTime(m);if(c.minute>=R.dayEnd(c))G.pendingDayEnd=true;}
function updateClock(dt){
 const c=G.career,before=c.minute;
 c.minute=Math.min(R.NIGHT_END,c.minute+dt*R.GAME_MIN_PER_SEC);afterTime(c.minute-before);
 if(c.minute>=R.dayEnd(c))G.pendingDayEnd=true;
 if(G.pendingDayEnd&&!G.fight)endOfDay();
}
function endOfDay(){
 const c=G.career;G.pendingDayEnd=false;releaseInterest();G.hook={mode:"idle"};resetHolds();
 const soldBefore=c.money;
 const report=R.endDay(c,Math.random);
 sfx.day();
 const gained=c.money-G.today.startMoney;
 let html='<div class="summary">'+
  "<span>Pesci presi oggi</span><span>"+G.today.catches+"</span>"+
  "<span>Pesci persi</span><span>"+G.today.lost+"</span>"+
  "<span>Venduti alla pescheria</span><span>"+report.soldCount+" · "+euro(report.sold)+"</span>"+
  "<span>Commissioni consegnate</span><span>"+G.today.orders+"</span>"+
  (report.inspected?"<span>Multa Guardia Costiera ("+report.fined+" sotto misura)</span><span>−"+euro(report.fine)+"</span>":"")+
  "<span>Bilancio della giornata</span><span>"+(gained>=0?"+":"")+euro(gained)+"</span>"+
  "<span>In tasca</span><span>"+euro(c.money)+"</span></div>";
 if(report.inspected)html+="<p>🚓 Controllo della Guardia Costiera al rientro: il pescato sotto misura è stato sequestrato. La prossima volta rimettilo in acqua!</p>";
 else if(soldBefore!==c.money&&report.soldCount)html+="<p>Cugino Ciro ha pesato tutto al banco della pescheria e ti ha pagato in contanti.</p>";
 const fc=R.WEATHER[c.forecast];
 html+='<p>Previsioni per domani: <b>'+fc.icon+" "+fc.label+"</b>.</p><p>Titolo: <b>"+esc(R.titleOf(c))+"</b> · Pescepedia "+R.dexCount(c)+"/"+R.SPECIES.length+"</p>";
 openModal({kicker:"GIORNO "+c.day+" · "+R.fmtClock(c.minute),title:"Fine della giornata",body:html,closable:false,
  actions:[{label:"DORMI E SALVA ▶",onClick:()=>{R.startDay(c,Math.random);G.weather=c.weather;G.spot=c.spot;newWind();newToday();populate();G.lastHour=Math.floor(c.minute/60);saveCareer();showMorning();}}]});
 saveCareer();
}
function showMorning(){
 const c=G.career,w=R.WEATHER[c.weather],fc=R.WEATHER[c.forecast];
 let html='<div class="weather-line"><div><small>OGGI</small><b>'+w.icon+"</b>"+w.label+'</div><div><small>DOMANI</small><b>'+fc.icon+"</b>"+fc.label+"</div></div>";
 html+="<p>Sei a <b>"+esc(R.SPOTS[G.spot].name)+"</b>. "+esc(R.SPOTS[G.spot].blurb)+"</p>";
 if(c.weather==="burrasca")html+="<p>⛈️ Burrasca: il gozzo resta in porto. Sugli scogli però gira voce di un sarago enorme...</p>";
 const open=c.orders.filter(o=>!o.done);
 if(open.length)html+="<p>📜 Hai <b>"+open.length+"</b> commissioni aperte.</p>";
 if(c.day===1)html+='<div class="legend" style="font-style:normal">'+
  "<b>Come si pesca</b><br>1. Tocca l'acqua per lanciare (o premi LANCIA).<br>2. Il galleggiante trema: aspetta. Quando va <b>sotto</b>, FERRA subito.<br>"+
  "3. Tieni premuto RECUPERA, ma molla quando la tensione va sul rosso.<br>4. Il pesce tira a destra? Piega la canna a <b>sinistra</b> (◀ ▶ o scorri il dito): si stanca prima.<br>"+
  "5. SALTO: non recuperare. STANCO: recupera. TANA: tieni la lenza tesa.<br>6. Ogni pesce ha orari, esche e profondità preferite: scoprili nella Pescepedia.</div>";
 openModal({kicker:"GIORNO "+c.day+" · "+R.fmtClock(c.minute),title:"Buongiorno, Biagio!",body:html,closable:false,
  actions:[{label:"🛒 Bottega",alt:true,onClick:()=>openShop(true,showMorning)},{label:"🗺 Mappa",alt:true,onClick:()=>openMap(showMorning)},{label:"SI PESCA ▶",onClick:()=>{refreshUI();}}]});
}

/* ---------- pannelli ---------- */
function openModal(o){
 G.modalOpen=true;resetHolds();
 ui.modalKicker.textContent=o.kicker||"";ui.modalTitle.textContent=o.title||"";
 ui.modalBody.innerHTML="";ui.modalBody.onclick=null;
 if(typeof o.body==="string")ui.modalBody.innerHTML=o.body;else if(o.body)ui.modalBody.appendChild(o.body);
 if(o.onBodyClick)ui.modalBody.onclick=o.onBodyClick;
 ui.modalFoot.innerHTML="";
 for(const a of o.actions||[]){
  const b=document.createElement("button");b.type="button";b.className="btn"+(a.alt?" alt":"")+(a.ghost?" ghost":"");b.textContent=a.label;b.disabled=!!a.disabled;
  b.addEventListener("click",()=>{closeModal(true);if(a.onClick)a.onClick();});ui.modalFoot.appendChild(b);
 }
 ui.modalFoot.hidden=!(o.actions&&o.actions.length);
 ui.modalClose.hidden=o.closable===false;
 G.modalOnClose=o.onClose||null;
 ui.modal.hidden=false;ui.modalBody.scrollTop=0;
 if(o.afterOpen)o.afterOpen(ui.modalBody);
 const first=ui.modalFoot.querySelector("button:not(:disabled)")||ui.modalClose;try{first.focus({preventScroll:true});}catch(e){}
}
function closeModal(fromAction){
 ui.modal.hidden=true;G.modalOpen=false;G.last=0;
 const cb=G.modalOnClose;G.modalOnClose=null;if(!fromAction&&cb)cb();
}
ui.modalClose.addEventListener("click",()=>closeModal(false));
ui.modal.addEventListener("click",ev=>{if(ev.target===ui.modal&&!ui.modalClose.hidden)closeModal(false);});

function badgeRarity(sp){return '<span class="badge r-'+sp.rarity+'">'+R.RARITY[sp.rarity].label.toUpperCase()+"</span>";}
function stars(q){return '<span class="stars">'+"★".repeat(q)+"☆".repeat(3-q)+"</span>";}
function releaseKarma(sp,item){let k={comune:1,noncomune:1,raro:2,epico:4,leggendario:8}[sp.rarity]||1;if(R.isUndersize(sp,item))k+=1;if(sp.protected)k+=2;if(sp.id==="pesce_oro")k+=4;return k;}

function showCatch(item){
 const c=G.career,sp=R.SPECIES_BY_ID[item.species];
 if(!sp){showFound(item);return;}
 const rec=R.recordCatch(c,item),value=R.fishValue(item),under=R.isUndersize(sp,item),space=R.coolerSpace(c),karma=releaseKarma(sp,item);
 let tags="";
 if(rec.isNew)tags+='<span class="badge good">NUOVA SPECIE</span>';
 if(rec.record)tags+='<span class="badge good">NUOVO RECORD</span>';
 if(item.karmagra)tags+='<span class="badge kg">VARIANTE KARMAGRA ×3</span>';
 if(sp.protected)tags+='<span class="badge bad">SPECIE PROTETTA</span>';
 if(under)tags+='<span class="badge bad">SOTTO MISURA (min '+sp.min+" cm)</span>";
 const body=document.createElement("div");
 const art=document.createElement("canvas");art.width=520;art.height=230;art.className="catch-art";drawArt(art,sp,{karmagra:item.karmagra});
 body.appendChild(art);
 const info=document.createElement("div");
 info.innerHTML='<p class="big-line"><b>'+R.fmtKg(item.weight)+"</b> · "+item.len.toFixed(0)+" cm · "+stars(item.quality)+"</p>"+
  '<p style="text-align:center">'+badgeRarity(sp)+tags+"</p>"+
  (sp.protected?"<p>Si fotografa e si rimette in acqua: niente vendita, ma tanto karma.</p>":"<p>Valore alla pescheria: <b>"+euro(value)+"</b>"+(item.quality>1?" (qualità "+stars(item.quality)+")":"")+"</p>")+
  (under?"<p>⚠️ È sotto la misura minima. Se lo tieni rischi la multa della Guardia Costiera e la pescheria non lo compra.</p>":"")+
  (!sp.protected&&space<item.weight?"<p>🧊 La ghiacciaia è piena ("+R.fmtKg(R.coolerLoad(c))+"): vendi il pescato o rilascia.</p>":"")+
  '<p class="note">'+esc(sp.note)+"</p>";
 body.appendChild(info);
 const keep=()=>{c.cooler.push(item);saveCareer();refreshUI();};
 const release=()=>{c.karma+=karma;c.stats.released++;floatText(TIP0.x,TIP0.y+50,"+"+karma+" karma","#c9b6ff");ripple(TIP0.x,TIP0.y+40,"#c9b6ff");saveCareer();refreshUI();};
 const actions=sp.protected?[{label:"RILASCIA (+"+karma+" karma)",onClick:release}]:
  [{label:"TIENI IN GHIACCIAIA",disabled:space<item.weight,onClick:keep},{label:"RILASCIA (+"+karma+" karma)",alt:true,onClick:release}];
 if(!sp.protected&&space<item.weight)actions.push({label:"VENDI TUTTO E TIENI (+30 min)",ghost:true,onClick:()=>{const s=R.sellCooler(c);sfx.cash();spendTime(30);c.cooler.push(item);saveCareer();shout("PESCHERIA: +"+euro(s.total),1.8);}});
 openModal({kicker:rec.isNew?"NUOVA SPECIE IN PESCEPEDIA!":rec.record?"NUOVO RECORD PERSONALE!":"PESCE PRESO!",title:(item.karmagra?"✦ ":"")+sp.name,body,closable:false,actions});
 saveCareer();
}
function showFound(item){
 const c=G.career,def=R.ITEMS_BY_ID[item.species];
 c.collection[def.id]=(c.collection[def.id]||0)+1;
 let html="";
 if(def.kind==="rifiuto"){c.karma+=def.karma;html="<p>Lo porti al bidone della differenziata. Il lago ringrazia: <b>+"+def.karma+" karma</b>.</p>";}
 else{
  c.money=Math.round((c.money+def.value)*100)/100;c.stats.earned+=def.value;sfx.cash();
  html="<p>Il rigattiere di Pozzuoli te lo compra subito: <b>+"+euro(def.value)+"</b>.</p>";
  if(def.id==="bottiglia"){
   const legends=R.SPECIES.filter(s=>s.legend&&!c.legendHints.includes(s.id)&&!(c.dex[s.id]&&c.dex[s.id].count));
   if(legends.length){const s=legends[Math.floor(Math.random()*legends.length)];c.legendHints.push(s.id);html+='<p>Dentro c\'è un foglietto arrotolato:</p><div class="legend">'+esc(s.legend)+"</div><p>La leggenda è stata annotata nella Pescepedia.</p>";}
   else html+="<p>Dentro c'è solo un biglietto: «Saluti da Ischia».</p>";
  }
  if(def.id==="anfora")html+="<p>Viene dalla città romana sommersa di Baia. Il Prof. Vincenzo sarebbe orgoglioso.</p>";
 }
 openModal({kicker:def.kind==="rifiuto"?"RIFIUTO RECUPERATO":"TESORO!",title:def.name,body:html,closable:false,actions:[{label:"CONTINUA",onClick:()=>refreshUI()}]});
 saveCareer();
}

function openShop(free,back){
 const c=career();if(!c)return;
 if(!free){spendTime(20);}
 const tabs=[["esche","Esche"],["rod","Canne"],["reel","Mulinelli"],["line","Lenze"],["cooler","Ghiacciaie"],["extra","Extra e luoghi"]];
 const render=()=>{
  let html='<p>In tasca: <b>'+euro(c.money)+"</b> · Fama "+"★".repeat(R.repLevel(c.rep))+"☆".repeat(4-R.repLevel(c.rep))+" ("+c.rep+" punti)</p>";
  html+='<div class="tabs">'+tabs.map(t=>'<button type="button" data-tab="'+t[0]+'" class="'+(G.shopTab===t[0]?"on":"")+'">'+t[1]+"</button>").join("")+"</div>";
  const row=(id,name,desc,meta,btn)=>'<div class="row"><div class="info"><strong>'+esc(name)+"</strong><div class=\"meta\">"+desc+(meta?"<br>"+meta:"")+'</div></div><div class="side-actions">'+btn+"</div></div>";
  const buyBtn=(id,price)=>{const can=R.canBuy(c,id);return'<button type="button" class="btn small" data-buy="'+id+'" '+(can.ok?"":"disabled")+">"+(can.ok?"COMPRA "+euro(price):esc(can.why))+"</button>";};
  if(G.shopTab==="esche"){
   for(const id of R.BAIT_ORDER){const b=R.BAITS[id];
    html+=row(id,b.name+(b.kind==="artificiale"?" (artificiale)":" ×"+b.pack),esc(b.hint)+(b.kind==="artificiale"?" Si usa tenendo premuto RECUPERA; si perde solo se la lenza si rompe.":""),"Ne hai: <b>"+(c.baits[id]||0)+"</b>",buyBtn(id,b.price));}
  }else if(G.shopTab==="extra"){
   for(const id of Object.keys(R.EXTRAS)){const e=R.EXTRAS[id];const owned=c.extras.includes(id);
    html+=row(id,e.name,esc(e.desc),e.rep?"Serve fama "+e.rep:"",owned?'<button type="button" class="btn small" disabled>CE L\'HAI</button>':buyBtn(id,e.price));}
  }else{
   const slot=G.shopTab;
   for(const g of R.GEAR[slot]){
    const owned=c.owned[slot].includes(g.id),inUse=c.equip[slot]===g.id;
    let meta=slot==="rod"?"Gittata "+g.range+" m · rigidità "+g.flex:slot==="reel"?"Recupero "+String(g.speed).replace(".",",")+" m/s":slot==="line"?"Carico "+g.limit+" kg · bobina "+g.spool+" m":"Capienza "+g.capacity+" kg · freschezza −"+String(g.decay).replace(".",",")+"%/ora";
    if(g.rep)meta+=" · serve fama "+g.rep;
    const btn=inUse?'<button type="button" class="btn small" disabled>IN USO</button>':owned?'<button type="button" class="btn small alt" data-equip="'+slot+":"+g.id+'">USA</button>':buyBtn(g.id,g.price);
    html+=row(g.id,g.name,esc(g.desc),meta,btn);
   }
  }
  ui.modalBody.innerHTML=html;
 };
 openModal({kicker:"BOTTEGA DI ZI' PEPPE"+(free?"":" · +20 MIN"),title:"Bottega",body:"",onClose:back||null,
  onBodyClick:ev=>{
   const t=ev.target.closest("button");if(!t)return;
   if(t.dataset.tab){G.shopTab=t.dataset.tab;render();return;}
   if(t.dataset.buy){const r=R.buy(c,t.dataset.buy);if(r.ok){sfx.cash();saveCareer();if(R.EXTRAS[t.dataset.buy]&&R.EXTRAS[t.dataset.buy].unlocks)shout("NUOVO LUOGO: "+R.SPOTS[R.EXTRAS[t.dataset.buy].unlocks].name.toUpperCase(),2);}render();refreshUI();return;}
   if(t.dataset.equip){const [slot,id]=t.dataset.equip.split(":");c.equip[slot]=id;saveCareer();render();refreshUI();}
  }});
 render();
}
function openMap(back){
 const c=career();if(!c)return;
 const render=()=>{
  let html="<p>Spostarsi costa tempo. Ogni luogo ha pesci, profondità e orari diversi.</p>";
  for(const id of R.SPOT_ORDER){
   const s=R.SPOTS[id],open=R.spotUnlocked(c,id),here=G.spot===id,storm=id==="golfo"&&c.weather==="burrasca";
   const need=s.unlock?R.EXTRAS[s.unlock]:null;
   const species=R.SPECIES.filter(sp=>sp.spots.includes(id));
   const known=species.filter(sp=>c.dex[sp.id]&&c.dex[sp.id].count).length;
   let btn=here?'<button type="button" class="btn small" disabled>SEI QUI</button>':!open?'<button type="button" class="btn small" disabled>'+esc("Serve: "+need.name)+"</button>":storm?'<button type="button" class="btn small" disabled>MARE IN BURRASCA</button>':'<button type="button" class="btn small" data-go="'+id+'">VAI (+'+s.travel+" min)</button>";
   html+='<div class="row'+(open?"":" locked")+(here?" current":"")+'"><div class="info"><strong>'+esc(s.name)+'</strong><div class="meta">'+esc(s.blurb)+"<br>Fondale "+num(s.depth[0])+"–"+num(s.depth[1])+" m · specie scoperte "+known+"/"+species.length+"</div></div><div class=\"side-actions\">"+btn+"</div></div>";
  }
  ui.modalBody.innerHTML=html;
 };
 openModal({kicker:"GIORNO "+c.day+" · "+R.fmtClock(c.minute),title:"Mappa del Golfo",body:"",onClose:back||null,
  onBodyClick:ev=>{const t=ev.target.closest("button[data-go]");if(!t)return;travel(t.dataset.go);closeModal(true);if(back)back();}});
 render();
}
function travel(id){
 const c=career();if(!c||!R.spotUnlocked(c,id))return;
 releaseInterest();G.hook={mode:"idle"};G.fight=null;
 c.spot=id;G.spot=id;spendTime(R.SPOTS[id].travel);populate();saveCareer();
 shout(R.SPOTS[id].name.toUpperCase(),1.8);
}
function openCooler(){
 const c=career();if(!c)return;
 const render=()=>{
  const g=R.gearOf(c,"cooler");
  let html="<p>"+esc(g.name)+": <b>"+R.fmtKg(R.coolerLoad(c))+"</b> su "+g.capacity+" kg. Il pesce perde freschezza (−"+String(g.decay).replace(".",",")+"% all'ora) e vale meno. A fine giornata Cugino Ciro compra tutto quello che è in regola.</p>";
  if(!c.cooler.length)html+="<p><i>La ghiacciaia è vuota.</i></p>";
  let total=0;
  c.cooler.forEach((it,i)=>{
   const sp=R.SPECIES_BY_ID[it.species];if(!sp)return;const v=R.fishValue(it),under=R.isUndersize(sp,it);if(!under)total+=v;
   html+='<div class="row"><div class="info"><strong>'+(it.karmagra?"✦ ":"")+esc(sp.name)+"</strong> "+stars(it.quality||1)+'<div class="meta">'+R.fmtKg(it.weight)+" · "+it.len.toFixed(0)+" cm · freschezza "+Math.round(it.freshness)+"%"+(under?' <span class="badge bad">SOTTO MISURA</span>':"")+"</div></div><div class=\"side-actions\"><b>"+(under?"—":euro(v))+"</b>"+(under?'<button type="button" class="btn small alt" data-free="'+i+'">RILASCIA</button>':"")+"</div></div>";
  });
  html+="<p>Valore in regola: <b>"+euro(total)+"</b></p>";
  ui.modalBody.innerHTML=html;
 };
 openModal({kicker:"PESCATO DI OGGI",title:"Ghiacciaia",body:"",
  onBodyClick:ev=>{const t=ev.target.closest("button[data-free]");if(!t)return;c.cooler.splice(Number(t.dataset.free),1);c.karma+=1;saveCareer();render();refreshUI();},
  actions:[{label:"VENDI ORA (+30 min)",disabled:!c.cooler.some(it=>R.SPECIES_BY_ID[it.species]&&!R.isUndersize(R.SPECIES_BY_ID[it.species],it)),onClick:()=>{const s=R.sellCooler(c);sfx.cash();spendTime(30);saveCareer();shout("PESCHERIA: "+s.count+" PESCI, +"+euro(s.total),2);}},{label:"CHIUDI",ghost:true}]});
 render();
}
function openOrders(){
 const c=career();if(!c)return;
 const render=()=>{
  let html="<p>Consegnare costa 20 minuti. Servono pesci in regola, freschi almeno al 50%. Ogni consegna dà soldi e <b>fama</b>, che sblocca l'attrezzatura migliore.</p>";
  const list=c.orders.slice().sort((a,b)=>a.done-b.done);
  if(!list.length)html+="<p><i>Nessuna commissione: tornano domattina.</i></p>";
  for(const o of list){
   const npc=R.NPCS.find(n=>n.id===o.npc)||R.NPCS[0],sp=R.SPECIES_BY_ID[o.species];
   const ready=c.cooler.filter(i=>R.orderMatches(o,i)).length;
   const exp=o.expires===c.day?"scade stasera":"scade domani";
   const btn=o.done?'<button type="button" class="btn small" disabled>FATTA ✓</button>':'<button type="button" class="btn small" data-deliver="'+o.id+'" '+(ready>=o.count?"":"disabled")+">CONSEGNA "+Math.min(ready,o.count)+"/"+o.count+"</button>";
   html+='<div class="row'+(o.done?" locked":"")+'"><div class="info"><strong>'+esc(npc.name)+": "+o.count+" × "+esc(sp.name)+'</strong><div class="meta">«'+esc(npc.line)+"»<br>Almeno "+R.fmtKg(o.minWeight)+" ciascuno · "+euro(o.reward)+" · fama +"+o.rep+" · "+exp+"</div></div><div class=\"side-actions\">"+btn+"</div></div>";
  }
  ui.modalBody.innerHTML=html;
 };
 openModal({kicker:"BACHECA DEL PONTILE",title:"Commissioni",body:"",
  onBodyClick:ev=>{const t=ev.target.closest("button[data-deliver]");if(!t)return;const r=R.deliverOrder(c,t.dataset.deliver);if(r.ok){sfx.cash();spendTime(20);G.today.orders++;saveCareer();shout("CONSEGNATO: +"+euro(r.reward)+" · FAMA +"+r.rep,2);}render();refreshUI();}});
 render();
}
function openDex(){
 const c=career();if(!c)return;
 const body=document.createElement("div");
 const n=R.dexCount(c),legends=R.legendsCaught(c),kg=R.SPECIES.filter(s=>c.dex[s.id]&&c.dex[s.id].karmagra).length;
 const head=document.createElement("div");
 head.innerHTML="<p>Scoperte <b>"+n+"/"+R.SPECIES.length+"</b> · leggendari <b>"+legends+"/5</b> · varianti Karmagra <b>"+kg+"</b><br>Titolo: <b>"+esc(R.titleOf(c))+"</b></p>";
 body.appendChild(head);
 const grid=document.createElement("div");grid.className="dex-grid";
 for(const sp of R.SPECIES){
  const e=c.dex[sp.id],known=!!(e&&e.count);
  const card=document.createElement("div");card.className="dex-card"+(known?"":" unknown");
  const art=document.createElement("canvas");art.width=300;art.height=130;drawArt(art,sp,{silhouette:!known,karmagra:known&&e.karmagra});card.appendChild(art);
  const spots=sp.spots.map(s=>R.SPOTS[s].short).join(", ");
  let html="<strong>"+(known?esc(sp.name):"???")+"</strong>"+badgeRarity(sp)+"<br>";
  if(known){
   const hours=sp.hours.map(w=>String(w[0]).padStart(2,"0")+"–"+String(w[1]).padStart(2,"0")).join(", ");
   const baits=Object.keys(sp.baits).sort((a,b)=>sp.baits[b]-sp.baits[a]).slice(0,3).map(b=>R.BAITS[b].name).join(", ");
   html+="Record <b>"+R.fmtKg(e.best)+"</b> · "+Math.round(e.bestLen)+" cm · presi "+e.count+"<br>Dove: "+spots+" · fondale "+num(sp.depth[0])+"–"+num(sp.depth[1])+" m<br>Orari: "+hours+(sp.only?" · solo con "+sp.only.map(w=>R.WEATHER[w].label.toLowerCase()).join("/"):"")+"<br>Esche: "+esc(baits)+(sp.min?"<br>Misura minima "+sp.min+" cm":"")+(sp.protected?"<br><b>Specie protetta</b>":"")+'<br><i>'+esc(sp.note)+"</i>";
  }else{
   html+="Dove: "+spots;
   if(c.legendHints.includes(sp.id))html+='<div class="legend">'+esc(sp.legend)+"</div>";
  }
  const info=document.createElement("div");info.innerHTML=html;card.appendChild(info);grid.appendChild(card);
 }
 body.appendChild(grid);
 const col=document.createElement("div");
 const found=R.ITEMS.filter(i=>c.collection[i.id]);
 col.innerHTML="<p style=\"margin-top:12px\"><b>Collezione di oggetti:</b> "+(found.length?found.map(i=>esc(i.name)+" ×"+c.collection[i.id]).join(" · "):"niente, per ora.")+"</p>"+
  "<p><b>Statistiche:</b> giorni "+(c.stats.days+1)+" · lanci "+c.stats.casts+" · catture "+c.stats.catches+" · persi "+c.stats.lost+" · liberati "+c.stats.released+" · guadagnati "+euro(c.stats.earned)+" · multe "+euro(c.stats.fines)+"</p>";
 body.appendChild(col);
 openModal({kicker:"IL QUADERNO DI BIAGIO",title:"Pescepedia",body});
}

/* ---------- comandi rapidi ---------- */
function cycleBait(){
 if(G.hook.mode==="fight")return;
 const list=G.mode==="career"?R.BAIT_ORDER.filter(id=>(G.career.baits[id]||0)>0):ARCADE_BAITS;
 if(!list.length){shout("NIENTE ESCHE: PASSA IN BOTTEGA",1.8);return;}
 const cur=baitNow(),next=list[(list.indexOf(cur)+1)%list.length];
 if(G.mode==="career")G.career.bait=next;else G.arcade.bait=next;
 if(G.hook.mode!=="idle"&&G.hook.mode!=="fight")retrieve();
 shout("ESCA: "+R.BAITS[next].name.toUpperCase(),1.1);saveCareer();
}
function cycleDrag(){
 const keys=Object.keys(R.DRAG),holder=G.mode==="career"?G.career:G.arcade;if(!holder)return;
 holder.drag=keys[(keys.indexOf(holder.drag)+1)%keys.length];
 if(G.fight)G.fight.dragFactor=R.DRAG[holder.drag].factor;
 shout("FRIZIONE "+R.DRAG[holder.drag].label.toUpperCase(),1);saveCareer();
}

/* ---------- menu e pausa ---------- */
function showShade(kicker,title,message,actions,shareScore){
 ui.kicker.textContent=kicker;ui.headline.textContent=title;ui.message.textContent=message;ui.menu.innerHTML="";
 for(const a of actions){const b=document.createElement("button");b.type="button";b.className="btn"+(a.alt?" alt":"")+(a.ghost?" ghost":"");b.textContent=a.label;b.addEventListener("click",a.onClick);ui.menu.appendChild(b);}
 const share=shareScore!=null;ui.share.hidden=!share;ui.shareHint.hidden=!share;
 if(share)ui.share.href="https://wa.me/?text="+encodeURIComponent("🎣 Ho fatto "+shareScore+" punti a *Biagio Gelo — Pesca Grossa* su Arcade Club!\nRiesci a pescare meglio di me? Accetta la sfida e gioca qui: "+PAGE_URL);
 ui.shade.classList.remove("hidden");
}
function hideShade(){ui.shade.classList.add("hidden");}
function showMenu(){
 G.phase="menu";G.mode="menu";G.career=null;G.arcade=null;G.fight=null;G.hook={mode:"idle"};resetHolds();
 G.spot="lago";G.weather="sereno";populate();
 const save=loadCareer();
 const actions=[{label:save?"▶ CONTINUA LA CARRIERA (giorno "+save.day+")":"▶ INIZIA LA CARRIERA",onClick:()=>startCareer(false)},{label:"⏱ SFIDA 90 SECONDI",alt:true,onClick:startArcade}];
 if(save)actions.push({label:"Ricomincia la carriera da zero",ghost:true,onClick:()=>{if(window.confirm("Cancellare la carriera salvata e ricominciare dal giorno 1?"))startCareer(true);}});
 showShade("ARCADE CLUB · PESCA GROSSA 2.0","PESCA GROSSA!","Biagio Gelo vuole diventare il Re del Golfo: "+R.SPECIES.length+" specie, 4 luoghi, meteo, orari, esche, attrezzatura e cinque leggendari. Oppure la sfida classica da 90 secondi.",actions);
}
function pauseGame(){
 if(G.phase!=="playing"||G.modalOpen)return;
 G.phase="paused";resetHolds();
 showShade("PAUSA","IN PAUSA",G.mode==="career"?"Giorno "+G.career.day+", ore "+R.fmtClock(G.career.minute)+". La partita è salvata.":"Il tempo è fermo.",
  [{label:"RIPRENDI ▶",onClick:()=>{hideShade();G.phase="playing";G.last=0;}},{label:"MENU",alt:true,onClick:()=>{saveCareer();showMenu();}}]);
}
function resetHolds(){G.hold.key=G.hold.btn=G.hold.canvas=false;G.input.key=G.input.btn=G.input.drag=0;ui.reel.classList.remove("active");ui.left.classList.remove("active");ui.right.classList.remove("active");}

/* ---------- disegno ---------- */
const WATER_PALETTE={lago:["#3f9e8d","#0c4a63"],porto:["#3a7c8a","#09324b"],scogli:["#46c9c6","#093f6e"],golfo:["#2a73a8","#03193a"]};
function hexRgb(h){return[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];}
function waterLayer(spot){
 if(G.waterCache[spot])return G.waterCache[spot];
 const cw=80,ch=76,c=document.createElement("canvas");c.width=cw;c.height=ch;const g=c.getContext("2d");
 const pal=WATER_PALETTE[spot].map(hexRgb),s=R.SPOTS[spot],img=g.createImageData(cw,ch);
 for(let j=0;j<ch;j++)for(let i=0;i<cw;i++){
  const d=R.depthAt(spot,i*10+5,j*10+5),t=clamp(Math.log(1+d)/Math.log(1+s.depth[1]*1.05),0,1),k=(j*cw+i)*4;
  for(let q=0;q<3;q++)img.data[k+q]=pal[0][q]+(pal[1][q]-pal[0][q])*t;img.data[k+3]=255;
 }
 g.putImageData(img,0,0);G.waterCache[spot]=c;return c;
}
function drawWater(){
 ctx.imageSmoothingEnabled=true;ctx.drawImage(waterLayer(G.spot),0,0,W,H);
 const t=G.elapsed,rough=1+R.WEATHER[G.weather].wind;
 ctx.lineWidth=2;
 for(let i=0;i<30;i++){
  const x=((i*103+61+t*(6+i%5)*G.wind.x*rough)%860+860)%860-30,y=WATER_TOP+((i*173)%540);
  ctx.strokeStyle=i%2?"#76cfdb18":"#e6f4ee20";ctx.beginPath();ctx.ellipse(x,y,20+(i%4)*13*rough,4+(i%3),-.1,0,Math.PI*2);ctx.stroke();
 }
 if(!G.floaters.length)for(let j=0;j<30;j++)G.floaters.push({x:rnd(25,770),y:rnd(WATER_TOP,735),r:rnd(1.5,4.2),phase:rnd(0,6.28)});
 for(const q of G.floaters){ctx.globalAlpha=.12+.15*Math.sin(t*1.3+q.phase);ctx.fillStyle="#d9f4d6";ctx.beginPath();ctx.ellipse(q.x+Math.sin(t+q.phase)*5,q.y,q.r*3,q.r*.5,0,0,Math.PI*2);ctx.fill();}
 ctx.globalAlpha=1;
}
function blob(x,y,rx,ry,seed,fill,stroke){
 ctx.beginPath();for(let i=0;i<=14;i++){const a=i/14*Math.PI*2,k=.78+.22*Math.sin(seed+i*2.1)*Math.cos(seed*.7+i*1.3);const px=x+Math.cos(a)*rx*k,py=y+Math.sin(a)*ry*k;i?ctx.lineTo(px,py):ctx.moveTo(px,py);}
 ctx.closePath();ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=3;ctx.stroke();}
}
function drawDecor(){
 const t=G.elapsed,spot=R.SPOTS[G.spot];
 if(G.spot==="lago"){
  for(const f of spot.features){if(f.weed){ctx.strokeStyle="#2f7d4d77";ctx.lineWidth=3;for(let i=0;i<18;i++){const x=f.x-f.rx*.8+i*f.rx*.09,y=f.y+Math.sin(i*1.7)*f.ry*.5;ctx.beginPath();ctx.moveTo(x,y+14);ctx.quadraticCurveTo(x+Math.sin(t+i)*6,y,x+3,y-14);ctx.stroke();}}
   if(f.rock)blob(f.x,f.y,f.rx*.55,f.ry*.5,f.x,"#0b3a4a55");}
  ctx.fillStyle="#143c43";ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(800,0);ctx.lineTo(800,84);ctx.bezierCurveTo(640,110,570,98,450,113);ctx.bezierCurveTo(285,128,195,104,0,108);ctx.closePath();ctx.fill();
  ctx.fillStyle="#b79b63";ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(800,0);ctx.lineTo(800,62);ctx.bezierCurveTo(630,93,546,75,430,95);ctx.bezierCurveTo(200,105,160,80,0,92);ctx.closePath();ctx.fill();
  ctx.fillStyle="#6c8c66";ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(800,0);ctx.lineTo(800,27);ctx.bezierCurveTo(585,47,430,32,250,48);ctx.bezierCurveTo(140,38,55,41,0,33);ctx.closePath();ctx.fill();
  // canneto
  for(const side of [0,1])for(let i=0;i<26;i++){const x=side?800-i*9-rnd0(i)*6:i*9+rnd0(i)*6,base=104+(i%5)*9;ctx.strokeStyle=i%3?"#5d8f4b":"#7aa35a";ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x,base+30);ctx.quadraticCurveTo(x+Math.sin(t*1.2+i)*4,base,x+Math.sin(t*1.2+i)*7,base-24-(i%4)*8);ctx.stroke();if(i%4===0){ctx.fillStyle="#6b4a2b";ctx.fillRect(x+Math.sin(t*1.2+i)*7-2,base-34-(i%4)*8,4,12);}}
  woodenPier();
  for(const p of [[65,295,26],[735,300,24],[80,660,30],[720,668,34],[90,470,20]]){ctx.save();ctx.translate(p[0],p[1]);ctx.rotate(Math.sin(t*.4+p[0])*.12);ctx.fillStyle="#1c6c59";ctx.beginPath();ctx.arc(0,0,p[2],.25,Math.PI*2.17);ctx.lineTo(0,0);ctx.fill();ctx.strokeStyle="#3c9f75";ctx.lineWidth=3;ctx.stroke();ctx.restore();}
 }else if(G.spot==="porto"){
  const ruins=spot.features.find(f=>f.ruins);
  ctx.save();ctx.globalAlpha=.16;ctx.fillStyle="#e8dcc0";for(let i=0;i<6;i++){ctx.save();ctx.translate(ruins.x-150+i*60,ruins.y+Math.sin(i)*20);ctx.rotate(.3+i*.4);ctx.fillRect(-9,-38,18,76);ctx.restore();}ctx.restore();
  for(const f of spot.features)if(f.rock){ctx.fillStyle="#2b2f33";ctx.fillRect(f.x-14,f.y-14,28,28);ctx.strokeStyle="#9fb8bd55";ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(f.x,f.y,22+Math.sin(t*2)*2,10,0,0,7);ctx.stroke();}
  // case del Rione Terra e banchina
  const roofs=["#d9824e","#e6b65c","#c9643f","#e8d2a0","#b85a3a","#d99a5a"];
  for(let i=0;i<14;i++){ctx.fillStyle=roofs[i%roofs.length];ctx.fillRect(i*60-10,0,56,30+(i%3)*8);ctx.fillStyle="#00000022";ctx.fillRect(i*60-10,24+(i%3)*8,56,6);}
  ctx.fillStyle="#8b8780";ctx.fillRect(0,40,800,72);ctx.fillStyle="#6f6b65";ctx.fillRect(0,104,800,12);
  for(let x=40;x<800;x+=120){ctx.fillStyle="#333";ctx.beginPath();ctx.arc(x,98,7,0,7);ctx.fill();}
  ctx.fillStyle="#8b8780";ctx.fillRect(312,100,176,112);ctx.fillStyle="#6f6b65";ctx.fillRect(312,204,176,10);
  for(const b of [[95,190,-.2,"#f2efe6","#2f6fa8"],[705,185,.25,"#f2efe6","#c0392b"],[200,170,.1,"#e8c35a","#2d5a7a"]])boat(b[0],b[1],b[2],b[3],b[4],.8);
  ctx.fillStyle="#5b3a1e";ctx.fillRect(330,120,30,18);ctx.fillStyle="#c9b48a";ctx.fillRect(334,118,22,6);
 }else if(G.spot==="scogli"){
  for(const f of spot.features)if(f.rock){
   const emerge=f.dd<=-1.5;
   if(emerge){ctx.strokeStyle="#ffffff55";ctx.lineWidth=4;ctx.beginPath();ctx.ellipse(f.x,f.y,f.rx*.62+Math.sin(t*2+f.x)*3,f.ry*.55+Math.sin(t*2+f.x)*2,0,0,7);ctx.stroke();blob(f.x,f.y,f.rx*.55,f.ry*.48,f.x,"#5c544b","#3b352f");blob(f.x-8,f.y-6,f.rx*.32,f.ry*.25,f.y,"#7d7468");}
   else blob(f.x,f.y,f.rx*.6,f.ry*.5,f.x,"#0b2f4a66");
  }
  blob(400,40,470,120,3,"#6a6158","#4a433c");blob(160,80,170,70,5,"#7a7064");blob(650,70,190,80,7,"#776d61");blob(400,150,120,70,9,"#8a8073","#5d554b");
  ctx.strokeStyle="#ffffff66";ctx.lineWidth=3;ctx.beginPath();for(let x=0;x<=800;x+=20){const y=158+Math.sin(x*.05+t*2)*6+(Math.abs(x-400)<140?40:0);x?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();
 }else{
  const sh=spot.features[0];ctx.save();ctx.globalAlpha=.25;blob(sh.x,sh.y,sh.rx*.7,sh.ry*.6,2,"#7ec8c8");ctx.restore();
  blob(740,30,90,46,4,"#2f4a3a","#1d3226");blob(690,58,22,26,6,"#3e4a44");blob(660,62,14,16,8,"#3e4a44");
  ctx.save();ctx.strokeStyle="#ffffff40";ctx.lineWidth=3;for(let i=0;i<4;i++){ctx.beginPath();ctx.moveTo(360-i*14,40-i*10);ctx.quadraticCurveTo(400,-40,440+i*14,40-i*10);ctx.stroke();}ctx.restore();
  boat(400,135,0,"#f4f1ea","#2f6fa8",1.9);
 }
}
function rnd0(i){return (Math.sin(i*12.9898)*43758.5453)%1;}
function woodenPier(){
 ctx.fillStyle="#422d28";ctx.fillRect(308,65,184,155);ctx.fillStyle="#aa7547";ctx.fillRect(315,65,170,146);
 for(let k=0;k<8;k++){ctx.fillStyle=k%2?"#af7c4c":"#99653d";ctx.fillRect(318,66+k*19,164,17);ctx.strokeStyle="#60402c";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(318,66+k*19);ctx.lineTo(481,66+k*19);ctx.stroke();}
 ctx.fillStyle="#382925";ctx.fillRect(318,196,162,12);
}
function boat(x,y,rot,hull,stripe,scale){
 ctx.save();ctx.translate(x,y);ctx.rotate(rot);ctx.scale(scale,scale);
 ctx.fillStyle="#00000033";ctx.beginPath();ctx.ellipse(4,8,40,20,0,0,7);ctx.fill();
 ctx.fillStyle=hull;ctx.beginPath();ctx.moveTo(-44,0);ctx.quadraticCurveTo(-40,-20,0,-22);ctx.quadraticCurveTo(48,-20,52,0);ctx.quadraticCurveTo(48,20,0,22);ctx.quadraticCurveTo(-40,20,-44,0);ctx.fill();
 ctx.strokeStyle=stripe;ctx.lineWidth=4;ctx.stroke();
 ctx.fillStyle="#9b6a3f";ctx.fillRect(-26,-14,52,28);ctx.fillStyle="#7d532f";for(let i=-20;i<26;i+=10)ctx.fillRect(i,-14,3,28);
 ctx.restore();
}
function drawFishShape(g,sp,size,o){
 o=o||{};const body=o.silhouette?(o.shadowColor||"#0a2430"):sp.color,dark=o.silhouette?(o.shadowColor||"#0a2430"):sp.dark,s=size;
 const kind=sp.shadow||"pesce",deep=sp.k>=.016&&kind==="pesce"?1.25:1;
 if(kind==="lungo"){
  g.lineCap="round";g.strokeStyle=body;g.lineWidth=s*.42;g.beginPath();
  for(let i=0;i<=16;i++){const x=-1.9*s+i*(3.4*s/16),y=Math.sin(i*.7+(o.wiggle||0))*s*.18*(1-i/20);i?g.lineTo(x,y):g.moveTo(x,y);}g.stroke();
  g.fillStyle=dark;g.beginPath();g.ellipse(1.55*s,0,s*.32,s*.24,0,0,7);g.fill();
 }else if(kind==="tentacoli"){
  g.fillStyle=body;g.beginPath();g.ellipse(-s*.35,0,s*.85,s*.5,0,0,7);g.fill();
  g.strokeStyle=dark;g.lineWidth=Math.max(1.5,s*.12);g.lineCap="round";
  for(let i=0;i<6;i++){const a=(i-2.5)*.2;g.beginPath();g.moveTo(s*.35,a*s*.9);g.quadraticCurveTo(s*.9,a*s*1.6+Math.sin((o.wiggle||0)+i)*s*.15,s*1.45,a*s*2.2);g.stroke();}
  if(sp.id==="polpo"){g.fillStyle=dark;g.beginPath();g.arc(-s*.55,-s*.1,s*.12,0,7);g.fill();}
 }else{
  const long=kind==="pinna"?1.25:1,hw=s*.56*deep,detail=!o.silhouette;
  // coda e pinne
  g.fillStyle=dark;g.beginPath();
  if(kind==="pinna"){g.moveTo(-s*1.05*long,0);g.lineTo(-s*1.75*long,-s*.8);g.lineTo(-s*1.45*long,0);g.lineTo(-s*1.75*long,s*.8);}
  else{g.moveTo(-s*.85,0);g.lineTo(-s*1.7,-s*.68*deep);g.quadraticCurveTo(-s*1.45,0,-s*1.6,s*.67*deep);}
  g.closePath();g.fill();
  if(sp.id==="lampuga"){g.beginPath();g.moveTo(-s*.9,-hw*.6);g.quadraticCurveTo(-s*.1,-hw*1.9,s*.75,-hw*.75);g.lineTo(s*.6,-hw*.4);g.closePath();g.fill();}
  else{g.beginPath();g.moveTo(-s*.25,-hw*.82);g.lineTo(-s*.5,-hw*1.75);g.quadraticCurveTo(s*.05,-hw*1.4,s*.4,-hw*.84);g.closePath();g.fill();}
  g.beginPath();g.moveTo(-s*.35,hw*.8);g.lineTo(-s*.6,hw*1.3);g.lineTo(-s*.05,hw*.85);g.closePath();g.fill();
  // corpo con ventre chiaro
  if(detail){const gr=g.createLinearGradient(0,-hw,0,hw);gr.addColorStop(0,dark);gr.addColorStop(.42,body);gr.addColorStop(1,"#f6f1e2");g.fillStyle=gr;}else g.fillStyle=body;
  g.beginPath();g.ellipse(0,0,s*1.05*long,hw,0,0,7);g.fill();
  if(sp.id==="pesce_spada"){g.strokeStyle=dark;g.lineWidth=Math.max(2,s*.1);g.beginPath();g.moveTo(s*1.2,0);g.lineTo(s*2.4,-s*.05);g.stroke();}
  if(detail){
   const lw=Math.max(1,s*.045);g.lineWidth=lw;g.strokeStyle="rgba(20,30,40,.35)";
   g.beginPath();g.moveTo(-s*.9*long,-hw*.05);g.quadraticCurveTo(0,-hw*.32,s*.8*long,-hw*.12);g.stroke();
   g.beginPath();g.arc(s*.45*long,0,hw*.75,-1.05,1.05);g.stroke();
   g.fillStyle="rgba(255,255,255,.18)";for(let i=0;i<7;i++){g.beginPath();g.arc(-s*.55+i*s*.17,-hw*.2+(i%2)*hw*.22,Math.max(1,s*.07),0,7);g.fill();}
   g.fillStyle=dark;g.globalAlpha=.85;g.beginPath();g.moveTo(s*.28*long,hw*.1);g.quadraticCurveTo(-s*.05,hw*.55,-s*.12,hw*.2);g.closePath();g.fill();g.globalAlpha=1;
   const mark=sp.id;
   if(mark==="orata"){g.strokeStyle="#ffcf4a";g.lineWidth=Math.max(2,s*.09);g.beginPath();g.arc(s*.62,-s*.14,s*.18,3.6,5.2);g.stroke();}
   if(mark==="occhiata"){g.fillStyle="#141414";g.beginPath();g.arc(-s*.95,0,hw*.32,0,7);g.fill();}
   if(mark==="donzella"){g.fillStyle="#ff7a2e";g.fillRect(-s*.9,-hw*.18,s*1.7,hw*.3);}
   if(mark==="scorfano"||mark==="cernia"){g.fillStyle="rgba(70,30,20,.35)";for(let i=0;i<9;i++){g.beginPath();g.arc(-s*.7+(i*37%11)*s*.13,-hw*.5+(i*23%7)*hw*.16,Math.max(1.5,s*.09),0,7);g.fill();}}
   if(mark==="sarago_fasciato"||mark==="sgombro"||mark==="sarago"){g.strokeStyle=mark==="sarago"?"rgba(40,40,40,.35)":dark;g.lineWidth=Math.max(1.5,s*.1);for(let i=-1;i<=1;i++){g.beginPath();g.moveTo(i*s*.35,-hw*.8);g.quadraticCurveTo(i*s*.35+s*.08,0,i*s*.35+s*.05,hw*.8);g.stroke();}}
   if(mark==="pesce_oro"){g.fillStyle="rgba(255,255,230,.45)";g.beginPath();g.ellipse(s*.1,-hw*.35,s*.55,hw*.18,-.1,0,7);g.fill();}
   g.fillStyle="#fff9dd";g.beginPath();g.arc(s*.6*long,-s*.14,Math.max(2,s*.12),0,7);g.fill();g.fillStyle="#193c4a";g.beginPath();g.arc(s*.65*long,-s*.14,Math.max(1.2,s*.07),0,7);g.fill();
   g.strokeStyle="rgba(20,20,20,.5)";g.lineWidth=lw;g.beginPath();g.moveTo(s*1.02*long,hw*.12);g.lineTo(s*.85*long,hw*.2);g.stroke();
  }
 }
 if(o.karmagra&&!o.silhouette){g.globalAlpha=.35;g.fillStyle="#b46cff";g.beginPath();g.ellipse(0,0,s*1.1,s*.6,0,0,7);g.fill();g.globalAlpha=1;}
}
function drawArt(cv,sp,o){
 const g=cv.getContext("2d"),w=cv.width,h=cv.height;
 const grad=g.createLinearGradient(0,0,0,h);grad.addColorStop(0,"#1a6c80");grad.addColorStop(1,"#0a3446");g.fillStyle=grad;g.fillRect(0,0,w,h);
 g.save();g.translate(w/2+(sp.shadow==="lungo"?-w*.04:0),h/2);
 const size=Math.min(h*.36,w*.2);
 if(!o.silhouette&&(o.karmagra||sp.shimmer||sp.rarity==="leggendario")){g.shadowBlur=26;g.shadowColor=o.karmagra?"#c77dff":"#ffdc72";}
 drawFishShape(g,sp,size,Object.assign({shadowColor:"#05161d"},o));
 g.restore();
}
function drawShadows(){
 const fog=G.weather==="nebbia",night=isNight()&&!hasExtra("lanterna"),sonar=hasExtra("ecoscandaglio");
 for(const f of G.fish){
  const a=.34*f.fade*(fog?.5:1)*(night?.6:1);if(a<=.01)continue;
  ctx.save();ctx.translate(f.x,f.y);
  if(f.fish.karmagra){ctx.shadowBlur=16;ctx.shadowColor="#b46cff";}
  else if(f.sp.rarity==="leggendario"||f.sp.shimmer){ctx.shadowBlur=14;ctx.shadowColor="#ffd56b";}
  ctx.rotate(Math.atan2(f.vy,Math.abs(f.vx)+.01)*.25*f.dir);if(f.dir<0)ctx.scale(-1,1);
  ctx.globalAlpha=a*(f.fish.karmagra?1.6:1);
  drawFishShape(ctx,f.sp,f.size*(1+Math.sin(f.wiggle)*.03),{silhouette:true,shadowColor:f.fish.karmagra?"#3a1460":"#03202b",wiggle:f.wiggle});
  ctx.restore();
  if((f.sp.rarity==="leggendario"||f.sp.shimmer)&&Math.sin(G.elapsed*3+f.id*20)>.7){ctx.fillStyle="#fff2b0";ctx.globalAlpha=.7*f.fade;ctx.beginPath();ctx.arc(f.x+rnd(-f.size,f.size),f.y+rnd(-f.size*.5,f.size*.5),2,0,7);ctx.fill();ctx.globalAlpha=1;}
  if(sonar&&f.fade>.5){ctx.font="bold 15px system-ui,sans-serif";ctx.textAlign="center";ctx.fillStyle="#d8fff2";ctx.globalAlpha=.85;ctx.fillText((f.fish.karmagra?"✦ ":"")+f.sp.name+" "+R.fmtKg(f.fish.weight),f.x,f.y-f.size-6);ctx.globalAlpha=1;}
 }
}
function drawFrenzy(){
 const fz=G.frenzy;if(!fz)return;const t=G.elapsed;
 ctx.save();ctx.globalAlpha=.5;ctx.strokeStyle="#e9fbff";ctx.lineWidth=1.5;
 for(let i=0;i<14;i++){const a=i*2.4+t*.7,r=(i*13%fz.r);ctx.beginPath();ctx.arc(fz.x+Math.cos(a)*r,fz.y+Math.sin(a)*r*.6,2+((t*3+i)%3),0,7);ctx.stroke();}
 ctx.globalAlpha=1;ctx.strokeStyle="#f7f7f2";ctx.lineWidth=3;
 for(const g of G.gulls){const a=g.a+t*g.s,x=fz.x+Math.cos(a)*g.r,y=fz.y-30+Math.sin(a)*g.r*.5,fl=Math.sin(t*9+g.a)*5;ctx.beginPath();ctx.moveTo(x-10,y-fl);ctx.quadraticCurveTo(x-4,y-6,x,y);ctx.quadraticCurveTo(x+4,y-6,x+10,y-fl);ctx.stroke();}
 ctx.restore();
}
function tipPos(){
 let x=TIP0.x+sideInput()*16,y=TIP0.y;const f=G.fight;
 if(f){const r=Math.min(1.2,f.tension/f.line.limit),a=Math.atan2(f.screenY-TIP0.y,f.screenX-TIP0.x);x+=Math.cos(a)*r*12;y+=Math.sin(a)*r*12;}
 return{x,y};
}
function drawBiagio(){
 const night=isNight();
 if(G.spot!=="golfo"){ctx.fillStyle="#0005";ctx.beginPath();ctx.ellipse(401,161,57,19,0,0,7);ctx.fill();}
 if(biagio.complete&&biagio.naturalWidth)ctx.drawImage(biagio,334,77,132,132);
 else{ctx.fillStyle="#27262a";ctx.beginPath();ctx.ellipse(400,131,34,43,0,0,7);ctx.fill();}
 if(night&&hasExtra("lanterna")){ctx.fillStyle="#ffd77a";ctx.beginPath();ctx.arc(360,170,7,0,7);ctx.fill();ctx.strokeStyle="#5a4a2a";ctx.lineWidth=2;ctx.strokeRect(354,162,12,16);}
 const tip=tipPos(),r=G.fight?Math.min(1.2,G.fight.tension/G.fight.line.limit):0;
 ctx.strokeStyle="#33281e";ctx.lineCap="round";ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(HAND.x,HAND.y);
 ctx.quadraticCurveTo((HAND.x+tip.x)/2+(tip.x-HAND.x)*.2*r+8*r,(HAND.y+tip.y)/2-6*r,tip.x,tip.y);ctx.stroke();
 ctx.fillStyle="#9aa3a8";ctx.beginPath();ctx.arc(HAND.x-2,HAND.y+8,5,0,7);ctx.fill();
 ctx.fillStyle="#dbc27d";ctx.beginPath();ctx.arc(tip.x,tip.y,3.5,0,7);ctx.fill();
}
function drawLine(){
 const h=G.hook,tip=tipPos();if(h.mode==="idle")return;
 ctx.save();ctx.lineCap="round";
 if(h.mode==="fight"&&G.fight){
  const f=G.fight,ratio=f.tension/f.line.limit,sag=(1-clamp(ratio*1.3,0,1))*38;
  const danger=ratio>.85,col=ratio<.55?"#f5efcc":ratio<.85?"#ffd36b":(Math.sin(G.elapsed*30)>0?"#ff6b5e":"#ffd0c8");
  ctx.strokeStyle=col;ctx.lineWidth=1.6+ratio*1.6;ctx.shadowColor=danger?"#ff4d4d":"#d4f9ef";ctx.shadowBlur=danger?8:2;
  ctx.beginPath();ctx.moveTo(tip.x,tip.y);ctx.quadraticCurveTo((tip.x+f.screenX)/2,(tip.y+f.screenY)/2+sag,f.screenX,f.screenY);ctx.stroke();
 }else{
  ctx.strokeStyle="#f5efcc";ctx.lineWidth=1.6;ctx.shadowColor="#d4f9ef";ctx.shadowBlur=2;
  const my=(tip.y+h.y)/2-(h.arc||0)+(h.mode==="casting"?0:14);
  ctx.beginPath();ctx.moveTo(tip.x,tip.y);ctx.quadraticCurveTo((tip.x+h.x)/2,my,h.x,h.y-(h.arc||0)*.2);ctx.stroke();
  ctx.shadowBlur=0;
  if(h.artificial){
   ctx.save();ctx.translate(h.x,h.y);ctx.rotate(Math.atan2(TIP0.y-h.y,TIP0.x-h.x));ctx.fillStyle="#d8e2e8";ctx.beginPath();ctx.ellipse(0,0,9,4,0,0,7);ctx.fill();ctx.fillStyle="#ff6b5e";ctx.fillRect(-11,-2,4,4);ctx.restore();
   if(h.moving){ctx.strokeStyle="#ffffff55";ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(h.x,h.y);const a=Math.atan2(h.y-TIP0.y,h.x-TIP0.x);ctx.lineTo(h.x+Math.cos(a+.4)*22,h.y+Math.sin(a+.4)*22);ctx.moveTo(h.x,h.y);ctx.lineTo(h.x+Math.cos(a-.4)*22,h.y+Math.sin(a-.4)*22);ctx.stroke();}
  }else{
   const under=h.mode==="bite",dip=(h.dip||0);
   const by=h.y-(h.arc||0)*.2+dip*5;
   ctx.globalAlpha=under?.35:1;
   ctx.fillStyle="#fff3e4";ctx.beginPath();ctx.arc(h.x,by,8*(1-dip*.25),0,7);ctx.fill();
   ctx.fillStyle="#e2453a";ctx.beginPath();ctx.arc(h.x,by,8*(1-dip*.25),Math.PI,0);ctx.fill();
   ctx.globalAlpha=1;
   if(h.mode==="waiting"&&!h.empty){ctx.strokeStyle="#f7e1a1a0";ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(h.x,by,12+2*Math.sin(G.elapsed*4),0,7);ctx.stroke();}
   if(under){ctx.fillStyle="#fff1a8";ctx.font="900 34px system-ui,sans-serif";ctx.textAlign="center";ctx.fillText("!",h.x,h.y-18);}
  }
  if(h.mode!=="casting"&&h.depth!=null){ctx.font="bold 13px system-ui,sans-serif";ctx.textAlign="left";ctx.fillStyle="#e4fbf4cc";ctx.fillText((hasExtra("ecoscandaglio")?h.depth.toFixed(1).replace(".",","):"~"+Math.max(1,Math.round(h.depth)))+" m",h.x+14,h.y+20);}
 }
 ctx.restore();
}
function drawFightFish(){
 const f=G.fight;if(!f)return;
 const sp=R.SPECIES_BY_ID[f.fish.species];
 const x=f.screenX,y=f.screenY,a=f.action;
 const size=sp?shadowSize(f.fish.weight):10,jump=a.type==="salto"&&a.left>a.len*.2;
 ctx.save();ctx.translate(x,y);
 const dirX=Math.cos(f.baseAngle+Math.PI)<0?-1:1;
 if(sp&&jump){
  const p=1-(a.left-a.len*.2)/(a.len*.8),lift=Math.sin(p*Math.PI)*46;
  ctx.globalAlpha=.3;ctx.fillStyle="#032b42";ctx.beginPath();ctx.ellipse(0,6,size*1.4,size*.5,0,0,7);ctx.fill();ctx.globalAlpha=1;
  ctx.translate(0,-lift);ctx.rotate((p-.5)*1.2*dirX);if(dirX<0)ctx.scale(-1,1);
  if(f.fish.karmagra){ctx.shadowBlur=16;ctx.shadowColor="#c77dff";}
  drawFishShape(ctx,sp,size,{karmagra:f.fish.karmagra});
 }else if(sp){
  ctx.rotate(f.lateral*.3);if(dirX<0)ctx.scale(-1,1);ctx.globalAlpha=.55;
  drawFishShape(ctx,sp,size*(1+Math.sin(G.elapsed*14)*.05),{silhouette:true,shadowColor:f.fish.karmagra?"#3a1460":"#03202b",wiggle:G.elapsed*10});
 }else{ctx.globalAlpha=.6;ctx.fillStyle="#03202b";ctx.beginPath();ctx.ellipse(0,0,11,8,0,0,7);ctx.fill();}
 ctx.restore();
 // segnale dell'azione del pesce
 const tele=f.tele||{label:R.ACTIONS[a.type].label,type:a.type,dir:a.dir};
 const col={tira:"#f5efcc",fuga:"#ff8a7a",salto:"#ffe36b",riposo:"#9df2b5",tana:"#ffb35a"}[a.type]||"#fff";
 const label=(a.dir<0&&R.ACTIONS[a.type].dir?"◀ ":"")+(tele.label||R.ACTIONS[a.type].label)+(a.dir>0&&R.ACTIONS[a.type].dir?" ▶":"");
 ctx.save();ctx.font="900 27px system-ui,sans-serif";ctx.textAlign="center";ctx.lineWidth=6;ctx.strokeStyle="#02202ccc";
 const ly=Math.max(WATER_TOP+24,y-size-22);
 ctx.strokeText(label,x,ly);ctx.fillStyle=col;ctx.fillText(label,x,ly);
 if(f.den>.05){ctx.fillStyle="#02202ccc";ctx.fillRect(x-40,ly+8,80,8);ctx.fillStyle="#ff9d4a";ctx.fillRect(x-40,ly+8,80*clamp(f.den,0,1),8);ctx.font="bold 15px system-ui,sans-serif";ctx.fillStyle="#ffd9b0";ctx.fillText("TANA",x,ly+32);}
 if(f.slack>.6){ctx.font="900 21px system-ui,sans-serif";ctx.fillStyle="#ffe36b";ctx.fillText("LENZA LASCA! RECUPERA",x,ly+(f.den>.05?48:28));}
 ctx.restore();
}
function drawAim(){
 const h=G.hook;if(G.phase!=="playing"||!G.aimVisible)return;
 if(h.mode!=="idle"&&!(h.mode==="waiting"&&dist(G.aim.x,G.aim.y,h.x,h.y)>45))return;
 const max=rodRangePx(),dx=G.aim.x-TIP0.x,dy=G.aim.y-TIP0.y,len=Math.hypot(dx,dy),k=len>max?max/len:1;
 const ax=TIP0.x+dx*k,ay=TIP0.y+dy*k;
 ctx.save();ctx.setLineDash([6,8]);ctx.strokeStyle="#e5f4db40";ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(TIP0.x,TIP0.y,max,0,Math.PI);ctx.stroke();ctx.setLineDash([]);
 ctx.translate(ax,ay);ctx.strokeStyle=k<1?"#ffb9a6c0":"#e5f4dbc0";ctx.beginPath();ctx.arc(0,0,17,0,7);ctx.moveTo(-25,0);ctx.lineTo(-10,0);ctx.moveTo(10,0);ctx.lineTo(25,0);ctx.moveTo(0,-25);ctx.lineTo(0,-10);ctx.moveTo(0,10);ctx.lineTo(0,25);ctx.stroke();
 const d=R.depthAt(G.spot,ax,ay);ctx.font="bold 13px system-ui,sans-serif";ctx.fillStyle="#e4fbf4";ctx.textAlign="left";ctx.fillText((hasExtra("ecoscandaglio")?d.toFixed(1).replace(".",","):"~"+Math.max(1,Math.round(d)))+" m",22,-14);
 ctx.restore();
}
function drawWeather(){
 const w=G.weather,t=G.elapsed;
 if(w==="nuvoloso"||w==="pioggia"||w==="burrasca"){for(let i=0;i<3;i++){const x=((t*14*(i+1)+i*300)%1200)-200,y=200+i*190;const g=ctx.createRadialGradient(x,y,10,x,y,220);g.addColorStop(0,"#0a1a2430");g.addColorStop(1,"#0a1a2400");ctx.fillStyle=g;ctx.fillRect(x-220,y-220,440,440);}}
 if(G.drops.length){ctx.strokeStyle="#cfe6f5aa";ctx.lineWidth=1.2;ctx.beginPath();const wx=G.wind.x*R.WEATHER[w].wind*.12;for(const d of G.drops){ctx.moveTo(d.x,d.y);ctx.lineTo(d.x-wx*90,d.y-16);}ctx.stroke();}
 if(w==="vento"||w==="burrasca"){ctx.strokeStyle="#ffffff2a";ctx.lineWidth=2;for(let i=0;i<12;i++){const x=((t*220*G.wind.x+i*137)%900+900)%900-50,y=(i*97)%760;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+60*Math.sign(G.wind.x||1),y+6);ctx.stroke();}}
 if(w==="nebbia"){const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,"#dfe8ea40");g.addColorStop(1,"#dfe8ea88");ctx.fillStyle=g;ctx.fillRect(0,0,W,H);}
 if(w==="burrasca"){ctx.fillStyle="#04101833";ctx.fillRect(0,0,W,H);if(Math.sin(t*.7)>.995){ctx.fillStyle="#ffffff55";ctx.fillRect(0,0,W,H);}}
}
function drawLight(){
 const h=hourNow();let night=0,warm=0;
 if(h>=20.5||h<4.5)night=1;else if(h>=19)night=(h-19)/1.5;else if(h<6)night=(6-h)/1.5;
 if(h>=17.5&&h<20.5)warm=Math.min(1,(h-17.5)/1.5)*(1-night*.6);
 if(h>=4.5&&h<7)warm=Math.max(warm,(7-h)/2.5);
 if(warm>0){ctx.fillStyle="rgba(255,120,60,"+(.16*warm)+")";ctx.fillRect(0,0,W,H);}
 if(night>0){
  const lantern=hasExtra("lanterna");
  const g=ctx.createRadialGradient(400,170,lantern?60:10,400,170,lantern?520:200);
  g.addColorStop(0,"rgba(4,10,35,"+(.12*night)+")");g.addColorStop(1,"rgba(4,10,35,"+(.62*night)+")");
  ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  if(G.spot==="porto"){for(let x=60;x<800;x+=180){const lg=ctx.createRadialGradient(x,110,2,x,110,90);lg.addColorStop(0,"rgba(255,214,140,"+(.35*night)+")");lg.addColorStop(1,"rgba(255,214,140,0)");ctx.fillStyle=lg;ctx.fillRect(x-90,20,180,180);}}
 }
}
function drawFx(){
 for(const r of G.ripples){ctx.save();ctx.globalAlpha=Math.max(0,r.life/1.2);ctx.strokeStyle=r.color;ctx.lineWidth=2;ctx.beginPath();ctx.arc(r.x,r.y,r.r,0,7);ctx.stroke();ctx.restore();}
 ctx.fillStyle="#e9fbff";for(const s of G.splashes){ctx.globalAlpha=clamp(s.life*1.6,0,1);ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,7);ctx.fill();}ctx.globalAlpha=1;
 ctx.textAlign="center";ctx.font="900 22px system-ui,sans-serif";
 for(const t of G.texts){ctx.globalAlpha=clamp(t.life,0,1);ctx.lineWidth=4;ctx.strokeStyle="#02202c";ctx.strokeText(t.text,t.x,t.y);ctx.fillStyle=t.color;ctx.fillText(t.text,t.x,t.y);}ctx.globalAlpha=1;
}
function drawNotice(){
 if(G.noticeLife<=0)return;
 ctx.save();ctx.globalAlpha=Math.min(1,G.noticeLife);ctx.textAlign="center";let size=30;ctx.font="bold "+size+"px system-ui,sans-serif";
 while(ctx.measureText(G.notice).width>740&&size>14){size--;ctx.font="bold "+size+"px system-ui,sans-serif";}
 ctx.lineWidth=6;ctx.strokeStyle="#022c36";ctx.strokeText(G.notice,400,258);ctx.fillStyle="#fff0b7";ctx.fillText(G.notice,400,258);ctx.restore();
}
function render(){
 ctx.clearRect(0,0,W,H);
 drawWater();drawDecor();drawFrenzy();drawShadows();drawFightFish();drawBiagio();drawLine();drawAim();
 drawWeather();drawLight();drawFx();drawNotice();
}

/* ---------- interfaccia HTML ---------- */
const lastSet=new Map();
function setText(el,v){if(lastSet.get(el)!==v){lastSet.set(el,v);el.textContent=v;}}
function setHTML(el,v){const k="h:"+v;if(lastSet.get(el)!==k){lastSet.set(el,k);el.innerHTML=v;}}
function setShown(el,show){el.hidden=!show;}
function refreshUI(){
 const c=career(),a=G.arcade,h=G.hook,f=G.fight;
 if(c){
  setText(ui.hudLL,"SOLDI");setText(ui.hudL,euro(c.money));
  setText(ui.hudML,"GIORNO "+c.day+" · "+R.WEATHER[G.weather].icon+" "+R.WEATHER[G.weather].label.toUpperCase());setText(ui.hudM,R.fmtClock(c.minute));
  const lv=R.repLevel(c.rep);setText(ui.hudRL,"FAMA");setText(ui.hudR,"★".repeat(lv)+"☆".repeat(4-lv));
 }else{
  setText(ui.hudLL,"PUNTI");setText(ui.hudL,String(a?a.score:0).padStart(5,"0"));
  const s=Math.ceil(a?a.seconds:ARCADE_SECONDS);setText(ui.hudML,"TEMPO");setText(ui.hudM,String(Math.floor(s/60)).padStart(2,"0")+":"+String(s%60).padStart(2,"0"));
  setText(ui.hudRL,"RECORD");setText(ui.hudR,String(G.best).padStart(5,"0"));
 }
 const bait=baitNow(),left=baitLeft(bait);
 setText(ui.baitName,R.BAITS[bait].name);setText(ui.baitCount,left===Infinity?"∞":String(left));
 ui.chipBait.classList.toggle("warn",left===0);
 const drag=c?c.drag:a?a.drag:"media";setText(ui.dragName,R.DRAG[drag].label);
 for(const el of [ui.chipMap,ui.chipCooler,ui.chipShop,ui.chipOrders,ui.chipDex,ui.chipKarma])setShown(el,!!c);
 if(c){
  setText(ui.spotName,R.SPOTS[G.spot].name);
  setText(ui.coolerLoad,R.coolerLoad(c).toFixed(1).replace(".",",")+"/"+R.gearOf(c,"cooler").capacity+" kg");
  const open=c.orders.filter(o=>!o.done),ready=open.filter(o=>c.cooler.filter(i=>R.orderMatches(o,i)).length>=o.count).length;
  setText(ui.ordersCount,ready?open.length+" ✓"+ready:String(open.length));ui.chipOrders.classList.toggle("warn",ready>0);
  setText(ui.dexCount,R.dexCount(c)+"/"+R.SPECIES.length);setText(ui.karmaNum,String(c.karma));
 }
 // pulsante principale e indicatori
 let label="🎣 LANCIA<small>mira automatica</small>",status="PRONTO A PESCARE",tip="Tocca l'acqua per lanciare",strikeOn=false;
 if(G.phase!=="playing"){status=G.phase==="paused"?"IN PAUSA":"PRONTO A PESCARE";tip=G.mode==="menu"?"Scegli una modalità":"";}
 else if(h.mode==="idle"){status="SCEGLI DOVE LANCIARE";tip="Tocca l'acqua · gittata "+gearNow().rod.range+" m";}
 else if(h.mode==="casting"){label="🎣 …";status="LANCIO IN CORSO";tip="";}
 else if(h.mode==="waiting"){
  if(h.empty){label="↩ RITIRA<small>amo vuoto</small>";status="AMO VUOTO";tip="Ritira e rilancia per rimettere l'esca";}
  else if(h.artificial){label="↟ RECUPERA<small>tieni premuto</small>";status=h.moving?"RECUPERO LENTO...":"MUOVI L'ESCA";tip="Tieni premuto: i predatori attaccano le esche in movimento";}
  else{label="↩ RITIRA<small>o tocca un altro punto</small>";status="ASPETTA L'ABBOCCATA";tip="Esca: "+R.BAITS[h.bait].name+" · fondale "+(h.depth!=null?Math.round(h.depth):"?")+" m";}
 }else if(h.mode==="nibble"){label="⚡ FERRA!";status="QUALCOSA ASSAGGIA...";tip="Aspetta che il galleggiante vada sotto!";}
 else if(h.mode==="bite"){label="⚡ FERRA!";status=h.junk?"QUALCOSA DI PESANTE!":"ABBOCCA! FERRA ORA!";tip="";strikeOn=true;}
 else if(h.mode==="fight"&&f){
  label="↟ RECUPERA<small>tieni · scorri ← →</small>";
  const t=f.action.type,dirTxt=f.action.dir<0?"a sinistra":"a destra",counter=f.action.dir<0?"▶":"◀";
  status={tira:"TIRA "+dirTxt.toUpperCase()+": PIEGA "+counter,fuga:"FUGA! MOLLA O PIEGA "+counter,salto:"SALTO! NON RECUPERARE",riposo:"È STANCO: RECUPERA!",tana:"VA IN TANA: TIENI TESO!"}[t]||"COMBATTI!";
  tip="Frizione "+R.DRAG[drag].label.toLowerCase()+" · filo "+Math.round(f.dist)+"/"+f.line.spool+" m";
 }
 setHTML(ui.reel,label);ui.reel.classList.toggle("strike",strikeOn);
 setText(ui.status,status);setText(ui.tip,tip);
 const fighting=!!f&&G.phase==="playing";
 ui.left.disabled=!fighting;ui.right.disabled=!fighting;
 const want=fighting&&R.ACTIONS[f.action.type].dir?-f.action.dir:0;
 ui.left.classList.toggle("hint",want===-1);ui.right.classList.toggle("hint",want===1);
 if(fighting){
  const ratio=f.tension/f.line.limit;
  ui.tension.style.width=clamp(ratio*100,0,100)+"%";setText(ui.tensionNum,Math.round(ratio*100)+"%");
  ui.dragMark.style.left=(f.dragFactor*100)+"%";
  ui.line.style.width=clamp(f.dist/f.line.spool*100,0,100)+"%";setText(ui.lineNum,Math.round(f.dist)+" m");
  ui.stamina.style.width=clamp(f.stamina*100,0,100)+"%";setText(ui.staminaNum,Math.round(f.stamina*100)+"%");
 }else{
  ui.tension.style.width="0%";setText(ui.tensionNum,"0%");ui.dragMark.style.left=(R.DRAG[drag].factor*100)+"%";
  const m=(h.mode==="waiting"||h.mode==="nibble"||h.mode==="bite")?dist(h.x,h.y,TIP0.x,TIP0.y)/R.PX_PER_M:0;
  ui.line.style.width=clamp(m/gearNow().line.spool*100,0,100)+"%";setText(ui.lineNum,Math.round(m)+" m");
  ui.stamina.style.width="0%";setText(ui.staminaNum,"—");
 }
}

/* ---------- input ---------- */
function lakePoint(ev){const r=canvas.getBoundingClientRect();return{x:clamp((ev.clientX-r.left)*W/r.width,30,770),y:clamp((ev.clientY-r.top)*H/r.height,WATER_TOP+14,745)};}
function mainPress(fromKey){
 if(G.phase!=="playing"||G.modalOpen)return false;
 const h=G.hook;
 if(h.mode==="idle"){if(fromKey)cast(G.aim.x,G.aim.y);else autoCast();return false;}
 if(h.mode==="casting")return false;
 if(h.mode==="nibble"||h.mode==="bite"){strike();return G.hook.mode==="fight";}
 if(h.mode==="waiting"&&(!h.artificial||h.empty)){retrieve(h.empty?"RIMETTI L'ESCA E RILANCIA":"LENZA RITIRATA");return false;}
 return true;// combattimento o recupero dell'artificiale: si tiene premuto
}
let canvasPointer=null,reelPointer=null;
canvas.addEventListener("pointerdown",ev=>{
 if(G.phase!=="playing"||G.modalOpen)return;ev.preventDefault();audio();
 const h=G.hook,p=lakePoint(ev);
 if(h.mode==="fight"){G.hold.canvas=true;canvasPointer={id:ev.pointerId,x0:ev.clientX};try{canvas.setPointerCapture(ev.pointerId);}catch(e){}return;}
 if(h.mode==="nibble"||h.mode==="bite"){strike();if(G.hook.mode==="fight"){G.hold.canvas=true;canvasPointer={id:ev.pointerId,x0:ev.clientX};try{canvas.setPointerCapture(ev.pointerId);}catch(e){}}return;}
 G.aim=p;G.aimVisible=true;cast(p.x,p.y);
});
canvas.addEventListener("pointermove",ev=>{
 if(canvasPointer&&ev.pointerId===canvasPointer.id){const dx=ev.clientX-canvasPointer.x0;G.input.drag=Math.abs(dx)>22?Math.sign(dx):0;return;}
 if(G.phase==="playing"&&ev.pointerType==="mouse"&&(G.hook.mode==="idle"||G.hook.mode==="waiting")){G.aim=lakePoint(ev);G.aimVisible=true;}
});
function endCanvas(ev){if(canvasPointer&&(!ev||ev.pointerId===canvasPointer.id)){canvasPointer=null;G.hold.canvas=false;G.input.drag=0;}}
canvas.addEventListener("pointerup",endCanvas);canvas.addEventListener("pointercancel",endCanvas);
ui.reel.addEventListener("pointerdown",ev=>{
 ev.preventDefault();audio();
 if(!mainPress(false))return;
 G.hold.btn=true;ui.reel.classList.add("active");reelPointer={id:ev.pointerId,x0:ev.clientX};try{ui.reel.setPointerCapture(ev.pointerId);}catch(e){}
});
ui.reel.addEventListener("pointermove",ev=>{if(reelPointer&&ev.pointerId===reelPointer.id){const dx=ev.clientX-reelPointer.x0;G.input.drag=Math.abs(dx)>20?Math.sign(dx):0;}});
function endReel(ev){if(reelPointer&&(!ev||ev.pointerId===reelPointer.id)){reelPointer=null;G.hold.btn=false;G.input.drag=0;ui.reel.classList.remove("active");}}
ui.reel.addEventListener("pointerup",endReel);ui.reel.addEventListener("pointercancel",endReel);ui.reel.addEventListener("lostpointercapture",endReel);
ui.reel.addEventListener("contextmenu",ev=>ev.preventDefault());
for(const [el,dir] of [[ui.left,-1],[ui.right,1]]){
 el.addEventListener("pointerdown",ev=>{ev.preventDefault();if(el.disabled)return;G.input.btn=dir;el.classList.add("active");try{el.setPointerCapture(ev.pointerId);}catch(e){}});
 const up=()=>{if(G.input.btn===dir)G.input.btn=0;el.classList.remove("active");};
 el.addEventListener("pointerup",up);el.addEventListener("pointercancel",up);el.addEventListener("lostpointercapture",up);el.addEventListener("contextmenu",ev=>ev.preventDefault());
}
const ARROWS={arrowleft:[-1,0],arrowright:[1,0],arrowup:[0,-1],arrowdown:[0,1],a:[-1,0],d:[1,0],w:[0,-1],s:[0,1]};
window.addEventListener("keydown",ev=>{
 const k=(ev.key||"").toLowerCase();
 if(G.modalOpen){if(k==="escape"&&!ui.modalClose.hidden){ev.preventDefault();closeModal(false);}return;}
 if(ev.code==="Space"||k==="enter"){
  if(ev.target&&ev.target.tagName==="BUTTON"&&ev.target!==canvas&&G.phase!=="playing")return;
  ev.preventDefault();if(ev.repeat)return;audio();
  if(G.phase!=="playing"){const b=ui.menu.querySelector("button");if(b&&!ui.shade.classList.contains("hidden"))b.click();return;}
  if(mainPress(true))G.hold.key=true;else if(G.hook.mode==="fight")G.hold.key=true;
  return;
 }
 if(G.phase!=="playing")return;
 if(ARROWS[k]){
  ev.preventDefault();
  if(G.hook.mode==="fight"){if(ARROWS[k][0])G.input.key=ARROWS[k][0];}
  else{G.aim={x:clamp(G.aim.x+ARROWS[k][0]*32,30,770),y:clamp(G.aim.y+ARROWS[k][1]*32,WATER_TOP+14,745)};G.aimVisible=true;}
  return;
 }
 if(k==="b")cycleBait();
 else if(k==="f")cycleDrag();
 else if(k==="escape"||k==="p"&&G.mode!=="career")pauseGame();
 else if(G.mode==="career"&&G.hook.mode!=="fight"){if(k==="m")openMap();else if(k==="g"||k==="i")openCooler();else if(k==="n")openShop(false);else if(k==="c")openOrders();else if(k==="p")openDex();}
});
window.addEventListener("keyup",ev=>{const k=(ev.key||"").toLowerCase();if(ev.code==="Space"||k==="enter")G.hold.key=false;if(ARROWS[k]&&ARROWS[k][0]&&G.input.key===ARROWS[k][0])G.input.key=0;});
window.addEventListener("blur",resetHolds);
document.addEventListener("visibilitychange",()=>{if(document.hidden){resetHolds();saveCareer();if(G.phase==="playing"&&!G.modalOpen)pauseGame();}});
ui.sound.addEventListener("click",()=>{G.mute=!G.mute;ui.sound.textContent=G.mute?"♫ Audio OFF":"♫ Audio ON";savePrefs();if(!G.mute)note(620,.09,"triangle",.03);});
ui.chipBait.addEventListener("click",cycleBait);
ui.chipDrag.addEventListener("click",cycleDrag);
ui.chipMap.addEventListener("click",()=>{if(G.hook.mode!=="fight")openMap();});
ui.chipCooler.addEventListener("click",()=>{if(G.hook.mode!=="fight")openCooler();});
ui.chipShop.addEventListener("click",()=>{if(G.hook.mode!=="fight")openShop(false);});
ui.chipOrders.addEventListener("click",()=>{if(G.hook.mode!=="fight")openOrders();});
ui.chipDex.addEventListener("click",()=>{if(G.hook.mode!=="fight")openDex();});
ui.chipKarma.addEventListener("click",()=>{const c=career();if(!c)return;openModal({kicker:"EFFETTO KARMAGRA",title:"Karma: "+c.karma,body:"<p>Ogni pesce liberato, ogni rifiuto tolto dall'acqua e ogni specie protetta rimessa in mare aumentano il karma.</p><p>Più karma hai, più spesso compaiono i pesci rari e le <b>varianti Karmagra</b>: esemplari viola e luminosi che valgono il triplo. Anche la sfortuna conta: dopo tante catture normali, una variante diventa sempre più probabile.</p><p>Tenere pesci sotto misura invece costa caro: se arriva la Guardia Costiera, multa e karma in calo.</p>",actions:[{label:"OK"}]});});

/* ---------- ciclo principale ---------- */
function update(dt){
 if(G.mode==="career")updateClock(dt);
 else if(G.mode==="arcade"){
  const a=G.arcade;a.seconds=Math.max(0,a.seconds-dt);a.frenzyT-=dt;
  if(a.frenzyT<=0){a.frenzyT=rnd(18,28);maybeFrenzy(true);}
  if(G.frenzy&&G.frenzy.untilS!=null&&a.seconds<G.frenzy.untilS){G.frenzy=null;G.gulls=[];}
  if(a.seconds<=0){finishArcade();return;}
 }
 if(G.phase!=="playing"||G.modalOpen)return;
 updateFish(dt);updateHook(dt);if(G.fight)updateFight(dt);
 G.spawnAcc+=dt;if(G.spawnAcc>5){G.spawnAcc=0;topUpPopulation();}
 melody();
}
function frame(now){
 const dt=clamp((now-G.last)/1000||0,0,.05);G.last=now;G.elapsed+=dt;
 if(G.phase==="playing"&&!G.modalOpen)update(dt);
 else if(G.phase==="menu"){updateFish(dt*.6);}
 updateFx(dt);
 render();refreshUI();
 requestAnimationFrame(frame);
}
loadBest();loadPrefs();ui.sound.textContent=G.mute?"♫ Audio OFF":"♫ Audio ON";
showMenu();requestAnimationFrame(frame);
// per i test automatici in un browser vero
window.PESCA_GAME={state:G,startCareer,startArcade,showMenu,cast,strike,openShop,openMap,openCooler,openOrders,openDex,travel,spendTime};
})();
