/* Q25: ingressi e interni riutilizzabili per i negozi con nome OSM (bar, panifici, alimentari…).
 * Stesso mondo della strada e della banca: unità del mondo, camera dall'alto che segue il
 * protagonista, stesso sprite del giocatore e degli NPC, stessa velocità a piedi.
 * Gli interni sono stanze IMMAGINARIE e stilizzate per tipo di attività: il nome viene dal POI
 * OSM, l'arredo no (nessuna pretesa sulla pianta reale del locale). Superficie fra 1/4 e 1/6
 * della banca 160×120: bar e minimarket 80×60, panificio o pasticceria 64×50.
 * I locali di tipo non previsto o senza un portone raggiungibile restano chiusi. */
import {drawCityPlayer} from './city-art.mjs?v=131';
import {drawPedestrianSprite} from './pedestrian-sprites.mjs?v=001';
import {WALK_SPEED,RUN_SPEED} from './driving-controls.mjs?v=098';

const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
const WALL=3,DOOR_WIDTH=10,BODY=1.1;
export const SHOP_DOOR_RADIUS=2.4;   // dal portone: ENTRA (più stretto del bancone esterno COMPRA, 5 m)
export const SHOP_DOOR_MIN_GAP=2.2;  // il portone sta lontano dall'insegna dove si compra fuori
export const COUNTER_RADIUS=4.2;

// Tipo di attività OSM → modello di stanza.
export const SHOP_INTERIOR_KINDS=Object.freeze({bar:'bar',cafe:'bar',pastry:'bottega',bakery:'bottega',convenience:'minimarket',supermarket:'minimarket'});
// Dimensioni per tipo; un singolo negozio può averne di sue in INTERIOR_OVERRIDES (per id).
export const INTERIOR_TEMPLATES=Object.freeze({
 bar:Object.freeze({width:80,height:60,size:'medio',floor:'terrazzo'}),
 bottega:Object.freeze({width:64,height:50,size:'piccolo',floor:'piastrelle'}),
 minimarket:Object.freeze({width:80,height:60,size:'medio',floor:'linoleum'})
});
export const INTERIOR_OVERRIDES={};

// Arredi solidi (x0,y0,x1,y1) in coordinate della stanza; il bancone ha il punto di servizio
// (aggancio per la Q26: COMPRA / PARLA al bancone) e il commesso dietro.
function furnish(template,width,height){
 const door={x0:width/2-DOOR_WIDTH/2,x1:width/2+DOOR_WIDTH/2,y:height-WALL};
 if(template==='bar')return {door,
  counter:{box:[8,10,52,17],x:30,y:20.5,label:'BANCONE'},clerk:{x:30,y:7.2,kind:0},
  solids:[[8,10,52,17],[56,10,72,16],[13,33,21,39],[35,33,43,39],[57,31,65,37],[10,34,12,38],[22,34,24,38],[32,34,34,38],[44,34,46,38],[54,32,56,36],[66,32,68,36]],
  decor:'bar'};
 if(template==='bottega')return {door,
  counter:{box:[6,11,48,17],x:27,y:20.5,label:'BANCONE'},clerk:{x:24,y:7.6,kind:1},
  solids:[[6,11,48,17],[52,11,58,30],[6,26,14,34]],
  decor:'bottega'};
 return {door,
  counter:{box:[8,40,26,45],x:17,y:48.5,label:'CASSA'},clerk:{x:17,y:37,kind:2},
  solids:[[8,40,26,45],[30,12,34,38],[44,12,48,38],[58,12,62,38],[70,6,77,46],[6,8,24,13]],
  decor:'minimarket'};
}
export function interiorFor(shop){
 const template=SHOP_INTERIOR_KINDS[shop?.kind];
 if(!template)return null;
 const base=INTERIOR_TEMPLATES[template],own=INTERIOR_OVERRIDES[shop.id]||{};
 const width=own.width||base.width,height=own.height||base.height;
 return {template,size:own.size||base.size,floor:base.floor,width,height,...furnish(template,width,height)};
}

/* Portone di ogni negozio: sulla facciata davanti all'insegna o un poco di lato, raggiungibile dal
 * marciapiede, mai in carreggiata e abbastanza lontano dall'insegna perché ENTRA e COMPRA non si
 * confondano. probe(origin,normal) è probeDoor del gioco (muro dritto, percorso libero). */
