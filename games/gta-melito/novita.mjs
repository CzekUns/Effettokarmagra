/* GTA Melito — BF15: NOVITÀ · DA APPROVARE.
 * Elenco degli elementi grafici e visivi PROVVISORI aggiunti da Claude (account GitHub
 * ilconsulentelogistico-hue): li giudica il committente, la grafica definitiva la decide lui e il
 * proprietario può rifarla nello stile originale. Ogni voce sa dove trovare un esempio vero nella
 * mappa (VAI A VEDERE: posto, ora, meteo); i giudizi MI PIACE / DA RIFARE restano solo in questo
 * browser e si copiano come testo. Tenere allineato con NOVITA_DA_APPROVARE.md. */
import {LOTTO2_PEDESTRIAN_NPC_START_KIND} from './extra-pedestrian-sprites.mjs?v=003';
export const NOVITA_AUTORE='Claude · ilconsulentelogistico-hue';
export const NOVITA_STATO='PROVVISORIO · da approvare';
export const NOVITA_STORAGE_KEY='gta-melito-novita-giudizi-v1';
export const GIUDIZI=Object.freeze({ok:'MI PIACE',rifare:'DA RIFARE'});

const near=(list,state,point=state?.spawn)=>{
 const [sx,sy]=Array.isArray(point)?point:[point?.x||0,point?.y||0];
 let best=null,bd=Infinity;
 for(const q of list||[]){if(!q||!Number.isFinite(q.x)||!Number.isFinite(q.y))continue;
  const d=Math.hypot(q.x-sx,q.y-sy);if(d<bd){bd=d;best=q;}}
 return best?{x:best.x,y:best.y}:null;
};
const boundsCentre=b=>b?.bounds?{x:(b.bounds[0]+b.bounds[2])/2,y:(b.bounds[1]+b.bounds[3])/2}:null;
const roadMiddle=(state,name)=>{
 const road=(state?.roads||[]).find(r=>r.n===name&&r.p?.length>=4);if(!road)return null;
 const k=Math.floor(road.p.length/4)*2;return {x:road.p[k],y:road.p[k+1]};
};
const bayPoint=s=>{const d=(s.from+s.to)/2,nx=-s.uy,ny=s.ux;
 return {x:s.ax+s.ux*d+nx*s.offset*s.side,y:s.ay+s.uy*d+ny*s.offset*s.side};};
const vehicles=state=>[...(state?.cars||[]),...(state?.traffic||[])];
const SERVICE_VAN=/corriere|courier/i, REFUSE_TRUCK=/nettezza|rifiut|compatt|refuse|garbage/i;
const LOTTO1=/^(grande-punto-2005|ypsilon-2011)-/;
const hasPassengers=v=>(Array.isArray(v?.passengers)&&v.passengers.length>0)||(Array.isArray(v?.occupants)&&v.occupants.length>0);

/* Le voci: chi l'ha fatta, in quale PR, cosa guardare e dove (trova → punto da inquadrare).
 * ora = minuti del giorno, meteo = 'pioggia'|'sereno', mercato = monta il mercato anche fuori dal
 * venerdì, satellite = opacità della foto aerea BF13. futura = in arrivo: attiva solo se nel gioco c'è. */
