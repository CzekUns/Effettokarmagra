/* GTA Melito — Q42: mercato settimanale del rione 219.
 * Il LUOGO è reale (data/market-area.json, fonti in MERCATO_MELITO.md); il giorno (venerdì) e gli
 * orari NON sono verificati; banchi, merci, prezzi, venditori e clienti sono di fantasia.
 * I banchi hanno un segnaposto disegnato qui in pixel art semplice; dal lotto 3 (CODEX-GH, 21/10/2026)
 * i 14 tipi usano le celle dell'atlante assets/market/ registrate in MARKET_ART (un solo punto di
 * aggancio): senza PNG restano i segnaposto. Gli ombrelloni sono pixel
 * art procedurale (cache per variante) e, come i tetti, sfumano quando il giocatore ci passa sotto.
 * Venditori e clienti usano gli sprite esistenti dei pedoni e vivono in market.people, fuori da
 * state.people: li muove solo questo modulo (griglia di 1 m dentro l'area, percorsi lungo i
 * marciapiedi delle quattro vie all'esterno). Compaiono e spariscono solo fuori vista. */
import {VEHICLE_SCALE,PERSON_SCALE,vs,ps} from './world-scale.mjs?v=001';
import {easeRoofReveal} from './roof-reveal.mjs?v=121';
import {NPC_DAY_MINUTES,npcDay,npcWeekday} from './npc-agenda.mjs?v=002';
import {addToCollisionIndex,moveInCollisionIndex} from './traffic-collision.mjs?v=131';
import {PEDESTRIAN_KIND_COUNT} from './extra-pedestrian-sprites.mjs?v=005';

// Stessi dati di data/market-area.json (il test lo verifica): il gioco non legge quel file a runtime.
export const MARKET_AREA=Object.freeze({
 id:'mercato-settimanale-rione-219',
 streets:Object.freeze(['Via Praga','Via Dublino','Via Budapest','Via Ginevra','Via Berlino']),
 polygon:Object.freeze([[1137,925],[1199,923],[1200,970],[1139,975]].map(p=>Object.freeze(p))),
 centre:Object.freeze([1168,948]),
 // Rettangolo dove possono stare i banchi (dentro il poligono, fuori dalle carreggiate).
 stallBox:Object.freeze([1144.5,929.4,1191.5,966.6]),
 // Griglia dei percorsi a piedi: comprende la linea dei pedoni delle quattro vie.
 gridBox:Object.freeze([1139,925,1198,971])
});
export const MARKET_RULES=Object.freeze({
 weekday:0,              // giorno 0 del gioco = VENERDÌ (npc-agenda.mjs): mercato il venerdì (non verificato)
 setup:[390,450],        // 6:30–7:30 montaggio
 open:[450,810],         // 7:30–13:30 mercato
 teardown:[810,870],     // 13:30–14:30 smontaggio
 scale:1.9*PERSON_SCALE, // misure reali del CSV × scala di gioco; BF14: segue la scala delle persone (world-scale.mjs)
 gap:.9,maxCustomers:16,customerSpeed:[1.5,2],vendorSpeed:2.6,buy:[5,15],visits:[1,3],
 buildMinutes:[12,18],arrive:[0,28],leave:[5,42],vendorEarly:45, // il venditore arriva fino a 45 minuti prima di montare
 approach:[38,105],
 kerbClear:2.5,          // banchi ad almeno 2,5 m dal bordo della carreggiata: la linea dei pedoni (1,7 m) resta libera      // i clienti arrivano a piedi da 38–105 m lungo i marciapiedi delle vie
 viewPad:6,callCooldown:7,callChance:.3,callRange:24
});
// spostamento della tela sollevata rispetto al palo (2.5D: l'altezza si vede verso l'alto)
export const PARASOL_LIFT=Object.freeze({x:-.45,y:-3.1});
const VIVID=['#c8352f','#2f6fb3','#e6c33c','#3f8a46','#d9822b','#7b5aa6'];
// Dal foglio mercato-banchi.csv (misure reali in metri). goods = come disegnare la merce segnaposto.
export const MARKET_TYPES=Object.freeze([
 {id:'B01',priority:'P0',name:'frutta e verdura',count:4,w:4,d:2,cover:'ombrellone',umbrella:{d:3.5,shape:'quadrato',colors:['#2f5a33','#efe3c4'],stripes:true},goods:'frutta',palette:['#3f6b3a','#e08a2c','#b8372e','#8a6a45'],calls:['Pomodori freschi!','Arance dolci, signò!','Venite, venite!']},
 {id:'B02',priority:'P1',name:'pesce',count:1,w:3,d:2,cover:'ombrellone',umbrella:{d:3,shape:'quadrato',colors:['#2f5d8a','#e8eef2'],stripes:true},goods:'pesce',palette:['#2f5d8a','#e8eef2','#b9c3c9'],calls:['Alici fresche!','Pesce di giornata!']},
 {id:'B03',priority:'P1',name:'salumi e formaggi',count:1,w:3,d:2,cover:'furgone-negozio',umbrella:null,goods:'salumi',palette:['#efe3c4','#9b3b34','#f4f1e8'],calls:['Assaggiate la provola!']},
 {id:'B04',priority:'P0',name:'abbigliamento',count:4,w:4,d:2,cover:'ombrellone',umbrella:{d:3.5,shape:'quadrato',colors:'vivaci',stripes:true},goods:'vestiti',palette:['#d8c8a8',...VIVID],calls:['Tutto a cinque euro!','Signora, guardi qua!']},
 {id:'B05',priority:'P1',name:'scarpe',count:2,w:3,d:2,cover:'ombrellone',umbrella:{d:3,shape:'quadrato',colors:['#b8372e','#f0f0f0'],stripes:true},goods:'scarpe',palette:['#6b4a33','#2a2a2a','#f0f0f0'],calls:['Scarpe in pelle!']},
 {id:'B06',priority:'P1',name:'casalinghi',count:2,w:4,d:2,cover:'tenda',umbrella:{d:4,shape:'rettangolare',colors:['#7d858b','#d9822b'],stripes:true},goods:'casalinghi',palette:['#a7adb3','#d9822b','#4d9ad6','#e6c33c'],calls:['Pentole e padelle!']},
 {id:'B07',priority:'P2',name:'detersivi e prodotti per la casa',count:1,w:3,d:2,cover:'ombrellone',umbrella:{d:3,shape:'quadrato',colors:['#4d9ad6','#f2f4f6'],stripes:true},goods:'detersivi',palette:['#4d9ad6','#e6c33c','#7b5aa6'],calls:[]},
 {id:'B08',priority:'P2',name:'giocattoli',count:1,w:3,d:2,cover:'ombrellone',umbrella:{d:3,shape:'tondo',colors:['#c8352f','#e6c33c','#2f6fb3','#3f8a46'],stripes:true},goods:'giocattoli',palette:['#c8352f','#e6c33c','#2f6fb3'],calls:['Giocattoli per i bambini!']},
 {id:'B09',priority:'P1',name:'fiori e piante',count:1,w:3,d:2,cover:'ombrellone',umbrella:{d:3,shape:'tondo',colors:['#3f6b3a','#f2efe6'],stripes:false},goods:'fiori',palette:['#3f7a3a','#d97a9a','#e8c84a','#b5643a'],calls:['Fiori freschi!']},
 {id:'B10',priority:'P2',name:'borse e cinture',count:2,w:3,d:2,cover:'ombrellone',umbrella:{d:3,shape:'quadrato',colors:['#262626','#c9a24a'],stripes:false},goods:'borse',palette:['#2a2a2a','#6b4a33','#c9a24a'],calls:[]},
 {id:'B11',priority:'P2',name:'intimo e calze',count:1,w:3,d:2,cover:'ombrellone',umbrella:{d:3,shape:'quadrato',colors:['#e6a6b8','#f7f2f2'],stripes:true},goods:'intimo',palette:['#e6a6b8','#a6c8e6','#f2e6a6'],calls:[]},
 {id:'B12',priority:'P2',name:'bigiotteria e accessori',count:1,w:2,d:1.5,cover:'ombrellone',umbrella:{d:2.5,shape:'tondo',colors:['#6b4a8a','#f2eef6'],stripes:true},goods:'bigiotteria',palette:['#6b4a8a','#c9ccd2','#c9a24a'],calls:[]},
 {id:'B13',priority:'P1',name:'porchetta e panini (street food)',count:1,w:4,d:2.5,cover:'furgone-negozio',umbrella:null,goods:'porchetta',palette:['#8a6a45','#a3392f','#efe3c4'],calls:['Panino con la porchetta!']},
 {id:'B14',priority:'P2',name:'olive, sottaceti e legumi',count:1,w:3,d:2,cover:'ombrellone',umbrella:{d:3,shape:'quadrato',colors:['#d8b84a','#6b7a3a'],stripes:true},goods:'olive',palette:['#6b7a3a','#d8b84a','#b33a2a'],calls:['Olive di Gaeta!']}
]);
/* Punto di aggancio per l'arte definitiva: MARKET_ART[id] = {draw(c,stall,build,clock)} sostituisce il
 * banco segnaposto di quel tipo (per esempio disegnando uno sprite). Vuota = tutti PLACEHOLDER. */
