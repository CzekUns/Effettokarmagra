import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

export const CELL = { width: 24, height: 40, frames: 4, directions: 4 };
export const PALETTE = Object.freeze({
  ink: '#151b2e', navy: '#26334c', slate: '#35465e',
  floor: '#52677a', shelf: '#718b91', pale: '#9eaaa1',
  skin1: '#6f493d', skin2: '#a86c50', skin3: '#d39a72', skin4: '#f0c498',
  brown: '#9b673c', straw: '#d8a14f', cream: '#ffda83',
  police: '#243d65', policeLight: '#426491', ice: '#b9d9e8',
  purple: '#744d86', pink: '#e993af', teal: '#4f9e9a', alert: '#e65f66'
});
export const ACTORS = ['ipno', 'policie', 'cliente'];
export const DIRECTIONS = ['front', 'back', 'left', 'right'];

const rgba = hex => [...[1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)), 255];
const chunk = (tag, bytes) => {
  const data = Buffer.concat([Buffer.from(tag), bytes]);
  const out = Buffer.alloc(data.length + 8);
  out.writeUInt32BE(bytes.length, 0); data.copy(out, 4); out.writeUInt32BE(crc32(data), data.length + 4);
  return out;
};
function crc32(data) {
  let c = 0xffffffff;
  for (const byte of data) {
    c ^= byte;
    for (let i = 0; i < 8; i++) c = c >>> 1 ^ (c & 1 ? 0xedb88320 : 0);
  }
  return (c ^ 0xffffffff) >>> 0;
}
function png(width, height, pixels) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4); ihdr[8] = 8; ihdr[9] = 6;
  const scan = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) pixels.copy(scan, y * (1 + width * 4) + 1, y * width * 4, (y + 1) * width * 4);
  return Buffer.concat([Buffer.from('89504e470d0a1a0a', 'hex'), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(scan)), chunk('IEND', Buffer.alloc(0))]);
}
export function drawActor(actor, direction, frame, pixels, width, ox, oy) {
  const set = (x, y, color) => {
    if (x < 0 || x >= 24 || y < 0 || y >= 40) return;
    const i = ((oy + y) * width + ox + x) * 4;
    Buffer.from(rgba(PALETTE[color])).copy(pixels, i);
  };
  const rect = (x, y, w, h, color) => {
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) set(xx, yy, color);
  };
  const outlined = (x, y, w, h, color) => {
    rect(x - 1, y - 1, w + 2, h + 2, 'ink'); rect(x, y, w, h, color);
  };
  const step = frame === 1 ? -1 : frame === 3 ? 1 : 0;
  const skin = actor === 'cliente' ? 'skin2' : 'skin3';
  const shirt = actor === 'ipno' ? 'purple' : actor === 'policie' ? 'police' : 'teal';
  outlined(7, 29 + step, 4, 7 - step, 'navy');
  outlined(13, 29 - step, 4, 7 + step, 'navy');
  outlined(6, 17, 12, 12, shirt);
  rect(6, 17, 3, 10, actor === 'policie' ? 'policeLight' : actor === 'ipno' ? 'pink' : 'pale');
  outlined(3, 19 + Math.max(0, step), 3, 8, shirt);
  outlined(18, 19 + Math.max(0, -step), 3, 8, shirt);
  rect(4, 27 + Math.max(0, step), 2, 2, skin);
  rect(18, 27 + Math.max(0, -step), 2, 2, skin);
  if (actor === 'ipno') {
    rect(11, 20, 3, 3, 'pink'); rect(14, 24, 3, 2, 'cream'); rect(8, 25, 2, 2, 'pink');
  }
  if (actor === 'policie') {
    rect(9, 21, 7, 2, 'ice'); rect(11, 24, 3, 3, 'policeLight');
  }
  outlined(8, 8, 8, 9, skin);
  rect(8, 8, 2, 8, 'skin4');
  if (direction === 'front') {
    rect(9, 12, 2, 2, 'ink'); rect(14, 12, 2, 2, 'ink');
  } else if (direction === 'left') rect(8, 12, 2, 2, 'ink');
  else if (direction === 'right') rect(15, 12, 2, 2, 'ink');
  if (actor === 'ipno') {
    outlined(4, 6, 16, 3, 'straw'); rect(7, 3, 10, 4, 'brown'); rect(8, 2, 8, 2, 'straw');
    if (direction !== 'back') {
      rect(direction === 'right' ? 13 : 9, 12, 4, 2, 'ink');
      if (direction === 'front') rect(14, 12, 3, 2, 'ink');
    }
  } else if (actor === 'policie') {
    outlined(7, 5, 10, 4, 'police'); rect(6, 8, 12, 2, 'policeLight');
  } else {
    rect(7, 6, 10, 4, 'ink'); rect(7, 7, 3, 3, 'navy'); rect(14, 7, 3, 3, 'navy');
  }
}
export function makeSheet(actors = ACTORS) {
  const width = CELL.width * CELL.frames;
  const height = CELL.height * CELL.directions * actors.length;
  const pixels = Buffer.alloc(width * height * 4);
  actors.forEach((actor, a) => DIRECTIONS.forEach((dir, d) => {
    for (let f = 0; f < CELL.frames; f++) drawActor(actor, dir, f, pixels, width, f * CELL.width, (a * 4 + d) * CELL.height);
  }));
  return { width, height, pixels, png: png(width, height, pixels) };
}
export function makeComparison() {
  const scale = 4;
  const nativeWidth = CELL.width * ACTORS.length;
  const native = Buffer.alloc(nativeWidth * CELL.height * 4);
  ACTORS.forEach((actor, i) => drawActor(actor, 'front', 0, native, nativeWidth, i * CELL.width, 0));
  const width = nativeWidth * scale;
  const height = CELL.height * scale;
  const pixels = Buffer.alloc(width * height * 4);
  for (let y = 0; y < CELL.height; y++) for (let x = 0; x < nativeWidth; x++) {
    const color = native.subarray((y * nativeWidth + x) * 4, (y * nativeWidth + x + 1) * 4);
    for (let yy = 0; yy < scale; yy++) for (let xx = 0; xx < scale; xx++) {
      color.copy(pixels, ((y * scale + yy) * width + x * scale + xx) * 4);
    }
  }
  return { width, height, pixels, png: png(width, height, pixels) };
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const out = path.join(path.dirname(fileURLToPath(import.meta.url)), 'assets');
  mkdirSync(out, { recursive: true });
  for (const actor of ACTORS) writeFileSync(path.join(out, `${actor}.png`), makeSheet([actor]).png);
  writeFileSync(path.join(out, 'sheet.png'), makeComparison().png);
}
