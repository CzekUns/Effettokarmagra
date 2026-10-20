import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {buildRoadGraph,createAgents,stepAgents,lanePosition} from './roads.mjs?v=153';
import {vehicleHitsPedestrian,makeCollisionIndex} from './traffic-collision.mjs?v=128';
import {createReactions,stepReactions,startCrossing,kerbWait,pickBlockedHorn,vehicleThreat,crossingThreat,speedOf,REACTION_RULES} from './npc-reactions.mjs?v=001';
import {canSocialize} from './npc-social.mjs?v=004';

// Via Roma lungo x (residenziale, larga 8) e una traversa a x=300.
const graph=buildRoadGraph([
 {id:1,n:'Via Roma',t:'residential',w:8,p:[0,0,300,0,600,0]},
 {id:2,n:'Traversa',t:'residential',w:8,p:[300,-250,300,0,300,250]}
]);
const dt=.05,view=[-1000,-1000,1000,1000];
const east=graph.edges.findIndex(e=>e.name==='Via Roma'&&e.angle===0&&graph.nodes[e.from].x===0);
const width=graph.edges[east].streetWidth,kerb=width/2,pave=kerb+1.7;
// Case a nord (y > pave+1,2): il marciapiede di sopra finisce contro un muro.
const canStand=(x,y)=>y<pave+1.2&&y>-(pave+1.2)||Math.abs(x-300)<kerb+3;
const onRoad=(x,y)=>Math.abs(y)<kerb&&x>=0&&x<=600||Math.abs(x-300)<kerb&&Math.abs(y)<=250;
const walker=(t=.4,side=1)=>{
 const a=createAgents(graph,1,77,'walk',[])[0],p=lanePosition(graph,east,t,'walk',side);
 return Object.assign(a,{x:p.x,y:p.y,a:p.a,edge:east,t,side,wait:0,corner:null,routine:'errand'});
};
const ctxFor=(people,vehicles,extra={})=>({graph,people,vehicles,canStand,onRoad,dt,...extra});

test('Q13 threat: only a moving vehicle with the pedestrian in its corridor; NPC traffic uses its real speed',()=>{
 const ped={x:20,y:0};
 assert.ok(vehicleThreat(ped,{x:0,y:0,a:0,speed:10}).ttc>1.6);
 assert.equal(vehicleThreat(ped,{x:0,y:3.5,a:0,speed:10}),null,'next lane: not in its way');
 assert.equal(vehicleThreat(ped,{x:40,y:0,a:0,speed:10}),null,'already past');
 assert.ok(vehicleThreat(ped,{x:40,y:0,a:0,speed:-6}),'reversing towards it');
 // traffico NPC: speed è la crociera, v la velocità vera (BF05); fermo se frena
 assert.equal(speedOf({body:'car',edge:3,speed:12,v:0,braking:false}),0);
 assert.equal(speedOf({body:'car',edge:3,speed:12,v:9,braking:true}),0);
 assert.equal(vehicleThreat(ped,{body:'car',edge:3,x:0,y:0,a:0,speed:12,v:0}),null,'a queued NPC is no threat');
});

