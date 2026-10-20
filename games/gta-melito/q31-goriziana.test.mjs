import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createGorizianaGame,pinLayout,shoot,stepPhysics,scoreShot,endShot,playShot,resetTable,aiChooseShot,aimFromPoint,
 shotMessage,winnerText,drawGorizianaScreen,openGoriziana,isGorizianaOpen,currentGorizianaGame,GOR_RULES,TABLE,BALL_R,SPOTS}
 from './minigame-goriziana.mjs';

// Tavolo vuoto con le biglie dove servono al test.
const place=(g,id,x,y)=>{const b=g.balls.find(b=>b.id===id);b.x=x;b.y=y;b.vx=0;b.vy=0;return b;};
const runUntilStill=g=>{for(let i=0;i<2000&&stepPhysics(g,1/60);i++);};
const away=g=>{place(g,'pallino',170,95);};

test('Q31 table: no pockets, 9 pins in a rhombus with the red one in the middle, 2 white balls and the red pallino',()=>{
 const g=createGorizianaGame({seed:5}),pins=pinLayout();
 assert.equal(pins.length,9);assert.equal(pins.filter(p=>p.red).length,1);
 const red=pins.find(p=>p.red);assert.deepEqual([red.x,red.y],[TABLE.cx,TABLE.cy]);
 assert.deepEqual(g.balls.map(b=>b.id),['p0','p1','pallino']);
 assert.equal(g.balls.filter(b=>b.r===BALL_R).length,2);
 assert.deepEqual([g.scores,g.shots,g.turn,g.phase],[[0,0],[0,0],0,'aim']);
});

test('Q31 collision: head-on hit passes the speed to the other ball; cushions bounce the ball back inside',()=>{
 const g=createGorizianaGame();away(g);
 const a=place(g,'p0',40,62),b=place(g,'p1',60,40);place(g,'p1',60,62);
 assert.equal(shoot(g,0,.5),true);g.shot.first=null;
 for(let i=0;i<40&&g.shot.first===null;i++)stepPhysics(g,1/60);
 assert.equal(g.shot.first,'p1','the shooter touched the opponent ball first');
 assert.ok(b.vx>Math.abs(a.vx)*5,'almost all the speed passes to the hit ball');
 runUntilStill(g);
 for(const ball of g.balls){assert.ok(ball.x>=TABLE.x0+ball.r-1e-9&&ball.x<=TABLE.x1-ball.r+1e-9);assert.ok(ball.y>=TABLE.y0+ball.r-1e-9&&ball.y<=TABLE.y1-ball.r+1e-9);}
 const c=createGorizianaGame();away(c);place(c,'p1',150,40);const w=place(c,'p0',40,40);
 shoot(c,Math.PI,1);let bounced=false;for(let i=0;i<120;i++){stepPhysics(c,1/60);if(w.vx>0)bounced=true;}
 assert.ok(bounced,'the left cushion sends the ball back');assert.ok(w.x>=TABLE.x0+w.r);
});

test('Q31 pins: a ball that touches a pin knocks it down (and it can topple the one behind)',()=>{
 const g=createGorizianaGame();away(g);place(g,'p1',150,30);
 const pins=g.pins,left=pins.reduce((m,p)=>p.x<m.x?p:m,pins[0]);
 place(g,'p0',TABLE.x0+10,left.y);
 shoot(g,0,.6);runUntilStill(g);
 assert.ok(left.down,'the first pin on the line falls');assert.equal(left.by,'p0');
 assert.ok(g.shot.pins.length>=2,'pins fall along the line of the shot');
 assert.ok(g.pins.filter(p=>p.down).every(p=>p.fall&&Number.isFinite(p.fall[0])));
});

test('Q31 score: white 2, red 4 (10 alone), pallino 3, fouls give the shot to the opponent (at least 2)',()=>{
 const W={red:false},R={red:true};
 assert.equal(scoreShot({shooter:0,first:'p1',pins:[W,W]}).points,4);
 assert.equal(scoreShot({shooter:0,first:'p1',pins:[R]}).points,GOR_RULES.redAlone);
 assert.equal(scoreShot({shooter:0,first:'p1',pins:[R,W,W]}).points,8);
 assert.equal(scoreShot({shooter:1,first:'p0',pins:[W],pallinoBy:'p0'}).points,5);
 const ok=scoreShot({shooter:1,first:'p0',pins:[]});assert.deepEqual([ok.foul,ok.points,ok.to],[false,0,1]);
 const miss=scoreShot({shooter:0,first:null,pins:[]});assert.deepEqual([miss.foul,miss.points,miss.to],[true,2,1]);
 const pal=scoreShot({shooter:0,first:'pallino',pins:[W,W,W],pallinoBy:'p0'});assert.deepEqual([pal.foul,pal.points,pal.to],[true,9,1]);
 assert.equal(scoreShot({shooter:1,first:'pin',pins:[W]}).reason,'TOCCA PRIMA I BIRILLI');
 assert.match(shotMessage({...pal,shooter:0}),/FALLO TU: TOCCA PRIMA IL PALLINO · \+9 A IA/);
});