export const NOVITA=Object.freeze([
 {id:'semafori',nome:'Semafori di gioco, alone notturno e linee d’arresto',lavoro:'BF07',pr:'#48',
  cosa:'Palo con lanterna all’angolo del marciapiede e linea d’arresto dipinta; di notte la luce accesa fa alone. Sono semafori simulati, non quelli reali.',
  ora:21*60+30,trova:s=>near((s?.graph?.signals||[]).map(j=>({x:j.x,y:j.y})),s)},
 {id:'frecce',nome:'Frecce delle auto NPC prima di svoltare',lavoro:'BF07',pr:'#48',
  cosa:'Negli ultimi 30 m prima di una svolta le auto NPC lampeggiano dal lato giusto; guardale arrivare all’incrocio.',
  trova:s=>near((s?.graph?.signals||[]).map(j=>({x:j.x,y:j.y})),s)},
 {id:'lavavetri',nome:'Lavavetri ai semafori, con il tergivetro',lavoro:'BF08',pr:'#48',
  cosa:'Col rosso il lavavetri va al finestrino del lato guida della prima auto ferma e passa il tergivetro disegnato sul vetro. Fermati primo al rosso per vederlo sulla tua auto.',
  trova:s=>near((s?.people||[]).filter(q=>q.profession==='lavavetri'),s)},
 {id:'varchi',nome:'Varchi di confine: taglio dritto e imbocco a trapezio',lavoro:'BF09',pr:'#48',
  cosa:'Al confine del comune la strada finisce con un taglio dritto e un imbocco che sfuma nel buio; le auto NPC ci entrano e spariscono, altre ne escono.',
  trova:s=>near(s?.borderGates,s)},
 {id:'baie',nome:'Fascia di sosta con le linee bianche degli stalli',lavoro:'BF02',pr:'#41',
  cosa:'Stalli bianchi tra corsia e marciapiede, dove parcheggiano auto, scooter, Ape e food truck. Controlla che le linee non finiscano in carreggiata.',
  trova:s=>near((s?.parkingBays?.strips||[]).map(bayPoint),s)},
 {id:'recinti',nome:'Mura e recinzioni dei recinti, cancelli pedonali',lavoro:'BF12',pr:'#50',
  cosa:'Muretto con ringhiera della villa comunale e cancelli pedonali (perimetro da OpenStreetMap).',
  trova:s=>{const list=s?.enclosures?.list||[],e=list.find(q=>/villa/i.test((q.id||'')+' '+(q.nome||'')))||list[0];
   return e?(near(e.gates,s)||(Number.isFinite(e.cx)?{x:e.cx,y:e.cy}:null)):null;}},
 {id:'guardiole',nome:'Cancelli carrabili con sbarra, guardiola e guardia',lavoro:'BF12',pr:'#50',
  cosa:'Recinti privati (complesso del Municipio, recinto davanti al mercato): sbarra, guardiola e guardia segnaposto. Di notte (22–6) la sbarra resta giù per il giocatore.',
  trova:s=>near((s?.enclosures?.list||[]).flatMap(e=>(e.gates||[]).filter(g=>g.barrier)),s)},
 {id:'atlante',nome:'Galleria Atlante in vetro',lavoro:'BF12',pr:'#50',
  cosa:'Facciate e atrio a vetrate azzurre sull’edificio OSM accanto all’Ufficio Postale Melito 2 (sagoma invariata; identificazione probabile, da confermare).',
  trova:s=>boundsCentre((s?.buildings||[]).find(b=>b.art?.glass))},
 {id:'torre',nome:'Torre del serbatoio a scacchi',lavoro:'BF12',pr:'#50',
  cosa:'Serbatoio pensile a fungo con fusto e vasca a scacchi (colori stimati: rosso/bianco), ombra lunga; diventa trasparente quando ci passi sotto. Di notte c’è una luce rossa in cima (inventata).',
  ora:12*60,trova:s=>near(s?.waterTowers,s)},
 {id:'piscina',nome:'Piscina comunale interrata in rovina',lavoro:'BF12',pr:'#50',
  cosa:'Vasca vuota e crepata con piastrelle sbiadite, erbacce e scaletta, muri bassi spezzati; con la pioggia (?meteo=pioggia) compaiono pozzanghere.',
  trova:s=>boundsCentre((s?.buildings||[]).find(b=>b.art?.ruinPool))},
 {id:'mercato',nome:'Mercato: banchi dei 14 tipi (sprite del lotto 3), ombrelloni e venditori',lavoro:'Q42',pr:'#52',
  cosa:'Banchi dei 14 tipi del foglio (dal lotto 3 con gli sprite visti dall\'alto; segnaposto solo se il PNG manca), ombrelloni a spicchi, a strisce e tondi, venditori che chiamano e clienti che comprano. Il mercato viene montato per la prova anche se non è venerdì.',
  ora:10*60+30,mercato:true,trova:()=>({x:1168,y:948})},
 {id:'ombrelloni',nome:'Ombrelloni che diventano trasparenti',lavoro:'Q42',pr:'#52',
  cosa:'Passa sotto un ombrellone, a piedi o in auto: sfuma come i tetti e vedi la bancarella sotto.',
  ora:10*60+30,mercato:true,distanza:[2,8],trova:s=>near((s?.market?.stalls||[]).map(q=>({x:q.x,y:q.y})),{spawn:[1168,948]})||{x:1168,y:948}},
 {id:'posteggi',nome:'Posteggi gialli numerati del mercato',lavoro:'Q42',pr:'#52',
  cosa:'Fuori orario del mercato restano a terra solo gli stalli gialli numerati.',
  ora:16*60,trova:()=>({x:1168,y:948})},
 {id:'ape',nome:'Ape Car: 16 varianti d’epoca',lavoro:'Q16',pr:'#55',
  cosa:'8 tinte pulite e le stesse 8 «vissute», ricavate ricolorando solo la carrozzeria dell’Ape approvata (tinte interpretate, non codici Piaggio). Ci sali con E.',
  trova:s=>near(vehicles(s).filter(v=>/^ape-(classica|vissuta)-/.test(v.model||'')),s)},
 {id:'ambulante',nome:'Banco dell’ambulante: pannello AMBULANTE · MELITO',lavoro:'Q17',pr:'#56',
  cosa:'Avvicinati al friggitore: «E · COMPRA …» apre il pannello con il menù di fantasia (1–4 €).',
  trova:s=>near((s?.foodVendors||[]).map(v=>v.fryer).filter(Boolean),s)},
 {id:'satellite',nome:'Foto aerea Esri come sovramappa di confronto',lavoro:'BF13',pr:'#49',
  cosa:'La foto Esri World Imagery al 50% sopra il gioco in Piazza Santo Stefano; si spegne da PAUSA › STRUMENTI o con TORNA DOVE ERI.',
  satellite:.5,trova:s=>boundsCentre((s?.buildings||[]).find(b=>b.id===733703815))||roadMiddle(s,'Piazza Santo Stefano')},
 {id:'corsie',nome:'Corsie che restano fuori dagli edifici nelle vie strette',lavoro:'Q15',pr:'#57',
  cosa:'In Via Francesco Rossi, all’angolo della chiesa, le auto NPC restano sulla carreggiata invece di passare sotto la sagoma.',
  trova:s=>roadMiddle(s,'Via Francesco Rossi')},
 {id:'pulsante',nome:'Pulsante azione attenuato sul telefono',lavoro:'Q15',pr:'#57',
  cosa:'Sul telefono, a piedi lontano da veicoli, negozi e porte, il pulsante azione è spento invece di dire «ENTRA IN AUTO».',
  trova:null},
 {id:'calcetto',nome:'Campetti e partita di calcetto 5 contro 5',lavoro:'Q32 · Q33',pr:'in revisione',
  cosa:'Campetto con erba a strisce, porte, rete e fari; al cancello «E · GIOCA A CALCETTO» apre la partita vista dall’alto (ROSSI contro BLU, 2 minuti): campo, calciatori in pixel art semplice, maglie e comandi touch sono provvisori.',
  distanza:[2,3],trova:s=>near((s?.pitches?.list||[]).filter(p=>p.kind==='calcetto').map(p=>p.gate),s)},
 {id:'scala',nome:'Veicoli e persone più piccoli, parcheggi fuori dalle corsie',lavoro:'BF14',pr:'in arrivo',futura:true,
  cosa:'Auto, moto e persone rimpicciolite rispetto alle strade (zoom adeguato), stalli che non occupano più la carreggiata.',
  disponibile:s=>!!s?.worldScale,trova:s=>near((s?.parkingBays?.strips||[]).map(bayPoint),s)},
 {id:'transenne',nome:'Transenne del mercato',lavoro:'Q42',pr:'—',futura:true,
  cosa:'Vie chiuse al traffico attorno al mercato (requisito R06): non ancora nel gioco.',
  disponibile:()=>false,trova:null},
 {id:'corriere',nome:'Furgone del corriere',lavoro:'Q18',pr:'in arrivo',futura:true,
  cosa:'Nuovo veicolo di servizio con cabina e vano, livrea inventata.',
  disponibile:s=>vehicles(s).some(v=>SERVICE_VAN.test(v.model||'')),trova:s=>near(vehicles(s).filter(v=>SERVICE_VAN.test(v.model||'')),s)},
 {id:'nettezza',nome:'Camion della nettezza urbana',lavoro:'Q18',pr:'in arrivo',futura:true,
  cosa:'Nuovo veicolo di servizio con compattatore, livrea inventata.',
  disponibile:s=>vehicles(s).some(v=>REFUSE_TRUCK.test(v.model||'')),trova:s=>near(vehicles(s).filter(v=>REFUSE_TRUCK.test(v.model||'')),s)},
 {id:'passeggeri',nome:'Passeggeri su auto e scooter',lavoro:'Q21',pr:'in arrivo',futura:true,
  cosa:'Passeggeri visibili in marcia, «E · DAI UN PASSAGGIO».',
  disponibile:s=>vehicles(s).some(hasPassengers),trova:s=>near(vehicles(s).filter(hasPassengers),s)},
 {id:'lotto1-auto',nome:'Lotto 1: Fiat Grande Punto e Lancia Ypsilon III nel traffico',lavoro:'Lotto 1 · CODEX-GH',pr:'in revisione',
  cosa:'Due modelli nuovi tra le auto del traffico e dei parcheggi, 8 tinte ciascuno (atlante pixel art disegnato da codice da CODEX-GH; tinte interpretate, non codici vernice). Guarda la fila di auto in Via Roma: musetto arrotondato e fari a goccia per la Grande Punto, fianchi stretti e lunotto piccolo per la Ypsilon.',
  disponibile:s=>vehicles(s).some(v=>LOTTO1.test(v?.model||''))||!s?.traffic,
  trova:s=>roadMiddle(s,'Via Roma')||near(vehicles(s).filter(v=>LOTTO1.test(v?.model||'')),s)},
 {id:'gare',nome:'Gare clandestine arcade: partenza, anelli, frecce e avversari',lavoro:'Q34',pr:'in revisione',
  cosa:'Bandiera a scacchi e cerchio alla partenza in periferia, 3 avversari fermi in griglia; in auto «E · GARA»: anelli gialli, frecce sull’asfalto, percorso in minimappa, cronometro e posizione. Evento di finzione, solo nel gioco.',
  disponibile:s=>!!s?.races?.routes?.length,trova:s=>near((s?.races?.routes||[]).map(r=>r.start),s)},
 {id:'lotto2-pedoni',nome:'Lotto 2: quattro nuovi pedoni (signora con la borsa, ragazzo con lo zaino, uomo in giacca, ragazza col cappotto rosso)',lavoro:'Lotto 2 grafica',pr:'in revisione',
  cosa:'Foglio di CODEX-GH: frame adattati a zone dalla tavola madre dei pedoni (stesse pose, piedi e scala), vestiti e colori nuovi. Si mescolano alla gente in strada (residenti, passanti, clienti): guardali camminare su Via Roma nelle quattro direzioni. Grafica PROVVISORIA.',
  trova:s=>near((s?.people||[]).filter(q=>!q.indoors&&!q.profession&&q.kind>=LOTTO2_PEDESTRIAN_NPC_START_KIND),s)||roadMiddle(s,'Via Roma')},
 {id:'lotto3-banchi',nome:'Lotto 3: banchi del mercato visti dall\'alto (14 tipi) al posto dei segnaposto',lavoro:'Lotto 3 grafica',pr:'in revisione',
  cosa:'Foglio di CODEX-GH: piano di ogni banco visto dall\'alto con la merce del suo tipo (cassette di frutta, vasche del pesce, vetrina dei salumi, pile di vestiti, scarpe, pentole, flaconi, giocattoli, vasi, borse, intimo, bigiotteria, porchetta, olive), orlo di legno e ombra verso il corridoio dei clienti. Ombrelloni, venditori e clienti come prima; durante il montaggio lo sprite appare in dissolvenza. Grafica PROVVISORIA.',
  ora:10*60+30,mercato:true,distanza:[2,8],trova:s=>near((s?.market?.stalls||[]).map(q=>({x:q.x,y:q.y})),{spawn:[1168,948]})||{x:1168,y:948}}
].map(Object.freeze));