test('Q13 graded reaction to the player driving on the pavement: looks, hurries, jumps aside (never into the wall), then rejoins',()=>{
 const ped=walker(),start={x:ped.x,y:ped.y};
 const car={x:ped.x-45,y:ped.y,a:0,speed:12,vehicleType:'car',model:'panda-modern-white'};
 const r=createReactions(1),seen=new Set();let minGap=Infinity;
 for(let i=0;i<120;i++){
  car.x+=car.speed*dt;
  stepReactions(r,dt,ctxFor([ped],[car],{playerVehicle:car}));
  if(ped.lookAt)seen.add('look');if(ped.hurry>0)seen.add('hurry');if(ped.dodge>0)seen.add('jump');
  assert.ok(canStand(ped.x,ped.y),'never inside the wall');
  assert.equal(vehicleHitsPedestrian(car,ped,0),false,'never under the car');
  minGap=Math.min(minGap,Math.hypot(car.x-ped.x,car.y-ped.y));
 }
 assert.deepEqual([...seen].sort(),['hurry','jump','look'],'all three steps of the reaction');
 assert.ok(r.log.some(e=>e.type==='jump'&&e.by==='player'));
 assert.ok(ped.y<start.y-.8,'jumped towards the free side (the house side is a wall): '+(ped.y-start.y).toFixed(2));
 assert.equal(ped.needsRoutineRecovery,true,'handed to the usual recovery');
 for(let i=0;i<200&&ped.needsRoutineRecovery;i++)stepAgents(graph,[ped],dt,null,{view,validRecovery:(x,y)=>canStand(x,y)});
 assert.equal(ped.needsRoutineRecovery,false,'back on its pavement');
 assert.ok(Math.abs(ped.y-start.y)<.05);
 assert.ok(ped.reactCool>0||r.clock>REACTION_RULES.cooldown,'cooldown set');
});

test('Q13 cooldown: right after a reaction the pedestrian does not turn to look again at every car',()=>{
 const ped=walker(),r=createReactions(2);
 const car={x:ped.x-40,y:ped.y,a:0,speed:12};
 for(let i=0;i<80;i++){car.x+=car.speed*dt;stepReactions(r,dt,ctxFor([ped],[car]));}
 assert.equal(r.log.filter(e=>e.type==='jump').length,1);
 assert.ok(ped.reactCool>0,'cooling down');
 const looks=r.log.filter(e=>e.type==='look').length;
 ped.needsRoutineRecovery=false;
 const slow={x:ped.x-14,y:ped.y,a:0,speed:5};
 stepReactions(r,dt,ctxFor([ped],[slow]));
 assert.equal(r.log.filter(e=>e.type==='look').length,looks,'no new look during the cooldown');
});

test('Q13 mid-block crossing: waits for a real gap, then an NPC car arriving brakes for it; it reaches the other pavement',()=>{
 const ped=walker(.3,1),r=createReactions(3);
 const [car,car2]=createAgents(graph,2,91,'car',[]);
 const lane=(c,x)=>{const p=lanePosition(graph,east,x/600,'car');Object.assign(c,{edge:east,t:x/600,x:p.x,y:p.y,a:0,speed:9,v:9,wait:0});};
 lane(car,ped.x-30);lane(car2,-5000);
 assert.ok(startCrossing(r,ped,ctxFor([ped],[car])),'a clear path to the other pavement');
 const phases=[];let braked=false,touched=false,placed=false;
 for(let i=0;i<900&&(ped.crossing||!phases.includes('go'));i++){
  const cars=placed?[car,car2]:[car];
  stepAgents(graph,cars,dt,null,{people:[ped],view});
  stepReactions(r,dt,ctxFor([ped],cars));
  const ph=ped.crossing?.phase;if(ph&&phases.at(-1)!==ph)phases.push(ph);
  // a metà strada arriva un'altra auto, a 20 m: deve frenare
  if(ph==='go'&&!placed&&ped.y<car.y+4){placed=true;lane(car2,ped.x-20);}
  if(placed&&car2.yieldPed===ped)braked=true;
  for(const c of cars)if(vehicleHitsPedestrian(c,ped,0))touched=true;
  if(ph==='wait')assert.ok(Math.abs(ped.y-pave)<.05,'waits on the kerb');
 }
 assert.deepEqual(phases,['wait','go']);
 assert.ok(r.log.find(e=>e.type==='cross-go').waited>.5,'the first car was too close: it waited');
 assert.equal(touched,false,'never touched by a car');
 assert.equal(ped.crossing,null);assert.equal(ped.side,-1,'other pavement');
 assert.ok(Math.abs(ped.y+pave)<.05);
 assert.ok(placed&&braked,'the car arriving during the crossing slowed down for the pedestrian');
});

