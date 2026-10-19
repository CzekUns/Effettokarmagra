/* PESCA GROSSA 2.0 — input, pannelli e ciclo di gioco.
 * Regole in rules.js (PESCA_RULES), disegno in art.js (PESCA_ART). */
(function(){
"use strict";
const R=window.PESCA_RULES,ART=window.PESCA_ART;
const W=800,H=760,WATER_TOP=214,TIP0={x:446,y:228},HAND={x:432,y:152};
const SAVE_KEY="biagio-pesca-carriera-v1",RECORD_KEY="biagio-pesca-record",PREFS_KEY="biagio-pesca-prefs";
const ARCADE_SECONDS=90,ARCADE_HOUR=7.2;
const ARCADE_GEAR={rod:"bolognese",reel:"frontale",line:"nylon20"};
const ARCADE_BAITS=["bigattini","pane","verme"];
const PAGE_URL="https://czekuns.github.io/Effettokarmagra/games/pesca-grossa/";
const WICON={sereno:"sun",nuvoloso:"cloud",vento:"wind",pioggia:"rain",nebbia:"fog",burrasca:"storm"};
const $=id=>document.getElementById(id);
const canvas=$("lake");
const ui={hudLI:$("hud-l-icon"),hudLL:$("hud-l-label"),hudL:$("hud-l"),hudMI:$("hud-m-icon"),hudML:$("hud-m-label"),hudM:$("hud-m"),hudRI:$("hud-r-icon"),hudRL:$("hud-r-label"),hudR:$("hud-r"),
 shade:$("shade"),kicker:$("kicker"),headline:$("headline"),message:$("message"),facts:$("facts"),menu:$("menu-actions"),share:$("share-score"),shareHint:$("share-hint"),toasts:$("toasts"),
 sound:$("sound"),soundIcon:$("sound-icon"),reel:$("reel"),left:$("side-left"),right:$("side-right"),status:$("status"),tip:$("tip"),
 tension:$("tension-bar"),tensionNum:$("tension-num"),dragMark:$("drag-mark"),line:$("line-bar"),lineNum:$("line-num"),stamina:$("stamina-bar"),staminaNum:$("stamina-num"),
 baitBtn:$("bait-btn"),baitName:$("bait-name"),baitCount:$("bait-count"),dragSeg:$("drag-seg"),toolbar:$("toolbar"),
 tbMap:$("tb-map"),spotName:$("spot-name"),tbCooler:$("tb-cooler"),coolerLoad:$("cooler-load"),tbShop:$("tb-shop"),tbOrders:$("tb-orders"),ordersCount:$("orders-count"),tbDex:$("tb-dex"),dexCount:$("dex-count"),tbKarma:$("tb-karma"),karmaNum:$("karma-num"),
 modal:$("modal"),modalIcon:$("modal-icon"),modalKicker:$("modal-kicker"),modalTitle:$("modal-title"),modalBody:$("modal-body"),modalFoot:$("modal-foot"),modalClose:$("modal-close")};
const clamp=R.clamp,rnd=(a,b)=>a+Math.random()*(b-a),dist=(x,y,a,b)=>Math.hypot(x-a,y-b);
const euro=v=>(Math.round(v*100)/100).toLocaleString("it-IT",{minimumFractionDigits:v%1?2:0,maximumFractionDigits:2})+" €";
const num=v=>String(v).replace(".",",");
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const ic=(n,cls)=>'<svg class="ic'+(cls?" "+cls:"")+'" aria-hidden="true"><use href="#i-'+n+'"/></svg>';

const G={mode:"menu",phase:"menu",career:null,arcade:null,spot:"lago",weather:"sereno",wind:{x:.8,y:.6},
 fish:[],hook:{mode:"idle"},fight:null,input:{key:0,btn:0,drag:0},hold:{key:false,btn:false,canvas:false},
 aim:{x:400,y:440},aimVisible:false,frenzy:null,gulls:[],ripples:[],splashes:[],texts:[],drops:[],castAnim:0,
 elapsed:0,last:0,mute:false,actx:null,lastHour:-1,ageAcc:0,spawnAcc:0,sfxDrag:0,reelClick:0,lastMusic:-1,
 today:null,modalOpen:false,modalOnClose:null,pendingDayEnd:false,best:0,shopTab:"esche",skin:"base",style:"vettoriale",trophy:null,mood:null};

/* ---------- salvataggi ---------- */
function loadCareer(){try{const raw=localStorage.getItem(SAVE_KEY);return raw?R.migrateSave(JSON.parse(raw)):null;}catch(e){return null;}}
function saveCareer(){if(!G.career)return;try{localStorage.setItem(SAVE_KEY,JSON.stringify(G.career));}catch(e){}}
function loadBest(){try{G.best=Math.max(0,Number(localStorage.getItem(RECORD_KEY)||0)||0);}catch(e){}}
function saveBest(){try{localStorage.setItem(RECORD_KEY,String(G.best));}catch(e){}}
function loadPrefs(){try{const p=JSON.parse(localStorage.getItem(PREFS_KEY)||"{}");G.mute=!!p.mute;if(ART.SKINS[p.skin])G.skin=p.skin;if(ART.STYLES[p.style])G.style=p.style;}catch(e){}}
function savePrefs(){try{localStorage.setItem(PREFS_KEY,JSON.stringify({mute:G.mute,skin:G.skin,style:G.style}));}catch(e){}}

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
function weatherIcon(w){return w==="sereno"&&isNight()?"moon":WICON[w];}
function tipPos(){
 let x=TIP0.x+sideInput()*16,y=TIP0.y;const f=G.fight;
 if(G.castAnim>0){const k=Math.sin((1-G.castAnim)*Math.PI);x-=8*k;y-=100*k;}
 if(f){const r=Math.min(1.2,f.tension/f.line.limit),a=Math.atan2(f.screenY-TIP0.y,f.screenX-TIP0.x);x+=Math.cos(a)*r*12;y+=Math.sin(a)*r*12;}
 return{x,y};
}
const VIEW={hour:hourNow,tip:tipPos,rangePx:rodRangePx,hand:HAND,get skin(){return G.skin;},get style(){return G.style;},get trophy(){return G.trophy;},get mood(){return G.mood;},get reeling(){return reelHeld()&&(!!G.fight||G.hook.mode==="waiting"&&!!G.hook.artificial);},get night(){return isNight()?1:0;},get lantern(){return hasExtra("lanterna");},get sonar(){return hasExtra("ecoscandaglio");}};

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

/* ---------- effetti e avvisi ---------- */
function toast(msg,o){
 o=o||{};const el=document.createElement("div");el.className="toast"+(o.tone?" "+o.tone:"");
 el.innerHTML=(o.icon?ic(o.icon):"")+"<span>"+esc(msg)+"</span>";ui.toasts.appendChild(el);
 while(ui.toasts.children.length>2)ui.toasts.firstElementChild.remove();
 setTimeout(()=>{el.classList.add("out");setTimeout(()=>el.remove(),380);},(o.life||1.8)*1000);
}
function shout(msg,life,icon,tone){toast(msg,{life,icon,tone});}
function floatText(x,y,text,color){G.texts.push({x,y,text,color:color||"#fff0b7",life:1.4});}
function ripple(x,y,color){G.ripples.push({x,y,r:4,life:1.2,color:color||"#dcf6e7"});}
function splash(x,y,size){for(let i=0;i<10;i++)G.splashes.push({x,y,vx:rnd(-70,70)*(size||1),vy:rnd(-150,-50)*(size||1),life:rnd(.35,.75),r:rnd(1.6,3.6)*(size||1)});}
function updateFx(dt){
 for(const r of G.ripples){r.r+=dt*48;r.life-=dt;}G.ripples=G.ripples.filter(r=>r.life>0);
 for(const s of G.splashes){s.x+=s.vx*dt;s.y+=s.vy*dt;s.vy+=320*dt;s.life-=dt;}G.splashes=G.splashes.filter(s=>s.life>0);
 for(const t of G.texts){t.y-=34*dt;t.life-=dt;}G.texts=G.texts.filter(t=>t.life>0);
 const wx=R.WEATHER[G.weather],rain=G.weather==="pioggia"?70:G.weather==="burrasca"?140:0;
 while(G.drops.length<rain)G.drops.push({x:rnd(0,W),y:rnd(-H,0),v:rnd(520,760)});
 if(G.drops.length>rain)G.drops.length=rain;
 for(const d of G.drops){d.y+=d.v*dt;d.x+=G.wind.x*wx.wind*140*dt;if(d.y>H){d.y=rnd(-60,0);d.x=rnd(-40,W);if(Math.random()<.35)G.ripples.push({x:d.x,y:rnd(WATER_TOP,H),r:1,life:.45,color:"#d9f2ff"});}}
 if(G.fight&&G.fight.tele)G.fight.tele.life-=dt;
 G.castAnim=Math.max(0,G.castAnim-dt*2.4);
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
  shout("Mangianza! I gabbiani si tuffano",2.2,"sparkle","good");return;
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
 if(G.trophy){if(G.mode==="career")return;G.trophy=null;}
 const h=G.hook;if(h.mode==="fight"||h.mode==="casting")return;
 if(h.mode==="nibble"||h.mode==="bite"){strike();return;}
 const bait=baitNow();
 if(!(baitLeft(bait)>0)){shout("Esca finita: cambiala o passa in bottega",2,"worm","bad");return;}
 releaseInterest();
 let dx=x-TIP0.x,dy=y-TIP0.y,len=Math.hypot(dx,dy);const max=rodRangePx();
 if(len>max){dx*=max/len;dy*=max/len;len=max;}
 const w=R.WEATHER[G.weather].wind,k=len/max,jit=(5+w*12)*k;
 const tx=clamp(TIP0.x+dx+G.wind.x*w*26*k+rnd(-jit,jit),30,770),ty=clamp(TIP0.y+dy+G.wind.y*w*26*k+rnd(-jit,jit),WATER_TOP+14,745);
 G.hook={mode:"casting",x:TIP0.x,y:TIP0.y,fromX:TIP0.x,fromY:TIP0.y,destX:tx,destY:ty,t:0,arc:0,bait,artificial:R.BAITS[bait].kind==="artificiale",empty:false,fish:null,junk:null};
 G.aim={x:clamp(x,30,770),y:clamp(y,WATER_TOP+14,745)};G.aimVisible=false;G.castAnim=1;
 const c=career();if(c)c.stats.casts++;
 sfx.cast();
}
function autoCast(){
 const max=rodRangePx();
 const options=G.fish.filter(f=>!f.leaving&&f.state==="wander"&&dist(f.x,f.y,TIP0.x,TIP0.y)<=max).sort((a,b)=>dist(a.x,a.y,TIP0.x,TIP0.y)-dist(b.x,b.y,TIP0.x,TIP0.y));
 const t=options[0];if(t)cast(t.x+t.vx*.6,t.y);else cast(G.aim.x,G.aim.y);
}
function releaseInterest(){for(const f of G.fish)if(f.state!=="wander")f.state="wander";}
function retrieve(msg){releaseInterest();G.hook={mode:"idle"};if(msg)shout(msg,1.1,"return");}
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
   if(h.y<WATER_TOP+16||d<62){retrieve("Esca recuperata: rilancia");return;}
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
   if(thief&&!h.artificial&&Math.random()<thief){useBait(h.bait);h.empty=true;fleeHooked(1.5);h.mode="waiting";shout("Ti hanno spolpato l'amo! Ritira e rilancia",1.8,"worm","bad");}
  }else{h.mode="bite";h.biteT=0;h.window=R.biteWindow(h.fish.sp);h.dip=1;sfx.bite();buzz(80);ripple(h.x,h.y,"#ffe9a8");splash(h.x,h.y,.4);}
  return;
 }
 if(h.mode==="bite"){
  h.biteT+=dt;
  if(h.biteT<=h.window)return;
  if(h.junk){h.mode="waiting";h.junk=null;shout("Era solo un peso sul fondo",1.2);return;}
  if(!h.artificial){useBait(h.bait);h.empty=true;shout("Ti ha mangiato l'esca!",1.6,"worm","bad");}
  else shout("Ha sputato l'esca!",1.4,"alert","bad");
  fleeHooked(2.5);h.mode="waiting";
 }
}
function strike(){
 const h=G.hook;
 if(h.mode==="bite"){beginFight(h.biteT<=h.window*.35);return;}
 if(h.mode==="nibble"){
  shout("Troppo presto! Il pesce si è spaventato",1.6,"alert","bad");sfx.strike();
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
 f.baseAngle=Math.atan2(h.y-TIP0.y,h.x-TIP0.x);f.shadow=h.fish||null;f.junk=h.junk||null;f.bait=h.bait;f.size=h.fish?h.fish.size:10;
 f.screenX=h.x;f.screenY=h.y;f.pxPerM=Math.max(4,dist(h.x,h.y,TIP0.x,TIP0.y)/f.dist);
 if(h.fish){const i=G.fish.indexOf(h.fish);if(i>=0)G.fish.splice(i,1);}
 G.fight=f;h.mode="fight";
 shout(h.junk?"Hai agganciato qualcosa...":perfect?"Ferrata perfetta!":"Ferrato!",1.2,"hook",perfect?"good":"");
 sfx.strike();buzz(40);splash(h.x,h.y,.8);telegraph(f.action);ART.shake(perfect?.5:.3);
}
function telegraph(a,last){const f=G.fight;if(!f)return;f.tele={label:last?"ULTIMA FUGA!":R.ACTIONS[a.type].label,type:a.type,dir:a.dir,life:1.4};if(a.type!=="riposo")sfx.action();}
function updateFight(dt){
 const f=G.fight;
 const ev=R.stepFight(f,{reel:reelHeld(),side:sideInput()},dt,Math.random);
 const ang=f.baseAngle+f.lateral*.55,r=clamp(f.dist*f.pxPerM,18,640);
 f.screenX=clamp(TIP0.x+Math.cos(ang)*r,24,776);f.screenY=clamp(TIP0.y+Math.sin(ang)*r,WATER_TOP+10,750);
 if(reelHeld()&&G.elapsed-G.reelClick>.09){G.reelClick=G.elapsed;sfx.reel();}
 for(const e of ev){
  if(e.kind==="action"){telegraph(f.action,e.last);if(f.action.type==="salto"){splash(f.screenX,f.screenY,1.2);ART.shake(.25);}}
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
 sfx.caught(!!sp&&(sp.rarity==="epico"||sp.rarity==="leggendario"));ripple(TIP0.x,TIP0.y+30,"#ffec96");splash(TIP0.x,TIP0.y+30,.7);
 if(sp)G.trophy={sp,size:f.size||14,karmagra:item.karmagra,life:G.mode==="career"?1.1:.8,max:G.mode==="career"?1.1:.8,item};
 if(G.mode==="arcade"){arcadeCatch(item);return;}
 c.stats.catches++;G.today.catches++;
 if(sp)c.pity=item.karmagra?0:Math.min(.25,(c.pity||0)+.004);
 if(!sp)showCatch(item);// il pesce lo mostra Biagio, poi si apre la scheda
}
function onLost(reason,msg){
 const f=G.fight,c=career();
 shout(msg.charAt(0)+msg.slice(1).toLowerCase(),2.2,"alert","bad");sfx.snap();buzz(120);ripple(f.screenX,f.screenY,"#f9a5a2");ART.shake(.9);
 if(R.BAITS[f.bait]&&R.BAITS[f.bait].kind==="artificiale"){if(reason==="snap"||reason==="den"||reason==="spool")loseLure(f.bait);}
 else if(!f.junk)useBait(f.bait);
 if(f.shadow){const s=f.shadow;s.x=clamp(f.screenX,50,750);s.y=clamp(f.screenY,WATER_TOP+30,735);s.state="wander";s.scared=4;s.wary=true;s.fade=1;G.fish.push(s);}
 G.fight=null;G.hook={mode:"idle"};G.mood={type:"sad",life:1.6};
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
 shout((item.karmagra?"Karmagra! ":"")+name+(sp?" "+R.fmtKg(item.weight):"")+" · +"+pts,1.9,item.karmagra?"sparkle":"fish",item.karmagra?"cool":"good");
 floatText(TIP0.x,TIP0.y+40,"+"+pts);
 if(sp)topUpPopulation();
}
function startArcade(){
 G.mode="arcade";G.career=null;G.arcade={score:0,seconds:ARCADE_SECONDS,combo:0,catches:0,bait:"bigattini",drag:"media",frenzyT:rnd(14,22)};
 G.spot="lago";G.weather="sereno";newWind();populate();G.hook={mode:"idle"};G.fight=null;resetHolds();
 hideShade();G.phase="playing";audio();
 shout("90 secondi: via!",1.4,"timer","good");
}
function finishArcade(){
 G.phase="ended";G.fight=null;G.hook={mode:"idle"};resetHolds();releaseInterest();
 if(G.arcade.score>G.best){G.best=G.arcade.score;}saveBest();
 note(294,.22,"triangle",.036);
 showShade("TEMPO SCADUTO","Fine della pesca","Hai fatto "+G.arcade.score+" punti con "+G.arcade.catches+" catture. Il tuo record è "+G.best+".",
  [{label:"PESCA ANCORA",icon:"rod",onClick:startArcade},{label:"MENU",alt:true,onClick:showMenu}],G.arcade.score);
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
 else shout("Bentornato! Giorno "+c.day+", ore "+R.fmtClock(c.minute),2,"clock");
}
function afterTime(mins){
 const c=G.career;G.ageAcc+=mins;
 if(G.ageAcc>=5){R.ageCooler(c,G.ageAcc);G.ageAcc=0;}
 const hr=Math.floor(c.minute/60);
 if(hr!==G.lastHour){G.lastHour=hr;refreshPopulation();maybeFrenzy(false);saveCareer();if(c.minute<R.dayEnd(c)&&R.dayEnd(c)-c.minute<=60)shout("Manca un'ora alla fine della giornata",1.8,"clock");}
 if(G.frenzy&&G.frenzy.until!=null&&c.minute>G.frenzy.until){G.frenzy=null;G.gulls=[];}
}
function spendTime(m){const c=career();if(!c)return;c.minute=Math.min(R.NIGHT_END,c.minute+m);afterTime(m);if(c.minute>=R.dayEnd(c))G.pendingDayEnd=true;}
function updateClock(dt){
 const c=G.career,before=c.minute;
 c.minute=Math.min(R.NIGHT_END,c.minute+dt*R.GAME_MIN_PER_SEC);afterTime(c.minute-before);
 if(c.minute>=R.dayEnd(c))G.pendingDayEnd=true;
 if(G.pendingDayEnd&&!G.fight&&!G.trophy)endOfDay();
}
function endOfDay(){
 const c=G.career;G.pendingDayEnd=false;releaseInterest();G.hook={mode:"idle"};resetHolds();
 const report=R.endDay(c,Math.random);
 sfx.day();
 const gained=c.money-G.today.startMoney;
 let html='<div class="summary">'+
  "<span>Pesci presi oggi</span><span>"+G.today.catches+"</span>"+
  "<span>Pesci persi</span><span>"+G.today.lost+"</span>"+
  "<span>Venduti alla pescheria</span><span>"+report.soldCount+" · "+euro(report.sold)+"</span>"+
  "<span>Commissioni consegnate</span><span>"+G.today.orders+"</span>"+
  (report.inspected?"<span>Multa ("+report.fined+" sotto misura)</span><span>−"+euro(report.fine)+"</span>":"")+
  "<span>Bilancio della giornata</span><span>"+(gained>=0?"+":"")+euro(gained)+"</span>"+
  "<span>In tasca</span><span>"+euro(c.money)+"</span></div>";
 if(report.inspected)html+='<div class="warnbox">'+ic("alert")+"<div>Controllo della Guardia Costiera al rientro: il pescato sotto misura è stato sequestrato. La prossima volta rimettilo in acqua!</div></div>";
 else if(report.soldCount)html+='<div class="infobox">'+ic("cash")+"<div>Cugino Ciro ha pesato tutto al banco della pescheria e ti ha pagato in contanti.</div></div>";
 const fc=R.WEATHER[c.forecast];
 html+='<div class="infobox">'+ic(WICON[c.forecast])+"<div>Previsioni per domani: <b>"+fc.label+"</b>. Titolo: <b>"+esc(R.titleOf(c))+"</b> · Pescepedia "+R.dexCount(c)+"/"+R.SPECIES.length+"</div></div>";
 openModal({icon:"moon",kicker:"GIORNO "+c.day+" · "+R.fmtClock(c.minute),title:"Fine della giornata",body:html,closable:false,
  actions:[{label:"DORMI E SALVA",icon:"moon",onClick:()=>{R.startDay(c,Math.random);G.weather=c.weather;G.spot=c.spot;newWind();newToday();populate();G.lastHour=Math.floor(c.minute/60);saveCareer();showMorning();}}]});
 saveCareer();
}
function showMorning(){
 const c=G.career,w=R.WEATHER[c.weather],fc=R.WEATHER[c.forecast];
 let html='<div class="weather-line"><div>'+ic(WICON[c.weather])+"<div><small>OGGI</small><b>"+w.label+"</b></div></div><div>"+ic(WICON[c.forecast])+"<div><small>DOMANI</small><b>"+fc.label+"</b></div></div></div>";
 html+='<div class="infobox">'+ic("pin")+"<div>Sei a <b>"+esc(R.SPOTS[G.spot].name)+"</b>. "+esc(R.SPOTS[G.spot].blurb)+"</div></div>";
 if(c.weather==="burrasca")html+='<div class="warnbox">'+ic("storm")+"<div>Burrasca: il gozzo resta in porto. Sugli scogli però gira voce di un sarago enorme...</div></div>";
 const open=c.orders.filter(o=>!o.done);
 if(open.length)html+='<div class="infobox">'+ic("scroll")+"<div>Hai <b>"+open.length+"</b> commissioni aperte sulla bacheca del pontile.</div></div>";
 if(c.day===1)html+='<ol class="howto">'+
  "<li>Tocca l'acqua per lanciare, oppure premi LANCIA.</li>"+
  "<li>Il galleggiante trema: aspetta. Quando va <b>sotto</b>, ferra subito.</li>"+
  "<li>Tieni premuto RECUPERA, ma molla quando la tensione va sul rosso.</li>"+
  "<li>Il pesce tira a destra? Piega la canna a <b>sinistra</b> (frecce o scorri il dito): si stanca prima.</li>"+
  "<li>SALTO: non recuperare. STANCO: recupera. TANA: tieni la lenza tesa.</li>"+
  "<li>Ogni pesce ha orari, esche e profondità preferite: scoprili nella Pescepedia.</li></ol>";
 openModal({icon:WICON[c.weather],kicker:"GIORNO "+c.day+" · "+R.fmtClock(c.minute),title:"Buongiorno, Biagio!",body:html,closable:false,
  actions:[{label:"Bottega",icon:"shop",alt:true,onClick:()=>openShop(true,showMorning)},{label:"Mappa",icon:"map",alt:true,onClick:()=>openMap(showMorning)},{label:"SI PESCA",icon:"rod",onClick:()=>{}}]});
}

/* ---------- pannelli ---------- */
function openModal(o){
 G.modalOpen=true;resetHolds();
 ui.modalIcon.innerHTML=ic(o.icon||"fish");
 ui.modalKicker.textContent=o.kicker||"";ui.modalTitle.textContent=o.title||"";
 ui.modalBody.innerHTML="";ui.modalBody.onclick=null;
 if(typeof o.body==="string")ui.modalBody.innerHTML=o.body;else if(o.body)ui.modalBody.appendChild(o.body);
 if(o.onBodyClick)ui.modalBody.onclick=o.onBodyClick;
 ui.modalFoot.innerHTML="";
 for(const a of o.actions||[]){
  const b=document.createElement("button");b.type="button";b.className="btn"+(a.alt?" alt":"")+(a.ghost?" ghost":"");b.innerHTML=(a.icon?ic(a.icon):"")+esc(a.label);b.disabled=!!a.disabled;
  b.addEventListener("click",()=>{closeModal(true);if(a.onClick)a.onClick();});ui.modalFoot.appendChild(b);
 }
 ui.modalFoot.hidden=!(o.actions&&o.actions.length);
 ui.modalClose.hidden=o.closable===false;
 G.modalOnClose=o.onClose||null;
 ui.modal.hidden=false;ui.modalBody.scrollTop=0;
 hydrateThumbs(ui.modalBody);
 const first=ui.modalFoot.querySelector(".btn:not(.alt):not(.ghost):not(:disabled)")||ui.modalFoot.querySelector("button:not(:disabled)")||ui.modalClose;try{first.focus({preventScroll:true});}catch(e){}
}
function closeModal(fromAction){
 ui.modal.hidden=true;G.modalOpen=false;G.last=0;
 const cb=G.modalOnClose;G.modalOnClose=null;if(!fromAction&&cb)cb();
}
ui.modalClose.addEventListener("click",()=>closeModal(false));
ui.modal.addEventListener("click",ev=>{if(ev.target===ui.modal&&!ui.modalClose.hidden)closeModal(false);});
/* miniature dei pesci nelle righe: <span class="thumb" data-fish="id" data-kg="1"> */
function hydrateThumbs(root){
 for(const el of root.querySelectorAll("[data-fish]")){
  const sp=R.SPECIES_BY_ID[el.dataset.fish];if(!sp)continue;
  const cv=document.createElement("canvas");cv.width=120;cv.height=120;cv.style.width="100%";cv.style.height="100%";cv.style.borderRadius="12px";
  ART.drawArt(cv,sp,{karmagra:el.dataset.kg==="1",silhouette:el.dataset.sil==="1"});el.textContent="";el.appendChild(cv);el.removeAttribute("data-fish");
 }
}
function rarityTag(sp){return '<span class="tag r-'+sp.rarity+'">'+R.RARITY[sp.rarity].label.toUpperCase()+"</span>";}
function stars(q){return '<span class="stars">'+"★".repeat(q)+"☆".repeat(3-q)+"</span>";}
function fame(c){const lv=R.repLevel(c.rep);return "★".repeat(lv)+"☆".repeat(4-lv);}
function releaseKarma(sp,item){let k={comune:1,noncomune:1,raro:2,epico:4,leggendario:8}[sp.rarity]||1;if(R.isUndersize(sp,item))k+=1;if(sp.protected)k+=2;if(sp.id==="pesce_oro")k+=4;return k;}

function showCatch(item){
 const c=G.career,sp=R.SPECIES_BY_ID[item.species];
 if(!sp){showFound(item);return;}
 const rec=R.recordCatch(c,item),value=R.fishValue(item),under=R.isUndersize(sp,item),space=R.coolerSpace(c),karma=releaseKarma(sp,item);
 let tags=rarityTag(sp);
 if(rec.isNew)tags+='<span class="tag good">'+ic("book")+"NUOVA SPECIE</span>";
 if(rec.record)tags+='<span class="tag good">'+ic("trophy")+"NUOVO RECORD</span>";
 if(item.karmagra)tags+='<span class="tag kg">'+ic("sparkle")+"VARIANTE KARMAGRA ×3</span>";
 if(sp.protected)tags+='<span class="tag bad">SPECIE PROTETTA</span>';
 if(under)tags+='<span class="tag bad">SOTTO MISURA · MIN '+sp.min+" CM</span>";
 const rarVar=item.karmagra?"var(--violet)":"var(--r-"+sp.rarity+")";
 const body=document.createElement("div");
 body.innerHTML='<div class="card'+(sp.rarity!=="comune"||item.karmagra?" glow":"")+'" style="--rar:'+rarVar+'"><div class="card-in"><canvas width="640" height="300"></canvas>'+
  '<div class="card-title"><strong>'+esc(sp.name)+"</strong><em>"+esc(sp.latin.split(" (")[0])+"</em></div>"+
  '<div class="stats"><div><small>PESO</small><b>'+R.fmtKg(item.weight)+"</b></div><div><small>LUNGHEZZA</small><b>"+item.len.toFixed(0)+' cm</b></div><div><small>QUALITÀ</small><b class="stars">'+"★".repeat(item.quality)+"☆".repeat(3-item.quality)+"</b></div><div><small>VALORE</small><b>"+(sp.protected?"—":euro(value))+"</b></div></div>"+
  '<div class="chipline">'+tags+"</div></div></div>"+
  '<p class="note">'+esc(sp.note)+"</p>"+
  (sp.protected?'<div class="infobox">'+ic("karma")+"<div>Si fotografa e si rimette in acqua: niente vendita, ma tanto karma.</div></div>":"")+
  (under?'<div class="warnbox">'+ic("alert")+"<div>È sotto la misura minima. Se lo tieni rischi la multa della Guardia Costiera e la pescheria non lo compra.</div></div>":"")+
  (!sp.protected&&space<item.weight?'<div class="warnbox">'+ic("cooler")+"<div>La ghiacciaia è piena ("+R.fmtKg(R.coolerLoad(c))+"): vendi il pescato o rilascia.</div></div>":"");
 ART.drawArt(body.querySelector("canvas"),sp,{karmagra:item.karmagra});
 const keep=()=>{c.cooler.push(item);saveCareer();shout(sp.name+" in ghiacciaia",1.4,"cooler");};
 const release=()=>{c.karma+=karma;c.stats.released++;floatText(TIP0.x,TIP0.y+50,"+"+karma+" karma","#d6c2ff");ripple(TIP0.x,TIP0.y+40,"#c9b6ff");saveCareer();shout("Rilasciato: +"+karma+" karma",1.5,"karma","cool");};
 const actions=sp.protected?[{label:"RILASCIA · +"+karma+" KARMA",icon:"karma",onClick:release}]:
  [{label:"TIENI",icon:"cooler",disabled:space<item.weight,onClick:keep},{label:"RILASCIA · +"+karma+" KARMA",icon:"karma",alt:true,onClick:release}];
 if(!sp.protected&&space<item.weight)actions.push({label:"VENDI TUTTO E TIENI (+30 min)",icon:"cash",ghost:true,onClick:()=>{const s=R.sellCooler(c);sfx.cash();spendTime(30);c.cooler.push(item);saveCareer();shout("Pescheria: +"+euro(s.total),1.8,"cash","good");}});
 openModal({icon:item.karmagra?"sparkle":"fish",kicker:rec.isNew?"NUOVA SPECIE IN PESCEPEDIA!":rec.record?"NUOVO RECORD PERSONALE!":"PESCE PRESO!",title:item.karmagra?"Variante Karmagra!":"Che pesce!",body,closable:false,actions});
 saveCareer();
}
function showFound(item){
 const c=G.career,def=R.ITEMS_BY_ID[item.species];
 c.collection[def.id]=(c.collection[def.id]||0)+1;
 let html="";
 if(def.kind==="rifiuto"){c.karma+=def.karma;html='<div class="infobox">'+ic("karma")+"<div>Lo porti al bidone della differenziata. Il lago ringrazia: <b>+"+def.karma+" karma</b>.</div></div>";}
 else{
  c.money=Math.round((c.money+def.value)*100)/100;c.stats.earned+=def.value;sfx.cash();
  html='<div class="infobox">'+ic("cash")+"<div>Il rigattiere di Pozzuoli te lo compra subito: <b>+"+euro(def.value)+"</b>.</div></div>";
  if(def.id==="bottiglia"){
   const legends=R.SPECIES.filter(s=>s.legend&&!c.legendHints.includes(s.id)&&!(c.dex[s.id]&&c.dex[s.id].count));
   if(legends.length){const s=legends[Math.floor(Math.random()*legends.length)];c.legendHints.push(s.id);html+="<p>Dentro c'è un foglietto arrotolato:</p><div class=\"legend\">"+esc(s.legend)+"</div><p>La leggenda è stata annotata nella Pescepedia.</p>";}
   else html+="<p>Dentro c'è solo un biglietto: «Saluti da Ischia».</p>";
  }
  if(def.id==="anfora")html+="<p>Viene dalla città romana sommersa di Baia. Il Prof. Vincenzo sarebbe orgoglioso.</p>";
 }
 openModal({icon:def.id==="bottiglia"?"bottle":def.kind==="rifiuto"?"karma":"sparkle",kicker:def.kind==="rifiuto"?"RIFIUTO RECUPERATO":"TESORO!",title:def.name,body:html,closable:false,actions:[{label:"CONTINUA"}]});
 saveCareer();
}
const EXTRA_ICON={guadino:"net",lanterna:"lantern",ecoscandaglio:"sonar",cumana:"train",scooter:"scooter",gozzo:"boat"};
const SLOT_ICON={rod:"rod",reel:"reel",line:"line",cooler:"cooler"};
function openShop(free,back){
 const c=career();if(!c)return;
 if(!free)spendTime(20);
 const tabs=[["esche","Esche","worm"],["rod","Canne","rod"],["reel","Mulinelli","reel"],["line","Lenze","line"],["cooler","Ghiacciaie","cooler"],["extra","Extra","sparkle"]];
 const render=()=>{
  let html='<div class="wallet"><span>'+ic("coin")+euro(c.money)+"</span><span>"+ic("star")+"Fama "+fame(c)+" · "+c.rep+" punti</span></div>";
  html+='<div class="tabs">'+tabs.map(t=>'<button type="button" data-tab="'+t[0]+'" class="'+(G.shopTab===t[0]?"on":"")+'">'+ic(t[2])+t[1]+"</button>").join("")+"</div>";
  const row=(icon,name,desc,meta,btn)=>'<div class="row"><span class="thumb">'+ic(icon)+'</span><div class="info"><strong>'+esc(name)+'</strong><div class="meta">'+desc+(meta?"<br>"+meta:"")+'</div></div><div class="side-actions">'+btn+"</div></div>";
  const buyBtn=(id,price)=>{const can=R.canBuy(c,id);return'<button type="button" class="btn small" data-buy="'+id+'" '+(can.ok?"":"disabled")+">"+(can.ok?euro(price):esc(can.why))+"</button>";};
  if(G.shopTab==="esche"){
   for(const id of R.BAIT_ORDER){const b=R.BAITS[id];
    html+=row(b.kind==="artificiale"?"fish":"worm",b.name+(b.kind==="artificiale"?"":" ×"+b.pack),esc(b.hint)+(b.kind==="artificiale"?" Si usa tenendo premuto RECUPERA; si perde solo se la lenza si rompe.":""),"Ne hai: <b>"+(c.baits[id]||0)+"</b>",buyBtn(id,b.price));}
  }else if(G.shopTab==="extra"){
   for(const id of Object.keys(R.EXTRAS)){const e=R.EXTRAS[id];const owned=c.extras.includes(id);
    html+=row(EXTRA_ICON[id]||"sparkle",e.name,esc(e.desc),e.rep?"Serve fama "+e.rep:"",owned?'<button type="button" class="btn small alt" disabled>'+ic("check")+"TUO</button>":buyBtn(id,e.price));}
  }else{
   const slot=G.shopTab;
   for(const g of R.GEAR[slot]){
    const owned=c.owned[slot].includes(g.id),inUse=c.equip[slot]===g.id;
    let meta=slot==="rod"?"Gittata "+g.range+" m · rigidità "+num(g.flex):slot==="reel"?"Recupero "+num(g.speed)+" m/s":slot==="line"?"Carico "+g.limit+" kg · bobina "+g.spool+" m":"Capienza "+g.capacity+" kg · freschezza −"+num(g.decay)+"%/ora";
    if(g.rep)meta+=" · serve fama "+g.rep;
    const btn=inUse?'<button type="button" class="btn small alt" disabled>'+ic("check")+"IN USO</button>":owned?'<button type="button" class="btn small alt" data-equip="'+slot+":"+g.id+'">USA</button>':buyBtn(g.id,g.price);
    html+=row(SLOT_ICON[slot],g.name,esc(g.desc),meta,btn);
   }
  }
  ui.modalBody.innerHTML=html;
 };
 openModal({icon:"shop",kicker:"BOTTEGA DI ZI' PEPPE"+(free?"":" · +20 MIN"),title:"Bottega",body:"",onClose:back||null,
  onBodyClick:ev=>{
   const t=ev.target.closest("button");if(!t)return;
   if(t.dataset.tab){G.shopTab=t.dataset.tab;render();return;}
   if(t.dataset.buy){const r=R.buy(c,t.dataset.buy);if(r.ok){sfx.cash();saveCareer();const ex=R.EXTRAS[t.dataset.buy];if(ex&&ex.unlocks)shout("Nuovo luogo: "+R.SPOTS[ex.unlocks].name,2,"pin","good");}render();return;}
   if(t.dataset.equip){const [slot,id]=t.dataset.equip.split(":");c.equip[slot]=id;saveCareer();render();}
  }});
 render();
}
function openMap(back){
 const c=career();if(!c)return;
 let html='<div class="infobox">'+ic("clock")+"<div>Spostarsi costa tempo. Ogni luogo ha pesci, profondità e orari diversi.</div></div><div style=\"height:10px\"></div>";
 for(const id of R.SPOT_ORDER){
  const s=R.SPOTS[id],open=R.spotUnlocked(c,id),here=G.spot===id,storm=id==="golfo"&&c.weather==="burrasca";
  const need=s.unlock?R.EXTRAS[s.unlock]:null;
  const species=R.SPECIES.filter(sp=>sp.spots.includes(id)),known=species.filter(sp=>c.dex[sp.id]&&c.dex[sp.id].count).length;
  const btn=here?'<button type="button" class="btn small alt" disabled>'+ic("pin")+"SEI QUI</button>":!open?'<button type="button" class="btn small" disabled>'+ic("lock")+esc(need.name)+"</button>":storm?'<button type="button" class="btn small" disabled>'+ic("storm")+"BURRASCA</button>":'<button type="button" class="btn small" data-go="'+id+'">VAI · +'+s.travel+" min</button>";
  html+='<div class="row'+(open?"":" locked")+(here?" current":"")+'"><span class="thumb">'+ic(open?"pin":"lock")+'</span><div class="info"><strong>'+esc(s.name)+'</strong><div class="meta">'+esc(s.blurb)+'</div><div class="chipline"><span class="tag">FONDALE '+num(s.depth[0])+"–"+num(s.depth[1])+' M</span><span class="tag">SPECIE '+known+"/"+species.length+"</span></div></div><div class=\"side-actions\">"+btn+"</div></div>";
 }
 openModal({icon:"map",kicker:"GIORNO "+c.day+" · "+R.fmtClock(c.minute),title:"Mappa del Golfo",body:html,onClose:back||null,
  onBodyClick:ev=>{const t=ev.target.closest("button[data-go]");if(!t)return;travel(t.dataset.go);closeModal(true);if(back)back();}});
}
function travel(id){
 const c=career();if(!c||!R.spotUnlocked(c,id))return;
 releaseInterest();G.hook={mode:"idle"};G.fight=null;
 c.spot=id;G.spot=id;spendTime(R.SPOTS[id].travel);populate();saveCareer();
 shout(R.SPOTS[id].name,1.8,"pin","good");
}
function openCooler(){
 const c=career();if(!c)return;
 const render=()=>{
  const g=R.gearOf(c,"cooler");
  let html='<div class="wallet"><span>'+ic("cooler")+num(R.coolerLoad(c).toFixed(1))+" / "+g.capacity+" kg</span><span>"+ic("clock")+"freschezza −"+num(g.decay)+"%/ora</span></div>";
  if(!c.cooler.length)html+='<div class="infobox">'+ic("fish")+"<div>La ghiacciaia è vuota. A fine giornata Cugino Ciro compra tutto il pescato in regola.</div></div>";
  let total=0;
  c.cooler.forEach((it,i)=>{
   const sp=R.SPECIES_BY_ID[it.species];if(!sp)return;const v=R.fishValue(it),under=R.isUndersize(sp,it);if(!under)total+=v;
   html+='<div class="row"><span class="thumb" data-fish="'+sp.id+'" data-kg="'+(it.karmagra?1:0)+'"></span><div class="info"><strong>'+esc(sp.name)+"</strong> "+stars(it.quality||1)+'<div class="meta">'+R.fmtKg(it.weight)+" · "+it.len.toFixed(0)+" cm · freschezza "+Math.round(it.freshness)+"%</div>"+(under||it.karmagra?'<div class="chipline">'+(under?'<span class="tag bad">SOTTO MISURA</span>':"")+(it.karmagra?'<span class="tag kg">KARMAGRA</span>':"")+"</div>":"")+"</div><div class=\"side-actions\"><b>"+(under?"—":euro(v))+"</b>"+(under?'<button type="button" class="btn small alt" data-free="'+i+'">RILASCIA</button>':"")+"</div></div>";
  });
  if(c.cooler.length)html+='<div class="wallet" style="margin-top:4px"><span>'+ic("cash")+"Valore in regola: "+euro(total)+"</span></div>";
  ui.modalBody.innerHTML=html;hydrateThumbs(ui.modalBody);
 };
 openModal({icon:"cooler",kicker:"PESCATO DI OGGI",title:"Ghiacciaia",body:"",
  onBodyClick:ev=>{const t=ev.target.closest("button[data-free]");if(!t)return;c.cooler.splice(Number(t.dataset.free),1);c.karma+=1;saveCareer();render();},
  actions:[{label:"VENDI ORA (+30 min)",icon:"cash",disabled:!c.cooler.some(it=>R.SPECIES_BY_ID[it.species]&&!R.isUndersize(R.SPECIES_BY_ID[it.species],it)),onClick:()=>{const s=R.sellCooler(c);sfx.cash();spendTime(30);saveCareer();shout("Pescheria: "+s.count+" pesci, +"+euro(s.total),2,"cash","good");}},{label:"CHIUDI",ghost:true}]});
 render();
}
function openOrders(){
 const c=career();if(!c)return;
 const render=()=>{
  let html='<div class="infobox">'+ic("star")+"<div>Consegnare costa 20 minuti. Servono pesci in regola, freschi almeno al 50%. Ogni consegna dà soldi e <b>fama</b>, che sblocca l'attrezzatura migliore.</div></div><div style=\"height:10px\"></div>";
  const list=c.orders.slice().sort((a,b)=>a.done-b.done);
  if(!list.length)html+="<p><i>Nessuna commissione: tornano domattina.</i></p>";
  for(const o of list){
   const npc=R.NPCS.find(n=>n.id===o.npc)||R.NPCS[0],sp=R.SPECIES_BY_ID[o.species];
   const ready=c.cooler.filter(i=>R.orderMatches(o,i)).length,initials=npc.name.replace(/[^A-Za-zÀ-ÿ ]/g,"").split(" ").filter(Boolean).map(w=>w[0]).join("").slice(0,2);
   const btn=o.done?'<button type="button" class="btn small alt" disabled>'+ic("check")+"FATTA</button>":'<button type="button" class="btn small" data-deliver="'+o.id+'" '+(ready>=o.count?"":"disabled")+">CONSEGNA "+Math.min(ready,o.count)+"/"+o.count+"</button>";
   html+='<div class="row'+(o.done?" locked":"")+'"><span class="thumb av">'+esc(initials)+'</span><div class="info"><strong>'+esc(npc.name)+'</strong><div class="meta">«'+esc(npc.line)+'»</div><div class="chipline"><span class="tag">'+o.count+" × "+esc(sp.name.toUpperCase())+'</span><span class="tag">MIN '+R.fmtKg(o.minWeight).toUpperCase()+'</span><span class="tag good">'+euro(o.reward)+" · FAMA +"+o.rep+'</span><span class="tag'+(o.expires===c.day?" bad":"")+'">'+(o.expires===c.day?"SCADE STASERA":"SCADE DOMANI")+"</span></div></div><div class=\"side-actions\">"+btn+"</div></div>";
  }
  ui.modalBody.innerHTML=html;
 };
 openModal({icon:"scroll",kicker:"BACHECA DEL PONTILE",title:"Commissioni",body:"",
  onBodyClick:ev=>{const t=ev.target.closest("button[data-deliver]");if(!t)return;const r=R.deliverOrder(c,t.dataset.deliver);if(r.ok){sfx.cash();spendTime(20);G.today.orders++;saveCareer();shout("Consegnato: +"+euro(r.reward)+" · fama +"+r.rep,2,"check","good");}render();}});
 render();
}
function openDex(){
 const c=career();if(!c)return;
 const n=R.dexCount(c),legends=R.legendsCaught(c),kg=R.SPECIES.filter(s=>c.dex[s.id]&&c.dex[s.id].karmagra).length;
 const body=document.createElement("div");
 body.innerHTML='<div class="wallet"><span>'+ic("book")+n+"/"+R.SPECIES.length+" specie</span><span>"+ic("trophy")+legends+"/5 leggendari</span><span>"+ic("sparkle")+kg+" Karmagra</span></div>"+
  '<div class="progress"><div style="width:'+(n/R.SPECIES.length*100)+'%"></div></div><p style="margin:0 0 12px">Titolo: <b>'+esc(R.titleOf(c))+"</b></p>";
 const grid=document.createElement("div");grid.className="dex-grid";
 for(const sp of R.SPECIES){
  const e=c.dex[sp.id],known=!!(e&&e.count);
  const card=document.createElement("div");card.className="dex-card"+(known?"":" unknown");if(known)card.style.setProperty("--rar","var(--r-"+sp.rarity+")");
  const inner=document.createElement("div");
  const art=document.createElement("canvas");art.width=300;art.height=140;ART.drawArt(art,sp,{silhouette:!known,karmagra:known&&e.karmagra});inner.appendChild(art);
  const spots=sp.spots.map(s=>R.SPOTS[s].short).join(", ");
  let html="<strong>"+(known?esc(sp.name):"???")+"</strong>"+rarityTag(sp)+"<br>";
  if(known){
   const hours=sp.hours.map(w=>String(w[0]).padStart(2,"0")+"–"+String(w[1]).padStart(2,"0")).join(", ");
   const baits=Object.keys(sp.baits).sort((a,b)=>sp.baits[b]-sp.baits[a]).slice(0,3).map(b=>R.BAITS[b].name).join(", ");
   html+="Record <b>"+R.fmtKg(e.best)+"</b> · "+Math.round(e.bestLen)+" cm · presi "+e.count+"<br>Dove: "+spots+" · fondale "+num(sp.depth[0])+"–"+num(sp.depth[1])+" m<br>Orari: "+hours+(sp.only?" · solo con "+sp.only.map(w=>R.WEATHER[w].label.toLowerCase()).join("/"):"")+"<br>Esche: "+esc(baits)+(sp.min?"<br>Misura minima "+sp.min+" cm":"")+(sp.protected?"<br><b>Specie protetta</b>":"")+"<br><i>"+esc(sp.note)+"</i>";
  }else{
   html+="Dove: "+spots;
   if(c.legendHints.includes(sp.id))html+='<div class="legend">'+esc(sp.legend)+"</div>";
  }
  const info=document.createElement("div");info.innerHTML=html;inner.appendChild(info);card.appendChild(inner);grid.appendChild(card);
 }
 body.appendChild(grid);
 const col=document.createElement("div");
 const found=R.ITEMS.filter(i=>c.collection[i.id]);
 col.innerHTML='<div class="infobox" style="margin-top:14px">'+ic("bottle")+"<div><b>Collezione:</b> "+(found.length?found.map(i=>esc(i.name)+" ×"+c.collection[i.id]).join(" · "):"niente, per ora.")+"</div></div>"+
  '<div class="infobox">'+ic("chart")+"<div><b>Statistiche:</b> giorni "+(c.stats.days+1)+" · lanci "+c.stats.casts+" · catture "+c.stats.catches+" · persi "+c.stats.lost+" · liberati "+c.stats.released+" · guadagnati "+euro(c.stats.earned)+" · multe "+euro(c.stats.fines)+"</div></div>";
 body.appendChild(col);
 openModal({icon:"book",kicker:"IL QUADERNO DI BIAGIO",title:"Pescepedia",body});
}
function openKarma(){
 const c=career();if(!c)return;
 openModal({icon:"karma",kicker:"EFFETTO KARMAGRA",title:"Karma: "+c.karma,body:
  '<div class="infobox">'+ic("karma")+"<div>Ogni pesce liberato, ogni rifiuto tolto dall'acqua e ogni specie protetta rimessa in mare aumentano il karma.</div></div>"+
  '<div class="infobox">'+ic("sparkle")+"<div>Più karma hai, più spesso compaiono i pesci rari e le <b>varianti Karmagra</b>: esemplari viola e luminosi che valgono il triplo. Anche la sfortuna conta: dopo tante catture normali, una variante diventa sempre più probabile.</div></div>"+
  '<div class="warnbox">'+ic("alert")+"<div>Tenere pesci sotto misura invece costa caro: se arriva la Guardia Costiera, multa e karma in calo.</div></div>",
  actions:[{label:"OK"}]});
}
function openBaits(){
 const c=career();if(!c){cycleBait();return;}
 const render=()=>{
  const own=R.BAIT_ORDER.filter(id=>(c.baits[id]||0)>0);
  let html="";
  if(!own.length)html='<div class="warnbox">'+ic("worm")+"<div>Niente esche: passa in bottega.</div></div>";
  for(const id of own){const b=R.BAITS[id],on=c.bait===id;
   html+='<div class="row'+(on?" current":"")+'"><span class="thumb">'+ic(b.kind==="artificiale"?"fish":"worm")+'</span><div class="info"><strong>'+esc(b.name)+'</strong><div class="meta">'+esc(b.hint)+'</div></div><div class="side-actions"><b>×'+c.baits[id]+"</b>"+(on?'<button type="button" class="btn small alt" disabled>'+ic("check")+"IN USO</button>":'<button type="button" class="btn small" data-bait="'+id+'">USA</button>')+"</div></div>";}
  ui.modalBody.innerHTML=html;
 };
 openModal({icon:"worm",kicker:"SCATOLA DELLE ESCHE",title:"Esche",body:"",onBodyClick:ev=>{const t=ev.target.closest("button[data-bait]");if(!t)return;setBait(t.dataset.bait);closeModal(true);}});
 render();
}

function openWardrobe(){
 let tab=G.style,live=true;const t0=performance.now();let cards=[];
 const body=document.createElement("div");
 const render=()=>{
  body.innerHTML='<div class="tabs">'+Object.keys(ART.STYLES).map(s=>'<button type="button" data-style="'+s+'" class="'+(tab===s?"on":"")+'">'+ic(s==="pixel"?"sparkle":"shirt")+ART.STYLES[s]+"</button>").join("")+'</div><div class="skins"></div>';
  const wrap=body.querySelector(".skins");cards=[];
  for(const id of Object.keys(ART.SKINS)){
   const s=ART.SKINS[id],on=G.skin===id&&G.style===tab,card=document.createElement("div");card.className="skin-card"+(on?" on":"")+(tab==="pixel"?" px":"");
   const cv=document.createElement("canvas");cv.width=380;cv.height=420;card.appendChild(cv);
   const info=document.createElement("div");info.innerHTML="<strong>"+esc(s.name)+"</strong><p>"+esc(s.desc)+"</p>";
   const b=document.createElement("button");b.type="button";b.className="btn small"+(on?" alt":"");b.dataset.skin=id;b.innerHTML=on?ic("check")+"INDOSSATA":"INDOSSA";
   info.appendChild(b);card.appendChild(info);wrap.appendChild(card);cards.push({id,cv});
  }
 };
 const loop=now=>{if(!live||ui.modal.hidden)return;for(const k of cards)ART.drawSkinPreview(k.cv,k.id,(now-t0)/1000,tab);requestAnimationFrame(loop);};
 render();
 openModal({icon:"shirt",kicker:"SCEGLI COME PESCA BIAGIO",title:"Guardaroba",body,onClose:()=>{live=false;},
  onBodyClick:ev=>{
   const st=ev.target.closest("button[data-style]");if(st){tab=st.dataset.style;render();return;}
   const t=ev.target.closest("button[data-skin]");if(!t)return;G.skin=t.dataset.skin;G.style=tab;savePrefs();live=false;closeModal(true);shout("Skin: "+ART.SKINS[G.skin].name+" · "+ART.STYLES[G.style],1.4,"shirt","good");}});
 requestAnimationFrame(loop);
}

/* ---------- comandi rapidi ---------- */
function setBait(id){
 if(G.mode==="career")G.career.bait=id;else if(G.arcade)G.arcade.bait=id;
 if(G.hook.mode!=="idle"&&G.hook.mode!=="fight")retrieve();
 shout("Esca: "+R.BAITS[id].name,1.1,"worm");saveCareer();
}
function cycleBait(){
 if(G.hook.mode==="fight")return;
 const list=G.mode==="career"?R.BAIT_ORDER.filter(id=>(G.career.baits[id]||0)>0):ARCADE_BAITS;
 if(!list.length){shout("Niente esche: passa in bottega",1.8,"worm","bad");return;}
 const cur=baitNow();setBait(list[(list.indexOf(cur)+1)%list.length]);
}
function setDrag(id){
 const holder=G.mode==="career"?G.career:G.arcade;if(!holder||!R.DRAG[id])return;
 holder.drag=id;if(G.fight)G.fight.dragFactor=R.DRAG[id].factor;saveCareer();
}
function cycleDrag(){const keys=Object.keys(R.DRAG),holder=G.mode==="career"?G.career:G.arcade;if(!holder)return;const id=keys[(keys.indexOf(holder.drag)+1)%keys.length];setDrag(id);shout("Frizione "+R.DRAG[id].label.toLowerCase(),1,"gear");}

/* ---------- menu e pausa ---------- */
function showShade(kicker,title,message,actions,shareScore,facts){
 ui.kicker.textContent=kicker;ui.headline.textContent=title;ui.message.textContent=message;ui.menu.innerHTML="";
 ui.facts.innerHTML=(facts||[]).map(f=>"<span>"+ic(f[0])+esc(f[1])+"</span>").join("");
 for(const a of actions){const b=document.createElement("button");b.type="button";b.className="btn"+(a.alt?" alt":"")+(a.ghost?" ghost":"");b.innerHTML=(a.icon?ic(a.icon):"")+esc(a.label);b.addEventListener("click",a.onClick);ui.menu.appendChild(b);}
 const share=shareScore!=null;ui.share.hidden=!share;ui.shareHint.hidden=!share;
 if(share)ui.share.href="https://wa.me/?text="+encodeURIComponent("🎣 Ho fatto "+shareScore+" punti a *Biagio Gelo — Pesca Grossa* su Arcade Club!\nRiesci a pescare meglio di me? Accetta la sfida e gioca qui: "+PAGE_URL);
 ui.shade.classList.remove("hidden");
}
function hideShade(){ui.shade.classList.add("hidden");}
function showMenu(){
 G.phase="menu";G.mode="menu";G.career=null;G.arcade=null;G.fight=null;G.hook={mode:"idle"};resetHolds();
 G.spot="lago";G.weather="sereno";populate();
 const save=loadCareer();
 const actions=[{label:save?"CONTINUA · GIORNO "+save.day:"INIZIA LA CARRIERA",icon:"play",onClick:()=>startCareer(false)},{label:"SFIDA 90 SECONDI",icon:"timer",alt:true,onClick:startArcade}];
 actions.push({label:"GUARDAROBA",icon:"shirt",ghost:true,onClick:openWardrobe});
 if(save)actions.push({label:"Ricomincia da zero",ghost:true,onClick:()=>{if(window.confirm("Cancellare la carriera salvata e ricominciare dal giorno 1?"))startCareer(true);}});
 showShade("ARCADE CLUB · PESCA GROSSA 2.0","Pesca Grossa","Biagio Gelo vuole diventare il Re del Golfo. Meteo, orari, esche, attrezzatura, commissioni e pesci leggendari. Oppure la sfida classica da 90 secondi.",actions,null,
  [["fish",R.SPECIES.length+" specie"],["pin","4 luoghi"],["trophy","5 leggende"]]);
}
function pauseGame(){
 if(G.phase!=="playing"||G.modalOpen)return;
 G.phase="paused";resetHolds();
 showShade("PAUSA","In pausa",G.mode==="career"?"Giorno "+G.career.day+", ore "+R.fmtClock(G.career.minute)+". La partita è salvata.":"Il tempo è fermo.",
  [{label:"RIPRENDI",icon:"play",onClick:()=>{hideShade();G.phase="playing";G.last=0;}},{label:"MENU",alt:true,onClick:()=>{saveCareer();showMenu();}}]);
}
function resetHolds(){G.hold.key=G.hold.btn=G.hold.canvas=false;G.input.key=G.input.btn=G.input.drag=0;ui.reel.classList.remove("active");ui.left.classList.remove("active");ui.right.classList.remove("active");}

/* ---------- interfaccia HTML ---------- */
const lastSet=new Map();
function setText(el,v){if(lastSet.get(el)!==v){lastSet.set(el,v);el.textContent=v;}}
function setHTML(el,v){const k="h:"+v;if(lastSet.get(el)!==k){lastSet.set(el,k);el.innerHTML=v;}}
function setCls(el,cls,on){if(el.classList.contains(cls)!==!!on)el.classList.toggle(cls,!!on);}
function refreshUI(){
 const c=career(),a=G.arcade,h=G.hook,f=G.fight;
 if(c){
  setHTML(ui.hudLI,ic("coin"));setText(ui.hudLL,"SOLDI");setText(ui.hudL,euro(c.money));
  setHTML(ui.hudMI,ic(weatherIcon(G.weather)));setText(ui.hudML,"GIORNO "+c.day+" · "+R.SPOTS[G.spot].short.toUpperCase());setText(ui.hudM,R.fmtClock(c.minute));
  setHTML(ui.hudRI,ic("star"));setText(ui.hudRL,"FAMA");setText(ui.hudR,fame(c));
 }else{
  setHTML(ui.hudLI,ic("fish"));setText(ui.hudLL,"PUNTI");setText(ui.hudL,String(a?a.score:0).padStart(5,"0"));
  const s=Math.ceil(a?a.seconds:ARCADE_SECONDS);setHTML(ui.hudMI,ic("timer"));setText(ui.hudML,"TEMPO");setText(ui.hudM,String(Math.floor(s/60)).padStart(2,"0")+":"+String(s%60).padStart(2,"0"));
  setHTML(ui.hudRI,ic("trophy"));setText(ui.hudRL,"RECORD");setText(ui.hudR,String(G.best).padStart(5,"0"));
 }
 const bait=baitNow(),left=baitLeft(bait);
 setText(ui.baitName,R.BAITS[bait].name);setText(ui.baitCount,left===Infinity?"∞":"×"+left);setCls(ui.baitBtn,"warn",left===0);
 const drag=c?c.drag:a?a.drag:"media";
 for(const b of ui.dragSeg.querySelectorAll("button"))setCls(b,"on",b.dataset.drag===drag);
 ui.toolbar.hidden=!c;
 if(c){
  setText(ui.spotName,R.SPOTS[G.spot].short);
  setText(ui.coolerLoad,num(R.coolerLoad(c).toFixed(1))+"/"+R.gearOf(c,"cooler").capacity);
  const open=c.orders.filter(o=>!o.done),ready=open.filter(o=>c.cooler.filter(i=>R.orderMatches(o,i)).length>=o.count).length;
  ui.ordersCount.hidden=!open.length;setText(ui.ordersCount,String(open.length));setCls(ui.tbOrders,"ready",ready>0);
  setText(ui.dexCount,R.dexCount(c)+"/"+R.SPECIES.length);setText(ui.karmaNum,String(c.karma));
 }
 // pulsante principale e indicatori
 let icon="rod",label="LANCIA",sub="mira automatica",state="cast",status="PRONTO A PESCARE",tip="Tocca l'acqua per lanciare",hot=false;
 if(G.phase!=="playing"){status=G.phase==="paused"?"IN PAUSA":"PRONTO A PESCARE";tip=G.mode==="menu"?"Scegli una modalità":"";}
 else if(h.mode==="idle"){status="SCEGLI DOVE LANCIARE";tip="Gittata "+gearNow().rod.range+" m · "+R.BAITS[bait].name.toLowerCase();}
 else if(h.mode==="casting"){label="LANCIO";sub="";status="LANCIO IN CORSO";tip="";}
 else if(h.mode==="waiting"){
  state="wait";
  if(h.empty){icon="return";label="RITIRA";sub="amo vuoto";status="AMO VUOTO";tip="Ritira e rilancia per rimettere l'esca";}
  else if(h.artificial){icon="up";label="RECUPERA";sub="tieni premuto";status=h.moving?"RECUPERO LENTO...":"MUOVI L'ESCA";tip="I predatori attaccano le esche in movimento";}
  else{icon="return";label="RITIRA";sub="o tocca un altro punto";status="ASPETTA L'ABBOCCATA";tip="Esca: "+R.BAITS[h.bait].name+" · fondale "+(h.depth!=null?Math.round(h.depth):"?")+" m";}
 }else if(h.mode==="nibble"){icon="hook";label="FERRA";sub="aspetta che vada sotto";state="wait";status="QUALCOSA ASSAGGIA...";tip="Il galleggiante trema: non ancora!";}
 else if(h.mode==="bite"){icon="hook";label="FERRA!";sub="adesso!";state="strike";status=h.junk?"QUALCOSA DI PESANTE!":"ABBOCCA! FERRA ORA!";tip="";hot=true;}
 else if(h.mode==="fight"&&f){
  icon="up";label="RECUPERA";sub="tieni · scorri ← →";state="fight";
  const t=f.action.type,dirTxt=f.action.dir<0?"A SINISTRA":"A DESTRA",counter=f.action.dir<0?"PIEGA A DESTRA":"PIEGA A SINISTRA";
  status={tira:"TIRA "+dirTxt+": "+counter,fuga:"FUGA! MOLLA O "+counter,salto:"SALTO! NON RECUPERARE",riposo:"È STANCO: RECUPERA!",tana:"VA IN TANA: TIENI TESO!"}[t]||"COMBATTI!";
  tip="Frizione "+R.DRAG[drag].label.toLowerCase()+" · filo "+Math.round(f.dist)+"/"+f.line.spool+" m";
  hot=f.tension/f.line.limit>.85||t==="fuga";
 }
 setHTML(ui.reel,'<span class="main">'+ic(icon)+label+"</span>"+(sub?"<small>"+sub+"</small>":""));
 if(ui.reel.dataset.state!==state)ui.reel.dataset.state=state;
 setText(ui.status,status);setText(ui.tip,tip);setCls(ui.status,"hot",hot);
 const fighting=!!f&&G.phase==="playing";
 ui.left.disabled=!fighting;ui.right.disabled=!fighting;
 const want=fighting&&R.ACTIONS[f.action.type].dir?-f.action.dir:0;
 setCls(ui.left,"hint",want===-1);setCls(ui.right,"hint",want===1);
 if(fighting){
  const ratio=f.tension/f.line.limit;
  ui.tension.style.width="calc("+clamp(ratio*100,0,100)+"% - 2px)";setText(ui.tensionNum,Math.round(ratio*100)+"%");
  setCls(ui.tension,"warn",ratio>.6&&ratio<=.85);setCls(ui.tension,"danger",ratio>.85);
  ui.dragMark.style.left=(f.dragFactor*100)+"%";
  ui.line.style.width="calc("+clamp(f.dist/f.line.spool*100,0,100)+"% - 2px)";setText(ui.lineNum,Math.round(f.dist)+" m");
  ui.stamina.style.width="calc("+clamp(f.stamina*100,0,100)+"% - 2px)";setText(ui.staminaNum,Math.round(f.stamina*100)+"%");
 }else{
  ui.tension.style.width="0";setText(ui.tensionNum,"0%");setCls(ui.tension,"warn",false);setCls(ui.tension,"danger",false);ui.dragMark.style.left=(R.DRAG[drag].factor*100)+"%";
  const m=(h.mode==="waiting"||h.mode==="nibble"||h.mode==="bite")?dist(h.x,h.y,TIP0.x,TIP0.y)/R.PX_PER_M:0;
  ui.line.style.width=m?"calc("+clamp(m/gearNow().line.spool*100,0,100)+"% - 2px)":"0";setText(ui.lineNum,Math.round(m)+" m");
  ui.stamina.style.width="0";setText(ui.staminaNum,"—");
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
 if(h.mode==="waiting"&&(!h.artificial||h.empty)){retrieve(h.empty?"Rimetti l'esca e rilancia":"Lenza ritirata");return false;}
 return true;// combattimento o recupero dell'artificiale: si tiene premuto
}
let canvasPointer=null,reelPointer=null;
canvas.addEventListener("pointerdown",ev=>{
 if(G.phase!=="playing"||G.modalOpen)return;ev.preventDefault();audio();
 const h=G.hook,p=lakePoint(ev);
 if(h.mode==="fight"){G.hold.canvas=true;canvasPointer={id:ev.pointerId,x0:ev.clientX};try{canvas.setPointerCapture(ev.pointerId);}catch(e){}return;}
 if(h.mode==="nibble"||h.mode==="bite"){strike();if(G.hook.mode==="fight"){G.hold.canvas=true;canvasPointer={id:ev.pointerId,x0:ev.clientX};try{canvas.setPointerCapture(ev.pointerId);}catch(e){}}return;}
 G.aim=p;cast(p.x,p.y);
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
  if(ev.target&&ev.target.tagName==="BUTTON"&&G.phase!=="playing")return;
  ev.preventDefault();if(ev.repeat)return;audio();
  if(G.phase!=="playing"){const b=ui.menu.querySelector("button");if(b&&!ui.shade.classList.contains("hidden"))b.click();return;}
  if(mainPress(true))G.hold.key=true;
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
 else if(k==="escape"||(k==="p"&&G.mode!=="career"))pauseGame();
 else if(G.mode==="career"&&G.hook.mode!=="fight"){if(k==="m")openMap();else if(k==="g"||k==="i")openCooler();else if(k==="n")openShop(false);else if(k==="c")openOrders();else if(k==="p")openDex();}
});
window.addEventListener("keyup",ev=>{const k=(ev.key||"").toLowerCase();if(ev.code==="Space"||k==="enter")G.hold.key=false;if(ARROWS[k]&&ARROWS[k][0]&&G.input.key===ARROWS[k][0])G.input.key=0;});
window.addEventListener("blur",resetHolds);
document.addEventListener("visibilitychange",()=>{if(document.hidden){resetHolds();saveCareer();if(G.phase==="playing"&&!G.modalOpen)pauseGame();}});
function syncSound(){ui.soundIcon.setAttribute("href",G.mute?"#i-mute":"#i-sound");ui.sound.setAttribute("aria-pressed",String(!G.mute));}
$("skin-btn").addEventListener("click",()=>{if(G.hook.mode==="fight"||G.modalOpen)return;openWardrobe();});
ui.sound.addEventListener("click",()=>{G.mute=!G.mute;syncSound();savePrefs();if(!G.mute)note(620,.09,"triangle",.03);});
ui.baitBtn.addEventListener("click",()=>{if(G.hook.mode==="fight")return;if(G.mode==="career")openBaits();else cycleBait();});
ui.dragSeg.addEventListener("click",ev=>{const b=ev.target.closest("button[data-drag]");if(b)setDrag(b.dataset.drag);});
const notFighting=fn=>()=>{if(G.hook.mode!=="fight"&&G.phase==="playing")fn();};
ui.tbMap.addEventListener("click",notFighting(()=>openMap()));
ui.tbCooler.addEventListener("click",notFighting(openCooler));
ui.tbShop.addEventListener("click",notFighting(()=>openShop(false)));
ui.tbOrders.addEventListener("click",notFighting(openOrders));
ui.tbDex.addEventListener("click",notFighting(openDex));
ui.tbKarma.addEventListener("click",notFighting(openKarma));

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
 if(G.mood){G.mood.life-=dt;if(G.mood.life<=0)G.mood=null;}
 if(G.trophy){G.trophy.life-=dt;if(G.trophy.life<=0){const tr=G.trophy;G.trophy=null;if(G.mode==="career")showCatch(tr.item);}}
 updateFish(dt);updateHook(dt);if(G.fight)updateFight(dt);
 G.spawnAcc+=dt;if(G.spawnAcc>5){G.spawnAcc=0;topUpPopulation();}
 melody();
}
function frame(now){
 const dt=clamp((now-G.last)/1000||0,0,.05);G.last=now;G.elapsed+=dt;
 if(G.phase==="playing"&&!G.modalOpen)update(dt);
 else if(G.phase==="menu")updateFish(dt*.6);
 updateFx(dt);
 G.frameNo=(G.frameNo||0)+1;
 if(!G.modalOpen&&G.phase!=="paused"&&G.phase!=="ended"||G.frameNo%4===0)ART.render(G,VIEW,dt);
 refreshUI();
 requestAnimationFrame(frame);
}
ART.init(canvas);
loadBest();loadPrefs();syncSound();
showMenu();requestAnimationFrame(frame);
// per i test automatici in un browser vero
window.PESCA_GAME={state:G,startCareer,startArcade,showMenu,cast,strike,openShop,openMap,openCooler,openOrders,openDex,openBaits,openWardrobe,travel,spendTime};
})();
