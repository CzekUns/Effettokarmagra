/* Q25: ingressi e interni riutilizzabili per i negozi con nome OSM (bar, panifici, alimentari…).
 * Stesso mondo della strada e della banca: unità del mondo, camera dall'alto che segue il
 * protagonista, stesso sprite del giocatore e degli NPC, stessa velocità a piedi.
 * Gli interni sono stanze IMMAGINARIE e stilizzate per tipo di attività: il nome viene dal POI
 * OSM, l'arredo no (nessuna pretesa sulla pianta reale del locale). Superficie fra 1/4 e 1/6
 * della banca 160×120: bar e minimarket 80×60, panificio o pasticceria 64×50.
 * I locali di tipo non previsto o senza un portone raggiungibile restano chiusi. */
import {drawCityPlayer} from './city-art.mjs?v=138';
import {drawPedestrianSprite} from './pedestrian-sprites.mjs?v=002';
import {WALK_SPEED,RUN_SPEED} from './driving-controls.mjs?v=100';

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

/* Q27: due allestimenti di bar, scelti in modo deterministico per tipo e superficie.
 * - «grande» (80×60): bancone, sgabelli, tavolini, cabinato slot e video poker e, solo se c'è
 *   davvero spazio libero intorno, un tavolo da biliardo;
 * - «piccolo» (64×50, 1/6 della banca): bancone, sgabelli, due tavolini e un solo cabinato,
 *   niente tavolo ingombrante.
 * Caffetterie (cafe) sempre piccole; i bar secondo l'area della sagoma OSM dietro al portone
 * (≥ BAR_BIG_FOOTPRINT m²), grandi se l'area non è nota. INTERIOR_OVERRIDES[id].layout forza la scelta.
 * Arredi e giochi sono SCENOGRAFIA INVENTATA: nessuna pretesa che quel bar reale abbia slot o biliardo. */
