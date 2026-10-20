import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {DAMAGE_RULES,addDamage,damageLevel,damagePoints,damagedProfile,repairCost,payRepair,repairMessage,healOutOfView,
 drawVehicleDamage,placeWorkshop,nearWorkshop,drawWorkshop} from './vehicle-damage.mjs';
import {CAR_HANDLING} from './vehicle-handling.mjs';
import {freshProgress} from './campaign.mjs';

const car=(extra={})=>({x:0,y:0,a:0,model:'panda-modern-white',vehicleType:'car',...extra});

test('Q23 levels: a light knock scratches, repeated or strong hits dent and then badly damage; never over 100',()=>{
 const v=car();
 assert.equal(damageLevel(v),'integro');
 assert.equal(addDamage(v,DAMAGE_RULES.minSpeed-.1,{x:6,y:0}),0,'below the impact threshold nothing happens');
 addDamage(v,12,{x:6,y:0},{clock:0});
 assert.ok(damagePoints(v)>10&&damageLevel(v)==='integro','a light knock leaves only a scratch: '+damagePoints(v));
 addDamage(v,12,{x:6,y:0},{clock:.1});
 assert.equal(damagePoints(v)<25,true,'same crash counted once within the cooldown');
 addDamage(v,16,{x:6,y:0},{clock:1});
 assert.equal(damageLevel(v),'ammaccato');
 for(let i=0;i<10;i++)addDamage(v,40,{x:0,y:6},{clock:2+i});
 assert.equal(damageLevel(v),'grave');assert.equal(damagePoints(v),DAMAGE_RULES.max);
 assert.ok(v.damage.marks.length<=DAMAGE_RULES.maxMarks+1,'a bounded number of marks (+ glass)');
 assert.equal(addDamage({x:0,y:0,a:0,vehicleType:'motorcycle'},30,{x:5,y:0}),0,'two wheels: no damage (declared limit)');
});

test('Q23 marks: on the side that was hit, in normalized sprite coordinates, cracked glass after a strong front hit',()=>{
 const front=car(),rear=car(),side=car();
 addDamage(front,30,{x:8,y:0},{clock:0});
 addDamage(rear,20,{x:-8,y:0},{clock:0});
 addDamage(side,20,{x:0,y:8},{clock:0});
 const m=q=>q.damage.marks.find(k=>k.kind!=='vetro');
 assert.ok(m(front).v<-.5,'front hit marks the bonnet (sprite top)');
 assert.ok(m(rear).v>.5,'rear hit marks the boot');
 assert.ok(m(side).u>.5&&Math.abs(m(side).v)<.6,'hit from the right side marks the right flank');
 for(const v of [front,rear,side])for(const k of v.damage.marks)assert.ok(Math.abs(k.u)<=1&&Math.abs(k.v)<=1,'normalized, follows any vehicle scale');
 assert.ok(front.damage.marks.some(k=>k.kind==='vetro'),'strong front hit cracks the windscreen');
 assert.equal(rear.damage.marks.some(k=>k.kind==='vetro'),false);
});

test('Q23 performance: only badly damaged cars lose some acceleration and top speed, profile cached',()=>{
 const v=car();
 assert.equal(damagedProfile(CAR_HANDLING,v),CAR_HANDLING,'intact: same profile');
 addDamage(v,30,{x:6,y:0},{clock:0});
 assert.equal(damagedProfile(CAR_HANDLING,v),CAR_HANDLING,'dented: still the same');
 v.damage.points=90;
 const p=damagedProfile(CAR_HANDLING,v);
 assert.ok(p.top<CAR_HANDLING.top&&p.top>=CAR_HANDLING.top*.8,'moderate top-speed loss');
 assert.ok(p.accel<CAR_HANDLING.accel&&p.accel>=CAR_HANDLING.accel*.75);
 assert.equal(p.steer,CAR_HANDLING.steer,'steering untouched: still drivable');
 assert.equal(damagedProfile(CAR_HANDLING,v),p,'cached, no allocation every frame');
});

test('Q23 repair at the game workshop: costs money from the campaign balance, fails without enough money',()=>{
 const v=car();addDamage(v,40,{x:6,y:0},{clock:0});
 const cost=repairCost(v);assert.ok(cost>DAMAGE_RULES.repairBase,'cost grows with damage: '+cost);
 const poor={...freshProgress(),money:cost-1};
 const no=payRepair(poor,v);
 assert.equal(no.ok,false);assert.equal(poor.money,cost-1);assert.ok(damagePoints(v)>0);
 assert.match(repairMessage(no),/Fondi insufficienti/);
 const rich={...freshProgress(),money:100};
 const ok=payRepair(rich,v);
 assert.equal(ok.ok,true);assert.equal(rich.money,100-cost);assert.equal(rich.shop.spent,cost,'recorded in the saved spending');
 assert.equal(damageLevel(v),'integro');assert.equal(repairCost(v),0);
 assert.equal(payRepair(rich,v).reason,'integro');
});

