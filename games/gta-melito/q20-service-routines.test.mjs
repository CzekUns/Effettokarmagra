import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {buildRoadGraph,createAgents,stepAgents,lanePosition} from './roads.mjs';
import {makeCollisionIndex,vehiclesOverlap,vehicleShape,trafficMoveBlocked} from './traffic-collision.mjs';
import {buildParkingBays,nearestFreeStalls,fitsParkingBay,parkInStall} from './parking-bays.mjs';
import {moveStreetObject} from './street-objects.mjs';
import {planRoute} from './npc-commute.mjs';
import {createServiceRoutines,stepServiceRoutines,makeBusStops,reportBreakdown,serviceKind,SERVICE_RULES} from './service-routines.mjs';
import {vs} from './world-scale.mjs';

const dt=.05;
const FAR=[5000,5000,5100,5100];// nessuna camera sulla scena: le riconsegne fuori vista sono subito possibili
function world(graph,{traffic=[],parked=[],people=[],doors=[],objects=null,view=FAR}={}){
 const bays=buildParkingBays(graph);
 const all=()=>[...parked,...traffic].filter(v=>Math.abs(v.x)<1e5);
 const ctx={graph,traffic,parked,people,doors,objects,view,playerVehicle:null,clockMinutes:600,
  canStand:()=>true,onRoad:()=>false,
  freeStalls:(x,y,r)=>nearestFreeStalls(bays,x,y,all(),vehiclesOverlap,{radius:r,limit:8}),
  stallTaken:(stall,agent)=>all().some(v=>v!==agent&&vehiclesOverlap({x:stall.x,y:stall.y,a:stall.a,body:'car'},v)),
  // come game.mjs: sosta breve, il furgone si controlla con la larghezza di un'auto in scala BF14
  fits:(pose,v)=>{const sh=vehicleShape({...v,...pose});return fitsParkingBay(bays,pose,{halfLength:sh.halfLength,halfWidth:Math.min(sh.halfWidth,vs(1.7))});},
  blocked:(agent,pose)=>trafficMoveBlocked(agent,{...pose,vehicleType:'car',model:agent.model},'car',makeCollisionIndex([...all(),...people]),agent),
  shape:v=>vehicleShape(v),carPosition:(e,t)=>lanePosition(graph,e,t,'car'),
  planRoute:(a,b)=>planRoute(graph,a,b,'car'),moveObject:(o,x,y)=>moveStreetObject(objects,o,x,y),parkInStall,
  freeStallOutOfView:car=>nearestFreeStalls(bays,car.x<1e5?car.x:0,car.y<1e5?car.y:0,all(),vehiclesOverlap,{limit:30})
   .find(st=>st.x<view[0]||st.x>view[2]||st.y<view[1]||st.y>view[3]&&fitsParkingBay(bays,{x:st.x,y:st.y,a:st.a},vehicleShape(car)))||null,
  said:[],say:(a,t)=>ctx.said.push(t)};
 return {ctx,bays};
}
function run(graph,ctx,s,seconds,onTick=()=>{}){
 for(let i=0;i<seconds/dt;i++){
  if(ctx.people.length)stepAgents(graph,ctx.people.filter(p=>!p.frozen),dt,null,{parked:ctx.parked,traffic:ctx.traffic,view:ctx.view});
  stepAgents(graph,ctx.traffic,dt,null,{parked:ctx.parked,people:ctx.people,view:ctx.view});
  stepServiceRoutines(s,dt,ctx);
  if(onTick(i*dt)===true)return;
 }
}
const one=(graph,model,seed=7,edgePick=null)=>{
 const [v]=createAgents(graph,1,seed,'car',[],{model:()=>model});
 if(edgePick!=null){const e=graph.edges[edgePick],p=lanePosition(graph,edgePick,.08,'car');Object.assign(v,{edge:edgePick,t:.08,x:p.x,y:p.y,a:e.angle});}
 return v;
};
const eastEdge=(graph,x0=0)=>graph.edges.findIndex(e=>e.car&&Math.abs(e.angle)<1e-6&&graph.nodes[e.from].x===x0);

test('Q20 kinds: the four service models, nothing else',()=>{
 assert.equal(serviceKind('corriere-bianco'),'courier');assert.equal(serviceKind('nettezza-verde'),'refuse');
 assert.equal(serviceKind('attrezzi-rosso'),'tow');assert.equal(serviceKind('autobus-blu'),'bus');
 assert.equal(serviceKind('panda-modern-white'),null);assert.equal(serviceKind(undefined),null);
});

