import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {ROAD_WIDTH_MULTIPLIER,visualRoadWidth,roadTrafficLaneOffset,setRoadWidthMode,getRoadWidthMode} from './road-widths.mjs?v=043';
import {buildRoadGraph,createAgents,stepAgents} from './roads.mjs';
import {buildStreetProps,drawCrosswalks} from './visuals.mjs';
import {drawCityStreets} from './city-art.mjs';
import {prepareStorefronts} from './storefronts.mjs';
const map=JSON.parse(await readFile(new URL('./data/melito-map.json',import.meta.url),'utf8'));

test('wide arcade streets keep original OSM geometry and source metadata',()=>{
 const first=map.roads.find(r=>r.t==='residential');
 assert.ok(first);
 const coords=first.p.slice(),width=first.w;
 assert.equal(visualRoadWidth(first),Math.round(first.w*2.2*10)/10);
 assert.ok(visualRoadWidth(first)>=first.w*2.15);
 assert.deepEqual(first.p,coords);
 assert.equal(first.w,width,'do not rewrite estimated OSM source width');
 assert.equal(visualRoadWidth({w:5,t:'service'}),10);
 assert.equal(visualRoadWidth({w:2.4,t:'footway'}),2.9);
 assert.equal(visualRoadWidth({w:7,t:'residential'}),15.4);
 assert.equal(visualRoadWidth({w:9,t:'tertiary'}),18.7);
 assert.equal(visualRoadWidth({w:11,t:'secondary'}),20.9);
 assert.equal(visualRoadWidth({w:0,t:'primary'}),0);
 assert.equal(visualRoadWidth({w:NaN,t:'primary'}),0);
 assert.ok(ROAD_WIDTH_MULTIPLIER.primary>1);
});
test('traffic graph, pedestrian placement and lane offsets use the new street width',()=>{
 const graph=buildRoadGraph(map.roads);
 const sample=map.roads.find(r=>r.t==='residential'&&graph.edges.some(e=>e.roadId===r.id));
 assert.ok(sample);
 const e=graph.edges.find(e=>e.roadId===sample.id);
 assert.equal(e.streetWidth,visualRoadWidth(sample));
 const agents=createAgents(graph,28,77,'car'),people=createAgents(graph,20,42,'walk');
 for(let tick=0;tick<90;tick++){stepAgents(graph,agents,.04);stepAgents(graph,people,.04);}
 assert.ok(agents.every(a=>Number.isFinite(a.x)&&Number.isFinite(a.y)));
 assert.ok(roadTrafficLaneOffset(15.4)>3.0);
 assert.ok(roadTrafficLaneOffset(15.4)<15.4/2-2);
 const props=buildStreetProps([{
  id:101,n:'Example',t:'residential',w:7,p:[0,0,150,0]
 }]);
 assert.ok(props.length>=2);
 assert.ok(props.every(p=>Math.abs(p.y)>=visualRoadWidth({w:7,t:'residential'})/2+3));
});
test('asphalt and sidewalks are drawn with the visual multiplier, not the old 7m width',()=>{
 const widths=[];
 const ctx=new Proxy({
  lineWidth:1,
  stroke(){widths.push(this.lineWidth);},
  setLineDash(){}
 },{get:(obj,p)=>p in obj?obj[p]:(..._)=>{}});
 const road={id:102,n:'Via test',t:'residential',w:7,p:[0,0,100,0]};
 drawCityStreets(ctx,[road],2.5);
 assert.ok(widths.some(n=>Math.abs(n-(visualRoadWidth(road)-.5))<.01));
 assert.ok(widths.some(n=>Math.abs(n-(visualRoadWidth(road)+5.2))<.01));
 assert.ok(!widths.some(n=>n===6.5),'old asphalt width must not be used');
});
test('commercial frontage and crosswalks share the wider road estimate',()=>{
 const target=map.pois.find(q=>q.k==='post_office');
 const shops=prepareStorefronts([target],map.roads);
 assert.equal(shops.length,1);
 assert.ok(Number.isFinite(shops[0].x)&&Number.isFinite(shops[0].y));
 const graph=buildRoadGraph([
  {id:1,t:'residential',w:7,n:'east-west',p:[-30,0,0,0,30,0]},
  {id:2,t:'residential',w:7,n:'north-south',p:[0,-30,0,0,0,30]}
 ]);
 const widths=[];
 const ctx=new Proxy({lineWidth:1,fillRect(_x,_y,_w,_h){widths.push(_h);}},
 {get:(o,p)=>p in o?o[p]:(..._)=>{}});
 drawCrosswalks(ctx,graph,[-50,-50,50,50],2.6);
 assert.ok(widths.some(n=>n>11),'crosswalks should span the expanded lane width');
});

test('A/B comparison changes road geometry in real-time and can restore the wider default',()=>{
 const r={w:7,t:'residential'};
 assert.equal(getRoadWidthMode(),'wide');
 assert.equal(visualRoadWidth(r),15.4);
 setRoadWidthMode('before');
 assert.equal(getRoadWidthMode(),'before');
 assert.equal(visualRoadWidth(r),7);
 const narrow=buildRoadGraph([{id:1,n:'Via prova',t:'residential',w:7,p:[0,0,20,0]}]);
 assert.equal(narrow.edges[0].streetWidth,7);
 setRoadWidthMode('wide');
 assert.equal(visualRoadWidth(r),15.4);
 const wide=buildRoadGraph([{id:1,n:'Via prova',t:'residential',w:7,p:[0,0,20,0]}]);
 assert.equal(wide.edges[0].streetWidth,15.4);
 assert.throws(()=>setRoadWidthMode('invalid'),RangeError);
});
test('every consumer imports the same versioned road-width module for A/B',async()=>{
 const jsFiles=['game.mjs','city-art.mjs','visuals.mjs','roads.mjs','storefronts.mjs'];
 for(const file of jsFiles){
  const text=await readFile(new URL('./'+file,import.meta.url),'utf8');
  assert.ok(text.includes("'./road-widths.mjs?v=043'"),file+' requires versioned singleton');
 }
 const html=await readFile(new URL('./index.html',import.meta.url),'utf8');
 assert.ok(html.includes('game.mjs?v=043'));
 assert.ok(html.includes('id="road-width-compare"'));
 assert.ok(html.includes('id="road-width-current"'));
});
