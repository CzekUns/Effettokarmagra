# GTA Melito — Registro di lavoro grafico per ChatGPT Work

**Stato iniziale: 17 ottobre 2026, versione 0.7.0.** Questo registro nasce con l'handoff; **non** è una prova di verifica fotografica dei singoli fabbricati. Leggere prima [HANDOFF_WORK_REALISMO.md](./HANDOFF_WORK_REALISMO.md) e [AGENTS.md](./AGENTS.md).

## Fotografia fedele: stato distinto dalla copertura OSM

| Indicatore | Stato iniziale verificabile nel codice | Nota |
| --- | --- | --- |
| Sagome OSM conservate | 2.056 / 2.056 | Dato cartografico, non fotografia. |
| Prima modellazione pixel art | 2.056 / 2.056 | Procedurale, colori/materiali quasi tutti stimati. |
| Placeholder visivi | 467 | Sintetici, ID negativi, numero dipende dal generatore. |
| Volumetria Canvas | 2.523 / 2.523 | Estrusione artistica; altezze non tutte reali. |
| Edifici riconosciuti da una fonte fotografica registrata | **1 / 2.056** | Santa Maria delle Grazie, way 733703815. |
| Quartieri verificati edificio per edificio | **nessuno** | Da realizzare, senza dichiarazioni premature. |

## Backlog prioritario da realizzare, non soltanto pianificare

- [ ] **P0 — baseline**: screenshot browser PC e smartphone, 2 posizioni fisse (Piazza Santo Stefano, Via Roma), a piedi 5× e auto a zoom dinamico. Annotare dispositivo e URL/commit.
- [ ] **P0 — blocco Piazza Santo Stefano**: analisi di immagini con riscontro delle identità, chiesa, palazzi circostanti, pavimentazione, geometrie riconoscibili, comparazione prima/dopo.
- [ ] **P0 — Via Roma + Municipio**: balconi/tetti/serrande/intonaci coerenti con le fotografie documentabili; differenziare il nucleo storico dal contorno.
- [ ] **P1 — Piazza Immacolata + Corso Europa**: riconoscibilità del percorso missione e architetture tipo.
- [ ] **P1 — restante centro e Largo Cinque Via**: materiali, densità, illuminazione, decorazioni fedeli e non generiche.
- [ ] **P2 — anelli PSS-R02 → PSS-R07 e settori residui**: procedere ordinatamente nel paese usando profili locali e override per singoli edifici identificati.
- [ ] **P2 — revisione placeholder**: rimuovere quelli che oscurano piazze, ingressi, aree aperte o punti realmente verificati; conservare l'etichetta sintetica per il resto.
- [ ] **P2 — accessibilità + ottimizzazione**: leggibilità su piccolo schermo, fps, draw calls, nessuna regressione di traffico/missioni/zoom.

## Come registrare le sessioni di Work

Per ogni tranche completata aggiungi una sezione:

### Sessione YYYY-MM-DD — [Zona]

**Commit / PR:** …

**Fatto nel codice:** … (file cambiati; dettagli concreti visibili)

**Confronto visuale:** … (screenshot prima, screenshot dopo, stessa posizione, zoom, dispositivo)

**Edifici documentati:** … (way OSM → URL fonte → caratteristiche realmente viste → grado di confidenza)

**Edifici non verificati:** … (restano stile artistico, evitare falsa attribuzione)

**Test e deploy:** … (numero test realmente superati, esito GitHub Pages, errori)

**Aree successive:** …

## Avvertenza

Questa lista **non è un certificato di qualità**. Le voci sono aperte fino a commit, verifica visiva e fonti specifiche. Se una scena migliora ma non corrisponde al fabbricato reale, chiamarla “resa artistica migliorata”, non “ricostruzione fedele”.


### Sessione 2026-10-17 — Dettagli urbani e facciate

**Commit / PR:** `6697c50` (renderer), `8de7fe5` e `86b8584` (cache bust), con controlli di versione aggiornati fino a `0148da0`.

