/* GTA Melito — compact top-down PNG vehicle skins. Panda PNGs unchanged.
 * Punto 188 and Ypsilon 2003: 16 recolored cars, clean transparent 4x4 PNG atlas, 40x60/cell.
 * Body colors are illustrative, not all factory paint codes verified.
 */
export const CAR_SPRITES=Object.freeze({
 'panda-modern-white':'./assets/vehicles/panda-modern-white.png',
 'panda-fire-red':'./assets/vehicles/panda-fire-red.png',
 'ape-car-azzurra':'./assets/vehicles/ape-car-top.png',
 'furgone-fritti':'./assets/vehicles/furgone-fritti-top.png',
});
export const CAR_ATLAS_PATH='./assets/vehicles/punto-ypsilon-16colors-rgba.png';
export const CAR_ATLAS_CELL=Object.freeze({width:40,height:60,columns:4,rows:4});
const PUNTO=['white','red','blue','silver','graphite','black','mint','champagne'];
const YPSILON=['white','black','silver','graphite','navy','lightblue','burgundy','champagne'];
export const CAR_ATLAS_VARIANTS=Object.freeze(Object.fromEntries([
 ...PUNTO.map((color,i)=>['punto-188-'+color,{index:i,model:'punto-188',color}]),
 ...YPSILON.map((color,i)=>['ypsilon-2003-'+color,{index:i+8,model:'ypsilon-2003',color}])
]));
export const CAR_ATLAS_VARIANT_IDS=Object.freeze(Object.keys(CAR_ATLAS_VARIANTS));

/* Additional 4x4 compact atlases, 8 illustrative colors per car generation. */
export const EXTRA_CAR_ATLASES=Object.freeze({
 '@seicento-500-atlas':'./assets/vehicles/seicento-500-16colors-rgba.png',
 '@uno-smart-atlas':'./assets/vehicles/uno-smart-16colors-rgba.png',
});
const EXTRA_MODELS=Object.freeze([
 {model:'seicento-1998',atlas:'@seicento-500-atlas',offset:0,colors:['white','red','blue','silver','black','yellow','green','champagne']},
 {model:'fiat-500-2007',atlas:'@seicento-500-atlas',offset:8,colors:['white','black','red','lightblue','blue','silver','cream','graphite']},
 {model:'fiat-uno-1983',atlas:'@uno-smart-atlas',offset:0,colors:['white','red','blue','silver','graphite','black','green','champagne']},
 {model:'smart-fortwo-2007',atlas:'@uno-smart-atlas',offset:8,colors:['white','black','red','lightblue','blue','silver','yellow','green']},
]);
export const EXTRA_CAR_VARIANTS=Object.freeze(Object.fromEntries(
 EXTRA_MODELS.flatMap(({model,atlas,offset,colors})=>
  colors.map((color,i)=>[model+'-'+color,{index:offset+i,model,color,atlas}]))
));
/* 4x4 atlas: 8 Ape market bodies + 8 food vendor stalls.
 * Open awnings belong to stationary vehicles, not AI traffic.
 */
export const MARKET_ATLAS_PATH='./assets/vehicles/ape-food-16-rgba.png';
export const MARKET_ATLAS_CELL=Object.freeze({width:56,height:64,columns:4,rows:4});
const MARKET_GROUPS=Object.freeze([
 {model:'ape-mercato',ids:['ape-azzurra-vuota','ape-azzurra-ferro','ape-azzurra-ortofrutta','ape-azzurra-pesce',
   'ape-verde-vuota','ape-verde-ferro','ape-verde-ortofrutta','ape-verde-pesce']},
 {model:'furgone-ambulante',ids:['food-zeppole-panzerotti','food-pere-e-musso','food-panini','food-hot-dog',
   'food-cornetti','food-pizza-portafoglio','food-pizzette-fritte','food-misto']}
]);
export const MARKET_VARIANTS=Object.freeze(Object.fromEntries(MARKET_GROUPS.flatMap((group,g)=>
 group.ids.map((id,i)=>[id,{index:g*8+i,model:group.model,atlas:'@market-atlas'}]))));
export const MARKET_VARIANT_IDS=Object.freeze(Object.keys(MARKET_VARIANTS));
/* Q16: 4x4 atlas of the Ape Car (three-wheeler with open bed), same 56x64 cells and shape as the market
 * Apes: row 1-2 eight clean paints, row 3-4 the same eight paints «vissute» (worn, rusty). Derived by zone
 * recolouring of the body only from the two approved Apes of ape-food-16 (glass, tyres, lights and rust
 * untouched). Paints are interpretations, not Piaggio factory codes. */
