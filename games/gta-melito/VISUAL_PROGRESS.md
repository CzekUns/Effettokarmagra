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

### Sessione 2026-10-18 — Primo ingresso in banca

**Commit / PR:** PR #24, commit merge `c3314469e86151082714ecbc7e1d6f230a694ea5`.

**Fatto nel codice:** aggiunto `bank-interior.mjs`: individua i POI OSM `bank`, risolve un punto pedonale libero vicino a una strada e disegna un anello luminoso con invito `BANCA · E`. Avvicinandosi a piedi, il comando contestuale diventa `ENTRA IN BANCA`; E o il pulsante touch apre una scena pixel art autonoma del Banco BPM, con pavimento, sportelli, area d’attesa e ATM. Nella sala si può camminare e uscire con E, Escape o il pulsante `ESCI DALLA BANCA`, che riporta alle coordinate esterne salvate. Il radar e gli elementi di navigazione stradale scompaiono durante l’interno. La prima banca disponibile nello snapshot OSM è Banco BPM; l’individuazione per tag OSM permette di aggiungere automaticamente altri punti banca e in futuro indirizzi specifici.

**Edifici documentati:** l’identità e la coordinata del POI Banco BPM provengono dallo snapshot cartografico OSM; il layout interno è una scena inventata per il gioco, non una ricostruzione dell’interno reale. L’accesso viene posto su una posizione pedonale libera vicino al POI e fuori dagli ingombri degli edifici mappati.

**Test e deploy:** suite locale aggiornata: 139 test superati. Il test dedicato risolve il POI Banco BPM della mappa effettiva e controlla che il marker resti vicino al punto banca; test grafico verifica che la scena interna venga disegnata senza stato della strada. Cache pagina aggiornata a `v129`. GitHub Actions Node 22: 139 test superati; deploy GitHub Pages completato. Pagina pubblica `?v=129` verificata in browser: mappa caricata e nuovi moduli senza errori JavaScript.

**Aree successive:** l’utente indicherà gli indirizzi ulteriori; resta da verificare la scena su telefono dopo il deploy.

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

### Sessione 2026-10-17 — Marciapiedi larghi il doppio

**Fatto nel codice:** i tre strati pittorici del marciapiede (bordo esterno, ombra e bordo chiaro) si estendono ora rispettivamente di 7,2, 5,8 e 1,7 unità per lato oltre metà della larghezza stradale, il doppio dei 3,6, 2,9 e 0,85 precedenti. La carreggiata e gli assi OSM restano identici. L'auto può arrivare fino a 5 unità sul marciapiede, il doppio delle 2,5 precedenti, purché i suoi sei punti non tocchino edifici, veicoli o confine. Il bordo disegnato resta più esterno della zona guidabile. La guida assistita segue la stessa fascia. Cache `v099`.

**Verifica:** test sugli strati disegnati e sui limiti percorribili, suite Node 77/77. Da ispezionare sul deploy l'effetto vicino agli edifici OSM e in viewport mobile; larghezza e guida su Android fisico ancora da provare.

### Sessione 2026-10-17 — Prima IA traffico e pedoni, collisioni dinamiche

**Fatto nel codice:** auto e pedoni continuano a scegliere le svolte sulla rete OSM; i pedoni percorrono ora il lato del tratto stradale, rientrando verso il nodo presso gli incroci. Il disegno del pedone usa la sua posizione fisica, senza un secondo spostamento laterale. Prima di avanzare, un NPC prova il passo intero e due passi ridotti, e si ferma se incontrerebbe un'altra auto, un'auto parcheggiata, un pedone o il giocatore; le auto mantengono anche la distanza lungo lo stesso segmento. Gli NPC nascono in posizioni non sovrapposte. L'auto del giocatore controlla una sagoma orientata contro auto e pedoni, conservando il piccolo rimbalzo se l'urto è inevitabile. Le collisioni fra auto utilizzano rettangoli orientati; il controllo auto/pedone considera la sagoma dell'auto. Gli oggetti vicini sono cercati in celle di 16 unità, gli NPC sono simulati a 20 Hz e disegnati con interpolazione fra due aggiornamenti. Non sono stati aggiunti danni o ragdoll. Cache `v100`.

**Verifica:** 82/82 test Node, inclusa simulazione di 140 auto e 190 pedoni per 10 secondi sulla mappa reale senza sovrapposizioni, coda dietro auto parcheggiata, precedenza a incrocio, pedone che si ferma e giocatore a piedi. Nel benchmark locale di 200 aggiornamenti dei 330 NPC, la simulazione impiega circa 146 ms complessivi (numero indicativo Node, non FPS su telefono). Da verificare la resa e la sensibilità su Android reale; il deploy va controllato dopo il merge.

### Sessione 2026-10-17 — Controllo estetico degli edifici

**Osservazione della build 100:** nella vista desktop di Via Roma a 6× e 4,5× i tetti e le facciate hanno volume leggibile, ma i marciapiedi raddoppiati coprono le pareti a bordo strada. Molti tetti spioventi appaiono dello stesso arancio: la tinta deterministica assegnata a ogni edificio era ignorata dalla texture condivisa. Restano ripetizioni di finestre, balconi e pavimentazione nei grandi isolati; i dettagli non sono un rilievo fotografico.

**Modifica:** la strada completa si disegna sotto gli edifici; sopra di essi si ripassa soltanto la superficie della corsia per rimuovere le proiezioni che arrivano sull'asfalto. Il marciapiede rimane visibile dove non è occupato dall'edificio e le facciate non vengono tagliate dalla sua seconda passata. Ai tetti spioventi si applica una velatura della tinta preesistente sopra la texture unica, senza creare texture nuove per palazzo. Sagome OSM, collisioni, larghezza percorribile e classificazioni restano identiche. Cache pagina `v102` (la `v101` include i nuovi sprite delle auto).

**Verifica:** suite locale Node 84/84, sintassi e diff superati. Da completare confronto della pagina pubblicata in desktop e viewport mobile; nessuna misura FPS o prova su telefono fisico. La chiesa Santa Maria delle Grazie rimane l'unico edificio con riscontro fotografico registrato.

### Sessione 2026-10-17 — Fiat Punto 188 e Lancia Ypsilon 2003

**Implementato:** due schede top-down su sfondo bianco e 16 PNG individuali ritagliati nella cartella di consegna del progetto; atlante PNG palettizzato trasparente 4×4 da 160×240 caricato nella repository, `car-sprites.mjs` esteso alle 16 varianti senza toccare la Panda iniziale. Traffico AI e alcune auto parcheggiate usano anche Punto e Ypsilon, con fallback grafico e hitbox invariate. Colori illustrativi plausibili, **non attestati uno per uno come tinte di fabbrica**. Test e deploy da verificare sul commit pertinente.

### Sessione 2026-10-17 — Fix trasparenza Punto 188 / Ypsilon

**Segnalazione:** rettangolo nero evidente intorno alle nuove auto. **Diagnosi:** atlante PNG legacy con sfondo scuro opaco. **Intervento implementato nel client (v104):** maschera pixel derivata dalle silhouette dei crop originali, applicata una sola volta all'atlante in Canvas 160×240 in caricamento, con alpha esterno azzerato. Solo l'atlante riparato è disegnato nel gioco; fallback Canvas se il ripristino non riesce; Panda inalterate. **Limite:** il PNG originale repository rimane opaco e va sostituito in futuro con un atlante RGBA corretto anche come file statico. Verifica dei test e deploy da riportare dopo GitHub Actions; controllo visuale Android ancora necessario.

