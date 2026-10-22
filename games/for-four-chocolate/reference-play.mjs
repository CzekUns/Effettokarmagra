import * as THREE from './vendor/three/three.module.js';
import { initialScene, updateScene, rayDistance, nearestPickup, shelfBlocksCamera, coverBlocksCamera, SHELVES, PARTITIONS, LIMITS, EXIT, TAKE_SECONDS, crowns, FINE } from './reference-play-logic.mjs?v=6';
import { createCameraRig, cameraRelativeMovement, orbitCamera, zoomCamera, centerCamera, updateCameraRig } from './reference-camera.mjs?v=6';
import { spriteView, animationPose } from './reference-sprites.mjs';
import { createFinale, advanceFinale, nextFinaleStep, skipFinale, finaleSubtitle } from './reference-finale-logic.mjs?v=7';
import { createFinaleScene } from './reference-finale-scene.mjs?v=8';
import { buildWhatsAppShareUrl } from './reference-share.mjs?v=7';
import { createAudioController } from './reference-audio.mjs?v=2';

const host = document.querySelector('#world');
const game=document.querySelector('.game');
const startScreen=document.querySelector('#start-screen'),startAction=document.querySelector('#start-action');
const musicButton=document.querySelector('#music-toggle');
let started=false;
let audioStorage=null;
try{audioStorage=localStorage;}catch{}
const audio=createAudioController({music:new Audio('./assets/audio/for-four-chocolate.mp3'),
  createContext:()=>{const Context=window.AudioContext||window.webkitAudioContext;return Context?new Context():null;},
  storage:audioStorage});
function syncMusicButton(){musicButton.textContent=audio.label;
  musicButton.setAttribute('aria-label',audio.state.muted?'Attiva musica ed effetti':'Disattiva musica ed effetti');}
syncMusicButton();
musicButton.addEventListener('click',()=>{audio.toggleMute();syncMusicButton();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){audio.hide();syncMusicButton();}});
addEventListener('blur',()=>{audio.hide();syncMusicButton();});
const ui = {
  loot: document.querySelector('#loot'), score: document.querySelector('#score'), best: document.querySelector('#best'),
  mission: document.querySelector('#mission'), watch: document.querySelector('#watch'),
  interaction: document.querySelector('#interaction'), progress: document.querySelector('#progress'),
  result: document.querySelector('#result'), title: document.querySelector('#result-title'),
  kicker: document.querySelector('#result-kicker'), text: document.querySelector('#result-text'),
  finale: document.querySelector('#finale'), finaleStage: document.querySelector('#finale-stage'),
  finaleSpoken: document.querySelector('#finale-spoken'), finaleTranslation: document.querySelector('#finale-translation'),
  radarPlayer: document.querySelector('#radar-player'), radarGuards: [], radarCameras: []
};
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'default' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, matchMedia('(pointer: coarse)').matches ? 1 : 1.4));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.3;
  renderer.shadowMap.enabled = false;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  host.append(renderer.domElement);
} catch (error) {
  document.querySelector('#webgl-error').hidden = false;
  throw error;
}
const scene = new THREE.Scene(); scene.background = new THREE.Color('#171420');
scene.fog = new THREE.Fog('#171420', 17, 35);
const camera = new THREE.PerspectiveCamera(36, 1, .1, 65);
camera.position.set(6.2, 8.7, 10.8); camera.lookAt(1, .8, .8);
const hemi = new THREE.HemisphereLight('#a9cfff', '#59313c', 1.45); scene.add(hemi);
const key = new THREE.DirectionalLight('#ffbd7c', 2.35); key.position.set(-4, 10, 7);
key.castShadow = renderer.shadowMap.enabled; key.shadow.mapSize.set(1024, 1024);
key.shadow.camera.left = -9; key.shadow.camera.right = 9; key.shadow.camera.top = 9; key.shadow.camera.bottom = -9;
key.shadow.bias = -.00035; scene.add(key);
const fridgeLight = new THREE.PointLight('#70dfff', 22, 14, 2); fridgeLight.position.set(0, 2, -8.4); scene.add(fridgeLight);
const warmLight = new THREE.PointLight('#ffa25d', 18, 12, 2); warmLight.position.set(-6, 3.3, 2.2); scene.add(warmLight);
const aisleLight = new THREE.PointLight('#ffd9a9', 14, 13, 2); aisleLight.position.set(6,3.3,-2.4); scene.add(aisleLight);

const loader = new THREE.TextureLoader();
function load(path) { return new Promise((resolve, reject) => loader.load(path, t => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy()); resolve(t); }, undefined, reject)); }
const [ipnoTexture, ipnoTakeTexture, ipnoBackTexture, ipnoSideTexture,
  guardTexture, guardBackTexture, guardSideTexture, customerTexture, customerBackTexture, customerSideTexture,
  fridgeTexture, chocolateTexture, floorTexture] = await Promise.all([
  './assets/reference-play/ipno.webp', './assets/reference-play/ipno-take.webp',
  './assets/reference-play/ipno-back.webp', './assets/reference-play/ipno-side.webp', './assets/reference-play/policie.webp',
  './assets/reference-play/policie-back.webp', './assets/reference-play/policie-side.webp',
  './assets/reference-play/customer.webp', './assets/reference-play/customer-back.webp', './assets/reference-play/customer-side.webp',
  './assets/reference-play/fridge.webp', './assets/reference-play/chocolate-shelf.webp',
  './assets/reference-play/floor.webp'
].map(load));
const animationNames = [
  ...['front','back','left','right'].map(direction => `ipno-walk-${direction}`),
  ...['front','back','right'].map(direction => `ipno-crouch-${direction}`),
  'ipno-take-back','ipno-take-right','policie-idle-left',
  ...['walk','run'].flatMap(action => ['front','back','left','right'].map(direction => `policie-${action}-${direction}`))
];
const animationTextures = Object.fromEntries(await Promise.all(animationNames.map(async name =>
  [name, await load(`./assets/reference-play/${name}.webp`)])));
