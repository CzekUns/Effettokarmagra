/* Lotti 10, 11 e 12 grafica — tre fogli pedoni di CODEX-GH (4 identità × 4 direzioni × 4 frame,
 * RGBA 384×160 ciascuno) collegati con la tabella generale dei fogli extra (kind 11–22).
 * Grafica PROVVISORIA da approvare da Simone. */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import {inflateSync} from 'node:zlib';
import {
 PEDESTRIAN_SHEETS,PEDESTRIAN_SHEET_CELL,PEDESTRIAN_SHEET_SIZE,PEDESTRIAN_SHEET_START_KIND,PEDESTRIAN_KIND_COUNT,
 EXTRA_PEDESTRIAN_NPC_START_KIND,LOTTO2_PEDESTRIAN_NPC_START_KIND,pedestrianSheet,pedestrianSheetForKind,
 loadPedestrianSheets,pedestrianSheetReady,drawSheetPedestrianSprite,drawLotto2PedestrianSprite,lotto2PedestrianSpriteReady
} from './extra-pedestrian-sprites.mjs';
import {PEOPLE_DIRECTIONS} from './pedestrian-sprites.mjs';
import {buildRoadGraph,createAgents} from './roads.mjs';
import {NOVITA,novitaTarget} from './novita.mjs';

const NEW_SHEETS=['lotto10','lotto11','lotto12'];
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

test('lotti 10–12: tabella dei fogli extra con 4 fogli (lotto 2 compreso), 12 identità nuove, kind 11–22, totale 23',()=>{
 assert.deepEqual(PEDESTRIAN_SHEETS.map(s=>s.id),['lotto2','lotto10','lotto11','lotto12']);
 assert.equal(PEDESTRIAN_SHEET_START_KIND,7);assert.equal(LOTTO2_PEDESTRIAN_NPC_START_KIND,7);assert.equal(EXTRA_PEDESTRIAN_NPC_START_KIND,4);
 const fresh=PEDESTRIAN_SHEETS.filter(s=>NEW_SHEETS.includes(s.id));
 assert.equal(fresh.length,3);
 assert.equal(fresh.reduce((n,s)=>n+s.identities.length,0),12,'12 identità nuove');
 assert.deepEqual(fresh.map(s=>s.startKind),[11,15,19]);
 assert.equal(PEDESTRIAN_KIND_COUNT,23);
 for(const s of PEDESTRIAN_SHEETS){
  assert.equal(s.identities.length,4);
  assert.ok(Object.isFrozen(s)&&Object.isFrozen(s.identities));
  assert.equal(s.path,'./assets/people/pedoni-'+s.id+'-4x4frames-24x40-rgba.png');
  for(let k=s.startKind;k<s.startKind+4;k++)assert.equal(pedestrianSheetForKind(k),s,'kind '+k);
 }
 const names=PEDESTRIAN_SHEETS.flatMap(s=>[...s.identities]);
 assert.equal(new Set(names).size,names.length,'nomi delle identità tutti diversi');
 assert.deepEqual([...pedestrianSheet('lotto10').identities],['signora-anziana-cappotto-borsa','ragazzo-felpa-zaino','donna-giacca-tracolla','uomo-giacca-cravatta-valigetta']);
 assert.deepEqual([...pedestrianSheet('lotto11').identities],['ragazza-telefono','uomo-robusto-righe','donna-vestito-corallo','sportivo-tuta']);
 assert.deepEqual([...pedestrianSheet('lotto12').identities],['nonno-coppola-bastone','nonna-vestito-fiori','ragazzo-cuffie','ragazza-giacca-jeans']);
 for(const k of [0,3,4,6,23,-1,1.5,'7'])assert.equal(pedestrianSheetForKind(k),null,'kind fuori dai fogli extra: '+k);
 assert.equal(pedestrianSheet('lotto99'),null);
});

for(const id of NEW_SHEETS)test(id+': PNG presente, 384×160 RGBA, alpha netto, bordi di ogni cella trasparenti, corpo solido e piedi in basso',async()=>{
 const img=await loadAtlas(id);const {width,height,columns,rows}=PEDESTRIAN_SHEET_CELL;
 assert.equal(img.w,PEDESTRIAN_SHEET_SIZE.width);assert.equal(img.h,PEDESTRIAN_SHEET_SIZE.height);
 assert.equal(columns*width,img.w);assert.equal(rows*height,img.h);assert.equal(rows,PEOPLE_DIRECTIONS.length);
 for(let row=0;row<rows;row++)for(let column=0;column<columns;column++){
  const x0=column*width,y0=row*height;let opaque=0,lowest=-1;
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
   const a=img.alpha(x0+x,y0+y);
   assert.ok(a===0||a===255,`alpha binario in cella ${column},${row}`);
   if(a){opaque++;lowest=y;}
  }
  for(let x=0;x<width;x++){assert.equal(img.alpha(x0+x,y0),0,`bordo alto trasparente in cella ${column},${row}`);assert.equal(img.alpha(x0+x,y0+height-1),0,`bordo basso trasparente in cella ${column},${row}`);}
  for(let y=0;y<height;y++){assert.equal(img.alpha(x0,y0+y),0,`bordo sinistro trasparente in cella ${column},${row}`);assert.equal(img.alpha(x0+width-1,y0+y),0,`bordo destro trasparente in cella ${column},${row}`);}
  assert.ok(opaque>=120&&opaque<=width*height*.7,`corpo solido in cella ${column},${row}: ${opaque} px`);
  assert.ok(lowest>=34&&lowest<=height-2,`piedi a terra (ultima riga opaca ${lowest}) in cella ${column},${row}`);
 }
 const bytes=await readFile(new URL(pedestrianSheet(id).path,import.meta.url));
 assert.ok(bytes.length<60000,'asset leggero per il telefono');
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
});

