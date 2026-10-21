/* GTA Melito — Q33: regole, IA e salvataggio della partita di calcetto 5 contro 5 (SOLO libreria).
 * Dal 21/10/2026, su richiesta del committente, la partita si gioca nell'overworld (football-match.mjs):
 * questo modulo non apre più nessuna scena a parte e non disegna nulla. Contiene la simulazione pura e
 * ripetibile (seme): due squadre da cinque con portiere, possesso, passaggi, tiri, contrasti, portieri,
 * gol solo tra i pali, pali, rimesse, cronometro accelerato e il bilancio nella campagna.
 * Le misure sono parametriche: FOOTBALL_RULES descrive un campo da 40×20 "metri"; scaleRules(k) le
 * riporta alla scala del mondo di gioco (il campo grande di Via delle Palme). Le coordinate locali sono
 * u lungo l'asse lungo (ROSSI attaccano verso +u) e v di traverso. Un calciatore può essere "esterno"
 * (m.external): è il protagonista, mosso dal gioco con i comandi normali; la simulazione legge la sua
 * posa (input.pose) e non lo sposta mai. Le squadre non cambiano mai il giocatore comandato
 * (lockActive): il protagonista comanda solo sé stesso. */
export const FOOTBALL_RULES=Object.freeze({
 length:40,width:20,goalWidth:3,goalDepth:1,areaRadius:6,centreRadius:3,
 realSeconds:120,      // durata reale della partita (tempo di gioco effettivo)
 displayMinutes:40,    // cronometro accelerato: 40' del calcio a 5 in 2 minuti (×20)
 playerRadius:.35,ballRadius:.12,control:.62,controlMaxSpeed:13,
 userSpeed:6,userDribble:5,aiSpeed:5.5,aiDribble:4.8,keeperSpeed:4.4,
 passMin:7,passMax:15,shotSpeed:19,
 friction:.55,rolling:1,                  // palla: attrito proporzionale + rotolamento (m/s²)
 kickoffFreeze:1.2,goalPause:2.6,restartFreeze:.9,restartMax:6,restartDistance:3,
 kickCooldown:.3,stealCooldown:.8,tackleRange:.85,
 keeperReach:.95,keeperDive:.55,keeperHold:.9,
 step:1/60
});
const R=FOOTBALL_RULES;
// Le voci che sono lunghezze o velocità: scaleRules le moltiplica per k (i tempi restano uguali).
const METRIC=['length','width','goalWidth','goalDepth','areaRadius','centreRadius','playerRadius','ballRadius','control','controlMaxSpeed',
 'userSpeed','userDribble','aiSpeed','aiDribble','keeperSpeed','passMin','passMax','shotSpeed','rolling','restartDistance','tackleRange','keeperReach','keeperDive'];
/* Regole alla scala k (1 = 40×20 metri), con eventuali voci fissate a mano (per esempio length, width
 * e goalWidth presi dal campo vero, o le velocità di camminata del gioco). */
export function scaleRules(k=1,overrides={}){
 const out={...R};
 for(const key of METRIC)out[key]=R[key]*k;
 return Object.freeze({...out,...overrides});
}
export const FOOTBALL_TEAMS=Object.freeze([
 Object.freeze({name:'ROSSI',shirt:'#d33b33',trim:'#f3eee2',shorts:'#f3eee2',socks:'#d33b33',keeper:'#e8c447',keeperTrim:'#2a2a2a'}),
 Object.freeze({name:'BLU',shirt:'#2d5fc4',trim:'#a9d6ff',shorts:'#1b2b55',socks:'#2d5fc4',keeper:'#4fb46a',keeperTrim:'#173a24'})
]);
export const FOOTBALL_KEYS='FRECCE/WASD muovi · E o SPAZIO tiro (tieni premuto = più forte) · X o SHIFT passaggio · esci dal campo per abbandonare';
const ROLES=['gk','fixo','alaA','alaB','pivot'];
// Posizioni base nel «verso d'attacco» della squadra, in frazioni della mezza lunghezza (u) e mezza larghezza (v).
const SPOTS={gk:{u:-.955,v:0},fixo:{u:-.55,v:0},alaA:{u:-.225,v:-.55},alaB:{u:-.225,v:.55},pivot:{u:.15,v:0}};
const KICKOFF={gk:{u:-.955,v:0},fixo:{u:-.5,v:0},alaA:{u:-.25,v:-.55},alaB:{u:-.25,v:.55},pivot:{u:-.18,v:0}};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export const teamDir=t=>t===0?1:-1;              // ROSSI attaccano verso +u, BLU verso -u
export const ownGoalX=(t,m)=>-(m?m.hl:R.length/2)*teamDir(t);
function segDist(px,py,ax,ay,bx,by){
 const dx=bx-ax,dy=by-ay,l=dx*dx+dy*dy;const t=l?clamp(((px-ax)*dx+(py-ay)*dy)/l,0,1):0;
 return Math.hypot(px-ax-t*dx,py-ay-t*dy);
}
// mulberry32: piccolo, veloce e uguale ovunque (partite ripetibili con lo stesso seme).
export function makeRng(seed){
 let a=(Number(seed)>>>0)||1;
 return ()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};
}
const isExt=(m,p)=>p.i===m.external;

