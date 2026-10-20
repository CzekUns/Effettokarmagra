import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {paintOptions,PERF_LEVELS,PERF_CAP,perfPrice,PAINT_PRICE,NEON_PRICE,NEON_COLORS,tunedProfile,buyTuning,clampPerf,drawNeonUnderglow,neonNightGlows} from './tuning.mjs';
import {depositVehicle,vehicleFromEntry,takeVehicle} from './garages.mjs';
import {freshProgress,readProgress,saveProgress} from './campaign.mjs';
import {handlingProfile} from './vehicle-handling.mjs';

const storage=()=>{const m=new Map();return {getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v))};};
const owned=(model='punto-188-red',money=5000)=>{const p=freshProgress();p.money=money;const e=depositVehicle(p.garage,{model,vehicleType:'car'},'cervi').entry;return {p,e};};

test('Q36 paint: only the existing colours of the same model, priced, reversible',()=>{
 const punto=paintOptions('punto-188-red');
 assert.equal(punto.length,8);assert.ok(punto.every(id=>id.startsWith('punto-188-')));
 assert.ok(!paintOptions('ypsilon-2003-navy').some(id=>id.startsWith('punto')),'no colours of another model');
 assert.deepEqual(paintOptions('panda-fire-red'),['panda-fire-red'],'single-colour sprite: no fake tinting');
 const {p,e}=owned();
 assert.equal(buyTuning(p,e,'paint','ypsilon-2003-white').ok,false);
 const r=buyTuning(p,e,'paint','punto-188-mint');
 assert.equal(r.ok,true);assert.equal(e.model,'punto-188-mint');assert.equal(p.money,5000-PAINT_PRICE);
 assert.equal(buyTuning(p,e,'paint','punto-188-red').ok,true,'back to the original colour');
 assert.equal(e.model,'punto-188-red');
});

test('Q36 performance: +5/+10/+15% of the BASE model profile, capped, never cumulative',()=>{
 const base=handlingProfile({model:'punto-188-red'}),seicento=handlingProfile({model:'seicento-1998-red'});
 assert.deepEqual(PERF_LEVELS,[0,5,10,15]);assert.equal(PERF_CAP,15);
 const t10=tunedProfile(base,{perf:10});
 assert.ok(Math.abs(t10.accel-base.accel*1.1)<1e-9&&Math.abs(t10.top-base.top*1.1)<1e-9);
 assert.equal(t10.brake,base.brake,'brakes and grip untouched (BF05 driving kept)');
 assert.equal(tunedProfile(tunedProfile(base,{perf:15}),{perf:0}).top,base.top*1.15,'applying 0 to a tuned profile does not stack');
 assert.equal(tunedProfile(base,{perf:99}).top,base.top*1.15,'cap');assert.equal(clampPerf(12),10);
 assert.ok(tunedProfile(seicento,{perf:15}).top<tunedProfile(base,{perf:15}).top,'differences between models kept');
 assert.equal(tunedProfile(base,{perf:0}),base);
});

test('Q36 prices in game euros: steps, refusals when short, downgrade free',()=>{
 assert.equal(perfPrice(0,15),1600);assert.equal(perfPrice(5,10),500);assert.equal(perfPrice(10,5),0);
 const {p,e}=owned('fiat-500-2007-red',700);
 const poor=buyTuning(p,e,'perf',15);
 assert.equal(poor.ok,false);assert.equal(poor.reason,'fondi-insufficienti');assert.equal(poor.need,1600);assert.equal(p.money,700);
 assert.equal(buyTuning(p,e,'perf',5).ok,true);assert.equal(p.money,400);
 assert.equal(buyTuning(p,e,'perf',10).ok,false,'500 € needed, 400 left');
 assert.equal(buyTuning(p,e,'neon','rosa').ok,true);assert.equal(p.money,400-NEON_PRICE);
 assert.equal(buyTuning(p,e,'neon','nero').ok,false,'only listed colours');
 assert.equal(buyTuning(p,e,'perf',0).price,0,'back to stock is free');
 assert.equal(p.garage.spent,300+NEON_PRICE);
});

test('Q36 tuning stays in the owned vehicle: street car, garage and reload',()=>{
 const st=storage(),{p,e}=owned('ypsilon-2003-navy',3000);
 takeVehicle(p.garage,e.id,'cervi');
 const street=vehicleFromEntry(e,{x:1,y:2,a:0});
 buyTuning(p,e,'perf',10,street);buyTuning(p,e,'neon','azzurro',street);buyTuning(p,e,'paint','ypsilon-2003-burgundy',street);
 assert.equal(street.model,'ypsilon-2003-burgundy');assert.equal(street.tuning.perf,10);assert.equal(street.tuning.neon,'azzurro');
 saveProgress(st,p);
 const back=readProgress(st).garage.vehicles[0];
 assert.equal(back.model,'ypsilon-2003-burgundy');assert.equal(back.tuning.perf,10);assert.equal(back.tuning.neon,'azzurro');assert.equal(back.stored,true);
 assert.equal(readProgress(st).money,3000-500-300-NEON_PRICE-PAINT_PRICE);
});

test('Q36 neon underglow: drawn under the car, stronger at night, coloured night light',()=>{
 const calls=[];const ctx=new Proxy({},{get:(t,k)=>k==='createRadialGradient'?()=>({addColorStop:(o,c)=>calls.push(c)}):()=>{},set:()=>true});
 const car={x:0,y:0,a:0,tuning:{neon:'verde'}};
 assert.equal(drawNeonUnderglow(ctx,car,0),true);const day=parseFloat(calls[0].split(',')[3]);calls.length=0;
 drawNeonUnderglow(ctx,car,1);const night=parseFloat(calls[0].split(',')[3]);
 assert.ok(night>day*2,'night '+night+' vs day '+day);assert.ok(calls[0].startsWith('rgba('+NEON_COLORS.verde));
 assert.equal(drawNeonUnderglow(ctx,{x:0,y:0,a:0,tuning:{neon:null}},1),false);
 assert.equal(neonNightGlows(car,0).glows.length,0);assert.equal(neonNightGlows(car,1).glows[0].color,NEON_COLORS.verde);
});

test('Q36 wired into the game: tuned profile when driving, panel sections',async()=>{
 const game=await readFile(new URL('./game.mjs',import.meta.url),'utf8');
 assert.ok(game.includes('profile:vehicleProfile(car)'));assert.ok(game.includes('pressed.brake,vehicleProfile(car)'));
 for(const s of ['VERNICE','PRESTAZIONI','NEON SOTTOSCOCCA','drawNeonUnderglow(c,v','neonNightGlows('])assert.ok(game.includes(s),s);
});
