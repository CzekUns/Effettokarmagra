/* Q24 — superfici stradali di FINZIONE ARCADE: buche, dossi rallentatori, tombini, rappezzi,
 * tratti di pavé nelle piazze e fondo sterrato sulle strade OSM di tipo `track`.
 * Nessuna di queste è una buca o un dosso documentato a Melito: sono posizionati in modo
 * deterministico su tratti sicuri della rete OSM (lontani da incroci, strisce pedonali, baie di
 * sosta e confine comunale) senza cambiare la geometria delle strade.
 * Effetti calibrati per mezzo: sobbalzo, un po' di velocità e di aderenza, mai blocchi o danni;
 * lo scooter è il più sensibile, i mezzi pesanti i meno. */
export const SURFACE_FICTION=true;
export const SURFACE_RULES=Object.freeze({
 junctionClear:20,   // m dal centro di un incrocio (strisce a 8 m, linee d'arresto e semafori)
 endClear:6,         // m dalle altre estremità di un tratto
 step:22,            // passo dei possibili elementi lungo la strada
 kerbMargin:1.3,     // distanza minima dal bordo della carreggiata
 maxBumps:16,
 anchorRange:90,     // dossi vicino a scuole e chiese (POI), entro questa distanza
 cooldown:.8,        // s prima che lo stesso elemento dia di nuovo un colpo
 cell:32
});
const MINOR=new Set(['residential','living_street','service','unclassified']);
const POTHOLE_CHANCE={service:.14,track:.0,residential:.11,unclassified:.11,living_street:.07,tertiary:.05,secondary:.035,primary:.03,trunk:.02,motorway:0};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function hash(...parts){
 let h=2166136261;
 for(const part of parts){const s=String(part);for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}}
 h^=h>>>13;h=Math.imul(h,0x5bd1e995);h^=h>>>15;return h>>>0;
}
const rand=h=>(h%100000)/100000;

// Come risponde ciascun tipo di mezzo (loss = quota di velocità persa al colpo, bump = sobbalzo 0..1,
// drag = freno continuo al secondo, grip = perdita di aderenza sommata al bagnato).
export const SURFACE_FEEL=Object.freeze({
 car:Object.freeze({pothole:{loss:.05,bump:.45},manhole:{loss:0,bump:.14},bump:{comfort:5,loss:.18,bump:.8},cobble:{drag:.08,grip:.12,vib:.08},dirt:{drag:.14,grip:.22,vib:.12},kerb:{loss:.05,bump:.35}}),
 ape:Object.freeze({pothole:{loss:.08,bump:.65},manhole:{loss:.01,bump:.25},bump:{comfort:4,loss:.2,bump:.9},cobble:{drag:.10,grip:.16,vib:.14},dirt:{drag:.16,grip:.26,vib:.18},kerb:{loss:.07,bump:.5}}),
 scooter:Object.freeze({pothole:{loss:.11,bump:.85},manhole:{loss:.02,bump:.3},bump:{comfort:4,loss:.24,bump:1},cobble:{drag:.12,grip:.2,vib:.16},dirt:{drag:.2,grip:.32,vib:.22},kerb:{loss:.09,bump:.6}}),
 moto:Object.freeze({pothole:{loss:.08,bump:.7},manhole:{loss:.01,bump:.22},bump:{comfort:5,loss:.2,bump:.9},cobble:{drag:.09,grip:.16,vib:.12},dirt:{drag:.15,grip:.26,vib:.18},kerb:{loss:.07,bump:.5}}),
 heavy:Object.freeze({pothole:{loss:.03,bump:.3},manhole:{loss:0,bump:.08},bump:{comfort:4,loss:.14,bump:.6},cobble:{drag:.06,grip:.08,vib:.06},dirt:{drag:.1,grip:.14,vib:.1},kerb:{loss:.04,bump:.3}})
});
export function feelKind(vehicle){
 const model=String(vehicle?.model||'');
 if(vehicle?.vehicleType==='motorcycle')return model.startsWith('moto-scooter')?'scooter':'moto';
 if(model.startsWith('ape-'))return 'ape';
 if(/^(furgone|food-|servizio|camion|bus|attrezzi|corriere|nettezza)/.test(model))return 'heavy';
 return 'car';
}

