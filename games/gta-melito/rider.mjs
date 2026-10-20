/* GTA Melito · Q39–Q41 · App «RIDER» (lavoro di FINZIONE).
 * Punti di ritiro: bar, caffè, pasticcerie, ristoranti e friggitorie con nome OSM già in strada
 * (storefronts.mjs) e i furgoncini del cibo di strada (Q17, ambulanti di fantasia).
 * Destinazioni: strade OSM reali con nome; clienti, ordini, compensi e recensioni sono INVENTATI.
 * Nessun collegamento a persone, attività o piattaforme di consegna reali.
 * Solo logica pura (testabile con node --test); disegno e pannello stanno in game.mjs. */
export const RIDER_COMPATIBLE=Object.freeze(['scooter-sh','scooter-retro','moto-naked']);
export const PICKUP_KINDS=Object.freeze(['bar','cafe','fast_food','pastry','restaurant','bakery']);
export const PICKUP_RADIUS=9,DELIVERY_RADIUS=12,CARGO_WALK_RADIUS=25;
export const OFFER_MIN_DISTANCE=140,OFFER_MAX_DISTANCE=750;
export const RIDER_LEVELS=Object.freeze([
 {id:'principiante',name:'Principiante',deliveries:0,rating:0,bonus:0,time:1},
 {id:'apprendista',name:'Apprendista',deliveries:5,rating:0,bonus:.05,time:.96},
 {id:'esperto',name:'Esperto',deliveries:15,rating:3.5,bonus:.10,time:.92},
 {id:'veterano',name:'Veterano',deliveries:30,rating:4,bonus:.15,time:.88},
 {id:'leggenda',name:'Leggenda di Melito',deliveries:60,rating:4.3,bonus:.20,time:.85}
]);
const CLIENTS=['Anna R.','Gennaro P.','Lucia M.','Ciro D.','Teresa F.','Salvatore B.','Rosa C.','Pasquale V.','Carmela S.','Enzo T.','Assunta L.','Peppe A.'];
export const REVIEWS=Object.freeze({
 5:['Velocissimo e tutto ancora caldo!','Puntuale e gentile, il migliore.','Arrivato prima del previsto, perfetto.'],
 4:['In orario, grazie mille.','Tutto ok, consegna regolare.','Puntuale, cibo un po’ tiepido.'],
 3:['Un po’ in ritardo ma tutto integro.','Qualche minuto di troppo, pazienza.'],
 2:['Ritardo evidente, cibo freddo.','Ho aspettato parecchio.'],
 1:['Arrivato freddissimo e tardissimo.','Consegna molto in ritardo, peccato.']
});
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function rng(seed){let s=(seed>>>0)||1;return ()=>{s=(s+0x6D2B79F5)>>>0;let t=s;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;};}
// Modello dal nome dello sprite («moto-scooter-sh-white» → «scooter-sh»).
export function riderModelOf(vehicle){
 const m=String(vehicle?.model||'').match(/^moto-(.+)-(white|red|black|blue)$/);
 return m?m[1]:null;
}
export function riderVehicleCheck(vehicle){
 if(!vehicle)return {ok:false,reason:'a-piedi',message:'Per lavorare come rider sali su uno scooter.'};
 if(vehicle.vehicleType!=='motorcycle')return {ok:false,reason:'auto',message:'In auto non si fanno consegne: serve uno scooter o una moto con bauletto.'};
 if(!RIDER_COMPATIBLE.includes(riderModelOf(vehicle)))return {ok:false,reason:'moto-incompatibile',message:'Questa moto sportiva non ha spazio per il pacco: usa uno scooter.'};
 return {ok:true,reason:'ok',message:'Mezzo adatto alle consegne.'};
}
export function riderPickups(shops=[],vendorShops=[]){
 const out=[];
 for(const s of shops||[])if(PICKUP_KINDS.includes(s.kind)&&s.name&&Number.isFinite(s.x))
  out.push({id:'poi-'+s.id,name:s.name,kind:s.kind,x:s.x,y:s.y,truck:false});
 (vendorShops||[]).forEach((s,i)=>{if(Number.isFinite(s.x))out.push({id:'truck-'+i,name:s.name,kind:s.kind,x:s.x,y:s.y,truck:true});});
 return out;
}
const DRIVE_TYPES=['primary','secondary','tertiary','residential','unclassified','living_street','service','primary_link','secondary_link','tertiary_link'];
export function riderDestinations(roads=[]){
 const out=[];
 for(const r of roads||[]){
  if(!r.n||!DRIVE_TYPES.includes(r.t)||!(r.p?.length>=4))continue;
  const i=Math.floor(r.p.length/4)*2;
  out.push({id:'road-'+r.id+'-'+i,address:r.n,x:r.p[i],y:r.p[i+1]});
 }
 return out;
}
export function freshRiderSave(){return {serial:0,lastId:0,delivered:0,onTime:0,late:0,cancelled:0,earned:0,bonus:0,starsTotal:0,history:[]};}
export function sanitizeRiderSave(raw){
 const out=freshRiderSave();
 if(!raw||typeof raw!=='object')return out;
 const int=(v,max=1e6)=>Number.isFinite(Number(v))?clamp(Math.floor(Number(v)),0,max):0;
 for(const k of ['serial','lastId','delivered','onTime','late','cancelled','earned','bonus','starsTotal'])out[k]=int(raw[k]);
 const seen=new Set();
 for(const h of Array.isArray(raw.history)?raw.history:[]){
  const id=int(h?.id);if(!id||seen.has(id))continue;seen.add(id);
  out.history.push({id,from:String(h.from||'').slice(0,60),to:String(h.to||'').slice(0,60),stars:clamp(int(h.stars,5),1,5),
   pay:int(h.pay),bonus:int(h.bonus),onTime:!!h.onTime,seconds:int(h.seconds,9999),fresh:int(h.fresh,100),
   client:String(h.client||'').slice(0,30),review:String(h.review||'').slice(0,90)});
  if(out.history.length>=25)break;
 }
 const maxId=out.history.reduce((m,h)=>Math.max(m,h.id),0);
 out.lastId=Math.max(out.lastId,maxId);out.serial=Math.max(out.serial,out.lastId);
 out.onTime=Math.min(out.onTime,out.delivered);out.late=Math.min(out.late,out.delivered-out.onTime);
 out.starsTotal=Math.min(out.starsTotal,out.delivered*5);
 return out;
}
export function riderLevel(save){
 const s=save||freshRiderSave(),avg=s.delivered?s.starsTotal/s.delivered:0;
 let index=0;
 RIDER_LEVELS.forEach((l,i)=>{if(s.delivered>=l.deliveries&&(!l.rating||avg>=l.rating))index=i;});
 return {...RIDER_LEVELS[index],index,next:RIDER_LEVELS[index+1]||null};
}
export function riderStats(save){
 const s=save||freshRiderSave();
 return {deliveries:s.delivered,onTimePct:s.delivered?Math.round(100*s.onTime/s.delivered):0,
  avgStars:s.delivered?Math.round(10*s.starsTotal/s.delivered)/10:0,earned:s.earned,bonus:s.bonus,
  cancelled:s.cancelled,level:riderLevel(s)};
}
/* Offerte deterministiche (stesso seed = stesse offerte): ritiro fra i 8 più vicini al giocatore,
 * destinazione a 140–750 m in linea d'aria dal ritiro. Tempo limite e paga da regole esplicite. */
