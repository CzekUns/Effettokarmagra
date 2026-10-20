/* GTA Melito — Q33: partita di calcetto 5 contro 5, minigioco «dall'alto» come i primi giochi di calcio.
 * Si apre dal cancello di un campetto Q32 (openFootballMatch in game.mjs) come scena a schermo intero
 * sopra la città, che resta in pausa sotto; all'uscita (fischio finale o ESC) si torna al cancello.
 * Due squadre inventate da cinque, portiere compreso: ROSSI (comandata dal giocatore, attacca verso
 * destra) contro BLU. Campo con le misure tipiche del calcio a 5 (40×20 m, porte da 3 m, area a 6 m).
 * Sopra: la logica pura e deterministica (seme), provata in Node. Sotto: la scena DOM/canvas con
 * tastiera e comandi touch. Nella campagna si salva SOLO il bilancio vittorie / pareggi / sconfitte,
 * una volta per partita (id), mai la partita in corso. Grafica provvisoria, da approvare. */
export const FOOTBALL_RULES=Object.freeze({
 length:40,width:20,goalWidth:3,goalDepth:1,areaRadius:6,centreRadius:3,
 realSeconds:120,      // durata reale della partita (tempo di gioco effettivo)
 displayMinutes:40,    // cronometro accelerato: 40' del calcio a 5 in 2 minuti (×20)
 playerRadius:.35,ballRadius:.12,control:.62,controlMaxSpeed:13,
 userSpeed:6,userDribble:5,aiSpeed:5.5,aiDribble:4.8,keeperSpeed:4.4,
 passMin:7,passMax:15,shotSpeed:19,
 friction:.55,rolling:1,                  // palla: attrito proporzionale + rotolamento (m/s²)
 kickoffFreeze:1.2,goalPause:2.6,restartFreeze:.9,restartDistance:3,
 kickCooldown:.3,stealCooldown:.8,tackleRange:.85,
 keeperReach:.95,keeperDive:.55,keeperHold:.9,
 step:1/60
});
const R=FOOTBALL_RULES,HL=R.length/2,HW=R.width/2,GH=R.goalWidth/2;
export const FOOTBALL_TEAMS=Object.freeze([
 Object.freeze({name:'ROSSI',shirt:'#d33b33',trim:'#f3eee2',shorts:'#f3eee2',socks:'#d33b33',keeper:'#e8c447',keeperTrim:'#2a2a2a'}),
 Object.freeze({name:'BLU',shirt:'#2d5fc4',trim:'#a9d6ff',shorts:'#1b2b55',socks:'#2d5fc4',keeper:'#4fb46a',keeperTrim:'#173a24'})
]);
export const FOOTBALL_KEYS='FRECCE/WASD muovi · SPAZIO tiro · X o SHIFT passaggio · Q cambio giocatore · ESC esci';
const ROLES=['gk','fixo','alaA','alaB','pivot'];
// Posizioni base nel «verso d'attacco» della squadra (u verso la porta avversaria, v di traverso).
const SPOTS={gk:{u:-19.1,v:0},fixo:{u:-11,v:0},alaA:{u:-4.5,v:-5.5},alaB:{u:-4.5,v:5.5},pivot:{u:3,v:0}};
const KICKOFF={gk:{u:-19.1,v:0},fixo:{u:-10,v:0},alaA:{u:-5,v:-5.5},alaB:{u:-5,v:5.5},pivot:{u:-3.6,v:0}};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export const teamDir=t=>t===0?1:-1;              // ROSSI attaccano verso +x, BLU verso -x
export const ownGoalX=t=>-HL*teamDir(t);
function segDist(px,py,ax,ay,bx,by){
 const dx=bx-ax,dy=by-ay,l=dx*dx+dy*dy;const t=l?clamp(((px-ax)*dx+(py-ay)*dy)/l,0,1):0;
 return Math.hypot(px-ax-t*dx,py-ay-t*dy);
}
// mulberry32: piccolo, veloce e uguale ovunque (partite ripetibili con lo stesso seme).
export function makeRng(seed){
 let a=(Number(seed)>>>0)||1;
 return ()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};
}

// ---- partita ------------------------------------------------------------------------------------
export function createMatch({seed=1,id=null,pitchName=''}={}){
 const players=[];
 for(const team of [0,1])ROLES.forEach((role,k)=>players.push({i:team*5+k,team,role,x:0,y:0,vx:0,vy:0,fx:teamDir(team),fy:0,
  anim:0,cooldown:0,tackle:0,protect:0,stun:0,hold:0,think:0,dive:0,kick:0,mustPass:false,look:((seed>>>0)+team*3+k*7)%20}));
 const m={rules:R,id:id||('calcetto-'+((seed>>>0)||1).toString(36)),seed,rng:makeRng(seed),pitchName,
  phase:'intro',timer:0,time:0,score:[0,0],players,active:4,restart:null,events:[],result:null,lastGoalTeam:-1,
  ball:{x:0,y:0,vx:0,vy:0,owner:-1,lastTouch:0,lastKicker:-1,passTarget:-1,saveTried:false,shot:false,blockedBy:-1,inNet:false,spin:0},
  stats:{shots:[0,0],passes:[0,0],saves:[0,0],steals:[0,0]}};
 setKickoff(m,0);m.phase='intro';m.events.length=0;
 return m;
}
export function startMatch(m){
 if(m.phase!=='intro')return false;
 setKickoff(m,0);m.events.push({type:'whistle',kind:'start'});return true;
}
function setKickoff(m,team){
 for(const p of m.players){
  const s=KICKOFF[p.role],d=teamDir(p.team);let u=s.u,v=s.v;
  if(p.role==='pivot'&&p.team===team){u=-.55;v=0;}
  Object.assign(p,{x:u*d,y:v*d,vx:0,vy:0,fx:d,fy:0,cooldown:0,tackle:0,protect:0,stun:0,hold:0,dive:0,kick:0,mustPass:false});
 }
 Object.assign(m.ball,{x:0,y:0,vx:0,vy:0,owner:-1,lastTouch:team,lastKicker:-1,passTarget:-1,saveTried:false,shot:false,blockedBy:-1,inNet:false});
 const taker=team*5+4;
 m.restart={kind:'kickoff',team,taker};m.phase='kickoff';m.timer=R.kickoffFreeze;
 if(team===0)m.active=taker;
 m.events.push({type:'kickoff',team});
}
/* Rimessa semplice: palla ferma sul punto, il compagno più vicino (il portiere per la rimessa dal
 * fondo) la batte dopo una breve pausa; gli avversari stanno a 3 m. kind: laterale|angolo|fondo. */
