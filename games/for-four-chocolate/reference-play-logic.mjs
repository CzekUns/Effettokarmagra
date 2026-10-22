// World coordinates are metres on the floor. Rendering is deliberately separate.
export const LIMITS = Object.freeze({ minX: -5.6, maxX: 5.6, minZ: -5.1, maxZ: 5.1 });
export const COVER = Object.freeze([
  Object.freeze({ minX: -1.75, maxX: -.55, minZ: -1.78, maxZ: 1.78 }),
  Object.freeze({ minX: 2.45, maxX: 3.55, minZ: -2.3, maxZ: 1.6 }),
  Object.freeze({ minX: 3.2, maxX: 4.3, minZ: 2.55, maxZ: 4.05 }),
  Object.freeze({ minX: -5.6, maxX: -4.6, minZ: -4.9, maxZ: 2.6 }),
  Object.freeze({ minX: -4.7, maxX: 4.35, minZ: -5.1, maxZ: -4.45 })
]);
export const PICKUPS = Object.freeze([
  Object.freeze({ id: 'cacao', x: -.12, z: .4, reach: .88, zone: 'west', shelfX: -.49 }),
  Object.freeze({ id: 'nocciola', x: -2.17, z: -1.05, reach: .88, zone: 'west', shelfX: -1.81 }),
  Object.freeze({ id: 'latte', x: 2.04, z: -.75, reach: .88, zone: 'east', shelfX: 2.41 }),
  Object.freeze({ id: 'fondente', x: 2.77, z: 3.28, reach: .88, zone: 'east', shelfX: 3.16 })
]);
export const EXIT = Object.freeze({ x: 5.05, z: -3.68, reach: .8 });
export const TAKE_SECONDS = 1.15;
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
export function nearestPickup(s) {
  return PICKUPS.filter(p => !s.collected.includes(p.id))
    .map(p => ({ ...p, distance: Math.hypot(s.player.x - p.x, s.player.z - p.z) }))
    .filter(p => p.distance <= p.reach)
    .sort((a, b) => a.distance - b.distance)[0] || null;
}
export function initialScene() {
  const guards = [
    { x: -3.25, z: 2.1, angle: -Math.PI / 2, halfAngle: .52, range: 4.25, dir: -1, minZ: -2.1, maxZ: 2.1, zone: 'west', baseSpeed: .88 },
    { x: 1.23, z: -2.5, angle: Math.PI / 2, halfAngle: .48, range: 3.3, dir: 1, minZ: -2.5, maxZ: 2.1, zone: 'east', baseSpeed: .74 }
  ];
  return {
    phase: 'playing', time: 0, message: 'Prendi quattro cioccolate dagli scaffali. Puoi essere visto mentre cammini, non mentre prelevi.',
    player: { x: .25, z: 3.85, facing: -Math.PI / 2, stride: 0 },
    guards,
    camera: { x: 4.5, z: -4.25, angle: 2.25, halfAngle: .34, range: 7 },
    visible: false, taking: false, takeTime: 0, takeId: null, collected: [], chocolate: 0, alert: 0,
    watchZones: { west: 0, east: 0 }, notificationTime: 0
  };
}
export function updateScene(s, input, delta) {
  if (s.phase !== 'playing') return s;
  const dt = clamp(Number.isFinite(delta) ? delta : 0, 0, .05);
  s.time += dt;
  const m = Math.hypot(input.x || 0, input.z || 0);
  if (m > .001 && !s.taking) {
    const speed = input.crouch ? 1.45 : 2.7;
    const dx = (input.x / Math.max(1, m)) * speed * dt;
    const dz = (input.z / Math.max(1, m)) * speed * dt;
    if (!collides(s.player.x + dx, s.player.z)) s.player.x += dx;
    if (!collides(s.player.x, s.player.z + dz)) s.player.z += dz;
    s.player.facing = Math.atan2(dz, dx);
    s.player.stride += dt * (input.crouch ? 4 : 7);
  }
  for (const guard of s.guards) {
    const watch = s.watchZones[guard.zone];
    guard.z += guard.dir * (guard.baseSpeed + watch * .28) * dt;
    if (guard.z > guard.maxZ) { guard.z = guard.maxZ; guard.dir = -1; }
    if (guard.z < guard.minZ) { guard.z = guard.minZ; guard.dir = 1; }
    guard.angle = guard.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
    guard.range = (guard.zone === 'west' ? 4.25 : 3.3) + watch * .32;
  }
  s.camera.angle = 2.2 + Math.sin(s.time * (.7 + s.watchZones.east * .25)) * .57;
  s.visible = s.guards.some(guard => canSee(guard, s.player)) || canSee(s.camera, s.player);
  s.alert = clamp(s.alert + (s.visible && m > .05 && !input.crouch ? 6 : -8) * dt, 0, 100);
  s.notificationTime = Math.max(0, s.notificationTime - dt);
  if (s.taking && s.visible) {
    s.phase = 'caught'; s.taking = false; s.message = 'Visto durante il prelievo. POLICIE!';
    return s;
  }
  const pickup = nearestPickup(s);
  if (input.take && pickup) {
    if (!s.taking && s.visible) {
      s.message = 'Troppo esposto: aspetta dietro lo scaffale.'; s.notificationTime = 2.5;
    } else if (!s.visible) {
      if (s.takeId !== pickup.id) { s.takeTime = 0; s.takeId = pickup.id; }
      s.taking = true; s.takeTime += dt;
      s.message = `Prelievo ${s.chocolate + 1}/4 in corso… resta nascosto.`;
      if (s.takeTime >= TAKE_SECONDS) {
        s.collected.push(pickup.id); s.chocolate = s.collected.length;
        s.taking = false; s.takeTime = 0; s.takeId = null;
        s.watchZones[pickup.zone] = Math.min(2, s.watchZones[pickup.zone] + 1);
        s.message = s.chocolate === PICKUPS.length ? 'Quattro cioccolate prese! Raggiungi VÝCHOD.'
          : `Cioccolata ${s.chocolate}/4 presa. La zona ${pickup.zone === 'west' ? 'ovest' : 'est'} è più sorvegliata.`;
        s.notificationTime = 4;
      }
    }
  } else if (!input.take || !pickup) { s.taking = false; s.takeTime = 0; s.takeId = null; }
  if (s.chocolate === PICKUPS.length && Math.hypot(s.player.x - EXIT.x, s.player.z - EXIT.z) <= EXIT.reach) {
    s.phase = 'escaped'; s.message = 'Fuori con tutte e quattro le cioccolate!';
  }
  return s;
}
