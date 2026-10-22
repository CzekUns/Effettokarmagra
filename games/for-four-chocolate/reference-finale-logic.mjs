export const FINALE_STEPS=Object.freeze({
  escaped:Object.freeze([{id:'door',seconds:1.3},{id:'street',seconds:5.2},{id:'result',seconds:Infinity}]),
  caught:Object.freeze([{id:'escort',seconds:1.3},{id:'office',seconds:6.8},{id:'escalator',seconds:4.4},
    {id:'street',seconds:3.1},{id:'fine',seconds:3.2},{id:'result',seconds:Infinity}])
});
export function createFinale(outcome){
  if(!FINALE_STEPS[outcome])throw new Error('Esito sconosciuto');
  return {outcome,index:0,time:0,step:FINALE_STEPS[outcome][0].id};
}
export function advanceFinale(finale,delta){
  if(finale.step==='result')return finale;
  finale.time+=Math.max(0,Math.min(.2,delta));
  if(finale.time>=FINALE_STEPS[finale.outcome][finale.index].seconds)nextFinaleStep(finale);
  return finale;
}
export function nextFinaleStep(finale){
  finale.index=Math.min(finale.index+1,FINALE_STEPS[finale.outcome].length-1);
  finale.step=FINALE_STEPS[finale.outcome][finale.index].id;
  finale.time=0;return finale;
}
export function skipFinale(finale){
  finale.index=FINALE_STEPS[finale.outcome].length-1;
  finale.step='result';finale.time=0;return finale;
}
export function finaleSubtitle(finale){
  if(finale.step==='office')return finale.time<3.8?
    {spoken:'Za čtyři čokolády jste urazil Českou republiku!',translation:'Per quattro cioccolate hai offeso la Repubblica Ceca!'}:
    {spoken:'For four chocolate!',translation:'La battuta è sempre quella, qualunque sia il bottino.'};
  if(finale.step==='fine')return {spoken:'POKUTA 50 Kč',translation:'POLICIE consegna la multa a Ipno.'};
  if(finale.step==='street'&&finale.outcome==='escaped')return {spoken:'Vítej v Praze!',translation:'La comitiva festeggia il ritorno di Ipno.'};
  return null;
}
