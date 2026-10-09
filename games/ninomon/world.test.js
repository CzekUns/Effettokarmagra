/* Run with node games/ninomon/world.test.js. No dependencies. */
'use strict';
const assert=require('node:assert/strict');
const M=require('./world');
const actors=[...M.trainers,...M.npcs];
const dirs=[['left',-1,0,0,16],['right',1,0,34,16],['up',0,-1,16,0],['down',0,1,16,23]];
const opposite={left:'right',right:'left',up:'down',down:'up'};
assert.equal(M.zones.length,64);
assert.equal(new Set(M.zones.map(z=>z.name)).size,64);
assert.equal(M.trainers.length,192);
assert.equal(new Set(M.trainers.map(t=>t.id)).size,192);
assert.equal(new Set(M.trainers.map(t=>t.creature)).size,9);
let reciprocal=0,reachable=0;
for(let z=0;z<64;z++){
 const local=actors.filter(p=>p.zone===z),occupied=new Set(local.map(p=>p.x+','+p.y));
 assert.equal(occupied.size,local.length,'Actors overlap in '+z);
 for(const a of local){
  assert(!M.blocked(z,a.x,a.y),'Actor inside structure: '+a.name+' '+z);
  if(a.patrol)for(const [x,y]of a.patrol)assert(!M.blocked(z,x,y),'Blocked patrol');
 }
 const seen=new Set(),queue=[[16,16]];
 for(let i=0;i<queue.length;i++){
  const [x,y]=queue[i],k=x+','+y;
  if(seen.has(k)||M.blocked(z,x,y)||occupied.has(k))continue;
  seen.add(k);
  for(const [,dx,dy]of dirs)queue.push([x+dx,y+dy]);
 }
 reachable+=seen.size;
 for(const a of local)assert(dirs.some(([,dx,dy])=>seen.has((a.x+dx)+','+(a.y+dy))),'Unreachable actor '+a.name);
 for(const [dir,,,x,y]of dirs){
  const n=M.neighbor(z,dir);
  if(n!==null){assert.equal(M.neighbor(n,opposite[dir]),z);assert(seen.has(x+','+y),'Unreachable '+dir+' exit in '+z);reciprocal++;}
  else assert(M.blocked(z,x,y),'Unbounded outer edge');
 }
 for(const s of M.zones[z].structures){
  assert(s.x>=1&&s.y>=2&&s.x+s.w<=34&&s.y+s.h<=23,'Structure outside playable area '+s.id);
  for(let y=s.y;y<s.y+s.h;y++)for(let x=s.x;x<s.x+s.w;x++){
   assert(M.blocked(z,x,y),'Missing collision');
   const [a,b]=M.safeSpawn(z,x+.5,y+.5,actors);
   assert(!M.blocked(z,a,b),'Save relocation inside obstacle');
   assert(!occupied.has(Math.floor(a)+','+Math.floor(b)),'Save relocation on actor');
  }
 }
}
for(const [z,x,y]of [[0,18,13],[1,8,14],[2,19,15]]){
 assert(!M.blocked(z,x,y),'Clue blocked');
 assert(!actors.some(a=>a.zone===z&&a.x===x&&a.y===y),'Clue overlaps actor');
}
console.log(`World OK: 64 quadrants, ${64*35*24} cells, ${reachable} reachable free cells, ${reciprocal} reciprocal exits, 192 trainers, ${M.npcs.length} civilians; footprints, patrols and old-save relocation verified.`);
