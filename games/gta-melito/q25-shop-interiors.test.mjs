import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {interiorFor,INTERIOR_TEMPLATES,SHOP_INTERIOR_KINDS,shopInteriorWalkable,stepShopInteriorPlayer,enterShop,
 resolveShopEntrances,nearestShopEntrance,shopInteriorCamera,interiorCounterNear,drawShopInterior,drawShopEntrance,
 SHOP_DOOR_MIN_GAP} from './shop-interiors.mjs';
import {BANK_ROOM} from './bank-interior.mjs';
import {WALK_SPEED} from './driving-controls.mjs';

const BANK=BANK_ROOM.width*BANK_ROOM.height;
const bar={kind:'bar',name:'Bar di prova',id:1,x:50,y:7,a:0,side:1};
const bakery={kind:'bakery',name:'Panificio di prova',id:2,x:150,y:7,a:0,side:1};

test('Q25 rooms: one medium and one small template, 1/4–1/6 of the bank, other kinds stay closed',()=>{
 const medium=interiorFor(bar),small=interiorFor(bakery);
 assert.equal(medium.size,'medio');assert.equal(small.size,'piccolo');
 for(const room of [medium,small,interiorFor({kind:'supermarket',id:3})]){
  const share=room.width*room.height/BANK;
  assert.ok(share<=1/4+1e-9&&share>=1/6-1e-9,'area '+share.toFixed(3)+' of the bank');
 }
 assert.deepEqual([medium.width,medium.height],[80,60]);assert.deepEqual([small.width,small.height],[64,50]);
 assert.equal(interiorFor({kind:'hairdresser',id:9}),null,'not a modelled activity: closed');
 assert.equal(interiorFor({kind:'pharmacy',id:9}),null);
 assert.ok(Object.keys(SHOP_INTERIOR_KINDS).every(k=>INTERIOR_TEMPLATES[SHOP_INTERIOR_KINDS[k]]));
});

// Grid flood fill: can the player walk from the doorway to the counter between the furniture?
function reachable(room,from,to){
 const step=.5,key=(x,y)=>Math.round(x/step)+':'+Math.round(y/step),seen=new Set([key(from.x,from.y)]),queue=[from];
 while(queue.length){
  const p=queue.shift();if(Math.hypot(p.x-to.x,p.y-to.y)<.8)return true;
  for(const [dx,dy] of [[step,0],[-step,0],[0,step],[0,-step]]){
   const q={x:p.x+dx,y:p.y+dy},k=key(q.x,q.y);
   if(seen.has(k)||!shopInteriorWalkable(room,q.x,q.y))continue;seen.add(k);queue.push(q);
  }
 }
 return false;
}
test('Q25 walls and furniture are solid, the doorway is open, the counter can be reached from the door',()=>{
 for(const shop of [bar,bakery,{kind:'convenience',id:4}]){
  const room=interiorFor(shop),inner=enterShop({shop,room},{x:0,y:0,a:0});
  assert.ok(shopInteriorWalkable(room,inner.player.x,inner.player.y),'spawn on the threshold is walkable');
  assert.equal(shopInteriorWalkable(room,1,room.height/2),false,'side wall');
  assert.equal(shopInteriorWalkable(room,room.width/2,1),false,'back wall');
  assert.equal(shopInteriorWalkable(room,room.door.x0-3,room.height-1),false,'front wall beside the door');
  assert.ok(shopInteriorWalkable(room,room.width/2,room.height-1.2),'doorway open');
  const [x0,y0,x1,y1]=room.counter.box;
  assert.equal(shopInteriorWalkable(room,(x0+x1)/2,(y0+y1)/2),false,'counter is solid');
  for(const [a,b,c,d] of room.solids)assert.equal(shopInteriorWalkable(room,(a+c)/2,(b+d)/2),false,'furniture is solid');
  assert.ok(shopInteriorWalkable(room,room.counter.x,room.counter.y),'service spot in front of the counter');
  assert.ok(reachable(room,inner.player,room.counter),'a free aisle from the door to the counter in '+room.template);
 }
});

