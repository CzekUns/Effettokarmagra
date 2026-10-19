/* PESCA GROSSA — motore grafico.
 * Acqua con fondale, caustiche e riflessi; luoghi illustrati; pesci; luce del giorno, notte e meteo.
 * Tutto ciò che non si muove (fondali, terraferma, moli, barche) è preparato una volta e tenuto in cache.
 * Disegna in coordinate logiche 800x760, ma alla risoluzione reale dello schermo (fino a 2x). */
(function(root){
"use strict";
const R=root.PESCA_RULES;
const W=800,H=760,WT=214,TAU=Math.PI*2;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),lerp=(a,b,t)=>a+(b-a)*t;
const A={canvas:null,ctx:null,scale:1,maxScale:2,cache:{sprites:new Map(),water:{},bg:{}},lowFx:false,reduced:false,perf:{last:0,sum:0,n:0},shake:0,flash:0,birds:[],nextBird:4};

/* ---------- utilità ---------- */
function hash(x,y,s){let h=Math.imul(x|0,374761393)^Math.imul(y|0,668265263)^Math.imul((s|0)+7,224682251);h=Math.imul(h^(h>>>13),1274126177);return((h^(h>>>16))>>>0)/4294967296;}
function vnoise(x,y,s,p){
 const xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi,u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf);
 const m=k=>p?((k%p)+p)%p:k;
 return lerp(lerp(hash(m(xi),m(yi),s),hash(m(xi+1),m(yi),s),u),lerp(hash(m(xi),m(yi+1),s),hash(m(xi+1),m(yi+1),s),u),v);
}
function fbm(x,y,s,oct,p){let v=0,amp=.5,f=1,n=0;for(let i=0;i<(oct||4);i++){v+=amp*vnoise(x*f,y*f,s+i*31,p?p*f:0);n+=amp;f*=2;amp*=.5;}return v/n;}
function mk(w,h){const c=document.createElement("canvas");c.width=Math.max(1,Math.round(w));c.height=Math.max(1,Math.round(h));return c;}
function rgb(h){return[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];}
function mixc(a,b,t){return[lerp(a[0],b[0],t),lerp(a[1],b[1],t),lerp(a[2],b[2],t)];}
function css(c,a){return a==null?"rgb("+(c[0]|0)+","+(c[1]|0)+","+(c[2]|0)+")":"rgba("+(c[0]|0)+","+(c[1]|0)+","+(c[2]|0)+","+a+")";}
function rr(g,x,y,w,h,r){g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath();}
function blobPath(g,x,y,rx,ry,seed,rough){g.beginPath();const n=22;for(let i=0;i<=n;i++){const a=i/n*TAU,k=1-(rough||.22)+(rough||.22)*2*fbm(Math.cos(a)*1.3+seed,Math.sin(a)*1.3+seed,seed|0,3);const px=x+Math.cos(a)*rx*k,py=y+Math.sin(a)*ry*k;i?g.lineTo(px,py):g.moveTo(px,py);}g.closePath();}

/* ---------- risoluzione e prestazioni ---------- */
function init(canvas){
 A.canvas=canvas;A.ctx=canvas.getContext("2d");
 A.reduced=!!(root.matchMedia&&root.matchMedia("(prefers-reduced-motion: reduce)").matches);
 resize();root.addEventListener("resize",()=>{clearTimeout(A.rt);A.rt=setTimeout(resize,160);});
}
function resize(){
 if(!A.canvas)return;
 const rect=A.canvas.getBoundingClientRect(),dpr=root.devicePixelRatio||1;
 const want=clamp(Math.ceil((rect.width||W)*dpr/W*4)/4,1,A.maxScale);
 if(want!==A.scale||A.canvas.width!==Math.round(W*want)){A.scale=want;A.canvas.width=Math.round(W*want);A.canvas.height=Math.round(H*want);A.cache.bg={};A.cache.water={};A.cache.sprites.clear();}
}
function watchPerf(now){
 const p=A.perf;if(!p.last){p.last=now;return;}
 const dt=now-p.last;p.last=now;if(dt>250||document.hidden)return;
 p.sum+=dt;p.n++;
 if(p.n>=150){const avg=p.sum/p.n;p.sum=0;p.n=0;
  if(avg>27){if(A.maxScale>1){A.maxScale=Math.max(1,A.scale-.5);resize();}else A.lowFx=true;}}
}

/* ---------- forme dei pesci ---------- */
function fishShape(g,sp,size,o){
 o=o||{};const sil=!!o.silhouette,body=sil?(o.shadowColor||"#03202b"):sp.color,dark=sil?(o.shadowColor||"#03202b"):sp.dark,s=size;
 const kind=sp.shadow||"pesce",deep=sp.k>=.016&&kind==="pesce"?1.25:1;
 if(kind==="lungo"){
  g.lineCap="round";g.lineJoin="round";
  const pts=[];for(let i=0;i<=18;i++){const x=-1.9*s+i*(3.4*s/18),y=Math.sin(i*.7+(o.wiggle||0))*s*.18*(1-i/22);pts.push([x,y]);}
  g.strokeStyle=dark;g.lineWidth=s*.46;g.beginPath();pts.forEach((p,i)=>i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]));g.stroke();
  if(!sil){g.strokeStyle=body;g.lineWidth=s*.3;g.beginPath();pts.forEach((p,i)=>i?g.lineTo(p[0],p[1]-s*.03):g.moveTo(p[0],p[1]-s*.03));g.stroke();
   g.strokeStyle="rgba(255,255,255,.25)";g.lineWidth=s*.07;g.beginPath();pts.forEach((p,i)=>i?g.lineTo(p[0],p[1]-s*.1):g.moveTo(p[0],p[1]-s*.1));g.stroke();}
  g.fillStyle=dark;g.beginPath();g.ellipse(1.58*s,pts[18][1],s*.34,s*.25,0,0,TAU);g.fill();
  if(!sil){g.fillStyle="#fff7d8";g.beginPath();g.arc(1.7*s,pts[18][1]-s*.06,Math.max(1.5,s*.07),0,TAU);g.fill();}
  return;
 }
 if(kind==="tentacoli"){
  const grd=sil?null:g.createRadialGradient(-s*.55,-s*.2,s*.1,-s*.35,0,s*.95);
  if(grd){grd.addColorStop(0,"#fff4ea");grd.addColorStop(.35,body);grd.addColorStop(1,dark);}
  g.strokeStyle=dark;g.lineWidth=Math.max(1.6,s*.13);g.lineCap="round";
  const n=sp.id==="polpo"?8:6;
  for(let i=0;i<n;i++){const a=(i-(n-1)/2)*(sp.id==="polpo"?.32:.2);g.beginPath();g.moveTo(s*.3,a*s*.7);g.bezierCurveTo(s*.85,a*s*1.5+Math.sin((o.wiggle||0)+i)*s*.18,s*1.2,a*s*2.1,s*(sp.id==="polpo"?1.65:1.45),a*s*(sp.id==="polpo"?2.6:2));g.stroke();}
  g.fillStyle=grd||body;g.beginPath();
  if(sp.id==="polpo")g.ellipse(-s*.25,0,s*.75,s*.62,0,0,TAU);else{g.ellipse(-s*.4,0,s*.95,s*.42,0,0,TAU);}
  g.fill();
  if(!sil&&sp.id!=="polpo"){g.fillStyle=css(rgb(sp.dark),.55);g.beginPath();g.ellipse(-s*.4,0,s*1.05,s*.5,0,Math.PI*.5,Math.PI*1.5);g.ellipse(-s*.4,0,s*.95,s*.42,0,Math.PI*1.5,Math.PI*.5,true);g.fill();}
  if(!sil){g.fillStyle="#1d2a2e";g.beginPath();g.arc(s*.12,-s*.18,Math.max(1.5,s*.09),0,TAU);g.arc(s*.12,s*.18,Math.max(1.5,s*.09),0,TAU);g.fill();
   g.fillStyle="rgba(120,60,40,.25)";for(let i=0;i<8;i++){g.beginPath();g.arc(-s*.9+(i*37%9)*s*.13,-s*.25+(i*23%5)*s*.12,Math.max(1,s*.05),0,TAU);g.fill();}}
  return;
 }
 const long=kind==="pinna"?1.25:1,hw=s*.56*deep;
 g.fillStyle=dark;g.beginPath();
 if(kind==="pinna"){g.moveTo(-s*1.05*long,0);g.lineTo(-s*1.8*long,-s*.85);g.quadraticCurveTo(-s*1.5*long,0,-s*1.8*long,s*.85);}
 else{g.moveTo(-s*.85,0);g.lineTo(-s*1.7,-s*.7*deep);g.quadraticCurveTo(-s*1.45,0,-s*1.6,s*.68*deep);}
 g.closePath();g.fill();
 if(sp.id==="lampuga"){g.beginPath();g.moveTo(-s*.9,-hw*.6);g.quadraticCurveTo(-s*.1,-hw*1.95,s*.78,-hw*.75);g.lineTo(s*.6,-hw*.4);g.closePath();g.fill();}
 else{g.beginPath();g.moveTo(-s*.28,-hw*.82);g.lineTo(-s*.52,-hw*1.78);g.quadraticCurveTo(s*.05,-hw*1.42,s*.42,-hw*.84);g.closePath();g.fill();}
 g.beginPath();g.moveTo(-s*.35,hw*.8);g.lineTo(-s*.62,hw*1.32);g.lineTo(-s*.05,hw*.86);g.closePath();g.fill();
 if(!sil){
  g.strokeStyle="rgba(255,255,255,.18)";g.lineWidth=Math.max(.8,s*.03);
  for(let i=0;i<5;i++){const t=i/4;g.beginPath();g.moveTo(-s*.9,0);g.lineTo(-s*1.62,lerp(-s*.62*deep,s*.6*deep,t));g.stroke();}
  for(let i=0;i<4;i++){g.beginPath();g.moveTo(-s*.2+i*s*.12,-hw*.85);g.lineTo(-s*.42+i*s*.18,-hw*(1.55-i*.18));g.stroke();}
 }
 let fill=body;
 if(!sil){const gr=g.createLinearGradient(0,-hw,0,hw);gr.addColorStop(0,dark);gr.addColorStop(.4,body);gr.addColorStop(.78,css(mixc(rgb(body),[255,252,240],.55)));gr.addColorStop(1,"#f8f4e8");fill=gr;}
 g.fillStyle=fill;g.beginPath();g.ellipse(0,0,s*1.05*long,hw,0,0,TAU);g.fill();
 if(sp.id==="pesce_spada"){g.strokeStyle=dark;g.lineWidth=Math.max(2,s*.11);g.lineCap="round";g.beginPath();g.moveTo(s*1.2,0);g.lineTo(s*2.5,-s*.05);g.stroke();}
 if(!sil){
  const lw=Math.max(1,s*.045),mark=sp.id;g.lineWidth=lw;
  g.save();g.beginPath();g.ellipse(0,0,s*1.05*long,hw,0,0,TAU);g.clip();
  g.fillStyle="rgba(255,255,255,.12)";for(let r=0;r<4;r++)for(let i=0;i<9;i++){g.beginPath();g.arc(-s*.75+i*s*.17+(r%2)*s*.08,-hw*.55+r*hw*.3,Math.max(1,s*.075),Math.PI*.15,Math.PI*.85);g.fill();}
  if(mark==="orata"){g.strokeStyle="#ffcf4a";g.lineWidth=Math.max(2,s*.09);g.beginPath();g.arc(s*.62,-s*.14,s*.19,3.6,5.2);g.stroke();}
  if(mark==="occhiata"){g.fillStyle="#141414";g.beginPath();g.arc(-s*.98,0,hw*.34,0,TAU);g.fill();}
  if(mark==="donzella"){g.fillStyle="#ff7a2e";g.fillRect(-s*.95,-hw*.16,s*1.8,hw*.3);g.fillStyle="#2a7fd0";g.fillRect(-s*.95,hw*.14,s*1.8,hw*.12);}
  if(mark==="scorfano"||mark==="cernia"){g.fillStyle=mark==="cernia"?"rgba(240,230,200,.35)":"rgba(70,25,15,.38)";for(let i=0;i<14;i++){g.beginPath();g.arc(-s*.85+(i*37%13)*s*.13,-hw*.7+(i*23%7)*hw*.22,Math.max(1.5,s*.09),0,TAU);g.fill();}}
  if(mark==="sarago_fasciato"||mark==="sgombro"||mark==="sarago"){g.strokeStyle=mark==="sarago"?"rgba(40,40,40,.3)":css(rgb(sp.dark),.9);g.lineWidth=Math.max(1.5,s*.1);for(let i=-2;i<=1;i++){g.beginPath();g.moveTo(i*s*.32,-hw);g.quadraticCurveTo(i*s*.32+s*.1,0,i*s*.32+s*.05,hw*.4);g.stroke();}}
  if(mark==="palamita"||mark==="tonno_capri"){g.strokeStyle="rgba(20,30,60,.4)";g.lineWidth=Math.max(1.2,s*.05);for(let i=0;i<4;i++){g.beginPath();g.moveTo(-s*.9+i*s*.4,-hw*.15);g.lineTo(-s*.6+i*s*.4,-hw*.9);g.stroke();}}
  g.strokeStyle="rgba(20,30,40,.35)";g.lineWidth=lw;g.beginPath();g.moveTo(-s*.95*long,-hw*.05);g.quadraticCurveTo(0,-hw*.35,s*.82*long,-hw*.12);g.stroke();
  g.fillStyle="rgba(255,255,255,.3)";g.beginPath();g.ellipse(s*.05,-hw*.5,s*.6*long,hw*.16,-.05,0,TAU);g.fill();
  g.restore();
  g.strokeStyle="rgba(15,25,30,.45)";g.lineWidth=lw;g.beginPath();g.arc(s*.45*long,0,hw*.78,-1.1,1.1);g.stroke();
  g.fillStyle=css(rgb(sp.dark),.85);g.beginPath();g.moveTo(s*.3*long,hw*.1);g.quadraticCurveTo(-s*.05,hw*.6,-s*.15,hw*.22);g.closePath();g.fill();
  g.fillStyle="#fffbe8";g.beginPath();g.arc(s*.62*long,-s*.14,Math.max(2,s*.13),0,TAU);g.fill();
  g.fillStyle="#13262e";g.beginPath();g.arc(s*.66*long,-s*.14,Math.max(1.2,s*.08),0,TAU);g.fill();
  g.fillStyle="#fff";g.beginPath();g.arc(s*.69*long,-s*.17,Math.max(.6,s*.025),0,TAU);g.fill();
  g.strokeStyle="rgba(20,20,20,.5)";g.beginPath();g.moveTo(s*1.03*long,hw*.12);g.lineTo(s*.86*long,hw*.22);g.stroke();
  if(mark==="pesce_oro"){g.fillStyle="rgba(255,255,220,.5)";g.beginPath();g.ellipse(s*.1,-hw*.35,s*.55,hw*.18,-.1,0,TAU);g.fill();}
 }
}
/* ombra di un pesce, pre-sfumata e tenuta in cache */
function shadowSprite(sp,size,karmagra){
 const s=Math.max(6,Math.round(size/3)*3),key=sp.id+":"+s+":"+(karmagra?1:0)+":"+A.scale;
 let spr=A.cache.sprites.get(key);if(spr)return spr;
 if(A.cache.sprites.size>140)A.cache.sprites.clear();
 const w=s*5.4+30,h=s*3.2+30,c=mk(w*A.scale,h*A.scale),g=c.getContext("2d");
 g.scale(A.scale,A.scale);g.translate(w/2-(sp.shadow==="lungo"?0:s*.15),h/2);
 const col=karmagra?"#2b0d4f":"#021a24";
 g.shadowColor=col;g.shadowBlur=Math.max(3,s*.35)*A.scale;
 fishShape(g,sp,s,{silhouette:true,shadowColor:col});
 spr={c,w,h,s};A.cache.sprites.set(key,spr);return spr;
}
function drawArt(cv,sp,o){
 o=o||{};const g=cv.getContext("2d"),w=cv.width,h=cv.height;
 const bg=g.createLinearGradient(0,0,0,h);bg.addColorStop(0,o.silhouette?"#12404c":"#1f7a8c");bg.addColorStop(.6,o.silhouette?"#0b2a35":"#0f4a5e");bg.addColorStop(1,"#082a38");
 g.fillStyle=bg;g.fillRect(0,0,w,h);
 if(!o.silhouette){
  g.save();g.globalCompositeOperation="screen";
  for(let i=0;i<4;i++){const x=w*(.15+i*.25);const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,"rgba(255,250,220,.16)");gr.addColorStop(1,"rgba(255,250,220,0)");g.fillStyle=gr;g.beginPath();g.moveTo(x,0);g.lineTo(x+w*.08,0);g.lineTo(x-w*.06,h);g.lineTo(x-w*.16,h);g.closePath();g.fill();}
  const tile=causticsTile();g.globalAlpha=.18;g.fillStyle=g.createPattern(tile,"repeat");g.fillRect(0,0,w,h);g.restore();
  g.fillStyle="rgba(255,255,255,.35)";for(let i=0;i<9;i++){const bx=hash(i,3,9)*w,by=hash(i,5,9)*h,br=1+hash(i,7,9)*h*.025;g.beginPath();g.arc(bx,by,br,0,TAU);g.fill();}
 }
 const size=Math.min(h*.33,w*.19);
 g.save();g.translate(w/2+(sp.shadow==="lungo"?-w*.04:sp.shadow==="tentacoli"?-w*.05:0),h*.52);
 if(!o.silhouette){g.save();g.translate(size*.15,size*.75);g.scale(1,.35);g.fillStyle="rgba(0,15,25,.35)";g.beginPath();g.ellipse(0,0,size*1.5,size*.9,0,0,TAU);g.fill();g.restore();}
 if(!o.silhouette&&(o.karmagra||sp.shimmer||sp.rarity==="leggendario")){g.shadowBlur=w*.06;g.shadowColor=o.karmagra?"#c77dff":"#ffdc72";}
 fishShape(g,sp,size,{silhouette:!!o.silhouette,shadowColor:"#04161d"});
 if(o.karmagra&&!o.silhouette){g.globalCompositeOperation="source-atop";g.fillStyle="rgba(170,90,255,.38)";g.fillRect(-w,-h,w*2,h*2);}
 g.restore();
}

/* ---------- tessiture procedurali ---------- */
function causticsTile(){
 if(A.cache.caus)return A.cache.caus;
 const N=256,c=mk(N,N),g=c.getContext("2d"),img=g.createImageData(N,N);
 for(let j=0;j<N;j++)for(let i=0;i<N;i++){
  const u=i/N*TAU,v=j/N*TAU;
  const a=Math.sin(u*3+Math.sin(v*2)*1.3+Math.sin(u+v)*.6),b=Math.sin(v*3+Math.sin(u*2+1.7)*1.25),d=Math.sin((u-v)*2+Math.sin(u*3-v)*1.1);
  const val=Math.pow(clamp(1-Math.abs(a+b+d)/1.15,0,1),3.2);
  const k=(j*N+i)*4;img.data[k]=225;img.data[k+1]=250;img.data[k+2]=255;img.data[k+3]=val*255;
 }
 g.putImageData(img,0,0);A.cache.caus=c;return c;
}
function cloudTile(){
 if(A.cache.cloud)return A.cache.cloud;
 const N=256,c=mk(N,N),g=c.getContext("2d"),img=g.createImageData(N,N);
 for(let j=0;j<N;j++)for(let i=0;i<N;i++){const v=fbm(i/64,j/64,5,4,4),a=clamp((v-.3)*1.7,0,1);const k=(j*N+i)*4;img.data[k]=img.data[k+1]=img.data[k+2]=255;img.data[k+3]=a*a*255;}
 g.putImageData(img,0,0);A.cache.cloud=c;return c;
}

