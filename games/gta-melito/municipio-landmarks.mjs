/* GTA Melito — BF12: il complesso del Municipio.
 * - Torre del serbatoio idrico «a fungo» (serbatoio pensile), simbolo del quartiere, dipinta a scacchi:
 *   posizione dalla foto aerea Esri World Imagery (fusto al centro dell'edificio tondo OSM 733703519,
 *   vasca a fungo con copertura a spicchi). I COLORI della scacchiera e l'altezza sono STIME: non ci
 *   sono foto verificate. Landmark disegnato sopra la città, con ombra lunga, e trasparente quando il
 *   giocatore gli passa vicino (come i tetti).
 * - Ex piscina comunale di via Madrid, in rovina e interrata (bonifica conclusa il 15/01/2025, fonte
 *   Melitonline): l'edificio tondo diventa un rudere senza copertura, con la vasca vuota e crepata sotto
 *   il livello del terreno. La posizione della vasca dentro l'edificio è una stima.
 * Il poligono OSM non cambia: resta l'ostacolo di sempre, nessuno ci cade dentro. */
const TAU=Math.PI*2;
// The game's 2.5D lift (building-volume.mjs): height goes up-left on screen.
export const UP=Object.freeze({x:-.22,y:-.66});

export function prepareWaterTowers(data){
 return (data?.landmark||[]).filter(l=>l.tipo==='torre-serbatoio').map(l=>({id:l.id,x:l.x,y:l.y,
  height:l.altezza||40,shaft:l.raggioFusto||2.3,tank:l.raggioVasca||11,tankFrom:l.vascaDa||.64,
  colors:l.colori||['#c3392d','#f0ebdf'],name:l.nome}));
}
export function towerPoint(t,h){return {x:t.x+UP.x*h,y:t.y+UP.y*h};}
/* Fade target: see-through while an actor stands under the tank or next to the shaft. */
export function towerRevealTarget(t,actors){
 const top=towerPoint(t,t.height*.86),shaftTop=towerPoint(t,t.height*t.tankFrom);
 for(const a of actors||[]){
  if(!a)continue;
  if(Math.hypot(a.x-top.x,a.y-top.y)<t.tank+3)return .3;
  const dx=shaftTop.x-t.x,dy=shaftTop.y-t.y,l=dx*dx+dy*dy,u=Math.max(0,Math.min(1,((a.x-t.x)*dx+(a.y-t.y)*dy)/l));
  if(Math.hypot(a.x-t.x-dx*u,a.y-t.y-dy*u)<t.shaft+3.5)return .3;
 }
 return 1;
}
export function checker(row,col,colors){return colors[(row+col)%2];}
function shade(hex,d){
 const n=parseInt(hex.slice(1),16),c=s=>Math.max(0,Math.min(255,((n>>s)&255)+d));
 return '#'+[c(16),c(8),c(0)].map(v=>v.toString(16).padStart(2,'0')).join('');
}
/* Long ground shadow, drawn under the tower (dynamic layer, before the tower itself). */
function drawTowerShadow(c,t){
 const L=t.height*.62,sx=.62,sy=.5,ex=t.x+sx*L,ey=t.y+sy*L;
 c.save();c.fillStyle='#16201d3d';
 const px=-sy,py=sx,w=t.shaft;
 c.beginPath();c.moveTo(t.x+px*w,t.y+py*w);c.lineTo(ex+px*w,ey+py*w);c.lineTo(ex-px*w,ey-py*w);c.lineTo(t.x-px*w,t.y-py*w);c.closePath();c.fill();
 c.beginPath();c.ellipse(ex+sx*t.tank*.55,ey+sy*t.tank*.55,t.tank*1.05,t.tank*.8,Math.atan2(sy,sx),0,TAU);c.fill();
 c.restore();
}
export function drawWaterTower(c,t,{alpha=1,zoom=1}={}){
 c.save();c.globalAlpha=alpha;
 drawTowerShadow(c,t);
 // shaft: a cylinder seen from above-south, two columns of checker squares (lit left, shaded right)
 const base={x:t.x,y:t.y},neck=towerPoint(t,t.height*t.tankFrom);
 const ux=neck.x-base.x,uy=neck.y-base.y,ul=Math.hypot(ux,uy),px=-uy/ul,py=ux/ul,r=t.shaft;
 const rows=Math.max(6,Math.round(ul/2.4));
 for(let i=0;i<rows;i++)for(let col=0;col<2;col++){
  const a=i/rows,b=(i+1)/rows,o0=col?0:-r,o1=col?r:0;
  c.beginPath();
  c.moveTo(base.x+ux*a+px*o0,base.y+uy*a+py*o0);c.lineTo(base.x+ux*b+px*o0,base.y+uy*b+py*o0);
  c.lineTo(base.x+ux*b+px*o1,base.y+uy*b+py*o1);c.lineTo(base.x+ux*a+px*o1,base.y+uy*a+py*o1);c.closePath();
  c.fillStyle=shade(checker(i,col,t.colors),col?-34:6);c.fill();
 }
 c.strokeStyle='#2a2622';c.lineWidth=.3;
 c.beginPath();c.moveTo(base.x-px*r,base.y-py*r);c.lineTo(neck.x-px*r,neck.y-py*r);c.moveTo(base.x+px*r,base.y+py*r);c.lineTo(neck.x+px*r,neck.y+py*r);c.stroke();
 // mushroom tank: a frustum from the neck to the rim, checker sectors, then the ribbed cap
 const rim=towerPoint(t,t.height*.86),cap=towerPoint(t,t.height);
 const sectors=20,rings=3;
 for(let ring=0;ring<rings;ring++)for(let k=0;k<sectors;k++){
  const a0=k/sectors*TAU,a1=(k+1)/sectors*TAU,f0=ring/rings,f1=(ring+1)/rings;
  const at=(f,ang)=>{const cx=neck.x+(rim.x-neck.x)*f,cy=neck.y+(rim.y-neck.y)*f,rr=r+(t.tank-r)*Math.pow(f,.8);return [cx+Math.cos(ang)*rr,cy+Math.sin(ang)*rr];};
  const q=[at(f0,a0),at(f0,a1),at(f1,a1),at(f1,a0)];
  // front (south) sectors are lit, the sides darker: a rounded body
  const light=Math.sin((a0+a1)/2)*16-Math.cos((a0+a1)/2)*10;
  c.beginPath();c.moveTo(...q[0]);c.lineTo(...q[1]);c.lineTo(...q[2]);c.lineTo(...q[3]);c.closePath();
  c.fillStyle=shade(checker(ring,k,t.colors),Math.round(light-14));c.fill();
 }
 c.strokeStyle='#2c2723';c.lineWidth=.35;c.beginPath();c.arc(rim.x,rim.y,t.tank,0,TAU);c.stroke();
 // cap: shallow dome with radial ribs (as on the aerial photo)
 const g=c.createRadialGradient(cap.x-t.tank*.3,cap.y-t.tank*.35,1,cap.x,cap.y,t.tank);
 g.addColorStop(0,'#f2efe6');g.addColorStop(1,'#b9b4a6');
 c.fillStyle=g;c.beginPath();c.arc((rim.x+cap.x)/2,(rim.y+cap.y)/2,t.tank*.97,0,TAU);c.fill();
 if(zoom>=1.1){
  c.strokeStyle='#8f8a7c';c.lineWidth=.22;
  for(let k=0;k<18;k++){const a=k/18*TAU;c.beginPath();c.moveTo(cap.x+Math.cos(a)*1.2,cap.y+Math.sin(a)*1.2);
   c.lineTo((rim.x+cap.x)/2+Math.cos(a)*t.tank*.95,(rim.y+cap.y)/2+Math.sin(a)*t.tank*.95);c.stroke();}
 }
 c.fillStyle='#6f6a5f';c.beginPath();c.arc(cap.x,cap.y,1.4,0,TAU);c.fill();
 c.restore();
}
/* Obstruction light on the cap at night (an artistic, not surveyed, detail): drawn above the darkness. */
export function drawWaterTowerLight(c,t,{darkness=0,clock=0,alpha=1}={}){
 if(darkness<.15)return;
 const cap=towerPoint(t,t.height),on=Math.floor(clock*1.1)%2===0;
 c.save();c.globalAlpha=alpha*Math.min(1,darkness*1.5);
 c.fillStyle=on?'#ff3b2e':'#7a2620';c.beginPath();c.arc(cap.x,cap.y-.6,.75,0,TAU);c.fill();
 if(on){const g=c.createRadialGradient(cap.x,cap.y-.6,0,cap.x,cap.y-.6,5);g.addColorStop(0,'#ff4a3a88');g.addColorStop(1,'#ff4a3a00');c.fillStyle=g;c.beginPath();c.arc(cap.x,cap.y-.6,5,0,TAU);c.fill();}
 c.restore();
}

