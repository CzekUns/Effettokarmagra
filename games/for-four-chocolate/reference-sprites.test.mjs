import test from 'node:test';
import assert from 'node:assert/strict';
import { spriteView } from './reference-sprites.mjs';

test('la vista cambia con direzione del personaggio e orbita della camera', () => {
  assert.deepEqual(spriteView(0, 0, 0, 4, 0), { view: 'front', flip: false });
  assert.deepEqual(spriteView(0, 0, 0, -4, 0), { view: 'back', flip: false });
  assert.deepEqual(spriteView(0, 0, 0, 0, 4), { view: 'side', flip: false });
  assert.deepEqual(spriteView(0, 0, 0, 0, -4), { view: 'side', flip: true });
  assert.deepEqual(spriteView(Math.PI / 2, 0, 0, 0, 4), { view: 'front', flip: false });
});