function setRestart(m,kind,team,x,y){
 const b=m.ball,d=teamDir(team);
 Object.assign(b,{x,y,vx:0,vy:0,owner:-1,passTarget:-1,saveTried:false,shot:false,blockedBy:-1,inNet:false});
 let taker=team*5;
 if(kind!=='fondo'){let best=Infinity;for(const p of m.players)if(p.team===team&&p.role!=='gk'){const dd=Math.hypot(p.x-x,p.y-y);if(dd<best){best=dd;taker=p.i;}}}
 const p=m.players[taker];
 // faces into the pitch: towards the attack for a goal clearance, towards the middle otherwise
 let fx=kind==='fondo'?d:(kind==='angolo'?-Math.sign(x)*.8:d*.45),fy=kind==='fondo'?0:-Math.sign(y)||0;
 const fl=Math.hypot(fx,fy)||1;fx/=fl;fy/=fl;
 Object.assign(p,{x:x-fx*.45,y:y-fy*.45,vx:0,vy:0,fx,fy,hold:0,stun:0,cooldown:0,mustPass:true});
 for(const q of m.players){
  if(q.team===team)continue;const dx=q.x-x,dy=q.y-y,dd=Math.hypot(dx,dy);
  if(dd<R.restartDistance){const k=dd>.01?R.restartDistance/dd:0;q.x=x+(dd>.01?dx*k:-d*R.restartDistance);q.y=y+(dd>.01?dy*k:0);}
 }
 m.restart={kind,team,taker,x,y};m.phase='restart';m.timer=R.restartFreeze;
 if(team===0&&p.role!=='gk')m.active=taker;
 m.events.push({type:'restart',kind,team});
}
function nearestOutfield(m,team,x,y,exclude=-1){
 let best=-1,bd=Infinity;
 for(const p of m.players)if(p.team===team&&p.role!=='gk'&&p.i!==exclude){const dd=Math.hypot(p.x-x,p.y-y);if(dd<bd){bd=dd;best=p.i;}}
 return best;
}
function giveBall(m,i,{protect=.35}={}){
 const b=m.ball,p=m.players[i],from=b.owner>=0?m.players[b.owner].team:b.lastTouch;
 b.owner=i;b.lastTouch=p.team;b.passTarget=-1;b.saveTried=false;b.shot=false;b.blockedBy=-1;
 p.hold=0;p.protect=protect;p.think=.12+m.rng()*.18;
 if(p.team===0&&p.role!=='gk')m.active=i;
 else if(p.team===1&&from===0){
  // ball lost: the nearest of our players takes over (only if clearly nearer than the current one)
  const n=nearestOutfield(m,0,b.x,b.y),act=m.players[m.active];
  if(n>=0&&n!==m.active&&dist(act,b)>dist(m.players[n],b)+2){m.active=n;m.events.push({type:'switch',to:n,auto:true});}
 }
}
function kick(m,p,vx,vy,{target=-1,shot=false}={}){
 const b=m.ball,l=Math.hypot(vx,vy)||1;
 b.owner=-1;
 // the ball leaves from the feet, never already beyond a line (the crossing check needs it inside)
 b.x=clamp(p.x+vx/l*.5,-HL+.01,HL-.01);b.y=clamp(p.y+vy/l*.5,-HW+.01,HW-.01);
 Object.assign(b,{vx,vy,lastTouch:p.team,lastKicker:p.i,passTarget:target,saveTried:false,shot,blockedBy:-1});
 p.cooldown=R.kickCooldown;p.kick=.22;p.hold=0;p.mustPass=false;p.fx=vx/l;p.fy=vy/l;
 m.stats[shot?'shots':'passes'][p.team]++;
 m.events.push({type:shot?'shot':'pass',team:p.team,by:p.i,target});
}
export const passSpeed=d=>clamp(4.5+d*.72,R.passMin,R.passMax);
function passTo(m,p,j,{lead=true}={}){
 const q=m.players[j],d0=Math.hypot(q.x-p.x,q.y-p.y),t=d0/passSpeed(d0)*.8;
 const tx=q.x+(lead?q.vx*t:0),ty=q.y+(lead?q.vy*t:0),dx=tx-p.x,dy=ty-p.y,l=Math.hypot(dx,dy)||1,s=passSpeed(l);
 kick(m,p,dx/l*s,dy/l*s,{target:j});
}
function bestPassTarget(m,p){
 const d=teamDir(p.team);let best=-1,bs=-Infinity;
 for(const q of m.players){
  if(q.team!==p.team||q.i===p.i||q.role==='gk')continue;
  const dd=dist(p,q);if(dd<2.5||dd>24)continue;
  let open=9,blocked=0;
  for(const o of m.players){if(o.team===p.team)continue;open=Math.min(open,dist(o,q));if(segDist(o.x,o.y,p.x,p.y,q.x,q.y)<.9)blocked++;}
  const s=(q.x-p.x)*d*.25+Math.min(open,5)*.8-blocked*3-Math.abs(dd-9)*.12+(m.rng()-.5)*.6;
  if(s>bs){bs=s;best=q.i;}
 }
 return bs>-1.5?best:-1;
}
function aiShoot(m,p){
 const d=teamDir(p.team),gx=HL*d,k=m.players[(1-p.team)*5],dg=Math.hypot(gx-p.x,p.y);
 const corner=k.y>0?-1:1,err=(m.rng()-.5)*(.7+dg*.06),ty=corner*(GH-.3)+err;
 const dx=gx-p.x,dy=ty-p.y,l=Math.hypot(dx,dy)||1,s=R.shotSpeed*(.88+.12*m.rng());
 kick(m,p,dx/l*s,dy/l*s,{shot:true});
}
/* Comandi del calciatore attivo. Tiro assistito: se guardi verso la porta (entro ±5 m dalla linea dei
 * pali) la palla va nello specchio; altrimenti parte dritta dove guardi e può finire fuori. */
function userShoot(m,p,fx,fy){
 const gx=HL;let aim=null;
 if(fx>.15){const yHit=p.y+fy/fx*(gx-p.x);if(Math.abs(yHit)<=5)aim=clamp(yHit*.5,-(GH-.25),GH-.25)+(m.rng()-.5)*.4;}
 if(aim!==null){const dx=gx-p.x,dy=aim-p.y,l=Math.hypot(dx,dy)||1;kick(m,p,dx/l*R.shotSpeed,dy/l*R.shotSpeed,{shot:true});}
 else kick(m,p,fx*R.shotSpeed,fy*R.shotSpeed,{shot:true});
}
function userPass(m,p,fx,fy){
 let best=-1,bs=-Infinity;
 for(const q of m.players){
  if(q.team!==0||q.i===p.i||q.role==='gk')continue;
  const dx=q.x-p.x,dy=q.y-p.y,dd=Math.hypot(dx,dy)||1,cos=(dx*fx+dy*fy)/dd;
  if(cos<.42||dd>26)continue;                   // within ±65° of where you look
  let blocked=0;for(const o of m.players)if(o.team===1&&segDist(o.x,o.y,p.x,p.y,q.x,q.y)<.8)blocked++;
  const s=cos*2-dd*.06-blocked;if(s>bs){bs=s;best=q.i;}
 }
 if(best>=0){passTo(m,p,best,{lead:false});m.active=best;m.events.push({type:'switch',to:best,auto:true});}
 else kick(m,p,fx*10,fy*10);
}
function userTackle(m,p){
 if(p.tackle>0)return false;
 p.tackle=.5;const b=m.ball,o=b.owner>=0?m.players[b.owner]:null;
 if(o&&o.team===1&&o.role!=='gk'&&dist(p,b)<R.tackleRange+.45){
  if(m.rng()<.55){steal(m,p,o);return true;}
  p.stun=.25;return false;
 }
 p.vx+=p.fx*2.5;p.vy+=p.fy*2.5;                // a short lunge
 return false;
}
function steal(m,q,o){
 giveBall(m,q.i);o.cooldown=R.stealCooldown;o.stun=.4;m.stats.steals[q.team]++;
 m.events.push({type:'steal',team:q.team,by:q.i});
}
/* Cambio giocatore: il compagno di movimento più vicino alla palla (mai il portiere). Chi ha la palla
 * resta attivo. Restituisce l'indice del calciatore ora comandato. */
export function switchPlayer(m){
 if(m.ball.owner===m.active)return m.active;
 let best=-1,bd=Infinity;
 for(const p of m.players)if(p.team===0&&p.role!=='gk'&&p.i!==m.active){const dd=dist(p,m.ball);if(dd<bd){bd=dd;best=p.i;}}
 if(best>=0){m.active=best;m.events.push({type:'switch',to:best});}
 return m.active;
}