// ---- partita ------------------------------------------------------------------------------------
/* rules: FOOTBALL_RULES o scaleRules(k,…). external: indice del calciatore mosso dal gioco (−1 = nessuno,
 * come nei test della simulazione pura). lockActive: il giocatore comandato non cambia mai. */
export function createMatch({seed=1,id=null,pitchName='',rules=R,external=-1,lockActive=false}={}){
 const players=[];
 for(const team of [0,1])ROLES.forEach((role,k)=>players.push({i:team*5+k,team,role,x:0,y:0,vx:0,vy:0,fx:teamDir(team),fy:0,
  anim:0,cooldown:0,tackle:0,protect:0,stun:0,hold:0,think:0,dive:0,kick:0,mustPass:false,look:((seed>>>0)+team*3+k*7)%20}));
 const m={rules,hl:rules.length/2,hw:rules.width/2,gh:rules.goalWidth/2,k:rules.length/40,
  id:id||('calcetto-'+((seed>>>0)||1).toString(36)),seed,rng:makeRng(seed),pitchName,external,lockActive:lockActive||external>=0,
  phase:'intro',timer:0,time:0,score:[0,0],players,active:external>=0?external:4,restart:null,events:[],result:null,lastGoalTeam:-1,
  ball:{x:0,y:0,vx:0,vy:0,owner:-1,lastTouch:0,lastKicker:-1,passTarget:-1,saveTried:false,shot:false,blockedBy:-1,inNet:false,spin:0},
  stats:{shots:[0,0],passes:[0,0],saves:[0,0],steals:[0,0]}};
 setKickoff(m,0,true);m.phase='intro';m.events.length=0;
 return m;
}
/* Dove ogni calciatore si mette per il calcio d'inizio (coordinate locali u,v): usato anche dal
 * mondo per far arrivare i giocatori a piedi nel posto giusto. team = chi batte. */
export function kickoffSpot(m,p,team=0){
 const s=KICKOFF[p.role],d=teamDir(p.team);let u=s.u*m.hl,v=s.v*m.hw;
 if(p.role==='pivot'&&p.team===team&&!isExt(m,p)){u=-.55*m.k;v=0;}
 return {x:u*d,y:v*d};
}
export function startMatch(m){
 if(m.phase!=='intro')return false;
 setKickoff(m,0,true);m.events.push({type:'whistle',kind:'start'});return true;
}
/* snap=true: tutti subito al loro posto (creazione, inizio partita, test). snap=false (dopo un gol): la
 * palla va al centro e i calciatori CAMMINANO fino al posto durante una pausa più lunga (niente teletrasporti). */
function setKickoff(m,team,snap=true){
 const R=m.rules;
 for(const p of m.players){
  const s=kickoffSpot(m,p,team),d=teamDir(p.team);
  if(snap&&!isExt(m,p))Object.assign(p,{x:s.x,y:s.y,vx:0,vy:0,fx:d,fy:0});
  Object.assign(p,{cooldown:0,tackle:0,protect:0,stun:0,hold:0,dive:0,kick:0,mustPass:false,goto:snap?null:s});
 }
 Object.assign(m.ball,{x:0,y:0,vx:0,vy:0,owner:-1,lastTouch:team,lastKicker:-1,passTarget:-1,saveTried:false,shot:false,blockedBy:-1,inNet:false});
 // batte il pivot; se il pivot dei ROSSI è il protagonista, batte il fixo (un compagno), che poi passa
 let taker=team*5+4;if(isExt(m,m.players[taker]))taker=team*5+1;
 m.restart={kind:'kickoff',team,taker};m.phase='kickoff';m.timer=R.kickoffFreeze*(snap?1:2.2);
 if(team===0&&!m.lockActive)m.active=taker;
 m.events.push({type:'kickoff',team});
}
/* Rimessa semplice: palla ferma sul punto, il compagno più vicino (il portiere per la rimessa dal
 * fondo) ci va a piedi e la batte; gli avversari stanno a restartDistance. kind: laterale|angolo|fondo.
 * Il protagonista non batte mai le rimesse (non si può spostarlo): lo fa un compagno. */
