import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {newPoolGame,rackBalls,collideBalls,railAndPocket,stepPool,runUntilRest,shoot,endShot,respotCue,aimGuide,aiChooseShot,
 ballsLeft,cueBall,isSettled,shotMessage,rollDistance,speedFor,freshPoolSave,readPoolSave,writePoolSave,recordResult,recordText,
 drawTable,drawBall,drawCue,drawPoolScreen,openPoolMachine,isPoolOpen,currentPoolGame,closePoolMachine,
 POOL_RULES,POOL_RULES_TEXT,POOL_SAVE_KEY,POCKETS,TABLE,HEAD_SPOT,FOOT_SPOT,BALL_COLORS,POOL_W,POOL_H} from './minigame-pool.mjs';
import {makeRng} from './minigame-slot.mjs';

const R=POOL_RULES.ballRadius,{x0,y0,x1,y1}=TABLE,XM=(x0+x1)/2;
const memory=()=>{const m=new Map();return {getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),m};};
// Lascia sul tavolo solo le biglie elencate [id,x,y]; le altre sono già in buca.
function setup(game,list){
 for(const b of game.balls){const p=list.find(l=>l[0]===b.id);b.vx=0;b.vy=0;
  if(p){b.x=p[1];b.y=p[2];b.pocketed=false;}else{b.pocketed=true;b.x=-50;b.y=-50;}}
 return game;
}
// Bianca allineata dietro la biglia, verso il centro della buca, a distanza back.
function lineUp(x,y,pocket,back){
 const dx=pocket.x-x,dy=pocket.y-y,d=Math.hypot(dx,dy);
 return {cue:[0,x-dx/d*back,y-dy/d*back],angle:Math.atan2(dy,dx)};
}
const energy=(...bs)=>bs.reduce((s,b)=>s+b.vx*b.vx+b.vy*b.vy,0);
const onTable=b=>b.x>=x0+R-1e-9&&b.x<=x1-R+1e-9&&b.y>=y0+R-1e-9&&b.y<=y1-R+1e-9;

test('Q30 table and rack: cue ball and 9 coloured balls, 6 pockets, simplified rules declared',()=>{
 const g=newPoolGame({seed:3});
 assert.deepEqual(g.balls.map(b=>b.id),[0,1,2,3,4,5,6,7,8,9]);
 assert.equal(ballsLeft(g),POOL_RULES.balls);
 for(const b of g.balls)assert.ok(onTable(b),'ball '+b.id+' on the felt');
 for(let i=0;i<g.balls.length;i++)for(let j=i+1;j<g.balls.length;j++){const a=g.balls[i],b=g.balls[j];assert.ok(Math.hypot(a.x-b.x,a.y-b.y)>=2*R,'no overlap '+a.id+'-'+b.id);}
 assert.deepEqual([cueBall(g).x,cueBall(g).y],[HEAD_SPOT.x,HEAD_SPOT.y]);
 assert.equal(g.balls.find(b=>b.id===1).x,FOOT_SPOT.x,'the 1 on the foot spot');
 assert.equal(POCKETS.length,6);assert.equal(POCKETS.filter(p=>p.side).length,2,'two side pockets');
 assert.equal((x1-x0)/(y1-y0),2,'2:1 playing surface');
 assert.match(POOL_RULES_TEXT,/REGOLE SEMPLIFICATE/);assert.match(POOL_RULES_TEXT,/Bianca in buca: −1 punto/);assert.match(POOL_RULES_TEXT,/TIRO LIBERO/);
 assert.equal(g.phase,'aim');assert.equal(g.turn,'player');assert.equal(newPoolGame({mode:'libero'}).mode,'libero');
 assert.deepEqual(rackBalls(),newPoolGame({seed:99}).balls,'the rack is always the same');
});