export const MARKET_ART={};
/* Lotto 3 (CODEX-GH, 2026-10-21): atlante dei 14 banchi visti dall'alto + 4 teli, RGBA 384×144,
 * griglia 6×3 di celle 64×48 a 8 pixel sorgente per unità di gioco (2× rispetto a PX=4 dei
 * segnaposto): ogni cella copre 8×6 unità e il piano colorato (48/36/24 px) coincide quasi con stall.w.
 * Cella di B01…B14 = Number(id.slice(1))-1; i teli T1–T4 stanno nelle celle 14–17 e oggi il gioco
 * NON li disegna (le «tende» del mercato sono coperture appese di B06, non piani di banco).
 * L'immagine si carica una volta sola e registra MARKET_ART[B01…B14] solo quando è pronta: senza PNG
 * (o in Node) restano i segnaposto. Grafica PROVVISORIA da approvare da Simone. */
export const MARKET_ATLAS_PATH='./assets/market/mercato-banchi-14-teli-4-rgba.png';
export const MARKET_ATLAS_CELL=Object.freeze({width:64,height:48,columns:6,rows:3});
export const MARKET_ATLAS_PX=8; // pixel dell'atlante per unità di gioco
export const MARKET_CLOTH_IDS=Object.freeze(['T1','T2','T3','T4']);
export const MARKET_ART_FADE=Object.freeze({from:.75,to:.95}); // montaggio: sprite in dissolvenza sopra il bancone del segnaposto
export function marketArtCell(id){
 const m=/^([BT])(\d{1,2})$/.exec(String(id||''));if(!m)return null;
 const n=Number(m[2]),{width,height,columns}=MARKET_ATLAS_CELL;
 const index=m[1]==='B'?(n>=1&&n<=MARKET_TYPES.length?n-1:-1):(n>=1&&n<=MARKET_CLOTH_IDS.length?MARKET_TYPES.length+n-1:-1);
 if(index<0)return null;
 return {index,sx:(index%columns)*width,sy:Math.floor(index/columns)*height,sw:width,sh:height};
}
let marketAtlas=null,marketAtlasRequested=false;
const atlasSized=img=>!!img&&(img.complete??true)&&(img.naturalWidth||img.width)===MARKET_ATLAS_CELL.width*MARKET_ATLAS_CELL.columns&&(img.naturalHeight||img.height)===MARKET_ATLAS_CELL.height*MARKET_ATLAS_CELL.rows;
/* Registra l'arte dei 14 tipi (image = atlante già caricato o un oggetto con le stesse misure). */
export function registerMarketArt(image){
 if(!atlasSized(image))return false;
 marketAtlas=image;
 for(const type of MARKET_TYPES){
  const cell=marketArtCell(type.id);
  if(cell)MARKET_ART[type.id]={cell,source:'lotto3',draw:(c,stall,build,clock)=>drawStallSprite(c,stall,type,cell,build,clock)};
 }
 return true;
}
export function clearMarketArt(){marketAtlas=null;marketAtlasRequested=false;for(const k of Object.keys(MARKET_ART))delete MARKET_ART[k];}
export function marketArtReady(){return !!marketAtlas;}
export function loadMarketArt(){
 if(marketAtlasRequested||typeof Image==='undefined')return;
 marketAtlasRequested=true;
 const img=new Image();
 img.onload=()=>{if(!registerMarketArt(img))console.warn('GTA Melito: atlante del mercato con misure inattese; restano i banchi segnaposto');};
 img.onerror=()=>console.warn('GTA Melito: atlante del mercato non disponibile; restano i banchi segnaposto');
 img.src=new URL(MARKET_ATLAS_PATH,import.meta.url).href;
}
/* File di banchi (coordinate di gioco). face = direzione verso i clienti. Le file attorno alla
 * pensilina OSM (x 1162,6–1172,5, y 934–961) hanno la schiena verso di essa. */
const ROWS=[
 {axis:'x',at:933.4,from:1145,to:1191,face:Math.PI/2},
 {axis:'x',at:963.4,from:1145,to:1191,face:-Math.PI/2},
 {axis:'y',at:1147.2,from:936.5,to:961,face:0},
 {axis:'y',at:1160.5,from:938,to:958,face:Math.PI},
 {axis:'y',at:1174.6,from:938,to:958,face:0},
 {axis:'y',at:1188.8,from:936.5,to:961,face:Math.PI}
];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const hash=n=>{let x=(Number(n)||1)|0;x=Math.imul(x^x>>>16,2246822519);x=Math.imul(x^x>>>13,3266489917);return (x^x>>>16)>>>0;};
const rand=n=>hash(n)/4294967295;
const between=(range,seed)=>range[0]+(range[1]-range[0])*rand(seed);
const mod=(n,m)=>((n%m)+m)%m;

/* Calendario: giorno, giorno della settimana, fase e affluenza (0..1) all'ora data. */
export function marketCalendar(minutes,{force=false}={}){
 const day=npcDay(minutes),t=mod(Number(minutes)||0,NPC_DAY_MINUTES),R=MARKET_RULES;
 const marketDay=!!force||mod(day,7)===R.weekday;
 let phase='chiuso';
 if(marketDay){
  if(t>=R.setup[0]&&t<R.setup[1])phase='montaggio';
  else if(t>=R.open[0]&&t<R.open[1])phase='aperto';
  else if(t>=R.teardown[0]&&t<R.teardown[1])phase='smontaggio';
 }
 // più gente la mattina tardi; nessun nuovo cliente nell'ultima mezz'ora
 const curve=[[450,.15],[540,.6],[630,1],[720,1],[780,.4],[810,0]];
 let crowd=0;
 if(phase==='aperto')for(let i=1;i<curve.length;i++)if(t<=curve[i][0]){
  const [a,va]=curve[i-1],[b,vb]=curve[i];crowd=va+(vb-va)*clamp((t-a)/(b-a),0,1);break;}
 return {day,weekday:npcWeekday(minutes),marketDay,phase,minute:t,crowd};
}
/* Quanto è montato il banco (0 = solo il segno a terra, 1 = completo) secondo l'orario. */
export function stallTargetBuild(stall,cal){
 if(!cal.marketDay)return 0;
 return cal.minute>=stall.arriveAt&&cal.minute<stall.leaveAt?1:0;
}
function rectOf(cx,cy,halfX,halfY){return {x0:cx-halfX,y0:cy-halfY,x1:cx+halfX,y1:cy+halfY};}
function rectHit(r,x,y,pad=0){return x>=r.x0-pad&&x<=r.x1+pad&&y>=r.y0-pad&&y<=r.y1+pad;}
function rectsOverlap(a,b,pad=0){return a.x0<b.x1+pad&&a.x1>b.x0-pad&&a.y0<b.y1+pad&&a.y1>b.y0-pad;}
function rectCircle(r,c,pad=0){const qx=clamp(c.x,r.x0,r.x1),qy=clamp(c.y,r.y0,r.y1);return Math.hypot(c.x-qx,c.y-qy)<c.r+pad;}
function inBox(b,x,y){return x>=b[0]&&x<=b[2]&&y>=b[1]&&y<=b[3];}
function canopySize(type){
 if(!type.umbrella)return 0;
 return Math.max(type.umbrella.d*MARKET_RULES.scale,type.w*MARKET_RULES.scale*.9);
}
/* Posizionamento deterministico dei banchi lungo le file. ctx: walkable(x,y), carriageway(x,y,margin),
 * obstacles [{x,y,r}] (alberi, panchine, porte, auto). Un banco non va mai dentro edifici,
 * carreggiate, ostacoli o altri banchi, e davanti deve restare posto per i clienti. */