export function resolveShopEntrances(shops,{probe,isWalkable=()=>true,onRoad=()=>false}={}){
 const entrances=[];
 for(const shop of shops||[]){
  const room=interiorFor(shop);
  if(!room||typeof probe!=='function'||!Number.isFinite(shop.x)||!Number.isFinite(shop.y))continue;
  const side=shop.side||1,ux=Math.cos(shop.a||0),uy=Math.sin(shop.a||0);
  const normal={x:-Math.sin(shop.a||0)*side,y:Math.cos(shop.a||0)*side};
  let found=null;
  for(const along of [0,3,-3,5,-5]){
   const door=probe({x:shop.x+ux*along,y:shop.y+uy*along},normal,shop);
   if(!door||!Number.isFinite(door.x)||!isWalkable(door.x,door.y)||onRoad(door.x,door.y))continue;
   if(Math.hypot(door.x-shop.x,door.y-shop.y)<SHOP_DOOR_MIN_GAP)continue;
   found=door;break;
  }
  if(!found||entrances.some(e=>Math.hypot(e.x-found.x,e.y-found.y)<2.5))continue;
  entrances.push({shop,x:found.x,y:found.y,a:Math.atan2(-found.ny,-found.nx),nx:found.nx,ny:found.ny,room});
 }
 return entrances;
}
export function nearestShopEntrance(entrances,point,radius=SHOP_DOOR_RADIUS){
 let best=null;
 for(const entrance of entrances||[]){
  const distance=Math.hypot(entrance.x-point.x,entrance.y-point.y);
  if(distance<=radius&&(!best||distance<best.distance))best={entrance,distance};
 }
 return best;
}
export function drawShopEntrance(ctx,entrance,clock){
 const pulse=.8+.2*Math.sin(clock*4+entrance.x),r=1.45*pulse;
 ctx.save();
 ctx.globalAlpha=.2+.08*pulse;ctx.fillStyle='#ffd9a0';ctx.beginPath();ctx.arc(entrance.x,entrance.y,r*2,0,Math.PI*2);ctx.fill();
 ctx.globalAlpha=1;ctx.lineWidth=.42;ctx.strokeStyle='#fff1cf';ctx.beginPath();ctx.arc(entrance.x,entrance.y,r,0,Math.PI*2);ctx.stroke();
 ctx.fillStyle='#f6d49a';ctx.beginPath();ctx.arc(entrance.x,entrance.y,.38,0,Math.PI*2);ctx.fill();
 // Niente scritta: l'insegna del negozio è lì accanto; il comando «E · ENTRA · NOME» è sulla plancia.
 ctx.restore();
}

