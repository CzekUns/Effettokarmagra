/* Q10: guida arcade 2.0 — profili per mezzo e sbandate recuperabili.
 * BF05 (20/10/2026): trasmissione automatica arcade. La spinta non è più costante: parte
 * morbida da fermo, cresce nei primi metri e cala man mano che ci si avvicina alla velocità
 * massima, con cambi marcia impliciti (una breve attenuazione della spinta subito dopo ogni
 * "cambio", senza mai far saltare la velocità). Nessun pulsante marce.
 * I numeri sono una resa ARCADE del carattere dei modelli (unità del gioco, l'HUD le mostra
 * ×3,6 come km/h), non dati tecnici dei veicoli reali. Usata sia dal veicolo guidato sia dagli
 * NPC (roads.mjs), così un'Ape è lenta per tutti. */
const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
const smooth=x=>{const t=clamp(x,0,1);return t*t*(3-2*t);};
const freeze=o=>Object.freeze(o);
// accel = spinta di picco (unità/s²); launch = quota di spinta da fermo; launchSpeed = velocità a cui
// la spinta è piena; taperExp/taperFloor = come cala vicino alla massima; gears = cambi impliciti
// (quote della velocità massima); reverseAccel = spinta in RETRO.
const DRIVE_DEFAULTS={launch:.42,launchSpeed:5,taperExp:1.7,taperFloor:.06,gears:[.2,.38,.56,.76],shiftDip:.82,reverseAccel:8};
export const CAR_HANDLING=freeze({kind:'auto',...DRIVE_DEFAULTS,accel:12.5,brake:48,coast:7,handbrake:.025,top:39,reverse:12,corner:9,cornerDecel:25,
 steer:2.4,steerFall:.028,steerMin:1.15,steerLow:7,steerLowMin:.4,stopSteer:.25,grip:7,handbrakeGrip:1.1,maxSlip:.85,scrub:.55});
// Moto generica (modello non riconosciuto).
export const MOTORCYCLE_HANDLING=freeze({kind:'moto',...DRIVE_DEFAULTS,launch:.5,launchSpeed:4,gears:[.22,.42,.62,.8],accel:15,brake:52,coast:9,handbrake:.011,top:33,reverse:4,reverseAccel:5,corner:12,cornerDecel:34,
 steer:2.9,steerFall:.042,steerMin:1.05,steerLow:5,steerLowMin:.35,stopSteer:.28,grip:8,handbrakeGrip:1.8,maxSlip:.7,scrub:.6});
