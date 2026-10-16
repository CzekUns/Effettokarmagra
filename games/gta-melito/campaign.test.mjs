import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolveLandmarks,STORY,LANDMARKS,freshProgress,readProgress,saveProgress,activeTarget,doInteraction,updateTimer,resetCurrentMission,SAVE_KEY} from './campaign.mjs';
const map=JSON.parse(await readFile(new URL('./data/melito-map.json',import.meta.url),'utf8'));
const places=resolveLandmarks(map,{x:1178.9,y:1302.8});
const storage=()=>{let value=null;return {getItem:()=>value,setItem:(k,v)=>{assert.equal(k,SAVE_KEY);value=v;},tamper:v=>{value=v;}};};
test('eight genuine OSM places anchor the mission stages to reachable roads',()=>{
 assert.equal(places.size,8);
 assert.equal(LANDMARKS.length,8);
 const names=new Set([...map.pois.map(x=>x.n),...map.roads.map(x=>x.n)]);
 for(const v of places.values()){
  assert.ok(names.has(v.name),v.name+' must exist in OSM');
  assert.ok(Number.isFinite(v.x)&&Number.isFinite(v.y));
  assert.ok(v.x>=0&&v.x<=map.projection.width);
  assert.ok(v.y>=0&&v.y<=map.projection.height);
  assert.ok(v.fromPlace<100,v.name+' must be close to reachable road');
 }
 assert.ok(Math.hypot(places.get('via-roma').x-1178.9,places.get('via-roma').y-1302.8)<30);
});
test('foot contact and destination proximity matter',()=>{
 const p=freshProgress(),v=activeTarget(p,places);
 assert.equal(doInteraction(p,places,v.x+120,v.y,false).type,'blocked');
 assert.equal(doInteraction(p,places,v.x,v.y,true).type,'blocked');
 assert.equal(p.stage,0);
 assert.equal(doInteraction(p,places,v.x,v.y,false).type,'step-complete');
 assert.equal(p.stage,1);
});
test('four sequential missions pay once and complete 13 interactions',()=>{
 const p=freshProgress(),completed=[];
 assert.equal(STORY.length,4);
 assert.equal(STORY.reduce((n,m)=>n+m.steps.length,0),13);
 for(let i=0;i<13;i++){
  const v=activeTarget(p,places);assert.ok(v);
  const event=doInteraction(p,places,v.x,v.y,false);
  assert.notEqual(event.type,'blocked');
  if(['mission-complete','ending'].includes(event.type))completed.push(event.reward);
 }
 assert.deepEqual(completed,[75,150,220,350]);
 assert.equal(p.money,795);assert.equal(p.respect,40);
 assert.equal(p.mission,4);assert.equal(p.completed,true);
 assert.equal(activeTarget(p,places),null);
 assert.equal(doInteraction(p,places,0,0,false).type,'finished');
});
test('time limit restarts only the active mission and retains earned cash',()=>{
 const p=freshProgress();
 for(let i=0;i<2;i++){const v=activeTarget(p,places);doInteraction(p,places,v.x,v.y,false);}
 assert.equal(p.mission,1);assert.equal(p.money,75);
 const first=activeTarget(p,places);doInteraction(p,places,first.x,first.y,false);
 assert.equal(p.stage,1);
 assert.equal(updateTimer(p,60),null);assert.equal(Math.ceil(p.remaining),130);
 const result=updateTimer(p,200);
 assert.equal(result.type,'timeout');assert.equal(p.stage,0);
 assert.equal(p.money,75);assert.equal(p.remaining,190);
 assert.equal(resetCurrentMission(p),true);assert.equal(p.remaining,null);
});
test('localStorage save roundtrip, wrong versions and corrupted state',()=>{
 const store=storage(),p=freshProgress();p.mission=2;p.stage=2;p.remaining=31.25;p.money=225;
 assert.equal(saveProgress(store,p),true);
 const got=readProgress(store);
 assert.equal(got.mission,2);assert.equal(got.stage,2);assert.equal(got.remaining,31.25);assert.equal(got.money,225);
 store.tamper('{broken json');assert.equal(readProgress(store).mission,0);
 store.tamper(JSON.stringify({...p,mission:999}));assert.equal(readProgress(store).mission,0);
 store.tamper(JSON.stringify({...p,stage:5}));assert.equal(readProgress(store).mission,0);
 const broken={getItem(){throw Error('private browsing');},setItem(){throw Error('quota');}};
 assert.equal(readProgress(broken).mission,0);
 assert.equal(saveProgress(broken,p),false);
});
test('HTML contains all campaign buttons and UI nodes',async()=>{
 const html=await readFile(new URL('./index.html',import.meta.url),'utf8');
 const game=await readFile(new URL('./game.mjs',import.meta.url),'utf8');
 for(const id of ['mission-progress','mission-money','mission-respect','mission-reset','mission-name','mission-desc','mission-destination','mission-distance','mission-time','mission-interact','mission-hint','waypoint','dialog','dialog-head','dialog-speaker','dialog-text','dialog-close','map-toggle','map-close','fullmap','bigmap']){
  assert.ok(html.includes('id="'+id+'"'),id+' missing from HTML');
  assert.ok(game.includes("'"+id+"'"),id+' missing from game.mjs');
 }
});