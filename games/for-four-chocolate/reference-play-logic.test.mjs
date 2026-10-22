import test from 'node:test';
import assert from 'node:assert/strict';
import { LIMITS, SHELVES, PICKUP_CANDIDATES, CAMERA_THRESHOLDS, GUARD_THRESHOLDS, crowns, FINE, collides, canSee, shelfBlocksCamera, routeAroundCover, EXIT,
  initialScene, nearestPickup, selectPickups, updateScene, increaseSecurity } from './reference-play-logic.mjs';

function noWatch(s) { s.guards.forEach(g=>{g.x=100;g.baseSpeed=0;g.halfAngle=0;});s.cameras.forEach(c=>c.range=0); }
function withPatrols(s) {const count=s.chocolate;s.chocolate=27;increaseSecurity(s);s.chocolate=count;return s;}
function takeAt(s,p) {
  s.player.x=p.x;s.player.z=p.z;
  assert.equal(nearestPickup(s)?.id,p.id);
  for(let i=0;i<30;i++)updateScene(s,{take:true},.05);
}

test('supermercato ampliato: scaffali e frigoriferi bloccano movimento e visuale',()=>{
  assert.ok((LIMITS.maxX-LIMITS.minX)*(LIMITS.maxZ-LIMITS.minZ)>=900);
  assert.equal(SHELVES.length,15);
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

test('56 posizioni candidate su ripiani, 14–22 attive per seed, ogni reparto rappresentato',()=>{
  assert.equal(PICKUP_CANDIDATES.length,56);
  for(const p of PICKUP_CANDIDATES){
    assert.equal(collides(p.x,p.z),false,p.id);
    assert.ok(SHELVES.some(s=>s.id===p.shelfId));
    assert.ok(Math.abs(p.x-p.shelfX)<.8,p.id);
  }
  for(const count of [14,18,22]){
    const selected=selectPickups(1234,count);
    assert.equal(selected.length,count);
    assert.equal(new Set(selected.map(p=>p.id)).size,count);
    assert.equal(new Set(selected.map(p=>p.shelfId)).size,14);
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

test('uscita libera e raccolta infinita con rifornimento sugli scaffali',()=>{
  const early=initialScene(7);early.player.x=EXIT.x;early.player.z=EXIT.z;updateScene(early,{},.05);
  assert.equal(early.phase,'escaped');assert.equal(crowns(early),0);
  const s=initialScene(7);s.chocolate=45;increaseSecurity(s);s.chocolate=0;noWatch(s);
  for(let i=0;i<30;i++){
    noWatch(s);const p=s.pickups[0];takeAt(s,p);
    assert.equal(s.chocolate,i+1);assert.equal(s.pickups.length,14);
    assert.equal(new Set(s.pickups.map(p=>p.id)).size,14);
    assert.ok(s.pickups.every(p=>p.status==='available'));
    updateScene(s,{take:false},.05);
  }
  assert.equal(s.phase,'playing');assert.equal(crowns(s),30);
  assert.equal(s.cameras.length,CAMERA_THRESHOLDS.length);
  assert.ok(s.guards.length>GUARD_THRESHOLDS.length);
  s.player.x=EXIT.x;s.player.z=EXIT.z;updateScene(s,{},.05);
  assert.equal(s.phase,'escaped');assert.equal(crowns(s),30);
});

test('prelievo interrotto ripristina lo stato del prodotto',()=>{
  const s=withPatrols(initialScene(3));noWatch(s);const p=s.pickups[0];
  s.player.x=p.x;s.player.z=p.z;updateScene(s,{take:true},.05);
  assert.equal(p.status,'taking');
  s.player.x=0;s.player.z=8.5;updateScene(s,{take:true},.05);
  assert.equal(p.status,'available');assert.equal(s.taking,false);assert.equal(s.takeTime,0);
});

test('POLICIE vede un prelievo: allarme osservabile, inseguimento fisico e cattura a contatto',()=>{
  const s=withPatrols(initialScene(3));noWatch(s);const p=s.pickups[0];
  s.player.x=p.x;s.player.z=p.z;updateScene(s,{take:true},.05);
  assert.equal(s.taking,true);
  const guard=s.guards[0];guard.x=p.x;guard.z=p.z-1.2;guard.dir=1;guard.angle=Math.PI/2;guard.halfAngle=.5;guard.range=3;
  updateScene(s,{take:true},.05);
  assert.equal(s.phase,'playing');assert.equal(s.security.mode,'alert');
  assert.equal(s.security.source,'guard');assert.equal(s.taking,false);
  assert.equal(p.status,'available');
  assert.equal(s.watchZones[p.zone],1);
  const start=guard.z;let steps=0;
  while(s.phase==='playing'&&steps<100){updateScene(s,{},.05);assert.equal(collides(guard.x,guard.z),false);steps++;}
  assert.equal(s.phase,'caught');assert.ok(steps>1);
  assert.ok(guard.z>start);assert.ok(Math.hypot(guard.x-p.x,guard.z-p.z)<.55);
});

test('CCTV che vede il prelievo invia una guardia senza cattura magica',()=>{
  const s=initialScene(2),p=s.pickups.find(item=>item.shelfId==='chocolate');
  s.guards.forEach(g=>g.halfAngle=0);s.cameras.forEach(c=>c.range=0);
  s.player.x=p.x;s.player.z=p.z;updateScene(s,{take:true},.05);
  s.cameras[0].x=p.x-Math.cos(2.2)*2;s.cameras[0].z=p.z-Math.sin(2.2)*2;s.cameras[0].range=7;
  updateScene(s,{take:true},.05);
  assert.equal(s.security.mode,'alert');assert.equal(s.security.source,'camera');
  assert.equal(s.phase,'playing');assert.ok(s.security.responders.length>=1);
  const guard=s.guards[s.security.responders[0]],before={x:guard.x,z:guard.z};
  for(let n=0;n<20;n++)updateScene(s,{},.05);
  assert.ok(Math.hypot(guard.x-before.x,guard.z-before.z)>.1);
  assert.equal(collides(guard.x,guard.z),false);
});

test('prelievo nascosto devia una guardia della zona verso il ripiano',()=>{
  const s=withPatrols(initialScene(2));s.guards.forEach(g=>g.halfAngle=0);s.cameras.forEach(c=>c.range=0);
  const p=s.pickups[0];takeAt(s,p);
  assert.equal(s.chocolate,1);assert.equal(s.security.mode,'routine_increased');
  assert.equal(s.watchZones[p.zone],1);
  const guard=s.guards.find(g=>g.mode==='inspect');assert.ok(guard);
  assert.equal(guard.zone,p.zone);
  const before=Math.hypot(guard.x-p.x,guard.z-p.z);
  for(let n=0;n<40;n++)updateScene(s,{},.05);
  assert.ok(Math.hypot(guard.x-p.x,guard.z-p.z)<=before);
  assert.ok(Math.hypot(guard.x-p.x,guard.z-p.z)<.55);
  assert.equal(collides(guard.x,guard.z),false);
});

test('ogni nuovo prelievo nella stessa zona sposta il controllo locale',()=>{
  const s=withPatrols(initialScene(2));s.guards.forEach(g=>g.halfAngle=0);s.cameras.forEach(c=>c.range=0);
  const spots=s.pickups.filter(p=>p.zone==='west').slice(0,3);
  assert.equal(spots.length,3);
  spots.forEach((spot,index)=>{
    takeAt(s,spot);updateScene(s,{take:false},.05);
    assert.equal(s.watchZones.west,index+1);
    assert.ok(s.guards.some(g=>g.zone==='west'&&g.mode==='inspect'&&g.inspectTarget.x===spot.x&&g.inspectTarget.z===spot.z));
  });
});

test('perde Ipno dietro la copertura, cerca ultima posizione e torna a presidiare',()=>{
  const s=withPatrols(initialScene(3));noWatch(s);const p=s.pickups[0];
  s.player.x=p.x;s.player.z=p.z;updateScene(s,{take:true},.05);
  const guard=s.guards[0];guard.x=p.x;guard.z=p.z-1.2;guard.dir=1;guard.angle=Math.PI/2;guard.halfAngle=.5;
  updateScene(s,{take:true},.05);
  s.player.x=9;s.player.z=8;s.guards.forEach(g=>g.halfAngle=0);
  for(let n=0;n<30;n++)updateScene(s,{},.05);
  assert.equal(s.security.mode,'searching');
  assert.deepEqual(s.security.lastKnown,{x:p.x,z:p.z});
  for(let n=0;n<360;n++)updateScene(s,{},.05);
  assert.equal(s.security.mode,'routine_increased');assert.equal(s.phase,'playing');
  assert.equal(s.watchZones[p.zone],1);
  assert.ok(['return','patrol'].includes(guard.mode));
});

test('il percorso della guardia gira attorno allo scaffale e non passa nei muri',()=>{
  const start={x:-7.9,z:-4},target={x:-5.9,z:-4};
  const path=routeAroundCover(start,target);
  assert.ok(path.length>7);
  assert.ok(path.every(point=>!collides(point.x,point.z)));
  assert.ok(path.some(point=>point.z<-5.2||point.z>-.3));
  const s=withPatrols(initialScene(2)),guard=s.guards[0];
  guard.x=start.x;guard.z=start.z;guard.mode='chase';guard.halfAngle=0;
  s.guards.slice(1).forEach(g=>{g.x=100;g.baseSpeed=0;g.halfAngle=0;});
  s.cameras.forEach(c=>c.range=0);s.player.x=target.x;s.player.z=target.z;
  s.security={mode:'pursuit',source:'guard',sourceIndex:0,timer:0,lostTime:0,lastKnown:target,responders:[0]};
  for(let n=0;n<150&&s.phase==='playing';n++){
    updateScene(s,{},.05);assert.equal(collides(guard.x,guard.z),false);
  }
  assert.equal(s.phase,'caught');
});

test('ogni guardia ha un percorso libero verso ogni ripiano candidabile',()=>{
  const guards=withPatrols(initialScene(1)).guards;
  for(const guard of guards)for(const spot of PICKUP_CANDIDATES){
    const path=routeAroundCover(guard,spot);
    assert.ok(path.length>0,`${guard.homeX} → ${spot.id}`);
    for(let i=1;i<path.length;i++){
      const a=path[i-1],b=path[i],length=Math.hypot(a.x-b.x,a.z-b.z);
      for(let step=0;step<=4;step++){
        const t=step/4;
        assert.equal(collides(a.x+(b.x-a.x)*t,a.z+(b.z-a.z)*t),false,`${spot.id} segmento ${i}/${path.length}`);
      }
      assert.ok(length<.41);
    }
  }
});

test('progressione a soglie, esclamativo e multa',()=>{
  const s=initialScene(8);assert.equal(s.cameras.length,1);assert.equal(s.guards.length,0);
  s.chocolate=4;increaseSecurity(s);assert.equal(s.cameras.length,3);assert.equal(s.guards.length,0);
  s.chocolate=5;increaseSecurity(s);assert.equal(s.guards.length,1);
  s.guards[0].exclamationTime=2;updateScene(s,{},.05);assert.ok(s.guards[0].exclamationTime>1.9);
  s.phase='caught';assert.equal(crowns(s),5-FINE);
});
