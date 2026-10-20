/* GTA Melito — Q13: ore di punta del traffico (richiesta del committente, 20/10/2026).
 * Il numero di mezzi in circolazione segue l'orologio NPC (Q02): giorno normale = 140 mezzi,
 * picchi morbidi alle 8:00 e alle 20:00 (circa +35%, salita e discesa di circa un'ora), notte
 * fonda (1–5) circa la metà. Nessuno scalino: la curva è continua.
 * Qui c'è solo la curva oraria: entrate e uscite dei mezzi passano da balanceTraffic (BF09, varchi
 * di confine), che game.mjs chiama con state.trafficTarget = trafficTargetAt(minuti). */
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const RUSH_RULES=Object.freeze({base:140,peak:.36,night:.5,peaks:[8,20],spread:.6});
// Quota del traffico normale all'ora data (1 = giorno normale).
export function trafficShare(minutes){
 const R=RUSH_RULES,h=((Number(minutes)||0)/60%24+24)%24;
 // notte: metà tra l'1 e le 5, risale tra le 5 e le 7, scende tra le 22 e l'1 (coseno, senza scalini)
 const ease=k=>.5-.5*Math.cos(Math.PI*clamp(k,0,1));
 let base=1;
 if(h>=1&&h<5)base=R.night;
 else if(h>=5&&h<7)base=R.night+(1-R.night)*ease((h-5)/2);
 else if(h>=22)base=1-(1-R.night)*ease((h-22)/3);
 else if(h<1)base=1-(1-R.night)*ease((h+2)/3);
 const peak=R.peaks.reduce((sum,p)=>{const d=Math.min(Math.abs(h-p),24-Math.abs(h-p));return sum+Math.exp(-((d/R.spread)**2));},0);
 return base+R.peak*peak;
}
/* Unico punto che decide QUANTI mezzi circolano: curva oraria → numero di mezzi. */
export function trafficTargetAt(minutes,base=RUSH_RULES.base){return Math.round(base*trafficShare(minutes));}
