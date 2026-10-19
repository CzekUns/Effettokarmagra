/* Run from project root: node games/pesca-grossa/rules.test.js
 * Regole di Pesca Grossa 2.0: dati coerenti, combattimento bilanciato, economia e salvataggi.
 * Nessun DOM, browser o pacchetto esterno. */
"use strict";
const assert=require("node:assert/strict");
require("./rules.js");
const R=globalThis.PESCA_RULES;
const gear=(rod,reel,line,drag)=>({rod:R.GEAR.rod.find(g=>g.id===rod),reel:R.GEAR.reel.find(g=>g.id===reel),line:R.GEAR.line.find(g=>g.id===line),drag:drag||"media"});
const BASE=gear("bambu","vecchio","nylon20"),TOP=gear("traina","rotante","trecciato");

// --- dati coerenti
assert.equal(R.SPECIES.length,31);
assert.equal(R.SPECIES.filter(s=>s.rarity==="leggendario").length,5);
assert.equal(new Set(R.SPECIES.map(s=>s.id)).size,R.SPECIES.length,"id specie unici");
for(const sp of R.SPECIES){
 assert(R.RARITY[sp.rarity],sp.id+": rarità");
 assert(sp.spots.length&&sp.spots.every(s=>R.SPOTS[s]),sp.id+": luoghi");
 assert(sp.len[0]<sp.len[1]&&sp.depth[0]<sp.depth[1],sp.id+": intervalli");
 assert(Object.keys(sp.baits).length&&Object.keys(sp.baits).every(b=>R.BAITS[b]),sp.id+": esche");
 assert(sp.hours.every(w=>w[0]>=0&&w[1]<=24&&w[0]<w[1]),sp.id+": orari");
 assert(Object.keys(sp.style).every(k=>R.ACTIONS[k]),sp.id+": stile di combattimento");
 if(sp.rarity==="leggendario")assert(sp.legend,sp.id+": leggenda per la bottiglia");
 if(sp.only)assert(sp.only.every(w=>R.WEATHER[w]),sp.id+": meteo");
}
// ogni specie è pescabile: esiste un luogo, un'ora del giorno di gioco, un meteo e un punto raggiungibile con la canna migliore
{
 const maxRange=Math.max(...R.GEAR.rod.map(g=>g.range))*R.PX_PER_M;
 for(const sp of R.SPECIES){
  let ok=false;
  for(const spot of sp.spots){
   for(let y=R.SHORE_Y+20;y<=750&&!ok;y+=15)for(let x=40;x<=760&&!ok;x+=20){
    if(Math.hypot(x-421,y-183)>maxRange)continue;
    const depth=R.depthAt(spot,x,y);
    for(let m=R.DAY_START;m<R.NIGHT_END&&!ok;m+=30)for(const w of Object.keys(R.WEATHER))if(R.speciesWeight(sp,{spot,hour:m/60,weather:w,depth,karma:0})>0){ok=true;break;}
   }
  }
  assert(ok,sp.id+" deve essere pescabile da qualche parte");
 }
}
// il Capitone non si raggiunge con la canna di partenza (serve la bolognese)
{
 const reach=rod=>{let best=0;const r=R.GEAR.rod.find(g=>g.id===rod).range*R.PX_PER_M;for(let y=R.SHORE_Y;y<=760;y+=5)for(let x=40;x<=760;x+=10)if(Math.hypot(x-421,y-183)<=r)best=Math.max(best,R.depthAt("lago",x,y));return best;};
 assert(reach("bambu")<R.SPECIES_BY_ID.capitone.depth[0],"bambù troppo corta per il Capitone");
 assert(reach("bolognese")>=R.SPECIES_BY_ID.capitone.depth[0],"con la bolognese il Capitone è raggiungibile");
}

// --- caso deterministico
{
 const a=R.makeRng(42),b=R.makeRng(42);
 for(let i=0;i<20;i++)assert.equal(a(),b());
 const r=R.makeRng(7);for(let i=0;i<1000;i++){const v=r();assert(v>=0&&v<1);}
}

