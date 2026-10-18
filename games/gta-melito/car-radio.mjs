/* GTA Melito — optional live car-radio prototype.
 * Browsers connect directly to broadcaster/CDN hosts; no rebroadcast proxy,
 * recording or bundled music. Stream URLs are third-party candidates and
 * MUST be verified in real browsers and checked for embed/usage permission.
 */
export const RADIO_STATIONS=Object.freeze([
 {id:'marte',name:'RADIO MARTE',site:'https://www.radiomarte.it/',stream:'https://stream1.xdevel.com/audio0s975753-313/stream/icecast.audio'},
 {id:'kisskissnapoli',name:'KISS KISS NAPOLI',site:'https://kisskissnapoli.it/diretta-kisskissnapoli/',stream:'https://kisskiss.fluidstream.eu/KKNapoli.aac'},
 {id:'crc',name:'RADIO CRC',site:'https://crcnews.it/',stream:'https://stream9.xdevel.com/audio2s975936-745/stream/icecast.audio'},
 {id:'nuovasangiorgio',name:'NUOVA SAN GIORGIO',site:'https://www.radionuovasangiorgio.com/',stream:'https://ice15.fluidstream.net/sangiorgio.aac'},
 {id:'norba',name:'RADIO NORBA',site:'https://radionorba.it/',stream:'https://stream3.xdevel.com/audio0s975885-1008/stream/icecast.audio'},
 {id:'napoli',name:'RADIO NAPOLI',site:'https://www.radionapoli.it/',stream:'https://ice08.fluidstream.net/RadioNapoli.aac'}
].map(station=>Object.freeze(station)));
const STORAGE_KEY='gta-melito-radio-v1';
const clampIndex=value=>Number.isInteger(value)&&value>=0&&value<RADIO_STATIONS.length?value:0;
export const radioStationAt=index=>RADIO_STATIONS[clampIndex(index)];
export const nextRadioIndex=(index,step)=>((clampIndex(index)+(step<0?-1:1)+RADIO_STATIONS.length)%RADIO_STATIONS.length);

/** Each call creates an independent tuner. An injected Audio factory makes it testable on Node. */
export function createCarRadio({audioFactory=()=>new Audio(),onChange=()=>{},storage=null}={}){
 let index=0,enabled=true,inVehicle=false,status='off',audio=null,serial=0;
 try{
  const saved=JSON.parse(storage?.getItem(STORAGE_KEY)||'null');
  if(saved&&typeof saved==='object'){index=clampIndex(saved.index);enabled=saved.enabled!==false;}
 }catch(_){}
 const snapshot=()=>({index,enabled,inVehicle,status,station:RADIO_STATIONS[index]});
 const emit=()=>onChange(snapshot());
 const persist=()=>{try{storage?.setItem(STORAGE_KEY,JSON.stringify({index,enabled}));}catch(_){}};
 function stopAudio(){
  ++serial;
  if(!audio)return;
  try{audio.pause();audio.removeAttribute('src');audio.load();}catch(_){}
 }
 function ensureAudio(){
  if(audio)return audio;
  audio=audioFactory();
  audio.preload='none';
  audio.volume=.52;
  audio.addEventListener?.('error',()=>{
   if(inVehicle&&enabled){status='unavailable';emit();}
  });
  return audio;
 }
 function play(){
  if(!inVehicle||!enabled)return Promise.resolve(false);
  stopAudio();
  const current=++serial;
  try{
   const player=ensureAudio();
   player.src=RADIO_STATIONS[index].stream;
   player.load();
   status='connecting';emit();
   return Promise.resolve(player.play()).then(()=>{
    if(current===serial&&inVehicle&&enabled){status='live';emit();}
    return true;
   }).catch(error=>{
    if(current===serial&&inVehicle&&enabled){
     status=error?.name==='NotAllowedError'?'tap':'unavailable';emit();
    }
    return false;
   });
  }catch(_){if(current===serial){status='unavailable';emit();}return Promise.resolve(false);}
 }
 function enterVehicle(){
  if(inVehicle)return Promise.resolve(false);
  inVehicle=true;
  if(!enabled){status='off';emit();return Promise.resolve(false);}
  return play();
 }
 function leaveVehicle(){inVehicle=false;status='off';stopAudio();emit();}
 function tune(step){
  if(!inVehicle)return Promise.resolve(false);
  index=nextRadioIndex(index,step);enabled=true;persist();return play();
 }
 function toggle(){
  if(!inVehicle)return Promise.resolve(false);
  if(enabled&&(status==='live'||status==='connecting')){
   enabled=false;persist();stopAudio();status='off';emit();return Promise.resolve(false);
  }
  enabled=true;persist();return play();
 }
 function suspend(){
  if(inVehicle&&enabled&&status!=='off'){
   stopAudio();status='tap';emit();
  }
 }
 emit();
 return {snapshot,enterVehicle,leaveVehicle,next:()=>tune(1),previous:()=>tune(-1),toggle,suspend};
}
