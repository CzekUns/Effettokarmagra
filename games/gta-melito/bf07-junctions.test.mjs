import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {buildRoadGraph,createAgents,stepAgents,lanePosition} from './roads.mjs';
import {vehiclesOverlap,vehicleShape} from './traffic-collision.mjs';
import {signalAspect,SIGNAL_TIMING,SIGNALS_SIMULATED,SIGNAL_NOTE,movementOf,movementsConflict} from './junctions.mjs';

const dt=.05;
// Due vie terziarie che si incrociano in (300,0): incrocio principale → semaforo simulato.
const signalled=()=>buildRoadGraph([
 {id:1,n:'Via Grande',t:'tertiary',w:8,p:[0,0,300,0,600,0]},
 {id:2,n:'Via Traversa',t:'tertiary',w:8,p:[300,-300,300,0,300,300]}
]);
// Stesso incrocio fra vie residenziali: niente semaforo, precedenze.
const plain=(main='residential',side='residential')=>buildRoadGraph([
 {id:1,n:'Via Roma',t:main,w:8,p:[0,0,300,0,600,0]},
 {id:2,n:'Traversa',t:side,w:8,p:[300,-300,300,0,300,300]}
]);
const edgeTo=(g,fromX,fromY)=>g.edges.findIndex(e=>e.car&&g.nodes[e.to].x===300&&g.nodes[e.to].y===0&&g.nodes[e.from].x===fromX&&g.nodes[e.from].y===fromY);
const edgeFrom=(g,toX,toY)=>g.edges.findIndex(e=>e.car&&g.nodes[e.from].x===300&&g.nodes[e.from].y===0&&g.nodes[e.to].x===toX&&g.nodes[e.to].y===toY);
// Un'auto del traffico sull'accesso `edge`, a `dist` metri dal centro dell'incrocio, con percorso fissato.
function carOn(g,edge,dist,out,seed=1){
 const car=createAgents(g,1,seed,'car',[])[0],e=g.edges[edge],t=1-dist/e.len;
 Object.assign(car,lanePosition(g,edge,t,'car'),{edge,t,path:[edge,out],speed:10,wait:0,model:'panda-modern-white',vehicleType:'car'});
 delete car.home;
 return car;
}
const toNode=(car,g)=>{const e=g.edges[car.edge];return (1-car.t)*e.len;};
const passed=(car,g,inEdge)=>car.edge!==inEdge;

test('BF07 traffic lights are simulated and declared as such; phases follow the game clock',()=>{
 assert.equal(SIGNALS_SIMULATED,true);
 assert.match(SIGNAL_NOTE,/non rilevati/);
 const g=signalled(),J=g.signals[0];
 assert.equal(g.signals.length,1,'the main junction gets a light');
 assert.equal(plain().signals.length,0,'two residential streets: no light, right of way instead');
 const [a,b]=[...J.approaches.values()].reduce((m,q)=>{m[q.axis].push(q);return m;},[[],[]]).map(l=>l[0]);
 const {cycle,green,yellow,allRed}=SIGNAL_TIMING;
 assert.equal(1440%cycle,0,'the cycle divides the day: same time, same phase');
 let bothGreen=0,allRedSeen=0;
 for(let s=0;s<cycle;s+=.25){
  const x=signalAspect(J,a,s),y=signalAspect(J,b,s);
  if(x.color==='green'&&y.color==='green')bothGreen++;
  if(x.color==='red'&&y.color==='red')allRedSeen++;
  assert.deepEqual(signalAspect(J,a,s+cycle*48),x,'deterministic');
 }
 assert.equal(bothGreen,0,'never green on both axes');
 assert.equal(allRedSeen,2*allRed/.25,'clearance: all red twice per cycle');
 assert.equal(green+yellow+allRed,cycle/2);
});

test('BF07 red light: the first car stops at the stop line, the next one queues behind, both go on green',()=>{
 const g=signalled(),J=g.signals[0],west=edgeTo(g,0,0),east=edgeFrom(g,600,0),A=J.approaches.get(west);
 // un istante in cui l'accesso da ovest è appena diventato rosso
 let start=0;while(!(signalAspect(J,A,start).color==='red'&&signalAspect(J,A,start).remaining>15))start+=.25;
 const first=carOn(g,west,45,east,3),second=carOn(g,west,62,east,5);
 let stoppedAt=null,crossedRed=false,firstOut=null,secondOut=null;
 for(let i=0;i<900;i++){
  const clock=start+i*dt;
  stepAgents(g,[first,second],dt,null,{npcClockMinutes:clock});
  assert.equal(vehiclesOverlap(first,second,0),false,'the queue never overlaps');
  const aspect=signalAspect(J,A,clock+dt);
  if(first.edge===west){
   const gap=toNode(first,g)-vehicleShape(first).halfLength-A.stop;
   assert.ok(gap>-.05||aspect.color!=='red','never past the line on red: '+gap.toFixed(2));
   if(aspect.color==='red'&&gap<1&&first.braking&&stoppedAt===null)stoppedAt=gap;
  }else if(firstOut===null){firstOut=clock;crossedRed=signalAspect(J,A,clock).color==='red';}
  if(second.edge!==west&&secondOut===null)secondOut=clock;
 }
 assert.ok(stoppedAt!==null&&stoppedAt>-.05,'waited right at the stop line');
 assert.equal(crossedRed,false,'went only with green/yellow');
 assert.ok(firstOut!==null&&secondOut!==null&&secondOut>firstOut,'both through, in order');
});

