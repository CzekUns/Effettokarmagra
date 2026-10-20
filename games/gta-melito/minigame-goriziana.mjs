/* Q31 — Goriziana arcade: biliardo all'italiana a nove birilli, tavolo SENZA buche.
 * Minigioco a sé, indipendente dal biliardo a buche della Q30 (minigame-pool.mjs): non condivide stato né file.
 * Regole SEMPLIFICATE (arcade), scritte anche a schermo; non è il regolamento sportivo completo:
 *  - due biglie bianche (la tua liscia, quella dell'IA col puntino rosso), un pallino rosso, 9 birilli a rombo;
 *  - tiri la TUA biglia e devi toccare per prima la biglia avversaria (le sponde valgono);
 *  - birillo bianco 2 punti, birillo rosso centrale 4 punti (10 se cade da solo), pallino toccato +3;
 *  - fallo (prima tocchi il pallino, i birilli o niente): i punti del tiro vanno all'avversario, almeno 2;
 *  - dopo ogni tiro i birilli si rialzano e tocca all'altro; vince chi arriva a 30 o chi ha di più dopo 5 tiri a testa.
 * Niente soldi, crediti o premi: si gioca solo per i punti della partita, nessun salvataggio, nessuna rete.
 * Fisica 2D leggera a passi fissi: attrito, sponde, urti fra biglie, birilli che cadono (anche a catena).
 * Aggancio per il tavolo della Q27: openGoriziana({onExit}). Grafica provvisoria, da approvare. */
import {makeRng} from './minigame-slot.mjs?v=001';

export const GOR_RULES=Object.freeze({target:30,shotsEach:5,whitePin:2,redPin:4,redAlone:10,pallino:3,foulMin:2,
 maxSpeed:250,minPower:.15,aiDelay:.9});
// Panno verde (interno sponde) in pixel logici del canvas 192×128.
export const TABLE=Object.freeze({x0:12,y0:21,x1:180,y1:103,cx:96,cy:62});
export const BALL_R=3,PALLINO_R=2.5,PIN_R=1.4,PIN_GAP=5;
export const BALL_IDS=Object.freeze(['p0','p1','pallino']);
export const PLAYER_NAMES=Object.freeze(['TU','IA']);
// Posizioni di partenza (e di rimpiazzo se una biglia si ferma sul castello dei birilli).
export const SPOTS=Object.freeze({p0:Object.freeze([28,78]),p1:Object.freeze([64,46]),pallino:Object.freeze([150,62])});
const SUB=1/240,DECEL=40,DAMP=.45,STOP=2.5,CUSHION=.78,BALL_E=.94,PIN_SLOW=.88;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const CASTLE_R=PIN_GAP*Math.SQRT2+PIN_R;

// Nove birilli a rombo (griglia 3×3 ruotata di 45°) attorno al centro; il centrale è rosso.
export function pinLayout(){
 const k=PIN_GAP/Math.SQRT2,pins=[];
 for(let i=-1;i<=1;i++)for(let j=-1;j<=1;j++)pins.push({x:TABLE.cx+(i-j)*k,y:TABLE.cy+(i+j)*k,red:i===0&&j===0,down:false,by:null,fall:null});
 return pins;
}
const makeBall=id=>({id,x:SPOTS[id][0],y:SPOTS[id][1],vx:0,vy:0,r:id==='pallino'?PALLINO_R:BALL_R});
export function createGorizianaGame({seed=1,firstTurn=0}={}){
 return {seed:(Number(seed)>>>0)||1,balls:BALL_IDS.map(makeBall),pins:pinLayout(),scores:[0,0],shots:[0,0],
  turn:firstTurn?1:0,phase:'aim',shot:null,last:null,winner:null,aim:{angle:Math.atan2(SPOTS.p1[1]-SPOTS.p0[1],SPOTS.p1[0]-SPOTS.p0[0]),power:.55}};
}
export const ballOf=(game,player)=>game.balls[player];
export const isMoving=game=>game.balls.some(b=>b.vx||b.vy);

