/* GTA Melito — Q34: gare clandestine come EVENTO ARCADE DI FINZIONE.
 * È solo un videogioco: le strade di Melito sono lo scenario del gioco, non un luogo adatto a gare.
 * Nella realtà le gare in strada sono pericolose e vietate; il gioco non le incoraggia e lo dice
 * al giocatore prima di ogni partenza (RACE_DISCLAIMER).
 *
 * Il modulo è puro (niente DOM): sceglie in modo deterministico 1–2 partenze su tratti periferici
 * della rete stradale di gioco (grafo di roads.mjs, strade OSM reali), costruisce uno sprint sulle
 * corsie percorribili in auto (sensi unici rispettati), mette i checkpoint in ordine, muove 3
 * avversari lungo lo stesso percorso e calcola cronometro, posizione, classifica e premio in euro
 * di gioco. Gli avversari aspettano sempre alla partenza (nessun pop-in) e tornano lì solo quando né
 * loro né la partenza sono inquadrati. Il traffico NPC resta dov'è: gli avversari rallentano dietro
 * ai veicoli che hanno davanti. Grafica provvisoria, da approvare. */
export const RACE_DISCLAIMER='Evento arcade di FINZIONE, solo nel gioco. Nella realtà le gare in strada sono pericolose e vietate: guida sempre con prudenza e rispetta il codice della strada.';
export const RACE_RULES=Object.freeze({
 minLength:650,maxLength:1000,     // lunghezza dello sprint (m)
 periphery:.55,                    // la partenza sta oltre il 55% della distanza massima dal centro
 startsApart:350,                  // due partenze distano almeno tanto
 checkpointEvery:110,              // un anello ogni ~110 m di percorso
 checkpointRadius:11,              // si passa entro 11 m dal centro dell'anello
 promptRadius:16,                  // «E · GARA» in auto entro 16 m dalla partenza
 countdown:3,                      // 3, 2, 1, VIA
 leaveDistance:60,                 // oltre 60 m dal percorso la gara è annullata
 timeLimitFactor:3.5,              // ritirato dopo 3,5 volte il tempo del più lento
 prizes:[300,150,60,0],            // € di gioco per 1°, 2°, 3°, 4°
 rivals:3
});
const BAD_TYPES=new Set(['service','track','living_street']);
const RIVAL_NAMES=['Saetta','Turbo','Fulmine'];
const RIVAL_SPEEDS=[16.5,15.2,14];  // m/s di crociera: battibili con una buona guida
const RIVAL_COLORS=['#d8452f','#3d7fd0','#e3b23c'];

const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function centerOf(graph){
 if(graph.borderCenter)return graph.borderCenter;
 let x=0,y=0;for(const n of graph.nodes){x+=n.x;y+=n.y;}
 return {x:x/(graph.nodes.length||1),y:y/(graph.nodes.length||1)};
}
const usable=(graph,id)=>{const e=graph.edges[id];
 return !!e&&e.car&&(!graph.liveCar||graph.liveCar[id])&&!BAD_TYPES.has(e.roadType)&&
  graph.nodes[e.to].gate===undefined&&graph.nodes[e.from].gate===undefined;};

