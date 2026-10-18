import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {buildRoadGraph,createAgents,stepAgents,stepAgent,chooseTurn} from './roads.mjs';
import {drawCityPeople} from './city-art.mjs';
import {makeCollisionIndex,nearbyColliders,moveInCollisionIndex,vehiclesOverlap,vehicleHitsPedestrian,collidesWithTraffic,trafficMoveBlocked} from './traffic-collision.mjs';

const graph=buildRoadGraph([
 {id:1,n:'Est',t:'residential',w:7,p:[0,0,100,0]},
 {id:2,n:'Nord',t:'residential',w:7,p:[50,-50,50,50]}
]);
const car=(edge,t,x,y,a)=>({edge,t,x,y,a,speed:12,seed:17,side:1,wait:0,body:'car'});

test('the nearby index moves an NPC between cells without scanning the whole city',()=>{
 const a={x:4,y:4,body:'car'},far={x:400,y:400,body:'car'};
 const index=makeCollisionIndex([a,far]);
 assert.deepEqual([...nearbyColliders(index,4,4)],[a]);
 a.x=40;moveInCollisionIndex(index,a,4,4);
 assert.equal(nearbyColliders(index,4,4).has(a),false);
 assert.equal(nearbyColliders(index,40,4).has(a),true);
});

test('car shape collides with cars and pedestrians but clears a parallel traffic lane',()=>{
 const a={x:0,y:0,a:0};
 assert.ok(vehiclesOverlap(a,{x:5,y:0,a:0}));
 assert.ok(!vehiclesOverlap(a,{x:0,y:3.6,a:0}));
 assert.ok(vehicleHitsPedestrian(a,{x:3.5,y:0}));
 assert.ok(!vehicleHitsPedestrian(a,{x:0,y:3.1}));
 const index=makeCollisionIndex([{x:5,y:0,a:0,body:'car'},{x:2,y:0,body:'walk'}]);
 assert.ok(collidesWithTraffic(a,'car',index));
});
test('a lane jump cannot pass through the player car between two clear poses',()=>{
 const player={x:10,y:0,a:0,body:'car'};
 const index=makeCollisionIndex([player]);
 assert.equal(collidesWithTraffic({x:0,y:0,a:0},'car',index),null);
 assert.equal(collidesWithTraffic({x:20,y:0,a:0},'car',index),null);
 assert.equal(trafficMoveBlocked({x:0,y:0,a:0},{x:20,y:0,a:0},'car',index,null),true);
});
test('compact paired road arcs circulate one way and AI prefers through routes',()=>{
 const ring=buildRoadGraph([
  {id:21,t:'primary',w:13,p:[0,0,0,20,20,20]},
  {id:22,t:'primary',w:13,p:[20,20,20,0,0,0]}
 ]);
 assert.equal(ring.trafficStarts.length,4);
 assert.equal(ring.walkStarts.length,8);
 const branch=buildRoadGraph([
  {id:31,t:'residential',w:7,p:[0,0,20,0]},
  {id:32,t:'residential',w:7,p:[20,0,40,0,60,0]},
  {id:33,t:'residential',w:7,p:[20,0,20,20]}
 ]);
 const incoming=branch.trafficStarts.find(id=>branch.edges[id].roadId===31&&branch.nodes[branch.edges[id].from].x===0);
 const next=chooseTurn(branch,branch.edges[incoming].to,incoming,{body:'car',seed:17},e=>e.car);
 assert.equal(branch.edges[next].roadId,32);
});
test('an AI car stops at a one-way endpoint instead of teleporting to another street',()=>{
 const g=buildRoadGraph([
  {id:41,t:'residential',o:true,w:7,p:[0,0,20,0]},
  {id:42,t:'residential',o:true,w:7,p:[100,0,120,0]}
 ]);
 const ai=car(g.trafficStarts[0],.99,19.8,3.542,0);
 for(let i=0;i<30;i++)stepAgent(g,ai,.05);
 assert.equal(ai.edge,g.trafficStarts[0]);
 assert.ok(ai.x>=19.8&&ai.x<=20);
});
test('pedestrians keep the pavement through a corner without a position jump',()=>{
 const g=buildRoadGraph([
  {id:51,t:'residential',w:7,p:[0,0,30,0]},
  {id:52,t:'residential',w:7,p:[30,0,30,-30]}
 ]);
 const edge=g.walkStarts.find(id=>g.edges[id].roadId===51&&g.nodes[g.edges[id].from].x===0);
 const person={edge,t:.99,x:29.7,y:9.4,a:0,speed:1,seed:11,side:1,wait:0,body:'walk'};
 for(let i=0;i<4&&!person.corner;i++)stepAgent(g,person,.1);
 assert.ok(person.corner,'outside sidewalk corner is followed explicitly');
 let previous=[person.x,person.y];
 for(let i=0;i<300;i++){
  stepAgent(g,person,.1);
  assert.ok(Math.hypot(person.x-previous[0],person.y-previous[1])<=.101);
  assert.ok(person.x>=29.7&&person.y>=-9.4,'walk remains on the outside corner');
  previous=[person.x,person.y];
  if(!person.corner)break;
 }
 assert.ok(!person.corner,'the walker eventually reaches the next sidewalk');
});

