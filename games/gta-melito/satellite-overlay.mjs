/* BF13 (20/10/2026): foto aerea Esri World Imagery come sovramappa di CONFRONTO.
 * Strumento del menu PAUSA › STRUMENTI, spento di default e mai salvato: serve a vedere dove la
 * città del gioco manca di dettagli (mura, piazze, campi, parcheggi…). Le tile si chiedono solo
 * quando è acceso e solo per la zona in vista; nel repository non c'è nessuna immagine satellitare.
 * Allineamento: la mappa del gioco è una proiezione lineare lon/lat (osm.mjs getProjection/xy); le
 * tile sono Web Mercator. Dentro una tile (≈115 m a z18) la differenza è sotto il centimetro, quindi
 * ogni tile si disegna come un rettangolo con gli spigoli convertiti esattamente. */
export const SATELLITE_TILE_URL='https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
export const SATELLITE_ATTRIBUTION='Immagini: Esri, Maxar, Earthstar Geographics e la comunità GIS — Esri World Imagery';
export const SATELLITE_OPACITIES=Object.freeze([.25,.5,.75,1]);
export const SATELLITE_RULES=Object.freeze({minZoom:15,maxZoom:19,maxTiles:96,maxPending:12,retryAfter:20});
const METERS=111319.49079327358,RAD=Math.PI/180;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

// Coordinate di gioco (metri) ↔ WGS84, inverse esatte di osm.mjs xy().
export function gameToLonLat(x,y,p){return {lon:p.minLon+x/(p.cos*METERS),lat:p.maxLat-y/METERS};}
export function lonLatToGame(lon,lat,p){return {x:(lon-p.minLon)*p.cos*METERS,y:(p.maxLat-lat)*METERS};}
// WGS84 ↔ coordinate tile Web Mercator frazionarie allo zoom z.
export function lonLatToTile(lon,lat,z){
 const n=2**z,phi=lat*RAD;
 return {x:(lon+180)/360*n,y:(1-Math.log(Math.tan(phi)+1/Math.cos(phi))/Math.PI)/2*n};
}
export function tileToLonLat(x,y,z){
 const n=2**z;
 return {lon:x/n*360-180,lat:Math.atan(Math.sinh(Math.PI*(1-2*y/n)))/RAD};
}
export function tileUrl(z,x,y){return SATELLITE_TILE_URL.replace('{z}',z).replace('{y}',y).replace('{x}',x);}
// Rettangolo di gioco coperto dalla tile (x,y,z).
export function tileRect(x,y,z,p){
 const a=tileToLonLat(x,y,z),b=tileToLonLat(x+1,y+1,z);
 const g0=lonLatToGame(a.lon,a.lat,p),g1=lonLatToGame(b.lon,b.lat,p);
 return {x:g0.x,y:g0.y,w:g1.x-g0.x,h:g1.y-g0.y};
}
// Zoom delle tile adatto alla camera: circa un pixel di foto per pixel di schermo (zoom = px per metro).
export function tileZoomFor(cameraZoom,lat=40.92){
 const metersPerPixel=1/Math.max(.05,cameraZoom),ground0=156543.03392*Math.cos(lat*RAD);
 return clamp(Math.round(Math.log2(ground0/metersPerPixel)),SATELLITE_RULES.minZoom,SATELLITE_RULES.maxZoom);
}
// Tile che coprono il riquadro di gioco [x0,y0,x1,y1].
export function tilesForView([x0,y0,x1,y1],z,p){
 const a=gameToLonLat(x0,y0,p),b=gameToLonLat(x1,y1,p);
 const t0=lonLatToTile(a.lon,a.lat,z),t1=lonLatToTile(b.lon,b.lat,z),out=[];
 for(let ty=Math.floor(Math.min(t0.y,t1.y));ty<=Math.floor(Math.max(t0.y,t1.y));ty++)
  for(let tx=Math.floor(Math.min(t0.x,t1.x));tx<=Math.floor(Math.max(t0.x,t1.x));tx++)out.push({z,x:tx,y:ty});
 return out;
}
/* Sovramappa: enabled/opacity, cache LRU limitata, richieste solo da acceso e solo in vista.
 * imageFactory() crea l'immagine (nel browser new Image()); now() il tempo in secondi. */
export function createSatelliteOverlay({projection,imageFactory=()=>new Image(),now=()=>performance.now()/1000,maxTiles=SATELLITE_RULES.maxTiles}={}){
 const cache=new Map();let requests=0,errors=0;
 // fixedZoom: solo per gli strumenti di audit (null = zoom scelto dalla camera).
 const overlay={enabled:false,opacity:.5,fixedZoom:null,get requests(){return requests;},get errors(){return errors;},get cached(){return cache.size;}};
 overlay.setEnabled=on=>{overlay.enabled=!!on;return overlay.enabled;};
 overlay.toggle=()=>overlay.setEnabled(!overlay.enabled);
 overlay.setOpacity=v=>{overlay.opacity=clamp(Number(v)||0,.05,1);return overlay.opacity;};
 overlay.stepOpacity=dir=>{
  const i=SATELLITE_OPACITIES.findIndex(v=>v>=overlay.opacity-1e-6);
  return overlay.setOpacity(SATELLITE_OPACITIES[clamp((i<0?1:i)+Math.sign(dir),0,SATELLITE_OPACITIES.length-1)]);
 };
 function tile(z,x,y){
  const key=z+'/'+x+'/'+y;let t=cache.get(key);
  if(t){cache.delete(key);cache.set(key,t);} // LRU: l'ultima usata in fondo
  if(t&&t.failed&&now()-t.failed>SATELLITE_RULES.retryAfter){cache.delete(key);t=null;}
  if(!t){
   const pending=[...cache.values()].filter(q=>!q.ready&&!q.failed).length;
   if(pending>=SATELLITE_RULES.maxPending)return null;
   const img=imageFactory();t={img,ready:false,failed:0};
   img.crossOrigin='anonymous';
   img.onload=()=>{t.ready=true;};img.onerror=()=>{t.failed=now()||1;errors++;};
   img.src=tileUrl(z,x,y);requests++;cache.set(key,t);
   while(cache.size>maxTiles)cache.delete(cache.keys().next().value);
  }
  return t;
 }
 // Disegna nel sistema di riferimento del mondo (metri), già trasformato dalla camera.
 overlay.draw=(c,view,cameraZoom)=>{
  if(!overlay.enabled||!projection)return 0;
  const z=overlay.fixedZoom||tileZoomFor(cameraZoom,(projection.minLat+projection.maxLat)/2);
  let drawn=0;
  c.save();c.globalAlpha=overlay.opacity;c.imageSmoothingEnabled=true;
  for(const q of tilesForView(view,z,projection)){
   const t=tile(q.z,q.x,q.y);
   if(!t||!t.ready)continue;
   const r=tileRect(q.x,q.y,q.z,projection);
   // +0,02 m per lato: niente righe sottili tra una tile e l'altra.
   c.drawImage(t.img,r.x-.02,r.y-.02,r.w+.04,r.h+.04);drawn++;
  }
  c.restore();
  return drawn;
 };
 return overlay;
}
// ?satellite=50 accende la sovramappa al 50% per le prove (solo da URL, mai salvato).
export function satelliteFromUrl(search=''){
 const v=new URLSearchParams(search).get('satellite');
 if(v===null)return null;
 const n=Number(v);
 return Number.isFinite(n)&&n>0?clamp(n/100,.05,1):null;
}
