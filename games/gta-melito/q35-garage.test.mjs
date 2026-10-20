import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {GARAGES,GARAGE_SLOTS,canStoreVehicle,depositVehicle,takeVehicle,vehicleFromEntry,freshGarageSave,sanitizeGarageSave,nearestGarage,exitSpots,chooseExitSpot,garageMessage} from './garages.mjs';
import {freshProgress,readProgress,saveProgress} from './campaign.mjs';
import {visualRoadWidth} from './road-widths.mjs';

const read=f=>readFile(new URL('./'+f,import.meta.url),'utf8');
const map=JSON.parse(await read('data/melito-map.json'));
const inPoly=(x,y,p)=>{let f=false;for(let i=0,j=p.length-2;i<p.length;j=i,i+=2){const ax=p[i],ay=p[i+1],bx=p[j],by=p[j+1];if(((ay>y)!==(by>y))&&(x<(bx-ax)*(y-ay)/(by-ay)+ax))f=!f;}return f;};
const segd=(x,y,p)=>{let d=1e9;for(let i=2;i<p.length;i+=2){const ax=p[i-2],ay=p[i-1],bx=p[i],by=p[i+1],dx=bx-ax,dy=by-ay,l=dx*dx+dy*dy||1;let t=((x-ax)*dx+(y-ay)*dy)/l;t=Math.max(0,Math.min(1,t));d=Math.min(d,Math.hypot(x-ax-t*dx,y-ay-t*dy));}return d;};
const storage=()=>{const m=new Map();return {getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v))};};

test('Q35 two fictional garages: shutter on the pavement, never on the carriageway, in front of an OSM building',()=>{
 assert.ok(GARAGES.length>=1&&GARAGES.length<=2);
 for(const g of GARAGES){
  assert.equal(g.fantasia,true,'declared as invented');
  const near=map.roads.filter(r=>r.p.some((v,i)=>i%2===0&&Math.hypot(v-g.door.x,r.p[i+1]-g.door.y)<400));
  const edge=Math.min(...near.map(r=>segd(g.door.x,g.door.y,r.p)-visualRoadWidth(r)/2));
  assert.ok(edge>1.2,g.id+': the shutter is off every carriageway ('+edge.toFixed(2)+' m)');
  assert.equal(map.buildings.some(b=>inPoly(g.door.x,g.door.y,b.p)),false,g.id+': not inside a building');
  const nx=Math.cos(g.face),ny=Math.sin(g.face);
  const behind=[2,4,6,8].some(k=>map.buildings.some(b=>inPoly(g.door.x+nx*k,g.door.y+ny*k,b.p)));
  assert.ok(behind,g.id+': an OSM building right behind the shutter');
  const road=map.roads.find(r=>r.n===g.strada&&segd(g.road.x,g.road.y,r.p)<.5);
  assert.ok(road,g.id+': the exit lane is on '+g.strada);
  for(const s of exitSpots(g).slice(0,6))assert.ok(segd(s.x,s.y,road.p)<visualRoadWidth(road)/2-1.7||map.roads.some(r=>segd(s.x,s.y,r.p)<visualRoadWidth(r)/2-1.7),'exit spot on the street');
 }
});

test('Q35 E · METTI IN GARAGE then PRENDI: one place at a time, never duplicated',()=>{
 const save=freshGarageSave(),car={x:0,y:0,a:0,model:'punto-188-red',type:2,vehicleType:'car'};
 assert.equal(depositVehicle(save,{model:'moto-scooter-01',vehicleType:'motorcycle'},'abete').ok,false,'no motorcycles');
 assert.equal(canStoreVehicle({model:'furgone-fritti'}),false,'vendor vans stay with their stall');
 const a=depositVehicle(save,car,'abete');
 assert.equal(a.ok,true);assert.equal(save.vehicles.length,1);assert.equal(a.entry.stored,true);assert.equal(a.entry.model,'punto-188-red');
 assert.equal(takeVehicle(save,a.entry.id,'cervi').ok,false,'only from its own garage');
 const t=takeVehicle(save,a.entry.id,'abete');assert.equal(t.ok,true);
 assert.equal(takeVehicle(save,a.entry.id,'abete').reason,'gia-fuori','cannot be taken twice');
 const street=vehicleFromEntry(t.entry,{x:5,y:6,a:1});
 assert.equal(street.ownedId,a.entry.id);assert.equal(street.model,'punto-188-red');
 const again=depositVehicle(save,street,'cervi');
 assert.equal(again.ok,true);assert.equal(again.already,true,'back to its own slot');
 assert.equal(save.vehicles.length,1,'no double');assert.equal(save.vehicles[0].garage,'cervi');
});

