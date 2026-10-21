/* GTA Melito — BF12: recinti con mura, cancelli e guardiole.
 * Sources: data/enclosures.json (OSM perimeters and gates where they exist, otherwise the city block
 * around a seed point, marked `stimato`). The walls are NEW scenery: they follow the OSM line where
 * there is one, but never stand on the (arcade-wide) street and its pavement; they are placed just
 * beyond the painted pavement. No OSM building polygon is touched, no street is closed: every road
 * or footway that crosses a perimeter gets an opening (a gate).
 * Gates: pedestrians always pass. Vehicle gates of PRIVATE compounds have a barrier that is down at
 * night (22–6) for the player; it rises for NPC vehicles (residents with a remote) and stays up
 * while one is close. A guard (placeholder: vigile sprite) stands at the booth of the main gate. */
import {drawProfessionSprite} from './profession-sprites.mjs?v=003';

export const ENCLOSURE_RULES=Object.freeze({
 margin:1,           // beyond the painted pavement (SIDEWALK_OUTER) before the wall starts
 wallHalf:.75,       // half thickness of the wall (collision; arcade scale like the streets)
 walkerRadius:.45,   // pedestrian body
 sample:.5,          // collision points along the walls
 simplify:1,         // Douglas-Peucker tolerance of the outline (grid steps become straight lines)
 openingExtra:6,     // an opening is the road width + both footpaths
 osmGateWidth:3.2,   // a pedestrian gate from an OSM barrier=gate without a road through it
 gapGateWidth:7,     // a vehicle gate from a gap between two OSM walls
 nightFrom:22*60,nightTo:6*60,
 barrierOpenDistance:11,
 wallHeight:4,
 maxRegion:90000     // cells: an estimated block larger than this is a leak, not an enclosure
});
const R=ENCLOSURE_RULES;
// Streets that bound a block: the public carriageways. Service roads, footways and paths can be the
// inside of a compound (driveways, park paths) and get a gate where they cross the perimeter.
const BOUNDING=new Set(['motorway','trunk','primary','secondary','tertiary','unclassified','residential','living_street',
 'motorway_link','trunk_link','primary_link','secondary_link','tertiary_link']);
const DRIVABLE=new Set([...BOUNDING,'service','track']);
// Named footways and service roads are public streets too (Via Budapest, Via Malta…): they bound.
const bounds=road=>BOUNDING.has(road.t)||!!road.n;

