/* GTA Melito — Q20: i giri di lavoro dei quattro veicoli di servizio Q18–Q19.
 * Tutto SIMULATO e dichiarato: nessun corriere, gestore dei rifiuti, soccorso stradale, linea o orario
 * reale di Melito.
 * - corriere: entra in uno stallo libero (BF02) vicino a un portone (Q03) o a un negozio, l'autista
 *   scende, consegna e torna, il furgone riparte;
 * - nettezza urbana: va piano; quando ha un bidone (Q07) accanto si ferma, l'operatore lo porta al
 *   cassone, lo svuota e lo rimette esattamente al suo posto;
 * - carro attrezzi: va a prendere un'auto in sosta «in panne» (quattro frecce, triangolo), la carica sul
 *   pianale e la porta via; più tardi l'auto ricompare in uno stallo libero, fuori dalla vista;
 * - autobus: gira sulle strade principali (Q19) e si ferma alle fermate simulate («FERMATA», nessun
 *   numero di linea): apre le porte, scendono e salgono passanti veri, senza doppioni e nella capienza.
 * Un mezzo al lavoro è fermo per roads.mjs (serviceHold) e si muove solo qui, sempre un poco alla volta.
 * Ogni fase ha un tempo massimo: se qualcosa va storto (urto, posto occupato, strada che non porta)
 * il lavoro si chiude, lo si scrive nel registro e il mezzo riprende il traffico. */
export const SERVICE_RULES=Object.freeze({
 courier:Object.freeze({firstDelay:[8,40],cooldown:[45,90],retry:12,doorRadius:30,bayRadius:24,ahead:[6,32],
  walkSpeed:1.5,deliver:[4,7],pullIn:2.6,pullOut:2.4,laneWait:25,maxJob:75}),
 refuse:Object.freeze({firstDelay:[6,30],cooldown:[22,45],retry:4,cruise:4.5,binReach:8,binRest:300,
  walkSpeed:1.3,tip:2.2,maxJob:45}),
 tow:Object.freeze({breakdownEvery:[70,130],firstBreakdown:[25,60],maxBroken:1,dispatchRadius:420,maxTrip:150,
  approach:14,hook:1.5,load:3,carryMin:25,giveUp:200}),
 bus:Object.freeze({stopSpacing:260,maxStops:14,junctionClear:25,approach:45,dwell:[6,10],maxDwell:16,doors:1,
  capacity:20,maxAlight:3,waitTarget:[1,3],recruitEvery:3,recruitRadius:28,waitPatience:150,walkSpeed:1.2,
  sameStopAgain:90,maxJob:40})
});
const TEST_SCALE=.08;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const smooth=k=>{const t=clamp(k,0,1);return t*t*(3-2*t);};
const hash=n=>{let x=(Number(n)||1)|0;x=Math.imul(x^x>>>16,2246822519);x=Math.imul(x^x>>>13,3266489917);return (x^x>>>16)>>>0;};
const rand=n=>hash(n)/4294967295;
const between=([a,b],seed)=>a+(b-a)*rand(seed);
const dist=(p,q)=>Math.hypot(p.x-q.x,p.y-q.y);
const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
const lerpAngle=(a,b,k)=>a+wrap(b-a)*k;
export const serviceKind=model=>/^corriere-/.test(model||'')?'courier':/^nettezza-/.test(model||'')?'refuse':
 /^attrezzi-/.test(model||'')?'tow':/^autobus-/.test(model||'')?'bus':null;
// Le strade su cui l'autobus ha le fermate (le stesse su cui circola, roads.mjs BUS_ROADS).
const STOP_ROADS=new Set(['primary','secondary','tertiary']);

/* Fermate simulate: lungo le strade principali, sul marciapiede a destra del senso di marcia, lontane
 * dagli incroci e almeno a stopSpacing m l'una dall'altra. Ordine deterministico. */
export function makeBusStops(graph,{canStand=()=>true,walkPosition,carPosition}={}){
 const R=SERVICE_RULES.bus,stops=[];
 if(!graph?.edges||!walkPosition||!carPosition)return stops;
 const ids=graph.edges.map((e,id)=>({e,id})).filter(({e})=>e.car&&e.walk&&STOP_ROADS.has(e.roadType)&&e.len>=2*R.junctionClear+12)
  .sort((p,q)=>q.e.len-p.e.len||p.id-q.id);
 for(const {e,id} of ids){
  if(stops.length>=R.maxStops)break;
  const t=.5,walk=walkPosition(id,t,1),lane=carPosition(id,t);
  if(!walk||!lane)continue;
  const nx=-Math.sin(e.angle),ny=Math.cos(e.angle),ux=Math.cos(e.angle),uy=Math.sin(e.angle);
  // pensilina 4 × 1,4 m appena oltre la linea dei pedoni
  const shelter={x:walk.x+nx*1.1,y:walk.y+ny*1.1,a:e.angle};
  const corners=[[-2,-.7],[2,-.7],[-2,.7],[2,.7]].map(([f,l])=>({x:shelter.x+ux*f+nx*l,y:shelter.y+uy*f+ny*l}));
  if(!canStand(walk.x,walk.y)||!corners.every(p=>canStand(p.x,p.y)))continue;
  if(stops.some(s=>dist(s.walk,walk)<R.stopSpacing))continue;
  const spots=[-1.1,0,1.1].map(f=>({x:walk.x+ux*f+nx*.45,y:walk.y+uy*f+ny*.45,a:e.angle-Math.PI/2}));
  stops.push({id:stops.length,edge:id,t,x:lane.x,y:lane.y,a:e.angle,walk:{x:walk.x,y:walk.y,edge:id,t,side:1},
   shelter,spots,waiting:[],nextRecruit:0,lastBus:-1e9,name:'FERMATA'});
 }
 return stops;
}

export function createServiceRoutines(graph,options={}){
 return {clock:0,test:!!options.test,stops:makeBusStops(graph,options),jobs:new Map(),figures:[],broken:[],
  nextBreakdown:null,log:[],stats:{courier:{done:0,failed:0},refuse:{done:0,bins:0,failed:0},
   tow:{breakdowns:0,towed:0,delivered:0,failed:0,repaired:0},bus:{stops:0,boarded:0,alighted:0,failed:0}}};
}
const scaled=(s,v)=>s.test?v*TEST_SCALE:v;
function note(s,kind,event,extra={}){s.log.push({t:+s.clock.toFixed(1),kind,event,...extra});if(s.log.length>200)s.log.shift();}
function say(ctx,agent,text){if(ctx.say&&agent)ctx.say(agent,text);}

