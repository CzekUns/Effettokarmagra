import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const [html,game]=await Promise.all(['index.html','game.mjs'].map(f=>readFile(new URL('./'+f,import.meta.url),'utf8')));
const pauseStart=html.indexOf('<div class="pause-menu" id="pause-menu" hidden>');
const pauseEnd=html.indexOf('<div class="rotate-screen"',pauseStart);
const pause=html.slice(pauseStart,pauseEnd);
const css=html.slice(0,html.indexOf('</style>'));
const pcBlock=(()=>{
 const start=css.indexOf('@media(min-width:761px) and (pointer:fine),(min-width:761px) and (pointer:none){');
 let depth=0,i=css.indexOf('{',start);
 for(;i<css.length;i++){if(css[i]==='{')depth++;else if(css[i]==='}'&&--depth===0)break;}
 return start>0?css.slice(start,i+1):'';
})();
const mobileBlock=css.slice(css.indexOf('@media(max-width:760px),(pointer:coarse) and (orientation:landscape){'));

test('BF11 the page opens on the game board: nothing around the stage, everything else inside the PAUSE menu',()=>{
 assert.ok(pauseStart>0&&pauseEnd>pauseStart);
 assert.match(html,/<main class="app">\n<div class="stage" id="stage">/,'the stage is the first thing on the page');
 for(const [what,pattern] of [['title and version',/<header class="header">[\s\S]*VERSIONE 0\.7\.0[\s\S]*SALA GIOCHI/],
  ['status bar',/<div class="hud">/],['road-width tool',/<div class="road-width-bar"/],['PC and phone commands',/<p class="instructions">PC:/],
  ['survey link',/<p class="instructions"><a href="\.\/survey\/index\.html"/],['credits and licences',/<footer class="credits">[\s\S]*ODbL[\s\S]*CC BY/]]){
  assert.match(pause,pattern,what+' now lives in the pause menu');
  assert.equal(html.replace(pause,'').search(pattern),-1,what+' is no longer around the board');
 }
 const sections=[...pause.matchAll(/<section class="pause-section (pause-[a-z]+)"[^>]*><h3 id="[^"]+">([^<]+)<\/h3>/g)].map(m=>[m[1],m[2]]);
 assert.deepEqual(sections.map(s=>s[0]).filter(id=>id!=='pause-novita'),['pause-status','pause-commands','pause-play','pause-tools','pause-credits'],'BF15 aggiunge solo NOVITÀ tra gioco e strumenti');
 assert.ok(pause.indexOf('class="pause-shortcuts"')>pause.indexOf('pause-play'),'map, zoom and sound shortcuts in their own section');
});

test('BF11 every element game.mjs updates still exists (also the ones moved into the menu)',()=>{
 const ids=new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]));
 const used=[...new Set([...game.matchAll(/\$\('([a-z0-9-]+)'\)/g)].map(m=>m[1]))];
 const missing=used.filter(id=>!ids.has(id));
 assert.deepEqual(missing,[],'ids used by game.mjs but missing in index.html');
 for(const id of ['npc-clock','place','vehicle','camera-mode','road-count','building-count','inferred-count','junction-count','road-width-current','road-width-compare'])
  assert.ok(pause.includes('id="'+id+'"'),id+' inside the pause menu');
});

test('BF11 PC layout: full-window board, small pause button, key prompt and attribution on the board',()=>{
 assert.ok(pcBlock,'a PC-only block (fine or no pointer, wider than phones)');
 assert.match(pcBlock,/\.app\{width:100%;max-width:none;height:100vh;height:100dvh;margin:0;padding:0\}/);
 assert.match(pcBlock,/\.stage\{height:100vh;height:100dvh;min-height:0;border:0;outline:0;box-shadow:none\}/);
 assert.match(pcBlock,/html,body\{height:100%;overflow:hidden\}/,'no scroll bars');
 assert.match(pcBlock,/\.controls>\*\{display:none!important\}/,'no touch or mini buttons under the board');
 assert.match(pcBlock,/\.pause-toggle\{display:flex;position:absolute/);
 assert.match(pcBlock,/\.pc-prompt\{display:block/);assert.match(pcBlock,/\.map-attribution\{display:block/);
 assert.match(css,/\.pc-prompt,\.map-attribution\{display:none\}/,'hidden everywhere else');
 assert.match(html,/<div class="pc-prompt" id="pc-prompt" hidden aria-live="polite"><\/div>/);
 assert.match(html,/<p class="map-attribution"><a href="https:\/\/www\.openstreetmap\.org\/copyright"[^>]*>© OpenStreetMap<\/a>/,'ODbL attribution stays on the board');
 assert.ok(css.indexOf(pcBlock)<css.indexOf('@media(max-width:760px),(pointer:coarse) and (orientation:landscape){'),'phone rules come after and win on phones');
});

test('BF11 phones keep the BF06 layout and the same short pause menu',()=>{
 assert.match(mobileBlock,/\.header,\.hud,\.road-width-bar,\.instructions,\.credits\{display:none!important\}/);
 assert.match(mobileBlock,/\.pause-section:not\(\.pause-play\)\{display:none!important\}\.pause-section\{margin:0;padding:0;border:0\}\.pause-section h3\{display:none\}/);
 assert.match(html,/<div class="pedals" aria-label="Pedali di guida"><button id="brake"[^>]*>FRENO<\/button><button id="accelerator"[^>]*>ACCELERA<\/button><button id="reverse"[^>]*>RETRO<\/button><\/div>/);
 assert.match(mobileBlock,/\.pause-toggle\{top:max\(12px,env\(safe-area-inset-top\)\)/);
});

test('BF11 game wiring: Esc and P open and close the pause, the E prompt only when an action is at hand',()=>{
 assert.match(game,/if\(e\.key==='Escape'\)\{[^\n]*if\(!pause\.hidden\)closePause\(\);else openPause\(\);\}/);
 assert.match(game,/if\(e\.key\.toLowerCase\(\)==='p'&&!e\.repeat&&!state\.shopOpen\)\{e\.preventDefault\(\);[^\n]*if\(!pause\.hidden\)closePause\(\);else openPause\(\);\}/);
 assert.match(game,/function boardPrompt\(label\)\{\n const el=\$\('pc-prompt'\);if\(!el\)return;/);
 assert.match(game,/boardPrompt\(p\.car>=0\?(?:garageNear\|\|)?(?:''|\(repair\?[^)]*\)):eventAction\|\|\((?:shopDoor\?'ENTRA · '\+shopDoor\.shop\.name\.toUpperCase\(\):)?shopNear\?(?:'COMPRA'|\(shopNear\.vendor\?'COMPRA · '\+shopNear\.name\.toUpperCase\(\):'COMPRA'\)):(?:pitchNear\?'GIOCA A CALCETTO':)?(?:garageNear\?garageNear:)?bank\?'ENTRA IN BANCA':enterable\?/);
 assert.match(game,/boardPrompt\('ESCI DALLA BANCA'\);/);
 assert.ok(Number((html.match(/game\.mjs\?v=(\d+)/)||[])[1])>=160);
});
