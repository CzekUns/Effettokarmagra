/* Q11: socialità degli NPC — incontri tra conoscenti e piccoli gruppi.
 * Due pedoni che si conoscono e si incrociano sul marciapiede si fermano uno di fronte
 * all'altro, chiacchierano 8–20 s (a volte si aggiunge un terzo), poi si salutano e
 * ognuno riprende la sua strada o la sua routine. Un'auto veloce vicina o un clacson
 * rompono subito il gruppo. Fumetti pochi e legati al contesto (pioggia, sera).
 * Conoscenze e frasi sono di fantasia. I pedoni non si bloccano tra loro: il gruppo resta
 * sul marciapiede e il traffico non lo considera un ostacolo in carreggiata. */
export const SOCIAL_RULES=Object.freeze({checkEvery:.25,meetRange:3.2,chance:.35,chatMin:8,chatMax:20,cooldown:90,
 maxGroup:3,joinChance:.5,dangerRange:7,dangerSpeed:6,hornRange:20,bubbleCooldown:6,maxBubbles:2,bubbleSeconds:3.5,junctionClear:6});
const GREETINGS=['Ué, come stai?','Tutto a posto?','Ci prendiamo un caffè?','Hai visto la partita?','Salutami a mammà!','Che si dice?'];
const hash=n=>{let x=(n|0)^0x1b873593;x=Math.imul(x^x>>>16,2246822519);x=Math.imul(x^x>>>13,3266489917);return (x^x>>>16)>>>0;};
const rand=n=>hash(n)/4294967295;
export function createSocial(seed=909){return {seed,clock:0,next:0,checks:0,groups:[],bubbles:[],log:[]};}
// Conoscenza simmetrica e stabile: circa 1 coppia su 3 tra i passanti, molte di più tra i residenti.
export function knows(a,b){
 if(!a||!b||a===b)return false;
 const lo=Math.min(a.seed|0,b.seed|0),hi=Math.max(a.seed|0,b.seed|0);
 return hash(lo*31+hi*17)%100<(a.residentRoutine&&b.residentRoutine?60:32);
}
export function canSocialize(agent,graph,clock){
 if(!agent||agent.body!=='walk'||agent.indoors||agent.commuter||agent.impactTime>0||agent.needsRoutineRecovery||agent.corner)return false;
 // Q13: nobody stops to chat while dodging a vehicle, crossing or waiting at the kerb.
 if(agent.dodge>0||agent.crossing||agent.lookAt||agent.kerbWait||agent.frozen||agent.serviceHold)return false;
 // Fermo da tempo in fondo a un marciapiede senza uscita: aspetta di essere ricollocato fuori vista.
 if(agent.stalled>4&&!(agent.wait>0))return false;
 if(agent.social&&(agent.social.hold||clock<agent.social.until))return false;
 const plan=agent.residentRoutine;
 if(plan&&(plan.doorStep||plan.detour||(plan.phase!=='OUTBOUND'&&plan.phase!=='RETURNING')||Math.abs(plan.lateral||0)>.001))return false;
 // Chi sta fermo ad aspettare sul marciapiede può essere salutato da un conoscente che passa.
 const e=graph?.edges?.[agent.edge];
 // Lontano dagli incroci veri (nodi con più di due direzioni): niente gruppi sugli angoli o
 // sulle strisce. I semplici vertici di una via OSM non contano: le vie sono fatte di tratti corti.
 if(e){
  const end=agent.t*e.len<SOCIAL_RULES.junctionClear?e.from:(1-agent.t)*e.len<SOCIAL_RULES.junctionClear?e.to:null;
  if(end!==null&&(graph.nodes[end]?.out?.length||0)>2)return false;
 }
 return true;
}
function say(social,ctx,agent,text){
 // Fumetti solo per i gruppi che il giocatore sta guardando.
 const v=ctx.view;if(v&&(agent.x<v[0]||agent.x>v[2]||agent.y<v[1]||agent.y>v[3]))return false;
 const now=social.clock;
 social.bubbles=social.bubbles.filter(t=>now-t<SOCIAL_RULES.bubbleSeconds);
 if(social.bubbles.length>=SOCIAL_RULES.maxBubbles||now-(social.lastBubble??-1e9)<SOCIAL_RULES.bubbleCooldown)return false;
 social.bubbles.push(now);social.lastBubble=now;ctx.say?.(agent,text);return true;
}
function centre(group){let x=0,y=0;for(const m of group.members){x+=m.x;y+=m.y;}return {x:x/group.members.length,y:y/group.members.length};}
function face(group){
 const c=centre(group);
 for(const m of group.members){const dx=c.x-m.x,dy=c.y-m.y;if(Math.hypot(dx,dy)>.05)m.a=Math.atan2(dy,dx);m.braking=true;}
}
function release(social,ctx,group,reason){
 for(const m of group.members)m.social={hold:false,until:social.clock+SOCIAL_RULES.cooldown};
 if(reason==='pericolo')say(social,ctx,group.members[0],'Attenzione!');
 else say(social,ctx,group.members[group.members.length-1],ctx.night>.6?'Buonanotte!':'Ci vediamo!');
 social.log.push({size:group.members.length,reason,seconds:+(social.clock-group.start).toFixed(1)});
 social.groups=social.groups.filter(g=>g!==group);
}
/* ctx: {people, graph, view:[x0,y0,x1,y1], vehicles:[{x,y,speed}], alarm:{x,y,t}, rain, night, say(agent,text), onRoad(x,y)} */
export function stepSocial(social,dt,ctx){
 const elapsed=Math.max(0,Math.min(Number(dt)||0,.25)),out=[];
 social.clock+=elapsed;
 for(const group of [...social.groups]){
  const c=centre(group);
  const hurt=group.members.some(m=>m.impactTime>0||m.needsRoutineRecovery||m.indoors||m.dodge>0);
  const car=(ctx.vehicles||[]).some(v=>Math.abs(v.speed||0)>SOCIAL_RULES.dangerSpeed&&Math.hypot(v.x-c.x,v.y-c.y)<SOCIAL_RULES.dangerRange);
  const horn=ctx.alarm&&social.clock-(ctx.alarm.t??-1e9)<.5&&Math.hypot(ctx.alarm.x-c.x,ctx.alarm.y-c.y)<SOCIAL_RULES.hornRange;
  if(hurt||car||horn){release(social,ctx,group,'pericolo');out.push({type:'broken',size:group.members.length});continue;}
  if(social.clock>=group.end){release(social,ctx,group,'saluti');out.push({type:'parted',size:group.members.length});continue;}
  face(group);
 }
 if(social.clock<social.next)return out;
 social.next=social.clock+SOCIAL_RULES.checkEvery;social.checks++;
 // In tutta la città (i pedoni sono pochi e sparsi): girando, il giocatore trova i gruppi già
 // formati; i fumetti invece solo per quelli in vista.
 const pool=(ctx.people||[]).filter(a=>canSocialize(a,ctx.graph,social.clock));
 // Un terzo conoscente che passa può unirsi a un gruppo da due.
 for(const group of social.groups){
  if(group.members.length>=SOCIAL_RULES.maxGroup)continue;
  const c=centre(group);
  const joiner=pool.find(a=>Math.hypot(a.x-c.x,a.y-c.y)<SOCIAL_RULES.meetRange+.6&&group.members.some(m=>knows(m,a))&&!ctx.onRoad?.(a.x,a.y));
  if(joiner&&rand(social.seed+social.checks*13+joiner.seed)<SOCIAL_RULES.joinChance){
   joiner.social={hold:true,until:0};group.members.push(joiner);group.end=Math.max(group.end,social.clock+5);
   pool.splice(pool.indexOf(joiner),1);out.push({type:'joined',size:group.members.length});
  }
 }
 for(let i=0;i<pool.length;i++)for(let j=i+1;j<pool.length;j++){
  const a=pool[i],b=pool[j];
  if(a.social?.hold||b.social?.hold)continue;
  if(Math.hypot(a.x-b.x,a.y-b.y)>SOCIAL_RULES.meetRange||!knows(a,b))continue;
  // Mai fermi su una carreggiata (attraversamenti di altre strade): bloccherebbero il traffico.
  if(ctx.onRoad?.(a.x,a.y)||ctx.onRoad?.(b.x,b.y))continue;
  if(rand(social.seed+social.checks*7919+(a.seed^b.seed))>=SOCIAL_RULES.chance)continue;
  const group={members:[a,b],start:social.clock,
   end:social.clock+SOCIAL_RULES.chatMin+rand(social.seed+a.seed+b.seed)*(SOCIAL_RULES.chatMax-SOCIAL_RULES.chatMin)};
  a.social={hold:true,until:0};b.social={hold:true,until:0};
  social.groups.push(group);face(group);
  const line=ctx.rain>.5?'Che acqua oggi!':GREETINGS[hash(a.seed+b.seed)%GREETINGS.length];
  say(social,ctx,a,line);
  out.push({type:'met',size:2});
 }
 return out;
}
