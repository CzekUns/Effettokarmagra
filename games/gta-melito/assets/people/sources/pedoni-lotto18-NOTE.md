# Lotto 18 — quattro pedoni nuovi

Grafica **PROVVISORIA, da approvare da Simone**. L'atlante `../pedoni-lotto18-4x4frames-24x40-rgba.png` è RGBA 384×160: 16 colonne × 4 righe, celle 24×40. Ogni personaggio occupa quattro colonne consecutive; righe `up`, `down`, `left`, `right`. I frame derivano dalla tavola madre `../pedoni-4x4frames-24x40-rgba.png`, ricolorata a zone e completata con accessori.

| Colonne | Personaggio | Segni distintivi | `kind` proposto |
|---|---|---|---|
| 0–3 | Turista | Cappello di paglia e macchina fotografica al collo | 35 |
| 4–7 | Ragazzo con skateboard | Maglietta arancione, skateboard sotto il braccio | 36 |
| 8–11 | Donna in tailleur | Giacca blu, tacchi e cartella | 37 |
| 12–15 | Anziano con giornale | Occhiali e giornale sotto il braccio | 38 |

`pedoni-lotto18-genera.py` contiene anche il codice degli accessori e rigenera il PNG in `assets/people/`; legge da lì la tavola madre e il lotto 17. Il foglio di confronto viene scritto in `sources/sheet.png` e non è necessario al gioco. Il verificatore originale e il confronto approvato per la revisione restano in `/home/ubuntu/codex-gh-lavoro/lotto18/`.

Il foglio è collegato nella tabella `PEDESTRIAN_SHEETS` di `extra-pedestrian-sprites.mjs`. Usa lo stesso renderer, pivot e dimensione a schermo degli altri pedoni (`ps(3.25) × ps(4.7)`). Entra nella rotazione di passanti, residenti e clienti del mercato senza aumentare il loro numero. Menu PAUSA › NOVITÀ › `lotto17-20-pedoni` › VAI A VEDERE. L'uso nel gioco non costituisce approvazione estetica.
