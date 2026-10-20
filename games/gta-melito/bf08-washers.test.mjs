import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {buildRoadGraph,createAgents,stepAgents,lanePosition} from './roads.mjs';
import {makeCollisionIndex,vehicleHitsPedestrian,vehicleShape} from './traffic-collision.mjs';
import {signalAspect} from './junctions.mjs';
import {prepareSignalPosts} from './traffic-light-art.mjs';
import {createStreetProfessionActors} from './street-professions.mjs';
import {stepWasher,washerSpots,WASHER_RULES} from './window-washers.mjs';

const dt=.05;
const town=()=>{
 const g=buildRoadGraph([
  {id:1,n:'Via Grande',t:'tertiary',w:8,p:[0,0,300,0,600,0]},
  {id:2,n:'Via Traversa',t:'tertiary',w:8,p:[300,-300,300,0,300,300]}
 ]);
 prepareSignalPosts(g,g.signals,{valid:()=>true});
 return g;
};
function scene({clockAt='red',remaining=15,vehicle={}}={}){
 const g=town(),J=g.signals[0];
 const washer=createStreetProfessionActors(g,[],[],[],{walkerOK:()=>true}).find(a=>a.profession==='lavavetri');
 assert.ok(washer?.washer,'a washer at the light');
 const A=washer.washer.A,e=g.edges[A.edge];
 let clock=0;
 while(!(signalAspect(J,A,clock).color===clockAt&&signalAspect(J,A,clock).remaining>remaining&&signalAspect(J,A,clock).remaining<remaining+1))clock+=.05;
 const car=createAgents(g,1,9,'car',[])[0],shape=vehicleShape({...car,...vehicle}),d=A.stop+shape.halfLength;
 Object.assign(car,lanePosition(g,A.edge,1-d/e.len,'car'),{edge:A.edge,t:1-d/e.len,speed:10,wait:0,model:'panda-modern-white',vehicleType:'car',...vehicle});
 const out=g.nodes[e.to].out.find(id=>g.edges[id].car&&Math.abs(g.edges[id].angle-e.angle)<.1);
 car.path=[A.edge,out];delete car.home;
 return {g,J,A,washer,car,clock};
}
function run(sc,seconds,{player=null,onTick=()=>{}}={}){
 const said=[];const phases=[];
 for(let i=0;i<seconds/dt;i++){
  const clock=sc.clock+i*dt,traffic=player?[]:[sc.car];
  if(!player)stepAgents(sc.g,traffic,dt,null,{npcClockMinutes:clock,people:[sc.washer]});
  stepAgents(sc.g,[sc.washer],dt,null,{npcClockMinutes:clock,traffic});
  stepWasher(sc.washer,dt,{graph:sc.g,signalSeconds:clock+dt,traffic,playerCar:player,index:makeCollisionIndex([...traffic,player,sc.washer].filter(Boolean)),say:(a,t)=>said.push(t)});
  const car=player||sc.car;
  assert.equal(vehicleHitsPedestrian(car,sc.washer,0),false,'never inside the car');
  if(phases.at(-1)!==sc.washer.washer.phase)phases.push(sc.washer.washer.phase);
  onTick(clock,car);
 }
 return {said,phases};
}
const leftOf=(car,p)=>(p.x-car.x)*Math.sin(car.a)-(p.y-car.y)*Math.cos(car.a);

test('BF08 washers stand at the (simulated) traffic lights, on the pavement next to a post',async()=>{
 const map=JSON.parse(await readFile(new URL('./data/melito-map.json',import.meta.url),'utf8'));
 const g=buildRoadGraph(map.roads);prepareSignalPosts(g,g.signals,{valid:()=>true});
 const spots=washerSpots(g,g.signals);
 assert.ok(spots.length>=4&&spots.length<=WASHER_RULES.maxWashers,'washers: '+spots.length);
 for(const s of spots){
  assert.ok(s.J.signal&&s.A.post,'at a light');
  assert.ok(Math.hypot(s.x-s.A.post.x,s.y-s.A.post.y)<4,'next to the post');
  const e=g.edges[s.A.edge],lateral=(s.x-s.J.x)*-Math.sin(e.angle)+(s.y-s.J.y)*Math.cos(e.angle);
  assert.ok(lateral>s.A.width/2,'beyond the kerb, not on the carriageway');
 }
 assert.equal(new Set(spots.map(s=>s.J)).size,spots.length,'one per junction');
});

