import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {buildRoadGraph} from './roads.mjs';
import {attachDoorToPavement} from './resident-routines.mjs';
import {probeDoor} from './building-doors.mjs';
import {makeCollisionIndex} from './traffic-collision.mjs';
import {nearestEnterableVehicle} from './vehicle-entry.mjs';
import {createCommuter,stepCommuter,planRoute,routeLength,carEdgeFor,COMMUTE_RULES} from './npc-commute.mjs';

// Via Roma (est-ovest) e una traversa verso nord; case a nord di Via Roma e a ovest della traversa.
const graph=buildRoadGraph([
 {id:1,n:'Via Roma',t:'residential',w:8,p:[0,0,450,0,900,0]},
 {id:2,n:'Traversa',t:'residential',w:8,p:[450,0,450,-300]}
]);
const roma=graph.edges.find(e=>e.name==='Via Roma'),pave=roma.streetWidth/2+1.7;
const boxes=[[20,420,-60,-(pave+2.5)],[450-(pave+16.5),450-(pave+2.5),-290,-(pave+12)]];
const isBuilding=(x,y)=>boxes.some(([x0,x1,y0,y1])=>x>=x0&&x<=x1&&y>=y0&&y<=y1);
const isWalkable=(x,y)=>x>=-10&&x<=910&&y>=-310&&y<=40&&!isBuilding(x,y);
const doorAt=(o,n,extra)=>{const d=probeDoor(o,n,isBuilding,isWalkable,extra);return d.valid?d:null;};
const make=(origin,normal,extra)=>attachDoorToPavement(graph,probeDoor(origin,normal,isBuilding,isWalkable,extra),doorAt);
const homeDoor=make({x:150,y:-pave},{x:0,y:-1});
const shopDoor=make({x:450-pave,y:-200},{x:-1,y:0},{source:'osm-poi',label:'Bar di prova'});
const dt=.05;

function world(extra={}){
 const bike={vehicleType:'motorcycle',body:'car',model:'moto-scooter-retro-blue',type:0};
 const c=createCommuter({graph,homeDoor:{...homeDoor},shopDoor:{...shopDoor},bike,seed:1201,index:0});
 return {c,bike,...extra};
}
function run(c,seconds,{clock=7*60+30,onTick=()=>{},player=null}={}){
 const seen=[];let prevNpc=null,prevBike={x:c.bike.x,y:c.bike.y},maxBikeStep=0,maxNpcStep=0;
 for(let i=0;i<seconds/dt;i++){
  const index=makeCollisionIndex([c.bike,c.npc]);
  const phase=stepCommuter(c,dt,{graph,index,valid:isWalkable,clockMinutes:clock+i*dt/60*60/60,playerVehicle:player?.(c)||null,say:(a,t)=>seen.push(t)});
  if(!c.npc.indoors){if(prevNpc)maxNpcStep=Math.max(maxNpcStep,Math.hypot(c.npc.x-prevNpc.x,c.npc.y-prevNpc.y));prevNpc={x:c.npc.x,y:c.npc.y};}else prevNpc=null;
  maxBikeStep=Math.max(maxBikeStep,Math.hypot(c.bike.x-prevBike.x,c.bike.y-prevBike.y));prevBike={x:c.bike.x,y:c.bike.y};
  // Un solo personaggio, un solo mezzo: in sella il pedone non è in strada, a piedi lo scooter è vuoto.
  assert.equal(c.bike.rider,!!c.npc.riding,'rider flag and riding state agree');
  if(c.npc.riding)assert.equal(c.npc.indoors,true,'while riding the pedestrian is not also on the pavement');
  if(!c.npc.indoors)assert.ok(isWalkable(c.npc.x,c.npc.y),'a walking commuter never stands inside a wall');
  onTick(c,phase,i*dt);
 }
 return {said:seen,maxBikeStep,maxNpcStep};
}

test('Q12 routes: shortest legal path between home and shop, both ways',()=>{
 assert.ok(homeDoor&&shopDoor,'doors on the test buildings');
 const home=carEdgeFor(graph,homeDoor.edge,homeDoor.t),shop=carEdgeFor(graph,shopDoor.edge,shopDoor.t);
 const out=planRoute(graph,home.edge,shop.edge),back=planRoute(graph,shop.edge,home.edge);
 assert.ok(out&&back);assert.equal(out[0],home.edge);assert.equal(out.at(-1),shop.edge);
 for(let i=1;i<out.length;i++)assert.equal(graph.edges[out[i-1]].to,graph.edges[out[i]].from,'connected edges');
 assert.ok(routeLength(graph,out)<1200);
 assert.equal(planRoute(graph,home.edge,99999),null);
});