### Sessione 2026-10-17 — Rigenerazione colori Punto/Ypsilon, ridimensionamento e alfa reale

**Consegna:** ritagliato e ridimensionato il materiale pittorico generato per Fiat Punto 188 e Lancia Ypsilon 2003, ricolorato coerentemente in 8 varianti per modello (16 in totale), e impacchettato nel nuovo `assets/vehicles/punto-ypsilon-16colors-rgba.png` 160×240, 4 colonne × 4 righe, celle **40×60 px**. I pixel esterni sono davvero trasparenti: il file usa PNG indicizzato con canale alfa `tRNS` corretto, verificato in tutti i 64 angoli di cella. Eliminata la maschera JS di recupero e i suoi test obsoleti; il gioco usa direttamente il file. **Dimensione fisica dei veicoli e collisioni invariata**, Panda non modificate. Aggiornate verifiche sull'atlante e bust cache a v105. Colori **interpretativi** e non catalogo ufficiale. Sono stati controllati a campione i crop su sfondo grigio e i valori alpha; il rendering nel browser su telefono e lo stato Actions restano da controllare dopo il deploy.
### Sessione 2026-10-17 — Tre palazzi campione presso Piazza Santo Stefano

**Fonti consultate:** Google Maps in modalità satellite ha presentato una verifica automatica e non ha mostrato la mappa. Una vista satellitare di Melito su satellites.pro ha mostrato la densità e l'alternanza generale di coperture nell'area urbana; non aveva dettaglio sufficiente per assegnare materiali ai singoli way. Apple Maps satellite non ha caricato le immagini; il SIT della Città Metropolitana ha restituito un errore di certificato nel browser. Le sagome e gli ID precisi provengono dallo snapshot OSM del gioco e dalle schede del primo anello. Nessuna immagine satellitare viene incorporata o redistribuita.

**Fatto nel codice:** tre impronte OSM residenziali intorno alla piazza (`733703625`, `733703811`, `733703751`) ricevono una prova originale di terrazzo in pixel art: superfici grigio-pietra, parapetti, accessi e piccoli impianti disegnati con la stessa luce da nord-ovest e ombre verso sud-est. La proiezione volumetrica resta quella di tutti i palazzi; i dettagli sono ritagliati dentro il rispettivo poligono. Le tre tinte e i volumi tecnici sono interpretazioni grafiche non verificate edificio per edificio. La chiesa e il Municipio mantengono il loro trattamento distinto. Non cambiano impronte, collisioni o quantità di edifici. Cache pagina `v106` dopo l'aggiornamento auto v105.

**Verifica:** 88/88 test Node, sintassi e diff locali superati. Da controllare la scena pubblicata a Piazza Santo Stefano, il comportamento mobile e gli FPS su telefono fisico.

### Sessione 2026-10-18 — Zoom +10% e inquadratura auto spostata in avanti

**Richiesta:** ingrandire del 10% la visuale; in corsa mantenere la camera utile davanti all'auto, collocando il veicolo circa al 10% dal bordo posteriore della vista e lasciando una porzione di strada anche dietro.

**Modifica:** moltiplicata del 10% la scala automatica a piedi e in auto, mantenendo la stessa curva relativa velocità/zoom e le regolazioni manuali. In auto la camera usa viewport e zoom correnti per calcolare l'anticipo: ferma, resta centrata; in movimento sposta gradualmente il veicolo verso il lato posteriore fino a circa il 30% della proiezione longitudinale. Nessuna modifica a velocità, guida assistita, collisioni o rendering. Cache pagina `v107`, modulo camera `v095`.

**Verifica:** 93/93 test Node, incluso calcolo del framing a riposo, in orizzontale e in verticale. La resa soggettiva in viewport desktop/mobile e su telefono fisico resta da verificare dopo la pubblicazione; i test non misurano gli FPS.

**Correzione dopo prova in auto:** lo spostamento iniziale al 10% metteva il veicolo troppo vicino al bordo e faceva percepire la camera come distante. Ridotto a circa il 30% della proiezione dal bordo posteriore (camera spostata del 20% verso la direzione di marcia), mantenendo un anticipo chiaro ma meno estremo. Cache pagina `v108`, modulo camera `v096`.

**Seconda regolazione dopo feedback:** a velocità piena il veicolo mostra ora circa il 42% della proiezione in avanti, cioè il 60% dei circa 70% precedenti; rimane una parte visibile dietro. La camera segue l'auto con interpolazione più lenta (3 invece di 6) e anche lo zoom automatico rallenta (2,8 invece di 4,2), per attenuare i cambi di direzione e l'ingresso in auto. Cache pagina `v109`, modulo camera `v097`.

**Correzione dopo prova proporzioni in marcia:** l'anticipo della camera era stato invertito, lasciando la maggior parte della vista dietro l'auto. Ripristinato il camera lead in avanti che la mantiene nel terzo posteriore della vista (circa 30% dietro, 70% davanti). La curva di zoom dell'auto torna a `3.35 → 1.87` (valori precedenti al +10%), mentre il +10% a piedi rimane; follow veicolo e transizioni zoom restano ammorbiditi. Cache pagina `v110`, modulo camera `v098`.

**Regolazione zoom su richiesta:** la curva in auto sale del 40% rispetto alla versione `v110`: auto ferma `3.35 → 4.69`, auto alla velocità massima della curva `1.87 → 2.618`. La posizione del veicolo nella viewport e la transizione fluida non cambiano; lo zoom a piedi resta invariato. Cache pagina `v111`, modulo camera `v099`. Questa modifica della camera non aggiunge verifiche fotografiche agli edifici.

**Secondo aumento zoom auto:** interpretato “un altro 40x” come un ulteriore aumento del 40% della scala di visualizzazione in auto rispetto a `v111`. Auto ferma `4.69 → 6.566`, al massimo della curva `2.618 → 3.6652`. La scala a riposo rimane sotto il massimo globale `6.6`, evitando che l'aumento richiesto sia tagliato dal limite. Inquadratura direzionale, interpolazione e zoom a piedi non sono modificati. Cache pagina `v112`, modulo camera `v100`.

### Sessione 2026-10-18 — Precisione delle facciate esistenti

**Osservazione:** nella scena iniziale di Via Roma, finestre e balconi sulle pareti oblique erano orientati orizzontalmente rispetto allo schermo, anziché seguire la parete. Il risultato accentuava la ripetizione e staccava i dettagli dai volumi. Screenshot della build `v112` osservato nel browser desktop; manca ancora un confronto fotografico edificio per edificio.

**Fatto nel codice:** finestre, persiane, balconi e piccoli impianti ora usano un sistema di coordinate per singola facciata: un asse segue il lato OSM, l'altro la proiezione obliqua già usata per il muro. La trasformazione viene applicata una volta per parete durante la rasterizzazione del tassello statico. Non sono introdotti WebP né nuove texture, e non cambiano sagome, collisioni, numero di edifici o telecamera. Si tratta di una correzione grafica, non di una verifica dei materiali reali degli immobili. Cache pagina e modulo arte `v113`.

**Verifica:** 94/94 test Node superati, inclusa facciata diagonale, sintassi e `git diff --check`. Confronto visivo della versione pubblicata e prova FPS su telefono ancora da completare dopo il deploy. Come evoluzione, un catalogo limitato di circa 20 tipologie riutilizzabili può differenziare tetti e facciate secondo sagoma e categoria, con benchmark sulla cache attuale prima di adottare eventuali asset WebP.

### Sessione 2026-10-18 — Traffico e marciapiedi AI

