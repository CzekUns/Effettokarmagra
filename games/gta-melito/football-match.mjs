/* GTA Melito — Q33 (rifatta il 21/10/2026 su richiesta del committente): la partita di calcetto si gioca
 * NELL'OVERWORLD, dentro il campo grande di Via delle Palme (football-pitches.mjs, `partita:true`),
 * senza nessuna scena a parte. Si entra a piedi nel campo, dentro le linee compare «E · GIOCA»; premendo,
 * nove calciatori NPC (4 compagni ROSSI, 5 avversari BLU, portieri compresi) ARRIVANO A PIEDI da fuori
 * vista lungo i marciapiedi fino al cancello, si dispongono, fischio, e si gioca nella stessa scena con la
 * telecamera di sempre (leggero zoom-out mentre si è in campo). Il protagonista si muove con i comandi
 * normali: E/SPAZIO calcia (tenuto = più forte), X/SHIFT passa al compagno più vicino. Regole, IA e palla
 * sono in minigame-football.mjs (libreria), qui riportate nel mondo con coordinate locali u (asse lungo,
 * ROSSI attaccano verso +u) e v (di traverso). Dopo il fischio finale i calciatori se ne vanno a piedi.
 * Si abbandona restando fuori dalla recinzione per più di 5 secondi (niente risultato).
 * Nella campagna si salva SOLO il bilancio V/P/S, una volta per partita (id). Grafica provvisoria. */
import {createMatch,startMatch,stepMatch,kickoffSpot,matchMinute,matchClockLabel,scaleRules,FOOTBALL_TEAMS} from './minigame-football.mjs?v=003';
import {PEOPLE_ATLAS_PATH,PEOPLE_ATLAS_CELL,pedestrianDirection} from './pedestrian-sprites.mjs?v=002';
import {insidePitch} from './football-pitches.mjs?v=002';
import {ps} from './world-scale.mjs?v=001';

export const FIELD_RULES=Object.freeze({
 players:9,                 // 4 compagni + 5 avversari (il protagonista è il quinto dei ROSSI)
 walkSpeed:[11.5,13],       // arrivano e se ne vanno di corsetta (unità di gioco al secondo; corsa del protagonista 13)
 stagger:.45,               // secondi fra un calciatore e il seguente dello stesso gruppo
 groups:3,                  // punti di arrivo diversi (fuori vista), se il quartiere lo consente
 cell:1.5,                  // griglia della ricerca del percorso a piedi
 offscreen:6,               // metri oltre il bordo della vista per «fuori vista»
 arriveTimeout:45,          // dopo tanto si fischia comunque l'inizio (chi manca arriva giocando)
 abandonSeconds:5,          // fuori dalla recinzione per più di tanto = partita abbandonata
 chargeSeconds:.8,          // tiro tenuto premuto: da 55% a 100% della potenza
 endSeconds:4,              // fischio finale a vista, poi i calciatori se ne vanno
 zoomOut:.8,                // leggero zoom-out della telecamera mentre si è in campo
 ballRadius:.5,             // palla disegnata (unità di gioco)
 reach:1.2                  // distanza a cui un punto del percorso conta raggiunto
});
const F=FIELD_RULES;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const rand=n=>{const x=Math.sin(n*12.9898)*43758.5453;return x-Math.floor(x);};

/* Regole della partita alla scala del campo: il campo da 40×20 "metri" della libreria diventa il
 * campo vero (linee w×h), con le velocità dei piedi del gioco (camminata 8,5, corsa 13). */
export function rulesForPitch(pitch,{run=13}={}){
 const long=pitch.w>=pitch.h,length=long?pitch.w:pitch.h,width=long?pitch.h:pitch.w,k=length/40;
 const goal=pitch.goal||{width:pitch.porta||3,depth:pitch.profondita||1.2};
 return scaleRules(k,{length,width,goalWidth:goal.width,goalDepth:goal.depth,areaRadius:pitch.area||6*k,centreRadius:pitch.centro||3*k,
  userSpeed:run,userDribble:run*.85,aiSpeed:run*.85,aiDribble:run*.73,keeperSpeed:run*.73,
  playerRadius:ps(1.1),ballRadius:F.ballRadius*.7,control:ps(1.6),
  goalPause:3.2,kickoffFreeze:1.4,restartFreeze:1.2});
}
/* Coordinate locali del campo: u lungo l'asse lungo, v di traverso. Campo lungo in x: x=cx+u, y=cy+v.
 * Campo lungo in y: rotazione di 90° (x=cx−v, y=cy+u), così le direzioni restano coerenti. */
