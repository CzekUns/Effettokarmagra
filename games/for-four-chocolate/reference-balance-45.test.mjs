import test from 'node:test';
import assert from 'node:assert/strict';
import {initialScene,updateScene,increaseSecurity,guardTarget,playerBulkScale,CAMERA_THRESHOLDS} from './reference-play-logic.mjs';

test('45 prelievi non riforniscono lo scaffale camperato e mostrano le speciali',()=>{
  const scene=initialScene(17),refillShelves=new Set(),specialSpawns=[];
  for(let piece=1;piece<=45;piece++){
    const used=scene.pickups[0];
    scene.player.x=used.x;scene.player.z=used.z;
    for(let frame=0;frame<30;frame++){
      scene.cameras.forEach(camera=>camera.range=0);
      scene.guards.forEach(guard=>{guard.x=100;guard.baseSpeed=0;guard.halfAngle=0;});
      updateScene(scene,{take:true},.05);
    }
    assert.equal(scene.chocolate,piece,`prelievo ${piece}`);
    assert.equal(scene.phase,'playing');
    const refill=scene.pickups[0];
    assert.notEqual(refill.shelfId,used.shelfId);
    assert.ok(Math.hypot(refill.x-used.x,refill.z-used.z)>=8,`rifornimento ${piece}`);
    refillShelves.add(refill.shelfId);
    for(let held=0;held<8;held++)updateScene(scene,{take:true},.05);
    assert.equal(scene.chocolate,piece,'tenere PRENDI non ruba da solo il pezzo vicino');
    if(piece>=3&&(piece-3)%4===0){
      assert.ok(scene.special,`speciale al prelievo ${piece}`);
      specialSpawns.push(scene.special.id);
    }
    updateScene(scene,{take:false},.05);
  }
  assert.ok(refillShelves.size>=9);
  assert.equal(specialSpawns.length,11);
  assert.ok(new Set(specialSpawns).size>=7);
  assert.equal(scene.guards.length,guardTarget(45));
  assert.equal(scene.cameras.length,CAMERA_THRESHOLDS.length);
  assert.ok(playerBulkScale(45)>=1.9);
});

test('la POLICIE non ha un tetto fisso dopo 45 pezzi',()=>{
  const scene=initialScene(99);
  for(const score of [45,75,105]){
    scene.chocolate=score;
    increaseSecurity(scene);
    const target=guardTarget(score);
    assert.equal(scene.guards.length,target);
    assert.ok(score===45||target>guardTarget(score-30));
  }
  assert.equal(guardTarget(105),51);
});

test('gli angoli hanno pattuglie e accovacciarsi non azzera subito il sospetto',()=>{
  const scene=initialScene(17);scene.chocolate=19;increaseSecurity(scene);
  for(const [x,z] of [[-14,-12],[-14,12],[14,-12],[14,12]]){
    assert.ok(scene.guards.some(guard=>Math.hypot(guard.x-x,guard.z-z)<5),`${x},${z}`);
  }
  scene.watchZones={west:4,east:4};scene.alert=50;
  scene.guards.forEach(guard=>{guard.baseSpeed=0;guard.x=100;guard.halfAngle=0;});
  scene.cameras.forEach(camera=>camera.range=0);
  scene.player.x=-14;scene.player.z=-12;
  for(let i=0;i<100;i++)updateScene(scene,{crouch:true},.05);
  assert.ok(scene.alert>=40);
  assert.equal(scene.phase,'playing');
});