// ---- ex piscina comunale: the round building as a roofless ruin with the sunken empty pool ----------
export function markRuinPool(buildings,data){
 let n=0;
 for(const l of data?.landmark||[]){
  if(l.tipo!=='piscina-rudere')continue;
  const b=buildings.find(q=>q.id===l.edificio);if(!b?.art)continue;
  b.art.ruinPool={x:l.vasca.x,y:l.vasca.y,w:l.vasca.lunghezza,h:l.vasca.larghezza,a:(l.vasca.angolo||0)*Math.PI/180,depth:l.vasca.profondita||2.6};
  n++;
 }
 return n;
}
function polyPath(c,p,dx=0,dy=0){c.beginPath();c.moveTo(p[0]+dx,p[1]+dy);for(let i=2;i<p.length;i+=2)c.lineTo(p[i]+dx,p[i+1]+dy);c.closePath();}
function h32(n){n=Math.imul(n^n>>>16,0x45d9f3b);n=Math.imul(n^n>>>16,0x45d9f3b);return (n^n>>>16)>>>0;}
/* Static layer: low broken concrete ring, rubble floor, remains of the roof slab along the wall and the
 * sunken pool: coping, the far (north) inner wall, cracked faded-blue tiles, weeds, a rusty ladder. */
export function drawRuinPool(c,b,{exposedFacade,shiftColor}){
 const a=b.art,pool=a.ruinPool,p=b.p;
 let area=0;for(let i=2;i<p.length;i+=2)area+=p[i-2]*p[i+1]-p[i]*p[i-1];
 const v={dx:1.1,dy:3.3,areaSign:Math.sign(area)||1};
 c.save();
 polyPath(c,p,1.5,1.6);c.fillStyle='#19252a40';c.fill();
 // low walls of the ruin (one storey, jagged top)
 for(let j=2;j<p.length;j+=2){
  const ex=p[j]-p[j-2],ey=p[j+1]-p[j-1];if(!exposedFacade(ex,ey,v))continue;
  c.beginPath();c.moveTo(p[j-2],p[j-1]);c.lineTo(p[j],p[j+1]);c.lineTo(p[j]-v.dx,p[j+1]-v.dy);c.lineTo(p[j-2]-v.dx,p[j-1]-v.dy);c.closePath();
  c.fillStyle=Math.abs(ex)>=Math.abs(ey)?'#a7a297':'#7f7b71';c.fill();
  c.fillStyle='#6b675e55';const len=Math.hypot(ex,ey);
  for(let s=0;s<len;s+=1.7){const t=s/len;if(h32(j*97+s*13)%3)continue;c.fillRect(p[j-2]+ex*t-v.dx*.6,p[j-1]+ey*t-v.dy*.6,.5,v.dy*.6);}
 }
 // top of the walls: the slab is gone, only the broken ring remains
 polyPath(c,p,-v.dx,-v.dy);c.save();c.clip();
 c.fillStyle='#625e55';c.fill();
 for(let k=0;k<70;k++){const s=h32(b.id+k*31),x=a.x0+(s%1000)/1000*a.w,y=a.y0+((s>>>10)%1000)/1000*a.h;
  c.fillStyle=k%4?'#57534b':'#7c776c';c.fillRect(x-v.dx,y-v.dy,.5+(s>>>20)%3*.3,.4+(s>>>22)%3*.3);}
 c.restore();
 polyPath(c,p,-v.dx,-v.dy);c.strokeStyle='#b9b4a8';c.lineWidth=1.5;c.stroke();
 c.strokeStyle='#4e4a43';c.lineWidth=.35;c.stroke();
 // the sunken pool: coping, far inner wall, tiled floor shifted down by its depth (a pit)
 if(pool){
  c.save();c.translate(pool.x-v.dx,pool.y-v.dy);c.rotate(pool.a);
  const w=pool.w,h=pool.h,dd={x:-UP.x*pool.depth,y:-UP.y*pool.depth};
  // the roof slab has fallen in over the pool: a jagged opening, then the coping below it
  c.fillStyle='#3d3a34';c.beginPath();
  for(let k=0;k<=24;k++){const t=k/24*TAU,j=1+((h32(b.id+k*17)%7)-3)*.05;c.lineTo(Math.cos(t)*(w/2+3.2)*j,Math.sin(t)*(h/2+3)*j);}
  c.closePath();c.fill();
  c.fillStyle='#d9d4c4';c.fillRect(-w/2-1.2,-h/2-1.2,w+2.4,h+2.4);            // coping
  c.save();c.beginPath();c.rect(-w/2,-h/2,w,h);c.clip();
  c.fillStyle='#3f5b5e';c.fillRect(-w/2,-h/2,w,h);                             // shadowed inner walls
  c.fillStyle='#7d9ea0';c.fillRect(-w/2+dd.x,-h/2+dd.y,w,h);                    // floor (sunken)
  c.strokeStyle='#5f7f80';c.lineWidth=.12;
  for(let x=-w/2;x<w/2;x+=1.1){c.beginPath();c.moveTo(x+dd.x,-h/2+dd.y);c.lineTo(x+dd.x,h/2+dd.y);c.stroke();}
  for(let y=-h/2;y<h/2;y+=1.1){c.beginPath();c.moveTo(-w/2+dd.x,y+dd.y);c.lineTo(w/2+dd.x,y+dd.y);c.stroke();}
  c.fillStyle='#9fb8b3';c.fillRect(-w/2,-h/2,w,dd.y);                           // lit far (north) wall
  c.strokeStyle='#89a3a1';for(let x=-w/2;x<w/2;x+=1.1){c.beginPath();c.moveTo(x,-h/2);c.lineTo(x,-h/2+dd.y);c.stroke();}
  // cracks, stains and weeds on the floor
  c.strokeStyle='#2e3b3a';c.lineWidth=.22;
  for(let k=0;k<5;k++){const s=h32(b.id*7+k);let x=-w/2+(s%100)/100*w+dd.x,y=-h/2+((s>>>8)%100)/100*h+dd.y;
   c.beginPath();c.moveTo(x,y);for(let m=0;m<5;m++){x+=((h32(s+m)%7)-3)*.5;y+=((h32(s+m*3)%5)-2)*.45;c.lineTo(x,y);}c.stroke();}
  for(let k=0;k<9;k++){const s=h32(b.id*13+k);const x=-w/2+(s%100)/100*w+dd.x,y=-h/2+((s>>>8)%100)/100*h+dd.y;
   c.fillStyle=k%3?'#5c6b3b':'#7a8a3f';c.fillRect(x-.5,y-.4,1+(s>>>16)%3*.4,.8);c.fillStyle='#46552e';c.fillRect(x-.2,y-.8,.3,.5);}
  c.fillStyle='#55523f88';c.beginPath();c.ellipse(dd.x+w*.12,dd.y+h*.15,w*.18,h*.16,.2,0,TAU);c.fill(); // old stain
  c.restore();
  // rusty ladder hanging on the far wall, near the east end
  c.strokeStyle='#7b5a3c';c.lineWidth=.22;const lx=w/2-2.4;
  c.beginPath();c.moveTo(lx,-h/2-1);c.lineTo(lx,-h/2+dd.y+.6);c.moveTo(lx+.9,-h/2-1);c.lineTo(lx+.9,-h/2+dd.y+.6);c.stroke();
  for(let y=-h/2-.6;y<-h/2+dd.y;y+=.55){c.beginPath();c.moveTo(lx,y);c.lineTo(lx+.9,y);c.stroke();}
  c.strokeStyle='#8a8678';c.lineWidth=.3;c.strokeRect(-w/2-1.2,-h/2-1.2,w+2.4,h+2.4);
  c.restore();
 }
 c.restore();
}
/* Dynamic layer (only when wet): puddles and rings of raindrops on the pool floor (Q08). */
export function drawRuinPoolPuddles(c,b,wetness=0,clock=0){
 const pool=b?.art?.ruinPool;if(!pool||wetness<.12)return;
 const v={dx:1.1,dy:3.3},dd={x:-UP.x*pool.depth,y:-UP.y*pool.depth};
 c.save();c.translate(pool.x-v.dx,pool.y-v.dy);c.rotate(pool.a);
 c.beginPath();c.rect(-pool.w/2,-pool.h/2,pool.w,pool.h);c.clip();
 c.globalAlpha=Math.min(1,wetness*1.3);
 const spots=[[-.28,.12,.22,.18],[.1,.25,.16,.14],[.3,-.05,.12,.16]];
 for(const [fx,fy,rw,rh] of spots){
  const x=fx*pool.w+dd.x,y=fy*pool.h+dd.y;
  c.fillStyle='#4f6f7acc';c.beginPath();c.ellipse(x,y,rw*pool.w,rh*pool.h,0,0,TAU);c.fill();
  c.fillStyle='#b8d0d655';c.beginPath();c.ellipse(x-rw*pool.w*.3,y-rh*pool.h*.3,rw*pool.w*.35,rh*pool.h*.25,0,0,TAU);c.fill();
  const ph=(clock*1.6+fx*7)%1;c.strokeStyle=`rgba(220,236,240,${.5*(1-ph)})`;c.lineWidth=.12;
  c.beginPath();c.ellipse(x+rw*pool.w*.2,y,.3+ph*1.6,.2+ph*1.1,0,0,TAU);c.stroke();
 }
 c.restore();
}
