/* Q03: ingressi degli edifici per i pedoni.
 * Una porta è valida solo se la soglia è camminabile, il muro alle sue spalle è dritto
 * per tutta la larghezza del portone e il tratto dal marciapiede alla soglia non
 * attraversa edifici: l'NPC sparisce sulla soglia, non dentro il muro.
 * Fonte sempre dichiarata:
 *  - 'osm-poi': attività con nome presente in OpenStreetMap; il punto del portone è
 *    stimato sulla facciata più vicina alla sua insegna, non è un ingresso censito;
 *  - 'inventata': portone di fantasia (OSM non contiene ingressi o civici di Melito). */
export const DOOR_SOURCE=Object.freeze({OSM_POI:'osm-poi',INVENTED:'inventata'});
export const DOOR_HALF_WIDTH=.8;
export const DOOR_STAND=.45;
export const DOOR_MAX_REACH=6.5;
const FLAT_TOLERANCE=.6,WALL_DEPTH=.6;

function unit(v){const l=Math.hypot(v.x,v.y)||1;return {x:v.x/l,y:v.y/l};}
// First building contact along the ray, refined to a few centimetres.
function rayToWall(ox,oy,nx,ny,isBuilding,limit){
 let previous=0;
 for(let s=0;s<=limit;s+=.3){
  if(isBuilding(ox+nx*s,oy+ny*s)){
   let lo=previous,hi=s;
   for(let k=0;k<5;k++){const mid=(lo+hi)/2;if(isBuilding(ox+nx*mid,oy+ny*mid))hi=mid;else lo=mid;}
   return {distance:hi,hit:isBuilding(ox+nx*hi,oy+ny*hi)};
  }
  previous=s;
 }
 return null;
}
// origin: punto sulla linea del marciapiede; normal: direzione verso l'edificio.
export function probeDoor(origin,normal,isBuilding,isWalkable,options={}){
 const maxReach=options.maxReach??DOOR_MAX_REACH;
 if(!origin||!Number.isFinite(origin.x)||!Number.isFinite(origin.y))return {valid:false,reason:'origine-assente'};
 if(!isWalkable(origin.x,origin.y))return {valid:false,reason:'origine-non-camminabile'};
 const n=unit(normal),u={x:-n.y,y:n.x};
 // Cheap early exit when only facades facing the viewer are wanted.
 if(options.viewerOnly&&!doorFacesViewer({nx:-n.x,ny:-n.y}))return {valid:false,reason:'facciata-nascosta'};
 // Looks a little further than reachable, to tell a far wall from open space.
 const wall=rayToWall(origin.x,origin.y,n.x,n.y,isBuilding,maxReach+DOOR_STAND+3);
 if(!wall)return {valid:false,reason:'nessun-muro'};
 const reach=Math.max(0,wall.distance-DOOR_STAND);
 if(reach>maxReach)return {valid:false,reason:'troppo-lontana'};
 // Tutto il percorso fino alla soglia deve restare fuori dagli edifici.
 for(let s=0;s<=reach+.001;s+=.25){
  const x=origin.x+n.x*Math.min(s,reach),y=origin.y+n.y*Math.min(s,reach);
  if(!isWalkable(x,y))return {valid:false,reason:'percorso-attraverso-muro'};
 }
 // Muro dritto: niente spigoli, vicoli o rientranze sotto il portone.
 for(const side of [-1,1]){
  const ox=origin.x+u.x*DOOR_HALF_WIDTH*side,oy=origin.y+u.y*DOOR_HALF_WIDTH*side;
  const edge=rayToWall(ox,oy,n.x,n.y,isBuilding,wall.distance+FLAT_TOLERANCE+.2);
  if(!edge||Math.abs(edge.distance-wall.distance)>FLAT_TOLERANCE)return {valid:false,reason:'spigolo'};
 }
 const wx=origin.x+n.x*wall.distance,wy=origin.y+n.y*wall.distance;
 const behind=isBuilding(wx+n.x*WALL_DEPTH,wy+n.y*WALL_DEPTH);
 if(!behind)return {valid:false,reason:'muro-sottile'};
 const tx=origin.x+n.x*reach,ty=origin.y+n.y*reach;
 const building=typeof behind==='object'?behind:null;
 return {valid:true,x:tx,y:ty,wallX:wx,wallY:wy,
  // Verso della facciata (dall'edificio alla strada) e asse del muro.
  nx:-n.x,ny:-n.y,angle:Math.atan2(u.y,u.x),reach,
  buildingId:building?.id??null,
  building:building?(building.art?.inferred?'inferito':'osm'):null,
  source:options.source||DOOR_SOURCE.INVENTED,
  label:options.label||null,kind:options.kind||null,open:0};
}
// Ricontrolla una porta già creata o arrivata da fuori: utile anche come guardia nei test.
export function validateDoor(door,isBuilding,isWalkable){
 if(!door||![door.x,door.y,door.nx,door.ny].every(Number.isFinite))return {valid:false,reason:'porta-incompleta'};
 if(!isWalkable(door.x,door.y))return {valid:false,reason:'soglia-non-camminabile'};
 if(![DOOR_SOURCE.OSM_POI,DOOR_SOURCE.INVENTED].includes(door.source))return {valid:false,reason:'fonte-non-dichiarata'};
 const check=probeDoor({x:door.x+door.nx*.05,y:door.y+door.ny*.05},{x:-door.nx,y:-door.ny},isBuilding,isWalkable,{maxReach:1.2,source:door.source});
 return check.valid?{valid:true}:{valid:false,reason:check.reason};
}
// Facciata rivolta verso chi guarda (stesso criterio di building-volume: il tetto
// è sollevato verso nord-ovest, quindi si vedono i muri esposti a sud-est).
export function doorFacesViewer(door,volume={dx:2,dy:6}){
 return door.nx*volume.dx+door.ny*volume.dy>0;
}
// Quanto si vede la facciata (0 = muro parallelo all'estrusione, ridotto a una striscia).
export function facadeExposure(door){
 const ux=Math.cos(door.angle),uy=Math.sin(door.angle);
 return Math.abs(ux*3-uy*1)/Math.sqrt(10);
}
const WOOD=['#6b3b26','#5a3121','#7a4a2c','#4e2c1e'];
const doorWood=d=>d.source===DOOR_SOURCE.OSM_POI?'#2f5964':WOOD[(Math.abs(d.buildingId|0))%WOOD.length];
// Pianta a terra, leggibile con qualsiasi orientamento del muro: gradino in pietra sul
// marciapiede, vano del portone a cavallo del filo del muro e stipiti chiari.
export function drawDoorSteps(c,doors,zoom){
 if(zoom<1.5)return;
 for(const d of doors){
  if(!doorFacesViewer(d))continue;
  const ux=Math.cos(d.angle),uy=Math.sin(d.angle);
  const box=(a0,a1,b0,b1,color)=>{
   c.beginPath();
   c.moveTo(d.wallX+ux*a0+d.nx*b0,d.wallY+uy*a0+d.ny*b0);c.lineTo(d.wallX+ux*a1+d.nx*b0,d.wallY+uy*a1+d.ny*b0);
   c.lineTo(d.wallX+ux*a1+d.nx*b1,d.wallY+uy*a1+d.ny*b1);c.lineTo(d.wallX+ux*a0+d.nx*b1,d.wallY+uy*a0+d.ny*b1);
   c.closePath();c.fillStyle=color;c.fill();
  };
  const w=DOOR_HALF_WIDTH,open=d.open>0;
  // Gradino in piperno grigio scuro, tipico dei portoni napoletani, con lo spigolo chiaro.
  box(-w-.4,w+.4,0,.8,'#7f7b72');box(-w-.4,w+.4,.68,.82,'#b4ae9f');
  if(open){c.globalAlpha=.5;box(-w,w,.05,.78,'#ffd98a');c.globalAlpha=1;}
  box(-w,w,-.6,.16,open?'#0f1416':doorWood(d));
  if(!open){
   if(d.source===DOOR_SOURCE.OSM_POI){box(-w+.2,w-.2,-.45,.06,'#8fc3c7');box(-w+.3,-w+.48,-.4,0,'#e6f4f2');}
   else{box(-.07,.07,-.6,.16,'#24140c');box(-w+.25,-w+.4,-.2,0,'#e2b85c');box(w-.4,w-.25,-.2,0,'#e2b85c');}
  }
  box(-w-.34,-w,-.66,.28,'#efe6d2');box(w,w+.34,-.66,.28,'#efe6d2');
  box(-w-.34,-w,.2,.28,'#9c9583');box(w,w+.34,.2,.28,'#9c9583');
 }
}
// Portone in alzato sulla facciata, solo dove la facciata è ben visibile.
export function drawDoorFronts(c,doors,zoom){
 if(zoom<1.5)return;
 for(const d of doors){
  if(!doorFacesViewer(d)||facadeExposure(d)<.45)continue;
  const ux=Math.cos(d.angle),uy=Math.sin(d.angle),h=2.7,lx=-h/3,ly=-h,w=DOOR_HALF_WIDTH;
  const shop=d.source===DOOR_SOURCE.OSM_POI,open=d.open>0;
  const quad=(a0,a1,b0,b1)=>{
   c.beginPath();
   c.moveTo(d.wallX+ux*a0+lx*b0,d.wallY+uy*a0+ly*b0);c.lineTo(d.wallX+ux*a1+lx*b0,d.wallY+uy*a1+ly*b0);
   c.lineTo(d.wallX+ux*a1+lx*b1,d.wallY+uy*a1+ly*b1);c.lineTo(d.wallX+ux*a0+lx*b1,d.wallY+uy*a0+ly*b1);c.closePath();
  };
  c.save();
  quad(-w-.22,w+.22,0,1.08);c.fillStyle='#d9d1bd';c.fill();
  quad(-w,w,0,1);c.fillStyle=open?'#151c1e':doorWood(d);c.fill();
  if(!open){
   if(shop){quad(-w+.18,w-.18,.08,.92);c.fillStyle='#8fc3c7';c.globalAlpha=.55;c.fill();c.globalAlpha=1;
    quad(-w+.3,-w+.5,.2,.8);c.fillStyle='#e6f4f2';c.fill();}
   else{quad(-.05,.05,0,1);c.fillStyle='#24150e';c.fill();
    quad(-w+.18,w-.18,.78,.92);c.fillStyle='#e9c46a';c.globalAlpha=.6;c.fill();c.globalAlpha=1;}
  }
  c.restore();
 }
}
