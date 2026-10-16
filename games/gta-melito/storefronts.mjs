import {visualRoadWidth} from './road-widths.mjs?v=043';
/* Small storefronts tied to real OpenStreetMap named POIs.
 * Position is projected to the nearest suitable OSM street. Store awnings are stylized.
 */
const h=n=>{let x=(Number(n)||1)|0;x=Math.imul(x^x>>>16,2246822519);x=Math.imul(x^x>>>13,3266489917);return (x^x>>>16)>>>0;};
const colors={supermarket:['#377b98','#f1da8a'],bakery:['#be7857','#f2d6b5'],cafe:['#a55f52','#e8cbae'],bar:['#885b47','#f7d3a0'],pharmacy:['#477e62','#e5ece1'],post_office:['#327c99','#f0dca7'],bank:['#44607a','#dbd7b9'],fuel:['#647786','#eed6a2'],hairdresser:['#875e7b','#e3c8d9'],school:['#547a6a','#ebe0bc'],fast_food:['#b66f49','#f2d9a2']};
const shops=new Set(['supermarket','bakery','cafe','bar','pharmacy','post_office','bank','fuel','hairdresser','school','fast_food','stationery','clothes','pastry','furniture','hardware','department_store','convenience','butcher','restaurant','car_repair','car_parts','computer','houseware']);
function nearestRoad(roads,x,y){
 let result=null,dist=1800;
 for(const road of roads){
  if(road.t==='motorway'||road.t==='trunk'||road.t==='path')continue;
  const p=road.p;
  for(let i=2;i<p.length;i+=2){
   const dx=p[i]-p[i-2],dy=p[i+1]-p[i-1],len=dx*dx+dy*dy;
   if(len<=.2)continue;
   const t=Math.min(1,Math.max(0,((x-p[i-2])*dx+(y-p[i-1])*dy)/len));
   const a=p[i-2]+t*dx,b=p[i-1]+t*dy,d=(x-a)**2+(y-b)**2;
   if(d<dist){dist=d;result={x:a,y:b,a:Math.atan2(dy,dx),w:visualRoadWidth(road),d};}
  }
 }
 return result;
}
export function prepareStorefronts(pois,roads){
 const items=[];
 for(const p of pois){
  if(!p.n||!shops.has(p.k))continue;
  const near=nearestRoad(roads,p.p[0],p.p[1]);
  if(!near||near.d>40*40)continue;
  const side=Math.sin(near.a)*(p.p[0]-near.x)-Math.cos(near.a)*(p.p[1]-near.y)<0?1:-1;
  const offset=(near.w/2+2.4)*side;
  const x=near.x-Math.sin(near.a)*offset,y=near.y+Math.cos(near.a)*offset;
  items.push({x,y,a:near.a,side,name:p.n,kind:p.k,id:h(Math.round(p.p[0]*4)+Math.round(p.p[1]*7)),p:[x-7,y-7,x+7,y+7]});
 }
 return items;
}
export function drawStorefronts(c,storefronts,zoom){
 if(zoom<1.6)return;
 const txt=zoom>2.6;
 for(const s of storefronts){
  c.save();c.translate(s.x,s.y);c.rotate(s.a);
  const palette=colors[s.kind]||['#9d775b','#decaa7'];
  c.fillStyle='#1d3430a9';c.fillRect(-3.9,-1.7,8.8,4.8);
  c.fillStyle=palette[0];c.fillRect(-4.2,-2.9,8.4,4.2);
  // Striped awning and doorway, facing the real street axis.
  for(let i=-4;i<4;i+=2){c.fillStyle=palette[1];c.fillRect(i,-2.9,1.25,2);}
  c.fillStyle='#263f4b';c.fillRect(-1,-2.3,2.4,1.5);
  c.strokeStyle='#efe4cb';c.lineWidth=.22;c.strokeRect(-4.2,-2.9,8.4,4.2);
  if(txt){
   c.rotate(-s.a);
   c.fillStyle='#152723dc';c.fillRect(-21,-10,42,5);
   c.fillStyle='#fbebc7';c.textAlign='center';c.font='bold 2.8px monospace';
   c.fillText(s.name.toUpperCase().slice(0,21),0,-6,40);
  }
  c.restore();
 }
}