**Fatto nel codice:** in `city-art.mjs`, aggiunti giunti di pavimentazione e piccole riparazioni deterministiche nelle celle urbane dense, visibili allo zoom ravvicinato; variate in modo stabile per edificio alcune tonalità delle finestre e aggiunte persiane su una parte delle aperture. Le geometrie OSM, il numero di edifici e i placeholder non sono stati modificati. Aggiornati i parametri cache del renderer e i test che verificano quelle versioni.

**Confronto visuale:** verificata in Chrome la versione pubblicata su GitHub Pages dopo il deploy, a Via Roma, zoom a piedi 5×; la mappa carica e mostra 614 strade, 2.056 edifici OSM, 467 placeholder e 73 incroci. Screenshot dopo la modifica acquisito nella sessione. Per questa tranche non è disponibile uno screenshot “prima” alla stessa camera, quindi non si dichiara un confronto prima/dopo.

**Edifici documentati:** nessuna nuova verifica fotografica per singolo edificio. I dettagli di pavimentazione, persiane e finestre sono stilizzazioni procedurali, non rilievi di facciata. L’unico edificio con riscontro fotografico registrato resta Santa Maria delle Grazie, way 733703815.

**Test e deploy:** GitHub Actions, Node 22.23.3: 53 test superati, 0 falliti sul commit `0148da0`. Deploy GitHub Pages completato; URL verificato: https://czekuns.github.io/Effettokarmagra/games/gta-melito/?v=071.

**Aree successive:** acquisire una baseline prima/dopo ripetibile su Piazza Santo Stefano; poi continuare con Via Roma e il Municipio usando fonti identificabili, mantenendo distinta la stilizzazione generica dalle caratteristiche verificate.

### Sessione 2026-10-17 — Etichette della piazza e riferimenti open source

**Commit / PR:** `4bb88fb` (etichetta chiesa), `59dc011` (spaziatura etichette stradali), `28d5070` e `04415f6` (cache/test), `e87c01e` (handoff GTAopen).

**Fatto nel codice:** l'etichetta della chiesa è stata accorciata e riposizionata con fondo scuro; le etichette stradali evitano l'area della minimappa e vengono diradate vicino a punti notevoli e tra loro. Versione cache aggiornata a `v072`. Nel handoff è stata precisata la funzione di GTAopen: case/interiori/arredi nel mondo GTA 3D già esistente, senza renderer delle facciate cittadine.

**Confronto visuale:** lo screenshot fornito mostrava l'etichetta della chiesa coperta dalla minimappa e nomi di strade/piazza sovrapposti. Dopo la modifica, il gioco `v072` è stato aperto nel browser desktop e ha caricato la mappa a Via Roma. Non è disponibile uno screenshot post-modifica alla stessa posizione mobile di Piazza Santo Stefano; non si dichiara un confronto prima/dopo completo né una verifica mobile.

**Edifici documentati:** nessuna nuova facciata verificata. GTAopen non è una fonte di geometrie o aspetto per Melito; le sagome restano OSM e le caratteristiche visive restano stime salvo override con fonti identificabili.

**Test e deploy:** la validazione GitHub Actions sul commit `04415f6` è risultata positiva (53 test). Il browser ha caricato `v072`; il deploy del successivo aggiornamento documentale è da verificare.

**Aree successive:** tornare su Piazza Santo Stefano con un confronto mobile alla stessa camera; proseguire le verifiche di facciata per ID OSM, senza usare gli interni o i modelli di GTAopen come riferimento architettonico.

### Sessione 2026-10-17 — Revisione complessiva del comparto grafico

**Commit / PR:** `aeacf32` (renderer e interfaccia), `4ff1a9d` (asserzione di cache test).