export function isNight(minutes){
 const m=((Number(minutes)||0)%1440+1440)%1440;
 return m>=R.nightFrom||m<R.nightTo;
}
function insidePoly(x,y,ring){
 let yes=false;
 for(let i=0,j=ring.length-1;i<ring.length;j=i++){
  const a=ring[i],b=ring[j];
  if(((a[1]>y)!==(b[1]>y))&&(x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0]))yes=!yes;
 }
 return yes;
}
function segDist(px,py,ax,ay,bx,by){
 const dx=bx-ax,dy=by-ay,l=dx*dx+dy*dy;let t=l?((px-ax)*dx+(py-ay)*dy)/l:0;
 t=Math.max(0,Math.min(1,t));return Math.hypot(px-ax-t*dx,py-ay-t*dy);
}
function crossing(a,b,c,d){
 const rx=b[0]-a[0],ry=b[1]-a[1],sx=d[0]-c[0],sy=d[1]-c[1],den=rx*sy-ry*sx;
 if(Math.abs(den)<1e-9)return null;
 const qx=c[0]-a[0],qy=c[1]-a[1],t=(qx*sy-qy*sx)/den,u=(qx*ry-qy*rx)/den;
 return t>=0&&t<=1&&u>=0&&u<=1?{t,u,x:a[0]+rx*t,y:a[1]+ry*t}:null;
}
function simplifyOpen(points,tol){
 if(points.length<3)return points.slice();
 const keep=new Uint8Array(points.length);keep[0]=keep[points.length-1]=1;
 const stack=[[0,points.length-1]];
 while(stack.length){
  const [s,e]=stack.pop();let best=-1,far=tol;
  for(let i=s+1;i<e;i++){const d=segDist(points[i][0],points[i][1],points[s][0],points[s][1],points[e][0],points[e][1]);if(d>far){far=d;best=i;}}
  if(best>=0){keep[best]=1;stack.push([s,best],[best,e]);}
 }
 return points.filter((_,i)=>keep[i]);
}
function simplifyLoop(loop,tol){
 // split the closed loop at the vertex farthest from the first one, simplify both halves
 let far=0,k=0;for(let i=1;i<loop.length;i++){const d=Math.hypot(loop[i][0]-loop[0][0],loop[i][1]-loop[0][1]);if(d>far){far=d;k=i;}}
 const a=simplifyOpen(loop.slice(0,k+1),tol),b=simplifyOpen([...loop.slice(k),loop[0]],tol);
 return [...a,...b.slice(1,-1)];
}
/* The outline of a set of grid cells (1 cell = 1 unit) with the region on the LEFT of the walk. */
function outline(mask,w,h,x0,y0){
 const edges=new Map(),key=(x,y)=>x+','+y;
 const at=(i,j)=>i>=0&&j>=0&&i<w&&j<h&&mask[j*w+i];
 const add=(ax,ay,bx,by)=>{const k=key(ax,ay);(edges.get(k)||edges.set(k,[]).get(k)).push([bx,by]);};
 for(let j=0;j<h;j++)for(let i=0;i<w;i++){
  if(!mask[j*w+i])continue;
  // y grows downwards: walking with the cell on the left means counter-clockwise on screen
  if(!at(i,j-1))add(i+1,j,i,j);
  if(!at(i-1,j))add(i,j,i,j+1);
  if(!at(i,j+1))add(i,j+1,i+1,j+1);
  if(!at(i+1,j))add(i+1,j+1,i+1,j);
 }
 const loops=[];
 for(const [start,list] of edges){
  while(list.length){
   const loop=[];let [cx,cy]=start.split(',').map(Number),next=list.pop();
   loop.push([cx,cy]);
   for(let guard=0;next&&guard<1e6;guard++){
    [cx,cy]=next;if(key(cx,cy)===start)break;
    loop.push([cx,cy]);
    const out=edges.get(key(cx,cy));next=out&&out.length?out.pop():null;
   }
   if(loop.length>=4)loops.push(loop.map(([x,y])=>[x0+x,y0+y]));
  }
 }
 const perim=l=>l.reduce((s,p,i)=>s+Math.hypot(p[0]-l[(i+1)%l.length][0],p[1]-l[(i+1)%l.length][1]),0);
 return loops.sort((a,b)=>perim(b)-perim(a))[0]||null;
}
/* Cells covered by the bounding streets (asphalt + painted pavement + margin). */
function streetMask(roads,roadWidth,sidewalkOuter,x0,y0,w,h){
 const mask=new Uint8Array(w*h);
 for(const road of roads){
  if(!bounds(road))continue;
  const r=roadWidth(road)/2+sidewalkOuter+R.margin,p=road.p;
  for(let k=2;k<p.length;k+=2){
   const ax=p[k-2]-x0,ay=p[k-1]-y0,bx=p[k]-x0,by=p[k+1]-y0;
   const i0=Math.max(0,Math.floor(Math.min(ax,bx)-r)),i1=Math.min(w-1,Math.ceil(Math.max(ax,bx)+r));
   const j0=Math.max(0,Math.floor(Math.min(ay,by)-r)),j1=Math.min(h-1,Math.ceil(Math.max(ay,by)+r));
   for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++)if(segDist(i+.5,j+.5,ax,ay,bx,by)<r)mask[j*w+i]=1;
  }
 }
 return mask;
}
/* One enclosure: its wall loop, from the OSM perimeter or the block around the seed. */
export function enclosureOutline(item,{roads,roadWidth,sidewalkOuter,inBorder=()=>true}){
 const per=item.perimetro||{};
 let bx0,by0,bx1,by1;
 const traced=per.tipo==='osm'||per.tipo==='ricalco';
 if(traced){
  const xs=per.punti.map(p=>p[0]),ys=per.punti.map(p=>p[1]);
  bx0=Math.min(...xs)-4;by0=Math.min(...ys)-4;bx1=Math.max(...xs)+4;by1=Math.max(...ys)+4;
 }else if(per.tipo==='stimato-isolato'){
  const [sx,sy]=per.seme,rad=per.raggio||160;bx0=sx-rad;by0=sy-rad;bx1=sx+rad;by1=sy+rad;
 }else return {ok:false,reason:'perimetro non disponibile'};
 const x0=Math.floor(bx0),y0=Math.floor(by0),w=Math.ceil(bx1)-x0,h=Math.ceil(by1)-y0;
 const near=roads.filter(r=>{const p=r.p;for(let k=0;k<p.length;k+=2)if(p[k]>x0-40&&p[k]<x0+w+40&&p[k+1]>y0-40&&p[k+1]<y0+h+40)return true;return false;});
 const streets=streetMask(near,roadWidth,sidewalkOuter,x0,y0,w,h),mask=new Uint8Array(w*h);
 // the municipal border only matters for an enclosure that reaches it (most are well inside)
 const allIn=[[x0,y0],[x0+w,y0],[x0,y0+h],[x0+w,y0+h]].every(([x,y])=>inBorder(x,y));
 const free=(i,j)=>!streets[j*w+i]&&(allIn||inBorder(x0+i+.5,y0+j+.5));
 let cells=0;
 if(traced){
  for(let j=0;j<h;j++)for(let i=0;i<w;i++)if(free(i,j)&&insidePoly(x0+i+.5,y0+j+.5,per.punti)){mask[j*w+i]=1;cells++;}
 }else{
  let si=Math.floor(per.seme[0]-x0),sj=Math.floor(per.seme[1]-y0);
  if(!free(si,sj)){ // the seed fell on a pavement: nearest free cell
   let best=null;for(let r=1;r<14&&!best;r++)for(let dj=-r;dj<=r&&!best;dj++)for(let di=-r;di<=r;di++){const i=si+di,j=sj+dj;if(i>=0&&j>=0&&i<w&&j<h&&free(i,j)){best=[i,j];break;}}
   if(!best)return {ok:false,reason:'seme sulla strada'};[si,sj]=best;
  }
  const queue=[sj*w+si];mask[queue[0]]=1;cells=1;
  for(let q=0;q<queue.length;q++){
   const c=queue[q],i=c%w,j=(c-i)/w;
   if(i===0||j===0||i===w-1||j===h-1)return {ok:false,reason:'isolato non chiuso dalle strade (perdita)'};
   for(const [di,dj] of [[1,0],[-1,0],[0,1],[0,-1]]){
    const n=(j+dj)*w+i+di;if(mask[n]||!free(i+di,j+dj))continue;
    mask[n]=1;queue.push(n);if(++cells>R.maxRegion)return {ok:false,reason:'isolato troppo grande'};
   }
  }
 }
 if(cells<40)return {ok:false,reason:'area libera troppo piccola'};
 const loop=outline(mask,w,h,x0,y0);
 if(!loop)return {ok:false,reason:'contorno non trovato'};
 return {ok:true,loop:simplifyLoop(loop,R.simplify),cells,near};
}
function loopLength(loop){let s=0;for(let i=0;i<loop.length;i++){const a=loop[i],b=loop[(i+1)%loop.length];s+=Math.hypot(b[0]-a[0],b[1]-a[1]);}return s;}
const walkers=new WeakMap();
function pointAt(loop,s){
 // cumulative lengths cached per loop: positions along the wall are asked thousands of times
 let w=walkers.get(loop);
 if(!w){const acc=[0];for(let i=0;i<loop.length;i++){const a=loop[i],b=loop[(i+1)%loop.length];acc.push(acc[i]+Math.hypot(b[0]-a[0],b[1]-a[1]));}w={acc,L:acc[acc.length-1]};walkers.set(loop,w);}
 const {acc,L}=w;s=((s%L)+L)%L;
 let lo=0,hi=loop.length-1;while(lo<hi){const mid=(lo+hi+1)>>1;if(acc[mid]<=s)lo=mid;else hi=mid-1;}
 const a=loop[lo],b=loop[(lo+1)%loop.length],l=acc[lo+1]-acc[lo],t=l?(s-acc[lo])/l:0;
 return {x:a[0]+(b[0]-a[0])*t,y:a[1]+(b[1]-a[1])*t,a:Math.atan2(b[1]-a[1],b[0]-a[0])};
}
function project(loop,x,y){
 let best={d:Infinity,s:0},acc=0;
 for(let i=0;i<loop.length;i++){const a=loop[i],b=loop[(i+1)%loop.length],dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy);
  const t=l?Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(l*l))):0,d=Math.hypot(x-a[0]-dx*t,y-a[1]-dy*t);
  if(d<best.d)best={d,s:acc+l*t};acc+=l;}
 return best;
}
/* Openings along the loop: every road that crosses it, the OSM gates, the gaps between OSM walls. */
export function enclosureGates(item,loop,roads,roadWidth){
 const L=loopLength(loop),open=[];
 for(const road of roads){
  const p=road.p;
  for(let k=2;k<p.length;k+=2){
   let acc=0;
   for(let i=0;i<loop.length;i++){
    const a=loop[i],b=loop[(i+1)%loop.length],l=Math.hypot(b[0]-a[0],b[1]-a[1]);
    const hit=crossing(a,b,[p[k-2],p[k-1]],[p[k],p[k+1]]);
    // vehicles: the road and both footpaths (walkers keep 1,7 m beyond the kerb); paths: the path itself
    const vehicle=DRIVABLE.has(road.t),width=vehicle?roadWidth(road)+R.openingExtra:Math.max(R.osmGateWidth,roadWidth(road)+1.6);
    if(hit)open.push({s:acc+l*hit.t,width,vehicle,source:'strada '+(road.n||road.t)});
    acc+=l;
   }
  }
 }
 for(const g of item.cancelli||[]){
  const pr=project(loop,g.x,g.y);if(pr.d>40)continue;
  if(open.some(o=>Math.abs(o.s-pr.s)<o.width/2+2))continue;
  const vehicle=g.tipo==='carrabile';
  open.push({s:pr.s,width:vehicle?R.gapGateWidth:R.osmGateWidth,vehicle,source:g.fonte||'OSM'});
 }
 // merge overlapping openings
 open.sort((a,b)=>a.s-b.s);const merged=[];
 for(const o of open){
  const last=merged[merged.length-1];
  if(last&&o.s-o.width/2<=last.s+last.width/2){
   const lo=Math.min(last.s-last.width/2,o.s-o.width/2),hi=Math.max(last.s+last.width/2,o.s+o.width/2);
   Object.assign(last,{s:(lo+hi)/2,width:hi-lo,vehicle:last.vehicle||o.vehicle,source:last.source+' + '+o.source});
  }else merged.push({...o});
 }
 return merged.filter(o=>o.width<L*.5);
}
/* Prepare every enclosure of the data file for the game: walls, gates, booths, collision points. */
export function prepareEnclosures(data,ctx){
 const list=[],failed=[],points=new Map(),cell=4,key=(i,j)=>i+','+j;
 const addPoint=(x,y,ref)=>{const k=key(Math.floor(x/cell),Math.floor(y/cell));(points.get(k)||points.set(k,[]).get(k)).push({x,y,ref});};
 for(const item of data?.recinti||[]){
  const shape=enclosureOutline(item,ctx);
  if(!shape.ok){failed.push({id:item.id,reason:shape.reason});continue;}
  const loop=shape.loop,L=loopLength(loop),openings=enclosureGates(item,loop,shape.near,ctx.roadWidth);
  const cx=loop.reduce((s,p)=>s+p[0],0)/loop.length,cy=loop.reduce((s,p)=>s+p[1],0)/loop.length;
  const gates=openings.map((o,i)=>{const p=pointAt(loop,o.s);return {id:item.id+'-g'+i,enclosure:item.id,x:p.x,y:p.y,a:p.a,width:o.width,
   vehicle:o.vehicle,private:item.tipo==='privato',barrier:item.tipo==='privato'&&o.vehicle,source:o.source,s:o.s};});
  // walls = the loop minus the openings, and never across a walking line of a road that comes in
  // (the centre of footways, both footpaths of driveways: they may run along the wall near a gate)
  const lanes=[],lx=loop.map(p=>p[0]),ly=loop.map(p=>p[1]),lb=[Math.min(...lx)-12,Math.min(...ly)-12,Math.max(...lx)+12,Math.max(...ly)+12];
  for(const road of shape.near){
   if(bounds(road))continue;
   const p=road.p,w=ctx.roadWidth(road),offs=DRIVABLE.has(road.t)?[0,w/2+1.7,-(w/2+1.7)]:[0];
   for(let k=2;k<p.length;k+=2){const ax=p[k-2],ay=p[k-1],dx=p[k]-ax,dy=p[k+1]-ay,l=Math.hypot(dx,dy);if(!l)continue;
    if(Math.max(ax,p[k])<lb[0]||Math.min(ax,p[k])>lb[2]||Math.max(ay,p[k+1])<lb[1]||Math.min(ay,p[k+1])>lb[3])continue;
    for(const o of offs)lanes.push([ax-dy/l*o,ay+dx/l*o,p[k]-dy/l*o,p[k+1]+dx/l*o]);}
  }
  const clearLane=R.walkerRadius+R.wallHalf+.35;
  const open=s=>openings.some(o=>Math.abs(((s-o.s+L/2)%L+L)%L-L/2)<o.width/2)||
   (q=>lanes.some(([ax,ay,bx,by])=>segDist(q.x,q.y,ax,ay,bx,by)<clearLane))(pointAt(loop,s));
  const step=.5,n=Math.ceil(L/step),flags=[];for(let i=0;i<n;i++)flags.push(open(i*step));
  let first=flags.indexOf(true);if(first<0)first=0;
  const walls=[];let run=[];
  for(let k=1;k<=n;k++){
   const i=(first+k)%n;
   if(!flags[i]){const q=pointAt(loop,i*step);run.push([q.x,q.y]);}
   else if(run.length){if(run.length>1)walls.push(simplifyOpen(run,.15));run=[];}
  }
  if(run.length>1)walls.push(simplifyOpen(run,.15));
  for(const w of walls)for(let k=1;k<w.length;k++){
   const a=w[k-1],b=w[k],l=Math.hypot(b[0]-a[0],b[1]-a[1]);
   for(let s=0;s<=l;s+=R.sample)addPoint(a[0]+(b[0]-a[0])*s/l,a[1]+(b[1]-a[1])*s/l,'wall');
  }
  // guard booth beside the main gate of a private compound, inside the wall
  let booth=null;
  if(item.guardiola&&gates.length){
   const main=[...gates].sort((a,b)=>(b.vehicle-a.vehicle)||(b.width-a.width))[0];
   const p=pointAt(loop,main.s+main.width/2+2.6),nx=-Math.sin(p.a),ny=Math.cos(p.a);
   const inward=(cx-p.x)*nx+(cy-p.y)*ny>0?1:-1;
   booth={x:p.x+nx*inward*2.8,y:p.y+ny*inward*2.8,a:p.a,size:3.4,gate:main.id,guard:{x:p.x+nx*inward*2.8+Math.cos(p.a)*-2.6,y:p.y+ny*inward*2.8+Math.sin(p.a)*-2.6,a:Math.atan2(main.y-p.y,main.x-p.x)}};
   const h2=booth.size/2;
   for(let u=-h2;u<=h2;u+=R.sample)for(const v of [-h2,h2]){
    const c=Math.cos(p.a),s=Math.sin(p.a);
    addPoint(booth.x+c*u-s*v,booth.y+s*u+c*v,'booth');addPoint(booth.x+c*v-s*u,booth.y+s*v+c*u,'booth');
   }
  }
  list.push({id:item.id,name:item.nome,type:item.tipo,material:item.materiale||(item.tipo==='privato'?'muro':'cancellata'),
   loop,walls,gates,booth,center:{x:cx,y:cy},cells:shape.cells,verified:!!item.verificato,estimated:item.perimetro?.tipo!=='osm'});
 }
 const gatePoints=[];
 for(const e of list)for(const g of e.gates)if(g.barrier){
  const c=Math.cos(g.a),s=Math.sin(g.a),pts=[];
  for(let u=-g.width/2;u<=g.width/2;u+=R.sample)pts.push({x:g.x+c*u,y:g.y+s*u});
  gatePoints.push({gate:g,pts});
 }
 return {list,failed,points,cell,gatePoints,bounds:list.map(e=>{const xs=e.loop.map(p=>p[0]),ys=e.loop.map(p=>p[1]);return [Math.min(...xs)-6,Math.min(...ys)-6,Math.max(...xs)+6,Math.max(...ys)+6];})};
}
function nearPoints(E,x,y,r){
 const out=[],c=E.cell;
 for(let j=Math.floor((y-r)/c);j<=Math.floor((y+r)/c);j++)for(let i=Math.floor((x-r)/c);i<=Math.floor((x+r)/c);i++){const l=E.points.get(i+','+j);if(l)out.push(...l);}
 return out;
}
/* Pedestrians (and the player on foot): blocked within the wall thickness; gates always pass. */
export function enclosureWalkBlocked(E,x,y,radius=R.walkerRadius){
 if(!E)return false;
 const r=radius+R.wallHalf;
 for(const p of nearPoints(E,x,y,r+.5))if(Math.hypot(p.x-x,p.y-y)<r)return true;
 return false;
}
export function barrierDown(gate,minutes,traffic=[]){
 if(!gate.barrier||!isNight(minutes))return false;
 return !traffic.some(v=>v&&Math.hypot(v.x-gate.x,v.y-gate.y)<R.barrierOpenDistance);
}
/* How deep a vehicle body is into walls, booths and (for the player, at night) closed barriers:
 * the sum, over the wall points inside the body, of how far each is from the nearest body edge.
 * 0 = free. Pressing against a wall makes it grow; sliding along it or backing off does not. */