export const APE_CAR_ATLAS_PATH='./assets/vehicles/ape-classica-16-rgba.png';
export const APE_CAR_PAINTS=Object.freeze(['azzurra','verde','rossa','bianca','grigia','gialla','blu','crema']);
export const APE_CAR_VARIANTS=Object.freeze(Object.fromEntries([
 ...APE_CAR_PAINTS.map((paint,i)=>['ape-classica-'+paint,{index:i,model:'ape-classica',paint,atlas:'@ape-car-atlas'}]),
 ...APE_CAR_PAINTS.map((paint,i)=>['ape-vissuta-'+paint,{index:8+i,model:'ape-classica',paint,worn:true,atlas:'@ape-car-atlas'}])
]));
export const APE_CAR_IDS=Object.freeze(Object.keys(APE_CAR_VARIANTS));
/* Q18: 4x4 atlas of two service vehicles, cells 52x92 (same pixel density for both, ~7 px per unit):
 * rows 1-2 a compact high-roof courier van (cab, short bonnet, raised cargo box), rows 3-4 an urban
 * refuse truck with compactor body and rear loader. Hand-placed pixel art drawn by code
 * (sources/servizio-16-genera.py), real alpha; liveries invented and plain: no logos, brands or text. */
export const SERVICE_ATLAS_PATH='./assets/vehicles/servizio-16-rgba.png';
export const SERVICE_ATLAS_CELL=Object.freeze({width:52,height:92,columns:4,rows:4});
export const COURIER_LIVERIES=Object.freeze(['bianco','bianco-fascia-blu','bianco-fascia-verde','argento','grigio-scuro','blu-notte','azzurro','bianco-vissuto']);
export const REFUSE_LIVERIES=Object.freeze(['verde','bianco-verde','bianco-blu','arancio','grigio','verde-scuro','bianco-arancio','verde-vissuto']);
export const SERVICE_VARIANTS=Object.freeze(Object.fromEntries([
 ...COURIER_LIVERIES.map((livery,i)=>['corriere-'+livery,{index:i,model:'corriere',livery,atlas:'@service-atlas'}]),
 ...REFUSE_LIVERIES.map((livery,i)=>['nettezza-'+livery,{index:8+i,model:'nettezza',livery,atlas:'@service-atlas'}])
]));
export const COURIER_IDS=Object.freeze(COURIER_LIVERIES.map(l=>'corriere-'+l));
export const REFUSE_TRUCK_IDS=Object.freeze(REFUSE_LIVERIES.map(l=>'nettezza-'+l));
/* Q19: second 4x4 atlas of service vehicles, same pixel density (~7 px per unit) but taller cells 52x124 so
 * the bus fits: rows 1-2 a flatbed tow truck (short cab with amber light bar, winch, slatted bed, loading
 * ramps), rows 3-4 a short urban bus (light roof with two A/C units and hatches, window bands on both sides,
 * doors on the right). Drawn by code (sources/servizio2-16-genera.py); invented liveries, no logos, no text. */
export const SERVICE2_ATLAS_PATH='./assets/vehicles/servizio2-16-rgba.png';
export const SERVICE2_ATLAS_CELL=Object.freeze({width:52,height:124,columns:4,rows:4});
export const TOW_LIVERIES=Object.freeze(['giallo','arancio','bianco-rosso','rosso','blu','bianco','grigio-arancio','giallo-vissuto']);
export const BUS_LIVERIES=Object.freeze(['arancio','verde-bianco','blu-bianco','rosso','bianco-azzurro','giallo','grigio-verde','arancio-vissuto']);
export const SERVICE2_VARIANTS=Object.freeze(Object.fromEntries([
 ...TOW_LIVERIES.map((livery,i)=>['attrezzi-'+livery,{index:i,model:'attrezzi',livery,atlas:'@service2-atlas'}]),
 ...BUS_LIVERIES.map((livery,i)=>['autobus-'+livery,{index:8+i,model:'autobus',livery,atlas:'@service2-atlas'}])
]));
export const TOW_TRUCK_IDS=Object.freeze(TOW_LIVERIES.map(l=>'attrezzi-'+l));
export const BUS_IDS=Object.freeze(BUS_LIVERIES.map(l=>'autobus-'+l));
export const STREET_VENDOR_VEHICLES=Object.freeze(['ape-car-azzurra','furgone-fritti']);
export const CAR_TRAFFIC_SPRITE_IDS=Object.freeze([...CAR_ATLAS_VARIANT_IDS,...Object.keys(EXTRA_CAR_VARIANTS),...STREET_VENDOR_VEHICLES]);
export const CAR_PARKED_SPRITE_IDS=Object.freeze([...CAR_TRAFFIC_SPRITE_IDS,...MARKET_VARIANT_IDS]);
const MODEL_DRAW_SIZE=Object.freeze({
 'punto-188':[5.45,8.75],'ypsilon-2003':[5.25,8.55],
 'seicento-1998':[4.9,7.6],'fiat-500-2007':[5.15,8],
 'fiat-uno-1983':[5.1,8.15],'smart-fortwo-2007':[4.7,6.45],
 'ape-car-azzurra':[4.1,6.25],'furgone-fritti':[5.65,8.65],
 'ape-mercato':[5.7,6.9],'furgone-ambulante':[7.9,9.3],'ape-classica':[5.7,6.9],
 // Q18: whole 52x92 cell; the van body is then ~5,7 x 9,4 and the refuse truck ~6,3 x 12,4.
 'corriere':[7.43,13.14],'nettezza':[7.43,13.14],
 // Q19: whole 52x124 cell; the tow truck body is then ~5,7 x 12,3 and the bus ~6,3 x 16,9.
 'attrezzi':[7.43,17.71],'autobus':[7.43,17.71],
});

