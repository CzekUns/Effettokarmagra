import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PEOPLE_ATLAS_PATH,PEOPLE_ATLAS_CELL,PEOPLE_SPRITE_TYPES,PEOPLE_DIRECTIONS,
 loadPedestrianSprites,pedestrianSpriteReady,pedestrianDirection,drawPedestrianSprite
} from './pedestrian-sprites.mjs';

test('all 4 pedestrian identities, 4 headings and 4 frames use one small transparent PNG',async()=>{
 assert.deepEqual(PEOPLE_ATLAS_CELL,{width:24,height:40,columns:16,rows:4});
 assert.equal(PEOPLE_SPRITE_TYPES.length,4);
 assert.deepEqual(PEOPLE_DIRECTIONS,['up','down','left','right']);
 const p=await readFile(new URL(PEOPLE_ATLAS_PATH,import.meta.url));
 assert.equal(p.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
 assert.equal(p.readUInt32BE(16),384);assert.equal(p.readUInt32BE(20),160);
 assert.ok(p.length<15000,'optimized for mobile');
 assert.ok(p.includes(Buffer.from('tRNS')),'PNG keeps real transparent palette pixels');
});

test('pedestrian directions respect world headings, with still frame for stopped NPCs',()=>{
 assert.equal(pedestrianDirection(0),3);
 assert.equal(pedestrianDirection(Math.PI/2),1);
 assert.equal(pedestrianDirection(Math.PI),2);
 assert.equal(pedestrianDirection(-Math.PI/2),0);
 assert.equal(pedestrianDirection(Number.NaN),3);
 const previous=globalThis.Image;
 class FakeImage{complete=true;naturalWidth=384;naturalHeight=160;set src(v){this._src=v;}}
 try{
  globalThis.Image=FakeImage;
  loadPedestrianSprites();
  assert.equal(pedestrianSpriteReady(),true);
  let call=null;
  const ctx={drawImage(...args){call=args;}};
  // Woman, facing right, moving => source in row 3, columns 4–7.
  assert.equal(drawPedestrianSprite(ctx,100,200,0,1,3.5,true,1.2,23),true);
  assert.ok(call&&call.length===9);
  assert.ok(call[1]>=4*24&&call[1]<8*24);
  assert.equal(call[2],3*40);assert.equal(call[3],24);assert.equal(call[4],40);
  assert.ok(call[7]<4&&call[8]<5,'sprite not oversized compared with cars');
  assert.equal(drawPedestrianSprite(ctx,100,200,-Math.PI/2,2,100,false,1,0),true);
  assert.equal(call[1],8*24,'stopped elder uses frame 0');
  assert.equal(call[2],0,'upward heading uses atlas row 0');
 }finally{
  if(previous===undefined)delete globalThis.Image;else globalThis.Image=previous;
 }
});

test('city-art replaces only NPC visuals; hero, collision and navigation remain untouched',async()=>{
 const art=await readFile(new URL('./city-art.mjs',import.meta.url),'utf8');
 const game=await readFile(new URL('./game.mjs',import.meta.url),'utf8');
 const page=await readFile(new URL('./index.html',import.meta.url),'utf8');
 assert.match(art,/drawPedestrianSprite\(c,x,y,angle,p\.kind,clock,moving,p\.speed,p\.seed\)/);
 assert.match(art,/drawPixelPerson\(c,\{skin:c1\[0\]/,'NPC fallback survives');
 assert.match(art,/export function drawCityPlayer/);
 assert.ok(game.includes('loadPedestrianSprites()'));
 assert.ok(game.includes('city-art.mjs?v=125'));
 assert.ok(page.includes('game.mjs?v=138'));
});