test('Q13 an NPC car slows and stops before a pedestrian standing on its lane, then drives on',()=>{
 const [car]=createAgents(graph,1,95,'car',[]);
 const p=lanePosition(graph,east,.2,'car');Object.assign(car,{edge:east,t:.2,x:p.x,y:p.y,a:0,speed:10,v:10,wait:0});
 const ped={x:car.x+24,y:car.y,a:Math.PI/2,body:'walk',crossing:{phase:'go'}};
 let minGap=Infinity,stopped=false;
 for(let i=0;i<160;i++){
  stepAgents(graph,[car],dt,null,{people:[ped],view});
  minGap=Math.min(minGap,ped.x-car.x);
  if(car.v<.3)stopped=true;
 }
 assert.ok(stopped,'it stops');assert.ok(minGap>3.15+1,'well before the pedestrian: '+minGap.toFixed(2));
 assert.equal(car.yieldPed,ped);assert.ok(car.yieldWait>1,'waiting for it');
 ped.y+=12;ped.crossing=null;
 const x=car.x;for(let i=0;i<120;i++)stepAgents(graph,[car],dt,null,{people:[ped],view});
 assert.ok(car.x-x>10,'drives on once the lane is free');assert.equal(car.yieldPed,null);
});

test('Q13 kerb at a junction: waits while a car is coming on the side street, then crosses',()=>{
 const ped=walker(.49,1),r=createReactions(4);
 // al cordolo della traversa: mezza carreggiata della traversa + 1 m prima del nodo
 const t=1-(kerb+1.5)/graph.edges[east].len,p=lanePosition(graph,east,t,'walk',1);
 Object.assign(ped,{t,x:p.x,y:p.y});
 const south=graph.edges.findIndex(e=>e.name==='Traversa'&&graph.nodes[e.from].y===-250);
 const car={x:300-1.84,y:pave+40,a:-Math.PI/2,speed:9,body:'car',vehicleType:'car'};
 const ctx=ctxFor([ped],[car]);
 assert.equal(kerbWait(r,ped,graph,ctx),true,'a car 40 m away on the side street, coming: it would reach the crossing while the pedestrian is there');
 assert.equal(ped.kerbWait,true);
 car.y=-40;
 assert.equal(kerbWait(r,ped,graph,ctx),false,'gone past: cross');
 assert.equal(ped.kerbGo,east,'committed: no second stop on the same kerb');
 assert.ok(r.log.some(e=>e.type==='kerb-wait')&&r.log.some(e=>e.type==='kerb-go'));
 assert.ok(south>=0);
 // a stopped car somewhere else is no reason to wait
 const ped2=walker(.49,1);Object.assign(ped2,{t,x:p.x,y:p.y});
 assert.equal(kerbWait(r,ped2,graph,ctxFor([ped2],[{x:300-1.84,y:-60,a:-Math.PI/2,speed:0}])),false);
});

test('Q13 crossing gap is judged lane by lane: a car that passes before the pedestrian reaches its lane is fine',()=>{
 const from={x:0,y:5.7},to={x:0,y:-5.7};
 const lane=y=>({x:-25,y,a:0,speed:10});
 assert.ok(crossingThreat(from,to,[lane(-1.84)]),'far lane, 2 s away: the pedestrian would be there');
 assert.equal(crossingThreat(from,to,[{x:-120,y:-1.84,a:0,speed:10}]),null,'12 s away: real gap');
 assert.equal(crossingThreat(from,to,[{x:4,y:1.84,a:0,speed:10}]),null,'near lane, just gone past: no wait');
 assert.ok(crossingThreat(from,to,[{x:-6,y:1.84,a:0,speed:10}]),'near lane, arriving now');
 assert.equal(crossingThreat(from,to,[{x:30,y:-1.84,a:0,speed:10}]),null,'driving away');
 assert.ok(crossingThreat(from,to,[{x:0,y:-1.84,a:0,speed:0}]),'a car stopped on the crossing closes it');
 const t0=crossingThreat(from,to,[{x:-83.6,y:-1.84,a:0,speed:10}],0),t1=crossingThreat(from,to,[{x:-83.6,y:-1.84,a:0,speed:10}],30);
 assert.ok(t0&&!t1,'after a long wait the margin is a little smaller');
 assert.ok(crossingThreat(from,to,[{x:-77,y:-1.84,a:0,speed:10}],30),'but never below the minimum');
});

