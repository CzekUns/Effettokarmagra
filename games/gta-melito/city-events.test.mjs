import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {buildRoadGraph,stepAgents} from './roads.mjs';
import {createRoutineResidents} from './resident-routines.mjs';
import {probeDoor,doorFacesViewer} from './building-doors.mjs';
import {createCityEvents,stepCityEvents,canLoseSomething,cityEventAction,interactCityEvent,EVENT_RULES,LOST_ITEMS,MIN_ROAD_AHEAD} from './city-events.mjs';

const graph=buildRoadGraph([
 {id:1,n:'Via Roma',t:'primary',w:13,p:[0,0,600,0]},
 {id:2,n:'Piazza Santo Stefano',t:'residential',w:7,p:[280,-80,280,80]}
]);
const view=[0,-100,600,100],dt=.05;
const cohort=(n=1)=>createRoutineResidents(graph,n,405,{x:300,y:0},[],()=>true);
// Mondo minimo: residenti che camminano, eventi e un giocatore a piedi che segue (o no) la scena.
function run(seconds,{people=cohort(),player=null,events=createCityEvents(505),allowed=true,onTick=()=>{}}={}){
 const signals=[];
 for(let i=0;i<seconds/dt;i++){
  stepAgents(graph,people,dt,null,{view});
  const who=player||{x:people[0].x,y:people[0].y+4,onFoot:true};
  const signal=stepCityEvents(events,dt,{people,graph,player:who,view,allowed});
  if(signal)signals.push({...signal,t:+(i*dt).toFixed(2)});
  if(onTick(i*dt,events,people)===false)break;
 }
 return {events,people,signals};
}

test('Q05 no spam: nothing at first, one event at a time, a long pause between events',()=>{
 const {events,signals}=run(1500,{people:cohort(3)});
 const drops=signals.filter(s=>s.type==='dropped');
 assert.ok(drops.length>=2,'events do happen on a long walk: '+drops.length);
 assert.ok(drops[0].t>=EVENT_RULES.firstDelay,'none in the first '+EVENT_RULES.firstDelay+' s');
 for(let i=1;i<drops.length;i++)assert.ok(drops[i].t-drops[i-1].t>=EVENT_RULES.cooldown,'at least '+EVENT_RULES.cooldown+' s between two events');
 assert.ok(drops.length<=1+Math.floor((1500-EVENT_RULES.firstDelay)/EVENT_RULES.cooldown));
 assert.ok(events.log.every(e=>e.seconds<=EVENT_RULES.maxSeconds),'every event ends');
 assert.ok(events.bubbles.length<=3);
});

test('Q05 events are deterministic and never start in a car, during a timed mission or out of range',()=>{
 const a=run(800),b=run(800);
 assert.deepEqual(a.signals,b.signals);assert.deepEqual(a.events.log,b.events.log);
 assert.equal(run(400,{allowed:false}).signals.length,0,'not during a timed mission');
 const inCar=run(400,{player:{x:300,y:0,onFoot:false}});
 assert.equal(inCar.signals.length,0,'not while driving');
 const far=run(400,{player:{x:5000,y:5000,onFoot:true}});
 assert.equal(far.signals.length,0,'only near the player');
});

test('Q05 only a resident walking on its pavement, with road ahead, can drop something',()=>{
 const [npc]=cohort(),plan=npc.residentRoutine,e=graph.edges[plan.edge];
 plan.phase='OUTBOUND';npc.t=plan.homeT;
 assert.equal(canLoseSomething(npc,graph),true);
 for(const change of [{indoors:true},{needsRoutineRecovery:true},{impactTime:.4}])assert.equal(canLoseSomething({...npc,...change},graph),false);
 for(const phase of ['AT_HOME','ACTING'])assert.equal(canLoseSomething({...npc,residentRoutine:{...plan,phase}},graph),false);
 assert.equal(canLoseSomething({...npc,residentRoutine:{...plan,lateral:1.6,lateralGoal:1.6}},graph),false,'not while stepping around a scooter');
 assert.equal(canLoseSomething({...npc,residentRoutine:{...plan,doorStep:{mode:'ENTER'}}},graph),false);
 const close=plan.targetT-Math.sign(plan.targetT-plan.homeT)*(MIN_ROAD_AHEAD-1)/e.len;
 assert.equal(canLoseSomething({...npc,t:close},graph),false,'too close to its door to notice in time');
});