const [capelloneTexture,capelloneGroupTexture,facadeTexture,cobbleTexture,...crowdTextures]=await Promise.all([
  ...['capellone-finale','capellone-group','praha-day-facade','praha-day-cobblestone',
    'friend-left','friend-red','friend-tan','friend-green'].map(name=>load(`./assets/reference-play/${name}.webp`))]);
floorTexture.wrapS = THREE.RepeatWrapping; floorTexture.wrapT = THREE.RepeatWrapping;
floorTexture.repeat.set(4, 4);
const cache = new Map();
function material(color, roughness = .72, metalness = 0) {
  const id = `${color}:${roughness}:${metalness}`;
  if (!cache.has(id)) cache.set(id, new THREE.MeshStandardMaterial({ color, roughness, metalness }));
  return cache.get(id);
}
function box(parent, w, h, d, color, x, y, z, options = {}) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material(color, options.roughness ?? .72, options.metalness ?? 0));
  mesh.position.set(x, y, z); mesh.castShadow = options.cast !== false; mesh.receiveShadow = true; parent.add(mesh); return mesh;
}
function plane(parent, width, height, texture, x, y, z, rotationY = 0, options = {}) {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), new THREE.MeshBasicMaterial({ map: texture, transparent: options.transparent || false, depthWrite: !options.transparent, side: THREE.DoubleSide, toneMapped: options.toneMapped ?? true }));
  mesh.position.set(x, y, z); mesh.rotation.y = rotationY; parent.add(mesh); return mesh;
}
function sign(text, width, height, background, color = '#f8edf0') {
  const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 128;
  const c = canvas.getContext('2d'); c.fillStyle = background; c.fillRect(0, 0, 512, 128);
  c.fillStyle = color; c.font = '900 54px Arial'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, 256, 64, 485);
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
function disc(parent, radius, color, opacity, x, z) {
  const mesh = new THREE.Mesh(new THREE.CircleGeometry(radius, 32), new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false, side: THREE.DoubleSide }));
  mesh.rotation.x = -Math.PI / 2; mesh.position.set(x, .012, z); parent.add(mesh); return mesh;
}
function buildRoom() {
  box(scene, 22.3, .24, 20.3, '#665d60', 0, -.19, 0, { roughness: .28, metalness: .11, cast: false });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(22.3, 20.3), new THREE.MeshStandardMaterial({ map:floorTexture, color:'#b6a3a2', roughness:.65, metalness:.04 }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -.055; floor.receiveShadow = true; scene.add(floor);
  box(scene, 22.3, 3.6, .22, '#292b3d', 0, 1.75, -9.94);
  box(scene, .22, 3.6, 20.3, '#252536', -10.94, 1.75, 0);
  box(scene, .22, 1.15, 20.3, '#292a3b', 10.94, .5, 0);
  box(scene, 22.3, .2, .28, '#111524', 0, 3.58, -9.94);
  box(scene, .27, .18, 20.3, '#111524', -10.94, 3.58, 0);
  for (const [x,z,color,opacity,radius] of [[-7,-3,'#ff9d56',.17,3],[-1,-4,'#63e5ff',.2,3],[6,3,'#ff9654',.13,2.5],[5,-5,'#63e5ff',.16,2.6]]) disc(scene,radius,color,opacity,x,z);
  for (const x of [-8,-3,2,7]) {
    box(scene, .12, .08, 5.2, '#ffe4bb', x, 3.48, -2.9, { cast:false });
    box(scene, .42, .02, 5.2, '#c59566', x, 3.53, -2.9, { cast:false });
  }
  // The exit is at the rear, as in the approved reference.
  box(scene, 1.42, 3.05, .16, '#1b3136', 9.6, 1.52, -9.73);
  box(scene, 1.18, 2.75, .04, '#b6a76c', 9.6, 1.41, -9.62, { roughness:.24,metalness:.24 });
  plane(scene, 1.65, .38, sign('VÝCHOD  ↗', 1.65, .38, '#257969'), 9.6, 3.23, -9.59);
  const crates = [['#962b58',-9.4,3.4],['#d9813d',-8.85,3.4],['#455b9a',-8.3,3.4],['#c34f42',-9.1,4],['#9257aa',-8.5,4]];
  for (const [color,x,z] of crates) {
    box(scene,.46,.44,.46,'#836348',x,.22,z,{roughness:.9});
    for(let j=0;j<3;j++) box(scene,.12,.26,.31,color,x-.13+j*.13,.55,z,{cast:false});
  }
  for(const [x,z] of [[-9.55,7.7],[-9.5,7.05],[9.5,4.1],[9.3,5.35]]) {
    box(scene,.65,.12,.65,'#51334b',x,.1,z,{roughness:.55});
    for(let i=0;i<3;i++) box(scene,.16,.5,.38,['#dd3c64','#d48a34','#6444a7'][i],x-.2+i*.2,.42,z,{roughness:.46,cast:false});
  }
  // Baskets and a trolley make the playable slice feel inhabited.
  const cart=new THREE.Group();scene.add(cart);cart.position.set(9.3,0,5.8);
  box(cart,.82,.08,.49,'#748b9a',0,.6,0,{roughness:.28,metalness:.65});
  for(const side of [-1,1]) {
    box(cart,.035,.52,.55,'#7899a6',side*.4,.8,0,{roughness:.25,metalness:.7});
    box(cart,.07,.42,.05,'#80919d',side*.32,.3,-.22,{roughness:.25,metalness:.7});
    for(const z of [-.22,.22]) {
      const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.08,.08,.06,10),material('#161b25',.9));
      wheel.rotation.z=Math.PI/2;wheel.position.set(side*.33,.1,z);cart.add(wheel);
    }
  }
  box(cart,.82,.04,.05,'#c4aeb0',0,1.1,-.24,{roughness:.3,metalness:.5});
}
buildRoom();

