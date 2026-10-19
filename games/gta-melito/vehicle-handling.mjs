/* Q10: guida arcade 2.0 — profili per mezzo e sbandate recuperabili.
 * stepVehicle è la stessa fisica di stepDriving/stepMotorcycle (driving-controls.mjs,
 * motorcycles.mjs) con i numeri presi da un profilo: senza profilo il comportamento
 * resta identico a prima. I profili sono una resa arcade del carattere dei modelli,
 * non dati tecnici dei veicoli reali. */
const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
const freeze=o=>Object.freeze(o);
// Valori storici dell'auto (driving-controls.mjs fino alla v=095).
export const CAR_HANDLING=freeze({kind:'auto',accel:46,brake:62,coast:12,handbrake:.025,top:40,reverse:12,corner:9,cornerDecel:25,
 steer:2.4,steerFall:.028,steerMin:1.15,steerLow:7,steerLowMin:.4,stopSteer:.25,grip:7,handbrakeGrip:1.1,maxSlip:.85,scrub:.55});
// Valori storici della moto (motorcycles.mjs fino alla v=003), usati se il modello non è noto.
export const MOTORCYCLE_HANDLING=freeze({kind:'moto',accel:39,brake:65,coast:16,handbrake:.011,top:33,reverse:4,corner:12,cornerDecel:34,
 steer:2.9,steerFall:.042,steerMin:1.05,steerLow:5,steerLowMin:.35,stopSteer:.28,grip:8,handbrakeGrip:1.8,maxSlip:.7,scrub:.6});
// Scooter: spunto dolce, velocità massima bassa, sterzo molto pronto, poca voglia di derapare.
export const SCOOTER_HANDLING=freeze({...MOTORCYCLE_HANDLING,kind:'scooter',accel:32,brake:60,top:27,corner:9,steer:3.15,steerFall:.05,steerMin:1.3,steerLow:4,grip:8.6,handbrakeGrip:2.2,maxSlip:.6,scrub:.7});
// Moto: più spinta e velocità, frena forte, ad alta velocità sterza meno.
export const MOTO_HANDLING=freeze({...MOTORCYCLE_HANDLING,kind:'moto',accel:45,brake:70,top:37,corner:13,steer:2.75,steerFall:.045,steerMin:.95,steerLow:5.5,grip:8,handbrakeGrip:1.6,maxSlip:.72,scrub:.6});
const CAR_MODELS={
 'punto-188':{accel:48,top:42},
 'ypsilon-2003':{accel:47,top:41,grip:7.4},
 'seicento-1998':{accel:42,top:37,steer:2.6},
 'fiat-500-2007':{accel:44,top:38,steer:2.55},
 'fiat-uno-1983':{accel:40,top:37,brake:54,grip:6.2},
 'smart-fortwo-2007':{accel:43,top:36,steer:2.7,grip:6.6},
 'panda-fire':{accel:40,top:36,brake:55,grip:6.3},
 'panda-modern':{}
};
const carProfiles=new Map(Object.entries(CAR_MODELS).map(([k,v])=>[k,freeze({...CAR_HANDLING,...v,model:k})]));
export function handlingProfile(vehicle){
 const model=String(vehicle?.model||'');
 if(vehicle?.vehicleType==='motorcycle')return model.startsWith('moto-scooter')?SCOOTER_HANDLING:model.startsWith('moto-moto')?MOTO_HANDLING:MOTORCYCLE_HANDLING;
 for(const [key,profile] of carProfiles)if(model.startsWith(key))return profile;
 return CAR_HANDLING;
}
/* Velocità e direzione del muso: acceleratore, freno di servizio, freno a mano, rilascio,
 * curve e sterzo. Il bagnato (0..1) allunga un po' la frenata. */
export function stepVehicle(speed,angle,axis,handbrake,dt,serviceBrake=false,profile=CAR_HANDLING,wet=0){
 const p=profile||CAR_HANDLING;
 const x=clamp(Number(axis?.x)||0,-1,1),y=clamp(Number(axis?.y)||0,-1,1);
 const elapsed=clamp(Number(dt)||0,0,.05);
 const throttle=y<-.08?-y:y>.18?-y:0;
 if(serviceBrake)speed-=Math.sign(speed)*Math.min(Math.abs(speed),p.brake*(1-.18*clamp(wet,0,1))*elapsed);
 else if(Math.abs(throttle)>.08)speed+=p.accel*elapsed*throttle;
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