export function pitchFrame(pitch){
 const long=pitch.w>=pitch.h,cx=pitch.cx,cy=pitch.cy;
 if(long)return {long,toWorld:(u,v)=>({x:cx+u,y:cy+v}),toLocal:(x,y)=>({u:x-cx,v:y-cy}),vecWorld:(du,dv)=>({x:du,y:dv}),vecLocal:(dx,dy)=>({u:dx,v:dy})};
 return {long,toWorld:(u,v)=>({x:cx-v,y:cy+u}),toLocal:(x,y)=>({u:y-cy,v:cx-x}),vecWorld:(du,dv)=>({x:-dv,y:du}),vecLocal:(dx,dy)=>({u:dy,v:-dx})};
}

/* Percorsi a piedi dal cancello verso punti FUORI VISTA (griglia su `walkable`, come la ricerca del lato
 * del cancello in football-pitches.mjs). Restituisce fino a `groups` percorsi (dal punto lontano al
 * cancello), distanti fra loro; se il quartiere non offre punti fuori vista, il più lontano trovato. */
export function arrivalPaths(gate,{walkable=()=>true,view=null,groups=F.groups,cell=F.cell,limit=6000}={}){
 const start={x:gate.out?.x??gate.x,y:gate.out?.y??gate.y};
 if(!walkable(start.x,start.y))return [];
 const hidden=(x,y)=>!view||x<view[0]-F.offscreen||x>view[2]+F.offscreen||y<view[1]-F.offscreen||y>view[3]+F.offscreen;
 const key=(i,j)=>i+','+j,parent=new Map([[key(0,0),null]]);
 let frontier=[[0,0]],seen=1,farthest=[0,0],farD=0;const ends=[];
 for(let d=0;d<400&&frontier.length&&ends.length<groups&&seen<limit;d++){
  const next=[];
  for(const [i,j] of frontier){
   const x=start.x+i*cell,y=start.y+j*cell;
   if(d>farD){farD=d;farthest=[i,j];}
   if(d>=4&&hidden(x,y)&&!ends.some(([a,b])=>Math.hypot(a-i,b-j)*cell<18)){ends.push([i,j]);if(ends.length>=groups)break;continue;}
   for(const [di,dj] of [[1,0],[-1,0],[0,1],[0,-1]]){
    const ni=i+di,nj=j+dj,k=key(ni,nj);if(parent.has(k))continue;
    const nx=start.x+ni*cell,ny=start.y+nj*cell;
    if(!walkable(nx,ny)){parent.set(k,undefined);continue;}
    parent.set(k,[i,j]);seen++;next.push([ni,nj]);
   }
  }
  frontier=next;
 }
 if(!ends.length)ends.push(farthest);
 return ends.map(([i,j])=>{
  const pts=[];let cur=[i,j];
  while(cur){pts.push({x:start.x+cur[0]*cell,y:start.y+cur[1]*cell});cur=parent.get(key(cur[0],cur[1]))||null;}
  pts.push({x:gate.x,y:gate.y});          // last point: the gate itself
  return pts;
 });
}

