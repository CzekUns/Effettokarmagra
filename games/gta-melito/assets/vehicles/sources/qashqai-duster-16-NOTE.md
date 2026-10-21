# Lotto 8 — Nissan Qashqai J11 e Dacia Duster prima serie

Atlante pixel art procedurale visto perfettamente dall'alto, nello stile del lotto 1. Il Qashqai J11 (2013–2021) ha muso a V, spalle e lunotto rastremati. La Duster I (2010–2017) è più squadrata, con coda verticale, paraurti scuri e passaruota marcati. Entrambe hanno tetto lungo e barre longitudinali; le loro sagome sono più larghe della Grande Punto del riferimento. Ho ricontrollato `CAR_ATLAS_VARIANTS` ed `EXTRA_MODELS` nel `car-sprites.mjs` del gioco: nessuno dei due modelli è già presente.

## File e formato

- `qashqai-duster-16-rgba.png`: atlante **160×240 px RGBA**, griglia 4×4, celle **40×60 px** trasparenti.
- `sheet.png`: confronto **1312×984 px**; lotto 8 a sinistra, Grande Punto/Ypsilon III del lotto 1 a destra, entrambi ingranditi **4× senza interpolazione**. Solo per revisione.
- `riferimento-lotto1.png`: copia locale dell'atlante del lotto 1, necessaria per rigenerare lo sheet.
- `genera.py`: crea atlante e confronto con Pillow.
- `verifica.py`: controlla formato, alpha, margini, un corpo per cella, bordo scuro, varianti distinte, sagome e confronto alla stessa scala.

| Celle | Modello | `colors` nell'ordine delle celle |
|---|---|---|
| 0–7 | Nissan Qashqai J11 | `white`, `red`, `silver`, `graphite`, `black`, `blue`, `bronze`, `burgundy` |
| 8–15 | Dacia Duster I | `white`, `beige`, `darkgreen`, `silver`, `graphite`, `black`, `blue`, `brown` |

Per la linea del Qashqai ho usato il [comunicato Nissan sul disegno della J11](https://europe.nissannews.com/en-GB/releases/new-nissan-qashqai-designing-the-next-crossover-icon); per la Duster, il [comunicato Dacia del 2013](https://nl.media.renaultgroup.com/volledig-dacia-nog-meer-duster/) descrive fari, barre del tetto e carattere robusto della prima generazione. Le palette sono interpretazioni grafiche di tinte comuni o plausibili; **il verde scuro della Duster è una scelta artistica richiesta per questo lotto**, non una dichiarazione di disponibilità in un preciso listino. Gli RGB non sono codici vernice. Le auto sono disegnate dal codice: nessuna fotografia è incorporata.

## Collegamento proposto in `car-sprites.mjs`

Copiare il solo PNG RGBA in `assets/vehicles/`, poi aggiungere alle strutture esistenti:

```js
// EXTRA_CAR_ATLASES
'@qashqai-duster-atlas':'./assets/vehicles/qashqai-duster-16-rgba.png',

// EXTRA_MODELS
{model:'qashqai-j11-2013',atlas:'@qashqai-duster-atlas',offset:0,colors:['white','red','silver','graphite','black','blue','bronze','burgundy']},
{model:'duster-2010',atlas:'@qashqai-duster-atlas',offset:8,colors:['white','beige','darkgreen','silver','graphite','black','blue','brown']},

// MODEL_DRAW_SIZE, [larghezza, lunghezza] in unità mondo del gioco
'qashqai-j11-2013':[5.8,9.4],
'duster-2010':[5.7,9.2],
```

Le misure proposte sono nel range richiesto (larghezza 5.7–5.8, lunghezza 9.2–9.4), superiori alle utilitarie (`punto-188:[5.45,8.75]`). Riguardano il disegno, non le collisioni. Dopo l'inserimento in `EXTRA_MODELS`, `EXTRA_CAR_VARIANTS` e `CAR_TRAFFIC_SPRITE_IDS` includono automaticamente i nuovi ID. La resa alla scala di gioco va controllata in scena.

## Verifica

Eseguire `python3 genera.py` e `python3 verifica.py` da qualsiasi cartella. Ho aperto `sheet.png` e confrontato le sagome con il lotto 1 alla stessa scala. Nessun file del repository modificato e nulla pubblicato.
