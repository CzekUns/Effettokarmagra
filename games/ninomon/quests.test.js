"use strict";
const assert=require("node:assert/strict");
const Q=require("./quests.js");

assert.equal(Q.quests.length,8);
const s=Q.restore(undefined),world={visited:{0:true},defeated:{},clues:{},found:{}};
assert.equal(Q.offers(s,"Paco",0).some(q=>q.id==="muro"),true);
assert.equal(Q.offers(s,"Vincenzo",0).some(q=>q.id==="crew"),false);
assert.equal(Q.talk(s,"muro","Paco",1,world),null,"NPC must be in the intended zone");
assert.equal(s.progress.muro,undefined);
assert.equal(Q.talk(s,"muro","Paco",0,world).started,true);
assert.equal(s.progress.muro,1);
world.clues["Orario sospeso"]=true;
assert.equal(Q.sync(s,world).length,1);
assert.equal(s.progress.muro,2);
Q.talk(s,"muro","Nadia",1,world);
assert.equal(s.progress.muro,3);
world.defeated.wall=true;
Q.sync(s,world);
assert.equal(s.progress.muro,4);
Q.talk(s,"muro","Paco",0,world);
assert.equal(Q.complete(s,"muro"),true);
assert.equal(Q.fiatoBonus(s),1);
assert.equal(Q.cred(s),2);

// Autocomplete an already-won battle only once the player accepts the quest.
world.defeated.sound=true;
Q.talk(s,"audio","Filo",1,world);
assert.equal(s.progress.audio,2);
Q.talk(s,"audio","Otto",2,world);
Q.talk(s,"audio","Filo",1,world);
assert.equal(Q.complete(s,"audio"),true);
assert.equal(Q.offers(s,"Vincenzo",0).some(q=>q.id==="crew"),true);

const restored=Q.restore(JSON.parse(JSON.stringify(s)));
assert.equal(Q.complete(restored,"muro"),true);
assert.equal(Q.complete(restored,"audio"),true);
assert.equal(Q.fiatoBonus(restored),1);
assert.equal(Q.offers(restored,"Paco",0).some(q=>q.id==="muro"),false);
assert.equal(Q.restore({progress:{muro:-1,audio:999,fake:4}}).progress.muro,undefined);

// Complete every step of every quest with valid triggers and retroactive flags.
const run=Q.blank(),snap={visited:{0:true},defeated:{},clues:{},found:{}};
for(const q of Q.quests){
 assert.equal(Q.unlocked(run,q),true,"Unexpectedly locked: "+q.id);
 for(let attempts=0;!Q.complete(run,q.id)&&attempts<24;attempts++){
  const step=Q.current(run,q)||q.steps[0],before=run.progress[q.id]??0;
  if(step.type==="talk")assert.ok(Q.talk(run,q.id,step.who,step.zone,snap),"Missing dialogue "+q.id);
  else{
   if(step.type==="clue")snap.clues[step.key]=true;
   if(step.type==="win")snap.defeated[step.key]=true;
   if(step.type==="visit")snap.visited[step.zone]=true;
   if(step.type==="visits")for(let i=0;i<step.count;i++)snap.visited[i]=true;
   if(step.type==="wins")for(let i=0;i<step.count;i++)snap.defeated["trainer-"+i]=true;
   if(step.type==="photos")for(let i=0;i<step.count;i++)snap.found["n"+i]=true;
   Q.sync(run,snap);
  }
  assert.ok(run.progress[q.id]>before,"Stuck quest: "+q.id+" on "+step.type);
 }
 assert.equal(Q.complete(run,q.id),true,"Quest incomplete: "+q.id);
}
assert.equal(Q.cred(run),21);
assert.equal(Q.fiatoBonus(run),3);
assert.equal(Q.quests.filter(q=>Q.complete(Q.restore(JSON.parse(JSON.stringify(run))),q.id)).length,8);
console.log("Ninomon quests: 8 missions, save compatibility and branching events OK");