// ——— mezzo fermo per lavoro: roads.mjs lo salta, qui lo si muove a passi piccoli ———
function hold(agent){agent.serviceHold=true;agent.braking=true;agent.turnSignal=null;}
function release(agent){
 delete agent.serviceHold;agent.hazard=false;agent.braking=false;agent.v=0;agent.stalled=0;
 restoreCruise(agent);
}
// la nettezza urbana resta sempre lenta; gli altri tornano alla loro velocità di crociera
function restoreCruise(agent){
 if(agent.serviceCruise===undefined||serviceKind(agent.model)==='refuse')return;
 agent.speed=agent.serviceCruise;delete agent.serviceCruise;
}
function slowTo(agent,cruise){if(agent.serviceCruise===undefined)agent.serviceCruise=agent.speed;agent.speed=Math.min(agent.serviceCruise,cruise);}
function finish(s,agent,job,ctx,outcome){
 if(agent.serviceHold)release(agent);else restoreCruise(agent);
 agent.hazard=false;
 for(const f of job.figures||[])removeFigure(s,f);
 s.jobs.delete(agent);
 const R=SERVICE_RULES[job.kind],ok=outcome==='fatto';
 agent.serviceNext=s.clock+scaled(s,ok?between(R.cooldown||[8,8],agent.seed+s.clock*7):R.retry||8);
 note(s,job.kind,outcome,{model:agent.model});
}
function fail(s,agent,kind,why,ctx){
 const R=SERVICE_RULES[kind];agent.serviceNext=s.clock+scaled(s,R.retry||8);
 s.stats[kind].failed++;note(s,kind,'non riuscito: '+why,{model:agent.model});
}
// direzione di marcia, normale verso destra (y verso il basso: è il lato della corsia e del marciapiede)
function frame(a){return {ux:Math.cos(a),uy:Math.sin(a),nx:-Math.sin(a),ny:Math.cos(a)};}
function rel(p,o,f){const dx=p.x-o.x,dy=p.y-o.y;return {along:dx*f.ux+dy*f.uy,across:dx*f.nx+dy*f.ny};}
function walkClear(a,b,ctx){
 const n=Math.max(1,Math.ceil(dist(a,b)/.8));
 for(let i=0;i<=n;i++){const x=a.x+(b.x-a.x)*i/n,y=a.y+(b.y-a.y)*i/n;if(ctx.canStand&&!ctx.canStand(x,y))return false;}
 return true;
}
// ——— persone di servizio (autista, operatore): figure disegnate come i pedoni, non NPC della città ———
function addFigure(s,at,kind,seed){
 const f={x:at.x,y:at.y,a:at.a||0,prevX:at.x,prevY:at.y,prevA:at.a||0,kind,seed,speed:1.4,braking:true,body:'walk',service:true};
 s.figures.push(f);return f;
}
function removeFigure(s,f){const i=s.figures.indexOf(f);if(i>=0)s.figures.splice(i,1);}
function walkTo(f,goal,speed,dt){
 f.prevX=f.x;f.prevY=f.y;f.prevA=f.a;
 const d=dist(f,goal);
 if(d<=speed*dt){f.x=goal.x;f.y=goal.y;f.braking=true;return true;}
 f.a=Math.atan2(goal.y-f.y,goal.x-f.x);f.x+=Math.cos(f.a)*speed*dt;f.y+=Math.sin(f.a)*speed*dt;f.speed=speed;f.braking=false;
 return false;
}
function quiet(f){f.prevX=f.x;f.prevY=f.y;f.prevA=f.a;f.braking=true;}