/* Dijkstra sulle sole corsie percorribili in auto: restituisce distanze e arco di arrivo. */
function shortest(graph,start,limit){
 const n=graph.nodes.length,d=new Float64Array(n).fill(Infinity),via=new Int32Array(n).fill(-1),done=new Uint8Array(n);
 d[start]=0;const heap=[[0,start]];
 while(heap.length){
  let bi=0;for(let i=1;i<heap.length;i++)if(heap[i][0]<heap[bi][0])bi=i;
  const [du,u]=heap[bi];heap[bi]=heap[heap.length-1];heap.pop();
  if(done[u])continue;done[u]=1;if(du>limit)continue;
  for(const id of graph.nodes[u].out){if(!usable(graph,id))continue;
   const e=graph.edges[id],nd=du+e.len;
   if(nd<d[e.to]){d[e.to]=nd;via[e.to]=id;heap.push([nd,e.to]);}}
 }
 return {d,via};
}
function pathTo(graph,via,target){
 const edges=[];let v=target,guard=0;
 while(via[v]>=0&&guard++<5000){edges.push(via[v]);v=graph.edges[via[v]].from;}
 return edges.reverse();
}
/* Polilinea del percorso + lunghezze cumulate. */
export function routeGeometry(graph,edgeIds){
 const pts=[];
 if(!edgeIds.length)return {points:pts,cum:[0],length:0};
 const first=graph.nodes[graph.edges[edgeIds[0]].from];pts.push({x:first.x,y:first.y});
 for(const id of edgeIds){const n=graph.nodes[graph.edges[id].to];pts.push({x:n.x,y:n.y});}
 const cum=[0];for(let i=1;i<pts.length;i++)cum.push(cum[i-1]+dist(pts[i-1],pts[i]));
 return {points:pts,cum,length:cum[cum.length-1]};
}
/* Punto e direzione a distanza s lungo il percorso. */
export function pointAt(route,s){
 const {points:p,cum}=route;if(p.length<2)return {x:p[0]?.x||0,y:p[0]?.y||0,a:0,i:0};
 s=Math.max(0,Math.min(route.length,s));
 let lo=0,hi=cum.length-1;while(hi-lo>1){const m=(lo+hi)>>1;if(cum[m]<=s)lo=m;else hi=m;}
 const a=p[lo],b=p[hi],seg=cum[hi]-cum[lo]||1,t=(s-cum[lo])/seg;
 return {x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,a:Math.atan2(b.y-a.y,b.x-a.x),i:lo};
}
/* Proiezione di un punto sul percorso, cercando solo nella finestra [from,to] di arco. */
export function projectOnRoute(route,x,y,from=0,to=route.length){
 const {points:p,cum}=route;let best={s:0,d:Infinity};
 for(let i=1;i<p.length;i++){
  if(cum[i]<from||cum[i-1]>to)continue;
  const a=p[i-1],b=p[i],dx=b.x-a.x,dy=b.y-a.y,l=dx*dx+dy*dy||1;
  const t=Math.max(0,Math.min(1,((x-a.x)*dx+(y-a.y)*dy)/l)),qx=a.x+dx*t,qy=a.y+dy*t,d=Math.hypot(x-qx,y-qy);
  if(d<best.d)best={s:cum[i-1]+Math.sqrt(l)*t,d};
 }
 return best;
}
/* Curvatura semplice: quanto gira il percorso nei prossimi `ahead` metri (radianti). */
function turnAhead(route,s,ahead=28){
 const a=pointAt(route,s).a,b=pointAt(route,Math.min(route.length,s+ahead)).a;
 return Math.abs(Math.atan2(Math.sin(b-a),Math.cos(b-a)));
}

function buildRoute(graph,start,id,rules){
 const {d,via}=shortest(graph,start,rules.maxLength+50),c=centerOf(graph);
 let best=-1,score=-Infinity;
 for(let v=0;v<d.length;v++){
  if(!(d[v]>=rules.minLength&&d[v]<=rules.maxLength))continue;
  // Arrivo anch'esso lontano dal centro: lo sprint resta in periferia.
  const sc=dist(graph.nodes[v],c)+d[v]*.15;
  if(sc>score){score=sc;best=v;}
 }
 if(best<0)return null;
 const edges=pathTo(graph,via,best),geo=routeGeometry(graph,edges);
 if(geo.points.length<3)return null;
 const checkpoints=[],n=Math.max(3,Math.round(geo.length/rules.checkpointEvery));
 for(let k=1;k<=n;k++){const q=pointAt(geo,geo.length*k/n);checkpoints.push({x:q.x,y:q.y,a:q.a,s:geo.length*k/n,index:k-1});}
 const names=[...new Set(edges.map(e=>graph.edges[e].name).filter(Boolean))];
 const st=pointAt(geo,0);
 return {id,startNode:start,edges,...geo,checkpoints,names,
  start:{x:st.x,y:st.y,a:st.a},finish:checkpoints[checkpoints.length-1],
  label:'GARA '+(id+1)+(names.length?' · '+names[0].toUpperCase():'')};
}

