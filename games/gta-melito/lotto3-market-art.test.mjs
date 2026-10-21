/* Lotto 3 grafica — foglio dei banchi del mercato di CODEX-GH (14 banchi visti dall'alto + 4 teli,
 * RGBA 384×144, celle 64×48) e suo aggancio in MARKET_ART. Grafica PROVVISORIA da approvare da Simone. */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import {inflateSync} from 'node:zlib';
import {
 MARKET_TYPES,MARKET_ART,MARKET_ATLAS_PATH,MARKET_ATLAS_CELL,MARKET_ATLAS_PX,MARKET_CLOTH_IDS,MARKET_ART_FADE,MARKET_RULES,
 marketArtCell,registerMarketArt,clearMarketArt,marketArtReady,loadMarketArt,layoutMarketStalls,drawMarketStalls
} from './market.mjs';
import {NOVITA} from './novita.mjs';

// Decodifica un PNG RGBA 8 bit non interlacciato (filtri 0–4) in un Buffer di 4 byte per pixel.
function decodeRGBA(bytes){
 assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a','firma PNG');
 const w=bytes.readUInt32BE(16),h=bytes.readUInt32BE(20);
 assert.equal(bytes[24],8,'8 bit per canale');assert.equal(bytes[25],6,'RGBA con alpha vero');assert.equal(bytes[28],0,'non interlacciato');
 const idats=[];let at=8;
 while(at<bytes.length){
  const len=bytes.readUInt32BE(at),tag=bytes.toString('ascii',at+4,at+8);
  if(tag==='IDAT')idats.push(bytes.subarray(at+8,at+8+len));
  at+=12+len;if(tag==='IEND')break;
 }
 const raw=inflateSync(Buffer.concat(idats)),bpp=4,stride=w*bpp,out=Buffer.alloc(h*stride);
 let cursor=0;
 for(let y=0;y<h;y++){
  const filter=raw[cursor++];const row=Buffer.from(raw.subarray(cursor,cursor+stride));cursor+=stride;
  const prev=y?out.subarray((y-1)*stride,y*stride):Buffer.alloc(stride);
  for(let x=0;x<stride;x++){
   const left=x>=bpp?row[x-bpp]:0,up=prev[x],diag=x>=bpp?prev[x-bpp]:0;
   if(filter===1)row[x]=(row[x]+left)&255;
   else if(filter===2)row[x]=(row[x]+up)&255;
   else if(filter===3)row[x]=(row[x]+((left+up)>>1))&255;
   else if(filter===4){const p=left+up-diag,pa=Math.abs(p-left),pb=Math.abs(p-up),pc=Math.abs(p-diag);
    row[x]=(row[x]+(pa<=pb&&pa<=pc?left:pb<=pc?up:diag))&255;}
   else assert.equal(filter,0,'filtro PNG noto');
  }
  row.copy(out,y*stride);
 }
 return {w,h,px:out,alpha:(x,y)=>out[(y*w+x)*4+3],rgba:(x,y)=>out.readUInt32BE((y*w+x)*4),rgb:(x,y)=>[out[(y*w+x)*4],out[(y*w+x)*4+1],out[(y*w+x)*4+2]]};
}
const {width:CW,height:CH,columns:COLS,rows:ROWS}=MARKET_ATLAS_CELL;
const CELLS=COLS*ROWS;
const cellPixels=(img,index)=>{
 const x0=(index%COLS)*CW,y0=Math.floor(index/COLS)*CH,out=[];
 for(let y=0;y<CH;y++)for(let x=0;x<CW;x++)out.push(img.rgba(x0+x,y0+y));
 return out;
};
const bbox=(img,index)=>{
 const x0=(index%COLS)*CW,y0=Math.floor(index/COLS)*CH;let minX=CW,minY=CH,maxX=-1,maxY=-1;
 for(let y=0;y<CH;y++)for(let x=0;x<CW;x++)if(img.alpha(x0+x,y0+y)){minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);}
 return {minX,minY,maxX,maxY,w:maxX-minX+1,h:maxY-minY+1};
};
const SHADOW=[48,51,45]; // ombra corta a terra del generatore (SHADOW in mercato-banchi-genera.py)
let atlas,csvRows;
const loadAtlas=async()=>atlas||(atlas=decodeRGBA(await readFile(new URL(MARKET_ATLAS_PATH,import.meta.url))));
const loadCsv=async()=>csvRows||(csvRows=(await readFile(new URL('./mercato-banchi.csv',import.meta.url),'utf8')).trim().split('\n').slice(1).map(l=>l.split(',')));

