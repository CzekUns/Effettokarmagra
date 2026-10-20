/* Fictional, deterministic street commerce and neighbourhood professions.
 * OSM roads define the real geometry; vendor locations and job identities
 * are artistic placements, NOT surveyed shops, licensed stalls or traffic lights.
 * No new map features, traffic signal claims or synthetic street geometry. */
export const TRAFFIC_APES=Object.freeze([
 'ape-azzurra-vuota','ape-azzurra-ferro','ape-verde-vuota','ape-verde-ferro'
]);
export const FOOD_STALLS=Object.freeze([
 {name:'Piazza Santo Stefano',x:1096,y:1150,road:/Piazza Santo Stefano|Via Roma/i,model:'food-zeppole-panzerotti'},
 {name:'Piazza Immacolata',x:1446,y:1130,road:/Piazza Immacolata|Via Santo Stefano/i,model:'food-pizzette-fritte'},
 {name:'Corso Europa',x:1180,y:1935,road:/Corso Europa/i,model:'food-panini'},
 {name:'Largo Cinque Via',x:680,y:1620,road:/Largo Cinque Via|Corso Europa/i,model:'food-pizza-portafoglio'},
 {name:'Via Roma',x:1680,y:2000,road:/Via Roma/i,model:'food-cornetti'}
]);
export function trafficApeModel(index){
 return index%11===3?TRAFFIC_APES[Math.floor(index/11)%TRAFFIC_APES.length]:null;
}
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const boundsPoint=(graph,edgeId,t,side,offset)=>{
 const e=graph.edges[edgeId],a=graph.nodes[e.from],b=graph.nodes[e.to];
 return {x:a.x+(b.x-a.x)*t-Math.sin(e.angle)*offset*side,
  y:a.y+(b.y-a.y)*t+Math.cos(e.angle)*offset*side,a:e.angle};
};
const roadChoices=(graph,where,minimum=18)=>graph.edges.map((edge,id)=>({edge,id}))
 .filter(({edge})=>edge.car&&edge.len>=minimum&&(!where.road||where.road.test(edge.name||'')))
 .sort((a,b)=>{
  const mid=e=>boundsPoint(graph,e.id,.5,1,0);
  return distance(mid(a),where)-distance(mid(b),where)||a.id-b.id;
 });
function clearOf(point,actors,range){
 return actors.every(other=>!other||distance(point,other)>=range);
}
/* Vehicles must pass the SAME OSM/drivable clearance as other parked cars.
 * The fryer must have a valid, free foot position; otherwise skip that stall.
 * Never sacrifice a lane or doorway just to meet a visual quota. */
