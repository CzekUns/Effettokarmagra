/* Q33 (21/10/2026): la partita di calcetto si gioca nel campo, nell'overworld. Qui: la libreria di
 * regole/IA (minigame-football.mjs, parametrica e ripetibile), la partita in campo (football-match.mjs:
 * arrivo a piedi, gol valido/non valido, cronometro, abbandono, uscita a piedi, disegno) e il cablaggio
 * in game.mjs (nessuna scena a parte, città che continua, salvataggio solo del risultato). */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {FOOTBALL_RULES as R,FOOTBALL_TEAMS,createMatch,startMatch,stepMatch,switchPlayer,classifyBallCrossing,scorerAt,matchClockLabel,matchMinute,
 matchResult,freshFootballSave,sanitizeFootballSave,recordFootballResult,footballRecordText,passSpeed,scaleRules,kickoffSpot} from './minigame-football.mjs';
import {createFieldMatch,arrivalPaths,pitchFrame,rulesForPitch,FIELD_RULES,tintedAtlas,shirtOf} from './football-match.mjs';
import {preparePitches,insidePitch,PITCHES} from './football-pitches.mjs';
import {freshProgress,readProgress,saveProgress,SAVE_KEY} from './campaign.mjs';

const read=f=>readFile(new URL('./'+f,import.meta.url),'utf8');
const HL=R.length/2,GH=R.goalWidth/2;
const run=(m,seconds,input={})=>{const n=Math.round(seconds/R.step);for(let i=0;i<n;i++)stepMatch(m,typeof input==='function'?input(m,i):i===0?input:{x:input.x,y:input.y});return m;};
const inPlay=(seed=7)=>{const m=createMatch({seed});startMatch(m);run(m,R.kickoffFreeze+.05);assert.equal(m.phase,'play');m.events.length=0;return m;};
// keep everybody far from the ball path (the keeper too) so only the lines decide
const clearField=m=>{m.players.forEach((p,k)=>{p.x=-14+(k%5)*.9;p.y=k<5?-8.5:8.5;p.vx=p.vy=0;p.stun=5;});};
const looseBall=(m,x,y,vx,vy,team=0)=>Object.assign(m.ball,{x,y,vx,vy,owner:-1,lastTouch:team,lastKicker:team*5+4,passTarget:-1,saveTried:false});
const memory=()=>{const s=new Map();return {getItem:k=>s.has(k)?s.get(k):null,setItem:(k,v)=>s.set(k,String(v))};};
const fakeCtx=calls=>new Proxy({},{get:(t,k)=>k in t?t[k]:(...a)=>{calls[k]=(calls[k]||0)+1;},set:(t,k,v)=>{t[k]=v;return true;}});

// ---- the library: rules and AI (40×20 base pitch, as before) ---------------------------------------
test('Q33 a goal is valid only when the ball goes in between the posts (library, base pitch)',()=>{
 assert.equal(classifyBallCrossing(18,0,20.5,.2).type,'goal','right in the middle');
 assert.equal(classifyBallCrossing(18,1.3,20.5,1.3).type,'goal','just inside the post');
 assert.equal(classifyBallCrossing(18,GH,20.5,GH).type,'post','on the post: no goal');
 assert.equal(classifyBallCrossing(18,3,20.5,3).type,'end','wide of the goal');
 assert.equal(classifyBallCrossing(5,9.5,6,10.4).type,'side','over the side line');
 assert.equal(classifyBallCrossing(-18,.5,-20.4,.4).type,'goal','the other goal');
 assert.equal(classifyBallCrossing(10,0,12,0),null,'still on the pitch');
 assert.equal(scorerAt(1),0,'ROSSI score in the right goal');assert.equal(scorerAt(-1),1);
 let m=inPlay();clearField(m);looseBall(m,18,.3,12,0);run(m,.5);
 assert.deepEqual(m.score,[1,0]);assert.equal(m.phase,'goal');assert.ok(m.ball.inNet);
 run(m,R.goalPause+.1);assert.equal(m.phase,'kickoff');assert.equal(m.restart.team,1,'the side that conceded kicks off');
 m=inPlay();clearField(m);looseBall(m,18,3.4,12,0);run(m,.5);
 assert.deepEqual(m.score,[0,0],'wide: not a goal');assert.equal(m.phase,'restart');
 assert.equal(m.restart.kind,'fondo');assert.equal(m.restart.team,1);assert.equal(m.restart.taker,5,'goal clearance by the BLU keeper');
 m=inPlay();clearField(m);looseBall(m,18,3.4,12,0,1);run(m,.5);
 assert.equal(m.restart.kind,'angolo','touched last by the defenders: corner');assert.equal(m.restart.team,0);
 m=inPlay();clearField(m);looseBall(m,18,GH,12,0);run(m,.3);
 assert.deepEqual(m.score,[0,0],'post: not a goal');assert.ok(m.events.some(e=>e.type==='post'));assert.ok(m.ball.x<HL,'the ball bounces back in');
 m=inPlay();clearField(m);looseBall(m,0,9,0,8);run(m,.5);
 assert.equal(m.restart.kind,'laterale');assert.equal(m.restart.team,1,'kick-in to the other side');
 let w8=0;while(m.phase==='restart'&&w8<60*(R.restartMax+1)){stepMatch(m,{});w8++;}
 assert.equal(m.phase,'play','the taker walked to the ball and played it in '+(w8/60).toFixed(1)+' s');assert.equal(m.ball.lastTouch,1,'restart taken by BLU');
});

