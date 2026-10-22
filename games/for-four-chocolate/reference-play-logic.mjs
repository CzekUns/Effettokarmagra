// World coordinates are metres on the floor. Rendering is deliberately separate.
export const LIMITS = Object.freeze({ minX: -5.6, maxX: 5.6, minZ: -5.1, maxZ: 5.1 });
export const COVER = Object.freeze([
  Object.freeze({ minX: -1.75, maxX: -.55, minZ: -1.78, maxZ: 1.78 }),
  Object.freeze({ minX: 2.45, maxX: 3.55, minZ: -2.3, maxZ: 1.6 }),
  Object.freeze({ minX: 3.2, maxX: 4.3, minZ: 2.55, maxZ: 4.05 }),
  Object.freeze({ minX: -5.6, maxX: -4.6, minZ: -4.9, maxZ: 2.6 }),
  Object.freeze({ minX: -4.7, maxX: 4.35, minZ: -5.1, maxZ: -4.45 })
]);
export const PICKUP = Object.freeze({ x: -.12, z: .4, reach: .88 });
export const EXIT = Object.freeze({ x: 5.05, z: -3.68, reach: .8 });
const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
const deltaAngle = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));

export function collides(x, z, radius = .28) {
  if (x - radius < LIMITS.minX || x + radius > LIMITS.maxX ||
      z - radius < LIMITS.minZ || z + radius > LIMITS.maxZ) return true;
  return COVER.some(r => x + radius > r.minX && x - radius < r.maxX &&
                         z + radius > r.minZ && z - radius < r.maxZ);
}
function rayRect(x, z, dx, dz, r) {
  let near = -Infinity, far = Infinity;
  for (const [p, v, min, max] of [[x, dx, r.minX, r.maxX], [z, dz, r.minZ, r.maxZ]]) {
    if (Math.abs(v) < 1e-8) { if (p < min || p > max) return Infinity; continue; }
    const a = (min - p) / v, b = (max - p) / v;
    near = Math.max(near, Math.min(a, b)); far = Math.min(far, Math.max(a, b));
    if (near > far) return Infinity;
  }
  return far < 0 ? Infinity : Math.max(0, near);
}
export function rayDistance(x, z, angle, maxDistance) {
  const dx = Math.cos(angle), dz = Math.sin(angle);
  return Math.min(maxDistance, ...COVER.map(r => rayRect(x, z, dx, dz, r)));
}
export function canSee(eye, point) {
  const dx = point.x - eye.x, dz = point.z - eye.z, length = Math.hypot(dx, dz);
  if (length > eye.range || length < .01) return false;
  const angle = Math.atan2(dz, dx);
  if (Math.abs(deltaAngle(angle, eye.angle)) > eye.halfAngle) return false;
  return rayDistance(eye.x, eye.z, angle, length) >= length - .02;
}
export function initialScene() {
  return {
    phase: 'playing', time: 0, message: 'Raggiungi lo scaffale di cioccolata senza farti vedere mentre prendi.',
    player: { x: .25, z: 3.85, facing: -Math.PI / 2, stride: 0 },
    guard: { x: -3.25, z: 2.1, angle: -Math.PI / 2, halfAngle: .52, range: 4.25, dir: -1 },
    camera: { x: 4.5, z: -4.25, angle: 2.25, halfAngle: .34, range: 7 },
    visible: false, taking: false, takeTime: 0, chocolate: 0, alert: 0, lastVisible: false,
    increasedWatch: false, notificationTime: 0
  };
}
export function updateScene(s, input, delta) {
  if (s.phase !== 'playing') return s;
  const dt = clamp(Number.isFinite(delta) ? delta : 0, 0, .05);
  s.time += dt;
  const m = Math.hypot(input.x || 0, input.z || 0);
  if (m > .001) {
    const speed = input.crouch ? 1.45 : 2.7;
    const dx = (input.x / Math.max(1, m)) * speed * dt;
    const dz = (input.z / Math.max(1, m)) * speed * dt;
    if (!collides(s.player.x + dx, s.player.z)) s.player.x += dx;
    if (!collides(s.player.x, s.player.z + dz)) s.player.z += dz;
    s.player.facing = Math.atan2(dz, dx);
    s.player.stride += dt * (input.crouch ? 4 : 7);
  }
  s.guard.z += s.guard.dir * (s.increasedWatch ? 1.32 : .88) * dt;
  if (s.guard.z > 2.1) { s.guard.z = 2.1; s.guard.dir = -1; }
  if (s.guard.z < -2.1) { s.guard.z = -2.1; s.guard.dir = 1; }
  s.guard.angle = s.guard.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
  s.camera.angle = 2.2 + Math.sin(s.time * (s.increasedWatch ? 1.35 : .7)) * .57;
  s.visible = canSee(s.guard, s.player) || canSee(s.camera, s.player);
  s.alert = clamp(s.alert + (s.visible && m > .05 && !input.crouch ? 6 : -8) * dt, 0, 100);
  s.notificationTime = Math.max(0, s.notificationTime - dt);
  const nearPickup = Math.hypot(s.player.x - PICKUP.x, s.player.z - PICKUP.z) <= PICKUP.reach;
  if (input.take && !s.chocolate && nearPickup) {
    if (!s.taking && s.visible) {
      s.message = 'Troppo esposto: aspetta dietro lo scaffale.'; s.notificationTime = 2.5;
    } else if (!s.visible) {
      s.taking = true; s.takeTime += dt;
      s.message = 'Prelievo in corso… resta nascosto.';
      if (s.takeTime >= 1.15) {
        s.chocolate = 1; s.taking = false; s.takeTime = 0;
        s.increasedWatch = true;
        s.guard.range = 5.1;
        s.message = 'Cioccolata presa! La sorveglianza aumenta: raggiungi USCITA.';
        s.notificationTime = 4;
      }
    }
  } else if (!input.take || !nearPickup) { s.taking = false; s.takeTime = 0; }
  if (s.taking && s.visible) {
    s.phase = 'caught'; s.taking = false; s.message = 'Visto durante il prelievo. POLICIE!';
  }
  if (s.chocolate && Math.hypot(s.player.x - EXIT.x, s.player.z - EXIT.z) <= EXIT.reach) {
    s.phase = 'escaped'; s.message = 'Fuori con la cioccolata!';
  }
  return s;
}