**Problemi riprodotti:** le auto parcheggiate aggiuntive venivano collocate sul centro della strada; il percorso dei pedoni convergeva verso il centro della carreggiata nei quattro metri presso ogni nodo; l'AI controllava la collisione solo nella posa finale di una svolta. Sulla mappa completa, nella simulazione iniziale di 60 secondi con 140 auto e 190 persone, si osservavano 39.743 campioni di pedoni entro la mezza larghezza della propria strada, 406 inversioni brusche delle auto e gruppi di veicoli fermi per decine di secondi. Questi numeri sono campioni della simulazione, non FPS o conteggi di incidenti osservati nel browser.

**Correzioni:** le auto di sosta aggiuntive cercano posto a uno dei due margini percorribili e scartano posizioni contro edifici o altre auto; anche la Panda iniziale prova un posto raggiungibile sul margine, con fallback sulla posizione precedente se i margini non sono disponibili. I pedoni percorrono il bordo della strada senza convergere al centro presso gli incroci e, quando esiste un angolo di marciapiede percorribile, lo seguono per due brevi segmenti anziché saltare da un lato all'altro. Le auto AI nascono preferibilmente su strade con un'uscita in avanti, evitano svolte in vicoli ciechi quando esiste un'alternativa, e partono più distanziate. Due archi OSM che formano un anello ampio e compatto vengono interpretati come circolazione a senso unico; è un'inferenza geometrica artistica, non una correzione dei dati OSM. Le collisioni AI sono campionate anche durante lo spostamento fra due pose. Un vicolo a senso unico senza uscita trattiene l'auto al capolinea invece di teletrasportarla in un'altra via. Dopo oltre otto secondi di blocco, un'auto può essere reinserita su una strada libera solo se sia il punto di partenza sia quello di arrivo sono fuori dalla camera.

**Misure locali:** 60 secondi simulati con 140 auto e 190 persone, nessuna sovrapposizione rilevata nei campioni ogni secondo; fino a 6 auto bloccate per oltre cinque secondi con il recupero fuori vista, nel campione. I pedoni restano a distanza dal centro della propria carreggiata sui tratti ordinari; nei raccordi di marciapiede la misura sulla linea infinita del vecchio tratto non rappresenta un attraversamento reale. La verifica diretta degli incroci, dei marciapiedi occupati da sagome OSM, delle rotonde diverse dall'anello identificato e degli FPS su telefono resta necessaria. Suite Node 99/99 e sintassi passate. Cache pagina e moduli traffico `v114`.


### Sessione 2026-10-18 — Caricamento sprites Fiat Uno, Smart, Seicento, 500

Due nuovi atlas PNG indicizzati da 160×240 (4×4, cella 40×60) con alfa corretto: `uno-smart-16colors-rgba.png` (6,826 byte) e `seicento-500-16colors-rgba.png` (8,387 byte). Sfondi trasparenti senza mascheramento a runtime, otto colori per modello. Registrati tutti i 32 nuovi ID nelle auto parcheggiate e nel traffico, ora insieme ai 16 Punto/Ypsilon e alle Panda esistenti. Per ogni modello nuove dimensioni visuali calibrate, collisioni e fisica inalterate. Cache veicoli `v106`, cache pagina `v115`. La Smart resta artisticamente imperfetta: nessuna rivendicazione di fedeltà fotografica. Verificare test GitHub Actions e resa Android post-deploy.

### Sessione 2026-10-18 — Fronti stradali e contatto degli edifici col suolo

**Osservazione:** nella scena iniziale di Via Roma, la pavimentazione uniforme attraversa isolati molto ampi mentre alcuni palazzi segnaposto sembrano dispersi sopra un fondo ripetuto. Misurando tutte le 612 sagome sintetiche rispetto alle strade, 71 entravano nella fascia del marciapiede dipinto (7,2 unità oltre la metà della carreggiata). Questa misura riguarda solo i placeholder: le 2.056 sagome OSM restano cartografiche.

**Modifica:** la prima scelta dei segnaposto sintetici segue i tratti di strada, con il fronte parallelo al segmento e la distanza derivata dalla profondità effettiva del palazzo. La griglia globale riempie soltanto i vuoti residui. Il margine minimo richiesto alla rete stradale sale da 6 a 9,2 unità oltre la metà della larghezza stilizzata: la cache precomputata passa da 612 a 553 edifici inventati e nessuno dei 553 attraversa la fascia dipinta del marciapiede. Una sottile soglia di pavimento, ancorata a ogni impronta, interrompe la texture continua e collega visivamente la base al terreno; è disegnata sotto strade e palazzi. I nuovi profili di lotto sono ornamentali, non confini catastali. La disposizione sintetica e le sue collisioni cambiano; ID, impronte e collisioni OSM, strade e camera non cambiano. Cache pagina e moduli `v116`.

**Verifica:** suite Node, desktop pubblicato e viewport mobile da riportare dopo il merge; ancora necessaria una misura FPS su dispositivo reale. Colori, altezze e posizioni dei placeholder non sono edifici verificati fotograficamente.

### Sessione 2026-10-18 — Personaggi dall'alto più leggibili

**Osservazione:** giocatore e pedoni erano disegnati con torso, testa e arti rettangolari sovrapposti. Alla scala di gioco il contorno diventava un blocco quadrato, poco distinguibile dal fondo e dai dettagli architettonici.

**Modifica:** un'unica silhouette procedurale vista dall'alto disegna testa ovale incorniciata dai capelli, collo, spalle larghe, vita stretta, due braccia separate, due gambe e scarpe che si alternano con il passo. Sei palette e piccoli dettagli (zainetto, collo, cappello) differenziano i pedoni; il giocatore conserva giacca rossa e un segno dorato sulla spalla. La direzione segue l'angolo fisico già interpolato degli NPC. Nessuna immagine esterna, download o modifica a collisioni, velocità e dimensioni delle auto. Cache modulo arte e pagina `v117`.

**Verifica:** 103 test Node e sintassi superati localmente. Resa pubblicata da osservare dopo il deploy; gli FPS su telefono fisico non sono stati misurati.


### Sessione 2026-10-18 — Chiesa di Santa Maria delle Grazie, WebP generato e inserito

**Riscontro usato:** screenshot satellitare fornito dall'utente solo come riferimento morfologico (non copiato né caricato nel repository). La tavola generata è stata ritagliata e ridotta a WebP trasparente (160×136 px, circa 5,7 KB), per arricchire cupola scura, lanternino, tetti delle cappelle e campanile. La texture resta artistica: il satellite suggerisce che la navata a nord occupa anche altri poligoni OSM e non deve essere inglobata nel solo way 733703815; posizione del campanile e decorazioni non rilevate con precisione metrica.

**In gioco:** `assets/buildings/chiesa-santa-maria-delle-grazie-game.webp` riveste **esclusivamente il tetto** del way 733703815; `city-art.mjs` continua a gestire impronta originale OSM, volume/pareti, ombre, strade, etichette e collisioni. Clip al poligono per evitare sovrapposizioni ai vicini; fallback disegno procedurale quando manca il WebP. Caricamento non bloccante e cache tile invalidata all'`onload`. Cache modulo `city-art.mjs?v=118`, pagina `game.mjs?v=118`. Verificare CI e resa mobile effettiva dopo deploy.

### Sessione 2026-10-18 — Strada sotto i tetti, passaggio rivelato al giocatore

**Problema:** l'asfalto veniva ridipinto sopra tutti i palazzi per garantire una carreggiata libera in presenza di impronte OSM sovrapposte alle strade. Il ritaglio eliminava la parte del tetto, incluso l'asset WebP della Chiesa, e faceva sembrare la via poggiata sopra l'edificio.

