/* GTA Melito 0.3 — landmark marker art and mission guidance.
 * Locations are OSM-derived; all art is an original illustrative overlay. */
const T=Math.PI*2;
const COLORS={meeting:'#ffb462',square:'#c8a3e0',townhall:'#89c1dd',post:'#eebf65',avenue:'#7ec7ae'};
function path(c,x,y){c.beginPath();c.moveTo(x,y);}
function icon(c,item,x,y,size=1){
 c.save();c.translate(x,y);c.scale(size,size);
 const color=COLORS[item.kind]||'#ecd495';
 c.fillStyle='#18231ef0';c.fillRect(-5,-6,10,10);
 c.strokeStyle=color;c.lineWidth=.7;c.strokeRect(-5,-6,10,10);
 if(item.kind==='townhall'){
  c.fillStyle=color;c.fillRect(-3,-1,6,1);c.fillRect(-2.2,0,1,2);c.fillRect(-.4,0,.8,2);c.fillRect(1.3,0,1,2);c.fillRect(-3,2,6,.8);
  path(c,-3,-1.2);c.lineTo(0,-3.6);c.lineTo(3,-1.2);c.closePath();c.fill();
 }else if(item.kind==='post'){
  c.fillStyle=color;c.fillRect(-2.8,-3,5.6,5.3);c.fillStyle='#324247';c.fillRect(-1.7,-1.6,3.4,.5);
  c.strokeStyle='#293538';c.beginPath();c.moveTo(-2.2,-2.6);c.lineTo(0,-.4);c.lineTo(2.2,-2.6);c.stroke();
 }else if(item.kind==='square'){
  c.strokeStyle=color;c.lineWidth=.6;c.strokeRect(-3,-3,6,5);
  c.fillStyle=color;c.fillRect(-.8,-.7,1.6,2.4);
 }else if(item.kind==='avenue'){
  c.strokeStyle=color;c.lineWidth=.9;c.beginPath();c.moveTo(-3,-3);c.lineTo(-3,2);c.moveTo(3,-3);c.lineTo(3,2);c.moveTo(0,-3);c.lineTo(0,2);c.stroke();
 }else{
  c.fillStyle=color;c.fillRect(-2,-3,4,4);c.fillStyle='#192821';c.fillRect(-.75,-1.8,1.5,1.5);
 }
 c.restore();
}
export function drawWorldLandmarks(c,landmarks,focus,bounds,clock,zoom,speaker=''){
 const [x0,y0,x1,y1]=bounds;
 for(const item of landmarks.values()){
  if(item.x<x0||item.x>x1||item.y<y0||item.y>y1)continue;
  const selected=focus?.id===item.id;
  const pulse=.6+.4*Math.sin(clock*4);
  c.save();
  if(selected){
   c.lineWidth=.7;c.strokeStyle='#ffe8a5aa';
   c.beginPath();c.arc(item.x,item.y,9+3*pulse,0,T);c.stroke();
   c.beginPath();c.arc(item.x,item.y,6,0,T);c.strokeStyle='#ffe6a0';c.stroke();
   c.fillStyle='#ffce68';c.beginPath();c.moveTo(item.x,item.y-21);c.lineTo(item.x+3.8,item.y-14);c.lineTo(item.x,item.y-9);c.lineTo(item.x-3.8,item.y-14);c.closePath();c.fill();
  }
  if(zoom>1.15||selected)icon(c,item,item.x,item.y,selected?1.5:1);
  if(selected&&speaker!=='RADIO'){
   // Fictional quest giver; not a representation of a real local resident.
   const bob=Math.sin(clock*3)*.18;
   const x=item.x+8,y=item.y+2+bob;
   c.fillStyle='#10221d';c.fillRect(x-2,y-2,4,5);
   c.fillStyle=speaker==='NICO'?'#d8a146':'#73a8b7';c.fillRect(x-2,y-2,3,3);
   c.fillStyle='#dfa97a';c.fillRect(x+1,y-1,1.7,2);
   c.fillStyle='#333432';c.fillRect(x-2,y+1,1,2);c.fillRect(x+.5,y+1,1,2);
   c.fillStyle='#ffe6a8';c.font='bold 2.8px monospace';c.textAlign='center';c.fillText(speaker,x,y-7);
  }
  if(zoom>1.8||selected){
   const txt=item.name.toUpperCase(),width=Math.min(95,txt.length*2.3+6);
   c.fillStyle=selected?'#f6d78e':'#d0d2b9';
   c.font=selected?'bold 3.8px monospace':'3px monospace';
   c.textAlign='center';c.fillText(txt,item.x,item.y-(selected?25:10),width);
  }
  c.restore();
 }
}
export function drawMinimapLandmarks(c,landmarks,focus,mini){
 for(const item of landmarks.values()){
  const x=mini.ox+item.x*mini.k,y=mini.oy+item.y*mini.k;
  c.fillStyle=COLORS[item.kind]||'#f0e0ba';c.fillRect(x-1.2,y-1.2,2.4,2.4);
 }
 if(focus){
  const x=mini.ox+focus.x*mini.k,y=mini.oy+focus.y*mini.k;
  c.strokeStyle='#ffea92';c.lineWidth=1.7;c.beginPath();c.arc(x,y,6.5,0,T);c.stroke();
  c.fillStyle='#ffd66c';c.fillRect(x-2,y-2,4,4);
 }
}
export function drawBigMap(c,width,height,map,landmarks,player,active){
 const k=Math.min((width-48)/map.projection.width,(height-48)/map.projection.height);
 const ox=(width-map.projection.width*k)/2,oy=(height-map.projection.height*k)/2;
 c.fillStyle='#13221e';c.fillRect(0,0,width,height);
 c.save();c.translate(ox,oy);c.scale(k,k);
 const border=map.border;
 c.beginPath();c.moveTo(border[0],border[1]);for(let i=2;i<border.length;i+=2)c.lineTo(border[i],border[i+1]);c.closePath();
 c.fillStyle='#4b5e50';c.fill();c.lineWidth=14;c.strokeStyle='#e2cba0';c.stroke();
 c.lineCap='round';c.lineJoin='round';
 c.lineWidth=9;c.strokeStyle='#d4d1be';
 for(const road of map.roads){
  if(!road.p||road.p.length<4||['footway','path','steps'].includes(road.t))continue;
  c.beginPath();c.moveTo(road.p[0],road.p[1]);
  for(let j=2;j<road.p.length;j+=2)c.lineTo(road.p[j],road.p[j+1]);c.stroke();
 }
 c.restore();
 c.font='bold 11px monospace';c.textAlign='left';
 for(const item of landmarks.values()){
  const x=ox+item.x*k,y=oy+item.y*k;
  const highlighted=active?.id===item.id;
  c.fillStyle=highlighted?'#ffdf75':COLORS[item.kind];c.beginPath();c.arc(x,y,highlighted?6:3.5,0,T);c.fill();
  c.fillStyle='#081914db';const label=item.name.replace('Municipio di Melito di Napoli','MUNICIPIO').replace('Ufficio Postale Melito','POSTE');
  const w=Math.min(200,label.length*6+11),align=x<width*.6?1:-1,tx=align===1?x+7:x-w-7,ty=y-18;
  c.fillRect(tx,ty,w,17);c.strokeStyle=highlighted?'#e2c76b':'#8eab98';c.lineWidth=.7;c.strokeRect(tx,ty,w,17);
  c.fillStyle='#fce8c2';c.fillText(label.slice(0,28).toUpperCase(),tx+5,ty+12,w-9);
 }
 const px=ox+player.x*k,py=oy+player.y*k;
 c.fillStyle='#fff';c.strokeStyle='#333';c.lineWidth=1.6;c.beginPath();c.arc(px,py,5,0,T);c.fill();c.stroke();
 c.fillStyle='#e9c77d';c.font='bold 11px monospace';c.fillText('● TU SEI QUI',Math.min(width-130,px+8),Math.max(16,py-9));
}