test('Q13 horns: only when the player or a pedestrian on the road blocks the car, with per-car, global and window limits',()=>{
 const r=createReactions(5),player={x:0,y:0},playerBody={isPlayer:true,body:'walk',x:5,y:0};
 const car=(x,extra)=>({body:'car',x,y:0,stalled:3,...extra});
 const queued=car(10,{blockedBy:{body:'car'}}),byPlayer=car(12,{blockedBy:playerBody}),byPed=car(14,{blockedBy:{body:'walk',x:14,y:0}});
 const ctx={player,onRoad:()=>true};
 assert.equal(pickBlockedHorn(r,[queued],ctx),null,'never for a queue behind another car');
 assert.equal(pickBlockedHorn(r,[queued,byPlayer],ctx),byPlayer);
 r.clock+=2;assert.equal(pickBlockedHorn(r,[byPed],ctx),null,'global pause 4 s');
 r.clock+=3;assert.equal(pickBlockedHorn(r,[byPlayer,byPed],ctx),byPed,'same car waits 12 s, the other may');
 r.clock+=4.5;assert.equal(pickBlockedHorn(r,[byPlayer],ctx),null,'still within 12 s for that car');
 r.clock+=5;const third=car(16,{blockedBy:playerBody});assert.ok(pickBlockedHorn(r,[byPlayer,third],ctx));
 r.clock+=4.5;assert.equal(pickBlockedHorn(r,[car(18,{blockedBy:playerBody})],ctx),null,'at most 3 horns in 20 s');
 const far=car(200,{blockedBy:playerBody});r.clock+=30;
 assert.equal(pickBlockedHorn(r,[far],ctx),null,'too far from the player to matter');
 const waitsPed=car(20,{stalled:0,yieldPed:{body:'walk',x:26,y:0},yieldWait:2.5});
 assert.equal(pickBlockedHorn(r,[waitsPed],ctx),waitsPed,'a pedestrian dawdling on the road');
});

test('Q13 horn alarm hurries the pedestrians in front; social chats are not started while reacting',()=>{
 const ped=walker(),r=createReactions(6);
 r.alarm={x:ped.x-6,y:ped.y,t:0};
 stepReactions(r,dt,ctxFor([ped],[]));
 assert.ok(ped.hurry>0&&ped.speed>ped.baseSpeed,'hurries');
 for(let i=0;i<40;i++)stepReactions(r,dt,ctxFor([ped],[]));
 assert.equal(ped.hurry,0);assert.equal(ped.speed,ped.baseSpeed??ped.speed,'back to its pace');
 for(const flag of [{dodge:.2},{crossing:{phase:'wait'}},{lookAt:{x:0,y:0,time:.3}},{kerbWait:true}])
  assert.equal(canSocialize({...walker(),...flag},graph,0),false,'no chat while '+Object.keys(flag)[0]);
});

test('Q13 workers at their post (vigile, friggitore) also jump aside but walk back to the post themselves',()=>{
 const post=walker();Object.assign(post,{stationary:true,profession:'vigile',post:{x:post.x,y:post.y}});
 const r=createReactions(7),car={x:post.x-30,y:post.y,a:0,speed:12};
 for(let i=0;i<70;i++){car.x+=car.speed*dt;stepReactions(r,dt,ctxFor([post],[car]));}
 assert.ok(r.log.some(e=>e.type==='jump'));
 assert.notEqual(post.needsRoutineRecovery,true,'no lane recovery for a worker');
 for(let i=0;i<200;i++)stepAgents(graph,[post],dt,null,{view,validRecovery:canStand});
 assert.ok(Math.hypot(post.x-post.post.x,post.y-post.post.y)<.2,'back at the post');
});

