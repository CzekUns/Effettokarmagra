/* GTA Melito — BF07: semafori di gioco e linee d'arresto, disegnati in pixel art procedurale come
 * i lampioni di visuals.mjs (vista dall'alto 2.5D: il palo sale verso l'alto dello schermo).
 * I semafori sono SIMULATI (vedi junctions.mjs, SIGNALS_SIMULATED): nessun dato OSM li rileva. */
import {signalAspect} from './junctions.mjs?v=002';
import {roadTrafficLaneOffset} from './road-widths.mjs?v=043';

const LAMPS=Object.freeze([
 {color:'red',y:-8.25,off:'#3e1815',on:'#ff4232',glow:'255,72,52'},
 {color:'yellow',y:-7.0,off:'#3d3214',on:'#ffc627',glow:'255,196,64'},
 {color:'green',y:-5.75,off:'#11361f',on:'#41f07c',glow:'80,240,130'}
]);
/* Palo sul marciapiede all'angolo destro di ogni accesso (0,9 m oltre il cordolo), all'altezza
 * della linea d'arresto o poco prima; mai in un edificio o sulla carreggiata (valid), mai
 * addosso a lampioni o altri oggetti (avoid). Linea d'arresto sulla corsia di marcia (dalla mezzeria
 * al cordolo destro, sulle vie strette; sulle vie larghe e a senso unico solo sulla corsia usata). */
export function prepareSignalPosts(graph,signals,{valid=()=>true,avoid=[]}={}){
 const posts=[];
 for(const J of signals||[])for(const A of J.approaches.values()){
  const e=graph.edges[A.edge],ux=Math.cos(e.angle),uy=Math.sin(e.angle),nx=-Math.sin(e.angle),ny=Math.cos(e.angle);
  // Solo sulla corsia che usano i mezzi (sulle vie molto larghe la linea non attraversa la piazza).
  const lane=roadTrafficLaneOffset(A.width),outer=Math.min(A.width/2-.3,lane+2.6);
  const sx=J.x-ux*A.stop,sy=J.y-uy*A.stop,inner=A.twoWay?.15:Math.max(-A.width/2+.3,lane-2.6);
  A.stopLine={x0:sx+nx*inner,y0:sy+ny*inner,x1:sx+nx*outer,y1:sy+ny*outer};
  A.post=null;
  for(const back of [.4,1.8,-.9,3.2]){
   const d=A.stop+back,side=A.width/2+.9,x=J.x-ux*d+nx*side,y=J.y-uy*d+ny*side;
   if(!valid(x,y))continue;
   if(avoid.some(q=>Math.hypot(q.x-x,q.y-y)<(q.r||1.4))||posts.some(q=>Math.hypot(q.x-x,q.y-y)<1.6))continue;
   A.post={x,y,a:e.angle};posts.push(A.post);break;
  }
 }
 return posts;
}
const inside=(x,y,[x0,y0,x1,y1],pad)=>x>=x0-pad&&x<=x1+pad&&y>=y0-pad&&y<=y1+pad;
export function drawStopLines(c,signals,bounds,zoom){
 if(zoom<.85||!signals?.length)return;
 c.save();c.strokeStyle='#ece5cf';c.lineWidth=.6;c.lineCap='butt';
 for(const J of signals){
  if(!inside(J.x,J.y,bounds,40))continue;
  for(const A of J.approaches.values()){
   const s=A.stopLine;if(!s)continue;
   c.beginPath();c.moveTo(s.x0,s.y0);c.lineTo(s.x1,s.y1);c.stroke();
  }
 }
 c.restore();
}
/* Palo scuro, lanterna con visiera e tre luci: accesa quella della fase dell'accesso, con un
 * piccolo bordo luminoso perché resti leggibile anche con lo zoom largo dell'auto. */
export function drawSignals(c,signals,bounds,clockSeconds,zoom){
 if(zoom<.85||!signals?.length)return;
 for(const J of signals){
  if(!inside(J.x,J.y,bounds,45))continue;
  for(const A of J.approaches.values()){
   const p=A.post;if(!p||!inside(p.x,p.y,bounds,10))continue;
   const lit=signalAspect(J,A,clockSeconds)?.color,x=p.x,y=p.y;
   c.strokeStyle='#1829284d';c.lineWidth=.55;c.beginPath();c.moveTo(x,y);c.lineTo(x+3.4,y+2.2);c.stroke();
   c.fillStyle='#26332f';c.fillRect(x-.62,y-.32,1.24,.8);c.fillRect(x-.2,y-5.1,.4,5.1);
   c.fillStyle='#0f1717';c.fillRect(x-.86,y-9,1.72,4.1);
   c.fillStyle='#4a5753';c.fillRect(x-.86,y-9,1.72,.28);c.fillRect(x-.86,y-9,.22,4.1);
   for(const lamp of LAMPS){
    const on=lamp.color===lit;
    if(on){c.fillStyle=lamp.on+'66';c.fillRect(x-.78,y+lamp.y-.6,1.56,1.2);}
    c.fillStyle=on?lamp.on:lamp.off;c.fillRect(x-.5,y+lamp.y-.47,1,.94);
    if(on){c.fillStyle='#fff3d4';c.fillRect(x-.38,y+lamp.y-.36,.32,.3);}
   }
  }
 }
}
// Di notte: alone colorato della luce accesa e un riflesso sull'asfalto davanti alla linea.
export function signalGlows(signals,bounds,clockSeconds,level){
 const glows=[],lights=[];
 if(!(level>0))return {glows,lights};
 for(const J of signals||[]){
  if(!inside(J.x,J.y,bounds,45))continue;
  for(const A of J.approaches.values()){
   const p=A.post;if(!p)continue;
   const lamp=LAMPS.find(q=>q.color===signalAspect(J,A,clockSeconds)?.color);if(!lamp)continue;
   glows.push({x:p.x,y:p.y+lamp.y,r:3.4,color:lamp.glow,strength:level,alpha:.8});
   const s=A.stopLine;
   if(s)glows.push({x:(s.x0+s.x1)/2,y:(s.y0+s.y1)/2,r:4.2,color:lamp.glow,strength:level,alpha:.14});
   lights.push({x:p.x,y:p.y-1,r:3.6,strength:level*.8});
  }
 }
 return {glows,lights};
}