test('lotto 3: atlante 384×144 RGBA, griglia 6×3 di celle 64×48, 18 celle = 14 banchi + 4 teli',async()=>{
 const img=await loadAtlas();
 assert.equal(img.w,384);assert.equal(img.h,144);
 assert.deepEqual(MARKET_ATLAS_CELL,{width:64,height:48,columns:6,rows:3});
 assert.equal(COLS*CW,img.w);assert.equal(ROWS*CH,img.h);
 assert.equal(MARKET_TYPES.length+MARKET_CLOTH_IDS.length,CELLS,'14 tipi del foglio + 4 teli riempiono le 18 celle');
 assert.equal(MARKET_ATLAS_PX,8,'8 pixel sorgente per unità di gioco: una cella copre 8×6 unità');
 assert.equal(CW/MARKET_ATLAS_PX,8);assert.equal(CH/MARKET_ATLAS_PX,6);
});

test('lotto 3: ogni cella ha margini e angoli trasparenti, corpo solido, alpha netto; le 18 celle sono diverse',async()=>{
 const img=await loadAtlas();
 for(let y=0;y<img.h;y++)for(let x=0;x<img.w;x++){const a=img.alpha(x,y);assert.ok(a===0||a===255,`alpha netto in (${x},${y})`);}
 const cells=[];
 for(let i=0;i<CELLS;i++){
  const x0=(i%COLS)*CW,y0=Math.floor(i/COLS)*CH;
  for(const [x,y] of [[0,0],[CW-1,0],[0,CH-1],[CW-1,CH-1]])assert.equal(img.alpha(x0+x,y0+y),0,`angolo trasparente cella ${i}`);
  for(let y=0;y<CH;y++)for(const x of [0,1,2,3,4,5,CW-6,CW-5,CW-4,CW-3,CW-2,CW-1])assert.equal(img.alpha(x0+x,y0+y),0,`margine laterale trasparente cella ${i}`);
  for(let x=0;x<CW;x++)for(const y of [0,1,2,3,CH-4,CH-3,CH-2,CH-1])assert.equal(img.alpha(x0+x,y0+y),0,`margine alto/basso trasparente cella ${i}`);
  assert.equal(img.alpha(x0+CW/2,y0+CH/2),255,`centro solido cella ${i}`);
  const b=bbox(img,i);assert.ok(b.w>=24&&b.h>=30,`soggetto pieno cella ${i}`);
  // il corpo è solido: nessun buco di alpha nel piano del banco (rettangolo del soggetto rientrato di 3 px, sopra l'ombra)
  for(let y=b.minY+3;y<=Math.min(b.maxY-3,35);y++)for(let x=b.minX+3;x<=b.maxX-3;x++)assert.equal(img.alpha(x0+x,y0+y),255,`corpo senza buchi cella ${i} (${x},${y})`);
  cells.push(cellPixels(img,i));
 }
 for(let i=0;i<CELLS;i++)for(let j=i+1;j<CELLS;j++)assert.ok(cells[i].some((v,k)=>v!==cells[j][k]),`celle ${i} e ${j} distinte`);
});

test('lotto 3: larghezza del banco nella cella = metri del CSV (4/3/2 m → 48/36/24 px + contorno), orlo e ombra verso +Y (clienti)',async()=>{
 const img=await loadAtlas();
 for(const type of MARKET_TYPES){
  const cell=marketArtCell(type.id),b=bbox(img,cell.index);
  assert.equal(b.w,type.w*12+2,`${type.id}: ${type.w} m → ${type.w*12} px + 1 px di contorno per lato`);
  assert.ok(Math.abs((b.minX+b.maxX)/2-(CW-1)/2)<=1,`${type.id} centrato in orizzontale`);
  // disegnato a 8 px/unità il piano misura (w*12)/8 = w*1.5 unità ≈ stall.w = w*scale (1,52): differenza < 0,1
  assert.ok(Math.abs(type.w*12/MARKET_ATLAS_PX-type.w*MARKET_RULES.scale)<.1,`${type.id} stessa misura nel mondo`);
  const x0=(cell.index%COLS)*CW,y0=Math.floor(cell.index/COLS)*CH;
  const count=(ya,yb)=>{let n=0;for(let y=ya;y<yb;y++)for(let x=0;x<CW;x++){const p=img.rgb(x0+x,y0+y);if(img.alpha(x0+x,y0+y)&&p[0]===SHADOW[0]&&p[1]===SHADOW[1]&&p[2]===SHADOW[2])n++;}return n;};
  assert.ok(count(36,42)>=36,`${type.id}: ombra a terra in basso (lato clienti, +Y locale)`);
  assert.equal(count(6,14),0,`${type.id}: nessuna ombra in alto (lato venditore)`);
 }
 for(const id of MARKET_CLOTH_IDS){const b=bbox(img,marketArtCell(id).index);assert.equal(b.w,50,id+' telo largo come un banco da 4 m');}
});