test('Q30 collision between two balls: momentum conserved, energy almost conserved, push along the line of centres',()=>{
 // frontale: la bianca si ferma quasi, la colpita parte quasi alla stessa velocità
 let a={x:100,y:74,vx:200,vy:0},b={x:100+2*R-.1,y:74,vx:0,vy:0};
 assert.equal(collideBalls(a,b),true);
 assert.ok(Math.abs(a.vx+b.vx-200)<1e-9&&Math.abs(a.vy+b.vy)<1e-9,'momentum');
 const k=energy(a,b)/200**2;assert.ok(k<=1&&k>.9,'energy kept within 10%: '+k.toFixed(3));
 assert.ok(b.vx>190&&a.vx>=0&&a.vx<10);
 assert.ok(Math.hypot(b.x-a.x,b.y-a.y)>=2*R-1e-9,'pushed apart');
 // obliquo: la colpita parte lungo la congiungente, le due direzioni sono quasi perpendicolari
 a={x:100,y:74,vx:200,vy:0};b={x:106,y:77,vx:0,vy:0};const nx=b.x-a.x,ny=b.y-a.y;
 collideBalls(a,b);
 assert.ok(Math.abs(a.vx+b.vx-200)<1e-9&&Math.abs(a.vy+b.vy)<1e-9,'momentum (oblique)');
 assert.ok(Math.abs(b.vx*ny-b.vy*nx)<1e-6,'struck ball leaves along the line of centres');
 assert.ok(Math.abs(a.vx*b.vx+a.vy*b.vy)/energy(a,b)<.05,'about 90 degrees apart');
 // biglie che si stanno già separando: nessun nuovo urto
 a={x:100,y:74,vx:-50,vy:0};b={x:100+2*R-.2,y:74,vx:0,vy:0};collideBalls(a,b);assert.deepEqual([a.vx,b.vx],[-50,0]);
 assert.equal(collideBalls({x:0,y:0,vx:0,vy:0},{x:10,y:0,vx:0,vy:0}),false);
 // nella fisica completa: un passo prima e uno dopo il contatto
 const g=setup(newPoolGame(),[[0,60,74],[1,120,74]]);shoot(g,0,.5);
 const cue=cueBall(g),one=g.balls[1];let before=0;
 for(let i=0;i<2000&&one.vx===0;i++){before=cue.vx;stepPool(g,POOL_RULES.step);}
 assert.ok(one.vx>0,'contact happened');
 assert.ok(Math.abs(cue.vx+one.vx-before)/before<.01,'momentum through the full step');
 assert.ok(one.vx/before>.95,'almost all the speed passes to the struck ball');
 assert.equal(g.shot.firstHit,1);
});

test('Q30 cushions: the ball bounces back with less speed and never leaves the felt',()=>{
 const g=setup(newPoolGame(),[[0,150,74],[5,40,40]]);shoot(g,0,.6);
 const cue=cueBall(g);let maxX=0,before=0,after=0;
 for(let i=0;i<3000&&g.phase==='rolling';i++){const v=cue.vx;stepPool(g,POOL_RULES.step);maxX=Math.max(maxX,cue.x);if(v>0&&cue.vx<0){before=v;after=-cue.vx;}}
 assert.ok(before>0,'it reached the cushion');
 assert.ok(after/before>.74&&after/before<.79,'cushion restitution ≈ '+POOL_RULES.cushionRestitution+': '+(after/before).toFixed(3));
 assert.ok(maxX<=x1-R+1e-9,'never past the cushion');assert.equal(cue.y,74);
 assert.notEqual(g.phase,'rolling');assert.ok(onTable(cue)&&!cue.pocketed);
 // sponda lunga lontano dalle buche
 const b={x:60,y:y0+R-1,vx:0,vy:-100,pocketed:false};
 assert.equal(railAndPocket(g,b),'sponda');assert.equal(b.y,y0+R);assert.ok(Math.abs(b.vy-100*POOL_RULES.cushionRestitution)<1e-9);
});

