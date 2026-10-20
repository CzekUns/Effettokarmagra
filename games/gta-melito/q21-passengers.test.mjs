import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {buildRoadGraph,lanePosition} from './roads.mjs';
import {doorSpots,PASSENGER_RULES,seatCapacity,ensureSeats,occupantsOf,freeSeat,boardPassenger,alightPassenger,canHitchhike,
 hitchhikersNear,liftCandidate,liftDestination,alightSpot,trafficOccupants,drawCabinOccupants} from './passengers.mjs';
import {drawMotorcycle} from './motorcycles.mjs';

const walker=(seed,x=0,y=0)=>({body:'walk',seed,x,y,edge:0,t:.5,side:1});
const hitcher=start=>{for(let s=start;;s++){const a=walker(s);if(canHitchhike(a))return a;}};

test('Q21 seats: capacity follows the vehicle (car 4, scooter 1, Ape 1, van 2, stalls none)',()=>{
 assert.equal(seatCapacity({model:'punto-188-red'}),4);
 assert.equal(seatCapacity({vehicleType:'motorcycle',model:'moto-scooter-sh-red'}),1);
 assert.equal(seatCapacity({model:'ape-classica-verde'}),1);
 assert.equal(seatCapacity({model:'furgone-fritti'}),2);
 assert.equal(seatCapacity({model:'food-panini',vendorStand:true}),0);
 const v={model:'panda-modern-white'};assert.deepEqual(ensureSeats(v),[null,null,null,null]);
});

test('Q21 boarding: one person one seat, never twice, never beyond capacity, not on a vehicle ridden by an NPC',()=>{
 const bike={vehicleType:'motorcycle',model:'moto-scooter-retro-blue'};
 const a=walker(1),b=walker(2);
 assert.equal(boardPassenger(bike,a),0);
 assert.equal(a.aboard.vehicle,bike);assert.equal(a.indoors,true,'not drawn nor collidable while on board');
 assert.equal(boardPassenger(bike,b),-1,'scooter full');
 const car={model:'panda-modern-white'};
 assert.equal(boardPassenger(car,a),-1,'already on another vehicle: no duplicate');
 assert.equal(freeSeat(bike),-1);
 assert.equal(alightPassenger(bike,0),a);assert.equal(a.aboard,null);assert.equal(a.indoors,false);
 assert.equal(occupantsOf(bike).length,0);
 assert.equal(boardPassenger(car,a),0);assert.equal(boardPassenger(car,b),1);
 assert.equal(occupantsOf(car).length,2);
 assert.equal(boardPassenger({model:'moto-scooter-sh-red',vehicleType:'motorcycle',npcRider:{}},walker(3)),-1);
});

test('Q21 who asks for a lift: only free anonymous passers-by, about one in five',()=>{
 let yes=0;
 for(let s=1;s<=1000;s++)if(canHitchhike(walker(s)))yes++;
 assert.ok(yes>140&&yes<260,'share '+yes);
 const h=hitcher(10);
 for(const extra of [{residentRoutine:{}},{profession:'vigile'},{commuter:true},{market:true},{indoors:true},{social:{hold:true}},{impactTime:.4},{crossing:{}},{stationary:true}])
  assert.equal(canHitchhike({...h,...extra}),false,JSON.stringify(extra));
});

test('Q21 lift candidate: vehicle stopped, a free seat, the person right by the side',()=>{
 const car={x:0,y:0,a:0,model:'panda-modern-white'};
 const h={...hitcher(40),x:0,y:5};
 assert.equal(liftCandidate([h],car,{speed:0}),h);
 assert.equal(liftCandidate([h],car,{speed:PASSENGER_RULES.stopSpeed+1}),null,'moving');
 assert.equal(liftCandidate([{...h,y:12}],car,{speed:0}),null,'too far');
 assert.equal(liftCandidate([h],car,{speed:0,skip:a=>a===h}),null,'busy with a city event');
 assert.equal(hitchhikersNear([{...h,y:12}],car)[0].distance>0,true,'still shown as asking from the pavement');
 const full={x:0,y:0,a:0,vehicleType:'motorcycle',model:'moto-scooter-sh-red'};boardPassenger(full,walker(77));
 assert.equal(liftCandidate([h],full,{speed:0}),null,'no free seat');
});

const graph=buildRoadGraph([{id:1,n:'Via Roma',t:'residential',w:8,p:[0,0,400,0,800,0]},{id:2,n:'Traversa',t:'residential',w:8,p:[400,-300,400,0,400,300]}]);
const place=(id,t,side=1)=>lanePosition(graph,id,t,'walk',side);