/* Tiro della biglia di chi è di turno: angolo in radianti, potenza 0..1. false se non si può tirare. */
export function shoot(game,angle,power){
 if(game.phase!=='aim'||!Number.isFinite(angle))return false;
 const p=clamp(Number(power)||0,GOR_RULES.minPower,1),b=ballOf(game,game.turn),v=p*GOR_RULES.maxSpeed;
 b.vx=Math.cos(angle)*v;b.vy=Math.sin(angle)*v;
 game.phase='rolling';game.shot={shooter:game.turn,angle,power:p,first:null,pins:[],pallinoBy:null};
 return true;
}
// Registra il primo contatto della biglia di chi tira e chi tocca il pallino.
function contact(game,who,what){
 const s=game.shot;if(!s)return;
 if(who===BALL_IDS[s.shooter]&&s.first===null)s.first=what;
 if(what==='pallino'&&who!=='pallino'&&!s.pallinoBy)s.pallinoBy=who;
}
// Un birillo cade nella direzione del colpo e può buttare giù il vicino che ha davanti (catena breve).
function knockPin(game,idx,by,dx,dy,depth=0){
 const pin=game.pins[idx];if(pin.down)return;
 const d=Math.hypot(dx,dy)||1,ux=dx/d,uy=dy/d;
 pin.down=true;pin.by=by;pin.fall=[ux,uy];game.shot?.pins.push(idx);
 if(depth>=2)return;
 game.pins.forEach((o,j)=>{
  if(o.down)return;const ox=o.x-pin.x,oy=o.y-pin.y,od=Math.hypot(ox,oy);
  if(od<=PIN_GAP*1.05&&(ox*ux+oy*uy)/od>.92)knockPin(game,j,by,ux,uy,depth+1);
 });
}
/* Fisica a passi fissi (1/240 s). Restituisce true se qualcosa si muove ancora. */
export function stepPhysics(game,dt){
 const n=Math.max(1,Math.ceil(Math.max(0,dt)/SUB)),h=Math.max(0,dt)/n,{x0,y0,x1,y1}=TABLE,balls=game.balls;
 for(let s=0;s<n;s++){
  for(const b of balls){
   if(!b.vx&&!b.vy)continue;
   b.x+=b.vx*h;b.y+=b.vy*h;
   const sp=Math.hypot(b.vx,b.vy),ns=sp-(DECEL+DAMP*sp)*h;
   if(ns<=STOP){b.vx=0;b.vy=0;}else{b.vx*=ns/sp;b.vy*=ns/sp;}
   if(b.x-b.r<x0){b.x=x0+b.r;b.vx=Math.abs(b.vx)*CUSHION;}else if(b.x+b.r>x1){b.x=x1-b.r;b.vx=-Math.abs(b.vx)*CUSHION;}
   if(b.y-b.r<y0){b.y=y0+b.r;b.vy=Math.abs(b.vy)*CUSHION;}else if(b.y+b.r>y1){b.y=y1-b.r;b.vy=-Math.abs(b.vy)*CUSHION;}
  }
  for(let i=0;i<balls.length;i++)for(let j=i+1;j<balls.length;j++){
   const a=balls[i],b=balls[j],dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy),min=a.r+b.r;
   if(d>=min||d===0)continue;
   const nx=dx/d,ny=dy/d,push=(min-d)/2;a.x-=nx*push;a.y-=ny*push;b.x+=nx*push;b.y+=ny*push;
   const vn=(a.vx-b.vx)*nx+(a.vy-b.vy)*ny;if(vn<=0)continue;
   const imp=vn*(1+BALL_E)/2;a.vx-=imp*nx;a.vy-=imp*ny;b.vx+=imp*nx;b.vy+=imp*ny;
   contact(game,a.id,b.id);contact(game,b.id,a.id);
  }
  for(const b of balls){
   if(!b.vx&&!b.vy)continue;
   game.pins.forEach((pin,idx)=>{
    if(pin.down||Math.hypot(pin.x-b.x,pin.y-b.y)>=b.r+PIN_R)return;
    contact(game,b.id,'pin');knockPin(game,idx,b.id,b.vx,b.vy);b.vx*=PIN_SLOW;b.vy*=PIN_SLOW;
   });
  }
 }
 return isMoving(game);
}

