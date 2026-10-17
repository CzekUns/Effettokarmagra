import {test} from 'node:test';
import assert from 'node:assert/strict';
import {
 VEHICLE_ATLAS_CELL_WIDTH,VEHICLE_ATLAS_CELL_HEIGHT,VEHICLE_ATLAS_COLUMNS,VEHICLE_ATLAS_ROWS,
 decodeVehicleAlphaBounds,maskVehicleAtlasPixels,restoreVehicleAtlasTransparency
} from './vehicle-alpha.mjs';

test('every Punto/Ypsilon sprite has a foreground silhouette and fully transparent exterior',()=>{
 const bounds=decodeVehicleAlphaBounds();
 assert.equal(bounds.length,240);
 assert.deepEqual(
 [VEHICLE_ATLAS_CELL_WIDTH,VEHICLE_ATLAS_CELL_HEIGHT,VEHICLE_ATLAS_COLUMNS,VEHICLE_ATLAS_ROWS],
 [40,60,4,4]
 );
 // Simulates an all-opaque exported atlas with a black matte; mask MUST clear
 // backgrounds for all 16 variants rather than only hiding the rectangle via CSS.
 const pixels=new Uint8ClampedArray(160*240*4).fill(255);
 for(let i=0;i<pixels.length;i+=4){pixels[i]=16;pixels[i+1]=20;pixels[i+2]=23;}
 const fixed=maskVehicleAtlasPixels(pixels,160,240);
 assert.strictEqual(fixed,pixels);
 let cleared=0,painted=0;
 for(let i=3;i<pixels.length;i+=4)(pixels[i]===0?cleared++:painted++);
 assert.ok(cleared>14000,'the dark rectangle must actually become transparent');
 assert.ok(painted>16000,'car bodies must not disappear');
 for(let index=0;index<16;index++){
  const cx=(index%4)*40,cy=Math.floor(index/4)*60;
  for(const [x,y] of [[0,0],[39,0],[0,59],[39,59]]){
   const i=4*((cy+y)*160+cx+x);
   assert.deepEqual(Array.from(pixels.slice(i,i+4)),[0,0,0,0],'opaque sprite corner '+index);
  }
  const center=4*((cy+30)*160+cx+20);
  assert.equal(pixels[center+3],255,'opaque car body must survive '+index);
 }
});
test('transparentization uses a same-sized offscreen canvas and refuses unsafe atlas shapes',()=>{
 let painted;
 const canvas={
  width:160,height:240,
  getContext(){
   return {
    drawImage(im,x,y){assert.equal(im.naturalWidth,160);assert.equal(x,0);assert.equal(y,0);},
    getImageData(){return {data:new Uint8ClampedArray(160*240*4).fill(255)};},
    putImageData(image){painted=image.data;}
   };
  }
 };
 const img={naturalWidth:160,naturalHeight:240};
 const result=restoreVehicleAtlasTransparency(img,()=>canvas);
 assert.strictEqual(result,canvas);
 assert.equal(painted[3],0);
 assert.equal(painted[4*(30*160+20)+3],255);
 assert.equal(restoreVehicleAtlasTransparency({naturalWidth:100,naturalHeight:100},()=>canvas),null);
 assert.equal(restoreVehicleAtlasTransparency(img,()=>null),null);
 assert.throws(()=>maskVehicleAtlasPixels(new Uint8Array(3),160,240),RangeError);
});
test('no raw black-background atlas can reach the vehicle draw path',async()=>{
 const {readFile}=await import('node:fs/promises');
 const sprites=await readFile(new URL('./car-sprites.mjs',import.meta.url),'utf8');
 const page=await readFile(new URL('./index.html',import.meta.url),'utf8');
 assert.match(sprites,/restoreVehicleAtlasTransparency\(/);
 assert.match(sprites,/if\(!isAtlas\)cache\.set\(model,img\)/);
 assert.match(sprites,/if\(restored\)cache\.set\(model,restored\)/);
 assert.ok(page.includes('game.mjs?v=104'));
});