export function layoutMarketStalls(ctx={},{seed=4242}={}){
 const walkable=ctx.walkable||(()=>true),carriageway=ctx.carriageway||(()=>false),obstacles=ctx.obstacles||[];
 // tipi alternati a giro (mai tutti i banchi uguali vicini), con un inizio diverso per seme
 // a giro: prima i P0 del foglio (frutta e verdura, abbigliamento), poi P1 e P2
 const queue=[],order=[...MARKET_TYPES].sort((a,b)=>a.priority.localeCompare(b.priority)||((hash(seed+a.id.charCodeAt(2))%13)-(hash(seed+b.id.charCodeAt(2))%13)));
 for(let k=0;k<4;k++)for(const type of order)if(k<type.count)queue.push(type);
 const stalls=[],S=MARKET_RULES.scale;
 const fits=rect=>{
  const pts=[[rect.x0,rect.y0],[rect.x1,rect.y0],[rect.x0,rect.y1],[rect.x1,rect.y1],[(rect.x0+rect.x1)/2,(rect.y0+rect.y1)/2],
   [(rect.x0+rect.x1)/2,rect.y0],[(rect.x0+rect.x1)/2,rect.y1],[rect.x0,(rect.y0+rect.y1)/2],[rect.x1,(rect.y0+rect.y1)/2]];
  if(!pts.every(([x,y])=>inBox(MARKET_AREA.stallBox,x,y)&&walkable(x,y)&&!carriageway(x,y,MARKET_RULES.kerbClear)))return false;
  if(obstacles.some(o=>rectCircle(rect,o,.2)))return false;
  if(stalls.some(s=>s.fronts.some(f=>rectHit(rect,f.x,f.y,.6))))return false; // non copre i clienti di un altro banco
  return !stalls.some(s=>rectsOverlap(s.rect,rect,MARKET_RULES.gap*.5));
 };
 // la tela sollevata (2.5D) non deve coprire le chiome degli alberi né le auto in sosta
 const canopyClear=(cx,cy,type)=>{
  const size=canopySize(type);if(!size)return true;
  const r=rectOf(cx+PARASOL_LIFT.x,cy+PARASOL_LIFT.y,size/2,size/2);
  return !obstacles.some(o=>o.crown&&rectCircle(r,{x:o.x,y:o.y,r:o.crown},0));
 };
 const frontFree=(cx,cy,face,depth,width)=>{
  const fx=Math.cos(face),fy=Math.sin(face),lx=-fy,ly=fx;
  for(const along of [-width/4,width/4]){
   const x=cx+fx*(depth/2+1.4)+lx*along,y=cy+fy*(depth/2+1.4)+ly*along;
   if(!walkable(x,y)||carriageway(x,y,.1)||obstacles.some(o=>Math.hypot(o.x-x,o.y-y)<(o.walkR??o.r)+.4))return false;
   if(stalls.some(s=>rectHit(s.rect,x,y,.5)))return false;
  }
  return true;
 };
 for(const row of ROWS){
  let pos=row.from;
  while(queue.length&&pos<row.to){
   // il primo tipo in coda che entra qui (un banco profondo non blocca la fila)
   let pick=null;
   for(const type of new Set(queue)){
    const w=type.w*S,d=type.d*S;if(pos+w>row.to)continue;
    const along=pos+w/2,cx=row.axis==='x'?along:row.at,cy=row.axis==='x'?row.at:along;
    const rect=row.axis==='x'?rectOf(cx,cy,w/2,d/2):rectOf(cx,cy,d/2,w/2);
    if(fits(rect)&&frontFree(cx,cy,row.face,d,w)&&canopyClear(cx,cy,type)){pick={type,w,d,cx,cy,rect};break;}
   }
   if(pick){
    const {type,w,d,cx,cy,rect}=pick;
    queue.splice(queue.indexOf(type),1);
    const i=stalls.length,fx=Math.cos(row.face),fy=Math.sin(row.face),lx=-fy,ly=fx;
    const colors=type.umbrella?.colors==='vivaci'?[VIVID[(i*5+2)%VIVID.length],'#f2ead8']:type.umbrella?.colors||null;
    stalls.push({id:'S'+String(i+1).padStart(2,'0'),n:i+1,type:type.id,x:cx,y:cy,w,d,face:row.face,rect,
     vendor:{x:cx-fx*(d/2-.75),y:cy-fy*(d/2-.75)},
     fronts:[-w/4,w/4].map(o=>({x:cx+fx*(d/2+1.4)+lx*o,y:cy+fy*(d/2+1.4)+ly*o,a:row.face+Math.PI,taken:null})),
     canopy:type.umbrella?{size:canopySize(type),shape:type.umbrella.shape,colors,stripes:type.umbrella.stripes}:null,
     arriveAt:MARKET_RULES.setup[0]+between(MARKET_RULES.arrive,seed+i*17),
     leaveAt:MARKET_RULES.teardown[0]+between(MARKET_RULES.leave,seed+i*29),
     buildRate:1/between(MARKET_RULES.buildMinutes,seed+i*41),
     build:0,reveal:0,seed:seed+i*97});
    pos+=w+MARKET_RULES.gap;
   }else pos+=1;
  }
 }
 return stalls;
}
/* Griglia di 1 m per i percorsi a piedi dentro e attorno all'area. */
export function buildMarketGrid(stalls,ctx={}){
 const walkable=ctx.walkable||(()=>true),carriageway=ctx.carriageway||(()=>false),obstacles=ctx.obstacles||[];
 const [x0,y0,x1,y1]=MARKET_AREA.gridBox,W=Math.round(x1-x0)+1,H=Math.round(y1-y0)+1;
 const free=new Uint8Array(W*H);
 for(let j=0;j<H;j++)for(let i=0;i<W;i++){
  const x=x0+i,y=y0+j;
  // una cella è libera solo se lo è tutto il suo quadrato: niente angoli di muri tagliati
  const square=[[0,0],[-.48,-.48],[.48,-.48],[-.48,.48],[.48,.48]];
  free[j*W+i]=square.every(([dx,dy])=>walkable(x+dx,y+dy))&&!carriageway(x,y,.1)&&!stalls.some(s=>rectHit(s.rect,x,y,.45))&&
   !obstacles.some(o=>Math.hypot(o.x-x,o.y-y)<(o.walkR??o.r))?1:0;
 }
 return {x0,y0,W,H,free};
}
const cellOf=(g,x,y)=>({i:clamp(Math.round(x-g.x0),0,g.W-1),j:clamp(Math.round(y-g.y0),0,g.H-1)});
const isFree=(g,i,j)=>i>=0&&j>=0&&i<g.W&&j<g.H&&g.free[j*g.W+i]===1;
function nearestFree(g,x,y,max=4){
 const c=cellOf(g,x,y);
 for(let r=0;r<=max;r++)for(let dj=-r;dj<=r;dj++)for(let di=-r;di<=r;di++){
  if(Math.max(Math.abs(di),Math.abs(dj))!==r)continue;
  if(isFree(g,c.i+di,c.j+dj))return {i:c.i+di,j:c.j+dj};
 }
 return null;
}
/* A* a 8 direzioni sulla griglia; restituisce punti del mondo (con scorciatoie in linea retta). */
export function findMarketPath(g,from,to,blocked=null){
 const a=nearestFree(g,from.x,from.y),b=nearestFree(g,to.x,to.y);
 if(!a||!b)return null;
 const N=g.W*g.H,start=a.j*g.W+a.i,goal=b.j*g.W+b.i;
 const cost=new Float32Array(N).fill(Infinity),prev=new Int32Array(N).fill(-1),done=new Uint8Array(N);
 const open=[start];cost[start]=0;
 const h=k=>{const dx=Math.abs(k%g.W-b.i),dy=Math.abs(Math.floor(k/g.W)-b.j);return Math.max(dx,dy)+.414*Math.min(dx,dy);};
 while(open.length){
  let best=0;for(let k=1;k<open.length;k++)if(cost[open[k]]+h(open[k])<cost[open[best]]+h(open[best]))best=k;
  const cur=open.splice(best,1)[0];
  if(cur===goal)break;
  if(done[cur])continue;done[cur]=1;
  const ci=cur%g.W,cj=Math.floor(cur/g.W);
  for(let dj=-1;dj<=1;dj++)for(let di=-1;di<=1;di++){
   if(!di&&!dj)continue;
   const ni=ci+di,nj=cj+dj;
   if(!isFree(g,ni,nj)||(di&&dj&&(!isFree(g,ci+di,cj)||!isFree(g,ci,cj+dj))))continue;
   const k=nj*g.W+ni;if(blocked&&blocked(g.x0+ni,g.y0+nj)&&k!==goal)continue;
   const c=cost[cur]+(di&&dj?1.414:1);
   if(c<cost[k]){cost[k]=c;prev[k]=cur;open.push(k);}
  }
 }
 if(prev[goal]<0&&goal!==start)return null;
 const cells=[];for(let k=goal;k>=0;k=k===start?-1:prev[k])cells.push(k);
 cells.reverse();
 const pts=cells.map(k=>({x:g.x0+k%g.W,y:g.y0+Math.floor(k/g.W)}));
 // scorciatoie: salta i punti intermedi se la linea retta resta su celle libere
 const clear=(p,q)=>{const n=Math.ceil(Math.hypot(q.x-p.x,q.y-p.y)*4);for(let s=1;s<n;s++){const c=cellOf(g,p.x+(q.x-p.x)*s/n,p.y+(q.y-p.y)*s/n);if(!isFree(g,c.i,c.j))return false;}return true;};
 const out=[pts[0]];
 for(let k=1;k<pts.length;k++){if(k===pts.length-1||!clear(out.at(-1),pts[k+1]))out.push(pts[k]);}
 out.push({x:to.x,y:to.y});
 return out;
}
/* Percorsi d'arrivo: lungo il marciapiede di ciascuna via del mercato (dalla parte dell'isolato),
 * da 38–105 m fino al bordo della griglia. ctx.roads: [{n,p}], ctx.roadHalf(road), ctx.walkable. */