/* ---------- acqua: fondale (cache per luogo) ---------- */
const PAL={
 lago:{sh:"#86b9a1",mid:"#2f7b84",deep:"#0b3a55",sand:"#cdbb8b"},
 porto:{sh:"#79aaa6",mid:"#2b6680",deep:"#082a44",sand:"#ada48b"},
 scogli:{sh:"#9fe8dc",mid:"#22a3b8",deep:"#063a69",sand:"#e8d6a2"},
 golfo:{sh:"#4a98c9",mid:"#1c5d98",deep:"#041638",sand:"#7fb2c4"}
};
function shoreY(spot,x){
 if(spot==="lago")return 117+9*Math.sin(x*.011+.6)+5*Math.sin(x*.027+2);
 if(spot==="porto")return 116;
 if(spot==="scogli"){const k=Math.max(0,1-Math.abs(x-400)/150);return 122+34*(fbm(x*.008,1.7,11,3)-.5)+k*k*82;}
 return -10;
}
function waterLayer(spot){
 const key=spot;if(A.cache.water[key])return A.cache.water[key];
 A.cache.water={};
 const cw=200,ch=190,lo=mk(cw,ch),lg=lo.getContext("2d"),img=lg.createImageData(cw,ch),S=R.SPOTS[spot],p=PAL[spot];
 const sh=rgb(p.sh),mid=rgb(p.mid),dp=rgb(p.deep),sand=rgb(p.sand),maxD=S.depth[1]*1.05;
 const mask=mk(cw,ch),mg=mask.getContext("2d"),mimg=mg.createImageData(cw,ch);
 for(let j=0;j<ch;j++)for(let i=0;i<cw;i++){
  const x=(i+.5)*W/cw,y=(j+.5)*H/ch,d=R.depthAt(spot,x,Math.max(y,WT-20));
  const t=clamp(Math.log(1+d)/Math.log(1+maxD),0,1);
  let col=t<.5?mixc(sh,mid,t/.5):mixc(mid,dp,(t-.5)/.5);
  const shallow=Math.pow(1-t,2.2),n=fbm(x*.011,y*.011,spot.length*7,4),rip=Math.sin(x*.12+n*8+y*.05)*.5+.5;
  col=mixc(col,sand,shallow*(.22+.38*n));
  const k=(n-.5)*40*shallow+(rip-.5)*12*shallow;
  let r=col[0]+k,g=col[1]+k,b=col[2]+k;
  const f=R.featureAt(spot,x,y);
  if(f&&f.rock){const rn=fbm(x*.05,y*.05,99,3);r*=.66+.3*rn;g*=.7+.28*rn;b*=.76+.22*rn;}
  if(f&&f.weed){g+=16*shallow+6;r-=8;b-=6;}
  if(f&&f.shoal){r+=14;g+=24;b+=10;}
  if(spot==="golfo"){const gn=fbm(x*.004,y*.004,3,3);r+=(gn-.5)*14;g+=(gn-.5)*18;b+=(gn-.5)*22;}
  const o=(j*cw+i)*4;img.data[o]=r;img.data[o+1]=g;img.data[o+2]=b;img.data[o+3]=255;
  mimg.data[o]=mimg.data[o+1]=mimg.data[o+2]=255;mimg.data[o+3]=clamp(1.15-t*1.25,.08,1)*255;
 }
 lg.putImageData(img,0,0);mg.putImageData(mimg,0,0);
 const c=mk(W*A.scale,H*A.scale),g=c.getContext("2d");
 g.imageSmoothingEnabled=true;g.imageSmoothingQuality="high";g.drawImage(lo,0,0,c.width,c.height);
 g.scale(A.scale,A.scale);
 underwaterDetails(g,spot);
 // grana fine
 g.globalAlpha=.06;for(let i=0;i<1400;i++){const x=hash(i,1,spot.length)*W,y=WT-60+hash(i,2,spot.length)*(H-WT+60);g.fillStyle=hash(i,3,1)>.5?"#fff":"#001018";g.fillRect(x,y,1.4,1.4);}g.globalAlpha=1;
 A.cache.water[key]={c,mask};return A.cache.water[key];
}
function underwaterDetails(g,spot){
 const S=R.SPOTS[spot];
 g.save();
 if(spot==="lago"){
  for(let i=0;i<60;i++){const x=hash(i,11,1)*W,y=135+hash(i,12,1)*140,r=1.5+hash(i,13,1)*3;g.fillStyle="rgba(70,60,40,"+(.18+hash(i,14,1)*.2)+")";g.beginPath();g.ellipse(x,y,r*1.4,r,0,0,TAU);g.fill();}
  g.save();g.translate(640,575);g.rotate(-.35);g.fillStyle="rgba(50,38,25,.35)";rr(g,-70,-9,140,18,9);g.fill();g.strokeStyle="rgba(30,20,10,.3)";g.lineWidth=2;g.beginPath();g.moveTo(-60,-2);g.lineTo(55,-3);g.stroke();g.restore();
  for(let i=0;i<5;i++){const x=200+hash(i,21,1)*400,y=420+hash(i,22,1)*260;g.save();g.translate(x,y);g.rotate(hash(i,23,1)*6);g.fillStyle="rgba(120,90,40,.22)";g.beginPath();g.ellipse(0,0,8,4,0,0,TAU);g.fill();g.restore();}
 }else if(spot==="porto"){
  const ru=S.features.find(f=>f.ruins);
  for(let i=0;i<7;i++){
   const x=ru.x-170+i*58+hash(i,1,4)*14,y=ru.y-10+Math.sin(i*1.7)*22,rot=.25+i*.42,len=70+hash(i,2,4)*30;
   g.save();g.translate(x,y);g.rotate(rot);g.fillStyle="rgba(0,20,30,.14)";rr(g,-10,-len/2+6,24,len,8);g.fill();
   const gr=g.createLinearGradient(-11,0,11,0);gr.addColorStop(0,"rgba(200,195,170,.1)");gr.addColorStop(.5,"rgba(225,225,205,.17)");gr.addColorStop(1,"rgba(170,165,140,.09)");g.fillStyle=gr;rr(g,-11,-len/2,22,len,9);g.fill();
   g.strokeStyle="rgba(120,110,90,.22)";g.lineWidth=1.2;for(let k=-1;k<=1;k++){g.beginPath();g.moveTo(k*6,-len/2+4);g.lineTo(k*6,len/2-4);g.stroke();}
   g.restore();
  }
  g.save();g.translate(250,640);g.rotate(.8);g.fillStyle="rgba(150,90,50,.3)";g.beginPath();g.ellipse(0,0,22,11,0,0,TAU);g.fill();g.beginPath();g.ellipse(24,0,7,4,0,0,TAU);g.fill();g.restore();
  for(let i=0;i<40;i++){const x=hash(i,31,4)*W,y=135+hash(i,32,4)*80;g.fillStyle="rgba(30,40,40,.18)";g.beginPath();g.arc(x,y,1.5+hash(i,33,4)*2.5,0,TAU);g.fill();}
 }else if(spot==="scogli"){
  for(const f of S.features){if(!f.rock||f.dd<=-1.5)continue;blobPath(g,f.x,f.y,f.rx*.6,f.ry*.5,f.x*.01,.3);g.fillStyle="rgba(20,40,50,.35)";g.fill();}
  for(let i=0;i<14;i++){const x=60+hash(i,41,6)*680,y=300+hash(i,42,6)*420;g.save();g.translate(x,y);g.rotate(hash(i,43,6)*3);g.lineCap="round";for(let k=0;k<9;k++){g.strokeStyle="rgba("+(20+k*3)+","+(80+k*4)+",50,.22)";g.lineWidth=3;g.beginPath();g.moveTo(k*4-16,12);g.bezierCurveTo(k*4-14,0,k*4-10+hash(k,i,2)*10,-10,k*4-8+hash(k,i,2)*14,-24-hash(k,i,3)*12);g.stroke();}g.restore();}
  for(let i=0;i<26;i++){const f=S.features[i%S.features.length],a=hash(i,51,6)*TAU,r=.55+hash(i,52,6)*.5,x=f.x+Math.cos(a)*f.rx*r,y=f.y+Math.sin(a)*f.ry*r;g.strokeStyle="rgba(10,10,20,.55)";g.lineWidth=1;for(let k=0;k<10;k++){const b=k/10*TAU;g.beginPath();g.moveTo(x,y);g.lineTo(x+Math.cos(b)*5,y+Math.sin(b)*5);g.stroke();}g.fillStyle="rgba(15,10,25,.7)";g.beginPath();g.arc(x,y,2.6,0,TAU);g.fill();}
  for(let i=0;i<4;i++){const x=120+hash(i,61,6)*560,y=320+hash(i,62,6)*380;g.save();g.translate(x,y);g.rotate(hash(i,63,6)*3);g.fillStyle="rgba(230,110,50,.55)";g.beginPath();for(let k=0;k<10;k++){const r=k%2?3:9,b=k/10*TAU;g.lineTo(Math.cos(b)*r,Math.sin(b)*r);}g.closePath();g.fill();g.restore();}
 }else{
  const sh=S.features[0];
  for(let i=0;i<30;i++){const a=hash(i,71,8)*TAU,r=hash(i,72,8),x=sh.x+Math.cos(a)*sh.rx*.7*r,y=sh.y+Math.sin(a)*sh.ry*.6*r;g.strokeStyle="rgba(40,110,90,.25)";g.lineWidth=3;g.beginPath();g.moveTo(x,y);g.quadraticCurveTo(x+4,y-8,x+2,y-16);g.stroke();}
 }
 g.restore();
}

/* ---------- terraferma e strutture (cache per luogo) ---------- */
function bgLayer(spot){
 if(A.cache.bg[spot])return A.cache.bg[spot];
 const c=mk(W*A.scale,H*A.scale),g=c.getContext("2d");g.scale(A.scale,A.scale);
 ({lago:bgLago,porto:bgPorto,scogli:bgScogli,golfo:bgGolfo})[spot](g);
 A.cache.bg[spot]=c;return c;
}
function tree(g,x,y,r,seed){
 g.fillStyle="rgba(10,30,15,.32)";g.beginPath();g.ellipse(x+r*.35,y+r*.45,r*1.05,r*.85,0,0,TAU);g.fill();
 for(let i=0;i<7;i++){
  const a=i/7*TAU+seed,d=i?r*.55:0,cx=x+Math.cos(a)*d,cy=y+Math.sin(a)*d*.8,cr=r*(i?.55:.7);
  const gr=g.createRadialGradient(cx-cr*.35,cy-cr*.4,cr*.1,cx,cy,cr);gr.addColorStop(0,"#8fc463");gr.addColorStop(.55,"#4f8a3d");gr.addColorStop(1,"#2a5527");
  g.fillStyle=gr;g.beginPath();g.arc(cx,cy,cr,0,TAU);g.fill();
 }
 g.fillStyle="rgba(200,240,150,.25)";for(let i=0;i<14;i++){const a=hash(i,seed*10,2)*TAU,d=hash(i,seed*10,3)*r*.9;g.beginPath();g.arc(x+Math.cos(a)*d-r*.15,y+Math.sin(a)*d-r*.2,1.5+hash(i,seed,4)*2.5,0,TAU);g.fill();}
}
function hullPath(g,L,Wd){g.beginPath();g.moveTo(-L,0);g.bezierCurveTo(-L*.62,-Wd,L*.5,-Wd*1.02,L,0);g.bezierCurveTo(L*.5,Wd*1.02,-L*.62,Wd,-L,0);g.closePath();}
function boat(g,x,y,rot,len,o){
 o=o||{};const L=len/2,Wd=len*(o.wide||.21);
 g.save();g.translate(x,y);g.rotate(rot);
 g.save();g.translate(6,9);g.fillStyle="rgba(0,18,28,.32)";hullPath(g,L*1.03,Wd*1.08);g.fill();g.restore();
 const hg=g.createLinearGradient(0,-Wd,0,Wd);hg.addColorStop(0,o.hull2||"#d8d2c4");hg.addColorStop(.5,o.hull||"#f5f1e6");hg.addColorStop(1,o.hull2||"#cfc8b8");
 g.fillStyle=hg;hullPath(g,L,Wd);g.fill();
 g.strokeStyle=o.stripe||"#2f6fa8";g.lineWidth=Wd*.16;hullPath(g,L*.97,Wd*.93);g.stroke();
 g.fillStyle=o.wood||"#a8754a";hullPath(g,L*.84,Wd*.74);g.fill();
 g.save();hullPath(g,L*.84,Wd*.74);g.clip();g.strokeStyle="rgba(70,40,20,.35)";g.lineWidth=1;for(let i=-3;i<=3;i++){g.beginPath();g.moveTo(-L,i*Wd*.2);g.lineTo(L,i*Wd*.2);g.stroke();}g.restore();
 for(const bx of o.benches||[-.35,.15]){g.fillStyle="#8a5c36";g.fillRect(bx*L-Wd*.12,-Wd*.72,Wd*.24,Wd*1.44);g.fillStyle="rgba(255,255,255,.12)";g.fillRect(bx*L-Wd*.12,-Wd*.72,Wd*.24,Wd*.3);}
 if(o.engine){g.fillStyle="#2b3036";rr(g,-L*1.02-Wd*.28,-Wd*.22,Wd*.42,Wd*.44,Wd*.08);g.fill();g.fillStyle="#c9302c";rr(g,-L*1.0-Wd*.24,-Wd*.16,Wd*.18,Wd*.32,Wd*.05);g.fill();}
 if(o.oars){g.strokeStyle="#c9a36a";g.lineWidth=Wd*.09;g.beginPath();g.moveTo(-L*.1,-Wd*.6);g.lineTo(L*.25,-Wd*1.5);g.moveTo(-L*.1,Wd*.6);g.lineTo(L*.25,Wd*1.5);g.stroke();}
 if(o.rope){g.strokeStyle="#d8c79a";g.lineWidth=1.6;g.beginPath();g.arc(L*.55,0,Wd*.22,0,TAU);g.arc(L*.55,0,Wd*.12,0,TAU);g.stroke();}
 g.restore();
}
function rockMass(g,x,y,rx,ry,seed,pal,strata){
 g.save();blobPath(g,x,y,rx,ry,seed,.25);
 const gr=g.createLinearGradient(x-rx,y-ry,x+rx*.6,y+ry);gr.addColorStop(0,pal[0]);gr.addColorStop(.55,pal[1]);gr.addColorStop(1,pal[2]);
 g.fillStyle=gr;g.fill();g.clip();
 if(strata){g.strokeStyle="rgba(90,60,25,.25)";g.lineWidth=2;for(let i=-6;i<=6;i++){g.beginPath();for(let k=0;k<=20;k++){const px=x-rx+k*rx/10,py=y+i*ry*.18+Math.sin(k*.9+i+seed)*3;k?g.lineTo(px,py):g.moveTo(px,py);}g.stroke();}}
 g.strokeStyle="rgba(30,20,10,.3)";g.lineWidth=1.5;for(let i=0;i<5;i++){const a=hash(i,seed*7,1)*TAU;g.beginPath();g.moveTo(x+Math.cos(a)*rx*.2,y+Math.sin(a)*ry*.2);g.lineTo(x+Math.cos(a+.3)*rx*.7,y+Math.sin(a+.2)*ry*.7);g.stroke();}
 g.fillStyle="rgba(255,250,230,.12)";for(let i=0;i<30;i++){g.beginPath();g.arc(x+(hash(i,seed,5)-.5)*rx*1.8,y+(hash(i,seed,6)-.5)*ry*1.8,1+hash(i,seed,7)*2,0,TAU);g.fill();}
 g.restore();
 g.save();blobPath(g,x,y,rx,ry,seed,.25);g.strokeStyle="rgba(20,15,10,.45)";g.lineWidth=3;g.stroke();g.restore();
}
function bgLago(g){
 // ombra del pontile e dei pali sull'acqua
 g.fillStyle="rgba(0,25,30,.3)";g.fillRect(330,140,170,86);
 // terra: erba, sentiero, sabbia
 g.beginPath();g.moveTo(0,0);for(let x=0;x<=W;x+=10)g.lineTo(x,shoreY("lago",x)+2);g.lineTo(W,0);g.closePath();
 const sand=g.createLinearGradient(0,70,0,130);sand.addColorStop(0,"#d8c48f");sand.addColorStop(1,"#a99363");g.fillStyle=sand;g.fill();
 g.beginPath();g.moveTo(0,0);for(let x=0;x<=W;x+=10)g.lineTo(x,shoreY("lago",x)-17+Math.sin(x*.05)*3);g.lineTo(W,0);g.closePath();
 const grass=g.createLinearGradient(0,0,0,110);grass.addColorStop(0,"#5d9150");grass.addColorStop(1,"#4a7d3f");g.fillStyle=grass;g.fill();
 g.save();g.clip();for(let i=0;i<700;i++){const x=hash(i,1,3)*W,y=hash(i,2,3)*110;g.strokeStyle=hash(i,3,3)>.5?"rgba(160,210,110,.35)":"rgba(30,70,30,.35)";g.lineWidth=1.2;g.beginPath();g.moveTo(x,y);g.lineTo(x+hash(i,4,3)*3-1.5,y-4);g.stroke();}g.restore();
 g.fillStyle="rgba(120,100,70,.25)";for(let i=0;i<80;i++){const x=hash(i,8,3)*W,y=shoreY("lago",x)-12+hash(i,9,3)*12;g.beginPath();g.ellipse(x,y,1.5+hash(i,10,3)*2.5,1+hash(i,11,3)*1.5,0,0,TAU);g.fill();}
 g.fillStyle="#c7ae7c";g.beginPath();g.moveTo(370,0);g.bezierCurveTo(380,30,330,45,338,70);g.lineTo(462,70);g.bezierCurveTo(470,45,420,30,430,0);g.closePath();g.fill();
 g.fillStyle="rgba(90,70,40,.18)";for(let i=0;i<40;i++){g.beginPath();g.arc(345+hash(i,5,5)*110,hash(i,6,5)*70,1+hash(i,7,5)*1.5,0,TAU);g.fill();}
 // alberi
 for(const t of [[55,18,56,1],[165,-12,50,2],[262,-26,38,3],[640,4,60,4],[760,34,50,5],[548,-30,40,6]])tree(g,t[0],t[1],t[2],t[3]);
 // barchetta ormeggiata
 g.strokeStyle="rgba(230,215,170,.8)";g.lineWidth=1.5;g.beginPath();g.moveTo(205,108);g.quadraticCurveTo(190,140,168,158);g.stroke();
 g.fillStyle="#5a3d25";g.beginPath();g.arc(205,106,4,0,TAU);g.fill();
 boat(g,150,172,-.5,96,{hull:"#7a5435",hull2:"#5b3c24",stripe:"#2f6a73",wood:"#9b6a40",benches:[-.3,.25],oars:true,wide:.26});
 // pontile
 for(const p of [[314,72],[486,72],[314,140],[486,140],[314,206],[486,206]]){g.fillStyle="#2e211a";g.beginPath();g.arc(p[0],p[1],7.5,0,TAU);g.fill();g.fillStyle="#4b3527";g.beginPath();g.arc(p[0]-1.5,p[1]-1.5,5,0,TAU);g.fill();}
 g.fillStyle="#3b2a20";g.fillRect(318,60,164,152);
 for(let k=0;k<9;k++){
  const y=62+k*16.6,tone=k%3===0?"#b07a4b":k%3===1?"#a06c40":"#b9845a";
  const wg=g.createLinearGradient(0,y,0,y+15);wg.addColorStop(0,tone);wg.addColorStop(1,css(mixc(rgb(tone),[60,35,20],.25)));
  g.fillStyle=wg;g.fillRect(320,y,160,15);
  g.strokeStyle="rgba(70,40,20,.35)";g.lineWidth=1;for(let q=0;q<3;q++){g.beginPath();g.moveTo(322,y+4+q*4);for(let x=322;x<=478;x+=12)g.lineTo(x,y+4+q*4+Math.sin(x*.08+k+q)*1.2);g.stroke();}
  g.fillStyle="#2a1d14";g.fillRect(326,y+6,2.5,2.5);g.fillRect(470,y+6,2.5,2.5);
 }
 g.fillStyle="#2c1f16";g.fillRect(318,206,164,8);g.fillStyle="rgba(255,240,210,.12)";g.fillRect(318,206,164,2);
 // secchio delle esche e cassetta
 g.fillStyle="rgba(0,0,0,.3)";g.beginPath();g.ellipse(357,183,13,7,0,0,TAU);g.fill();
 const bk=g.createRadialGradient(352,174,2,355,178,13);bk.addColorStop(0,"#7ac2e8");bk.addColorStop(1,"#2a6f98");g.fillStyle=bk;g.beginPath();g.arc(355,178,11,0,TAU);g.fill();g.fillStyle="#3c2a1a";g.beginPath();g.arc(355,178,7,0,TAU);g.fill();
 g.fillStyle="rgba(0,0,0,.3)";rr(g,448,170,30,20,3);g.fill();g.fillStyle="#2f7a52";rr(g,444,164,30,20,3);g.fill();g.fillStyle="#d9c06a";g.fillRect(456,164,6,4);g.strokeStyle="rgba(0,0,0,.3)";g.strokeRect(444.5,172.5,29,1);
}
function bgPorto(g){
 // ombre di moli e barche
 g.fillStyle="rgba(0,20,30,.3)";g.fillRect(320,116,176,108);g.fillRect(0,116,W,8);
 // tetti del Rione Terra
 const roofs=["#c4683f","#d98a52","#b85a36","#cf7848","#e0a064"];
 g.fillStyle="#8d7f6c";g.fillRect(0,0,W,46);
 for(let i=0;i<16;i++){
  const x=i*52-12+(i%2)*6,w=48+hash(i,1,7)*10,h=30+hash(i,2,7)*16,y=-4;
  const flat=hash(i,3,7)>.62;
  if(flat){g.fillStyle="#d8cdb5";g.fillRect(x,y,w,h);g.strokeStyle="#a99c84";g.lineWidth=3;g.strokeRect(x+1.5,y+1.5,w-3,h-3);g.fillStyle="#9aa3a8";g.beginPath();g.arc(x+w*.7,y+h*.45,5,0,TAU);g.fill();g.fillStyle="#f2efe6";g.fillRect(x+6,y+h*.3,10,4);}
  else{const col=rgb(roofs[i%roofs.length]);g.fillStyle=css(mixc(col,[255,230,200],.12));g.fillRect(x,y,w,h/2);g.fillStyle=css(mixc(col,[40,20,10],.18));g.fillRect(x,y+h/2,w,h/2);
   g.strokeStyle="rgba(80,30,15,.35)";g.lineWidth=1;for(let k=4;k<h;k+=5){g.beginPath();g.moveTo(x,y+k);g.lineTo(x+w,y+k);g.stroke();}g.strokeStyle="rgba(255,230,200,.4)";g.beginPath();g.moveTo(x,y+h/2);g.lineTo(x+w,y+h/2);g.stroke();}
  g.fillStyle="rgba(0,0,0,.25)";g.fillRect(x,y+h,w,4);
 }
 // cupola
 const dg=g.createRadialGradient(118,10,4,128,20,30);dg.addColorStop(0,"#f3eadb");dg.addColorStop(1,"#a99880");g.fillStyle=dg;g.beginPath();g.arc(128,20,26,0,TAU);g.fill();
 g.strokeStyle="rgba(90,80,60,.4)";g.lineWidth=1.2;for(let k=0;k<8;k++){const a=k/8*TAU;g.beginPath();g.moveTo(128,20);g.lineTo(128+Math.cos(a)*26,20+Math.sin(a)*26);g.stroke();}g.fillStyle="#cdbb98";g.beginPath();g.arc(128,20,6,0,TAU);g.fill();
 // banchina in blocchi di tufo
 g.fillStyle="#857d70";g.fillRect(0,44,W,72);
 for(let row=0;row<6;row++){let x=-hash(row,1,9)*30;const y=46+row*11.5;while(x<W){const w=24+hash(Math.round(x),row,9)*26,t=hash(Math.round(x),row,10);g.fillStyle=css(mixc([150,142,128],[185,172,150],t));g.fillRect(x+1,y,w-2,10);x+=w;}}
 g.fillStyle="#b9ae98";g.fillRect(0,108,W,9);g.fillStyle="rgba(255,255,255,.18)";g.fillRect(0,108,W,2);g.fillStyle="rgba(0,0,0,.35)";g.fillRect(0,116,W,3);
 // bitte, cassette, rete, lampioni
 for(let x=50;x<W;x+=120){if(x>300&&x<500)continue;g.fillStyle="rgba(0,0,0,.3)";g.beginPath();g.arc(x+3,99,9,0,TAU);g.fill();const bg=g.createRadialGradient(x-3,93,1,x,96,9);bg.addColorStop(0,"#6a6f75");bg.addColorStop(1,"#1d2125");g.fillStyle=bg;g.beginPath();g.arc(x,96,8,0,TAU);g.fill();}
 for(const [x,y,c] of [[560,62,"#2f6fb0"],[586,62,"#c43c34"],[573,78,"#2f6fb0"],[230,60,"#e0b13f"]]){g.fillStyle="rgba(0,0,0,.3)";g.fillRect(x+3,y+3,24,15);g.fillStyle=c;g.fillRect(x,y,24,15);g.strokeStyle="rgba(255,255,255,.25)";g.strokeRect(x+.5,y+.5,23,14);g.fillStyle="rgba(0,0,0,.25)";g.fillRect(x+3,y+5,18,2);}
 blobPath(g,672,74,40,18,3,.3);g.fillStyle="#4f5c43";g.fill();g.save();g.clip();g.strokeStyle="rgba(200,190,140,.35)";g.lineWidth=1;for(let i=-60;i<60;i+=6){g.beginPath();g.moveTo(632+i,50);g.lineTo(672+i,100);g.moveTo(712+i,50);g.lineTo(672+i,100);g.stroke();}g.restore();
 for(const x of [60,240,560,740]){g.fillStyle="#2b2f33";g.beginPath();g.arc(x,58,5,0,TAU);g.fill();g.fillStyle="#f7e7b0";g.beginPath();g.arc(x,58,2.5,0,TAU);g.fill();}
 // molo
 g.fillStyle="#9b958a";g.fillRect(312,104,176,110);
 g.fillStyle="rgba(255,255,255,.08)";for(let i=0;i<120;i++){g.fillRect(314+hash(i,1,12)*172,106+hash(i,2,12)*104,2,2);}
 g.fillStyle="#c5bfb2";g.fillRect(312,206,176,8);g.fillRect(312,104,6,110);g.fillRect(482,104,6,110);
 for(const y of [140,180]){for(const x of [305,495]){g.strokeStyle="#151719";g.lineWidth=5;g.beginPath();g.arc(x,y,7,0,TAU);g.stroke();}}
 g.fillStyle="#6c6a64";for(let k=0;k<4;k++)g.fillRect(470,150+k*8,14,3);
 // barche ormeggiate con le cime
 for(const b of [[100,182,-.2,"#2f6fa8"],[700,178,.25,"#c0392b"],[214,165,.08,"#e2b23c"]]){
  g.strokeStyle="rgba(230,215,170,.75)";g.lineWidth=1.4;g.beginPath();g.moveTo(b[0],116);g.quadraticCurveTo(b[0]+10,140,b[0]+4,b[1]-14);g.stroke();
  boat(g,b[0],b[1],b[2],112,{stripe:b[3],engine:true,rope:true});
 }
 // pali con cozze
 for(const f of R.SPOTS.porto.features)if(f.rock){
  for(const [dx,dy] of [[-10,-6],[9,-4],[0,9]]){g.fillStyle="rgba(0,20,30,.35)";g.beginPath();g.arc(f.x+dx+4,f.y+dy+5,9,0,TAU);g.fill();
   g.fillStyle="#2d4a3a";g.beginPath();g.arc(f.x+dx,f.y+dy,9,0,TAU);g.fill();g.fillStyle="#5a4632";g.beginPath();g.arc(f.x+dx,f.y+dy,6.5,0,TAU);g.fill();
   g.fillStyle="#1a1f2e";for(let k=0;k<6;k++){const a=k/6*TAU;g.beginPath();g.ellipse(f.x+dx+Math.cos(a)*8,f.y+dy+Math.sin(a)*8,2.5,1.4,a,0,TAU);g.fill();}}
 }
}
function bgScogli(g){
 // costa di tufo giallo con la macchia mediterranea
 g.beginPath();g.moveTo(0,0);for(let x=0;x<=W;x+=8)g.lineTo(x,shoreY("scogli",x));g.lineTo(W,0);g.closePath();
 g.save();g.fillStyle="rgba(0,20,30,.35)";g.translate(6,10);g.fill();g.restore();
 const tg=g.createLinearGradient(0,0,0,210);tg.addColorStop(0,"#e3bf73");tg.addColorStop(.6,"#c99a52");tg.addColorStop(1,"#9a7038");g.fillStyle=tg;g.fill();
 g.save();g.clip();
 for(let i=0;i<9;i++){g.strokeStyle="rgba(110,70,25,"+(.1+hash(i,9,9)*.14)+")";g.lineWidth=1+hash(i,8,9)*2.5;g.beginPath();const y0=10+i*21+hash(i,7,9)*10;for(let x=0;x<=W;x+=8){const y=y0+(fbm(x*.006,i*1.7,4,3)-.5)*30+Math.sin(x*.03+i)*2;x?g.lineTo(x,y):g.moveTo(x,y);}g.stroke();}
 for(let i=0;i<18;i++){const x=hash(i,30,9)*W,y=hash(i,31,9)*160;g.fillStyle="rgba(90,55,20,.18)";blobPath(g,x,y,18+hash(i,32,9)*30,8+hash(i,33,9)*12,i,.4);g.fill();}
 g.fillStyle="rgba(255,240,200,.18)";for(let i=0;i<300;i++){g.beginPath();g.arc(hash(i,1,13)*W,hash(i,2,13)*210,1+hash(i,3,13)*2,0,TAU);g.fill();}
 g.fillStyle="rgba(80,50,20,.22)";for(let i=0;i<140;i++){g.beginPath();g.arc(hash(i,4,13)*W,hash(i,5,13)*210,1+hash(i,6,13)*3,0,TAU);g.fill();}
 const lip=g.createLinearGradient(0,0,0,220);lip.addColorStop(0,"rgba(0,0,0,0)");lip.addColorStop(1,"rgba(40,25,10,.35)");g.fillStyle=lip;g.fillRect(0,0,W,220);
 g.restore();
 g.beginPath();for(let x=0;x<=W;x+=8)x?g.lineTo(x,shoreY("scogli",x)):g.moveTo(x,shoreY("scogli",x));g.strokeStyle="rgba(30,45,40,.55)";g.lineWidth=5;g.stroke();
 // piattaforma di Biagio
 blobPath(g,400,158,96,58,4,.12);const pg=g.createRadialGradient(380,140,10,400,158,100);pg.addColorStop(0,"#e8cf96");pg.addColorStop(1,"#b58a4c");g.fillStyle=pg;g.fill();
 // macchia
 for(let i=0;i<26;i++){const x=hash(i,7,13)*W,y=-6+hash(i,8,13)*42;if(Math.abs(x-400)<90&&y>10)continue;const r=10+hash(i,9,13)*16;g.fillStyle="rgba(10,30,10,.3)";g.beginPath();g.arc(x+4,y+6,r,0,TAU);g.fill();const gr=g.createRadialGradient(x-r*.3,y-r*.3,1,x,y,r);gr.addColorStop(0,"#7aa356");gr.addColorStop(1,"#2f5a2a");g.fillStyle=gr;g.beginPath();g.arc(x,y,r,0,TAU);g.fill();}
 // scogli che affiorano
 for(const f of R.SPOTS.scogli.features){if(!f.rock||f.dd>-1.5)continue;
  g.save();g.translate(7,10);blobPath(g,f.x,f.y,f.rx*.56,f.ry*.5,f.x*.01,.28);g.fillStyle="rgba(0,20,35,.4)";g.fill();g.restore();
  rockMass(g,f.x,f.y,f.rx*.55,f.ry*.48,f.x*.01,["#d9b674","#a7803f","#5e4524"],true);
  blobPath(g,f.x-f.rx*.08,f.y-f.ry*.1,f.rx*.3,f.ry*.22,f.y*.01,.3);g.fillStyle="rgba(255,240,200,.18)";g.fill();
 }
}
function bgGolfo(g){
 // Capri e i Faraglioni in lontananza
 rockMass(g,800,-30,190,100,2,["#7d8a6a","#566246","#2f3a28"],false);
 g.fillStyle="rgba(60,90,50,.55)";for(let i=0;i<30;i++){g.beginPath();g.arc(640+hash(i,1,21)*170,hash(i,2,21)*50,4+hash(i,3,21)*7,0,TAU);g.fill();}
 for(const [x,y,r] of [[640,96,26],[690,124,19],[606,128,13]]){
  g.save();g.translate(6,9);blobPath(g,x,y,r,r*.85,x*.1,.2);g.fillStyle="rgba(0,15,30,.45)";g.fill();g.restore();
  rockMass(g,x,y,r,r*.85,x*.1,["#b3ab98","#7c7466","#3e3a33"],false);
 }
 // gozzo di Biagio
 boat(g,400,146,0,300,{stripe:"#2f6fa8",engine:true,rope:true,benches:[-.45,.05,.42],wide:.2});
 g.fillStyle="#c8b48a";rr(g,505,128,26,36,4);g.fill();g.fillStyle="rgba(0,0,0,.2)";g.fillRect(505,146,26,2);
 g.strokeStyle="#e8e1d0";g.lineWidth=2;g.beginPath();g.moveTo(548,140);g.lineTo(548,118);g.stroke();g.fillStyle="#2f6fa8";g.beginPath();g.moveTo(548,118);g.lineTo(564,123);g.lineTo(548,128);g.fill();
}

