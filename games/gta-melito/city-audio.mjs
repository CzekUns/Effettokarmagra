/* Q09: audio ambientale dinamico, tutto SINTETIZZATO con Web Audio (nessuna registrazione
 * o file audio di terzi). Motore del mezzo del giocatore (auto: ronzio basso; scooter/moto:
 * scoppiettio acuto), motori del traffico vicino con attenuazione e panorama stereo, clacson
 * (giocatore con H, NPC bloccati con limiti di frequenza), fondo urbano e pioggia (Q08).
 * Si avvia solo dopo un gesto dell'utente, tace in pausa, in banca e senza focus; volume e
 * muto salvati. La radio della macchina (car-radio.mjs) resta un elemento separato: quando
 * trasmette, motori e traffico si abbassano un po'.
 * BF10 (20/10/2026): il motore segue il cambio automatico di BF05 (marcia e giri da gearAt):
 * dentro la marcia il tono sale coi giri, al cambio scende e la voce cala un attimo; lo scooter
 * a variatore sale continuo. Uno strato di rumore (rombo, aria, rotolamento) cresce con marcia e
 * velocità. Due volumi separati e salvati: EFFETTI/AMBIENTE (tutto questo modulo) e RADIO/MUSICA
 * (applicato da game.mjs allo stream di car-radio.mjs); SUONI OFF zittisce entrambi. */
import {handlingProfile,gearAt} from './vehicle-handling.mjs?v=003';
export const AUDIO_STORAGE_KEY='gta-melito-audio-v1';
export const RADIO_DEFAULT_VOLUME=.52;
export const TRAFFIC_VOICES=4;
export const HEAR_RANGE=60;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const smooth=x=>{const t=clamp(x,0,1);return t*t*(3-2*t);};
/* BF10: carattere di ogni famiglia di mezzi. idle/red = frequenza (Hz) al minimo e al limitatore,
 * cut = filtro del motore ai giri bassi/alti, noise = rumore di marcia massimo (rombo/aria),
 * noiseCut = colore del rumore da fermo a velocità massima. Valori arcade, non registrazioni. */
const VOICES=Object.freeze({
 auto:{idle:34,red:118,cut:[820,1500],noise:.06,noiseCut:[220,1800]},
 furgone:{idle:30,red:96,cut:[700,1200],noise:.065,noiseCut:[200,1500]},
 ape:{idle:52,red:150,cut:[1500,2600],noise:.05,noiseCut:[300,1700]},   // ronzio del monocilindrico
 moto:{idle:58,red:230,cut:[2200,3400],noise:.075,noiseCut:[400,2600]}, // più aria sul casco
 scooter:{idle:70,red:200,cut:[2400,3000],noise:.045,noiseCut:[380,2200]}
});
export const ENGINE_VOICES=VOICES;
/* Suono del motore in un istante: marcia e giri dal profilo BF05 del mezzo. Restituisce frequenza,
 * filtro, marcia, giri (0..1 nella marcia), calo di cambio (shift <1 subito dopo un cambio),
 * livello relativo e rumore di marcia. Funzione pura. */