function addToGrid(surfaces,item,x0,y0,x1,y1){
 const c=SURFACE_RULES.cell;
 for(let cx=Math.floor(x0/c);cx<=Math.floor(x1/c);cx++)for(let cy=Math.floor(y0/c);cy<=Math.floor(y1/c);cy++){
  const k=cx+','+cy;let list=surfaces.cells.get(k);if(!list)surfaces.cells.set(k,list=[]);list.push(item);
 }
}
export function surfacesNear(surfaces,x0,y0,x1,y1){
 if(!surfaces)return [];
 const c=SURFACE_RULES.cell,out=new Set();
 for(let cx=Math.floor(x0/c);cx<=Math.floor(x1/c);cx++)for(let cy=Math.floor(y0/c);cy<=Math.floor(y1/c);cy++)
  for(const item of surfaces.cells.get(cx+','+cy)||[])out.add(item);
 return [...out];
}
// A strip along a road segment (dosso, pavé, sterrato): centre, direction, half length and half width.
function strip(kind,x,y,a,halfLength,halfWidth,extra={}){
 const c=Math.cos(a),s=Math.sin(a),ex=Math.abs(c)*halfLength+Math.abs(s)*halfWidth,ey=Math.abs(s)*halfLength+Math.abs(c)*halfWidth;
 return {kind,x,y,a,halfLength,halfWidth,box:[x-ex,y-ey,x+ex,y+ey],...extra};
}
function insideStrip(item,x,y,pad=0){
 const dx=x-item.x,dy=y-item.y,c=Math.cos(item.a),s=Math.sin(item.a);
 return Math.abs(dx*c+dy*s)<=item.halfLength+pad&&Math.abs(-dx*s+dy*c)<=item.halfWidth+pad;
}

/* Places the fictional surface details on the car network. `clear(x,y)` says a point is free
 * (no building, no crossing), `inBay(x,y,margin)` marks the BF02 parking strip, `nearBorder` the
 * municipal border, `anchors` the POIs where a speed bump is plausible (school, church).
 * Speed bumps are also written on the graph edges (`edge.bumps`: distances along the edge) so the
 * NPC traffic slows down before them. */
