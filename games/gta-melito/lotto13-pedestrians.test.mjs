/* Lotti 13 e 14 grafica — due fogli pedoni di CODEX-GH (4 identità × 4 direzioni × 4 frame,
 * RGBA 384×160 ciascuno) collegati con la tabella generale dei fogli extra (kind 23–30, totale 31).
 * Il ragazzino (kind 25) è più basso dentro la cella, di proposito. Grafica PROVVISORIA da approvare da Simone. */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access,readdir} from 'node:fs/promises';
import {inflateSync} from 'node:zlib';
import {
 PEDESTRIAN_SHEETS,PEDESTRIAN_SHEET_CELL,PEDESTRIAN_SHEET_SIZE,PEDESTRIAN_SHEET_START_KIND,PEDESTRIAN_KIND_COUNT,
 EXTRA_PEDESTRIAN_NPC_START_KIND,LOTTO2_PEDESTRIAN_NPC_START_KIND,pedestrianSheet,pedestrianSheetForKind,
 loadPedestrianSheets,pedestrianSheetReady,drawSheetPedestrianSprite,drawLotto2PedestrianSprite
} from './extra-pedestrian-sprites.mjs';
import {PEOPLE_DIRECTIONS} from './pedestrian-sprites.mjs';
import {buildRoadGraph,createAgents} from './roads.mjs';
import {NOVITA,novitaTarget} from './novita.mjs';

const NEW_SHEETS=['lotto13','lotto14'];
const KID_KIND=25;// lotto 13, identità 2: ragazzino con il pallone
const read=f=>readFile(new URL('./'+f,import.meta.url),'utf8');

// Decodifica un PNG RGBA 8 bit non interlacciato (filtri 0–4): alpha(x,y) e rgba(x,y).
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
 return {w,h,alpha:(x,y)=>out[(y*w+x)*4+3],rgba:(x,y)=>out.readUInt32BE((y*w+x)*4)};
}
const atlases=new Map();
const loadAtlas=async id=>atlases.get(id)||atlases.set(id,decodeRGBA(await readFile(new URL(pedestrianSheet(id).path,import.meta.url)))).get(id);
const cell=(img,column,row)=>{
 const {width,height}=PEDESTRIAN_SHEET_CELL,x0=column*width,y0=row*height,out=[];
 for(let y=0;y<height;y++)for(let x=0;x<width;x++)out.push(img.rgba(x0+x,y0+y));
 return out;
};
const differ=(a,b)=>a.some((v,i)=>v!==b[i]);
// Prima e ultima riga opaca di una cella (altezza della figura e piedi).
const extent=(img,column,row)=>{
 const {width,height}=PEDESTRIAN_SHEET_CELL,x0=column*width,y0=row*height;let top=-1,lowest=-1,opaque=0;
 for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(img.alpha(x0+x,y0+y)){opaque++;lowest=y;if(top<0)top=y;}
 return {top,lowest,opaque};
};

