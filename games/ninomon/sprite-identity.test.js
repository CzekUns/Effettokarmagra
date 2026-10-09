/* From repository root: node games/ninomon/sprite-identity.test.js
 * Guards against mismatched monster names and sprite positions whenever
 * the 1990s-style creature atlases are regenerated or reordered.
 */
"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const here=__dirname;
const load=name=>fs.readFileSync(path.join(here,name),"utf8");
const meta=JSON.parse(load("assets/atlas.json"));
class SpriteImage {
 constructor(){this.complete=true;this.naturalWidth=0;this.naturalHeight=0;this.decoding="";}
 set src(value){
  this._src=value;
  const dim=value.includes("ninomon-snes-atlas")?[656,912]:
   value.includes("ninomon-atlas")?[328,456]:[0,0];
  this.naturalWidth=dim[0];this.naturalHeight=dim[1];
 }
 get src(){return this._src;}
}
const fakeDocument={createElement(){return {getContext(){return {imageSmoothingEnabled:false,drawImage(){},fillRect(){}}}};}};
const win={};
const sandbox={window:win,Image:SpriteImage,document:fakeDocument,console,Math};
vm.runInNewContext(load("retro.js"),sandbox,{filename:"retro.js"});
const legacy=win.NINOMON_RETRO;
const oldIndices=legacy.legacyMobIndices;
vm.runInNewContext(load("snes.js"),sandbox,{filename:"snes.js"});
vm.runInNewContext(load("battle.js"),sandbox,{filename:"battle.js"});
const modern=win.NINOMON_RETRO;
const modernIndices=modern.mobIndices;
const creatures=win.NINOMON_BATTLE.CREATURES;
const game=load("game.js");
const begin=game.indexOf("const ENCOUNTERS=[");
assert(begin>=0,"Encounters list missing");
const start=begin+"const ENCOUNTERS=".length,end=game.indexOf("];",start);
assert(end>start,"Encounter literal unavailable");
const encounters=vm.runInNewContext("("+game.slice(start,end+1)+")");
const ids=["starter",...Array.from({length:9},(_,i)=>"n"+String(i+1).padStart(2,"0"))];
function expectedIndex(info,id){
 const name=id==="starter"?"gialluca":id;
 if(Object.hasOwn(info.mainRows,name))return info.mainRows[name];
 if(Object.hasOwn(info.extraRows,name))return 6+info.extraRows[name];
 throw Error("Missing "+id+" in atlas.json");
}
function spriteCoords(i,size,regularLeft,extraLeft,extraTop){
 return [i<6?regularLeft:extraLeft,i<6?i*size:extraTop+(i-6)*size];
}
function verifySprite(renderer,id,index,size,regularLeft,extraLeft,extraTop){
 const calls=[];
 const canvas={imageSmoothingEnabled:false,drawImage(...args){calls.push(args);}};
 renderer.monster(canvas,id,10,20,3,false);
 renderer.monster(canvas,id,10,20,3,true);
 assert.equal(calls.length,2,id+": both front and rear must use the atlas");
 const expected=spriteCoords(index,size,regularLeft,extraLeft,extraTop);
 for(let side=0;side<2;side++){
  assert.equal(calls[side][1],expected[0]+side*size,id+" sprite X mismatch");
  assert.equal(calls[side][2],expected[1],id+" sprite Y mismatch");
  assert.equal(calls[side][3],size,id+" width mismatch");
  assert.equal(calls[side][4],size,id+" height mismatch");
 }
}
for(const id of ids){
 assert.equal(meta.creatureNames[id],creatures[id].name,id+" must have one canonical name");
 const encounter=encounters.find(item=>item.id===id);
 if(id==="starter")assert(!encounter);
 else assert.equal(encounter&&encounter.name,creatures[id].name,id+" battle and overworld labels diverged");
 const i0=expectedIndex(meta.creatures,id),i1=expectedIndex(meta.snes.creatures,id);
 assert.equal(oldIndices[id],i0,id+" index wrong in legacy atlas");
 assert.equal(modernIndices[id],i1,id+" index wrong in SNES atlas");
 verifySprite(legacy,id,i0,56,72,184,104);
 verifySprite(modern,id,i1,112,144,368,208);
}
assert.equal(new Set(Object.values(oldIndices)).size,ids.length,"Legacy atlas has duplicate mappings");
assert.equal(new Set(Object.values(modernIndices)).size,ids.length,"SNES atlas has duplicate mappings");
console.log("Ninomon sprite identities OK: 10 names and IDs, 2 atlases, 40 front/rear draw calls.");
