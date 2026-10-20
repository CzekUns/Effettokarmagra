import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {buildRoadGraph,createAgents,stepAgents,balanceTraffic,createGateVehicle,lanePosition} from './roads.mjs';
import {findBorderGates,borderGateList,distanceToBorder,borderRing,GATE_RULES} from './border-gates.mjs';
import {vehiclesOverlap} from './traffic-collision.mjs';

// Un comune quadrato 1000×1000: una via est-ovest che lo attraversa, un senso unico che esce a sud,
// uno che entra da nord, e un vicolo cieco interno che NON è un varco.
const border=[0,0,1000,0,1000,1000,0,1000];
const roads=[
 {id:11,n:'Via Ovest',t:'residential',w:8,p:[0,500,250,500,500,500]},
 {id:12,n:'Via Est',t:'residential',w:8,p:[500,500,750,500,1000,500]},
 {id:13,n:'Uscita Sud',t:'residential',w:8,o:true,p:[500,500,500,750,500,1000]},
 {id:14,n:'Ingresso Nord',t:'residential',w:8,o:true,p:[500,0,500,250,500,500]},
 {id:15,n:'Vicolo',t:'residential',w:8,p:[250,500,250,700]}
];
const graph=buildRoadGraph(roads,{border});
const dt=.05,everywhere=[-2000,-2000,3000,3000],nowhere=[9e5,9e5,9e5+1,9e5+1];
const ring=borderRing(border),outside=v=>v.x<0||v.x>1000||v.y<0||v.y>1000;
const at=(n,p)=>graph.nodes[n].x===p[0]&&graph.nodes[n].y===p[1];
const edgeOf=(name,from,to)=>graph.edges.findIndex(e=>e.name===name&&e.car&&at(e.from,from)&&at(e.to,to));
function carOn(edge,t,seed=7){
 const [car]=createAgents(graph,1,seed,'car',[]);
 Object.assign(car,lanePosition(graph,edge,t,'car'),{edge,t,speed:12,v:12,wait:0});
 return car;
}

test('BF09 gates: the street ends cut by the border, with road, OSM way, directions and WGS84',()=>{
 const gates=graph.gates;
 assert.equal(gates.length,4,'west, east, south, north (not the inner dead end)');
 const by=name=>gates.find(g=>g.name===name);
 assert.equal(by('Via Ovest').direction,'entrambi');assert.equal(by('Via Est').direction,'entrambi');
 assert.equal(by('Uscita Sud').direction,'uscita');assert.equal(by('Ingresso Nord').direction,'entrata');
 assert.equal(by('Uscita Sud').entry,null);assert.equal(by('Ingresso Nord').exit,null);
 // l'angolo punta fuori dal comune
 for(const g of gates)assert.ok(outside({x:g.x+Math.cos(g.angle)*5,y:g.y+Math.sin(g.angle)*5}),g.name);
 assert.ok(gates.every(g=>distanceToBorder(g.x,g.y,ring)<=GATE_RULES.tolerance));
 assert.equal(findBorderGates(graph,null).length,0);
 const list=borderGateList(gates,{minLon:14.2,maxLat:40.93,cos:.7556});
 assert.deepEqual(Object.keys(list[0]).sort(),['angoloUscita','comune','id','lat','lon','osmWay','sensi','strada','tipo','usatoDalTraffico','x','y'].sort());
 assert.equal(list[0].comune,'','the neighbouring town is not in the data: left empty');
 assert.ok(list.every(g=>g.lon>=14.2&&g.lat<=40.93));
 assert.equal(buildRoadGraph(roads).gates.length,0,'no border, no gates');
});

test('BF09 a one-way street leaving the town is no longer a trap (BF03), and counts as a through exit',()=>{
 const south=edgeOf('Uscita Sud',[500,750],[500,1000]);
 assert.equal(buildRoadGraph(roads).liveCar[south],0,'without gates: a one-way terminal');
 assert.equal(graph.liveCar[south],1);
 assert.ok(graph.throughStarts.includes(south));
});

test('BF09 a car reaching a gate drives into the dark and fades, then another car comes in from a free gate',()=>{
 const east=edgeOf('Via Est',[750,500],[1000,500]),car=carOn(east,.9);
 const exitGate=graph.gates.find(g=>g.name==='Via Est');
 let out=false,faded=false,limbo=false,came=null,back=false,uTurn=false,prev={x:car.x,y:car.y,fade:1},maxStep=0;
 for(let i=0;i<900;i++){
  const was=car.edge;
  stepAgents(graph,[car],dt,null,{view:everywhere});
  const e=graph.edges[car.edge];
  if(was!==car.edge&&graph.edges[was].to===exitGate.node&&e.to===graph.edges[was].from&&!car.gateMode)uTurn=true;
  if(car.gateMode?.kind==='out'){out=true;assert.ok(car.t>=1,'t runs past the end of the edge');if(car.gateFade<.5)faded=true;}
  if(car.gateLimbo||car.gateMode?.kind==='out'&&car.gateFade===0)limbo=true;
  if(car.gateMode?.kind==='in'&&!came){came={gate:car.gateMode.gate,fade:car.gateFade,outside:outside(car)};}
  // a moving step is always small; the only jump is while invisible (limbo)
  const step=Math.hypot(car.x-prev.x,car.y-prev.y);
  if((car.gateFade??1)>0&&(prev.fade??1)>0)maxStep=Math.max(maxStep,step);
  prev={x:car.x,y:car.y,fade:car.gateFade};
  if(came&&!car.gateMode){back=true;break;}
 }
 assert.ok(out&&faded,'drives on beyond the cut and fades');
 assert.equal(uTurn,false,'no U-turn at the border');
 assert.ok(limbo,'fades out completely before it is moved');
 assert.ok(came&&came.gate!==exitGate.index,'comes back from another gate');
 assert.ok(came.outside&&came.fade<.05,'out of the dark: starts beyond the border, invisible');
 assert.ok(back,'and drives on in the town');
 assert.ok(maxStep<20*dt,'no visible jump: '+maxStep.toFixed(2));
 assert.ok(car.gateExits>=1&&car.gateEntries>=1);
});

