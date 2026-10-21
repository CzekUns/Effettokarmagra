/* GTA Melito — Q32: campetti da calcetto e il campo grande di Via delle Palme, accesso e mappa.
 * Q33 (21/10/2026, richiesta del committente): la partita si gioca DENTRO il campo, nell'overworld
 * (football-match.mjs). Il campo da gioco è quello grande di Via delle Palme (`partita:true`), nello
 * spazio del campo a 11 visto sulla foto aerea; i due campetti piccoli restano scenografia.
 * Position and size of every pitch are traced by eye on the Esri World Imagery aerial photo
 * (consulted 20/10/2026, coordinates only, no image in the repo) and checked against the game map:
 * no OSM building, no street (visual width + 1,2 m) inside the fenced area. OSM has no leisure=pitch
 * in the game extract, so they are `verificato:false` as map data but `foto:true` (seen on the photo).
 * Only the INVENTED infill placeholders (urban-infill) standing on a pitch are removed; OSM polygons
 * are never touched. `partita:true` marks the pitch where the Q33 match is played: inside its lines
 * the prompt «E · GIOCA» appears (football-match.mjs). */

export const PITCH_RULES=Object.freeze({
 runoff:1.5,        // synthetic grass between the lines and the fence
 fenceHalf:.25,     // half thickness of the mesh fence (collision)
 walkerRadius:.45,
 sample:.5,         // fence collision points
 gateWidth:3,       // pedestrian gate: too narrow for a car
 hotspot:3,         // (Q32) distance from the gate used by the old gate prompt; the Q33 prompt is inside the lines
 lightEvery:1       // floodlight poles at the four corners
});
const R=PITCH_RULES;

export const PITCH_SOURCE='Posizione e misure ricalcate a vista sulla foto aerea Esri World Imagery (consultata 20/10/2026); nessun dato OSM leisure=pitch nell\'estratto del gioco.';
/* kind: 'calcetto' = small synthetic pitch (hotspot for the Q33 match); 'calcio11' = full field.
 * w runs along x, h along y (a = 0: every pitch here is aligned with the map grid). */
export const PITCHES=Object.freeze([
 Object.freeze({id:'palme-campetto',nome:'Campetto di Via delle Palme',kind:'calcetto',cx:550,cy:1198,w:52,h:32,a:0,
  foto:true,verificato:false,note:'campetto in erba sintetica con fari, a nord del campo a 11 (audit BF13 A01)'}),
 /* Q33: the big field. On the photo it is the full-size pitch (61×108); in the game it is the
  * playable «campo grande»: lines 58×102, goals 8 wide, fence on the photo footprint. People are drawn
  * about twice their real size here (24×40 px), so the pitch is about twice a calcio a 5 pitch too. */
 Object.freeze({id:'palme-campo',nome:'Campo di Via delle Palme',kind:'calcetto',partita:true,cx:528.5,cy:1276,w:58,h:102,a:0,
  porta:8,profondita:2.6,area:14,centro:7,
  foto:true,verificato:false,note:'campo grande in erba sintetica con tribuna a ovest (sulla foto un campo a 11); prima coperto da 9 segnaposto dell\'infill (audit BF13 A01). Qui si gioca la partita Q33.'}),
 Object.freeze({id:'europa-campetto',nome:'Campetto di Corso Europa',kind:'calcetto',cx:1026,cy:1882,w:30,h:17,a:0,
  foto:true,verificato:false,note:'campetto con fari accanto al fabbricato degli spogliatoi (audit BF13 M12); il secondo campetto a sud è sotto la carreggiata disegnata di Corso Europa e resta fuori'})
]);