/* Punteggio di un tiro (funzione pura). shot: {shooter, first, pins:[{red}], pallinoBy}. */
export function scoreShot(shot){
 const R=GOR_RULES,opp=BALL_IDS[1-shot.shooter],pins=shot.pins||[];
 const reds=pins.filter(p=>p.red).length,whites=pins.length-reds;
 const pinPts=reds&&!whites?R.redAlone*reds:whites*R.whitePin+reds*R.redPin;
 const raw=pinPts+(shot.pallinoBy?R.pallino:0);
 if(shot.first!==opp){
  const reason=shot.first===null?'NON TOCCA LA BIGLIA AVVERSARIA':shot.first==='pallino'?'TOCCA PRIMA IL PALLINO':'TOCCA PRIMA I BIRILLI';
  return {foul:true,reason,points:Math.max(R.foulMin,raw),to:1-shot.shooter,pins:pins.length,red:reds>0,pallino:!!shot.pallinoBy};
 }
 return {foul:false,reason:raw?'TIRO VALIDO':'TIRO VALIDO · NESSUN PUNTO',points:raw,to:shot.shooter,pins:pins.length,red:reds>0,pallino:!!shot.pallinoBy};
}
// Biglia ferma sul castello o sopra un'altra: torna al suo posto (o il primo posto libero lì accanto).
function placeFree(game,b){
 const busy=(x,y)=>Math.hypot(x-TABLE.cx,y-TABLE.cy)<CASTLE_R+b.r+.5||game.balls.some(o=>o!==b&&Math.hypot(o.x-x,o.y-y)<o.r+b.r+.5);
 if(!busy(b.x,b.y))return;
 const [sx,sy]=SPOTS[b.id];
 for(let k=0;k<40;k++){
  const x=clamp(sx+(k%2?1:-1)*Math.ceil(k/2)*7,TABLE.x0+b.r,TABLE.x1-b.r);
  if(!busy(x,sy)){b.x=x;b.y=sy;return;}
 }
 b.x=sx;b.y=sy;
}
/* Rimpiazzo del tavolo: birilli rialzati, biglie ferme e fuori dal castello. */
export function resetTable(game){
 game.pins=pinLayout();
 for(const b of game.balls){b.vx=0;b.vy=0;}
 for(const b of game.balls)placeFree(game,b);
}
/* Chiude il tiro a biglie ferme: punti, rimpiazzo, cambio turno o fine partita. */
export function endShot(game){
 if(game.phase!=='rolling'||isMoving(game))return null;
 const s=game.shot,res=scoreShot({...s,pins:s.pins.map(i=>game.pins[i])});
 game.scores[res.to]+=res.points;game.shots[s.shooter]+=1;
 game.last={...res,shooter:s.shooter};game.shot=null;
 resetTable(game);
 const R=GOR_RULES,[a,b]=game.scores;
 if(a>=R.target||b>=R.target||(game.shots[0]>=R.shotsEach&&game.shots[1]>=R.shotsEach)){
  game.phase='over';game.winner=a>b?0:b>a?1:-1;
 }else{game.turn=1-s.shooter;game.phase='aim';}
 return game.last;
}
// Il tiro intero senza grafica (per test e prove): simula fino alle biglie ferme.
export function playShot(game,angle,power,maxSeconds=30){
 if(!shoot(game,angle,power))return null;
 for(let t=0;t<maxSeconds&&stepPhysics(game,1/30);t+=1/30);
 for(const b of game.balls){b.vx=0;b.vy=0;}
 return endShot(game);
}

// Il segmento a→b passa sul castello dei birilli?
const crossesCastle=(ax,ay,bx,by,r)=>{
 const dx=bx-ax,dy=by-ay,L=dx*dx+dy*dy||1,t=clamp(((TABLE.cx-ax)*dx+(TABLE.cy-ay)*dy)/L,0,1);
 return Math.hypot(ax+dx*t-TABLE.cx,ay+dy*t-TABLE.cy)<CASTLE_R+r;
};
/* IA semplice: mira a mandare la biglia avversaria sui birilli (palla fantasma); se il castello è in mezzo
 * tira pieno sulla biglia, se è ancora coperta usa una sponda lunga. Un piccolo errore con seme. */