test('Q33 timer: two minutes of play on an accelerated clock (40\'), final whistle and result once',()=>{
 const m=createMatch({seed:3});
 assert.equal(m.phase,'intro');stepMatch(m,{x:1});assert.equal(m.time,0,'nothing moves before the kick-off');
 startMatch(m);let steps=0,ends=0;
 const step=input=>{stepMatch(m,input);ends+=m.events.filter(e=>e.type==='end').length;m.events.length=0;steps++;};
 while(steps*R.step<R.kickoffFreeze*.9)step({});
 assert.equal(m.time,0,'the clock stops during the kick-off pause');
 while(steps*R.step<31.2)step({});
 assert.ok(m.time>20&&m.time<=30.01+1e-9,'the clock runs with play (and stops during goal pauses): '+m.time.toFixed(2));
 const at=createMatch({seed:1});at.time=60;assert.equal(matchClockLabel(at),'20\'');at.time=3;assert.equal(matchMinute(at),1,'×20: 3 s are 1 minute');
 while(m.phase!=='end'&&steps<60*400)step({});
 assert.equal(m.phase,'end');assert.equal(m.time,R.realSeconds);assert.equal(matchClockLabel(m),'40\'');
 assert.equal(ends,1,'one final whistle');
 assert.ok(steps*R.step>=R.realSeconds+R.kickoffFreeze,'real time = play time + pauses: '+(steps*R.step).toFixed(1)+' s');
 assert.ok(steps*R.step<R.realSeconds+90,'and still a short match');
 const r=matchResult(m);assert.equal(r.outcome,m.score[0]>m.score[1]?'vittoria':m.score[0]===m.score[1]?'pareggio':'sconfitta');
 assert.deepEqual(m.result,r);
 const frozen=JSON.stringify(m.players.map(p=>[p.x,p.y]));run(m,2,{x:1});
 assert.equal(JSON.stringify(m.players.map(p=>[p.x,p.y])),frozen,'after the whistle nothing moves');
});

