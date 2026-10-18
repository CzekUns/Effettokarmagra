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

function roundedRect(ctx,x,y,w,h,r){
 ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();
}

export function drawBankInterior(ctx,width,height,clock,bank,player){
 ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.imageSmoothingEnabled=false;
 ctx.fillStyle='#14211c';ctx.fillRect(0,0,width,height);
 const margin=Math.max(18,Math.min(width,height)*.07),x=margin,y=margin+24,w=width-margin*2,h=height-margin*2-44;
 ctx.fillStyle='#887256';ctx.fillRect(x-7,y-7,w+14,h+14);
 ctx.fillStyle='#2a4038';ctx.fillRect(x,y,w,h);
 // Stone floor in a clear, quiet pixel-art palette.
 const tile=Math.max(20,Math.min(36,Math.floor(Math.min(w,h)/12)));
 for(let yy=y;yy<y+h;yy+=tile)for(let xx=x;xx<x+w;xx+=tile){
  ctx.fillStyle=((Math.floor((xx-x)/tile)+Math.floor((yy-y)/tile))%2)?'#b8aa86':'#c8b995';
  ctx.fillRect(xx,yy,tile-1,tile-1);
 }
 // Back wall and gold trim.
 ctx.fillStyle='#263b34';ctx.fillRect(x,y,w,Math.max(28,h*.12));
 ctx.fillStyle='#dfc27c';ctx.fillRect(x,y+Math.max(28,h*.12)-4,w,4);
 ctx.fillStyle='#f2dda5';ctx.font='bold 13px monospace';ctx.textAlign='left';ctx.fillText(bank?.n||'BANCA',x+18,y+21);
 ctx.fillStyle='#a7c1a8';ctx.font='10px monospace';ctx.fillText('SPORTELLI · SERVIZI',x+18,y+Math.max(28,h*.12)-10);
 // Teller counter, queue posts, and secure rear area.
 const counterY=y+h*.35;
 ctx.fillStyle='#71533c';ctx.fillRect(x+w*.16,counterY,w*.68,h*.12);
 ctx.fillStyle='#a57a4d';ctx.fillRect(x+w*.16,counterY,w*.68,Math.max(5,h*.024));
 ctx.fillStyle='#3c4941';ctx.fillRect(x+w*.19,counterY+h*.04,w*.62,h*.065);
 for(let i=0;i<3;i++){
  const cx=x+w*(.29+i*.21);
  ctx.fillStyle='#e7d49e';ctx.fillRect(cx-13,counterY+5,26,3);
  ctx.fillStyle='#d0c29f';ctx.fillRect(cx-8,counterY+h*.16,16,h*.045);
  ctx.fillStyle='#877a5e';ctx.fillRect(cx-9,counterY+h*.205,18,3);
 }
 // Waiting area and a pair of desks.
 const seatY=y+h*.68;
 for(let i=0;i<4;i++){
  const sx=x+w*(.25+i*.17);
  ctx.fillStyle='#41544a';ctx.fillRect(sx-10,seatY,20,8);
  ctx.fillStyle='#d1bd85';ctx.fillRect(sx-9,seatY-3,18,3);
  ctx.fillStyle='#66543d';ctx.fillRect(sx-9,seatY+8,2,5);ctx.fillRect(sx+7,seatY+8,2,5);
 }
 ctx.fillStyle='#755c43';ctx.fillRect(x+w*.73,y+h*.57,w*.17,h*.085);
 ctx.fillStyle='#c0a16c';ctx.fillRect(x+w*.73,y+h*.57,w*.17,4);
 ctx.fillStyle='#42574c';ctx.fillRect(x+w*.77,y+h*.59,w*.09,h*.045);
 ctx.fillStyle='#6b5038';ctx.fillRect(x+w*.08,y+h*.36,w*.045,h*.14);
 ctx.fillStyle='#eccd74';ctx.fillRect(x+w*.08+3,y+h*.36+5,w*.045-6,h*.025);
 ctx.fillStyle='#263b34';ctx.font='bold 9px monospace';ctx.textAlign='center';ctx.fillText('ATM',x+w*.1025,y+h*.36-3);
 // Entrance and player's position are distinct, so the room reads as an interior.
 const doorX=x+w*.5,doorY=y+h-2;
 ctx.fillStyle='#67452e';ctx.fillRect(doorX-17,doorY-12,34,14);
 ctx.fillStyle='#d7b66e';ctx.fillRect(doorX-15,doorY-10,30,10);
 ctx.fillStyle='#4f6d60';ctx.fillRect(doorX-11,doorY-8,22,8);
 const px=x+w*(player?.x??.5),py=y+h*(player?.y??.84);
 ctx.fillStyle='#382c26';ctx.beginPath();ctx.ellipse(px,py+4,6,3,0,0,Math.PI*2);ctx.fill();
 ctx.fillStyle='#b74338';ctx.fillRect(px-4,py-3,8,8);ctx.fillStyle='#e7c49a';ctx.fillRect(px-3,py-8,6,5);
 ctx.fillStyle='#f5dda0';ctx.font='bold 11px monospace';ctx.textAlign='center';
 ctx.fillText((bank?.n||'BANCA').toUpperCase(),width/2,21);
 ctx.fillStyle='#17251fdd';roundedRect(ctx,width/2-94,height-31,188,22,3);
 ctx.fillStyle='#ffe6a6';ctx.font='bold 10px monospace';ctx.fillText('E / TOCCA “ESCI” PER USCIRE',width/2,height-16);
 ctx.restore();
}
