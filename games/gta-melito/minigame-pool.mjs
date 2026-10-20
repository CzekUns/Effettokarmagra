/* Q30 — Biliardo arcade «BILIARDO DEL RIONE»: minigioco a sé, tavolo pixel art visto dall'alto.
 * NIENTE DENARO E NIENTE SCOMMESSE: non ci sono crediti né poste in gioco. Si salvano solo i risultati
 * delle partite finite (vinte, perse, pari, record del tiro libero), una volta sola per partita.
 * REGOLE SEMPLIFICATE, dichiarate a schermo («A CHI NE IMBUCA DI PIÙ»):
 *  - 9 biglie colorate a rombo; ogni biglia imbucata vale 1 punto per chi tira;
 *  - se imbuchi almeno una biglia ritiri, altrimenti il turno passa all'altro;
 *  - bianca in buca: −1 punto (mai sotto zero), la bianca torna sul punto di partenza e il turno passa;
 *  - a tavolo vuoto vince chi ha più punti (il pari è possibile dopo le penalità).
 * Modalità CONTRO CPU (IA semplice: sceglie la biglia più facile verso una buca libera, con un piccolo
 * errore di mira) oppure TIRO LIBERO (da soli: si contano i tiri per svuotare il tavolo).
 * Fisica 2D leggera a passo fisso (1/240 s): attrito, urti elastici fra biglie uguali, sponde, buche.
 * Aggancio per i tavoli dei bar grandi della Q27: openPoolMachine({onExit}). Grafica provvisoria, da approvare. */
import {makeRng} from './minigame-slot.mjs?v=001';
export const POOL_SAVE_KEY='gta-melito-biliardo-v1';
export const POOL_W=224,POOL_H=136;
// Piano di gioco (panno) in pixel logici: 200×100, cioè 2:1 come un tavolo vero.
export const TABLE=Object.freeze({x0:12,y0:24,x1:212,y1:124});
const {x0,y0,x1,y1}=TABLE,XM=(x0+x1)/2,YM=(y0+y1)/2;
export const POOL_RULES=Object.freeze({ballRadius:3.5,step:1/240,maxSpeed:450,minSpeed:14,friction:70,drag:.3,
 ballRestitution:.95,cushionRestitution:.78,stopSpeed:2.5,maxShotSeconds:25,lipSpeed:30,
 chargeSeconds:1.1,cpuThinkSeconds:1.3,aiAimError:.03,balls:9});
const R=POOL_RULES.ballRadius;
// 6 buche: 4 d'angolo e 2 a metà delle sponde lunghe.
export const POCKETS=Object.freeze([[x0-1,y0-1,7],[XM,y0-2,5.5],[x1+1,y0-1,7],[x0-1,y1+1,7],[XM,y1+2,5.5],[x1+1,y1+1,7]]
 .map(([x,y,r])=>Object.freeze({x,y,r,side:x===XM})));
export const HEAD_SPOT=Object.freeze({x:x0+50,y:YM}),FOOT_SPOT=Object.freeze({x:x0+150,y:YM});
// Rombo 1-2-3-2-1 con la 1 in punta e la 9 (rigata) al centro.
export const RACK_ROWS=Object.freeze([[1],[2,3],[4,9,5],[6,7],[8]]);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const tiri=n=>n+(n===1?' TIRO':' TIRI');
const other=t=>t==='player'?'cpu':'player';

/* ---------- Tavolo e partita ---------- */
export function rackBalls(){
 const balls=[{id:0,x:HEAD_SPOT.x,y:HEAD_SPOT.y,vx:0,vy:0,pocketed:false}],dy=2*R+.15,dx=dy*Math.sqrt(3)/2;
 RACK_ROWS.forEach((row,i)=>row.forEach((id,j)=>balls.push({id,x:FOOT_SPOT.x+i*dx,y:FOOT_SPOT.y+(j-(row.length-1)/2)*dy,vx:0,vy:0,pocketed:false})));
 return balls.sort((a,b)=>a.id-b.id);
}
export function newPoolGame({mode='cpu',seed=1}={}){
 const m=mode==='libero'?'libero':'cpu',s=(Number(seed)>>>0)||1;
 return {version:1,id:s.toString(36)+'-'+m,mode:m,seed:s,balls:rackBalls(),turn:'player',scores:{player:0,cpu:0},
  potted:{player:[],cpu:[]},shots:0,shotsBy:{player:0,cpu:0},phase:'aim',aim:0,shot:null,acc:0,shotTime:0,winner:null,recorded:false,last:null,
  message:m==='libero'?'TIRO LIBERO · SVUOTA IL TAVOLO':'SPACCA TU · MIRA E TIRA'};
}
export const ballsLeft=game=>game.balls.filter(b=>b.id>0&&!b.pocketed).length;
export const cueBall=game=>game.balls[0];
export const isSettled=game=>game.balls.every(b=>b.pocketed||(b.vx===0&&b.vy===0));