// Scooter: automatico a variatore, spunto dolce e poca velocità, sterzo molto pronto.
export const SCOOTER_HANDLING=freeze({...MOTORCYCLE_HANDLING,kind:'scooter',launch:.55,launchSpeed:3,gears:[],accel:11,brake:46,top:27,corner:9,steer:3.15,steerFall:.05,steerMin:1.3,steerLow:4,grip:8.6,handbrakeGrip:2.2,maxSlip:.6,scrub:.7});
// Moto: la più pronta in ripresa, frena forte, ad alta velocità sterza meno.
export const MOTO_HANDLING=freeze({...MOTORCYCLE_HANDLING,kind:'moto',accel:17.5,brake:56,top:37,corner:13,steer:2.75,steerFall:.045,steerMin:.95,steerLow:5.5,grip:8,handbrakeGrip:1.6,maxSlip:.72,scrub:.6});
// Ape a tre ruote e furgoncini commerciali: lenti in partenza e in punta, frenano meno.
// Q16: un triciclo corto gira molto più stretto di un'auto, anche a passo d'uomo (steer/steerLow).
export const APE_HANDLING=freeze({...CAR_HANDLING,kind:'ape',launch:.38,launchSpeed:3,gears:[.3,.6],accel:6,brake:34,top:17,reverse:6,reverseAccel:5,corner:7,steer:2.9,steerLow:4.5,grip:5.8,maxSlip:.6});
export const VAN_HANDLING=freeze({...CAR_HANDLING,kind:'furgone',launch:.4,gears:[.24,.46,.7],accel:8,brake:38,top:26,reverse:8,reverseAccel:6,corner:8,steer:2.05,steerMin:1,grip:6.4,maxSlip:.7});
// Q18: refuse truck — heavy and slow, brakes long, steers wide (NPCs follow the lanes, the player feels the size).
export const TRUCK_HANDLING=freeze({...CAR_HANDLING,kind:'camion',launch:.34,launchSpeed:3,gears:[.18,.36,.56,.78],accel:5.5,brake:30,top:21,reverse:6,reverseAccel:4.5,corner:6,steer:1.65,steerMin:.8,steerLow:6,grip:5.6,maxSlip:.5});
// Q19: tow truck — a light truck, quicker than the refuse truck; urban bus — long and slow, wide turns.
export const TOW_HANDLING=freeze({...CAR_HANDLING,kind:'carro-attrezzi',launch:.36,launchSpeed:3,gears:[.2,.4,.6,.8],accel:7,brake:34,top:24,reverse:7,reverseAccel:5,corner:7,steer:1.85,steerMin:.9,steerLow:5.5,grip:6,maxSlip:.55});
export const BUS_HANDLING=freeze({...CAR_HANDLING,kind:'autobus',launch:.32,launchSpeed:3,gears:[.2,.42,.66],accel:4.8,brake:28,top:19,reverse:5,reverseAccel:4,corner:5.5,steer:1.45,steerMin:.7,steerLow:6.5,grip:5.4,maxSlip:.45});
const CAR_MODELS={
 'punto-188':{accel:14,top:41,brake:50},
 'ypsilon-2003':{accel:13.2,top:40,grip:7.4},
 // Lotto 1: Grande Punto drives like the Punto 188, Ypsilon III like the Ypsilon 2003.
 'grande-punto-2005':{accel:14,top:41,brake:50},
 'ypsilon-2011':{accel:13.2,top:40,grip:7.4},
 // Lotto 5: Tipo, a compact saloon-sized hatchback, slightly faster and steadier than the Punto 188;
 // 500L, tall and heavy mini-MPV, slower and softer in the corners.
 'tipo-hatchback-2016':{accel:14.4,top:43,brake:52,grip:7.6},
 'fiat-500l-2012':{accel:12,top:38,brake:46,steer:2.25,grip:6.8},
 // Lotto 6: Clio IV drives like the Grande Punto (same class, a hair lighter); Golf VII a bit faster and steadier.
 'clio-iv-2012':{accel:14.2,top:41,brake:50},
 'golf-vii-2012':{accel:14.8,top:44,brake:53,grip:7.8},
 // Lotto 7: Corsa E and Peugeot 208 drive like the Clio IV (same supermini class).
 'corsa-e-2014':{accel:14.2,top:41,brake:50},
 'peugeot-208-2012':{accel:14.2,top:41,brake:50},
 // Lotto 8: Qashqai J11 and Duster, taller and heavier crossovers: slower off the line, top 40, a slightly
 // slower steering and the standard grip 7.0 (they lean a bit in the corners).
 'qashqai-j11-2013':{accel:12.6,top:40,brake:48,steer:2.3,grip:7},
 'duster-2010':{accel:12.2,top:40,brake:47,steer:2.3,grip:7},
 // Lotto 9: Doblò II and Fiorino III, light work vans: slower than the hatchbacks, top 38, softer steering and grip
 // (loaded cargo bay), but still «auto» for the traffic and the parking strips, not VAN_HANDLING of the market vans.
 'doblo-2010':{accel:11.5,top:38,brake:46,steer:2.3,grip:6.6},
 'fiorino-2008':{accel:11.5,top:38,brake:46,steer:2.3,grip:6.6},
 'seicento-1998':{accel:10.4,top:35,steer:2.6,brake:44},
 'fiat-500-2007':{accel:11.5,top:37,steer:2.55},
 'fiat-uno-1983':{accel:9.6,top:36,brake:40,grip:6.2,launch:.38},
 'smart-fortwo-2007':{accel:10.8,top:34,steer:2.7,grip:6.6,gears:[.24,.46,.7]},
 'panda-fire':{accel:10,top:35,brake:42,grip:6.3,launch:.38},
 'panda-modern':{}
};
const carProfiles=new Map(Object.entries(CAR_MODELS).map(([k,v])=>[k,freeze({...CAR_HANDLING,...v,model:k})]));
export function handlingProfile(vehicle){
 const model=String(vehicle?.model||'');
 if(vehicle?.vehicleType==='motorcycle')return model.startsWith('moto-scooter')?SCOOTER_HANDLING:model.startsWith('moto-moto')?MOTO_HANDLING:MOTORCYCLE_HANDLING;
 // Ape (traffico e mercato) e furgoni ambulanti / del fritto.
 if(model.startsWith('ape-'))return APE_HANDLING;
 if(model.startsWith('nettezza-'))return TRUCK_HANDLING;
 if(model.startsWith('attrezzi-'))return TOW_HANDLING;
 if(model.startsWith('autobus-'))return BUS_HANDLING;
 if(model.startsWith('furgone')||model.startsWith('food-')||model.startsWith('corriere-'))return VAN_HANDLING;
 for(const [key,profile] of carProfiles)if(model.startsWith(key))return profile;
 return CAR_HANDLING;
}
// Marcia implicita e quanto si è dentro la marcia (0 appena cambiato, 1 al cambio successivo).
export function gearAt(profile,speed){
 const p=profile||CAR_HANDLING,v=Math.max(0,Math.abs(Number(speed)||0)),limits=(p.gears||[]).map(g=>g*p.top);
 let gear=1,low=0;
 for(const limit of limits){if(v<limit)return {gear,rpm:(v-low)/Math.max(.001,limit-low)};gear++;low=limit;}
 return {gear,rpm:clamp((v-low)/Math.max(.001,p.top-low),0,1)};
}
/* Spinta disponibile (unità/s²) con l'acceleratore tutto premuto alla velocità data:
 * partenza morbida, spinta piena dopo i primi metri, calo verso la massima, piccola
 * attenuazione appena dopo ogni cambio implicito. Il bagnato limita la trazione in partenza. */
