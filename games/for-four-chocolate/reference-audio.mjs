const GAMEPLAY_VOLUME = .0325; // Simone: soundtrack halved again; alert cues are unchanged.
const FINALE_VOLUME = .1375;
const DIALOGUE_VOLUME = .0425;
const CUE_COOLDOWN = 1.5;

export function createAudioState(muted = false) {
  return {active:false,muted,suspended:false,volume:0,mode:'routine',time:0,
    lastAlert:-Infinity,lastPursuit:-Infinity};
}

export function advanceAudio(state, {phase='playing',securityMode='routine',finaleStep=null} = {}, seconds = 0) {
  const dt=Math.max(0,Math.min(.2,Number.isFinite(seconds)?seconds:0));
  state.time+=dt;
  const cues=[];
  if(state.active&&phase==='playing'){
    if(securityMode==='alert'&&state.mode!==securityMode&&state.time-state.lastAlert>=CUE_COOLDOWN){
      cues.push('alert');state.lastAlert=state.time;
    }
    if(securityMode==='pursuit'&&state.mode!==securityMode&&state.time-state.lastPursuit>=CUE_COOLDOWN){
      cues.push('pursuit');state.lastPursuit=state.time;
    }
  }
  state.mode=securityMode;
  const target=!state.active?0:phase==='playing'?GAMEPLAY_VOLUME:
    finaleStep==='office'?DIALOGUE_VOLUME:FINALE_VOLUME;
  state.volume+= (target-state.volume)*(1-Math.exp(-dt/(state.active?.62:.28)));
  if(Math.abs(target-state.volume)<.001)state.volume=target;
  return {volume:state.muted||state.suspended?0:state.volume,cues:state.muted||state.suspended?[]:cues,
    finished:!state.active&&state.volume<.002};
}

export function startAudio(state){state.active=true;state.suspended=false;state.mode='routine';}
export function stopAudio(state){state.active=false;state.mode='routine';}

export function createAudioController({music,createContext,storage}) {
  let muted=false;
  try{muted=storage?.getItem('ffc-audio-muted-v1')==='1';}catch{}
  const state=createAudioState(muted);
  let context=null;
  music.loop=true;music.preload='metadata';music.volume=0;
  function playMusic(){
    if(state.muted||state.suspended||!state.active)return;
    try{const result=music.play();if(result?.catch)result.catch(()=>{});}catch{}
  }
  function audioContext(){
    if(!context){try{context=createContext?.()||null;}catch{return null;}}
    try{const result=context?.resume();if(result?.catch)result.catch(()=>{});}catch{}
    return context;
  }
  function pulse(ctx,start,frequency,end,duration,wave,gain){
    const oscillator=ctx.createOscillator(),envelope=ctx.createGain();
    oscillator.type=wave;
    oscillator.frequency.setValueAtTime(frequency,start);
    oscillator.frequency.exponentialRampToValueAtTime(end,start+duration);
    envelope.gain.setValueAtTime(.0001,start);
    envelope.gain.exponentialRampToValueAtTime(gain,start+.018);
    envelope.gain.exponentialRampToValueAtTime(.0001,start+duration);
    oscillator.connect(envelope);envelope.connect(ctx.destination);
    oscillator.start(start);oscillator.stop(start+duration+.01);
  }
  function cue(kind){
    const ctx=audioContext();if(!ctx)return;
    const at=ctx.currentTime+.005;
    if(kind==='alert')pulse(ctx,at,1080,430,.21,'square',.075);
    else{
      pulse(ctx,at,430,170,.22,'sawtooth',.085);
      pulse(ctx,at+.18,530,190,.27,'sawtooth',.072);
    }
  }
  return {
    state,
    music,
    start(){startAudio(state);audioContext();playMusic();},
    stop(){stopAudio(state);},
    update(scene,finale,seconds){
      const result=advanceAudio(state,{phase:scene.phase,securityMode:scene.security.mode,finaleStep:finale?.step},seconds);
      music.volume=result.volume;
      for(const kind of result.cues)cue(kind);
      if(result.finished&&!music.paused)music.pause();
      return result;
    },
    toggleMute(){
      state.muted=!state.muted;
      if(!state.muted){state.suspended=false;audioContext();playMusic();}
      else music.pause();
      try{storage?.setItem('ffc-audio-muted-v1',state.muted?'1':'0');}catch{}
      return state.muted;
    },
    hide(){state.suspended=true;music.pause();try{context?.suspend();}catch{}},
    get label(){return state.muted?'MUSICA OFF':state.suspended?'RIPRENDI MUSICA':'MUSICA ON';}
  };
}
