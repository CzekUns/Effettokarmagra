import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {buildRoadGraph,createAgents,stepAgents} from './roads.mjs';
import {createSocial,stepSocial,knows,canSocialize,SOCIAL_RULES} from './npc-social.mjs';

const graph=buildRoadGraph([{id:1,n:'Via Roma',t:'residential',w:8,p:[0,0,450,0,900,0]},{id:2,n:'Traversa',t:'residential',w:6,p:[450,-200,450,0,450,200]}]);
const view=[-50,-300,950,300],dt=.05;
const crowd=()=>createAgents(graph,40,310,'walk',[]);

function simulate(seconds,{people=crowd(),vehicles=()=>[],alarm=()=>null}={}){
 const social=createSocial(909),said=[],events=[];
 const held=new Map();
 for(let i=0;i<seconds/dt;i++){
  stepAgents(graph,people,dt,null,{view,validRecovery:()=>true});
  const ev=stepSocial(social,dt,{people,graph,view,vehicles:vehicles(i*dt),alarm:alarm(social),say:(a,t)=>said.push({t:social.clock,text:t})});
  for(const e of ev)events.push({...e,t:+social.clock.toFixed(2)});
  for(const p of people){if(p.social?.hold){const h=held.get(p);if(h)assert.ok(Math.hypot(p.x-h.x,p.y-h.y)<1e-9,'a chatting pedestrian stands still');else held.set(p,{x:p.x,y:p.y});}else held.delete(p);}
 }
 return {social,said,events,people};
}

test('Q11 acquaintances meet spontaneously, chat face to face for a while, then part and walk on',()=>{
 const run=simulate(240);
 const met=run.events.filter(e=>e.type==='met');
 assert.ok(met.length>=3,'spontaneous encounters: '+met.length);
 assert.ok(run.social.log.length>=met.length-run.social.groups.length,'every group ends');
 for(const g of run.social.log.filter(g=>g.reason==='saluti'))assert.ok(g.seconds>=SOCIAL_RULES.chatMin-.01&&g.seconds<=SOCIAL_RULES.chatMax+5.1,'a short chat: '+g.seconds+' s');
 const before=run.people.map(p=>({x:p.x,y:p.y}));
 for(let i=0;i<200;i++)stepAgents(graph,run.people,dt,null,{view,validRecovery:()=>true});
 const moving=run.people.filter((p,i)=>Math.hypot(p.x-before[i].x,p.y-before[i].y)>1).length;
 assert.ok(moving>=run.people.length-run.social.groups.reduce((n,g)=>n+g.members.length,0)-2,'nobody stays stuck after a chat');
});

test('Q11 few, spaced-out bubbles: at most two at once, six seconds apart, context lines',()=>{
 const {said}=simulate(240);
 assert.ok(said.length>=2);
 for(let i=1;i<said.length;i++)assert.ok(said[i].t-said[i-1].t>=SOCIAL_RULES.bubbleCooldown-1e-9,'spaced bubbles');
 assert.ok(said.every(s=>s.text.length<=24),'short lines');
 const rainy=createSocial(1);const people=pairAt(10,0);const lines=[];
 for(let k=0;k<200&&!rainy.groups.length;k++)stepSocial(rainy,.25,{people,graph,view,rain:1,say:(a,t)=>lines.push(t)});
 assert.deepEqual(lines,['Che acqua oggi!'],'rain gets its own line');
});

function pairAt(x,y,seedA=null){
 // Due passanti fermi a 1,5 m che si conoscono, a metà di Via Roma.
 const e=graph.edges.findIndex(q=>q.name==='Via Roma'&&q.angle===0&&graph.nodes[q.from].x===0);
 let s=seedA??1;while(true){const a={seed:s},b={seed:s+1};if(knows(a,b))break;s++;}
 const make=(seed,dx)=>({x:200+x+dx,y:y+7,a:0,edge:e,t:(200+x+dx)/graph.edges[e].len,speed:1,kind:0,seed,wait:0,body:'walk',side:1,routine:'stroller',segments:0,home:{x:200,y:7,edge:e,side:1,radius:80}});
 return [make(s,0),make(s+1,1.5)];
}
function startGroup(people,seed=909){
 const social=createSocial(seed);
 for(let k=0;k<200&&!social.groups.length;k++)stepSocial(social,.25,{people,graph,view});
 assert.equal(social.groups.length,1,'they meet');
 return social;
}

test('Q11 danger breaks the group at once: a fast car close by, a horn, or a knock',()=>{
 const people=pairAt(0,0),social=startGroup(people),c={x:(people[0].x+people[1].x)/2,y:people[0].y};
 stepSocial(social,.05,{people,graph,view,vehicles:[{x:c.x+3,y:c.y,speed:4}]});
 assert.equal(social.groups.length,1,'a slow car parking nearby is fine');
 const said=[];
 const ev=stepSocial(social,.05,{people,graph,view,vehicles:[{x:c.x+3,y:c.y,speed:12}],say:(a,t)=>said.push(t)});
 assert.deepEqual(ev,[{type:'broken',size:2}]);assert.equal(social.log.at(-1).reason,'pericolo');
 assert.ok(people.every(p=>!p.social.hold),'both free to move');
 const p2=pairAt(40,0),s2=startGroup(p2);
 stepSocial(s2,.05,{people:p2,graph,view,alarm:{x:p2[0].x+10,y:p2[0].y,t:s2.clock}});
 assert.equal(s2.groups.length,0,'a horn 10 m away scatters them');
 const p3=pairAt(80,0),s3=startGroup(p3);p3[1].impactTime=.4;
 stepSocial(s3,.05,{people:p3,graph,view});assert.equal(s3.groups.length,0,'a knock ends the chat');
});