/* ---------- elementi animati ---------- */
function getSeeds(){
 if(A.seeds)return A.seeds;
 const s={waves:[],glints:[],stars:[],flies:[],reeds:[]};
 for(let i=0;i<80;i++)s.waves.push({x:hash(i,1,31)*W,y:WT-80+hash(i,2,31)*(H-WT+80),len:10+hash(i,3,31)*22,ph:hash(i,4,31)*TAU,sp:.6+hash(i,5,31)*.8});
 for(let i=0;i<90;i++)s.glints.push({x:hash(i,6,31)*W,y:WT-60+hash(i,7,31)*(H-WT+60),ph:hash(i,8,31)*TAU,sp:2+hash(i,9,31)*3,r:1+hash(i,10,31)*2.2});
 for(let i=0;i<60;i++)s.stars.push({x:hash(i,11,31)*W,y:WT+hash(i,12,31)*(H-WT),ph:hash(i,13,31)*TAU});
 for(let i=0;i<14;i++)s.flies.push({ph:hash(i,14,31)*TAU,cx:hash(i,15,31)>.5?60+hash(i,16,31)*160:600+hash(i,16,31)*160,cy:100+hash(i,17,31)*90});
 for(const side of [0,1])for(let i=0;i<30;i++){const x=side?W-6-i*8.5-hash(i,18,31)*5:6+i*8.5+hash(i,18,31)*5;if(x>150&&x<650)continue;s.reeds.push({x,base:shoreY("lago",x)+4+hash(i,19+side,31)*16,h:30+hash(i,21,31)*26,ph:hash(i,22,31)*TAU,cat:hash(i,23,31)>.6});}
 A.seeds=s;return s;
}
function surfaceY(spot){return spot==="golfo"?0:spot==="porto"?118:spot==="scogli"?120:105;}
function drawWavelets(c,G,day,dusk){
 const s=getSeeds(),t=G.elapsed,w=R.WEATHER[G.weather],rough=1+w.wind*1.4,top=surfaceY(G.spot);
 c.save();c.lineCap="round";
 for(const v of s.waves){
  const x=((v.x+t*v.sp*(6+12*w.wind)*G.wind.x)%(W+60)+W+60)%(W+60)-30,y=v.y+Math.sin(t*.6+v.ph)*4;
  if(y<top)continue;
  const a=(.1+.12*Math.sin(t*v.sp+v.ph))*(.6+.4*day)*rough;if(a<=.02)continue;
  c.strokeStyle=css(dusk>.3?[255,214,170]:[230,250,250],Math.min(.4,a));c.lineWidth=1.6;
  c.beginPath();c.arc(x,y+v.len*.9,v.len,-Math.PI*.72,-Math.PI*.28);c.stroke();
  if(w.wind>=1&&Math.sin(t*1.7+v.ph*3)>.8){c.fillStyle="rgba(255,255,255,.35)";c.beginPath();c.ellipse(x,y+2,v.len*.5,2.2,0,0,TAU);c.fill();}
 }
 c.restore();
}
function drawGlints(c,G,day,dusk,night,hour){
 if(A.lowFx)return;
 const s=getSeeds(),t=G.elapsed,top=surfaceY(G.spot);
 const sunX=lerp(760,40,clamp((hour-5)/16,0,1)),cloudy=G.weather==="sereno"?1:G.weather==="vento"?.8:G.weather==="nuvoloso"?.35:.15;
 c.save();c.globalCompositeOperation="lighter";
 if(day>.05){
  const col=dusk>.2?[255,170,90]:[255,250,225];
  for(const p of s.glints){if(p.y<top)continue;const k=Math.exp(-Math.pow((p.x-sunX)/260,2));const tw=Math.pow(Math.max(0,Math.sin(t*p.sp+p.ph)),10)*k*day*cloudy;if(tw<.04)continue;
   c.fillStyle=css(col,Math.min(1,tw));c.beginPath();c.moveTo(p.x-p.r*3,p.y);c.lineTo(p.x,p.y-p.r*.6);c.lineTo(p.x+p.r*3,p.y);c.lineTo(p.x,p.y+p.r*.6);c.closePath();c.fill();}
 }
 if(night>.4&&cloudy>.3){
  const mx=600;
  for(const p of s.glints){if(p.y<top)continue;const k=Math.exp(-Math.pow((p.x-mx)/70,2));const tw=Math.pow(Math.max(0,Math.sin(t*p.sp*.7+p.ph)),6)*k*night;if(tw<.04)continue;c.fillStyle=css([200,215,255],tw*.8);c.fillRect(p.x-p.r*2.5,p.y-.6,p.r*5,1.2);}
  for(const p of s.stars){if(p.y<top)continue;const tw=.25+.25*Math.sin(t*2+p.ph);c.fillStyle=css([220,230,255],tw*night*cloudy);c.fillRect(p.x,p.y,1.4,1.4);}
 }
 c.restore();
}
function drawCaustics(c,G,day){
 if(A.lowFx||day<.06)return;
 const fx=A.cache.fx||(A.cache.fx=mk(400,380)),g=fx.getContext("2d"),t=G.elapsed*(A.reduced?.3:1);
 if(!A.cache.capat)A.cache.capat=g.createPattern(causticsTile(),"repeat");
 g.globalCompositeOperation="source-over";g.globalAlpha=1;g.clearRect(0,0,400,380);g.fillStyle=A.cache.capat;
 g.save();g.globalAlpha=.85;g.translate((t*9)%256-256,(t*5)%256-256);g.fillRect(0,0,912,892);g.restore();
 g.save();g.globalAlpha=.55;g.scale(1.4,1.4);g.translate(-((t*6)%256),(t*7)%256-256);g.fillRect(0,0,656,640);g.restore();
 g.globalAlpha=1;g.globalCompositeOperation="destination-in";g.drawImage(waterLayer(G.spot).mask,0,0,400,380);
 const cl=G.weather==="sereno"?1:G.weather==="vento"?.85:G.weather==="nuvoloso"?.5:.3;
 c.save();c.globalCompositeOperation="lighter";c.globalAlpha=.3*day*cl;c.drawImage(fx,0,0,W,H);c.restore();
}
function drawRays(c,G,day){
 if(A.lowFx||day<.2)return;
 const t=G.elapsed,cl=G.weather==="sereno"?1:G.weather==="nuvoloso"?.5:.3;
 c.save();c.globalCompositeOperation="screen";
 for(let i=0;i<6;i++){
  const x=((i*157+t*(5+i))%1100)-150,w=30+(i%3)*28;
  const gr=c.createLinearGradient(0,WT-80,0,H);gr.addColorStop(0,"rgba(255,248,215,"+(.09*day*cl)+")");gr.addColorStop(1,"rgba(255,248,215,0)");
  c.fillStyle=gr;c.beginPath();c.moveTo(x,WT-80);c.lineTo(x+w,WT-80);c.lineTo(x+w-170,H);c.lineTo(x-170,H);c.closePath();c.fill();
 }
 c.restore();
}
function drawUnderwaterLife(c,G){
 const t=G.elapsed;
 if(G.spot==="lago"){const f=R.SPOTS.lago.features.find(q=>q.weed);c.save();c.lineCap="round";
  for(let i=0;i<26;i++){const x=f.x-f.rx*.85+i*f.rx*.068,y=f.y+Math.sin(i*1.7)*f.ry*.55,sw=Math.sin(t*1.3+i)*6;c.strokeStyle=i%3?"rgba(40,110,60,.45)":"rgba(80,140,70,.45)";c.lineWidth=3;c.beginPath();c.moveTo(x,y+16);c.quadraticCurveTo(x+sw*.5,y,x+sw,y-18);c.stroke();}
  c.restore();}
}
function drawShadows(c,G,V){
 const fog=G.weather==="nebbia",night=V.night&&!V.lantern,sonar=V.sonar,S=R.SPOTS[G.spot],t=G.elapsed;
 for(const f of G.fish){
  const depth=R.depthAt(G.spot,f.x,f.y),dk=clamp(1.15-depth/(S.depth[1]*1.3),.45,1);
  const a=.5*f.fade*(fog?.55:1)*(night?.55:1)*dk;if(a<=.01)continue;
  const spr=shadowSprite(f.sp,f.size,f.fish.karmagra);
  c.save();c.translate(f.x,f.y);
  if(f.fish.karmagra||f.sp.rarity==="leggendario"||f.sp.shimmer){
   const gl=c.createRadialGradient(0,0,2,0,0,f.size*1.8);gl.addColorStop(0,f.fish.karmagra?"rgba(190,120,255,.35)":"rgba(255,220,120,.3)");gl.addColorStop(1,"rgba(0,0,0,0)");
   c.globalCompositeOperation="lighter";c.fillStyle=gl;c.beginPath();c.arc(0,0,f.size*1.8,0,TAU);c.fill();c.globalCompositeOperation="source-over";
  }
  c.rotate(Math.atan2(f.vy,Math.abs(f.vx)+.01)*.25*f.dir);if(f.dir<0)c.scale(-1,1);
  c.scale(1+Math.sin(f.wiggle)*.035,1-Math.sin(f.wiggle)*.02);
  c.globalAlpha=a;c.drawImage(spr.c,-spr.w/2+(f.sp.shadow==="lungo"?0:spr.s*.15),-spr.h/2,spr.w,spr.h);
  c.restore();
  if((f.sp.rarity==="leggendario"||f.sp.shimmer)&&Math.sin(t*3+f.id*20)>.6){c.save();c.globalCompositeOperation="lighter";c.fillStyle="rgba(255,240,170,.8)";const sx=f.x+Math.sin(t*7+f.id*9)*f.size,sy=f.y+Math.cos(t*5+f.id*7)*f.size*.5;star4(c,sx,sy,3.5);c.restore();}
  if(f.state==="interested"||f.state==="nibbling"){if(Math.random()<.08)G.ripples.push({x:f.x+(Math.random()-.5)*10,y:f.y,r:1,life:.5,color:"#e9fbff"});}
  if(sonar&&f.fade>.5)pill(c,(f.fish.karmagra?"✧ ":"")+f.sp.name+" · "+R.fmtKg(f.fish.weight),f.x,f.y-f.size-10,{font:"700 14px system-ui,sans-serif",fg:"#e4fff6",bg:"rgba(3,30,40,.6)"});
 }
}
function star4(c,x,y,r){c.beginPath();c.moveTo(x-r*2.2,y);c.lineTo(x,y-r*.5);c.lineTo(x+r*2.2,y);c.lineTo(x,y+r*.5);c.closePath();c.moveTo(x,y-r*2.2);c.lineTo(x+r*.5,y);c.lineTo(x,y+r*2.2);c.lineTo(x-r*.5,y);c.closePath();c.fill();}
function pill(c,text,x,y,o){
 o=o||{};c.save();c.font=o.font||"700 15px system-ui,sans-serif";c.textAlign="center";c.textBaseline="middle";
 const w=c.measureText(text).width+(o.padX||14),h=o.h||24;
 c.fillStyle=o.bg||"rgba(3,25,35,.72)";rr(c,x-w/2,y-h/2,w,h,h/2);c.fill();
 if(o.border){c.strokeStyle=o.border;c.lineWidth=1.5;c.stroke();}
 c.fillStyle=o.fg||"#fff";c.fillText(text,x,y+1);c.restore();return w;
}
function drawShoreFoam(c,G){
 const t=G.elapsed,spot=G.spot;
 c.save();c.lineCap="round";
 if(spot==="lago"||spot==="scogli"){
  const strong=spot==="scogli"?1:.45,w=R.WEATHER[G.weather].wind;
  for(let layer=0;layer<2;layer++){
   c.beginPath();for(let x=0;x<=W;x+=10){const y=shoreY(spot,x)+3+layer*6+Math.sin(x*.05+t*(1.4+layer*.5))*2.5*(1+w);x?c.lineTo(x,y):c.moveTo(x,y);}
   c.strokeStyle="rgba(255,255,255,"+(strong*(layer?.22:.45))+")";c.lineWidth=layer?2:3;c.setLineDash(layer?[6,10]:[18,7]);c.lineDashOffset=-t*(10+layer*6);c.stroke();
  }
  c.setLineDash([]);
 }
 if(spot==="scogli"){for(const f of R.SPOTS.scogli.features){if(!f.rock||f.dd>-1.5)continue;for(let k=0;k<2;k++){c.strokeStyle="rgba(255,255,255,"+(.38-k*.16)+")";c.lineWidth=3-k;c.beginPath();c.ellipse(f.x,f.y,f.rx*.6+k*6+Math.sin(t*2+f.x+k)*3,f.ry*.53+k*5+Math.sin(t*2+f.x+k)*2,0,0,TAU);c.stroke();}}}
 if(spot==="porto"){c.strokeStyle="rgba(230,245,245,.25)";c.lineWidth=2;c.beginPath();for(let x=0;x<=W;x+=10){const y=121+Math.sin(x*.06+t*1.6)*1.5;x?c.lineTo(x,y):c.moveTo(x,y);}c.stroke();
  for(const f of R.SPOTS.porto.features)if(f.rock){c.strokeStyle="rgba(230,245,245,.3)";c.beginPath();c.ellipse(f.x,f.y+2,24+Math.sin(t*2)*2,14,0,0,TAU);c.stroke();}}
 if(spot==="golfo"){
  c.strokeStyle="rgba(255,255,255,.45)";c.lineWidth=3;c.beginPath();c.ellipse(400,150,158+Math.sin(t*2)*2,36+Math.sin(t*2.3)*1.5,0,0,TAU);c.stroke();
  c.strokeStyle="rgba(255,255,255,.18)";c.lineWidth=2;for(let k=0;k<3;k++){const r=((t*16+k*30)%90);c.globalAlpha=1-r/90;c.beginPath();c.ellipse(400,150,165+r,42+r*.4,0,0,TAU);c.stroke();}c.globalAlpha=1;
  for(const [x,y,r] of [[640,96,26],[690,124,19],[606,128,13]]){c.strokeStyle="rgba(255,255,255,.4)";c.lineWidth=2;c.beginPath();c.ellipse(x,y,r*1.15+Math.sin(t*2+x)*2,r+Math.sin(t*2+x)*2,0,0,TAU);c.stroke();}
  const by=Math.sin(t*1.8)*2;c.fillStyle="rgba(0,20,30,.3)";c.beginPath();c.ellipse(190,424,12,5,0,0,TAU);c.fill();c.strokeStyle="rgba(255,255,255,.35)";c.lineWidth=1.5;c.beginPath();c.ellipse(184,420+by*.3,14+Math.sin(t*2)*2,6,0,0,TAU);c.stroke();const bg=c.createRadialGradient(181,412+by,1,184,416+by,9);bg.addColorStop(0,"#ff9a7e");bg.addColorStop(1,"#b8261c");c.fillStyle=bg;c.beginPath();c.arc(184,416+by,9,0,TAU);c.fill();c.strokeStyle="#2b2b2b";c.lineWidth=2;c.beginPath();c.moveTo(184,408+by);c.lineTo(184,396+by);c.stroke();c.fillStyle="#ffd34d";c.beginPath();c.moveTo(184,396+by);c.lineTo(194,399+by);c.lineTo(184,402+by);c.fill();
 }
 c.restore();
}
function drawSurfaceDecor(c,G,V){
 const t=G.elapsed;
 if(G.spot!=="lago")return;
 for(const p of [[70,300,26,1],[738,305,24,0],[88,668,31,1],[722,672,34,1],[96,478,21,0],[650,248,18,0]]){
  c.save();c.translate(p[0],p[1]);c.rotate(Math.sin(t*.4+p[0])*.12);
  c.fillStyle="rgba(0,25,20,.3)";c.beginPath();c.arc(4,5,p[2],.25,Math.PI*2.17);c.lineTo(4,5);c.fill();
  const lg=c.createRadialGradient(-p[2]*.3,-p[2]*.3,2,0,0,p[2]);lg.addColorStop(0,"#5fae6e");lg.addColorStop(1,"#226a4c");c.fillStyle=lg;c.beginPath();c.arc(0,0,p[2],.25,Math.PI*2.17);c.lineTo(0,0);c.fill();
  c.strokeStyle="rgba(170,230,160,.4)";c.lineWidth=1.2;for(let k=0;k<6;k++){const a=.5+k*.95;c.beginPath();c.moveTo(0,0);c.lineTo(Math.cos(a)*p[2]*.9,Math.sin(a)*p[2]*.9);c.stroke();}
  if(p[3]){c.translate(p[2]*.35,-p[2]*.25);for(let k=0;k<8;k++){c.rotate(TAU/8);c.fillStyle=k%2?"#f6b8cf":"#fbd6e3";c.beginPath();c.ellipse(5,0,6,3,0,0,TAU);c.fill();}c.fillStyle="#f7d35b";c.beginPath();c.arc(0,0,3,0,TAU);c.fill();}
  c.restore();
 }
}
function drawReeds(c,G){
 if(G.spot!=="lago")return;
 const t=G.elapsed,w=R.WEATHER[G.weather].wind;
 c.save();c.lineCap="round";
 for(const r of getSeeds().reeds){
  const sw=Math.sin(t*(1.1+w*.8)+r.ph)*(4+w*7),tx=r.x+sw,ty=r.base-r.h;
  c.strokeStyle="rgba(0,30,20,.25)";c.lineWidth=3;c.beginPath();c.moveTo(r.x+4,r.base+3);c.quadraticCurveTo(r.x+6+sw*.3,r.base-r.h*.4,tx+8,ty+6);c.stroke();
  c.strokeStyle=r.cat?"#6f9a4c":"#86ad5a";c.lineWidth=3;c.beginPath();c.moveTo(r.x,r.base);c.quadraticCurveTo(r.x+sw*.3,r.base-r.h*.5,tx,ty);c.stroke();
  c.strokeStyle="rgba(210,240,150,.5)";c.lineWidth=1;c.beginPath();c.moveTo(r.x-1,r.base-4);c.quadraticCurveTo(r.x+sw*.3-1,r.base-r.h*.5,tx-1,ty+2);c.stroke();
  if(r.cat){c.fillStyle="#6b4527";rr(c,tx-2.6,ty-11,5.2,13,2.6);c.fill();}
  else{c.strokeStyle="#7ea852";c.lineWidth=2;c.beginPath();c.moveTo(r.x,r.base-r.h*.3);c.quadraticCurveTo(r.x+12+sw*.3,r.base-r.h*.55,r.x+16+sw*.5,r.base-r.h*.35);c.stroke();}
 }
 c.restore();
}
function drawBirds(c,G,dt,day){
 if(day<.3||G.spot==="lago"&&G.weather!=="sereno"){A.birds.length=0;return;}
 A.nextBird-=dt;
 if(A.nextBird<=0&&A.birds.length<3){A.nextBird=6+Math.random()*10;const dir=Math.random()<.5?1:-1;A.birds.push({x:dir>0?-40:W+40,y:200+Math.random()*400,vx:dir*(70+Math.random()*40),ph:Math.random()*6});}
 c.save();
 for(const b of A.birds){b.x+=b.vx*dt;b.y+=Math.sin(G.elapsed+b.ph)*10*dt;const fl=Math.sin(G.elapsed*8+b.ph)*6,d=Math.sign(b.vx);
  c.fillStyle="rgba(0,20,30,.18)";c.beginPath();c.ellipse(b.x+24,b.y+40,10,4,0,0,TAU);c.fill();
  c.strokeStyle="#f4f4ee";c.lineWidth=3;c.lineCap="round";c.beginPath();c.moveTo(b.x-12,b.y-fl);c.quadraticCurveTo(b.x-5,b.y-6,b.x,b.y);c.quadraticCurveTo(b.x+5,b.y-6,b.x+12,b.y-fl);c.stroke();
  c.fillStyle="#f4f4ee";c.beginPath();c.ellipse(b.x+d*3,b.y,4,2.4,0,0,TAU);c.fill();c.fillStyle="#f0a830";c.fillRect(b.x+d*7-1,b.y-1,3,2);}
 A.birds=A.birds.filter(b=>b.x>-60&&b.x<W+60);
 c.restore();
}
function drawFrenzy(c,G){
 const fz=G.frenzy;if(!fz)return;const t=G.elapsed;
 c.save();
 for(let i=0;i<22;i++){const a=i*2.4+t*.9,r=(i*13)%fz.r,x=fz.x+Math.cos(a)*r,y=fz.y+Math.sin(a)*r*.6,k=(t*2.5+i*.37)%1;c.strokeStyle="rgba(240,252,255,"+(.6*(1-k))+")";c.lineWidth=1.5;c.beginPath();c.arc(x,y,1.5+k*5,0,TAU);c.stroke();}
 const fg=c.createRadialGradient(fz.x,fz.y,4,fz.x,fz.y,fz.r*.8);fg.addColorStop(0,"rgba(255,255,255,.16)");fg.addColorStop(1,"rgba(255,255,255,0)");c.fillStyle=fg;c.beginPath();c.ellipse(fz.x,fz.y,fz.r*.8,fz.r*.5,0,0,TAU);c.fill();
 for(const gl of G.gulls){const a=gl.a+t*gl.s,x=fz.x+Math.cos(a)*gl.r,y=fz.y-34+Math.sin(a)*gl.r*.5,fl=Math.sin(t*9+gl.a)*5;
  c.fillStyle="rgba(0,20,30,.2)";c.beginPath();c.ellipse(x+18,y+34,9,3.5,0,0,TAU);c.fill();
  c.strokeStyle="#f7f7f2";c.lineWidth=3;c.lineCap="round";c.beginPath();c.moveTo(x-11,y-fl);c.quadraticCurveTo(x-4,y-6,x,y);c.quadraticCurveTo(x+4,y-6,x+11,y-fl);c.stroke();}
 c.restore();
}