export const BAR_BIG_FOOTPRINT=200;
export const BAR_LAYOUTS=Object.freeze({
 grande:Object.freeze({width:80,height:60,size:'medio'}),
 piccolo:Object.freeze({width:64,height:50,size:'piccolo'})
});
export const GAME_RADIUS=2.6;
// Hotspot dei giochi: etichetta del comando, funzione del minigioco (Q28–Q30, da altri rami) e avviso.
export const BAR_GAMES=Object.freeze({
 slot:Object.freeze({label:'GIOCA SLOT',fn:'openSlotGame',soon:'SLOT MACHINE · IN ARRIVO'}),
 poker:Object.freeze({label:'GIOCA VIDEO POKER',fn:'openPokerGame',soon:'VIDEO POKER · IN ARRIVO'}),
 pool:Object.freeze({label:'GIOCA A BILIARDO',fn:'openPoolGame',soon:'BILIARDO · IN ARRIVO'})
});
const idSeed=shop=>Math.abs(Math.round(Number(shop?.id)||0));
export function footprintArea(points){
 if(!Array.isArray(points)||points.length<6)return null;
 let s=0;for(let i=0,j=points.length-2;i<points.length;j=i,i+=2)s+=points[j]*points[i+1]-points[i]*points[j+1];
 return Math.abs(s/2);
}
export function barLayoutFor(shop,footprint=shop?.footprint){
 const own=INTERIOR_OVERRIDES[shop?.id]?.layout;
 if(BAR_LAYOUTS[own])return own;
 if(shop?.kind==='cafe')return 'piccolo';
 if(Number.isFinite(footprint))return footprint>=BAR_BIG_FOOTPRINT?'grande':'piccolo';
 return 'grande';
}
const overlaps=(a,b)=>a[0]<b[2]&&a[2]>b[0]&&a[1]<b[3]&&a[3]>b[1];
const stoolsAt=(xs,y)=>xs.map(x=>[x-.8,y,x+.8,y+1.6]);
const tableWithChairs=(x0,y0,x1,y1)=>({table:[x0,y0,x1,y1],chairs:[[x0-3.5,y0+1,x0-1.5,y1-1],[x1+1.5,y0+1,x1+3.5,y1-1]]});
// Cabinato contro la parete destra, rivolto verso la sala: l'hotspot è davanti allo schermo.
const cabinet=(type,x1,y0)=>({type,box:[x1-5,y0,x1,y0+5],x:x1-5-1.6,y:y0+2.5,label:BAR_GAMES[type].label});
// Il biliardo entra solo se il tavolo, con 3 unità per la stecca su ogni lato, sta dentro i muri,
// non tocca altri arredi né il passaggio porta→bancone e l'hotspot davanti resta libero.
export function poolFits(room,box,solids,aisle){
 const pad=3,area=[box[0]-pad,box[1]-pad,box[2]+pad,box[3]+pad];
 if(area[0]<WALL||area[1]<WALL||area[2]>room.width-WALL||area[3]>room.height-WALL)return false;
 if(aisle&&overlaps(area,aisle))return false;
 return !solids.some(s=>overlaps(area,s));
}
function furnishBar(layout,width,height,shop){
 const door={x0:width/2-DOOR_WIDTH/2,x1:width/2+DOOR_WIDTH/2,y:height-WALL};
 if(layout==='piccolo'){
  const counter={box:[6,9,40,15],x:23,y:18.5,label:'BANCONE'};
  const tables=[tableWithChairs(8,26,15,32),tableWithChairs(44,30,51,36)];
  const games=[cabinet(idSeed(shop)%2?'poker':'slot',width-WALL,13)];
  const stools=stoolsAt([11,17,29,35],16.2);
  return {door,layout,counter,clerk:{x:23,y:6.4,kind:0},shelf:[6,3.2,34],pastry:null,tables,stools,games,pool:null,
   solids:[counter.box,...stools,...tables.flatMap(t=>[t.table,...t.chairs]),...games.map(g=>g.box)],decor:'bar'};
 }
 const counter={box:[8,10,52,17],x:30,y:20.5,label:'BANCONE'},pastry=[56,10,72,16];
 const tables=[tableWithChairs(10,28,18,34),tableWithChairs(10,42,18,48)];
 const games=[cabinet('slot',width-WALL,22),cabinet('poker',width-WALL,30)];
 const stools=stoolsAt([13,20,40,47],18.2);
 const solids=[counter.box,pastry,...stools,...tables.flatMap(t=>[t.table,...t.chairs]),...games.map(g=>g.box)];
 const room={width,height},poolBox=[48,38,68,49],aisle=[door.x0,counter.y,door.x1,height];
 let pool=null;
 if(poolFits(room,poolBox,solids,aisle)){
  pool={box:poolBox};solids.push(poolBox);
  games.push({type:'pool',box:poolBox,x:(poolBox[0]+poolBox[2])/2,y:poolBox[3]+2.4,label:BAR_GAMES.pool.label});
 }
 return {door,layout,counter,clerk:{x:30,y:7.2,kind:0},shelf:[8,3.2,44],pastry,tables,stools,games,pool,solids,decor:'bar'};
}
// Arredi solidi (x0,y0,x1,y1) in coordinate della stanza; il bancone ha il punto di servizio
// (aggancio per la Q26: COMPRA / PARLA al bancone) e il commesso dietro.
function furnish(template,width,height){
 const door={x0:width/2-DOOR_WIDTH/2,x1:width/2+DOOR_WIDTH/2,y:height-WALL};
 if(template==='bottega')return {door,
  counter:{box:[6,11,48,17],x:27,y:20.5,label:'BANCONE'},clerk:{x:24,y:7.6,kind:1},
  solids:[[6,11,48,17],[52,11,58,30],[6,26,14,34]],games:[],
  decor:'bottega'};
 return {door,
  counter:{box:[8,40,26,45],x:17,y:48.5,label:'CASSA'},clerk:{x:17,y:37,kind:2},
  solids:[[8,40,26,45],[30,12,34,38],[44,12,48,38],[58,12,62,38],[70,6,77,46],[6,8,24,13]],games:[],
  decor:'minimarket'};
}
export function interiorFor(shop,{footprint=shop?.footprint}={}){
 const template=SHOP_INTERIOR_KINDS[shop?.kind];
 if(!template)return null;
 const base=INTERIOR_TEMPLATES[template],own=INTERIOR_OVERRIDES[shop.id]||{};
 if(template==='bar'){
  const layout=barLayoutFor(shop,footprint),dims=BAR_LAYOUTS[layout];
  return {template,size:dims.size,floor:base.floor,width:dims.width,height:dims.height,footprint:Number.isFinite(footprint)?footprint:null,
   ...furnishBar(layout,dims.width,dims.height,shop)};
 }
 const width=own.width||base.width,height=own.height||base.height;
 return {template,size:own.size||base.size,floor:base.floor,width,height,...furnish(template,width,height)};
}

