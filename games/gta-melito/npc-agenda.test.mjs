import {test} from 'node:test';
import assert from 'node:assert/strict';
import {freshProgress,updateTimer} from './campaign.mjs';
import {NPC_START_MINUTE,advanceNpcClock,npcDaypart,formatNpcClock,makeResidentAgenda,residentDepartureWindow} from './npc-agenda.mjs';

test('Q02 NPC clock covers five dayparts and rolls over midnight',()=>{
 assert.equal(formatNpcClock(NPC_START_MINUTE),'07:30 · MATTINA');
 for(const [minutes,part] of [[8*60,'MATTINA'],[12*60,'PRANZO'],[16*60,'POMERIGGIO'],[20*60,'SERA'],[23*60+30,'NOTTE'],[24*60+30,'NOTTE']])
  assert.equal(npcDaypart(minutes),part);
 assert.equal(formatNpcClock(24*60+15),'00:15 · NOTTE');
});

test('Q02 clock freezes during pause and bank interiors without affecting independent timers',()=>{
 const t=NPC_START_MINUTE;
 assert.equal(advanceNpcClock(t,.05,{paused:true}),t);
 assert.equal(advanceNpcClock(t,.05,{interior:true}),t);
 assert.equal(advanceNpcClock(t,.05),t+.05);
 assert.equal(advanceNpcClock(t,10),t+.05,'large frame gaps are clamped');
});

test('Q02 staggered residents occupy every slot and have reproducible daily departures',()=>{
 const a=Array.from({length:10},(_,i)=>makeResidentAgenda(405+i*17,i));
 const b=Array.from({length:10},(_,i)=>makeResidentAgenda(405+i*17,i));
 assert.deepEqual(a,b);
 assert.deepEqual(new Set(a.map(x=>x.slot)),new Set(['mattina','pranzo','pomeriggio','sera','notte']));
 assert.equal(new Set(a.map(x=>x.startMinute)).size,10);
 for(const x of a){
  assert.equal(residentDepartureWindow(x,x.startMinute+2),0);
  assert.equal(residentDepartureWindow(x,x.startMinute+x.duration+1),null);
  assert.equal(residentDepartureWindow(x,x.startMinute+24*60+2),1);
 }
 const night=a.find(x=>x.slot==='notte');
 assert.equal(residentDepartureWindow(night,night.startMinute+75),0);
});

test('Q02 mission countdown stays in real seconds rather than NPC minutes',()=>{
 const p=freshProgress();p.mission=1;p.remaining=100;
 const clock=advanceNpcClock(NPC_START_MINUTE,.05);
 assert.equal(clock,NPC_START_MINUTE+.05);
 assert.equal(updateTimer(p,.05),null);
 assert.equal(p.remaining,99.95);
});

import {readFile} from 'node:fs/promises';
import {buildRoadGraph,stepAgents} from './roads.mjs';
import {createRoutineResidents} from './resident-routines.mjs';

test('Q02 integrated residents depart at agenda time, return home, and remain home outside the next slot',()=>{
 const graph=buildRoadGraph([{id:1,n:'Via Roma',t:'primary',w:13,p:[0,0,600,0]}]);
 const [npc]=createRoutineResidents(graph,1,405,{x:300,y:0},[],()=>true);
 assert.ok(npc,'a resident must spawn on the OSM-style test road');
 const agenda=npc.residentRoutine.agenda;
 const view=[0,-100,600,100];
 stepAgents(graph,[npc],.05,null,{view,npcClockMinutes:agenda.startMinute-30});
 assert.equal(npc.residentRoutine.phase,'AT_HOME');
 stepAgents(graph,[npc],.05,null,{view,npcClockMinutes:agenda.startMinute+1});
 assert.equal(npc.residentRoutine.phase,'OUTBOUND');
 let complete=false;
 for(let i=0;i<5000;i++){
  stepAgents(graph,[npc],.05,null,{view,npcClockMinutes:agenda.startMinute+1+i*.05});
  if(npc.residentRoutine.cycles){complete=true;break;}
 }
 assert.equal(complete,true,'resident completes the trip');
 assert.equal(npc.residentRoutine.phase,'AT_HOME');
 assert.equal(agenda.status,'AT_HOME');
 stepAgents(graph,[npc],.05,null,{view,npcClockMinutes:agenda.startMinute+15});
 assert.equal(npc.residentRoutine.phase,'AT_HOME','same-day departures run only once');
 stepAgents(graph,[npc],.05,null,{view,npcClockMinutes:agenda.startMinute+1441});
 assert.equal(npc.residentRoutine.phase,'OUTBOUND','next day can depart again');
});

test('Q02 live game wires clock, road stepping, pause/interior guards and independent mission timer',async()=>{
 const game=await readFile(new URL('./game.mjs',import.meta.url),'utf8');
 const roads=await readFile(new URL('./roads.mjs',import.meta.url),'utf8');
 const html=await readFile(new URL('./index.html',import.meta.url),'utf8');
 assert.match(game,/state\.npcClockMinutes=advanceNpcClock\(state\.npcClockMinutes,dt\)/);
 assert.match(game,/if\(state\.mapOpen\|\|!\$\('dialog'\)\.hidden\|\|!\$\('pause-menu'\)\.hidden\)/);
 assert.ok(game.indexOf('state.npcClockMinutes=advanceNpcClock')<game.search(/if\(state\.bankInterior\)\s*\{\s*const axes=/));
 assert.match(game,/updateTimer\(state\.progress,dt\)/);
 assert.match(game,/npcClockMinutes:state\.npcClockMinutes/);
 assert.match(roads,/world\.npcClockMinutes/);
 assert.match(html,/id="npc-clock"/);
});