// ——— corriere ———
function startCourier(s,agent,ctx){
 const R=SERVICE_RULES.courier,e=ctx.graph.edges[agent.edge];
 if(!e||!(agent.t>.05&&agent.t<.9)||!ctx.freeStalls){agent.serviceNext=s.clock+scaled(s,4);return;}
 const f=frame(e.angle),mid=(R.ahead[0]+R.ahead[1])/2;
 const shape=ctx.shape?ctx.shape(agent):{halfLength:3.6,halfWidth:1.85};
 for(const stall of ctx.freeStalls(agent.x+f.ux*mid,agent.y+f.uy*mid,(R.ahead[1]-R.ahead[0])/2+4)){
  const r=rel(stall,agent,f);
  if(r.along<R.ahead[0]||r.along>R.ahead[1]||r.across<1||r.across>9)continue;
  const pose={x:stall.x,y:stall.y,a:e.angle};
  if(ctx.fits&&!ctx.fits(pose,agent))continue;
  // l'autista scende dal portellone laterale, verso il marciapiede
  const door={x:pose.x+f.nx*(shape.halfWidth+.55)-f.ux*shape.halfLength*.55,y:pose.y+f.ny*(shape.halfWidth+.55)-f.uy*shape.halfLength*.55};
  // un portone noto (Q03) o un negozio vicino; altrimenti l'ingresso del palazzo accanto (inventato, come i portoni Q03)
  let target=null;
  for(const d of [...(ctx.doors||[]),...(ctx.shops||[])]){
   if(!Number.isFinite(d.x)||dist(d,door)>R.doorRadius||rel(d,pose,f).across<0)continue;
   if(walkClear(door,d,ctx)&&(!target||dist(d,door)<dist(target,door)))target=d;
  }
  if(!target&&ctx.findEntrance){const t=ctx.findEntrance(door.x+f.nx*1.2,door.y+f.ny*1.2,f.nx,f.ny);if(t&&walkClear(door,t,ctx))target=t;}
  if(!target)continue;
  s.jobs.set(agent,{kind:'courier',phase:'approach',stall,pose,target,door,edge:agent.edge,t0:s.clock,phaseT:0,figures:[]});
  note(s,'courier','va a consegnare',{target:target.label||target.name||'portone'});
  return;
 }
 fail(s,agent,'courier','nessuno stallo libero accanto a un ingresso',ctx);
}
function stepCourier(s,agent,job,dt,ctx){
 const R=SERVICE_RULES.courier;job.phaseT+=dt;
 if(job.phase==='approach'&&s.clock-job.t0>R.maxJob){s.stats.courier.failed++;return finish(s,agent,job,ctx,'interrotto: troppo tempo');}
 if(job.phase==='approach'){
  if(agent.edge!==job.edge){s.stats.courier.failed++;return finish(s,agent,job,ctx,'interrotto: passato oltre');}
  const f=frame(ctx.graph.edges[job.edge].angle),r=rel(job.pose,agent,f);
  slowTo(agent,clamp(r.along*.45,2,9));
  if(ctx.stallTaken&&ctx.stallTaken(job.stall,agent)){s.stats.courier.failed++;return finish(s,agent,job,ctx,'interrotto: stallo occupato');}
  if(r.along<=7){hold(agent);agent.hazard=true;job.from={x:agent.x,y:agent.y,a:agent.a};
   job.ctrl={x:agent.x+f.ux*Math.max(1,r.along-1.5),y:agent.y+f.uy*Math.max(1,r.along-1.5)};
   job.lane={edge:agent.edge,t:agent.t};job.phase='pullIn';job.phaseT=0;}
  return;
 }
 if(job.phase==='pullIn'||job.phase==='pullOut'){
  const T=job.phase==='pullIn'?R.pullIn:R.pullOut,k=smooth(job.phaseT/T),a=job.from,b=job.phase==='pullIn'?job.pose:job.out,c=job.ctrl;
  const x=(1-k)*(1-k)*a.x+2*(1-k)*k*c.x+k*k*b.x,y=(1-k)*(1-k)*a.y+2*(1-k)*k*c.y+k*k*b.y;
  const dx=2*(1-k)*(c.x-a.x)+2*k*(b.x-c.x),dy=2*(1-k)*(c.y-a.y)+2*k*(b.y-c.y);
  const heading=Math.hypot(dx,dy)>1e-6?Math.atan2(dy,dx):b.a;
  agent.x=x;agent.y=y;agent.a=k>.85?lerpAngle(heading,b.a,(k-.85)/.15):heading;
  if(job.phaseT<T)return;
  agent.x=b.x;agent.y=b.y;agent.a=b.a;
  if(job.phase==='pullIn'){
   job.driver=addFigure(s,{...job.door,a:Math.atan2(job.target.y-job.door.y,job.target.x-job.door.x)},3,agent.seed+31);
   job.figures.push(job.driver);job.phase='walkOut';job.phaseT=0;return;
  }
  agent.edge=job.lane.edge;agent.t=job.out.t;
  s.stats.courier.done++;return finish(s,agent,job,ctx,'fatto');
 }
 if(job.phase==='walkOut'){
  if(walkTo(job.driver,job.target,R.walkSpeed,dt)){
   job.phase='deliver';job.phaseT=0;job.deliverFor=between(R.deliver,agent.seed+s.clock);
   if('open' in job.target||job.target.wallX!==undefined)job.target.open=Math.max(job.target.open||0,1.4);
   say(ctx,job.driver,'Pacco per lei!');
  }
  return;
 }
 if(job.phase==='deliver'){quiet(job.driver);if(job.phaseT>=job.deliverFor){job.phase='back';job.phaseT=0;}return;}
 if(job.phase==='back'){
  if(walkTo(job.driver,job.door,R.walkSpeed,dt)){
   removeFigure(s,job.driver);job.figures=[];
   // la corsia accanto allo stallo deve essere libera prima di uscire (aspetta, non si infila)
   const e=ctx.graph.edges[job.lane.edge],ahead=Math.min(.96,job.lane.t+Math.max(9,dist(job.from,job.pose))/e.len);
   const out=ctx.carPosition(job.lane.edge,ahead);
   job.out={x:out.x,y:out.y,a:e.angle,t:ahead};job.phase='laneWait';job.phaseT=0;
  }
  return;
 }
 if(job.phase==='laneWait'){
  // aspetta che la corsia sia libera; dopo laneWait s esce solo se nessuno lo vede (mai un'auto addosso in vista)
  if(ctx.blocked&&ctx.blocked(agent,job.out)&&(job.phaseT<R.laneWait||!outsideView(agent,ctx.view,20)))return;
  job.from={x:agent.x,y:agent.y,a:agent.a};
  const f=frame(job.out.a);job.ctrl={x:job.out.x-f.ux*4,y:job.out.y-f.uy*4};
  job.phase='pullOut';job.phaseT=0;
 }
}

