// Coordinate sul pavimento: x orizzontale, z lungo le corsie. La logica resta
// indipendente da Three.js e può essere riusata quando si espande il livello.
export const BOUNDS = Object.freeze({ minX: -7.4, maxX: 7.4, minZ: -7.4, maxZ: 7.4 });
export const SHELVES_3D = Object.freeze([
  Object.freeze({ minX: -4.25, maxX: -2.55, minZ: -4.1, maxZ: 4.1, name: 'ČOKOLÁDA' }),
  Object.freeze({ minX: 2.55, maxX: 4.25, minZ: -4.1, maxZ: 4.1, name: 'NÁPOJE' })
]);
export const PLAYER_RADIUS = 0.32;
const TAU = Math.PI * 2;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const angleDelta = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));

export function blocked(x, z, radius = PLAYER_RADIUS) {
  if (x - radius < BOUNDS.minX || x + radius > BOUNDS.maxX ||
      z - radius < BOUNDS.minZ || z + radius > BOUNDS.maxZ) return true;
  return SHELVES_3D.some(s => x + radius > s.minX && x - radius < s.maxX &&
                                z + radius > s.minZ && z - radius < s.maxZ);
}

export function rayRectDistance(x, z, dx, dz, rect) {
  let near = -Infinity, far = Infinity;
  for (const [origin, direction, min, max] of [[x, dx, rect.minX, rect.maxX], [z, dz, rect.minZ, rect.maxZ]]) {
    if (Math.abs(direction) < 1e-8) {
      if (origin < min || origin > max) return Infinity;
      continue;
    }
    const a = (min - origin) / direction, b = (max - origin) / direction;
    near = Math.max(near, Math.min(a, b));
    far = Math.min(far, Math.max(a, b));
    if (near > far) return Infinity;
  }
  return far < 0 ? Infinity : Math.max(0, near);
}

export function rayLimit(x, z, angle, range) {
  const dx = Math.cos(angle), dz = Math.sin(angle);
  let distance = range;
  for (const shelf of SHELVES_3D) distance = Math.min(distance, rayRectDistance(x, z, dx, dz, shelf));
  for (const wall of [
    { minX: BOUNDS.minX, maxX: BOUNDS.minX + .01, minZ: BOUNDS.minZ, maxZ: BOUNDS.maxZ },
    { minX: BOUNDS.maxX - .01, maxX: BOUNDS.maxX, minZ: BOUNDS.minZ, maxZ: BOUNDS.maxZ },
    { minX: BOUNDS.minX, maxX: BOUNDS.maxX, minZ: BOUNDS.minZ, maxZ: BOUNDS.minZ + .01 },
    { minX: BOUNDS.minX, maxX: BOUNDS.maxX, minZ: BOUNDS.maxZ - .01, maxZ: BOUNDS.maxZ }
  ]) distance = Math.min(distance, rayRectDistance(x, z, dx, dz, wall));
  return Math.max(0, distance - .03);
}

export function visible(observer, target) {
  const dx = target.x - observer.x, dz = target.z - observer.z;
  const distance = Math.hypot(dx, dz);
  if (distance < .05) return true;
  if (distance > observer.range) return false;
  if (Math.abs(angleDelta(Math.atan2(dz, dx), observer.angle)) > observer.halfAngle) return false;
  return rayLimit(observer.x, observer.z, Math.atan2(dz, dx), distance) >= distance - .05;
}

export function createSample() {
  return {
    phase: 'playing', elapsed: 0, exposure: 0, alert: 'calmo', seen: false,
    player: { x: 0, z: 5.7, facing: -Math.PI / 2, stride: 0 },
    guard: { x: 0, z: -3.8, angle: Math.PI / 2, range: 4.5, halfAngle: .57, direction: 1 },
    camera: { x: 6.65, z: -5.8, angle: 2.45, range: 7.2, halfAngle: .38 }
  };
}

export function stepSample(state, input, delta) {
  if (state.phase !== 'playing') return state;
  const dt = clamp(Number.isFinite(delta) ? delta : 0, 0, .05);
  state.elapsed += dt;
  const length = Math.hypot(input.x || 0, input.z || 0);
  if (length > 0) {
    const dx = input.x / Math.max(1, length) * 3.2 * dt;
    const dz = input.z / Math.max(1, length) * 3.2 * dt;
    if (!blocked(state.player.x + dx, state.player.z)) state.player.x += dx;
    if (!blocked(state.player.x, state.player.z + dz)) state.player.z += dz;
    state.player.facing = Math.atan2(dz, dx);
    state.player.stride += dt * 8;
  }
  const guard = state.guard;
  guard.z += guard.direction * 1.22 * dt;
  if (guard.z >= 3.55) { guard.z = 3.55; guard.direction = -1; }
  if (guard.z <= -4.1) { guard.z = -4.1; guard.direction = 1; }
  guard.angle = guard.direction > 0 ? Math.PI / 2 : -Math.PI / 2;
  state.camera.angle = 2.45 + Math.sin(state.elapsed * .72) * .5;
  state.seen = visible(guard, state.player) || visible(state.camera, state.player);
  state.exposure = clamp(state.exposure + (state.seen ? 34 : -22) * dt, 0, 100);
  state.alert = state.exposure >= 65 ? 'allarme' : state.exposure >= 20 ? 'sospetto' : 'calmo';
  if (state.exposure >= 100 || Math.hypot(guard.x - state.player.x, guard.z - state.player.z) < .55) {
    state.phase = 'caught';
    state.alert = 'allarme';
  }
  return state;
}