/* ---------- Biagio, canna, lenza, galleggiante ---------- */
/* Biagio Gelo pescatore: tre personaggi in due stili.
 * Personaggi: base (pelato, canottiera nera, tatuato), giovane (cappellino rosso, maglietta blu),
 * pesce (una cernia gigante col cappello da pescatore che tiene Biagio in braccio).
 * Stili: "vettoriale" (contorni, ombre a due toni, muscoli e mani modellate) e "pixel" (sprite a bassa
 * risoluzione con palette limitata e contorno automatico, ridisegnato a ogni fotogramma per animarlo). */
const SKINS={
 base:{name:"Biagio Gelo",desc:"Pelato, canottiera nera, occhiali bianchi, braccia tatuate e cornetto portafortuna. L'originale."},
 giovane:{name:"Il giovane Biagio",desc:"Cappellino rosso, maglietta blu e tracolla: il Biagio dei primi giochi."},
 pesce:{name:"Pescato!",desc:"Una cernia gigante col cappello da pescatore tiene Biagio in braccio come un trofeo."}
};
const STYLES={vettoriale:"Vettoriale",pixel:"Pixel art"};
const INK="#2a170f",INKD="#08090d";
const SK={hi:"#ffdcb4",base:"#f3b98d",sh:"#d18a62",dk:"#8e5236"};
function pickExpr(G,V){
 const f=G.fight,h=G.hook,ratio=f?Math.min(1.2,f.tension/f.line.limit):0,mood=V.mood;
 if(V.trophy)return"joy";if(mood&&mood.life>0)return mood.type;if(f)return ratio>.75?"strain":"focus";
 if(h.mode==="bite")return"surprise";if(h.mode==="nibble")return"alert";if(h.mode==="casting")return"focus";return"calm";
}
function qpt(a,e,b,t){const u=1-t;return{x:u*u*a.x+2*u*t*e.x+t*t*b.x,y:u*u*a.y+2*u*t*e.y+t*t*b.y};}
function rrp(g,x,y,w,h,r){g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath();}

