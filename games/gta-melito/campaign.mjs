/* GTA Melito 0.3 · fictional campaign grounded in REAL OSM landmarks.
 * Locations come from the OSM map snapshot, names are not fabricated.
 * All characters, dialogues and jobs are fictional and unaffiliated with real businesses. */
import {freshShopSave,sanitizeShopSave} from './local-shops.mjs?v=003';
import {freshRiderSave,sanitizeRiderSave} from './rider.mjs?v=001';
export const SAVE_KEY='gta-melito-campaign-v3';
export const STORY=[
 {id:'primo-contatto',title:'01 · Il primo contatto',reward:75,time:0,
  intro:'Nico ha lasciato un messaggio su Via Roma. Vuole parlarti di una piccola commissione.',
  steps:[
   {at:'via-roma',verb:'PARLA',mode:'foot',speaker:'NICO',text:'Oh, finalmente! Raggiungimi a Piazza Santo Stefano. Ho bisogno di qualcuno che conosca le strade.'},
   {at:'piazza-stefano',verb:'INCONTRA',mode:'foot',speaker:'NICO',text:'Bravo! A Melito ogni vicolo racconta qualcosa. Questa è per il disturbo.'}
  ]},
 {id:'giro-in-centro',title:'02 · Il giro del centro',reward:150,time:190,
  intro:'Un pacco immaginario da recuperare e consegnare senza perdere tempo.',
  steps:[
   {at:'piazza-stefano',verb:'RITIRA',mode:'foot',speaker:'NICO',text:'Tieni questa busta. Prima passa dal Municipio, poi raggiungi Piazza Immacolata.'},
   {at:'municipio',verb:'PASSA',mode:'either',speaker:'RADIO',text:'Sei arrivato nella zona del Municipio. Ultima fermata: Piazza Immacolata.'},
   {at:'piazza-immacolata',verb:'CONSEGNA',mode:'foot',speaker:'CONTATTO',text:'Ricevuto. Ecco la tua ricompensa. Non male come primo giro.'}
  ]},
 {id:'posta-celere',title:'03 · La staffetta',reward:220,time:250,
  intro:'Una staffetta di messaggi fittizi tra le zone commerciali della città.',
  steps:[
   {at:'piazza-immacolata',verb:'RITIRA',mode:'foot',speaker:'CONTATTO',text:'La staffetta parte da qui. Prima fermata: Ufficio Postale Melito 1.'},
   {at:'poste-1',verb:'REGISTRA',mode:'either',speaker:'RADIO',text:'Punto raggiunto. Ora attraversa il quartiere fino a Corso Europa.'},
   {at:'corso-europa',verb:'INCONTRA',mode:'foot',speaker:'NICO',text:'Ci sei quasi. Chiudi il giro verso il secondo ufficio postale.'},
   {at:'poste-2',verb:'CONSEGNA',mode:'foot',speaker:'CONTATTO',text:'Staffetta completata. Melito è più grande di quanto sembri.'}
  ]},
 {id:'tour-di-melito',title:'04 · La firma della città',reward:350,time:350,
  intro:'Il gran finale: attraversa i luoghi simbolici e torna al punto di partenza.',
  steps:[
   {at:'poste-2',verb:'PARTI',mode:'foot',speaker:'NICO',text:'Giro finale. Largo Cinque Via, Piazza Santo Stefano e poi Via Roma.'},
   {at:'largo-cinque-via',verb:'TIMBRA',mode:'either',speaker:'RADIO',text:'Largo Cinque Via segnato. Prossima tappa: Piazza Santo Stefano.'},
   {at:'piazza-stefano',verb:'TIMBRA',mode:'either',speaker:'RADIO',text:'Ora torna su Via Roma. Mancano poche centinaia di metri.'},
   {at:'via-roma',verb:'FINISCI',mode:'foot',speaker:'NICO',text:'MISSIONE COMPIUTA! Questa città è tutta da giocare.'}
  ]}
];
export const LANDMARKS=[
 {id:'via-roma',source:'road',name:'Via Roma',kind:'meeting',match:'Via Roma'},
 {id:'piazza-stefano',source:'road',name:'Piazza Santo Stefano',kind:'square',match:'Piazza Santo Stefano'},
 {id:'piazza-immacolata',source:'road',name:'Piazza Immacolata',kind:'square',match:'Piazza Immacolata'},
 {id:'municipio',source:'poi',name:'Municipio di Melito di Napoli',kind:'townhall',match:'Municipio di Melito di Napoli'},
 {id:'poste-1',source:'poi',name:'Ufficio Postale Melito 1',kind:'post',match:'Ufficio Postale Melito 1'},
 {id:'corso-europa',source:'road',name:'Corso Europa',kind:'avenue',match:'Corso Europa'},
 {id:'poste-2',source:'poi',name:'Ufficio Postale Melito 2',kind:'post',match:'Ufficio Postale Melito 2'},
 {id:'largo-cinque-via',source:'road',name:'Largo Cinque Via',kind:'square',match:'Largo Cinque Via'}
];
export const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function bestPoint(road,point){
 let best=null;
 for(let i=2;i<road.p.length;i+=2){
  const ax=road.p[i-2],ay=road.p[i-1],bx=road.p[i],by=road.p[i+1];
  const dx=bx-ax,dy=by-ay,len=dx*dx+dy*dy;
  const t=len?Math.max(0,Math.min(1,((point.x-ax)*dx+(point.y-ay)*dy)/len)):0;
  const x=ax+t*dx,y=ay+t*dy,dd=(x-point.x)**2+(y-point.y)**2;
  if(!best||dd<best.dd)best={x,y,dd,roadName:road.n,roadId:road.id,width:road.w};
 }
 return best;
}
const canWalk=road=>!['motorway','trunk','steps','path','track'].includes(road.t)&&road.p?.length>=4;
function closestStreet(roads,p){
 let best=null;
 for(const road of roads){
  if(!canWalk(road))continue;
  const candidate=bestPoint(road,p);
  if(candidate&&(!best||candidate.dd<best.dd))best=candidate;
 }
 return best;
}
export function resolveLandmarks(map,spawn){
 const result=new Map();
 for(const def of LANDMARKS){
  let anchor=null,location=null;
  if(def.source==='poi'){
   const poi=(map.pois||[]).find(p=>p.n===def.match);
   if(poi)anchor={x:poi.p[0],y:poi.p[1]};
  }else{
   const roads=map.roads.filter(r=>r.n===def.match&&canWalk(r));
   if(roads.length){
    const preferred=def.id==='via-roma'&&spawn?spawn:
      def.id==='corso-europa'?{x:map.projection.width*.58,y:map.projection.height*.68}:
      {x:map.projection.width/2,y:map.projection.height/2};
    let closest=null;
    for(const road of roads){
     const pt=bestPoint(road,preferred);
     if(!closest||pt.dd<closest.dd)closest=pt;
    }
    if(closest)anchor={x:closest.x,y:closest.y};
   }
  }
  if(!anchor)throw Error('Punto geografico OSM mancante: '+def.match);
  const roadside=closestStreet(map.roads,anchor);
  if(!roadside)throw Error('Nessuna strada accessibile presso '+def.name);
  location={...def,x:roadside.x,y:roadside.y,anchorX:anchor.x,anchorY:anchor.y,roadName:roadside.roadName,fromPlace:Math.round(Math.sqrt(roadside.dd))};
  result.set(def.id,location);
 }
 return result;
}
// Q06: `shop` keeps purchases next to the money they were paid with (same save, same reset).
export function freshProgress(){return {version:3,mission:0,stage:0,money:0,respect:0,remaining:null,completed:false,stamp:0,shop:freshShopSave(),rider:freshRiderSave()};}
export function readProgress(storage){
 let p;try{p=JSON.parse(storage.getItem(SAVE_KEY)||'null');}catch(_){}
 if(!p||p.version!==3)return freshProgress();
 const m=Number(p.mission),s=Number(p.stage);
 if(!Number.isInteger(m)||m<0||m>STORY.length||!Number.isInteger(s)||s<0||s>5)return freshProgress();
 if(m<STORY.length&&s>=STORY[m].steps.length)return freshProgress();
 return {version:3,mission:m,stage:m===STORY.length?0:s,money:Math.max(0,Math.min(999999,Number(p.money)||0)),respect:Math.max(0,Math.min(1000,Number(p.respect)||0)),remaining:Number.isFinite(p.remaining)&&p.remaining>=0?Math.min(500,p.remaining):null,completed:m===STORY.length,stamp:0,shop:sanitizeShopSave(p.shop),rider:sanitizeRiderSave(p.rider)};
}
export function saveProgress(storage,p){
 try{storage.setItem(SAVE_KEY,JSON.stringify({...p,stamp:0}));return true;}catch(e){return false;}
}
export function currentStep(progress){
 if(progress.mission>=STORY.length)return null;
 const mission=STORY[progress.mission];
 return {mission,step:mission.steps[progress.stage]};
}
export function activeTarget(progress,landmarks){
 const step=currentStep(progress)?.step;
 return step?landmarks.get(step.at):null;
}
export function stepRadius(step){return step?.mode==='foot'?16:20;}
export function isNear(progress,landmarks,x,y,inCar){
 const step=currentStep(progress)?.step,target=activeTarget(progress,landmarks);
 if(!step||!target)return {near:false,reason:'finished',distance:Infinity};
 const d=distance({x,y},target);
 if(d>stepRadius(step))return {near:false,reason:'distance',distance:d};
 if(step.mode==='foot'&&inCar)return {near:false,reason:'exit-car',distance:d};
 return {near:true,reason:'ok',distance:d};
}
export function updateTimer(progress,dt){
 const step=currentStep(progress);
 if(!step||!step.mission.time)return null;
 if(progress.remaining===null)progress.remaining=step.mission.time;
 progress.remaining=Math.max(0,progress.remaining-Math.max(0,dt));
 if(progress.remaining>0)return null;
 progress.stage=0;progress.remaining=step.mission.time;
 return {type:'timeout',message:'TEMPO SCADUTO. Riprova la missione: i progressi precedenti sono salvi.'};
}
export function doInteraction(progress,landmarks,x,y,inCar){
 const active=currentStep(progress);
 if(!active)return {type:'finished',message:'La storia è completa. Esplora liberamente Melito!'};
 const check=isNear(progress,landmarks,x,y,inCar);
 if(!check.near){
  return {type:'blocked',message:check.reason==='exit-car'?'Scendi dall’auto per interagire.':`Avvicinati all’obiettivo: ${Math.ceil(check.distance)} m`};
 }
 const {mission,step}=active;
 const text=step.text,speaker=step.speaker;
 progress.stage++;
 if(progress.stage>=mission.steps.length){
  progress.money+=mission.reward;progress.respect+=10;progress.mission++;progress.stage=0;progress.remaining=null;
  if(progress.mission>=STORY.length)progress.completed=true;
  return {type:progress.completed?'ending':'mission-complete',speaker,text,title:mission.title,reward:mission.reward,message:progress.completed?'STORIA COMPLETATA — MELITO È TUA!':`MISSIONE SUPERATA! +€${mission.reward} · +10 RISPETTO`};
 }
 return {type:'step-complete',speaker,text,title:mission.title,message:text};
}
export function resetCurrentMission(progress){
 if(progress.completed)return false;
 progress.stage=0;progress.remaining=null;return true;
}
