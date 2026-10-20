import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {buildRoadGraph,lanePosition,laneOffsetOf,fitLanesToBuildings} from './roads.mjs';
import {roadTrafficLaneOffset} from './road-widths.mjs';
import {vehicleCameraTarget} from './camera-zoom.mjs';
import {vs} from './world-scale.mjs';

// Via stretta est-ovest lunga 120 m; un palazzo invade il lato nord (y>0) da 3,0 m dalla mezzeria
// (BF14: con i veicoli più piccoli la corsia sta più vicina al centro; prima il palazzo era a 3,6 m)
// tra x=40 e x=80, come la chiesa di Santa Maria delle Grazie su Via Francesco Rossi.
const roads=[{id:1,n:'Via stretta',t:'residential',w:6,p:[0,0,60,0,120,0]}];
const church=(x,y)=>x>40&&x<80&&y>3.0&&y<30;
const clear=(x,y)=>!church(x,y);

test('Q15 NPC lanes on a narrow street stay clear of the building outlines (they drove under the church corner)',()=>{
 const plain=buildRoadGraph(roads),fitted=buildRoadGraph(roads,{laneClear:clear});
 const north=g=>g.edges.findIndex(e=>e.car&&Math.cos(e.angle)>0&&g.nodes[e.from].x===0);  // eastbound: its lane is on y>0
 const e0=plain.edges[north(plain)],e1=fitted.edges[north(fitted)];
 const lane=roadTrafficLaneOffset(e0.streetWidth);
 assert.ok(lane+vs(1.7)>3.0,'set-up: the default lane flank enters the building');
 const before=lanePosition(plain,north(plain),50/60,'car'),after=lanePosition(fitted,north(fitted),50/60,'car');
 assert.ok(church(before.x,before.y+vs(1.7)),'before: the car flank is inside the wall');
 assert.equal(church(after.x,after.y+vs(1.7)),false,'after: clear of the wall');
 assert.ok(laneOffsetOf(e1)<lane&&laneOffsetOf(e1)>=vs(1.75),'narrowed, but two cars can still pass each other');
 assert.ok(fitted.narrowedLanes>=1);
 // il lato senza palazzo e le vie larghe non cambiano
 const south=fitted.edges.findIndex(e=>e.car&&Math.cos(e.angle)<0&&fitted.nodes[e.from].x===60);  // westbound: lane on y<0
 assert.equal(fitted.edges[south].laneOffset,undefined);
});

test('Q15 lane fitting never goes below the passing minimum and leaves the junction ends alone',()=>{
 const wall=(x,y)=>!(y>1&&y<40);  // palazzo a 1 m dalla mezzeria: impossibile del tutto
 const g=buildRoadGraph(roads);fitLanesToBuildings(g,wall);
 for(const e of g.edges)if(e.car&&e.laneOffset!=null)assert.ok(e.laneOffset>=vs(1.75)-1e-9);
 const corner=(x,y)=>!(x>116&&y>2);  // solo l'angolo all'incrocio finale
 const g2=buildRoadGraph(roads);assert.equal(fitLanesToBuildings(g2,corner),0,'corners at the junction are left to the junction geometry');
});

test('Q15 in reverse the camera looks behind the car, where it is going',()=>{
 const car={x:100,y:200,a:0};
 const fwd=vehicleCameraTarget({...car,speed:12},1000,500,2),back=vehicleCameraTarget({...car,speed:-12},1000,500,2);
 assert.ok(fwd.x>car.x&&back.x<car.x,'lead flips with the direction of travel');
 const creep=vehicleCameraTarget({...car,speed:-.2},1000,500,2);assert.ok(Math.abs(creep.x-100)<3,'creeping: almost centred');
});

test('Q15 game wiring: lanes fitted on load and on the width switch, idle action button',async()=>{
 const [game,html,junctions]=await Promise.all(['game.mjs','index.html','junctions.mjs'].map(f=>readFile(new URL('./'+f,import.meta.url),'utf8')));
 assert.equal((game.match(/laneClear:\(x,y\)=>!buildingAt\(x,y\)/g)||[]).length,2);
 assert.match(junctions,/const off=e\.laneOffset\?\?roadTrafficLaneOffset\(e\.streetWidth\)/,'junction paths use the fitted lane');
 assert.match(game,/const idle=p\.car<0&&!eventAction&&!shopNear&&(?:!pitchNear&&)?(?:!garageNear&&)?(?:!shopDoor&&)?!bank&&!enterable;/);
 assert.match(html,/\.control-action\.idle\{opacity:\.5/);
 assert.ok(Number((html.match(/game\.mjs\?v=(\d+)/)||[])[1])>=168);
});