/* ---------- Fisica ---------- */
// Urto fra due biglie uguali: si scambiano la componente lungo la congiungente (restituzione e<1).
// La quantità di moto si conserva esattamente, l'energia cala di poco. Restituisce true se si toccano.
export function collideBalls(a,b,e=POOL_RULES.ballRestitution){
 const dx=b.x-a.x,dy=b.y-a.y,d2=dx*dx+dy*dy,min=2*R;
 if(d2>=min*min)return false;
 const d=Math.sqrt(d2),nx=d>1e-6?dx/d:1,ny=d>1e-6?dy/d:0,push=(min-d)/2;
 a.x-=nx*push;a.y-=ny*push;b.x+=nx*push;b.y+=ny*push;
 const rel=(a.vx-b.vx)*nx+(a.vy-b.vy)*ny;
 if(rel>0){const j=rel*(1+e)/2;a.vx-=j*nx;a.vy-=j*ny;b.vx+=j*nx;b.vy+=j*ny;}
 return true;
}
function pocketBall(game,b,k){
 const p=POCKETS[k];b.pocketed=true;b.vx=0;b.vy=0;b.x=p.x;b.y=p.y;b.pocket=k;
 game.shot?.pocketed.push(b.id);
}
// Sponde e buche. Davanti a ogni buca c'è una «bocca» (raggio della buca + raggio della biglia) dove la
// sponda non respinge: una biglia che oltrepassa lì la linea della sponda cade, se è lenta o se va oltre.
export function railAndPocket(game,b){
 let near=-1,nd=Infinity;
 for(let k=0;k<POCKETS.length;k++){
  const p=POCKETS[k],d2=(b.x-p.x)**2+(b.y-p.y)**2;
  if(d2<p.r*p.r){pocketBall(game,b,k);return 'buca';}
  if(d2<(p.r+R)**2&&d2<nd){near=k;nd=d2;}
 }
 const out=b.x<x0+R||b.x>x1-R||b.y<y0+R||b.y>y1-R;
 if(near>=0){
  if(out&&(Math.hypot(b.vx,b.vy)<POOL_RULES.lipSpeed||b.x<x0-R||b.x>x1+R||b.y<y0-R||b.y>y1+R)){pocketBall(game,b,near);return 'buca';}
  return out?'bocca':null;
 }
 const E=POOL_RULES.cushionRestitution;let hit=null;
 if(b.x<x0+R){b.x=x0+R;if(b.vx<0){b.vx=-b.vx*E;hit='sponda';}}
 else if(b.x>x1-R){b.x=x1-R;if(b.vx>0){b.vx=-b.vx*E;hit='sponda';}}
 if(b.y<y0+R){b.y=y0+R;if(b.vy<0){b.vy=-b.vy*E;hit='sponda';}}
 else if(b.y>y1-R){b.y=y1-R;if(b.vy>0){b.vy=-b.vy*E;hit='sponda';}}
 return hit;
}
function physicsStep(game,h){
 const balls=game.balls,n=balls.length,{friction,drag,stopSpeed}=POOL_RULES,min=2*R;
 for(const b of balls)if(!b.pocketed&&(b.vx||b.vy)){b.x+=b.vx*h;b.y+=b.vy*h;}
 for(let i=0;i<n;i++){
  const a=balls[i];if(a.pocketed)continue;
  for(let j=i+1;j<n;j++){
   const b=balls[j];if(b.pocketed||Math.abs(b.x-a.x)>=min||Math.abs(b.y-a.y)>=min)continue;
   if(collideBalls(a,b)&&game.shot&&game.shot.firstHit==null&&(a.id===0||b.id===0))game.shot.firstHit=a.id===0?b.id:a.id;
  }
 }
 for(const b of balls)if(!b.pocketed)railAndPocket(game,b);
 for(const b of balls){
  if(b.pocketed||!(b.vx||b.vy))continue;
  const sp=Math.hypot(b.vx,b.vy),ns=sp-(friction+drag*sp)*h;
  if(ns<stopSpeed){b.vx=0;b.vy=0;}else{const k=ns/sp;b.vx*=k;b.vy*=k;}
 }
}
/* Fa avanzare la fisica di dt secondi a passo fisso. A biglie ferme chiude il tiro e restituisce l'esito. */
export function stepPool(game,dt){
 if(game.phase!=='rolling')return null;
 const h=POOL_RULES.step;game.acc+=clamp(Number(dt)||0,0,.1);
 while(game.acc>=h){
  game.acc-=h;physicsStep(game,h);game.shotTime+=h;
  if(isSettled(game)||game.shotTime>=POOL_RULES.maxShotSeconds){game.acc=0;for(const b of game.balls){b.vx=0;b.vy=0;}return endShot(game);}
 }
 return null;
}
// Simula fino a biglie ferme (prove e IA); la durata massima del tiro garantisce la fine.
export function runUntilRest(game,dt=1/60){
 let out=null;for(let i=0;i<20000&&game.phase==='rolling';i++)out=stepPool(game,dt)||out;
 return out;
}

