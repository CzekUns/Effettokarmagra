import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {buildRoadGraph,createAgents,stepAgents,chooseTurn,yieldsInGridlock} from './roads.mjs';
import {vehiclesOverlap,vehicleShape} from './traffic-collision.mjs';
import {MOTORCYCLE_IDS} from './motorcycles.mjs';
import {CAR_TRAFFIC_SPRITE_IDS} from './car-sprites.mjs';
import {TRAFFIC_APES,FOOD_STALLS,trafficApeModel} from './street-professions.mjs';

const map=JSON.parse(await readFile(new URL('./data/melito-map.json',import.meta.url),'utf8'));
const city=buildRoadGraph(map.roads);
// Same model choice as game.mjs (trafficModel).
const model=(i,type)=>type==='motorcycle'?MOTORCYCLE_IDS[(i+Math.floor(i/4)*5)%MOTORCYCLE_IDS.length]:
 trafficApeModel(i)||CAR_TRAFFIC_SPRITE_IDS[(i*7)%CAR_TRAFFIC_SPRITE_IDS.length];
const spawn=(avoid=[],extra={})=>createAgents(city,140,189,'car',avoid,{motorcycleEvery:4,model,...extra});
const junctionGap=graph=>{
 const near=graph.nodes.map(()=>new Set()),width=graph.nodes.map(()=>0);
 for(const e of graph.edges)if(e.car){near[e.from].add(e.to);near[e.to].add(e.from);
  width[e.from]=Math.max(width[e.from],e.streetWidth);width[e.to]=Math.max(width[e.to],e.streetWidth);}
 return near.map((s,i)=>s.size>=3?width[i]/2:0);
};

test('BF03 real map: deterministic spawn, whole bodies apart, out of the junctions, only on streets with a way on',()=>{
 const a=spawn(),b=spawn();
 assert.deepEqual(a.map(v=>[v.edge,v.t,v.model]),b.map(v=>[v.edge,v.t,v.model]),'same spawn every time');
 assert.ok(a.length>=130,'traffic is not thinned out: '+a.length);
 for(let i=0;i<a.length;i++)for(let j=i+1;j<a.length;j++)
  assert.equal(vehiclesOverlap(a[i],a[j],0),false,'no initial collision '+i+'/'+j);
 const gap=junctionGap(city);
 for(const v of a){
  const e=city.edges[v.edge],reach=vehicleShape(v).halfLength;
  assert.ok(city.liveCar[v.edge],'never on a street that only ends at a one-way terminal');
  assert.ok(city.nodes[e.to].out.some(n=>city.edges[n].car&&city.edges[n].to!==e.from),'a legal exit that is not a U-turn');
  if(gap[e.from])assert.ok(v.t*e.len>=reach+gap[e.from],'body before the junction box');
  if(gap[e.to])assert.ok((1-v.t)*e.len>=reach+gap[e.to],'body before the junction box');
 }
});

test('BF03 real map: no open-counter food truck or loaded market Ape in moving traffic',()=>{
 const counters=new Set(FOOD_STALLS.map(s=>s.model));
 const traffic=spawn();
 for(const v of traffic){
  assert.ok(!/^food-/.test(v.model)&&!counters.has(v.model),v.model);
  if(/^ape-/.test(v.model))assert.ok(v.model==='ape-car-azzurra'||TRAFFIC_APES.includes(v.model),v.model);
 }
 assert.ok(traffic.some(v=>TRAFFIC_APES.includes(v.model)),'closed market Apes do travel');
});

test('BF03 real map: parked vehicles and the player are respected with the whole body',()=>{
 // A parked car on every 9th spawn lane, right where traffic would like to appear.
 const parked=spawn().filter((_,i)=>i%9===0).map(v=>({x:v.x,y:v.y,a:v.a,body:'car',speed:0,model:'furgone-fritti'}));
 const player={x:parked[1].x+20,y:parked[1].y};
 const traffic=spawn(parked,{keepClear:[{x:player.x,y:player.y,r:14}]});
 assert.ok(traffic.length>=125,'room found elsewhere: '+traffic.length);
 for(const v of traffic){
  assert.equal(parked.some(p=>vehiclesOverlap(v,p,0)),false,'not inside a parked vehicle');
  assert.ok(Math.hypot(v.x-player.x,v.y-player.y)>=14,'not on top of the player');
 }
 // Everything east of x=900 is "wall": every corner of every body must stay west of it.
 const walls=spawn([],{clear:(x,y)=>x<900});
 assert.ok(walls.length>=100,'the west part of town still holds traffic: '+walls.length);
 for(const v of walls){
  const s=vehicleShape(v),c=Math.cos(v.a),n=Math.sin(v.a);
  for(const [f,l] of [[1,1],[1,-1],[-1,1],[-1,-1]])assert.ok(v.x+c*s.halfLength*f-n*s.halfWidth*l<900,'corner inside a wall');
 }
});

test('BF03 real map: one minute of traffic, nobody ends up waiting at a one-way terminal',()=>{
 const traffic=spawn(),moved=traffic.map(()=>0);
 for(let k=0;k<1200;k++){
  const before=traffic.map(v=>({x:v.x,y:v.y}));
  stepAgents(city,traffic,.05,null,{view:null});
  traffic.forEach((v,i)=>{moved[i]+=Math.hypot(v.x-before[i].x,v.y-before[i].y);});
 }
 const terminal=traffic.filter(v=>v.t>.999&&!city.nodes[city.edges[v.edge].to].out.some(n=>city.edges[n].car));
 assert.equal(terminal.length,0,'cars at a one-way terminal');
 assert.ok(moved.every(m=>m>20),'every vehicle really travels: min '+Math.min(...moved).toFixed(1)+' m');
 for(const v of traffic.filter(v=>v.model==='furgone-fritti'||v.model==='ape-car-azzurra'))
  assert.ok(moved[traffic.indexOf(v)]>20,v.model+' moves');
});

