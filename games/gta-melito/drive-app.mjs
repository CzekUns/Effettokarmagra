// Q38 — App Drive dello smartphone: cerca una via OSM o un POI della mappa, calcola il percorso sul
// grafo stradale del gioco (sensi unici rispettati in auto), lo disegna sulla minimappa e dà
// l'indicazione «tra 120 m gira a destra». Ricalcola se esci dal percorso, dice ARRIVATO a destinazione.
// Nessun civico inventato: si trovano solo nomi di vie (state.roads) e POI (state.map.pois) reali.
// Grafica provvisoria, da far approvare al committente.

export const DRIVE_RULES=Object.freeze({arriveMetres:14,offRouteMetres:22,recalcSeconds:1.2,turnDegrees:35,snapMetres:6,maxResults:8});

const fold=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const POI_LABEL={fuel:'distributore',post_office:'ufficio postale',townhall:'municipio',pharmacy:'farmacia',bank:'banca',
 school:'scuola',place_of_worship:'chiesa',police:'polizia',carabinieri:'carabinieri',supermarket:'supermercato',
 restaurant:'ristorante',cafe:'bar',bar:'bar',fast_food:'friggitoria',hospital:'ospedale',clinic:'ambulatorio'};

// Punto di riferimento di una via: il vertice centrale del suo tratto più lungo con quel nome.
function roadAnchor(list){
 let best=null,bestLen=-1;
 for(const r of list){
  const p=r.p||[];let len=0;for(let i=2;i<p.length;i+=2)len+=Math.hypot(p[i]-p[i-2],p[i+1]-p[i-1]);
  if(len>bestLen&&p.length>=2){bestLen=len;best=r;}
 }
 if(!best)return null;
 const p=best.p,n=p.length/2,m=Math.floor((n-1)/2);
 return n>1?{x:(p[m*2]+p[m*2+2])/2,y:(p[m*2+1]+p[m*2+3])/2}:{x:p[0],y:p[1]};
}

// Elenco dei luoghi cercabili: una voce per nome di via e una per POI con nome.
export function placeIndex({roads=[],pois=[]}={}){
 const byName=new Map();
 for(const r of roads){if(!r.n||!(r.p?.length>=2))continue;const k=fold(r.n);if(!byName.has(k))byName.set(k,{name:r.n,list:[]});byName.get(k).list.push(r);}
 const places=[];
 for(const [key,{name,list}] of byName){const a=roadAnchor(list);if(a)places.push({name,kind:'via',key,x:a.x,y:a.y});}
 for(const p of pois){if(!p.n||!(p.p?.length>=2))continue;
  const label=POI_LABEL[p.k]||String(p.k||'luogo').replace(/_/g,' ');
  places.push({name:p.n,kind:'poi',label,key:fold(p.n+' '+label),x:p.p[0],y:p.p[1]});}
 return places;
}

// Ricerca senza accenti/maiuscole; prima chi inizia con la parola cercata, poi chi la contiene.
export function searchPlaces(query,source,limit=DRIVE_RULES.maxResults){
 const q=fold(query);if(q.length<2)return [];
 const places=Array.isArray(source)?source:placeIndex(source);
 const words=q.split(' ');
 const scored=[];
 for(const p of places){
  if(!words.every(w=>p.key.includes(w)))continue;
  const starts=p.key.startsWith(q)||p.key.split(' ').some(w=>w.startsWith(words[0]));
  scored.push([(starts?0:1)+(p.kind==='poi'?0:.5),p]);
 }
 scored.sort((a,b)=>a[0]-b[0]||a[1].name.localeCompare(b[1].name));
 return scored.slice(0,limit).map(s=>s[1]);
}

const ok=(e,mode)=>mode==='car'?!!e.car:!!e.walk;

