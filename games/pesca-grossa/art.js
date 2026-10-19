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
function drawBiagio(c,G,V){
 const img=V.biagio,breathe=Math.sin(G.elapsed*1.6)*1.2;
 c.fillStyle="rgba(0,0,0,.32)";c.beginPath();c.ellipse(404,190,46,13,0,0,TAU);c.fill();
 if(img&&img.complete&&img.naturalWidth)c.drawImage(img,334,77+breathe*.5,132,132-breathe*.5);
 else{c.fillStyle="#27262a";c.beginPath();c.ellipse(400,131,34,43,0,0,TAU);c.fill();}
 if(V.night>.3&&V.lantern){const fl=.85+Math.sin(G.elapsed*13)*.08+Math.sin(G.elapsed*7.3)*.05;c.fillStyle="#3a2f22";rr(c,352,160,14,20,3);c.fill();c.fillStyle=css([255,210,120],fl);rr(c,354,164,10,12,2);c.fill();}
 const tip=V.tip(),hand={x:440,y:148},f=G.fight,r=f?Math.min(1.2,f.tension/f.line.limit):0;
 const mx=(hand.x+tip.x)/2+(tip.x-hand.x)*.15*r+10*r,my=(hand.y+tip.y)/2-8*r;
 c.lineCap="round";
 c.strokeStyle="rgba(0,0,0,.3)";c.lineWidth=5;c.beginPath();c.moveTo(hand.x+3,hand.y+4);c.quadraticCurveTo(mx+3,my+4,tip.x+3,tip.y+4);c.stroke();
 c.strokeStyle="#1f2326";c.lineWidth=5;c.beginPath();c.moveTo(hand.x,hand.y);c.quadraticCurveTo(lerp(hand.x,mx,.5),lerp(hand.y,my,.5),mx,my);c.stroke();
 c.strokeStyle="#2b3135";c.lineWidth=3;c.beginPath();c.moveTo(mx,my);c.quadraticCurveTo(lerp(mx,tip.x,.5),lerp(my,tip.y,.5),tip.x,tip.y);c.stroke();
 c.strokeStyle="rgba(255,255,255,.35)";c.lineWidth=1;c.beginPath();c.moveTo(hand.x-1,hand.y-1);c.quadraticCurveTo(mx-1,my-1,tip.x-1,tip.y-1);c.stroke();
 c.strokeStyle="#c9a46a";c.lineWidth=6;c.beginPath();c.moveTo(hand.x+6,hand.y-8);c.lineTo(hand.x,hand.y);c.stroke();
 const rg=c.createRadialGradient(hand.x-4,hand.y+5,1,hand.x-2,hand.y+8,7);rg.addColorStop(0,"#f2f4f6");rg.addColorStop(1,"#6b7378");c.fillStyle=rg;c.beginPath();c.arc(hand.x-2,hand.y+8,6.5,0,TAU);c.fill();
 c.fillStyle="#e8c35a";c.beginPath();c.arc(tip.x,tip.y,2.6,0,TAU);c.fill();
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
 if(h.artificial)drawLure(c,G,h);else drawFloat(c,G,h,by);
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
function drawLure(c,G,h){
 c.save();c.translate(h.x,h.y);c.rotate(Math.atan2(183-h.y,421-h.x));
 const id=h.bait;
 if(id==="jig"){const g=c.createLinearGradient(-10,0,10,0);g.addColorStop(0,"#ff7fb0");g.addColorStop(1,"#ffd0e2");c.fillStyle=g;c.beginPath();c.ellipse(0,0,11,4.5,0,0,TAU);c.fill();c.strokeStyle="#e85a90";c.lineWidth=1;for(let k=-2;k<=2;k++){c.beginPath();c.moveTo(-10,k*1.5);c.lineTo(-17,k*2.6);c.stroke();}}
 else if(id==="cucchiaino"){const spin=Math.sin(G.elapsed*(h.moving?25:3));c.fillStyle=spin>0?"#f7f2d0":"#b9b28a";c.beginPath();c.ellipse(0,0,8,4.5*Math.abs(spin)+1,0,0,TAU);c.fill();c.fillStyle="#d84a3a";c.beginPath();c.arc(-9,0,2,0,TAU);c.fill();}
 else{const g=c.createLinearGradient(0,-5,0,5);g.addColorStop(0,"#3a6fa0");g.addColorStop(.5,"#e9f2f6");g.addColorStop(1,"#c8d4da");c.fillStyle=g;c.beginPath();c.ellipse(0,0,12,4.5,0,0,TAU);c.fill();c.fillStyle="rgba(255,255,255,.6)";c.fillRect(-12,-11,0,0);c.fillStyle="#ffe14d";c.beginPath();c.moveTo(12,-2);c.lineTo(17,0);c.lineTo(12,2);c.fill();c.fillStyle="#111";c.beginPath();c.arc(8,-1,1.2,0,TAU);c.fill();}
 c.restore();
 if(h.moving){c.strokeStyle="rgba(255,255,255,.45)";c.lineWidth=1.4;const a=Math.atan2(h.y-183,h.x-421);c.beginPath();c.moveTo(h.x,h.y);c.lineTo(h.x+Math.cos(a+.4)*24,h.y+Math.sin(a+.4)*24);c.moveTo(h.x,h.y);c.lineTo(h.x+Math.cos(a-.4)*24,h.y+Math.sin(a-.4)*24);c.stroke();}
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
 drawBiagio(c,G,V);
 drawBirds(c,G,dt,L.day);
 drawWeather(c,G);
 grade(c,G,V,L);
 drawAim(c,G,V);
 drawFightUI(c,G);
 drawTexts(c,G);
 c.setTransform(1,0,0,1,0,0);
}
root.PESCA_ART={init,resize,render,drawArt,fishShape,shake(v){A.shake=Math.max(A.shake,v);},state:A};
})(typeof window!=="undefined"?window:globalThis);
