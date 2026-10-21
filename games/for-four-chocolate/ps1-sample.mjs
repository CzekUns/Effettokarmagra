import * as THREE from './vendor/three/three.module.js';
import { createSample, stepSample, rayLimit } from './ps1-sample-logic.mjs';

const mount = document.querySelector('#scene');
const fallback = document.querySelector('#fallback');
const alertLabel = document.querySelector('#alert');
const riskBar = document.querySelector('#risk-bar');
const riskValue = document.querySelector('#risk-value');
const end = document.querySelector('#end');
const prompt = document.querySelector('#prompt');
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'default' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, innerWidth < 700 ? 1.15 : 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.55;
  renderer.shadowMap.enabled = innerWidth > 700;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  mount.prepend(renderer.domElement);
} catch (error) {
  console.error('WebGL non disponibile', error);
  fallback.hidden = false;
  throw error;
}

const scene = new THREE.Scene();
scene.background = new THREE.Color('#34403d');
scene.fog = new THREE.Fog('#34403d', 42, 68);
const camera = new THREE.PerspectiveCamera(38, 1, .1, 70);
camera.position.set(10.5, 15, 17.5);
camera.lookAt(0, .7, -.2);
scene.add(new THREE.HemisphereLight('#fff2d6', '#546765', 2.3));
const ceilingLight = new THREE.DirectionalLight('#fff5dd', 3.2);
ceilingLight.position.set(-5, 14, 10);
ceilingLight.castShadow = renderer.shadowMap.enabled;
ceilingLight.shadow.mapSize.set(1024, 1024);
ceilingLight.shadow.camera.left = -12; ceilingLight.shadow.camera.right = 12;
ceilingLight.shadow.camera.top = 12; ceilingLight.shadow.camera.bottom = -12;
ceilingLight.shadow.bias = -.0004;
scene.add(ceilingLight);

const materials = new Map();
function mat(color, roughness = .85) {
  const key = `${color}:${roughness}`;
  if (!materials.has(key)) materials.set(key, new THREE.MeshStandardMaterial({ color, roughness }));
  return materials.get(key);
}
function box(parent, width, height, depth, color, x, y, z, options = {}) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), mat(color, options.roughness));
  mesh.position.set(x, y, z);
  mesh.castShadow = options.shadow !== false;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}
function cyl(parent, top, bottom, height, color, x, y, z, sides = 10) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(top, bottom, height, sides), mat(color));
  mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
}
function planeText(text, width, height, background, ink = '#f8eee2', size = 70) {
  const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 160;
  const context = canvas.getContext('2d');
  context.fillStyle = background; context.fillRect(0, 0, 512, 160);
  context.fillStyle = ink; context.font = `900 ${size}px Arial`; context.textAlign = 'center'; context.textBaseline = 'middle';
  context.fillText(text, 256, 82, 485);
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide }));
  return mesh;
}
function label(parent, text, width, height, background, x, y, z, rotateY = 0, ink = '#fff8e8') {
  const mesh = planeText(text, width, height, background, ink); mesh.position.set(x, y, z); mesh.rotation.y = rotateY; parent.add(mesh); return mesh;
}
function floor() {
  box(scene, 16, .24, 16, '#a5aa9d', 0, -.2, 0, { shadow: false });
  // Seam lines give scale without a checkerboard pattern.
  for (let i = -7; i <= 7; i += 2) {
    box(scene, .012, .003, 15.5, '#858e83', i, -.072, 0, { shadow: false });
    box(scene, 15.5, .003, .012, '#858e83', 0, -.072, i, { shadow: false });
  }
  for (const x of [-5.95, 0, 5.95]) box(scene, .07, .004, 14.5, '#d7bd7f', x, -.067, 0, { shadow: false });
  box(scene, 16, 3.7, .28, '#c7c6b2', 0, 1.8, -7.85);
  box(scene, .25, 3.7, 16, '#b8c6bd', -7.85, 1.8, 0);
  box(scene, .25, 3.7, 16, '#b8c6bd', 7.85, 1.8, 0);
  box(scene, 16, .3, .3, '#71857e', 0, .15, -7.67);
  for (let z = -6; z < 7; z += 4.5) {
    box(scene, .08, .08, 3.2, '#f7ead2', -6.7, 3.6, z, { shadow: false });
    box(scene, .08, .08, 3.2, '#f7ead2', 6.7, 3.6, z, { shadow: false });
  }
  label(scene, 'U PRODEJNY', 3.2, .74, '#bb513d', 0, 2.95, -7.7);
  label(scene, 'VÝCHOD  →', 2.6, .48, '#37685a', 5.35, 2.85, -7.69, 0, '#e7f4e7');
  for (const x of [-6.35, 6.35]) {
    box(scene, 2.2, 1.65, .14, '#537274', x, 1.4, -7.65);
    box(scene, 1.95, 1.38, .05, '#9ab4ae', x, 1.4, -7.55);
  }
  box(scene, 2.6, .07, .35, '#eee4c7', 0, 3.32, -7.48);
}
floor();