**Fatto nel codice:** in `city-art.mjs` differenziata la palette dell'asfalto per gerarchia stradale, tolte le linee centrali dalle strade residenziali e mantenute sulle arterie principali, aggiunta una trama a lastre sul suolo urbano e rafforzata la profondità di cornici e davanzali. Corretto anche il controllo delle persiane: usava la larghezza della finestra al posto della lunghezza della facciata e quindi non poteva attivarsi. In `index.html` resa coerente l'interfaccia con la scena, con gerarchia più netta per HUD, controlli, mappa radar e pannelli; il canvas usa un ridimensionamento pixelato. Cache aggiornata a `v073`.

**Confronto visuale:** confronto browser desktop a Via Roma, camera a piedi 5×, tra `v072` e `v073`: la nuova versione ha contorni più nitidi, meno tratteggi sulle vie minori e un suolo più leggibile. La pagina carica i dati attesi (614 strade, 2.056 edifici OSM, 467 placeholder, 73 incroci). È stata fornita anche una schermata mobile precedente, ma non è disponibile una cattura post-modifica su dispositivo mobile; la verifica responsive resta da completare su telefono.

**Edifici documentati:** nessuna nuova verifica fotografica. Finestre, persiane, colori e texture rimangono stilizzazioni procedurali; le impronte OSM non sono state alterate.

**Test e deploy:** GitHub Actions sul commit `4ff1a9d`: 53 test superati, 0 falliti; controllo moduli browser passato. GitHub Pages deploy completato sul commit `4ff1a9d`.

**Aree successive:** verificare la stessa scena su smartphone reale, poi rifinire i contrasti di facciata e gli ingombri dei marker in Piazza Santo Stefano.


### Sessione 2026-10-16 — Profondità edifici e carreggiate

**Commit / PR:** `e3e5cde` (correzione renderer), `0eb7419` (allineamento test cache).

**Fatto nel codice:** in `building-volume.mjs` la proiezione delle facciate è stata limitata a 1,4–4,3 unità in X e 1,6–4,8 in Y, mantenendo la differenza di altezza ma impedendo estrusioni proporzionali fino a 20+ unità. In `city-art.mjs` rimossa la seconda sagoma d’ombra traslata di altre 2,4 unità, che allargava ancora l’impronta visibile verso la strada. Sagome OSM, collisioni, geometria stradale e tetti restano invariati. Aggiornata la cache del renderer a `074`.

**Confronto visuale:** controllo browser desktop dopo la modifica, via Via Roma, zoom a piedi 5×; scena e mappa caricate regolarmente. Nessuna verifica mobile post-fix disponibile in questa sessione.

**Edifici documentati:** nessun nuovo rilievo fotografico; materiali e profondità restano una resa arcade stilizzata.

**Test e deploy:** GitHub Actions: 53/53 test superati sul commit `0eb7419`; deploy Pages avviato per lo stesso commit, controllo pubblico in corso.

**Aree successive:** raccogliere screenshot smartphone dopo il rilascio e verificare gli incroci densi, dove la distanza fra sagome OSM e carreggiate è minima.


### Sessione 2026-10-17 — Coerenza dei placeholder urbani

**Commit / PR:** `9f8c3c4` (gruppi di infill e tetti), `08f60d3` (filtro dei singoli isolati), `86950d8` e `a5833c1` (soglia più stretta e aggiornamento test).

**Fatto nel codice:** `urban-infill.mjs` ora omette i placeholder senza un vicino entro 29 unità; i gruppi vengono scelti in blocchi 2×2 anziché con esclusioni casuali indipendenti. Circa il 60% degli infill riceve un tetto inclinato, con palette coerente e volume laterale mantenuto. La mappa produce 363 placeholder raggruppati invece di 467 distribuiti più liberamente; i 2.056 footprint OSM e le strade non vengono toccati. Cache renderer aggiornata a `077`.

**Confronto visuale:** versione pubblicata controllata su browser desktop, Via Roma, a piedi 5×. Il conteggio HUD mostra 363 placeholder; la mappa si carica regolarmente. Non ho una verifica mobile post-modifica in questa sessione.

**Edifici documentati:** nessun nuovo riscontro fotografico; i placeholder e le relative coperture sono ipotesi visive, non immobili accertati.

