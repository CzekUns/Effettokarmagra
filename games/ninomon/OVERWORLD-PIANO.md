# I Ninomon — Revisione dell'overworld (9 ottobre 2026)

## Diagnosi verificata sul codice e sugli asset

**Situazione attuale**
- `game.js` mantiene **tre mappe 35×24 caselle** (840 celle ciascuna); renderer `snes.js` usa **32 px per casella**, framebuffer 320×317 (~10×10 caselle visibili).
- I tre scenari sono **Scalo ferroviario**, **Sottopasso**, **Strada di servizio / vicolo**.
- Le regole del pavimento si trovano in `retro.js:kind(zone,x,y)`; le varianti grafiche in `snes.js:floorIndex()` e `build()`; gli ostacoli, con coordinate separate, in `game.js:walkBlocked()`. Questa duplicazione introduce facilmente incongruenze.
- Il disegno del terreno è pseudo-procedurale: i frammenti di pavimento cambiano in funzione delle coordinate, quindi molte giunzioni non sono disegnate per combaciare.
- Le tre tavole originali sono già disponibili: `tileset_pixel_art_del_deposito_ferroviario_urbano.png`, `piastrelle_pixel_art_per_sottopasso_urbano.png`, `set_di_tile_pixel_art_per_vicolo_urbano.png`; **1448×1086 RGBA ciascuna**. Hanno centinaia di elementi visivi, spesso compositi: la separazione automatica in componenti non implica che siano già tile pronti.
- `street-floor-tiles.png` contiene **30 ritagli 32×32** (10 per area). Da controllo locale sulla copia usata per produrlo: il canale alfa è **semistrasparente su ogni casella** e i campioni non sono stati costruiti esplicitamente come texture seamless.
- Muri, recinzioni, vagoni, colonne e serrande sono ancora generati in gran parte con `fillRect`; i loro moduli originali illustrati sono sottoutilizzati.
- Gli attori sono ordinati per quota dei piedi, ma manca un vero **livello di copertura frontale** per pilastri, archi, muri e oggetti alti: i personaggi non possono passare realisticamente dietro una struttura.
- Le uscite sono agganciate ai lati della mappa mediante `changeZone()`, non a varchi, porte, scale o sottopassaggi visibili.

**Numero caselle per tipo, rilevate dal classificatore attuale**

| Zona | Pavimento dominante | Celle bloccate da logica di gioco | Libere (compresi bordi trattati come blocchi) |
| --- | --- | ---: | ---: |
| Scalo (840) | 383 asfalto, 197 pietrisco, 70 binari | 276 | 564 |
| Sottopasso (840) | 376 asfalto, 284 cemento | 200 | 640 |
| Vicolo (840) | 510 asfalto, 70 lastricato | 264 | 576 |

> Le celle bloccate includono i bordi di sicurezza. Densità di spazio vuoto elevata in alcune parti del percorso principale: serve organizzazione di scena, non altri dettagli sparsi a caso.

## Obiettivo visivo e tecnico

Overworld ispirato alla costruzione delle mappe dei JRPG portatili anni 90: **top-down leggibile**, prospettiva coerente, strade con materiali continui, strutture modulari allineate alla griglia, landmark, percorsi riconoscibili, collisioni allineate alle immagini, sprite che passano correttamente davanti e dietro gli elementi alti. Resta l'ambientazione originale dei writer Nino e Gialluca, con degrado urbano, binari in disuso, tunnel, graffiti e negozi.

**Non cambiare per ora** risoluzione 320×317, griglia 32, mappa 35×24, localStorage/salvataggi, punti di spawn, 9 incontri, NPC, battaglie, tasti. Evitare il rifacimento simultaneo di engine e grafica.

## Stato effettivo — Pavimentazioni 72 tile (10 ottobre 2026)

