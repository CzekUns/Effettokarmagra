import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {MARKET_AREA,MARKET_RULES,MARKET_TYPES,MARKET_ART,PARASOL_LIFT,marketCalendar,stallTargetBuild,layoutMarketStalls,buildMarketGrid,findMarketPath,
 marketApproaches,createMarket,stepMarket,marketBlocksWalker,marketBlocksVehicle,parasolRevealTarget,stepParasolReveal} from './market.mjs';
import {npcWeekday,npcDay,NPC_START_MINUTE} from './npc-agenda.mjs';
import {makeCollisionIndex,nearbyColliders} from './traffic-collision.mjs';

// Isolato di prova con le stesse vie del rione 219 (assi dritti) e la pensilina OSM al centro.
const roads=[{n:'Via Dublino',t:'residential',p:[1000,919,1300,919]},{n:'Via Ginevra',t:'residential',p:[1000,977,1300,977]},
 {n:'Via Praga',t:'residential',p:[1133,800,1133,1100]},{n:'Via Budapest',t:'residential',p:[1204,800,1204,1100]}];
const HALF=7.7;
const canopy=(x,y)=>x>=1162.6&&x<=1172.5&&y>=934.1&&y<=961.1;
const segDist=(x,y,[ax,ay,bx,by])=>{const dx=bx-ax,dy=by-ay,t=Math.max(0,Math.min(1,((x-ax)*dx+(y-ay)*dy)/(dx*dx+dy*dy)));return Math.hypot(x-ax-t*dx,y-ay-t*dy);};
const carriageway=(x,y,m=0)=>roads.some(r=>segDist(x,y,r.p)<HALF+m);
const walkable=(x,y)=>!canopy(x,y);
const obstacles=[{x:1149.9,y:942.4,r:3,walkR:.8,crown:4.6},{x:1187.4,y:947,r:3,walkR:.8,crown:4.6},{x:1159.1,y:961.1,r:1.7,walkR:1.1},{x:1177.4,y:935.6,r:1.7,walkR:1.1}];
const ctx={roads,walkable,carriageway,obstacles,roadHalf:()=>HALF};
const insideRect=(r,x,y,pad=0)=>x>r.x0-pad&&x<r.x1+pad&&y>r.y0-pad&&y<r.y1+pad;

test('Q42 calendar: day 0 of the game is a Friday, market 6:30 setup, 7:30–13:30 open, teardown by 14:30',()=>{
 assert.equal(npcWeekday(NPC_START_MINUTE),'VENERDÌ');assert.equal(npcWeekday(24*60+10),'SABATO');assert.equal(npcWeekday(7*24*60+600),'VENERDÌ');
 assert.equal(npcDay(24*60-1),0);assert.equal(npcDay(24*60),1);
 const at=(h,m,day=0,force=false)=>marketCalendar(day*1440+h*60+m,{force});
 assert.equal(at(6,0).phase,'chiuso');assert.equal(at(6,45).phase,'montaggio');assert.equal(at(10,30).phase,'aperto');
 assert.equal(at(13,45).phase,'smontaggio');assert.equal(at(15,0).phase,'chiuso');
 assert.equal(at(10,30,1).phase,'chiuso','Saturday: no market');assert.equal(at(10,30,1,true).phase,'aperto','?mercato=1 forces it');
 assert.equal(at(10,30,7).phase,'aperto','next Friday');
 assert.ok(at(10,45).crowd>=.99&&at(7,40).crowd<.3&&at(13,20).crowd<at(12,0).crowd,'busier late in the morning');
 assert.equal(at(8,0).marketDay,true);assert.equal(at(8,0).weekday,'VENERDÌ');
});

