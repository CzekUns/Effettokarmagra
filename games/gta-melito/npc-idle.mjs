/* Vita di quartiere: figure ferme, derivate da POI/edifici OSM, banchi e panchine già collocate.
 * Sono solo grafica: non entrano nell'indice collisioni, nelle routine o nel traffico. */
import {PEDESTRIAN_KIND_COUNT} from './extra-pedestrian-sprites.mjs?v=007';

const CAFE_KINDS=new Set(['bar','cafe','fast_food','restaurant']);
const FOOT_ROADS=new Set(['pedestrian','footway','path','steps']);
const hash=n=>{let x=n|0;x=Math.imul(x^x>>>16,2246822519);x=Math.imul(x^x>>>13,3266489917);return (x^x>>>16)>>>0;};
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);

export function idleDensityAt(minutes){
 const hour=((Math.floor(minutes/60)%24)+24)%24;
 if(hour<6)return 1;
 if(hour<10)return 10;
 if(hour<14)return 36;
 if(hour<17)return 18;
 if(hour<22)return 38;
 return 3;
}

/* Ogni candidato nasce dalla proiezione di un elemento reale del modello sulla rete pedonale.
 * I due lati e alcuni spostamenti lungo il marciapiede servono a lasciare liberi gli ingressi. */
function nearFootway(anchor,graph,count,valid){
 const options=[];
 for(const id of graph?.walkStarts||[]){
  const e=graph.edges[id],a=graph.nodes[e.from],b=graph.nodes[e.to];
  if(!a||!b||e.len<7)continue;
  const ux=(b.x-a.x)/e.len,uy=(b.y-a.y)/e.len;
  const t=clamp(((anchor.x-a.x)*ux+(anchor.y-a.y)*uy)/e.len,.12,.88);
  const x=a.x+ux*t*e.len,y=a.y+uy*t*e.len,d=Math.hypot(x-anchor.x,y-anchor.y);
  if(d<=42)options.push({e,x,y,ux,uy,d});
 }
 options.sort((a,b)=>a.d-b.d);
 for(const edge of options.slice(0,12)){
  const sides=[1,-1].sort((a,b)=>{
   const nx=-edge.uy,ny=edge.ux;
   return distance(anchor,{x:edge.x+nx*a,y:edge.y+ny*a})-distance(anchor,{x:edge.x+nx*b,y:edge.y+ny*b});
  });
  for(const side of sides)for(const shift of [-7,7,0,-11,11]){
   const offset=FOOT_ROADS.has(edge.e.roadType)?1.7:edge.e.streetWidth/2+4.2;
   const cx=edge.x+edge.ux*shift-edge.uy*side*offset;
   const cy=edge.y+edge.uy*shift+edge.ux*side*offset;
   const points=Array.from({length:count},(_,i)=>({
    x:cx+edge.ux*(i-(count-1)/2)*2.1,
    y:cy+edge.uy*(i-(count-1)/2)*2.1
   }));
   if(points.every(valid))return points;
  }
 }
 return null;
}

