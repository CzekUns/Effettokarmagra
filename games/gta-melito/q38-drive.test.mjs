import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {buildRoadGraph} from './roads.mjs';
import {placeIndex,searchPlaces,planDriveRoute,nearestEdge,createDrive,setDestination,stepDrive,cancelDrive,instructionText,locateOnRoute,DRIVE_RULES} from './drive-app.mjs';

const map=JSON.parse(await readFile(new URL('./data/melito-map.json',import.meta.url),'utf8'));
const graph=buildRoadGraph(map.roads);
const places=placeIndex({roads:map.roads,pois:map.pois});
const game=await readFile(new URL('./game.mjs',import.meta.url),'utf8');
const src=await readFile(new URL('./drive-app.mjs',import.meta.url),'utf8');

// Ogni punto del percorso deve stare su un tratto del grafo (nessuna rotta fuori strada).
function onRoads(route,mode){
 for(let i=1;i<route.points.length;i++){
  const [ax,ay]=route.points[i-1],[bx,by]=route.points[i];
  for(const t of [.25,.5,.75]){const e=nearestEdge(graph,ax+(bx-ax)*t,ay+(by-ay)*t,mode,20);if(!e||e.distance>DRIVE_RULES.snapMetres+1)return false;}
 }
 return true;
}

test('Q38 search: OSM street names and map POIs, accents and case ignored, unknown place not found',()=>{
 assert.ok(searchPlaces('via roma',places).some(p=>p.name==='Via Roma'&&p.kind==='via'));
 assert.equal(searchPlaces('MUNICIPIO',places)[0].name,'Municipio di Melito di Napoli');
 assert.ok(searchPlaces('ufficio postale',places).length>=1);
 assert.deepEqual(searchPlaces('Via Inesistente 999',places),[]);
 assert.deepEqual(searchPlaces('x',places),[],'at least two letters');
 const roadNames=new Set(map.roads.map(r=>r.n).filter(Boolean)),poiNames=new Set(map.pois.map(p=>p.n));
 for(const p of places)assert.ok(p.kind==='via'?roadNames.has(p.name):poiNames.has(p.name),'only real names: '+p.name);
 assert.equal(/google/i.test(src),false,'no Google brand');
});

test('Q38 route: valid path on the road graph between two real places, one-way respected by car',()=>{
 const a=searchPlaces('municipio',places)[0],b=searchPlaces('ufficio postale melito 1',places)[0];
 const route=planDriveRoute(graph,a,b,'car');
 assert.ok(route&&route.points.length>2,'route found');
 assert.ok(route.length>Math.hypot(b.x-a.x,b.y-a.y)*.9,'not shorter than the straight line');
 assert.ok(onRoads(route,'car'),'every leg on a road');
 for(const id of route.edges.slice(1,-1))assert.ok(graph.edges[id].car,'car edges only');
 // sensi unici: nessun tratto percorso contro il verso (gli archi carrabili esistono solo nel verso consentito)
 const oneWay=graph.edges.filter(e=>!e.car&&map.roads.find(r=>r.id===e.roadId)?.o);
 assert.ok(oneWay.length>0,'the map has one-way streets');
 for(const id of route.edges)assert.notEqual(graph.edges[id].car,false);
 const walk=planDriveRoute(graph,a,b,'walk');
 assert.ok(walk&&onRoads(walk,'walk'),'walking route too');
});

test('Q38 instructions: «tra N m gira a destra/sinistra», off-route recalculation and ARRIVATO, cancel',()=>{
 const a=searchPlaces('municipio',places)[0],b=searchPlaces('ufficio postale melito 1',places)[0];
 const drive=createDrive();
 assert.equal(setDestination(drive,b,{graph,player:{x:a.x,y:a.y},mode:'car'}),true);
 assert.match(instructionText(drive),/^(tra \d+ m (gira|inverti\/gira stretto) a (destra|sinistra)|prosegui dritto per \d+ m)$/);
 assert.ok(drive.remaining>100);
 // deviazione: il giocatore si sposta lontano dal percorso, su un'altra strada
 const far=graph.nodes.find(n=>locateOnRoute(drive.route,n.x,n.y).d>120&&Math.hypot(n.x-b.x,n.y-b.y)>200&&n.out.some(id=>graph.edges[id].car));
 const before=drive.recalcs;
 stepDrive(drive,far,{graph,mode:'car'},2);
 assert.equal(drive.recalcs,before+1,'recalculated');
 assert.ok(locateOnRoute(drive.route,far.x,far.y).d<DRIVE_RULES.offRouteMetres,'new route starts where the player is');
 // arrivo
 stepDrive(drive,{x:b.x+3,y:b.y-2},{graph,mode:'car'},2);
 assert.equal(drive.arrived,true);
 assert.match(instructionText(drive),/^ARRIVATO · UFFICIO POSTALE MELITO 1$/);
 cancelDrive(drive);assert.equal(drive.destination,null);assert.equal(instructionText(drive),'');
});

test('Q38 game wiring: route on the minimap, banner on top, stepped every frame, not inside the bank',()=>{
 assert.match(game,/drawDriveRoute\(r,drive,state\.mini\);/);
 assert.match(game,/tick\(dt\);draw\(dt\);drawMini\(\);updateCityAudio\(\);updateDrive\(dt\);/);
 assert.match(game,/if\(!drive\.destination\|\|!state\.ready\|\|state\.bankInterior\)\{banner\.hidden=true;return;\}/);
 assert.match(game,/mode:state\.player\.car>=0\?'car':'walk'/);
 assert.match(game,/driveUi=mountDriveApp\(document,phoneUi\.elements\?\.drive,/);
});
