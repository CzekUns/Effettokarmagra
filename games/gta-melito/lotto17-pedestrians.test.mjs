/* Lotti 17–20: 16 pedoni, kind 31–46, grafica PROVVISORIA da approvare da Simone. */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access,readdir} from 'node:fs/promises';
import {inflateSync} from 'node:zlib';
import {PEDESTRIAN_SHEETS,PEDESTRIAN_KIND_COUNT,pedestrianSheet,pedestrianSheetForKind,
 loadPedestrianSheets,pedestrianSheetReady,drawSheetPedestrianSprite} from './extra-pedestrian-sprites.mjs';
import {buildRoadGraph,createAgents} from './roads.mjs';
import {NOVITA,novitaTarget} from './novita.mjs';

const IDS=['lotto17','lotto18','lotto19','lotto20'];
const read=f=>readFile(new URL('./'+f,import.meta.url),'utf8');
function decodeRGBA(bytes){
 assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
 const w=bytes.readUInt32BE(16),h=bytes.readUInt32BE(20);
 assert.equal(bytes[24],8);assert.equal(bytes[25],6);assert.equal(bytes[28],0);
 const idats=[];let at=8;
 while(at<bytes.length){const len=bytes.readUInt32BE(at),tag=bytes.toString('ascii',at+4,at+8);if(tag==='IDAT')idats.push(bytes.subarray(at+8,at+8+len));at+=12+len;if(tag==='IEND')break;}
 const raw=inflateSync(Buffer.concat(idats)),stride=w*4,out=Buffer.alloc(h*stride);let cursor=0;
 for(let y=0;y<h;y++){
  const filter=raw[cursor++],row=Buffer.from(raw.subarray(cursor,cursor+stride));cursor+=stride;
  const prev=y?out.subarray((y-1)*stride,y*stride):Buffer.alloc(stride);
  for(let x=0;x<stride;x++){
   const left=x>=4?row[x-4]:0,up=prev[x],diag=x>=4?prev[x-4]:0;
   if(filter===1)row[x]=(row[x]+left)&255;
   else if(filter===2)row[x]=(row[x]+up)&255;
   else if(filter===3)row[x]=(row[x]+((left+up)>>1))&255;
   else if(filter===4){const p=left+up-diag,pa=Math.abs(p-left),pb=Math.abs(p-up),pc=Math.abs(p-diag);row[x]=(row[x]+(pa<=pb&&pa<=pc?left:pb<=pc?up:diag))&255;}
   else assert.equal(filter,0);
  }
  row.copy(out,y*stride);
 }
 return {w,h,rgba:(x,y)=>out.readUInt32BE((y*w+x)*4),alpha:(x,y)=>out[(y*w+x)*4+3]};
}
const atlas=new Map();
const get=async id=>{
 if(!atlas.has(id))atlas.set(id,decodeRGBA(await readFile(new URL(pedestrianSheet(id).path,import.meta.url))));
 return atlas.get(id);
};
const pixels=(img,col,row)=>{
 const result=[];for(let y=0;y<40;y++)for(let x=0;x<24;x++)result.push(img.rgba(col*24+x,row*40+y));return result;
};

test('lotti 17–20: quattro fogli nuovi in sequenza, 16 identità, kind 31–46',()=>{
 assert.deepEqual(PEDESTRIAN_SHEETS.slice(-4).map(s=>s.id),IDS);
 assert.deepEqual(IDS.map(id=>pedestrianSheet(id).startKind),[31,35,39,43]);
 assert.equal(PEDESTRIAN_KIND_COUNT,47);
 for(const id of IDS){const s=pedestrianSheet(id);assert.equal(s.identities.length,4);assert.ok(Object.isFrozen(s));
  for(let k=s.startKind;k<s.startKind+4;k++)assert.equal(pedestrianSheetForKind(k),s);}
 for(const k of [0,4,6,47,-1,1.5,'31'])assert.equal(pedestrianSheetForKind(k),null);
 assert.equal(new Set(PEDESTRIAN_SHEETS.flatMap(s=>s.identities)).size,PEDESTRIAN_KIND_COUNT-7);
});

for(const id of IDS)test(id+': 64 celle RGBA 24×40, bordi trasparenti, piedi in basso, frame e direzioni distinti',async()=>{
 const img=await get(id);assert.deepEqual([img.w,img.h],[384,160]);
 for(let row=0;row<4;row++)for(let col=0;col<16;col++){
  let opaque=0,lowest=-1;
  for(let y=0;y<40;y++)for(let x=0;x<24;x++){
   const a=img.alpha(col*24+x,row*40+y);assert.ok(a===0||a===255);
   if(x===0||x===23||y===0||y===39)assert.equal(a,0,`bordo ${id} ${col},${row}`);
   if(a){opaque++;lowest=y;}
  }
  assert.ok(opaque>=150&&opaque<=600,`corpo ${id} ${col},${row}: ${opaque}`);
  assert.ok(lowest>=34&&lowest<=38,`piedi ${id} ${col},${row}: ${lowest}`);
 }
 for(let identity=0;identity<4;identity++){
  assert.equal(new Set([0,1,2,3].map(f=>pixels(img,identity*4+f,1).join(','))).size,4,`frame ${id} identità ${identity}`);
  assert.equal(new Set([0,1,2,3].map(d=>pixels(img,identity*4,d).join(','))).size,4,`direzioni ${id} identità ${identity}`);
 }
 const file=await readFile(new URL(pedestrianSheet(id).path,import.meta.url));assert.ok(file.length<60000,'atlante leggero');
});

