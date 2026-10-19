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

### 2026-10-19 — ChatGPT/GitHub — Prototipo radio auto con sei emittenti
- **Fatto:** integrato uno sintonizzatore per Radio Marte, Kiss Kiss Napoli, CRC, Nuova San Giorgio, Norba e Radio Napoli, selezionabile in auto e spento scendendo; OFF/riprova, due tasti per scorrere, scorciatoie R/Shift+R/T, stato audio, link al lettore ufficiale e preferenze locali. Scooter e moto per ora esclusi.
- **Come/dove:** nuovi `car-radio.mjs` e `car-radio.test.mjs`; integrazione in `game.mjs`, barra nel `index.html`, cache `v136`; aggiornati i test che asserivano la vecchia cache, README, TODO e VISUAL_PROGRESS. Nessun asset sonoro incluso o proxy di ritrasmissione.
- **Verifiche/stato:** riletti i file da GitHub; quattro test logici del modulo eseguiti in V8 con audio finto (4/4), parsing statico di game.mjs con import omessi e otto controlli di markup/integrazione superati. **Nessun ascolto reale dei sei stream, suite Node 22 completa, prova visiva browser/Android o deploy confermato**. URL candidati da fonti pubbliche, funzionamento e permessi di incorporamento da accertare.
- **Da fare:** testare i sei stream nel gioco su PC e telefono; verificare autorizzazioni/condizioni d'uso, eventuale fallback al lettore ufficiale e sovrapposizioni HUD; eseguire Node CI. La TODO NPC P0 resta indipendente e va sviluppata come già programmato.
- **Riferimenti:** `car-radio.mjs`, `car-radio.test.mjs`, `index.html`, `game.mjs`; codice sintonizzatore `ce497ca`, interfaccia `73f1586`, integrazione `9466753`; main.

### 2026-10-19 — ChatGPT/GitHub — Fix volante assente e joystick bloccato in guida
- **Fatto:** corretto il bug per cui, salendo in auto/moto, restava la levetta a piedi immobile e non appariva il volante. La radio/altre funzionalità contemporanee sono state preservate.
- **Causa e come:** `game.mjs` applicava `driving` a `$('stage')` ma `index.html` aveva soltanto `class="stage"`, non l'ID. Aggiunto `id="stage"`; fallback DOM nel motore; azzerato offset del vecchio joystick sul cambio mezzo; aggiornata cache pagina a `game.mjs?v=137`.
- **Verifiche:** eseguita direttamente la funzione attuale `updateHud()` su un DOM simulato derivato dall'HTML: in macchina entrambe le classi `stage.driving` e `controls.driving` attive; a piedi entrambe spente; all'interno della banca attivo `stage.interior` e non driving. Aggiunti due test specifici in `steering-wheel.test.mjs` e aggiornati i controlli versione nelle suite esistenti. **Non eseguite prova browser/Android, screenshot né suite completa Node.**
- **Da fare:** verificare che sul telefono, dopo ingresso in Panda o scooter, compaiano volante rotante e pulsanti ACCELERA/FRENO; controllare volante e pedali simultanei, camminata dopo la discesa e CSS su schermi stretti. Eseguire Node CI appena possibile.
- **Riferimenti:** `index.html`, `game.mjs`, `steering-wheel.test.mjs`, `VISUAL_PROGRESS.md`; branch `main`; fix ID `8a5c0a8`, fallback e reset `c600c58`, nuova pagina `08247a5`, regression test `8201c34`.

### 2026-10-19 — ChatGPT/GitHub — Pulsanti più piccoli e retromarcia touch
- **Fatto:** rimpiccioliti il tasto contestuale e i pedali di guida sul telefono; aggiunto un terzo pedale **RETRO** sotto ACCELERA e FRENO, premibile in auto e in moto. Il volante funziona come prima e a piedi resta il joystick.
- **Come/dove:** `index.html` riduce dimensioni e spaziatura, aggiunge il tasto #reverse con colori e feedback dedicati; `game.mjs` aggiunge `pressed.reverse`, gestione hold/pointer capture, annullamento quando gas e retro sono contemporanei e reset alla discesa/pausa/focus perso; `steering-wheel.test.mjs` verifica anche la retromarcia reale. Cache a `game.mjs?v=138`, controlli versione aggiornati nei test. README/AGENTS/VISUAL_PROGRESS aggiornati.
- **Verifiche:** smoke test JavaScript dei file GitHub superato (sintassi, layout, joystick/volante separati, comandi concorrenti, keyboard S e retro reali: auto -12, moto -4 unità/s). **Node suite completa, screenshot e prova su Android non eseguiti** in questa sessione.
- **Da fare:** provare su mobile landscape la colonna di tre pedali e il multitouch sterzo+RETRO; assicurarsi che action/RETRO non si sovrappongano a radio/pausa e controllare le dimensioni su schermi piccoli; eseguire suite Node e confermare il deploy.
- **Riferimenti:** `index.html` (commit `0d639cf`), `game.mjs` (`3dd6c7a`), `steering-wheel.test.mjs` (`d804501`), `VISUAL_PROGRESS.md`; branch `main`.


