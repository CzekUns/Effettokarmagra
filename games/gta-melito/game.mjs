/* WORK HANDOFF / VISUAL REALISM:
 * Read ./AGENTS.md and ./HANDOFF_WORK_REALISMO.md before changing this game;
 * log completed visual improvements in ./VISUAL_PROGRESS.md.
 * Aim: identifiable Melito di Napoli in original top-down pixel art 2.5D.
 * Preserve OSM geometry, gameplay and camera controls. 
 */
import {visualRoadWidth,setRoadWidthMode,getRoadWidthMode} from './road-widths.mjs?v=043';
import {fetchOverpass,inside} from './osm.mjs';
import {buildRoadGraph,createAgents,stepAgents} from './roads.mjs?v=043';
import {buildStreetProps,drawArchitecture,drawStreets,drawCrosswalks,drawStreetProps,drawPoiSigns} from './visuals.mjs?v=043';
import {STORY,readProgress,saveProgress,freshProgress,resolveLandmarks,currentStep,activeTarget,isNear,doInteraction,updateTimer,resetCurrentMission} from './campaign.mjs';
import {drawWorldLandmarks,drawMinimapLandmarks,drawBigMap} from './landmark-art.mjs';
import {prepareCityStyles,prepareUrbanGround,drawTerrain,drawCityStreets,drawCityBuildings,drawCityPeople,drawCityCar,drawCityPlayer} from './city-art.mjs?v=081';
import {prepareStorefronts,drawStorefronts} from './storefronts.mjs?v=043';
import {applySurveyDrafts} from './survey/visual-profiles.mjs?v=045';
import {generateUrbanInfill,INFILL_VERSION,mapFingerprint} from './urban-infill.mjs?v=080';
import {CAMERA_ZOOM_MAX,targetCameraZoom,advanceCameraZoom,describeCameraZoom} from './camera-zoom.mjs?v=060';
const $=id=>document.getElementById(id);
const canvas=$('world'),c=canvas.getContext('2d',{alpha:false});
const radar=$('radar'),r=radar.getContext('2d');
const pressed={up:false,down:false,left:false,right:false,run:false,handbrake:false};
const stick={x:0,y:0};
function moveAxes(){return {x:Math.abs(stick.x)>.08?stick.x:Number(pressed.right)-Number(pressed.left),y:Math.abs(stick.y)>.08?stick.y:Number(pressed.down)-Number(pressed.up)};}
const state={map:null,roads:null,buildings:null,roadGrid:null,buildingGrid:null,cars:[],traffic:[],people:[],player:{x:0,y:0,a:0,car:-1},spawn:[0,0],zoom:CAMERA_ZOOM_MAX,zoomBias:1,zoomTarget:CAMERA_ZOOM_MAX,clock:0,last:0,hud:0,ready:false,loading:false,mapCanvas:null,graph:null,props:[],propsGrid:null,camera:{x:0,y:0},distance:0,shops:[],shopGrid:null,ground:null,inferredBuildings:[],inferredGrid:null,infillStats:null,landmarks:new Map(),progress:null,lastSave:0,bannerTimeout:0,mapOpen:false};
const CELL=140,DRIVE=new Set(['motorway','trunk','primary','secondary','tertiary','unclassified','residential','living_street','service','track']);
const colors=['#8f8271','#a29076','#797970','#ae947b','#938c7b','#7b8581','#a58c85'];
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const hash=n=>{let x=(Number(n)||1)|0;x=Math.imul(x^x>>>16,2246822519);x=Math.imul(x^x>>>13,3266489917);return (x^x>>>16)>>>0;};
const rnd=n=>hash(n)/4294967295;
function loading(title,message,retry=false){
 $('loading').hidden=false;$('loading-title').textContent=title;$('loading-text').textContent=message;
 $('retry').hidden=!retry;
}
function hideLoading(){ $('loading').hidden=true; }
function makeIndex(items){
 const grid=new Map();
 items.forEach((item,i)=>{
  const p=item.p;if(!p||p.length<4)return;
  let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;
  for(let j=0;j<p.length;j+=2){x0=Math.min(x0,p[j]);x1=Math.max(x1,p[j]);y0=Math.min(y0,p[j+1]);y1=Math.max(y1,p[j+1]);}
  item.bounds=[x0,y0,x1,y1];
  for(let gx=Math.floor(x0/CELL);gx<=Math.floor(x1/CELL);gx++)
   for(let gy=Math.floor(y0/CELL);gy<=Math.floor(y1/CELL);gy++){
    const key=gx+','+gy;if(!grid.has(key))grid.set(key,[]);
    grid.get(key).push(i);
   }
 });return grid;
}
function query(items,grid,x0,y0,x1,y1){
 const out=new Set();
 for(let gx=Math.floor(x0/CELL);gx<=Math.floor(x1/CELL);gx++)
  for(let gy=Math.floor(y0/CELL);gy<=Math.floor(y1/CELL);gy++)
   for(const i of grid.get(gx+','+gy)||[])out.add(i);
 return [...out].map(i=>items[i]);
}
function nearest(x,y,max=24,roads=state.roads,driveOnly=false){
 let best=null,dd=max*max;
 for(const road of query(roads,state.roadGrid,x-max,y-max,x+max,y+max)){
  if(driveOnly&&!DRIVE.has(road.t))continue;
  const p=road.p;
  for(let i=2;i<p.length;i+=2){
   const ax=p[i-2],ay=p[i-1],bx=p[i],by=p[i+1],dx=bx-ax,dy=by-ay,l2=dx*dx+dy*dy;
   const t=l2?clamp(((x-ax)*dx+(y-ay)*dy)/l2,0,1):0,qx=ax+t*dx,qy=ay+t*dy,d=(qx-x)**2+(qy-y)**2;
   if(d<dd){dd=d;best={road,x:qx,y:qy,a:Math.atan2(dy,dx),distance:Math.sqrt(d)};}
  }
 }return best;
}
function buildingAt(x,y){
 const hit=buildings=>buildings.some(b=>{
  const bd=b.bounds;if(!bd||x<bd[0]||x>bd[2]||y<bd[1]||y>bd[3])return false;
  let found=false,p=b.p;
  for(let i=0,j=p.length-2;i<p.length;j=i,i+=2){
   const ax=p[i],ay=p[i+1],bx=p[j],by=p[j+1];
   if(((ay>y)!==(by>y))&&(x<(bx-ax)*(y-ay)/(by-ay)+ax))found=!found;
  }return found;
 });
 if(hit(query(state.buildings,state.buildingGrid,x-5,y-5,x+5,y+5)))return true;
 return state.inferredGrid?
  hit(query(state.inferredBuildings,state.inferredGrid,x-5,y-5,x+5,y+5)):false;
}
function validWalk(x,y){
 return x>=0&&y>=0&&x<state.map.projection.width&&y<state.map.projection.height&&!buildingAt(x,y);
}
function arcLength(p){let sum=0;for(let j=2;j<p.length;j+=2)sum+=Math.hypot(p[j]-p[j-2],p[j+1]-p[j-1]);return sum;}
function roadPoint(road,fraction){
 const p=road.p,total=arcLength(p);let left=total*fraction;
 for(let i=2;i<p.length;i+=2){
  const ax=p[i-2],ay=p[i-1],dx=p[i]-ax,dy=p[i+1]-ay,len=Math.hypot(dx,dy);
  if(left<=len||i===p.length-2)return {x:ax+dx*(len?left/len:0),y:ay+dy*(len?left/len:0),a:Math.atan2(dy,dx)};
  left-=len;
 }
 return {x:p[0],y:p[1],a:0};
}
function prepareMap(map,surveyData=[],infillCache=null){
 if(!map||!Array.isArray(map.roads)||map.roads.length<20||!Array.isArray(map.border))throw Error('La mappa salvata non contiene una rete stradale valida');
 state.map=map;
 state.roads=map.roads;state.buildings=map.buildings||[];
 prepareCityStyles(state.buildings,map.pois||[]);
 const survey=applySurveyDrafts(state.buildings,surveyData);
 console.info('Melito visual city scan: '+survey.applied+'/'+survey.total+' buildings styled, '+survey.verified+' photo-verified');
 // Synthetic fillers are visually plausible but not mapped real addresses.
 // Deterministically fill only urban gaps, clear of real buildings and roads.
 // The checked-in synthetic art cache avoids a multi-second geometry pass
 // on modest phones. A mismatched map/version always regenerates safely.
 const inferred=infillCache?.schema===1&&infillCache.generatorVersion===INFILL_VERSION&&
  infillCache.sourceCreated===map.created&&infillCache.sourceFingerprint===mapFingerprint(map)&&
  infillCache.sourceOsmBuildings===map.buildings.length&&
  Array.isArray(infillCache.buildings)&&infillCache.stats?.generated===infillCache.buildings.length?
  infillCache:generateUrbanInfill(map);
 state.inferredBuildings=inferred.buildings;state.infillStats=inferred.stats;
 prepareCityStyles(state.inferredBuildings,[]);
 const facade=['#b8ad9f','#cbb9a5','#c9c6b6','#b1a99b','#d0bba9','#aba99b'];
 const roof=['#a58d79','#b8aa97','#c3b8a5','#9da29d','#ac9a87'];
 for(const b of state.inferredBuildings){
  const h=hash(Math.abs(b.id)),a=b.art;
  a.inferred=true;a.facadeTint=facade[h%facade.length];a.roofTint=roof[(h>>>5)%roof.length];
  a.renderHeight=b.h;
  // Inferred urban apartment blocks mostly have terraces; roof form is a
  // stylistic estimate, kept separate from the photo-verified church override.
  a.roof=b.p.length<=10&&h%5===0;
 }
 state.ground=prepareUrbanGround([...state.buildings,...state.inferredBuildings],state.roads);
 state.roadGrid=makeIndex(state.roads);state.buildingGrid=makeIndex(state.buildings);
 state.inferredGrid=makeIndex(state.inferredBuildings);
 const possible=state.roads.filter(q=>DRIVE.has(q.t)&&q.p.length>=4);
 if(!possible.length)throw Error('Non risultano strade percorribili in auto');
 const center=[map.projection.width/2,map.projection.height/2];
 const viaRoma=possible.filter(q=>/\bvia roma\b/i.test(q.n));
 const candidates=viaRoma.length?viaRoma:possible.filter(q=>q.n&&arcLength(q.p)>55);
 const pool=candidates.length?candidates:possible;
 const chosen=pool.map(q=>({q,p:roadPoint(q,.5)})).sort((a,b)=>Math.hypot(a.p.x-center[0],a.p.y-center[1])-Math.hypot(b.p.x-center[0],b.p.y-center[1]))[0];
 const point=chosen.p;
 state.zoom=CAMERA_ZOOM_MAX;state.zoomTarget=CAMERA_ZOOM_MAX;state.zoomBias=1;
 state.spawn=[point.x,point.y];Object.assign(state.player,{x:point.x,y:point.y,a:point.a,car:-1});
 state.camera.x=point.x;state.camera.y=point.y;state.distance=0;
 state.graph=buildRoadGraph(state.roads);
 state.props=buildStreetProps(state.roads).filter(obj=>!buildingAt(obj.x,obj.y));
 state.propsGrid=makeIndex(state.props);
 state.shops=prepareStorefronts(map.pois||[],state.roads);
 state.shopGrid=makeIndex(state.shops);
 initCampaign(map);
 const nearCar={x:point.x+Math.cos(point.a)*9,y:point.y+Math.sin(point.a)*9,a:point.a,speed:0,type:0};
 state.cars=[nearCar];
 let k=0;
 for(const road of possible){
  if(arcLength(road.p)<25||rnd(road.id)%1>.33)continue;
  const pt=roadPoint(road,.2+rnd(road.id+11)*.6);
  if(Math.hypot(pt.x-point.x,pt.y-point.y)<19)continue;
  state.cars.push({x:pt.x,y:pt.y,a:pt.a,speed:0,type:k++%5});
  if(state.cars.length>=105)break;
 }
 state.traffic=createAgents(state.graph,140,189,'car');
 state.people=createAgents(state.graph,190,310,'walk');
 $('road-count').textContent=String(state.roads.length);
 $('building-count').textContent=String(state.buildings.length);
 $('inferred-count').textContent=String(state.inferredBuildings.length);
 $('junction-count').textContent=String(state.graph.junctions);
 $('place').textContent='MELITO DI NAPOLI · MAPPA REALE';
 state.ready=true;hideLoading();state.last=0;canvas.focus({preventScroll:true});prepareMini();refreshCampaign();updateRoadWidthLabel();updateHud();
}

