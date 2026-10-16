import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {buildRoadGraph,createAgents,stepAgents,chooseTurn,DRIVABLE} from './roads.mjs';
import {buildStreetProps,sampleRoad} from './visuals.mjs';

const map=JSON.parse(await readFile(new URL('./data/melito-map.json',import.meta.url),'utf8'));
const graph=buildRoadGraph(map.roads);
test('Melito cartographic source is real OSM and bounded to ISTAT coordinates',()=>{
 assert.equal(map.source,'OpenStreetMap');
 assert.equal(map.license,'ODbL 1.0');
 assert.ok(map.roads.length>400);
 assert.ok(map.buildings.length>1000);
 assert.ok(map.projection.width>1700);
 assert.ok(map.projection.height>2200);
 assert.ok(map.roads.some(r=>/via roma/i.test(r.n)));
 assert.ok(map.roads.some(r=>/corso europa/i.test(r.n)));
});
test('road graph joins actual OSM crossroads',()=>{
 assert.ok(graph.nodes.length>500);
 assert.ok(graph.edges.length>1000);
 assert.ok(graph.junctions>40);
 assert.ok(graph.trafficStarts.length>400);
 assert.ok(graph.walkStarts.length>400);
 for(const edge of graph.edges){
  assert.ok(edge.len>0&&Number.isFinite(edge.angle));
  assert.ok(edge.from>=0&&edge.from<graph.nodes.length);
  assert.ok(edge.to>=0&&edge.to<graph.nodes.length);
 }
});
test('oneway roads are respected by drivers but can be reversed on foot',()=>{
 const g=buildRoadGraph([
  {id:1,n:'Via sola andata',t:'residential',o:true,w:7,p:[0,0,20,0]},
  {id:2,n:'Vicolo',t:'footway',o:false,w:2,p:[20,0,20,10]}
 ]);
 assert.equal(g.trafficStarts.length,1);
 assert.equal(g.walkStarts.length,4);
 const forward=g.edges[g.trafficStarts[0]];
 assert.equal(forward.from,0);assert.equal(forward.to,1);
 assert.equal(g.nodes[1].out.filter(i=>g.edges[i].car).length,0);
});
test('AI cars and pedestrians move through connected real intersections',()=>{
 const cars=createAgents(graph,140,189,'car');
 const people=createAgents(graph,190,310,'walk');
 const start=cars.map(a=>({x:a.x,y:a.y,edge:a.edge}));
 const seen=new Set();
 for(let t=0;t<400;t++){
  stepAgents(graph,cars,.04,{x:-999,y:-999});
  stepAgents(graph,people,.04);
  if(t%10===0)for(const car of cars)seen.add(car.edge);
 }
 assert.ok(seen.size>140);
 assert.ok(cars.some((car,i)=>car.edge!==start[i].edge));
 for(const a of [...cars,...people]){
  assert.ok(Number.isFinite(a.x)&&Number.isFinite(a.y)&&Number.isFinite(a.a));
  assert.ok(a.x>=-150&&a.x<=map.projection.width+150);
  assert.ok(a.y>=-150&&a.y<=map.projection.height+150);
 }
});
test('street props and building footprints remain deterministic',()=>{
 const a=buildStreetProps(map.roads),b=buildStreetProps(map.roads);
 assert.ok(a.length>700);
 assert.deepEqual(a,b);
 assert.equal(new Set(map.buildings.map(x=>x.id)).size,map.buildings.length);
 assert.ok(map.buildings.every(x=>x.p.length>=8&&x.p.every(Number.isFinite)));
});
test('road sampling preserves geometric direction and length',()=>{
 const p=[0,0,10,0,10,30];
 assert.deepEqual(sampleRoad(p,5),{x:5,y:0,a:0});
 assert.deepEqual(sampleRoad(p,15),{x:10,y:5,a:Math.PI/2});
 assert.equal(sampleRoad(p,41),null);
});
