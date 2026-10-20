import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {FOOD_STALLS,TRAFFIC_APES,trafficApeModel,placeStreetFoodVendors,createStreetProfessionActors,SERVICE_SIDES,FRYER_GAP,serviceSide,fryerServicePose} from './street-professions.mjs';
import {vehicleHitsPedestrian,vehicleShape} from './traffic-collision.mjs';
import {buildRoadGraph,stepAgents} from './roads.mjs';
import {PROFESSION_TYPES,PROFESSION_ATLAS_PATH} from './profession-sprites.mjs';
import {MARKET_VARIANTS} from './car-sprites.mjs';
import {nearestEnterableVehicle} from './vehicle-entry.mjs';

function littleTown(){
 const nodes=[],edges=[],walkStarts=[];
 for(const [i,area] of FOOD_STALLS.entries()){
  const from=nodes.length;
  nodes.push({x:area.x-35,y:area.y,out:[]},{x:area.x+35,y:area.y,out:[]});
  const street=area.name==='Piazza Santo Stefano'?'Piazza Santo Stefano':
   area.name==='Piazza Immacolata'?'Piazza Immacolata':area.name==='Via Roma'?'Via Roma':
   area.name==='Largo Cinque Via'?'Largo Cinque Via':'Corso Europa';
  edges.push({from,to:from+1,car:true,walk:true,len:70,angle:0,streetWidth:8,
   roadType:'residential',name:street});
  nodes[from].out.push(i);walkStarts.push(i);
 }
 return {nodes,edges,walkStarts};
}
test('Ape variants are compact street vehicles and never open-awning food trucks',()=>{
 assert.equal(TRAFFIC_APES.length,4);
 assert.equal(trafficApeModel(0),null);
 assert.equal(trafficApeModel(3),TRAFFIC_APES[0]);
 assert.equal(trafficApeModel(14),TRAFFIC_APES[1]);
 assert.ok(TRAFFIC_APES.every(id=>MARKET_VARIANTS[id]?.model==='ape-mercato'));
 assert.ok(FOOD_STALLS.every(p=>MARKET_VARIANTS[p.model]?.model==='furgone-ambulante'));
});
test('five named areas can host staffed, deterministic stalls without overlapping',()=>{
 const graph=littleTown(),args={vehicleOK:()=>true,walkerOK:()=>true};
 const vendors=placeStreetFoodVendors(graph,[],args);
 assert.equal(vendors.length,FOOD_STALLS.length);
 assert.deepEqual(placeStreetFoodVendors(graph,[],args),vendors);
 assert.deepEqual(vendors.map(x=>x.vehicle.vendorDistrict),FOOD_STALLS.map(x=>x.name));
 for(const pair of vendors){
  assert.equal(pair.vehicle.vendorStand,true);
  assert.equal(pair.fryer.profession,'friggitore');
  assert.equal(pair.fryer.stationary,true);
  assert.equal(pair.fryer.body,'walk');
  assert.equal(nearestEnterableVehicle([pair.vehicle],pair.fryer),null,'active stalls are not stealable');
 }
});
test('a blocked vending pose never creates a dangling fryer or van',()=>{
 const blocked=placeStreetFoodVendors(littleTown(),[],{vehicleOK:()=>false,walkerOK:()=>true});
 assert.deepEqual(blocked,[]);
 assert.deepEqual(placeStreetFoodVendors(littleTown(),[],{vehicleOK:()=>true,walkerOK:()=>false}),[]);
});
test('street officer and dealer actors reuse OSM walk edges, and remain deterministic',()=>{
 const graph=littleTown(),vendors=placeStreetFoodVendors(graph,[],{vehicleOK:()=>true,walkerOK:()=>true});
 const actors=createStreetProfessionActors(graph,vendors,vendors.map(v=>v.vehicle),[],{walkerOK:()=>true});
 assert.equal(actors.filter(a=>a.profession==='friggitore').length,vendors.length);
 assert.ok(actors.some(a=>a.profession==='vigile'));
 assert.ok(actors.every(a=>PROFESSION_TYPES.includes(a.profession)));
 assert.ok(actors.every(a=>a.stationary||graph.edges[a.edge]?.walk));
});
test('approved RGBA profession atlas is 384x160 with all four identities',async()=>{
 const bytes=await readFile(new URL(PROFESSION_ATLAS_PATH,import.meta.url));
 assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
 assert.equal(bytes.readUInt32BE(16),384);
 assert.equal(bytes.readUInt32BE(20),160);
 assert.deepEqual(PROFESSION_TYPES,['friggitore','vigile','lavavetri','contrabbandiere']);
});

