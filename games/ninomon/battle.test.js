/* Run from project root: node games/ninomon/battle.test.js
 * Deterministic combat regressions; no DOM, browser, or extra packages needed. */
"use strict";
const assert=require("node:assert/strict");
require("./battle.js");
const B=globalThis.NINOMON_BATTLE;
const roll=()=>.25;
assert.equal(B.MOVES.length,32);
assert.equal(Object.keys(B.CREATURES).length,11);
assert.equal(B.CREATURES.starter.name,"Gialluca");
{
 const b=B.make("starter","n01",0,0,["starter"],roll);
 const intended=b.intent.action;
 const result=B.takeTurn(b,"rutto-1",roll);
 assert.equal(result.ok,true);
 assert.equal(b.round,1);
 assert(result.events.some(e=>e.kind==="move"));
 assert(result.events.some(e=>e.who==="enemy"&&e.move===intended),"enemy must honor its advertised attack");
}
{
 const b=B.make("starter","n09",2,4,["starter","n02"],roll);
 b.player.hp=0;
 const result=B.takeTurn(b,"switch:n02",roll);
 assert.equal(result.ok,true);
 assert.equal(b.player.id,"n02");
 assert(!result.events.some(e=>e.who==="enemy"),"forced switch must be free");
}
{
 const b=B.make("starter","n01",0,3,["starter"],roll);
 b.enemy.status.stordito=1;
 const result=B.takeTurn(b,"rutto-1",()=>0);
 assert(result.events.some(e=>e.kind==="status"&&e.text.includes("salta il turno")));
 assert(!b.enemy.status.stordito);
}
{
 const b=B.make("starter","n04",0,4,["starter"],roll);
 const move=B.MOVE["puzza-4"];
 b.intent={action:move.id,name:move.name,type:move.type,power:move.power};
 const result=B.takeTurn(b,"guard",roll);
 assert(result.events[0].kind==="guard","guard gets priority");
 assert(result.events.some(e=>e.kind==="hit"&&e.guarded),"guard must reduce the incoming hit");
}
{
 const b=B.make("starter","n05",1,3,["starter"],roll);
 assert.equal(B.takeTurn(b,"invalid",roll).ok,false);
 assert.equal(b.round,0,"invalid actions must not spend a turn");
 assert.equal(B.takeTurn(b,"flee",roll).battle.ended,"escaped");
}
function rng(seed){let x=seed>>>0;return()=>((x=(Math.imul(x,1664525)+1013904223)>>>0)/4294967296);}
let cases=0;
for(let zone=0;zone<3;zone++)for(const id of Object.keys(B.CREATURES).filter(x=>x!=="starter"))
for(let seed=0;seed<16;seed++){
 const r=rng(seed*21345+zone*93+cases);
 const b=B.make("starter",id,zone,3,["starter"],r);
 let rounds=0;
 while(!b.ended&&rounds++<70){
  const options=b.player.moves.map(x=>B.MOVE[x]).filter(m=>m.cost<=b.player.fiato)
     .sort((a,z)=>B.previewAttack(b,z,"player").max-B.previewAttack(b,a,"player").max);
  const action=options[0]?.id||"rest";
  const response=B.takeTurn(b,action,r);
  assert(response.ok,response.error);
 }
 assert(b.ended,"battle must terminate, "+id+" zone "+zone);
 assert(b.round<=70,"battle softlock, "+id);
 cases++;
}
console.log("Ninomon battle tests OK: 32 moves, 11 creatures, "+cases+" complete battles, switch/guard/turn-order/status/flee.");