// Fence rectangle (lines + run-off) as a closed ring.
export function pitchFence(p){
 const hw=p.w/2+R.runoff,hh=p.h/2+R.runoff,c=Math.cos(p.a||0),s=Math.sin(p.a||0);
 return [[-hw,-hh],[hw,-hh],[hw,hh],[-hw,hh]].map(([u,v])=>[p.cx+u*c-v*s,p.cy+u*s+v*c]);
}
// Goal frame of a pitch: explicit (porta/profondita) or the typical calcetto / calcio a 11 sizes.
export function goalSize(p){return {width:p.porta||(p.kind==='calcio11'?7.3:3),depth:p.profondita||(p.kind==='calcio11'?2:1.2)};}
function toLocal(p,x,y){const dx=x-p.cx,dy=y-p.cy,c=Math.cos(p.a||0),s=Math.sin(p.a||0);return [dx*c+dy*s,-dx*s+dy*c];}
export function insidePitch(p,x,y,pad=0){const [u,v]=toLocal(p,x,y);return Math.abs(u)<=p.w/2+R.runoff+pad&&Math.abs(v)<=p.h/2+R.runoff+pad;}
function insidePoly(x,y,poly){
 let yes=false;
 for(let i=0,j=poly.length-2;i<poly.length;j=i,i+=2){
  const ax=poly[i],ay=poly[i+1],bx=poly[j],by=poly[j+1];
  if(((ay>y)!==(by>y))&&(x<(bx-ax)*(y-ay)/(by-ay)+ax))yes=!yes;
 }
 return yes;
}
/* An invented infill placeholder touches a pitch: a vertex inside the fence, or a fence corner /
 * the pitch centre inside the placeholder. Real OSM buildings are never passed here. */
export function infillOnPitch(building,pitches=PITCHES){
 const pts=building?.p;if(!pts||pts.length<6)return false;
 return pitches.some(p=>{
  for(let i=0;i<pts.length;i+=2)if(insidePitch(p,pts[i],pts[i+1],.5))return true;
  if(insidePoly(p.cx,p.cy,pts))return true;
  return pitchFence(p).some(([x,y])=>insidePoly(x,y,pts));
 });
}

/* Gate: on the side whose outside is reachable on foot from a street in the fewest steps
 * (grid search through `walkable`), so the entrance never opens onto a wall or a back yard.
 * On the two goal ends it sits beside the goal, never behind it. */
