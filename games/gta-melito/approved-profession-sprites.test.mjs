import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PROFESSION_ATLAS_PATH,PROFESSION_TYPES} from './profession-sprites.mjs';

test('approved 4-profession atlas is PNG 384x160 based on original pedestrian format',async()=>{
 assert.match(PROFESSION_ATLAS_PATH,/npc-mestieri-prima-reference-384x160\.png$/);
 assert.deepEqual(PROFESSION_TYPES,['friggitore','vigile','lavavetri','contrabbandiere']);
 for(const [name,width] of [['npc-mestieri-prima-reference-384x160.png',384],
  ...['friggitore','vigile','lavavetri','contrabbandiere'].map(n=>['npc-prima-reference-'+n+'-96x160.png',96])]){
  const image=await readFile(new URL('./assets/people/'+name,import.meta.url));
  assert.equal(image.subarray(0,8).toString('hex'),'89504e470d0a1a0a',name);
  assert.equal(image.readUInt32BE(16),width,name+' width');
  assert.equal(image.readUInt32BE(20),160,name+' height');
  assert.ok(image.length>400,name+' non-empty');
 }
});

test('approved professions are loaded by both the city renderer and the game',async()=>{
 const [game,city,html]=await Promise.all(['game.mjs','city-art.mjs','index.html']
  .map(p=>readFile(new URL('./'+p,import.meta.url),'utf8')));
 assert.match(game,/profession-sprites\.mjs\?v=003/);
 assert.match(city,/profession-sprites\.mjs\?v=003/);
 assert.match(game,/city-art\.mjs\?v=133/);
 assert.match(html,/game\.mjs\?v=197/);
});