test('Q30 pockets: corner and side pockets swallow the ball; a ball along the cushion rolls past the side pocket',()=>{
 const roll=(list,id,vx,vy)=>{const g=setup(newPoolGame(),list);g.phase='rolling';g.shot={shooter:'player',pocketed:[],firstHit:null};
  const b=g.balls[id];b.vx=vx;b.vy=vy;runUntilRest(g);return {g,b};};
 // angolo in alto a destra
 const corner=POCKETS[2],d=Math.hypot(corner.x-150,corner.y-60);
 let {g,b}=roll([[0,40,100],[1,150,60],[2,60,60]],1,(corner.x-150)/d*220,(corner.y-60)/d*220);
 assert.equal(b.pocketed,true);assert.equal(b.pocket,2);assert.deepEqual(g.last.potted,[1]);assert.equal(g.scores.player,1);
 // buca centrale in basso, presa di fronte
 ({g,b}=roll([[0,40,100],[3,XM,90],[2,60,60]],3,0,160));
 assert.equal(b.pocketed,true);assert.equal(b.pocket,4);
 // in buca non urta più nulla e non si disegna
 assert.equal(ballsLeft(g),1);
 // biglia che scorre attaccata alla sponda lunga: passa davanti alla buca centrale e si ferma oltre, sul panno
 ({g,b}=roll([[0,40,100],[4,80,y0+R],[2,60,60]],4,speedFor(70),0));
 assert.equal(b.pocketed,false,'rolls past the side pocket');assert.ok(b.x>XM+8&&onTable(b),'stops on the felt at x='+b.x.toFixed(1));
 // biglia lenta oltre la linea della sponda, sul bordo della buca: cade
 const lip={x:x1-R+1,y:y1-8,vx:0,vy:0,pocketed:false},p5=POCKETS[5],dl=Math.hypot(lip.x-p5.x,lip.y-p5.y);
 assert.ok(dl>p5.r&&dl<p5.r+R,'on the lip, not yet over the hole');
 assert.equal(railAndPocket(setup(newPoolGame(),[[0,40,100]]),lip,0),'buca');assert.equal(lip.pocketed,true);
});

