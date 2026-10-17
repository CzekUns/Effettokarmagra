/* Original generated pixel materials. No photography or third-party game art.
 * Small cached repeating bitmaps: texture creation occurs once, not per frame. */
const cache=new WeakMap();
const sources=new Map();
function random(seed){let n=seed>>>0;return()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};}
export function material(c,kind,fallback){
 if(typeof OffscreenCanvas==='undefined'||typeof DOMMatrix==='undefined')return fallback;
 let textures=cache.get(c);if(!textures){textures=new Map();cache.set(c,textures);}
 if(textures.has(kind))return textures.get(kind);
 let canvas=sources.get(kind);
 if(!canvas){
 canvas=new OffscreenCanvas(128,128);
 const g=canvas.getContext('2d'),r=random(71+kind.length*101);
 if(kind==='clay'){
  g.fillStyle='#7b3020';g.fillRect(0,0,128,128);
  const colors=['#da6531','#e0773b','#c6542b','#ed8544','#ce592d'];
  for(let row=0;row<16;row++)for(let col=-1;col<16;col++){
   const x=col*8+(row%2)*4,y=row*8;
   g.fillStyle=colors[Math.floor(r()*colors.length)];g.fillRect(x+1,y+1,7,7);
   g.fillStyle='#ffb16a';g.fillRect(x+2,y+1,2,6);
   g.fillStyle='#a34022';g.fillRect(x+6,y+2,1,6);
   g.fillStyle='#f0954f';g.fillRect(x+2,y+1,4,1);
  }
 }else if(kind==='stone'){
  g.fillStyle='#a58e6e';g.fillRect(0,0,128,128);
  const colors=['#cbb58f','#d2bc96','#c3ac89','#dac49d','#cbb595'];
  for(let row=0;row<8;row++)for(let col=-1;col<8;col++){
   const x=col*16+(row%2)*8,y=row*16;
   g.fillStyle=colors[Math.floor(r()*5)];g.fillRect(x+1,y+1,15,15);
   g.fillStyle='#e2cea9';g.fillRect(x+2,y+1,13,1);
   g.fillStyle='#b49b77';g.fillRect(x+14,y+2,1,13);
  }
 }else{
  g.fillStyle=kind==='asphalt'?'#303638':'#bca784';g.fillRect(0,0,128,128);
 }
 for(let i=0;i<1800;i++){
  g.fillStyle=i%2?'#ffffff0d':'#00000012';g.fillRect(Math.floor(r()*128),Math.floor(r()*128),1,1);
 }
 sources.set(kind,canvas);
 }
 const pattern=c.createPattern(canvas,'repeat');
 if(!pattern)return fallback;
 pattern.setTransform(new DOMMatrix().scale(kind==='clay'?.15:kind==='stone'?.115:.22));
 textures.set(kind,pattern);return pattern;
}
