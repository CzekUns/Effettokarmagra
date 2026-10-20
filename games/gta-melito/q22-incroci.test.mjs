import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {buildRoadGraph,createAgents,stepAgents,lanePosition,innerTurn} from './roads.mjs';
import {crosswalkYield,CROSSWALK_RULES} from './junctions.mjs';
import {commuteTurnSignal} from './npc-commute.mjs';
import {vehicleShape,vehiclesOverlap} from './traffic-collision.mjs';
import {createReactions,kerbWait} from './npc-reactions.mjs';

// Via Roma lungo x (residenziale, larga 8) e una traversa a x=300.
const graph=buildRoadGraph([
 {id:1,n:'Via Roma',t:'residential',w:8,p:[0,0,300,0,600,0]},
 {id:2,n:'Traversa',t:'residential',w:8,p:[300,-250,300,0,300,250]}
]);
const dt=.05,view=[-1000,-1000,1000,1000];
const at=(x,y)=>(i)=>graph.nodes[graph.edges[i].from].x===x&&graph.nodes[graph.edges[i].from].y===y;
const find=(name,x,y,angle)=>graph.edges.findIndex((e,i)=>e.name===name&&at(x,y)(i)&&Math.abs(Math.atan2(Math.sin(e.angle-angle),Math.cos(e.angle-angle)))<.01);
const east=find('Via Roma',0,0,0),east2=find('Via Roma',300,0,0),south=find('Traversa',300,0,Math.PI/2);
const pave=graph.edges[east].streetWidth/2+1.7,kerb=graph.edges[south].streetWidth/2;

test('Q22 the commuter scooter signals before its turns, like the cars (last 30 m and across the junction)',()=>{
 assert.ok(east>=0&&south>=0&&east2>=0,'test graph');
 const ride={path:[east,south],cursor:0,t:1-15/graph.edges[east].len,connector:null};
 assert.equal(commuteTurnSignal(graph,ride),'right','15 m before a right turn');
 assert.equal(commuteTurnSignal(graph,{...ride,t:.5}),null,'far from the junction: off');
 assert.equal(commuteTurnSignal(graph,{path:[east,south],cursor:1,t:.02,connector:{x:300,y:3}}),'right','still on while crossing');
 assert.equal(commuteTurnSignal(graph,{path:[east,east2],cursor:0,t:.97,connector:null}),null,'straight on: no arrow');
 const north=find('Traversa',300,0,-Math.PI/2);
 assert.equal(commuteTurnSignal(graph,{path:[east,north],cursor:0,t:.97,connector:null}),'left');
});

const car=(x,speed=8)=>{
 const c=createAgents(graph,1,91,'car',[])[0],t=x/graph.edges[east].len,p=lanePosition(graph,east,t,'car');
 return Object.assign(c,{edge:east,t,x:p.x,y:p.y,a:0,speed,v:speed,wait:0,braking:false,model:'panda-modern-white',vehicleType:'car'});
};
// Un pedone che aspetta di attraversare Via Roma a x=290 (richiesta come la registra kerbWait).
const request=()=>{const ped={x:290,y:-pave,body:'walk'};return [ped,new Map([[ped,{ped,from:{x:290,y:-pave},to:{x:290,y:pave}}]])];};

test('Q22 zebra without lights: a car that can stop comfortably gives way before the crossing; too close, it goes on',()=>{
 const [ped,req]=request(),a=car(250,8);
 const give=crosswalkYield(a,req,dt);
 assert.ok(give&&give.ped===ped,'gives way');
 const sh=vehicleShape(a);
 assert.ok(Math.abs(give.limit-(290-250-sh.halfLength-CROSSWALK_RULES.half-.8))<.05,'stops with its nose before the stripes');
 assert.equal(crosswalkYield(car(283,12),req,dt),null,'already too close at speed: it passes, the pedestrian keeps waiting for the gap');
 assert.equal(crosswalkYield(car(250,8),new Map([[ped,{ped,from:{x:150,y:-pave},to:{x:150,y:pave}}]]),dt),null,'a crossing behind it does not concern it');
});