test('BF07 already past the stop line when the light turns red: the car clears the junction',()=>{
 const g=signalled(),J=g.signals[0],west=edgeTo(g,0,0),east=edgeFrom(g,600,0),A=J.approaches.get(west);
 let red=0;while(!(signalAspect(J,A,red).color==='red'&&signalAspect(J,A,red).remaining>10))red+=.25;
 const car=carOn(g,west,A.stop+vehicleShape({}).halfLength-1.5,east);
 for(let i=0;i<60;i++)stepAgents(g,[car],dt,null,{npcClockMinutes:red+i*dt});
 assert.equal(car.edge,east,'out of the junction box within 3 s');
});

test('BF07 no light, equal streets: the car coming from the right goes first, the other waits at its line',()=>{
 const g=plain(),west=edgeTo(g,0,0),south=edgeTo(g,300,300),east=edgeFrom(g,600,0),north=edgeFrom(g,300,-300);
 const a=carOn(g,west,26,east,11),b=carOn(g,south,26,north,12);// b arriva dalla destra di a
 const J=g.intersections.byNode.get(g.edges[west].to);
 assert.ok(movementsConflict(movementOf(g,J,west,east),movementOf(g,J,south,north)),'crossing paths');
 let aOut=null,bOut=null,waited=false;
 for(let i=0;i<600;i++){
  stepAgents(g,[a,b],dt,null,{});
  assert.equal(vehiclesOverlap(a,b,0),false,'no crash');
  if(a.jHold==='precedenza')waited=true;
  if(aOut===null&&passed(a,g,west))aOut=i;if(bOut===null&&passed(b,g,south))bOut=i;
 }
 assert.ok(waited,'a gave way');
 assert.ok(bOut!==null&&aOut!==null&&bOut<aOut,'right-hand rule');
});

test('BF07 no light: a residential side street gives way to the main road, also from the right',()=>{
 const g=plain('unclassified','residential');
 assert.equal(g.signals.length,0,'no tertiary road: no light');
 const west=edgeTo(g,0,0),south=edgeTo(g,300,300),east=edgeFrom(g,600,0),north=edgeFrom(g,300,-300);
 const main=carOn(g,west,28,east,21),side=carOn(g,south,24,north,22);
 let mainOut=null,sideOut=null,yielded=false;
 for(let i=0;i<600;i++){
  stepAgents(g,[main,side],dt,null,{});
  assert.equal(vehiclesOverlap(main,side,0),false);
  if(side.jHold==='precedenza'||side.jHold==='incrocio')yielded=true;
  if(mainOut===null&&passed(main,g,west))mainOut=i;if(sideOut===null&&passed(side,g,south))sideOut=i;
 }
 assert.ok(yielded&&mainOut<sideOut,'the main road has priority over the right-hand rule');
});

test('BF07 do not block the box: with no room after the junction the car waits before the line',()=>{
 const g=plain(),west=edgeTo(g,0,0),east=edgeFrom(g,600,0),J=g.intersections.byNode.get(g.edges[west].to);
 const car=carOn(g,west,40,east,31);
 // un'auto ferma subito dopo l'incrocio, proprio nella corsia di uscita
 const jam=createAgents(g,1,33,'car',[])[0],e=g.edges[east];
 Object.assign(jam,lanePosition(g,east,(J.r+4)/e.len,'car'),{edge:east,t:(J.r+4)/e.len,wait:1e9,speed:9,model:'panda-modern-white'});
 const A=J.approaches.get(west);
 for(let i=0;i<300;i++){
  stepAgents(g,[car,jam],dt,null,{});
  const gap=toNode(car,g)-vehicleShape(car).halfLength-A.stop;
  assert.ok(car.edge===west&&gap>-.05,'never inside the junction while the exit is taken');
 }
 assert.equal(car.jHold,'uscita');
 jam.wait=0;
 for(let i=0;i<300;i++)stepAgents(g,[car,jam],dt,null,{});
 assert.equal(car.edge,east,'goes as soon as the exit is free');
 assert.equal(vehiclesOverlap(car,jam,0),false);
});

test('BF07 four cars arriving together at an equal crossing: all through, no crash, no endless wait',()=>{
 const g=plain(),ends=[[0,0,600,0],[600,0,0,0],[300,300,300,-300],[300,-300,300,300]];
 const cars=ends.map(([fx,fy,tx,ty],i)=>carOn(g,edgeTo(g,fx,fy),24,edgeFrom(g,tx,ty),41+i));
 const inEdges=cars.map(c=>c.edge);let maxWait=0;
 for(let i=0;i<800;i++){
  stepAgents(g,cars,dt,null,{});
  for(let a=0;a<4;a++){maxWait=Math.max(maxWait,cars[a].jWait||0);for(let b=a+1;b<4;b++)assert.equal(vehiclesOverlap(cars[a],cars[b],0),false,'no crash '+a+'/'+b);}
 }
 cars.forEach((c,i)=>assert.notEqual(c.edge,inEdges[i],'car '+i+' got through'));
 assert.ok(maxWait<12,'longest wait '+maxWait.toFixed(1)+' s');
});

