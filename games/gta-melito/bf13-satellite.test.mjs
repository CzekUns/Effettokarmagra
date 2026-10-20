import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {xy} from './osm.mjs';
import {gameToLonLat,lonLatToGame,lonLatToTile,tileToLonLat,tileRect,tileZoomFor,tilesForView,tileUrl,
 createSatelliteOverlay,satelliteFromUrl,SATELLITE_ATTRIBUTION,SATELLITE_RULES} from './satellite-overlay.mjs';

const map=JSON.parse(await readFile(new URL('./data/melito-map.json',import.meta.url),'utf8'));
const P=map.projection;

test('BF13 game ↔ WGS84: exact inverse of osm.mjs xy(), on the town hall and on the map corners',()=>{
 for(const [x,y] of [[1300,954],[0,0],[P.width,P.height],[1178.9,1302.8]]){
  const g=gameToLonLat(x,y,P),back=xy(g.lon,g.lat,P);
  assert.ok(Math.abs(back[0]-x)<.06&&Math.abs(back[1]-y)<.06,'xy() returns the same point (0,1 m rounding)');
  const again=lonLatToGame(g.lon,g.lat,P);
  assert.ok(Math.hypot(again.x-x,again.y-y)<1e-6);
 }
 const hall=gameToLonLat(1300,954,P);
 assert.ok(Math.abs(hall.lon-14.23275)<1e-4&&Math.abs(hall.lat-40.92399)<1e-4,'Municipio POI near 14.2328 E 40.9240 N');
});

test('BF13 WGS84 ↔ Web Mercator tiles: the town hall falls in tile 18/141435/98357',()=>{
 const hall=gameToLonLat(1300,954,P),t=lonLatToTile(hall.lon,hall.lat,18);
 assert.equal(Math.floor(t.x),141435);assert.equal(Math.floor(t.y),98357);
 const g=tileToLonLat(t.x,t.y,18);
 assert.ok(Math.abs(g.lon-hall.lon)<1e-9&&Math.abs(g.lat-hall.lat)<1e-9,'round trip');
 assert.equal(tileUrl(18,141435,98357),'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/18/98357/141435');
});

test('BF13 tile rectangles: about 115 m at z18 in Melito, neighbours share their edges exactly',()=>{
 const a=tileRect(141435,98357,18,P),b=tileRect(141436,98357,18,P),c=tileRect(141435,98358,18,P);
 assert.ok(a.w>110&&a.w<120&&a.h>110&&a.h<120,'size '+a.w.toFixed(1)+'×'+a.h.toFixed(1));
 assert.ok(Math.abs(a.x+a.w-b.x)<1e-9&&Math.abs(a.y+a.h-c.y)<1e-9);
 const hall=tileRect(141435,98357,18,P);
 assert.ok(1300>=hall.x&&1300<=hall.x+hall.w&&954>=hall.y&&954<=hall.y+hall.h,'the town hall is inside its tile');
});

test('BF13 tile zoom follows the camera (about one photo pixel per screen pixel) and stays in 15..19',()=>{
 assert.equal(tileZoomFor(6.6),19);assert.equal(tileZoomFor(1),17);assert.equal(tileZoomFor(.25),15);
 for(const z of [.05,.5,2,4,30])assert.ok(tileZoomFor(z)>=SATELLITE_RULES.minZoom&&tileZoomFor(z)<=SATELLITE_RULES.maxZoom);
 const view=[1250,900,1350,1000],tiles=tilesForView(view,18,P);
 assert.ok(tiles.length>=1&&tiles.length<=4,'a 100 m view needs 1-4 tiles at z18');
});

function fakeImages(){
 const made=[];
 return {made,factory:()=>{const img={src:'',onload:null,onerror:null};made.push(img);return img;}};
}
const fakeCanvas=()=>{const calls=[];return {calls,save(){},restore(){},drawImage(...a){calls.push(a);},set globalAlpha(v){this.alpha=v;},set imageSmoothingEnabled(v){}};};