export function placeStreetFoodVendors(graph,parked,{vehicleOK,walkerOK,vehicleOffset=null}={}){
 if(!graph?.edges?.length||!vehicleOK||!walkerOK)return [];
 const placed=[],occupied=[...parked];
 for(const where of FOOD_STALLS){
  const edges=roadChoices(graph,where,18).slice(0,110);
  let selected=null;
  for(const {edge,id} of edges){
   if(distance(boundsPoint(graph,id,.5,1,0),where)>310)continue;
   for(const t of [.38,.62,.5])for(const side of [1,-1]){
    // BF02: with parking bays the van stands in the strip between lane and pavement.
    const lateral=vehicleOffset?vehicleOffset(edge.streetWidth):edge.streetWidth/2+2.25;
    if(lateral==null)continue;
    const pose=boundsPoint(graph,id,t,side,lateral);
    const vehicle={...pose,model:where.model,vehicleType:'car',type:6,speed:0,
     vendorStand:true,vendorDistrict:where.name};
    if(!clearOf(vehicle,occupied,12)||!clearOf(vehicle,placed.map(v=>v.vehicle),125)||
      !vehicleOK(vehicle))continue;
    for(const ahead of [6.7,-6.7,8.3,-8.3])for(const extra of [3.2,4.4,2.3]){
     const person={x:pose.x+Math.cos(pose.a)*ahead-Math.sin(pose.a)*side*extra,
      y:pose.y+Math.sin(pose.a)*ahead+Math.cos(pose.a)*side*extra,
      a:pose.a+(ahead<0?0:Math.PI)};
     if(!walkerOK(person)||!clearOf(person,occupied,5.8))continue;
     selected={vehicle,fryer:{...person,stationary:true,profession:'friggitore',
      body:'walk',kind:1,speed:0,seed:3200+placed.length,braking:true,
      post:{x:person.x,y:person.y},district:where.name}};
     break;
    }
    if(selected)break;
   }
   if(selected)break;
  }
  if(selected){placed.push(selected);occupied.push(selected.vehicle);}
 }
 return placed;
}
function selectedWalker(graph,where,occupied,walkerOK,seed,profession,{stationary=false,radius=70}={}){
 for(const {edge,id} of roadChoices(graph,where,15).slice(0,110)){
  if(distance(boundsPoint(graph,id,.5,1,0),where)>320)continue;
  for(const t of [.32,.57,.72])for(const side of [1,-1]){
   const at=boundsPoint(graph,id,t,side,edge.walk?(edge.car?edge.streetWidth/2+1.7:0):0);
   if(!walkerOK(at)||!clearOf(at,occupied,stationary?6:8))continue;
   const agent={...at,edge:id,t,side,body:'walk',kind:1,seed,speed:stationary?0:profession==='vigile'?1.1:.8,
    routine:profession==='vigile'?'commuter':'errand',segments:0,wait:0,braking:stationary,
    profession,stationary,home:{...at,edge:id,side,radius}};
   agent.home.returnEdges=graph.walkStarts.filter(eid=>{
    const q=graph.edges[eid],n=graph.nodes[q.from];
    return distance(n,at)<radius*.58;
   });
   if(!agent.home.returnEdges.includes(id))agent.home.returnEdges.unshift(id);
   if(stationary)agent.post={x:at.x,y:at.y};
   return agent;
  }
 }
 return null;
}
const OFFICER_AREAS=[
 {x:1096,y:1150,road:/Via Roma|Piazza Santo Stefano/i},
 {x:1450,y:1140,road:/Piazza Immacolata|Via Santo Stefano/i},
 {x:680,y:1620,road:/Largo Cinque Via|Corso Europa/i},
 {x:1190,y:1940,road:/Corso Europa/i},
 {x:1780,y:2100,road:/Via Roma/i}
];
const DEALER_AREAS=[
 {x:610,y:900,road:/./}, {x:1570,y:1460,road:/./},
 {x:880,y:2240,road:/./}, {x:1810,y:2450,road:/./},
 {x:750,y:450,road:/./}
];
/* Signals are not tagged in the supplied OSM POI snapshot.
 * These are junction-side arcade placements, never asserted as real lights. */
function candidateJunctions(graph){
 return graph.nodes.flatMap((node,i)=>{
  const exits=node.out.map(id=>({edge:graph.edges[id],id})).filter(q=>q.edge.car&&q.edge.walk&&q.edge.len>=18);
  if(exits.length<3)return [];
  return exits.map(({edge})=>({x:node.x,y:node.y,road:new RegExp('.*'),
   junction:i,priority:edge.roadType==='primary'?2:edge.roadType==='secondary'?1:0}));
 }).sort((a,b)=>b.priority-a.priority||a.junction-b.junction);
}
export function createStreetProfessionActors(graph,vendors,parked,existing,{walkerOK}={}){
 if(!graph?.edges?.length||!walkerOK)return [];
 const actors=vendors.map(s=>s.fryer),occupied=[...parked,...existing,...actors];
 const add=(where,profession,seed,settings)=>{
  const actor=selectedWalker(graph,where,occupied,walkerOK,seed,profession,settings);
  if(actor){actors.push(actor);occupied.push(actor);}return actor;
 };
 OFFICER_AREAS.forEach((p,i)=>add(p,'vigile',3900+i*97,{radius:75}));
 // Work by intersections and remain on the pavement rather than in a vehicle lane.
 let washers=0;
 for(const near of candidateJunctions(graph)){
  if(washers>=7)break;
  if(actors.some(a=>a.profession==='lavavetri'&&distance(a,near)<135))continue;
  const where={...near,road:/./};
  const agent=add(where,'lavavetri',4700+washers*101,{stationary:true,radius:12});
  if(agent){agent.a=graph.edges[agent.edge].angle;washers++;}
 }
 // Back-street patrol: choose service/residential edges close to dispersed districts.
 DEALER_AREAS.forEach((p,i)=>{
  const edge=roadChoices(graph,p,16).find(({edge,id})=>
   ['service','residential','living_street'].includes(edge.roadType)&&
   distance(boundsPoint(graph,id,.5,1,0),p)<280);
  if(edge)add({...p,road:new RegExp('^'+(edge.edge.name||'') .replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'$')},
   'contrabbandiere',5500+i*103,{radius:48});
 });
 return actors;
}