// ---- intelligenza artificiale (compagni, avversari, portieri) --------------------------------------
function teamHasBall(m,t){const o=m.ball.owner;return o>=0&&m.players[o].team===t;}
function formationSpot(m,p,attacking){
 const d=teamDir(p.team),s=SPOTS[p.role],bu=m.ball.x*d,bv=m.ball.y*d;
 let u=s.u+bu*(p.role==='fixo'?.45:.55)+(attacking?(p.role==='fixo'?3:5):-1);
 let v=s.v*(attacking?1.2:.8)+bv*(p.role==='pivot'?.45:.3);
 if(!attacking&&p.role!=='pivot')u=Math.min(u,bu-1.5);         // defenders stay goal-side of the ball
 return {x:clamp(u,-HL+2.5,HL-2)*d,y:clamp(v,-HW+1,HW-1)*d,speed:R.aiSpeed*(attacking?.85:.95)};
}
function interceptPoint(m,p){
 const b=m.ball,sp=Math.hypot(b.vx,b.vy);
 if(sp<.5)return {x:b.x,y:b.y};
 const ux=b.vx/sp,uy=b.vy/sp,ahead=Math.max(0,(p.x-b.x)*ux+(p.y-b.y)*uy);
 const reach=Math.min(ahead,sp*1.2);
 return {x:b.x+ux*reach,y:b.y+uy*reach};
}
function keeperTarget(m,p){
 const gx=ownGoalX(p.team),d=teamDir(p.team),b=m.ball;
 let tx=gx+d*.8,ty=clamp(b.y*.28,-1.1,1.1),speed=R.keeperSpeed;p.diving=false;
 const toGoal=Math.hypot(b.x-gx,b.y),bs=Math.hypot(b.vx,b.vy);
 if(b.owner<0&&b.vx*d<-4){                                     // a shot coming: get across to its line
  const t=(gx-b.x)/b.vx;
  if(t>0&&t<1.6){ty=clamp(b.y+b.vy*t,-1.9,1.9);tx=gx+d*.6;speed=R.keeperSpeed*1.5;p.diving=true;}
 }else if(b.owner<0&&toGoal<R.areaRadius&&bs<6){                // a loose ball in the area: rush out
  const rival=nearestOutfield(m,1-p.team,b.x,b.y),mine=Math.hypot(p.x-b.x,p.y-b.y);
  if(rival<0||dist(m.players[rival],b)>mine*.7){tx=b.x;ty=b.y;speed=R.keeperSpeed*1.2;}
 }else if(teamHasBall(m,1-p.team)&&toGoal<9){                   // narrow the angle
  tx=gx+(b.x-gx)*.2;ty=clamp(b.y*.3,-1.4,1.4);
 }
 return {x:tx,y:ty,speed};
}
function aiOwner(m,p,dt){
 p.hold+=dt;p.think-=dt;
 const d=teamDir(p.team),gx=HL*d;
 if(p.role==='gk'){
  if(p.hold>=R.keeperHold){const j=bestPassTarget(m,p);if(j>=0)passTo(m,p,j);else kick(m,p,d*13,p.y>0?-4:4);return null;}
  return {x:p.x,y:p.y,speed:0};
 }
 if(p.think<=0){
  p.think=.2+m.rng()*.2;
  const dg=Math.hypot(gx-p.x,p.y);
  let pressure=Infinity;for(const o of m.players)if(o.team!==p.team)pressure=Math.min(pressure,dist(o,p));
  if(p.mustPass){p.mustPass=false;const j=bestPassTarget(m,p);if(j>=0){passTo(m,p,j);return null;}}
  if(dg<8||(dg<13&&Math.abs(p.y)<6&&m.rng()<.55)||(dg<16&&Math.abs(p.y)<3&&m.rng()<.2)){aiShoot(m,p);return null;}
  if((pressure<1.8&&m.rng()<.55)||p.hold>2.8){const j=bestPassTarget(m,p);if(j>=0){passTo(m,p,j);return null;}}
 }
 // dribble towards the goal, sidestepping the nearest opponent
 let ux=gx-p.x,uy=-p.y*.5;const ul=Math.hypot(ux,uy)||1;ux/=ul;uy/=ul;
 let near=null,nd=Infinity;for(const o of m.players)if(o.team!==p.team){const dd=dist(o,p);if(dd<nd){nd=dd;near=o;}}
 if(near&&nd<3.5){const side=(p.y-near.y)>=0?1:-1,k=(3.5-nd)/3.5*1.3;uy+=side*k;}
 const vl=Math.hypot(ux,uy)||1;
 return {x:p.x+ux/vl*3,y:clamp(p.y+uy/vl*3,-HW+1,HW-1),speed:R.aiDribble};
}
function aiTarget(m,p){
 const b=m.ball;
 if(p.role==='gk')return keeperTarget(m,p);
 if(b.owner<0&&b.passTarget===p.i){const q=interceptPoint(m,p);return {...q,speed:R.aiSpeed*1.05};}
 const mine=teamHasBall(m,p.team);
 if(!mine){
  const gx=ownGoalX(p.team),theirs=b.owner>=0;
  const chaser=nearestOutfield(m,p.team,b.x,b.y,p.team===0?m.active:-1);
  const cover=k=>{const l=Math.hypot(gx-b.x,-b.y)||1;return {x:b.x+(gx-b.x)/l*k,y:b.y-b.y/l*k,speed:R.aiSpeed*.9};};
  if(!theirs){
   // a loose ball: the nearest goes for it; our AI team-mate only when clearly nearer than the player you control
   if(chaser===p.i&&(p.team===1||dist(p,b)+3<dist(m.players[m.active],b))){const q=interceptPoint(m,p);return {...q,speed:R.aiSpeed};}
  }else if(p.team===1){
   // press the ball itself (a little goal-side and ahead of where the dribbler is going)
   if(chaser===p.i){const o=m.players[b.owner],tx=b.x+o.vx*.25,ty=b.y+o.vy*.25,l=Math.hypot(gx-tx,-ty)||1;return {x:tx+(gx-tx)/l*.3,y:ty-ty/l*.3,speed:R.aiSpeed};}
   if(nearestOutfield(m,1,b.x,b.y,chaser)===p.i)return cover(3.2);
  }else if(chaser===p.i)return cover(3);              // you press the ball, the nearest team-mate covers
 }
 const attacking=mine||(b.owner<0&&b.lastTouch===p.team);
 const spot=formationSpot(m,p,attacking);
 if(attacking&&mine){                                           // offer a line of pass: drift off markers
  let o=null,od=Infinity;for(const q of m.players)if(q.team!==p.team){const dd=Math.hypot(q.x-spot.x,q.y-spot.y);if(dd<od){od=dd;o=q;}}
  if(o&&od<2.2)spot.y=clamp(spot.y+(spot.y>=o.y?1.6:-1.6),-HW+1,HW-1);
 }
 return spot;
}

