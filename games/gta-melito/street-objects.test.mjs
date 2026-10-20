import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {placeStreetObjects,stepStreetObjects,bollardBlocksVehicle,bollardBlocksWalker,circleHitsVehicle,BIN_RADIUS,BOLLARD_RADIUS,WALKER_RADIUS} from './street-objects.mjs';
import {vehicleShape} from './traffic-collision.mjs';

// Strada di prova lungo x (larghezza 12) e una laterale; case oltre i 9 m dall'asse sul lato nord.
const roads=[{id:1,n:'Via Roma',t:'residential',w:6,p:[0,0,700,0]},{id:9,n:'Traversa',t:'residential',w:6,p:[350,-120,350,120]}];
const width=()=>12;
const house=(x,y)=>y<-11.5&&y>-40&&Math.abs(x-350)>9;
const onRoad=(x,y,m)=>Math.abs(y)<6+m&&x>=0&&x<=700||Math.abs(x-350)<6+m&&Math.abs(y)<=120;
const ctx={roadWidth:width,walkable:(x,y)=>x>=0&&x<=700&&Math.abs(y)<120&&!house(x,y),carriageway:onRoad,avoid:[{x:200,y:9.5,r:3}]};
const shape=vehicleShape({vehicleType:'car'});
const canMove=(x,y)=>ctx.walkable(x,y);

test('Q07 placement: bins on the pavement, bollards at the kerb, never in houses, on roads or on reserved spots',()=>{
 const a=placeStreetObjects(roads,ctx),b=placeStreetObjects(roads,ctx);
 assert.ok(a.bins.length>=4,'some bins: '+a.bins.length);assert.ok(a.bollards.length>=3,'some bollards: '+a.bollards.length);
 assert.deepEqual(a.bins.map(q=>[q.x,q.y]),b.bins.map(q=>[q.x,q.y]),'deterministic');
 for(const q of [...a.bins,...a.bollards]){
  assert.ok(ctx.walkable(q.x,q.y),'not inside a house');
  assert.equal(onRoad(q.x,q.y,.25),false,'not on a carriageway');
  assert.ok(Math.hypot(q.x-200,q.y-9.5)>=3,'clear of reserved spots (doors, trees, parked cars)');
 }
 const all=[...a.bins.map(q=>({...q,r:BIN_RADIUS})),...a.bollards.map(q=>({...q,r:BOLLARD_RADIUS}))];
 for(let i=0;i<all.length;i++)for(let j=i+1;j<all.length;j++)
  assert.ok(Math.hypot(all[i].x-all[j].x,all[i].y-all[j].y)>=all[i].r+all[j].r,'no overlaps');
 for(const q of a.bins)assert.ok(Math.abs(q.y)>=6+3.2||Math.abs(q.x-350)>=6+3.2,'bins stand behind the pedestrian line (+1,7 m from the kerb)');
});

function binAhead(){
 const objects=placeStreetObjects(roads,ctx),bin=objects.bins.find(q=>q.y>0&&!house(q.x,q.y));
 return {objects,bin};
}

test('Q07 a car at speed knocks a bin away and over; it never ends inside the car or a house, then comes to rest',()=>{
 const {objects,bin}=binAhead(),start={x:bin.x,y:bin.y};
 const car={x:bin.x,y:bin.y-5,a:Math.PI/2,vx:0,vy:12,shape};
 let maxSpeed=0;
 for(let i=0;i<60;i++){
  car.y+=car.vy*.05;
  stepStreetObjects(objects,.05,{vehicles:i<12?[car]:[],walkers:[],canMove,view:null});
  if(i<12)assert.equal(circleHitsVehicle(bin.x,bin.y,BIN_RADIUS-.05,car,shape),null,'pushed out of the car body');
  assert.ok(canMove(bin.x,bin.y),'never pushed into a house');
  maxSpeed=Math.max(maxSpeed,Math.hypot(bin.vx,bin.vy));
 }
 assert.ok(bin.y-start.y>2,'thrown ahead of the car: '+(bin.y-start.y).toFixed(2)+' m');
 assert.equal(bin.tipped,true,'a fast hit tips it over');
 assert.ok(maxSpeed>8);
 for(let i=0;i<80;i++)stepStreetObjects(objects,.05,{vehicles:[],walkers:[],canMove,view:null});
 assert.equal(Math.hypot(bin.vx,bin.vy),0,'friction brings it to rest');
});

test('Q07 a pedestrian nudges a bin out of the way without being moved by it',()=>{
 const {objects,bin}=binAhead(),start={x:bin.x,y:bin.y};
 const walker={x:bin.x-.6,y:bin.y};
 stepStreetObjects(objects,.05,{vehicles:[],walkers:[walker],canMove,view:null});
 assert.ok(Math.hypot(bin.x-walker.x,bin.y-walker.y)>=BIN_RADIUS+WALKER_RADIUS-1e-9,'no overlap left');
 assert.deepEqual(walker,{x:start.x-.6,y:start.y},'the pedestrian keeps its own path');
 for(let i=0;i<30;i++)stepStreetObjects(objects,.05,{vehicles:[],walkers:[],canMove,view:null});
 assert.ok(Math.hypot(bin.x-start.x,bin.y-start.y)<1.2,'a gentle nudge, not a kick');
 assert.equal(bin.tipped,false);
});