test('BF08 full routine on a red light: to the driver side, wash, back on the kerb; the car waits for him',()=>{
 const sc=scene({remaining:15});
 let washing=0,greenPhase=null,frontWhileMoving=false,last={x:sc.car.x,y:sc.car.y};
 const r=run(sc,26,{onTick:(clock,car)=>{
  const w=sc.washer;
  if(w.washer.phase==='WASH'){
   washing+=dt;
   assert.ok(leftOf(car,w)>vehicleShape(car).halfWidth,'on the left of the car = driver side');
   assert.ok(Math.hypot(w.x-w.washer.window.x,w.y-w.washer.window.y)<.05,'at the window');
  }
  const aspect=signalAspect(sc.J,sc.A,clock+dt);
  if(aspect.color!=='red'&&greenPhase===null)greenPhase=w.washer.phase;
  // mai davanti a un'auto che si muove: chi riparte aspetta che lui sia passato
  const moving=Math.hypot(car.x-last.x,car.y-last.y)>.01;last={x:car.x,y:car.y};
  const fwd=(w.x-car.x)*Math.cos(car.a)+(w.y-car.y)*Math.sin(car.a),side=Math.abs(leftOf(car,w));
  if(moving&&fwd>0&&fwd<vehicleShape(car).halfLength+2&&side<vehicleShape(car).halfWidth+.5)frontWhileMoving=true;
 }});
 for(const p of ['KERB','TO_CAR','WASH','BACK'])assert.ok(r.phases.includes(p),'phase '+p);
 assert.ok(washing>=WASHER_RULES.minWash-.1&&washing<=WASHER_RULES.maxWash+.1,'washing '+washing.toFixed(1)+' s');
 assert.ok(['KERB','BACK'].includes(greenPhase),'back or on his way back when the light changes: '+greenPhase);
 assert.equal(frontWhileMoving,false,'the car never moves with him in front of it');
 assert.equal(sc.washer.washer.phase,'KERB');
 assert.ok(Math.hypot(sc.washer.x-sc.washer.post.x,sc.washer.y-sc.washer.post.y)<.05);
 assert.notEqual(sc.car.edge,sc.A.edge,'the car drove off on green');
});

test('BF08 not enough red left: the washer stays on the kerb',()=>{
 const sc=scene({remaining:5});
 const r=run(sc,4);
 assert.deepEqual(r.phases,['KERB']);
});

test('BF08 scooters and motorbikes are ignored',()=>{
 const sc=scene({remaining:15,vehicle:{vehicleType:'motorcycle',model:'moto-scooter-sh-red'}});
 const r=run(sc,8);
 assert.deepEqual(r.phases,['KERB']);
});

test('BF08 the player car first at the red light gets its windscreen washed too, from the driver side',()=>{
 const sc=scene({remaining:15});
 const player={...sc.car,speed:0,body:'car',vehicleType:'car',model:'panda-modern-white'};
 let reached=false;
 const r=run(sc,14,{player,onTick:()=>{if(sc.washer.washer.phase==='WASH'){reached=true;assert.ok(leftOf(player,sc.washer)>0);}}});
 assert.ok(reached&&r.phases.includes('BACK'));
});

test('BF08 the car leaves early: the washer turns back, never stays in the lane',()=>{
 const sc=scene({remaining:15});
 let moved=false;
 const r=run(sc,16,{onTick:()=>{
  if(!moved&&sc.washer.washer.phase==='TO_CAR'&&sc.washer.washer.at>=2){moved=true;sc.car.x-=Math.cos(sc.car.a)*3;sc.car.y-=Math.sin(sc.car.a)*3;}
 }});
 assert.ok(moved);
 assert.ok(!r.phases.includes('WASH'),'no washing once the car has moved');
 assert.equal(sc.washer.washer.phase,'KERB');
});

test('BF08 game wiring: washers stepped after traffic, drawn above the car when in front of it',async()=>{
 const [game,roads,prof]=await Promise.all(['game.mjs','roads.mjs','street-professions.mjs'].map(f=>readFile(new URL('./'+f,import.meta.url),'utf8')));
 assert.match(game,/import \{stepWasher,drawWasherEffects\} from '\.\/window-washers\.mjs\?v=\d+'/);
 const upd=game.indexOf('function updateTraffic(dt)');
 assert.ok(game.indexOf('stepWasher(w,elapsed,',upd)>game.indexOf('impactTraffic(elapsed);',upd),'after the traffic of the same tick');
 assert.match(game,/drawWasherEffects\(c,state\.people,state\.clock\)/);
 assert.match(roads,/if\(agent\.scripted\)continue;/,'the post recovery does not pull a working washer back');
 assert.match(prof,/washerSpots\(graph,graph\.signals/);
 assert.match(game,/if\(!isPlayerCar&&target\.scripted\)continue;/,'NPC cars never shove a washer at work');
});
