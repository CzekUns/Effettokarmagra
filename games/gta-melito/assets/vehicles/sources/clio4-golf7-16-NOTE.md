# Lotto 6 — Renault Clio IV e Volkswagen Golf VII

Atlante procedurale visto perfettamente dall'alto. La Clio IV (2012–2019) ha corpo più corto e arrotondato, muso curvo e fari a goccia; la Golf VII (2012–2019) è più lunga, larga e squadrata, con tetto piatto e fari stretti. Contorni scuri, vetri riflessi, specchietti e ombre a più toni riprendono il lotto 1. Prima di disegnare ho ricontrollato `CAR_ATLAS_VARIANTS` ed `EXTRA_MODELS` in `car-sprites.mjs`: nessuno dei due modelli è presente.

## File e formato

- `clio4-golf7-16-rgba.png`: atlante di gioco **160×240 px RGBA**, griglia 4×4, celle **40×60 px** trasparenti.
- `sheet.png`: confronto **1312×984 px**, nuovo lotto a sinistra e Grande Punto/Ypsilon III del lotto 1 a destra, entrambi ingranditi **4× senza interpolazione** su fondo chiaro. Solo per revisione.
- `riferimento-lotto1.png`: copia locale dell'atlante del lotto 1, usata per rigenerare lo sheet.
- `genera.py`: genera l'atlante e lo sheet con Pillow.
- `verifica.py`: verifica formato, trasparenza, margini, un corpo per cella, bordo scuro, 8 colori distinti per modello e proporzioni.

| Celle | Modello | `colors` nell'ordine delle celle |
|---|---|---|
| 0–7 | Renault Clio IV | `white`, `red`, `blue`, `silver`, `graphite`, `black`, `yellow`, `brown` |
| 8–15 | Volkswagen Golf VII | `white`, `red`, `silver`, `grey`, `black`, `nightblue`, `pacificblue`, `sunsetred` |

La [cartella stampa Renault Clio 2012](https://renaultphp82.staging.digitalnewspress.com/view/releases/508) documenta bianco, blu, giallo, rosso, due grigi e nero; la [cartella stampa Renault completa](https://www.autoblog.gr/wp-content/gallery/renault-clio-2013_1/Renault_Clio_2013_Press_kit.pdf) riporta anche il marrone. Il [comunicato Volkswagen della Golf VII](https://www.volkswagen-newsroom.com/en/the-new-golf-das-auto-international-driving-presentation-2797/the-new-golf-overview-quick-facts-2854) documenta le tinte rappresentate. Nomi brevi e valori RGB sono interpretazioni per il gioco, non codici vernice. Le forme sono create dal codice e non contengono fotografie.

## Collegamento proposto in `car-sprites.mjs`

Copiare il solo PNG RGBA in `assets/vehicles/`, poi aggiungere alle strutture esistenti:

```js
// EXTRA_CAR_ATLASES
'@clio4-golf7-atlas':'./assets/vehicles/clio4-golf7-16-rgba.png',

// EXTRA_MODELS
{model:'clio-iv-2012',atlas:'@clio4-golf7-atlas',offset:0,colors:['white','red','blue','silver','graphite','black','yellow','brown']},
{model:'golf-vii-2012',atlas:'@clio4-golf7-atlas',offset:8,colors:['white','red','silver','grey','black','nightblue','pacificblue','sunsetred']},

// MODEL_DRAW_SIZE, formato [larghezza, lunghezza] in unità mondo del gioco
'clio-iv-2012':[5.4,8.9],
'golf-vii-2012':[5.6,9.2],
```

Le misure disegnate sono prudenti rispetto a `punto-188:[5.45,8.75]`: la Clio occupa 5.4×8.9, la Golf 5.6×9.2 unità mondo. Sono proposte per la resa visiva da provare nel gioco, non cambiamenti delle collisioni. `EXTRA_CAR_VARIANTS` e `CAR_TRAFFIC_SPRITE_IDS` raccolgono automaticamente i nuovi modelli dopo l'inserimento; va controllata la loro resa alla scala effettiva.

## Verifica

Eseguire `python3 genera.py` e `python3 verifica.py` da qualsiasi cartella. Foglio confrontato visivamente alla stessa scala con il lotto 1. Nessun file del repository modificato e nulla pubblicato.