test('Q33 pass, shot (held = harder) and AI; the protagonist is external: never moved by the simulation',()=>{
 const m=inPlay();assert.equal(m.ball.owner,4,'the pivot kicks off with the ball');
 stepMatch(m,{x:-.63,y:-.78,pass:true});
 const pass=m.events.find(e=>e.type==='pass');assert.ok(pass,'a pass');assert.equal(pass.target,2,'towards the wing he looks at');
 const sp=Math.hypot(m.ball.vx,m.ball.vy);assert.ok(sp>=R.passMin&&sp<=R.passMax,'pass speed '+sp);
 let t=0;while(m.ball.owner!==2&&t<180){stepMatch(m,{});t++;}
 assert.equal(m.ball.owner,2,'received in '+(t/60).toFixed(2)+' s');
 assert.ok(passSpeed(20)>passSpeed(5),'longer passes are kicked harder');
 // shot from the edge of the area with the BLU keeper out of the way: held = full power, tapped = weaker
 const shoot=power=>{const s=inPlay(),me=s.players[s.active];for(const p of s.players)if(p!==me){p.x=-15;p.y=p.team?8:-8;p.stun=5;}
  me.x=12;me.y=.5;me.fx=1;me.fy=0;s.ball.owner=me.i;stepMatch(s,{x:1,y:0,shoot:true,power});return s;};
 const full=shoot(1),soft=shoot(0);
 assert.ok(full.events.some(e=>e.type==='shot'));assert.ok(Math.hypot(full.ball.vx,full.ball.vy)>=R.shotSpeed-.5,'held: full power');
 assert.ok(Math.hypot(soft.ball.vx,soft.ball.vy)<Math.hypot(full.ball.vx,full.ball.vy)*.7,'tapped: softer');
 run(full,1);assert.deepEqual(full.score,[1,0],'and it goes in between the posts');
 const w=inPlay(),me2=w.players[w.active];for(const p of w.players)if(p!==me2){p.x=-15;p.y=p.team?8:-8;p.stun=5;}
 me2.x=12;me2.y=6;w.ball.owner=me2.i;stepMatch(w,{x:0,y:1,shoot:true});run(w,.6);
 assert.deepEqual(w.score,[0,0]);assert.equal(w.restart?.kind,'laterale','looking away from the goal: out');
 // AI: opponents attack and score against an idle side, keepers work, same seed = same match
 const a=inPlay(11),start=a.players.map(p=>({x:p.x,y:p.y}));run(a,4,{});
 const moved=i=>Math.hypot(a.players[i].x-start[i].x,a.players[i].y-start[i].y);
 for(const i of [6,7,8,9])assert.ok(moved(i)>1,'BLU '+i+' moves');
 const idle=createMatch({seed:11});startMatch(idle);const ev={};
 for(let i=0;i<60*400&&idle.phase!=='end';i++){stepMatch(idle,{});for(const e of idle.events)ev[e.type+'/'+(e.team??'')]=(ev[e.type+'/'+(e.team??'')]||0)+1;idle.events.length=0;}
 assert.ok((ev['shot/1']||0)>=5,'BLU shoot: '+JSON.stringify(ev));assert.ok(idle.score[1]>idle.score[0],'an idle player loses');
 const b1=createMatch({seed:5}),b2=createMatch({seed:5}),b3=createMatch({seed:6});for(const x of [b1,b2,b3]){startMatch(x);run(x,20,{});}
 assert.deepEqual(b1.players.map(p=>[p.x,p.y]),b2.players.map(p=>[p.x,p.y]));assert.notDeepEqual(b1.players.map(p=>[p.x,p.y]),b3.players.map(p=>[p.x,p.y]));
 // external protagonist (index 4): the pose comes from the game, the simulation never moves him, no switching
 const x=createMatch({seed:2,external:4});assert.equal(x.active,4);assert.equal(x.lockActive,true);
 startMatch(x);run(x,R.kickoffFreeze+.1,()=>({pose:{x:3,y:-2,vx:0,vy:0,fx:1,fy:0}}));
 assert.equal(x.phase,'play');assert.notEqual(x.restart,undefined);
 assert.deepEqual([x.players[4].x,x.players[4].y],[3,-2],'where the game put him');
 run(x,3,()=>({pose:{x:3,y:-2,vx:0,vy:0,fx:1,fy:0},x:1,y:1,switch:true}));
 assert.deepEqual([x.players[4].x,x.players[4].y],[3,-2],'still there: stick and overlaps never move the external player');
 assert.equal(switchPlayer(x),4,'Q does nothing: you control only yourself');assert.equal(x.active,4);
 assert.ok(!x.events.some(e=>e.type==='switch'));
 // scaled rules: lengths and speeds grow with k, times do not
 const big=scaleRules(2.5,{length:102,width:58});
 assert.equal(big.length,102);assert.equal(big.shotSpeed,R.shotSpeed*2.5);assert.equal(big.realSeconds,R.realSeconds);
 const bm=createMatch({seed:1,rules:big});assert.equal(bm.k,102/40);
 const gk=kickoffSpot(bm,bm.players[0]);assert.ok(gk.x<-45&&gk.x>-51,'keeper on his line of the big pitch: '+gk.x);
});