test('BF09 nobody comes in while the first metres of the lane are taken; it waits unseen',()=>{
 const blockers=graph.gates.filter(g=>g.entry!==null).map((g,i)=>{const e=graph.edges[g.entry],a=graph.nodes[e.from],b=graph.nodes[e.to],t=4/e.len;
  return {x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,a:e.angle,body:'car',speed:0,model:'panda-modern-white'};});
 const v=createGateVehicle(graph,4242,{vehicleType:'car',model:'punto-188-red'});
 for(let i=0;i<60;i++)stepAgents(graph,[v],dt,null,{view:everywhere,parked:blockers});
 assert.equal(v.gateLimbo,true,'still waiting beyond the border');
 assert.equal(v.gateFade,0);
 assert.ok(blockers.every(b=>!vehiclesOverlap(v,b,0)));
 let entered=false;
 for(let i=0;i<60&&!entered;i++){stepAgents(graph,[v],dt,null,{view:everywhere,parked:[]});entered=v.gateMode?.kind==='in';}
 assert.ok(entered,'comes in once the lane is free');
});

test('BF09 balanceTraffic: more vehicles come in from the gates, extra ones leave out of sight or at a gate',()=>{
 const traffic=createAgents(graph,3,91,'car',[]);let n=0;
 const make=()=>createGateVehicle(graph,5000+(n++)*17,{vehicleType:n%4===2?'motorcycle':'car',model:'punto-188-red'});
 const firstSeen=new Map();
 for(let i=0;i<400;i++){
  stepAgents(graph,traffic,dt,null,{view:everywhere});
  balanceTraffic(graph,traffic,6,{view:everywhere},make);
  for(const v of traffic)if(!v.gateLimbo&&!firstSeen.has(v))firstSeen.set(v,{x:v.x,y:v.y,fade:v.gateFade??1});
 }
 assert.equal(traffic.length,6);
 const born=[...firstSeen].filter(([v])=>v.seed>=5000||v.gateEntries);
 assert.ok(born.length>=3);
 for(const [,at] of born)assert.ok(outside(at)&&at.fade<.05,'a new vehicle shows up only beyond a gate');
 // down to 2 with nobody watching: the extra ones go at once
 const r=balanceTraffic(graph,traffic,2,{view:nowhere},make);
 assert.ok(r.removed+balanceTraffic(graph,traffic,2,{view:nowhere},make).removed>=4);
 assert.equal(traffic.filter(v=>!v.retire).length,2);
 // in plain view they are only marked: they leave at the next gate
 balanceTraffic(graph,traffic,6,{view:everywhere},make);
 for(let i=0;i<10;i++){stepAgents(graph,traffic,dt,null,{view:everywhere});balanceTraffic(graph,traffic,6,{view:everywhere},make);}
 const r2=balanceTraffic(graph,traffic,1,{view:everywhere},make);
 assert.equal(r2.removed,0,'not removed in view');
 assert.ok(traffic.filter(v=>v.retire).length>=1);
});

test('BF09 commuters and planned paths never use the gates',()=>{
 const east=edgeOf('Via Est',[750,500],[1000,500]),car=carOn(east,.95);
 car.path=[east];
 for(let i=0;i<120;i++)stepAgents(graph,[car],dt,null,{view:everywhere});
 assert.equal(car.gateMode,undefined);
});

test('BF09 game wiring: gates on load and on the width switch, straight cut, mouths, fading, balance, versions',async()=>{
 const [game,html,commute]=await Promise.all(['game.mjs','index.html','npc-commute.mjs'].map(f=>readFile(new URL('./'+f,import.meta.url),'utf8')));
 assert.equal((game.match(/buildRoadGraph\(state\.roads,\{border:state\.map\.border,gateClear:\(x,y\)=>!buildingAt\(x,y\)\}\)/g)||[]).length,2);
 assert.match(game,/state\.borderGates=borderGateList\(state\.graph\.gates,state\.map\.projection\)/);
 assert.equal((game.match(/\{ctx\.save\(\);borderPath\(ctx\);ctx\.clip\(\);drawCityStreets\(ctx,roads,/g)||[]).length,2,'streets cut along the border, also under a lifted roof');
 assert.match(game,/function nearBorder\(x0,y0,x1,y1,margin=12\)/,'only near the border: the clip is not paid in the centre');
 assert.match(game,/borderPath\(ctx,true\);ctx\.clip\('evenodd'\);drawBorderGates\(ctx,gates\)/,'mouths only outside the border');
 assert.match(game,/g\.save\(\);if\(nearBorder\(x0,y0,x1,y1\)\)\{borderPath\(g\);g\.clip\(\);\}/,'wet asphalt cut too');
 assert.match(game,/const fade=ai\.gateFade\?\?1;if\(fade<=\.01\)continue;/);
 assert.match(game,/balanceTraffic\(state\.graph,state\.traffic,state\.trafficTarget,\{view\},newGateVehicle\)/);
 assert.match(game,/state\.trafficTarget=TRAFFIC_COUNT/);
 for(const src of [game,commute])assert.ok(Number((src.match(/from '\.\/roads\.mjs\?v=(\d+)'/)||[])[1])>=149,'roads.mjs almeno v=149');
 assert.ok(Number((html.match(/game\.mjs\?v=(\d+)/)||[])[1])>=159);
});
