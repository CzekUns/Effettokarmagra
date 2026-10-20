import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {buildRoadGraph} from './roads.mjs';
import {createRaceWorld,prepareRaces,raceHotspot,startRace,stepRace,awardPrize,parkIdleRivals,racePosition,
 resultsText,pointAt,drawRaceWorld,drawRaceMini,drawRaceHud,RACE_RULES,RACE_DISCLAIMER} from './street-race.mjs';

const read=f=>readFile(new URL('./'+f,import.meta.url),'utf8');
const map=JSON.parse(await read('data/melito-map.json'));
const graph=buildRoadGraph(map.roads,{border:map.border});
const fresh=()=>createRaceWorld(graph);
const roadIds=new Set(map.roads.map(r=>r.id));

/* Guida simulata del giocatore lungo il percorso a velocità costante. */
function drive(world,speed,{dt=.1,until=()=>false,car=0,from=0}={}){
 const race=world.active;let s=from,events=[],guard=0;
 while(world.active&&guard++<20000){
  if(race.phase==='racing')s=Math.min(race.route.length,s+speed*dt);
  const q=pointAt(race.route,s);
  const e=stepRace(world,dt,{x:q.x,y:q.y,car,speed});if(e)events.push({e,next:race.next,time:race.time});
  if(until(race,s))break;
 }
 return events;
}

test('Q34 1–2 deterministic starts, on the periphery, far apart',()=>{
 const a=prepareRaces(graph),b=prepareRaces(graph);
 assert.ok(a.routes.length>=1&&a.routes.length<=2,'one or two races');
 assert.deepEqual(a.routes.map(r=>[r.start.x,r.start.y,r.length]),b.routes.map(r=>[r.start.x,r.start.y,r.length]),'same map, same races');
 const far=Math.max(...graph.nodes.map(n=>Math.hypot(n.x-a.center.x,n.y-a.center.y)));
 for(const r of a.routes)assert.ok(Math.hypot(r.start.x-a.center.x,r.start.y-a.center.y)>=far*RACE_RULES.periphery,r.label+' start far from the centre');
 if(a.routes.length===2)assert.ok(Math.hypot(a.routes[0].start.x-a.routes[1].start.x,a.routes[0].start.y-a.routes[1].start.y)>=RACE_RULES.startsApart);
 assert.match(RACE_DISCLAIMER,/FINZIONE/);assert.match(RACE_DISCLAIMER,/pericolose e vietate/);
});

test('Q34 the route is a chain of drivable OSM street edges, one-ways respected, inside the border',()=>{
 for(const r of prepareRaces(graph).routes){
  assert.ok(r.length>=RACE_RULES.minLength&&r.length<=RACE_RULES.maxLength,r.label+' length '+r.length);
  assert.equal(r.points.length,r.edges.length+1);
  let node=r.startNode;const seen=new Set([node]);
  for(const id of r.edges){
   const e=graph.edges[id];
   assert.equal(e.from,node,'edges connected in order');
   assert.equal(e.car,true,'car lane (one-way direction respected by the graph)');
   assert.ok(graph.liveCar[id],'no dead end');
   assert.ok(roadIds.has(e.roadId),'real OSM street '+e.roadId);
   assert.equal(graph.nodes[e.to].gate,undefined,'no border gate');
   node=e.to;assert.equal(seen.has(node),false,'no loop back');seen.add(node);
  }
  assert.ok(r.names.length>=1,'named streets');
 }
});

test('Q34 E · GARA only in a car at the start; checkpoints count only in order',()=>{
 const w=fresh(),r=w.routes[0];
 assert.equal(raceHotspot(w,r.start,false),null,'on foot: no prompt');
 assert.equal(raceHotspot(w,{x:r.start.x+80,y:r.start.y},true),null,'too far: no prompt');
 assert.equal(raceHotspot(w,r.start,true),r);
 const race=startRace(w,r.id,0);assert.equal(race.phase,'countdown');
 assert.equal(raceHotspot(w,r.start,true),null,'no new prompt during a race');
 // Countdown: checkpoints do not count yet.
 const cp2=r.checkpoints[1];
 assert.equal(stepRace(w,1,{x:r.start.x,y:r.start.y,car:0}),null);
 assert.equal(stepRace(w,2.5,{x:r.start.x,y:r.start.y,car:0}),'go');
 assert.equal(race.phase,'racing');
 // Reaching checkpoint 2 before checkpoint 1 does not count it.
 stepRace(w,.1,{x:cp2.x,y:cp2.y,car:0});
 assert.equal(race.next,0,'checkpoint 2 skipped ahead: not counted');
 assert.ok(race.playerS<=r.checkpoints[0].s+.01,'progress held at the next checkpoint');
 const events=drive(w,12,{from:Math.max(0,r.checkpoints[0].s-30)});
 const cps=events.filter(e=>e.e==='checkpoint').map(e=>e.next);
 for(let i=1;i<cps.length;i++)assert.equal(cps[i],cps[i-1]+1,'checkpoints one after the other');
 assert.equal(events.at(-1).e,'finish');
});