export function aiChooseShot(game){
 const me=ballOf(game,game.turn),opp=ballOf(game,1-game.turn);
 const rng=makeRng(game.seed^Math.imul(game.shots[0]+game.shots[1]+1,0x27D4EB2D));
 let dx=TABLE.cx-opp.x,dy=TABLE.cy-opp.y,d=Math.hypot(dx,dy)||1;
 let tx=opp.x-dx/d*(me.r+opp.r),ty=opp.y-dy/d*(me.r+opp.r),mode='birilli';
 if(crossesCastle(me.x,me.y,tx,ty,me.r)){tx=opp.x;ty=opp.y;mode='piena';}
 if(crossesCastle(me.x,me.y,tx,ty,me.r)){
  const top=opp.y<TABLE.cy,wall=top?TABLE.y0+me.r:TABLE.y1-me.r;tx=opp.x;ty=2*wall-opp.y;mode='sponda';
 }
 const dist=Math.hypot(tx-me.x,ty-me.y),run=mode==='birilli'?d:40;
 return {angle:Math.atan2(ty-me.y,tx-me.x)+(rng()-.5)*.08,power:clamp(.3+(dist+1.8*run)/330+(rng()-.5)*.08,.35,.95),mode};
}
export function shotMessage(last,winner=null){
 if(!last)return 'TOCCA A TE: MIRA E TIRA';
 const who=PLAYER_NAMES[last.shooter],to=PLAYER_NAMES[last.to];
 return last.foul?('FALLO '+who+': '+last.reason+' · +'+last.points+' A '+to):(who+': '+last.reason+(last.points?' · +'+last.points:''));
}
export function winnerText(game){
 if(game.winner===-1)return 'PAREGGIO '+game.scores[0]+'–'+game.scores[1];
 return (game.winner===0?'HAI VINTO ':'VINCE L\'IA ')+game.scores[0]+'–'+game.scores[1];
}

/* ---------- Pixel art (tutto disegnato in codice) ---------- */
const PAL={ink:'#1b1410',wood:'#6b4422',woodD:'#3f2712',woodL:'#8d5f33',felt:'#2f7a52',feltD:'#1f5a3c',feltL:'#3a8c60',
 cream:'#f4e6c4',ball:'#f6f2ea',ballD:'#cfc8b8',red:'#c8322a',redD:'#7d1b17',gold:'#e9b949',cue:'#c79a5a',cueD:'#7a5326'};
