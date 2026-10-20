import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {buildRoadGraph,createAgents,stepAgents} from './roads.mjs';
import {placeRoadSurfaces,roadSurfaceEffect,kerbEffect,feelKind,onSurfaceHit,emitSurfaceHit,surfacesNear,SURFACE_RULES,SURFACE_FICTION,drawRoadSurfaces,drawSurfacePuddles} from './road-surfaces.mjs';

const map=JSON.parse(await readFile(new URL('./data/melito-map.json',import.meta.url),'utf8'));
const real=buildRoadGraph(map.roads);
const placed=placeRoadSurfaces(real,{anchors:map.pois.filter(q=>q.k==='school').map(q=>({x:q.p[0],y:q.p[1],label:'scuola'}))});

test('Q24 real map: deterministic fictional details on the carriageway, never at junctions or crossings',()=>{
 assert.equal(SURFACE_FICTION,true,'declared as arcade fiction, not surveyed potholes');
 const again=placeRoadSurfaces(buildRoadGraph(map.roads),{anchors:map.pois.filter(q=>q.k==='school').map(q=>({x:q.p[0],y:q.p[1],label:'scuola'}))});
 assert.deepEqual(again.items.map(q=>[q.kind,Math.round(q.x*10),Math.round(q.y*10)]),placed.items.map(q=>[q.kind,Math.round(q.x*10),Math.round(q.y*10)]));
 const count=k=>placed.items.filter(q=>q.kind===k).length;
 assert.ok(count('pothole')>=40&&count('manhole')>=40&&count('patch')>=20,'enough small details: '+['pothole','manhole','patch'].map(count));
 assert.ok(placed.bumps>=3&&placed.bumps<=SURFACE_RULES.maxBumps,'a few speed bumps: '+placed.bumps);
 assert.ok(count('dirt')>=1,'the OSM tracks are dirt');
 const junctions=real.nodes.filter(n=>n.out.filter(e=>real.edges[e].car).length>=3);
 for(const q of placed.items){
  if(q.kind==='cobble'||q.kind==='dirt')continue;
  for(const n of junctions)assert.ok(Math.hypot(q.x-n.x,q.y-n.y)>=SURFACE_RULES.junctionClear-(q.halfLength||q.r||0)-.01,q.kind+' too close to a junction (crossings at 8 m)');
 }
});

test('Q24 speed bumps only on minor streets, written on both directions of the segment for the NPCs',()=>{
 const bumps=placed.items.filter(q=>q.kind==='bump');
 for(const b of bumps){
  const [lo,hi]=b.edgeKey.split(':').map(Number);
  const edges=real.edges.filter(e=>e.car&&(e.from===lo&&e.to===hi||e.from===hi&&e.to===lo));
  assert.ok(edges.length>=1);
  for(const e of edges)assert.ok(['residential','living_street','service','unclassified'].includes(e.roadType),'never on main roads');
  assert.ok(edges.every(e=>e.bumps?.length),'each direction knows the bump');
  assert.ok(/vicino a|di gioco/.test(b.why));
 }
});

test('Q24 each vehicle reacts its own way: the scooter is the most sensitive, heavy vehicles the least',()=>{
 const pothole={kind:'pothole',x:0,y:0,a:0,r:1,seed:1};
 const surfaces={items:[pothole],cells:new Map([['0,0',[pothole]],['-1,0',[pothole]],['0,-1',[pothole]],['-1,-1',[pothole]]])};
 const hitAt=(vehicle,speed)=>roadSurfaceEffect(surfaces,{...vehicle,x:-1.95,y:-.6,a:0},{speed,dt:.05,memory:new Map(),now:0});
 const car=hitAt({model:'panda-modern-white'},14),scooter=hitAt({vehicleType:'motorcycle',model:'moto-scooter-sh-red'},14),
  ape=hitAt({model:'ape-classica-azzurra'},14),bus=hitAt({model:'servizio-autobus'},14);
 assert.equal(feelKind({vehicleType:'motorcycle',model:'moto-scooter-sh-red'}),'scooter');
 assert.ok(car.hits.length===1&&scooter.hits.length===1,'the wheel over the pothole is a hit');
 assert.ok(scooter.speedFactor<ape.speedFactor&&ape.speedFactor<car.speedFactor&&car.speedFactor<=bus.speedFactor);
 assert.ok(scooter.bump>car.bump);
 for(const r of [car,scooter,ape,bus])assert.ok(r.speedFactor>=.75,'never a block');
 // same pothole again right away: no double hit (cooldown)
 const memory=new Map(),v={model:'panda-modern-white',x:-1.95,y:-.6,a:0};
 roadSurfaceEffect(surfaces,v,{speed:14,dt:.05,memory,now:0});
 assert.equal(roadSurfaceEffect(surfaces,v,{speed:14,dt:.05,memory,now:.2}).hits.length,0);
 // wet pothole = puddle: a bit of grip lost
 assert.ok(roadSurfaceEffect(surfaces,v,{speed:14,dt:.05,wet:.8,memory:new Map(),now:0}).gripLoss>0);
});

