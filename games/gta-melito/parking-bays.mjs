/* GTA Melito — BF02: fascia di sosta tra corsia e marciapiede.
 * Le baie sono ricavate nel sistema di coordinate del gioco dalle larghezze visive delle strade
 * (road-widths.mjs) sopra il grafo OSM: nessuna sagoma, ID, POI o distanza della cartografia
 * cambia. Uno stallo esiste solo dove c'è spazio reale: fuori dalla sagoma spazzata delle corsie,
 * prima della linea dei pedoni, lontano da incroci e strisce, edifici, negozi e banca.
 * Dove lo spazio non c'è (strade di servizio, vicoli) non c'è sosta. */
import {roadTrafficLaneOffset} from './road-widths.mjs?v=044';
import {vs,ps} from './world-scale.mjs?v=001';

export const BAY_RULES=Object.freeze({
 halfWidth:vs(1.7),halfLength:vs(3.15), // sagoma di collisione dell'auto (traffic-collision.mjs), BF14 in scala
 // BF14: mezza larghezza dell'auto COME DISEGNATA (Panda 5,5 in scala). Corsie e stalli si tengono
 // distanti con le sagome disegnate, così né le auto in sosta né le linee bianche coprono il traffico.
 drawnHalf:vs(2.75),
 laneGap:.25,         // tra l'auto in marcia disegnata e quella in sosta disegnata
 pedestrianGap:ps(.45),// dalla linea dei pedoni: larghezza/2 + 1,7
 kerbInset:.15,       // dove c'è posto l'auto resta tutta sull'asfalto
 stall:vs(7.2),       // lunghezza di uno stallo (auto 6,3 m, furgone 6,7 m, in scala)
 junctionClear:12,    // dagli incroci (svolte): distanza della sagoma dal nodo
 crosswalkClear:1,    // dalle strisce pedonali disegnate
 bendClear:6,         // dai vertici dove la strada piega di più di ~35°
 bendAngle:.6,
 endClear:.5,
 tolerance:.02
});
const PEDESTRIAN_LINE=1.7;// i pedoni camminano a larghezza/2 + 1,7 (roads.mjs)
const FOOT=new Set(['pedestrian','footway','path','steps']);
const CELL=48;

/* Distanza dell'asse dello stallo dal centro strada, o null se tra corsia e pedoni non c'è posto. */
export function bayOffset(streetWidth){
 const r=BAY_RULES,w=Number(streetWidth);
 if(!(w>0))return null;
 // BF14: auto in marcia e auto in sosta misurate come sono disegnate (prima: sagome di collisione).
 const min=roadTrafficLaneOffset(w)+r.drawnHalf+r.laneGap+r.drawnHalf;
 const max=w/2+PEDESTRIAN_LINE-r.pedestrianGap-r.halfWidth;
 if(min>max+1e-9)return null;
 return Math.min(max,Math.max(min,w/2-r.halfWidth-r.kerbInset));
}

