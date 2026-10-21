import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {LOADING_SCREENS,LOADING_SCREEN_STORAGE_KEY,chooseLoadingScreen,applyLoadingScreen} from './loading-screens.mjs';

function dimensions(bytes){
 if(bytes.subarray(0,8).toString('hex')==='89504e470d0a1a0a')return [bytes.readUInt32BE(16),bytes.readUInt32BE(20)];
 assert.equal(bytes.readUInt16BE(0),0xffd8,'firma JPEG');
 for(let i=2;i<bytes.length-10;){
  if(bytes[i]!==0xff){i++;continue;}
  const marker=bytes[i+1];
  if(marker===0xd8||marker===0xd9){i+=2;continue;}
  const length=bytes.readUInt16BE(i+2);
  if([0xc0,0xc1,0xc2,0xc3].includes(marker))return [bytes.readUInt16BE(i+7),bytes.readUInt16BE(i+5)];
  i+=2+length;
 }
 throw new Error('dimensioni JPEG non trovate');
}

test('sette schermate: due formati corretti, file sotto 400 KB, nessun Municipio',async()=>{
 assert.equal(LOADING_SCREENS.length,7);
 assert.equal(new Set(LOADING_SCREENS.map(s=>s.id)).size,7);
 assert.ok(LOADING_SCREENS.some(s=>s.id==='render'));
 for(const screen of LOADING_SCREENS){
  assert.ok(screen.title&&screen.credit);
  assert.doesNotMatch(JSON.stringify(screen),/municipio/i);
  for(const [file,expected] of [[screen.desktop,[1280,720]],[screen.mobile,[844,390]]]){
   const url=new URL(file,import.meta.url),size=(await stat(url)).size;
   assert.ok(size>0&&size<400_000,`${file}: ${size} byte`);
   assert.deepEqual(dimensions(await readFile(url)),expected,file);
  }
 }
});

test('la scelta conserva l’ultima schermata e non la ripete',()=>{
 const memory=new Map(),storage={getItem:k=>memory.get(k),setItem:(k,v)=>memory.set(k,v)};
 let previous=null;
 for(let i=0;i<35;i++){
  const screen=chooseLoadingScreen({storage,random:()=>.6});
  if(previous)assert.notEqual(screen.id,previous);
  assert.equal(memory.get(LOADING_SCREEN_STORAGE_KEY),screen.id);
  previous=screen.id;
 }
});

test('applica PC, telefono, titolo e credito all’elemento di caricamento',()=>{
 const properties=new Map(),loading={style:{setProperty:(k,v)=>properties.set(k,v)},dataset:{}},caption={textContent:''};
 const document={getElementById:id=>({'loading':loading,'loading-scene-title':caption})[id]};
 const screen=applyLoadingScreen({document,forceId:'festa-patronale'});
 assert.equal(loading.dataset.screen,screen.id);
 assert.match(properties.get('--loading-desktop'),/festa-patronale-1280x720\.jpg/);
 assert.match(properties.get('--loading-mobile'),/festa-patronale-844x390\.jpg/);
 assert.match(caption.textContent,/La festa patronale · artwork provvisoria/);
});

test('collegamento all’avvio e anteprima da NOVITÀ con sfumatura sotto il testo',async()=>{
 const [game,html,novita]=await Promise.all(['game.mjs','index.html','novita.mjs'].map(f=>readFile(new URL(f,import.meta.url),'utf8')));
 assert.match(game,/loading-screens\.mjs\?v=001/);
 assert.match(game,/applyLoadingScreen\(\);loadMotorcycleSprites/);
 assert.match(game,/entry\.prova==='caricamento'/);
 assert.match(game,/loading-preview-close/);
 assert.match(game,/novita\.mjs\?v=018/);
 assert.match(html,/game\.mjs\?v=217/);
 assert.match(html,/--loading-desktop/);assert.match(html,/--loading-mobile/);
 assert.match(html,/\.loading::before\{[^}]*linear-gradient/);
 assert.match(html,/id="loading-scene-title"/);
 assert.match(novita,/id:'caricamento-artwork'/);
});
