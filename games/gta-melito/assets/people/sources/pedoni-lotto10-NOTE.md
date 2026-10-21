# Lotto 10 — quattro nuovi pedoni

I 64 frame derivano **dalla tavola madre** `pedoni-4x4frames-24x40-rgba.png`: camminata e scala sono adattate e ricolorate a zone, con accessori nuovi. Non sono pose disegnate da zero. La tavola mantiene **24×40 px per cella**, quattro direzioni (`up`, `down`, `left`, `right`) e quattro fotogrammi per direzione. I pixel isolati della reference sono ripuliti; piedi e pivot restano nella stessa posizione. Carnagioni, capelli e abiti sono variati. Grafica provvisoria da giudicare nel gioco.

## File e struttura

- `pedoni-lotto10-4x4frames-24x40-rgba.png`: atlante di gioco **384×160 px RGBA**, 16 colonne × 4 righe, 64 celle **24×40 px**.
- `sheet.png`: confronto **3516×502 px** alla stessa scala **3×**: lotto 10, tavola madre, lotto 2. Solo per revisione.
- `riferimento-pedoni.png`: copia locale della tavola madre, necessaria per rigenerare.
- `riferimento-lotto2.png`: copia locale del lotto 2, necessaria per rigenerare il confronto.
- `genera.py` e `verifica.py`: eseguire `python3 genera.py` e `python3 verifica.py`.

| Colonne | Personaggio | Base adattata | Segni distintivi | `kind` proposto |
|---|---|---|---|---|
| 0–3 | Signora anziana | Anziano beige della tavola madre | Cappotto carbone, capelli grigi, borsa della spesa | 11 |
| 4–7 | Ragazzo | Ragazzo giallo della tavola madre | Felpa blu scuro con cappuccio, zaino verde | 12 |
| 8–11 | Donna | Donna scura della tavola madre | Giacca chiara, borsa a tracolla, capelli scuri | 13 |
| 12–15 | Uomo | Uomo blu della tavola madre | Giacca blu notte, cravatta rossa, valigetta | 14 |

La colonna sorgente è `identity*4+frame`; la riga è `direction`. Le righe seguono `PEOPLE_DIRECTIONS` di `pedestrian-sprites.mjs`. I colori sono scelte illustrative.

## Collegamento nel gioco

Nello stato attuale di `extra-pedestrian-sprites.mjs`, `LOTTO2_PEDESTRIAN_NPC_START_KIND=7` e il lotto 2 occupa i **kind 7–10**. Aggiungere un nuovo percorso immagine e una cache dedicata per `pedoni-lotto10-4x4frames-24x40-rgba.png`; proporre:

```js
export const LOTTO10_PEDESTRIAN_NPC_START_KIND =
  LOTTO2_PEDESTRIAN_NPC_START_KIND + LOTTO2_PEDESTRIAN_IDENTITIES.length; // 11
export const LOTTO10_PEDESTRIAN_IDENTITIES = Object.freeze([
  'signora-anziana-cappotto-borsa', 'ragazzo-felpa-zaino',
  'donna-giacca-tracolla', 'uomo-giacca-cravatta-valigetta'
]);
export const PEDESTRIAN_KIND_COUNT =
  LOTTO10_PEDESTRIAN_NPC_START_KIND + LOTTO10_PEDESTRIAN_IDENTITIES.length; // 15
```

La nuova funzione di disegno può riusare `pedestrianDirection(angle)`, la fase `frame` già impiegata dal lotto 2, il rettangolo sorgente `sx=(identity*4+frame)*24`, `sy=direction*40` e la destinazione `width=ps(3.25)`, `height=ps(4.7)`, `x-width/2`, `y-height+ps(.8)`. In `city-art.mjs`, instradare i kind **11–14** alla nuova funzione **prima** del ramo del lotto 2, con `identity=p.kind-LOTTO10_PEDESTRIAN_NPC_START_KIND`. Verificare che lo spawn usi `PEDESTRIAN_KIND_COUNT=15` e che i quattro nuovi kind compaiano davvero. Se il PNG manca, lasciare il fallback esistente.

## Verifica

`verifica.py` controlla **64/64 celle**: dimensioni, alpha binario, un solo corpo opaco, margini e angoli trasparenti, piedi nella cella, assenza di RGB residuo e alone chiaro, quattro frame e quattro direzioni distinti, posa sovrapposta alla tavola madre, confronto esatto dei tre pannelli dello sheet alla scala 3×. Lo script gira da qualsiasi cartella. Nessun file del repository modificato e nulla pubblicato.
