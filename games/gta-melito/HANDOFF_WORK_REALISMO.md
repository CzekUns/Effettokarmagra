# HANDOFF PER CHATGPT WORK — GTA MELITO: REALISMO GRAFICO PIXEL ART
**Aggiornato il 17 ottobre 2026.** Repository: `CzekUns/Effettokarmagra`, branch `main`. Ambito esclusivo: `games/gta-melito/`.

## 1. Obiettivo dell'utente

Il gioco deve apparire **come Melito di Napoli**, non come una città generica: riconoscibili la fitta edificazione, il centro intorno a Piazza Santo Stefano, le strade, il Municipio, i quartieri residenziali/commerciali, i tetti e le proporzioni. L'estetica deve restare **pixel art originale dall'alto, 2.5D, ispirata alla leggibilità degli arcade GTA 1/2**; non serve fotorealismo 3D né copiare artwork Rockstar.

La priorità è **l'impatto visivo REALE sul gioco**: confrontare luoghi identificati e scene di gioco, migliorare concretamente geometrie di dettaglio, tetti, facciate, materiali, ombre, elementi urbani e caratteristiche locali. Il committente è sensibile ai falsi completamenti: non dire “edifici verificati” se sono solo generati proceduralmente; documentare che cosa è osservato, cosa è approssimato e perché.

**Non fermarti a pianificazione/documentazione.** Questo file è l'handoff di partenza: usalo per modificare i sorgenti, realizzare screenshot prima/dopo, testare e consegnare commit.

## 2. Stato verificato della versione 0.7.0

Sito: https://czekuns.github.io/Effettokarmagra/games/gta-melito/?v=070

- **2.056 edifici mappati OSM**, con ID e poligoni in `data/melito-map.json`; rete stradale e confine comunale reali ma il database è incompleto. L'area cartografica misura ~2.146 × 2.925 unità di gioco.
- **475 edifici aggiuntivi sintetici**, generati deterministicamente in `urban-infill.mjs`. Hanno ID negativi e sono placeholder per dare densità: **non sono immobili rilevati**. Le collisioni attualmente li considerano, quindi controllare accessi, strade e missioni.
- **2.531 edifici disegnati volumetricamente**, grazie a `building-volume.mjs` e `city-art.mjs`. Ogni impronta riceve estrusione, pareti laterali, separazioni fra piani, tetto e ombra; l'altezza minima è stilizzata. La geometria OSM non viene alterata.
- Quasi tutti i materiali e i piani sono *ipotetici*: `survey/town-visuals.json` contiene i 2.056 profili grafici del paese, generati da `survey/town-generator.mjs`. **Solo un edificio ha associazione fotografica registrata**: Chiesa di Santa Maria delle Grazie, way OSM **733703815**, in `survey/piazza-santo-stefano.json`. I restanti 2.055 non sono verificati fotograficamente.
- Punto notevole Municipio, building way **733703600**. Altra chiesa OSM: `Chiesa Maria SS. di Piedigrotta`. La missione e la mappa includono Piazza Santo Stefano, Via Roma, Piazza Immacolata, Corso Europa e altri POI.
- Zoom automatico già richiesto e implementato in `camera-zoom.mjs`: a piedi iniziale 5×, corsa ~4,65×, auto ferma ~3,35×, auto veloce ~1,87×, transizione fluida. Non sostituire con telecamera fissa.
- Carreggiate ampliate stilisticamente in `road-widths.mjs`; pulsante **CONFRONTA CON PRIMA** per A/B (vedi `game.mjs`, `index.html`).
- Terreno corretto da verde generico a base prevalentemente urbana; arredo artificiale (alberi radi, panchine, lampioni, cassonetti e scooter). **Né prati né piazzali sono ancora realmente georeferenziati**.
- CI ultima versione nota: **53 test** passati; GitHub Pages deploy completato. Test: `node --test games/gta-melito/*.test.mjs games/gta-melito/survey/*.test.mjs`. Non usare il numero 53 come prova che le nuove modifiche siano corrette: rieseguire.

**Limitazione fondamentale:** “100% edificio modellato” significa solo una *prima rappresentazione artistica*, non una scansione fotografica di Melito. Non spacciare i 467 placeholder per dati ufficiali.