/* 1–2 partenze periferiche, deterministiche (stessa mappa → stesse gare). */
export function prepareRaces(graph,{count=2,rules=RACE_RULES}={}){
 if(!graph?.nodes?.length)return {starts:[],routes:[]};
 const c=centerOf(graph);
 const far=graph.nodes.reduce((m,n)=>Math.max(m,dist(n,c)),0);
 const candidates=[];
 graph.nodes.forEach((n,i)=>{
  const r=dist(n,c);if(r<far*rules.periphery)return;
  if(!n.out.some(id=>usable(graph,id)))return;
  candidates.push({i,r});
 });
 candidates.sort((a,b)=>b.r-a.r||a.i-b.i);
 const routes=[];
 for(const cand of candidates){
  if(routes.length>=count)break;
  if(routes.some(r=>dist(r.start,graph.nodes[cand.i])<rules.startsApart))continue;
  const route=buildRoute(graph,cand.i,routes.length,rules);
  if(route)routes.push(route);
 }
 return {routes,center:c,rules};
}

/* Avversari: sempre presenti, fermi in griglia accanto alla partenza finché non si corre. */
function gridSlot(route,k){
 const s=Math.max(0,Math.min(route.length,4+k*7)),q=pointAt(route,s);
 const side=k%2?1:-1,off=1.9*side;
 return {x:q.x-Math.sin(q.a)*off,y:q.y+Math.cos(q.a)*off,a:q.a,s,lane:off};
}
export function createRivals(route,rules=RACE_RULES){
 return Array.from({length:rules.rivals},(_,k)=>{const g=gridSlot(route,k+1);
  return {name:RIVAL_NAMES[k%RIVAL_NAMES.length],color:RIVAL_COLORS[k%RIVAL_COLORS.length],
   cruise:RIVAL_SPEEDS[k%RIVAL_SPEEDS.length],x:g.x,y:g.y,a:g.a,s:g.s,lane:g.lane,v:0,
   finished:false,time:null,body:'car',vehicleType:'car',race:true};});
}
export function createRaceWorld(graph,options){
 const prepared=prepareRaces(graph,options);
 return {...prepared,rivals:prepared.routes.map(r=>createRivals(r,prepared.rules)),active:null,last:null};
}

/* Partenza vicina al giocatore IN AUTO (null se a piedi o lontano). */
export function raceHotspot(world,player,inCar){
 if(!world||world.active||!inCar)return null;
 for(const r of world.routes)if(dist(r.start,player)<=world.rules.promptRadius)return r;
 return null;
}

export function startRace(world,routeId,playerCarIndex){
 const route=world.routes[routeId];if(!route||world.active)return null;
 const rivals=world.rivals[routeId];
 rivals.forEach((v,k)=>{const g=gridSlot(route,k+1);Object.assign(v,{x:g.x,y:g.y,a:g.a,s:g.s,lane:g.lane,v:0,finished:false,time:null});});
 world.active={route,rivals,car:playerCarIndex,phase:'countdown',countdown:world.rules.countdown,
  time:0,next:0,playerS:0,playerTime:null,results:null,reason:null};
 return world.active;
}

/* Ostacoli davanti a un avversario. Traffico NPC: ne copia la velocità (resta dietro, nessun
 * sorpasso dentro le auto). Giocatore e altri avversari (pass:true): si sposta di lato e sorpassa. */
function obstacleAhead(v,obstacles){
 let limit=Infinity,shift=0;const fx=Math.cos(v.a),fy=Math.sin(v.a);
 for(const o of obstacles||[]){
  const dx=o.x-v.x,dy=o.y-v.y,ahead=dx*fx+dy*fy,lat=-dx*fy+dy*fx,side=Math.abs(lat);
  if(!(ahead>1&&ahead<14&&side<2.6))continue;
  if(o.pass){shift=lat>=0?-1:1;if(side<1.4&&ahead<4)limit=Math.min(limit,Math.max(0,Number(o.speed)||0));continue;}
  limit=Math.min(limit,ahead<5?0:Math.max(0,Number(o.speed)||0));
 }
 return {limit,shift};
}
function stepRival(v,route,dt,obstacles){
 if(v.finished)return;
 const corner=turnAhead(route,v.s),ob=obstacleAhead(v,obstacles);
 const target=Math.min(v.cruise*(1-Math.min(.62,corner*.55)),ob.limit);
 const acc=target>v.v?4.2:9;
 v.v+=Math.max(-acc*dt,Math.min(acc*dt,target-v.v));v.v=Math.max(0,v.v);
 v.s=Math.min(route.length,v.s+v.v*dt);
 // Sorpasso: scarto laterale di 2,4 m, poi rientro graduale al centro della corsia.
 const lane=ob.shift?Math.max(-2.4,Math.min(2.4,v.lane+ob.shift*2.4)):0;
 v.lane+=Math.max(-2*dt,Math.min(2*dt,lane-v.lane))*(ob.shift?1:.5);
 const q=pointAt(route,v.s);
 v.x=q.x-Math.sin(q.a)*v.lane;v.y=q.y+Math.cos(q.a)*v.lane;
 const da=Math.atan2(Math.sin(q.a-v.a),Math.cos(q.a-v.a));v.a+=da*Math.min(1,dt*8);
}