test('Q33 campaign save: only wins, draws and losses, once per match',()=>{
 const p=freshProgress();assert.deepEqual(p.football,freshFootballSave());
 assert.equal(recordFootballResult(p,{id:'m1',outcome:'vittoria',home:3,away:1}),true);
 assert.equal(recordFootballResult(p,{id:'m1',outcome:'vittoria',home:3,away:1}),false,'same match again: no duplicate');
 assert.equal(recordFootballResult(p,{id:'m2',outcome:'pareggio'}),true);
 assert.equal(recordFootballResult(p,{id:'m3',outcome:'sconfitta'}),true);
 assert.equal(recordFootballResult(p,{id:'m4',outcome:'abbandonata'}),false,'an abandoned match is not saved');
 assert.equal(recordFootballResult(p,null),false);
 assert.deepEqual({won:p.football.won,drawn:p.football.drawn,lost:p.football.lost},{won:1,drawn:1,lost:1});
 assert.equal(footballRecordText(p.football),'V 1 · P 1 · S 1');
 assert.deepEqual(Object.keys(p.football).sort(),['drawn','ids','lost','won'],'nothing else of the match is stored');
 const store=memory();assert.equal(saveProgress(store,p),true);
 const again=readProgress(store);assert.deepEqual(again.football,p.football,'survives a reload');
 assert.equal(recordFootballResult(again,{id:'m2',outcome:'pareggio'}),false,'still no duplicate after the reload');
 store.setItem(SAVE_KEY,JSON.stringify({...p,football:{won:-3,drawn:2.5,lost:'x',ids:[7,'ok'],score:[9,9]}}));
 assert.deepEqual(readProgress(store).football,{won:0,drawn:0,lost:0,ids:['ok']},'tampered entries cleaned');
 store.setItem(SAVE_KEY,JSON.stringify({...p,football:undefined}));
 assert.deepEqual(readProgress(store).football,freshFootballSave(),'saves from before Q33 still load');
 assert.equal(sanitizeFootballSave({won:1,ids:Array.from({length:40},(_,i)=>'id'+i)}).ids.length,20,'a short list of ids is enough');
});

// ---- the match in the field ------------------------------------------------------------------------
// a test block: open ground 100…300 × 150…450, the street north of it; the big pitch in the middle
const pitchDef={id:'prova',nome:'Campo di prova',kind:'calcetto',partita:true,cx:200,cy:300,w:58,h:102,a:0,porta:8,profondita:2.6,area:14,centro:7};
const walkable=(x,y)=>x>100&&x<300&&y>150&&y<450;
const world=preparePitches([pitchDef],{walkable,nearStreet:(x,y)=>y<160});
const pitch=world.list[0];
const view=[120,220,280,380];                      // what the camera shows (the pitch and a little around)
const DT=1/60;
const toWorld=(u,v)=>({x:pitch.cx-v,y:pitch.cy+u});

test('Q33 field: coordinates, rules at world scale, arrival paths from outside the view',()=>{
 const f=pitchFrame(pitch);
 assert.equal(f.long,false,'the big pitch runs along y');
 assert.deepEqual(f.toLocal(pitch.cx,pitch.cy+51),{u:51,v:0},'+u is the south end');
 const back=f.toWorld(10,-7);assert.deepEqual(f.toLocal(back.x,back.y),{u:10,v:-7},'round trip');
 const vv=f.vecWorld(1,0),vl=f.vecLocal(vv.x,vv.y);assert.deepEqual([vl.u,vl.v],[1,0]);
 const rules=rulesForPitch(pitch);
 assert.equal(rules.length,102);assert.equal(rules.width,58);assert.equal(rules.goalWidth,8);assert.equal(rules.goalDepth,2.6);
 assert.equal(rules.userSpeed,13,'the protagonist runs at the game speed');assert.ok(rules.aiSpeed<=13,'the AI is not faster than a running player');
 assert.ok(rules.shotSpeed>rules.passMax&&rules.passMax>rules.userSpeed,'shot > pass > run');
 assert.equal(rules.realSeconds,120,'still a 2-minute match');
 const paths=arrivalPaths(pitch.gate,{walkable,view});
 assert.ok(paths.length>=2&&paths.length<=FIELD_RULES.groups,'several arrival points: '+paths.length);
 for(const path of paths){
  const first=path[0],last=path[path.length-1];
  assert.ok(first.x<view[0]-FIELD_RULES.offscreen||first.x>view[2]+FIELD_RULES.offscreen||first.y<view[1]-FIELD_RULES.offscreen||first.y>view[3]+FIELD_RULES.offscreen,'starts out of view');
  assert.deepEqual([last.x,last.y],[pitch.gate.x,pitch.gate.y],'ends at the gate');
  for(const q of path.slice(0,-1))assert.ok(walkable(q.x,q.y),'every step on walkable ground');
  for(let i=1;i<path.length;i++)assert.ok(Math.hypot(path[i].x-path[i-1].x,path[i].y-path[i-1].y)<=FIELD_RULES.cell*1.5+2,'consecutive steps');
 }
 assert.equal(arrivalPaths(pitch.gate,{walkable:()=>false,view}).length,0,'no ground: no paths');
 const noView=arrivalPaths(pitch.gate,{walkable});assert.ok(noView.length>=1,'without a view the farthest points are used');
});

