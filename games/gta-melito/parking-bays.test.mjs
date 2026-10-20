import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {buildRoadGraph,createAgents,stepAgents} from './roads.mjs';
import {roadTrafficLaneOffset,visualRoadWidth} from './road-widths.mjs';
import {vehiclesOverlap,trafficMoveBlocked,makeCollisionIndex,BAY_PEDESTRIAN_PAD} from './traffic-collision.mjs';
import {buildParkingBays,bayOffset,bayRect,fitsParkingBay,nearestFreeStalls,parkInStall,insideParkingStrip,BAY_RULES} from './parking-bays.mjs';
import {placeStreetFoodVendors} from './street-professions.mjs';

const map=JSON.parse(await readFile(new URL('./data/melito-map.json',import.meta.url),'utf8'));
const realGraph=buildRoadGraph(map.roads);
const realBays=buildParkingBays(realGraph);
const FOOT=new Set(['pedestrian','footway','path','steps']);
// Geometria indipendente dal modulo: distanza minima campionata tra il bordo della sagoma e un segmento.
const segD=(px,py,ax,ay,bx,by)=>{const dx=bx-ax,dy=by-ay,l=dx*dx+dy*dy,t=l?Math.max(0,Math.min(1,((px-ax)*dx+(py-ay)*dy)/l)):0;return Math.hypot(px-ax-dx*t,py-ay-dy*t);};
function rectToSegment(rect,ax,ay,bx,by){
 let best=Infinity;
 for(let i=0;i<4;i++){
  const [px,py]=rect[i],[qx,qy]=rect[(i+1)%4];
  for(let k=0;k<=24;k++){const x=px+(qx-px)*k/24,y=py+(qy-py)*k/24;best=Math.min(best,segD(x,y,ax,ay,bx,by));}
  for(let k=0;k<=24;k++){const x=ax+(bx-ax)*k/24,y=ay+(by-ay)*k/24;best=Math.min(best,segD(x,y,px,py,qx,qy));}
 }
 return best;
}

test('BF02 bay offset: between lane and pedestrians where there is room, nothing where there is not',()=>{
 for(const t of ['residential','unclassified','tertiary','secondary','primary','trunk']){
  const w=visualRoadWidth({t,w:{residential:7,unclassified:7,tertiary:9,secondary:11,primary:13,trunk:16}[t]}),c=bayOffset(w);
  assert.ok(c!==null,t+' has a parking strip');
  assert.ok(c-1.7-(roadTrafficLaneOffset(w)+1.7)>=BAY_RULES.laneGap-1e-9,t+': clear of the swept lane');
  assert.ok(w/2+1.7-(c+1.7)>=BAY_RULES.pedestrianGap-1e-9,t+': clear of the pedestrian line');
 }
 assert.ok(bayOffset(visualRoadWidth({t:'primary',w:13}))+1.7<=visualRoadWidth({t:'primary',w:13})/2,'on wide roads the car stays on the asphalt');
 for(const [t,w] of [['service',5],['living_street',6],['track',3]])assert.equal(bayOffset(visualRoadWidth({t,w})),null,t+': no room, no parking');
 assert.ok(BAY_PEDESTRIAN_PAD<BAY_RULES.pedestrianGap,'pedestrians pass a bay car without being blocked');
});

test('BF02 real map: every stall is clear of lanes, pedestrian lines, crosswalks and of the other stalls',()=>{
 const g=realGraph,stalls=realBays.stalls;
 assert.ok(stalls.length>3000,'a real strip across the town: '+stalls.length+' stalls');
 const segs=g.edges.map(e=>({e,a:g.nodes[e.from],b:g.nodes[e.to]}));
 let worstLane=Infinity,worstWalk=Infinity;
 for(const s of stalls){
  const rect=bayRect(s);
  for(const {e,a,b} of segs){
   if(segD(s.x,s.y,a.x,a.y,b.x,b.y)>e.streetWidth/2+12)continue;
   const nx=-Math.sin(e.angle),ny=Math.cos(e.angle);
   if(e.car){
    // la corsia di questo verso: asse spostato dell'offset, sagoma larga 1,7 per lato
    const off=roadTrafficLaneOffset(e.streetWidth);
    worstLane=Math.min(worstLane,rectToSegment(rect,a.x+nx*off,a.y+ny*off,b.x+nx*off,b.y+ny*off)-1.7);
   }
   if(e.walk){
    const o=FOOT.has(e.roadType)?0:e.streetWidth/2+1.7;
    worstWalk=Math.min(worstWalk,rectToSegment(rect,a.x+nx*o,a.y+ny*o,b.x+nx*o,b.y+ny*o));
   }
  }
 }
 assert.ok(worstLane>=BAY_RULES.laneGap-.03,'closest stall to a lane: '+worstLane.toFixed(3)+' m');
 assert.ok(worstWalk>BAY_PEDESTRIAN_PAD,'closest stall to a pedestrian line: '+worstWalk.toFixed(3)+' m');
 for(let i=1;i<stalls.length;i++){
  const p=stalls[i-1],q=stalls[i];
  if(p.strip===q.strip)assert.equal(vehiclesOverlap({...p,body:'car'},{...q,body:'car'},0),false,'neighbouring stalls do not overlap');
 }
 for(const z of realBays.crosswalks)for(const s of stalls){
  if(Math.hypot(z.x-s.x,z.y-s.y)>30)continue;
  const rect=bayRect(s);
  for(let i=0;i<4;i++){const [ax,ay]=z.rect[i],[bx,by]=z.rect[(i+1)%4];
   assert.ok(rectToSegment(rect,ax,ay,bx,by)>=BAY_RULES.crosswalkClear-.05,'stall next to a crosswalk at '+s.x.toFixed(1)+','+s.y.toFixed(1));}
 }
});