**Completato e integrato nel gioco:**
- Croppati **24 pavimenti per area** (Scalo, Sottopasso, Vicolo) dalla nuova tavola ambientale, **72 in totale**, eliminando le cornici scure presenti sulle singole celle originali.
- Aggiunti sul branch main `assets/pavements/floor-source-64.png` (atlante 64×64) e `assets/pavements/floor-game-32.png` (atlante 32×32), con `floor-manifest.json` per identificativi, categorie e coordinate. Vedere `assets/pavements/README.md` per estrarre i file singoli.
- `snes.js` adesso pesca effettivamente dall'atlante a **72 pavimenti**: materiale per zona, raggruppamenti stabili, binari solo nelle fasce ferroviarie, segnaletica solo nelle strisce stradali, marciapiedi riservati alle relative righe.
- Il precedente atlas da **30 tile** e il disegno procedurale restano come fallback se il nuovo PNG non viene caricato.
- Test automatizzato del renderer sulle **2.520 caselle delle tre mappe**: nessun indice fuori intervallo, nessuna eccezione, niente binari fuori sede. Collisioni e salvataggi invariati.

**Ancora da fare:** transizioni realmente seamless e autotile per materiali diversi, strutture da moduli illustrati (muri, vagoni, archi, serrande), layer foreground/collisioni legato alla grafica e verifica visiva su Chrome Android. Le 72 texture sono ritagli di una tavola illustrata; non sono automaticamente perfettamente ripetibili lungo ogni bordo.

## Architettura bersaglio: mappe dichiarative a livelli

Per ciascuna zona, un JSON o modulo JS con:

1. **base**: una texture opaca, contigua, per ognuna delle 840 caselle (asfalto, cemento, ghiaia ecc.).
2. **transitions**: bordi, angoli esterni/interni, cordoli, fossi, cambi di materiale; scegliere mediante adiacenze.
3. **structures**: moduli a griglia (binari, facciate, vagoni, piloni, recinzioni) anche di dimensione 2×3, 4×2, 6×3 caselle; niente ripetizione casuale di un singolo quadrato.
4. **props**: elementi PNG RGBA separati; posizione, punto d'appoggio, eventuale footprint di collisione.
5. **actors**: NPC, Ninomon, Nino e compagno, ordinati per quota dei piedi.
6. **foreground**: travi, chiome, punte dei pilastri, tettoie e parti alte che coprono parzialmente l'attore quando passa dietro.
7. **events**: incontri, indizi, dialoghi, uscite/porte e punti di ingresso espliciti.

La collisione va calcolata combinando proprietà dei tile e footprint dei props/strutture, con override di poche caselle quando indispensabile. **Non duplicare un secondo elenco manuale dei muri.** Le interazioni e i portali hanno marker separati dalle superfici visive.

Esempio ridotto (specifica, non implementazione):

```json
{
  "id": "scalo",
  "width": 35,
  "height": 24,
  "tileSize": 32,
  "layers": {
    "base": "840 indici tile opachi",
    "transitions": "tile o null",
    "structures": [{"id":"wagon_freight", "x":4, "y":5, "width":8, "height":4}],
    "props": [{"id":"pallet", "x":16, "y":13, "anchor":"feet"}],
    "foreground": [{"id":"bridge_beam", "x":0, "y":5}]
  },
  "collisions": "derivate da tile solid + footprint props",
  "exits": [{"edge":"right", "at":[34,16], "to":"sottopasso", "spawn":[1,16]}],
  "encounters": "riutilizzare eventi e coordinate attuali"
}
```

Se si userà **Tiled**, preferire export **TMJ/JSON**, senza aggiungere runtime esterni: un parser statico può caricare le mappe su GitHub Pages. Alternativa: moduli JS JSON-like con lo stesso schema; identico renderer.

## Regole degli asset, da applicare ai fogli che abbiamo già

