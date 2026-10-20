import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {inflateSync} from 'node:zlib';
import {SERVICE2_ATLAS_PATH,SERVICE2_ATLAS_CELL,SERVICE2_VARIANTS,TOW_TRUCK_IDS,BUS_IDS,CAR_TRAFFIC_SPRITE_IDS,CAR_PARKED_SPRITE_IDS} from './car-sprites.mjs';
import {handlingProfile,TOW_HANDLING,BUS_HANDLING,TRUCK_HANDLING,CAR_HANDLING,stepVehicle} from './vehicle-handling.mjs';
import {vehicleShape,vehiclesOverlap} from './traffic-collision.mjs';
import {nearestEnterableVehicle} from './vehicle-entry.mjs';
import {buildRoadGraph,createAgents,chooseTurn,BUS_ROADS,isBusModel} from './roads.mjs';

// Minimal PNG reader (RGBA 8-bit, non-interlaced) to check the real alpha of every cell.
async function readRGBA(path){
 const buf=await readFile(new URL(path,import.meta.url));
 let o=8,w=0,h=0,type=0;const idat=[];
 while(o<buf.length){const len=buf.readUInt32BE(o),kind=buf.toString('ascii',o+4,o+8),data=buf.subarray(o+8,o+8+len);
  if(kind==='IHDR'){w=data.readUInt32BE(0);h=data.readUInt32BE(4);type=data[9];}
  if(kind==='IDAT')idat.push(data);o+=12+len;}
 assert.equal(type,6,'RGBA PNG');
 const raw=inflateSync(Buffer.concat(idat)),bpp=4,stride=w*bpp,out=Buffer.alloc(h*stride);
 for(let y=0;y<h;y++){const f=raw[y*(stride+1)],line=raw.subarray(y*(stride+1)+1,(y+1)*(stride+1));
  for(let x=0;x<stride;x++){const a=x>=bpp?out[y*stride+x-bpp]:0,b=y?out[(y-1)*stride+x]:0,c=x>=bpp&&y?out[(y-1)*stride+x-bpp]:0;
   const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);
   out[y*stride+x]=(line[x]+[0,a,b,(a+b)>>1,pa<=pb&&pa<=pc?a:pb<=pc?b:c][f])&255;}}
 return {w,h,alpha:(x,y)=>out[y*stride+x*4+3],rgb:(x,y)=>[out[y*stride+x*4],out[y*stride+x*4+1],out[y*stride+x*4+2]]};
}

test('Q19 second service atlas: 16 cells of 52x124, transparent corners, a solid body in every cell, dark outline, no halo',async()=>{
 const png=await readRGBA(SERVICE2_ATLAS_PATH),{width:W,height:H}=SERVICE2_ATLAS_CELL;
 assert.deepEqual([W,H],[52,124]);assert.deepEqual([png.w,png.h],[W*4,H*4]);
 for(let i=0;i<16;i++){
  const x0=(i%4)*W,y0=Math.floor(i/4)*H;
  for(const [x,y] of [[x0,y0],[x0+W-1,y0],[x0,y0+H-1],[x0+W-1,y0+H-1]])assert.equal(png.alpha(x,y),0,'corner of cell '+i);
  assert.equal(png.alpha(x0+26,y0+62),255,'body of cell '+i);
  for(let y=y0;y<y0+H;y++){
   let x=x0;while(x<x0+W&&png.alpha(x,y)===0)x++;
   if(x<x0+W){assert.equal(png.alpha(x,y),255);assert.ok(Math.max(...png.rgb(x,y))<90,`outline at row ${y-y0} of cell ${i}`);}
  }
 }
});

test('Q19 two new models, eight invented liveries each, not mixed into the car lists',()=>{
 assert.equal(TOW_TRUCK_IDS.length,8);assert.equal(BUS_IDS.length,8);
 assert.equal(SERVICE2_VARIANTS['attrezzi-giallo'].index,0);assert.equal(SERVICE2_VARIANTS['autobus-arancio'].index,8);
 for(const id of [...TOW_TRUCK_IDS,...BUS_IDS]){
  assert.ok(!CAR_TRAFFIC_SPRITE_IDS.includes(id)&&!CAR_PARKED_SPRITE_IDS.includes(id),'cars unchanged: '+id);
  assert.doesNotMatch(id,/anm|ctp|eav|air|sita|busitalia|aci|europ/i,'no real operator names');
 }
});

test('Q19 bodies: tow truck between van and refuse truck, bus the longest; all keep the lane width rules',()=>{
 const tow=vehicleShape({model:'attrezzi-giallo'}),bus=vehicleShape({model:'autobus-arancio'});
 const van=vehicleShape({model:'corriere-bianco'}),truck=vehicleShape({model:'nettezza-verde'}),car=vehicleShape({model:'panda-modern-white'});
 assert.ok(tow.halfLength>van.halfLength&&tow.halfLength<truck.halfLength);
 assert.ok(bus.halfLength>truck.halfLength&&bus.halfLength*2>12,'the bus body is really long');
 for(const s of [tow,bus]){assert.ok(s.halfWidth<=1.7+.25-.05,'lane edge clear of the bay gap');assert.ok(s.halfWidth*2<4.6,'two still cross on a 4,6 m gap');}
 assert.equal(vehiclesOverlap({x:0,y:0,a:0,model:'autobus-rosso'},{x:9,y:0,a:0,model:'panda-modern-white'}),true,'a car 9 m from the bus centre still touches it');
 assert.equal(vehiclesOverlap({x:0,y:0,a:0,model:'panda-modern-white'},{x:9,y:0,a:0,model:'panda-modern-white'}),false);
});

