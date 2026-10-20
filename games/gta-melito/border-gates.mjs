/* GTA Melito — BF09 (20/10/2026): varchi di confine.
 * osm.mjs taglia le strade OSM sul confine ISTAT (clipPolyline): l'ultimo nodo di una strada
 * carrabile che finisce sul confine è un VARCO verso un altro comune. Un'auto NPC che arriva a
 * un varco in uscita prosegue nel buio oltre il taglio e sparisce (sparizione controllata);
 * un'altra entra da un varco in entrata. In futuro i varchi sono i punti di aggancio per
 * collegare le mappe dei comuni vicini: per questo ognuno conserva strada, tipo, OSM way id,
 * sensi ammessi e coordinate WGS84. Il comune confinante NON è nei dati: il campo resta vuoto.
 * Grafica: le strade sono tagliate dritte lungo il confine e al varco un imbocco a trapezio
 * sfuma l'asfalto nell'area nera (niente più estremità arrotondate). */
import {SIDEWALK_OUTER,SIDEWALK_SHADOW,SIDEWALK_KERB} from './sidewalk.mjs?v=099';
import {roadTrafficLaneOffset} from './road-widths.mjs?v=043';

export const GATE_RULES=Object.freeze({
 tolerance:1.5,  // m: distanza massima dal confine dell'ultimo nodo (i tagli OSM sono a 0–0,05 m)
 mouth:16,       // m: lunghezza dell'imbocco disegnato oltre il confine
 narrow:.82,     // larghezza in fondo all'imbocco rispetto a quella al confine
 travel:13,      // m: quanto un mezzo percorre nel buio prima di sparire / da dove arriva
 fade:11         // m: in questo tratto la sagoma sfuma fino a sparire
});
const METERS=111319.49079327358;

export function borderRing(border){
 if(!border)return [];
 if(Array.isArray(border[0]))return border;
 const ring=[];for(let i=0;i+1<border.length;i+=2)ring.push([border[i],border[i+1]]);
 return ring;
}
export function distanceToBorder(x,y,ring){
 let best=Infinity;
 for(let i=0;i<ring.length;i++){
  const a=ring[i],b=ring[(i+1)%ring.length],dx=b[0]-a[0],dy=b[1]-a[1],len=dx*dx+dy*dy||1;
  const t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/len));
  best=Math.min(best,Math.hypot(x-a[0]-t*dx,y-a[1]-t*dy));
 }
 return best;
}
// Coordinate WGS84 di un punto di gioco (inversa di osm.mjs xy), per agganciare mappe vicine.
export function gameToLonLat(x,y,p){
 if(!p||!Number.isFinite(p.cos))return null;
 return {lon:+(p.minLon+x/(p.cos*METERS)).toFixed(6),lat:+(p.maxLat-y/METERS).toFixed(6)};
}
/* Un varco è un nodo con un solo vicino carrabile, sul confine. `exit` è l'arco che arriva al
 * varco (si esce dal comune), `entry` quello che ne parte (si entra); un senso unico ne ha uno. */
export function findBorderGates(graph,border,{tolerance=GATE_RULES.tolerance}={}){
 const ring=borderRing(border);
 if(ring.length<3)return [];
 const {nodes,edges}=graph,incoming=nodes.map(()=>[]);
 edges.forEach((e,id)=>{if(e.car)incoming[e.to].push(id);});
 const gates=[];
 nodes.forEach((node,id)=>{
  const out=node.out.filter(e=>edges[e].car),inc=incoming[id];
  if(!out.length&&!inc.length)return;
  const near=new Set([...out.map(e=>edges[e].to),...inc.map(e=>edges[e].from)]);
  if(near.size!==1||distanceToBorder(node.x,node.y,ring)>tolerance)return;
  const exit=inc[0]??null,entry=out[0]??null,edge=edges[exit??entry];
  // Verso l'esterno: la direzione di marcia di chi esce (o l'opposta di chi entra).
  const angle=exit!=null?edges[exit].angle:Math.atan2(-Math.sin(edges[entry].angle),-Math.cos(edges[entry].angle));
  gates.push({index:gates.length,id:`${edge.roadId}@${Math.round(node.x)},${Math.round(node.y)}`,node:id,
   x:node.x,y:node.y,angle,exit,entry,direction:exit!=null&&entry!=null?'entrambi':exit!=null?'uscita':'entrata',
   roadId:edge.roadId,name:edge.name||'',roadType:edge.roadType,streetWidth:edge.streetWidth,comune:''});
 });
 return gates;
}
/* Il tratto nel buio che un mezzo percorre (le due corsie, sagoma compresa) non deve passare sotto
 * un edificio disegnato oltre il confine: un varco così resta nei dati ma non è usato dal traffico. */
