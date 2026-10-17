/* WORK HANDOFF: art direction / photo evidence / acceptance criteria live
 * in ./HANDOFF_WORK_REALISMO.md (see also ./AGENTS.md).
 * Do not claim hypothetical materials or pixel geometry as photo-verified.
 */
import {visualRoadWidth} from './road-widths.mjs?v=043';
import {SIDEWALK_OUTER,SIDEWALK_SHADOW,SIDEWALK_KERB} from './sidewalk.mjs?v=099';
import {buildingVolume,exposedFacade,facadePoints,shiftColor} from './building-volume.mjs?v=088';
import {material} from './arcade-materials.mjs?v=095';
/* GTA Melito 0.4 — top-down pixel-inspired art, © OpenStreetMap contributors
 * Layout/footprints come from OSM. Colours, rooftop details, props and human sprites
 * are original artistic interpretations: they do not claim photographic fidelity.
 */
const PI=Math.PI,TAU=2*PI;
const asphalt={motorway:'#292f31',trunk:'#303638',primary:'#333a3b',secondary:'#38403f',
 tertiary:'#3c4341',residential:'#3d4442',unclassified:'#414846',service:'#4a4a43',
 living_street:'#514e45',footway:'#b5a68d',pedestrian:'#c2b193',path:'#a79679',
 steps:'#a6957e',track:'#747565'};
// Warm, high-contrast rooftops and cool shadow faces evoke GTA2's readable
// arcade blocks while retaining an original Campanian palette.
const oldtown=['#c65e3f','#ce7047','#bb6344','#d17a4a','#b85b3c','#c66a43'];
const flat=['#a6a093','#a69a87','#b2a18b','#99978a','#b5a58e','#8d9189'];
const metal=['#7f938e','#73847f','#969a8d'];
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
 // The centre around Piazza Santo Stefano contains a dense historic fabric.
 // Roof profiles there are a stylised hypothesis, never a measured facade.
 if(near(box.cx,box.cy,1100,1150)<410&&box.area<1500&&(!b.lv||b.lv<5))return 'historic';
 if(/apartments|residential|terrace/.test(type)||box.area>500||(b.lv&&b.lv>=4))return 'apartment';
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
/* Approved Melito arcade art direction. Applies only to unsurveyed stylistic
 * drafts; explicit OSM flat-roof tags and photo-verified features win. */
export function applyApprovedArcadeRoofStyle(buildings){
 const terracotta=['#df7139','#e98343','#ce5d30','#e27737','#d66733','#e48a48'];
 const facades=['#e8bc77','#edcd94','#dcab69','#f1d8a3','#d99b5f','#e9bf83'];
 let count=0;
 for(const b of buildings){
  const a=b.art,category=a?.surveyCategory;
  if(!a||a.surveyStatus==='photo-verified')continue;
  a.facadeTint=facades[h(b.id)%facades.length];
  if(b.roof==='flat')continue;
  const aspect=Math.max(a.w,a.h)/Math.max(1,Math.min(a.w,a.h));
  const seed=h(b.id);
  const pitched=category==='historical'&&a.area<430||
   category==='residential'&&a.area<1200&&aspect<4&&seed%4!==0||
   category==='lowrise'&&aspect<4;
  if(!pitched)continue;
  a.roof=true;
  a.roofTint=terracotta[(seed>>>5)%terracotta.length];
  if(a.surveyFeatures)a.surveyFeatures={...a.surveyFeatures,roofKind:'pitched-clay'};
  count++;
 }
 return count;
}
/* Parcel-like surface colours are estimated from actual OSM building
 * density and road proximity, not claimed as surveyed lawns or pavements. */
