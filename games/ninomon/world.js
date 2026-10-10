/* One source of truth for terrain, solid footprints, portals and street inhabitants. */
(function(root){
'use strict';
const W=35,H=24;
const structure=(id,type,x,y,w,h,label='',extra={})=>({id,type,x,y,w,h,label,...extra});
const zones=[
 {name:'Scalo ferroviario',districts:[{name:'Piazzale dei writer',x:13,y:12,w:11,h:9},{name:'Binario morto',x:1,y:2,w:22,h:10}],structures:[
  structure('cargo_wagon','asset',3,5,10,4,'',{asset:'cargo_wagon'}),
  structure('freight_warehouse','asset',24,3,9,6,'',{asset:'freight_warehouse'}),
  structure('tool_shed','asset',2,18,6,4,'',{asset:'tool_shed'}),
  structure('fence-west','asset',2,11,10,1,'',{asset:'rail_fence_10',overhang:1}),
  structure('fence-east','asset',24,11,8,1,'',{asset:'rail_fence_8',overhang:1}),
  structure('ticket','kiosk',15,3,6,4,'SCALO  /  1984',{color:'#a39475'}),
  structure('wall-yard','wall',11,21,13,1,'NINO  /  CREW'),
  structure('bench-yard','bench',15,12,2,1),structure('pallet','crates',27,20,3,2),
  structure('bin-yard','bin',30,13,2,1),structure('lamp-yard','lamp',22,13,1,1),
  structure('planter-yard','planter',10,18,2,1),structure('paint-yard','paint',12,20,1,1)
 ]},
 {name:'Sottopasso',districts:[{name:'Muro libero',x:2,y:11,w:13,h:10},{name:'Piazza delle casse',x:21,y:11,w:12,h:10}],structures:[
  structure('bridge-wall','wall',2,3,31,2,'SOTTO IL PONTE  /  JAM DEL SABATO'),
  structure('pier-a','pillar',4,8,3,3),structure('pier-b','pillar',17,8,3,3),structure('pier-c','pillar',29,8,3,3),
  structure('mural','wall',3,12,4,1,'FREE WALL'),structure('ramp','ramp',3,19,7,3),
  structure('stage','stage',22,20,8,2,'SESSION'),structure('booth','kiosk',23,6,4,3,'RADIO  FM',{color:'#779597'}),
  structure('benches','bench',13,18,2,1),structure('bridge-bin','bin',30,12,2,1),
  structure('paint-bridge','paint',7,13,1,1),structure('lamp-bridge','lamp',20,13,1,1),
  structure('speaker','speaker',31,20,1,2),structure('planter-bridge','planter',15,5,2,1)
 ]},
 {name:'Vicolo del mercato',districts:[{name:'Mercato rionale',x:2,y:10,w:14,h:11},{name:'Largo delle serrande',x:18,y:9,w:15,h:13}],structures:[
  structure('market','shop',3,3,8,6,'ALIMENTARI',{color:'#b69a7a',awning:'#a95f50'}),
  structure('record-shop','shop',22,3,10,6,'DISCHI  /  SPRAY',{color:'#879c96',awning:'#547b87'}),
  structure('repair','shop',4,18,4,4,'OFFICINA',{color:'#b89d78',awning:'#9c7850'}),
  structure('market-stall','stall',4,12,4,2,'FRUTTA'),structure('news','kiosk',15,5,4,4,'EDICOLA',{color:'#9f847c'}),
  structure('bins','bin',29,20,3,1),structure('scooter','scooter',22,18,2,1),
  structure('bench-market','bench',15,20,2,1),structure('planter-market','planter',12,10,2,1),
  structure('lamp-market','lamp',20,10,1,1),structure('wall-market','wall',22,22,10,1,'IL QUARTIERE VIVE'),
  structure('crates-market','crates',9,20,2,2)
 ]}
];
const trainers=[
 {id:'rail',creature:'n01',zone:0,x:9,y:15,name:'Rame',look:'writer',color:'#bc7253',intro:'Stavo finendo il pezzo sul vagone. Facciamo una pausa? Il mio Topo sospetto ha voglia di muoversi.',after:'Bella sfida. Quel muro in fondo al piazzale è libero: prima o poi ci facciamo un pezzo insieme.'},
 {id:'yard',creature:'n04',zone:0,x:20,y:18,name:'Ada del deposito',look:'mechanic',color:'#628f98',intro:'Io riparo i cancelli, lui sorveglia le chiavi. Ti presento Cane sfatto. Vediamo come te la cavi.',after:'Passa pure dal deposito. E tieni d’occhio la mossa che ti annuncia: difendersi serve davvero.'},
 {id:'freight',creature:'n07',zone:0,x:29,y:16,name:'Zero',look:'punk',color:'#ad6380',intro:'Aspetto la crew per dipingere. Intanto, tu e Gialluca ve la sentite di sfidare Fumatore col cane?',after:'Hai ritmo, Nino. Sotto il ponte trovi altri tre che si allenano.'},
 {id:'skate',creature:'n02',zone:1,x:11,y:15,name:'Mavi',look:'skater',color:'#839f5c',intro:'Un altro giro sulla rampa e poi torno a casa. Prima, una sfida col mio Piccione immobile?',after:'Puoi fotografarlo, basta che nella foto si veda anche la tavola.'},
 {id:'sound',creature:'n05',zone:1,x:25,y:17,name:'DJ Cavo',look:'dj',color:'#b783b0',intro:'Stasera montiamo le casse al fondo. Pagliaccio randagio fa il soundcheck. Vuoi sentirlo?',after:'Questa me la segno. Quando passi di nuovo ti concedo la rivincita.'},
 {id:'wall',creature:'n08',zone:1,x:27,y:19,name:'Iris',look:'writer',color:'#d8a45b',intro:'Sto preparando il muro per la jam. Scimmia in felpa mi ruba sempre i tappi: vediamo se almeno sa lottare.',after:'Hai visto il graffito vicino all’ingresso? Vincenzo cercava proprio quella scritta.'},
 {id:'mold',creature:'n10',zone:1,x:16,y:15,name:'Muschio',look:'writer',color:'#9aaa76',intro:'Ho trovato questa Rana ammuffita dietro una pozzanghera, vicino ai piloni. A Nino sembrava una pietra! Vediamo come combatte.',after:'La prossima volta tieni gli occhi aperti: qui sotto il ponte si muove di tutto.'},
 {id:'market',creature:'n06',zone:2,x:11,y:15,name:'Lella',look:'woman',color:'#ba6884',intro:'Ho chiuso il banco per cinque minuti. Madama Leoparda vuole farsi un giro: ci fai compagnia con una sfida?',after:'Falle una bella foto, che ci tiene. Qui al mercato ci conosciamo tutti.'},
 {id:'delivery',creature:'n03',zone:2,x:24,y:14,name:'Toni il rider',look:'rider',color:'#dc9851',intro:'Ultima consegna fatta. Mi è rimasto questo Pesce misterioso nello zaino. Una sfida e capiamo che sa fare.',after:'Se lo fotografi manda uno scatto anche a me. Il cliente non mi crede.'},
 {id:'closing',creature:'n09',zone:2,x:31,y:16,name:'Bruno',look:'worker',color:'#75996b',intro:'Dovevo buttare i sacchi. Questo ha deciso di restare. Sacco vivente, fai vedere a Nino come ti difendi!',after:'Ormai me lo tengo. Comunque, dietro le serrande trovi un posto tranquillo per allenarti.'}
];
// Optional post-game legendary encounters in three reachable districts, using their
// own monster sprites on the overworld and distinct movesets in battle.
trainers.push(
 {id:"calzo-rosso",creature:"n11",legendary:true,zone:9,x:17,y:15,name:"Faccia da Calzo Rosso",look:"hoodie",color:"#ca4943",intro:"Un calzo sul volto e la maglia rossa. Fa un passo avanti: preparati al suo Rutto apocalittico!",after:"Il Rosso si toglie di mezzo, ma puoi tornare quando vuoi."},
 {id:"calzo-turchese",creature:"n12",legendary:true,zone:33,x:17,y:15,name:"Faccia da Calzo Turchese",look:"hoodie",color:"#39a99b",intro:"Dal sottopasso emerge una figura dalla felpa turchese. Un solo gesto e comincia la sfida!",after:"Il Turchese annuisce. Nessuno sa che faccia abbia davvero."},
 {id:"calzo-blu",creature:"n13",legendary:true,zone:43,x:17,y:15,name:"Faccia da Calzo Blu",look:"hoodie",color:"#355cc7",intro:"Una visiera di traverso, il volto coperto e la maglia blu. L'ultimo Faccia da Calzo ti sfida.",after:"Il Blu alza la visiera e sparisce fra i manifesti."}
);
const npc=(zone,x,y,name,look,text,patrol)=>({zone,x,y,name,look,text,role:'…',patrol});
const npcs=[
 {...npc(0,14,16,'Vincenzo','guide','Nino, gli allenatori del quartiere ti aspettano. Sfida i loro Ninomon, fotografali e riempi la Ninodex. Il tabellone dello scalo nasconde il primo indizio.'),role:'V'},
 npc(0,24,18,'Capostazione','worker','I binari sono fuori servizio. Per il sottopasso segui il piazzale verso destra.',[[24,18],[25,18],[25,17],[24,17]]),
 npc(0,17,9,'Elio il ferroviere','elder','Qui c’era la biglietteria. Ora vengono i ragazzi a disegnare; almeno il piazzale è tornato vivo.'),
 npc(0,13,19,'Sere','woman','Rame dipinge sul vagone. Ada lavora al deposito. Zero aspetta vicino all’uscita. Li riconosci dal segno sopra la testa.'),
 npc(0,21,6,'Paco','writer','Ho tre colori e un muro intero. Il problema è decidere da dove partire.'),
 npc(1,9,17,'Passante col cappuccio','hoodie','Quando comincia la musica vengo qui. Se vuoi passare al mercato, continua verso destra.',[[9,17],[10,17],[10,18],[9,18]]),
 npc(1,12,12,'Nadia','woman','Il muro libero è quello a sinistra. Ci alleniamo tutti lì, senza coprire i pezzi degli altri.'),
 npc(1,6,18,'Berto','skater','Mavi è davanti alla rampa. Ha un Ninomon che sembra fermo, poi ti sorprende.'),
 npc(1,23,10,'Filo','dj','Le casse sono pronte. Mi manca solo una prolunga abbastanza lunga.'),
 npc(1,18,19,'Luce','rider','Puoi girare dietro i piloni. Il passaggio centrale resta sempre libero.'),
 npc(2,13,17,'Venditore','vendor','Frutta al banco, dischi dall’altro lato. Il pesce? Chiedi a Toni, io non ne so niente.'),
 npc(2,27,18,'Custode del deposito','elder','Bruno ha trovato un compagno fra i sacchi. Almeno adesso qualcuno mi aiuta a chiudere.',[[27,18],[27,17],[28,17],[28,18]]),
 npc(2,8,10,'Carmela','woman','Ho lasciato due cassette per Lella. Se la incontri ricordaglielo.'),
 npc(2,18,12,'Otto','punk','Nel negozio di dischi vendono anche spray. Sto mettendo da parte i soldi per il muro del ponte.'),
 npc(2,12,21,'Mimmo','mechanic','Lo scooter di Toni fa un rumore terribile. Lui dice che è il Pesce misterioso.')
];

// Eight connected districts, each made of eight authored quadrants. Coordinates
// in this gazetteer are stable save-game IDs; never reorder existing entries.
const CITY=[
 ['Scalo ferroviario','Sottopasso','Vicolo del mercato','Piazza dei dischi','Case della ferrovia','Cortile delle antenne','Giardino dei binari','Capolinea nord'],
 ['Officine ovest','Deposito tranviario','Mercato coperto','Corso delle botteghe','Case rosse','Largo dei panni','Parco del cavalcavia','Rotonda dei bus'],
 ['Dogana vecchia','Magazzini del sale','Piazza del mercato','Banchi del sabato','Rione delle scale','Corte dei balconi','Campo dei tigli','Stazione dei pullman'],
 ['Banchina ovest','Darsena asciutta','Largo delle casse','Piazza della radio','Palazzi azzurri','Cortile dei murales','Giardino dei pini','Terminal est'],
 ['Rimessa dei tram','Sotto il viadotto','Centro sociale','Piazza della jam','Rione del cinema','Corte della fontana','Campetto verde','Autolavaggio'],
 ['Fabbrica dei colori','Ciminiere spente','Laboratori di stampa','Largo degli artisti','Case del mercato','Cortile dei limoni','Parco dei writer','Distributore vecchio'],
 ['Deposito container','Officina grande','Vicolo delle tipografie','Piazza dei manifesti','Case della collina','Largo del campanile','Giardino alto','Tornante est'],
 ['Scalo merci sud','Hangar abbandonato','Mercatino notturno','Arena delle crew','Palazzine del sole','Corte degli ulivi','Belvedere','Ultimo capolinea']
];
const families=['rail','industry','market','square','housing','court','park','service'];
const districtNames=['Ferrovia','Officine','Mercati','Darsena','Viadotto','Colorificio','Collina','Confine sud'];
const rowsColors=['#ac9474','#8c9b94','#b68e77','#8a9eac','#ab9d7e','#b38e86','#94a083','#ab967e'];
function add(z,type,x,y,w,h,label='',extra={}){z.structures.push(structure(z.id+'-'+z.structures.length,type,x,y,w,h,label,extra));}
function quadrant(id){
 const row=Math.floor(id/8),col=id%8,family=families[col];
 const z={id,name:CITY[row][col],theme:family==='rail'||family==='industry'?0:family==='service'?1:2,family,
  region:districtNames[row],structures:[],districts:[],surfaces:[]};
 const color=rowsColors[row],left=3+row%2,right=23-row%2;
 const building=(x,y,w,h,name)=>add(z,'shop',x,y,w,h,name,{color,awning:row%2?'#537b85':'#ac6c58'});
 if(family==='rail'){
  add(z,'asset',3,5,10,4,'',{asset:'cargo_wagon'});
  add(z,'asset',24,3,9,6,'',{asset:'freight_warehouse'});
  add(z,'asset',3,20,10,1,'',{asset:'rail_fence_10',overhang:1});
  add(z,'crates',25,19,4,3);add(z,'kiosk',5,2,5,2,'UFFICIO MERCI',{color});
  add(z,'wall',21,21,3,1,'UNS');
 }else if(family==='industry'){
  building(left,3,9,7,row%2?'RIMESSA':'OFFICINE');building(right,4,9,6,row%2?'DEPOSITO':'FABBRICA');
  add(z,'crates',4,19,4,3);add(z,'crates',10,20,2,2);add(z,'bin',25,20,4,1);
  add(z,'wall',22,12,7,1,'COLORE');
 }else if(family==='market'){
  building(left,3,9,6,'MERCATO');building(right,3,9,6,'BOTTEGHE');
  for(const x of [3,9,22,28])add(z,'stall',x,19,4,2,x%2?'FRUTTA':'LIBRI');
  add(z,'planter',4,11,3,1);add(z,'bench',25,11,2,1);
 }else if(family==='square'){
  building(left,3,8,6,row===7?'CASA DELLE CREW':'DISCHI & SPRAY');building(right,3,8,6,'CAFFE DEL RIONE');
  add(z,'stage',22,20,9,2,'JAM / '+(row+1));add(z,'speaker',31,20,1,2);
  add(z,'wall',3,21,9,1,'NINO / STREET');add(z,'bench',5,12,3,1);add(z,'paint',12,20,1,1);
 }else if(family==='housing'){
  building(left,3,9,7,'CIVICO '+(10+row));building(right,3,9,7,'CIVICO '+(20+row));
  building(left,19,9,3,'PORTINERIA');add(z,'garden',23,19,8,3);add(z,'scooter',26,12,2,1);
 }else if(family==='court'){
  building(left,3,8,7,'CORTE '+(row+1));building(right,3,8,7,'BALCONI');
  add(z,'garden',3,19,4,3);add(z,'fountain',24,19,3,3);add(z,'bench',9,20,3,1);add(z,'bench',29,20,3,1);
  add(z,'wall',23,12,7,1,'VIVA IL RIONE');
 }else if(family==='park'){
  z.theme=0;z.surfaces.push({x:2,y:3,w:12,h:9,kind:'grass'},{x:21,y:3,w:12,h:9,kind:'grass'}, {x:2,y:19,w:12,h:4,kind:'grass'}, {x:21,y:19,w:12,h:4,kind:'grass'});
  for(const [x,y] of [[3,4],[10,5],[24,4],[29,8],[5,20],[27,20]])add(z,'tree',x,y,2,2);
  add(z,'court',22,19,4,3);add(z,'bench',11,11,2,1);add(z,'bench',22,11,2,1);add(z,'kiosk',4,9,5,3,'CHIOSCO',{color});
 }else{
  z.theme=1;building(3,3,9,6,'RICAMBI');building(23,3,9,6,row%2?'GARAGE':'CAPOLINEA');
  add(z,'shelter',3,19,9,3,'BUS / '+(row+1));add(z,'scooter',25,20,2,1);add(z,'bin',29,20,2,1);add(z,'wall',23,12,7,1,'FERMATA');
 }
 add(z,'lamp',20,12,1,1);
 if(col!==6)add(z,'planter',13,10,1,2);
 add(z,'paint',21,19,1,1);
 z.districts=[{x:1,y:1,w:33,h:22,name:z.name}];
 return z;
}
for(let id=0;id<64;id++){
 if(id>=3)zones.push(quadrant(id));
 else Object.assign(zones[id],{id,theme:id,family:families[id],region:districtNames[0],surfaces:[]});
}
const handles=['Spillo','Nube','Kora','Riff','Cromo','Lime','Dado','Moka','Nera','Riga','Zeta','Blu','Tessa','Riko','Soda','Milo'];
const looks=['writer','mechanic','punk','skater','dj','woman','rider','worker','elder','vendor','hoodie'];
const trainerLines={
 rail:'Stavo seguendo i vecchi binari. Qui ci alleniamo quando il piazzale si svuota.',
 industry:'Ho appena finito il turno in officina. Mi fermo per una sfida prima di tornare a casa.',
 market:'Mi hanno detto che sei Nino, quello che fotografa tutti i Ninomon del quartiere.',
 square:'La crew si vede qui stasera. Nell’attesa mi alleno: ti va una sfida?',
 housing:'Abito al piano di sopra. Ti ho visto passare con Gialluca e sono sceso.',
 court:'In questo cortile ci conosciamo tutti. Tu invece sei nuovo: presentiamoci con una sfida.',
 park:'Ho portato il mio Ninomon a prendere aria. Ha più energia di quando siamo usciti.',
 service:'Il prossimo autobus passa fra un’ora. Abbiamo tempo per una lotta.'
};
for(let z=3;z<64;z++){
 const q=zones[z],row=Math.floor(z/8);
 for(let n=0;n<3;n++){
  const [x,y]=[[9,16],[25,16],[18,20]][n];
  const species='n'+String((z*3+n)%9+1).padStart(2,'0');
  trainers.push({id:'q'+z+'-t'+n,creature:species,zone:z,x,y,
   name:handles[(z+n*5)%handles.length]+' '+districtNames[row],look:looks[(z+n*3)%looks.length],color:rowsColors[(z+n)%8],
   intro:trainerLines[q.family]+' Ho sentito parlare dei tuoi pezzi allo scalo.',
   after:'Bella sfida, Nino. Ci trovi ancora qui quando vuoi allenarti.'});
 }
 npcs.push(npc(z,12,17,'Abitante di '+q.name,looks[(z+2)%looks.length],
  'Questo è '+q.name+'. '+(z%8<7?'A est trovi '+zones[z+1].name+'. ':'A ovest trovi '+zones[z-1].name+'. ')+(z<56?'A sud si va verso '+zones[z+8].name+'.':'Da qui si torna verso nord.')));
 npcs.push(npc(z,21,10,'Writer della '+districtNames[row],'writer',
  ['I muri dipinti ti aiutano a orientarti. Apri la mappa dal tasto MAPPA: il quadrante dove sei è evidenziato.',
   'Gli allenatori hanno un punto esclamativo. Quando li batti compare un segno di spunta.',
   'Puoi girare tutta la città fin da subito. Per tornare da Vincenzo cerca lo Scalo ferroviario, A1.',
   'I Ninomon selvatici si nascondono solo nei terreni abbandonati. Sulle strade trovi noi allenatori.'][z%4]));
 npcs.push(npc(z,18,12,'Passante del rione',looks[(z+6)%looks.length],
  'Vengo spesso a '+q.name+'. '+['C’è ancora spazio per un bel murale.', 'Il sabato si riempie di gente.', 'Qui al tramonto arriva tutta la crew.', 'Più avanti trovi un’altra piazza.'][row%4]));
}
// Individual block plans: displace/split facades, swap side streets, and add
// region-specific landmarks. The central routes remain connected, while the
// back courtyards differ from one neighbourhood to the next.
const landmarks=['clock','tank','fountain','water','court','sculpture','garden','tower'];
for(let z=3;z<64;z++){
 const q=zones[z],row=Math.floor(z/8),variant=(row+z%8)%8;
 if(variant%2)for(const s of q.structures)s.x=W-s.x-s.w;
 for(const s of q.structures){
  if(s.type==='shop'&&s.y<12){
   if(variant===1||variant===5){s.y+=2;s.h=Math.max(4,s.h-2);}
   if(variant===2||variant===6){s.w=Math.max(5,s.w-2);s.x+=1;}
   if(variant===3||variant===7){s.y=2;s.h=Math.min(8,s.h+1);}
  }
 }
 // These plazas sit off the through route, with a route around both sides.
 const landmark={x:variant%2?10:21,y:variant<4?18:5,w:3,h:3};
 const overlaps=a=>a.x<landmark.x+landmark.w&&a.x+a.w>landmark.x&&a.y<landmark.y+landmark.h&&a.y+a.h>landmark.y;
 q.structures=q.structures.filter(a=>!overlaps(a));
 add(q,landmarks[row],landmark.x,landmark.y,landmark.w,landmark.h,q.name);
 // Enclosed rear yards, workshop courts and small pedestrian passages.
 if(variant===0||variant===4){
  q.structures=q.structures.filter(a=>!(a.y>=19&&a.x>=3&&a.x<13));
  add(q,'kiosk',3,19,9,3,row%2?'LABORATORIO':'CIRCOLO DEL RIONE',{color:rowsColors[row]});
 }else if(variant===2||variant===6){
  add(q,'wall',3,12,5,1,'CREW '+(row+1));
 }else if(variant===3||variant===7){
  add(q,'garden',28,11,4,2);
 }
 q.surfaces.push({x:landmark.x-1,y:landmark.y-1,w:landmark.w+2,h:landmark.h+2,kind:row===3?'paver':row===6?'grass':'concrete'});
}
// Keep actors beside their intended landmark after the block-plan transforms.
for(const p of [...trainers,...npcs].filter(p=>p.zone>=3)){
 const other=[...trainers,...npcs].filter(a=>a!==p);
 const [x,y]=safeSpawn(p.zone,p.x+.5,p.y+.5,other);p.x=Math.floor(x);p.y=Math.floor(y);
}

// Give one passer-by per new block a short, verified pavement walk.
for(const p of npcs.filter(p=>p.zone>=3&&p.name==='Passante del rione')){
 const occupied=[...trainers,...npcs].filter(a=>a!==p&&a.zone===p.zone);
 for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
  const x=p.x+dx,y=p.y+dy;
  if(!blocked(p.zone,x,y)&&!occupied.some(a=>a.x===x&&a.y===y)){
   p.patrol=[[p.x,p.y],[x,y]];break;
  }
 }
}
function neighbor(z,dir){
 const x=z%8,y=Math.floor(z/8);
 return dir==='left'?(x>0?z-1:null):dir==='right'?(x<7?z+1:null):dir==='up'?(y>0?z-8:null):(y<7?z+8:null);
}
function exitDirection(z,x,y){
 if(y>=15&&y<=17){if(x===0&&neighbor(z,'left')!==null)return 'left';if(x===W-1&&neighbor(z,'right')!==null)return 'right';}
 if(x>=15&&x<=17){if(y<=1&&neighbor(z,'up')!==null)return 'up';if(y===H-1&&neighbor(z,'down')!==null)return 'down';}
 return null;
}

function inside(x,y,r){return x>=r.x&&y>=r.y&&x<r.x+r.w&&y<r.y+r.h;}
function portal(z,x,y){return exitDirection(z,x,y)!==null;}
function blocked(z,x,y){
 x=Math.floor(x);y=Math.floor(y);
 if(x<0||x>=W||y<0||y>=H)return true;
 if((y<2||y===H-1||x===0||x===W-1)&&!portal(z,x,y))return true;
 return zones[z].structures.some(r=>inside(x,y,r));
}
function ground(z,x,y){
 if((y<2||y>=H-1||x===0||x===W-1)&&!portal(z,x,y))return 'boundary';
 if(z>=3){
  const q=zones[z],patch=q.surfaces.find(r=>inside(x,y,r));
  if(patch)return patch.kind;
  if(q.family==='rail'&&(y===9||y===10))return 'track';
  if((x>=15&&x<=19)||(y>=14&&y<=17))return 'asphalt';
  if(q.family==='rail'||q.family==='industry')return y<12||y>19?'ballast':'concrete';
  return q.family==='park'?'paver':(y>=10?'paver':'concrete');
 }
 if(z===0){
  if(y===9||y===10)return 'track';
  if(y<12)return 'ballast';
  if(x>=13&&x<=23&&y>=12&&y<=20)return 'concrete';
  if(y>=20||x<=8&&y>=17)return 'ballast';
  return 'asphalt';
 }
 if(z===1){
  if(y>=15&&y<=17)return 'asphalt';
  if(y>=20||y<=5)return 'ballast';
  if((x===8&&y>=9&&y<=12)||(x===28&&y>=11&&y<=13))return 'puddle';
  return 'concrete';
 }
 if(y>=12&&y<=17)return 'asphalt';
 if(y>=9&&y<=11||y>=18&&y<=21)return 'paver';
 return 'concrete';
}
function district(z,x,y){return zones[z].districts.find(d=>inside(x,y,d))?.name||zones[z].name;}
function safeSpawn(z,x,y,occupied=[]){
 const available=(a,b)=>!blocked(z,a,b)&&!occupied.some(p=>p.zone===z&&p.x===a&&p.y===b);
 const a=Math.floor(x),b=Math.floor(y);
 if(available(a,b))return [a+.5,b+.5];
 for(let radius=1;radius<W+H;radius++)for(let dy=-radius;dy<=radius;dy++){
  const dx=radius-Math.abs(dy);
  for(const offset of dx?[dx,-dx]:[0])if(available(a+offset,b+dy))return [a+offset+.5,b+dy+.5];
 }
 return [16.5,16.5];
}
const api={W,H,columns:8,rows:8,zones,trainers,npcs,blocked,ground,portal,district,safeSpawn,neighbor,exitDirection};
if(typeof module!=='undefined')module.exports=api;
root.NINOMON_WORLD=api;
})(typeof window==='undefined'?globalThis:window);
