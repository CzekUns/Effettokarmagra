# Lotto 17 — quattro pedoni nuovi

Grafica **PROVVISORIA, da approvare da Simone**. L'atlante `../pedoni-lotto17-4x4frames-24x40-rgba.png` è RGBA 384×160: 16 colonne × 4 righe, celle 24×40. Ogni personaggio occupa quattro colonne consecutive; righe `up`, `down`, `left`, `right`. I frame derivano dalla tavola madre `../pedoni-4x4frames-24x40-rgba.png`, ricolorata a zone e completata con accessori.

| Colonne | Personaggio | Segni distintivi | `kind` proposto |
|---|---|---|---|
| 0–3 | Postino | Divisa blu e gialla, fascia e borsa a tracolla | 31 |
| 4–7 | Pizzaiolo | Maglietta chiara, grembiule, cartoni della pizza | 32 |
| 8–11 | Netturbino | Divisa verde e arancione, scopa | 33 |
| 12–15 | Prete | Talare nera e colletto bianco | 34 |

`pedoni-lotto17-genera.py` contiene anche il codice degli accessori e rigenera il PNG in `assets/people/`; legge da lì la tavola madre e il lotto 14. Il foglio di confronto viene scritto in `sources/sheet.png` e non è necessario al gioco. Il verificatore originale e il confronto approvato per la revisione restano in `/home/ubuntu/codex-gh-lavoro/lotto17/`.

Il foglio è collegato nella tabella `PEDESTRIAN_SHEETS` di `extra-pedestrian-sprites.mjs`. Usa lo stesso renderer, pivot e dimensione a schermo degli altri pedoni (`ps(3.25) × ps(4.7)`). Entra nella rotazione di passanti, residenti e clienti del mercato senza aumentare il loro numero. Menu PAUSA › NOVITÀ › `lotto17-20-pedoni` › VAI A VEDERE. L'uso nel gioco non costituisce approvazione estetica.