test('Q34 fast run: win, classification and prize in game euros (campaign money)',()=>{
 const w=fresh(),r=w.routes[0];startRace(w,r.id,0);
 const events=drive(w,30);
 assert.equal(events.at(-1).e,'finish');
 const res=w.last;assert.equal(w.active,null);
 assert.equal(res.rows.length,RACE_RULES.rivals+1,'player + rivals');
 assert.equal(res.position,1);assert.equal(res.prize,RACE_RULES.prizes[0]);
 for(let i=1;i<res.rows.length;i++)assert.ok(res.rows[i].time>=res.rows[i-1].time,'sorted by time');
 const progress={money:100};assert.equal(awardPrize(progress,res),300);assert.equal(progress.money,400);
 assert.match(resultsText(res),/1° TU/);assert.match(resultsText(res),/solo un gioco/);
});

test('Q34 slow run: rivals finish on the same route first, player loses without prize',()=>{
 const w=fresh(),r=w.routes[0];startRace(w,r.id,0);
 let maxSide=0;
 drive(w,7,{until:race=>{for(const v of race.rivals){const q=pointAt(r,v.s);maxSide=Math.max(maxSide,Math.hypot(v.x-q.x,v.y-q.y));}return false;}});
 const res=w.last;
 assert.equal(res.position,RACE_RULES.rivals+1,'last');assert.equal(res.prize,0);
 assert.equal(res.rows.filter(x=>!x.player).every(x=>!x.estimated),true,'every rival really finished');
 assert.ok(maxSide<2.5,'rivals stay on the route lanes ('+maxSide.toFixed(2)+' m)');
 const progress={money:50};awardPrize(progress,res);assert.equal(progress.money,50);
});

test('Q34 rivals slow down behind NPC traffic instead of driving through it',()=>{
 const w=fresh(),r=w.routes[0],race=startRace(w,r.id,0);
 stepRace(w,3.1,{x:r.start.x,y:r.start.y,car:0});
 const v=race.rivals[0],blockS=v.s+8,block=pointAt(r,blockS);
 for(let i=0;i<40;i++)stepRace(w,.1,{x:r.start.x,y:r.start.y,car:0},{obstacles:[{x:block.x,y:block.y,speed:0}]});
 assert.ok(v.s<blockS-3,'stopped behind the NPC standing on the route');
 assert.ok(race.rivals.slice(1).every(o=>o.s>blockS),'the rivals already past it go on');
});

test('Q34 cancel by leaving the car or going away; rivals return to the grid only out of view',()=>{
 let w=fresh(),r=w.routes[0];startRace(w,r.id,0);
 assert.equal(stepRace(w,.1,{x:r.start.x,y:r.start.y,car:-1}),'cancel');
 assert.equal(w.active,null);assert.match(w.last.reason,/SCESO/);assert.equal(w.last.prize,0);
 w=fresh();r=w.routes[0];startRace(w,r.id,0);
 stepRace(w,3.1,{x:r.start.x,y:r.start.y,car:0});
 for(let i=0;i<30;i++)stepRace(w,.1,{x:r.start.x,y:r.start.y,car:0});
 const away={x:r.start.x+400,y:r.start.y+400};
 assert.equal(stepRace(w,.1,{...away,car:0}),'cancel');assert.match(w.last.reason,/LONTANO/);
 const moved=w.rivals[0].map(v=>v.s);
 assert.ok(moved.some(s=>s>30),'rivals had moved');
 // In view: they stay where they are (no teleport).
 parkIdleRivals(w,[r.start.x-500,r.start.y-500,r.start.x+500,r.start.y+500]);
 assert.deepEqual(w.rivals[0].map(v=>v.s),moved);
 // Out of view: back to the grid.
 parkIdleRivals(w,[-9000,-9000,-8900,-8900]);
 assert.ok(w.rivals[0].every(v=>v.s<30&&v.v===0));
 assert.ok(raceHotspot(w,r.start,true),'a new race can start');
});

test('Q34 drawing helpers run on a fake canvas; game.mjs wires prompt, step, minimap and HUD',async()=>{
 const calls=[];const ctx=new Proxy({},{get:(t,k)=>k in t?t[k]:(k==='measureText'?()=>({width:10}):(...a)=>calls.push(k)),set:(t,k,v)=>(t[k]=v,true)});
 const w=fresh(),r=w.routes[0];
 drawRaceWorld(ctx,w,[r.start.x-50,r.start.y-50,r.start.x+50,r.start.y+50],3,0,()=>calls.push('car'));
 assert.ok(calls.includes('car'),'waiting rivals drawn at the start');
 startRace(w,r.id,0);drawRaceMini(ctx,w,{k:.05,ox:0,oy:0});drawRaceHud(ctx,w,800,400);
 assert.ok(calls.includes('fillText'));
 const game=await read('game.mjs'),html=await read('index.html');
 assert.match(game,/from '\.\/street-race\.mjs\?v=\d+'/);
 assert.match(game,/raceNear\?'GARA'/,'GARA on the action button');
 assert.match(game,/if\(raceNear\)boardPrompt\('GARA'\);/,'E · GARA on the PC board');
 assert.match(game,/stepStreetRace\(dt\)/);assert.match(game,/drawRaceMini\(r,state\.races,state\.mini\)/);
 assert.match(game,/awardPrize\(state\.progress,results\)/);
 assert.ok(Number(((html).match(/game\.mjs\?v=(\d+)/)||[])[1])>=190);
});
