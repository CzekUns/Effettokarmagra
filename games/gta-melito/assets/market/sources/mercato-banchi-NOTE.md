# Lotto 3 — banchi del mercato dall'alto, versione dettagliata

I 14 banchi mostrano **il piano visto dall'alto**. Cassette, vasche, pile e oggetti sono appoggiati sulla superficie; sul lato dei clienti (+Y) c'è un orlo di legno con luce e ombra, seguito da un'ombra corta a terra. Il venditore è dietro (−Y) e resta gestito dal gioco. Nessun ombrellone è nel PNG: `market.mjs` disegna già le coperture. T1–T4 sono superfici di telo viste dall'alto, con pieghe leggere.

## Misure e fattore di scala

Nel codice vivo di `market.mjs`, `PX=4` genera i segnaposto a **4 pixel per unità di gioco**. Il PNG precedente del lotto aveva celle 32×24 px. La versione attuale ha **due pixel per ciascun pixel precedente**: celle **64×48 px**, cioè **8 pixel sorgente per unità di gioco**, e viene disegnata nella **stessa dimensione nel mondo**. Il fattore di dettaglio è **2×**, non un ingrandimento del banco o della sua collisione.

`MARKET_RULES.scale = 1.9 * PERSON_SCALE = 1.52` (al momento della lettura). I 4/3/2 m del CSV diventano rispettivamente 6,08/4,56/3,04 unità di gioco. Le larghezze colorate sono **48/36/24 pixel sorgente**, che disegnati a 8 px/unità diventano **6/4,5/3 unità**; la differenza di 0,08/0,06/0,04 unità è arrotondamento pixel. Il margine della cella lascia spazio alla rotazione e all'ombra.

- `mercato-banchi-14-teli-4-rgba.png`: **384×144 px RGBA**, griglia **6×3**, 18 celle uniformi **64×48 px**.
- `sheet.png`: anteprima con i 18 sprite e la cella Ape ortofrutta della reference, entrambi ingranditi **4×** con pixel netti. Serve per il confronto visivo, non va nel gioco.
- `riferimento-ape-food.png`: copia locale invariata di `assets/vehicles/ape-food-16-rgba.png`, necessaria per rigenerare il confronto.
- `genera.py` e `verifica.py`: eseguire `python3 genera.py && python3 verifica.py`.

## Mappa cella → tipo

Indici in ordine di lettura:

| Cella | Tipo | Merce vista dall'alto |
| ---: | --- | --- |
| 0 | B01 frutta e verdura | Quattro cassette con bordo di legno, frutti distinti e bilancia |
| 1 | B02 pesce | Due vasche con ghiaccio, pesci azzurri, riflessi e limone |
| 2 | B03 salumi e formaggi | Vetrina refrigerata del furgone, salumi e formaggi |
| 3 | B04 abbigliamento | Sei pile di capi piegati in colori diversi |
| 4 | B05 scarpe | Scarpe su quattro scatole |
| 5 | B06 casalinghi | Pentole, padelle e secchio con luce sul metallo |
| 6 | B07 detersivi | Flaconi colorati, tappi ed etichette |
| 7 | B08 giocattoli | Palloni e automobiline |
| 8 | B09 fiori e piante | Tre vasi con foglie e fiori |
| 9 | B10 borse e cinture | Tre borse con manici e dettagli |
| 10 | B11 intimo e calze | Confezioni pastello e calze piegate |
| 11 | B12 bigiotteria | Vassoio con gioielli e occhiali |
| 12 | B13 porchetta e panini | Porchetta, panini, bibite e due piccole paste illustrative |
| 13 | B14 olive, sottaceti e legumi | Quattro vaschette con prodotti distinti |
| 14–17 | T1–T4 | Telo piano crema, rosso, blu, verde con pieghe morbide |

Merce, colori e allestimenti sono interpretazioni dei CSV. Non descrivono venditori o prezzi reali.

## Aggancio in `MARKET_ART`

Per la PR, copiare **solo l'atlante RGBA** in `assets/market/`. Caricare l'immagine **una volta sola** in `market.mjs` e registrare `MARKET_ART[B01…B14]` solo quando è pronta, così il segnaposto resta il fallback. Calcolare `index=Number(id.slice(1))-1`, `sx=(index%6)*64`, `sy=Math.floor(index/6)*48`. Il ritaglio sorgente è sempre **64×48**.

Nel metodo `draw(c,stall,build,clock)`, mantenere la rotazione locale esistente e disegnare il PNG a **8×6 unità di gioco**, quindi 8 pixel sorgente per unità:

```js
c.save();
c.translate(stall.x, stall.y);
c.rotate(stall.face - Math.PI / 2);
c.imageSmoothingEnabled = false;
c.drawImage(atlas, sx, sy, 64, 48, -4, -3, 8, 6);
c.restore();
```

Il piano attivo coincide quasi con `stall.w`; orlo e ombra sporgono di pochi pixel. Per `build<.95` conservare il montaggio/smontaggio del segnaposto e sfumare lo sprite completo fra `.75` e `.95`. Gli ombrelloni, la loro dissolvenza, i venditori e le collisioni restano nel codice attuale. T1–T4 sono superfici alternative, da usare solo quando non coprono la merce.

## Verifica

`verifica.py` controlla **18/18 celle**, formato e dimensioni, larghezze coerenti col fattore 2×, margini e angoli trasparenti, alpha binario, soggetto connesso, nessun alone chiaro, varianti distinte e Ape alla stessa scala di anteprima 4×. Il foglio è stato ispezionato visivamente. Dopo l'integrazione occorre ancora provare scala a livello strada, direzione dei banchi, montaggio e ombrelloni. Il repository non è stato modificato né pubblicato.