export function placeRoadSurfaces(graph,{clear=()=>true,inBay=()=>false,nearBorder=()=>false,anchors=[]}={}){
 const surfaces={items:[],cells:new Map(),bumps:0,fiction:SURFACE_FICTION};
 if(!graph?.edges?.length)return surfaces;
 const {nodes,edges}=graph;
 for(const e of edges)if(e.bumps)delete e.bumps;
 const carOut=id=>nodes[id].out.filter(k=>edges[k].car).length;
 const junction=id=>carOut(id)>=3;
 const seen=new Set(),bumpCandidates=[];
 // Every junction of the network (not only the ends of a segment): crossings, stop lines and lights.
 const jc=SURFACE_RULES.cell,jgrid=new Map();
 nodes.forEach((n,id)=>{if(!junction(id))return;const k=Math.floor(n.x/jc)+','+Math.floor(n.y/jc);let l=jgrid.get(k);if(!l)jgrid.set(k,l=[]);l.push(n);});
 const nearJunction=(x,y,r)=>{for(let cx=Math.floor((x-r)/jc);cx<=Math.floor((x+r)/jc);cx++)for(let cy=Math.floor((y-r)/jc);cy<=Math.floor((y+r)/jc);cy++)
  for(const n of jgrid.get(cx+','+cy)||[])if(Math.hypot(n.x-x,n.y-y)<r)return true;return false;};
 const add=(item)=>{surfaces.items.push(item);const b=item.box||[item.x-item.r,item.y-item.r,item.x+item.r,item.y+item.r];addToGrid(surfaces,item,...b);};
 for(let i=0;i<edges.length;i++){
  const e=edges[i];if(!e.car||e.len<26)continue;
  const lo=Math.min(e.from,e.to),hi=Math.max(e.from,e.to),key=lo+':'+hi;
  if(seen.has(key))continue;seen.add(key);
  const a=nodes[e.from],c=Math.cos(e.angle),s=Math.sin(e.angle),nx=-s,ny=c;
  const startClear=junction(e.from)?SURFACE_RULES.junctionClear:SURFACE_RULES.endClear;
  const endClear=junction(e.to)?SURFACE_RULES.junctionClear:SURFACE_RULES.endClear;
  const half=e.streetWidth/2,usable=half-SURFACE_RULES.kerbMargin;
  const from=startClear,to=e.len-endClear;
  if(to-from<6||usable<.8)continue;
  const at=(d,off=0)=>({x:a.x+c*d+nx*off,y:a.y+s*d+ny*off});
  const safe=(p,reach=1.5)=>clear(p.x,p.y)&&!inBay(p.x,p.y,.6)&&!nearBorder(p.x,p.y)&&!nearJunction(p.x,p.y,SURFACE_RULES.junctionClear+reach);
  // Fondo diverso lungo tutto il tratto: sterrato sulle `track`, pavé nelle piazze.
  const area=e.roadType==='track'?'dirt':/^piazza\b/i.test(e.name||'')?'cobble':null;
  if(area){
   const mid=at((from+to)/2);
   if(clear(mid.x,mid.y)&&!nearBorder(mid.x,mid.y))add(strip(area,mid.x,mid.y,e.angle,(to-from)/2,Math.max(1.2,half-.9),{edgeKey:key,seed:hash(key,area)}));
  }
  for(let d=from+4;d<=to-4;d+=SURFACE_RULES.step){
   const h=hash(key,Math.round(d)),r=rand(h);
   const pot=POTHOLE_CHANCE[e.roadType]??.08;
   const kind=r<pot?'pothole':r<pot+.07?'manhole':r<pot+.13?'patch':null;
   if(!kind||area&&kind!=='manhole')continue;
   const side=(h>>>8)&1?1:-1,off=clamp(side*usable*(.35+rand(h>>>3)*.5),-usable,usable);
   const p=at(d+(rand(h>>>5)-.5)*6,off);
   if(!safe(p))continue;
   if(kind==='patch')add(strip('patch',p.x,p.y,e.angle+(rand(h>>>11)-.5)*.3,1.2+rand(h>>>7)*1.6,.8+rand(h>>>9)*.9,{seed:h}));
   else add({kind,x:p.x,y:p.y,a:e.angle,r:kind==='pothole'?.8+rand(h>>>7)*.5:.72,seed:h,box:null});
  }
  if(MINOR.has(e.roadType)&&e.len>=50&&!area){
   let best=null;
   for(const q of anchors){
    const dx=q.x-a.x,dy=q.y-a.y,along=clamp(dx*c+dy*s,from+6,to-6),p=at(along),dist=Math.hypot(q.x-p.x,q.y-p.y);
    if(dist<SURFACE_RULES.anchorRange&&(!best||dist<best.dist))best={d:along,dist,why:'vicino a '+(q.label||'POI')};
   }
   const h=hash(key,'dosso');
   if(!best&&rand(h)<.035)best={d:clamp(e.len/2,from+6,to-6),dist:Infinity,why:'di gioco'};
   if(best)bumpCandidates.push({i,e,key,d:best.d,dist:best.dist,why:best.why,half,at:at(best.d)});
  }
 }
 bumpCandidates.sort((p,q)=>p.dist-q.dist||p.key.localeCompare(q.key));
 for(const b of bumpCandidates){
  if(surfaces.bumps>=SURFACE_RULES.maxBumps)break;
  if(!clear(b.at.x,b.at.y)||nearBorder(b.at.x,b.at.y)||nearJunction(b.at.x,b.at.y,SURFACE_RULES.junctionClear+1))continue;
  if(surfaces.items.some(q=>q.kind==='bump'&&Math.hypot(q.x-b.at.x,q.y-b.at.y)<60))continue;
  const item=strip('bump',b.at.x,b.at.y,b.e.angle,.8,b.half-.3,{why:b.why,edgeKey:b.key});
  add(item);surfaces.bumps++;
  // Both directions of the segment learn where the bump is.
  const [lo,hi]=b.key.split(':').map(Number);
  for(const j of [...nodes[lo].out,...nodes[hi].out]){
   const f=edges[j];if(!f.car)continue;
   if(f.from===b.e.from&&f.to===b.e.to)(f.bumps||=[]).push(b.d);
   else if(f.from===b.e.to&&f.to===b.e.from)(f.bumps||=[]).push(f.len-b.d);
  }
 }
 return surfaces;
}