export function createIdlePeople({map,graph,props=[],market=null,doors=[],canStand=()=>true,onRoad=()=>false,
 kindCount=PEDESTRIAN_KIND_COUNT}={}){
 const spots=[],taken=[];
 const valid=q=>Number.isFinite(q.x)&&Number.isFinite(q.y)&&canStand(q.x,q.y)&&!onRoad(q.x,q.y)&&
  doors.every(d=>distance(q,d)>4)&&taken.every(p=>distance(q,p)>1.7);
 const add=(points,activity,source,anchor,elder=false)=>{
  if(!points||spots.length+points.length>40||!points.every(valid))return false;
  const group=spots.length;
  for(const [i,p] of points.entries()){
   const kind=elder?[19,20][i%2]:hash(group*173+i*41+source.length)%kindCount;
   const toward=points[(i+1)%points.length]||anchor;
   const a=activity==='bench'?Math.PI/2:Math.atan2(toward.y-p.y,toward.x-p.x);
   spots.push({id:`${activity}-${group}-${i}`,activity,source,group,x:p.x,y:p.y,homeX:p.x,homeY:p.y,
    a,prevX:p.x,prevY:p.y,prevA:a,kind,body:'walk',braking:true,speed:0,seed:hash(group*37+i),
    lookSeconds:3+hash(group*91+i)%300/100,anchor});
   taken.push(p);
  }
  return true;
 };
 const fromAnchor=(anchor,count,activity,source,elder=false)=>add(nearFootway(anchor,graph,count,valid),activity,source,anchor,elder);

 // POI delle attività: una coppia o un trio per luogo, senza coordinate inventate.
 for(const [i,poi] of (map?.pois||[]).filter(p=>CAFE_KINDS.has(p.k)).slice(0,8).entries())
  fromAnchor({x:poi.p[0],y:poi.p[1]},i%3===0?3:2,'chat',`poi:${poi.n||poi.k}`);
 const townhall=(map?.pois||[]).find(p=>p.k==='townhall');
 if(townhall)fromAnchor({x:townhall.p[0],y:townhall.p[1]},2,'civic',`poi:${townhall.n}`,true);
 for(const church of (map?.buildings||[]).filter(b=>b.usage==='place_of_worship').slice(0,2)){
  const xs=church.p.filter((_,i)=>i%2===0),ys=church.p.filter((_,i)=>i%2===1);
  fromAnchor({x:xs.reduce((a,v)=>a+v,0)/xs.length,y:ys.reduce((a,v)=>a+v,0)/ys.length},2,'church',`osm:${church.id}`);
 }
 // Il mercato è posizionato dal gioco a partire dalle vie OSM: niente banco dentro la carreggiata.
 for(const stall of (market?.stalls||[]).filter((_,i)=>i%3===0).slice(0,3))
  fromAnchor({x:stall.x,y:stall.y},2,'market',`stall:${stall.id}`);
 // Le panchine esistenti (kind 7–8) sono derivate dalle vie OSM dal renderer.
 const benches=props.filter(p=>p.kind===7||p.kind===8).sort((a,b)=>hash(a.roadId)-hash(b.roadId));
 let used=0;
 for(const bench of benches){
  if(used>=6||spots.length>=40)break;
  const ux=Math.cos(bench.a),uy=Math.sin(bench.a);
  const count=used%3===0?2:1;
  const points=Array.from({length:count},(_,i)=>({x:bench.x+ux*(i-(count-1)/2)*2,y:bench.y+uy*(i-(count-1)/2)*2}));
  if(add(points,'bench',`road:${bench.roadId}`,{x:bench.x,y:bench.y}))used++;
 }
 return {spots,active:[],seconds:0};
}

export function stepIdlePeople(idle,dt,{minutes,player,canStand=()=>true,onRoad=()=>false,doors=[]}={}){
 if(!idle)return [];
 idle.seconds+=dt;
 idle.active=idle.spots.slice(0,idleDensityAt(minutes));
 for(const p of idle.active){
  p.prevX=p.x;p.prevY=p.y;p.prevA=p.a;
  if(p.activity!=='bench'&&(p.lookSeconds-=dt)<=0){
   p.lookSeconds=3+hash(p.seed+Math.floor(idle.seconds))%300/100;
   const other=idle.spots.find(q=>q.group===p.group&&q!==p);
   if(other)p.a=Math.atan2(other.y-p.y,other.x-p.x)+(hash(p.seed+Math.floor(idle.seconds)*3)%3-1)*.25;
  }
  let tx=p.homeX,ty=p.homeY;
  if(player&&Math.hypot(player.x-p.x,player.y-p.y)<2.6){
   const angle=Math.atan2(p.y-player.y,p.x-player.x)||p.a;
   const x=p.homeX+Math.cos(angle)*2.3,y=p.homeY+Math.sin(angle)*2.3;
   if(canStand(x,y)&&!onRoad(x,y)&&doors.every(d=>Math.hypot(x-d.x,y-d.y)>4)){tx=x;ty=y;}
  }
  const travel=Math.hypot(tx-p.x,ty-p.y),step=Math.min(travel,Math.max(0,dt)*3);
  if(travel>1e-5){p.x+=(tx-p.x)/travel*step;p.y+=(ty-p.y)/travel*step;}
  p.braking=travel<.03;
 }
 return idle.active;
}