// ---- passo della simulazione ----------------------------------------------------------------------
function userTarget(m,p,ix,iy,il){
 const speed=m.ball.owner===p.i?R.userDribble:R.userSpeed;
 if(il>.2)return {x:p.x+ix*3,y:p.y+iy*3,speed:speed*Math.min(1,il)};
 // receiving a pass with the stick at rest: step towards the ball
 if(m.ball.owner<0&&m.ball.passTarget===p.i){const q=interceptPoint(m,p);return {...q,speed:R.userSpeed*.8};}
 return null;
}
function readInput(m,input){
 let ix=Number(input.x)||0,iy=Number(input.y)||0;const il=Math.hypot(ix,iy);if(il>1){ix/=il;iy/=il;}
 return {ix,iy,il};
}
function moveToward(p,t,dt,acc){
 let dvx=0,dvy=0;
 if(t){const dx=t.x-p.x,dy=t.y-p.y,dd=Math.hypot(dx,dy);if(dd>.12){const s=Math.min(t.speed,dd*4);dvx=dx/dd*s;dvy=dy/dd*s;}}
 if(p.stun>0){dvx=0;dvy=0;}
 const k=Math.min(1,dt*acc);p.vx+=(dvx-p.vx)*k;p.vy+=(dvy-p.vy)*k;
}
function integrate(m,dt){
 const b=m.ball;
 for(const p of m.players){
  p.x+=p.vx*dt;p.y+=p.vy*dt;
  const sp=Math.hypot(p.vx,p.vy);
  if(sp>.3&&p.i!==m.active){p.fx=p.vx/sp;p.fy=p.vy/sp;}
  p.anim+=sp*dt*2.4;
  if(p.role==='gk'){
   const gx=ownGoalX(p.team),d=teamDir(p.team);
   p.x=clamp(p.x,Math.min(gx,gx+d*6.5),Math.max(gx,gx+d*6.5));if(p.x*d<-HL+.2)p.x=(-HL+.2)*d;p.y=clamp(p.y,-6.5,6.5);
  }else if(b.owner===p.i){p.x=clamp(p.x,-HL+.5,HL-.5);p.y=clamp(p.y,-HW+.5,HW-.5);}
  else{p.x=clamp(p.x,-HL-.6,HL+.6);p.y=clamp(p.y,-HW-.6,HW+.6);}
 }
 // players do not overlap
 const P=m.players,min=R.playerRadius*2;
 for(let i=0;i<P.length;i++)for(let j=i+1;j<P.length;j++){
  const a=P[i],c=P[j],dx=c.x-a.x,dy=c.y-a.y,dd=Math.hypot(dx,dy);
  if(dd<min&&dd>1e-6){const push=(min-dd)/2;a.x-=dx/dd*push;a.y-=dy/dd*push;c.x+=dx/dd*push;c.y+=dy/dd*push;}
 }
}
/* Linee: dove passa la palla fra due posizioni. goal = entra fra i pali (tutta la palla dentro la luce
 * della porta); post = tocca un palo; end = esce dal fondo fuori dai pali; side = esce di lato. */
export function classifyBallCrossing(px,py,nx,ny,rules=R){
 const hl=rules.length/2,hw=rules.width/2,gh=rules.goalWidth/2,br=rules.ballRadius;
 for(const side of [1,-1]){
  const line=side*hl;
  if((px-line)*side<0&&(nx-line)*side>=0){
   const t=(line-px)/(nx-px),y=py+t*(ny-py);
   if(Math.abs(y)<=hw){
    if(Math.abs(y)<gh-br)return {type:'goal',side,x:line,y};
    if(Math.abs(y)<=gh+br)return {type:'post',side,x:line,y};
    return {type:'end',side,x:line,y};
   }
  }
 }
 if(Math.abs(ny)>hw&&Math.abs(py)<=hw){const s=Math.sign(ny),t=(s*hw-py)/(ny-py);return {type:'side',side:s,x:px+t*(nx-px),y:s*hw};}
 return null;
}
// the team that scores in the goal at that end: the right goal (+x) is defended by BLU
export const scorerAt=side=>side>0?0:1;
function handleCrossing(m,c){
 const b=m.ball;
 if(c.type==='goal'){
  const team=scorerAt(c.side);m.score[team]++;m.lastGoalTeam=team;
  b.x=c.side*(HL+.25);b.y=clamp(c.y,-GH+.2,GH-.2);b.vx*=.2;b.vy*=.2;b.inNet=true;b.owner=-1;
  m.phase='goal';m.timer=R.goalPause;
  m.events.push({type:'goal',team,by:b.lastKicker,own:b.lastKicker>=0&&m.players[b.lastKicker].team!==team,score:[...m.score]});
  return;
 }
 if(c.type==='post'){
  b.x=c.side*(HL-.02);b.vx=-b.vx*.45;b.vy=b.vy*.6+(c.y>0?1:-1)*1.6;
  m.events.push({type:'post',side:c.side});return;
 }
 if(c.type==='end'){
  const defending=c.side>0?1:0;
  if(b.lastTouch===defending)setRestart(m,'angolo',1-defending,c.side*(HL-.3),Math.sign(c.y)*(HW-.3));
  else setRestart(m,'fondo',defending,c.side*(HL-1.4),0);
  m.events.push({type:'out',kind:m.restart.kind,team:m.restart.team});return;
 }
 setRestart(m,'laterale',1-b.lastTouch,clamp(c.x,-HL+.5,HL-.5),c.side*(HW-.12));
 m.events.push({type:'out',kind:'laterale',team:m.restart.team});
}
function keeperSaves(m,px,py){
 const b=m.ball;
 for(const t of [0,1]){
  if(b.owner>=0)return;
  const k=m.players[t*5],sp=Math.hypot(b.vx,b.vy),towards=b.vx*teamDir(t)<0;
  const reach=R.keeperReach+(k.diving?R.keeperDive:0),dd=segDist(k.x,k.y,px,py,b.x,b.y);
  if(dd>reach||k.stun>0)continue;
  if(sp<9){if(b.lastKicker!==k.i||k.cooldown<=0){giveBall(m,k.i,{protect:9});k.hold=0;}continue;}
  if(!towards||b.saveTried)continue;
  b.saveTried=true;k.dive=.5;
  const chance=clamp(.98-(sp-9)*.035-dd*.28,.2,.92);
  if(m.rng()<chance){
   m.stats.saves[t]++;m.events.push({type:'save',team:t,by:k.i});
   if(sp<15){giveBall(m,k.i,{protect:9});k.hold=0;}
   else{b.vx=-b.vx*.4;b.vy=b.vy*.3+(m.rng()<.5?-1:1)*(3+m.rng()*2);b.lastTouch=t;b.shot=false;b.x=k.x+Math.sign(b.vx)*.4;}
  }
 }
}
function stepBall(m,dt){
 const b=m.ball;
 if(b.owner>=0){
  const p=m.players[b.owner],hold=p.role==='gk';
  b.x=p.x+(hold?p.fx*.15:p.fx*.45);b.y=p.y+(hold?p.fy*.15:p.fy*.45)+.04;b.vx=p.vx;b.vy=p.vy;
  b.spin+=Math.hypot(p.vx,p.vy)*dt*3;return;
 }
 const px=b.x,py=b.y,sp=Math.hypot(b.vx,b.vy);
 if(sp>0){const ns=Math.max(0,sp*Math.exp(-R.friction*dt)-R.rolling*dt),k=ns/sp;b.vx*=k;b.vy*=k;}
 b.x+=b.vx*dt;b.y+=b.vy*dt;b.spin+=sp*dt*3;
 const c=classifyBallCrossing(px,py,b.x,b.y);
 if(c){handleCrossing(m,c);return;}
 keeperSaves(m,px,py);
 if(b.owner>=0)return;
 const fast=Math.hypot(b.vx,b.vy)>R.controlMaxSpeed;
 let best=-1,bd=Infinity;
 for(const q of m.players){
  if(q.role==='gk')continue;
  if(fast){
   // a hard shot or pass is not controlled, but a body in its way deflects it
   if(q.team!==b.lastTouch&&q.i!==b.blockedBy&&segDist(q.x,q.y,px,py,b.x,b.y)<R.playerRadius+R.ballRadius+.05){
    b.vx=b.vx*-.25+(m.rng()-.5)*3;b.vy=b.vy*.4+(m.rng()-.5)*5;b.lastTouch=q.team;b.blockedBy=q.i;b.shot=false;b.passTarget=-1;
    m.events.push({type:'block',team:q.team,by:q.i});return;
   }
   continue;
  }
  if(q.cooldown>0||q.stun>0)continue;
  const dd=dist(q,b);if(dd<R.control&&dd<bd){bd=dd;best=q.i;}
 }
 if(best>=0)giveBall(m,best);
}
function steals(m){
 const b=m.ball;if(b.owner<0)return;
 const o=m.players[b.owner];if(o.role==='gk'||o.protect>0)return;
 for(const q of m.players){
  if(q.team===o.team||q.role==='gk'||q.tackle>0||q.cooldown>0||q.stun>0)continue;
  if(dist(q,b)>R.tackleRange&&dist(q,o)>R.tackleRange+.2)continue;
  q.tackle=.45;
  const chance=q.team===0?.3:(o.team===0?.35:.4);
  if(m.rng()<chance){steal(m,q,o);return;}
 }
}
function tickTimers(m,dt){
 for(const p of m.players){
  p.cooldown=Math.max(0,p.cooldown-dt);p.tackle=Math.max(0,p.tackle-dt);p.protect=Math.max(0,p.protect-dt);
  p.stun=Math.max(0,p.stun-dt);p.dive=Math.max(0,p.dive-dt);p.kick=Math.max(0,p.kick-dt);
 }
}
function endMatch(m){
 m.phase='end';m.time=R.realSeconds;
 const b=m.ball;b.vx=0;b.vy=0;
 m.result=matchResult(m);
 m.events.push({type:'whistle',kind:'end'},{type:'end',result:m.result});
}
export function matchResult(m){
 const [h,a]=m.score;
 return {id:m.id,home:h,away:a,outcome:h>a?'vittoria':h===a?'pareggio':'sconfitta',pitch:m.pitchName||''};
}
/* Un passo di gioco. input: {x,y} direzione (−1…1) del calciatore attivo, shoot/pass/switch = tasto
 * appena premuto. Nessun effetto sulla città: la scena è separata dal movimento GTA. */
