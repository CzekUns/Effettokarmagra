# Lotto 11 — popolazione estiva più varia

I 64 frame sono **adattati e ricolorati a zone dalla tavola madre**, con pose, piedi e scala conservati. Accessori, carnagioni, capelli e abiti sono stati ridisegnati per quattro nuove identità. Il passo dello sportivo è lievemente esteso di un pixel nei due frame di falcata. Alcuni frammenti distaccati della reference sono stati riuniti alla sagoma o eliminati. Grafica provvisoria da giudicare in gioco.

## File e formato

- `pedoni-lotto11-4x4frames-24x40-rgba.png`: atlante di gioco **384×160 px RGBA**, 16 colonne × 4 righe, celle **24×40 px**.
- `sheet.png`: confronto **3516×502 px** alla stessa scala **3×**: lotto 11, tavola madre, lotto 10. Solo per revisione.
- `riferimento-pedoni.png`: copia locale della tavola madre; `riferimento-lotto10.png`: copia locale del lotto 10. Servono a rigenerare il confronto.
- `genera.py`: genera atlante e sheet; `verifica.py`: verifica le 64 celle indipendentemente dalla cartella corrente.

| Colonne | Personaggio | Base adattata | Segni distintivi | `kind` proposto |
|---|---|---|---|---|
| 0–3 | Ragazza | Donna della tavola madre | Capelli lunghi raccolti, maglietta bianca, telefono | 15 |
| 4–7 | Uomo robusto | Anziano beige della tavola madre | Maglietta a righe rosse e verdi, pantaloncini | 16 |
| 8–11 | Donna | Donna della tavola madre | Vestito corallo, borsa beige | 17 |
| 12–15 | Sportivo | Ragazzo giallo della tavola madre | Tuta chiara, bande azzurre, scarpe da ginnastica | 18 |

Le righe sono `up`, `down`, `left`, `right`; ogni personaggio ha i frame 0–3 consecutivi. I colori sono scelte illustrative.

## Collegamento nel gioco

I kind proposti sono **15–18**, subito dopo il lotto 10 (11–14). In `extra-pedestrian-sprites.mjs` aggiungere percorso immagine, cache e funzione `drawLotto11PedestrianSprite` sul modello del lotto 2, poi aggiornare `PEDESTRIAN_KIND_COUNT` da 15 a **19** dopo l'integrazione sequenziale del lotto 10. La funzione usa `identity=p.kind-15`, `sx=(identity*4+frame)*24`, `sy=direction*40`, `width=ps(3.25)`, `height=ps(4.7)` e la fase di camminata già esistente. In `city-art.mjs` instradare i kind 15–18 alla nuova funzione prima dei rami precedenti e conservare il fallback se il PNG manca. Verificare che lo spawn legga il nuovo `PEDESTRIAN_KIND_COUNT`.

## Verifica

`verifica.py` controlla **64/64 celle**: dimensioni, alpha binario, un corpo opaco, margini e angoli trasparenti, piedi nella cella, nessun RGB residuo o alone chiaro, camminate distinte, posa allineata alla tavola madre e sheet corretto alla scala 3×. Nessun file del repository modificato e nulla pubblicato.
