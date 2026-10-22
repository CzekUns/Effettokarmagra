// Camera cinematografica del campione. Coordinate sul piano X/Z, Y verticale.
// Lo stato e le trasformazioni pure sono separati da Three.js per poterli testare.
import { LIMITS } from './reference-play-logic.mjs?v=5';
const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
const lerp = (a, b, t) => a + (b - a) * t;
const smoothing = (rate, seconds) => 1 - Math.exp(-rate * clamp(seconds, 0, .1));
const shortestAngle = (a, b) => Math.atan2(Math.sin(b - a), Math.cos(b - a));
export const CAMERA_DEFAULT_YAW = .49;
export const CAMERA_MIN_ZOOM = .73;
export const CAMERA_MAX_ZOOM = 1.42;

export function createCameraRig(player) {
  return {
    yaw: CAMERA_DEFAULT_YAW, targetYaw: CAMERA_DEFAULT_YAW,
    zoom: 1, targetZoom: 1,
    focusX: player.x, focusZ: player.z,
    lookAheadX: 0, lookAheadZ: 0
  };
}

// Tutti i comandi di movimento restano relativi allo schermo anche ruotando la camera.
export function cameraRelativeMovement(screenX, screenZ, yaw) {
  return {
    x: screenX * Math.cos(yaw) + screenZ * Math.sin(yaw),
    z: -screenX * Math.sin(yaw) + screenZ * Math.cos(yaw)
  };
}

export function orbitCamera(rig, radians) {
  if (Number.isFinite(radians)) rig.targetYaw += radians;
}
export function zoomCamera(rig, difference) {
  if (Number.isFinite(difference)) rig.targetZoom = clamp(rig.targetZoom + difference, CAMERA_MIN_ZOOM, CAMERA_MAX_ZOOM);
}
export function centerCamera(rig) {
  rig.targetYaw = CAMERA_DEFAULT_YAW;
  rig.targetZoom = 1;
}

export function updateCameraRig(rig, player, movement, seconds, aspect = 16 / 9) {
  const yawT = smoothing(7.5, seconds);
  const followT = smoothing(6.5, seconds);
  const leadT = smoothing(5.5, seconds);
  rig.yaw += shortestAngle(rig.yaw, rig.targetYaw) * yawT;
  rig.zoom = lerp(rig.zoom, rig.targetZoom, smoothing(7, seconds));
  const magnitude = Math.hypot(movement.x, movement.z);
  const leadX = magnitude > .04 ? movement.x / magnitude * .63 : 0;
  const leadZ = magnitude > .04 ? movement.z / magnitude * .63 : 0;
  rig.lookAheadX = lerp(rig.lookAheadX, leadX, leadT);
  rig.lookAheadZ = lerp(rig.lookAheadZ, leadZ, leadT);
  // Seguire un po' in anticipo, senza spostare Ipno troppo ai margini dello schermo.
  rig.focusX = lerp(rig.focusX, clamp(player.x + rig.lookAheadX, LIMITS.minX+.35, LIMITS.maxX-.35), followT);
  rig.focusZ = lerp(rig.focusZ, clamp(player.z + rig.lookAheadZ, LIMITS.minZ+.35, LIMITS.maxZ-.35), followT);
  // Nel landscape basso si allarga appena il campo inquadrato.
  const framing = aspect > 2 ? 1.08 : 1;
  const distance = 10.7 * rig.zoom * framing;
  const horizontal = distance * Math.cos(.6);
  return {
    x: rig.focusX + Math.sin(rig.yaw) * horizontal,
    y: .85 + distance * Math.sin(.6),
    z: rig.focusZ + Math.cos(rig.yaw) * horizontal,
    lookX: rig.focusX,
    lookY: .85,
    lookZ: rig.focusZ
  };
}