// A two-way main street, a one-way chain off it that only ends at a terminal, and a short block
// between two junctions.
const local=buildRoadGraph([
 {id:1,n:'Via Roma',t:'residential',w:8,p:[0,0,200,0,206,0,400,0]},
 {id:2,n:'Vicolo chiuso',t:'residential',o:true,w:6,p:[200,0,200,60,200,120]},
 {id:3,n:'Traversa',t:'residential',w:8,p:[206,0,206,-150]},
 {id:4,n:'Ritorno',t:'residential',w:8,p:[0,0,0,-150,206,-150]}
]);

test('BF03 one-way chain ending nowhere: marked as a trap, never chosen at the junction, never a spawn',()=>{
 const trap=local.edges.map((e,i)=>i).filter(i=>local.edges[i].roadId===2&&local.edges[i].car);
 assert.ok(trap.length===2&&trap.every(i=>!local.liveCar[i]),'both segments lead only to the terminal');
 assert.ok(local.edges.every((e,i)=>!e.car||e.roadId===2||local.liveCar[i]),'the rest is fine');
 const into=local.edges.findIndex(e=>e.roadId===1&&local.nodes[e.from].x===0&&local.nodes[e.to].x===200);
 for(let seed=1;seed<60;seed++){
  const next=chooseTurn(local,local.edges[into].to,into,{body:'car',seed},e=>e.car);
  assert.notEqual(local.edges[next].roadId,2,'seed '+seed);
 }
 // The player is not an NPC: on foot the alley is still there, and the graph keeps it.
 assert.ok(local.edges.some(e=>e.roadId===2&&e.walk));
 const cars=createAgents(local,30,5,'car',[]);
 assert.ok(cars.length>0&&cars.every(v=>local.edges[v.edge].roadId!==2));
 const short=local.edges.map((e,i)=>i).filter(i=>local.edges[i].roadId===1&&local.edges[i].len<10);
 assert.ok(short.length&&cars.every(v=>!short.includes(v.edge)),'the 6 m block between two junctions is too short for a body');
});

test('BF03 a street whose only way on is a trap is not a through street: no spawn there, avoided when possible',()=>{
 const g=buildRoadGraph([
  {id:1,n:'Via Roma',t:'residential',w:8,p:[0,0,200,0,400,0]},
  {id:5,n:'Via Lavinaio',t:'residential',w:8,p:[200,0,200,80]},
  {id:6,n:'Vicolo a senso unico',t:'residential',o:true,w:6,p:[200,80,200,160]},
  {id:7,n:'Circonvallazione',t:'residential',w:8,p:[400,0,400,-100,0,-100,0,0]}
 ]);
 const north=g.edges.findIndex(e=>e.car&&e.roadId===5&&g.nodes[e.from].y===0);
 assert.ok(g.liveCar[north],'live: a car can still turn back at its end');
 assert.equal(g.throughStarts.includes(north),false,'but its only way on is the trap: not a through street');
 const east=g.edges.findIndex(e=>e.car&&e.roadId===1&&g.nodes[e.from].x===0&&g.nodes[e.to].x===200);
 for(let seed=1;seed<40;seed++)assert.notEqual(chooseTurn(g,g.edges[east].to,east,{body:'car',seed},e=>e.car),north,'keeps to Via Roma');
 assert.ok(createAgents(g,20,3,'car',[]).every(v=>v.edge!==north&&g.edges[v.edge].roadId!==6),'leaving the side street is fine, driving into it is not');
});

test('BF03 a ring of three cars blocking one another: exactly one backs up, then the next if it has no room',()=>{
 const a={body:'car',seed:10},b={body:'car',seed:30},c={body:'car',seed:20};
 a.blockedBy=b;b.blockedBy=c;c.blockedBy=a;
 assert.deepEqual([a,b,c].map(yieldsInGridlock),[false,true,false],'highest seed yields');
 b.cannotYield=true;
 assert.deepEqual([a,b,c].map(yieldsInGridlock),[false,false,true],'nobody behind it to back into: the next one');
 const queue={body:'car',seed:99,blockedBy:a};a.blockedBy=b;
 assert.equal(yieldsInGridlock(queue),false,'a car queuing behind the ring is not part of it');
 const walker={body:'walk',seed:50};const d={body:'car',seed:60,blockedBy:walker};walker.blockedBy=d;
 assert.equal(yieldsInGridlock(d),false,'a pedestrian is waited for, not reversed away from');
});

test('BF03 game wiring: traffic built in one place, with models, the player and walls, on load and on the width switch',async()=>{
 const game=await readFile(new URL('./game.mjs',import.meta.url),'utf8');
 assert.equal((game.match(/state\.traffic=createTraffic\(\);/g)||[]).length,2);
 assert.match(game,/const TRAFFIC_COUNT=140;/);
 assert.match(game,/createAgents\(state\.graph,TRAFFIC_COUNT,189,'car',state\.cars,\{motorcycleEvery:4,model:trafficModel,\s*keepClear:\[\{x:p\.x,y:p\.y,r:14\}\],clear:\(x,y\)=>!buildingAt\(x,y\)\}\)/);
 assert.ok(!/state\.traffic\.forEach\(\(v,i\)=>\{const bike/.test(game),'no model assigned after the spawn checks');
});