// Griglia dei nodi per agganciare tratti vicini (OSM a volte non condivide il vertice esatto).
const grids=new WeakMap();
function nodeGrid(graph){
 let g=grids.get(graph);if(g)return g;
 const cell=16,map=new Map();
 graph.nodes.forEach((n,i)=>{const k=Math.floor(n.x/cell)+','+Math.floor(n.y/cell);if(!map.has(k))map.set(k,[]);map.get(k).push(i);});
 g={cell,map,near:new Map()};grids.set(graph,g);return g;
}
function nearNodes(graph,i,r=DRIVE_RULES.snapMetres){
 const g=nodeGrid(graph);if(g.near.has(i))return g.near.get(i);
 const n=graph.nodes[i],out=[];
 for(let gx=Math.floor((n.x-r)/g.cell);gx<=Math.floor((n.x+r)/g.cell);gx++)
  for(let gy=Math.floor((n.y-r)/g.cell);gy<=Math.floor((n.y+r)/g.cell);gy++)
   for(const j of g.map.get(gx+','+gy)||[]){const d=Math.hypot(graph.nodes[j].x-n.x,graph.nodes[j].y-n.y);if(d<=r)out.push([j,d]);}
 g.near.set(i,out);return out;
}

function project(px,py,ax,ay,bx,by){
 const dx=bx-ax,dy=by-ay,l2=dx*dx+dy*dy||1;
 const t=Math.max(0,Math.min(1,((px-ax)*dx+(py-ay)*dy)/l2));
 const x=ax+dx*t,y=ay+dy*t;return {t,x,y,d:Math.hypot(px-x,py-y)};
}

// Tratto percorribile più vicino a un punto (in auto solo tratti carrabili).
export function nearestEdge(graph,x,y,mode='car',max=60){
 let best=null;
 for(let id=0;id<graph.edges.length;id++){
  const e=graph.edges[id];if(!ok(e,mode))continue;
  const a=graph.nodes[e.from],b=graph.nodes[e.to];
  if(Math.min(a.x,b.x)-max>x||Math.max(a.x,b.x)+max<x||Math.min(a.y,b.y)-max>y||Math.max(a.y,b.y)+max<y)continue;
  const p=project(x,y,a.x,a.y,b.x,b.y);
  if(p.d<=max&&(!best||p.d<best.distance))best={edge:id,t:p.t,x:p.x,y:p.y,distance:p.d};
 }
 return best;
}

// Heap minimo per Dijkstra.
function heap(){const a=[];return {
 get size(){return a.length;},
 push(k,v){a.push([k,v]);let i=a.length-1;while(i){const p=(i-1)>>1;if(a[p][0]<=a[i][0])break;[a[p],a[i]]=[a[i],a[p]];i=p;}},
 pop(){const top=a[0],last=a.pop();if(a.length){a[0]=last;let i=0;for(;;){const l=i*2+1,r=l+1;let m=i;
  if(l<a.length&&a[l][0]<a[m][0])m=l;if(r<a.length&&a[r][0]<a[m][0])m=r;if(m===i)break;[a[m],a[i]]=[a[i],a[m]];i=m;}}return top;}};}

// Tratti percorribili alla stessa distanza (i due sensi di una via a doppio senso).
function edgesNear(graph,x,y,mode){
 const best=nearestEdge(graph,x,y,mode);if(!best)return [];
 const out=[best];
 for(let id=0;id<graph.edges.length;id++){
  if(id===best.edge)continue;const e=graph.edges[id];if(!ok(e,mode))continue;
  const a=graph.nodes[e.from],b=graph.nodes[e.to],p=project(x,y,a.x,a.y,b.x,b.y);
  if(p.d<=best.distance+.75)out.push({edge:id,t:p.t,x:p.x,y:p.y,distance:p.d});
 }
 return out;
}

