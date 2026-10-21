/* Giochi di strada: scene decorative, senza collisione con il giocatore.
 * Luoghi da recinti/POI/percorsi pedonali già presenti; nessuna coordinata cittadina inventata. */
import {npcWeekday} from './npc-agenda.mjs?v=002';
import {pedestrianSheet} from './extra-pedestrian-sprites.mjs?v=007';
import {drawSheetPedestrianSprite} from './extra-pedestrian-sprites.mjs?v=007';
import {drawIdlePose,drawIdleCardGesture} from './pose-pedoni.mjs?v=002';

const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const hash=n=>{let x=n|0;x=Math.imul(x^x>>>16,2246822519);x=Math.imul(x^x>>>13,3266489917);return (x^x>>>16)>>>0;};
const KIDS=Object.freeze([25,44,...[1,2].flatMap(v=>[
 pedestrianSheet('lotto13-var'+v).startKind+2,
 pedestrianSheet('lotto20-var'+v).startKind+1])]);
const ELDERS=Object.freeze([19,20,...[1,2].flatMap(v=>[
 pedestrianSheet('lotto12-var'+v).startKind,
 pedestrianSheet('lotto12-var'+v).startKind+1])]);
export const STREET_GAME_KIDS=KIDS;
export const STREET_GAME_ELDERS=ELDERS;
const inside=(p,ring)=>{let yes=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){
 const a=ring[i],b=ring[j];if(((a[1]>p.y)!==(b[1]>p.y))&&p.x<(b[0]-a[0])*(p.y-a[1])/(b[1]-a[1])+a[0])yes=!yes;
 }return yes;};
export function streetGamesOpen(minutes){
 const hour=((Math.floor(minutes/60)%24)+24)%24;
 const weekend=['SABATO','DOMENICA'].includes(npcWeekday(minutes));
 return {kids:hour>=(weekend?10:16)&&hour<20,cards:(hour>=9&&hour<12)||(hour>=16&&hour<19)};
}
function search(anchor,valid,region=null){
 if(!anchor)return null;
 for(const r of [0,3,6,10,15,21])for(let a=0;a<8;a++){
  const t=a*Math.PI/4,p={x:anchor.x+Math.cos(t)*r,y:anchor.y+Math.sin(t)*r};
  if((!region||region(p))&&valid(p))return p;
 }
 return null;
}
function ringPoint(center,radius,angle){return {x:center.x+Math.cos(angle)*radius,y:center.y+Math.sin(angle)*radius};}
function ballGroup(id,anchor,valid,region,count=4){
 const center=search(anchor,p=>valid(p)&&Array.from({length:16},(_,i)=>i*Math.PI/8).every(a=>valid(ringPoint(p,3,a))),region);
 if(!center)return null;
 const points=Array.from({length:count},(_,i)=>ringPoint(center,3,i*2*Math.PI/count));
 if(!points.every(valid)||points.some(a=>points.some(b=>Array.from({length:9},(_,i)=>i/8).some(t=>!valid({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t})))))return null;
 const kids=points.map((p,i)=>({x:p.x,y:p.y,homeX:p.x,homeY:p.y,prevX:p.x,prevY:p.y,
  a:Math.atan2(center.y-p.y,center.x-p.x),kind:KIDS[hash(id.length*31+i)%KIDS.length],seed:hash(i*43+id.length),moving:true}));
 return {id,center,kids,points,ball:{x:points[0].x,y:points[0].y},from:0,to:1,
  seconds:0,passDuration:1.2,nextPass:1.1,pause:0,active:false};
}
function cardTable(id,anchor,valid,region=null,avoid=[]){
 const center=search(anchor,p=>valid(p)&&avoid.every(q=>dist(p,q)>10)&&[[2.5,1.8],[-2.5,1.8],[2.5,-1.8],[-2.5,-1.8]].every(([dx,dy])=>valid({x:p.x+dx,y:p.y+dy})),region);
 if(!center)return null;
 const seats=[[2.5,1.8],[-2.5,1.8],[2.5,-1.8],[-2.5,-1.8]];
 const people=seats.map(([dx,dy],i)=>({x:center.x+dx,y:center.y+dy,a:Math.atan2(-dy,-dx),
  kind:ELDERS[(i+hash(id.length))%ELDERS.length],activity:'bench',pose:'seated',seed:hash(i*57+id.length)}));
 return {id,center,people,seconds:0,turn:0,active:false};
}
/* I campetti usano il prato libero all'interno della recinzione. Gli slarghi sono scelti
 * dai tratti footway/pedestrian del grafo, richiedendo un disco percorribile e senza auto. */