/* ---------- Tiro, turni e punteggio ---------- */
export const canShoot=game=>game.phase==='aim';
export function shoot(game,angle,power){
 if(game.phase!=='aim'||!Number.isFinite(angle))return false;
 const cue=cueBall(game);if(cue.pocketed)respotCue(game);
 const speed=Math.max(POOL_RULES.minSpeed,clamp(Number(power)||0,0,1)*POOL_RULES.maxSpeed);
 cue.vx=Math.cos(angle)*speed;cue.vy=Math.sin(angle)*speed;
 game.aim=angle;game.phase='rolling';game.shot={shooter:game.turn,pocketed:[],firstHit:null,power};game.acc=0;game.shotTime=0;
 game.shots+=1;game.shotsBy[game.turn]+=1;
 return true;
}
// La bianca torna sul punto di partenza, o sul primo posto libero lì vicino.
export function respotCue(game){
 const cue=cueBall(game),free=(x,y)=>game.balls.every(b=>b===cue||b.pocketed||(b.x-x)**2+(b.y-y)**2>(2*R+.5)**2);
 cue.pocketed=false;cue.vx=0;cue.vy=0;delete cue.pocket;
 for(let r=0;r<60;r++)for(const [dx,dy] of [[-r,0],[0,-r],[0,r],[r,0],[-r,-r],[-r,r]]){
  const x=clamp(HEAD_SPOT.x+dx,x0+R+1,x1-R-1),y=clamp(HEAD_SPOT.y+dy,y0+R+1,y1-R-1);
  if(free(x,y)){cue.x=x;cue.y=y;return cue;}
 }
 cue.x=HEAD_SPOT.x;cue.y=HEAD_SPOT.y;return cue;
}
function aimAtNearest(game){
 const cue=cueBall(game);let best=null,bd=Infinity;
 for(const b of game.balls)if(b.id>0&&!b.pocketed){const d=(b.x-cue.x)**2+(b.y-cue.y)**2;if(d<bd){bd=d;best=b;}}
 return best?Math.atan2(best.y-cue.y,best.x-cue.x):game.aim;
}
/* Fine tiro: applica le regole semplificate e decide il turno. */
export function endShot(game){
 const shooter=game.shot?.shooter||game.turn,ids=game.shot?.pocketed||[],potted=ids.filter(id=>id>0),foul=ids.includes(0);
 game.scores[shooter]+=potted.length;game.potted[shooter].push(...potted);
 if(foul){respotCue(game);if(game.mode==='libero')game.shots+=1;else game.scores[shooter]=Math.max(0,game.scores[shooter]-1);}
 const left=ballsLeft(game),again=game.mode==='libero'||(potted.length>0&&!foul);
 game.phase=left?'aim':'over';
 if(left&&!again)game.turn=other(shooter);
 if(!left){const p=game.scores.player,c=game.scores.cpu;game.winner=game.mode==='libero'?'player':p>c?'player':p<c?'cpu':'pari';}
 const outcome={shooter,potted,foul,again:!!left&&again,over:!left,turn:game.turn,winner:game.winner,firstHit:game.shot?.firstHit??null,
  scores:{...game.scores},shots:game.shots,left};
 game.shot=null;game.last=outcome;game.message=shotMessage(outcome,game);
 if(left)game.aim=aimAtNearest(game);
 return outcome;
}
export function shotMessage(o,game){
 if(!o)return '';
 const n=o.potted.length,p=o.scores.player,c=o.scores.cpu;
 if(game.mode==='libero'){
  if(o.over)return 'TAVOLO PULITO IN '+tiri(o.shots)+'!';
  if(o.foul)return 'BIANCA IN BUCA · +1 TIRO DI PENALITÀ';
  return (n?(n>1?'IMBUCATE '+n+'!':'IMBUCATA!')+' ':'')+'RESTANO '+o.left+' · TIRI '+o.shots;
 }
 if(o.over)return o.winner==='player'?'HAI VINTO '+p+' A '+c+'!':o.winner==='cpu'?'VINCE LA CPU '+c+' A '+p:'PAREGGIO '+p+' A '+c;
 const me=o.shooter==='player';
 if(o.foul)return (me?'BIANCA IN BUCA: −1':'LA CPU IMBUCA LA BIANCA: −1')+' · TOCCA '+(me?'ALLA CPU':'A TE');
 if(n)return (me?(n>1?'IMBUCATE '+n+'! +'+n:'IMBUCATA! +1')+' · RITIRI':'LA CPU IMBUCA +'+n+' E RITIRA');
 return me?'NIENTE IN BUCA · TOCCA ALLA CPU':'LA CPU NON IMBUCA · TOCCA A TE';
}

/* ---------- Mira: linea guida e IA ---------- */
// Prima cosa colpita dalla bianca lungo la direzione di mira: una biglia (con la sua direzione) o la sponda.
export function aimGuide(game,angle){
 const cue=cueBall(game),dx=Math.cos(angle),dy=Math.sin(angle);let best=Infinity,hit=null;
 for(const b of game.balls){
  if(b.id===0||b.pocketed)continue;
  const fx=cue.x-b.x,fy=cue.y-b.y,bq=fx*dx+fy*dy,cq=fx*fx+fy*fy-4*R*R,disc=bq*bq-cq;
  if(cq<0||disc<0)continue;const t=-bq-Math.sqrt(disc);if(t>0&&t<best){best=t;hit=b;}
 }
 const tx=dx>0?(x1-R-cue.x)/dx:dx<0?(x0+R-cue.x)/dx:Infinity,ty=dy>0?(y1-R-cue.y)/dy:dy<0?(y0+R-cue.y)/dy:Infinity,tw=Math.max(0,Math.min(tx,ty));
 if(tw<best){best=tw;hit=null;}
 const x=cue.x+dx*best,y=cue.y+dy*best;
 if(!hit)return {x,y,hit:null,dir:null,length:best};
 const nx=hit.x-x,ny=hit.y-y,nd=Math.hypot(nx,ny)||1;
 return {x,y,hit:hit.id,dir:{x:nx/nd,y:ny/nd},length:best};
}
// Distanza percorsa da una biglia lanciata a velocità v con attrito costante + resistenza lineare.
export function rollDistance(v){const F=POOL_RULES.friction,D=POOL_RULES.drag;return v<=0?0:v/D-(F/(D*D))*Math.log(1+D*v/F);}
export function speedFor(dist){let lo=0,hi=4000;for(let i=0;i<40;i++){const m=(lo+hi)/2;if(rollDistance(m)<dist)lo=m;else hi=m;}return hi;}
function segmentClear(game,ax,ay,bx,by,skip){
 const dx=bx-ax,dy=by-ay,L2=dx*dx+dy*dy||1,min=(2*R-.2)**2;
 for(const b of game.balls){
  if(b.pocketed||skip.includes(b.id))continue;
  const t=clamp(((b.x-ax)*dx+(b.y-ay)*dy)/L2,0,1),qx=ax+dx*t-b.x,qy=ay+dy*t-b.y;
  if(qx*qx+qy*qy<min)return false;
 }
 return true;
}
/* IA semplice: per ogni biglia e ogni buca cerca il «punto fantasma» dietro la biglia, scarta i tiri
 * coperti o troppo tagliati, preferisce quelli corti e dritti, poi sbaglia di poco la mira. */
