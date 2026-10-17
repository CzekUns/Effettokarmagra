import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {buildRoadGraph} from './roads.mjs';
import {buildTurnGuides,guideIntersection} from './intersection-assist.mjs';

const graph={nodes:[{x:-20,y:0,out:[0]},{x:0,y:0,out:[1,2,3]},
 {x:20,y:0,out:[]},{x:0,y:20,out:[]},{x:0,y:-20,out:[]}],edges:[
 {from:0,to:1,car:true,angle:0,roadId:10},
 {from:1,to:2,car:true,angle:0,roadId:11},
 {from:1,to:3,car:true,angle:Math.PI/2,roadId:12},
 {from:1,to:4,car:true,angle:-Math.PI/2,roadId:13}
 ]};
const guides=buildTurnGuides(graph),road={road:{id:10}};

test('a small steer near a legal junction chooses the intended exit; straight input does not',()=>{
 const car={x:-12,y:0,angle:0,speed:24};
 assert.equal(guideIntersection(car,0,road,graph,guides,null,.016).turn,null);
 const right=guideIntersection(car,.25,road,graph,guides,null,.016);
 const left=guideIntersection(car,-.25,road,graph,guides,null,.016);
 assert.equal(right.turn.out,2);
 assert.equal(left.turn.out,3);
 assert.ok(guideIntersection({...car,x:-6,speed:11},.25,road,graph,guides,right.turn,.016).angle>0);
 assert.ok(guideIntersection({...car,x:-6,speed:11},-.25,road,graph,guides,left.turn,.016).angle<0);
 assert.ok(right.speed<car.speed);
 assert.equal(guideIntersection({...car,x:-27},.25,road,graph,guides,null,.016).turn,null);
 assert.equal(guideIntersection(car,.8,road,graph,guides,null,.016).turn,null,'strong steering stays manual');
});

test('turn stays selected after releasing the stick and respects a new strong override',()=>{
 const start={x:-12,y:0,angle:0,speed:24};
 const first=guideIntersection(start,.25,road,graph,guides,null,.016);
 const next=guideIntersection({...start,angle:first.angle},0,road,graph,guides,first.turn,.016);
 assert.equal(next.turn.out,2);
 assert.equal(guideIntersection(start,-.8,road,graph,guides,next.turn,.016).turn,null);
 assert.equal(guideIntersection({...start,speed:-3},.25,road,graph,guides,null,.016).turn,null);
});

test('assisted right turn keeps a six-point car on a narrow road or its sidewalk',()=>{
 let car={x:-12,y:0,angle:0,speed:24},turn=null,finished=false;
 for(let i=0;i<110;i++){
  const next=guideIntersection(car,i<4?.25:0,road,graph,guides,turn,1/60);
  if(turn&&!next.turn)finished=true;
  turn=next.turn;car={...car,angle:next.angle,speed:next.speed};
  car.x+=Math.cos(car.angle)*car.speed/60;
  car.y+=Math.sin(car.angle)*car.speed/60;
  for(const forward of [-2.6,0,3.4])for(const side of [-1.7,1.7]){
   const px=car.x+Math.cos(car.angle)*forward-Math.sin(car.angle)*side;
   const py=car.y+Math.sin(car.angle)*forward+Math.cos(car.angle)*side;
   const onIncoming=Math.abs(py)<=6.5&&px>=-20&&px<=0;
   const onExit=Math.abs(px)<=6.5&&py>=0&&py<=20;
   assert.ok(onIncoming||onExit,`car probe left the narrow junction at ${px.toFixed(1)}, ${py.toFixed(1)}`);
  }
 }
 assert.ok(finished,'turn guide should hand back to ordinary road assistance');
 assert.ok(car.y>12&&Math.abs(car.x)<3,'car continues along the chosen exit');
});

test('guides are built from real directed road graph without modifying OSM geometry',async()=>{
 const map=JSON.parse(await readFile(new URL('./data/melito-map.json',import.meta.url),'utf8'));
 const original=map.roads[0].p.slice();
 const network=buildRoadGraph(map.roads),actual=buildTurnGuides(network);
 assert.ok(actual.length>40,'Melito has a substantial set of turns');
 assert.deepEqual(map.roads[0].p,original);
 for(const guide of actual)for(const approach of guide.approaches)for(const turn of approach.turns)
  assert.equal(network.edges[turn.out].car,true,'suggested exits are legal car edges');
});