test('lotti 13–14: tabella dei fogli extra con 6 fogli, 8 identità nuove in coda, kind 23–30, totale 31',()=>{
 assert.deepEqual(PEDESTRIAN_SHEETS.map(s=>s.id),['lotto2','lotto10','lotto11','lotto12','lotto13','lotto14']);
 assert.equal(PEDESTRIAN_SHEET_START_KIND,7);assert.equal(LOTTO2_PEDESTRIAN_NPC_START_KIND,7);assert.equal(EXTRA_PEDESTRIAN_NPC_START_KIND,4);
 const fresh=PEDESTRIAN_SHEETS.filter(s=>NEW_SHEETS.includes(s.id));
 assert.equal(fresh.length,2);
 assert.equal(fresh.reduce((n,s)=>n+s.identities.length,0),8,'8 identità nuove');
 assert.deepEqual(fresh.map(s=>s.startKind),[23,27]);
 assert.equal(PEDESTRIAN_KIND_COUNT,31);
 for(const s of PEDESTRIAN_SHEETS){
  assert.equal(s.identities.length,4);
  assert.ok(Object.isFrozen(s)&&Object.isFrozen(s.identities));
  assert.equal(s.path,'./assets/people/pedoni-'+s.id+'-4x4frames-24x40-rgba.png');
  for(let k=s.startKind;k<s.startKind+4;k++)assert.equal(pedestrianSheetForKind(k),s,'kind '+k);
 }
 const names=PEDESTRIAN_SHEETS.flatMap(s=>[...s.identities]);
 assert.equal(new Set(names).size,names.length,'nomi delle identità tutti diversi');
 assert.deepEqual([...pedestrianSheet('lotto13').identities],['operaio-gilet','signora-carrello','ragazzino-pallone','barista-grembiule']);
 assert.deepEqual([...pedestrianSheet('lotto14').identities],['uomo-canottiera','signora-elegante-cappello','studente-occhiali','donna-velo']);
 assert.equal(pedestrianSheet('lotto13').startKind+2,KID_KIND,'il ragazzino è il kind 25');
 for(const k of [0,3,4,6,31,-1,1.5,'23'])assert.equal(pedestrianSheetForKind(k),null,'kind fuori dai fogli extra: '+k);
 // i fogli precedenti non si spostano
 assert.deepEqual(PEDESTRIAN_SHEETS.slice(0,4).map(s=>s.startKind),[7,11,15,19]);
});

for(const id of NEW_SHEETS)test(id+': PNG presente, 384×160 RGBA, alpha netto, bordi di ogni cella trasparenti, corpo solido e piedi in basso',async()=>{
 const img=await loadAtlas(id);const {width,height,columns,rows}=PEDESTRIAN_SHEET_CELL;
 assert.equal(img.w,PEDESTRIAN_SHEET_SIZE.width);assert.equal(img.h,PEDESTRIAN_SHEET_SIZE.height);
 assert.equal(columns*width,img.w);assert.equal(rows*height,img.h);assert.equal(rows,PEOPLE_DIRECTIONS.length);
 for(let row=0;row<rows;row++)for(let column=0;column<columns;column++){
  const x0=column*width,y0=row*height;
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
   const a=img.alpha(x0+x,y0+y);
   assert.ok(a===0||a===255,`alpha binario in cella ${column},${row}`);
  }
  for(let x=0;x<width;x++){assert.equal(img.alpha(x0+x,y0),0,`bordo alto trasparente in cella ${column},${row}`);assert.equal(img.alpha(x0+x,y0+height-1),0,`bordo basso trasparente in cella ${column},${row}`);}
  for(let y=0;y<height;y++){assert.equal(img.alpha(x0,y0+y),0,`bordo sinistro trasparente in cella ${column},${row}`);assert.equal(img.alpha(x0+width-1,y0+y),0,`bordo destro trasparente in cella ${column},${row}`);}
  const {opaque,lowest}=extent(img,column,row);
  assert.ok(opaque>=120&&opaque<=width*height*.7,`corpo solido in cella ${column},${row}: ${opaque} px`);
  assert.ok(lowest>=34&&lowest<=height-2,`piedi a terra (ultima riga opaca ${lowest}) in cella ${column},${row}`);
 }
 const bytes=await readFile(new URL(pedestrianSheet(id).path,import.meta.url));
 assert.ok(bytes.length<60000,'asset leggero per il telefono');
});

test('lotto 13: il ragazzino (kind 25) è più basso di proposito, con i piedi alla stessa riga degli adulti',async()=>{
 const img=await loadAtlas('lotto13');
 for(let row=0;row<4;row++)for(let identity=0;identity<4;identity++)for(let frame=0;frame<4;frame++){
  const {top,lowest,opaque}=extent(img,identity*4+frame,row);
  if(identity===2){
   assert.ok(top>=9&&top<=14,`ragazzino: testa più in basso (prima riga opaca ${top}) in ${row},${frame}`);
   assert.ok(lowest-top>=24&&lowest-top<=32,`ragazzino alto circa 28 px (${lowest-top}) in ${row},${frame}`);
   assert.ok(opaque<300,`ragazzino più piccolo (${opaque} px)`);
  }else{
   assert.ok(top<=6,`adulto a tutta altezza (prima riga opaca ${top}) in identità ${identity}, ${row},${frame}`);
   assert.ok(opaque>=280,`adulto a corpo pieno (${opaque} px)`);
  }
  assert.ok(lowest>=36,`piedi sulla stessa riga (${lowest}) in identità ${identity}, ${row},${frame}`);
 }
});