function setRestart(m,kind,team,x,y){
 const R=m.rules,b=m.ball,d=teamDir(team),k=m.k;
 Object.assign(b,{x,y,vx:0,vy:0,owner:-1,passTarget:-1,saveTried:false,shot:false,blockedBy:-1,inNet:false});
 let taker=team*5;
 if(kind!=='fondo'){let best=Infinity;for(const p of m.players)if(p.team===team&&p.role!=='gk'&&!isExt(m,p)){const dd=Math.hypot(p.x-x,p.y-y);if(dd<best){best=dd;taker=p.i;}}}
 const p=m.players[taker];
 // faces into the pitch: towards the attack for a goal clearance, towards the middle otherwise
 let fx=kind==='fondo'?d:(kind==='angolo'?-Math.sign(x)*.8:d*.45),fy=kind==='fondo'?0:-Math.sign(y)||0;
 const fl=Math.hypot(fx,fy)||1;fx/=fl;fy/=fl;
 Object.assign(p,{vx:0,vy:0,fx,fy,hold:0,stun:0,cooldown:0,mustPass:true,goto:{x:x-fx*.45*k,y:y-fy*.45*k}});
 for(const q of m.players){
  if(q.team===team||isExt(m,q))continue;const dx=q.x-x,dy=q.y-y,dd=Math.hypot(dx,dy);
  if(dd<R.restartDistance){const kk=dd>.01?R.restartDistance/dd:0;q.x=x+(dd>.01?dx*kk:-d*R.restartDistance);q.y=y+(dd>.01?dy*kk:0);}
 }
 m.restart={kind,team,taker,x,y};m.phase='restart';m.timer=R.restartFreeze;m.restartClock=0;
 if(team===0&&p.role!=='gk'&&!m.lockActive)m.active=taker;
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
 p.hold=0;p.protect=protect;p.think=.12+m.rng()*.18;p.goto=null;
 if(m.lockActive)return;
 if(p.team===0&&p.role!=='gk')m.active=i;
 else if(p.team===1&&from===0){
  // ball lost: the nearest of our players takes over (only if clearly nearer than the current one)
  const n=nearestOutfield(m,0,b.x,b.y),act=m.players[m.active];
  if(n>=0&&n!==m.active&&dist(act,b)>dist(m.players[n],b)+2*m.k){m.active=n;m.events.push({type:'switch',to:n,auto:true});}
 }
}
function kick(m,p,vx,vy,{target=-1,shot=false}={}){
 const R=m.rules,b=m.ball,l=Math.hypot(vx,vy)||1,k=m.k;
 b.owner=-1;
 // the ball leaves from the feet, never already beyond a line (the crossing check needs it inside)
 b.x=clamp(p.x+vx/l*.5*k,-m.hl+.01,m.hl-.01);b.y=clamp(p.y+vy/l*.5*k,-m.hw+.01,m.hw-.01);
 Object.assign(b,{vx,vy,lastTouch:p.team,lastKicker:p.i,passTarget:target,saveTried:false,shot,blockedBy:-1});
 p.cooldown=R.kickCooldown;p.kick=.22;p.hold=0;p.mustPass=false;p.fx=vx/l;p.fy=vy/l;
 m.stats[shot?'shots':'passes'][p.team]++;
 m.events.push({type:shot?'shot':'pass',team:p.team,by:p.i,target});
}
export const passSpeed=(d,rules=R)=>{const k=rules.length/40;return clamp((4.5+d/k*.72)*k,rules.passMin,rules.passMax);};
function passTo(m,p,j,{lead=true}={}){
 const q=m.players[j],d0=Math.hypot(q.x-p.x,q.y-p.y),t=d0/passSpeed(d0,m.rules)*.8;
 const tx=q.x+(lead?q.vx*t:0),ty=q.y+(lead?q.vy*t:0),dx=tx-p.x,dy=ty-p.y,l=Math.hypot(dx,dy)||1,s=passSpeed(l,m.rules);
 kick(m,p,dx/l*s,dy/l*s,{target:j});
}
function bestPassTarget(m,p){
 const d=teamDir(p.team),k=m.k;let best=-1,bs=-Infinity;
 for(const q of m.players){
  if(q.team!==p.team||q.i===p.i||q.role==='gk')continue;
  const dd=dist(p,q)/k;if(dd<2.5||dd>24)continue;
  let open=9,blocked=0;
  for(const o of m.players){if(o.team===p.team)continue;open=Math.min(open,dist(o,q)/k);if(segDist(o.x,o.y,p.x,p.y,q.x,q.y)<.9*k)blocked++;}
  const s=(q.x-p.x)/k*d*.25+Math.min(open,5)*.8-blocked*3-Math.abs(dd-9)*.12+(m.rng()-.5)*.6;
  if(s>bs){bs=s;best=q.i;}
 }
 return bs>-1.5?best:-1;
}
function aiShoot(m,p){
 const R=m.rules,k=m.k,d=teamDir(p.team),gx=m.hl*d,kp=m.players[(1-p.team)*5],dg=Math.hypot(gx-p.x,p.y)/k;
 const corner=kp.y>0?-1:1,err=(m.rng()-.5)*(.7+dg*.06)*k,ty=corner*(m.gh-.3*k)+err;
 const dx=gx-p.x,dy=ty-p.y,l=Math.hypot(dx,dy)||1,s=R.shotSpeed*(.88+.12*m.rng());
 kick(m,p,dx/l*s,dy/l*s,{shot:true});
}
/* Comandi del calciatore del giocatore. Tiro assistito: se guardi verso la porta (entro ±5 m dalla linea
 * dei pali) la palla va nello specchio; altrimenti parte dritta dove guardi e può finire fuori.
 * power 0…1: tiro tenuto premuto = più forte (da 55% a 100% della velocità massima). */
