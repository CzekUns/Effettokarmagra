import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { ACTORS, CELL, PALETTE, makeSheet, makeComparison } from './generate-sprites.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), 'assets');
const allowed = new Set(Object.values(PALETTE).map(c => c.toLowerCase()));
const skin = new Set(['#6f493d', '#a86c50', '#d39a72', '#f0c498']);
test('tutte le tavole hanno celle, palette, altezza e alpha coerenti', () => {
  for (const actor of ACTORS) {
    const sheet = makeSheet([actor]);
    const saved = readFileSync(path.join(root, `${actor}.png`));
    assert.deepEqual(saved, sheet.png, `tavola ${actor} rigenerabile`);
    assert.equal(sheet.width, CELL.width * CELL.frames);
    assert.equal(sheet.height, CELL.height * CELL.directions);
    for (let dir = 0; dir < 4; dir++) for (let frame = 0; frame < 4; frame++) {
      let bottom = -1;
      let skinTop = Infinity;
      for (let y = 0; y < CELL.height; y++) for (let x = 0; x < CELL.width; x++) {
        const i = ((dir * CELL.height + y) * sheet.width + frame * CELL.width + x) * 4;
        const a = sheet.pixels[i + 3];
        assert.ok(a === 0 || a === 255, 'alpha senza alone');
        if (a) {
          bottom = Math.max(bottom, y);
          const hex = '#' + sheet.pixels.subarray(i, i + 3).toString('hex');
          assert.ok(allowed.has(hex), `colore fuori bibbia: ${hex}`);
          if (skin.has(hex)) skinTop = Math.min(skinTop, y);
        }
      }
      assert.equal(bottom, 36, `${actor} direzione ${dir} frame ${frame}: stessa altezza`);
      assert.equal(skinTop, 10, `${actor} direzione ${dir} frame ${frame}: viso alla stessa quota`);
    }
  }
  const comparison = makeComparison();
  assert.equal(comparison.width, ACTORS.length * CELL.width * 4);
  assert.equal(comparison.height, CELL.height * 4);
  assert.deepEqual(readFileSync(path.join(root, 'sheet.png')), comparison.png);
  assert.ok(allowed.size <= 24);
});
