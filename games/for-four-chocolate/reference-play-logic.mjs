// Metres on the supermarket floor; rendering and rules use the same shelf data.
export const LIMITS = Object.freeze({ minX: -16, maxX: 16, minZ: -15, maxZ: 15 });
export const FINE = 50;
export const CAMERA_THRESHOLDS = Object.freeze([0,2,3,5,7,10,14,18,24,32]);
export const GUARD_THRESHOLDS = Object.freeze([5,7,9,11,13,15,17,19]);
export const GUARD_HEARING_RANGE = 2.7;
export const SPECIAL_NAME = 'Ciokospira';
export const SPECIAL_EFFECTS = Object.freeze([
  'fast','invisible','fast_take','calm','plus_five',
  'slow','slow_take','suspicious','minus_five','trail'
]);
export const SHELVES = Object.freeze([
  { id:'chocolate', label:'ČOKOLÁDA', x:-6.9, z:-2.9, length:5.2, kind:'chocolate', zone:'west' },
  { id:'sweets', label:'SLADKOSTI', x:-3.45, z:-2.9, length:5.2, kind:'chocolate', zone:'west' },
  { id:'food', label:'POTRAVINY', x:0, z:-2.9, length:5.2, kind:'food', zone:'east' },
  { id:'drinks', label:'NÁPOJE', x:3.45, z:-2.9, length:5.2, kind:'drinks', zone:'east' },
  { id:'offers', label:'AKCE', x:6.9, z:-2.9, length:5.2, kind:'chocolate', zone:'east' },
  { id:'specials', label:'SPECIÁL', x:-6.9, z:5, length:2.6, kind:'low', zone:'west' },
  { id:'checkout', label:'POKLADNA', x:6.5, z:5, length:2.6, kind:'checkout', zone:'east' },
  { id:'west-north', label:'ČOKOLÁDA', x:-12.5, z:-8.5, length:5.2, kind:'chocolate', zone:'west' },
  { id:'west-south', label:'POTRAVINY', x:-12.5, z:7.5, length:5.2, kind:'food', zone:'west' },
  { id:'east-north', label:'NÁPOJE', x:12.5, z:-8.5, length:5.2, kind:'drinks', zone:'east' },
  { id:'east-south', label:'ČOKOLÁDA', x:12.5, z:7.5, length:5.2, kind:'chocolate', zone:'east' },
  { id:'north-west', label:'SLADKOSTI', x:-6.9, z:-10.3, length:4, kind:'chocolate', zone:'west' },
  { id:'north-east', label:'AKCE', x:6.9, z:-10.3, length:4, kind:'chocolate', zone:'east' },
  { id:'south-west', label:'ČOKOLÁDA', x:-3.45, z:10.3, length:4, kind:'chocolate', zone:'west' },
  { id:'south-east', label:'POTRAVINY', x:3.45, z:10.3, length:4, kind:'food', zone:'east' }
].map(Object.freeze));
export const PARTITIONS = Object.freeze([
  {minX:-5.0,maxX:-1.7,minZ:2.05,maxZ:2.38,height:1.75},
  {minX:1.4,maxX:4.65,minZ:2.05,maxZ:2.38,height:1.75},
  {minX:-4.8,maxX:-4.48,minZ:4.05,maxZ:7.1,height:1.85},
  {minX:4.45,maxX:4.77,minZ:4.1,maxZ:7.15,height:1.8}
].map(Object.freeze));
const shelfCover = SHELVES.map(shelf => Object.freeze({
  minX:shelf.x-.6,maxX:shelf.x+.6,minZ:shelf.z-shelf.length/2,maxZ:shelf.z+shelf.length/2,
  height:shelf.kind==='checkout'||shelf.kind==='low'?1.15:2.5
}));
export const COVER = Object.freeze([
  ...shelfCover,
  ...PARTITIONS,
  Object.freeze({ minX:-15.8,maxX:-15.1,minZ:-13.7,maxZ:-3.4,height:3.5 }),
  Object.freeze({ minX:-14.5,maxX:12.7,minZ:-14.7,maxZ:-14.05,height:3.5 })
]);
const candidateSpots = SHELVES.filter(s=>s.id!=='checkout').flatMap(shelf =>
  [-2,-1,1,2].map((slot,index) => {
    const side = Math.sign(slot);
    const offset = slot*shelf.length/4.8;
    return Object.freeze({ id:`${shelf.id}-${index+1}`, shelfId:shelf.id,
      x:shelf.x+side*.99, z:shelf.z+offset, shelfX:shelf.x+side*.62,
      reach:.79, zone:shelf.zone, side });
  }));
