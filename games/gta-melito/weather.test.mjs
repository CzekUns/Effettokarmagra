import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {weatherAt,weatherStateAt,combineWeather,rainStreaks,drawRain,cloudShadows,placePuddles,hasUmbrella,drawUmbrella,WEATHER_PERIOD,WEATHER_FADE} from './weather.mjs';
import {daylightAt} from './daylight.mjs';

test('Q08 weather follows the clock: repeatable, a clear first morning, a believable mix of days',()=>{
 for(const m of [0,450,1000,2222,5000])assert.deepEqual(weatherAt(m),weatherAt(m));
 assert.equal(weatherAt(450).state,'sereno','the game starts at 07:30 under a clear sky');
 const count={sereno:0,nuvoloso:0,pioggia:0};
 for(let k=0;k<2000;k++)count[weatherStateAt(k)]++;
 assert.ok(count.sereno>800&&count.nuvoloso>400&&count.pioggia>300,'mostly clear, some clouds, some rain: '+JSON.stringify(count));
 assert.ok(count.pioggia<count.sereno);
 const forced=weatherAt(450,{forced:'pioggia'});
 assert.equal(forced.state,'pioggia');assert.equal(forced.rain,1);assert.equal(forced.wetness,1);
 assert.equal(weatherAt(450,{forced:'grandine'}).state,'sereno','unknown forced weather is ignored');
});

test('Q08 changes are gradual: clouds, rain and wet ground never jump',()=>{
 let previous=weatherAt(0);
 for(let m=1;m<=6*1440;m++){
  const now=weatherAt(m);
  assert.ok(Math.abs(now.cloud-previous.cloud)<=.07,'cloud at minute '+m);
  assert.ok(Math.abs(now.rain-previous.rain)<=.07,'rain at minute '+m);
  assert.ok(Math.abs(now.wetness-previous.wetness)<=.15,'wetness at minute '+m);
  previous=now;
 }
});

test('Q08 the ground soaks in a quarter of an hour of rain and dries in about an hour',()=>{
 let k=3;while(!(weatherStateAt(k)==='pioggia'&&weatherStateAt(k-1)==='sereno'&&weatherStateAt(k+1)==='sereno'))k++;
 const start=k*WEATHER_PERIOD,end=(k+1)*WEATHER_PERIOD;
 assert.equal(weatherAt(start-WEATHER_FADE-1).wetness,0,'dry before');
 assert.ok(weatherAt(start+20).wetness>.95,'soaked after ~15 minutes of rain');
 assert.ok(weatherAt(end-WEATHER_FADE+5).wetness>.95,'still wet while it rains');
 const after=end+30;assert.ok(weatherAt(after).wetness>0&&weatherAt(after).wetness<1,'drying');
 assert.equal(weatherAt(end+75).wetness,0,'dry again an hour later');
});

test('Q08 weather and light: overcast dims the day, rain lights lamps earlier at dusk but not at noon',()=>{
 const noon=daylightAt(12*60),clear=weatherAt(12*60,{forced:'sereno'});
 assert.equal(combineWeather(noon,clear),noon,'a clear sky changes nothing');
 const rainyNoon=combineWeather(noon,weatherAt(12*60,{forced:'pioggia'}));
 assert.ok(rainyNoon.darkness>.2&&rainyNoon.darkness<.35,'grey, not night');
 assert.ok(rainyNoon.tint[2]>=rainyNoon.tint[0]-10,'a cool grey veil');
 assert.equal(rainyNoon.lamps,0,'street lamps stay off at midday');
 assert.ok(rainyNoon.headlights>0,'drivers switch dipped headlights on in the rain');
 const dusk=daylightAt(18*60+50),wetDusk=combineWeather(dusk,weatherAt(18*60+50,{forced:'pioggia'}));
 assert.ok(wetDusk.lamps>dusk.lamps+.2,'lamps come on earlier on a rainy evening');
 const night=daylightAt(23*60);
 assert.equal(combineWeather(night,weatherAt(23*60,{forced:'pioggia'})).darkness,Math.max(night.darkness,.27+night.darkness*.25));
});