function makeFridgeRow(back = true, shiftX = 0, shiftZ = 0, scaleZ = 1) {
  const group = new THREE.Group(); scene.add(group);
  if (back) {
    box(group, 8.85, 2.98, .67, '#15202d', -.25, 1.49, -4.95, { roughness:.28, metalness:.55 });
    plane(group, 8.53, 2.65, fridgeTexture, -.25, 1.53, -4.57, 0, { toneMapped:false });
    for (let i=0;i<=5;i++) {
      const x = -4.55 + i * 1.72;
      box(group, .065, 2.78, .12, '#526e83', x, 1.53, -4.47, { roughness:.25, metalness:.65 });
      if (i<5) box(group, .035, .56, .11, '#b2d3da', x+1.3, 1.55, -4.39, { cast:false });
    }
    box(group, 8.7, .09, .25, '#46d3f1', -.25, 2.92, -4.38, { cast:false });
    plane(group, 3.35, .38, sign('MLÉČNÉ VÝROBKY', 3.35, .38, '#204e7b'), 1.2, 3.2, -4.37);
  } else {
    box(group, .68, 2.8, 6.4, '#17232e', -5.29, 1.4, -.9, { roughness:.3, metalness:.48 });
    plane(group, 6.14, 2.53, fridgeTexture, -4.9, 1.45, -.9, Math.PI/2, { toneMapped:false });
    for (let i=0;i<=4;i++) box(group, .12, 2.65, .065, '#4a7186', -4.82, 1.46, -3.95+i*1.52, { roughness:.22, metalness:.7 });
    box(group, .2, .075, 6.4, '#43d4ef', -4.8, 2.77, -.9, { cast:false });
    const label = plane(group, 2.7, .4, sign('NÁPOJE',2.7,.4,'#225f83'), -4.77, 3.08, -.9, Math.PI/2);
    label.material.depthWrite = false;
  }
  group.scale.z=scaleZ;group.position.set(shiftX,0,shiftZ);
}
makeFridgeRow(true,-4.75,-4.65);
makeFridgeRow(true,3.5,-4.65);
makeFridgeRow(false,-5.3,-2.1,1.6);

