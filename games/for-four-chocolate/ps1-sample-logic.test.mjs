import test from 'node:test';
import assert from 'node:assert/strict';
import { blocked, createSample, rayLimit, SHELVES_3D, stepSample, visible } from './ps1-sample-logic.mjs';

test('gli scaffali hanno volume e impediscono di attraversarli', () => {
  assert.equal(blocked(-3.4, 0), true);
  assert.equal(blocked(0, 0), false);
  assert.equal(blocked(-2.4, 0), true); // corpo del giocatore contro il bordo
  const state = createSample();
  state.player.x = -2.2; state.player.z = 0;
  for (let i = 0; i < 20; i++) stepSample(state, { x: -1, z: 0 }, .05);
  assert.ok(state.player.x > SHELVES_3D[0].maxX);
});
test('il cono si ferma allo scaffale, anche se il bersaglio è nell’angolo', () => {
  const eye = { x: -1.5, z: 0, angle: Math.PI, range: 8, halfAngle: .8 };
  assert.equal(visible(eye, { x: -5, z: 0 }), false);
  assert.ok(rayLimit(-1.5, 0, Math.PI, 8) < 1.2);
  assert.equal(visible({ ...eye, angle: 0 }, { x: 0, z: 0 }), true);
});
test('movimento diagonale non è più veloce e l’esposizione cala dietro un riparo', () => {
  const straight = createSample(), diagonal = createSample();
  stepSample(straight, { x: 1, z: 0 }, .05);
  stepSample(diagonal, { x: 1, z: -1 }, .05);
  assert.ok(Math.hypot(diagonal.player.x, diagonal.player.z - 5.7) <= .161);
  assert.ok(Math.abs(straight.player.x - .16) < .001);
  const state = createSample();
  state.player.x = -5.3; state.player.z = 0; state.exposure = 50;
  stepSample(state, { x: 0, z: 0 }, .05);
  assert.ok(state.exposure < 50);
});
test('l’agente in vista porta da calmo a sospetto, allarme e cattura', () => {
  const state = createSample();
  state.player.x = 0; state.player.z = -1;
  state.guard.z = -3.7;
  state.camera.range = 0;
  for (let i = 0; i < 200 && state.phase === 'playing'; i++) stepSample(state, { x: 0, z: 0 }, .05);
  assert.equal(state.phase, 'caught');
  assert.equal(state.alert, 'allarme');
});