function gateCandidates(p){
 const hw=p.w/2+R.runoff,hh=p.h/2+R.runoff,c=Math.cos(p.a||0),s=Math.sin(p.a||0),long=p.w>=p.h;
 const goalHalf=goalSize(p).width/2+1.2+R.gateWidth/2;
 const at=(u,v)=>({x:p.cx+u*c-v*s,y:p.cy+u*s+v*c});
 const out=[];
 for(const [side,ends,half,fixed,nx,ny] of [['nord',!long,hw,-hh,0,-1],['sud',!long,hw,hh,0,1],['ovest',long,hh,-hw,-1,0],['est',long,hh,hw,1,0]]){
  const offs=ends?[goalHalf,-goalHalf].filter(o=>Math.abs(o)<half-2):[0,half*.55,-half*.55];
  for(const o of offs){
   const u=nx?fixed:o,v=nx?o:fixed;
   out.push({side,...at(u,v),out:at(u+nx*2,v+ny*2),along:nx?{x:-s,y:c}:{x:c,y:s}});
  }
 }
 return out;
}
function stepsToStreet(start,walkable,nearStreet,max=90){
 if(!walkable(start.x,start.y))return Infinity;
 const key=(i,j)=>i+','+j,seen=new Set([key(0,0)]);let frontier=[[0,0]];
 for(let d=0;d<=max;d++){
  const next=[];
  for(const [i,j] of frontier){
   const x=start.x+i,y=start.y+j;
   if(nearStreet(x,y))return d;
   for(const [di,dj] of [[1,0],[-1,0],[0,1],[0,-1]]){
    const k=key(i+di,j+dj);if(seen.has(k))continue;seen.add(k);
    if(walkable(start.x+i+di,start.y+j+dj))next.push([i+di,j+dj]);
   }
  }
  frontier=next;if(!frontier.length)break;
 }
 return Infinity;
}
export function preparePitches(list=PITCHES,{walkable=()=>true,nearStreet=()=>false}={}){
 const out=[],failed=[],cell=4,points=new Map();
 const add=(x,y,owner)=>{const k=Math.floor(x/cell)+','+Math.floor(y/cell);(points.get(k)||points.set(k,[]).get(k)).push({x,y,owner});};
 for(const p of list){
  let best=null;
  for(const g of gateCandidates(p)){const d=stepsToStreet(g.out,walkable,nearStreet);if(d<(best?.d??Infinity))best={...g,d};}
  if(!best){failed.push({id:p.id,reason:'nessun lato raggiungibile a piedi da una strada'});continue;}
  const gate={x:best.x,y:best.y,side:best.side,along:best.along,width:R.gateWidth,steps:best.d};
  const ring=pitchFence(p),fence=[];
  for(let k=0;k<4;k++){
   const a=ring[k],b=ring[(k+1)%4],l=Math.hypot(b[0]-a[0],b[1]-a[1]);
   for(let t=0;t<=l;t+=R.sample){
    const x=a[0]+(b[0]-a[0])*t/l,y=a[1]+(b[1]-a[1])*t/l;
    if(Math.hypot(x-gate.x,y-gate.y)<R.gateWidth/2)continue;
    fence.push([x,y]);add(x,y,p.id);
   }
  }
  // goals: the frame (posts and back bar) is solid; calcetto 3 m wide, calcio a 11 7,3 m
  const {width:gw,depth}=goalSize(p),long=p.w>=p.h;
  for(const end of [-1,1]){
   for(let t=-gw/2;t<=gw/2;t+=R.sample){
    const u=long?end*(p.w/2+depth):t,v=long?t:end*(p.h/2+depth);
    const c=Math.cos(p.a||0),s=Math.sin(p.a||0);add(p.cx+u*c-v*s,p.cy+u*s+v*c,p.id);
   }
  }
  out.push({...p,ring,gate,fence,goal:{width:gw,depth,long}});
 }
 return {list:out,failed,points,cell,bounds:out.map(p=>{const xs=p.ring.map(q=>q[0]),ys=p.ring.map(q=>q[1]);return [Math.min(...xs)-4,Math.min(...ys)-6,Math.max(...xs)+4,Math.max(...ys)+4];})};
}
function nearPoints(P,x,y,r){
 const out=[],c=P.cell;
 for(let j=Math.floor((y-r)/c);j<=Math.floor((y+r)/c);j++)for(let i=Math.floor((x-r)/c);i<=Math.floor((x+r)/c);i++){const l=P.points.get(i+','+j);if(l)out.push(...l);}
 return out;
}
export function pitchWalkBlocked(P,x,y,radius=R.walkerRadius){
 if(!P)return false;
 const r=radius+R.fenceHalf;
 for(const q of nearPoints(P,x,y,r+.5))if(Math.hypot(q.x-x,q.y-y)<r)return true;
 return false;
}
// How deep a vehicle body is into fences and goals (0 = free), like BF12: growing means pressing in.
export function pitchVehicleContacts(P,pose,shape){
 if(!P)return 0;
 const hl=(shape?.halfLength||3.15)+R.fenceHalf,hw=(shape?.halfWidth||1.7)+R.fenceHalf,c=Math.cos(pose.a),s=Math.sin(pose.a);
 let n=0;
 for(const q of nearPoints(P,pose.x,pose.y,hl+1)){const dx=q.x-pose.x,dy=q.y-pose.y,u=hl-Math.abs(dx*c+dy*s),v=hw-Math.abs(-dx*s+dy*c);if(u>0&&v>0)n+=Math.min(u,v);}
 return n;
}
/* Q33: «E · GIOCA» on foot inside the lines of the playable pitch (partita:true). The small pitches
 * are scenery: no prompt. */