const cache=new Map();
let attempted=false;
export function loadCarSprites(){
 if(attempted||typeof Image==='undefined')return;
 attempted=true;
 for(const [model,path] of Object.entries({...CAR_SPRITES,'@punto-ypsilon-atlas':CAR_ATLAS_PATH,...EXTRA_CAR_ATLASES,'@market-atlas':MARKET_ATLAS_PATH,'@ape-car-atlas':APE_CAR_ATLAS_PATH,'@service-atlas':SERVICE_ATLAS_PATH,'@service2-atlas':SERVICE2_ATLAS_PATH})){
  const img=new Image();
  // New atlas is natively transparent: never matte-key or mask at runtime.
  cache.set(model,img);
  img.onerror=()=>console.warn('Optional GTA Melito vehicle PNG unavailable:',model);
  img.src=new URL(path,import.meta.url).href;
 }
}
function loadedImage(model){
 const key=CAR_ATLAS_VARIANTS[model]?'@punto-ypsilon-atlas':(EXTRA_CAR_VARIANTS[model]?.atlas||MARKET_VARIANTS[model]?.atlas||APE_CAR_VARIANTS[model]?.atlas||SERVICE_VARIANTS[model]?.atlas||SERVICE2_VARIANTS[model]?.atlas||model);
 return cache.get(key);
}
export function carSpriteReady(model){
 const img=loadedImage(model);
 if(MARKET_VARIANTS[model]||APE_CAR_VARIANTS[model])return !!(img?.complete&&img.naturalWidth===224&&img.naturalHeight===256);
 if(SERVICE_VARIANTS[model])return !!(img?.complete&&img.naturalWidth===208&&img.naturalHeight===368);
 if(SERVICE2_VARIANTS[model])return !!(img?.complete&&img.naturalWidth===208&&img.naturalHeight===496);
 if(CAR_ATLAS_VARIANTS[model]||EXTRA_CAR_VARIANTS[model])return !!(img?.complete&&img.naturalWidth===160&&img.naturalHeight===240);
 return !!(img?.complete&&img.naturalWidth>0&&img.naturalHeight>0);
}
export function drawCarSprite(ctx,x,y,angle,model,focused=false){
 if(!model)return false;
 if(!attempted)loadCarSprites();
 const img=loadedImage(model);
 if(!carSpriteReady(model))return false;
 const variant=CAR_ATLAS_VARIANTS[model]||EXTRA_CAR_VARIANTS[model]||MARKET_VARIANTS[model]||APE_CAR_VARIANTS[model]||SERVICE_VARIANTS[model]||SERVICE2_VARIANTS[model];
 const [width,length]=MODEL_DRAW_SIZE[variant?.model||model]||(model==='panda-modern-white'?[5.5,8.75]:[5.1,8.55]);
 ctx.save();ctx.translate(x,y);ctx.rotate(angle+Math.PI/2);ctx.imageSmoothingEnabled=false;
 if(variant){
  const {width:sw,height:sh,columns}=SERVICE2_VARIANTS[model]?SERVICE2_ATLAS_CELL:SERVICE_VARIANTS[model]?SERVICE_ATLAS_CELL:MARKET_VARIANTS[model]||APE_CAR_VARIANTS[model]?MARKET_ATLAS_CELL:CAR_ATLAS_CELL;
  const sx=(variant.index%columns)*sw,sy=Math.floor(variant.index/columns)*sh;
  ctx.drawImage(img,sx,sy,sw,sh,-width/2,-length/2,width,length);
 }else ctx.drawImage(img,-width/2,-length/2,width,length);
 if(focused){
  ctx.strokeStyle='#f5d887';ctx.lineWidth=.18;
  ctx.strokeRect(-width/2-.12,-length/2-.12,width+.24,length+.24);
 }
 ctx.restore();
 return true;
}