## 3. File e architettura da capire prima di modificare

| Percorso (relativo a `games/gta-melito/`) | Funzione |
| --- | --- |
| `index.html` | Shell dell'arcade, controlli touch/PC, HUD, overlay missioni, barra confronto strade. |
| `game.mjs` | Bootstrap, fetch mappa + survey, stato, scena Canvas, render order, zoom, collisioni, camera, AI e missioni. |
| `city-art.mjs` | **Rendering visivo principale**: ground, strade, tetti, estrusioni, ombre, finestre, facciate, personaggi, auto. È il primo punto da studiare. |
| `building-volume.mjs` | Calcolo estrusione e lati visibili (attenzione ai poligoni CW/CCW). |
| `urban-infill.mjs` | Placeholder nei vuoti urbani. Deterministico ma NON verifica la presenza reale. |
| `visuals.mjs`, `storefronts.mjs` | Arredo, attraversamenti, insegne, props legati a POI OSM. |
| `roads.mjs`, `road-widths.mjs` | Grafo e larghezze visive, traffico. Non rompere carreggiate/collisioni. |
| `camera-zoom.mjs` | Zoom adattivo a piedi/in auto/in corsa. |
| `campaign.mjs`, `landmark-art.mjs` | Missioni e punti notevoli / segnaletica: mantenere giocabili. |
| `data/melito-map.json` | Snapshot OSM: geometrie, strade, edifici, POI, proiezione. Non sostituire con dati inventati. |
| `survey/building-register.json` | Registro di 2.056 edifici per ID OSM, coordinate e settori. |
| `survey/town-visuals.json`, `survey/town-generator.mjs` | Profili grafici di tutti gli edifici; **modelli** di stile, non rilievi fotografici. |
| `survey/piazza-santo-stefano.json` | 58 schede nel primo anello, di cui 1 identificata in foto. |
| `survey/visual-profiles.mjs` | Applica override per edificio; override più documentato deve prevalere sul modello generico. |
| `survey/index.html`, `survey/viewer.mjs` | Visualizzatore con collegamenti a OSM/Google Maps/Street View per ciascun edificio. |
| `*.test.mjs`, `survey/*.test.mjs` | Test Node nativi. |
| `../../.github/workflows/gta-melito-checks.yml` | Validazione CI Node 22. |
| `VISUAL_PROGRESS.md` | Registro di avanzamento tra le sessioni Work: aggiornarlo dopo ogni tranche. |

**Importante:** la pagina è servita staticamente da GitHub Pages; i moduli ES sono caricati con query string versionate (es. `game.mjs?v=070`, `city-art.mjs?v=070`). Se aggiorni moduli, **aumenta le versioni di cache** su HTML/import coerentemente: altrimenti sul telefono la vecchia grafica può sembrare identica alla nuova. Documenta commit e deployment.

## 4. Direzione artistica desiderata

- **Pixel art leggibile 2.5D**, toni della Campania urbana: intonaci crema/ocra/grigio/cemento, mattoni e tegole dove appropriati, balconi metallici, ringhiere, tende da sole, serrande commerciali, insegne, condizionatori, terrazzi con impianti, lampioni, parcheggi e scooter. Sono esempi *possibili*: collegali ai luoghi osservati quando vuoi affermare fedeltà reale.
- **Densità**: Melito è prevalentemente urbana. I vuoti non sono automaticamente prati. Pavimentazioni, cortili, muretti, confini di isolato e parcheggi migliorano l'aspetto, ma va evitato di chiudere percorsi reali o riempire spazi pubblici importanti.
- **Varietà controllata**: edifici antichi del centro, palazzine residenziali anni diversi, capannoni, negozi al piano strada, cortili. Evita la variabilità casuale ad ogni refresh: tutte le variazioni procedurali devono essere stabili per ID/coordinate.
- **Volumi e prospettiva**: nessuna sagoma OSM o placeholder principale deve tornare piatta. Coerenza luce/ombre, profondità, marcapiani, finestre e occlusioni, anche con zoom 5× e in auto a zoom inferiore. Non usare facciate con finestre ripetute quando nella realtà sono muri ciechi riconoscibili.
- **Proporzioni**: l'utente ha già segnalato strade troppo strette e palazzi piatti. Guarda le proporzioni di strade, auto, persone, altezze, marciapiedi e fiancate. Evita di correggere un problema estetico deformando tutta la geometria cartografica.
- **Prestazioni**: Android/mobile modesto; culling della viewport, caching di materiali/pattern ed evitare migliaia di disegni offscreen. Nessuna dipendenza obbligatoria da API con chiave o da grandi download per l'avvio del gioco.

