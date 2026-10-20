import {test} from 'node:test';
import assert from 'node:assert/strict';
import {vs,ps} from './world-scale.mjs';
import {readFile} from 'node:fs/promises';
import {buildRoadGraph,stepAgents} from './roads.mjs';
import {createRoutineResidents,createDoorVisitors,attachDoorToPavement,restoreResidentRoutine} from './resident-routines.mjs';
import {probeDoor,validateDoor,doorFacesViewer,DOOR_SOURCE,DOOR_STAND} from './building-doors.mjs';
import {makeCollisionIndex,nearbyColliders,collidesWithTraffic} from './traffic-collision.mjs';

// Via Roma lungo l'asse x; la cortina di palazzi sta sul lato nord (y negativa), con la
// facciata rivolta a sud verso chi guarda, come i muri esposti di building-volume.
const graph=buildRoadGraph([
 {id:1,n:'Via Roma',t:'primary',w:13,p:[0,0,600,0]},
 {id:2,n:'Piazza Santo Stefano',t:'residential',w:7,p:[280,-80,280,80]}
]);
const edge=graph.edges.find(e=>e.name==='Via Roma'&&e.angle===0);
const pave=edge.streetWidth/2+1.7,face=-(pave+2.5);
const rect=(id,x0,x1,y0,y1)=>({id,x0,x1,y0,y1});
const blocks=[
 rect(11,10,118,face-14,face),rect(12,122,272,face-14,face),
 rect(13,288,430,face-14,face),rect(14,434,590,face-14,face),
 rect(15,40,60,pave+8.2,pave+18), // muro lontano sul lato sud
 rect(16,70,90,pave+2.5,pave+2.8) // lastra sottile, non è un edificio
];
const isBuilding=(x,y)=>blocks.find(b=>x>=b.x0&&x<=b.x1&&y>=b.y0&&y<=b.y1)||false;
const isWalkable=(x,y)=>x>=0&&x<=600&&Math.abs(y)<90&&!isBuilding(x,y);
const north={x:0,y:-1},south={x:0,y:1};
const doorAt=(origin,normal,extra)=>{const d=probeDoor(origin,normal,isBuilding,isWalkable,extra);return d.valid&&doorFacesViewer(d)?d:null;};
const view=[0,-100,600,100];

test('Q03 a door on a straight wall has a walkable threshold just outside the building',()=>{
 const door=probeDoor({x:200,y:-pave},north,isBuilding,isWalkable);
 assert.equal(door.valid,true);
 assert.equal(door.source,DOOR_SOURCE.INVENTED,'unless told otherwise a door is declared invented');
 assert.ok(isWalkable(door.x,door.y),'threshold outside the wall');
 assert.ok(Math.abs(door.reach-(2.5-DOOR_STAND))<.05,'stops '+DOOR_STAND+' m before the facade');
 assert.equal(isBuilding(door.wallX+north.x*.6,door.wallY+north.y*.6).id,12,'the wall belongs to the building behind');
 assert.deepEqual([Math.round(door.nx)+0,Math.round(door.ny)+0],[0,1],'the facade faces the street');
 assert.equal(doorFacesViewer(door),true);
});

test('Q03 invalid doors are rejected with an explicit reason',()=>{
 const reason=(o,n,walk=isWalkable)=>probeDoor(o,n,isBuilding,walk).reason;
 assert.equal(reason({x:200,y:pave},south),'nessun-muro','open space, no building to enter');
 assert.equal(reason({x:117.8,y:-pave},north),'spigolo','a door cannot straddle the corner of the alley between two blocks');
 assert.equal(reason({x:120,y:-pave},north),'nessun-muro','nor open into the alley itself');
 assert.equal(reason({x:200,y:face-3},north),'origine-non-camminabile','starting inside a building');
 assert.equal(reason({x:50,y:pave},south),'troppo-lontana','wall 8 m away: not a doorway any more');
 assert.equal(reason({x:80,y:pave},south),'muro-sottile','a 30 cm slab is not a building');
 const fence=(x,y)=>isWalkable(x,y)&&!(y<-pave-1&&y>-pave-1.3);
 assert.equal(reason({x:200,y:-pave},north,fence),'percorso-attraverso-muro','no way through an unwalkable strip');
 const good=probeDoor({x:200,y:-pave},north,isBuilding,isWalkable);
 assert.deepEqual(validateDoor(good,isBuilding,isWalkable),{valid:true});
 assert.equal(validateDoor({...good,y:good.y-3},isBuilding,isWalkable).reason,'soglia-non-camminabile','threshold moved into the wall');
 assert.equal(validateDoor({...good,y:good.y+3},isBuilding,isWalkable).reason,'troppo-lontana','threshold moved 3 m into the street');
 assert.equal(validateDoor({...good,y:good.y+12},isBuilding,isWalkable).reason,'nessun-muro','threshold in the middle of the road');
 assert.equal(validateDoor({...good,source:'osm'},isBuilding,isWalkable).reason,'fonte-non-dichiarata','source must be osm-poi or inventata');
 assert.equal(validateDoor({x:1},isBuilding,isWalkable).reason,'porta-incompleta');
});

