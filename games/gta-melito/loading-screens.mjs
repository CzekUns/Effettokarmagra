/* Schermate di caricamento di Melito. Artwork PROVVISORIE, da approvare da Simone.
 * La selezione avviene una volta all'avvio, prima del fetch della mappa. */
export const LOADING_SCREEN_STORAGE_KEY='gta-melito-loading-screen-last-v1';
export const LOADING_SCREENS=Object.freeze([
 {id:'render',title:'Via Roma nel gioco',desktop:'./assets/ui/loading-1280x720.png',mobile:'./assets/ui/loading-844x390.png',credit:'render del gioco provvisorio'},
 {id:'mercato',title:'Il mercato di Via Roma',desktop:'./assets/ui/loading-art-mercato-1280x720.jpg',mobile:'./assets/ui/loading-art-mercato-844x390.jpg',credit:'artwork provvisoria'},
 {id:'campetto-sera',title:'Il campetto di sera',desktop:'./assets/ui/loading-art-campetto-sera-1280x720.jpg',mobile:'./assets/ui/loading-art-campetto-sera-844x390.jpg',credit:'artwork provvisoria'},
 {id:'villa-comunale',title:'La villa comunale',desktop:'./assets/ui/loading-art-villa-comunale-1280x720.jpg',mobile:'./assets/ui/loading-art-villa-comunale-844x390.jpg',credit:'artwork provvisoria'},
 {id:'via-roma-pizzeria',title:'Via Roma di sera',desktop:'./assets/ui/loading-art-via-roma-pizzeria-1280x720.jpg',mobile:'./assets/ui/loading-art-via-roma-pizzeria-844x390.jpg',credit:'artwork provvisoria'},
 {id:'mercato-alba',title:'Il mercato all’alba',desktop:'./assets/ui/loading-art-mercato-alba-1280x720.jpg',mobile:'./assets/ui/loading-art-mercato-alba-844x390.jpg',credit:'artwork provvisoria'},
 {id:'festa-patronale',title:'La festa patronale',desktop:'./assets/ui/loading-art-festa-patronale-1280x720.jpg',mobile:'./assets/ui/loading-art-festa-patronale-844x390.jpg',credit:'artwork provvisoria'}
].map(Object.freeze));

export const GAM_LOADING_SCREEN=Object.freeze({id:'gam',title:'Grand Asse Mediano: Melito',desktop:'./assets/ui/gam-loading.webp',mobile:'./assets/ui/gam-loading.webp',credit:'artwork ufficiale approvata'});
export const LOADING_PHASES=9;

// Progress counts completed startup operations, not elapsed time or estimated network bytes.
export function setLoadingProgress(completed,{document:doc=globalThis.document}={}){
 const value=Math.round(100*Math.max(0,Math.min(LOADING_PHASES,Number(completed)||0))/LOADING_PHASES);
 const bar=doc?.getElementById?.('loading-bar');
 bar?.style.setProperty('--loading-progress',value+'%');
 bar?.setAttribute('aria-valuenow',String(value));
 const label=doc?.getElementById?.('loading-percent');
 if(label)label.textContent=value+'%';
 return value;
}

let lastInMemory=null;
export function chooseLoadingScreen({storage,random=Math.random}={}){
 if(storage===undefined){try{storage=globalThis.localStorage;}catch{storage=null;}}
 let last=lastInMemory;
 try{last=storage?.getItem(LOADING_SCREEN_STORAGE_KEY)||last;}catch{/* localStorage può essere disabilitato */}
 const previous=LOADING_SCREENS.findIndex(s=>s.id===last);
 const initial=Math.max(0,Math.min(LOADING_SCREENS.length-1,Math.floor(Number(random())*LOADING_SCREENS.length)||0));
 const screen=LOADING_SCREENS[previous<0?initial:(previous+1)%LOADING_SCREENS.length];
 lastInMemory=screen.id;
 try{storage?.setItem(LOADING_SCREEN_STORAGE_KEY,screen.id);}catch{/* resta la memoria della pagina */}
 return screen;
}

export function applyLoadingScreen({document:doc=globalThis.document,storage,random,forceId}={}){
 const loading=doc?.getElementById?.('loading');
 if(!loading)return null;
 const screen=forceId==='gam'?GAM_LOADING_SCREEN:LOADING_SCREENS.find(s=>s.id===forceId)||(forceId?chooseLoadingScreen({storage,random}):GAM_LOADING_SCREEN);
 loading.style.setProperty('--loading-desktop',`url("${screen.desktop}")`);
 loading.style.setProperty('--loading-mobile',`url("${screen.mobile}")`);
 loading.dataset.screen=screen.id;
 const caption=doc.getElementById('loading-scene-title');
 if(caption)caption.textContent=`${screen.title} · ${screen.credit}`;
 return screen;
}
