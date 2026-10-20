import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {riderVehicleCheck,riderPickups,riderDestinations,riderOffers,acceptOffer,cancelJob,stepJob,completeDelivery,
 deliveryResult,freshnessAt,riderLevel,riderStats,freshRiderSave,sanitizeRiderSave,riderRoute,routeLookahead,RIDER_LEVELS,
 PICKUP_RADIUS,offerPay,offerTimeLimit} from './rider.mjs';
import {freshProgress,readProgress,saveProgress} from './campaign.mjs';

const scooter={vehicleType:'motorcycle',model:'moto-scooter-sh-red',x:0,y:0};
const sport={vehicleType:'motorcycle',model:'moto-moto-sport-blue',x:0,y:0};
const car={vehicleType:'car',model:'panda-moderna-rossa',x:0,y:0};
const offer={key:'k',pickup:{id:'poi-1',name:'Bar Prova',x:0,y:0},dest:{id:'d',address:'Via Roma',x:300,y:0},meters:300,pay:offerPay(300),limit:100,client:'Anna R.'};
const memory=()=>{const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v))};};
function delivered(seconds,progress=freshProgress()){
 const acc=acceptOffer(progress.rider,null,offer,scooter);
 stepJob(acc.job,{x:1,y:0,vehicle:scooter,vehicleId:4,dt:0});
 stepJob(acc.job,{x:150,y:0,vehicle:scooter,vehicleId:4,dt:seconds});
 assert.equal(stepJob(acc.job,{x:300,y:2,vehicle:scooter,vehicleId:4,dt:0}).type,'arrived');
 return {progress,job:acc.job,out:completeDelivery(progress,acc.job)};
}

test('Q39: si accetta solo su scooter o moto compatibile, una consegna alla volta', () => {
 assert.equal(riderVehicleCheck(null).reason,'a-piedi');
 assert.equal(riderVehicleCheck(car).reason,'auto');
 assert.equal(riderVehicleCheck(sport).reason,'moto-incompatibile');
 assert.equal(riderVehicleCheck(scooter).ok,true);
 assert.equal(riderVehicleCheck({vehicleType:'motorcycle',model:'moto-moto-naked-black'}).ok,true);
 const save=freshRiderSave();
 assert.equal(acceptOffer(save,null,offer,car).ok,false);
 assert.equal(acceptOffer(save,null,offer,null).ok,false);
 assert.equal(save.serial,0,'un rifiuto non consuma numeri d’ordine');
 const ok=acceptOffer(save,null,offer,scooter);
 assert.equal(ok.ok,true);assert.equal(ok.job.phase,'pickup');assert.equal(ok.job.id,1);
 assert.equal(acceptOffer(save,ok.job,offer,scooter).reason,'gia-attiva');
 assert.equal(cancelJob(save,ok.job).ok,true);assert.equal(save.cancelled,1);
});

test('Q39: offerte da POI di cibo reali e furgoncini, destinazioni su vie OSM con nome', () => {
 const shops=[{id:1,name:'Bar Signorelli',kind:'bar',x:0,y:0},{id:2,name:'Farmacia',kind:'pharmacy',x:5,y:0},{id:3,name:'Il re del pollo',kind:'fast_food',x:20,y:0}];
 const pickups=riderPickups(shops,[{name:'Zeppole e panzerotti',kind:'street-zeppole',x:40,y:0}]);
 assert.deepEqual(pickups.map(p=>p.name),['Bar Signorelli','Il re del pollo','Zeppole e panzerotti']);
 assert.equal(pickups[2].truck,true);
 const roads=[{id:9,n:'Via Roma',t:'residential',p:[300,0,320,0,340,0]},{id:10,n:'',t:'residential',p:[300,0,400,0]},{id:11,n:'Sentiero',t:'path',p:[300,0,400,0]}];
 const dests=riderDestinations(roads);
 assert.deepEqual(dests.map(d=>d.address),['Via Roma']);
 const a=riderOffers({pickups,destinations:dests,seed:5}),b=riderOffers({pickups,destinations:dests,seed:5});
 assert.ok(a.length>=1);assert.deepEqual(a,b,'offerte deterministiche');
 for(const o of a){assert.equal(o.dest.address,'Via Roma');assert.ok(o.meters>=140&&o.meters<=750);assert.equal(o.pay,offerPay(o.meters));}
});

test('Q39: ritiro solo al locale e in sella; il pacco (cubo) resta sul mezzo del ritiro', () => {
 const save=freshRiderSave(),job=acceptOffer(save,null,offer,scooter).job;
 assert.equal(stepJob(job,{x:50,y:0,vehicle:scooter,vehicleId:4,dt:1}),null,'lontano: niente ritiro');
 assert.equal(job.elapsed,0,'il timer parte solo al ritiro');
 assert.equal(stepJob(job,{x:PICKUP_RADIUS-1,y:0,vehicle:null,vehicleId:null,dt:1}).type,'need-scooter');
 const res=stepJob(job,{x:2,y:0,vehicle:scooter,vehicleId:4,dt:1});
 assert.equal(res.type,'picked');assert.equal(job.phase,'deliver');assert.equal(job.cargo,4);
 // Arrivato con un altro scooter: il pacco non si duplica.
 assert.equal(stepJob(job,{x:300,y:0,vehicle:scooter,vehicleId:7,dt:1}).type,'need-cargo');
 // A piedi, con lo scooter del pacco parcheggiato vicino: consegna valida.
 assert.equal(stepJob(job,{x:300,y:0,vehicle:null,vehicleId:null,cargoPos:{x:290,y:0},dt:1}).type,'arrived');
});