test('Q33 field: E · GIOCA, nine players walk in from out of view through the gate, line up, whistle',()=>{
 let results=0;
 const S=createFieldMatch({pitch,seed:7,walkable,view,player:{x:200,y:300,a:0},onResult:()=>results++});
 assert.ok(S);assert.equal(S.phase,'arrivo');assert.equal(S.walkers.length,FIELD_RULES.players,'4 team-mates + 5 opponents');
 assert.equal(S.walkers.filter(w=>w.team===0).length,4);assert.equal(S.walkers.filter(w=>w.role==='gk').length,2,'both keepers');
 for(const w of S.walkers){
  assert.ok(!insidePitch(pitch,w.x,w.y,2),'spawns outside the fence');
  assert.ok(w.x<view[0]-FIELD_RULES.offscreen||w.x>view[2]+FIELD_RULES.offscreen||w.y<view[1]-FIELD_RULES.offscreen||w.y>view[3]+FIELD_RULES.offscreen,'and out of view: no pop-in');
 }
 assert.match(S.hudText(),/ARRIVANO I GIOCATORI 0\/9/);
 const player={x:200,y:300,a:0,car:-1};
 let k=0,throughGate=0,maxStep=0;
 while(S.phase==='arrivo'&&k<60*60){
  S.step(DT,{player,view});k++;
  for(const w of S.walkers){
   if(Math.hypot(w.x-pitch.gate.x,w.y-pitch.gate.y)<1.6)throughGate=Math.max(throughGate,1);
   maxStep=Math.max(maxStep,Math.hypot(w.x-(w.px??w.x),w.y-(w.py??w.y)));w.px=w.x;w.py=w.y;
  }
 }
 assert.equal(S.phase,'gioco','whistle: the match is on');
 assert.ok(k/60>3&&k/60<FIELD_RULES.arriveTimeout,'they took '+(k/60).toFixed(1)+' s to walk in');
 assert.ok(maxStep<=FIELD_RULES.walkSpeed[1]*DT+1e-6,'nobody jumps: max step '+maxStep.toFixed(2));
 assert.equal(throughGate,1,'they came through the gate');
 for(const w of S.walkers)assert.ok(insidePitch(pitch,w.x,w.y,0),'everybody on the field');
 const m=S.match;assert.equal(m.phase,'kickoff');assert.equal(m.external,4);
 assert.ok(S.cameraBias(200,300)<1&&S.cameraBias(20,20)===1,'light zoom-out only on the field');
 assert.equal(S.cameraBias(200,300),FIELD_RULES.zoomOut);
 assert.equal(results,0);
});

test('Q33 field: the protagonist is where the game puts him; goal between the posts counts, wide does not',()=>{
 const S=createFieldMatch({pitch,seed:5,walkable,view,player:{x:200,y:300,a:0}});
 const player={x:200,y:300,a:0,car:-1};
 for(let k=0;k<60*60&&S.phase==='arrivo';k++)S.step(DT,{player,view});
 const m=S.match;
 for(let k=0;k<60*5&&m.phase!=='play';k++)S.step(DT,{player,view});
 assert.equal(m.phase,'play');
 // move the protagonist in the world: the simulation sees him in local coordinates
 player.x=pitch.cx-7;player.y=pitch.cy+10;S.step(DT,{player,view});
 assert.ok(Math.abs(m.players[4].x-10)<1e-9&&Math.abs(m.players[4].y-7)<1e-9,'local pose u=10, v=7');
 // a loose ball rolling into the BLU goal (south end, +u)
 const freeze=()=>{for(const p of m.players){if(p.i===4)continue;p.x=-30+(p.i%5)*4;p.y=p.team?20:-20;p.vx=p.vy=0;p.stun=9;}};
 freeze();Object.assign(m.ball,{x:45,y:1,vx:30,vy:0,owner:-1,lastTouch:0,lastKicker:4,passTarget:-1,saveTried:false});
 for(let k=0;k<60;k++)S.step(DT,{player,view});
 assert.deepEqual(m.score,[1,0],'goal for ROSSI');assert.match(S.hudText(),/ROSSI 1 – 0 BLU/);
 assert.ok(S.events.some(e=>e.type==='goal'));
 const q=toWorld(m.ball.x,m.ball.y);assert.ok(q.y>pitch.cy+51,'the ball sits in the net, south of the end line');
 // after the goal nobody is teleported: the players walk back to the kick-off spots
 const before=m.players.filter(p=>p.i!==4).map(p=>[p.x,p.y]);
 let jump=0;
 for(let k=0;k<60*8&&m.phase!=='play';k++){S.step(DT,{player,view});m.players.filter(p=>p.i!==4).forEach((p,i)=>{jump=Math.max(jump,Math.hypot(p.x-before[i][0],p.y-before[i][1]));before[i]=[p.x,p.y];});}
 assert.equal(m.phase,'play','BLU kicked off again');
 assert.ok(jump<rulesForPitch(pitch).aiSpeed*DT*2+.5,'no teleport after the goal: max step '+jump.toFixed(2));
 // wide: no goal, goal clearance for BLU
 freeze();Object.assign(m.ball,{x:45,y:12,vx:30,vy:0,owner:-1,lastTouch:0,lastKicker:4,passTarget:-1,saveTried:false});
 for(let k=0;k<60;k++)S.step(DT,{player,view});
 assert.deepEqual(m.score,[1,0]);assert.equal(m.restart?.kind,'fondo');assert.equal(m.restart.team,1);
 // the protagonist walks out over the side line with the ball at his feet: ball out, kick-in to BLU
 for(let k=0;k<60*8&&m.phase!=='play';k++)S.step(DT,{player,view});
 freeze();m.ball.owner=4;player.x=pitch.cx-20;player.y=pitch.cy;player.a=Math.PI;S.step(DT,{player,view});
 assert.equal(m.ball.owner,4);assert.ok(S.hasBall());
 player.x=pitch.cx+30.5;S.step(DT,{player,view});          // v = −30.5, beyond the 29 of the lines
 assert.equal(m.ball.owner,-1);assert.equal(m.restart?.kind,'laterale');assert.equal(m.restart.team,1,'kick-in to BLU');
});

