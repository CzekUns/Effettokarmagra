import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {prepareEnclosures,enclosureWalkBlocked,enclosureVehicleContacts,barrierDown,isNight,markGlassBuildings,ENCLOSURE_RULES} from './enclosures.mjs';
import {visualRoadWidth} from './road-widths.mjs';
import {SIDEWALK_OUTER} from './sidewalk.mjs';
import {inside} from './osm.mjs';

const read=f=>readFile(new URL('./'+f,import.meta.url),'utf8');
const [mapText,dataText]=await Promise.all([read('data/melito-map.json'),read('data/enclosures.json')]);
const map=JSON.parse(mapText),data=JSON.parse(dataText);
const ring=[];for(let i=0;i<map.border.length;i+=2)ring.push([map.border[i],map.border[i+1]]);
const ctx={roads:map.roads,roadWidth:visualRoadWidth,sidewalkOuter:SIDEWALK_OUTER,inBorder:(x,y)=>inside([x,y],ring)};
const E=prepareEnclosures(data,ctx);
const byId=id=>E.list.find(e=>e.id===id);
const car={halfLength:3.15,halfWidth:1.7};
const DRIVABLE=new Set(['motorway','trunk','primary','secondary','tertiary','unclassified','residential','living_street','service','track',
 'motorway_link','trunk_link','primary_link','secondary_link','tertiary_link']);

test('BF12 data: every enclosure has name, type, perimeter, source and an honest verification flag',()=>{
 assert.equal(data.schema,1);
 assert.match(data.descrizione,/OpenStreetMap/);assert.match(data.descrizione,/Esri World Imagery/);
 const ids=new Set();
 for(const e of data.recinti){
  assert.ok(e.id&&!ids.has(e.id));ids.add(e.id);
  assert.ok(e.nome&&['pubblico','privato'].includes(e.tipo)&&e.fonte&&typeof e.verificato==='boolean'&&e.metodo,e.id);
  assert.ok(['osm','ricalco','stimato-isolato','non-localizzato'].includes(e.perimetro?.tipo),e.id);
  if(e.perimetro.tipo!=='osm')assert.equal(e.verificato,false,'estimated perimeters are never marked verified: '+e.id);
  if(e.perimetro.punti)for(const [x,y] of e.perimetro.punti)assert.ok(x>0&&y>0&&x<map.projection.width&&y<map.projection.height,e.id);
 }
 for(const id of ['villa-comunale','complesso-municipio','recinto-fronte-mercato','parco-prima-casa'])assert.ok(ids.has(id),id);
 for(const v of data.vetro)assert.ok(map.buildings.some(b=>b.id===v.id),'glass building '+v.id+' is a real OSM polygon of the map');
});

test('BF12 the three located enclosures get walls, gates and (private ones) a guard booth; the unknown one is not drawn',()=>{
 assert.deepEqual(E.list.map(e=>e.id).sort(),['complesso-municipio','recinto-fronte-mercato','villa-comunale']);
 assert.deepEqual(E.failed.map(f=>f.id),['parco-prima-casa']);
 for(const e of E.list){
  assert.ok(e.walls.length>=1&&e.gates.length>=1,e.id);
  const length=e.walls.reduce((s,w)=>s+w.reduce((t,p,i)=>i?t+Math.hypot(p[0]-w[i-1][0],p[1]-w[i-1][1]):t,0),0);
  assert.ok(length>150,e.id+' wall length '+length.toFixed(0));
  assert.equal(!!e.booth,e.type==='privato',e.id);
 }
 const villa=byId('villa-comunale');
 assert.ok(villa.gates.every(g=>!g.vehicle),'a park: pedestrian gates only');
 assert.ok(villa.gates.some(g=>/5464543101/.test(g.source))||villa.gates.some(g=>Math.hypot(g.x-1342,g.y-1210)<8),'the OSM east gate');
 assert.ok(byId('complesso-municipio').gates.some(g=>g.vehicle&&g.barrier),'the Municipio driveway has a barrier');
});

