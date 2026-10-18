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