test('Q22 the NPC car really stops before the stripes, waits, drives on once the pedestrian has gone; never an endless queue',()=>{
 const [ped,req]=request(),a=car(230,8),sh=vehicleShape(a);
 let maxNose=-Infinity;
 for(let i=0;i<120;i++){stepAgents(graph,[a],dt,null,{view,validRecovery:()=>true,crossings:req});maxNose=Math.max(maxNose,a.x+sh.halfLength);}
 assert.ok(maxNose<=290-CROSSWALK_RULES.half+.05,'nose never on the stripes: '+maxNose.toFixed(2));
 assert.ok(a.x>250,'it drove up to the crossing');assert.equal(a.giveWayTo,ped);
 req.clear();// il pedone è passato
 for(let i=0;i<80;i++)stepAgents(graph,[a],dt,null,{view,validRecovery:()=>true,crossings:req});
 assert.ok(a.x>300,'and then drives on: '+a.x.toFixed(1));
 // un pedone che resta lì senza decidersi non blocca l'auto per sempre
 const [p2,r2]=request(),b=car(230,8);
 for(let i=0;i<(CROSSWALK_RULES.giveUp+14)/dt;i++)stepAgents(graph,[b],dt,null,{view,validRecovery:()=>true,crossings:r2});
 assert.ok(b.x>300,'after '+CROSSWALK_RULES.giveUp+' s of waiting it goes: '+b.x.toFixed(1));
 assert.ok(b.gaveUpOn.has(p2));
});

test('Q22 a waiting pedestrian asks for right of way after 1 s; a car giving way no longer closes its gap',()=>{
 const r=createReactions(5);
 const walker=createAgents(graph,1,77,'walk',[])[0],t=1-(kerb+2.5)/graph.edges[east].len,p=lanePosition(graph,east,t,'walk',1);
 Object.assign(walker,{x:p.x,y:p.y,a:0,edge:east,t,side:1,wait:0,corner:null});
 // un'auto sulla traversa che arriva verso il passaggio
 const n=find('Traversa',300,-250,Math.PI/2),q=lanePosition(graph,n,(250-18)/250,'car');
 const v={x:q.x,y:q.y,a:Math.PI/2,speed:8,v:8,body:'car',edge:n,vehicleType:'car',model:'panda-modern-white'};
 let waited=0;
 for(let i=0;i<40;i++){if(kerbWait(r,walker,graph,{vehicles:[v],dt}))waited+=dt;}
 assert.ok(waited>=1,'waits at the kerb for the car');
 assert.ok(r.crossRequests.has(walker),'and asks for right of way');
 v.giveWayTo=walker;v.v=2;
 assert.equal(kerbWait(r,walker,graph,{vehicles:[v],dt}),false,'the car is stopping for it: it crosses');
 assert.equal(r.crossRequests.has(walker),false,'request withdrawn');
});

test('Q22 pedestrians turn on the inside of the corner at the block corner, without crossing the side street',()=>{
 const plan=innerTurn(graph,east,south,1,14);
 assert.ok(plan&&plan.inner,'right turn on the right pavement: inside corner');
 assert.ok(Math.hypot(plan.points[0].x-(300-pave),plan.points[0].y-pave)<.05,'the corner where the two pavements meet');
 assert.ok(plan.startT>0);
 assert.equal(innerTurn(graph,east,south,-1,14),null,'on the other pavement it is an outside turn');
 assert.equal(innerTurn(graph,east,east2,1,14),null,'straight on: not a turn');
 // dal vero: il pedone con il percorso Via Roma → traversa non entra mai nella carreggiata della traversa
 const w=createAgents(graph,1,77,'walk',[])[0],t0=1-30/graph.edges[east].len,p=lanePosition(graph,east,t0,'walk',1);
 Object.assign(w,{x:p.x,y:p.y,a:0,edge:east,t:t0,side:1,wait:0,corner:null,routine:'commuter',path:[east,south],speed:1.4});
 let maxX=-Infinity;
 for(let i=0;i<1500&&!(w.edge===south&&w.y>pave+8);i++){stepAgents(graph,[w],dt,null,{view,validRecovery:()=>true});maxX=Math.max(maxX,w.x);}
 assert.equal(w.edge,south,'turned into the side street');
 assert.ok(maxX<=300-kerb-.4,'never stepped onto the side street carriageway: max x '+maxX.toFixed(2)+' kerb at '+(300-kerb));
});

test('Q22 game wiring: crossings to the traffic, arrows on the commuter scooter',async()=>{
 const game=await readFile(new URL('./game.mjs',import.meta.url),'utf8');
 assert.match(game,/crossings:state\.reactions\?\.crossRequests/);
 assert.match(game,/if\(v\.turnSignal\)drawBlinker\(v\.x,v\.y,v\.a,v\)/);
 const html=await readFile(new URL('./index.html',import.meta.url),'utf8');
 assert.ok(Number((html.match(/game\.mjs\?v=(\d+)/)||[])[1])>=177);
});