## 5. Metodo di “somiglianza alla realtà”: fonti e livelli di certezza

Per ciascun luogo/edificio importante:
1. Ricava **identità e posizione** dalla mappa OSM e dal registro; usa il link per singolo way del visualizzatore.
2. Cerca fotografie lecite e identificabili del punto: siti istituzionali, patrimonio culturale, fotografie pubbliche con condizioni di riutilizzo chiare. Google Maps/Street View può servire a **osservare** se consentito, non a fare scraping, estrarre cartografia, copiare fotografie o incorporare immagini.
3. Prima di associare una foto a un ID, verifica edificio esatto (inquadratura, forma, ingressi e/o riferimento certo). Una foto “di Via Roma” da sola NON certifica il colore di un determinato palazzo.
4. Annotare `sourceUrl`, `dateAccessed`, caratteristica osservata, `confidence` e way OSM quando effettivamente verificato. Conservare nota “non verificato” quando non è possibile confermare. Le palette artistiche restano legittime purché non spacciate per fotorealistiche.
5. Traduci il dettaglio in **asset pixel art originale** o regola grafica: non riutilizzare screenshot/foto di terzi senza una licenza adeguata. Mantieni distinti i layer di cartografia, placeholder e arte.

Fonti già registrate:
- Comune, chiesa: https://comune.melito.na.it/vivere-il-comune/luoghi/chiesa-di-santa-maria-delle-grazie/
- FAI, chiesa: https://fondoambiente.it/luoghi/chiesa-di-santa-maria-delle-grazie-melito-di-napoli
- Catalogo nazionale beni culturali: https://catalogo.beniculturali.it/detail/ArchitecturalOrLandscapeHeritage/1500916499
- OSM copyright: https://www.openstreetmap.org/copyright
- Documenti e fonte primaria puntuale: `survey/piazza-santo-stefano.json`.
- **Non assumere** che i riferimenti fotografici corrispondano a un ID se il riscontro è insufficiente.

## 6. Ordine di realizzazione — implementare davvero

**Fase A — benchmark visivo e centro storico (PRIMA).** Apri gioco pubblicato in un browser mobile e desktop, osserva screenshot a zoom a piedi e zoom in auto, scegli 3–5 viste ripetibili. Prima iterazione: **Piazza Santo Stefano**, Santa Maria delle Grazie, contesto dei fabbricati circostanti, Via Roma e Municipio. Correggi tetti, ombre, fronti, colore stradale, negozi/serrande, densità, asset caratteristici. Conserva i riferimenti fotografici e crea un confronto **prima/dopo dalla stessa inquadratura**.

**Fase B — aree adiacenti.** Piazza Immacolata, Corso Europa, Largo Cinque Via, principali vie e incroci dei percorsi missione; caratteri architettonici osservati, leggibilità dei luoghi e continuità estetica.

**Fase C — intero paese.** Percorri gli anelli `PSS-R01` … `PSS-R07` disponibili in `survey/town-visuals.json`, poi i settori S001…S034. Usa *regole di stile per quartiere e tipologia* con override per edifici davvero documentati, mantenendo 2.056 ID OSM. Rivedi infill/placeholder che cadono in parcheggi, cortili, piazze o strade e quando possibile sostituiscili con dati pubblici appropriati. Non inventare palazzi spacciandoli per certi.

**Fase D — rifinitura grafica.** Palette uniforme, illuminazione unica, leggibilità vetture/pedoni, vegetazione solo quando pertinente, arredo plausibile, materiali/texture a scala coerente. Ottimizzazione rendering/culling per PC e Android. Conserva controlli e missioni.

Non richiedere autorizzazione dopo ogni sottoattività: **consegna iterazioni funzionanti e continua** entro la sessione Work. Preferire miglioramenti visibili a lunghe riscritture di documentazione.

## 7. Definizione di “completato” e QA