test('Q33 field: kick held = harder, pass to a team-mate, touch/keys through press/release',()=>{
 const S=createFieldMatch({pitch,seed:8,walkable,view,player:{x:200,y:300,a:0}});
 const player={x:200,y:300,a:0,car:-1};
 for(let k=0;k<60*60&&S.phase==='arrivo';k++)S.step(DT,{player,view});
 const m=S.match;
 for(let k=0;k<60*5&&m.phase!=='play';k++)S.step(DT,{player,view});
 const park=()=>{for(const p of m.players){if(p.i===4)continue;p.x=-40;p.y=p.team?20:-20;p.vx=p.vy=0;p.stun=20;}};
 const setup=()=>{park();player.x=pitch.cx;player.y=pitch.cy+20;player.a=Math.PI/2;S.step(DT,{player,view});m.ball.owner=4;S.step(DT,{player,view});};
 setup();assert.equal(S.press('kick'),true);assert.ok(S.charging,'charging while held');
 for(let k=0;k<60*FIELD_RULES.chargeSeconds+2;k++)S.step(DT,{player,view});
 assert.equal(S.chargeLevel(),1);S.release('kick');S.step(DT,{player,view});
 const hard=Math.hypot(m.ball.vx,m.ball.vy);assert.ok(hard>=rulesForPitch(pitch).shotSpeed-1,'full power: '+hard.toFixed(1));
 assert.ok(m.ball.vx>0,'towards the BLU goal (facing +u)');
 for(let k=0;k<60*8&&m.phase!=='play';k++)S.step(DT,{player,view});
 setup();S.press('kick');S.step(DT,{player,view});S.release('kick');S.step(DT,{player,view});
 const soft=Math.hypot(m.ball.vx,m.ball.vy);assert.ok(soft<hard*.7,'tapped: softer '+soft.toFixed(1));
 for(let k=0;k<60*8&&m.phase!=='play';k++)S.step(DT,{player,view});
 // pass: the nearest team-mate ahead gets it
 setup();const mate=m.players[2];mate.x=m.players[4].x+15;mate.y=m.players[4].y;mate.stun=0;
 S.press('pass');S.step(DT,{player,view});
 assert.ok(S.events.some(e=>e.type==='pass'&&e.target===2),'pass to the wing in front');
 let t=0;while(m.ball.owner!==2&&t<240){S.step(DT,{player,view});t++;}
 assert.equal(m.ball.owner,2,'received');
 assert.equal(S.press('pass'),true,'without the ball: a tackle attempt');
 assert.match(S.prompt(),/CONTRASTO/);
 assert.equal(S.press('nothing'),false);
});

