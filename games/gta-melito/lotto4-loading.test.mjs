/* Lotto 4 grafica — sfondo della schermata di caricamento: due render del gioco post-prodotti da CODEX-GH
 * (1280×720 per il PC, 844×390 per il telefono) collegati nel CSS di `.loading`. Grafica PROVVISORIA da approvare da Simone. */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';

const IMAGES=[['./assets/ui/loading-1280x720.png',1280,720],['./assets/ui/loading-844x390.png',844,390]];
const MAX_BYTES=400_000;

function pngSize(bytes){
 assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a','firma PNG');
 assert.equal(bytes.toString('ascii',12,16),'IHDR','primo chunk IHDR');
 return {w:bytes.readUInt32BE(16),h:bytes.readUInt32BE(20),depth:bytes[24],color:bytes[25],interlace:bytes[28]};
}

test('lotto 4: i due PNG esistono, pesano meno di 400 KB e hanno le dimensioni giuste',async()=>{
 for(const [file,w,h] of IMAGES){
  const url=new URL(file,import.meta.url),info=await stat(url);
  assert.ok(info.size>0&&info.size<MAX_BYTES,file+' sotto i 400 KB ('+info.size+' byte)');
  const png=pngSize(await readFile(url));
  assert.equal(png.w,w,file+' larghezza');assert.equal(png.h,h,file+' altezza');
  assert.equal(png.depth,8,file+' 8 bit per canale');assert.equal(png.interlace,0,file+' non interlacciato');
  assert.ok([2,3].includes(png.color),file+' RGB o tavolozza (nessun alpha: è uno sfondo pieno)');
 }
});

test('lotto 4: le NOTE di CODEX-GH sono conservate accanto agli asset',async()=>{
 const note=await readFile(new URL('./assets/ui/sources/loading-NOTE.md',import.meta.url),'utf8');
 assert.match(note,/loading-1280x720\.png/);assert.match(note,/loading-844x390\.png/);
});

test('lotto 4: il CSS di .loading usa i due sfondi (PC e telefono) con pixel netti e testo in basso',async()=>{
 const page=await readFile(new URL('./index.html',import.meta.url),'utf8');
 const css=page.slice(page.indexOf('.loading{'),page.indexOf('.loading button'));
 assert.ok(css.length>0,'blocco CSS di .loading trovato prima di .loading button');
 assert.match(css,/\.loading\{[^}]*url\('\.\/assets\/ui\/loading-1280x720\.png'\)[^}]*\}/,'sfondo 1280×720 sulla regola base');
 assert.match(css,/\.loading\{[^}]*(background:[^;}]*center\/cover|background-size:cover)/,'background-size: cover');
 assert.match(css,/\.loading\{[^}]*(background:[^;}]*center\/cover|background-position:center)/,'background-position: center');
 assert.match(css,/\.loading\{[^}]*image-rendering:pixelated/,'pixel netti');
 assert.match(css,/\.loading\{[^}]*justify-content:flex-end/,'titolo, testo e barra in basso sulla fascia scura');
 assert.doesNotMatch(css,/\.loading\{[^}]*justify-content:center/,'non più centrato');
 assert.match(css,/\.loading h2\{[^}]*text-shadow/,'ombra sul titolo');
 assert.match(css,/\.loading p\{[^}]*text-shadow/,'ombra sul testo');
 const media=css.match(/@media\(max-width:680px\),\(max-height:480px\)\{([\s\S]*?)\}\}/);
 assert.ok(media,'media query per telefono stretto o orizzontale');
 assert.match(media[1],/\.loading\{[^}]*url\('\.\/assets\/ui\/loading-844x390\.png'\)/,'sfondo 844×390 sul telefono');
 assert.match(css,/\.loading-bar\{/,'barra di caricamento (solo CSS)');
 assert.match(css,/@keyframes loading-sweep/,'animazione della barra');
 assert.match(css,/\.loading\[hidden\] \.loading-bar::before\{animation:none\}/,'barra ferma quando la schermata è nascosta');
});

test('lotto 4: la sezione .loading resta con i suoi id (loading, loading-title, loading-text, retry) più la barra decorativa',async()=>{
 const page=await readFile(new URL('./index.html',import.meta.url),'utf8');
 const section=page.match(/<section class="loading" id="loading">([\s\S]*?)<\/section>/);
 assert.ok(section,'sezione .loading#loading');
 assert.match(section[1],/<h2 id="loading-title">/);
 assert.match(section[1],/<p id="loading-text">/);
 assert.match(section[1],/<div class="loading-bar" aria-hidden="true"><\/div>/);
 assert.match(section[1],/<button id="retry" hidden>/);
 assert.match(page,/\.loading\[hidden\]\{display:none\}/,'[hidden] continua a nascondere la schermata');
 assert.ok(Number((page.match(/game\.mjs\?v=(\d+)/)||[])[1])>=202,'versione cache di game.mjs invariata o superiore');
});