export function marketApproaches(ctx={}){
 const roads=(ctx.roads||[]).filter(r=>MARKET_AREA.streets.includes(r.n)),walkable=ctx.walkable||(()=>true);
 const [cx,cy]=MARKET_AREA.centre,out=[];
 for(const road of roads){
  const p=road.p,half=(ctx.roadHalf?ctx.roadHalf(road):3.5)+1.7;
  // punti lungo la polilinea, spostati sul lato dell'isolato
  const pts=[];
  for(let i=2;i<p.length;i+=2){
   const ax=p[i-2],ay=p[i-1],bx=p[i],by=p[i+1],len=Math.hypot(bx-ax,by-ay);if(len<.01)continue;
   const nx=-(by-ay)/len,ny=(bx-ax)/len,side=((cx-ax)*nx+(cy-ay)*ny)>=0?1:-1;
   for(let s=0;s<len;s+=1){const t=s/len;pts.push({x:ax+(bx-ax)*t+nx*half*side,y:ay+(by-ay)*t+ny*half*side});}
  }
  if(pts.length<2)continue;
  let k=0,best=Infinity;pts.forEach((q,i)=>{const d=Math.hypot(q.x-cx,q.y-cy);if(d<best){best=d;k=i;}});
  for(const dir of [1,-1]){
   const path=[];
   for(let i=k;i>=0&&i<pts.length;i+=dir){
    const q=pts[i];if(!walkable(q.x,q.y))break;
    path.push(q);
    if(Math.hypot(q.x-cx,q.y-cy)>MARKET_RULES.approach[1])break;
   }
   // dal punto lontano verso l'area; serve una parte dentro la griglia e una parte lontana
   const far=path.findLastIndex(q=>Math.hypot(q.x-cx,q.y-cy)>=MARKET_RULES.approach[0]);
   const inside=path.findIndex(q=>inBox(MARKET_AREA.gridBox,q.x,q.y));
   if(far<0||inside<0||inside>=far)continue;
   const leg=path.slice(inside,far+1).reverse().filter((q,i,a)=>i%2===0||i===a.length-1); // punti ogni 2 m: le corde restano sul marciapiede
   out.push({road:road.n,points:leg,entry:leg.at(-1),source:leg[0]});
  }
 }
 return out;
}
/* Mercato completo: banchi, griglia, percorsi d'arrivo, persone (vuoto finché non è giorno di mercato). */
export function createMarket(ctx={},{seed=4242}={}){
 const stalls=layoutMarketStalls(ctx,{seed});
 const grid=buildMarketGrid(stalls,ctx);
 const approaches=marketApproaches(ctx).filter(a=>{const c=cellOf(grid,a.entry.x,a.entry.y);return isFree(grid,c.i,c.j)||!!nearestFree(grid,a.entry.x,a.entry.y,2);});
 return {stalls,grid,approaches,people:[],vendors:new Map(),clock:0,seed,spawnCool:0,callCool:3,index:null,
  initialised:false,stats:{arrived:0,bought:0,left:0,placedUnseen:0,vanishedUnseen:0},nextId:1};
}
// il punto del percorso d'arrivo più vicino all'area che il giocatore non vede (cammino più breve)
function hiddenStart(ap,view){
 for(let i=ap.points.length-2;i>=0;i--)if(!visible(view,ap.points[i].x,ap.points[i].y))return i;
 return -1;
}
const visible=(view,x,y,pad=MARKET_RULES.viewPad)=>!!view&&x>=view[0]-pad&&x<=view[2]+pad&&y>=view[1]-pad&&y<=view[3]+pad;
const areaVisible=(view)=>{const b=MARKET_AREA.gridBox;return !!view&&b[2]>=view[0]-MARKET_RULES.viewPad&&b[0]<=view[2]+MARKET_RULES.viewPad&&b[3]>=view[1]-MARKET_RULES.viewPad&&b[1]<=view[3]+MARKET_RULES.viewPad;};
function newPerson(m,x,y,role,extra={}){
 const id=m.nextId++,seed=m.seed*7+id*131;
 const person={x,y,a:0,prevX:x,prevY:y,prevA:0,body:'walk',market:true,role,seed,kind:hash(seed)%PEDESTRIAN_KIND_COUNT,
  speed:role==='vendor'?MARKET_RULES.vendorSpeed:between(MARKET_RULES.customerSpeed,seed),braking:true,
  route:[],state:'idle',wait:0,id,...extra};
 m.people.push(person);
 if(m.index)addToCollisionIndex(m.index,person);
 return person;
}
function removePerson(m,person){
 const i=m.people.indexOf(person);if(i>=0)m.people.splice(i,1);
 if(person.spot)person.spot.taken=null;
 if(m.index){person.indoors=true;moveInCollisionIndex(m.index,person,person.x,person.y);}
}
function moveTo(m,person,x,y){
 const ox=person.x,oy=person.y;person.x=x;person.y=y;
 if(m.index)moveInCollisionIndex(m.index,person,ox,oy);
}
// Segue i punti del percorso; true quando è arrivato.
function walk(m,person,dt,ctx){
 if(!person.route.length)return true;
 const target=person.route[0],dx=target.x-person.x,dy=target.y-person.y,d=Math.hypot(dx,dy);
 const step=person.speed*dt;
 // non passa attraverso il giocatore a piedi: aspetta, poi ricalcola
 const pl=ctx.player;
 if(pl&&pl.onFoot&&d>.01){
  const nx=person.x+dx/d*Math.min(step,d),ny=person.y+dy/d*Math.min(step,d);
  if(Math.hypot(nx-pl.x,ny-pl.y)<1.1&&Math.hypot(person.x-pl.x,person.y-pl.y)>=1.05){person.braking=true;person.blockedFor=(person.blockedFor||0)+dt;return false;}
 }
 person.blockedFor=0;person.braking=false;
 if(d<=step){moveTo(m,person,target.x,target.y);person.route.shift();return !person.route.length;}
 person.a=Math.atan2(dy,dx);
 moveTo(m,person,person.x+dx/d*step,person.y+dy/d*step);
 return false;
}
function freeSpot(m,seed){
 const open=m.stalls.filter(s=>s.build>=.95);
 if(!open.length)return null;
 for(let k=0;k<open.length;k++){
  const s=open[(seed+k*7)%open.length];
  const spot=s.fronts.find(f=>!f.taken);
  if(spot)return {stall:s,spot};
 }
 return null;
}
function routeInside(m,person,to){
 const path=findMarketPath(m.grid,person,to);
 person.route=path?path.slice(1):[{x:to.x,y:to.y}];
 return !!path;
}
function sendToStall(m,person){
 const pick=freeSpot(m,hash(person.seed+person.visits*13));
 if(!pick){person.state='leave';return planExit(m,person);}
 pick.spot.taken=person;person.spot=pick.spot;person.stall=pick.stall;
 person.state='browse';routeInside(m,person,pick.spot);
}
function planExit(m,person){
 if(person.spot){person.spot.taken=null;person.spot=null;}
 const ap=m.approaches.length?m.approaches[hash(person.seed+(person.visits||0)*3)%m.approaches.length]:null;
 person.exit=ap;person.state='leave';
 if(person.role==='vendor'&&person.stall){
  // esce dal banco dallo stesso lato da cui è entrato, poi segue la griglia
  const door=adjacentToStall(m,person.stall),path=ap?findMarketPath(m.grid,door,ap.entry):null;
  person.route=[door,...(path?path.slice(1):[])];return;
 }
 if(ap)routeInside(m,person,ap.entry);else person.route=[];
}
/* Passo del mercato. ctx: {minutes, force, view, player:{x,y,onFoot,vehicle}, index, say, advanceImpact} */
export function stepMarket(m,dt,ctx={}){
 if(!m)return null;
 const elapsed=clamp(Number(dt)||0,0,.1),R=MARKET_RULES;
 m.clock+=elapsed;
 if(ctx.index&&m.index!==ctx.index){m.index=ctx.index;for(const q of m.people)addToCollisionIndex(m.index,q);}
 const cal=marketCalendar(ctx.minutes,{force:ctx.force});m.calendar=cal;
 const view=ctx.view,seen=areaVisible(view);
 for(const q of m.people){q.prevX=q.x;q.prevY=q.y;q.prevA=q.a;}
 // 1) banchi: montaggio e smontaggio graduali; fuori vista si portano subito allo stato dovuto
 for(const s of m.stalls){
  const target=stallTargetBuild(s,cal);
  let vendor=m.vendors.get(s.id);
  const needed=cal.marketDay&&cal.minute>=s.arriveAt-R.vendorEarly&&cal.minute<s.leaveAt;
  if(needed&&!vendor){
   if(!visible(view,s.vendor.x,s.vendor.y)||!m.initialised){
    vendor=newPerson(m,s.vendor.x,s.vendor.y,'vendor',{stall:s,state:'work',a:s.face});m.stats.placedUnseen++;
   }else if(m.approaches.length){
    // il primo percorso d'arrivo (a partire da uno scelto dal seme) che ha un tratto fuori vista
    for(let t=0;t<m.approaches.length&&!vendor;t++){
     const ap=m.approaches[(hash(s.seed)+t)%m.approaches.length],k=hiddenStart(ap,view);
     if(k>=0){vendor=newPerson(m,ap.points[k].x,ap.points[k].y,'vendor',{stall:s,state:'come',route:ap.points.slice(k+1)});vendor.inside=false;}
    }
   }
   if(vendor)m.vendors.set(s.id,vendor);
  }
  const atWork=vendor&&vendor.state==='work';
  const blockedSlot=s.build<.05&&target>0&&ctx.player&&rectHit(s.rect,ctx.player.x,ctx.player.y,ctx.player.onFoot?.6:3.5);
  if(!m.initialised||(!visible(view,s.x,s.y,10)&&(target===0||atWork)))s.build=target;
  else if(target>0&&atWork&&!blockedSlot)s.build=Math.min(1,s.build+s.buildRate*elapsed);
  else if(target===0)s.build=Math.max(0,s.build-s.buildRate*1.3*elapsed);
  if(!needed&&s.build<=0&&vendor&&vendor.state==='work'){
   if(!visible(view,vendor.x,vendor.y)){removePerson(m,vendor);m.vendors.delete(s.id);m.stats.vanishedUnseen++;}
   else{vendor.state='go';vendor.stall=s;planExit(m,vendor);}
  }
 }
 // 2) clienti: quanti ne servono adesso
 const openStalls=m.stalls.filter(s=>s.build>=.95).length;
 const want=Math.round(cal.crowd*R.maxCustomers*Math.min(1,openStalls/Math.max(1,m.stalls.length*.6)));
 const customers=m.people.filter(q=>q.role==='customer');
 const staying=customers.filter(q=>q.state!=='leave'&&q.state!=='depart');
 m.spawnCool-=elapsed;
 if(staying.length<want&&customers.length<R.maxCustomers+6&&openStalls){
  if(!seen||!m.initialised){
   // fuori vista: compaiono già davanti a un banco (nessuno li vede comparire)
   for(let k=staying.length;k<want;k++){
    const pick=freeSpot(m,hash(m.seed+m.nextId*31));if(!pick)break;
    const q=newPerson(m,pick.spot.x,pick.spot.y,'customer',{state:'buy',visits:1,wait:between(R.buy,m.nextId*7),a:pick.spot.a});
    pick.spot.taken=q;q.spot=pick.spot;q.stall=pick.stall;m.stats.placedUnseen++;
   }
  }else if(m.spawnCool<=0){
   const free=m.approaches.map(a=>({a,k:hiddenStart(a,view)})).filter(x=>x.k>=0);
   if(free.length){
    const {a:ap,k}=free[hash(m.seed+m.nextId*17)%free.length];
    newPerson(m,ap.points[k].x,ap.points[k].y,'customer',{state:'arrive',visits:0,route:ap.points.slice(k+1),approach:ap});
    m.spawnCool=1.4;m.stats.arrived++;
   }
  }
 }else if(staying.length>want+1){
  // troppa gente per l'ora: il primo che ha finito di comprare se ne va
  const q=staying.find(q=>q.state==='buy');if(q)q.wait=Math.min(q.wait,.5);
 }
 // 3) fuori vista non serve camminare: chi va a un banco ci arriva, a mercato chiuso i clienti spariscono
 if(!seen&&m.initialised)for(const q of [...m.people]){
  if(q.impactTime>0)continue;
  if(q.role==='customer'){
   if(cal.phase!=='aperto'){removePerson(m,q);m.stats.vanishedUnseen++;continue;}
   if((q.state==='browse'||q.state==='arrive')&&q.spot){moveTo(m,q,q.spot.x,q.spot.y);q.route=[];q.state='buy';q.wait=between(R.buy,q.seed+3);q.a=q.spot.a;}
  }else if(q.role==='vendor'&&(q.state==='come'||q.state==='step-in')&&q.stall){moveTo(m,q,q.stall.vendor.x,q.stall.vendor.y);q.route=[];q.state='work';q.a=q.stall.face;}
 }
 // 4) movimento di ciascuno
 for(const q of [...m.people]){
  if(q.impactTime>0){
   if(ctx.advanceImpact)ctx.advanceImpact(q,elapsed);
   q.repath=true;continue;
  }
  if(q.repath){q.repath=false;
   if(q.role==='customer'&&(q.state==='browse'||q.state==='buy')){q.state='browse';if(q.spot)routeInside(m,q,q.spot);}
   else if(q.state==='leave'&&q.exit)routeInside(m,q,q.exit.entry);
  }
  if(q.role==='vendor'){
   if(q.state==='come'){
    if(walk(m,q,elapsed,ctx)){
     if(!q.inside){q.inside=true;routeInside(m,q,adjacentToStall(m,q.stall));}
     else{q.route=[{x:q.stall.vendor.x,y:q.stall.vendor.y}];q.state='step-in';}
    }
   }else if(q.state==='step-in'){if(walk(m,q,elapsed,ctx)){q.state='work';q.a=q.stall.face;}}
   else if(q.state==='work'){vendorIdle(m,q,elapsed);q.sheltered=!!q.stall.canopy&&q.stall.build>=.75;}
   else if(q.state==='go'||q.state==='leave'){
    if(walk(m,q,elapsed,ctx)){q.state='depart';q.route=q.exit?[...q.exit.points].reverse().slice(1):[];}
   }else if(q.state==='depart'){
    const done=walk(m,q,elapsed,ctx);
    if(done&&!visible(view,q.x,q.y)){removePerson(m,q);m.vendors.delete(q.stall.id);}
   }
   continue;
  }
  q.sheltered=q.state==='buy'&&!!q.stall?.canopy;
  if(q.state==='arrive'){if(walk(m,q,elapsed,ctx))sendToStall(m,q);}
  else if(q.state==='browse'){
   if(walk(m,q,elapsed,ctx)){q.state='buy';q.wait=between(R.buy,q.seed+q.visits*11);q.a=q.spot?q.spot.a:q.a;q.braking=true;}
   else if(q.blockedFor>2.5){q.blockedFor=0;q.repath=true;}
  }else if(q.state==='buy'){
   q.braking=true;q.wait-=elapsed;
   if(q.stall&&q.stall.build<.95)q.wait=Math.min(q.wait,.3);
   if(q.wait<=0){
    q.visits=(q.visits||0)+1;m.stats.bought++;
    if(q.spot){q.spot.taken=null;q.spot=null;}
    const max=1+hash(q.seed)%R.visits[1];
    if(q.visits<max&&cal.crowd>.05)sendToStall(m,q);else planExit(m,q);
   }
  }else if(q.state==='leave'){
   if(!visible(view,q.x,q.y)){removePerson(m,q);m.stats.vanishedUnseen++;continue;}
   if(walk(m,q,elapsed,ctx)){q.state='depart';q.route=q.exit?[...q.exit.points].reverse().slice(1):[];}
   else if(q.blockedFor>2.5){q.blockedFor=0;q.repath=true;}
  }else if(q.state==='depart'){
   const done=walk(m,q,elapsed,ctx);
   if(!visible(view,q.x,q.y)||(done&&!visible(view,q.x,q.y,0))){removePerson(m,q);m.stats.left++;}
  }
 }
 // 5) voci dei venditori: rare, solo se il giocatore è vicino
 m.callCool-=elapsed;
 const pl=ctx.player;
 if(m.callCool<=0&&pl&&cal.phase==='aperto'&&ctx.say){
  const near=[...m.vendors.values()].filter(v=>v.state==='work'&&Math.hypot(v.x-pl.x,v.y-pl.y)<R.callRange&&MARKET_TYPES.find(t=>t.id===v.stall.type)?.calls.length);
  if(near.length&&rand(m.seed+Math.floor(m.clock*3))<R.callChance){
   const v=near[hash(m.seed+Math.floor(m.clock))%near.length],lines=MARKET_TYPES.find(t=>t.id===v.stall.type).calls;
   ctx.say(v,lines[hash(v.seed+Math.floor(m.clock))%lines.length]);
  }
  m.callCool=R.callCooldown;
 }
 m.initialised=true;
 return cal;
}
function adjacentToStall(m,s){
 // una cella libera accanto al banco (di lato o davanti), da cui il venditore entra dietro il bancone
 const fx=Math.cos(s.face),fy=Math.sin(s.face),lx=-fy,ly=fx,cands=[];
 for(const side of [1,-1])cands.push({x:s.vendor.x+lx*side*(s.w/2+1),y:s.vendor.y+ly*side*(s.w/2+1)});
 cands.push(s.fronts[0]);
 for(const c of cands){const f=nearestFree(m.grid,c.x,c.y,2);if(f)return {x:m.grid.x0+f.i,y:m.grid.y0+f.j};}
 return s.fronts[0];
}
function vendorIdle(m,v,dt){
 const s=v.stall;v.braking=true;
 // si gira verso il cliente più vicino al suo banco, altrimenti guarda il corridoio
 const client=s.fronts.map(f=>f.taken).filter(Boolean).sort((a,b)=>Math.hypot(a.x-v.x,a.y-v.y)-Math.hypot(b.x-v.x,b.y-v.y))[0];
 const want=client?Math.atan2(client.y-v.y,client.x-v.x):s.face;
 v.a+=Math.atan2(Math.sin(want-v.a),Math.cos(want-v.a))*Math.min(1,dt*4);
 // piccoli spostamenti dietro il bancone
 const lx=-Math.sin(s.face),ly=Math.cos(s.face),sway=Math.sin(m.clock*.35+v.seed)*Math.min(.9,s.w*.12);
 moveTo(m,v,s.vendor.x+lx*sway,s.vendor.y+ly*sway);
}
/* Collisioni: i banchi (non gli ombrelloni) fermano il giocatore a piedi e i veicoli. */
export function marketBlocksWalker(m,x,y,pad=.3){
 if(!m)return null;
 return m.stalls.find(s=>s.build>.05&&rectHit(s.rect,x,y,pad))||null;
}
function obbOverlap(rect,pose,shape){
 // SAT tra il rettangolo allineato del banco e la sagoma ruotata del veicolo: profondità o 0
 const c=Math.cos(pose.a),s=Math.sin(pose.a),hl=shape.halfLength,hw=shape.halfWidth;
 const rx=(rect.x0+rect.x1)/2,ry=(rect.y0+rect.y1)/2,rhx=(rect.x1-rect.x0)/2,rhy=(rect.y1-rect.y0)/2;
 const axes=[[1,0],[0,1],[c,s],[-s,c]];let depth=Infinity;
 for(const [ax,ay] of axes){
  const rr=rhx*Math.abs(ax)+rhy*Math.abs(ay);
  const vr=hl*Math.abs(c*ax+s*ay)+hw*Math.abs(-s*ax+c*ay);
  const dist=Math.abs((pose.x-rx)*ax+(pose.y-ry)*ay);
  const o=rr+vr-dist;if(o<=0)return 0;depth=Math.min(depth,o);
 }
 return depth;
}
/* Come in BF01: se il veicolo tocca già un banco, sono permesse le mosse che riducono la sovrapposizione. */
export function marketBlocksVehicle(m,pose,shape,vehicle=null){
 if(!m||!shape)return false;
 for(const s of m.stalls){
  if(s.build<=.05||Math.abs(pose.x-s.x)>s.w+9||Math.abs(pose.y-s.y)>s.w+9)continue;
  const depth=obbOverlap(s.rect,pose,shape);if(!depth)continue;
  const now=vehicle&&Number.isFinite(vehicle.x)?obbOverlap(s.rect,{x:vehicle.x,y:vehicle.y,a:vehicle.a},shape):0;
  if(!(now>0&&depth<now-1e-6))return true;
 }
 return false;
}
/* R01: l'ombrellone sfuma (come i tetti, roof-reveal) quando il giocatore, a piedi o in veicolo,
 * è sotto la tela o vicino al banco. */