/* Campaign v0.3 — map positions always resolved from the downloaded OSM snapshot. */
function initCampaign(map){
 try{
  state.landmarks=resolveLandmarks(map,{x:state.spawn[0],y:state.spawn[1]});
  state.progress=readProgress(localStorage);
 }catch(error){
  console.error('Campaign not available:',error);
  state.progress=null;state.landmarks=new Map();
  $('mission-name').textContent='MISSIONI NON DISPONIBILI';
  $('mission-desc').textContent='Un punto d’interesse OSM manca dalla mappa. La città resta esplorabile.';
 }
}
function formattedTime(sec){const t=Math.max(0,Math.ceil(sec));return Math.floor(t/60)+':'+String(t%60).padStart(2,'0');}
function refreshCampaign(){
 const p=state.progress;if(!p)return;
 const active=currentStep(p);
 const target=activeTarget(p,state.landmarks);
 $('mission-money').textContent='€ '+p.money;
 $('mission-respect').textContent=p.respect;
 $('mission-progress').textContent=p.completed?'4/4':(p.mission+1)+'/4';
 $('mission-reset').textContent=p.completed?'NUOVA PARTITA ↻':'RICOMINCIA MISSIONE ↻';
 if(p.completed){
  $('mission-name').textContent='MELITO È TUA ★';
  $('mission-desc').textContent='Hai completato tutte le missioni. Continua a esplorare o ricomincia.';
  $('mission-destination').textContent='STORIA COMPLETATA';
  $('mission-distance').textContent='—';
  $('mission-time').textContent='LIBERA ESPLORAZIONE';
  $('mission-interact').textContent='MISSIONI COMPLETE ✓';
  $('mission-interact').disabled=true;
  $('waypoint').hidden=true;return;
 }
 $('mission-interact').disabled=false;
 $('mission-name').textContent=active.mission.title;
 $('mission-desc').textContent=active.mission.intro;
 $('mission-destination').textContent=(p.stage+1)+'/'+active.mission.steps.length+' · '+active.step.verb+' · '+target.name;
 const check=isNear(p,state.landmarks,state.player.x,state.player.y,state.player.car>=0);
 $('mission-distance').textContent=Math.ceil(check.distance)+' m';
 $('mission-time').textContent=active.mission.time?'TEMPO: '+formattedTime(p.remaining===null?active.mission.time:p.remaining):'NESSUN LIMITE';
 $('mission-interact').textContent=check.near?'F · '+active.step.verb+' ✓':
  check.reason==='exit-car'?'SCENDI DALL’AUTO PER '+active.step.verb:'F · '+active.step.verb;
 if(state.ready){
  const angle=Math.atan2(target.y-state.player.y,target.x-state.player.x);
  const dirs=['→','↘','↓','↙','←','↖','↑','↗'];
  const direction=dirs[(Math.round(angle/(Math.PI/4))+8)%8];
  $('waypoint').textContent=direction+' '+target.name.toUpperCase()+' · '+Math.ceil(check.distance)+' M';
  $('waypoint').hidden=check.distance<16||$('mission-panel').hidden;
 }
}
function message(text,title='NUOVO MESSAGGIO',speaker='NICO'){
 const panel=$('dialog');$('dialog-head').textContent=title;
 $('dialog-speaker').textContent=speaker;$('dialog-text').textContent=text;
 panel.hidden=false;
}
function interactMission(){
 if(!state.ready||!state.progress)return;
 const p=state.progress;
 const result=doInteraction(p,state.landmarks,state.player.x,state.player.y,state.player.car>=0);
 if(result.type==='blocked'){
  $('mission-hint').textContent=result.message;
  return;
 }
 if(result.type==='finished'){message(result.message,'MELITO È TUA');return;}
 $('mission-hint').textContent='';
 saveProgress(localStorage,p);
 const title=result.type==='ending'?'LA CITTÀ È TUA ★':result.type==='mission-complete'?'MISSIONE SUPERATA!':result.speaker||'MESSAGGIO';
 const body=result.type==='mission-complete'||result.type==='ending'?
  result.text+'\n\n'+result.message+'\nRICOMPENSA: €'+result.reward:result.text;
 message(body,title,result.speaker||'RADIO');
 refreshCampaign();
}
function toggleBigMap(){
 if(!state.ready||!state.map)return;
 state.mapOpen=!state.mapOpen;
 $('fullmap').hidden=!state.mapOpen;
 if(!state.mapOpen)return;
 const cv=$('bigmap'),width=640,height=580;
 cv.width=width;cv.height=height;
 drawBigMap(cv.getContext('2d'),width,height,state.map,state.landmarks,state.player,
   state.progress?activeTarget(state.progress,state.landmarks):null);
}