test('Q12 full cycle: out of the door, onto the scooter, ride, park, shop, and back home the same way',()=>{
 const {c,bike}=world();
 const startSpot={x:bike.x,y:bike.y};
 const phases=new Set();let insideShop=false;
 const r=run(c,420,{onTick:(c,phase)=>{phases.add(phase);if(phase==='SHOP')insideShop=true;}});
 for(const p of ['TO_BIKE','PULL_OUT','RIDE','PARK','TO_SHOP','SHOP','TO_BIKE_BACK','PULL_OUT_BACK','RIDE_BACK','PARK_HOME','TO_DOOR'])assert.ok(phases.has(p),'phase '+p);
 assert.ok(insideShop);assert.equal(c.plan.cycles,1,'one complete outing');assert.equal(c.plan.phase,'HOME');
 assert.equal(c.npc.indoors,true,'back inside');assert.equal(c.bike.rider,false);
 assert.ok(Math.hypot(bike.x-startSpot.x,bike.y-startSpot.y)<.05,'the scooter is parked again in front of the house');
 assert.ok(r.maxBikeStep<=COMMUTE_RULES.rideSpeed*dt+.02,'the scooter never jumps, also at the junction: '+r.maxBikeStep.toFixed(3));
 assert.ok(r.maxNpcStep<=COMMUTE_RULES.walkSpeed*dt+.02,'nor does the rider on foot');
});

test('Q12 the scooter is stolen while its owner is in the shop: the owner notices, waits, walks home, and the routine carries on',()=>{
 const {c,bike}=world();let stolen=false,away=null;
 const r=run(c,1200,{onTick:(c,phase)=>{
  if(phase==='SHOP'&&!stolen){stolen=true;bike.x+=60;bike.y+=20;away={x:bike.x,y:bike.y};}
 }});
 assert.ok(stolen);
 assert.ok(r.said.some(t=>/rubato/.test(t)),'notices the theft');assert.ok(r.said.some(t=>/piedi/.test(t)),'decides to walk');
 assert.ok(c.plan.log.includes('WALK_BACK'),'walks home on the pavements');
 assert.equal(c.plan.phase,'HOME');assert.equal(c.plan.cycles,1);assert.equal(c.npc.indoors,true);
 assert.deepEqual({x:bike.x,y:bike.y},away,'nobody teleports the scooter back');
 assert.ok(r.maxNpcStep<=COMMUTE_RULES.walkSpeed*dt+.06,'no jumps on the way home');
});

test('Q12 the player rides off on the scooter before its owner leaves: the trip is done on foot',()=>{
 const {c,bike}=world();
 const r=run(c,900,{player:()=>bike});
 assert.ok(r.said.some(t=>/motorino/i.test(t)));
 assert.ok(c.plan.log.includes('WALK')&&c.plan.log.includes('SHOP'),'walks to the shop instead');
 assert.equal(bike.rider,false,'the owner never mounts a scooter the player is using');
});

test('Q12 a scooter ridden by its owner cannot be taken; parked, it can',()=>{
 const {c,bike}=world();
 const at={x:bike.x+1,y:bike.y};
 assert.equal(nearestEnterableVehicle([bike],at)?.vehicle,bike,'parked: free to steal');
 run(c,200,{onTick:()=>{}});
 if(bike.rider)assert.equal(nearestEnterableVehicle([bike],{x:bike.x+1,y:bike.y}),null);
 let checked=false;
 const {c:c2,bike:b2}=world();
 run(c2,200,{onTick:(cc,phase)=>{if(phase==='RIDE'&&!checked){checked=true;assert.equal(nearestEnterableVehicle([b2],{x:b2.x+1,y:b2.y}),null,'not while ridden');}}});
 assert.ok(checked);
});

test('Q12 game wiring: commuter moved by its own module, scooter among the parked vehicles, lights and sound',async()=>{
 const [game,roads]=await Promise.all(['game.mjs','roads.mjs'].map(f=>readFile(new URL('./'+f,import.meta.url),'utf8')));
 assert.match(roads,/if\(agent\.commuter\)continue;/);
 assert.match(roads,/if\(agent\.path\)\{const k=agent\.path\.indexOf\(oldEdge\)/,'planned paths at junctions');
 assert.match(game,/import \{createCommuter,stepCommuter[^}]*\} from '\.\/npc-commute\.mjs\?v=\d+'/);
 assert.match(game,/state\.cars\.push\(bike\)/,'the scooter is a real parked vehicle');
 assert.match(game,/stepCommuter\(c,dt,\{graph:state\.graph,index:state\.dynamicCollision/);
 assert.match(game,/playerVehicle:p\.car>=0\?state\.cars\[p\.car\]:null/);
});
