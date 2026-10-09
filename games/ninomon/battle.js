/* I NINOMON — turn-based battle rules, shared by the game and tests.
 * 8 categories x 4 tiers = 32 moves. A tier is move power, never a creature level.
 * No DOM, randomness and storage injected at the API boundary. */
(function(root){
"use strict";
const TYPES=["rutto","sputo","cacca","puzza","pipi","rottami","schiamazzo","sfiga"];
const ENERGY=[0,0,2,3,5],ACC=[0,100,95,90,85],POW=[0,11,19,29,42];
const names={
 rutto:["Ruttino","Rutto a tradimento","Rutto a tromba","Rutto apocalittico"],
 sputo:["Sputacchio","Sputo a parabola","Sputo appiccicoso","Diluvio salivare"],
 cacca:["Pallina sospetta","Lancio marrone","Cagata strategica","Tempesta fecale"],
 puzza:["Alito pesante","Ascella assassina","Nube fetida","Fetore universale"],
 pipi:["Gocciolina","Schizzo improvviso","Getto pressurizzato","Alluvione gialla"],
 rottami:["Tappo arrugginito","Lattinata","Carrello impazzito","Cassonetto orbitale"],
 schiamazzo:["Versaccio","Urlo molesto","Sirena umana","Frastuono infernale"],
 sfiga:["Occhiataccia","Malocchio","Disgrazia annunciata","Venerdì 17"]
};
const STATUS=["stordito","impiastricciato","appestato","scivoloso","intimorito"];
const effects={
 rutto:[null,"stordito","stordito","stordito"],
 sputo:[null,"impiastricciato","impiastricciato","impiastricciato"],
 cacca:[null,"scivoloso","scivoloso","appestato"],
 puzza:[null,"intimorito","appestato","appestato"],
 pipi:[null,"scivoloso","scivoloso","scivoloso"],
 rottami:[null,null,"stordito","stordito"],
 schiamazzo:[null,"intimorito","stordito","stordito"],
 sfiga:[null,"intimorito","impiastricciato","impiastricciato"]
};
const moveList=[],MOVE={};
for(const cat of TYPES)for(let t=1;t<=4;t++){
 const move={id:cat+"-"+t,name:names[cat][t-1],type:cat,tier:t,cost:ENERGY[t],accuracy:ACC[t],power:POW[t]-(cat==="puzza"||cat==="sfiga"?3:0),effect:effects[cat][t-1]||null,chance:t===1?0:t===2?24:t===3?38:58};
 if(cat==="schiamazzo"&&t===1){move.power=6;move.effect="intimorito";move.chance=50;}
 if(cat==="puzza"&&t===1){move.power=7;move.effect="appestato";move.chance=45;}
 if(cat==="sfiga"&&t===1){move.power=6;move.effect="intimorito";move.chance=45;}
 if(cat==="rottami"&&t===1)move.accuracy=100;
 moveList.push(move);MOVE[move.id]=move;
}
const CREATURES={
 starter:{id:"starter",name:"Mascotte di Gianlluca",kind:"Mascotte provvisoria",hp:115,color:"#dfc18a",symbol:"◎",types:["rutto","rottami"],base:["rutto-1","rottami-1","sputo-2","sfiga-2"],advanced:["rutto-3","rottami-3"],ultimate:"rutto-4"},
 n01:{id:"n01",name:"Topo sospetto",kind:"Creatura di scalo",hp:96,color:"#a4a6a9",symbol:"?",types:["cacca","puzza"],base:["cacca-1","puzza-1","puzza-2","cacca-2"],advanced:["puzza-3","cacca-3"],ultimate:"cacca-4"},
 n02:{id:"n02",name:"Piccione immobile",kind:"Creatura da sottopasso",hp:106,color:"#8e9eb6",symbol:"?",types:["sputo","sfiga"],base:["sputo-1","sfiga-1","sputo-2","sfiga-2"],advanced:["sputo-3","sfiga-3"],ultimate:"sfiga-4"},
 n03:{id:"n03",name:"Pesce misterioso",kind:"Creatura da marciapiede",hp:115,color:"#cdb0b0",symbol:"?",types:["pipi","schiamazzo"],base:["pipi-1","schiamazzo-1","pipi-2","schiamazzo-2"],advanced:["pipi-3","schiamazzo-3"],ultimate:"pipi-4"}
};
const ZONE_BONUS=["rottami","rutto","pipi"];
// Two eight-category counterplay loops. A matching counter gives a modest bonus.
const COUNTERS={rutto:"puzza",puzza:"schiamazzo",schiamazzo:"sfiga",sfiga:"rutto",sputo:"cacca",cacca:"pipi",pipi:"rottami",rottami:"sputo"};
function availableTier(discoveries){return discoveries>=3?4:discoveries>=2?3:2;}
function loadout(id,discoveries=0){
 const sp=CREATURES[id]||CREATURES.starter;
 const moves=sp.base.slice();
 if(discoveries>=2)moves[2]=sp.advanced[0];
 if(discoveries>=3)moves[3]=sp.ultimate;
 return moves;
}
function actor(id,disc=0,levelHp){
 const sp=CREATURES[id]||CREATURES.starter;
 return{id:sp.id,name:sp.name,hp:levelHp||sp.hp,maxHp:sp.hp,fiato:6,maxFiato:6,status:{},moves:loadout(id,disc)};
}
function make(playerId,enemyId,zone=0,discovered=0,partyIds=[playerId]){
 const ids=[...new Set([playerId,...partyIds])].filter(id=>CREATURES[id]);
 const party={};
 for(const id of ids)party[id]=actor(id,discovered);
 return{player:party[playerId]||party.starter,party,enemy:actor(enemyId,Math.max(discovered,zone+1)),zone:Math.max(0,Math.min(2,zone)),round:0,ended:null,log:["Un "+CREATURES[enemyId].name+" appare davanti a Nino!"],last:null};
}
const cap=(n,a,b)=>Math.max(a,Math.min(b,n));
function rngValue(fn){const n=Number((fn||Math.random)());return cap(Number.isFinite(n)?n:.5,0,.999999);}
function statusEffects(unit){
 if(unit.status.appestato>0){unit.hp=cap(unit.hp-5,0,unit.maxHp);return unit.name+" perde 5 PS per il fetore.";}
 return "";
}
function advanceStatus(unit){for(const k of STATUS){if(unit.status[k]>0)unit.status[k]--;if(unit.status[k]===0)delete unit.status[k];}}
function applyMove(battle,who,move,random,log){
 const source=battle[who],target=battle[who==="player"?"enemy":"player"];
 if(source.hp<=0)return;
 if(source.status.stordito>0){
  log.push(source.name+" è stordito e salta il turno!");
  delete source.status.stordito;return;
 }
 if(source.fiato<move.cost){log.push(source.name+" è senza Fiato!");return;}
 source.fiato-=move.cost;
 log.push(source.name+" usa "+move.name+"!");
 let accuracy=move.accuracy-(source.status.impiastricciato?22:0)-(source.status.scivoloso&&move.type==="rottami"?20:0);
 if(rngValue(random)*100>=accuracy){log.push("Attacco mancato.");return;}
 let damage=move.power;
 if(source.status.intimorito)damage=Math.round(damage*.77);
 if(CREATURES[source.id].types.includes(move.type))damage=Math.round(damage*1.1);
 if(CREATURES[target.id].types.includes(COUNTERS[move.type])){damage=Math.round(damage*1.16);log.push("Mossa molto efficace!");}
 else if(CREATURES[target.id].types.some(type=>COUNTERS[type]===move.type)){damage=Math.round(damage*.88);log.push("Poco efficace...");}
 if(ZONE_BONUS[battle.zone]===move.type){damage=Math.round(damage*1.15);log.push("Il quartiere potenzia la mossa!");}
 if(who==="enemy")damage=Math.max(1,Math.round(damage*(battle.zone===0?.73:battle.zone===1?.78:.83)));
 damage=Math.max(1,damage+Math.floor(rngValue(random)*5)-2);
 target.hp=cap(target.hp-damage,0,target.maxHp);
 log.push("−"+damage+" PS a "+target.name+".");
 if(move.effect&&target.hp>0&&rngValue(random)*100<move.chance){
  const duration=move.effect==="stordito"?1:move.effect==="appestato"?3:2;
  target.status[move.effect]=Math.max(target.status[move.effect]||0,duration);
  log.push(target.name+" è "+move.effect+"!");
 }
}
function chooseEnemyMove(b,random){
 const options=b.enemy.moves.map(id=>MOVE[id]).filter(m=>m&&m.cost<=b.enemy.fiato&&m.tier<=Math.max(2,Math.min(3,b.zone+2)));
 if(!options.length)return null;
 // Weighted simple AI: strong moves when healthy, cheap moves when low on energy.
 const best=options.slice().sort((a,d)=>(d.power/(d.cost+1)*.4+d.power*.6)-(a.power/(a.cost+1)*.4+a.power*.6));
 const max=Math.min(3,best.length);
 return best[Math.floor(rngValue(random)*max)];
}
function takeTurn(b,action,random=Math.random){
 if(b.ended)return{ok:false,error:"Battaglia terminata",battle:b};
 const log=[];
 const switchId=typeof action==="string"&&action.startsWith("switch:")?action.slice(7):null;
 if(action==="flee"){b.ended="escaped";b.last=log;log.push("Nino si allontana senza registrare il Ninomon.");return{ok:true,log,battle:b};}
 if(switchId){
  if(!b.party||!b.party[switchId]||switchId===b.player.id||b.party[switchId].hp<=0)return{ok:false,error:"Ninomon non disponibile",battle:b};
 }else{
  if(b.player.hp<=0)return{ok:false,error:"Scegli un altro Ninomon per continuare",battle:b};
  if(action!=="rest"&&!b.player.moves.includes(action))return{ok:false,error:"Mossa non equipaggiata",battle:b};
  if(action!=="rest"&&(!MOVE[action]||b.player.fiato<MOVE[action].cost))return{ok:false,error:"Fiato insufficiente",battle:b};
 }
 const forcedSwitch=b.player.hp<=0;
 const move=MOVE[action];
 b.round++;
 if(switchId){
  b.player=b.party[switchId];
  log.push("Nino manda in campo "+b.player.name+"!");
 }else if(action==="rest"){
  if(b.player.status.stordito>0){log.push(b.player.name+" è stordito: salta il turno.");delete b.player.status.stordito;}
  else{b.player.fiato=cap(b.player.fiato+3,0,b.player.maxFiato);log.push(b.player.name+" riprende Fiato (+3).");}
 }else applyMove(b,"player",move,random,log);
 if(b.enemy.hp===0){b.ended="win";log.push("Nino ha vinto! Ora può fotografare il Ninomon.");}
 else if(!forcedSwitch){
  const enemyMove=chooseEnemyMove(b,random);
  if(!enemyMove){b.enemy.fiato=cap(b.enemy.fiato+3,0,b.enemy.maxFiato);log.push(b.enemy.name+" riprende Fiato.");}
  else applyMove(b,"enemy",enemyMove,random,log);
 }
 if(!b.ended){
  for(const unit of [b.player,b.enemy]){
   const dot=statusEffects(unit);if(dot)log.push(dot);
  }
  if(b.enemy.hp===0){b.ended="win";log.push("Vittoria! Fotografa il Ninomon.");}
  else if(b.player.hp===0){
   if(Object.values(b.party).some(p=>p.hp>0))log.push("Questo Ninomon è KO. Cambia creatura per continuare!");
   else{b.ended="lose";log.push("Squadra sconfitta!");}
  }
 }
 // Stun is consumed on its turn, otherwise persists to the next action.
 for(const unit of [b.player,b.enemy]){
  const stun=unit.status.stordito;
  advanceStatus(unit);
  if(stun)unit.status.stordito=stun; // mark remains for the next action unless it was consumed
  if(!b.ended)unit.fiato=cap(unit.fiato+1,0,unit.maxFiato);
 }
 b.last=log;b.log.push(...log);return{ok:true,log,battle:b};
}
root.NINOMON_BATTLE={TYPES,MOVES:moveList,MOVE,CREATURES,STATUS,ZONE_BONUS,COUNTERS,make,takeTurn,loadout,availableTier};
})(typeof window!=="undefined"?window:globalThis);
