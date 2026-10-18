import {drawCityPlayer} from './city-art.mjs?v=125';
import {drawPedestrianSprite} from './pedestrian-sprites.mjs?v=001';
import {WALK_SPEED,RUN_SPEED} from './driving-controls.mjs?v=094';

const WALKABLE=new Set(['primary','secondary','tertiary','unclassified','residential','living_street','service','pedestrian','footway','path','steps']);

function projectPoint(point,a,b){
 const dx=b[0]-a[0],dy=b[1]-a[1],len=dx*dx+dy*dy;
 const t=len?Math.max(0,Math.min(1,((point.x-a[0])*dx+(point.y-a[1])*dy)/len)):0;
 return {x:a[0]+dx*t,y:a[1]+dy*t,dx,dy};
}

export function resolveBankEntrances(pois,roads,isWalkable,roadWidth){
 const banks=[];
 for(const poi of pois||[]){
  if(poi.k!=='bank'||!Array.isArray(poi.p)||poi.p.length<2)continue;
  const origin={x:poi.p[0],y:poi.p[1]};let best=null;
  for(const road of roads||[]){
   if(!WALKABLE.has(road.t)||!Array.isArray(road.p)||road.p.length<4)continue;
   const width=roadWidth(road);
   for(let i=2;i<road.p.length;i+=2){
    const q=projectPoint(origin,[road.p[i-2],road.p[i-1]],[road.p[i],road.p[i+1]]);
    const len=Math.hypot(q.dx,q.dy)||1,nx=-q.dy/len,ny=q.dx/len;
    for(const offset of [0,width/2+0.9,width/2+2.2,width/2+3.8]){
     for(const sign of offset===0?[1]:[1,-1]){
      const x=q.x+nx*offset*sign,y=q.y+ny*offset*sign;
      if(!isWalkable(x,y))continue;
      const distance=Math.hypot(x-origin.x,y-origin.y);
      if(distance>24)continue;
      const score=distance+(offset===0?1.5:0);
      if(!best||score<best.score)best={x,y,score,distance,roadName:road.n||''};
     }
    }
   }
  }
  if(best)banks.push({...poi,x:best.x,y:best.y,roadName:best.roadName});
 }
 return banks;
}

export function nearestBankEntrance(entrances,point,radius=9){
 let best=null;
 for(const bank of entrances||[]){
  const distance=Math.hypot(bank.x-point.x,bank.y-point.y);
  if(distance<=radius&&(!best||distance<best.distance))best={bank,distance};
 }
 return best;
}

export function drawBankEntrance(ctx,bank,clock){
 const pulse=.8+.2*Math.sin(clock*4.5),r=2.05*pulse;
 ctx.save();
 ctx.globalAlpha=.22+.1*pulse;ctx.fillStyle='#ffe36f';ctx.beginPath();ctx.arc(bank.x,bank.y,r*2.1,0,Math.PI*2);ctx.fill();
 ctx.globalAlpha=1;ctx.lineWidth=.58;ctx.strokeStyle='#fff2a0';ctx.beginPath();ctx.arc(bank.x,bank.y,r,0,Math.PI*2);ctx.stroke();
 ctx.fillStyle='#f8d867';ctx.beginPath();ctx.arc(bank.x,bank.y,.48,0,Math.PI*2);ctx.fill();
 ctx.font='bold 2.15px monospace';ctx.textAlign='center';ctx.fillStyle='#18251e';ctx.fillRect(bank.x-7.2,bank.y-6.8,14.4,3.1);
 ctx.strokeStyle='#f8d867';ctx.lineWidth=.2;ctx.strokeRect(bank.x-7.2,bank.y-6.8,14.4,3.1);
 ctx.fillStyle='#fff0b0';ctx.fillText('BANCA · E',bank.x,bank.y-4.6);
 ctx.restore();
}


// Bank interiors use the *same world units, top-down camera conventions and
// player renderer* as the street. All furniture below is illustrated arcade art,
// not a claim about the actual floor plan of any real bank in Melito.

export const BANK_ROOM=Object.freeze({width:100,height:64});
const clamp=(n,min,max)=>Math.min(max,Math.max(min,n));