### 2026-10-19 — ChatGPT/GitHub — Unica coda oraria di sviluppo GTA Melito
- **Fatto:** predisposta nel TODO la nuova coda ordinata Q01–Q15: una sola funzionalità selezionata e lavorata per esecuzione oraria, con completamento aggiornato solo dopo codice + prove e con ripresa della stessa task se incompleta.
- **Come/dove:** `TODO.md` ora raccoglie in una sola fonte le precedenti richieste NPC, giorno/notte, eventi cittadini, economia, oggetti interattivi, meteo, audio, guida e rifiniture; priorità esplicita rispetto alle vecchie checklist tematiche P0–P7.
- **Automazioni:** per evitare sovrapposizioni, disabilitate le tre precedenti pianificazioni separate GTA Melito (giorno/notte, eventi/economia, gameplay 04–07); viene riconfigurata la precedente task NPC come unico lavoratore orario. L'automazione di ricerca lavoro dell'utente rimane indipendente e non viene modificata.
- **Verifiche/stato:** aggiornamento GitHub della sola documentazione confermato; **nessun nuovo codice di gioco, test Node, screenshot, audio stream o deploy eseguito** in questa sessione.
- **Da fare:** prima esecuzione selezionerà Q01 in `TODO.md`, proverà a implementarla, registrerà esito/commit/test sulla riga Q e appenderà il proprio log; se incompleta la riprenderà nell'ora successiva senza saltare alla Q02.
- **Riferimenti:** branch `main`; TODO con queue introdotta nel commit `e37bbe5`, priorità corretta nel commit `a153498`.

### 2026-10-19 — ChatGPT/GitHub — Nuovi veicoli nella coda unica: Ape Car e friggitore ambulante
- **Fatto:** aggiunte in `TODO.md` le voci operative Q16 per Ape Car a tre ruote e Q17 per furgoncino del friggitore ambulante; entrambe non completate, dopo Q15.
- **Come/dove:** definite istruzioni per sprite esclusivamente dall'alto in pixel art coerente coi veicoli approvati, PNG RGBA trasparenti, proporzioni realistiche, integrazione NPC/parcheggi/guida, collisioni e verifiche; per il venditore ambulante prevista sosta e interazione commerciale se disponibile.
- **Automazione:** aggiornato il lavoratore orario unico affinché includa Q16, Q17 e qualunque nuova voce Q futura, mantenendo rigorosamente una sola attività per esecuzione e ordine della TODO.
- **Verifiche/stato:** aggiornamento documento su GitHub confermato; nessun nuovo asset, codice, test Node o prova in browser eseguiti. Nessuna Q spuntata come completata.
- **Da fare:** proseguire dalla prima Q aperta della coda; quando arriverà a Q16, seguire `VEHICLE_ART_GUIDE.md` e collaudare proporzioni, trasparenza e comportamento in-game, poi sviluppare Q17 separatamente.
- **Riferimenti:** `games/gta-melito/TODO.md`, `VEHICLE_ART_GUIDE.md`, commit TODO `d29fcd60e6aa0d7702dd7dfb721a39fc213d7d11`; branch `main`.

