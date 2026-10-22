import test from 'node:test';
import assert from 'node:assert/strict';
import { collides, canSee, PICKUPS, EXIT, initialScene, nearestPickup, updateScene } from './reference-play-logic.mjs';

test('scaffali e frigoriferi bloccano movimento e visuale', () => {
  assert.equal(collides(-1, 0), true);
  assert.equal(collides(-2.3, 0), false);
  const eye = { x: 1.2, z: 0, angle: Math.PI, halfAngle: .5, range: 7 };
  assert.equal(canSee(eye, { x: -2.3, z: 0 }), false);
  assert.equal(canSee(eye, { x: 0, z: 0 }), true);
});
test('essere visto mentre si cammina non arresta Ipno', () => {
  const s = initialScene(); s.player.x = 1.25; s.player.z = .2;
  for (let i = 0; i < 100; i++) updateScene(s, { x: 0, z: 0 }, .05);
  assert.equal(s.phase, 'playing');
});
test('quattro prelievi da scaffali raggiungibili, uscita solo dopo il quarto e sorveglianza locale', () => {
  const s = initialScene();
  s.guards.forEach(g => { g.x = 100; g.baseSpeed = 0; }); s.camera.range = 0;
  for (let i = 0; i < 30; i++) updateScene(s, { take: true }, .05);
  assert.equal(s.chocolate, 0);
  s.player.x = EXIT.x; s.player.z = EXIT.z;
  updateScene(s, {}, .05); assert.equal(s.phase, 'playing');
  for (const [index,p] of PICKUPS.entries()) {
    assert.equal(collides(p.x,p.z),false,p.id);
    s.player.x = p.x; s.player.z = p.z;
    assert.equal(nearestPickup(s)?.id,p.id);
    for (let i = 0; i < 30; i++) updateScene(s, { take: true }, .05);
    assert.equal(s.chocolate,index+1);
    assert.equal(s.watchZones[p.zone],PICKUPS.slice(0,index+1).filter(item=>item.zone===p.zone).length);
    updateScene(s, { take: false }, .05);
  }
  s.player.x = EXIT.x; s.player.z = EXIT.z;
  updateScene(s, {}, .05); assert.equal(s.phase, 'escaped');
});
test('la visuale che raggiunge Ipno durante il prelievo provoca cattura', () => {
  const s = initialScene(); s.player.x = PICKUPS[0].x; s.player.z = PICKUPS[0].z;
  s.guards[1].x = 100; s.camera.range = 0;
  updateScene(s, { take: true }, .05); assert.equal(s.taking, true);
  s.guards[0].x = -.12; s.guards[0].z = -1; s.guards[0].dir = 1; s.guards[0].range = 5;
  updateScene(s, { take: true }, .05);
  assert.equal(s.phase, 'caught');
});
test('allontanarsi dallo scaffale interrompe il prelievo', () => {
  const s = initialScene(); s.player.x = PICKUPS[0].x; s.player.z = PICKUPS[0].z;
  s.guards[1].x = 100; s.camera.range = 0;
  updateScene(s, { take: true }, .05); assert.equal(s.taking, true);
  s.player.x = 0; s.player.z = 3.7;
  updateScene(s, { take: true }, .05);
  assert.equal(s.taking, false); assert.equal(s.takeTime, 0);
});
