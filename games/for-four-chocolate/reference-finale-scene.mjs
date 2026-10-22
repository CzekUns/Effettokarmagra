import * as THREE from './vendor/three/three.module.js';

export function createFinaleScene({ipnoTexture,guardTexture,capelloneTexture,capelloneGroupTexture,facadeTexture,cobbleTexture,crowdTextures=[]}) {
  const scene=new THREE.Scene();scene.background=new THREE.Color('#171d2b');
  scene.fog=new THREE.Fog('#171d2b',18,38);
  const camera=new THREE.PerspectiveCamera(39,1,.1,80);
  const hemi=new THREE.HemisphereLight('#8bcaff','#53342f',1.75);scene.add(hemi);
  const sun=new THREE.DirectionalLight('#ffc887',2.5);sun.position.set(-5,9,5);scene.add(sun);
  const cyan=new THREE.PointLight('#58dfff',11,11);cyan.position.set(3,3,-4);scene.add(cyan);
  const mat=(color,roughness=.7)=>new THREE.MeshStandardMaterial({color,roughness});
  function box(parent,w,h,d,color,x,y,z){const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(color));mesh.position.set(x,y,z);parent.add(mesh);return mesh;}
  function sprite(parent,texture,height=1.8){
    const group=new THREE.Group();parent.add(group);
    const image=new THREE.Mesh(new THREE.PlaneGeometry(height*1024/1536,height),new THREE.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,side:THREE.DoubleSide,toneMapped:false}));
    image.position.y=height/2;image.renderOrder=5;group.add(image);return group;
  }
  function label(parent,text,width,color='#f8e8c3'){
    const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=128;
    const c=canvas.getContext('2d');c.fillStyle='#152539';c.fillRect(0,0,1024,128);
    c.strokeStyle='#bd975d';c.lineWidth=9;c.strokeRect(5,5,1014,118);
    c.fillStyle=color;c.font='900 69px Arial';c.textAlign='center';c.textBaseline='middle';c.fillText(text,512,65,970);
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
    const mesh=new THREE.Mesh(new THREE.PlaneGeometry(width,width/8),new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide}));parent.add(mesh);return mesh;
  }
  const city=new THREE.Group();scene.add(city);
  box(city,19,.18,16,'#51494a',0,-.1,0);
  cobbleTexture.wrapS=THREE.RepeatWrapping;cobbleTexture.wrapT=THREE.RepeatWrapping;
  cobbleTexture.repeat.set(3,3);
  const cobbles=new THREE.Mesh(new THREE.PlaneGeometry(19,16),new THREE.MeshStandardMaterial({map:cobbleTexture,roughness:.35,metalness:.12}));
  cobbles.rotation.x=-Math.PI/2;cobbles.position.y=.005;city.add(cobbles);
  for(const x of [-7.4,0,7.4]){
    box(city,6.9,7.5,1.5,'#8a6959',x,3.75,-7.25);
    const front=new THREE.Mesh(new THREE.PlaneGeometry(6.85,7.35),new THREE.MeshBasicMaterial({map:facadeTexture,toneMapped:false}));
    front.position.set(x,3.76,-6.48);city.add(front);
    const roof=new THREE.Mesh(new THREE.ConeGeometry(4.95,1.7,4),mat('#743b42'));
    roof.rotation.y=Math.PI/4;roof.position.set(x,8.35,-7.25);city.add(roof);
  }
  // Old Town silhouette: twin spires and an astronomical clock make Prague legible.
  for(const x of [-2.3,-.6]){
    box(city,.72,7,.72,'#4b3d47',x,7.5,-13);
    const spire=new THREE.Mesh(new THREE.ConeGeometry(.75,3.2,6),mat('#334655'));
    spire.position.set(x,12.6,-13);city.add(spire);
  }
  box(city,2.2,9.8,2.1,'#94725f',5.2,5,-12);
  const clock=new THREE.Mesh(new THREE.CircleGeometry(.82,32),new THREE.MeshBasicMaterial({color:'#d0a35b'}));
  clock.position.set(5.2,7.4,-10.93);city.add(clock);
  const clockInner=new THREE.Mesh(new THREE.RingGeometry(.49,.57,32),new THREE.MeshBasicMaterial({color:'#233c55',side:THREE.DoubleSide}));
  clockInner.position.set(5.2,7.4,-10.91);city.add(clockInner);
  const citySign=label(city,'PRAHA 1  ·  STAROMĚSTSKÉ NÁMĚSTÍ',5.2);citySign.position.set(0,4.7,-5.95);
  for(const x of [-1.35,1.35]){box(city,.045,.025,16,'#a9b4b9',x,.023,0);}
  for(let z=-7;z<8;z+=1.4)box(city,2.72,.024,.09,'#8b7571',0,.029,z);
  const cityIpno=sprite(city,ipnoTexture,1.92),cityGuard=sprite(city,guardTexture,1.86);
  const capellone=sprite(city,capelloneTexture,1.78);
  const groupCapellone=sprite(city,capelloneGroupTexture,1.78);
  const crowd=crowdTextures.map((texture,index)=>{const actor=sprite(city,texture,1.74);
    actor.position.set((index-(crowdTextures.length-1)/2)*1.15,0,-2.75+index%2*.45);return actor;});
  const fineCard=new THREE.Group();city.add(fineCard);
  const paper=box(fineCard,.58,.72,.015,'#faf0d4',0,1.25,0);
  paper.rotation.z=-.12;
  for(let i=0;i<4;i++)box(fineCard,.38,.018,.018,'#41506a',0,1.44-i*.12,.025);
  const fineLabel=label(fineCard,'POKUTA 50 Kč',.57,'#e16952');fineLabel.position.set(0,1.58,.04);

  const office=new THREE.Group();scene.add(office);
  box(office,16,.16,13,'#5a4652',0,-.1,0);
  box(office,4.5,.025,3.5,'#8d314f',0,.02,.5);
  box(office,16,5,.25,'#354659',0,2.5,-5.8);
  box(office,.2,5,13,'#354659',-8,2.5,0);
  box(office,.2,5,13,'#354659',8,2.5,0);
  for(let x=-6;x<7;x+=2){box(office,1.5,2.1,.06,'#87a8b6',x,2.7,-5.61);box(office,1.3,1.9,.02,'#1d3a52',x,2.7,-5.56);}
  box(office,3.2,.18,1.45,'#886347',0,1.18,-.5);
  for(const x of [-1.35,1.35])box(office,.16,1,.16,'#5d4140',x,.6,-.5);
  box(office,2.9,.08,1.35,'#bb9870',0,1.33,-.5);
  for(const x of [-5.7,5.7]){
    box(office,1.45,2.1,.75,'#694952',x,1.05,-3.7);
    for(let y=.5;y<1.9;y+=.47){box(office,1.28,.03,.78,'#aa835d',x,y,-3.7);
      for(let j=0;j<5;j++)box(office,.11,.34,.2,['#d8af7e','#86a8bd','#dc786b'][j%3],x-.5+j*.24,y+.18,-3.4);}
  }
  box(office,.6,.05,.4,'#ead9b5',-.6,1.4,-.5);
  box(office,.24,.32,.24,'#b67239',.75,1.55,-.6);
  const deskLamp=new THREE.PointLight('#ffc583',3.8,4);deskLamp.position.set(.7,1.8,-.5);office.add(deskLamp);
  const officeSign=label(office,'POLICIE  ·  PRAHA',3.2);officeSign.position.set(0,4.15,-5.65);
  const officeIpno=sprite(office,ipnoTexture,1.92),officeGuard=sprite(office,guardTexture,1.86);
  officeIpno.position.set(-1.6,0,1.3);officeGuard.position.set(1.1,0,-1.7);
  const escalator=new THREE.Group();scene.add(escalator);
  box(escalator,15,.16,14,'#283848',0,-.1,0);
  box(escalator,15,7,.2,'#385170',0,3.5,-6.5);
  const window=label(escalator,'VÝCHOD  →  PRAHA',4);window.position.set(0,5.2,-6.38);
  const steps=[];
  for(let i=0;i<12;i++)steps.push(box(escalator,3.1,.17,.55,i%2?'#8a939a':'#b2a6a0',0,.3+i*.25,4-i*.72));
  for(const side of [-1,1]){
    const housing=box(escalator,.2,1.05,9.1,'#526477',side*1.72,1.47,0);
    housing.rotation.x=.33;
    const rail=box(escalator,.14,.09,9.3,'#b59b80',side*1.72,2.05,0);
    rail.rotation.x=.33;
    for(let z=-3;z<4;z+=1.5)box(escalator,.08,1.05,.08,'#92aab0',side*1.72,.8,z);
  }
  const escalatorIpno=sprite(escalator,ipnoTexture,1.92),escalatorGuard=sprite(escalator,guardTexture,1.86);
  escalatorGuard.position.x=1.1;
  function update(finale,aspect){
    camera.aspect=aspect;camera.updateProjectionMatrix();
    const {step,time,outcome}=finale;
    city.visible=['street','fine','result'].includes(step);office.visible=step==='office';escalator.visible=step==='escalator';
    cityGuard.visible=outcome==='caught'&&['fine','result'].includes(step);
    fineCard.visible=outcome==='caught'&&['fine','result'].includes(step);
    capellone.visible=outcome==='caught'&&['street','fine'].includes(step);
    groupCapellone.visible=outcome==='escaped'&&['street','result'].includes(step);
    for(const actor of crowd)actor.visible=outcome==='escaped'&&['street','result'].includes(step);
    if(city.visible){
      cityIpno.position.set(outcome==='escaped'?-3.2+Math.min(time/5.2,1)*2.2:-1.1,Math.abs(Math.sin(time*6))*.03,1.4);
      cityGuard.position.set(.8,0,.5);
      capellone.position.set(5-time*1.5,0,-3.65);
      groupCapellone.position.set(3.05,Math.sin(time*5+4)*.08,-2.75);
      groupCapellone.rotation.z=Math.sin(time*4+4)*.07;
      fineCard.position.set(.55-Math.min(time/3.2,1)*1.05,0,.45);
      fineCard.rotation.y=Math.sin(time*2)*.1;
      crowd.forEach((actor,i)=>{actor.position.y=Math.sin(time*5+i)*.1;actor.rotation.z=Math.sin(time*4+i)*.08;});
      camera.position.set(7,6.5,11);camera.lookAt(0,1.2,-1.2);
    }else if(office.visible){
      officeGuard.position.z=-1.7+Math.sin(time*2)*.06;
      officeIpno.rotation.y=Math.sin(time*1.6)*.09;
      camera.position.set(5.4,5.2,8.5);camera.lookAt(0,1.45,-1);
    }else if(escalator.visible){
      const progress=Math.min(1,time/4.4);
      escalatorIpno.position.set(-.55,progress*2.6,3-progress*7.5);
      escalatorGuard.position.set(.7,Math.max(0,progress-.2)*2.6,3-Math.max(0,progress-.2)*7.5);
      steps.forEach((stepMesh,i)=>{stepMesh.position.z=4-((i+time*1.6)%12)*.72;stepMesh.position.y=.3+((i+time*1.6)%12)*.25;});
      camera.position.set(6,5.3,8);camera.lookAt(0,2,0);
    }
    for(const actor of [cityIpno,cityGuard,capellone,groupCapellone,...crowd,officeIpno,officeGuard,escalatorIpno,escalatorGuard]){
      actor.rotation.y=Math.atan2(camera.position.x-actor.position.x,camera.position.z-actor.position.z);
    }
  }
  return {scene,camera,update,crowdCount:crowd.length};
}
