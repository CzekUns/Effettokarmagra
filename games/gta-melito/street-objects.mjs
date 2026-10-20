/* Q07: ambiente fisicamente interattivo.
 * - Bidoni carrellati della differenziata (spostabili): sul marciapiede dal lato delle case,
 *   urtati dalle auto volano via e possono ribaltarsi, i pedoni li spingono piano.
 * - Paletti dissuasori in ghisa (fissi): sul bordo del marciapiede vicino agli incroci,
 *   fermano l'auto del giocatore come un muro e si aggirano a piedi.
 * Posizioni deterministiche e inventate (non censite). Un oggetto spostato torna al suo
 * posto solo quando né lui né il suo posto sono in vista: nessun teletrasporto davanti al giocatore. */
export const BIN_RADIUS=.55;
export const BOLLARD_RADIUS=.18;
export const WALKER_RADIUS=.45;
const ROAD_TYPES=new Set(['primary','secondary','tertiary','unclassified','residential','living_street']);
const BIN_COLORS=[['#2f63a8','#22497d'],['#e0b928','#a8891c'],['#3d8a4a','#2b6335'],['#6d7470','#4d5450']];
const hash=n=>{let x=(n|0)^0x4d2f6a1b;x=Math.imul(x^x>>>16,2246822519);x=Math.imul(x^x>>>13,3266489917);return (x^x>>>16)>>>0;};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function sampleRoad(p,distance){
 let left=distance;
 for(let i=2;i<p.length;i+=2){
  const dx=p[i]-p[i-2],dy=p[i+1]-p[i-1],len=Math.hypot(dx,dy);
  if(len>0&&left<=len)return {x:p[i-2]+dx*left/len,y:p[i-1]+dy*left/len,a:Math.atan2(dy,dx)};
  left-=len;
 }
 return null;
}
const roadLength=p=>{let s=0;for(let i=2;i<p.length;i+=2)s+=Math.hypot(p[i]-p[i-2],p[i+1]-p[i-1]);return s;};
/* ctx: {roadWidth(road), walkable(x,y), carriageway(x,y,margin) -> true se su una carreggiata,
 *       avoid:[{x,y,r}] (alberi, lampioni, porte, auto parcheggiate)} */
