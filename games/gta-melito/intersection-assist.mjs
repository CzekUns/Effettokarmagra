/* Optional turn guide derived from legal directed edges of the OSM graph.
 * It only activates on a nearby junction with a small deliberate steer. */
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));

export function buildTurnGuides(graph){
 const incoming=graph.nodes.map(()=>[]);
 graph.edges.forEach((edge,i)=>{if(edge.car)incoming[edge.to].push(i);});
 const guides=[];
 graph.nodes.forEach((node,id)=>{
  const exits=node.out.filter(i=>graph.edges[i].car);
  if(exits.length<2)return;
  const approaches=incoming[id].map(i=>{
   const edge=graph.edges[i];
   const turns=exits.map(out=>({out,diff:wrap(graph.edges[out].angle-edge.angle)}))
    .filter(t=>graph.edges[t.out].to!==edge.from&&Math.abs(t.diff)>.38&&Math.abs(t.diff)<2.3);
   return {roadId:edge.roadId,angle:edge.angle,turns};
  }).filter(a=>a.turns.length);
  if(approaches.length)guides.push({x:node.x,y:node.y,approaches});
 });
 return guides;
}

export function guideIntersection(car,steer,road,graph,guides,turn=null,dt=0){
 const elapsed=clamp(Number(dt)||0,0,.05),input=clamp(Number(steer)||0,-1,1);
 if(car.speed<3||Math.abs(input)>.7)return {angle:car.angle,speed:car.speed,turn:null};
 if(!turn&&road&&Math.abs(input)>=.14&&Math.abs(input)<=.52){
  let best=Infinity;
  for(let i=0;i<guides.length;i++){
   const guide=guides[i],dx=guide.x-car.x,dy=guide.y-car.y;
   const ahead=dx*Math.cos(car.angle)+dy*Math.sin(car.angle);
   const lateral=Math.abs(-dx*Math.sin(car.angle)+dy*Math.cos(car.angle));
   if(ahead<1||ahead>clamp(car.speed*.55,10,20)||lateral>5.5)continue;
   for(const approach of guide.approaches){
    if(approach.roadId!==road.road.id||Math.abs(wrap(approach.angle-car.angle))>.5)continue;
    for(const option of approach.turns){
     if(Math.sign(option.diff)!==Math.sign(input))continue;
     const score=ahead+Math.abs(option.diff)*1.5+lateral;
     if(score<best){best=score;turn={guide:i,out:option.out,age:0};}
    }
   }
  }
 }
 if(!turn)return {angle:car.angle,speed:car.speed,turn:null};
 const guide=guides[turn.guide],edge=graph.edges[turn.out];
 if(!guide||!edge)return {angle:car.angle,speed:car.speed,turn:null};
 const along=(car.x-guide.x)*Math.cos(edge.angle)+(car.y-guide.y)*Math.sin(edge.angle);
 const sideways=Math.abs(-(car.x-guide.x)*Math.sin(edge.angle)+(car.y-guide.y)*Math.cos(edge.angle));
 if(along>5&&sideways<2.5&&Math.abs(wrap(edge.angle-car.angle))<.2||along>28||turn.age>3)
  return {angle:car.angle,speed:car.speed,turn:null};
 // Aim through the junction, then into the legal exit. The target lies on
 // the road and never changes the car's position directly.
 const lookahead=clamp(car.speed*.9,15,23);
 const targetAlong=Math.max(0,along)+lookahead;
 const entering=Math.hypot(car.x-guide.x,car.y-guide.y)>7&&along<0;
 const targetX=entering?guide.x:guide.x+Math.cos(edge.angle)*targetAlong;
 const targetY=entering?guide.y:guide.y+Math.sin(edge.angle)*targetAlong;
 const desired=Math.atan2(targetY-car.y,targetX-car.x);
 const angle=car.angle+clamp(wrap(desired-car.angle),-3.5*elapsed,3.5*elapsed);
 const speed=Math.min(car.speed,Math.max(11,car.speed-52*elapsed));
 return {angle,speed,turn:{...turn,age:turn.age+elapsed}};
}