export function createStreetGames({map,enclosures,pitches,graph,doors=[],canStand=()=>true,onRoad=()=>false}={}){
 const valid=p=>Number.isFinite(p.x)&&Number.isFinite(p.y)&&canStand(p.x,p.y)&&!onRoad(p.x,p.y)&&
  doors.every(d=>dist(p,d)>4);
 const ballGroups=[],cardTables=[];
 const villa=enclosures?.list?.find(e=>e.id==='villa-comunale');
 const villaArea=villa?.loop?p=>inside(p,villa.loop):null;
 if(villa){const g=ballGroup('villa',{x:villa.center.x+7,y:villa.center.y+7},valid,villaArea);if(g)ballGroups.push(g);
  const table=cardTable('carte-villa',villa.center,valid,villaArea,ballGroups.map(q=>q.center));if(table)cardTables.push(table);}
 for(const pitch of (pitches?.list||[]).filter(p=>p.kind==='calcetto')){
  const area=p=>Math.abs(p.x-pitch.cx)<pitch.w/2-4&&Math.abs(p.y-pitch.cy)<pitch.h/2-4;
  const g=ballGroup('campo-'+pitch.id,{x:pitch.cx,y:pitch.cy},valid,area);
  if(g)ballGroups.push(g);
 }
 const footEdges=(graph?.walkStarts||[]).map(id=>graph.edges[id]).filter(e=>e&&['footway','pedestrian','path','living_street'].includes(e.roadType)&&e.len>=18);
 for(const e of footEdges){
  if(ballGroups.filter(g=>g.id.startsWith('slargo')).length>=3)break;
  const a=graph.nodes[e.from],b=graph.nodes[e.to];if(!a||!b)continue;
  const anchor={x:(a.x+b.x)/2,y:(a.y+b.y)/2};
  if(ballGroups.some(g=>dist(g.center,anchor)<35))continue;
  const g=ballGroup('slargo-'+e.from+'-'+e.to,anchor,valid,null,3);
  if(g)ballGroups.push(g);
 }
 const hall=(map?.pois||[]).find(p=>p.k==='townhall');
 if(hall){const table=cardTable('carte-municipio',{x:hall.p[0],y:hall.p[1]},valid);if(table)cardTables.push(table);}
 return {ballGroups,cardTables,activeKids:[],activeCards:[],seconds:0};
}

export function stepStreetGames(games,dt,{minutes,player,canStand=()=>true,onRoad=()=>false,matchOpen=false,matchPitchId=null}={}){
 if(!games)return;
 const hours=streetGamesOpen(minutes);games.seconds+=Math.max(0,dt);
 games.activeKids=hours.kids?games.ballGroups.filter(g=>!matchOpen&&g.id!=='campo-'+matchPitchId):[];
 games.activeCards=hours.cards?games.cardTables:[];
 for(const g of games.activeKids){
  g.seconds+=Math.max(0,dt);
  const near=player&&dist(player,g.center)<4;
  if(near)g.pause=Math.max(g.pause,1.5);
  if(g.pause>0){g.pause=Math.max(0,g.pause-dt);continue;}
  if(g.seconds>=g.nextPass){g.seconds=0;g.from=g.to;g.to=(g.to+1+hash(Math.floor(games.seconds)+g.kids.length)%(g.kids.length-1))%g.kids.length;
   g.passDuration=1+hash(Math.floor(games.seconds)*7+g.to)%200/100;g.nextPass=g.passDuration;}
  const t=Math.min(1,g.seconds/g.passDuration),from=g.kids[g.from],to=g.kids[g.to];
  g.ball.x=from.x+(to.x-from.x)*t;g.ball.y=from.y+(to.y-from.y)*t;
  for(let i=0;i<g.kids.length;i++){
   const p=g.kids[i];p.prevX=p.x;p.prevY=p.y;
   const target=g.points[(i+(Math.floor(games.seconds/3)%2))%g.points.length];
   const d=dist(p,target),speed=Math.min(d,Math.max(0,dt)*2.3);
   const x=p.x+(target.x-p.x)/(d||1)*speed,y=p.y+(target.y-p.y)/(d||1)*speed;
   if(canStand(x,y)&&!onRoad(x,y)){p.x=x;p.y=y;}
   p.a=Math.atan2(g.ball.y-p.y,g.ball.x-p.x);p.moving=d>.1;
  }
 }
 for(const table of games.activeCards){table.seconds+=Math.max(0,dt);table.turn=Math.floor(table.seconds/4)%table.people.length;}
}

export function drawStreetGames(c,games,clock,bounds){
 if(!games)return;
 const [x0,y0,x1,y1]=bounds,visible=p=>p.x>=x0&&p.x<=x1&&p.y>=y0&&p.y<=y1;
 for(const table of games.activeCards){
  const p=table.center;if(!visible(p))continue;
  c.fillStyle='rgba(23,26,29,.35)';c.fillRect(p.x-1.9,p.y-.7,4.1,2.5);
  c.fillStyle='#362e29';c.fillRect(p.x-1.9,p.y-1.2,3.8,2.1);
  c.fillStyle='#a57549';c.fillRect(p.x-1.6,p.y-1,3.2,1.6);
  c.fillStyle='#bf8c56';c.fillRect(p.x-1.4,p.y-.9,2.8,1.25);
  c.fillStyle='#e8d9af';for(const [dx,dy] of [[-.9,-.35],[-.25,-.18],[.45,-.4]])c.fillRect(p.x+dx,p.y+dy,.3,.42);
  table.people.forEach((person,i)=>{
   drawIdlePose(c,person.x,person.y,person,clock);
   if(i===table.turn&&table.seconds%4<.35)drawIdleCardGesture(c,person.x,person.y,person);
  });
 }
 for(const g of games.activeKids){
  if(!visible(g.center))continue;
  for(const child of g.kids)drawSheetPedestrianSprite(c,child.x,child.y,child.a,child.kind,clock,child.moving,1.2,child.seed);
  const b=g.ball;c.fillStyle='rgba(22,24,24,.42)';c.fillRect(b.x-.35,b.y-.1,.7,.28);
  c.fillStyle='#25292a';c.fillRect(b.x-.31,b.y-.48,.62,.62);
  c.fillStyle='#f1ebd5';c.fillRect(b.x-.24,b.y-.44,.48,.45);
  c.fillStyle='#5d6261';c.fillRect(b.x-.08,b.y-.28,.16,.15);
 }
}