export function engineSound({vehicleType='car',model='',speed=0,throttle=0}={}){
 const profile=handlingProfile({vehicleType,model}),v=Number(speed)||0,s=Math.abs(v),gas=clamp(Number(throttle)||0,0,1);
 const kind=VOICES[profile.kind]?profile.kind:vehicleType==='motorcycle'?'moto':'auto',voice=VOICES[kind];
 const gears=profile.gears||[],count=gears.length+1,top=profile.top||40;
 let gear=1,rpm=0,revs=0,shift=1;
 if(v<-.05){
  // Retromarcia: una marcia sola, giri che salgono con la velocità in RETRO.
  gear=0;rpm=clamp(s/(profile.reverse||8),0,1);revs=.15+.6*rpm;
 }else if(!gears.length){
  // Variatore (scooter): giri che salgono presto e poi restano quasi fermi, fino al limitatore.
  rpm=clamp(s/top,0,1);revs=.55*smooth(s/(top*.25))+.45*rpm;
 }else{
  ({gear,rpm}=gearAt(profile,s));
  // Dopo un cambio i giri ripartono più in alto nelle marce lunghe (rapporti più vicini).
  const low=gear===1?0:Math.min(.75,.5+.06*(gear-2));
  revs=low+(1-low)*rpm;
  if(gear>1)shift=(profile.shiftDip??.82)+(1-(profile.shiftDip??.82))*smooth(rpm/.18);
 }
 revs=clamp(revs+.12*gas*(1-revs),0,1);
 const pace=clamp(s/top,0,1);
 const freq=(voice.idle+(voice.red-voice.idle)*revs)*(1+.12*pace);
 // Sotto gas il motore è più "aperto" (filtro più alto), in rilascio più morbido.
 const open=gas>.08?1+.3*gas:s>.5?.82:1;
 const cutoff=(voice.cut[0]+(voice.cut[1]-voice.cut[0])*revs)*open;
 const gearShare=gear<=0?0:count>1?(gear-1)/(count-1):pace;
 const noiseGain=voice.noise*Math.pow(pace,1.4)*(.45+.55*gearShare)*(gas>.08?1.15:.85);
 return {kind,freq,cutoff,gear,gears:count,rpm,revs,shift,
  noise:{gain:noiseGain,cutoff:voice.noiseCut[0]+(voice.noiseCut[1]-voice.noiseCut[0])*pace}};
}
// Compatibilità Q09: stessa firma di prima, ora con le marce di BF05.
export function engineTone(vehicleType,speed,throttle=0,model=''){
 return engineSound({vehicleType,model,speed,throttle});
}
/* Livelli voluti per questo istante (funzione pura, testabile senza Web Audio). */
export function audioMix(input){
 const {muted=false,volume=.7,focused=true,paused=false,interior=false,radioLive=false,player={},traffic=[],night=0,rain=0,skid=0}=input;
 const silent=muted||!focused||paused;
 const master=silent?0:clamp(volume,0,1);
 const duck=radioLive?.55:1;
 let engine={gain:0,freq:40,cutoff:900,kind:'auto'},drive={gain:0,cutoff:300};
 if(!interior&&player.inVehicle){
  const tone=engineSound(player);
  // BF10: subito dopo un cambio la voce cala un attimo (stesso shiftDip della spinta BF05).
  engine={...tone,gain:(.1+Math.min(1,Math.abs(player.speed||0)/30)*.12+(player.throttle||0)*.05)*tone.shift*duck};
  drive={gain:tone.noise.gain*(radioLive?.8:1),cutoff:tone.noise.cutoff};
 }
 const voices=interior?[]:traffic
  .map(v=>({v,d:Math.hypot(v.x-player.x,v.y-player.y)}))
  .filter(q=>q.d<HEAR_RANGE&&Math.abs(q.v.speed||0)>.5)
  .sort((a,b)=>a.d-b.d).slice(0,TRAFFIC_VOICES)
  .map(({v,d})=>{const tone=engineSound({vehicleType:v.vehicleType,model:v.model,speed:v.speed,throttle:.5});
   return {...tone,gain:.07*(1-d/HEAR_RANGE)**2*.85*tone.shift*(radioLive?.7:1),pan:clamp((v.x-player.x)/40,-1,1),distance:d};});
 return {master,engine,drive,voices,
  ambient:{gain:interior?.008:(.05-.025*clamp(night,0,1))},
  rain:{gain:interior?0:.07*clamp(rain,0,1)},
  // Q10: stridio delle gomme in sbandata, solo dal mezzo del giocatore.
  skid:{gain:interior||!player.inVehicle?0:.09*clamp(skid,0,1)}};
}
/* Clacson degli NPC: auto ferma da più di 2,5 s vicino al giocatore; al massimo uno ogni 5 s
 * in tutta la città e uno ogni 15 s per la stessa auto. */
export function pickNpcHorn(memory,vehicles,player,now){
 if(now-(memory.last??-1e9)<5)return null;
 for(const v of vehicles){
  if(!((v.stuck??v.stalled)>2.5)||Math.hypot(v.x-player.x,v.y-player.y)>45)continue;
  const lastForCar=memory.byCar.get(v)??-1e9;
  if(now-lastForCar<15)continue;
  memory.last=now;memory.byCar.set(v,now);return v;
 }
 return null;
}
/* BF10: {muted, effects, radio}. Le preferenze salvate prima di BF10 ({muted, volume}) restano
 * valide: il vecchio volume diventa quello degli effetti, la radio parte dal suo 52%. */
