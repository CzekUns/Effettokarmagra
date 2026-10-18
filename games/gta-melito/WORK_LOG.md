# GTA Melito — registro operativo e passaggi di mano

Questo registro è **obbligatorio** per chiunque intervenga in `games/gta-melito/`: sviluppatori, agenti AI, ChatGPT e Work. Va letto prima di riprendere il progetto e aggiornato **al termine di ogni sessione**, anche se la lavorazione è parziale. Conservare tutte le voci in ordine cronologico, aggiungendo le nuove **in fondo**.

Usare voci **brevi (indicativamente 5–10 righe)**, ma abbastanza precise da permettere a un altro operatore di continuare senza dover leggere le conversazioni precedenti. Il formato consigliato è:

```md
### AAAA-MM-GG — Operatore/strumento — Attività
- **Fatto:** cosa è stato effettivamente aggiunto, corretto o analizzato.
- **Come/dove:** metodo, scelte tecniche e percorsi dei file coinvolti.
- **Verifiche/stato:** test, screenshot, deploy eseguiti e relativo esito; oppure «non eseguiti».
- **Da fare:** prossime azioni, limiti, bug aperti e rischi di regressione.
- **Riferimenti:** commit/PR/branch/link utili, se disponibili.
```

**Regole pratiche:**
- Una voce per sessione/passaggio di mano, non una per ogni singola modifica o messaggio.
- Scrivere quello che si è davvero fatto, non dichiarare realizzate intenzioni o prove non verificate.
- Aggiornare il registro nello stesso commit del lavoro quando possibile; in caso di commit multipli, riassumere il risultato finale e indicare il riferimento.
- Non cancellare voci precedenti; annotare eventuali correzioni in una nuova voce.
- `VISUAL_PROGRESS.md` mantiene i dettagli delle modifiche grafiche; questo `WORK_LOG.md` raccoglie il **passaggio operativo per tutte le attività** (grafica, gameplay, AI, mappe, fisica, bug, prestazioni, documentazione).
- Leggere anche [`AGENTS.md`](./AGENTS.md), [`HANDOFF_WORK_REALISMO.md`](./HANDOFF_WORK_REALISMO.md) e le ultime voci di [`VISUAL_PROGRESS.md`](./VISUAL_PROGRESS.md) quando pertinenti.

---

### 2026-10-18 — ChatGPT/GitHub — Regola di handoff permanente
- **Fatto:** introdotto un obbligo di log per ogni sessione e un registro operativo separato da quello grafico.
- **Come/dove:** nuove istruzioni generali in `/AGENTS.md`; questo registro in `games/gta-melito/WORK_LOG.md`. Aggiornati anche `games/gta-melito/AGENTS.md` e `games/gta-melito/README.md`, che puntano al registro.
- **Verifiche/stato:** sola documentazione; test di gioco e screenshot non eseguiti; nessuna logica o asset modificato.
- **Da fare:** per il prossimo intervento leggere le istruzioni e gli ultimi aggiornamenti, lavorare sul compito richiesto, quindi aggiungere qui il riepilogo di consegna con i file e i test realmente toccati.
- **Riferimenti:** branch `main`, repository `CzekUns/Effettokarmagra`; commit generali `ba8660f`, creazione registro `5359afd`, istruzioni locali `b745fce`, README `082dec6`.

### 2026-10-18 — ChatGPT/GitHub — Interni banca uniformati allo stile GTA
- **Fatto:** ridisegnata la banca in pixel art urbana 2.5D dall'alto; stessi sprite/animazioni del protagonista e degli NPC esterni. Inserita regola permanente per tutti i futuri interni.
- **Come/dove:** `bank-interior.mjs` ora usa unità mondo, scala responsive, pavimento/materiali urbani, muri in sezione, sportelli/ATM/sedute e collisioni; `game.mjs` mantiene orientamento, animazione e movimento nello stesso sistema di coordinate, con WALK_SPEED/RUN_SPEED esterni. `AGENTS.md` aggiornato.
- **Verifiche/stato:** eseguito smoke test in JavaScript isolato: sintassi dei moduli principale/interno, velocità, collisioni bancone, viewport telefono/desktop, riuso `drawCityPlayer` e cache versioni, tutti superati. Aggiunti test automatici in `bank-interior.test.mjs`; la suite completa Node 22, screenshot e prova sul deploy reale NON sono stati eseguiti qui e restano da verificare.
- **Da fare:** entrare in banca nel browser PC e su Android, verificare qualità del cutaway, stesso sprite/facing, arredi e libertà di movimento, confermare CI; estendere questo design agli altri interni man mano che verranno creati.
- **Riferimenti:** `bank-interior.mjs`, `game.mjs`, `index.html`, `bank-interior.test.mjs`, `church-webp.test.mjs`, `VISUAL_PROGRESS.md`, `AGENTS.md`; main, codice iniziale `dc80908`, movimento `917cd86`, nuovi test `38d95e9`/`fd94bea`, cache `ea49a72`, regola interni `5a3ec48`.