test('Q30 turns and score: pot and shoot again, miss and pass, cue ball in the pocket costs a point, empty table gives the winner',()=>{
 const pocket=POCKETS[2],straight=lineUp(190,40,pocket,30);
 // imbucata: +1 e ritiri
 let g=setup(newPoolGame(),[straight.cue,[1,190,40],[2,40,100]]);
 assert.equal(shoot(g,straight.angle,.5),true);assert.equal(shoot(g,0,1),false,'one shot at a time');
 let o=runUntilRest(g);
 assert.deepEqual(o.potted,[1]);assert.equal(o.again,true);assert.equal(g.turn,'player');assert.equal(g.scores.player,1);
 assert.equal(shotMessage(o,g),'IMBUCATA! +1 · RITIRI');assert.equal(g.potted.player[0],1);
 // tiro a vuoto: turno alla CPU
 g=setup(newPoolGame(),[[0,60,74],[1,190,40],[2,40,100]]);shoot(g,Math.PI/2,.4);o=runUntilRest(g);
 assert.deepEqual(o.potted,[]);assert.equal(g.turn,'cpu');assert.equal(o.again,false);assert.equal(g.message,'NIENTE IN BUCA · TOCCA ALLA CPU');
 // bianca in buca: −1, la bianca torna sul punto di partenza e il turno passa
 g=setup(newPoolGame(),[[0,190,40],[1,60,60],[2,40,100]]);g.scores.player=2;shoot(g,Math.atan2(pocket.y-40,pocket.x-190),.5);o=runUntilRest(g);
 assert.equal(o.foul,true);assert.equal(g.scores.player,1);assert.equal(g.turn,'cpu');
 assert.equal(cueBall(g).pocketed,false);assert.deepEqual([cueBall(g).x,cueBall(g).y],[HEAD_SPOT.x,HEAD_SPOT.y]);
 assert.match(g.message,/BIANCA IN BUCA: −1 · TOCCA ALLA CPU/);
 g.scores.cpu=0;g.turn='cpu';setup(g,[[0,190,40],[1,60,60]]);shoot(g,Math.atan2(pocket.y-40,pocket.x-190),.5);runUntilRest(g);
 assert.equal(g.scores.cpu,0,'never below zero');assert.equal(g.turn,'player');
 // ultima biglia: fine partita, vince chi ha più punti; pari possibile
 g=setup(newPoolGame(),[straight.cue,[1,190,40]]);g.scores.cpu=4;g.scores.player=3;shoot(g,straight.angle,.5);o=runUntilRest(g);
 assert.equal(o.over,true);assert.equal(g.phase,'over');assert.equal(g.winner,'pari');assert.equal(g.message,'PAREGGIO 4 A 4');
 assert.equal(shoot(g,0,1),false,'no shots after the end');
 g=setup(newPoolGame(),[straight.cue,[1,190,40]]);g.scores.cpu=2;shoot(g,straight.angle,.5);runUntilRest(g);
 assert.equal(g.winner,'cpu');assert.equal(g.message,'VINCE LA CPU 2 A 1');
 // tiro libero: sempre il tuo turno, la bianca in buca vale un tiro in più
 g=setup(newPoolGame({mode:'libero'}),[[0,190,40],[1,60,60],[2,40,100]]);shoot(g,Math.atan2(pocket.y-40,pocket.x-190),.5);o=runUntilRest(g);
 assert.equal(g.turn,'player');assert.equal(g.shots,2);assert.equal(o.foul,true);
 g=setup(newPoolGame({mode:'libero'}),[straight.cue,[1,190,40]]);shoot(g,straight.angle,.5);runUntilRest(g);
 assert.equal(g.winner,'player');assert.equal(g.message,'TAVOLO PULITO IN 1 TIRO!');
 // la bianca ricollocata evita le biglie sul punto di partenza
 g=setup(newPoolGame(),[[0,190,40],[1,HEAD_SPOT.x,HEAD_SPOT.y]]);cueBall(g).pocketed=true;respotCue(g);
 assert.ok(Math.hypot(cueBall(g).x-HEAD_SPOT.x,cueBall(g).y-HEAD_SPOT.y)>=2*R);
});

test('Q30 AI shoots: it takes the clean straight shot and pots it, avoids blocked lines, and always returns a valid shot',()=>{
 const pocket=POCKETS[2],straight=lineUp(190,40,pocket,40);
 let g=setup(newPoolGame(),[straight.cue,[1,190,40],[2,40,110]]);g.turn='cpu';
 const s=aiChooseShot(g,()=>.5,{aimError:0});
 assert.equal(s.target,1);assert.equal(s.pocket,2);assert.ok(Math.abs(s.angle-straight.angle)<.08,'aims along the line');
 assert.ok(s.power>=.12&&s.power<=1);
 shoot(g,s.angle,s.power);const o=runUntilRest(g);
 assert.deepEqual(o.potted,[1]);assert.equal(g.scores.cpu,1);assert.equal(g.turn,'cpu','the CPU shoots again after a pot');
 assert.equal(shotMessage(o,g),'LA CPU IMBUCA +1 E RITIRA');
 // linea coperta da un'altra biglia: non tenta quel tiro
 g=setup(newPoolGame(),[straight.cue,[1,190,40],[2,(straight.cue[1]+190)/2-3,(straight.cue[2]+40)/2+2]]);
 const b=aiChooseShot(g,()=>.5,{aimError:0});assert.ok(!(b.target===1&&b.pocket===2),'blocked shot avoided');
 // dal rombo iniziale e lungo una partita intera IA contro IA: tiri sempre validi, partita che finisce
 g=newPoolGame({seed:2026});const rng=makeRng(7),twin=makeRng(7);
 const first=aiChooseShot(g,rng),again=aiChooseShot(g,twin);assert.deepEqual(first,again,'seeded: same table, same shot');
 shoot(g,0,1);const brk=runUntilRest(g);assert.ok(brk&&g.phase!=='rolling','the full-power break settles');
 let n=0;
 while(g.phase!=='over'&&n<200){
  const t=aiChooseShot(g,rng);assert.ok(Number.isFinite(t.angle)&&t.power>0&&t.power<=1);
  shoot(g,t.angle,t.power);runUntilRest(g);n++;
  for(const b of g.balls)if(!b.pocketed)assert.ok(onTable(b),'ball '+b.id+' stays on the felt');
  assert.ok(isSettled(g));
 }
 assert.equal(g.phase,'over','the game ends ('+n+' shots)');assert.ok(['player','cpu','pari'].includes(g.winner));
 assert.equal(g.scores.player+g.scores.cpu<=POOL_RULES.balls,true);
});