test('Q21 getting out: on the nearest pavement, with the right edge, t and side (no jump afterwards)',()=>{
 const car={x:150,y:0,a:0,model:'panda-modern-white'};
 const spot=alightSpot(graph,car,{place});
 assert.ok(spot,'found');
 const back=lanePosition(graph,spot.edge,spot.t,'walk',spot.side);
 assert.ok(Math.hypot(back.x-spot.x,back.y-spot.y)<1e-9,'position matches the walking lane');
 assert.ok(spot.distance<14);
 assert.equal(alightSpot(graph,car,{place,valid:()=>false}),null,'never into a wall');
 const other=alightSpot(graph,car,{place,blocked:(x,y)=>y>0});
 assert.ok(other&&other.y<0,'the free side when one side is blocked');
 const doors=doorSpots(car);
 assert.equal(doors.length,2);assert.ok(doors[0].y>0&&doors[1].y<0,'passenger (right) side first');
 assert.ok(Math.abs(Math.hypot(doors[0].x-car.x,doors[0].y-car.y)-3.6)<1e-9);
});

test('Q21 destination: a real pavement 160–620 m away, stable for the same passenger',()=>{
 const from={x:150,y:2},d=liftDestination(graph,from,4242,{place});
 assert.ok(d);const dist=Math.hypot(d.x-from.x,d.y-from.y);
 assert.ok(dist>=PASSENGER_RULES.trip[0]&&dist<=PASSENGER_RULES.trip[1],'distance '+dist);
 assert.deepEqual(liftDestination(graph,from,4242,{place}),d);
});

test('Q21 traffic occupants: the same people on the same seats for a vehicle, renewed only with a new identity',()=>{
 let cars=0,carried=0,max=0;
 for(let s=1;s<=400;s++){
  const v={body:'car',seed:s,model:'punto-188-red'},o=trafficOccupants(v);
  cars++;if(o.length)carried++;max=Math.max(max,o.length);
  assert.equal(trafficOccupants(v),o,'stable');
  assert.ok(new Set(o.map(p=>p.seat)).size===o.length,'one person per seat');
 }
 assert.ok(carried/cars>.3&&carried/cars<.55,'share '+carried/cars);
 assert.ok(max<=3);
 const v={body:'car',seed:9,model:'punto-188-red'},o=trafficOccupants(v);v.seed=10;
 assert.notEqual(trafficOccupants(v),o);
 for(let s=1;s<=200;s++)assert.ok(trafficOccupants({body:'car',seed:s,vehicleType:'motorcycle',model:'moto-scooter-sh-red'}).length<=1);
 assert.equal(trafficOccupants({body:'car',seed:3,commuter:true}).length,0);
});

function recorder(){
 const calls={arc:0,ellipse:0,fill:0};
 const ctx=new Proxy({},{get:(t,k)=>k in calls?(...a)=>{calls[k]++;}:k==='canvas'?{}:typeof k==='string'&&/^(save|restore|translate|rotate|beginPath|stroke|fillRect|moveTo|lineTo|strokeRect|drawImage|setLineDash)$/.test(k)?()=>{}:t[k],set:(t,k,v)=>{t[k]=v;return true;}});
 ctx.globalAlpha=1;return {ctx,calls};
}
test('Q21 drawing: heads behind the windscreen, the pillion on the rear seat as a second figure',()=>{
 const a=recorder();drawCabinOccupants(a.ctx,0,0,0,{model:'panda-modern-white'},[{seat:0,hair:'#222',jacket:'#555'}],{driver:true});
 assert.ok(a.calls.arc>=4,'driver and passenger heads (+glass highlights)');
 const solo=recorder(),two=recorder();
 drawMotorcycle(solo.ctx,0,0,0,'moto-scooter-sh-red',{rider:true});
 drawMotorcycle(two.ctx,0,0,0,'moto-scooter-sh-red',{rider:true,pillion:{jacket:'#406b87',helmet:'#e9e6dc'}});
 assert.ok(two.calls.ellipse>=solo.calls.ellipse+5,'helmet, body, hands and legs of the passenger');
});

test('Q21 game wiring: E gives a lift or lets passengers out before leaving the vehicle; HUD and drawing',async()=>{
 const [game,html]=await Promise.all(['game.mjs','index.html'].map(f=>readFile(new URL('./'+f,import.meta.url),'utf8')));
 assert.match(game,/from '\.\/passengers\.mjs\?v=\d+'/);
 const t=game.indexOf('function toggleVehicle(){'),lift=game.indexOf('const hitch=liftHere(vehicle);',t),exit=game.indexOf("if(bike&&Math.abs(vehicle.speed||0)>2.3)",t);
 assert.ok(t>0&&lift>t&&exit>lift,'lift and drop-off come before getting out');
 assert.match(game,/if\(occupantsOf\(vehicle\)\.length\)\{dropPassengers\(vehicle\);updateHud\(\);return;\}/);
 assert.match(game,/state\.people\.splice\(i,1\)/,'a passenger is off the pavement while on board');
 assert.match(game,/state\.people\.push\(npc\);if\(state\.dynamicCollision\)addToCollisionIndex\(state\.dynamicCollision,npc\);/);
 assert.match(game,/liftHere\(ride\)\?'DAI UN PASSAGGIO':aboard\?'FAI SCENDERE'/);
 assert.match(game,/pillion:\(drive\|\|vehicle\.rider\)\?riders\[0\]\|\|null:null/);
 assert.match(game,/drawCabinOccupants\(c,x,y,a,vehicle,riders/);
 assert.ok(Number((html.match(/game\.mjs\?v=(\d+)/)||[])[1])>=172);
});
