import test from 'node:test';
import assert from 'node:assert/strict';
import { spriteView, animationPose } from './reference-sprites.mjs';

test('la vista cambia con direzione del personaggio e orbita della camera', () => {
  assert.deepEqual(spriteView(0, 0, 0, 4, 0), { view: 'front', flip: false });
  assert.deepEqual(spriteView(0, 0, 0, -4, 0), { view: 'back', flip: false });
  assert.deepEqual(spriteView(0, 0, 0, 0, 4), { view: 'side', flip: false });
  assert.deepEqual(spriteView(0, 0, 0, 0, -4), { view: 'side', flip: true });
  assert.deepEqual(spriteView(Math.PI / 2, 0, 0, 0, 4), { view: 'front', flip: false });
});

test('camminata, passo basso, prelievo e corsa selezionano fotogrammi distinti', () => {
  const base={facing:0,x:0,z:0,cameraX:4,cameraZ:0};
  assert.deepEqual(animationPose(base),{direction:'front',state:'idle',frame:0});
  for(let n=0;n<4;n++)assert.equal(animationPose({...base,moving:true,stride:n}).frame,n);
  assert.deepEqual(animationPose({...base,moving:true,crouch:true,stride:2}),{direction:'front',state:'crouch',frame:2});
  assert.deepEqual(animationPose({...base,moving:true,taking:true,stride:3}),{direction:'front',state:'take',frame:0});
  assert.deepEqual(animationPose({...base,moving:true,chasing:true,stride:3}),{direction:'front',state:'run',frame:3});
});

test('orbita e inversione di marcia danno quattro direzioni senza alterare il passo', () => {
  const base={facing:0,x:0,z:0,moving:true,stride:2};
  assert.equal(animationPose({...base,cameraX:4,cameraZ:0}).direction,'front');
  assert.equal(animationPose({...base,cameraX:-4,cameraZ:0}).direction,'back');
  assert.equal(animationPose({...base,cameraX:0,cameraZ:4}).direction,'right');
  assert.equal(animationPose({...base,cameraX:0,cameraZ:-4}).direction,'left');
  assert.equal(animationPose({...base,facing:Math.PI,cameraX:4,cameraZ:0}).direction,'back');
  assert.equal(animationPose({...base,cameraX:0,cameraZ:-4}).frame,2);
});