// Percorso più breve fra due punti lungo il grafo: in auto solo nel verso consentito dei sensi unici.
// Restituisce {points:[[x,y]...],length,edges} oppure null se la destinazione non è raggiungibile.
export function planDriveRoute(graph,from,to,mode='car'){
 if(!graph||!from||!to)return null;
 const starts=edgesNear(graph,from.x,from.y,mode),goals=edgesNear(graph,to.x,to.y,mode);
 if(!starts.length||!goals.length)return null;
 // Stesso tratto, destinazione più avanti nel verso di marcia: dritto.
 for(const s of starts)for(const g of goals)if(s.edge===g.edge&&g.t>=s.t)
  return {points:[[s.x,s.y],[g.x,g.y]],length:Math.hypot(g.x-s.x,g.y-s.y),edges:[s.edge],mode};
 const dist=new Map(),prev=new Map(),open=heap();
 for(const s of starts){const e=graph.edges[s.edge],d=(1-s.t)*e.len;
  if(d<(dist.get(e.to)??Infinity)){dist.set(e.to,d);prev.set(e.to,{start:s});open.push(d,e.to);}}
 const goalAt=new Map();for(const g of goals){const n=graph.edges[g.edge].from;if(!goalAt.has(n))goalAt.set(n,[]);goalAt.get(n).push(g);}
 let best=null,bestCost=Infinity;
 while(open.size){
  const [d,n]=open.pop();
  if(d>=bestCost)break;
  if(d>(dist.get(n)??Infinity))continue;
  for(const g of goalAt.get(n)||[]){const c=d+g.t*graph.edges[g.edge].len;if(c<bestCost){bestCost=c;best={node:n,goal:g};}}
  for(const [k,snap] of nearNodes(graph,n))for(const id of graph.nodes[k].out){
   const e=graph.edges[id];if(!ok(e,mode))continue;
   const nd=d+snap+e.len;
   if(nd<(dist.get(e.to)??Infinity)){dist.set(e.to,nd);prev.set(e.to,{node:n,edge:id});open.push(nd,e.to);}
  }
 }
 if(!best)return null;
 const edges=[best.goal.edge],points=[[best.goal.x,best.goal.y]];
 let n=best.node,p=prev.get(n);
 while(!p.start){points.unshift([graph.nodes[n].x,graph.nodes[n].y]);edges.unshift(p.edge);n=p.node;p=prev.get(n);}
 points.unshift([graph.nodes[n].x,graph.nodes[n].y]);edges.unshift(p.start.edge);
 points.unshift([p.start.x,p.start.y]);
 // Toglie punti doppi (agganci a pochi metri).
 const clean=[points[0]];for(const q of points.slice(1)){const l=clean[clean.length-1];if(Math.hypot(q[0]-l[0],q[1]-l[1])>.3)clean.push(q);}
 let length=0;for(let i=1;i<clean.length;i++)length+=Math.hypot(clean[i][0]-clean[i-1][0],clean[i][1]-clean[i-1][1]);
 return {points:clean,length,edges,mode};
}

// Distanza dal percorso e posizione lungo di esso.
export function locateOnRoute(route,x,y){
 let best={d:Infinity,index:0,along:0},acc=0;
 const pts=route.points;
 for(let i=1;i<pts.length;i++){
  const [ax,ay]=pts[i-1],[bx,by]=pts[i],len=Math.hypot(bx-ax,by-ay),p=project(x,y,ax,ay,bx,by);
  if(p.d<best.d)best={d:p.d,index:i,along:acc+p.t*len};
  acc+=len;
 }
 return best;
}

