/* GTA Melito — BF15: NOVITÀ · DA APPROVARE.
 * Elenco degli elementi grafici e visivi PROVVISORI aggiunti da Claude (account GitHub
 * ilconsulentelogistico-hue): li giudica il committente, la grafica definitiva la decide lui e il
 * proprietario può rifarla nello stile originale. Ogni voce sa dove trovare un esempio vero nella
 * mappa (VAI A VEDERE: posto, ora, meteo); i giudizi MI PIACE / DA RIFARE restano solo in questo
 * browser e si copiano come testo. Tenere allineato con NOVITA_DA_APPROVARE.md. */
import {LOTTO2_PEDESTRIAN_NPC_START_KIND,PEDESTRIAN_VARIANT_FIRST_KIND,pedestrianSheet} from './extra-pedestrian-sprites.mjs?v=007';
const LOTTO10_12_FIRST_KIND=pedestrianSheet('lotto10').startKind;// lotti 10–12: kind 11–22
const LOTTO10_12_LAST_KIND=pedestrianSheet('lotto12').startKind+3;
const LOTTO13_14_FIRST_KIND=pedestrianSheet('lotto13').startKind;// lotti 13–14: kind 23–30
const LOTTO13_14_LAST_KIND=pedestrianSheet('lotto14').startKind+3;
const LOTTO17_20_FIRST_KIND=pedestrianSheet('lotto17').startKind;// lotti 17–20: kind 31–46
const LOTTO17_20_LAST_KIND=pedestrianSheet('lotto20').startKind+3;
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
const LOTTO5=/^(tipo-hatchback-2016|fiat-500l-2012)-/;
const LOTTO6=/^(clio-iv-2012|golf-vii-2012)-/;
const LOTTO7=/^(corsa-e-2014|peugeot-208-2012)-/;
const LOTTO8=/^(qashqai-j11-2013|duster-2010)-/;
const LOTTO9=/^(doblo-2010|fiorino-2008)-/;
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
 {id:'calcetto',nome:'Campo grande di Via delle Palme e partita di calcetto nel campo',lavoro:'Q32 · Q33',pr:'in revisione',
  cosa:'Campo grande (58×102) con erba a strisce, porte da 8, rete e fari; dentro le linee «E · GIOCA»: nove calciatori arrivano a piedi (maglie ROSSI e BLU dal foglio pixel art dei pedoni), fischio e si gioca nella città, 2 minuti, con la telecamera di sempre. Palla, maglie, anello del possesso, barra del tiro e pulsanti touch TIRO/PASSA sono provvisori. I campetti piccoli mostrano solo un avviso per il campo grande.',
  distanza:[2,3],trova:s=>near((s?.pitches?.list||[]).filter(p=>p.partita).map(p=>p.gate),s)},
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
  ora:10*60+30,mercato:true,distanza:[2,8],trova:s=>near((s?.market?.stalls||[]).map(q=>({x:q.x,y:q.y})),{spawn:[1168,948]})||{x:1168,y:948}},
 {id:'lotto5-auto',nome:'Lotto 5: Fiat Tipo 2016 e Fiat 500L 2012 nel traffico',lavoro:'Lotto 5 · CODEX-GH',pr:'in revisione',
  cosa:'Due modelli nuovi tra le auto del traffico e dei parcheggi, 8 tinte ciascuno (atlante pixel art disegnato da codice da CODEX-GH; tinte interpretate, non codici vernice). Guarda la fila di auto in Via Roma: la Tipo è più lunga e bassa, con cofano esteso e fanali posteriori orizzontali; la 500L è corta e tozza, con tetto lungo, vetri grandi e fari tondi. Grafica PROVVISORIA.',
  disponibile:s=>vehicles(s).some(v=>LOTTO5.test(v?.model||''))||!s?.traffic,
  trova:s=>roadMiddle(s,'Via Roma')||near(vehicles(s).filter(v=>LOTTO5.test(v?.model||'')),s)},
 {id:'lotto6-auto',nome:'Lotto 6: Renault Clio IV 2012 e Volkswagen Golf VII 2012 nel traffico',lavoro:'Lotto 6 · CODEX-GH',pr:'in revisione',
  cosa:'Due modelli nuovi tra le auto del traffico e dei parcheggi, 8 tinte ciascuno (atlante pixel art disegnato da codice da CODEX-GH; tinte interpretate, non codici vernice). Guarda la fila di auto in Via Roma: la Clio è corta e arrotondata, con muso curvo e fari a goccia; la Golf è più lunga, larga e squadrata, con tetto piatto e fari stretti. Grafica PROVVISORIA.',
  disponibile:s=>vehicles(s).some(v=>LOTTO6.test(v?.model||''))||!s?.traffic,
  trova:s=>roadMiddle(s,'Via Roma')||near(vehicles(s).filter(v=>LOTTO6.test(v?.model||'')),s)},
 {id:'lotto7-auto',nome:'Lotto 7: Opel Corsa E 2014 e Peugeot 208 2012 nel traffico',lavoro:'Lotto 7 · CODEX-GH',pr:'in revisione',
  cosa:'Due modelli nuovi tra le auto del traffico e dei parcheggi, 8 tinte ciascuno (atlante pixel art disegnato da codice da CODEX-GH; tinte interpretate, non codici vernice). Guarda la fila di auto in Via Roma: la Corsa ha la coda alta, il tetto lungo e i fari anteriori a freccia; la 208 ha fari allungati e il tetto che si restringe e scende verso la coda. Grafica PROVVISORIA.',
  disponibile:s=>vehicles(s).some(v=>LOTTO7.test(v?.model||''))||!s?.traffic,
  trova:s=>roadMiddle(s,'Via Roma')||near(vehicles(s).filter(v=>LOTTO7.test(v?.model||'')),s)},
 {id:'lotto8-auto',nome:'Lotto 8: Nissan Qashqai J11 2013 e Dacia Duster 2010 nel traffico',lavoro:'Lotto 8 · CODEX-GH',pr:'in revisione',
  cosa:'Due crossover nuovi tra le auto del traffico e dei parcheggi, 8 tinte ciascuno (atlante pixel art disegnato da codice da CODEX-GH; tinte interpretate, non codici vernice; il verde scuro della Duster è una scelta artistica). Guarda la fila di auto in Via Roma: il Qashqai ha muso a V, spalle e lunotto rastremati; la Duster è più squadrata, con coda verticale, paraurti scuri e passaruota marcati; entrambi con barre sul tetto, un po\' più grandi delle utilitarie. Grafica PROVVISORIA.',
  disponibile:s=>vehicles(s).some(v=>LOTTO8.test(v?.model||''))||!s?.traffic,
  trova:s=>roadMiddle(s,'Via Roma')||near(vehicles(s).filter(v=>LOTTO8.test(v?.model||'')),s)},
 {id:'lotto9-furgoncini',nome:'Lotto 9: Fiat Doblò II 2010 e Fiat Fiorino III 2008, furgoncini da lavoro nel traffico',lavoro:'Lotto 9 · CODEX-GH',pr:'in revisione',
  cosa:'Due furgoncini da lavoro tra le auto del traffico e dei parcheggi, 8 livree ciascuno: bianco, bianco con fascia, grigio, blu, rosso, giallo, verde scuro e bianco con scritta generica (EDILIZIA sul Doblò, FRUTTA sul Fiorino; nessuna ditta vera). Atlante pixel art disegnato da codice da CODEX-GH con le celle grandi del furgone corriere. Guarda la fila in Via Roma: il Doblò è lungo, con tetto piatto nervato, parabrezza ampio e porte scorrevoli; il Fiorino è più corto e stretto, cabina arrotondata e vano squadrato; entrambi più grandi delle utilitarie ma più stretti del corriere. Grafica PROVVISORIA.',
  disponibile:s=>vehicles(s).some(v=>LOTTO9.test(v?.model||''))||!s?.traffic,
  trova:s=>roadMiddle(s,'Via Roma')||near(vehicles(s).filter(v=>LOTTO9.test(v?.model||'')),s)},
 {id:'lotto10-12-pedoni',nome:'Lotti 10–12: 12 pedoni nuovi (anziani, giovani, adulti con borse, zaini, telefono, bastone)',lavoro:'Lotti 10–12 · CODEX-GH',pr:'in revisione',
  cosa:'Tre fogli di CODEX-GH, frame adattati a zone dalla tavola madre (stesse pose, piedi e scala), vestiti e colori nuovi. Lotto 10: signora anziana col cappotto e la borsa della spesa, ragazzo con felpa e zaino, donna con giacca chiara e borsa a tracolla, uomo in giacca con cravatta e valigetta. Lotto 11: ragazza col telefono, uomo robusto con maglietta a righe, donna col vestito corallo, sportivo in tuta. Lotto 12: nonno con coppola e bastone, nonna col vestito a fiori, ragazzo con le cuffie, ragazza con la giacca di jeans. Si mescolano alla gente in strada (residenti, passanti, clienti): guardali camminare su Via Roma nelle quattro direzioni. Grafica PROVVISORIA.',
  trova:s=>near((s?.people||[]).filter(q=>!q.indoors&&!q.profession&&q.kind>=LOTTO10_12_FIRST_KIND&&q.kind<=LOTTO10_12_LAST_KIND),s)||roadMiddle(s,'Via Roma')},
 {id:'lotto13-14-pedoni',nome:'Lotti 13–14: 8 pedoni nuovi (operaio, signora col carrello, ragazzino, barista, uomo estivo, signora elegante, studente, donna con velo)',lavoro:'Lotti 13–14 · CODEX-GH',pr:'in revisione',
  cosa:'Due fogli di CODEX-GH, frame adattati a zone dalla tavola madre (stesse pose, piedi e scala), vestiti e colori nuovi. Lotto 13: operaio con gilet arancione, signora col carrello della spesa a quadri (davanti o di lato secondo la direzione), ragazzino con felpa verde e pallone sotto il braccio (più basso degli altri, di proposito), barista con camicia bianca e grembiule nero. Lotto 14: uomo estivo in canottiera e bermuda, signora elegante con cappello a falda e vestito blu, studente con giacca salvia, occhiali e cartellina, donna con velo corallo e abito lungo petrolio. Si mescolano alla gente in strada (residenti, passanti, clienti): guardali camminare su Via Roma nelle quattro direzioni. Grafica PROVVISORIA.',
  trova:s=>near((s?.people||[]).filter(q=>!q.indoors&&!q.profession&&q.kind>=LOTTO13_14_FIRST_KIND&&q.kind<=LOTTO13_14_LAST_KIND),s)||roadMiddle(s,'Via Roma')},
 {id:'lotto17-20-pedoni',nome:'Lotti 17–20: 16 pedoni nuovi (mestieri, famiglie e passanti)',lavoro:'Lotti 17–20 · CODEX-GH',pr:'in revisione',
  cosa:'Quattro fogli di CODEX-GH, kind 31–46: postino, pizzaiolo, netturbino, prete; turista, ragazzo con skateboard, donna in tailleur, anziano col giornale; mamma col bambino, ragazza col cane, uomo in sedia a rotelle, ragazzo delivery; nonna con scopa, scolaro, uomo in tuta col telefono, donna col carrello. Frame adattati dalla tavola madre, scala e pivot degli altri pedoni. Si vedono fra passanti, residenti e clienti del mercato; VAI A VEDERE cerca il più vicino su Via Roma. Grafica PROVVISORIA, da approvare da Simone.',
  trova:s=>near((s?.people||[]).filter(q=>!q.indoors&&!q.profession&&q.kind>=LOTTO17_20_FIRST_KIND&&q.kind<=LOTTO17_20_LAST_KIND),s)||roadMiddle(s,'Via Roma')},
 {id:'varianti-pedoni',nome:'Varianti di colore: più volti nella popolazione',lavoro:'Varianti pedoni · CODEX-GH',pr:'in revisione',
  cosa:'Due varianti di vestiti e capelli per la tavola madre, il lotto 2 e i lotti 10–14 e 17–20. Sono 22 fogli pronti, senza ricolorazione durante il gioco: pose, trasparenza, carnagioni e kind originali restano uguali. Le nuove identità si mescolano a passanti, residenti e clienti del mercato. Grafica PROVVISORIA, da approvare da Simone.',
  trova:s=>near((s?.people||[]).filter(q=>!q.indoors&&!q.profession&&q.kind>=PEDESTRIAN_VARIANT_FIRST_KIND),s)||roadMiddle(s,'Via Roma')},
 {id:'vita-di-quartiere',nome:'Vita di quartiere: persone ferme presso bar, chiese, mercato e panchine',lavoro:'Vita di quartiere · CODEX-GH',pr:'in revisione',
  cosa:'Piccoli gruppi fermi davanti ai locali OSM, alle due chiese e ai banchi del mercato; persone sulle panchine già disegnate e due anziani davanti al Municipio. Più presenti alle 10–13 e 17–21, quasi assenti di notte. Non bloccano il giocatore e si scostano quando passa vicino. Nessun tavolino all’aperto o circolo localizzato nei dati caricati. Grafica PROVVISORIA, da approvare da Simone.',
  ora:11*60,trova:s=>near((s?.idle?.spots||[]).slice(0,36),s)||roadMiddle(s,'Via Roma')},
 {id:'pose-fermi',nome:'Pose ferme: seduti, in chiacchiera e appoggiati',lavoro:'Pose ferme · CODEX-GH',pr:'in revisione',
  cosa:'Le persone della vita di quartiere ora hanno pose dedicate: gambe piegate sulle panchine, un piccolo gesto che alterna due frame nei gruppetti, postura laterale appoggiata presso alcuni bar. Fogli derivati da tutti i pedoni esistenti, comprese le varianti; nessun nuovo kind. Grafica PROVVISORIA, da approvare da Simone.',
  ora:11*60,trova:s=>near((s?.idle?.spots||[]).filter(q=>q.activity==='bench'||q.pose==='leaning'),s)||near(s?.idle?.spots,s)||roadMiddle(s,'Via Roma')},
 {id:'giochi-di-strada',nome:'Giochi di strada: bambini a pallone e anziani a carte',lavoro:'Giochi di strada · CODEX-GH',pr:'in revisione',
  cosa:'Nella villa comunale, nei campetti e negli slarghi pedonali alcuni ragazzini si passano un pallone; nella villa e davanti al Municipio due tavolini ospitano anziani che giocano a carte. Si fermano un attimo se il giocatore passa in mezzo, senza collisioni. Bambini 16–20 nei giorni di scuola e 10–20 nel weekend; carte 9–12 e 16–19. Grafica PROVVISORIA, da approvare da Simone.',
  ora:17*60+30,trova:s=>near((s?.streetGames?.ballGroups||[]).map(g=>g.center),s)||
   near((s?.streetGames?.cardTables||[]).map(t=>t.center),s)||roadMiddle(s,'Via Roma')},
 {id:'animali-di-strada',nome:'Animali di strada: piccioni e gatti',lavoro:'Animali di strada · CODEX-GH',pr:'in revisione',
  cosa:'Piccoli stormi di piccioni grigi e bianchi nelle piazze, presso le chiese, il mercato e la villa; se il giocatore o un’auto arriva vicino, volano via e poi si posano. Gatti tigrati, neri e bianchi/rossi vicino ai muretti e alle auto parcheggiate; si allontanano con calma. Non bloccano e non feriscono nessuno. Grafica PROVVISORIA, da approvare da Simone.',
  ora:11*60,trova:s=>near((s?.animals?.flocks||[]).map(f=>f.center),s)||near(s?.animals?.cats,s)||roadMiddle(s,'Via Roma')},
 {id:'caricamento-artwork',nome:'Schermate di caricamento: sei artwork di Melito e il render del gioco',lavoro:'Caricamento · CODEX-GH',pr:'in revisione',
  cosa:'Sette sfondi a rotazione: Via Roma nel gioco, mercato, campetto, villa comunale, pizzeria di Via Roma, mercato all’alba e festa patronale. L’ultima schermata vista non ricompare subito. PROVA mostra l’anteprima successiva senza lasciare il gioco; la fascia scura mantiene leggibili titolo, testo e barra. Artwork PROVVISORIE, da approvare da Simone.',
  prova:'caricamento',trova:null},
 {id:'dialogo-volti',nome:'Lotto 15: dialoghi con volto — barra di testo in basso e riquadro del personaggio (6 volti artwork)',lavoro:'Lotto 15 · CODEX-GH',pr:'in revisione',
  cosa:'Prototipo per i dialoghi delle missioni (decisione di Simone del 21/10): una barra scura nella parte bassa dello schermo con il nome in maiuscolo e il testo che scorre a macchina da scrivere, e accanto il riquadro con il volto di chi parla (illustrazioni cel-shaded di CODEX-GH: nonna severa, meccanico, ragazza con le cuffie, vigile urbano, barista anziano, ragazzo quindicenne; personaggi inventati). PROVA apre un dialogo di esempio di 6 battute: un tocco sulla barra, INVIO/SPAZIO o AVANTI completano la riga o passano alla battuta dopo; mentre è aperto i comandi di movimento sono fermi ma il paese va avanti. Non ancora agganciato alle missioni. Grafica PROVVISORIA.',
  prova:'dialogo',trova:null}
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
/* Lista del menu PAUSA. onGo(entry) porta all'esempio, onJudge(id,value) registra il giudizio,
 * onProva(entry) apre la prova per le voci con `prova` (es. il dialogo con volto): al posto di VAI A VEDERE c'è PROVA. */
export function renderNovita(container,{state,judgements={},onGo=()=>{},onJudge=()=>{},onProva=()=>{}}={}){
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
  const go=doc.createElement('button');go.type='button';
  if(entry.prova){go.textContent='PROVA';go.disabled=!on;go.addEventListener('click',()=>onProva(entry));}
  else{go.textContent='VAI A VEDERE';go.disabled=!on||typeof entry.trova!=='function';go.addEventListener('click',()=>onGo(entry));}
  bar.append(go);
  for(const [value,label] of Object.entries(GIUDIZI)){
   const b=doc.createElement('button');b.type='button';b.textContent=label;b.disabled=!on;
   b.setAttribute('aria-pressed',String(judgements[entry.id]===value));b.className='novita-'+value;
   b.addEventListener('click',()=>onJudge(entry.id,value));bar.append(b);
  }
  row.append(head,meta,what,bar);container.append(row);
 }
}