test('Q30 light physics: fixed step, the strongest break settles quickly, roll distance model matches the simulation',()=>{
 const g=newPoolGame({seed:5});shoot(g,.01,1);let steps=0;
 while(g.phase==='rolling'&&steps<20000){stepPool(g,1/60);steps++;}
 assert.notEqual(g.phase,'rolling');assert.ok(steps/60<10,'break over in '+(steps/60).toFixed(1)+' s of game time');
 // stessa partita, stesso tiro, stesso risultato (passo fisso, niente dipendenza dagli FPS)
 const a=newPoolGame({seed:5}),b=newPoolGame({seed:5});shoot(a,.01,1);shoot(b,.01,1);
 while(a.phase==='rolling')stepPool(a,1/60);while(b.phase==='rolling')stepPool(b,1/31);
 assert.deepEqual(a.balls.map(x=>[x.pocketed,Math.round(x.x*100)]),b.balls.map(x=>[x.pocketed,Math.round(x.x*100)]),'30 FPS or 60 FPS, same table');
 // la distanza di frenata stimata (usata dall'IA) è vicina a quella simulata
 const s=setup(newPoolGame(),[[0,30,74]]);shoot(s,0,.3);runUntilRest(s);
 const sim=cueBall(s).x-30,model=rollDistance(.3*POOL_RULES.maxSpeed);
 assert.ok(Math.abs(sim-model)<3,'sim '+sim.toFixed(1)+' vs model '+model.toFixed(1));
 assert.ok(Math.abs(rollDistance(speedFor(50))-50)<.01);
});

