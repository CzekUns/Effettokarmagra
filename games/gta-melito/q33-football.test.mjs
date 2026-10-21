import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {FOOTBALL_RULES as R,FOOTBALL_TEAMS,createMatch,startMatch,stepMatch,switchPlayer,classifyBallCrossing,scorerAt,matchClockLabel,matchMinute,
 matchResult,freshFootballSave,sanitizeFootballSave,recordFootballResult,footballRecordText,passSpeed} from './minigame-football.mjs';
import {freshProgress,readProgress,saveProgress,SAVE_KEY} from './campaign.mjs';

const read=f=>readFile(new URL('./'+f,import.meta.url),'utf8');
const HL=R.length/2,GH=R.goalWidth/2;
const run=(m,seconds,input={})=>{const n=Math.round(seconds/R.step);for(let i=0;i<n;i++)stepMatch(m,typeof input==='function'?input(m,i):i===0?input:{x:input.x,y:input.y});return m;};
const inPlay=(seed=7)=>{const m=createMatch({seed});startMatch(m);run(m,R.kickoffFreeze+.05);assert.equal(m.phase,'play');m.events.length=0;return m;};
// keep everybody far from the ball path (the keeper too) so only the lines decide
const clearField=m=>{m.players.forEach((p,k)=>{p.x=-14+(k%5)*.9;p.y=k<5?-8.5:8.5;p.vx=p.vy=0;p.stun=5;});};
const looseBall=(m,x,y,vx,vy,team=0)=>Object.assign(m.ball,{x,y,vx,vy,owner:-1,lastTouch:team,lastKicker:team*5+4,passTarget:-1,saveTried:false});
const memory=()=>{const s=new Map();return {getItem:k=>s.has(k)?s.get(k):null,setItem:(k,v)=>s.set(k,String(v))};};

test('Q33 a goal is valid only when the ball goes in between the posts',()=>{
 assert.equal(classifyBallCrossing(18,0,20.5,.2).type,'goal','right in the middle');
 assert.equal(classifyBallCrossing(18,1.3,20.5,1.3).type,'goal','just inside the post');
 assert.equal(classifyBallCrossing(18,GH,20.5,GH).type,'post','on the post: no goal');
 assert.equal(classifyBallCrossing(18,3,20.5,3).type,'end','wide of the goal');
 assert.equal(classifyBallCrossing(5,9.5,6,10.4).type,'side','over the side line');
 assert.equal(classifyBallCrossing(-18,.5,-20.4,.4).type,'goal','the other goal');
 assert.equal(classifyBallCrossing(10,0,12,0),null,'still on the pitch');
 assert.equal(scorerAt(1),0,'ROSSI score in the right goal');assert.equal(scorerAt(-1),1);
 // in a match: in, wide, post and side
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
 run(m,R.restartFreeze+.1);assert.equal(m.phase,'play');assert.equal(m.ball.lastTouch,1,'restart taken by BLU');
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
 assert.ok(steps*R.step<R.realSeconds+60,'and still a short match');
 const r=matchResult(m);assert.equal(r.outcome,m.score[0]>m.score[1]?'vittoria':m.score[0]===m.score[1]?'pareggio':'sconfitta');
 assert.deepEqual(m.result,r);
 const frozen=JSON.stringify(m.players.map(p=>[p.x,p.y]));run(m,2,{x:1});
 assert.equal(JSON.stringify(m.players.map(p=>[p.x,p.y])),frozen,'after the whistle nothing moves');
});

test('Q33 switch player: the team-mate nearest the ball, never the keeper; the one with the ball stays',()=>{
 const m=inPlay();
 Object.assign(m.ball,{owner:-1,x:-8,y:-5,vx:0,vy:0});
 const expect=[1,2,3].sort((a,b)=>Math.hypot(m.players[a].x+8,m.players[a].y+5)-Math.hypot(m.players[b].x+8,m.players[b].y+5))[0];
 assert.equal(switchPlayer(m),expect);assert.notEqual(m.active,0,'not the keeper');
 const before=m.active;stepMatch(m,{switch:true});
 assert.notEqual(m.active,before,'Q / CAMBIO through the input');assert.ok(m.events.some(e=>e.type==='switch'));
 m.ball.owner=m.active;assert.equal(switchPlayer(m),m.active,'with the ball you stay in control');
 // the user's player moves only with the stick
 const q=inPlay(),me=q.players[q.active];Object.assign(q.ball,{owner:-1,x:-15,y:8,vx:0,vy:0});const x0=me.x;run(q,.5,{x:0,y:0});
 assert.ok(Math.abs(me.x-x0)<.05,'idle stick: the controlled player stands');
 run(q,.5,{x:0,y:1});assert.ok(me.y>1.5,'stick down: he runs down');
});