// ——— nettezza urbana ———
function keepSlow(agent){if(agent.serviceCruise===undefined&&agent.speed>SERVICE_RULES.refuse.cruise)slowTo(agent,SERVICE_RULES.refuse.cruise);}
function startRefuse(s,agent,ctx){
 const R=SERVICE_RULES.refuse,e=ctx.graph.edges[agent.edge],bins=ctx.objects?.bins;
 if(!e||!bins?.length||!(agent.t>.03&&agent.t<.97)){agent.serviceNext=s.clock+scaled(s,R.retry);return;}
 const f=frame(agent.a),shape=ctx.shape?ctx.shape(agent):{halfLength:4.8,halfWidth:1.9};
 const rear={x:agent.x-f.ux*shape.halfLength*.75+f.nx*(shape.halfWidth+.45),y:agent.y-f.uy*shape.halfLength*.75+f.ny*(shape.halfWidth+.45)};
 let best=null;
 for(const bin of bins){
  if(bin.tipped||!bin.home||dist(bin,bin.home)>.3||s.clock-(bin.emptiedAt??-1e9)<scaled(s,R.binRest))continue;
  if(Math.abs(bin.x-rear.x)>14||Math.abs(bin.y-rear.y)>14)continue;
  const r=rel(bin,rear,f);if(r.along<-3||r.along>4||r.across<.3||r.across>R.binReach)continue;
  if(!walkClear(rear,bin,ctx))continue;
  if((ctx.parked||[]).some(v=>v!==agent&&Math.abs(v.x)<1e5&&segmentNearVehicle(rear,bin,v,ctx)))continue;
  if(!best||Math.hypot(r.along,r.across)<best.d)best={bin,d:Math.hypot(r.along,r.across)};
 }
 if(!best)return;// nessun bidone accanto: si riprova al passo successivo (va piano)
 const group=bins.filter(b=>b!==best.bin&&!b.tipped&&b.home&&dist(b,b.home)<.3&&dist(b,best.bin)<3.2&&
  s.clock-(b.emptiedAt??-1e9)>=scaled(s,R.binRest)&&walkClear(rear,b,ctx)).slice(0,1);
 hold(agent);agent.hazard=true;
 const op=addFigure(s,{...rear,a:Math.atan2(best.bin.y-rear.y,best.bin.x-rear.x)},0,agent.seed+53);
 s.jobs.set(agent,{kind:'refuse',phase:'toBin',bins:[best.bin,...group],i:0,rear,op,t0:s.clock,phaseT:0,figures:[op]});
 note(s,'refuse','raccolta',{bins:1+group.length});
 say(ctx,agent,'Raccolta rifiuti');
}
function segmentNearVehicle(a,b,v,ctx){
 if(!ctx.shape)return false;
 const sh=ctx.shape(v),f=frame(v.a||0);
 for(let i=1;i<10;i++){const p={x:a.x+(b.x-a.x)*i/10,y:a.y+(b.y-a.y)*i/10},r=rel(p,v,f);
  if(Math.abs(r.along)<sh.halfLength+.2&&Math.abs(r.across)<sh.halfWidth+.2)return true;}
 return false;
}
function stepRefuse(s,agent,job,dt,ctx){
 const R=SERVICE_RULES.refuse;job.phaseT+=dt;
 const bin=job.bins[job.i],op=job.op;
 // fallimento visibile e recupero: troppo tempo (bidone bloccato, operatore fermo) → il bidone torna a posto
 if(s.clock-job.t0>R.maxJob){for(const b of job.bins)if(b.home){moveBin(ctx,b,b.home.x,b.home.y);b.a=b.home.a;}
  s.stats.refuse.failed++;return finish(s,agent,job,ctx,'interrotto: troppo tempo');}
 // urto mentre l'operatore è fuori: il camion si riprende (roads.mjs) e poi torna fermo ad aspettarlo
 if(!(agent.impactTime>0||agent.needsRoutineRecovery))hold(agent);
 if(job.phase==='toBin'){
  if(!job.goal){const d=Math.max(.01,dist(bin,op));job.goal={x:bin.x-(bin.x-op.x)/d*.85,y:bin.y-(bin.y-op.y)/d*.85};}
  if(walkTo(op,job.goal,R.walkSpeed,dt)){job.goal=null;job.phase='carry';job.phaseT=0;job.off={x:bin.x-op.x,y:bin.y-op.y};}
  return;
 }
 if(job.phase==='carry'||job.phase==='return'){
  const goal=job.phase==='carry'?job.rear:{x:bin.home.x-job.off.x,y:bin.home.y-job.off.y};
  const arrived=walkTo(op,goal,R.walkSpeed*.8,dt);
  const k=job.phase==='carry'?.6:1;
  moveBin(ctx,bin,op.x+job.off.x*k,op.y+job.off.y*k);
  if(!arrived)return;
  if(job.phase==='carry'){job.phase='tip';job.phaseT=0;say(ctx,op,'Svuotato!');return;}
  moveBin(ctx,bin,bin.home.x,bin.home.y);bin.a=bin.home.a;bin.emptiedAt=s.clock;bin.vx=0;bin.vy=0;bin.tipped=false;
  s.stats.refuse.bins++;
  if(job.i+1<job.bins.length){job.i++;job.phase='toBin';job.phaseT=0;return;}
  job.phase='back';job.phaseT=0;return;
 }
 if(job.phase==='tip'){
  quiet(op);bin.a=(bin.home?.a||0)+Math.sin(job.phaseT*9)*.35*(1-job.phaseT/R.tip);
  if(job.phaseT>=R.tip){bin.a=bin.home?.a||0;job.phase='return';job.phaseT=0;}
  return;
 }
 if(job.phase==='back'){
  const f=frame(agent.a),sh=ctx.shape?ctx.shape(agent):{halfLength:4.8,halfWidth:1.9};
  const rear={x:agent.x-f.ux*sh.halfLength*.75+f.nx*(sh.halfWidth+.45),y:agent.y-f.uy*sh.halfLength*.75+f.ny*(sh.halfWidth+.45)};
  if(walkTo(op,rear,R.walkSpeed,dt)){s.stats.refuse.done++;finish(s,agent,job,ctx,'fatto');}
 }
}
function moveBin(ctx,bin,x,y){if(ctx.moveObject)ctx.moveObject(bin,x,y);else{bin.x=x;bin.y=y;}}

// ——— carro attrezzi ———
/* Un'auto in sosta va in panne: quattro frecce e triangolo; il carro attrezzi libero più vicino la va a
 * prendere. Aggancio per la Q23 (danni): reportBreakdown(s, auto) mette in coda un'auto rotta. */