test('Q35 at most 6 slots: the seventh car is refused, a registered car still comes back',()=>{
 const save=freshGarageSave();
 for(let i=0;i<GARAGE_SLOTS;i++)assert.equal(depositVehicle(save,{model:i%2?'fiat-500-2007-red':'ypsilon-2003-navy',vehicleType:'car'},'abete').ok,true);
 const full=depositVehicle(save,{model:'seicento-1998-yellow',vehicleType:'car'},'abete');
 assert.equal(full.ok,false);assert.equal(full.reason,'pieno');assert.match(garageMessage(full),/PIENO/);
 const out=takeVehicle(save,save.vehicles[2].id,'abete').entry;
 assert.equal(depositVehicle(save,vehicleFromEntry(out,{x:0,y:0,a:0}),'abete').ok,true,'its slot is kept while it is out');
 assert.equal(save.vehicles.length,GARAGE_SLOTS);
});

test('Q35 the owned vehicles survive a reload; one left in the street returns to its garage',()=>{
 const st=storage(),p=freshProgress();
 depositVehicle(p.garage,{model:'punto-188-blue',vehicleType:'car'},'abete');
 depositVehicle(p.garage,{model:'smart-fortwo-2007-yellow',vehicleType:'car'},'cervi');
 takeVehicle(p.garage,p.garage.vehicles[1].id,'cervi');
 p.money=500;assert.equal(saveProgress(st,p),true);
 const back=readProgress(st);
 assert.equal(back.money,500);assert.equal(back.garage.vehicles.length,2);
 assert.deepEqual(back.garage.vehicles.map(v=>[v.model,v.garage,v.stored]),[['punto-188-blue','abete',true],['smart-fortwo-2007-yellow','cervi',true]]);
 const next=depositVehicle(back.garage,{model:'fiat-uno-1983-green',vehicleType:'car'},'abete').entry;
 assert.equal(new Set(back.garage.vehicles.map(v=>v.id)).size,3,'ids stay unique after reload: '+next.id);
 const junk=sanitizeGarageSave({vehicles:[{id:'v1',model:'x'},{id:'v2',model:'punto-188-red'},{id:'v2',model:'punto-188-red'}]});
 assert.equal(junk.vehicles.length,1,'unknown models and copies are dropped');
});

test('Q35 hotspots and exit: near the shutter only, first free spot in front of the garage',()=>{
 const g=GARAGES[0];
 assert.equal(nearestGarage(GARAGES,{x:g.door.x+1,y:g.door.y},false)?.id,g.id);
 assert.equal(nearestGarage(GARAGES,exitSpots(g)[0],true)?.id,g.id,'from the kerb-side lane, in the car');
 assert.equal(nearestGarage(GARAGES,{x:g.door.x+40,y:g.door.y},true),null);
 const busy=exitSpots(g)[0];
 const spot=chooseExitSpot(g,s=>Math.hypot(s.x-busy.x,s.y-busy.y)>6);
 assert.ok(spot&&Math.hypot(spot.x-g.door.x,spot.y-g.door.y)<30,'next free place, still in front');
 assert.equal(chooseExitSpot(g,()=>false),null,'all blocked: nothing spawns');
});

test('Q35 wired into the game: prompts, panel, save and no-double removal',async()=>{
 const game=await read('game.mjs'),html=await read('index.html');
 for(const s of ["'METTI IN GARAGE'","'GARAGE'",'state.cars.splice(p.car,1)','takeFromGarage','recallToGarage','drawGarage('])assert.ok(game.includes(s),s);
 assert.match(html,/id="garage-panel"/);assert.match(html,/game\.mjs\?v=\d+/);
});