export function enclosureVehicleContacts(E,pose,shape,{minutes=0,traffic=[],barriers=true}={}){
 if(!E)return 0;
 const hl=(shape?.halfLength||3.15)+R.wallHalf,hw=(shape?.halfWidth||1.7)+R.wallHalf,c=Math.cos(pose.a),s=Math.sin(pose.a);
 const depth=p=>{const dx=p.x-pose.x,dy=p.y-pose.y,u=hl-Math.abs(dx*c+dy*s),v=hw-Math.abs(-dx*s+dy*c);return u>0&&v>0?Math.min(u,v):0;};
 let n=0;
 for(const p of nearPoints(E,pose.x,pose.y,hl+1))n+=depth(p);
 if(barriers)for(const g of E.gatePoints){
  if(Math.hypot(g.gate.x-pose.x,g.gate.y-pose.y)>g.gate.width/2+hl+1)continue;
  if(!barrierDown(g.gate,minutes,traffic))continue;
  for(const p of g.pts)n+=depth(p);
 }
 return n;
}
/* Glass buildings (galleria Atlante): a flag on the building art, the polygon is untouched. */
export function markGlassBuildings(buildings,data){
 const ids=new Set((data?.vetro||[]).map(v=>v.id));let n=0;
 for(const b of buildings)if(ids.has(b.id)&&b.art){b.art.glass=true;n++;}
 return n;
}