export function parasolRevealTarget(stall,actors){
 if(!stall.canopy)return 0;
 const cx=stall.x+PARASOL_LIFT.x,cy=stall.y+PARASOL_LIFT.y,half=stall.canopy.size/2;
 for(const a of actors||[]){
  const r=a.radius||0;
  if(Math.abs(a.x-cx)<half+r+.8&&Math.abs(a.y-cy)<half+r+.8)return 1;
  if(rectHit(stall.rect,a.x,a.y,r+1.2))return 1;
 }
 return 0;
}
export function stepParasolReveal(m,actors,dt){
 if(!m)return;
 for(const s of m.stalls){
  if(!s.canopy)continue;
  s.reveal=easeRoofReveal(s.reveal||0,parasolRevealTarget(s,actors),dt);
 }
}

/* ---------- disegno ---------- */
const PX=4; // pixel dello sprite per unità di gioco (pixel art a blocchi)
const cache=new Map();
function sprite(key,w,h,paint){
 if(cache.has(key))return cache.get(key);
 if(typeof document==='undefined')return null;
 const cv=document.createElement('canvas');cv.width=Math.max(1,Math.ceil(w*PX));cv.height=Math.max(1,Math.ceil(h*PX));
 const g=cv.getContext('2d');paint(g,cv.width,cv.height);cache.set(key,cv);return cv;
}
const hex=c=>{const n=parseInt(c.slice(1),16);return [n>>16&255,n>>8&255,n&255];};
const shade=(rgb,f)=>rgb.map(v=>clamp(Math.round(v*f),0,255));
/* Tela dell'ombrellone in pixel art: quadrata a quattro falde (strisce parallele al bordo), tonda a
 * otto spicchi, rettangolare (tenda) a strisce; luce da nord-ovest, nervature, bordo smerlato. */
