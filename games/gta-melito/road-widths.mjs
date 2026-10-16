/* GTA Melito 0.4.3 — synchronized visual / simulation road proportions.
 * OSM road.w stays immutable. 'before' is the original pre-0.4.2 arcade
 * rendition for an in-game A/B comparison; wide is the new default. */
export const ROAD_WIDTH_MULTIPLIER=Object.freeze({
 motorway:1.42,trunk:1.55,primary:1.75,secondary:1.90,
 tertiary:2.08,unclassified:2.18,residential:2.20,
 living_street:2.12,service:2.0,track:1.55,
 pedestrian:1.35,footway:1.2,path:1.18,steps:1.1,cycleway:1.15
});
let mode='wide';
export function getRoadWidthMode(){return mode;}
export function setRoadWidthMode(value){
 if(value!=='wide'&&value!=='before')throw new RangeError('Unknown road width mode: '+value);
 mode=value;
 return mode;
}
export function visualRoadWidth(road){
 if(!road)return 0;
 const w=Number(road.w);
 if(!Number.isFinite(w)||w<=0)return 0;
 if(mode==='before')return w;
 const mult=ROAD_WIDTH_MULTIPLIER[road.t]??1.9;
 return Math.round(w*mult*10)/10;
}
export function roadTrafficLaneOffset(width){
 return Math.min(4.0,Math.max(.65,width*.23));
}
