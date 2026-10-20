import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {FOOD_STALLS,TRAFFIC_APES,trafficApeModel,placeStreetFoodVendors,createStreetProfessionActors} from './street-professions.mjs';
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
  assert.ok(Math.hypot(pair.vehicle.x-pair.fryer.x,pair.vehicle.y-pair.fryer.y)>5.8);
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