function paintCanopy(g,W,H,canopy,seed){
 const img=g.createImageData(W,H),cols=canopy.colors.map(hex);
 const put=(x,y,rgb,a=255)=>{const k=(y*W+x)*4;img.data[k]=rgb[0];img.data[k+1]=rgb[1];img.data[k+2]=rgb[2];img.data[k+3]=a;};
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){
  const u=(x+.5)/W*2-1,v=(y+.5)/H*2-1;
  if(canopy.shape==='tondo'){
   const r=Math.hypot(u,v);if(r>1)continue;
   const th=Math.atan2(v,u),seg=Math.floor((th+Math.PI)/(Math.PI*2)*8)%8;
   let rgb=canopy.stripes?cols[seg%cols.length]:(seg%2?shade(cols[0],.9):cols[0]);
   const light=1+.16*Math.cos(th+Math.PI*.75)*Math.min(1,r*1.4);
   rgb=shade(rgb,light*(1-.1*r));
   const edge=((th+Math.PI)/(Math.PI*2)*8)%1;
   if(edge<.06||edge>.94)rgb=shade(rgb,.82);
   if(r>.9){const sc=Math.floor((th+Math.PI)/(Math.PI*2)*24)%2;rgb=shade(cols[(seg+1)%cols.length],sc?.74:.86);}
   if(r<.09)rgb=r<.05?[245,240,226]:[70,62,55];
   put(x,y,rgb,r>.97?200:255);
  }else if(canopy.shape==='rettangolare'){
   const band=Math.floor((u+1)/2*8);let rgb=cols[band%cols.length];
   rgb=shade(rgb,1.08-.22*((v+1)/2));
   if(v>.78){rgb=shade(cols[(band+1)%cols.length],(Math.floor((u+1)*10)%2)?.72:.84);}
   if(Math.abs(v+.05)<.05)rgb=shade(rgb,.85);
   put(x,y,rgb);
  }else{
   const au=Math.abs(u),av=Math.abs(v),m=Math.max(au,av);
   const panel=av>=au?(v<0?0:2):(u<0?3:1); // 0 nord,1 est,2 sud,3 ovest
   // spicchi a strisce che convergono al pomolo, come i veri ombrelloni da mercato
   const t=(panel%2===0?u:v)/Math.max(.001,m),band=Math.floor((t+1)/2*6);
   let rgb=canopy.stripes?cols[band%cols.length]:cols[panel%cols.length];
   rgb=shade(rgb,[1.12,.9,.78,1.02][panel]*(1-.08*m));
   if(Math.abs(au-av)<.05)rgb=shade(rgb,.7); // nervature verso il centro
   if(m>.86&&m<=.95){const sc=Math.floor(((panel%2?v:u)+1)*8)%2;rgb=shade(cols[cols.length>1?1:0],sc?.66:.8);} // mantovana smerlata
   if(m>.95)rgb=shade(rgb,.55); // bordo
   if(m<.075)rgb=m<.04?[245,240,226]:[70,62,55]; // pomolo
   put(x,y,rgb);
  }
 }
 g.putImageData(img,0,0);
}
function canopyColorsKey(c){return c.shape+':'+c.colors.join(',')+':'+c.stripes;}
const STALL_WOOD='#7c5a3b',STALL_LEG='#3b2f27',CLOTH='#efe3c4';
/* Banco segnaposto: telo sul bancone, merce stilizzata nei colori del foglio, cassette per terra
 * durante il montaggio. Coordinate locali: x lungo il banco, y verso i clienti (+). */