test('lotto 3: mappa tipo → cella completa per i 14 tipi del CSV, teli nelle celle 14–17, id sconosciuti → null',async()=>{
 const rows=await loadCsv();
 assert.equal(rows.length,14);
 rows.forEach((r,i)=>{
  const id=r[0];assert.equal(id,'B'+String(i+1).padStart(2,'0'));
  assert.ok(MARKET_TYPES.some(t=>t.id===id),id+' è in MARKET_TYPES');
  const cell=marketArtCell(id);
  assert.deepEqual(cell,{index:i,sx:(i%6)*64,sy:Math.floor(i/6)*48,sw:64,sh:48},'cella di '+id);
 });
 MARKET_CLOTH_IDS.forEach((id,i)=>assert.deepEqual(marketArtCell(id),{index:14+i,sx:((14+i)%6)*64,sy:Math.floor((14+i)/6)*48,sw:64,sh:48}));
 assert.deepEqual(MARKET_CLOTH_IDS,['T1','T2','T3','T4']);
 for(const bad of ['B00','B15','T0','T5','X01','',null,undefined])assert.equal(marketArtCell(bad),null,'nessuna cella per '+bad);
 const seen=new Set([...MARKET_TYPES.map(t=>t.id),...MARKET_CLOTH_IDS].map(id=>marketArtCell(id).index));
 assert.equal(seen.size,CELLS,'18 celle tutte diverse e tutte usate');
});

/* Contesto canvas finto: registra le chiamate del disegno. */
function fakeContext(){
 const calls=[];const c={imageSmoothingEnabled:true,globalAlpha:1,fillStyle:'',strokeStyle:'',lineWidth:1,font:'',textAlign:'',textBaseline:''};
 for(const name of ['save','restore','translate','rotate','fillRect','strokeRect','fillText','beginPath','ellipse','fill','scale','moveTo','lineTo','stroke'])c[name]=(...a)=>{calls.push([name,...a]);};
 c.drawImage=(...a)=>{calls.push(['drawImage',...a,{alpha:c.globalAlpha,smoothing:c.imageSmoothingEnabled}]);};
 c.calls=calls;return c;
}
const fakeAtlas=()=>({complete:true,naturalWidth:384,naturalHeight:144});

test('lotto 3: senza immagine (Node) MARKET_ART resta vuota e loadMarketArt non fa nulla: i banchi restano segnaposto',()=>{
 assert.deepEqual(MARKET_ART,{});
 assert.equal(typeof Image,'undefined');
 loadMarketArt();
 assert.deepEqual(MARKET_ART,{});assert.equal(marketArtReady(),false);
 assert.equal(registerMarketArt({complete:true,naturalWidth:192,naturalHeight:72}),false,'atlante con misure sbagliate rifiutato');
 assert.equal(registerMarketArt(null),false);
 assert.deepEqual(MARKET_ART,{});
 const stalls=layoutMarketStalls({}),c=fakeContext();
 for(const s of stalls)s.build=1;
 drawMarketStalls(c,{stalls},[1100,900,1240,1000],5);
 assert.ok(!c.calls.some(k=>k[0]==='drawImage'),'segnaposto disegnati con fillRect, nessuno sprite');
 assert.ok(c.calls.some(k=>k[0]==='fillRect'));
});

