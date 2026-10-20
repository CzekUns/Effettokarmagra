/* BF14 (20/10/2026): the ONE place for how big vehicles and people are against the OSM streets.
 * Streets, pavements and buildings keep their sizes. Vehicles are drawn and collide
 * VEHICLE_SCALE smaller (sprites, collision boxes, street probes, lanes, parking stalls, queue
 * gaps), people PERSON_SCALE smaller (sprites and walking radii), and the camera zooms in by
 * CAMERA_SCALE_GAIN, so on screen they look nearly as before while a parked car no longer
 * covers the traffic lane. Change these numbers to tune the whole game in one go. */
export const VEHICLE_SCALE=.75;
export const PERSON_SCALE=.8;
export const CAMERA_SCALE_GAIN=1.2;
export const vs=value=>value*VEHICLE_SCALE;
export const ps=value=>value*PERSON_SCALE;