export function aiChooseShot(game,rng=Math.random,{aimError=POOL_RULES.aiAimError}={}){
 const cue=cueBall(game),e=POOL_RULES.ballRestitution;let best=null;
 for(const t of game.balls){
  if(t.id===0||t.pocketed)continue;
  POCKETS.forEach((p,k)=>{
   const px=p.x+(p.side?0:(p.x<XM?1.5:-1.5)),py=p.y+(p.y<YM?1.5:-1.5);
   const ox=px-t.x,oy=py-t.y,td=Math.hypot(ox,oy);if(td<1)return;
   const ux=ox/td,uy=oy/td,gx=t.x-ux*2*R,gy=t.y-uy*2*R;
   if(p.side&&Math.abs(uy)<.55)return; // nelle buche centrali si entra solo quasi di fronte
   if(gx<x0+R-.5||gx>x1-R+.5||gy<y0+R-.5||gy>y1-R+.5)return;
   const cx=gx-cue.x,cy=gy-cue.y,cd=Math.hypot(cx,cy);if(cd<1)return;
   const cos=(cx*ux+cy*uy)/cd;if(cos<.3)return; // taglio troppo fino
   if(!segmentClear(game,cue.x,cue.y,gx,gy,[0,t.id])||!segmentClear(game,t.x,t.y,px,py,[0,t.id]))return;
   const vHit=speedFor(td+12)/(cos*(1+e)/2),v0=speedFor(cd+rollDistance(vHit))*1.08;
   const score=cd+td*1.6+(1-cos)*170+(v0>POOL_RULES.maxSpeed?400:0);
   if(!best||score<best.score)best={score,angle:Math.atan2(cy,cx),power:clamp(v0/POOL_RULES.maxSpeed,.12,1),target:t.id,pocket:k,cut:Math.acos(clamp(cos,-1,1))};
  });
 }
 if(!best){ // nessun tiro pulito: colpo deciso verso la biglia più vicina
  const a=aimAtNearest(game);best={score:Infinity,angle:a,power:.55,target:null,pocket:null,cut:null};
 }
 return {...best,angle:best.angle+(rng()*2-1)*aimError};
}

/* ---------- Risultati salvati (solo partite finite, una volta sola) ---------- */
export function freshPoolSave(){return {version:1,played:0,won:0,lost:0,drawn:0,freeCleared:0,freeBest:0,lastId:''};}
export function readPoolSave(storage){
 try{
  const raw=storage?.getItem?.(POOL_SAVE_KEY);if(!raw)return null;
  const s=JSON.parse(raw);if(!s||s.version!==1)return null;
  const n=v=>Math.max(0,Math.floor(Number(v)||0));
  return {version:1,played:n(s.played),won:n(s.won),lost:n(s.lost),drawn:n(s.drawn),freeCleared:n(s.freeCleared),freeBest:n(s.freeBest),lastId:typeof s.lastId==='string'?s.lastId.slice(0,40):''};
 }catch(_){return null;}
}
export function writePoolSave(storage,save){try{storage?.setItem?.(POOL_SAVE_KEY,JSON.stringify(save));}catch(_){}}
export function recordResult(save,game){
 if(game.phase!=='over'||game.recorded||save.lastId===game.id)return false;
 game.recorded=true;save.lastId=game.id;
 if(game.mode==='libero'){save.freeCleared+=1;save.freeBest=save.freeBest?Math.min(save.freeBest,game.shots):game.shots;}
 else{save.played+=1;if(game.winner==='player')save.won+=1;else if(game.winner==='cpu')save.lost+=1;else save.drawn+=1;}
 return true;
}
export function recordText(save){
 return 'PARTITE '+save.played+' · VINTE '+save.won+' · PERSE '+save.lost+' · PARI '+save.drawn+
  (save.freeBest?' · TIRO LIBERO: RECORD '+tiri(save.freeBest):'');
}

/* ---------- Pixel art (tutto disegnato in codice) ---------- */
const PAL={bg:'#1e120e',ink:'#1b1410',cream:'#f4e6c4',dim:'#8d7f66',gold:'#e9b949',wood:'#6b3a1e',woodD:'#4a2614',woodL:'#8a5228',
 cushion:'#1d6640',cushionD:'#134a2d',felt:'#2e7d4f',feltD:'#29724a',feltL:'#3d9461',shadow:'#1f5a38',pocket:'#0d0907',pocketRim:'#2a1612',
 pearl:'#f4e6c4',guide:'#f6f2ea',ghost:'#d8f0de',tip:'#6c9bd2',ferrule:'#f6f2ea',shaft:'#d9b27a',butt:'#5a2f17'};