const residents=(n=6)=>createRoutineResidents(graph,n,405,{x:300,y:0},[],isWalkable,{doorAt});
const allDoors=p=>[p.residentRoutine.homeDoor,p.residentRoutine.targetDoor];

test('Q03 residents live behind their own door and start inside it',()=>{
 const cohort=residents(),again=residents();
 assert.equal(cohort.length,6);
 assert.deepEqual(cohort,again,'deterministic with the same seed');
 for(const p of cohort){
  const {homeDoor,targetDoor}=p.residentRoutine;
  assert.ok(homeDoor&&targetDoor,'both ends of the outing are doors');
  assert.notEqual(homeDoor,targetDoor);
  for(const d of [homeDoor,targetDoor])assert.deepEqual(validateDoor(d,isBuilding,isWalkable),{valid:true});
  assert.equal(p.indoors,true);
  assert.ok(Math.hypot(p.x-homeDoor.x,p.y-homeDoor.y)<1e-9,'kept at its threshold while inside');
 }
 const homes=cohort.map(p=>p.residentRoutine.homeDoor);
 assert.equal(new Set(homes).size,homes.length,'no two residents share a front door');
 assert.equal([...nearbyColliders(makeCollisionIndex(cohort),300,-pave,400)].length,0,'nobody inside is a street obstacle');
 // Without a door finder, Q01 behaviour is unchanged.
 assert.ok(createRoutineResidents(graph,4,405,{x:300,y:0},[],isWalkable).every(p=>!p.indoors&&!p.residentRoutine.homeDoor));
});

function runCycle(npc,world={},limit=9000,watch=()=>{}){
 const plan=npc.residentRoutine,log={entered:[],exited:[],insideTicks:0,maxStep:0,poses:0};
 let last={x:npc.x,y:npc.y,indoors:npc.indoors},count=null;
 for(let i=0;i<limit;i++){
  const agents=world.agents||[npc];count??=agents.length;
  stepAgents(graph,agents,.05,null,{view,validRecovery:(x,y)=>isWalkable(x,y),...world});
  assert.equal(agents.length,count,'no agent is created or destroyed by doors');
  watch(npc,i);
  if(npc.indoors){
   log.insideTicks++;
   if(last.indoors)assert.ok(Math.hypot(npc.x-last.x,npc.y-last.y)<1e-9,'does not move while inside');
   else{
    assert.ok(Math.hypot(npc.x-last.x,npc.y-last.y)<=npc.speed*.05+1e-6,'its last step reaches the threshold');
    log.entered.push({x:npc.x,y:npc.y,phase:plan.phase,tick:i});
   }
  }else{
   assert.ok(isWalkable(npc.x,npc.y),'a visible resident is never inside a wall');
   const step=Math.hypot(npc.x-last.x,npc.y-last.y);log.maxStep=Math.max(log.maxStep,step);log.poses++;
   assert.ok(step<=npc.speed*.05+1e-6,'no jump, also when stepping out of a door');
   if(last.indoors)log.exited.push({x:npc.x,y:npc.y,phase:plan.phase,tick:i});
  }
  last={x:npc.x,y:npc.y,indoors:npc.indoors};
  if(plan.cycles&&npc.indoors)return {...log,finished:true,ticks:i};
 }
 return {...log,finished:false};
}