export function stepMatch(m,input={},dt=R.step){
 if(m.phase==='intro'||m.phase==='end')return m;
 tickTimers(m,dt);
 if(m.phase==='kickoff'){
  m.timer-=dt;
  if(m.timer<=0){const t=m.restart.taker;m.restart=null;m.phase='play';giveBall(m,t);if(m.players[t].team===1)m.players[t].mustPass=true;}
  return m;
 }
 if(m.phase==='goal'){
  const b=m.ball;b.x+=b.vx*dt;b.y+=b.vy*dt;b.vx*=.9;b.vy*=.9;
  b.x=Math.sign(b.x)*clamp(Math.abs(b.x),HL+.15,HL+R.goalDepth-.15);b.y=clamp(b.y,-GH+.2,GH-.2);
  for(const p of m.players){p.vx*=.85;p.vy*=.85;p.anim+=dt*(p.team===m.lastGoalTeam?6:0);}
  m.timer-=dt;if(m.timer<=0)setKickoff(m,1-m.lastGoalTeam);
  return m;
 }
 m.time+=dt;
 const {ix,iy,il}=readInput(m,input);
 if(m.phase==='restart'){
  const taker=m.restart.taker,rb={x:m.restart.x,y:m.restart.y};
  for(const p of m.players){
   if(p.i===taker){p.vx=0;p.vy=0;continue;}
   moveToward(p,p.i===m.active?userTarget(m,p,ix,iy,il):aiTarget(m,p),dt,p.i===m.active?14:8);
  }
  integrate(m,dt);
  for(const q of m.players){if(q.team===m.restart.team)continue;const dd=dist(q,rb);if(dd<R.restartDistance&&dd>.01){q.x=rb.x+(q.x-rb.x)*R.restartDistance/dd;q.y=rb.y+(q.y-rb.y)*R.restartDistance/dd;}}
  m.timer-=dt;
  if(m.timer<=0){m.phase='play';m.restart=null;giveBall(m,taker,{protect:taker%5===0?9:.6});}
  if(m.time>=R.realSeconds)endMatch(m);
  return m;
 }
 // ---- play
 if(input.switch)switchPlayer(m);
 const me=m.players[m.active];
 if(il>.2){me.fx=ix/il;me.fy=iy/il;}
 const owns=m.ball.owner===me.i;
 if(me.stun<=0){
  if(owns&&input.shoot)userShoot(m,me,me.fx,me.fy);
  else if(owns&&input.pass)userPass(m,me,me.fx,me.fy);
  else if(!owns&&(input.shoot||input.pass))userTackle(m,me);
 }
 for(const p of m.players){
  if(p.i===m.active){moveToward(p,userTarget(m,p,ix,iy,il),dt,14);continue;}
  moveToward(p,m.ball.owner===p.i?aiOwner(m,p,dt):aiTarget(m,p),dt,8);
 }
 integrate(m,dt);
 stepBall(m,dt);
 if(m.phase==='play')steals(m);
 if(m.time>=R.realSeconds&&(m.phase==='play'||m.phase==='restart'))endMatch(m);
 return m;
}
export function matchMinute(m){return Math.min(R.displayMinutes,Math.floor(Math.min(m.time,R.realSeconds)/R.realSeconds*R.displayMinutes));}
export function matchClockLabel(m){return matchMinute(m)+'\'';}

// ---- salvataggio nella campagna: solo vittorie, pareggi e sconfitte ------------------------------
export function freshFootballSave(){return {won:0,drawn:0,lost:0,ids:[]};}
export function sanitizeFootballSave(raw){
 const out=freshFootballSave();if(!raw||typeof raw!=='object')return out;
 for(const k of ['won','drawn','lost']){const n=Number(raw[k]);out[k]=Number.isInteger(n)&&n>0?Math.min(n,9999):0;}
 if(Array.isArray(raw.ids))out.ids=raw.ids.filter(id=>typeof id==='string'&&id.length<=80).slice(-20);
 return out;
}
/* Registra il risultato di una partita finita una sola volta (stesso id = nessun doppione). */
export function recordFootballResult(progress,result){
 const key={vittoria:'won',pareggio:'drawn',sconfitta:'lost'}[result?.outcome];
 if(!progress||!key||typeof result.id!=='string'||!result.id)return false;
 const f=progress.football=sanitizeFootballSave(progress.football);
 if(f.ids.includes(result.id))return false;
 f[key]++;f.ids=[...f.ids,result.id].slice(-20);
 return true;
}
export function footballRecordText(f){const s=sanitizeFootballSave(f);return 'V '+s.won+' · P '+s.drawn+' · S '+s.lost;}
/* Dove si torna: al cancello del campetto da cui si è entrati. Se si è premuto E al cancello si
 * torna esattamente in quella posa; se lo si è premuto dentro le linee, sul cancello, rivolti fuori. */
export function footballReturnPoint(pitch,entry,hotspot=3){
 const g=pitch?.gate,e={x:entry.x,y:entry.y,a:entry.a};
 if(!g||!Number.isFinite(g.x)||Math.hypot(e.x-g.x,e.y-g.y)<=hotspot)return e;
 return {x:g.x,y:g.y,a:Math.atan2(g.y-pitch.cy,g.x-pitch.cx)};
}

// ---- disegno (pixel art semplice) -----------------------------------------------------------------
const PAL={out:'#1d2b24',ground:'#25352d',runoff:'#2f6e3c',grass:['#3f8a4a','#4a9654'],line:'#eef3e6',fence:'#20372c',post:'#4a5a54',
 net:'#c8d1cb',frame:'#ffffff',shadow:'rgba(0,0,0,.32)',marker:'#ffe14a',ball:'#f7f5ee',ballDark:'#2b2b2b',boot:'#161616',lamp:'#d8e2db'};
