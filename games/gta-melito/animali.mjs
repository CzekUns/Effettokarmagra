/* Animali di strada: solo grafica e movimento lieve. Posti da vie/edifici OSM,
 * mercato, recinto della villa e auto parcheggiate; mai nell'indice collisioni. */
const PIGEON_PATH='./assets/animals/piccioni-8x8.png';
const CAT_PATH='./assets/animals/gatti-12x8.png';
export const ANIMAL_LIMITS=Object.freeze({pigeons:60,cats:20});
let pigeonImage=null,catImage=null;
export function loadAnimalSprites(){
 if(typeof Image==='undefined')return;
 if(!pigeonImage){pigeonImage=new Image();pigeonImage.src=new URL(PIGEON_PATH,import.meta.url).href;}
 if(!catImage){catImage=new Image();catImage.src=new URL(CAT_PATH,import.meta.url).href;}
}
export const animalSpritesReady=()=>!!(pigeonImage?.complete&&pigeonImage.naturalWidth===32&&pigeonImage.naturalHeight===16&&
 catImage?.complete&&catImage.naturalWidth===36&&catImage.naturalHeight===24);
const hash=n=>{let x=n|0;x=Math.imul(x^x>>>16,2246822519);x=Math.imul(x^x>>>13,3266489917);return (x^x>>>16)>>>0;};
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const polyCenter=p=>{const points=[];for(let i=0;i<(p||[]).length;i+=2)points.push({x:p[i],y:p[i+1]});
 return points.length?{x:points.reduce((s,q)=>s+q.x,0)/points.length,y:points.reduce((s,q)=>s+q.y,0)/points.length}:null;};
const roadCenter=r=>{const p=r?.p;if(!p||p.length<4)return null;const i=Math.floor(p.length/4)*2;return {x:p[i],y:p[i+1]};};
const safeAt=(p,canStand,onRoad,doors)=>Number.isFinite(p?.x)&&Number.isFinite(p?.y)&&canStand(p.x,p.y)&&!onRoad(p.x,p.y)&&
 doors.every(d=>distance(p,d)>3);
