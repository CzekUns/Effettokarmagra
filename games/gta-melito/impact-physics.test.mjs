import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {applyNonlethalImpact,advanceNonlethalImpact,sweptVehicleContact,IMPACT_MIN_SPEED} from './impact-physics.mjs';
import {buildRoadGraph,createAgents,chooseTurn,restoreAgentRoutine,stepAgents} from './roads.mjs';
import {makeCollisionIndex} from './traffic-collision.mjs';

test('impact throws a pedestrian farther at higher collision speeds without removal',()=>{
 const vehicle={x:0,y:0,a:0,speed:26,body:'car'};
 const little={x:3,y:0,a:0,body:'walk'},large={...little};
 const low=applyNonlethalImpact(vehicle,little,6);
 const high=applyNonlethalImpact(vehicle,large,35);
 assert.ok(low&&high&&high.strength>low.strength*2);
 for(let i=0;i<26;i++){
  advanceNonlethalImpact(little,.05);
  advanceNonlethalImpact(large,.05);
 }
 assert.ok(large.x>little.x+6,'a fast car should shove a person visibly further');
 assert.ok(large.x>3&&little.x>3);
 assert.equal(large.impactTime,0);
 assert.ok(Number.isFinite(large.x),'no death or disappearance');
});
test('stationary taps do not trigger impact and immunity prevents repeated shoves',()=>{
 const source={x:0,y:0,a:0,speed:0,body:'car'},person={x:2,y:0,body:'walk'};
 assert.equal(applyNonlethalImpact(source,person,IMPACT_MIN_SPEED-1),null);
 assert.equal(person.impactTime,undefined);
 assert.ok(applyNonlethalImpact(source,person,10));
 assert.equal(applyNonlethalImpact(source,person,40),null);
 for(let i=0;i<26;i++)advanceNonlethalImpact(person,.05);
 assert.equal(person.impactLock,0);
});
test('swept vehicle pose strikes actors between the two simulation positions',()=>{
 const car={x:0,y:0,a:0,body:'car',vehicleType:'car'};
 const person={x:7,y:0,body:'walk'};
 assert.equal(sweptVehicleContact(car,person,{x:0,y:0,a:0},{x:14,y:0,a:0}),true);
 assert.equal(sweptVehicleContact(car,{x:7,y:14,body:'walk'},{x:0,y:0,a:0},{x:14,y:0,a:0}),false);
 const parked={x:7,y:0,a:0,model:'panda-fire-red',speed:0};
 assert.equal(sweptVehicleContact(car,parked,{x:0,y:0,a:0},{x:14,y:0,a:0}),true);
 const hit=applyNonlethalImpact({...car,speed:28},parked,28);
 assert.ok(hit&&parked.impactTime>0,'parked cars can be pushed, too');
 assert.ok(hit.strength<applyNonlethalImpact({x:0,y:0,a:0,speed:28},
  {x:7,y:0,body:'walk'},28).strength,'cars receive heavier impulses than pedestrians');
});
function localMap(){
 return buildRoadGraph([
  {id:1,t:'residential',p:[0,0,90,0,180,0,270,0]},
  {id:2,t:'residential',p:[90,-120,90,0,90,120]},
  {id:3,t:'residential',p:[180,-120,180,0,180,120]},
  {id:4,t:'residential',p:[0,120,90,120,180,120,270,120]},
  {id:5,t:'residential',p:[0,-120,90,-120,180,-120,270,-120]},
 ]);
}
test('each pedestrian and traffic NPC has a persistent neighborhood and local return lanes',()=>{
 const graph=localMap();
 const drivers=createAgents(graph,12,190,'car',[],{motorcycleEvery:4});
 const people=createAgents(graph,12,310,'walk',drivers);
 assert.ok(drivers.length>=6&&people.length>=6);
 for(const npc of [...drivers,...people]){
  assert.ok(npc.home);
  assert.ok(npc.home.radius>=50);
  assert.ok(npc.home.returnEdges.length);
  assert.ok(npc.home.returnEdges.includes(npc.home.edge));
  assert.ok(npc.home.returnEdges.every(id=>npc.body==='car'?graph.edges[id].car:graph.edges[id].walk));
 }
});
test('an NPC knocked far away can safely return offscreen to its original routine district',()=>{
 const graph=localMap(),agents=createAgents(graph,3,91,'car');
 const npc=agents[0],home={...npc.home};
 npc.x=900;npc.y=900;npc.needsRoutineRecovery=true;
 const handled=restoreAgentRoutine(graph,npc,.05,{view:[-20,-20,20,20]},makeCollisionIndex([]));
 assert.equal(handled,true);
 assert.equal(npc.needsRoutineRecovery,false);
 assert.ok(Math.hypot(npc.x-home.x,npc.y-home.y)<home.radius*.4);
 assert.equal(npc.prevX,npc.x);
 assert.equal(npc.prevY,npc.y);
 assert.ok(graph.edges[npc.edge].car,'recover on a permitted traffic edge');
});
test('visible knocked NPC returns along the road rather than instantly teleporting home',()=>{
 const graph=localMap(),[npc]=createAgents(graph,1,76,'walk');
 npc.x+=16;npc.y+=17;npc.needsRoutineRecovery=true;
 const old={x:npc.x,y:npc.y};
 const handled=restoreAgentRoutine(graph,npc,.05,{view:[-500,-500,500,500]},makeCollisionIndex([]));
 assert.equal(handled,true);
 assert.ok(Math.hypot(npc.x-old.x,npc.y-old.y)<1,
  'recovering a visible actor should advance incrementally, not jump');
});
test('game hooks the knockback into driven car, NPC traffic and player on foot',()=>{
 const game=fs.readFileSync(new URL('./game.mjs',import.meta.url),'utf8');
 assert.match(game,/function impactTraffic\(dt\)/);
 assert.match(game,/applyNonlethalImpact\(/);
 assert.match(game,/advanceNonlethalImpact\(p,dt,canKnockbackMove\)/);
 assert.match(game,/advanceNonlethalImpact\(agent,elapsed,canKnockbackMove\)/);
 assert.match(game,/sweptVehicleContact\(source,target,from,to\)/);
 assert.match(game,/stepAgents\(state\.graph,state\.people/);
 assert.match(game,/stepAgents\(state\.graph,state\.traffic/);
 assert.match(game,/impact-physics\.mjs\?v=001/);
});