// --- esemplari
{
 const rand=R.makeRng(3);
 for(const sp of R.SPECIES)for(let i=0;i<50;i++){
  const f=R.rollFish(sp,rand,{pity:.25,karma:100,night:true});
  assert(f.len>=sp.len[0]-.1&&f.len<=sp.len[1]+.1,sp.id+": lunghezza");
  assert(Math.abs(f.weight-R.weightOfLength(sp,f.len))<.01*Math.max(1,f.weight),sp.id+": peso coerente");
  if(sp.rarity==="leggendario"||sp.protected)assert.equal(f.karmagra,false,sp.id+": niente variante Karmagra");
 }
 const sp=R.SPECIES_BY_ID.spigola;
 assert.equal(R.isUndersize(sp,{len:24}),true);
 assert.equal(R.isUndersize(sp,{len:25}),false);
 assert.equal(R.fishValue({species:"anguilla",weight:1,quality:3}),0,"specie protetta: niente vendita");
 const v1=R.fishValue({species:"orata",weight:1,quality:1,freshness:100}),v3=R.fishValue({species:"orata",weight:1,quality:3,freshness:100});
 assert.equal(v1,14);assert.equal(v3,21);
 assert.equal(R.fishValue({species:"orata",weight:1,quality:1,freshness:100,karmagra:true}),42);
 assert(R.fishValue({species:"orata",weight:1,quality:1,freshness:0})<v1*.5,"il pesce vecchio vale meno");
}

// --- abboccata
{
 const sp=R.SPECIES_BY_ID.persico;
 const still=R.interestRate(sp,{bait:"minnow",hour:8,weather:"sereno",moving:false});
 const moving=R.interestRate(sp,{bait:"minnow",hour:8,weather:"sereno",moving:true});
 assert(moving>still*10,"l'artificiale funziona solo in movimento");
 assert.equal(R.interestRate(sp,{bait:"pane",hour:8,weather:"sereno"}),0,"il persico non mangia il pane");
 assert.equal(R.interestRate(R.SPECIES_BY_ID.anguilla,{bait:"verme",hour:12,weather:"sereno"}),0,"l'anguilla di giorno non mangia");
 assert(R.biteWindow(R.SPECIES_BY_ID.tonno_capri)<R.biteWindow(R.SPECIES_BY_ID.cefalo),"i rari danno meno tempo per ferrare");
 assert.equal(R.speciesWeight(R.SPECIES_BY_ID.re_saraghi,{spot:"scogli",hour:10,weather:"sereno",depth:5}),0);
 assert(R.speciesWeight(R.SPECIES_BY_ID.re_saraghi,{spot:"scogli",hour:10,weather:"burrasca",depth:5})>0);
}

