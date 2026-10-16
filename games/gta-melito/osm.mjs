/* GTA Melito — geographic conversion. Derived data © OpenStreetMap contributors (ODbL).
 * Real street geometry only: no fabricated road grid. */
export const ENDPOINTS=[
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
  "https://overpass-api.de/api/interpreter",
  "https://overpass.nchc.org.tw/api/interpreter",
  "https://overpass.ultra.cc/api/interpreter"
];
const RAD=Math.PI/180, METERS=111319.49079327358;
export function getProjection(boundary){
  const pts=boundary.geometry.coordinates[0];
  const minLon=Math.min(...pts.map(p=>p[0])),maxLon=Math.max(...pts.map(p=>p[0]));
  const minLat=Math.min(...pts.map(p=>p[1])),maxLat=Math.max(...pts.map(p=>p[1]));
  const latRef=(minLat+maxLat)/2;
  const cos=Math.cos(latRef*RAD);
  return {minLon,maxLon,minLat,maxLat,latRef,cos,width:Math.round((maxLon-minLon)*cos*METERS),height:Math.round((maxLat-minLat)*METERS)};
}
export function xy(lon,lat,p){return [Math.round((lon-p.minLon)*p.cos*METERS*10)/10,Math.round((p.maxLat-lat)*METERS*10)/10];}
export function inside(pt,ring){
  let yes=false;
  for(let i=0,j=ring.length-1;i<ring.length;j=i++){
    const a=ring[i],b=ring[j];
    if(((a[1]>pt[1])!==(b[1]>pt[1]))&&(pt[0]<(b[0]-a[0])*(pt[1]-a[1])/(b[1]-a[1])+a[0])) yes=!yes;
  }
  return yes;
}
export function buildQuery(p){
 const bb=[p.minLat-.0015,p.minLon-.0015,p.maxLat+.0015,p.maxLon+.0015].map(n=>n.toFixed(6)).join(",");
 return '[out:json][timeout:110];(way["highway"]('+bb+');way["building"]('+bb+');node["shop"]('+bb+');node["amenity"]('+bb+');node["tourism"]('+bb+'););out geom;';
}
const WIDTH={motorway:19,trunk:16,primary:13,secondary:11,tertiary:9,unclassified:7,residential:7,living_street:6,service:5,pedestrian:6,footway:2.4,path:2,steps:2,track:3,cycleway:2.4};
function simplified(coords,epsilon=1.3){
 if(coords.length<=2)return coords;
 const result=[coords[0]];
 for(let i=1;i<coords.length-1;i++){
  const prev=result[result.length-1],now=coords[i],next=coords[i+1];
  const dx=next[0]-prev[0],dy=next[1]-prev[1],len=dx*dx+dy*dy;
  const t=len?Math.max(0,Math.min(1,((now[0]-prev[0])*dx+(now[1]-prev[1])*dy)/len)):0;
  if(Math.hypot(now[0]-prev[0]-t*dx,now[1]-prev[1]-t*dy)>epsilon)result.push(now);
 }
 result.push(coords[coords.length-1]);return result;
}
export function buildMap(overpass,boundary){
 if(!overpass||!Array.isArray(overpass.elements))throw Error('Risposta geografica OpenStreetMap non valida');
 const p=getProjection(boundary),border=boundary.geometry.coordinates[0].map(v=>xy(v[0],v[1],p));
 const roads=[],buildings=[],pois=[];
 for(const el of overpass.elements){
  if(el.type==='node'){
   const t=el.tags||{},name=t.name||'';
   if(name&&Number.isFinite(el.lat)&&Number.isFinite(el.lon)){
    const point=xy(el.lon,el.lat,p);
    if(inside(point,border))pois.push({n:name,k:t.shop||t.amenity||t.tourism||'',p:point});
   }
   continue;
  }
  if(el.type!=='way'||!Array.isArray(el.geometry))continue;
  const t=el.tags||{},g=el.geometry.filter(v=>Number.isFinite(v.lon)&&Number.isFinite(v.lat)).map(v=>xy(v.lon,v.lat,p));
  if(g.length<2)continue;
  if(t.highway&&WIDTH[t.highway]&&!['construction','proposed'].includes(t.highway)){
   if(!g.some(pt=>inside(pt,border))&&!inside(g[Math.floor(g.length/2)],border))continue;
   const s=simplified(g);
   roads.push({id:el.id,n:t.name||'',t:t.highway,w:WIDTH[t.highway],o:t.oneway==='yes',p:s.flat()});
  } else if(t.building&&g.length>=4){
   const mid=g.slice(0,-1).reduce((a,c)=>[a[0]+c[0],a[1]+c[1]],[0,0]).map(v=>v/(g.length-1));
   if(!inside(mid,border))continue;
   const s=simplified(g,1.0);
   buildings.push({id:el.id,n:t.name||'',p:s.flat(),h:Math.min(24,Math.max(6,Number(t['building:levels'])?Number(t['building:levels'])*3:9+(el.id%4)*2))});
  }
 }
 if(roads.length<20)throw Error('Sono state trovate troppo poche strade: estrazione incompleta');
 return {version:1,source:'OpenStreetMap',license:'ODbL 1.0',boundarySource:'ISTAT 2026 — CC BY 4.0',created:new Date().toISOString(),
 projection:p,border:border.flat(),roads,buildings,pois:pois.slice(0,1600)};
}