// Foglio pixel art pronto: quattro divise derivate dalla tavola pedoni approvata.
// Colonne: ROSSI, BLU, portiere giallo, portiere verde; ogni divisa ha quattro frame.
export const FOOTBALL_SPRITE_PATH='./assets/people/calcetto-4squadre-4dir-4frames-24x40.png';
let atlas=null;
function ensureAtlas(){
 if(atlas||typeof Image==='undefined')return;
 atlas=new Image();atlas.onerror=()=>console.warn('Calcetto: foglio calciatori non disponibile');
 atlas.src=new URL(FOOTBALL_SPRITE_PATH,import.meta.url).href;
}
const atlasReady=()=>!!(atlas?.complete&&atlas.naturalWidth===384&&atlas.naturalHeight===160);
export function tintedAtlas(_shirt){return atlasReady()?atlas:null;}
export function shirtOf(team,role){const T=FOOTBALL_TEAMS[team];return role==='gk'?T.keeper:T.shirt;}
function drawFootballer(c,w,clock){
 const identity=w.role==='gk'?(w.team===0?2:3):w.team;
 const shirt=shirtOf(w.team,w.role),sheet=tintedAtlas(shirt);
 const width=ps(3.25),height=ps(4.7);
 if(sheet){
  const dir=pedestrianDirection(w.a),phase=((Math.floor(clock*Math.max(3,Math.abs(w.speed||0)*.9)+w.seed*.013)%4)+4)%4;
  const sx=(identity*4+(w.moving?phase:0))*PEOPLE_ATLAS_CELL.width,sy=dir*PEOPLE_ATLAS_CELL.height;
  c.drawImage(sheet,sx,sy,PEOPLE_ATLAS_CELL.width,PEOPLE_ATLAS_CELL.height,w.x-width/2,w.y-height+ps(.8),width,height);
  return;
 }
 c.fillStyle='#00000040';c.beginPath();c.ellipse(w.x,w.y+.2,ps(1.2),ps(.6),0,0,Math.PI*2);c.fill();
 c.fillStyle=shirt;c.fillRect(w.x-ps(.9),w.y-ps(3.2),ps(1.8),ps(2));
 c.fillStyle='#e6b98f';c.fillRect(w.x-ps(.6),w.y-ps(4.2),ps(1.2),ps(1.1));
 c.fillStyle='#2a2a2a';c.fillRect(w.x-ps(.8),w.y-ps(1.3),ps(.6),ps(1.3));c.fillRect(w.x+ps(.2),w.y-ps(1.3),ps(.6),ps(1.3));
}

function whistle(sound,kind){
 if(!sound||sound.muted)return;
 try{
  const AC=globalThis.AudioContext||globalThis.webkitAudioContext;if(!AC)return;
  whistle.ctx||=new AC();const audio=whistle.ctx;if(audio.state==='suspended')audio.resume?.();
  const t=audio.currentTime,vol=.1*clamp(Number(sound.volume??.7),0,1);
  const blasts=kind==='end'?[[0,.3],[.42,.3],[.84,.75]]:kind==='goal'?[[0,.55]]:[[0,.35]];
  for(const [s,len] of blasts){
   const o=audio.createOscillator(),lfo=audio.createOscillator(),lg=audio.createGain(),g=audio.createGain();
   o.type='sine';o.frequency.value=2850;lfo.frequency.value=27;lg.gain.value=150;lfo.connect(lg);lg.connect(o.frequency);
   g.gain.setValueAtTime(0,t+s);g.gain.linearRampToValueAtTime(vol,t+s+.02);g.gain.setValueAtTime(vol,t+s+len-.05);g.gain.linearRampToValueAtTime(0,t+s+len);
   o.connect(g);g.connect(audio.destination);o.start(t+s);lfo.start(t+s);o.stop(t+s+len+.03);lfo.stop(t+s+len+.03);
  }
 }catch(_){}
}
const BANNERS={goal:e=>e.own?'AUTOGOL! '+FOOTBALL_TEAMS[e.team].name:'GOL! '+FOOTBALL_TEAMS[e.team].name,post:()=>'PALO!',save:()=>'PARATA!',
 out:e=>e.kind==='laterale'?'RIMESSA LATERALE':e.kind==='angolo'?'CALCIO D\'ANGOLO':'RIMESSA DAL FONDO'};

/* La partita nel mondo. pitch: campo preparato (preparePitches, partita:true). walkable(x,y): dove si
 * può stare a piedi (città). view: [x0,y0,x1,y1] visibile ora. player: {x,y,a}. onResult(result): una
 * volta al fischio finale. sound: {muted,volume}. Restituisce la sessione: step/press/release/draw… */