test('Q03 a resident walks out of its home door, spends time inside its destination and comes back home',()=>{
 const [npc]=residents(1),plan=npc.residentRoutine,{homeDoor,targetDoor}=plan;
 const run=runCycle(npc);
 assert.equal(run.finished,true,'home -> destination -> home through doors');
 assert.equal(run.exited.length,2,'out of home, then out of the shop');
 assert.equal(run.entered.length,2,'into the destination, then back into its home');
 const at=(p,d)=>Math.hypot(p.x-d.x,p.y-d.y)<1e-6;
 assert.ok(at(run.exited[0],homeDoor)&&at(run.entered[0],targetDoor)&&at(run.exited[1],targetDoor)&&at(run.entered[1],homeDoor),
  'it appears and disappears only on the thresholds of its two doors');
 assert.equal(run.entered[0].phase,'ACTING','the activity happens inside');
 const stay=(run.exited[1].tick-run.entered[0].tick)*.05;
 assert.ok(stay>=16,'a simulated stay of at least 16 s, not a blink: '+stay.toFixed(1));
 assert.ok(run.maxStep>0&&run.maxStep<=npc.speed*.05+1e-6);
 assert.ok(at(npc,homeDoor)&&npc.indoors&&plan.phase==='AT_HOME');
});

test('Q03 nobody is duplicated: an NPC inside is invisible to traffic and comes back as the same agent',()=>{
 const cohort=residents(4),[npc]=cohort,ids=new Set(cohort);
 let checked=0;
 runCycle(npc,{agents:cohort},9000,(p)=>{
  if(!p.indoors||p.residentRoutine.phase!=='ACTING')return;
  const index=makeCollisionIndex(cohort);
  assert.ok(![...nearbyColliders(index,p.x,p.y,4)].includes(p),'not in the collision index while inside');
  assert.equal(collidesWithTraffic({x:p.x,y:p.y,a:0,vehicleType:'car'},'car',index),null,'a car passing the threshold is not blocked by it');
  checked++;
 });
 assert.ok(checked>0);
 assert.equal(cohort.length,4);assert.ok(cohort.every(p=>ids.has(p)),'same objects, no clones');
});

test('Q03 a car parked across the shop door: the resident waits, then does its errand outside without touching it',()=>{
 const [npc]=residents(1),plan=npc.residentRoutine,door=plan.targetDoor;
 const car={x:door.x,y:door.y-.4,a:0,body:'car',vehicleType:'car',speed:0};
 const run=runCycle(npc,{parked:[car]},9000,p=>{
  // BF14: footprint and walker margin at the world scale (world-scale.mjs).
  if(!p.indoors)assert.ok(Math.abs(p.x-car.x)>vs(3.15)+ps(.8)-1e-6||Math.abs(p.y-car.y)>vs(1.7)+ps(.8)-1e-6,'never inside the car footprint');
 });
 assert.equal(run.finished,true,'the outing completes anyway');
 assert.equal(run.entered.length,1,'only its home door was entered');
 assert.ok(Math.hypot(run.entered[0].x-plan.homeDoor.x,run.entered[0].y-plan.homeDoor.y)<1e-6);
});

test('Q03 a car parked on the home threshold keeps the resident inside instead of spawning into it',()=>{
 const [npc]=residents(1),door=npc.residentRoutine.homeDoor;
 const car={x:door.x,y:door.y,a:0,body:'car',vehicleType:'car',speed:0};
 for(let i=0;i<400;i++)stepAgents(graph,[npc],.05,null,{view,parked:[car]});
 assert.equal(npc.indoors,true,'stays in while the doorway is blocked');
 for(let i=0;i<400&&npc.indoors;i++)stepAgents(graph,[npc],.05,null,{view});
 assert.equal(npc.indoors,false,'walks out once the car has gone');
 assert.ok(Math.hypot(npc.x-door.x,npc.y-door.y)<=npc.speed*.05+1e-6,'out of its own door');
});

