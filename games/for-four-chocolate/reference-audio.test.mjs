import test from 'node:test';
import assert from 'node:assert/strict';
import {createAudioState,advanceAudio,startAudio,stopAudio,createAudioController} from './reference-audio.mjs';

test('la canzone non parte prima di START; sale in entrambi i finali e si abbassa durante il dialogo',()=>{
  const state=createAudioState();
  for(let i=0;i<10;i++)advanceAudio(state,{},.2);
  assert.equal(state.volume,0);
  startAudio(state);
  for(let i=0;i<20;i++)advanceAudio(state,{},.2);
  assert.ok(state.volume>.12&&state.volume<.14);
  for(let i=0;i<15;i++)advanceAudio(state,{phase:'escaped',finaleStep:'street'},.2);
  assert.ok(state.volume>.54);
  for(let i=0;i<20;i++)advanceAudio(state,{phase:'caught',finaleStep:'office'},.2);
  assert.ok(state.volume<.18);
  for(let i=0;i<20;i++)advanceAudio(state,{phase:'caught',finaleStep:'escalator'},.2);
  assert.ok(state.volume>.54);
  stopAudio(state);
  for(let i=0;i<15;i++)advanceAudio(state,{},.2);
  assert.ok(state.volume<.002);
});

test('due cue diversi una sola volta per transizione, mai camminando soltanto in vista',()=>{
  const state=createAudioState();startAudio(state);
  const tick=(mode,seconds=.05)=>advanceAudio(state,{securityMode:mode},seconds).cues;
  assert.deepEqual(tick('routine'),[]);
  assert.deepEqual(tick('routine'),[]);
  assert.deepEqual(tick('alert'),['alert']);
  for(let i=0;i<10;i++)assert.deepEqual(tick('alert'),[]);
  assert.deepEqual(tick('pursuit'),['pursuit']);
  for(let i=0;i<10;i++)assert.deepEqual(tick('pursuit'),[]);
  assert.deepEqual(tick('searching'),[]);
  assert.deepEqual(tick('pursuit'),[]); // cooldown dopo il primo inseguimento
  for(let i=0;i<40;i++)tick('searching');
  assert.deepEqual(tick('pursuit'),['pursuit']);
});

test('mute persistente e pagina nascosta interrompono musica ed effetti',()=>{
  const saved=new Map([['ffc-audio-muted-v1','1']]);
  const storage={getItem:key=>saved.get(key),setItem:(key,value)=>saved.set(key,value)};
  const music={loop:false,preload:'',volume:-1,paused:true,plays:0,pauses:0,
    play(){this.plays++;this.paused=false;return Promise.resolve();},
    pause(){this.pauses++;this.paused=true;}};
  const controller=createAudioController({music,storage});
  controller.start();
  assert.equal(music.plays,0);
  assert.equal(music.loop,true);
  controller.update({phase:'playing',security:{mode:'alert'}},null,.1);
  assert.equal(music.volume,0);
  assert.equal(controller.toggleMute(),false);
  assert.equal(saved.get('ffc-audio-muted-v1'),'0');
  assert.equal(music.plays,1);
  controller.hide();
  assert.equal(music.paused,true);
  assert.equal(controller.label,'RIPRENDI MUSICA');
  controller.update({phase:'playing',security:{mode:'pursuit'}},null,.1);
  assert.equal(music.volume,0);
  controller.toggleMute();controller.toggleMute();
  assert.equal(music.plays,2);
  controller.stop();
  for(let i=0;i<30;i++)controller.update({phase:'playing',security:{mode:'routine'}},null,.2);
  assert.equal(music.paused,true);
});

test('se il file MP3 non parte il gioco e i segnali restano utilizzabili',async()=>{
  const music={loop:false,preload:'',volume:0,paused:true,
    play(){return Promise.reject(new Error('MP3 assente'));},pause(){this.paused=true;}};
  const controller=createAudioController({music});
  controller.start();
  const result=controller.update({phase:'playing',security:{mode:'alert'}},null,.05);
  assert.deepEqual(result.cues,['alert']);
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(controller.state.active,true);
});