export function driveForce(profile,speed,wet=0){
 const p=profile||CAR_HANDLING,v=Math.max(0,Number(speed)||0);
 const launch=p.launch+(1-p.launch)*smooth(v/p.launchSpeed);
 const taper=Math.max(p.taperFloor,1-Math.pow(clamp(v/p.top,0,1),p.taperExp));
 const g=gearAt(p,v),shift=g.gear>1&&(p.gears||[]).length?p.shiftDip+(1-p.shiftDip)*smooth(g.rpm/.18):1;
 const traction=1-.22*clamp(wet,0,1)*(1-smooth(v/(p.launchSpeed*2)));
 return p.accel*launch*taper*shift*traction;
}
/* Velocità e direzione del muso: acceleratore (cambio automatico), RETRO, freno di servizio,
 * freno a mano, rilascio, curve e sterzo. Il bagnato (0..1) allunga un po' la frenata. */
export function stepVehicle(speed,angle,axis,handbrake,dt,serviceBrake=false,profile=CAR_HANDLING,wet=0){
 const p=profile||CAR_HANDLING;
 const x=clamp(Number(axis?.x)||0,-1,1),y=clamp(Number(axis?.y)||0,-1,1);
 const elapsed=clamp(Number(dt)||0,0,.05);
 const throttle=y<-.08?-y:y>.18?-y:0;
 if(serviceBrake)speed-=Math.sign(speed)*Math.min(Math.abs(speed),p.brake*(1-.18*clamp(wet,0,1))*elapsed);
 else if(throttle>.08){
  // Gas mentre si va indietro: prima si ferma (come un freno motore deciso), poi parte.
  if(speed<0)speed=Math.min(0,speed+p.brake*.5*throttle*elapsed);
  else speed+=driveForce(p,speed,wet)*throttle*elapsed;
 }else if(throttle<-.08){
  // RETRO mentre si va avanti: rallenta deciso; da fermo arretra con spinta morbida.
  if(speed>0)speed=Math.max(0,speed+p.brake*.5*throttle*elapsed);
  else speed+=p.reverseAccel*(.5+.5*smooth(-speed/2.5))*throttle*elapsed;
 }
 else speed-=Math.sign(speed)*Math.min(Math.abs(speed),p.coast*elapsed);
 if(handbrake)speed*=Math.pow(p.handbrake,elapsed);
 speed=clamp(speed,-p.reverse,p.top);
 // Rallenta un po' nelle curve strette senza bloccarsi di colpo.
 const cornerLimit=p.top-p.corner*x*x;
 if(speed>cornerLimit)speed=Math.max(cornerLimit,speed-p.cornerDecel*elapsed);
 if(Math.abs(x)>.08&&Math.abs(speed)>p.stopSteer){
  const turnRate=clamp(p.steer-Math.abs(speed)*p.steerFall,p.steerMin,p.steer)*clamp(Math.abs(speed)/p.steerLow,p.steerLowMin,1);
  angle+=x*turnRate*elapsed*(speed<0?-1:1);
 }
 return {speed,angle};
}
/* NPC: velocità di crociera adattata al mezzo (un'Ape non va come una Punto) e passo di
 * velocità verso l'obiettivo con la stessa spinta del giocatore: dopo uno stop ripartono piano. */
