/* Layered street renderer. Reuses the supplied art; code-native props and human
   sprites have fixed palettes, hard pixels and shared collision footprints. */
(function(root){
'use strict';
const R=root.NINOMON_RETRO,M=root.NINOMON_WORLD,T=32;
const ink='#26373c',light='#e1d3aa';
const box=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));};
function label(c,s,x,y,color=light,size=10){c.font='bold '+size+'px monospace';c.textBaseline='top';c.textAlign='left';c.fillStyle=color;c.fillText(s,x,y);}
const surfaces=[{asphalt:4,concrete:0,ballast:5,paver:0,puddle:22},{asphalt:8,concrete:0,ballast:6,paver:0,puddle:4},{asphalt:0,concrete:17,ballast:14,paver:6,puddle:10}];
function ground(c,z,x,y,sx,sy){
 const key=M.ground(z,x,y),theme=M.zones[z].theme,p=R.P[theme];
 c.imageSmoothingEnabled=false;
 if(key==='boundary'){
  box(c,sx,sy,T,T,ink);box(c,sx+2,sy+2,28,12,p[2]);box(c,sx+2,sy+16,28,13,p[1]);
  box(c,sx+15,sy+2,2,12,p[1]);box(c,sx+5,sy+16,2,13,p[2]);return;
 }
 const base=key==='track'?'ballast':key;
 box(c,sx,sy,T,T,base==='asphalt'?p[1]:p[3]);
 if(R.floorV2Ready()){
  let index=surfaces[theme][base]??surfaces[theme].asphalt;
  // Sparse wear uses the same material; edges and rails are drawn continuously.
  if(base==='asphalt'&&(x*7+y*13)%29===0)index=theme===0?22:theme===1?10:1;
  c.drawImage(R.floorV2,index*T,theme*T,T,T,sx,sy,T,T);
 }
 if(key==='grass'){
  box(c,sx,sy,T,T,'#7c9065');for(let n=0;n<5;n++){const dx=(n*13+x*3)%29,dy=(n*7+y*5)%28;box(c,sx+dx,sy+dy,1,4,'#516e53');box(c,sx+dx+1,sy+dy+1,2,1,'#b0b781');}
 }
 if(key==='track'){
  for(let dx=2;dx<T;dx+=8){box(c,sx+dx,sy+2,4,28,'#564b3c');box(c,sx+dx,sy+3,1,26,'#917454');}
  for(const dy of [7,23]){box(c,sx,sy+dy,T,4,ink);box(c,sx,sy+dy,T,1,'#b6b4a1');}
 }
 if(key==='concrete'||key==='paver'){
  if(y%2===0)box(c,sx,sy,T,1,p[2]);
  if(x%2===0)box(c,sx,sy,1,T,p[2]);
 }
 // Curbs follow the adjacency of the actual walkable surface.
 if((key==='concrete'||key==='paver')&&M.ground(z,x,y+1)==='asphalt'){
  box(c,sx,sy+26,T,4,light);box(c,sx,sy+30,T,2,ink);
 }
 if((key==='concrete'||key==='paver')&&M.ground(z,x,y-1)==='asphalt'){
  box(c,sx,sy,T,3,ink);box(c,sx,sy+3,T,3,light);
 }
 if(z===2&&y===14&&x>1&&x<33&&x%4<2)box(c,sx+2,sy+15,28,2,'#baa981');
 if(z===2&&(x===16||x===17)&&y>=12&&y<=17)box(c,sx+5,sy+7,22,9,'#c8c5a7');
 if(M.portal(z,x,y)){
  box(c,sx,sy,T,T,p[1]);
  if(y===16&&(x===0||x===34)){label(c,x===0?'<':'>',sx+8,sy+6,light,21);}
  if(x===16&&(y===0||y===23))label(c,y===0?'↑':'↓',sx+8,sy+6,light,21);
 }
}
const objectCache=new Map();
function graffiti(c,s,x,y,w,color='#b5bf8a'){
 c.save();c.beginPath();c.rect(x,y,w,25);c.clip();
 label(c,s,x+2,y+4,ink,19);label(c,s,x,y,color,19);
 box(c,x+3,y+21,Math.min(w-8,s.length*8),2,color);
 for(let i=0;i<3;i++)box(c,x+10+i*21,y+19,2,5+i%2,color);
 c.restore();
}
function makeStructure(s,z){
 const over=s.type==='pillar'?3:s.type==='lamp'?2:s.type==='tree'?1:0;
 const canvas=document.createElement('canvas');canvas.width=s.w*T+8;canvas.height=(s.h+over)*T+8;
 const c=canvas.getContext('2d'),w=s.w*T,h=s.h*T,top=over*T,p=R.P[M.zones[z].theme];
 c.imageSmoothingEnabled=false;
 box(c,4,top+4,w,h,'#354340');
 if(s.type==='shop'||s.type==='kiosk'||s.type==='shelter'||s.type==='asset'){
  const roof=s.type==='shop'?Math.min(50,Math.floor(h*.22)):20,wall=s.color||p[3],a=s.awning||'#766b60';
  box(c,0,0,w,h,ink);box(c,3,3,w-6,roof-4,'#5b6460');
  for(let yy=8;yy<roof;yy+=9){box(c,6,yy,w-12,2,'#7d8270');box(c,9,yy+3,w-18,1,'#485750');}
  box(c,3,roof,w-6,h-roof-3,wall);
  box(c,7,roof+5,w-14,19,ink);label(c,s.label,12,roof+10,light,s.w>5?11:9);
  if(s.type==='shop'&&h>140){
   for(let xx=13;xx<w-20;xx+=46){
    box(c,xx,roof+32,29,32,ink);box(c,xx+3,roof+35,23,24,'#b7c9be');
    box(c,xx+14,roof+35,2,24,'#566e71');box(c,xx+3,roof+47,23,2,'#566e71');
    box(c,xx-3,roof+61,35,4,light);box(c,xx-2,roof+68,33,3,ink);
    for(let k=0;k<4;k++)box(c,xx+k*9,roof+60,2,10,ink);
   }
  }
  const shutterY=h-51;
  for(let xx=10;xx<w-20;xx+=53){
   box(c,xx,shutterY,42,45,ink);box(c,xx+3,shutterY+3,36,39,'#858e82');
   for(let yy=shutterY+5;yy<h-9;yy+=5)box(c,xx+3,yy,36,1,'#4e6460');
   box(c,xx+17,h-14,10,2,ink);
  }
  for(let xx=5;xx<w-5;xx+=12)box(c,xx,shutterY-8,Math.min(12,w-5-xx),12,(xx-5)%24?a:light);
  box(c,4,h-5,w-8,4,'#646c60');
  if(s.w>=6)graffiti(c,'UNS',w-73,h-34,66,'#bf7c63');
 }else if(s.type==='wall'){
  box(c,0,top,w,h,ink);box(c,2,top+4,w-4,h-6,p[2]);
  for(let yy=top+9;yy<top+h;yy+=10){box(c,2,yy,w-4,1,p[1]);for(let xx=yy%20?10:24;xx<w;xx+=28)box(c,xx,yy-9,1,9,p[1]);}
  box(c,0,top,w,4,p[4]);graffiti(c,s.label,12,top+h-27,w-24,z===1?'#b6b786':'#c49279');
 }else if(s.type==='pillar'){
  box(c,0,0,w,h+top,ink);box(c,7,8,w-14,h+top-13,'#778b89');
  box(c,9,9,8,h+top-18,'#bbc0a5');box(c,w-19,9,10,h+top-15,'#4c646b');
  for(let yy=25;yy<h+top-15;yy+=30)box(c,16,yy,w-33,2,'#5b7274');
  box(c,2,h+top-18,w-4,16,'#425b61');box(c,8,h+top-16,w-16,3,'#a7b49e');
  graffiti(c,z===1?'N!':'UNS',20,h+top-60,w-29,'#c19483');
 }else if(s.type==='lamp'){
  box(c,10,top+20,13,10,ink);box(c,14,12,5,top+16,'#4b6060');box(c,14,12,1,top+12,'#9aa88e');
  box(c,5,4,24,11,ink);box(c,8,7,18,5,'#edce86');
 }else if(s.type==='bench'){
  for(const yy of [2,10,20]){box(c,2,top+yy,w-4,6,'#5b4f41');box(c,3,top+yy,w-6,2,'#b2966a');}
  box(c,8,top+23,4,9,ink);box(c,w-12,top+23,4,9,ink);
 }else if(s.type==='bin'){
  box(c,3,top+2,w-6,h-4,ink);box(c,6,top+7,w-12,h-12,'#58776c');box(c,1,top+1,w-2,5,'#839682');
  for(let xx=12;xx<w-6;xx+=14)box(c,xx,top+10,2,h-17,'#384e4b');box(c,6,top+h-4,5,5,ink);box(c,w-11,top+h-4,5,5,ink);
 }else if(s.type==='planter'){
  box(c,0,top+15,w,17,'#967c5c');box(c,2,top+12,w-4,5,'#c8ad80');
  for(let xx=3;xx<w-4;xx+=9){box(c,xx,top+2,9,11,'#4e6e51');box(c,xx+2,top,5,8,'#97a171');}
 }else if(s.type==='crates'){
  for(let yy=0;yy<h;yy+=32)for(let xx=0;xx<w;xx+=32){box(c,xx+1,yy+2,30,29,ink);box(c,xx+3,yy+4,26,25,'#a78859');
   for(let k=0;k<3;k++)box(c,xx+4,yy+7+k*7,24,2,'#66593f');box(c,xx+6,yy+4,3,25,'#c3a776');box(c,xx+23,yy+4,3,25,'#c3a776');}
 }else if(s.type==='stall'){
  box(c,5,top+17,w-10,h-17,'#8f7556');box(c,2,top+11,w-4,12,ink);
  for(let xx=3;xx<w-3;xx+=12)box(c,xx,top+3,12,17,xx%24===3?'#b3634f':light);
  for(let xx=8;xx<w-8;xx+=16){box(c,xx,top+30,12,15,'#62583e');for(let j=0;j<3;j++)box(c,xx+1+j*4,top+32+j%2*4,4,5,xx%32===8?'#b7b45c':'#bf7950');}
  box(c,7,top+h-4,5,4,ink);box(c,w-12,top+h-4,5,4,ink);
 }else if(s.type==='ramp'){
  box(c,0,top,w,h,ink);box(c,5,top+5,w-10,h-10,'#777f72');
  for(let j=0;j<5;j++)box(c,7+j*6,top+7+j*6,w-14-j*12,3,'#a7b59b');
  box(c,2,top+2,w-4,4,'#bfc9aa');graffiti(c,'SK8',w/2-23,top+h-34,64,'#c69473');
 }else if(s.type==='stage'){
  box(c,0,top,w,h,ink);box(c,5,top+5,w-10,h-11,'#8e7b63');
  for(let xx=12;xx<w-6;xx+=17)box(c,xx,top+7,2,h-16,'#625b50');label(c,s.label,14,top+17,light,16);
 }else if(s.type==='speaker'){
  box(c,0,top,w,h,ink);box(c,3,top+3,w-6,h-6,'#506366');
  for(const yy of [8,35]){box(c,6,top+yy,20,20,ink);box(c,11,top+yy+5,10,10,'#819088');}
 }else if(s.type==='scooter'){
  box(c,4,top+18,13,12,ink);box(c,w-18,top+18,13,12,ink);box(c,13,top+10,w-25,14,'#a96051');
  box(c,14,top+7,23,6,ink);box(c,w-18,top+3,5,20,'#ae765b');box(c,w-23,top+1,14,3,ink);box(c,w-11,top+9,5,5,light);
 }else if(s.type==='clock'||s.type==='tower'){
  box(c,15,top+5,w-30,h-7,ink);box(c,19,top+8,w-38,h-15,'#b6a27b');
  box(c,12,top+3,w-24,7,'#736954');box(c,11,top+h-9,w-22,7,'#756e59');
  box(c,w/2-15,top+19,30,28,ink);box(c,w/2-12,top+22,24,22,light);
  box(c,w/2,top+25,2,10,ink);box(c,w/2,top+33,8,2,ink);
  box(c,w/2-6,top+57,12,25,ink);
 }else if(s.type==='tank'){
  box(c,8,top+12,w-16,h-20,ink);box(c,12,top+15,w-24,h-27,'#7f8c81');
  for(let yy=top+21;yy<top+h-16;yy+=18)box(c,13,yy,w-26,3,'#bac1a0');
  box(c,20,top+3,w-40,10,'#566c6b');box(c,w-24,top+17,3,h-33,ink);
 }else if(s.type==='water'){
  box(c,0,top,w,h,'#a2a78f');box(c,5,top+5,w-10,h-10,'#456d78');
  for(let yy=top+12;yy<top+h-5;yy+=15)for(let xx=12;xx<w-10;xx+=29)box(c,xx+(yy%3),yy,15,2,'#93b0a1');
  box(c,10,top+30,w-20,14,'#ac855e');box(c,16,top+25,w-32,5,'#d4b384');
 }else if(s.type==='sculpture'){
  box(c,8,top+h-15,w-16,14,'#516761');box(c,12,top+h-17,w-24,4,'#a4ac91');
  box(c,25,top+10,32,h-30,'#a16c5e');box(c,30,top+5,30,13,'#d0a783');
  box(c,18,top+25,47,10,'#bc876a');box(c,54,top+33,13,23,'#70595a');
 }else if(s.type==='tree'){
  box(c,w/2-5,top+10,10,h-12,'#66563d');box(c,w/2-3,top+12,3,h-15,'#aa8d58');
  box(c,9,4,w-18,9,'#435f4c');box(c,3,13,w-6,top+25,'#435f4c');
  box(c,8,12,w-16,top+19,'#698259');box(c,13,9,w-26,15,'#96a775');
  for(let k=0;k<5;k++)box(c,8+(k*13)%(w-20),19+(k*9)%27,10,5,k%2?'#839b64':'#536f4e');
 }else if(s.type==='garden'){
  box(c,0,top,w,h,'#626e4b');box(c,3,top+3,w-6,h-6,'#8c9d6c');
  for(let yy=top+9;yy<top+h-5;yy+=17)for(let xx=9;xx<w-5;xx+=18){box(c,xx,yy,8,8,'#54704f');box(c,xx+2,yy,4,4,xx%3?'#cdab77':'#b87772');}
  box(c,0,top+h-4,w,4,'#b4a078');
 }else if(s.type==='fountain'){
  box(c,8,top,w-16,h,ink);box(c,0,top+10,w,h-20,ink);box(c,5,top+12,w-10,h-24,'#a7b7a3');
  box(c,12,top+17,w-24,h-34,'#608f94');box(c,18,top+20,w-36,2,'#c1d0b8');
  box(c,w/2-8,top+10,16,h/2,'#526c72');box(c,w/2-15,top+8,30,9,'#c3ccb0');box(c,w/2-3,top+9,6,18,'#adc6b9');
 }else if(s.type==='court'){
  box(c,0,top,w,h,ink);box(c,4,top+4,w-8,h-8,'#9b8765');box(c,10,top+10,w-20,2,light);box(c,10,top+h-12,w-20,2,light);
  box(c,10,top+10,2,h-20,light);box(c,w-12,top+10,2,h-20,light);box(c,w/2,top+10,2,h-20,light);
 }else if(s.type==='paint'){
  for(let k=0;k<3;k++){box(c,2+k*10,top+9+k%2*5,8,17,ink);box(c,3+k*10,top+12+k%2*5,6,11,['#b9786b','#9da36d','#7da3a3'][k]);box(c,4+k*10,top+6+k%2*5,4,4,light);}
 }
 return {canvas,over};
}
function structure(c,s,z,cx,cy){
 if(s.type==='asset'&&R.scaloArtReady()){
  R.scaloStructure(c,s.asset,s.x*T-cx,(s.y-(s.overhang||0))*T-cy);return;
 }
 const key=z+':'+s.id;
 if(!objectCache.has(key))objectCache.set(key,makeStructure(s,z));
 const cached=objectCache.get(key);
 c.drawImage(cached.canvas,s.x*T-cx,(s.y-cached.over)*T-cy);
}
const skins=['#d4a582','#af805e','#e1b89a','#986d51'];
const outfits={writer:['#bb7655','#455466'],mechanic:['#688f9b','#435966'],punk:['#846382','#424c55'],skater:['#8fa667','#626c64'],dj:['#ad809e','#474b65'],woman:['#b56a7c','#686777'],rider:['#c69653','#4e6270'],worker:['#8f9a6b','#5e6c66'],elder:['#b9a589','#656b66'],vendor:['#c2b78d','#857257'],hoodie:['#738299','#52556b']};
const humanCache=new Map();
function human(c,x,y,look='writer',dir='down',walk=0,tint){
 const colors=outfits[look]||outfits.writer,frame=walk?Math.floor(walk*1.4)%3:1;
 const id=[look,dir,frame,tint||''].join(':');
 if(!humanCache.has(id)){
  const a=document.createElement('canvas');a.width=24;a.height=34;
  const q=a.getContext('2d'),shirt=tint||colors[0],skin=skins[Object.keys(outfits).indexOf(look)%skins.length]||skins[0];
  const r=(xx,yy,w,h,col)=>box(q,xx,yy,w,h,col);
  const back=dir==='up',side=dir==='left'||dir==='right',step=frame===1?0:frame===0?-1:1;
  r(5,31,15,2,'#35443e');r(7,24,5,7+step,ink);r(14,24,5,7-step,ink);
  r(8,24,3,5+step,colors[1]);r(15,24,3,5-step,colors[1]);r(6,31+step,6,2,'#cebea1');r(14,31-step,6,2,'#cebea1');
  r(5,14,16,12,ink);r(6,15,14,10,shirt);r(3,16+step,3,9,ink);r(21,16-step,2,9,ink);
  r(3,22+step,3,3,skin);r(20,22-step,3,3,skin);r(9,23,7,2,colors[1]);
  r(7,3,11,12,ink);r(6,6,13,6,ink);r(8,4,9,9,skin);r(7,7,11,4,skin);
  if(!back){r(side?(dir==='left'?8:15):9,8,2,2,ink);if(!side)r(14,8,2,2,ink);r(11,12,3,1,'#875d4d');}
  if(look==='writer'||look==='skater'||look==='rider'||look==='worker'){
   r(7,2,11,4,look==='rider'?'#d9be7f':shirt);r(dir==='left'?4:dir==='right'?15:7,5,side?7:13,2,ink);
  }else if(look==='punk'){r(11,0,4,6,'#bc7c87');r(8,3,3,3,ink);}
  else if(look==='woman'){r(7,2,11,4,'#665448');r(back?7:16,5,3,12,'#665448');r(7,25,12,3,shirt);}
  else if(look==='elder'){r(7,3,3,4,'#d0c9ab');r(16,3,3,4,'#d0c9ab');if(!back){r(8,8,9,1,ink);r(8,7,4,3,ink);r(14,7,4,3,ink);r(9,8,2,1,light);r(15,8,2,1,light);}}
  else if(look==='hoodie'){r(6,2,13,5,shirt);r(6,5,2,10,shirt);r(17,5,2,10,shirt);}
  else{r(7,2,11,4,ink);}
  if(back){r(8,5,9,7,look==='elder'?'#c1b99d':look==='hoodie'?shirt:'#5c5046');}
  if(look==='dj'){r(6,3,2,9,ink);r(18,3,2,9,ink);r(5,8,3,5,light);r(18,8,3,5,light);}
  if(look==='mechanic'||look==='vendor'){r(9,15,2,9,light);r(16,15,2,9,light);r(10,19,7,6,light);}
  if(look==='rider'&&back){r(6,15,14,12,ink);r(7,16,12,10,'#c99953');r(12,17,2,8,light);}
  if(look==='writer'){r(21,22,2,6,light);r(21,21,2,2,ink);r(8,17,3,1,light);}
  if(look==='skater'){r(1,17,2,13,'#b99568');r(0,19,1,2,ink);r(0,26,1,2,ink);}
  humanCache.set(id,a);
 }
 c.imageSmoothingEnabled=false;c.drawImage(humanCache.get(id),Math.round(x-18),Math.round(y-49),36,51);
}
function marker(c,x,y,value,done=false){
 box(c,x-8,y-65,17,15,ink);box(c,x-6,y-63,13,11,done?'#a6b58a':'#e8c888');
 label(c,value,x-3,y-63,ink,11);box(c,x-2,y-50,4,3,ink);
}
root.NINOMON_RETRO=Object.assign({},R,{P:M.zones.map(z=>R.P[z.theme]),battle:(c,b,z,...args)=>R.battle(c,b,M.zones[z].theme,...args),ground,kind:M.ground,streetStructure:structure,human,marker,revision:'street-neighbourhoods-v1'});
})(window);
