import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PITCHES,PITCH_RULES,pitchFence,infillOnPitch,preparePitches,pitchWalkBlocked,pitchVehicleContacts,pitchHotspot,insidePitch,drawPitches} from './football-pitches.mjs';
import {visualRoadWidth} from './road-widths.mjs';

const read=f=>readFile(new URL('./'+f,import.meta.url),'utf8');
const map=JSON.parse(await read('data/melito-map.json')),infill=JSON.parse(await read('data/urban-infill.json'));
const inPoly=(x,y,p)=>{let f=false;for(let i=0,j=p.length-2;i<p.length;j=i,i+=2){const ax=p[i],ay=p[i+1],bx=p[j],by=p[j+1];if(((ay>y)!==(by>y))&&(x<(bx-ax)*(y-ay)/(by-ay)+ax))f=!f;}return f;};
const segd=(x,y,p)=>{let d=1e9;for(let i=2;i<p.length;i+=2){const ax=p[i-2],ay=p[i-1],bx=p[i],by=p[i+1],dx=bx-ax,dy=by-ay,l=dx*dx+dy*dy||1;let t=((x-ax)*dx+(y-ay)*dy)/l;t=Math.max(0,Math.min(1,t));d=Math.min(d,Math.hypot(x-ax-t*dx,y-ay-t*dy));}return d;};
const near=(p,b)=>{for(let i=0;i<b.p.length;i+=2)if(Math.hypot(b.p[i]-p.cx,b.p[i+1]-p.cy)<p.w+p.h+20)return true;return false;};

test('Q32 the three pitches (traced on the aerial photo) stand clear of OSM buildings and streets',()=>{
 assert.equal(PITCHES.length,3);
 assert.equal(PITCHES.filter(p=>p.kind==='calcetto').length,2,'two calcetto pitches, one full field');
 for(const p of PITCHES){
  assert.equal(p.foto,true);assert.equal(p.verificato,false,'traced, not surveyed: declared');
  const buildings=map.buildings.filter(b=>near(p,b)),roads=map.roads.filter(r=>near(p,r));
  for(let u=-p.w/2-PITCH_RULES.runoff;u<=p.w/2+PITCH_RULES.runoff;u+=1.5)for(let v=-p.h/2-PITCH_RULES.runoff;v<=p.h/2+PITCH_RULES.runoff;v+=1.5){
   const x=p.cx+u,y=p.cy+v;
   assert.equal(buildings.some(b=>inPoly(x,y,b.p)),false,p.id+': no OSM building at '+x+','+y);
   assert.equal(roads.some(r=>segd(x,y,r.p)<visualRoadWidth(r)/2+1.2),false,p.id+': no street at '+x+','+y);
  }
 }
});

test('Q32 only the invented infill placeholders on a pitch are left out',()=>{
 const removed=infill.buildings.filter(b=>infillOnPitch(b));
 const ids=removed.map(b=>b.id);
 for(const id of [-10004136,-10004140,-10004148,-850035,-10000170,-10000174,-760037,-10005137])assert.ok(ids.includes(id),'placeholder '+id+' removed');
 assert.ok(removed.length<=14,'nothing else: '+removed.length);
 assert.equal(map.buildings.some(b=>infillOnPitch(b)),false,'no real OSM building would ever be dropped');
});

// a small test world: a street along y=0, a wall of houses west of the pitch
const pitch={id:'prova',nome:'Campetto di prova',kind:'calcetto',cx:30,cy:30,w:30,h:17,a:0};
const walkable=(x,y)=>!(x<12&&y>5)&&y>-12;            // houses west of x=12, open towards the street
const nearStreet=(x,y)=>Math.abs(y)<4;
const P=preparePitches([pitch],{walkable,nearStreet});