export const BALL_COLORS=Object.freeze({0:['#f6f2ea','#c9c2b2'],1:['#f2c230','#a8801a'],2:['#2f58c8','#1a3378'],3:['#d0342a','#7d1b17'],
 4:['#7a3fae','#45215f'],5:['#ee7d2c','#9c4a14'],6:['#3fb86a','#1f6b3c'],7:['#8f2a1c','#4f140c'],8:['#2a2a2e','#0c0c0e'],9:['#f2c230','#a8801a']});
const BALL_MASK=['..###..','.#####.','#######','#######','#######','.#####.','..###..'];
function px(c,x,y,w,h,col){c.fillStyle=col;c.fillRect(x,y,w,h);}
function disc(c,cx,cy,r,col){c.fillStyle=col;for(let dy=-r;dy<=r;dy++){const h=Math.floor(Math.sqrt((r+.5)**2-dy*dy));c.fillRect(cx-h,cy+dy,2*h+1,1);}}
// Biglia 7×7: ombra sul panno, contorno scuro, colore, ombreggiatura e un punto di luce; la 9 è rigata.
export function drawBall(c,id,cx,cy,{shadow=true}={}){
 const [base,shade]=BALL_COLORS[id]||BALL_COLORS[1],x=Math.round(cx)-3,y=Math.round(cy)-3;
 for(let r=0;r<7;r++){
  const row=BALL_MASK[r],a=row.indexOf('#'),w=row.lastIndexOf('#')-a+1;
  if(shadow)px(c,x+a+1,y+r+1,w,1,PAL.shadow);
 }
 for(let r=0;r<7;r++){const row=BALL_MASK[r],a=row.indexOf('#');px(c,x+a,y+r,row.lastIndexOf('#')-a+1,1,PAL.ink);}
 const inner=[[1,2,3],[2,1,5],[3,1,5],[4,1,5],[5,2,3]];
 for(const [r,a,w] of inner)px(c,x+a,y+r,w,1,id===9&&(r===1||r===5)?BALL_COLORS[0][0]:base);
 px(c,x+3,y+5,2,1,id===9?BALL_COLORS[0][1]:shade);px(c,x+5,y+3,1,2,shade);px(c,x+4,y+4,1,1,shade);
 px(c,x+2,y+2,1,1,id===8?'#8a8a92':'#ffffff');
}
function ring(c,cx,cy,col){
 const x=Math.round(cx)-3,y=Math.round(cy)-3;
 for(let r=0;r<7;r++){const row=BALL_MASK[r],a=row.indexOf('#'),b=row.lastIndexOf('#');
  if(r===0||r===6)px(c,x+a,y+r,b-a+1,1,col);else{px(c,x+a,y+r,1,1,col);px(c,x+b,y+r,1,1,col);}}
}
// Tavolo fisso: cornice di legno con diamanti, sponde verdi, panno con trama, linea di battuta, 6 buche.
export function drawTable(c){
 c.imageSmoothingEnabled=false;
 px(c,0,0,POOL_W,POOL_H,PAL.bg);
 px(c,0,12,POOL_W,POOL_H-12,PAL.woodD);px(c,1,13,POOL_W-2,POOL_H-14,PAL.wood);
 px(c,1,13,POOL_W-2,1,PAL.woodL);px(c,1,13,1,POOL_H-14,PAL.woodL);
 for(let i=0;i<14;i++){px(c,5+i*16,15,7,1,PAL.woodD);px(c,11+i*16,132,7,1,PAL.woodD);}
 for(let i=0;i<6;i++){px(c,3,30+i*16,1,6,PAL.woodD);px(c,220,36+i*16,1,6,PAL.woodD);}
 px(c,x0-3,y0-3,x1-x0+6,y1-y0+6,PAL.cushion);
 px(c,x0-3,y0-3,x1-x0+6,1,PAL.cushionD);px(c,x0-3,y0-3,1,y1-y0+6,PAL.cushionD);
 px(c,x0,y0,x1-x0,y1-y0,PAL.felt);
 for(let y=y0+1;y<y1;y+=3)for(let x=x0+1+(y%2)*2;x<x1;x+=5)px(c,x,y,1,1,PAL.feltD);
 px(c,x0,y0,x1-x0,1,PAL.shadow);px(c,x0,y0,1,y1-y0,PAL.shadow);
 for(let y=y0+2;y<y1-1;y+=4)px(c,HEAD_SPOT.x,y,1,2,PAL.feltL);
 px(c,FOOT_SPOT.x-1,FOOT_SPOT.y,3,1,PAL.feltL);px(c,FOOT_SPOT.x,FOOT_SPOT.y-1,1,3,PAL.feltL);
 for(let k=1;k<8;k++)if(k!==4){px(c,x0+k*25-1,17,2,2,PAL.pearl);px(c,x0+k*25-1,129,2,2,PAL.pearl);}
 for(let k=1;k<4;k++){px(c,5,y0+k*25-1,2,2,PAL.pearl);px(c,217,y0+k*25-1,2,2,PAL.pearl);}
 for(const p of POCKETS){const cx=Math.round(p.x),cy=Math.round(p.y),r=Math.round(p.r);disc(c,cx,cy,r+1,PAL.pocketRim);disc(c,cx,cy,r,PAL.pocket);}
}
// Stecca dall'alto: puntale azzurro di gesso, ghiera, fusto chiaro e calcio scuro; arretra con la potenza.
// Non copre la striscia del punteggio in alto.
export function drawCue(c,cue,angle,power=0){
 const ux=-Math.cos(angle),uy=-Math.sin(angle),start=R+2+clamp(power,0,1)*16,len=84;
 for(let s=0;s<len;s++){
  const col=s<2?PAL.tip:s<4?PAL.ferrule:s<len*.6?PAL.shaft:s<len-3?PAL.butt:PAL.ink;
  const y=Math.round(cue.y+uy*(start+s));if(y<12)continue;
  px(c,Math.round(cue.x+ux*(start+s)),y,2,2,col);
 }
}
function strip(c,game){
 px(c,0,0,POOL_W,12,PAL.bg);c.font='bold 7px monospace';c.textBaseline='alphabetic';
 if(game.mode==='libero'){
  c.fillStyle=PAL.gold;c.textAlign='left';c.fillText('IMBUCATE '+game.scores.player+'/'+POOL_RULES.balls,4,9);
  c.textAlign='center';c.fillStyle=PAL.cream;c.fillText('TIRO LIBERO',POOL_W/2,9);
  c.textAlign='right';c.fillStyle=PAL.gold;c.fillText('TIRI '+game.shots,POOL_W-4,9);return;
 }
 const me=game.turn==='player';
 c.textAlign='left';c.fillStyle=me?PAL.gold:PAL.dim;c.fillText('TU '+game.scores.player,4,9);
 c.textAlign='right';c.fillStyle=me?PAL.dim:PAL.gold;c.fillText('CPU '+game.scores.cpu,POOL_W-4,9);
 game.potted.player.slice(0,9).forEach((id,i)=>drawBall(c,id,30+i*8,6,{shadow:false}));
 game.potted.cpu.slice(0,9).forEach((id,i)=>drawBall(c,id,POOL_W-34-i*8,6,{shadow:false}));
 // freccia del turno al centro
 const ax=POOL_W/2;c.fillStyle=PAL.gold;
 for(let i=0;i<4;i++)c.fillRect(me?ax-2+i:ax+1-i,5-i,1,1+2*i);
}
/* Schermata intera: tavolo, punteggio, biglie e, a biglie ferme, linea di mira, biglia fantasma e stecca. */
export function drawPoolScreen(c,{game,aim=game.aim,power=0,table=null,guide=true}={}){
 c.imageSmoothingEnabled=false;
 if(table)c.drawImage(table,0,0);else drawTable(c);
 strip(c,game);
 for(const b of game.balls)if(!b.pocketed)drawBall(c,b.id,b.x,b.y);
 if(game.phase==='aim'){
  const cue=cueBall(game);
  if(guide){
   const g=aimGuide(game,aim),dx=Math.cos(aim),dy=Math.sin(aim);
   for(let s=R+3;s<g.length-1;s+=3)px(c,Math.round(cue.x+dx*s),Math.round(cue.y+dy*s),1,1,PAL.guide);
   ring(c,g.x,g.y,PAL.ghost);
   if(g.dir){const t=game.balls[g.hit];for(let s=R+2;s<R+16;s+=2)px(c,Math.round(t.x+g.dir.x*s),Math.round(t.y+g.dir.y*s),1,1,PAL.gold);}
  }
  drawCue(c,cue,aim,power);
 }
 if(game.phase==='over'){
  px(c,52,58,120,32,PAL.ink);px(c,53,59,118,30,'#2a1612');px(c,53,59,118,1,PAL.gold);px(c,53,88,118,1,PAL.gold);
  c.textAlign='center';c.fillStyle=PAL.gold;c.font='bold 8px monospace';c.fillText(game.message.slice(0,24),POOL_W/2,72);
  c.fillStyle=PAL.cream;c.font='6px monospace';c.fillText('SPAZIO O NUOVA PARTITA',POOL_W/2,83);
 }
}

