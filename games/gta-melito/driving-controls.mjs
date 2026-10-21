/* GTA Melito: independent steering and throttle. Holding the wheel alone
 * does not accelerate; the right-hand accelerator and brake are separate. */
export const WALK_SPEED=8.5;
export const RUN_SPEED=13;
export const CAR_FORWARD_SPEED=40;
export const CAR_REVERSE_SPEED=12;

import {stepVehicle,CAR_HANDLING} from './vehicle-handling.mjs?v=010';

// Q10: same physics, numbers from a handling profile (default = the historical car values).
export function stepDriving(speed,angle,axis,braking,dt,serviceBrake=false,profile=CAR_HANDLING,wet=0){
 return stepVehicle(speed,angle,axis,braking,dt,serviceBrake,profile,wet);
}

