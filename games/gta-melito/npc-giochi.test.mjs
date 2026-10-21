import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createStreetGames,stepStreetGames,streetGamesOpen,STREET_GAME_KIDS,STREET_GAME_ELDERS} from './npc-giochi.mjs';
import {NOVITA,novitaTarget} from './novita.mjs';

const enclosures={list:[{id:'villa-comunale',center:{x:50,y:50},loop:[[20,20],[80,20],[80,80],[20,80]]}]};
const pitches={list:[{id:'campo',kind:'calcetto',cx:150,cy:50,w:40,h:28}]};
const map={pois:[{k:'townhall',n:'Municipio',p:[50,140]}]};
const graph={walkStarts:[0,1],edges:[{from:0,to:1,len:70,roadType:'footway'},
 {from:2,to:3,len:70,roadType:'pedestrian'}],nodes:[{x:210,y:45},{x:280,y:45},{x:330,y:45},{x:400,y:45}]};
const onRoad=(x,y)=>x>90&&x<110,canStand=(x,y)=>x>0&&x<420&&y>0&&y<180&&!(x>90&&x<110);
const make=()=>createStreetGames({map,enclosures,pitches,graph,canStand,onRoad,doors:[{x:51,y:141}]});

test('calendario: scuola e weekend, anziani mattina e pomeriggio',()=>{
 assert.deepEqual(streetGamesOpen(9*60),{kids:false,cards:true});
 assert.deepEqual(streetGamesOpen(17*60+30),{kids:true,cards:true});
 assert.deepEqual(streetGamesOpen(20*60),{kids:false,cards:false});
 assert.deepEqual(streetGamesOpen(24*60+10*60),{kids:true,cards:true}); // sabato
 assert.deepEqual(streetGamesOpen(3*24*60+10*60),{kids:false,cards:true}); // lunedì
 assert.ok(STREET_GAME_KIDS.includes(25)&&STREET_GAME_KIDS.includes(44));
 assert.ok(STREET_GAME_KIDS.length>=6&&STREET_GAME_ELDERS.length>=6);
});

test('villa, campetto, slarghi e Municipio: tutti i punti di gioco fuori strada e dagli ingressi',()=>{
 const games=make();assert.ok(games.ballGroups.some(g=>g.id==='villa'));
 assert.ok(games.ballGroups.some(g=>g.id==='campo-campo'));
 assert.ok(games.ballGroups.filter(g=>g.id.startsWith('slargo')).length>=2);
 assert.equal(games.cardTables.length,2);
 assert.ok(Math.hypot(games.ballGroups[0].center.x-games.cardTables[0].center.x,games.ballGroups[0].center.y-games.cardTables[0].center.y)>10);
 for(const g of games.ballGroups){
  assert.ok(g.kids.length>=3&&g.kids.length<=4);
  for(const p of [g.center,...g.points]){
   assert.ok(canStand(p.x,p.y)&&!onRoad(p.x,p.y),g.id);
   assert.ok(Math.hypot(p.x-51,p.y-141)>4,g.id);
  }
 }
 for(const t of games.cardTables)for(const p of t.people){
  assert.ok(canStand(p.x,p.y)&&!onRoad(p.x,p.y),t.id);
  assert.ok(Math.hypot(p.x-51,p.y-141)>4,t.id);
  assert.equal(p.activity,'bench');
 }
});

test('passaggi ogni 1–3 s, pausa vicino al giocatore, partita aperta sospende i bambini',()=>{
 const games=make();stepStreetGames(games,0,{minutes:17*60+30,canStand,onRoad});
 assert.ok(games.activeKids.length>=3&&games.activeCards.length===2);
 const g=games.activeKids[0],before={...g.ball};
 stepStreetGames(games,.6,{minutes:17*60+30,canStand,onRoad});
 assert.ok(Math.hypot(g.ball.x-before.x,g.ball.y-before.y)>.1);
 const stopped={...g.ball};
 stepStreetGames(games,.2,{minutes:17*60+30,player:g.center,canStand,onRoad});
 assert.deepEqual(g.ball,stopped);assert.ok(g.pause>0);
 stepStreetGames(games,2,{minutes:17*60+30,canStand,onRoad});
 assert.equal(g.pause,0);
 stepStreetGames(games,.1,{minutes:17*60+30,canStand,onRoad,matchOpen:true});
 assert.equal(games.activeKids.length,0);
 for(const p of g.kids)assert.ok(canStand(p.x,p.y)&&!onRoad(p.x,p.y));
});

test('codice collegato, nessun blocco del giocatore, NOVITÀ e registri',async()=>{
 const [game,html,novita,work,visual,approve]=await Promise.all(['game.mjs','index.html','novita.mjs','WORK_LOG.md','VISUAL_PROGRESS.md','NOVITA_DA_APPROVARE.md'].map(f=>readFile(new URL(f,import.meta.url),'utf8')));
 assert.match(game,/npc-giochi\.mjs\?v=001/);assert.match(game,/createNeighbourhoodGames\(\)/);
 assert.match(game,/stepStreetGames\(state\.streetGames,elapsed/);assert.match(game,/drawStreetGames\(c,state\.streetGames/);
 assert.doesNotMatch(game,/makeCollisionIndex\([^\n]*streetGames/);
 assert.match(game,/novita\.mjs\?v=018/);assert.match(html,/game\.mjs\?v=217/);
 assert.match(novita,/id:'giochi-di-strada'/);
 const e=NOVITA.find(x=>x.id==='giochi-di-strada');assert.equal(e.ora,1050);
 assert.deepEqual(novitaTarget(e,{spawn:[0,0],streetGames:{ballGroups:[{center:{x:5,y:7}}]}}),{x:5,y:7});
 for(const d of [work,visual,approve])assert.match(d,/giochi di strada/i);
});