/* Un passo di gara. player = {x,y,car} (car = indice del veicolo guidato, -1 a piedi).
 * Restituisce un evento: 'go' | 'checkpoint' | 'finish' | 'cancel' | null. */
export function stepRace(world,dt,player,{obstacles=[]}={}){
 const race=world?.active;if(!race)return null;
 const {route,rules=world.rules}=race;
 if(player.car!==race.car)return cancelRace(world,'SEI SCESO DALL’AUTO');
 const proj=projectOnRoute(route,player.x,player.y,Math.max(0,race.playerS-40),race.playerS+160);
 if(proj.d>rules.leaveDistance)return cancelRace(world,'TROPPO LONTANO DAL PERCORSO');
 if(race.phase==='countdown'){
  race.countdown-=dt;
  if(race.countdown<=0){race.phase='racing';race.time=-race.countdown;return 'go';}
  return null;
 }
 if(race.phase!=='racing')return null;
 race.time+=dt;
 for(const v of race.rivals){
  stepRival(v,route,dt,[...obstacles,...race.rivals.filter(o=>o!==v).map(o=>({x:o.x,y:o.y,speed:o.v,pass:true})),
   {x:player.x,y:player.y,speed:player.speed||0,pass:true}]);
  if(!v.finished&&v.s>=route.length-.01){v.finished=true;v.time=race.time;}
 }
 let event=null;
 const cp=route.checkpoints[race.next];
 // L'avanzamento non supera il prossimo anello: saltarne uno non fa guadagnare posizioni.
 race.playerS=Math.max(race.playerS,Math.min(proj.s,cp?cp.s:route.length));
 if(cp&&Math.hypot(player.x-cp.x,player.y-cp.y)<=rules.checkpointRadius){
  race.next++;race.playerS=Math.max(race.playerS,cp.s);event='checkpoint';
  if(race.next>=route.checkpoints.length){race.playerTime=race.time;return finishRace(world);}
 }
 const slowest=route.length/Math.min(...RIVAL_SPEEDS);
 if(race.time>slowest*rules.timeLimitFactor)return cancelRace(world,'TEMPO SCADUTO');
 return event;
}

/* Posizione attuale: 1 + avversari davanti (arrivati o più avanti sul percorso). */
export function racePosition(race){
 if(!race)return 0;
 const me=race.playerTime!=null?Infinity:race.playerS;
 return 1+race.rivals.filter(v=>v.finished?(race.playerTime==null||v.time<race.playerTime):v.s>me).length;
}