test('Q23 NPC cars heal only after a while out of view, never in front of the player, the player car never',()=>{
 const npc=car({x:500,y:500}),mine=car({x:510,y:500});
 addDamage(npc,30,{x:506,y:500},{clock:0});addDamage(mine,30,{x:516,y:500},{clock:0});
 const inView=[400,400,600,600],away=[0,0,10,10];
 for(let i=0;i<100;i++)healOutOfView([npc,mine],inView,.5,mine);
 assert.ok(npc.damage,'in view: stays damaged');
 healOutOfView([npc,mine],away,DAMAGE_RULES.npcHeal-1,mine);assert.ok(npc.damage);
 healOutOfView([npc,mine],away,2,mine);
 assert.equal(npc.damage,null,'healed out of view');assert.ok(mine.damage,'the player car keeps its damage until repaired');
});

test('Q23 drawing: marks and smoke drawn in sprite coordinates, nothing for intact cars; workshop placed beside a road',()=>{
 const calls=[];const ctx=new Proxy({},{get:(t,k)=>k in t?t[k]:(...a)=>{calls.push(k);},set:(t,k,v)=>{t[k]=v;return true;}});
 const v=car();
 assert.equal(drawVehicleDamage(ctx,v,0,0,0,[5.5,8.75],0),false,'intact: no drawing');
 addDamage(v,40,{x:8,y:0},{clock:0});v.damage.points=90;
 assert.equal(drawVehicleDamage(ctx,v,10,20,1,[5.5,8.75],1.3),true);
 assert.ok(calls.includes('rotate')&&calls.includes('stroke')&&calls.includes('arc'),'scratches and smoke drawn');
 const road=(x,y)=>({x,y:0,a:0,width:10});
 const walk=(x,y)=>y>5.5&&y<9;
 const w=placeWorkshop(road,walk,{x:100,y:3});
 assert.ok(w&&walk(w.x,w.y)&&w.label==='OFFICINA DI GIOCO','on the pavement beside the road');
 assert.equal(nearWorkshop(w,car({x:w.roadX+2,y:w.roadY})),true);
 assert.equal(nearWorkshop(w,car({x:w.roadX+30,y:w.roadY})),false);
 drawWorkshop(ctx,w,[0,-50,200,50]);
});

test('Q23 game wiring: hits damage vehicles, walls dent, player profile, drawing, repair with E, NPC healing',async()=>{
 const game=await readFile(new URL('./game.mjs',import.meta.url),'utf8');
 assert.match(game,/import \{[^}]*addDamage[^}]*\} from '\.\/vehicle-damage\.mjs\?v=\d+'/);
 assert.match(game,/addDamage\(target,speed,source,\{clock:state\.clock\}\);\n\s*addDamage\(source,speed,target,\{factor:DAMAGE_RULES\.strikerFactor/,'vehicle-vehicle hits in impactTraffic');
 assert.match(game,/if\(!way&&Math\.abs\(speed\)>=IMPACT_MIN_SPEED\)addDamage\(car,/,'walls and bollards dent the player car');
 assert.equal((game.match(/damagedProfile\((?:handlingProfile|vehicleProfile)\(car\),car\)/g)||[]).length,2,'driving and grip use the damaged profile');
 assert.match(game,/if\(vehicle\?\.damage\)drawVehicleDamage\(c,vehicle,x,y,a,carDrawSize\(model\),state\.clock\);/);
 assert.match(game,/healOutOfView\(\[\.\.\.state\.traffic,\.\.\.state\.cars\],visibleBounds\(\)/);
 assert.match(game,/const result=payRepair\(state\.progress,vehicle\);\n\s*if\(result\.ok\)\{saveProgress\(localStorage,state\.progress\);/,'repair saved with the campaign');
 assert.equal((game.match(/createWorkshop\(\);createParkingBays\(\);/g)||[]).length,2,'workshop on load and on the width switch, before the stalls');
 assert.match(game,/why:'officina'/,'no stalls in front of the workshop');
 assert.match(game,/drawWorkshop\(c,state\.workshop,/);
});