test('caricamento separato e disegno dei kind 31–46 con pivot e scala comuni',()=>{
 const original=globalThis.Image,ctx={last:null,drawImage(...args){this.last=args;}};
 class MockImage{complete=true;naturalWidth=384;naturalHeight=160;set src(v){this._src=v;}get src(){return this._src;}}
 try{
  globalThis.Image=MockImage;loadPedestrianSheets();
  for(const id of IDS)assert.equal(pedestrianSheetReady(id),true);
  const images=[];
  for(const id of IDS){const s=pedestrianSheet(id);
   assert.equal(drawSheetPedestrianSprite(ctx,22,33,0,s.startKind,0,false),true);
   const p=ctx.last;images.push(p[0]);assert.deepEqual(p.slice(1,5),[0,120,24,40]);
   assert.ok(p[7]<4&&p[8]<5);assert.ok(Math.abs(p[5]+p[7]/2-22)<1e-9);
   assert.equal(drawSheetPedestrianSprite(ctx,22,33,Math.PI,s.startKind+3,0,false),true);
   assert.deepEqual(ctx.last.slice(1,5),[288,80,24,40]);
  }
  assert.equal(new Set(images).size,4);
  assert.equal(drawSheetPedestrianSprite(ctx,0,0,0,47),false);
 }finally{if(original===undefined)delete globalThis.Image;else globalThis.Image=original;}
});

test('kind 31–46 disponibili nella rotazione dei passanti e VAI A VEDERE cerca solo questi',()=>{
 const graph=buildRoadGraph([{id:1,n:'Via Roma',t:'residential',w:8,p:[0,0,450,0,900,0]},{id:2,n:'Traversa',t:'residential',w:6,p:[450,-200,450,0,450,200]}]);
 const people=createAgents(graph,160,310,'walk',[]),kinds=new Set(people.map(p=>p.kind));
 for(let k=31;k<=46;k++)assert.ok(kinds.has(k),'kind '+k+' nasce tra i passanti');
 assert.ok(people.every(p=>p.kind>=0&&p.kind<47));
 const entry=NOVITA.find(e=>e.id==='lotto17-20-pedoni');assert.ok(entry);
 assert.match(entry.cosa,/PROVVISORIA/);
 const s={spawn:[100,100],people:[{x:105,y:100,kind:30},{x:140,y:100,kind:43},{x:110,y:100,kind:39,indoors:true},{x:900,y:900,kind:46}],roads:[]};
 assert.deepEqual(novitaTarget(entry,s),{x:140,y:100});
});

test('sorgenti, registri e versioni dei moduli aggiornati',async()=>{
 for(const id of IDS)for(const suffix of ['genera.py','NOTE.md'])await access(new URL(`./assets/people/sources/pedoni-${id}-${suffix}`,import.meta.url));
 const [game,html,novita,work,visual,modus,approvare]=await Promise.all(['game.mjs','index.html','novita.mjs','WORK_LOG.md','VISUAL_PROGRESS.md','PIXEL_ART_MODUS.md','NOVITA_DA_APPROVARE.md'].map(read));
 for(const text of [work,visual,approvare])assert.ok(/[Ll]otti 17–20/.test(text)&&text.includes('PROVVISORIO'));
 for(const id of IDS)assert.ok(modus.includes(`pedoni-${id}-4x4frames-24x40-rgba.png`));
 assert.ok(novita.includes("id:'lotto17-20-pedoni'")&&novita.includes("roadMiddle(s,'Via Roma')"));
 assert.match(game,/extra-pedestrian-sprites\.mjs\?v=006/);assert.match(game,/novita\.mjs\?v=013/);assert.match(html,/game\.mjs\?v=211/);
 const names=(await readdir(new URL('./',import.meta.url))).filter(f=>(f.endsWith('.mjs')&&!f.endsWith('.test.mjs'))||f==='index.html');
 const sources=await Promise.all(names.map(read));
 for(const mod of ['extra-pedestrian-sprites','city-art','roads','resident-routines','market','novita','game']){
  const found=new Set();for(const src of sources)for(const m of src.matchAll(new RegExp('\\./'+mod+'\\.mjs\\?v=(\\d+)','g')))found.add(m[1]);
  assert.equal(found.size,1,mod+' versions: '+[...found]);
 }
});