/* ======================= VETTORIALE DELUXE ======================= */
function cel(c,build,base,shade,sx,sy,ink,lw){
 c.save();c.beginPath();build(c);c.fillStyle=shade;c.fill();c.clip();
 c.translate(-sx,-sy);c.beginPath();build(c);c.fillStyle=base;c.fill();c.restore();
 if(ink){c.beginPath();build(c);c.strokeStyle=ink;c.lineWidth=lw||2.2;c.lineJoin="round";c.lineCap="round";c.stroke();}
}
function tube(pts,ws){
 return c=>{
  const n=pts.length-1,L=[],Rr=[];
  for(let i=0;i<=n;i++){const p=pts[i],q=pts[Math.min(n,i+1)],o=pts[Math.max(0,i-1)],a=Math.atan2(q.y-o.y,q.x-o.x)+Math.PI/2,w=ws[i]/2;L.push({x:p.x+Math.cos(a)*w,y:p.y+Math.sin(a)*w});Rr.push({x:p.x-Math.cos(a)*w,y:p.y-Math.sin(a)*w});}
  const a0=Math.atan2(pts[1].y-pts[0].y,pts[1].x-pts[0].x),a1=Math.atan2(pts[n].y-pts[n-1].y,pts[n].x-pts[n-1].x);
  c.moveTo(L[0].x,L[0].y);for(const p of L)c.lineTo(p.x,p.y);
  c.arc(pts[n].x,pts[n].y,ws[n]/2,a1+Math.PI/2,a1-Math.PI/2,true);
  for(let i=n;i>=0;i--)c.lineTo(Rr[i].x,Rr[i].y);
  c.arc(pts[0].x,pts[0].y,ws[0]/2,a0-Math.PI/2,a0+Math.PI/2,true);c.closePath();
 };
}
function armGeom(S,E,Hd,thick){
 const pts=[],ws=[];
 for(let i=0;i<=12;i++){const t=i/12;pts.push(qpt(S,E,Hd,t));const base=lerp(thick*1.28,thick*.86,t);ws.push(base+Math.exp(-Math.pow((t-.24)/.12,2))*thick*.32+Math.exp(-Math.pow((t-.62)/.1,2))*thick*.12);}
 return{pts,ws};
}
/* motivi tatuati disegnati lungo il braccio (già ritagliati dentro la sagoma) */
function tattooSleeve(c,pts,ws,variant){
 const ink="#1f2f52",red="#c8303a",grn="#2f8a52",gold="#e2b54a";
 const at=(i,fn)=>{const p=pts[i],q=pts[Math.min(pts.length-1,i+1)],o=pts[Math.max(0,i-1)];c.save();c.translate(p.x,p.y);c.rotate(Math.atan2(q.y-o.y,q.x-o.x));fn(ws[i]);c.restore();};
 // fiamme tribali sul bicipite
 for(let i=1;i<=5;i++)at(i,w=>{c.fillStyle=ink;c.beginPath();const s=i%2?1:-1;c.moveTo(-3,0);c.quadraticCurveTo(0,s*w*.55,3.2,s*w*.08);c.quadraticCurveTo(.5,s*w*.18,-3,0);c.fill();});
 at(3,w=>{c.fillStyle=ink;c.beginPath();c.moveTo(-5,-w*.1);c.lineTo(4,0);c.lineTo(-5,w*.1);c.fill();});
 // anello al gomito
 at(6,w=>{c.strokeStyle=ink;c.lineWidth=1.6;c.beginPath();c.moveTo(-1.5,-w/2);c.lineTo(-1.5,w/2);c.moveTo(1.5,-w/2);c.lineTo(1.5,w/2);c.stroke();});
 // avambraccio
 if(variant===1)at(9,w=>{
  c.fillStyle=grn;c.beginPath();c.ellipse(-4.5,2.6,3.6,1.7,.5,0,TAU);c.fill();c.beginPath();c.ellipse(4,-2.8,3.2,1.5,.5,0,TAU);c.fill();
  for(let k=0;k<5;k++){const a=k/5*TAU;c.fillStyle=k%2?"#e0444c":red;c.beginPath();c.arc(Math.cos(a)*1.9,Math.sin(a)*1.9,2.3,0,TAU);c.fill();}
  c.fillStyle="#8e1a24";c.beginPath();c.arc(0,0,1.5,0,TAU);c.fill();c.strokeStyle="#ff9aa2";c.lineWidth=.6;c.beginPath();c.arc(-.6,-.6,1.2,3.4,5.6);c.stroke();
 });
 else at(9,w=>{
  c.strokeStyle=ink;c.lineWidth=1.5;c.lineCap="round";c.beginPath();c.moveTo(-5,0);c.lineTo(5,0);c.moveTo(-2.5,-2.6);c.lineTo(-2.5,2.6);c.moveTo(4,-3.4);c.quadraticCurveTo(7.4,0,4,3.4);c.stroke();
  c.beginPath();c.arc(-6.3,0,1.3,0,TAU);c.stroke();c.strokeStyle=gold;c.lineWidth=.8;c.beginPath();c.moveTo(-6,1.5);c.bezierCurveTo(-2,4.5,1,-4.5,5,1);c.stroke();
 });
 // polso
 at(11,w=>{c.fillStyle=ink;for(let k=-2;k<=2;k++){c.beginPath();c.arc(0,k*w*.18,.75,0,TAU);c.fill();}});
}
function armV(c,S,E,Hd,thick,o){
 const g=armGeom(S,E,Hd,thick),build=tube(g.pts,g.ws);
 cel(c,build,o.skin||SK.base,o.skinSh||SK.sh,3,2.4,o.ink||INK,2);
 if(o.tattoo){c.save();c.beginPath();build(c);c.clip();tattooSleeve(c,g.pts,g.ws,o.tattoo);c.restore();c.beginPath();build(c);c.strokeStyle=o.ink||INK;c.lineWidth=2;c.stroke();}
 if(o.scales){c.save();c.beginPath();build(c);c.clip();c.strokeStyle="rgba(90,40,12,.45)";c.lineWidth=1.1;for(let i=1;i<12;i++){const p=g.pts[i];for(const s of [-1,1]){c.beginPath();c.arc(p.x+s*2.5,p.y+s*1.5,3,.3,Math.PI-.3);c.stroke();}}c.restore();}
 c.save();c.beginPath();build(c);c.clip();c.strokeStyle="rgba(255,240,220,.45)";c.lineWidth=thick*.22;c.lineCap="round";c.beginPath();for(let i=1;i<10;i++){const p=g.pts[i],w=g.ws[i];const q=g.pts[i+1];const a=Math.atan2(q.y-p.y,q.x-p.x)-Math.PI/2;const x=p.x+Math.cos(a)*w*.28,y=p.y+Math.sin(a)*w*.28;i>1?c.lineTo(x,y):c.moveTo(x,y);}c.stroke();c.restore();
 if(o.sleeve){const s=armGeom(S,E,Hd,thick);const sp=s.pts.slice(0,5),sw=s.ws.slice(0,5).map(w=>w+5);cel(c,tube(sp,sw),o.sleeve[0],o.sleeve[1],2.5,2,o.sleeve[2],2);
  c.strokeStyle=o.sleeve[1];c.lineWidth=1.4;const p=sp[4],q=sp[3],a=Math.atan2(p.y-q.y,p.x-q.x)+Math.PI/2;c.beginPath();c.moveTo(p.x+Math.cos(a)*sw[4]*.42,p.y+Math.sin(a)*sw[4]*.42);c.lineTo(p.x-Math.cos(a)*sw[4]*.42,p.y-Math.sin(a)*sw[4]*.42);c.stroke();}
 return g;
}
function handV(c,p,ang,r,o){
 o=o||{};c.save();c.translate(p.x,p.y);c.rotate(ang);
 const base=o.skin||SK.base,sh=o.skinSh||SK.sh,ink=o.ink||INK;
 if(o.fins){for(let k=-1;k<=1;k++){cel(c,g=>{g.ellipse(r*.55,k*r*.62,r*.7,r*.36,k*.25,0,TAU);},base,sh,1,1,ink,1.5);}c.restore();return;}
 cel(c,g=>{g.ellipse(0,0,r*1.12,r*.98,0,0,TAU);},base,sh,1.6,1.6,ink,1.9);
 c.strokeStyle="rgba(120,60,35,.75)";c.lineWidth=1.1;c.lineCap="round";for(const k of [-.42,0,.42]){c.beginPath();c.moveTo(r*.25,k*r);c.lineTo(r*.98,k*r*.86);c.stroke();}
 cel(c,g=>{g.ellipse(-r*.15,-r*.98,r*.48,r*.32,-.35,0,TAU);},base,sh,1,1,ink,1.6);
 c.restore();
}
function rodV(c,G,V,H1,ratio){
 const f=G.fight,tip=V.tip(),dl=Math.hypot(tip.x-H1.x,tip.y-H1.y)||1,ux=(tip.x-H1.x)/dl,uy=(tip.y-H1.y)/dl,nx=-uy,ny=ux;
 const butt={x:H1.x-ux*16,y:H1.y-uy*16},mx=(H1.x+tip.x)/2+(tip.x-H1.x)*.12*ratio+12*ratio*(f&&f.screenX<tip.x?-1:1),my=(H1.y+tip.y)/2-6*ratio;
 const path=g=>{g.moveTo(butt.x,butt.y);g.quadraticCurveTo(mx,my,tip.x,tip.y);};
 c.lineCap="round";
 c.strokeStyle="rgba(0,0,0,.25)";c.lineWidth=6;c.beginPath();c.moveTo(butt.x+4,butt.y+5);c.quadraticCurveTo(mx+4,my+5,tip.x+4,tip.y+5);c.stroke();
 c.strokeStyle=INKD;c.lineWidth=6.2;c.beginPath();path(c);c.stroke();
 c.strokeStyle="#39434b";c.lineWidth=3.6;c.beginPath();c.moveTo(butt.x,butt.y);c.quadraticCurveTo(lerp(butt.x,mx,.6),lerp(butt.y,my,.6),mx,my);c.stroke();
 c.strokeStyle="#4a5762";c.lineWidth=2;c.beginPath();c.moveTo(mx,my);c.quadraticCurveTo(lerp(mx,tip.x,.5),lerp(my,tip.y,.5),tip.x,tip.y);c.stroke();
 c.strokeStyle="rgba(255,255,255,.4)";c.lineWidth=.9;c.beginPath();c.moveTo(butt.x-1,butt.y-1);c.quadraticCurveTo(mx-1,my-1,tip.x-1,tip.y-1);c.stroke();
 // impugnatura in sughero
 const g0={x:butt.x,y:butt.y},g1={x:H1.x+ux*5,y:H1.y+uy*5};
 c.strokeStyle=INK;c.lineWidth=8.6;c.beginPath();c.moveTo(g0.x,g0.y);c.lineTo(g1.x,g1.y);c.stroke();
 c.strokeStyle="#c79a62";c.lineWidth=6.4;c.beginPath();c.moveTo(g0.x,g0.y);c.lineTo(g1.x,g1.y);c.stroke();
 c.fillStyle="rgba(110,70,35,.55)";for(let k=0;k<9;k++){const q=hash(k,3,5);c.beginPath();c.arc(lerp(g0.x,g1.x,q)+nx*(hash(k,4,5)-.5)*4,lerp(g0.y,g1.y,q)+ny*(hash(k,4,5)-.5)*4,.7,0,TAU);c.fill();}
 c.strokeStyle="#e9c992";c.lineWidth=1.4;c.beginPath();c.moveTo(g0.x-nx*1.6,g0.y-ny*1.6);c.lineTo(g1.x-nx*1.6,g1.y-ny*1.6);c.stroke();
 // anelli
 for(let k=1;k<=4;k++){const q=k/5,gx=lerp(lerp(H1.x,mx,q),lerp(mx,tip.x,q),q),gy=lerp(lerp(H1.y,my,q),lerp(my,tip.y,q),q);c.strokeStyle=INKD;c.lineWidth=2.4;c.beginPath();c.arc(gx+nx*2,gy+ny*2,2.7-k*.35,0,TAU);c.stroke();c.strokeStyle="#d5dade";c.lineWidth=1.2;c.stroke();}
 // mulinello: corpo, bobina con il filo, archetto, manovella che gira
 const R0={x:H1.x+ux*8+nx*10,y:H1.y+uy*8+ny*10};
 c.strokeStyle=INKD;c.lineWidth=4;c.beginPath();c.moveTo(H1.x+ux*8+nx*2,H1.y+uy*8+ny*2);c.lineTo(R0.x,R0.y);c.stroke();c.strokeStyle="#8d969d";c.lineWidth=2.2;c.stroke();
 cel(c,g=>{g.arc(R0.x,R0.y,7.6,0,TAU);},"#d9dee2","#7d878e",2,2,INKD,1.8);
 c.fillStyle="#f2efe2";c.beginPath();c.arc(R0.x,R0.y,4.6,0,TAU);c.fill();c.strokeStyle="rgba(120,120,110,.6)";c.lineWidth=.6;for(let k=0;k<3;k++){c.beginPath();c.arc(R0.x,R0.y,2.2+k*.9,0,TAU);c.stroke();}
 c.fillStyle="#c0392b";c.beginPath();c.arc(R0.x,R0.y,1.7,0,TAU);c.fill();
 c.strokeStyle="#e4e8eb";c.lineWidth=1.3;c.beginPath();c.arc(R0.x,R0.y,9.3,-1.2+Math.atan2(uy,ux),1.2+Math.atan2(uy,ux));c.stroke();
 const ca=A.crank,kx=R0.x+Math.cos(ca)*10,ky=R0.y+Math.sin(ca)*10;c.strokeStyle=INKD;c.lineWidth=3.4;c.beginPath();c.moveTo(R0.x,R0.y);c.lineTo(kx,ky);c.stroke();c.strokeStyle="#aab3b9";c.lineWidth=1.8;c.stroke();
 cel(c,g=>{g.ellipse(kx,ky,2.6,3.4,ca,0,TAU);},"#3a3f45","#1d2024",.8,.8,INKD,1.2);
 cel(c,g=>{g.arc(tip.x,tip.y,2.6,0,TAU);},"#ffd75e","#c99a2e",.8,.8,INKD,1.2);
 return{x:H1.x+ux*21,y:H1.y+uy*21,ang:Math.atan2(uy,ux)};
}
function faceV(c,fx,fy,expr,young,t){
 // sopracciglia sagomate
 const br={calm:[0,0],focus:[2.2,-.3],strain:[3.6,.6],surprise:[-4.2,-3.8],alert:[-2.2,-1.8],joy:[-3,-2.6],sad:[-3,2.4]}[expr]||[0,0];
 const by=young?1.5:0;
 for(const s of [-1,1]){c.fillStyle=young?"#4a2c18":"#35210f";c.beginPath();c.moveTo(fx+s*4.2,fy-12+by+br[0]);c.quadraticCurveTo(fx+s*11,fy-15+by+(br[0]+br[1])/2,fx+s*18.5,fy-12.5+by+br[1]);c.quadraticCurveTo(fx+s*11,fy-11.2+by+(br[0]+br[1])/2,fx+s*4.2,fy-9.6+by+br[0]);c.closePath();c.fill();}
 // occhiali bianchi: montatura spessa con ombra, lenti a specchio
 const frame=g=>{rrp(g,fx-21.5,fy-8,20,14.5,6);rrp(g,fx+1.5,fy-8,20,14.5,6);};
 c.fillStyle="rgba(0,0,0,.18)";c.save();c.translate(1.5,2.5);c.beginPath();frame(c);c.fill();c.restore();
 cel(c,frame,"#fdfcf6","#cfd3da",1.2,2,INKD,1.8);
 for(const ox of [-19.2,3.8]){
  const lens=g=>{rrp(g,fx+ox,fy-5.6,15.4,9.8,4);};
  const lg=c.createLinearGradient(0,fy-6,0,fy+5);lg.addColorStop(0,"#0a1220");lg.addColorStop(.55,"#173a50");lg.addColorStop(1,"#3f93a8");
  c.beginPath();lens(c);c.fillStyle=lg;c.fill();
  c.save();c.beginPath();lens(c);c.clip();const gx=((t*20+ox*2)%70)-25;c.fillStyle="rgba(255,255,255,.65)";c.beginPath();c.moveTo(fx+ox+gx,fy+5);c.lineTo(fx+ox+gx+4,fy+5);c.lineTo(fx+ox+gx+11,fy-6);c.lineTo(fx+ox+gx+7,fy-6);c.fill();
  c.fillStyle="rgba(255,255,255,.35)";c.fillRect(fx+ox+1.5,fy-4.6,5,1.4);c.restore();
 }
 c.strokeStyle=INKD;c.lineWidth=1.6;c.beginPath();c.moveTo(fx-1.6,fy-3.4);c.quadraticCurveTo(fx,fy-6.5,fx+1.6,fy-3.4);c.stroke();
 // naso
 cel(c,g=>{g.moveTo(fx-1,fy+6);g.quadraticCurveTo(fx+5,fy+11,fx+3.5,fy+13.2);g.quadraticCurveTo(fx,fy+14.6,fx-3,fy+13);g.quadraticCurveTo(fx-1.5,fy+10,fx-1,fy+6);g.closePath();},SK.base,SK.sh,-1.5,1,null);
 c.strokeStyle="rgba(120,60,35,.8)";c.lineWidth=1.3;c.beginPath();c.moveTo(fx+3.8,fy+12.8);c.quadraticCurveTo(fx+1,fy+14.8,fx-2.6,fy+13.2);c.stroke();
 // guance
 c.fillStyle=young?"rgba(255,110,100,.32)":"rgba(240,120,100,.16)";c.beginPath();c.ellipse(fx-14,fy+11,5.5,3,0,0,TAU);c.ellipse(fx+14,fy+11,5.5,3,0,0,TAU);c.fill();
 // bocca
 const my=fy+20;c.lineCap="round";c.lineJoin="round";
 if(expr==="joy"){cel(c,g=>{g.moveTo(fx-10,my-2.5);g.quadraticCurveTo(fx,my+13,fx+10,my-2.5);g.quadraticCurveTo(fx,my+.5,fx-10,my-2.5);g.closePath();},"#5a1712","#3a0c09",0,0,INK,1.8);
  c.save();c.beginPath();c.moveTo(fx-10,my-2.5);c.quadraticCurveTo(fx,my+13,fx+10,my-2.5);c.closePath();c.clip();c.fillStyle="#fff";c.fillRect(fx-9,my-2.5,18,3.4);c.fillStyle="#ea6f6f";c.beginPath();c.ellipse(fx+1,my+7,5,3,0,0,TAU);c.fill();c.restore();}
 else if(expr==="surprise"){cel(c,g=>{g.ellipse(fx,my+1,4.6,6,0,0,TAU);},"#5a1712","#3a0c09",0,0,INK,1.8);c.fillStyle="#ea6f6f";c.beginPath();c.ellipse(fx,my+4,2.6,1.6,0,0,TAU);c.fill();}
 else if(expr==="alert"){cel(c,g=>{g.ellipse(fx,my,2.8,3.2,0,0,TAU);},"#5a1712","#3a0c09",0,0,INK,1.6);}
 else if(expr==="strain"){cel(c,g=>{rrp(g,fx-9,my-3.6,18,7.4,3);},"#ffffff","#d9d9d4",0,1,INK,1.8);c.strokeStyle="rgba(90,40,30,.7)";c.lineWidth=1;c.beginPath();for(let k=-4.5;k<=4.5;k+=3)c.moveTo(fx+k,my-3.4),c.lineTo(fx+k,my+3.6);c.moveTo(fx-9,my);c.lineTo(fx+9,my);c.stroke();}
 else if(expr==="sad"){c.strokeStyle=INK;c.lineWidth=2.4;c.beginPath();c.moveTo(fx-8,my+3.5);c.quadraticCurveTo(fx,my-3.5,fx+8,my+3.5);c.stroke();}
 else if(expr==="focus"){c.strokeStyle="#7a2c20";c.lineWidth=2.2;c.beginPath();c.moveTo(fx-6.5,my+.4);c.quadraticCurveTo(fx,my-1,fx+6.5,my-.2);c.stroke();}
 else{c.strokeStyle="#7a2c20";c.lineWidth=2.2;c.beginPath();c.moveTo(fx-8,my-1.6);c.quadraticCurveTo(fx,my+5.5,fx+8,my-1.6);c.stroke();c.strokeStyle="rgba(120,60,35,.35)";c.lineWidth=1.2;c.beginPath();c.moveTo(fx+8.6,my-3);c.lineTo(fx+9.4,my-.4);c.stroke();}
}
function bodyV(c,skin,expr,lx,ly,t,ratio){
 const young=skin==="giovane",breathe=Math.sin(t*1.8);
 // scarpe
 for(const sx of [389,411]){
  cel(c,g=>{rrp(g,sx-11.5,195,23,8.5,4);},"#2c2c31","#16161a",0,1,INKD,1.8);
  cel(c,g=>{g.ellipse(sx,197,10.5,6.4,0,0,TAU);},"#fbfaf6","#cbc8bf",1.5,2,INKD,1.8);
  c.strokeStyle=young?"#2f6fb0":"#c0392b";c.lineWidth=2;c.beginPath();c.moveTo(sx-6,199);c.quadraticCurveTo(sx,196.5,sx+6,199);c.stroke();
  c.strokeStyle="rgba(60,60,60,.5)";c.lineWidth=.9;for(let k=-1;k<=1;k++){c.beginPath();c.moveTo(sx-2.5,193.6+k*1.6+1);c.lineTo(sx+2.5,193.6+k*1.6+1);c.stroke();}
 }
 // gambe
 if(young){
  for(const lx0 of [383,403])cel(c,g=>{rrp(g,lx0,176,14,21,6);},SK.base,SK.sh,2,0,INK,1.8);
  for(const lx0 of [383,403]){c.fillStyle="#f4f4ee";c.fillRect(lx0+1,191,12,3.5);}
  cel(c,g=>{g.moveTo(379,163);g.lineTo(421,163);g.lineTo(423,184);g.quadraticCurveTo(412,187,401.5,183);g.lineTo(398.5,183);g.quadraticCurveTo(388,187,377,184);g.closePath();},"#d4b479","#a88651",3,2,INK,2);
  c.strokeStyle="rgba(110,80,40,.6)";c.lineWidth=1.1;c.beginPath();c.moveTo(400,167);c.lineTo(400,182);c.moveTo(381,168);c.quadraticCurveTo(387,172,386,178);c.stroke();
 }else{
  for(const lx0 of [382,402])cel(c,g=>{g.moveTo(lx0,164);g.lineTo(lx0+16,164);g.lineTo(lx0+15,197);g.lineTo(lx0+1.5,197);g.closePath();},"#3a3c46","#23242b",3,0,INKD,2);
  c.strokeStyle="rgba(255,255,255,.12)";c.lineWidth=1.3;c.beginPath();c.moveTo(388,168);c.lineTo(388.5,194);c.moveTo(408,168);c.lineTo(408.5,194);c.stroke();
 }
 // busto
 c.save();c.translate(400,150);c.scale(1+breathe*.006,1+breathe*.012);c.translate(-400,-150);
 if(young){
  const tee=g=>{g.moveTo(371,128);g.quadraticCurveTo(384,119,393,120.5);g.quadraticCurveTo(400,126,407,120.5);g.quadraticCurveTo(416,119,429,128);g.quadraticCurveTo(435,150,427,171);g.quadraticCurveTo(400,180,373,171);g.quadraticCurveTo(365,150,371,128);g.closePath();};
  cel(c,tee,"#4a86da","#2e5ea8",6,3,"#132c57",2.2);
  c.save();c.beginPath();tee(c);c.clip();c.fillStyle="rgba(255,255,255,.16)";c.beginPath();c.ellipse(384,140,6,16,.15,0,TAU);c.fill();c.restore();
  c.strokeStyle="#2a5aa6";c.lineWidth=3.2;c.beginPath();c.moveTo(393,121);c.quadraticCurveTo(400,128,407,121);c.stroke();c.strokeStyle="#132c57";c.lineWidth=1.2;c.stroke();
  c.strokeStyle="rgba(19,44,87,.5)";c.lineWidth=1.2;c.beginPath();c.moveTo(381,150);c.quadraticCurveTo(385,158,382,166);c.moveTo(418,152);c.quadraticCurveTo(414,160,417,168);c.stroke();
 }else{
  const chest=g=>{g.moveTo(386,122);g.quadraticCurveTo(400,148,414,122);g.closePath();};
  cel(c,chest,SK.base,SK.sh,4,0,null);
  // cuore MAMMA
  c.save();c.translate(400,131.5);
  cel(c,g=>{g.moveTo(0,5);g.bezierCurveTo(-8.5,-.5,-5,-7.2,0,-3);g.bezierCurveTo(5,-7.2,8.5,-.5,0,5);g.closePath();},"#d23440","#9c1c28",1,1,"#2a1530",1.1);
  c.fillStyle="#f4ead2";c.beginPath();c.moveTo(-8,-1.8);c.lineTo(8,-1.8);c.lineTo(6.6,1.4);c.lineTo(-6.6,1.4);c.closePath();c.fill();c.strokeStyle="#2a1530";c.lineWidth=.7;c.stroke();
  c.fillStyle="#1f2f52";c.font="900 3.1px system-ui,sans-serif";c.textAlign="center";c.textBaseline="middle";c.fillText("MAMMA",0,-.2);c.restore();
  const top=g=>{g.moveTo(374,126);g.quadraticCurveTo(380,120.5,387,122.5);g.quadraticCurveTo(400,148,413,122.5);g.quadraticCurveTo(420,120.5,426,126);g.quadraticCurveTo(432,140,424.5,147);g.lineTo(423.5,171);g.quadraticCurveTo(400,179,376.5,171);g.lineTo(375.5,147);g.quadraticCurveTo(368,140,374,126);g.closePath();};
  cel(c,top,"#30323b","#17181e",6,3,INKD,2.2);
  c.save();c.beginPath();top(c);c.clip();c.fillStyle="rgba(255,255,255,.1)";c.beginPath();c.ellipse(385,146,5,18,.12,0,TAU);c.fill();
  c.strokeStyle="rgba(0,0,0,.35)";c.lineWidth=1.2;c.beginPath();c.moveTo(392,155);c.quadraticCurveTo(398,160,404,156);c.moveTo(408,140);c.quadraticCurveTo(414,146,413,154);c.stroke();c.restore();
  // cintura
  cel(c,g=>{rrp(g,376,166,48,7.5,2);},"#4a3322","#2e1f14",0,1.5,INK,1.6);
  cel(c,g=>{rrp(g,395,165,10,9.5,2);},"#f1cd6a","#b88e2a",1,1,INK,1.4);c.fillStyle="#4a3322";c.fillRect(398,168,4,3.5);
 }
 // tracolla con cuciture e borsello
 const strap=g=>{g.moveTo(377,123.5);g.lineTo(383,122);g.lineTo(424,163.5);g.lineTo(418.5,167);g.closePath();};
 cel(c,strap,"#1b1d24","#0e0f13",1,1,INKD,1.4);
 c.strokeStyle="rgba(170,180,195,.6)";c.lineWidth=.9;c.setLineDash([2.2,2.2]);c.beginPath();c.moveTo(380.5,122.8);c.lineTo(421.5,165.5);c.stroke();c.setLineDash([]);
 cel(c,g=>{rrp(g,410,157,18,15,3.5);},"#22252d","#121318",2,2,INKD,1.8);
 cel(c,g=>{rrp(g,410,157,18,6.5,3);},"#2d313b","#1a1c22",0,1,INKD,1.4);
 cel(c,g=>{rrp(g,417,161.5,4.4,3,1);},"#e8e2cf","#b6ae96",0,.6,null);
 c.restore();
 // collo
 cel(c,g=>{rrp(g,392.5,110,15,15,3);},SK.base,SK.sh,4,0,INK,1.8);
 c.fillStyle="rgba(140,70,40,.3)";c.beginPath();c.ellipse(400,113,9,3.4,0,0,TAU);c.fill();
 if(!young){
  c.strokeStyle="#7a5a12";c.lineWidth=2.4;c.beginPath();c.moveTo(389,121.5);c.quadraticCurveTo(400,129.5,411,121.5);c.stroke();c.strokeStyle="#f3d16a";c.lineWidth=1.3;c.setLineDash([1.6,1]);c.stroke();c.setLineDash([]);
  // cornetto portafortuna
  c.save();c.translate(400,129.5);c.rotate(.25);cel(c,g=>{g.moveTo(-2.4,0);g.quadraticCurveTo(-2,6,3.4,9);g.quadraticCurveTo(.8,4.6,2.4,0);g.closePath();},"#e2332f","#a51b1b",.8,.8,"#3a0a0a",1);c.fillStyle="#f3d16a";c.fillRect(-2.6,-1.4,5.2,1.8);c.restore();
  c.fillStyle="#1f2f52";star4(c,406.5,115.5,1.6);
 }
 // testa
 const hx=400+lx*.35,hy=96+breathe*.4,rx=young?25.5:24.5,ry=young?26.5:27.5;
 for(const s of [-1,1]){const ex=hx+s*rx;cel(c,g=>{g.ellipse(ex,hy+4,5,7,s*.12,0,TAU);},SK.base,SK.sh,s>0?1.5:-.5,1,INK,1.8);c.strokeStyle="rgba(150,80,50,.7)";c.lineWidth=1.1;c.beginPath();c.arc(ex+s*.6,hy+4,2.6,s>0?-1.4:1.7,s>0?1.4:4.6);c.stroke();}
 if(!young){c.strokeStyle="#7a5a12";c.lineWidth=2.6;c.beginPath();c.arc(hx-rx-1.2,hy+11,2.8,0,TAU);c.stroke();c.strokeStyle="#f8da78";c.lineWidth=1.3;c.stroke();}
 const head=g=>{g.ellipse(hx,hy,rx,ry,0,0,TAU);};
 cel(c,head,SK.base,SK.sh,6,4.5,INK,2.3);
 if(young){
  // capelli castani ai lati
  for(const s of [-1,1])cel(c,g=>{g.moveTo(hx+s*(rx-1),hy-10);g.quadraticCurveTo(hx+s*(rx+2.5),hy,hx+s*(rx-2),hy+9);g.quadraticCurveTo(hx+s*(rx-7),hy,hx+s*(rx-7),hy-9);g.closePath();},"#6a4428","#46291a",s,1,INK,1.4);
  // cappellino rosso: calotta a spicchi, bottone, logo, visiera in avanti
  const dome=g=>{g.moveTo(hx-rx-2.5,hy-5);g.bezierCurveTo(hx-rx-1,hy-36,hx+rx+1,hy-36,hx+rx+2.5,hy-5);g.quadraticCurveTo(hx,hy-11.5,hx-rx-2.5,hy-5);g.closePath();};
  cel(c,dome,"#e8473c","#a8261f",5,4,"#3d0b0c",2.2);
  c.save();c.beginPath();dome(c);c.clip();c.strokeStyle="rgba(90,10,12,.55)";c.lineWidth=1.2;c.beginPath();c.moveTo(hx,hy-31);c.lineTo(hx,hy-9);c.moveTo(hx-12,hy-28);c.quadraticCurveTo(hx-15,hy-17,hx-16,hy-8);c.moveTo(hx+12,hy-28);c.quadraticCurveTo(hx+15,hy-17,hx+16,hy-8);c.stroke();
  c.fillStyle="rgba(255,255,255,.28)";c.beginPath();c.ellipse(hx-9,hy-24,7.5,3.6,-.4,0,TAU);c.fill();c.restore();
  cel(c,g=>{g.arc(hx,hy-31,2.6,0,TAU);},"#b42a25","#7a1a18",.6,.6,"#3d0b0c",1.2);
  cel(c,g=>{rrp(g,hx-6,hy-22,12,9,2.4);},"#fbf8ee","#d9d3c4",0,1,"#3d0b0c",1.1);
  c.fillStyle="#d12f2a";c.font="900 7px Georgia,serif";c.textAlign="center";c.textBaseline="middle";c.fillText("B",hx,hy-17.3);
  const brim=g=>{g.ellipse(hx+lx*.4,hy-6.5,23.5,7.2,0,0,Math.PI);g.closePath();};
  cel(c,brim,"#d63c32","#8f1d1a",0,-2,"#3d0b0c",2);
  c.fillStyle="rgba(50,15,8,.3)";c.beginPath();c.ellipse(hx,hy-1.2,18,3.2,0,0,Math.PI);c.fill();
 }else{
  c.fillStyle="rgba(255,252,238,.75)";c.beginPath();c.ellipse(hx-8.5,hy-17,8.6,4.2,-.45,0,TAU);c.fill();
  c.fillStyle="rgba(255,252,238,.45)";c.beginPath();c.arc(hx+4,hy-22.5,2.1,0,TAU);c.fill();
  c.fillStyle="rgba(70,45,30,.18)";for(let i=0;i<46;i++){const a=hash(i,5,3)*Math.PI,r=hash(i,6,3);c.fillRect(hx+Math.cos(a+Math.PI*.05)*(9+r*9),hy+9+Math.sin(a)*(5+r*8),.9,.9);}
  c.strokeStyle="#1f2f52";c.lineWidth=1.2;c.beginPath();c.moveTo(hx+17,hy-15);c.lineTo(hx+21.5,hy-6.5);c.moveTo(hx+20,hy-16.2);c.lineTo(hx+23.4,hy-9);c.stroke();
 }
 faceV(c,hx+lx,hy+ly,expr,young,t);
 if(expr==="strain"||(expr==="focus"&&ratio>.6)){for(let k=0;k<2;k++){const ph=(t*1.4+k*.5)%1,sx=hx+(k?28:-28),sy=hy-8+ph*22;c.globalAlpha=1-ph;cel(c,g=>{g.moveTo(sx,sy-5);g.quadraticCurveTo(sx+3.6,sy+1,sx,sy+3.6);g.quadraticCurveTo(sx-3.6,sy+1,sx,sy-5);g.closePath();},"#cdeeff","#86c4e8",0,1,"#24546e",1);c.globalAlpha=1;}}
}
function trophyFish(c,tr,x,y,t){
 const size=clamp(tr.size*.9,12,40);
 c.save();c.translate(x,y);c.rotate(Math.sin(t*6)*.08);
 if(tr.karmagra){c.shadowBlur=20;c.shadowColor="#c77dff";}else if(tr.sp.rarity!=="comune"){c.shadowBlur=16;c.shadowColor="#ffe08a";}
 fishShape(c,tr.sp,size,{karmagra:tr.karmagra,wiggle:t*10});c.restore();
 c.save();c.globalCompositeOperation="lighter";c.fillStyle="rgba(255,240,170,.9)";for(let k=0;k<5;k++){const a=t*2+k*1.26,r=size*1.8;star4(c,x+Math.cos(a)*r,y+Math.sin(a)*r*.5,2.5+Math.sin(t*8+k)*1.2);}c.restore();
}
const FISHC={base:"#d48a45",sh:"#9c5626",ink:"#3e1c08",belly:"#f7ddb0",spot:"#7a3d18"};
function giantFishV(c,t,expr,lx,ly){
 const bob=Math.sin(t*1.6)*1.5;
 for(const s of [-1,1]){c.save();c.translate(400+s*18,197);c.rotate(s*.38);cel(c,g=>{g.moveTo(0,-13);g.quadraticCurveTo(s*17,-3,s*22,9);g.quadraticCurveTo(s*7,5,-s*9,11);g.closePath();},"#c06e34","#7e3e1c",s*1.5,1.5,FISHC.ink,1.8);c.strokeStyle="rgba(70,30,10,.55)";c.lineWidth=1;for(let k=0;k<4;k++){c.beginPath();c.moveTo(0,-9);c.lineTo(s*(6+k*4.4),6-k);c.stroke();}c.restore();}
 c.save();c.translate(0,bob);
 // pinna dorsale dietro la testa
 cel(c,g=>{g.moveTo(366,58);for(let k=0;k<7;k++){g.lineTo(368+k*10.5,40-Math.sin(k/6*Math.PI)*14);g.lineTo(372+k*10.5,54);}g.lineTo(436,62);g.closePath();},"#c9783a","#8c4a20",2,2,FISHC.ink,1.6);
 const body=g=>{g.ellipse(400,112,51,79,0,0,TAU);};
 cel(c,body,FISHC.base,FISHC.sh,9,6,FISHC.ink,2.6);
 c.save();c.beginPath();body(c);c.clip();
 c.fillStyle=FISHC.belly;c.beginPath();c.ellipse(400,146,27,52,0,0,TAU);c.fill();
 c.strokeStyle="rgba(255,236,200,.25)";c.lineWidth=1.2;for(let r=0;r<10;r++)for(let k=0;k<8;k++){c.beginPath();c.arc(352+k*14+(r%2)*7,44+r*16,6.5,.25,Math.PI-.25);c.stroke();}
 c.fillStyle="rgba(122,61,24,.5)";for(let i=0;i<30;i++){const x=352+hash(i,1,77)*96,y=40+hash(i,2,77)*150;if(Math.abs(x-400)<20&&y>100)continue;c.beginPath();c.ellipse(x,y,2+hash(i,3,77)*3.5,1.6+hash(i,4,77)*2.5,hash(i,5,77)*3,0,TAU);c.fill();}
 c.fillStyle="rgba(255,250,235,.28)";c.beginPath();c.ellipse(380,70,12,24,-.3,0,TAU);c.fill();
 c.restore();
 // opercolo
 for(const s of [-1,1]){c.strokeStyle="rgba(62,28,8,.6)";c.lineWidth=2;c.beginPath();c.arc(400+s*6,96,36,s>0?-.25:Math.PI-.45,s>0?.45:Math.PI+.25);c.stroke();}
 // cappello da pescatore
 cel(c,g=>{g.ellipse(400,50,42,11,0,0,TAU);},"#e6b13a","#a87a14",0,2,"#5e4006",1.8);
 const crown=g=>{g.moveTo(371,49);g.quadraticCurveTo(372,19,400,17.5);g.quadraticCurveTo(428,19,429,49);g.closePath();};
 cel(c,crown,"#ffd96b","#d9a52c",4,2,"#5e4006",1.8);
 c.save();c.beginPath();crown(c);c.clip();c.fillStyle="#2f6fb0";c.fillRect(370,40,60,6.5);c.strokeStyle="rgba(140,100,20,.5)";c.lineWidth=.8;c.setLineDash([1.6,1.6]);for(let k=0;k<3;k++){c.beginPath();c.moveTo(372,27+k*4);c.quadraticCurveTo(400,22+k*4,428,27+k*4);c.stroke();}c.setLineDash([]);c.fillStyle="rgba(255,255,255,.35)";c.beginPath();c.ellipse(389,27,8,3.4,-.3,0,TAU);c.fill();c.restore();
 // occhi
 for(const s of [-1,1]){const ex=400+s*20,ey=71;
  cel(c,g=>{g.arc(ex,ey,11.5,0,TAU);},"#fffbea","#e3dcc4",1.5,1.5,FISHC.ink,2);
  const ix=ex+lx*.9,iy=ey+ly*.9+1;c.fillStyle="#d8a12a";c.beginPath();c.arc(ix,iy,6.4,0,TAU);c.fill();c.fillStyle="#141c22";c.beginPath();c.arc(ix,iy,4.2,0,TAU);c.fill();c.fillStyle="#fff";c.beginPath();c.arc(ix-2,iy-2,1.8,0,TAU);c.fill();
  if(expr==="joy"&&s>0){cel(c,g=>{g.arc(ex,ey,11.8,Math.PI,0);g.closePath();},FISHC.base,FISHC.sh,0,1,FISHC.ink,2);c.strokeStyle=FISHC.ink;c.lineWidth=2.2;c.beginPath();c.moveTo(ex-9,ey+1);c.quadraticCurveTo(ex,ey-4,ex+9,ey+1);c.stroke();}
  const br=expr==="strain"?3.5:expr==="surprise"?-3.5:expr==="focus"?2:0;c.fillStyle=FISHC.ink;c.beginPath();c.moveTo(ex-10,ey-16-s*br*.3);c.quadraticCurveTo(ex,ey-19+br*.4,ex+10,ey-16+s*br);c.lineTo(ex+10,ey-13.5+s*br);c.quadraticCurveTo(ex,ey-16+br*.4,ex-10,ey-13.5-s*br*.3);c.closePath();c.fill();}
 // bocca carnosa
 const open=expr==="surprise"||expr==="joy"?1:expr==="strain"?.25:.55;
 cel(c,g=>{g.ellipse(400,104,22,5.5+open*7.5,0,0,TAU);},"#4a1210","#2a0706",0,2,null);
 if(open>.3){c.fillStyle="#fffdf2";for(let k=-2;k<=2;k++){c.beginPath();c.moveTo(400+k*8-3.2,98.4-open*3.4);c.lineTo(400+k*8,104.5-open*2);c.lineTo(400+k*8+3.2,98.4-open*3.4);c.fill();}c.fillStyle="#d8606a";c.beginPath();c.ellipse(402,108+open*3,8,2.6,0,0,TAU);c.fill();}
 c.strokeStyle=FISHC.ink;c.lineWidth=7.6;c.beginPath();c.ellipse(400,104,23,6.2+open*7.5,0,0,TAU);c.stroke();
 c.strokeStyle="#ec8a78";c.lineWidth=5.2;c.stroke();
 c.strokeStyle="rgba(255,255,255,.45)";c.lineWidth=1.6;c.beginPath();c.ellipse(400,102.5,20,3.8+open*6.5,0,Math.PI*1.15,Math.PI*1.85);c.stroke();
 c.restore();
}
function fisherV(c,G,V,dt){
 const t=G.elapsed,f=G.fight,h=G.hook,tr=V.trophy,skin=V.skin||"base";
 const ratio=f?Math.min(1.2,f.tension/f.line.limit):0,expr=pickExpr(G,V);
 let lx=0,ly=0;const tgt=f?{x:f.screenX,y:f.screenY}:(h.mode!=="idle"&&h.x!=null?{x:h.x,y:h.y}:null);
 if(tgt){lx=clamp((tgt.x-400)/110,-1,1)*4;ly=clamp((tgt.y-260)/300,0,1)*2.5;}else lx=Math.sin(t*.35)*2.5;
 const dx=f?-f.lateral*3:0,dy=-ratio*4+(tr?-3:0)+(expr==="surprise"?-1.5:0);
 const sg=c.createRadialGradient(404,203,4,404,203,skin==="pesce"?56:44);sg.addColorStop(0,"rgba(0,0,0,.42)");sg.addColorStop(1,"rgba(0,0,0,0)");c.fillStyle=sg;c.beginPath();c.ellipse(404,203,skin==="pesce"?56:44,skin==="pesce"?14:12,0,0,TAU);c.fill();
 lanternV(c,V,t);
 const tat=skin==="giovane"?null:1;
 const armO=side=>skin==="giovane"?{sleeve:["#4a86da","#2e5ea8","#132c57"]}:{tattoo:side};
 if(skin==="pesce"){
  c.save();c.translate(dx*.5,dy*.5);
  giantFishV(c,t,expr==="sad"?"strain":expr,lx,ly);
  const cx=406,cy=150+Math.sin(t*1.6)*1.5-(tr?8:0),ang=-Math.PI/2+.2+Math.sin(t*1.3)*.03,sc=.9;
  const tf=p=>{const x=(p.x-400)*sc,y=(p.y-150)*sc;return{x:cx+x*Math.cos(ang)-y*Math.sin(ang),y:cy+x*Math.sin(ang)+y*Math.cos(ang)};};
  const fo={skin:FISHC.base,skinSh:FISHC.sh,ink:FISHC.ink,scales:true};
  const FH1={x:364,y:170},FH2={x:448,y:174};
  armV(c,{x:352,y:104},{x:320,y:146},FH1,15,fo);armV(c,{x:448,y:104},{x:484,y:150},FH2,15,fo);
  c.save();c.translate(cx,cy);c.rotate(ang);c.scale(sc,sc);c.translate(-400,-150);bodyV(c,"base",expr==="calm"?"joy":expr,lx*.5,0,t,ratio);c.restore();
  handV(c,{x:FH1.x+2,y:FH1.y-5},-1.25,7,{...fo,fins:true});handV(c,{x:FH2.x-2,y:FH2.y-5},-1.9,7,{...fo,fins:true});
  const S1=tf({x:372,y:130}),S2=tf({x:428,y:130}),belly=tf({x:408,y:156});
  if(tr){const H1={x:452,y:92+dy};armV(c,S2,{x:(S2.x+H1.x)/2,y:(S2.y+H1.y)/2-4},H1,8.5,{tattoo:1});trophyFish(c,tr,468,80,t);handV(c,H1,-1.2,5.4);armV(c,S1,{x:(S1.x+belly.x)/2,y:(S1.y+belly.y)/2+6},belly,8.5,{tattoo:2});handV(c,belly,-.4,5.2);}
  else{const H1=V.hand,r=rodV(c,G,V,H1,ratio);armV(c,S2,{x:(S2.x+H1.x)/2+2,y:(S2.y+H1.y)/2-6},H1,8.5,{tattoo:1});armV(c,S1,{x:(S1.x+belly.x)/2,y:(S1.y+belly.y)/2+6},belly,8.5,{tattoo:2});handV(c,H1,r.ang+.3,5.6);handV(c,belly,-.3,5.2);}
  c.restore();return;
 }
 c.save();c.translate(dx,dy);bodyV(c,skin,expr,lx,ly,t,ratio);c.restore();
 const S1={x:372+dx,y:130+dy},S2={x:428+dx,y:130+dy};
 if(tr){
  const lift=Math.sin(Math.min(1,(1-tr.life/tr.max)*3)*Math.PI/2),py=150-lift*86;
  const H1={x:368+dx,y:py+dy},H2={x:432+dx,y:py+dy};
  armV(c,S1,{x:354+dx,y:(S1.y+H1.y)/2+6},H1,10.5,armO(2));armV(c,S2,{x:446+dx,y:(S2.y+H2.y)/2+6},H2,10.5,armO(1));
  trophyFish(c,tr,400+dx,py-6+dy,t);
  handV(c,H1,-1.7,6.6);handV(c,H2,-1.45,6.6);
  return;
 }
 const H1=V.hand,r=rodV(c,G,V,H1,ratio),H2={x:r.x,y:r.y};
 const E1={x:(S1.x+H2.x)/2-10,y:(S1.y+H2.y)/2+16},E2={x:(S2.x+H1.x)/2+14,y:(S2.y+H1.y)/2+2};
 armV(c,S2,E2,H1,10.5,armO(1));armV(c,S1,E1,H2,10.5,armO(2));
 handV(c,H1,r.ang+.4,6.4);handV(c,H2,r.ang-.2,6.2);
}
function lanternV(c,V,t){
 if(!V.lantern)return;const on=V.night>.3,fl=.85+Math.sin(t*13)*.08+Math.sin(t*7.3)*.05;
 c.fillStyle="rgba(0,0,0,.3)";c.beginPath();c.ellipse(342,194,11,4,0,0,TAU);c.fill();
 cel(c,g=>{rrp(g,333.5,170,16,23,3);},"#4a3a26","#2c2216",1.5,1.5,INK,1.6);
 c.fillStyle=on?css([255,214,128],fl):"#9a8a68";c.fillRect(336.5,174,10,14);
 c.strokeStyle=INK;c.lineWidth=2;c.beginPath();c.arc(341.5,170,5.2,Math.PI,0);c.stroke();
}