export function finishRace(world){
 const race=world.active;if(!race)return null;
 const rules=world.rules,route=race.route;
 const rows=[{name:'TU',player:true,time:race.playerTime},...race.rivals.map(v=>({name:v.name,player:false,
  time:v.finished?v.time:race.time+(route.length-v.s)/Math.max(4,v.cruise*.8),estimated:!v.finished}))];
 rows.sort((a,b)=>a.time-b.time||(a.player?-1:1));
 const position=rows.findIndex(r=>r.player)+1,prize=rules.prizes[position-1]||0;
 race.phase='finished';race.results={rows,position,prize,route:route.label};
 world.last={...race.results,reason:null};world.active=null;
 return 'finish';
}
export function cancelRace(world,reason){
 const race=world.active;if(!race)return null;
 race.phase='cancelled';race.reason=reason;
 world.last={rows:null,position:0,prize:0,route:race.route.label,reason};world.active=null;
 return 'cancel';
}
/* Premio in euro di gioco nella partita (economia Q06, campaign.mjs). */
export function awardPrize(progress,results){
 if(!progress||!results||!(results.prize>0))return 0;
 progress.money=Math.min(999999,(Number(progress.money)||0)+results.prize);
 return results.prize;
}
/* Dopo una gara gli avversari restano fermi dove sono; tornano in griglia solo fuori dalla vista. */
export function parkIdleRivals(world,view,margin=20){
 if(!world)return;
 const out=p=>p.x<view[0]-margin||p.x>view[2]+margin||p.y<view[1]-margin||p.y>view[3]+margin;
 world.routes.forEach((route,i)=>{
  if(world.active?.route===route)return;
  const rivals=world.rivals[i];
  if(rivals.every(v=>v.v===0&&v.s<=4+rivals.length*7+.1&&!v.finished))return;
  for(const v of rivals){v.v=0;}
  if(rivals.every(out)&&out(route.start)){
   rivals.forEach((v,k)=>{const g=gridSlot(route,k+1);Object.assign(v,{x:g.x,y:g.y,a:g.a,s:g.s,lane:g.lane,v:0,finished:false,time:null});});
  }
 });
}
export const formatRaceTime=t=>{if(!Number.isFinite(t))return '--:--.-';const m=Math.floor(t/60),s=t-m*60;return m+':'+(s<10?'0':'')+s.toFixed(1);};
export function resultsText(results){
 if(!results)return '';
 if(!results.rows)return 'GARA ANNULLATA: '+results.reason+'.';
 const lines=results.rows.map((r,i)=>(i+1)+'° '+r.name+' · '+formatRaceTime(r.time)+(r.estimated?' (stimato)':''));
 return lines.join('\n')+'\n'+(results.prize>0?'Premio: +'+results.prize+' € di gioco.':'Nessun premio.')+'\nÈ solo un gioco: nella realtà niente gare in strada.';
}

