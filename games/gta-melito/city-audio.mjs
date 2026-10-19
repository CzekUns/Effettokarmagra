/* Q09: audio ambientale dinamico, tutto SINTETIZZATO con Web Audio (nessuna registrazione
 * o file audio di terzi). Motore del mezzo del giocatore (auto: ronzio basso; scooter/moto:
 * scoppiettio acuto), motori del traffico vicino con attenuazione e panorama stereo, clacson
 * (giocatore con H, NPC bloccati con limiti di frequenza), fondo urbano e pioggia (Q08).
 * Si avvia solo dopo un gesto dell'utente, tace in pausa, in banca e senza focus; volume e
 * muto salvati. La radio della macchina (car-radio.mjs) resta un elemento separato: quando
 * trasmette, motori e traffico si abbassano un po'. */
export const AUDIO_STORAGE_KEY='gta-melito-audio-v1';
export const TRAFFIC_VOICES=4;
export const HEAR_RANGE=60;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function engineTone(vehicleType,speed,throttle=0){
 const s=Math.abs(Number(speed)||0),moto=vehicleType==='motorcycle';
 return moto?{kind:'moto',freq:62+s*5.2+throttle*18,cutoff:2600}:{kind:'auto',freq:34+s*2.6+throttle*9,cutoff:900};
}
/* Livelli voluti per questo istante (funzione pura, testabile senza Web Audio). */
export function audioMix(input){
 const {muted=false,volume=.7,focused=true,paused=false,interior=false,radioLive=false,player={},traffic=[],night=0,rain=0}=input;
 const silent=muted||!focused||paused;
 const master=silent?0:clamp(volume,0,1);
 const duck=radioLive?.55:1;
 let engine={gain:0,freq:40,cutoff:900,kind:'auto'};
 if(!interior&&player.inVehicle){
  const tone=engineTone(player.vehicleType,player.speed,player.throttle);
  engine={...tone,gain:(.1+Math.min(1,Math.abs(player.speed||0)/30)*.12+(player.throttle||0)*.05)*duck};
 }
 const voices=interior?[]:traffic
  .map(v=>({v,d:Math.hypot(v.x-player.x,v.y-player.y)}))
  .filter(q=>q.d<HEAR_RANGE&&Math.abs(q.v.speed||0)>.5)
  .sort((a,b)=>a.d-b.d).slice(0,TRAFFIC_VOICES)
  .map(({v,d})=>{const tone=engineTone(v.vehicleType,v.speed);
   return {...tone,gain:.07*(1-d/HEAR_RANGE)**2*.85*(radioLive?.7:1),pan:clamp((v.x-player.x)/40,-1,1),distance:d};});
 return {master,engine,voices,
  ambient:{gain:interior?.008:(.05-.025*clamp(night,0,1))},
  rain:{gain:interior?0:.07*clamp(rain,0,1)}};
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
function readPrefs(storage){
 try{const p=JSON.parse(storage?.getItem(AUDIO_STORAGE_KEY)||'null');
  if(p&&typeof p==='object')return {muted:!!p.muted,volume:Number.isFinite(p.volume)?clamp(p.volume,0,1):.7};}catch(_){}
 return {muted:false,volume:.7};
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
export function createCityAudio({contextFactory=()=>new (globalThis.AudioContext||globalThis.webkitAudioContext)(),storage=null}={}){
 const prefs=readPrefs(storage);
 let ctx=null,nodes=null,focused=true,lastMix=null;
 const hornMemory={last:-1e9,byCar:new WeakMap()};
 const persist=()=>{try{storage?.setItem(AUDIO_STORAGE_KEY,JSON.stringify(prefs));}catch(_){}};
 // Il browser può rifiutare resume/suspend (contesto chiuso o non avviabile): si ignora, l'audio resta muto.
 const safe=call=>{try{Promise.resolve(call?.()).catch(()=>{});}catch(_){}};
 const resume=()=>safe(()=>ctx.resume?.()),suspend=()=>safe(()=>ctx.suspend?.());
 const set=(param,value)=>{if(!param)return;if(param.setTargetAtTime)param.setTargetAtTime(value,ctx.currentTime,.06);else param.value=value;};
 function build(){
  const master=ctx.createGain();master.gain.value=0;master.connect(ctx.destination);
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
   ambient:loop(true,'lowpass',380),rain:loop(false,'bandpass',2600,.6)};
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
  get volume(){return prefs.volume;},
  toggleMuted(){prefs.muted=!prefs.muted;persist();if(ctx){if(prefs.muted)suspend();else if(focused)resume();}return prefs.muted;},
  changeVolume(step){prefs.volume=Math.round(clamp(prefs.volume+step,0,1)*10)/10;persist();return prefs.volume;},
  focus(hasFocus){focused=!!hasFocus;if(!ctx)return;if(!focused)suspend();else if(!prefs.muted)resume();},
  update(input){
   const mix=audioMix({...input,muted:prefs.muted,volume:prefs.volume,focused});lastMix=mix;
   if(!ctx||!nodes)return mix;
   set(nodes.master.gain,mix.master);
   const e=nodes.engine;set(e.gain.gain,mix.engine.gain);set(e.osc.frequency,mix.engine.freq);set(e.sub.frequency,mix.engine.freq/2);set(e.filter.frequency,mix.engine.cutoff);
   nodes.voices.forEach((n,i)=>{const v=mix.voices[i];
    set(n.gain.gain,v?v.gain:0);if(v){set(n.osc.frequency,v.freq);set(n.sub.frequency,v.freq/2);set(n.filter.frequency,v.cutoff*.8);if(n.pan)set(n.pan.pan,v.pan);}});
   set(nodes.ambient.gain.gain,mix.ambient.gain);set(nodes.rain.gain.gain,mix.rain.gain);
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