export function readAudioPrefs(storage){
 const level=(v,fallback)=>Number.isFinite(v)?Math.round(clamp(v,0,1)*100)/100:fallback;
 try{const p=JSON.parse(storage?.getItem(AUDIO_STORAGE_KEY)||'null');
  if(p&&typeof p==='object')return {muted:!!p.muted,effects:level(p.effects??p.volume,.7),radio:level(p.radio,RADIO_DEFAULT_VOLUME)};}catch(_){}
 return {muted:false,effects:.7,radio:RADIO_DEFAULT_VOLUME};
}
function noiseBuffer(ctx,seconds,brown){
 const length=Math.floor(ctx.sampleRate*seconds),buffer=ctx.createBuffer(1,length,ctx.sampleRate),data=buffer.getChannelData(0);
 let last=0,seed=1234567;
 for(let i=0;i<length;i++){
  seed=(seed*1103515245+12345)>>>0;const white=seed/4294967295*2-1;
  if(brown){last=(last+.02*white)/1.02;data[i]=last*3.5;}else data[i]=white*.6;
 }
 return buffer;
}
export function createCityAudio({contextFactory=()=>new (globalThis.AudioContext||globalThis.webkitAudioContext)(),storage=null,onRadioLevel=()=>{}}={}){
 const prefs=readAudioPrefs(storage);
 const radioLevel=()=>prefs.muted?0:prefs.radio;
 // Passi da 10 punti esatti (la radio parte da 52%: 62, 72, …).
 const step=(value,delta)=>Math.round(clamp(value+delta,0,1)*100)/100;
 let ctx=null,nodes=null,focused=true,lastMix=null;
 const hornMemory={last:-1e9,byCar:new WeakMap()};
 const persist=()=>{try{storage?.setItem(AUDIO_STORAGE_KEY,JSON.stringify(prefs));}catch(_){}};
 // Il browser può rifiutare resume/suspend (contesto chiuso o non avviabile): si ignora, l'audio resta muto.
 const safe=call=>{try{Promise.resolve(call?.()).catch(()=>{});}catch(_){}};
 const resume=()=>safe(()=>ctx.resume?.()),suspend=()=>safe(()=>ctx.suspend?.());
 const set=(param,value)=>{if(!param)return;if(param.setTargetAtTime)param.setTargetAtTime(value,ctx.currentTime,.06);else param.value=value;};
 function build(){
  const master=ctx.createGain();master.gain.value=0;
  // BF10: un compressore leggero prima dell'uscita evita la saturazione quando suonano tutti insieme.
  if(ctx.createDynamicsCompressor){
   const limiter=ctx.createDynamicsCompressor(),tune=(param,value)=>{if(param)param.value=value;};
   tune(limiter.threshold,-10);tune(limiter.knee,8);tune(limiter.ratio,6);tune(limiter.attack,.005);tune(limiter.release,.2);
   master.connect(limiter);limiter.connect(ctx.destination);
  }else master.connect(ctx.destination);
  const voice=(type,cutoff,withPan)=>{
   const osc=ctx.createOscillator(),sub=ctx.createOscillator(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();
   osc.type=type;sub.type='square';filter.type='lowpass';filter.frequency.value=cutoff;gain.gain.value=0;
   osc.connect(filter);sub.connect(filter);filter.connect(gain);
   let pan=null;
   if(withPan&&ctx.createStereoPanner){pan=ctx.createStereoPanner();gain.connect(pan);pan.connect(master);}
   else gain.connect(master);
   osc.start();sub.start();
   return {osc,sub,filter,gain,pan};
  };
  const loop=(brown,filterType,freq,q=.7)=>{
   const src=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();
   src.buffer=noiseBuffer(ctx,2,brown);src.loop=true;filter.type=filterType;filter.frequency.value=freq;filter.Q.value=q;gain.gain.value=0;
   src.connect(filter);filter.connect(gain);gain.connect(master);src.start();
   return {src,filter,gain};
  };
  nodes={master,engine:voice('sawtooth',900,false),voices:[...Array(TRAFFIC_VOICES)].map(()=>voice('sawtooth',700,true)),
   ambient:loop(true,'lowpass',380),rain:loop(false,'bandpass',2600,.6),skid:loop(false,'bandpass',1700,4),
   drive:loop(true,'lowpass',300,.9)};
 }
 const api={
  // Da chiamare dentro un gesto dell'utente (tocco, clic, tasto): prima nessun contesto audio.
  start(){
   if(!ctx){try{ctx=contextFactory();build();}catch(_){ctx=null;nodes=null;return false;}}
   if(focused&&!prefs.muted&&ctx.state==='suspended')resume();
   return true;
  },
  get started(){return !!ctx;},
  // Solo lettura, per prove e diagnosi: stato del contesto e ultimi livelli calcolati.
  get contextState(){return ctx?.state||'none';},
  get lastMix(){return lastMix;},
  get muted(){return prefs.muted;},
  // EFFETTI/AMBIENTE (nome storico: volume).
  get volume(){return prefs.effects;},
  get effectsVolume(){return prefs.effects;},
  get radioVolume(){return prefs.radio;},
  // Livello da dare allo stream della radio: 0 con SUONI OFF.
  get radioLevel(){return radioLevel();},
  toggleMuted(){prefs.muted=!prefs.muted;persist();if(ctx){if(prefs.muted)suspend();else if(focused)resume();}onRadioLevel(radioLevel());return prefs.muted;},
  changeVolume(delta){prefs.effects=step(prefs.effects,delta);persist();return prefs.effects;},
  changeRadioVolume(delta){prefs.radio=step(prefs.radio,delta);persist();onRadioLevel(radioLevel());return prefs.radio;},
  focus(hasFocus){focused=!!hasFocus;if(!ctx)return;if(!focused)suspend();else if(!prefs.muted)resume();},
  update(input){
   const mix=audioMix({...input,muted:prefs.muted,volume:prefs.effects,focused});lastMix=mix;
   if(!ctx||!nodes)return mix;
   set(nodes.master.gain,mix.master);
   const e=nodes.engine;set(e.gain.gain,mix.engine.gain);set(e.osc.frequency,mix.engine.freq);set(e.sub.frequency,mix.engine.freq/2);set(e.filter.frequency,mix.engine.cutoff);
   nodes.voices.forEach((n,i)=>{const v=mix.voices[i];
    set(n.gain.gain,v?v.gain:0);if(v){set(n.osc.frequency,v.freq);set(n.sub.frequency,v.freq/2);set(n.filter.frequency,v.cutoff*.8);if(n.pan)set(n.pan.pan,v.pan);}});
   set(nodes.ambient.gain.gain,mix.ambient.gain);set(nodes.rain.gain.gain,mix.rain.gain);set(nodes.skid.gain.gain,mix.skid.gain);
   set(nodes.drive.gain.gain,mix.drive.gain);set(nodes.drive.filter.frequency,mix.drive.cutoff);
   return mix;
  },
  // Clacson a due toni (auto) o a un tono più acuto (scooter); pan e volume dalla posizione.
  horn(kind='auto',pan=0,level=1){
   if(!ctx||!nodes||prefs.muted||!focused)return false;
   const t=ctx.currentTime,gain=ctx.createGain(),tones=kind==='moto'?[610]:[405,510];
   gain.gain.setValueAtTime(0,t);gain.gain.linearRampToValueAtTime(.16*clamp(level,0,1),t+.02);gain.gain.setValueAtTime(.16*clamp(level,0,1),t+.3);gain.gain.linearRampToValueAtTime(0,t+.42);
   let out=gain;if(ctx.createStereoPanner){const p=ctx.createStereoPanner();p.pan.value=clamp(pan,-1,1);gain.connect(p);out=p;}
   out.connect(nodes.master);
   for(const f of tones){const o=ctx.createOscillator();o.type='square';o.frequency.value=f;o.connect(gain);o.start(t);o.stop(t+.45);}
   return true;
  },
  npcHorns(vehicles,player,now){
   const v=pickNpcHorn(hornMemory,vehicles,player,now);
   if(!v)return null;
   const d=Math.hypot(v.x-player.x,v.y-player.y);
   api.horn(v.vehicleType==='motorcycle'?'moto':'auto',clamp((v.x-player.x)/40,-1,1),(1-d/45)*.8);
   return v;
  }
 };
 return api;
}