function makeFadeable(group) {
  const cloned=new Map(),materials=[];
  group.traverse(object=>{
    if(!object.isMesh)return;
    if(!cloned.has(object.material)){const copy=object.material.clone();cloned.set(object.material,copy);materials.push(copy);}
    object.material=cloned.get(object.material);
  });
  group.userData.materials=materials;
  return group;
}
function setFaded(group,faded) {
  if(group.userData.faded===faded)return;
  group.userData.faded=faded;
  for(const material of group.userData.materials){
    material.transparent=faded;material.opacity=faded?.28:1;
    material.depthWrite=!faded;material.needsUpdate=true;
  }
}
function makeAisle(shelf) {
  const {x,z,length,kind,label}=shelf;
  const chocolate=kind==='chocolate';
  const group = new THREE.Group(); scene.add(group);
  const width = 1.2, height = kind==='checkout' ? 1.5 : chocolate ? 2.5 : 2.42;
  box(group,width,height,length,'#252337',x,height/2,z,{roughness:.46,metalness:.18});
  const image = chocolate ? chocolateTexture : fridgeTexture;
  plane(group,length-.12,height-.18,image,x+width/2+.01,height/2,z,Math.PI/2,{toneMapped:!chocolate});
  plane(group,length-.12,height-.18,image,x-width/2-.01,height/2,z,-Math.PI/2,{toneMapped:!chocolate});
  box(group,width+.16,.14,length+.14,'#1c2334',x,height+.07,z,{roughness:.34,metalness:.32});
  for (const end of [-1,1]) {
    const zz=z+end*length/2;
    box(group,width+.11,.23,.08,'#493453',x,height+.02,zz);
    plane(group,width+.01,.44,sign(label,width,.44,chocolate?'#a52d63':'#d27637'),x,height+.03,zz+end*.049,end<0?Math.PI:0);
    plane(group,width-.07,height-.38,image,x,height/2,zz+end*.055,end<0?Math.PI:0,{toneMapped:!chocolate});
  }
  const colors=chocolate?['#8f306a','#e7a12f','#5b48ac','#c83947']:['#3577b3','#e89034','#a0458a','#58b3c4'];
  for(let i=0;i<12;i++) {
    const zz=z-length/2+.38+(i%6)*((length-.7)/6);
    box(group,.22,.14,.34,colors[i%4],x+(i<6?-.27:.27),height+.18,zz,{roughness:.4,cast:false});
  }
  const trims={chocolate:'#ed649e',food:'#e2bb64',drinks:'#65cfe6',checkout:'#75d2ac'};
  for(const side of [-1,1])box(group,.07,.08,length+.18,trims[kind],x+side*.63,height+.18,z,{cast:false});
  return makeFadeable(group);
}
const aisles=SHELVES.map(makeAisle);
const partitions=PARTITIONS.map((divider,index)=>{
  const group=new THREE.Group();scene.add(group);
  const width=divider.maxX-divider.minX,depth=divider.maxZ-divider.minZ;
  const x=(divider.minX+divider.maxX)/2,z=(divider.minZ+divider.maxZ)/2;
  box(group,width,divider.height,depth,'#60405d',x,divider.height/2,z);
  box(group,width+.05,.08,depth+.05,'#e99d68',x,divider.height+.04,z,{cast:false});
  const image=index%2?fridgeTexture:chocolateTexture;
  if(width>depth){
    plane(group,width-.06,divider.height-.13,image,x,divider.height/2,z+depth/2+.012,0,{toneMapped:false});
    plane(group,width-.06,divider.height-.13,image,x,divider.height/2,z-depth/2-.012,Math.PI,{toneMapped:false});
  }else{
    plane(group,depth-.06,divider.height-.13,image,x+width/2+.012,divider.height/2,z,Math.PI/2,{toneMapped:false});
    plane(group,depth-.06,divider.height-.13,image,x-width/2-.012,divider.height/2,z,-Math.PI/2,{toneMapped:false});
  }
  return makeFadeable(group);
});
function updateShelfOcclusion() {
  SHELVES.forEach((shelf,index)=>{
    setFaded(aisles[index],shelfBlocksCamera(shelf,camera,state.player));
  });
  PARTITIONS.forEach((bounds,index)=>setFaded(partitions[index],
    coverBlocksCamera(bounds,bounds.height,camera,state.player)));
}
let state=initialScene();
const radar=document.querySelector('.radar');
for(const old of radar.querySelectorAll('.shelf,.radar-guard'))old.remove();
for(const shelf of SHELVES){
  const marker=document.createElement('i');marker.className='shelf';
  marker.title=shelf.label;
  marker.style.left=`${(shelf.x-.6-LIMITS.minX)/(LIMITS.maxX-LIMITS.minX)*100}%`;
  marker.style.top=`${(shelf.z-shelf.length/2-LIMITS.minZ)/(LIMITS.maxZ-LIMITS.minZ)*100}%`;
  marker.style.width=`${1.2/(LIMITS.maxX-LIMITS.minX)*100}%`;
  marker.style.height=`${shelf.length/(LIMITS.maxZ-LIMITS.minZ)*100}%`;
  marker.style.background={chocolate:'#ce5d9a',food:'#e2bb64',drinks:'#65cfe6',checkout:'#75d2ac'}[shelf.kind];
  radar.append(marker);
}
for(const divider of PARTITIONS){
  const marker=document.createElement('i');marker.className='shelf';
  marker.style.left=`${(divider.minX-LIMITS.minX)/(LIMITS.maxX-LIMITS.minX)*100}%`;
  marker.style.top=`${(divider.minZ-LIMITS.minZ)/(LIMITS.maxZ-LIMITS.minZ)*100}%`;
  marker.style.width=`${(divider.maxX-divider.minX)/(LIMITS.maxX-LIMITS.minX)*100}%`;
  marker.style.height=`${(divider.maxZ-divider.minZ)/(LIMITS.maxZ-LIMITS.minZ)*100}%`;
  radar.append(marker);
}
const exitMarker=document.createElement('i');exitMarker.className='exit-marker';
exitMarker.style.left=`${(EXIT.x-LIMITS.minX)/(LIMITS.maxX-LIMITS.minX)*100}%`;
exitMarker.style.top=`${(EXIT.z-LIMITS.minZ)/(LIMITS.maxZ-LIMITS.minZ)*100}%`;
radar.append(exitMarker);
const lastKnownMarker=document.createElement('i');lastKnownMarker.className='last-known-marker';radar.append(lastKnownMarker);
for(const old of radar.querySelectorAll('.radar-camera'))old.remove();
// Packages remain on the shelf; subtle floor light marks their interaction side.
let bars=[];
function buildPickupBars() {
  for(const {bar,glow} of bars){
    scene.remove(bar);scene.remove(glow);
    bar.traverse(object=>{if(object.isMesh)object.geometry.dispose();});
    glow.geometry.dispose();glow.material.dispose();
  }
  bars=state.pickups.map((spot,index)=>{
    const bar=new THREE.Group();scene.add(bar);
    box(bar,.11,.26,.4,['#e8a528','#a33dd4','#e4b84b','#b73655'][index%4],spot.shelfX,1.18,spot.z,{roughness:.25,metalness:.2});
    box(bar,.02,.21,.29,'#b42569',spot.shelfX+(spot.side<0?-.064:.064),1.18,spot.z,{roughness:.3});
    const glow=disc(scene,.26,'#e745b2',.15,spot.x,spot.z);
    return {bar,glow};
  });
}
buildPickupBars();let shownPickupVersion=state.pickupVersion;
const exitGlow = disc(scene,.6,'#64f8bd',.24,EXIT.x,EXIT.z);

// Camera rig and floor projections share exactly the same observer geometry as the rules.
function cctvVisual(eye){
  const rig=new THREE.Group();scene.add(rig);rig.position.set(eye.x,0,eye.z);
  box(rig,.12,3.18,.12,'#404e5d',0,1.59,0,{roughness:.3,metalness:.6});
  box(rig,.55,.09,.1,'#748a9b',-.22,3.12,0,{roughness:.22,metalness:.65});
  const head=new THREE.Group();head.position.set(-.48,3.1,0);rig.add(head);
  box(head,.45,.22,.25,'#202b3a',0,0,0,{roughness:.27,metalness:.5});
  box(head,.035,.14,.15,'#9ee4f6',-.24,0,0,{cast:false});
  box(head,.09,.06,.08,'#fa493c',.1,.15,0,{cast:false});
  const light=new THREE.PointLight('#e9524c',2.8,3.5);light.position.set(eye.x,3,eye.z);scene.add(light);
  const cone=vision('#f35556',.49);
  const dot=document.createElement('i');dot.className='radar-camera dot camera';radar.append(dot);
  return {rig,head,light,cone,dot};
}

