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
 taglio:{name:'Taglio di capelli',price:12,effect:'rispetto',respect:3},
 // Q17: cibo di strada dei friggitori ambulanti (nomi dei venditori e prezzi INVENTATI).
 frittatina:{name:'Frittatina di pasta',price:2,effect:'carica',seconds:150},
 crocche:{name:'Crocchè di patate',price:1,effect:'carica',seconds:90},
 zeppola:{name:'Zeppola fritta',price:1,effect:'carica',seconds:90},
 panzerotto:{name:'Panzerotto',price:2,effect:'carica',seconds:150},
 portafoglio:{name:'Pizza a portafoglio',price:2,effect:'carica',seconds:180},
 pizzetta:{name:'Pizzetta fritta',price:1,effect:'carica',seconds:90},
 panino:{name:'Panino salsiccia e friarielli',price:4,effect:'carica',seconds:240},
 hotdog:{name:'Hot dog',price:3,effect:'carica',seconds:180},
 peremusso:{name:'’O pere e ’o musso',price:4,effect:'carica',seconds:200}
});
const BY_KIND={bar:['caffe','cornetto'],cafe:['caffe','cornetto'],pastry:['sfogliatella','caffe'],
 bakery:['pane','sfogliatella'],supermarket:['acqua','pane'],convenience:['acqua'],
 stationery:['cartolina'],hairdresser:['taglio'],
 'street-fritti':['frittatina','crocche','zeppola'],'street-zeppole':['zeppola','panzerotto','frittatina'],
 'street-pere-musso':['peremusso'],'street-panini':['panino','frittatina'],'street-hotdog':['hotdog'],
 'street-cornetti':['cornetto','caffe'],'street-portafoglio':['portafoglio','crocche'],
 'street-pizzette':['pizzetta','crocche','frittatina'],'street-misto':['frittatina','crocche','pizzetta']};
/* Q17: ogni furgoncino del cibo di strada (sprite food-* e furgone-fritti) vende al banco con il
 * suo friggitore (BF04). Il nome del venditore è di fantasia, come i prodotti e i prezzi. */
export const VENDOR_KINDS=Object.freeze({
 'furgone-fritti':{kind:'street-fritti',name:'Friggitoria ambulante'},
 'food-zeppole-panzerotti':{kind:'street-zeppole',name:'Zeppole e panzerotti'},
 'food-pere-e-musso':{kind:'street-pere-musso',name:'’O pere e ’o musso'},
 'food-panini':{kind:'street-panini',name:'Panini ambulante'},
 'food-hot-dog':{kind:'street-hotdog',name:'Hot dog ambulante'},
 'food-cornetti':{kind:'street-cornetti',name:'Cornetti caldi'},
 'food-pizza-portafoglio':{kind:'street-portafoglio',name:'Pizza a portafoglio'},
 'food-pizzette-fritte':{kind:'street-pizzette',name:'Pizzette fritte'},
 'food-misto':{kind:'street-misto',name:'Fritto misto ambulante'}
});
// Q17: il banco di un furgoncino è un punto vendita accanto al suo friggitore (al suo posto di lavoro).
export function vendorShops(foodVendors){
 return (foodVendors||[]).flatMap(({vehicle,fryer})=>{
  const sale=VENDOR_KINDS[vehicle?.model];
  if(!sale||!fryer?.post)return [];
  return [{x:fryer.post.x,y:fryer.post.y,kind:sale.kind,name:sale.name,vendor:true,fryer,vehicle}];
 });
}
// Si compra solo se il friggitore è al banco (non spinto via da un urto o in fuga).
export function vendorOpen(shop){
 if(!shop?.vendor)return true;
 const f=shop.fryer;
 return !!f&&!(f.impactTime>0)&&Math.hypot(f.x-shop.x,f.y-shop.y)<2.5;
}
export const SHOP_RADIUS=5;
export const BOOST_FACTOR=1.15;
export function offersFor(kind){return (BY_KIND[kind]||[]).map(id=>({id,...OFFERS[id]}));}
export function shopNote(shop=null){
 return shop?.vendor?'Ambulante di fantasia · prodotti e prezzi inventati per il gioco':
  'Nome reale da OpenStreetMap · prodotti e prezzi inventati per il gioco';
}
// Il punto vendita più vicino, solo a piedi e solo se vende qualcosa.
export function nearestShop(shops,player,radius=SHOP_RADIUS){
 if(!player||player.car>=0)return null;
 let best=null;
 for(const shop of shops||[]){
  if(!offersFor(shop.kind).length||!vendorOpen(shop))continue;
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
