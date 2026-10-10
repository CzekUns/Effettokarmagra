/* Ninomon quests: data-driven, save-compatible, no dependencies. */
(function(root){
"use strict";
const quests=[
 {id:"muro",title:"Il pezzo cancellato",kind:"STORIA",reward:{cred:2,fiato:1,item:"Stencil della crew"},
  steps:[
   {type:"talk",zone:0,who:"Paco",hint:"Parla con Paco allo Scalo (A1).",line:"Stamattina qualcuno ha coperto il nostro pezzo. Ho trovato un orario ferroviario incollato sul muro. Mi dai una mano a capire chi è stato?"},
   {type:"clue",zone:0,key:"Orario sospeso",hint:"Esamina il tabellone dei treni allo Scalo (A1)."},
   {type:"talk",zone:1,who:"Nadia",hint:"Cerca Nadia sotto il ponte (B1).",line:"Quel simbolo? L'ho visto vicino al muro della jam. Iris era lì quando hanno spento le luci. Chiedi a lei."},
   {type:"win",zone:1,key:"wall",hint:"Batti Iris nel Sottopasso (B1): è vicino alle casse."},
   {type:"talk",zone:0,who:"Paco",hint:"Torna da Paco allo Scalo (A1).",line:"Era un vecchio manifesto staccato dal vento? E io che pensavo a una crew rivale! Tieni questo stencil, almeno ci facciamo un pezzo nuovo."}
  ]},
 {id:"audio",title:"La notte senza musica",kind:"STORIA",reward:{cred:2,item:"Pass backstage"},
  steps:[
   {type:"talk",zone:1,who:"Filo",hint:"Parla con Filo nel Sottopasso (B1).",line:"Le casse della jam sono mute. Cavo giura che qualcuno ha toccato il mixer. Io intanto non trovo nemmeno il cavo di riserva."},
   {type:"win",zone:1,key:"sound",hint:"Sfida DJ Cavo nel Sottopasso (B1)."},
   {type:"talk",zone:2,who:"Otto",hint:"Interroga Otto al Mercato (C1).",line:"Il cavo? L'ho prestato a quelli del ponte ieri. È dietro la cassa grande, arrotolato. Digli che la prossima volta lo riportano."},
   {type:"talk",zone:1,who:"Filo",hint:"Riporta la notizia a Filo nel Sottopasso (B1).",line:"L'hai trovato! Stasera si suona. Con questo pass entri dietro la console quando vuoi."}
  ]},
 {id:"cassette",title:"Le cassette di Carmela",kind:"SECONDARIA",reward:{cred:1,item:"Gettone del mercato"},
  steps:[
   {type:"talk",zone:2,who:"Carmela",hint:"Trova Carmela al Mercato (C1).",line:"Avevo lasciato due cassette di frutta a Lella. È sempre dietro al suo Ninomon e non viene a ritirarle. Puoi avvisarla?"},
   {type:"win",zone:2,key:"market",hint:"Vinci la sfida contro Lella al Mercato (C1)."},
   {type:"talk",zone:2,who:"Carmela",hint:"Torna da Carmela al Mercato (C1).",line:"Ah, quindi Lella si è fatta viva! Ecco un gettone del mercato. Vieni quando vuoi, Nino."}
  ]},
 {id:"sacco",title:"Il sacco che cammina",kind:"SECONDARIA",reward:{cred:1,item:"Guanto dell'indagine"},
  steps:[
   {type:"talk",zone:2,who:"Custode del deposito",hint:"Cerca il Custode al Mercato (C1).",line:"Da giorni un sacco si sposta da solo vicino alla serranda. Bruno ci parla pure. Voglio capire se è uno scherzo."},
   {type:"win",zone:2,key:"closing",hint:"Sfida Bruno vicino ai cassonetti del Mercato (C1)."},
   {type:"clue",zone:2,key:"Scatola delle prove",hint:"Esamina la scatola delle prove al Mercato (C1)."},
   {type:"talk",zone:2,who:"Custode del deposito",hint:"Riferisci al Custode al Mercato (C1).",line:"Quindi cammina davvero. Va bene, però al turno di notte lo metto a lavorare. Prendi questo guanto: l'ho usato per cercare indizi."}
  ]},
 {id:"scooter",title:"L'ultima consegna di Toni",kind:"SECONDARIA",reward:{cred:2,fiato:1,item:"Toppa del rider"},
  steps:[
   {type:"talk",zone:2,who:"Mimmo",hint:"Trova Mimmo davanti all'officina al Mercato (C1).",line:"Toni sostiene che lo scooter faccia un rumore da Ninomon. Io dico che ha una marmitta bucata. Sfidalo, poi porta un ricambio alla piazza dei dischi."},
   {type:"win",zone:2,key:"delivery",hint:"Batti Toni il rider al Mercato (C1)."},
   {type:"visit",zone:3,hint:"Raggiungi Piazza dei dischi (D1) passando a est dal Mercato."},
   {type:"talk",zone:3,who:"Abitante di Piazza dei dischi",hint:"Parla con l'abitante della Piazza dei dischi (D1).",line:"Sì, il pacchetto di Toni è arrivato. Il ricambio è qui. Digli che stavolta non deve farsi inseguire dal suo Pesce misterioso."},
   {type:"talk",zone:2,who:"Mimmo",hint:"Torna da Mimmo al Mercato (C1).",line:"Hai sistemato la consegna e chiarito la faccenda dello scooter. La prossima volta Toni paga la benzina."}
  ]},
 {id:"radio",title:"Frequenza fantasma",kind:"STORIA",reward:{cred:3,item:"Antenna artigianale"},
  steps:[
   {type:"talk",zone:0,who:"Elio il ferroviere",hint:"Parla con Elio allo Scalo (A1).",line:"Dal vecchio altoparlante sento una voce ogni sera. Dice sempre: «La città si vede dall'alto». Ho pensato ai ragazzi delle antenne."},
   {type:"talk",zone:5,who:"Writer della Ferrovia",hint:"Interroga il writer al Cortile delle antenne (F1).",line:"La voce arriva dal trasmettitore in collina. Un allenatore del viadotto lo tiene acceso. Se lo batti ti dirà dove nasce il segnale."},
   {type:"visit",zone:13,hint:"Attraversa la città fino al quadrante F2."},
   {type:"win",zone:13,key:"q13-t1",hint:"Vinci contro l'allenatore centrale nel quadrante F2."},
   {type:"talk",zone:0,who:"Elio il ferroviere",hint:"Riferisci a Elio allo Scalo (A1).",line:"Era la radio dei writer, allora! Meglio così: almeno questa stazione trasmette ancora qualcosa."}
  ]},
 {id:"crew",title:"La crew attraversa la città",kind:"STORIA",requires:["muro","audio"],reward:{cred:4,item:"Tessera della crew"},
  steps:[
   {type:"talk",zone:0,who:"Vincenzo",hint:"Parla con Vincenzo allo Scalo (A1).",line:"Nino, la storia del muro sta girando per tutta la città. Porta il nome della crew in tre quartieri, poi fammi vedere se sai reggere una sfida lontano da casa."},
   {type:"visit",zone:8,hint:"Esplora il quadrante A2, scendendo verso il sud."},
   {type:"visit",zone:16,hint:"Raggiungi A3, oltre il secondo quartiere."},
   {type:"visit",zone:24,hint:"Prosegui fino ad A4, nel quarto distretto."},
   {type:"win",zone:24,key:"q24-t0",hint:"Sfida il primo allenatore di A4."},
   {type:"talk",zone:0,who:"Vincenzo",hint:"Torna da Vincenzo allo Scalo (A1).",line:"La crew ha lasciato il segno ben oltre il piazzale. Questa tessera te la sei guadagnata."}
  ]},
 {id:"firma",title:"L'ultima firma",kind:"FINALE",requires:["crew","radio","scooter"],reward:{cred:6,fiato:1,item:"Firma leggendaria"},
  steps:[
   {type:"talk",zone:0,who:"Paco",hint:"Parla con Paco allo Scalo (A1) dopo le altre storie.",line:"Ho un muro intero per il pezzo finale, ma ci serve una storia da raccontare. Fai il giro della città, conosci le crew e riempi la Ninodex."},
   {type:"visits",count:20,hint:"Esplora almeno 20 quadranti della mappa (MAPPA per orientarti)."},
   {type:"wins",count:15,hint:"Vinci almeno 15 sfide diverse con gli allenatori."},
   {type:"photos",count:6,hint:"Fotografa almeno 6 specie nella Ninodex."},
   {type:"talk",zone:0,who:"Paco",hint:"Torna da Paco allo Scalo (A1).",line:"Bello, Nino. Ora il muro racconta davvero qualcosa. Il tuo nome resta qui, in mezzo ai nostri."},
   {type:"talk",zone:0,who:"Vincenzo",hint:"Mostra il pezzo finito a Vincenzo allo Scalo (A1).",line:"Hai conosciuto mezza città, hai riempito il taccuino e sei tornato a dipingere. Ti meriti la firma leggendaria."}
  ]}
];
const get=id=>quests.find(q=>q.id===id);
function blank(){return{progress:{},tracked:null};}
function restore(raw){
 const s=blank();if(!raw||typeof raw!=="object")return s;
 for(const q of quests){const x=raw.progress&&raw.progress[q.id];if(Number.isInteger(x)&&x>=0&&x<=q.steps.length)s.progress[q.id]=x;}
 if(get(raw.tracked)&&Object.prototype.hasOwnProperty.call(s.progress,raw.tracked))s.tracked=raw.tracked;
 return s;
}
function complete(s,id){const q=get(id);return !!q&&s.progress[id]===q.steps.length;}
function unlocked(s,q){return !q.requires||q.requires.every(id=>complete(s,id));}
function current(s,q){const n=s.progress[q.id];return n===undefined?null:q.steps[n]||null;}
function targetCount(snapshot,type){return type==="visits"?Object.values(snapshot.visited||{}).filter(Boolean).length:type==="wins"?Object.values(snapshot.defeated||{}).filter(Boolean).length:type==="photos"?Object.values(snapshot.found||{}).filter(Boolean).length:0;}
function satisfied(step,snapshot){
 if(step.type==="clue")return !!snapshot.clues?.[step.key];
 if(step.type==="win")return !!snapshot.defeated?.[step.key];
 if(step.type==="visit")return !!snapshot.visited?.[step.zone];
 if(["visits","wins","photos"].includes(step.type))return targetCount(snapshot,step.type)>=step.count;
 return false;
}
function sync(s,snapshot){
 const changes=[];
 for(const q of quests){
  if(s.progress[q.id]===undefined)continue;
  let from=s.progress[q.id],at=from;
  while(at<q.steps.length&&q.steps[at].type!=="talk"&&satisfied(q.steps[at],snapshot))at++;
  if(at!==from){s.progress[q.id]=at;changes.push({quest:q,from,to:at,done:at===q.steps.length});}
 }
 return changes;
}
function offers(s,who,zone){
 return quests.filter(q=>unlocked(s,q)&&!complete(s,q.id)&&
  (current(s,q)||q.steps[0]).type==="talk"&&
  (current(s,q)||q.steps[0]).who===who&&
  (current(s,q)||q.steps[0]).zone===zone);
}
function talk(s,id,who,zone,snapshot){
 const q=get(id);
 if(!q||!offers(s,who,zone).some(x=>x.id===id))return null;
 const before=s.progress[id]??0,step=q.steps[before],started=s.progress[id]===undefined;
 s.progress[id]=before+1;
 if(!s.tracked||complete(s,s.tracked))s.tracked=id;
 const automatic=sync(s,snapshot).filter(x=>x.quest.id===id);
 return{quest:q,step,started,done:complete(s,id),automatic,to:s.progress[id]};
}
function fiatoBonus(s){return quests.reduce((n,q)=>n+(complete(s,q.id)?q.reward.fiato||0:0),0);}
function cred(s){return quests.reduce((n,q)=>n+(complete(s,q.id)?q.reward.cred||0:0),0);}
function stageLabel(s,q){
 if(complete(s,q.id))return "COMPLETATA";
 if(s.progress[q.id]===undefined)return unlocked(s,q)?"DA INIZIARE":"BLOCCATA";
 return "FASE "+(s.progress[q.id]+1)+"/"+q.steps.length;
}
const api={quests,get,blank,restore,complete,unlocked,current,offers,talk,sync,cred,fiatoBonus,stageLabel,targetCount};
if(typeof module!=="undefined")module.exports=api;
root.NINOMON_QUESTS=api;
})(typeof window==="undefined"?globalThis:window);
