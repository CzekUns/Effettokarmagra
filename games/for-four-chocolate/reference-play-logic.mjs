// Metres on the supermarket floor; rendering and rules use the same shelf data.
export const LIMITS = Object.freeze({ minX: -11, maxX: 11, minZ: -10, maxZ: 10 });
export const GOAL = 4;
export const SHELVES = Object.freeze([
  { id:'chocolate', label:'ČOKOLÁDA', x:-6.9, z:-2.9, length:5.2, kind:'chocolate', zone:'west' },
  { id:'sweets', label:'SLADKOSTI', x:-3.45, z:-2.9, length:5.2, kind:'chocolate', zone:'west' },
  { id:'food', label:'POTRAVINY', x:0, z:-2.9, length:5.2, kind:'food', zone:'east' },
  { id:'drinks', label:'NÁPOJE', x:3.45, z:-2.9, length:5.2, kind:'drinks', zone:'east' },
  { id:'offers', label:'AKCE', x:6.9, z:-2.9, length:5.2, kind:'chocolate', zone:'east' },
  { id:'specials', label:'SPECIÁL', x:-6.9, z:5, length:2.6, kind:'chocolate', zone:'west' },
  { id:'checkout', label:'POKLADNA', x:6.5, z:5, length:2.6, kind:'checkout', zone:'east' }
].map(Object.freeze));
export const PARTITIONS = Object.freeze([
  {minX:-5.0,maxX:-1.7,minZ:2.05,maxZ:2.38,height:1.75},
  {minX:1.4,maxX:4.65,minZ:2.05,maxZ:2.38,height:1.75},
  {minX:-4.8,maxX:-4.48,minZ:4.05,maxZ:7.1,height:1.85},
  {minX:4.45,maxX:4.77,minZ:4.1,maxZ:7.15,height:1.8}
].map(Object.freeze));
const shelfCover = SHELVES.map(shelf => Object.freeze({
  minX:shelf.x-.6,maxX:shelf.x+.6,minZ:shelf.z-shelf.length/2,maxZ:shelf.z+shelf.length/2
}));
export const COVER = Object.freeze([
  ...shelfCover,
  ...PARTITIONS,
  Object.freeze({ minX:-10.8,maxX:-10.1,minZ:-8.7,maxZ:1.6 }),
  Object.freeze({ minX:-9.5,maxX:7.7,minZ:-9.7,maxZ:-9.05 })
]);
const candidateSpots = SHELVES.filter(s=>s.id!=='checkout').flatMap(shelf =>
  [-1,0,1].map((slot) => {
    const side = slot===0 ? -1 : 1;
    const offset = shelf.length>4 ? slot*1.48 : slot*.72;
    return Object.freeze({ id:`${shelf.id}-${slot+1}`, shelfId:shelf.id,
      x:shelf.x+side*.99, z:shelf.z+offset, shelfX:shelf.x+side*.62,
      reach:.79, zone:shelf.zone, side });
  }));