test('Q31 turn: a real shot is scored, pins stand up again, balls leave the castle and the AI plays next',()=>{
 const g=createGorizianaGame({seed:9});away(g);
 const red=g.pins.find(p=>p.red);place(g,'p1',red.x-16,red.y);place(g,'p0',red.x-40,red.y);
 const res=playShot(g,0,.8);
 assert.equal(res.foul,false);assert.ok(res.points>=GOR_RULES.whitePin,'pins knocked by the opponent ball score');
 assert.equal(g.scores[0],res.points);assert.deepEqual(g.shots,[1,0]);
 assert.equal(g.turn,1);assert.equal(g.phase,'aim');
 assert.ok(g.pins.every(p=>!p.down),'the castle is set up again');
 for(const b of g.balls)assert.ok(Math.hypot(b.x-TABLE.cx,b.y-TABLE.cy)>8,b.id+' is not left on the pins');
 assert.equal(shoot(g,0,.5),true,'now the AI ball is the one that moves');assert.ok(g.balls[1].vx>0&&g.balls[0].vx===0);
 runUntilStill(g);endShot(g);assert.equal(g.turn,0);assert.deepEqual(g.shots,[1,1]);
 // the AI aims at its target ball with a small error, and a foul goes to the human
 const h=createGorizianaGame({seed:3});h.turn=1;
 const ai=aiChooseShot(h),me=h.balls[1],opp=h.balls[0];
 const direct=Math.atan2(opp.y-me.y,opp.x-me.x);assert.ok(Math.abs(ai.angle-direct)<.5||ai.mode==='sponda');
 assert.ok(ai.power>=.35&&ai.power<=.95);
 const f=createGorizianaGame();away(f);f.turn=1;place(f,'p0',30,30);place(f,'p1',150,90);
 const foul=playShot(f,Math.PI/2,.15);assert.equal(foul.foul,true);assert.deepEqual(f.scores,[2,0]);assert.equal(f.turn,0);
});

test('Q31 end of match: first to 30, or after 5 shots each; winner and draw',()=>{
 const g=createGorizianaGame();g.scores=[28,0];away(g);
 const red=g.pins.find(p=>p.red);place(g,'p1',red.x-16,red.y);place(g,'p0',red.x-40,red.y);
 playShot(g,0,.8);assert.equal(g.phase,'over');assert.equal(g.winner,0);assert.match(winnerText(g),/HAI VINTO/);
 assert.equal(shoot(g,0,.5),false,'no shots after the end');
 const s=createGorizianaGame({seed:21});let n=0;
 while(s.phase!=='over'&&n<20){const ai=aiChooseShot(s);playShot(s,ai.angle,ai.power);n++;}
 assert.ok(n<=2*GOR_RULES.shotsEach);assert.ok(s.shots.every(k=>k<=GOR_RULES.shotsEach));
 assert.ok([0,1,-1].includes(s.winner));
 const d=createGorizianaGame();d.scores=[6,6];d.winner=-1;assert.match(winnerText(d),/PAREGGIO 6–6/);
 resetTable(d);assert.ok(d.balls.every(b=>!b.vx&&!b.vy));
});

test('Q31 aim and drawing: aim follows the finger, power grows with distance; the screen draws with rules and scores',()=>{
 const b={x:50,y:50,r:3};
 const a=aimFromPoint(b,120,50);assert.equal(a.angle,0);assert.equal(a.power,1);
 assert.ok(aimFromPoint(b,50,90).power<1&&Math.abs(aimFromPoint(b,50,90).angle-Math.PI/2)<1e-9);
 assert.equal(aimFromPoint(b,51,50),null,'a tap on the ball does not shoot');
 const texts=[];const c=new Proxy({},{get:(t,k)=>k in t?t[k]:(...x)=>{if(k==='fillText')texts.push(x[0]);},set:(t,k,v)=>{t[k]=v;return true;}});
 const g=createGorizianaGame();g.pins[0].down=true;g.pins[0].fall=[1,0];
 drawGorizianaScreen(c,g,{message:'PROVA',showAim:true,angle:.3,power:.7});
 assert.ok(texts.some(t=>/TU 0/.test(t))&&texts.some(t=>/IA 0/.test(t))&&texts.includes('PROVA'));
 assert.ok(texts.some(t=>/BIRILLO 2/.test(t)),'points reminder on the canvas');
});