test('BF12 walls never stand on a street or its pavement, and no road is cut: every road crossing a perimeter has an opening',()=>{
 for(const e of E.list)for(const w of e.walls)for(const [x,y] of w)for(const r of map.roads){
  if(!(r.n||['primary','secondary','tertiary','residential','unclassified','trunk'].includes(r.t)))continue;
  const p=r.p,clear=visualRoadWidth(r)/2+SIDEWALK_OUTER-.2;
  for(let k=2;k<p.length;k+=2){
   const ax=p[k-2],ay=p[k-1],dx=p[k]-ax,dy=p[k+1]-ay,l=dx*dx+dy*dy;let t=l?((x-ax)*dx+(y-ay)*dy)/l:0;t=Math.max(0,Math.min(1,t));
   assert.ok(Math.hypot(x-ax-t*dx,y-ay-t*dy)>=clear,`${e.id}: wall point (${x.toFixed(1)},${y.toFixed(1)}) on ${r.n||r.t}`);
  }
 }
 // walkers on every road (centre line; and both footpaths of the drivable ones) are never blocked by a wall
 let samples=0;
 for(const r of map.roads){
  const p=r.p,off=DRIVABLE.has(r.t)?[0,visualRoadWidth(r)/2+1.7,-(visualRoadWidth(r)/2+1.7)]:[0];
  for(let k=2;k<p.length;k+=2){
   const ax=p[k-2],ay=p[k-1],dx=p[k]-ax,dy=p[k+1]-ay,l=Math.hypot(dx,dy);if(!l)continue;
   const nx=-dy/l,ny=dx/l;
   for(let s=0;s<=l;s+=.5)for(const o of off){
    const x=ax+dx*s/l+nx*o,y=ay+dy*s/l+ny*o;
    if(E.bounds.every(b=>x<b[0]||x>b[2]||y<b[1]||y>b[3]))continue;
    samples++;assert.equal(enclosureWalkBlocked(E,x,y),false,`${r.n||r.t} blocked at (${x.toFixed(1)},${y.toFixed(1)})`);
   }
  }
 }
 assert.ok(samples>500,'roads near the enclosures checked: '+samples);
});

test('BF12 walls block walkers and vehicles; a vehicle touching a wall can always move away from it',()=>{
 const e=byId('complesso-municipio'),w=e.walls.sort((a,b)=>b.length-a.length)[0],k=Math.floor(w.length/2);
 const [ax,ay]=w[k-1]||w[0],[bx,by]=w[k],mx=(ax+bx)/2,my=(ay+by)/2,a=Math.atan2(by-ay,bx-ax),nx=-Math.sin(a),ny=Math.cos(a);
 assert.equal(enclosureWalkBlocked(E,mx,my),true,'on the wall');
 assert.equal(enclosureWalkBlocked(E,mx+nx*3,my+ny*3),false,'3 m beside it');
 const across={x:mx,y:my,a:a+Math.PI/2};
 const hit=enclosureVehicleContacts(E,across,car);
 assert.ok(hit>0,'a car across the wall touches it');
 // the contact measure never grows while backing off or sliding along, and grows when pushing in
 const touching={x:mx+nx*(car.halfLength+ENCLOSURE_RULES.wallHalf-.3),y:my+ny*(car.halfLength+ENCLOSURE_RULES.wallHalf-.3),a:across.a};
 const t0=enclosureVehicleContacts(E,touching,car);
 assert.ok(t0>0,'nose against the wall');
 assert.ok(enclosureVehicleContacts(E,{...touching,x:touching.x+nx*.1,y:touching.y+ny*.1},car)<t0,'backing off frees it');
 assert.ok(enclosureVehicleContacts(E,{...touching,x:touching.x-nx*.1,y:touching.y-ny*.1},car)>t0,'pushing in is refused');
 const along=enclosureVehicleContacts(E,{...touching,x:touching.x+Math.cos(a)*.1,y:touching.y+Math.sin(a)*.1},car);
 assert.ok(along<=t0*1.25+1e-6,'sliding along the wall stays possible (no sudden lock)');
 // a car stuck across the wall (after an unusual shove) can drive out along its heading: never a plateau forever
 let pose={...across},prev=enclosureVehicleContacts(E,pose,car),steps=0;
 while(prev>0&&steps<200){pose={...pose,x:pose.x+nx*.1,y:pose.y+ny*.1};const now=enclosureVehicleContacts(E,pose,car);assert.ok(now<=prev+1e-9,'never deeper');prev=now;steps++;}
 assert.equal(prev,0,'out of the wall in '+steps+' steps');
 assert.equal(enclosureVehicleContacts(E,{x:mx+nx*6,y:my+ny*6,a},car),0,'free 6 m away');
});

test('BF12 private vehicle gates: barrier up by day, down at night for the player, up again when an NPC vehicle arrives',()=>{
 assert.equal(isNight(23*60),true);assert.equal(isNight(3*60),true);assert.equal(isNight(10*60),false);assert.equal(isNight(6*60),false);
 const g=byId('complesso-municipio').gates.find(q=>q.barrier);
 const through={x:g.x,y:g.y,a:g.a+Math.PI/2};
 const day=enclosureVehicleContacts(E,through,car,{minutes:12*60});
 const night=enclosureVehicleContacts(E,through,car,{minutes:23*60});
 const withNpc=enclosureVehicleContacts(E,through,car,{minutes:23*60,traffic:[{x:g.x+3,y:g.y}]});
 assert.equal(day,0,'driving through the open gate by day');
 assert.ok(night>0,'the barrier stops the player at night');
 assert.equal(withNpc,0,'it rises for a resident car');
 assert.equal(barrierDown(g,23*60,[]),true);assert.equal(barrierDown({...g,barrier:false},23*60,[]),false);
});