test('Q40: consegna in tempo = compenso pieno; in ritardo = ridotto; freschezza che cala', () => {
 assert.equal(freshnessAt(0,100),100);assert.equal(freshnessAt(100,100),70);assert.equal(freshnessAt(200,100),0);
 const fast=delivered(40).out,slow=delivered(150).out,verySlow=delivered(400).out;
 assert.equal(fast.onTime,true);assert.equal(fast.pay,offer.pay);assert.equal(fast.stars,5);
 assert.equal(slow.onTime,false);assert.ok(slow.pay<offer.pay&&slow.pay>0);assert.ok(slow.fresh<70);
 assert.ok(verySlow.pay>=Math.round(offer.pay*.3));assert.equal(verySlow.stars,1);
 assert.notEqual(fast.review,verySlow.review,'recensioni diverse per consegna buona e cattiva');
 assert.equal(offerTimeLimit(300),Math.round(300*1.4/7+25));
 assert.ok(offerTimeLimit(300,RIDER_LEVELS[4].time)<offerTimeLimit(300),'difficoltà progressiva');
});

test('Q40: percorso sul grafo stradale e freccia verso il tratto successivo', () => {
 const graph={nodes:[{x:0,y:0,out:[0]},{x:100,y:0,out:[1,2]},{x:100,y:100,out:[3]},{x:0,y:100,out:[]}],
  edges:[{from:0,to:1,len:100,car:true},{from:1,to:2,len:100,car:true},{from:1,to:0,len:100,car:true},{from:2,to:3,len:100,car:false}]};
 const route=riderRoute(graph,{x:2,y:1},{x:101,y:98});
 assert.deepEqual(route.points.slice(0,3).map(p=>[p.x,p.y]),[[0,0],[100,0],[100,100]]);
 assert.equal(route.length,202);
 const look=routeLookahead(route.points,{x:95,y:0});
 assert.deepEqual([look.target.x,look.target.y],[100,100]);
});

test('Q41: compenso, bonus di livello, stelle e storico senza doppioni', () => {
 const {progress,job,out}=delivered(30);
 assert.equal(out.ok,true);assert.equal(progress.money,out.total);
 assert.equal(completeDelivery(progress,job).duplicate,true,'la stessa consegna non si paga due volte');
 assert.equal(progress.rider.delivered,1);assert.equal(progress.rider.history.length,1);
 const st=riderStats(progress.rider);
 assert.equal(st.onTimePct,100);assert.equal(st.avgStars,5);assert.equal(st.level.name,'Principiante');
 const level=RIDER_LEVELS[2],res=deliveryResult({...job,elapsed:30},level);
 assert.equal(res.bonus,Math.round(res.pay*.1)+1,'bonus 10% Esperto + mancia freschezza');
});

test('Q41: livelli Principiante → Esperto → Leggenda con soglie di consegne e media', () => {
 assert.equal(riderLevel(freshRiderSave()).id,'principiante');
 assert.equal(riderLevel({...freshRiderSave(),delivered:5,starsTotal:10}).id,'apprendista');
 assert.equal(riderLevel({...freshRiderSave(),delivered:15,starsTotal:60}).id,'esperto');
 assert.equal(riderLevel({...freshRiderSave(),delivered:15,starsTotal:40}).id,'apprendista','media bassa: niente Esperto');
 const top=riderLevel({...freshRiderSave(),delivered:80,starsTotal:400});
 assert.equal(top.id,'leggenda');assert.equal(top.next,null);assert.equal(top.bonus,.2);
});

test('Q41: persistenza nella campagna, migrazione vecchi salvataggi e nessun doppione al reload', () => {
 const store=memory();
 const {progress,job}=delivered(30);
 progress.mission=2;progress.money+=100;
 saveProgress(store,progress);
 const back=readProgress(store);
 assert.equal(back.rider.delivered,1);assert.equal(back.rider.history[0].from,'Bar Prova');assert.equal(back.mission,2);
 assert.equal(completeDelivery(back,{...job}).duplicate,true,'dopo il reload la consegna resta unica');
 const again=acceptOffer(back.rider,null,offer,scooter);assert.equal(again.job.id,2,'numeri d’ordine sempre nuovi');
 // Salvataggio Q01–Q24 senza dati rider: si migra con un profilo vuoto, missioni e soldi intatti.
 const old=memory();old.setItem('gta-melito-campaign-v3',JSON.stringify({version:3,mission:3,stage:1,money:500,respect:30,shop:{bought:{caffe:2},spent:2}}));
 const migrated=readProgress(old);
 assert.equal(migrated.money,500);assert.equal(migrated.mission,3);assert.deepEqual(migrated.rider,freshRiderSave());
 // Storico manomesso: doppioni rimossi, contatori coerenti.
 const dirty=sanitizeRiderSave({delivered:2,onTime:9,starsTotal:99,history:[{id:3,stars:5},{id:3,stars:1},{id:2,stars:9}]});
 assert.equal(dirty.history.length,2);assert.equal(dirty.onTime,2);assert.equal(dirty.starsTotal,10);assert.equal(dirty.lastId,3);
});

test('Q39: pannello RIDER apribile da PAUSA, con J e openRiderApp()', () => {
 const html=readFileSync(new URL('./index.html',import.meta.url),'utf8'),game=readFileSync(new URL('./game.mjs',import.meta.url),'utf8');
 assert.match(html,/id="pause-rider"/);assert.match(html,/id="rider-panel"/);assert.match(html,/id="rider-hud"/);
 assert.match(game,/function openRiderApp\(\)/);assert.match(game,/window\.openRiderApp=openRiderApp/);
 assert.match(game,/e\.key\.toLowerCase\(\)==='j'/);
 assert.match(html,/game\.mjs\?v=193/);
});