/* Portone di ogni negozio: sulla facciata davanti all'insegna o un poco di lato, raggiungibile dal
 * marciapiede, mai in carreggiata e abbastanza lontano dall'insegna perché ENTRA e COMPRA non si
 * confondano. probe(origin,normal) è probeDoor del gioco (muro dritto, percorso libero). */
export function resolveShopEntrances(shops,{probe,isWalkable=()=>true,onRoad=()=>false,footprintAt=null}={}){
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
  // Q27: superficie della sagoma subito dietro al portone (la normale del portone punta fuori).
  const footprint=typeof footprintAt==='function'?footprintAt(found.x-found.nx*2,found.y-found.ny*2):null;
  const own=Number.isFinite(footprint)?interiorFor(shop,{footprint}):room;
  entrances.push({shop,x:found.x,y:found.y,a:Math.atan2(-found.ny,-found.nx),nx:found.nx,ny:found.ny,room:own});
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
/* Q26: i negozi con un interno vendono SOLO dentro, al bancone. Fuori, all'insegna, il comando
 * diventa ENTRA; gli altri negozi (e i furgoncini della Q17) vendono ancora dal marciapiede. */
export const SIGN_RADIUS=5;
export function outdoorShops(shops,entrances){
 const inside=new Set((entrances||[]).map(e=>e.shop));
 return (shops||[]).filter(shop=>!inside.has(shop));
}
export function entranceAtSign(entrances,point,radius=SIGN_RADIUS){
 let best=null;
 for(const entrance of entrances||[]){
  const distance=Math.hypot(entrance.shop.x-point.x,entrance.shop.y-point.y);
  if(distance<=radius&&(!best||distance<best.distance))best={entrance,distance};
 }
 return best;
}
// Q26: punto di servizio al bancone o alla cassa, se il protagonista è lì davanti.
export function interiorCounterNear(interior,radius=COUNTER_RADIUS){
 const c=interior?.room?.counter,p=interior?.player;
 return c&&p&&Math.hypot(p.x-c.x,p.y-c.y)<=radius?c:null;
}
/* Q27: cabinati e biliardo. L'hotspot è davanti al singolo oggetto. I minigiochi (Q28–Q30) arrivano
 * da altri rami: il gioco li passa in `launchers` solo se definiti; altrimenti avviso «in arrivo».
 * La posizione nel bar viene salvata e ripristinata all'uscita dal minigioco (onExit). */
export function interiorGameNear(interior,radius=GAME_RADIUS){
 const p=interior?.player;let best=null;
 for(const game of interior?.room?.games||[]){
  const d=p?Math.hypot(p.x-game.x,p.y-game.y):Infinity;
  if(d<=radius&&(!best||d<best.d))best={game,d};
 }
 return best?.game||null;
}
export function startBarGame(interior,game,launchers={},{clock=0,onExit=null}={}){
 if(!interior||!game)return {ok:false,reason:'nessun-gioco'};
 const p=interior.player,launch=launchers?.[game.type];
 if(typeof launch!=='function'){
  interior.notice={text:BAR_GAMES[game.type]?.soon||'IN ARRIVO',x:game.x,y:game.y,until:clock+3};
  return {ok:false,reason:'in-arrivo'};
 }
 interior.gameReturn={x:p.x,y:p.y,a:p.a};interior.playing=game.type;p.moving=false;
 const exit=()=>typeof onExit==='function'?onExit(interior):endBarGame(interior);
 try{launch({game:game.type,shop:interior.shop,from:'bar',onExit:exit,onClose:exit});}
 catch(error){
  endBarGame(interior);
  interior.notice={text:'GIOCO NON DISPONIBILE',x:game.x,y:game.y,until:clock+3};
  return {ok:false,reason:'errore',error};
 }
 return {ok:true};
}
export function endBarGame(interior){
 const back=interior?.gameReturn;
 if(back)Object.assign(interior.player,{x:back.x,y:back.y,a:back.a,moving:false});
 if(interior){interior.gameReturn=null;interior.playing=null;}
 return interior;
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
// Q27: cabinato visto dall'alto, schermo verso la sala (a sinistra): mobile scuro, luce in cima,
// schermo con tre rulli (slot) o cinque carte (video poker). Grafica originale, nessuna marca.
function drawCabinet(ctx,game,clock){
 const [x0,y0,x1,y1]=game.box,w=x1-x0,h=y1-y0;
 block(ctx,x0,y0,w,h,'#2b2f3a','#171a22',1.2);
 ctx.fillStyle='#454b5c';ctx.fillRect(x0+.4,y0+.4,w-.8,.7);
 const blink=Math.sin(clock*5+y0)>0;
 ctx.fillStyle=game.type==='slot'?(blink?'#ffcf4a':'#d0582e'):(blink?'#7fe0ff':'#3a8fd0');
 ctx.fillRect(x0+w-1.3,y0+.6,.8,h-1.2);
 ctx.fillStyle='#0e1414';ctx.fillRect(x0+.5,y0+.8,2.9,h-1.6);
 if(game.type==='slot'){
  for(let i=0;i<3;i++){ctx.fillStyle='#efe6d2';ctx.fillRect(x0+.8,y0+1+i*1.05,2.3,.85);
   ctx.fillStyle=['#c8352e','#e0b13a','#5e9a52'][(i+Math.floor(clock*2))%3];ctx.fillRect(x0+1.6,y0+1.15+i*1.05,.7,.55);}
 }else{
  ctx.fillStyle='#1f6b45';ctx.fillRect(x0+.6,y0+.9,2.7,h-1.8);
  for(let i=0;i<4;i++){ctx.fillStyle='#f4efe2';ctx.fillRect(x0+.9,y0+1.1+i*.75,1.1,.55);ctx.fillStyle=i%2?'#c8352e':'#222';ctx.fillRect(x0+1.15,y0+1.25+i*.75,.3,.25);}
 }
 // pulsantiera davanti allo schermo
 ctx.fillStyle='#5b4a3c';ctx.fillRect(x0-.6,y0+1,.6,h-2);
 ctx.fillStyle='#e6503c';ctx.fillRect(x0-.5,y0+1.4,.4,.4);ctx.fillStyle='#f0d04a';ctx.fillRect(x0-.5,y0+2.3,.4,.4);
}
// Q27: tavolo da biliardo dall'alto: sponde in legno, panno verde, sei buche, biglie e una stecca.
function drawPoolTable(ctx,box){
 const [x0,y0,x1,y1]=box,w=x1-x0,h=y1-y0;
 block(ctx,x0,y0,w,h,'#6b4630','#3f2a1d',1.8);
 ctx.fillStyle='#8a5e3e';ctx.fillRect(x0,y0,w,.6);
 ctx.fillStyle='#2f7d4f';ctx.fillRect(x0+1.2,y0+1.2,w-2.4,h-2.4);
 ctx.fillStyle='#3b8d5c';for(let y=y0+1.2;y<y1-1.2;y+=2)ctx.fillRect(x0+1.2,y,w-2.4,.5);
 ctx.fillStyle='#111';
 for(const [px,py] of [[x0+.9,y0+.9],[x0+w/2,y0+.6],[x1-.9,y0+.9],[x0+.9,y1-.9],[x0+w/2,y1-.6],[x1-.9,y1-.9]]){ctx.beginPath();ctx.arc(px,py,.75,0,Math.PI*2);ctx.fill();}
 ctx.fillStyle='#f2efe4';ctx.beginPath();ctx.arc(x0+w*.28,y0+h/2,.55,0,Math.PI*2);ctx.fill();
 const rack=[[0,0],[.95,-.55],[.95,.55],[1.9,-1.1],[1.9,0],[1.9,1.1]],tones=['#e0b13a','#2f5fae','#c8352e','#6a3b8c','#e07b2c','#1d1d1d'];
 rack.forEach(([dx,dy],i)=>{ctx.fillStyle=tones[i];ctx.beginPath();ctx.arc(x0+w*.68+dx,y0+h/2+dy,.5,0,Math.PI*2);ctx.fill();});
 ctx.strokeStyle='#d8b98a';ctx.lineWidth=.35;ctx.beginPath();ctx.moveTo(x0+w*.28-1,y0+h/2+.3);ctx.lineTo(x0+w*.28-8,y0+h/2+2.6);ctx.stroke();
}
function drawBar(ctx,room,clock){
 // mensole di bottiglie sulla parete di fondo
 const [sx,sy,sw]=room.shelf||[8,3.2,44];
 block(ctx,sx,sy,sw,2.6,'#6f5541','#4a3a2d',.6);
 for(let i=0;i<Math.floor(sw/2.2);i++){ctx.fillStyle=['#5e8a6a','#b98a4c','#9c4b3f','#d9cfa8'][i%4];ctx.fillRect(sx+1+i*2.1,sy+.2,1,1.8);}
 // bancone in legno con piano chiaro, macchina del caffè e tazzine
 const [cx0,cy0,cx1,cy1]=room.counter.box,cw=cx1-cx0;
 block(ctx,cx0,cy0,cw,cy1-cy0,'#8a6547','#5a4332',2.2);
 ctx.fillStyle='#c9b48d';ctx.fillRect(cx0,cy0,cw,1.1);
 block(ctx,cx0+5,cy0+1.2,7,4,'#b7bcb4','#6e7570',.8);ctx.fillStyle='#2d3330';ctx.fillRect(cx0+6,cy0+2,5,1.2);
 for(let i=0;i<5;i++){ctx.fillStyle='#efe6d2';ctx.fillRect(cx0+16+i*3.2,cy0+2.6,1.3,1);}
 // vetrina dei dolci (solo nel bar grande)
 if(room.pastry){
  const [px0,py0,px1,py1]=room.pastry;
  block(ctx,px0,py0,px1-px0,py1-py0,'#9bb3ad','#4f625e',1.6);
  for(let i=0;i<6;i++){ctx.fillStyle=['#d79a5b','#e8c487','#a8573f'][i%3];ctx.fillRect(px0+1.5+i*2.3,py0+2,1.6,1.4);}
 }
 // sgabelli davanti al bancone (solidi, ma lasciano libero il punto di servizio)
 for(const [x0,y0,x1] of room.stools||[]){
  const x=(x0+x1)/2,y=y0+.8;
  ctx.fillStyle='#162220a6';ctx.beginPath();ctx.arc(x+.4,y+.7,1,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#4b3a2e';ctx.fillRect(x-.25,y,.5,1);
  ctx.fillStyle='#a8352e';ctx.beginPath();ctx.arc(x,y-.1,.85,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#d0584a';ctx.fillRect(x-.4,y-.6,.5,.3);
 }
 // tavolini con sedie
 for(const {table:[x0,y0,x1,y1],chairs} of room.tables||[]){
  block(ctx,x0,y0,x1-x0,y1-y0,'#a07a55','#5d4634',1.2);ctx.fillStyle='#d7c39d';ctx.fillRect(x0+2.6,y0+2.2,2.8,1.4);
  for(const [a,b,c,d] of chairs)block(ctx,a,b,c-a,d-b,'#6d5a48','#3f3329',.8);
 }
 if(room.pool)drawPoolTable(ctx,room.pool.box);
 for(const game of room.games||[])if(game.type!=='pool')drawCabinet(ctx,game,clock);
}
function drawHotspots(ctx,room,interior,clock){
 // Punto luminoso davanti a ogni gioco (come i portoni): mostra dove premere E.
 for(const game of room.games||[]){
  const pulse=.75+.25*Math.sin(clock*4+game.x);
  ctx.globalAlpha=.18+.1*pulse;ctx.fillStyle='#ffe08a';ctx.beginPath();ctx.arc(game.x,game.y,1.6*pulse,0,Math.PI*2);ctx.fill();
  ctx.globalAlpha=1;
 }
 const note=interior.notice;
 if(note&&clock<note.until){
  ctx.font='bold 1.6px monospace';ctx.textAlign='center';
  const w=Math.max(10,note.text.length*1.05),bx=clamp(note.x,w/2+WALL,room.width-WALL-w/2),by=clamp(note.y-5.5,WALL,room.height-WALL-3);
  ctx.fillStyle='#fff3c4';ctx.fillRect(bx-w/2,by,w,2.6);ctx.strokeStyle='#2c3430';ctx.lineWidth=.2;ctx.strokeRect(bx-w/2,by,w,2.6);
  ctx.fillStyle='#2c3430';ctx.fillText(note.text,bx,by+1.85);
 }
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
 if(room.games?.length)drawHotspots(ctx,room,interior,clock);
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
 ctx.fillText(room.games?.length?'MELITO · INTERNO E GIOCHI DI FANTASIA':'MELITO · INTERNO DI FANTASIA',width/2,28);
 // I comandi (PARLA al bancone, ESCI) stanno sulla plancia e sul pulsante azione, non qui sopra.
 ctx.restore();
}