// Listeners for Q23 (damage): every discrete hit (pothole, bump, manhole, kerb) is announced here.
const listeners=new Set();
export function onSurfaceHit(fn){listeners.add(fn);return ()=>listeners.delete(fn);}
export function emitSurfaceHit(detail){for(const fn of listeners){try{fn(detail);}catch(_){}}}

function wheels(vehicle,shape){
 const c=Math.cos(vehicle.a),s=Math.sin(vehicle.a),f=(shape?.halfLength||3.15)*.62,w=(shape?.halfWidth||1.7)*.7;
 if(vehicle.vehicleType==='motorcycle')return [[f,0],[-f,0]].map(([l,t])=>({x:vehicle.x+c*l-s*t,y:vehicle.y+s*l+c*t}));
 return [[f,w],[f,-w],[-f,w],[-f,-w]].map(([l,t])=>({x:vehicle.x+c*l-s*t,y:vehicle.y+s*l+c*t}));
}
/* What the surface under the vehicle does this frame: speed factor, grip loss (added to the wet
 * value of applyGrip), visual bump 0..1 and the discrete hits. `memory` (a Map) keeps the cooldowns. */
export function roadSurfaceEffect(surfaces,vehicle,{speed=0,dt=0,wet=0,shape=null,memory=null,now=0}={}){
 const out={speedFactor:1,gripLoss:0,bump:0,hits:[],on:null};
 if(!surfaces||!vehicle)return out;
 const feel=SURFACE_FEEL[feelKind(vehicle)],v=Math.abs(speed),pace=clamp(v/14,.25,1);
 const pts=wheels(vehicle,shape),r=6;
 for(const item of surfacesNear(surfaces,vehicle.x-r,vehicle.y-r,vehicle.x+r,vehicle.y+r)){
  if(item.kind==='patch')continue;
  if(item.kind==='cobble'||item.kind==='dirt'){
   if(!insideStrip(item,vehicle.x,vehicle.y))continue;
   const f=feel[item.kind];out.on=item.kind;
   out.speedFactor*=1-f.drag*clamp(dt,0,.1)*clamp(v/8,0,1);
   out.gripLoss=Math.max(out.gripLoss,f.grip+(item.kind==='cobble'?.08*wet:0));
   out.bump=Math.max(out.bump,f.vib*clamp(v/12,0,1));
   continue;
  }
  const touching=item.kind==='bump'?pts.some(p=>insideStrip(item,p.x,p.y,.1)):pts.some(p=>Math.hypot(p.x-item.x,p.y-item.y)<item.r+.2);
  if(!touching||v<.6)continue;
  if(memory){const last=memory.get(item);if(last!==undefined&&now-last<SURFACE_RULES.cooldown)continue;memory.set(item,now);}
  let loss=0,bump=0;
  if(item.kind==='bump'){
   const f=feel.bump,over=clamp((v-f.comfort)/12,0,1);
   loss=f.loss*over;bump=f.bump*Math.max(.12,over);
  }else{
   const f=feel[item.kind];loss=f.loss*pace;bump=f.bump*pace;
   if(item.kind==='pothole'&&wet>.3)out.gripLoss=Math.max(out.gripLoss,.2*wet);
  }
  out.speedFactor*=1-loss;out.bump=Math.max(out.bump,bump);
  out.hits.push({kind:item.kind,intensity:bump,loss,item});
 }
 // Never a block: at most a quarter of the speed in one frame.
 out.speedFactor=clamp(out.speedFactor,.75,1);
 return out;
}
// Mounting or leaving the kerb (game.mjs knows whether the car is on the pavement band).
export function kerbEffect(vehicle,speed){
 const f=SURFACE_FEEL[feelKind(vehicle)].kerb,pace=clamp(Math.abs(speed)/14,.25,1);
 return {speedFactor:1-f.loss*pace,bump:f.bump*pace,kind:'kerb'};
}