/* ======================= PIXEL ART ======================= */
const PXS=3,PX0={x:328,y:12},PXW=48,PXH=84;
const PXP={
 skin:["#ffe0b8","#f4b98a","#cf8459","#8c4e30"],black:["#545866","#30323b","#1b1c22"],white:["#ffffff","#e4e2da","#a9a79f"],
 lens:["#0d1a2a","#2f6f85"],red:["#ff6f5e","#de3d34","#9c2420"],blue:["#86b4f0","#4a86da","#2a5aa6"],khaki:["#ecd29a","#cfae72","#9d7f48"],
 hair:["#7a5232","#4e321e"],gold:["#ffe27a","#d9a83a"],ink:"#22345a",inkr:"#c8303a",inkg:"#2f8a52",outline:"#140c0a",
 fish:["#f2ae66","#d4853f","#9c5626","#6b3414"],belly:"#f8e0b4",spot:"#8a4720",hat:["#ffe58a","#f0bf3c","#b4841c"],lips:["#f0937f","#c8604f"],mouth:"#3a0d0b"
};
function pxBuf(key){let b=A.cache[key];if(!b){const c=mk(PXW,PXH);b=A.cache[key]={c,g:c.getContext("2d")};}return b;}
function PXapi(g){
 const R=Math.round;
 return{
  p(x,y,col){g.fillStyle=col;g.fillRect(R(x),R(y),1,1);},
  r(x,y,w,h,col){g.fillStyle=col;g.fillRect(R(x),R(y),Math.max(1,R(w)),Math.max(1,R(h)));},
  e(cx,cy,rx,ry,col){g.fillStyle=col;for(let y=-ry;y<=ry;y++){const k=Math.sqrt(Math.max(0,1-Math.pow(y/(ry+.5),2)))*(rx+.5);const x0=R(cx-k),x1=R(cx+k);if(x1>x0)g.fillRect(x0,R(cy+y),x1-x0,1);}},
  l(x0,y0,x1,y1,col,t){g.fillStyle=col;t=t||1;x0=R(x0);y0=R(y0);x1=R(x1);y1=R(y1);const dx=Math.abs(x1-x0),dy=-Math.abs(y1-y0),sx=x0<x1?1:-1,sy=y0<y1?1:-1;let err=dx+dy,n=0;const o=Math.floor(t/2);
   for(;;){g.fillRect(x0-o,y0-o,t,t);if(x0===x1&&y0===y1||n++>400)break;const e2=2*err;if(e2>=dy){err+=dy;x0+=sx;}if(e2<=dx){err+=dx;y0+=sy;}}},
  q(a,e,b,col,t){let px=a.x,py=a.y;for(let i=1;i<=10;i++){const p=qpt(a,e,b,i/10);this.l(px,py,p.x,p.y,col,t);px=p.x;py=p.y;}}
 };
}
function pxOutline(b,col){
 const g=b.g,img=g.getImageData(0,0,PXW,PXH),d=img.data,out=new Uint8ClampedArray(d);
 const rgb=[parseInt(col.slice(1,3),16),parseInt(col.slice(3,5),16),parseInt(col.slice(5,7),16)];
 for(let y=0;y<PXH;y++)for(let x=0;x<PXW;x++){const i=(y*PXW+x)*4;if(d[i+3]>0)continue;
  if((x>0&&d[i-4+3])||(x<PXW-1&&d[i+4+3])||(y>0&&d[i-PXW*4+3])||(y<PXH-1&&d[i+PXW*4+3])){out[i]=rgb[0];out[i+1]=rgb[1];out[i+2]=rgb[2];out[i+3]=255;}}
 g.putImageData(new ImageData(out,PXW,PXH),0,0);
}
const X=x=>(x-PX0.x)/PXS,Y=y=>(y-PX0.y)/PXS;
function pxFace(P,fx,fy,expr,young,t){
 // sopracciglia
 const br={calm:[0,0],focus:[1,0],strain:[1,0],surprise:[-1,-1],alert:[-1,-1],joy:[-1,-1],sad:[-1,1]}[expr]||[0,0];
 const bc=young?PXP.hair[1]:"#3a2414";
 P.r(fx-6,fy-4+br[1],2,1,bc);P.r(fx-4,fy-4+br[0],2,1,bc);P.r(fx+2,fy-4+br[0],2,1,bc);P.r(fx+4,fy-4+br[1],2,1,bc);
 // occhiali
 P.r(fx-7,fy-2,7,4,PXP.white[0]);P.r(fx+1,fy-2,7,4,PXP.white[0]);P.r(fx-7,fy+1,7,1,PXP.white[1]);P.r(fx+1,fy+1,7,1,PXP.white[1]);P.r(fx,fy-2,1,1,PXP.white[0]);
 P.r(fx-6,fy-1,5,2,PXP.lens[0]);P.r(fx+2,fy-1,5,2,PXP.lens[0]);P.r(fx-6,fy,5,1,PXP.lens[1]);P.r(fx+2,fy,5,1,PXP.lens[1]);
 const gl=Math.floor(t*3)%9;if(gl<5){P.p(fx-6+gl,fy-1,"#ffffff");P.p(fx+2+gl,fy-1,"#ffffff");}
 // naso e bocca
 P.p(fx,fy+3,PXP.skin[2]);P.p(fx+1,fy+3,PXP.skin[2]);
 const m=fy+6,mc="#5a1712";
 if(expr==="joy"){P.r(fx-2,m,5,2,mc);P.r(fx-2,m,5,1,"#ffffff");P.p(fx,m+1,"#e06a6a");}
 else if(expr==="surprise"){P.r(fx-1,m,2,2,mc);}
 else if(expr==="alert"){P.p(fx,m,mc);}
 else if(expr==="strain"){P.r(fx-2,m,5,1,"#ffffff");P.p(fx-2,m,mc);P.p(fx+2,m,mc);}
 else if(expr==="sad"){P.r(fx-1,m,3,1,mc);P.p(fx-2,m+1,mc);P.p(fx+2,m+1,mc);}
 else if(expr==="focus"){P.r(fx-2,m,5,1,mc);}
 else{P.p(fx-2,m,mc);P.r(fx-1,m+1,3,1,mc);P.p(fx+2,m,mc);}
 if(young){P.p(fx-5,fy+3,"#f08a80");P.p(fx-4,fy+3,"#f08a80");P.p(fx+4,fy+3,"#f08a80");P.p(fx+5,fy+3,"#f08a80");}
}
function pxBody(P,skin,expr,lx,ly,t){
 const young=skin==="giovane",br=Math.sin(t*1.8)>.6?1:0;
 // scarpe
 for(const sx of [X(389),X(411)]){P.r(sx-3,Y(196),7,2,PXP.white[0]);P.r(sx-3,Y(196)+2,7,1,"#2a2a2e");P.p(sx-1,Y(196)+1,young?"#2f6fb0":"#c0392b");P.p(sx,Y(196)+1,young?"#2f6fb0":"#c0392b");P.p(sx+1,Y(196)+1,young?"#2f6fb0":"#c0392b");}
 // gambe
 if(young){
  P.r(X(384),Y(178),5,6,PXP.skin[1]);P.r(X(403),Y(178),5,6,PXP.skin[1]);P.r(X(384)+3,Y(178),2,6,PXP.skin[2]);P.r(X(403)+3,Y(178),2,6,PXP.skin[2]);
  P.r(X(384),Y(191),5,1,PXP.white[0]);P.r(X(403),Y(191),5,1,PXP.white[0]);
  P.r(X(378),Y(162),15,7,PXP.khaki[1]);P.r(X(378),Y(162),15,1,PXP.khaki[0]);P.r(X(378)+11,Y(162)+1,4,6,PXP.khaki[2]);P.p(X(400),Y(168),PXP.khaki[2]);P.p(X(400),Y(171),PXP.khaki[2]);
 }else{
  P.r(X(382),Y(164),6,11,PXP.black[1]);P.r(X(402),Y(164),6,11,PXP.black[1]);P.r(X(382)+4,Y(164),2,11,PXP.black[2]);P.r(X(402)+4,Y(164),2,11,PXP.black[2]);P.r(X(382)+1,Y(164)+1,1,9,PXP.black[0]);P.r(X(402)+1,Y(164)+1,1,9,PXP.black[0]);
 }
 // busto
 const tx=X(374),ty=Y(124)-br*0;
 if(young){
  P.r(tx-1,ty,19,16,PXP.blue[1]);P.r(tx-1,ty,19,2,PXP.blue[0]);P.r(tx+13,ty+2,5,14,PXP.blue[2]);P.r(tx,ty+2,2,12,PXP.blue[0]);
  P.r(tx+6,ty-1,6,2,PXP.blue[2]);P.r(tx+7,ty-1,4,1,PXP.skin[1]);
 }else{
  P.r(tx,ty,18,16,PXP.black[1]);P.r(tx+13,ty,5,16,PXP.black[2]);P.r(tx+1,ty+2,2,12,PXP.black[0]);
  P.r(tx+5,ty,8,3,PXP.skin[1]);P.r(tx+6,ty+3,6,1,PXP.skin[1]);P.r(tx+7,ty+4,4,1,PXP.skin[1]);
  P.p(tx+8,ty+1,PXP.inkr);P.p(tx+10,ty+1,PXP.inkr);P.r(tx+8,ty+2,3,1,PXP.inkr);P.p(tx+9,ty+3,PXP.inkr);
  P.r(tx+1,ty+14,16,2,"#4a3322");P.r(tx+8,ty+14,2,2,PXP.gold[0]);
 }
 // tracolla e borsello
 P.l(tx+2,ty,tx+15,ty+13,"#15171c",2);for(let k=0;k<6;k++)P.p(tx+3+k*2,ty+1+k*2,"#8c95a3");
 P.r(tx+13,ty+11,5,4,"#22252d");P.r(tx+13,ty+11,5,1,"#3a3e48");
 // collo, catenina, cornetto
 P.r(X(394),Y(110),5,5,PXP.skin[1]);P.r(X(394)+3,Y(110),2,5,PXP.skin[2]);
 if(!young){P.r(X(390),Y(122),8,1,PXP.gold[1]);P.p(X(400),Y(126),"#e2332f");P.p(X(400),Y(129),"#e2332f");P.p(X(401),Y(131),"#a51b1b");P.p(X(406),Y(114),PXP.ink);}
 // testa
 const hx=X(400+lx*.35),hy=Y(96),rx=8,ry=9;
 P.r(hx-rx-1,hy,2,4,PXP.skin[2]);P.r(hx+rx,hy,2,4,PXP.skin[2]);
 if(!young)P.p(hx-rx-1,hy+4,PXP.gold[0]);
 P.e(hx,hy,rx,ry,PXP.skin[1]);P.e(hx+2,hy+1,rx-2,ry-1,PXP.skin[1]);
 for(let y=-ry+2;y<=ry-1;y++){const k=Math.round(Math.sqrt(Math.max(0,1-Math.pow(y/(ry+.5),2)))*(rx+.5));P.p(hx+k-1,hy+y,PXP.skin[2]);if(y>2)P.p(hx+k-2,hy+y,PXP.skin[2]);}
 if(young){
  P.r(hx-rx,hy-2,2,6,PXP.hair[0]);P.r(hx+rx-1,hy-2,2,6,PXP.hair[0]);P.p(hx-rx,hy+3,PXP.hair[1]);P.p(hx+rx,hy+3,PXP.hair[1]);
  P.e(hx,hy-6,rx+1,5,PXP.red[1]);P.r(hx-rx-1,hy-6,rx*2+3,3,PXP.red[1]);P.r(hx-4,hy-10,5,2,PXP.red[0]);P.r(hx+4,hy-8,4,4,PXP.red[2]);P.p(hx,hy-11,PXP.red[2]);
  P.r(hx-2,hy-8,4,3,PXP.white[0]);P.p(hx-1,hy-7,PXP.red[1]);P.p(hx,hy-7,PXP.red[1]);
  P.r(hx-rx-1,hy-3,rx*2+3,2,PXP.red[2]);P.r(hx-rx+1,hy-3,rx*2-1,1,PXP.red[1]);
 }else{
  P.r(hx-5,hy-7,3,1,PXP.skin[0]);P.r(hx-6,hy-6,2,1,PXP.skin[0]);P.p(hx+2,hy-8,PXP.skin[0]);
  P.p(hx+6,hy-5,PXP.ink);P.p(hx+7,hy-4,PXP.ink);
 }
 pxFace(P,hx+Math.round(lx*.5),hy+Math.round(ly*.4),expr,young,t);
}
function pxArm(P,S,E,Hd,skin,side){
 const s={x:X(S.x),y:Y(S.y)},e={x:X(E.x),y:Y(E.y)},h={x:X(Hd.x),y:Y(Hd.y)};
 P.q({x:s.x+1,y:s.y+1},{x:e.x+1,y:e.y+1},{x:h.x+1,y:h.y+1},PXP.skin[2],3);
 P.q(s,e,h,PXP.skin[1],3);
 P.q({x:s.x-1,y:s.y-1},{x:e.x-1,y:e.y-1},{x:h.x-1,y:h.y-1},PXP.skin[0],1);
 if(skin==="giovane"){const m=qpt(s,e,h,.35);P.l(s.x,s.y,m.x,m.y,PXP.blue[1],5);P.l(s.x+1,s.y+1,m.x+1,m.y+1,PXP.blue[2],2);}
 else if(skin!=="pesce-arm"){for(const tt of [.18,.22,.26]){const p=qpt(s,e,h,tt);P.p(p.x,p.y,PXP.ink);P.p(p.x+1,p.y,PXP.ink);}for(const tt of [.42,.46]){const p=qpt(s,e,h,tt);P.p(p.x,p.y-1,PXP.ink);P.p(p.x,p.y,PXP.ink);}const r=qpt(s,e,h,.72);if(side===1){P.p(r.x,r.y,PXP.inkr);P.p(r.x+1,r.y,PXP.inkr);P.p(r.x,r.y+1,PXP.inkr);P.p(r.x-1,r.y+1,PXP.inkg);}else{P.p(r.x,r.y-1,PXP.ink);P.p(r.x,r.y,PXP.ink);P.p(r.x-1,r.y+1,PXP.ink);P.p(r.x+1,r.y+1,PXP.ink);}}
 return h;
}
function pxHand(P,h){P.r(h.x-1,h.y-1,3,3,PXP.skin[1]);P.p(h.x+1,h.y+1,PXP.skin[2]);P.p(h.x-1,h.y-1,PXP.skin[0]);}
function pxRod(P,G,V,H1,ratio){
 const f=G.fight,tip=V.tip(),dl=Math.hypot(tip.x-H1.x,tip.y-H1.y)||1,ux=(tip.x-H1.x)/dl,uy=(tip.y-H1.y)/dl;
 const butt={x:H1.x-ux*16,y:H1.y-uy*16},m={x:(H1.x+tip.x)/2+(tip.x-H1.x)*.12*ratio+12*ratio*(f&&f.screenX<tip.x?-1:1),y:(H1.y+tip.y)/2-6*ratio};
 const B={x:X(butt.x),y:Y(butt.y)},M={x:X(m.x),y:Y(m.y)},T={x:X(tip.x),y:Y(tip.y)},Hh={x:X(H1.x),y:Y(H1.y)};
 P.q(B,M,T,"#2c343a",1);
 for(let k=1;k<=4;k++){const p=qpt(B,M,T,.3+k*.15);P.p(p.x+1,p.y,"#c8ccd0");}
 P.l(B.x,B.y,Hh.x+ux,Hh.y+uy,"#c79a62",2);
 const R0={x:Hh.x+ux*3-uy*3,y:Hh.y+uy*3+ux*3};P.r(R0.x-1,R0.y-1,3,3,"#c9ced2");P.p(R0.x,R0.y,"#c0392b");
 const ca=A.crank;P.p(R0.x+Math.round(Math.cos(ca)*2.4),R0.y+Math.round(Math.sin(ca)*2.4),"#2b2f33");
 P.p(T.x,T.y,PXP.gold[0]);
 return{x:H1.x+ux*21,y:H1.y+uy*21};
}
function pxFishSmall(P,tr,cx,cy,t){
 const sp=tr.sp,col=tr.karmagra?"#b46cff":sp.color,dark=tr.karmagra?"#5a2a9a":sp.dark,r=clamp(Math.round(tr.size/7),3,6);
 P.e(cx,cy,r+2,Math.max(2,Math.round(r*.6)),col);P.r(cx-r-4,cy-2,2,5,dark);P.p(cx-r-2,cy,dark);P.r(cx-1,cy-r+1,3,1,dark);P.r(cx-r,cy+1,r*2,1,"#ffffff");P.p(cx+r,cy-1,"#141414");
 if(Math.sin(t*8)>0){P.p(cx-r-3,cy-r-2,"#fff6c0");P.p(cx+r+2,cy-r-1,"#fff6c0");}
}
function pxGiantFish(P,t,expr,lx,ly){
 const cx=24,cy=Math.round(Y(112)+Math.sin(t*1.6)*.4);
 // piedi-coda
 for(const s of [-1,1]){const fx=24+s*6;P.r(fx-3,Y(190),7,3,PXP.fish[2]);P.r(fx+(s>0?2:-4),Y(194),3,2,PXP.fish[2]);P.p(fx+(s>0?4:-4),Y(196),PXP.fish[3]);}
 // pinna dorsale
 for(let k=0;k<7;k++){const x=X(368)+k*3.5;P.r(x,Y(44)-((k%2)?2:4),2,4,PXP.fish[2]);}
 P.e(cx,cy,17,26,PXP.fish[1]);P.e(cx-2,cy-2,14,23,PXP.fish[1]);
 for(let y=-25;y<=25;y++){const k=Math.round(Math.sqrt(Math.max(0,1-Math.pow(y/26.5,2)))*17.5);P.r(cx+k-3,cy+y,3,1,PXP.fish[2]);}
 P.e(cx,cy+12,8,15,PXP.belly);
 for(let i=0;i<22;i++){const x=Math.round(cx-14+hash(i,1,7)*28),y=Math.round(cy-22+hash(i,2,7)*44);if(Math.abs(x-cx)<7&&y>cy)continue;P.p(x,y,PXP.spot);if(i%3==0)P.p(x+1,y,PXP.spot);}
 P.r(cx-11,cy-18,2,6,PXP.fish[0]);P.r(cx-10,cy-20,2,2,PXP.fish[0]);
 // cappello
 P.r(cx-14,Y(48),29,3,PXP.hat[2]);P.r(cx-13,Y(47),27,1,PXP.hat[1]);
 P.r(cx-9,Y(20),19,9,PXP.hat[1]);P.r(cx-8,Y(19),17,1,PXP.hat[0]);P.r(cx-7,Y(22),5,3,PXP.hat[0]);P.r(cx+6,Y(22),4,7,PXP.hat[2]);P.r(cx-9,Y(40),19,2,"#2f6fb0");
 // occhi
 for(const s of [-1,1]){const ex=cx+s*7,ey=Y(71);P.e(ex,ey,3,3,"#fffbea");P.r(ex-1+Math.round(lx*.3),ey-1+Math.round(ly*.3),2,2,"#141c22");
  const b=expr==="strain"?1:expr==="surprise"?-1:0;P.r(ex-3,ey-5-b,7,1,PXP.fish[3]);
  if(expr==="joy"&&s>0){P.r(ex-3,ey-3,7,3,PXP.fish[1]);P.r(ex-3,ey,7,1,PXP.fish[3]);}}
 // bocca
 const open=expr==="surprise"||expr==="joy"?3:expr==="strain"?1:2;
 P.r(cx-7,Y(103)-1,15,open+1,PXP.mouth);P.r(cx-8,Y(103)-2,17,1,PXP.lips[0]);P.r(cx-8,Y(103)+open,17,1,PXP.lips[1]);P.p(cx-8,Y(103)-1,PXP.lips[0]);P.p(cx+8,Y(103)-1,PXP.lips[0]);
 if(open>1)for(let k=-6;k<=6;k+=3)P.p(cx+k,Y(103)-1,"#ffffff");
}
function pxLying(P,expr,t,ly){
 // Biagio sdraiato tra le braccia della cernia (pixel): testa a sinistra, scarpe a destra
 const y0=Y(150)+ly;
 P.r(X(424),y0-1,9,4,PXP.black[1]);P.r(X(424),y0+2,9,1,PXP.black[2]);
 P.r(X(446),y0-2,3,5,PXP.white[0]);P.p(X(446)+2,y0,"#c0392b");
 P.r(X(384),y0-4,15,9,PXP.black[1]);P.r(X(384),y0+3,15,2,PXP.black[2]);P.r(X(384),y0-4,15,1,PXP.black[0]);P.l(X(386),y0-4,X(426),y0+3,"#15171c",1);
 P.r(X(420),y0-4,2,9,"#4a3322");P.p(X(420),y0,PXP.gold[0]);
 const hx=X(364),hy=y0-1;P.e(hx,hy,7,7,PXP.skin[1]);for(let y=-5;y<=6;y++)P.p(hx+6,hy+y,PXP.skin[2]);
 P.r(hx-5,hy-6,3,1,PXP.skin[0]);
 pxFace(P,hx,hy,expr==="calm"?"joy":expr,false,t);
}
function fisherPX(c,G,V,dt){
 const t=G.elapsed,f=G.fight,h=G.hook,tr=V.trophy,skin=V.skin||"base";
 const ratio=f?Math.min(1.2,f.tension/f.line.limit):0,expr=pickExpr(G,V);
 let lx=0,ly=0;const tgt=f?{x:f.screenX,y:f.screenY}:(h.mode!=="idle"&&h.x!=null?{x:h.x,y:h.y}:null);
 if(tgt){lx=clamp((tgt.x-400)/110,-1,1)*4;ly=clamp((tgt.y-260)/300,0,1)*2.5;}else lx=Math.round(Math.sin(t*.35)*2);
 const dx=Math.round(f?-f.lateral*3:0),dy=Math.round(-ratio*4+(tr?-3:0));
 // ombra a blocchi
 c.fillStyle="rgba(0,0,0,.32)";for(const [w,o] of [[30,0],[24,3]])c.fillRect(404-w*1.5,199+o,w*3,3);
 const L1=pxBuf("pxA"),L2=pxBuf("pxB"),FIN=pxBuf("pxF");
 for(const b of [L1,L2,FIN])b.g.clearRect(0,0,PXW,PXH);
 const P1=PXapi(L1.g),P2=PXapi(L2.g),PF=PXapi(FIN.g);
 if(V.lantern){const on=V.night>.3;P1.r(X(334),Y(170),5,8,"#4a3a26");P1.r(X(335),Y(173),3,4,on?"#ffd680":"#9a8a68");}
 if(skin==="pesce"){
  pxGiantFish(P1,t,expr==="sad"?"strain":expr,lx,ly);
  // braccia della cernia
  const fa=(a,e,b)=>{P1.q({x:X(a.x),y:Y(a.y)},{x:X(e.x),y:Y(e.y)},{x:X(b.x),y:Y(b.y)},PXP.fish[2],5);P1.q({x:X(a.x)-1,y:Y(a.y)},{x:X(e.x)-1,y:Y(e.y)},{x:X(b.x)-1,y:Y(b.y)},PXP.fish[1],3);};
  fa({x:352,y:104},{x:320,y:146},{x:364,y:170});fa({x:448,y:104},{x:484,y:150},{x:448,y:174});
  pxOutline(L1,PXP.outline);
  pxLying(P2,expr,t,dy?-1:0);
  for(const p of [{x:X(364),y:Y(166)},{x:X(448),y:Y(170)}])for(let k=-1;k<=1;k++){P2.r(p.x+k*2,p.y-2,2,3,PXP.fish[1]);P2.p(p.x+k*2,p.y-2,PXP.fish[0]);}
  const S2={x:394,y:132+(dy?-3:0)};
  if(tr){const Hh={x:452,y:94};pxHand(P2,pxArm(P2,S2,{x:430,y:118},Hh,"base",1));pxFishSmall(P2,tr,X(470),Y(82),t);}
  else{pxRod(P2,G,V,V.hand,ratio);pxHand(P2,pxArm(P2,S2,{x:414,y:150},V.hand,"base",1));}
  pxOutline(L2,PXP.outline);
 }else{
  // corpo
  L1.g.save();L1.g.translate(Math.round(dx/PXS),Math.round(dy/PXS));pxBody(P1,skin,expr,lx,ly,t);L1.g.restore();
  pxOutline(L1,PXP.outline);
  const S1={x:372+dx,y:131+dy},S2={x:428+dx,y:131+dy};
  if(tr){
   const lift=Math.sin(Math.min(1,(1-tr.life/tr.max)*3)*Math.PI/2),py=150-lift*86;
   const H1={x:368+dx,y:py+dy},H2={x:432+dx,y:py+dy};
   pxHand(P2,pxArm(P2,S1,{x:354+dx,y:(S1.y+H1.y)/2+6},H1,skin,2));pxHand(P2,pxArm(P2,S2,{x:446+dx,y:(S2.y+H2.y)/2+6},H2,skin,1));
   pxFishSmall(P2,tr,24,Y(py-8+dy),t);
  }else{
   const H1=V.hand,H2=pxRod(P2,G,V,H1,ratio);
   pxHand(P2,pxArm(P2,S2,{x:(S2.x+H1.x)/2+14,y:(S2.y+H1.y)/2+2},H1,skin,1));
   pxHand(P2,pxArm(P2,S1,{x:(S1.x+H2.x)/2-10,y:(S1.y+H2.y)/2+16},H2,skin,2));
  }
  pxOutline(L2,PXP.outline);
 }
 FIN.g.drawImage(L1.c,0,0);FIN.g.drawImage(L2.c,0,0);
 // sudore a pixel
 if(expr==="strain"&&skin!=="pesce"){const ph=Math.floor(t*6)%4;PF.p(X(372),Y(92)+ph,"#cdeeff");PF.p(X(428),Y(88)+ph,"#cdeeff");}
 c.save();c.imageSmoothingEnabled=false;c.drawImage(FIN.c,PX0.x,PX0.y,PXW*PXS,PXH*PXS);c.restore();
}