Minimi di ogni tranche:
- [ ] Una zona realmente riconoscibile e comparata a fonti attendibili (quando disponibili), non solo rumore procedurale aggiunto.
- [ ] Screenshot **prima/dopo** alla **stessa inquadratura** e indicazione della zona; verificare sia a piedi che in auto.
- [ ] Niente tetti piatti nel senso di “solo sagome a terra”: ogni edificio conserva profondità e pareti leggibili; i tetti *fisicamente piatti* restano consentiti quando appropriati.
- [ ] Nessuna alterazione accidentale di poligoni/ID OSM, strade, punti missione e geometrie del player; placeholder dichiarati e coerenti con l'area.
- [ ] Test `node --test games/gta-melito/*.test.mjs games/gta-melito/survey/*.test.mjs` tutti verdi; verifiche visive indipendenti dai test.
- [ ] Test manuale su browser/telefono: camminata, corsa, accelerazione e frenata, ingresso/uscita auto, zoom adattivo, confronto larghezze, minimappa, missione iniziale e dialogo.
- [ ] Performance ragionevole: niente freeze all'avvio o durante il movimento; Canvas mobile utilizzabile.
- [ ] Commit GitHub + deploy Pages verificato, versione/caching allineati. Aggiornati `VISUAL_PROGRESS.md` e, se necessario, questo handoff.
- [ ] Dichiarazione chiara: edifici realmente fotografati/riconosciuti vs profili solo grafici.

Un **test automatico verde non certifica somiglianza con Melito**. Un risultato “centro migliorato” non equivale a “tutto il paese verificato”: dichiarare la copertura in modo accurato.

## 8. Output atteso da Work

Al termine della tua sessione, restituisci: URL giocabile, commit (o PR), cosa hai modificato sul serio, zone trattate, 2–4 prove visive prima/dopo, fonti osservate, esito test/deploy, e il prossimo gruppo di edifici/aree da verificare. **Non rispondere solo con un piano.**

Quando una singola facciata non è documentabile, continua a migliorare l'estetica generica usando gli ID OSM, ma etichetta quel risultato come *stilizzazione non verificata*.

## 9. Nota pratica sulla navigazione

- Gioco: https://czekuns.github.io/Effettokarmagra/games/gta-melito/
- Censimento cliccabile, con Maps/Street View: https://czekuns.github.io/Effettokarmagra/games/gta-melito/survey/
- Coordinate grafiche centro piazza (sistema locale della mappa): **(1096, 1150)**, raggio primo anello **190**. Il player nasce vicino a Via Roma.
- La mappa viene dal file statico `data/melito-map.json`; non serve ricaricare Overpass per ogni iterazione artistica.
- Per correggere un singolo edificio, controlla l'ordine di merge in `game.mjs`: **settore preliminare → modelli di tutta la città → override Piazza Santo Stefano**. L'override fotografico non deve essere sovrascritto da una palette casuale.
- Evita di alterare il contratto delle chiavi `p` (vertici alternati x,y), `id` OSM, `b.art`, `state.buildings`, `state.inferredBuildings` senza adattare tutti i moduli/indicizzazioni/collisioni.

**Priorità assoluta: l'utente deve aprire il gioco e riconoscere Melito in pixel art.**

## Riferimento esterno: GTAopen / open.mp

Il progetto [PatrickGTR/gta-open](https://github.com/PatrickGTR/gta-open) è una modalità multiplayer per open.mp ambientata a Los Santos e usa l'ambiente 3D già fornito da GTA San Andreas. Il suo sistema case registra ingressi, proprietari e ID degli interni; gli arredi sono oggetti selezionabili tramite model ID, mentre il mapping aggiunge oggetti in luoghi specifici. Questo è un riferimento per interazioni, interni e posizionamento di oggetti nel mondo 3D, **non** per generare o disegnare le facciate della città.

Per GTA Melito si può trasferire il principio di separare identità dell'edificio, dati d'interazione e oggetti posizionati. La resa esterna deve invece continuare a partire dalle impronte e dai tag OSM, usando override per way ID solo quando supportati da fonti verificabili. Non importare asset/modelli di GTA San Andreas né interpretare gli interni di GTAopen come rilievi degli edifici di Melito.