export const PICKUP_CANDIDATES = Object.freeze(candidateSpots);
export const PICKUPS = PICKUP_CANDIDATES; // data for maps and older test tooling
export const EXIT = Object.freeze({ x:14.6, z:-13.25, reach:.8 });
export const TAKE_SECONDS = 1.15;
export const CAMERA_POSTS = Object.freeze([
  {x:8.9,z:-7.8,baseAngle:2.2}, {x:-8.9,z:-7.8,baseAngle:.85},
  {x:-9.2,z:7.7,baseAngle:-.5}, {x:8.9,z:6.9,baseAngle:-2.5},
  {x:0,z:8.7,baseAngle:-Math.PI/2}, {x:0,z:-8.4,baseAngle:Math.PI/2},
  {x:-14.2,z:-12.5,baseAngle:.6}, {x:14.1,z:10.8,baseAngle:-2.4},
  {x:-5,z:13.2,baseAngle:-1.1}, {x:10.2,z:-13.1,baseAngle:1.9}
].map(Object.freeze));
export const GUARD_POSTS = Object.freeze([
  {x:-8.55,z:5.8,dir:-1,minZ:-6.5,maxZ:5.8,zone:'west',baseSpeed:.88},
  {x:-13.6,z:-11.8,dir:1,minZ:-13,maxZ:12,zone:'west',baseSpeed:.82},
  {x:12.2,z:2.4,dir:-1,minZ:-13,maxZ:12,zone:'east',baseSpeed:.8},
  {x:1,z:10.4,dir:-1,minZ:-13,maxZ:12,zone:'east',baseSpeed:.85},
  {x:-9.3,z:-6.3,dir:1,minZ:-13,maxZ:12,zone:'west',baseSpeed:.83},
  {x:-13.6,z:11.8,dir:-1,minZ:-13,maxZ:12,zone:'west',baseSpeed:.9},
  {x:13.6,z:11.8,dir:-1,minZ:-13,maxZ:12,zone:'east',baseSpeed:.9},
  {x:13.8,z:-11.8,dir:1,minZ:-13,maxZ:12,zone:'east',baseSpeed:.9}
].map(Object.freeze));
export function crowns(s) { return s.chocolate - (s.phase==='caught' ? FINE : 0); }
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
export function selectPickups(seed = 1, count = 14) {
  const random=randomGenerator(seed);
  const chosen=[];
  for(const shelf of SHELVES.filter(s=>s.id!=='checkout')) {
    const options=PICKUP_CANDIDATES.filter(p=>p.shelfId===shelf.id);
    chosen.push(options[Math.floor(random()*options.length)]);
  }
  const remaining=shuffle(PICKUP_CANDIDATES.filter(p=>!chosen.includes(p)),random);
  return [...chosen,...remaining.slice(0,clamp(count,chosen.length,22)-chosen.length)]
    .map(p=>({...p,status:'available'}));
}
export function collides(x, z, radius = .28) {
  if (x - radius < LIMITS.minX || x + radius > LIMITS.maxX ||
      z - radius < LIMITS.minZ || z + radius > LIMITS.maxZ) return true;
  return COVER.some(r => x + radius > r.minX && x - radius < r.maxX &&
                         z + radius > r.minZ && z - radius < r.maxZ);
}
function rayRectInterval(x, z, dx, dz, r) {
  let near = -Infinity, far = Infinity;
  for (const [p, v, min, max] of [[x, dx, r.minX, r.maxX], [z, dz, r.minZ, r.maxZ]]) {
    if (Math.abs(v) < 1e-8) { if (p < min || p > max) return null; continue; }
    const a = (min - p) / v, b = (max - p) / v;
    near = Math.max(near, Math.min(a, b)); far = Math.min(far, Math.max(a, b));
  }
  return far < 0 ? null : [Math.max(0,near),far];
}
function rayRect(x,z,dx,dz,r) {
  return rayRectInterval(x,z,dx,dz,r)?.[0]??Infinity;
}
export function rayDistance(x, z, angle, maxDistance) {
  const dx = Math.cos(angle), dz = Math.sin(angle);
  return Math.min(maxDistance, ...COVER.map(r => rayRect(x, z, dx, dz, r)));
}
export function guardRayDistance(x,z,angle,maxDistance) {
  const dx=Math.cos(angle),dz=Math.sin(angle);
  return Math.min(maxDistance,...COVER.filter(cover=>(cover.height??2.5)>1.6)
    .map(cover=>rayRect(x,z,dx,dz,cover)));
}
export function canSee(eye, point) {
  const dx = point.x - eye.x, dz = point.z - eye.z, length = Math.hypot(dx, dz);
  if (length > eye.range || length < .01) return false;
  const angle = Math.atan2(dz, dx);
  if (Math.abs(deltaAngle(angle, eye.angle)) > eye.halfAngle) return false;
  return rayDistance(eye.x, eye.z, angle, length) >= length - .02;
}
// The guard sees over low displays while standing; a crouching target disappears behind them.
export function guardSight(guard,point,{crouch=false,invisible=false}={}) {
  if(invisible)return null;
  const dx=point.x-guard.x,dz=point.z-guard.z,length=Math.hypot(dx,dz);
  if(length>.001&&length<=guard.range){
    const angle=Math.abs(deltaAngle(Math.atan2(dz,dx),guard.angle));
    const peripheral=angle>guard.halfAngle;
    if(angle<=guard.halfAngle*1.2&&(!peripheral||!crouch)){
      const ux=dx/length,uz=dz/length,targetEye=crouch?.8:1.65;
      const blocked=COVER.some(cover=>{
        const interval=rayRectInterval(guard.x,guard.z,ux,uz,cover);
        if(!interval||interval[0]>=length-.02)return false;
        const nearHeight=1.68+(targetEye-1.68)*interval[0]/length;
        const farHeight=1.68+(targetEye-1.68)*Math.min(interval[1],length)/length;
        return (cover.height??2.5)>=Math.min(nearHeight,farHeight)-.03;
      });
      if(!blocked)return peripheral?'peripheral':length<=guard.range*.5?'near':'far';
    }
  }
  return null;
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
    shelf.kind==='checkout'||shelf.kind==='low'?1.15:2.5,camera,player);
}
export function nearestPickup(s) {
  return s.pickups.filter(p => p.status === 'available' || p.status === 'taking')
    .map(p => ({ spot:p, distance:Math.hypot(s.player.x-p.x,s.player.z-p.z) }))
    .filter(p => p.distance <= p.spot.reach)
    .sort((a,b)=>a.distance-b.distance)[0]?.spot || null;
}
function addCamera(s) {
  const index=s.cameras.length,post=CAMERA_POSTS[index];
  if(!post)return false;
  s.cameras.push({x:post.x,z:post.z,baseAngle:post.baseAngle,angle:post.baseAngle,
    halfAngle:.34,range:7});
  return true;
}
const PATROL_POINTS=Object.freeze([
  ...PICKUP_CANDIDATES.map(p=>({x:p.x,z:p.z})),
  ...[[-14,-12],[-14,12],[14,-12],[14,12],[-9,9],[9,9],[-9,-9],[9,-9]]
    .map(([x,z])=>({x,z}))
].filter(p=>!collides(p.x,p.z)).map(Object.freeze));
function nextRandom(s,key){
  s[key]=(Math.imul(s[key],1664525)+1013904223)>>>0;
  return s[key]/4294967296;
}
export function guardTarget(chocolate) {
  return chocolate<5?0:Math.floor((chocolate-5)/2)+1;
}
export function playerBulkScale(chocolate) {
  if(chocolate<15)return 1;
  return 1+Math.min(1.8,Math.floor(chocolate/15)*.3+(chocolate%15)*.004);
}
function addGuard(s) {
  const index=s.guards.length;
  let post=GUARD_POSTS[index];
  if(!post){
    const random=randomGenerator(s.seed^Math.imul(index+1,0x85ebca6b));
    const options=PATROL_POINTS.filter(point=>Math.hypot(point.x-s.player.x,point.z-s.player.z)>3);
    const point=options[Math.floor(random()*options.length)]||PATROL_POINTS[index%PATROL_POINTS.length];
    post={...point,dir:index%2?1:-1,minZ:LIMITS.minZ+1,maxZ:LIMITS.maxZ-1,
      zone:point.x<0?'west':'east',baseSpeed:.78+random()*.24};
  }
  s.guards.push({...post,homeX:post.x,angle:post.dir>0?Math.PI/2:-Math.PI/2,
    halfAngle:.5,range:4,stride:0,moving:false,chasing:false,mode:'patrol',
    path:null,repath:0,exclamationTime:0,patrolTarget:null,
    patrolSeed:(s.seed^Math.imul(index+1,0x9e3779b9))>>>0});
  return true;
}
export function increaseSecurity(s) {
  while(s.cameras.length<CAMERA_THRESHOLDS.filter(n=>s.chocolate>=n).length)addCamera(s);
  while(s.guards.length<guardTarget(s.chocolate))addGuard(s);
}
function refillPickup(s,used) {
  const active=new Set(s.pickups.filter(p=>p!==used).map(p=>p.id));
  const available=PICKUP_CANDIDATES.filter(p=>!active.has(p.id)&&p.id!==s.special?.id);
  const distant=available.filter(p=>p.shelfId!==used.shelfId&&
    !s.recentShelves.includes(p.shelfId)&&Math.hypot(p.x-s.player.x,p.z-s.player.z)>=8);
  const alternatives=available.filter(p=>p.shelfId!==used.shelfId&&
    Math.hypot(p.x-s.player.x,p.z-s.player.z)>=5);
  const pool=distant.length?distant:alternatives.length?alternatives:available;
  const next=pool[Math.floor(nextRandom(s,'refillSeed')*pool.length)];
  s.pickups[s.pickups.indexOf(used)]={...next,status:'available'};
  s.recentShelves.push(used.shelfId);
  if(s.recentShelves.length>5)s.recentShelves.shift();
  s.pickupVersion++;
}
function maybeSpawnSpecial(s) {
  if(s.normalStolen<3||(s.normalStolen-3)%4!==0||s.specialOffer)return false;
  const occupied=new Set(s.pickups.map(p=>p.id));
  const options=PICKUP_CANDIDATES.filter(p=>!occupied.has(p.id)&&p.id!==s.special?.id);
  const distant=options.filter(p=>Math.hypot(p.x-s.player.x,p.z-s.player.z)>5);
  const choices=distant.length?distant:options;
  if(!choices.length)return false;
  s.special={...choices[Math.floor(nextRandom(s,'specialSeed')*choices.length)],name:SPECIAL_NAME};
  return true;
}
export function nearestSpecial(s) {
  if(!s.special)return null;
  return Math.hypot(s.player.x-s.special.x,s.player.z-s.special.z)<=s.special.reach?s.special:null;
}
export function eatSpecial(s) {
  if(s.specialOffer?.stage!=='found')return null;
  const random=randomGenerator(s.seed^Math.imul(++s.effectRoll,0x27d4eb2d));
  const effect=SPECIAL_EFFECTS[Math.floor(random()*SPECIAL_EFFECTS.length)];
  s.specialOffer={stage:'eaten',name:SPECIAL_NAME,effect,timer:2.8};
  s.chocolate++;
  if(effect==='plus_five')s.chocolate+=5;
  if(effect==='minus_five')s.chocolate=Math.max(0,s.chocolate-5);
  if(effect==='calm'||effect==='suspicious'){
    const change=effect==='calm'?-1:2;
    for(const zone of ['west','east'])s.watchZones[zone]=clamp(s.watchZones[zone]+change,0,6);
    s.alert=clamp(s.alert+change*20,0,100);
  }
  if(['fast','invisible','fast_take','slow','slow_take','trail'].includes(effect)){
    s.effects[effect]=effect==='trail'?14:16;
  }
  increaseSecurity(s);
  s.message=`${SPECIAL_NAME} mangiata: ${effect}. Hai ${s.chocolate} cioccolate.`;
  return effect;
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
    guard.pathTargetX=target.x;guard.pathTargetZ=target.z;
    guard.repath=guard.mode==='chase'||guard.mode==='respond'?.6:1.25;
  }
  // Do not cut grid corners: at shelf edges a 13 cm shortcut clips the guard radius.
  while(guard.path.length&&Math.hypot(guard.path[0].x-guard.x,guard.path[0].z-guard.z)<.015)guard.path.shift();
  const point=guard.path[0]||target;
  const dx=point.x-guard.x,dz=point.z-guard.z,distance=Math.hypot(dx,dz);
  guard.moving=false;
  if(distance<.01)return;
  const step=Math.min(distance,speed*dt),nx=guard.x+dx/distance*step,nz=guard.z+dz/distance*step;
  if(collides(nx,nz)){guard.repath=0;return;}
  guard.x=nx;guard.z=nz;guard.angle=Math.atan2(dz,dx);
  guard.stride+=step*(guard.mode==='chase'?7:5);guard.moving=true;
}
function patrolRandom(guard){
  guard.patrolSeed=(Math.imul(guard.patrolSeed,1664525)+1013904223)>>>0;
  return guard.patrolSeed/4294967296;
}
function patrolGuard(guard,watch,dt,s) {
  if(guard.baseSpeed===0){guard.moving=false;return;}
  guard.patrolTimer=(guard.patrolTimer??0)-dt;
  if(!guard.patrolTarget||guard.patrolTimer<=0||
      Math.hypot(guard.x-guard.patrolTarget.x,guard.z-guard.patrolTarget.z)<.3){
    guard.patrolTarget=null;
    const hotspot=s.hotspot&&s.time<s.hotspot.until?s.hotspot:null;
    const nearby=hotspot&&patrolRandom(guard)<.6?
      PATROL_POINTS.filter(point=>Math.hypot(point.x-hotspot.x,point.z-hotspot.z)<5):[];
    const local=PATROL_POINTS.filter(point=>Math.hypot(point.x-guard.x,point.z-guard.z)<14);
    const pool=nearby.length?nearby:local.length?local:PATROL_POINTS;
    for(let attempt=0;attempt<8;attempt++){
      const point=pool[Math.floor(patrolRandom(guard)*pool.length)];
      if(routeAroundCover(guard,point).length){guard.patrolTarget=point;break;}
    }
    guard.patrolTimer=12+patrolRandom(guard)*9;
    guard.path=null;
  }
  if(guard.patrolTarget)moveGuard(guard,guard.patrolTarget,dt,guard.baseSpeed+watch*.13);
  else guard.moving=false;
}
function assignResponders(s,source) {
  if(!s.guards.length)addGuard(s); // An early CCTV alarm summons the first patrol.
  const ranked=s.guards.map((guard,index)=>({index,distance:Math.hypot(guard.x-s.player.x,guard.z-s.player.z)}))
    .sort((a,b)=>a.distance-b.distance);
  const first=source.type==='guard'?source.index:ranked[0]?.index;
  const second=ranked.find(item=>item.index!==first)?.index;
  s.security.responders=[first,second].filter(index=>index!==undefined);
  for(const index of s.security.responders){
    const guard=s.guards[index];guard.mode='respond';guard.path=null;guard.repath=0;
    guard.exclamationTime=2;
  }
}
function startAlarm(s,source,reason='theft') {
  const previous=s.pickups.find(p=>p.id===s.takeId);
  if(previous)s.watchZones[previous.zone]=Math.min(6,s.watchZones[previous.zone]+1);
  s.security={mode:'alert',source:source.type,sourceIndex:source.index??null,
    timer:.75,lostTime:0,lastKnown:{x:s.player.x,z:s.player.z},responders:[]};
  assignResponders(s,source);
  s.message=reason==='run'?'⚠ POLICIE ha sentito lo scatto vicino a sé!':
    reason==='fat'?'⚠ POLICIE ha visto le cioccolate nascoste addosso a Ipno!':
    reason==='trail'?'⚠ POLICIE ha seguito le macchie fino a Ipno!':
    source.type==='camera'?'⚠ CCTV ha visto il prelievo: POLICIE in arrivo!':
    '⚠ POLICIE ha visto il prelievo: scappa e usa gli scaffali!';
  if(previous?.status==='taking')previous.status='available';
  s.taking=false;s.takeTime=0;s.takeId=null;
}
function visibleWitness(s) {
  if(s.effects.invisible>0)return null;
  const index=s.guards.findIndex(guard=>guardSight(guard,s.player,{crouch:s.player.crouched}));
  if(index>=0)return {type:'guard',index,tier:guardSight(s.guards[index],s.player,{crouch:s.player.crouched})};
  const cameraIndex=s.cameras.findIndex(camera=>canSee(camera,s.player));
  if(cameraIndex>=0)return {type:'camera',index:cameraIndex};
  return null;
}
function visibleStain(guard,stains) {
  return stains.filter(stain=>stain.order>(guard.lastStainOrder??-1)&&canSee(guard,stain))
    .sort((a,b)=>a.order-b.order)[0]||null;
}
export function takeDuration(s) {
  return TAKE_SECONDS*(s.effects.fast_take>0?.62:1)*(s.effects.slow_take>0?1.6:1);
}
export function initialScene(seed = Math.floor(Math.random()*0xffffffff)) {
  const s={
    phase:'playing',time:0,message:'Prendi quante cioccolate riesci. Esci quando vuoi: ogni pezzo vale 1 Kč.',
    seed,player:{x:.25,z:6.2,facing:-Math.PI/2,stride:0,moving:false,crouched:false,sprinting:false},guards:[],cameras:[],
    pickups:selectPickups(seed),pickupVersion:0,visible:false,taking:false,takeTime:0,takeId:null,takeLatch:false,collected:[],chocolate:0,alert:0,
    security:{mode:'routine',source:null,sourceIndex:null,timer:0,lostTime:0,lastKnown:null,responders:[]},
    watchZones:{west:0,east:0},notificationTime:0,
    effects:{fast:0,invisible:0,fast_take:0,slow:0,slow_take:0,trail:0},
    special:null,specialOffer:null,normalStolen:0,effectRoll:0,
    refillSeed:(seed^0xa53a9e11)>>>0,specialSeed:(seed^0x65ccfb2f)>>>0,recentShelves:[],hotspot:null,
    stains:[],stainOrder:0,lastStainAt:-1
  };addCamera(s);return s;
}
export function updateScene(s, input, delta) {
  if (s.phase !== 'playing') return s;
  const dt = clamp(Number.isFinite(delta) ? delta : 0, 0, .05);
  if(s.specialOffer){
    if(s.specialOffer.stage==='eaten'){
      s.specialOffer.timer-=dt;
      if(s.specialOffer.timer<=0)s.specialOffer=null;
    }
    return s;
  }
  if(!input.take)s.takeLatch=false;
  s.time += dt;
  for(const effect of Object.keys(s.effects))s.effects[effect]=Math.max(0,s.effects[effect]-dt);
  s.stains=s.stains.filter(stain=>s.time-stain.time<18);
  const m = Math.hypot(input.x || 0, input.z || 0);
  s.player.crouched=!!input.crouch;
  s.player.sprinting=!!input.sprint&&!s.player.crouched&&m>.05;
  s.player.moving = false;
  if (m > .001 && !s.taking) {
    const startX = s.player.x, startZ = s.player.z;
    const speed=(s.player.crouched?1.45:s.player.sprinting?4.35:2.7)*
      (s.effects.fast>0?1.4:1)*(s.effects.slow>0?.62:1);
    const dx = ((input.x||0) / Math.max(1, m)) * speed * dt;
    const dz = ((input.z||0) / Math.max(1, m)) * speed * dt;
    if (!collides(s.player.x + dx, s.player.z)) s.player.x += dx;
    if (!collides(s.player.x, s.player.z + dz)) s.player.z += dz;
    const travel = Math.hypot(s.player.x - startX, s.player.z - startZ);
    s.player.moving = travel > .001;
    if (s.player.moving) {
      s.player.facing = Math.atan2(s.player.z - startZ, s.player.x - startX);
      s.player.stride += travel * (s.player.crouched ? 5.4 :s.player.sprinting?7:4.8);
    }
  }
  if(s.effects.trail>0&&s.player.moving&&s.time-s.lastStainAt>=.55){
    s.stains.push({x:s.player.x,z:s.player.z,time:s.time,order:++s.stainOrder});
    s.lastStainAt=s.time;
    if(s.stains.length>30)s.stains.shift();
  }
  for (const guard of s.guards) {
    guard.exclamationTime=Math.max(0,guard.exclamationTime-dt);
    const watch = s.watchZones[guard.zone];
    if(guard.mode==='patrol')patrolGuard(guard,watch,dt,s);
    else if(guard.mode==='inspect'){
      moveGuard(guard,guard.inspectTarget,dt,1.35);
      if(Math.hypot(guard.x-guard.inspectTarget.x,guard.z-guard.inspectTarget.z)<.55){
        guard.inspectTimer-=dt;
        if(guard.inspectTimer<=0){guard.mode='return';guard.path=null;}
      }
    }else if(guard.mode==='respond'||guard.mode==='chase'){
      moveGuard(guard,s.security.lastKnown,dt,guard.mode==='chase'?2.2:1.75);
    }else if(guard.mode==='track'){
      guard.trackTimer-=dt;
      const newer=visibleStain(guard,s.stains);
      if(newer){guard.trackTarget={x:newer.x,z:newer.z};guard.lastStainOrder=newer.order;}
      if(guard.trackTarget)moveGuard(guard,guard.trackTarget,dt,1.55);
      if(guard.trackTimer<=0){guard.mode='return';guard.path=null;}
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
  s.cameras.forEach((camera,index)=>{camera.angle=camera.baseAngle+
    Math.sin(s.time*(.7+s.watchZones[index%2?'west':'east']*.25)+index*1.7)*.57;});
  const witness=visibleWitness(s);
  s.visible=!!witness;
  const suspicionFloor=Math.min(60,(s.watchZones.west+s.watchZones.east)*5);
  s.alert = clamp(Math.max(suspicionFloor,s.alert +
    (s.visible && m > .05 && !s.player.crouched ? 6 : -2.5) * dt),0,100);
  s.notificationTime = Math.max(0, s.notificationTime - dt);
  const security=s.security;
  if(security.mode==='routine'||security.mode==='routine_increased'){
    const close=s.guards.findIndex(guard=>
      s.player.sprinting&&s.player.moving&&Math.hypot(guard.x-s.player.x,guard.z-s.player.z)<=GUARD_HEARING_RANGE);
    const overloaded=s.chocolate>=15&&witness?.type==='guard'&&witness.tier==='near'?witness.index:-1;
    const trail=s.guards.findIndex(guard=>guard.mode==='track'&&
      Math.hypot(guard.x-s.player.x,guard.z-s.player.z)<1.3);
    if(close>=0){startAlarm(s,{type:'guard',index:close},'run');return s;}
    if(overloaded>=0){startAlarm(s,{type:'guard',index:overloaded},'fat');return s;}
    if(trail>=0){startAlarm(s,{type:'guard',index:trail},'trail');return s;}
    for(const guard of s.guards){
      if(guard.mode!=='patrol'&&guard.mode!=='return')continue;
      const stain=visibleStain(guard,s.stains);
      if(stain){guard.mode='track';guard.trackTarget={x:stain.x,z:stain.z};
        guard.lastStainOrder=stain.order;guard.trackTimer=9;guard.path=null;}
    }
  }
  if(security.mode==='alert'||security.mode==='pursuit'||security.mode==='searching'){
    if(witness){security.lastKnown={x:s.player.x,z:s.player.z};security.lostTime=0;}
    else security.lostTime+=dt;
    if(security.mode==='alert'){
      security.timer-=dt;
      if(security.timer<=0){security.mode='pursuit';for(const index of security.responders)s.guards[index].mode='chase';}
    }else if(security.mode==='pursuit'&&security.lostTime>1.15){
      security.mode='searching';security.timer=14.5;
      security.responders.forEach((index,order)=>{
        const guard=s.guards[index];guard.mode='search';guard.path=null;
        guard.searchTarget=order===0?security.lastKnown:
          {x:security.lastKnown.x+.75,z:security.lastKnown.z+.75};
      });
      s.message='POLICIE cerca Ipno nell’ultima posizione nota. Resta coperto!';
    }else if(security.mode==='searching'){
      if(witness){security.mode='pursuit';security.lostTime=0;
        for(const index of security.responders){s.guards[index].mode='chase';s.guards[index].path=null;}
        if(witness.type==='guard')s.guards[witness.index].exclamationTime=2;
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
  const special=nearestSpecial(s);
  const lockdown=security.mode==='alert'||security.mode==='pursuit'||security.mode==='searching';
  if(input.take&&!s.takeLatch&&pickup&&lockdown){
    s.message='POLICIE ti cerca: lascia il ripiano e nasconditi.';
  }else if(input.take&&!s.takeLatch&&special&&!lockdown){
    s.specialOffer={stage:'found',name:s.special.name};s.special=null;
    s.message=`Hai trovato ${SPECIAL_NAME}: vuoi rischiare e mangiarla?`;
    s.taking=false;s.takeTime=0;s.takeId=null;s.takeLatch=true;
    return s;
  }else if (input.take && !s.takeLatch && pickup) {
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
      s.message = `Prelievo ${s.chocolate+1} in corso… resta nascosto.`;
      if (s.takeTime >= takeDuration(s)) {
        pickup.status='collected';s.collected.push(pickup.id);s.chocolate++;
        s.taking = false; s.takeTime = 0; s.takeId = null;s.takeLatch=true;
        refillPickup(s,pickup);
        s.normalStolen++;
        const specialSpawned=maybeSpawnSpecial(s);
        increaseSecurity(s);
        s.watchZones[pickup.zone] = Math.min(6, s.watchZones[pickup.zone] + 1);
        s.hotspot={x:pickup.x,z:pickup.z,until:s.time+24};
        if(security.mode==='routine'||security.mode==='routine_increased'){
          security.mode='routine_increased';
          const guard=s.guards.filter(g=>g.zone===pickup.zone&&!['respond','chase','search'].includes(g.mode))
            .sort((a,b)=>Math.hypot(a.x-pickup.x,a.z-pickup.z)-Math.hypot(b.x-pickup.x,b.z-pickup.z))[0];
          if(guard){guard.mode='inspect';guard.inspectTarget={x:pickup.x,z:pickup.z};guard.inspectTimer=3;
            guard.path=null;guard.repath=0;}
        }
        s.message = `Cioccolata ${s.chocolate} presa. Ora ${s.cameras.length} CCTV e ${s.guards.length} POLICIE: esci o rischia ancora.`+
          (specialSpawned?' ✨ Ciokospira comparsa: cerca la stella viola sulla minimappa!':'');
        s.notificationTime = 4;
      }
    }
  } else {
    const previous=s.pickups.find(p=>p.id===s.takeId);
    if(previous?.status==='taking')previous.status='available';
    s.taking = false; s.takeTime = 0; s.takeId = null;
  }
  if (Math.hypot(s.player.x - EXIT.x, s.player.z - EXIT.z) <= EXIT.reach) {
    s.phase = 'escaped'; s.message = `Fuori con ${s.chocolate} cioccolate!`;
  }
  return s;
}
