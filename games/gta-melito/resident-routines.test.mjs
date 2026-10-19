import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {buildRoadGraph,stepAgents} from './roads.mjs';
import {createRoutineResidents} from './resident-routines.mjs';
import {makeCollisionIndex} from './traffic-collision.mjs';

const graph=buildRoadGraph([
 {id:1,n:'Via Roma',t:'primary',w:13,p:[0,0,600,0]},
 {id:2,n:'Piazza Santo Stefano',t:'residential',w:7,p:[280,-80,280,80]}
]);
const spawn=(n=8)=>createRoutineResidents(graph,n,405,{x:300,y:0},[],()=>true);

test('Q01 residents have stable street-side home and target without creating extra agents',()=>{
 const first=spawn(),second=spawn();
 assert.equal(first.length,8);
 assert.deepEqual(first,second,'same seed and graph yield the same cohort');
 assert.ok(first.every(p=>p.body==='walk'&&p.routine==='resident'));
 assert.ok(first.every(p=>p.home.edge===p.residentRoutine.edge));
 assert.ok(first.every(p=>Math.abs(p.residentRoutine.targetT-p.residentRoutine.homeT)*graph.edges[p.edge].len>=12));
 const collision=makeCollisionIndex(first);
 assert.equal(collision.bins.size>0,true);
});

test('Q01 resident completes home -> target -> activity -> return without position jumps',()=>{
 const [npc]=spawn(1),seen=new Set(),initial={x:npc.x,y:npc.y};
 let previous={x:npc.x,y:npc.y},finished=false;
 for(let i=0;i<4500;i++){
  stepAgents(graph,[npc],.05,null,{view:[0,-100,600,100]});
  seen.add(npc.residentRoutine.phase);
  assert.ok(Math.hypot(npc.x-previous.x,npc.y-previous.y)<=npc.speed*.05+.00001,
   'a visible pedestrian must never teleport between poses');
  previous={x:npc.x,y:npc.y};
  if(npc.residentRoutine.cycles){finished=true;break;}
 }
 assert.equal(finished,true);
 assert.ok(seen.has('OUTBOUND')&&seen.has('ACTING')&&seen.has('RETURNING'));
 assert.ok(Math.hypot(npc.x-initial.x,npc.y-initial.y)<.01,'returns to the same starting point');
});

test('Q01 does not spawn residents on invalid pavements or on top of cars',()=>{
 assert.deepEqual(createRoutineResidents(graph,8,405,{x:300,y:0},[],()=>false),[]);
 const blocked=createRoutineResidents(graph,8,405,{x:300,y:0},
  [{x:300,y:13,a:0,body:'car'}],()=>true);
 assert.ok(blocked.length<=8);
 assert.ok(blocked.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)));
});

test('Q01 visible knocked resident recovers gradually to its original pavement',()=>{
 const [npc]=spawn(1),start={x:npc.x,y:npc.y};
 npc.x+=9;npc.y+=7;npc.needsRoutineRecovery=true;
 stepAgents(graph,[npc],.05,null,{view:[0,-100,600,100],validRecovery:()=>true});
 assert.ok(Math.hypot(npc.x-start.x-9,npc.y-start.y-7)<.5);
 assert.equal(npc.residentRoutine.edge,npc.edge);
 for(let i=0;i<200;i++)stepAgents(graph,[npc],.05,null,{view:[0,-100,600,100],validRecovery:()=>true});
 assert.equal(npc.needsRoutineRecovery,false);
 assert.equal(npc.home.edge,npc.edge);
});

test('Q01 game integrates residents into both initial and road-width reset populations',async()=>{
 const game=await readFile(new URL('./game.mjs',import.meta.url),'utf8');
 const roads=await readFile(new URL('./roads.mjs',import.meta.url),'utf8');
 assert.match(game,/import \{createRoutineResidents\} from '.\/resident-routines\.mjs\?v=002'/);
 assert.equal((game.match(/state\.people=createCityPedestrians\(\);/g)||[]).length,2);
 assert.match(roads,/stepResidentRoutine\(graph,agent,elapsed,index,clockMinutes\)/);
 assert.match(roads,/restoreResidentRoutine\(graph,agent,dt,world,index\)/);
});