const productColors = ['#b24333','#e6bc4e','#385b76','#ecd9a8','#8a6649','#72a091','#e27a45','#b5c1a7'];
function makeShelf(x, name, type) {
  const group = new THREE.Group(); scene.add(group);
  const steel = '#5f6964', underside = '#394641';
  for (const end of [-3.98, 3.98]) {
    box(group, 1.65, 2.42, .13, steel, x, 1.24, end);
    box(group, 1.46, 1.88, .035, '#d4d1bd', x, 1.3, end + (end > 0 ? .08 : -.08));
  }
  for (const side of [-.78, .78]) {
    for (const z of [-3.94, 0, 3.94]) box(group, .09, 2.55, .11, underside, x + side, 1.28, z);
    for (let level = 0; level < 4; level++) {
      const y = .26 + level * .62;
      box(group, .82, .085, 7.95, '#c7b7a0', x + side / 2, y, 0);
      box(group, .035, .18, 7.95, '#e6d7bb', x + side * 1.01, y - .02, 0);
      for (let z = -3.6; z <= 3.6; z += .54) {
        const seed = Math.round((z + 4) * 19 + level * 7 + x * 2);
        const color = productColors[Math.abs(seed) % productColors.length];
        if (type === 'drink') {
          cyl(group, .12, .13, .35 + ((seed % 3 + 3) % 3) * .06, color,
              x + side * .72, y + .2, z, 8);
          cyl(group, .05, .05, .04, '#dedbc5', x + side * .72, y + .43, z, 8);
        } else {
          const packageMesh = box(group, .22, .3 + ((seed % 3 + 3) % 3) * .055, .38,
              color, x + side * .72, y + .19, z, { shadow: false });
          packageMesh.rotation.y = ((seed % 5) - 2) * .055;
          box(group, .008, .035, .22, '#f6e4b9', x + side * .858, y + .2, z, { shadow: false });
        }
      }
    }
  }
  box(group, 1.9, .12, 8.18, '#53635c', x, 2.58, 0);
  box(group, 1.97, .23, .28, '#364b48', x, 2.62, 4.15);
  label(group, name, 1.87, .43, type === 'drink' ? '#396b70' : '#9f4937', x, 2.63, 4.33);
  box(group, 1.97, .23, .28, '#364b48', x, 2.62, -4.15);
  label(group, name, 1.87, .43, type === 'drink' ? '#396b70' : '#9f4937', x, 2.63, -4.33, Math.PI);
}
makeShelf(-3.4, 'ČOKOLÁDA', 'snack'); makeShelf(3.4, 'NÁPOJE', 'drink');

