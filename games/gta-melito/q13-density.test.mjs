import {test} from 'node:test';
import assert from 'node:assert/strict';
import {buildRoadGraph,createAgents,stepAgents,lanePosition} from './roads.mjs?v=161';
import {makeCollisionIndex} from './traffic-collision.mjs?v=131';
import {createDensity,stepDensity,prepareWalkWeights,zoneCapacity,timeOfDayFactor,DENSITY_RULES} from './npc-density.mjs?v=005';

// Rete di prova: un "centro" fitto (griglia 60 m) e una periferia rada (un'unica via lunga).
const roads=[];let id=1;
const line=(x0,y0,x1,y1,n)=>{const p=[];for(let k=0;k<=n;k++)p.push(x0+(x1-x0)*k/n,y0+(y1-y0)*k/n);return p;};
for(let i=0;i<=8;i++){roads.push({id:id++,n:i===4?'Via Roma':'Via '+i,t:'residential',w:6,p:line(0,i*60,480,i*60,8)});
 roads.push({id:id++,n:'Traversa '+i,t:'residential',w:6,p:line(i*60,0,i*60,480,8)});}
roads.push({id:id++,n:'Via Lontana',t:'residential',w:6,p:line(480,240,2600,240,12)});
const graph=buildRoadGraph(roads);
const shops=[{x:240,y:236,name:'Bar di prova'},{x:250,y:244,name:'Panificio di prova'},{x:200,y:236,name:'Edicola'}];
const weights=prepareWalkWeights(graph,{shops});
const canStand=()=>true,dt=.05;
const centre={x:240,y:240},viewAt=c=>[c.x-110,c.y-55,c.x+110,c.y+55];
const inView=(a,v)=>a.x>=v[0]&&a.x<=v[2]&&a.y>=v[1]&&a.y<=v[3];

test('Q13 hours: few people at night, many at lunch and in the evening, smooth from minute to minute',()=>{
 const at=h=>timeOfDayFactor(h*60);
 assert.ok(at(3)<.3&&at(12.5)>1&&at(19)>1,'night '+at(3).toFixed(2)+', lunch '+at(12.5).toFixed(2));
 assert.ok(at(15)<at(12.5)&&at(15)<at(19),'quieter early afternoon');
 for(let m=0;m<24*60;m+=10)assert.ok(Math.abs(timeOfDayFactor(m+10)-timeOfDayFactor(m))<.06,'no jump at '+m);
 assert.equal(timeOfDayFactor(25*60),timeOfDayFactor(60),'wraps around midnight');
});

test('Q13 zones: shops and the known central streets weigh more; the centre holds far more people than a lone street',()=>{
 const edgeOf=name=>graph.edges.findIndex(e=>e.name===name);
 assert.ok(weights[edgeOf('Via Roma')]>weights[edgeOf('Via 1')],'Via Roma, with shops, is livelier');
 const centreCap=zoneCapacity(graph,weights,240,240),farCap=zoneCapacity(graph,weights,2000,240);
 assert.ok(centreCap>farCap*4,'centre '+Math.round(centreCap)+' vs periphery '+Math.round(farCap));
 const day=Math.round(DENSITY_RULES.perMetre*centreCap*timeOfDayFactor(11*60)),night=Math.round(DENSITY_RULES.perMetre*centreCap*timeOfDayFactor(3*60));
 assert.ok(day>=3*night,'day '+day+' vs night '+night);
});

function city(){
 const people=createAgents(graph,70,310,'walk',[]);
 // altri tipi di NPC che la densità non deve mai spostare
 people[0].residentRoutine={phase:'AT_HOME'};people[1].stationary=true;people[1].profession='vigile';people[2].commuter=true;
 return people;
}
// scale .5: la griglia di prova è più fitta di Melito; i passanti disponibili restano ben più del bersaglio
function run(people,seconds,{camera=centre,minutes=11*60,onStep=()=>{},scale=.5}={}){
 const d=createDensity(5),view=viewAt(camera);let last=null;
 for(let i=0;i<seconds/dt;i++){
  const before=people.map(a=>({x:a.x,y:a.y}));
  const report=stepDensity(d,dt,{people,graph,weights,view,camera,minutes,canStand,scale,index:makeCollisionIndex(people)});
  if(report)last=report;
  people.forEach((a,k)=>onStep(a,before[k],view));
  stepAgents(graph,people.filter(a=>!a.frozen),dt,null,{view});
 }
 return {d,last};
}