test('BF02 deterministic, and no room means no stall (walls, entrances, narrow streets)',()=>{
 const again=buildParkingBays(realGraph);
 assert.deepEqual(again.stalls.map(s=>[s.x,s.y,s.a]),realBays.stalls.map(s=>[s.x,s.y,s.a]));
 const g=buildRoadGraph([{id:1,n:'Via Roma',t:'residential',w:7,p:[0,0,200,0]},{id:2,n:'Vico',t:'service',w:5,p:[0,60,200,60]}]);
 const bays=buildParkingBays(g);
 assert.ok(bays.stalls.length>=30,'both sides of the residential street');
 assert.ok(bays.stalls.every(s=>Math.abs(s.y)<30),'none in the narrow service lane');
 assert.equal(buildParkingBays(g,{blocked:()=>true}).stalls.length,0,'walls everywhere: no parking');
 const shop={x:100,y:9,r:6};
 assert.ok(buildParkingBays(g,{keepClear:[shop]}).stalls.every(s=>Math.hypot(s.x-shop.x,s.y-shop.y)>=4),'shop entrance left free');
});

test('BF02 cars park in the stalls, the scooter in the next one; free stalls and strip lookups',()=>{
 const g=buildRoadGraph([{id:1,n:'Via Roma',t:'residential',w:7,p:[0,0,200,0]}]);
 const bays=buildParkingBays(g),cars=[];
 const first=nearestFreeStalls(bays,100,0,cars,vehiclesOverlap)[0];
 cars.push(parkInStall({model:'panda-modern-white',type:0},first));
 const second=nearestFreeStalls(bays,first.x,first.y,cars,vehiclesOverlap)[0];
 assert.notEqual(second,first,'a taken stall is skipped');
 assert.ok(Math.abs(Math.hypot(second.x-first.x,second.y-first.y)-BAY_RULES.stall)<1e-6||second.side!==first.side);
 assert.deepEqual(cars[0].parkingBay,{x:first.x,y:first.y,index:first.index});
 const strip=bays.strips[first.strip];
 assert.ok(insideParkingStrip(strip,first.x,first.y));
 assert.equal(insideParkingStrip(strip,first.x,0),false,'the lane is not part of the strip');
});

