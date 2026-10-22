// Pick the view seen by the orbiting camera, measured around the actor.
export function spriteView(facing, x, z, cameraX, cameraZ) {
  const cameraAngle = Math.atan2(cameraZ - z, cameraX - x);
  const offset = Math.atan2(Math.sin(cameraAngle - facing), Math.cos(cameraAngle - facing));
  if (Math.abs(offset) <= Math.PI / 4) return { view: 'front', flip: false };
  if (Math.abs(offset) >= 3 * Math.PI / 4) return { view: 'back', flip: false };
  return { view: 'side', flip: offset < 0 };
}

// View and gait are independent: orbiting the camera changes view, while walking
// advances frames only when the actor actually moves across the floor.
export function animationPose({ facing, x, z, cameraX, cameraZ, moving = false,
  crouch = false, taking = false, chasing = false, stride = 0 }) {
  const { view, flip } = spriteView(facing, x, z, cameraX, cameraZ);
  const direction = view === 'side' ? (flip ? 'left' : 'right') : view;
  const state = taking ? 'take' : chasing ? 'run' : crouch ? 'crouch' : moving ? 'walk' : 'idle';
  const frame = state === 'idle' || state === 'take' || (state === 'crouch' && !moving)
    ? 0 : ((Math.floor(Math.max(0, stride)) % 4) + 4) % 4;
  return { direction, state, frame };
}
