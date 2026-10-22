import test from 'node:test';
import assert from 'node:assert/strict';
import {buildWhatsAppShareText,buildWhatsAppShareUrl,PUBLIC_GAME_URL} from './reference-share.mjs';

test('uscita con zero cioccolate e URL pubblico giocabile',()=>{
  const result={outcome:'escaped',chocolates:0,crowns:0,best:0,fine:0};
  const text=buildWhatsAppShareText(result);
  assert.match(text,/0 cioccolate \(0 Kč\)/);
  assert.ok(text.endsWith(PUBLIC_GAME_URL));
  assert.equal(new URL(buildWhatsAppShareUrl(result)).searchParams.get('text'),text);
});

test('cattura con saldo negativo conserva multa, record e caratteri Unicode',()=>{
  const result={outcome:'caught',chocolates:7,crowns:-43,best:19,fine:50};
  const text=buildWhatsAppShareText(result);
  assert.match(text,/Multa: 50 Kč; saldo: -43 Kč/);
  assert.match(text,/record resta 19 Kč/);
  assert.match(text,/🚨/);
  assert.equal(new URL(buildWhatsAppShareUrl(result)).searchParams.get('text'),text);
  assert.notEqual(text,buildWhatsAppShareText({...result,outcome:'escaped'}));
});