export const NPC_CRUISE_SHARE=.36;
export function npcCruise(profile,cruise){return Math.min(Number(cruise)||0,(profile||CAR_HANDLING).top*NPC_CRUISE_SHARE);}
export function npcSpeedStep(profile,current,target,dt,wet=0){
 const p=profile||CAR_HANDLING,v=Math.max(0,Number(current)||0),goal=Math.max(0,Number(target)||0),elapsed=clamp(Number(dt)||0,0,.1);
 if(v<goal)return Math.min(goal,v+driveForce(p,v,wet)*.8*elapsed);
 return Math.max(goal,v-p.brake*.6*elapsed);
}
const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
/* Aderenza: la direzione di marcia (travel) insegue il muso (angle). Freno a mano e bagnato
 * la fanno restare indietro: il mezzo scivola di lato (sbandata), perde un po' di velocità e
 * torna in linea da solo appena riprende aderenza. In retromarcia o quasi fermo non scivola. */
export function applyGrip(state,{angle,speed,dt,handbrake=false,profile=CAR_HANDLING,wet=0,steer=0}){
 const p=profile||CAR_HANDLING,elapsed=clamp(Number(dt)||0,0,.05);
 if(!(speed>2.5)){return {travel:angle,slip:0,speed,sliding:false};}
 let travel=Number.isFinite(state?.travel)?state.travel:angle;
 const fast=clamp((speed-12)/20,0,1);
 let grip=p.grip*(1-.38*clamp(wet,0,1))*(1-.45*fast*Math.abs(steer));
 if(handbrake)grip=Math.min(grip,p.handbrakeGrip);
 let slip=wrap(angle-travel);
 travel=wrap(travel+slip*Math.min(1,grip*elapsed));
 slip=wrap(angle-travel);
 // Mai un testacoda completo: oltre il limite la marcia viene trascinata col muso.
 if(Math.abs(slip)>p.maxSlip){travel=wrap(angle-Math.sign(slip)*p.maxSlip);slip=Math.sign(slip)*p.maxSlip;}
 const scrubbed=speed*(1-Math.min(.5,Math.abs(Math.sin(slip))*p.scrub*elapsed));
 return {travel,slip,speed:scrubbed,sliding:Math.abs(slip)>.12};
}