function updateTraffic(dt){
 stepAgents(state.graph,state.traffic,dt,state.player);
 stepAgents(state.graph,state.people,dt);
}
function toggleVehicle(){
 if(!state.ready)return;
 const p=state.player;
 if(p.car>=0){
  const car=state.cars[p.car],xx=car.x-Math.sin(car.a)*3.8,yy=car.y+Math.cos(car.a)*3.8;
  p.x=validWalk(xx,yy)?xx:car.x;p.y=validWalk(xx,yy)?yy:car.y;p.car=-1;
 }else{
  let close=-1,dist=11;
  state.cars.forEach((car,i)=>{const d=Math.hypot(car.x-p.x,car.y-p.y);if(d<dist){dist=d;close=i;}});
  if(close>=0){p.car=close;p.a=state.cars[close].a;}else{$('street').textContent='AVVICINATI A UN\u2019AUTO PER SALIRE';}
 }
 updateHud();
}
function carBlocked(x,y,a,which){
 // The OSM centreline is authoritative for driving. A building whose mapped
 // footprint clips that corridor is visually masked by the road painter and
 // cannot trap a car inside the drivable surface.
 const dirx=Math.cos(a),diry=Math.sin(a);
 for(const forward of [-2.6,0,3.4])for(const side of [-1.7,1.7]){
  const px=x+dirx*forward-diry*side,py=y+diry*forward+dirx*side;
  if(!inside([px,py],toRing(state.map.border)))return true;
  const road=nearest(px,py,25,state.roads,true);
  const onAsphalt=road&&road.distance<=Math.max(0,visualRoadWidth(road.road)/2-.55);
  if(!onAsphalt)return true;
 }
 for(let i=0;i<state.cars.length;i++){
  if(i===which)continue;
  const b=state.cars[i];
  if(Math.abs(b.x-x)>5.7||Math.abs(b.y-y)>5.7)continue;
  if(Math.hypot(b.x-x,b.y-y)<5.4)return true;
 }
 for(const ai of state.traffic){
  if(Math.abs(ai.x-x)<4.2&&Math.abs(ai.y-y)<4.2&&Math.hypot(ai.x-x,ai.y-y)<4)return true;
 }
 return false;
}
function toRing(border){
 if(state.borderRing)return state.borderRing;
 state.borderRing=[];
 for(let i=0;i<border.length;i+=2)state.borderRing.push([border[i],border[i+1]]);
 return state.borderRing;
}
function tick(dt){
 if(!state.ready)return;
 if(state.mapOpen||!$('dialog').hidden||!$('pause-menu').hidden){
  for(const key of Object.keys(pressed))pressed[key]=false;
  stick.x=0;stick.y=0;
  return;
 }
 const p=state.player;
 if(p.car>=0){
  const car=state.cars[p.car],prior=car.speed||0;
  let speed=prior;
  const axis=moveAxes(),throttle=axis.y<-.08?-axis.y:axis.y>.08?-axis.y:0;
  if(Math.abs(throttle)>.08)speed+=22*dt*throttle;
  else speed-=Math.sign(speed)*Math.min(Math.abs(speed),6*dt);
  if(pressed.handbrake)speed*=Math.pow(.045,dt);
  speed=clamp(speed,-9,28);
  const steer=moveAxes().x;
  if(steer&&Math.abs(speed)>.25){
   car.a+=steer*1.38*dt*(speed<0?-1:1)*clamp(Math.abs(speed)/9,.17,1);
  }
  const nx=car.x+Math.cos(car.a)*speed*dt,ny=car.y+Math.sin(car.a)*speed*dt;
  if(!carBlocked(nx,ny,car.a,p.car)){
   car.x=nx;car.y=ny;state.distance+=Math.abs(speed*dt);
  }else speed=0;
  car.speed=speed;p.x=car.x;p.y=car.y;p.a=car.a;
 }else{
  const axis=moveAxes(),dx=axis.x,dy=axis.y;
  if(Math.hypot(dx,dy)>.08){
   const len=Math.hypot(dx,dy),v=(pressed.run?7.5:5.0)*Math.min(1,len),nx=p.x+dx/len*v*dt,ny=p.y+dy/len*v*dt;
   if(validWalk(nx,p.y)&&inside([nx,p.y],toRing(state.map.border)))p.x=nx;
   if(validWalk(p.x,ny)&&inside([p.x,ny],toRing(state.map.border)))p.y=ny;
   p.a=Math.atan2(dy,dx);state.distance+=v*dt;
  }
 }
 updateTraffic(dt);
 if(state.progress){
  const result=updateTimer(state.progress,dt);
  if(result){message(result.message,'TEMPO SCADUTO');saveProgress(localStorage,state.progress);refreshCampaign();}
  state.lastSave+=dt;
  if(state.lastSave>4){state.lastSave=0;saveProgress(localStorage,state.progress);}
 }
 const axis=moveAxes(),moving=Math.hypot(axis.x,axis.y)>.08;
 const movement={inVehicle:p.car>=0,
  speed:p.car>=0?Math.abs(state.cars[p.car].speed):moving?(pressed.run?7.5:5):0,
  running:pressed.run,moving:!!moving};
 state.zoomTarget=targetCameraZoom(movement,state.zoomBias);
 state.zoom=advanceCameraZoom(state.zoom,state.zoomTarget,dt);
 const targetX=p.x+(p.car>=0?Math.cos(p.a)*8:0);
 const targetY=p.y+(p.car>=0?Math.sin(p.a)*8:0);
 const follow=1-Math.exp(-6*dt);
 state.camera.x+=(targetX-state.camera.x)*follow;
 state.camera.y+=(targetY-state.camera.y)*follow;
 state.clock+=dt;state.hud+=dt;if(state.hud>.18){state.hud=0;updateHud();refreshCampaign();}
}

