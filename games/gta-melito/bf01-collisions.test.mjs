import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {buildRoadGraph,createAgents,stepAgents,unstickVehicle} from './roads.mjs';
import {makeCollisionIndex,vehiclesOverlap,vehicleSeparation,vehicleShape,trafficMoveBlocked} from './traffic-collision.mjs';
import {applyNonlethalImpact,advanceNonlethalImpact} from './impact-physics.mjs';
import {vs} from './world-scale.mjs';

const graph=buildRoadGraph([
 {id:1,n:'Via Roma',t:'residential',w:8,p:[0,0,300,0,600,0]},
 {id:2,n:'Traversa',t:'residential',w:8,p:[300,-250,300,0,300,250]}
]);
const view=[-1000,-1000,1000,1000],dt=.05;
const firstCar=()=>createAgents(graph,1,77,'car',[])[0];

test('BF01 separation: the shortest way out of an overlap, null when bodies are apart',()=>{
 // BF14: the bodies are VEHICLE_SCALE of the measured ones; the set-up scales with them.
 const a={x:0,y:0,a:0},b={x:vs(5),y:0,a:0};
 const sep=vehicleSeparation(a,b);
 assert.ok(sep&&sep.nx<0&&Math.abs(sep.ny)<1e-9,'pushed back along the length');
 assert.ok(Math.abs(sep.depth-vs(3.15*2-5))<1e-9);
 assert.equal(vehicleSeparation(a,{x:vs(7),y:0,a:0}),null);
 assert.equal(vehicleSeparation({x:0,y:0,a:0},{x:0,y:vs(3.5),a:0}),null,'side by side in two lanes: no contact');
});

test('BF01 Ape and food trucks: collision boxes follow the sprites, cars unchanged',()=>{
 assert.deepEqual(vehicleShape({model:'panda-modern-white'}),{halfLength:vs(3.15),halfWidth:vs(1.7)});
 assert.ok(vehicleShape({model:'ape-car-azzurra'}).halfWidth<vs(1.7)&&vehicleShape({model:'ape-car-azzurra'}).halfLength<vs(3.15));
 assert.ok(vehicleShape({model:'ape-verde-pesce'}).halfLength<vs(3.15));
 assert.ok(vehicleShape({model:'food-panini'}).halfWidth<vs(1.7),'awning not part of the solid body');
 assert.equal(vehicleShape({vehicleType:'motorcycle',model:'moto-scooter-sh-red'}).halfLength,vs(2.8));
 // the model travels with every swept pose, so a small Ape is not tested as a full car
 const ape={x:0,y:0,a:0,model:'ape-car-azzurra',body:'car'},wall={x:vs(6),y:0,a:0,body:'car',model:'panda-modern-white'};
 assert.equal(trafficMoveBlocked(ape,{x:vs(.4),y:0,a:0},'car',makeCollisionIndex([wall]),ape),false,'an Ape fits where a full car would touch');
 assert.equal(trafficMoveBlocked({...ape,model:'panda-modern-white'},{x:vs(.4),y:0,a:0},'car',makeCollisionIndex([wall]),ape),true);
});

test('BF01 an NPC car shoved onto a car parked at the kerb slides out and drives on (no permanent jam)',()=>{
 const npc=firstCar(),e=graph.edges[npc.edge],nx=-Math.sin(e.angle),ny=Math.cos(e.angle);
 // parked at the kerb, well outside the lane; the knock left the NPC half on top of it
 const parked={x:npc.x+nx*5+Math.cos(npc.a)*1,y:npc.y+ny*5+Math.sin(npc.a)*1,a:npc.a,body:'car',speed:0,model:'panda-fire-red'};
 Object.assign(npc,{x:npc.x+nx*2.5,y:npc.y+ny*2.5,needsRoutineRecovery:true});
 assert.ok(vehiclesOverlap(npc,parked,0),'set-up: bodies overlap');
 const start={x:npc.x,y:npc.y};let free=null;
 for(let i=0;i<400;i++){
  stepAgents(graph,[npc],dt,null,{view,parked:[parked],validRecovery:()=>true});
  if(free===null&&!vehiclesOverlap(npc,parked,0))free=i*dt;
  if(free!==null)assert.equal(vehiclesOverlap(npc,parked,0),false,'never back inside');
 }
 assert.ok(free!==null&&free<3,'out of the overlap in '+free+' s');
 assert.equal(npc.needsRoutineRecovery,false,'back on its lane');
 assert.ok(Math.hypot(npc.x-start.x,npc.y-start.y)>20,'and on its way again');
});

