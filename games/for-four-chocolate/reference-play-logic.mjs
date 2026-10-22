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
const NAV_STEP=.4;
const NAV_COLS=Math.round((LIMITS.maxX-LIMITS.minX)/NAV_STEP)+1;
const NAV_ROWS=Math.round((LIMITS.maxZ-LIMITS.minZ)/NAV_STEP)+1;
const navX=index=>LIMITS.minX+(index%NAV_COLS)*NAV_STEP;
const navZ=index=>LIMITS.minZ+Math.floor(index/NAV_COLS)*NAV_STEP;
const NAV_OPEN=Array.from({length:NAV_COLS*NAV_ROWS},(_,index)=>!collides(navX(index),navZ(index)));
function closestOpenCell(x,z) {
  const cx=Math.round((x-LIMITS.minX)/NAV_STEP),cz=Math.round((z-LIMITS.minZ)/NAV_STEP);
  let best=-1,distance=Infinity;
  for(let radius=0;radius<=4;radius++) {
    for(let dz=-radius;dz<=radius;dz++)for(let dx=-radius;dx<=radius;dx++) {
      const xx=cx+dx,zz=cz+dz;
      if(xx<0||xx>=NAV_COLS||zz<0||zz>=NAV_ROWS)continue;
      const id=zz*NAV_COLS+xx;
      if(!NAV_OPEN[id])continue;
      const d=Math.hypot(navX(id)-x,navZ(id)-z);
      if(d<distance){best=id;distance=d;}
    }
    if(best>=0)return best;
  }
  return -1;
}
export function routeAroundCover(start,target) {
  const from=closestOpenCell(start.x,start.z),to=closestOpenCell(target.x,target.z);
  if(from<0||to<0)return [];
  const previous=new Int32Array(NAV_OPEN.length).fill(-1),queue=new Int32Array(NAV_OPEN.length);
  let head=0,tail=0;queue[tail++]=from;previous[from]=from;
  while(head<tail&&previous[to]<0){
    const id=queue[head++],x=id%NAV_COLS,z=Math.floor(id/NAV_COLS);
    for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){
      const nx=x+dx,nz=z+dz;
      if(nx<0||nx>=NAV_COLS||nz<0||nz>=NAV_ROWS)continue;
      const next=nz*NAV_COLS+nx;
      if(!NAV_OPEN[next]||previous[next]>=0)continue;
      previous[next]=id;queue[tail++]=next;
    }
  }
  if(previous[to]<0)return [];
  const path=[];
  for(let id=to;id!==from;id=previous[id])path.push({x:navX(id),z:navZ(id)});
  path.push({x:navX(from),z:navZ(from)});
  return path.reverse();
}
function moveGuard(guard,target,dt,speed) {
  guard.repath=(guard.repath||0)-dt;
  if(!guard.path||guard.repath<=0||Math.hypot(target.x-(guard.pathTargetX??Infinity),target.z-(guard.pathTargetZ??Infinity))>.8){
    guard.path=routeAroundCover(guard,target);
    guard.pathTargetX=target.x;guard.pathTargetZ=target.z;guard.repath=.55;
  }
  while(guard.path.length&&Math.hypot(guard.path[0].x-guard.x,guard.path[0].z-guard.z)<.13)guard.path.shift();
  const point=guard.path[0]||target;
  const dx=point.x-guard.x,dz=point.z-guard.z,distance=Math.hypot(dx,dz);
  guard.moving=false;
  if(distance<.01)return;
  const step=Math.min(distance,speed*dt),nx=guard.x+dx/distance*step,nz=guard.z+dz/distance*step;
  if(collides(nx,nz)){guard.repath=0;return;}
  guard.x=nx;guard.z=nz;guard.angle=Math.atan2(dz,dx);
  guard.stride+=step*(guard.mode==='chase'?7:5);guard.moving=true;
}
function patrolGuard(guard,watch,dt) {
  const before=guard.z;
  guard.z+=guard.dir*(guard.baseSpeed+watch*.28)*dt;
  if(guard.z>guard.maxZ){guard.z=guard.maxZ;guard.dir=-1;}
  if(guard.z<guard.minZ){guard.z=guard.minZ;guard.dir=1;}
  if(collides(guard.x,guard.z)){guard.z=before;guard.dir*=-1;}
  guard.angle=guard.dir>0?Math.PI/2:-Math.PI/2;
  guard.moving=Math.abs(guard.z-before)>.001;
  if(guard.moving)guard.stride+=Math.abs(guard.z-before)*5;
}
function assignResponders(s,source) {
  const ranked=s.guards.map((guard,index)=>({index,distance:Math.hypot(guard.x-s.player.x,guard.z-s.player.z)}))
    .sort((a,b)=>a.distance-b.distance);
  const first=source.type==='guard'?source.index:ranked[0].index;
  const second=ranked.find(item=>item.index!==first)?.index;
  s.security.responders=[first,second].filter(index=>index!==undefined);
  for(const index of s.security.responders){
    const guard=s.guards[index];guard.mode='respond';guard.path=null;guard.repath=0;
  }
}
function startAlarm(s,source) {
  const previous=s.pickups.find(p=>p.id===s.takeId);
  if(previous)s.watchZones[previous.zone]=Math.min(4,s.watchZones[previous.zone]+1);
  s.security={mode:'alert',source:source.type,sourceIndex:source.index??null,
    timer:.75,lostTime:0,lastKnown:{x:s.player.x,z:s.player.z},responders:[]};
  assignResponders(s,source);
  s.message=source.type==='camera'?'⚠ CCTV ha visto il prelievo: POLICIE in arrivo!'
    :'⚠ POLICIE ha visto il prelievo: scappa e usa gli scaffali!';
  if(previous?.status==='taking')previous.status='available';
  s.taking=false;s.takeTime=0;s.takeId=null;
}
function visibleWitness(s) {
  const index=s.guards.findIndex(guard=>canSee(guard,s.player));
  if(index>=0)return {type:'guard',index};
  if(canSee(s.camera,s.player))return {type:'camera'};
  return null;
}
export function initialScene(seed = Math.floor(Math.random()*0xffffffff)) {
  const guards = [
    { x:-8.55, z:5.8, angle:-Math.PI/2, halfAngle:.52, range:4.25, dir:-1, minZ:-6.5,maxZ:5.8, zone:'west',baseSpeed:.88 },
    { x:-1, z:-6.3, angle:Math.PI/2, halfAngle:.48, range:3.6, dir:1, minZ:-6.3,maxZ:6.3, zone:'west',baseSpeed:.74 },
    { x:1, z:6.2, angle:-Math.PI/2, halfAngle:.5, range:3.7, dir:-1,minZ:-6.2,maxZ:6.2, zone:'east',baseSpeed:.8 },
    { x:8.45,z:-6.4,angle:Math.PI/2,halfAngle:.48,range:4.1,dir:1,minZ:-6.4,maxZ:6.0,zone:'east',baseSpeed:.85 }
  ].map(g=>({...g,homeX:g.x,stride:0,moving:false,chasing:false,mode:'patrol',path:null,repath:0}));
  return {
    phase:'playing',time:0,message:'Prendi quattro cioccolate dagli scaffali. Puoi essere visto mentre cammini, non mentre prelevi.',
    seed,player:{x:.25,z:6.2,facing:-Math.PI/2,stride:0,moving:false},guards,
    camera:{x:8.9,z:-7.8,angle:2.25,halfAngle:.34,range:7},
    pickups:selectPickups(seed),visible:false,taking:false,takeTime:0,takeId:null,collected:[],chocolate:0,alert:0,
    security:{mode:'routine',source:null,sourceIndex:null,timer:0,lostTime:0,lastKnown:null,responders:[]},
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
    if(guard.mode==='patrol')patrolGuard(guard,watch,dt);
    else if(guard.mode==='inspect'){
      moveGuard(guard,guard.inspectTarget,dt,1.35);
      if(Math.hypot(guard.x-guard.inspectTarget.x,guard.z-guard.inspectTarget.z)<.55){
        guard.inspectTimer-=dt;
        if(guard.inspectTimer<=0){guard.mode='return';guard.path=null;}
      }
    }else if(guard.mode==='respond'||guard.mode==='chase'){
      moveGuard(guard,s.security.lastKnown,dt,guard.mode==='chase'?2.2:1.75);
    }else if(guard.mode==='search'){
      const target=guard.searchTarget||s.security.lastKnown;
      moveGuard(guard,target,dt,1.3);
      if(Math.hypot(guard.x-target.x,guard.z-target.z)<.5){guard.angle+=dt*1.1;guard.moving=false;}
    }else if(guard.mode==='return'){
      const target={x:guard.homeX,z:clamp(guard.z,guard.minZ,guard.maxZ)};
      moveGuard(guard,target,dt,1.2);
      if(Math.hypot(guard.x-target.x,guard.z-target.z)<.4){guard.mode='patrol';guard.path=null;}
    }
    guard.chasing=guard.mode==='respond'||guard.mode==='chase';
    guard.range = (guard.zone === 'west' ? 4.25 : 3.7) + watch * .32;
  }
  s.camera.angle = 2.2 + Math.sin(s.time * (.7 + s.watchZones.east * .25)) * .57;
  const witness=visibleWitness(s);
  s.visible=!!witness;
  s.alert = clamp(s.alert + (s.visible && m > .05 && !input.crouch ? 6 : -8) * dt, 0, 100);
  s.notificationTime = Math.max(0, s.notificationTime - dt);
  const security=s.security;
  if(security.mode==='alert'||security.mode==='pursuit'||security.mode==='searching'){
    if(witness){security.lastKnown={x:s.player.x,z:s.player.z};security.lostTime=0;}
    else security.lostTime+=dt;
    if(security.mode==='alert'){
      security.timer-=dt;
      if(security.timer<=0){security.mode='pursuit';for(const index of security.responders)s.guards[index].mode='chase';}
    }else if(security.mode==='pursuit'&&security.lostTime>1.15){
      security.mode='searching';security.timer=12;
      security.responders.forEach((index,order)=>{
        const guard=s.guards[index];guard.mode='search';guard.path=null;
        guard.searchTarget=order===0?security.lastKnown:
          {x:security.lastKnown.x+.75,z:security.lastKnown.z+.75};
      });
      s.message='POLICIE cerca Ipno nell’ultima posizione nota. Resta coperto!';
    }else if(security.mode==='searching'){
      if(witness){security.mode='pursuit';security.lostTime=0;
        for(const index of security.responders){s.guards[index].mode='chase';s.guards[index].path=null;}
        s.message='POLICIE ti ha ritrovato!';
      }else if((security.timer-=dt)<=0){
        security.mode='routine_increased';security.source=null;
        for(const index of security.responders){s.guards[index].mode='return';s.guards[index].path=null;}
        security.responders=[];s.message='Ricerca conclusa. La zona resta più sorvegliata.';
      }
    }
    if(security.mode==='alert'||security.mode==='pursuit'||security.mode==='searching'){
      const reached=security.responders.some(index=>Math.hypot(s.guards[index].x-s.player.x,s.guards[index].z-s.player.z)<.55);
      if(reached){s.phase='caught';s.taking=false;s.message='POLICIE ti ha raggiunto.';return s;}
    }
  }
  if (s.taking && witness && (security.mode==='routine'||security.mode==='routine_increased')) {
    startAlarm(s,witness);
    return s;
  }
  const pickup = nearestPickup(s);
  const lockdown=security.mode==='alert'||security.mode==='pursuit'||security.mode==='searching';
  if(input.take&&pickup&&lockdown){
    s.message='POLICIE ti cerca: lascia il ripiano e nasconditi.';
  }else if (input.take && pickup) {
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
        s.watchZones[pickup.zone] = Math.min(4, s.watchZones[pickup.zone] + 1);
        if(security.mode==='routine'||security.mode==='routine_increased'){
          security.mode='routine_increased';
          const guard=s.guards.filter(g=>g.zone===pickup.zone&&!['respond','chase','search'].includes(g.mode))
            .sort((a,b)=>Math.hypot(a.x-pickup.x,a.z-pickup.z)-Math.hypot(b.x-pickup.x,b.z-pickup.z))[0];
          if(guard){guard.mode='inspect';guard.inspectTarget={x:pickup.x,z:pickup.z};guard.inspectTimer=3;
            guard.path=null;guard.repath=0;}
        }
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
