/* Integration smoke test: boot browser entrypoint under a tiny DOM/canvas
 * shim, load the real OSM map from disk and interact with mission one.
 * This complements logic tests; it is NOT a real-browser visual check. */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const html=await readFile(new URL('./index.html',import.meta.url),'utf8');
const ids=[...html.matchAll(/id="([^"]+)"/g)].map(m=>m[1]);
const events=new Map();
const ctx=new Proxy({},{get(o,k){return k in o?o[k]:(..._)=>{}},set(o,k,v){o[k]=v;return true;}});
function element(id=''){
 const listeners=new Map();
 return {
  id,hidden:id==='dialog'||id==='fullmap'||id==='waypoint'||id==='mission-panel',textContent:'',style:{},clientWidth:630,clientHeight:470,
  width:168,height:142,dataset:{},classList:{add(){},remove(){}},
  addEventListener(type,callback){listeners.set(type,callback);},
  fire(type,args={}){listeners.get(type)?.({preventDefault(){},pointerId:1,...args});},
  getContext(){return ctx;},focus(){},setPointerCapture(){},setAttribute(k,v){this[k]=v}
 };
}
const els=new Map(ids.map(id=>[id,element(id)]));
const arrows=['up','down','left','right'].map(d=>Object.assign(element(),{dataset:{dir:d}}));
const windowHandlers=new Map();
const storage=new Map();
globalThis.document={
 getElementById(id){return els.get(id)||null;},
 querySelectorAll(query){return query==='[data-dir]'?arrows:[];},
 createElement(){return element();},
 addEventListener(type,handler){windowHandlers.set('document:'+type,handler);}
};
globalThis.window={devicePixelRatio:1,addEventListener(type,handler){windowHandlers.set(type,handler);}};
globalThis.localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>{storage.set(k,v);}};
globalThis.requestAnimationFrame=(callback)=>{if(frames++<8)setTimeout(()=>callback(performance.now()),4);};
let frames=0;
globalThis.fetch=async url=>{
 const path=String(url).replace(/^[.][\\/]/,'');
 const local=path==='data/boundary.json'?'./data/boundary.json':path==='data/melito-map.json'?'./data/melito-map.json':null;
 if(!local)throw Error('Unexpected external fetch: '+url);
 const data=JSON.parse(await readFile(new URL(local,import.meta.url),'utf8'));
 return {ok:true,json:async()=>data};
};
test('browser entry boots and first NPC mission is interactable on Via Roma',async()=>{
 await import('./game.mjs?smoke=1');
 for(let i=0;i<100&&!els.get('loading').hidden;i++)await new Promise(r=>setTimeout(r,10));
 assert.equal(els.get('loading').hidden,true,'real OSM map must load');
 assert.match(els.get('mission-name').textContent,/primo contatto/i);
 assert.match(els.get('mission-destination').textContent,/Via Roma/);
 assert.ok(Number(els.get('road-count').textContent)>400);
 assert.ok(Number(els.get('building-count').textContent)>1600);
 assert.match(els.get('mission-money').textContent,/0/);
 windowHandlers.get('keydown')({key:'f',repeat:false,preventDefault(){}});
 assert.match(els.get('mission-destination').textContent,/Piazza Santo Stefano/);
 assert.equal(els.get('dialog').hidden,false);
 assert.ok(storage.has('gta-melito-campaign-v3'));
 els.get('dialog-close').fire('click');
 assert.equal(els.get('dialog').hidden,true);
 els.get('map-toggle').fire('click');
 assert.equal(els.get('fullmap').hidden,false);
 els.get('map-close').fire('click');
 assert.equal(els.get('fullmap').hidden,true);
 assert.equal(els.get('mission-panel').hidden,true);
 els.get('mission-panel-toggle').fire('click');
 assert.equal(els.get('mission-panel').hidden,false);
 els.get('mission-panel-toggle').fire('click');
 assert.equal(els.get('mission-panel').hidden,true);
});