test('BF01 recovery after a knock is allowed to move away from what it touches',()=>{
 const npc=firstCar();
 const parked={x:npc.x+2,y:npc.y+3,a:npc.a,body:'car',speed:0};
 Object.assign(npc,{x:npc.x+1,y:npc.y+2.2,needsRoutineRecovery:true});
 let done=false;
 for(let i=0;i<400&&!done;i++){stepAgents(graph,[npc],dt,null,{view:[1e6,1e6,1e6+1,1e6+1],parked:[parked],validRecovery:()=>true});done=!npc.needsRoutineRecovery;}
 assert.equal(done,true,'the NPC rejoins its lane even starting inside another body');
 assert.equal(vehiclesOverlap(npc,parked,0),false);
});

test('BF01 a struck NPC car drives off again at its own cruising speed (it used to stay stopped for good)',()=>{
 const npc=firstCar(),cruise=npc.speed,c=Math.cos(npc.a),s=Math.sin(npc.a);
 assert.ok(cruise>0&&npc.home,'set-up: a moving NPC with its own district');
 applyNonlethalImpact({x:npc.x-c*6,y:npc.y-s*6,a:npc.a,speed:12,vx:c*12,vy:s*12},npc,12);
 assert.equal(npc.speed,0,'the knock stops it');
 for(let i=0;i<60&&npc.impactTime>0;i++)advanceNonlethalImpact(npc,dt);
 assert.equal(npc.needsRoutineRecovery,true);
 let back=null;
 for(let i=0;i<300;i++){
  stepAgents(graph,[npc],dt,null,{view,validRecovery:()=>true});
  if(!back&&!npc.needsRoutineRecovery)back={x:npc.x,y:npc.y};
 }
 assert.ok(back,'back on its lane');
 assert.equal(npc.speed,cruise,'same speed as before the knock');
 assert.ok(Math.hypot(npc.x-back.x,npc.y-back.y)>20,'and driving again');
});

test('BF01 a shove stops against a car instead of sinking into it',()=>{
 const target={x:0,y:0,a:0,body:'car',home:{x:0,y:0,radius:50},speed:0},other={x:7.5,y:0,a:0,body:'car'};
 const index=makeCollisionIndex([target,other]);
 const canMove=(x,y,actor)=>!trafficMoveBlocked(actor,{x,y,a:actor.a},'car',index,actor);
 applyNonlethalImpact({x:-6,y:0,a:0,speed:20,vx:20,vy:0},target,20);
 for(let i=0;i<60;i++)advanceNonlethalImpact(target,dt,canMove);
 assert.equal(vehiclesOverlap(target,other,0),false,'pushed up to the other car, not into it');
});

test('BF01 two cars blocking each other at a junction: one backs up, both get through',()=>{
 const [a,b]=createAgents(graph,2,91,'car',[]);
 const east=graph.edges.findIndex(e=>e.name==='Via Roma'&&e.angle===0&&graph.nodes[e.from].x===0);
 const south=graph.edges.findIndex(e=>e.name==='Traversa'&&graph.nodes[e.from].y===-250);
 const put=(car,edge,t)=>{const e=graph.edges[edge],p=graph.nodes[e.from],q=graph.nodes[e.to];Object.assign(car,{edge,t,x:p.x+(q.x-p.x)*t,y:p.y+(q.y-p.y)*t,a:e.angle,wait:0,speed:8});};
 put(a,east,.985);put(b,south,.985);
 // lane offsets put them almost nose to side at the junction: a mutual block
 const lane=(car)=>{const e=graph.edges[car.edge],off=Math.min(4,Math.max(.65,e.streetWidth*.23));car.x+=-Math.sin(e.angle)*off;car.y+=Math.cos(e.angle)*off;};
 lane(a);lane(b);
 const start={a:{x:a.x,y:a.y},b:{x:b.x,y:b.y}};
 for(let i=0;i<600;i++){
  stepAgents(graph,[a,b],dt,null,{view,validRecovery:()=>true});
  assert.equal(vehiclesOverlap(a,b,0),false,'no interpenetration while untying');
 }
 assert.ok(Math.hypot(a.x-start.a.x,a.y-start.a.y)>25&&Math.hypot(b.x-start.b.x,b.y-start.b.y)>25,'both cars moved on');
});