for(const id of NEW_SHEETS)test(id+': 4 identità diverse, 4 frame di camminata e 4 direzioni distinti',async()=>{
 const img=await loadAtlas(id);
 for(let row=0;row<4;row++){
  const firsts=[0,1,2,3].map(i=>cell(img,i*4,row));
  for(let a=0;a<4;a++)for(let b=a+1;b<4;b++)assert.ok(differ(firsts[a],firsts[b]),`identità ${a} e ${b} diverse (riga ${row})`);
 }
 for(let identity=0;identity<4;identity++){
  const frames=[0,1,2,3].map(f=>cell(img,identity*4+f,1));
  for(let a=0;a<4;a++)for(let b=a+1;b<4;b++)assert.ok(differ(frames[a],frames[b]),`frame ${a} e ${b} diversi (identità ${identity})`);
  const dirs=[0,1,2,3].map(d=>cell(img,identity*4,d));
  for(let a=0;a<4;a++)for(let b=a+1;b<4;b++)assert.ok(differ(dirs[a],dirs[b]),`direzioni ${a} e ${b} diverse (identità ${identity})`);
 }
 // diversi anche dai fogli precedenti (stesse pose, altri vestiti)
 const previous=await loadAtlas('lotto12');
 for(let identity=0;identity<4;identity++)assert.ok(differ(cell(img,identity*4,1),cell(previous,identity*4,1)),'identità '+identity+' diversa dal lotto 12');
});

test('lotti 13–14: generatore e NOTE di CODEX-GH conservati in assets/people/sources con prefisso pedoni-lottoN-',async()=>{
 for(const n of [13,14]){
  for(const f of [`pedoni-lotto${n}-genera.py`,`pedoni-lotto${n}-NOTE.md`])await access(new URL('./assets/people/sources/'+f,import.meta.url));
  const note=await read(`assets/people/sources/pedoni-lotto${n}-NOTE.md`);
  assert.match(note,/384×160/);assert.match(note,/24×40/);
 }
 assert.match(await read('assets/people/sources/pedoni-lotto13-NOTE.md'),/19×31/,'NOTE del lotto 13 spiega il ragazzino ridotto');
});

