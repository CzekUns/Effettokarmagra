import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {MOTORCYCLE_ATLAS_PATH,MOTORCYCLE_IDS,MOTORCYCLE_MODELS,MOTORCYCLE_COLORS,
 MOTORCYCLE_CELL,motorcycleVariant,isMotorcycle,loadMotorcycleSprites,motorcycleSpriteReady,
 drawMotorcycle,stepMotorcycle,chooseMotorcycleDismount} from './motorcycles.mjs';
import {vehicleShape,vehiclesOverlap,vehicleHitsPedestrian,makeCollisionIndex,collidesWithTraffic} from './traffic-collision.mjs';

test('four families in four colors occupy one tiny transparent 16-sprite atlas',async()=>{
 assert.equal(MOTORCYCLE_MODELS.length,4);
 assert.equal(MOTORCYCLE_COLORS.length,4);
 assert.equal(MOTORCYCLE_IDS.length,16);
 assert.equal(new Set(MOTORCYCLE_IDS).size,16);
 assert.deepEqual(MOTORCYCLE_CELL,{width:40,height:68,columns:4,rows:4});
 assert.deepEqual(motorcycleVariant(MOTORCYCLE_IDS[0]),{index:0,column:0,row:0});
 assert.deepEqual(motorcycleVariant(MOTORCYCLE_IDS[15]),{index:15,column:3,row:3});
 const png=await readFile(new URL(MOTORCYCLE_ATLAS_PATH,import.meta.url));
 assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
 assert.equal(png.readUInt32BE(16),160);assert.equal(png.readUInt32BE(20),272);
 assert.ok(png.includes(Buffer.from('tRNS')),'true alpha palette, not black matte');
 assert.ok(png.length<16000,'atlas compressed for Android');
});

test('motorcycle canvas paints the correct atlas cell with a visible seated helmeted rider',()=>{
 const previous=globalThis.Image;
 class MockImage{complete=true;naturalWidth=160;naturalHeight=272;set src(v){this._src=v;}}
 try{
  globalThis.Image=MockImage;loadMotorcycleSprites();
  assert.ok(motorcycleSpriteReady());
  const operations=[];
  const ctx=new Proxy({},{
   get(target,key){if(key==='drawImage')return (...a)=>operations.push(['draw',...a]);
    if(key==='ellipse')return (...a)=>operations.push(['ellipse',...a]);
    if(key==='save'||key==='restore'||key==='translate'||key==='rotate'||key==='beginPath'||key==='fill'||key==='fillRect'||key==='moveTo'||key==='lineTo'||key==='stroke'||key==='strokeRect')return ()=>{};
    return target[key];},
   set(target,key,value){target[key]=value;return true;}
  });
  assert.equal(drawMotorcycle(ctx,10,11,Math.PI/4,MOTORCYCLE_IDS[15],{rider:true,focused:true}),true);
  const draw=operations.find(x=>x[0]==='draw');
  assert.equal(draw.length,10);
  assert.equal(draw[2],120);assert.equal(draw[3],204);
  assert.equal(draw[4],40);assert.equal(draw[5],68);
  assert.ok(draw[8]<=3.3&&draw[9]<=6.6,'still smaller than a car');
  assert.ok(operations.filter(x=>x[0]==='ellipse').length>=4,'helmet and seated body shown');
 }finally{
  if(previous===undefined)delete globalThis.Image;else globalThis.Image=previous;
 }
});

test('scooter is nimble, accelerates and brakes independently from cars',()=>{
 let speed=0,angle=0;
 for(let i=0;i<130;i++)({speed,angle}=stepMotorcycle(speed,angle,{x:.6,y:-1},false,1/60));
 assert.ok(speed>15&&speed<=33);
 assert.ok(angle>.3);
 let braking=speed;
 for(let i=0;i<24;i++)braking=stepMotorcycle(braking,angle,{x:0,y:0},true,1/60).speed;
 assert.ok(braking<4);
 assert.ok(stepMotorcycle(0,0,{x:0,y:1},false,1).speed>=-4);
});

test('cannot dismount a moving motorcycle or into an occupied wall',()=>{
 const bike={x:10,y:10,a:0,speed:8,vehicleType:'motorcycle'};
 assert.equal(chooseMotorcycleDismount(bike,()=>true),null);
 bike.speed=0;
 assert.equal(chooseMotorcycleDismount(bike,()=>false),null);
 assert.equal(chooseMotorcycleDismount(bike,()=>true,()=>true),null);
 const spot=chooseMotorcycleDismount(bike,(x,y)=>y<10.1,(x,y)=>x===10&&y===10);
 assert.deepEqual(spot,{x:10,y:7});
});

test('bike collision footprint differs from car; motorbike rider can be avoided by NPCs',()=>{
 const car={x:0,y:0,a:0,body:'car'};
 const bike={x:0,y:0,a:0,vehicleType:'motorcycle',body:'car'};
 assert.equal(isMotorcycle(car),false);assert.equal(isMotorcycle(bike),true);
 assert.ok(vehicleShape(bike).halfWidth<vehicleShape(car).halfWidth);
 assert.equal(vehiclesOverlap({...bike,y:2.25},bike),false);
 assert.equal(vehiclesOverlap({...bike,y:1.6},bike),true);
 assert.ok(vehicleHitsPedestrian(bike,{x:0,y:1.3}));
 assert.ok(!vehicleHitsPedestrian(bike,{x:0,y:2.4},.1));
 const index=makeCollisionIndex([bike]);
 assert.equal(collidesWithTraffic({...bike,x:1},'car',index,bike),null,'own vehicle is excluded');
 assert.equal(collidesWithTraffic({x:1,y:0,a:0,vehicleType:'motorcycle'},'car',index)!=null,true);
});

test('the user can ride motorcycles, NPCs ride too, and auto logic remains',async()=>{
 const [game,road,page]=await Promise.all([
  readFile(new URL('./game.mjs',import.meta.url),'utf8'),
  readFile(new URL('./roads.mjs',import.meta.url),'utf8'),
  readFile(new URL('./index.html',import.meta.url),'utf8')
 ]);
 assert.match(game,/loadMotorcycleSprites\(\)/);
 assert.match(game,/drawMotorcycle\(c,x,y,a,model/);
 assert.match(game,/chooseMotorcycleDismount\(vehicle,validWalk,blocked\)/);
 assert.match(game,/isMotorcycle\(car\)\?stepMotorcycle:stepDriving/);
 assert.match(game,/MOTORCYCLE_IDS\[\(k\+Math.floor\(k\/3\)\*5\)/);
 assert.match(game,/MOTORCYCLE_IDS\[\(i\+Math.floor\(i\/4\)\*5\)/);
 assert.match(game,/motorcycleEvery:4/);
 assert.match(game,/MOTO · /);
 assert.match(road,/vehicleType:player.vehicleType/);
 assert.ok(game.includes("traffic-collision.mjs?v=125"));
 assert.ok(game.includes("roads.mjs?v=125"));
 assert.ok(page.includes('game.mjs?v=129'));
});