/* Una voce è attiva se esiste davvero nel gioco (le voci «in arrivo» solo quando il modulo c'è). */
export function novitaAvailable(entry,state){
 return typeof entry.disponibile==='function'?!!entry.disponibile(state):!entry.futura;
}
/* Dove inquadrare l'esempio (null = voce solo descrittiva o esempio non trovato in questa mappa). */
export function novitaTarget(entry,state){
 if(!entry||typeof entry.trova!=='function'||!novitaAvailable(entry,state))return null;
 const p=entry.trova(state);
 return p&&Number.isFinite(p.x)&&Number.isFinite(p.y)?{x:p.x,y:p.y}:null;
}
/* Un punto dove far stare il giocatore a piedi vicino all'esempio: a distanza [min,max], su un posto
 * camminabile e libero (mai dentro muri, edifici o veicoli). Anelli di 16 direzioni, prima i vicini. */
export function findStandingPoint(target,{walkable=()=>true,free=()=>true}={},{min=6,max=26,step=2}={}){
 if(!target)return null;
 for(let r=min;r<=max+1e-9;r+=step)for(let k=0;k<16;k++){
  const a=Math.PI/2+k*Math.PI/8,x=target.x+Math.cos(a)*r,y=target.y+Math.sin(a)*r;
  if(walkable(x,y)&&free(x,y))return {x,y,a:Math.atan2(target.y-y,target.x-x)};
 }
 return null;
}
/* Minuti assoluti dell'orologio NPC con la stessa giornata e l'ora richiesta. */
export function minutesAtHour(current,hour){
 const day=Math.floor((Number(current)||0)/1440);
 return day*1440+((Number(hour)%1440)+1440)%1440;
}
export function loadJudgements(storage){
 try{const raw=storage?.getItem(NOVITA_STORAGE_KEY);const data=raw?JSON.parse(raw):{};
  return Object.fromEntries(Object.entries(data||{}).filter(([id,v])=>NOVITA.some(e=>e.id===id)&&GIUDIZI[v]));}
 catch(_){return {};}
}
export function saveJudgements(storage,judgements){
 try{storage?.setItem(NOVITA_STORAGE_KEY,JSON.stringify(judgements));}catch(_){}
}
/* Un clic su un giudizio già dato lo toglie; altrimenti lo imposta. */
export function toggleJudgement(judgements,id,value){
 const next={...judgements};
 if(next[id]===value)delete next[id];else if(GIUDIZI[value])next[id]=value;
 return next;
}
/* Testo da incollare in chat o in una issue. */
export function judgementSummary(judgements,{date=new Date()}={}){
 const pick=v=>NOVITA.filter(e=>judgements[e.id]===v),open=NOVITA.filter(e=>!judgements[e.id]&&!e.futura);
 const line=e=>'- '+e.nome+' ('+e.lavoro+(e.pr&&e.pr!=='—'?', PR '+e.pr:'')+')';
 const day=date.toISOString?date.toISOString().slice(0,10):'';
 return ['GTA Melito — giudizi NOVITÀ grafiche provvisorie ('+day+')','',
  'MI PIACE ('+pick('ok').length+'):',...pick('ok').map(line),'',
  'DA RIFARE ('+pick('rifare').length+'):',...pick('rifare').map(line),'',
  'NON ANCORA GIUDICATE ('+open.length+'):',...open.map(line)].join('\n');
}
/* Lista del menu PAUSA. onGo(entry) porta all'esempio, onJudge(id,value) registra il giudizio. */
export function renderNovita(container,{state,judgements={},onGo=()=>{},onJudge=()=>{}}={}){
 if(!container)return;
 const doc=container.ownerDocument;container.textContent='';
 for(const entry of NOVITA){
  const on=novitaAvailable(entry,state),row=doc.createElement('div');
  row.className='novita-item'+(on?'':' novita-off');row.dataset.novita=entry.id;
  const head=doc.createElement('div');head.className='novita-name';head.textContent=entry.nome;
  const meta=doc.createElement('div');meta.className='novita-meta';
  meta.textContent=entry.lavoro+' · PR '+entry.pr+' · '+(entry.futura&&!on?'IN ARRIVO':NOVITA_STATO)+(judgements[entry.id]?' · '+GIUDIZI[judgements[entry.id]]:'');
  const what=doc.createElement('div');what.className='novita-what';what.textContent=entry.cosa;
  const bar=doc.createElement('div');bar.className='novita-actions';
  const go=doc.createElement('button');go.type='button';go.textContent='VAI A VEDERE';
  go.disabled=!on||typeof entry.trova!=='function';go.addEventListener('click',()=>onGo(entry));bar.append(go);
  for(const [value,label] of Object.entries(GIUDIZI)){
   const b=doc.createElement('button');b.type='button';b.textContent=label;b.disabled=!on;
   b.setAttribute('aria-pressed',String(judgements[entry.id]===value));b.className='novita-'+value;
   b.addEventListener('click',()=>onJudge(entry.id,value));bar.append(b);
  }
  row.append(head,meta,what,bar);container.append(row);
 }
}