export const W=192,H=128;
function px(c,x,y,w,h,col){c.fillStyle=col;c.fillRect(x,y,w,h);}
// Cerchio pieno a righe di pixel, nitido anche ingrandito.
export function disc(c,x,y,r,col){
 c.fillStyle=col;const R=Math.round,n=Math.ceil(r);
 for(let dy=-n;dy<=n;dy++){const w=Math.sqrt(Math.max(0,r*r-dy*dy));if(w<.5)continue;c.fillRect(R(x-w),R(y+dy),Math.max(1,R(x+w)-R(x-w)),1);}
}
function dotted(c,x,y,ang,from,to,col,step=3){
 c.fillStyle=col;for(let t=from;t<=to;t+=step)c.fillRect(Math.round(x+Math.cos(ang)*t),Math.round(y+Math.sin(ang)*t),1,1);
}
export function drawTable(c){
 const {x0,y0,x1,y1}=TABLE;
 px(c,0,0,W,H,PAL.ink);
 px(c,x0-7,y0-7,x1-x0+14,y1-y0+14,PAL.woodD);px(c,x0-6,y0-6,x1-x0+12,y1-y0+12,PAL.wood);
 px(c,x0-6,y0-6,x1-x0+12,1,PAL.woodL);
 // Mire (diamanti) sulle sponde di legno.
 for(let i=1;i<8;i++){const x=Math.round(x0+(x1-x0)*i/8);px(c,x,y0-4,1,1,PAL.cream);px(c,x,y1+3,1,1,PAL.cream);}
 for(let i=1;i<4;i++){const y=Math.round(y0+(y1-y0)*i/4);px(c,x0-4,y,1,1,PAL.cream);px(c,x1+3,y,1,1,PAL.cream);}
 // Sponde di gomma e panno con leggera trama; nessuna buca.
 px(c,x0-2,y0-2,x1-x0+4,y1-y0+4,PAL.feltD);px(c,x0,y0,x1-x0,y1-y0,PAL.felt);
 for(let y=y0+2;y<y1;y+=4)for(let x=x0+((y>>2)%2?2:0);x<x1;x+=4)px(c,x,y,1,1,PAL.feltL);
 // Segni dei birilli e linea di battuta.
 for(const p of pinLayout())px(c,Math.round(p.x),Math.round(p.y),1,1,PAL.feltD);
 for(let y=y0+2;y<y1;y+=3)px(c,x0+42,y,1,1,PAL.feltL);
}
export function drawPin(c,pin){
 const x=Math.round(pin.x),y=Math.round(pin.y),body=pin.red?PAL.red:PAL.ball,shade=pin.red?PAL.redD:PAL.ballD;
 if(pin.down){
  const [ux,uy]=pin.fall||[1,0];
  for(let t=0;t<=4;t++)px(c,Math.round(x+ux*t),Math.round(y+uy*t),1,1,t===4?PAL.ink:t<2?shade:body);
  return;
 }
 px(c,x-1,y+1,3,1,PAL.feltD);px(c,x-1,y-1,3,2,shade);px(c,x,y-2,1,3,body);px(c,x,y-3,1,1,PAL.ink);
}
export function drawBall(c,b){
 disc(c,b.x+.8,b.y+.8,b.r,PAL.feltD);
 if(b.id==='pallino'){disc(c,b.x,b.y,b.r,PAL.red);px(c,Math.round(b.x)-1,Math.round(b.y)-1,1,1,'#f08a7a');return;}
 disc(c,b.x,b.y,b.r,PAL.ballD);disc(c,b.x-.4,b.y-.4,b.r-.7,PAL.ball);
 if(b.id==='p1')px(c,Math.round(b.x)-1,Math.round(b.y)-1,2,2,PAL.red);
 px(c,Math.round(b.x)-2,Math.round(b.y)-2,1,1,'#ffffff');
}
// Schermata intera: punteggi e turni in alto, tavolo, mira con stecca, messaggio e potenza in basso.
export function drawGorizianaScreen(c,game,view={}){
 const {message='',showAim=false,angle=0,power=.5,flash=0}=view;
 c.imageSmoothingEnabled=false;
 drawTable(c);
 for(const p of game.pins)drawPin(c,p);
 for(const b of game.balls)drawBall(c,b);
 if(showAim){
  const b=ballOf(game,game.turn);
  dotted(c,b.x,b.y,angle,b.r+2,b.r+14+power*46,PAL.cream);
  const back=angle+Math.PI,gap=b.r+2+power*7;
  for(let t=gap;t<gap+34;t+=1)px(c,Math.round(b.x+Math.cos(back)*t),Math.round(b.y+Math.sin(back)*t),1,1,t<gap+3?PAL.cream:t<gap+22?PAL.cue:PAL.cueD);
 }
 // Barra alta: punti, tiri fatti e chi gioca.
 px(c,0,0,W,12,'#2a1612');
 c.font='bold 7px monospace';c.textBaseline='alphabetic';
 const tag=(i,x,align)=>{const on=game.phase!=='over'&&game.turn===i;c.textAlign=align;c.fillStyle=on?PAL.gold:PAL.cream;
  c.fillText((on?'▸':'')+PLAYER_NAMES[i]+' '+game.scores[i]+' · TIRI '+game.shots[i]+'/'+GOR_RULES.shotsEach,x,9);};
 tag(0,4,'left');tag(1,W-4,'right');
 c.fillStyle=PAL.cream;c.textAlign='center';c.font='6px monospace';c.fillText('A '+GOR_RULES.target,W/2,9);
 // Barra bassa: messaggio e potenza.
 px(c,0,112,W,16,'#2a1612');
 c.fillStyle=flash?PAL.gold:PAL.cream;c.font='6px monospace';c.textAlign='center';c.fillText(String(message).slice(0,46),W/2,119);
 c.textAlign='left';c.fillStyle=PAL.cream;c.fillText('POTENZA',4,126);
 px(c,36,121,52,5,PAL.ink);px(c,37,122,Math.round(50*clamp(power,0,1)),3,power>.8?PAL.red:PAL.gold);
 c.textAlign='right';c.fillText('BIRILLO 2 · ROSSO 4/10 · PALLINO 3',W-4,126);
}
// Da coordinate dello schermo a pixel logici del canvas.
export function canvasPoint(rect,clientX,clientY){
 if(!rect||!rect.width||!rect.height)return null;
 return {x:(clientX-rect.left)*W/rect.width,y:(clientY-rect.top)*H/rect.height};
}
// Mira e potenza dal punto toccato: direzione dalla biglia al dito, distanza = potenza. null se troppo vicino.
export function aimFromPoint(ball,x,y){
 const dx=x-ball.x,dy=y-ball.y,d=Math.hypot(dx,dy);
 if(d<ball.r+3)return null;
 return {angle:Math.atan2(dy,dx),power:clamp(d/70,GOR_RULES.minPower,1)};
}