test('Q03 a knock during the doorway walk returns the resident to the pavement line without jumps',()=>{
 const [npc]=residents(1),plan=npc.residentRoutine;
 for(let i=0;i<4000&&!(plan.doorStep?.mode==='ENTER'&&Math.abs(plan.lateral)>.6);i++)stepAgents(graph,[npc],.05,null,{view});
 assert.equal(plan.doorStep?.mode,'ENTER','caught walking towards the shop door');
 npc.y+=1.5;npc.needsRoutineRecovery=true;
 for(let i=0;i<200&&npc.needsRoutineRecovery;i++)restoreResidentRoutine(graph,npc,.05,{view,validRecovery:isWalkable});
 assert.equal(npc.needsRoutineRecovery,false);
 assert.equal(plan.doorStep,null);assert.equal(plan.lateral,0,'sidestep/doorway offset cleared');
 let previous={x:npc.x,y:npc.y};
 const run=runCycle(npc,{},9000,p=>{
  if(!p.indoors)assert.ok(Math.hypot(p.x-previous.x,p.y-previous.y)<=p.speed*.05+1e-6);
  previous={x:p.x,y:p.y};
 });
 assert.equal(run.finished,true,'then enters the shop and goes home as usual');
});

test('Q03 visitors go from an invented home door into a named OSM shop, and the source stays declared',()=>{
 const shopFront=probeDoor({x:350,y:-pave-1},north,isBuilding,isWalkable,{source:DOOR_SOURCE.OSM_POI,label:'Pasticceria di prova',kind:'pastry'});
 const shop=attachDoorToPavement(graph,shopFront,doorAt);
 assert.ok(shop,'the shop door is reachable from the Via Roma pavement');
 assert.equal(shop.source,DOOR_SOURCE.OSM_POI);assert.equal(shop.label,'Pasticceria di prova');
 const [visitor]=createDoorVisitors(graph,[shop],1,811,[],isWalkable,doorAt);
 assert.ok(visitor,'a visitor is placed');
 const plan=visitor.residentRoutine;
 assert.equal(plan.targetDoor.source,'osm-poi');assert.equal(plan.homeDoor.source,'inventata');
 assert.ok(Math.abs(plan.targetT-plan.homeT)*graph.edges[plan.edge].len>=12);
 const run=runCycle(visitor);
 assert.equal(run.finished,true);
 assert.ok(Math.hypot(run.entered[0].x-shop.x,run.entered[0].y-shop.y)<1e-6,'it really went into the OSM shop');
 assert.equal(attachDoorToPavement(graph,{...shopFront,x:300,y:-60},doorAt),null,'a door far from any pavement is not used');
});

test('Q03 game wiring: doors only on visible facades, drawn before people, indoor NPCs skipped everywhere',async()=>{
 const [game,art,collision,html]=await Promise.all(['game.mjs','city-art.mjs','traffic-collision.mjs','index.html']
  .map(f=>readFile(new URL('./'+f,import.meta.url),'utf8')));
 assert.match(game,/import \{probeDoor,doorFacesViewer,drawDoorSteps,drawDoorFronts,DOOR_SOURCE\} from '\.\/building-doors\.mjs\?v=\d+'/);
 assert.match(game,/door\.valid&&doorFacesViewer\(door\)\?door:null/,'hidden facades are never used');
 assert.match(game,/createRoutineResidents\([^;]+\{doorAt\}\)/);
 assert.match(game,/source:DOOR_SOURCE\.OSM_POI,label:shop\.name/,'OSM shops keep their real name and source');
 assert.match(game,/Math\.max\(0,112-routine\.length-professionals\.length\)/,'professionals replace ordinary pedestrians while residents and visitors remain');
 assert.ok(game.indexOf('drawDoorFronts(c,doors,state.zoom)')<game.indexOf('drawCityPeople(c,state.people'),'doors under the people');
 assert.match(game,/person\.indoors\|\|person\.x<x0-12/,'an NPC inside does not reveal roofs');
 assert.match(art,/if\(p\.indoors\|\|p\.x<x0-14/,'an NPC inside is not drawn');
 assert.match(collision,/if\(!item\|\|item\.indoors\|\|/,'an NPC inside is not an obstacle');
 assert.match(game,/for\(const door of state\.doors\|\|\[\]\)if\(door\.open>0\)/,'doors close again');
 assert.ok(Number((html.match(/game\.mjs\?v=(\d+)/)||[])[1])>=142);
});