function figure(texture, height) {
  const group = new THREE.Group(); scene.add(group);
  const image = new THREE.Mesh(new THREE.PlaneGeometry(height * 1024 / 1536,height),new THREE.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,side:THREE.DoubleSide,toneMapped:false}));
  image.position.y=height/2; image.renderOrder=5; group.add(image);
  const shadow=disc(scene,.38,'#15101a',.4,0,0);
  return {group,image,shadow};
}
const player=figure(ipnoTexture,1.92), guards=[], customer=figure(customerTexture,1.8);
const finaleVisual=createFinaleScene({ipnoTexture,ipnoBackTexture,guardTexture,guardBackTexture,
  capelloneTexture,capelloneGroupTexture,
  facadeTexture,cobbleTexture,crowdTextures});
let finale=null,finalResult=null;
function orientFigure(actor, worldX, worldZ, stride, moving = false) {
  actor.group.position.set(worldX,moving?Math.abs(Math.sin(stride))*.028:0,worldZ);
  actor.group.rotation.y=Math.atan2(camera.position.x-worldX,camera.position.z-worldZ);
  actor.shadow.position.set(worldX,.015,worldZ);
}
function vision(color,opacity) {
  const points=new Float32Array(30*9);
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(points,3));
  const mesh=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({color,transparent:true,opacity,depthWrite:false,side:THREE.DoubleSide}));
  mesh.renderOrder=2;scene.add(mesh);return mesh;
}
const guardVisions=[],cctvs=[];
const alertCanvas=document.createElement('canvas');alertCanvas.width=128;alertCanvas.height=128;
const alertContext=alertCanvas.getContext('2d');alertContext.font='900 105px Arial';
alertContext.textAlign='center';alertContext.textBaseline='middle';alertContext.lineWidth=12;
alertContext.strokeStyle='#701723';alertContext.strokeText('!',64,65);
alertContext.fillStyle='#ffe171';alertContext.fillText('!',64,65);
const alertTexture=new THREE.CanvasTexture(alertCanvas);alertTexture.colorSpace=THREE.SRGBColorSpace;
function syncSecurityVisuals(){
  while(guards.length<state.guards.length){
    const actor=figure(guardTexture,1.86);
    const mark=new THREE.Sprite(new THREE.SpriteMaterial({map:alertTexture,transparent:true,depthTest:false}));
    mark.position.y=2.35;mark.scale.set(.62,.62,1);mark.visible=false;mark.renderOrder=8;actor.group.add(mark);actor.mark=mark;
    guards.push(actor);guardVisions.push(vision('#ffb765',guards.length%2?.32:.39));
    const dot=document.createElement('i');dot.className='radar-guard dot guard';radar.append(dot);ui.radarGuards.push(dot);
  }
  while(cctvs.length<state.cameras.length){cctvs.push(cctvVisual(state.cameras[cctvs.length]));}
  guards.forEach((actor,index)=>{const visible=index<state.guards.length;actor.group.visible=visible;actor.shadow.visible=visible;
    guardVisions[index].visible=visible;ui.radarGuards[index].hidden=!visible;});
  cctvs.forEach((actor,index)=>{const visible=index<state.cameras.length;actor.rig.visible=visible;
    actor.cone.visible=visible;actor.light.visible=visible;actor.dot.hidden=!visible;});
}
syncSecurityVisuals();
function updateVision(mesh,eye) {
  const data=mesh.geometry.attributes.position.array; let n=0;
  for(let i=0;i<30;i++) {
    const a=eye.angle-eye.halfAngle+(i/30)*eye.halfAngle*2;
    const b=eye.angle-eye.halfAngle+((i+1)/30)*eye.halfAngle*2;
    const ra=rayDistance(eye.x,eye.z,a,eye.range)-.02,rb=rayDistance(eye.x,eye.z,b,eye.range)-.02;
    for(const [x,z] of [[eye.x,eye.z],[eye.x+Math.cos(a)*ra,eye.z+Math.sin(a)*ra],[eye.x+Math.cos(b)*rb,eye.z+Math.sin(b)*rb]]) {
      data[n++]=x;data[n++]=.02;data[n++]=z;
    }
  }
  mesh.geometry.attributes.position.needsUpdate=true;
}

