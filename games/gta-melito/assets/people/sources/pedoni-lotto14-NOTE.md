# Lotto 14 — altri quattro passanti

I 64 frame sono adattati e ricolorati a zone dalla tavola madre. Le quattro direzioni, il passo, i piedi e il pivot sono conservati; abiti, accessori e carnagioni cambiano. Il velo è una fascia colorata attorno al capo e lascia visibile il volto nella vista frontale. Grafica provvisoria da giudicare in gioco.

## File e formato

- `pedoni-lotto14-4x4frames-24x40-rgba.png`: atlante di gioco **384×160 px RGBA**, 16 colonne × 4 righe, **64 celle 24×40 px**.
- `sheet.png`: confronto **3516×502 px** alla stessa scala **3×**: lotto 14, tavola madre, lotto 13. Solo per revisione.
- `riferimento-pedoni.png` e `riferimento-lotto13.png`: copie locali per rigenerare lo sheet.
- `genera.py`: crea atlante e sheet; `verifica.py`: controlla le 64 celle da qualsiasi cartella.

| Colonne | Personaggio | Segni distintivi | `kind` proposto |
|---|---|---|---|
| 0–3 | Uomo estivo | Canottiera bianca, bermuda verde chiaro | 27 |
| 4–7 | Signora elegante | Cappello a falda con nastro, vestito blu | 28 |
| 8–11 | Studente | Giacca salvia, occhiali, cartellina al fianco | 29 |
| 12–15 | Donna | Velo corallo, abito lungo petrolio | 30 |

Le righe sono `up`, `down`, `left`, `right`; ogni identità ha quattro frame consecutivi. Le basi di camminata restano i frame della tavola madre, adattati a zone.

## Collegamento nel gioco

I kind proposti sono **27–30**, dopo il lotto 13 (23–26). In `extra-pedestrian-sprites.mjs` aggiungere percorso PNG, cache e funzione dedicata sul modello del lotto 2; aggiornare `PEDESTRIAN_KIND_COUNT` a **31** dopo l'integrazione sequenziale. Usare `identity=p.kind-27`, `sx=(identity*4+frame)*24`, `sy=direction*40`, `width=ps(3.25)`, `height=ps(4.7)` e la fase di camminata esistente. In `city-art.mjs` instradare i kind 27–30 prima dei rami precedenti, mantenendo il fallback se il PNG manca. Verificare in gioco che lo spawn usi il nuovo totale.

## Verifica

`verifica.py` controlla **64/64 celle**: formato, alpha binario, un corpo opaco, margini e angoli trasparenti, piedi in basso, nessun RGB residuo o alone chiaro, frame e direzioni distinti, posa allineata alla tavola madre e tre pannelli dello sheet alla stessa scala. Nessun file del repository modificato e nulla pubblicato.