function userShoot(m,p,fx,fy,power=1){
 const R=m.rules,k=m.k,gx=m.hl;let aim=null;
 const speed=R.shotSpeed*(.55+.45*clamp(Number.isFinite(power)?power:1,0,1));
 if(fx>.15){const yHit=p.y+fy/fx*(gx-p.x);if(Math.abs(yHit)<=5*k)aim=clamp(yHit*.5,-(m.gh-.25*k),m.gh-.25*k)+(m.rng()-.5)*.4*k;}
 if(aim!==null){const dx=gx-p.x,dy=aim-p.y,l=Math.hypot(dx,dy)||1;kick(m,p,dx/l*speed,dy/l*speed,{shot:true});}
 else kick(m,p,fx*speed,fy*speed,{shot:true});
}
function userPass(m,p,fx,fy){
 const k=m.k;let best=-1,bs=-Infinity;
 for(const q of m.players){
  if(q.team!==0||q.i===p.i||q.role==='gk')continue;
  const dx=q.x-p.x,dy=q.y-p.y,dd=Math.hypot(dx,dy)||1,cos=(dx*fx+dy*fy)/dd;
  if(cos<.42||dd>26*k)continue;                   // within ±65° of where you look
  let blocked=0;for(const o of m.players)if(o.team===1&&segDist(o.x,o.y,p.x,p.y,q.x,q.y)<.8*k)blocked++;
  const s=cos*2-dd/k*.06-blocked;if(s>bs){bs=s;best=q.i;}
 }
 if(best>=0){passTo(m,p,best,{lead:false});if(!m.lockActive){m.active=best;m.events.push({type:'switch',to:best,auto:true});}}
 else kick(m,p,fx*10*k,fy*10*k);
}
function userTackle(m,p){
 const R=m.rules,k=m.k;
 if(p.tackle>0)return false;
 p.tackle=.5;const b=m.ball,o=b.owner>=0?m.players[b.owner]:null;
 if(o&&o.team===1&&o.role!=='gk'&&dist(p,b)<R.tackleRange+.45*k){
  if(m.rng()<.55){steal(m,p,o);return true;}
  p.stun=.25;return false;
 }
 if(!isExt(m,p)){p.vx+=p.fx*2.5*k;p.vy+=p.fy*2.5*k;}   // a short lunge
 return false;
}
function steal(m,q,o){
 giveBall(m,q.i);o.cooldown=m.rules.stealCooldown;o.stun=.4;m.stats.steals[q.team]++;
 m.events.push({type:'steal',team:q.team,by:q.i});
}
/* Cambio giocatore: il compagno di movimento più vicino alla palla (mai il portiere). Chi ha la palla
 * resta attivo. Con lockActive (partita nell'overworld) non cambia mai. */
export function switchPlayer(m){
 if(m.lockActive||m.ball.owner===m.active)return m.active;
 let best=-1,bd=Infinity;
 for(const p of m.players)if(p.team===0&&p.role!=='gk'&&p.i!==m.active){const dd=dist(p,m.ball);if(dd<bd){bd=dd;best=p.i;}}
 if(best>=0){m.active=best;m.events.push({type:'switch',to:best});}
 return m.active;
}

