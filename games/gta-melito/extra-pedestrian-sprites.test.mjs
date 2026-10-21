import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {EXTRA_PEDESTRIAN_ATLAS_PATH,EXTRA_PEDESTRIAN_IDENTITIES,
 EXTRA_PEDESTRIAN_CELL,EXTRA_PEDESTRIAN_NPC_START_KIND,
 loadExtraPedestrianSprites,extraPedestrianSpriteReady,drawExtraPedestrianSprite
} from './extra-pedestrian-sprites.mjs';

test('second 64-frame atlas: 4 people, 4 directions, 4 poses, genuine alpha',async()=>{
 assert.deepEqual(EXTRA_PEDESTRIAN_CELL,{width:24,height:40,columns:16,rows:4});
 assert.deepEqual(EXTRA_PEDESTRIAN_IDENTITIES,[
  'protagonist-red-hoodie','woman-white','man-green-tracksuit','worker-orange-vest']);
 assert.equal(EXTRA_PEDESTRIAN_NPC_START_KIND,4);
 const p=await readFile(new URL(EXTRA_PEDESTRIAN_ATLAS_PATH,import.meta.url));
 assert.equal(p.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
 assert.equal(p.readUInt32BE(16),384);assert.equal(p.readUInt32BE(20),160);
 assert.ok(p.includes(Buffer.from('tRNS')),'true transparent alpha palette');
 assert.ok(p.length<18000,'mobile asset stays small');
});

test('extra NPC sprites rotate and animate, stopped hero has stationary frame',()=>{
 const original=globalThis.Image;
 class MockImage{complete=true;naturalWidth=384;naturalHeight=160;set src(v){this._src=v;}}
 try{
  globalThis.Image=MockImage;
  loadExtraPedestrianSprites();
  assert.equal(extraPedestrianSpriteReady(),true);
  let p;
  const ctx={drawImage(...args){p=args;}};
  assert.equal(drawExtraPedestrianSprite(ctx,22,33,0,0,10,false,1,0),true);
  assert.equal(p.length,9);
  assert.equal(p[1],0,'hero identity 0 frame 0');
  assert.equal(p[2],3*40,'right direction');
  assert.equal(p[3],24);assert.equal(p[4],40);
  assert.ok(p[7]<4&&p[8]<5,'same scale as original pedestrians');
  assert.equal(drawExtraPedestrianSprite(ctx,22,33,-Math.PI/2,3,2,true,1.2,24),true);
  assert.ok(p[1]>=12*24&&p[1]<16*24,'worker frames in final four columns');
  assert.equal(p[2],0,'up direction');
  assert.equal(drawExtraPedestrianSprite(ctx,22,33,0,4,1,true),false,'invalid character does not render');
 }finally{
  if(original===undefined)delete globalThis.Image;else globalThis.Image=original;
 }
});

test('hero gets the new red hoodie; NPCs include three more identities without affecting movement',async()=>{
 const [art,game,road,page]=await Promise.all([
  readFile(new URL('./city-art.mjs',import.meta.url),'utf8'),
  readFile(new URL('./game.mjs',import.meta.url),'utf8'),
  readFile(new URL('./roads.mjs',import.meta.url),'utf8'),
  readFile(new URL('./index.html',import.meta.url),'utf8')
 ]);
 assert.match(art,/drawExtraPedestrianSprite\(c,player\.x,player\.y,player\.a,0,clock,moving,1\.2,0\)/);
 assert.match(art,/p\.kind-EXTRA_PEDESTRIAN_NPC_START_KIND\+1/);
 assert.match(art,/drawPedestrianSprite\(c,x,y,angle,p\.kind,clock,moving,p\.speed,p\.seed\)/,'previous four NPCs retained');
 assert.match(road,/kind:kind==='walk'\?i%PEDESTRIAN_KIND_COUNT:i%7/,'walkers rotate over all sheets (lotto 2 included), car kinds unchanged');
 assert.ok(game.includes('loadExtraPedestrianSprites()'));
 assert.ok(Number((game.match(/roads\.mjs\?v=(\d+)/)||[])[1])>=127,'roads.mjs deve essere almeno alla v=127');
 assert.ok(Number((game.match(/city\-art\.mjs\?v=(\d+)/)||[])[1])>=125,'city-art.mjs deve essere almeno alla v=125');
 assert.ok(Number((page.match(/game\.mjs\?v=(\d+)/)||[])[1])>=138,'game.mjs deve essere almeno alla v=138');
});