test('Q20 courier: into a free stall next to a door, the driver delivers and walks back, the van drives on (no jumps)',()=>{
 const graph=buildRoadGraph([{id:1,n:'Via Prova',t:'residential',w:8,p:[0,0,500,0]}]);
 const E=eastEdge(graph),e=graph.edges[E],pave=e.streetWidth/2+1.7;
 const door={x:150,y:pave+2.5,wallX:150,wallY:pave+3.5,open:0,label:'Portone di prova'};
 const van=one(graph,'corriere-bianco',11,E);van.speed=8;
 const traffic=[van],{ctx,bays}=world(graph,{traffic,doors:[door]});
 // BF14: in ogni stallo della residenziale un'auto ci sta (anche se lo stallo è al minimo verso la corsia),
 // e così il furgone controllato con la larghezza di un'auto; a tutta larghezza il suo disegno entrerebbe
 // nel margine della corsia.
 const vanShape=vehicleShape(van),pose=st=>({x:st.x,y:st.y,a:e.angle});
 assert.ok(bays.stalls.length>0&&bays.stalls.every(st=>fitsParkingBay(bays,{x:st.x,y:st.y,a:st.a},vehicleShape({model:'panda-modern-white'}))),'a car fits its own stalls');
 assert.ok(bays.stalls.filter(st=>st.side>0).every(st=>ctx.fits(pose(st),van)),'the van fits checked as a car');
 assert.equal(bays.stalls.some(st=>fitsParkingBay(bays,pose(st),vanShape)),false,'at full width it would not');
 const s=createServiceRoutines(graph,{test:true});
 let after=-1e9,prev={x:van.x,y:van.y},maxStep=0,inStall=false,driverAtDoor=false,doorOpened=false,stallPose=null;
 // BF14: gli stalli sono lunghi vs(7,2): il primo con un portone entro doorRadius è un altro, ~4 m più lontano
 // dal portone, e l'autista cammina ~5 s in più fra andata e ritorno. Il film è più lungo, le verifiche restano.
 run(graph,ctx,s,70,()=>{
  maxStep=Math.max(maxStep,Math.hypot(van.x-prev.x,van.y-prev.y));prev={x:van.x,y:van.y};
  const job=s.jobs.get(van);
  if(job?.pose&&!s.stats.courier.done){stallPose=job.pose;if(Math.hypot(van.x-job.pose.x,van.y-job.pose.y)<.05&&van.serviceHold)inStall=true;}
  if(job?.driver&&Math.hypot(job.driver.x-door.x,job.driver.y-door.y)<.05)driverAtDoor=true;
  if(door.open>0)doorOpened=true;
  if(s.stats.courier.done&&stallPose)after=Math.max(after,van.x-stallPose.x);
 });
 assert.ok(s.stats.courier.done>=1,JSON.stringify(s.log));
 assert.ok(inStall,'stood still in the stall');assert.ok(driverAtDoor&&doorOpened,'the driver reached the door and it opened');
 assert.ok(stallPose.y>e.streetWidth/2-4&&stallPose.y<pave,'the stall is between the lane and the pavement');
 assert.ok(maxStep<.9,'no jumps: '+maxStep.toFixed(2)+' m per step');
 assert.ok(after>5,'back in the van and on its way again: '+after.toFixed(1));
 assert.ok(ctx.said.includes('Pacco per lei!'));
});

test('Q20 refuse truck: stops beside a bin, the operator empties it and puts it back exactly, then the truck goes on',()=>{
 const graph=buildRoadGraph([{id:1,n:'Via Prova',t:'residential',w:8,p:[0,0,500,0]}]);
 const E=eastEdge(graph),e=graph.edges[E];
 const home={x:130,y:e.streetWidth/2+3.4,a:0},bin={id:1,x:home.x,y:home.y,a:0,home:{...home},tipped:false,vx:0,vy:0};
 const objects={bins:[bin],bollards:[],grid:new Map(),awake:new Set(),clock:0};
 const truck=one(graph,'nettezza-verde',5,E);truck.speed=9;
 const {ctx}=world(graph,{traffic:[truck],objects});
 const s=createServiceRoutines(graph,{test:true});
 let maxCruise=0,away=0,moved=false,stopped=false;
 // BF14: corsia e camion in scala, bidone fermo dov'era: l'operatore cammina ~1,5 m in più per tratto
 // (quattro tratti), il lavoro dura ~27 s invece di ~24. Il film è più lungo, le verifiche restano le stesse.
 run(graph,ctx,s,60,()=>{
  if(s.clock>.2)maxCruise=Math.max(maxCruise,truck.speed);away=Math.max(away,Math.hypot(bin.x-home.x,bin.y-home.y));
  if(away>.5)moved=true;if(truck.serviceHold)stopped=true;
 });
 assert.ok(maxCruise<=SERVICE_RULES.refuse.cruise+1e-9,'drives slowly: cruise '+maxCruise);
 assert.ok(stopped&&moved,'stopped and the bin was carried to the truck');
 assert.ok(away<9,'carried a few metres, not thrown: '+away.toFixed(1));
 assert.deepEqual([bin.x,bin.y],[home.x,home.y],'back exactly where it was');
 assert.ok(s.stats.refuse.done>=1&&s.stats.refuse.bins>=1,JSON.stringify(s.log));
 assert.equal(s.stats.refuse.failed,0,'finished in time, not cut short: '+JSON.stringify(s.log));
 assert.equal(s.figures.length,0);assert.ok(truck.x>home.x+10,'and goes on');
});

