/* I Ninomon — SNES Street Edition renderer.
 * Native 320x288 framebuffer, 32px metatiles and high-detail user artwork.
 * Logical world extent remains 10 x 9 tiles, so the camera and controls do not zoom.
 * CSS presents the framebuffer at its normal physical size on mobile.
 */
(function(root){
"use strict";
const old=root.NINOMON_RETRO;
if(!old)throw Error("retro.js must load before snes.js");
const W=320,H=288,T=32;
const atlas=new Image();
atlas.decoding="async";
atlas.src="./assets/ninomon-snes-atlas.png?v=1";
const ready=()=>atlas.complete&&atlas.naturalWidth===656&&atlas.naturalHeight===912;
// High-definition Nino sheet: twelve 128x176 cells recovered from original artwork.
const ninoHD=new Image();
ninoHD.decoding="async";
ninoHD.src="./assets/nino-overworld-hd.png?v=1";
const ninoReady=()=>ninoHD.complete&&ninoHD.naturalWidth===384&&ninoHD.naturalHeight===704;
// Gialluca's entire 12-frame sheet, recropped from the original 1536px artwork.
// Separate HD asset preserves ears, curly tail, foot alignment and transparency.
const giallucaHD=new Image();
giallucaHD.decoding="async";
giallucaHD.src="./assets/gialluca-overworld-hd.png?v=1";
const giallucaReady=()=>giallucaHD.complete&&giallucaHD.naturalWidth===384&&giallucaHD.naturalHeight===704;
// Ten genuine road/ground tile samples from each of the three original street sheets.
// These cover EVERY tile in the world. Street props are a separate, sparse overlay.
const floorAtlas=new Image();
floorAtlas.decoding="async";
floorAtlas.src="./assets/street-floor-tiles.png?v=1";
const floorReady=()=>floorAtlas.complete&&floorAtlas.naturalWidth===320&&floorAtlas.naturalHeight===96;
const PAL=[
 ["#1d3034","#374d49","#596b5a","#829278","#abb58f","#d9d8b1","#90755c","#715649"],
 ["#202f3c","#3b5360","#5c7479","#849c9c","#b3bdac","#dde0c5","#8f8471","#68828b"],
 ["#292f34","#4c524c","#777761","#ad9f83","#d4c4a3","#f0e0bb","#936755","#a2856a"]
];
const DARK="#1e3037",PANEL="#eee9c9",PANEL_MID="#879581",PANEL_EDGE="#435965";
const mobs={starter:0,n01:5,n02:3,n03:4,n04:2,n05:1,n06:6,n07:7,n08:8,n09:9};
const chars={player:0,gialluca:1,guide:2};
const facing={down:0,left:1,right:2,up:3};
function rect(c,x,y,w,h,color){c.fillStyle=color;c.fillRect(Math.floor(x),Math.floor(y),Math.floor(w),Math.floor(h));}
function sprite(c,sx,sy,sw,sh,dx,dy,dw,dh){
 if(!ready())return false;
 c.imageSmoothingEnabled=false;
 c.drawImage(atlas,sx,sy,sw,sh,Math.round(dx),Math.round(dy),Math.round(dw),Math.round(dh));
 return true;
}
function hash(x,y,z){let h=Math.imul(x+17,374761393)+Math.imul(y+83,668265263)+Math.imul(z+3,1442695041);h=(h^(h>>>13))>>>0;h=Math.imul(h,1274126177);return(h^(h>>>16))>>>0;}
function rnd(h){return h/4294967295;}
// Coherent surface patches: different pavement samples alternate without turning
// the ground into isolated decorative squares.  No Math.random per frame.
const FLOOR_GROUPS=[
 {regular:[0,0,0,1,2,3,9],rough:[1,2,2,3,6,7,8],loose:[6,6,7,7,8],wet:[4,5]},
 {regular:[0,0,0,1,2,3],rough:[1,2,3,4,6],loose:[7,7,8,8,9],wet:[4,5,5,6,9]},
 {regular:[0,0,1,2,4,4,6,9],rough:[0,1,2,4,6,9],loose:[1,2,6,9],wet:[1,2,4]}
];
function floorIndex(zone,x,y,key){
 const z=Math.max(0,Math.min(2,zone));
 const group=FLOOR_GROUPS[z];
 const patch=hash(Math.floor((x+2)/5),Math.floor((y+1)/4),z);
 const jitter=hash(x*3+1,y*5+1,z+18);
 let bucket="regular";
 if(key==="ballast"||key==="grass"||key==="weeds"||key==="shrub")bucket="loose";
 else if(key==="puddle")bucket="wet";
 else if(key==="crack"||key==="grate")bucket="rough";
 else if(z===0&&y<9)bucket="loose";
 // Under the bridge, loose gravel gathers around the pillars.
 else if(z===1&&y>=12&&([5,6,18,19,30,31].includes(x))&&patch%5<3)bucket="loose";
 // Patches of older pavement are clustered, avoiding a noisy checkerboard.
 else if((patch%100)<19)bucket="rough";
 // Puddles at the rail depot are localised near the ballast, not everywhere.
 if(z===0&&key==="ballast"&&y>=4&&patch%23===0)return 4+jitter%2;
 // Street lines form recognizable road markings instead of random painted squares.
 if(z===2&&y===12&&x>=12&&x<=29&&x%4===2)return 5;
 if(z===2&&y===12&&x>=12&&x<=29&&x%4===3)return 7;
 if(z===2&&y===16&&x>=14&&x<=24&&x%4===1)return 8;
 if(z===2&&y===16&&x>=14&&x<=24&&x%4===2)return 3;
 const choices=group[bucket],selection=(jitter+Math.floor(patch/7))%choices.length;
 return choices[selection];
}
function fallback(c,fn,...params){
 if(typeof c.save==="function")c.save();
 if(typeof c.scale==="function")c.scale(2,2);
 fn(c,...params);
 if(typeof c.restore==="function")c.restore();
}
const cache=[new Map(),new Map(),new Map()];
floorAtlas.onload=function(){for(const memo of cache)memo.clear();};
floorAtlas.onerror=function(){for(const memo of cache)memo.clear();};
function build(z,x,y){
 const key=old.kind(z,x,y),variant=((x*13+y*19)%7+7)%7,p=PAL[z];
 const surface=floorIndex(z,x,y,key);
 const id=key+":"+variant+":"+surface+":"+(floorReady()?1:0);
 const memo=cache[z];if(memo.has(id))return memo.get(id);
 const tile=document.createElement("canvas");tile.width=T;tile.height=T;
 const t=tile.getContext("2d");t.imageSmoothingEnabled=false;
 // Render these 32x32 tiles natively. Never draw a legacy 16px canvas into
 // a second canvas: that path can fail on mobile and produces coarse pixels.
 const base=key==="ballast"||key==="asphalt"||key==="crack"?p[1]:
   key==="grass"||key==="weeds"?p[2]:
   key==="track"||key==="sleepers"?p[1]:
   key==="puddle"?p[3]:
   key==="wagon"||key==="roof"||key==="wall"||key==="column"?p[2]:p[3];
 rect(t,0,0,T,T,base);
 if(floorReady())t.drawImage(floorAtlas,surface*T,z*T,T,T,0,0,T,T);
 // Only generate synthetic grain when the original flooring image is unavailable.
 if(!floorReady()&&(key==="asphalt"||key==="crack")){
  for(let xx=0;xx<T;xx+=11)rect(t,xx,(xx*3+variant*7)%31,4,1,p[2]);
  for(let yy=5;yy<T;yy+=9)rect(t,(yy*5+variant*3)%29,yy,2,1,p[0]);
 }
 if(!floorReady()&&key==="ballast"){
  for(let n=0;n<18;n++){const xx=(n*17+variant*7)%30,yy=(n*11+variant*13)%30;
   rect(t,xx,yy,2,2,n%3===0?p[0]:n%3===1?p[3]:p[6]);
  }
 }
 if(!floorReady()&&(key==="grass"||key==="weeds")){
  for(let n=0;n<12;n++){const xx=(n*11+variant*7)%29,yy=(n*19+variant*3)%30;
   rect(t,xx,yy,1,3,p[1]);rect(t,xx-1,yy+1,3,1,p[4]);
  }
 }
 if(key==="brick"||key==="wall")rect(t,0,0,T,3,p[0]);
 if(key==="grate"){rect(t,4,5,24,21,p[0]);for(let xx=8;xx<27;xx+=5)rect(t,xx,7,2,17,p[4]);}
 if(key==="shrub"){rect(t,3,4,26,24,p[1]);for(let n=0;n<12;n++)rect(t,(n*9)%23+5,(n*17)%19+7,5,2,p[n%2?4:2]);}
 if(key==="tar"){rect(t,3,4,26,24,p[0]);rect(t,6,5,17,2,p[2]);}
 if(key==="curb"){rect(t,0,0,T,5,p[5]);rect(t,0,5,T,4,p[0]);}
 if(key==="metal"){for(let yy=0;yy<T;yy+=8){rect(t,0,yy,T,3,p[0]);rect(t,0,yy+3,T,1,p[4]);}}
 const seed=hash(x,y,z);
 if(!floorReady()&&["asphalt","crack","ballast","concrete","paver","grass","weeds","puddle"].includes(key)){
  for(let n=0;n<14;n++){
   const hx=hash(variant+n,n*7+z,seed%73),hy=hash(n*3+z,variant+n*5,seed%59);
   const xx=hx%30+1,yy=hy%30+1;
   rect(t,xx,yy,n%4===0?2:1,1,n%3===0?p[4]:n%3===1?p[1]:p[6]);
  }
 }
 if(!floorReady()&&["asphalt","crack"].includes(key)&&variant%3===0){
  rect(t,8,11,1,7,p[0]);rect(t,9,17,6,1,p[0]);rect(t,13,17,1,5,p[0]);
  rect(t,15,21,4,1,p[1]);rect(t,2,5,2,1,p[4]);
 }
 if(key==="paver"||key==="concrete"){
  for(let xx=0;xx<32;xx+=16){rect(t,xx,15,16,1,p[1]);rect(t,xx+7,1,1,14,p[3]);rect(t,xx+15,16,1,15,p[3]);}
 }
 if(!floorReady()&&(key==="ballast"||key==="grass"||key==="weeds")){
  for(let i=0;i<5;i++){
   const xx=(hash(i,x,z)+7)%28+2,yy=(hash(y,i,z)+5)%25+3;
   rect(t,xx,yy,1,4,p[1]);rect(t,xx-2,yy+1,2,1,p[3]);rect(t,xx+1,yy+2,2,1,p[4]);
  }
 }
 if(key==="brick"||key==="wall"||key==="shutter"){
  for(let yy=6;yy<32;yy+=6){
   rect(t,1,yy,30,1,p[0]);
   for(let xx=(yy%12===6?4:12);xx<32;xx+=15)rect(t,xx,yy+1,1,5,p[1]);
  }
  if(key==="shutter"){
   for(let yy=3;yy<32;yy+=4){rect(t,2,yy,28,1,p[0]);rect(t,3,yy+1,26,1,p[3]);}
  }
 }
 if(key==="fence"){
  for(let xx=2;xx<32;xx+=8){
   rect(t,xx,0,2,32,p[0]);rect(t,xx+1,1,1,28,p[4]);
  }
  rect(t,0,6,32,3,p[0]);rect(t,0,26,32,2,p[0]);
 }
 if(key==="track"||key==="sleepers"){
  rect(t,0,7,32,3,p[0]);rect(t,0,21,32,3,p[0]);
  rect(t,0,8,32,1,p[5]);rect(t,0,22,32,1,p[5]);
  if(variant%2===0){for(let xx=3;xx<32;xx+=9)rect(t,xx,3,4,26,p[6]);}
 }
 if(key==="column"){
  rect(t,3,0,26,32,p[1]);rect(t,6,0,2,32,p[4]);rect(t,25,0,2,32,p[0]);
  for(let yy=5;yy<32;yy+=10)rect(t,6,yy,20,2,p[2]);
 }
 if(key==="wagon"){
  rect(t,1,1,30,30,p[0]);rect(t,3,2,25,26,p[2]);
  rect(t,4,6,24,2,p[5]);rect(t,4,20,24,2,p[0]);
  rect(t,5,11,8,8,p[1]);rect(t,16,11,8,8,p[1]);rect(t,5,11,2,8,p[5]);
  rect(t,2,27,4,4,p[0]);rect(t,25,27,5,4,p[0]);
 }
 if(key==="roof"){
  rect(t,0,0,32,4,p[0]);rect(t,2,5,28,25,p[1]);
  for(let yy=10;yy<30;yy+=7)rect(t,4,yy,24,1,p[6]);
 }
 if(key==="puddle"){
  rect(t,4,15,23,4,p[1]);rect(t,8,13,17,2,p[3]);rect(t,10,16,10,1,p[5]);
 }
 memo.set(id,t);return t;
}
let firstTileError=false;
function ground(c,z,x,y,screenX,screenY,blocked){
 c.imageSmoothingEnabled=false;
 const px=Math.round(screenX),py=Math.round(screenY);
 try{c.drawImage(build(z,x,y),px,py);}
 catch(err){
  // A bad offscreen tile should never blank the full mobile LCD.
  if(!firstTileError){firstTileError=true;console.error("Ninomon tile fallback",err);}
  rect(c,px,py,T,T,PAL[z][2]);
  for(let k=0;k<8;k++)rect(c,px+(k*11)%30,py+(k*17)%30,2,1,PAL[z][1]);
 }
 const key=old.kind(z,x,y);
 // Props are limited to their proper surroundings; the flooring itself is
 // completely tiled with source textures rather than intermittent PNG stamps.
 if(ready()){
  const seed=hash(x,y,z);
  let prop=-1;
  if(z===0&&key==="ballast"&&seed%24===0)prop=3; // weeds in gravel
  if(z===1&&(key==="puddle"||key==="crack")&&seed%18===0)prop=9; // drain
  if(z===2&&key==="asphalt"&&y>=12&&x>=4&&seed%41===0)prop=11; // debris
  if(prop>=0)sprite(c,prop*48,768+z*48,48,48,px,py,32,32);
 }
}
function person(c,x,y,who="player",dir="down",walk=0){
 const role=who==="gialluca"?"gialluca":who==="guide"?"guide":who==="player"?"player":"npc";
 const d=facing[dir]??0,frame=walk?Math.floor(walk*1.4)%3:1;
 if((role==="player"&&ninoReady())||(role==="gialluca"&&giallucaReady())){
  // Render from real 128x176 source frames rather than enlarging old 48x64 pixels.
  // Both sprites share the same world-space foot anchor and walking cadence.
  const source=role==="player"?ninoHD:giallucaHD;
  const smoothing=c.imageSmoothingEnabled,quality=c.imageSmoothingQuality;
  c.imageSmoothingEnabled=true;
  c.imageSmoothingQuality="high";
  try{
   c.drawImage(source,frame*128,d*176,128,176,
     Math.round(x-21),Math.round(y-61),42,61);
  }finally{
   c.imageSmoothingEnabled=smoothing;
   c.imageSmoothingQuality=quality;
  }
  return;
 }
 if(ready()&&chars[role]!==undefined){
  if(sprite(c,frame*48,(chars[role]*4+d)*64,48,64,x-17,y-49,34,49))return;
 }
 fallback(c,old.person,x/2,y/2,who,dir,walk);
}
function monster(c,id,x,y,scale=1,back=false){
 const cell=mobs[id];
 const size=scale>=3?100:32;
 if(ready()&&cell!==undefined){
  const left=cell<6?144:368, top=cell<6?cell*112:208+(cell-6)*112;
  if(sprite(c,left+(back?112:0),top,112,112,x,y,size,size))return;
 }
 fallback(c,old.monster,id,x/2,y/2,scale,back);
}
function text(c,value,x,y,color=DARK,size=12){
 c.font="bold "+Math.round(size)+"px monospace";
 c.fillStyle=color;c.textAlign="left";c.textBaseline="top";
 c.fillText(String(value),Math.round(x),Math.round(y));
}
function frame(c,x,y,w,h,z=0){
 rect(c,x,y,w,h,DARK);rect(c,x+3,y+3,w-6,h-6,PANEL);
 rect(c,x+5,y+5,w-10,1,PANEL_MID);
 rect(c,x+5,y+h-7,w-10,1,PANEL_MID);
}
function bar(c,x,y,w,pct,z=0){
 const p=PAL[z];rect(c,x,y,w,10,DARK);rect(c,x+2,y+2,w-4,6,p[1]);
 rect(c,x+2,y+2,Math.floor((w-4)*Math.max(0,Math.min(1,pct))),6,pct<.28?"#d87365":"#79b685");
}
function symbol(c,x,y,pale=false){
 const col=pale?PAL[1][5]:PAL[0][5];
 rect(c,x+10,y,12,3,DARK);rect(c,x+16,y+3,3,10,DARK);
 rect(c,x+13,y+13,3,3,DARK);rect(c,x+13,y+20,3,3,DARK);rect(c,x+13,y+4,3,4,col);
}
function environment(c,z){
 const p=PAL[z];
 rect(c,0,0,W,H,p[3]);
 if(z===0){
  rect(c,0,0,W,105,p[2]);rect(c,0,0,W,12,p[0]);
  for(let x=0;x<W;x+=42){
   rect(c,x+2,24,36,66,p[1]);rect(c,x+5,28,30,40,p[3]);
   rect(c,x+10,33,20,21,p[4]);rect(c,x+14,35,12,14,p[1]);
   rect(c,x+7,72,26,2,p[0]);
  }
  rect(c,0,108,W,7,p[0]);rect(c,0,112,W,2,p[5]);
  for(let x=0;x<W;x+=32){rect(c,x+3,122,12,2,p[0]);rect(c,x+9,131,4,24,p[6]);}
 }else if(z===1){
  rect(c,0,0,W,119,p[1]);rect(c,0,0,W,16,p[0]);
  for(let x=4;x<W;x+=72){
   rect(c,x+12,14,21,124,p[0]);rect(c,x+17,14,12,124,p[2]);rect(c,x+16,49,14,4,p[3]);
   rect(c,x+16,96,14,4,p[3]);
  }
  rect(c,0,121,W,7,p[0]);rect(c,0,128,W,3,p[5]);
 }else{
  rect(c,0,0,W,120,p[2]);rect(c,0,0,W,11,p[0]);
  for(let x=0;x<W;x+=66){
   rect(c,x+1,11,63,100,p[1]);rect(c,x+6,19,52,32,p[0]);rect(c,x+10,23,44,24,p[4]);
   rect(c,x+8,68,48,6,p[0]);
   for(let y=75;y<110;y+=7){rect(c,x+8,y,48,2,p[0]);rect(c,x+10,y+3,44,1,p[3]);}
  }
  rect(c,0,119,W,9,p[0]);
 }
 rect(c,0,136,W,86,p[3]);rect(c,0,137,W,3,p[0]);
 for(let x=0;x<W;x+=34){rect(c,x+7,151,18,1,p[1]);rect(c,x+21,172,10,1,p[2]);rect(c,x+2,196,12,1,p[1]);}
}
function battle(c,b,z,lines){
 const p=PAL[z];
 environment(c,z);
 rect(c,16,126,109,6,p[1]);rect(c,21,132,101,3,p[2]);
 rect(c,205,119,111,6,p[1]);rect(c,207,125,102,3,p[5]);
 monster(c,b.enemy.id,206,30,3,false);
 monster(c,b.player.id,16,123,3,true);
 frame(c,4,8,174,72,z);
 text(c,b.enemy.name.toUpperCase().slice(0,21),12,13,DARK,11);
 bar(c,12,39,133,b.enemy.hp/b.enemy.maxHp,z);
 text(c,"PS "+b.enemy.hp+"/"+b.enemy.maxHp,12,55,DARK,12);
 frame(c,159,139,157,74,z);
 text(c,b.player.name.toUpperCase().slice(0,17),167,143,DARK,11);
 bar(c,167,169,138,b.player.hp/b.player.maxHp,z);
 text(c,"PS "+b.player.hp+"    F "+b.player.fiato+"/"+b.player.maxFiato,167,185,DARK,11);
 frame(c,3,224,314,61,z);
 let msg=(Array.isArray(lines)?lines.join(" "):String(lines||"SCEGLI UNA MOSSA")).toUpperCase();
 const words=msg.split(/\s+/),rows=[];let current="";
 for(const w of words){if((current+" "+w).trim().length>40){rows.push(current);current=w;}else current=(current+" "+w).trim();}
 if(current)rows.push(current);
 for(let i=0;i<Math.min(3,rows.length);i++)text(c,rows[i],12,232+i*16,DARK,12);
}
function introLake(c,phase=0,chapter=0){
 const p=PAL[0];rect(c,0,0,W,H,p[3]);
 for(let y=0;y<H;y+=T)for(let x=0;x<W;x+=T){
  const tx=x/32,ty=y/32;
  c.drawImage(build(0,tx+18,ty+3),x,y);
 }
 for(let y=22;y<207;y++){
  const d=Math.abs(y-103),left=28+Math.round(d*.38),right=288-Math.round(d*.42);
  rect(c,left-4,y,right-left+8,1,p[0]);rect(c,left,y,right-left,1,p[2]);
  if(y%14===0){rect(c,left+14,y,19,1,p[5]);rect(c,right-31,y,13,1,p[4]);}
 }
 rect(c,0,213,W,7,p[0]);rect(c,0,220,W,6,p[5]);
 for(let x=7;x<W;x+=42){rect(c,x,229,32,2,p[1]);rect(c,x+6,243,10,2,p[6]);}
 // Intro art from the supplied professor sprite, with more pixels than on Game Boy.
 const profX=189,profY=5;
 if(!sprite(c,368+(chapter%3===0?0:144),0,144,188,profX,profY,124,176)){
  fallback(c,old.introLake,phase,chapter);
 }
 person(c,76,218,"player","up");
 if(ready())sprite(c,144,0,112,112,118,157,64,64); // Starter Gialluca
 frame(c,22,8,158,30,0);
 text(c,"LAGO DEI NINOMON",30,15,DARK,14);
}
root.NINOMON_RETRO=Object.assign({},old,{W,H,T,P:PAL,ground,person,monster,text,frame,bar,symbol,battle,introLake,ready,sprite,atlas,floorAtlas,floorReady,floorIndex,ninoHD,ninoReady,giallucaHD,giallucaReady,revision:"snes-street-writers-hd"});
})(window);