// Scale a small physical room uniformly rather than drawing an unrelated
// full-screen Zelda-like scene. Preserve the Canvas device scale from game.mjs.
export function bankInteriorViewport(width,height){
 const scale=Math.max(.1,Math.min((width-20)/(BANK_ROOM.width+16),(height-20)/(BANK_ROOM.height+14)));
 return {x:(width-BANK_ROOM.width*scale)/2,y:(height-BANK_ROOM.height*scale)/2,
  scale,width:BANK_ROOM.width,height:BANK_ROOM.height};
}

function intersectsFurniture(x,y){
 // Character radius of ~1 world unit; counters, ATM and chairs are solid.
 const furniture=[
  [19,18,81,28],  // three service counters / glazed partition
  [6,25,22,44],   // ATM enclosure on the left wall
  [73,41,94,51],  // chairs along the right wall
 ];
 return furniture.some(([x0,y0,x1,y1])=>x+1.1>x0&&x-1.1<x1&&y+1.1>y0&&y-1.1<y1);
}
export function bankInteriorWalkable(nx,ny){
 if(!Number.isFinite(nx)||!Number.isFinite(ny))return false;
 const x=nx*BANK_ROOM.width,y=ny*BANK_ROOM.height;
 return x>=5&&x<=95&&y>=28.5&&y<=58&&!intersectsFurniture(x,y);
}
export function stepBankInteriorPlayer(player,axes,running,dt){
 const ax=Number(axes?.x)||0,ay=Number(axes?.y)||0,mag=Math.hypot(ax,ay);
 player.moving=mag>.08;
 if(!player.moving)return player;
 player.a=Math.atan2(ay,ax);
 // Walk and run at exactly the same physical world-units/second as outside.
 // X and Y normalizations differ because this room is 100×64, not a square.
 const distance=(running?RUN_SPEED:WALK_SPEED)*Math.min(mag,1)*Math.min(Math.max(dt,0),.05);
 const dx=ax/mag*distance/BANK_ROOM.width,dy=ay/mag*distance/BANK_ROOM.height;
 // Separate X/Y checks allow sliding along counters instead of walking
 // through furniture or becoming stuck when approaching at an angle.
 if(bankInteriorWalkable(player.x+dx,player.y+dy)){player.x+=dx;player.y+=dy;}
 else{
  if(bankInteriorWalkable(player.x+dx,player.y))player.x+=dx;
  if(bankInteriorWalkable(player.x,player.y+dy))player.y+=dy;
 }
 return player;
}
function block(ctx,x,y,w,h,top,face='#35423e',depth=1.4){
 ctx.fillStyle='#162220a6';ctx.fillRect(x+.75,y+1.1+depth,w,h);
 ctx.fillStyle=face;ctx.fillRect(x,y+depth,w,h);
 ctx.fillStyle=top;ctx.fillRect(x,y,w,h);
}
function wall(ctx,x,y,w,h){
 ctx.fillStyle='#111b1c';ctx.fillRect(x+1,y+1,w,h);
 ctx.fillStyle='#625c50';ctx.fillRect(x,y,w,h);
 ctx.fillStyle='#a49c89';ctx.fillRect(x,y,w,1.1);
 ctx.fillStyle='#343b36';ctx.fillRect(x,y+h-1,w,1);
}
function banker(ctx,x,y,clock,kind){
 // The same pedon sprite atlas used by the street's human NPCs.
 // Static at the teller window; no invented "bank manager" identity.
 if(drawPedestrianSprite(ctx,x,y,Math.PI/2,kind,clock,false,.8,kind*17))return;
 ctx.fillStyle='#252e33';ctx.fillRect(x-1.1,y-1,2.2,2.5);
 ctx.fillStyle='#caac88';ctx.fillRect(x-.75,y-2.4,1.5,1.3);
}
function stanchion(ctx,x,y){
 ctx.fillStyle='#1b2727a8';ctx.fillRect(x+.4,y+.5,2.4,.9);
 ctx.fillStyle='#9da19b';ctx.fillRect(x-.36,y-.6,.72,2);
 ctx.fillStyle='#d3c6a5';ctx.fillRect(x-.7,y-1,1.4,.75);
}
function drawFloor(ctx){
 ctx.fillStyle='#777c72';ctx.fillRect(2,3,96,57);
 // Reused architectural street palette: paved stone and concrete, not
 // shiny fantasy checkerboard tiles. Grout is intentionally subtle.
 for(let y=4;y<59;y+=4)for(let x=3;x<98;x+=5){
  const seed=(x*13+y*7)%11;
  ctx.fillStyle=seed<3?'#8d8e81':seed<7?'#898b7e':'#85877b';
  ctx.fillRect(x,y,4.75,3.75);
  if(seed===0){ctx.fillStyle='#99978a';ctx.fillRect(x+.4,y+.4,1.6,.35);}
 }
 ctx.fillStyle='#b6a47d';ctx.fillRect(4,6,92,.3);
 ctx.fillStyle='#565c52';ctx.fillRect(4,57,92,.65);
}
function drawArchitecture(ctx,clock){
 drawFloor(ctx);
 // GTA-style cutaway masonry: shallow exterior-style walls with thickness,
 // edges and shadows; the player looks DOWN at the whole room.
 wall(ctx,0,0,100,4);
 wall(ctx,0,3,3,61);
 wall(ctx,97,3,3,61);
 wall(ctx,0,60,44,4);wall(ctx,56,60,44,4);
 ctx.fillStyle='#344640';ctx.fillRect(44,59.3,12,4.7);
 ctx.fillStyle='#d6b982';ctx.fillRect(44,59,12,.6);
 ctx.fillStyle='#b0c6ba';ctx.fillRect(44,63,12,.6);
 for(const xx of [5,94]){
  ctx.fillStyle='#b5a586';ctx.fillRect(xx,4,1,55);
  ctx.fillStyle='#454d43';ctx.fillRect(xx+1,5,.7,53);
 }
 // Warm stone trim / pilasters, unambiguously banking rather than dungeon.
 for(const x of [8,90]){
  block(ctx,x,5,2.8,5,'#bbb096','#817965',.9);
  ctx.fillStyle='#4d5750';ctx.fillRect(x+.6,6,.8,3);
 }
 ctx.fillStyle='#a6a091';ctx.fillRect(3,4,94,.9);
 ctx.fillStyle='#444d49';ctx.fillRect(3,7,94,.6);

 // Teller windows and counters read as 2.5D fixtures from above.
 block(ctx,19,18,62,7,'#977654','#594737',2.6);
 ctx.fillStyle='#b4aa91';ctx.fillRect(20,18,60,1);
 ctx.fillStyle='#344e50';ctx.fillRect(21,20,58,2.7);
 ctx.fillStyle='#b4cecc';ctx.fillRect(21,20,58,.35);
 for(let i=0;i<3;i++){
  const xx=30+i*20;
  banker(ctx,xx,15.3,clock,i);
  ctx.fillStyle='#203337';ctx.fillRect(xx-4.8,19.2,9.6,2.5);
  ctx.fillStyle='#829a9b';ctx.fillRect(xx-3.4,19.4,6.8,.45);
  ctx.fillStyle='#d5c6a7';ctx.fillRect(xx-4,24.2,8,.6);
  ctx.fillStyle='#c7b78e';ctx.fillRect(xx-3.6,27.1,7.2,.55);
 }
 for(const xx of [40,60]){
  ctx.fillStyle='#d1c5a4';ctx.fillRect(xx-1,18,2,7);
  ctx.fillStyle='#3e4a47';ctx.fillRect(xx-.25,18,.5,7);
 }
 // Queue guidance: lower brass posts, muted red rope, as at street scale.
 for(const yy of [34,41]){
  stanchion(ctx,35,yy);stanchion(ctx,65,yy);
  ctx.strokeStyle='#885b4c';ctx.lineWidth=.55;
  ctx.beginPath();ctx.moveTo(36,yy);ctx.lineTo(64,yy);ctx.stroke();
 }
 ctx.fillStyle='#e2d1a4';ctx.fillRect(46.5,30.5,7,.6);
 ctx.fillStyle='#5e6b62';ctx.fillRect(46,31.1,8,2);
 ctx.fillStyle='#c8b887';ctx.fillRect(47,31.5,6,.5);
 // ATM: metal box set into left wall, not a freestanding fantasy chest.
 block(ctx,6,25,16,19,'#5f6f6b','#354746',1.8);
 ctx.fillStyle='#a6b8ad';ctx.fillRect(9,28,10,8.5);
 ctx.fillStyle='#274c56';ctx.fillRect(10,29,8,5);
 ctx.fillStyle='#75abae';ctx.fillRect(11,30,3.5,.6);
 ctx.fillStyle='#dfd5b6';ctx.fillRect(11,36.2,6,1);
 for(let i=0;i<3;i++){ctx.fillStyle='#b7b2a0';ctx.fillRect(11+i*1.8,39,1,1);}
 ctx.fillStyle='#283b38';ctx.font='bold 2.5px monospace';ctx.textAlign='center';ctx.fillText('ATM',14,27.5);

 // Seats along the wall leave an unobstructed, navigable central aisle.
 for(let i=0;i<3;i++){
  const sx=74+i*6;
  block(ctx,sx,42,5.1,7,'#4a625e','#303b3c',1);
  ctx.fillStyle='#b9a378';ctx.fillRect(sx+.6,42.8,3.9,.6);
  ctx.fillStyle='#263431';ctx.fillRect(sx+.5,47.5,4,.9);
 }
 // Brochure display and two wall lamps.
 block(ctx,84,11,9,12,'#a58c69','#585e55',1.1);
 for(let i=0;i<3;i++){ctx.fillStyle=['#e6d9b6','#94aba0','#c48e78'][i];ctx.fillRect(85.8,13+i*3,5.5,2);}
 for(const xx of [13,87]){
  ctx.fillStyle='#f1c986';ctx.fillRect(xx,7,2.5,1);
  ctx.fillStyle='#9f8c66';ctx.fillRect(xx+.5,8,1.5,.6);
 }
 // Directional markings align with the bottom entrance.
 ctx.fillStyle='#c2bca6';ctx.fillRect(48,51,4,1);
 ctx.fillRect(49.3,50,1.4,1.2);
 ctx.fillStyle='#e0c681';ctx.fillRect(44.8,58.5,10.4,.9);
}
export function drawBankInterior(ctx,width,height,clock,bank,player){
 ctx.save();
 // Caller has already set the compact pixel-art device transform.
 ctx.imageSmoothingEnabled=false;
 ctx.fillStyle='#182520';ctx.fillRect(0,0,width,height);
 const layout=bankInteriorViewport(width,height);
 ctx.translate(layout.x,layout.y);ctx.scale(layout.scale,layout.scale);
 drawArchitecture(ctx,clock);
 const local=player||{x:.5,y:.82,a:-Math.PI/2,moving:false};
 drawCityPlayer(ctx,{x:local.x*BANK_ROOM.width,y:local.y*BANK_ROOM.height,
  a:local.a??-Math.PI/2,car:-1},clock,!!local.moving);
 ctx.restore();
 // Screen-space UI only (world is scaled above), same palette as street HUD.
 ctx.save();
 ctx.fillStyle='#111f1ce8';ctx.fillRect(width/2-Math.min(235,width*.42),6,Math.min(470,width*.84),27);
 ctx.strokeStyle='#a99b73';ctx.lineWidth=1;ctx.strokeRect(width/2-Math.min(235,width*.42),6,Math.min(470,width*.84),27);
 ctx.fillStyle='#f2d18a';ctx.textAlign='center';ctx.font='bold 12px monospace';
 ctx.fillText(String(bank?.n||'BANCA').toUpperCase().slice(0,36),width/2,18);
 ctx.fillStyle='#c0c9b7';ctx.font='9px monospace';
 ctx.fillText('MELITO · INTERNO',width/2,28);
 ctx.fillStyle='#12211ee9';ctx.fillRect(width/2-108,height-29,216,23);
 ctx.fillStyle='#f0d59a';ctx.font='bold 10px monospace';
 ctx.fillText('E / ESCI DALLA BANCA',width/2,height-14);
 ctx.restore();
}
