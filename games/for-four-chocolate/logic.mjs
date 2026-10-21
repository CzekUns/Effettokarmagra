export const WIDTH = 20;
export const HEIGHT = 14;
export const BLOCKS = new Set(['#', 'S']);
export const SHELVES = [
  [4, 2, 2, 4], [9, 2, 2, 4], [14, 2, 2, 4],
  [4, 8, 2, 3], [9, 8, 2, 3], [14, 8, 2, 3]
];
export const CHOCOLATES = [[2, 3], [7, 5], [12, 10], [17, 8]];
export const EXIT = { x: 18, y: 1 };
export const CAMERA = { x: 12, y: 1, range: 6, halfAngle: Math.PI / 5 };
export const PATROLS = [
  { route: [[3, 6], [16, 6]], interval: 0.45, range: 5, halfAngle: Math.PI / 4 },
  { route: [[17, 11], [2, 11]], interval: 0.56, range: 4, halfAngle: Math.PI / 4 }
];
export const DIRS = {
  up: { x: 0, y: -1, name: 'back' },
  down: { x: 0, y: 1, name: 'front' },
  left: { x: -1, y: 0, name: 'left' },
  right: { x: 1, y: 0, name: 'right' }
};

export function tileAt(x, y) {
  if (x < 0 || y < 0 || x >= WIDTH || y >= HEIGHT) return '#';
  if (x === 0 || y === 0 || x === WIDTH - 1 || y === HEIGHT - 1) return '#';
  for (const [sx, sy, w, h] of SHELVES) if (x >= sx && x < sx + w && y >= sy && y < sy + h) return 'S';
  return '.';
}
export const walkable = (x, y) => !BLOCKS.has(tileAt(x, y));
const key = (x, y) => `${x},${y}`;
const angleOf = (dx, dy) => Math.atan2(dy, dx);
const angleDiff = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));

export function lineClear(ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const steps = Math.max(Math.abs(dx), Math.abs(dy)) * 12;
  for (let i = 1; i < steps; i++) {
    const x = Math.floor(ax + 0.5 + dx * i / steps);
    const y = Math.floor(ay + 0.5 + dy * i / steps);
    if (BLOCKS.has(tileAt(x, y))) return false;
  }
  return true;
}
export function canSee(observer, target) {
  const dx = target.x - observer.x, dy = target.y - observer.y;
  const distance = Math.hypot(dx, dy);
  if (distance < 0.01) return true;
  if (distance > observer.range) return false;
  if (Math.abs(angleDiff(angleOf(dx, dy), observer.angle)) > observer.halfAngle) return false;
  return lineClear(observer.x, observer.y, target.x, target.y);
}
export function createGame() {
  return {
    phase: 'playing', time: 0, suspicion: 0, alert: 'calmo',
    player: { x: 1, y: 12, direction: 'right', frame: 0 },
    guards: PATROLS.map(p => ({
      x: p.route[0][0], y: p.route[0][1], routeIndex: 1, clock: 0,
      angle: p.route[0][0] < p.route[1][0] ? 0 : Math.PI,
      range: p.range, halfAngle: p.halfAngle, frame: 0
    })),
    camera: { ...CAMERA, angle: Math.PI / 2 },
    chocolates: new Set(CHOCOLATES.map(([x, y]) => key(x, y))),
    collected: 0, seen: false
  };
}
export function movePlayer(game, direction) {
  if (game.phase !== 'playing' || !DIRS[direction]) return false;
  const dir = DIRS[direction];
  game.player.direction = direction;
  const x = game.player.x + dir.x, y = game.player.y + dir.y;
  if (!walkable(x, y)) return false;
  if (x === EXIT.x && y === EXIT.y && game.collected < CHOCOLATES.length) return false;
  game.player.x = x; game.player.y = y;
  game.player.frame = (game.player.frame + 1) % 4;
  if (game.chocolates.delete(key(x, y))) game.collected++;
  if (x === EXIT.x && y === EXIT.y) game.phase = 'escaped';
  return true;
}
export function advance(game, dt) {
  if (game.phase !== 'playing') return game;
  dt = Math.min(Math.max(dt, 0), 0.1);
  game.time += dt;
  PATROLS.forEach((patrol, i) => {
    const guard = game.guards[i];
    guard.clock += dt;
    if (guard.clock < patrol.interval) return;
    guard.clock -= patrol.interval;
    let [tx, ty] = patrol.route[guard.routeIndex];
    if (guard.x === tx && guard.y === ty) {
      guard.routeIndex = 1 - guard.routeIndex;
      [tx, ty] = patrol.route[guard.routeIndex];
    }
    const dx = Math.sign(tx - guard.x), dy = Math.sign(ty - guard.y);
    if (walkable(guard.x + dx, guard.y + dy)) {
      guard.x += dx; guard.y += dy;
      guard.angle = angleOf(dx, dy);
      guard.frame = (guard.frame + 1) % 4;
    }
  });
  game.camera.angle = Math.PI / 2 + Math.sin(game.time * 0.8) * 0.72;
  const seenByGuard = game.guards.some(guard => canSee(guard, game.player));
  const seenByCamera = canSee(game.camera, game.player);
  game.seen = seenByGuard || seenByCamera;
  game.suspicion = Math.max(0, Math.min(100, game.suspicion + (game.seen ? dt * 38 : -dt * 24)));
  game.alert = game.suspicion >= 65 ? 'allarme' : game.suspicion >= 22 ? 'sospetto' : 'calmo';
  if (game.suspicion >= 100 || game.guards.some(g => g.x === game.player.x && g.y === game.player.y)) {
    game.phase = 'caught';
    game.alert = 'allarme';
  }
  return game;
}
