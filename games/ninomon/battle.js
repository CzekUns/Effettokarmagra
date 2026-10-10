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
 starter:{id:"starter",name:"Gialluca",kind:"Ninomon di Nino",hp:115,color:"#dfc18a",symbol:"◎",types:["rutto","rottami"],base:["rutto-1","rottami-1","sputo-2","sfiga-2"],advanced:["rutto-3","rottami-3"],ultimate:"rutto-4"},
 n01:{id:"n01",name:"Topo sospetto",kind:"Creatura di scalo",hp:96,color:"#a4a6a9",symbol:"?",types:["cacca","puzza"],base:["cacca-1","puzza-1","puzza-2","cacca-2"],advanced:["puzza-3","cacca-3"],ultimate:"cacca-4"},
 n02:{id:"n02",name:"Piccione immobile",kind:"Creatura da sottopasso",hp:106,color:"#8e9eb6",symbol:"?",types:["sputo","sfiga"],base:["sputo-1","sfiga-1","sputo-2","sfiga-2"],advanced:["sputo-3","sfiga-3"],ultimate:"sfiga-4"},
 n03:{id:"n03",name:"Pesce misterioso",kind:"Creatura da marciapiede",hp:115,color:"#cdb0b0",symbol:"?",types:["pipi","schiamazzo"],base:["pipi-1","schiamazzo-1","pipi-2","schiamazzo-2"],advanced:["pipi-3","schiamazzo-3"],ultimate:"pipi-4"},
 n04:{id:"n04",name:"Cane sfatto",kind:"Bestia di scalo",hp:98,color:"#b0a28a",symbol:"!",types:["puzza","rottami"],base:["puzza-1","rottami-1","puzza-2","rottami-2"],advanced:["puzza-3","rottami-3"],ultimate:"puzza-4"},
 n05:{id:"n05",name:"Pagliaccio randagio",kind:"Creatura da tunnel",hp:97,color:"#bd8aa6",symbol:"!",types:["schiamazzo","sfiga"],base:["schiamazzo-1","sfiga-1","schiamazzo-2","sfiga-2"],advanced:["schiamazzo-3","sfiga-3"],ultimate:"schiamazzo-4"},
 n06:{id:"n06",name:"Madama Leoparda",kind:"Divinità del marciapiede",hp:102,color:"#d4a8b2",symbol:"!",types:["sfiga","sputo"],base:["sfiga-1","sputo-1","sfiga-2","sputo-2"],advanced:["sfiga-3","sputo-3"],ultimate:"sfiga-4"},
 n07:{id:"n07",name:"Fumatore col cane",kind:"Coppia dello scalo",hp:112,color:"#a4a17c",symbol:"!",types:["puzza","schiamazzo"],base:["puzza-1","schiamazzo-1","puzza-2","schiamazzo-2"],advanced:["puzza-3","schiamazzo-3"],ultimate:"puzza-4"},
 n08:{id:"n08",name:"Scimmia in felpa",kind:"Abitante del sottopasso",hp:109,color:"#a96f5d",symbol:"!",types:["rutto","rottami"],base:["rutto-1","rottami-1","rutto-2","rottami-2"],advanced:["rutto-3","rottami-3"],ultimate:"rottami-4"},
 n09:{id:"n09",name:"Sacco vivente",kind:"Ninomon da cassonetto",hp:122,color:"#878989",symbol:"!",types:["cacca","puzza"],base:["cacca-1","puzza-1","cacca-2","puzza-2"],advanced:["cacca-3","puzza-3"],ultimate:"cacca-4"},
 n10:{id:"n10",name:"Rana ammuffita",kind:"Creatura del sottopasso umido",hp:108,color:"#a0b99a",symbol:"?",types:["puzza","pipi"],base:["puzza-1","pipi-1","puzza-2","pipi-2"],advanced:["puzza-3","pipi-3"],ultimate:"puzza-4"}
};