function near(anchor,valid,steps=[0,2,4,6,9,13,18]){
 if(!anchor)return null;
 for(const radius of steps)for(let j=0;j<12;j++){
  const a=j*Math.PI/6,p={x:anchor.x+radius*Math.cos(a),y:anchor.y+radius*Math.sin(a)};
  if(valid(p))return p;
 }
 return null;
}
function createFlock(anchor,id,size,valid){
 const center=near(anchor,p=>valid(p)&&[0,Math.PI/2,Math.PI,3*Math.PI/2].every(a=>valid({x:p.x+Math.cos(a)*2.5,y:p.y+Math.sin(a)*2.5})));
 if(!center)return null;
 const birds=[];
 for(let i=0;i<size;i++){
  const a=i*2.39996,r=.5+(i%4)*.45,p={x:center.x+Math.cos(a)*r,y:center.y+Math.sin(a)*r};
  if(!valid(p))continue;
  birds.push({x:p.x,y:p.y,homeX:p.x,homeY:p.y,state:'ground',time:i*.21,color:i%3===0?1:0,
   seed:hash(id.length*47+i*19),cooldown:0,flight:0,target:null});
 }
 return birds.length>=4?{id,center,birds}:null;
}
export function createAnimals({map,roads=[],enclosures,market,parked=[],doors=[],canStand=()=>true,onRoad=()=>false}={}){
 const valid=p=>safeAt(p,canStand,onRoad,doors),flocks=[],cats=[];
 const anchors=[];
 for(const r of roads.filter(r=>/\b(piazza|largo)\b/i.test(r.n||'')))anchors.push({id:'piazza-'+r.id,point:roadCenter(r)});
 for(const b of (map?.buildings||[]).filter(b=>b.usage==='place_of_worship'))anchors.push({id:'chiesa-'+b.id,point:polyCenter(b.p)});
 if(market?.stalls?.length){const s=market.stalls[Math.floor(market.stalls.length/2)];anchors.push({id:'mercato',point:{x:s.x,y:s.y}});}
 const villa=enclosures?.list?.find(e=>e.id==='villa-comunale');
 if(villa)anchors.push({id:'villa',point:villa.center});
 for(const [i,anchor] of anchors.entries()){
  if(flocks.length>=9)break;
  if(!anchor.point)continue;
  if(flocks.some(f=>distance(f.center,anchor.point)<24))continue;
  const flock=createFlock(anchor.point,anchor.id,4+hash(i*31)%5,valid);
  if(flock&&flocks.reduce((n,f)=>n+f.birds.length,0)+flock.birds.length<=ANIMAL_LIMITS.pigeons)flocks.push(flock);
 }
 // Un gatto circa ogni 2–3 isolati: campionamento stabile delle auto in sosta.
 // Il punto è cercato sul marciapiede vicino all'auto, mai sulla corsia.
 const candidateCars=parked.filter(v=>Number.isFinite(v.x)&&Number.isFinite(v.y)&&v.vehicleType!=='motorcycle');
 const step=Math.max(4,Math.ceil(candidateCars.length/16));
 for(let i=0;i<candidateCars.length&&cats.length<ANIMAL_LIMITS.cats;i+=step){
  const car=candidateCars[i],p=near({x:car.x,y:car.y},q=>valid(q)&&distance(q,car)>=3.2&&distance(q,car)<=9,[4,5,6,7,8]);
  if(!p||cats.some(c=>distance(c,p)<25))continue;
  cats.push({x:p.x,y:p.y,homeX:p.x,homeY:p.y,color:cats.length%3,state:'sit',time:0,
   seed:hash(i*71+cats.length),target:null,source:'auto:'+i});
 }
 // Muretti del recinto: riempi qualche isolato privo di auto adiacenti.
 for(const e of enclosures?.list||[]){
  if(cats.length>=ANIMAL_LIMITS.cats)break;
  for(let i=0;i<(e.loop?.length||0);i+=Math.max(1,Math.floor(e.loop.length/5))){
   if(cats.length>=ANIMAL_LIMITS.cats)break;
   const [x,y]=e.loop[i],p=near({x,y},q=>valid(q)&&cats.every(c=>distance(c,q)>25),[2,3,4,6]);
   if(p)cats.push({x:p.x,y:p.y,homeX:p.x,homeY:p.y,color:cats.length%3,state:'sit',time:0,
    seed:hash(i*59+cats.length),target:null,source:'muretto:'+e.id});
  }
 }
 return {flocks,cats,pigeons:flocks.flatMap(f=>f.birds),seconds:0};
}
function fleeTarget(from,threat,distanceWanted,valid){
 const base=Math.atan2(from.y-threat.y,from.x-threat.x);
 for(const da of [0,.45,-.45,.9,-.9,Math.PI])for(const r of [distanceWanted,Math.max(10,distanceWanted-2),10]){
  const p={x:from.x+Math.cos(base+da)*r,y:from.y+Math.sin(base+da)*r};
  if(valid(p))return p;
 }
 return null;
}
export function stepAnimals(world,dt,{player,vehicles=[],canStand=()=>true,onRoad=()=>false,doors=[]}={}){
 if(!world)return;
 const step=Math.max(0,Math.min(.1,Number(dt)||0));world.seconds+=step;
 const valid=p=>safeAt(p,canStand,onRoad,doors);
 const threats=[...(player?[player]:[]),...vehicles.filter(v=>Math.abs(v.speed||v.v||0)>.5)];
 for(const b of world.pigeons){
  b.time+=step;b.cooldown=Math.max(0,b.cooldown-step);
  const threat=threats.find(t=>distance(b,t)<2);
  if(b.state==='ground'&&threat&&b.cooldown===0){
   const target=fleeTarget(b,threat,12+hash(b.seed)%4,valid);
   if(target){b.target=target;b.start={x:b.x,y:b.y};b.state='flight';b.flight=0;}
  }
  if(b.state==='flight'){
   b.flight=Math.min(1,b.flight+step/1.3);
   const t=b.flight,bend=t*t*(3-2*t);
   b.x=b.start.x+(b.target.x-b.start.x)*bend;b.y=b.start.y+(b.target.y-b.start.y)*bend;
   if(t>=1){b.state='ground';b.homeX=b.x;b.homeY=b.y;b.target=null;b.cooldown=2.5;}
  }else if(b.state==='ground'){
   const x=b.homeX+Math.sin(b.time*.6+b.seed%7)*.45,y=b.homeY+Math.cos(b.time*.5+b.seed%11)*.4;
   if(valid({x,y})){b.x=x;b.y=y;}
  }
 }
 for(const cat of world.cats){
  cat.time+=step;
  if(cat.state==='sit'){
   const threat=player&&distance(cat,player)<1.5?player:null;
   if(threat){const target=fleeTarget(cat,threat,3.5,valid);if(target){cat.target=target;cat.state='walk';}}
  }
  if(cat.state==='walk'&&cat.target){
   const d=distance(cat,cat.target),amount=Math.min(d,step*1.4);
   const x=cat.x+(cat.target.x-cat.x)/(d||1)*amount,y=cat.y+(cat.target.y-cat.y)/(d||1)*amount;
   if(valid({x,y})){cat.x=x;cat.y=y;}
   if(d<.12||!valid({x,y})){cat.state='sit';cat.target=null;cat.homeX=cat.x;cat.homeY=cat.y;}
  }
 }
}
export function drawAnimals(c,world,bounds){
 if(!world)return;
 const [x0,y0,x1,y1]=bounds,visible=p=>p.x>=x0-2&&p.x<=x1+2&&p.y>=y0-2&&p.y<=y1+2;
 const birdReady=pigeonImage?.complete&&pigeonImage.naturalWidth===32;
 const catReady=catImage?.complete&&catImage.naturalWidth===36;
 for(const b of world.pigeons){
  if(!visible(b))continue;
  const flying=b.state==='flight',lift=flying?Math.sin(b.flight*Math.PI)*1.8:0;
  c.fillStyle='rgba(25,25,24,.25)';c.fillRect(b.x-.32,b.y-.05,.64,.16);
  if(birdReady)c.drawImage(pigeonImage,(flying?2+(Math.floor(b.time*9)%2):Math.floor(b.time*3)%2)*8,b.color*8,8,8,
   b.x-.57,b.y-.95-lift,1.14,1.14);
  else{c.fillStyle=b.color?'#eee8d7':'#72777a';c.fillRect(b.x-.3,b.y-.45-lift,.6,.45);}
 }
 for(const cat of world.cats){
  if(!visible(cat))continue;
  const moving=cat.state==='walk',frame=moving?Math.floor(cat.time*5)%2:2;
  c.fillStyle='rgba(24,24,23,.24)';c.fillRect(cat.x-.6,cat.y-.04,1.2,.18);
  if(catReady)c.drawImage(catImage,frame*12,cat.color*8,12,8,cat.x-.9,cat.y-1.25,1.8,1.25);
  else{c.fillStyle=['#9a7550','#3e4142','#eee0cc'][cat.color];c.fillRect(cat.x-.58,cat.y-.68,1.16,.65);}
 }
}
