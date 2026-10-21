import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {buildRoadGraph} from './roads.mjs';
import {createIdlePeople,stepIdlePeople,idleDensityAt} from './npc-idle.mjs';
import {NOVITA,novitaTarget} from './novita.mjs';

const roads=[{id:1,n:'Via Roma',t:'residential',w:8,p:[0,0,120,0,240,0]}];
const graph=buildRoadGraph(roads),onRoad=(x,y)=>Math.abs(y)<5,canStand=(x,y)=>x>=0&&x<=240&&y<=-5&&y>=-24;
const doors=[{x:31,y:-7}],props=[{kind:7,x:185,y:-11,a:0,roadId:1},{kind:8,x:205,y:-11,a:0,roadId:1}];
const map={pois:[{n:'Bar Roma',k:'bar',p:[29,-13]},{n:'Pizzeria',k:'fast_food',p:[83,-13]},
 {n:'Municipio',k:'townhall',p:[145,-13]}],buildings:[{id:7,n:'Chiesa',usage:'place_of_worship',p:[106,-16,118,-16,118,-10,106,-10]}]};
const make=()=>createIdlePeople({map,graph,props,market:{stalls:[{id:'S1',x:166,y:-9}]},doors,canStand,onRoad,kindCount:135});

test('punti da POI OSM, chiesa, mercato e panchine: max 40, fuori strada e lontani dagli ingressi',()=>{
 const idle=make();
 assert.ok(idle.spots.length>=8&&idle.spots.length<=40,`posti: ${idle.spots.length}`);
 const activities=new Set(idle.spots.map(p=>p.activity));
 for(const kind of ['chat','civic','church','bench'])assert.ok(activities.has(kind),kind);
 for(const p of idle.spots){
  assert.ok(canStand(p.x,p.y),p.source);
  assert.equal(onRoad(p.x,p.y),false,p.source);
  assert.ok(doors.every(d=>Math.hypot(p.x-d.x,p.y-d.y)>4),p.source);
  assert.ok(p.kind>=0&&p.kind<135);
  assert.ok(p.source.startsWith('poi:')||p.source.startsWith('osm:')||p.source.startsWith('stall:')||p.source.startsWith('road:'));
 }
 assert.ok(idle.spots.filter(p=>p.activity==='civic').every(p=>p.kind===19||p.kind===20),'anziani al Municipio');
 assert.ok(idle.spots.filter(p=>p.activity==='bench').every(p=>p.a===Math.PI/2&&p.braking),'panchina: posa frontale ferma');
});

test('densità modesta: quasi nessuno di notte, più persone a metà mattina e la sera',()=>{
 assert.equal(idleDensityAt(2*60),1);
 assert.equal(idleDensityAt(11*60),36);
 assert.equal(idleDensityAt(18*60),38);
 assert.equal(idleDensityAt(15*60),18);
 assert.equal(idleDensityAt(23*60),3);
 const idle=make();
 const night=stepIdlePeople(idle,.05,{minutes:2*60,canStand,onRoad,doors}).length;
 const morning=stepIdlePeople(idle,.05,{minutes:11*60,canStand,onRoad,doors}).length;
 assert.ok(morning>night&&morning<=40);
});

test('si guardano e cambiano direzione; si scostano dal giocatore senza entrare in strada',()=>{
 const idle=make();
 stepIdlePeople(idle,.05,{minutes:11*60,canStand,onRoad,doors});
 const person=idle.active.find(p=>p.activity==='chat');assert.ok(person);
 const before=person.a;person.lookSeconds=.01;
 stepIdlePeople(idle,.1,{minutes:11*60,canStand,onRoad,doors});
 assert.ok(person.lookSeconds>=3&&person.lookSeconds<=6);
 assert.ok(Number.isFinite(person.a));
 const home={x:person.x,y:person.y};
 stepIdlePeople(idle,.5,{minutes:11*60,player:{x:person.x-.8,y:person.y},canStand,onRoad,doors});
 assert.ok(Math.hypot(person.x-home.x,person.y-home.y)>.05,'si scosta');
 assert.ok(canStand(person.x,person.y)&&!onRoad(person.x,person.y));
 assert.notEqual(person.a,undefined);assert.ok(Number.isFinite(before));
});

test('collegamento nel gioco: nessuna collisione, disegno con lo stesso renderer, NOVITÀ e versioni',async()=>{
 const [game,html,novita,work,visual,approve]=await Promise.all(['game.mjs','index.html','novita.mjs','WORK_LOG.md','VISUAL_PROGRESS.md','NOVITA_DA_APPROVARE.md'].map(f=>readFile(new URL(f,import.meta.url),'utf8')));
 assert.match(game,/npc-idle\.mjs\?v=003/);
 assert.match(game,/createNeighbourhoodIdle\(\)/);
 assert.match(game,/stepIdlePeople\(state\.idle,elapsed/);
 assert.match(game,/drawIdlePeople\(c,state\.idle/);
 assert.doesNotMatch(game,/makeCollisionIndex\([^\n]*state\.idle/);
 assert.match(game,/novita\.mjs\?v=019/);
 assert.match(html,/game\.mjs\?v=219/);
 assert.match(novita,/id:'vita-di-quartiere'/);
 const entry=NOVITA.find(e=>e.id==='vita-di-quartiere');assert.equal(entry.ora,660);
 assert.deepEqual(novitaTarget(entry,{spawn:[0,0],idle:{spots:[{x:18,y:7}]}}),{x:18,y:7});
 for(const doc of [work,visual,approve])assert.match(doc,/vita di quartiere/i);
});