/* ---------- Pannello nel gioco ---------- */
let open=null;
export const isPoolOpen=()=>!!open;
// La partita in corso (per le prove e per il futuro tavolo della Q27); null a pannello chiuso.
export const currentPoolGame=()=>open?.game||null;
const pingPong=t=>{const k=((t%2)+2)%2;return k<1?k:2-k;};
const lerpAngle=(a,b,k)=>{const d=((b-a+Math.PI*3)%(Math.PI*2))-Math.PI;return a+d*k;};
export const POOL_RULES_TEXT='REGOLE SEMPLIFICATE · A CHI NE IMBUCA DI PIÙ: 9 biglie, 1 punto a biglia imbucata. Imbuchi? Ritiri. '+
 'Niente in buca: tocca all\'altro. Bianca in buca: −1 punto e turno all\'altro. A tavolo vuoto vince chi ha più punti. '+
 'TIRO LIBERO: da solo, con meno tiri possibile.';
function ensurePanel(doc){
 let panel=doc.getElementById('pool-panel');if(panel)return panel;
 panel=doc.createElement('section');panel.id='pool-panel';panel.className='slot-panel pool-panel';panel.hidden=true;
 panel.setAttribute('role','dialog');panel.setAttribute('aria-label','Biliardo arcade, senza denaro né scommesse');
 panel.innerHTML='<div class="slot-card pool-card"><canvas id="pool-canvas" width="'+POOL_W+'" height="'+POOL_H+'" aria-label="Tavolo da biliardo visto dall\'alto"></canvas>'+
  '<div class="pool-side"><h2 class="pool-title">BILIARDO DEL RIONE</h2>'+
  '<p class="pool-score" id="pool-score">TU 0 · CPU 0</p><p class="pool-msg" id="pool-msg" aria-live="polite"></p>'+
  '<div class="pool-power" aria-hidden="true"><span id="pool-power-fill"></span></div>'+
  '<div class="slot-controls pool-controls"><button id="pool-aim-left" type="button" aria-label="Ruota la mira a sinistra">◀ MIRA</button>'+
  '<button id="pool-aim-right" type="button" aria-label="Ruota la mira a destra">MIRA ▶</button>'+
  '<button id="pool-shoot" type="button" class="slot-spin" aria-label="Tieni premuto per caricare il tiro, rilascia per tirare">TIENI E TIRA</button>'+
  '<button id="pool-mode" type="button" aria-label="Cambia modalità e ricomincia">TIRO LIBERO</button><button id="pool-new" type="button">NUOVA PARTITA</button>'+
  '<button id="pool-exit" type="button">ESCI</button></div>'+
  '<p class="slot-rules">'+POOL_RULES_TEXT+'</p>'+
  '<p class="slot-rules">MIRA: dito o mouse sul tavolo, ◀ ▶ o frecce. TIRO: tieni premuto TIENI E TIRA (o mouse sul tavolo, o SPAZIO) e rilascia. ESC esce.</p>'+
  '<p class="slot-note">Di fantasia: niente soldi né scommesse; si salvano solo i risultati delle partite finite.</p>'+
  '<p class="pool-record" id="pool-record"></p></div></div>';
 (doc.querySelector('.stage')||doc.body).appendChild(panel);
 return panel;
}
/* Apre il biliardo sopra la scena (che resta in pausa: game.mjs controlla isPoolOpen()).
 * storage: dove salvare i risultati (localStorage nel gioco). onExit: richiamata all'uscita.
 * raf/caf/now/seed si possono sostituire nelle prove. */