test('lotto 3: con l\'atlante registrato ogni tipo disegna la sua cella a 8×6 unità, ruotata verso i clienti, senza smoothing; dissolvenza fra .75 e .95',()=>{
 try{
  assert.equal(registerMarketArt(fakeAtlas()),true);
  assert.equal(marketArtReady(),true);
  assert.deepEqual(Object.keys(MARKET_ART).sort(),MARKET_TYPES.map(t=>t.id).sort(),'14 tipi cablati');
  for(const type of MARKET_TYPES){
   const art=MARKET_ART[type.id];
   assert.equal(typeof art.draw,'function');assert.equal(art.source,'lotto3');
   assert.deepEqual(art.cell,marketArtCell(type.id));
  }
  const stalls=layoutMarketStalls({});
  assert.ok(stalls.length>=15);
  for(const s of stalls){
   const art=MARKET_ART[s.type],cell=art.cell,c=fakeContext();
   art.draw(c,s,1,3);
   const di=c.calls.filter(k=>k[0]==='drawImage');
   assert.equal(di.length,1,s.id+' un solo drawImage a banco completo');
   const [,img,sx,sy,sw,sh,dx,dy,dw,dh,flags]=di[0];
   assert.equal(img.naturalWidth,384);
   assert.deepEqual([sx,sy,sw,sh],[cell.sx,cell.sy,64,48],s.id+' ritaglio della cella di '+s.type);
   assert.deepEqual([dx,dy,dw,dh],[-4,-3,8,6],s.id+' 8×6 unità centrate sul banco');
   assert.equal(flags.smoothing,false,'pixel netti');assert.equal(flags.alpha,1);
   assert.deepEqual(c.calls.find(k=>k[0]==='translate').slice(1),[s.x,s.y]);
   assert.ok(Math.abs(c.calls.find(k=>k[0]==='rotate')[1]-(s.face-Math.PI/2))<1e-9,'orlo e ombra (+Y locale) verso i clienti, come il segnaposto');
   assert.ok(!c.calls.some(k=>k[0]==='fillRect'&&k[1]===-s.w/2),'nessun bancone segnaposto sotto lo sprite completo');
   assert.equal(c.imageSmoothingEnabled,true,'smoothing ripristinato');
   // montaggio: sotto .75 solo segnaposto (casse / bancone), a .85 sprite a metà sopra il bancone
   const c2=fakeContext();art.draw(c2,s,.5,3);
   assert.ok(!c2.calls.some(k=>k[0]==='drawImage'));assert.ok(c2.calls.some(k=>k[0]==='fillRect'));
   const c3=fakeContext();art.draw(c3,s,.85,3);
   const mid=c3.calls.find(k=>k[0]==='drawImage');
   assert.ok(mid&&Math.abs(mid[10].alpha-.5)<1e-9,'dissolvenza a metà a build .85');
   assert.ok(c3.calls.some(k=>k[0]==='fillRect'),'bancone del segnaposto ancora sotto');
  }
  assert.deepEqual(MARKET_ART_FADE,{from:.75,to:.95});
  // drawMarketStalls passa dal gancio MARKET_ART
  const c=fakeContext();for(const s of stalls)s.build=1;
  drawMarketStalls(c,{stalls},[1100,900,1240,1000],5);
  assert.equal(c.calls.filter(k=>k[0]==='drawImage').length,stalls.length,'uno sprite per banco');
 }finally{clearMarketArt();}
 assert.deepEqual(MARKET_ART,{},'clearMarketArt riporta ai segnaposto');assert.equal(marketArtReady(),false);
});

test('lotto 3: file dell\'atlante, sorgenti, caricamento in game.mjs, versioni cache e voce NOVITÀ',async()=>{
 for(const f of ['./assets/market/mercato-banchi-14-teli-4-rgba.png','./assets/market/sources/mercato-banchi-genera.py','./assets/market/sources/mercato-banchi-verifica.py','./assets/market/sources/mercato-banchi-anteprima-4x.png'])
  await access(new URL(f,import.meta.url));
 assert.equal(MARKET_ATLAS_PATH,'./assets/market/mercato-banchi-14-teli-4-rgba.png');
 const game=await readFile(new URL('./game.mjs',import.meta.url),'utf8'),page=await readFile(new URL('./index.html',import.meta.url),'utf8');
 assert.match(game,/loadMarketArt\(\);/,'game.mjs precarica l\'atlante del mercato');
 assert.match(game,/import \{[^}]*loadMarketArt[^}]*\} from '\.\/market\.mjs\?v=0(0[5-9]|[1-9]\d)'/,'market.mjs?v= aggiornato');
 assert.ok(Number((game.match(/novita\.mjs\?v=(\d+)/)||[])[1])>=4,'novita.mjs?v= aggiornato');
 assert.ok(Number((page.match(/game\.mjs\?v=(\d+)/)||[])[1])>=202,'game.mjs?v= aggiornato');
 const entry=NOVITA.find(e=>e.id==='lotto3-banchi');
 assert.ok(entry,'voce lotto3-banchi');
 assert.equal(entry.mercato,true);assert.equal(entry.ora,10*60+30);
 assert.match(entry.cosa,/PROVVISORIA/);
 assert.deepEqual(entry.trova({market:{stalls:[{x:1160,y:940}]}}),{x:1160,y:940});
 const mercato=NOVITA.find(e=>e.id==='mercato');
 assert.doesNotMatch(mercato.nome,/placeholder/,'la voce del mercato non parla più di banchi placeholder');
});