### 2026-10-19 — Sviluppo orario Q01: residenti con routine visibile
- **Fatto:** integrata coorte deterministica di massimo 10 pedoni nel centro, senza aumentare la popolazione complessiva (170); percorso zona di partenza → sosta su marciapiede OSM → ritorno.
- **Come/dove:** nuovo `resident-routines.mjs`, collegato a `roads.mjs` e ai due percorsi di inizializzazione in `game.mjs`; cache pagina v139, test `resident-routines.test.mjs`.
- **Fisica:** collisioni con auto gestite dal sistema esistente; dopo un urto recupero graduale verso il tratto di origine, nessun salto in camera; fermate simulate e non associate a negozi veri.
- **Verifiche:** cinque scenari eseguiti in V8 con moduli reali (spawn a seed, ciclo completo, limiti del movimento, recupero, 10 pedoni sul grafo OSM); controllo parsing dei moduli e presenza dei file pubblicati.
- **Non verificati:** suite completa Node 22, prova visiva PC/Android, performance e GitHub Pages dopo il commit.
- **Da fare:** registrare Q01 nella TODO se la scrittura remota torna disponibile, poi Q02 (agenda/orologio) e smoke test reale; evitare di presentare le soste come ingressi negli edifici.
- **Riferimenti:** `main`, commit `ebcf34a` (modulo), `f1a456c` (test), `f1a3f4c` (integrazione).
- **Registro TODO:** tentati aggiornamento checkbox Q01 ed esito nel `TODO.md`, ma le scritture sono state bloccate dai controlli del connettore. La checkbox resta `[ ]`; riprovare prima di avviare Q02, senza perdere i commit già pubblicati.

### 2026-10-19 — ChatGPT/GitHub — Ripristino scrittura TODO e verifica documentata Q01
- **Fatto:** ripristinata la scrittura GitHub del registro di avanzamento e spuntata **soltanto Q01** in `TODO.md`; Q02–Q17 rimangono aperte.
- **Come/dove:** riletti AGENTS root/locale, README, handoff e ultimi log; controllati via GitHub `resident-routines.mjs`, `resident-routines.test.mjs`, agganci in `roads.mjs` e `game.mjs`.
- **Codice:** la coorte di 10 residenti e il percorso partenza→sosta→ritorno erano già pubblicati nei commit `ebcf34a`, `f1a456c` e `f1a3f4c`; nessun gameplay modificato in questa sessione.
- **Verifiche:** confermata lettura del codice integrato e dei test; ripresi i risultati registrati di 5 scenari V8 superati nella sessione precedente, senza attribuire nuovi test non eseguiti.
- **Non verificati:** Node 22 completo, browser PC/Android, screenshot e deploy GitHub Pages: ancora pendenti.
- **Da fare:** eseguire Q02 come prossima singola task oraria; completare il collaudo generale più avanti, senza assumere che il comportamento osservato sia perfetto su device.
- **Riferimenti:** main, aggiornamento TODO commit `2db6b28`; `TODO.md` Q01 [x], prossimo Q02 [ ].

### 2026-10-19 — ChatGPT/GitHub — Estensione backlog gameplay Q18–Q24
- **Fatto:** aggiunte 7 nuove task non completate alla coda unica `TODO.md`, senza cambiare ordine o stato di Q01–Q17.
- **Veicoli di servizio:** Q18 introduce soltanto due modelli (furgone corriere, camion rifiuti); Q19 introduce altri due (carro attrezzi, autobus); Q20 implementa separatamente le routine di lavoro di tutti e quattro.
- **Altre proposte approvate:** Q21 passeggeri su auto/scooter; Q22 semafori/precedenze/attraversamenti/frecce; Q23 danni visivi ai mezzi; Q24 buche, dossi e superfici con effetti arcade.
- **Vincoli:** asset PNG RGBA top-down coerenti con `VEHICLE_ART_GUIDE.md`, integrazione in gioco verificabile, nessuna falsa rappresentazione di linee autobus/semafori/buche reali, test e compatibilità con mobile e sistemi esistenti.
- **Cosa non è stato aggiunto:** animali, animazioni contestuali extra, balconi/cortili, NPC da accompagnare, minigiochi (proposte 6–10 escluse su indicazione dell'utente).
- **Verifiche/stato:** scrittura della TODO sul branch main riuscita; si tratta esclusivamente di pianificazione, senza creazione di sprite, nuove funzioni, test Node/browser o deploy.
- **Da fare:** il lavoratore orario deve continuare con la prima Q aperta (Q02 alla lettura odierna), una sola Q per esecuzione; arriverà successivamente a Q18–Q24 senza saltare elementi.
- **Riferimenti:** `games/gta-melito/TODO.md`, commit `525e338`; nessuna nuova automazione creata.