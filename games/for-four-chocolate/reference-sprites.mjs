// Pick the view seen by the orbiting camera, measured around the actor.
export function spriteView(facing, x, z, cameraX, cameraZ) {
  const cameraAngle = Math.atan2(cameraZ - z, cameraX - x);
  const offset = Math.atan2(Math.sin(cameraAngle - facing), Math.cos(cameraAngle - facing));
  if (Math.abs(offset) <= Math.PI / 4) return { view: 'front', flip: false };
  if (Math.abs(offset) >= 3 * Math.PI / 4) return { view: 'back', flip: false };
  return { view: 'side', flip: offset < 0 };
}
