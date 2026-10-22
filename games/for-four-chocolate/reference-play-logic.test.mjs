import test from 'node:test';
import assert from 'node:assert/strict';
import { LIMITS, SHELVES, PICKUP_CANDIDATES, GOAL, collides, canSee, shelfBlocksCamera, EXIT,
  initialScene, nearestPickup, selectPickups, updateScene } from './reference-play-logic.mjs';

function noWatch(s) { s.guards.forEach(g=>{g.x=100;g.baseSpeed=0;});s.camera.range=0; }
function takeAt(s,p) {
  s.player.x=p.x;s.player.z=p.z;
  assert.equal(nearestPickup(s)?.id,p.id);
  for(let i=0;i<30;i++)updateScene(s,{take:true},.05);
}

test('mappa quasi quattro volte più grande, scaffali e frigoriferi bloccano movimento e visuale',()=>{
  assert.ok((LIMITS.maxX-LIMITS.minX)*(LIMITS.maxZ-LIMITS.minZ)>=3.8*11.2*10.2);
  assert.equal(SHELVES.length,7);
  assert.equal(collides(SHELVES[0].x,SHELVES[0].z),true);
  assert.equal(collides(-8.55,-2.9),false);
  const eye={x:SHELVES[0].x-1.5,z:-2.9,angle:0,halfAngle:.5,range:7};
  assert.equal(canSee(eye,{x:SHELVES[0].x+1.5,z:-2.9}),false);
  assert.equal(canSee(eye,{x:SHELVES[0].x-.8,z:-2.9}),true);
});

test('uno scaffale davanti a Ipno sfuma; scaffali fuori dalla linea restano opachi',()=>{
  const shelf=SHELVES[0];
  assert.equal(shelfBlocksCamera(shelf,{x:shelf.x+4,y:4,z:shelf.z},
    {x:shelf.x-2,z:shelf.z}),true);
  assert.equal(shelfBlocksCamera(shelf,{x:shelf.x+4,y:4,z:shelf.z+6},
    {x:shelf.x-2,z:shelf.z+6}),false);
});

test('18 posizioni candidate su ripiani, 8–12 attive per seed, ogni reparto rappresentato',()=>{
  assert.equal(PICKUP_CANDIDATES.length,18);
  for(const p of PICKUP_CANDIDATES){
    assert.equal(collides(p.x,p.z),false,p.id);
    assert.ok(SHELVES.some(s=>s.id===p.shelfId));
    assert.ok(Math.abs(p.x-p.shelfX)<.8,p.id);
  }
  for(const count of [8,10,12]){
    const selected=selectPickups(1234,count);
    assert.equal(selected.length,count);
    assert.equal(new Set(selected.map(p=>p.id)).size,count);
    assert.equal(new Set(selected.map(p=>p.shelfId)).size,6);
    assert.ok(selected.every(p=>p.status==='available'));
    assert.deepEqual(selectPickups(1234,count),selected);
  }
  assert.notDeepEqual(selectPickups(1234).map(p=>p.id),selectPickups(1235).map(p=>p.id));
});

test('ogni posizione è raggiungibile da Ipno e consente di raggiungere uscita',()=>{
  const start=initialScene(1).player;
  const step=.4,cols=Math.ceil((LIMITS.maxX-LIMITS.minX)/step),rows=Math.ceil((LIMITS.maxZ-LIMITS.minZ)/step);
  const cell=(x,z)=>[Math.round((x-LIMITS.minX)/step),Math.round((z-LIMITS.minZ)/step)];
  const key=(x,z)=>`${x},${z}`;
  const [sx,sz]=cell(start.x,start.z),queue=[[sx,sz]],seen=new Set([key(sx,sz)]);
  for(let head=0;head<queue.length;head++){
    const [x,z]=queue[head];
    for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){
      const nx=x+dx,nz=z+dz,k=key(nx,nz);
      if(nx<0||nz<0||nx>cols||nz>rows||seen.has(k)||collides(LIMITS.minX+nx*step,LIMITS.minZ+nz*step))continue;
      seen.add(k);queue.push([nx,nz]);
    }
  }
  for(const spot of [...PICKUP_CANDIDATES,EXIT]){
    const [x,z]=cell(spot.x,spot.z);
    assert.ok([x-1,x,x+1].some(nx=>[z-1,z,z+1].some(nz=>
      seen.has(key(nx,nz))&&Math.hypot(LIMITS.minX+nx*step-spot.x,LIMITS.minZ+nz*step-spot.z)<.55)),spot.id||'exit');
  }
});

test('camminare davanti alle guardie non provoca arresto',()=>{
  const s=initialScene(10);s.player.x=-8.55;s.player.z=1;
  for(let i=0;i<100;i++)updateScene(s,{x:0,z:0},.05);
  assert.equal(s.phase,'playing');
});

test('quattro prelievi su scaffale sbloccano uscita anche con altri prodotti disponibili',()=>{
  const s=initialScene(7);noWatch(s);
  s.player.x=EXIT.x;s.player.z=EXIT.z;updateScene(s,{},.05);
  assert.equal(s.phase,'playing');
  for(let i=0;i<GOAL;i++){
    const p=s.pickups[i];takeAt(s,p);
    assert.equal(p.status,'collected');
    assert.equal(s.chocolate,i+1);
    updateScene(s,{take:false},.05);
  }
  assert.equal(s.pickups.filter(p=>p.status==='available').length,6);
  s.player.x=EXIT.x;s.player.z=EXIT.z;updateScene(s,{},.05);
  assert.equal(s.phase,'escaped');
});

test('prelievo interrotto ripristina lo stato del prodotto',()=>{
  const s=initialScene(3);noWatch(s);const p=s.pickups[0];
  s.player.x=p.x;s.player.z=p.z;updateScene(s,{take:true},.05);
  assert.equal(p.status,'taking');
  s.player.x=0;s.player.z=8.5;updateScene(s,{take:true},.05);
  assert.equal(p.status,'available');assert.equal(s.taking,false);assert.equal(s.takeTime,0);
});

test('visuale durante il prelievo provoca cattura nella versione precedente al lotto C',()=>{
  const s=initialScene(3);noWatch(s);const p=s.pickups[0];
  s.player.x=p.x;s.player.z=p.z;updateScene(s,{take:true},.05);
  assert.equal(s.taking,true);
  const guard=s.guards[0];guard.x=p.x;guard.z=p.z-1.2;guard.dir=1;guard.range=3;
  updateScene(s,{take:true},.05);
  assert.equal(s.phase,'caught');
});