// ---- intelligenza artificiale (compagni, avversari, portieri) --------------------------------------
function teamHasBall(m,t){const o=m.ball.owner;return o>=0&&m.players[o].team===t;}
function formationSpot(m,p,attacking){
 const R=m.rules,k=m.k,d=teamDir(p.team),s=SPOTS[p.role],bu=m.ball.x*d,bv=m.ball.y*d;
 let u=s.u*m.hl+bu*(p.role==='fixo'?.45:.55)+(attacking?(p.role==='fixo'?3:5):-1)*k;
 let v=s.v*m.hw*(attacking?1.2:.8)+bv*(p.role==='pivot'?.45:.3);
 if(!attacking&&p.role!=='pivot')u=Math.min(u,bu-1.5*k);         // defenders stay goal-side of the ball
 return {x:clamp(u,-m.hl+2.5*k,m.hl-2*k)*d,y:clamp(v,-m.hw+k,m.hw-k)*d,speed:R.aiSpeed*(attacking?.85:.95)};
}
function interceptPoint(m,p){
 const b=m.ball,sp=Math.hypot(b.vx,b.vy);
 if(sp<.5*m.k)return {x:b.x,y:b.y};
 const ux=b.vx/sp,uy=b.vy/sp,ahead=Math.max(0,(p.x-b.x)*ux+(p.y-b.y)*uy);
 const reach=Math.min(ahead,sp*1.2);
 return {x:b.x+ux*reach,y:b.y+uy*reach};
}
function keeperTarget(m,p){
 const R=m.rules,k=m.k,gx=ownGoalX(p.team,m),d=teamDir(p.team),b=m.ball;
 let tx=gx+d*.8*k,ty=clamp(b.y*.28,-1.1*k,1.1*k),speed=R.keeperSpeed;p.diving=false;
 const toGoal=Math.hypot(b.x-gx,b.y),bs=Math.hypot(b.vx,b.vy);
 if(b.owner<0&&b.vx*d<-4*k){                                   // a shot coming: get across to its line
  const t=(gx-b.x)/b.vx;
  if(t>0&&t<1.6){ty=clamp(b.y+b.vy*t,-1.9*k,1.9*k);tx=gx+d*.6*k;speed=R.keeperSpeed*1.5;p.diving=true;}
 }else if(b.owner<0&&toGoal<R.areaRadius&&bs<6*k){              // a loose ball in the area: rush out
  const rival=nearestOutfield(m,1-p.team,b.x,b.y),mine=Math.hypot(p.x-b.x,p.y-b.y);
  if(rival<0||dist(m.players[rival],b)>mine*.7){tx=b.x;ty=b.y;speed=R.keeperSpeed*1.2;}
 }else if(teamHasBall(m,1-p.team)&&toGoal<9*k){                 // narrow the angle
  tx=gx+(b.x-gx)*.2;ty=clamp(b.y*.3,-1.4*k,1.4*k);
 }
 return {x:tx,y:ty,speed};
}
function aiOwner(m,p,dt){
 const R=m.rules,k=m.k;
 p.hold+=dt;p.think-=dt;
 const d=teamDir(p.team),gx=m.hl*d;
 if(p.role==='gk'){
  if(p.hold>=R.keeperHold){const j=bestPassTarget(m,p);if(j>=0)passTo(m,p,j);else kick(m,p,d*13*k,(p.y>0?-4:4)*k);return null;}
  return {x:p.x,y:p.y,speed:0};
 }
 if(p.think<=0){
  p.think=.2+m.rng()*.2;
  const dg=Math.hypot(gx-p.x,p.y)/k,ay=Math.abs(p.y)/k;
  let pressure=Infinity;for(const o of m.players)if(o.team!==p.team)pressure=Math.min(pressure,dist(o,p)/k);
  if(p.mustPass){p.mustPass=false;const j=bestPassTarget(m,p);if(j>=0){passTo(m,p,j);return null;}}
  if(dg<8||(dg<13&&ay<6&&m.rng()<.55)||(dg<16&&ay<3&&m.rng()<.2)){aiShoot(m,p);return null;}
  if((pressure<1.8&&m.rng()<.55)||p.hold>2.8){const j=bestPassTarget(m,p);if(j>=0){passTo(m,p,j);return null;}}
 }
 // dribble towards the goal, sidestepping the nearest opponent
 let ux=gx-p.x,uy=-p.y*.5;const ul=Math.hypot(ux,uy)||1;ux/=ul;uy/=ul;
 let near=null,nd=Infinity;for(const o of m.players)if(o.team!==p.team){const dd=dist(o,p)/k;if(dd<nd){nd=dd;near=o;}}
 if(near&&nd<3.5){const side=(p.y-near.y)>=0?1:-1,kk=(3.5-nd)/3.5*1.3;uy+=side*kk;}
 const vl=Math.hypot(ux,uy)||1;
 return {x:p.x+ux/vl*3*k,y:clamp(p.y+uy/vl*3*k,-m.hw+k,m.hw-k),speed:R.aiDribble};
}
function aiTarget(m,p){
 const R=m.rules,k=m.k,b=m.ball;
 if(p.role==='gk')return keeperTarget(m,p);
 if(b.owner<0&&b.passTarget===p.i){const q=interceptPoint(m,p);return {...q,speed:R.aiSpeed*1.05};}
 const mine=teamHasBall(m,p.team);
 if(!mine){
  const gx=ownGoalX(p.team,m),theirs=b.owner>=0;
  const chaser=nearestOutfield(m,p.team,b.x,b.y,p.team===0?m.active:-1);
  const cover=kk=>{const l=Math.hypot(gx-b.x,-b.y)||1;return {x:b.x+(gx-b.x)/l*kk*k,y:b.y-b.y/l*kk*k,speed:R.aiSpeed*.9};};
  if(!theirs){
   // a loose ball: the nearest goes for it; our AI team-mate only when clearly nearer than the player you control
   if(chaser===p.i&&(p.team===1||dist(p,b)+3*k<dist(m.players[m.active],b))){const q=interceptPoint(m,p);return {...q,speed:R.aiSpeed};}
  }else if(p.team===1){
   // press the ball itself (a little goal-side and ahead of where the dribbler is going)
   if(chaser===p.i){const o=m.players[b.owner],tx=b.x+o.vx*.25,ty=b.y+o.vy*.25,l=Math.hypot(gx-tx,-ty)||1;return {x:tx+(gx-tx)/l*.3*k,y:ty-ty/l*.3*k,speed:R.aiSpeed};}
   if(nearestOutfield(m,1,b.x,b.y,chaser)===p.i)return cover(3.2);
  }else if(chaser===p.i)return cover(3);              // you press the ball, the nearest team-mate covers
 }
 const attacking=mine||(b.owner<0&&b.lastTouch===p.team);
 const spot=formationSpot(m,p,attacking);
 if(attacking&&mine){                                           // offer a line of pass: drift off markers
  let o=null,od=Infinity;for(const q of m.players)if(q.team!==p.team){const dd=Math.hypot(q.x-spot.x,q.y-spot.y);if(dd<od){od=dd;o=q;}}
  if(o&&od<2.2*k)spot.y=clamp(spot.y+(spot.y>=o.y?1.6*k:-1.6*k),-m.hw+k,m.hw-k);
 }
 return spot;
}

