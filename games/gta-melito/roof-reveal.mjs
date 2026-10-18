/* Roof projection is visual only. OSM footprints and physical collision stay
 * in their mapped positions, while the raised roof extends northwest. */
import {buildingVolume} from './building-volume.mjs?v=088';
import {pointInFootprint} from './road-clearance.mjs?v=099';

export function projectedRoofCovers(building,x,y,radius=0){
 const volume=buildingVolume(building);
 if(!volume)return false;
 const art=building.art;
 if(x<art.x0-volume.dx-radius||x>art.x1+radius||
  y<art.y0-volume.dy-radius||y>art.y1+radius)return false;
 const samples=[[0,0],[-radius,0],[radius,0],[0,-radius],[0,radius]];
 return samples.some(([sx,sy])=>
  pointInFootprint(x+sx,y+sy,building)||
  pointInFootprint(x+sx+volume.dx,y+sy+volume.dy,building));
}

export function roofRevealTarget(building,actors){
 for(const actor of actors||[]){
  if(actor.onStreet&&projectedRoofCovers(building,actor.x,actor.y,actor.radius||0))return 1;
 }
 return 0;
}

export function easeRoofReveal(current,target,dt){
 const t=1-Math.exp(-Math.max(0,Math.min(.05,dt))*9);
 return current+(target-current)*t;
}

export function traceRoofCover(ctx,building){
 const volume=buildingVolume(building);
 if(!volume)return;
 const trace=(dx,dy)=>{
  const p=building.p;ctx.moveTo(p[0]+dx,p[1]+dy);
  for(let i=2;i<p.length;i+=2)ctx.lineTo(p[i]+dx,p[i+1]+dy);
  ctx.closePath();
 };
 ctx.beginPath();trace(0,0);trace(-volume.dx,-volume.dy);
}