test('NPC cars queue before a parked car and separate at a crossing',()=>{
 const parked={x:35,y:3.542,a:0,body:'car'};
 const follower=car(graph.trafficStarts[0],.2,20,3.542,0);
 for(let i=0;i<50;i++){
  stepAgents(graph,[follower],.05,null,{parked:[parked]});
  assert.ok(!vehiclesOverlap(follower,parked),'NPC cannot enter parked car');
 }
 assert.ok(follower.x>20&&follower.x<30,'NPC approaches and brakes before obstacle');
 const east=car(graph.trafficStarts[0],.4,40,3.542,0);
 const north=car(graph.trafficStarts[2],.4,46.458,-10,Math.PI/2);
 for(let i=0;i<60;i++){
  stepAgents(graph,[east,north],.05);
  assert.ok(!vehiclesOverlap(east,north),'crossing traffic yields to other cars');
 }
 assert.ok(east.x>60&&north.y>10,'both cars eventually cross');
});
test('a traffic deadlock is recycled only outside the visible camera',()=>{
 const parked={x:35,y:3.542,a:0,body:'car'};
 const stuck=car(graph.trafficStarts[0],.2,20,3.542,0);
 for(let i=0;i<220;i++)stepAgents(graph,[stuck],.05,null,
  {parked:[parked],view:[10,-15,50,20]});
 assert.ok(stuck.x<30,'a visible queued car must not teleport');
 for(let i=0;i<220;i++)stepAgents(graph,[stuck],.05,null,
  {parked:[parked],view:[-100,-100,-70,-70]});
 assert.ok(stuck.x>40||stuck.edge!==graph.trafficStarts[0],
  'the hidden blocked car can resume on a safe route');
 assert.ok(!vehiclesOverlap(stuck,parked));
});

test('pedestrian walks on the sidewalk and yields before a car; traffic yields to the player on foot',async()=>{
 const walker={edge:graph.walkStarts[0],t:.2,x:20,y:9.4,a:0,speed:1,seed:9,side:1,wait:0,body:'walk'};
 const traffic={x:24,y:9.4,a:0,body:'car'};
 for(let i=0;i<50;i++){
  stepAgents(graph,[walker],.05,null,{traffic:[traffic]});
  assert.ok(!vehicleHitsPedestrian(traffic,walker,.8));
 }
 assert.ok(walker.x>20&&walker.x<22);
 const driver=car(graph.trafficStarts[0],.2,20,3.542,0);
 const player={x:35,y:3.542,a:0,car:-1};
 for(let i=0;i<50;i++)stepAgents(graph,[driver],.05,player);
 assert.ok(driver.x<32,'driver stops for the player pedestrian');
 const game=await readFile(new URL('./game.mjs',import.meta.url),'utf8');
 assert.match(game,/collidesWithTraffic\(\{x,y,a\},'car',state\.dynamicCollision/);
});

test('pedestrian sprite is painted at its collision position on the sidewalk',()=>{
 const positions=[];
 const ctx=new Proxy({translate(x,y){positions.push([x,y]);}},
  {get:(o,key)=>key in o?o[key]:(..._)=>{}});
 const person={x:20,y:9.4,a:0,edge:graph.walkStarts[0],speed:1,seed:7,kind:0};
 drawCityPeople(ctx,[person],graph,1,[0,0,40,40]);
 assert.deepEqual(positions,[[20,9.4]]);
 positions.length=0;person.prevX=19;person.prevY=9.4;person.prevA=0;
 drawCityPeople(ctx,[person],graph,1,[0,0,40,40],.5);
 assert.deepEqual(positions,[[19.5,9.4]],'render interpolates between physical simulation steps');
});

test('full Melito traffic starts separated and remains collision free for ten simulated seconds',async()=>{
 const map=JSON.parse(await readFile(new URL('./data/melito-map.json',import.meta.url),'utf8'));
 const city=buildRoadGraph(map.roads);
 const cars=createAgents(city,140,189,'car');
 const people=createAgents(city,190,310,'walk',cars);
 assert.equal(cars.length,140);assert.equal(people.length,190);
 for(let frame=0;frame<=200;frame++){
  if(frame){stepAgents(city,people,.05,null,{traffic:cars});stepAgents(city,cars,.05,null,{people});}
  if(frame%20)continue;
  const index=makeCollisionIndex([...cars,...people]);
  for(const agent of [...cars,...people])
   assert.equal(collidesWithTraffic(agent,agent.body,index,agent),null,`NPC collision at frame ${frame}`);
 }
});