test('Q33 pass and shot: the pass finds the team-mate (who becomes yours), the shot is hard and goes in',()=>{
 const m=inPlay();assert.equal(m.ball.owner,4,'the pivot kicks off with the ball');
 stepMatch(m,{x:-.63,y:-.78,pass:true});
 const pass=m.events.find(e=>e.type==='pass');assert.ok(pass,'a pass');assert.equal(pass.target,2,'towards the wing he looks at');
 assert.equal(m.active,2,'the receiver becomes the controlled player');
 const sp=Math.hypot(m.ball.vx,m.ball.vy);assert.ok(sp>=R.passMin&&sp<=R.passMax,'pass speed '+sp);
 let t=0;while(m.ball.owner!==2&&t<180){stepMatch(m,{});t++;}
 assert.equal(m.ball.owner,2,'received in '+(t/60).toFixed(2)+' s');
 assert.ok(passSpeed(20)>passSpeed(5),'longer passes are kicked harder');
 // shot from the edge of the area with the BLU keeper out of the way
 const s=inPlay(),me=s.players[s.active];
 for(const p of s.players)if(p!==me){p.x=-15;p.y=p.team?8:-8;p.stun=5;}
 me.x=12;me.y=.5;me.fx=1;me.fy=0;s.ball.owner=me.i;
 stepMatch(s,{x:1,y:0,shoot:true});
 assert.ok(s.events.some(e=>e.type==='shot'));assert.ok(Math.hypot(s.ball.vx,s.ball.vy)>=R.shotSpeed-.5,'a shot is harder than any pass');
 run(s,1);assert.deepEqual(s.score,[1,0],'and it goes in between the posts');
 // looking away from the goal the shot goes where you look: out, no goal
 const w=inPlay(),me2=w.players[w.active];for(const p of w.players)if(p!==me2){p.x=-15;p.y=p.team?8:-8;p.stun=5;}
 me2.x=12;me2.y=6;w.ball.owner=me2.i;stepMatch(w,{x:0,y:1,shoot:true});run(w,.6);
 assert.deepEqual(w.score,[0,0]);assert.equal(w.restart?.kind,'laterale');
});

