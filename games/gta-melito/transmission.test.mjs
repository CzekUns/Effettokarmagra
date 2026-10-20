import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {stepVehicle,handlingProfile,driveForce,gearAt,npcCruise,npcSpeedStep,APE_HANDLING,VAN_HANDLING,CAR_HANDLING,NPC_CRUISE_SHARE} from './vehicle-handling.mjs';
import {buildRoadGraph,stepAgents} from './roads.mjs';

const dt=1/60;
const MODELS={panda:{model:'panda-modern-white'},pandaFire:{model:'panda-fire-red'},punto:{model:'punto-188-red'},ypsilon:{model:'ypsilon-2003-blue'},
 uno:{model:'fiat-uno-1983-white'},smart:{model:'smart-fortwo-2007-red'},seicento:{model:'seicento-1998-blue'},cinquecento:{model:'fiat-500-2007-white'},
 ape:{model:'ape-car-azzurra'},furgone:{model:'furgone-fritti'},scooter:{vehicleType:'motorcycle',model:'moto-scooter-sh-red'},moto:{vehicleType:'motorcycle',model:'moto-moto-sport-blue'}};
const P=Object.fromEntries(Object.entries(MODELS).map(([k,v])=>[k,handlingProfile(v)]));
function run(p,seconds,{y=-1,wet=0,from=0}={}){
 let s=from,a=0;const trace=[s];
 for(let i=0;i<seconds/dt;i++){({speed:s,angle:a}=stepVehicle(s,a,{x:0,y},false,dt,false,p,wet));trace.push(s);}
 return trace;
}
const at=(trace,t)=>trace[Math.round(t/dt)];
const timeTo=(p,v)=>{const tr=run(p,20);const i=tr.findIndex(s=>s>=v);return i<0?Infinity:i*dt;};

test('BF05 soft start, smooth automatic progression and top speed respected for every model',()=>{
 for(const [name,p] of Object.entries(P)){
  const tr=run(p,15);
  assert.ok(at(tr,.25)<.08*p.top,name+': soft start, '+at(tr,.25).toFixed(2)+' after 0.25 s');
  for(let i=1;i<tr.length;i++){
   assert.ok(tr[i]>=tr[i-1]-1e-9,name+': speed never drops with the throttle held');
   assert.ok(tr[i]-tr[i-1]<=p.accel*dt+1e-9,name+': no jump between frames');
   assert.ok(tr[i]<=p.top+1e-9,name+': never above its top speed');
  }
  assert.ok(at(tr,15)>.92*p.top,name+': gets close to its top speed');
 }
});

test('BF05 models differ: pick-up order, Ape and vans clearly slower',()=>{
 const order=['moto','punto','ypsilon','panda','cinquecento','smart','seicento','pandaFire','uno'].map(k=>timeTo(P[k],20));
 for(let i=1;i<order.length;i++)assert.ok(order[i]>=order[i-1]-.02,'livelier models reach 20 first: '+order.map(t=>t.toFixed(2)).join(' '));
 assert.ok(timeTo(P.punto,20)<timeTo(P.uno,20)-.5,'a Punto is clearly livelier than an old Uno');
 for(const car of ['panda','pandaFire','uno','smart','seicento'])
  for(const slow of ['ape','furgone'])assert.ok(at(run(P[slow],5),5)<at(run(P[car],5),5)-5,slow+' slower than '+car+' after 5 s');
 assert.ok(P.ape.top<P.furgone.top&&P.furgone.top<P.scooter.top,'Ape < van < scooter at the top end');
 assert.equal(handlingProfile({model:'ape-verde-pesce'}),APE_HANDLING,'market Ape too');
 assert.equal(handlingProfile({model:'food-panini'}),VAN_HANDLING,'street-food van too');
});

test('BF05 implicit gears: shifts soften the push for a moment, never the speed',()=>{
 const p=P.panda;
 let last=gearAt(p,0).gear;
 for(let v=0;v<=p.top;v+=.25){const g=gearAt(p,v);assert.ok(g.gear>=last&&g.rpm>=0&&g.rpm<=1);last=g.gear;}
 assert.equal(gearAt(p,p.top).gear,(p.gears.length+1),'top gear at top speed');
 const shift=p.gears[1]*p.top;
 assert.ok(driveForce(p,shift+.05)<driveForce(p,shift-.05),'just after a shift the push dips (automatic gearbox feel)');
 assert.ok(driveForce(p,shift-.05)-driveForce(p,shift+.05)<.25*p.accel,'a gentle dip, not a stall');
 assert.equal(gearAt(P.scooter,10).gear,1,'scooters are twist-and-go (no steps)');
});