/* ---------- Pannello nel gioco ---------- */
let open=null;
export const isGorizianaOpen=()=>!!open;
export const currentGorizianaGame=()=>open?.game||null;
function ensurePanel(doc){
 let panel=doc.getElementById('goriziana-panel');if(panel)return panel;
 panel=doc.createElement('section');panel.id='goriziana-panel';panel.className='slot-panel goriziana-panel';panel.hidden=true;
 panel.setAttribute('role','dialog');panel.setAttribute('aria-label','Goriziana arcade, biliardo a nove birilli');
 panel.innerHTML='<div class="slot-card"><canvas id="goriziana-canvas" width="'+W+'" height="'+H+'" aria-label="Tavolo da goriziana senza buche"></canvas>'+
  '<div class="slot-controls"><button id="gor-left" type="button" aria-label="Ruota la mira a sinistra">◄ MIRA</button>'+
  '<button id="gor-right" type="button" aria-label="Ruota la mira a destra">MIRA ►</button>'+
  '<button id="gor-down" type="button" aria-label="Meno potenza">POTENZA −</button>'+
  '<button id="gor-up" type="button" aria-label="Più potenza">POTENZA ＋</button>'+
  '<button id="gor-shoot" type="button" class="slot-spin">TIRA</button>'+
  '<button id="gor-new" type="button" hidden>NUOVA PARTITA</button>'+
  '<button id="gor-exit" type="button">ESCI</button></div>'+
  '<p class="slot-rules">GORIZIANA ARCADE (regole semplificate): tira la tua biglia bianca e tocca per prima la biglia dell\'IA (quella col puntino); le sponde valgono. '+
  'Birillo bianco 2 punti, birillo rosso centrale 4 (10 se cade da solo), pallino rosso toccato +3. '+
  'FALLO se tocchi prima il pallino, i birilli o niente: i punti del tiro vanno all\'avversario, almeno 2. '+
  'I birilli si rialzano dopo ogni tiro; vince chi arriva a 30 o chi ha di più dopo 5 tiri a testa.</p>'+
  '<p class="slot-rules">Comandi: tocca o trascina sul tavolo per mirare (più lontano = più forte) e rilascia per tirare; oppure ←/→ mira, ↑/↓ potenza, SPAZIO tira · ESC esce.</p>'+
  '<p class="slot-note">Si gioca solo per i punti della partita: niente soldi, crediti o premi. Grafica provvisoria.</p></div>';
 (doc.querySelector?.('.stage')||doc.body).appendChild(panel);
 return panel;
}
/* Apre la goriziana sopra la scena (che resta in pausa: game.mjs controlla isGorizianaOpen()).
 * onExit({scores,shots,phase,winner}) all'uscita. raf/caf iniettabili per le prove. */