export function placeStreetObjects(roads,ctx){
 const bins=[],bollards=[],taken=[...(ctx.avoid||[])];
 const free=(x,y,r)=>taken.every(q=>Math.hypot(q.x-x,q.y-y)>=r+(q.r||0));
 const fits=(x,y,r,margin)=>ctx.walkable(x,y)&&!ctx.carriageway(x,y,margin)&&free(x,y,r);
 for(const road of roads){
  if(!ROAD_TYPES.has(road.t)||!road.p||road.p.length<4)continue;
  const width=ctx.roadWidth(road),len=roadLength(road.p),seed=hash(road.id);
  if(!(width>0)||len<30)continue;
  // Gruppi di 2–3 bidoni, uno ogni ~160 m, tra la linea dei pedoni e i muri.
  for(let d=34+seed%47,k=0;d<len-24;d+=160,k++){
   const at=sampleRoad(road.p,d);if(!at)continue;
   const side=(seed+k)%2?1:-1,offset=width/2+3.3+(hash(seed+k)%9)/10,count=2+hash(seed+k*7)%2;
   const nx=-Math.sin(at.a)*side,ny=Math.cos(at.a)*side,ux=Math.cos(at.a),uy=Math.sin(at.a);
   const group=[];
   for(let i=0;i<count;i++){
    const x=at.x+nx*offset+ux*(i-(count-1)/2)*1.25,y=at.y+ny*offset+uy*(i-(count-1)/2)*1.25;
    if(!fits(x,y,BIN_RADIUS+.15,.6)){group.length=0;break;}
    group.push({x,y});
   }
   for(const [i,q] of group.entries()){
    const color=BIN_COLORS[hash(seed+k*13+i)%BIN_COLORS.length];
    bins.push({kind:'bidone',x:q.x,y:q.y,a:at.a+Math.PI/2*side,vx:0,vy:0,spin:0,tipped:false,color,
     home:{x:q.x,y:q.y,a:at.a+Math.PI/2*side},rest:0,id:bins.length});
    taken.push({x:q.x,y:q.y,r:BIN_RADIUS});
   }
  }
  // Paletti: su una strada su tre, tre paletti a 8 m da un capo, sul bordo del marciapiede.
  if(seed%3===0&&len>=34){
   const fromEnd=seed%2===0,base=fromEnd?len-8-3.2:8,side=(seed>>>3)%2?1:-1,row=[];
   for(let i=0;i<3;i++){
    const at=sampleRoad(road.p,base+i*1.6);if(!at){row.length=0;break;}
    const off=width/2+.75,x=at.x-Math.sin(at.a)*off*side,y=at.y+Math.cos(at.a)*off*side;
    if(!fits(x,y,BOLLARD_RADIUS+.6,.3)){row.length=0;break;}
    row.push({kind:'paletto',x,y});
   }
   for(const q of row){bollards.push(q);taken.push({x:q.x,y:q.y,r:BOLLARD_RADIUS});}
  }
 }
 return {bins,bollards,grid:binGrid(bins),bollardGrid:binGrid(bollards),awake:new Set(),clock:0};
}
const CELL=16,key=(x,y)=>Math.floor(x/CELL)+','+Math.floor(y/CELL);
function binGrid(items){const g=new Map();for(const it of items){const k=key(it.x,it.y);if(!g.has(k))g.set(k,[]);g.get(k).push(it);}return g;}
export function nearbyObjects(grid,x,y,r=4){
 const out=[];
 for(let gx=Math.floor((x-r)/CELL);gx<=Math.floor((x+r)/CELL);gx++)
  for(let gy=Math.floor((y-r)/CELL);gy<=Math.floor((y+r)/CELL);gy++)
   for(const it of grid.get(gx+','+gy)||[])out.push(it);
 return out;
}
function moveInGrid(objects,bin,oldX,oldY){
 const a=key(oldX,oldY),b=key(bin.x,bin.y);if(a===b)return;
 const list=objects.grid.get(a);if(list){const i=list.indexOf(bin);if(i>=0)list.splice(i,1);}
 if(!objects.grid.has(b))objects.grid.set(b,[]);objects.grid.get(b).push(bin);
}
// Q20: un bidone spostato a mano (l'operatore della nettezza urbana): posizione e griglia insieme.
export function moveStreetObject(objects,obj,x,y){const ox=obj.x,oy=obj.y;obj.x=x;obj.y=y;moveInGrid(objects,obj,ox,oy);}
// Cerchio contro rettangolo orientato del veicolo (stesse misure di traffic-collision).
export function circleHitsVehicle(x,y,r,v,shape){
 const ca=Math.cos(v.a),sa=Math.sin(v.a),dx=x-v.x,dy=y-v.y;
 const f=dx*ca+dy*sa,s=-dx*sa+dy*ca;
 const cf=clamp(f,-shape.halfLength,shape.halfLength),cs=clamp(s,-shape.halfWidth,shape.halfWidth);
 const ex=f-cf,ey=s-cs,d=Math.hypot(ex,ey);
 if(d>=r)return null;
 // Normale di uscita in coordinate mondo; se il centro è dentro, si esce dal lato più vicino.
 let nf,ns,depth;
 if(d>1e-6){nf=ex/d;ns=ey/d;depth=r-d;}
 else{const pf=shape.halfLength-Math.abs(f),ps=shape.halfWidth-Math.abs(s);
  if(pf<ps){nf=Math.sign(f)||1;ns=0;depth=pf+r;}else{nf=0;ns=Math.sign(s)||1;depth=ps+r;}}
 return {nx:nf*ca-ns*sa,ny:nf*sa+ns*ca,depth};
}
export function bollardBlocksVehicle(objects,v,shape){
 for(const b of nearbyObjects(objects.bollardGrid,v.x,v.y,6))if(circleHitsVehicle(b.x,b.y,BOLLARD_RADIUS,v,shape))return b;
 return null;
}
export function bollardBlocksWalker(objects,x,y){
 for(const b of nearbyObjects(objects.bollardGrid,x,y,2))if(Math.hypot(b.x-x,b.y-y)<BOLLARD_RADIUS+WALKER_RADIUS)return b;
 return null;
}
/* Un passo di fisica. ctx: {vehicles:[{x,y,a,vx,vy,shape}], walkers:[{x,y}],
 * canMove(x,y), view:[x0,y0,x1,y1]} — restituisce i bidoni colpiti da un veicolo in questo passo. */