// ---- drawing ---------------------------------------------------------------------------------
// Plastered wall (private compounds), tuff and the low wall with iron railings of the parks:
// darker than the pavement so the perimeter reads at a glance, with a light coping on top.
const PALETTE={muro:{top:'#c9ab84',face:'#9c7b57',dark:'#5a4631',cap:'#f4e7c9'},
 tufo:{top:'#c8b06e',face:'#9d8649',dark:'#5e4f2a',cap:'#efe1ae'},
 cancellata:{top:'#b9a17c',face:'#8f765a',dark:'#54453a',cap:'#ead9b8',rail:'#22302e'}};
function visible(b,bounds){return !(b[2]<bounds[0]||b[0]>bounds[2]||b[3]<bounds[1]||b[1]>bounds[3]);}
/* Static layer (cached tiles): wall bodies with a lit cap, cast shadow and, for parks, railings. */
export function drawEnclosureWalls(c,E,bounds,zoom){
 if(!E)return;
 E.list.forEach((e,idx)=>{
  if(!visible(E.bounds[idx],bounds))return;
  const pal=PALETTE[e.material]||PALETTE.muro,H=R.wallHeight;
  c.save();c.lineCap='butt';c.lineJoin='round';
  for(const w of e.walls){
   if(w.length<2)continue;
   const path=(dx=0,dy=0)=>{c.beginPath();c.moveTo(w[0][0]+dx,w[0][1]+dy);for(let k=1;k<w.length;k++)c.lineTo(w[k][0]+dx,w[k][1]+dy);};
   path(1.3,1.5);c.strokeStyle='#1d262352';c.lineWidth=2.4;c.stroke();          // shadow on the ground
   path(0,0);c.strokeStyle=pal.dark;c.lineWidth=R.wallHalf*2+.4;c.stroke();     // foot of the wall
   for(let k=1;k<=5;k++){path(-.08*k,-H*.1*k);c.strokeStyle=pal.face;c.lineWidth=R.wallHalf*2;c.stroke();} // raised face
   path(-.4,-H*.5);c.strokeStyle=pal.top;c.lineWidth=R.wallHalf*2;c.stroke();     // top
   path(-.4,-H*.5-R.wallHalf*.55);c.strokeStyle=pal.cap;c.lineWidth=.32;c.stroke(); // light lip
   if(zoom>=1.3){
    // coping joints every ~2,4 m, and iron railings on park walls
    for(let k=1;k<w.length;k++){
     const a=w[k-1],b=w[k],l=Math.hypot(b[0]-a[0],b[1]-a[1]);
     for(let s=1.2;s<l;s+=2.4){const t=s/l,x=a[0]+(b[0]-a[0])*t-.4,y=a[1]+(b[1]-a[1])*t-H*.5;
      c.fillStyle=pal.dark;c.fillRect(x-.1,y-.45,.2,.9);
      if(e.material==='cancellata'){c.fillStyle=pal.rail;c.fillRect(x-.12,y-2.4,.24,2.2);}}
     if(e.material==='cancellata'){c.strokeStyle=pal.rail;c.lineWidth=.22;
      for(const up of [1.2,2.3]){c.beginPath();c.moveTo(a[0]-.4,a[1]-H*.5-up);c.lineTo(b[0]-.4,b[1]-H*.5-up);c.stroke();}
      for(let s=.6;s<l;s+=.6){const t=s/l,x=a[0]+(b[0]-a[0])*t-.4,y=a[1]+(b[1]-a[1])*t-H*.5;c.fillStyle=pal.rail;c.fillRect(x-.04,y-2.3,.08,1.2);}}
    }
   }
  }
  c.restore();
 });
}
/* Dynamic layer: gate leaves, barriers (down at night unless an NPC vehicle is near), booth, guard. */
export function drawEnclosureGates(c,E,bounds,zoom,{minutes=0,traffic=[],clock=0}={}){
 if(!E)return;
 E.list.forEach((e,idx)=>{
  if(!visible(E.bounds[idx],bounds))return;
  const pal=PALETTE[e.material]||PALETTE.muro;
  for(const g of e.gates){
   const cx=Math.cos(g.a),sy=Math.sin(g.a),half=g.width/2;
   // two pillars
   for(const side of [-1,1]){const x=g.x+cx*half*side,y=g.y+sy*half*side;
    c.fillStyle='#1d262355';c.fillRect(x-.5,y,2,1.6);
    c.fillStyle=pal.dark;c.fillRect(x-.9,y-2.6,1.8,2.9);c.fillStyle=pal.face;c.fillRect(x-.75,y-2.5,1.5,1.6);
    c.fillStyle=pal.cap;c.fillRect(x-1,y-2.9,2,.5);}
   // open iron leaves folded against the inside of the wall
   c.strokeStyle='#2b3533';c.lineWidth=.3;
   const nx=-sy,ny=cx,inward=(e.center.x-g.x)*nx+(e.center.y-g.y)*ny>0?1:-1,leaf=Math.min(2.4,half*.55);
   for(const side of [-1,1]){const x=g.x+cx*half*side,y=g.y+sy*half*side;
    c.beginPath();c.moveTo(x,y-1);c.lineTo(x+nx*inward*leaf,y+ny*inward*leaf-1);c.stroke();
    c.beginPath();c.moveTo(x,y-.2);c.lineTo(x+nx*inward*leaf,y+ny*inward*leaf-.2);c.stroke();}
   if(g.barrier){
    const down=barrierDown(g,minutes,traffic),bx=g.x+cx*(half-.5),by=g.y+sy*(half-.5);
    c.fillStyle='#3b3f3c';c.fillRect(bx-.7,by-1.6,1.4,1.8);c.fillStyle='#d8d3c4';c.fillRect(bx-.5,by-1.5,1,.4);
    c.save();c.translate(bx,by-1.2);c.rotate(g.a+Math.PI+(down?0:-1.25));
    for(let k=0;k<Math.ceil(g.width-1);k++){c.fillStyle=k%2?'#f2efe6':'#c4302b';c.fillRect(k,-.3,1,.6);}
    c.restore();
   }
  }
  if(e.booth){
   const b=e.booth,s=b.size;
   c.save();c.translate(b.x,b.y);c.rotate(b.a);
   c.fillStyle='#1d262355';c.fillRect(-s/2+.8,-s/2+.8,s,s);
   c.fillStyle='#9e9789';c.fillRect(-s/2,-s/2-.4,s,s+.4);         // side walls
   c.fillStyle='#d9d3c3';c.fillRect(-s/2,-s/2-1.6,s,s);           // raised front
   c.fillStyle='#4f6f77';c.fillRect(-s/2+.35,-s/2-1.2,s-.7,.9);   // window band all around
   c.fillStyle='#a9cbd0';c.fillRect(-s/2+.5,-s/2-1.1,.8,.5);
   c.fillStyle='#46514d';c.fillRect(-s/2-.3,-s/2-2.1,s+.6,.6);    // flat roof edge
   c.fillStyle='#e9e3d4';c.fillRect(-s/2,-s/2-1.95,s,.25);
   c.fillStyle='#2f6f53';c.fillRect(-.35,s/2-1.6,.7,1.2);         // door
   c.restore();
   if(!drawProfessionSprite(c,b.guard.x,b.guard.y,b.guard.a,'vigile',clock,false,0,7)){
    c.fillStyle='#24344a';c.beginPath();c.arc(b.guard.x,b.guard.y-1.2,.7,0,Math.PI*2);c.fill();
   }
  }
 });
}
