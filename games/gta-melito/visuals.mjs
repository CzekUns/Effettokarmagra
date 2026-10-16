import {visualRoadWidth} from './road-widths.mjs?v=043';
/* GTA Melito 0.2 — procedural 1990s overhead city visuals.
 * Roads and building polygons are from © OpenStreetMap contributors (ODbL).
 * Trees, lamps, bins, signs and scooters are fictional visual dressing. */
const palette=['#ad9272','#b2a18a','#9c8c80','#b6a28c','#b3aaa0','#948b80','#c0ad8e','#988f86'];
const asphalt={motorway:'#444950',trunk:'#434a4e',primary:'#474e52',secondary:'#505255',tertiary:'#54585a',unclassified:'#56585a',residential:'#565a5b',living_street:'#60605e',service:'#60605f',pedestrian:'#a89e86',footway:'#9f9687',path:'#9e957f',steps:'#b1a387',track:'#847e70'};
const pi=Math.PI;
export function hash(n){let x=(Number(n)||1)|0;x=Math.imul(x^x>>>16,2246822519);x=Math.imul(x^x>>>13,3266489917);return (x^x>>>16)>>>0;}
function line(c,p){c.beginPath();c.moveTo(p[0],p[1]);for(let i=2;i<p.length;i+=2)c.lineTo(p[i],p[i+1]);}
function polygon(c,p){line(c,p);c.closePath();}
const dist=(ax,ay,bx,by)=>Math.hypot(bx-ax,by-ay);
export function sampleRoad(p,metres){
 let remaining=metres;
 for(let i=2;i<p.length;i+=2){
  const ax=p[i-2],ay=p[i-1],dx=p[i]-ax,dy=p[i+1]-ay,len=Math.hypot(dx,dy);
  if(remaining<=len)return {x:ax+dx*remaining/(len||1),y:ay+dy*remaining/(len||1),a:Math.atan2(dy,dx)};
  remaining-=len;
 }
 return null;
}
export function buildStreetProps(roads){
 const props=[];
 for(const road of roads){
  if(!road.p||road.p.length<4||['motorway','trunk','steps','path','track'].includes(road.t))continue;
  let len=0;for(let i=2;i<road.p.length;i+=2)len+=dist(road.p[i-2],road.p[i-1],road.p[i],road.p[i+1]);
  if(len<22)continue;
  const seed=hash(road.id),stride=38+seed%21;
  for(let d=14+seed%19,idx=0;d<len-9;d+=stride,idx++){
   const point=sampleRoad(road.p,d);if(!point)continue;
   const kind=(hash(seed+idx*333)%15),side=(idx+seed)%2?1:-1;
   const margin=visualRoadWidth(road)/2+3.5;
   const x=point.x-Math.sin(point.a)*margin*side,y=point.y+Math.cos(point.a)*margin*side;
   props.push({x,y,a:point.a,kind,side,p:[x-3,y-3,x+3,y+3],roadId:road.id});
  }
 }
 return props;
}
function roofs(c,b,zoom){
 const p=b.p;
 if(!p||p.length<8)return;
 let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;
 for(let i=0;i<p.length;i+=2){minX=Math.min(minX,p[i]);maxX=Math.max(maxX,p[i]);minY=Math.min(minY,p[i+1]);maxY=Math.max(maxY,p[i+1]);}
 const seed=hash(b.id),depth=Math.min(8,2+Math.round((b.h||10)*.23)),xoff=depth*.6,yoff=depth*.64;
 c.save();
 // Deep shadow and extruded wall silhouette convey height without altering the OSM footprint.
 c.save();c.translate(xoff+1,yoff+1);polygon(c,p);c.fillStyle='#172522ae';c.fill();c.restore();
 c.save();c.translate(xoff,yoff);polygon(c,p);c.fillStyle='#544d43';c.fill();c.restore();
 // Facade strips projected from the real polygon boundary.
 c.beginPath();for(let i=2;i<p.length;i+=2){const ax=p[i-2],ay=p[i-1],bx=p[i],by=p[i+1];
  c.moveTo(ax,ay);c.lineTo(bx,by);c.lineTo(bx+xoff,by+yoff);c.lineTo(ax+xoff,ay+yoff);c.closePath();}
 c.fillStyle=seed%2?'#695d51':'#75695a';c.fill();
 if(zoom>1.6){
  c.strokeStyle='#cdb18b99';c.lineWidth=.55;
  // Edge-specific sunlit facade.
  for(let i=2;i<p.length;i+=2){
   const ax=p[i-2],ay=p[i-1],bx=p[i],by=p[i+1];
   if(by-ay>0){c.beginPath();c.moveTo(ax,ay);c.lineTo(ax+xoff,ay+yoff);c.stroke();}
  }
 }
 polygon(c,p);c.fillStyle=palette[seed%palette.length];c.fill();
 c.strokeStyle='#36392f';c.lineWidth=.82;c.stroke();
 if(zoom>1.55){
  c.save();polygon(c,p);c.clip();
  c.strokeStyle='#f0dbb266';c.lineWidth=.35;
  c.strokeRect(minX+1.2,minY+1.2,Math.max(0,maxX-minX-2.4),Math.max(0,maxY-minY-2.4));
  const w=maxX-minX,h=maxY-minY,area=w*h;
  if(area>75){
   // Rooftop vents, skylights, seams, AC units.
   for(let i=0;i<Math.min(6,Math.floor(area/90));i++){
    const x=minX+5+(hash(seed+i*8)%1000)/1000*Math.max(1,w-10);
    const y=minY+5+(hash(seed+i*17)%1000)/1000*Math.max(1,h-10);
    c.fillStyle='#555b56';c.fillRect(x-1.3,y-1,2.5,2);
    c.fillStyle='#d6d0aa';c.fillRect(x-1.1,y-1,1.5,.55);
    c.strokeStyle='#444c47';c.lineWidth=.35;c.strokeRect(x-1.3,y-1,2.5,2);
   }
  }
  if(area>130){
   c.lineWidth=.35;c.strokeStyle='#6d695c99';
   for(let x=minX+7;x<maxX;x+=9){
    c.beginPath();c.moveTo(x,minY+2);c.lineTo(x,maxY-2);c.stroke();
   }
  }
  c.restore();
 }
 c.restore();
}
export function drawArchitecture(c,buildings,zoom){
 // Farther footprints rendered first to avoid rooftop shadows cutting in front of nearby ones.
 const sorted=buildings.slice().sort((a,b)=>((a.bounds?.[1]||0)-(b.bounds?.[1]||0)));
 for(const b of sorted)roofs(c,b,zoom);
}
export function drawStreets(c,roads,zoom){
 c.save();c.lineCap='round';c.lineJoin='round';
 // Concrete sidewalks, curb shadow, then asphalt; real centreline geometry unchanged.
 for(const road of roads){
  line(c,road.p);c.lineWidth=visualRoadWidth(road)+5.3;c.strokeStyle='#726f65';c.stroke();
 }
 for(const road of roads){
  line(c,road.p);c.lineWidth=visualRoadWidth(road)+3.1;c.strokeStyle='#c1b59b';c.stroke();
 }
 for(const road of roads){
  line(c,road.p);c.lineWidth=visualRoadWidth(road)+.7;c.strokeStyle='#313b3b';c.stroke();
 }
 for(const road of roads){
  line(c,road.p);c.lineWidth=Math.max(1,visualRoadWidth(road)-1);c.strokeStyle=asphalt[road.t]||'#585c58';c.stroke();
 }
 if(zoom>1.4){
  c.setLineDash([2.2,5.6]);c.lineWidth=.3;c.strokeStyle='#d8bb788c';
  for(const road of roads){
   if(visualRoadWidth(road)<12||road.t==='service'||road.t==='pedestrian')continue;
   line(c,road.p);c.stroke();
  }
  c.setLineDash([]);
 }
 c.restore();
}
export function drawCrosswalks(c,graph,bounds,zoom){
 if(zoom<1.15)return;
 const [x0,y0,x1,y1]=bounds;
 const nodes=graph.nodes,edges=graph.edges;
 c.save();
 let drawn=0;
 for(let i=0;i<nodes.length;i++){
  const node=nodes[i];
  if(node.x<x0-30||node.x>x1+30||node.y<y0-30||node.y>y1+30)continue;
  const cars=node.out.filter(id=>edges[id].car);
  if(cars.length<3)continue;
  const unique=new Set(cars.map(id=>Math.round(edges[id].angle*20)));
  if(unique.size<3)continue;
  for(let j=0;j<Math.min(4,cars.length);j++){
   const e=edges[cars[j]],width=Math.max(4,Math.min(21,e.streetWidth-1.4)),a=e.angle,nx=node.x+Math.cos(a)*Math.min(8,e.len*.45),ny=node.y+Math.sin(a)*Math.min(8,e.len*.45);
   if(e.len<9)continue;
   c.save();c.translate(nx,ny);c.rotate(a);
   c.fillStyle='#d9d0bbaa';for(let k=-2;k<=2;k++)c.fillRect(k*1.5,-width/2,.7,width);
   c.restore();
  }
  drawn++;if(drawn>90)break;
 }
 c.restore();
}
function pixelTree(c,x,y,seed){
 const greens=['#465f4b','#537254','#617c51','#6d8058'];
 c.fillStyle='#222d25a9';c.beginPath();c.arc(x+1.5,y+2,4,0,pi*2);c.fill();
 c.fillStyle=greens[seed%4];c.beginPath();c.arc(x,y,4.4,0,pi*2);c.fill();
 c.fillStyle='#7f9a6a';c.fillRect(x-2.2,y-2,2.2,1.6);
 c.fillStyle='#394f41';c.fillRect(x+1,y+.8,1.2,2);
}
function bench(c,x,y,a){
 c.save();c.translate(x,y);c.rotate(a);
 c.fillStyle='#413831';c.fillRect(-2.6,-.6,5.2,1.3);
 c.fillStyle='#c4a073';c.fillRect(-2.6,-.75,5.2,.6);c.fillRect(-2.6,.3,5.2,.6);
 c.restore();
}
function scooter(c,x,y,a){
 c.save();c.translate(x,y);c.rotate(a+pi/2);
 c.fillStyle='#172b2c';c.fillRect(-2.8,-1.2,1.5,2.3);c.fillRect(2,-1.2,1.6,2.3);
 c.fillStyle='#b95342';c.fillRect(-2,-.8,5,1.7);
 c.fillStyle='#dbcdad';c.fillRect(-.2,-1,1.3,2);
 c.fillStyle='#222b2a';c.fillRect(2.4,-2,1,4);
 c.restore();
}
function dumpster(c,x,y,a){
 c.save();c.translate(x,y);c.rotate(a);
 c.fillStyle='#263630';c.fillRect(-2.8,-1.7,5.6,3.4);
 c.fillStyle='#48706a';c.fillRect(-2.4,-1.6,5,3);
 c.fillStyle='#7c9b82';c.fillRect(-2.9,-2,5.8,.8);
 c.strokeStyle='#25352f';c.lineWidth=.35;c.strokeRect(-2.6,-1.9,5.3,3.4);
 c.restore();
}
function lamp(c,x,y){
 c.fillStyle='#1f302d';c.fillRect(x+.5,y+.7,1.1,1.1);
 c.fillStyle='#344642';c.fillRect(x-.4,y-.4,.7,1.4);
 c.fillStyle='#f4d59c';c.beginPath();c.arc(x,y,1,0,pi*2);c.fill();
}
export function drawStreetProps(c,props,zoom){
 if(zoom<.85)return;
 for(const p of props){
  // Urban Melito: isolated street trees rather than dense roadside greenery.
  if(p.kind<2)pixelTree(c,p.x,p.y,p.kind);
  else if(p.kind<4)lamp(c,p.x,p.y);
  else if(p.kind<6)bench(c,p.x,p.y,p.a);
  else if(p.kind===6||p.kind===7)dumpster(c,p.x,p.y,p.a);
  else if(p.kind===8||p.kind===9)scooter(c,p.x,p.y,p.a);
  else if(p.kind<14)lamp(c,p.x,p.y);
  else{
   c.fillStyle='#a6a08b';c.fillRect(p.x-1.4,p.y-1.4,2.8,2.8);
   c.fillStyle='#77715c';c.fillRect(p.x-1,p.y-1,2,2);
  }
 }
}

