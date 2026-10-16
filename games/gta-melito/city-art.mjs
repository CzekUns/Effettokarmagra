/* GTA Melito 0.4 — top-down pixel-inspired art, © OpenStreetMap contributors
 * Layout/footprints come from OSM. Colours, rooftop details, props and human sprites
 * are original artistic interpretations: they do not claim photographic fidelity.
 */
const PI=Math.PI,TAU=2*PI;
const asphalt={motorway:'#42454a',trunk:'#494b4c',primary:'#505356',secondary:'#53575a',
 tertiary:'#585c60',residential:'#5a5e61',unclassified:'#5b6062',service:'#676767',
 living_street:'#787571',footway:'#b1a391',pedestrian:'#b3a794',path:'#a39884',
 steps:'#ab9f8e',track:'#8e8d75'};
const oldtown=['#b77a63','#af856b','#bd9c7c','#c4a88a','#ac9074','#be8869'];
const flat=['#bcb7a7','#b2aba1','#b7b0a0','#a69e92','#c6b5a1','#9d9d96'];
const metal=['#929f97','#7e8c89','#a5a9a3'];
const h=n=>{let x=(Number(n)||1)|0;x=Math.imul(x^x>>>16,2246822519);x=Math.imul(x^x>>>13,3266489917);return (x^x>>>16)>>>0};
const rnd=n=>h(n)/4294967295;
const near=(ax,ay,bx,by)=>Math.hypot(ax-bx,ay-by);
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
function line(c,p){c.beginPath();c.moveTo(p[0],p[1]);for(let j=2;j<p.length;j+=2)c.lineTo(p[j],p[j+1]);}
function poly(c,p){line(c,p);c.closePath();}
function bounds(p){
 let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity,xx=0,yy=0,area=0;
 for(let i=0;i<p.length;i+=2){const x=p[i],y=p[i+1];x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);xx+=x;yy+=y;}
 for(let i=2;i<p.length;i+=2)area+=p[i-2]*p[i+1]-p[i]*p[i-1];
 return {x0,y0,x1,y1,cx:xx/(p.length/2),cy:yy/(p.length/2),area:Math.abs(area)/2,w:x1-x0,h:y1-y0};
}
function roofType(b,box,nearPOI){
 const name=(b.n||'').toLowerCase(),type=(b.t||'').toLowerCase(),u=(b.usage||'').toLowerCase();
 if(name.includes('chiesa')||/church|chapel|religious|place_of_worship/.test(type+' '+u))return 'church';
 if(name.includes('municipio')||b.id===733703600||nearPOI?.k==='townhall')return 'civic';
 if(/school|kindergarten|college/.test(type+' '+u)||nearPOI?.k==='school')return 'school';
 if(/retail|commercial|supermarket|shop/.test(type+' '+u)||/(lidl|eurospin|decò|^md$|todis)/i.test(name)||nearPOI?.k==='supermarket')return 'market';
 if(/industrial|warehouse|storage|hangar|factory/.test(type+' '+u)||box.area>2300)return 'industrial';
 if(/apartments|residential|terrace/.test(type)||box.area>500||b.h>=17)return 'apartment';
 if(near(box.cx,box.cy,1100,1150)<410)return 'historic';
 return box.area<155?'house':'mixed';
}
function poiKindNear(b,poi,box){
 if(poi.p[0]<box.x0-4||poi.p[0]>box.x1+4||poi.p[1]<box.y0-4||poi.p[1]>box.y1+4)return false;
 return true;
}
export function prepareCityStyles(buildings,pois=[]){
 const counts={};
 for(const b of buildings){
  const box=bounds(b.p);
  const nearby=pois.find(q=>poiKindNear(b,q,box));
  let type=roofType(b,box,nearby);
  // Municipio OSM place-of-interest sits near this exact OSM building footprint.
  if(b.id===733703600)type='civic';
  b.art={...box,type,seed:h(b.id),flat:['industrial','market','apartment','mixed','school','civic'].includes(type),
   roof:box.area>70&&(/gabled|hipped|mansard|pyramidal|skillion/.test(b.roof||'')||['house','historic','church'].includes(type))};
  counts[type]=(counts[type]||0)+1;
 }
 return counts;
}
export function drawTerrain(c,bb,zoom){
 const cell=28;
 const [x0,y0,x1,y1]=bb;
 for(let gx=Math.floor(x0/cell);gx<=Math.ceil(x1/cell);gx++)for(let gy=Math.floor(y0/cell);gy<=Math.ceil(y1/cell);gy++){
  const seed=h(gx*907+gy*1867),x=gx*cell,y=gy*cell;
  c.fillStyle=seed%7===0?'#53655533':seed%11===0?'#b5a48418':'#8f99751a';
  c.fillRect(x,y,cell-1,cell-1);
  if(zoom<1.15)continue;
  for(let j=0;j<4;j++){
   const px=x+3+h(seed+j*9)%(cell-5),py=y+3+h(seed+j*17)%(cell-5);
   c.fillStyle=j%2?'#b5ad8f35':'#364f3b3e';
   c.fillRect(px,py,j%3===0?1.2:.6,.65);
  }
 }
}
export function drawCityStreets(c,roads,zoom){
 c.save();c.lineJoin='round';c.lineCap='round';
 const pedestrian=r=>['footway','pedestrian','path','steps'].includes(r.t);
 const coat=(extra,color)=>{for(const road of roads){
  line(c,road.p);c.lineWidth=Math.max(1,road.w+extra);c.strokeStyle=pedestrian(road)?color.ped:color.car;c.stroke();
 }};
 coat(5.2,{ped:'#77766e',car:'#79786d'});
 coat(3.8,{ped:'#b1a798',car:'#c9bca7'});
 coat(1.7,{ped:'#b7a997',car:'#34393b'});
 for(const road of roads){
  line(c,road.p);c.lineWidth=Math.max(1,road.w-.5);c.strokeStyle=asphalt[road.t]||'#626362';c.stroke();
 }
 if(zoom>=1.3){
  for(const road of roads){
   if(road.w<8||pedestrian(road)||road.t==='service')continue;
   c.setLineDash(road.t==='primary'||road.t==='trunk'?[3.9,5.1]:[2.5,6.0]);
   c.lineWidth=road.t==='trunk'?.5:.31;c.strokeStyle=road.t==='primary'||road.t==='trunk'?'#e2d1a1b6':'#d9d5b889';
   line(c,road.p);c.stroke();
  }
  c.setLineDash([]);
 }
 if(zoom>=2.15){
  c.lineWidth=.28;c.strokeStyle='#eee3cd45';
  for(const road of roads){
   if(road.t==='pedestrian'||road.t==='footway'){
    c.save();c.setLineDash([.6,1.6]);line(c,road.p);c.stroke();c.restore();
   }
  }
 }
 c.restore();
}
function roofOutline(c,p,fill,thick){
 poly(c,p);c.fillStyle=fill;c.fill();c.strokeStyle='#3a3e36';c.lineWidth=thick;c.stroke();
}
function slopedRoof(c,b,art,tone){
 const {x0,y0,x1,y1,w,h:bh,cx,cy,seed}=art;
 const mode=w>bh?'horizontal':'vertical';
 c.save();poly(c,b.p);c.clip();
 c.fillStyle=tone;c.fillRect(x0,y0,w,bh);
 c.strokeStyle='#59483b99';c.lineWidth=.55;
 if(mode==='horizontal'){
  c.beginPath();c.moveTo(x0,cy);c.lineTo(x1,cy);c.stroke();
  c.strokeStyle='#dfc29b8e';c.beginPath();c.moveTo(x0+1,cy+1.1);c.lineTo(x1-1,cy+1.1);c.stroke();
  c.strokeStyle='#73594760';c.lineWidth=.25;
  for(let x=x0+2;x<x1;x+=3.4){c.beginPath();c.moveTo(x,y0);c.lineTo(x,cy);c.moveTo(x+1.7,cy);c.lineTo(x+1.7,y1);c.stroke();}
 }else{
  c.beginPath();c.moveTo(cx,y0);c.lineTo(cx,y1);c.stroke();
  c.strokeStyle='#d7bda18e';c.beginPath();c.moveTo(cx+1,y0);c.lineTo(cx+1,y1);c.stroke();
  c.strokeStyle='#70584570';c.lineWidth=.25;
  for(let y=y0+2;y<y1;y+=3.4){c.beginPath();c.moveTo(x0,y);c.lineTo(cx,y);c.moveTo(cx,y+1.7);c.lineTo(x1,y+1.7);c.stroke();}
 }
 if(seed%3===0&&w>12&&bh>12){
  c.fillStyle='#b0b6a9';c.fillRect(cx-2,cy-2,3.3,2.6);
  c.fillStyle='#344c52';c.fillRect(cx-1.5,cy-1.5,2.3,1.2);
 }
 c.restore();
}
function flatRoof(c,b,art,tone){
 const {x0,y0,x1,y1,cx,cy,w,h:bh,area,seed}=art;
 c.save();poly(c,b.p);c.clip();
 c.fillStyle=tone;c.fillRect(x0,y0,w,bh);
 c.strokeStyle='#e6dcc0aa';c.lineWidth=.5;
 c.strokeRect(x0+1.3,y0+1.3,Math.max(0,w-2.6),Math.max(0,bh-2.6));
 if(area>55){
  const steps=Math.min(7,Math.floor(area/170)+1);
  for(let j=0;j<steps;j++){
   const x=x0+4+rnd(seed+j*37+11)*Math.max(1,w-8);
   const y=y0+4+rnd(seed+j*61+19)*Math.max(1,bh-8);
   c.fillStyle=j%3?'#757e7a':'#d0c6b0';c.fillRect(x-1.3,y-1.3,3.7,2.8);
   c.fillStyle='#434f53';c.fillRect(x-1.0,y-1,2.3,1.6);
   c.fillStyle='#e4e2ce66';c.fillRect(x-1,y-1,2.3,.5);
  }
 }
 if(art.type==='apartment'&&area>220){
  // Antennas, roof stairs and a small water reservoir — drawn as texture.
  c.fillStyle='#c1baab';c.fillRect(cx-2.9,cy-2.7,5.8,5);
  c.strokeStyle='#777365';c.lineWidth=.35;c.strokeRect(cx-2.9,cy-2.7,5.8,5);
  c.fillStyle='#464b48';c.fillRect(cx+1,cy-2,1.4,3.8);
 }
 if(art.type==='industrial'&&area>450){
  c.fillStyle='#d8e2d4a2';
  const count=Math.min(6,Math.floor(w/17));
  for(let k=0;k<count;k++){
   c.fillRect(x0+6+k*16,y0+6,5,Math.min(10,bh*.4));
  }
 }
 c.restore();
}
function specialized(c,b,art){
 const {cx,cy,w,h:bh,seed}=art;
 if(art.type==='church'){
  // Actual OSM church footprint; rooftop is an interpretation of the
  // central dome of Santa Maria delle Grazie, not a measured 3D survey.
  roofOutline(c,b.p,'#e2d1af',.9);
  if(!/Santa Maria delle Grazie/i.test(b.n||'')){
   // The other historic church has a different roof silhouette in OSM.
   c.strokeStyle='#bfa886';c.lineWidth=.7;c.beginPath();c.moveTo(art.x0+1,cy);c.lineTo(art.x1-1,cy);c.stroke();
   return true;
  }
  const radius=clamp(Math.min(w,bh)*.24,4,12);
  c.save();c.translate(cx,cy);
  c.fillStyle='#b09f82';c.beginPath();c.arc(1.2,1.6,radius+1.8,0,TAU);c.fill();
  c.fillStyle='#607176';c.beginPath();c.arc(0,0,radius+1.2,0,TAU);c.fill();
  c.strokeStyle='#d5d5bd';c.lineWidth=.8;c.stroke();
  for(let j=0;j<10;j++){const a=j*TAU/10;c.strokeStyle='#aab2a9';c.lineWidth=.35;
   c.beginPath();c.moveTo(0,0);c.lineTo(Math.cos(a)*radius,Math.sin(a)*radius);c.stroke();}
  c.fillStyle='#ded2ae';c.beginPath();c.arc(0,0,radius*.28,0,TAU);c.fill();
  c.strokeStyle='#463e34';c.lineWidth=.8;c.beginPath();c.moveTo(0,-radius*.38);c.lineTo(0,radius*.38);
  c.moveTo(-radius*.25,-radius*.08);c.lineTo(radius*.25,-radius*.08);c.stroke();
  c.restore();
  return true;
 }
 if(art.type==='civic'){
  roofOutline(c,b.p,'#aa685e',.8);
  c.save();poly(c,b.p);c.clip();
  c.strokeStyle='#e4b6a0';c.lineWidth=.75;
  c.strokeRect(art.x0+2,art.y0+2,Math.max(0,w-4),Math.max(0,bh-4));
  c.fillStyle='#828a8a';c.fillRect(cx-3.5,cy-2,7,4);
  c.fillStyle='#d1bdaa';c.fillRect(cx-2.7,cy-1.5,5.4,3);
  c.restore();return true;
 }
 if(art.type==='market'||art.type==='school'){
  const roof=art.type==='school'?'#b2ada0':'#b7c0ba';
  flatRoof(c,b,art,roof);
  if(art.type==='market'&&w>12&&bh>12){
   c.fillStyle='#447f8d';c.fillRect(art.x0+3,art.y0+3,Math.min(15,w-6),2);
  }
  return true;
 }
 return false;
}
export function drawCityBuildings(c,buildings,zoom){
 const sorted=[...buildings].sort((a,b)=>(a.art?.y1??0)-(b.art?.y1??0));
 for(const b of sorted){
  const a=b.art;if(!a)continue;
  const seed=a.seed,depth=clamp((b.h||9)*.29,2.2,7.2),dx=depth*.65,dy=depth*.9;
  const wall=a.type==='historic'?'#8a7962':a.type==='industrial'?'#74817c':'#807e72';
  c.save();
  c.save();c.translate(dx+1.1,dy+1.3);poly(c,b.p);c.fillStyle='#22362c66';c.fill();c.restore();
  c.save();c.translate(dx,dy);poly(c,b.p);c.fillStyle='#4c5148';c.fill();c.restore();
  for(let j=2;j<b.p.length;j+=2){
   const x1=b.p[j-2],y1=b.p[j-1],x2=b.p[j],y2=b.p[j+1];
   const edgeX=x2-x1,edgeY=y2-y1,len=Math.hypot(edgeX,edgeY);
   if(len<2)continue;
   c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.lineTo(x2+dx,y2+dy);c.lineTo(x1+dx,y1+dy);c.closePath();
   c.fillStyle=edgeY>0?wall:'#67675a';c.fill();
   // A few tiny windows, shutters and balconies on visible long facades.
   if(zoom>1.7&&len>9&&edgeY>-.2){
    const count=Math.min(14,Math.floor(len/4.5));
    for(let k=1;k<=count;k++){
     const t=k/(count+1),px=x1+edgeX*t+dx*.63,py=y1+edgeY*t+dy*.63;
     c.fillStyle='#343f40';c.fillRect(px-1,py-1,1.5,1.9);
     c.fillStyle=k%3===0?'#d0a373':'#aeb7b0';c.fillRect(px-1,py-1,.4,1.9);
     if(a.type==='historic'&&k%3===0){
      c.strokeStyle='#2f3a33';c.lineWidth=.32;c.strokeRect(px-1.5,py+.9,2.6,.6);
     }
    }
   }
  }
  const historic=a.type==='historic'||a.type==='house';
  const tone=historicalRoofTone(a);
  if(!specialized(c,b,a)){
   if(a.roof&&a.area>55)slopedRoof(c,b,a,tone);
   else flatRoof(c,b,a,a.type==='industrial'?metal[seed%3]:a.type==='apartment'?flat[seed%6]:tone);
  }
  poly(c,b.p);c.strokeStyle='#39423d';c.lineWidth=.55;c.stroke();
  if(zoom>=1.45&&(b.id===733703600||/Chiesa di Santa Maria delle Grazie/i.test(b.n||''))){
   const label=b.id===733703600?'MUNICIPIO':'S. MARIA DELLE GRAZIE';
   const width=b.id===733703600?28:54;
   c.fillStyle='#162821d9';c.fillRect(a.cx-width/2,a.y0-8,width,5.7);
   c.fillStyle='#ffe3a9';c.font='bold 2.9px monospace';c.textAlign='center';
   c.fillText(label,a.cx,a.y0-4,width-2);
  }
  c.restore();
 }
}
function historicalRoofTone(art){
 const id=art.seed;
 if(art.type==='historic'||art.type==='house')return oldtown[id%oldtown.length];
 return flat[id%flat.length];
}
export function drawCityPeople(c,people,graph,clock,bounds){
 const [x0,y0,x1,y1]=bounds;
 for(const p of people){
  if(p.x<x0-14||p.x>x1+14||p.y<y0-14||p.y>y1+14)continue;
  const road=graph.edges[p.edge],side=p.kind%2?1:-1,margin=(road?.streetWidth||7)/2+1.25;
  const x=p.x-Math.sin(p.a)*margin*side,y=p.y+Math.cos(p.a)*margin*side;
  const walk=Math.sin(clock*p.speed*9+p.seed),palette=[
   ['#ae8669','#4b6b67','#1a2d38'],['#dfa97a','#a65c5e','#41414d'],
   ['#c88e6e','#707b91','#51453d'],['#e9bf8f','#caa16c','#36555a'],
   ['#b48162','#7b8770','#212a34'],['#c59675','#8b6c9a','#253347']];
  const c1=palette[p.kind%palette.length],coat=c1[1],pants=c1[2];
  c.save();c.translate(x,y);c.rotate(p.a);
  c.fillStyle='#1f2e2a80';c.beginPath();c.ellipse(.9,1.2,2.5,1.9,-.2,0,TAU);c.fill();
  c.fillStyle=pants;c.fillRect(-2,walk*.8-.75,1.7,1.6);c.fillRect(-2,-walk*.8+.65,1.7,1.6);
  c.fillStyle='#1b2729';c.fillRect(-2.3,walk*.8-.9,.65,.9);
  c.fillStyle=coat;c.fillRect(-1.5,-1.6,3.5,3.15);
  c.fillStyle=c1[0];c.fillRect(1.4,-1.75,1.3,1.8);
  c.fillStyle='#3c3530';c.fillRect(2.0,-1.75,.8,1.7);
  c.fillStyle=c1[0];c.fillRect(-1,walk*.6+1.45,1.3,.75);
  if(p.kind===2){c.fillStyle='#2b343c';c.fillRect(-1.5,-1.3,1,2.1);}
  if(p.kind===3){c.fillStyle='#e0bb75';c.fillRect(-1,-.4,1.5,.9);}
  c.restore();
 }
}
export function drawCityCar(c,x,y,a,type=0,focused=false,clock=0){
 const seed=h(type+41),col=['#b14e46','#d8b45b','#6b98a5','#8d9b83','#dbd2bb','#b5b2a5','#e6dfc6'][type%7];
 c.save();c.translate(x,y);c.rotate(a);
 c.fillStyle='#1e2c2a75';c.fillRect(-4.7,-1.5,10.8,6.4);
 if(type===5){
  c.fillStyle='#141e20';c.fillRect(-2.8,-.75,1.6,1.7);c.fillRect(1.9,-.75,1.6,1.7);
  c.fillStyle='#bc6350';c.fillRect(-2,-.62,5.1,1.2);
  c.fillStyle='#e3d3b5';c.fillRect(-.1,-.85,1.2,1.65);
  c.fillStyle='#3e4540';c.fillRect(2.4,-1.9,.65,3.8);
  c.fillStyle='#f9dea6';c.fillRect(3.3,-.6,.5,1.2);
  c.restore();return;
 }
 const van=type===6,back=van?-5.1:-4.2,front=van?5.6:4.4,wide=van?2.7:2.25;
 c.fillStyle='#162327';c.fillRect(back-1,-wide-.8,2,1);c.fillRect(back-1,wide,2,1);
 c.fillRect(front-1.2,-wide-.8,2,1);c.fillRect(front-1.2,wide,2,1);
 c.fillStyle='#1b2928';c.fillRect(back-.45,-wide-.8,front-back+1,wide*2+1.6);
 c.fillStyle=col;c.fillRect(back,-wide,front-back,wide*2);
 c.fillStyle=van?'#577786':'#254653';c.fillRect(-.7,-wide+.5,van?3.2:2.8,wide*2-1);
 c.fillStyle='#b8d1c7';c.fillRect(1.5,-wide+.7,.5,wide*2-1.4);
 if(!van){c.fillStyle='#526c70';c.fillRect(-3,-wide+.55,.75,wide*2-1.1);}
 else{c.fillStyle='#e3dfc7';c.fillRect(back+.5,-wide+.75,1.7,wide*2-1.5);}
 c.fillStyle='#ffdb99';c.fillRect(front-.75,-wide+.45,.75,.9);c.fillRect(front-.75,wide-1.35,.75,.9);
 c.fillStyle='#a0473c';c.fillRect(back,-wide+.4,.55,.95);c.fillRect(back,wide-1.35,.55,.95);
 c.fillStyle='#efe7d4';c.fillRect(front+.1,-.7,.45,1.4);
 c.fillStyle='#e8d6b999';c.fillRect(-1,-wide+.25,van?4.5:3,.38);
 if(focused){c.strokeStyle='#ffe6a9';c.lineWidth=.7;c.strokeRect(back-.65,-wide-.55,front-back+1.3,wide*2+1.1);}
 c.restore();
}
export function drawCityPlayer(c,player,clock=0,moving=false){
 if(player.car>=0)return;
 c.save();c.translate(player.x,player.y);c.rotate(player.a);
 const walk=moving?Math.sin(clock*12):0,active=walk*.65;
 c.fillStyle='#172b28a6';c.beginPath();c.ellipse(.6,1.2,2.6,2.0,0,0,TAU);c.fill();
 c.fillStyle='#2c343e';c.fillRect(-1.5,active-1.6,1.7,2);c.fillRect(-1.5,-active+.6,1.7,2);
 c.fillStyle='#242927';c.fillRect(-1.9,active-1.6,.8,1);c.fillRect(-1.9,-active+.75,.8,1);
 c.fillStyle='#ca593b';c.fillRect(-1.3,-1.65,3,3.4);
 c.fillStyle='#e2b988';c.fillRect(1.3,-1.45,1.65,2.1);
 c.fillStyle='#44372e';c.fillRect(2.15,-1.5,.9,1.7);
 c.fillStyle='#f2dfb8';c.fillRect(.2,-1.3,1.1,1.1);
 c.fillStyle='#20292f';c.fillRect(-1.3,-1.9,1,3.5);
 c.fillStyle='#ffe0a1';c.fillRect(-.7,1.1,1,.5);
 c.restore();
}