// --- combattimento: un bot bravo vince, chi tiene sempre premuto spezza la lenza sui pesci grossi
function fight(spId,kit,policy,n,lenQ){
 const sp=R.SPECIES_BY_ID[spId];let caught=0;const reasons={};
 for(let i=0;i<n;i++){
  const rand=R.makeRng(1000+i);
  const len=sp.len[0]+(sp.len[1]-sp.len[0])*(lenQ==null?rand():lenQ);
  const f=R.createFight({species:spId,len,weight:R.weightOfLength(sp,len),karmagra:false},kit,{distance:18,structure:true,rand});
  let guard=0;
  while(!f.outcome&&guard++<12000){
   const a=f.action,drag=R.dragLimit(f);let input;
   if(policy==="bravo"){let reel=f.tension<drag*.82;if(a.type==="salto")reel=f.slack>.4&&f.tension<drag*.6;if(a.type==="tana")reel=f.tension<f.line.limit*.9;if(a.type==="riposo")reel=true;input={reel,side:-a.dir};}
   else input={reel:true,side:0};
   R.stepFight(f,input,1/30,rand);
  }
  if(f.outcome==="caught")caught++;else reasons[f.reason]=(reasons[f.reason]||0)+1;
 }
 return{rate:caught/n,reasons};
}
assert(fight("cefalo",BASE,"bravo",60).rate>=.95,"un cefalo con l'attrezzatura base si prende");
assert(fight("carassio",BASE,"sempre",60).rate>=.95,"il carassio perdona tutto");
{const r=fight("carpa",BASE,"sempre",60,.8);assert(r.rate<=.5&&r.reasons.snap,"carpa grossa + recupero continuo = lenza spezzata "+JSON.stringify(r));}
assert(fight("carpa",BASE,"bravo",60,.8).rate>=.8,"la stessa carpa con la tecnica giusta si prende");
assert.equal(fight("tonno_capri",BASE,"bravo",20).rate,0,"il tonno con la canna di bambù è impossibile");
assert(fight("tonno_capri",TOP,"bravo",20).rate>=.4,"il tonno con l'attrezzatura migliore e la tecnica giusta è possibile");
assert.equal(fight("tonno_capri",TOP,"sempre",20).rate,0,"il tonno non si prende tenendo premuto");
{const r=fight("cernia",gear("spinning","frontale","fluoro40"),"sempre",60);assert(r.rate<.9,"la cernia punisce chi non gestisce la tana");}
// frizione: più morbida = meno rotture ma più filo ceduto
{
 const run=drag=>{const sp=R.SPECIES_BY_ID.carpa,len=60;let snaps=0,slip=0;for(let i=0;i<40;i++){const rand=R.makeRng(500+i);const f=R.createFight({species:"carpa",len,weight:R.weightOfLength(sp,len)},gear("bambu","vecchio","nylon20",drag),{distance:18,rand});let g=0;while(!f.outcome&&g++<9000)R.stepFight(f,{reel:true,side:0},1/30,rand);if(f.reason==="snap")snaps++;slip+=f.slipped;}return{snaps,slip};};
 const soft=run("morbida"),hard=run("dura");
 assert(soft.snaps<hard.snaps,"la frizione morbida spezza meno "+JSON.stringify({soft,hard}));
 assert(soft.slip>hard.slip,"la frizione morbida cede più filo");
}
// qualità
{
 const f=R.createFight({species:"cefalo",len:40,weight:.7},BASE,{perfect:true,rand:R.makeRng(1)});
 f.correct=10;f.wrong=1;f.maxRatio=.5;assert.equal(R.fightQuality(f),3);
 f.maxRatio=.95;assert.equal(R.fightQuality(f),2);
}