export function pitchHotspot(P,x,y){
 if(!P)return null;
 for(const p of P.list){
  if(!p.partita)continue;
  if(insidePitch(p,x,y,-R.runoff))return p;
 }
 return null;
}
// Inside the fence of a pitch (run-off included): used by the match to see who is on the field.
export function pitchContaining(P,x,y,pad=0){
 if(!P)return null;
 for(const p of P.list)if(insidePitch(p,x,y,pad))return p;
 return null;
}

// ---- drawing (static ground layer, under the roofs) -------------------------------------------
const GREEN=['#3f8a4a','#4a9654'],RUNOFF='#2f6e3c',LINE='#eef3e6',FENCE='#20372c',POST='#4a5a54';
function visible(b,bounds){return !(b[2]<bounds[0]||b[0]>bounds[2]||b[3]<bounds[1]||b[1]>bounds[3]);}
export function drawPitches(c,P,bounds,zoom){
 if(!P)return;
 P.list.forEach((p,idx)=>{
  if(!visible(P.bounds[idx],bounds))return;
  const hw=p.w/2,hh=p.h/2,long=p.w>=p.h,L=long?p.w:p.h,S=long?p.h:p.w;
  c.save();c.translate(p.cx,p.cy);c.rotate(p.a||0);
  // run-off and mown stripes across the long axis
  c.fillStyle=RUNOFF;c.fillRect(-hw-R.runoff,-hh-R.runoff,p.w+2*R.runoff,p.h+2*R.runoff);
  const bands=p.kind==='calcio11'||p.partita?12:8,area=p.area||6,centre=p.centro||3,big=p.kind==='calcio11'||p.partita;
  for(let k=0;k<bands;k++){
   c.fillStyle=GREEN[k%2];
   if(long)c.fillRect(-hw+k*p.w/bands,-hh,p.w/bands+.05,p.h);else c.fillRect(-hw,-hh+k*p.h/bands,p.w,p.h/bands+.05);
  }
  // lines
  c.strokeStyle=LINE;c.lineWidth=big?.3:.18;
  c.strokeRect(-hw,-hh,p.w,p.h);
  c.beginPath();if(long){c.moveTo(0,-hh);c.lineTo(0,hh);}else{c.moveTo(-hw,0);c.lineTo(hw,0);}c.stroke();
  c.beginPath();c.arc(0,0,p.kind==='calcio11'?9.15:centre,0,Math.PI*2);c.stroke();
  c.fillStyle=LINE;c.beginPath();c.arc(0,0,big?.45:.3,0,Math.PI*2);c.fill();
  for(const end of [-1,1]){
   c.save();if(long)c.scale(end,1);else c.scale(1,end);
   if(p.kind==='calcio11'){
    // penalty box, goal area, spot (FIFA sizes, along the long y axis here)
    const box=(dep,wid)=>long?c.strokeRect(hw-dep,-wid/2,dep,wid):c.strokeRect(-wid/2,hh-dep,wid,dep);
    box(16.5,40.3);box(5.5,18.3);
    c.beginPath();if(long)c.arc(hw-11,0,.3,0,Math.PI*2);else c.arc(0,hh-11,.3,0,Math.PI*2);c.fill();
   }else{
    // calcio a 5: the area is a quarter-circle pair centred on the posts, joined by a straight line
    const gh=p.goal.width/2;
    c.beginPath();
    if(long){c.arc(hw,-gh,area,Math.PI/2,Math.PI,false);c.lineTo(hw-area,gh);c.arc(hw,gh,area,Math.PI,Math.PI*1.5,false);}
    else{c.arc(-gh,hh,area,-Math.PI,-Math.PI/2,false);c.lineTo(gh,hh-area);c.arc(gh,hh,area,-Math.PI/2,0,false);}
    c.stroke();
    c.beginPath();if(long)c.arc(hw-area,0,big?.4:.25,0,Math.PI*2);else c.arc(0,hh-area,big?.4:.25,0,Math.PI*2);c.fill();
   }
   // goal: white frame with a hatched net behind the line
   const gw=p.goal.width,gd=p.goal.depth;
   c.fillStyle='#d9dfd6';c.strokeStyle='#ffffff';c.lineWidth=big?.32:.22;
   if(long){c.strokeRect(hw,-gw/2,gd,gw);c.strokeStyle='#ffffff66';c.lineWidth=.06;for(let t=-gw/2;t<=gw/2;t+=.45){c.beginPath();c.moveTo(hw,t);c.lineTo(hw+gd,t);c.stroke();}}
   else{c.strokeRect(-gw/2,hh,gw,gd);c.strokeStyle='#ffffff66';c.lineWidth=.06;for(let t=-gw/2;t<=gw/2;t+=.45){c.beginPath();c.moveTo(t,hh);c.lineTo(t,hh+gd);c.stroke();}}
   c.restore();
  }
  c.restore();
  // fence: shadow, mesh, posts every 3 m; the gate leaf stands ajar inside
  const ring=p.ring,g=p.gate;
  c.save();c.lineJoin='miter';
  const sides=[];for(let k=0;k<4;k++)sides.push([ring[k],ring[(k+1)%4]]);
  for(const [a,b] of sides){
   const l=Math.hypot(b[0]-a[0],b[1]-a[1]),ux=(b[0]-a[0])/l,uy=(b[1]-a[1])/l;
   // split around the gate
   const tg=(g.x-a[0])*ux+(g.y-a[1])*uy,dg=Math.abs(-(g.x-a[0])*uy+(g.y-a[1])*ux);
   const parts=dg<.5&&tg>0&&tg<l?[[0,tg-R.gateWidth/2],[tg+R.gateWidth/2,l]]:[[0,l]];
   for(const [t0,t1] of parts){
    const p0=[a[0]+ux*t0,a[1]+uy*t0],p1=[a[0]+ux*t1,a[1]+uy*t1];
    c.strokeStyle='#14211b55';c.lineWidth=.9;c.beginPath();c.moveTo(p0[0]+.6,p0[1]+.8);c.lineTo(p1[0]+.6,p1[1]+.8);c.stroke();
    c.strokeStyle=FENCE;c.lineWidth=.35;c.beginPath();c.moveTo(p0[0],p0[1]);c.lineTo(p1[0],p1[1]);c.stroke();
    if(zoom>=1.3){c.strokeStyle='#2c4a3b';c.lineWidth=.12;c.beginPath();c.moveTo(p0[0]-.25,p0[1]-1.4);c.lineTo(p1[0]-.25,p1[1]-1.4);c.stroke();}
    for(let t=t0;t<=t1+.01;t+=3){const x=a[0]+ux*t,y=a[1]+uy*t;c.fillStyle=POST;c.fillRect(x-.18,y-1.6,.36,1.8);}
   }
  }
  // gate leaf (open inwards)
  const inward={x:p.cx-g.x,y:p.cy-g.y},il=Math.hypot(inward.x,inward.y)||1;
  const hx=g.x-g.along.x*R.gateWidth/2,hy=g.y-g.along.y*R.gateWidth/2;
  c.strokeStyle='#384a43';c.lineWidth=.3;c.beginPath();c.moveTo(hx,hy);
  c.lineTo(hx+(g.along.x*.4+inward.x/il*.9)*R.gateWidth,hy+(g.along.y*.4+inward.y/il*.9)*R.gateWidth);c.stroke();
  // floodlights at the corners: pole, head and a soft cast on the grass
  for(const [x,y] of ring){
   c.fillStyle='#00000033';c.beginPath();c.ellipse(x+1.2,y+1.5,.9,.5,0,0,Math.PI*2);c.fill();
   c.fillStyle='#3b4744';c.fillRect(x-.2,y-5.5,.4,5.6);
   c.fillStyle='#cfd8d2';c.fillRect(x-.7,y-6.1,1.4,.7);
  }
  c.restore();
 });
}