const held=new Set();const mapping={ArrowUp:'up',KeyW:'up',ArrowDown:'down',KeyS:'down',ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',KeyE:'take',Space:'take',ShiftLeft:'crouch',ShiftRight:'crouch'};
const joystick=document.querySelector('#joystick'),thumb=document.querySelector('#joystick-thumb');
const joystickAxis={x:0,z:0};let joystickPointer=null;
function resetJoystick(){joystickPointer=null;joystickAxis.x=0;joystickAxis.z=0;thumb.style.transform='translate(-50%,-50%)';}
function moveJoystick(event){
  const rect=joystick.getBoundingClientRect(),radius=rect.width*.35;
  const dx=event.clientX-(rect.left+rect.width/2),dz=event.clientY-(rect.top+rect.height/2);
  const length=Math.hypot(dx,dz),scale=length>radius?radius/length:1;
  joystickAxis.x=length<radius*.12?0:dx*scale/radius;
  joystickAxis.z=length<radius*.12?0:dz*scale/radius;
  thumb.style.transform=`translate(calc(-50% + ${joystickAxis.x*radius}px),calc(-50% + ${joystickAxis.z*radius}px))`;
}
joystick.addEventListener('pointerdown',event=>{if(!started||joystickPointer!==null)return;joystickPointer=event.pointerId;
  joystick.setPointerCapture(event.pointerId);moveJoystick(event);event.preventDefault();});
joystick.addEventListener('pointermove',event=>{if(event.pointerId===joystickPointer)moveJoystick(event);});
for(const name of ['pointerup','pointercancel','lostpointercapture'])joystick.addEventListener(name,event=>{
  if(event.pointerId===joystickPointer)resetJoystick();});
addEventListener('keydown',event=>{if(!started)return;const key=mapping[event.code];if(key){held.add(key);event.preventDefault();}});
addEventListener('keyup',event=>{const key=mapping[event.code];if(key)held.delete(key);});
addEventListener('blur',()=>{held.clear();resetJoystick();});
for(const button of document.querySelectorAll('[data-key]')) {
  const key=button.dataset.key;
  button.addEventListener('pointerdown',e=>{if(!started)return;held.add(key);button.classList.add('active');button.setPointerCapture(e.pointerId);e.preventDefault();});
  const release=()=>{held.delete(key);button.classList.remove('active');};
  button.addEventListener('pointerup',release);button.addEventListener('pointercancel',release);
}
let previous=performance.now(), frames=0, frameStart=previous;
const cameraRig = createCameraRig(state.player);
const setView = (pose) => {
  camera.position.set(pose.x,pose.y,pose.z);
  camera.lookAt(pose.lookX,pose.lookY,pose.lookZ);
};
function updateView(movement,seconds){
  setView(updateCameraRig(cameraRig,state.player,movement,seconds,camera.aspect));
}
// Rotazione orbitale volontaria: rotazioni incrementali di 45°, zoom a passi e ricentraggio.
for(const [id,action] of [
  ['camera-left',()=>orbitCamera(cameraRig,-Math.PI/4)],
  ['camera-right',()=>orbitCamera(cameraRig,Math.PI/4)],
  ['camera-center',()=>centerCamera(cameraRig)],
  ['camera-closer',()=>zoomCamera(cameraRig,-.13)],
  ['camera-farther',()=>zoomCamera(cameraRig,.13)]
]) document.getElementById(id).addEventListener('click',()=>{if(started)action();});
// Gesti direttamente sulla scena: trascina per ruotare, rotella per zoom.
let pointerDrag=null;
host.addEventListener('pointerdown',e=>{
  if(!started||e.button!==0 || pointerDrag!==null) return;
  pointerDrag={id:e.pointerId,x:e.clientX};
  host.setPointerCapture(e.pointerId);
});
host.addEventListener('pointermove',e=>{
  if(!pointerDrag || pointerDrag.id!==e.pointerId)return;
  const dx=e.clientX-pointerDrag.x;
  if(Math.abs(dx)>2){orbitCamera(cameraRig,-dx*.005);pointerDrag.x=e.clientX;}
});
const endDrag=e=>{if(pointerDrag&&e.pointerId===pointerDrag.id)pointerDrag=null;};
host.addEventListener('pointerup',endDrag);
host.addEventListener('pointercancel',endDrag);
host.addEventListener('wheel',e=>{if(!started)return;e.preventDefault();zoomCamera(cameraRig,e.deltaY>0?.10:-.10);},{passive:false});
addEventListener('keydown',e=>{
  if(!started||e.repeat)return;
  if(e.code==='KeyZ')orbitCamera(cameraRig,-Math.PI/4);
  else if(e.code==='KeyX')orbitCamera(cameraRig,Math.PI/4);
  else if(e.code==='KeyR')centerCamera(cameraRig);
  else if(e.code==='Equal'||e.code==='NumpadAdd')zoomCamera(cameraRig,-.13);
  else if(e.code==='Minus'||e.code==='NumpadSubtract')zoomCamera(cameraRig,.13);
});

function resize(){const w=host.clientWidth,h=host.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.fov=w/h<1.5?48:36;camera.updateProjectionMatrix();}
new ResizeObserver(resize).observe(host);resize();
function startGame(){
  if(started||startAction.disabled)return;
  started=true;startScreen.hidden=true;held.clear();resetJoystick();previous=performance.now();frameStart=previous;
  audio.start();musicButton.hidden=false;syncMusicButton();
}
startAction.addEventListener('click',startGame);
addEventListener('keydown',event=>{
  if(started||!['Enter','Space'].includes(event.code))return;
  event.preventDefault();event.stopImmediatePropagation();startGame();
},true);
startAction.disabled=false;document.querySelector('#start-status').hidden=true;
document.querySelector('#retry').addEventListener('click',()=>{audio.stop();musicButton.hidden=true;
  state=initialScene();finale=null;finalResult=null;started=false;
  startScreen.hidden=false;startAction.focus();game.classList.remove('in-finale');
  cameraRig.focusX=state.player.x;cameraRig.focusZ=state.player.z;centerCamera(cameraRig);held.clear();resetJoystick();
  ui.result.hidden=true;ui.finale.hidden=true;buildPickupBars();shownPickupVersion=state.pickupVersion;syncSecurityVisuals();});
const recordKey='ffc-best-crowns-v1';
let best=0;
try{best=Math.max(0,Number(localStorage.getItem(recordKey))||0);}catch{}
function beginFinale(){
  if(finale||state.phase==='playing')return;
  const outcome=state.phase;
  if(outcome==='escaped'&&state.chocolate>best){best=state.chocolate;
    try{localStorage.setItem(recordKey,String(best));}catch{}}
  finalResult={outcome,chocolates:state.chocolate,crowns:crowns(state),fine:outcome==='caught'?FINE:0,best};
  finale=createFinale(outcome);held.clear();resetJoystick();game.classList.add('in-finale');
  ui.result.hidden=true;ui.finale.hidden=false;
}
document.querySelector('#finale-next').addEventListener('click',()=>{if(finale)nextFinaleStep(finale);});
document.querySelector('#finale-skip').addEventListener('click',()=>{if(finale)skipFinale(finale);});
addEventListener('keydown',event=>{if(!finale||finale.step==='result')return;
  if(event.code==='Enter'){nextFinaleStep(finale);event.preventDefault();}
  if(event.code==='Escape'){skipFinale(finale);event.preventDefault();}
});
document.querySelector('#share-whatsapp').addEventListener('click',()=>{
  if(!finalResult)return;
  const url=buildWhatsAppShareUrl(finalResult),opened=window.open(url,'_blank');
  if(opened)opened.opener=null;else location.assign(url);
});
function setFigureView(actor, textures, facing, x, z, frontFrame) {
  const {view,flip}=spriteView(facing,x,z,camera.position.x,camera.position.z);
  const texture=view==='front' ? frontFrame || textures.front : textures[view];
  applySprite(actor,texture,1,0,flip);
}
function applySprite(actor, texture, columns = 1, frame = 0, flip = false) {
  if(actor.image.material.map!==texture){actor.image.material.map=texture;actor.image.material.needsUpdate=true;}
  if(actor.columns!==columns||actor.frame!==frame){
    const uv=actor.image.geometry.attributes.uv;
    const left=frame/columns,right=(frame+1)/columns;
    uv.setX(0,left);uv.setX(1,right);uv.setX(2,left);uv.setX(3,right);
    uv.needsUpdate=true;actor.columns=columns;actor.frame=frame;
  }
  actor.image.scale.x=(columns===4?1.25:1)*(flip?-1:1);
}
function setPlayerAnimation() {
  const pose=animationPose({facing:state.player.facing,x:state.player.x,z:state.player.z,
    cameraX:camera.position.x,cameraZ:camera.position.z,moving:state.player.moving,
    crouch:held.has('crouch'),taking:state.taking,stride:state.player.stride});
  if(pose.state==='walk'||pose.state==='crouch') {
    const direction=pose.direction==='left'&&pose.state==='crouch'?'right':pose.direction;
    applySprite(player,animationTextures[`ipno-${pose.state}-${direction}`],4,pose.frame,
      pose.state==='crouch'&&pose.direction==='left');
  } else if(pose.state==='take') {
    const direction=pose.direction==='left'?'right':pose.direction;
    const texture=direction==='front'?ipnoTakeTexture:animationTextures[`ipno-take-${direction}`];
    applySprite(player,texture,1,0,pose.direction==='left');
  } else {
    const direction=pose.direction==='left'?'right':pose.direction;
    applySprite(player,{front:ipnoTexture,back:ipnoBackTexture,right:ipnoSideTexture}[direction],1,0,pose.direction==='left');
  }
}
function setGuardAnimation(actor, guard) {
  const pose=animationPose({facing:guard.angle,x:guard.x,z:guard.z,
    cameraX:camera.position.x,cameraZ:camera.position.z,moving:guard.moving,
    chasing:guard.chasing,stride:guard.stride});
  if(pose.state==='walk'||pose.state==='run') {
    applySprite(actor,animationTextures[`policie-${pose.state}-${pose.direction}`],4,pose.frame);
  } else {
    applySprite(actor,{front:guardTexture,back:guardBackTexture,right:guardSideTexture,
      left:animationTextures['policie-idle-left']}[pose.direction]);
  }
}
function loop(now) {
  const dt=Math.min((now-previous)/1000,.05);previous=now;
  if(!started)audio.update(state,finale,dt);
  if(!started){requestAnimationFrame(loop);return;}
  const screenX=Number(held.has('right'))-Number(held.has('left'))+joystickAxis.x;
  const screenZ=Number(held.has('down'))-Number(held.has('up'))+joystickAxis.z;
  const worldMove=cameraRelativeMovement(screenX,screenZ,cameraRig.yaw);
  const input={...worldMove,take:held.has('take'),crouch:held.has('crouch')};
  updateScene(state,input,dt);
  beginFinale();if(finale)advanceFinale(finale,dt);
  audio.update(state,finale,dt);
  syncSecurityVisuals();
  if(shownPickupVersion!==state.pickupVersion){buildPickupBars();shownPickupVersion=state.pickupVersion;}
  updateView(worldMove,dt);
  updateShelfOcclusion();
  orientFigure(player,state.player.x,state.player.z,state.player.stride,state.player.moving);
  if(finale?.step==='door')player.group.position.z-=Math.min(1,finale.time/1.3)*1.5;
  setPlayerAnimation();
  state.guards.forEach((guard,index)=>{
    orientFigure(guards[index],guard.x,guard.z,guard.stride,guard.moving);
    setGuardAnimation(guards[index],guard);
    guards[index].mark.visible=guard.exclamationTime>0||guard.mode==='respond'||guard.mode==='chase';
    updateVision(guardVisions[index],guard);
    guardVisions[index].material.color.set(guard.chasing?'#ff4f53':'#ffb765');
    ui.radarGuards[index].classList.toggle('responding',guard.mode==='respond'||guard.mode==='chase'||guard.mode==='search');
    ui.radarGuards[index].classList.toggle('witness',state.security.source==='guard'&&state.security.sourceIndex===index);
  });
  if(finale?.step==='escort'){
    const progress=Math.min(1,finale.time/1.3);
    player.group.position.x+=progress*.65;
    player.group.position.z-=progress*.65;
    const escort=guards[state.security.responders[0]];
    if(escort){escort.group.position.set(player.group.position.x+.55,0,player.group.position.z+.2);}
  }
  const customerZ=5.8+Math.sin(state.time*.45)*.65;
  orientFigure(customer,9.2,customerZ,state.time*1.5,true);
  setFigureView(customer,{front:customerTexture,back:customerBackTexture,side:customerSideTexture},Math.cos(state.time*.45)>0?Math.PI/2:-Math.PI/2,9.2,customerZ);
  state.cameras.forEach((eye,index)=>{
    const actor=cctvs[index];actor.head.rotation.y=-eye.angle;updateVision(actor.cone,eye);
    actor.dot.classList.toggle('witness',state.security.source==='camera'&&state.security.sourceIndex===index);
    actor.light.intensity=state.security.source==='camera'&&state.security.sourceIndex===index&&state.security.mode!=='routine_increased'
      ?3.5+Math.sin(state.time*16)*1.2:2.8;
  });
  bars.forEach(({bar,glow},index)=>{const status=state.pickups[index].status;bar.visible=status!=='collected';glow.visible=status!=='collected';glow.scale.setScalar(status==='taking'?1.35:1);});
  ui.loot.textContent=String(state.chocolate);
  ui.score.textContent=`${crowns(state)} Kč`;
  ui.best.textContent=`RECORD ${best} Kč`;
  const mode=state.security.mode;
  const watchText={alert:`⚠ ${state.security.source==='camera'?'CCTV':'POLICIE'} · ALLARME`,
    pursuit:'⚠ POLICIE · INSEGUIMENTO',searching:'⚠ POLICIE · RICERCA',
    routine_increased:'CONTROLLI RAFFORZATI'};
  ui.watch.textContent=watchText[mode]|| (state.alert>25?'TI STANNO OSSERVANDO':'SORVEGLIANZA NORMALE');
  ui.watch.classList.toggle('alert',mode!=='routine'||state.alert>25);
  lastKnownMarker.hidden=!['alert','pursuit','searching'].includes(mode)||!state.security.lastKnown;
  if(!lastKnownMarker.hidden){
    lastKnownMarker.style.left=`${(state.security.lastKnown.x-LIMITS.minX)/(LIMITS.maxX-LIMITS.minX)*100}%`;
    lastKnownMarker.style.top=`${(state.security.lastKnown.z-LIMITS.minZ)/(LIMITS.maxZ-LIMITS.minZ)*100}%`;
  }
  const radarActors=[[ui.radarPlayer,state.player],...state.guards.map((guard,index)=>[ui.radarGuards[index],guard]),
    ...state.cameras.map((eye,index)=>[cctvs[index].dot,eye])];
  for(const [dot,actor] of radarActors) {
    dot.style.left=`${(actor.x-LIMITS.minX)/(LIMITS.maxX-LIMITS.minX)*100}%`;
    dot.style.top=`${(actor.z-LIMITS.minZ)/(LIMITS.maxZ-LIMITS.minZ)*100}%`;
  }
  ui.mission.textContent=state.message;
  const near=nearestPickup(state);
  ui.interaction.hidden=!near||['alert','pursuit','searching'].includes(mode);
  ui.progress.style.width=`${Math.min(100,state.takeTime/TAKE_SECONDS*100)}%`;
  if(finale){
    const stageNames={door:'USCITA · PRAHA',escort:'POLICIE · ACCOMPAGNAMENTO',office:'UFFICIO POLICIE',
      escalator:'SCALA MOBILE · VÝCHOD',street:'PRAHA · ESTERNO',fine:'POKUTA · MULTA'};
    const subtitle=finaleSubtitle(finale);
    ui.finale.hidden=finale.step==='result';
    ui.finale.classList.toggle('is-escalator',finale.step==='escalator');
    ui.finaleStage.textContent=stageNames[finale.step]||'';
    ui.finaleSpoken.textContent=subtitle?.spoken||'';
    ui.finaleTranslation.textContent=subtitle?.translation||'';
  }
  if(finale?.step==='result'&&ui.result.hidden){
    ui.result.hidden=false;const caught=state.phase==='caught';
    ui.kicker.textContent=caught?'POLICIE · PRELIEVO VISTO':'USCITA RAGGIUNTA';
    ui.title.textContent=caught?'Ti hanno raggiunto.':'Cioccolate al sicuro!';
    ui.text.textContent=caught?`${state.chocolate} cioccolate × 1 Kč = ${state.chocolate} Kč. Multa ${FINE} Kč. Punteggio: ${crowns(state)} Kč. Il record resta ${best} Kč.`:
      `${state.chocolate} cioccolate × 1 Kč = ${crowns(state)} Kč. Record salvato: ${best} Kč. Riprova e rischia di più!`;
  }
  if(finale&&!['door','escort'].includes(finale.step)){
    finaleVisual.update(finale,camera.aspect);renderer.render(finaleVisual.scene,finaleVisual.camera);
  }else renderer.render(scene,camera);
  frames++;if(now-frameStart>2000){window.__ffcMetrics={fps:Math.round(frames*1000/(now-frameStart)),drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,phase:state.phase};frames=0;frameStart=now;}
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