// --- economia e carriera
{
 const c=R.newCareer(99);
 assert.equal(c.money,30);assert.equal(c.spot,"lago");assert(c.orders.length>=1);
 assert.equal(R.spotUnlocked(c,"porto"),false);
 assert.equal(R.buy(c,"gozzo").ok,false,"gozzo: serve fama e soldi");
 assert.equal(R.buy(c,"cumana").ok,false,"con 30 € l'abbonamento da 35 € non si compra");
 c.money=100;assert.equal(R.buy(c,"cumana").ok,true);assert.equal(c.money,65);
 assert.equal(R.spotUnlocked(c,"porto"),true);
 assert.equal(R.buy(c,"cumana").ok,false,"non si compra due volte");
 c.money=1000;assert.equal(R.canBuy(c,"spinning").ok,false,"la spinning chiede fama 1");
 c.rep=3;assert.equal(R.buy(c,"spinning").ok,true);assert.equal(c.equip.rod,"spinning");
 const before=c.baits.pane||0;R.buy(c,"pane");assert.equal(c.baits.pane,before+10);
 // ghiacciaia e invecchiamento
 c.cooler=[{species:"orata",len:30,weight:R.weightOfLength(R.SPECIES_BY_ID.orata,30),quality:1,freshness:100}];
 R.ageCooler(c,120);assert(Math.abs(c.cooler[0].freshness-82)<.001,"secchio: −9% all'ora");
 // commissioni
 const o={id:"t1",npc:"ciro",species:"orata",count:2,minWeight:.4,reward:50,rep:2,expires:c.day+1,done:false};c.orders=[o];
 c.cooler=[{species:"orata",len:35,weight:.73,quality:1,freshness:90},{species:"orata",len:19,weight:.12,quality:1,freshness:90},{species:"orata",len:40,weight:1.09,quality:1,freshness:30}];
 assert.equal(R.deliverOrder(c,"t1").ok,false,"sotto peso, sotto misura o non fresco non valgono");
 c.cooler.push({species:"orata",len:36,weight:.79,quality:1,freshness:95});
 const m=c.money,rep=c.rep;const d=R.deliverOrder(c,"t1");
 assert.equal(d.ok,true);assert.equal(c.money,m+50);assert.equal(c.rep,rep+2);assert.equal(c.cooler.length,2);
 // fine giornata: controllo sul sotto misura con il caso forzato
 c.cooler=[{species:"orata",len:15,weight:.06,quality:1,freshness:100},{species:"spigola",len:40,weight:.67,quality:1,freshness:100},{species:"moneta",len:0,weight:.01}];
 const money=c.money;const rep2=R.endDay(c,()=>0);
 assert.equal(rep2.inspected,true);assert.equal(rep2.fine,30);assert.equal(c.cooler.length,0);
 assert(Math.abs(c.money-(money-30+R.fishValue({species:"spigola",weight:.67,quality:1,freshness:100})+40))<.02,"multa + vendita + oggetto");
 // nuova giornata
 const day=c.day;R.startDay(c,R.makeRng(5));assert.equal(c.day,day+1);assert.equal(c.minute,R.DAY_START);assert(c.orders.length<=3&&c.orders.length>=1);
}
// generazione commissioni sempre valida
{
 const c=R.newCareer(1);c.extras.push("cumana","scooter","gozzo");c.rep=40;const rand=R.makeRng(9);
 for(let i=0;i<300;i++){const o=R.makeOrder(c,rand);const sp=R.SPECIES_BY_ID[o.species];
  assert(!sp.protected&&sp.rarity!=="leggendario");assert(o.count>=1&&o.count<=3);assert(o.reward>0);
  assert(o.minWeight<=R.weightOfLength(sp,sp.len[1]),o.species+": peso richiesto possibile");
  if(sp.min)assert(o.minWeight>=R.weightOfLength(sp,sp.min)-.01,o.species+": mai sotto misura");}
}
// salvataggi
{
 assert.equal(R.migrateSave(null),null);assert.equal(R.migrateSave({v:99}),null);
 const c=R.migrateSave({v:1,money:12,equip:{rod:"traina"},spot:"golfo",cooler:"rotto",minute:99999});
 assert.equal(c.money,12);assert.equal(c.equip.rod,"bambu","attrezzo non posseduto torna al base");
 assert.equal(c.spot,"lago","luogo bloccato torna al lago");assert(Array.isArray(c.cooler));assert.equal(c.minute,R.NIGHT_END);
 const full=R.newCareer(5);full.money=77;const back=R.migrateSave(JSON.parse(JSON.stringify(full)));assert.equal(back.money,77);assert.deepEqual(back.owned,full.owned);
}
// pescepedia e titoli
{
 const c=R.newCareer(2);
 assert.deepEqual(R.recordCatch(c,{species:"cefalo",weight:1,len:45}),{isNew:true,record:false});
 assert.deepEqual(R.recordCatch(c,{species:"cefalo",weight:1.5,len:50}),{isNew:false,record:true});
 assert.equal(R.dexCount(c),1);
 for(const sp of R.SPECIES)R.recordCatch(c,{species:sp.id,weight:1,len:sp.len[0]});
 assert.equal(R.titleOf(c),"Re del Golfo");assert.equal(R.legendsCaught(c),5);
}
// punti della sfida
assert(R.arcadePoints({species:"capitone",weight:5,quality:1},0)>=1500);
assert(R.arcadePoints({species:"pesce_oro",weight:.5,quality:1},0)>=500);
assert.equal(R.arcadePoints({species:"lattina",weight:.05},3),10+75);
console.log("pesca-grossa rules: ok");
