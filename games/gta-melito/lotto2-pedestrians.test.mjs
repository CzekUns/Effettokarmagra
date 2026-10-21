/* Lotto 2 grafica — foglio pedoni di CODEX-GH (4 identità × 4 direzioni × 4 frame, RGBA 384×160)
 * e suo collegamento nel gioco. Grafica PROVVISORIA da approvare da Simone. */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import {inflateSync} from 'node:zlib';
import {
 LOTTO2_PEDESTRIAN_ATLAS_PATH,LOTTO2_PEDESTRIAN_IDENTITIES,LOTTO2_PEDESTRIAN_CELL,
 LOTTO2_PEDESTRIAN_NPC_START_KIND,PEDESTRIAN_KIND_COUNT,EXTRA_PEDESTRIAN_NPC_START_KIND,
 loadLotto2PedestrianSprites,lotto2PedestrianSpriteReady,drawLotto2PedestrianSprite
} from './extra-pedestrian-sprites.mjs';
import {PEOPLE_DIRECTIONS} from './pedestrian-sprites.mjs';

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
 return {w,h,px:out,alpha:(x,y)=>out[(y*w+x)*4+3],rgba:(x,y)=>out.readUInt32BE((y*w+x)*4)};
}
const cell=(img,column,row)=>{
 const {width,height}=LOTTO2_PEDESTRIAN_CELL,x0=column*width,y0=row*height,out=[];
 for(let y=0;y<height;y++)for(let x=0;x<width;x++)out.push(img.rgba(x0+x,y0+y));
 return out;
};
const differ=(a,b)=>a.some((v,i)=>v!==b[i]);
let atlas;
const loadAtlas=async()=>atlas||(atlas=decodeRGBA(await readFile(new URL(LOTTO2_PEDESTRIAN_ATLAS_PATH,import.meta.url))));

test('lotto 2: atlante 384×160 RGBA, 16 colonne × 4 righe di celle 24×40',async()=>{
 const img=await loadAtlas();
 assert.equal(img.w,384);assert.equal(img.h,160);
 assert.deepEqual(LOTTO2_PEDESTRIAN_CELL,{width:24,height:40,columns:16,rows:4});
 assert.equal(LOTTO2_PEDESTRIAN_CELL.columns*LOTTO2_PEDESTRIAN_CELL.width,img.w);
 assert.equal(LOTTO2_PEDESTRIAN_CELL.rows*LOTTO2_PEDESTRIAN_CELL.height,img.h);
 assert.equal(PEOPLE_DIRECTIONS.length,LOTTO2_PEDESTRIAN_CELL.rows,'righe = direzioni up/down/left/right');
 assert.equal(LOTTO2_PEDESTRIAN_IDENTITIES.length*4,LOTTO2_PEDESTRIAN_CELL.columns,'4 personaggi × 4 frame');
});

test('lotto 2: le 64 celle hanno angoli trasparenti, corpo solido e alpha netto (0 o 255)',async()=>{
 const img=await loadAtlas();const {width,height}=LOTTO2_PEDESTRIAN_CELL;
 let cells=0;
 for(let row=0;row<4;row++)for(let column=0;column<16;column++){
  const x0=column*width,y0=row*height;let opaque=0;
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
   const a=img.alpha(x0+x,y0+y);
   assert.ok(a===0||a===255,`alpha binario in cella ${column},${row}`);
   if(a)opaque++;
  }
  for(const [cx,cy] of [[0,0],[width-1,0],[0,height-1],[width-1,height-1],[1,1],[width-2,height-2]])
   assert.equal(img.alpha(x0+cx,y0+cy),0,`angolo trasparente in cella ${column},${row}`);
  assert.ok(opaque>=120&&opaque<=width*height*.7,`corpo solido in cella ${column},${row}: ${opaque} px`);
  cells++;
 }
 assert.equal(cells,64);
});

test('lotto 2: 4 identità diverse, 4 frame di camminata e 4 direzioni distinti',async()=>{
 const img=await loadAtlas();
 for(let row=0;row<4;row++){
  const firsts=LOTTO2_PEDESTRIAN_IDENTITIES.map((_,i)=>cell(img,i*4,row));
  for(let a=0;a<4;a++)for(let b=a+1;b<4;b++)assert.ok(differ(firsts[a],firsts[b]),`identità ${a} e ${b} diverse (riga ${row})`);
 }
 for(let identity=0;identity<4;identity++){
  const frames=[0,1,2,3].map(f=>cell(img,identity*4+f,1));
  for(let a=0;a<4;a++)for(let b=a+1;b<4;b++)assert.ok(differ(frames[a],frames[b]),`frame ${a} e ${b} diversi (identità ${identity})`);
  const dirs=[0,1,2,3].map(d=>cell(img,identity*4,d));
  for(let a=0;a<4;a++)for(let b=a+1;b<4;b++)assert.ok(differ(dirs[a],dirs[b]),`direzioni ${a} e ${b} diverse (identità ${identity})`);
 }
 assert.deepEqual([...LOTTO2_PEDESTRIAN_IDENTITIES],['signora-anziana-borsa','ragazzo-zaino','uomo-giacca-lavoro','ragazza-cappotto-rosso']);
});

