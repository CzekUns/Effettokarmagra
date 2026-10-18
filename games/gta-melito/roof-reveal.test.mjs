import {test} from 'node:test';
import assert from 'node:assert/strict';
import {buildingVolume} from './building-volume.mjs';
import {projectedRoofCovers,easeRoofReveal,traceRoofCover} from './roof-reveal.mjs';

const building={id:1,p:[0,0,20,0,20,20,0,20,0,0],h:12,
 art:{x0:0,y0:0,x1:20,y1:20,seed:1,type:'house'}};

test('the complete raised roof and its walls can cover a road point outside the mapped footprint',()=>{
 const v=buildingVolume(building),original=building.p.slice();
 assert.ok(projectedRoofCovers(building,10,-v.dy/2));
 assert.ok(projectedRoofCovers(building,10,10));
 assert.equal(projectedRoofCovers(building,30,30),false);
 const paths=[];
 const ctx={beginPath(){},moveTo(x,y){paths.push([x,y]);},lineTo(){},closePath(){}};
 traceRoofCover(ctx,building);
 assert.deepEqual(paths,[[0,0],[-v.dx,-v.dy]],'clip combines the ground footprint and the uncut roof');
 assert.deepEqual(building.p,original,'rendering must not alter OSM geometry');
});

test('roof opacity changes smoothly and returns to opaque after exiting',()=>{
 const first=easeRoofReveal(0,1,.016);
 assert.ok(first>0&&first<1);
 const half=easeRoofReveal(0,1,.032);
 assert.ok(Math.abs(easeRoofReveal(first,1,.016)-half)<1e-12);
 assert.ok(easeRoofReveal(half,0,.016)<half);
 assert.equal(easeRoofReveal(0,1,0),0);
});