/* ======================= scelta e anteprime ======================= */
function drawFisher(c,G,V,dt){
 A.crank=(A.crank||0)+(V.reeling?dt*16:0);
 if(V.style==="pixel")fisherPX(c,G,V,dt);else fisherV(c,G,V,dt);
}
function drawSkinPreview(cv,skin,t,style){
 const g=cv.getContext("2d"),w=cv.width,h=cv.height;
 const bg=g.createLinearGradient(0,0,0,h);bg.addColorStop(0,"#1d6f80");bg.addColorStop(1,"#0a3242");g.fillStyle=bg;g.fillRect(0,0,w,h);
 g.save();g.globalCompositeOperation="lighter";g.globalAlpha=.12;g.fillStyle=g.createPattern(causticsTile(),"repeat");g.translate((t*8)%256,(t*5)%256);g.fillRect(-256,-256,w+512,h+512);g.restore();
 const wood=g.createLinearGradient(0,h*.55,0,h);wood.addColorStop(0,"#a9744a");wood.addColorStop(1,"#6b4428");g.fillStyle=wood;g.fillRect(w*.18,h*.62,w*.64,h*.38);
 g.strokeStyle="rgba(60,35,20,.4)";g.lineWidth=2;for(let k=1;k<4;k++){g.beginPath();g.moveTo(w*.18,h*.62+k*h*.09);g.lineTo(w*.82,h*.62+k*h*.09);g.stroke();}
 const s=Math.min(w/190,h/230);
 g.save();g.translate(w/2,h*.5);g.scale(s,s);g.translate(-404,-116);
 const fakeG={elapsed:t,fight:null,hook:{mode:"idle"},weather:"sereno"};
 const fakeV={skin,style,hand:{x:432,y:152},tip:()=>({x:446,y:228}),trophy:null,mood:null,reeling:false,lantern:false,night:0};
 g.imageSmoothingEnabled=style!=="pixel";
 drawFisher(g,fakeG,fakeV,1/60);
 g.restore();
}
function drawLine(c,G,V){
 const h=G.hook,tip=V.tip();if(h.mode==="idle")return;
 c.save();c.lineCap="round";
 const sway=Math.sin(G.elapsed*1.3)*R.WEATHER[G.weather].wind*6;
 if(h.mode==="fight"&&G.fight){
  const f=G.fight,ratio=f.tension/f.line.limit,sag=(1-clamp(ratio*1.3,0,1))*40,danger=ratio>.85;
  const col=ratio<.55?"#f6f1d6":ratio<.85?"#ffd36b":(Math.sin(G.elapsed*30)>0?"#ff6b5e":"#ffd0c8");
  const qx=(tip.x+f.screenX)/2+sway,qy=(tip.y+f.screenY)/2+sag;
  c.strokeStyle="rgba(0,0,0,.25)";c.lineWidth=2.6+ratio*1.6;c.beginPath();c.moveTo(tip.x+2,tip.y+3);c.quadraticCurveTo(qx+2,qy+3,f.screenX+2,f.screenY+3);c.stroke();
  if(danger){c.shadowColor="#ff4d4d";c.shadowBlur=10;}
  c.strokeStyle=col;c.lineWidth=1.4+ratio*1.6;c.beginPath();c.moveTo(tip.x,tip.y);c.quadraticCurveTo(qx,qy,f.screenX,f.screenY);c.stroke();
  c.restore();return;
 }
 const by=h.y-(h.arc||0)*.2;
 const qx=(tip.x+h.x)/2+sway,qy=(tip.y+h.y)/2-(h.arc||0)+(h.mode==="casting"?0:16);
 c.strokeStyle="rgba(0,0,0,.22)";c.lineWidth=2.4;c.beginPath();c.moveTo(tip.x+2,tip.y+3);c.quadraticCurveTo(qx+2,qy+3,h.x+2,by+3);c.stroke();
 c.strokeStyle="#f6f1d6";c.lineWidth=1.3;c.beginPath();c.moveTo(tip.x,tip.y);c.quadraticCurveTo(qx,qy,h.x,by);c.stroke();
 if(h.artificial)drawLure(c,G,h,V);else drawFloat(c,G,h,by);
 if(h.mode!=="casting"&&h.depth!=null)pill(c,(V.sonar?h.depth.toFixed(1).replace(".",","):"~"+Math.max(1,Math.round(h.depth)))+" m",h.x+30,h.y+22,{font:"700 12px system-ui,sans-serif",h:20,padX:12,fg:"#dffcf3",bg:"rgba(3,30,40,.55)"});
 c.restore();
}
function drawFloat(c,G,h,by){
 const under=h.mode==="bite",dip=(h.dip||0),t=G.elapsed,bob=h.mode==="waiting"?Math.sin(t*2.2)*1.2:0,y=by+dip*5+bob;
 if(h.mode!=="casting"){c.fillStyle="rgba(0,20,30,.3)";c.beginPath();c.ellipse(h.x+3,h.y+4,9,4,0,0,TAU);c.fill();}
 if(h.mode==="waiting"&&!h.empty){c.strokeStyle="rgba(255,250,220,.4)";c.lineWidth=1.2;c.beginPath();c.ellipse(h.x,h.y+2,13+2*Math.sin(t*3),5+Math.sin(t*3),0,0,TAU);c.stroke();}
 c.globalAlpha=under?.35:1;
 const r=8*(1-dip*.25),gw=c.createRadialGradient(h.x-3,y-3,1,h.x,y,r);gw.addColorStop(0,"#ffffff");gw.addColorStop(1,"#d9d3c6");
 c.fillStyle=gw;c.beginPath();c.arc(h.x,y,r,0,TAU);c.fill();
 const gr=c.createRadialGradient(h.x-3,y-4,1,h.x,y-2,r);gr.addColorStop(0,"#ff8a7a");gr.addColorStop(1,"#c62a22");
 c.fillStyle=gr;c.beginPath();c.arc(h.x,y,r,Math.PI,0);c.fill();
 c.strokeStyle="#1d1d1d";c.lineWidth=1.5;c.beginPath();c.moveTo(h.x,y-r);c.lineTo(h.x,y-r-9);c.stroke();c.fillStyle="#ffe14d";c.beginPath();c.arc(h.x,y-r-10,2.4,0,TAU);c.fill();
 c.fillStyle="rgba(255,255,255,.7)";c.beginPath();c.arc(h.x-3,y-3,1.8,0,TAU);c.fill();
 c.globalAlpha=1;
 if(under){c.fillStyle="rgba(255,255,255,.5)";for(let i=0;i<4;i++){const a=t*6+i*1.6;c.beginPath();c.arc(h.x+Math.cos(a)*10,h.y+Math.sin(a)*6,2,0,TAU);c.fill();}
  pill(c,"!",h.x,h.y-30,{font:"900 22px system-ui,sans-serif",h:30,padX:16,fg:"#2b1d00",bg:"#ffd85e"});}
}
function drawLure(c,G,h,V){
 c.save();c.translate(h.x,h.y);const tp=V.tip();c.rotate(Math.atan2(tp.y-h.y,tp.x-h.x));
 const id=h.bait;
 if(id==="jig"){const g=c.createLinearGradient(-10,0,10,0);g.addColorStop(0,"#ff7fb0");g.addColorStop(1,"#ffd0e2");c.fillStyle=g;c.beginPath();c.ellipse(0,0,11,4.5,0,0,TAU);c.fill();c.strokeStyle="#e85a90";c.lineWidth=1;for(let k=-2;k<=2;k++){c.beginPath();c.moveTo(-10,k*1.5);c.lineTo(-17,k*2.6);c.stroke();}}
 else if(id==="cucchiaino"){const spin=Math.sin(G.elapsed*(h.moving?25:3));c.fillStyle=spin>0?"#f7f2d0":"#b9b28a";c.beginPath();c.ellipse(0,0,8,4.5*Math.abs(spin)+1,0,0,TAU);c.fill();c.fillStyle="#d84a3a";c.beginPath();c.arc(-9,0,2,0,TAU);c.fill();}
 else{const g=c.createLinearGradient(0,-5,0,5);g.addColorStop(0,"#3a6fa0");g.addColorStop(.5,"#e9f2f6");g.addColorStop(1,"#c8d4da");c.fillStyle=g;c.beginPath();c.ellipse(0,0,12,4.5,0,0,TAU);c.fill();c.fillStyle="rgba(255,255,255,.6)";c.fillRect(-12,-11,0,0);c.fillStyle="#ffe14d";c.beginPath();c.moveTo(12,-2);c.lineTo(17,0);c.lineTo(12,2);c.fill();c.fillStyle="#111";c.beginPath();c.arc(8,-1,1.2,0,TAU);c.fill();}
 c.restore();
 if(h.moving){c.strokeStyle="rgba(255,255,255,.45)";c.lineWidth=1.4;const tp2=V.tip(),a=Math.atan2(h.y-tp2.y,h.x-tp2.x);c.beginPath();c.moveTo(h.x,h.y);c.lineTo(h.x+Math.cos(a+.4)*24,h.y+Math.sin(a+.4)*24);c.moveTo(h.x,h.y);c.lineTo(h.x+Math.cos(a-.4)*24,h.y+Math.sin(a-.4)*24);c.stroke();}
}
function arrowGlyph(c,x,y,dir,size,col){c.save();c.translate(x,y);c.scale(dir,1);c.fillStyle=col;c.beginPath();c.moveTo(-size*.6,-size*.55);c.lineTo(size*.45,0);c.lineTo(-size*.6,size*.55);c.closePath();c.fill();c.restore();}
function drawFightFish(c,G,V){
 const f=G.fight;if(!f)return;
 const sp=R.SPECIES_BY_ID[f.fish.species],x=f.screenX,y=f.screenY,a=f.action,size=f.size||12;
 const jump=sp&&a.type==="salto"&&a.left>a.len*.2;
 const dirX=Math.cos(f.baseAngle+Math.PI)<0?-1:1;
 c.save();c.translate(x,y);
 if(sp&&jump){
  const p=1-(a.left-a.len*.2)/(a.len*.8),lift=Math.sin(p*Math.PI)*52;
  c.fillStyle="rgba(0,20,30,.35)";c.beginPath();c.ellipse(0,6,size*1.5,size*.5,0,0,TAU);c.fill();
  c.strokeStyle="rgba(255,255,255,.6)";c.lineWidth=2;c.beginPath();c.ellipse(0,4,size*1.3*(1+p),size*.45*(1+p),0,0,TAU);c.stroke();
  c.translate(0,-lift);c.rotate((p-.5)*1.3*dirX);if(dirX<0)c.scale(-1,1);
  if(f.fish.karmagra){c.shadowBlur=18;c.shadowColor="#c77dff";}else if(sp.rarity==="leggendario"){c.shadowBlur=16;c.shadowColor="#ffd56b";}
  fishShape(c,sp,size,{wiggle:G.elapsed*12});
  c.shadowBlur=0;c.fillStyle="rgba(255,255,255,.8)";for(let i=0;i<5;i++){c.beginPath();c.arc(-size*1.6+Math.sin(i*2.1+G.elapsed*9)*6,Math.cos(i*1.7)*size*.6,1.6,0,TAU);c.fill();}
 }else if(sp){
  const spr=shadowSprite(sp,size,f.fish.karmagra);
  c.rotate(f.lateral*.3);if(dirX<0)c.scale(-1,1);c.scale(1+Math.sin(G.elapsed*14)*.05,1);
  c.globalAlpha=.7;c.drawImage(spr.c,-spr.w/2+spr.s*.15,-spr.h/2,spr.w,spr.h);
 }else{c.globalAlpha=.65;c.fillStyle="#03202b";c.beginPath();c.ellipse(0,0,12,9,0,0,TAU);c.fill();}
 c.restore();
 c.strokeStyle="rgba(255,255,255,.35)";c.lineWidth=1.5;c.beginPath();c.ellipse(x,y+2,size*1.1+Math.sin(G.elapsed*10)*2,size*.4,0,0,TAU);c.stroke();
}
function drawFightUI(c,G){
 const f=G.fight;if(!f)return;
 const a=f.action,x=f.screenX,y=f.screenY,size=f.size||12;
 const col={tira:"#f5efcc",fuga:"#ff8a7a",salto:"#ffe36b",riposo:"#9df2b5",tana:"#ffb35a"}[a.type]||"#fff";
 const label=f.tele&&f.tele.label?f.tele.label:R.ACTIONS[a.type].label;
 const ly=Math.max(WT+30,y-size-30);
 c.save();c.font="900 24px system-ui,sans-serif";
 const w=pill(c,label,x,ly,{font:"900 22px system-ui,sans-serif",h:34,padX:a.dir&&R.ACTIONS[a.type].dir?54:24,fg:"#13212a",bg:col});
 if(a.dir&&R.ACTIONS[a.type].dir){arrowGlyph(c,x+a.dir*(w/2-16),ly,a.dir,16,"#13212a");}
 if(f.den>.05){const bw=86;c.fillStyle="rgba(3,25,35,.75)";rr(c,x-bw/2,ly+22,bw,10,5);c.fill();c.fillStyle="#ff9d4a";rr(c,x-bw/2,ly+22,bw*clamp(f.den,0,1),10,5);c.fill();pill(c,"TANA",x,ly+46,{font:"800 13px system-ui,sans-serif",h:20,fg:"#ffd9b0",bg:"rgba(60,25,5,.7)"});}
 if(f.slack>.6)pill(c,"LENZA LASCA! RECUPERA",x,ly+(f.den>.05?72:30),{font:"900 16px system-ui,sans-serif",h:26,fg:"#2b1d00",bg:"#ffe36b"});
 c.restore();
}
function drawAim(c,G,V){
 const h=G.hook;if(G.phase!=="playing"||!G.aimVisible)return;
 if(h.mode!=="idle"&&!(h.mode==="waiting"&&Math.hypot(G.aim.x-h.x,G.aim.y-h.y)>45))return;
 const tip=V.tip(),max=V.rangePx(),dx=G.aim.x-tip.x,dy=G.aim.y-tip.y,len=Math.hypot(dx,dy),k=len>max?max/len:1;
 const ax=tip.x+dx*k,ay=tip.y+dy*k,t=G.elapsed;
 c.save();
 c.setLineDash([4,10]);c.lineDashOffset=-t*20;c.strokeStyle="rgba(240,250,235,.28)";c.lineWidth=2;c.beginPath();c.arc(tip.x,tip.y,max,.05,Math.PI-.05);c.stroke();c.setLineDash([]);
 c.translate(ax,ay);c.rotate(t*.8);
 c.strokeStyle=k<1?"rgba(255,185,166,.9)":"rgba(240,252,235,.9)";c.lineWidth=2;
 for(let i=0;i<4;i++){c.rotate(TAU/4);c.beginPath();c.arc(0,0,17,-.45,.45);c.stroke();c.beginPath();c.moveTo(22,0);c.lineTo(28,0);c.stroke();}
 c.fillStyle="rgba(255,255,255,.9)";c.beginPath();c.arc(0,0,2,0,TAU);c.fill();
 c.restore();
 const d=R.depthAt(G.spot,ax,ay);pill(c,(V.sonar?d.toFixed(1).replace(".",","):"~"+Math.max(1,Math.round(d)))+" m",ax+40,ay-22,{font:"700 13px system-ui,sans-serif",h:22,fg:"#e4fbf4",bg:"rgba(3,30,40,.6)"});
}