// Fallback when public Overpass mirrors are unavailable.
// Small /api/0.6/map tiles avoid OSM API's single-request node cap.
function decodeXml(value){
 return String(value||'').replace(/&#(\\d+);/g,(_,n)=>String.fromCodePoint(Number(n)))
 .replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');
}
function attributes(raw){
 const out={};let m;const re=/([\\w:.-]+)="([^"]*)"/g;
 while((m=re.exec(raw))!==null)out[m[1]]=decodeXml(m[2]);return out;
}
function osmTags(xml){
 const tags={};let m;const re=/<tag\\b([^>]*?)\\/>/g;
 while((m=re.exec(xml))!==null){const a=attributes(m[1]);if(a.k)tags[a.k]=a.v||'';}return tags;
}
export function parseOsmXml(text,nodes,ways){
 let m;
 const nodeRe=/<node\\b([^>]*?)(?:\\/>|>([\\s\\S]*?)<\\/node>)/g;
 while((m=nodeRe.exec(text))!==null){
  const a=attributes(m[1]);if(!a.id||!a.lat||!a.lon)continue;
  const tag=m[2]?osmTags(m[2]):{};
  nodes.set(a.id,{type:'node',id:Number(a.id),lat:Number(a.lat),lon:Number(a.lon),tags:tag});
 }
 const wayRe=/<way\\b([^>]*)>([\\s\\S]*?)<\\/way>/g;
 while((m=wayRe.exec(text))!==null){
  const a=attributes(m[1]);if(!a.id)continue;
  const tags=osmTags(m[2]);
  if(!tags.highway&&!tags.building)continue;
  const refs=[...m[2].matchAll(/<nd\\b[^>]*ref="(\\d+)"/g)].map(q=>q[1]);
  ways.set(a.id,{type:'way',id:Number(a.id),refs,tags});
 }
}
export async function fetchViaOsmApi(boundary,onAttempt=()=>{}){
 const p=getProjection(boundary),nodes=new Map(),ways=new Map(),columns=3,rows=3;
 const eps=.0006,w=(p.maxLon-p.minLon+2*eps)/columns,h=(p.maxLat-p.minLat+2*eps)/rows;
 for(let row=0;row<rows;row++)for(let col=0;col<columns;col++){
  const west=p.minLon-eps+col*w,east=west+w,south=p.minLat-eps+row*h,north=south+h;
  const endpoint='https://api.openstreetmap.org/api/0.6/map?bbox='+[west,south,east,north].map(v=>v.toFixed(7)).join(',');
  onAttempt(endpoint);
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),50000);
  try{
   const response=await fetch(endpoint,{headers:{'Accept':'application/xml','User-Agent':'UnsArcadeMelito/0.1 (https://github.com/CzekUns/Effettokarmagra)'},signal:controller.signal});
   if(!response.ok)throw Error('OpenStreetMap API HTTP '+response.status);
   const xml=await response.text();
   if(!xml.includes('<osm'))throw Error('OSM API risposta XML non valida');
   parseOsmXml(xml,nodes,ways);
   console.log('OSM tile',col,row,'nodes',nodes.size,'ways',ways.size);
  }finally{clearTimeout(timer);}
 }
 const elements=[];
 for(const n of nodes.values())if(n.tags?.name&&(n.tags.shop||n.tags.amenity||n.tags.tourism))elements.push(n);
 for(const w of ways.values()){
  const g=w.refs.map(id=>nodes.get(id)).filter(Boolean).map(n=>({lat:n.lat,lon:n.lon}));
  if(g.length>=2)elements.push({type:'way',id:w.id,tags:w.tags,geometry:g});
 }
 return buildMap({elements},boundary);
}

export async function fetchOverpass(boundary,onAttempt=()=>{}){
 const query=buildQuery(getProjection(boundary));
 const errors=[];
 for(const endpoint of ENDPOINTS){
  onAttempt(endpoint);
  for(const method of ['GET','POST']){
   const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),65000);
   try{
    const url=method==='GET'?endpoint+'?data='+encodeURIComponent(query):endpoint;
    const response=await fetch(url,{
     method,
     headers:{'Accept':'application/json','User-Agent':'UnsArcadeMelito/0.1 (https://github.com/CzekUns/Effettokarmagra)'},
     ...(method==='POST'?{headers:{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8','Accept':'application/json','User-Agent':'UnsArcadeMelito/0.1 (https://github.com/CzekUns/Effettokarmagra)'},body:new URLSearchParams({data:query})}:{}),
     signal:controller.signal
    });
    if(!response.ok){
      const reason=(await response.text()).slice(0,180).replace(/\\s+/g,' ');
      throw Error('HTTP '+response.status+': '+reason);
    }
    const json=await response.json();
    return buildMap(json,boundary);
   }catch(e){
    errors.push(new URL(endpoint).hostname+' '+method+': '+e.message);
    console.warn('Melito OSM endpoint:',errors[errors.length-1]);
   }finally{clearTimeout(timer);}
  }
 }
 try{return await fetchViaOsmApi(boundary,onAttempt);}catch(e){throw Error('OpenStreetMap API e Overpass non raggiungibili: '+e.message+'; '+errors.slice(-2).join(' | '));}
}
