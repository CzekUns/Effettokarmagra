import * as THREE from './vendor/three/three.module.js';
import { initialScene, updateScene, rayDistance, PICKUP, EXIT } from './reference-play-logic.mjs';
import { createCameraRig, cameraRelativeMovement, orbitCamera, zoomCamera, centerCamera, updateCameraRig } from './reference-camera.mjs';

const host = document.querySelector('#world');
const ui = {
  loot: document.querySelector('#loot'), score: document.querySelector('#score'),
  mission: document.querySelector('#mission'), watch: document.querySelector('#watch'),
  interaction: document.querySelector('#interaction'), progress: document.querySelector('#progress'),
  result: document.querySelector('#result'), title: document.querySelector('#result-title'),
  kicker: document.querySelector('#result-kicker'), text: document.querySelector('#result-text'),
  radarPlayer: document.querySelector('#radar-player'), radarGuard: document.querySelector('#radar-guard'),
  radarCamera: document.querySelector('#radar-camera')
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
const fridgeLight = new THREE.PointLight('#70dfff', 22, 12, 2); fridgeLight.position.set(0, 2, -4.1); scene.add(fridgeLight);
const warmLight = new THREE.PointLight('#ffa25d', 18, 10, 2); warmLight.position.set(-1.8, 3.3, 2.2); scene.add(warmLight);

const loader = new THREE.TextureLoader();
function load(path) { return new Promise((resolve, reject) => loader.load(path, t => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy()); resolve(t); }, undefined, reject)); }
const [ipnoTexture, ipnoWalkTexture, ipnoTakeTexture, guardTexture, customerTexture, fridgeTexture, chocolateTexture, floorTexture] = await Promise.all([
  './assets/reference-play/ipno.webp', './assets/reference-play/ipno-walk.webp', './assets/reference-play/ipno-take.webp', './assets/reference-play/policie.webp',
  './assets/reference-play/customer.webp',
  './assets/reference-play/fridge.webp', './assets/reference-play/chocolate-shelf.webp',
  './assets/reference-play/floor.webp'
].map(load));
floorTexture.wrapS = THREE.RepeatWrapping; floorTexture.wrapT = THREE.RepeatWrapping;
floorTexture.repeat.set(2, 2);
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
  box(scene, 12.2, .24, 11.3, '#665d60', 0, -.19, 0, { roughness: .28, metalness: .11, cast: false });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(12.2, 11.3), new THREE.MeshStandardMaterial({ map:floorTexture, color:'#b6a3a2', roughness:.65, metalness:.04 }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -.055; floor.receiveShadow = true; scene.add(floor);
  box(scene, 12.2, 3.6, .22, '#292b3d', 0, 1.75, -5.57);
  box(scene, .22, 3.6, 11.3, '#252536', -6.03, 1.75, 0);
  box(scene, .22, 1.15, 11.3, '#292a3b', 6.03, .5, 0);
  box(scene, 12.2, .2, .28, '#111524', 0, 3.58, -5.53);
  box(scene, .27, .18, 11.3, '#111524', -6, 3.58, 0);
  for (const [x,z,color,opacity,radius] of [[-2,-.9,'#ff9d56',.17,2.9],[2,-3.1,'#63e5ff',.22,2.7],[2.9,2.2,'#ff9654',.13,2.2]]) disc(scene,radius,color,opacity,x,z);
  for (const x of [-3.7,-.2,3.3]) {
    box(scene, .12, .08, 3.7, '#ffe4bb', x, 3.48, 0, { cast:false });
    box(scene, .42, .02, 3.75, '#c59566', x, 3.53, 0, { cast:false });
  }
  // The exit is at the rear, as in the approved reference.
  box(scene, 1.42, 3.05, .16, '#1b3136', 5.05, 1.52, -5.35);
  box(scene, 1.18, 2.75, .04, '#b6a76c', 5.05, 1.41, -5.24, { roughness:.24,metalness:.24 });
  plane(scene, 1.65, .38, sign('VÝCHOD  ↗', 1.65, .38, '#257969'), 5.05, 3.23, -5.22);
  const crates = [['#962b58',-3.95,-3.2],['#d9813d',-3.37,-3.22],['#455b9a',-2.79,-3.2],['#c34f42',-3.65,-2.64],['#9257aa',-2.86,-2.58]];
  for (const [color,x,z] of crates) {
    box(scene,.46,.44,.46,'#836348',x,.22,z,{roughness:.9});
    for(let j=0;j<3;j++) box(scene,.12,.26,.31,color,x-.13+j*.13,.55,z,{cast:false});
  }
  for(const [x,z] of [[-4.55,3.7],[-4.95,3.05],[4.95,2.45],[4.6,3.65]]) {
    box(scene,.65,.12,.65,'#51334b',x,.1,z,{roughness:.55});
    for(let i=0;i<3;i++) box(scene,.16,.5,.38,['#dd3c64','#d48a34','#6444a7'][i],x-.2+i*.2,.42,z,{roughness:.46,cast:false});
  }
  // Baskets and a trolley make the playable slice feel inhabited.
  const cart=new THREE.Group();scene.add(cart);cart.position.set(4.55,0,3.05);
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

function makeFridgeRow(back = true) {
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
}
makeFridgeRow(); makeFridgeRow(false);

function makeAisle(x, z, length, chocolate = false) {
  const group = new THREE.Group(); scene.add(group);
  const width = chocolate ? 1.2 : 1.1, height = chocolate ? 2.5 : 2.42;
  box(group,width,height,length,'#252337',x,height/2,z,{roughness:.46,metalness:.18});
  const image = chocolate ? chocolateTexture : fridgeTexture;
  plane(group,length-.12,height-.18,image,x+width/2+.01,height/2,z,Math.PI/2,{toneMapped:!chocolate});
  plane(group,length-.12,height-.18,image,x-width/2-.01,height/2,z,-Math.PI/2,{toneMapped:!chocolate});
  box(group,width+.16,.14,length+.14,'#1c2334',x,height+.07,z,{roughness:.34,metalness:.32});
  for (const end of [-1,1]) {
    const zz=z+end*length/2;
    box(group,width+.11,.23,.08,'#493453',x,height+.02,zz);
    plane(group,width+.01,.44,sign(chocolate?'ČOKOLÁDA':'AKCE',width,.44,chocolate?'#a52d63':'#d27637'),x,height+.03,zz+end*.049,end<0?Math.PI:0);
    plane(group,width-.07,height-.38,image,x,height/2,zz+end*.055,end<0?Math.PI:0,{toneMapped:!chocolate});
  }
  const colors=chocolate?['#8f306a','#e7a12f','#5b48ac','#c83947']:['#3577b3','#e89034','#a0458a','#58b3c4'];
  for(let i=0;i<12;i++) {
    const zz=z-length/2+.38+(i%6)*((length-.7)/6);
    box(group,.22,.14,.34,colors[i%4],x+(i<6?-.27:.27),height+.18,zz,{roughness:.4,cast:false});
  }
  return group;
}
const chocolateAisle = makeAisle(-1.15,0,3.56,true);
makeAisle(3,-.35,3.9,false);
makeAisle(3.75,3.3,1.5,false);
// One selectable bar really sits on the shelf at hand height.
const bar = new THREE.Group(); scene.add(bar);
box(bar,.065,.2,.31,'#e8a528',-.495,1.18,.4,{roughness:.25,metalness:.2});
box(bar,.015,.17,.24,'#b42569',-.452,1.18,.4,{roughness:.3});
const pickupGlow = disc(scene,.43,'#e745b2',.33,PICKUP.x,PICKUP.z);
const exitGlow = disc(scene,.6,'#64f8bd',.24,EXIT.x,EXIT.z); exitGlow.visible = false;

// Camera rig and floor projections share exactly the same observer geometry as the rules.
const rig = new THREE.Group(); scene.add(rig); rig.position.set(4.5,0,-4.25);
box(rig,.12,3.18,.12,'#404e5d',0,1.59,0,{roughness:.3,metalness:.6});
box(rig,.55,.09,.1,'#748a9b',-.22,3.12,0,{roughness:.22,metalness:.65});
const head = new THREE.Group(); head.position.set(-.48,3.1,0); rig.add(head);
box(head,.45,.22,.25,'#202b3a',0,0,0,{roughness:.27,metalness:.5});
box(head,.035,.14,.15,'#9ee4f6',-.24,0,0,{cast:false});
box(head,.09,.06,.08,'#fa493c',.1,.15,0,{cast:false});
const cameraLight = new THREE.PointLight('#e9524c',2.8,3.5); cameraLight.position.set(4.5,3,-4.25); scene.add(cameraLight);

function figure(texture, height) {
  const group = new THREE.Group(); scene.add(group);
  const image = new THREE.Mesh(new THREE.PlaneGeometry(height * 1024 / 1536,height),new THREE.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,side:THREE.DoubleSide,toneMapped:false}));
  image.position.y=height/2; image.renderOrder=5; group.add(image);
  const shadow=disc(scene,.38,'#15101a',.4,0,0);
  return {group,image,shadow};
}
const player=figure(ipnoTexture,1.92), guard=figure(guardTexture,1.86), customer=figure(customerTexture,1.8);
function orientFigure(actor, worldX, worldZ, stride) {
  actor.group.position.set(worldX,Math.abs(Math.sin(stride))*.028,worldZ);
  actor.group.rotation.y=Math.atan2(camera.position.x-worldX,camera.position.z-worldZ);
  actor.shadow.position.set(worldX,.015,worldZ);
}
function vision(color,opacity) {
  const points=new Float32Array(30*9);
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(points,3));
  const mesh=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({color,transparent:true,opacity,depthWrite:false,side:THREE.DoubleSide}));
  mesh.renderOrder=2;scene.add(mesh);return mesh;
}
const guardVision=vision('#ffb765',.39), cameraVision=vision('#f35556',.49);
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
addEventListener('keydown',event=>{const key=mapping[event.code];if(key){held.add(key);event.preventDefault();}});
addEventListener('keyup',event=>{const key=mapping[event.code];if(key)held.delete(key);});
addEventListener('blur',()=>held.clear());
for(const button of document.querySelectorAll('[data-key]')) {
  const key=button.dataset.key;
  button.addEventListener('pointerdown',e=>{held.add(key);button.classList.add('active');button.setPointerCapture(e.pointerId);e.preventDefault();});
  const release=()=>{held.delete(key);button.classList.remove('active');};
  button.addEventListener('pointerup',release);button.addEventListener('pointercancel',release);
}
let state=initialScene(); let previous=performance.now(), frames=0, frameStart=previous;
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
]) document.getElementById(id).addEventListener('click', action);
// Gesti direttamente sulla scena: trascina per ruotare, rotella per zoom.
let pointerDrag=null;
host.addEventListener('pointerdown',e=>{
  if(e.button!==0 || pointerDrag!==null) return;
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
host.addEventListener('wheel',e=>{e.preventDefault();zoomCamera(cameraRig,e.deltaY>0?.10:-.10);},{passive:false});
addEventListener('keydown',e=>{
  if(e.repeat)return;
  if(e.code==='KeyZ')orbitCamera(cameraRig,-Math.PI/4);
  else if(e.code==='KeyX')orbitCamera(cameraRig,Math.PI/4);
  else if(e.code==='KeyR')centerCamera(cameraRig);
  else if(e.code==='Equal'||e.code==='NumpadAdd')zoomCamera(cameraRig,-.13);
  else if(e.code==='Minus'||e.code==='NumpadSubtract')zoomCamera(cameraRig,.13);
});

function resize(){const w=host.clientWidth,h=host.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.fov=w/h<1.5?48:36;camera.updateProjectionMatrix();}
new ResizeObserver(resize).observe(host);resize();
document.querySelector('#retry').addEventListener('click',()=>{state=initialScene();cameraRig.focusX=state.player.x;cameraRig.focusZ=state.player.z;centerCamera(cameraRig);held.clear();ui.result.hidden=true;bar.visible=true;pickupGlow.visible=true;exitGlow.visible=false;});
function loop(now) {
  const dt=Math.min((now-previous)/1000,.05);previous=now;
  const screenX=Number(held.has('right'))-Number(held.has('left'));
  const screenZ=Number(held.has('down'))-Number(held.has('up'));
  const worldMove=cameraRelativeMovement(screenX,screenZ,cameraRig.yaw);
  const input={...worldMove,take:held.has('take'),crouch:held.has('crouch')};
  updateScene(state,input,dt);
  updateView(worldMove,dt);
  orientFigure(player,state.player.x,state.player.z,state.player.stride);
  const gaitTexture=state.taking?ipnoTakeTexture:(input.x||input.z)&&Math.floor(state.player.stride*1.2)%2?ipnoWalkTexture:ipnoTexture;
  if(player.image.material.map!==gaitTexture){player.image.material.map=gaitTexture;player.image.material.needsUpdate=true;}
  player.image.scale.x=state.taking?-1:1;
  orientFigure(guard,state.guard.x,state.guard.z,state.time*4);
  orientFigure(customer,4.85,1.3+Math.sin(state.time*.45)*.65,state.time*1.5);
  head.rotation.y=-state.camera.angle;
  updateVision(guardVision,state.guard);updateVision(cameraVision,state.camera);
  bar.visible=!state.chocolate;pickupGlow.visible=!state.chocolate;exitGlow.visible=!!state.chocolate;
  ui.loot.textContent=`${state.chocolate}/1`;
  ui.score.textContent=String(state.chocolate?Math.max(0,1000-Math.floor(state.time*7)):0).padStart(6,'0');
  ui.watch.textContent=state.increasedWatch?'SORVEGLIANZA AUMENTATA':state.alert>25?'TI STANNO OSSERVANDO':'SORVEGLIANZA NORMALE';
  ui.watch.classList.toggle('alert',state.increasedWatch||state.alert>25);
  for(const [dot,actor] of [[ui.radarPlayer,state.player],[ui.radarGuard,state.guard],[ui.radarCamera,state.camera]]) {
    dot.style.left=`${(actor.x+5.6)/11.2*100}%`;
    dot.style.top=`${(actor.z+5.1)/10.2*100}%`;
  }
  ui.mission.textContent=state.message;
  const near=Math.hypot(state.player.x-PICKUP.x,state.player.z-PICKUP.z)<PICKUP.reach;
  ui.interaction.hidden=!!state.chocolate||!near;ui.progress.style.width=`${Math.min(100,state.takeTime/1.15*100)}%`;
  if(state.phase!=='playing'&&ui.result.hidden){
    ui.result.hidden=false;const caught=state.phase==='caught';
    ui.kicker.textContent=caught?'POLICIE · PRELIEVO VISTO':'USCITA RAGGIUNTA';
    ui.title.textContent=caught?'Ti hanno visto.':'Cioccolata al sicuro!';
    ui.text.textContent=caught?'Camminare nella corsia è consentito. Aspetta che la visuale sia interrotta durante tutto il prelievo.':'Hai preso la cioccolata dallo scaffale e raggiunto l’uscita. Questo è il reparto campione.';
  }
  renderer.render(scene,camera);
  frames++;if(now-frameStart>2000){window.__ffcMetrics={fps:Math.round(frames*1000/(now-frameStart)),drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,phase:state.phase};frames=0;frameStart=now;}
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