const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
function segPoint(px,py,ax,ay,bx,by){
 const dx=bx-ax,dy=by-ay,l=dx*dx+dy*dy,t=l?Math.max(0,Math.min(1,((px-ax)*dx+(py-ay)*dy)/l)):0;
 return Math.hypot(px-ax-dx*t,py-ay-dy*t);
}
function cross(ax,ay,bx,by,cx,cy,dx,dy){
 const o=(px,py,qx,qy,rx,ry)=>Math.sign((qx-px)*(ry-py)-(qy-py)*(rx-px));
 return o(ax,ay,bx,by,cx,cy)!==o(ax,ay,bx,by,dx,dy)&&o(cx,cy,dx,dy,ax,ay)!==o(cx,cy,dx,dy,bx,by);
}
// Rettangolo della sagoma (4 vertici) per una posa.
export function bayRect(pose,halfLength=BAY_RULES.halfLength,halfWidth=BAY_RULES.halfWidth){
 const c=Math.cos(pose.a),s=Math.sin(pose.a),out=[];
 for(const [f,l] of [[halfLength,halfWidth],[-halfLength,halfWidth],[-halfLength,-halfWidth],[halfLength,-halfWidth]])
  out.push([pose.x+c*f-s*l,pose.y+s*f+c*l]);
 return out;
}
function insideRect(rect,x,y){
 let sign=0;
 for(let i=0;i<4;i++){
  const [ax,ay]=rect[i],[bx,by]=rect[(i+1)%4],k=Math.sign((bx-ax)*(y-ay)-(by-ay)*(x-ax));
  if(k===0)continue;if(sign===0)sign=k;else if(k!==sign)return false;
 }
 return true;
}
function rectSegment(rect,ax,ay,bx,by){
 if(insideRect(rect,ax,ay)||insideRect(rect,bx,by))return 0;
 let best=Infinity;
 for(let i=0;i<4;i++){
  const [px,py]=rect[i],[qx,qy]=rect[(i+1)%4];
  if(cross(px,py,qx,qy,ax,ay,bx,by))return 0;
  best=Math.min(best,segPoint(px,py,ax,ay,bx,by),segPoint(ax,ay,px,py,qx,qy),segPoint(bx,by,px,py,qx,qy));
 }
 return best;
}
function rectPoint(rect,x,y){
 if(insideRect(rect,x,y))return 0;
 let best=Infinity;
 for(let i=0;i<4;i++){const [px,py]=rect[i],[qx,qy]=rect[(i+1)%4];best=Math.min(best,segPoint(x,y,px,py,qx,qy));}
 return best;
}

/* Le strade come le vedono corsie e pedoni: un tratto fisico per ogni coppia di nodi. */
function physicalSegments(graph){
 const segments=[],byKey=new Map();
 graph.edges.forEach((e,id)=>{
  const k=Math.min(e.from,e.to)+'-'+Math.max(e.from,e.to);
  let s=byKey.get(k);
  if(!s){
   const a=graph.nodes[e.from],b=graph.nodes[e.to];
   s={key:k,edge:id,from:e.from,to:e.to,ax:a.x,ay:a.y,bx:b.x,by:b.y,angle:e.angle,len:e.len,
    width:e.streetWidth,roadId:e.roadId,roadType:e.roadType,name:e.name,forward:false,backward:false,walk:false};
   byKey.set(k,s);segments.push(s);
  }
  if(e.car){if(e.from===s.from)s.forward=true;else s.backward=true;}
  if(e.walk)s.walk=true;
 });
 // Nelle pieghe i pedoni girano attorno al vertice: la corda tra le due linee dei pedoni sta
 // sempre dal lato della strada rispetto al loro arco, quindi è un controllo prudente.
 const around=graph.nodes.map(()=>[]);
 for(const s of segments)if((s.forward||s.backward)&&s.walk){around[s.from].push(s);around[s.to].push(s);}
 around.forEach((list,v)=>{
  if(list.length!==2)return;
  const n=graph.nodes[v],dir=(s,out)=>(s.from===v)===out?s.angle:wrap(s.angle+Math.PI);
  const [a,b]=list,da=dir(a,false),db=dir(b,true),oa=a.width/2+PEDESTRIAN_LINE,ob=b.width/2+PEDESTRIAN_LINE;
  for(const side of [1,-1]){
   const c={chord:true,walk:true,roadType:'footway',ax:n.x-Math.sin(da)*oa*side,ay:n.y+Math.cos(da)*oa*side,
    bx:n.x-Math.sin(db)*ob*side,by:n.y+Math.cos(db)*ob*side,width:0};
   if(Math.hypot(c.bx-c.ax,c.by-c.ay)>.05)segments.push(c);
  }
 });
 const grid=new Map();
 segments.forEach((s,i)=>{
  const pad=s.width/2+10;
  for(let gx=Math.floor((Math.min(s.ax,s.bx)-pad)/CELL);gx<=Math.floor((Math.max(s.ax,s.bx)+pad)/CELL);gx++)
   for(let gy=Math.floor((Math.min(s.ay,s.by)-pad)/CELL);gy<=Math.floor((Math.max(s.ay,s.by)+pad)/CELL);gy++){
    const k=gx+','+gy;if(!grid.has(k))grid.set(k,[]);grid.get(k).push(i);
   }
 });
 return {segments,grid,byKey};
}
function nearSegments(net,x,y){
 const out=new Set();
 for(let gx=Math.floor(x/CELL)-1;gx<=Math.floor(x/CELL)+1;gx++)
  for(let gy=Math.floor(y/CELL)-1;gy<=Math.floor(y/CELL)+1;gy++)
   for(const i of net.grid.get(gx+','+gy)||[])out.add(net.segments[i]);
 return out;
}
function nodeKinds(graph,net){
 // Incrocio = almeno tre strade carrabili distinte; piega = due tratti che cambiano direzione.
 const around=graph.nodes.map(()=>[]);
 for(const s of net.segments){if(s.chord||!(s.forward||s.backward))continue;around[s.from].push(s);around[s.to].push(s);}
 return around.map((list,i)=>{
  if(list.length>=3)return 'junction';
  if(list.length===2){
   const dir=s=>s.from===i?s.angle:wrap(s.angle+Math.PI);
   const turn=Math.abs(wrap(dir(list[0])-dir(list[1])+Math.PI));
   return turn>BAY_RULES.bendAngle?'bend':'straight';
  }
  return list.length===1?'end':'none';
 });
}

