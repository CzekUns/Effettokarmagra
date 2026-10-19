/* Q05: eventi cittadini emergenti — l'oggetto perduto.
 * Un residente in cammino (Q01–Q03) lascia cadere un oggetto e prosegue; dopo qualche
 * secondo se ne accorge, torna indietro sul suo marciapiede e lo raccoglie. Se il
 * giocatore lo raccoglie prima può restituirlo (mancia di 5 €). Un solo evento alla
 * volta, pausa di 5 minuti reali tra un evento e l'altro, fumetti brevi: niente spam.
 * Tutto deterministico dal seme: stessa sequenza di ingressi, stesso evento.
 * Persone e oggetti sono di fantasia. */
export const LOST_ITEMS=Object.freeze([
 {id:'chiavi',label:'le chiavi di casa',cry:'Le chiavi?!',found:'Eccole!',thanks:'Le chiavi! Grazie assai!'},
 {id:'portafoglio',label:'il portafoglio',cry:'Il portafoglio?!',found:'Eccolo!',thanks:'Il portafoglio! Grazie assai!'},
 {id:'busta',label:'la busta della spesa',cry:'La spesa?!',found:'Eccola!',thanks:'La spesa! Grazie assai!'},
 {id:'cellulare',label:'il cellulare',cry:'Il cellulare?!',found:'Eccolo!',thanks:'Il cellulare! Grazie assai!'}
]);
export const EVENT_RULES=Object.freeze({
 firstDelay:45,cooldown:300,checkEvery:2,chance:.35,triggerRange:38,
 noticeMin:10,noticeMax:16,searchPatience:30,pickupRange:2.2,returnRange:3.5,
 bubbleSeconds:3.5,reward:5,maxSeconds:240
});
const hash=n=>{let x=(n|0)^0x2c1b3c6d;x=Math.imul(x^x>>>16,2246822519);x=Math.imul(x^x>>>13,3266489917);return (x^x>>>16)>>>0;};
const rand=n=>hash(n)/4294967295;
export function createCityEvents(seed=505){
 return {seed,clock:0,nextCheck:EVENT_RULES.firstDelay,checks:0,count:0,active:null,bubbles:[],log:[]};
}
// Chi può perdere qualcosa: residente in cammino sul marciapiede, senza deviazioni in corso e con
// abbastanza strada davanti da accorgersene prima di arrivare alla sua porta.
export const MIN_ROAD_AHEAD=22;
export function canLoseSomething(agent,graph=null){
 const plan=agent?.residentRoutine;
 if(!plan||agent.indoors||plan.doorStep||plan.detour||agent.needsRoutineRecovery||agent.impactTime>0)return false;
 if(plan.phase!=='OUTBOUND'&&plan.phase!=='RETURNING')return false;
 if(Math.abs(plan.lateral||0)>=.001||Math.abs(plan.lateralGoal||0)>=.001)return false;
 const e=graph?.edges?.[plan.edge];
 return !e||Math.abs((plan.phase==='OUTBOUND'?plan.targetT:plan.homeT)-agent.t)*e.len>=MIN_ROAD_AHEAD;
}
export function cityEventBubble(events,agent,text){
 events.bubbles=events.bubbles.filter(b=>b.agent!==agent);
 events.bubbles.push({agent,text,time:EVENT_RULES.bubbleSeconds});
}
function close(events,outcome){
 const ev=events.active;if(!ev)return;
 if(ev.owner.residentRoutine.detour===ev.detour)ev.owner.residentRoutine.detour=null;
 events.log.push({item:ev.item.id,outcome,seconds:+ev.age.toFixed(1)});
 events.active=null;events.nextCheck=events.clock+EVENT_RULES.cooldown;
}
/* ctx: {people, graph, player:{x,y,onFoot}, view:[x0,y0,x1,y1], allowed} */
export function stepCityEvents(events,dt,ctx){
 const elapsed=Math.max(0,Math.min(Number(dt)||0,.25));
 events.clock+=elapsed;
 for(const b of events.bubbles)b.time-=elapsed;
 events.bubbles=events.bubbles.filter(b=>b.time>0&&!b.agent.indoors);
 const ev=events.active;
 if(ev)return advance(events,ev,elapsed,ctx);
 if(events.clock<events.nextCheck||!ctx.allowed||!ctx.player?.onFoot)return null;
 events.nextCheck=events.clock+EVENT_RULES.checkEvery;events.checks++;
 if(rand(events.seed+events.checks*7919)>=EVENT_RULES.chance)return null;
 const [x0,y0,x1,y1]=ctx.view||[-Infinity,-Infinity,Infinity,Infinity],p=ctx.player;
 const candidates=(ctx.people||[]).filter(a=>canLoseSomething(a,ctx.graph)&&a.x>=x0&&a.x<=x1&&a.y>=y0&&a.y<=y1&&
  Math.hypot(a.x-p.x,a.y-p.y)<=EVENT_RULES.triggerRange).sort((a,b)=>a.seed-b.seed);
 if(!candidates.length)return null;
 const owner=candidates[hash(events.seed+events.checks*31)%candidates.length];
 const item=LOST_ITEMS[hash(events.seed+events.count*13+owner.seed)%LOST_ITEMS.length];
 const plan=owner.residentRoutine;
 events.count++;
 events.active={id:events.count,item,owner,state:'DROPPED',age:0,
  spot:{x:owner.x,y:owner.y,t:owner.t,edge:plan.edge},carried:false,
  noticeAt:EVENT_RULES.noticeMin+rand(events.seed+events.count*101)*(EVENT_RULES.noticeMax-EVENT_RULES.noticeMin),
  phase:plan.phase,detour:null,searched:0};
 return {type:'dropped',item:item.id};
}
function advance(events,ev,elapsed,ctx){
 const owner=ev.owner,plan=owner.residentRoutine;
 ev.age+=elapsed;
 // Il proprietario rientra in casa o la routine cambia sotto i piedi: l'evento si chiude da solo.
 if(owner.indoors||plan.edge!==ev.spot.edge||ev.age>EVENT_RULES.maxSeconds){close(events,ev.carried?'tenuto':'scaduto');return {type:'closed'};}
 if(ev.state==='DROPPED'&&ev.age>=ev.noticeAt&&!owner.needsRoutineRecovery&&!(owner.impactTime>0)&&!plan.doorStep){
  ev.state='SEARCHING';ev.detour={t:ev.spot.t,hold:false,arrived:false};plan.detour=ev.detour;cityEventBubble(events,owner,ev.item.cry);
  return {type:'noticed'};
 }
 if(ev.state==='SEARCHING'&&ev.detour.arrived){
  if(!ev.carried){cityEventBubble(events,owner,ev.item.found);close(events,'ritrovato');return {type:'recovered'};}
  ev.detour.hold=true;ev.searched+=elapsed;
  if(ev.searched>=EVENT_RULES.searchPatience){
   // Smette di cercare e riprende la sua strada; si può ancora rincorrerlo per restituirlo.
   cityEventBubble(events,owner,'Pazienza…');plan.detour=null;ev.state='GAVE_UP';return {type:'gave-up'};
  }
 }
 return null;
}
// Azione contestuale del giocatore a piedi: raccogliere o restituire.
export function cityEventAction(events,player){
 const ev=events?.active;
 if(!ev||!player)return null;
 if(!ev.carried&&ev.state!=='CLOSED'&&Math.hypot(player.x-ev.spot.x,player.y-ev.spot.y)<=EVENT_RULES.pickupRange)return 'RACCOGLI';
 if(ev.carried&&!ev.owner.indoors&&Math.hypot(player.x-ev.owner.x,player.y-ev.owner.y)<=EVENT_RULES.returnRange)return 'RESTITUISCI';
 return null;
}
export function interactCityEvent(events,player){
 const action=cityEventAction(events,player),ev=events?.active;
 if(action==='RACCOGLI'){ev.carried=true;return {type:'picked',text:'Hai raccolto '+ev.item.label+'.'};}
 if(action==='RESTITUISCI'){
  cityEventBubble(events,ev.owner,ev.item.thanks);close(events,'restituito');
  return {type:'returned',reward:EVENT_RULES.reward,text:'Hai restituito '+ev.item.label+': mancia di '+EVENT_RULES.reward+' €.'};
 }
 return null;
}
const ICON={
 chiavi:(c)=>{c.fillStyle='#d9b54a';c.fillRect(-.55,-.2,.5,.4);c.fillRect(-.1,-.08,.75,.16);c.fillRect(.45,.05,.12,.22);c.fillStyle='#8a6d1c';c.fillRect(-.42,-.08,.24,.16);},
 portafoglio:(c)=>{c.fillStyle='#5b3423';c.fillRect(-.55,-.38,1.1,.76);c.fillStyle='#8c5a3c';c.fillRect(-.55,-.38,1.1,.2);},
 busta:(c)=>{c.fillStyle='#f1eee2';c.fillRect(-.6,-.5,1.2,1);c.fillStyle='#3e8a4f';c.fillRect(-.3,-.62,.6,.16);c.fillStyle='#d8462f';c.fillRect(-.18,-.15,.36,.36);},
 cellulare:(c)=>{c.fillStyle='#1a1d22';c.fillRect(-.3,-.55,.6,1.1);c.fillStyle='#5aa6d6';c.fillRect(-.22,-.45,.44,.8);}
};
// Oggetto a terra: icona e un leggero cerchio pulsante quando il giocatore è vicino.
export function drawLostItem(c,events,player,clock){
 const ev=events?.active;
 if(!ev||ev.carried)return;
 const {x,y}=ev.spot,near=player&&Math.hypot(player.x-x,player.y-y)<14;
 c.save();c.translate(x,y);
 if(near){c.globalAlpha=.35+.25*Math.sin(clock*5);c.strokeStyle='#ffe27a';c.lineWidth=.22;c.beginPath();c.arc(0,0,1.4,0,Math.PI*2);c.stroke();c.globalAlpha=1;}
 c.fillStyle='#1b232233';c.fillRect(-.6,.35,1.3,.3);
 ICON[ev.item.id](c);
 c.restore();
}
// Fumetti sopra la testa e oggetto in mano al giocatore: interfaccia, sopra il buio della notte.
export function drawCityEventOverlay(c,events,player,zoom){
 if(!events)return;
 c.save();c.font='bold 2.2px monospace';c.textAlign='center';c.textBaseline='middle';
 for(const b of events.bubbles){
  const w=Math.max(6,b.text.length*1.36+1.6),x=b.agent.x,y=b.agent.y-5.2;
  c.globalAlpha=Math.min(1,b.time*2);
  c.fillStyle='#fff8e6';c.fillRect(x-w/2,y-1.6,w,3.2);c.beginPath();c.moveTo(x-.6,y+1.6);c.lineTo(x+.6,y+1.6);c.lineTo(x,y+2.6);c.fill();
  c.strokeStyle='#1d2a26';c.lineWidth=.22;c.strokeRect(x-w/2,y-1.6,w,3.2);
  c.fillStyle='#1d2a26';c.fillText(b.text,x,y+.1);
 }
 c.globalAlpha=1;
 const ev=events.active;
 if(ev?.carried&&player&&zoom>=1.2){c.translate(player.x+1.3,player.y-2.4);c.scale(1.2,1.2);ICON[ev.item.id](c);}
 c.restore();
}
