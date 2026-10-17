import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {auditDrivingTour,DRIVE_ROAD_TYPES,withinDriveSurface,nearestDrivableRoad,canDriveProbe} from './road-clearance.mjs';
import {buildStreetProps} from './visuals.mjs';
import {visualRoadWidth} from './road-widths.mjs';
import {SIDEWALK_DRIVE,SIDEWALK_OUTER} from './sidewalk.mjs';

const map=JSON.parse(await readFile(new URL('./data/melito-map.json',import.meta.url),'utf8'));
const infill=JSON.parse(await readFile(new URL('./data/urban-infill.json',import.meta.url),'utf8'));

test('automatic car tour audits every drivable OSM way and clears mapped building overlap',()=>{
 const buildings=[...map.buildings,...infill.buildings];
 const before=map.buildings.map(b=>b.p.slice());
 const report=auditDrivingTour(map.roads,buildings,{spacing:6});
 assert.equal(report.roadWays,map.roads.filter(r=>DRIVE_ROAD_TYPES.has(r.t)&&r.p.length>=4).length);
 assert.ok(report.roadsVisited>500,'the sweep must cover the whole municipal road grid');
 assert.ok(report.samples>11000,'the tour must test car footprints along complete ways');
 assert.ok(report.blockedPairs>50,'the scan should catch current OSM road/building overlap');
 assert.ok(report.overlappingProbes>0);
 assert.equal(report.unresolvedProbes,0,'road surface priority clears every building overlap');
 assert.deepEqual(map.buildings.map(b=>b.p),before,'the tour cannot mutate OSM geometry');
 assert.ok(report.roadIds.length>500);
});

test('car road clearance fits narrow roads and the render mask is above buildings',async()=>{
 const road=map.roads.find(r=>DRIVE_ROAD_TYPES.has(r.t)&&r.p.length>=4);
 assert.ok(withinDriveSurface(road.p[0],road.p[1],[road]));
 assert.equal(withinDriveSurface(road.p[0]+80,road.p[1]+80,[road]),false);
 const game=await readFile(new URL('./game.mjs',import.meta.url),'utf8');
 const underlay=game.indexOf('drawCityStreets(ctx,roads,zoom)');
 const buildings=game.indexOf('drawCityBuildings(ctx,[...inferred,...buildings],zoom)');
 const overlay=game.indexOf('drawCityStreets(ctx,roads,zoom,{surfaceOnly:true})',underlay+1);
 assert.ok(underlay<buildings&&buildings<overlay,'street mask must paint over buildings that bleed into lanes');
 assert.match(game,/canDriveProbe\(road\.distance,width/);
 const visuals=await readFile(new URL('./visuals.mjs',import.meta.url),'utf8');
 assert.match(visuals,/visualRoadWidth\(road\)\/2\+9\.2/,'larger tree crowns need clearance beyond the curb');
 const props=buildStreetProps(map.roads);
 assert.ok(props.length>800,'enough decorative street props remain after clearance filtering');
 for(const prop of props){
  const closest=nearestDrivableRoad(prop.x,prop.y,map.roads,40);
  assert.ok(!closest||closest.distance>=visualRoadWidth(closest.road)/2+4.4,
   'street prop '+prop.roadId+' overlaps a drivable road');
 }
 assert.ok(game.includes("visuals.mjs?v=090"),'street prop change must bypass the browser cache');
});

test('car may cross the painted sidewalk but not drive through a building or beyond its edge',()=>{
 const width=15.4;
 assert.equal(canDriveProbe(6,width,true),true,'mapped building overlap on asphalt is cleared');
 assert.equal(canDriveProbe(8.6,width,false),true,'sidewalk is traversable');
 assert.equal(canDriveProbe(8.6,width,true),false,'building on sidewalk is solid');
 assert.equal(canDriveProbe(width/2+SIDEWALK_DRIVE,width,false),true,'wider sidewalk is traversable to its safe edge');
 assert.equal(canDriveProbe(width/2+SIDEWALK_DRIVE+.1,width,false),false,'outer rim is not a driving surface');
 assert.ok(SIDEWALK_OUTER>SIDEWALK_DRIVE,'paint extends outside the drivable strip');
});