### 2026-10-18 — ChatGPT/GitHub — Camera interna con zoom e banca ampliata
- **Fatto:** sostituita la vista statica che mostrava tutta la banca con una telecamera che segue il personaggio, zoom pedonale identico all'overworld più 8%; ampliati interno, lobby e percorso fino agli sportelli.
- **Come/dove:** `bank-interior.mjs`: mondo 160×120, vestibolo con arredi, pareti e corridoio, collisioni, `bankInteriorCamera` e `bankInteriorViewport` in coordinate reali. `game.mjs`: camera animata durante i movimenti, zoom basato sul preset pedonale esterno e su `zoomBias`; preservato sprite e uscita preesistenti. `index.html` e test con cache v132/v003; regola in `AGENTS.md`.
- **Verifiche/stato:** superato smoke test JavaScript isolato di sintassi, rendering, dimensioni schermo, collisioni, camera smooth e zoom 7.128× (6.6× esterno). Aggiunti test di regressione in `bank-interior.test.mjs`. **Suite Node completa e controllo visivo pubblicato non eseguiti** in questa sessione; nessuna conferma di deploy.
- **Da fare:** verificare in browser/Android entrata, spostamenti camera e controlli touch, percorso lobby→porta→sportelli, HUD e performance; eseguire tutti i test Node della repo e correggere eventuali regressioni.
- **Riferimenti:** branch main; codice `19ad0db`/`46d4cc3`, test `83abdad`, cache `6c77a6d`/`3f6f909`, regola `f3846e2`, dettagli `VISUAL_PROGRESS.md`.

### 2026-10-19 — ChatGPT/GitHub — Analisi esperienza primo accesso e TODO vuoto
- **Fatto:** esaminati avvio, interfaccia, controlli, telecamera, campagne, mappa, guida, NPC, urti non letali, recovery routine e interni banca dal punto di vista di un nuovo giocatore; creato `games/gta-melito/TODO.md` completamente vuoto per la pianificazione futura.
- **Come/dove:** lettura statica di `index.html`, `game.mjs`, `campaign.mjs`, `roads.mjs`, `impact-physics.mjs`, `bank-interior.mjs`, `vehicle-entry.mjs`, README, registri e asset/dati presenti. Nessuna modifica al codice di gioco, alle missioni o agli asset.
- **Verifiche/stato:** file TODO verificato esistente a dimensione zero nel branch `main`; nessun test Node eseguito. Il deploy pubblicato non è stato provato in un browser interattivo in questa sessione: le valutazioni riguardano le funzioni e i rischi desumibili dal codice, non una partita reale o FPS osservati.
- **Da fare:** decidere insieme al committente quali priorità di gameplay e onboarding mettere nella TODO; poi effettuare sessione giocata reale su desktop e telefono (in particolare banca, controlli, missioni, urti NPC) ed eseguire la suite Node/CI prima di modifiche funzionali.
- **Riferimenti:** branch `main`, TODO creato nel commit `6490ae6a33f1acb27480ae589026ad00e4816cf9`; file `games/gta-melito/TODO.md` volutamente senza righe.