/* Le strisce pedonali come le disegna drawCrosswalks (visuals.mjs): fino a quattro per incrocio
 * vero, a min(8, 45% del tratto) dal nodo, cinque strisce larghe quanto la carreggiata. */
function crosswalkRects(graph){
 const out=[];
 for(const node of graph.nodes){
  const cars=node.out.filter(id=>graph.edges[id].car);
  if(cars.length<3||new Set(cars.map(id=>Math.round(graph.edges[id].angle*20))).size<3)continue;
  for(let j=0;j<Math.min(4,cars.length);j++){
   const e=graph.edges[cars[j]];if(e.len<9)continue;
   const d=Math.min(8,e.len*.45)+.35,width=Math.max(4,Math.min(21,e.streetWidth-1.4));
   const pose={x:node.x+Math.cos(e.angle)*d,y:node.y+Math.sin(e.angle)*d,a:e.angle};
   out.push({x:pose.x,y:pose.y,rect:bayRect(pose,3.35,width/2)});
  }
 }
 return out;
}
/* Controllo di una sagoma contro le regole della fascia: corsie, pedoni, incroci, punti da
 * lasciare liberi. `own` è il tratto su cui è stata costruita (già rispettato per costruzione). */
function poseConflict(bays,pose,{halfLength=BAY_RULES.halfLength,halfWidth=BAY_RULES.halfWidth,own=null}={}){
 const r=BAY_RULES,rect=bayRect(pose,halfLength,halfWidth),tol=r.tolerance;
 // BF14: verso le corsie conta il corpo disegnato (più largo della sagoma), anche in curva e agli incroci.
 const drawn=bayRect(pose,Math.max(halfLength,r.stall/2),Math.max(halfWidth,r.drawnHalf*halfWidth/r.halfWidth)+.05);// the painted stall
 for(const s of nearSegments(bays.net,pose.x,pose.y)){
  if(s.forward||s.backward){
   if(s!==own&&rectSegment(drawn,s.ax,s.ay,s.bx,s.by)<roadTrafficLaneOffset(s.width)+r.drawnHalf+r.laneGap-tol)return 'corsia';
   if(s===own)continue;
  }
  if(!s.walk)continue;
  if(FOOT.has(s.roadType)){
   if(rectSegment(rect,s.ax,s.ay,s.bx,s.by)<r.pedestrianGap-tol)return 'pedoni';
   continue;
  }
  const off=s.width/2+PEDESTRIAN_LINE,nx=-Math.sin(s.angle),ny=Math.cos(s.angle);
  for(const side of [1,-1])
   if(rectSegment(rect,s.ax+nx*off*side,s.ay+ny*off*side,s.bx+nx*off*side,s.by+ny*off*side)<r.pedestrianGap-tol)return 'pedoni';
 }
 for(const n of bays.junctions)
  if(Math.abs(n.x-pose.x)<40&&Math.abs(n.y-pose.y)<40&&rectPoint(rect,n.x,n.y)<r.junctionClear)return 'incrocio';
 for(const z of bays.crosswalks){
  if(Math.abs(z.x-pose.x)>30||Math.abs(z.y-pose.y)>30)continue;
  for(let i=0;i<4;i++){
   const [ax,ay]=z.rect[i],[bx,by]=z.rect[(i+1)%4];
   if(rectSegment(rect,ax,ay,bx,by)<r.crosswalkClear)return 'incrocio';
  }
  if(insideRect(z.rect,pose.x,pose.y))return 'incrocio';
 }
 for(const q of bays.keepClear)
  if(Math.abs(q.x-pose.x)<q.r+8&&Math.abs(q.y-pose.y)<q.r+8&&rectPoint(rect,q.x,q.y)<q.r)return q.why||'ingresso';
 return null;
}