test('Q33 AI: team-mates, opponents and keepers move, press, pass and shoot (deterministic per seed)',()=>{
 const m=inPlay(11),start=m.players.map(p=>({x:p.x,y:p.y}));
 run(m,4,{});
 const moved=i=>Math.hypot(m.players[i].x-start[i].x,m.players[i].y-start[i].y);
 for(const i of [6,7,8,9])assert.ok(moved(i)>1,'BLU '+i+' moves');
 assert.ok([1,2,3].some(i=>moved(i)>1),'our AI team-mates move too');
 // a whole match with the stick at rest: the opponents attack and score, the keepers work
 const full=createMatch({seed:11});startMatch(full);const ev={};let k0y=new Set();
 for(let i=0;i<60*400&&full.phase!=='end';i++){stepMatch(full,{});for(const e of full.events)ev[e.type+'/'+(e.team??'')]=(ev[e.type+'/'+(e.team??'')]||0)+1;full.events.length=0;if(i%30===0)k0y.add(full.players[0].y.toFixed(1));}
 assert.ok((ev['shot/1']||0)>=5,'BLU shoot: '+JSON.stringify(ev));
 assert.ok((ev['pass/1']||0)>=10,'BLU pass');
 assert.ok(full.score[1]>full.score[0],'an idle player loses');
 assert.ok(k0y.size>5,'our keeper follows the ball across his goal');
 assert.ok((ev['save/0']||0)+(ev['block/0']||0)+(ev['steal/0']||0)>0,'our side defends on its own');
 // same seed, same match; another seed, another match
 const a=createMatch({seed:5}),b=createMatch({seed:5}),c=createMatch({seed:6});
 for(const x of [a,b,c]){startMatch(x);run(x,20,{});}
 assert.deepEqual(a.players.map(p=>[p.x,p.y]),b.players.map(p=>[p.x,p.y]));
 assert.notDeepEqual(a.players.map(p=>[p.x,p.y]),c.players.map(p=>[p.x,p.y]));
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


import {createWorldFootball,stepWorldFootball,fieldToWorld,worldToField,footballWorldPlayer,footballHud,drawWorldFootball,FOOTBALL_SPRITE_PATH} from './football-overworld.mjs';
import {PITCHES} from './football-pitches.mjs';

test('Q33 real pitches project the local match into their marked lines',()=>{
 for(const pitch of PITCHES.filter(p=>p.kind==='calcetto')){
  const world=createWorldFootball(pitch,{seed:19});assert.ok(world);assert.equal(world.match.players.length,10);
  assert.equal(world.match.active,4);assert.equal(world.match.fixedPlayer,true);
  for(const point of [[-20,-10],[0,0],[18,7]]){
   const at=fieldToWorld(pitch,...point),back=worldToField(pitch,at.x,at.y);
   assert.ok(Math.abs(back.x-point[0])<1e-8&&Math.abs(back.y-point[1])<1e-8);
  }
  for(const p of world.match.players){const at=fieldToWorld(pitch,p.x,p.y);assert.ok(Math.abs(at.x-pitch.cx)<pitch.w/2+2);assert.ok(Math.abs(at.y-pitch.cy)<pitch.h/2+2);}
  const user=footballWorldPlayer(world);assert.ok(Number.isFinite(user.x)&&Number.isFinite(user.y));
  assert.equal(footballHud(world).score,'0 – 0');
 }
});

test('Q33 protagonist stays the same red player; goal and final whistle occur in the overworld',()=>{
 const pitch=PITCHES.find(p=>p.id==='europa-campetto'),world=createWorldFootball(pitch,{seed:41});
 let events=[];for(let i=0;i<100;i++)events.push(...stepWorldFootball(world,1/60,{}));
 assert.equal(world.match.phase,'play');assert.equal(world.match.active,4);
 const me=world.match.players[4];world.match.ball.owner=4;me.fx=1;me.fy=0;
 events=stepWorldFootball(world,1/60,{x:1,pass:true});
 assert.ok(events.some(e=>e.type==='pass'));assert.equal(world.match.active,4,'pass never switches protagonist');
 for(let i=0;i<120;i++)stepWorldFootball(world,1/60,{});
 assert.equal(world.match.active,4);assert.equal(switchPlayer(world.match),4);
 // Put all players away from the shot path and test a real goal event.
 clearField(world.match);looseBall(world.match,18,0,12,0);
 let scored=[];for(let i=0;i<30;i++)scored.push(...stepWorldFootball(world,1/60,{}));
 assert.ok(scored.some(e=>e.type==='goal'));assert.equal(world.match.score[0],1);
 world.match.time=R.realSeconds-.05;world.match.phase='play';
 let final=[];for(let i=0;i<10;i++)final.push(...stepWorldFootball(world,1/60,{}));
 assert.ok(final.some(e=>e.type==='end'));assert.equal(world.match.phase,'end');
 assert.equal(matchResult(world.match).outcome,'vittoria');
});

test('Q33 24×40 pixel art, city wiring and no fullscreen scene',async()=>{
 const [game,html,mod,novita]=await Promise.all([read('game.mjs'),read('index.html'),read('minigame-football.mjs'),read('novita.mjs')]);
 assert.match(game,/createWorldFootball\(pitch/);assert.match(game,/stepWorldFootball\(state\.football/);
 assert.match(game,/drawWorldFootball\(c,state\.football/);assert.match(game,/recordFootballResult\(state\.progress,result\)/);
 assert.doesNotMatch(game,/openFootballGame/);assert.doesNotMatch(html,/football-panel|fb-canvas/);
 assert.match(html,/id="football-hud"/);assert.match(html,/id="football-shoot"/);assert.match(html,/id="football-pass"/);
 assert.match(novita,/partita sul campetto, nella città/i);assert.doesNotMatch(mod,/document|requestAnimationFrame|openFootballGame/);
 const bytes=await readFile(new URL(FOOTBALL_SPRITE_PATH,import.meta.url));
 assert.equal(bytes.readUInt32BE(16),384);assert.equal(bytes.readUInt32BE(20),160);
 const calls={};const ctx=new Proxy({},{get:(t,k)=>k in t?t[k]:(...a)=>{calls[k]=(calls[k]||0)+1;},set:(t,k,v)=>{t[k]=v;return true;}});
 drawWorldFootball(ctx,createWorldFootball(PITCHES.find(p=>p.id==='europa-campetto')));
 assert.ok(calls.fillRect>10,'ten fallback players and the ball are drawn without an image in Node');
});