test('lotti 10–12: generatore e NOTE di CODEX-GH conservati in assets/people/sources con prefisso pedoni-lottoN-',async()=>{
 for(const n of [10,11,12]){
  for(const f of [`pedoni-lotto${n}-genera.py`,`pedoni-lotto${n}-NOTE.md`])await access(new URL('./assets/people/sources/'+f,import.meta.url));
  const note=await read(`assets/people/sources/pedoni-lotto${n}-NOTE.md`);
  assert.match(note,/384×160/);assert.match(note,/24×40/);
 }
});

test('lotti 10–12: ogni foglio si carica a parte e disegna la cella giusta; kind senza foglio non disegna',()=>{
 const original=globalThis.Image;
 const ctx={drawImage(...args){ctx.last=args;},last:null};
 assert.equal(drawSheetPedestrianSprite(ctx,0,0,0,11),false,'prima del caricamento non disegna');
 assert.equal(drawLotto2PedestrianSprite(ctx,0,0,0,0),false);
 class MockImage{complete=true;naturalWidth=384;naturalHeight=160;set src(v){this._src=v;}get src(){return this._src;}}
 try{
  globalThis.Image=MockImage;
  loadPedestrianSheets();
  for(const s of PEDESTRIAN_SHEETS)assert.equal(pedestrianSheetReady(s.id),true,s.id);
  assert.equal(lotto2PedestrianSpriteReady(),true);
  // kind 11 = lotto 10 identità 0, frame fermo, direzione right
  assert.equal(drawSheetPedestrianSprite(ctx,22,33,0,11,0,false,1,0),true);
  let p=ctx.last;assert.equal(p.length,9);assert.equal(p[1],0);assert.equal(p[2],3*40,'riga right');assert.equal(p[3],24);assert.equal(p[4],40);
  assert.ok(p[7]<4&&p[8]<5,'stessa scala degli altri pedoni');
  assert.ok(Math.abs(p[5]+p[7]/2-22)<1e-9&&Math.abs(p[6]+p[8]-33)<.9,'piedi sul punto dell\'NPC, come gli altri fogli');
  // kind 22 = lotto 12 identità 3 (ragazza giacca di jeans), in cammino verso l'alto
  assert.equal(drawSheetPedestrianSprite(ctx,22,33,-Math.PI/2,22,2,true,1.2,24),true);
  p=ctx.last;assert.ok(p[1]>=12*24&&p[1]<16*24,'ultime quattro colonne');assert.equal(p[2],0,'riga up');
  // kind 15 = lotto 11 identità 0, verso il basso; kind 18 = sportivo, verso sinistra
  assert.equal(drawSheetPedestrianSprite(ctx,22,33,Math.PI/2,15,0,false),true);p=ctx.last;assert.equal(p[1],0);assert.equal(p[2],40,'riga down');
  assert.equal(drawSheetPedestrianSprite(ctx,22,33,Math.PI,18,0,false),true);p=ctx.last;assert.equal(p[1],12*24);assert.equal(p[2],80,'riga left');
  // i quattro frame di camminata scorrono con il tempo
  const frames=new Set([0,.4,.8,1.2].map(t=>{drawSheetPedestrianSprite(ctx,0,0,0,19,t,true,1,0);return ctx.last[1];}));
  assert.equal(frames.size,4,'4 frame distinti per il nonno con il bastone (kind 19)');
  // ogni sheet usa la propria immagine
  const images=new Set(PEDESTRIAN_SHEETS.map(s=>{drawSheetPedestrianSprite(ctx,0,0,0,s.startKind,0,false);return ctx.last[0];}));
  assert.equal(images.size,4,'quattro cache separate');
  for(const k of [0,4,6,23,-1])assert.equal(drawSheetPedestrianSprite(ctx,0,0,0,k),false,'kind '+k+' non è dei fogli extra');
  assert.equal(drawLotto2PedestrianSprite(ctx,22,33,0,2,0,false),true);assert.equal(ctx.last[1],8*24,'lotto 2 identità 2 come prima');
 }finally{
  if(original===undefined)delete globalThis.Image;else globalThis.Image=original;
 }
});