export function reportBreakdown(s,car,{reason='guasto'}={}){
 if(!car||car.broken||car.towedBy)return false;
 car.broken={reason,since:s.clock};car.hazard=true;s.broken.push(car);s.stats.tow.breakdowns++;
 note(s,'tow','auto in panne',{model:car.model,reason});return true;
}
function eligibleBroken(v,ctx){
 return v&&v!==ctx.playerVehicle&&v.parkingBay&&v.vehicleType!=='motorcycle'&&
  !v.commuterBike&&!v.vendorStand&&!v.market&&!v.broken&&!v.towedBy&&!serviceKind(v.model)&&Math.abs(v.x)<1e5;
}
function stepBreakdowns(s,dt,ctx){
 const R=SERVICE_RULES.tow;
 if(s.nextBreakdown===null)s.nextBreakdown=s.clock+scaled(s,between(R.firstBreakdown,77));
 // il giocatore ha preso l'auto rotta, o un'auto rotta non è più in sosta: non c'è più da soccorrerla
 for(const car of [...s.broken]){
  if(car===ctx.playerVehicle||!(ctx.parked||[]).includes(car)){car.broken=null;car.hazard=false;s.broken.splice(s.broken.indexOf(car),1);continue;}
  if(!car.towTruck&&s.clock-car.broken.since>R.giveUp&&outsideView(car,ctx.view,30)){
   car.broken=null;car.hazard=false;s.broken.splice(s.broken.indexOf(car),1);s.stats.tow.repaired++;note(s,'tow','riparata sul posto');
  }
 }
 if(s.clock>=s.nextBreakdown&&s.broken.length<R.maxBroken){
  s.nextBreakdown=s.clock+scaled(s,between(R.breakdownEvery,s.clock*13));
  const trucks=(ctx.traffic||[]).filter(t=>serviceKind(t.model)==='tow'&&!s.jobs.has(t)&&!t.gateMode&&!t.towed);
  const cands=[];
  for(const v of ctx.parked||[]){
   if(!eligibleBroken(v,ctx))continue;
   const d=Math.min(...trucks.map(t=>dist(t,v)));
   if(d<R.dispatchRadius)cands.push({v,d});
  }
  cands.sort((p,q)=>p.d-q.d);
  for(const {v} of cands.slice(0,3)){
   const goal=edgeBeside(ctx.graph,v,ctx),truck=trucks.slice().sort((p,q)=>dist(p,v)-dist(q,v))[0];
   if(goal&&truck&&truck.edge!=null&&(!ctx.planRoute||ctx.planRoute(truck.edge,goal.edge))){reportBreakdown(s,v);break;}
  }
 }
}
function outsideView(p,view,margin=0){return !view||p.x<view[0]-margin||p.x>view[2]+margin||p.y<view[1]-margin||p.y>view[3]+margin;}
// L'arco di corsia accanto all'auto in sosta: la sosta è sul lato destro del senso di marcia.
export function edgeBeside(graph,car,{carPosition}={}){
 let best=null;
 graph.edges.forEach((e,id)=>{
  if(!e.car)return;
  const a=graph.nodes[e.from],b=graph.nodes[e.to];
  if(Math.min(a.x,b.x)>car.x+30||Math.max(a.x,b.x)<car.x-30||Math.min(a.y,b.y)>car.y+30||Math.max(a.y,b.y)<car.y-30)return;
  const dx=b.x-a.x,dy=b.y-a.y,l2=dx*dx+dy*dy||1;
  const t=((car.x-a.x)*dx+(car.y-a.y)*dy)/l2;if(t<.04||t>.96)return;
  const px=a.x+dx*t,py=a.y+dy*t,f=frame(e.angle),across=(car.x-px)*f.nx+(car.y-py)*f.ny;
  if(across<.5||across>(e.streetWidth||8)/2+5)return;
  const d=Math.hypot(car.x-px,car.y-py);if(!best||d<best.d)best={edge:id,t,d};
 });
 return best;
}
function dispatchTow(s,ctx){
 // un percorso si cerca al massimo ogni 2 s (Dijkstra sulla rete intera: non a ogni passo)
 if(!s.broken.some(c=>!c.towTruck)||s.clock<(s.nextDispatch??0))return;
 s.nextDispatch=s.clock+2;
 for(const car of s.broken){
  if(car.towTruck)continue;
  const trucks=(ctx.traffic||[]).filter(t=>serviceKind(t.model)==='tow'&&!s.jobs.has(t)&&!t.gateMode&&!t.towed&&
   !(t.impactTime>0)&&!t.needsRoutineRecovery&&t.edge!=null&&s.clock>=(t.serviceNext??0));
  trucks.sort((p,q)=>dist(p,car)-dist(q,car));
  const goal=edgeBeside(ctx.graph,car,ctx);if(!goal)continue;
  for(const truck of trucks.slice(0,2)){
   const path=ctx.planRoute?ctx.planRoute(truck.edge,goal.edge):null;
   if(!path){continue;}
   truck.path=path;car.towTruck=truck;
   s.jobs.set(truck,{kind:'tow',phase:'drive',car,goal,path,t0:s.clock,phaseT:0,figures:[],replans:0});
   note(s,'tow','soccorso in arrivo',{route:path.length});
   return;
  }
 }
}
function bedPose(truck,ctx){
 const sh=ctx.shape?ctx.shape(truck):{halfLength:4.8},f=frame(truck.a);
 return {x:truck.x-f.ux*sh.halfLength*.3,y:truck.y-f.uy*sh.halfLength*.3,a:truck.a};
}
function stepTow(s,agent,job,dt,ctx){
 const R=SERVICE_RULES.tow;job.phaseT+=dt;
 const car=job.car;
 if(job.phase==='drive'){
  if(!s.broken.includes(car)){agent.path=null;return finish(s,agent,job,ctx,'annullato: auto non più in panne');}
  if(s.clock-job.t0>R.maxTrip){agent.path=null;car.towTruck=null;s.stats.tow.failed++;return finish(s,agent,job,ctx,'interrotto: non arriva');}
  if(agent.edge!==job.goal.edge){
   if(agent.edge!=null&&!job.path.includes(agent.edge)){
    const p=ctx.planRoute?ctx.planRoute(agent.edge,job.goal.edge):null;
    if(!p||++job.replans>4){agent.path=null;car.towTruck=null;s.stats.tow.failed++;return finish(s,agent,job,ctx,'interrotto: strada persa');}
    job.path=p;agent.path=p;
   }
   return;
  }
  const e=ctx.graph.edges[job.goal.edge],along=(job.goal.t-agent.t)*e.len;
  if(along<-6){job.path=[agent.edge];agent.path=null;
   const p=ctx.planRoute?ctx.planRoute(agent.edge,job.goal.edge):null;// giro dell'isolato
   if(p&&p.length>1&&++job.replans<=4){job.path=p;agent.path=p;return;}
   car.towTruck=null;s.stats.tow.failed++;return finish(s,agent,job,ctx,'interrotto: passato oltre');}
  slowTo(agent,clamp(along*.4,1.5,9));
  if(along<=1.2){hold(agent);agent.hazard=true;agent.path=null;job.phase='hook';job.phaseT=0;say(ctx,agent,'Soccorso stradale');}
  return;
 }
 if(job.phase==='hook'){if(job.phaseT>=R.hook){job.phase='load';job.phaseT=0;job.from={x:car.x,y:car.y,a:car.a};}return;}
 if(job.phase==='load'){
  const k=smooth(job.phaseT/R.load),bed=bedPose(agent,ctx);
  car.x=job.from.x+(bed.x-job.from.x)*k;car.y=job.from.y+(bed.y-job.from.y)*k;car.a=lerpAngle(job.from.a,bed.a,k);
  if(job.phaseT<R.load)return;
  // sul pianale: l'auto lascia la sosta (fuori mappa per collisioni e salite), il carro la disegna
  agent.towed=car;car.towedBy=agent;car.hazard=false;car.parkingBay=null;car.x=-1e6;car.y=-1e6;
  s.broken.splice(s.broken.indexOf(car),1);car.broken=null;s.stats.tow.towed++;note(s,'tow','auto caricata');
  release(agent);job.phase='carry';job.phaseT=0;job.loadedAt=s.clock;say(ctx,agent,'Auto caricata');
  return;
 }
 if(job.phase==='carry'){
  if(s.clock-job.loadedAt>=scaled(s,R.carryMin)&&(outsideView(agent,ctx.view,40)||agent.gateMode)){
   const stall=ctx.freeStallOutOfView?ctx.freeStallOutOfView(car):null;
   if(!stall)return;
   if(ctx.parkInStall)ctx.parkInStall(car,stall);else Object.assign(car,{x:stall.x,y:stall.y,a:stall.a});
   car.towedBy=null;car.towTruck=null;agent.towed=null;s.stats.tow.delivered++;
   note(s,'tow','auto riconsegnata');s.stats.tow.done=(s.stats.tow.done||0)+1;finish(s,agent,job,ctx,'fatto');
  }
 }
}

