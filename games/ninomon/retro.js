/* I NINOMON / NINOBOY: original low-resolution urban tiles and sprites.
   Four opaque colours per background tile palette; patterns sampled at native pixels.
   No borrowed sprites, images, gradients, translucency or filters. */
(function(root){
"use strict";
const W=160,H=144,T=16;
// Single actual image atlas produced from the user-provided transparent sprite sheets.
// Coordinates are fixed; missing/slow images fall back to existing procedural art.
const IMAGE_SOURCE="./assets/ninomon-atlas.png?v=2";
const art=typeof Image!=="undefined"?new Image():null;
if(art){art.decoding="async";art.src=IMAGE_SOURCE;}
function ready(){return !!(art&&art.complete&&art.naturalWidth===328&&art.naturalHeight===456);}
function sprite(c,sx,sy,sw,sh,dx,dy,dw,dh){
 if(!ready())return false;
 c.imageSmoothingEnabled=false;
 c.drawImage(art,sx,sy,sw,sh,Math.round(dx),Math.round(dy),Math.round(dw),Math.round(dh));
 return true;
}
const DIR={down:0,left:1,right:2,up:3};
const CHAR={player:0,guide:2,gialluca:1};
// Legacy atlas order differs from SNES; last two creatures are bag, then hoodie monkey.
const MOB={starter:0,n01:5,n02:3,n03:4,n04:2,n05:1,n06:6,n07:7,n08:9,n09:8};

const P=[
 ["#26393a","#586657","#899778","#d8d8ae"], // scalo
 ["#253542","#526671","#879b9a","#d1d2b8"], // sottopasso
 ["#353c3c","#717563","#b1a582","#ead8ac"]  // retrobottega
];
const A={
 asphalt:["11111111","11211111","11111111","11111111","11111121","11111111","11111111","11111111"],
 crack:["11121111","11121111","11021111","11211111","11211101","11111001","11111011","11111011"],
 concrete:["22222222","22222222","21222222","22222222","22222222","22222212","22222222","22222222"],
 paver:["22222222","22222222","22222222","11111111","22222222","22222222","22222222","11111111"],
 ballast:["11211121","11121111","21111211","11111121","12111111","11121111","11111211","21111112"],
 track:["11111111","22222222","00000000","22222222","11111111","11111111","00000000","22222222"],
 sleepers:["11111111","22332233","00000000","22222222","11111111","22233223","00000000","22222222"],
 metal:["11111111","22222222","11111111","22222222","11111111","22222222","11111111","22222222"],
 brick:["22212221","22212221","11111111","12221222","12221222","11111111","22212221","22212221"],
 grate:["00000000","02112120","02112120","00000000","02112120","02112120","00000000","11111111"],
 grass:["11111111","11211111","11221111","11121111","11111121","11111221","11111211","11111111"],
 puddle:["11111111","11222211","12333221","12333221","12232211","11122111","11111111","11111111"],
 fence:["12112112","12112112","11111111","12112112","12112112","11111111","12112112","12112112"],
 wall:["01111110","12222221","12111121","12121121","12121121","12111121","12222221","01111110"],
 column:["01111110","12333321","12322321","12322321","12322321","12322321","12333321","01111110"],
 wagon:["00000000","02222220","02333320","02222220","02222220","02322220","02222220","00000000"],
 roof:["00000000","01222210","01222210","01222210","01222210","01222210","01222210","00000000"],
 shrub:["11111111","11222211","12333221","12333221","12333221","11222211","11121111","11101111"],
 tar:["00000000","01111110","01222210","01222210","01222210","01222210","01111110","00000000"],
 curb:["33333333","22222222","11111111","11111111","11111111","11111111","11111111","11111111"],
 window:["00000000","02222220","02333320","02313320","02313320","02333320","02222220","00000000"],
 shutter:["00000000","22222222","11111111","22222222","11111111","22222222","11111111","00000000"],
 weeds:["11111111","11121111","11221111","11121121","11122211","12112111","12211211","11111111"]
};
function rect(c,x,y,w,h,color){c.fillStyle=color;c.fillRect(Math.floor(x),Math.floor(y),w,h);}
function pattern(c,key,x,y,p,flip){
 const rows=A[key]||A.asphalt;
 for(let r=0;r<8;r++){
  const line=rows[r];let last=-1,begin=0;
  for(let k=0;k<=8;k++){
   const ch=k<8?Number(line[flip?7-k:k]):-1;
   if(ch!==last){
    if(last>=0)rect(c,x+begin,y+r,k-begin,1,p[last]);
    last=ch;begin=k;
   }
  }
 }
}
function kind(z,x,y,blocked){
 if(z===0){
  if(y===9||y===10)return x%2?"track":"sleepers";
  if(y===11&&((x>=2&&x<=11)||(x>=24&&x<=31)))return"fence";
  if(x>=3&&x<=12&&y>=5&&y<=8)return"wagon";
  if(x>=24&&x<=32&&y>=3&&y<=8)return"brick";
  if(x>=2&&x<=7&&y>=18&&y<=21)return"roof";
  if(y<9)return (x+y)%9===0?"grass":"ballast";
  return (x*3+y)%13===0?"crack":"asphalt";
 }
 if(z===1){
  if(y<=10){
   if((x>=4&&x<=6||x>=17&&x<=19||x>=29&&x<=31)&&y>=6)return"column";
   if(x>=7&&x<=11&&y<=5)return"wall";
   return(y===10)?"curb":"concrete";
  }
  if((x*13+y*3)%29===0)return"puddle";
  if((x*7+y)%16===0)return"grate";
  return (x+y*2)%11===0?"crack":"asphalt";
 }
 if(z===2){
  if((x>=3&&x<=10||x>=22&&x<=31)&&y>=3&&y<=8)return y===3?"roof":y%3===0?"shutter":"brick";
  if(x>=4&&x<=7&&y>=18&&y<=21)return"roof";
  if(y===9||y===10)return"paver";
  if((x+y*3)%17===0)return"puddle";
  if((x*3+y)%13===0)return"weeds";
  return (x+y*7)%11===0?"crack":"asphalt";
 }
 return"asphalt";
}
const caches=[new Map(),new Map(),new Map()];
function builtTile(z,key,variant){
 const cache=caches[z],id=key+"-"+variant;
 if(cache.has(id))return cache.get(id);
 const off=document.createElement("canvas");off.width=T;off.height=T;
 const ctx=off.getContext("2d");ctx.imageSmoothingEnabled=false;
 const p=P[z];
 // Metatile = 4 independently addressable 8x8 tiles.
 for(let j=0;j<2;j++)for(let i=0;i<2;i++){
  let choice=key;
  if(key==="asphalt"&&variant===2&&i===j)choice="crack";
  if(key==="asphalt"&&variant===1&&i===1&&j===0)choice="grate";
  if(key==="ballast"&&variant===1&&i===j)choice="weeds";
  if(key==="concrete"&&variant===2&&j===1)choice="brick";
  pattern(ctx,choice,i*8,j*8,p,(variant+i+j)%2);
 }
 if(key==="fence"){rect(ctx,0,0,16,2,p[0]);rect(ctx,0,7,16,2,p[3]);rect(ctx,0,12,16,2,p[0]);}
 if(key==="track"||key==="sleepers"){
  rect(ctx,0,3,16,2,p[3]);rect(ctx,0,11,16,2,p[3]);
  if(variant%2===0){rect(ctx,5,0,2,16,p[0]);rect(ctx,13,0,2,16,p[0]);}
 }
 if(key==="wagon"){
  rect(ctx,1,1,14,14,p[0]);rect(ctx,2,2,12,11,p[2]);
  rect(ctx,3,4,10,2,p[3]);rect(ctx,3,9,10,1,p[1]);
  if(variant%2===0){rect(ctx,2,13,3,2,p[0]);rect(ctx,10,13,3,2,p[0]);}
 }
 if(key==="brick"&&z===2){
  if(variant%2===0){rect(ctx,3,5,10,7,p[0]);rect(ctx,4,6,8,5,p[2]);rect(ctx,4,6,3,3,p[3]);}
 }
 if(key==="roof"){rect(ctx,0,0,16,3,p[0]);rect(ctx,2,3,12,10,p[1]);rect(ctx,4,5,8,6,p[2]);}
 if(key==="grate"){rect(ctx,0,0,16,16,p[1]);rect(ctx,2,3,12,10,p[0]);for(let i=4;i<13;i+=3)rect(ctx,i,4,1,8,p[2]);}
 if(key==="puddle"){rect(ctx,1,6,14,5,p[1]);rect(ctx,3,7,10,2,p[2]);rect(ctx,6,7,4,1,p[3]);}
 cache.set(id,off);return off;
}
function ground(c,z,x,y,screenX,screenY,blocked){
 const key=kind(z,x,y,blocked),variant=((x*23+y*13)%5+5)%5;
 c.drawImage(builtTile(z,key,variant),screenX,screenY);
 // Reuse original urban cut-outs supplied by the user on sparse tiles.
 // Decorative overlays do not modify blocking and cannot interrupt the route.
 if(ready()&&key!=="wagon"&&key!=="roof"&&key!=="wall"&&key!=="column"&&key!=="track"&&key!=="sleepers"&&key!=="fence"&&
    ((x*17+y*23+z*7)%13===0)){
   const which=Math.abs(x*3+y*5+z)%12;
   sprite(c,which*24,384+z*24,24,24,screenX,screenY,16,16);
 }
 // Details constrained to same 4-colour tile palette.
 const p=P[z];
 if((x*3+y*11+z)%31===0&&key==="asphalt"){
   rect(c,screenX+8,screenY+7,4,1,p[3]);rect(c,screenX+7,screenY+8,3,1,p[0]);
 }
 if(key==="shutter"){rect(c,screenX+2,screenY+3,12,1,p[0]);rect(c,screenX+2,screenY+12,12,2,p[0]);}
 if(z===1&&y===11&&x%8===3){rect(c,screenX+1,screenY+11,14,2,p[0]);rect(c,screenX+5,screenY+12,7,2,p[2]);}
 if(z===2&&y===11&&x%5===1){rect(c,screenX+2,screenY+2,12,4,p[3]);rect(c,screenX+3,screenY+5,10,2,p[1]);}
}
const PERSON={
 player:["000011110000","000133331000","001333333100","001122221100","001122221100","001133331100","000133331000","000011110000","000122221000","001122221100","001122221100","001122221100","001122221100","000111111000","000110011000","001110011100"],
 guide:["000011110000","000133331000","001133331100","001122221100","001122221100","000122221000","000111111000","000011110000","000133331000","001133331100","001133331100","001133331100","000133331000","000111111000","000110011000","001110011100"],
 npc:["000011110000","000133331000","001133331100","001122221100","001122221100","000122221000","000111111000","000011110000","000122221000","001122221100","001122221100","001122221100","000122221000","000111111000","000110011000","001110011100"]
};
const HUMAN_P=[
 ["", "#293c3c","#dfc69a","#536e70","#af8564"],
 ["", "#293b48","#ebd0a9","#567c70","#b3be95"],
 ["", "#333c45","#d2b99e","#77758b","#b2a383"]
];
function bitmap(c,rows,x,y,p,scale=1,flip=false){
 const width=rows[0].length;
 for(let r=0;r<rows.length;r++){
  for(let v=0;v<width;v++){
   const ch=Number(rows[r][flip?width-1-v:v]);
   if(ch&&p[ch])rect(c,x+v*scale,y+r*scale,scale,scale,p[ch]);
  }
 }
}
function person(c,x,y,who="player",facing="down",walk=0){
 const role=who==="player"?"player":who==="guide"?"guide":who==="gialluca"?"gialluca":"npc";
 if(ready()&&(role==="player"||role==="guide"||role==="gialluca")){
  const ri=CHAR[role],di=DIR[facing]===undefined?0:DIR[facing];
  const frame=walk?Math.floor(walk*1.4)%3:1;
  if(sprite(c,frame*24,(ri*4+di)*32,24,32,x-8,y-24,16,24))return;
 }
 let p=HUMAN_P[role==="player"?0:role==="guide"?1:2],rows=PERSON[role]||PERSON.npc;
 const bounce=walk?Math.floor(Math.sin(walk)*1):0;
 if(walk){
  const walkFrame=Math.floor(walk*1.4)%4;
  if(walkFrame===1||walkFrame===3){
   rows=rows.slice();
   rows[14]=walkFrame===1?"000110001100":"001100011000";
   rows[15]=walkFrame===1?"001110000110":"000110001110";
  }
 }
 if(facing==="up"){
  rows=rows.map((row,i)=>i>=3&&i<=5?row.replace(/2/g,"3"):row);
 }
 if(facing==="left"||facing==="right"){
  rows=rows.map((row,i)=>i===4?"001122211000":row);
 }
 bitmap(c,rows,Math.round(x)-6,Math.round(y)-16+bounce,p,1,facing==="left");
}
const MON={
 starter:[
 "0000001111000000","0000112222110000","0001222222221000","0012221112222100","0122213311222210","0122131133122210","0122211111222210","0012222222222100",
 "0001223333221000","0001222332221000","0000122222210000","0000112222110000","0001112112111000","0011112112111100","0000011001100000","0000111001110000"],
 n01:[
 "0001110000111000","0012221001222100","0112222112222210","0122222222222210","0122211221122210","0122213213122210","0122222112222210","0012222222222100",
 "0001222332221000","0000122222210000","0011122222211100","0122212222122210","0122221221222210","0011122222211100","0000111000110000","0000000000111110"],
 n02:[
 "0000011110000000","0000122221000000","0001223322100000","0012231132210000","0112211122221000","0122222222222100","0122223222222100","0012233222221000",
 "0012222222221000","0011222222211000","0001122222110000","0000122222100000","0001112112111000","0011212112121100","0000110000110000","0001110000111000"],
 n03:[
 "0000000111000000","0000011222100000","0000112222210000","0001222222221000","0012222222222100","0122221131222210","0122222111222210","0122222222222210",
 "0012222222222100","0001222222221000","0000112222210000","0000011221100000","0000111111000000","0001100000110000","0011000000011000","0000000000000000"]
};
const MON_COL={
 starter:["", "#293e41","#d7ceaa","#7e9c8a","#a88d64"],
 n01:["", "#243d44","#9ea7a0","#c5bf9b","#677d79"],
 n02:["", "#2b3d4d","#a3acb8","#d7d2bb","#657a91"],
 n03:["", "#35404a","#b0b5a7","#e3cfaa","#8e91a5"]
};
function monster(c,id,x,y,scale=1,back=false){
 if(ready()&&MOB[id]!==undefined){
  const size=scale>=3?48:16;
  const index=MOB[id],srcX=index<6?72+(back?56:0):184+(back?56:0);
  const srcY=index<6?index*56:104+(index-6)*56;
  if(sprite(c,srcX,srcY,56,56,x,y,size,size))return;
 }
 const rows=MON[id]||MON.starter,p=MON_COL[id]||MON_COL.starter;
 const altered=back?rows.map((row,i)=>i>=4&&i<=9?row.replace(/3/g,"2"):row):rows;
 bitmap(c,altered,x,y,p,scale,back);
 if(back){const dark=p[1];rect(c,x+scale*5,y+scale*6,scale*6,scale*2,p[3]);rect(c,x+scale*7,y+scale*11,scale*2,scale,p[1]);}
}
function symbol(c,x,y,pale=false){
 const p=pale?P[1]:P[0];
 rect(c,x+3,y,10,2,p[0]);rect(c,x+5,y+2,6,2,p[0]);
 rect(c,x+7,y+4,2,3,p[0]);rect(c,x+7,y+9,2,2,p[0]);
 rect(c,x+7,y+12,2,2,p[0]);
 rect(c,x+4,y+2,5,2,p[3]);
}
function text(c,s,x,y,p=P[0][0],size=7){
 c.font="bold "+size+"px monospace";c.fillStyle=p;c.textAlign="left";c.textBaseline="top";
 c.fillText(String(s),Math.floor(x),Math.floor(y));
}
function frame(c,x,y,w,h,theme=0){
 const p=P[theme];rect(c,x,y,w,h,p[0]);rect(c,x+2,y+2,w-4,h-4,p[3]);
 rect(c,x+3,y+3,w-6,1,p[1]);rect(c,x+3,y+h-4,w-6,1,p[1]);
}
function bar(c,x,y,w,pct,z=0){const p=P[z];rect(c,x,y,w,5,p[0]);rect(c,x+1,y+1,w-2,3,p[1]);rect(c,x+1,y+1,Math.floor((w-2)*Math.max(0,Math.min(1,pct))),3,pct<.28?p[0]:p[2]);}
function battle(c,b,z,lines){
 const p=P[z];rect(c,0,0,W,H,p[3]);
 // Separate 4-colour environmental backdrops for the station, bridge and market.
 if(z===0){
  rect(c,0,0,W,54,p[2]);
  for(let x=0;x<W;x+=24){
   rect(c,x,0,2,54,p[1]);rect(c,x+4,15,19,2,p[1]);
   rect(c,x+6,5,11,8,p[3]);rect(c,x+8,8,7,3,p[1]);
  }
  rect(c,0,52,W,4,p[0]);rect(c,0,57,W,3,p[3]);
  for(let x=0;x<W;x+=16){rect(c,x+5,61,3,39,p[1]);rect(c,x+7,64,2,35,p[3]);}
 }else if(z===1){
  rect(c,0,0,W,55,p[1]);rect(c,0,0,W,12,p[0]);
  for(let x=0;x<W;x+=33){
   rect(c,x+6,12,9,75,p[0]);rect(c,x+8,12,5,70,p[2]);
   rect(c,x+8,30,5,3,p[1]);rect(c,x+8,49,5,3,p[1]);
  }
  rect(c,0,54,W,4,p[0]);rect(c,0,58,W,2,p[3]);
  for(let x=0;x<W;x+=22){rect(c,x+4,67,11,2,p[1]);rect(c,x+8,72,4,1,p[3]);}
 }else{
  rect(c,0,0,W,58,p[2]);rect(c,0,0,W,4,p[0]);
  for(let x=0;x<W;x+=29){
   rect(c,x,4,27,49,p[1]);rect(c,x+2,5,23,46,p[2]);
   rect(c,x+4,13,18,15,p[0]);rect(c,x+6,15,14,11,p[3]);
   rect(c,x+3,35,21,4,p[0]);
   for(let i=0;i<4;i++)rect(c,x+3,39+i*3,21,1,p[1]);
  }
  rect(c,0,53,W,5,p[3]);rect(c,0,58,W,3,p[0]);
 }
 rect(c,0,64,W,2,p[0]);rect(c,0,66,W,46,p[2]);
 for(let x=0;x<W;x+=16){rect(c,x+2,71,7,1,p[1]);rect(c,x+9,93,5,1,p[1]);}
 rect(c,100,66,52,4,p[1]);rect(c,10,99,52,4,p[1]);
 monster(c,b.enemy.id,104,20,3,false);
 monster(c,b.player.id,14,55,3,true);
 frame(c,2,5,93,30,z);
 text(c,b.enemy.name.toUpperCase().slice(0,17),6,9,p[0],7);
 bar(c,7,19,68,b.enemy.hp/b.enemy.maxHp,z);
 text(c,"PS "+b.enemy.hp+"/"+b.enemy.maxHp,7,26,p[0],6);
 frame(c,74,73,84,37,z);
 text(c,b.player.name.toUpperCase().slice(0,14),79,76,p[0],6);
 bar(c,79,85,72,b.player.hp/b.player.maxHp,z);
 text(c,"PS "+b.player.hp+" F "+b.player.fiato+"/"+b.player.maxFiato,79,92,p[0],6);
 if(Object.keys(b.player.status).length)text(c,Object.keys(b.player.status)[0].toUpperCase().slice(0,12),79,100,p[0],5);
 frame(c,1,113,158,30,z);
 const msg=Array.isArray(lines)?lines.join(" "):String(lines||"SCEGLI UNA MOSSA");
 const words=msg.toUpperCase().split(/\s+/);let row="",linesShown=[];
 for(const word of words){
  if((row+" "+word).trim().length>31){linesShown.push(row);row=word;}
  else row=(row+" "+word).trim();
 }
 if(row)linesShown.push(row);
 for(let i=0;i<Math.min(3,linesShown.length);i++)text(c,linesShown[i],5,116+i*8,p[0],6);
}

function introLake(c,phase=0,chapter=0){
 const p=P[0];rect(c,0,0,W,H,p[2]);
 // 16x16 lawn with 8x8 weed repetitions, winding stony shore.
 for(let y=0;y<H;y+=16)for(let x=0;x<W;x+=16){
  c.drawImage(builtTile(0,((x+y/2)%48===0)?"weeds":"grass",((x+y)/16)%3),x,y);
 }
 // Dither-free stepped lake shoreline.
 for(let y=13;y<95;y++){
  let delta=Math.abs(53-y);
  const left=14+Math.floor(delta*.48),right=147-Math.floor(delta*.65);
  rect(c,left-3,y,right-left+6,1,p[0]);
  rect(c,left,y,right-left,1,p[1]);
  if(y%9===0){rect(c,left+19,y,17,1,p[3]);rect(c,right-35,y,13,1,p[2]);}
 }
 // Stone steps, small bench, sign and two pixel pedestrians.
 rect(c,9,98,143,3,p[0]);rect(c,9,101,143,7,p[3]);rect(c,12,105,133,1,p[1]);
 rect(c,117,96,2,20,p[0]);rect(c,120,96,2,20,p[0]);rect(c,113,93,16,4,p[2]);
 rect(c,111,89,20,3,p[0]);
 rect(c,133,82,2,23,p[0]);rect(c,129,79,11,7,p[3]);rect(c,130,80,9,1,p[0]);
 person(c,33,105,"player","up");
 // Professor Vincenzo's real front / pointing portraits, not a placeholder.
 if(!sprite(c,184+(chapter%3===0?0:72),0,72,94,93,4,62,76)){
   person(c,108,92,"guide","down");
 }
 frame(c,42,6,77,15,0);
 text(c,"LAGO DEI NINOMON",46,11,p[0],7);
}

root.NINOMON_RETRO={W,H,T,P,A,ground,person,monster,symbol,text,frame,bar,battle,kind,introLake,sprite,ready,legacyMobIndices:MOB};
})(window);