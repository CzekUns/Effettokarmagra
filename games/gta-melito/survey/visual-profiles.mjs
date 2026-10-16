/* Edge-to-edge municipal survey. Photographic fidelity is NEVER implied by
 * draft material colours. Source: actual OSM building IDs + separate per-way review. */
export function applySurveyDrafts(buildings, sectors){
 const overrides=new Map();
 for(const batch of sectors||[])for(const item of batch.profiles||[]){
  if(!Number.isInteger(item.id)||overrides.has(item.id))throw Error('ID profilo sopralluogo non valido: '+item.id);
  if(item.status!=='osm-draft'&&item.status!=='photo-verified')throw Error('Stato sopralluogo non valido');
  overrides.set(item.id,item);
 }
 let applied=0,verified=0;
 for(const b of buildings){
  const draft=overrides.get(b.id);
  if(!draft||!b.art)continue;
  b.art.surveyStatus=draft.status;
  b.art.surveyEvidence=draft.evidence.slice();
  b.art.facadeTint=draft.facade;
  b.art.roofTint=draft.roof;
  b.art.roofDirection=draft.longAxisDeg;
  b.art.surveyDesign=draft.detail;
  if(draft.osmType==='industrial'&&b.t==='industrial')b.art.type='industrial';
  if(draft.roofShape)b.art.roof=true;
  applied++;if(draft.photoVerified)verified++;
 }
 if(applied!==overrides.size)throw Error('Sono cambiati '+(overrides.size-applied)+' ID OSM; le schede vanno riallineate');
 return {applied,verified,total:buildings.length};
}
