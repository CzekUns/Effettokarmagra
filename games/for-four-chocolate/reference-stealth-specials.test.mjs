import test from 'node:test';
import assert from 'node:assert/strict';
import {initialScene,updateScene,increaseSecurity,guardSight,nearestSpecial,eatSpecial,
  SPECIAL_EFFECTS,GUARD_HEARING_RANGE,CAMERA_THRESHOLDS,GUARD_THRESHOLDS,takeDuration} from './reference-play-logic.mjs';

function disableOtherEyes(scene){
  scene.cameras.forEach(camera=>camera.range=0);
  scene.guards.slice(1).forEach(guard=>{guard.x=100;guard.baseSpeed=0;guard.halfAngle=0;});
}

test('solo POLICIE ha metà vista vicina, metà lontana e 20% periferica; il basso ripara chi si accovaccia',()=>{
  const guard={x:0,z:0,angle:0,halfAngle:.5,range:4};
  assert.equal(guardSight(guard,{x:1,z:0}),'near');
  assert.equal(guardSight(guard,{x:3,z:0}),'far');
  const fringe={x:3*Math.cos(.55),z:3*Math.sin(.55)};
  assert.equal(guardSight(guard,fringe),'peripheral');
  assert.equal(guardSight(guard,fringe,{crouch:true}),null);
  assert.equal(guardSight(guard,{x:1,z:0},{invisible:true}),null);
  const lowShelf={x:-8.3,z:5,angle:0,halfAngle:.5,range:4};
  assert.equal(guardSight(lowShelf,{x:-5.5,z:5}),'far');
  assert.equal(guardSight(lowShelf,{x:-5.5,z:5},{crouch:true}),null);
});

test('accovacciata lenta, scatto veloce e solo rumore ravvicinato avvia la caccia',()=>{
  const speeds=[];
  for(const input of [{x:1,z:0},{x:1,z:0,crouch:true},{x:1,z:0,sprint:true}]){
    const scene=initialScene(8);scene.cameras.forEach(camera=>camera.range=0);
    const before=scene.player.x;updateScene(scene,input,.05);speeds.push(scene.player.x-before);
  }
  assert.ok(speeds[1]<speeds[0]&&speeds[0]<speeds[2]);
  const scene=initialScene(8);scene.chocolate=5;increaseSecurity(scene);disableOtherEyes(scene);
  const guard=scene.guards[0];guard.x=.25;guard.z=scene.player.z-GUARD_HEARING_RANGE+.35;
  guard.angle=-Math.PI/2;guard.halfAngle=.1;guard.baseSpeed=0;
  updateScene(scene,{x:.7,z:0,sprint:true},.05);
  assert.equal(scene.security.mode,'alert');assert.match(scene.message,/sentito lo scatto/);
  const quiet=initialScene(8);quiet.chocolate=5;increaseSecurity(quiet);disableOtherEyes(quiet);
  quiet.guards[0].x=.25;quiet.guards[0].z=quiet.player.z-GUARD_HEARING_RANGE-.4;
  quiet.guards[0].angle=-Math.PI/2;quiet.guards[0].halfAngle=.1;quiet.guards[0].baseSpeed=0;
  updateScene(quiet,{x:.7,z:0,sprint:true},.05);
  assert.equal(quiet.security.mode,'routine');
});

test('a 15 pezzi la guardia riconosce Ipno solo nella metà vicina',()=>{
  for(const [distance,expected] of [[3,'routine'],[1,'alert']]){
    const scene=initialScene(21);scene.chocolate=15;increaseSecurity(scene);disableOtherEyes(scene);
    const guard=scene.guards[0];guard.x=scene.player.x;guard.z=scene.player.z-distance;
    guard.angle=Math.PI/2;guard.halfAngle=.5;guard.baseSpeed=0;guard.range=4.25;
    updateScene(scene,{x:0,z:0},.05);
    assert.equal(scene.security.mode,expected);
    if(expected==='alert')assert.match(scene.message,/cioccolate nascoste/);
  }
});

