/* WORK HANDOFF / VISUAL REALISM:
 * Read ./AGENTS.md and ./HANDOFF_WORK_REALISMO.md before changing this game;
 * log completed visual improvements in ./VISUAL_PROGRESS.md.
 * Aim: identifiable Melito di Napoli in original top-down pixel art 2.5D.
 * Preserve OSM geometry, gameplay and camera controls. 
 */
import {visualRoadWidth,setRoadWidthMode,getRoadWidthMode} from './road-widths.mjs?v=043';
import {fetchOverpass,inside} from './osm.mjs';
import {buildRoadGraph,createAgents,stepAgents,lanePosition,balanceTraffic,createGateVehicle} from './roads.mjs?v=154';
import {createCommuter,stepCommuter,kerbSpot,carEdgeFor,planRoute,routeLength} from './npc-commute.mjs?v=009';
import {drawBorderGates,borderGateList,borderRing,distanceToBorder,GATE_RULES} from './border-gates.mjs?v=001';
import {createRoutineResidents,createDoorVisitors,attachDoorToPavement} from './resident-routines.mjs?v=006';
import {probeDoor,doorFacesViewer,drawDoorSteps,drawDoorFronts,DOOR_SOURCE} from './building-doors.mjs?v=001';
import {NPC_START_MINUTE,advanceNpcClock,formatNpcClock,npcWeekday} from './npc-agenda.mjs?v=002';
import {createMarket,stepMarket,marketBlocksWalker,marketBlocksVehicle,stepParasolReveal,drawMarketGround,drawMarketStalls,drawMarketParasols} from './market.mjs?v=001';
import {createCityEvents,stepCityEvents,cityEventAction,interactCityEvent,cityEventBubble,drawLostItem,drawCityEventOverlay} from './city-events.mjs?v=002';
import {offersFor,nearestShop,buyOffer,addBoost,boostFactor,boostSecondsLeft,purchaseMessage,shopNote,vendorShops} from './local-shops.mjs?v=002';
import {weatherAt,combineWeather,drawRain,drawCloudShadows,placePuddles,drawPuddles,drawUmbrella} from './weather.mjs?v=001';
import {buildingVolume} from './building-volume.mjs?v=088';
import {createCityAudio} from './city-audio.mjs?v=004';
import {createSocial,stepSocial} from './npc-social.mjs?v=003';
import {createReactions,stepReactions,kerbWait,pickBlockedHorn} from './npc-reactions.mjs?v=002';
import {createDensity,stepDensity,prepareWalkWeights} from './npc-density.mjs?v=002';
import {trafficTargetAt} from './traffic-rush.mjs?v=001';
import {daylightAt,paintLightMap,paintGlows,headlightLights,vehicleLamps,litWindowPath,nightQuality,NIGHT_DARKNESS} from './daylight.mjs?v=001';
import {makeCollisionIndex,collidesWithTraffic,vehiclesOverlap,nearbyColliders,vehicleShape,trafficMoveBlocked,trafficMoveBlocker} from './traffic-collision.mjs?v=128';
import {buildParkingBays,bayOffset,fitsParkingBay,nearestFreeStalls,parkInStall,insideParkingStrip,drawParkingBays} from './parking-bays.mjs?v=001';
import {placeStreetObjects,stepStreetObjects,drawStreetObjects,bollardBlocksVehicle,bollardBlocksWalker} from './street-objects.mjs?v=001';
import {SIGNALS_SIMULATED,clockSecondsFromMinutes} from './junctions.mjs?v=002';
import {prepareSignalPosts,drawStopLines,drawSignals,signalGlows} from './traffic-light-art.mjs?v=002';
import {stepWasher,drawWasherEffects} from './window-washers.mjs?v=002';
import {buildStreetProps,drawArchitecture,drawStreets,drawCrosswalks,drawStreetProps,drawPoiSigns} from './visuals.mjs?v=090';
import {STORY,readProgress,saveProgress,freshProgress,resolveLandmarks,currentStep,activeTarget,isNear,doInteraction,updateTimer,resetCurrentMission} from './campaign.mjs?v=002';
import {drawWorldLandmarks,drawMinimapLandmarks,drawBigMap} from './landmark-art.mjs?v=089';
import {prepareCityStyles,applyApprovedArcadeRoofStyle,applyPiazzaRoofStudies,prepareUrbanGround,drawTerrain,drawCityParcels,drawCityStreets,drawCityBuildings,drawCityPeople,drawCityCar,drawCityPlayer,loadChurchWebp,facadeWindowPanes} from './city-art.mjs?v=131';
import {createSatelliteOverlay,satelliteFromUrl} from './satellite-overlay.mjs?v=001';
import {loadCarSprites,drawCarSprite,CAR_TRAFFIC_SPRITE_IDS,CAR_PARKED_SPRITE_IDS,APE_CAR_IDS} from './car-sprites.mjs?v=109';
import {loadPedestrianSprites} from './pedestrian-sprites.mjs?v=001';
import {loadExtraPedestrianSprites} from './extra-pedestrian-sprites.mjs?v=001';
import {loadFryerSprite} from './friggitore-sprites.mjs?v=001';
import {loadProfessionSprites} from './profession-sprites.mjs?v=001';
import {trafficApeModel,placeStreetFoodVendors,createStreetProfessionActors} from './street-professions.mjs?v=005';
import {prepareStorefronts,drawStorefronts} from './storefronts.mjs?v=043';
import {applySurveyDrafts} from './survey/visual-profiles.mjs?v=045';
import {generateUrbanInfill,INFILL_VERSION,mapFingerprint} from './urban-infill.mjs?v=116';
import {CAMERA_ZOOM_MAX,targetCameraZoom,advanceCameraZoom,describeCameraZoom,vehicleCameraTarget} from './camera-zoom.mjs?v=101';
import {WALK_SPEED,RUN_SPEED,stepDriving} from './driving-controls.mjs?v=098';
import {handlingProfile,applyGrip} from './vehicle-handling.mjs?v=003';
import {MOTORCYCLE_IDS,isMotorcycle,loadMotorcycleSprites,drawMotorcycle,stepMotorcycle,chooseMotorcycleDismount} from './motorcycles.mjs?v=006';
import {nearestEnterableVehicle} from './vehicle-entry.mjs?v=003';
import {PARKED_BIKE_TARGET,PARKED_VEHICLE_CAP,PARKED_CAR_PHASE_CAP,motorcycleParkingRoadOrder,parkedBikeLabel} from './motorcycle-parking.mjs?v=001';
import {guideCar} from './driving-assist.mjs?v=099';
import {buildTurnGuides,guideIntersection} from './intersection-assist.mjs?v=097';
import {reboundCar,advanceRecoil} from './car-rebound.mjs?v=098';
import {canDriveProbe} from './road-clearance.mjs?v=099';
import {roofRevealTarget,easeRoofReveal,traceRoofCover} from './roof-reveal.mjs?v=120';
import {resolveBankEntrances,nearestBankEntrance,drawBankEntrance,drawBankInterior,stepBankInteriorPlayer,bankInteriorCamera,BANK_FOOT_ZOOM_MULTIPLIER} from './bank-interior.mjs?v=008';
import {applyNonlethalImpact,advanceNonlethalImpact,sweptVehicleContact,slowImpactSource,IMPACT_MIN_SPEED} from './impact-physics.mjs?v=004';
import {WHEEL_MAX_ANGLE,pointerWheelAngle,turnSteeringWheel,steeringInput,returnSteeringWheel} from './steering-wheel.mjs?v=001';
import {SIDEWALK_DRIVE,SIDEWALK_OUTER} from './sidewalk.mjs?v=099';
import {placeBuildings} from './building-placement.mjs?v=123';
import {prepareEnclosures,enclosureWalkBlocked,enclosureVehicleContacts,markGlassBuildings,drawEnclosureWalls,drawEnclosureGates} from './enclosures.mjs?v=001';
import {preparePitches,infillOnPitch,pitchWalkBlocked,pitchVehicleContacts,pitchHotspot,drawPitches} from './football-pitches.mjs?v=001';
import {prepareWaterTowers,towerRevealTarget,drawWaterTower,drawWaterTowerLight,markRuinPool,drawRuinPoolPuddles} from './municipio-landmarks.mjs?v=001';
import {createCarRadio} from './car-radio.mjs?v=003';
import {renderNovita,novitaTarget,findStandingPoint,minutesAtHour,loadJudgements,saveJudgements,toggleJudgement,judgementSummary,NOVITA} from './novita.mjs?v=001';
const $=id=>document.getElementById(id);
// Q09: last radio status, read by the city sound to duck engines while a station plays.
let radioStatus='off';
function updateCarRadioUi({inVehicle,status,station,enabled}){
 radioStatus=status;
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
// Q04: ?ora=21:30 starts the simulated clock at that time (testing day/night); default 07:30.
function startMinuteFromUrl(){
 const match=/^(\d{1,2})[:.](\d{2})$/.exec(new URLSearchParams(globalThis.location?.search||'').get('ora')||'');
 return match&&Number(match[1])<24&&Number(match[2])<60?Number(match[1])*60+Number(match[2]):NPC_START_MINUTE;
}
const START_MINUTE=startMinuteFromUrl();
// Q09: synthesized city sound; created only on the first user gesture.
// BF10: RADIO/MUSICA ed EFFETTI/AMBIENTE separati; il livello radio (0 con SUONI OFF) va allo stream.
const cityAudio=createCityAudio({storage:globalThis.localStorage,onRadioLevel:level=>carRadio.setVolume(level)});
carRadio.setVolume(cityAudio.radioLevel);
// Q08: ?meteo=pioggia|nuvoloso|sereno fixes the weather for checks; otherwise it follows the clock.
// Q42: ?mercato=1 fa montare il mercato del rione 219 ogni giorno (per le prove); di norma è il venerdì.
const FORCE_MARKET=new URLSearchParams(globalThis.location?.search||'').get('mercato')==='1';
const FORCED_WEATHER=(()=>{const w=new URLSearchParams(globalThis.location?.search||'').get('meteo');return ['pioggia','nuvoloso','sereno'].includes(w)?w:null;})();
const state={map:null,roads:null,buildings:null,roadGrid:null,buildingGrid:null,cars:[],traffic:[],people:[],dynamicCollision:null,trafficClock:0,npcClockMinutes:START_MINUTE,player:{x:0,y:0,a:0,car:-1},spawn:[0,0],zoom:CAMERA_ZOOM_MAX,zoomBias:1,zoomTarget:CAMERA_ZOOM_MAX,clock:0,last:0,hud:0,ready:false,loading:false,mapCanvas:null,graph:null,turnGuides:[],props:[],propsGrid:null,camera:{x:0,y:0},distance:0,shops:[],shopGrid:null,bankEntrances:[],bankInterior:null,ground:null,inferredBuildings:[],inferredGrid:null,infillStats:null,landmarks:new Map(),progress:null,lastSave:0,bannerTimeout:0,mapOpen:false};
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
// Q03: returns the building found (still truthy), so doors know which footprint they belong to.
function buildingAt(x,y){
 const hit=buildings=>buildings.find(b=>{
  const bd=b.bounds;if(!bd||x<bd[0]||x>bd[2]||y<bd[1]||y>bd[3])return false;
  let found=false,p=b.p;
  for(let i=0,j=p.length-2;i<p.length;j=i,i+=2){
   const ax=p[i],ay=p[i+1],bx=p[j],by=p[j+1];
   if(((ay>y)!==(by>y))&&(x<(bx-ax)*(y-ay)/(by-ay)+ax))found=!found;
  }return found;
 });
 const real=hit(query(state.buildings,state.buildingGrid,x-5,y-5,x+5,y+5));
 if(real)return real;
 return state.inferredGrid?
  hit(query(state.inferredBuildings,state.inferredGrid,x-5,y-5,x+5,y+5))||false:false;
}
// Q08: ground hidden by a building: its footprint, its walls or its lifted roof (2.5D projection).
function coveredByBuilding(x,y){
 if(buildingAt(x,y))return true;
 const hit=list=>list.some(b=>{
  const v=buildingVolume(b);if(!v)return false;
  for(const s of [.34,.67,1]){
   const px=x+v.dx*s,py=y+v.dy*s,bd=b.bounds;
   if(!bd||px<bd[0]||px>bd[2]||py<bd[1]||py>bd[3])continue;
   let found=false;const p=b.p;
   for(let i=0,j=p.length-2;i<p.length;j=i,i+=2){const ax=p[i],ay=p[i+1],bx=p[j],by=p[j+1];
    if(((ay>py)!==(by>py))&&(px<(bx-ax)*(py-ay)/(by-ay)+ax))found=!found;}
   if(found)return true;
  }
  return false;
 });
 return hit(query(state.buildings,state.buildingGrid,x-2,y-2,x+22,y+22))||
  (!!state.inferredGrid&&hit(query(state.inferredBuildings,state.inferredGrid,x-2,y-2,x+22,y+22)));
}
function validWalk(x,y){
 return x>=0&&y>=0&&x<state.map.projection.width&&y<state.map.projection.height&&!buildingAt(x,y)&&
  !(state.enclosures&&enclosureWalkBlocked(state.enclosures,x,y))&&!(state.pitches&&pitchWalkBlocked(state.pitches,x,y));
}
// Q32: football pitches traced on the Esri aerial photo; the gate opens on the side reachable on foot.
function createPitches(){
 state.pitches=null;
 state.pitches=preparePitches(undefined,{walkable:validWalk,
  nearStreet:(x,y)=>{const r=nearest(x,y,24,state.roads);return !!r&&r.distance<=visualRoadWidth(r.road)/2+2;}});
 if(state.pitches.failed.length)console.warn('Campetti non collocati: '+state.pitches.failed.map(f=>f.id+' ('+f.reason+')').join(', '));
}
// Q32: the Q33 match will open here; until then the gate only says so.
function openFootballMatch(pitch){
 state.notice={text:'CALCETTO · '+pitch.nome.toUpperCase()+' · LA PARTITA ARRIVA CON LA Q33',until:state.clock+4};
 cityEventBubble(state.events,state.player,'Calcetto in arrivo!');
 updateHud();
}
// BF12: perimeter walls, gates and guard booths of the enclosures (villa comunale, Municipio…),
// computed on the current road widths: the walls stand just beyond the painted pavement.
function createEnclosures(){
 state.enclosures=state.enclosureData?prepareEnclosures(state.enclosureData,{roads:state.roads,roadWidth:visualRoadWidth,
  sidewalkOuter:SIDEWALK_OUTER,inBorder:(x,y)=>inside([x,y],toRing(state.map.border))}):null;
 if(state.enclosures)console.info('Recinti: '+state.enclosures.list.length+' con mura e cancelli'+
  (state.enclosures.failed.length?', non disegnati: '+state.enclosures.failed.map(f=>f.id+' ('+f.reason+')').join(', '):''));
}
const enclosureTime=()=>({minutes:state.npcClockMinutes,traffic:state.traffic});
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
// Q07: wheelie bins (movable) and cast-iron bollards (fixed), clear of houses, roads, doors and parked cars.
function createStreetObjects(){
 const border=toRing(state.map.border);
 const avoid=[...state.props.map(q=>({x:q.x,y:q.y,r:1.8})),...(state.doors||[]).map(d=>({x:d.x,y:d.y,r:2.6})),
  ...state.cars.map(v=>({x:v.x,y:v.y,r:3.6})),...state.bankEntrances.map(b=>({x:b.x,y:b.y,r:3})),
  ...(state.shops||[]).map(s=>({x:s.x,y:s.y,r:3.2})),...(state.signalPosts||[]).map(q=>({x:q.x,y:q.y,r:1.8}))];
 return placeStreetObjects(state.roads,{roadWidth:visualRoadWidth,avoid,
  walkable:(x,y)=>validWalk(x,y)&&inside([x,y],border),
  carriageway:(x,y,margin)=>{const r=nearest(x,y,30,state.roads,true);return !!r&&r.distance<visualRoadWidth(r.road)/2+margin||inParkingBay(x,y,margin);}});
}
// Q42: mercato del venerdì nel rione 219. Luogo reale (data/market-area.json); giorno, orari, banchi,
// merci e venditori di fantasia. Banchi fuori da edifici, carreggiate, baie, porte e arredi.
function createMelitoMarket(){
 const border=toRing(state.map.border);
 const walkable=(x,y)=>validWalk(x,y)&&inside([x,y],border);
 const carriageway=(x,y,margin=0)=>{const r=nearest(x,y,30,state.roads,true);return !!r&&r.distance<visualRoadWidth(r.road)/2+margin||inParkingBay(x,y,margin);};
 const obstacles=[...state.props.map(q=>q.kind<5?{x:q.x,y:q.y,r:3,walkR:.8,crown:4.6}:{x:q.x,y:q.y,r:1.7,walkR:1.1}),
  ...(state.doors||[]).map(d=>({x:d.x,y:d.y,r:2.6})),...state.cars.map(v=>({x:v.x,y:v.y,r:3.4,walkR:2.4,crown:3.2})),
  ...(state.signalPosts||[]).map(q=>({x:q.x,y:q.y,r:1.4}))];
 return createMarket({roads:state.roads,walkable,carriageway,obstacles,roadHalf:road=>visualRoadWidth(road)/2});
}
function stepMelitoMarket(dt){
 if(!state.market)return;
 const p=state.player,car=p.car>=0?state.cars[p.car]:null;
 stepMarket(state.market,dt,{minutes:state.npcClockMinutes,force:FORCE_MARKET||!!state.preview?.market,view:visibleBounds(),
  player:{x:car?car.x:p.x,y:car?car.y:p.y,onFoot:!car},index:state.dynamicCollision,
  say:(agent,text)=>cityEventBubble(state.events,agent,text),
  advanceImpact:(agent,step)=>advanceNonlethalImpact(agent,step,canKnockbackMove)});
}
// BF02: the parking strip between lane and pavement, rebuilt with the road widths.
function createParkingBays(){
 const keepClear=[...(state.shops||[]).map(s=>({x:s.x,y:s.y,r:6,why:'ingresso'})),
  ...(state.bankEntrances||[]).map(b=>({x:b.x,y:b.y,r:9,why:'ingresso'}))];
 state.parkingBays=buildParkingBays(state.graph,{keepClear,blocked:pose=>carBlocked(pose.x,pose.y,pose.a,-1,{vehicleType:'car'})});
 state.bayGrid=makeIndex(state.parkingBays.strips);
}
function inParkingBay(x,y,margin=0){
 if(!state.parkingBays)return false;
 return query(state.parkingBays.strips,state.bayGrid,x-6,y-6,x+6,y+6).some(strip=>insideParkingStrip(strip,x,y,margin));
}
// Q16: an Ape keeps its own short, narrow three-wheeler body; every other car keeps the common car body.
const isApe=v=>!isMotorcycle(v)&&/^ape-/.test(v?.model||'');
const bodyShape=v=>vehicleShape(isMotorcycle(v)?{vehicleType:'motorcycle'}:isApe(v)?v:{vehicleType:'car'});
function stepStreetPhysics(dt){
 const objects=state.streetObjects,p=state.player;if(!objects)return;
 const vehicles=[];
 if(p.car>=0){const car=state.cars[p.car];vehicles.push({x:car.x,y:car.y,a:car.a,vx:Math.cos(car.a)*car.speed,vy:Math.sin(car.a)*car.speed,shape:bodyShape(car)});}
 for(const v of state.traffic)if(v.body==='car'){
  const speed=v.braking?0:v.speed||0;vehicles.push({x:v.x,y:v.y,a:v.a,vx:Math.cos(v.a)*speed,vy:Math.sin(v.a)*speed,shape:bodyShape(v)});
 }
 const walkers=p.car<0?[{x:p.x,y:p.y}]:[];
 for(const person of state.people)if(!person.indoors)walkers.push(person);
 const hits=stepStreetObjects(objects,dt,{vehicles,walkers,canMove:canKnockbackMove,view:visibleBounds()});
 // A wheelie bin is light: the player's car loses only a little speed.
 if(p.car>=0&&hits.length)state.cars[p.car].speed*=.96;
}
// Q12: home door near the start, a free kerb spot for the scooter in front of it, and a named OSM
// shop 300-900 m away by road. The scooter is a real parked vehicle (the player can take it).
function createCommuters(doorAt,walkOK,shops,taken){
 const old=state.cars.find(v=>v.commuterBike);
 if(old&&state.player.car===state.cars.indexOf(old))return [];
 const used=new Set(taken.flatMap(p=>[p.residentRoutine?.homeDoor,p.residentRoutine?.targetDoor]).filter(Boolean));
 const freeSpot=s=>walkOK(s.x,s.y)&&!state.cars.some(v=>v!==old&&vehiclesOverlap({...s,vehicleType:'motorcycle'},v,.4))&&
  ![...used].some(d=>Math.hypot(d.x-s.x,d.y-s.y)<2.5);
 const homes=[];
 for(const id of state.graph.walkStarts){
  const e=state.graph.edges[id],a=state.graph.nodes[e.from],b=state.graph.nodes[e.to];
  if(!(e.len>=30)||Math.hypot((a.x+b.x)/2-state.spawn[0],(a.y+b.y)/2-state.spawn[1])>220)continue;
  for(let m=8;m<e.len-8&&homes.length<40;m+=7)for(const side of [1,-1]){
   const o=lanePosition(state.graph,id,m/e.len,'walk',side);
   const door=doorAt(o,{x:-Math.sin(e.angle)*side,y:Math.cos(e.angle)*side});
   if(!door)continue;
   Object.assign(door,{edge:id,side,t:m/e.len,lateral:(door.x-o.x)*-Math.sin(e.angle)+(door.y-o.y)*Math.cos(e.angle)});
   if([...used].some(d=>Math.hypot(d.x-door.x,d.y-door.y)<2.5))continue;
   const spot=kerbSpot(state.graph,door);
   if(freeSpot(spot))homes.push({door,d:Math.hypot(door.x-state.spawn[0],door.y-state.spawn[1])});
  }
 }
 homes.sort((p,q)=>p.d-q.d);
 // Any named OSM shop 300-900 m away with a valid door on a visible facade (not only the visitors' ones).
 const destinations=[...(shops||[])];
 for(const shop of state.shops||[]){
  const dist=Math.hypot(shop.x-state.spawn[0],shop.y-state.spawn[1]);
  if(dist<250||dist>1000||destinations.length>=16)continue;
  const door=doorAt({x:shop.x,y:shop.y},{x:-Math.sin(shop.a)*shop.side,y:Math.cos(shop.a)*shop.side},{source:DOOR_SOURCE.OSM_POI,label:shop.name,kind:shop.kind});
  const placed=door&&attachDoorToPavement(state.graph,door,doorAt);
  if(placed&&!destinations.some(d=>Math.hypot(d.x-placed.x,d.y-placed.y)<3))destinations.push(placed);
 }
 for(let i=destinations.length-1;i>=0;i--)if(used.has(destinations[i])||!freeSpot(kerbSpot(state.graph,destinations[i])))destinations.splice(i,1);
 // The pair with the shortest round trip by road (one-way streets can make the way out long).
 let best=null;
 for(const {door:home} of homes.slice(0,5)){
  const from=carEdgeFor(state.graph,home.edge,home.t);if(!from)continue;
  for(const shop of destinations){
   const far=Math.hypot(shop.x-home.x,shop.y-home.y),to=carEdgeFor(state.graph,shop.edge,shop.t);
   if(far<300||far>900||!to)continue;
   const out=planRoute(state.graph,from.edge,to.edge,'car'),back=out&&planRoute(state.graph,to.edge,from.edge,'car');
   const length=out&&back?routeLength(state.graph,out)+routeLength(state.graph,back):Infinity;
   // Melito has many one-way streets: a round trip of a few kilometres is normal.
   if(length<4200&&(!best||length<best.length))best={home,shop,length};
  }
 }
 if(best){
  const bike=old||{x:0,y:0,a:0,speed:0,type:0,model:'moto-scooter-retro-blue',vehicleType:'motorcycle',rider:false};
  const commuter=createCommuter({graph:state.graph,homeDoor:best.home,shopDoor:best.shop,bike,seed:1201,index:0});
  if(commuter){if(!old)state.cars.push(bike);return [commuter];}
 }
 return [];
}
function stepCommuters(dt){
 const p=state.player;
 for(const c of state.commuters||[]){
  c.npc.prevX=c.npc.x;c.npc.prevY=c.npc.y;c.npc.prevA=c.npc.a;
  stepCommuter(c,dt,{graph:state.graph,index:state.dynamicCollision,valid:canKnockbackMove,clockMinutes:state.npcClockMinutes,
   playerVehicle:p.car>=0?state.cars[p.car]:null,say:(agent,text)=>cityEventBubble(state.events,agent,text),wet:(state.weather?.wetness||0)>.5});
 }
}
// Q13: reactions of passers-by and traffic, and the same passers-by gathered where the city is alive.
function createCityLife(){
 state.reactions=createReactions(1313);state.density=createDensity(1717);
 state.walkWeights=prepareWalkWeights(state.graph,{shops:state.shops||[]});
 // Pavement lines that run through building footprints for more than 8% of the tract (measured every
 // 3 m, once per tract and side, on demand). A single corner clipping a facade does not count: on
 // Via Roma (511 m) one sample in 170 is inside a building.
 const graph=state.graph,known=new Int8Array(graph.edges.length*2).fill(-1);
 graph.isWalkBlocked=(id,side)=>{
  const k=id*2+(side>0?1:0);
  if(known[k]<0){
   const e=graph.edges[id],steps=Math.max(2,Math.ceil(e.len/3));let bad=0;
   if(DRIVE.has(e.roadType))for(let i=1;i<steps;i++){const q=lanePosition(graph,id,.06+.88*i/steps,'walk',side);if(!canStand(q.x,q.y))bad++;}
   known[k]=bad/(steps-1)>.08?1:0;
  }
  return known[k]===1;
 };
}
function canStand(x,y){
 return validWalk(x,y)&&inside([x,y],toRing(state.map.border))&&
  !(state.streetObjects&&bollardBlocksWalker(state.streetObjects,x,y));
}
function onCarriageway(x,y){
 const r=nearest(x,y,30,state.roads,true);
 return !!r&&r.distance<visualRoadWidth(r.road)/2+.3||inParkingBay(x,y,.2);
}
// Q03: errands of named OSM shops worth a short visit on foot.
const VISIT_KINDS=new Set(['bakery','pastry','bar','cafe','supermarket','pharmacy','hairdresser','stationery','hardware','clothes','butcher','houseware']);
function createCityPedestrians(){
 const border=toRing(state.map.border);
 const walkOK=(x,y)=>validWalk(x,y)&&inside([x,y],border);
 // Doors only on facades facing the viewer: the NPC visibly reaches the threshold.
 const doorAt=(origin,normal,extra)=>{
  const door=probeDoor(origin,normal,buildingAt,walkOK,{viewerOnly:true,...extra});
  return door.valid&&doorFacesViewer(door)?door:null;
 };
 // Q13: a resident's street-side home and pavement never lie on a carriageway (before, one Q01 home
 // near a junction stood in the middle of a side street while waiting to go out).
 const residents=createRoutineResidents(state.graph,10,405,
  {x:state.spawn[0],y:state.spawn[1]},[...state.cars,...state.traffic],(x,y)=>walkOK(x,y)&&!onCarriageway(x,y),{doorAt});
 // Nearest named shops first; a few spare ones in case a home door is not found.
 const shops=[],closest=(state.shops||[]).filter(shop=>VISIT_KINDS.has(shop.kind))
  .map(shop=>({shop,distance:Math.hypot(shop.x-state.spawn[0],shop.y-state.spawn[1])}))
  .sort((a,b)=>a.distance-b.distance);
 for(const {shop} of closest){
  if(shops.length>=6)break;
  const door=doorAt({x:shop.x,y:shop.y},{x:-Math.sin(shop.a)*shop.side,y:Math.cos(shop.a)*shop.side},
   {source:DOOR_SOURCE.OSM_POI,label:shop.name,kind:shop.kind});
  const placed=door&&attachDoorToPavement(state.graph,door,doorAt);
  if(placed)shops.push(placed);
 }
 const visitors=createDoorVisitors(state.graph,shops,3,811,
  [...state.cars,...state.traffic,...residents],walkOK,doorAt);
 const routine=[...residents,...visitors];
 // Q12: one resident who goes to a named OSM shop on its own scooter (and walks if it is gone).
 state.commuters=createCommuters(doorAt,walkOK,shops,routine);
 routine.push(...state.commuters.map(c=>c.npc));
 // Q05: city events belong to this cohort; a new cohort starts a fresh, deterministic sequence.
 state.events=createCityEvents(505);
 // Q11: acquaintances who meet on the pavement; a new cohort starts a fresh sequence too.
 state.social=createSocial(909);
 state.doors=[...new Set([...routine.flatMap(p=>[p.residentRoutine?.homeDoor,p.residentRoutine?.targetDoor]),
  ...state.commuters.flatMap(c=>[c.plan.homeDoor,c.plan.shopDoor])].filter(Boolean))];
 state.doorGrid=makeIndex(state.doors.map(d=>Object.assign(d,{p:[d.wallX-3,d.wallY-4,d.wallX+3,d.wallY+2]})));
 const professionWalkOK=at=>walkOK(at.x,at.y)&&
  !state.cars.some(v=>Math.hypot(v.x-at.x,v.y-at.y)<6.1);
 const professionals=createStreetProfessionActors(state.graph,state.foodVendors||[],state.cars,routine,
  {walkerOK:professionWalkOK});
 // Professional characters replace random foot traffic rather than adding to it.
 const walkers=createAgents(state.graph,Math.max(0,112-routine.length-professionals.length),310,'walk',
  [...state.cars,...state.traffic,...routine,...professionals]);
 return [...routine,...professionals,...walkers];
}
function prepareMap(map,surveyData=[],infillCache=null,placement=null,enclosureData=null){
 if(!map||!Array.isArray(map.roads)||map.roads.length<20||!Array.isArray(map.border))throw Error('La mappa salvata non contiene una rete stradale valida');
 staticTiles.clear();roofReveal.clear();tileRoadMode=null;
 state.map=map;
 state.roads=map.roads;state.buildings=placeBuildings(map,placement);
 prepareCityStyles(state.buildings,map.pois||[]);
 const survey=applySurveyDrafts(state.buildings,surveyData);
 state.enclosureData=enclosureData;state.enclosures=null;
 // BF12: glass buildings (galleria Atlante) keep their OSM polygon, only the art changes.
 markGlassBuildings(state.buildings,enclosureData);
 // BF12: Municipio complex: the ruin of the former pool and the chequered water tower (landmark).
 markRuinPool(state.buildings,enclosureData);
 state.waterTowers=prepareWaterTowers(enclosureData);state.towerReveal=new Map();
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
 // Q32: invented placeholders standing on a real pitch (seen on the aerial photo) are left out.
 state.inferredBuildings=inferred.buildings.filter(b=>!infillOnPitch(b));state.infillStats=inferred.stats;
 state.pitchInfillRemoved=inferred.buildings.length-state.inferredBuildings.length;
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
 createPitches();
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
 state.graph=buildRoadGraph(state.roads,{border:state.map.border,gateClear:(x,y)=>!buildingAt(x,y),laneClear:(x,y)=>!buildingAt(x,y)});
 // BF09: the border gates as plain data (WGS84 too), the anchor points for future neighbouring maps.
 state.borderGates=borderGateList(state.graph.gates,state.map.projection);
 state.turnGuides=buildTurnGuides(state.graph);
 state.props=buildStreetProps(state.roads).filter(obj=>!buildingAt(obj.x,obj.y));
 state.propsGrid=makeIndex(state.props);
 state.shops=prepareStorefronts(map.pois||[],state.roads);
 state.puddles=placePuddles(state.roads,{drivable:r=>DRIVE.has(r.t),roadWidth:visualRoadWidth,covered:coveredByBuilding});
 state.weather=weatherAt(state.npcClockMinutes,{forced:state.preview?.weather||FORCED_WEATHER});wetTiles.clear();
 state.shopGrid=makeIndex(state.shops);
 initCampaign(map);
 state.dynamicCollision=null;
 // BF02: every parked vehicle stands in a stall of the parking strip, never in a lane or on the
 // pavement; where there is no real room there is no parking (fewer vehicles, not worse ones).
 // Bollards of a previous load must not shape the stalls: street objects are placed afterwards.
 createEnclosures();
 state.cars=[];state.streetObjects=null;createParkingBays();
 const free=(x,y,options)=>nearestFreeStalls(state.parkingBays,x,y,state.cars,vehiclesOverlap,options)[0]||null;
 const starterStall=free(point.x,point.y,{radius:60})||free(point.x,point.y);
 const nearCar=starterStall?parkInStall({type:0,model:'panda-modern-white'},starterStall):
  {x:point.x+Math.cos(point.a)*9,y:point.y+Math.sin(point.a)*9,a:point.a,speed:0,type:0,model:'panda-modern-white'};
 state.cars=[nearCar];
 // BF02: the starter scooter takes the free stall closest to the Panda.
 const bikeStall=free(nearCar.x,nearCar.y,{radius:40});
 if(bikeStall)state.cars.push(parkInStall({type:0,model:MOTORCYCLE_IDS[0],vehicleType:'motorcycle'},bikeStall));
 // Food trucks first, so that their districts still have room; they too stand in the strip.
 const border=toRing(state.map.border);
 const sidewalkOK=at=>validWalk(at.x,at.y)&&inside([at.x,at.y],border)&&
  (()=>{const r=nearest(at.x,at.y,24,state.roads,true);return !r||r.distance>visualRoadWidth(r.road)/2+.6;})();
 state.foodVendors=placeStreetFoodVendors(state.graph,state.cars,{vehicleOffset:bayOffset,
  vehicleOK:v=>fitsParkingBay(state.parkingBays,v,vehicleShape(v))&&!carBlocked(v.x,v.y,v.a,-1,v)&&!state.cars.some(other=>vehiclesOverlap(v,other)),
  walkerOK:at=>sidewalkOK(at)&&!state.cars.some(v=>Math.hypot(at.x-v.x,at.y-v.y)<6)
 });
 for(const {vehicle} of state.foodVendors)vehicle.parkingBay={x:vehicle.x,y:vehicle.y};
 state.cars.push(...state.foodVendors.map(v=>v.vehicle));
 // Q17: each food truck sells at its counter while its fryer is there.
 state.vendorShops=vendorShops(state.foodVendors);
 // Separate two-wheel parking pass; OSM road candidates remain subject to
 // all road/building and existing parked-vehicle collision validations.
 let parkedBikeCount=state.cars.filter(isMotorcycle).length;
 const bikeRoads=motorcycleParkingRoadOrder(possible,point,roadPoint,arcLength,rnd);
 for(const road of bikeRoads){
  if(parkedBikeCount>=PARKED_BIKE_TARGET||state.cars.length>=PARKED_VEHICLE_CAP)break;
  const at=roadPoint(road,.24+rnd(road.id+703)*.5);
  const stall=nearestFreeStalls(state.parkingBays,at.x,at.y,state.cars,vehiclesOverlap,{roadId:road.id,radius:45,limit:3})
   .find(q=>Math.hypot(q.x-point.x,q.y-point.y)>=9);
  if(!stall)continue;
  state.cars.push(parkInStall({type:0,model:MOTORCYCLE_IDS[Math.floor(rnd(road.id+parkedBikeCount*31+819)*MOTORCYCLE_IDS.length)],
   vehicleType:'motorcycle',rider:false},stall));parkedBikeCount++;
 }
 let k=0;
 for(const road of possible){
  if(arcLength(road.p)<25||rnd(road.id)%1>.33)continue;
  const pt=roadPoint(road,.2+rnd(road.id+11)*.6);
  if(Math.hypot(pt.x-point.x,pt.y-point.y)<19)continue;
  // BF02: the free stall of this road closest to the chosen point (before: either kerb, on the
  // pavement and often half in the lane).
  const stall=free(pt.x,pt.y,{roadId:road.id,radius:45});
  if(!stall)continue;
  state.cars.push(parkInStall({type:k%5,vehicleType:k%3===1?'motorcycle':'car',model:k%3===1?MOTORCYCLE_IDS[(k+Math.floor(k/3)*5)%MOTORCYCLE_IDS.length]:k===2?'ape-car-azzurra':k===5?'furgone-fritti':k%9===8?APE_CAR_IDS[(k*5)%APE_CAR_IDS.length]:k%8===1?'panda-fire-red':CAR_PARKED_SPRITE_IDS[(k*7)%CAR_PARKED_SPRITE_IDS.length]},stall));k++;
  if(state.cars.length>=Math.min(PARKED_VEHICLE_CAP,PARKED_CAR_PHASE_CAP+parkedBikeCount))break;
 }
 state.traffic=createTraffic(START_MINUTE);prepareSignals();
 state.people=createCityPedestrians();state.streetObjects=createStreetObjects();createCityLife();state.market=createMelitoMarket();
 state.dynamicCollision=makeCollisionIndex([...state.cars,...state.traffic,...state.people]);state.trafficClock=0;state.npcClockMinutes=START_MINUTE;
 $('road-count').textContent=String(state.roads.length);
 $('building-count').textContent=String(state.buildings.length);
 $('inferred-count').textContent=String(state.inferredBuildings.length);
 $('junction-count').textContent=String(state.graph.junctions);
 $('place').textContent='MELITO DI NAPOLI · MAPPA REALE';
 state.ready=true;hideLoading();{const v=satelliteFromUrl(globalThis.location?.search||'');if(v){satelliteOverlay()?.setEnabled(true);state.satellite?.setOpacity(v);}satelliteLabel();}state.last=0;canvas.focus({preventScroll:true});prepareMini();refreshCampaign();updateRoadWidthLabel();updateHud();
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

function canKnockbackMove(x,y,actor){
 if(!(validWalk(x,y)&&inside([x,y],toRing(state.map.border))))return false;
 // BF01: a shoved vehicle stops against other vehicles instead of sinking into them
 // (it may still move away from one it already touches).
 if(actor&&state.dynamicCollision&&(actor.body==='car'||state.cars.includes(actor))){
  const pose={x,y,a:actor.a,vehicleType:isMotorcycle(actor)?'motorcycle':'car',model:actor.model};
  if(trafficMoveBlocked({...actor,vehicleType:pose.vehicleType},pose,'car',state.dynamicCollision,actor))return false;
 }
 // BF01: the player's car and the parked vehicles are never shoved off the street (onto a
 // pavement or a square), where no move would be allowed any more and the car stayed stuck.
 if(actor&&state.cars.includes(actor)&&offStreetExcess(x,y,actor.a,actor)>offStreetExcess(actor.x,actor.y,actor.a,actor)+1e-6)return false;
 // BF12: a shoved vehicle stops against an enclosure wall (walkers already stop there: validWalk).
 if(actor&&state.enclosures&&(actor.body==='car'||state.cars.includes(actor))&&
  enclosureVehicleContacts(state.enclosures,{x,y,a:actor.a},bodyShape(actor),{barriers:false})>
  enclosureVehicleContacts(state.enclosures,{x:actor.x,y:actor.y,a:actor.a},bodyShape(actor),{barriers:false})+1e-9)return false;
 // Q32: nor against a pitch fence (walkers already stop there: validWalk).
 if(actor&&state.pitches&&(actor.body==='car'||state.cars.includes(actor))&&
  pitchVehicleContacts(state.pitches,{x,y,a:actor.a},bodyShape(actor))>
  pitchVehicleContacts(state.pitches,{x:actor.x,y:actor.y,a:actor.a},bodyShape(actor))+1e-9)return false;
 // Q42: nessuna spinta dentro i banchi del mercato (persone e veicoli).
 if(state.market&&actor){
  if(actor.body==='car'||state.cars.includes(actor)){if(marketBlocksVehicle(state.market,{x,y,a:actor.a},bodyShape(actor),actor))return false;}
  else if(marketBlocksWalker(state.market,x,y,.2))return false;
 }
 return true;
}
function impactTraffic(dt){
 // The index limits contacts to adjacent street cells; no quadratic scan
 // over Melito's pedestrians. Include parked cars and player on foot.
 const p=state.player;
 const actors=[...state.people,...(state.market?.people||[]),...state.traffic,...state.cars,...(p.car<0?[p]:[])];
 const nearby=makeCollisionIndex(actors);
 const active=[...state.traffic,...(p.car>=0?[state.cars[p.car]]:[])];
 for(const source of active){
  if(source.impactTime>0)continue;
  const isPlayerCar=p.car>=0&&source===state.cars[p.car];
  const from={x:source.prevX??source.x,y:source.prevY??source.y,a:source.prevA??source.a};
  const attempt=isPlayerCar?source.impactProbe:null;
  const to=attempt||{x:source.x,y:source.y,a:source.a};
  const moved=Math.hypot(source.x-from.x,source.y-from.y);
  // BF07: a car waiting at a stop line (red light, right of way) or queued behind one is not pushing
  // on: it never nudges the pedestrians who cross in front of it.
  const estimated=source.braking&&!source.jHold&&!source.redQueue?Math.min((source.speed||0)*dt,1.5):0;
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
   // BF08: an NPC car waits for the washer crossing in front of it, it does not shove him.
   if(!isPlayerCar&&target.scripted)continue;
   if(!sweptVehicleContact(source,target,from,to))continue;
   const hit=applyNonlethalImpact({...source,speed},target,speed);
   if(!hit)continue;
   if(isPlayerCar)slowImpactSource(source,speed);
   if(++hits>=3)break;
  }
  if(isPlayerCar)source.impactProbe=null;
 }
}
// BF03: only vehicles really on their way, each with its own model from the start, so the spawn
// checks use its whole body: clear of parked vehicles, of the player (on foot or at the wheel),
// of walls and of the junctions (roads.mjs), never on a street that only ends at a one-way terminal.
// BF07: semafori SIMULATI (nessun dato OSM): pali sul marciapiede degli incroci principali.
function prepareSignals(){
 const border=toRing(state.map.border);
 state.signalPosts=prepareSignalPosts(state.graph,state.graph.signals,{
  valid:(x,y)=>validWalk(x,y)&&inside([x,y],border)&&(()=>{const r=nearest(x,y,30,state.roads,true);return !r||r.distance>visualRoadWidth(r.road)/2+.35;})(),
  avoid:[...state.props.map(q=>({x:q.x,y:q.y,r:1.6})),...state.cars.map(v=>({x:v.x,y:v.y,r:3.2}))]});
 const note=$('signal-note');if(note)note.hidden=!SIGNALS_SIMULATED||!state.graph.signals?.length;
}
const signalSeconds=()=>clockSecondsFromMinutes(state.npcClockMinutes);
// BF07: freccia degli NPC che svoltano: due luci ambra sul lato della svolta, lampeggio ~1,5 Hz.
function drawBlinker(x,y,a,v){
 if(!v.turnSignal||Math.floor((state.clock+(v.seed%7)*.07)*3)%2)return;
 const moto=isMotorcycle(v),sh=vehicleShape(v),side=v.turnSignal==='right'?1:-1;
 // Sugli spigoli della sagoma di collisione, che sta dentro la carrozzeria disegnata.
 const ca=Math.cos(a),sa=Math.sin(a),along=sh.halfLength*(moto?.85:.92),out=(moto?.55:sh.halfWidth*.95)*side;
 c.fillStyle='#ffb320';
 for(const f of [1,-1])c.fillRect(x+ca*along*f-sa*out-.32,y+sa*along*f+ca*out-.32,.64,.64);
}
function trafficModel(i,type){
 return type==='motorcycle'?MOTORCYCLE_IDS[(i+Math.floor(i/4)*5)%MOTORCYCLE_IDS.length]:
  trafficApeModel(i)||(i%11===8?APE_CAR_IDS[Math.floor(i/11)%APE_CAR_IDS.length]:null)||CAR_TRAFFIC_SPRITE_IDS[(i*7)%CAR_TRAFFIC_SPRITE_IDS.length];
}
const TRAFFIC_COUNT=140;
function createTraffic(minutes){
 // Q13: as many vehicles as the hour wants (140 on a normal day, more at 8:00 and 20:00, half at night).
 const p=state.player,traffic=createAgents(state.graph,trafficTargetAt(minutes,TRAFFIC_COUNT),189,'car',state.cars,{motorcycleEvery:4,model:trafficModel,
  keepClear:[{x:p.x,y:p.y,r:14}],clear:(x,y)=>!buildingAt(x,y)});
 for(const v of traffic)v.rider=isMotorcycle(v);
 // BF09: how many vehicles drive around now; balanceTraffic brings in or lets out the difference
 // through the border gates. Q13: updateTraffic follows the hour curve (trafficTargetAt).
 state.trafficTarget=traffic.length;state.trafficMade=traffic.length;
 return traffic;
}
// BF09: a new vehicle that comes in from a border gate (same mix of models and scooters).
function newGateVehicle(){
 const i=state.trafficMade++,type=i%4===2?'motorcycle':'car';
 const v=createGateVehicle(state.graph,189+i*17,{vehicleType:type,model:trafficModel(i,type)});
 v.rider=type==='motorcycle';return v;
}
function updateTraffic(dt){
 state.trafficClock+=dt;
 if(state.trafficClock<.05)return;
 const elapsed=.05;state.trafficClock-=elapsed;
 for(const door of state.doors||[])if(door.open>0)door.open=Math.max(0,door.open-elapsed);
 for(const agent of [...state.people,...state.traffic]){
  agent.prevX=agent.x;agent.prevY=agent.y;agent.prevA=agent.a;
  advanceNonlethalImpact(agent,elapsed,canKnockbackMove);
 }
 const halfW=canvas.clientWidth/(2*state.zoom),halfH=canvas.clientHeight/(2*state.zoom);
 const view=[state.camera.x-halfW,state.camera.y-halfH,state.camera.x+halfW,state.camera.y+halfH];
 const p=state.player,playerVehicle=p.car>=0?state.cars[p.car]:null;
 // Q13: passers-by far from the player wait still (no cost); fewer or more around the player by zone and hour,
 // always moved outside the camera.
 stepDensity(state.density,elapsed,{people:state.people,graph:state.graph,weights:state.walkWeights,view,
  camera:state.camera,minutes:state.npcClockMinutes,canStand,index:state.dynamicCollision,doors:state.doors});
 // moving vehicles: traffic, ridden scooters, the player's vehicle and any parked one shoved into motion
 const moving=[...state.traffic,...(state.commuters||[]).filter(c=>c.bike.rider).map(c=>c.bike),
  ...state.cars.filter(v=>v===playerVehicle||Math.abs(v.speed||0)>1.5)];
 const life={graph:state.graph,people:state.people,vehicles:moving,
  parked:state.cars,shops:state.shops||[],canStand,onRoad:onCarriageway,playerVehicle,focus:p,focusRadius:150,dt:elapsed,
  say:(agent,text)=>state.events&&cityEventBubble(state.events,agent,text)};
 stepAgents(state.graph,state.people.filter(a=>!a.frozen),elapsed,state.player,{parked:state.cars,traffic:state.traffic,view,validRecovery:canKnockbackMove,npcClockMinutes:state.npcClockMinutes,
  kerbWait:agent=>kerbWait(state.reactions,agent,state.graph,life)});
 // Q13: rush hours. The hour curve sets how many vehicles drive; BF09 balanceTraffic is the one place
 // that adds and removes them, through the border gates.
 state.trafficTarget=trafficTargetAt(state.npcClockMinutes,TRAFFIC_COUNT);
 stepAgents(state.graph,state.traffic,elapsed,state.player,{parked:state.cars,people:state.people,view,validRecovery:canKnockbackMove,npcClockMinutes:state.npcClockMinutes});
 balanceTraffic(state.graph,state.traffic,state.trafficTarget,{view},newGateVehicle);
 impactTraffic(elapsed);
 // BF08: lavavetri ai semafori, dopo il traffico dello stesso passo (le auto sono appena ferme o ripartite).
 const pc=state.player.car>=0?state.cars[state.player.car]:null;
 const washCtx={graph:state.graph,signalSeconds:signalSeconds(),traffic:state.traffic,playerCar:pc&&!isMotorcycle(pc)?pc:null,
  index:state.dynamicCollision,say:(agent,text)=>cityEventBubble(state.events,agent,text)};
 for(const w of state.people)if(w.washer)stepWasher(w,elapsed,washCtx);
 stepReactions(state.reactions,elapsed,life);
 // Q13: an NPC car blocked by the player or by a pedestrian on the road sounds its horn (with limits).
 const honker=pickBlockedHorn(state.reactions,state.traffic,{player:p,playerVehicle,onRoad:onCarriageway});
 if(honker){
  state.hornAlarm={x:honker.x,y:honker.y,t:state.social?.clock??0};
  state.reactions.alarm={x:honker.x,y:honker.y,t:state.reactions.clock};
  const d=Math.hypot(honker.x-p.x,honker.y-p.y);
  cityAudio.horn(honker.vehicleType==='motorcycle'?'moto':'auto',clamp((honker.x-p.x)/40,-1,1),(1-d/60)*.8);
 }
 for(const agent of [...state.people,...state.traffic])if(Math.hypot(agent.x-agent.prevX,agent.y-agent.prevY)>15){
  agent.prevX=agent.x;agent.prevY=agent.y;agent.prevA=agent.a;
 }
 state.dynamicCollision=makeCollisionIndex([...state.cars,...state.traffic,...state.people]);
}
function interiorZoom(){
 return targetCameraZoom({inVehicle:false,moving:false},state.zoomBias)*BANK_FOOT_ZOOM_MULTIPLIER;
}
const SHOP_KINDS={bar:'BAR',cafe:'CAFFETTERIA',pastry:'PASTICCERIA',bakery:'PANIFICIO',supermarket:'SUPERMERCATO',convenience:'ALIMENTARI',stationery:'CARTOLERIA',hairdresser:'PARRUCCHIERE'};
// Q06/Q17: the closest counter on foot, a named OSM shop or the counter of a food truck.
function nearestCounter(p){
 const shop=nearestShop(state.shops,p),stall=nearestShop(state.vendorShops,p);
 if(!shop||!stall)return shop||stall;
 return Math.hypot(stall.x-p.x,stall.y-p.y)<Math.hypot(shop.x-p.x,shop.y-p.y)?stall:shop;
}
function openShop(shop){
 state.shopOpen=shop;
 for(const key of Object.keys(pressed))pressed[key]=false;stick.x=0;stick.y=0;
 $('shop-kind').textContent=(shop.vendor?'AMBULANTE':SHOP_KINDS[shop.kind]||'NEGOZIO')+' · MELITO';
 $('shop-name').textContent=shop.name.toUpperCase();$('shop-note').textContent=shopNote(shop);
 $('shop-feedback').textContent='';$('shop-feedback').classList.remove('err');
 renderShop();$('shop-panel').hidden=false;
}
function renderShop(){
 const shop=state.shopOpen,money=state.progress?.money??0;if(!shop)return;
 $('shop-balance').textContent='SALDO: € '+money;
 const list=$('shop-offers');list.textContent='';
 offersFor(shop.kind).forEach((offer,i)=>{
  const button=document.createElement('button');button.type='button';button.dataset.offer=offer.id;
  button.className=money>=offer.price?'':'poor';
  const label=document.createElement('span');label.textContent=(i+1)+' · '+offer.name;
  const price=document.createElement('span');price.textContent='€ '+offer.price;
  button.append(label,price);button.addEventListener('click',()=>buyFromShop(offer.id));list.append(button);
 });
}
function buyFromShop(offerId){
 const shop=state.shopOpen;if(!shop||!state.progress)return;
 const result=buyOffer(state.progress,offerId,shop);
 if(result.ok){
  saveProgress(localStorage,state.progress);refreshCampaign();
  state.boost=addBoost(state.boost,result.offer,state.clock);
 }
 $('shop-feedback').textContent=purchaseMessage(result);$('shop-feedback').classList.toggle('err',!result.ok);
 renderShop();updateHud();
}
function closeShop(){state.shopOpen=null;$('shop-panel').hidden=true;canvas.focus?.({preventScroll:true});updateHud();}
function toggleVehicle(){
 if(!state.ready)return;
 if(state.shopOpen){closeShop();return;}
 const p=state.player;
 if(state.bankInterior){
  const interior=state.bankInterior;state.bankInterior=null;
  p.x=interior.outside.x;p.y=interior.outside.y;p.a=interior.outside.a;
  state.camera.x=p.x;state.camera.y=p.y;updateHud();return;
 }
 if(p.car<0){
  // Q05: picking up or giving back a lost item comes before doors and vehicles.
  const event=interactCityEvent(state.events,p);
  if(event){
   if(event.type==='returned'&&state.progress){
    state.progress.money+=event.reward;saveProgress(localStorage,state.progress);refreshCampaign();
    cityEventBubble(state.events,p,'+'+event.reward+' €');
   }else cityEventBubble(state.events,p,'Preso!');
   updateHud();return;
  }
  // Q06: next to the awning of a named OSM shop the action opens its counter.
  const shop=nearestCounter(p);
  if(shop){openShop(shop);return;}
  // Q32: at the gate (or inside the lines) of a calcetto pitch.
  const pitch=pitchHotspot(state.pitches,p.x,p.y);
  if(pitch){openFootballMatch(pitch);return;}
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
// How far a vehicle body is off the drivable street (0 = fully on it): every probe outside the
// border, without a street, beyond the drivable kerb or on a building corner adds to it.
function offStreetExcess(x,y,a,vehicle){
 // Both classes stay within the OSM road; scooters use narrow side probes.
 const dirx=Math.cos(a),diry=Math.sin(a),bike=isMotorcycle(vehicle);
 // Q16: an Ape probes the street with its own body (same proportions as the car probes), so it fits lanes a car does not.
 const ape=isApe(vehicle),k=ape?vehicleShape(vehicle):null;
 const forwards=bike?[-2.25,0,2.25]:ape?[-k.halfLength*.83,0,k.halfLength*1.08]:[-2.6,0,3.4];
 const sides=bike?[-.85,.85]:ape?[-k.halfWidth,k.halfWidth]:[-1.7,1.7];
 let excess=0;
 for(const forward of forwards)for(const side of sides){
  const px=x+dirx*forward-diry*side,py=y+diry*forward+dirx*side;
  if(!inside([px,py],toRing(state.map.border))){excess+=100;continue;}
  const road=nearest(px,py,25,state.roads,true);
  if(!road){excess+=50;continue;}
  const width=visualRoadWidth(road.road),over=road.distance-(width/2+SIDEWALK_DRIVE);
  if(over>0)excess+=1+over;
  else if(!canDriveProbe(road.distance,width,road.distance>width/2-.55&&buildingAt(px,py)))excess+=1;
 }
 return excess;
}
function carBlocked(x,y,a,which,vehicle=state.cars[which]){
 const bike=isMotorcycle(vehicle),off=offStreetExcess(x,y,a,vehicle);
 // BF01: a vehicle that ended up off the street (a shove onto the pavement, an old save) may
 // always make the move that brings it back towards the road, never one that takes it further.
 if(off>0&&!(Number.isFinite(vehicle?.x)&&off<offStreetExcess(vehicle.x,vehicle.y,vehicle.a,vehicle)-1e-6))return true;
 // Q07: cast-iron bollards stop the car like a wall.
 // Q42: anche i banchi del mercato (non gli ombrelloni); come BF01, ci si può sempre allontanare.
 if(state.market&&marketBlocksVehicle(state.market,{x,y,a},bodyShape(vehicle),vehicle))return true;
 if(state.streetObjects&&bollardBlocksVehicle(state.streetObjects,{x,y,a},bodyShape(vehicle)))return true;
 // BF12: enclosure walls, booths and (at night) the barriers of private gates; like BF01, a vehicle
 // already touching a wall may always make the move that frees it.
 if(state.enclosures){
  const hit=enclosureVehicleContacts(state.enclosures,{x,y,a},bodyShape(vehicle),enclosureTime());
  if(hit>0&&!(Number.isFinite(vehicle?.x)&&hit<=enclosureVehicleContacts(state.enclosures,{x:vehicle.x,y:vehicle.y,a:vehicle.a},bodyShape(vehicle),enclosureTime())+1e-9))return true;
 }
 // Q32: pitch fences and goals, same rule (a vehicle touching one may always move away from it).
 if(state.pitches){
  const hit=pitchVehicleContacts(state.pitches,{x,y,a},bodyShape(vehicle));
  if(hit>0&&!(Number.isFinite(vehicle?.x)&&hit<=pitchVehicleContacts(state.pitches,{x:vehicle.x,y:vehicle.y,a:vehicle.a},bodyShape(vehicle))+1e-9))return true;
 }
 // BF01: touching another vehicle already (after a crash), every move that separates them is
 // allowed: the player can always reverse or steer away instead of staying pinned.
 if(!state.dynamicCollision)return false;
 const type=bike?'motorcycle':'car',pose={x,y,a,vehicleType:type,model:vehicle?.model};
 return vehicle?trafficMoveBlocked({...vehicle,vehicleType:type},pose,'car',state.dynamicCollision,vehicle):
  !!collidesWithTraffic(pose,'car',state.dynamicCollision,null);
}
function toRing(border){
 if(state.borderRing)return state.borderRing;
 state.borderRing=[];
 for(let i=0;i<border.length;i+=2)state.borderRing.push([border[i],border[i+1]]);
 return state.borderRing;
}
// Q10: tyre marks of a slide, two rear wheels (one for a bike), fading in 8 s.
const SKID_LIFE=8,SKID_MAX=180;
function addSkidMarks(car){
 const bike=isMotorcycle(car),back=bike?2.1:2.3,side=bike?[0]:[-1.2,1.2],ca=Math.cos(car.a),sa=Math.sin(car.a);
 state.skids||=[];
 for(const k of side){
  const x=car.x-ca*back-sa*k,y=car.y-sa*back+ca*k,last=car.lastSkid?.[k];
  if(last&&Math.hypot(x-last.x,y-last.y)<6)state.skids.push({x0:last.x,y0:last.y,x1:x,y1:y,t:state.clock,w:bike?.32:.42});
  (car.lastSkid||={})[k]={x,y,t:state.clock};
 }
 if(state.skids.length>SKID_MAX)state.skids.splice(0,state.skids.length-SKID_MAX);
}
function drawSkidMarks([x0,y0,x1,y1]){
 if(!state.skids?.length)return;
 state.skids=state.skids.filter(s=>state.clock-s.t<SKID_LIFE);
 c.save();c.lineCap='round';c.strokeStyle='#121616';
 for(const s of state.skids){
  if(Math.max(s.x0,s.x1)<x0||Math.min(s.x0,s.x1)>x1||Math.max(s.y0,s.y1)<y0||Math.min(s.y0,s.y1)>y1)continue;
  c.globalAlpha=.5*(1-(state.clock-s.t)/SKID_LIFE);c.lineWidth=s.w;
  c.beginPath();c.moveTo(s.x0,s.y0);c.lineTo(s.x1,s.y1);c.stroke();
 }
 c.restore();
}
function tick(dt){
 if(!state.ready)return;
 if(state.mapOpen||!$('dialog').hidden||!$('pause-menu').hidden||state.shopOpen){
  for(const key of Object.keys(pressed))pressed[key]=false;
  stick.x=0;stick.y=0;
  return;
 }
 // Q02: in banca gli NPC non vengono simulati, quindi anche il loro orologio resta fermo.
 state.npcClockMinutes=advanceNpcClock(state.npcClockMinutes,dt,{interior:!!state.bankInterior});
 state.weather=weatherAt(state.npcClockMinutes,{forced:state.preview?.weather||FORCED_WEATHER});
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
   // Q10: each model has its own handling; wet roads (Q08) brake a little longer.
   ({speed,angle}=(isMotorcycle(car)?stepMotorcycle:stepDriving)(car.speed||0,car.a,axes,pressed.handbrake,dt,pressed.brake,handlingProfile(car),state.weather?.wetness||0));
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
  // Q10: the body points where the wheel says, but it travels where grip allows (recoverable slides).
  const grip=car.recoil>0?{travel:car.a,slip:0,speed,sliding:false}:
   applyGrip(car,{angle:car.a,speed,dt,handbrake:pressed.handbrake,profile:handlingProfile(car),wet:state.weather?.wetness||0,steer:axes.x});
  car.travel=grip.travel;car.slip=grip.slip;speed=grip.speed;
  if(grip.sliding&&speed>8)addSkidMarks(car);
  const nx=car.x+Math.cos(car.travel)*speed*dt,ny=car.y+Math.sin(car.travel)*speed*dt;
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
  }else{
   // BF01: an NPC car standing in the way while the player drives into it is asked to back off.
   const type=isMotorcycle(car)?'motorcycle':'car';
   const way=Math.abs(speed)>.3&&state.dynamicCollision&&trafficMoveBlocker({...car,vehicleType:type},
    {x:nx,y:ny,a:car.a,vehicleType:type,model:car.model},'car',state.dynamicCollision,car);
   if(way&&way.body==='car'&&way.edge!=null)way.yieldToPlayer=1.5;
   if(car.recoil>0){speed=0;car.recoil=0;car.turnGuide=null;}
   else{
    const bounce=reboundCar(car,speed,previousAngle,(x,y,a)=>carBlocked(x,y,a,p.car));
    car.x=bounce.x;car.y=bounce.y;car.a=bounce.angle;car.travel=bounce.angle;car.slip=0;
    speed=bounce.speed;car.recoil=bounce.recoil;car.turnGuide=null;car.assistRelease=.25;
   }
  }
  car.speed=speed;p.x=car.x;p.y=car.y;p.a=car.a;
  }
 }else{
  const axis=moveAxes(),dx=axis.x,dy=axis.y;
  if(!(p.impactTime>0))advanceNonlethalImpact(p,dt,canKnockbackMove);
  if(p.impactTime>0){
   advanceNonlethalImpact(p,dt,canKnockbackMove);
  }else if(Math.hypot(dx,dy)>.08){
   const len=Math.hypot(dx,dy),v=(pressed.run?RUN_SPEED:WALK_SPEED)*Math.min(1,len)*boostFactor(state.boost,state.clock),nx=p.x+dx/len*v*dt,ny=p.y+dy/len*v*dt;
   const post=(x,y)=>state.streetObjects&&bollardBlocksWalker(state.streetObjects,x,y)||marketBlocksWalker(state.market,x,y);
   if(validWalk(nx,p.y)&&inside([nx,p.y],toRing(state.map.border))&&!post(nx,p.y))p.x=nx;
   if(validWalk(p.x,ny)&&inside([p.x,ny],toRing(state.map.border))&&!post(p.x,ny))p.y=ny;
   p.a=Math.atan2(dy,dx);state.distance+=v*dt;
  }
 }
 // Parked vehicles can be shoved by faster vehicles but cannot disappear.
 for(const car of state.cars)if(car!==state.cars[p.car])
  advanceNonlethalImpact(car,dt,canKnockbackMove);
 updateTraffic(dt);
 stepCommuters(dt);
 stepStreetPhysics(dt);
 stepMelitoMarket(dt);
 const screen=visibleBounds(),inset=18+4;
 const signal=stepCityEvents(state.events,dt,{people:state.people,graph:state.graph,
  player:{x:p.x,y:p.y,onFoot:p.car<0},view:[screen[0]+inset,screen[1]+inset,screen[2]-inset,screen[3]-inset],
  allowed:!state.progress||state.progress.remaining===null});
 if(signal)updateHud();
 if(state.social){
  const view=visibleBounds(),vehicles=state.traffic.filter(v=>v.body==='car').map(v=>({x:v.x,y:v.y,speed:v.braking?0:v.speed}));
  if(p.car>=0)vehicles.push({x:state.cars[p.car].x,y:state.cars[p.car].y,speed:state.cars[p.car].speed});
  stepSocial(state.social,dt,{people:state.people,graph:state.graph,view,vehicles,alarm:state.hornAlarm,
   rain:state.weather?.rain||0,night:(state.light?.darkness||0)/NIGHT_DARKNESS,say:(agent,text)=>cityEventBubble(state.events,agent,text),
   onRoad:(x,y)=>{const r=nearest(x,y,30,state.roads,true);return !!r&&r.distance<visualRoadWidth(r.road)/2+.3;}});
 }
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
 state.graph=buildRoadGraph(state.roads,{border:state.map.border,gateClear:(x,y)=>!buildingAt(x,y),laneClear:(x,y)=>!buildingAt(x,y)});state.streetObjects=null;createPitches();createEnclosures();createParkingBays();
 state.traffic=createTraffic(state.npcClockMinutes);prepareSignals();
 state.people=createCityPedestrians();state.streetObjects=createStreetObjects();createCityLife();state.market=createMelitoMarket();
 state.dynamicCollision=makeCollisionIndex([...state.cars,...state.traffic,...state.people]);state.trafficClock=0;
 state.props=buildStreetProps(state.roads).filter(obj=>!buildingAt(obj.x,obj.y));
 state.propsGrid=makeIndex(state.props);
 state.shops=prepareStorefronts(state.map.pois||[],state.roads);
 state.shopGrid=makeIndex(state.shops);
 updateRoadWidthLabel();
 roofReveal.clear();
}

