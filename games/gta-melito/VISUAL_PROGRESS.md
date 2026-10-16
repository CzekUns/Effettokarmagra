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