function checkout() {
  box(scene, 2.15, .9, 1.12, '#455f5b', -5.8, .46, 5.75);
  box(scene, 2.24, .12, 1.24, '#e2d9c1', -5.8, .97, 5.75);
  box(scene, .8, .2, .8, '#293a3c', -6.35, 1.13, 5.6);
  box(scene, .12, .58, .11, '#495457', -5.2, 1.31, 5.6);
  box(scene, .64, .47, .1, '#26383e', -5.2, 1.6, 5.6);
  label(scene, 'POKLADNA', 2.3, .48, '#b86945', -5.8, 2.46, 5.75);
  box(scene, 1.65, .8, 1.2, '#709193', 5.85, .39, 5.7);
  box(scene, 1.7, .08, 1.25, '#bbd0ca', 5.85, .82, 5.7);
  for (let i = 0; i < 4; i++) box(scene, .23, .35, .32, productColors[i], 5.32 + i * .36, 1.02, 5.65, { shadow: false });
  label(scene, 'AKCE  49 Kč', 1.8, .37, '#c14532', 5.82, 1.57, 5.7, 0, '#fff0bb');
}
checkout();

function person({ police = false } = {}) {
  const group = new THREE.Group();
  const skin = '#c9916b';
  box(group, .47, .59, .28, police ? '#263c59' : '#c08c56', 0, 1.14, 0);
  box(group, .53, .08, .3, police ? '#d9d4bb' : '#36555c', 0, .86, 0);
  for (const side of [-1, 1]) {
    box(group, .16, .48, .19, police ? '#263c59' : '#b97750', side * .33, 1.16, 0);
    box(group, .18, .12, .19, skin, side * .33, .86, 0);
    box(group, .19, .64, .21, police ? '#23334b' : '#3c4a4b', side * .14, .47, 0);
    box(group, .22, .1, .29, '#272d30', side * .14, .08, -.07);
  }
  cyl(group, .18, .19, .15, skin, 0, 1.54, 0);
  const head = new THREE.Mesh(new THREE.SphereGeometry(.27, 9, 7), mat(skin));
  head.position.set(0, 1.78, 0); head.castShadow = true; group.add(head);
  if (police) {
    cyl(group, .31, .29, .17, '#1d3049', 0, 2.05, 0);
    box(group, .45, .045, .24, '#1d3049', 0, 1.98, .2);
    label(group, 'POLICIE', .48, .13, '#203d60', 0, 1.25, .145, 0, '#fff5de');
    box(group, .16, .22, .04, '#e4cf82', -.13, 1.55, .15);
  } else {
    // Ipno: straw hat, thick black glasses and patterned orange shirt.
    cyl(group, .28, .32, .25, '#cfb273', 0, 2.14, 0, 12);
    cyl(group, .5, .5, .07, '#ddc788', 0, 2.02, 0, 12);
    cyl(group, .31, .31, .045, '#906948', 0, 2.075, 0, 12);
    for (const side of [-1, 1]) {
      const lens = new THREE.Mesh(new THREE.TorusGeometry(.088, .022, 5, 10), mat('#202b2d'));
      lens.position.set(side * .105, 1.81, .242); group.add(lens);
    }
    box(group, .085, .025, .03, '#202b2d', 0, 1.81, .265);
    for (let i = 0; i < 7; i++) {
      const xx = ((i * 17) % 7 - 3) * .065;
      box(group, .055, .085, .017, i % 2 ? '#315968' : '#e6cc79', xx, 1.05 + (i % 3) * .13, .148, { shadow: false });
    }
  }
  scene.add(group); return group;
}
const ipno = person(); const officer = person({ police: true });
const cctv = new THREE.Group(); scene.add(cctv);
box(cctv, .12, 2.9, .12, '#465458', 0, 1.55, 0);
box(cctv, .55, .12, .12, '#687c7a', -.2, 2.85, 0);
const cctvHead = new THREE.Group(); cctvHead.position.set(-.48, 2.84, 0); cctv.add(cctvHead);
box(cctvHead, .45, .22, .24, '#28383b', 0, 0, 0);
box(cctvHead, .04, .13, .14, '#acc8c3', -.24, 0, 0);
cyl(cctvHead, .065, .065, .055, '#e5564c', .1, .13, 0);

