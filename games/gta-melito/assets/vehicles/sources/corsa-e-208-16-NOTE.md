# Lotto 7 — Opel Corsa E e Peugeot 208 prima serie

Atlante pixel art procedurale visto perfettamente dall'alto, nello stile del lotto 1. La Corsa E (2014–2019) ha la coda alta, il tetto lungo e i fari anteriori a freccia; la 208 prima serie (2012–2019) ha fari allungati e tetto che si restringe e scende verso la coda. Contorni scuri, ruote, specchietti, vetri riflessi e ombre a più toni riprendono gli atlanti precedenti. Ho ricontrollato `CAR_ATLAS_VARIANTS` ed `EXTRA_MODELS` nel `car-sprites.mjs` del gioco: nessuno dei due modelli è già presente.

## File e formato

- `corsa-e-208-16-rgba.png`: atlante **160×240 px RGBA**, griglia 4×4, celle **40×60 px** trasparenti.
- `sheet.png`: confronto **1312×984 px**; lotto 7 a sinistra, Grande Punto/Ypsilon III del lotto 1 a destra, entrambi a **4× senza interpolazione**. Serve solo per revisione.
- `riferimento-lotto1.png`: copia locale dell'atlante del lotto 1, necessaria per rigenerare lo sheet.
- `genera.py`: crea l'atlante e il confronto con Pillow.
- `verifica.py`: controlla formato, alpha, margini, un corpo per cella, bordo scuro, varianti distinte e confronto alla stessa scala.

| Celle | Modello | `colors` nell'ordine delle celle |
|---|---|---|
| 0–7 | Opel Corsa E | `white`, `red`, `blue`, `silver`, `graphite`, `black`, `yellow`, `orange` |
| 8–15 | Peugeot 208 I | `white`, `red`, `silver`, `sharkgrey`, `black`, `virtualblue`, `darkblue`, `orangepower` |

Le tinte Corsa sono ispirate alla [brochure Opel 2015](https://xr793.com/wp-content/uploads/2022/09/2015-Opel-Corsa-UK.pdf), che include bianco, rosso, blu, grigi, nero, giallo e arancio. Per la 208, la [palette Peugeot 2015 della prima generazione](https://www.media.stellantis.com/em-en/peugeot/press/a-world-premiere-for-the-new-peugeot-208-two-textured-colours-available-on-this-production-car) documenta bianco, rosso, grigio alluminio, grigio Shark, nero, blu Virtuel, blu scuro e Orange Power. Alcune tinte della 208 furono aggiunte nel 2015 e non sono dichiarate presenti dal lancio del 2012. I nomi brevi e gli RGB sono interpretazioni per il gioco, non codici vernice. Le auto sono disegnate dal codice; nessuna foto è incorporata.

## Collegamento proposto in `car-sprites.mjs`

Copiare il solo PNG RGBA in `assets/vehicles/`, poi aggiungere alle strutture esistenti:

```js
// EXTRA_CAR_ATLASES
'@corsa-e-208-atlas':'./assets/vehicles/corsa-e-208-16-rgba.png',

// EXTRA_MODELS
{model:'corsa-e-2014',atlas:'@corsa-e-208-atlas',offset:0,colors:['white','red','blue','silver','graphite','black','yellow','orange']},
{model:'peugeot-208-2012',atlas:'@corsa-e-208-atlas',offset:8,colors:['white','red','silver','sharkgrey','black','virtualblue','darkblue','orangepower']},

// MODEL_DRAW_SIZE, [larghezza, lunghezza] in unità mondo del gioco
'corsa-e-2014':[5.5,8.9],
'peugeot-208-2012':[5.4,8.8],
```

Le dimensioni sono proposte prudenti per la resa visiva: entrambe restano nel range richiesto (larghezza 5.4–5.5, lunghezza 8.8–9.0), vicino al riferimento `punto-188:[5.45,8.75]`. Non cambiano le collisioni. Dopo l'inserimento in `EXTRA_MODELS`, `EXTRA_CAR_VARIANTS` e `CAR_TRAFFIC_SPRITE_IDS` includono automaticamente i nuovi ID; la resa alla scala di gioco va controllata in scena.

## Verifica

Eseguire `python3 genera.py` e `python3 verifica.py` da qualsiasi cartella. Ho aperto `sheet.png` e confrontato le sagome con il lotto 1 alla stessa scala. Nessun file del repository modificato e nulla pubblicato.