test('BF12 nobody is trapped: from inside every enclosure a walker reaches the outside through a gate',()=>{
 for(const e of E.list){
  const xs=e.loop.map(p=>p[0]),ys=e.loop.map(p=>p[1]),x0=Math.floor(Math.min(...xs))-12,y0=Math.floor(Math.min(...ys))-12;
  const w=Math.ceil(Math.max(...xs))-x0+24,h=Math.ceil(Math.max(...ys))-y0+24,seen=new Uint8Array(w*h);
  // start from free cells inside the loop
  const queue=[];
  for(let j=0;j<h&&queue.length<30;j+=3)for(let i=0;i<w&&queue.length<30;i+=3){const x=x0+i+.5,y=y0+j+.5;
   if(inside([x,y],e.loop)&&!enclosureWalkBlocked(E,x,y)){seen[j*w+i]=1;queue.push(j*w+i);}}
  assert.ok(queue.length,e.id+' has free room inside');
  let out=false;
  for(let q=0;q<queue.length&&!out;q++){
   const c=queue[q],i=c%w,j=(c-i)/w;
   if(!inside([x0+i+.5,y0+j+.5],e.loop)){out=true;break;}
   for(const [di,dj] of [[1,0],[-1,0],[0,1],[0,-1]]){const ii=i+di,jj=j+dj;if(ii<0||jj<0||ii>=w||jj>=h)continue;
    const n=jj*w+ii;if(seen[n]||enclosureWalkBlocked(E,x0+ii+.5,y0+jj+.5))continue;seen[n]=1;queue.push(n);}
  }
  assert.ok(out,e.id+': a way out exists');
 }
});

test('BF12 galleria Atlante: only the art is flagged as glass, the OSM polygon is untouched',()=>{
 const b=JSON.parse(JSON.stringify(map.buildings.find(q=>q.id===794814541)));
 const before=b.p.slice();b.art={};
 assert.equal(markGlassBuildings([b,{id:1,p:[0,0],art:{}}],data),1);
 assert.equal(b.art.glass,true);assert.deepEqual(b.p,before);
});

test('BF12 game wiring: data loaded, walls before parking and pedestrians, collisions, drawing, glass facades',async()=>{
 const [game,art,html,readme]=await Promise.all(['game.mjs','city-art.mjs','index.html','README.md'].map(read));
 assert.match(game,/import \{prepareEnclosures,enclosureWalkBlocked,enclosureVehicleContacts,markGlassBuildings,drawEnclosureWalls,drawEnclosureGates\} from '\.\/enclosures\.mjs\?v=\d+'/);
 assert.match(game,/fetch\('\.\/data\/enclosures\.json'/);
 assert.match(game,/function validWalk\(x,y\)\{[\s\S]{0,220}enclosureWalkBlocked\(state\.enclosures,x,y\)/,'walls in every walking check');
 const load=game.indexOf(' createEnclosures();\n state.cars=[];state.streetObjects=null;createParkingBays();');
 assert.ok(load>0&&load<game.indexOf('state.people=createCityPedestrians()'),'walls before stalls and pedestrians');
 assert.match(game,/state\.streetObjects=null;createEnclosures\(\);createParkingBays\(\);/,'rebuilt with the road widths');
 assert.match(game,/const hit=enclosureVehicleContacts\(state\.enclosures,\{x,y,a\},bodyShape\(vehicle\),enclosureTime\(\)\);/);
 assert.match(game,/function canKnockbackMove[\s\S]{0,1600}enclosureVehicleContacts\(/);
 assert.ok(game.indexOf('drawEnclosureWalls(ctx,state.enclosures,bounds,zoom);')<game.indexOf('drawCityBuildings(ctx,[...inferred,...buildings],zoom);'),'walls under the roofs');
 assert.match(game,/drawEnclosureGates\(c,state\.enclosures,/);
 assert.match(art,/if\(a\.glass\)\{glassFacade\(c,f,len,south,v\);continue;\}/);
 assert.match(art,/if\(a\.glass\)glassRoof\(c,b,a\);/);
 assert.ok(Number((html.match(/game\.mjs\?v=(\d+)/)||[])[1])>=163);
 assert.match(readme,/Esri World Imagery/);
});
