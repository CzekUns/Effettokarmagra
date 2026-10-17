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


### Sessione 2026-10-17 — Controlli touch in orizzontale

**Commit / PR:** `78ef0b0` — [commit GitHub](https://github.com/CzekUns/Effettokarmagra/commit/78ef0b098a534ba3d33798ef02c904882c869123).

**Fatto nel codice:** in `index.html` su smartphone il canvas passa a pieno schermo landscape; la modalità portrait è bloccata da uno schermo che chiede di ruotare. L’interfaccia di gioco mostra la levetta analogica in basso a sinistra, due pulsanti contestuali in basso a destra, minimappa e piccolo tasto pausa. HUD tecnico, missioni, mappa completa, zoom, reset e confronto strade sono accessibili dalla pausa. In `game.mjs` la levetta usa pointer capture e valori continui; in auto controlla accelerazione e sterzo, a piedi direzione e velocità. Il secondo tasto alterna corsa e freno a mano. Schermata pausa sospende la simulazione; tenta il blocco landscape al primo tocco quando supportato. `VISUAL_PROGRESS` e handoff aggiornati.

**Confronto visuale:** il riferimento precedente mostrava il gioco desktop con HUD, pulsanti direzionali, molti tasti e istruzioni. Ho riaperto su GitHub Pages la build `v081` a Via Roma dopo il deploy: la mappa si carica con 614 strade, 2.056 sagome OSM, 505 placeholder e 73 incroci. La verifica browser ha usato viewport desktop, quindi non dimostra il layout su telefono; test di struttura e breakpoint responsive sono passati, mentre la cattura mobile emulata/telefono resta da acquisire. L’effettivo blocco orientamento dipende dal supporto browser; il messaggio portrait è il fallback.

**Edifici documentati:** nessun cambio ai dati cartografici o agli asset.

**Test e deploy:** Node locale 24.19.0: `node --check games/gta-melito/game.mjs` e suite prevista: 58/58 test superati. GitHub Actions su Node 22: esito positivo (step sintassi browser e test mappa/grafo/traffico verdi). GitHub Pages completato sul commit `78ef0b0`; pagina `v081` aperta e mappa caricata.

**Aree successive:** verificare joystick multi-touch, due tasti, overlay pausa, safe-area e lock landscape su Android/iOS fisici; il fallback non deve coprire i controlli in landscape.

### Sessione 2026-10-17 — Blocco zoom browser

**Fatto nel codice:** viewport mobile limitata a scala 1 e senza pinch zoom; in modalità portrait/mobile `touch-action:none` impedisce i gesti di zoom/pan della pagina. Gesture Safari e wheel con Ctrl/Meta sono annullati a livello finestra, così le gesture browser non ingrandiscono la pagina. Le scorciatoie Ctrl/Meta con tasti zoom vengono bloccate. La rotella normale sul canvas continua a regolare lo zoom della camera di gioco; sono invariati zoom adattivo, joystick e controlli touch. Cache script aggiornata a `v082`.

**Verifica:** Node locale 24: `node --check games/gta-melito/game.mjs`, suite 59/59 e `git diff --check` superati. GitHub Actions Node 22 e Pages sul commit `b2a8462` completati con successo. Aperta la pagina pubblica `?v=082`: mappa caricata a Via Roma con 614 strade, 2.056 edifici OSM e 505 placeholder. Controllo visivo effettuato su Chrome desktop; il blocco zoom mobile è coperto dai test strutturali, non da un telefono fisico.

### Sessione 2026-10-17 — Pixel art e liberazione delle carreggiate

**Fatto nel codice:** il canvas ora lavora a risoluzione ridotta e viene ingrandito con nearest-neighbor, per bordi più netti e un aspetto più vicino alla pixel art, riducendo il lavoro di riempimento sui telefoni. Rafforzati balconi e unità esterne AC sulle palazzine residenziali come dettagli artistici generici, non assegnati come fatti ai singoli edifici. Le carreggiate vengono ridisegnate sopra i volumi dopo la pittura degli edifici: i tratti OSM che invadono una strada non coprono più l’asfalto. La collisione auto controlla l’intera sagoma sulle superfici stradali; dentro la carreggiata un footprint OSM sovrapposto non arresta più il veicolo. I props vengono mantenuti solo se il loro ingombro resta oltre 4,45 unità dal limite della carreggiata, anche vicino agli incroci; dei candidati iniziali ne restano 954 sicuri. I poligoni OSM, gli ID, i placeholder, i percorsi, le missioni e le collisioni pedonali restano invariati.

**Tour auto, strada per strada:** controllo automatico sulla rete OSM completa, usando i sei punti della sagoma dell’auto a intervalli di 6 unità lungo ogni way percorribile: 546 ways, 545 ID unici e 11.433 campioni. Ha trovato 86 coppie way/edificio OSM con sovrapposizione ai punti di collisione; tutte le 394 interferenze campionate ricadono sulla superficie stradale e vengono risolte dalla precedenza della carreggiata, con 0 punti irrisolti. Nessuno dei 505 placeholder è tra gli ingombri. Il tour non modifica le geometrie OSM e non equivale a un rilievo fotografico o a un giro su strada fisico.

**Confronto visivo:** screenshot browser desktop `v082` → `v084` a Via Roma, identico avvio a piedi 5×: pixel più netti, asfalto ridipinto sopra le sagome interferenti e meno props vicino agli incroci. Sulla build finale ho verificato ingresso in auto, accelerazione (HUD 12 km/h) e variazione dello zoom adattivo. Nessuna verifica su telefono fisico.

**Test e deploy:** Node locale 24.19.0: `node --check games/gta-melito/game.mjs`, suite 61/61 e `git diff --check` superati. GitHub Actions Node 22 e Pages sul commit `0e37134` completati con esito positivo. Aperta `?v=084`: cartografia caricata con 614 strade, 2.056 edifici OSM e 505 placeholder.

### Sessione 2026-10-17 — Direzione approvata: arcade mediterraneo compatto

**Riferimento approvato:** immagine fornita dall’utente il 17 ottobre 2026. Usata come guida di direzione artistica soltanto; non è stata inserita nel gioco né copiata come texture.

**Fatto nel codice:** in `city-art.mjs` scurita la gerarchia stradale verso il grafite, scaldata la pavimentazione urbana e aggiunta una trama di tegole sfalsate a contrasto. Un nuovo passaggio del renderer applica il motivo terracotta ai profili artistici storici e a una selezione deterministica di abitazioni basse e palazzine; il catalogo del censimento resta invariato e non si attribuiscono questi dettagli a prove fotografiche. Nel set attuale il criterio interessa 570/2.056 profili (circa il 28%). I soli dettagli con fonte fotografica mantengono la precedenza. Ombra di contatto e bordo superiore delle facciate hanno una separazione più netta. Geometrie OSM, volumi, collisioni, infill, traffico e zoom adattivo restano invariati. Cache del renderer `city-art.mjs?v=083`, gioco `v086`.

**Confronto visuale:** confrontate su Chrome desktop le build pubbliche `v085` e `v086`, alla stessa partenza di Via Roma e a piedi 5×. La `v086` aggiunge coperture terracotta con trama a corsi visibili, suolo più caldo e asfalto più grafite; la massa urbana e gli edifici di questa inquadratura restano più radi e schematici del mockup approvato, da colmare con successive verifiche e asset locali. `v086` carica i dati attesi: 614 strade, 2.056 edifici OSM, 505 placeholder e 73 incroci. Il confronto è stato controllato a schermo; non è stata archiviata una coppia PNG sincronizzata. Nessuna verifica su telefono fisico.

**Edifici documentati:** nessuna nuova facciata. La reference è un mockup artistico, non una fonte fotografica del Municipio o delle abitazioni. Colori e tegole restano una stilizzazione; Santa Maria delle Grazie (way `733703815`) resta l’unico edificio con corrispondenza fotografica già registrata.

**Test e deploy:** Node locale 24.19.0: `node --check` per `city-art.mjs` e `game.mjs`; suite GTA Melito completa: 62/62; `git diff --check` superato. GitHub Actions Node 22: run `#78` completato; GitHub Pages: run `#289` completato e pagina `?v=086` verificata in Chrome desktop. La verifica mobile fisica resta aperta.

**Aree successive:** catturare screenshot PNG sincronizzati su Piazza Santo Stefano, Via Roma e Municipio in desktop e landscape mobile; poi aumentare la riconoscibilità dei luoghi con asset originali e riscontri fotografici leciti, senza cambiare le impronte e distinguendo i dettagli stimati da quelli verificati.

### Sessione 2026-10-17 — Correzione di scala visiva dopo confronto utente

**Fatto nel codice:** il confronto diretto fra lo screenshot mobile pubblicato e il mockup approvato mostra che non sono simili: l'inquadratura corrente è ancora rada e cartografica. Per migliorare la scala leggibile, le chiome sintetiche stradali passano da circa 4.4 a 6.1–7.0 unità, con gruppi di colore e ombre a pixel. Una quota maggiore degli arredi casuali deterministici diventa albero. I punti sono spostati di altri 4 unità dal bordo stradale per mantenere libera la corsia; filtri strade-edifici e collisioni restano invariati. Il massimo zoom a piedi sale da 5× a 6× (corsa 5.55×), con pullback auto invariato e transizione smussata. Nessun edificio è stato aggiunto o spostato.

**Confronto visuale:** lo screenshot fornito dall'utente è la baseline mobile reale; il mockup approvato mostra alberi grandi e molto più densi, tetti dettagliati, isolati compatti e facciate alte. Le modifiche rendono chiome e dettagli esistenti più leggibili e avvicinano il campo visivo; non trasformano ancora la scena in una replica del mockup. Prima del deploy non è disponibile una cattura sincronizzata dopo su dispositivo mobile; non dichiarare parità visiva.

**Fonti e fedeltà:** le posizioni degli alberi e le specie restano dressing sintetico procedurale; OSM fornisce soltanto viabilità e sagome. Nessun nuovo edificio o tratto è dichiarato fotograficamente verificato.

**Test e deploy:** da completare nel rilascio successivo. Cache renderer `visuals.mjs?v=045`, camera `v=061`, pagina `v087`.

**Aree successive:** servono ulteriori asset originali per facciate e tetti, e una coppia di screenshot acquisita alla stessa inquadratura su desktop e smartphone landscape.

### Sessione 2026-10-17 — Restyling esteso e verifica della build 091

**Modifiche già pubblicate:** i commit `eabc222`, `92b1c05`, `907bf65` e `d16ec3f` hanno introdotto facciate più alte e dettagliate, tetti di cotto con tegole e volumi tecnici, materiali stradali e pavimentazione pixel, alberi e arredo più leggibili, indicatori di missione ridotti e riempimento dei vuoti urbani tramite sagome sintetiche. L'ultimo cache `urban-infill.json` contiene **612** placeholder (prima 505). Le 2.056 impronte OSM e la rete delle 614 strade non sono state sostituite.

**Verifica della pagina pubblicata:** `?v=091` aperta in Chrome desktop a Via Roma. La schermata mostra facciate e tetti volumetrici, ombre, chiome, dettagli sulle pareti e asfalto a contrasto; il cambiamento rispetto alle schermate grigie precedenti è netto. La scena conserva tuttavia superfici pavimentate ampie e la disposizione dei fabbricati non coincide esattamente con il mockup approvato. Ingresso in auto, mappa completa, zoom a piedi 6× e arretramento della camera in auto osservati nella build pubblica. Non attribuire agli edifici sintetici accuratezza catastale o fotografica.

**Validazione:** suite locale con Node 24.19.0: **63/63** test superati, inclusi distanza delle sagome sintetiche dalla carreggiata e punti missione. GitHub Actions Node 22 run [#84](https://github.com/CzekUns/Effettokarmagra/actions/runs/39015074118) e Pages [run](https://github.com/CzekUns/Effettokarmagra/actions/runs/39015073580): entrambi completati con successo sul commit `d16ec3f`. La pagina pubblica riporta 2.056 OSM, 612 placeholder, 614 strade e 73 incroci.

**Limite della prova visiva:** la verifica diretta finale è desktop. Le immagini locali in `qa/2026-10-17/` risalgono a una fase anteriore del restyling e non vanno presentate come schermate finali della build 091. Mancano due catture sincronizzate della build attuale, un test in viewport mobile landscape e una prova su telefono fisico. La chiesa di Santa Maria delle Grazie resta l'unico edificio con riscontro fotografico registrato.

### Sessione 2026-10-17 — Ottimizzazione dopo segnalazione FPS bassi

**Fatto nel codice:** strade, terreno, edifici con facciate e tegole, attraversamenti e arredo statico vengono disegnati in un canvas fuori schermo che copre la vista con un margine. Durante il movimento lento questo livello viene riutilizzato; viene ricostruito se la camera esce dal margine, lo zoom cambia oltre il 6,5%, cambia la larghezza stradale o viene preparata una nuova mappa. Auto, persone, player, nomi delle vie e indicatori missione restano aggiornati ogni fotogramma. Il rapporto di risoluzione del canvas è ora limitato a 0,99 su schermi ad alta densità, invece del precedente 1,44. Sagome, dettagli grafici, collisioni e zoom adattivo restano inalterati.

**Verifica:** lo smoke test controlla il riuso del canvas con fotogrammi consecutivi a camera ferma. La suite Node e il controllo sintattico sono stati eseguiti localmente. Non è disponibile ancora una misura FPS prima/dopo su telefono fisico; il miglioramento reale sul dispositivo dell'utente va verificato. Cache browser della pagina aggiornata a `v092`.

**Raggio di rendering, seconda tranche:** la ricerca dinamica aveva 90 unità di margine su ogni lato della viewport; ora ne usa 18 e la query elimina gli oggetti il cui rettangolo reale non interseca la vista, anche se condividono una cella della griglia. Alla posizione campione di Via Roma, in una viewport orizzontale 915 × 412 a zoom 6×, il rettangolo coinvolge 14 edifici OSM invece di 72. La cache statica a piedi passa da un'area di circa 50.614 a 29.663 unità quadrate, con circa 31 unità di anticipo oltre il bordo visibile; in auto mantiene il margine maggiore per limitare i picchi di ricostruzione a velocità elevata. Numeri geometrici calcolati sulla mappa, non FPS misurati. Suite locale 63/63; cache pagina `v093`.

### Sessione 2026-10-17 — Guida con una levetta e ritmo più rapido

**Input e movimento:** il comando laterale della levetta dà anche una lieve accelerazione in avanti; la diagonale continua a regolare sterzo e gas, e il movimento verso il basso permette la retromarcia. L'accelerazione passa da 22 a 46 unità/s², la velocità massima avanti da 28 a 40 unità/s e la retromarcia da 9 a 12. Lo sterzo è più rapido a bassa velocità e meno brusco a velocità elevata; durante curve strette la velocità cala gradualmente verso un limite più gestibile. A piedi il passo passa da 5 a 8,5 unità/s e la corsa da 7,5 a 13. Lo zoom adattivo dell'auto distribuisce l'allargamento della vista lungo la nuova fascia 0–40. Non cambiano carreggiate, collisioni, missioni né la disposizione dei comandi.

**Verifica:** test unitari su accelerazione, sterzo laterale/diagonale, retromarcia e freno; suite completa 66/66, controllo sintattico e diff. Restano da provare sensibilità e velocità su un telefono fisico. Cache pagina `v094`.

### Sessione 2026-10-17 — P2: cache statica a tasselli

**Fatto nel codice:** il rettangolo statico unico è stato sostituito da tasselli di 96 × 96 unità di mondo, rasterizzati a 4 pixel per unità. I tasselli restano riutilizzabili durante spostamento e cambio di zoom; solo quelli nuovi sono disegnati. La cache mantiene tutti i tasselli visibili e un piccolo margine recente, con limite adattivo da 32 a 100 tasselli (circa 19 MB per 32 canvas da 384 × 384 pixel, esclusi overhead del browser). Il browser può anticipare un tassello davanti al veicolo nei tempi inattivi. La texture sorgente di pietra, tegole e asfalto viene costruita una volta e condivisa fra i diversi canvas; i pattern rimangono specifici del rispettivo contesto. La geometria ai bordi viene cercata con 20 unità di margine e ritagliata dal canvas del tassello. Auto, NPC e missioni restano dinamici. Cache pagina `v095`.

**Verifica:** lo smoke test ripete fotogrammi a camera ferma e controlla che non vengano creati altri tasselli; un test separato verifica la condivisione della sorgente delle texture fra canvas. Suite locale 67/67; manca ancora una misura di frame time e memoria su Android, e una verifica visiva delle giunzioni fra tasselli durante la guida. La PR #2 resta separata dalla build pubblica finché non è unita.

**P3 preparata:** `stepAgents` aggiorna 140 auto e 190 pedoni a ogni frame. Per ogni auto, `stepAgent` scorre anche tutte le altre auto sulla stessa edge, ottenendo una ricerca quadratica nella fase traffico. Prossimo intervento: raggruppare le auto per segmento stradale, simulare a 20 Hz gli NPC vicini alla viewport, aggiornare lontani a frequenza ridotta conservando avanzamento e svolte, e verificare ingressi in vista, collisioni e missioni. Misurare i tempi separati di simulazione, tasselli e compositing prima/dopo sul dispositivo reale.

### Sessione 2026-10-17 — Guida assistita e marciapiedi attraversabili

**Fatto nel codice:** `driving-assist.mjs` orienta gradualmente l'auto verso la tangente del tratto stradale più vicino e corregge lievemente la deriva laterale, solo quando velocità, distanza e angolo sono compatibili. Uno sterzo oltre il 52% disattiva l'assistenza per 0,85 s; una svolta perpendicolare e la retromarcia restano libere. Nessuna posizione viene forzata sul tracciato. La collisione a sei punti ora ammette il marciapiede disegnato fino a 2,5 unità oltre il mezzo spessore stradale, con un piccolo margine dal bordo visibile; in quella fascia la sagoma degli edifici blocca l'auto, sull'asfalto rimane la precedenza della strada. Fuori dal bordo, e contro altre auto/traffico e confini, la collisione resta attiva. Cache `v096`.

**Verifica:** 70/70 test Node, inclusi nuovi casi per rilascio dell'assistenza, ricentraggio, marciapiede, edifici e bordo esterno. Da verificare la sensibilità dello sterzo e gli FPS su Android reale; nessuna misura fisica acquisita.

### Sessione 2026-10-17 — Aiuto alle svolte su strade e marciapiedi

**Fatto nel codice:** `intersection-assist.mjs` ricava una volta sola dal grafo OSM gli imbocchi legalmente percorribili in auto. Vicino a un nodo, una sterzata analogica leggera nella direzione desiderata seleziona l'uscita; l'auto rallenta brevemente, punta prima al centro dell'incrocio e poi a un punto mobile sulla strada scelta. Il comando può essere rilasciato durante la svolta; sterzo deciso, retromarcia e uscita dal veicolo annullano l'aiuto. Non viene cambiata la posizione dell'auto né la collisione: marciapiedi attraversabili, palazzi, bordo mappa e altre auto restano come nella v096. Sulle strade dritte resta il richiamo già approvato. Cache pagina `v097`.

**Verifica:** simulazione della sagoma a sei punti su svolta stretta con carreggiata e marciapiede, controlli di scelta destra/sinistra e rete reale OSM; suite Node 74/74 e sintassi superate. CI e deploy da verificare dopo il merge. La sensibilità e gli FPS Android restano da misurare sul dispositivo.

### Sessione 2026-10-17 — Piccolo rimbalzo contro gli ostacoli

**Fatto nel codice:** quando l'auto urta un muro, un edificio, un altro veicolo o il bordo percorribile, cerca un arretramento di 0,45–1,4 unità, eventualmente spostato di 0,55 unità di lato. Ogni posizione candidata usa la collisione completa esistente; se non c'è spazio libero, l'auto si ferma. Un breve impulso nella direzione opposta all'urto si attenua in circa 0,26 s e sospende temporaneamente gas e guida assistita, così tenere premuto l'acceleratore non la lascia ferma sul muro. Funziona anche in retromarcia. La velocità è limitata a 1,4–5 unità/s. Cache pagina `v098`.

**Verifica:** test su arretramento sicuro, ostacolo sul lato, spazio chiuso, urto in retromarcia e acceleratore tenuto premuto contro una parete; suite Node 77/77, sintassi e controllo diff superati. Sensibilità e resa su Android fisico ancora da verificare.