// ---- drawing (top-down pixel art, inside the static street tiles) ----
function poly(c,points){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();}
function drawPothole(c,q){
 const n=7,pts=[];
 for(let i=0;i<n;i++){const ang=i/n*Math.PI*2,rr=q.r*(.72+rand(hash(q.seed,i))*.42);pts.push([q.x+Math.cos(ang)*rr*1.18,q.y+Math.sin(ang)*rr*.86]);}
 c.save();
 poly(c,pts);c.fillStyle='#1d2224';c.fill();
 c.strokeStyle='#4b5150';c.lineWidth=.22;c.stroke();
 poly(c,pts.map(([x,y])=>[q.x+(x-q.x)*.55-.12,q.y+(y-q.y)*.5-.12]));c.fillStyle='#2b3133';c.fill();
 c.strokeStyle='#3a4042';c.lineWidth=.12;
 for(let i=0;i<3;i++){const ang=rand(hash(q.seed,'k',i))*Math.PI*2,len=q.r*(.8+rand(hash(q.seed,'l',i)));c.beginPath();c.moveTo(q.x+Math.cos(ang)*q.r,q.y+Math.sin(ang)*q.r*.8);c.lineTo(q.x+Math.cos(ang)*(q.r+len),q.y+Math.sin(ang)*(q.r+len)*.8);c.stroke();}
 c.restore();
}
function drawManhole(c,q){
 c.save();
 c.beginPath();c.arc(q.x,q.y,q.r,0,Math.PI*2);c.fillStyle='#575b58';c.fill();
 c.beginPath();c.arc(q.x,q.y,q.r*.82,0,Math.PI*2);c.fillStyle='#3d4240';c.fill();
 c.strokeStyle='#666a66';c.lineWidth=.1;
 for(let k=-2;k<=2;k++){c.beginPath();c.moveTo(q.x+k*q.r*.3,q.y-q.r*.7);c.lineTo(q.x+k*q.r*.3,q.y+q.r*.7);c.stroke();}
 c.restore();
}
function inStripSpace(c,q,fn){c.save();c.translate(q.x,q.y);c.rotate(q.a);fn();c.restore();}
function drawPatch(c,q){
 inStripSpace(c,q,()=>{
  c.fillStyle='#262b2d';c.fillRect(-q.halfLength,-q.halfWidth,q.halfLength*2,q.halfWidth*2);
  c.strokeStyle='#1c2022';c.lineWidth=.14;c.strokeRect(-q.halfLength,-q.halfWidth,q.halfLength*2,q.halfWidth*2);
 });
}
function drawBump(c,q){
 inStripSpace(c,q,()=>{
  const L=q.halfLength,W=q.halfWidth;
  c.fillStyle='#1b1e1f';c.fillRect(-L,-W,L*2,W*2);
  // gomma a strisce gialle e nere, come i dossi artificiali di finzione
  for(let y=-W,k=0;y<W;y+=.8,k++){c.fillStyle=k%2?'#202325':'#d7ad35';c.fillRect(-L+.1,y,L*2-.2,Math.min(.8,W-y));}
  c.fillStyle='#ffffff22';c.fillRect(-L,-W,.18,W*2);
 });
}
function capsule(c,L,W){
 // a strip with rounded ends, so the paving never shows square corners over the kerb
 const r=Math.min(W,L);c.beginPath();c.moveTo(-L+r,-W);c.lineTo(L-r,-W);c.arc(L-r,0,W,-Math.PI/2,Math.PI/2);c.lineTo(-L+r,W);c.arc(-L+r,0,W,Math.PI/2,Math.PI*1.5);c.closePath();
}
function drawCobble(c,q){
 inStripSpace(c,q,()=>{
  const L=q.halfLength,W=q.halfWidth;
  c.save();capsule(c,L,W);c.clip();
  c.fillStyle='#3d3a36';c.fillRect(-L,-W,L*2,W*2);
  const sw=1.15,sh=.78;
  for(let y=-W,row=0;y<W;y+=sh,row++){
   for(let x=-L-(row%2)*sw/2;x<L;x+=sw){
    const t=rand(hash(q.seed,row,Math.round(x*10)));
    c.fillStyle=t<.33?'#6c665c':t<.66?'#605a51':'#78705f';
    c.fillRect(x+.09,y+.09,sw-.18,sh-.18);
    c.fillStyle='#ffffff14';c.fillRect(x+.09,y+.09,sw-.18,.12);
   }
  }
  c.restore();
 });
}
function drawDirt(c,q){
 inStripSpace(c,q,()=>{
  const L=q.halfLength,W=q.halfWidth;
  c.fillStyle='#735f44';c.fillRect(-L,-W,L*2,W*2);
  for(let i=0;i<Math.min(260,L*W*1.4);i++){
   const h=hash(q.seed,i),x=-L+rand(h)*L*2,y=-W+rand(h>>>9)*W*2;
   c.fillStyle=(h&3)===0?'#8c7656':(h&3)===1?'#5f4e38':'#7d6a4c';c.fillRect(x,y,.3,.3);
  }
  c.fillStyle='#5a4a35';for(const t of [-.45,.45])c.fillRect(-L,t*W-.25,L*2,.5);
 });
}
export function drawRoadSurfaces(c,surfaces,bounds,zoom=1){
 if(!surfaces||zoom<1)return;
 const [x0,y0,x1,y1]=bounds,items=surfacesNear(surfaces,x0-4,y0-4,x1+4,y1+4);
 const order={dirt:0,cobble:1,patch:2,manhole:3,pothole:4,bump:5};
 items.sort((p,q)=>order[p.kind]-order[q.kind]);
 for(const q of items){
  if(q.kind==='pothole')drawPothole(c,q);else if(q.kind==='manhole')drawManhole(c,q);
  else if(q.kind==='patch')drawPatch(c,q);else if(q.kind==='bump')drawBump(c,q);
  else if(q.kind==='cobble')drawCobble(c,q);else if(q.kind==='dirt')drawDirt(c,q);
 }
}
// Q08: with the rain the potholes fill with water (live overlay, only the ones in view).
export function drawSurfacePuddles(c,surfaces,bounds,wetness=0,rain=0,clock=0){
 if(!surfaces||wetness<.15)return;
 const [x0,y0,x1,y1]=bounds;
 c.save();
 for(const q of surfacesNear(surfaces,x0,y0,x1,y1)){
  if(q.kind!=='pothole')continue;
  c.globalAlpha=clamp(wetness,0,1)*.85;
  c.beginPath();c.ellipse(q.x,q.y,q.r*1.05,q.r*.78,0,0,Math.PI*2);c.fillStyle='#4f6676';c.fill();
  c.fillStyle='#9fb6c455';c.fillRect(q.x-q.r*.5,q.y-q.r*.35,q.r*.55,.18);
  if(rain>.15){const t=(clock*1.7+rand(q.seed))%1;c.strokeStyle='#c8d8e0';c.globalAlpha=(1-t)*.6*wetness;c.lineWidth=.08;c.beginPath();c.ellipse(q.x,q.y,q.r*.9*t+.1,q.r*.65*t+.07,0,0,Math.PI*2);c.stroke();}
 }
 c.restore();
}
