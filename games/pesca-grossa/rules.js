/* PESCA GROSSA — regole condivise da gioco e test.
 * Dati (pesci, esche, attrezzatura, luoghi, meteo) + simulazione pura:
 * abboccata, combattimento, economia, commissioni, giornate e salvataggi.
 * Niente DOM: il caso (rand) e l'ora arrivano sempre dall'esterno. */
(function(root){
"use strict";

const PX_PER_M=12;            // 1 metro di lenza = 12 px sul canvas 800x760
const GAME_MIN_PER_SEC=4;     // in carriera 1 secondo reale = 4 minuti di gioco
const DAY_START=5*60,DAY_END=21*60,NIGHT_END=24*60;
const RARITY={
 comune:{label:"Comune",weight:60,window:1.05,stars:1},
 noncomune:{label:"Non comune",weight:26,window:.85,stars:2},
 raro:{label:"Raro",weight:10,window:.65,stars:3},
 epico:{label:"Epico",weight:3.2,window:.52,stars:4},
 leggendario:{label:"Leggendario",weight:1.4,window:.44,stars:5}
};

/* Luoghi. shoreY = dove finisce la riva; depth = profondità a riva e al fondo del canvas. */
const SPOTS={
 lago:{id:"lago",name:"Lago Patria",short:"Lago",kind:"lago",unlock:null,travel:0,
  depth:[.6,4.6],curve:1.1,junk:.05,
  features:[{x:110,y:330,rx:90,ry:55,dd:-.4,weed:true},{x:690,y:610,rx:120,ry:70,dd:.6,rock:true},{x:420,y:700,rx:160,ry:50,dd:.4}],
  blurb:"Acqua salmastra tra canneti e pontili di legno. Cefali, carpe e, di notte, qualcosa di molto antico."},
 porto:{id:"porto",name:"Porto di Pozzuoli",short:"Porto",kind:"porto",unlock:"cumana",travel:45,
  depth:[3,14],curve:1,junk:.11,
  features:[{x:160,y:420,rx:40,ry:40,dd:0,rock:true},{x:640,y:420,rx:40,ry:40,dd:0,rock:true},{x:400,y:690,rx:200,ry:60,dd:2,ruins:true}],
  blurb:"Il molo sotto il Rione Terra. Pesce azzurro di giorno, seppie e murene quando si accendono le luci."},
 scogli:{id:"scogli",name:"Scogli di Posillipo",short:"Scogli",kind:"scogli",unlock:"scooter",travel:50,
  depth:[2,26],curve:1.25,junk:.06,
  features:[{x:120,y:360,rx:110,ry:80,dd:-1.5,rock:true},{x:690,y:330,rx:120,ry:70,dd:-1,rock:true},{x:300,y:600,rx:90,ry:60,dd:-3,rock:true},{x:600,y:640,rx:110,ry:60,dd:-2,rock:true}],
  blurb:"Scogliera e acqua turchese: saraghi, polpi nelle tane e, più al largo, dentici e cernie."},
 golfo:{id:"golfo",name:"Golfo, al largo",short:"Golfo",kind:"golfo",unlock:"gozzo",travel:60,
  depth:[28,190],curve:1.3,junk:.03,
  features:[{x:560,y:520,rx:130,ry:90,dd:-18,rock:true,shoal:true}],
  blurb:"Con il gozzo davanti a Capri: palamite, lampughe, ricciole e i giganti del Golfo."}
};
const SPOT_ORDER=["lago","porto","scogli","golfo"];

/* Pesci. len in cm, peso (g) = k * len^3. price €/kg. depth in metri. hours = finestre [inizio,fine) in ore.
 * style = pesi delle azioni nel combattimento. power = forza per kg^0.6, speed = m/s di fuga. */
const S=(o)=>o;
const SPECIES=[
 // --- Lago Patria
 S({id:"cefalo",name:"Cefalo",latin:"Mugil cephalus",spots:["lago","porto"],rarity:"comune",len:[20,62],k:.011,price:6,depth:[.4,6],hours:[[5,21]],peak:[[6,9],[17,20]],
  baits:{pane:.95,mais:.35,bigattini:.6,verme:.35},style:{tira:3,fuga:3,salto:1,riposo:2},power:1.35,speed:3.2,endurance:1,shadow:"pesce",color:"#b9cdd6",dark:"#5d7b8a",min:20,pref:["nuvoloso"],
  note:"Diffidente e scattante: assaggia il pane con calma prima di decidersi."}),
 S({id:"carassio",name:"Carassio",latin:"Carassius carassius",spots:["lago"],rarity:"comune",len:[12,36],k:.02,price:2.5,depth:[.4,3.5],hours:[[5,22]],peak:[[7,11]],
  baits:{mais:.9,pane:.8,bigattini:.9},style:{tira:4,fuga:1,riposo:3},power:1.05,speed:1.8,endurance:.8,shadow:"pesce",color:"#d6b46a",dark:"#8a6a2c",
  note:"Il compagno di tutte le mattine: abbocca a tutto e si arrende presto."}),
 S({id:"carpa",name:"Carpa",latin:"Cyprinus carpio",spots:["lago"],rarity:"noncomune",len:[35,92],k:.016,price:4,depth:[1,5],hours:[[5,11],[16,24]],peak:[[19,23]],
  baits:{mais:1,pane:.5,bigattini:.35},style:{tira:5,fuga:2,riposo:2,tana:1},power:1.3,speed:2.4,endurance:1.7,shadow:"pesce",color:"#c9a35a",dark:"#7a5a26",pref:["pioggia"],
  note:"Tira dritta e senza fretta. Con la lenza sottile serve la frizione morbida."}),
 S({id:"spigola",name:"Spigola",latin:"Dicentrarchus labrax",spots:["lago","porto","scogli"],rarity:"noncomune",len:[20,82],k:.0105,price:18,depth:[.4,12],hours:[[4,9],[17,24]],peak:[[5,7],[19,21]],
  baits:{gamberetto:.9,verme:.8,vivo:1,minnow:.9,bigattini:.2},style:{tira:2,fuga:3,salto:2,riposo:1},power:1.6,speed:4,endurance:1.2,shadow:"pesce",color:"#c8d6dc",dark:"#56707e",min:25,pref:["pioggia","vento"],
  note:"La regina delle mareggiate: scuote la testa nei salti per liberarsi dall'amo."}),
 S({id:"orata",name:"Orata",latin:"Sparus aurata",spots:["lago","porto","scogli"],rarity:"noncomune",len:[16,62],k:.017,price:14,depth:[.8,14],hours:[[7,19]],peak:[[9,12]],
  baits:{cozza:1,verme:.8,gamberetto:.7,granchio:.6,mais:.15},style:{tira:3,fuga:3,tana:1,riposo:1},power:1.8,speed:3.5,endurance:1.3,shadow:"pesce",color:"#e5dcb8",dark:"#8e8461",min:20,pref:["sereno"],
  note:"Il sopracciglio d'oro. Rompe cozze e granchi, e anche le lenze troppo tirate."}),
 S({id:"persico",name:"Persico trota",latin:"Micropterus salmoides",spots:["lago"],rarity:"noncomune",len:[15,56],k:.014,price:8,depth:[.4,3.5],hours:[[6,11],[16,21]],
  baits:{minnow:1,cucchiaino:.9,verme:.45},style:{salto:3,fuga:2,tira:2,riposo:1},power:1.5,speed:3.6,endurance:1,shadow:"pesce",color:"#9fbf72",dark:"#4c6a33",
  note:"Attacca le esche artificiali in movimento e salta come un pazzo."}),
 S({id:"anguilla",name:"Anguilla",latin:"Anguilla anguilla",spots:["lago"],rarity:"raro",len:[35,100],k:.0015,price:0,depth:[.8,5],hours:[[20,24],[0,5]],
  baits:{verme:1,bigattini:.5,sardina:.5},style:{tana:4,tira:3,riposo:1},power:2,speed:2.2,endurance:1.4,shadow:"lungo",color:"#6f7a4e",dark:"#3b4229",protected:true,pref:["pioggia"],
  note:"Specie protetta: si fotografa e si rimette in acqua. Di notte cerca il fondo e le tane."}),
 S({id:"pesce_oro",name:"Pesce d'oro",latin:"Carassius auratus (leggenda di lago)",spots:["lago"],rarity:"epico",len:[18,40],k:.02,price:60,depth:[.4,3],hours:[[5,8]],
  baits:{pane:.8,mais:.8,bigattini:.6},style:{salto:2,fuga:2,tira:2,riposo:2},power:1.5,speed:3.4,endurance:1,shadow:"pesce",color:"#ffd55e",dark:"#ec8a30",shimmer:true,
  note:"Si mostra solo all'alba. Dicono porti fortuna a chi lo libera."}),
 S({id:"capitone",name:"Il Capitone Antico",latin:"Anguilla anguilla (esemplare leggendario)",spots:["lago"],rarity:"leggendario",len:[132,150],k:.0018,price:0,depth:[2,5],hours:[[22,24],[0,4]],only:["pioggia","nebbia"],
  baits:{sardina:1,verme:.8},style:{tana:5,tira:3,fuga:1},power:3.4,speed:2.5,endurance:2.6,shadow:"lungo",color:"#4f5a35",dark:"#232a16",protected:true,
  note:"Ha visto cento Natali senza finire in pentola. Esce nelle notti di pioggia o di nebbia, dopo le dieci, e vuole una sardina sul fondo.",
  legend:"«Nelle notti di pioggia, dopo le dieci, il vecchio Capitone sale dal fondo del lago. Sardina sul fondo e lanterna accesa.»"}),
 // --- Porto di Pozzuoli
 S({id:"sardina",name:"Sardina",latin:"Sardina pilchardus",spots:["porto","golfo"],rarity:"comune",len:[9,21],k:.008,price:8,depth:[0,40],hours:[[5,21]],peak:[[5,8],[18,20]],
  baits:{bigattini:1,pane:.3},style:{fuga:3,tira:3},power:1.2,speed:3,endurance:.5,shadow:"pesce",color:"#a8d8ea",dark:"#3d7d9b",min:11,school:true,
  note:"Arriva a branchi: quando i gabbiani si tuffano, è il momento."}),
 S({id:"boga",name:"Boga",latin:"Boops boops",spots:["porto"],rarity:"comune",len:[12,30],k:.009,price:5,depth:[1,14],hours:[[6,20]],
  baits:{bigattini:.9,pane:.5,verme:.4},style:{tira:3,fuga:2},power:1.1,speed:2.6,endurance:.6,shadow:"pesce",color:"#c8d8a8",dark:"#6a7d45",school:true,
  note:"Occhioni grandi e tanta fame. Perfetta per imparare la ferrata."}),
 S({id:"occhiata",name:"Occhiata",latin:"Oblada melanura",spots:["porto","scogli"],rarity:"comune",len:[15,32],k:.014,price:10,depth:[1,10],hours:[[6,20]],peak:[[17,20]],
  baits:{pane:.9,bigattini:.8},style:{fuga:3,tira:3,salto:1},power:1.4,speed:3.4,endurance:.8,shadow:"pesce",color:"#cfd9de",dark:"#4b5a62",
  note:"Ha una macchia nera sulla coda e la bocca delicata: non strappare."}),
 S({id:"sarago",name:"Sarago maggiore",latin:"Diplodus sargus",spots:["porto","scogli"],rarity:"noncomune",len:[18,45],k:.02,price:16,depth:[1,16],hours:[[5,21]],peak:[[5,8],[18,21]],
  baits:{cozza:1,gamberetto:.8,verme:.8,granchio:.7},style:{tana:3,tira:3,fuga:2,riposo:1},power:1.9,speed:3.3,endurance:1.3,shadow:"pesce",color:"#d9dccf",dark:"#5c6153",min:23,pref:["vento"],
  note:"Ama il mare mosso. Appena allenti, corre a infilarsi tra le rocce."}),
 S({id:"seppia",name:"Seppia",latin:"Sepia officinalis",spots:["porto"],rarity:"noncomune",len:[10,30],k:.07,price:14,depth:[2,14],hours:[[18,24],[0,6]],peak:[[19,22]],
  baits:{jig:1,gamberetto:.6},style:{tira:5,riposo:3},power:1,speed:1.2,endurance:.8,shadow:"tentacoli",color:"#d9c6a5",dark:"#7d6447",
  note:"Non salta e non scappa: pesa e si appende. Con la totanara, di sera."}),
 S({id:"calamaro",name:"Calamaro",latin:"Loligo vulgaris",spots:["porto","golfo"],rarity:"raro",len:[10,40],k:.022,price:22,depth:[3,60],hours:[[19,24],[0,5]],
  baits:{jig:1,sardina:.3},style:{fuga:3,tira:3,riposo:1},power:1.3,speed:4,endurance:.8,shadow:"tentacoli",color:"#f0d0c8",dark:"#a0645a",
  note:"Sale sotto le luci del porto. Scatta all'indietro come una freccia."}),
 S({id:"murena",name:"Murena",latin:"Muraena helena",spots:["porto","scogli"],rarity:"raro",len:[60,140],k:.0035,price:6,depth:[3,25],hours:[[19,24],[0,6]],
  baits:{sardina:1,calamaro:.9},style:{tana:6,tira:3},power:2.3,speed:2,endurance:1.6,shadow:"lungo",color:"#7d6a3a",dark:"#3d311a",
  note:"Se la lasci tornare in tana, la lenza finisce tagliata sugli scogli."}),
 S({id:"grongo",name:"Il Grongo del Rione Terra",latin:"Conger conger (esemplare leggendario)",spots:["porto"],rarity:"leggendario",len:[185,220],k:.0028,price:12,depth:[8,15],hours:[[22,24],[0,3]],only:["nuvoloso","nebbia","pioggia"],
  baits:{calamaro:1,sardina:.8},style:{tana:6,tira:3,fuga:1},power:2.1,speed:2.2,endurance:3,shadow:"lungo",color:"#5a5f66",dark:"#24272b",
  note:"Vive tra i resti romani sotto il molo. Esce solo di notte, col cielo coperto.",
  legend:"«Sotto il Rione Terra, tra le colonne affondate, dorme un grongo lungo come una barca. Calamaro, notte fonda e cielo senza stelle.»"}),
 // --- Scogli di Posillipo
 S({id:"donzella",name:"Donzella",latin:"Coris julis",spots:["scogli"],rarity:"comune",len:[8,20],k:.009,price:3,depth:[1,16],hours:[[7,19]],
  baits:{bigattini:1,verme:.9,gamberetto:.6,cozza:.5},style:{fuga:3,tira:3},power:1,speed:2.8,endurance:.4,shadow:"pesce",color:"#f2a05b",dark:"#3f8f86",thief:.22,nibbles:[2,5],
  note:"Colorata e ladra: ti spolpa l'amo a forza di piccoli morsi."}),
 S({id:"sarago_fasciato",name:"Sarago fasciato",latin:"Diplodus vulgaris",spots:["scogli"],rarity:"comune",len:[12,30],k:.022,price:12,depth:[1,12],hours:[[5,21]],
  baits:{cozza:.9,bigattini:.7,verme:.8},style:{tana:2,tira:3,fuga:2},power:1.7,speed:3,endurance:.9,shadow:"pesce",color:"#d0d0c0",dark:"#3e3e36",min:18,
  note:"Due bande nere e tanta grinta per la sua taglia."}),
 S({id:"polpo",name:"Polpo",latin:"Octopus vulgaris",spots:["scogli","porto"],rarity:"noncomune",len:[30,110],k:.004,price:15,depth:[2,26],hours:[[0,24]],peak:[[5,9]],
  baits:{granchio:1,jig:.8,sardina:.5},style:{tana:7,tira:3},power:1.6,speed:1,endurance:1.4,shadow:"tentacoli",color:"#c98a6b",dark:"#7a4630",
  note:"Non combatte: si attacca allo scoglio. Tieni la lenza in tiro o resta lì."}),
 S({id:"scorfano",name:"Scorfano rosso",latin:"Scorpaena scrofa",spots:["scogli"],rarity:"noncomune",len:[15,50],k:.022,price:25,depth:[5,26],hours:[[18,24],[0,7]],
  baits:{sardina:1,calamaro:.8,gamberetto:.6},style:{tana:4,tira:3},power:1.6,speed:1.8,endurance:.9,shadow:"pesce",color:"#e06a4e",dark:"#8a2e1e",
  note:"Il re della zuppa. Spine velenose: si prende col guadino."}),
 S({id:"dentice",name:"Dentice",latin:"Dentex dentex",spots:["scogli","golfo"],rarity:"raro",len:[25,92],k:.014,price:28,depth:[10,60],hours:[[5,10],[16,20]],peak:[[5,7]],
  baits:{vivo:1,calamaro:.9,jig:.7,minnow:.6},style:{fuga:4,tira:3,tana:1,riposo:1},power:2.1,speed:4.5,endurance:1.6,shadow:"pesce",color:"#e8b5a8",dark:"#9a5a62",min:25,
  note:"Predatore dell'alba. La prima fuga è violenta: lascia lavorare la frizione."}),
 S({id:"cernia",name:"Cernia bruna",latin:"Epinephelus marginatus",spots:["scogli"],rarity:"raro",len:[42,120],k:.016,price:30,depth:[12,26],hours:[[5,20]],
  baits:{vivo:1,calamaro:.9,sardina:.6},style:{tana:7,tira:3,fuga:1},power:2.2,speed:2.6,endurance:2,shadow:"pesce",color:"#8a6a4a",dark:"#3d2b1c",min:45,
  note:"Appena sente l'amo torna nella sua grotta. Bisogna staccarla dal fondo subito."}),
 S({id:"re_saraghi",name:"Il Re dei Saraghi",latin:"Diplodus sargus (esemplare leggendario)",spots:["scogli"],rarity:"leggendario",len:[55,62],k:.022,price:40,depth:[2,12],hours:[[5,21]],only:["burrasca"],
  baits:{cozza:1,granchio:.9},style:{tana:4,fuga:3,tira:2},power:3.8,speed:4,endurance:2.4,shadow:"pesce",color:"#eef0e0",dark:"#4a4f3c",
  note:"Compare solo con la burrasca, quando nessuno ha il coraggio di stare sugli scogli.",
  legend:"«Quando il mare di Posillipo diventa bianco di schiuma, il Re dei Saraghi esce dalla sua corona di scogli. Una cozza, e tanto coraggio.»"}),
 // --- Golfo, al largo
 S({id:"sgombro",name:"Sgombro",latin:"Scomber scombrus",spots:["golfo"],rarity:"comune",len:[18,40],k:.009,price:9,depth:[0,60],hours:[[5,20]],
  baits:{cucchiaino:1,sardina:.8,bigattini:.4},style:{fuga:4,tira:3},power:1.5,speed:4.2,endurance:.8,shadow:"pesce",color:"#7fb9c9",dark:"#1f4f62",school:true,
  note:"Strisce tigrate e branchi enormi. Abbocca al cucchiaino in recupero."}),
 S({id:"palamita",name:"Palamita",latin:"Sarda sarda",spots:["golfo"],rarity:"noncomune",len:[40,80],k:.012,price:10,depth:[0,60],hours:[[5,11],[16,20]],
  baits:{minnow:1,cucchiaino:.8,vivo:.7},style:{fuga:5,tira:2,riposo:1},power:2,speed:5.5,endurance:1.4,shadow:"pesce",color:"#9fb8d0",dark:"#2d4560",school:true,
  note:"Un piccolo tonno: parte a razzo e non si ferma più."}),
 S({id:"lampuga",name:"Lampuga",latin:"Coryphaena hippurus",spots:["golfo"],rarity:"noncomune",len:[40,120],k:.008,price:12,depth:[0,30],hours:[[7,18]],pref:["sereno"],
  baits:{minnow:1,vivo:.8,cucchiaino:.7},style:{salto:4,fuga:3,tira:2},power:1.9,speed:5,endurance:1.3,shadow:"pesce",color:"#c9d65a",dark:"#2f8a7a",
  note:"Verde e oro, acrobata: salta più di quanto nuoti."}),
 S({id:"ricciola",name:"Ricciola",latin:"Seriola dumerili",spots:["golfo"],rarity:"raro",len:[60,160],k:.011,price:20,depth:[20,100],hours:[[5,11],[16,21]],peak:[[5,8]],
  baits:{vivo:1,jig:.9,calamaro:.6},style:{fuga:4,tana:3,tira:3},power:2.3,speed:5,endurance:2,shadow:"pinna",color:"#d8d0a0",dark:"#6a6440",
  note:"Picchia verso il fondo e cerca la secca per tagliare il filo."}),
 S({id:"pesce_spada",name:"Pesce spada",latin:"Xiphias gladius",spots:["golfo"],rarity:"epico",len:[120,260],k:.006,price:25,depth:[20,200],hours:[[20,24],[0,5]],
  baits:{calamaro:1,sardina:.5},style:{salto:4,fuga:4,tira:2},power:1.9,speed:6,endurance:2.4,shadow:"pinna",color:"#a8b8d0",dark:"#3a4660",min:100,
  note:"Di notte sale a caccia di calamari. Ogni salto è un terremoto."}),
 S({id:"ricciola_fantasma",name:"La Ricciola Fantasma",latin:"Seriola dumerili (esemplare leggendario)",spots:["golfo"],rarity:"leggendario",len:[170,190],k:.011,price:30,depth:[30,100],hours:[[18,24],[0,6]],only:["nebbia"],
  baits:{vivo:1,jig:.8},style:{fuga:4,tana:4,tira:2},power:2.3,speed:5.5,endurance:3,shadow:"pinna",color:"#e8f0f0",dark:"#8aa0a8",
  note:"Pallida come la nebbia da cui esce. Chi l'ha vista non è mai riuscito a provarlo.",
  legend:"«Nella nebbia della sera, sopra la secca, passa un'ombra bianca lunga quasi due metri. Esca viva, e non perderla di vista.»"}),
 S({id:"tonno_capri",name:"Il Tonno di Capri",latin:"Thunnus thynnus (esemplare leggendario)",spots:["golfo"],rarity:"leggendario",len:[220,260],k:.019,price:0,depth:[0,200],hours:[[5,8]],only:["sereno"],
  baits:{vivo:1,minnow:.4},style:{fuga:6,tira:3,riposo:1},power:1.5,speed:7,endurance:3.2,shadow:"pinna",color:"#5a6a8a",dark:"#1a2236",protected:true,
  note:"Tonno rosso: si combatte, si fotografa e si libera. Serve il trecciato, e tanta pazienza.",
  legend:"«All'alba, col mare a specchio davanti ai Faraglioni, passa il Tonno di Capri. Il trecciato regge, il braccio no.»"})
];
const SPECIES_BY_ID=Object.fromEntries(SPECIES.map(s=>[s.id,s]));

/* Oggetti che si possono pescare al posto di un pesce. */
const ITEMS=[
 {id:"lattina",name:"Lattina",kind:"rifiuto",weight:.05,value:0,karma:1,spots:null,chance:30},
 {id:"busta",name:"Busta di plastica",kind:"rifiuto",weight:.02,value:0,karma:1,spots:null,chance:28},
 {id:"scarpa",name:"Scarpa spaiata",kind:"rifiuto",weight:.6,value:0,karma:1,spots:null,chance:16},
 {id:"ciabatta",name:"Ciabatta da mare",kind:"rifiuto",weight:.2,value:0,karma:1,spots:["porto","scogli","golfo"],chance:12},
 {id:"bottiglia",name:"Bottiglia con messaggio",kind:"tesoro",weight:.5,value:5,karma:0,spots:null,chance:7},
 {id:"moneta",name:"Moneta antica",kind:"tesoro",weight:.01,value:40,karma:0,spots:["porto","scogli"],chance:5},
 {id:"anfora",name:"Anfora romana",kind:"tesoro",weight:6,value:250,karma:0,spots:["porto"],minDepth:8,chance:2}
];
const ITEMS_BY_ID=Object.fromEntries(ITEMS.map(i=>[i.id,i]));

/* Esche: naturali (attesa, assaggi) o artificiali (recupero lento, attacco secco). */
const BAITS={
 pane:{id:"pane",name:"Pane",pack:10,price:1,kind:"naturale",scent:.9,hint:"Cefali, carassi e occhiate ci vanno matti."},
 mais:{id:"mais",name:"Mais",pack:10,price:1,kind:"naturale",scent:.9,hint:"Il preferito delle carpe."},
 bigattini:{id:"bigattini",name:"Bigattini",pack:20,price:3,kind:"naturale",scent:1,hint:"Piccoli e universali: piacciono a quasi tutti i pesci piccoli."},
 verme:{id:"verme",name:"Verme di mare",pack:10,price:4,kind:"naturale",scent:1.1,hint:"Orate, spigole, saraghi e, di notte, anguille."},
 cozza:{id:"cozza",name:"Cozza",pack:10,price:3,kind:"naturale",scent:1,hint:"Orate e saraghi la rompono volentieri."},
 gamberetto:{id:"gamberetto",name:"Gamberetto",pack:10,price:5,kind:"naturale",scent:1.1,hint:"Spigole, orate, saraghi e seppie."},
 granchio:{id:"granchio",name:"Granchio",pack:6,price:5,kind:"naturale",scent:1,hint:"Il pasto preferito del polpo."},
 sardina:{id:"sardina",name:"Sardina da esca",pack:10,price:6,kind:"naturale",scent:1.35,hint:"Per murene, scorfani e predatori di fondo."},
 calamaro:{id:"calamaro",name:"Calamaro da esca",pack:6,price:8,kind:"naturale",scent:1.3,hint:"Dentici, cernie, murene e pesce spada."},
 vivo:{id:"vivo",name:"Esca viva",pack:4,price:12,kind:"naturale",scent:1.5,hint:"L'esca dei grandi predatori: ricciole, dentici, cernie."},
 cucchiaino:{id:"cucchiaino",name:"Cucchiaino",pack:1,price:18,kind:"artificiale",scent:1.1,hint:"Luccica in recupero: sgombri e persici."},
 minnow:{id:"minnow",name:"Minnow",pack:1,price:35,kind:"artificiale",scent:1.25,hint:"Pesciolino finto per spigole, palamite e lampughe."},
 jig:{id:"jig",name:"Jig / totanara",pack:1,price:30,kind:"artificiale",scent:1.2,hint:"Per seppie e calamari la sera, e per i predatori di fondo."}
};
const BAIT_ORDER=["pane","mais","bigattini","verme","cozza","gamberetto","granchio","sardina","calamaro","vivo","cucchiaino","minnow","jig"];

/* Attrezzatura. rep = fama necessaria per comprarla. */
const GEAR={
 rod:[
  {id:"bambu",name:"Canna di bambù",price:0,range:18,flex:7,rep:0,desc:"Quella del nonno. Corta e rigida: i colpi arrivano tutti sulla lenza."},
  {id:"bolognese",name:"Bolognese 5 m",price:90,range:24,flex:5.6,rep:0,desc:"Lancia più lontano e assorbe meglio le fughe."},
  {id:"spinning",name:"Spinning in carbonio",price:260,range:30,flex:4.6,rep:1,desc:"Leggera e nervosa: arriva sulle acque profonde."},
  {id:"traina",name:"Canna da traina Pro",price:750,range:35,flex:3.8,rep:3,desc:"Per i giganti del Golfo. Morbida come una frusta."}
 ],
 reel:[
  {id:"vecchio",name:"Mulinello arrugginito",price:0,speed:2.6,rep:0,desc:"Gira, più o meno."},
  {id:"frontale",name:"Mulinello frontale",price:70,speed:3.3,rep:0,desc:"Recupero più rapido e frizione fluida."},
  {id:"rotante",name:"Mulinello rotante Pro",price:320,speed:4.2,rep:2,desc:"Recupera come un argano."}
 ],
 line:[
  {id:"nylon20",name:"Nylon 0,20",price:0,limit:4,spool:120,rep:0,desc:"Regge circa 4 kg di tiro."},
  {id:"nylon30",name:"Nylon 0,30",price:25,limit:7,spool:150,rep:0,desc:"Regge circa 7 kg di tiro."},
  {id:"fluoro40",name:"Fluorocarbon 0,40",price:80,limit:12,spool:180,rep:1,desc:"Invisibile in acqua, regge 12 kg."},
  {id:"trecciato",name:"Trecciato PE 4",price:220,limit:30,spool:300,rep:3,desc:"Regge 30 kg e la bobina è lunghissima."}
 ],
 cooler:[
  {id:"secchio",name:"Secchio",price:0,capacity:8,decay:9,rep:0,desc:"8 kg. Senza ghiaccio il pesce perde freschezza in fretta."},
  {id:"borsa",name:"Borsa termica",price:45,capacity:20,decay:6,rep:0,desc:"20 kg, un po' di ghiaccio."},
  {id:"ghiacciaia",name:"Ghiacciaia",price:160,capacity:60,decay:3.5,rep:1,desc:"60 kg e pesce fresco fino a sera."},
  {id:"frigo",name:"Frigo di bordo",price:520,capacity:250,decay:1.5,rep:3,desc:"250 kg: anche per un tonno (se fosse legale)."}
 ]
};
const EXTRAS={
 guadino:{id:"guadino",name:"Guadino",price:50,rep:0,desc:"A fine combattimento il pesce si prende anche se non è del tutto stanco."},
 lanterna:{id:"lanterna",name:"Lanterna",price:60,rep:0,desc:"Si pesca fino a mezzanotte: arrivano le specie notturne."},
 ecoscandaglio:{id:"ecoscandaglio",name:"Ecoscandaglio",price:240,rep:1,desc:"Mostra profondità esatta e nome di ogni ombra."},
 cumana:{id:"cumana",name:"Abbonamento Cumana",price:35,rep:0,desc:"Il trenino per Pozzuoli: sblocca il Porto.",unlocks:"porto"},
 scooter:{id:"scooter",name:"Scooter riparato",price:150,rep:1,desc:"Lo scooter bordeaux di Scootercross torna in strada: sblocca gli Scogli di Posillipo.",unlocks:"scogli"},
 gozzo:{id:"gozzo",name:"Gozzo a motore",price:1200,rep:3,desc:"Una barchetta tutta tua: sblocca il Golfo, al largo.",unlocks:"golfo"}
};
const DRAG={morbida:{label:"Morbida",factor:.55},media:{label:"Media",factor:.72},dura:{label:"Dura",factor:.88}};
const REP_LEVELS=[0,3,8,16,30];

const WEATHER={
 sereno:{id:"sereno",label:"Sereno",icon:"☀️",chance:34,bite:1,wind:0},
 nuvoloso:{id:"nuvoloso",label:"Nuvoloso",icon:"☁️",chance:24,bite:1.15,wind:.3},
 vento:{id:"vento",label:"Vento",icon:"🌬️",chance:14,bite:1.1,wind:1},
 pioggia:{id:"pioggia",label:"Pioggia",icon:"🌧️",chance:14,bite:1.2,wind:.4},
 nebbia:{id:"nebbia",label:"Nebbia",icon:"🌫️",chance:8,bite:1.05,wind:0},
 burrasca:{id:"burrasca",label:"Burrasca",icon:"⛈️",chance:6,bite:.8,wind:2}
};

const NPCS=[
 {id:"teresa",name:"Zi' Teresa",role:"trattoria",line:"Stasera friggo: me li porti tu?"},
 {id:"carmela",name:"Nonna Carmela",role:"nonna",line:"Per il sugo della domenica, mi raccomando freschi."},
 {id:"ciro",name:"Cugino Ciro",role:"pescheria",line:"Al banco mi mancano questi, ti pago bene."},
 {id:"takumi",name:"Chef Takumi",role:"sushi",line:"Per il crudo voglio solo pesce perfetto."},
 {id:"vincenzo",name:"Prof. Vincenzo",role:"ricerca",line:"Mi serve un esemplare per la ricerca. Niente domande!"}
];

const TITLES=[[0,"Principiante del pontile"],[4,"Pescatore della domenica"],[9,"Lupo di lago"],[15,"Capitano di Pozzuoli"],[22,"Squalo di Posillipo"],[28,"Leggenda del Golfo"],[SPECIES.length,"Re del Golfo"]];

/* ---------- utilità ---------- */
function clamp(n,a,b){return Math.max(a,Math.min(b,n));}
function makeRng(seed){let a=(seed>>>0)||1;return function(){a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};}
function pickWeighted(list,weightOf,rand){let total=0;for(const x of list)total+=Math.max(0,weightOf(x));if(total<=0)return null;let n=rand()*total;for(const x of list){n-=Math.max(0,weightOf(x));if(n<0)return x;}return list[list.length-1];}
function inWindows(hour,windows){const h=((hour%24)+24)%24;return (windows||[]).some(w=>h>=w[0]&&h<w[1]);}
function fmtClock(minutes){if(minutes>=1440)return"24:00";const m=Math.floor(minutes)%1440;return String(Math.floor(m/60)).padStart(2,"0")+":"+String(m%60).padStart(2,"0");}
function fmtKg(kg){return kg>=10?kg.toFixed(1).replace(".",",")+" kg":kg>=1?kg.toFixed(2).replace(".",",")+" kg":Math.round(kg*1000)+" g";}
function repLevel(rep){let lv=0;for(let i=0;i<REP_LEVELS.length;i++)if(rep>=REP_LEVELS[i])lv=i;return lv;}
function dayPart(minutes){const h=minutes/60;if(h<5)return"notte";if(h<7)return"alba";if(h<11)return"mattina";if(h<15)return"mezzogiorno";if(h<18)return"pomeriggio";if(h<20.5)return"tramonto";return"notte";}

/* ---------- acqua ---------- */
const SHORE_Y=205,LAKE_H=760;
function featureAt(spotId,x,y){const spot=SPOTS[spotId];for(const f of spot.features){const dx=(x-f.x)/f.rx,dy=(y-f.y)/f.ry;if(dx*dx+dy*dy<=1)return f;}return null;}
function depthAt(spotId,x,y){
 const spot=SPOTS[spotId];const t=clamp((y-SHORE_Y)/(LAKE_H-SHORE_Y),0,1);
 let d=spot.depth[0]+(spot.depth[1]-spot.depth[0])*Math.pow(t,spot.curve);
 for(const f of spot.features){const dx=(x-f.x)/f.rx,dy=(y-f.y)/f.ry,q=dx*dx+dy*dy;if(q<1)d+=f.dd*(1-q);}
 return Math.max(.3,d);
}
function structureNear(spotId,x,y,radius){const spot=SPOTS[spotId];return spot.features.some(f=>f.rock&&Math.hypot((x-f.x)/(f.rx+radius),(y-f.y)/(f.ry+radius))<=1);}

/* ---------- pesci ---------- */
function weatherOk(sp,weather){return !sp.only||sp.only.includes(weather);}
function activity(sp,hour){if(!inWindows(hour,sp.hours))return 0;return inWindows(hour,sp.peak)?1.7:1;}
function depthOk(sp,depth){return depth>=sp.depth[0]*.85&&depth<=sp.depth[1]*1.15;}
/* Quali specie possono comparire in un punto, adesso. ctx = {spot,hour,weather,depth,karma} */
function speciesWeight(sp,ctx){
 if(!sp.spots.includes(ctx.spot)||!weatherOk(sp,ctx.weather))return 0;
 if(ctx.depth!=null&&!depthOk(sp,ctx.depth))return 0;
 const act=activity(sp,ctx.hour);if(!act)return 0;
 let w=RARITY[sp.rarity].weight*act;
 if(sp.pref&&sp.pref.includes(ctx.weather))w*=1.5;
 if(sp.rarity!=="comune")w*=1+Math.min(100,ctx.karma||0)*.006;
 return w;
}
function pickSpecies(ctx,rand){return pickWeighted(SPECIES,sp=>speciesWeight(sp,ctx),rand);}
function weightOfLength(sp,len){return sp.k*Math.pow(len,3)/1000;}
/* Un esemplare concreto: lunghezza, peso, variante Karmagra. */
function rollFish(sp,rand,ctx){
 ctx=ctx||{};
 const legendary=sp.rarity==="leggendario";
 const r=legendary?.4+rand()*.6:Math.pow(rand(),1.7);
 const len=sp.len[0]+(sp.len[1]-sp.len[0])*r;
 const kChance=legendary?0:clamp(.01+(ctx.pity||0)+Math.min(100,ctx.karma||0)*.0015+(ctx.night?.02:0),0,.3);
 const karmagra=!sp.protected&&rand()<kChance;
 return{species:sp.id,len:Math.round(len*10)/10,weight:Math.round(weightOfLength(sp,len)*1000)/1000,karmagra};
}
function fishPower(sp,fish){return sp.power*Math.pow(Math.max(.01,fish.weight),.6)*(fish.karmagra?1.2:1);}
function isUndersize(sp,fish){return !!sp.min&&fish.len<sp.min;}
function baitAffinity(sp,baitId){return (sp.baits&&sp.baits[baitId])||0;}
/* Probabilità al secondo che un'ombra si interessi all'esca. */
function interestRate(sp,ctx){
 const bait=BAITS[ctx.bait];if(!bait)return 0;
 const aff=baitAffinity(sp,ctx.bait);if(!aff)return 0;
 let rate=.32*aff*(activity(sp,ctx.hour)||0)*(WEATHER[ctx.weather]?WEATHER[ctx.weather].bite:1);
 if(sp.pref&&sp.pref.includes(ctx.weather))rate*=1.25;
 if(bait.kind==="artificiale")rate*=ctx.moving?1.7:.12;
 if(ctx.frenzy)rate*=3;
 return rate;
}
function biteWindow(sp){return RARITY[sp.rarity].window*(sp.thief?.85:1);}
function nibbleCount(sp,rand){const r=sp.nibbles||{comune:[0,2],noncomune:[1,3],raro:[1,4],epico:[2,4],leggendario:[2,5]}[sp.rarity];return r[0]+Math.floor(rand()*(r[1]-r[0]+1));}
function rollJunk(spotId,depth,rand){
 const list=ITEMS.filter(i=>(!i.spots||i.spots.includes(spotId))&&(!i.minDepth||depth>=i.minDepth));
 return pickWeighted(list,i=>i.chance,rand);
}

/* ---------- combattimento ----------
 * Tre modi di perdere: lenza spezzata (tensione oltre il carico), bobina vuota
 * (troppo filo ceduto dalla frizione), slamata/tana (lenza lasca o pesce intanato). */
const ACTIONS={
 tira:{label:"TIRA",mult:1,dur:[1.2,2.6],dir:true},
 fuga:{label:"FUGA!",mult:1.75,dur:[.8,1.8],dir:true},
 salto:{label:"SALTO!",mult:.5,dur:[.9,1.2],dir:false},
 riposo:{label:"STANCO",mult:.2,dur:[1,2.2],dir:false},
 tana:{label:"VERSO LA TANA",mult:1.35,dur:[1.5,3],dir:true}
};
function chooseAction(f,rand,force){
 const sp=SPECIES_BY_ID[f.fish.species]||f.junkSpec;
 const style=Object.assign({},sp.style||{tira:1});
 if(!f.structure)delete style.tana;
 if(style.riposo!=null||f.stamina<.6)style.riposo=(style.riposo||.5)*(1+(1-f.stamina)*2.5);
 const keys=Object.keys(style);
 const type=force||pickWeighted(keys,k=>style[k],rand)||"tira";
 const a=ACTIONS[type];
 f.action={type,dir:a.dir?(rand()<.5?-1:1):0,left:a.dur[0]+(a.dur[1]-a.dur[0])*rand(),len:0};
 f.action.len=f.action.left;
 return f.action;
}
/* gear = {rod, reel, line, drag:'media', guadino:bool}. opts = {distance(m), perfect, structure, rand} */
function createFight(fish,gear,opts){
 opts=opts||{};const rand=opts.rand||Math.random;
 const sp=SPECIES_BY_ID[fish.species];
 const junk=!sp?ITEMS_BY_ID[fish.species]:null;
 const power=sp?fishPower(sp,fish):Math.max(.15,(junk?junk.weight:.2)*1.4);
 const f={fish,power,stamina:sp?(opts.perfect?.82:1):.15,endurance:sp?sp.endurance:.3,speed:sp?sp.speed:.5,
  dist:Math.max(3,opts.distance||10),tension:power*.3,slack:0,den:0,time:0,maxRatio:0,slipped:0,correct:0,wrong:0,
  structure:!!opts.structure,outcome:null,reason:"",lateral:0,events:[],
  junkSpec:junk?{style:{tira:1}}:null,
  rod:gear.rod,reel:gear.reel,line:gear.line,dragFactor:(DRAG[gear.drag]||DRAG.media).factor,guadino:!!gear.guadino,perfect:!!opts.perfect};
 chooseAction(f,rand,sp?(sp.style.fuga?"fuga":"tira"):"tira");
 return f;
}
function dragLimit(f){return f.line.limit*f.dragFactor;}
/* input = {reel:boolean, side:-1|0|1}. Restituisce gli eventi del passo. */
function stepFight(f,input,dt,rand){
 rand=rand||Math.random;const ev=[];if(f.outcome)return ev;
 dt=Math.min(dt,.06);f.time+=dt;
 const a=f.action;a.left-=dt;
 if(a.left<=0){const next=chooseAction(f,rand);ev.push({kind:"action",type:next.type,dir:next.dir});}
 const act=ACTIONS[f.action.type],dir=f.action.dir,side=input.side||0,reel=!!input.reel;
 const staminaF=.3+.7*f.stamina;
 const pull=f.power*act.mult*staminaF;
 let sf=1,correct=false;
 if(dir){if(side===-dir){sf=.62;correct=true;}else if(side===dir)sf=1.4;}
 else if(side)sf=1.08;
 if(correct)f.correct+=dt;else if(dir&&side===dir)f.wrong+=dt;
 let target=reel?pull*sf+.45*f.power*staminaF+.2:pull*sf*.75;
 if(reel&&f.action.type==="salto")target*=1.75;
 // La frizione cede filo ma non assorbe gli strappi del tutto (inerzia della bobina):
 // oltre la soglia passa ancora il 35% dell'eccesso.
 const drag=dragLimit(f),excess=target-drag,slipping=excess>0;
 const felt=slipping?drag+excess*.35:target;
 f.tension+=(felt-f.tension)*(1-Math.exp(-dt*f.rod.flex));
 if(slipping){
  const speed=f.speed*clamp(excess/(.25*drag+.1),.15,1.4);
  f.dist+=speed*dt;f.slipped+=speed*dt;
 }else if(reel){
  f.dist-=f.reel.speed*dt*(1-.6*clamp(pull*sf/drag,0,1));
 }
 f.lateral=clamp(f.lateral+(dir*act.mult*.35-side*.22)*dt,-1,1);
 // energia del pesce: cala con la tensione, di più se pieghi la canna dal lato giusto
 let drain=dt*(.01+.045*clamp(f.tension/Math.max(.2,f.power),0,1.5))*(correct?1.5:1)/f.endurance;
 if(f.action.type==="fuga")drain*=1.25;
 if(f.action.type==="riposo"&&f.tension<.35*f.power)drain=-.02*dt;
 f.stamina=clamp(f.stamina-drain,0,1);
 // lenza lasca: durante il riposo bisogna recuperare, altrimenti l'amo scivola via
 const loose=!reel&&(f.action.type==="salto"||f.action.type==="riposo")&&f.tension<Math.max(.12*f.power,.08);
 if(loose)f.slack+=dt;else f.slack=Math.max(0,f.slack-2*dt);
 const slackMax=f.action.type==="salto"?.75:2.2;
 // tana: se la lenza non è più tesa del tiro del pesce, si infila tra le rocce
 if(f.action.type==="tana"&&f.structure){f.den=Math.max(0,f.den+dt*(.55-.45*clamp(f.tension/(pull*sf+.001),0,1.5)));}
 else f.den=Math.max(0,f.den-dt*.12);
 const ratio=f.tension/f.line.limit;f.maxRatio=Math.max(f.maxRatio,ratio);
 if(slipping)ev.push({kind:"drag"});
 if(f.tension>=f.line.limit)return finishFight(f,"lost","snap","LENZA SPEZZATA!",ev);
 if(f.dist>f.line.spool)return finishFight(f,"lost","spool","BOBINA VUOTA: il pesce si è portato via tutto il filo!",ev);
 if(f.slack>slackMax)return finishFight(f,"lost","slack",f.action.type==="salto"?"SLAMATO NEL SALTO!":"LENZA LASCA: SI È SLAMATO!",ev);
 if(f.den>=1)return finishFight(f,"lost","den","SI È INTANATO: lenza tagliata sulle rocce!",ev);
 if(f.time>120+40*f.endurance)return finishFight(f,"lost","timeout","SI È LIBERATO DOPO UNA LUNGA LOTTA",ev);
 if(f.dist<=2){
  const land=f.guadino?.5:.28;
  if(f.stamina<=land||f.junkSpec)return finishFight(f,"caught","landed","PRESO!",ev);
  f.dist=6;chooseAction(f,rand,"fuga");ev.push({kind:"action",type:"fuga",dir:f.action.dir,last:true});
 }
 return ev;
}
function finishFight(f,outcome,reason,message,ev){f.outcome=outcome;f.reason=reason;f.message=message;ev.push({kind:outcome,reason,message});return ev;}
/* Qualità 1-3 stelle: ferrata perfetta, nessun rischio di rottura, canna dal lato giusto. */
function fightQuality(f){
 let q=1;if(f.perfect)q++;
 const sideScore=f.correct/Math.max(.01,f.correct+f.wrong);
 if(f.maxRatio<.9&&sideScore>.55)q++;
 return clamp(q,1,3);
}
const QUALITY_MULT=[1,1,1.25,1.5];

/* ---------- economia ---------- */
function fishValue(item){
 const sp=SPECIES_BY_ID[item.species];
 if(!sp){const it=ITEMS_BY_ID[item.species];return it?it.value:0;}
 if(sp.protected)return 0;
 const fresh=item.freshness==null?100:item.freshness;
 return Math.round(sp.price*item.weight*(QUALITY_MULT[item.quality||1])*(item.karmagra?3:1)*(.45+.55*fresh/100)*100)/100;
}
function arcadePoints(item,combo){
 const sp=SPECIES_BY_ID[item.species];
 let base=sp?Math.max(20,Math.round(sp.price*item.weight*10)):10;
 if(sp&&sp.rarity==="epico")base=Math.max(base,500);
 if(sp&&sp.rarity==="leggendario")base=Math.max(base,1500);
 return Math.round(base*QUALITY_MULT[item.quality||1]*(item.karmagra?3:1))+Math.min(combo,5)*25;
}
function gearOf(career,slot){return GEAR[slot].find(g=>g.id===career.equip[slot])||GEAR[slot][0];}
function coolerLoad(career){return career.cooler.reduce((s,i)=>s+(i.weight||0),0);}
function coolerSpace(career){return gearOf(career,"cooler").capacity-coolerLoad(career);}
function ageCooler(career,minutes){const decay=gearOf(career,"cooler").decay;for(const it of career.cooler)if(SPECIES_BY_ID[it.species])it.freshness=Math.max(0,(it.freshness==null?100:it.freshness)-decay*minutes/60);}
function owns(career,id){
 for(const slot of Object.keys(GEAR))if(GEAR[slot].some(g=>g.id===id))return career.owned[slot].includes(id);
 return career.extras.includes(id);
}
function shopItem(id){
 for(const slot of Object.keys(GEAR)){const g=GEAR[slot].find(x=>x.id===id);if(g)return{slot,item:g};}
 if(EXTRAS[id])return{slot:"extra",item:EXTRAS[id]};
 if(BAITS[id])return{slot:"bait",item:BAITS[id]};
 return null;
}
function canBuy(career,id){
 const s=shopItem(id);if(!s)return{ok:false,why:"Articolo sconosciuto"};
 if(s.slot!=="bait"&&owns(career,id))return{ok:false,why:"Ce l'hai già"};
 if(repLevel(career.rep)<(s.item.rep||0))return{ok:false,why:"Serve fama "+(s.item.rep||0)};
 if(career.money<s.item.price)return{ok:false,why:"Soldi insufficienti"};
 return{ok:true};
}
function buy(career,id){
 const c=canBuy(career,id);if(!c.ok)return c;
 const s=shopItem(id);career.money=Math.round((career.money-s.item.price)*100)/100;
 if(s.slot==="bait"){career.baits[id]=(career.baits[id]||0)+s.item.pack;}
 else if(s.slot==="extra"){career.extras.push(id);}
 else{career.owned[s.slot].push(id);career.equip[s.slot]=id;}
 career.stats.spent+=s.item.price;
 return{ok:true};
}
function spotUnlocked(career,spotId){const u=SPOTS[spotId].unlock;return !u||career.extras.includes(u);}
function dayEnd(career){return career.extras.includes("lanterna")?NIGHT_END:DAY_END;}

/* ---------- Pescepedia ---------- */
function recordCatch(career,item){
 const e=career.dex[item.species]||(career.dex[item.species]={count:0,best:0,bestLen:0,first:career.day,karmagra:false});
 const isNew=e.count===0;e.count++;
 const record=item.weight>e.best;if(record){e.best=item.weight;e.bestLen=item.len;}
 if(item.karmagra)e.karmagra=true;
 return{isNew,record:record&&!isNew};
}
function dexCount(career){return SPECIES.filter(s=>career.dex[s.id]&&career.dex[s.id].count>0).length;}
function titleOf(career){const n=dexCount(career);let t=TITLES[0][1];for(const [min,label] of TITLES)if(n>=min)t=label;return t;}
function legendsCaught(career){return SPECIES.filter(s=>s.rarity==="leggendario"&&career.dex[s.id]&&career.dex[s.id].count>0).length;}

/* ---------- commissioni ---------- */
function makeOrder(career,rand){
 const spots=SPOT_ORDER.filter(s=>spotUnlocked(career,s));
 const lv=repLevel(career.rep);
 const pool=SPECIES.filter(s=>!s.protected&&s.rarity!=="leggendario"&&s.rarity!=="epico"&&s.spots.some(x=>spots.includes(x))&&(s.rarity!=="raro"||lv>=1));
 const sp=pool[Math.floor(rand()*pool.length)];if(!sp)return null;
 const count=sp.rarity==="comune"?2+Math.floor(rand()*2):sp.rarity==="noncomune"?1+Math.floor(rand()*2):1;
 const lenQ=sp.min?Math.max(sp.min,sp.len[0]+(sp.len[1]-sp.len[0])*(.15+rand()*.25)):sp.len[0]+(sp.len[1]-sp.len[0])*(.1+rand()*.3);
 const minWeight=Math.round(weightOfLength(sp,lenQ)*100)/100;
 const est=sp.price*Math.max(minWeight,weightOfLength(sp,(lenQ+sp.len[1])/2)*.8);
 const npc=NPCS[Math.floor(rand()*NPCS.length)];
 return{id:"o"+career.day+"-"+Math.floor(rand()*1e6),npc:npc.id,species:sp.id,count,minWeight,
  reward:Math.ceil(est*count*1.7+6),rep:sp.rarity==="raro"?3:sp.rarity==="noncomune"?2:1,expires:career.day+2,done:false};
}
function orderMatches(order,item){const sp=SPECIES_BY_ID[item.species];return !!sp&&item.species===order.species&&item.weight>=order.minWeight&&(item.freshness==null||item.freshness>=50)&&!isUndersize(sp,item);}
function deliverOrder(career,orderId){
 const o=career.orders.find(x=>x.id===orderId);if(!o||o.done)return{ok:false,why:"Commissione non disponibile"};
 const ok=career.cooler.filter(i=>orderMatches(o,i));
 if(ok.length<o.count)return{ok:false,why:"Mancano "+(o.count-ok.length)+" pezzi adatti"};
 ok.sort((a,b)=>a.weight-b.weight);
 const used=ok.slice(0,o.count);
 career.cooler=career.cooler.filter(i=>!used.includes(i));
 career.money=Math.round((career.money+o.reward)*100)/100;career.rep+=o.rep;o.done=true;
 career.stats.orders++;career.stats.earned+=o.reward;
 return{ok:true,reward:o.reward,rep:o.rep};
}

/* ---------- vendita, giornate, salvataggi ---------- */
function sellCooler(career,filter){
 let total=0,count=0;const keep=[];
 for(const it of career.cooler){
  const sp=SPECIES_BY_ID[it.species];
  if(filter&&!filter(it)){keep.push(it);continue;}
  if(sp&&isUndersize(sp,it)){keep.push(it);continue;}
  const v=fishValue(it);total+=v;count++;
 }
 career.cooler=keep;total=Math.round(total*100)/100;
 career.money=Math.round((career.money+total)*100)/100;career.stats.earned+=total;
 return{total,count};
}
function rollWeather(rand){return pickWeighted(Object.values(WEATHER),w=>w.chance,rand).id;}
function newCareer(seed){
 const rand=makeRng(seed||Date.now());
 const c={v:1,seed:(seed||Date.now())>>>0,day:1,minute:DAY_START,money:30,rep:0,karma:0,pity:0,spot:"lago",drag:"media",
  owned:{rod:["bambu"],reel:["vecchio"],line:["nylon20"],cooler:["secchio"]},equip:{rod:"bambu",reel:"vecchio",line:"nylon20",cooler:"secchio"},
  extras:[],baits:{pane:15,bigattini:20},bait:"pane",cooler:[],dex:{},collection:{},orders:[],legendHints:[],
  weather:"sereno",forecast:rollWeather(rand),stats:{casts:0,catches:0,lost:0,released:0,earned:0,spent:0,orders:0,fines:0,days:0}};
 c.orders=[makeOrder(c,rand),makeOrder(c,rand)].filter(Boolean);
 return c;
}
/* Nuova giornata: il meteo previsto diventa vero (quasi sempre), nuove commissioni. */
function startDay(career,rand){
 career.day++;career.minute=DAY_START;career.stats.days++;
 career.weather=rand()<.8?career.forecast:rollWeather(rand);
 career.forecast=rollWeather(rand);
 if(career.weather==="burrasca"&&career.spot==="golfo")career.spot="porto";
 career.orders=career.orders.filter(o=>!o.done&&o.expires>=career.day);
 while(career.orders.length<3){const o=makeOrder(career,rand);if(!o)break;career.orders.push(o);}
 return career;
}
/* Fine giornata: controllo della Guardia Costiera sul pescato sotto misura, poi vendita alla pescheria. */
function endDay(career,rand){
 const report={fined:0,fine:0,sold:0,soldCount:0,inspected:false};
 const under=career.cooler.filter(i=>{const sp=SPECIES_BY_ID[i.species];return sp&&isUndersize(sp,i);});
 if(under.length&&rand()<.4){
  report.inspected=true;report.fined=under.length;report.fine=under.length*30;
  career.money=Math.round((career.money-report.fine)*100)/100;career.stats.fines+=report.fine;
  career.cooler=career.cooler.filter(i=>!under.includes(i));career.karma=Math.max(0,career.karma-under.length*2);
 }else if(under.length){career.cooler=career.cooler.filter(i=>!under.includes(i));}
 const sale=sellCooler(career,i=>!!SPECIES_BY_ID[i.species]);
 report.sold=sale.total;report.soldCount=sale.count;
 // gli oggetti di valore vanno al rigattiere, i rifiuti nel bidone
 for(const it of career.cooler.slice()){const def=ITEMS_BY_ID[it.species];if(def){report.sold+=def.value;career.money+=def.value;}}
 career.cooler=career.cooler.filter(i=>SPECIES_BY_ID[i.species]);
 career.money=Math.round(career.money*100)/100;
 return report;
}
function migrateSave(data){
 if(!data||typeof data!=="object"||data.v!==1)return null;
 const base=newCareer(data.seed||1);
 const c=Object.assign(base,data);
 for(const k of ["owned","equip","stats"])c[k]=Object.assign({},base[k],data[k]||{});
 for(const slot of Object.keys(GEAR)){if(!Array.isArray(c.owned[slot])||!c.owned[slot].length)c.owned[slot]=[GEAR[slot][0].id];if(!c.owned[slot].includes(c.equip[slot]))c.equip[slot]=c.owned[slot][0];}
 if(!SPOTS[c.spot]||!spotUnlocked(c,c.spot))c.spot="lago";
 if(!DRAG[c.drag])c.drag="media";
 if(!Array.isArray(c.cooler))c.cooler=[];
 if(!Array.isArray(c.orders))c.orders=[];
 if(!Array.isArray(c.extras))c.extras=[];
 if(!Array.isArray(c.legendHints))c.legendHints=[];
 if(!c.baits||typeof c.baits!=="object")c.baits={};
 if(!c.dex||typeof c.dex!=="object")c.dex={};
 if(!c.collection||typeof c.collection!=="object")c.collection={};
 c.minute=clamp(Number(c.minute)||DAY_START,DAY_START,NIGHT_END);
 return c;
}

root.PESCA_RULES={PX_PER_M,GAME_MIN_PER_SEC,DAY_START,DAY_END,NIGHT_END,SHORE_Y,RARITY,SPOTS,SPOT_ORDER,SPECIES,SPECIES_BY_ID,ITEMS,ITEMS_BY_ID,
 BAITS,BAIT_ORDER,GEAR,EXTRAS,DRAG,REP_LEVELS,WEATHER,NPCS,TITLES,ACTIONS,QUALITY_MULT,
 clamp,makeRng,pickWeighted,inWindows,fmtClock,fmtKg,repLevel,dayPart,
 featureAt,depthAt,structureNear,speciesWeight,pickSpecies,weightOfLength,rollFish,fishPower,isUndersize,baitAffinity,interestRate,biteWindow,nibbleCount,rollJunk,activity,weatherOk,
 createFight,stepFight,dragLimit,fightQuality,fishValue,arcadePoints,gearOf,coolerLoad,coolerSpace,ageCooler,owns,shopItem,canBuy,buy,spotUnlocked,dayEnd,
 recordCatch,dexCount,titleOf,legendsCaught,makeOrder,orderMatches,deliverOrder,sellCooler,rollWeather,newCareer,startDay,endDay,migrateSave};
})(typeof window!=="undefined"?window:globalThis);
