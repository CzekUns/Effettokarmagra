import test from 'node:test';
import assert from 'node:assert/strict';
import { advance, canSee, CHOCOLATES, createGame, EXIT, HEIGHT, lineClear, movePlayer, tileAt, walkable, WIDTH } from './logic.mjs';

test('scaffale blocca movimento e vista', () => {
  assert.equal(tileAt(4, 3), 'S');
  assert.equal(walkable(4, 3), false);
  assert.equal(lineClear(3, 3, 6, 3), false);
  assert.equal(canSee({ x: 3, y: 3, angle: 0, range: 5, halfAngle: 1 }, { x: 6, y: 3 }), false);
  assert.equal(lineClear(3, 6, 6, 6), true);
});
test('coni distinguono direzione e distanza', () => {
  const eye = { x: 3, y: 6, angle: 0, range: 5, halfAngle: Math.PI / 4 };
  assert.equal(canSee(eye, { x: 6, y: 6 }), true);
  assert.equal(canSee(eye, { x: 2, y: 6 }), false);
  assert.equal(canSee(eye, { x: 10, y: 6 }), false);
});
test('cioccolata, uscita e collisione funzionano', () => {
  const game = createGame();
  assert.equal(movePlayer(game, 'left'), false);
  assert.equal(game.player.x, 1);
  movePlayer(game, 'up');
  assert.equal(game.player.y, 11);
  game.player.x = CHOCOLATES[0][0] - 1;
  game.player.y = CHOCOLATES[0][1];
  assert.equal(movePlayer(game, 'right'), true);
  assert.equal(game.collected, 1);
  assert.equal(game.chocolates.size, 3);
  game.player.x = EXIT.x - 1;
  game.player.y = EXIT.y;
  assert.equal(movePlayer(game, 'right'), false);
  game.collected = CHOCOLATES.length;
  movePlayer(game, 'right');
  assert.equal(game.phase, 'escaped');
});
test('sospetto, allarme e cattura dopo esposizione continua', () => {
  const game = createGame();
  game.player.x = 12; game.player.y = 3;
  game.camera.halfAngle = Math.PI / 2;
  for (let i = 0; i < 10; i++) advance(game, 0.1);
  assert.equal(game.alert, 'sospetto');
  for (let i = 0; i < 12; i++) advance(game, 0.1);
  assert.equal(game.alert, 'allarme');
  for (let i = 0; i < 12; i++) advance(game, 0.1);
  assert.equal(game.phase, 'caught');
});
test('tutte le tavolette e l’uscita sono raggiungibili sulla mappa', () => {
  const queue = [[1, 12]];
  const seen = new Set(['1,12']);
  for (let i = 0; i < queue.length; i++) {
    const [x, y] = queue[i];
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy, key = `${nx},${ny}`;
      if (nx < 0 || ny < 0 || nx >= WIDTH || ny >= HEIGHT || !walkable(nx, ny) || seen.has(key)) continue;
      seen.add(key); queue.push([nx, ny]);
    }
  }
  for (const [x, y] of [...CHOCOLATES, [EXIT.x, EXIT.y]]) assert.ok(seen.has(`${x},${y}`));
});
