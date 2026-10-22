import test from 'node:test';
import assert from 'node:assert/strict';
import { collides, canSee, PICKUP, EXIT, initialScene, updateScene } from './reference-play-logic.mjs';

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
test('prelievo solo vicino allo scaffale e mai se visto', () => {
  const s = initialScene();
  for (let i = 0; i < 30; i++) updateScene(s, { take: true }, .05);
  assert.equal(s.chocolate, 0);
  s.player.x = PICKUP.x; s.player.z = PICKUP.z;
  for (let i = 0; i < 30; i++) updateScene(s, { take: true }, .05);
  assert.equal(s.chocolate, 1); assert.equal(s.increasedWatch, true);
  s.player.x = EXIT.x; s.player.z = EXIT.z;
  updateScene(s, {}, .05); assert.equal(s.phase, 'escaped');
});
test('la visuale che raggiunge Ipno durante il prelievo provoca cattura', () => {
  const s = initialScene(); s.player.x = PICKUP.x; s.player.z = PICKUP.z;
  updateScene(s, { take: true }, .05); assert.equal(s.taking, true);
  s.guard.x = -.12; s.guard.z = -1; s.guard.dir = 1; s.guard.range = 5;
  updateScene(s, { take: true }, .05);
  assert.equal(s.phase, 'caught');
});
test('allontanarsi dallo scaffale interrompe il prelievo', () => {
  const s = initialScene(); s.player.x = PICKUP.x; s.player.z = PICKUP.z;
  updateScene(s, { take: true }, .05); assert.equal(s.taking, true);
  s.player.x = 0; s.player.z = 3.7;
  updateScene(s, { take: true }, .05);
  assert.equal(s.taking, false); assert.equal(s.takeTime, 0);
});