// Stato di un interno: posizione esterna salvata per il ritorno esatto, protagonista sulla soglia.
export function enterShop(entrance,outside){
 const room=entrance.room;
 return {entrance,shop:entrance.shop,room,outside:{x:outside.x,y:outside.y,a:outside.a},
  player:{x:room.width/2,y:room.height-WALL-3.2,a:-Math.PI/2,moving:false},camera:null,greet:null};
}
export function shopInteriorWalkable(room,x,y){
 if(!room||!Number.isFinite(x)||!Number.isFinite(y))return false;
 const inDoor=x-BODY>=room.door.x0&&x+BODY<=room.door.x1&&y>room.height-WALL-BODY;
 if(!inDoor&&(x-BODY<WALL||x+BODY>room.width-WALL||y-BODY<WALL||y+BODY>room.height-WALL))return false;
 if(y>room.height+1)return false;
 return !room.solids.some(([x0,y0,x1,y1])=>x+BODY>x0&&x-BODY<x1&&y+BODY>y0&&y-BODY<y1);
}
// Stessi metri al secondo della strada; scivola lungo banconi e scaffali. Uscendo dalla porta
// restituisce 'exit' (il gioco riporta il protagonista alle coordinate esterne salvate).
export function stepShopInteriorPlayer(interior,axes,running,dt){
 const player=interior.player,room=interior.room;
 const ax=Number(axes?.x)||0,ay=Number(axes?.y)||0,mag=Math.hypot(ax,ay);
 player.moving=mag>.08;
 if(!player.moving)return null;
 player.a=Math.atan2(ay,ax);
 const d=(running?RUN_SPEED:WALK_SPEED)*Math.min(mag,1)*clamp(Number(dt)||0,0,.05);
 const dx=ax/mag*d,dy=ay/mag*d;
 if(shopInteriorWalkable(room,player.x+dx,player.y+dy)){player.x+=dx;player.y+=dy;}
 else{
  if(shopInteriorWalkable(room,player.x+dx,player.y))player.x+=dx;
  if(shopInteriorWalkable(room,player.x,player.y+dy))player.y+=dy;
 }
 return player.y>room.height-.6?'exit':null;
}
// Q26: punto di servizio al bancone o alla cassa, se il protagonista è lì davanti.
export function interiorCounterNear(interior,radius=COUNTER_RADIUS){
 const c=interior?.room?.counter,p=interior?.player;
 return c&&p&&Math.hypot(p.x-c.x,p.y-c.y)<=radius?c:null;
}
export function shopInteriorCamera(room,player,width,height,zoom,previous=null,dt=0){
 const z=Math.max(.1,Number(zoom)||6.6),halfX=Math.max(1,width)/(2*z),halfY=Math.max(1,height)/(2*z);
 const px=Number.isFinite(player?.x)?player.x:room.width/2,py=Number.isFinite(player?.y)?player.y:room.height-6;
 const target={x:2*halfX>=room.width?room.width/2:clamp(px,halfX,room.width-halfX),
  y:2*halfY>=room.height?room.height/2:clamp(py,halfY,room.height-halfY)};
 if(!previous||!Number.isFinite(previous.x)||!Number.isFinite(previous.y))return target;
 const k=1-Math.exp(-9*clamp(Number(dt)||0,0,.08));
 return {x:previous.x+(target.x-previous.x)*k,y:previous.y+(target.y-previous.y)*k};
}
export function shopInteriorViewport(room,width,height,player,zoom=6.6,camera=null){
 const scale=Math.max(.1,Number(zoom)||6.6),focus=camera||shopInteriorCamera(room,player,width,height,scale);
 const hx=width/(2*scale),hy=height/(2*scale);
 const cx=hx*2>=room.width?room.width/2:clamp(focus.x,hx,room.width-hx);
 const cy=hy*2>=room.height?room.height/2:clamp(focus.y,hy,room.height-hy);
 return {x:width/2-cx*scale,y:height/2-cy*scale,scale,cameraX:cx,cameraY:cy};
}

