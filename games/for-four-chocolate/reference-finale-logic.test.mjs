import test from 'node:test';
import assert from 'node:assert/strict';
import {createFinale,advanceFinale,nextFinaleStep,skipFinale,finaleSubtitle} from './reference-finale-logic.mjs';

test('uscita e cattura percorrono scene distinte e arrivano al risultato',()=>{
  const escaped=createFinale('escaped');assert.equal(escaped.step,'door');
  nextFinaleStep(escaped);assert.equal(escaped.step,'street');
  assert.match(finaleSubtitle(escaped).spoken,/Praze/);
  nextFinaleStep(escaped);assert.equal(escaped.step,'result');
  const caught=createFinale('caught');
  assert.deepEqual(['escort','office','escalator','street','fine','result'],
    Array.from({length:6},(_,i)=>{const step=caught.step;if(i<5)nextFinaleStep(caught);return step;}));
});

test('dialogo ceco e battuta fissa, salto sempre disponibile',()=>{
  const finale=createFinale('caught');nextFinaleStep(finale);
  assert.equal(finaleSubtitle(finale).spoken,'Za čtyři čokolády jste urazil Českou republiku!');
  finale.time=4;assert.equal(finaleSubtitle(finale).spoken,'For four chocolate!');
  skipFinale(finale);assert.equal(finale.step,'result');
  advanceFinale(finale,10);assert.equal(finale.step,'result');
});