function firstEvent(people){
 const events=createCityEvents(505);events.nextCheck=0;
 let fired=null;
 for(let i=0;i<4000&&!fired;i++){
  stepAgents(graph,people,dt,null,{view});
  const s=stepCityEvents(events,dt,{people,graph,player:{x:people[0].x,y:people[0].y+4,onFoot:true},view,allowed:true});
  if(s?.type==='dropped')fired=s;
 }
 assert.ok(fired,'an event starts');
 return events;
}

test('Q05 lost item, found again: the owner walks back along its pavement, picks it up and resumes its routine',()=>{
 const people=cohort(),[npc]=people,plan=npc.residentRoutine;
 const events=firstEvent(people),ev=events.active,spot={...ev.spot},phase=plan.phase;
 assert.ok(LOST_ITEMS.some(i=>i.id===ev.item.id));
 let previous={x:npc.x,y:npc.y},farthest=0,outcome=null,noticed=false;
 for(let i=0;i<6000&&!outcome;i++){
  stepAgents(graph,people,dt,null,{view});
  const s=stepCityEvents(events,dt,{people,graph,player:{x:5000,y:5000,onFoot:true},view,allowed:true});
  assert.ok(Math.hypot(npc.x-previous.x,npc.y-previous.y)<=npc.speed*dt+1e-6,'no jump, also when turning back');
  previous={x:npc.x,y:npc.y};farthest=Math.max(farthest,Math.hypot(npc.x-spot.x,npc.y-spot.y));
  if(s?.type==='noticed'){noticed=true;assert.ok(events.bubbles.some(b=>b.agent===npc&&b.text===ev.item.cry),'a short cry, once');}
  if(s?.type==='recovered')outcome=s;
 }
 assert.ok(noticed&&outcome,'noticed, then recovered');
 assert.ok(farthest>8,'it really walked on before noticing: '+farthest.toFixed(1)+' m');
 assert.ok(Math.hypot(npc.x-spot.x,npc.y-spot.y)<.05,'picked up right where it fell');
 assert.equal(plan.detour,null,'detour cleared');assert.equal(plan.phase,phase,'same leg of its outing');
 assert.deepEqual(events.log.at(-1).outcome,'ritrovato');
 const cycles=plan.cycles;
 for(let i=0;i<6000&&plan.cycles===cycles;i++)stepAgents(graph,people,dt,null,{view});
 assert.equal(plan.cycles,cycles+1,'and the daily routine completes as before');
});

test('Q05 the player picks the item up and gives it back: thanks, a 5 € tip, routine resumes',()=>{
 const people=cohort(),[npc]=people,plan=npc.residentRoutine;
 const events=firstEvent(people),ev=events.active;
 const player={x:ev.spot.x+.5,y:ev.spot.y+.5};
 // L'oggetto resta a terra mentre il proprietario si allontana senza accorgersene.
 for(let i=0;i<6/dt;i++){stepAgents(graph,people,dt,null,{view});stepCityEvents(events,dt,{people,graph,player:{...player,onFoot:true},view,allowed:true});}
 assert.ok(Math.hypot(npc.x-player.x,npc.y-player.y)>EVENT_RULES.returnRange,'owner already a few metres away');
 assert.equal(cityEventAction(events,{x:ev.spot.x+20,y:ev.spot.y}),null,'no action from afar');
 assert.equal(cityEventAction(events,player),'RACCOGLI');
 assert.equal(interactCityEvent(events,player).type,'picked');
 assert.equal(cityEventAction(events,player),null,'cannot be picked twice, and the owner is not here yet');
 let gave=null;
 for(let i=0;i<4000&&!gave;i++){
  stepAgents(graph,people,dt,null,{view});
  stepCityEvents(events,dt,{people,graph,player:{...player,onFoot:true},view,allowed:true});
  // il giocatore aspetta sul posto: il proprietario torna a cercare proprio lì
  if(cityEventAction(events,player)==='RESTITUISCI')gave=interactCityEvent(events,player);
 }
 assert.ok(gave,'the owner comes back to the spot and the item can be returned');
 assert.equal(gave.type,'returned');assert.equal(gave.reward,EVENT_RULES.reward);
 assert.equal(events.active,null);assert.equal(plan.detour,null);
 assert.ok(events.bubbles.some(b=>b.agent===npc&&/Grazie/.test(b.text)));
 assert.equal(events.log.at(-1).outcome,'restituito');
 const cycles=plan.cycles;
 for(let i=0;i<6000&&plan.cycles===cycles;i++)stepAgents(graph,people,dt,null,{view});
 assert.equal(plan.cycles,cycles+1,'routine recovered after the thanks');
});