export function riderOffers({pickups=[],destinations=[],player={x:0,y:0},seed=1,count=3,save=null}={}){
 if(!pickups.length||!destinations.length)return [];
 const r=rng(seed),level=riderLevel(save);
 const near=[...pickups].sort((a,b)=>dist(a,player)-dist(b,player)||(a.id<b.id?-1:1)).slice(0,8);
 const offers=[],used=new Set();
 for(let tries=0;offers.length<count&&tries<count*12;tries++){
  const pickup=near[Math.floor(r()*near.length)];
  const options=destinations.filter(d=>{const k=dist(d,pickup);return k>=OFFER_MIN_DISTANCE&&k<=OFFER_MAX_DISTANCE;});
  if(!options.length)continue;
  const dest=options[Math.floor(r()*options.length)],key=pickup.id+'>'+dest.address;
  if(used.has(key))continue;used.add(key);
  const meters=Math.round(dist(pickup,dest));
  offers.push({key,pickup:{...pickup},dest:{...dest},meters,
   pay:offerPay(meters),limit:offerTimeLimit(meters,level.time),client:CLIENTS[Math.floor(r()*CLIENTS.length)]});
 }
 return offers;
}
export const offerPay=meters=>Math.round(3+meters/100*1.2);
// Tempo: percorso stimato 1,4× la linea d'aria a 7 m/s (25 km/h) + 25 s di margine, ridotto dal livello.
export const offerTimeLimit=(meters,factor=1)=>Math.round((meters*1.4/7+25)*factor);
export function acceptOffer(save,current,offer,vehicle){
 if(current)return {ok:false,reason:'gia-attiva',message:'Hai già una consegna attiva: completala o annullala.'};
 if(!offer)return {ok:false,reason:'nessuna',message:'Offerta non disponibile.'};
 const check=riderVehicleCheck(vehicle);
 if(!check.ok)return {ok:false,reason:check.reason,message:check.message};
 save.serial=Math.max(save.serial,save.lastId)+1;
 const job={id:save.serial,...offer,phase:'pickup',elapsed:0,fresh:100,cargo:null};
 return {ok:true,job,message:'Ordine accettato: vai a ritirarlo da '+offer.pickup.name+'.'};
}
export function cancelJob(save,job){
 if(!job)return {ok:false};
 save.cancelled=Math.min(1e6,save.cancelled+1);
 return {ok:true,message:'Consegna annullata. Il pacco torna al locale, nessuna penale.'};
}
// Freschezza: in tempo scende 100→70; dopo il limite scende 70→0 in un altro «limite».
export function freshnessAt(elapsed,limit){
 if(elapsed<=limit)return Math.round(100-30*elapsed/limit);
 return Math.max(0,Math.round(70-70*(elapsed-limit)/limit));
}
/* ctx: {x,y,vehicle,vehicleId,cargoPos,dt}. Il timer avanza solo qui (il gioco non chiama
 * la funzione quando è in pausa). Il pacco resta legato al mezzo su cui è stato caricato. */
