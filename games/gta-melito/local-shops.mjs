/* Q06: economia locale di base.
 * I punti vendita sono le attività con nome di OpenStreetMap già mostrate in strada
 * (storefronts.mjs): il nome è reale, prodotti e prezzi sono INVENTATI per il gioco.
 * Si paga con i soldi della campagna (missioni, mance della Q05); acquisti salvati
 * insieme alla campagna. Effetti: "carica" (corsa più veloce per un po'),
 * "rispetto" (servizio) e "ricordo" (oggetto da collezione). */
export const OFFERS=Object.freeze({
 caffe:{name:'Caffè al banco',price:1,effect:'carica',seconds:90},
 cornetto:{name:'Cornetto',price:2,effect:'carica',seconds:150},
 sfogliatella:{name:'Sfogliatella',price:2,effect:'carica',seconds:150},
 pane:{name:'Pane cafone',price:2,effect:'carica',seconds:120},
 acqua:{name:'Bottiglia d’acqua',price:1,effect:'carica',seconds:60},
 cartolina:{name:'Cartolina di Melito',price:3,effect:'ricordo'},
 taglio:{name:'Taglio di capelli',price:12,effect:'rispetto',respect:3}
});
const BY_KIND={bar:['caffe','cornetto'],cafe:['caffe','cornetto'],pastry:['sfogliatella','caffe'],
 bakery:['pane','sfogliatella'],supermarket:['acqua','pane'],convenience:['acqua'],
 stationery:['cartolina'],hairdresser:['taglio']};
export const SHOP_RADIUS=5;
export const BOOST_FACTOR=1.15;
export function offersFor(kind){return (BY_KIND[kind]||[]).map(id=>({id,...OFFERS[id]}));}
export function shopNote(){return 'Nome reale da OpenStreetMap · prodotti e prezzi inventati per il gioco';}
// Il punto vendita più vicino, solo a piedi e solo se vende qualcosa.
export function nearestShop(shops,player,radius=SHOP_RADIUS){
 if(!player||player.car>=0)return null;
 let best=null;
 for(const shop of shops||[]){
  if(!offersFor(shop.kind).length)continue;
  const d=Math.hypot(shop.x-player.x,shop.y-player.y);
  if(d<=radius&&(!best||d<best.d))best={shop,d};
 }
 return best?.shop||null;
}
export function freshShopSave(){return {bought:{},spent:0};}
// Salvataggio letto da localStorage: solo prodotti noti e numeri sensati.
export function sanitizeShopSave(raw){
 const out=freshShopSave();
 if(!raw||typeof raw!=='object')return out;
 for(const [id,count] of Object.entries(raw.bought||{}))
  if(OFFERS[id]&&Number.isInteger(count)&&count>0)out.bought[id]=Math.min(count,999);
 const spent=Number(raw.spent);
 out.spent=Number.isFinite(spent)&&spent>0?Math.min(Math.floor(spent),999999):0;
 return out;
}
/* Acquisto: modifica progress solo se i soldi bastano. Restituisce l'esito con il saldo. */
export function buyOffer(progress,offerId,shop=null){
 const offer=OFFERS[offerId];
 if(!progress||!offer)return {ok:false,reason:'sconosciuto',balance:progress?.money??0};
 if(shop&&!offersFor(shop.kind).some(o=>o.id===offerId))return {ok:false,reason:'non-in-vendita',balance:progress.money};
 if(!(progress.money>=offer.price))return {ok:false,reason:'fondi-insufficienti',need:offer.price,balance:progress.money};
 progress.shop=sanitizeShopSave(progress.shop);
 progress.money-=offer.price;
 progress.shop.bought[offerId]=Math.min(999,(progress.shop.bought[offerId]||0)+1);
 progress.shop.spent=Math.min(999999,progress.shop.spent+offer.price);
 if(offer.effect==='rispetto')progress.respect=Math.min(1000,(progress.respect||0)+offer.respect);
 return {ok:true,offer:{id:offerId,...offer},balance:progress.money};
}
// Effetto "carica": si somma fino a un massimo di 5 minuti, vale solo a piedi.
export function addBoost(boost,offer,clock){
 if(offer?.effect!=='carica')return boost||null;
 const from=Math.max(clock,boost?.until||0);
 return {until:Math.min(clock+300,from+offer.seconds)};
}
export function boostFactor(boost,clock){return boost&&clock<boost.until?BOOST_FACTOR:1;}
export function boostSecondsLeft(boost,clock){return boost?Math.max(0,Math.ceil(boost.until-clock)):0;}
export function purchaseMessage(result){
 if(result.ok)return result.offer.name+' · −'+result.offer.price+' € · saldo '+result.balance+' €'+
  (result.offer.effect==='carica'?' · corsa più veloce per '+result.offer.seconds+' s':
   result.offer.effect==='rispetto'?' · +'+result.offer.respect+' rispetto':' · aggiunta alla collezione');
 if(result.reason==='fondi-insufficienti')return 'Fondi insufficienti: servono '+result.need+' €, hai '+result.balance+' €. Guadagnali con le missioni.';
 return 'Non disponibile qui.';
}