function updateRoadWidthLabel(){
 const before=getRoadWidthMode()==='before';
 const v=visualRoadWidth({t:'residential',w:7}).toFixed(1).replace('.',',');
 $('road-width-current').textContent=before?'PRIMA · '+v:'ADESSO · '+v;
 $('road-width-compare').textContent=before?'VEDI STRADE LARGHE':'CONFRONTA CON PRIMA';
 $('road-width-compare').setAttribute('aria-pressed',String(before));
}
function compareRoadWidths(){
 if(!state.ready)return;
 setRoadWidthMode(getRoadWidthMode()==='before'?'wide':'before');
 // Every consumer shares the same module instance, including roads/traffic,
 // street furniture, crosswalks and building-side storefront placements.
 state.graph=buildRoadGraph(state.roads);
 state.traffic=createAgents(state.graph,140,189,'car');
 state.people=createAgents(state.graph,190,310,'walk');
 state.props=buildStreetProps(state.roads).filter(obj=>!buildingAt(obj.x,obj.y));
 state.propsGrid=makeIndex(state.props);
 state.shops=prepareStorefronts(state.map.pois||[],state.roads);
 state.shopGrid=makeIndex(state.shops);
 updateRoadWidthLabel();
}

function updateHud(){
 const p=state.player;
 $('vehicle').textContent=p.car>=0?'AUTO · '+Math.round(Math.abs(state.cars[p.car].speed)*3.6)+' KM/H':'A PIEDI';
 const n=state.roadGrid?nearest(p.x,p.y,70):null;
 if(n&&n.road.n)$('street').textContent=n.road.n.toUpperCase();
 else if(n)$('street').textContent='STRADA SENZA NOME · OSM';
 $('action').textContent=p.car>=0?'SCENDI':'ENTRA IN AUTO';
 $('sprint').textContent=p.car>=0?'FRENO':'CORRI';
 $('sprint').setAttribute('aria-label',p.car>=0?'Freno a mano':'Corri');
 const axis=moveAxes(),moving=Math.hypot(axis.x,axis.y)>.08;
 const status={inVehicle:p.car>=0,
  speed:p.car>=0?Math.abs(state.cars[p.car].speed):moving?(pressed.run?7.5:5):0,
  running:pressed.run,moving:!!moving};
 $('camera-mode').textContent=describeCameraZoom(status)+' · '+state.zoom.toFixed(1)+'×';
}
function drawLine(p){c.beginPath();c.moveTo(p[0],p[1]);for(let i=2;i<p.length;i+=2)c.lineTo(p[i],p[i+1]);}
function poly(p){drawLine(p);c.closePath();}
function drawCar(x,y,a,type,drive=false){drawCityCar(c,x,y,a,type,drive,state.clock);}
function drawPlayer(){
 const axis=moveAxes(),moving=Math.hypot(axis.x,axis.y)>.08;
 drawCityPlayer(c,state.player,state.clock,moving);
}
function visibleBounds(){
 const x=state.camera.x,y=state.camera.y,pad=90;
 return [x-canvas.clientWidth/(2*state.zoom)-pad,y-canvas.clientHeight/(2*state.zoom)-pad,x+canvas.clientWidth/(2*state.zoom)+pad,y+canvas.clientHeight/(2*state.zoom)+pad];
}
function draw(){
 // Render at a compact palette resolution and let CSS scale nearest-neighbor;
 // the chunky edges read as pixel art and reduce fill/texture work on phones.
 const cw=canvas.clientWidth,ch=canvas.clientHeight,ratio=Math.max(.62,Math.min(window.devicePixelRatio||1,2)*.72);
 if(canvas.width!==Math.floor(cw*ratio)||canvas.height!==Math.floor(ch*ratio)){canvas.width=Math.floor(cw*ratio);canvas.height=Math.floor(ch*ratio);}
 c.setTransform(ratio,0,0,ratio,0,0);
 c.imageSmoothingEnabled=false;
 c.fillStyle='#15221e';c.fillRect(0,0,cw,ch);
 if(!state.ready)return;
 const p=state.player;
 c.translate(cw/2,ch/2);c.scale(state.zoom,state.zoom);c.translate(-state.camera.x,-state.camera.y);
 const border=state.map.border;
 c.beginPath();c.moveTo(border[0],border[1]);for(let i=2;i<border.length;i+=2)c.lineTo(border[i],border[i+1]);c.closePath();
 c.fillStyle='#988f81';c.fill();c.lineWidth=10;c.strokeStyle='#9e998a';c.stroke();
 const [x0,y0,x1,y1]=visibleBounds();
 const buildings=query(state.buildings,state.buildingGrid,x0,y0,x1,y1);
 const inferred=query(state.inferredBuildings,state.inferredGrid,x0,y0,x1,y1);
 const roads=query(state.roads,state.roadGrid,x0,y0,x1,y1);
 if(state.zoom>=1.05){
  c.save();c.beginPath();c.moveTo(border[0],border[1]);for(let i=2;i<border.length;i+=2)c.lineTo(border[i],border[i+1]);
  c.closePath();c.clip();drawTerrain(c,[x0,y0,x1,y1],state.zoom,state.ground);c.restore();
 }
 drawCityStreets(c,roads,state.zoom);
 // One global painter order: placeholders and genuine OSM roofs occlude
 // each other by their projected foot depth, not by their source type.
 drawCityBuildings(c,[...inferred,...buildings],state.zoom);
 // Repaint the complete road bed above OSM footprints and their 2.5D walls.
 // Some OSM ways run along/through coarse building polygons; the roads remain
 // intact and visually clear while the source building geometry stays intact.
 drawCityStreets(c,roads,state.zoom);
 drawCrosswalks(c,state.graph,[x0,y0,x1,y1],state.zoom);
 drawStreetProps(c,query(state.props,state.propsGrid,x0,y0,x1,y1),state.zoom);
 drawStorefronts(c,query(state.shops,state.shopGrid,x0,y0,x1,y1),state.zoom);
 if(state.zoom>1.75){
  c.font='3.6px monospace';c.fillStyle='#e5d9bc';c.textAlign='center';
  const seen=new Set(),placed=[];
  const miniW=cw<=680?112:176,miniH=cw<=680?102:150;
  const landmarkCenters=[...state.landmarks.values()].map(item=>[
   cw/2+(item.x-state.camera.x)*state.zoom,
   ch/2+(item.y-state.camera.y)*state.zoom
  ]);
  for(const road of roads){
   if(!road.n||seen.has(road.n)||road.p.length<4)continue;
   seen.add(road.n);
   const q=roadPoint(road,.5);
   const sx=cw/2+(q.x-state.camera.x)*state.zoom;
   const sy=ch/2+(q.y-state.camera.y)*state.zoom;
   // The minimap sits above the canvas on mobile and desktop. Skip labels
   // under it and leave breathing room around landmarks and other street names.
   if(sx>cw-miniW&&sy<miniH)continue;
   if(landmarkCenters.some(([lx,ly])=>Math.hypot(sx-lx,sy-ly)<76))continue;
   if(placed.some(([lx,ly])=>Math.hypot(sx-lx,sy-ly)<78))continue;
   placed.push([sx,sy]);
   c.save();c.translate(q.x,q.y);let angle=q.a;if(angle>Math.PI/2||angle< -Math.PI/2)angle+=Math.PI;c.rotate(angle);
   const text=road.n.toUpperCase().slice(0,25),offset=visualRoadWidth(road)/2+3.4;
   // Test the actual offset text rectangle, not only its road anchor. Long
   // road names previously crossed the church dome and the mobile minimap.
   const tx=q.x+Math.sin(angle)*offset,ty=q.y-Math.cos(angle)*offset;
   const halfW=text.length*3.6*.61/2,halfH=3.6;
   const rx=Math.abs(Math.cos(angle))*halfW+Math.abs(Math.sin(angle))*halfH;
   const ry=Math.abs(Math.sin(angle))*halfW+Math.abs(Math.cos(angle))*halfH;
   const coversLandmark=buildings.some(b=>['church','civic'].includes(b.art?.type)&&
    tx+rx>b.art.x0&&tx-rx<b.art.x1&&ty+ry>b.art.y0&&ty-ry<b.art.y1);
   const left=cw/2+(tx-rx-state.camera.x)*state.zoom,right=cw/2+(tx+rx-state.camera.x)*state.zoom;
   const top=ch/2+(ty-ry-state.camera.y)*state.zoom,bottom=ch/2+(ty+ry-state.camera.y)*state.zoom;
   if(!coversLandmark&&left>=3&&right<=cw-3&&top>=3&&bottom<=ch-3&&
      !(right>cw-miniW&&top<miniH))c.fillText(text,0,-offset);
   c.restore();
  }
 }
 // Storefront labels are tied to nearby real POIs, not floating over every roof.
 if(state.progress)drawWorldLandmarks(c,state.landmarks,activeTarget(state.progress,state.landmarks),[x0,y0,x1,y1],state.clock,state.zoom,currentStep(state.progress)?.step.speaker);
 drawCityPeople(c,state.people,state.graph,state.clock,[x0,y0,x1,y1]);
 for(const ai of state.traffic)if(ai.x>=x0&&ai.x<=x1&&ai.y>=y0&&ai.y<=y1)drawCar(ai.x,ai.y,ai.a,ai.kind);
 state.cars.forEach((v,i)=>{if(v.x>=x0&&v.x<=x1&&v.y>=y0&&v.y<=y1)drawCar(v.x,v.y,v.a,v.type,i===p.car);});
 drawPlayer();
}
function prepareMini(){
 const p=state.map.projection,off=document.createElement('canvas');off.width=168;off.height=142;
 const b=off.getContext('2d');
 const k=Math.min(152/p.width,124/p.height),ox=(168-p.width*k)/2,oy=(142-p.height*k)/2;
 b.fillStyle='#172520';b.fillRect(0,0,168,142);b.save();b.translate(ox,oy);b.scale(k,k);
 b.beginPath();const border=state.map.border;b.moveTo(border[0],border[1]);for(let i=2;i<border.length;i+=2)b.lineTo(border[i],border[i+1]);b.closePath();
 b.fillStyle='#536451';b.fill();b.strokeStyle='#b8af84';b.lineWidth=15;b.stroke();
 b.lineCap='round';b.strokeStyle='#bbc3aa';b.lineWidth=7;
 for(const road of state.roads)if(DRIVE.has(road.t)){b.beginPath();b.moveTo(road.p[0],road.p[1]);for(let i=2;i<road.p.length;i+=2)b.lineTo(road.p[i],road.p[i+1]);b.stroke();}
 b.restore();state.mapCanvas=off;state.mini={k,ox,oy};
}
function drawMini(){
 if(!state.mapCanvas)return;
 r.clearRect(0,0,168,142);r.drawImage(state.mapCanvas,0,0);
 if(state.progress)drawMinimapLandmarks(r,state.landmarks,activeTarget(state.progress,state.landmarks),state.mini);
 const {k,ox,oy}=state.mini,p=state.player,x=ox+p.x*k,y=oy+p.y*k;
 r.fillStyle='#ffce66';r.beginPath();r.arc(x,y,4,0,Math.PI*2);r.fill();
 r.lineWidth=1.4;r.strokeStyle='#1e2920';r.stroke();
 r.fillStyle='#fff0b9';r.font='bold 8px monospace';r.fillText('MELITO',5,10);
}
function frame(now){
 const dt=state.last?Math.min(.05,(now-state.last)/1000):0;state.last=now;
 tick(dt);draw();drawMini();requestAnimationFrame(frame);
}
async function load(){
 if(state.loading)return;
 state.loading=true;loading('CARICO MELITO…','Recupero i confini ISTAT e la cartografia delle strade.');
 try{
  const resp=await fetch('./data/boundary.json',{cache:'no-cache'});if(!resp.ok)throw Error('Confine comunale mancante');
  const boundary=await resp.json();let map=null,staticError='';
  try{
   const req=await fetch('./data/melito-map.json',{cache:'no-cache'});
   if(req.ok){const json=await req.json();if(json.roads?.length>20)map=json;}
   else staticError='Archivio statico non ancora generato';
  }catch(e){staticError=e.message;}
  if(!map){
   try{const c=JSON.parse(localStorage.getItem('gta-melito-osm-v1')||'null');if(c?.roads?.length>20)map=c;}catch(e){}
  }
  if(!map){
   loading('STO ACQUISENDO MELITO','La prima apertura scarica la rete stradale e gli edifici reali da OpenStreetMap. '+staticError);
   map=await fetchOverpass(boundary,url=>{$('loading-text').textContent='Collegamento cartografico: '+new URL(url).hostname+'. Le strade resteranno fedeli ai dati OSM.';});
   try{localStorage.setItem('gta-melito-osm-v1',JSON.stringify(map));}catch(e){console.warn('Cache della mappa non disponibile:',e);}
  }
  const surveyData=[];
  for(const path of ['./survey/sector-001-002.json','./survey/town-visuals.json','./survey/piazza-santo-stefano.json']){
   try{
    const surveyReq=await fetch(path,{cache:'no-cache'});
    if(surveyReq.ok)surveyData.push(await surveyReq.json());
   }catch(error){console.warn('Optional building survey unavailable',path,error);}
  }
  let infillCache=null;
  try{
   const req=await fetch('./data/urban-infill.json',{cache:'no-cache'});
   if(req.ok)infillCache=await req.json();
  }catch(error){console.warn('Optional synthetic art cache unavailable',error);}
  prepareMap(map,surveyData,infillCache);
 }catch(e){console.error('GTA Melito map load',e);loading('MAPPA NON DISPONIBILE','Non posso mostrare una Melito inventata: '+e.message+'. Riprova quando la cartografia è disponibile.',true);}
 finally{state.loading=false;}
}
function bind(){
 // Keep page/browser zoom disabled while preserving the game's own camera zoom.
 window.addEventListener('keydown',e=>{
  const zoomKey=['+','=','-','_','0','Add','Subtract','NumpadAdd','NumpadSubtract','Numpad0'].includes(e.key)||['NumpadAdd','NumpadSubtract','Numpad0'].includes(e.code);
  if((e.ctrlKey||e.metaKey)&&zoomKey)e.preventDefault();
 },{capture:true});
 window.addEventListener('wheel',e=>{if(e.ctrlKey||e.metaKey)e.preventDefault();},{passive:false,capture:true});
 for(const type of ['gesturestart','gesturechange','gestureend'])
  window.addEventListener(type,e=>e.preventDefault(),{passive:false});
 window.addEventListener('keydown',e=>{
  const dir={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',w:'up',a:'left',s:'down',d:'right',W:'up',A:'left',S:'down',D:'right'}[e.key];
  if(dir){e.preventDefault();pressed[dir]=true;}
  if(e.key==='Shift')pressed.run=true;
  if(e.code==='Space'){e.preventDefault();pressed.handbrake=true;}
  if(e.key.toLowerCase()==='e'&&!e.repeat){e.preventDefault();toggleVehicle();}
  if(e.key.toLowerCase()==='f'&&!e.repeat){e.preventDefault();interactMission();}
  if(e.key.toLowerCase()==='m'&&!e.repeat){e.preventDefault();toggleBigMap();}
  if(e.key==='Escape'){$('fullmap').hidden=true;state.mapOpen=false;$('dialog').hidden=true;if(!pause.hidden)closePause();else openPause();}
 });
 window.addEventListener('keyup',e=>{
  const dir={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',w:'up',a:'left',s:'down',d:'right',W:'up',A:'left',S:'down',D:'right'}[e.key];
  if(dir){e.preventDefault();pressed[dir]=false;}
  if(e.key==='Shift')pressed.run=false;
  if(e.code==='Space')pressed.handbrake=false;
 });
 const stickPad=$('touch-stick'),stickKnob=$('stick-knob');
 const resetStick=()=>{stick.x=0;stick.y=0;stickKnob.style.transform='translate(0,0)';};
 const updateStick=e=>{
  const box=stickPad.getBoundingClientRect(),cx=box.left+box.width/2,cy=box.top+box.height/2,radius=box.width*.34;
  let dx=e.clientX-cx,dy=e.clientY-cy,len=Math.hypot(dx,dy);if(len>radius){dx*=radius/len;dy*=radius/len;len=radius;}
  stick.x=dx/radius;stick.y=dy/radius;stickKnob.style.transform=`translate(${dx}px,${dy}px)`;
 };
 stickPad.addEventListener('pointerdown',e=>{e.preventDefault();try{stickPad.setPointerCapture(e.pointerId);}catch(_){}updateStick(e);});
 stickPad.addEventListener('pointermove',e=>{if(stickPad.hasPointerCapture?.(e.pointerId))updateStick(e);});
 for(const name of ['pointerup','pointercancel','lostpointercapture'])stickPad.addEventListener(name,resetStick);
 const pause=$('pause-menu'),pauseButton=$('pause-toggle');
 const openPause=()=>{Object.keys(pressed).forEach(k=>pressed[k]=false);stick.x=0;stick.y=0;pause.hidden=false;pauseButton.setAttribute('aria-expanded','true');$('pause-details').textContent='MEZZO: '+$('vehicle').textContent+'  ·  CAMERA: '+$('camera-mode').textContent+'  ·  STRADE: '+$('road-count').textContent+'  ·  EDIFICI OSM: '+$('building-count').textContent+'  ·  PLACEHOLDER: '+$('inferred-count').textContent+'  ·  INCROCI: '+$('junction-count').textContent+'  ·  '+$('road-width-current').textContent+' unità';};
 const closePause=()=>{pause.hidden=true;pauseButton.setAttribute('aria-expanded','false');};
 pauseButton.addEventListener('click',()=>pause.hidden?openPause():closePause());
 $('pause-close').addEventListener('click',closePause);
 $('pause-missions').addEventListener('click',()=>{closePause();if($('mission-panel').hidden)$('mission-panel-toggle').click();});
 $('pause-map').addEventListener('click',()=>{closePause();toggleBigMap();});
 for(const [id,target] of [['pause-zoom-auto','zoom-auto'],['pause-zoom-in','zoom-in'],['pause-zoom-out','zoom-out'],['pause-reset','reset'],['pause-road-compare','road-width-compare']])$(id).addEventListener('click',()=>$(target).click());
 const orient=()=>{const rotate=$('rotate-screen');rotate.hidden=typeof matchMedia!=='function'||matchMedia('(orientation: landscape)').matches;};
 orient();window.addEventListener('orientationchange',orient);window.addEventListener('resize',orient);
 const lockLandscape=()=>{try{if(typeof screen!=='undefined'&&screen.orientation?.lock)screen.orientation.lock('landscape').catch(()=>{});}catch(_){}};
 for(const id of ['touch-stick','action','sprint'])$(id).addEventListener('pointerdown',lockLandscape,{once:true});
 document.querySelectorAll('[data-dir]').forEach(btn=>{
  const key=btn.dataset.dir;
  btn.addEventListener('pointerdown',e=>{e.preventDefault();pressed[key]=true;btn.classList.add('pressed');try{btn.setPointerCapture(e.pointerId);}catch(_){}});
  for(const name of ['pointerup','pointercancel','lostpointercapture'])btn.addEventListener(name,()=>{pressed[key]=false;btn.classList.remove('pressed');});
 });
 $('action').addEventListener('click',toggleVehicle);
 $('road-width-compare').addEventListener('click',compareRoadWidths);
 const panel=$('mission-panel'),panelButton=$('mission-panel-toggle');
 panelButton.addEventListener('click',()=>{
  panel.hidden=!panel.hidden;
  panelButton.setAttribute('aria-expanded',String(!panel.hidden));
  if(state.ready)refreshCampaign();
 });
 // Prevent accidental text highlight, image dragging and long-press callouts
 // in the game controls; leave normal text selection outside the game intact.
 document.addEventListener('selectstart',e=>{
  if(e.target.closest?.('.controls, .stage, .hud'))e.preventDefault();
 });
 document.addEventListener('dragstart',e=>{
  if(e.target.closest?.('.controls, .stage, .hud'))e.preventDefault();
 });
 document.addEventListener('contextmenu',e=>{
  if(e.target.closest?.('.dpad, .buttons, #mission-panel, #mission-panel-toggle'))e.preventDefault();
 });
 $('mission-interact').addEventListener('click',interactMission);
 $('map-toggle').addEventListener('click',toggleBigMap);
 $('map-close').addEventListener('click',toggleBigMap);
 $('dialog-close').addEventListener('click',()=>$('dialog').hidden=true);
 $('mission-reset').addEventListener('click',()=>{
  if(!state.progress)return;
  if(resetCurrentMission(state.progress)){
   saveProgress(localStorage,state.progress);
   message('Missione riavviata. Puoi ripartire dal primo obiettivo.','MISSIONE RIAVVIATA');
   refreshCampaign();
  }else{
   state.progress=freshProgress();saveProgress(localStorage,state.progress);
   message('Nuova partita iniziata!','NUOVA PARTITA');refreshCampaign();
  }
 });
 for(const [id,key] of [['brake','handbrake'],['sprint','run']]){
  const btn=$(id);if(!btn)continue;
  const activeKey=()=>id==='sprint'&&state.player.car>=0?'handbrake':key;
  btn.addEventListener('pointerdown',e=>{e.preventDefault();const k=activeKey();btn.dataset.activeKey=k;pressed[k]=true;btn.classList.add('pressed');try{btn.setPointerCapture(e.pointerId);}catch(_){}});
  const release=()=>{pressed[btn.dataset.activeKey||key]=false;btn.classList.remove('pressed');};
  for(const name of ['pointerup','pointercancel','lostpointercapture'])btn.addEventListener(name,release);
 }

 $('retry').addEventListener('click',load);
 $('zoom-in').addEventListener('click',()=>{state.zoomBias=clamp(state.zoomBias*1.17,.62,1.35);});
 $('zoom-out').addEventListener('click',()=>{state.zoomBias=clamp(state.zoomBias/1.17,.62,1.35);});
 $('zoom-auto').addEventListener('click',()=>{state.zoomBias=1;});
 $('reset').addEventListener('click',()=>{
  if(!state.ready)return;const p=state.player;p.car=-1;p.x=state.spawn[0];p.y=state.spawn[1];p.a=0;state.camera.x=p.x;state.camera.y=p.y;
  state.zoom=CAMERA_ZOOM_MAX;state.zoomBias=1;state.zoomTarget=CAMERA_ZOOM_MAX;updateHud();
 });
 window.addEventListener('blur',()=>{Object.keys(pressed).forEach(k=>pressed[k]=false);resetStick();});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){Object.keys(pressed).forEach(k=>pressed[k]=false);resetStick();}});
 canvas.addEventListener('wheel',e=>{e.preventDefault();
  state.zoomBias=clamp(state.zoomBias*(e.deltaY>0?.91:1.1),.62,1.35);
 },{passive:false});
}
bind();requestAnimationFrame(frame);load();