function cone(color, opacity) {
  const mesh = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false, side: THREE.DoubleSide }));
  mesh.renderOrder = 2; scene.add(mesh); return mesh;
}
const guardCone = cone('#ffcd62', .66), cameraCone = cone('#f06f56', .6);
function updateCone(mesh, observer) {
  const segments = 32, points = [];
  const apexY = .014;
  for (let i = 0; i < segments; i++) {
    const a = observer.angle - observer.halfAngle + (i / segments) * observer.halfAngle * 2;
    const b = observer.angle - observer.halfAngle + ((i + 1) / segments) * observer.halfAngle * 2;
    for (const angle of [a, b]) {
      const range = rayLimit(observer.x, observer.z, angle, observer.range);
      if (angle === a) points.push(observer.x, apexY, observer.z);
      points.push(observer.x + Math.cos(angle) * range, apexY, observer.z + Math.sin(angle) * range);
    }
  }
  mesh.geometry.dispose(); mesh.geometry = new THREE.BufferGeometry();
  mesh.geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
}

const keys = new Set(), buttons = new Set();
const direction = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', KeyW: 'up', KeyS: 'down', KeyA: 'left', KeyD: 'right' };
addEventListener('keydown', event => { if (direction[event.code]) { keys.add(direction[event.code]); event.preventDefault(); prompt.hidden = true; } });
addEventListener('keyup', event => { if (direction[event.code]) keys.delete(direction[event.code]); });
addEventListener('blur', () => { keys.clear(); buttons.clear(); });
for (const button of document.querySelectorAll('[data-move]')) {
  button.addEventListener('pointerdown', event => { button.setPointerCapture(event.pointerId); buttons.add(button.dataset.move); button.classList.add('pressed'); prompt.hidden = true; event.preventDefault(); });
  const release = () => { buttons.delete(button.dataset.move); button.classList.remove('pressed'); };
  button.addEventListener('pointerup', release); button.addEventListener('pointercancel', release);
}
let state = createSample();
document.querySelector('#retry').addEventListener('click', () => { state = createSample(); end.hidden = true; });
function resize() {
  const width = mount.clientWidth, height = mount.clientHeight;
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.fov = width < 650 ? 43 : 38;
  camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(mount); resize();
let previous = performance.now();
function frame(now) {
  const dt = Math.min((now - previous) / 1000, .05); previous = now;
  const active = new Set([...keys, ...buttons]);
  stepSample(state, { x: Number(active.has('right')) - Number(active.has('left')), z: Number(active.has('down')) - Number(active.has('up')) }, dt);
  if (mount.clientWidth < 650) {
    const target = new THREE.Vector3(state.player.x + 6.5, 11.5, state.player.z + 9.4);
    camera.position.lerp(target, .08);
    camera.lookAt(state.player.x, .6, state.player.z - 1.7);
  } else {
    camera.position.set(10.5, 15, 17.5);
    camera.lookAt(0, .7, -.2);
  }
  ipno.position.set(state.player.x, .02 + (active.size ? Math.abs(Math.sin(state.player.stride)) * .035 : 0), state.player.z);
  ipno.rotation.y = -state.player.facing + Math.PI / 2;
  officer.position.set(state.guard.x, .02, state.guard.z);
  officer.rotation.y = -state.guard.angle + Math.PI / 2;
  cctv.position.set(state.camera.x, 0, state.camera.z);
  cctvHead.rotation.y = -state.camera.angle;
  updateCone(guardCone, state.guard); updateCone(cameraCone, state.camera);
  alertLabel.textContent = state.alert.toUpperCase(); alertLabel.className = state.alert;
  riskBar.style.width = `${state.exposure.toFixed(0)}%`; riskValue.textContent = `${state.exposure.toFixed(0)}%`;
  if (state.phase === 'caught') end.hidden = false;
  renderer.render(scene, camera); requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