// BF04: coordinate locali del furgone come le disegna car-sprites.mjs (destra sprite = (-sin a, cos a)).
const local=(v,p)=>{const dx=p.x-v.x,dy=p.y-v.y;return {lx:dx*-Math.sin(v.a)+dy*Math.cos(v.a),ly:-(dx*Math.cos(v.a)+dy*Math.sin(v.a))};};
test('BF04 every food stall model has a measured service side; the fryer stands just outside its counter, facing it',()=>{
 for(const model of [...FOOD_STALLS.map(s=>s.model),'furgone-fritti']){
  const s=serviceSide(model);assert.ok(s,'service side for '+model);
  for(const a of [0,.7,Math.PI/2,2.4,-1.9]){
   const van={x:100,y:-40,a,model},p=fryerServicePose(van),q=local(van,p);
   assert.ok(Math.abs(q.lx-s.side*(s.edge+FRYER_GAP))<1e-9,'0,6 m beyond the counter edge, on the service side');
   assert.ok(q.ly>=s.along[0]&&q.ly<=s.along[1],'along the counter, not ahead of or behind the van');
   const toVan=Math.atan2(van.y-p.y,van.x-p.x)-p.a,lateral=Math.cos(Math.atan2(Math.sin(toVan),Math.cos(toVan)));
   assert.ok(lateral>.95||Math.abs(Math.atan2(-Math.cos(a)*s.side,Math.sin(a)*s.side)-p.a)<1e-9,'faces the counter');
   assert.equal(vehicleHitsPedestrian(van,p,.8),false,'outside the van body');
   const shape=vehicleShape(van);assert.ok(Math.abs(q.lx)>shape.halfWidth+.8);
  }
 }
 assert.deepEqual(Object.keys(SERVICE_SIDES),['furgone-ambulante','furgone-fritti']);
});
test('BF04 placed stalls: counter towards the pavement on both sides of the street, fryer next to it',()=>{
 // Due vie, una per lato: il furgone sul lato -1 deve girarsi per avere il banco verso il marciapiede.
 const graph=littleTown();
 const vendors=placeStreetFoodVendors(graph,[],{vehicleOK:()=>true,walkerOK:()=>true});
 assert.equal(vendors.length,FOOD_STALLS.length);
 for(const {vehicle,fryer} of vendors){
  const centreY=FOOD_STALLS.find(f=>f.name===vehicle.vendorDistrict).y;
  const kerbSide=Math.sign(vehicle.y-centreY),q=local(vehicle,fryer),s=serviceSide(vehicle.model);
  assert.ok(Math.sign(fryer.y-vehicle.y)===kerbSide,'the fryer is between the van and the pavement, never towards the traffic');
  assert.ok(Math.abs(q.lx-s.side*(s.edge+FRYER_GAP))<.31+1e-9,'close to the counter edge (0,6-0,9 m)');
  assert.ok(Math.hypot(fryer.x-vehicle.x,fryer.y-vehicle.y)<5.2,'metres, not the old 7-9 m');
  assert.deepEqual(fryer.post,{x:fryer.x,y:fryer.y,a:fryer.a},'post keeps place and facing');
 }
 const onlyFar=placeStreetFoodVendors(graph,[],{vehicleOK:v=>v.y<FOOD_STALLS.find(f=>f.name===v.vendorDistrict).y,walkerOK:()=>true});
 assert.equal(onlyFar.length,FOOD_STALLS.length,'vans fit on the other side too');
 for(const {vehicle,fryer} of onlyFar){
  assert.ok(Math.abs(Math.cos(vehicle.a)+1)<1e-9,'on the far side the van points the other way');
  assert.ok(fryer.y<vehicle.y,'and its counter still faces the pavement');
 }
});
test('BF04 no valid spot at the counter: no fryer and no van (never a fryer in the road)',()=>{
 const graph=littleTown();
 const vendors=placeStreetFoodVendors(graph,[],{vehicleOK:()=>true,walkerOK:()=>false});
 assert.deepEqual(vendors,[]);
});
test('BF04 after a non-lethal knock the fryer walks back to its post and faces the counter again',()=>{
 const g=buildRoadGraph([{id:1,n:'Corso Europa',t:'residential',w:6,p:[0,0,200,0]}]);
 const van={x:100,y:9,a:0,model:'food-panini',vehicleType:'car',body:'car'};
 const p=fryerServicePose(van);
 const fryer={...p,stationary:true,profession:'friggitore',body:'walk',speed:0,braking:true,post:{x:p.x,y:p.y,a:p.a},home:{x:p.x,y:p.y}};
 fryer.x+=1.5;fryer.y+=1;fryer.a=2;
 for(let i=0;i<120;i++)stepAgents(g,[fryer],.05,null,{parked:[van],validRecovery:()=>true});
 assert.ok(Math.hypot(fryer.x-p.x,fryer.y-p.y)<.13,'back at the counter');
 assert.equal(fryer.a,p.a,'facing it');
});
