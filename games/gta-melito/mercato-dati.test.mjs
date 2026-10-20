import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=f=>readFile(new URL('./'+f,import.meta.url),'utf8');
// CSV con virgolette (RFC 4180, senza a capo nei campi).
function parseCsv(text){
 return text.trim().split('\n').map(line=>{
  const out=[];let cell='',quoted=false;
  for(let i=0;i<line.length;i++){
   const ch=line[i];
   if(quoted){if(ch==='"'&&line[i+1]==='"'){cell+='"';i++;}else if(ch==='"')quoted=false;else cell+=ch;}
   else if(ch==='"')quoted=true;else if(ch===','){out.push(cell);cell='';}else cell+=ch;
  }
  out.push(cell);return out;
 });
}

test('Q42 area mercatale: dati validi, prima versione con segnaposto, strade presenti nella mappa del gioco',async()=>{
 const [area,map]=await Promise.all([read('data/market-area.json'),read('data/melito-map.json')]).then(v=>v.map(JSON.parse));
 assert.equal(area.status,'prima-versione-placeholder');assert.equal(area.used_by_game,true,'Q42: usata dal gioco tramite market.mjs');
 assert.equal(typeof area.verified.location,'boolean');assert.equal(area.verified.day,false,'il giorno non è confermato dal Comune');
 assert.ok(area.sources.length>=3&&area.sources.every(s=>/^https?:\/\//.test(s.url)&&s.consulted));
 assert.equal(area.polygon_game.length,4);assert.equal(area.polygon_wgs84.length,4);
 const names=new Set(map.roads.map(r=>r.n));
 for(const street of area.streets)assert.ok(names.has(street),'strada nel grafo: '+street);
 // il poligono sta dentro il confine e non contiene carreggiate: le strade che lo delimitano restano fuori
 const [cx,cy]=area.centre_game;const xs=area.polygon_game.map(p=>p[0]),ys=area.polygon_game.map(p=>p[1]);
 assert.ok(cx>Math.min(...xs)&&cx<Math.max(...xs)&&cy>Math.min(...ys)&&cy<Math.max(...ys));
 for(const r of map.roads.filter(r=>area.streets.includes(r.n)&&r.t!=='footway'))for(let i=0;i<r.p.length;i+=2){
  const x=r.p[i],y=r.p[i+1];
  assert.ok(!(x>Math.min(...xs)+1&&x<Math.max(...xs)-1&&y>Math.min(...ys)+1&&y<Math.max(...ys)-1),'nessun vertice stradale dentro l\'area');
 }
});

test('Q42 fogli per il proprietario: colonne coerenti, nessuna riga vuota, id unici',async()=>{
 for(const [file,first,minRows] of [['mercato-banchi.csv','id',10],['mercato-requisiti.csv','id',12]]){
  const rows=parseCsv(await read(file));
  assert.equal(rows[0][0],first);
  assert.ok(rows.length-1>=minRows,file+': righe '+(rows.length-1));
  for(const row of rows){
   assert.equal(row.length,rows[0].length,file+': colonne coerenti in '+row[0]);
   assert.ok(row.some(c=>c.trim()),file+': nessuna riga vuota');
  }
  const ids=rows.slice(1).map(r=>r[0]);assert.equal(new Set(ids).size,ids.length,file+': id unici');
 }
 const req=parseCsv(await read('mercato-requisiti.csv'));
 const r01=req.find(r=>r[0]==='R01');assert.ok(r01&&/trasparent/i.test(r01.join(' '))&&/roof/i.test(r01.join(' ')),'R01: ombrelloni trasparenti come i tetti');
 const todo=await read('TODO.md');assert.match(todo,/- \[ \] \*\*Q42 — Mercato settimanale di Melito/);
});
