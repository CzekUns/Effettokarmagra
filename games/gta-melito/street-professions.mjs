/* Fictional, deterministic street commerce and neighbourhood professions.
 * OSM roads define the real geometry; vendor locations and job identities
 * are artistic placements, NOT surveyed shops, licensed stalls or traffic lights.
 * No new map features, traffic signal claims or synthetic street geometry. */
import {MARKET_VARIANTS} from './car-sprites.mjs?v=108';
import {vehicleHitsPedestrian} from './traffic-collision.mjs?v=128';
import {washerSpots} from './window-washers.mjs?v=002';
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
/* BF04: service side measured on the RGBA PNGs (alpha > 40), in metres from the sprite centre
 * as drawn by car-sprites.mjs (rotate(angle+PI/2): sprite right = (-sin a, cos a), sprite top =
 * the bonnet). All 8 'furgone-ambulante' cells open their hatch with the striped awning on the
 * sprite's right: body edge at +1.55..+1.83 m, awning edge at +3.67 m, counter along the van
 * from about -2.6 to +3.2 m (front negative). The fritti van has the same side: edge +2.57 m. */
export const SERVICE_SIDES=Object.freeze({
 'furgone-ambulante':Object.freeze({side:1,edge:3.67,along:Object.freeze([-2.6,3.2])}),
 'furgone-fritti':Object.freeze({side:1,edge:2.57,along:Object.freeze([-2.49,3.34])})
});
export const FRYER_GAP=.6;
export function serviceSide(model){
 return SERVICE_SIDES[MARKET_VARIANTS[model]?.model||model]||null;
}
/* Where the fryer stands: just outside the counter, `gap` metres beyond the awning edge,
 * `along` metres along the van (0 = middle of the counter), facing the counter. */
export function fryerServicePose(vehicle,{gap=FRYER_GAP,along=0}={}){
 const s=serviceSide(vehicle?.model);
 if(!s)return null;
 const ly=(s.along[0]+s.along[1])/2+along,lx=s.side*(s.edge+gap);
 const nx=-Math.sin(vehicle.a),ny=Math.cos(vehicle.a),hx=Math.cos(vehicle.a),hy=Math.sin(vehicle.a);
 return {x:vehicle.x+nx*lx-hx*ly,y:vehicle.y+ny*lx-hy*ly,a:Math.atan2(-ny*s.side,-nx*s.side)};
}
// The counter faces the pavement: a van parked on the far side of an edge points the other way.
export function servicePavementHeading(edgeAngle,side,model){
 const s=serviceSide(model);
 return edgeAngle+((s?s.side:1)*side<0?Math.PI:0);
}
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
    const vehicle={...pose,a:servicePavementHeading(edge.angle,side,where.model),model:where.model,
     vehicleType:'car',type:6,speed:0,vendorStand:true,vendorDistrict:where.name};
    if(!clearOf(vehicle,occupied,12)||!clearOf(vehicle,placed.map(v=>v.vehicle),125)||
      !vehicleOK(vehicle))continue;
    // BF04: the fryer works at the counter of ITS van, never metres away from it.
    for(const along of [0,-.9,.9])for(const gap of [FRYER_GAP,.9]){
     const person=fryerServicePose(vehicle,{gap,along});
     if(!person||vehicleHitsPedestrian(vehicle,person,.8))continue;
     if(!walkerOK(person)||!clearOf(person,occupied,5.8))continue;
     selected={vehicle,fryer:{...person,stationary:true,profession:'friggitore',
      body:'walk',kind:1,speed:0,seed:3200+placed.length,braking:true,
      post:{x:person.x,y:person.y,a:person.a},district:where.name}};
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
 // BF08: with the (simulated) traffic lights, one washer per light, next to its post on the
 // pavement; window-washers.mjs moves them to the driver side of the first car stopped at red.
 let washers=0;
 for(const spot of graph.signals?.length?washerSpots(graph,graph.signals,{walkerOK,occupied}):[]){
  const e=graph.edges[spot.A.edge],d=Math.hypot(spot.x-graph.nodes[e.to].x,spot.y-graph.nodes[e.to].y);
  const at={x:spot.x,y:spot.y,a:spot.a},seed=4700+washers*101;
  const agent={...at,edge:spot.A.edge,t:Math.max(0,1-d/e.len),side:1,body:'walk',kind:1,seed,speed:0,routine:'errand',
   segments:0,wait:0,braking:true,profession:'lavavetri',stationary:true,post:{...at},
   home:{...at,edge:spot.A.edge,side:1,radius:12,returnEdges:[spot.A.edge]},washer:{J:spot.J,A:spot.A,phase:'KERB'}};
  actors.push(agent);occupied.push(agent);washers++;
 }
 if(!washers)for(const near of candidateJunctions(graph)){
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