test('Q33 field: final whistle saves once, players leave on foot and vanish out of view; abandon after 5 s outside',()=>{
 const progress=freshProgress();let results=0;
 const S=createFieldMatch({pitch,seed:4,walkable,view,player:{x:200,y:300,a:0},onResult:r=>{recordFootballResult(progress,r);recordFootballResult(progress,r);results++;}});
 const player={x:200,y:300,a:0,car:-1};
 for(let k=0;k<60*60&&S.phase==='arrivo';k++)S.step(DT,{player,view});
 const m=S.match;
 for(let k=0;k<60*5&&m.phase!=='play';k++)S.step(DT,{player,view});
 m.time=m.rules.realSeconds-.5;
 for(let k=0;k<60*3&&S.phase==='gioco';k++)S.step(DT,{player,view});
 assert.equal(S.phase,'fine');assert.equal(results,1,'onResult once');
 assert.equal(progress.football.won+progress.football.drawn+progress.football.lost,1,'one result in the record');
 assert.match(S.hudText(),/FISCHIO FINALE/);assert.ok(S.result);assert.equal(S.abandoned,false);
 for(let k=0;k<60*(FIELD_RULES.endSeconds+.5)&&S.phase==='fine';k++)S.step(DT,{player,view});
 assert.equal(S.phase,'uscita','then they go');
 let k=0,maxStep=0;const prev=S.walkers.map(w=>[w.x,w.y]);
 while(!S.done()&&k<60*90){S.step(DT,{player,view});S.walkers.forEach((w,i)=>{if(!w.gone){maxStep=Math.max(maxStep,Math.hypot(w.x-prev[i][0],w.y-prev[i][1]));prev[i]=[w.x,w.y];}});k++;}
 assert.ok(S.done(),'all gone in '+(k/60).toFixed(1)+' s');
 assert.ok(maxStep<=FIELD_RULES.walkSpeed[1]*DT+1e-6,'they walk out, no jumps');
 assert.equal(results,1,'still one result');
 // abandon: out of the fence for more than 5 s (no result, no record)
 const A=createFieldMatch({pitch,seed:9,walkable,view,player:{x:200,y:300,a:0},onResult:()=>results++});
 for(let i=0;i<60*60&&A.phase==='arrivo';i++)A.step(DT,{player,view});
 assert.equal(A.phase,'gioco');
 const out={x:50,y:50,a:0,car:-1};let n=0;
 while(A.phase==='gioco'&&n<60*20){A.step(DT,{player:out,view});n++;}
 assert.ok(Math.abs(n/60-FIELD_RULES.abandonSeconds)<.2,'abandoned after '+(n/60).toFixed(1)+' s');
 assert.equal(A.phase,'uscita');assert.equal(A.abandoned,true);assert.equal(A.result,null);assert.match(A.hudText(),/ABBANDONATA/);
 for(let i=0;i<60*90&&!A.done();i++)A.step(DT,{player:out,view});
 assert.ok(A.done());assert.equal(results,1,'nothing recorded for the abandoned match');
 // out and back in within 5 s: nothing happens
 const B=createFieldMatch({pitch,seed:9,walkable,view,player:{x:200,y:300,a:0}});
 for(let i=0;i<60*60&&B.phase==='arrivo';i++)B.step(DT,{player,view});
 for(let i=0;i<60*3;i++)B.step(DT,{player:out,view});
 for(let i=0;i<60*3;i++)B.step(DT,{player,view});
 assert.equal(B.phase,'gioco','a short step outside is fine');
 // in a car: abandoned at once (the match is on foot)
 B.step(DT,{player:{...player,car:2},view});assert.equal(B.phase,'uscita');
});

test('Q33 field: drawing without errors (fake canvas), two shirt colours and keeper shirts',()=>{
 const S=createFieldMatch({pitch,seed:3,walkable,view,player:{x:200,y:300,a:0},doc:null});
 const player={x:200,y:300,a:0,car:-1};
 for(let k=0;k<60*4;k++)S.step(DT,{player,view});
 const calls={};const ctx=fakeCtx(calls);
 S.drawPeople(ctx,1.5,[0,0,500,500]);assert.ok(calls.fillRect>=9*4,'nine fallback figures');
 for(let k=0;k<60*60&&S.phase==='arrivo';k++)S.step(DT,{player,view});
 const c2={};S.drawBall(fakeCtx(c2),2,player);assert.ok(c2.arc>=1&&c2.ellipse>=1,'ball and shadow');
 S.press('kick');S.match.ball.owner=4;S.press('kick');const c3={};S.drawBall(fakeCtx(c3),2.5,player);assert.ok(c3.fillRect>=2,'charge bar');
 assert.equal(tintedAtlas('#d33b33',null),null,'no atlas in Node: fallback figures');
 assert.notEqual(shirtOf(0,'pivot'),shirtOf(1,'pivot'));assert.notEqual(shirtOf(0,'gk'),shirtOf(0,'pivot'));
 assert.equal(FOOTBALL_TEAMS.length,2);
 const none={};S.drawPeople(fakeCtx(none),1,[900,900,950,950]);assert.equal(Object.keys(none).length,0,'out of view: no work');
});