test('lotti 13–14: ogni foglio si carica a parte e disegna la cella giusta, alla stessa scala e con lo stesso pivot degli altri',()=>{
 const original=globalThis.Image;
 const ctx={drawImage(...args){ctx.last=args;},last:null};
 assert.equal(drawSheetPedestrianSprite(ctx,0,0,0,23),false,'prima del caricamento non disegna');
 class MockImage{complete=true;naturalWidth=384;naturalHeight=160;set src(v){this._src=v;}get src(){return this._src;}}
 try{
  globalThis.Image=MockImage;
  loadPedestrianSheets();
  for(const s of PEDESTRIAN_SHEETS)assert.equal(pedestrianSheetReady(s.id),true,s.id);
  // kind 23 = lotto 13 identità 0 (operaio), frame fermo, direzione right
  assert.equal(drawSheetPedestrianSprite(ctx,22,33,0,23,0,false,1,0),true);
  let p=ctx.last;assert.equal(p.length,9);assert.equal(p[1],0);assert.equal(p[2],3*40,'riga right');assert.equal(p[3],24);assert.equal(p[4],40);
  const size=[p[7],p[8]];assert.ok(p[7]<4&&p[8]<5,'stessa scala degli altri pedoni');
  assert.ok(Math.abs(p[5]+p[7]/2-22)<1e-9&&Math.abs(p[6]+p[8]-33)<.9,'piedi sul punto dell\'NPC, come gli altri fogli');
  // kind 25 = ragazzino: stessa cella 24×40 e stessa misura a schermo (è più basso dentro la cella)
  assert.equal(drawSheetPedestrianSprite(ctx,22,33,0,KID_KIND,0,false,1,0),true);
  p=ctx.last;assert.equal(p[1],8*24);assert.equal(p[3],24);assert.equal(p[4],40);assert.deepEqual([p[7],p[8]],size,'ragazzino: nessuna scala a parte');
  // kind 30 = lotto 14 identità 3 (donna con velo), in cammino verso l'alto
  assert.equal(drawSheetPedestrianSprite(ctx,22,33,-Math.PI/2,30,2,true,1.2,24),true);
  p=ctx.last;assert.ok(p[1]>=12*24&&p[1]<16*24,'ultime quattro colonne');assert.equal(p[2],0,'riga up');
  // kind 27 = uomo estivo verso il basso; kind 26 = barista verso sinistra
  assert.equal(drawSheetPedestrianSprite(ctx,22,33,Math.PI/2,27,0,false),true);p=ctx.last;assert.equal(p[1],0);assert.equal(p[2],40,'riga down');
  assert.equal(drawSheetPedestrianSprite(ctx,22,33,Math.PI,26,0,false),true);p=ctx.last;assert.equal(p[1],12*24);assert.equal(p[2],80,'riga left');
  // i quattro frame di camminata scorrono con il tempo
  const frames=new Set([0,.4,.8,1.2].map(t=>{drawSheetPedestrianSprite(ctx,0,0,0,24,t,true,1,0);return ctx.last[1];}));
  assert.equal(frames.size,4,'4 frame distinti per la signora col carrello (kind 24)');
  // ogni foglio usa la propria immagine; lotto 13 e 14 diverse dalle precedenti
  const images=PEDESTRIAN_SHEETS.map(s=>{drawSheetPedestrianSprite(ctx,0,0,0,s.startKind,0,false);return ctx.last[0];});
  assert.equal(new Set(images).size,6,'sei cache separate');
  assert.ok(images[4]instanceof MockImage&&images[5]instanceof MockImage);
  assert.match(images[4].src,/pedoni-lotto13-4x4frames-24x40-rgba\.png$/);assert.match(images[5].src,/pedoni-lotto14-4x4frames-24x40-rgba\.png$/);
  for(const k of [0,4,6,31,-1])assert.equal(drawSheetPedestrianSprite(ctx,0,0,0,k),false,'kind '+k+' non è dei fogli extra');
  assert.equal(drawLotto2PedestrianSprite(ctx,22,33,0,2,0,false),true);assert.equal(ctx.last[1],8*24,'lotto 2 identità 2 come prima');
 }finally{
  if(original===undefined)delete globalThis.Image;else globalThis.Image=original;
 }
});

test('lotti 13–14: i kind nuovi (23–30) compaiono davvero fra i pedoni generati, insieme a tutti gli altri',()=>{
 const graph=buildRoadGraph([{id:1,n:'Via Roma',t:'residential',w:8,p:[0,0,450,0,900,0]},{id:2,n:'Traversa',t:'residential',w:6,p:[450,-200,450,0,450,200]}]);
 const people=createAgents(graph,120,310,'walk',[]);
 assert.ok(people.length>=62,'abbastanza passanti per vedere tutti i kind: '+people.length);
 const kinds=new Set(people.map(p=>p.kind));
 for(let k=0;k<PEDESTRIAN_KIND_COUNT;k++)assert.ok(kinds.has(k),'kind '+k+' presente');
 assert.ok(people.every(p=>Number.isInteger(p.kind)&&p.kind>=0&&p.kind<PEDESTRIAN_KIND_COUNT));
 const cars=createAgents(graph,30,189,'car',[]);
 assert.ok(cars.every(c=>c.kind<7),'auto: kind 0–6 invariati');
});

