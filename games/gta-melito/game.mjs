/* WORK HANDOFF / VISUAL REALISM:
 * Read ./AGENTS.md and ./HANDOFF_WORK_REALISMO.md before changing this game;
 * log completed visual improvements in ./VISUAL_PROGRESS.md.
 * Aim: identifiable Melito di Napoli in original top-down pixel art 2.5D.
 * Preserve OSM geometry, gameplay and camera controls. 
 */
import {visualRoadWidth,setRoadWidthMode,getRoadWidthMode} from './road-widths.mjs?v=043';
import {fetchOverpass,inside} from './osm.mjs';
import {buildRoadGraph,createAgents,stepAgents} from './roads.mjs?v=141';
import {createRoutineResidents} from './resident-routines.mjs?v=003';
import {NPC_START_MINUTE,advanceNpcClock,formatNpcClock} from './npc-agenda.mjs?v=001';
import {makeCollisionIndex,collidesWithTraffic,vehiclesOverlap,nearbyColliders} from './traffic-collision.mjs?v=125';
import {buildStreetProps,drawArchitecture,drawStreets,drawCrosswalks,drawStreetProps,drawPoiSigns} from './visuals.mjs?v=090';
import {STORY,readProgress,saveProgress,freshProgress,resolveLandmarks,currentStep,activeTarget,isNear,doInteraction,updateTimer,resetCurrentMission} from './campaign.mjs';
import {drawWorldLandmarks,drawMinimapLandmarks,drawBigMap} from './landmark-art.mjs?v=089';
import {prepareCityStyles,applyApprovedArcadeRoofStyle,applyPiazzaRoofStudies,prepareUrbanGround,drawTerrain,drawCityParcels,drawCityStreets,drawCityBuildings,drawCityPeople,drawCityCar,drawCityPlayer,loadChurchWebp} from './city-art.mjs?v=125';
import {loadCarSprites,drawCarSprite,CAR_TRAFFIC_SPRITE_IDS} from './car-sprites.mjs?v=106';
import {loadPedestrianSprites} from './pedestrian-sprites.mjs?v=001';
import {loadExtraPedestrianSprites} from './extra-pedestrian-sprites.mjs?v=001';
import {prepareStorefronts,drawStorefronts} from './storefronts.mjs?v=043';
import {applySurveyDrafts} from './survey/visual-profiles.mjs?v=045';
import {generateUrbanInfill,INFILL_VERSION,mapFingerprint} from './urban-infill.mjs?v=116';
import {CAMERA_ZOOM_MAX,targetCameraZoom,advanceCameraZoom,describeCameraZoom,vehicleCameraTarget} from './camera-zoom.mjs?v=100';
import {WALK_SPEED,RUN_SPEED,stepDriving} from './driving-controls.mjs?v=095';
import {MOTORCYCLE_IDS,isMotorcycle,loadMotorcycleSprites,drawMotorcycle,stepMotorcycle,chooseMotorcycleDismount} from './motorcycles.mjs?v=003';
import {nearestEnterableVehicle,starterMotorcycleCandidates} from './vehicle-entry.mjs?v=001';
import {PARKED_BIKE_TARGET,PARKED_VEHICLE_CAP,PARKED_CAR_PHASE_CAP,motorcycleParkingRoadOrder,motorcycleParkingCandidates,parkedBikeLabel} from './motorcycle-parking.mjs?v=001';
import {guideCar} from './driving-assist.mjs?v=099';
import {buildTurnGuides,guideIntersection} from './intersection-assist.mjs?v=097';
import {reboundCar,advanceRecoil} from './car-rebound.mjs?v=098';
import {canDriveProbe} from './road-clearance.mjs?v=099';
import {roofRevealTarget,easeRoofReveal,traceRoofCover} from './roof-reveal.mjs?v=120';
import {resolveBankEntrances,nearestBankEntrance,drawBankEntrance,drawBankInterior,stepBankInteriorPlayer,bankInteriorCamera,BANK_FOOT_ZOOM_MULTIPLIER} from './bank-interior.mjs?v=003';
import {applyNonlethalImpact,advanceNonlethalImpact,sweptVehicleContact,slowImpactSource,IMPACT_MIN_SPEED} from './impact-physics.mjs?v=001';
import {WHEEL_MAX_ANGLE,pointerWheelAngle,turnSteeringWheel,steeringInput,returnSteeringWheel} from './steering-wheel.mjs?v=001';
import {SIDEWALK_DRIVE,SIDEWALK_OUTER} from './sidewalk.mjs?v=099';
import {placeBuildings} from './building-placement.mjs?v=123';
import {createCarRadio} from './car-radio.mjs?v=001';
const $=id=>document.getElementById(id);
function updateCarRadioUi({inVehicle,status,station,enabled}){
 const panel=$('car-radio');
 panel.hidden=!inVehicle;
 $('radio-name').textContent=station.name;
 $('radio-official').href=station.site;
 const messages={off:'RADIO SPENTA',connecting:'CONNESSIONE…',live:'IN DIRETTA',tap:'TOCCA ▶ PER ASCOLTARE',unavailable:'STREAM NON DISPONIBILE · ↗'};
 $('radio-status').textContent=messages[status]||'PROVA RADIO';
 const button=$('radio-toggle');
 button.textContent=enabled&&(status==='live'||status==='connecting')?'■':'▶';
 button.setAttribute('aria-pressed',String(enabled&&status!=='off'));
 button.setAttribute('aria-label',enabled&&(status==='live'||status==='connecting')?'Spegni radio':'Avvia o riprova radio');
}
const carRadio=createCarRadio({storage:globalThis.localStorage,onChange:updateCarRadioUi});
const canvas=$('world'),c=canvas.getContext('2d',{alpha:false});
const STATIC_TILE=96,TILE_PIXELS=4,TILE_BLEED=20;
const staticTiles=new Map();
const roofReveal=new Map();
let tileRoadMode=null,pendingTile=null;
const radar=$('radar'),r=radar.getContext('2d');
const pressed={up:false,down:false,left:false,right:false,run:false,handbrake:false,accelerate:false,brake:false,reverse:false};
const stick={x:0,y:0};
function moveAxes(){return {x:Math.abs(stick.x)>.08?stick.x:Number(pressed.right)-Number(pressed.left),y:Math.abs(stick.y)>.08?stick.y:Number(pressed.down)-Number(pressed.up)};}
const wheel={angle:0,held:false,pointerId:null,pointerAngle:0};
function driveAxes(){
 const keys=Number(pressed.right)-Number(pressed.left);
 const forward=pressed.accelerate||pressed.up;
 const reverse=pressed.reverse||pressed.down;
 // Opposing pedals neutralize one another. The physical service brake
 // overrides either direction in stepDriving/stepMotorcycle.
 return {x:keys||steeringInput(wheel.angle),
  y:forward===reverse?0:reverse?1:-1};
}
function resetDrivingControls(){
 pressed.accelerate=false;pressed.brake=false;pressed.reverse=false;
 for(const id of ['accelerator','brake','reverse'])$(id)?.classList.remove('pressed');
 wheel.angle=0;wheel.held=false;wheel.pointerId=null;
 const face=$('steering-face');if(face)face.style.transform='rotate(0rad)';
}
function animateSteeringWheel(dt){
 if(!wheel.held){
  const keys=Number(pressed.right)-Number(pressed.left);
  wheel.angle=keys?wheel.angle+(keys*WHEEL_MAX_ANGLE*.7-wheel.angle)*Math.min(1,dt*9):
   returnSteeringWheel(wheel.angle,dt);
 }
 const face=$('steering-face');
 if(face)face.style.transform='rotate('+wheel.angle+'rad)';
}
const state={map:null,roads:null,buildings:null,roadGrid:null,buildingGrid:null,cars:[],traffic:[],people:[],dynamicCollision:null,trafficClock:0,npcClockMinutes:NPC_START_MINUTE,player:{x:0,y:0,a:0,car:-1},spawn:[0,0],zoom:CAMERA_ZOOM_MAX,zoomBias:1,zoomTarget:CAMERA_ZOOM_MAX,clock:0,last:0,hud:0,ready:false,loading:false,mapCanvas:null,graph:null,turnGuides:[],props:[],propsGrid:null,camera:{x:0,y:0},distance:0,shops:[],shopGrid:null,bankEntrances:[],bankInterior:null,ground:null,inferredBuildings:[],inferredGrid:null,infillStats:null,landmarks:new Map(),progress:null,lastSave:0,bannerTimeout:0,mapOpen:false};
const CELL=140,DRIVE=new Set(['motorway','trunk','primary','secondary','tertiary','unclassified','residential','living_street','service','track']);
const WALK=new Set([...DRIVE,'pedestrian','footway','path','steps']);
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
 return [...out].map(i=>items[i]).filter(item=>{
  const b=item.bounds;
  return b&&b[0]<=x1&&b[2]>=x0&&b[1]<=y1&&b[3]>=y0;
 });
}
function nearest(x,y,max=24,roads=state.roads,driveOnly=false,walkOnly=false){
 let best=null,dd=max*max;
 for(const road of query(roads,state.roadGrid,x-max,y-max,x+max,y+max)){
  if((driveOnly&&!DRIVE.has(road.t))||(walkOnly&&!WALK.has(road.t)))continue;
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
function createCityPedestrians(){
 const border=toRing(state.map.border);
 const residents=createRoutineResidents(state.graph,10,405,
  {x:state.spawn[0],y:state.spawn[1]},[...state.cars,...state.traffic],
  (x,y)=>validWalk(x,y)&&inside([x,y],border));
 const walkers=createAgents(state.graph,170-residents.length,310,'walk',
  [...state.cars,...state.traffic,...residents]);
 return [...residents,...walkers];
}
function prepareMap(map,surveyData=[],infillCache=null,placement=null){
 if(!map||!Array.isArray(map.roads)||map.roads.length<20||!Array.isArray(map.border))throw Error('La mappa salvata non contiene una rete stradale valida');
 staticTiles.clear();roofReveal.clear();tileRoadMode=null;
 state.map=map;
 state.roads=map.roads;state.buildings=placeBuildings(map,placement);
 prepareCityStyles(state.buildings,map.pois||[]);
 const survey=applySurveyDrafts(state.buildings,surveyData);
 const terracotta=applyApprovedArcadeRoofStyle(state.buildings);
 applyPiazzaRoofStudies(state.buildings);
 console.info('Melito visual city scan: '+survey.applied+'/'+survey.total+' buildings styled, '+survey.verified+' photo-verified');
 console.info('Approved arcade roof style: '+terracotta+' unverified stylistic drafts in terracotta; no photo status changed');
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
 const facade=['#e6bb7b','#edca92','#dfab67','#f0d59e','#d89c63','#e8b879'];
 const roof=['#dc7138','#e18443','#c85c2e','#df793c','#d76631'];
 for(const b of state.inferredBuildings){
  const h=hash(Math.abs(b.id)),a=b.art;
  a.inferred=true;a.facadeTint=facade[h%facade.length];a.roofTint=roof[(h>>>5)%roof.length];
  a.renderHeight=b.h;
  // Inferred urban apartment blocks mostly have terraces; roof form is a
  // stylistic estimate, kept separate from the photo-verified church override.
  a.roof=b.p.length<=10&&h%4!==0;
 }
 state.ground=prepareUrbanGround([...state.buildings,...state.inferredBuildings],state.roads);
 state.roadGrid=makeIndex(state.roads);state.buildingGrid=makeIndex(state.buildings);
 state.inferredGrid=makeIndex(state.inferredBuildings);
 state.bankEntrances=resolveBankEntrances(map.pois||[],state.roads,
  (x,y)=>validWalk(x,y)&&inside([x,y],toRing(state.map.border)),visualRoadWidth);
 const possible=state.roads.filter(q=>DRIVE.has(q.t)&&q.p.length>=4);
 if(!possible.length)throw Error('Non risultano strade percorribili in auto');
 const center=[map.projection.width/2,map.projection.height/2];
 const viaRoma=possible.filter(q=>/\bvia roma\b/i.test(q.n));
 const candidates=viaRoma.length?viaRoma:possible.filter(q=>q.n&&arcLength(q.p)>55);
 const pool=candidates.length?candidates:possible;
 const chosen=pool.map(q=>({q,p:roadPoint(q,.5)})).sort((a,b)=>Math.hypot(a.p.x-center[0],a.p.y-center[1])-Math.hypot(b.p.x-center[0],b.p.y-center[1]))[0];
 const point=chosen.p;
 state.zoom=CAMERA_ZOOM_MAX;state.zoomTarget=CAMERA_ZOOM_MAX;state.zoomBias=1;
 state.spawn=[point.x,point.y];Object.assign(state.player,{x:point.x,y:point.y,a:point.a,car:-1,vehicleType:null});
 state.camera.x=point.x;state.camera.y=point.y;state.distance=0;
 state.graph=buildRoadGraph(state.roads);
 state.turnGuides=buildTurnGuides(state.graph);
 state.props=buildStreetProps(state.roads).filter(obj=>!buildingAt(obj.x,obj.y));
 state.propsGrid=makeIndex(state.props);
 state.shops=prepareStorefronts(map.pois||[],state.roads);
 state.shopGrid=makeIndex(state.shops);
 initCampaign(map);
 state.dynamicCollision=null;
 const starterShoulder=Math.max(4.1,visualRoadWidth(chosen.q)/2+2.2);
 const nearCar=[1,-1].map(side=>({
  x:point.x+Math.cos(point.a)*3-Math.sin(point.a)*starterShoulder*side,
  y:point.y+Math.sin(point.a)*3+Math.cos(point.a)*starterShoulder*side,
  a:point.a,speed:0,type:0,model:'panda-modern-white'
 })).find(car=>Math.hypot(car.x-point.x,car.y-point.y)<10.8&&!carBlocked(car.x,car.y,car.a,-1))||
  {x:point.x+Math.cos(point.a)*9,y:point.y+Math.sin(point.a)*9,a:point.a,speed:0,type:0,model:'panda-modern-white'};
 state.cars=[nearCar];
 // Offer one scooter close to the starter Panda, only if the opposite curb
 // has clearance from OSM walls and other vehicles.
 // The original scooter spawned outside the actual boarding radius.
 // Search near the start first, on the opposite side of the parked Panda.
 const starterBike=starterMotorcycleCandidates(point,nearCar,visualRoadWidth(chosen.q))
  .map(({x,y,a})=>({x,y,a,speed:0,type:0,model:MOTORCYCLE_IDS[0],vehicleType:'motorcycle'}))
  .find(bike=>!carBlocked(bike.x,bike.y,bike.a,-1,bike)&&
    state.cars.every(v=>!vehiclesOverlap(bike,v)));
 if(starterBike)state.cars.push(starterBike);
 // Separate two-wheel parking pass; OSM road candidates remain subject to
 // all road/building and existing parked-vehicle collision validations.
 let parkedBikeCount=state.cars.filter(isMotorcycle).length;
 const bikeRoads=motorcycleParkingRoadOrder(possible,point,roadPoint,arcLength,rnd);
 for(const road of bikeRoads){
  if(parkedBikeCount>=PARKED_BIKE_TARGET||state.cars.length>=PARKED_VEHICLE_CAP)break;
  const options=motorcycleParkingCandidates(road,roadPoint,visualRoadWidth(road),rnd);
  for(const at of options){
   if(Math.hypot(at.x-point.x,at.y-point.y)<9)continue;
   const bike={x:at.x,y:at.y,a:at.a,speed:0,type:0,
    model:MOTORCYCLE_IDS[Math.floor(rnd(road.id+parkedBikeCount*31+819)*MOTORCYCLE_IDS.length)],
    vehicleType:'motorcycle',rider:false};
   if(carBlocked(bike.x,bike.y,bike.a,-1,bike)||
     state.cars.some(other=>vehiclesOverlap(bike,other)))continue;
   state.cars.push(bike);parkedBikeCount++;break;
  }
 }
 let k=0;
 for(const road of possible){
  if(arcLength(road.p)<25||rnd(road.id)%1>.33)continue;
  const pt=roadPoint(road,.2+rnd(road.id+11)*.6);
  if(Math.hypot(pt.x-point.x,pt.y-point.y)<19)continue;
  // The old parked cars occupied the road centreline and blocked the AI lane.
  // Try either curb, then keep only poses that are drivable and clear of walls.
  const shoulder=Math.max(4.1,visualRoadWidth(road)/2+2.2);
  const first=rnd(road.id+29)<.5?1:-1;
  const parked=[first,-first].map(side=>({
   x:pt.x-Math.sin(pt.a)*shoulder*side,y:pt.y+Math.cos(pt.a)*shoulder*side,
   a:pt.a,speed:0,type:k%5,vehicleType:k%3===1?'motorcycle':'car',model:k%3===1?MOTORCYCLE_IDS[(k+Math.floor(k/3)*5)%MOTORCYCLE_IDS.length]:k%8===1?'panda-fire-red':CAR_TRAFFIC_SPRITE_IDS[(k*7)%CAR_TRAFFIC_SPRITE_IDS.length]
  })).find(car=>!carBlocked(car.x,car.y,car.a,-1)&&!state.cars.some(other=>vehiclesOverlap(car,other)));
  if(!parked)continue;
  state.cars.push(parked);k++;
  if(state.cars.length>=Math.min(PARKED_VEHICLE_CAP,PARKED_CAR_PHASE_CAP+parkedBikeCount))break;
 }
 state.traffic=createAgents(state.graph,140,189,'car',state.cars,{motorcycleEvery:4});
 state.traffic.forEach((v,i)=>{const bike=isMotorcycle(v);v.model=bike?MOTORCYCLE_IDS[(i+Math.floor(i/4)*5)%MOTORCYCLE_IDS.length]:CAR_TRAFFIC_SPRITE_IDS[(i*7)%CAR_TRAFFIC_SPRITE_IDS.length];v.rider=bike;});
 state.people=createCityPedestrians();
 state.dynamicCollision=makeCollisionIndex([...state.cars,...state.traffic,...state.people]);state.trafficClock=0;state.npcClockMinutes=NPC_START_MINUTE;
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

function canKnockbackMove(x,y){
 return validWalk(x,y)&&inside([x,y],toRing(state.map.border));
}
function impactTraffic(dt){
 // The index limits contacts to adjacent street cells; no quadratic scan
 // over Melito's pedestrians. Include parked cars and player on foot.
 const p=state.player;
 const actors=[...state.people,...state.traffic,...state.cars,...(p.car<0?[p]:[])];
 const nearby=makeCollisionIndex(actors);
 const active=[...state.traffic,...(p.car>=0?[state.cars[p.car]]:[])];
 for(const source of active){
  if(source.impactTime>0)continue;
  const isPlayerCar=p.car>=0&&source===state.cars[p.car];
  const from={x:source.prevX??source.x,y:source.prevY??source.y,a:source.prevA??source.a};
  const attempt=isPlayerCar?source.impactProbe:null;
  const to=attempt||{x:source.x,y:source.y,a:source.a};
  const moved=Math.hypot(source.x-from.x,source.y-from.y);
  const estimated=source.braking?Math.min((source.speed||0)*dt,1.5):0;
  // A blocked AI car can still make contact with a person standing in its
  // intended next position; do not require the AI to clip through them.
  if(!isPlayerCar&&moved<.1&&estimated>.1){
   to.x=source.x+Math.cos(source.a)*estimated;
   to.y=source.y+Math.sin(source.a)*estimated;
  }
  const projected=Math.hypot(to.x-from.x,to.y-from.y);
  const speed=isPlayerCar?Math.abs(attempt?.speed??source.speed??0):
   Math.max(moved/Math.max(.01,dt),source.braking?Math.min(12,source.speed||0):0);
  if(speed<IMPACT_MIN_SPEED)continue;
  const cx=(from.x+to.x)/2,cy=(from.y+to.y)/2;
  let hits=0;
  for(const target of nearbyColliders(nearby,cx,cy,Math.min(50,11+projected))){
   if(target===source||target.impactLock>0||
      (target===p&&p.car>=0)||
      (isPlayerCar&&target===p))continue;
   if(!sweptVehicleContact(source,target,from,to))continue;
   const hit=applyNonlethalImpact({...source,speed},target,speed);
   if(!hit)continue;
   if(isPlayerCar)slowImpactSource(source,speed);
   if(++hits>=3)break;
  }
  if(isPlayerCar)source.impactProbe=null;
 }
}
function updateTraffic(dt){
 state.trafficClock+=dt;
 if(state.trafficClock<.05)return;
 const elapsed=.05;state.trafficClock-=elapsed;
 for(const agent of [...state.people,...state.traffic]){
  agent.prevX=agent.x;agent.prevY=agent.y;agent.prevA=agent.a;
  advanceNonlethalImpact(agent,elapsed,canKnockbackMove);
 }
 const halfW=canvas.clientWidth/(2*state.zoom),halfH=canvas.clientHeight/(2*state.zoom);
 const view=[state.camera.x-halfW,state.camera.y-halfH,state.camera.x+halfW,state.camera.y+halfH];
 stepAgents(state.graph,state.people,elapsed,state.player,{parked:state.cars,traffic:state.traffic,view,validRecovery:canKnockbackMove,npcClockMinutes:state.npcClockMinutes});
 stepAgents(state.graph,state.traffic,elapsed,state.player,{parked:state.cars,people:state.people,view,validRecovery:canKnockbackMove,npcClockMinutes:state.npcClockMinutes});
 impactTraffic(elapsed);
 for(const agent of [...state.people,...state.traffic])if(Math.hypot(agent.x-agent.prevX,agent.y-agent.prevY)>15){
  agent.prevX=agent.x;agent.prevY=agent.y;agent.prevA=agent.a;
 }
 state.dynamicCollision=makeCollisionIndex([...state.cars,...state.traffic,...state.people]);
}
function interiorZoom(){
 return targetCameraZoom({inVehicle:false,moving:false},state.zoomBias)*BANK_FOOT_ZOOM_MULTIPLIER;
}
function toggleVehicle(){
 if(!state.ready)return;
 const p=state.player;
 if(state.bankInterior){
  const interior=state.bankInterior;state.bankInterior=null;
  p.x=interior.outside.x;p.y=interior.outside.y;p.a=interior.outside.a;
  state.camera.x=p.x;state.camera.y=p.y;updateHud();return;
 }
 if(p.car<0){
  const entrance=nearestBankEntrance(state.bankEntrances,p);
  if(entrance){
   const local={x:.5,y:.89,a:-Math.PI/2,moving:false};
    state.bankInterior={bank:entrance.bank,outside:{x:p.x,y:p.y,a:p.a},player:local,
     camera:bankInteriorCamera(local,canvas.clientWidth,canvas.clientHeight,interiorZoom())};
   for(const key of Object.keys(pressed))pressed[key]=false;stick.x=0;stick.y=0;resetDrivingControls();
   updateHud();return;
  }
 }
 if(p.car>=0){
  const vehicle=state.cars[p.car],bike=isMotorcycle(vehicle);
  if(bike&&Math.abs(vehicle.speed||0)>2.3){
   $('street').textContent='FERMATI PRIMA DI SCENDERE DALLA MOTO';return;
  }
  const blocked=(x,y)=>!!(state.dynamicCollision&&
   collidesWithTraffic({x,y,a:p.a},'walk',state.dynamicCollision,vehicle));
  const exit=bike?chooseMotorcycleDismount(vehicle,validWalk,blocked):
   [{x:vehicle.x-Math.sin(vehicle.a)*3.8,y:vehicle.y+Math.cos(vehicle.a)*3.8},
    {x:vehicle.x+Math.sin(vehicle.a)*3.8,y:vehicle.y-Math.cos(vehicle.a)*3.8}]
    .find(q=>validWalk(q.x,q.y)&&!blocked(q.x,q.y));
  if(!exit){$('street').textContent='NESSUNO SPAZIO LIBERO PER SCENDERE';return;}
  vehicle.turnGuide=null;vehicle.recoil=0;vehicle.speed=0;
  p.x=exit.x;p.y=exit.y;p.car=-1;p.vehicleType=null;
  carRadio.leaveVehicle();
  p.impactTime=0;p.impactVX=0;p.impactVY=0;p.impactLock=0;
 }else{
  // Same targeted vehicle for keyboard E and the touch/HUD label.
  const target=nearestEnterableVehicle(state.cars,p);
  if(target){
   p.car=target.index;p.a=target.vehicle.a;
   p.vehicleType=target.bike?'motorcycle':'car';
   p.impactTime=0;p.impactVX=0;p.impactVY=0;p.impactLock=0;
   p.x=target.vehicle.x;p.y=target.vehicle.y;
   if(!target.bike)carRadio.enterVehicle();
   else carRadio.leaveVehicle();
  }else{$('street').textContent='AVVICINATI A UN VEICOLO PER SALIRE';}
 }
 // Touch stick belongs only to walking; never carry an offset into driving.
 stick.x=0;stick.y=0;
 $('stick-knob').style.transform='translate(0,0)';
 resetDrivingControls();updateHud();
}
function carBlocked(x,y,a,which,vehicle=state.cars[which]){
 // Both classes stay within the OSM road; scooters use narrow side probes.
 const dirx=Math.cos(a),diry=Math.sin(a),bike=isMotorcycle(vehicle);
 const forwards=bike?[-2.25,0,2.25]:[-2.6,0,3.4];
 const sides=bike?[-.85,.85]:[-1.7,1.7];
 for(const forward of forwards)for(const side of sides){
  const px=x+dirx*forward-diry*side,py=y+diry*forward+dirx*side;
  if(!inside([px,py],toRing(state.map.border)))return true;
  const road=nearest(px,py,25,state.roads,true);
  const width=road?visualRoadWidth(road.road):0;
  if(!road||road.distance>width/2+SIDEWALK_DRIVE||!canDriveProbe(road.distance,width,
   road.distance>width/2-.55&&buildingAt(px,py)))return true;
 }
 return !!(state.dynamicCollision&&collidesWithTraffic(
  {x,y,a,vehicleType:bike?'motorcycle':'car'},'car',state.dynamicCollision,vehicle));
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
 // Q02: in banca gli NPC non vengono simulati, quindi anche il loro orologio resta fermo.
 state.npcClockMinutes=advanceNpcClock(state.npcClockMinutes,dt,{interior:!!state.bankInterior});
 animateSteeringWheel(dt);
 if(state.bankInterior){
  const axes=moveAxes(),local=state.bankInterior.player;
  stepBankInteriorPlayer(local,axes,pressed.run,dt);
  state.bankInterior.camera=bankInteriorCamera(local,canvas.clientWidth,canvas.clientHeight,
   interiorZoom(),state.bankInterior.camera,dt);
  state.clock+=dt;state.hud+=dt;
  if(state.hud>.18){state.hud=0;updateHud();}
  return;
 }
 const p=state.player;
 if(p.car>=0){
  const car=state.cars[p.car];
  const axes=driveAxes();
  car.prevX=car.x;car.prevY=car.y;car.prevA=car.a;
  if(car.impactTime>0){
   advanceNonlethalImpact(car,dt,canKnockbackMove);
   car.speed=0;car.recoil=0;
   car.impactProbe=null;
   p.x=car.x;p.y=car.y;p.a=car.a;
  }else{
  const previousAngle=car.a;
  let speed,angle;
  if(car.recoil>0){
   const rebound=advanceRecoil(car.speed,car.recoil,dt);
   speed=rebound.speed;car.recoil=rebound.recoil;angle=car.a;
  }else{
   advanceNonlethalImpact(car,dt,canKnockbackMove);
   ({speed,angle}=(isMotorcycle(car)?stepMotorcycle:stepDriving)(car.speed||0,car.a,axes,pressed.handbrake,dt,pressed.brake));
   const road=nearest(car.x,car.y,25,state.roads,true);
   const turn=guideIntersection({x:car.x,y:car.y,angle,speed},axes.x,road,
    state.graph,state.turnGuides,car.turnGuide||null,dt);
   car.turnGuide=turn.turn;
   if(turn.turn){angle=turn.angle;speed=turn.speed;car.assistRelease=.35;}
   else{
    const guided=guideCar(angle,car.x,car.y,speed,axes.x,
     road?{...road,width:visualRoadWidth(road.road)}:null,car.assistRelease||0,dt);
    angle=guided.angle;car.assistRelease=guided.release;
   }
  }
  car.a=angle;
  const nx=car.x+Math.cos(car.a)*speed*dt,ny=car.y+Math.sin(car.a)*speed*dt;
  car.impactProbe={x:nx,y:ny,a:car.a,speed};
  // Trigger the shunt BEFORE the usual safe-street bounce stops the car.
  // This also catches high-speed approaches where the NPC never occupies
  // the player's vehicle centre because the collision guard intervenes.
  const touched=state.dynamicCollision&&collidesWithTraffic(
   {x:nx,y:ny,a:car.a,vehicleType:isMotorcycle(car)?'motorcycle':'car'},
   'car',state.dynamicCollision,car);
  if(touched&&Math.abs(speed)>=IMPACT_MIN_SPEED)
   if(applyNonlethalImpact({...car,speed},touched,Math.abs(speed)))
    speed*=.65;
  if(!carBlocked(nx,ny,car.a,p.car)){
   car.x=nx;car.y=ny;state.distance+=Math.abs(speed*dt);
  }else if(car.recoil>0){speed=0;car.recoil=0;car.turnGuide=null;}
  else{
   const bounce=reboundCar(car,speed,previousAngle,(x,y,a)=>carBlocked(x,y,a,p.car));
   car.x=bounce.x;car.y=bounce.y;car.a=bounce.angle;
   speed=bounce.speed;car.recoil=bounce.recoil;car.turnGuide=null;car.assistRelease=.25;
  }
  car.speed=speed;p.x=car.x;p.y=car.y;p.a=car.a;
  }
 }else{
  const axis=moveAxes(),dx=axis.x,dy=axis.y;
  if(!(p.impactTime>0))advanceNonlethalImpact(p,dt,canKnockbackMove);
  if(p.impactTime>0){
   advanceNonlethalImpact(p,dt,canKnockbackMove);
  }else if(Math.hypot(dx,dy)>.08){
   const len=Math.hypot(dx,dy),v=(pressed.run?RUN_SPEED:WALK_SPEED)*Math.min(1,len),nx=p.x+dx/len*v*dt,ny=p.y+dy/len*v*dt;
   if(validWalk(nx,p.y)&&inside([nx,p.y],toRing(state.map.border)))p.x=nx;
   if(validWalk(p.x,ny)&&inside([p.x,ny],toRing(state.map.border)))p.y=ny;
   p.a=Math.atan2(dy,dx);state.distance+=v*dt;
  }
 }
 // Parked vehicles can be shoved by faster vehicles but cannot disappear.
 for(const car of state.cars)if(car!==state.cars[p.car])
  advanceNonlethalImpact(car,dt,canKnockbackMove);
 updateTraffic(dt);
 if(state.progress){
  const result=updateTimer(state.progress,dt);
  if(result){message(result.message,'TEMPO SCADUTO');saveProgress(localStorage,state.progress);refreshCampaign();}
  state.lastSave+=dt;
  if(state.lastSave>4){state.lastSave=0;saveProgress(localStorage,state.progress);}
 }
 const axis=moveAxes(),moving=Math.hypot(axis.x,axis.y)>.08;
 const movement={inVehicle:p.car>=0,
  speed:p.car>=0?Math.abs(state.cars[p.car].speed):moving?(pressed.run?RUN_SPEED:WALK_SPEED):0,
  running:pressed.run,moving:!!moving};
 state.zoomTarget=targetCameraZoom(movement,state.zoomBias);
 state.zoom=advanceCameraZoom(state.zoom,state.zoomTarget,dt);
 const target=p.car>=0
  ?vehicleCameraTarget(state.cars[p.car],$('world').clientWidth,$('world').clientHeight,state.zoom)
  :{x:p.x,y:p.y};
 const targetX=target.x,targetY=target.y;
 const follow=1-Math.exp(-(p.car>=0?3:6)*dt);
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
 state.traffic=createAgents(state.graph,140,189,'car',state.cars,{motorcycleEvery:4});
 state.traffic.forEach((v,i)=>{const bike=isMotorcycle(v);v.model=bike?MOTORCYCLE_IDS[(i+Math.floor(i/4)*5)%MOTORCYCLE_IDS.length]:CAR_TRAFFIC_SPRITE_IDS[(i*7)%CAR_TRAFFIC_SPRITE_IDS.length];v.rider=bike;});
 state.people=createCityPedestrians();
 state.dynamicCollision=makeCollisionIndex([...state.cars,...state.traffic,...state.people]);state.trafficClock=0;
 state.props=buildStreetProps(state.roads).filter(obj=>!buildingAt(obj.x,obj.y));
 state.propsGrid=makeIndex(state.props);
 state.shops=prepareStorefronts(state.map.pois||[],state.roads);
 state.shopGrid=makeIndex(state.shops);
 updateRoadWidthLabel();
 roofReveal.clear();
}

function updateHud(){
 const npcClockLabel=$('npc-clock');if(npcClockLabel)npcClockLabel.textContent=formatNpcClock(state.npcClockMinutes);
 const p=state.player;
 const driving=p.car>=0&&!state.bankInterior;
 // The map container must receive the mode class: otherwise CSS keeps the
 // walking joystick visible even though driveAxes no longer reads it.
 const stage=$('stage')||document.querySelector?.('.stage');
 stage?.classList.toggle('interior',!!state.bankInterior);
 stage?.classList.toggle('driving',driving);
 document.querySelector?.('.controls')?.classList.toggle('driving',driving);
 if(state.bankInterior){
  $('vehicle').textContent='ALL’INTERNO DELLA BANCA';$('street').textContent=state.bankInterior.bank.n.toUpperCase();
  $('action').textContent='ESCI DALLA BANCA';$('sprint').textContent='CORRI';$('sprint').setAttribute('aria-label','Corri');
  $('camera-mode').textContent='INTERNO · '+interiorZoom().toFixed(1)+'×';return;
 }
 $('vehicle').textContent=p.car>=0?(isMotorcycle(state.cars[p.car])?'MOTO · ':'AUTO · ')+Math.round(Math.abs(state.cars[p.car].speed)*3.6)+' KM/H':'A PIEDI';
 const n=state.roadGrid?nearest(p.x,p.y,70):null;
 if(n&&n.road.n)$('street').textContent=n.road.n.toUpperCase();
 else if(n)$('street').textContent='STRADA SENZA NOME · OSM';
 const bank= p.car<0?nearestBankEntrance(state.bankEntrances,p):null;
 $('action').textContent=bank?'ENTRA IN BANCA':p.car>=0?'SCENDI':nearestEnterableVehicle(state.cars,p)?.bike?'SALTA IN SELLA':'ENTRA IN AUTO';
 $('sprint').textContent='CORRI';
 $('sprint').setAttribute('aria-label','Corri');
 const axis=moveAxes(),moving=Math.hypot(axis.x,axis.y)>.08;
 const status={inVehicle:p.car>=0,
  speed:p.car>=0?Math.abs(state.cars[p.car].speed):moving?(pressed.run?RUN_SPEED:WALK_SPEED):0,
  running:pressed.run,moving:!!moving};
 $('camera-mode').textContent=describeCameraZoom(status)+' · '+state.zoom.toFixed(1)+'×';
}
function drawLine(p){c.beginPath();c.moveTo(p[0],p[1]);for(let i=2;i<p.length;i+=2)c.lineTo(p[i],p[i+1]);}
function poly(p){drawLine(p);c.closePath();}
function drawCar(x,y,a,type,drive=false,model=null,vehicle=null){
 if(isMotorcycle(vehicle)){
  drawMotorcycle(c,x,y,a,model,{rider:drive||!!vehicle.rider,focused:drive,
   jacket:drive?'#b7343b':vehicle.kind%3===0?'#406b87':'#86896e'});
  return;
 }
 if(!drawCarSprite(c,x,y,a,model,drive))drawCityCar(c,x,y,a,type,drive,state.clock);
}
function drawParkedMotorcycleHints(){
 // Only near the walking player: avoid labeling the entire street scene.
 if(state.player.car>=0||state.zoom<3)return;
 const p=state.player;
 const nearby=state.cars.filter(v=>isMotorcycle(v)&&!v.rider&&
  Math.hypot(v.x-p.x,v.y-p.y)<19)
  .sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y)).slice(0,2);
 if(!nearby.length)return;
 c.save();c.font='bold 2.15px monospace';c.textAlign='center';
 const selectable=nearestEnterableVehicle(state.cars,p)?.vehicle;
 for(const v of nearby){
  const label=parkedBikeLabel(v);
  if(!label)continue;
  // E is offered only for the same bike selected by the touch button.
  const text=label+(selectable===v?' · E':''),width=text.length*1.35+2.2;
  c.fillStyle='#182725e8';c.fillRect(v.x-width/2,v.y-8.9,width,3.25);
  c.strokeStyle='#ecd18e';c.lineWidth=.17;c.strokeRect(v.x-width/2,v.y-8.9,width,3.25);
  c.fillStyle='#ffe6a7';c.fillText(text,v.x,v.y-6.55);
 }
 c.restore();
}
function drawPlayer(){
 const axis=moveAxes(),moving=Math.hypot(axis.x,axis.y)>.08;
 drawCityPlayer(c,state.player,state.clock,moving||state.player.impactTime>0);
}
function visibleBounds(){
 // Reserve space for sprites and road labels just outside the screen. A large
 // generic radius needlessly painted pedestrians across several blocks.
 const x=state.camera.x,y=state.camera.y,pad=18;
 return [x-canvas.clientWidth/(2*state.zoom)-pad,y-canvas.clientHeight/(2*state.zoom)-pad,x+canvas.clientWidth/(2*state.zoom)+pad,y+canvas.clientHeight/(2*state.zoom)+pad];
}
function paintStaticScene(ctx,bounds,zoom){
 const [x0,y0,x1,y1]=bounds,border=state.map.border;
 ctx.beginPath();ctx.moveTo(border[0],border[1]);
 for(let i=2;i<border.length;i+=2)ctx.lineTo(border[i],border[i+1]);
 ctx.closePath();ctx.fillStyle='#988f81';ctx.fill();
 ctx.lineWidth=10;ctx.strokeStyle='#9e998a';ctx.stroke();
 if(zoom>=1.05){
  ctx.save();ctx.beginPath();ctx.moveTo(border[0],border[1]);
  for(let i=2;i<border.length;i+=2)ctx.lineTo(border[i],border[i+1]);
  ctx.closePath();ctx.clip();drawTerrain(ctx,bounds,zoom,state.ground);ctx.restore();
 }
 const buildings=query(state.buildings,state.buildingGrid,x0,y0,x1,y1);
 const inferred=query(state.inferredBuildings,state.inferredGrid,x0,y0,x1,y1);
 const roads=query(state.roads,state.roadGrid,x0,y0,x1,y1);
 drawCityParcels(ctx,[...inferred,...buildings]);
 drawCityStreets(ctx,roads,zoom);
 drawCityBuildings(ctx,[...inferred,...buildings],zoom);
 // The road remains below the entire roof, including the authored church art.
 // A small dynamic reveal makes the passage visible while travelling under it.
 drawCrosswalks(ctx,state.graph,bounds,zoom);
 drawStreetProps(ctx,query(state.props,state.propsGrid,x0,y0,x1,y1),zoom);
 drawStorefronts(ctx,query(state.shops,state.shopGrid,x0,y0,x1,y1),zoom);
}
function drawRoofReveal(ctx,buildings,roads,dt,bounds){
 const car=state.player.car>=0?state.cars[state.player.car]:null;
 const [x0,y0,x1,y1]=bounds;
 const actors=[car||{...state.player,body:'walk'}];
 for(const person of state.people){
  if(person.x<x0-12||person.x>x1+12||person.y<y0-12||person.y>y1+12)continue;
  actors.push(person);
 }
 const revealActors=actors.map(actor=>{
  const walking=actor.body==='walk';
  const street=nearest(actor.x,actor.y,42,state.roads,false,walking);
  return {...actor,onStreet:!!street&&street.distance<=visualRoadWidth(street.road)/2+SIDEWALK_OUTER,
   radius:isMotorcycle(actor)?2.4:actor.body==='car'?3.4:1.35};
 });
 const visible=new Set();
 for(const b of buildings){
  visible.add(b.id);
  const target=roofRevealTarget(b,revealActors);
  const amount=easeRoofReveal(roofReveal.get(b.id)||0,target,dt);
  if(amount<.01){roofReveal.delete(b.id);continue;}
  roofReveal.set(b.id,amount);
  ctx.save();traceRoofCover(ctx,b);ctx.clip();
  ctx.globalCompositeOperation='destination-out';ctx.globalAlpha=.72*amount;
  ctx.fillStyle='#000';ctx.fill();
  ctx.globalCompositeOperation='source-over';ctx.globalAlpha=amount;
  const art=b.art;
  drawTerrain(ctx,[art.x0-22,art.y0-22,art.x1+22,art.y1+22],state.zoom,state.ground);
  drawCityParcels(ctx,[b]);
  drawCityStreets(ctx,roads,state.zoom);
  ctx.globalAlpha=1-.72*amount;
  drawCityBuildings(ctx,[b],state.zoom);
  ctx.restore();
 }
 for(const id of roofReveal.keys())if(!visible.has(id))roofReveal.delete(id);
}
function staticTile(tx,ty){
 const key=tx+','+ty;
 if(staticTiles.has(key)){
  const tile=staticTiles.get(key);staticTiles.delete(key);staticTiles.set(key,tile);
  return tile;
 }
 const x=tx*STATIC_TILE,y=ty*STATIC_TILE;
 const layer=document.createElement('canvas');
 layer.width=layer.height=STATIC_TILE*TILE_PIXELS;
 const ctx=layer.getContext('2d',{alpha:true});
 ctx.imageSmoothingEnabled=false;
 ctx.setTransform(TILE_PIXELS,0,0,TILE_PIXELS,-x*TILE_PIXELS,-y*TILE_PIXELS);
 // The canvas clips to the tile; nearby geometry is queried with bleed so
 // roofs, trees and road strokes crossing a seam remain continuous.
 paintStaticScene(ctx,[x-TILE_BLEED,y-TILE_BLEED,x+STATIC_TILE+TILE_BLEED,y+STATIC_TILE+TILE_BLEED],3);
 const tile={canvas:layer,x,y};staticTiles.set(key,tile);
 return tile;
}
function drawStaticTiles(bounds){
 const mode=getRoadWidthMode();
 if(mode!==tileRoadMode){staticTiles.clear();tileRoadMode=mode;pendingTile=null;}
 const [x0,y0,x1,y1]=bounds;
 const minX=Math.floor(x0/STATIC_TILE),maxX=Math.floor(x1/STATIC_TILE);
 const minY=Math.floor(y0/STATIC_TILE),maxY=Math.floor(y1/STATIC_TILE);
 const visible=(maxX-minX+1)*(maxY-minY+1);
 for(let ty=minY;ty<=maxY;ty++)for(let tx=minX;tx<=maxX;tx++){
  const tile=staticTile(tx,ty);
  c.drawImage(tile.canvas,tile.x,tile.y,STATIC_TILE,STATIC_TILE);
 }
 // Retain all visible tiles plus a small recent halo. Fixed memory bound on
 // phones; large desktop windows get enough slots to avoid in-frame eviction.
 const limit=Math.max(32,Math.min(100,visible+8));
 while(staticTiles.size>limit)staticTiles.delete(staticTiles.keys().next().value);
 // Ask the browser to prepare a single tile in the direction of travel during
 // idle time. A fast car should rarely require its next tile on the hot frame.
 if(typeof requestIdleCallback==='function'&&!pendingTile){
  const car=state.player.car>=0?state.cars[state.player.car]:null;
  const heading=car?.a??state.player.a,dx=Math.cos(heading),dy=Math.sin(heading);
  const halfW=(x1-x0)/2,halfH=(y1-y0)/2;
  const edge=Math.min(halfW/Math.max(.001,Math.abs(dx)),halfH/Math.max(.001,Math.abs(dy)));
  const look=edge+STATIC_TILE*.6;
  const tx=Math.floor((state.camera.x+dx*look)/STATIC_TILE);
  const ty=Math.floor((state.camera.y+dy*look)/STATIC_TILE);
  const key=tx+','+ty;
  if(!staticTiles.has(key)){
   pendingTile=key;
   requestIdleCallback(deadline=>{
    if(pendingTile!==key)return;
    pendingTile=null;
    if(state.ready&&getRoadWidthMode()===tileRoadMode&&deadline.timeRemaining()>4){
     staticTile(tx,ty);
     while(staticTiles.size>limit)staticTiles.delete(staticTiles.keys().next().value);
    }
   },{timeout:250});
  }
 }
}
function draw(dt=0){
 // Render at a compact palette resolution and let CSS scale nearest-neighbor;
 // the chunky edges read as pixel art and reduce fill/texture work on phones.
 const cw=canvas.clientWidth,ch=canvas.clientHeight,ratio=Math.max(.62,Math.min(window.devicePixelRatio||1,1.5)*.66);
 if(canvas.width!==Math.floor(cw*ratio)||canvas.height!==Math.floor(ch*ratio)){canvas.width=Math.floor(cw*ratio);canvas.height=Math.floor(ch*ratio);}
 c.setTransform(ratio,0,0,ratio,0,0);
 c.imageSmoothingEnabled=false;
 c.fillStyle='#15221e';c.fillRect(0,0,cw,ch);
 if(!state.ready)return;
 if(state.bankInterior){drawBankInterior(c,cw,ch,state.clock,state.bankInterior.bank,state.bankInterior.player,interiorZoom(),state.bankInterior.camera);return;}
 const p=state.player;
 c.translate(cw/2,ch/2);c.scale(state.zoom,state.zoom);c.translate(-state.camera.x,-state.camera.y);
 const [x0,y0,x1,y1]=visibleBounds();
 const buildings=query(state.buildings,state.buildingGrid,x0,y0,x1,y1);
 const roads=query(state.roads,state.roadGrid,x0,y0,x1,y1);
 const halfW=cw/(2*state.zoom),halfH=ch/(2*state.zoom);
 drawStaticTiles([state.camera.x-halfW,state.camera.y-halfH,state.camera.x+halfW,state.camera.y+halfH]);
 drawRoofReveal(c,[...buildings,...query(state.inferredBuildings,state.inferredGrid,x0,y0,x1,y1)],roads,dt,[x0,y0,x1,y1]);
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
 const alpha=Math.min(1,state.trafficClock/.05);
 drawCityPeople(c,state.people,state.graph,state.clock,[x0,y0,x1,y1],alpha);
 for(const ai of state.traffic)if(ai.x>=x0&&ai.x<=x1&&ai.y>=y0&&ai.y<=y1){
  const x=ai.prevX===undefined?ai.x:ai.prevX+(ai.x-ai.prevX)*alpha;
  const y=ai.prevY===undefined?ai.y:ai.prevY+(ai.y-ai.prevY)*alpha;
  const a=ai.prevA===undefined?ai.a:ai.prevA+Math.atan2(Math.sin(ai.a-ai.prevA),Math.cos(ai.a-ai.prevA))*alpha;
  drawCar(x,y,a,ai.kind,false,ai.model,ai);
 }
 state.cars.forEach((v,i)=>{if(v.x>=x0&&v.x<=x1&&v.y>=y0&&v.y<=y1)drawCar(v.x,v.y,v.a,v.type,i===p.car,v.model,v);});
 drawParkedMotorcycleHints();
 drawPlayer();
 for(const bank of state.bankEntrances)if(bank.x>=x0&&bank.x<=x1&&bank.y>=y0&&bank.y<=y1)drawBankEntrance(c,bank,state.clock);
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
 if(!state.mapCanvas||state.bankInterior)return;
 r.clearRect(0,0,168,142);r.drawImage(state.mapCanvas,0,0);
 if(state.progress)drawMinimapLandmarks(r,state.landmarks,activeTarget(state.progress,state.landmarks),state.mini);
 const {k,ox,oy}=state.mini,p=state.player,x=ox+p.x*k,y=oy+p.y*k;
 r.fillStyle='#ffce66';r.beginPath();r.arc(x,y,4,0,Math.PI*2);r.fill();
 r.lineWidth=1.4;r.strokeStyle='#1e2920';r.stroke();
 r.fillStyle='#fff0b9';r.font='bold 8px monospace';r.fillText('MELITO',5,10);
}
function frame(now){
 const dt=state.last?Math.min(.05,(now-state.last)/1000):0;state.last=now;
 tick(dt);draw(dt);drawMini();requestAnimationFrame(frame);
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
  let placement=null;
  try{
   const req=await fetch('./data/building-placement.json',{cache:'no-cache'});
   if(req.ok)placement=await req.json();
  }catch(error){console.warn('Optional building placement unavailable',error);}
  prepareMap(map,surveyData,infillCache,placement);
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
  const carRadioAvailable=state.player.car>=0&&!state.bankInterior&&
   !isMotorcycle(state.cars[state.player.car])&&pause.hidden&&!state.mapOpen&&$('dialog').hidden;
  if(carRadioAvailable&&e.key.toLowerCase()==='r'&&!e.repeat){
   e.preventDefault();e.shiftKey?carRadio.previous():carRadio.next();
  }
  if(carRadioAvailable&&e.key.toLowerCase()==='t'&&!e.repeat){
   e.preventDefault();carRadio.toggle();
  }
  if(e.key==='Escape'){if(state.bankInterior){toggleVehicle();return;}$('fullmap').hidden=true;state.mapOpen=false;$('dialog').hidden=true;if(!pause.hidden)closePause();else openPause();}
 });
 window.addEventListener('keyup',e=>{
  const dir={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',w:'up',a:'left',s:'down',d:'right',W:'up',A:'left',S:'down',D:'right'}[e.key];
  if(dir){e.preventDefault();pressed[dir]=false;}
  if(e.key==='Shift')pressed.run=false;
  if(e.code==='Space')pressed.handbrake=false;
 });
 const steeringPad=$('steering-wheel');
 const wheelPointer=e=>{
  const box=steeringPad.getBoundingClientRect();
  return pointerWheelAngle(e.clientX,e.clientY,box.left+box.width/2,box.top+box.height/2);
 };
 steeringPad.addEventListener('pointerdown',e=>{
  if(state.player.car<0||state.bankInterior||wheel.held)return;
  e.preventDefault();wheel.held=true;wheel.pointerId=e.pointerId;wheel.pointerAngle=wheelPointer(e);
  try{steeringPad.setPointerCapture(e.pointerId);}catch(_){}
 });
 steeringPad.addEventListener('pointermove',e=>{
  if(!wheel.held||wheel.pointerId!==e.pointerId)return;
  e.preventDefault();
  const next=wheelPointer(e);
  wheel.angle=turnSteeringWheel(wheel.angle,wheel.pointerAngle,next);
  wheel.pointerAngle=next;
  $('steering-face').style.transform='rotate('+wheel.angle+'rad)';
 });
 const releaseWheel=e=>{
  if(wheel.pointerId===e.pointerId){wheel.held=false;wheel.pointerId=null;}
 };
 for(const name of ['pointerup','pointercancel','lostpointercapture'])steeringPad.addEventListener(name,releaseWheel);
 // Keyboard wheel accessibility: left/right arrows or A/D already steer.
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
 const openPause=()=>{Object.keys(pressed).forEach(k=>pressed[k]=false);stick.x=0;stick.y=0;resetDrivingControls();pause.hidden=false;pauseButton.setAttribute('aria-expanded','true');$('pause-details').textContent='MEZZO: '+$('vehicle').textContent+'  ·  CAMERA: '+$('camera-mode').textContent+'  ·  STRADE: '+$('road-count').textContent+'  ·  EDIFICI OSM: '+$('building-count').textContent+'  ·  PLACEHOLDER: '+$('inferred-count').textContent+'  ·  INCROCI: '+$('junction-count').textContent+'  ·  '+$('road-width-current').textContent+' unità';};
 const closePause=()=>{pause.hidden=true;pauseButton.setAttribute('aria-expanded','false');};
 pauseButton.addEventListener('click',()=>pause.hidden?openPause():closePause());
 $('pause-close').addEventListener('click',closePause);
 $('pause-missions').addEventListener('click',()=>{closePause();if($('mission-panel').hidden)$('mission-panel-toggle').click();});
 $('pause-map').addEventListener('click',()=>{closePause();toggleBigMap();});
 for(const [id,target] of [['pause-zoom-auto','zoom-auto'],['pause-zoom-in','zoom-in'],['pause-zoom-out','zoom-out'],['pause-reset','reset'],['pause-road-compare','road-width-compare']])$(id).addEventListener('click',()=>$(target).click());
 const orient=()=>{const rotate=$('rotate-screen');rotate.hidden=typeof matchMedia!=='function'||matchMedia('(orientation: landscape)').matches;};
 orient();window.addEventListener('orientationchange',orient);window.addEventListener('resize',orient);
 const lockLandscape=()=>{try{if(typeof screen!=='undefined'&&screen.orientation?.lock)screen.orientation.lock('landscape').catch(()=>{});}catch(_){}};
 for(const id of ['touch-stick','steering-wheel','action','sprint','accelerator','brake','reverse'])$(id).addEventListener('pointerdown',lockLandscape,{once:true});
 document.querySelectorAll('[data-dir]').forEach(btn=>{
  const key=btn.dataset.dir;
  btn.addEventListener('pointerdown',e=>{e.preventDefault();pressed[key]=true;btn.classList.add('pressed');try{btn.setPointerCapture(e.pointerId);}catch(_){}});
  for(const name of ['pointerup','pointercancel','lostpointercapture'])btn.addEventListener(name,()=>{pressed[key]=false;btn.classList.remove('pressed');});
 });
 $('action').addEventListener('click',toggleVehicle);
 $('radio-prev').addEventListener('click',()=>carRadio.previous());
 $('radio-next').addEventListener('click',()=>carRadio.next());
 $('radio-toggle').addEventListener('click',()=>carRadio.toggle());
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
 for(const [id,key] of [['accelerator','accelerate'],['brake','brake'],['reverse','reverse'],['sprint','run']]){
  const btn=$(id);
  btn.addEventListener('pointerdown',e=>{
   e.preventDefault();pressed[key]=true;btn.classList.add('pressed');
   try{btn.setPointerCapture(e.pointerId);}catch(_){}
  });
  const release=()=>{pressed[key]=false;btn.classList.remove('pressed');};
  for(const name of ['pointerup','pointercancel','lostpointercapture'])btn.addEventListener(name,release);
 }

 $('retry').addEventListener('click',load);
 $('zoom-in').addEventListener('click',()=>{state.zoomBias=clamp(state.zoomBias*1.17,.62,1.35);});
 $('zoom-out').addEventListener('click',()=>{state.zoomBias=clamp(state.zoomBias/1.17,.62,1.35);});
 $('zoom-auto').addEventListener('click',()=>{state.zoomBias=1;});
 $('reset').addEventListener('click',()=>{
  if(!state.ready)return;const p=state.player;carRadio.leaveVehicle();p.car=-1;p.vehicleType=null;p.x=state.spawn[0];p.y=state.spawn[1];p.a=0;state.camera.x=p.x;state.camera.y=p.y;
  state.zoom=CAMERA_ZOOM_MAX;state.zoomBias=1;state.zoomTarget=CAMERA_ZOOM_MAX;resetDrivingControls();updateHud();
 });
 window.addEventListener('blur',()=>{Object.keys(pressed).forEach(k=>pressed[k]=false);resetStick();resetDrivingControls();});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){Object.keys(pressed).forEach(k=>pressed[k]=false);resetStick();resetDrivingControls();carRadio.suspend();}});
 canvas.addEventListener('wheel',e=>{e.preventDefault();
  state.zoomBias=clamp(state.zoomBias*(e.deltaY>0?.91:1.1),.62,1.35);
 },{passive:false});
}
loadChurchWebp(()=>{staticTiles.clear();pendingTile=null;});
loadMotorcycleSprites();loadExtraPedestrianSprites();loadPedestrianSprites();loadCarSprites();bind();requestAnimationFrame(frame);load();