test('Q13 riders and people indoors never react; doorways only look',()=>{
 const r=createReactions(8),car={x:0,y:0,a:0,speed:12};
 const commuter={...walker(),commuter:true,x:8,y:0},inside={...walker(),indoors:true,x:8,y:0};
 const door={...walker(),x:8,y:0,residentRoutine:{doorStep:{}}};
 stepReactions(r,dt,ctxFor([commuter,inside,door],[car]));
 assert.ok(!(commuter.dodge>0)&&!(inside.dodge>0)&&!(door.dodge>0));
});

test('Q13 window shopping: a stroller passing a named shop stops a few seconds facing it, then walks on; not again at once',()=>{
 const r=createReactions(11),shop={x:200,y:pave+2,name:'Bar di prova'};
 const peds=[.3,.31,.32,.33,.34,.35,.36,.37].map((t,k)=>Object.assign(walker(t,1),{seed:900+k*37,routine:'stroller'}));
 for(const a of peds){a.x=shop.x-1;a.y=pave;}
 for(let i=0;i<12;i++)stepReactions(r,dt,ctxFor(peds,[],{shops:[shop]}));
 const stopped=peds.filter(a=>a.shopStop>0);
 assert.equal(stopped.length,1,'one at a time in front of the same shop');
 const a=stopped[0];
 assert.ok(a.wait>=2.5&&a.wait<=5,'a few seconds: '+a.wait.toFixed(1));
 assert.ok(Math.abs(Math.atan2(shop.y-a.y,shop.x-a.x)-a.a)<1e-9,'facing the shop');
 assert.ok(a.shopAt>r.clock+40,'and not again for a while');
 assert.ok(r.log.some(e=>e.type==='shop'&&e.name==='Bar di prova'));
});

test('Q13 game wiring: density before the walkers, frozen walkers skipped, kerb wait, reactions after traffic, horns from the logic',async()=>{
 const [game,roads,html]=await Promise.all(['game.mjs','roads.mjs','index.html'].map(f=>readFile(new URL('./'+f,import.meta.url),'utf8')));
 assert.match(game,/import \{createReactions,stepReactions,kerbWait,pickBlockedHorn\} from '\.\/npc-reactions\.mjs\?v=\d+'/);
 assert.match(game,/import \{createDensity,stepDensity,prepareWalkWeights\} from '\.\/npc-density\.mjs\?v=\d+'/);
 assert.equal((game.match(/state\.people=createCityPedestrians\(\);state\.streetObjects=createStreetObjects\(\);createCityLife\(\);/g)||[]).length,2);
 const f=game.indexOf('function updateTraffic('),density=game.indexOf('stepDensity(state.density',f),walk=game.indexOf('stepAgents(state.graph,state.people.filter(a=>!a.frozen)',f);
 const traffic=game.indexOf('stepAgents(state.graph,state.traffic',f),react=game.indexOf('stepReactions(state.reactions',f),horn=game.indexOf('pickBlockedHorn(',f);
 assert.ok(f>0&&density>f&&walk>density&&traffic>walk&&react>traffic&&horn>react,'order inside the traffic step');
 assert.match(game,/kerbWait:agent=>kerbWait\(state\.reactions,agent,state\.graph,life\)/);
 assert.ok(!/cityAudio\.npcHorns\(/.test(game),'no audio-side horn picking any more');
 assert.match(roads,/if\(agent\.dodge>0\|\|agent\.crossing\|\|agent\.lookAt\)\{agent\.stalled=0;continue;\}/);
 assert.match(roads,/isPlayer:true\}:null;/);
 assert.match(roads,/agent\.yieldPed=yieldPed;/);
 assert.ok(Number((html.match(/game\.mjs\?v=(\d+)/)||[])[1])>=158);
});
