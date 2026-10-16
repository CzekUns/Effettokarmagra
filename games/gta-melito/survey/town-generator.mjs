/* Full Melito visual survey — deterministic, OSM-grounded, no photo claims.
 * © OpenStreetMap contributors ODbL; building footprints are never edited.
 * Photographic evidence can override these estimates by exact OSM way ID. */
const palette={
 historical:{wall:['#d3c2a8','#c9b39b','#dac9b1','#c6b7a4','#e2d3be','#d1bdad','#bdaa90'],roof:['#a97963','#b77d67','#bb9174','#ad8b6f','#c29b7d','#9c735f']},
 residential:{wall:['#cfbda7','#b8b5a5','#c5b4a4','#e0cbb2','#b6b6a7','#beb1a7','#d6cdbb','#d3b4a3'],roof:['#b5ada0','#9f9e95','#bdb8ac','#bba48e','#a39d94']},
 retail:{wall:['#aab4b0','#c2c2b7','#b6aba0','#b6afa0'],roof:['#9aa6a2','#b6bcb2','#a2aaa7']},
 industrial:{wall:['#9da6a2','#b9bcb4','#a5a9a4','#b0aba4'],roof:['#929c98','#afb7b2','#919a96','#a5aaa5']},
 ancillary:{wall:['#a89f90','#b1ad9f','#c0b29f','#a8b3a8'],roof:['#a19c91','#9d978e','#aca49a']}
};
export const TOWN_SCAN_CENTER=Object.freeze({x:1096,y:1150});
export const TOWN_SCAN_RADII=Object.freeze([190,320,500,750,1050,1450,1900,2700,4000]);
const hash=n=>{let x=(Number(n)||1)|0;x=Math.imul(x^x>>>16,2246822519);x=Math.imul(x^x>>>13,3266489917);return (x^x>>>16)>>>0};
const choose=(arr,seed)=>arr[hash(seed)%arr.length];
const bounds=p=>{
 let area=0,x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;
 let long=0,angle=0;
 for(let i=0;i<p.length;i+=2){
  const x=p[i],y=p[i+1];x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);
  if(i>=2){area+=p[i-2]*y-x*p[i-1];const dx=x-p[i-2],dy=y-p[i-1],length=dx*dx+dy*dy;if(length>long){long=length;angle=Math.atan2(dy,dx);}}
 }
 return {area:Math.round(Math.abs(area)*.5),width:x1-x0,height:y1-y0,axis:Math.round((angle*180/Math.PI+360)%180)};
};
function classify(b,row,area,nearbyDensity){
 const t=(b.t||'yes').toLowerCase(),n=(b.n||'').toLowerCase(),u=(b.usage||'').toLowerCase();
 if(/chiesa|church/.test(n)||u==='place_of_worship')return 'religious';
 if(/industr|warehouse|hangar|storage/.test(t+' '+u)||area>2300)return 'industrial';
 if(/retail|commercial|supermarket|shop/.test(t+' '+u)||/^(md|decò|eurospin)$/.test(n))return 'retail';
 if(t==='roof'||area<34)return 'ancillary';
 if(row.nearestNamedStreet&&/circumvallazione|asse perimetrale/i.test(row.nearestNamedStreet)&&area>500)return 'industrial';
 if(Math.hypot(row.x-TOWN_SCAN_CENTER.x,row.y-TOWN_SCAN_CENTER.y)<415&&area<1600)return 'historical';
 if(t==='residential'||nearbyDensity>=5)return 'residential';
 return area>600?'residential':'lowrise';
}
function makeCells(rows,size=85){
 const bins=new Map();
 for(const r of rows){const x=Math.floor(r.x/size),y=Math.floor(r.y/size),key=x+','+y;
 if(!bins.has(key))bins.set(key,[]);bins.get(key).push(r);}
 return {size,bins};
}
function neighborCount(index,row){
 const size=index.size,x=Math.floor(row.x/size),y=Math.floor(row.y/size);
 let n=0;
 for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++)
 for(const other of index.bins.get((x+dx)+','+(y+dy))||[])
 if(other.id!==row.id&&Math.hypot(other.x-row.x,other.y-row.y)<52)n++;
 return n;
}
const uses={
 historical:'historic-mixed-block',residential:'apartment-or-rowhouse',
 lowrise:'low-rise-infill',industrial:'industrial-or-warehouse',
 retail:'commercial-block',ancillary:'outbuilding',religious:'religious-footprint'
};
export function generateTownStyles(map,register,{date='2026-10-17'}={}){
 if(!map?.buildings?.length||!register?.buildings?.length)throw Error('Mancano sagome OSM o registro');
 const byId=new Map(map.buildings.map(b=>[b.id,b]));
 if(byId.size!==map.buildings.length||new Set(register.buildings.map(r=>r.id)).size!==register.buildings.length)throw Error('ID OSM duplicati');
 if(byId.size!==register.buildings.length)throw Error('Numero edifici diverso da registro OSM');
 const index=makeCells(register.buildings);
 const rings=TOWN_SCAN_RADII.map((outer,i)=>({id:'PSS-R'+String(i+1).padStart(2,'0'),fromMeters:i?TOWN_SCAN_RADII[i-1]:0,toMeters:outer,n:0,photoVerified:0}));
 const profiles=[];
 for(const row of register.buildings){
  const b=byId.get(row.id);if(!b)throw Error('Edificio OSM mancante '+row.id);
  const dims=bounds(b.p),dist=Math.hypot(row.x-TOWN_SCAN_CENTER.x,row.y-TOWN_SCAN_CENTER.y);
  const ri=Math.max(0,TOWN_SCAN_RADII.findIndex(n=>n>=dist));
  const ring=rings[ri],density=neighborCount(index,row);
  const type=classify(b,row,dims.area,density);
  const key=type==='religious'?'historical':type==='lowrise'?'residential':type;
  const tones=palette[key],seed=hash(b.id),w=choose(tones.wall,seed),roof=choose(tones.roof,seed>>>5);
  const tiers=b.lv?Math.max(1,Math.min(9,b.lv)):null;
  // These visual stories are styling parameters, NOT observed floor counts.
  const visualStories=tiers||(
   type==='industrial'?1:type==='ancillary'?1:type==='retail'?1+seed%2:
   type==='historical'?2+seed%3:
   type==='residential'?2+seed%5:
   type==='religious'?2:1+seed%3);
  const aspect=Math.max(dims.width,dims.height)/Math.max(1,Math.min(dims.width,dims.height));
  const roofKind=b.roof||(
   type==='industrial'?'corrugated-flat':
   type==='retail'?'flat':
   type==='ancillary'?'flat':
   type==='religious'?'dedicated':
   type==='historical'&&dims.area<270?'pitched-clay':
   type==='lowrise'&&aspect<2&&seed%3===0?'pitched-clay':'flat');
  const features={
   stories:visualStories,storiesMeasured:tiers!==null,
   roofKind,
   balconies:type==='residential'&&dims.area>70&&(seed%5!==0),
   roofTerrace:roofKind==='flat'&&dims.area>90&&type!=='industrial'&&type!=='retail',
   courtyard:dims.area>450&&type==='historical',
   roofTanks:roofKind==='flat'&&dims.area>140&&type==='residential'&&(seed%3===0),
   roofPanels:(type==='industrial'||type==='retail')&&dims.area>550,
   cornerShop:type==='historical'&&density>=4&&seed%5===0
  };
  const profile={
   id:b.id,sector:row.sector,ring:ring.id,scanStatus:'modeled-not-photographed',
   status:'osm-draft',photoVerified:false,facade:w,roof,detail:uses[type],
   category:type,features,
   areaM2:dims.area,longAxisDeg:dims.axis,osmType:b.t||'yes',
   osmLevels:b.lv||null,roofShape:b.roof||'',evidence:['osm:way/'+b.id]
  };
  profiles.push(profile);
  ring.n++;
 }
 profiles.sort((a,b)=>a.id-b.id);
 return {
  schema:3,description:'Melito di Napoli full-city OSM building-by-building visual draft: do not confuse appearance models with photographic survey.',
  date,mapCreated:map.created,total:profiles.length,
  anchor:TOWN_SCAN_CENTER,rings:rings.filter(r=>r.n>0),photoVerified:0,visualCoverage:profiles.length,
  process:'All building footprints and types originate in OpenStreetMap. Facade colours, roof models, balconies and untagged height are deterministic arcade interpretations. Actual buildings require verified references before photoVerified may be set.',
  profiles
 };
}