export function openPoolMachine({onExit=()=>{},storage=globalThis.localStorage,doc=globalThis.document,now=()=>performance.now(),
 raf=globalThis.requestAnimationFrame?.bind(globalThis),caf=globalThis.cancelAnimationFrame?.bind(globalThis),seed=Date.now()}={}){
 if(open||!doc||!raf)return false;
 const panel=ensurePanel(doc),$=id=>doc.getElementById(id),canvas=$('pool-canvas'),c=canvas.getContext('2d');
 const save=readPoolSave(storage)||freshPoolSave(),rng=makeRng((Number(seed)>>>0)^0x51ED27);
 let table=null;try{table=doc.createElement('canvas');table.width=POOL_W;table.height=POOL_H;const tc=table.getContext('2d');if(tc)drawTable(tc);else table=null;}catch(_){table=null;}
 let games=0,mode='cpu',game=null,charge=null,cpu=null,aimHold=null,drag=null,rafId=0,last=now(),dirty=true;
 const me={}; // gettone di questa apertura: un frame rimasto in coda dopo l'uscita non fa più nulla
 const side={};
 const setText=(id,text)=>{if(side[id]!==text){side[id]=text;const el=$(id);if(el)el.textContent=text;}};
 const start=m=>{mode=m;games+=1;game=newPoolGame({mode,seed:((Number(seed)>>>0)+games*7919)>>>0});charge=null;cpu=null;me.game=game;dirty=true;};
 start('cpu');
 const playerTurn=()=>game.phase==='aim'&&(game.mode==='libero'||game.turn==='player');
 const cpuTurn=()=>game.mode==='cpu'&&game.phase==='aim'&&game.turn==='cpu';
 const refreshSide=()=>{
  setText('pool-score',game.mode==='libero'?'IMBUCATE '+game.scores.player+'/'+POOL_RULES.balls+' · TIRI '+game.shots:'TU '+game.scores.player+' · CPU '+game.scores.cpu);
  setText('pool-msg',cpu?'LA CPU MIRA…':game.message);
  setText('pool-mode',game.mode==='libero'?'CONTRO CPU':'TIRO LIBERO'); // il pulsante porta all'altra modalità
  setText('pool-record',recordText(save));
  const shootBtn=$('pool-shoot');if(shootBtn){shootBtn.disabled=!playerTurn();}
 };
 const draw=()=>{
  const power=charge?charge.power:cpu?cpu.power:0,aim=cpu?cpu.aim:game.aim;
  drawPoolScreen(c,{game,aim,power,table});
  const fill=$('pool-power-fill'),w=Math.round(power*100)+'%';if(fill&&fill.style.width!==w)fill.style.width=w;
  refreshSide();
 };
 const startCharge=source=>{if(!charge&&playerTurn()){charge={start:now(),power:0,source};dirty=true;}};
 const release=()=>{if(!charge)return;const p=Math.max(.05,pingPong((now()-charge.start)/1000/POOL_RULES.chargeSeconds));charge=null;shoot(game,game.aim,p);dirty=true;};
 const cancel=()=>{if(charge){charge=null;dirty=true;}};
 const rotate=d=>{if(playerTurn()&&!charge){game.aim+=d;dirty=true;}};
 const aimAt=e=>{
  if(!playerTurn()||charge)return;const b=canvas.getBoundingClientRect?.();if(!b||!b.width)return;
  const x=(e.clientX-b.left)*POOL_W/b.width,y=(e.clientY-b.top)*POOL_H/b.height,cue=cueBall(game);
  if((x-cue.x)**2+(y-cue.y)**2>4){game.aim=Math.atan2(y-cue.y,x-cue.x);dirty=true;}
 };
 const finish=out=>{
  if(out?.over&&recordResult(save,game))writePoolSave(storage,save); // risultato salvato una volta sola
  dirty=true;
 };
 const frame=()=>{
  rafId=0;if(open!==me)return;const t=now(),dt=clamp((t-last)/1000,0,.1);last=t;
  if(game.phase==='rolling'){finish(stepPool(game,dt));dirty=true;}
  else if(cpuTurn()){
   if(!cpu){const shot=aiChooseShot(game,rng);cpu={t:0,from:game.aim,shot,aim:game.aim,power:0};}
   cpu.t+=dt;cpu.aim=lerpAngle(cpu.from,cpu.shot.angle,Math.min(1,cpu.t/.7));
   cpu.power=cpu.t>.8?cpu.shot.power*Math.min(1,(cpu.t-.8)/.4):0;
   if(cpu.t>=POOL_RULES.cpuThinkSeconds){const s=cpu.shot;cpu=null;shoot(game,s.angle,s.power);}
   dirty=true;
  }
  if(charge){charge.power=pingPong((t-charge.start)/1000/POOL_RULES.chargeSeconds);dirty=true;}
  if(aimHold&&t-aimHold.start>250)rotate(aimHold.dir*dt*.35);
  if(dirty){dirty=false;draw();}
  if(open===me)rafId=raf(frame);
 };
 const close=()=>{
  if(open!==me)return;open=null;panel.hidden=true;if(rafId)caf?.(rafId);rafId=0;
  doc.removeEventListener('keydown',onKey,true);doc.removeEventListener('keyup',onKeyUp,true);
  // Una partita lasciata a metà non conta: si salvano solo le partite finite.
  onExit({played:save.played,won:save.won,lost:save.lost,drawn:save.drawn,abandoned:game.phase!=='over'});
 };
 // SPAZIO tira sempre; INVIO su un altro pulsante del pannello lo attiva come al solito.
 const isShotKey=e=>e.code==='Space'||e.key===' '||(e.key==='Enter'&&!(e.target?.tagName==='BUTTON'&&e.target.id!=='pool-shoot'));
 const onKey=e=>{
  if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();close();return;}
  if(isShotKey(e)){e.preventDefault();e.stopImmediatePropagation();if(!e.repeat){if(game.phase==='over')start(mode);else startCharge('key');}return;}
  if(e.key==='ArrowLeft'||e.key==='ArrowRight'||e.key==='ArrowUp'||e.key==='ArrowDown'){
   e.preventDefault();e.stopImmediatePropagation();
   const dir=e.key==='ArrowLeft'||e.key==='ArrowUp'?-1:1;rotate(dir*(e.shiftKey?.003:.0175));return;}
  e.stopImmediatePropagation();
 };
 const onKeyUp=e=>{
  if(isShotKey(e)){e.preventDefault();e.stopImmediatePropagation();if(charge?.source==='key')release();return;}
  e.stopImmediatePropagation();
 };
 // Mouse: si mira muovendolo sul tavolo, si carica tenendo premuto e si tira rilasciando.
 // Dito: si mira toccando e trascinando sul tavolo; si tira con TIENI E TIRA.
 canvas.onpointerdown=e=>{
  e.preventDefault?.();if(!playerTurn())return;aimAt(e);
  if(e.pointerType==='mouse'){if(e.button===0)startCharge('mouse');}else drag=e.pointerId;
  try{canvas.setPointerCapture?.(e.pointerId);}catch(_){}
 };
 canvas.onpointermove=e=>{if(e.pointerType==='mouse'||drag===e.pointerId)aimAt(e);};
 canvas.onpointerup=e=>{if(e.pointerType==='mouse'&&charge?.source==='mouse')release();drag=null;};
 canvas.onpointercancel=()=>{if(charge?.source==='mouse')cancel();drag=null;};
 const shootBtn=$('pool-shoot');
 shootBtn.onpointerdown=e=>{e.preventDefault?.();startCharge('button');try{shootBtn.setPointerCapture?.(e.pointerId);}catch(_){}};
 shootBtn.onpointerup=()=>{if(charge?.source==='button')release();};
 shootBtn.onpointercancel=()=>{if(charge?.source==='button')cancel();};
 for(const [id,dir] of [['pool-aim-left',-1],['pool-aim-right',1]]){
  const b=$(id);
  b.onpointerdown=e=>{e.preventDefault?.();rotate(dir*.0105);aimHold={dir,start:now()};};
  b.onpointerup=b.onpointercancel=b.onpointerleave=()=>{aimHold=null;};
 }
 $('pool-mode').onclick=()=>start(mode==='cpu'?'libero':'cpu');
 $('pool-new').onclick=()=>start(mode);
 $('pool-exit').onclick=close;
 doc.addEventListener('keydown',onKey,true);doc.addEventListener('keyup',onKeyUp,true);
 me.close=close;open=me;panel.hidden=false;draw();rafId=raf(frame);
 $('pool-shoot').focus?.({preventScroll:true});
 return true;
}
export function closePoolMachine(){open?.close();}