// --- disegno: stessa palette, spessori e ombre degli interni della banca ---
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
const FLOORS={terrazzo:['#b3a084','#ab9a80','#b8a98c'],piastrelle:['#d2c4a2','#cbbd9b','#d8cbab'],linoleum:['#8e938a','#878c83','#949a90']};
function drawFloor(ctx,room){
 const tones=FLOORS[room.floor]||FLOORS.terrazzo;
 ctx.fillStyle=tones[0];ctx.fillRect(WALL,WALL,room.width-2*WALL,room.height-2*WALL);
 for(let y=WALL;y<room.height-WALL;y+=4)for(let x=WALL;x<room.width-WALL;x+=4){
  const seed=(x*13+y*7)%9;
  ctx.fillStyle=tones[seed%3];ctx.fillRect(x,y,3.8,3.8);
  if(room.floor==='terrazzo'&&seed===0){ctx.fillStyle='#d9ccb0';ctx.fillRect(x+1,y+1.4,.5,.5);}
 }
}
function drawWalls(ctx,room){
 const {width:w,height:h,door}=room;
 wall(ctx,0,0,w,WALL);wall(ctx,0,0,WALL,h);wall(ctx,w-WALL,0,WALL,h);
 wall(ctx,0,h-WALL,door.x0,WALL);wall(ctx,door.x1,h-WALL,w-door.x1,WALL);
 // soglia e zerbino del portone d'ingresso
 ctx.fillStyle='#394e4c';ctx.fillRect(door.x0,h-WALL,DOOR_WIDTH,WALL);
 ctx.fillStyle='#c4b28c';ctx.fillRect(door.x0,h-WALL,DOOR_WIDTH,.7);
 ctx.fillStyle='#6b4f3c';ctx.fillRect(door.x0+2,h-WALL-3,DOOR_WIDTH-4,2.2);
}
function clerk(ctx,c,clock){
 if(drawPedestrianSprite(ctx,c.x,c.y,Math.PI/2,c.kind,clock,false,.8,c.kind*31+5))return;
 ctx.fillStyle='#2b3438';ctx.fillRect(c.x-1.1,c.y-1,2.2,2.5);
 ctx.fillStyle='#caac88';ctx.fillRect(c.x-.75,c.y-2.4,1.5,1.3);
}
function drawBar(ctx,room,clock){
 // mensole di bottiglie sulla parete di fondo
 block(ctx,8,3.2,44,2.6,'#6f5541','#4a3a2d',.6);
 for(let i=0;i<20;i++){ctx.fillStyle=['#5e8a6a','#b98a4c','#9c4b3f','#d9cfa8'][i%4];ctx.fillRect(9+i*2.1,3.4,1,1.8);}
 // bancone in legno con piano chiaro, macchina del caffè e tazzine
 block(ctx,8,10,44,7,'#8a6547','#5a4332',2.2);
 ctx.fillStyle='#c9b48d';ctx.fillRect(8,10,44,1.1);
 block(ctx,13,11.2,7,4,'#b7bcb4','#6e7570',.8);ctx.fillStyle='#2d3330';ctx.fillRect(14,12,5,1.2);
 for(let i=0;i<5;i++){ctx.fillStyle='#efe6d2';ctx.fillRect(24+i*3.2,12.6,1.3,1);}
 // vetrina dei dolci
 block(ctx,56,10,16,6,'#9bb3ad','#4f625e',1.6);
 for(let i=0;i<6;i++){ctx.fillStyle=['#d79a5b','#e8c487','#a8573f'][i%3];ctx.fillRect(57.5+i*2.3,12,1.6,1.4);}
 // tavolini con sedie
 for(const [x,y] of [[13,33],[35,33],[57,31]]){
  block(ctx,x,y,8,6,'#a07a55','#5d4634',1.2);ctx.fillStyle='#d7c39d';ctx.fillRect(x+2.6,y+2.2,2.8,1.4);
  for(const sx of [x-3,x+9])block(ctx,sx,y+1,2,4,'#6d5a48','#3f3329',.8);
 }
 // sgabelli davanti al bancone (decorativi, bassi: non bloccano il passaggio)
 for(let i=0;i<4;i++){ctx.fillStyle='#3d3430';ctx.beginPath();ctx.arc(16+i*8,19,1,0,Math.PI*2);ctx.fill();}
}
function drawBottega(ctx,room,clock){
 // scaffali del pane a parete
 block(ctx,6,3.2,42,3.4,'#8c6a49','#5a4532',.7);
 for(let i=0;i<14;i++){ctx.fillStyle=['#d39a5a','#c4843f','#e2b878'][i%3];ctx.beginPath();ctx.ellipse(8+i*3,4.9,1.2,.8,0,0,Math.PI*2);ctx.fill();}
 // banco vetrina con pane, taralli e cassa
 block(ctx,6,11,42,6,'#c6c0ad','#77705f',1.8);
 ctx.fillStyle='#9fb9b4';ctx.fillRect(7,11.6,32,2.6);
 for(let i=0;i<10;i++){ctx.fillStyle=['#cf8d4b','#e6c085','#b8733b'][i%3];ctx.fillRect(8+i*3,12.1,2,1.4);}
 block(ctx,41,11.6,5,3.5,'#3b4541','#252c29',.6);ctx.fillStyle='#8fd0a8';ctx.fillRect(42,12.2,3,.8);
 // cesti laterali e espositore
 block(ctx,52,11,6,19,'#7c5f43','#4a3a2b',1.2);
 for(let i=0;i<5;i++){ctx.fillStyle='#d9a565';ctx.fillRect(53.2,12.5+i*3.4,3.6,1.6);}
 block(ctx,6,26,8,8,'#9c7d5b','#5d4a37',1);ctx.fillStyle='#e0c38c';ctx.fillRect(7.5,27.5,5,1.2);
}
function drawMinimarket(ctx,room,clock){
 // scaffali a file con prodotti colorati (generici, nessuna marca)
 for(const x of [30,44,58]){
  block(ctx,x,12,4,26,'#c9c7bd','#7a7a72',1.3);
  for(let j=0;j<12;j++){ctx.fillStyle=['#c95c4b','#e0c25f','#4f8fb5','#76a65a','#e6e1d2'][(x+j)%5];ctx.fillRect(x+.5,13+j*2.1,3,1.4);}
 }
 // frigoriferi a vetro sulla parete destra
 block(ctx,70,6,7,40,'#9fc2c8','#4b6b70',1.4);
 for(let j=0;j<9;j++){ctx.fillStyle=j%2?'#d9eef0':'#bfdde2';ctx.fillRect(71,7.5+j*4.3,5,.5);ctx.fillStyle=['#e9e4d0','#c95c4b','#7fb0d0'][j%3];ctx.fillRect(71.6,8.6+j*4.3,1.4,2.2);ctx.fillRect(73.8,8.6+j*4.3,1.4,2.2);}
 // espositore frutta in fondo
 block(ctx,6,8,18,5,'#7c5f43','#4a3a2b',1);
 for(let i=0;i<8;i++){ctx.fillStyle=['#e08a2c','#b8372e','#76a65a'][i%3];ctx.beginPath();ctx.arc(7.6+i*2.1,9.8,.8,0,Math.PI*2);ctx.fill();}
 // cassa vicino all'ingresso
 block(ctx,8,40,18,5,'#4f5a56','#2f3836',1.3);
 ctx.fillStyle='#2b3330';ctx.fillRect(10,40.8,14,1.1);block(ctx,20,41.2,4,2.6,'#3b4541','#252c29',.5);
 ctx.fillStyle='#8fd0a8';ctx.fillRect(20.6,41.6,2.8,.7);
}
export function drawShopInterior(ctx,width,height,clock,interior,zoom=6.6,camera=null){
 const room=interior.room;
 ctx.save();ctx.imageSmoothingEnabled=false;
 ctx.fillStyle='#182520';ctx.fillRect(0,0,width,height);
 const view=shopInteriorViewport(room,width,height,interior.player,zoom,camera);
 ctx.translate(view.x,view.y);ctx.scale(view.scale,view.scale);
 ctx.fillStyle='#26332d';ctx.fillRect(-6,-6,room.width+12,room.height+12);
 drawFloor(ctx,room);
 if(room.decor==='bar')drawBar(ctx,room,clock);
 else if(room.decor==='bottega')drawBottega(ctx,room,clock);
 else drawMinimarket(ctx,room,clock);
 clerk(ctx,room.clerk,clock);
 drawWalls(ctx,room);
 const p=interior.player;
 drawCityPlayer(ctx,{x:p.x,y:p.y,a:p.a??-Math.PI/2,car:-1},clock,!!p.moving);
 if(interior.greet&&clock<interior.greet.until){
  const c=room.clerk;ctx.font='bold 1.8px monospace';ctx.textAlign='center';
  const w=Math.max(10,interior.greet.text.length*1.15);
  // Sotto il commesso, sul bancone: sopra c'è la parete di fondo e, sul telefono, la testata con il nome.
  const bx=clamp(c.x,w/2+WALL,room.width-WALL-w/2),by=c.y+2.2;
  ctx.fillStyle='#fff8e6';ctx.fillRect(bx-w/2,by,w,2.8);ctx.strokeStyle='#2c3430';ctx.lineWidth=.2;ctx.strokeRect(bx-w/2,by,w,2.8);
  ctx.fillStyle='#2c3430';ctx.fillText(interior.greet.text,bx,by+1.95);
 }
 ctx.restore();
 // UI a schermo come nella banca: nome reale dell'attività, interno dichiarato di fantasia.
 ctx.save();
 const bw=Math.min(470,width*.84);
 ctx.fillStyle='#111f1ce8';ctx.fillRect(width/2-bw/2,6,bw,27);
 ctx.strokeStyle='#a99b73';ctx.lineWidth=1;ctx.strokeRect(width/2-bw/2,6,bw,27);
 ctx.fillStyle='#f2d18a';ctx.textAlign='center';ctx.font='bold 12px monospace';
 ctx.fillText(String(interior.shop?.name||'NEGOZIO').toUpperCase().slice(0,36),width/2,18);
 ctx.fillStyle='#c0c9b7';ctx.font='9px monospace';
 ctx.fillText('MELITO · INTERNO DI FANTASIA',width/2,28);
 // I comandi (PARLA al bancone, ESCI) stanno sulla plancia e sul pulsante azione, non qui sopra.
 ctx.restore();
}