const SKINS=['#e6b98f','#c98f63','#a06a43','#f1cba6'],HAIRS=['#2a1d14','#4b2f1a','#151515','#6e4a2b','#b98d4e'];
function rect(c,x,y,w,h,col){c.fillStyle=col;c.fillRect(Math.round(x),Math.round(y),w,h);}
function plotArc(c,cx,cy,r,a0,a1,col){
 c.fillStyle=col;const n=Math.max(8,Math.ceil(Math.abs(a1-a0)*r*1.6));let lx=null,ly=null;
 for(let k=0;k<=n;k++){const a=a0+(a1-a0)*k/n,x=Math.round(cx+Math.cos(a)*r),y=Math.round(cy+Math.sin(a)*r);if(x!==lx||y!==ly){c.fillRect(x,y,1,1);lx=x;ly=y;}}
}
export function footballView(cssW,cssH){
 const W=cssW>0?cssW:844,H=cssH>0?cssH:390,top=Math.min(46,H*.11);
 const s=Math.min(W/(R.length+5.5),(H-top)/(R.width+5));        // CSS px per metre
 const P=clamp(Math.round(s/8.5),1,4);                           // CSS px per art pixel
 const cw=Math.ceil(W/P),ch=Math.ceil(H/P);
 return {P,W:cw,H:ch,ppm:s/P,ox:Math.round(cw/2),oy:Math.round((top+(H-top)/2)/P),cssW:W,cssH:H};
}
export function drawFootballField(c,v){
 const X=x=>v.ox+x*v.ppm,Y=y=>v.oy+y*v.ppm,k=v.ppm;
 rect(c,0,0,v.W,v.H,PAL.out);
 const fm=2.3;                                                  // fence 2,3 m outside the lines
 rect(c,X(-HL-fm-1.2),Y(-HW-fm-1.2),(R.length+2*fm+2.4)*k,(R.width+2*fm+2.4)*k,PAL.ground);
 rect(c,X(-HL-fm),Y(-HW-fm),(R.length+2*fm)*k,(R.width+2*fm)*k,PAL.runoff);
 const bands=10;
 for(let i=0;i<bands;i++){const x0=Math.round(X(-HL+i*R.length/bands)),x1=Math.round(X(-HL+(i+1)*R.length/bands));rect(c,x0,Y(-HW),x1-x0,Math.round(R.width*k),PAL.grass[i%2]);}
 // lines
 const L=PAL.line,x0=Math.round(X(-HL)),x1=Math.round(X(HL)),y0=Math.round(Y(-HW)),y1=Math.round(Y(HW));
 rect(c,x0,y0,x1-x0+1,1,L);rect(c,x0,y1,x1-x0+1,1,L);rect(c,x0,y0,1,y1-y0+1,L);rect(c,x1,y0,1,y1-y0+1,L);
 rect(c,Math.round(X(0)),y0,1,y1-y0+1,L);
 plotArc(c,X(0),Y(0),R.centreRadius*k,0,Math.PI*2,L);rect(c,Math.round(X(0))-1,Math.round(Y(0))-1,2,2,L);
 for(const s of [-1,1]){
  const gx=X(s*HL),r=R.areaRadius*k;
  // calcio a 5 area: two quarter circles from the posts joined by a straight line
  if(s>0){plotArc(c,gx,Y(-GH),r,Math.PI,Math.PI*1.5,L);plotArc(c,gx,Y(GH),r,Math.PI/2,Math.PI,L);}
  else{plotArc(c,gx,Y(-GH),r,-Math.PI/2,0,L);plotArc(c,gx,Y(GH),r,0,Math.PI/2,L);}
  rect(c,Math.round(gx-s*r),Math.round(Y(-GH)),1,Math.round(R.goalWidth*k)+1,L);
  rect(c,Math.round(X(s*(HL-6))),Math.round(Y(0)),1,1,L);rect(c,Math.round(X(s*(HL-10))),Math.round(Y(0)),1,1,L);
  // goal: hatched net behind the line, white frame and posts
  const nx0=Math.round(Math.min(X(s*HL),X(s*(HL+R.goalDepth)))),nx1=Math.round(Math.max(X(s*HL),X(s*(HL+R.goalDepth))));
  const ny0=Math.round(Y(-GH)),ny1=Math.round(Y(GH));
  c.fillStyle=PAL.net;for(let yy=ny0;yy<=ny1;yy++)for(let xx=nx0;xx<=nx1;xx++)if((xx+yy)%2===0)c.fillRect(xx,yy,1,1);
  rect(c,nx0,ny0,nx1-nx0+1,1,PAL.frame);rect(c,nx0,ny1,nx1-nx0+1,1,PAL.frame);
  rect(c,s>0?nx1:nx0,ny0,1,ny1-ny0+1,PAL.frame);
  rect(c,Math.round(gx)-1,ny0-1,2,2,PAL.frame);rect(c,Math.round(gx)-1,ny1,2,2,PAL.frame);
 }
 // fence with posts every 3 m and four floodlights, as on the Q32 pitch in the city
 const fx0=Math.round(X(-HL-fm)),fx1=Math.round(X(HL+fm)),fy0=Math.round(Y(-HW-fm)),fy1=Math.round(Y(HW+fm));
 rect(c,fx0,fy0,fx1-fx0+1,1,PAL.fence);rect(c,fx0,fy1,fx1-fx0+1,1,PAL.fence);rect(c,fx0,fy0,1,fy1-fy0+1,PAL.fence);rect(c,fx1,fy0,1,fy1-fy0+1,PAL.fence);
 for(let x=-HL-fm;x<=HL+fm+.01;x+=3){rect(c,X(x),fy0-2,1,3,PAL.post);rect(c,X(x),fy1-2,1,3,PAL.post);}
 for(let y=-HW-fm;y<=HW+fm+.01;y+=3){rect(c,fx0,Y(y)-2,1,3,PAL.post);rect(c,fx1,Y(y)-2,1,3,PAL.post);}
 for(const [x,y] of [[fx0,fy0],[fx1,fy0],[fx0,fy1],[fx1,fy1]]){rect(c,x,y-6,1,6,PAL.post);rect(c,x-1,y-7,3,2,PAL.lamp);}
}
/* Calciatore 7×9 pixel visto dall'alto di tre quarti: capelli, viso, maglia a due colori, pantaloncini,
 * calzettoni e scarpe; le gambe si alternano quando corre. */