test('BF05 brakes per model, longer in the wet; reverse and RETRO stay predictable',()=>{
 const stop=(p,wet=0)=>{let s=20,d=0;for(let i=0;i<900&&s>0;i++){s=stepVehicle(s,0,{x:0,y:0},false,dt,true,p,wet).speed;d+=Math.max(0,s)*dt;}return d;};
 for(const [name,p] of Object.entries(P)){
  const dry=stop(p),wet=stop(p,1);
  assert.ok(dry>2&&dry<7,name+': braking distance from 20 '+dry.toFixed(1));
  assert.ok(wet>dry*1.1&&wet<dry*1.35,name+': a bit longer in the wet');
 }
 assert.ok(stop(P.moto)<stop(P.panda)&&stop(P.panda)<stop(P.furgone),'bike < car < van');
 // RETRO mentre si va avanti: prima frena, poi arretra senza saltare da avanti a indietro.
 const tr=run(P.panda,3,{y:1,from:8});
 for(let i=1;i<tr.length;i++)assert.ok(tr[i]<=tr[i-1]+1e-9&&tr[i-1]-tr[i]<=P.panda.brake*.5*dt+1e-6);
 assert.ok(tr.at(-1)<0&&tr.at(-1)>=-P.panda.reverse);
 // Gas mentre si arretra: si ferma e poi riparte in avanti.
 const back=run(P.panda,3,{from:-6});assert.ok(back[1]>back[0]&&back.at(-1)>0);
 // Bagnato: in partenza la trazione è un po' minore, poi uguale.
 assert.ok(at(run(P.panda,1,{wet:1}),.5)<at(run(P.panda,1),.5));
});

test('BF05 NPC cars follow their own model: cruise capped for slow vehicles, progressive restart after a stop',()=>{
 assert.equal(npcCruise(APE_HANDLING,12),APE_HANDLING.top*NPC_CRUISE_SHARE,'an Ape never cruises like a car');
 assert.equal(npcCruise(CAR_HANDLING,12),12,'ordinary cars keep their cruise');
 let v=0;const seen=[];for(let i=0;i<120;i++){v=npcSpeedStep(CAR_HANDLING,v,12,.05);seen.push(v);}
 assert.ok(seen[4]<2.5,'after a stop an NPC restarts slowly: '+seen[4].toFixed(2));
 assert.ok(seen.at(-1)>11.5,'and reaches its cruise');
 const graph=buildRoadGraph([{id:1,t:'primary',w:13,p:[0,0,600,0]}]);
 const e=graph.trafficStarts[0];
 const npc={edge:e,t:.1,x:60,y:3.5,a:0,speed:12,seed:5,side:1,wait:0,body:'car',model:'panda-modern-white'};
 const xs=[];for(let i=0;i<60;i++){stepAgents(graph,[npc],.05);xs.push(npc.x);}
 const step=xs.map((x,i)=>i?x-xs[i-1]:0);
 assert.ok(step[2]<.2,'first metres at walking pace');
 assert.ok(step.at(-1)>step[2]*2,'then it picks up speed');
 const ape={...npc,model:'ape-car-azzurra',x:60,t:.1,v:0};
 for(let i=0;i<400;i++)stepAgents(graph,[ape],.05);
 assert.ok(ape.v<=APE_HANDLING.top*NPC_CRUISE_SHARE+1e-9,'the traffic Ape stays slow');
});

test('BF05 wiring: roads.mjs uses the same profiles for NPCs; cache versions bumped',async()=>{
 const [roads,game,html]=await Promise.all(['roads.mjs','game.mjs','index.html'].map(f=>readFile(new URL('./'+f,import.meta.url),'utf8')));
 assert.match(roads,/import \{handlingProfile,npcCruise,npcSpeedStep\} from '\.\/vehicle-handling\.mjs\?v=\d+'/);
 assert.match(roads,/speed=npcSpeedStep\(profile,agent\.v,speed,elapsed\)/);
 assert.ok(Number((game.match(/vehicle-handling\.mjs\?v=(\d+)/)||[])[1])>=2);
 assert.ok(Number((html.match(/game\.mjs\?v=(\d+)/)||[])[1])>=155);
});