// ---- passo della simulazione ----------------------------------------------------------------------
function userTarget(m,p,ix,iy,il){
 const R=m.rules,k=m.k,speed=m.ball.owner===p.i?R.userDribble:R.userSpeed;
 if(il>.2)return {x:p.x+ix*3*k,y:p.y+iy*3*k,speed:speed*Math.min(1,il)};
 // receiving a pass with the stick at rest: step towards the ball
 if(m.ball.owner<0&&m.ball.passTarget===p.i){const q=interceptPoint(m,p);return {...q,speed:R.userSpeed*.8};}
 return null;
}
function readInput(m,input){
 let ix=Number(input.x)||0,iy=Number(input.y)||0;const il=Math.hypot(ix,iy);if(il>1){ix/=il;iy/=il;}
 return {ix,iy,il};
}
function moveToward(m,p,t,dt,acc){
 let dvx=0,dvy=0;
 if(t){const dx=t.x-p.x,dy=t.y-p.y,dd=Math.hypot(dx,dy);if(dd>.12*m.k){const s=Math.min(t.speed,dd*4);dvx=dx/dd*s;dvy=dy/dd*s;}}
 if(p.stun>0){dvx=0;dvy=0;}
 const k=Math.min(1,dt*acc);p.vx+=(dvx-p.vx)*k;p.vy+=(dvy-p.vy)*k;
}
/* Il protagonista: posa letta dal gioco (coordinate locali), mai spostato dalla simulazione. */
function applyPose(m,input){
 if(m.external<0||!input.pose)return;
 const p=m.players[m.external],q=input.pose;
 if(Number.isFinite(q.x)&&Number.isFinite(q.y)){p.x=q.x;p.y=q.y;}
 p.vx=Number(q.vx)||0;p.vy=Number(q.vy)||0;
 const fl=Math.hypot(Number(q.fx)||0,Number(q.fy)||0);if(fl>.1){p.fx=q.fx/fl;p.fy=q.fy/fl;}
 p.anim+=Math.hypot(p.vx,p.vy)*m.rules.step*2.4/m.k;
}
function integrate(m,dt){
 const R=m.rules,k=m.k,b=m.ball;
 for(const p of m.players){
  if(isExt(m,p))continue;
  p.x+=p.vx*dt;p.y+=p.vy*dt;
  const sp=Math.hypot(p.vx,p.vy);
  if(sp>.3*k&&p.i!==m.active){p.fx=p.vx/sp;p.fy=p.vy/sp;}
  p.anim+=sp*dt*2.4/k;
  if(p.role==='gk'){
   const gx=ownGoalX(p.team,m),d=teamDir(p.team);
   p.x=clamp(p.x,Math.min(gx,gx+d*6.5*k),Math.max(gx,gx+d*6.5*k));if(p.x*d<-m.hl+.2*k)p.x=(-m.hl+.2*k)*d;p.y=clamp(p.y,-6.5*k,6.5*k);
  }else if(b.owner===p.i){p.x=clamp(p.x,-m.hl+.5*k,m.hl-.5*k);p.y=clamp(p.y,-m.hw+.5*k,m.hw-.5*k);}
  else{p.x=clamp(p.x,-m.hl-.6*k,m.hl+.6*k);p.y=clamp(p.y,-m.hw-.6*k,m.hw+.6*k);}
 }
 // players do not overlap (the protagonist is never pushed: the others step aside)
 const P=m.players,min=R.playerRadius*2;
 for(let i=0;i<P.length;i++)for(let j=i+1;j<P.length;j++){
  const a=P[i],c=P[j],dx=c.x-a.x,dy=c.y-a.y,dd=Math.hypot(dx,dy);
  if(dd<min&&dd>1e-6){
   const ea=isExt(m,a),ec=isExt(m,c),push=(min-dd)/(ea||ec?1:2);
   if(!ea){a.x-=dx/dd*push;a.y-=dy/dd*push;}
   if(!ec){c.x+=dx/dd*push;c.y+=dy/dd*push;}
  }
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
// the team that scores in the goal at that end: the right goal (+u) is defended by BLU
export const scorerAt=side=>side>0?0:1;
function handleCrossing(m,c){
 const R=m.rules,k=m.k,b=m.ball;
 if(c.type==='goal'){
  const team=scorerAt(c.side);m.score[team]++;m.lastGoalTeam=team;
  b.x=c.side*(m.hl+.25*k);b.y=clamp(c.y,-m.gh+.2*k,m.gh-.2*k);b.vx*=.2;b.vy*=.2;b.inNet=true;b.owner=-1;
  m.phase='goal';m.timer=R.goalPause;
  for(const p of m.players)p.goto=null;
  m.events.push({type:'goal',team,by:b.lastKicker,own:b.lastKicker>=0&&m.players[b.lastKicker].team!==team,score:[...m.score]});
  return;
 }
 if(c.type==='post'){
  b.x=c.side*(m.hl-.02*k);b.vx=-b.vx*.45;b.vy=b.vy*.6+(c.y>0?1:-1)*1.6*k;
  m.events.push({type:'post',side:c.side});return;
 }
 if(c.type==='end'){
  const defending=c.side>0?1:0;
  if(b.lastTouch===defending)setRestart(m,'angolo',1-defending,c.side*(m.hl-.3*k),Math.sign(c.y)*(m.hw-.3*k));
  else setRestart(m,'fondo',defending,c.side*(m.hl-1.4*k),0);
  m.events.push({type:'out',kind:m.restart.kind,team:m.restart.team});return;
 }
 setRestart(m,'laterale',1-b.lastTouch,clamp(c.x,-m.hl+.5*k,m.hl-.5*k),c.side*(m.hw-.12*k));
 m.events.push({type:'out',kind:'laterale',team:m.restart.team});
}
function keeperSaves(m,px,py){
 const R=m.rules,k=m.k,b=m.ball;
 for(const t of [0,1]){
  if(b.owner>=0)return;
  const kp=m.players[t*5],sp=Math.hypot(b.vx,b.vy),towards=b.vx*teamDir(t)<0;
  const reach=R.keeperReach+(kp.diving?R.keeperDive:0),dd=segDist(kp.x,kp.y,px,py,b.x,b.y);
  if(dd>reach||kp.stun>0)continue;
  if(sp<9*k){if(b.lastKicker!==kp.i||kp.cooldown<=0){giveBall(m,kp.i,{protect:9});kp.hold=0;}continue;}
  if(!towards||b.saveTried)continue;
  b.saveTried=true;kp.dive=.5;
  const chance=clamp(.98-(sp/k-9)*.035-dd/k*.28,.2,.92);
  if(m.rng()<chance){
   m.stats.saves[t]++;m.events.push({type:'save',team:t,by:kp.i});
   if(sp<15*k){giveBall(m,kp.i,{protect:9});kp.hold=0;}
   else{b.vx=-b.vx*.4;b.vy=b.vy*.3+(m.rng()<.5?-1:1)*(3+m.rng()*2)*k;b.lastTouch=t;b.shot=false;b.x=kp.x+Math.sign(b.vx)*.4*k;}
  }
 }
}
function stepBall(m,dt){
 const R=m.rules,k=m.k,b=m.ball;
 if(b.owner>=0){
  const p=m.players[b.owner],hold=p.role==='gk',px=b.x,py=b.y;
  b.x=p.x+(hold?p.fx*.15:p.fx*.45)*k;b.y=p.y+(hold?p.fy*.15:p.fy*.45)*k+.04*k;b.vx=p.vx;b.vy=p.vy;
  b.spin+=Math.hypot(p.vx,p.vy)*dt*3/k;
  // il protagonista può uscire dalle linee con la palla al piede: è fuori, rimessa agli altri
  if(isExt(m,p)&&(Math.abs(b.x)>m.hl||Math.abs(b.y)>m.hw)){
   const c=classifyBallCrossing(clamp(px,-m.hl+.01,m.hl-.01),clamp(py,-m.hw+.01,m.hw-.01),b.x,b.y,R);
   if(c){b.owner=-1;b.lastTouch=p.team;b.lastKicker=p.i;p.cooldown=R.kickCooldown;handleCrossing(m,c);}
  }
  return;
 }
 const px=b.x,py=b.y,sp=Math.hypot(b.vx,b.vy);
 if(sp>0){const ns=Math.max(0,sp*Math.exp(-R.friction*dt)-R.rolling*dt),kk=ns/sp;b.vx*=kk;b.vy*=kk;}
 b.x+=b.vx*dt;b.y+=b.vy*dt;b.spin+=sp*dt*3/k;
 const c=classifyBallCrossing(px,py,b.x,b.y,R);
 if(c){handleCrossing(m,c);return;}
 keeperSaves(m,px,py);
 if(b.owner>=0)return;
 const fast=Math.hypot(b.vx,b.vy)>R.controlMaxSpeed;
 let best=-1,bd=Infinity;
 for(const q of m.players){
  if(q.role==='gk')continue;
  if(fast){
   // a hard shot or pass is not controlled, but a body in its way deflects it
   if(q.team!==b.lastTouch&&q.i!==b.blockedBy&&segDist(q.x,q.y,px,py,b.x,b.y)<R.playerRadius+R.ballRadius+.05*k){
    b.vx=b.vx*-.25+(m.rng()-.5)*3*k;b.vy=b.vy*.4+(m.rng()-.5)*5*k;b.lastTouch=q.team;b.blockedBy=q.i;b.shot=false;b.passTarget=-1;
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
 const R=m.rules,k=m.k,b=m.ball;if(b.owner<0)return;
 const o=m.players[b.owner];if(o.role==='gk'||o.protect>0)return;
 for(const q of m.players){
  if(q.team===o.team||q.role==='gk'||q.tackle>0||q.cooldown>0||q.stun>0||isExt(m,q))continue;
  if(dist(q,b)>R.tackleRange&&dist(q,o)>R.tackleRange+.2*k)continue;
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
 m.phase='end';m.time=m.rules.realSeconds;
 const b=m.ball;b.vx=0;b.vy=0;
 for(const p of m.players){p.vx=0;p.vy=0;p.goto=null;}
 m.result=matchResult(m);
 m.events.push({type:'whistle',kind:'end'},{type:'end',result:m.result});
}
export function matchResult(m){
 const [h,a]=m.score;
 return {id:m.id,home:h,away:a,outcome:h>a?'vittoria':h===a?'pareggio':'sconfitta',pitch:m.pitchName||''};
}
// Nelle pause (gol, calcio d'inizio, rimessa) i calciatori camminano verso il loro posto (p.goto).
function walkToSpots(m,dt,{speed}={}){
 for(const p of m.players){
  if(isExt(m,p))continue;
  moveToward(m,p,p.goto?{...p.goto,speed:speed||m.rules.aiSpeed*.8}:null,dt,8);
 }
 integrate(m,dt);
}
/* Un passo di gioco. input: {x,y} direzione (−1…1) del calciatore attivo, shoot/pass/switch = tasto
 * appena premuto, power (0…1) per il tiro, pose = posa del protagonista (coordinate locali) se esterno. */
export function stepMatch(m,input={},dt=m.rules.step){
 const R=m.rules,k=m.k;
 if(m.phase==='intro'||m.phase==='end'){applyPose(m,input);return m;}
 tickTimers(m,dt);applyPose(m,input);
 if(m.phase==='kickoff'){
  m.timer-=dt;walkToSpots(m,dt);
  if(m.timer<=0){
   const t=m.restart.taker;m.restart=null;m.phase='play';
   for(const p of m.players)p.goto=null;
   giveBall(m,t);if(!isExt(m,m.players[t]))m.players[t].mustPass=true;
  }
  return m;
 }
 if(m.phase==='goal'){
  const b=m.ball;b.x+=b.vx*dt;b.y+=b.vy*dt;b.vx*=.9;b.vy*=.9;
  b.x=Math.sign(b.x)*clamp(Math.abs(b.x),m.hl+.15*k,m.hl+R.goalDepth-.15*k);b.y=clamp(b.y,-m.gh+.2*k,m.gh-.2*k);
  for(const p of m.players){if(isExt(m,p))continue;p.vx*=.85;p.vy*=.85;p.anim+=dt*(p.team===m.lastGoalTeam?6:0);}
  m.timer-=dt;if(m.timer<=0)setKickoff(m,1-m.lastGoalTeam,false);
  return m;
 }
 m.time+=dt;
 const {ix,iy,il}=readInput(m,input);
 if(m.phase==='restart'){
  const taker=m.restart.taker,rb={x:m.restart.x,y:m.restart.y},tk=m.players[taker];
  for(const p of m.players){
   if(isExt(m,p))continue;
   if(p.i===taker){moveToward(m,p,p.goto?{...p.goto,speed:R.aiSpeed}:null,dt,8);continue;}
   moveToward(m,p,p.i===m.active?userTarget(m,p,ix,iy,il):aiTarget(m,p),dt,p.i===m.active?14:8);
  }
  integrate(m,dt);
  for(const q of m.players){if(q.team===m.restart.team||isExt(m,q))continue;const dd=dist(q,rb);if(dd<R.restartDistance&&dd>.01){q.x=rb.x+(q.x-rb.x)*R.restartDistance/dd;q.y=rb.y+(q.y-rb.y)*R.restartDistance/dd;}}
  m.timer-=dt;m.restartClock=(m.restartClock||0)+dt;
  const there=dist(tk,rb)<1.2*k||m.restartClock>R.restartMax;
  if(m.timer<=0&&there){m.phase='play';m.restart=null;tk.goto=null;if(dist(tk,rb)>=1.2*k){tk.x=rb.x-tk.fx*.45*k;tk.y=rb.y-tk.fy*.45*k;}giveBall(m,taker,{protect:taker%5===0?9:.6});}
  if(m.time>=R.realSeconds)endMatch(m);
  return m;
 }
 // ---- play
 if(input.switch)switchPlayer(m);
 const me=m.players[m.active];
 if(il>.2&&!isExt(m,me)){me.fx=ix/il;me.fy=iy/il;}
 const owns=m.ball.owner===me.i;
 if(me.stun<=0){
  if(owns&&input.shoot)userShoot(m,me,me.fx,me.fy,input.power);
  else if(owns&&input.pass)userPass(m,me,me.fx,me.fy);
  else if(!owns&&(input.shoot||input.pass))userTackle(m,me);
 }
 for(const p of m.players){
  if(isExt(m,p))continue;
  if(p.i===m.active){moveToward(m,p,userTarget(m,p,ix,iy,il),dt,14);continue;}
  moveToward(m,p,m.ball.owner===p.i?aiOwner(m,p,dt):aiTarget(m,p),dt,8);
 }
 integrate(m,dt);
 stepBall(m,dt);
 if(m.phase==='play')steals(m);
 if(m.time>=R.realSeconds&&(m.phase==='play'||m.phase==='restart'))endMatch(m);
 return m;
}
export function matchMinute(m){const R=m.rules;return Math.min(R.displayMinutes,Math.floor(Math.min(m.time,R.realSeconds)/R.realSeconds*R.displayMinutes));}
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
