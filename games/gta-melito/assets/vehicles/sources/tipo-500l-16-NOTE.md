# Lotto 5 — Fiat Tipo hatchback 2016 e Fiat 500L 2012

Atlante pixel art procedurale nella vista perfettamente dall'alto usata dal gioco. Prima di disegnare ho controllato `CAR_ATLAS_VARIANTS` ed `EXTRA_MODELS` in `car-sprites.mjs`: **Tipo hatchback e 500L non sono presenti**. La Tipo cinque porte è più lunga e bassa, con cofano più esteso, tetto più corto e fanali posteriori orizzontali. La 500L è più corta e tozza, con cofano breve, tetto lungo, parabrezza e finestrini grandi, fari anteriori rotondi. Contorno scuro, luci e ombre a più toni, vetri con riflessi, specchietti e ruote seguono il metodo del lotto 1.

## File e formato

- `tipo-500l-16-rgba.png`: atlante di gioco **160×240 px RGBA**, griglia 4×4, celle **40×60 px** realmente trasparenti.
- `sheet.png`: confronto **1312×984 px**; nuovo lotto a sinistra e Grande Punto/Ypsilon III del lotto 1 a destra, entrambi ingranditi **4× nearest-neighbor** su fondo chiaro. Solo per revisione.
- `riferimento-lotto1.png`: copia locale dell'atlante del lotto 1, necessaria per rigenerare lo sheet.
- `genera.py`: crea le 16 auto e il confronto con Pillow.
- `verifica.py`: controlla dimensioni, alpha binario, margini/angoli trasparenti, un corpo per cella, assenza di alone chiaro e RGB nel trasparente, varianti distinte, proporzioni e confronto alla stessa scala.

| Indici | Modello | `colors` in ordine |
|---|---|---|
| 0–7 | Tipo hatchback 2016 | `white`, `silver`, `graphite`, `sand`, `bronze`, `red`, `blue`, `black` |
| 8–15 | 500L 2012 | `white`, `red`, `silver`, `graphite`, `black`, `blue`, `yellow`, `green` |

I nomi della Tipo corrispondono per approssimazione a **Bianco Gelato, Grigio Maestro, Grigio Colosseo, Perla Sabbia, Bronzo Magnetico, Rosso Amore, Blu Mediterraneo e Nero Cinema**, le otto tinte indicate nella [documentazione Fiat della Tipo cinque porte 2016](https://www.media.stellantis.com/uploads/ch/CH/2016/FIAT/160502_Fiat_Tipo/MM_Fiat_Tipo_IT.pdf). Per la 500L, **Bianco Gelato, Rosso Passione, Grigio Moda, Nero Cinema e Grigio Maestro** compaiono nella [gamma di lancio 2012](https://www.media.stellantis.com/es-es/fiat/press/fiat-inicia-la-comercializaci-n-del-500l); **Blu Bellagio, Giallo Sorrento e Verde Toscana** sono documentati nella [gamma successiva della stessa generazione](https://www.media.stellantis.com/ch-it/fiat/press/500l-2). Queste tinte aggiuntive **non sono dichiarate disponibili al lancio del 2012**. Gli RGB del PNG sono interpretazioni artistiche, non campioni vernice certificati. Le sagome sono disegnate dal codice: nessuna foto è incorporata nell'atlante.

## Collegamento proposto in `car-sprites.mjs`

Copiare solo il PNG RGBA in `assets/vehicles/`, poi aggiungere:

```js
// EXTRA_CAR_ATLASES
'@tipo-500l-atlas':'./assets/vehicles/tipo-500l-16-rgba.png',

// EXTRA_MODELS
{model:'tipo-hatchback-2016',atlas:'@tipo-500l-atlas',offset:0,colors:['white','silver','graphite','sand','bronze','red','blue','black']},
{model:'fiat-500l-2012',atlas:'@tipo-500l-atlas',offset:8,colors:['white','red','silver','graphite','black','blue','yellow','green']},

// MODEL_DRAW_SIZE, formato [larghezza, lunghezza] in unità mondo del gioco
 'tipo-hatchback-2016':[5.88,9.91],
 'fiat-500l-2012':[5.84,9.41],
```

Le misure disegnate sono proposte, ottenute applicando alla base `punto-188:[5.45,8.75]` i rapporti delle dimensioni reali richieste: Tipo **1,79×4,37 m**, 500L **1,78×4,15 m**, Punto di riferimento circa **1,66×3,86 m**. Sono dimensioni di rendering da provare nel gioco, non modifiche alle collisioni. Gli ID proposti sono nuovi e non collidono con gli atlanti esistenti; `EXTRA_CAR_VARIANTS` li include automaticamente nei veicoli possibili, ma Claude deve verificare la scelta effettiva nel traffico e l'aspetto a dimensione di gioco.

## Verifica

Eseguiti `python3 genera.py` e, da `/tmp`, `python3 /home/ubuntu/codex-gh-lavoro/lotto5/verifica.py`: **16/16 celle valide**. Ho aperto e confrontato `sheet.png` alla stessa scala. Nessun file del repository modificato e nulla pubblicato.