/* Signboards use real OSM POI names, but their illustrated storefront styling is fictional. */
export function drawPoiSigns(c,pois,bounds,zoom){
 if(zoom<1.7)return;
 const [x0,y0,x1,y1]=bounds;
 for(const poi of pois){
  const [x,y]=poi.p;
  if(x<x0||x>x1||y<y0||y>y1||!poi.n)continue;
  const isShop=!!poi.k&&/shop|supermarket|bakery|clothes|hairdresser|convenience|butcher|greengrocer/i.test(poi.k);
  const caption=String(poi.n).toUpperCase().slice(0,24);
  const w=Math.max(12,Math.min(60,caption.length*2.55+6));
  c.save();c.translate(x,y);
  c.fillStyle='#1e2f2e';c.fillRect(-1.25,-1.25,2.5,2.5);
  c.fillStyle=isShop?'#e5bb79':'#a5d0b6';c.fillRect(-.8,-.8,1.6,1.6);
  c.fillStyle='#1c2826c9';c.fillRect(2-w/2,-8.4,w,6.4);
  c.fillStyle=isShop?'#9d483b':'#46665e';c.fillRect(2-w/2,-8.4,w,1.15);
  c.strokeStyle='#cfc7a18c';c.lineWidth=.35;c.strokeRect(2-w/2,-8.4,w,6.4);
  c.font='bold 3.1px monospace';c.textAlign='center';c.fillStyle='#fff3d3';
  c.fillText(caption,2,-3.65,w-3);
  c.restore();
 }
}
