# Lotto 13 — lavoro, spesa e ragazzino

I 64 frame sono adattati e ricolorati a zone dalla tavola madre, conservando le quattro direzioni e il ritmo della camminata. Il ragazzino usa gli stessi frame ridotti a **19×31 px** e posizionati in basso nella cella: la figura opaca misura circa 28–30 px d'altezza e i piedi restano allineati. Il carrello cambia posizione secondo la direzione ed è unito al corpo dal manico. Grafica provvisoria da giudicare in gioco.

## File e formato

- `pedoni-lotto13-4x4frames-24x40-rgba.png`: atlante di gioco **384×160 px RGBA**, 16 colonne × 4 righe, **64 celle 24×40 px**.
- `sheet.png`: confronto **3516×502 px** alla stessa scala **3×**: lotto 13, tavola madre, lotto 12. Solo per revisione.
- `riferimento-pedoni.png` e `riferimento-lotto12.png`: copie locali per rigenerare lo sheet.
- `genera.py`: crea atlante e sheet; `verifica.py`: controlla le 64 celle da qualsiasi cartella.

| Colonne | Personaggio | Segni distintivi | `kind` proposto |
|---|---|---|---|
| 0–3 | Operaio | Gilet arancione con bande chiare, pantaloni da lavoro | 23 |
| 4–7 | Signora | Carrello a quadri davanti o di lato secondo la direzione | 24 |
| 8–11 | Ragazzino | Figura più bassa, felpa verde, pallone sotto il braccio | 25 |
| 12–15 | Barista | Camicia bianca e grembiule nero | 26 |

Le righe sono `up`, `down`, `left`, `right`; ogni identità ha quattro frame consecutivi. Le carnagioni e i capelli sono variati rispetto ai lotti precedenti.

## Collegamento nel gioco

I kind proposti sono **23–26**, dopo il lotto 12 (19–22). In `extra-pedestrian-sprites.mjs` aggiungere percorso PNG, cache e funzione di disegno per il lotto 13, sul modello del lotto 2; aggiornare `PEDESTRIAN_KIND_COUNT` a **27** dopo l'integrazione sequenziale. La funzione usa `identity=p.kind-23`, `sx=(identity*4+frame)*24`, `sy=direction*40`, `width=ps(3.25)`, `height=ps(4.7)` e la fase esistente. In `city-art.mjs` instradare i kind 23–26 prima dei rami precedenti, mantenendo il fallback se il PNG manca. Il ragazzino è più basso **dentro la cella**, quindi mantiene lo stesso pivot di disegno; controllare in gioco che l'altezza appaia corretta.

## Verifica

`verifica.py` controlla **64/64 celle**: formato, alpha binario, un corpo, margini e angoli trasparenti, piedi in basso, nessun RGB residuo o alone chiaro, frame/direzioni distinti, posa allineata alla reference (ridimensionata per il ragazzino) e tre pannelli dello sheet alla stessa scala. Nessun file del repository modificato e nulla pubblicato.