test('lotti 10–12: i kind nuovi (11–22) compaiono davvero fra i pedoni generati, insieme a tutti gli altri',()=>{
 const graph=buildRoadGraph([{id:1,n:'Via Roma',t:'residential',w:8,p:[0,0,450,0,900,0]},{id:2,n:'Traversa',t:'residential',w:6,p:[450,-200,450,0,450,200]}]);
 const people=createAgents(graph,120,310,'walk',[]);
 assert.ok(people.length>=46,'abbastanza passanti per vedere tutti i kind: '+people.length);
 const kinds=new Set(people.map(p=>p.kind));
 for(let k=0;k<PEDESTRIAN_KIND_COUNT;k++)assert.ok(kinds.has(k),'kind '+k+' presente');
 assert.ok(people.every(p=>Number.isInteger(p.kind)&&p.kind>=0&&p.kind<PEDESTRIAN_KIND_COUNT));
 const cars=createAgents(graph,30,189,'car',[]);
 assert.ok(cars.every(c=>c.kind<7),'auto: kind 0–6 invariati');
});

test('lotti 10–12: collegamento nel gioco, voce NOVITÀ, registri e versioni uguali in tutti gli import',async()=>{
 const [art,game,road,resident,market,page,novita,work,visual,modus,approvare]=await Promise.all(
  ['city-art.mjs','game.mjs','roads.mjs','resident-routines.mjs','market.mjs','index.html','novita.mjs',
   'WORK_LOG.md','VISUAL_PROGRESS.md','PIXEL_ART_MODUS.md','NOVITA_DA_APPROVARE.md'].map(read));
 assert.match(art,/p\.kind>=PEDESTRIAN_SHEET_START_KIND&&\s*drawSheetPedestrianSprite\(c,x,y,angle,p\.kind,clock,moving,p\.speed,p\.seed\)/);
 assert.ok(!art.includes('drawLotto2PedestrianSprite'),'nessun ramo per singolo lotto nel renderer');
 assert.ok(game.includes('loadPedestrianSheets()')&&!game.includes('loadLotto2PedestrianSprites'));
 assert.match(road,/kind:kind==='walk'\?i%PEDESTRIAN_KIND_COUNT:i%7/);
 assert.match(resident,/kind:kindIndex%PEDESTRIAN_KIND_COUNT/);
 assert.match(market,/kind:hash\(seed\)%PEDESTRIAN_KIND_COUNT/);
 assert.ok(!/%23\b|%15\b|%19\b/.test(road+resident+market+art),'nessun numero magico dei kind');
 // NOVITÀ
 const entry=NOVITA.find(e=>e.id==='lotto10-12-pedoni');
 assert.ok(entry,'voce lotto10-12-pedoni');
 assert.match(entry.nome,/12 pedoni nuovi/);assert.match(entry.cosa,/PROVVISORIA/);
 assert.ok(novita.includes("id:'lotto10-12-pedoni'")&&novita.includes("roadMiddle(s,'Via Roma')"),'VAI A VEDERE su Via Roma');
 const s={spawn:[100,100],people:[{x:900,y:900,kind:12},{x:130,y:100,kind:9},{x:140,y:100,kind:21},{x:120,y:100,kind:14,indoors:true}],roads:[]};
 assert.deepEqual(novitaTarget(entry,s),{x:140,y:100},'il pedone dei lotti 10–12 più vicino, fuori casa');
 // registri
 for(const [name,text] of [['WORK_LOG',work],['VISUAL_PROGRESS',visual],['NOVITA_DA_APPROVARE',approvare]])
  assert.ok(/[Ll]otti 10–12/.test(text)&&text.includes('12 pedoni nuovi'),name+' aggiornato');
 assert.ok(approvare.includes('`lotto10-12-pedoni`'),'NOVITA_DA_APPROVARE elenca la voce');
 for(const n of [10,11,12])assert.ok(modus.includes(`pedoni-lotto${n}-4x4frames-24x40-rgba.png`),'PIXEL_ART_MODUS tabella fogli persone: lotto '+n);
 // versioni: una sola per modulo in tutti gli import (moduli non test + index.html)
 const {readdir}=await import('node:fs/promises');
 const names=(await readdir(new URL('./',import.meta.url))).filter(f=>(f.endsWith('.mjs')&&!f.endsWith('.test.mjs'))||f==='index.html');
 const sources=await Promise.all(names.map(read));
 for(const mod of ['extra-pedestrian-sprites','city-art','roads','resident-routines','market','novita','bank-interior','shop-interiors','npc-reactions','npc-density','npc-commute','game']){
  const found=new Set();
  for(const src of sources)for(const m of src.matchAll(new RegExp('\\./'+mod+'\\.mjs\\?v=(\\d+)','g')))found.add(m[1]);
  assert.equal(found.size,1,mod+'.mjs importato con una sola versione: '+[...found].join(','));
 }
 assert.match(game,/extra-pedestrian-sprites\.mjs\?v=004/);
 assert.ok(Number((page.match(/game\.mjs\?v=(\d+)/)||[])[1])>=207,'game.mjs?v= aggiornato');
 assert.ok(Number((game.match(/city-art\.mjs\?v=(\d+)/)||[])[1])>=136);
 assert.ok(Number((game.match(/roads\.mjs\?v=(\d+)/)||[])[1])>=163);
});
