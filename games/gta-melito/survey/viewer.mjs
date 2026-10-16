const $=id=>document.getElementById(id);
const canvas=$('map'),c=canvas.getContext('2d'),sectorSel=$('sector');
const data={map:null,register:null,profiles:new Map(),byId:new Map(),visible:[],sector:null,focus:null,selected:null,x:0,y:0,scale:1,pointer:null};
const polycent=p=>{let x=0,y=0,n=0;for(let i=0;i<p.length;i+=2){if(i===p.length-2&&p[i]===p[0]&&p[i+1]===p[1])continue;x+=p[i];y+=p[i+1];n++;}return {x:x/n,y:y/n};};
function hex(v){return String(v||'').replace(/[^#0-9a-f]/gi,'')||'#dfbb79';}
function pointIn(p,x,y){let k=false;for(let i=0,j=p.length-2;i<p.length;j=i,i+=2){const ax=p[i],ay=p[i+1],bx=p[j],by=p[j+1];if((ay>y)!==(by>y)&&x<(bx-ax)*(y-ay)/(by-ay)+ax)k=!k;}return k;}
function getWorld(clientX,clientY){
 const r=canvas.getBoundingClientRect();return {x:data.x+(clientX-r.left-r.width/2)/data.scale,y:data.y+(clientY-r.top-r.height/2)/data.scale};
}
function paint(){
 const w=canvas.width,h=canvas.height;
 c.setTransform(1,0,0,1,0,0);c.fillStyle='#34473e';c.fillRect(0,0,w,h);
 if(!data.map)return;
 c.translate(w/2,h/2);c.scale(data.scale,data.scale);c.translate(-data.x,-data.y);
 const border=data.map.border;
 c.beginPath();c.moveTo(border[0],border[1]);for(let i=2;i<border.length;i+=2)c.lineTo(border[i],border[i+1]);c.closePath();
 c.fillStyle='#71836b';c.fill();c.lineWidth=4;c.strokeStyle='#e5d1a4';c.stroke();
 const lim=[data.x-w/2/data.scale-50,data.y-h/2/data.scale-50,data.x+w/2/data.scale+50,data.y+h/2/data.scale+50];
 c.lineCap='round';c.lineJoin='round';
 for(const road of data.map.roads){
  const p=road.p;if(!p.some((v,i)=>i%2===0&&v>=lim[0]&&v<=lim[2]))continue;
  c.beginPath();c.moveTo(p[0],p[1]);for(let i=2;i<p.length;i+=2)c.lineTo(p[i],p[i+1]);
  c.strokeStyle='#c1b49c';c.lineWidth=road.w+2;c.stroke();c.strokeStyle='#535e60';c.lineWidth=road.w;c.stroke();
 }
 for(const b of data.map.buildings){
  const box=b.surveyBox;if(!box)continue;
  if(box[2]<lim[0]||box[0]>lim[2]||box[3]<lim[1]||box[1]>lim[3])continue;
  const p=b.p,info=data.byId.get(b.id),selected=b.id===data.selected?.id;
  c.beginPath();c.moveTo(p[0],p[1]);for(let i=2;i<p.length;i+=2)c.lineTo(p[i],p[i+1]);c.closePath();
  const profile=data.profiles.get(b.id);
  c.fillStyle=selected?'#e3f0bc':profile?.photoVerified?'#e59c61':profile?hex(profile.roof):'#56716a';
  c.fill();c.lineWidth=selected?1.6:.7;c.strokeStyle=selected?'#182b26':'#1b3131';c.stroke();
 }
 const area=data.sector;
 if(area){
  const [x0,y0,x1,y1]=area.bbox;
  c.strokeStyle='#ffde8b';c.setLineDash([4,4]);c.lineWidth=1.8;c.strokeRect(x0,y0,x1-x0,y1-y0);c.setLineDash([]);
 }
 if(data.selected){
  const item=data.selected;
  c.strokeStyle='#ffcb6d';c.lineWidth=1.5/data.scale;c.beginPath();c.arc(item.x,item.y,10,0,Math.PI*2);c.stroke();
 }
 c.setTransform(1,0,0,1,0,0);
}
function resize(){
 const r=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);
 canvas.width=Math.max(400,Math.floor(r.width*dpr));canvas.height=Math.max(320,Math.floor(r.height*dpr));
 // World scale stored as CSS pixels -> scaled to canvas resolution.
 if(data.sector)fitSector();else paint();
}
function fitSector(){
 if(!data.sector)return;
 const [x0,y0,x1,y1]=data.sector.bbox;
 data.x=(x0+x1)/2;data.y=(y0+y1)/2;
 data.scale=Math.min(canvas.width/(x1-x0+110),canvas.height/(y1-y0+100));
 paint();
}
function streetview(record){
 const v=encodeURIComponent(record.lat+','+record.lon);
 return 'https://www.google.com/maps/@?api=1&map_action=pano&viewpoint='+v+'&fov=85';
}
function maps(record){
 return 'https://www.google.com/maps/@?api=1&map_action=map&center='+encodeURIComponent(record.lat+','+record.lon)+'&zoom=19&basemap=satellite';
}
function link(text,url){
 const el=document.createElement('a');el.textContent=text;el.href=url;el.target='_blank';el.rel='noopener noreferrer';return el;
}
function choose(id,centerOn=false){
 const b=data.byId.get(Number(id));if(!b)return;
 data.selected=b;if(centerOn){data.x=b.x;data.y=b.y;data.scale=Math.max(data.scale,2.2);}
 paint();
 const detail=$('detail');detail.replaceChildren();
 const h=document.createElement('h2');h.textContent='Edificio OSM #'+b.id;detail.append(h);
 const fields=[
 ['Stato',data.profiles.get(b.id)?.photoVerified?'EDIFICIO CON FOTO IDENTIFICATA':data.profiles.has(b.id)?'SCHEDA PRELIMINARE OSM':'DA ESAMINARE'],
 ['Posizione',b.lat.toFixed(6)+', '+b.lon.toFixed(6)],
 ['Tipologia OSM',b.osmType],
 ['Piani OSM',b.osmLevels??'non censiti'],
 ['Strada vicina',b.nearestNamedStreet?(b.nearestNamedStreet+' (~'+b.namedStreetDistance+' m, NON indirizzo)'):'non associata'],
 ['Verifica fotografica',data.profiles.get(b.id)?.photoVerified?'SÌ':'NO, da controllare']
 ];
 for(const [k,v] of fields){const row=document.createElement('p');row.textContent=k+': '+v;detail.append(row);}
 const a=data.profiles.get(b.id);
 if(a){const row=document.createElement('p');row.textContent=(a.photoVerified?'Aspetto documentato: ':'Bozza estetica OSM: ')+a.detail+' · area '+a.areaM2+' m² · asse '+a.longAxisDeg+'°';detail.append(row);}
 if(a?.observations){
  const obs=document.createElement('p');obs.textContent='Elementi riconosciuti: '+a.observations.facadeAppearance+'; '+a.observations.domeAppearance+'; '+a.observations.towerAppearance;
  detail.append(obs);
 }
 const warn=document.createElement('div');warn.className='warn';
 warn.textContent=a?.photoVerified?
 'La chiesa è identificata in fotografie e fonti pubbliche. La ricostruzione resta artistica: la posizione esatta del campanile nel rendering è indicativa.' :
 'Il colore delle pareti e del tetto è provvisorio: non è stato verificato su una foto specifica di questo edificio. Street View può aprire una vista diversa.';detail.append(warn);
 const links=document.createElement('div');links.className='detail-links';
 links.append(link('APRI GOOGLE MAPS',maps(b)),link('APRI STREET VIEW',streetview(b)),link('WAY OPENSTREETMAP','https://www.openstreetmap.org/way/'+b.id));
 if(a?.photoVerified)for(const source of a.evidence||[]){
  if(source.startsWith('https://')){
   const label=source.includes('comune.melito')?'FONTE COMUNE':source.includes('fondoambiente')?'FONTE FAI':source.includes('sigecweb')?'FOTO ICCD':'FOTO PIAZZA';
   links.append(link(label,source));
  }
 }
 detail.append(links);
 $('list').querySelectorAll('button').forEach(button=>button.classList.toggle('selected',button.dataset.id===String(b.id)));
 const chosen=$('list').querySelector('button.selected');chosen?.scrollIntoView({block:'nearest'});
 const u=new URL(location.href);u.searchParams.set('edificio',b.id);history.replaceState(null,'',u);
}
function renderSector(){
 const rows=data.register.buildings.filter(x=>data.sector.sector==='PSS'?x.focusArea==='PSS':x.sector===data.sector.sector).sort((a,b)=>data.sector.sector==='PSS'?a.focusOrder-b.focusOrder:a.y-b.y||a.x-b.x);
 data.visible=rows;
 const list=$('list');list.replaceChildren();
 rows.forEach((b,j)=>{
  const btn=document.createElement('button');btn.type='button';btn.dataset.id=String(b.id);
  btn.textContent=String(j+1).padStart(2,'0')+' · #'+b.id+' · '+(b.nearestNamedStreet||b.osmType);
  btn.addEventListener('click',()=>choose(b.id,true));
  list.append(btn);
 });
 $('totals').replaceChildren();
 const lines=[
 'EDIFICI CENSITI NEL COMUNE: '+data.register.totals.registered,
 'SCHEDE OSM PRELIMINARI: '+data.register.totals.osmDraft+' / '+data.register.totals.registered,
 'FACCIATE VERIFICATE CON FOTO: '+data.register.totals.photoVerified,
 data.sector.sector==='PSS'?'PIAZZA SANTO STEFANO · '+rows.length+' EDIFICI':'SETTORE '+data.sector.sector+' · EDIFICI '+rows.length,
 'PROSSIMO DA ESAMINARE: '+(data.register.activeFocus?.next||data.register.nextSector)
 ];
 for(const text of lines){const el=document.createElement('div');el.textContent=text;$('totals').append(el);}
 fitSector();if(rows.length)choose(rows[0].id,false);
}
function setSector(id){
 const sector=id==='PSS'?data.focus:data.register.sectors.find(x=>x.sector===id);if(!sector)return;
 data.sector=sector;sectorSel.value=id;renderSector();
}
async function boot(){
 try{
  const [m,r,p,piazza]=await Promise.all([
   fetch('../data/melito-map.json').then(r=>r.json()),
   fetch('./building-register.json').then(r=>r.json()),
   fetch('./sector-001-002.json').then(r=>r.json()),
   fetch('./piazza-santo-stefano.json').then(r=>r.json())
  ]);
  data.map=m;data.register=r;
  data.profiles=new Map([...p.profiles,...piazza.profiles].map(x=>[x.id,x]));
  data.focus={sector:'PSS',bbox:piazza.bbox,n:piazza.profiles.length,stage:'osm-draft'};
  data.byId=new Map(r.buildings.map(x=>[x.id,x]));
  const buildings=new Map(m.buildings.map(x=>[x.id,x]));
  for(const item of r.buildings){
   const building=buildings.get(item.id);
   if(!building)throw Error('Manca il fabbricato OSM '+item.id);
   let x0=Infinity,x1=-Infinity,y0=Infinity,y1=-Infinity;
   for(let i=0;i<building.p.length;i+=2){x0=Math.min(x0,building.p[i]);x1=Math.max(x1,building.p[i]);y0=Math.min(y0,building.p[i+1]);y1=Math.max(y1,building.p[i+1]);}
   building.surveyBox=[x0,y0,x1,y1];
  }
  const focusOption=document.createElement('option');focusOption.value='PSS';focusOption.textContent='★ PIAZZA SANTO STEFANO · '+piazza.profiles.length+' edifici';sectorSel.append(focusOption);
  for(const sect of r.sectors){const opt=document.createElement('option');opt.value=sect.sector;opt.textContent=sect.sector+' · '+sect.n+' edifici '+(sect.stage==='osm-draft'?'●':'○');sectorSel.append(opt);}
  const preselect=Number(new URL(location.href).searchParams.get('edificio'));
  const init=data.byId.get(preselect);
  setSector(init?.focusArea||init?.sector||'PSS');
  if(init)choose(init.id,true);
  sectorSel.addEventListener('change',()=>setSector(sectorSel.value));
  function next(d){
   const cur=data.visible.findIndex(b=>b.id===data.selected?.id);
   if(cur>=0&&cur+d>=0&&cur+d<data.visible.length){choose(data.visible[cur+d].id,true);return;}
   const seq=[data.focus,...data.register.sectors],current=seq.findIndex(s=>s.sector===data.sector.sector);
   const target=seq[current+d];if(target)setSector(target.sector);
  }
  $('prev').addEventListener('click',()=>next(-1));
  $('next').addEventListener('click',()=>next(1));
  $('fit').addEventListener('click',fitSector);
  canvas.addEventListener('pointerdown',ev=>{data.pointer={id:ev.pointerId,x:ev.clientX,y:ev.clientY,moved:false,wx:data.x,wy:data.y};try{canvas.setPointerCapture(ev.pointerId)}catch{}});
  canvas.addEventListener('pointermove',ev=>{
   if(!data.pointer||data.pointer.id!==ev.pointerId)return;
   const dx=ev.clientX-data.pointer.x,dy=ev.clientY-data.pointer.y;
   if(Math.hypot(dx,dy)>3)data.pointer.moved=true;
   const rect=canvas.getBoundingClientRect(),fx=canvas.width/rect.width,fy=canvas.height/rect.height;
   data.x=data.pointer.wx-dx*fx/data.scale;data.y=data.pointer.wy-dy*fy/data.scale;paint();
  });
  canvas.addEventListener('pointerup',ev=>{
   if(!data.pointer)return;
   const moved=data.pointer.moved;data.pointer=null;if(moved)return;
   const rect=canvas.getBoundingClientRect(),xx=(ev.clientX-rect.left)*canvas.width/rect.width,yy=(ev.clientY-rect.top)*canvas.height/rect.height;
   const x=data.x+(xx-canvas.width/2)/data.scale,y=data.y+(yy-canvas.height/2)/data.scale;
   for(const b of m.buildings)if(b.surveyBox?.[0]<=x&&b.surveyBox[2]>=x&&b.surveyBox[1]<=y&&b.surveyBox[3]>=y&&pointIn(b.p,x,y)){choose(b.id,false);const reference=data.byId.get(b.id);
     if(data.sector.sector==='PSS'&&reference?.focusArea==='PSS')return;
     const desired=reference?.focusArea==='PSS'?'PSS':reference?.sector;
     if(desired&&desired!==data.sector.sector){setSector(desired);choose(b.id,false);}
     return;}
  });
  canvas.addEventListener('wheel',e=>{e.preventDefault();data.scale=Math.min(30,Math.max(.1,data.scale*(e.deltaY>0?.84:1.19)));paint();},{passive:false});
  const observer=new ResizeObserver(()=>resize());observer.observe(canvas);resize();
 }catch(e){console.error('Survey viewer',e);$('totals').textContent='Impossibile caricare l’archivio cartografico: '+e.message;}
}
boot();