/* ---- Disegno (grafica provvisoria, da approvare) ---- */
function drawFlag(ctx,x,y,a,size){
 ctx.save();ctx.translate(x,y);ctx.rotate(a+Math.PI/2);
 for(let i=-3;i<3;i++)for(let j=0;j<2;j++){ctx.fillStyle=(i+j)%2?'#f4f1e6':'#1d1d1d';ctx.fillRect(i*size,j*size-size,size,size);}
 ctx.restore();
}
export function drawRaceWorld(ctx,world,[x0,y0,x1,y1],zoom,clock=0,drawCar=null){
 if(!world)return;
 const vis=p=>p.x>=x0-30&&p.x<=x1+30&&p.y>=y0-30&&p.y<=y1+30;
 const race=world.active;
 for(const route of world.routes){
  if(race&&race.route!==route)continue;
  if(vis(route.start))drawFlag(ctx,route.start.x,route.start.y,route.start.a,1.1);
  if(!race&&vis(route.start)){
   const pulse=.5+.5*Math.sin(clock*3);
   ctx.strokeStyle='rgba(255,206,102,'+(.45+.4*pulse)+')';ctx.lineWidth=.6;
   ctx.beginPath();ctx.arc(route.start.x,route.start.y,RACE_RULES.promptRadius*.55,0,Math.PI*2);ctx.stroke();
  }
 }
 if(race){
  const cps=race.route.checkpoints;
  for(let k=race.next;k<Math.min(cps.length,race.next+2);k++){
   const cp=cps[k];if(!vis(cp))continue;
   const last=k===cps.length-1,main=k===race.next,r=RACE_RULES.checkpointRadius*.6;
   ctx.save();ctx.globalAlpha=main?.95:.4;
   ctx.strokeStyle=last?'#f4f1e6':'#ffce66';ctx.lineWidth=main?1.1:.6;
   ctx.beginPath();ctx.arc(cp.x,cp.y,r+.4*Math.sin(clock*5),0,Math.PI*2);ctx.stroke();
   ctx.strokeStyle='#1b1405';ctx.lineWidth=.3;ctx.beginPath();ctx.arc(cp.x,cp.y,r-.9,0,Math.PI*2);ctx.stroke();
   if(last)drawFlag(ctx,cp.x,cp.y,cp.a,.9);
   ctx.restore();
  }
  // Frecce sull'asfalto lungo i prossimi 60 m del percorso.
  ctx.fillStyle='rgba(255,206,102,.55)';
  for(let s=race.playerS+10;s<Math.min(race.route.length,race.playerS+70);s+=12){
   const q=pointAt(race.route,s);if(!vis(q))continue;
   ctx.save();ctx.translate(q.x,q.y);ctx.rotate(q.a);
   ctx.beginPath();ctx.moveTo(1.6,0);ctx.lineTo(-.8,-1.2);ctx.lineTo(-.2,0);ctx.lineTo(-.8,1.2);ctx.closePath();ctx.fill();
   ctx.restore();
  }
 }
 // Avversari: sempre visibili alla partenza o sul percorso.
 world.routes.forEach((route,i)=>{
  for(const v of world.rivals[i]){
   if(!vis(v))continue;
   if(drawCar)drawCar(v);
   ctx.fillStyle=v.color;ctx.fillRect(v.x-.5,v.y-.5,1,1);
  }
 });
}
export function drawRaceMini(ctx,world,{k,ox,oy}){
 if(!world)return;
 const race=world.active;
 for(const route of world.routes){
  if(race&&race.route!==route)continue;
  ctx.strokeStyle=race?'#ffce66':'rgba(255,206,102,.55)';ctx.lineWidth=race?2:1.2;ctx.beginPath();
  route.points.forEach((p,i)=>i?ctx.lineTo(ox+p.x*k,oy+p.y*k):ctx.moveTo(ox+p.x*k,oy+p.y*k));ctx.stroke();
  const s=route.start;ctx.fillStyle='#f4f1e6';ctx.fillRect(ox+s.x*k-2,oy+s.y*k-2,4,4);
  ctx.fillStyle='#1d1d1d';ctx.fillRect(ox+s.x*k-2,oy+s.y*k-2,2,2);ctx.fillRect(ox+s.x*k,oy+s.y*k,2,2);
 }
 if(race){
  const cp=race.route.checkpoints[race.next];
  if(cp){ctx.strokeStyle='#ffffff';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(ox+cp.x*k,oy+cp.y*k,3.5,0,Math.PI*2);ctx.stroke();}
  for(const v of race.rivals){ctx.fillStyle=v.color;ctx.fillRect(ox+v.x*k-1.5,oy+v.y*k-1.5,3,3);}
 }
}
/* HUD in coordinate schermo: conto alla rovescia, checkpoint, tempo, posizione. */
export function drawRaceHud(ctx,world,cw,ch){
 const race=world?.active;if(!race)return;
 ctx.save();ctx.textAlign='center';ctx.font='bold 12px monospace';
 const text='GARA · CP '+race.next+'/'+race.route.checkpoints.length+' · '+formatRaceTime(race.phase==='racing'?race.time:0)+' · POS '+racePosition(race)+'/'+(race.rivals.length+1);
 const w=ctx.measureText(text).width+16;
 ctx.fillStyle='rgba(16,20,18,.78)';ctx.fillRect(cw/2-w/2,8,w,20);
 ctx.fillStyle='#ffce66';ctx.fillText(text,cw/2,22);
 ctx.font='9px monospace';ctx.fillStyle='rgba(244,241,230,.75)';ctx.fillText('EVENTO DI FINZIONE · SOLO NEL GIOCO',cw/2,40);
 if(race.phase==='countdown'){
  ctx.font='bold 46px monospace';ctx.fillStyle='#ffce66';ctx.strokeStyle='#1b1405';ctx.lineWidth=4;
  const n=String(Math.max(1,Math.ceil(race.countdown)));
  ctx.strokeText(n,cw/2,ch/2-30);ctx.fillText(n,cw/2,ch/2-30);
 }else if(race.time<1.2){
  ctx.font='bold 40px monospace';ctx.fillStyle='#7ee08a';ctx.strokeStyle='#10200f';ctx.lineWidth=4;
  ctx.strokeText('VIA!',cw/2,ch/2-30);ctx.fillText('VIA!',cw/2,ch/2-30);
 }
 ctx.restore();
}
