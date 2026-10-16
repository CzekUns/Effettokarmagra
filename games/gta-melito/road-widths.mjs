/* GTA Melito 0.4.2 — coherent arcade street proportions.
 * OpenStreetMap stores road CENTRELINES; the prior road.w is a generic
 * renderer estimate, not a surveyed kerb-to-kerb width. Never mutate that
 * source metadata. These multipliers are stylised GAME widths only. */
export const ROAD_WIDTH_MULTIPLIER=Object.freeze({
 motorway:1.32,trunk:1.4,primary:1.5,secondary:1.6,
 tertiary:1.72,unclassified:1.88,residential:1.9,
 living_street:1.8,service:1.8,track:1.5,
 pedestrian:1.35,footway:1.2,path:1.18,steps:1.1,cycleway:1.15
});
export function visualRoadWidth(road){
 if(!road)return 0;
 const raw=Number(road.w);
 if(!Number.isFinite(raw)||raw<=0)return 0;
 const mult=ROAD_WIDTH_MULTIPLIER[road.t]??1.5;
 return Math.round(raw*mult*10)/10;
}
export function roadTrafficLaneOffset(width){
 return Math.min(3.6,Math.max(.65,width*.23));
}