export function createFieldMatch({pitch,seed=(Date.now()>>>0),id=null,walkable=()=>true,view=null,player={x:0,y:0,a:0},
 onResult=()=>{},sound=null,run=13,doc=globalThis.document}={}){
 if(!pitch?.gate)return null;
 const frame=pitchFrame(pitch),rules=rulesForPitch(pitch,{run});
 const m=createMatch({seed,id:id||('calcetto-'+pitch.id+'-'+(seed>>>0).toString(36)),pitchName:pitch.nome||'',rules,external:4});
 const paths=arrivalPaths(pitch.gate,{walkable,view});
 const gate=pitch.gate,inward={x:pitch.cx-gate.x,y:pitch.cy-gate.y},il=Math.hypot(inward.x,inward.y)||1;
 const gateIn={x:gate.x+inward.x/il*2.6,y:gate.y+inward.y/il*2.6};
 ensureAtlas();
 const walkers=[];let n=0;
 for(const p of m.players){
  if(p.i===m.external)continue;
  const path=paths.length?paths[n%paths.length]:[{x:gate.x,y:gate.y}],spawn=path[0];
  const ks=kickoffSpot(m,p,0),spot=frame.toWorld(ks.x,ks.y);
  walkers.push({i:p.i,team:p.team,role:p.role,x:spawn.x,y:spawn.y,a:0,kind:((seed>>>0)+n*5)%3,seed:(seed>>>0)+n*97,
   pace:F.walkSpeed[0]+rand(seed+n)*(F.walkSpeed[1]-F.walkSpeed[0]),speed:0,moving:false,
   phase:'arrivo',wait:Math.floor(n/Math.max(1,paths.length))*F.stagger,route:[...path.slice(1),gateIn,spot],step:0,spawnPath:path,gone:false,arrived:false});
  n++;
 }
 const S={pitch,frame,rules,match:m,walkers,phase:'arrivo',clock:0,timer:0,outside:0,abandoned:false,result:null,
  banner:null,charge:null,pending:{shoot:false,pass:false,power:1},acc:0,last:{x:player.x,y:player.y},pose:{x:0,y:0,vx:0,vy:0,fx:1,fy:0},events:[]};
 const local=(x,y)=>frame.toLocal(x,y);
 const note=(text,seconds=1.6)=>{S.banner={text,until:S.clock+seconds};};
 const syncWalker=w=>{                                            // on the field the match drives him
  const p=m.players[w.i],q=frame.toWorld(p.x,p.y),vel=frame.vecWorld(p.vx,p.vy),face=frame.vecWorld(p.fx,p.fy);
  w.moving=Math.hypot(p.vx,p.vy)>1;w.speed=Math.hypot(p.vx,p.vy);
  w.x=q.x;w.y=q.y;w.a=w.moving?Math.atan2(vel.y,vel.x):Math.atan2(face.y,face.x);
 };
 const advanceWalker=(w,dt)=>{
  if(w.wait>0){w.wait-=dt;w.moving=false;return false;}
  let t=w.route[w.step];if(!t)return true;
  // an intermediate point counts reached within F.reach: he turns towards the next one without snapping
  while(w.step<w.route.length-1&&Math.hypot(t.x-w.x,t.y-w.y)<=F.reach){w.step++;t=w.route[w.step];}
  const dx=t.x-w.x,dy=t.y-w.y,d=Math.hypot(dx,dy),s=w.pace*dt;
  w.moving=true;w.speed=w.pace;w.a=Math.atan2(dy,dx);
  if(d<=s){w.x=t.x;w.y=t.y;w.step++;if(w.step>=w.route.length){w.moving=false;return true;}return false;}
  w.x+=dx/d*s;w.y+=dy/d*s;return false;
 };
 const placeOnField=w=>{const p=m.players[w.i],l=local(w.x,w.y);p.x=l.u;p.y=l.v;p.vx=0;p.vy=0;};
 const startLeaving=()=>{
  for(const w of walkers){
   if(w.gone)continue;
   w.phase='uscita';w.step=0;w.wait=rand(w.seed)*1.2;w.route=[gateIn,{x:gate.x,y:gate.y},...[...w.spawnPath].reverse().slice(1)];
  }
  S.phase='uscita';
 };
 const hidden=(x,y,view)=>!view||x<view[0]-F.offscreen||x>view[2]+F.offscreen||y<view[1]-F.offscreen||y>view[3]+F.offscreen;
 const finish=()=>{S.phase='fine';S.timer=F.endSeconds;};
 const input=()=>{
  const out={x:0,y:0,pose:S.pose,shoot:S.pending.shoot,pass:S.pending.pass,power:S.pending.power};
  S.pending.shoot=false;S.pending.pass=false;return out;
 };
 const handleEvents=()=>{
  for(const e of m.events){
   const text=BANNERS[e.type]?.(e);if(text)note(text,e.type==='goal'?2.6:1.4);
   if(e.type==='goal')whistle(sound,'goal');
   if(e.type==='end'){
    S.result=m.result;whistle(sound,'end');
    try{onResult(m.result);}catch(err){console.error('Calcetto: salvataggio del risultato',err);}
    const r=m.result;note('FISCHIO FINALE · '+(r.outcome==='vittoria'?'VITTORIA!':r.outcome==='pareggio'?'PAREGGIO':'SCONFITTA')+' · ROSSI '+r.home+' – '+r.away+' BLU',F.endSeconds);
    finish();
   }
   S.events.push(e);
  }
  if(S.events.length>60)S.events.splice(0,S.events.length-60);
  m.events.length=0;
 };
 const session={
  get phase(){return S.phase;},get pitch(){return pitch;},get rules(){return rules;},get match(){return m;},get walkers(){return walkers;},get result(){return S.result;},get abandoned(){return S.abandoned;},
  get banner(){return S.banner&&S.clock<S.banner.until?S.banner.text:null;},get charging(){return S.charge;},get events(){return S.events;},
  /* true while the protagonist is on the field and the match is alive: the city camera zooms out a little */
  playing:()=>S.phase==='arrivo'||S.phase==='gioco'||S.phase==='fine',
  done:()=>S.phase==='done',
  onField:(x,y)=>insidePitch(pitch,x,y,0),
  hasBall:()=>m.ball.owner===m.external,
  cameraBias:(x,y)=>session.playing()&&insidePitch(pitch,x,y,0)?F.zoomOut:1,
  chargeLevel:()=>S.charge?clamp((S.clock-S.charge.since)/F.chargeSeconds,0,1):0,
  /* E / SPAZIO / pulsante TIRO: con la palla al piede comincia la carica; senza, contrasto. */
  press(kind){
   if(S.phase!=='gioco')return false;
   if(kind==='kick'){if(m.ball.owner===m.external){if(!S.charge)S.charge={since:S.clock};}else{S.pending.shoot=true;S.pending.power=1;}return true;}
   if(kind==='pass'){if(m.ball.owner===m.external)S.pending.pass=true;else{S.pending.shoot=true;S.pending.power=1;}return true;}
   return false;
  },
  release(kind){
   if(kind!=='kick'||!S.charge)return false;
   const power=clamp((S.clock-S.charge.since)/F.chargeSeconds,0,1);S.charge=null;
   if(m.ball.owner===m.external){S.pending.shoot=true;S.pending.power=power;}
   return true;
  },
  abandon(){if(S.phase==='done'||S.phase==='uscita')return;S.abandoned=!S.result;S.charge=null;if(!S.result)note('PARTITA ABBANDONATA',2.5);startLeaving();},
  /* Un passo. player: {x,y,a,car}; view: [x0,y0,x1,y1] visibile; dt in secondi. */
  step(dt,{player,view=null}={}){
   dt=Math.max(0,Math.min(.1,Number(dt)||0));S.clock+=dt;
   if(S.phase==='done')return S.phase;
   // posa del protagonista in coordinate locali
   if(player){
    const l=local(player.x,player.y),vl=frame.vecLocal(player.x-S.last.x,player.y-S.last.y),fl=frame.vecLocal(Math.cos(player.a||0),Math.sin(player.a||0));
    S.pose={x:l.u,y:l.v,vx:dt>0?vl.u/dt:0,vy:dt>0?vl.v/dt:0,fx:fl.u,fy:fl.v};S.last={x:player.x,y:player.y};
    // fuori dalla recinzione (o in auto) troppo a lungo: abbandono
    if(S.phase==='arrivo'||S.phase==='gioco'){
     const out=!insidePitch(pitch,player.x,player.y,0)||(player.car??-1)>=0;
     S.outside=out?S.outside+dt:0;
     if(S.outside>F.abandonSeconds||(player.car??-1)>=0){session.abandon();}
    }
   }
   if(S.phase==='arrivo'){
    S.timer+=dt;let all=true;
    for(const w of walkers){
     if(w.arrived){placeOnField(w);continue;}
     if(advanceWalker(w,dt)){w.arrived=true;w.phase='campo';placeOnField(w);}else all=false;
    }
    stepMatch(m,{pose:S.pose},0);
    if(all||S.timer>F.arriveTimeout){
     for(const w of walkers)if(!w.arrived){w.arrived=true;w.phase='campo';placeOnField(w);}
     startMatch(m);whistle(sound,'start');S.phase='gioco';note('FISCHIO D\'INIZIO · 2 MINUTI',2);
    }
    return S.phase;
   }
   if(S.phase==='gioco'){
    if(S.charge&&m.ball.owner!==m.external)S.charge=null;
    S.acc+=dt;let n=0;
    while(S.acc>=rules.step&&n<8){stepMatch(m,input(),rules.step);S.acc-=rules.step;n++;}
    if(n===8)S.acc=0;
    handleEvents();
    for(const w of walkers)syncWalker(w);
    return S.phase;
   }
   if(S.phase==='fine'){
    S.timer-=dt;stepMatch(m,{pose:S.pose},0);
    for(const w of walkers)syncWalker(w);
    if(S.timer<=0)startLeaving();
    return S.phase;
   }
   if(S.phase==='uscita'){
    let left=0;
    for(const w of walkers){
     if(w.gone)continue;
     const end=advanceWalker(w,dt);
     const outside=!insidePitch(pitch,w.x,w.y,1);
     if(outside&&(hidden(w.x,w.y,view)||end)){w.gone=true;continue;}
     left++;
    }
    if(!left)S.phase='done';
    return S.phase;
   }
   return S.phase;
  },
  /* Riga dell'HUD (in alto): fase, punteggio e cronometro. */
  hudText(){
   if(S.phase==='arrivo'){const here=walkers.filter(w=>w.arrived).length;return 'CALCETTO · ARRIVANO I GIOCATORI '+here+'/'+walkers.length;}
   const sc='ROSSI '+m.score[0]+' – '+m.score[1]+' BLU · '+matchClockLabel(m);
   if(S.phase==='gioco')return 'CALCETTO · '+sc+(m.phase==='goal'?' · GOL':m.phase==='restart'?' · RIMESSA':'');
   if(S.phase==='fine')return 'FISCHIO FINALE · '+sc;
   return S.abandoned?'CALCETTO · PARTITA ABBANDONATA':'CALCETTO · FINE · '+sc;
  },
  /* I calciatori NPC (sprite dei pedoni con la maglia della squadra), nel livello delle persone. */
  drawPeople(c,clock,bounds){
   const [x0,y0,x1,y1]=bounds||[-Infinity,-Infinity,Infinity,Infinity];
   const list=walkers.filter(w=>!w.gone&&w.x>=x0-8&&w.x<=x1+8&&w.y>=y0-8&&w.y<=y1+8).sort((a,b)=>a.y-b.y);
   for(const w of list)drawFootballer(c,w,clock);
  },
  /* La palla (sopra le persone), l'anello del possesso e la barra di carica del tiro. */
  drawBall(c,clock,player=null){
   if(S.phase==='arrivo'||S.phase==='done'||S.phase==='uscita')return;
   const b=m.ball,q=frame.toWorld(b.x,b.y),r=F.ballRadius;
   if(b.owner>=0&&b.owner!==m.external){const w=walkers.find(w=>w.i===b.owner);if(w){c.strokeStyle='#ffe14a';c.lineWidth=.22;c.beginPath();c.ellipse(w.x,w.y+.25,ps(1.3),ps(.65),0,0,Math.PI*2);c.stroke();}}
   c.fillStyle='#00000045';c.beginPath();c.ellipse(q.x+.25,q.y+.35,r*1.05,r*.6,0,0,Math.PI*2);c.fill();
   c.fillStyle='#f7f5ee';c.beginPath();c.arc(q.x,q.y,r,0,Math.PI*2);c.fill();
   c.strokeStyle='#2b2b2b';c.lineWidth=.08;c.stroke();
   const s=b.spin%(Math.PI*2);c.fillStyle='#2b2b2b';
   for(let k=0;k<3;k++){const a=s+k*Math.PI*2/3;c.beginPath();c.arc(q.x+Math.cos(a)*r*.55,q.y+Math.sin(a)*r*.55,r*.22,0,Math.PI*2);c.fill();}
   if(S.charge&&player){
    const lvl=session.chargeLevel(),w=ps(3.4),x=player.x-w/2,y=player.y-ps(5.4);
    c.fillStyle='#0f1a15cc';c.fillRect(x-.15,y-.15,w+.3,.9);c.fillStyle=lvl>=1?'#ff6a4a':'#ffe14a';c.fillRect(x,y,w*lvl,.6);
   }
  },
  // label for the bottom prompt (PC) / the touch action button
  prompt(){return S.phase==='gioco'?(m.ball.owner===m.external?'TIRO (TIENI PREMUTO) · X PASSAGGIO':'CONTRASTO · X'):'';}
 };
 return session;
}
export {matchMinute,matchClockLabel};