export function stepJob(job,ctx){
 if(!job)return null;
 const here={x:ctx.x,y:ctx.y};
 if(job.phase==='pickup'){
  if(dist(here,job.pickup)>PICKUP_RADIUS)return null;
  if(!riderVehicleCheck(ctx.vehicle).ok)return {type:'need-scooter',message:'Torna in sella allo scooter per caricare il pacco.'};
  job.phase='deliver';job.cargo=ctx.vehicleId;job.elapsed=0;job.fresh=100;
  return {type:'picked',message:'Pacco caricato! Consegna in '+job.dest.address+' entro '+job.limit+' s.'};
 }
 job.elapsed+=Math.max(0,ctx.dt||0);job.fresh=freshnessAt(job.elapsed,job.limit);
 if(dist(here,job.dest)>DELIVERY_RADIUS)return null;
 const onCargo=ctx.vehicle&&ctx.vehicleId===job.cargo;
 const walking=!ctx.vehicle&&ctx.cargoPos&&dist(ctx.cargoPos,here)<=CARGO_WALK_RADIUS;
 if(!onCargo&&!walking)return {type:'need-cargo',message:'Il pacco è sullo scooter con cui l’hai ritirato: riprendilo.'};
 return {type:'arrived'};
}
export function deliveryResult(job,level=RIDER_LEVELS[0]){
 const onTime=job.elapsed<=job.limit,late=Math.max(0,job.elapsed-job.limit);
 const fresh=freshnessAt(job.elapsed,job.limit);
 const factor=onTime?1:Math.max(.3,1-.7*late/job.limit);
 const pay=Math.round(job.pay*factor);
 const tip=onTime&&fresh>=85?1:0,bonus=Math.round(pay*(level.bonus||0))+tip;
 const ratio=late/job.limit;
 const stars=onTime?(fresh>=85?5:4):ratio<.25?3:ratio<.6?2:1;
 const list=REVIEWS[stars],review=list[job.id%list.length];
 return {onTime,fresh,pay,bonus,tip,total:pay+bonus,stars,review,seconds:Math.round(job.elapsed)};
}
// Registra una consegna una sola volta (id crescenti: un reload non la duplica).
export function completeDelivery(progress,job){
 progress.rider=sanitizeRiderSave(progress.rider);
 const s=progress.rider;
 if(!job||job.phase!=='deliver'||job.id<=s.lastId||s.history.some(h=>h.id===job.id))return {ok:false,duplicate:true};
 const level=riderLevel(s),res=deliveryResult(job,level);
 s.lastId=job.id;s.delivered++;res.onTime?s.onTime++:s.late++;
 s.earned+=res.total;s.bonus+=res.bonus;s.starsTotal+=res.stars;
 s.history.unshift({id:job.id,from:job.pickup.name,to:job.dest.address,stars:res.stars,pay:res.pay,bonus:res.bonus,
  onTime:res.onTime,seconds:res.seconds,fresh:res.fresh,client:job.client||'Cliente',review:res.review});
 s.history.length=Math.min(s.history.length,25);
 progress.money=Math.min(999999,(progress.money||0)+res.total);
 const after=riderLevel(s);
 return {ok:true,...res,levelUp:after.index>level.index?after:null};
}
/* Percorso sul grafo stradale (Dijkstra sui nodi, solo archi carrabili). Ritorna i punti. */
export function nearestGraphNode(graph,p){
 let best=-1,bd=Infinity;
 const reach=graph.riderCarNodes||(graph.riderCarNodes=new Set(graph.edges.flatMap(e=>e.car?[e.from,e.to]:[])));
 graph.nodes.forEach((n,i)=>{if(!reach.has(i))return;const d=(n.x-p.x)**2+(n.y-p.y)**2;if(d<bd){bd=d;best=i;}});
 return best;
}
export function riderRoute(graph,from,to){
 if(!graph?.nodes?.length)return null;
 const s=nearestGraphNode(graph,from),g=nearestGraphNode(graph,to);
 if(s<0||g<0)return null;
 const d=new Float64Array(graph.nodes.length).fill(Infinity),prev=new Int32Array(graph.nodes.length).fill(-1);
 const heap=[[0,s]];d[s]=0;
 const push=x=>{heap.push(x);let i=heap.length-1;while(i){const p=(i-1)>>1;if(heap[p][0]<=heap[i][0])break;[heap[p],heap[i]]=[heap[i],heap[p]];i=p;}};
 const pop=()=>{const top=heap[0],last=heap.pop();if(heap.length){heap[0]=last;let i=0;for(;;){const l=2*i+1,r=l+1;let m=i;if(l<heap.length&&heap[l][0]<heap[m][0])m=l;if(r<heap.length&&heap[r][0]<heap[m][0])m=r;if(m===i)break;[heap[m],heap[i]]=[heap[i],heap[m]];i=m;}}return top;};
 while(heap.length){
  const [dd,n]=pop();if(n===g)break;if(dd>d[n])continue;
  for(const id of graph.nodes[n].out){const e=graph.edges[id];if(!e.car)continue;const nd=dd+e.len;if(nd<d[e.to]){d[e.to]=nd;prev[e.to]=n;push([nd,e.to]);}}
 }
 if(!Number.isFinite(d[g]))return null;
 const points=[];for(let n=g;n>=0;n=prev[n]){points.unshift({x:graph.nodes[n].x,y:graph.nodes[n].y});if(n===s)break;}
 points.push({x:to.x,y:to.y});
 return {points,length:Math.round(d[g]+dist(graph.nodes[g],to))};
}
// Punto del percorso circa `ahead` metri davanti al giocatore (per la freccia HUD).
export function routeLookahead(points,p,ahead=18){
 if(!points?.length)return null;
 let bi=0,bd=Infinity;
 points.forEach((q,i)=>{const d=dist(q,p);if(d<bd){bd=d;bi=i;}});
 let i=bi;while(i<points.length-1&&dist(points[i],p)<ahead)i++;
 return {target:points[i],index:i,offRoute:bd};
}