export function gateMouthClear(gate,clear){
 const off=roadTrafficLaneOffset(gate.streetWidth),ux=Math.cos(gate.angle),uy=Math.sin(gate.angle);
 for(let d=0;d<=GATE_RULES.travel+3.5;d+=1.25)for(const lateral of [-(off+1.7),-Math.max(0,off-1.7),Math.max(0,off-1.7),off+1.7])
  if(!clear(gate.x+ux*d-uy*lateral,gate.y+uy*d+ux*lateral))return false;
 return true;
}
// Elenco semplice (JSON) dei varchi: base per collegare in futuro le mappe dei comuni vicini.
export function borderGateList(gates,projection){
 return gates.map(g=>({id:g.id,x:+g.x.toFixed(1),y:+g.y.toFixed(1),angoloUscita:+g.angle.toFixed(3),
  strada:g.name,tipo:g.roadType,osmWay:g.roadId,sensi:g.direction,comune:g.comune,usatoDalTraffico:!g.blocked,
  ...gameToLonLat(g.x,g.y,projection)}));
}
/* Imbocco a trapezio oltre il confine: silhouette, marciapiede, cordolo e asfalto della strada
 * proseguono per `mouth` metri restringendosi un poco e sfumano nell'area nera. Va disegnato
 * con il disegno ritagliato FUORI dal confine (il taglio resta dritto lungo il confine). */
export function drawBorderGates(c,gates){
 for(const g of gates){
  const w=g.streetWidth,ux=Math.cos(g.angle),uy=Math.sin(g.angle),nx=-uy,ny=ux;
  const back=w/2+SIDEWALK_OUTER,L=GATE_RULES.mouth;
  // [mezza larghezza, colore, quota dell'imbocco]: i marciapiedi si perdono prima dell'asfalto.
  const layers=[[w/2+SIDEWALK_OUTER,'41,47,45',.55],[w/2+SIDEWALK_SHADOW,'197,172,131',.42],[w/2+SIDEWALK_KERB,'240,212,168',.5],[w/2-.25,'48,54,56',1]];
  for(const [half,rgb,share] of layers){
   const far=half*GATE_RULES.narrow,len=L*share;
   const grad=c.createLinearGradient(g.x,g.y,g.x+ux*len,g.y+uy*len);
   grad.addColorStop(0,`rgba(${rgb},1)`);grad.addColorStop(.4,`rgba(${rgb},.7)`);grad.addColorStop(1,`rgba(${rgb},0)`);
   c.beginPath();
   c.moveTo(g.x-ux*back+nx*half,g.y-uy*back+ny*half);
   c.lineTo(g.x+ux*len+nx*far,g.y+uy*len+ny*far);
   c.lineTo(g.x+ux*len-nx*far,g.y+uy*len-ny*far);
   c.lineTo(g.x-ux*back-nx*half,g.y-uy*back-ny*half);
   c.closePath();c.fillStyle=grad;c.fill();
  }
  // Linea di mezzeria che si perde nel buio, solo sulle strade a doppio senso più larghe.
  if(g.direction==='entrambi'&&w>=9){
   const grad=c.createLinearGradient(g.x,g.y,g.x+ux*L*.8,g.y+uy*L*.8);
   grad.addColorStop(0,'rgba(230,213,166,.7)');grad.addColorStop(1,'rgba(230,213,166,0)');
   c.save();c.setLineDash([3.2,4.4]);c.lineWidth=.38;c.strokeStyle=grad;
   c.beginPath();c.moveTo(g.x,g.y);c.lineTo(g.x+ux*L*.8,g.y+uy*L*.8);c.stroke();c.restore();
  }
 }
}