function drawFootballer(c,X,Y,p,team,{active=false,celebrate=0,owner=false}={}){
 const T=FOOTBALL_TEAMS[p.team],gk=p.role==='gk',shirt=gk?T.keeper:T.shirt,trim=gk?T.keeperTrim:T.trim;
 const skin=SKINS[p.look%SKINS.length],hair=HAIRS[(p.look>>1)%HAIRS.length];
 const x=Math.round(X)-3,y=Math.round(Y)-9-(celebrate>0&&Math.floor(p.anim*2)%2?2:0);
 rect(c,x+1,Math.round(Y),5,1,PAL.shadow);rect(c,x+2,Math.round(Y)+1,3,1,PAL.shadow);
 if(gk&&p.dive>0){                                              // keeper stretching sideways
  const s=p.vy>=0?1:-1;
  rect(c,x,y+5,7,2,shirt);rect(c,x+(s>0?0:5),y+4,2,2,skin);rect(c,x+(s>0?5:0),y+7,2,2,T.shorts);return;
 }
 const up=p.fy<-.55&&Math.abs(p.fy)>Math.abs(p.fx),side=!up&&Math.abs(p.fx)>Math.abs(p.fy)*1.2,flip=side&&p.fx<0;
 const px=(dx,dy,w,h,col)=>rect(c,flip?x+7-dx-w:x+dx,y+dy,w,h,col);
 // head
 px(2,0,3,1,hair);
 if(up){px(1,1,5,2,hair);}
 else if(side){px(1,1,2,2,hair);px(3,1,3,2,skin);}
 else{px(1,1,1,1,hair);px(5,1,1,1,hair);px(2,1,3,2,skin);}
 // shirt (two colours: body and a trim stripe / collar)
 px(1,3,5,3,shirt);px(3,3,1,3,trim);px(1,3,5,1,shirt);px(2,3,3,1,trim);
 const swing=Math.floor(p.anim)%2,moving=Math.hypot(p.vx,p.vy)>.4;
 // arms
 px(0,moving&&swing?3:4,1,2,skin);px(6,moving&&!swing?3:4,1,2,skin);
 // shorts, socks, boots
 px(2,6,3,1,T.shorts);
 if(moving){
  px(2,7,1,1,T.socks);px(4,7,1,1,T.socks);
  if(swing){px(2,8,1,1,PAL.boot);px(4,7,1,1,PAL.boot);}else{px(2,7,1,1,PAL.boot);px(4,8,1,1,PAL.boot);}
 }else{px(2,7,1,1,T.socks);px(4,7,1,1,T.socks);px(2,8,1,1,PAL.boot);px(4,8,1,1,PAL.boot);}
 if(p.kick>0)px(side?5:3,8,1,1,PAL.boot);
 if(active){                                                    // yellow arrow over the controlled player
  rect(c,x+1,y-5,5,1,PAL.marker);rect(c,x+2,y-4,3,1,PAL.marker);rect(c,x+3,y-3,1,1,PAL.marker);
  rect(c,x,Math.round(Y)+1,1,1,PAL.marker);rect(c,x+6,Math.round(Y)+1,1,1,PAL.marker);
 }
}
function drawBall(c,X,Y,b){
 // 3×3 pixels with a dark outline-free patch that turns as it rolls: readable on a phone too
 const x=Math.round(X)-1,y=Math.round(Y)-2;
 rect(c,x,y+3,3,1,PAL.shadow);rect(c,x,y,3,3,PAL.ball);
 const s=Math.floor(b.spin)%4;rect(c,x+(s===1||s===2?2:0),y+(s>=2?2:0),1,1,PAL.ballDark);rect(c,x+1,y+1,1,1,PAL.ballDark);
}
export function drawFootballScene(c,m,v,field=null){
 if(field)c.drawImage(field,0,0);else drawFootballField(c,v);
 const X=x=>v.ox+x*v.ppm,Y=y=>v.oy+y*v.ppm,b=m.ball;
 const items=m.players.map(p=>({y:p.y,p}));items.push({y:b.y+.01,ball:true});
 items.sort((a,q)=>a.y-q.y);
 for(const it of items){
  if(it.ball)drawBall(c,X(b.x),Y(b.y),b);
  else drawFootballer(c,X(it.p.x),Y(it.p.y),it.p,it.p.team,{active:it.p.i===m.active&&m.phase!=='end',celebrate:m.phase==='goal'&&it.p.team===m.lastGoalTeam?1:0,owner:b.owner===it.p.i});
 }
}

