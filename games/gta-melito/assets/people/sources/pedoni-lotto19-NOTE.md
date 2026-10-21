# Lotto 19 — quattro pedoni nuovi

Grafica **PROVVISORIA, da approvare da Simone**. L'atlante `../pedoni-lotto19-4x4frames-24x40-rgba.png` è RGBA 384×160: 16 colonne × 4 righe, celle 24×40. Ogni personaggio occupa quattro colonne consecutive; righe `up`, `down`, `left`, `right`. I frame derivano dalla tavola madre `../pedoni-4x4frames-24x40-rgba.png`, ricolorata a zone e completata con accessori.

| Colonne | Personaggio | Dettaglio | `kind` proposto |
|---|---|---|---|
| 0–3 | Mamma con bambino | Bambino più basso, collegato alla mano nella stessa cella | 39 |
| 4–7 | Ragazza con cane | Cane piccolo al fianco e guinzaglio | 40 |
| 8–11 | Uomo in sedia a rotelle | Gambe sostituite dal telaio; quattro posizioni dei raggi delle ruote | 41 |
| 12–15 | Ragazzo delivery | Borsa termica cubica arancione sulle spalle | 42 |

`pedoni-lotto19-genera.py` contiene anche il codice degli accessori e rigenera il PNG in `assets/people/`; legge da lì la tavola madre e il lotto 18. Il foglio di confronto viene scritto in `sources/sheet.png` e non è necessario al gioco. Il verificatore originale e il confronto approvato per la revisione restano in `/home/ubuntu/codex-gh-lavoro/lotto19/`.

Il foglio è collegato nella tabella `PEDESTRIAN_SHEETS` di `extra-pedestrian-sprites.mjs`. Usa lo stesso renderer, pivot e dimensione a schermo degli altri pedoni (`ps(3.25) × ps(4.7)`). Entra nella rotazione di passanti, residenti e clienti del mercato senza aumentare il loro numero. Menu PAUSA › NOVITÀ › `lotto17-20-pedoni` › VAI A VEDERE. L'uso nel gioco non costituisce approvazione estetica.

La sedia a rotelle ha il telaio al posto delle gambe e i raggi delle ruote cambiano nei quattro frame. Il bambino e il cane restano nella cella 24×40 insieme alla persona.