/* Costruisce tutti gli stalli. blocked(pose) = muri, bordo mappa, area non carrabile (dal gioco);
 * keepClear = [{x,y,r,why}] ingressi da lasciare liberi (negozi, banca, porte). Deterministico. */
export function buildParkingBays(graph,{blocked=()=>false,keepClear=[]}={}){
 const r=BAY_RULES,net=physicalSegments(graph),kinds=nodeKinds(graph,net);
 const bays={net,stalls:[],strips:[],keepClear,junctions:graph.nodes.filter((n,i)=>kinds[i]==='junction'),crosswalks:crosswalkRects(graph),
  rejected:{corsia:0,pedoni:0,incrocio:0,ingresso:0,muro:0}};
 const clear=i=>kinds[i]==='bend'?r.bendClear:r.endClear;
 for(const s of net.segments){
  if(s.chord||!(s.forward||s.backward))continue;
  const c=bayOffset(s.width);if(c==null)continue;
  const start=clear(s.from),end=s.len-clear(s.to),n=Math.floor((end-start)/r.stall);
  if(n<1)continue;
  const s0=start+(end-start-n*r.stall)/2,ux=(s.bx-s.ax)/s.len,uy=(s.by-s.ay)/s.len,nx=-uy,ny=ux;
  for(const side of [1,-1]){
   // Si parcheggia nel verso della corsia accanto (nei sensi unici, nel verso unico).
   const along=side>0?(s.forward||!s.backward):(!s.backward&&s.forward);
   const a=along?s.angle:wrap(s.angle+Math.PI);
   let strip=null;
   for(let i=0;i<n;i++){
    const d=s0+(i+.5)*r.stall,pose={x:s.ax+ux*d+nx*c*side,y:s.ay+uy*d+ny*c*side,a};
    const why=poseConflict(bays,pose,{own:s})||(blocked(pose)?'muro':null);
    if(why){bays.rejected[why]=(bays.rejected[why]||0)+1;strip=null;continue;}
    if(!strip){
     strip={segment:s.key,roadId:s.roadId,name:s.name,width:s.width,offset:c,side,angle:s.angle,
      ax:s.ax,ay:s.ay,ux,uy,from:d-r.stall/2,to:d+r.stall/2,stalls:[]};
     bays.strips.push(strip);
    }
    strip.to=d+r.stall/2;
    const stall={x:pose.x,y:pose.y,a,side,offset:c,segment:s.key,edge:s.edge,roadId:s.roadId,
     along:d,index:bays.stalls.length,strip:bays.strips.length-1};
    strip.stalls.push(stall);bays.stalls.push(stall);
   }
  }
 }
 for(const strip of bays.strips){
  // Contorno della fascia per indice spaziale e disegno: da corsia+margine al bordo esterno dell'auto.
  // BF14: la fascia (e le sue linee) è larga quanto l'auto disegnata, mai sulla corsia accanto.
 const inner=strip.offset-r.drawnHalf-.05,outer=strip.offset+r.drawnHalf+.05,nx=-strip.uy,ny=strip.ux;
  const at=(d,o)=>[strip.ax+strip.ux*d+nx*o*strip.side,strip.ay+strip.uy*d+ny*o*strip.side];
  strip.inner=inner;strip.outer=outer;
  strip.p=[...at(strip.from,inner),...at(strip.to,inner),...at(strip.to,outer),...at(strip.from,outer)];
 }
 return bays;
}