test('Q08 rendering smoke: rain streaks, cloud shadows and umbrellas only when they should appear',()=>{
 assert.deepEqual(rainStreaks(3,800,400,0),[]);
 const heavy=rainStreaks(3,800,400,1),light=rainStreaks(3,800,400,.4);
 assert.equal(heavy.length,180);assert.equal(light.length,72);
 assert.deepEqual(heavy,rainStreaks(3,800,400,1),'deterministic');
 assert.ok(heavy.every(([x,y])=>x>=0&&x<=800&&y>=0&&y<=400),'drops start on screen');
 assert.notDeepEqual(heavy[0],rainStreaks(3.1,800,400,1)[0],'and they fall');
 const calls=[];const ctx=new Proxy({},{get:(o,k)=>k in o?o[k]:(...a)=>{calls.push(k);},set:(o,k,v)=>{o[k]=v;return true;}});
 assert.equal(drawRain(ctx,3,800,400,0),0);assert.equal(calls.length,0);
 assert.equal(drawRain(ctx,3,800,400,1),180);assert.ok(calls.filter(k=>k==='stroke').length===1,'one stroke for all drops');
 assert.deepEqual(cloudShadows([0,0,500,500],0,10),[]);
 const shadows=cloudShadows([0,0,2000,2000],1,10);assert.ok(shadows.length>0&&shadows.every(q=>q.alpha>0&&q.alpha<=.16));
 const people=[...Array(1000).keys()].map(i=>({seed:i*37+5}));
 const share=people.filter(hasUmbrella).length/people.length;assert.ok(share>.6&&share<.8,'about 7 in 10 carry one');
 calls.length=0;drawUmbrella(ctx,0,0,{seed:5},.2);assert.equal(calls.length,0,'no umbrellas in a drizzle');
 drawUmbrella(ctx,0,0,people.find(hasUmbrella),1);assert.ok(calls.includes('arc'));
});

test('Q08 puddles lie on the asphalt, never where a roof or wall hides the ground',()=>{
 const roads=[{id:5,t:'residential',w:6,p:[0,0,600,0]},{id:6,t:'footway',w:3,p:[0,30,600,30]}];
 const roof=(x,y)=>x>200&&x<320&&y<-1;// un tetto sollevato copre il lato nord della carreggiata
 const ctx={drivable:r=>r.t!=='footway',roadWidth:()=>12,covered:roof};
 const puddles=placePuddles(roads,ctx);
 assert.ok(puddles.length>=8,'some puddles: '+puddles.length);
 assert.deepEqual(puddles,placePuddles(roads,ctx));
 for(const q of puddles){
  assert.ok(Math.abs(q.y)<=6,'on the carriageway');
  const reach=Math.max(q.rx,q.ry)+.4;
  assert.ok(![[0,0],[reach,0],[-reach,0],[0,reach],[0,-reach]].some(([ox,oy])=>roof(q.x+ox,q.y+oy)),'clear of the roof');
 }
 assert.ok(puddles.some(q=>q.x>200&&q.x<320),'the uncovered side keeps puddles there');
 assert.ok(puddles.filter(q=>q.x>200&&q.x<320).every(q=>q.y>-1),'but none under the roof');
});

test('Q08 game wiring: weather each tick, wet asphalt cut around buildings, rain over the night, HUD label',async()=>{
 const game=await readFile(new URL('./game.mjs',import.meta.url),'utf8');
 assert.match(game,/state\.weather=weatherAt\(state\.npcClockMinutes,\{forced:FORCED_WEATHER\}\);/);
 assert.match(game,/get\('meteo'\)/,'?meteo= for repeatable checks');
 assert.match(game,/const light=combineWeather\(daylightAt\(state\.npcClockMinutes\),state\.weather\)/);
 assert.match(game,/g\.globalCompositeOperation='destination-out'/,'wet mask minus buildings');
 assert.match(game,/g\.lineTo\(p\[i\]-v\.dx,p\[i\+1\]-v\.dy\)/,'including walls and lifted roofs');
 assert.match(game,/covered:coveredByBuilding/,'puddles avoid covered ground');
 const draw=game.indexOf('function draw(dt=0)'),at=s=>game.indexOf(s,draw);
 assert.ok(at('drawStaticTiles([')<at('drawWetTiles(')&&at('drawWetTiles(')<at('drawRoofReveal(c,'),'wet ground under roofs revealed later');
 assert.ok(at('drawCityPeople(c,')<at('drawUmbrella(c,'),'umbrellas over the people');
 assert.ok(at('drawNightLighting([x0')<at('drawRain(c,')&&at('drawRain(c,')<at('drawCityEventOverlay(c,'),'rain visible at night, under bubbles');
 assert.match(game,/formatNpcClock\(state\.npcClockMinutes\)\+\(state\.weather\?' · '\+state\.weather\.label:''\)/);
});