test('Q32 the gate opens on the side reachable on foot from the street, the fence blocks elsewhere',()=>{
 const p=P.list[0];
 assert.equal(p.gate.side,'nord','towards the street, not into the houses');
 assert.ok(Number.isFinite(p.gate.steps)&&p.gate.steps<30);
 assert.equal(pitchWalkBlocked(P,p.gate.x,p.gate.y),false,'the gate is open');
 const fenceY=pitch.cy-pitch.h/2-PITCH_RULES.runoff;
 assert.equal(pitchWalkBlocked(P,pitch.cx+10,fenceY),true,'the mesh stops walkers');
 assert.equal(pitchWalkBlocked(P,pitch.cx+10,fenceY-2),false,'two metres away is free');
 assert.ok(pitchVehicleContacts(P,{x:pitch.cx+10,y:fenceY-1,a:0},{halfLength:3.15,halfWidth:1.7})>0,'a car body pressing on the fence');
 assert.equal(pitchVehicleContacts(P,{x:pitch.cx+10,y:fenceY-4,a:0},{halfLength:3.15,halfWidth:1.7}),0);
 assert.ok(PITCH_RULES.gateWidth<3.4,'a pedestrian gate: a car does not fit');
 const goalX=pitch.cx+pitch.w/2+1.2;
 assert.equal(pitchWalkBlocked(P,goalX,pitch.cy),true,'the goal frame is solid');
});

test('Q32 E · GIOCA A CALCETTO at the gate or inside the lines of a calcetto pitch only',()=>{
 const p=P.list[0];
 assert.equal(pitchHotspot(P,p.gate.x,p.gate.y-2)?.id,'prova','at the gate, from outside');
 assert.equal(pitchHotspot(P,pitch.cx,pitch.cy)?.id,'prova','in the middle of the pitch');
 assert.equal(pitchHotspot(P,pitch.cx+40,pitch.cy),null);
 const big=preparePitches([{...pitch,id:'grande',kind:'calcio11',w:61,h:108}],{walkable:()=>true,nearStreet:(x,y)=>y<0});
 assert.equal(pitchHotspot(big,30,30),null,'the full field is scenery for now');
 assert.ok(insidePitch(pitch,pitch.cx,pitch.cy)&&!insidePitch(pitch,0,0));
 assert.equal(pitchFence(pitch).length,4);
});

test('Q32 drawing: grass, lines, goals, fence and floodlights without errors, nothing off screen',()=>{
 const calls={};const ctx=new Proxy({},{get:(t,k)=>k in t?t[k]:(...a)=>{calls[k]=(calls[k]||0)+1;}, set:(t,k,v)=>{t[k]=v;return true;}});
 drawPitches(ctx,P,[0,0,100,100],2);
 assert.ok(calls.fillRect>10&&calls.strokeRect>=1&&calls.arc>=2,'something drawn');
 const none={};const ctx2=new Proxy({},{get:(t,k)=>k in t?t[k]:(...a)=>{none[k]=(none[k]||0)+1;},set:(t,k,v)=>{t[k]=v;return true;}});
 drawPitches(ctx2,P,[500,500,600,600],2);
 assert.equal(Object.keys(none).length,0,'out of view: no work');
});

test('Q32 game wiring: placeholders filtered, pitches on load and width switch, collisions, hotspot',async()=>{
 const [game,html]=await Promise.all([read('game.mjs'),read('index.html')]);
 assert.match(game,/import \{preparePitches,infillOnPitch,pitchWalkBlocked,pitchVehicleContacts,pitchHotspot,drawPitches\} from '\.\/football-pitches\.mjs\?v=\d+'/);
 assert.match(game,/state\.inferredBuildings=inferred\.buildings\.filter\(b=>!infillOnPitch\(b\)\)/);
 assert.match(game,/!\(state\.pitches&&pitchWalkBlocked\(state\.pitches,x,y\)\)/,'fences in validWalk');
 assert.match(game,/state\.inferredGrid=makeIndex\(state\.inferredBuildings\);\n createPitches\(\);/,'on load, after the building grids');
 assert.match(game,/createPitches\(\);createEnclosures\(\);(?:createWorkshop\(\);)?createParkingBays\(\);/,'on the road-width switch');
 assert.match(game,/const hit=pitchVehicleContacts\(state\.pitches,\{x,y,a\},bodyShape\(vehicle\)\);/,'carBlocked');
 assert.match(game,/const pitch=pitchHotspot\(state\.pitches,p\.x,p\.y\);\n  if\(pitch\)\{openFootballMatch\(pitch\);return;\}/,'E at the gate');
 assert.match(game,/pitchNear\?'GIOCA A CALCETTO'/);
 assert.match(game,/function openFootballMatch\(pitch\)\{/,'hook for the Q33 match');
 assert.equal((game.match(/drawPitches\(ctx,state\.pitches/g)||[]).length,2,'ground and roof reveal');
 assert.ok(Number((html.match(/game\.mjs\?v=(\d+)/)||[])[1])>=185);
});
