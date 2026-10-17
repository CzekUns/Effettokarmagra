import {visualRoadWidth} from './road-widths.mjs?v=043';

export const DRIVE_ROAD_TYPES=new Set(['motorway','trunk','primary','secondary','tertiary','unclassified','residential','living_street','service','track']);

export function pointInFootprint(x,y,b,bounds=null){
 const p=b.p,bb=bounds||b.bounds;
 if(!p||p.length<6)return false;
 if(bb&&(x<bb[0]||x>bb[2]||y<bb[1]||y>bb[3]))return false;
 let inside=false;
 for(let i=0,j=p.length-2;i<p.length;j=i,i+=2){
  const ax=p[i],ay=p[i+1],bx=p[j],by=p[j+1];
  if(((ay>y)!==(by>y))&&(x<(bx-ax)*(y-ay)/(by-ay)+ax))inside=!inside;
 }
 return inside;
}

function distanceToSegment(x,y,ax,ay,bx,by){
 const dx=bx-ax,dy=by-ay,l2=dx*dx+dy*dy;
 const t=l2?Math.max(0,Math.min(1,((x-ax)*dx+(y-ay)*dy)/l2)):0;
 return Math.hypot(x-ax-t*dx,y-ay-t*dy);
}

export function nearestDrivableRoad(x,y,roads,maxDistance=Infinity){
 let best=null,bestDistance=maxDistance;
 for(const road of roads){
  if(!DRIVE_ROAD_TYPES.has(road.t)||!road.p||road.p.length<4)continue;
  for(let i=2;i<road.p.length;i+=2){
   const d=distanceToSegment(x,y,road.p[i-2],road.p[i-1],road.p[i],road.p[i+1]);
   if(d<bestDistance){bestDistance=d;best={road,distance:d};}
  }
 }
 return best;
}

export function withinDriveSurface(x,y,roads,margin=.55){
 const nearest=nearestDrivableRoad(x,y,roads,40);
 return !!nearest&&nearest.distance<=Math.max(0,visualRoadWidth(nearest.road)/2-margin);
}

function makeBuildingIndex(buildings,cell){
 const grid=new Map();
 for(const b of buildings){
  const p=b.p;if(!p||p.length<6)continue;
  let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;
  for(let i=0;i<p.length;i+=2){x0=Math.min(x0,p[i]);x1=Math.max(x1,p[i]);y0=Math.min(y0,p[i+1]);y1=Math.max(y1,p[i+1]);}
  const indexed={building:b,bounds:[x0,y0,x1,y1]};
  for(let gx=Math.floor(x0/cell);gx<=Math.floor(x1/cell);gx++)for(let gy=Math.floor(y0/cell);gy<=Math.floor(y1/cell);gy++){
   const key=gx+','+gy;if(!grid.has(key))grid.set(key,[]);grid.get(key).push(indexed);
  }
 }
 return grid;
}

/* Deterministic road-by-road test drive. Each OSM drivable way is sampled in
 * order with the actual six collision probes used by the player car. */
export function auditDrivingTour(roads,buildings,{spacing=6,cell=140}={}){
 const grid=makeBuildingIndex(buildings,cell),seenRoads=new Set(),blockedPairs=new Set(),osmPairs=new Set(),placeholderPairs=new Set();
 let roadWays=0,samples=0,overlappingProbes=0,clearedByRoadPriority=0;const unresolved=[];
 const offsets=[[-2.6,-1.7],[-2.6,1.7],[0,-1.7],[0,1.7],[3.4,-1.7],[3.4,1.7]];
 for(const road of roads){
  if(!DRIVE_ROAD_TYPES.has(road.t)||!road.p||road.p.length<4)continue;
  roadWays++;
  seenRoads.add(road.id);
  let nextSample=0,along=0;
  for(let i=2;i<road.p.length;i+=2){
   const ax=road.p[i-2],ay=road.p[i-1],dx=road.p[i]-ax,dy=road.p[i+1]-ay,len=Math.hypot(dx,dy);
   if(len<.01)continue;
   const angle=Math.atan2(dy,dx),ux=Math.cos(angle),uy=Math.sin(angle),nx=-uy,ny=ux;
   while(nextSample<=along+len){
    const t=Math.max(0,Math.min(1,(nextSample-along)/len)),x=ax+dx*t,y=ay+dy*t;samples++;
    for(const [forward,side] of offsets){
     const px=x+ux*forward+nx*side,py=y+uy*forward+ny*side;
     for(const entry of grid.get(Math.floor(px/cell)+','+Math.floor(py/cell))||[]){
      const b=entry.building;
      if(pointInFootprint(px,py,b,entry.bounds)){
       const pair=road.id+':'+b.id;blockedPairs.add(pair);(b.id<0?placeholderPairs:osmPairs).add(pair);overlappingProbes++;
       if(withinDriveSurface(px,py,roads,.55))clearedByRoadPriority++;else unresolved.push({roadId:road.id,buildingId:b.id,x:px,y:py});
      }
     }
    }
    nextSample+=spacing;
   }
   along+=len;
  }
 }
 return {roadWays,roadsVisited:seenRoads.size,roadIds:[...seenRoads],samples,overlappingProbes,
  blockedPairs:blockedPairs.size,osmPairs:osmPairs.size,placeholderPairs:placeholderPairs.size,
  clearedByRoadPriority,unresolvedProbes:overlappingProbes-clearedByRoadPriority,unresolved};
}
