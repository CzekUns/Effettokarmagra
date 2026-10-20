/* Q02: deterministic fictional daily schedules for the resident cohort.
 * Clock time is simulated and advances only while the outdoor world runs;
 * it does not replace or scale the campaign's real-second mission timers. */
export const NPC_START_MINUTE=7*60+30;
export const NPC_MINUTES_PER_SECOND=1;
export const NPC_DAY_MINUTES=24*60;
const SLOTS=[
 {slot:'mattina',start:7*60,duration:150},
 {slot:'pranzo',start:11*60+40,duration:130},
 {slot:'pomeriggio',start:15*60,duration:150},
 {slot:'sera',start:18*60+45,duration:165},
 {slot:'notte',start:23*60+15,duration:135}
];
const modulo=(n,m)=>((n%m)+m)%m;
const hash=n=>{let x=n|0;x=Math.imul(x^(x>>>16),2246822519);x=Math.imul(x^(x>>>13),3266489917);return (x^(x>>>16))>>>0;};
export function advanceNpcClock(minutes,dt,{paused=false,interior=false}={}){
 if(paused||interior||!Number.isFinite(dt)||dt<=0)return minutes;
 return minutes+Math.min(dt,.05)*NPC_MINUTES_PER_SECOND;
}
// Q42: un contatore leggero dei giorni. Il giorno 0 della partita è un VENERDÌ (giorno del mercato
// del rione 219, dato non verificato); 1 giorno di gioco = 24 minuti reali.
export const NPC_WEEKDAYS=Object.freeze(['VENERDÌ','SABATO','DOMENICA','LUNEDÌ','MARTEDÌ','MERCOLEDÌ','GIOVEDÌ']);
export function npcDay(minutes){return Math.floor((Number(minutes)||0)/NPC_DAY_MINUTES);}
export function npcWeekday(minutes){return NPC_WEEKDAYS[modulo(npcDay(minutes),7)];}
export function npcDaypart(minutes){
 const t=modulo(Math.floor(minutes),NPC_DAY_MINUTES);
 if(t>=5*60&&t<11*60)return 'MATTINA';
 if(t>=11*60&&t<14*60)return 'PRANZO';
 if(t>=14*60&&t<18*60)return 'POMERIGGIO';
 if(t>=18*60&&t<23*60)return 'SERA';
 return 'NOTTE';
}
export function formatNpcClock(minutes){
 const t=modulo(Math.floor(minutes),NPC_DAY_MINUTES);
 return `${String(Math.floor(t/60)).padStart(2,'0')}:${String(t%60).padStart(2,'0')} · ${npcDaypart(minutes)}`;
}
export function makeResidentAgenda(seed,index){
 const base=SLOTS[index%SLOTS.length];
 const stagger=(hash(seed+index*97)%47)-23;
 return {slot:base.slot,startMinute:modulo(base.start+stagger,NPC_DAY_MINUTES),
  duration:base.duration,lastRunId:null,status:'AT_HOME'};
}
/* Returns the unique daily occurrence ID while the departure window is open.
 * A night window may cross midnight; its occurrence ID stays unchanged. */
export function residentDepartureWindow(agenda,minutes){
 if(!agenda||!Number.isFinite(minutes))return null;
 const since=minutes-agenda.startMinute;
 const elapsed=modulo(since,NPC_DAY_MINUTES);
 if(elapsed>=agenda.duration)return null;
 return Math.floor(since/NPC_DAY_MINUTES);
}