export function openGoriziana({onExit=()=>{},doc=globalThis.document,now=()=>performance.now(),seed=Date.now(),
 raf=globalThis.requestAnimationFrame?.bind(globalThis),caf=globalThis.cancelAnimationFrame?.bind(globalThis)}={}){
 if(open||!doc)return false;
 const panel=ensurePanel(doc),canvas=doc.getElementById('goriziana-canvas'),c=canvas.getContext('2d');
 const $=id=>doc.getElementById(id),schedule=raf||(fn=>setTimeout(fn,16)),unschedule=caf||clearTimeout;
 let game=createGorizianaGame({seed}),message='TOCCA A TE: MIRA E TIRA',flash=0,aiWait=0,drag=false,last=now(),handle=0;
 const humanAim=()=>game.phase==='aim'&&game.turn===0;
 const refresh=()=>{
  const can=humanAim();
  for(const id of ['gor-left','gor-right','gor-down','gor-up','gor-shoot'])$(id).disabled=!can;
  $('gor-new').hidden=game.phase!=='over';
  drawGorizianaScreen(c,game,{message,flash,showAim:can,angle:game.aim.angle,power:game.aim.power});
 };
 const fire=()=>{if(humanAim()&&shoot(game,game.aim.angle,game.aim.power)){message='LA BIGLIA CORRE…';flash=0;}refresh();};
 const after=res=>{
  if(!res)return;
  flash=res.points>0?1:0;
  message=game.phase==='over'?winnerText(game)+' · NUOVA PARTITA O ESCI':shotMessage(res)+(game.turn===1?' · TOCCA ALL\'IA':' · TOCCA A TE');
 };
 const frame=()=>{
  handle=0;if(!open)return;
  const t=now(),dt=clamp((t-last)/1000,0,.05);last=t;
  if(game.phase==='rolling'&&!stepPhysics(game,dt))after(endShot(game));
  else if(game.phase==='aim'&&game.turn===1){
   aiWait+=dt;
   if(aiWait>=GOR_RULES.aiDelay){aiWait=0;const ai=aiChooseShot(game);shoot(game,ai.angle,ai.power);message='TIRA L\'IA…';flash=0;}
  }else aiWait=0;
  refresh();if(open)handle=schedule(frame);
 };
 const turnAim=dir=>{if(humanAim()){game.aim.angle+=dir*.035;refresh();}};
 const powerStep=dir=>{if(humanAim()){game.aim.power=clamp(game.aim.power+dir*.05,GOR_RULES.minPower,1);refresh();}};
 const restart=()=>{game=createGorizianaGame({seed:(game.seed+0x9E37)>>>0});open.game=game;message='NUOVA PARTITA · TOCCA A TE';flash=0;aiWait=0;refresh();};
 const close=()=>{
  if(!open)return;open=null;panel.hidden=true;if(handle)unschedule(handle);handle=0;drag=false;
  doc.removeEventListener('keydown',onKey,true);
  onExit({scores:game.scores.slice(),shots:game.shots.slice(),phase:game.phase,winner:game.winner});
 };
 const onKey=e=>{
  const stop=()=>{e.preventDefault?.();e.stopImmediatePropagation?.();};
  if(e.key==='Escape'){stop();close();return;}
  if(e.code==='Space'||e.key===' '||e.key==='Enter'){stop();if(!e.repeat){if(game.phase==='over')restart();else fire();}return;}
  if(e.key==='ArrowLeft'||e.key==='ArrowRight'){stop();turnAim(e.key==='ArrowRight'?1:-1);return;}
  if(e.key==='ArrowUp'||e.key==='ArrowDown'){stop();powerStep(e.key==='ArrowUp'?1:-1);return;}
  e.stopImmediatePropagation?.();
 };
 const pointAim=e=>{
  const p=canvasPoint(canvas.getBoundingClientRect?.(),e.clientX,e.clientY);if(!p)return null;
  const a=aimFromPoint(ballOf(game,0),p.x,p.y);if(a){game.aim.angle=a.angle;game.aim.power=a.power;}
  return a;
 };
 canvas.onpointerdown=e=>{if(!humanAim())return;drag=true;pointAim(e);canvas.setPointerCapture?.(e.pointerId);e.preventDefault?.();refresh();};
 canvas.onpointermove=e=>{if(drag&&humanAim()){pointAim(e);refresh();}};
 canvas.onpointerup=e=>{if(!drag)return;drag=false;if(humanAim()&&pointAim(e))fire();else refresh();};
 canvas.onpointercancel=()=>{drag=false;};
 $('gor-left').onclick=()=>turnAim(-1);$('gor-right').onclick=()=>turnAim(1);
 $('gor-down').onclick=()=>powerStep(-1);$('gor-up').onclick=()=>powerStep(1);
 $('gor-shoot').onclick=fire;$('gor-new').onclick=restart;$('gor-exit').onclick=close;
 doc.addEventListener('keydown',onKey,true);
 open={close,game};panel.hidden=false;refresh();handle=schedule(frame);
 $('gor-shoot').focus?.({preventScroll:true});
 return true;
}
export function closeGoriziana(){open?.close();}
