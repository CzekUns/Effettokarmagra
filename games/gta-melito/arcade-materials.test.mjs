import {test} from 'node:test';
import assert from 'node:assert/strict';
import {material} from './arcade-materials.mjs';

test('separate tile contexts share the generated bitmap source',()=>{
 const previousCanvas=globalThis.OffscreenCanvas,previousMatrix=globalThis.DOMMatrix;
 let sources=0,patterns=0;
 globalThis.OffscreenCanvas=class{
  constructor(){sources++;}
  getContext(){return {fillRect(){}};}
 };
 globalThis.DOMMatrix=class{scale(){return this;}};
 const context=()=>({createPattern(){patterns++;return {setTransform(){}};}});
 try{
  const first=context(),second=context();
  const a=material(first,'clay','#fff');
  assert.equal(material(first,'clay','#fff'),a);
  material(second,'clay','#fff');
  assert.equal(sources,1,'one generated source is shared by all tile contexts');
  assert.equal(patterns,2,'CanvasPattern instances remain context-specific');
 }finally{
  if(previousCanvas===undefined)delete globalThis.OffscreenCanvas;
  else globalThis.OffscreenCanvas=previousCanvas;
  if(previousMatrix===undefined)delete globalThis.DOMMatrix;
  else globalThis.DOMMatrix=previousMatrix;
 }
});
