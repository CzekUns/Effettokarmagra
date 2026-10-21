/* Q33: the existing deterministic match on the real Q32 pitch. Local match coordinates stay 40×20;
 * only the projection into Melito changes, so goal, throw-in and keeper rules remain the same. */
import {FOOTBALL_RULES,createMatch,startMatch,stepMatch,matchClockLabel} from './minigame-football.mjs?v=002';
import {pedestrianDirection} from './pedestrian-sprites.mjs?v=002';
import {ps} from './world-scale.mjs?v=001';

const R=FOOTBALL_RULES;
export const FOOTBALL_SPRITE_PATH='./assets/people/calcetto-4squadre-4dir-4frames-24x40.png';
let image=null;
export function loadFootballSprites(){
 if(image||typeof Image==='undefined')return;
 image=new Image();image.onerror=()=>console.warn('Calcetto: foglio calciatori non disponibile');
 image.src=new URL(FOOTBALL_SPRITE_PATH,import.meta.url).href;
}
export const footballSpritesReady=()=>!!(image?.complete&&image.naturalWidth===384&&image.naturalHeight===160);
export function fieldToWorld(pitch,x,y){
 const a=pitch.a||0,u=x*pitch.w/R.length,v=y*pitch.h/R.width,c=Math.cos(a),s=Math.sin(a);
 return {x:pitch.cx+u*c-v*s,y:pitch.cy+u*s+v*c};
}
export function worldToField(pitch,x,y){
 const a=pitch.a||0,c=Math.cos(a),s=Math.sin(a),dx=x-pitch.cx,dy=y-pitch.cy;
 return {x:(dx*c+dy*s)*R.length/pitch.w,y:(-dx*s+dy*c)*R.width/pitch.h};
}
export function createWorldFootball(pitch,{seed=1,id=null}={}){
 if(!pitch||pitch.kind!=='calcetto'||!(pitch.w>0&&pitch.h>0))return null;
 const match=createMatch({seed,id:id||`calcetto-${pitch.id}-${seed.toString(36)}`,pitchName:pitch.nome,fixedPlayer:true});
 const world={pitch,match,acc:0,elapsed:0};startMatch(match);return world;
}
export function stepWorldFootball(world,dt,input={}){
 if(!world)return [];
 const m=world.match,events=[...m.events];m.events.length=0;
 world.acc+=Math.min(.1,Math.max(0,dt));world.elapsed+=Math.max(0,dt);
 let n=0;while(world.acc>=R.step&&n<8){stepMatch(m,input,R.step);events.push(...m.events);m.events.length=0;world.acc-=R.step;n++;input={x:input.x,y:input.y};}
 if(n===8)world.acc=0;
 return events;
}
export function footballWorldPlayer(world){
 const p=world.match.players[4],position=fieldToWorld(world.pitch,p.x,p.y),a=world.pitch.a||0;
 const vx=p.fx*world.pitch.w/R.length,vy=p.fy*world.pitch.h/R.width;
 return {...position,a:Math.atan2(vx*Math.sin(a)+vy*Math.cos(a),vx*Math.cos(a)-vy*Math.sin(a))};
}
export const footballHud=world=>({score:world.match.score.join(' – '),clock:matchClockLabel(world.match),phase:world.match.phase});
export function drawWorldFootball(ctx,world,clock=0){
 if(!world)return;
 const m=world.match,pitch=world.pitch,b=m.ball;
 const items=m.players.map(p=>({p,at:fieldToWorld(pitch,p.x,p.y)}));
 items.push({ball:true,at:fieldToWorld(pitch,b.x,b.y)});items.sort((a,b)=>a.at.y-b.at.y);
 for(const item of items){
  const {x,y}=item.at;
  if(item.ball){
   ctx.fillStyle='#17251d77';ctx.fillRect(x-.43,y-.03,.86,.27);
   ctx.fillStyle='#1b2322';ctx.fillRect(x-.38,y-.49,.76,.66);
   ctx.fillStyle='#f8f3e6';ctx.fillRect(x-.28,y-.45,.56,.49);
   ctx.fillStyle='#5f6460';ctx.fillRect(x-.09,y-.28,.18,.15);continue;
  }
  const p=item.p,identity=p.role==='gk'?(p.team===0?2:3):p.team;
  const heading=fieldToWorld(pitch,p.x+p.fx,p.y+p.fy),angle=Math.atan2(heading.y-y,heading.x-x);
  const row=pedestrianDirection(angle),frame=Math.hypot(p.vx,p.vy)>.35?Math.floor(p.anim)%4:0;
  const width=ps(3.25),height=ps(4.7);
  if(footballSpritesReady())ctx.drawImage(image,(identity*4+frame)*24,row*40,24,40,x-width/2,y-height+ps(.8),width,height);
  else{ctx.fillStyle=['#d33b33','#2d5fc4','#e8c447','#4fb46a'][identity];ctx.fillRect(x-1,y-3,2,3);}
  if(p.i===4){ctx.fillStyle='#ffe14a';ctx.fillRect(x-.9,y-height-.55,1.8,.34);ctx.fillRect(x-.45,y-height-.2,.9,.3);}
 }
}