/* ---------- meteo e luce ---------- */
function lightFactors(hour){
 let night=0;if(hour>=21||hour<4.5)night=1;else if(hour>=19.3)night=(hour-19.3)/1.7;else if(hour<5.4)night=(5.4-hour)/.9*.85;
 let dusk=0;if(hour>=17&&hour<21)dusk=hour<19.2?(hour-17)/2.2:1-(hour-19.2)/1.8;
 let dawn=0;if(hour>=4.5&&hour<7.5)dawn=hour<5.4?(hour-4.5)/.9:1-(hour-5.4)/2.1;
 return{night:clamp(night,0,1),dusk:clamp(dusk,0,1),dawn:clamp(dawn,0,1),day:clamp(1-night,0,1)};
}
function drawWeather(c,G){
 const w=G.weather,t=G.elapsed,wd=R.WEATHER[w].wind;
 if(w==="nuvoloso"||w==="pioggia"||w==="burrasca"){
  if(!A.cache.cloudDark)A.cache.cloudDark=c.createPattern(tintTile(cloudTile(),[6,24,34]),"repeat");
  c.save();c.globalAlpha=w==="nuvoloso"?.2:.28;c.translate(((t*8*G.wind.x)%512+512)%512-512,(t*5)%512-512);c.scale(2,2);
  c.fillStyle=A.cache.cloudDark;c.fillRect(0,0,912,892);c.restore();
 }
 if(G.drops.length){
  c.save();c.lineCap="round";const sx=G.wind.x*wd*.14;
  for(const d of G.drops){const gr=c.createLinearGradient(d.x,d.y,d.x-sx*90,d.y-18);gr.addColorStop(0,"rgba(220,236,250,.75)");gr.addColorStop(1,"rgba(220,236,250,0)");c.strokeStyle=gr;c.lineWidth=1.3;c.beginPath();c.moveTo(d.x,d.y);c.lineTo(d.x-sx*90,d.y-18);c.stroke();}
  c.restore();
 }
 if(w==="vento"||w==="burrasca"){c.save();c.strokeStyle="rgba(255,255,255,.16)";c.lineWidth=2;c.lineCap="round";for(let i=0;i<14;i++){const x=((t*240*(G.wind.x||1)+i*137)%960+960)%960-80,y=(i*97+Math.sin(t+i)*20)%760;c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x+30*Math.sign(G.wind.x||1),y-5,x+70*Math.sign(G.wind.x||1),y+3);c.stroke();}c.restore();}
 if(w==="nebbia"){
  const tile=cloudTile();if(!A.cache.fogpat)A.cache.fogpat=c.createPattern(tile,"repeat");
  c.save();c.fillStyle=A.cache.fogpat;
  c.globalAlpha=.34;c.save();c.translate((t*10)%256-256,0);c.scale(1.6,1.2);c.fillRect(0,0,700,700);c.restore();
  c.globalAlpha=.22;c.save();c.translate(-((t*6)%256),(t*2)%256-256);c.scale(2.4,2);c.fillRect(0,0,500,500);c.restore();
  c.globalAlpha=1;const g=c.createLinearGradient(0,0,0,H);g.addColorStop(0,"rgba(228,236,240,.22)");g.addColorStop(1,"rgba(228,236,240,.5)");c.fillStyle=g;c.fillRect(0,0,W,H);c.restore();
 }
 if(w==="burrasca"){if(Math.random()<.004&&!A.reduced)A.flash=1;}
}
function tintTile(tile,col){const c=mk(tile.width,tile.height),g=c.getContext("2d");g.drawImage(tile,0,0);g.globalCompositeOperation="source-in";g.fillStyle=css(col);g.fillRect(0,0,c.width,c.height);return c;}
function grade(c,G,V,L){
 const w=G.weather;
 let col=[255,255,255];
 if(w==="nuvoloso")col=[226,232,236];else if(w==="pioggia")col=[196,207,218];else if(w==="burrasca")col=[158,170,188];else if(w==="nebbia")col=[232,236,238];
 col=mixc(col,[255,198,150],Math.max(L.dusk,L.dawn)*(w==="nebbia"?.25:.8));
 col=mixc(col,[46,66,132],L.night);
 c.save();c.globalCompositeOperation="multiply";c.fillStyle=css(col);c.fillRect(0,0,W,H);
 // bagliore caldo dal lato del sole
 const warm=Math.max(L.dusk,L.dawn);
 if(warm>.05){c.globalCompositeOperation="screen";const sx=L.dawn>L.dusk?W:0;const g=c.createRadialGradient(sx,0,20,sx,0,700);g.addColorStop(0,"rgba(255,160,80,"+(.32*warm)+")");g.addColorStop(1,"rgba(255,160,80,0)");c.fillStyle=g;c.fillRect(0,0,W,H);}
 // luci notturne
 if(L.night>.05){
  c.globalCompositeOperation="lighter";
  if(V.lantern){const fl=.9+Math.sin(G.elapsed*13)*.05+Math.sin(G.elapsed*7.3)*.04;const g=c.createRadialGradient(370,175,8,390,200,330);g.addColorStop(0,"rgba(255,190,100,"+(.42*L.night*fl)+")");g.addColorStop(.45,"rgba(255,150,70,"+(.14*L.night*fl)+")");g.addColorStop(1,"rgba(255,150,70,0)");c.fillStyle=g;c.fillRect(0,0,W,H);}
  if(G.spot==="porto")for(const x of [60,240,560,740]){const g=c.createRadialGradient(x,60,2,x,80,120);g.addColorStop(0,"rgba(255,215,140,"+(.5*L.night)+")");g.addColorStop(1,"rgba(255,215,140,0)");c.fillStyle=g;c.fillRect(x-130,0,260,220);
   const r=c.createLinearGradient(0,120,0,320);r.addColorStop(0,"rgba(255,210,130,"+(.18*L.night)+")");r.addColorStop(1,"rgba(255,210,130,0)");c.fillStyle=r;c.fillRect(x-8,120,16,200);}
  if(G.spot==="golfo"){const g=c.createRadialGradient(548,118,1,548,118,60);g.addColorStop(0,"rgba(255,240,200,"+(.5*L.night)+")");g.addColorStop(1,"rgba(255,240,200,0)");c.fillStyle=g;c.fillRect(480,50,140,140);}
  if(G.spot==="lago"&&L.night>.5&&G.weather!=="pioggia"&&G.weather!=="burrasca"){for(const fl of getSeeds().flies){const x=fl.cx+Math.sin(G.elapsed*.7+fl.ph)*40,y=fl.cy+Math.cos(G.elapsed*.9+fl.ph*1.3)*25,b=(.5+.5*Math.sin(G.elapsed*3+fl.ph*5))*L.night;const g=c.createRadialGradient(x,y,0,x,y,9);g.addColorStop(0,"rgba(230,255,140,"+b+")");g.addColorStop(1,"rgba(230,255,140,0)");c.fillStyle=g;c.fillRect(x-9,y-9,18,18);}}
 }
 if(A.flash>0){c.globalCompositeOperation="lighter";c.fillStyle="rgba(220,230,255,"+(A.flash*.55)+")";c.fillRect(0,0,W,H);}
 // vignettatura
 c.globalCompositeOperation="source-over";
 const v=c.createRadialGradient(W/2,H*.55,H*.38,W/2,H*.55,H*.85);v.addColorStop(0,"rgba(0,8,14,0)");v.addColorStop(1,"rgba(0,8,14,"+(.42+L.night*.15)+")");c.fillStyle=v;c.fillRect(0,0,W,H);
 c.restore();
}
function drawFx(c,G){
 c.save();
 for(const r of G.ripples){c.globalAlpha=Math.max(0,r.life/1.2);c.strokeStyle=r.color;c.lineWidth=1.8;c.beginPath();c.ellipse(r.x,r.y,r.r,r.r*.55,0,0,TAU);c.stroke();}
 c.globalAlpha=1;
 for(const s of G.splashes){const a=clamp(s.life*1.6,0,1);c.fillStyle="rgba(235,250,255,"+a+")";c.beginPath();c.arc(s.x,s.y,s.r,0,TAU);c.fill();c.fillStyle="rgba(255,255,255,"+a+")";c.beginPath();c.arc(s.x-s.r*.3,s.y-s.r*.3,s.r*.35,0,TAU);c.fill();}
 c.restore();
}
function drawTexts(c,G){
 c.save();c.textAlign="center";c.font="900 24px system-ui,sans-serif";
 for(const t of G.texts){c.globalAlpha=clamp(t.life,0,1);c.lineWidth=5;c.strokeStyle="rgba(2,24,32,.9)";c.strokeText(t.text,t.x,t.y);c.fillStyle=t.color;c.fillText(t.text,t.x,t.y);}
 c.restore();
}

/* ---------- fotogramma ---------- */
function render(G,V,dt){
 const c=A.ctx;if(!c)return;
 watchPerf(performance.now());
 const hour=V.hour(),L=lightFactors(hour),spot=G.spot;
 const water=waterLayer(spot);
 c.setTransform(A.scale,0,0,A.scale,0,0);
 if(A.shake>.01&&!A.reduced){c.translate((Math.random()-.5)*A.shake*10,(Math.random()-.5)*A.shake*10);}
 A.shake=Math.max(0,A.shake-dt*3);A.flash=Math.max(0,A.flash-dt*2.5);
 c.imageSmoothingEnabled=true;
 c.drawImage(water.c,0,0,W,H);
 drawUnderwaterLife(c,G);
 drawRays(c,G,L.day);
 drawShadows(c,G,V);
 drawFightFish(c,G,V);
 drawCaustics(c,G,L.day);
 drawWavelets(c,G,L.day,Math.max(L.dusk,L.dawn));
 drawGlints(c,G,L.day,Math.max(L.dusk,L.dawn),L.night,hour);
 drawFrenzy(c,G);
 drawShoreFoam(c,G);
 drawSurfaceDecor(c,G,V);
 c.drawImage(bgLayer(spot),0,0,W,H);
 drawReeds(c,G);
 drawFx(c,G);
 drawLine(c,G,V);
 drawFisher(c,G,V,dt);
 drawBirds(c,G,dt,L.day);
 drawWeather(c,G);
 grade(c,G,V,L);
 drawAim(c,G,V);
 drawFightUI(c,G);
 drawTexts(c,G);
 c.setTransform(1,0,0,1,0,0);
}
root.PESCA_ART={init,resize,render,drawArt,fishShape,drawSkinPreview,SKINS,STYLES,shake(v){A.shake=Math.max(A.shake,v);},state:A};
})(typeof window!=="undefined"?window:globalThis);