// ——— autobus ———
const plainWalker=a=>a&&a.body==='walk'&&!a.indoors&&!a.serviceHold&&!a.residentRoutine&&!a.commuter&&!a.profession&&
 !a.washer&&!a.market&&!a.stationary&&!a.scripted&&!a.social?.hold&&!a.crossing&&!(a.dodge>0)&&!(a.impactTime>0)&&
 !a.needsRoutineRecovery&&a.edge!=null&&!a.passengerOf&&!a.busRider;
function claim(p){p.serviceHold=true;p.serviceWasStationary=!!p.stationary;p.stationary=true;p.braking=true;}
function unclaim(p,at,ctx){
 Object.assign(p,{x:at.x,y:at.y,prevX:at.x,prevY:at.y,edge:at.edge,t:at.t,side:at.side,corner:null,wait:0,stalled:0,braking:false,indoors:false});
 delete p.serviceHold;p.stationary=!!p.serviceWasStationary;delete p.serviceWasStationary;delete p.busStop;delete p.busRider;
}
function stepStops(s,dt,ctx){
 const R=SERVICE_RULES.bus,hour=((ctx.clockMinutes??600)/60)%24,night=hour<6||hour>=22;
 for(const stop of s.stops){
  // chi aspetta da troppo se ne va (torna camminando sul marciapiede)
  for(const w of [...stop.waiting]){
   const st=w.busStop;if(!st)continue;
   if(st.phase==='go'){if(walkTo(w,st.spot,w.speed>0?Math.min(1.4,w.speed):R.walkSpeed,dt)){st.phase='wait';w.a=st.spot.a;}continue;}
   if(st.phase==='wait'){quiet(w);w.a=st.spot.a;if(s.clock-st.since>scaled(s,R.waitPatience)&&!st.boarding){st.phase='leave';}continue;}
   if(st.phase==='leave'){if(walkTo(w,stop.walk,R.walkSpeed,dt)){stop.waiting.splice(stop.waiting.indexOf(w),1);unclaim(w,stop.walk,ctx);}}
  }
  if(s.clock<stop.nextRecruit)continue;
  stop.nextRecruit=s.clock+scaled(s,R.recruitEvery);
  const target=night?(hash(stop.id+Math.floor(hour))%2):R.waitTarget[0]+hash(stop.id*7+Math.floor(hour))%(R.waitTarget[1]-R.waitTarget[0]+1);
  const active=stop.waiting.filter(w=>w.busStop?.phase!=='leave');
  if(active.length>=target||active.length>=stop.spots.length)continue;
  const free=stop.spots.find(sp=>!stop.waiting.some(w=>w.busStop?.spot===sp));if(!free)continue;
  let best=null;
  for(const p of ctx.people||[]){
   if(!plainWalker(p))continue;
   const d=dist(p,stop.walk);if(d>R.recruitRadius||(best&&d>=best.d))continue;
   if(!walkClear(p,free,ctx)||(ctx.onRoad&&crossesRoad(p,free,ctx)))continue;
   best={p,d};
  }
  if(!best)continue;
  claim(best.p);best.p.busStop={stop,spot:free,phase:'go',since:s.clock};stop.waiting.push(best.p);
 }
}
function crossesRoad(a,b,ctx){
 const n=Math.max(2,Math.ceil(dist(a,b)/1));
 for(let i=1;i<n;i++){const x=a.x+(b.x-a.x)*i/n,y=a.y+(b.y-a.y)*i/n;if(ctx.onRoad(x,y))return true;}
 return false;
}
function busDoors(agent,ctx){
 const sh=ctx.shape?ctx.shape(agent):{halfLength:6.3,halfWidth:1.9},f=frame(agent.a);
 return [.42,-.38].map(k=>({x:agent.x+f.ux*sh.halfLength*k+f.nx*(sh.halfWidth+.35),y:agent.y+f.uy*sh.halfLength*k+f.ny*(sh.halfWidth+.35)}));
}
function startBus(s,agent,ctx){
 const R=SERVICE_RULES.bus,e=ctx.graph.edges[agent.edge];
 if(!e){agent.serviceNext=s.clock+scaled(s,2);return;}
 for(const stop of s.stops){
  if(stop.edge!==agent.edge)continue;
  const along=(stop.t-agent.t)*e.len;
  if(along<2||along>R.approach)continue;
  if(agent.lastStop===stop.id&&s.clock-(agent.lastStopAt??-1e9)<scaled(s,R.sameStopAgain))continue;
  s.jobs.set(agent,{kind:'bus',phase:'approach',stop,t0:s.clock,phaseT:0,figures:[],moving:[]});
  return;
 }
 agent.serviceNext=s.clock+scaled(s,1);
}
function stepBus(s,agent,job,dt,ctx){
 const R=SERVICE_RULES.bus,stop=job.stop;job.phaseT+=dt;
 agent.busRiders=agent.busRiders||[];
 if(job.phase==='approach'){
  if(agent.edge!==stop.edge||job.phaseT>R.maxJob){s.stats.bus.failed++;agent.lastStop=stop.id;agent.lastStopAt=s.clock;return finish(s,agent,job,ctx,'interrotto: fermata saltata');}
  const along=(stop.t-agent.t)*ctx.graph.edges[stop.edge].len;
  slowTo(agent,clamp(along*.35,1.2,10));
  if(along<=.8){hold(agent);job.phase='doors';job.phaseT=0;s.stats.bus.stops++;stop.lastBus=s.clock;note(s,'bus','alla fermata',{stop:stop.id});}
  return;
 }
 if(job.phase==='doors'||job.phase==='close'){
  agent.busDoors=job.phase==='doors'?clamp(job.phaseT/R.doors,0,1):clamp(1-job.phaseT/R.doors,0,1);
  if(job.phaseT<R.doors)return;
  if(job.phase==='close'){agent.busDoors=0;agent.lastStop=stop.id;agent.lastStopAt=s.clock;return finish(s,agent,job,ctx,'fatto');}
  // chi scende: ognuno fa 1 o 2 fermate (scelta fissa per persona), al massimo maxAlight per fermata;
  // poi salgono quelli che aspettano
  for(const p of agent.busRiders)if(p.busRider&&p.busRider.from!==stop.id)p.busRider.stops++;
  const off=agent.busRiders.filter(p=>p.busRider&&p.busRider.stops>=p.busRider.ride).slice(0,R.maxAlight);
  job.alight=off;job.phase='exchange';job.phaseT=0;job.dwell=between(R.dwell,agent.seed+s.clock);
  job.next=0;
  return;
 }
 if(job.phase==='exchange'){
  const doors=busDoors(agent,ctx);
  // a uno a uno, ogni 0,7 s: prima chi scende (dalla porta al marciapiede), poi chi sale
  if(job.phaseT>=job.next&&job.alight.length){
   const p=job.alight.shift(),door=doors[1];
   agent.busRiders.splice(agent.busRiders.indexOf(p),1);
   Object.assign(p,{x:door.x,y:door.y,prevX:door.x,prevY:door.y,indoors:false,a:Math.atan2(stop.walk.y-door.y,stop.walk.x-door.x)});
   p.busStop={stop,spot:stop.walk,phase:'alight'};job.moving.push(p);s.stats.bus.alighted++;job.next=job.phaseT+.7;
  }
  // chi aspetta sale (anche chi è arrivato alla pensilina mentre l'autobus era fermo), fino alla capienza
  const ready=stop.waiting.filter(w=>w.busStop?.phase==='wait');
  if(job.phaseT>=job.next&&!job.alight.length&&ready.length&&
   agent.busRiders.length+job.moving.filter(p=>p.busStop?.phase==='board').length<R.capacity){
   const p=ready[0];p.busStop.phase='board';p.busStop.boarding=true;job.moving.push(p);job.next=job.phaseT+.7;
  }
  for(const p of [...job.moving]){
   const st=p.busStop;
   if(st.phase==='alight'){if(walkTo(p,stop.walk,R.walkSpeed,dt)){job.moving.splice(job.moving.indexOf(p),1);unclaim(p,stop.walk,ctx);}}
   else if(st.phase==='board'){
    if(walkTo(p,doors[0],R.walkSpeed,dt)){
     job.moving.splice(job.moving.indexOf(p),1);stop.waiting.splice(stop.waiting.indexOf(p),1);
     p.indoors=true;p.busRider={bus:agent,from:stop.id,stops:0,ride:1+hash((p.seed|0)+7)%2};delete p.busStop;agent.busRiders.push(p);s.stats.bus.boarded++;
    }
   }
  }
  const done=!job.alight.length&&!job.moving.length&&!stop.waiting.some(w=>w.busStop?.phase==='wait'&&agent.busRiders.length<R.capacity);
  if((done&&job.phaseT>=job.dwell)||job.phaseT>=R.maxDwell){
   // chi non ha fatto in tempo a salire resta ad aspettare il prossimo
   for(const p of job.moving.filter(q=>q.busStop?.phase==='board')){p.busStop.phase='wait';p.busStop.boarding=false;}
   for(const p of job.moving.filter(q=>q.busStop?.phase==='alight')){/* finisce di scendere da solo */}
   job.phase='close';job.phaseT=0;
   say(ctx,agent,agent.busRiders.length?agent.busRiders.length+' a bordo':'Si riparte');
  }
  return;
 }
}
// Passeggeri di un autobus che esce dal comune o sparisce dal traffico: scendono a una fermata fuori vista.
function settleRiders(s,ctx){
 const live=new Set(ctx.traffic||[]);
 for(const p of ctx.people||[]){
  const bus=p.busRider?.bus;
  if(!bus||(live.has(bus)&&!bus.gateMode))continue;
  const stop=s.stops.find(q=>outsideView(q.walk,ctx.view,30))||s.stops[0];
  if(bus.busRiders)bus.busRiders.splice(bus.busRiders.indexOf(p),1);
  if(stop)unclaim(p,stop.walk,ctx);else{delete p.busRider;p.indoors=false;}
 }
}