**Fatto nel codice:** il tassello statico disegna la strada prima dell'intero edificio e non ripassa più l'asfalto sui tetti. Il passaggio del giocatore a piedi o in auto sotto una copertura proiettata attiva una rivelazione graduale: la strada viene ridisegnata solo nell'unione della sagoma OSM e del tetto sollevato, con opacità massima del 78%, conservando visibile un residuo del tetto. La verifica di copertura usa la proiezione già esistente del volume; le sagome e collisioni originali, AI e zoom non cambiano. Un controllo preliminare sul rettangolo dell'edificio e il disegno dinamico solo per coperture attive limitano il lavoro per fotogramma. Cache pagina e modulo `roof-reveal.mjs` `v119`.

**Verifica locale:** 108 test Node, inclusi geometria del tetto integro, interpolazione dell'opacità, ingresso del browser simulato e controllo della carreggiata; sintassi e diff superati. L'effetto visivo pubblicato e gli FPS su telefono fisico restano da controllare.


### Sessione 2026-10-18 — NPC animati da spritesheet PNG, quattro modelli

Ritagliati 64 fotogrammi dalla tavola generata: quattro personaggi (uomo con polo blu, donna con top rosso, anziano beige, rider giallo), quattro direzioni e quattro pose a testa. PNG individuali e tavola originale restano negli artefatti della lavorazione; per Android il gioco carica **un solo atlante 384×160**, celle 24×40, sfondo trasparente e palette ottimizzata (~12,9 KB), in `assets/people/pedoni-4x4frames-24x40-rgba.png`.

In `pedestrian-sprites.mjs` frame e orientamento sono scelti da angolo di marcia e tempo/velocità. In `city-art.mjs` gli NPC adottano gli sprite caricati una sola volta, con fallback al disegno Canvas originale durante il caricamento o in caso di errore. Il protagonista rimane invariato. Percorsi, velocità fisiche, marciapiedi, collisioni e generazione non sono modificati. Grafica 2.5D illustrativa da valutare in partita su smartphone: alcuni fotogrammi sono molto simili e i personaggi sono meno zenitali delle vetture. Aggiornati `city-art.mjs?v=119` e `game.mjs?v=120` per cache.


### Sessione 2026-10-18 — Nuovo spritesheet pedoni e protagonista rosso

Ritagliati dalla nuova tavola generata **64 frame (4 identità × 4 direzioni × 4 passi)**. Identità: protagonista con felpa rossa e pantaloni scuri (riservato esclusivamente al giocatore), donna con top bianco, uomo con tuta verde, operaio/gilet arancione. Le immagini di origine sono state separate in PNG individuali 24×40, con pixel d'angolo a trasparenza reale. Le 64 immagini sono state accorpate in un **unico PNG indicizzato da 384×160, circa 13 KB**, 16 colonne per 4 righe, al percorso `assets/people/pedoni-secondo-lotto-4x4frames-24x40-rgba.png`.

La funzione `drawCityPlayer` usa **l'ID 0 della nuova tavola**, con gestione delle direzioni e frame quando cammina; ripiega sul vecchio disegno procedurale se il PNG non si carica. Il traffico pedonale comprende **sette identità visive** (quattro precedenti + donna in bianco, tuta verde, operaio), con `kind` da 0 a 6 e nessun protagonista duplicato come NPC. Il percorso, l'orientamento, le dimensioni fisiche, la velocità e le collisioni dei pedoni sono invariati. I moduli impostati per bust cache sono `roads.mjs?v=115`, `city-art.mjs?v=120` e pagina `game.mjs?v=121`. I personaggi restano stilizzati 2.5D: confronto visivo del rendering nel browser/mobile ancora necessario.

### Sessione 2026-10-18 — Scooter e motociclette guidabili, piloti e collisioni proprie

Quattro stili di due ruote (scooter moderno, scooter rétro, moto naked, moto sportiva), ciascuno in quattro verniciature (bianco, rosso, nero, blu) raccolti in PNG palette/alpha 160×272, celle 40×68, circa 9,6 KB. Grafica originale interpretativa, nessun logo/marchio dichiarato identico al modello reale.

Il modulo `motorcycles.mjs` disegna le moto e sovrappone busto, casco, braccia e gambe dei guidatori, con fallback Canvas, modello seduto del giocatore in giacca rossa. Aggiunte moto parcheggiate, scooter di prova vicino allo spawn se lo spazio lo permette, e traffico AI su moto già occupate (1 su 12), senza manipolare i percorsi esistenti. Entrata/uscita con E o touch, freno per scendere (velocità massima 2,3 unità/s), scelta di posizione di discesa libera e corretta gestione del pilota a piedi. Velocità, sterzata e impronta di collisione moto proprie; moto e auto condividono vie OSM e conservano collisioni senza attraversamenti. Gli NPC guidano ma non salgono/scendono dinamicamente, non ci sono ancora passeggeri. Aggiornati moduli `traffic-collision.mjs?v=115`, `roads.mjs?v=116`, `game.mjs?v=122`, nuovo `motorcycles.mjs?v=001`. Verificare test automatici e visivamente su dispositivo.
### Sessione 2026-10-18 — Chiesa e correzioni contenute dei fronti stradali

**Chiesa Santa Maria delle Grazie:** il WebP trasparente dell'edificio 733703815 viene disegnato come silhouette completa. Quando è caricato, non viene più ritagliato sul poligono del tetto e non viene disegnato il vecchio tetto procedurale o il bordo Canvas sopra/sotto l'immagine. Restano pareti e ombra 2.5D; se l'immagine manca, resta il fallback procedurale. La mappa OSM originale e il way ID non cambiano.

**Strade:** `generate-building-placement.mjs` ha misurato l'intrusione degli edifici mappati nella fascia carreggiata/marciapiede delle strade già allargate. La cache `data/building-placement.json` contiene soltanto piccole traslazioni deterministiche, massimo 12,1 unità, quando riducono almeno del 15% l'intrusione del singolo edificio senza creare nuovi contatti con vicini OSM o placeholder. Le posizioni di Chiesa e Municipio sono vincolate. Il gioco applica la stessa sagoma corretta al disegno e alle collisioni; il file OSM resta immutato. La mappa generale continua a rappresentare gli originali OSM.

**Misura del generatore:** 1.433 sagome toccano la fascia misurata; 1.321 ricevono un piccolo spostamento, 42 si liberano interamente. La somma degli indici di intrusione passa da 222.002 a 62.471 (unità quadratiche, non metri quadrati). Le altre sovrapposizioni non si risolvono senza deformare o spostare troppo un intero isolato: il passaggio sotto i tetti mantiene la rivelazione graduale della strada. Materiali dei singoli edifici non verificati fotograficamente.


### 2026-10-18 — Fix vecchie moto nel traffico e ingresso moto / Panda

Segnalazione utente: apparivano le moto disegnate col vecchio Canvas, mentre il pulsante diceva "SALTA IN SELLA" ma l'interazione poteva entrare nella Panda. Diagnosi: `drawCityCar(type===5)` mostrava il vecchio motociclo come skin di un'auto ordinaria, mentre HUD e tasto E selezionavano i veicoli con due algoritmi diversi. Anche lo scooter iniziale poteva essere collocato oltre il raggio effettivo di ingresso.