test('Q42 sheet and area data: types, sizes and polygon are the ones of the CSV and of data/market-area.json',async()=>{
 const [csv,json]=await Promise.all(['mercato-banchi.csv','data/market-area.json'].map(f=>readFile(new URL('./'+f,import.meta.url),'utf8')));
 const rows=csv.trim().split('\n').slice(1).map(l=>l.match(/("([^"]|"")*"|[^,]*)(,|$)/g).map(c=>c.replace(/,$/,'').replace(/^"|"$/g,'')));
 assert.equal(rows.length,MARKET_TYPES.length);
 for(const r of rows){
  const t=MARKET_TYPES.find(x=>x.id===r[0]);assert.ok(t,'type '+r[0]);
  assert.equal(t.count,Number(r[2]));assert.equal(t.w,Number(r[3]));assert.equal(t.d,Number(r[4]));assert.equal(t.priority,r[16]);
  if(t.umbrella){assert.equal(t.umbrella.d,Number(r[6]));}
  else assert.equal(r[5],'furgone-negozio');
 }
 const area=JSON.parse(json);
 assert.deepEqual(MARKET_AREA.polygon.map(p=>[...p]),area.polygon_game);assert.deepEqual([...MARKET_AREA.centre],area.centre_game);
 assert.deepEqual([...MARKET_AREA.streets],area.streets);
 assert.deepEqual(MARKET_ART,{},'no final art yet: every stall is a placeholder');
});

test('Q42 layout: 15–23 stalls in rows, never on roads, buildings, trees, benches or each other, room in front of each',()=>{
 const stalls=layoutMarketStalls(ctx);
 assert.ok(stalls.length>=15&&stalls.length<=23,'stalls: '+stalls.length);
 assert.ok(stalls.some(s=>s.type==='B01')&&stalls.some(s=>s.type==='B04'),'P0 types (fruit, clothes) are there');
 const again=layoutMarketStalls(ctx);assert.deepEqual(again.map(s=>[s.type,s.x,s.y]),stalls.map(s=>[s.type,s.x,s.y]),'deterministic');
 for(const s of stalls){
  const t=MARKET_TYPES.find(x=>x.id===s.type);
  assert.ok(Math.abs(s.w-t.w*MARKET_RULES.scale)<1e-9&&Math.abs(s.d-t.d*MARKET_RULES.scale)<1e-9,'real size × game scale');
  for(const [x,y] of [[s.rect.x0,s.rect.y0],[s.rect.x1,s.rect.y1],[s.x,s.y]]){
   assert.ok(walkable(x,y),'not in a building');assert.equal(carriageway(x,y,.3),false,'not on a carriageway');
  }
  for(const o of obstacles){const qx=Math.max(s.rect.x0,Math.min(o.x,s.rect.x1)),qy=Math.max(s.rect.y0,Math.min(o.y,s.rect.y1));assert.ok(Math.hypot(o.x-qx,o.y-qy)>=o.r,'clear of '+JSON.stringify(o));}
  for(const o of stalls)if(o!==s)assert.ok(!(s.rect.x0<o.rect.x1&&s.rect.x1>o.rect.x0&&s.rect.y0<o.rect.y1&&s.rect.y1>o.rect.y0),'no overlaps');
  for(const f of s.fronts){assert.ok(walkable(f.x,f.y)&&!stalls.some(o=>insideRect(o.rect,f.x,f.y)),'customers stand outside every stall');}
  if(s.canopy){
   const half=s.canopy.size/2,cx=s.x+PARASOL_LIFT.x,cy=s.y+PARASOL_LIFT.y;
   for(const o of obstacles.filter(o=>o.crown)){const qx=Math.max(cx-half,Math.min(o.x,cx+half)),qy=Math.max(cy-half,Math.min(o.y,cy+half));assert.ok(Math.hypot(o.x-qx,o.y-qy)>=o.crown,'the lifted canopy does not cover a tree');}
  }
 }
});

test('Q42 stalls are solid for walkers and vehicles once built (not the umbrellas); a car touching one can always back away',()=>{
 const m=createMarket(ctx);const s=m.stalls[0];
 assert.equal(marketBlocksWalker(m,s.x,s.y),null,'only a painted mark while not built');
 s.build=1;
 assert.equal(marketBlocksWalker(m,s.x,s.y),s);assert.equal(marketBlocksWalker(m,s.fronts[0].x,s.fronts[0].y),null);
 const shape={halfLength:3.15,halfWidth:1.7};
 const fx=Math.cos(s.face),fy=Math.sin(s.face);
 const touching={x:s.x+fx*(s.d/2+1.2),y:s.y+fy*(s.d/2+1.2),a:s.face};
 assert.equal(marketBlocksVehicle(m,touching,shape),true,'a car body on the counter is blocked');
 assert.equal(marketBlocksVehicle(m,{x:s.x+fx*(s.d/2+2.4),y:s.y+fy*(s.d/2+2.4),a:s.face+Math.PI/2},shape),false,'parallel and clear: free');
 const away={...touching,x:touching.x+fx*.4,y:touching.y+fy*.4},deeper={...touching,x:touching.x-fx*.4,y:touching.y-fy*.4};
 assert.equal(marketBlocksVehicle(m,away,shape,touching),false,'BF01 rule: moving out of the overlap is allowed');
 assert.equal(marketBlocksVehicle(m,deeper,shape,touching),true,'never deeper');
});

test('Q42 R01: an umbrella fades like the roofs when the player (on foot or at the wheel) is under it',()=>{
 const m=createMarket(ctx);const s=m.stalls.find(x=>x.canopy);s.build=1;
 const under={x:s.x+PARASOL_LIFT.x,y:s.y+PARASOL_LIFT.y,radius:.6},far={x:s.x+40,y:s.y+40,radius:.6};
 assert.equal(parasolRevealTarget(s,[under]),1);assert.equal(parasolRevealTarget(s,[far]),0);
 assert.equal(parasolRevealTarget(s,[{x:s.x,y:s.y+s.d,radius:3}]),1,'a car next to the stall reveals it too');
 for(let i=0;i<30;i++)stepParasolReveal(m,[under],1/30);
 assert.ok(s.reveal>.95,'fades in about a second: '+s.reveal.toFixed(2));
 for(let i=0;i<60;i++)stepParasolReveal(m,[far],1/30);
 assert.ok(s.reveal<.05,'and comes back');
});

test('Q42 paths: the 1 m grid avoids stalls and the canopy, and approaches come along the pavements of the market streets',()=>{
 const m=createMarket(ctx);for(const s of m.stalls)s.build=1;
 const g=buildMarketGrid(m.stalls,ctx);
 const a=m.stalls[0].fronts[0],b=m.stalls.at(-1).fronts[1];
 const path=findMarketPath(g,a,b);
 assert.ok(path&&path.length>=2,'a path between two stalls');
 for(let k=1;k<path.length;k++){const p=path[k-1],q=path[k];
  for(let t=0;t<=1;t+=.05){const x=p.x+(q.x-p.x)*t,y=p.y+(q.y-p.y)*t;
   assert.ok(walkable(x,y),'never through the canopy');
   assert.ok(!m.stalls.some(s=>insideRect(s.rect,x,y,-.05)),'never through a stall');}}
 const ap=marketApproaches(ctx);
 assert.ok(ap.length>=4,'approaches: '+ap.length);
 assert.deepEqual([...new Set(ap.map(x=>x.road))].sort(),['Via Budapest','Via Dublino','Via Ginevra','Via Praga']);
 for(const x of ap){
  const d=Math.hypot(x.source.x-MARKET_AREA.centre[0],x.source.y-MARKET_AREA.centre[1]);
  assert.ok(d>=MARKET_RULES.approach[0]&&d<=MARKET_RULES.approach[1]+2,'source 38–105 m away: '+d.toFixed(1));
  const own=roads.find(r=>r.n===x.road);
  for(const q of x.points)assert.ok(Math.abs(segDist(q.x,q.y,own.p)-(HALF+1.7))<.3,'on the pedestrian line of its street (crossing side streets at the corners)');
 }
});

function run(m,from,to,{view,step=.1,player=null,index=null,onTick=()=>{}}={}){
 for(let t=from;t<to;t+=step){
  stepMarket(m,step,{minutes:t,force:true,view,player,index});
  onTick(m,t);
 }
}
const FAR=[5000,5000,5100,5100],AREA=[1120,900,1220,1000];

test('Q42 a whole morning out of sight: stalls ready by 7:30, people while it is open, nothing left after 14:30',()=>{
 const m=createMarket(ctx);
 run(m,6*60+20,7*60+31,{view:FAR,step:.5});
 assert.ok(m.stalls.every(s=>s.build===1),'all stalls built at opening');
 assert.equal(m.people.filter(q=>q.role==='vendor').length,m.stalls.length,'one vendor per stall');
 run(m,7*60+31,10*60+30,{view:FAR,step:.5});
 assert.ok(m.people.filter(q=>q.role==='customer').length>=10,'busy late morning');
 run(m,10*60+30,14*60+40,{view:FAR,step:.5});
 assert.equal(m.people.length,0,'everybody gone');assert.ok(m.stalls.every(s=>s.build===0),'only the painted marks are left');
});

test('Q42 in view: customers walk in from the streets, buy at stalls, leave; nobody pops in or stands inside a stall',()=>{
 const m=createMarket(ctx),index=makeCollisionIndex([]);
 run(m,10*60,10*60+1,{view:FAR,index});
 const start=new Set(m.people.map(q=>q.id));
 const popIns=[];let insideStall=0;const still=new Map();let stuck=0;
 run(m,10*60+1,10*60+1+240/60*60,{view:AREA,step:.1,index,onTick:(mm,t)=>{
  for(const q of mm.people){
   if(!start.has(q.id)){start.add(q.id);if(q.x>AREA[0]+6&&q.x<AREA[2]-6&&q.y>AREA[1]+6&&q.y<AREA[3]-6)popIns.push(q.role);}
   if(q.role!=='vendor'&&mm.stalls.some(s=>s.build>.05&&insideRect(s.rect,q.x,q.y,-.2)))insideStall++;
   const st=still.get(q.id)||{x:q.x,y:q.y,t:0};
   if(Math.hypot(st.x-q.x,st.y-q.y)<.02&&!['buy','work'].includes(q.state))st.t+=.1;else{st.x=q.x;st.y=q.y;st.t=0;}
   if(st.t>15){stuck++;st.t=-1e9;}still.set(q.id,st);
  }
 }});
 assert.deepEqual(popIns,[],'new people only appear at sources outside the view');
 assert.equal(insideStall,0);assert.equal(stuck,0,'nobody stuck outside the counters');
 assert.ok(m.stats.bought>=10,'they buy: '+m.stats.bought);
 // all market people are in the collision index as walkers (traffic and cars see them)
 for(const q of m.people)assert.ok([...nearbyColliders(index,q.x,q.y,1)].includes(q));
});

test('Q42 setup in view is gradual: vendors walk in, stalls grow in stages; teardown in reverse',()=>{
 const m=createMarket(ctx);
 run(m,5*60+20,5*60+21,{view:FAR});
 let partial=0,walkingVendors=0;
 run(m,5*60+21,8*60+15,{view:AREA,step:.1,onTick:mm=>{
  partial=Math.max(partial,mm.stalls.filter(s=>s.build>0&&s.build<.95).length);
  walkingVendors=Math.max(walkingVendors,mm.people.filter(q=>q.role==='vendor'&&q.state==='come').length);
 }});
 assert.ok(walkingVendors>=3,'vendors arrive on foot: '+walkingVendors);
 assert.ok(partial>=3,'stalls being set up step by step: '+partial);
 assert.ok(m.stalls.every(s=>s.build===1),'all ready by 8:15 even when watched from dawn');
 let shrinking=0;
 run(m,13*60+20,14*60+50,{view:AREA,step:.1,onTick:mm=>{shrinking=Math.max(shrinking,mm.stalls.filter(s=>s.build>0&&s.build<.95).length);}});
 assert.ok(shrinking>=3,'stalls taken down step by step');
 assert.ok(m.stalls.every(s=>s.build===0));
});

test('Q42 game wiring: created with the map, stepped after street physics, solid in car and on foot, drawn in layers, weekday in the HUD',async()=>{
 const [game,html]=await Promise.all(['game.mjs','index.html'].map(f=>readFile(new URL('./'+f,import.meta.url),'utf8')));
 assert.match(game,/import \{createMarket,stepMarket,marketBlocksWalker,marketBlocksVehicle,stepParasolReveal,drawMarketGround,drawMarketStalls,drawMarketParasols\} from '\.\/market\.mjs\?v=\d+'/);
 assert.equal((game.match(/state\.streetObjects=createStreetObjects\(\);state\.market=createMelitoMarket\(\);/g)||[]).length,2,'on load and on the width switch');
 const tick=game.indexOf('function tick(dt)'),phys=game.indexOf('stepStreetPhysics(dt);',tick),mk=game.indexOf('stepMelitoMarket(dt);',tick);
 assert.ok(phys>0&&mk>phys&&mk-phys<40);
 assert.match(game,/if\(state\.market&&marketBlocksVehicle\(state\.market,\{x,y,a\},bodyShape\(vehicle\),vehicle\)\)return true;/);
 assert.match(game,/bollardBlocksWalker\(state\.streetObjects,x,y\)\|\|marketBlocksWalker\(state\.market,x,y\)/);
 assert.match(game,/const actors=\[\.\.\.state\.people,\.\.\.\(state\.market\?\.people\|\|\[\]\)/,'market people can be knocked (non-lethal)');
 const draw=game.indexOf('function draw(dt=0)');
 const ground=game.indexOf('drawMarketGround(',draw),stalls=game.indexOf('drawMarketStalls(',draw),people=game.indexOf('drawCityPeople(c,state.market.people',draw),player=game.indexOf('drawPlayer();',draw),paras=game.indexOf('drawMarketParasols(',draw);
 assert.ok(ground>draw&&stalls>ground&&people>stalls&&player>people&&paras>player,'ground marks, stalls, people, player, umbrellas on top');
 assert.match(game,/npcWeekday\(state\.npcClockMinutes\)\+' · '\+formatNpcClock/);
 assert.match(game,/get\('mercato'\)==='1'/);
 assert.ok(Number((html.match(/game\.mjs\?v=(\d+)/)||[])[1])>=162);
 assert.match(html,/id="market-note">MERCATO DEL VENERDÌ · RIONE 219: il luogo è reale, giorno e orari non sono verificati/);
});
