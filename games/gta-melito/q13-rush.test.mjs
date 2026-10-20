import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {trafficTargetAt,trafficShare} from './traffic-rush.mjs?v=001';

test('Q13 rush hours: 140 on a normal day, about +35% at 8:00 and 20:00, about half at night, no steps',()=>{
 const at=(h,m=0)=>trafficTargetAt(h*60+m);
 assert.equal(at(13),140);
 assert.ok(at(8)>=182&&at(8)<=196,'8:00 → '+at(8));assert.ok(at(20)>=182&&at(20)<=196,'20:00 → '+at(20));
 assert.ok(at(3)>=66&&at(3)<=74,'3:00 → '+at(3));
 // massimo proprio alle 8 e alle 20, salita e discesa di circa un'ora
 for(const h of [8,20]){assert.ok(at(h)>=at(h,-15+60*0)&&at(h)>=at(h,15));assert.ok(at(h+1)<=at(h)-30&&at(h-1)<=at(h)-30,'within an hour back near normal');}
 assert.ok(at(10)<=146&&at(17)<=146,'normal between the peaks');
 let worst=0;for(let m=0;m<24*60;m++)worst=Math.max(worst,Math.abs(trafficTargetAt(m+1)-trafficTargetAt(m)));
 assert.ok(worst<=2,'at most 2 vehicles per game minute (1 s of play): '+worst);
 assert.equal(trafficShare(24*60+8*60),trafficShare(8*60),'wraps around midnight');
});

test('Q13 rush wiring: one hour curve sets state.trafficTarget, BF09 balanceTraffic adds and removes through the border gates',async()=>{
 const game=await readFile(new URL('./game.mjs',import.meta.url),'utf8');
 assert.match(game,/import \{trafficTargetAt\} from '\.\/traffic-rush\.mjs\?v=\d+'/);
 assert.match(game,/createAgents\(state\.graph,trafficTargetAt\(minutes,TRAFFIC_COUNT\),189,'car'/,'starts with the vehicles of its hour');
 const f=game.indexOf('function updateTraffic('),target=game.indexOf('state.trafficTarget=trafficTargetAt(state.npcClockMinutes,TRAFFIC_COUNT);',f),balance=game.indexOf('balanceTraffic(state.graph,state.traffic,state.trafficTarget',f);
 assert.ok(f>0&&target>f&&balance>target,'the hour sets the target, then the gates balance it');
 assert.ok(!/stepRush|spawnRushVehicle/.test(game),'no second place that adds vehicles');
 assert.equal((game.match(/createGateVehicle\(/g)||[]).length,1,'new vehicles only from the gates');
});