const ZONE_BONUS=["rottami","rutto","pipi"];
// Two linked counter loops: a weakness can be exploited without making a low-level fight unwinnable.
const COUNTERS={rutto:"puzza",puzza:"schiamazzo",schiamazzo:"sfiga",sfiga:"rutto",sputo:"cacca",cacca:"pipi",pipi:"rottami",rottami:"sputo"};
const SPEED={starter:15,n01:20,n02:16,n03:9,n04:18,n05:14,n06:17,n07:11,n08:19,n09:7,n10:12};
const cap=(n,a,b)=>Math.max(a,Math.min(b,n));
function roll(random){const n=Number((random||Math.random)());return cap(Number.isFinite(n)?n:.5,0,.999999);}
function availableTier(discoveries){return discoveries>=3?4:discoveries>=2?3:2;}
function loadout(id,discoveries=0){
 const sp=CREATURES[id]||CREATURES.starter, moves=sp.base.slice();
 if(discoveries>=2)moves[2]=sp.advanced[0];
 if(discoveries>=3)moves[3]=sp.ultimate;
 return moves;
}
function actor(id,disc=0,levelHp){
 const sp=CREATURES[id]||CREATURES.starter, hp=levelHp==null?sp.hp:cap(levelHp,0,sp.hp);
 return{id:sp.id,name:sp.name,hp,maxHp:sp.hp,fiato:6,maxFiato:6,speed:SPEED[sp.id]||12,
  guarding:false,status:{},moves:loadout(id,disc)};
}
function previewAttack(b,move,by="enemy"){
 const attacker=b[by],target=b[by==="enemy"?"player":"enemy"];
 if(!move||!attacker||!target)return{min:0,max:0,effectiveness:1};
 let base=move.power;
 if(CREATURES[attacker.id].types.includes(move.type))base*=1.1;
 let multiplier=1;
 if(CREATURES[target.id].types.includes(COUNTERS[move.type]))multiplier=1.18;
 else if(CREATURES[target.id].types.some(t=>COUNTERS[t]===move.type))multiplier=.84;
 if(ZONE_BONUS[b.zone]===move.type)base*=1.12;
 if(by==="enemy")base*=.76+b.zone*.035;
 if(attacker.status.intimorito)base*=.8;
 return{min:Math.max(1,Math.round(base*multiplier)-2),max:Math.max(1,Math.round(base*multiplier)+2),
  effectiveness:multiplier};
}
function chooseEnemyMove(b,random=Math.random){
 const unit=b.enemy,options=unit.moves.map(id=>MOVE[id]).filter(m=>m&&m.cost<=unit.fiato&&m.tier<=Math.min(4,Math.max(2,b.zone+2)));
 if(!options.length)return null;
 const rival=CREATURES[b.player.id];
 const scored=options.map(m=>{
  const estimate=previewAttack(b,m);
  let score=estimate.max*.52+(m.effect&&!b.player.status[m.effect]?4:0)+(m.tier===1?2:0)-m.cost*1.2;
  if(m.type===ZONE_BONUS[b.zone])score+=2;
  if(b.enemy.fiato<=2)score-=m.cost*2;
  if(rival.types.includes(COUNTERS[m.type]))score+=4;
  score+=(roll(random)-.5)*5;
  return{m,score};
 }).sort((a,c)=>c.score-a.score);
 return scored[0].m;
}
function planEnemy(b,random=Math.random){
 const move=chooseEnemyMove(b,random);
 if(!move)return{action:"rest",name:"Riprende Fiato",type:"fiato",cost:0,power:0,
  priority:2,accuracy:100,warning:"Sta riprendendo fiato."};
 const warn=move.tier>=3?"Sta preparando un colpo potente!":move.effect&&move.chance>=38?"Potrebbe infliggere uno stato!":"Si prepara ad attaccare.";
 return{action:move.id,name:move.name,type:move.type,cost:move.cost,power:move.power,
  priority:move.tier===1?1:move.tier===4?-1:0,accuracy:move.accuracy,warning:warn};
}
function make(playerId,enemyId,zone=0,discovered=0,partyIds=[playerId],random=Math.random){
 const ids=[...new Set([playerId,...partyIds])].filter(id=>CREATURES[id]);
 const party={};for(const id of ids)party[id]=actor(id,discovered);
 const sp=CREATURES[enemyId]||CREATURES.n01;
 const b={player:party[playerId]||party.starter,party,enemy:actor(sp.id,Math.max(discovered,zone+1)),
  zone:cap(zone,0,2),round:0,ended:null,log:["Appare "+sp.name+"!"],last:null,intent:null,events:[]};
 b.intent=planEnemy(b,random);return b;
}
function movePriority(action){
 if(action==="guard")return 3;
 if(action==="rest")return 2;
 if(action.startsWith("switch:"))return 4;
 const m=MOVE[action];return m?(m.tier===1?1:m.tier===4?-1:0):0;
}
function effectiveSpeed(unit){return Math.max(1,unit.speed-(unit.status.scivoloso?5:0));}
function statuses(unit){return Object.keys(unit.status).filter(k=>unit.status[k]>0).map(k=>({id:k,turns:unit.status[k]}));}
function takeTurn(b,action,random=Math.random){
 if(b.ended)return{ok:false,error:"Battaglia terminata",battle:b};
 const switchId=typeof action==="string"&&action.startsWith("switch:")?action.slice(7):null;
 const forcedSwitch=b.player.hp<=0;
 if(action==="flee"){
  b.ended="escaped";b.last=["Nino si allontana senza registrare il Ninomon."];
  b.events=[{kind:"message",who:"player",text:b.last[0]}];
  return{ok:true,log:b.last,events:b.events,battle:b};
 }
 if(switchId){
  if(!b.party[switchId]||switchId===b.player.id||b.party[switchId].hp<=0)
   return{ok:false,error:"Ninomon non disponibile",battle:b};
 }else if(forcedSwitch)return{ok:false,error:"Il tuo Ninomon è KO: cambia creatura!",battle:b};
 else if(action!=="guard"&&action!=="rest"&&(!b.player.moves.includes(action)||!MOVE[action]))
   return{ok:false,error:"Mossa non equipaggiata",battle:b};
 else if(MOVE[action]&&b.player.fiato<MOVE[action].cost)return{ok:false,error:"Fiato insufficiente",battle:b};
 const log=[],events=[];
 const emit=(kind,who,text,extra={})=>{events.push({kind,who,text,...extra});if(text)log.push(text)};
 const intent=b.intent||planEnemy(b,random);
 const enemyAction=intent.action;
 b.round++;b.player.guarding=false;b.enemy.guarding=false;
 function impact(attacker,target,move,who){
  if(move.startsWith("switch:")){
   const chosen=b.party[move.slice(7)];
   if(!chosen||chosen.hp<=0)return;
   b.player=chosen;b.player.guarding=false;
   emit("switch","player","Nino manda in campo "+chosen.name+"!",{id:chosen.id});return;
  }
  if(attacker.hp<=0)return;
  if(attacker.status.stordito){
   delete attacker.status.stordito;
   emit("status",who,attacker.name+" è stordito: salta il turno!",{status:"stordito"});return;
  }
  if(move==="rest"){
   const regained=cap(attacker.maxFiato-attacker.fiato,0,3);
   attacker.fiato=cap(attacker.fiato+3,0,attacker.maxFiato);
   emit("rest",who,attacker.name+" riprende Fiato (+"+regained+").",{amount:regained});return;
  }
  if(move==="guard"){
   attacker.guarding=true;attacker.fiato=cap(attacker.fiato+2,0,attacker.maxFiato);
   emit("guard",who,attacker.name+" si ripara e recupera Fiato!",{amount:2});return;
  }
  const m=MOVE[move];
  if(!m)return;
  attacker.fiato=cap(attacker.fiato-m.cost,0,attacker.maxFiato);
  emit("move",who,attacker.name+" usa "+m.name+"!",{move:m.id,type:m.type,tier:m.tier});
  let accuracy=m.accuracy-(attacker.status.impiastricciato?18:0);
  if(roll(random)*100>=accuracy){emit("miss",who,"Il colpo va a vuoto!");return;}
  const prev=target.hp,power=previewAttack(b,m,who),damageBeforeGuard=cap(power.min+Math.floor(roll(random)*5),1,99);
  const damage=target.guarding?Math.max(1,Math.round(damageBeforeGuard*.45)):damageBeforeGuard;
  target.hp=cap(target.hp-damage,0,target.maxHp);
  let msg=target.name+" perde "+(prev-target.hp)+" PS.";
  if(target.guarding)msg+=" Difesa riuscita!";
  if(power.effectiveness>1)msg+=" Superefficace!";
  if(power.effectiveness<1)msg+=" Poco efficace.";
  emit("hit",who,msg,{target:who==="player"?"enemy":"player",before:prev,after:target.hp,
    damage:prev-target.hp,effectiveness:power.effectiveness,guarded:target.guarding,move:m.id,type:m.type});
  if(m.effect&&target.hp>0&&roll(random)*100<m.chance){
   const turns=m.effect==="stordito"?1:m.effect==="appestato"?4:3;
   target.status[m.effect]=Math.max(target.status[m.effect]||0,turns);
   emit("status",who,target.name+" è "+m.effect+"!",{target:who==="player"?"enemy":"player",status:m.effect});
  }
 }
 const actions=[];
 if(!forcedSwitch)actions.push({who:"enemy",action:enemyAction,priority:movePriority(enemyAction),speed:effectiveSpeed(b.enemy)});
 actions.push({who:"player",action,priority:movePriority(action),speed:effectiveSpeed(b.player)});
 // Priority then speed then a seeded/random tie break; stable choice cannot change after the player clicks.
 actions.sort((a,c)=>c.priority-a.priority||c.speed-a.speed||((roll(random)<.5)?-1:1));
 let playerKnockedOut=false,enemyKnockedOut=false;
 for(const chosen of actions){
  if(b.enemy.hp<=0)break;
  if(b.player.hp<=0 && !(chosen.who==="player"&&chosen.action.startsWith("switch:")))break;
  const isPlayer=chosen.who==="player";
  impact(isPlayer?b.player:b.enemy,isPlayer?b.enemy:b.player,chosen.action,chosen.who);
  if(b.enemy.hp===0){enemyKnockedOut=true;break;}
  if(b.player.hp===0){playerKnockedOut=true;break;}
 }
 // Effects damage at the end of a completed round; newly applied non-stun conditions count down.
 for(const [who,unit] of [["player",b.player],["enemy",b.enemy]]){
  if(unit.hp<=0)continue;
  if(unit.status.appestato){
   const before=unit.hp;
   unit.hp=cap(unit.hp-4,0,unit.maxHp);
   emit("dot",who,unit.name+" perde "+(before-unit.hp)+" PS per il fetore!",{
    target:who,before,after:unit.hp,damage:before-unit.hp});
  }
  for(const key of Object.keys(unit.status)){
   if(key==="stordito")continue;
   unit.status[key]--;
   if(unit.status[key]<=0){delete unit.status[key];emit("cure",who,unit.name+" non è più "+key+".",{status:key});}
  }
  unit.fiato=cap(unit.fiato+1,0,unit.maxFiato);
  unit.guarding=false;
 }
 if(b.enemy.hp===0){
  b.ended="win";emit("victory","player","Vittoria! Ora puoi fotografare il Ninomon.");
 }else if(b.player.hp===0){
  const reserves=Object.values(b.party).some(unit=>unit.id!==b.player.id&&unit.hp>0);
  emit("ko","player",b.player.name+" è KO!"+(reserves?" Scegli un compagno.":""));
  if(!reserves){b.ended="lose";emit("defeat","enemy","La squadra è sconfitta!");}
 }
 b.intent=b.ended?null:planEnemy(b,random);
 b.last=log;b.events=events;b.log.push(...log);if(b.log.length>80)b.log.splice(0,b.log.length-80);
 return{ok:true,log,events,battle:b};
}
root.NINOMON_BATTLE={TYPES,MOVES:moveList,MOVE,CREATURES,STATUS,ZONE_BONUS,COUNTERS,SPEED,
 make,takeTurn,loadout,availableTier,planEnemy,previewAttack,statuses};
})(typeof window!=="undefined"?window:globalThis);