test('lotti 13–14: collegamento nel gioco, voce NOVITÀ, registri e versioni uguali in tutti gli import',async()=>{
 const [art,game,road,resident,market,page,novita,work,visual,modus,approvare]=await Promise.all(
  ['city-art.mjs','game.mjs','roads.mjs','resident-routines.mjs','market.mjs','index.html','novita.mjs',
   'WORK_LOG.md','VISUAL_PROGRESS.md','PIXEL_ART_MODUS.md','NOVITA_DA_APPROVARE.md'].map(read));
 assert.match(art,/p\.kind>=PEDESTRIAN_SHEET_START_KIND&&\s*drawSheetPedestrianSprite\(c,x,y,angle,p\.kind,clock,moving,p\.speed,p\.seed\)/);
 assert.ok(game.includes('loadPedestrianSheets()'));
 assert.match(road,/kind:kind==='walk'\?i%PEDESTRIAN_KIND_COUNT:i%7/);
 assert.match(resident,/kind:kindIndex%PEDESTRIAN_KIND_COUNT/);
 assert.match(market,/kind:hash\(seed\)%PEDESTRIAN_KIND_COUNT/);
 assert.ok(!/%31\b|%27\b|%23\b/.test(road+resident+market+art),'nessun numero magico dei kind');
 // NOVITÀ
 const entry=NOVITA.find(e=>e.id==='lotto13-14-pedoni');
 assert.ok(entry,'voce lotto13-14-pedoni');
 assert.match(entry.nome,/8 pedoni nuovi/);assert.match(entry.cosa,/PROVVISORIA/);assert.match(entry.cosa,/ragazzino/);
 assert.ok(novita.includes("id:'lotto13-14-pedoni'")&&novita.includes("roadMiddle(s,'Via Roma')"),'VAI A VEDERE su Via Roma');
 const s={spawn:[100,100],people:[{x:900,y:900,kind:24},{x:130,y:100,kind:21},{x:140,y:100,kind:29},{x:120,y:100,kind:26,indoors:true}],roads:[]};
 assert.deepEqual(novitaTarget(entry,s),{x:140,y:100},'il pedone dei lotti 13–14 più vicino, fuori casa (non quello dei lotti 10–12)');
 // registri
 for(const [name,text] of [['WORK_LOG',work],['VISUAL_PROGRESS',visual],['NOVITA_DA_APPROVARE',approvare]])
  assert.ok(/[Ll]otti 13–14/.test(text)&&text.includes('8 pedoni nuovi'),name+' aggiornato');
 assert.ok(approvare.includes('`lotto13-14-pedoni`'),'NOVITA_DA_APPROVARE elenca la voce');
 for(const n of [13,14])assert.ok(modus.includes(`pedoni-lotto${n}-4x4frames-24x40-rgba.png`),'PIXEL_ART_MODUS tabella fogli persone: lotto '+n);
 // versioni: una sola per modulo in tutti gli import (moduli non test + index.html)
 const names=(await readdir(new URL('./',import.meta.url))).filter(f=>(f.endsWith('.mjs')&&!f.endsWith('.test.mjs'))||f==='index.html');
 const sources=await Promise.all(names.map(read));
 for(const mod of ['extra-pedestrian-sprites','city-art','roads','resident-routines','market','novita','game']){
  const found=new Set();
  for(const src of sources)for(const m of src.matchAll(new RegExp('\\./'+mod+'\\.mjs\\?v=(\\d+)','g')))found.add(m[1]);
  assert.equal(found.size,1,mod+'.mjs importato con una sola versione: '+[...found].join(','));
 }
 assert.match(game,/extra-pedestrian-sprites\.mjs\?v=005/);
 assert.match(game,/novita\.mjs\?v=010/);
 assert.ok(Number((page.match(/game\.mjs\?v=(\d+)/)||[])[1])>=208,'game.mjs?v= aggiornato');
});