// Prossima svolta dopo la posizione attuale: verso (destra/sinistra) e metri che mancano.
// Coordinate del gioco con y verso il basso: un angolo che cresce è una svolta a destra.
export function nextTurn(route,where){
 const pts=route.points,turn=DRIVE_RULES.turnDegrees*Math.PI/180;
 let acc=0;const cum=[0];for(let i=1;i<pts.length;i++){acc+=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]);cum.push(acc);}
 for(let i=Math.max(1,where.index);i<pts.length-1;i++){
  // Direzioni medie su qualche metro per non contare le piccole curve del disegno OSM.
  const a1=Math.atan2(pts[i][1]-pts[i-1][1],pts[i][0]-pts[i-1][0]),a2=Math.atan2(pts[i+1][1]-pts[i][1],pts[i+1][0]-pts[i][0]);
  let delta=a2-a1;while(delta>Math.PI)delta-=2*Math.PI;while(delta<-Math.PI)delta+=2*Math.PI;
  if(Math.abs(delta)>=turn)return {side:delta>0?'destra':'sinistra',metres:Math.max(0,cum[i]-where.along),sharp:Math.abs(delta)>2.4};
 }
 return {side:null,metres:Math.max(0,acc-where.along)};
}

const roundMetres=m=>m<50?Math.max(5,Math.round(m/5)*5):Math.round(m/10)*10;
export function instructionText(drive){
 if(!drive.destination)return '';
 if(drive.arrived)return 'ARRIVATO · '+drive.destination.name.toUpperCase();
 if(!drive.route)return 'PERCORSO NON TROVATO · '+drive.destination.name.toUpperCase();
 const t=drive.turn;
 if(t&&t.side)return 'tra '+roundMetres(t.metres)+' m '+(t.sharp?'inverti/gira stretto a ':'gira a ')+t.side;
 return 'prosegui dritto per '+roundMetres(drive.remaining)+' m';
}
export const ARROW={destra:'↱',sinistra:'↰'};

export function createDrive(){return {destination:null,route:null,arrived:false,remaining:0,turn:null,offRoute:0,recalcs:0,mode:'car',cooldown:0};}

export function setDestination(drive,place,{graph,player,mode='car'}){
 drive.destination=place?{name:place.name,kind:place.kind,x:place.x,y:place.y}:null;
 drive.arrived=false;drive.recalcs=0;drive.mode=mode;drive.cooldown=0;
 drive.route=place?planDriveRoute(graph,player,place,mode):null;
 if(place)stepDrive(drive,player,{graph,mode},0);
 return !!drive.route;
}
export function cancelDrive(drive){Object.assign(drive,createDrive());return drive;}

// A ogni fotogramma: arrivo, uscita dal percorso con ricalcolo, istruzione della prossima svolta.
export function stepDrive(drive,player,{graph,mode=drive.mode}={},dt=0){
 if(!drive.destination||drive.arrived)return drive;
 drive.cooldown=Math.max(0,drive.cooldown-dt);
 const dest=drive.destination;
 if(Math.hypot(player.x-dest.x,player.y-dest.y)<=DRIVE_RULES.arriveMetres){drive.arrived=true;drive.turn=null;drive.remaining=0;return drive;}
 const changed=mode!==drive.mode;
 if(changed)drive.mode=mode;
 let where=drive.route?locateOnRoute(drive.route,player.x,player.y):null;
 if((!where||where.d>DRIVE_RULES.offRouteMetres||changed)&&drive.cooldown<=0&&graph){
  const route=planDriveRoute(graph,player,dest,mode);
  drive.cooldown=DRIVE_RULES.recalcSeconds;
  if(route){drive.route=route;drive.recalcs++;where=locateOnRoute(route,player.x,player.y);}
 }
 if(!drive.route||!where)return drive;
 // Arrivo anche quando il punto della via è fuori dal grafo: fine del percorso raggiunta.
 drive.remaining=Math.max(0,drive.route.length-where.along);
 if(drive.remaining<=DRIVE_RULES.arriveMetres&&where.d<DRIVE_RULES.offRouteMetres){drive.arrived=true;drive.turn=null;drive.remaining=0;return drive;}
 drive.turn=nextTurn(drive.route,where);
 return drive;
}