test('Q07 bollards are fixed: they stop cars and walkers, and bins bounce off them',()=>{
 const objects=placeStreetObjects(roads,ctx),post=objects.bollards[0];
 assert.ok(post);
 const before={x:post.x,y:post.y};
 assert.ok(bollardBlocksVehicle(objects,{x:post.x,y:post.y-2.5,a:Math.PI/2},shape),'car nose on the post');
 assert.equal(bollardBlocksVehicle(objects,{x:post.x,y:post.y-4,a:Math.PI/2},shape),null,'clear one metre before');
 assert.ok(bollardBlocksWalker(objects,post.x+.4,post.y));
 assert.equal(bollardBlocksWalker(objects,post.x,post.y+1),null,'one metre to the side is free (the next post of the row is 1,6 m along)');
 const bin=objects.bins[0];Object.assign(bin,{x:post.x-1.2,y:post.y,vx:10,vy:0});objects.awake.add(bin);
 for(let i=0;i<20;i++){
  stepStreetObjects(objects,.05,{vehicles:[],walkers:[],canMove:()=>true,view:null});
  assert.ok(Math.hypot(bin.x-post.x,bin.y-post.y)>=BIN_RADIUS+BOLLARD_RADIUS-.05,'does not pass through the post');
 }
 assert.deepEqual({x:post.x,y:post.y},before,'the post never moves');
});

test('Q07 recovery: a knocked bin goes back home only out of sight, after a while, and if its spot is free',()=>{
 const {objects,bin}=binAhead();
 Object.assign(bin,{x:bin.x+4,y:bin.y,tipped:true,vx:0,vy:0});objects.awake.add(bin);
 const inView=[bin.x-20,bin.y-20,bin.x+20,bin.y+20],far=[5000,5000,5100,5100];
 for(let i=0;i<1000;i++)stepStreetObjects(objects,.05,{vehicles:[],walkers:[],canMove,view:inView});
 assert.equal(bin.tipped,true,'never tidied up in front of the player');
 const parked={x:bin.home.x,y:bin.home.y,a:0,vx:0,vy:0,shape};
 for(let i=0;i<1000;i++)stepStreetObjects(objects,.05,{vehicles:[parked],walkers:[],canMove,view:far});
 assert.equal(bin.tipped,true,'not while a car is parked on its spot');
 stepStreetObjects(objects,.05,{vehicles:[],walkers:[],canMove,view:far});
 assert.equal(bin.tipped,false);assert.deepEqual([bin.x,bin.y,bin.a],[bin.home.x,bin.home.y,bin.home.a]);
 assert.equal(objects.awake.has(bin),false,'asleep again: no physics cost');
});

test('Q07 game wiring: placed after doors and NPCs, bollards in car and walking collisions, physics after traffic',async()=>{
 const [game,html]=await Promise.all(['game.mjs','index.html'].map(f=>readFile(new URL('./'+f,import.meta.url),'utf8')));
 assert.match(game,/import \{placeStreetObjects,stepStreetObjects,drawStreetObjects,bollardBlocksVehicle,bollardBlocksWalker(?:,\w+)*\} from '\.\/street-objects\.mjs\?v=\d+'/);
 assert.equal((game.match(/state\.people=createCityPedestrians\(\);state\.streetObjects=createStreetObjects\(\);/g)||[]).length,2,'on load and on reset');
 assert.match(game,/\.\.\.\(state\.doors\|\|\[\]\)\.map\(d=>\(\{x:d\.x,y:d\.y,r:2\.6\}\)\)/,'doors kept clear');
 assert.match(game,/\.\.\.state\.cars\.map\(v=>\(\{x:v\.x,y:v\.y,r:3\.6\}\)\)/,'parked cars kept clear');
 assert.match(game,/if\(state\.streetObjects&&bollardBlocksVehicle\(state\.streetObjects,\{x,y,a\},bodyShape\(vehicle\)\)\)return true;/);
 assert.match(game,/&&!post\(nx,p\.y\)\)p\.x=nx;/);
 const tick=game.indexOf('function tick(dt)'),traffic=game.indexOf('updateTraffic(dt);',tick),physics=game.indexOf('stepStreetPhysics(dt);',tick);
 assert.ok(tick>0&&traffic>tick&&physics>traffic&&physics-traffic<80,'objects move after traffic, in the same tick');
 assert.ok(game.indexOf('drawStreetObjects(c,')<game.indexOf('drawCityPeople(c,state.people'),'under the people');
 assert.ok(Number((html.match(/game\.mjs\?v=(\d+)/)||[])[1])>=146);
});