/* Un punto dentro una fascia (con margine): niente bidoni o paletti negli stalli. */
export function insideParkingStrip(strip,x,y,margin=0){
 const dx=x-strip.ax,dy=y-strip.ay,d=dx*strip.ux+dy*strip.uy,o=(-dx*strip.uy+dy*strip.ux)*strip.side;
 return d>=strip.from-margin&&d<=strip.to+margin&&o>=strip.inner-margin&&o<=strip.outer+margin;
}
/* Una sagoma qualsiasi (per esempio un food truck) sta nella fascia senza invadere corsie,
 * linea dei pedoni, incroci o ingressi. */
export function fitsParkingBay(bays,pose,shape={}){
 if(!bays)return false;
 return !poseConflict(bays,pose,{halfLength:shape.halfLength,halfWidth:shape.halfWidth});
}
export function stallTaken(stall,vehicles,overlap){
 const pose={x:stall.x,y:stall.y,a:stall.a,body:'car'};
 return vehicles.some(v=>v&&overlap(pose,v));
}
/* Stalli liberi più vicini a un punto, dal più vicino. */
export function nearestFreeStalls(bays,x,y,vehicles,overlap,{radius=Infinity,roadId=null,limit=1}={}){
 const out=[];
 for(const stall of bays?.stalls||[]){
  if(roadId!=null&&stall.roadId!==roadId)continue;
  const d=Math.hypot(stall.x-x,stall.y-y);
  if(d<=radius)out.push({stall,d});
 }
 out.sort((p,q)=>p.d-q.d||p.stall.index-q.stall.index);
 const free=[];
 for(const {stall} of out){if(!stallTaken(stall,vehicles,overlap))free.push(stall);if(free.length>=limit)break;}
 return free;
}
/* Un veicolo in sosta nella sua baia: i pedoni possono passargli accanto a BAY_PEDESTRIAN_PAD. */
export function parkInStall(vehicle,stall){
 return Object.assign(vehicle,{x:stall.x,y:stall.y,a:stall.a,speed:0,parkingBay:{x:stall.x,y:stall.y,index:stall.index}});
}

/* Disegno nel livello statico, sotto i tetti: asfalto della baia, cordolo dove la baia entra nel
 * bordo del marciapiede, linee bianche degli stalli (sosta libera). */
export function drawParkingBays(c,strips,zoom){
 if(!strips?.length)return;
 c.save();c.lineJoin='miter';
 for(const strip of strips){
  const nx=-strip.uy,ny=strip.ux,at=(d,o)=>[strip.ax+strip.ux*d+nx*o*strip.side,strip.ay+strip.uy*d+ny*o*strip.side];
  const kerb=strip.width/2,cut=strip.outer>kerb-.25,taper=cut?Math.min(2.2,strip.outer-kerb+1):0;
  const pts=cut?[at(strip.from-taper,kerb),at(strip.from,strip.outer),at(strip.to,strip.outer),at(strip.to+taper,kerb),
   at(strip.to,strip.inner),at(strip.from,strip.inner)]:[at(strip.from,strip.inner),at(strip.from,strip.outer),at(strip.to,strip.outer),at(strip.to,strip.inner)];
  c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();
  c.fillStyle='#383e3f';c.fill();
  if(cut){
   // cordolo chiaro che segue il golfo di sosta
   c.beginPath();for(let i=0;i<4;i++){const [x,y]=pts[i];i?c.lineTo(x,y):c.moveTo(x,y);}
   c.lineWidth=.45;c.strokeStyle='#f3dcb2';c.stroke();
   c.lineWidth=.16;c.strokeStyle='#8f7a5c';c.stroke();
  }
  if(zoom<1.1)continue;
  c.strokeStyle='#ece6d4e6';c.lineWidth=.3;c.beginPath();
  const [ix0,iy0]=at(strip.from,strip.inner+.12),[ix1,iy1]=at(strip.to,strip.inner+.12);
  c.moveTo(ix0,iy0);c.lineTo(ix1,iy1);
  for(let k=0;k<=strip.stalls.length;k++){
   const d=strip.from+k*BAY_RULES.stall,[px,py]=at(d,strip.inner+.12),[qx,qy]=at(d,strip.outer-.25);
   c.moveTo(px,py);c.lineTo(qx,qy);
  }
  c.stroke();
 }
 c.restore();
}