// Linea del percorso sulla minimappa (state.mini = {k,ox,oy}).
export function drawDriveRoute(ctx,drive,mini){
 if(!ctx||!mini||!drive?.route||drive.arrived)return;
 const {k,ox,oy}=mini,pts=drive.route.points;
 ctx.save();ctx.lineJoin='round';ctx.lineCap='round';
 for(const [w,c] of [[4,'#1b2a20'],[2.2,'#4fd0ff']]){
  ctx.strokeStyle=c;ctx.lineWidth=w;ctx.beginPath();
  pts.forEach(([x,y],i)=>i?ctx.lineTo(ox+x*k,oy+y*k):ctx.moveTo(ox+x*k,oy+y*k));ctx.stroke();
 }
 const d=drive.destination;ctx.fillStyle='#ff5a8a';ctx.strokeStyle='#1b2a20';ctx.lineWidth=1.2;
 ctx.fillRect(ox+d.x*k-3,oy+d.y*k-3,6,6);ctx.strokeRect(ox+d.x*k-3,oy+d.y*k-3,6,6);
 ctx.restore();
}

// Schermata dell'app nel telefono Q37. ctx: getWorld() -> {graph,roads,pois,player,mode}, drive, onPicked().
export function mountDriveApp(doc,screen,ctx){
 if(!doc||!screen)return {refresh(){}};
 const el=(tag,attrs={},text='')=>{const e=doc.createElement(tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,v);if(text)e.textContent=text;return e;};
 const input=el('input',{type:'search',id:'drive-search',class:'drive-search',placeholder:'CERCA VIA O LUOGO…','aria-label':'Cerca una via o un luogo di Melito',autocomplete:'off'});
 const status=el('p',{class:'drive-status',id:'drive-status','aria-live':'polite'});
 const results=el('div',{class:'drive-results',id:'drive-results',role:'list'});
 const cancel=el('button',{type:'button',class:'phone-row',id:'drive-cancel'},'✕ ANNULLA PERCORSO');
 const note=el('p',{class:'phone-note'},'Solo vie OSM e luoghi della mappa (niente civici inventati). In auto il percorso rispetta i sensi unici; a piedi usa anche marciapiedi e vicoli.');
 screen.append(input,status,results,cancel,note);
 let places=null;
 const world=()=>ctx.getWorld();
 function refresh(){
  const d=ctx.drive,w=world();
  cancel.hidden=!d.destination;
  status.textContent=d.destination?(d.route?'DESTINAZIONE: '+d.destination.name.toUpperCase()+' · '+(d.remaining>=1000?(d.remaining/1000).toFixed(1).replace('.',',')+' km':Math.round(d.remaining)+' m')+(d.arrived?' · ARRIVATO':''):'DESTINAZIONE NON RAGGIUNGIBILE: '+d.destination.name.toUpperCase()):
   (w?.graph?'Nessuna destinazione. Scrivi almeno 2 lettere.':'Mappa in caricamento…');
  results.replaceChildren();
  const q=input.value;if(!w?.graph||q.trim().length<2)return;
  places??=placeIndex({roads:w.roads,pois:w.pois});
  const found=searchPlaces(q,places);
  if(!found.length){results.append(el('p',{class:'phone-note',id:'drive-not-found'},'LUOGO NON TROVATO: «'+q.trim()+'» non è nella mappa di Melito.'));return;}
  for(const p of found){
   const b=el('button',{type:'button',class:'phone-row','data-place':p.name},(p.kind==='via'?'🛣 ':'📍 ')+p.name.toUpperCase()+(p.label?' · '+p.label:''));
   b.addEventListener('click',()=>{const w2=world();const okRoute=setDestination(ctx.drive,p,{graph:w2.graph,player:w2.player,mode:w2.mode});input.value='';refresh();ctx.onPicked?.(okRoute);});
   results.append(b);
  }
 }
 input.addEventListener('input',refresh);input.addEventListener('change',refresh);
 cancel.addEventListener('click',()=>{cancelDrive(ctx.drive);refresh();ctx.onCancel?.();});
 return {refresh,input};
}