test('Q20 tow truck: fetches a broken-down parked car, loads it, takes it away, the car reappears in another stall',()=>{
 // un isolato quadrato: il carro attrezzi può fare il giro per arrivare dal lato giusto
 const graph=buildRoadGraph([
  {id:1,n:'Via Nord',t:'residential',w:8,p:[0,0,300,0]},{id:2,n:'Via Est',t:'residential',w:8,p:[300,0,300,300]},
  {id:3,n:'Via Sud',t:'residential',w:8,p:[300,300,0,300]},{id:4,n:'Via Ovest',t:'residential',w:8,p:[0,300,0,0]}]);
 const {ctx,bays}=world(graph,{});
 const E=eastEdge(graph);
 const stall=bays.stalls.filter(st=>st.edge===E||Math.abs(st.y-(graph.edges[E].streetWidth/2+2))<3).find(st=>st.x>140&&st.x<200&&st.y>0);
 assert.ok(stall,'a stall on the right of Via Nord');
 const car=parkInStall({type:1,model:'panda-fire-red',vehicleType:'car',body:'car'},stall);
 const truck=one(graph,'attrezzi-rosso',9,graph.edges.findIndex(e=>e.car&&e.name==='Via Sud'));truck.speed=8;
 ctx.parked.push(car);ctx.traffic.push(truck);
 const s=createServiceRoutines(graph,{test:true});
 const home={x:car.x,y:car.y};let loaded=false,hazard=false,maxCarStep=0,prevCar={x:car.x,y:car.y};
 run(graph,ctx,s,240,()=>{
  if(car.hazard)hazard=true;if(truck.towed===car)loaded=true;
  if(Math.abs(car.x)<1e5&&Math.abs(prevCar.x)<1e5)maxCarStep=Math.max(maxCarStep,Math.hypot(car.x-prevCar.x,car.y-prevCar.y));
  prevCar={x:car.x,y:car.y};
  return s.stats.tow.delivered>=1;// fermiamo il film alla riconsegna (in prova un nuovo guasto arriva presto)
 });
 assert.ok(hazard,'four hazard lights while waiting');assert.ok(loaded,'loaded on the flatbed '+JSON.stringify(s.log));
 assert.equal(s.stats.tow.delivered,1,JSON.stringify(s.log));
 assert.ok(Math.abs(car.x)<1e5&&car.parkingBay,'parked again');assert.ok(Math.hypot(car.x-home.x,car.y-home.y)>5,'in another stall');
 assert.equal(car.broken,null);assert.equal(car.towedBy,null);assert.equal(truck.towed,null);
 assert.equal(ctx.parked.filter(v=>v===car).length,1,'still one car, no copy');
 assert.ok(maxCarStep<.8,'loaded smoothly, no jump: '+maxCarStep.toFixed(2));
});

test('Q20 Q23 hook: a damaged car can be reported for the tow truck',()=>{
 const s=createServiceRoutines({edges:[],nodes:[]});
 const car={x:1,y:2,a:0,model:'panda-fire-red'};
 assert.equal(reportBreakdown(s,car,{reason:'danni'}),true);assert.equal(car.broken.reason,'danni');assert.equal(car.hazard,true);
 assert.equal(reportBreakdown(s,car),false,'not twice');assert.equal(s.broken.length,1);
});