/* Un urto (o l'uscita da un varco) durante un lavoro. true = lavoro chiuso o sospeso, il passo è finito. */
function interruptOnKnock(s,agent,job,ctx){
 if(job.kind==='refuse')return false;// l'operatore finisce il bidone, il camion lo aspetta di nuovo
 if(job.kind==='tow'){
  if(job.phase==='drive'||job.phase==='carry')return false;
  if(job.phase==='load'&&job.from)Object.assign(job.car,job.from);// l'auto torna nello stallo, ancora in panne
  job.car.towTruck=null;agent.path=null;s.stats.tow.failed++;finish(s,agent,job,ctx,'interrotto: urto');return true;
 }
 if(job.kind==='courier'){
  if(job.driver&&(job.phase==='walkOut'||job.phase==='deliver'||job.phase==='back')){job.knocked=true;return true;}
  s.stats.courier.failed++;finish(s,agent,job,ctx,'interrotto: urto');return true;
 }
 if(job.kind==='bus'){
  agent.busDoors=0;
  for(const p of job.moving||[]){
   if(p.busStop?.phase==='board'){p.busStop.phase='wait';p.busStop.boarding=false;}
   else if(p.busStop?.phase==='alight')unclaim(p,job.stop.walk,ctx);
  }
  s.stats.bus.failed++;finish(s,agent,job,ctx,'interrotto: urto');return true;
 }
 return false;
}
const START={courier:startCourier,refuse:startRefuse,tow:()=>{},bus:startBus};
const STEP={courier:stepCourier,refuse:stepRefuse,tow:stepTow,bus:stepBus};
/* Un passo di lavoro per tutti i mezzi di servizio. ctx: {graph, traffic, parked, people, doors, shops, objects,
 * view, playerVehicle, clockMinutes, canStand, onRoad, freeStalls, stallTaken, fits, blocked, shape, carPosition,
 * walkPosition, planRoute, moveObject, parkInStall, freeStallOutOfView, say}. */
