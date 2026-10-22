import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createCameraRig, orbitCamera, zoomCamera, tiltCamera, centerCamera,
  updateCameraRig, cameraRelativeMovement, CAMERA_DEFAULT_YAW
} from './reference-camera.mjs';
import { LIMITS } from './reference-play-logic.mjs?v=8';

test('camera follows player with look-ahead and changes view position', () => {
  const rig = createCameraRig({ x: 0, z: 0 });
  const before = updateCameraRig(rig,{x:0,z:0},{x:0,z:0},.016);
  for(let i=0;i<45;i++) updateCameraRig(rig,{x:3,z:-1},{x:1,z:0},.016);
  const after = updateCameraRig(rig,{x:3,z:-1},{x:1,z:0},.016);
  assert.ok(after.lookX > 2 && after.lookZ < -.7);
  assert.ok(after.x > before.x + 2, 'camera must genuinely translate');
});
test('camera orbit and recenter', () => {
  const rig = createCameraRig({x:0,z:0});
  orbitCamera(rig,Math.PI/2);
  for(let i=0;i<70;i++) updateCameraRig(rig,{x:0,z:0},{x:0,z:0},.016);
  assert.ok(Math.abs(rig.yaw-(CAMERA_DEFAULT_YAW+Math.PI/2))<.02);
  centerCamera(rig);
  for(let i=0;i<70;i++) updateCameraRig(rig,{x:0,z:0},{x:0,z:0},.016);
  assert.ok(Math.abs(rig.yaw-CAMERA_DEFAULT_YAW)<.02);
});
test('zoom clamps to playable distances', () => {
  const rig=createCameraRig({x:0,z:0});
  zoomCamera(rig,-15);
  assert.equal(rig.targetZoom,.73);
  zoomCamera(rig,15);
  assert.equal(rig.targetZoom,1.42);
  centerCamera(rig);
  assert.equal(rig.targetZoom,1);
});
test('camera relative movement remains consistent when orbiting',()=>{
  const a=cameraRelativeMovement(1,0,0);
  const b=cameraRelativeMovement(1,0,Math.PI/2);
  assert.ok(Math.abs(a.x-1)<1e-8 && Math.abs(a.z)<1e-8);
  assert.ok(Math.abs(b.x)<1e-8 && Math.abs(b.z+1)<1e-8);
  assert.ok(Math.abs(Math.hypot(b.x,b.z)-1)<1e-8);
});
test('la levetta può inclinare la camera senza alterare i limiti dello zoom',()=>{
  const rig=createCameraRig({x:0,z:0});
  const before=updateCameraRig(rig,{x:0,z:0},{x:0,z:0},.05);
  tiltCamera(rig,.2);
  for(let i=0;i<40;i++)updateCameraRig(rig,{x:0,z:0},{x:0,z:0},.05);
  const after=updateCameraRig(rig,{x:0,z:0},{x:0,z:0},.05);
  assert.ok(after.y>before.y);
  tiltCamera(rig,10);assert.equal(rig.targetPitch,.83);
  tiltCamera(rig,-10);assert.equal(rig.targetPitch,.43);
  centerCamera(rig);assert.equal(rig.targetPitch,.6);
});
test('la camera resta dentro il supermercato anche negli angoli con zoom massimo',()=>{
  for(const player of [{x:LIMITS.minX+.4,z:LIMITS.minZ+.4},{x:LIMITS.minX+.4,z:LIMITS.maxZ-.4},
    {x:LIMITS.maxX-.4,z:LIMITS.minZ+.4},{x:LIMITS.maxX-.4,z:LIMITS.maxZ-.4}]){
    const rig=createCameraRig(player);
    zoomCamera(rig,1);
    for(let i=0;i<60;i++)updateCameraRig(rig,player,{x:0,z:0},.05);
    const view=updateCameraRig(rig,player,{x:0,z:0},.05);
    assert.ok(view.x>LIMITS.minX&&view.x<LIMITS.maxX);
    assert.ok(view.z>LIMITS.minZ&&view.z<LIMITS.maxZ);
    assert.ok(Math.abs(view.lookX-player.x)<.01&&Math.abs(view.lookZ-player.z)<.01);
  }
});