export const PICKUP_CANDIDATES = Object.freeze(candidateSpots);
export const PICKUPS = PICKUP_CANDIDATES; // data for maps and older test tooling
export const EXIT = Object.freeze({ x:9.6, z:-8.25, reach:.8 });
export const TAKE_SECONDS = 1.15;
const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
const deltaAngle = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));
function randomGenerator(seed) {
  let value = seed >>> 0;
  return () => { value = (value + 0x6D2B79F5) >>> 0;
    let t=value;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);
    return ((t^(t>>>14))>>>0)/4294967296; };
}
function shuffle(values, random) {
  for(let i=values.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[values[i],values[j]]=[values[j],values[i]];}
  return values;
}
export function selectPickups(seed = 1, count = 10) {
  const random=randomGenerator(seed);
  const chosen=[];
  for(const shelf of SHELVES.filter(s=>s.id!=='checkout')) {
    const options=PICKUP_CANDIDATES.filter(p=>p.shelfId===shelf.id);
    chosen.push(options[Math.floor(random()*options.length)]);
  }
  const remaining=shuffle(PICKUP_CANDIDATES.filter(p=>!chosen.includes(p)),random);
  return [...chosen,...remaining.slice(0,clamp(count,8,12)-chosen.length)]
    .map(p=>({...p,status:'available'}));
}
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
// A display fades only if its volume is between the orbiting camera and Ipno.
export function coverBlocksCamera(bounds, height, camera, player) {
  let near=0,far=1;
  for(const [origin,delta,min,max] of [[camera.x,player.x-camera.x,bounds.minX,bounds.maxX],
    [camera.z,player.z-camera.z,bounds.minZ,bounds.maxZ]]) {
    if(Math.abs(delta)<1e-8){if(origin<min||origin>max)return false;continue;}
    const a=(min-origin)/delta,b=(max-origin)/delta;
    near=Math.max(near,Math.min(a,b));far=Math.min(far,Math.max(a,b));
    if(near>far)return false;
  }
  if(near>=.98||far<=0)return false;
  const exitY=camera.y+(.12-camera.y)*Math.min(far,.98);
  return exitY<=height+.2;
}
export function shelfBlocksCamera(shelf, camera, player) {
  return coverBlocksCamera({minX:shelf.x-.6,maxX:shelf.x+.6,
    minZ:shelf.z-shelf.length/2,maxZ:shelf.z+shelf.length/2},
    shelf.kind==='checkout'?1.5:2.5,camera,player);
}
export function nearestPickup(s) {
  return s.pickups.filter(p => p.status !== 'collected')
    .map(p => ({ spot:p, distance:Math.hypot(s.player.x-p.x,s.player.z-p.z) }))
    .filter(p => p.distance <= p.spot.reach)
    .sort((a,b)=>a.distance-b.distance)[0]?.spot || null;
}
export function initialScene(seed = Math.floor(Math.random()*0xffffffff)) {
  const guards = [
    { x:-8.55, z:5.8, angle:-Math.PI/2, halfAngle:.52, range:4.25, dir:-1, minZ:-6.5,maxZ:5.8, zone:'west',baseSpeed:.88 },
    { x:-1.7, z:-6.3, angle:Math.PI/2, halfAngle:.48, range:3.6, dir:1, minZ:-6.3,maxZ:6.3, zone:'west',baseSpeed:.74 },
    { x:1.7, z:6.2, angle:-Math.PI/2, halfAngle:.5, range:3.7, dir:-1,minZ:-6.2,maxZ:6.2, zone:'east',baseSpeed:.8 },
    { x:8.45,z:-6.4,angle:Math.PI/2,halfAngle:.48,range:4.1,dir:1,minZ:-6.4,maxZ:6.0,zone:'east',baseSpeed:.85 }
  ].map(g=>({...g,stride:0,moving:false,chasing:false}));
  return {
    phase:'playing',time:0,message:'Prendi quattro cioccolate dagli scaffali. Puoi essere visto mentre cammini, non mentre prelevi.',
    seed,player:{x:.25,z:6.2,facing:-Math.PI/2,stride:0,moving:false},guards,
    camera:{x:8.9,z:-7.8,angle:2.25,halfAngle:.34,range:7},
    pickups:selectPickups(seed),visible:false,taking:false,takeTime:0,takeId:null,collected:[],chocolate:0,alert:0,
    watchZones:{west:0,east:0},notificationTime:0
  };
}
export function updateScene(s, input, delta) {
  if (s.phase !== 'playing') return s;
  const dt = clamp(Number.isFinite(delta) ? delta : 0, 0, .05);
  s.time += dt;
  const m = Math.hypot(input.x || 0, input.z || 0);
  s.player.moving = false;
  if (m > .001 && !s.taking) {
    const startX = s.player.x, startZ = s.player.z;
    const speed = input.crouch ? 1.45 : 2.7;
    const dx = (input.x / Math.max(1, m)) * speed * dt;
    const dz = (input.z / Math.max(1, m)) * speed * dt;
    if (!collides(s.player.x + dx, s.player.z)) s.player.x += dx;
    if (!collides(s.player.x, s.player.z + dz)) s.player.z += dz;
    const travel = Math.hypot(s.player.x - startX, s.player.z - startZ);
    s.player.moving = travel > .001;
    if (s.player.moving) {
      s.player.facing = Math.atan2(s.player.z - startZ, s.player.x - startX);
      s.player.stride += travel * (input.crouch ? 5.4 : 4.8);
    }
  }
  for (const guard of s.guards) {
    const watch = s.watchZones[guard.zone];
    const startZ = guard.z;
    guard.z += guard.dir * (guard.baseSpeed + watch * .28) * dt;
    if (guard.z > guard.maxZ) { guard.z = guard.maxZ; guard.dir = -1; }
    if (guard.z < guard.minZ) { guard.z = guard.minZ; guard.dir = 1; }
    guard.angle = guard.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
    guard.moving = Math.abs(guard.z - startZ) > .001;
    if (guard.moving) guard.stride += Math.abs(guard.z - startZ) * (guard.chasing ? 7 : 5);
    guard.range = (guard.zone === 'west' ? 4.25 : 3.7) + watch * .32;
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
      s.player.facing = Math.atan2(pickup.z - s.player.z, pickup.shelfX - s.player.x);
      if (s.takeId !== pickup.id) {
        const previous=s.pickups.find(p=>p.id===s.takeId);
        if(previous?.status==='taking')previous.status='available';
        s.takeTime = 0; s.takeId = pickup.id;
      }
      pickup.status='taking';s.taking = true; s.takeTime += dt;
      s.message = `Prelievo ${Math.min(GOAL,s.chocolate + 1)}/${GOAL} in corso… resta nascosto.`;
      if (s.takeTime >= TAKE_SECONDS) {
        pickup.status='collected';s.collected.push(pickup.id);s.chocolate=Math.min(GOAL,s.collected.length);
        s.taking = false; s.takeTime = 0; s.takeId = null;
        s.watchZones[pickup.zone] = Math.min(2, s.watchZones[pickup.zone] + 1);
        s.message = s.chocolate === GOAL ? 'Quattro cioccolate prese! Raggiungi VÝCHOD.'
          : `Cioccolata ${s.chocolate}/${GOAL} presa. La zona ${pickup.zone === 'west' ? 'ovest' : 'est'} è più sorvegliata.`;
        s.notificationTime = 4;
      }
    }
  } else {
    const previous=s.pickups.find(p=>p.id===s.takeId);
    if(previous?.status==='taking')previous.status='available';
    s.taking = false; s.takeTime = 0; s.takeId = null;
  }
  if (s.chocolate >= GOAL && Math.hypot(s.player.x - EXIT.x, s.player.z - EXIT.z) <= EXIT.reach) {
    s.phase = 'escaped'; s.message = 'Fuori con tutte e quattro le cioccolate!';
  }
  return s;
}