test('Q24 speed bumps invite to slow down: gentle when slow, a real jolt when fast; cobbles and dirt slow and slide a little',()=>{
 const g=buildRoadGraph([{id:1,n:'Piazza Prova',t:'residential',w:8,p:[0,0,200,0]}]);
 const bump={kind:'bump',x:0,y:0,a:0,halfLength:.8,halfWidth:3.5};
 const surfaces={items:[bump],cells:new Map([['0,0',[bump]],['-1,0',[bump]],['0,-1',[bump]],['-1,-1',[bump]]])};
 const over=speed=>roadSurfaceEffect(surfaces,{model:'panda-modern-white',x:-1.9,y:0,a:0},{speed,dt:.05,memory:new Map(),now:0});
 const slow=over(4),fast=over(22);
 assert.ok(slow.speedFactor>.995&&slow.bump<.2,'at walking pace almost nothing');
 assert.ok(fast.speedFactor<.93&&fast.bump>.6,'too fast: speed lost and a big jolt');
 const placedSquare=placeRoadSurfaces(g,{});
 const cobble=placedSquare.items.find(q=>q.kind==='cobble');
 assert.ok(cobble,'a street called Piazza is paved with cobbles');
 const onCobble=roadSurfaceEffect(placedSquare,{model:'panda-modern-white',x:cobble.x,y:cobble.y,a:0},{speed:14,dt:.05});
 assert.equal(onCobble.on,'cobble');assert.ok(onCobble.speedFactor<1&&onCobble.gripLoss>0);
 const kerb=kerbEffect({vehicleType:'motorcycle',model:'moto-scooter-sh-red'},10),kerbCar=kerbEffect({model:'panda-modern-white'},10);
 assert.ok(kerb.bump>kerbCar.bump&&kerb.speedFactor<kerbCar.speedFactor);
});

test('Q24 NPC cars slow down before a speed bump and drive over it',()=>{
 const g=buildRoadGraph([{id:1,n:'Via Prova',t:'residential',w:8,p:[0,0,400,0]}]);
 const [car]=createAgents(g,1,7,'car',[]);
 const e=g.edges[car.edge];
 const bumpAt=Math.min(e.len-10,car.t*e.len+40);
 e.bumps=[bumpAt];
 let near=Infinity,passed=false;
 for(let i=0;i<600&&!passed;i++){
  stepAgents(g,[car],.05,null,{view:[-1e4,-1e4,1e4,1e4],validRecovery:()=>true});
  if(car.edge!==g.edges.indexOf(e)){passed=true;break;}
  const d=bumpAt-car.t*e.len;
  if(d>-1&&d<1.5)near=Math.min(near,car.v??Infinity);
  if(d<-3)passed=true;
 }
 assert.ok(passed,'it does not stop for ever');
 assert.ok(near<=3.6,'crosses the bump slowly: '+near);
});

test('Q24 surface hits are announced for the damage system (Q23) and drawing handles every kind',()=>{
 const seen=[];const off=onSurfaceHit(d=>seen.push(d.kind));
 emitSurfaceHit({kind:'pothole',intensity:.4});off();emitSurfaceHit({kind:'bump'});
 assert.deepEqual(seen,['pothole']);
 const calls=[];const c=new Proxy({},{get:(_,k)=>k==='canvas'?{}:(...a)=>{calls.push(k);},set:()=>true});
 drawRoadSurfaces(c,placed,[0,0,3000,3000],2);
 drawSurfacePuddles(c,placed,[0,0,3000,3000],.9,.6,3);
 assert.ok(calls.length>100);
 assert.ok(surfacesNear(placed,0,0,3000,3000).length===placed.items.length);
});

test('Q24 game wiring: created with the stalls, effect before grip, kerb, jolt, drawn in the street tiles, puddles',async()=>{
 const [game,audio,html]=await Promise.all(['game.mjs','city-audio.mjs','index.html'].map(f=>readFile(new URL('./'+f,import.meta.url),'utf8')));
 assert.match(game,/import \{placeRoadSurfaces,roadSurfaceEffect,kerbEffect,emitSurfaceHit,(?:onSurfaceHit,)?drawRoadSurfaces,drawSurfacePuddles\} from '\.\/road-surfaces\.mjs\?v=\d+'/);
 assert.match(game,/onSurfaceHit\(e=>\{if\(\(e\.kind==='pothole'\|\|e\.kind==='bump'\)&&e\.intensity>\.6/,'Q23+Q24: a hard pothole leaves light damage');
 assert.equal((game.match(/createParkingBays\(\);(?:createRaces\(\);)?createRoadSurfaces\(\);/g)||[]).length,2,'on load and on the width switch');
 const surface=game.indexOf('roadSurfaceEffect(state.surfaces,car'),grip=game.indexOf('applyGrip(car,{angle:car.a');
 assert.ok(surface>0&&grip>surface,'the surface acts before the grip');
 assert.match(game,/wet:Math\.min\(1,wet\+\(surface\?\.gripLoss\|\|0\)\)/);
 assert.match(game,/kerbEffect\(car,speed\)/);
 assert.match(game,/emitSurfaceHit\(\{kind:hit\.kind/);
 assert.match(game,/drawRoadSurfaces\(ctx,state\.surfaces,bounds,zoom\);/);
 assert.match(game,/drawSurfacePuddles\(c,state\.surfaces/);
 assert.match(game,/state\.bump=Math\.max\(0,\(state\.bump\|\|0\)-dt\*3\.5\)/);
 assert.match(audio,/thump\(level=\.5\)\{/);
 assert.ok(Number((html.match(/game\.mjs\?v=(\d+)/)||[])[1])>=180);
});
