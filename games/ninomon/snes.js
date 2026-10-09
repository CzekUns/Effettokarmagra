/* I Ninomon — SNES Street Edition renderer.
 * Native 320x317 framebuffer (~10% taller), 32px metatiles and high-detail user artwork.
 * Logical scale remains 32px/tile; camera reveals more map vertically without stretching.
 * CSS presents the framebuffer at its normal physical size on mobile.
 */
(function(root){
"use strict";
const old=root.NINOMON_RETRO;
if(!old)throw Error("retro.js must load before snes.js");
const W=320,H=317,T=32;
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
// Detail-preserving large portraits: top row Gialluca front/back,
// bottom row Professor Vincenzo idle/point. Separate from overworld sprites.
const largeHD=new Image();
largeHD.decoding="async";
largeHD.src="./assets/large-characters-hd-v2.png?v=2";
const largeReady=()=>largeHD.complete&&largeHD.naturalWidth===576&&largeHD.naturalHeight===832;
function largePortrait(c,who,pose,x,y,w,h){
 if(!largeReady())return false;
 const col=(pose==="back"||pose==="point")?1:0;
 const row=who==="vincenzo"?1:0;
 const smooth=c.imageSmoothingEnabled,quality=c.imageSmoothingQuality;
 try{
  c.imageSmoothingEnabled=true;c.imageSmoothingQuality="high";
  c.drawImage(largeHD,col*288,row*416,288,416,
    Math.round(x),Math.round(y),Math.round(w),Math.round(h));
  return true;
 }catch(_){return false;}
 finally{c.imageSmoothingEnabled=smooth;c.imageSmoothingQuality=quality;}
}

// Ten genuine road/ground tile samples from each of the three original street sheets.
// These cover EVERY tile in the world. Street props are a separate, sparse overlay.
const floorAtlas=new Image();
floorAtlas.decoding="async";
floorAtlas.src="./assets/street-floor-tiles.png?v=1";
const floorReady=()=>floorAtlas.complete&&floorAtlas.naturalWidth===320&&floorAtlas.naturalHeight===96;
// 72 newly cropped opaque ground textures (24 per setting); source 64px version
// is archived alongside this 32px game atlas. Existing 30-sample sheet stays as fallback.
const floorV2=new Image();
floorV2.decoding="async";
floorV2.src="./assets/pavements/floor-game-32.png?v=1";
const floorV2Ready=()=>floorV2.complete&&floorV2.naturalWidth===768&&floorV2.naturalHeight===96;
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
let spriteFaultReported=false;
function sprite(c,sx,sy,sw,sh,dx,dy,dw,dh){
 if(!ready())return false;
 try{
  c.imageSmoothingEnabled=false;
  c.drawImage(atlas,sx,sy,sw,sh,Math.round(dx),Math.round(dy),Math.round(dw),Math.round(dh));
  return true;
 }catch(err){
  if(!spriteFaultReported){spriteFaultReported=true;console.warn("Ninomon: sprite temporarily unavailable",err);}
  return false;
 }
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
const FLOOR_GROUPS_V2=[
 // Freight yard: the main path is dark asphalt, with separate gravel beds above the tracks.
 {regular:[4,4,22,23],rough:[4,22,23],loose:[5,8,9,10,11,16,18,19,20],wet:[22,23],grass:[6,9,17,21]},
 // Underpass: light concrete near the viaduct, worn asphalt below; reserve vertical edge tiles.
 {regular:[8,10,20],concrete:[0,1,3,11,16],rough:[2,4,17,18,19],loose:[6,13,14,21,22],wet:[2,4,17],paver:[12]},
 // Alley: dark asphalt throughout; pale paving stones belong on the sidewalk only.
 {regular:[0,1,4,21,23],rough:[2,8,10,20],loose:[14,15],wet:[10,20],paver:[6,7,18,19,22]}
];
function floorIndexV2(z,x,y,key){
 // Rail, paving and lane markings are purposeful features; never randomly place
 // these in the open asphalt/ballast. All indices correspond to floor-manifest.json.
 if(z===0&&(key==="track"||key==="sleepers"))return [7,12,13,14][((x+Math.floor(y/2))%4+4)%4];
 if(z===1&&key==="grate")return 12;
 if(z===2&&key==="paver")return [6,7,18,19][Math.floor(x/4)%4];
 if(z===2&&y===12&&x>=12&&x<=29&&x%4===2)return 9; // faded white marking
 if(z===2&&y===16&&x>=14&&x<=24)return 5;             // continuous yellow line
 if(z===2&&key==="grate")return 12;
 const group=FLOOR_GROUPS_V2[z];
 let bucket="regular";
 if(key==="ballast"||key==="weeds"||key==="grass"||key==="shrub")bucket=z===0&&key==="grass"?"grass":"loose";
 else if(z===1&&key==="concrete")bucket="concrete";
 else if(key==="puddle")bucket="wet";
 else if(key==="crack"||key==="grate")bucket="rough";
 else if(z===0&&y<9)bucket="loose";
 else if(z===1&&y>=12&&[5,6,18,19,30,31].includes(x)&&hash(Math.floor(x/4),Math.floor(y/3),z)%5<3)bucket="loose";
 else if(hash(Math.floor(x/5),Math.floor(y/4),z)%100<19)bucket="rough";
 const options=group[bucket];
 // Stable 3x3 batches retain material continuity; about 1/5 of cells carry
 // a different texture to avoid mechanically identical squares.
 const patch=hash(Math.floor(x/3),Math.floor(y/3),z+31);
 const detail=hash(x*11,y*13,z+19);
 return options[(patch+(detail%5===0?detail%options.length:0))%options.length];
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
floorV2.onload=function(){for(const memo of cache)memo.clear();};
floorV2.onerror=function(){for(const memo of cache)memo.clear();};
function build(z,x,y){
 const key=old.kind(z,x,y),variant=((x*13+y*19)%7+7)%7,p=PAL[z];
 const sourceMode=floorV2Ready()?2:floorReady()?1:0;
 const surface=sourceMode===2?floorIndexV2(z,x,y,key):floorIndex(z,x,y,key);
 const id=key+":"+variant+":"+surface+":"+sourceMode;
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
 if(sourceMode===2)t.drawImage(floorV2,surface*T,z*T,T,T,0,0,T,T);
 else if(sourceMode===1)t.drawImage(floorAtlas,surface*T,z*T,T,T,0,0,T,T);
 // Only generate synthetic grain when the original flooring image is unavailable.
 if(sourceMode===0&&(key==="asphalt"||key==="crack")){
  for(let xx=0;xx<T;xx+=11)rect(t,xx,(xx*3+variant*7)%31,4,1,p[2]);
  for(let yy=5;yy<T;yy+=9)rect(t,(yy*5+variant*3)%29,yy,2,1,p[0]);
 }
 if(sourceMode===0&&key==="ballast"){
  for(let n=0;n<18;n++){const xx=(n*17+variant*7)%30,yy=(n*11+variant*13)%30;
   rect(t,xx,yy,2,2,n%3===0?p[0]:n%3===1?p[3]:p[6]);
  }
 }
 if(sourceMode===0&&(key==="grass"||key==="weeds")){
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
 if(sourceMode===0&&["asphalt","crack","ballast","concrete","paver","grass","weeds","puddle"].includes(key)){
  for(let n=0;n<14;n++){
   const hx=hash(variant+n,n*7+z,seed%73),hy=hash(n*3+z,variant+n*5,seed%59);
   const xx=hx%30+1,yy=hy%30+1;
   rect(t,xx,yy,n%4===0?2:1,1,n%3===0?p[4]:n%3===1?p[1]:p[6]);
  }
 }
 if(sourceMode===0&&["asphalt","crack"].includes(key)&&variant%3===0){
  rect(t,8,11,1,7,p[0]);rect(t,9,17,6,1,p[0]);rect(t,13,17,1,5,p[0]);
  rect(t,15,21,4,1,p[1]);rect(t,2,5,2,1,p[4]);
 }
 if(sourceMode!==2&&(key==="paver"||key==="concrete")){
  for(let xx=0;xx<32;xx+=16){rect(t,xx,15,16,1,p[1]);rect(t,xx+7,1,1,14,p[3]);rect(t,xx+15,16,1,15,p[3]);}
 }
 if(sourceMode===0&&(key==="ballast"||key==="grass"||key==="weeds")){
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
 if(sourceMode!==2&&(key==="track"||key==="sleepers")){
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
 if(sourceMode!==2&&key==="puddle"){
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
  let drawn=false;
  try{
   c.drawImage(source,frame*128,d*176,128,176,
     Math.round(x-21),Math.round(y-61),42,61);
   drawn=true;
  }catch(_){/* Fall back to the old sprites while the PNG finishes decoding. */}
  finally{
   c.imageSmoothingEnabled=smoothing;
   c.imageSmoothingQuality=quality;
  }
  if(drawn)return;
 }
 if(ready()&&chars[role]!==undefined){
  if(sprite(c,frame*48,(chars[role]*4+d)*64,48,64,x-17,y-49,34,49))return;
 }
 fallback(c,old.person,x/2,y/2,who,dir,walk);
}
function monster(c,id,x,y,scale=1,back=false){
 const cell=mobs[id];
 const size=scale>=3?100:32;
 if(id==="starter"&&scale>=3&&largePortrait(c,"gialluca",back?"back":"front",
   x+7,y-17,86,117))return;
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
function battle(c,b,z,lines,fx=null){
 const p=PAL[z];
 environment(c,z);
 // Retro battlefield perspective: two pavements, shadow rings, visible opponent on top.
 rect(c,9,130,117,6,p[1]);rect(c,18,136,103,3,p[2]);
 rect(c,198,117,117,6,p[1]);rect(c,209,123,99,3,p[5]);
 const phase=fx?Math.max(0,fx.timestamp-fx.startedAt):2;
 const spring=fx&&fx.kind==="move"?Math.round(Math.sin(Math.min(1,phase/.17)*Math.PI)*11):0;
 const shake=fx&&fx.kind==="hit"?Math.round(Math.sin(phase*87)*4*(1-Math.min(1,phase/.28))):0;
 const enemyDx=fx&&fx.who==="enemy"?-spring:0,playerDx=fx&&fx.who==="player"?spring:0;
 const enemyShake=fx&&fx.target==="enemy"?shake:0,playerShake=fx&&fx.target==="player"?shake:0;
 // Soft shadows under feet make the battle stage easier to read.
 c.save();c.globalAlpha=.28;rect(c,24,217,83,5,p[0]);rect(c,217,130,83,5,p[0]);c.restore();
 monster(c,b.enemy.id,206+enemyDx+enemyShake,26,3,false);
 monster(c,b.player.id,13+playerDx+playerShake,121,3,true);
 // Pulse a hit over its target; preserve canvas state for every other renderer.
 if(fx&&fx.kind==="hit"){
  const alpha=.35*(1-Math.min(1,phase/.26));
  if(alpha>0){
   c.save();c.globalAlpha=alpha;c.fillStyle=fx.effectiveness>1?"#ffda72":"#fff0e0";
   const x=fx.target==="enemy"?217:27,y=fx.target==="enemy"?49:145;
   c.fillRect(x,y,72,60);c.restore();
  }
  const impactX=fx.target==="enemy"?223:26,impactY=fx.target==="enemy"?107:189;
  if(phase<.2){text(c,"-"+(fx.damage||0),impactX,impactY-Math.round(phase*30),"#7f2934",18);}
 }
 if(fx&&fx.kind==="miss"&&phase<.22)text(c,"MANCATO!",142,113,"#6c3b4b",12);
 if(fx&&fx.kind==="guard"&&phase<.24){
  c.save();c.globalAlpha=.36;c.strokeStyle="#527d81";c.lineWidth=5;
  c.strokeRect(16,120,100,102);c.restore();
 }
 // HP panels never cover large sprite faces or the dialogue box.
 frame(c,3,8,177,76,z);
 text(c,b.enemy.name.toUpperCase().slice(0,20),11,14,DARK,11);
 bar(c,11,40,135,b.enemy.maxHp?b.enemy.hp/b.enemy.maxHp:0,z);
 text(c,"PS "+b.enemy.hp+"/"+b.enemy.maxHp,11,56,DARK,11);
 const enemyEffects=Object.keys(b.enemy.status||{}).filter(k=>b.enemy.status[k]>0);
 if(enemyEffects.length)text(c,enemyEffects.slice(0,2).join(" ").toUpperCase().slice(0,20),11,70,"#8e493e",9);
 frame(c,155,139,162,76,z);
 text(c,b.player.name.toUpperCase().slice(0,18),163,145,DARK,11);
 bar(c,163,169,143,b.player.maxHp?b.player.hp/b.player.maxHp:0,z);
 text(c,"PS "+b.player.hp+"  F "+b.player.fiato+"/"+b.player.maxFiato,163,187,DARK,11);
 const playerEffects=Object.keys(b.player.status||{}).filter(k=>b.player.status[k]>0);
 if(playerEffects.length)text(c,playerEffects.slice(0,2).join(" ").toUpperCase().slice(0,22),163,202,"#8e493e",9);
 const dialogY=H-79;
 frame(c,3,dialogY,314,76,z);
 const msg=(Array.isArray(lines)?lines.join(" "):String(lines||"SCEGLI UNA MOSSA")).toUpperCase();
 const words=msg.split(/\s+/),rows=[];let current="";
 for(const word of words){
  if((current+" "+word).trim().length>38){if(current)rows.push(current);current=word;}
  else current=(current+" "+word).trim();
 }
 if(current)rows.push(current);
 for(let i=0;i<Math.min(4,rows.length);i++)text(c,rows[i],12,dialogY+8+i*16,DARK,12);
}
/* Pokemon-era inspired opening, with original NINOBOY / Ninomon artwork.
   Story board: title, professor introduction, starter reveal, trainer, departure.
   Each scene is rendered in the SAME 320x317 LCD; dialogue is anchored at the bottom. */
function introStory(c,scene="professor",seconds=0,step=0){
 c.imageSmoothingEnabled=false;
 const clock=Number.isFinite(seconds)?seconds:0;
 const wobble=Math.round(Math.sin(clock*3)*2);
 const cream="#ecebd2",dark="#293b40",mid="#a3b9ab",olive="#6d887c";
 rect(c,0,0,W,H,cream);
 // Subtle checker motifs and double framed miniature game card.
 for(let y=0;y<H;y+=16)for(let x=0;x<W;x+=16){
  if((x+y)%32===0)rect(c,x,y,8,8,"#e2e5c9");
 }
 rect(c,0,0,W,7,dark);rect(c,0,H-7,W,7,dark);
 rect(c,8,8,W-16,H-16,dark);
 rect(c,11,11,W-22,H-22,cream);
 rect(c,15,15,W-30,2,mid);
 if(scene==="title"){
  rect(c,16,24,288,97,dark);
  rect(c,20,28,280,89,"#536c69");
  text(c,"I",155,34,"#e3e9d0",14);
  text(c,"NINOMON",29,55,"#f9efbc",43);
  text(c,"CRONACHE DI STRADA",66,105,"#e3e9d0",13);
  for(let x=24;x<300;x+=28)rect(c,x,128+(x%3)*2,18,2,dark);
  // Original trainer and starter on the title screen, above the button panel.
  if(ninoReady()){
   const previous=c.imageSmoothingEnabled;c.imageSmoothingEnabled=true;
   try{c.drawImage(ninoHD,128,0,128,176,53,133,71,97);}
   catch(_){person(c,100,225,"player","down");}
   finally{c.imageSmoothingEnabled=previous;}
  }else person(c,100,225,"player","down");
  if(!largePortrait(c,"gialluca","front",188,135+wobble,93,112)){
   if(ready())sprite(c,144,0,112,112,178,134+wobble,110,106);
   else monster(c,"starter",201,155,2,false);
  }
  text(c,"© NINOBOY STREET",102,237,dark,11);
  return;
 }
 // Professor's lab portrait screen: grayscale style panels with the real art.
 if(scene==="professor"){
  rect(c,38,30,244,179,"#d8e0c7");
  rect(c,43,36,234,168,mid);
  rect(c,47,40,226,160,cream);
  for(let x=53;x<270;x+=16)rect(c,x,195,11,2,olive);
  rect(c,18,28,84,5,dark);
  text(c,"N. "+String(step+1).padStart(2,"0"),23,37,dark,12);
  if(!largePortrait(c,"vincenzo",step===2?"point":"idle",106,9+wobble,119,187)
   &&!sprite(c,368+(step===2?144:0),0,144,188,106,9+wobble,119,187)){
   old.person(c,100,152,"guide","down",0);
  }
  text(c,"PROF. VINCENZO",22,213,dark,13);
  return;
 }
 if(scene==="starter"){
  rect(c,18,35,284,161,"#bed1b9");
  rect(c,23,40,274,150,cream);
  // A city waste-bin / street lab stand: the professor presents the very first Ninomon.
  for(let x=43;x<278;x+=38)rect(c,x,176,23,2,mid);
  if(!largePortrait(c,"vincenzo","idle",10,70,78,117)){
   if(!sprite(c,368,0,144,188,12,69,76,116))person(c,68,180,"guide","down");
  }
  if(!largePortrait(c,"gialluca","front",128,45+wobble,139,157)){
   if(!sprite(c,144,0,112,112,120,47+wobble,160,155))monster(c,"starter",147,65,3,false);
  }
  text(c,"NINOMON N.000",20,204,dark,13);
  text(c,"GIALLUCA",208,204,dark,14);
  return;
 }
 if(scene==="trainer"){
  rect(c,47,23,228,180,mid);rect(c,53,29,216,169,cream);
  if(ninoReady()){
   const previous=c.imageSmoothingEnabled;c.imageSmoothingEnabled=true;
   try{c.drawImage(ninoHD,128,0,128,176,105,16+wobble,110,188);}
   catch(_){person(c,170,206,"player","down");}
   finally{c.imageSmoothingEnabled=previous;}
  }else person(c,170,206,"player","down");
  text(c,"TRAINER",21,207,dark,13);
  text(c,"NINO",243,207,dark,14);
  return;
 }
 // Last scene is the lake in which Nino's journey begins.
 introLake(c,seconds,step);
}
function introLake(c,phase=0,chapter=0){
 const p=PAL[0];rect(c,0,0,W,H,p[3]);
 for(let y=0;y<H;y+=T)for(let x=0;x<W;x+=T){
  const tx=x/32,ty=y/32;
  try{c.drawImage(build(0,tx+18,ty+3),x,y);}
  catch(_){rect(c,x,y,T,T,p[2]);}
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
 if(!largePortrait(c,"vincenzo",chapter%3===0?"idle":"point",profX,profY,124,176)
   &&!sprite(c,368+(chapter%3===0?0:144),0,144,188,profX,profY,124,176)){
  fallback(c,old.introLake,phase,chapter);
 }
 person(c,76,218,"player","up");
 if(!largePortrait(c,"gialluca","front",122,156,61,66)){
  if(ready())sprite(c,144,0,112,112,118,157,64,64);
 } // Starter Gialluca
 frame(c,22,8,158,30,0);
 text(c,"LAGO DEI NINOMON",30,15,DARK,14);
}
root.NINOMON_RETRO=Object.assign({},old,{W,H,T,P:PAL,ground,person,monster,text,frame,bar,symbol,battle,introLake,introStory,ready,sprite,atlas,floorAtlas,floorReady,floorIndex,floorV2,floorV2Ready,floorIndexV2,ninoHD,ninoReady,giallucaHD,giallucaReady,largeHD,largeReady,largePortrait,revision:"snes-overworld-72-floor-tiles-v1"});
})(window);
