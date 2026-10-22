import * as THREE from './vendor/three/three.module.js';

export function createFinaleScene({ipnoTexture,ipnoBackTexture,guardTexture,guardBackTexture,
  capelloneTexture,capelloneGroupTexture,facadeTexture,cobbleTexture,crowdTextures=[]}) {
  const scene=new THREE.Scene();scene.background=new THREE.Color('#bed8e7');
  scene.fog=new THREE.Fog('#bed8e7',20,45);
  const camera=new THREE.PerspectiveCamera(39,1,.1,80);
  const hemi=new THREE.HemisphereLight('#8bcaff','#53342f',1.75);scene.add(hemi);
  const sun=new THREE.DirectionalLight('#fff1c4',3.1);sun.position.set(-5,9,5);scene.add(sun);
  const cyan=new THREE.PointLight('#58dfff',.6,11);cyan.position.set(3,3,-4);scene.add(cyan);
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
  for(const x of [-6.85,0,6.85]){
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
  const citySign=label(city,'PRAHA 1  ·  STARÉ MĚSTO',3.1);citySign.position.set(2.55,3.2,-5.88);
  // Commercial entrance sits in front of the residential Prague facades.
  const shopX=-3.05;
  box(city,6.3,3.7,.45,'#e6d7bb',shopX,1.85,-5.78);
  box(city,6.3,.72,.55,'#287b76',shopX,3.47,-5.48);
  const shopSign=label(city,'POTRAVINY  ·  ČOKOLÁDA',5.65,'#e8f8e8');shopSign.position.set(shopX,3.47,-5.13);
  box(city,2.3,.13,.9,'#b3b9a8',shopX,2.92,-5.08);
  box(city,6.15,.12,.5,'#6c7573',shopX,2.86,-5.47);
  const glassMaterial=new THREE.MeshPhysicalMaterial({color:'#82bfcd',transparent:true,opacity:.65,roughness:.12,
    metalness:.15,side:THREE.DoubleSide,depthWrite:false});
  for(const x of [shopX-2.35,shopX+2.35]){
    box(city,1.36,2.33,.04,'#284656',x,1.48,-5.49);
    for(const side of [-1,1])box(city,.08,2.43,.08,'#637f83',x+side*.71,1.48,-5.36);
    for(const y of [.3,2.66])box(city,1.5,.08,.08,'#637f83',x,y,-5.36);
    box(city,1.45,.07,.08,'#637f83',x,1.24,-5.34);
    const glass=new THREE.Mesh(new THREE.PlaneGeometry(1.31,2.25),glassMaterial);
    glass.position.set(x,1.48,-5.3);city.add(glass);
    for(let i=0;i<3;i++)box(city,.9,.28,.13,['#e9ae55','#87b786','#d66b65'][i],x,.55+i*.42,-5.43);
  }
  box(city,1.93,2.48,.05,'#233d49',shopX,1.4,-5.48);
  const doorLeaves=[-1,1].map(side=>{
    const frame=new THREE.Group();city.add(frame);frame.position.set(shopX+side*.47,0,-5.29);
    const pane=new THREE.Mesh(new THREE.PlaneGeometry(.77,2.17),glassMaterial);
    pane.position.y=1.28;frame.add(pane);
    for(const dx of [-.43,.43])box(frame,.055,2.28,.07,'#8daeb0',dx,1.28,.03);
    for(const y of [.15,2.41])box(frame,.91,.06,.07,'#8daeb0',0,y,.03);
    box(frame,.9,.06,.07,'#8daeb0',0,1.15,.03);
    return {frame,side};
  });
  const exitSign=label(city,'VÝCHOD',1.8,'#baf8d2');exitSign.position.set(shopX,2.69,-5.26);
  // Small trolleys and groceries clarify the entrance without covering the actors.
  for(const x of [shopX-2.65,shopX+2.65]){
    box(city,.75,.4,.42,'#8aa9ae',x,.55,-4.65);
    box(city,.8,.055,.48,'#344f57',x,.77,-4.65);
    for(const dx of [-.28,.28])box(city,.11,.11,.11,'#293c43',x+dx,.18,-4.45);
  }
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
  box(escalator,3.25,.14,1.4,'#a9b6b4',0,.12,4.55);
  box(escalator,3.25,.14,1.4,'#a9b6b4',0,3.23,-5.08);
  for(const side of [-1,1]){
    const housing=box(escalator,.2,1.05,9.1,'#526477',side*1.72,1.47,0);
    housing.rotation.x=.33;
    const rail=box(escalator,.14,.09,9.3,'#b59b80',side*1.72,2.05,0);
    rail.rotation.x=.33;
    for(let z=-3;z<4;z+=1.5)box(escalator,.08,1.05,.08,'#92aab0',side*1.72,.8,z);
  }
  const escalatorIpno=sprite(escalator,ipnoBackTexture,1.92),escalatorGuard=sprite(escalator,guardBackTexture,1.86);
  for(const actor of [escalatorIpno,escalatorGuard])actor.children[0].material.depthTest=false;
  escalatorGuard.position.x=1.1;
  function update(finale,aspect){
    camera.aspect=aspect;camera.updateProjectionMatrix();
    const {step,time,outcome}=finale;
    city.visible=['street','fine','result'].includes(step);office.visible=step==='office';escalator.visible=step==='escalator';
    const outside=city.visible;
    scene.background.set(outside?'#bed8e7':'#171d2b');scene.fog.color.set(outside?'#bed8e7':'#171d2b');
    cyan.intensity=outside?.6:11;sun.intensity=outside?3.1:2.5;
    cityGuard.visible=outcome==='caught'&&['street','fine','result'].includes(step);
    fineCard.visible=outcome==='caught'&&['fine','result'].includes(step);
    capellone.visible=outcome==='caught'&&['street','fine'].includes(step);
    groupCapellone.visible=outcome==='escaped'&&['street','result'].includes(step);
    for(const actor of crowd)actor.visible=outcome==='escaped'&&['street','result'].includes(step);
    if(city.visible){
      if(step==='street'){
        const progress=Math.min(time/(outcome==='escaped'?5.2:3.1),1);
        cityIpno.position.set(shopX+progress*(outcome==='escaped'?1.3:1.95),Math.abs(Math.sin(time*6))*.03,-4.85+progress*6.25);
        cityGuard.position.set(cityIpno.position.x+.72,0,cityIpno.position.z-.35);
      }else{
        cityIpno.position.set(outcome==='escaped'?-1.75:-1.1,0,1.4);
        cityGuard.position.set(.8,0,.5);
      }
      capellone.position.set(2.95-time*.26,0,-2.95);
      groupCapellone.position.set(3.05,Math.sin(time*5+4)*.08,-2.75);
      groupCapellone.rotation.z=Math.sin(time*4+4)*.07;
      fineCard.position.set(.55-Math.min(time/3.2,1)*1.05,0,1.05);
      fineCard.rotation.y=Math.sin(time*2)*.1;
      crowd.forEach((actor,i)=>{actor.position.y=Math.sin(time*5+i)*.1;actor.rotation.z=Math.sin(time*4+i)*.08;});
      for(const {frame,side} of doorLeaves)frame.position.x=shopX+side*(.47+Math.min(time/.8,1)*.54);
      if(outcome==='escaped'){
        camera.position.set(4.5,4.65,7.15);camera.lookAt(-.1,1.35,-1.5);
      }else{
        camera.position.set(3.7,4.2,7.1);camera.lookAt(.05,1.25,-.55);
      }
    }else if(office.visible){
      officeGuard.position.z=-1.7+Math.sin(time*2)*.06;
      officeIpno.rotation.y=Math.sin(time*1.6)*.09;
      camera.position.set(3.8,3.65,5.7);camera.lookAt(-.2,1.45,-.6);
    }else if(escalator.visible){
      const progress=Math.min(1,time/4.4);
      const guardProgress=Math.max(0,progress-.17);
      escalatorIpno.position.set(-.55,.65+progress*2.6,3-progress*7.5);
      escalatorGuard.position.set(.7,.65+guardProgress*2.6,3-guardProgress*7.5);
      steps.forEach((stepMesh,i)=>{stepMesh.position.z=4-((i+time*1.6)%12)*.72;stepMesh.position.y=.3+((i+time*1.6)%12)*.25;});
      camera.position.set(3.9,4.8+progress*2.45,7.7-progress*7.5);
      camera.lookAt(0,.25+progress*2.45,.45-progress*7.5);
    }
    for(const actor of [cityIpno,cityGuard,capellone,groupCapellone,...crowd,officeIpno,officeGuard,escalatorIpno,escalatorGuard]){
      actor.rotation.y=Math.atan2(camera.position.x-actor.position.x,camera.position.z-actor.position.z);
    }
  }
  return {scene,camera,update,crowdCount:crowd.length};
}