test('la sicurezza cresce prima, le pattuglie cambiano bersaglio e la ricerca dura un poco di più',()=>{
  assert.deepEqual(CAMERA_THRESHOLDS,[0,2,3,5,7,10]);
  assert.deepEqual(GUARD_THRESHOLDS,[5,6,8,10,13,16,19,23]);
  const scene=initialScene(38);scene.chocolate=5;increaseSecurity(scene);disableOtherEyes(scene);
  const guard=scene.guards[0],targets=new Set();
  for(let i=0;i<240;i++){
    updateScene(scene,{x:0,z:0},.05);
    if(guard.patrolTarget)targets.add(`${guard.patrolTarget.x.toFixed(1)},${guard.patrolTarget.z.toFixed(1)}`);
  }
  assert.ok(targets.size>=2);
});

test('Ciokospira compare su uno scaffale libero, si scopre e poi si mangia con esito nascosto',()=>{
  const scene=Array.from({length:200},(_,seed)=>initialScene(seed)).find(item=>item.special);
  assert.ok(scene?.special);
  assert.ok(!scene.pickups.some(item=>item.id===scene.special.id));
  scene.cameras.forEach(camera=>camera.range=0);
  scene.player.x=scene.special.x;scene.player.z=scene.special.z;
  assert.equal(nearestSpecial(scene)?.name,'Ciokospira');
  updateScene(scene,{take:true,x:0,z:0},.05);
  assert.equal(scene.specialOffer.stage,'found');assert.equal(scene.chocolate,0);
  const effect=eatSpecial(scene);
  assert.ok(SPECIAL_EFFECTS.includes(effect));assert.equal(scene.specialOffer.stage,'eaten');
  assert.equal(eatSpecial(scene),null);
});

test('tutti i dieci esiti hanno effetto sul punteggio, sul rischio o sulla velocità',()=>{
  const seen=new Set();
  for(let seed=0;seed<300&&seen.size<SPECIAL_EFFECTS.length;seed++){
    const scene=initialScene(seed);scene.chocolate=6;scene.alert=50;
    scene.watchZones={west:2,east:2};scene.specialOffer={stage:'found',name:'Ciokospira'};
    const effect=eatSpecial(scene);seen.add(effect);
    if(effect==='plus_five')assert.equal(scene.chocolate,12);
    else if(effect==='minus_five')assert.equal(scene.chocolate,2);
    else assert.equal(scene.chocolate,7);
    if(effect==='calm')assert.deepEqual(scene.watchZones,{west:1,east:1});
    if(effect==='suspicious')assert.deepEqual(scene.watchZones,{west:4,east:4});
    if(effect==='fast_take')assert.ok(takeDuration(scene)<1.15);
    if(effect==='slow_take')assert.ok(takeDuration(scene)>1.15);
    if(effect==='invisible')assert.equal(scene.effects.invisible,16);
    if(effect==='trail')assert.equal(scene.effects.trail,14);
  }
  assert.equal(seen.size,SPECIAL_EFFECTS.length);
});

test('le macchie viste portano una guardia a seguire la traccia e cercare Ipno',()=>{
  const scene=initialScene(8);scene.chocolate=5;increaseSecurity(scene);disableOtherEyes(scene);
  const guard=scene.guards[0];guard.x=-1;guard.z=6.2;guard.angle=0;guard.halfAngle=.8;guard.range=4;guard.baseSpeed=0;
  scene.player.x=1.2;scene.player.z=6.2;
  scene.stains=[{x:0,z:6.2,time:0,order:1}];scene.stainOrder=1;
  updateScene(scene,{x:0,z:0},.05);
  assert.equal(guard.mode,'track');
  for(let i=0;i<100&&scene.security.mode==='routine';i++)updateScene(scene,{x:0,z:0},.05);
  assert.equal(scene.security.mode,'alert');assert.match(scene.message,/seguito le macchie/);
});