- **Pavimento pieno**: tile 32×32 finale, **alfa 255 su tutti i pixel**. Almeno 3 varianti ripetibili con bordi N/E/S/O che combaciano; crepe e segnaletica come overlay modulari (non tracce tagliate casualmente). I 30 vecchi ritagli sono materiale di partenza, non un pacchetto seamless validato.
- **Autotile transizioni**: partire da 16 combinazioni cardinali per ogni coppia di materiali realmente adiacenti (es. cemento/ghiaia, marciapiede/asfalto), poi angoli interni se servono. Nessuna ripetizione di bordo inventata per-coordinate.
- **Strutture**: asset con larghezza/altezza multipla di 32 px; binario 32×32 con variante diritta e curve/cambi; parete 32×32 modulare, angoli, giunzioni, cima e base; pilone largo 1–2 caselle, alto 3–5; vagoni compositi di più caselle.
- **Oggetti**: PNG con trasparenza originale preservata; **non convertire il nero in alfa**. Ogni PNG ha un anchor ai piedi e un rettangolo o poligono di collisione in metadati; la sagoma visiva può sovrastare una o più caselle.
- **Scala**: Nino appare circa 42×61 px su cella da 32; cassonetti ~2×1 tile, lampioni ~1×3, vagoni ~5–8×2–3. La proporzione deve rimanere uniforme tra zone.
- **Etichette file/atlanti**: usare `zone_ground_32.png`, `zone_edges_32.png`, `zone_structures.png`, `zone_props.png` e relativo `.json` con id, rect, anchor, collision, layer. Si può riutilizzare l'arte già consegnata senza generare altri fogli prima di sapere quali pezzi mancano.
- **Ottimizzazione**: usare atlas e `drawImage` da rect precalcolati; evitare un canvas nuovo per ogni coordinata per frame; caching per ID e variante. Render solo area visibile più margine per oggetti alti.

## Composizione di scena per zona

### Scalo ferroviario
- Zona di ingresso con pavimentazione leggibile; binari continui e coerenti, traversine allineate.
- Vagone lungo composto da moduli **testa / centro / coda**, con sagoma e ruote; recinzione di fondo con un varco visibile.
- Magazzino con pareti, angoli e porte; panchina/segnaletica vicino al punto di interesse.
- Quasi tutta l'arte necessaria è presente nella tavola originale: binari, tratte incrociate, recinzioni, wagon, muri taggati, casse, cartelli.

### Sottopasso
- Piano strada/percorsi sul cemento e asfalto; superfici bagnate e scarichi in posizioni credibili.
- Tre gruppi principali di pilastri con basi solide, archi/travi **in foreground**; il player può passare dietro ai pilastri.
- Graffiti sulla parete, passaggio verso il vicolo, reti, scale, tubazioni e transenne già disegnate nella tavola.
- Evitare colonne identiche equidistanti senza geometria del sovrappasso.

### Strada di servizio / vicolo
- Corso principale percorribile, marciapiede continuo con angoli corretti, parcheggi/strisce **coerenti**.
- Facciate assemblate con moduli di saracinesca, porte, intonaco, angoli e davanzali. Cassonetti e scooter con collisione e ombra alla base.
- Punti di ritrovamento dei Ninomon: vicino alle discariche, sotto i balconi, dietro un angolo. I graffiti possono indicare la direzione della storia.

## Ordine esecutivo, senza rompere il gioco

1. **Inventariare e classificare** gli asset esistenti (pavimenti, bordi, strutture, props, foreground; distinguere asset multi-tile da singoli frammenti).
2. **Rifare SOLO il pavimento dello Scalo** con tile opachi, varianti davvero ripetibili e transizioni; confrontare schermate con versione esistente.
3. Aggiungere **binari, vagone, recinzione e magazzino** come strutture composite e il layer foreground; fare coincidere collisioni e footprint.
4. Migrare NPC/incontri/eventi ai nuovi livelli senza perdere i salvataggi. Aggiungere un overlay debug disattivato normalmente: griglia, collisioni, trigger, anchor e tile ID.
5. Completare Scalo; riutilizzare pipeline per Sottopasso e Vicolo.
6. Test: continuità delle giunte, nessun muro attraversabile, raggiungibilità di tutti gli NPC/Ninomon, uscite reciproche, niente overlap sullo spawn, 60 FPS su Android medio, ripresa salvataggi.

**Accettazione della fase iniziale**: lo Scalo deve sembrare una mappa progettata e non un pavimento casuale con oggetti distribuiti; binari interi senza tagli, strutture modulari senza quadrati ripetuti, sprite correttamente coperti dalle parti alte, collisioni coerenti, stesso gameplay. Non dichiarare completata la revisione visiva senza uno screenshot reale sul dispositivo.
