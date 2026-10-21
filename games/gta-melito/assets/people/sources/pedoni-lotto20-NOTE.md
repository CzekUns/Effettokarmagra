# Lotto 20 — quattro pedoni nuovi

Grafica **PROVVISORIA, da approvare da Simone**. L'atlante `../pedoni-lotto20-4x4frames-24x40-rgba.png` è RGBA 384×160: 16 colonne × 4 righe, celle 24×40. Ogni personaggio occupa quattro colonne consecutive; righe `up`, `down`, `left`, `right`. I frame derivano dalla tavola madre `../pedoni-4x4frames-24x40-rgba.png`, ricolorata a zone e completata con accessori.

| Colonne | Personaggio | Dettaglio | `kind` proposto |
|---|---|---|---|
| 0–3 | Nonna con scopa | Grembiule chiaro e scopa al fianco | 43 |
| 4–7 | Ragazzino scolaro | Figura ridotta, grembiule blu e cartella | 44 |
| 8–11 | Uomo in tuta | Tuta verde petrolio e telefono all’orecchio | 45 |
| 12–15 | Donna con carrello | Carrello del mercato con buste colorate | 46 |

`pedoni-lotto20-genera.py` contiene anche il codice degli accessori e rigenera il PNG in `assets/people/`; legge da lì la tavola madre e il lotto 19. Il foglio di confronto viene scritto in `sources/sheet.png` e non è necessario al gioco. Il verificatore originale e il confronto approvato per la revisione restano in `/home/ubuntu/codex-gh-lavoro/lotto20/`.

Il foglio è collegato nella tabella `PEDESTRIAN_SHEETS` di `extra-pedestrian-sprites.mjs`. Usa lo stesso renderer, pivot e dimensione a schermo degli altri pedoni (`ps(3.25) × ps(4.7)`). Entra nella rotazione di passanti, residenti e clienti del mercato senza aumentare il loro numero. Menu PAUSA › NOVITÀ › `lotto17-20-pedoni` › VAI A VEDERE. L'uso nel gioco non costituisce approvazione estetica.

Lo scolaro è ridotto a 19×31 px, con i piedi allineati agli adulti.