export function prepareUrbanGround(buildings,roads){
 const grid=new Map(),cell=28;
 const mark=(x,y,n)=>{
  const gx=Math.floor(x/cell),gy=Math.floor(y/cell);
  for(let ox=-1;ox<=1;ox++)for(let oy=-1;oy<=1;oy++){
   const key=(gx+ox)+','+(gy+oy);
   grid.set(key,Math.min(8,(grid.get(key)||0)+(ox===0&&oy===0?n:1)));
  }
 };
 for(const b of buildings){
  const a=b.art;if(!a)continue;
  mark(a.cx,a.cy,3);
  if(a.w>25||a.h>25){
   for(let x=a.x0;x<=a.x1;x+=28)for(let y=a.y0;y<=a.y1;y+=28)mark(x,y,2);
  }
 }
 for(const road of roads){
  const p=road.p;
  for(let i=2;i<p.length;i+=2){
   const ax=p[i-2],ay=p[i-1],dx=p[i]-ax,dy=p[i+1]-ay,len=Math.hypot(dx,dy);
   for(let d=0;d<=len;d+=24)mark(ax+dx*d/(len||1),ay+dy*d/(len||1),2);
  }
 }
 return grid;
}
export function drawTerrain(c,bb,zoom,ground=null){
 const [x0,y0,x1,y1]=bb;
 c.fillStyle=material(c,'stone','#cfb58e');c.fillRect(x0,y0,x1-x0,y1-y0);
 // Courtyard shading breaks up the repeating stone without random frame noise.
 c.fillStyle='#70573f18';
 for(let x=Math.floor(x0/28)*28;x<x1;x+=28)for(let y=Math.floor(y0/28)*28;y<y1;y+=28){
  const seed=h(x*907+y*1867);
  if(seed%5===0)c.fillRect(x+2,y+2,24,24);
 }
}
export function drawCityStreets(c,roads,zoom){
 c.save();c.lineJoin='round';c.lineCap='round';
 const pedestrian=r=>['footway','pedestrian','path','steps'].includes(r.t);
 const coat=(extra,color)=>{for(const road of roads){
  line(c,road.p);c.lineWidth=Math.max(1,visualRoadWidth(road)+extra);c.strokeStyle=pedestrian(road)?color.ped:color.car;c.stroke();
 }};
 coat(SIDEWALK_OUTER*2,{ped:'#424843',car:'#292f2d'}); // hard outer silhouette
 coat(SIDEWALK_SHADOW*2,{ped:'#c5ac83',car:'#c5ac83'}); // cast curb shadow
 coat(SIDEWALK_KERB*2,{ped:'#f0d4a8',car:'#f0d4a8'}); // sunlit kerb / paving edge
 for(const road of roads){
  line(c,road.p);c.lineWidth=Math.max(1,visualRoadWidth(road)-.5);c.strokeStyle=pedestrian(road)?material(c,'stone','#d6bf98'):material(c,'asphalt','#303638');c.stroke();
 }
 if(zoom>=1.3){
  // Lane paint belongs on the main avenues; small residential streets stay
  // visually quiet and avoid the old citywide dashed-line effect.
  for(const road of roads){
   if(!['motorway','trunk','primary','secondary'].includes(road.t)||visualRoadWidth(road)<12.5)continue;
   c.setLineDash(road.t==='primary'||road.t==='trunk'?[4.2,5.4]:[3.2,6.4]);
   c.lineWidth=road.t==='trunk'?.48:.34;
   c.strokeStyle=road.t==='primary'||road.t==='trunk'?'#e6d5a6c2':'#ddd8c09a';
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
 c.save();poly(c,b.p);c.clip();
 c.fillStyle=material(c,'clay','#d96b36');c.fillRect(x0,y0,w,bh);
 // Two distinct illuminated planes and a continuous ridge cap.
 c.fillStyle='#68281550';
 if(w>bh)c.fillRect(x0,cy,w,bh/2);else c.fillRect(cx,y0,w/2,bh);
 c.strokeStyle='#7d321e';c.lineWidth=1.1;c.beginPath();
 if(w>bh){c.moveTo(x0,cy);c.lineTo(x1,cy);}else{c.moveTo(cx,y0);c.lineTo(cx,y1);}c.stroke();
 c.strokeStyle='#ffba74';c.lineWidth=.48;c.beginPath();
 if(w>bh){c.moveTo(x0,cy-.45);c.lineTo(x1,cy-.45);}else{c.moveTo(cx-.45,y0);c.lineTo(cx-.45,y1);}c.stroke();
 if(w>13&&bh>13){
  const x=x0+w*.27,y=y0+bh*.31;
  c.fillStyle='#462e2470';c.fillRect(x+1,y+1,3.3,4);
  c.fillStyle='#e4c69a';c.fillRect(x-1,y-2.5,2.4,3.8);
  c.fillStyle='#784731';c.fillRect(x-1.4,y-3,3.2,1.1);
  c.fillStyle='#302b25';c.fillRect(x-.8,y-2.9,1.8,.55);
 }
 roofHardware(c,art);
 c.restore();
}
function roofHardware(c,a){
 const {x0,y0,w,h:bh,seed}=a;if(w<12||bh<12)return;
 const x=x0+w*.71,y=y0+bh*.3;
 if(seed%3!==0){
  c.fillStyle='#18272d65';c.beginPath();c.ellipse(x+1.1,y+2.3,2.1,1.3,0,0,TAU);c.fill();
  c.fillStyle=seed%2?'#236678':'#28558b';c.fillRect(x-1.5,y-2.3,3,3.7);
  c.beginPath();c.ellipse(x,y+1.4,1.5,.65,0,0,TAU);c.fill();
  c.fillStyle='#619ca5';c.beginPath();c.ellipse(x,y-2.3,1.5,.65,0,0,TAU);c.fill();
  c.fillStyle='#b5d0c0';c.fillRect(x-.8,y-2,.35,2.5);
  c.strokeStyle='#173e55';c.lineWidth=.25;
  for(let j=0;j<3;j++){c.beginPath();c.moveTo(x-1.4,y-.7+j*.7);c.lineTo(x+1.4,y-.7+j*.7);c.stroke();}
 }
 if(seed%2===0){
  c.fillStyle='#dddcc5';c.beginPath();c.ellipse(x-4,y+3,1.6,1.1,-.6,0,TAU);c.fill();
  c.strokeStyle='#56636a';c.lineWidth=.3;c.beginPath();c.moveTo(x-4,y+3);c.lineTo(x-3,y+1);c.stroke();
 }
}
function flatRoof(c,b,art,tone){
 const {x0,y0,x1,y1,cx,cy,w,h:bh,area,seed}=art;
 c.save();poly(c,b.p);c.clip();
 c.fillStyle=material(c,'stone',tone);c.fillRect(x0,y0,w,bh);
 if(art.type!=='industrial'&&area>150){
  c.strokeStyle='#6c64552b';c.lineWidth=.22;c.beginPath();
  for(let x=x0+5;x<x1;x+=6){c.moveTo(x,y0+1);c.lineTo(x,y1-1);}
  for(let y=y0+5;y<y1;y+=6){c.moveTo(x0+1,y);c.lineTo(x1-1,y);}
  c.stroke();
 }
 c.strokeStyle='#e6dcc0aa';c.lineWidth=.5;
 c.strokeRect(x0+1.3,y0+1.3,Math.max(0,w-2.6),Math.max(0,bh-2.6));
 if(area>55){
  const steps=Math.min(4,Math.floor(area/320)+1);
  for(let j=0;j<steps;j++){
   const x=x0+4+rnd(seed+j*37+11)*Math.max(1,w-8);
   const y=y0+4+rnd(seed+j*61+19)*Math.max(1,bh-8);
   c.fillStyle='#27312e58';c.fillRect(x-1.3,y-1,4.5,3.4);
   c.fillStyle=j%3?'#85877b':'#c1b49b';c.fillRect(x-1.5,y-1.5,3.8,2.8);
   c.fillStyle='#4c5853';c.fillRect(x-.8,y-.8,2.2,1.1);
   c.fillStyle='#e8d6b378';c.fillRect(x-1.2,y-1.4,3,.4);
  }
 }
 if(art.type==='apartment'&&area>220){
  // Antennas, roof stairs and a small water reservoir — drawn as texture.
  c.fillStyle='#c1baab';c.fillRect(cx-2.9,cy-2.7,5.8,5);
  c.strokeStyle='#777365';c.lineWidth=.35;c.strokeRect(cx-2.9,cy-2.7,5.8,5);
  c.fillStyle='#464b48';c.fillRect(cx+1,cy-2,1.4,3.8);
 }

 roofHardware(c,art);
 const features=art.surveyFeatures;
 if(features?.roofTerrace&&area>120&&w>10&&bh>10){
  // Stairwell access, light parapet and a few drying lines; original arcade art.
  c.fillStyle='#ddd2bd';c.fillRect(cx-4,cy-2.8,8,5.6);
  c.strokeStyle='#77786e';c.lineWidth=.5;c.strokeRect(cx-4,cy-2.8,8,5.6);
  c.fillStyle='#4b5553';c.fillRect(cx-1.6,cy-1,3.3,2);
  c.strokeStyle='#d9d0b3';c.lineWidth=.23;
  for(let i=0;i<3;i++){c.beginPath();c.moveTo(x0+3,y0+4+i*2.3);c.lineTo(Math.min(x1-3,x0+16),y0+4+i*2.3);c.stroke();}
 }
 if(features?.roofTanks&&w>16&&bh>15){
  c.fillStyle='#465755';c.fillRect(x1-8,y0+5,3.1,3.1);
  c.fillStyle='#b5c1b9';c.fillRect(x1-7.5,y0+4.3,2.1,3);
 }
 if(features?.roofPanels&&w>20&&bh>16){
  const count=Math.min(5,Math.max(2,Math.floor(w/9)));
  for(let i=0;i<count;i++){
   const x=x0+4+i*7.5,y=y0+Math.max(4,bh*.3);
   c.fillStyle='#2f5260';c.fillRect(x,y,5.8,3.4);
   c.strokeStyle='#c0cbbb';c.lineWidth=.33;c.strokeRect(x,y,5.8,3.4);
   c.beginPath();c.moveTo(x+2.9,y);c.lineTo(x+2.9,y+3.4);c.stroke();
  }
 }
 if(features?.courtyard&&area>450&&w>22&&bh>22){
  const iw=Math.min(w*.32,12),ih=Math.min(bh*.25,9);
  c.fillStyle='#727c70';c.fillRect(cx-iw/2,cy-ih/2,iw,ih);
  c.strokeStyle='#d2c0a0';c.lineWidth=.65;c.strokeRect(cx-iw/2,cy-ih/2,iw,ih);
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
  // Santa Maria delle Grazie: architectural silhouette from named historic
  // building photos (municipal site, FAI, ICCD heritage catalogue).
  // The tower is schematically placed beside the true OSM church footprint;
  // its exact roof-level survey coordinates are not established.
  c.save();poly(c,b.p);c.clip();
  c.fillStyle='#e7ddc1';c.fillRect(art.x0,art.y0,w,bh);
  c.strokeStyle='#bbaa8a';c.lineWidth=1.1;
  c.strokeRect(art.x0+1.6,art.y0+1.6,Math.max(0,w-3.2),Math.max(0,bh-3.2));
  // Baroque front cornice and paired stone ribs.
  c.strokeStyle='#d4c2a1';c.lineWidth=.9;
  for(const dx of [-.26,.26]){c.beginPath();c.moveTo(cx+w*dx,art.y0+2);
   c.lineTo(cx+w*dx,art.y1-2);c.stroke();}
  c.restore();
  // Concave entrance, paired pilasters and oculus: original roof-level glyph
  // of the documented facade. Placement/proportions are symbolic, not a survey.
  c.save();poly(c,b.p);c.clip();
  const frontY=art.y1-3.8,frontX=1092.2;
  c.strokeStyle='#796f5c';c.lineWidth=1.15;
  c.beginPath();c.moveTo(frontX-12,frontY-2);c.quadraticCurveTo(frontX,frontY-7,frontX+12,frontY-2);c.stroke();
  c.strokeStyle='#f8edd3';c.lineWidth=1.5;
  for(const dx of [-10,-6,6,10]){c.beginPath();c.moveTo(frontX+dx,frontY-5);c.lineTo(frontX+dx,frontY+1);c.stroke();}
  c.fillStyle='#554c40';c.fillRect(frontX-2,frontY-3.5,4,4);
  c.fillStyle='#e9d5ac';c.fillRect(frontX-3,frontY-4.4,6,.8);
  c.fillStyle='#615f54';c.beginPath();c.arc(frontX,frontY-7,1.45,0,TAU);c.fill();
  c.strokeStyle='#eee3c6';c.lineWidth=.65;c.stroke();c.restore();
  const radius=clamp(Math.min(w,bh)*.24,4,12);
  c.save();c.translate(cx,cy);
  c.fillStyle='#b09f82';c.beginPath();c.arc(1.2,1.6,radius+1.8,0,TAU);c.fill();
  // Stepped silhouette, shaded courses and ribs keep the dome legible as
  // pixel art at walking zoom, with a single light direction.
  c.fillStyle='#607176';c.beginPath();
  const rr=radius+1.2,step=rr/5;
  for(let row=-5;row<=5;row++){
   const yy=row*step,half=Math.round(Math.sqrt(Math.max(0,rr*rr-yy*yy))/step)*step;
   c.rect(-half,yy,half*2,step);
  }
  c.fill();
  // No stroke on individual pixel courses: that would stripe the dome.
  for(let j=0;j<10;j++){const a=j*TAU/10;c.strokeStyle='#aab2a9';c.lineWidth=.35;
   c.beginPath();c.moveTo(0,0);c.lineTo(Math.cos(a)*radius,Math.sin(a)*radius);c.stroke();}
  c.fillStyle='#ded2ae';c.beginPath();c.arc(0,0,radius*.28,0,TAU);c.fill();
  c.strokeStyle='#463e34';c.lineWidth=.8;c.beginPath();c.moveTo(0,-radius*.38);c.lineTo(0,radius*.38);
  c.moveTo(-radius*.25,-radius*.08);c.lineTo(radius*.25,-radius*.08);c.stroke();
  c.restore();
  // Octagonal pale lantern above the slate dome.
  c.save();c.translate(cx,cy);
  c.fillStyle='#d7d1ba';c.beginPath();
  for(let j=0;j<8;j++){const a=Math.PI/8+j*Math.PI/4;
   const x=Math.cos(a)*radius*.38,y=Math.sin(a)*radius*.38;
   if(j===0)c.moveTo(x,y);else c.lineTo(x,y);}
  c.closePath();c.fill();c.lineWidth=.45;c.strokeStyle='#65685d';c.stroke();
  c.fillStyle='#566774';c.fillRect(-1,-1,2,2);
  c.restore();
  // Distinctive brick bell tower and white clock, both seen in photos.
  // Draw slightly offset from the OSM church roof: an illustrative rooftop
  // landmark, NOT a measured building extension.
  const bx=art.x1-5,by=art.y1-9;
  c.fillStyle='#262f31a0';c.fillRect(bx-3.7,by-2.1,11,11);
  c.fillStyle='#a05f46';c.fillRect(bx-5,by-5,10,10);
  c.strokeStyle='#e2bb88';c.lineWidth=.7;c.strokeRect(bx-5,by-5,10,10);
  for(let q=-3;q<5;q+=2){
   c.strokeStyle='#be9474';c.lineWidth=.3;c.beginPath();
   c.moveTo(bx-4.8,by+q);c.lineTo(bx+4.8,by+q);c.stroke();
  }
  c.fillStyle='#333b38';c.fillRect(bx-2.3,by-4,4.6,2.1);
  c.fillStyle='#ede6d6';c.beginPath();c.arc(bx,by+1.15,2.25,0,TAU);c.fill();
  c.strokeStyle='#595b55';c.lineWidth=.38;c.stroke();
  c.beginPath();c.moveTo(bx,by+1.15);c.lineTo(bx,by-.1);c.lineTo(bx+1.1,by+1.5);c.stroke();
  return true;
 }
 if(art.type==='civic'){
  roofOutline(c,b.p,'#aa685e',.8);
  c.save();poly(c,b.p);c.clip();
  c.strokeStyle='#e4b6a0';c.lineWidth=.75;
  c.strokeRect(art.x0+2,art.y0+2,Math.max(0,w-4),Math.max(0,bh-4));
  c.fillStyle='#828a8a';c.fillRect(cx-3.5,cy-2,7,4);
  c.fillStyle='#d1bdaa';c.fillRect(cx-2.7,cy-1.5,5.4,3);
  // Civic identification, not an assertion about the actual flag location.
  c.fillStyle='#416b55';c.fillRect(cx-3,cy+4,2,3);
  c.fillStyle='#e9e2cf';c.fillRect(cx-1,cy+4,2,3);
  c.fillStyle='#ac594b';c.fillRect(cx+1,cy+4,2,3);
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
/* Universal extruded cityscape.
 * Every OSM and synthetic building gets foundation, directional side faces,
 * floor bands, windows and a raised roof. The building polygon never changes.
 * Floor counts/materials without photo or explicit OSM data are fictional. */
function drawRaisedWalls(c,b,v,zoom){
 const p=b.p,a=b.art;
 const wall=a.facadeTint||
  (a.type==='historic'?'#d0b99c':a.type==='industrial'?'#9da9a6':a.type==='market'?'#b7b5a7':a.type==='church'?'#ded0b6':a.type==='civic'?'#c9b39b':'#c0b19e');
 // Paint a directional contact shadow inside the roof. This gives the block
 // the crisp top-down depth of an arcade city without expanding its footprint.
  c.save();poly(c,p);c.clip();c.translate(Math.min(v.dx,3),Math.min(v.dy,3));
  poly(c,p);c.fillStyle='#17211e55';c.fill();c.restore();
 for(let j=2;j<p.length;j+=2){
  const edgeX=p[j]-p[j-2],edgeY=p[j+1]-p[j-1];
  const len=Math.hypot(edgeX,edgeY);
  if(len<.08||!exposedFacade(edgeX,edgeY,v))continue;
  const f=facadePoints(p,j,v);
  const south=Math.abs(edgeX)>=Math.abs(edgeY),isTall=v.stories>=2;
  c.beginPath();c.moveTo(f.x1,f.y1);c.lineTo(f.x2,f.y2);
  c.lineTo(f.x3,f.y3);c.lineTo(f.x4,f.y4);c.closePath();
  c.fillStyle=shiftColor(wall,south?8:-28);c.fill();
  // A crisp light lip separates the upper wall from its shaded face.
  c.lineWidth=.82;c.strokeStyle=shiftColor(wall,38);
  c.beginPath();c.moveTo(f.x1,f.y1);c.lineTo(f.x2,f.y2);c.stroke();
  // The wall-top lip, ground sill and vertically expressed front corners
  // visually join the facades to the roof and projected ground footprint.
  c.lineWidth=.55;
  c.strokeStyle=shiftColor(wall,-54);
  c.beginPath();c.moveTo(f.x4,f.y4);c.lineTo(f.x3,f.y3);c.stroke();
  c.lineWidth=.55;c.strokeStyle=shiftColor(wall,-27);
  c.beginPath();c.moveTo(f.x2,f.y2);c.lineTo(f.x3,f.y3);c.stroke();
  if(zoom>=1.5&&len>10&&south&&a.type!=='industrial'){
   const ux=edgeX/len,uy=edgeY/len,span=Math.min(8,len*.55),cx=(f.x3+f.x4)/2,cy=(f.y3+f.y4)/2;
   // Shopfront canopy on the ground storey: striped fabric, dark valance,
   // doorway and a pair of terracotta pots, all original stylized decoration.
   c.fillStyle='#25423a';c.fillRect(cx-1.3,cy-3.1,2.6,3);
   const colors=a.seed%3===0?['#af3b30','#f8dfab']:['#21745b','#f4dfa7'];
   for(let k=0;k<8;k++){
    const t=(k/8-.5)*span,t2=((k+1)/8-.5)*span;
    c.beginPath();c.moveTo(cx+ux*t-v.dx*.22,cy+uy*t-v.dy*.22);
    c.lineTo(cx+ux*t2-v.dx*.22,cy+uy*t2-v.dy*.22);
    c.lineTo(cx+ux*t2,cy+uy*t2-.1);c.lineTo(cx+ux*t,cy+uy*t-.1);c.closePath();
    c.fillStyle=colors[k%2];c.fill();
   }
   c.strokeStyle='#183a30';c.lineWidth=.45;c.beginPath();c.moveTo(cx-ux*span/2,cy-uy*span/2);c.lineTo(cx+ux*span/2,cy+uy*span/2);c.stroke();
   for(const side of [-1,1]){const px=cx+ux*(span/2+1)*side,py=cy+uy*(span/2+1)*side;
    c.fillStyle='#b55f35';c.fillRect(px-.6,py-1,1.2,1.2);
    c.fillStyle='#39773e';c.fillRect(px-.9,py-2.2,1.8,1.5);
    c.fillStyle='#90b546';c.fillRect(px-.6,py-2.2,.7,.55);
   }
  }
  if(zoom<1.1||len<2.6)continue;
  // Floor separation is visible even on very narrow buildings.
  const floors=Math.min(v.stories,3),shiftX=v.dx,shiftY=v.dy;
  for(let floor=1;floor<floors;floor++){
   const t=floor/floors;
   c.strokeStyle=shiftColor(wall, south?-25:-45);c.lineWidth=.32;
   c.beginPath();c.moveTo(f.x1+shiftX*t,f.y1+shiftY*t);
   c.lineTo(f.x2+shiftX*t,f.y2+shiftY*t);c.stroke();
   c.strokeStyle='#f1e1c05c';c.lineWidth=.23;
   c.beginPath();c.moveTo(f.x1+shiftX*t,f.y1+shiftY*t-.42);
   c.lineTo(f.x2+shiftX*t,f.y2+shiftY*t-.42);c.stroke();
  }
  if(zoom<1.3||len<6)continue;
  const doors=a.type==='industrial'||a.type==='market';
  const columns=Math.max(1,Math.min(18,Math.floor(len/(doors?7.5:4.8))));
  for(let floor=0;floor<floors;floor++){
   const tv=(floor+.48)/floors;
   for(let col=1;col<=columns;col++){
    const tu=col/(columns+1);
    const wx=f.x1+edgeX*tu+shiftX*tv,wy=f.y1+edgeY*tu+shiftY*tv;
    const windowSeed=h(a.seed+floor*97+col*131+j*17);
    const w=doors?2.4:windowSeed%4===0?1.8:1.45,hh=floors>=5?1.35:1.85;
    c.fillStyle='#283532';c.fillRect(wx-w*.58,wy-hh*.59,w*1.16,hh*1.12);
    c.fillStyle=windowSeed%7===0?'#a9664c':windowSeed%5===0?'#344c50':'#273e43';
    c.fillRect(wx-w*.5,wy-hh*.55,w,hh);
    c.fillStyle=windowSeed%7===0?'#dfb173a8':'#abc4c085';
    c.fillRect(wx-w*.34,wy-hh*.42,w*.28,hh*.58);
    c.fillStyle=shiftColor(wall,40);
    c.fillRect(wx-w*.72,wy+hh*.43,w*1.44,.38);
    c.fillStyle=shiftColor(wall,-22);c.fillRect(wx-w*.56,wy-hh*.63,w*1.12,.24);
    if(windowSeed%4===0&&len>12){
     const shutter=windowSeed%2?'#256556':'#244d56';
     c.fillStyle=shutter;c.fillRect(wx-w*.5-1.1,wy-hh*.58,.55,hh*1.15);
     c.fillRect(wx+w*.5+.55,wy-hh*.58,.55,hh*1.15);
    }
    if((a.surveyFeatures?.balconies||['apartment','historic','house','mixed'].includes(a.type))&&isTall&&floor>0&&col%3===1&&windowSeed%3!==1){
     c.fillStyle='#454b45';c.fillRect(wx-1.7,wy+hh*.65,3.4,.45);
     c.strokeStyle='#66706d';c.lineWidth=.28;
     c.strokeRect(wx-1.7,wy+hh*.22,3.4,1.05);
     c.fillStyle='#487c38';c.fillRect(wx-1.4,wy+hh*.55,1.3,.65);
     c.fillStyle='#d64b32';c.fillRect(wx-1.1,wy+hh*.48,.38,.35);
    }
    if(a.type==='apartment'&&floor>0&&col%3===0&&windowSeed%2===0){
     // Small external AC housings: a stable urban detail, deliberately not
     // assigned to any one photo-unverified building as a factual feature.
     c.fillStyle='#2d3835';c.fillRect(wx-1.15,wy+hh*.55,2.3,.85);
     c.fillStyle='#b7b3a3';c.fillRect(wx-.9,wy+hh*.64,1.8,.22);
    }
   }
  }
 }
}
export function drawCityBuildings(c,buildings,zoom){
 const sorted=[...buildings].filter(b=>b.art).sort((a,b)=>{
  const va=buildingVolume(a),vb=buildingVolume(b);
  const bottomA=a.art.y1+(va?.dy||0),bottomB=b.art.y1+(vb?.dy||0);
  return bottomA-bottomB||a.id-b.id;
 });
 for(const b of sorted){
  const a=b.art,v=buildingVolume(b);
  if(!v)continue;
  const seed=a.seed;
  c.save();
  // Directional ground shadow, then lift the roof; wall bases retain the
  // original OSM footprint and collision coordinates.
  c.save();c.translate(v.dx*.4+2,v.dy*.32+2);poly(c,b.p);c.fillStyle='#19252a50';c.fill();c.restore();
  c.translate(-v.dx,-v.dy);
  drawRaisedWalls(c,b,v,zoom);
  const tone=a.roofTint||historicalRoofTone(a);
  if(!specialized(c,b,a)){
   if(a.roof&&a.area>55)slopedRoof(c,b,a,tone);
   else flatRoof(c,b,a,a.roofTint||
    (a.type==='industrial'?metal[seed%3]:a.type==='apartment'?flat[seed%6]:tone));
  }
  // High-contrast raised parapet defines the roof above the façades,
  // including tiny annexes, historic churches and one-floor workshops.
  poly(c,b.p);c.strokeStyle='#643c29';c.lineWidth=.65;c.stroke();
  c.save();c.translate(-.55,-.55);poly(c,b.p);
  c.strokeStyle='#f1d9ac88';c.lineWidth=.48;c.stroke();c.restore();
  if(zoom>=1.45&&(b.id===733703600||/Chiesa di Santa Maria delle Grazie/i.test(b.n||''))){
   const label=b.id===733703600?'MUNICIPIO':'S. MARIA DELLE GRAZIE';
   const width=b.id===733703600?28:54;
   c.fillStyle='#162821e0';c.fillRect(a.cx-width/2,a.y0-8,width,5.7);
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
 const seed=h(type+41),col=['#cf3730','#e4b74c','#367caa','#477d67','#eee0b8','#9fa9ac','#e8d8af'][type%7];
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
 if(focused){c.fillStyle='#ffe7a8';c.fillRect(-.4,-.45,.8,.9);}
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