test('Q11 never on a carriageway: two acquaintances crossing a road do not stop there',()=>{
 const people=pairAt(0,0),social=createSocial(909);
 for(let k=0;k<200;k++)stepSocial(social,.25,{people,graph,view,onRoad:()=>true});
 assert.equal(social.groups.length,0);assert.equal(social.log.length,0);
 for(let k=0;k<200&&!social.groups.length;k++)stepSocial(social,.25,{people,graph,view,onRoad:()=>false});
 assert.equal(social.groups.length,1,'the same pair meets on the pavement');
});

test('Q11 small groups: a third acquaintance can join, never more than three',()=>{
 let joined=null;
 for(let s=1;s<4000&&!joined;s++){
  const people=pairAt(0,0,s);
  const third={...people[1],seed:people[0].seed+7,x:people[1].x+.8,social:undefined};
  if(!knows(people[0],third)&&!knows(people[1],third))continue;
  const social=createSocial(s);
  for(let k=0;k<60&&!(social.groups[0]?.members.length===3);k++)stepSocial(social,.25,{people:[...people,third],graph,view});
  if(social.groups[0]?.members.length===3)joined={social,people:[...people,third]};
 }
 assert.ok(joined,'a third person joins');
 const fourth={...joined.people[0],seed:joined.people[0].seed+99,x:joined.people[0].x-.5,social:undefined};
 for(let k=0;k<40;k++)stepSocial(joined.social,.25,{people:[...joined.people,fourth],graph,view});
 assert.ok(joined.social.groups.every(g=>g.members.length<=SOCIAL_RULES.maxGroup));
});

test('Q11 who can stop: only walking pedestrians away from corners, not at doors, not twice in a row',()=>{
 const [a]=pairAt(0,0);
 assert.equal(canSocialize(a,graph,0),true);
 for(const change of [{indoors:true},{corner:{}},{impactTime:.3},{needsRoutineRecovery:true},{body:'car'},{t:.995}])
  assert.equal(canSocialize({...a,...change},graph,0),false,JSON.stringify(Object.keys(change)));
 assert.equal(canSocialize({...a,t:.002},graph,0),true,'the dead end of the street is not a junction');
 assert.equal(canSocialize({...a,wait:2},graph,0),true,'someone waiting on the pavement can be greeted');
 assert.equal(canSocialize({...a,social:{hold:false,until:50}},graph,10),false,'cool-down after a chat');
 const resident={...a,residentRoutine:{phase:'OUTBOUND',lateral:0}};
 assert.equal(canSocialize(resident,graph,0),true);
 for(const plan of [{phase:'ACTING'},{phase:'OUTBOUND',doorStep:{}},{phase:'OUTBOUND',detour:{}},{phase:'RETURNING',lateral:1.6}])
  assert.equal(canSocialize({...a,residentRoutine:plan},graph,0),false,JSON.stringify(plan));
 assert.equal(knows(a,a),false);assert.equal(knows({seed:3},{seed:9}),knows({seed:9},{seed:3}),'acquaintance is mutual');
});

test('Q11 game wiring: held pedestrians skip their step, events never pick a chatter, horns scatter groups',async()=>{
 const [game,roads,events]=await Promise.all(['game.mjs','roads.mjs','city-events.mjs'].map(f=>readFile(new URL('./'+f,import.meta.url),'utf8')));
 assert.match(roads,/if\(agent\.social\?\.hold\)\{agent\.braking=true;agent\.stalled=0;continue;\}/);
 assert.match(events,/agent\.social\?\.hold\)return false;/);
 assert.match(game,/import \{createSocial,stepSocial\} from '\.\/npc-social\.mjs\?v=\d+'/);
 assert.match(game,/state\.social=createSocial\(909\)/);
 assert.match(game,/stepSocial\(state\.social,dt,\{people:state\.people,graph:state\.graph,view,vehicles,alarm:state\.hornAlarm/);
 assert.match(game,/state\.hornAlarm=\{x:p\.x,y:p\.y,t:state\.social\?\.clock\?\?0\}/,'the player horn');
 assert.match(game,/if\(honker\)\{\s*state\.hornAlarm=/,'NPC horns too (Q13: decided by the traffic step)');
 assert.match(game,/onRoad:\(x,y\)=>\{const r=nearest\(x,y,30,state\.roads,true\);return !!r&&r\.distance<visualRoadWidth\(r\.road\)\/2\+\.3;\}/,'no groups on a carriageway');
});