test('Q33 game wiring: no separate scene, the city keeps running, E inside the lines, kick/pass keys and touch, versions',async()=>{
 const [game,html,campaign,novita,md,pitches]=await Promise.all([read('game.mjs'),read('index.html'),read('campaign.mjs'),read('novita.mjs'),read('NOVITA_DA_APPROVARE.md'),read('football-pitches.mjs')]);
 assert.match(game,/import \{recordFootballResult,footballRecordText\} from '\.\/minigame-football\.mjs\?v=003'/);
 assert.match(game,/import \{createFieldMatch\} from '\.\/football-match\.mjs\?v=\d+'/);
 assert.doesNotMatch(game,/openFootballGame|isFootballOpen|footballReturnPoint|football-panel/,'the full-screen scene is gone');
 assert.doesNotMatch(html,/\.football\{position:fixed|fb-stick|fb-canvas/,'no full-screen CSS left');
 assert.match(game,/const pitch=pitchHotspot\(state\.pitches,p\.x,p\.y\);\n  if\(pitch\)\{openFootballMatch\(pitch\);return;\}/,'E inside the lines');
 assert.match(game,/function openFootballMatch\(pitch\)\{[\s\S]*?state\.football=createFieldMatch\(\{pitch,walkable:canStand,view:visibleBounds\(\)/,'the match lives in the world');
 assert.match(game,/recordFootballResult\(state\.progress,result\)\)\{saveProgress\(localStorage,state\.progress\)/,'result saved at once');
 assert.match(game,/function stepFootball\(dt\)\{/);assert.match(game,/ stepFootball\(dt\);\n updateTraffic\(dt\);/,'stepped with the city, which goes on');
 assert.match(game,/if\(state\.football\)state\.zoomTarget=targetCameraZoom\(movement,state\.zoomBias\*state\.football\.cameraBias\(p\.x,p\.y\)\);/,'light zoom-out on the field');
 assert.match(game,/state\.football\.drawPeople\(c,state\.clock,\[x0,y0,x1,y1\]\);\n drawPlayer\(\);\n if\(state\.football\)state\.football\.drawBall\(/,'players under, ball over the protagonist');
 assert.match(game,/if\(state\.football\?\.playing\(\)\)return;/,'E is not the vehicle toggle during the match');
 assert.match(game,/state\.football\.press\('kick'\);return;\}/);assert.match(game,/state\.football\.press\('pass'\);return;\}/);
 assert.match(game,/state\.football\)state\.football\.release\('kick'\)/,'keyup = kick');
 assert.match(game,/\$\('football-shoot'\)\.addEventListener\('pointerdown'/,'touch: hold the shoot button');
 assert.match(game,/\$\('football-pass'\)\.addEventListener\('pointerdown'/);
 assert.match(html,/<button id="football-pass"[^>]*>PASSA<\/button>/);assert.match(html,/<button id="football-shoot"[^>]*>TIRO<\/button>/);assert.match(html,/\.controls\.football #action,\.controls\.football #sprint\{visibility:hidden\}/);
 assert.match(game,/pitchNear\?'GIOCA'/);assert.match(game,/PARTITA NEL CAMPO GRANDE DI VIA DELLE PALME/);assert.match(game,/if\(kickLabel\)\$\('action'\)\.textContent=kickLabel;/);assert.match(game,/if\(football\)boardPrompt\(football\.prompt\(\)\);/);
 assert.match(game,/from '\.\/campaign\.mjs\?v=005'/);assert.match(campaign,/from '\.\/minigame-football\.mjs\?v=003'/);
 assert.match(game,/from '\.\/football-pitches\.mjs\?v=002'/);assert.match(game,/from '\.\/novita\.mjs\?v=020'/);
 assert.ok(Number((html.match(/game\.mjs\?v=(\d+)/)||[])[1])>=197);
 assert.match(novita,/id:'calcetto'[\s\S]*?filter\(p=>p\.partita\)/);assert.match(md,/\| `calcetto` \|[^\n]*campo grande/);
 assert.match(pitches,/id:'palme-campo',nome:'Campo di Via delle Palme',kind:'calcetto',partita:true/);
 // one cache version per module across the game
 const files=await Promise.all(['game.mjs','campaign.mjs','football-match.mjs','football-pitches.mjs','minigame-football.mjs'].map(read));
 const seen=new Map();
 for(const src of files)for(const m of src.matchAll(/from '\.\/([\w-]+\.mjs)\?v=(\d+)'/g)){const v=seen.get(m[1]);assert.ok(!v||v===m[2],m[1]+' imported with two versions');seen.set(m[1],m[2]);}
});