test('Q19 handling: tow truck quicker than the refuse truck, bus the slowest and widest turning',()=>{
 assert.equal(handlingProfile({model:'attrezzi-blu'}),TOW_HANDLING);
 assert.equal(handlingProfile({model:'autobus-giallo'}),BUS_HANDLING);
 assert.ok(TOW_HANDLING.top>TRUCK_HANDLING.top&&BUS_HANDLING.top<TRUCK_HANDLING.top);
 const radius=(profile,speed)=>{let a=0;const dt=.05;for(let i=0;i<20;i++)({angle:a}=stepVehicle(speed,a,{x:1,y:-1},false,dt,false,profile));return speed/(a/(20*dt));};
 for(const v of [4,8,12]){
  assert.ok(radius(BUS_HANDLING,v)>radius(TRUCK_HANDLING,v),`at ${v} the bus turns wider than the refuse truck`);
  assert.ok(radius(TOW_HANDLING,v)>radius(CAR_HANDLING,v),`at ${v} the tow truck turns wider than a car`);
 }
 const run=p=>{let s=0;for(let i=0;i<200;i++)({speed:s}=stepVehicle(s,0,{x:0,y:-1},false,.05,false,p));return s;};
 assert.ok(run(BUS_HANDLING)<run(CAR_HANDLING)*.6);
});

// A main road crossed by a residential street, and a service spur.
const graph=buildRoadGraph([
 {id:1,n:'Corso',t:'primary',w:12,p:[0,0,300,0,600,0]},
 {id:2,n:'Vicolo',t:'residential',w:7,p:[300,-250,300,0,300,250]},
 {id:3,n:'Cortile',t:'service',w:5,p:[150,0,150,-120]}
]);

test('Q19 the bus is born and turns only on the main roads (when the junction offers one)',()=>{
 assert.ok(BUS_ROADS.has('primary')&&!BUS_ROADS.has('residential')&&!BUS_ROADS.has('service'));
 assert.ok(isBusModel('autobus-rosso')&&!isBusModel('attrezzi-rosso')&&!isBusModel(null));
 const buses=createAgents(graph,24,505,'car',[],{model:()=> 'autobus-arancio'});
 assert.ok(buses.length>0);
 for(const b of buses)assert.equal(graph.edges[b.edge].roadType,'primary','born on '+graph.edges[b.edge].roadType);
 const east=graph.edges.findIndex(e=>e.name==='Corso'&&graph.nodes[e.from].x===0);
 const node=graph.edges[east].to;
 for(let seed=0;seed<40;seed++){
  const out=chooseTurn(graph,node,east,{seed,body:'car',mainOnly:true},e=>e.car);
  assert.equal(graph.edges[out].roadType,'primary','seed '+seed+' turned into '+graph.edges[out].name);
 }
 // the other cars still turn into the side street sometimes
 const turns=new Set();for(let seed=0;seed<40;seed++)turns.add(graph.edges[chooseTurn(graph,node,east,{seed,body:'car'},e=>e.car)].roadType);
 assert.ok(turns.has('residential'));
});

test('Q19 the player can drive both when parked or stopped',()=>{
 for(const model of ['attrezzi-arancio','autobus-verde-bianco']){
  const v={x:10,y:0,a:0,vehicleType:'car',model};
  assert.equal(nearestEnterableVehicle([v],{x:13,y:1})?.vehicle,v,model);
 }
});

test('Q19 game wiring: tow trucks and buses in traffic, tow trucks in the stalls where they fit, own bodies, versions',async()=>{
 const [game,html,sprites,roads]=await Promise.all(['game.mjs','index.html','car-sprites.mjs','roads.mjs'].map(f=>readFile(new URL('./'+f,import.meta.url),'utf8')));
 assert.match(game,/i%29===12\?TOW_TRUCK_IDS\[/);assert.match(game,/i%23===3\?BUS_IDS\[/);
 assert.match(game,/serviceFits\(TOW_TRUCK_IDS\[/,'a tow truck parks only where its body fits');
 assert.doesNotMatch(game,/serviceFits\(BUS_IDS/,'the bus never parks in a bay');
 assert.match(game,/const ownBody=v=>!isMotorcycle\(v\)&&\/\^\(ape-\|corriere-\|nettezza-\|attrezzi-\|autobus-\)\/\.test/);
 assert.match(sprites,/'@service2-atlas':SERVICE2_ATLAS_PATH/);
 assert.match(sprites,/'attrezzi':\[7\.43,17\.71\],'autobus':\[7\.43,17\.71\]/);
 assert.match(roads,/mainOnly:isBusModel\(agent\.model\)/);
 assert.match(roads,/if\(isBusModel\(agent\.model\)&&!BUS_ROADS\.has\(graph\.edges\[edgeId\]\?\.roadType\)\)continue;/,'off-screen respawn on main roads only');
 assert.ok(Number((html.match(/game\.mjs\?v=(\d+)/)||[])[1])>=176);
});