test('Q13 density: people gather around the player only from outside the camera, gradually, then stay',()=>{
 const people=city();
 // tutti in periferia all'inizio: il centro è vuoto
 for(const a of people.slice(3)){a.x=1500+(a.seed%900);a.y=240+(a.side||1)*4.7;a.edge=graph.edges.findIndex(e=>e.name==='Via Lontana');a.t=.5;}
 const fixed=people.slice(0,3).map(a=>({x:a.x,y:a.y}));
 let popIn=0,jump=0,perSecond=0;
 const {d,last}=run(people,70,{onStep:(a,b,view)=>{
  const moved=Math.hypot(a.x-b.x,a.y-b.y)>15;
  if(moved){jump++;if(inView(a,view)||inView(b,view))popIn++;}
 }});
 assert.equal(popIn,0,'never appears or vanishes inside the camera');
 assert.ok(last.around>=last.target-2,'reached the target: '+last.around+' / '+last.target);
 assert.ok(last.target>=10,'a lively centre at 11:00: '+last.target);
 const ins=d.log.filter(e=>e.k==='in');
 for(let s=0;s<70;s++)perSecond=Math.max(perSecond,ins.filter(e=>Math.floor(e.t)===s).length);
 assert.ok(perSecond<=DENSITY_RULES.maxIn,'a few per second, not a crowd popping up at once');
 assert.deepEqual(people.slice(0,3).map(a=>({x:a.x,y:a.y})).map((p,i)=>Math.hypot(p.x-fixed[i].x,p.y-fixed[i].y)<20),[true,true,true],'resident, worker and rider are never relocated');
});

test('Q13 density: far passers-by are frozen (no cost) and thaw when the player comes near; night thins the crowd',()=>{
 const people=city();
 run(people,3);
 const far=people.filter(a=>Math.hypot(a.x-centre.x,a.y-centre.y)>DENSITY_RULES.farRadius);
 assert.ok(far.length&&far.every(a=>a.frozen||a.residentRoutine||a.stationary||a.commuter),'far away: simulated still');
 const before=far.map(a=>({x:a.x,y:a.y}));
 run(people,2);
 assert.ok(far.every((a,i)=>a.frozen?Math.hypot(a.x-before[i].x,a.y-before[i].y)<1e-9:true),'a frozen walker does not move');
 const day=run(city(),40,{minutes:11*60}).last,night=run(city(),40,{minutes:3*60}).last;
 assert.ok(night.target<day.target/2&&night.around<=day.around,'night '+night.around+'/'+night.target+' vs day '+day.around+'/'+day.target);
});

test('Q13 density: too many around (night falls) → some leave, always from outside the camera',()=>{
 const people=city();
 run(people,40,{minutes:12*60});
 let popOut=0;
 const {last,d}=run(people,60,{minutes:2*60,onStep:(a,b,view)=>{if(Math.hypot(a.x-b.x,a.y-b.y)>15&&(inView(a,view)||inView(b,view)))popOut++;}});
 assert.equal(popOut,0);
 assert.ok(d.log.some(e=>e.k==='out'),'some went away');
 // chi è in camera resta finché non esce camminando: il bersaglio vale per quelli fuori vista
 const shown=people.filter(a=>!a.indoors&&inView(a,viewAt(centre))).length;
 assert.ok(last.around-shown<=Math.ceil(last.target*DENSITY_RULES.overshoot)+2,'back near the night target: '+last.around+' around ('+shown+' in camera) / '+last.target);
});

test('Q13 density: inside the camera people only come out of a Q03 door (the door opens), never pop up on the pavement',()=>{
 const people=city(),roma=graph.edges.findIndex(e=>e.name==='Via Roma'&&graph.nodes[e.from].x===240);
 const doors=[0.3,0.6].map(t=>{const p=lanePosition(graph,roma,t,'walk',1),nx=-Math.sin(graph.edges[roma].angle),ny=Math.cos(graph.edges[roma].angle);
  return {x:p.x+nx*2.2,y:p.y+ny*2.2,edge:roma,t,side:1,open:0};});
 // nessuno vicino: tutti in periferia
 for(const a of people.slice(3)){a.x=1500+(a.seed%900);a.y=240;a.edge=graph.edges.findIndex(e=>e.name==='Via Lontana');a.t=.5;}
 const d=createDensity(9),view=viewAt(centre);let appeared=[];
 const seen=new Set(people.filter(a=>inView(a,view)));
 for(let i=0;i<20/dt;i++){
  stepDensity(d,dt,{people,graph,weights,view,camera:centre,minutes:11*60,canStand,scale:.5,index:makeCollisionIndex(people),doors});
  for(const a of people)if(inView(a,view)&&!seen.has(a)){seen.add(a);appeared.push({a,x:a.x,y:a.y,crossing:a.crossing});}
  stepAgents(graph,people.filter(a=>!a.frozen),dt,null,{view});
  for(const a of people)if(a.crossing){const c=a.crossing,dx=c.to.x-a.x,dy=c.to.y-a.y,dd=Math.hypot(dx,dy),st=Math.min(dd,1.35*dt);
   if(dd<.06){Object.assign(a,{x:c.to.x,y:c.to.y,crossing:null});}else{a.x+=dx/dd*st;a.y+=dy/dd*st;}}
 }
 const fromDoor=appeared.filter(e=>doors.some(q=>Math.hypot(q.x-e.x,q.y-e.y)<.01));
 assert.ok(fromDoor.length>=1,'someone came out of a door');
 for(const e of appeared)if(!fromDoor.includes(e))assert.ok(!inView({x:e.x,y:e.y},[view[0]+4,view[1]+4,view[2]-4,view[3]-4]),'anyone else walked in across the edge of the camera');
 assert.ok(fromDoor.every(e=>e.crossing?.door),'walking from the door to the pavement, not teleported onto it');
 assert.ok(d.log.filter(e=>e.k==='door').length<=2,'one door at a time, each door at most once every 25 s');
});