function drawStallPlaceholder(c,s,type,build,clock){
 c.save();c.translate(s.x,s.y);c.rotate(s.face-Math.PI/2);
 if(build>=.999){
  // banco completo: disegnato una volta in uno sprite (telefono), solo il fumo resta animato
  const W=s.w+1.2,H=s.d+1.2;
  const img=sprite('stall:'+s.id+':'+s.type,W,H,(g,pw,ph)=>{g.scale(pw/W,ph/H);g.translate(W/2,H/2);drawStallLocal(g,s,type,1,0,false);});
  if(img){const was=c.imageSmoothingEnabled;c.imageSmoothingEnabled=false;c.drawImage(img,-W/2,-H/2,W,H);c.imageSmoothingEnabled=was;
   if(type.goods==='porchetta')drawSmoke(c,s,clock);c.restore();return;}
 }
 drawStallLocal(c,s,type,build,clock,true);
 c.restore();
}
/* Banco con lo sprite del lotto 3: stesse coordinate locali del segnaposto (x lungo il banco, +y
 * verso i clienti), così l'orlo di legno e l'ombra della cella guardano il corridoio dei clienti.
 * Fino a .75 resta il montaggio del segnaposto (casse per terra, poi bancone nudo); fra .75 e .95 lo
 * sprite completo sfuma sopra il bancone; da .95 solo lo sprite. Ombrelloni e venditori sono altrove. */