test('Q20 bus: simulated stops on main roads; passers-by wait, board without copies, ride and get off at another stop',()=>{
 const graph=buildRoadGraph([{id:1,n:'Corso di Prova',t:'primary',w:12,p:[0,0,420,0]},{id:2,n:'Corso di Prova',t:'primary',w:12,p:[420,0,840,0]},{id:3,n:'Corso di Prova',t:'primary',w:12,p:[840,0,1260,0]}]);
 const stops=makeBusStops(graph,{walkPosition:(e,t,side)=>lanePosition(graph,e,t,'walk',side),carPosition:(e,t)=>lanePosition(graph,e,t,'car')});
 const east=stops.filter(st=>Math.abs(graph.edges[st.edge].angle)<1e-6).sort((a,b)=>a.x-b.x);
 assert.ok(east.length>=3,'three stops eastbound');
 for(let i=0;i<stops.length;i++)for(let j=i+1;j<stops.length;j++)assert.ok(Math.hypot(stops[i].walk.x-stops[j].walk.x,stops[i].walk.y-stops[j].walk.y)>=SERVICE_RULES.bus.stopSpacing);
 assert.equal(stops.some(st=>/\d/.test(st.name)),false,'no line numbers');
 const people=createAgents(graph,24,41,'walk',[]);
 for(const [k,p] of people.entries()){const st=east[k%3],q=lanePosition(graph,st.edge,st.t+((k%5)-2)*.02,'walk',1);Object.assign(p,{edge:st.edge,t:st.t+((k%5)-2)*.02,side:1,x:q.x,y:q.y});}
 const bus=one(graph,'autobus-blu',3,east[0].edge);bus.speed=9;
 const s=createServiceRoutines(graph,{test:true,walkPosition:(e,t,side)=>lanePosition(graph,e,t,'walk',side),carPosition:(e,t)=>lanePosition(graph,e,t,'car')});
 const {ctx}=world(graph,{traffic:[bus],people});
 let doorsOpen=false,maxRiders=0,dup=false;
 // la prima fermata ha gente in attesa prima che arrivi l'autobus
 bus.serviceNext=1e9;run(graph,ctx,s,8);
 assert.ok(s.stops.some(st=>st.waiting.length>=1),'someone waits at a stop');
 bus.serviceNext=0;
 run(graph,ctx,s,210,()=>{
  if(bus.busDoors>=1)doorsOpen=true;maxRiders=Math.max(maxRiders,(bus.busRiders||[]).length);
  const seen=new Set();
  for(const p of people){const where=(p.indoors?'a bordo':'')+(p.busStop?'fermata':'');if(where==='a bordofermata')dup=true;}
  for(const p of bus.busRiders||[]){if(seen.has(p))dup=true;seen.add(p);if(!p.indoors)dup=true;}
 });
 assert.ok(doorsOpen,'doors opened');assert.equal(bus.busDoors||0,0,'and closed');
 assert.ok(s.stats.bus.stops>=3,JSON.stringify(s.log.slice(-6)));
 assert.ok(s.stats.bus.boarded>=1&&maxRiders>=1,'passers-by got on: '+s.stats.bus.boarded);
 assert.ok(maxRiders<=SERVICE_RULES.bus.capacity);assert.equal(dup,false,'never two places at once');
 assert.ok(s.stats.bus.alighted>=1,'and someone got off later');
 for(const p of people)if(!p.indoors&&!p.busStop)assert.equal(p.serviceHold,undefined,'off the bus they walk again');
 assert.ok(bus.x>east[2].x||bus.edge!==east[2].edge,'the bus goes on after the last stop');
});

test('Q20 game wiring: roads skip held vehicles, routines stepped after the traffic, drawn, hazards, cache',async()=>{
 const [game,roads,html,reactions,social]=await Promise.all(['game.mjs','roads.mjs','index.html','npc-reactions.mjs','npc-social.mjs'].map(f=>readFile(new URL('./'+f,import.meta.url),'utf8')));
 assert.match(roads,/if\(agent\.serviceHold\)\{agent\.braking=true;agent\.stalled=0;agent\.turnSignal=null;continue;\}/);
 assert.match(game,/import \{createServiceRoutines,stepServiceRoutines,drawBusStops,drawBusDoors,drawWarningTriangle,towedCarPose\} from '\.\/service-routines\.mjs\?v=\d+'/);
 const b=game.indexOf('balanceTraffic(state.graph,state.traffic'),st=game.indexOf('stepServiceRoutines(state.service,elapsed');
 assert.ok(b>0&&st>b,'after the traffic step');
 assert.equal((game.match(/state\.market=createMelitoMarket\(\);state\.service=createServices\(\);/g)||[]).length,2,'on load and on the width switch');
 assert.match(game,/for\(const side of v\.hazard\?\[1,-1\]:\[v\.turnSignal==='right'\?1:-1\]\)/);
 assert.match(game,/if\(ai\.towed\)\{const tp=towedCarPose\(/);assert.match(game,/if\(v\.broken&&i!==p\.car\)/);
 assert.match(reactions,/!a\.serviceHold/);assert.match(social,/agent\.serviceHold\)return false/);
 assert.ok(Number((html.match(/game\.mjs\?v=(\d+)/)||[])[1])>=179);
});
