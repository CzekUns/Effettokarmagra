# Lotto 12 — anziani e giovani

I 64 frame sono **adattati e ricolorati a zone dalla tavola madre**. Le pose non sono disegnate da zero: direzioni, passo, piedi e pivot restano quelli dei pedoni esistenti. Sono variati carnagioni, capelli, abiti e accessori; i frammenti isolati della tavola madre sono stati riuniti al corpo o ripuliti. Grafica provvisoria da giudicare in gioco.

## File e formato

- `pedoni-lotto12-4x4frames-24x40-rgba.png`: atlante di gioco **384×160 px RGBA**, 16 colonne × 4 righe, celle **24×40 px**.
- `sheet.png`: confronto **3516×502 px** alla stessa scala **3×**: lotto 12, tavola madre, lotto 11. Solo per revisione.
- `riferimento-pedoni.png`: copia locale della tavola madre; `riferimento-lotto11.png`: copia locale del lotto 11. Servono a rigenerare lo sheet.
- `genera.py`: genera atlante e sheet; `verifica.py`: verifica le 64 celle da qualsiasi cartella.

| Colonne | Personaggio | Base adattata | Segni distintivi | `kind` proposto |
|---|---|---|---|---|
| 0–3 | Nonno | Anziano beige della tavola madre | Coppola grigia, bastone, giacca chiara | 19 |
| 4–7 | Nonna | Anziano beige della tavola madre | Capelli grigi raccolti, vestito lilla a fiori | 20 |
| 8–11 | Ragazzo | Ragazzo giallo della tavola madre | Cuffie azzurre, maglietta gialla, jeans scuri | 21 |
| 12–15 | Ragazza | Donna della tavola madre | Giacca di jeans, zaino bordeaux | 22 |

Le righe sono `up`, `down`, `left`, `right`; ogni personaggio occupa quattro frame consecutivi. I colori sono scelte illustrative.

## Collegamento nel gioco

I kind proposti sono **19–22**, dopo il lotto 11 (15–18). In `extra-pedestrian-sprites.mjs` aggiungere un percorso immagine e una cache separata, oltre a `drawLotto12PedestrianSprite` sul modello del lotto 2. Aggiornare `PEDESTRIAN_KIND_COUNT` a **23** dopo l'integrazione sequenziale dei lotti 10–12. La funzione usa `identity=p.kind-19`, `sx=(identity*4+frame)*24`, `sy=direction*40`, `width=ps(3.25)`, `height=ps(4.7)` e la fase di camminata esistente. In `city-art.mjs` instradare 19–22 alla nuova funzione prima dei rami precedenti, lasciando il fallback se il PNG manca. Verificare che lo spawn usi il nuovo totale.

## Verifica

`verifica.py` controlla **64/64 celle**: formato, alpha binario, un corpo opaco, margini e angoli trasparenti, piedi nella cella, nessun RGB residuo o alone chiaro, quattro frame e quattro direzioni distinti, posa sovrapposta alla tavola madre e tre pannelli dello sheet alla stessa scala 3×. Nessun file del repository modificato e nulla pubblicato.