### 2026-10-19 — ChatGPT/GitHub — Incidenti non letali e zone di routine NPC
- **Fatto:** gli urti auto/moto→pedoni/veicoli, NPC→giocatore a piedi o in auto causano spinta e scivolamento proporzionali alla velocità; niente morti, NPC cancellati o game over. Inclusi controlli collisione lungo il movimento, persino se la guida AI frena prima del contatto.
- **Come/dove:** nuovo `impact-physics.mjs` (impulso, attenuazione, cooldown e collisione continua); `game.mjs` collega auto guidata, traffico, pedoni, protagonista e veicoli parcheggiati; `roads.mjs` memorizza per ogni NPC casa/zona stradale, preferisce svolte di ritorno e recupera a piedi/col veicolo il percorso dopo una spinta. Un riposizionamento è ammesso solo fuori dall'inquadratura sia all'origine sia al punto d'arrivo, scegliendo le strade della stessa zona.
- **Verifiche/stato:** smoke test JavaScript eseguito con i moduli reali: sintassi, severità urti, carica di impulso, generazione 12 auto + 12 pedoni, conservazione zona, recupero in zona fuori vista, recupero graduale in vista e step di AI; tutti superati. Creato `impact-physics.test.mjs` con copertura delle stesse regole. **Suite completa Node e verifica grafica del browser non effettuate**; lasciare come primo controllo al subentrante.
- **Da fare:** verificare su mobile/desktop urti con Panda/scooter, corpo a corpo con NPC e player, spostamento delle auto parcheggiate e rientro nella zona di routine; eseguire `node --test games/gta-melito/*.test.mjs games/gta-melito/survey/*.test.mjs`, controllare CI e impostare eventuali calibrazioni della forza di spinta.
- **Riferimenti:** `impact-physics.mjs`, `impact-physics.test.mjs`, `game.mjs`, `roads.mjs`, `index.html`, `AGENTS.md`. Main: `7d905de` (fisica), `938faaa` (routine), `fde73ac` (integrazione), `1d3a309` (test), `fb00873` (recupero sicuro), `cf29f98` (reset al cambio veicolo).

### 2026-10-19 — ChatGPT/GitHub — TODO completa della simulazione NPC
- **Fatto:** compilato il precedente `TODO.md` vuoto con roadmap NPC completa, milestone P0–P7, vertical slice prioritaria, criteri di completamento, vincoli grafici/funzionali, test e modalità di avanzamento.
- **Come/dove:** aggiornato soltanto `games/gta-melito/TODO.md`; la pianificazione copre destinazioni, routine, tempo, porte, socialità, NPC a bordo scooter/auto, reazioni, prestazioni e missioni.
- **Verifiche/stato:** scrittura GitHub confermata; nessun codice, test Node, browser smoke o deploy eseguito in questa sessione.
- **Da fare:** partire da P0 leggendo la TODO aggiornata; verificare la baseline e implementare la prima coorte NPC su Via Roma/Piazza Santo Stefano con test e commit. Una singola automazione di sviluppo è stata programmata per un'ora dopo la richiesta.
- **Riferimenti:** branch `main`, commit TODO `f85d783bc26a0c41c9d8aeb1e1b064c4a7815fa1`; `games/gta-melito/TODO.md`.

### 2026-10-19 — ChatGPT/GitHub — Guida con volante e pedali indipendenti
- **Fatto:** in auto/moto la levetta sinistra diventa un volante che ruota col dito, torna progressivamente al centro, con ACCELERA sopra FRENO a destra; a piedi rimangono levetta e CORRI. Il tasto azione resta per salire/scendere. Sterzare da fermo non accelera più.
- **Come/dove:** nuovo `steering-wheel.mjs` (angoli, limiti, ritorno), `index.html` (volante grafico SVG, pedali e CSS responsive), `game.mjs` (pointer capture, input multitouch, cambio layout per veicolo, comandi tastiera), `driving-controls.mjs` e `motorcycles.mjs` (accelerazione separata dal volante, freno di servizio distinto dal freno a mano). Aggiornati README/AGENTS e test di regressione; cache pagina `v135`.
- **Verifiche/stato:** superati controlli JavaScript sulle implementazioni reali per sintassi, accelerazione auto/moto, sterzo da fermi, frenata contemporanea al gas, rotazione del volante, centratura, markup e versioni cache. Creato `steering-wheel.test.mjs` e aggiornati `driving-controls.test.mjs`, `city-art.test.mjs`, `motorcycles.test.mjs`, controllo smoke e asserzioni di versione negli altri test. **Suite completa Node, screenshot in browser e test multitouch su telefono fisico non eseguiti**; rete GitHub non accessibile dal container di prova.
- **Da fare:** eseguire `node --test games/gta-melito/*.test.mjs games/gta-melito/survey/*.test.mjs` in ambiente con repository, aprire gioco su Android landscape, calibrare sensibilità del volante e dimensioni tasti se necessario, confermare collisioni, camera e funzionalità del freno/retromarcia.
- **Riferimenti:** `games/gta-melito/{steering-wheel.mjs,steering-wheel.test.mjs,game.mjs,index.html,driving-controls.mjs,motorcycles.mjs}`; commit funzione base `ecbdbe8`, fisica `ce3d9f4`/`558d7e4`, interfaccia `500e3e4`, integrazione `4a92730`, nuovo test `9c3ff4a`.
