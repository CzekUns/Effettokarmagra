import { advance, canSee, CHOCOLATES, createGame, DIRS, EXIT, HEIGHT, lineClear, SHELVES, tileAt, WIDTH, movePlayer } from './logic.mjs';

const canvas = document.querySelector('#world');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;
const $ = selector => document.querySelector(selector);
const tile = 32;
const colors = {
  ink: '#151b2e', navy: '#26334c', slate: '#35465e', floor: '#52677a',
  shelf: '#718b91', pale: '#9eaaa1', brown: '#9b673c', straw: '#d8a14f',
  cream: '#ffda83', police: '#243d65', ice: '#b9d9e8',
  purple: '#744d86', pink: '#e993af', teal: '#4f9e9a', alert: '#e65f66'
};
const actors = {};
for (const name of ['ipno', 'policie', 'cliente']) {
  const img = new Image();
  img.src = `./assets/${name}.png`;
  actors[name] = img;
}
let game = createGame();
let active = false;
let held = null;
let last = performance.now();
let moveClock = 0;
let finished = false;

function rect(x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}
const glyphs = {
  A: ['01110','10001','10001','11111','10001','10001','10001'],
  C: ['01111','10000','10000','10000','10000','10000','01111'],
  D: ['11110','10001','10001','10001','10001','10001','11110'],
  E: ['11111','10000','10000','11110','10000','10000','11111'],
  H: ['10001','10001','10001','11111','10001','10001','10001'],
  K: ['10001','10010','10100','11000','10100','10010','10001'],
  L: ['10000','10000','10000','10000','10000','10000','11111'],
  N: ['10001','11001','10101','10101','10011','10001','10001'],
  O: ['01110','10001','10001','10001','10001','10001','01110'],
  P: ['11110','10001','10001','11110','10000','10000','10000'],
  V: ['10001','10001','10001','10001','10001','01010','00100'],
  Y: ['10001','10001','01010','00100','00100','00100','00100']
};
function pixelText(text, x, y, color) {
  let cursor = x;
  for (const char of text) {
    const base = { Č: 'C', Á: 'A', Ý: 'Y' }[char] || char;
    const pattern = glyphs[base];
    if (pattern) {
      pattern.forEach((row, yy) => [...row].forEach((bit, xx) => {
        if (bit === '1') rect(cursor + xx, y + yy, 1, 1, color);
      }));
      if (char === 'Č') { rect(cursor + 1, y - 3, 1, 1, color); rect(cursor + 2, y - 2, 1, 1, color); rect(cursor + 3, y - 3, 1, 1, color); }
      if (char === 'Á' || char === 'Ý') rect(cursor + 3, y - 2, 2, 1, color);
    }
    cursor += 6;
  }
}
function drawFloor() {
  rect(0, 0, canvas.width, canvas.height, colors.ink);
  for (let y = 0; y < HEIGHT; y++) for (let x = 0; x < WIDTH; x++) {
    const px = x * tile, py = y * tile;
    if (tileAt(x, y) === '#') {
      rect(px, py, tile, tile, colors.ink);
      rect(px + 3, py + 3, 26, 26, colors.navy);
      continue;
    }
    rect(px, py, tile, tile, (x + y) % 2 ? colors.floor : colors.slate);
    rect(px, py, 1, tile, colors.navy);
    rect(px, py, tile, 1, colors.navy);
    if ((x * 7 + y * 13) % 9 === 0) rect(px + 22, py + 19, 3, 2, colors.pale);
  }
  for (const [sx, sy, w, h] of SHELVES) {
    const x = sx * tile, y = sy * tile;
    rect(x + 2, y + 2, w * tile - 4, h * tile - 4, colors.ink);
    rect(x + 5, y + 5, w * tile - 10, h * tile - 10, colors.shelf);
    for (let row = 0; row < h; row++) {
      const yy = y + 8 + row * tile;
      rect(x + 6, yy, w * tile - 12, 8, colors.brown);
      for (let i = 0; i < 4; i++) {
        const xx = x + 9 + i * 12;
        rect(xx, yy + 1, 9, 6, i % 2 ? colors.pink : colors.purple);
        rect(xx + 1, yy + 1, 7, 2, colors.cream);
      }
      rect(x + 5, yy + 10, w * tile - 10, 3, colors.navy);
    }
    rect(x + 5, y + 4, w * tile - 10, 2, colors.pale);
  }
  // L'uscita è chiusa fino alla quarta tavoletta.
  const ex = EXIT.x * tile, ey = EXIT.y * tile;
  rect(ex + 2, ey + 2, 28, 28, game.collected === CHOCOLATES.length ? colors.teal : colors.navy);
  rect(ex + 5, ey + 5, 22, 22, colors.ink);
  rect(ex + 9, ey + 5, 14, 19, game.collected === CHOCOLATES.length ? colors.teal : colors.slate);
  rect(ex + 24, ey + 12, 3, 5, colors.cream);
  // Le insegne condividono lo stesso alfabeto bitmap 5×7.
  pixelText('ČOKOLÁDA', 135, 54, colors.cream);
  pixelText('AKCE', 310, 54, colors.cream);
  pixelText('POKLADNA', 450, 402, colors.cream);
  pixelText('VÝCHOD', 553, 27, colors.teal);
}
function drawChocolate(x, y) {
  const px = x * tile + 8, py = y * tile + 8;
  rect(px - 2, py - 2, 20, 20, colors.ink);
  rect(px, py, 16, 16, colors.brown);
  rect(px + 2, py + 2, 12, 5, colors.cream);
  rect(px + 2, py + 9, 5, 5, colors.straw);
  rect(px + 9, py + 9, 5, 5, colors.straw);
}
function drawVision(observer, fill) {
  const ox = (observer.x + .5) * tile;
  const oy = (observer.y + .5) * tile;
  ctx.beginPath();
  ctx.moveTo(ox, oy);
  const rays = 28;
  for (let i = 0; i <= rays; i++) {
    const angle = observer.angle - observer.halfAngle + i * observer.halfAngle * 2 / rays;
    let reach = 0;
    for (let d = .15; d <= observer.range; d += .15) {
      const tx = observer.x + Math.cos(angle) * d;
      const ty = observer.y + Math.sin(angle) * d;
      if (!lineClear(observer.x, observer.y, tx, ty)) break;
      reach = d;
    }
    ctx.lineTo(ox + Math.cos(angle) * reach * tile, oy + Math.sin(angle) * reach * tile);
  }
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}
function drawSprite(name, x, y, dir = 'front', frame = 0) {
  const img = actors[name];
  if (!img?.complete || !img.naturalWidth) return;
  const rows = ['front', 'back', 'left', 'right'];
  ctx.drawImage(img, frame * 24, rows.indexOf(dir) * 40, 24, 40,
    x * tile + 4, y * tile - 8, 24, 40);
}
function guardDir(angle) {
  if (Math.abs(Math.cos(angle)) > Math.abs(Math.sin(angle))) return Math.cos(angle) > 0 ? 'right' : 'left';
  return Math.sin(angle) > 0 ? 'front' : 'back';
}
function draw() {
  drawFloor();
  for (const item of game.chocolates) {
    const [x, y] = item.split(',').map(Number);
    drawChocolate(x, y);
  }
  for (const guard of game.guards) drawVision(guard, game.alert === 'allarme' ? '#e65f6680' : '#e65f664a');
  drawVision(game.camera, '#d8a14f62');
  const cx = game.camera.x * tile + 9, cy = game.camera.y * tile + 6;
  rect(cx - 2, cy - 2, 18, 15, colors.ink);
  rect(cx, cy, 14, 10, colors.pale);
  rect(cx + 4, cy + 2, 6, 6, colors.police);
  rect(cx + 5, cy + 3, 3, 3, colors.alert);
  drawSprite('cliente', 17, 12, 'front', 0);
  for (const guard of game.guards) drawSprite('policie', guard.x, guard.y, guardDir(guard.angle), guard.frame);
  drawSprite('ipno', game.player.x, game.player.y, DIRS[game.player.direction].name, game.player.frame);
  if (game.seen && game.phase === 'playing') {
    ctx.font = 'bold 19px monospace';
    ctx.fillStyle = colors.alert;
    ctx.fillText('!', game.player.x * tile + 19, game.player.y * tile - 10);
  }
}
function updateHud() {
  $('#loot').textContent = `${game.collected} / ${CHOCOLATES.length}`;
  const alert = $('#alert');
  alert.textContent = game.alert.toUpperCase();
  alert.className = game.alert;
  $('#risk').style.width = `${Math.round(game.suspicion)}%`;
  $('#risk-number').textContent = `${Math.round(game.suspicion)}%`;
  const seconds = Math.floor(game.time);
  $('#time').textContent = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  $('#hint').textContent = game.collected === CHOCOLATES.length
    ? 'Bottino completo! Raggiungi VÝCHOD in alto a destra.'
    : `Ancora ${CHOCOLATES.length - game.collected} cioccolate. Gli scaffali bloccano la vista.`;
}
function showEnd() {
  if (finished || game.phase === 'playing') return;
  finished = true;
  active = false;
  $('#overlay-tag').textContent = game.phase === 'escaped' ? 'MISSIONE COMPIUTA' : 'POLICIE · CATTURATO';
  $('#overlay-title').textContent = game.phase === 'escaped' ? 'Ipno è fuori!' : 'Ti hanno visto.';
  $('#overlay-text').textContent = game.phase === 'escaped'
    ? `Quattro cioccolate e fuga riuscita in ${Math.floor(game.time)} secondi. Il punteggio arriverà nel lotto 2.`
    : 'Fine round. Prova a passare dietro gli scaffali e aspetta che il sospetto scenda prima di attraversare i coni.';
  $('#action').textContent = 'RIPROVA →';
  $('#overlay').hidden = false;
}
function loop(now) {
  const dt = Math.min((now - last) / 1000, .1);
  last = now;
  if (active) {
    if (held) {
      moveClock += dt;
      while (moveClock >= .125) { movePlayer(game, held); moveClock -= .125; }
    } else moveClock = .125;
    advance(game, dt);
    showEnd();
  }
  updateHud();
  draw();
  requestAnimationFrame(loop);
}
$('#action').addEventListener('click', () => {
  game = createGame();
  finished = false;
  active = true;
  held = null;
  moveClock = .125;
  $('#overlay').hidden = true;
});
const keyMap = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
  w: 'up', s: 'down', a: 'left', d: 'right' };
window.addEventListener('keydown', event => {
  const dir = keyMap[event.key] || keyMap[event.key.toLowerCase()];
  if (!dir) return;
  event.preventDefault();
  if (active) held = dir;
});
window.addEventListener('keyup', event => {
  const dir = keyMap[event.key] || keyMap[event.key.toLowerCase()];
  if (dir && held === dir) held = null;
});
window.addEventListener('blur', () => { held = null; });
for (const button of document.querySelectorAll('[data-dir]')) {
  button.addEventListener('pointerdown', event => {
    event.preventDefault();
    button.setPointerCapture(event.pointerId);
    held = button.dataset.dir;
    button.classList.add('pressed');
  });
  const release = () => { if (held === button.dataset.dir) held = null; button.classList.remove('pressed'); };
  button.addEventListener('pointerup', release);
  button.addEventListener('pointercancel', release);
  button.addEventListener('lostpointercapture', release);
}
requestAnimationFrame(loop);