test('BF01 unsticking never pushes a car into a wall',()=>{
 const npc=firstCar(),parked={x:npc.x+3,y:npc.y,a:npc.a,body:'car'};
 const index=makeCollisionIndex([npc,parked]);
 const before={x:npc.x,y:npc.y};
 assert.equal(unstickVehicle(npc,index,{validRecovery:()=>false},dt),true,'still handled as stuck');
 assert.deepEqual({x:npc.x,y:npc.y},before,'but not moved into the wall');
});

test('BF01 game wiring: player car can always separate, shoved vehicles stop at other vehicles',async()=>{
 const [game,roads]=await Promise.all(['game.mjs','roads.mjs'].map(f=>readFile(new URL('./'+f,import.meta.url),'utf8')));
 assert.match(game,/return vehicle\?trafficMoveBlocked\(\{\.\.\.vehicle,vehicleType:type\},pose,'car',state\.dynamicCollision,vehicle\)/,'carBlocked lets the player back out of a crash');
 assert.match(game,/function canKnockbackMove\(x,y,actor\)\{[\s\S]{0,900}trafficMoveBlocked\(/,'a shove respects other vehicles');
 assert.match(roads,/if\(agent\.body==='car'&&unstickVehicle\(agent,index,world,dt\)\)/);
 assert.match(roads,/agent\.backoff=2\.5/);
 assert.match(roads,/\(agent\.respawnFails\|\|0\)<2/,'off-screen respawn relaxes after repeated failures');
});

test('BF01 the player never stays stuck off the street: shoves stop at the kerb, a car already off may drive back',async()=>{
 const game=await readFile(new URL('./game.mjs',import.meta.url),'utf8');
 assert.match(game,/function offStreetExcess\(x,y,a,vehicle\)\{/);
 const blocked=game.slice(game.indexOf('function carBlocked('),game.indexOf('function carBlocked(')+700);
 assert.match(blocked,/off=offStreetExcess\(x,y,a,vehicle\);/);
 assert.match(blocked,/off<offStreetExcess\(vehicle\.x,vehicle\.y,vehicle\.a,vehicle\)-1e-6\)\)return true;/,'only the moves that get closer to the street');
 assert.match(game,/function canKnockbackMove\(x,y,actor\)\{[\s\S]{0,1200}state\.cars\.includes\(actor\)&&offStreetExcess\(x,y,actor\.a,actor\)>offStreetExcess\(actor\.x,actor\.y,actor\.a,actor\)/,'a shove never takes a car off the street');
});

test('BF01 a car the player drives into backs off; one merely waiting behind the player keeps waiting',()=>{
 const run=push=>{
  const npc=firstCar(),c=Math.cos(npc.a),s=Math.sin(npc.a);
  const mine={x:npc.x+c*7,y:npc.y+s*7,a:npc.a,body:'car',speed:0,model:'panda-modern-white'};
  const start={x:npc.x,y:npc.y};let away=0;
  for(let i=0;i<120;i++){
   if(push)npc.yieldToPlayer=1.5; // game.mjs: the player keeps pressing against it
   stepAgents(graph,[npc],dt,{x:mine.x,y:mine.y,a:mine.a,car:0,vehicleType:'car'},{view,parked:[mine],validRecovery:()=>true});
   assert.equal(vehiclesOverlap(npc,mine,0),false);
   away=Math.max(away,-((npc.x-start.x)*c+(npc.y-start.y)*s));
  }
  return away;
 };
 assert.ok(run(true)>=1.5,'pushed against: it makes room');
 assert.ok(run(false)<.2,'just queuing behind the player (a red light): it waits');
});

test('BF01 game wiring: the NPC in the way is asked to yield only while the player drives into it',async()=>{
 const game=await readFile(new URL('./game.mjs',import.meta.url),'utf8');
 assert.match(game,/const way=Math\.abs\(speed\)>\.3&&state\.dynamicCollision&&trafficMoveBlocker\(/);
 assert.match(game,/if\(way&&way\.body==='car'&&way\.edge!=null\)way\.yieldToPlayer=1\.5;/);
});
