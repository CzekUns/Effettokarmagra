# Lotto 9 — Fiat Doblò II e Fiat Fiorino III

Atlante pixel art procedurale visto perfettamente dall'alto. Il Doblò II (2010–2022) ha vano di carico lungo, tetto piatto nervato, parabrezza ampio e porte scorrevoli accennate. Il Fiorino III (2008–2021) è più corto e stretto, con cabina arrotondata ma vano squadrato. Ogni modello ha otto varianti: bianco liscio, bianco con fascia, grigio, blu, rosso, giallo, verde scuro e bianco con scritta generica leggibile (`EDILIZIA` / `FRUTTA`). Nessun marchio reale. Ho ricontrollato `CAR_ATLAS_VARIANTS` ed `EXTRA_MODELS` nel `car-sprites.mjs` del gioco: i due modelli non esistono già.

## File e formato

- `doblo-fiorino-16-rgba.png`: atlante **208×368 px RGBA**, griglia 4×4, celle **52×92 px** trasparenti; indici 0–7 Doblò, 8–15 Fiorino.
- `sheet.png`: confronto **1276×1128 px**; lotto 9 a sinistra, atlante Q18 `servizio-16-rgba.png` a destra. Entrambi ingranditi **3× senza interpolazione**. Solo per revisione.
- `riferimento-servizio-16-rgba.png`: copia locale della tavola Q18, necessaria per rigenerare lo sheet.
- `genera.py`: crea atlante e confronto con Pillow.
- `verifica.py`: controlla formato, alpha, margini, un corpo per cella, bordo scuro, varianti e confronto alla stessa scala.

| Celle | Modello | `colors` nell'ordine delle celle |
|---|---|---|
| 0–7 | Fiat Doblò II | `white`, `white-stripe`, `grey`, `blue`, `red`, `yellow`, `darkgreen`, `white-edilizia` |
| 8–15 | Fiat Fiorino III | `white`, `white-stripe`, `grey`, `blue`, `red`, `yellow`, `darkgreen`, `white-frutta` |

I [materiali Fiat del Doblò 2010](https://www.media.stellantis.com/uk-en/fiat-professional/press/fiat-dobl-cargo-perfected-for-professionals-press-pack) descrivono le porte posteriori e scorrevoli; quelli del [Fiorino 2008](https://www.media.stellantis.com/uk-en/fiat-professional/press/award-winning-new-fiat-fiorino-in-uk-press-pack) descrivono il vano compatto e la guida della porta scorrevole. Gli RGB e le livree sono interpretazioni grafiche per il gioco, non campioni vernice o imprese reali. Nessuna foto è incorporata.

## Collegamento proposto in `car-sprites.mjs`

Copiare il solo PNG RGBA in `assets/vehicles/`, poi aggiungere:

```js
// EXTRA_CAR_ATLASES
'@doblo-fiorino-atlas':'./assets/vehicles/doblo-fiorino-16-rgba.png',

// EXTRA_MODELS
{model:'doblo-2010',atlas:'@doblo-fiorino-atlas',offset:0,colors:['white','white-stripe','grey','blue','red','yellow','darkgreen','white-edilizia']},
{model:'fiorino-2008',atlas:'@doblo-fiorino-atlas',offset:8,colors:['white','white-stripe','grey','blue','red','yellow','darkgreen','white-frutta']},

// MODEL_DRAW_SIZE: dimensioni desiderate del CORPO visibile, [larghezza, lunghezza]
'doblo-2010':[5.9,9.6],
'fiorino-2008':[5.5,8.9],
```

**Adattamento necessario:** oggi `EXTRA_CAR_VARIANTS` viene caricato e disegnato sempre come atlante auto 160×240 con celle 40×60. Per le varianti con `atlas === '@doblo-fiorino-atlas'`, `carSpriteReady()` deve invece accettare **208×368**; in `drawCarSprite()` vanno usati `SERVICE_ATLAS_CELL` e i normali indici 0–15. Per far corrispondere `MODEL_DRAW_SIZE` al corpo visibile, ritagliare dentro ciascuna cella il rettangolo alpha fisso, poi disegnarlo con `width` e `length`:

```js
const workVan=variant?.atlas==='@doblo-fiorino-atlas';
// In carSpriteReady: per workVan richiedere img.naturalWidth===208 && img.naturalHeight===368.
// In drawCarSprite, prima del ramo standard di ctx.drawImage:
if(workVan){
  const sw=52,sh=92,index=variant.index;
  const sx=(index%4)*sw,sy=Math.floor(index/4)*sh;
  const box=index<8?[1,7,50,79]:[5,17,42,62]; // x, y, larghezza, altezza opaca
  ctx.drawImage(img,sx+box[0],sy+box[1],box[2],box[3],-width/2,-length/2,width,length);
}else{
  // ramo esistente con CAR_ATLAS_CELL / SERVICE_ATLAS_CELL
}
```

Il ritaglio è importante: la cella 52×92 contiene margini trasparenti più ampi attorno al Fiorino. Se si disegna **tutta** la cella a `[5.5,8.9]`, il Fiorino apparirà sensibilmente più piccolo della Punto. I rettangoli alpha sono uguali per tutte le otto varianti di ogni modello e verificati da `verifica.py`. `loadedImage()` e `CAR_TRAFFIC_SPRITE_IDS` raccolgono i nuovi ID tramite `EXTRA_MODELS` senza modifiche ulteriori. Le collisioni non vengono cambiate; Claude dovrà verificare la resa alla scala del gioco.

## Verifica

Eseguire `python3 genera.py` e `python3 verifica.py` da qualsiasi cartella. Ho aperto `sheet.png` e confrontato Doblò/Fiorino con il corriere Q18 alla stessa scala. Nessun file del repository modificato e nulla pubblicato.