test('Q25 walking speed is the street one, the player slides along the counter and leaves through the door',()=>{
 const room=interiorFor(bar),inner=enterShop({shop:bar,room},{x:0,y:0,a:0}),start={...inner.player};
 for(let i=0;i<20;i++)stepShopInteriorPlayer(inner,{x:0,y:-1},false,.05);
 assert.ok(Math.abs((start.y-inner.player.y)-WALK_SPEED)<.05,'1 s of walking = '+WALK_SPEED+' world units');
 inner.player.x=30;inner.player.y=19.5;
 const before=inner.player.x;stepShopInteriorPlayer(inner,{x:.6,y:-1},false,.05);
 assert.ok(inner.player.y>=17+1.1-1e-9,'never into the counter');assert.ok(inner.player.x>before,'slides sideways');
 inner.player.x=room.width/2;inner.player.y=room.height-4;let out=null;
 for(let i=0;i<40&&!out;i++)out=stepShopInteriorPlayer(inner,{x:0,y:1},false,.05);
 assert.equal(out,'exit','walking out of the doorway leaves the shop');
});

// A street along x; the storefront points stand on the pavement at y=7 and the buildings start at y=11
// (side 1 → normal +y). The probe stub plays the role of probeDoor.
const building=(x,y)=>y>=11&&y<=40&&x>=0&&x<=400;
const walk=(x,y)=>!building(x,y)&&y>=-20&&y<=60;
const probe=(origin,normal)=>{
 for(let s=0;s<6.5;s+=.25){const x=origin.x+normal.x*s,y=origin.y+normal.y*s;if(building(x,y+.45))return {x,y,nx:-normal.x,ny:-normal.y};}
 return null;
};
test('Q25 entrances: on the facade, reachable, away from the outdoor counter, never on the road; others closed',()=>{
 const shops=[bar,bakery,{kind:'hairdresser',name:'X',id:5,x:250,y:7,a:0,side:1},{kind:'bar',name:'Dentro',id:6,x:300,y:20,a:0,side:1}];
 const doors=resolveShopEntrances(shops,{probe,isWalkable:walk,onRoad:(x,y)=>Math.abs(y)<4});
 assert.equal(doors.length,2,'bar and bakery open; hairdresser not modelled; a storefront inside a block has no door');
 for(const door of doors){
  assert.ok(walk(door.x,door.y),'threshold walkable');assert.ok(building(door.x,door.y+1),'right against the facade');
  assert.ok(Math.hypot(door.x-door.shop.x,door.y-door.shop.y)>=SHOP_DOOR_MIN_GAP,'ENTRA and COMPRA do not overlap');
  assert.ok(Math.abs(door.y)>=4,'not on the carriageway');
  assert.equal(nearestShopEntrance(doors,{x:door.x+.5,y:door.y})?.entrance,door);
 }
 assert.equal(nearestShopEntrance(doors,{x:bar.x,y:bar.y}),null,'at the awning the door is out of reach');
 const onRoad=resolveShopEntrances([bar],{probe:()=>({x:50,y:0,nx:0,ny:-1}),isWalkable:()=>true,onRoad:(x,y)=>Math.abs(y)<4});
 assert.equal(onRoad.length,0,'a door on the carriageway is refused');
});