test('BF02 traffic drives past full parking strips and pedestrians walk past them: nobody is blocked',()=>{
 const roads=[{id:1,n:'Via Roma',t:'residential',w:7,p:[0,0,300,0,600,0]},{id:2,n:'Traversa',t:'residential',w:7,p:[300,-300,300,0,300,300]}];
 const g=buildRoadGraph(roads),bays=buildParkingBays(g);
 // traffic first (the spawn keeps 9 m from any car), then every stall that is not on top of it
 const traffic=createAgents(g,10,7,'car',[]);
 const parked=bays.stalls.filter(s=>!traffic.some(a=>vehiclesOverlap({...s,body:'car'},a,0)))
  .map((s,i)=>parkInStall({model:'panda-modern-white',type:0,vehicleType:i%4?'car':'motorcycle'},s));
 assert.equal(parked.length,bays.stalls.length,'no stall overlaps a lane');
 const walkers=createAgents(g,16,11,'walk',[...parked,...traffic]);
 assert.ok(traffic.length>=8&&walkers.length>=12);
 const start=new Map([...traffic,...walkers].map(a=>[a,{x:a.x,y:a.y,moved:0}]));
 const set=new Set(parked);let blockedByParked=0;
 for(let i=0;i<1200;i++){
  stepAgents(g,[...traffic,...walkers],.05,null,{view:[-1e4,-1e4,-1e4+1,-1e4+1],parked,validRecovery:()=>true});
  for(const a of traffic)if(a.blockedBy&&set.has(a.blockedBy))blockedByParked++;
 }
 assert.equal(blockedByParked,0,'no car ever waits behind a parked car');
 for(const a of [...traffic,...walkers]){
  const s=start.get(a);
  assert.ok(Math.hypot(a.x-s.x,a.y-s.y)>3||a.body==='walk'&&a.wait>0,'every agent keeps moving');
 }
 // the same car moved out of its bay onto the pavement is an ordinary obstacle again
 const s=bays.stalls.find(q=>q.y>1&&q.x>20&&q.x<280),line=g.edges[0].streetWidth/2+1.7;
 const walker={x:s.x-4,y:line,a:0,body:'walk'},next={x:s.x-3.5,y:line,a:0};
 const car=parkInStall({model:'panda-modern-white',body:'car'},s);
 assert.equal(trafficMoveBlocked(walker,next,'walk',makeCollisionIndex([car]),walker),false,'a pedestrian walks past a car in its bay');
 car.y+=.6;
 assert.equal(trafficMoveBlocked(walker,next,'walk',makeCollisionIndex([car]),walker),true,'pushed out of the bay it blocks the pavement again');
});

test('BF02 food trucks stand in the strip too (real map, all five districts)',()=>{
 const g=realGraph,shape={halfLength:3.35,halfWidth:1.45};
 const vendors=placeStreetFoodVendors(g,[],{vehicleOffset:bayOffset,vehicleOK:v=>fitsParkingBay(realBays,v,shape),walkerOK:()=>true});
 assert.equal(vendors.length,5);
 for(const {vehicle} of vendors){
  let best=Infinity,width=0;
  for(const e of g.edges){if(!e.car)continue;const a=g.nodes[e.from],b=g.nodes[e.to],d=segD(vehicle.x,vehicle.y,a.x,a.y,b.x,b.y);if(d<best){best=d;width=e.streetWidth;}}
  assert.ok(Math.abs(best-bayOffset(width))<1e-6,vehicle.vendorDistrict+': van on the bay line');
 }
});

test('BF02 game wiring: strip before parked vehicles, drawn under the roofs, rebuilt with the road widths',async()=>{
 const [game,html,prof]=await Promise.all(['game.mjs','index.html','street-professions.mjs'].map(f=>readFile(new URL('./'+f,import.meta.url),'utf8')));
 assert.match(game,/import \{buildParkingBays,[^}]*\} from '\.\/parking-bays\.mjs\?v=\d+'/);
 const load=game.indexOf('state.cars=[];state.streetObjects=null;createParkingBays();');
 assert.ok(load>0&&load<game.indexOf('state.cars=[nearCar]')&&load<game.indexOf('state.traffic=createTraffic('),'stalls exist before any vehicle');
 assert.equal((game.match(/parkInStall\(/g)||[]).length,4,'Panda, starter scooter, scooters and cars all use a stall');
 assert.ok(!/shoulder/.test(game),'no more kerb guesses on the pavement');
 assert.match(game,/vehicleOffset:bayOffset,\n  vehicleOK:v=>fitsParkingBay\(state\.parkingBays,v,vehicleShape\(v\)\)/);
 assert.match(prof,/const lateral=vehicleOffset\?vehicleOffset\(edge\.streetWidth\):edge\.streetWidth\/2\+2\.25;/);
 const streets=game.indexOf('drawCityStreets(ctx,roads,zoom);'),bays=game.indexOf('drawParkingBays(ctx,',streets),roofs=game.indexOf('drawCityBuildings(ctx,[...inferred,...buildings],zoom)');
 assert.ok(streets>0&&bays>streets&&bays<roofs,'strip painted after the asphalt and before the roofs');
 assert.match(game,/state\.graph=buildRoadGraph\(state\.roads(?:,\{border:state\.map\.border[^}]*\})?\);state\.streetObjects=null;createParkingBays\(\);/,'A/B of road widths rebuilds the strip');
 assert.match(game,/\|\|inParkingBay\(x,y,margin\)/,'no bins or bollards in the stalls');
 assert.ok(Number((html.match(/game\.mjs\?v=(\d+)/)||[])[1])>=156);
});