function drawStallSprite(c,s,type,cell,build,clock){
 const F=MARKET_ART_FADE,a=clamp((build-F.from)/(F.to-F.from),0,1);
 if(a<1)drawStallPlaceholder(c,s,type,Math.min(build,F.from-.001),clock);
 if(a<=0||!marketAtlas)return;
 const U=cell.sw/MARKET_ATLAS_PX,V=cell.sh/MARKET_ATLAS_PX; // 8×6 unità di gioco
 c.save();c.translate(s.x,s.y);c.rotate(s.face-Math.PI/2);
 const was=c.imageSmoothingEnabled;c.imageSmoothingEnabled=false;
 if(a<1)c.globalAlpha=a;
 c.drawImage(marketAtlas,cell.sx,cell.sy,cell.sw,cell.sh,-U/2,-V/2,U,V);
 c.imageSmoothingEnabled=was;c.globalAlpha=1;
 if(type.goods==='porchetta')drawSmoke(c,s,clock);
 c.restore();
}
function drawSmoke(c,s,clock){
 c.fillStyle='#ffffff26';const t=clock*.6+s.seed;c.fillRect(-s.w/2+1+Math.sin(t)*.3,-s.d/2-.6-((t*.4)%1),.5,.5);
}
function drawStallLocal(c,s,type,build,clock,animated){
 const w=s.w,d=s.d;
 // ombra a terra
 c.fillStyle='#0f1a1840';c.fillRect(-w/2+.35,-d/2+.45,w,d);
 if(build<.3){
  // montaggio: casse e scatole per terra
  const n=Math.ceil(build/.3*4);
  for(let i=0;i<n;i++){c.fillStyle=i%2?STALL_WOOD:'#a8864f';c.fillRect(-w/2+.4+i*(w/4.2),-d/4,w/5,d/2.4);}
  return;
 }
 if(type.cover==='furgone-negozio'){
  // furgone-negozio aperto sul lato dei clienti (segnaposto)
  c.fillStyle='#d9d4c6';c.fillRect(-w/2,-d/2,w,d*.78);
  c.fillStyle='#b8b2a2';c.fillRect(-w/2,-d/2,w,.5);
  c.fillStyle='#2b3438';c.fillRect(w/2-1.4,-d/2+.3,1,d*.6);
  c.fillStyle=type.palette[1];for(let i=0;i<Math.floor(w/1.2);i++)c.fillRect(-w/2+.3+i*1.2,d*.28,.6,.7);
  c.fillStyle='#f0e7d2';c.fillRect(-w/2,d*.28,w,.22);
  for(let i=0;i<Math.floor(w/.9);i++){c.fillStyle=i%2?type.palette[1]:'#f0e7d2';c.fillRect(-w/2+i*.9,d*.28+.22,.9,.5);}
 }else{
  // bancone con gambe e telo
  c.fillStyle=STALL_LEG;c.fillRect(-w/2+.2,-d/2+.2,.35,d-.4);c.fillRect(w/2-.55,-d/2+.2,.35,d-.4);
  c.fillStyle=STALL_WOOD;c.fillRect(-w/2,-d*.05,w,d*.55);
  c.fillStyle=type.goods==='pesce'?'#d9e4ea':CLOTH;c.fillRect(-w/2+.1,-d*.05,w-.2,d*.5);
  c.fillStyle='#00000022';c.fillRect(-w/2+.1,d*.42,w-.2,.12);
 }
 if(build>=.75){
  c.globalAlpha=clamp((build-.75)/.2,0,1);
  drawGoods(c,s,type,clock,animated);
  c.globalAlpha=1;
 }
}
function drawGoods(c,s,type,clock,animated=true){
 const w=s.w,d=s.d,p=type.palette,r=k=>rand(s.seed+k);
 const top=-d*.02,depth=d*.44;
 switch(type.goods){
  case 'frutta':case 'olive':{
   const n=Math.floor(w/1.25);
   for(let i=0;i<n;i++){const x=-w/2+.35+i*1.25;c.fillStyle='#8a6a45';c.fillRect(x,top,1.05,depth);
    c.fillStyle=p[i%(p.length-(type.goods==='frutta'?1:0))];
    for(let k=0;k<6;k++)c.fillRect(x+.12+(k%3)*.32,top+.15+Math.floor(k/3)*.45,.26,.3);}
   break;}
  case 'pesce':{
   for(let i=0;i<Math.floor(w/.8);i++){c.fillStyle=i%3?p[2]:'#8fa2ad';c.fillRect(-w/2+.3+i*.8,top+.25+(i%2)*.35,.6,.22);}
   c.fillStyle='#ffffff55';c.fillRect(-w/2+.2,top+.1,w-.4,.12);break;}
  case 'vestiti':case 'intimo':{
   // stender appeso dietro + capi piegati sul bancone
   c.fillStyle='#4b4b4b';c.fillRect(-w/2+.2,-d/2+.15,w-.4,.12);
   for(let i=0;i<Math.floor(w/.7);i++){c.fillStyle=p[1+(i+(s.n||0))%(p.length-1)];c.fillRect(-w/2+.3+i*.7,-d/2+.27,.5,.9+r(i)*.4);}
   for(let i=0;i<Math.floor(w/1.1);i++){c.fillStyle=p[1+(i*2+(s.n||0))%(p.length-1)];c.fillRect(-w/2+.35+i*1.1,top+.2,.9,.55);}
   break;}
  case 'scarpe':{
   for(let i=0;i<Math.floor(w/.75);i++){c.fillStyle=p[i%p.length];c.fillRect(-w/2+.3+i*.75,top+.25,.26,.5);c.fillRect(-w/2+.6+i*.75,top+.25,.26,.5);}break;}
  case 'casalinghi':{
   for(let i=0;i<Math.floor(w/.9);i++){c.fillStyle=p[i%p.length];c.fillRect(-w/2+.3+i*.9,top+.2,.7,.7);c.fillStyle='#00000030';c.fillRect(-w/2+.45+i*.9,top+.35,.4,.4);}break;}
  case 'detersivi':{
   for(let i=0;i<Math.floor(w/.5);i++){c.fillStyle=p[i%p.length];c.fillRect(-w/2+.3+i*.5,top+.2+(i%2)*.15,.34,.75);c.fillStyle='#ffffffaa';c.fillRect(-w/2+.36+i*.5,top+.22+(i%2)*.15,.12,.12);}break;}
  case 'giocattoli':{
   for(let i=0;i<Math.floor(w/.7);i++){c.fillStyle=p[i%p.length];if(i%2)c.fillRect(-w/2+.3+i*.7,top+.3,.5,.5);else c.fillRect(-w/2+.35+i*.7,top+.2,.4,.75);}break;}
  case 'fiori':{
   for(let i=0;i<Math.floor(w/.9);i++){const x=-w/2+.35+i*.9;c.fillStyle=p[3];c.fillRect(x+.15,top+.45,.5,.45);c.fillStyle=p[0];c.fillRect(x,top+.05,.8,.5);
    c.fillStyle=p[1+i%2];c.fillRect(x+.15,top+.12,.2,.2);c.fillRect(x+.45,top+.28,.2,.2);}break;}
  case 'borse':{
   for(let i=0;i<Math.floor(w/1);i++){c.fillStyle=p[i%2];c.fillRect(-w/2+.3+i,top+.25,.8,.6);c.fillStyle=p[2];c.fillRect(-w/2+.62+i,top+.25,.16,.1);}break;}
  case 'bigiotteria':{
   c.fillStyle='#2a2238';c.fillRect(-w/2+.2,top+.1,w-.4,depth-.15);
   for(let i=0;i<Math.floor(w/.35);i++){c.fillStyle=p[1+i%2];c.fillRect(-w/2+.3+i*.35,top+.25+(i%3)*.22,.14,.14);}break;}
  case 'salumi':{
   c.fillStyle='#e8f0f2aa';c.fillRect(-w/2+.3,d*.22,w-1.8,.2);
   for(let i=0;i<Math.floor((w-1.8)/.6);i++){c.fillStyle=i%2?p[1]:'#e9dfb8';c.fillRect(-w/2+.35+i*.6,d*.08,.45,.18);}break;}
  case 'porchetta':{
   c.fillStyle='#b5764a';c.fillRect(-w/2+.5,d*.06,1.6,.24);c.fillStyle='#e8d6b0';c.fillRect(-w/2+.62,d*.1,.3,.16);
   if(animated)drawSmoke(c,s,clock);break;}
 }
}
/* Segni gialli a terra con il numero del posteggio: restano anche a mercato smontato. */
export function drawMarketGround(c,m,bounds,zoom=1){
 if(!m)return;
 const [x0,y0,x1,y1]=bounds;
 c.save();c.lineWidth=.22;c.strokeStyle='#e2c14a';c.fillStyle='#e2c14a';
 c.font='bold 1.5px monospace';c.textAlign='center';c.textBaseline='middle';
 for(const s of m.stalls){
  if(s.rect.x1<x0||s.rect.x0>x1||s.rect.y1<y0||s.rect.y0>y1)continue;
  c.globalAlpha=.55;c.strokeRect(s.rect.x0+.1,s.rect.y0+.1,s.rect.x1-s.rect.x0-.2,s.rect.y1-s.rect.y0-.2);
  if(s.build<.3&&zoom>1.4){c.globalAlpha=.6;c.fillText(String(s.n),s.x,s.y);}
 }
 c.restore();
}
/* Banchi (sprite del lotto 3 da MARKET_ART, altrimenti segnaposto) e ombre degli ombrelloni: sotto le persone. */
export function drawMarketStalls(c,m,bounds,clock=0){
 if(!m)return;
 const [x0,y0,x1,y1]=bounds;
 for(const s of m.stalls){
  if(s.build<=.01||s.rect.x1<x0-8||s.rect.x0>x1+8||s.rect.y1<y0-8||s.rect.y0>y1+8)continue;
  const type=MARKET_TYPES.find(t=>t.id===s.type);
  if(s.canopy){
   const open=clamp((s.build-.45)/.3,0,1);
   if(open>0){const z=s.canopy.size*(.3+.7*open);c.fillStyle='#0d1916'+(open>.5?'4a':'2c');
    if(s.canopy.shape==='tondo'){c.beginPath();c.ellipse(s.x+.5,s.y+.4,z/2,z/2*.92,0,0,Math.PI*2);c.fill();}
    else c.fillRect(s.x+.5-z/2,s.y+.4-z/2,z,z*(s.canopy.shape==='rettangolare'?.7:1));}
  }
  const art=MARKET_ART[s.type];
  if(art&&typeof art.draw==='function')art.draw(c,s,s.build,clock);
  else drawStallPlaceholder(c,s,type,s.build,clock);
 }
}
/* Ombrelloni sopra persone e veicoli: palo, tela sollevata (2.5D), leggero ondeggiare col vento e
 * con la pioggia; sfumano quando il giocatore è sotto (R01). */
export function drawMarketParasols(c,m,bounds,clock=0,{rain=0}={}){
 if(!m)return;
 const [x0,y0,x1,y1]=bounds;
 for(const s of m.stalls){
  if(!s.canopy||s.build<.45||s.x<x0-12||s.x>x1+12||s.y<y0-12||s.y>y1+12)continue;
  const open=clamp((s.build-.45)/.3,0,1),size=s.canopy.size*(.3+.7*open);
  const sway=Math.sin(clock*(.8+rain*.9)+s.seed)*(.05+rain*.12);
  const cx=s.x+PARASOL_LIFT.x+sway,cy=s.y+PARASOL_LIFT.y*(.5+.5*open);
  const alpha=1-.8*(s.reveal||0);
  c.save();c.globalAlpha=alpha;
  // palo (in parte nascosto dalla tela)
  c.strokeStyle='#3a3530';c.lineWidth=.32;c.beginPath();c.moveTo(s.x,s.y);c.lineTo(cx,cy);c.stroke();
  const key=canopyColorsKey(s.canopy)+':'+s.canopy.size.toFixed(2);
  const h=s.canopy.shape==='rettangolare'?s.canopy.size*.7:s.canopy.size;
  const img=sprite(key,s.canopy.size,h,(g,W,H)=>paintCanopy(g,W,H,s.canopy,s.seed));
  if(img){
   const was=c.imageSmoothingEnabled;c.imageSmoothingEnabled=false;
   c.drawImage(img,cx-size/2,cy-size*(h/s.canopy.size)/2,size,size*(h/s.canopy.size));
   c.imageSmoothingEnabled=was;
  }else{c.fillStyle=s.canopy.colors[0];c.fillRect(cx-size/2,cy-size/2,size,size);}
  c.restore();
 }
}