test('Q25 camera follows the player inside the room and stops at the walls; Q26 counter hook',()=>{
 const room=interiorFor(bar),inner=enterShop({shop:bar,room},{x:12,y:34,a:1});
 assert.deepEqual(inner.outside,{x:12,y:34,a:1},'exact outside spot saved for the way out');
 const cam=shopInteriorCamera(room,inner.player,720,320,6.6);
 assert.ok(cam.y<=room.height-320/(2*6.6)+1e-9&&cam.x===room.width/2);
 // 720×320 at zoom 6.6 shows 109×48 units: wider than the 80 m room (centred), shorter than its 60 m (clamped).
 const corner=shopInteriorCamera(room,{x:4,y:4},720,320,6.6);
 assert.equal(corner.x,room.width/2,'narrow room: centred across');
 assert.ok(Math.abs(corner.y-320/(2*6.6))<1e-9,'clamped at the back wall instead of showing the void');
 const phone=shopInteriorCamera(room,{x:4,y:4},500,300,9);
 assert.ok(Math.abs(phone.x-500/18)<1e-9&&Math.abs(phone.y-300/18)<1e-9,'closer zoom: clamped in both directions');
 const big=shopInteriorCamera(room,{x:4,y:4},4000,4000,6.6);
 assert.deepEqual(big,{x:room.width/2,y:room.height/2},'small room on a huge screen is centred');
 assert.equal(interiorCounterNear(inner),null);
 inner.player.x=room.counter.x;inner.player.y=room.counter.y;
 assert.equal(interiorCounterNear(inner)?.label,'BANCONE');
});

function fakeContext(){
 const calls={fill:0,text:[]};
 return {calls,ctx:new Proxy({},{get:(t,k)=>k==='fillText'?(s)=>calls.text.push(s):k==='fillRect'?()=>calls.fill++:k in t?t[k]:()=>{},set:(t,k,v)=>{t[k]=v;return true;}})};
}
test('Q25 interiors and door glows draw without errors, with the real shop name and the fantasy notice',()=>{
 for(const shop of [bar,bakery,{kind:'supermarket',name:'Market',id:7}]){
  const {ctx,calls}=fakeContext(),room=interiorFor(shop),inner=enterShop({shop,room},{x:0,y:0,a:0});
  drawShopInterior(ctx,800,450,1.2,inner,6.6,null);
  assert.ok(calls.fill>60,'pixel-art room drawn');
  assert.ok(calls.text.includes(shop.name.toUpperCase()));assert.ok(calls.text.some(t=>/FANTASIA/.test(t)));
 }
 const {ctx,calls}=fakeContext();drawShopEntrance(ctx,{x:1,y:2},0);
 assert.equal(calls.text.length,0,'only the glowing spot: no label over the shop sign');
});

test('Q25 game wiring: doors made on load and width switch, ENTRA on foot, exact return, frozen clock, own scene',async()=>{
 const [game,html]=await Promise.all(['game.mjs','index.html'].map(f=>readFile(new URL('./'+f,import.meta.url),'utf8')));
 assert.match(game,/import \{resolveShopEntrances,[^}]*\} from '\.\/shop-interiors\.mjs\?v=\d+'/);
 assert.equal((game.match(/createShopEntrances\(\);\n state\.people=createCityPedestrians\(\)/g)||[]).length,2,'on load and on the width switch');
 assert.match(game,/const target=footShopTarget\(p\);\n  if\(target\?\.door\)\{enterShopInterior\(target\.door\);return;\}/);
 assert.match(game,/shopDoor\?'ENTRA':shopNear\?'COMPRA'/);
 assert.match(game,/p\.x=inner\.outside\.x;p\.y=inner\.outside\.y;p\.a=inner\.outside\.a;/,'back to the exact outside spot');
 assert.match(game,/\{interior:!!state\.bankInterior\|\|!!state\.shopInterior\}/,'NPC clock frozen inside, as in the bank');
 assert.match(game,/if\(state\.shopInterior\)\{drawShopInterior\(c,cw,ch,state\.clock,state\.shopInterior,interiorZoom\(\),state\.shopInterior\.camera\);return;\}/);
 assert.match(game,/if\(state\.shopInterior\)\{leaveShop\(\);return;\}/,'Esc leaves the shop');
 assert.match(game,/stepShopInteriorPlayer\(inner,moveAxes\(\),pressed\.run,dt\)==='exit'/);
 assert.match(game,/drawShopEntrance\(c,e,state\.clock\)/);
 assert.ok(Number((html.match(/game\.mjs\?v=(\d+)/)||[])[1])>=181);
});