test('Q30 results only: saved once per finished game, no money, no betting, no network',async()=>{
 const storage=memory(),save=freshPoolSave(),pocket=POCKETS[2],straight=lineUp(190,40,pocket,30);
 const g=setup(newPoolGame({seed:11}),[straight.cue,[1,190,40]]);
 assert.equal(recordResult(save,g),false,'unfinished game: nothing saved');
 shoot(g,straight.angle,.5);runUntilRest(g);assert.equal(g.winner,'player');
 assert.equal(recordResult(save,g),true);assert.equal(recordResult(save,g),false,'only once');
 writePoolSave(storage,save);const re=readPoolSave(storage);
 assert.deepEqual([re.played,re.won,re.lost,re.drawn],[1,1,0,0]);
 const copy=structuredClone(g);copy.recorded=false;assert.equal(recordResult(re,copy),false,'same game id is never counted twice');
 const free=setup(newPoolGame({mode:'libero',seed:12}),[straight.cue,[1,190,40]]);shoot(free,straight.angle,.5);runUntilRest(free);
 assert.equal(recordResult(re,free),true);assert.equal(re.freeBest,1);assert.equal(re.played,1,'free play is not a match');
 assert.match(recordText(re),/PARTITE 1 · VINTE 1 · PERSE 0 · PARI 0 · TIRO LIBERO: RECORD 1 TIRO/);
 storage.setItem(POOL_SAVE_KEY,'{rotto');assert.equal(readPoolSave(storage),null);
 storage.setItem(POOL_SAVE_KEY,JSON.stringify({version:1,played:-3,won:'x',lost:2.7,lastId:5}));
 const odd=readPoolSave(storage);assert.deepEqual([odd.played,odd.won,odd.lost,odd.lastId],[0,0,2,'']);
 const src=await readFile(new URL('./minigame-pool.mjs',import.meta.url),'utf8');
 assert.match(src,/NIENTE DENARO E NIENTE SCOMMESSE/);
 assert.doesNotMatch(src,/fetch\(|XMLHttpRequest|WebSocket|sendBeacon|€|progress\.money|paypal|stripe|credits/i);
 assert.ok(!['gta-melito-slot-v1','gta-melito-poker-v1'].includes(POOL_SAVE_KEY));
});

test('Q30 pixel art: table, balls, cue, aim guide and the whole screen draw without errors',()=>{
 const calls=[];const c=new Proxy({},{get:(t,k)=>k in t?t[k]:(...a)=>{calls.push(k);},set:(t,k,v)=>{t[k]=v;return true;}});
 drawTable(c);assert.ok(calls.filter(k=>k==='fillRect').length>500,'felt texture, rails, diamonds, pockets');
 for(const id of Object.keys(BALL_COLORS)){calls.length=0;drawBall(c,Number(id),50,50);assert.ok(calls.filter(k=>k==='fillRect').length>=15);}
 calls.length=0;drawCue(c,{x:60,y:74},0,.5);assert.ok(calls.length>=80,'a long cue');
 const ys=[];drawCue({set fillStyle(v){},fillRect:(x,y)=>ys.push(y)},{x:60,y:60},Math.PI/2,1);
 assert.ok(ys.length>10&&ys.every(y=>y>=12),'the cue never covers the score strip');
 const g=newPoolGame();const guide=aimGuide(g,0);
 assert.equal(guide.hit,1,'the guide stops on the 1 at the apex');assert.ok(Math.abs(guide.x-(FOOT_SPOT.x-2*R))<1e-6);
 assert.ok(Math.abs(guide.dir.x-1)<1e-9,'and shows where it will go');
 const wall=aimGuide(g,Math.PI/2);assert.equal(wall.hit,null);assert.ok(Math.abs(wall.y-(y1-R))<1e-9,'or stops at the cushion');
 calls.length=0;drawPoolScreen(c,{game:g,power:.4});assert.ok(calls.includes('fillText'));
 g.phase='over';g.message='HAI VINTO 5 A 4!';calls.length=0;drawPoolScreen(c,{game:g,table:{}});assert.ok(calls.includes('drawImage'));
 assert.ok(calls.filter(k=>k==='fillText').length>=3,'score strip and end-of-game box');
 const libero=newPoolGame({mode:'libero'});calls.length=0;drawPoolScreen(c,{game:libero});assert.ok(calls.includes('fillText'));
 assert.deepEqual([POOL_W,POOL_H],[224,136]);
});

// Pagina finta: ogni id esiste, rAF e orologio si fanno avanzare a mano.
function fakePage(){
 const els=new Map(),listeners=[],frames=[];let t=1000,n=0;
 const ctx=new Proxy({},{get:(o,k)=>k in o?o[k]:()=>{},set:(o,k,v)=>{o[k]=v;return true;}});
 const el=id=>{if(!els.has(id))els.set(id,{id,hidden:true,disabled:false,textContent:'',style:{},setAttribute(){},getContext:()=>ctx,focus(){},
  appendChild(){},setPointerCapture(){},getBoundingClientRect:()=>({left:0,top:0,width:POOL_W*2,height:POOL_H*2})});return els.get(id);};
 const doc={getElementById:el,createElement:()=>el('tmp'+(n++)),querySelector:()=>el('stage'),body:el('body'),
  addEventListener:(type,f)=>listeners.push({type,f}),removeEventListener:(type,f)=>{const i=listeners.findIndex(l=>l.type===type&&l.f===f);if(i>=0)listeners.splice(i,1);}};
 const fire=(type,props)=>{const e={type,repeat:false,shiftKey:false,preventDefault(){},stopImmediatePropagation(){},...props};for(const l of listeners.slice())if(l.type===type)l.f(e);};
 const advance=ms=>{for(let s=0;s<ms;s+=16){t+=16;const f=frames.shift();if(f)f();}};
 return {doc,els,listeners,frames,fire,advance,raf:f=>{frames.push(f);return frames.length;},caf:()=>{},now:()=>t};
}

test('Q30 panel: opens over the scene, mouse aim, SPACE charges and shoots, the CPU takes its turn, ESC exits once',()=>{
 const page=fakePage(),storage=memory(),exits=[];
 assert.equal(openPoolMachine({doc:null}),false,'without a page it does nothing');
 assert.equal(openPoolMachine({doc:page.doc,raf:page.raf,caf:page.caf,now:page.now,storage,seed:42,onExit:s=>exits.push(s)}),true);
 assert.equal(isPoolOpen(),true);assert.equal(page.els.get('pool-panel').hidden,false);
 assert.equal(openPoolMachine({doc:page.doc,raf:page.raf,now:page.now}),false,'one table at a time');
 const g=currentPoolGame(),cue=cueBall(g);assert.equal(g.phase,'aim');
 // mouse: si mira muovendolo sul tavolo (canvas mostrato a ×2)
 page.els.get('pool-canvas').onpointermove({pointerType:'mouse',clientX:(cue.x+10)*2,clientY:(cue.y+10)*2});
 assert.ok(Math.abs(g.aim-Math.PI/4)<1e-9,'aim follows the pointer');
 page.fire('keydown',{key:'ArrowRight'});assert.ok(Math.abs(g.aim-Math.PI/4-.0175)<1e-9,'arrows turn the cue');
 // dito: si mira toccando il tavolo
 page.els.get('pool-canvas').onpointerdown({pointerType:'touch',pointerId:3,clientX:(cue.x+40)*2,clientY:cue.y*2,preventDefault(){}});
 assert.ok(Math.abs(g.aim)<1e-9,'touch aims at the rack');
 // SPAZIO tenuto mezzo secondo: la stecca carica; al rilascio parte lo spacco
 page.fire('keydown',{key:' ',code:'Space'});page.advance(480);assert.equal(g.phase,'aim');
 assert.ok(Number.parseFloat(page.els.get('pool-power-fill').style.width)>20,'the power bar fills');
 page.fire('keyup',{key:' ',code:'Space'});assert.equal(g.phase,'rolling');assert.equal(g.shotsBy.player,1);
 for(let i=0;i<2000&&g.phase==='rolling';i++)page.advance(16);assert.notEqual(g.phase,'rolling','the break settles');
 // turno della CPU: pensa un attimo, poi tira da sola
 g.turn='cpu';g.phase='aim';page.advance(400);assert.equal(g.shotsBy.cpu,0);assert.equal(page.els.get('pool-msg').textContent,'LA CPU MIRA…');
 assert.equal(page.els.get('pool-shoot').disabled,true,'you cannot shoot for the CPU');
 page.fire('keydown',{key:' ',code:'Space'});page.fire('keyup',{key:' ',code:'Space'});assert.equal(g.shotsBy.player,1);
 page.advance(1200);assert.equal(g.shotsBy.cpu,1,'the CPU shot');
 // ESC: chiude una volta sola, partita a metà non salvata, ascoltatori tolti
 page.fire('keydown',{key:'Escape'});
 assert.equal(isPoolOpen(),false);assert.equal(page.els.get('pool-panel').hidden,true);assert.equal(exits.length,1);
 assert.equal(exits[0].abandoned,true);assert.equal(page.listeners.length,0);assert.equal(storage.getItem(POOL_SAVE_KEY),null);
 page.advance(100);closePoolMachine();assert.equal(exits.length,1);assert.equal(page.frames.length,0,'the loop stops');
});

test('Q30 panel: touch shot with TIENI E TIRA, a finished match is saved once, SPACE starts the next one, ESCI exits',()=>{
 const page=fakePage(),storage=memory(),exits=[];
 openPoolMachine({doc:page.doc,raf:page.raf,caf:page.caf,now:page.now,storage,seed:7,onExit:s=>exits.push(s)});
 const g=currentPoolGame(),pocket=POCKETS[2],straight=lineUp(190,40,pocket,30);
 setup(g,[straight.cue,[1,190,40]]);g.aim=straight.angle;
 const btn=page.els.get('pool-shoot');btn.onpointerdown({pointerId:1,preventDefault(){}});page.advance(560);btn.onpointerup({pointerId:1});
 assert.equal(g.phase,'rolling');page.advance(8000);
 assert.equal(g.phase,'over');assert.equal(g.winner,'player');
 assert.deepEqual(readPoolSave(storage).won,1);page.advance(500);assert.equal(readPoolSave(storage).played,1,'saved once');
 page.fire('keydown',{key:' ',code:'Space'});page.fire('keyup',{key:' ',code:'Space'});
 const next=currentPoolGame();assert.notEqual(next,g);assert.equal(next.phase,'aim');assert.notEqual(next.id,g.id);
 page.els.get('pool-mode').onclick();page.advance(32);assert.equal(currentPoolGame().mode,'libero');assert.equal(page.els.get('pool-mode').textContent,'CONTRO CPU');
 page.els.get('pool-exit').onclick();assert.equal(isPoolOpen(),false);assert.equal(exits.length,1);assert.equal(exits[0].won,1);
});

test('Q30 game wiring: pause under the table, radio ducked, PAUSA › STRUMENTI and ?minigioco=biliardo, hook for Q27',async()=>{
 const [game,html]=await Promise.all(['game.mjs','index.html'].map(f=>readFile(new URL('./'+f,import.meta.url),'utf8')));
 assert.match(game,/import \{openPoolMachine,isPoolOpen\} from '\.\/minigame-pool\.mjs\?v=\d+'/);
 assert.match(game,/function tick\(dt\)\{\n if\(!state\.ready\)return;\n if\(state\.mapOpen\|\|[^\n]*\|\|isPoolOpen\(\)\)\{\n  for\(const key of Object\.keys\(pressed\)\)pressed\[key\]=false;/,'the world stops under the table');
 assert.match(game,/const paused=state\.mapOpen\|\|[^\n]*\|\|isPoolOpen\(\)(?:\|\|is\w+Open\(\))*;/,'city audio quiet');
 assert.match(game,/function openPoolGame\(\)\{\n if\(isPoolOpen\(\)\|\|isSlotOpen\(\)\|\|isPokerOpen\(\)\)return false;[\s\S]{0,120}carRadio\.duck\(true\);[\s\S]{0,200}onExit:\(\)=>\{carRadio\.duck\(false\);/);
 assert.match(game,/function openSlotGame\(\)\{\n if\([^\n]*isPoolOpen\(\)\)return false;/,'never two minigames at once');
 assert.match(game,/function openPokerGame\(\)\{\n if\([^\n]*isPoolOpen\(\)\)return false;/);
 assert.match(game,/get\('minigioco'\)==='biliardo'/);assert.match(game,/else if\(POOL_FROM_URL\)openPoolGame\(\);/);
 assert.match(game,/\$\('pause-pool'\)\.addEventListener\('click',\(\)=>\{closePause\(\);openPoolGame\(\);\}\);/);
 const tools=html.slice(html.indexOf('pause-h-tools'),html.indexOf('pause-h-credits'));
 assert.match(tools,/id="pause-pool"[^>]*>PROVA BILIARDO</);assert.match(tools,/PROVA BILIARDO:[^<]*Q27/);
 assert.match(html,/#pool-canvas\{[^}]*touch-action:none/);assert.match(html,/\.slot-card\.pool-card\{/);
 assert.ok(Number((html.match(/game\.mjs\?v=(\d+)/)||[])[1])>=187);
});