// ---- scena a schermo intero sopra la città ----------------------------------------------------------
let session=null,audio=null;
export const isFootballOpen=()=>!!session;
function whistle(sound,kind){
 if(!sound||sound.muted)return;
 try{
  const AC=globalThis.AudioContext||globalThis.webkitAudioContext;if(!AC)return;
  audio||=new AC();if(audio.state==='suspended')audio.resume?.();
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
function ensurePanel(doc){
 let panel=doc.getElementById('football-panel');if(panel)return panel;
 panel=doc.createElement('section');panel.id='football-panel';panel.className='football';panel.hidden=true;
 panel.setAttribute('role','dialog');panel.setAttribute('aria-label','Partita di calcetto 5 contro 5');
 panel.oncontextmenu=e=>e.preventDefault?.();             // no long-press menu on the touch buttons
 panel.innerHTML='<canvas id="fb-canvas" aria-label="Campo di calcetto visto dall\'alto"></canvas>'+
  '<div class="fb-top"><button id="fb-exit" type="button" aria-label="Esci dalla partita e torna al campetto">ESCI</button>'+
  '<div class="fb-score" aria-live="polite"><span class="fb-chip fb-home">ROSSI</span><b id="fb-score">0 – 0</b><span class="fb-chip fb-away">BLU</span><span id="fb-clock" class="fb-clock">0\'</span></div></div>'+
  '<div id="fb-banner" class="fb-banner" hidden></div>'+
  '<div id="fb-card" class="fb-card"><h2 id="fb-title">CALCETTO 5 CONTRO 5</h2><p id="fb-text"></p><button id="fb-go" type="button">CALCIO D\'INIZIO</button></div>'+
  '<div class="fb-stick" id="fb-stick" role="application" aria-label="Levetta: muovi il calciatore con la freccia gialla"><div class="fb-knob" id="fb-knob"></div></div>'+
  '<div class="fb-buttons"><button id="fb-switch" type="button" aria-label="Cambia giocatore">CAMBIO</button><button id="fb-pass" type="button" aria-label="Passaggio">PASSA</button><button id="fb-shoot" type="button" aria-label="Tiro">TIRO</button></div>'+
  '<p class="fb-keys">'+FOOTBALL_KEYS+'</p>';
 (doc.body||doc.documentElement).appendChild(panel);
 return panel;
}
const DIRS={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',w:'up',a:'left',s:'down',d:'right',W:'up',A:'left',S:'down',D:'right'};
const BANNERS={goal:e=>e.own?'AUTOGOL! '+FOOTBALL_TEAMS[e.team].name:'GOL! '+FOOTBALL_TEAMS[e.team].name,post:()=>'PALO! NIENTE GOL',save:()=>'PARATA!',
 out:e=>e.kind==='laterale'?'RIMESSA LATERALE':e.kind==='angolo'?'CALCIO D\'ANGOLO':'FUORI · RIMESSA DAL FONDO'};
/* Apre la partita. pitch: campetto Q32; record(): bilancio della campagna; onResult(result): una
 * volta al fischio finale; onExit({result,abandoned}): all'uscita (risultato null se abbandonata). */
export function openFootballGame({pitch=null,seed=(Date.now()>>>0),id=null,record=()=>null,onResult=()=>{},onExit=()=>{},sound=null,
 doc=globalThis.document,raf=globalThis.requestAnimationFrame?.bind(globalThis),caf=globalThis.cancelAnimationFrame?.bind(globalThis),now=()=>globalThis.performance?.now?.()??Date.now()}={}){
 if(session||!doc||!raf)return false;
 const panel=ensurePanel(doc),$=k=>doc.getElementById(k),canvas=$('fb-canvas'),c=canvas.getContext('2d');
 const m=createMatch({seed,id:id||('calcetto-'+(pitch?.id||'campetto')+'-'+(seed>>>0).toString(36)),pitchName:pitch?.nome||''});
 const keys={up:false,down:false,left:false,right:false},stick={x:0,y:0,id:null},edges={shoot:false,pass:false,switch:false};
 let rafId=0,last=null,acc=0,view=null,field=null,banner=0,reported=false,lastScore='',lastClock='',lastPhase='';
 const recordText=()=>footballRecordText(record?.()||null);
 const showCard=(title,text,button)=>{$('fb-title').textContent=title;$('fb-text').textContent=text;$('fb-go').textContent=button;$('fb-card').hidden=false;};
 showCard('CALCETTO 5 CONTRO 5',(pitch?.nome?pitch.nome.toUpperCase()+' · ':'')+'TU SEI I ROSSI (ATTACCHI VERSO DESTRA), CONTRO I BLU. 2 MINUTI, CRONOMETRO ACCELERATO. '+
  'GOL SOLO TRA I PALI. BILANCIO: '+recordText()+'.',"CALCIO D'INIZIO");
 const resize=()=>{
  const w=panel.clientWidth||globalThis.innerWidth||844,h=panel.clientHeight||globalThis.innerHeight||390;
  if(view&&view.cssW===w&&view.cssH===h)return;
  view=footballView(w,h);canvas.width=view.W;canvas.height=view.H;
  // whole art pixels: the canvas is P CSS px per pixel (it may exceed the screen by < P px)
  if(canvas.style){canvas.style.width=view.W*view.P+'px';canvas.style.height=view.H*view.P+'px';}
  field=null;
  try{field=doc.createElement('canvas');field.width=view.W;field.height=view.H;const fc=field.getContext('2d');if(fc){fc.imageSmoothingEnabled=false;drawFootballField(fc,view);}else field=null;}catch(_){field=null;}
 };
 const action=kind=>{
  if(m.phase==='intro'){if(kind!=='switch'){startMatch(m);$('fb-card').hidden=true;whistle(sound,'start');}return;}
  if(m.phase==='end'){if(kind!=='switch')close();return;}
  if(kind in edges)edges[kind]=true;
 };
 const input=first=>{
  let x=Math.abs(stick.x)>.12?stick.x:Number(keys.right)-Number(keys.left),y=Math.abs(stick.y)>.12?stick.y:Number(keys.down)-Number(keys.up);
  const out={x,y,shoot:first&&edges.shoot,pass:first&&edges.pass,switch:first&&edges.switch};
  if(first){edges.shoot=false;edges.pass=false;edges.switch=false;}
  return out;
 };
 const events=()=>{
  for(const e of m.events){
   const text=BANNERS[e.type]?.(e);
   if(text){$('fb-banner').textContent=text;$('fb-banner').hidden=false;banner=e.type==='goal'?2.2:1.3;}
   if(e.type==='goal')whistle(sound,'goal');
   if(e.type==='end'){
    if(!reported){reported=true;try{onResult(m.result);}catch(err){console.error('Calcetto: salvataggio del risultato',err);}}
    whistle(sound,'end');
    const r=m.result,word=r.outcome==='vittoria'?'VITTORIA!':r.outcome==='pareggio'?'PAREGGIO':'SCONFITTA';
    $('fb-banner').hidden=true;
    showCard('FISCHIO FINALE · '+word,'ROSSI '+r.home+' – '+r.away+' BLU. BILANCIO NELLA CAMPAGNA: '+recordText()+'.','TORNA AL CAMPETTO');
   }
  }
  m.events.length=0;
 };
 const hud=()=>{
  const sc=m.score[0]+' – '+m.score[1],cl=matchClockLabel(m);
  if(sc!==lastScore){$('fb-score').textContent=sc;lastScore=sc;}
  if(cl!==lastClock){$('fb-clock').textContent=cl;lastClock=cl;}
  if(m.phase!==lastPhase){panel.classList?.toggle?.('fb-playing',m.phase!=='intro'&&m.phase!=='end');lastPhase=m.phase;}
 };
 const frame=t=>{
  rafId=0;if(session?.match!==m)return;
  const dt=last===null?0:Math.min(.1,Math.max(0,(t-last)/1000));last=t;acc+=dt;
  let n=0;
  while(acc>=R.step&&n<8){stepMatch(m,input(n===0),R.step);acc-=R.step;n++;}
  if(n===8)acc=0;
  events();
  if(banner>0){banner-=dt;if(banner<=0)$('fb-banner').hidden=true;}
  resize();c.imageSmoothingEnabled=false;drawFootballScene(c,m,view,field);hud();
  rafId=raf(frame);
 };
 const onKey=e=>{
  e.stopImmediatePropagation?.();
  if(e.key==='Escape'){e.preventDefault?.();close();return;}
  const dir=DIRS[e.key];if(dir){e.preventDefault?.();keys[dir]=true;return;}
  if(e.code==='Space'||e.key===' '){e.preventDefault?.();if(!e.repeat)action('shoot');return;}
  if(e.key==='x'||e.key==='X'||e.key==='Shift'){e.preventDefault?.();if(!e.repeat)action('pass');return;}
  if(e.key==='q'||e.key==='Q'){e.preventDefault?.();if(!e.repeat)action('switch');return;}
  if(e.key==='Enter'||e.key==='e'||e.key==='E'){e.preventDefault?.();if(!e.repeat)action('confirm');}
 };
 const onKeyUp=e=>{const dir=DIRS[e.key];if(dir)keys[dir]=false;};
 const onBlur=()=>{keys.up=keys.down=keys.left=keys.right=false;stick.x=stick.y=0;};
 const knob=$('fb-knob'),stickEl=$('fb-stick');
 const moveStick=e=>{
  const box=stickEl.getBoundingClientRect?.();if(!box)return;
  const cx=box.left+box.width/2,cy=box.top+box.height/2,r=box.width*.34;
  let dx=e.clientX-cx,dy=e.clientY-cy;const l=Math.hypot(dx,dy);if(l>r){dx*=r/l;dy*=r/l;}
  stick.x=dx/r;stick.y=dy/r;if(knob)knob.style.transform='translate('+dx+'px,'+dy+'px)';
 };
 const releaseStick=e=>{if(stick.id!==e.pointerId)return;stick.id=null;stick.x=0;stick.y=0;if(knob)knob.style.transform='translate(0,0)';};
 stickEl.onpointerdown=e=>{e.preventDefault?.();stick.id=e.pointerId;try{stickEl.setPointerCapture(e.pointerId);}catch(_){}moveStick(e);};
 stickEl.onpointermove=e=>{if(stick.id===e.pointerId)moveStick(e);};
 stickEl.onpointerup=stickEl.onpointercancel=stickEl.onlostpointercapture=releaseStick;
 for(const [btn,kind] of [['fb-shoot','shoot'],['fb-pass','pass'],['fb-switch','switch']]){
  const el=$(btn);
  el.onpointerdown=e=>{e.preventDefault?.();el.classList?.add?.('pressed');action(kind);};
  el.onpointerup=el.onpointercancel=el.onpointerleave=()=>el.classList?.remove?.('pressed');
 }
 $('fb-go').onclick=()=>action('confirm');
 $('fb-exit').onclick=()=>close();
 const close=()=>{
  if(!session)return;session=null;
  if(rafId&&caf)caf(rafId);rafId=0;
  doc.removeEventListener('keydown',onKey,true);doc.removeEventListener('keyup',onKeyUp,true);globalThis.removeEventListener?.('blur',onBlur);
  panel.hidden=true;$('fb-banner').hidden=true;
  const result=m.phase==='end'?m.result:null;
  try{onExit({result,abandoned:!result,score:[...m.score],minute:matchMinute(m)});}catch(err){console.error('Calcetto: uscita',err);}
 };
 doc.addEventListener('keydown',onKey,true);doc.addEventListener('keyup',onKeyUp,true);globalThis.addEventListener?.('blur',onBlur);
 session={close,match:m};
 panel.hidden=false;$('fb-banner').hidden=true;$('fb-score').textContent='0 – 0';$('fb-clock').textContent="0'";
 try{doc.activeElement?.blur?.();}catch(_){}
 resize();drawFootballScene(c,m,view,field);hud();
 rafId=raf(frame);
 return true;
}
export function footballDebug(){return session?{match:session.match}:null;}