**Test e deploy:** GitHub Actions: 53/53 test superati; GitHub Pages completato sulla versione `077`.

**Aree successive:** rifinire i vuoti residui con cortili, isolati e recinzioni coerenti quando le geometrie o fonti pubbliche permettono di distinguerli; verificare su telefono.


### Sessione 2026-10-17 — Passata GTA2: masse, ombre e contrasto

**Commit / PR:** `75fe95e` — [commit GitHub](https://github.com/CzekUns/Effettokarmagra/commit/75fe95e3fb5fae406b112488d0793cfbedf26e6f).

**Fatto nel codice:** confronto della scena attuale a Piazza Santo Stefano, Via Roma e Municipio con schermate di gameplay di GTA 2. In `city-art.mjs` resa la palette più calda e contrastata: asfalto grafite, bordi marciapiede ocra, tetti terracotta e facciate in ombra più profonde. Il contatto d’ombra del tetto ora resta ritagliato dentro la sagoma; i fronti mantengono un rilievo corto, cornici marcate, imposte più leggibili e dettagli tetto concentrati. I vicoli minori restano senza righe centrali. Sono regole artistiche originali ispirate alla leggibilità arcade di GTA 2; non sono stati copiati loghi o asset Rockstar.

In `urban-infill.mjs` i vuoti del nucleo centrale sono trattati con soglie più permissive per gli edifici vicini, estendendo la stima dove OSM non contiene sagome; i placeholder generati sono 505, tutti con ID negativi e marcati come sintetici. È stato aggiunto il controllo della distanza minima tra l’intero perimetro dell’impronta e la rete stradale. `data/urban-infill.json` contiene una cache riproducibile, legata alla versione del generatore e all’impronta digitale di edifici e strade OSM, per evitare una generazione geometrica lenta sui telefoni. OSM, strade e collisioni non vengono alterati. Cache del gioco/renderer aggiornata a `v080`.

**Confronto visuale:** verificata la pagina pubblica `v080` su Chrome desktop, in Via Roma, a piedi 5×: HUD caricato con 614 strade, 2.056 edifici OSM, 505 placeholder sintetici e 73 incroci. La cattura live mostra asfalto grafite, bordi chiari, tetti terracotta, ombre compatte e massa urbana più densa; non è disponibile una cattura “prima” con la stessa camera e palette a confronto. Le catture precedenti in `qa/2026-10-17/` documentano solo la tranche di densità precedente, non il renderer `v080`. Un telefono fisico non è stato verificato; la viewport mobile resta da controllare.

**Riferimenti osservati:** gameplay di GTA 2 per prospettiva dall’alto, tetti compatti, ombre dure e contrasto carreggiata/marciapiede. Fotografia istituzionale della chiesa: [Comune di Melito di Napoli](https://comune.melito.na.it/vivere-il-comune/luoghi/chiesa-di-santa-maria-delle-grazie/) (consultata il 17-10-2026). Il catalogo ICCD descrive il centro come abitato compatto lungo Via Roma e la chiesa a croce greca con grande cupola; questa descrizione riguarda il contesto, non identifica i palazzi OSM mancanti. La fotografia non è stata inclusa nei file del gioco.

**Edifici documentati:** nessun nuovo palazzo residenziale è stato verificato per ID OSM. Santa Maria delle Grazie, way `733703815`, resta l’unica corrispondenza fotografica registrata; la posizione esatta della torre nel rendering e i dettagli dei prospetti restano stilizzati.

**Test e deploy:** GitHub Actions `GTA Melito visual and campaign validation` sul commit `75fe95e`: completato con esito positivo (Node 22 nel workflow). Deploy GitHub Pages completato con esito positivo sullo stesso SHA. Test locali Node 24: 57/57 superati; `git diff --check` passato.

**Aree successive:** ampliare la copertura sintetica solo dentro isolati con accesso stradale plausibile; censire foto con provenienza chiara per le facciate di Via Roma, Municipio e Piazza Immacolata; confrontare `v080` su telefono fisico.