export function stepServiceRoutines(s,dt,ctx){
 if(!s||!ctx?.graph)return;
 s.clock+=dt;
 const live=new Set(ctx.traffic||[]);
 for(const [agent,job] of [...s.jobs]){
  if(!live.has(agent)){
   if(job.car&&job.car.towTruck===agent)job.car.towTruck=null;
   if(agent.towed){const car=agent.towed,stall=ctx.freeStallOutOfView?.(car);if(stall){ctx.parkInStall?ctx.parkInStall(car,stall):Object.assign(car,stall);car.towedBy=null;agent.towed=null;}}
   for(const f of job.figures||[])removeFigure(s,f);s.jobs.delete(agent);note(s,job.kind,'mezzo uscito dal traffico');
  }
 }
 stepBreakdowns(s,dt,ctx);
 dispatchTow(s,ctx);
 stepStops(s,dt,ctx);
 settleRiders(s,ctx);
 for(const agent of ctx.traffic||[]){
  const kind=serviceKind(agent.model);if(!kind)continue;
  if(kind==='refuse')keepSlow(agent);
  const job=s.jobs.get(agent);
  if(job){
   const knocked=agent.impactTime>0||agent.needsRoutineRecovery||!!agent.gateMode;
   if(knocked&&agent.serviceHold)release(agent);// roads.mjs lo rimette in corsia
   if(knocked&&interruptOnKnock(s,agent,job,ctx))continue;
   if(job.knocked){// furgone spinto via dallo stallo: l'autista torna al furgone e il lavoro si chiude
    if(knocked)continue;
    hold(agent);
    if(walkTo(job.driver,{x:agent.x,y:agent.y},SERVICE_RULES.courier.walkSpeed,dt)){s.stats.courier.failed++;finish(s,agent,job,ctx,'interrotto: urto');}
    continue;
   }
   if(knocked&&job.kind!=='refuse')continue;
   STEP[kind](s,agent,job,dt,ctx);
   continue;
  }
  if(agent.gateMode||agent.impactTime>0||agent.needsRoutineRecovery||agent.edge==null||agent.towed)continue;
  if(agent.serviceNext===undefined)agent.serviceNext=s.clock+scaled(s,between(SERVICE_RULES[kind].firstDelay||[2,6],agent.seed));
  if(s.clock<agent.serviceNext)continue;
  START[kind](s,agent,ctx);
 }
}

/* Disegno (solo primitive del canvas, nello stile dei cartelli e delle pensiline esistenti; PROVVISORIO). */
export function drawBusStops(c,stops,[x0,y0,x1,y1]){
 for(const s of stops||[]){
  const p=s.shelter;if(p.x<x0-8||p.x>x1+8||p.y<y0-8||p.y>y1+8)continue;
  c.save();c.translate(p.x,p.y);c.rotate(p.a);
  c.fillStyle='rgba(0,0,0,.22)';c.fillRect(-2.05,-.45,4.3,1.35);// ombra
  c.fillStyle='#2f3a40';c.fillRect(-2.1,-.75,4.2,1.4);// tetto della pensilina
  c.fillStyle='#8fb6c4';c.fillRect(-1.9,-.6,3.8,1.1);// vetro
  c.fillStyle='rgba(255,255,255,.35)';c.fillRect(-1.85,-.58,3.7,.22);
  c.fillStyle='#2f3a40';c.fillRect(-1.95,.25,3.9,.18);// panca
  c.restore();
  // palina con il cartello giallo «FERMATA», sul bordo del marciapiede
  const nx=-Math.sin(p.a),ny=Math.cos(p.a),ux=Math.cos(p.a),uy=Math.sin(p.a);
  const sx=s.walk.x-nx*.9+ux*2.6,sy=s.walk.y-ny*.9+uy*2.6;
  c.fillStyle='#3a3f42';c.fillRect(sx-.12,sy-.12,.24,.24);
  c.fillStyle='#f2c230';c.fillRect(sx-.95,sy-1.25,1.9,.75);c.strokeStyle='#5b4a12';c.lineWidth=.08;c.strokeRect(sx-.95,sy-1.25,1.9,.75);
  c.fillStyle='#2b2412';c.font='bold .42px monospace';c.textAlign='center';c.textBaseline='middle';c.fillText('FERMATA',sx,sy-.87);
 }
}
// Porte dell'autobus aperte: due varchi scuri sul fianco destro.
export function drawBusDoors(c,x,y,a,bus,shape){
 const k=bus.busDoors||0;if(k<=0||!shape)return;
 c.save();c.translate(x,y);c.rotate(a);
 c.fillStyle='rgba(18,22,26,.85)';
 for(const f of [.42,-.38]){const cx=shape.halfLength*f;c.fillRect(cx-.7*k,shape.halfWidth-.15,1.4*k,.42);}
 c.restore();
}
// Triangolo di emergenza dietro l'auto in panne.
export function drawWarningTriangle(c,car,shape){
 if(!car?.broken||!shape)return;
 const ux=Math.cos(car.a),uy=Math.sin(car.a),x=car.x-ux*(shape.halfLength+2.4),y=car.y-uy*(shape.halfLength+2.4);
 c.save();c.translate(x,y);c.rotate(car.a+Math.PI/2);
 c.beginPath();c.moveTo(0,-.65);c.lineTo(.6,.45);c.lineTo(-.6,.45);c.closePath();
 c.fillStyle='#d8281f';c.fill();c.fillStyle='#f6e7d0';c.beginPath();c.moveTo(0,-.3);c.lineTo(.3,.25);c.lineTo(-.3,.25);c.closePath();c.fill();
 c.restore();
}
// Dove disegnare l'auto sul pianale del carro attrezzi (posa del carro già interpolata).
export function towedCarPose(x,y,a,shape){return {x:x-Math.cos(a)*shape.halfLength*.3,y:y-Math.sin(a)*shape.halfLength*.3,a};}