test('BF07 turn indicators: blinking on the side of the turn in the last 30 m, none when going straight',()=>{
 const g=plain(),west=edgeTo(g,0,0),north=edgeFrom(g,300,-300),south=edgeFrom(g,300,300),east=edgeFrom(g,600,0);
 const left=carOn(g,west,60,north,51),right=carOn(g,west,60,south,52),straight=carOn(g,west,60,east,53);
 for(const [car,want] of [[left,'left'],[right,'right'],[straight,null]]){
  const seen=new Set();
  for(let i=0;i<120;i++){stepAgents(g,[car],dt,null,{});if(car.edge===west&&toNode(car,g)>45)assert.equal(car.turnSignal,null,'not too early');if(car.edge===west)seen.add(car.turnSignal);}
  assert.ok(seen.has(want),'indicator '+want);
  if(!want)assert.deepEqual([...seen],[null]);
 }
});

test('BF07 pedestrians at a signalled crossing wait on the kerb and cross with their green',()=>{
 const g=signalled(),J=g.signals[0];
 const walk=g.edges.findIndex(e=>e.walk&&g.nodes[e.to].x===300&&g.nodes[e.to].y===0&&g.nodes[e.from].x===0);
 const onward=g.edges.findIndex(e=>e.walk&&g.nodes[e.from].x===300&&g.nodes[e.from].y===0&&g.nodes[e.to].x===600);
 const A=[...J.approaches.values()].find(a=>Math.abs(a.angle)<.1);
 let start=0;while(!(signalAspect(J,A,start).color==='red'&&signalAspect(J,A,start).remaining>12))start+=.25;
 const p=createAgents(g,1,7,'walk',[])[0],e=g.edges[walk];
 Object.assign(p,lanePosition(g,walk,1-(J.r+6)/e.len,'walk',1),{edge:walk,t:1-(J.r+6)/e.len,side:1,path:[walk,onward],speed:1.2,wait:0});
 delete p.home;
 let waited=false,crossedAt=null;
 for(let i=0;i<800&&crossedAt===null;i++){
  const clock=start+i*dt;
  stepAgents(g,[p],dt,null,{npcClockMinutes:clock});
  if(p.signalWait){waited=true;assert.ok((1-p.t)*e.len>=J.r+.9,'waits on the kerb, out of the road');}
  if(p.edge===onward||p.corner)crossedAt=clock;
 }
 assert.ok(waited,'stopped at the red');
 assert.ok(crossedAt!==null,'then crossed');
 assert.equal(signalAspect(J,A,crossedAt).color,'green','with the green of its own street');
});

test('BF07 real map: 6–12 simulated lights on main junctions, posts and stop lines wired in the game',async()=>{
 const map=JSON.parse(await readFile(new URL('./data/melito-map.json',import.meta.url),'utf8'));
 assert.equal(JSON.stringify(map).includes('traffic_signals'),false,'no surveyed lights in the OSM snapshot');
 const g=buildRoadGraph(map.roads);
 assert.ok(g.signals.length>=6&&g.signals.length<=12,'lights: '+g.signals.length);
 for(const J of g.signals){
  assert.ok(J.approaches.size>=3);
  assert.ok(Math.max(...[...J.approaches.values()].map(a=>a.rank))>=3,'a tertiary road or bigger');
  for(const K of g.signals)if(K!==J)assert.ok(Math.hypot(K.x-J.x,K.y-J.y)>=130,'spaced out');
 }
 const [game,html,readme]=await Promise.all(['game.mjs','index.html','README.md'].map(f=>readFile(new URL('./'+f,import.meta.url),'utf8')));
 assert.match(game,/import \{prepareSignalPosts,drawStopLines,drawSignals,signalGlows\} from '\.\/traffic-light-art\.mjs\?v=\d+'/);
 assert.match(game,/state\.traffic=createTraffic\([^)]*\);prepareSignals\(\);/,'Q13: createTraffic takes the hour');
 assert.ok(game.indexOf('drawStopLines(c,')<game.indexOf('drawCityPeople(c,'),'stop lines on the asphalt, under people and cars');
 assert.ok(game.indexOf('drawSignals(c,')>game.indexOf('drawPlayer();'),'lights above the traffic');
 assert.match(game,/drawBlinker\(x,y,a,ai\)/);
 assert.match(game,/const estimated=source\.braking&&!source\.jHold&&!source\.redQueue\?/,'a car waiting at the line does not nudge pedestrians on the crossing');
 assert.match(html,/id="signal-note"[^>]*>SEMAFORI DI GIOCO, NON RILEVATI/);
 assert.match(readme,/[Ss]emafori[^\n]*(simulati|di gioco)[^\n]*non rilevati/);
 assert.ok(Number((html.match(/game\.mjs\?v=(\d+)/)||[])[1])>=157);
});