test('Q05 the player keeps it: the owner searches for a while, gives up, and the event ends by its time limit',()=>{
 const people=cohort(),[npc]=people,plan=npc.residentRoutine;
 const events=firstEvent(people),ev=events.active;
 interactCityEvent(events,{x:ev.spot.x,y:ev.spot.y});
 const signals=[];let held=0;
 for(let i=0;i<9000&&events.active;i++){
  stepAgents(graph,people,dt,null,{view});
  const s=stepCityEvents(events,dt,{people,graph,player:{x:5000,y:5000,onFoot:true},view,allowed:true});
  if(s)signals.push(s.type);
  if(plan.detour?.hold){held+=dt;assert.ok(npc.braking,'standing there, looking around');}
  if(events.active&&events.active.id!==ev.id)break;
 }
 assert.deepEqual(signals.slice(0,2),['noticed','gave-up']);
 assert.ok(held>=EVENT_RULES.searchPatience-.1&&held<=EVENT_RULES.searchPatience+.2,'searches about '+EVENT_RULES.searchPatience+' s');
 assert.equal(plan.detour,null);
 assert.equal(events.log.at(-1)?.outcome,'tenuto','without doors this owner never goes inside: the event times out, item kept');
 assert.ok(events.log.at(-1).seconds<=EVENT_RULES.maxSeconds+.1);
});

test('Q05 with doors: when the owner walks into a building the event closes and nothing is left behind',()=>{
 const e=graph.edges.find(x=>x.name==='Via Roma'&&x.angle===0),face=-(e.streetWidth/2+1.7+2.5);
 const isBuilding=(x,y)=>x>=10&&x<=590&&y>=face-14&&y<=face&&Math.abs(x-120)>2&&Math.abs(x-280)>12||false;
 const walk=(x,y)=>x>=0&&x<=600&&Math.abs(y)<90&&!isBuilding(x,y);
 const doorAt=(o,n)=>{const d=probeDoor(o,n,isBuilding,walk);return d.valid&&doorFacesViewer(d)?d:null;};
 const people=createRoutineResidents(graph,1,405,{x:300,y:0},[],walk,{doorAt}),[npc]=people;
 assert.ok(npc.residentRoutine.homeDoor,'this resident lives behind a door');
 const events=firstEvent(people),ev=events.active;
 interactCityEvent(events,{x:ev.spot.x,y:ev.spot.y});
 for(let i=0;i<12000&&events.active;i++){
  stepAgents(graph,people,dt,null,{view});
  stepCityEvents(events,dt,{people,graph,player:{x:5000,y:5000,onFoot:true},view,allowed:true});
 }
 assert.equal(events.active,null);
 assert.equal(events.log.at(-1).outcome,'tenuto');
 assert.ok(npc.indoors,'closed because the owner went inside');
 assert.equal(npc.residentRoutine.detour,null);
});

test('Q05 game wiring: contextual action first, no events during timed missions, item under people, bubbles above the night',async()=>{
 const game=await readFile(new URL('./game.mjs',import.meta.url),'utf8');
 assert.match(game,/import \{createCityEvents,stepCityEvents,cityEventAction,interactCityEvent[^}]*\} from '\.\/city-events\.mjs\?v=\d+'/);
 assert.ok(game.indexOf('interactCityEvent(state.events,p)')<game.indexOf('const entrance=nearestBankEntrance(state.bankEntrances,p)'),'pick up / give back before doors and vehicles');
 assert.match(game,/\$\('action'\)\.textContent=eventAction\|\|/,'the action button says RACCOGLI / RESTITUISCI');
 assert.match(game,/allowed:!state\.progress\|\|state\.progress\.remaining===null/,'no distractions during a timed mission');
 assert.match(game,/state\.progress\.money\+=event\.reward;saveProgress/,'the tip is saved with the campaign money');
 assert.ok(game.indexOf('drawLostItem(c,')<game.indexOf('drawCityPeople(c,state.people'),'item on the ground, under the people');
 const draw=game.indexOf('function draw(dt=0)');
 assert.ok(game.indexOf('drawNightLighting([x0',draw)<game.indexOf('drawCityEventOverlay(c,',draw),'bubbles stay readable at night');
 assert.match(game,/state\.events=createCityEvents\(505\)/);
});