test('Q31 panel: opens once, plays with SPACE, ESC exits even while the balls roll, no crash after closing',()=>{
 assert.equal(openGoriziana({doc:null}),false);assert.equal(isGorizianaOpen(),false);
 const els=new Map(),keys=new Set();let frames=[],t=0;
 const ctx=new Proxy({},{get:(o,k)=>k in o?o[k]:()=>{},set:(o,k,v)=>{o[k]=v;return true;}});
 const el=id=>{if(!els.has(id))els.set(id,{id,hidden:false,disabled:false,textContent:'',setAttribute(){},focus(){},getContext:()=>ctx,
  getBoundingClientRect:()=>({left:0,top:0,width:192,height:128})});return els.get(id);};
 const doc={getElementById:el,createElement:()=>el('x'),body:{appendChild(){}},addEventListener:(k,f)=>keys.add(f),removeEventListener:(k,f)=>keys.delete(f)};
 const press=key=>{for(const f of [...keys])f({key,code:key===' '?'Space':key,preventDefault(){},stopImmediatePropagation(){}});};
 let exited=null;
 assert.equal(openGoriziana({doc,seed:4,now:()=>t,raf:f=>{frames.push(f);return frames.length;},caf:()=>{},onExit:r=>{exited=r;}}),true);
 assert.equal(isGorizianaOpen(),true);assert.equal(el('goriziana-panel').hidden,false);
 assert.equal(openGoriziana({doc}),false,'never two tables at once');
 const g=currentGorizianaGame();press('ArrowUp');assert.ok(g.aim.power>.55);press('ArrowLeft');
 press(' ');assert.equal(g.phase,'rolling');assert.equal(el('gor-shoot').disabled,true,'no second shot while the balls roll');
 for(let i=0;i<5;i++){t+=16;const f=frames.shift();f?.();}
 press('Escape');assert.equal(isGorizianaOpen(),false);assert.equal(el('goriziana-panel').hidden,true);
 assert.ok(exited&&Array.isArray(exited.scores));assert.equal(keys.size,0,'keyboard released');
 for(const f of frames)f();assert.equal(isGorizianaOpen(),false,'a late frame does nothing');
 // the pointer: drag on the table and release to shoot
 assert.equal(openGoriziana({doc,seed:8,now:()=>t,raf:()=>1,caf:()=>{}}),true);
 const g2=currentGorizianaGame(),canvas=el('goriziana-canvas'),[x,y]=SPOTS.p0;
 canvas.onpointerdown({clientX:x+40,clientY:y,pointerId:1});canvas.onpointermove({clientX:x+50,clientY:y});canvas.onpointerup({clientX:x+50,clientY:y});
 assert.equal(g2.phase,'rolling');assert.ok(g2.balls[0].vx>0&&Math.abs(g2.balls[0].vy)<1e-9);
 el('gor-exit').onclick();assert.equal(isGorizianaOpen(),false);
});

test('Q31 no money and independent: nothing about euros, credits, network or the pocket billiards module',async()=>{
 const src=await readFile(new URL('./minigame-goriziana.mjs',import.meta.url),'utf8');
 assert.doesNotMatch(src,/fetch\(|XMLHttpRequest|WebSocket|sendBeacon|€|progress\.money|localStorage/);
 assert.doesNotMatch(src,/from '\.\/minigame-pool/,'it does not depend on the pocket billiards');
 assert.match(src,/niente soldi, crediti o premi/i);
});

test('Q31 game wiring: world paused, radio ducked, PAUSA › STRUMENTI and ?minigioco=goriziana, hook for Q27',async()=>{
 const [game,html]=await Promise.all(['game.mjs','index.html'].map(f=>readFile(new URL('./'+f,import.meta.url),'utf8')));
 assert.match(game,/import \{openGoriziana,isGorizianaOpen\} from '\.\/minigame-goriziana\.mjs\?v=\d+'/);
 assert.match(game,/function tick\(dt\)\{\n if\(!state\.ready\)return;\n if\(state\.mapOpen\|\|[^\n]*\|\|isGorizianaOpen\(\)[^\n]*\)\{\n  for\(const key of Object\.keys\(pressed\)\)pressed\[key\]=false;/,'the world stops under the table');
 assert.match(game,/const paused=state\.mapOpen\|\|[^\n]*\|\|isGorizianaOpen\(\)/,'city audio quiet');
 assert.match(game,/function openGorizianaGame\(\)\{[\s\S]{0,260}carRadio\.duck\(true\);[\s\S]{0,200}onExit:\(\)=>\{carRadio\.duck\(false\);/);
 assert.match(game,/get\('minigioco'\)==='goriziana'/);assert.match(game,/else if\(GORIZIANA_FROM_URL\)openGorizianaGame\(\);/);
 assert.match(game,/\$\('pause-goriziana'\)\.addEventListener\('click',\(\)=>\{closePause\(\);openGorizianaGame\(\);\}\);/);
 const tools=html.slice(html.indexOf('pause-h-tools'),html.indexOf('pause-h-credits'));
 assert.match(tools,/id="pause-goriziana"[^>]*>PROVA GORIZIANA</);
 assert.match(html,/#goriziana-canvas\{/);
 assert.ok(Number((html.match(/game\.mjs\?v=(\d+)/)||[])[1])>=189);
});