test('BF13 overlay off: no request at all; on: only the tiles in view, limited pending and LRU cache',()=>{
 const imgs=fakeImages(),o=createSatelliteOverlay({projection:P,imageFactory:imgs.factory,now:()=>1,maxTiles:6});
 const c=fakeCanvas();
 for(let i=0;i<50;i++)assert.equal(o.draw(c,[1000,800,1600,1200],1),0);
 assert.equal(o.requests,0,'switched off: nothing is downloaded');assert.equal(imgs.made.length,0);
 assert.equal(o.enabled,false,'starts switched off');
 o.toggle();
 o.draw(c,[1250,900,1350,1000],2);
 assert.ok(o.requests>=1&&o.requests<=SATELLITE_RULES.maxPending);
 assert.ok(imgs.made.every(i=>i.crossOrigin==='anonymous'&&/World_Imagery\/MapServer\/tile\/18\//.test(i.src)));
 assert.equal(c.calls.length,0,'nothing drawn until the tiles are loaded');
 imgs.made.forEach(i=>i.onload());
 assert.ok(o.draw(c,[1250,900,1350,1000],2)>=1);assert.ok(c.calls.length>=1);
 assert.equal(c.alpha,.5,'default opacity 50%');
 // a tour of the whole town never keeps more than maxTiles in memory
 for(let x=0;x<2000;x+=300){o.draw(c,[x,1000,x+120,1120],2);imgs.made.forEach(i=>i.onload&&i.onload());}
 assert.ok(o.cached<=6,'LRU cache: '+o.cached);
});

test('BF13 no network: a failing tile is not drawn, not retried every frame, and raises no error',()=>{
 let t=0;const imgs=fakeImages(),o=createSatelliteOverlay({projection:P,imageFactory:imgs.factory,now:()=>t});
 o.setEnabled(true);const c=fakeCanvas();
 o.draw(c,[1290,940,1310,960],2);const first=o.requests;
 imgs.made.forEach(i=>i.onerror());t=1;
 for(let i=0;i<100;i++)o.draw(c,[1290,940,1310,960],2);
 assert.equal(o.requests,first,'no retry storm');assert.equal(c.calls.length,0);assert.ok(o.errors>=1);
 t=60;o.draw(c,[1290,940,1310,960],2);
 assert.ok(o.requests>first,'tried again after a while');
});

test('BF13 opacity steps 25/50/75/100% and the ?satellite= test switch',()=>{
 const o=createSatelliteOverlay({projection:P,imageFactory:fakeImages().factory});
 assert.equal(o.stepOpacity(1),.75);assert.equal(o.stepOpacity(1),1);assert.equal(o.stepOpacity(1),1);
 assert.equal(o.stepOpacity(-1),.75);o.stepOpacity(-1);o.stepOpacity(-1);assert.equal(o.stepOpacity(-1),.25);
 assert.equal(satelliteFromUrl('?satellite=50'),.5);assert.equal(satelliteFromUrl('?satellite=100'),1);
 assert.equal(satelliteFromUrl(''),null);assert.equal(satelliteFromUrl('?satellite=0'),null);assert.equal(satelliteFromUrl('?satellite=x'),null);
});

test('BF13 game wiring: pause STRUMENTI control, attribution while on, credits, never saved',async()=>{
 const [game,html,overlay]=await Promise.all(['game.mjs','index.html','satellite-overlay.mjs'].map(f=>readFile(new URL('./'+f,import.meta.url),'utf8')));
 assert.match(game,/import \{createSatelliteOverlay,satelliteFromUrl\} from '\.\/satellite-overlay\.mjs\?v=\d+'/);
 assert.match(game,/if\(state\.satellite\?\.enabled\)state\.satellite\.draw\(c,\[x0,y0,x1,y1\],state\.zoom\);\n\}/,'drawn last, over the whole scene');
 const tools=html.slice(html.indexOf('id="pause-h-tools"'),html.indexOf('id="pause-h-credits"'));
 for(const id of ['pause-satellite','pause-satellite-down','pause-satellite-level','pause-satellite-up'])assert.ok(tools.includes('id="'+id+'"'),id+' in STRUMENTI');
 assert.match(html,/<p class="satellite-attribution" id="satellite-attribution" hidden>Immagini: Esri, Maxar, Earthstar Geographics e la comunità GIS — Esri World Imagery<\/p>/);
 assert.ok(html.includes(SATELLITE_ATTRIBUTION));
 assert.match(html.slice(html.indexOf('<footer class="credits">')),/Esri World Imagery/,'credits');
 assert.match(game,/\$\('satellite-attribution'\)\.hidden=!on;/);
 assert.ok(!/localStorage|sessionStorage/.test(overlay),'the overlay never stores its state');
 assert.ok(!/satellite[^\n]{0,80}localStorage|localStorage[^\n]{0,80}satellite/i.test(game),'nor does the game');
 assert.ok(Number((html.match(/game\.mjs\?v=(\d+)/)||[])[1])>=164);
});

// CSV semplice con campi tra virgolette (come lo scrive il modulo csv di Python).
function parseCsv(text){
 const rows=[];let row=[],cell='',q=false;
 for(let i=0;i<text.length;i++){
  const ch=text[i];
  if(q){if(ch==='"'&&text[i+1]==='"'){cell+='"';i++;}else if(ch==='"')q=false;else cell+=ch;}
  else if(ch==='"')q=true;else if(ch===','){row.push(cell);cell='';}
  else if(ch==='\n'||ch==='\r'){if(ch==='\r'&&text[i+1]==='\n')i++;row.push(cell);cell='';if(row.some(c=>c!==''))rows.push(row);row=[];}
  else cell+=ch;
 }
 if(cell||row.length){row.push(cell);rows.push(row);}
 return rows;
}

test('BF13 audit sheet: valid CSV, at least 40 concrete findings inside the map, P0-P2, no satellite images in the repo',async()=>{
 const [csv,md]=await Promise.all(['audit-satellite.csv','AUDIT_SATELLITE.md'].map(f=>readFile(new URL('./'+f,import.meta.url),'utf8')));
 const [head,...rows]=parseCsv(csv);
 assert.deepEqual(head,['id','zona_strada','x','y','categoria','cosa_si_vede_in_foto','cosa_ce_nel_gioco','priorita','lavoro_suggerito','note']);
 assert.ok(rows.length>=40,'findings: '+rows.length);
 const ids=new Set();
 for(const r of rows){
  assert.equal(r.length,head.length,'columns in '+r[0]);
  assert.ok(!ids.has(r[0]),'unique id '+r[0]);ids.add(r[0]);
  const x=Number(r[2]),y=Number(r[3]);
  assert.ok(x>=0&&x<=P.width&&y>=0&&y<=P.height,'inside the map: '+r[0]);
  assert.match(r[7],/^P[012]$/);
  for(const k of [1,4,5,6,8])assert.ok(r[k].trim().length>2,'filled: '+head[k]+' in '+r[0]);
 }
 assert.ok(rows.filter(r=>r[7]==='P0').length>=5,'some P0 priorities');
 assert.match(md,/Esri World Imagery/);assert.match(md,/non c'è nessuna immagine satellitare/);
 const {readdir}=await import('node:fs/promises');
 const walk=async d=>(await Promise.all((await readdir(d,{withFileTypes:true})).map(e=>e.isDirectory()?walk(d+'/'+e.name):[d+'/'+e.name]))).flat();
 const files=await walk(new URL('.',import.meta.url).pathname);
 assert.ok(!files.some(f=>/World_Imagery|esri|satellite.*\.(png|jpe?g|webp)$/i.test(f.split('/').pop())),'no satellite tiles committed');
});