test('lotto 2: generatore e anteprima conservati in assets/people/sources',async()=>{
 for(const f of ['pedoni-lotto2-genera.py','pedoni-lotto2-anteprima-3x.png','pedoni-lotto2-verifica.py'])
  await access(new URL('./assets/people/sources/'+f,import.meta.url));
 const p=await readFile(new URL(LOTTO2_PEDESTRIAN_ATLAS_PATH,import.meta.url));
 assert.ok(p.length<60000,'asset leggero per il telefono');
});

test('lotto 2: il foglio si carica a parte e disegna la cella giusta; senza foglio non disegna',()=>{
 const original=globalThis.Image;
 assert.equal(drawLotto2PedestrianSprite({drawImage(){throw new Error('no');}},0,0,0,0),false,'prima del caricamento non disegna');
 class MockImage{complete=true;naturalWidth=384;naturalHeight=160;set src(v){this._src=v;}get src(){return this._src;}}
 try{
  globalThis.Image=MockImage;
  loadLotto2PedestrianSprites();
  assert.equal(lotto2PedestrianSpriteReady(),true);
  let p;const ctx={drawImage(...args){p=args;}};
  assert.equal(drawLotto2PedestrianSprite(ctx,22,33,0,0,0,false,1,0),true);
  assert.equal(p.length,9);assert.equal(p[1],0,'signora, frame fermo');assert.equal(p[2],3*40,'riga right');
  assert.equal(p[3],24);assert.equal(p[4],40);
  assert.ok(p[7]<4&&p[8]<5,'stessa scala degli altri pedoni');
  assert.equal(drawLotto2PedestrianSprite(ctx,22,33,-Math.PI/2,3,2,true,1.2,24),true);
  assert.ok(p[1]>=12*24&&p[1]<16*24,'ragazza col cappotto rosso nelle ultime quattro colonne');
  assert.equal(p[2],0,'riga up');
  assert.equal(drawLotto2PedestrianSprite(ctx,22,33,Math.PI/2,2,0,false),true);assert.equal(p[1],8*24);assert.equal(p[2],40,'riga down');
  assert.equal(drawLotto2PedestrianSprite(ctx,22,33,0,4,1,true),false,'identità inesistente');
  assert.equal(drawLotto2PedestrianSprite(ctx,22,33,0,-1,1,true),false);
 }finally{
  if(original===undefined)delete globalThis.Image;else globalThis.Image=original;
 }
});

test('lotto 2: i quattro nuovi pedoni entrano nella rotazione (kind 7–10) senza togliere gli altri né aggiungere NPC',async()=>{
 assert.equal(EXTRA_PEDESTRIAN_NPC_START_KIND,4);
 assert.equal(LOTTO2_PEDESTRIAN_NPC_START_KIND,7,'dopo i 4 originali e i 3 del secondo lotto');
 assert.ok(PEDESTRIAN_KIND_COUNT>=11,'almeno i kind fino al lotto 2 (dai lotti 10–12 sono 23)');
 const [art,game,road,resident,market,page,novita]=await Promise.all(['city-art.mjs','game.mjs','roads.mjs','resident-routines.mjs','market.mjs','index.html','novita.mjs']
  .map(f=>readFile(new URL('./'+f,import.meta.url),'utf8')));
 // Dai lotti 10–12 il lotto 2 passa dalla tabella generale dei fogli extra (kind 7 in su).
 const lotto2At=art.indexOf('drawSheetPedestrianSprite(c,x,y,angle,p.kind,clock,moving,p.speed,p.seed)');
 const extraAt=art.indexOf('drawExtraPedestrianSprite(c,x,y,angle,p.kind-EXTRA_PEDESTRIAN_NPC_START_KIND+1');
 const firstAt=art.indexOf('drawPedestrianSprite(c,x,y,angle,p.kind,clock,moving,p.speed,p.seed)');
 assert.ok(lotto2At>0&&extraAt>lotto2At&&firstAt>extraAt,'fogli extra provati prima del secondo lotto e del primo foglio (che restano)');
 assert.match(art,/p\.kind>=PEDESTRIAN_SHEET_START_KIND&&/);
 assert.ok(game.includes('loadPedestrianSheets()')&&game.includes('loadExtraPedestrianSprites()')&&game.includes('loadPedestrianSprites()'));
 assert.match(road,/kind:kind==='walk'\?i%PEDESTRIAN_KIND_COUNT:i%7/,'passanti su tutti i fogli, auto invariate');
 assert.match(resident,/kind:kindIndex%PEDESTRIAN_KIND_COUNT/,'residenti');
 assert.match(market,/kind:hash\(seed\)%PEDESTRIAN_KIND_COUNT/,'clienti e venditori del mercato');
 assert.ok(!/kind:i%11|kind:kindIndex%11|%11,/.test(road+resident+market),'nessun numero magico 11');
 assert.ok(novita.includes("id:'lotto2-pedoni'")&&novita.includes("roadMiddle(s,'Via Roma')"),'voce NOVITÀ con VAI A VEDERE su Via Roma');
 assert.ok(Number((page.match(/game\.mjs\?v=(\d+)/)||[])[1])>=200,'game.mjs?v= aggiornato');
 assert.ok(Number((game.match(/city-art\.mjs\?v=(\d+)/)||[])[1])>=135);
 assert.ok(Number((game.match(/roads\.mjs\?v=(\d+)/)||[])[1])>=162);
 for(const f of [art,game,road,resident,market])assert.match(f,/extra-pedestrian-sprites\.mjs\?v=00[3-9]/,'versione cache del loader aggiornata');
});