Nuova funzione comune `nearestEnterableVehicle` per touch/E/HUD: scelta per distanza con lieve priorità a una moto vicina (se un'auto è nettamente più vicina si entra in auto). `starterMotorcycleCandidates` propone un mezzo presso la partenza, preferendo la carreggiata opposta alla Panda e rispettando `carBlocked`/collisioni (non forzare spawn attraversando edifici). Rimosso il vecchio tipo=5 da `drawCityCar`; le moto attuali usano soltanto `drawMotorcycle`. I veicoli non moto parcheggiati e nel traffico assegnano uno sprite PNG esistente: fallback procedurale solo in caso di mancato caricamento. Collisioni e guida invariati. Bust cache `city-art.mjs?v=124` e `game.mjs?v=124`. Verifica finale su Android necessaria per confermare la posizione dello scooter iniziale.

### 2026-10-18 — Routine NPC, marciapiedi dei sensi unici e moto diffuse

Tre profili pedonali deterministici (pendolare, commissioni, passeggio) variano velocità, scelta agli incroci e brevi soste sul marciapiede. Tre profili veicolari (attraversamento, locale, consegne) pesano diversamente proseguimenti e svolte, senza soste casuali in carreggiata. I pedoni sul verso inverso di una strada a senso unico ora usano il marciapiede fisico anziché la mezzeria; un raccordo non percorribile non causa più un salto al centro della strada. I pedoni bloccati possono ripartire altrove soltanto fuori inquadratura, con controllo collisioni.

Le moto NPC in movimento sono 35 su 140 veicoli generati (prima circa 12), assegnate prima dello spawn per usare la loro impronta stretta anche nelle collisioni; il parcheggio sceglie una moto ogni tre veicoli idonei anziché ogni otto. Restano gli stessi 16 sprite PNG e gli stessi percorsi OSM. I pedoni generati scendono da 190 a 170. In una simulazione locale di 60 secondi, 170 pedoni non erano sulla mezzeria dei propri segmenti stradali e non c'erano sovrapposizioni tra i 310 NPC; alcuni ingorghi restano possibili. Cache `game.mjs?v=125`, `roads.mjs?v=125`, `traffic-collision.mjs?v=125`. Verifica del gioco pubblicato e degli FPS Android ancora necessaria.


### 2026-10-18 — Moto parcheggiate realmente più diffuse e riconoscibili

**Prima:** nel parcheggio ordinario solo `k%8===3` consentiva una moto, collegata ai piazzamenti auto; le poche silhouette delle due ruote erano difficili da distinguere sul telefono. **Adesso:** `motorcycle-parking.mjs` seleziona segmenti stradali OSM reali (un campione vicino alla partenza, poi distribuzione nel territorio), e propone pose su entrambi i bordi. Ogni nuovo motociclo parcheggiato conserva il proprio modello/colore, non ha un NPC già seduto, e deve superare `carBlocked` e `vehiclesOverlap`. Obiettivo massimo di **34** moto nel passaggio dedicato e limite totale di **134** veicoli parcheggiati; quantità effettiva dipende dalle verifiche geometriche. I motocicli inseriti dalla fase auto rimangono disponibili.

Le moto hanno sprite leggermente più grandi (3,15×6,45 unità, sempre più piccoli delle auto) e cavalletto; a piedi, entro 19 unità, possono apparire massimo due etichette leggere `SCOOTER · E`/`MOTO · E` per chiarire che sono due ruote guidabili, senza sovrapporre testi a tutta la mappa. La selezione avviene con l'interazione E/touch già unificata; le auto, i guidatori AI e i controlli restano invariati. Cache `motorcycles.mjs?v=002`, modulo `motorcycle-parking.mjs?v=001`, pagina `game.mjs?v=126`. Verifiche CI e riscontro mobile indispensabili.


**Rifinitura etichette:** il suffisso `· E` compare soltanto sulla moto realmente selezionata dal sistema d'ingresso, evitando di suggerire un'azione fuori portata. Cache pagina `game.mjs?v=127`.

### 2026-10-18 — Trasparenza dei tetti anche per chi cammina

La rivelazione esistente ridisegnava la carreggiata sopra il tetto, ma lasciava opaco il disegno dell'edificio; inoltre considerava solo il personaggio del giocatore. Ora giocatore a piedi e pedoni NPC attivano la stessa attenuazione quando la loro posizione è su una strada o un marciapiede sotto la proiezione del tetto. La maschera agisce sul solo edificio interessato, ripristina terreno, soglia e superfici stradali/marciapiedi, quindi ridisegna il volume attenuato: l'attore resta visibile davanti al tetto. La transizione resta interpolata e il reveal auto conserva il raggio maggiore.

Test dedicati verificano target pedonali, maschera compositing e ordine del recupero della scena. Cache aggiornata a `roof-reveal.mjs?v=120` e `game.mjs?v=128`; test completi 134/134. Da verificare visivamente nella build pubblicata e su telefono.


### 2026-10-18 — Santa Maria delle Grazie: rimosso DEFINITIVAMENTE il vecchio disegno sotto il WebP

Chiesa OSM way 733703815: ora in `drawCityBuildings` si usa un **renderer esclusivo** che disegna soltanto il nuovo WebP trasparente (più la targhetta), PRIMA di qualsiasi estrusione o ombra. Il vecchio ramo procedurale della chiesa con cupola, campanile, cornici e tetto è stato **eliminato dal codice**, non semplicemente coperto. Nessuna parete 2.5D, ombra della sagoma di base, bordo di tetto o contorno di lotto generato può più comparire sotto l'immagine. Durante il caricamento non appare nemmeno un vecchio fallback Canvas; l'evento di caricamento dell'immagine invalida le tile statiche.

Il poligono OSM è conservato per collisioni, gioco e navigazione. Gli altri edifici, inclusa la Chiesa Maria SS. di Piedigrotta, mantengono il loro renderer precedente. Cache moduli `city-art.mjs?v=125` e pagina `game.mjs?v=130`. Controlli automatici e riscontro visivo mobile ancora da eseguire.

### 2026-10-18 — Interni banca coerenti con GTA Melito dall'alto

**Problema segnalato:** la scena banca usava un disegno a pieno schermo con protagonista formato da rettangoli, scala di rendering diversa e arredamento da RPG; l'esplorazione esterna e quella interna sembravano due giochi distinti.

**Intervento:** in `bank-interior.mjs` la banca è ora una piccola stanza fisica in **unità mondo** (100×64), vista dall'alto con pareti perimetrali basse in sezione, pavimento urbano cemento/pietra, banconi con postazioni, sportelli, vetri, ATM, sedute, separatori fila e dettagli di materiale/ombra ispirati alla stessa palette della città. La scala uniforme `bankInteriorViewport` adatta la stanza a schermi desktop e smartphone; la routine conserva la trasformazione di pixel density impostata da `game.mjs`, evitando di sovrascriverla come prima.

**Personaggio:** viene chiamato direttamente `drawCityPlayer` già usato **fuori**, quindi stessa felpa rossa, sprite animato, orientamento e fallback. Gli impiegati dietro il banco riutilizzano `drawPedestrianSprite` degli NPC esterni, se caricato. In `game.mjs` il player interno memorizza angolo e movimento, sincronizza la camminata e rispetta semplici collisioni contro bancone, ATM, sedute e pareti; l'uscita E/touch torna alla posizione esterna precedente.

**Verifiche:** eseguita verifica funzionale in JavaScript delle funzioni di viewport, percorso fino al bancone, disegno della scena e chiamata condivisa allo sprite: nessuna eccezione, trasformazione compatta preservata. Aggiunti test `bank-interior.test.mjs` e aggiornate le versioni di cache (pagina `game.mjs?v=131`, interno `bank-interior.mjs?v=002`; aggiornato anche `church-webp.test.mjs`). **Suite Node 22 completa e verifica visiva in browser/telefono non eseguite in questa sessione**: necessaria ispezione finale del deploy. Oggetti e arredi sono inventati per gioco, non riproduzione reale di una banca specifica.

**Prossimi passi:** aprire ingresso banca su telefono/desktop, verificare il protagonista e il percorso fino allo sportello, qualità visiva allo zoom e assenza di compenetrazioni con i mobili; applicare lo stesso standard a futuri interni. Regola permanente introdotta in `AGENTS.md`.

**Allineamento velocità:** `stepBankInteriorPlayer` ora usa precisamente `WALK_SPEED=8.5` e `RUN_SPEED=13` unità di mondo al secondo da `driving-controls.mjs` sia in X sia in Y, convertendole nelle coordinate normalizzate della stanza 100×64. Evita accelerazioni e proporzioni diverse entrando nell'edificio. Aggiunto controllo numerico nel test dedicato.

### 2026-10-18 — Banca esplorabile con telecamera GTA e zoom pedonale +8%

**Fatto:** eliminato definitivamente il fit-to-screen che mostrava tutta la banca. La nuova camera interna segue il protagonista in unità mondo, con lo stesso zoom del pedone esterno e moltiplicatore **1.08**; l'inquadratura è limitata agli estremi della stanza, adattandosi a rotazione e dimensioni del display. Il movimento, gli sprite, la camera della città, le collisioni esterne e l'uscita dalla banca restano indipendenti e invariati.

**Spazio ingrandito:** da 100×64 a 160×120 unità con vestibolo d'ingresso, pavimentazione urbana, sedute, segnaletica, bacheca e accesso centrale all'atrio degli sportelli. Il nucleo esistente della banca è traslato di (30,14) senza ingrandire artificiosamente mobili e personaggi. Collisioni aggiornate con muri, arredi e passaggio centrale percorribile. Il protagonista entra nella lobby e avanza per scoprire l'ambiente. Scene e arredi rimangono artistici, senza pretendere fedeltà a una banca reale.

**File:** `bank-interior.mjs`, `game.mjs`, `bank-interior.test.mjs`, `index.html`, `church-webp.test.mjs`, `AGENTS.md`; versioni cache aggiornate a `game.mjs?v=132`, `bank-interior.mjs?v=003`.

**Verifica eseguita:** smoke test JavaScript delle funzioni effettive (sintassi del renderer e del motore, rendering con sprite esterno condiviso, viewport 780×340/390×590/1250×750/1920×1100, zoom 7.128× da base 6.6×, tracking con easing, collisioni, ingresso tramite porta e cammino fino allo sportello) superato. Aggiunti test automatici per questi scenari. **Suite Node completa, test di browser e screenshot su Android non eseguiti in questa sessione**; verificare dopo deploy.

### 2026-10-19 — Volante touch reale e tre comandi guida

**UI:** quando il protagonista sale in auto o in moto, sul lato sinistro la levetta a piedi lascia spazio a un volante grafico (cerchio/razze/mozzo) che **ruota realmente seguendo il trascinamento circolare del dito**; il volante ruota in un verso o nell'altro, ha un limite di corsa e torna gradualmente al centro quando viene rilasciato. A destra compare il comando **ACCELERA** sopra **FRENO**: la disposizione verticale permette multitouch contemporaneo con la mano sinistra sul volante. Il pulsante SALI/SCENDI resta disponibile. A piedi (anche negli interni) compaiono di nuovo levetta e CORRI, senza i pedali. Tastiera PC: A/D sterzo, W acceleratore, S retromarcia, Spazio freno a mano.

**Fisica:** eliminate le accelerazioni implicite dalla sterzata su auto e moto: girare da fermo non mette in moto il veicolo. Introdotto freno di servizio separato dall'acceleratore e dal freno a mano, con decelerazione progressiva e arresto senza retromarcia automatica. Restano limiti di velocità, assistenza alla svolta, collisioni, auto/moto e telecamera esistenti.

**File:** `index.html` (volante SVG e pedali CSS), `game.mjs` (pointer capture del volante, multitouch dei pedali, commutazione dei controlli e input separati), nuovo `steering-wheel.mjs`, `driving-controls.mjs`, `motorcycles.mjs`, test dedicati e controlli cache `game.mjs?v=135`, `driving-controls.mjs?v=095`, `motorcycles.mjs?v=003`, `steering-wheel.mjs?v=001`.

**Verifica:** smoke test funzionale su codice GitHub superato per sintassi dei quattro moduli, volante CW/CCW, ritorno al centro, accelerazione indipendente su auto/moto, freno attivo anche tenendo il gas, presenza e ordine dei pulsanti e versioni cache. Aggiunti/aggiornati test automatici Node. **Suite completa GitHub Actions, screenshot in browser e prova touch Android non eseguiti** in questa sessione; restano verifiche necessarie.


### 2026-10-19 — Radio in auto: interfaccia di prova, non nuova grafica della città

Aggiunta una barretta compatta nella parte superiore della scena, visibile solo quando il giocatore guida un'automobile, con stazione, stato, comandi ◀/▶/▶▶ e collegamento esterno ↗. CSS mobile landscape coerente con palette e controlli esistenti; nessun cambio a edifici, strada, mappe, veicoli o sprite. Il sintonizzatore `car-radio.mjs` tenta di ricevere sei stream HTTPS reali senza proxy o audio locale. Controlli DOM e parsing JavaScript verificati staticamente; **nessuna cattura browser/Android né ascolto dal vivo compiuti**. Possibili collisioni con altre sovrimpressioni su viewport particolarmente strette ancora da controllare.

### 2026-10-19 — Correzione volante invisibile dopo salita sul veicolo (v137)

**Bug riprodotto via codice:** la logica `updateHud()` modificava le classi `driving` e `interior` usando `$('stage')`, ma il contenitore principale era `<div class="stage">` senza `id="stage"`. Il lookup restituiva `null`, quindi il CSS non nascondeva il joystick né mostrava il volante. La levetta restava disegnata ma non guidava l'auto perché la nuova fisica legge esclusivamente volante e pedali.

**Modifiche:** `index.html` assegna `id="stage"` all'elemento di scena; `game.mjs` usa un fallback a `document.querySelector('.stage')` se necessario, ripristina la levetta al centro quando si passa da camminata a guida e conserva entrambe le classi `driving` / `interior`. La pagina ora carica `game.mjs?v=137` senza rimuovere la radio introdotta nella precedente versione 136.

**Verifiche:** eseguita in JavaScript la funzione reale `updateHud()` prelevata da `game.mjs` con DOM finto costruito dagli ID HTML: salendo in auto, `stage.driving=true` e `controls.driving=true`; scendendo, entrambe false; in banca, `stage.interior=true` e driving false. Aggiunte regressioni `steering-wheel.test.mjs` sulla corrispondenza ID/lookup e transizioni in esecuzione. Allineati i test statici alla pagina v137. **Non eseguiti screenshot reali, prova Android né suite Node completa**.

### 2026-10-19 — Pedali più piccoli e retromarcia touch (v138)

**Interfaccia:** ridotti i tre comandi a destra in landscape: pulsanti di guida da `clamp(67px,14vw,84px)` per `clamp(61px,13vw,76px)` a `clamp(56px,12vw,72px)` per `clamp(50px,11vw,64px)`; ridotto anche il tasto azione e gli spazi tra i comandi. Terzo tasto color sabbia **RETRO**, sotto **FRENO**, con feedback di pressione. Volante a sinistra invariato, come pure joystick/CORRI a piedi, layout della radio e pausa.

**Funzionamento:** nuovo stato `pressed.reverse` e relativo binding pointer/touch con cattura puntatore in `game.mjs`, azzerato quando si scende, si entra in pausa o si perde il focus. `driveAxes()` trasmette velocità richiesta negativa con RETRO tenuto premuto; i comandi ACCELERA e RETRO contemporanei si annullano senza azionare il freno. Le funzioni di guida esistenti `stepDriving()` e `stepMotorcycle()` gestiscono già accelerazione inversa, limite di retromarcia e frenata prima di invertire il moto.

**Verifiche:** eseguito smoke test JavaScript su moduli reali: sintassi, input e funzionamento da fermo; tenendo RETRO l'auto raggiunge -12 unità/s e la moto -4; gestione tasti opposti, tasto S su tastiera, freno e lettura layout/cache `game.mjs?v=138` superati. Aggiunti test automatici in `steering-wheel.test.mjs` e aggiornati i controlli versione delle altre suite. **Suite Node completa, browser reale e test multitouch Android non eseguiti**.

### 2026-10-19 — Portoni e porte dei negozi per gli NPC (Q03)

**Grafica:** nuovi portoni disegnati sul filo del muro, leggibili dall'alto con qualsiasi orientamento della facciata: gradino in piperno grigio scuro sul marciapiede, vano del portone in legno marrone (vetro azzurro per i negozi OSM) e stipiti in pietra chiara. Quando qualcuno entra o esce il portone resta aperto 1,4 s: vano scuro e luce calda sul gradino. Sulle facciate ben esposte (`facadeExposure ≥ 0,45`) c'è anche il portone in alzato. Disegno in `building-doors.mjs`, dopo gli edifici e prima delle persone.

**Fatti e ipotesi:** i portoni di casa sono inventati; per 3 negozi con nome OSM (Le fantasie di Andrea, I Grimaldi's BARBER, L'Angolo Dei Colori) la porta è stimata sulla facciata dietro l'insegna, non rilevata.

**Verifiche:** screenshot Chrome headless su desktop 1280×720 e telefono 844×390 in orizzontale: porte visibili lungo Via Roma, residente che esce dalla porta aperta, porte a vetro nel gruppo di negozi a sud. Allo zoom a piedi una porta è larga circa 10 px: si vede ma è discreta. Non provato su un telefono reale.

### 2026-10-19 — Giorno, tramonto, notte e alba (Q04)

**Grafica:** sopra la città, a partire dalle 17:10, scende un velo graduale: dorato verso le 18:30, viola al crepuscolo, blu notte traslucido dalle 21:00 (opacità massima 0,58, la città resta leggibile), viola-arancio all'alba. Di notte compaiono pozze di luce calda sotto i lampioni già disegnati e le loro lampadine. Le finestre accese sono le stesse vetrate delle facciate, colorate giallo caldo e accese una alla volta. Le auto e le moto in movimento hanno fari bianchi con cono sulla strada e fanali rossi; le porte aperte della Q03 proiettano luce sul gradino. Il velo passa sotto i suggerimenti e sopra tutto il resto, minimappa esclusa.

**Verifiche:** foto Chrome headless dallo stesso punto di Via Roma alle 12:00, 18:40, 19:30, 21:30, 23:30 e 05:50, su PC e telefono in orizzontale; foto dei fari su un'auto del traffico alle 22:00. Di giorno l'immagine resta identica a prima (confronto pixel). Non provato su un telefono reale.

### 2026-10-19 — Oggetti perduti e fumetti (Q05)

**Grafica:** quattro piccole icone in pixel art per gli oggetti a terra (chiavi dorate, portafoglio marrone, busta bianca con manici verdi, cellulare con schermo azzurro), con un cerchio giallo pulsante quando il giocatore è vicino; l'oggetto raccolto si vede accanto al protagonista. Fumetti chiari col bordo scuro e la punta sopra la testa del personaggio, testo monospace come le altre etichette, visibili 3,5 s e leggibili anche di notte.

**Verifiche:** foto Chrome headless dell'oggetto a terra, di «La spesa?!», di «Preso!» e di «Grazie assai!» con «+5 €»; foto sul telefono in orizzontale. Non provato su un telefono reale.

### 2026-10-19 — Bidoni della differenziata e paletti (Q07)

**Grafica:** bidoni carrellati visti dall'alto (coperchio colorato blu, giallo, verde o grigio, maniglia scura, ombra), in gruppi sul marciapiede; ribaltati diventano più lunghi, col coperchio aperto e un po' di carta per terra. Paletti in ghisa scura con testa chiara a cupola e ombra, sul bordo del marciapiede vicino agli incroci.

**Verifiche:** foto Chrome headless di un gruppo di bidoni su Via Roma, di un bidone ribaltato e dei paletti a un angolo; i paletti sono piccoli (circa 4 px allo zoom a piedi) ma leggibili. Non provato su un telefono reale.

### 2026-10-19 — Nuvole, pioggia, asfalto bagnato e ombrelli (Q08)

**Grafica:** cielo coperto con un velo grigio-azzurro e grandi ombre di nuvole che scorrono; pioggia con gocce oblique sottili; asfalto più scuro e bluastro solo sulle carreggiate, ritagliato attorno a muri e tetti sollevati; pozzanghere ellittiche che riflettono il cielo (bordo scuro, specchio grigio-azzurro, riflesso chiaro) con cerchi delle gocce animati; ombrelli colorati dall'alto sopra la maggior parte dei pedoni; di notte i lampioni lasciano una striscia calda riflessa sul bagnato.

**Verifiche:** foto Chrome headless dallo stesso punto di Via Roma con sereno, nuvoloso e pioggia alle 11:00 e pioggia alle 22:00, su PC e telefono; primo piano di una pozzanghera; confronto ravvicinato sereno/pioggia con i tetti non toccati dal bagnato. Non provato su un telefono reale.

### 2026-10-19 — Ape Car azzurra, furgoncino FRITTI e friggitore in bianco

**Stile:** tre sprite originali **PNG indicizzati con trasparenza tRNS**, non immagini con sfondo opaco: `assets/vehicles/ape-car-top.png` (88×132, azzurro/cassone crema; motrice corta con frontale piccolo), `assets/vehicles/furgone-fritti-top.png` (88×132, crema/rosso con tenda a righe, insegna fantasy «FRITTI» e sfiato cucina), `assets/people/friggitore-bianco-4dir-4frames-24x40.png` (96×160, 4 orientamenti × 4 frame con grembiule, camice e berretto bianchi, pantaloni scuri). Vista dall'alto, davanti rivolto verso −Y come Panda/Punto; silhouette e pixel calibrati alla precedente palette urbana. Asset disegnati ex novo, non basati su immagini di attività reali, loghi o marchi di terzi.

**Integrazione:** `car-sprites.mjs` registra i due skin come mezzi di traffico e parcheggi con scala rispettivamente 4,1×6,25 e 5,65×8,65 world unit; `friggitore-sprites.mjs` espone caricamento/animazione con le stesse coordinate e scala degli NPC. `city-art.mjs` disegna l'operatore per un pedone reale (flag `isFryer`) e `game.mjs` lo sceglie deterministiciamente fra i pedoni vicini al furgone, mantenendone l'AI. Nel passaggio parcheggi esistenti lo skin appare ai posti k=2 (Ape) e k=5 (furgone), se i candidati strada sono percorribili; i due modelli sono anche nel sorteggio del traffico AI. Non alterati spawn Panda iniziale, numeri NPC, mappe o collisioni di base. Game `v152`, car-sprites `v107`, city-art `v128`.

**Verifiche:** controllata trasparenza e dimensioni delle tre PNG, incluse firme git blob corrispondenti agli originali; immagini visualizzate e confronto stilistico con la Panda e la sheet dei pedoni originali. Smoke test JavaScript su moduli effettivi: parser di game/city-art, presenza degli skin in registro di traffico e disegno Canvas senza eccezioni, scaling/rotazione coerenti, walker NPC integrato e cache v152, **superato**. Creato test `friggitoria-art.test.mjs`. **Non eseguiti suite Node completa, screenshot nel gioco dal browser né prova Android**.

**Non ancora Q16/Q17 completate:** per Ape serve fisica vera a tre ruote, colori aggiuntivi e controllo collisioni/guida su strada; per furgone servono sosta autorizzata dalle geometrie, NPC fermo in vendita e acquisti/interazioni (quando previsto dall'economia), oltre a collaudi reali. Lasciare le due Q aperte per il collaboratore che deve completarle in ordine.

### 2026-10-19 — ChatGPT/GitHub — Foglio 4×4 di 16 veicoli: Ape Car e ambulanti
- **Asset:** tavola ImageGen originale archiviata come `assets/vehicles/sources/ape-food-16-master.png` (1244×1265, RGBA); sedici ritagli con crop e alpha controllati, impaginati in un atlante indicizzato PNG 224×256 (celle 56×64, 96 colori, 19.999 byte) in `assets/vehicles/ape-food-16-rgba.png`.
- **Varianti:** prime 8 Ape (azzurro e verde rugginoso; vuoto, ferro, ortofrutta, pesce), ultime 8 furgoncini ambulanti (zeppole/panzerotti, pere/musso, panini, hot dog, cornetti, pizza a portafoglio, pizzette fritte, misto).
- **Integrazione:** `car-sprites.mjs` registra 16 ID e un atlas condiviso, `game.mjs` li usa nel repertorio dei parcheggi (apertura tende visibile solo in sosta); **traffico in marcia invariato**, fisica, numero NPC e campagne invariati. `index.html` game v153, import car-sprites v108; aggiunto `market-vehicles.test.mjs`, aggiornate asserzioni in due test esistenti.
- **Istruzioni:** PIXEL_ART_MODUS.md e VEHICLE_ART_GUIDE.md ora prescrivono come default uno sheet 4×4 da 16 (8+8), con esempi cliccabili.
- **Controlli locali effettivi:** verificata con PIL la presenza dell'alpha nei 16 ritagli e l'anteprima pixel a zoom; non risultano clip evidenti nello sheet compresso. **Suite Node completa, visita al browser e test su Android non eseguiti in questa sessione:** verificare CI/deploy successivi.
- **Limite artistico:** il banco grafico 'o pere e 'o musso ricorda ancora frutti di mare/fritti e non riproduce in modo convincente la specialità tradizionale; sostituire la variante mantenendo indice 9 quando possibile.
- **TODO:** Q16/Q17 non sono completate; restano fisica triciclo, soste commerciali/routine, vera modalità di marcia con tende chiuse e collaudo mobile.

### 2026-10-20 — Quattro NPC professionali, tavola 384×160
Nuovi sprite top-down 2.5D: friggitore in camice bianco, vigile urbano, lavavetri al semaforo (secchio blu e spazzola), contrabbandiere con borsello sotto l'ascella. Layout dei personaggi [4 × 4 frame per ciascuno] distribuito in 16 colonne × 4 righe, celle 24×40, RGBA trasparente. Pubblicati i quattro ritagli singoli 96×160. Leggibilità verificata con anteprima zoom nearest-neighbor, trasparenza/celle/dimensioni controllate. **Solo libreria di asset, non visualizzati ancora nel gioco**; non confondere con il vecchio friggitore già presente.


### 2026-10-20 — Strada viva: Ape, food truck e mestieri NPC (branch di sviluppo)
Aggiunto il renderer per l'atlante originale `npc-mestieri-4chars-4dir-4frames-24x40.png` (friggitore, vigile, lavavetri, contrabbandiere), collegato agli attori reali della simulazione; gli asset `ape-food-16-rgba.png` già presenti alimentano Ape AI senza tendalino aperto e food truck in sosta. Nuovi ancoraggi commerciali deterministici sulla cartografia, con controlli geometrici; non sono esercizi commerciali o semafori verificati sul campo. Il numero di passanti comuni è stato ridotto mentre aumenta la varietà delle mansioni. Aggiornato `index.html` a `game.mjs?v=154`, import di `city-art.mjs?v=129` e `roads.mjs?v=146`. Non sono state prodotte fotografie/screenshot prima-dopo né controlli manuali di rendering browser/telefono in questa sessione: per completare il QA occorre aprire il gioco e confrontare i cinque siti previsti sul percorso. 

### 2026-10-20 — Claude (account `ilconsulentelogistico-hue`) — BF02 fascia di sosta tra corsia e marciapiede
- **Cosa si vede:** lungo le strade carrabili compare una fascia di sosta continua con stalli a linee bianche (sosta libera) lunghi 7,2 m. Sulle strade larghe (primarie, trunk, secondarie, terziarie) la fascia sta tutta sull'asfalto accanto al bordo; sulle residenziali entra nel bordo chiaro del marciapiede come un **golfo di sosta**, con il cordolo che ne segue il contorno e raccordi inclinati alle estremità. Le auto, gli scooter e i food truck in sosta stanno dentro gli stalli: non più a cavallo della corsia né sul marciapiede.
- **Dove non c'è posto** (strade di servizio, vicoli, piazze fatte di tratti cortissimi, accanto a incroci e strisce, davanti a negozi e banca) la fascia non viene disegnata e non ci sono veicoli in sosta.
- **Livelli:** la fascia è dipinta nelle tessere statiche subito dopo l'asfalto e prima di edifici e tetti, quindi non copre mai un tetto; viene ridipinta anche nel riquadro di "tetto svelato". Nessun asset PNG nuovo: solo forme e linee nel canvas.
- **Prova visiva (Chrome headless, 1280×720, zoom a piedi):** A/B prima/dopo su Via Roma (partenza: la Panda iniziale prima stava 1,36 m dentro la corsia, ora è nello stallo con lo scooter accanto), Piazza Santo Stefano, Corso Europa e una residenziale (Via Papa Giovanni XXIII). Confronto affiancato allegato alla PR.
- **Limiti:** la sagoma disegnata delle auto (≈4,5–5 m) resta più larga della sagoma di collisione (3,4 m), quindi sulle residenziali un'auto in sosta e una che passa possono sfiorarsi graficamente senza toccarsi; non provato su telefono reale.
### 2026-10-20 — Friggitore al banco del suo furgone (BF04)

**Grafica:** il friggitore in camice bianco sta ora subito fuori dalla tendina a strisce del suo food truck, a metà del banco e rivolto verso di esso; i furgoni sono girati in modo che banco e tendina guardino il marciapiede su entrambi i lati della strada. Prima il friggitore compariva a 8–9 m, spesso dietro il furgone o dal lato della carreggiata.

**Verifiche:** foto Chrome headless ravvicinate prima/dopo di tutti e 5 i furgoni (Piazza Santo Stefano, Piazza Immacolata, Corso Europa, Largo Cinque Via, Via Roma) e misure nel gioco reale. Non provato su un telefono reale.