export function stepStreetObjects(objects,dt,ctx){
 const elapsed=clamp(Number(dt)||0,0,.05),hits=[];
 objects.clock+=elapsed;
 for(const v of ctx.vehicles||[]){
  const vx=v.vx||0,vy=v.vy||0,speed=Math.hypot(vx,vy);
  for(const bin of nearbyObjects(objects.grid,v.x,v.y,6)){
   const hit=circleHitsVehicle(bin.x,bin.y,BIN_RADIUS,v,v.shape);if(!hit)continue;
   const ox=bin.x,oy=bin.y;bin.x+=hit.nx*(hit.depth+.02);bin.y+=hit.ny*(hit.depth+.02);
   if(!ctx.canMove(bin.x,bin.y)){bin.x=ox;bin.y=oy;}
   const along=vx*hit.nx+vy*hit.ny;
   if(along>0||speed>.5){
    // Il bidone prende la velocità del veicolo più una spinta laterale, come un urto leggero.
    bin.vx=vx*1.1+hit.nx*Math.max(1.2,speed*.25);bin.vy=vy*1.1+hit.ny*Math.max(1.2,speed*.25);
    bin.spin=((bin.id%2)?1:-1)*Math.min(6,speed*.4);
    if(speed>6)bin.tipped=true;
    hits.push({bin,speed});
   }
   moveInGrid(objects,bin,ox,oy);objects.awake.add(bin);bin.rest=0;
  }
 }
 for(const w of ctx.walkers||[]){
  for(const bin of nearbyObjects(objects.grid,w.x,w.y,2)){
   const dx=bin.x-w.x,dy=bin.y-w.y,d=Math.hypot(dx,dy),min=BIN_RADIUS+WALKER_RADIUS;
   if(d>=min)continue;
   const nx=d>1e-6?dx/d:1,ny=d>1e-6?dy/d:0,ox=bin.x,oy=bin.y;
   bin.x+=nx*(min-d);bin.y+=ny*(min-d);
   if(!ctx.canMove(bin.x,bin.y)){bin.x=ox;bin.y=oy;continue;}
   // Spinto a mano: segue chi lo spinge e si ferma subito dopo, senza accumulare velocità.
   bin.vx=nx*.6;bin.vy=ny*.6;moveInGrid(objects,bin,ox,oy);objects.awake.add(bin);bin.rest=0;
  }
 }
 for(const bin of objects.awake){
  const speed=Math.hypot(bin.vx,bin.vy);
  if(speed>.03){
   const ox=bin.x,oy=bin.y,nx=bin.x+bin.vx*elapsed,ny=bin.y+bin.vy*elapsed;
   const post=nearbyObjects(objects.bollardGrid,nx,ny,2).find(b=>Math.hypot(b.x-nx,b.y-ny)<BOLLARD_RADIUS+BIN_RADIUS);
   if(post||!ctx.canMove(nx,ny)){bin.vx*=-.3;bin.vy*=-.3;}
   else{bin.x=nx;bin.y=ny;moveInGrid(objects,bin,ox,oy);}
   bin.a+=bin.spin*elapsed;
   const k=Math.exp(-(bin.tipped?5:3.2)*elapsed);bin.vx*=k;bin.vy*=k;bin.spin*=k;
  }else{bin.vx=0;bin.vy=0;bin.spin=0;}
  const displaced=bin.tipped||Math.hypot(bin.x-bin.home.x,bin.y-bin.home.y)>.25;
  if(!displaced&&speed<=.03){objects.awake.delete(bin);continue;}
  if(speed<=.03)bin.rest+=elapsed;
  // Rimesso a posto da qualcuno, ma solo fuori dalla vista e con il suo posto libero.
  if(bin.rest>45&&offView(bin,ctx.view)&&offView(bin.home,ctx.view)&&
     !(ctx.vehicles||[]).some(v=>circleHitsVehicle(bin.home.x,bin.home.y,BIN_RADIUS,v,v.shape))){
   const ox=bin.x,oy=bin.y;
   Object.assign(bin,{x:bin.home.x,y:bin.home.y,a:bin.home.a,vx:0,vy:0,spin:0,tipped:false,rest:0});
   moveInGrid(objects,bin,ox,oy);objects.awake.delete(bin);
  }
 }
 return hits;
}
function offView(q,view,pad=12){
 return !view||q.x<view[0]-pad||q.x>view[2]+pad||q.y<view[1]-pad||q.y>view[3]+pad;
}
export function drawStreetObjects(c,objects,bounds,zoom){
 if(!objects||zoom<1)return;
 const [x0,y0,x1,y1]=bounds,seen=(q)=>q.x>=x0-3&&q.x<=x1+3&&q.y>=y0-3&&q.y<=y1+3;
 for(const b of objects.bollards){
  if(!seen(b))continue;
  // Ghisa scura con la testa a cupola chiara: un po' più grande dell'ingombro, per leggerlo da lontano.
  c.fillStyle='#14201d55';c.beginPath();c.ellipse(b.x+.22,b.y+.18,.36,.22,0,0,Math.PI*2);c.fill();
  c.fillStyle='#1f2523';c.beginPath();c.arc(b.x,b.y,.3,0,Math.PI*2);c.fill();
  c.fillStyle='#9aa39d';c.beginPath();c.arc(b.x-.04,b.y-.05,.17,0,Math.PI*2);c.fill();
  c.fillStyle='#e3e8e2';c.fillRect(b.x-.11,b.y-.13,.08,.07);
 }
 for(const bin of objects.bins){
  if(!seen(bin))continue;
  c.save();c.translate(bin.x,bin.y);c.rotate(bin.a);
  c.fillStyle='#1a222044';c.fillRect(-.45,-.35,1.15,1);
  if(bin.tipped){
   // Rovesciato: corpo più lungo, coperchio aperto e un po' di carta per terra.
   c.fillStyle=bin.color[1];c.fillRect(-.55,-.42,1.25,.84);
   c.fillStyle=bin.color[0];c.fillRect(.62,-.45,.32,.9);
   c.fillStyle='#e9e2cf';c.fillRect(1.05,-.2,.22,.18);c.fillRect(1.2,.15,.18,.16);
   c.fillStyle='#202624';c.fillRect(-.6,-.42,.12,.3);c.fillRect(-.6,.12,.12,.3);
  }else{
   c.fillStyle=bin.color[1];c.fillRect(-.48,-.44,.96,.88);
   c.fillStyle=bin.color[0];c.fillRect(-.42,-.4,.84,.8);
   c.fillStyle='#ffffff22';c.fillRect(-.42,-.4,.84,.18);
   c.fillStyle='#1e2422';c.fillRect(.42,-.36,.12,.72);
  }
  c.restore();
 }
}