function updateHud(){
 const npcClockLabel=$('npc-clock');if(npcClockLabel)npcClockLabel.textContent=npcWeekday(state.npcClockMinutes)+' · '+formatNpcClock(state.npcClockMinutes)+(state.weather?' · '+state.weather.label:'');
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
  boardPrompt('ESCI DALLA BANCA');
  $('camera-mode').textContent='INTERNO · '+interiorZoom().toFixed(1)+'×';return;
 }
 const boostLeft=boostSecondsLeft(state.boost,state.clock);
 $('vehicle').textContent=p.car>=0?(isMotorcycle(state.cars[p.car])?'MOTO · ':'AUTO · ')+Math.round(Math.abs(state.cars[p.car].speed)*3.6)+' KM/H':'A PIEDI'+(boostLeft?' · CARICO '+boostLeft+' S':'');
 const n=state.roadGrid?nearest(p.x,p.y,70):null;
 // Q32: a short notice (e.g. the calcetto gate) wins over the street name for a few seconds.
 if(state.notice&&state.clock<state.notice.until)$('street').textContent=state.notice.text;
 else if(n&&n.road.n)$('street').textContent=n.road.n.toUpperCase();
 else if(n)$('street').textContent='STRADA SENZA NOME · OSM';
 const bank= p.car<0?nearestBankEntrance(state.bankEntrances,p):null;
 const eventAction=p.car<0?cityEventAction(state.events,p):null;
 const shopNear=p.car<0&&!eventAction?nearestCounter(p):null;
 const enterable=p.car<0?nearestEnterableVehicle(state.cars,p):null;
 const pitchNear=p.car<0&&!eventAction&&!shopNear?pitchHotspot(state.pitches,p.x,p.y):null;
 $('action').textContent=eventAction||(shopNear?'COMPRA':pitchNear?'GIOCA A CALCETTO':bank?'ENTRA IN BANCA':p.car>=0?'SCENDI':enterable?.bike?'SALTA IN SELLA':'ENTRA IN AUTO');
 // Q15: on foot with nothing in reach the touch button is shown dimmed (it used to invite to get into a
 // car that was not there; the tap then only said to get closer to a vehicle).
 const idle=p.car<0&&!eventAction&&!shopNear&&!pitchNear&&!bank&&!enterable;
 $('action').classList.toggle('idle',idle);$('action').setAttribute('aria-disabled',idle?'true':'false');
 boardPrompt(p.car>=0?'':eventAction||(shopNear?(shopNear.vendor?'COMPRA · '+shopNear.name.toUpperCase():'COMPRA'):pitchNear?'GIOCA A CALCETTO':bank?'ENTRA IN BANCA':enterable?(enterable.bike?'SALTA IN SELLA':'ENTRA IN AUTO'):''));
 $('sprint').textContent='CORRI';
 $('sprint').setAttribute('aria-label','Corri');
 const axis=moveAxes(),moving=Math.hypot(axis.x,axis.y)>.08;
 const status={inVehicle:p.car>=0,
  speed:p.car>=0?Math.abs(state.cars[p.car].speed):moving?(pressed.run?RUN_SPEED:WALK_SPEED):0,
  running:pressed.run,moving:!!moving};
 $('camera-mode').textContent=describeCameraZoom(status)+' · '+state.zoom.toFixed(1)+'×';
}
// BF11: on a PC the board shows the E key only when something can really be done right here.
function boardPrompt(label){
 const el=$('pc-prompt');if(!el)return;
 const text=label?'E · '+label:'';
 if(el.textContent!==text)el.textContent=text;
 el.hidden=!label;
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
// BF09: the municipal border as a path, for the straight cut of the streets and the gate mouths.
function borderPath(ctx,outside=false){
 const b=state.map.border;ctx.beginPath();
 if(outside)ctx.rect(-1e5,-1e5,2e5,2e5);
 ctx.moveTo(b[0],b[1]);for(let i=2;i<b.length;i+=2)ctx.lineTo(b[i],b[i+1]);ctx.closePath();
}
// Only areas near the border pay for the clip (a clipped stroke is slower to paint).
function nearBorder(x0,y0,x1,y1,margin=12){
 const ring=state.borderRingXY||(state.borderRingXY=borderRing(state.map.border));
 return distanceToBorder((x0+x1)/2,(y0+y1)/2,ring)<Math.hypot(x1-x0,y1-y0)/2+margin;
}
function drawGateMouths(ctx,[x0,y0,x1,y1]){
 const pad=GATE_RULES.mouth+20,gates=(state.graph?.gates||[]).filter(g=>g.x>x0-pad&&g.x<x1+pad&&g.y>y0-pad&&g.y<y1+pad);
 if(!gates.length)return;
 ctx.save();borderPath(ctx,true);ctx.clip('evenodd');drawBorderGates(ctx,gates);ctx.restore();
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
 // BF09: streets end with a straight cut along the border (no round caps over the dark), then a
 // trapezoid mouth fades each gate road into the next town.
 if(nearBorder(x0,y0,x1,y1,GATE_RULES.mouth+4)){ctx.save();borderPath(ctx);ctx.clip();drawCityStreets(ctx,roads,zoom);ctx.restore();drawGateMouths(ctx,bounds);}
 else drawCityStreets(ctx,roads,zoom);
 if(state.parkingBays)drawParkingBays(ctx,query(state.parkingBays.strips,state.bayGrid,x0,y0,x1,y1),zoom);
 drawPitches(ctx,state.pitches,bounds,zoom);
 drawEnclosureWalls(ctx,state.enclosures,bounds,zoom);
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
  if(person.indoors||person.x<x0-12||person.x>x1+12||person.y<y0-12||person.y>y1+12)continue;
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
  if(nearBorder(art.x0-22,art.y0-22,art.x1+22,art.y1+22)){ctx.save();borderPath(ctx);ctx.clip();drawCityStreets(ctx,roads,state.zoom);ctx.restore();}
  else drawCityStreets(ctx,roads,state.zoom);
  if(state.parkingBays)drawParkingBays(ctx,query(state.parkingBays.strips,state.bayGrid,art.x0-22,art.y0-22,art.x1+22,art.y1+22),state.zoom);
  drawPitches(ctx,state.pitches,[art.x0-22,art.y0-22,art.x1+22,art.y1+22],state.zoom);
  drawEnclosureWalls(ctx,state.enclosures,[art.x0-22,art.y0-22,art.x1+22,art.y1+22],state.zoom);
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
// Q08: wet asphalt as a cached mask per tile: roads minus everything a building covers,
// so the darker wet tone never paints over a roof lifted above the street.
const wetTiles=new Map(),WET_PIXELS=2;
function wetTile(tx,ty){
 const key=tx+','+ty;
 if(wetTiles.has(key)){const tile=wetTiles.get(key);wetTiles.delete(key);wetTiles.set(key,tile);return tile;}
 const x=tx*STATIC_TILE,y=ty*STATIC_TILE,layer=document.createElement('canvas');
 layer.width=layer.height=STATIC_TILE*WET_PIXELS;
 const g=layer.getContext('2d');g.setTransform(WET_PIXELS,0,0,WET_PIXELS,-x*WET_PIXELS,-y*WET_PIXELS);
 const x0=x-TILE_BLEED,y0=y-TILE_BLEED,x1=x+STATIC_TILE+TILE_BLEED,y1=y+STATIC_TILE+TILE_BLEED;
 g.lineCap='round';g.lineJoin='round';g.strokeStyle='#0a1a28';
 g.save();if(nearBorder(x0,y0,x1,y1)){borderPath(g);g.clip();}
 for(const road of query(state.roads,state.roadGrid,x0,y0,x1,y1)){
  if(!DRIVE.has(road.t))continue;
  g.beginPath();g.moveTo(road.p[0],road.p[1]);for(let i=2;i<road.p.length;i+=2)g.lineTo(road.p[i],road.p[i+1]);
  g.lineWidth=Math.max(1,visualRoadWidth(road)-.5);g.stroke();
 }
 g.restore();
 g.globalCompositeOperation='destination-out';g.fillStyle='#000';
 for(const b of [...query(state.buildings,state.buildingGrid,x0,y0,x1+20,y1+20),...query(state.inferredBuildings,state.inferredGrid,x0,y0,x1+20,y1+20)]){
  const p=b.p,v=buildingVolume(b),shift=v?[[0,0],[v.dx,v.dy]]:[[0,0]];
  for(const [sx,sy] of shift){g.beginPath();g.moveTo(p[0]-sx,p[1]-sy);for(let i=2;i<p.length;i+=2)g.lineTo(p[i]-sx,p[i+1]-sy);g.closePath();g.fill();}
  if(v)for(let i=2;i<p.length;i+=2){g.beginPath();g.moveTo(p[i-2],p[i-1]);g.lineTo(p[i],p[i+1]);g.lineTo(p[i]-v.dx,p[i+1]-v.dy);g.lineTo(p[i-2]-v.dx,p[i-1]-v.dy);g.closePath();g.fill();}
 }
 const tile={canvas:layer,x,y};wetTiles.set(key,tile);
 while(wetTiles.size>48)wetTiles.delete(wetTiles.keys().next().value);
 return tile;
}
function drawWetTiles(bounds,wetness){
 const [x0,y0,x1,y1]=bounds;
 c.save();c.globalAlpha=.5*wetness;c.imageSmoothingEnabled=true;
 for(let ty=Math.floor(y0/STATIC_TILE);ty<=Math.floor(y1/STATIC_TILE);ty++)
  for(let tx=Math.floor(x0/STATIC_TILE);tx<=Math.floor(x1/STATIC_TILE);tx++){
   const tile=wetTile(tx,ty);c.drawImage(tile.canvas,tile.x,tile.y,STATIC_TILE,STATIC_TILE);
  }
 c.restore();
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
 const weather=state.weather;
 if(weather&&weather.wetness>.01){
  drawWetTiles([state.camera.x-halfW,state.camera.y-halfH,state.camera.x+halfW,state.camera.y+halfH],weather.wetness);
  drawPuddles(c,state.puddles||[],[x0,y0,x1,y1],weather.wetness,weather.rain,state.clock);
 }
 drawStopLines(c,state.graph.signals,[x0,y0,x1,y1],state.zoom);
 drawMarketGround(c,state.market,[x0,y0,x1,y1],state.zoom);
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
 if(state.doorGrid){
  const doors=query(state.doors,state.doorGrid,x0,y0,x1,y1);
  drawDoorSteps(c,doors,state.zoom);drawDoorFronts(c,doors,state.zoom);
 }
 drawSkidMarks([x0,y0,x1,y1]);
 drawStreetObjects(c,state.streetObjects,[x0,y0,x1,y1],state.zoom);
 drawEnclosureGates(c,state.enclosures,[x0,y0,x1,y1],state.zoom,{...enclosureTime(),clock:state.clock});
 drawMarketStalls(c,state.market,[x0,y0,x1,y1],state.clock);
 if(state.weather?.wetness>.12)for(const b of buildings)if(b.art?.ruinPool)drawRuinPoolPuddles(c,b,state.weather.wetness,state.clock);
 drawLostItem(c,state.events,state.player.car<0?state.player:null,state.clock);
 // BF08: un lavavetri al finestrino si disegna sopra l'auto se le sta davanti (più in basso sullo
 // schermo): per questo disegno è saltato qui (indoors solo durante la chiamata) e ridisegnato dopo le auto.
 const inFront=state.people.filter(q=>q.scripted&&q.washer?.car&&!q.indoors&&q.y>q.washer.car.y);
 for(const q of inFront)q.indoors=true;
 drawCityPeople(c,state.people,state.graph,state.clock,[x0,y0,x1,y1],alpha);
 if(state.market)drawCityPeople(c,state.market.people,state.graph,state.clock,[x0,y0,x1,y1],alpha);
 for(const q of inFront)q.indoors=false;
 if(weather&&weather.rain>.3)for(const person of [...state.people,...(state.market?.people||[]).filter(q=>!q.sheltered)]){
  if(person.indoors||person.x<x0||person.x>x1||person.y<y0||person.y>y1)continue;
  drawUmbrella(c,person.prevX===undefined?person.x:person.prevX+(person.x-person.prevX)*alpha,
   person.prevY===undefined?person.y:person.prevY+(person.y-person.prevY)*alpha,person,weather.rain);
 }
 for(const ai of state.traffic)if(ai.x>=x0&&ai.x<=x1&&ai.y>=y0&&ai.y<=y1){
  const x=ai.prevX===undefined?ai.x:ai.prevX+(ai.x-ai.prevX)*alpha;
  const y=ai.prevY===undefined?ai.y:ai.prevY+(ai.y-ai.prevY)*alpha;
  const a=ai.prevA===undefined?ai.a:ai.prevA+Math.atan2(Math.sin(ai.a-ai.prevA),Math.cos(ai.a-ai.prevA))*alpha;
  // BF09: beyond a border gate the vehicle fades into the dark (or comes out of it).
  const fade=ai.gateFade??1;if(fade<=.01)continue;
  if(fade<1){c.save();c.globalAlpha=fade;drawCar(x,y,a,ai.kind,false,ai.model,ai);drawBlinker(x,y,a,ai);c.restore();}
  else{drawCar(x,y,a,ai.kind,false,ai.model,ai);drawBlinker(x,y,a,ai);}
 }
 state.cars.forEach((v,i)=>{if(v.x>=x0&&v.x<=x1&&v.y>=y0&&v.y<=y1)drawCar(v.x,v.y,v.a,v.type,i===p.car,v.model,v);});
 drawPlayer();
 // Q42: ombrelloni del mercato sopra persone e veicoli; sfumano col giocatore sotto (R01, come i tetti).
 if(state.market){
  const pc=p.car>=0?state.cars[p.car]:null;
  stepParasolReveal(state.market,[pc?{x:pc.x,y:pc.y,radius:3}:{x:p.x,y:p.y,radius:.6}],dt);
  drawMarketParasols(c,state.market,[x0,y0,x1,y1],state.clock,{rain:weather?.rain||0});
 }
 if(inFront.length)drawCityPeople(c,inFront,state.graph,state.clock,[x0,y0,x1,y1],alpha);
 drawWasherEffects(c,state.people,state.clock);
 drawSignals(c,state.graph.signals,[x0,y0,x1,y1],signalSeconds(),state.zoom);
 // BF12: the water tower stands above the city; it fades while the player is under or beside it.
 for(const t of state.waterTowers||[]){
  if(t.x<x0-70||t.x>x1+70||t.y<y0-70||t.y>y1+70)continue;
  const target=towerRevealTarget(t,[p.car>=0?state.cars[p.car]:p]),now=state.towerReveal.get(t.id)??1;
  const eased=now+(target-now)*Math.min(1,(dt||0)*6);state.towerReveal.set(t.id,eased);
  drawWaterTower(c,t,{alpha:eased,zoom:state.zoom});
 }
 if(weather&&weather.cloud>.02)drawCloudShadows(c,[x0,y0,x1,y1],weather.cloud,state.clock);
 // Q04: night falls on the world, while hints and the bank marker stay readable above it.
 drawNightLighting([x0,y0,x1,y1],[...buildings,...query(state.inferredBuildings,state.inferredGrid,x0,y0,x1,y1)],ratio,cw,ch,dt);
 for(const t of state.waterTowers||[])drawWaterTowerLight(c,t,{darkness:state.light?.darkness||0,clock:state.clock,alpha:state.towerReveal.get(t.id)??1});
 if(weather&&weather.rain>.02)drawRain(c,state.clock,canvas.width,canvas.height,weather.rain);
 drawCityEventOverlay(c,state.events,state.player.car<0?state.player:null,state.zoom);
 drawParkedMotorcycleHints();
 for(const bank of state.bankEntrances)if(bank.x>=x0&&bank.x<=x1&&bank.y>=y0&&bank.y<=y1)drawBankEntrance(c,bank,state.clock);
 // BF13: foto aerea di confronto sopra tutta la scena, in trasparenza (spenta: nessun costo).
 if(state.satellite?.enabled)state.satellite.draw(c,[x0,y0,x1,y1],state.zoom);
}
const lightMap=document.createElement('canvas');
const LAMP_KINDS=new Set([5,6,13]);
function drawNightLighting([x0,y0,x1,y1],buildings,ratio,cw,ch,dt){
 const light=combineWeather(daylightAt(state.npcClockMinutes),state.weather);state.light=light;
 if(light.darkness<.004)return;
 if(dt>0){state.nightFrame=(state.nightFrame||1/60)*.95+dt*.05;state.nightQuality=nightQuality(state.nightQuality,state.nightFrame);}
 const lights=[],glows=[],pad=14,p=state.player;
 if(light.lamps>0){
  for(const prop of query(state.props,state.propsGrid,x0-pad,y0-pad,x1+pad,y1+pad)){
   if(!LAMP_KINDS.has(prop.kind))continue;
   // Pool of light on the pavement under the lamp head, plus the warm bulb itself.
   lights.push({x:prop.x+.4,y:prop.y+.8,r:10,strength:light.lamps});
   glows.push({x:prop.x,y:prop.y-5.9,r:2.4,strength:light.lamps,alpha:.8},{x:prop.x+.4,y:prop.y+.8,r:7.5,strength:light.lamps,alpha:.1});
   // Q08: on wet ground the lamp is mirrored as a warm smear below it.
   if(state.weather?.wetness>.2)glows.push({x:prop.x+.4,y:prop.y+2.2,r:3.2,strength:light.lamps*state.weather.wetness,alpha:.22},{x:prop.x+.4,y:prop.y+4.2,r:2.2,strength:light.lamps*state.weather.wetness,alpha:.14});
  }
  for(const door of state.doorGrid?query(state.doors,state.doorGrid,x0,y0,x1,y1):[])
   if(door.open>0)lights.push({x:door.x+door.nx*.6,y:door.y+door.ny*.6,r:3.4,strength:light.lamps});
 }
 if(light.headlights>0){
  const driven=state.traffic.filter(v=>v.body==='car');
  if(p.car>=0&&state.cars[p.car])driven.push(state.cars[p.car]);
  for(const c of state.commuters||[])if(c.bike.rider)driven.push(c.bike);
  for(const v of driven){
   if(v.x<x0-pad||v.x>x1+pad||v.y<y0-pad||v.y>y1+pad)continue;
   const kind={x:v.x,y:v.y,a:v.a,vehicleType:isMotorcycle(v)?'motorcycle':'car'},fade=v.gateFade??1;
   if(fade<=.01)continue;
   lights.push(...headlightLights(kind,light.headlights*fade));glows.push(...vehicleLamps(kind,light.headlights*fade));
  }
 }
 // BF07: le luci dei semafori (simulati) restano accese e colorano l'asfalto davanti alla linea.
 const signalLight=signalGlows(state.graph.signals,[x0,y0,x1,y1],signalSeconds(),Math.max(light.lamps||0,light.darkness/NIGHT_DARKNESS));
 lights.push(...signalLight.lights);glows.push(...signalLight.glows);
 // A faint halo keeps the protagonist readable on dark side streets.
 if(p.car<0)lights.push({x:p.x,y:p.y,r:4.5,strength:.35*light.darkness/NIGHT_DARKNESS});
 const w=Math.max(1,Math.ceil(canvas.width/2)),h=Math.max(1,Math.ceil(canvas.height/2));
 if(lightMap.width!==w||lightMap.height!==h){lightMap.width=w;lightMap.height=h;}
 const scale=.5*ratio*state.zoom;
 paintLightMap(lightMap,{scale,offsetX:.5*ratio*cw/2-scale*state.camera.x,offsetY:.5*ratio*ch/2-scale*state.camera.y},light,lights);
 c.save();c.setTransform(1,0,0,1,0,0);c.imageSmoothingEnabled=true;
 c.drawImage(lightMap,0,0,w,h,0,0,w*2,h*2);c.restore();
 // Lit windows: the real panes of each facade, switched on one by one as the evening goes on.
 if(light.lamps>0&&state.zoom>=1.1&&state.nightQuality!==0){
  c.save();c.fillStyle='#ffd27a';c.globalAlpha=.82*light.lamps;
  for(const b of buildings){
   const panes=facadeWindowPanes(b);
   if(!panes.length)continue;
   const path=litWindowPath(panes,b.art.litWindows||(b.art.litWindows=new Map()),light.windowShare);
   if(path)c.fill(path);
  }
  c.restore();
 }
 paintGlows(c,glows);
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
function updateCityAudio(){
 if(!cityAudio.started||!state.ready)return;
 const p=state.player,car=p.car>=0?state.cars[p.car]:null;
 const paused=state.mapOpen||!$('dialog').hidden||!$('pause-menu').hidden||!!state.shopOpen;
 const traffic=[...state.traffic.filter(v=>v.body==='car'),...(state.commuters||[]).filter(c=>c.bike.rider).map(c=>c.bike)];
 cityAudio.update({paused,interior:!!state.bankInterior,radioLive:radioStatus==='live',
  player:{x:p.x,y:p.y,inVehicle:!!car,vehicleType:car&&isMotorcycle(car)?'motorcycle':'car',model:car?.model||'',speed:car?car.speed:0,throttle:pressed.up||pressed.accelerate?1:0},
  // BF10: marcia e giri anche per il traffico, dalla velocità reale (agent.v di BF05) e dal modello.
  traffic:traffic.map(v=>({x:v.x,y:v.y,vehicleType:v.vehicleType,model:v.model||'',speed:v.braking?0:(Number.isFinite(v.v)?v.v:v.speed)})),
  night:(state.light?.darkness||0)/NIGHT_DARKNESS,rain:state.weather?.rain||0,
  skid:car&&car.speed>8?Math.min(1,Math.abs(car.slip||0)/.45):0});
 // Q13: NPC horns are decided by the traffic step (pickBlockedHorn in updateTraffic).
}
// Q09/Q11: the player's horn is heard, and chatting pedestrians nearby break up.
function honk(){
 const p=state.player;if(p.car<0)return;
 cityAudio.horn(isMotorcycle(state.cars[p.car])?'moto':'auto');
 state.hornAlarm={x:p.x,y:p.y,t:state.social?.clock??0};
 if(state.reactions)state.reactions.alarm={x:p.x,y:p.y,t:state.reactions.clock};
}
// BF13: la sovramappa nasce solo alla prima accensione e riparte sempre spenta (niente preferenze).
// BF15: NOVITÀ · DA APPROVARE — porta il giocatore a piedi davanti a un esempio vero (ora, meteo e
// mercato adatti) e poi lo riporta dov'era. Ritorno = posizione, mezzo, orologio e foto aerea di prima.
let novitaJudgements=loadJudgements(globalThis.localStorage);
function novitaStandOK(x,y){
 return canStand(x,y)&&!(state.market&&marketBlocksWalker(state.market,x,y,.3))&&
  !(state.dynamicCollision&&collidesWithTraffic({x,y,a:0},'walk',state.dynamicCollision,null));
}
function goToNovita(entry){
 if(!state.ready)return false;
 const target=novitaTarget(entry,state);
 if(!target){$('street').textContent='NOVITÀ · ESEMPIO NON TROVATO IN QUESTA MAPPA';return false;}
 const [min,max]=entry.distanza||[6,26];
 const stand=findStandingPoint(target,{walkable:novitaStandOK},{min,max});
 if(!stand){$('street').textContent='NOVITÀ · NESSUN POSTO LIBERO VICINO ALL’ESEMPIO';return false;}
 const p=state.player;
 if(state.shopOpen)closeShop();
 if(state.bankInterior){const inside=state.bankInterior;state.bankInterior=null;p.x=inside.outside.x;p.y=inside.outside.y;p.a=inside.outside.a;}
 // il ritorno è sempre il punto di prima del primo salto
 if(!state.preview)state.preview={back:{x:p.x,y:p.y,a:p.a,car:p.car,minutes:state.npcClockMinutes,
  satellite:!!state.satellite?.enabled,opacity:state.satellite?.opacity}};
 if(p.car>=0){const v=state.cars[p.car];if(v){v.speed=0;v.turnGuide=null;v.recoil=0;}p.car=-1;p.vehicleType=null;carRadio.leaveVehicle();}
 p.impactTime=0;p.impactVX=0;p.impactVY=0;p.impactLock=0;
 p.x=stand.x;p.y=stand.y;p.a=stand.a;state.camera.x=stand.x;state.camera.y=stand.y;
 if(Number.isFinite(entry.ora))state.npcClockMinutes=minutesAtHour(state.npcClockMinutes,entry.ora);
 state.preview.weather=entry.meteo||null;state.preview.market=!!entry.mercato;
 if(entry.satellite){satelliteOverlay()?.setEnabled(true);state.satellite?.setOpacity(entry.satellite);satelliteLabel();}
 state.weather=weatherAt(state.npcClockMinutes,{forced:state.preview.weather||FORCED_WEATHER});
 for(const key of Object.keys(pressed))pressed[key]=false;stick.x=0;stick.y=0;resetDrivingControls();updateHud();
 $('street').textContent='NOVITÀ · '+entry.nome.toUpperCase()+' · PER TORNARE: PAUSA › TORNA DOVE ERI';
 return true;
}
function backFromNovita(){
 const preview=state.preview;if(!preview)return false;
 const p=state.player,back=preview.back,car=back.car>=0?state.cars[back.car]:null;
 if(state.shopOpen)closeShop();state.bankInterior=null;
 p.impactTime=0;p.impactVX=0;p.impactVY=0;p.impactLock=0;
 if(car){p.car=back.car;p.vehicleType=isMotorcycle(car)?'motorcycle':'car';p.x=car.x;p.y=car.y;p.a=car.a;if(!isMotorcycle(car))carRadio.enterVehicle();}
 else{p.car=-1;p.vehicleType=null;p.x=back.x;p.y=back.y;p.a=back.a;}
 state.npcClockMinutes=back.minutes;state.preview=null;
 if(state.satellite){if(!back.satellite)state.satellite.setEnabled(false);else if(Number.isFinite(back.opacity))state.satellite.setOpacity(back.opacity);satelliteLabel();}
 state.weather=weatherAt(state.npcClockMinutes,{forced:FORCED_WEATHER});
 state.camera.x=p.x;state.camera.y=p.y;
 for(const key of Object.keys(pressed))pressed[key]=false;stick.x=0;stick.y=0;resetDrivingControls();updateHud();
 return true;
}
function satelliteOverlay(){
 if(!state.satellite&&state.map?.projection)state.satellite=createSatelliteOverlay({projection:state.map.projection});
 return state.satellite;
}
function satelliteLabel(){
 const o=state.satellite,on=!!o?.enabled;
 $('pause-satellite').textContent='SATELLITE: '+(on?'ON':'OFF');
 $('pause-satellite').setAttribute('aria-pressed',String(on));
 $('pause-satellite-level').textContent=Math.round((o?.opacity??.5)*100)+'%';
 $('satellite-attribution').hidden=!on;
}
function soundLabel(){
 $('pause-sound').textContent='SUONI: '+(cityAudio.muted?'OFF':'ON');
 $('pause-sound').setAttribute('aria-pressed',String(!cityAudio.muted));
 $('pause-fx-level').textContent=Math.round(cityAudio.effectsVolume*100)+'%';
 $('pause-radio-level').textContent=Math.round(cityAudio.radioVolume*100)+'%';
}
function frame(now){
 const dt=state.last?Math.min(.05,(now-state.last)/1000):0;state.last=now;
 tick(dt);draw(dt);drawMini();updateCityAudio();requestAnimationFrame(frame);
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
  let enclosureData=null;
  try{
   const req=await fetch('./data/enclosures.json',{cache:'no-cache'});
   if(req.ok)enclosureData=await req.json();
  }catch(error){console.warn('Optional enclosures unavailable',error);}
  prepareMap(map,surveyData,infillCache,placement,enclosureData);
 }catch(e){console.error('GTA Melito map load',e);loading('MAPPA NON DISPONIBILE','Non posso mostrare una Melito inventata: '+e.message+'. Riprova quando la cartografia è disponibile.',true);}
 finally{state.loading=false;}
}
function bind(){
 // Q09: browsers allow sound only after a gesture; every gesture also resumes a suspended context.
 for(const type of ['pointerdown','keydown'])window.addEventListener(type,()=>{cityAudio.start();},{capture:true});
 document.addEventListener('visibilitychange',()=>cityAudio.focus(document.visibilityState!=='hidden'));
 window.addEventListener('blur',()=>cityAudio.focus(false));
 window.addEventListener('focus',()=>cityAudio.focus(true));
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
  if(state.shopOpen){
   const index=Number(e.key)-1,offer=offersFor(state.shopOpen.kind)[index];
   if(offer&&!e.repeat){e.preventDefault();buyFromShop(offer.id);return;}
   if((e.key==='Escape'||e.key.toLowerCase()==='e')&&!e.repeat){e.preventDefault();closeShop();return;}
  }
  if(e.key.toLowerCase()==='e'&&!e.repeat){e.preventDefault();toggleVehicle();}
  if(e.key.toLowerCase()==='h'&&!e.repeat&&state.player.car>=0){e.preventDefault();honk();}
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
  // BF11: on a PC the PAUSE menu holds everything that used to sit around the board; P opens and closes it too.
  if(e.key.toLowerCase()==='p'&&!e.repeat&&!state.shopOpen){e.preventDefault();$('fullmap').hidden=true;state.mapOpen=false;if(!pause.hidden)closePause();else openPause();}
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
  // Q09: a quick tap on the hub (no drag) sounds the horn.
  const box=steeringPad.getBoundingClientRect();
  wheel.tap={x:e.clientX,y:e.clientY,t:performance.now(),hub:Math.hypot(e.clientX-box.left-box.width/2,e.clientY-box.top-box.height/2)<box.width*.22};
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
  if(wheel.pointerId!==e.pointerId)return;
  const tap=wheel.tap;wheel.tap=null;
  if(e.type==='pointerup'&&tap?.hub&&performance.now()-tap.t<260&&Math.hypot(e.clientX-tap.x,e.clientY-tap.y)<9&&state.player.car>=0)
   honk();
  wheel.held=false;wheel.pointerId=null;
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
 const openPause=()=>{carRadio.duck(true);refreshNovita();$('novita-copy').textContent='COPIA GIUDIZI';Object.keys(pressed).forEach(k=>pressed[k]=false);stick.x=0;stick.y=0;resetDrivingControls();pause.hidden=false;pauseButton.setAttribute('aria-expanded','true');$('pause-details').textContent='MEZZO: '+$('vehicle').textContent+'  ·  CAMERA: '+$('camera-mode').textContent+'  ·  STRADE: '+$('road-count').textContent+'  ·  EDIFICI OSM: '+$('building-count').textContent+'  ·  PLACEHOLDER: '+$('inferred-count').textContent+'  ·  INCROCI: '+$('junction-count').textContent+'  ·  '+$('road-width-current').textContent+' unità';};
 const closePause=()=>{carRadio.duck(false);pause.hidden=true;pauseButton.setAttribute('aria-expanded','false');};
 // BF15: la lista NOVITÀ si ridisegna a ogni apertura (le voci «in arrivo» si attivano quando ci sono).
 function refreshNovita(){
  renderNovita($('novita-list'),{state,judgements:novitaJudgements,
   onGo:entry=>{if(goToNovita(entry))closePause();},
   onJudge:(id,value)=>{novitaJudgements=toggleJudgement(novitaJudgements,id,value);saveJudgements(globalThis.localStorage,novitaJudgements);refreshNovita();}});
  const done=Object.keys(novitaJudgements).length,total=NOVITA.filter(e=>!e.futura).length;
  $('novita-count').textContent=done+' giudicate su '+total;
  $('novita-back').hidden=!state.preview;
 }
 $('novita-back').addEventListener('click',()=>{if(backFromNovita())closePause();});
 $('novita-copy').addEventListener('click',()=>{
  const text=judgementSummary(novitaJudgements),box=$('novita-export');
  box.value=text;box.hidden=false;box.select?.();
  try{navigator.clipboard?.writeText(text).then(()=>{$('novita-copy').textContent='COPIATO ✓';},()=>{});}catch(_){}
 });
 pauseButton.addEventListener('click',()=>pause.hidden?openPause():closePause());
 $('pause-close').addEventListener('click',closePause);
 $('pause-satellite').addEventListener('click',()=>{satelliteOverlay()?.toggle();satelliteLabel();});
 for(const [id,dir] of [['pause-satellite-down',-1],['pause-satellite-up',1]])$(id).addEventListener('click',()=>{satelliteOverlay()?.stepOpacity(dir);satelliteLabel();});
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
 $('shop-close').addEventListener('click',closeShop);
 $('pause-sound').addEventListener('click',()=>{cityAudio.start();cityAudio.toggleMuted();soundLabel();});
 $('pause-volume-down').addEventListener('click',()=>{cityAudio.changeVolume(-.1);soundLabel();});
 $('pause-volume-up').addEventListener('click',()=>{cityAudio.changeVolume(.1);soundLabel();});
 $('pause-radio-down').addEventListener('click',()=>{cityAudio.changeRadioVolume(-.1);soundLabel();});
 $('pause-radio-up').addEventListener('click',()=>{cityAudio.changeRadioVolume(.1);soundLabel();});
 soundLabel();
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
loadMotorcycleSprites();loadExtraPedestrianSprites();loadPedestrianSprites();loadFryerSprite();loadProfessionSprites();loadCarSprites();bind();requestAnimationFrame(frame);load();
