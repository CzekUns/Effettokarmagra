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

### 2026-10-19 — ChatGPT/GitHub — Diagnosi arresto del lavoratore orario
- **Fatto:** diagnosticato lo stop della coda Q: l'automazione «GTA Melito — Sviluppo Orario» risulta disattivata, pur avendo ancora attività Q02–Q24 aperte.
- **Stato scheduler verificato:** ultima esecuzione alle 08:31 circa ora di Roma; disabilitazione registrata verso le 08:32. La cronologia disponibile non specifica la causa precisa della disabilitazione.
- **Stato codice:** dopo Q01 sono stati pubblicati `npc-agenda.mjs`, test Q02 e commit parziali `062f70e`, `88dd5c3`, `2aa85ff`, ma i moduli di loop `game.mjs`/`roads.mjs`/`resident-routines.mjs` non importano ancora l'agenda.
- **Stato TODO:** 24 attività, 1 [x]; Q02 rimane [ ] e ora include un checkpoint IN CORSO nel commit `e5c6902` per il successivo lavoratore.
- **Verifiche realmente eseguite:** lettura diretta repository e permessi di scrittura GitHub confermati; nessun test Node 22, prova browser/Android o deploy eseguito in questa sessione.
- **Da fare:** completare SOLO Q02 per la prossima esecuzione; avviare correttamente clock/agenda nel gioco e verificare che le missioni restino a timer in secondi reali.
- **Resilienza:** riattivare l'unica automazione, evitando che un blocco temporaneo dei tool o task incompleta provochino una nuova disattivazione; registrare sempre Q02 [ ] con avanzamento e riprovare l'ora successiva.
- **Riferimenti:** branch `main`, TODO Q02; nessun file di gameplay modificato durante la diagnosi.

### 2026-10-19 — ChatGPT/GitHub — Q02 integrazione agenda NPC e orologio
- **Fatto:** collegata l'agenda giornaliera dei residenti Q01 ai cinque slot del modulo Q02, senza avviare Q03.
- **Come:** `resident-routines.mjs` assegna un'agenda per NPC, apre una sola uscita per finestra giornaliera, tiene lo stato AT_HOME/OUTBOUND/ACTING/RETURNING.
- **Roads:** `roads.mjs` propaga `world.npcClockMinutes` al passo delle routine; normale traffico auto e pedoni resta invariato.
- **Loop:** `game.mjs` fa avanzare il clock solo nel mondo esterno, esclude menu/pausa/dialoghi e banca; `index.html` visualizza ora e fascia NPC.
- **Missioni:** `updateTimer(state.progress,dt)` rimane separato e usa secondi reali; nessuna sostituzione dei timer campagna.
- **Test:** aggiornate asserzioni Q01 e aggiunti test Q02 su avvio all'ora, ritorno, un'uscita al giorno, successivo giorno e collegamenti del loop.
- **Verifiche realmente fatte:** rilettura file e SHA remoti; commit delle modifiche confermati da GitHub. Node 22 disponibile nel container ma repository non scaricabile per DNS GitHub: test Node/browser **non eseguiti**.
- **Limiti/da fare:** eseguire Node 22 e smoke browser PC/mobile su checkout completo, verificare comportamento visivo e potenziali conflitti orari; mantenere Q02 [ ] sino al collaudo.
- **Riferimenti:** branch main, commit `a10dd7b`, `649e41f`, `ff13b83`, `5e5f2e1`, `50bbee8`, `54a219b`, `033c7c7`.

### 2026-10-19 — ChatGPT/GitHub — Q02 correzione regressioni dei test
- **Fatto:** corretta asserzione Q01 che cercava erroneamente l'import `resident-routines.mjs?v=001`; il gioco usa `v002`.
- **Fatto:** corretta asserzione Q02 per individuare il ramo banca senza dipendere da spaziature e indentazione.
- **Codice:** modificati solo `resident-routines.test.mjs` e `npc-agenda.test.mjs`, non il loop del gioco.
- **Commit:** `25db9b1` (versione import Q01), `2afdfd2` (match robusto controllo banca), branch `main`.
- **Verifiche:** lettura SHA e contenuti GitHub, entrambe le scritture confermate da commit remoti.
- **Node 22:** disponibile (`v22.16.0`), ma `git ls-remote` fallisce per `Could not resolve host: github.com`; suite Node non eseguita.
- **Browser/Android:** non eseguiti, nessuna conferma del deploy; Q02 resta aperta per collaudo.
- **Prossimo passo:** testare suite e gioco su checkout raggiungibile, registrare esiti e correggere problemi prima di marcare Q02 [x].

### 2026-10-19 — ChatGPT/GitHub — Affiancamento account collaboratore
- **Fatto:** verificato che il collaboratore GitHub `ilconsulentelogistico-hue` dispone di autorizzazione `write` nella repository.
- **Coordinamento:** creata e assegnata l'issue #28 di supporto QA alla Q02 ancora aperta, senza iniziare una seconda Q.
- **Ambito del collaboratore:** test Node 22 e, se accessibili, browser/mobile per agenda NPC, timer missioni, pause e banca; riportare risultati reali.
- **Regola anti-conflitti:** modifiche del collaboratore su branch separato e PR; niente push diretto su main e niente checkbox Q spuntate senza verifica del lavoratore orario.
- **Verifiche fatte:** controllati livello autorizzativo e assegnatario dell'issue; letta TODO con Q02 [ ] e il registro corrente.
- **Test non eseguiti:** nessun nuovo test Node, browser o deploy in questo turno, nessun codice gameplay modificato.
- **Da fare:** il collaboratore esegue/verifica Q02 e propone eventuale PR; il lavoratore orario continua in ordine sulla TODO, integrando i risultati quando disponibili.
- **Riferimenti:** issue https://github.com/CzekUns/Effettokarmagra/issues/28; branch main.

### 2026-10-19 — ChatGPT/GitHub — Nuovi ruoli: TODO al collaboratore, merge e migliorie al revisore
- **Fatto:** concordato assetto a due account per GTA Melito, senza lavoratori concorrenti sulle medesime Q.
- **Collaboratore:** `ilconsulentelogistico-hue` incaricato tramite issue #28 di implementare Q02–Q24 in ordine, branch separato e PR per ciascuna task; permessi `write` già verificati.
- **Revisore:** automazione oraria esistente riadattata come «GTA Melito — PR e migliorie», attiva, per valutare PR, integrare solo dopo controlli e sviluppare fix indipendenti dalle Q.
- **Documentazione:** aggiornati `AGENTS.md` locale e `TODO.md` con protocollo multi-agente e divieto di push diretto a `main` da parte del collaboratore per le Q.
- **Stato TODO:** Q01 [x], Q02 [ ] IN CORSO, tutte le altre Q ancora aperte; nessuna Q marcata completata in questa sessione.
- **Verifiche:** confermati assegnatario issue #28 e assenza di PR aperte nella ricerca GitHub; GitHub ha confermato commit della sola documentazione.
- **Non eseguiti:** test Node/browser/deploy e nuove implementazioni gameplay; l'assegnazione GitHub non avvia automaticamente l'AI esterna.
- **Da fare:** l'AI del collaboratore, una volta avviata sul proprio account, prende Q02 e apre una PR; il revisore valuta merge o richiesta correzioni, senza sovrapposizioni.
- **Riferimenti:** issue https://github.com/CzekUns/Effettokarmagra/issues/28; branch main; aggiornamenti `AGENTS.md` commit `3c1f800`, `TODO.md` commit `ba7c48d`.

### 2026-10-19 — ChatGPT/GitHub — Pubblicazione doppia Stabile/Beta e piano collaudo
- **Fatto:** aggiunte due schede GTA Melito al catalogo Uns Arcade: Stabile e Sperimentale, con percorsi distinti.
- **Come:** `arcade/catalog.js` aggiornato (`553c0b6`), cache bust homepage (`b2dba59`).
- **Workflow:** creato `.github/workflows/publish-arcade-gta-variants.yml` (`6cdaa77`) che assembla sito main, stabile dal branch backup e Beta dalla PR #29, senza unire codice gameplay in main.
- **Test manuali:** creato `games/gta-melito/PLAYTEST_BETA.md` (`7c6c065`) con prove in ordine, criteri di severità e modalità segnalazione.
- **Verifiche effettuate:** SHA GitHub e commit di scrittura confermati; branch backup `backup/gta-melito-stable-2026-10-19` già esistente.
- **Non eseguiti:** Node 22, browser, Android e deploy GitHub Pages; non attribuire ai link lo stato di pubblicazione finché il job non è verificato.
- **Limite:** GitHub Pages deve essere configurato su sorgente GitHub Actions; controllare eventuali workflow Pages preesistenti per evitare deploy concorrenti.
- **Da fare:** verificare esito del workflow, aprire entrambe le URL e iniziare collaudo manuale Q02–Q12; nessuna Q marcata su main e PR #29 lasciata aperta.


laude (account `ilconsulentelogistico-hue`) — Q02 collaudata e chiusa
- **Fatto:** primo collaudo reale della Q02 con Node 22 e browser; corretti 2 difetti di gioco e 15 test fragili; Q02 spuntata `[x]` in `TODO.md` con esito.
- **Difetto 1 (banca):** `game.mjs` faceva avanzare l'orologio NPC anche dentro la banca, dove gli NPC non vengono simulati; ora `advanceNpcClock(...,{interior:!!state.bankInterior})`.
- **Difetto 2 (blocco permanente):** un residente restava fermo per sempre dietro uno scooter parcheggiato sul marciapiede (frenato il 95% del tempo). `resident-routines.mjs` ora fa un passo laterale (0,9–2,6 m) solo su corsie libere e camminabili, avanza e rientra sulla linea, mai più di un passo d'uomo per tick. `roads.mjs` passa `validRecovery` alla routine.
- **Test:** 14 asserzioni con versioni cache fisse (`game.mjs?v=138` ecc.) rese "almeno la versione N"; test HUD del volante riceve `formatNpcClock`; nuovi test scooter (aggiramento e attesa se i lati non sono camminabili) e controllo del flag banca. Suite: 160/175 → **177/177**.
- **Cache:** `game.mjs?v=141`, `roads.mjs?v=141`, `resident-routines.mjs?v=003`.
- **Browser (Chrome headless, desktop e telefono orizzontale):** orologio avanza all'aperto e si ferma in pausa e in banca; 5 fasce verificate; ciclo completo di un residente in 140 s senza salti; nessun errore JS (solo favicon 404 del sito, preesistente).
- **Non eseguiti:** Android reale; HUD ora NPC non visibile sul telefono in orizzontale (barra nascosta).
- **Da fare:** Q03 (ingressi negli edifici) sullo stesso ramo `collab/gta-melito-coda`, come concordato: una Q dopo l'altra e merge unico alla fine.


### 2026-10-19 — Claude (account `ilconsulentelogistico-hue`) — Q03 NPC che entrano ed escono dagli edifici
- **Fatto:** i residenti della coorte (Q01–Q02) ora abitano dietro un portone e la loro uscita finisce dietro un'altra porta; 3 nuovi "clienti" vanno in negozi con nome presi da OSM. Q03 spuntata `[x]` in `TODO.md` con esito.
- **Come:** nuovo `building-doors.mjs` (`probeDoor`, `validateDoor`, `doorFacesViewer`, `facadeExposure`, disegno a terra e in facciata); `resident-routines.mjs` con `stepOutside`/`stepDoorway` (tragitto dritto marciapiede↔soglia a passo d'uomo), `createDoorVisitors`, `attachDoorToPavement`; `traffic-collision.mjs` e `city-art.mjs` ignorano gli NPC `indoors`; `game.mjs`: `buildingAt` restituisce l'edificio trovato, porte create in `createCityPedestrians`, disegnate prima delle persone, chiusura dopo 1,4 s, niente scoperta dei tetti da chi è dentro.
- **Regole rispettate:** l'NPC appare e sparisce solo sulle soglie (nessun teletrasporto in vista); da dentro non è un ostacolo e non può essere urtato; se un'auto è sulla soglia di casa resta dentro, se blocca la porta del negozio per 8 s fa la commissione fuori. Corretto anche un salto latente della Q02: dopo un urto lo spostamento laterale ora si azzera.
- **Fonti:** portoni di casa `inventata`; porte dei negozi `osm-poi` con il nome OSM, posizione stimata sulla facciata dietro l'insegna. Nessun ingresso reale è dichiarato censito.
- **Cache:** `game.mjs?v=142`, `roads.mjs?v=142`, `resident-routines.mjs?v=004`, `traffic-collision.mjs?v=126`, `city-art.mjs?v=126`, `bank-interior.mjs?v=004`, `impact-physics.mjs?v=002`, nuovo `building-doors.mjs?v=001`.
- **Test:** nuovo `building-doors.test.mjs` (10 test); suite Node 22 **187/187**.
- **Browser (Chrome headless, desktop 1280×720 e telefono 844×390):** 170 pedoni invariati; 8 residenti su 10 hanno il portone (2 tengono la fermata in strada della Q01), 3 clienti; 22 porte (19 inventate, 3 OSM). 150 s seguiti: residente 5 e cliente di «Le fantasie di Andrea» completano casa→meta→casa solo attraverso le proprie soglie, residente 0 completa andata, permanenza e uscita; 0 posizioni nei muri su 1.274 campioni per NPC, spostamento massimo 0,23 m per campione (100 ms). Foto: porte su Via Roma, uscita con porta aperta, porte a vetro dei negozi; nessun errore JS (solo il favicon 404 già noto).
- **Prestazioni:** creazione dei pedoni con porte circa 140 ms una volta al caricamento (prima circa 60 ms); ricerca porte limitata e con cache.
- **Non eseguiti / limiti:** Android reale; porte piccole allo zoom a piedi (leggibili ma discrete); facciate nascoste dietro i tetti escluse; gli NPC non usano la banca (il suo interno è giocabile e li mostrerebbe assenti).
- **Da fare:** Q04 (giorno/notte e illuminazione) sullo stesso ramo.

### 2026-10-19 — Claude (account `ilconsulentelogistico-hue`) — Q04 giorno/notte e illuminazione
- **Fatto:** ciclo giorno/notte graduale legato all'orologio NPC, lampioni con pozze di luce, finestre accese sulle facciate, fari e fanali dei veicoli in movimento. Q04 spuntata `[x]` in `TODO.md` con esito.
- **Come:** nuovo `daylight.mjs` (curva di luce per minuto, quota di finestre accese, mappa luminosa a mezza risoluzione con luci "bucate", aloni additivi, fari, interruttore di qualità); `city-art.mjs` esporta `facadeWindowPanes` (le stesse vetrate di `drawRaisedWalls`, in coordinate mondo); `game.mjs` disegna la notte dopo il protagonista e prima di suggerimenti e indicatore banca; parametro `?ora=HH:MM`.
- **Regressioni:** di giorno non si esegue nulla (uscita immediata); confronto pixel con la versione precedente: 25 pixel diversi su 613.800 (solo indicatore missione animato).
- **Cache:** `game.mjs?v=143`, `city-art.mjs?v=127`, `bank-interior.mjs?v=005`, nuovo `daylight.mjs?v=001`.
- **Test:** nuovo `daylight.test.mjs` (8 test, compreso uno smoke di disegno su canvas simulato); suite Node 22 **195/195**.
- **Browser (Chrome headless, PC 1280×720 e telefono 844×390):** 6 orari con foto e luminosità misurata (12:00 128,7 → 21:30 72,0 → 05:50 105,4); 60 s reali di tramonto senza salti; fari visibili alle 22:00; nessun errore JS.
- **Prestazioni:** senza GPU, notte +1 ms a piedi e +4–6 ms con la visuale larga; sotto 30 fps si spengono le sole finestre.
- **Non eseguiti / limiti:** Android reale e GPU vere; colori arcade non astronomici; luci dei lampioni solo sui lampioni dell'arredo procedurale (non su quelli di monumenti o interni).
- **Da fare:** Q05 (eventi cittadini emergenti) sullo stesso ramo.

### 2026-10-19 — Claude (account `ilconsulentelogistico-hue`) — Q05 eventi cittadini: l'oggetto perduto
- **Fatto:** primo evento spontaneo. Un residente perde chiavi, portafoglio, spesa o cellulare, se ne accorge e torna a riprenderlo; oppure il giocatore lo raccoglie e lo restituisce (mancia 5 €). Q05 spuntata `[x]` in `TODO.md` con esito.
- **Come:** nuovo `city-events.mjs` (logica deterministica, icone degli oggetti e fumetti); `resident-routines.mjs`: deviazione `plan.detour` sullo stesso marciapiede, con attesa sul posto; `game.mjs`: passo degli eventi nel `tick`, azione contestuale prima di porte e veicoli, etichetta RACCOGLI/RESTITUISCI sul pulsante azione, oggetto disegnato sotto le persone, fumetti sopra il buio della notte, mancia salvata nella campagna.
- **Anti-spam:** un evento alla volta, primo dopo 45 s, poi pausa di 5 minuti; mai in auto o durante missioni a tempo.
- **Cache:** `game.mjs?v=144`, `roads.mjs?v=143`, `resident-routines.mjs?v=005`, nuovo `city-events.mjs?v=001`.
- **Test:** nuovo `city-events.test.mjs` (8 test); `steering-wheel.test.mjs` riceve `cityEventAction` nell'HUD isolato; suite Node 22 **203/203**.
- **Browser (Chrome headless, PC e telefono):** evento naturale dopo 110 s seguendo un residente; ritrovato da solo in 26 s; con i tasti reali RACCOGLI → RESTITUISCI e soldi da € 0 a € 5; sul telefono il tocco su RACCOGLI funziona; nessun errore JS.
- **Non eseguiti / limiti:** Android reale; un solo tipo di evento per ora.
- **Da fare:** Q06 (economia locale di base) sullo stesso ramo.

### 2026-10-19 — Claude (account `ilconsulentelogistico-hue`) — Q06 economia locale di base
- **Fatto:** i negozi con nome OSM diventano banconi dove spendere i soldi delle missioni: prodotti che fanno correre di più, un servizio (taglio di capelli, +rispetto), un ricordo da collezione. Q06 spuntata `[x]` in `TODO.md` con esito.
- **Come:** nuovo `local-shops.mjs` (catalogo per tipo di negozio, acquisto, fondi insufficienti, spinta di corsa, pulizia del salvataggio); `campaign.mjs`: campo `shop` in `freshProgress`/`readProgress`; `game.mjs`: COMPRA sul pulsante azione, pannello con saldo e messaggi, pausa del mondo, tasti 1–2/E/Esc, velocità a piedi × spinta, HUD «CARICO N S»; `index.html`: riquadro `shop-panel` nello stile dei dialoghi.
- **Fatti e ipotesi:** nomi dei negozi reali (OSM), prodotti e prezzi inventati, scritto nel pannello.
- **Cache:** `game.mjs?v=145`, `campaign.mjs?v=001` (prima senza versione), nuovo `local-shops.mjs?v=001`.
- **Test:** nuovo `local-shops.test.mjs` (7 test); test isolati HUD e pausa aggiornati; suite Node 22 **210/210**.
- **Browser (Chrome headless, PC e telefono):** fondi insufficienti a € 0, acquisto con i 75 € della ricompensa della prima missione (impostati a mano), HUD aggiornato, salvataggio confermato dopo il ricaricamento della pagina; sul telefono acquisto di un servizio con i tocchi; nessun errore JS.
- **Non eseguiti / limiti:** Android reale; la missione non è stata giocata per intero nel browser.
- **Da fare:** Q07 (ambiente fisicamente interattivo) sullo stesso ramo.

### 2026-10-19 — Claude (account `ilconsulentelogistico-hue`) — Q07 ambiente fisicamente interattivo
- **Fatto:** bidoni carrellati spostabili/ribaltabili e paletti dissuasori fissi in tutta la città. Q07 spuntata `[x]` in `TODO.md` con esito.
- **Come:** nuovo `street-objects.mjs` (posizionamento deterministico, fisica dei bidoni, collisioni cerchio/veicolo, paletti, recupero fuori vista, disegno); `game.mjs`: `createStreetObjects` dopo pedoni e porte (al caricamento e al reset), `stepStreetPhysics` subito dopo il traffico, paletti in `carBlocked` e nella camminata, disegno sotto le persone.
- **Regole:** niente oggetti in case, carreggiate, davanti alle porte o sotto le auto parcheggiate; traffico e pedoni non vengono bloccati; nessun riposizionamento in vista.
- **Cache:** `game.mjs?v=146`, nuovo `street-objects.mjs?v=001`.
- **Test:** nuovo `street-objects.test.mjs` (6 test); suite Node 22 **216/216**.
- **Browser (Chrome headless):** 442 bidoni e 144 paletti, tutti in posizioni valide sulla mappa reale; urto d'auto, spinta a piedi, paletti e recupero verificati; traffico e pedoni invariati rispetto alla Q06; 0,26 ms per fotogramma; nessun errore JS.
- **Non eseguiti / limiti:** Android reale; paletti piccoli allo zoom a piedi.
- **Da fare:** Q08 (meteo) sullo stesso ramo.

### 2026-10-19 — Claude (account `ilconsulentelogistico-hue`) — Q08 meteo
- **Fatto:** sereno, nuvoloso e pioggia graduali legati all'orologio NPC, con asfalto bagnato, pozzanghere, gocce, ombrelli e interazione con la luce della Q04. Q08 spuntata `[x]` in `TODO.md` con esito.
- **Come:** nuovo `weather.mjs` (calendario a blocchi di 3 ore, bagnato/asciutto, unione con la luce del giorno, gocce, nuvole, pozzanghere, ombrelli); `game.mjs`: `state.weather` a ogni passo, maschere `wetTile` (strade meno edifici e tetti proiettati) sotto la rivelazione dei tetti, pozzanghere posizionate con `coveredByBuilding`, ombrelli sopra i pedoni, nuvole prima della notte, gocce sopra la notte e sotto i fumetti, riflessi dei lampioni sul bagnato, etichetta meteo nell'HUD, parametro `?meteo=`.
- **Scelte:** nessun cambio di aderenza (Q10); effetto sugli NPC solo visivo (ombrello).
- **Cache:** `game.mjs?v=147`, nuovo `weather.mjs?v=001`.
- **Test:** nuovo `weather.test.mjs` (7 test); suite Node 22 **223/223**.
- **Browser (Chrome headless, PC e telefono):** foto di sereno, nuvoloso, pioggia di giorno e di notte dallo stesso punto; passaggio naturale al primo temporale senza blocchi; nessun errore JS; con la pioggia di giorno 48 fps contro 55 senza GPU.
- **Non eseguiti / limiti:** Android reale e GPU vere.
- **Da fare:** Q09 (audio ambientale dinamico) sullo stesso ramo.

### 2026-10-19 — Claude (account `ilconsulentelogistico-hue`) — Q09 audio ambientale dinamico
- **Fatto:** motori, traffico, clacson, fondo urbano e pioggia sintetizzati, con attenuazione per distanza e stereo, avvio su gesto, muto/volume e pausa/focus. Q09 spuntata `[x]` in `TODO.md` con esito.
- **Come:** nuovo `city-audio.mjs` (mix puro testabile + nodi Web Audio); `game.mjs`: avvio al primo `pointerdown`/`keydown`, `visibilitychange`/`blur`/`focus`, aggiornamento a ogni fotogramma, clacson con H e tocco al centro del volante, clacson NPC limitati, stato radio per abbassare i motori; `index.html`: pulsanti SUONI e VOLUME nel menu di pausa.
- **Diritti:** nessun audio di terzi; radio invariate.
- **Cache:** `game.mjs?v=148`, nuovo `city-audio.mjs?v=001`.
- **Test:** nuovo `city-audio.test.mjs` (8 test); suite Node 22 **231/231**.
- **Browser (Chrome headless):** avvio solo dopo il clic, motore che sale in accelerazione, muto e volume dal menu, sospensione con la scheda nascosta, radio visibile; resa offline con segnale reale e senza saturazione; nessun errore JS.
- **Non eseguiti / limiti:** ascolto reale (altoparlanti, Android): i volumi vanno regolati a orecchio.
- **Da fare:** Q10 (guida arcade 2.0) sullo stesso ramo.

### 2026-10-19 — Claude (account `ilconsulentelogistico-hue`) — Q10 guida arcade 2.0
- **Fatto:** profili di guida diversi per auto (e modello), scooter e moto; sbandate col freno a mano o in curva veloce che si recuperano da sole; segni delle gomme e stridio. Q10 spuntata `[x]` in `TODO.md` con esito.
- **Come:** nuovo `vehicle-handling.mjs` (`stepVehicle`, `applyGrip`, `handlingProfile`); `driving-controls.mjs` e `motorcycles.mjs` delegano a `stepVehicle` con i valori storici come predefiniti; `game.mjs` passa profilo e bagnato, muove l'auto lungo `car.travel`, segni `addSkidMarks`/`drawSkidMarks`; `city-audio.mjs`: rumore di stridio.
- **Regressioni:** equivalenza esatta con la fisica precedente senza profilo; test esistenti di volante, pedali, freno, RETRO, scooter e tour di guida tutti verdi.
- **Cache:** `game.mjs?v=149`, `driving-controls.mjs?v=096`, `motorcycles.mjs?v=004`, `city-audio.mjs?v=002`, `bank-interior.mjs?v=006`, nuovo `vehicle-handling.mjs?v=001`.
- **Test:** nuovo `vehicle-handling.test.mjs` (7 test); suite Node 22 **238/238**.
- **Browser (Chrome headless):** sbandata col freno a mano con segni e stridio, ritorno in linea, mai dentro i muri, RETRO senza scivolate; nessun errore JS.
- **Non eseguiti / limiti:** prova di guida su telefono reale; profili da rifinire a sensazione.
- **Da fare:** Q11 (socialità NPC più ricca) sullo stesso ramo.

### 2026-10-19 — Claude (account `ilconsulentelogistico-hue`) — Q11 socialità NPC più ricca
- **Fatto:** incontri spontanei tra conoscenti e piccoli gruppi (fino a 3) con orientamento, pausa, saluto e ripartenza; interruzione per pericolo; pochi fumetti contestuali. Q11 spuntata `[x]` in `TODO.md` con esito.
- **Come:** nuovo `npc-social.mjs` (conoscenze, chi può fermarsi, gruppi, pericolo, fumetti); `roads.mjs`: chi chiacchiera salta il passo; `city-events.mjs`: chi chiacchiera non perde oggetti; `game.mjs`: `stepSocial` nel `tick` con veicoli, clacson (`honk()` e clacson NPC) e controllo della carreggiata.
- **Correzioni durante il collaudo:** la distanza dagli incroci si applicava a ogni vertice delle vie OSM (quasi nessuno poteva fermarsi): ora solo agli incroci veri; un gruppo si era formato su un attraversamento di una carreggiata: ora mai sulla carreggiata.
- **Cache:** `game.mjs?v=150`, `roads.mjs?v=144`, `city-events.mjs?v=002`, nuovo `npc-social.mjs?v=001`.
- **Test:** nuovo `npc-social.test.mjs` (7 test); suite Node 22 **245/245**.
- **Browser (Chrome headless):** 9 gruppi in 170 s in città, nessuno su carreggiata, nessun pedone incastrato, traffico e pedoni in movimento; nessun errore JS.
- **Limite:** pedoni pochi e sparsi, quindi incontri rari vicino al giocatore (da migliorare con la densità per zona della Q13).
- **Da fare:** Q12 (ciclo NPC a piedi ↔ scooter/auto) sullo stesso ramo.

### 2026-10-19 — Claude (account `ilconsulentelogistico-hue`) — Q12 ciclo NPC a piedi ↔ scooter
- **Fatto:** un residente esce di casa, prende il suo scooter (mezzo parcheggiato vero), guida lungo un percorso pianificato fino a una meta OSM, parcheggia, entra, esce e torna; se lo scooter è sparito torna a piedi e riprende la routine. Q12 spuntata `[x]` in `TODO.md` con esito.
- **Come:** nuovo `npc-commute.mjs` (percorsi con unione degli incroci vicini, parcheggio, guida con raccordi dritti, camminata a punti, fasi del ciclo, furto); `roads.mjs` (`path` opzionale agli incroci, `lanePosition`/`sidewalkTurn` esportati, pendolari esclusi dal passo generico); `vehicle-entry.mjs` (scooter guidato da un NPC non prendibile); `npc-social.mjs` (il pendolare non si ferma a chiacchierare); `game.mjs` (`createCommuters` sceglie casa vicina e meta col giro più corto, `stepCommuters` nel `tick`, luci e suono).
- **Scoperto e risolto:** la rete stradale del gioco è spezzata (le vie OSM si toccano senza punti in comune): per i percorsi si uniscono i nodi entro 6 m. Le svolte dei pedoni non permettono di girare dal lato interno: la camminata di ripiego usa punti sul marciapiede e attraversa agli incroci.
- **Cache:** `game.mjs?v=151`, `roads.mjs?v=145`, `vehicle-entry.mjs?v=002`, `npc-social.mjs?v=002`, nuovo `npc-commute.mjs?v=001`.
- **Test:** nuovo `npc-commute.test.mjs` (6 test); suite Node 22 **251/251**.
- **Browser (Chrome headless):** ciclo completo in 469 s sulla mappa reale, scooter non prendibile mentre guidato, furto vero col tasto E e partenza a piedi; nessun errore JS.
- **Non eseguiti / limiti:** arrivo a casa a piedi nel browser (mezz'ora di gioco, provato nel mondo di prova); un solo pendolare, niente auto guidate da NPC; Android reale.
- **Da fare:** Q13 (reazioni avanzate e densità) sullo stesso ramo; la densità per zona aiuterà anche gli incontri della Q11.

### 2026-10-19 — ChatGPT/GitHub — Ricognizione nuova versione e stop automazioni GTA Melito
- **Fatto:** disattivata su richiesta utente l'unica automazione GTA Melito ancora attiva («GTA Melito — PR e migliorie»); le altre automazioni GTA visibili risultavano già disattivate. Nessuna automazione estranea toccata.
- **Ricognizione:** verificato `main` dopo merge PR #30, commit `35c08b3`: Q02–Q12 integrate, 12 Q marcate [x] su 24, prossima Q13; PR #29 del collaboratore ancora aperta e conflittuale rispetto alla `main`.
- **Nuove funzioni integrate:** agenda, porte e interni NPC, ciclo giorno/notte, oggetto smarrito, acquisti, oggetti stradali, meteo, audio, guida 2.0, socialità e pendolare in scooter.
- **Test/CI verificati:** GitHub Actions «GTA Melito visual and campaign validation» superata sul merge `35c08b3`; diario del collaboratore riporta 251/251 test Node 22 e prove Chrome headless, non ripetuti in questa ricognizione.
- **Pubblicazione:** workflow custom «Publish Uns Arcade with GTA Melito stable and beta» superato sul commit `b85b179`; workflow Pages automatico parallelo fallito al deploy; custom workflow mantiene tre copie `gta-melito`, `gta-melito-stable`, `gta-melito-beta`.
- **Limiti:** impossibile aprire il sito pubblico nel browser/HTTP da questo ambiente (DNS `czekuns.github.io` non risolto e lettore Web non accessibile); nessuna prova visiva Android/PC reale eseguita qui.
- **Osservazioni:** la riga «Ultima esecuzione automatica» nella TODO è rimasta al checkpoint Q02, precedente al merge Q02–Q12; non rispecchia il nuovo stato delle checkbox. Q13–Q24 ancora aperte.
- **Da fare solo su nuova richiesta:** prova manuale dei tre URL, verifiche Android e revisione conflitti PR #29; le automazioni GTA restano spente finché l'utente non richiede di riattivarle.

### 2026-10-19 — ChatGPT/GitHub — Tre sprite urbani: Ape Car, furgone FRITTI, friggitore
- **Fatto:** realizzate tre PNG originali trasparenti top-down, stessa estetica GTA Melito: Piaggio Ape azzurra e cassone crema 88×132; furgoncino street food rosso/crema con segnaletica «FRITTI» 88×132; sprite sheet friggitore camice/cappello bianco 96×160, quattro direzioni e quattro pose per direzione.
- **Come/dove:** `assets/vehicles/{ape-car-top,furgone-fritti-top}.png`, `assets/people/friggitore-bianco-4dir-4frames-24x40.png`. Registrati come PNG con alpha reale in `car-sprites.mjs` (traffico e parcheggi) e nel nuovo `friggitore-sprites.mjs` (animazione). `city-art.mjs` e `game.mjs` assegnano a un pedone con routine preesistente il nuovo aspetto, preferibilmente vicino al furgone; posteggi di prova e veicoli NPC abilitati. `index.html` aggiornata a `game.mjs?v=152`; `car-sprites.mjs?v=107`, `city-art.mjs?v=128`.
- **Verifiche:** dimensione/trasparenza PNG e SHA blob Git confrontate con i file originali; visione delle sprite e confronto con gli asset già presenti; smoke JavaScript effettivo di sintassi, caricamento/draw e registri modelli/passante superato. Creato `friggitoria-art.test.mjs`. **Nessun test completo Node, browser in-game o Android reale eseguito** in questa sessione.
- **Da fare:** verificare in gioco inquadratura e posizione, eseguire la suite Node e controlli mobile. Le TODO **Q16/Q17 restano [ ]**: il lavoro attuale è una base grafica e integrazione standard, non include ancora fisica dell'Ape triciclo, varianti colore, sosta attiva, vendita né collaudi richiesti. Continuare per ordine senza attribuire il completamento al collaboratore.
- **Riferimenti:** main; PNG `852c33b` corretto e verificato con `c5d68e2`; `car-sprites.mjs` `edb47e1`; `friggitore-sprites.mjs` `7648d7a`; `city-art.mjs` `0ace2e9`; `game.mjs` `034555c`; pagina `c276bd7`; test `5ad5171`; dettaglio artistico nel `VISUAL_PROGRESS.md`.


### 2026-10-19 — ChatGPT/GitHub — Istituito il PIXEL ART MODUS per le prossime chat
- **Fatto:** creato `PIXEL_ART_MODUS.md` come guida operativa unica per edifici, persone e veicoli; collegato direttamente a `AGENTS.md` per renderlo obbligatorio a nuove chat e collaboratori.
- **Regole:** vista top-down/2.5D coerente, confronto con asset già approvati, master originale non distruttivo, ritaglio alpha autentico, allineamenti/pivot, atlanti animati, rendering esclusivo per monumenti, collisioni separate dall'immagine, prove sul telefono e tracciabilità del rilascio.
- **Caso Chiesa:** precisato come recuperare il retro troncato dal master originale e allargare il crop/riancorare il WebP senza riattivare il vecchio Canvas; **nessun asset della chiesa cambiato** in questa sessione.
- **File:** `PIXEL_ART_MODUS.md` (nuovo), `AGENTS.md` (link/istruzioni), `WORK_LOG.md` (questa voce).
- **Test e distribuzione:** intervento solo documentale; da verificare presenza dei file su GitHub dopo commit; test Node, browser e Android non eseguiti perché non sono state modificate funzioni di gioco.
- **Da fare:** riprendere la correzione del WebP della chiesa su un'attività dedicata, applicando il protocollo descritto; per ogni nuovo asset usare la checklist e i registri permanenti.


### 2026-10-19 — ChatGPT/GitHub — PIXEL ART MODUS: esempi apribili dalla guida
- **Richiesta:** rendere direttamente navigabili i campioni grafici, anziché menzionare soltanto nomi e percorsi degli asset.
- **Fatto:** aggiunta sezione «Esempi visivi e codice — link diretti» in `PIXEL_ART_MODUS.md`, con file PNG/WebP e renderer di riferimento per edifici, protagonista/NPC, personaggi speciali, Panda, Punto/Ypsilon, scooter/moto, Ape Car e furgone.
- **Verifiche:** controllata tramite l'albero GitHub l'esistenza di tutti i file grafici elencati. La versione WebP della chiesa è marcata come esempio **ancora da correggere** per il corpo posteriore; il master ImageGen non è nella repo, dunque non è stato creato un link fittizio.
- **File:** aggiornati solo `PIXEL_ART_MODUS.md` e questo `WORK_LOG.md`. Nessun PNG, modello, logica o cache alterati; nessun test browser o Android eseguito.
- **Da fare:** quando si correggerà il WebP della chiesa, archiviare anche la sorgente master verificata e aggiornare il collegamento a quell'originale.

### 2026-10-19 — ChatGPT/GitHub — Foglio 4×4 di 16 veicoli: Ape Car e ambulanti
- **Asset:** tavola ImageGen originale archiviata come `assets/vehicles/sources/ape-food-16-master.png` (1244×1265, RGBA); sedici ritagli con crop e alpha controllati, impaginati in un atlante indicizzato PNG 224×256 (celle 56×64, 96 colori, 19.999 byte) in `assets/vehicles/ape-food-16-rgba.png`.
- **Varianti:** prime 8 Ape (azzurro e verde rugginoso; vuoto, ferro, ortofrutta, pesce), ultime 8 furgoncini ambulanti (zeppole/panzerotti, pere/musso, panini, hot dog, cornetti, pizza a portafoglio, pizzette fritte, misto).
- **Integrazione:** `car-sprites.mjs` registra 16 ID e un atlas condiviso, `game.mjs` li usa nel repertorio dei parcheggi (apertura tende visibile solo in sosta); **traffico in marcia invariato**, fisica, numero NPC e campagne invariati. `index.html` game v153, import car-sprites v108; aggiunto `market-vehicles.test.mjs`, aggiornate asserzioni in due test esistenti.
- **Istruzioni:** PIXEL_ART_MODUS.md e VEHICLE_ART_GUIDE.md ora prescrivono come default uno sheet 4×4 da 16 (8+8), con esempi cliccabili.
- **Controlli locali effettivi:** verificata con PIL la presenza dell'alpha nei 16 ritagli e l'anteprima pixel a zoom; non risultano clip evidenti nello sheet compresso. **Suite Node completa, visita al browser e test su Android non eseguiti in questa sessione:** verificare CI/deploy successivi.
- **Limite artistico:** il banco grafico 'o pere e 'o musso ricorda ancora frutti di mare/fritti e non riproduce in modo convincente la specialità tradizionale; sostituire la variante mantenendo indice 9 quando possibile.
- **TODO:** Q16/Q17 non sono completate; restano fisica triciclo, soste commerciali/routine, vera modalità di marcia con tende chiuse e collaudo mobile.

### 2026-10-20 — ChatGPT/GitHub — Sheet NPC: friggitore, vigile, lavavetri, contrabbandiere
- **Fatto:** realizzato uno sheet RGBA `assets/people/npc-mestieri-4chars-4dir-4frames-24x40.png`, 384×160 con 16 colonne × 4 righe, 64 pose, e quattro sottosheet individuali 96×160.
- **Dettagli:** camice/cuffietta bassi bianchi del friggitore, divisa blu e berretto del vigile, secchio e tergivetro del lavavetri, borsello sotto ascella del contrabbandiere.
- **Verifiche locali eseguite:** Pillow: misura di PNG, alpha 0–255, 4 frame distinti per ciascuna delle 4 direzioni di ciascun personaggio, margine superiore non troncato e sfondo trasparente agli angoli. SHA Git blob dei file confrontati con PNG locali, corrispondono.
- **Codice/gameplay:** nessun runtime modificato; non dichiarare i nuovi NPC già presenti nel gioco. Rimane il friggitore storico già integrato. Node/browser/Android non eseguiti perché questa sessione ha consegnato solo asset grafici.
- **Documentazione:** aggiornato PIXEL_ART_MODUS.md con ordine delle celle, link e note per il prossimo incarico. Per attivarli creare un renderer/loader e routine di quartiere dedicate, senza toccare missioni, mappa e fisica incidentalmente.


### 2026-10-20 — ChatGPT/GitHub — Ape circolanti e professioni urbane (branch feat/gta-melito-street-professions-20261020)
- **Fatto:** aggiunta selezione deterministica di Ape (solo varianti senza tendalini) al traffico AI; aggiunti punti di vendita ambulante con veicolo parcheggiato e friggitore stabile; NPC vigile in ronda, lavavetri fermo vicino a incroci e contrabbandiere in passeggiata su strade secondarie.
- **Codice:** nuovi `street-professions.mjs`, `profession-sprites.mjs`, `street-professions.test.mjs`; integrazione in `game.mjs`, `city-art.mjs`, `roads.mjs`, `vehicle-entry.mjs`, cache `index.html` v154. Usati gli sprite PNG già approvati del PIXEL ART MODUS.
- **Geografia:** candidature in Piazza Santo Stefano, Piazza Immacolata, Corso Europa, Largo Cinque Via e Via Roma, con validazione dei punti contro area pedonale, carreggiata e veicoli esistenti. Allestimenti/personaggi **di fantasia**; la mappa OSM non censisce i semafori, quindi i lavavetri sono vicino a incroci selezionati senza affermare una corrispondenza reale.
- **Simulazione:** i friggitore e i lavavetri tornano lentamente alla loro posizione dopo impatti, senza teletrasporto in vista; gli altri personaggi percorrono i marciapiedi con routine locale già esistente. I furgoni con banco montato non possono essere guidati/rubati.
- **Test:** parser JS statico di `game.mjs`, `roads.mjs`, `city-art.mjs` e moduli nuovi riuscito; prova del selettore su geometria OSM semplificata ha individuato 4 posteggi candidati, 5 vigili, 7 lavavetri e 5 contrabbandieri in assenza delle auto parcheggiate reali. Suite Node completa, test browser su gioco pubblicato, Android e deployment **non eseguiti** al momento di questa voce; non attribuire i numeri della prova al gioco eseguito.
- **Da fare:** attendere verifica CI della PR; nel gioco controllare visibilità effettiva degli sprite, posizioni con parcheggi e edifici, caduta frame su Android e logica degli incroci. Verificare che almeno alcuni food truck siano effettivamente collocati; se la geometria respinge un sito mantenerlo vuoto.


### 2026-10-20 — ChatGPT/GitHub — Segnalazione bugfix e consegna backlog al collaboratore
- **Fatto:** registrata una coda di 6 bugfix prioritari BF01–BF06 distinta dalle 12 Q13–Q24 ancora aperte, dopo feedback diretto del tester (collisioni che incastrano, mezzi NPC e furgoni fermi in carreggiata, spazio sosta insufficiente, friggitore troppo lontano, accelerazione eccessiva, inversione pedali).
- **Dove:** nuovo `BUGFIX_TODO.md`, avviso di priorità in `TODO.md` e `AGENTS.md`, [issue #32](https://github.com/CzekUns/Effettokarmagra/issues/32) assegnata a `ilconsulentelogistico-hue`; comunicazione a issue #28.
- **Analisi di codice effettuata:** `vehicle-handling.mjs` contiene profili già esistenti ma accelerazione base 46; `roads.mjs` genera velocità AI fisse; `street-professions.mjs` piazza furgoni rispetto alla larghezza strada e il friggitore tramite offset lontani; `road-widths.mjs` allarga la carreggiata ma non garantisce piazzole di parcheggio.
- **Decisioni:** BF01 collisioni, BF02 fascia sosta, BF03 spawn traffico/vendor, BF04 ancoraggio friggitore, BF05 cambio automatico e caratteri per modello, BF06 ordine FRENO/ACCELERA touch; un BF per PR, niente merge diretto del collaboratore.
- **Verifiche:** lettura reale dei file e della coda GitHub; issue assegnata verificata. **Non eseguiti** test Node/browser/Android/deploy perché l'intervento registra solo bug e incarichi, non li corregge.
- **Prossimo passo:** avviare esplicitamente l'AI collaboratrice sul suo account leggendo issue #32; sviluppare BF01 e sottoporla a revisione, poi proseguire; Q13–Q24 non toccate.

### 2026-10-20 — Regola vincolante: primo sheet pedoni come reference per tutti i personaggi
- Su richiesta dell'utente è stato stabilito che **qualsiasi nuova generazione/variazione di personaggi deve iniziare aprendo visivamente** `assets/people/pedoni-4x4frames-24x40-rgba.png` della repository; il PNG è reference primaria di proporzioni, ombreggiatura, stile, scala, prospettiva e animazioni.
- Documentazione aggiornata in `PIXEL_ART_MODUS.md` e richiamo esplicito in `AGENTS.md` per gli altri agenti. Seconda tavola pedoni solo secondaria; vecchio friggitore e mestieri/PR #33 non approvati come modello artistico.
- Specificati formato 4 persone × 4 direzioni × 4 frame (384×160, cella 24×40), confronto visivo affiancato e blocco della generazione se il file originale non è accessibile.
- Intervento **solo di documentazione**: PNG/renderer/routine, deploy, CI e giocabilità invariati; test tecnici non eseguiti perché non sono stati modificati.


### 2026-10-20 — ChatGPT/GitHub — Nuova roadmap Q25–Q41: negozi, minigiochi, smartphone
- **Richiesta:** ampliare la coda dopo Q24 con negozi accessibili e acquisto interno, slot/video poker da bar, biliardo e goriziana, calcetto 5v5, gare auto fittizie, garage, tuning, smartphone con Drive e lavoro Rider.
- **Fatto:** create esattamente **17 nuove Q25–Q41** in `TODO.md`, tutte **[ ]** con requisiti, dipendenze, prove di accettazione; conservate Q01–Q24 e la priorità dei sei BF della issue #32. Aggiornate istruzioni in `AGENTS.md`, collegamento di precedenza in `BUGFIX_TODO.md` e handoff nella issue #28 (collaboratore `ilconsulentelogistico-hue`).
- **Verifica iniziale:** `local-shops.mjs`/`game.mjs` oggi aprono negozi e acquisti dall'esterno, `bank-interior.mjs` ha sala 160×120; Q25 propone un locale circa 80×60 (1/4 area) o 64×50 (1/6 area), con stessa scala e camera della banca.
- **Progettazione:** app PAUSA/Start smartphone con vecchie funzioni accessibili in Impostazioni → Sviluppatore; app Drive con POI/strade OSM e preferiti; Rider con ritiro, cubo giallo, percorso, timer/freschezza, recensioni persistenti. I giochi arcade sono fittizi, senza denaro reale; nessun campo, slot o luogo di gara viene attribuito come esistente senza conferma.
- **Test/stato:** solo modifiche di documentazione e istruzioni; numerazione Q01–Q41 verificata prima del commit. **Non eseguiti** suite Node, test browser, Android o deploy, né è stata implementata alcuna delle nuove Q.
- **Ripresa:** il collaboratore completa BF01→BF06, poi Q13→Q24, infine Q25→Q41, **una PR per task**. Nessun incarico assegnato significa avvio autonomo della sessione AI esterna.

### 2026-10-20 — Claude (account `ilconsulentelogistico-hue`) — BF01 collisioni NPC/giocatore senza blocchi irreversibili
- **Riprodotto prima di correggere** (Chrome headless, guida automatica che insegue le auto NPC per 3 minuti e urti scriptati): fino a 2–3 coppie di veicoli compenetrati, NPC fermi in vista per oltre 10 s dopo un urto ("in recupero" o dentro un'auto parcheggiata), giocatore fermo a lungo; dopo un tamponamento/frontale/laterale l'NPC non ripartiva in nessuno dei tre casi.
- **Cause:** `advanceNonlethalImpact` usava `canKnockbackMove`, che controllava solo i muri: la spinta portava un veicolo dentro un altro; `restoreAgentRoutine` e `carBlocked` del giocatore rifiutavano ogni mossa che toccasse ancora l'altro corpo, anche quella che li separava; due auto che si bloccano a vicenda all'incrocio aspettavano per sempre; il riposizionamento fuori vista di un'auto ferma (vicoli ciechi a senso unico) poteva fallire per sempre; **un'auto NPC urtata restava a velocità 0 per sempre** (`applyNonlethalImpact` la azzera e nessuno la ripristinava), anche dopo essere tornata in corsia: era il caso delle auto ferme in mezzo alla strada dopo un urto.
- **Correzioni:** `traffic-collision.mjs`: sagome per modello (Ape e furgoni misurati sui PNG con lo stesso rapporto dell'auto di riferimento; larghezza auto invariata a 3,4 perché sulle service le corsie distano 4,6), `vehicleSeparation` (spinta minima per uscire da una sovrapposizione), `trafficMoveBlocker` (chi blocca) e regola di contatto: tra due veicoli già a contatto è permessa solo la mossa che riduce davvero la sovrapposizione; il modello viaggia con ogni posa controllata. `roads.mjs`: `unstickVehicle` (un'auto NPC compenetrata scivola fuori un poco alla volta, mai dentro un muro, e non riparte finché non è libera), recupero dopo urto con mosse di separazione e direzione della corsia, retromarcia di cortesia di 2,5 m per l'auto che cede quando due si bloccano a vicenda per oltre 2,5 s, riposizionamento fuori vista con limite di quartiere allentato dopo due tentativi falliti. `game.mjs`: `carBlocked` lascia sempre separare l'auto del giocatore da un veicolo che tocca; `canKnockbackMove` ferma la spinta contro gli altri veicoli. `impact-physics.mjs` ricorda la velocità di crociera dell'auto urtata (`resumeSpeed`) e `stepAgent` la ripristina quando l'auto è di nuovo in corsia.
- **Cache:** `game.mjs?v=155`, `roads.mjs?v=147`, `traffic-collision.mjs?v=127`, `impact-physics.mjs?v=003`, `npc-commute.mjs?v=002`.
- **Test:** nuovo `bf01-collisions.test.mjs` (9 test: separazione, sagome Ape/furgoni, NPC spinto su un'auto in sosta che si libera e riparte, recupero partendo dentro un altro corpo, spinta che si ferma contro un'auto, blocco reciproco all'incrocio risolto senza compenetrazioni, nessuna spinta nel muro, auto urtata che riparte alla sua velocità, cablaggio); resi robusti 2 controlli di versione in `friggitoria-art`/`market-vehicles`; suite **273/273**.
- **Browser (Chrome headless, dopo):** prova di stress 3 minuti: compenetrazioni massime **0**, nessun NPC fermo in vista per urti o recupero, 15 fughe su 16 riuscite (l'unica "trappola" era il rimbalzo di 0,26 s, avanti e dietro liberi); tamponamento/frontale/laterale: il giocatore riparte sempre (retro ~20 m in 2 s), gli NPC dopo frontale e laterale ripartono (11 e 29,5 m in 5 s). Con `resumeSpeed`, rifatte: stress 180 s con 59 urti, 0 compenetrazioni, 0 NPC fermi in vista, 14/14 fughe, 0 errori JS; l'NPC urtato riparte in tutti e tre gli urti (5 s: tamponamento 69,9 m, prima 0; frontale 17,7 m; laterale 68,4 m).
- **Telefono (Chrome headless 844×390, tocchi veri sui pedali), auto e moto:** NPC che arriva di fronte tenendo ACCELERA, poi RETRO e di nuovo ACCELERA: 0 compenetrazioni in tutte le fasi, RETRO allontana il mezzo (auto 24 m, moto 8,5 m in 2 s); in auto l'NPC viene urtato e riparte da solo (15 m negli 8 s seguenti), in moto frena davanti allo scooter senza toccarlo e poi riparte (21 m); si scende dal mezzo normalmente.
- **Limiti:** larghezza di collisione delle auto più stretta dello sprite (scelta per le corsie strette); auto in sosta che invadono la corsia restano ostacoli fissi (BF02/BF03); non provato su telefono reale.
- **Da fare:** BF02 e BF03 (in lavorazione), poi pubblicazione di BF04–BF06 già pronti.

### 2026-10-20 — Claude (account `ilconsulentelogistico-hue`) — BF02 fascia di sosta tra corsia e marciapiede
- **Prima (misurato sulla mappa reale, Chrome headless):** 138 veicoli in sosta generati con un offset fisso dal centro strada (`max(4,1; larghezza/2 + 2,2)`): **26 dentro la sagoma spazzata di una corsia** (fino a 1,69 m; la Panda di partenza su Via Roma 1,36 m), **109 sulla linea dei pedoni**, 1 davanti a una porta; i food truck sul marciapiede.
- **Geometria:** nuovo `parking-bays.mjs`. Per ogni tratto carrabile del grafo OSM la fascia sta tra la corsia (offset corsia + 1,7 + 0,25 m) e la linea dei pedoni (larghezza/2 + 1,7 − 0,45 m); dove c'è più spazio l'auto resta tutta sull'asfalto. Calcolata sulle larghezze visive già esistenti (`road-widths.mjs`): nessuna sagoma/ID OSM, POI o distanza cambia. Stalli da 7,2 m scartati se toccano la corsia di un altro tratto, la linea dei pedoni (anche nelle curve, con una corda prudente), le strisce pedonali disegnate (≥1 m) o un nodo d'incrocio (≥12 m), muri e bordo mappa (`carBlocked`), negozi (6 m) e ingressi banca (9 m). Fallback: strade di servizio (larghe 10), vicoli e living street non hanno posto → nessuna sosta. Mappa reale: **7.138 stalli in 1.083 fasce**; scarti: corsia 2.743, pedoni 1.170, incroci/strisce 320, ingressi 73, muri 880.
- **Integrazione (`game.mjs`):** le fasce si costruiscono prima di ogni veicolo; Panda e scooter di partenza, scooter, auto, Ape e furgoni in sosta prendono solo stalli liberi (`nearestFreeStalls` + `parkInStall`), sulla stessa strada e vicino al punto scelto come prima; i food truck si piazzano per primi con `vehicleOffset:bayOffset` e il controllo `fitsParkingBay` (in `street-professions.mjs` cambiano solo 3 righe). Bidoni e paletti non finiscono negli stalli. Al confronto larghezze strade le fasce si ricostruiscono (wide 1.083 → before 93 → wide 1.083).
- **Pedoni:** un veicolo ancora nella sua baia ha accanto la linea dei pedoni a ≥0,45 m; `traffic-collision.mjs` usa per lui un margine pedone di 0,4 m (`BAY_PEDESTRIAN_PAD`, `inParkingBay`) invece di 0,8, così il marciapiede resta percorribile. Se un urto o un guidatore lo sposta, torna un ostacolo normale.
- **Disegno:** `drawParkingBays` nelle tessere statiche dopo l'asfalto e prima degli edifici (mai sopra i tetti) e nel "tetto svelato": asfalto della baia, golfo nel bordo chiaro sulle residenziali con cordolo e raccordi, linee bianche degli stalli.
- **Cache:** `game.mjs?v=156`, `traffic-collision.mjs?v=128`, `roads.mjs?v=148`, `resident-routines.mjs?v=006`, `impact-physics.mjs?v=004`, `npc-commute.mjs?v=003`, `street-professions.mjs?v=002`, nuovo `parking-bays.mjs?v=001`.
- **Test:** nuovo `parking-bays.test.mjs` (7 test: offset per tipo di strada e fallback, clearance di tutti gli stalli della mappa reale da corsie, pedoni, strisce e tra loro con geometria indipendente, determinismo e niente stalli con muri/ingressi/strade strette, stalli liberi e scooter accanto alla Panda, 60 s di traffico e pedoni accanto a fasce piene senza nessun blocco, food truck dei 5 quartieri sulla linea della baia, cablaggio). Aggiornati 2 controlli di cablaggio (`motorcycle-parking`, `vehicle-entry`) che cercavano il vecchio posizionamento sul marciapiede. Suite **280/280**; con il margine pedone a 0,8 tre test BF02 falliscono.
- **Browser dopo (Chrome headless):** 122 veicoli in sosta (61 a due ruote, 5 food truck): **0 in corsia** (minimo 0,25 m), **0 sulla linea dei pedoni** (minimo 0,51 m), 0 davanti a porte, negozi o banca. Dopo 30 s: 0 auto NPC ferme dietro un veicolo in sosta, 0 pedoni fermi accanto a un veicolo in sosta; lo scooter del pendolare Q12 parte (TO_BIKE → PULL_OUT → RIDE). Prova di stress di BF01 ripetuta su questo ramo (3 min di guida automatica): compenetrazioni massime 0, 9 fughe su 9, l'unico NPC fermo in vista aspettava dietro l'auto del giocatore. Screenshot A/B su Via Roma, Piazza Santo Stefano, Corso Europa e una residenziale. Nessun errore JavaScript a parte il favicon 404.
- **Limiti:** 122 veicoli in sosta invece di 138 (dove non c'è posto non se ne generano); le piazze fatte di tratti cortissimi hanno pochi stalli e il food truck di Piazza Santo Stefano sta su Via Roma, a circa 120 m; la sagoma disegnata delle auto è più larga della collisione, quindi sulle residenziali un'auto che passa può sfiorare graficamente un'auto in sosta; lo scooter del pendolare Q12 continua a usare il suo punto di sosta (`kerbSpot`); non provato su telefono reale.
### 2026-10-20 — Claude (account `ilconsulentelogistico-hue`) — BF03 parte traffico: solo veicoli davvero in viaggio, su corsie con un'uscita
- **Riprodotto prima di correggere** (main, Chrome headless, traffico appena caricato): 0 sovrapposizioni tra sagome intere (già evitate), ma **19 auto su 140 nate su catene di sensi unici che finiscono in un capolinea senza uscita**, 25 su tratti senza vera via d'uscita, 28 con la sagoma dentro un incrocio, 2 con un angolo dentro un edificio; dopo 30 s 3 auto ferme a un capolinea (7 sulla base BF01). In Node, sulla mappa reale e senza il recupero fuori vista, in 60 s 43 auto restavano ferme: 18 al capolinea di un senso unico, le altre in coda dietro di loro o agli incroci.
- **Cause:** `createAgents` controllava solo il centro del mezzo (modello assegnato dopo, in `game.mjs`), non gli incroci, il giocatore e i muri; il controllo «ha un'uscita» guardava un solo tratto avanti, quindi una catena di sensi unici che porta a un capolinea sembrava percorribile, sia allo spawn sia a ogni svolta.
- **Correzioni:** `roads.mjs`: `liveCarEdges` marca come trappola ogni arco auto da cui tutte le strade finiscono in un capolinea (l'inversione a U in fondo a una via a doppio senso resta valida); `throughStarts` e `hasThroughExit` non contano le trappole; `chooseTurn` non manda un'auto in una trappola quando ha un'alternativa; `createAgents` accetta il modello (`settings.model`) prima dei controlli, tiene la sagoma intera fuori dagli incroci (mezza larghezza della via più larga + mezza lunghezza + 1,5 m), dai mezzi con 0,5 m di margine, dai punti `keepClear` e dai muri (`settings.clear` sui 6 punti della sagoma), con 40 tentativi deterministici; se non c'è posto il mezzo non nasce. Il blocco reciproco di BF01 vale ora anche per anelli di 3–4 auto (`yieldsInGridlock`): cede quella col seme più alto; se dietro non ha spazio, la volta dopo cede la successiva. `game.mjs`: un solo `createTraffic()` al caricamento e al cambio di larghezza strade, con modello, giocatore (14 m) e `buildingAt`.
- **Cache:** `game.mjs?v=156`, `roads.mjs?v=148` (anche in `npc-commute.mjs`), `npc-commute.mjs?v=003`.
- **Test:** nuovo `bf03-spawn.test.mjs` (8 test: sulla mappa reale spawn deterministico, 0 collisioni iniziali, mai su trappole né dentro gli incroci, nessun food truck a banco aperto, rispetto di mezzi in sosta, giocatore e muri; un minuto di traffico senza nessuna auto ferma a un capolinea e ogni mezzo, furgone fritti e Ape compresi, che percorre più di 20 m; mappa di prova con catena a senso unico e via la cui unica uscita è una trappola; anello di tre auto; cablaggio). Suite **281/281**.
- **Browser (Chrome headless, prima → dopo):** spawn su trappole 19 → 0, angoli in un edificio 2 → 0, sagoma sull'incrocio 28 → 2 e senza vera uscita 25 → 1 (misurati qualche fotogramma dopo il caricamento, quando le auto si sono già mosse; al momento dello spawn sono 0 nel test Node); sovrapposizioni 0 → 0; auto al capolinea dopo 30 s 3 (BF01: 7) → 0 e dopo 90 s BF01 5 → 0; auto ritirate fuori vista perché ferme da 8 s in 90 s: BF01 42 → 4; 0 auto ferme in vista per più di 10 s; 0 salti visibili. Guida continua 60 s lungo le strade: 1430 m, nessuna sosta di 3 s, 2 manovre (BF01: 1399 m). Cambio larghezza (PRIMA 7,0 e ADESSO 15,4): 140 mezzi, 0 sovrapposizioni, 0 su trappole, 0 angoli negli edifici. Nessun errore JS (escluso il 404 della favicon).
- **Limiti:** in Node, senza recupero fuori vista, dopo 60 s restano 12 auto ferme (BF01: 43), tutte in coda agli incroci: le auto si accodano a paraurti contro paraurti, quindi chi davanti svolta stretto o fa inversione tocca chi segue. Una distanza di accodamento pari alle due mezze lunghezze + 2 m le porta a 8 (in 120 s da 43 a 23), ma è la riga della velocità NPC che cambia BF05 e non è inclusa qui. La rete OSM è spezzata in 219 parti non collegate: nei quartieri chiusi le auto vanno avanti e indietro con l'inversione. Sosta e food truck parcheggiati restano a BF02/BF04. Non provato su telefono reale.

### 2026-10-20 — Claude (account `ilconsulentelogistico-hue`) — BF04 friggitore attaccato al banco del suo food truck
- **Fatto:** il friggitore non viene più cercato a 6,7–8,3 m davanti/dietro il furgone, ma ancorato al lato di servizio reale dello sprite. BF04 non spuntato in `BUGFIX_TODO.md` (in revisione), stato annotato sotto la voce.
- **Come:** `street-professions.mjs`: tabella `SERVICE_SIDES` misurata sui PNG (8 celle `food-*` e `furgone-fritti`: banco sul lato destro dello sprite, che il gioco disegna ruotato di angle+π/2, quindi verso (−sin a, cos a)); `fryerServicePose` (0,6 m oltre il bordo del banco, a metà banco, rivolto verso di esso); `servicePavementHeading` gira il furgone sul lato −1 della via perché il banco guardi il marciapiede; candidati solo lungo il banco (0, ±0,9 m) e a 0,6/0,9 m; se nessuno è valido il posto viene scartato (né furgone né friggitore). `roads.mjs`: un figurante fermo tornato al suo posto riprende l'orientamento salvato (`post.a`).
- **Cache:** `game.mjs?v=155`, `street-professions.mjs?v=002`, `roads.mjs?v=147`.
- **Test:** `street-professions.test.mjs` +4 test (lato di servizio per ogni modello e 5 angoli, banco verso il marciapiede su entrambi i lati della via, nessun friggitore senza posto valido, ritorno al posto con orientamento); tolto il vecchio controllo «più di 5,8 m dal centro», che descriveva il difetto; `market-vehicles` e `friggitoria-art`: controllo di versione reso «almeno v=154». Suite Node 22 **268/268**.
- **Browser (Chrome headless, mappa reale, 5 furgoni):** prima 8,9–9,4 m dal centro e in 4 casi su 5 dal lato opposto al banco; dopo 4,31–4,44 m dal centro, 0,6 m oltre il bordo del banco, orientamento verso il banco (coseno 0,96–0,99), su punto camminabile, fuori dalla sagoma e più lontano dalla carreggiata del furgone; foto ravvicinate prima/dopo; nessun errore JS.
- **Non eseguiti / limiti:** telefono reale. Fuori dal BF04 (da BF02/BF03): il furgone di Piazza Santo Stefano sta sull'asfalto della piazza; nella versione precedente a Largo Cinque Via un'auto parcheggiata si sovrapponeva al furgone.
### 2026-10-20 — Claude (account `ilconsulentelogistico-hue`) — BF05 cambio automatico arcade e prestazioni per modello
- **Fatto:** le auto non «schizzano» più: partenza morbida da fermo, spinta piena dopo i primi metri, calo verso la velocità massima e cambi marcia impliciti (attenuazione breve della spinta, mai salti di velocità); profili diversi per modello; Ape e furgoni più lenti; gli NPC usano la stessa spinta e ripartono piano dopo ogni sosta.
- **Come:** `vehicle-handling.mjs` (`driveForce`, `gearAt`, `npcCruise`, `npcSpeedStep`, profili `APE_HANDLING`/`VAN_HANDLING` e per modello; RETRO e gas in senso opposto frenano prima di invertire; bagnato: trazione ridotta in partenza, frenata più lunga); `roads.mjs`: velocità delle auto NPC tramite il profilo del modello (`agent.v`), solo nel passo delle auto.
- **Curve a gas tenuto (Node, 60 fps, unità del gioco; HUD ×3,6 = km/h):**

| modello | 0,25 s | 1 s | 2 s | 5 s | 10 s | max | 0→20 | frenata da 20 |
|---|---|---|---|---|---|---|---|---|
| Panda moderna | 1,4 | 9,2 | 19,3 | 34,4 | 39,0 | 39 | 2,1 s | 4,0 m |
| Panda Fire | 1,0 | 6,7 | 15,0 | 29,3 | 34,8 | 35 | 2,8 s | 4,6 m |
| Punto | 1,6 | 10,7 | 21,5 | 36,9 | 41,0 | 41 | 1,8 s | 3,8 m |
| Ypsilon | 1,5 | 9,9 | 20,3 | 35,6 | 40,0 | 40 | 2,0 s | 4,0 m |
| Uno | 1,0 | 6,3 | 14,5 | 29,2 | 35,4 | 36 | 2,8 s | 4,8 m |
| Smart | 1,2 | 7,8 | 16,4 | 29,8 | 34,0 | 34 | 2,5 s | 4,0 m |
| Seicento | 1,2 | 7,4 | 15,9 | 29,9 | 35,0 | 35 | 2,6 s | 4,4 m |
| Fiat 500 | 1,3 | 8,3 | 17,7 | 32,2 | 37,0 | 37 | 2,3 s | 4,0 m |
| Ape | 0,6 | 4,0 | 8,7 | 15,4 | 17,0 | 17 | — | 4,4 m |
| Furgone fritti | 0,8 | 4,9 | 11,6 | 22,3 | 26,0 | 26 | 4,0 s | 5,1 m |
| Scooter | 1,8 | 9,3 | 16,9 | 25,6 | 27,0 | 27 | 2,6 s | 4,2 m |
| Moto | 2,7 | 14,4 | 25,3 | 35,8 | 37,0 | 37 | 1,5 s | 3,4 m |

  Prima del BF05 l'auto faceva 0→20 in 0,45 s e arrivava a 38 in 2 s.
- **Test:** nuovo `transmission.test.mjs` (6 test: partenza morbida e niente salti per tutti i modelli, ordine di spunto, Ape/furgoni più lenti, cambi impliciti, frenate e bagnato, RETRO/gas invertiti, NPC che ripartono piano e Ape lenta, cablaggio). Aggiornati con motivazione: `driving-controls.test.mjs` (prima chiedeva 38 in 2 s, ora partenza morbida, città in 2 s, punta entro 10 s), `traffic-collision.test.mjs` (attraversamento dell'incrocio in 7 s invece di 3, perché si riparte da fermi), versioni in `friggitoria-art`/`market-vehicles` rese «almeno». Suite Node 22 **270/270**.
- **Browser (Chrome headless, tasti veri):** Panda moderna 0,3 → 20,9 in 2,5 s → 32,8 a 5 s; Uno 30,2 a 5 s; Ape 13,8 a 5 s; RETRO durante la corsa frena e poi arretra; telefono 844×390 con tocco tenuto su ACCELERA 1,1 → 28,7 in 3 s; 140 auto NPC, ripartenze dolci osservate, Ape del traffico a 6,1 di crociera; nessun errore JS.
- **Cache:** `vehicle-handling.mjs?v=002`, `driving-controls.mjs?v=097`, `motorcycles.mjs?v=005`, `roads.mjs?v=147`, `npc-commute.mjs?v=002`, `bank-interior.mjs?v=007`, `game.mjs?v=155`.
- **Non eseguiti / limiti:** telefono reale; valori di guida da rifinire a sensazione; audio del motore (Q09) ancora legato solo alla velocità, non alla marcia.
- **Da fare:** revisione della PR BF05; BF06 a seguire.
### 2026-10-20 — Claude (account `ilconsulentelogistico-hue`) — BF06 pedali touch: FRENO sopra, ACCELERA sotto
- **Fatto:** invertiti freno e acceleratore nella colonna touch di guida: dall'alto **FRENO → ACCELERA → RETRO**, come richiesto in `BUGFIX_TODO.md` (BF06). Il BF resta `[ ]` fino a merge/QA.
- **Come:** `index.html` (ordine dei tre pulsanti nel blocco `.pedals`, commento CSS e istruzioni per il telefono); `AGENTS.md` e `README.md` aggiornati al nuovo ordine; `steering-wheel.test.mjs` aggiornato e nuovo test BF06 (ordine DOM = ordine a schermo, ID/testi/aria-label/colori invariati, nessun riordino CSS, collegamenti `accelerator/brake/reverse` invariati). Nessun modulo `.mjs` cambiato, quindi nessuna versione cache da alzare.
- **Test:** suite Node 22 **265/265**.
- **Browser (Chrome headless, telefono 844×390 touch, prima/dopo):** prima ACCELERA y=172, FRENO 242; dopo FRENO 172, ACCELERA 242, RETRO 312. Con tocchi veri: ACCELERA porta l'auto a 38,3, FRENO la ferma a 0 senza retromarcia, RETRO −12 solo mentre premuto; due dita insieme su volante e ACCELERA funzionano; la pausa non lascia ACCELERA premuto; in banca i pedali spariscono e risalendo in auto l'ordine resta giusto; nessuna sovrapposizione con minimappa, missioni, volante, pausa, radio e pulsante azione; nessun errore JS.
- **Non eseguiti / limiti:** telefono Android reale.


### 2026-10-20 — Claude (account `ilconsulentelogistico-hue`) — BF07 incroci con buon senso e semafori visibili (richiesta del committente)
- **Richiesta (Simone, 20/10):** «serve la logica di buon senso per gli incroci. semafori visibili e lavavetri ai semafori che fanno routine sulle auto ferme avvicinandosi al lato guida». Questa voce copre incroci e semafori; i lavavetri sono BF08. Copre in parte anche la Q22 (riga di stato in `TODO.md`).
- **Prima:** nessuna regola agli incroci. Le auto entravano tutte insieme e si fermavano solo quando si toccavano; nessun semaforo, nessuna freccia. Gli incastri li scioglievano solo il recupero di BF01 e lo spostamento fuori vista.
- **Semafori SIMULATI, dichiarati:** `data/melito-map.json` non ha nodi `highway=traffic_signals` e dal server Overpass non risponde. Quindi i semafori sono posizionamenti di gioco: 8 sugli incroci principali, scelti con una regola (almeno 3 accessi, una strada terziaria o maggiore, nessun altro incrocio entro 20 m, almeno 130 m fra due semafori). `SIGNALS_SIMULATED`/`SIGNAL_NOTE` in `junctions.mjs`, README e una riga nella scheda PAUSA lo dicono: non sono i semafori reali di Melito.
- **Logica (`junctions.mjs`, `roads.mjs`):**
  - ogni auto e moto del traffico calcola il prossimo incrocio sul percorso che farà davvero (stesse svolte di `nextPose`, sul seme copiato);
  - linea d'arresto dopo le strisce. Rosso: si ferma. Giallo: si ferma se ha lo spazio, altrimenti passa;
  - non impegna l'incrocio se all'uscita non c'è posto per tutta la sagoma;
  - un permesso per manovra: le traiettorie in conflitto passano una alla volta, i dritti opposti insieme;
  - senza semaforo: precedenza al rango della strada, a parità a destra; chi gira a sinistra cede a chi arriva di fronte. Fra mezzi fermi passa chi aspetta da più tempo, e dopo 6 s si passa comunque se incrocio e uscita sono liberi;
  - chi è già oltre la linea libera sempre l'incrocio; un permesso inutilizzato scade dopo 5 s;
  - chi aspetta al rosso, e chi è in coda dietro di lui, non conta come «fermo» per il recupero fuori vista;
  - frecce degli NPC negli ultimi 30 m prima della svolta;
  - i pedoni che vanno dritti a un incrocio con semaforo aspettano sul cordolo (a r+1 m dal nodo) il verde della propria via.
- **Grafica (`traffic-light-art.mjs`, `game.mjs`):**
  - palo e lanterna in pixel art procedurale come i lampioni, sul marciapiede all'angolo destro di ogni accesso (21 pali), mai in un edificio, sulla carreggiata o addosso a lampioni e auto in sosta;
  - tre luci, quella accesa con un bordo luminoso; di notte alone colorato e riflesso sull'asfalto;
  - linea d'arresto bianca solo sulla corsia usata;
  - frecce ambra sugli spigoli del lato della svolta, circa 1,5 Hz.
  - Nessun nuovo PNG.
- **Base:** ramo `integ` (BF01–BF06 insieme). La velocità degli NPC resta quella di BF05: la linea d'arresto limita solo la velocità obiettivo prima di `npcSpeedStep` e il passo massimo; le decisioni usano la velocità vera `agent.v`.
- **Cache:** `game.mjs?v=158`, `roads.mjs?v=149` (anche in `npc-commute.mjs`), `npc-commute.mjs?v=004`; nuovi `junctions.mjs?v=001` e `traffic-light-art.mjs?v=001`.
- **Test:** nuovo `bf07-junctions.test.mjs`, 10 test:
  - fasi deterministiche, mai verde su entrambi gli assi, tutto rosso di sgombero;
  - coda al rosso e partenza al verde in ordine;
  - chi è già oltre la linea libera l'incrocio;
  - precedenza a destra;
  - rango che batte la destra;
  - uscita occupata → attesa prima della linea;
  - quattro auto insieme senza incidenti e senza attese oltre 12 s;
  - frecce;
  - pedone al semaforo;
  - mappa reale: 6–12 semafori, cablaggio (anche: chi aspetta alla linea non urta i pedoni), nota PAUSA, README.

  Suite **309/309** su `integ`.
- **Node, mappa reale, 140 mezzi, prima → dopo:**
  - con recupero fuori vista (180 s): km percorsi 267 → 265, ritiri 20 → 23, compenetrazioni 0 → 0, passaggi col rosso 0;
  - senza recupero (120 s, caso peggiore): auto ferme da oltre 20 s 41 → 19–27 (dipende dal giro).
- **Browser** (Chrome headless, 3 minuti: 90 s a piedi accanto al semaforo di Largo Cinque Via, poi 90 s di guida automatica dal punto di partenza), base `integ` → BF07:
  - compenetrazioni 0 → 0;
  - salti visibili 0 → 1 (un ritorno dopo un urto del giocatore, meccanismo di BF01);
  - ritiri fuori vista 54 → 58;
  - auto ferme in vista oltre 10 s senza rosso 0 → 2;
  - code al rosso fino a 5 mezzi, 0 passaggi col rosso, 0 errori JS;
  - guida automatica 1.510 → 1.169 m: le code ai semafori fermano anche il giocatore, che resta libero di aggirarle.

  Foto: giorno, notte con pioggia (`?ora=21:30`) e telefono 844×390. I semafori si leggono; la coda al rosso è ferma alla linea e si vede la freccia di un'auto che svolta.
- **Correzione emersa dalle prove:** in `impactTraffic` un'auto NPC «bloccata» spingeva in avanti i pedoni che aveva davanti. Ora non lo fa più se aspetta alla linea (rosso, precedenza) o è in coda dietro una che aspetta: chi attraversa sulle strisce davanti alle auto ferme non viene urtato.
- **Limiti:**
  - semafori non rilevati: vanno sostituiti con dati OSM veri se arriveranno;
  - lo scooter dei pendolari (Q12) non rispetta semafori e precedenze;
  - i pedoni aspettano solo agli incroci con semaforo e solo quando vanno dritti;
  - la rete OSM spezzata (strade che si incrociano senza nodo comune) resta senza regole e la gestisce il recupero;
  - i pali non hanno collisione, per non bloccare il giocatore;
  - nessuna prova su telefono reale.
- **Da fare:** BF08 (lavavetri ai semafori).


### 2026-10-20 — Claude (account `ilconsulentelogistico-hue`) — BF08 lavavetri ai semafori, al finestrino del lato guida (richiesta del committente)
- **Richiesta (Simone, 20/10):** «lavavetri ai semafori che fanno routine sulle auto ferme avvicinandosi al lato guida». Parte da BF07, che ha messo i semafori di gioco.
- **Prima:** 7 lavavetri **fermi** accanto a incroci qualsiasi, senza nessuna azione.
- **Ora (`window-washers.mjs`, `street-professions.mjs`):**
  - un lavavetri per ciascun semaforo di gioco con spazio a sinistra delle auto (corsia ad almeno 2,7 m dalla mezzeria): 7 sulla mappa;
  - sta sul marciapiede accanto al palo;
  - col rosso, quando la prima auto della coda è ferma da 1 s e il rosso che resta basta per arrivare e lavare, passa davanti al paraurti sulle strisce, risale il fianco sinistro e si ferma al finestrino del **lato guida**;
  - lava il parabrezza 3–6 s, poi torna sul marciapiede per la stessa strada;
  - al giallo o al verde, o se l'auto si muove, rientra subito; l'auto davanti alla quale ripassa lo aspetta;
  - fa lo stesso con l'auto del giocatore se è la prima ferma al rosso; ignora moto e scooter;
  - fumetti rari («Pulisco il vetro?», «Grazie, capo!»);
  - se lo urtano lascia la routine e torna al suo posto con la logica dei mestieri.
- **Gioco (`game.mjs`, `roads.mjs`):**
  - la routine va avanti dopo il traffico dello stesso passo;
  - il recupero «torna al palo» dei mestieri lascia stare il lavavetri al lavoro (`agent.scripted`);
  - le auto NPC non lo urtano mentre lavora (in `impactTraffic`);
  - quando sta davanti all'auto (più in basso sullo schermo) si disegna sopra di lei;
  - tergivetro animato sul vetro dal lato guida;
  - sprite esistente, fermo durante il lavaggio.
- **Cache:** `game.mjs?v=159`, `roads.mjs?v=150` (anche in `npc-commute.mjs`), `npc-commute.mjs?v=005`, `street-professions.mjs?v=004`; nuovo `window-washers.mjs?v=001`.
- **Test:** nuovo `bf08-washers.test.mjs`, 7 test, che falliscono senza la correzione:
  - posti sulla mappa reale: accanto ai pali, oltre il cordolo, uno per incrocio;
  - routine completa: lato guida, al finestrino, 3–6 s di lavaggio, di nuovo sul marciapiede, mai davanti a un'auto che si muove, auto ripartita col verde;
  - rosso insufficiente → resta sul marciapiede;
  - moto ignorate;
  - auto del giocatore;
  - auto che si sposta prima → torna indietro senza lavare;
  - cablaggio.

  Suite **316/316** su `integ` + BF07.
- **Browser (Chrome headless, mappa reale):**
  - su un'auto NPC ferma al rosso in Via Signorelli: fasi complete, sempre sul lato sinistro, mai dentro un'auto, lavaggio 4,4 s, di nuovo esattamente al suo posto, l'auto riparte col verde;
  - sull'auto del giocatore in Corso Europa: giro completo dal lato guida;
  - stesso esito su PC e su telefono 844×390; 0 errori JS.
  - Prima della correzione in `impactTraffic`, un'auto NPC «bloccata» dal lavavetri lo spingeva via quando ripassava davanti a lei: ora lo aspetta.
- **Limiti:**
  - sprite dei mestieri ancora «da rivedere» secondo PIXEL_ART_MODUS: niente frame dedicati al lavaggio, solo il tergivetro disegnato;
  - nessuna mancia o denaro per il giocatore;
  - un solo lavavetri per semaforo e solo la prima auto della coda;
  - le figure sono grandi rispetto alle auto, quindi al finestrino il lavavetri sovrappone un poco la carrozzeria (si disegna sopra o sotto secondo chi sta davanti);
  - non provato su telefono reale.
- **Da fare:** revisione e merge di BF07 e BF08; frecce e semafori per lo scooter dei pendolari (Q12/Q22).
### 2026-10-20 — Claude (account `ilconsulentelogistico-hue`) — BF09 varchi di confine: sparizione controllata e taglio delle strade
- **Richiesta del committente:** le strade che finiscono in un altro comune e le aree nere diventano punti di sparizione controllata delle auto NPC, da usare in futuro per collegare nuove mappe; le strade non devono più finire arrotondate sul confine.
- **Prima (Chrome headless, 3 minuti di gioco):**
  - 70 estremità di strade carrabili sul confine;
  - 24 inversioni a U al confine e 1 salto visibile, cioè lo scambio di corsia dell'inversione;
  - 9 sensi unici in uscita dal comune erano capolinea (BF03 li trattava come trappole);
  - le strade finivano con mezzo cerchio di asfalto e marciapiede sopra l'area nera.
- **Correzione:**
  - Nuovo `border-gates.mjs`. `findBorderGates` trova i varchi: un nodo con un solo vicino carrabile a ≤ 1,5 m dal confine ISTAT. Ognuno ha `id` stabile (`osmWay@x,y`), angolo verso l'esterno, strada, tipo, OSM way e sensi (`entrata`, `uscita`, `entrambi`).
  - `borderGateList` (in gioco `state.borderGates`) esporta i varchi anche in WGS84, con `comune` vuoto perché il dato non c'è: è la base per collegare in futuro le mappe dei comuni vicini.
  - `gateMouthClear` esclude dal traffico i varchi il cui tratto nel buio passa sotto un edificio disegnato oltre il confine (2 casi: Corso Europa e Via Cupa di Melito).
  - `roads.mjs`: `buildRoadGraph(roads,{border,gateClear})` crea `graph.gates`. In `liveCarEdges` un arco che arriva a un varco non è una trappola; in `hasThroughExit` conta come uscita.
  - In `nextPose` un'auto del traffico che arriva a un varco in uscita prosegue oltre la fine dell'arco (t > 1) e sfuma (`gateFade`) in 11 m. A 13 m un'altra auto entra da un varco in entrata libero, scelto in modo deterministico: nessuno nell'imbocco e i primi 10 m della corsia liberi. L'auto entra con t < 0, uscendo dal buio, e la nuova casa di quartiere è verso l'interno.
  - Pendolari Q12, percorsi pianificati, mestieri fermi e residenti non usano i varchi. Durante un urto la modalità varco si annulla.
  - `balanceTraffic` e `createGateVehicle` portano il traffico a `state.trafficTarget` (oggi 140) aggiungendo mezzi solo dai varchi e togliendoli fuori vista o al prossimo varco: è la leva per le ore di punta della Q13.
  - `game.mjs`: strade tagliate dritte con un clip sul confine, applicato solo vicino al confine; con il clip ovunque il disegno in centro su PC passava da circa 20 a circa 40 ms per fotogramma. Imbocchi a trapezio disegnati solo fuori dal confine (clip `evenodd`): asfalto, marciapiede, cordolo e silhouette proseguono per 16 m, si restringono all'82% e sfumano; c'è anche la mezzeria sulle strade a doppio senso larghe. Mezzi e fari sfumano con `gateFade`; l'asfalto bagnato è tagliato allo stesso modo.
- **Cache:** `roads.mjs?v=149`, `npc-commute.mjs?v=004` (importa roads 149), `game.mjs?v=159`, nuovo `border-gates.mjs?v=001`.
- **Test:**
  - Nuovo `bf09-border-gates.test.mjs` con 7 test:
    - varchi, sensi, angolo e WGS84 su un comune quadrato di prova;
    - un senso unico che esce non è più una trappola;
    - uscita nel buio con sfumatura completa e rientro da un altro varco senza salti né inversioni;
    - nessun ingresso finché la corsia è occupata;
    - `balanceTraffic` in su e in giù, senza comparse fuori dai varchi;
    - pendolari esclusi;
    - collegamento nel gioco.
  - Adattati 2 controlli di collegamento di BF02 e BF03, che ora accettano `TRAFFIC_COUNT` e `{border}`.
  - Suite **306/306**.
- **Browser (Chrome headless, dopo, 3 minuti):**
  - 70 varchi (2 esclusi), 86 uscite e 85 entrate, 140 mezzi dall'inizio alla fine;
  - 0 inversioni al confine, 0 salti visibili, 0 auto ferme ai capolinea e 0 ferme in vista oltre 10 s, 0 errori JS;
  - fotografati in movimento uscite nel buio (SP 500, Via San Vito) e ingressi dal buio (una residenziale senza nome), su PC e telefono 844×390;
  - prova di stress BF01: compenetrazioni 0, nessun NPC fermo in vista, come sulla base.
- **Prestazioni (`draw()` medio, macchina condivisa molto carica):** centro su PC 13,3 ms prima e 15,0 ms dopo (stessa coppia di misure), telefono 52,4 e 53,4 ms; vicino al confine 0,3–3 ms in entrambi. Differenza entro il rumore.
- **Limiti:**
  - le auto parcheggiate e i pedoni non usano i varchi;
  - il comune confinante non è noto;
  - un varco con tratto nel buio molto curvo usa la direzione dell'ultimo tratto;
  - i mezzi che entrano tengono il modello del mezzo uscito;
  - non provato su Android reale.
### 2026-10-20 — Claude (account `ilconsulentelogistico-hue`) — BF10 audio del motore per marce e volumi separati radio/effetti
- **Richiesta del committente:** «bello l'audio della macchina ma tipo potrebbe andare un pò di rumore per le marce più alte. inoltre nel menu pausa quando apri lo smartphone metti le impostazioni volume tra musica radio e volume fx/ambientale».
- **Cosa succedeva:** il motore sintetizzato di Q09 (`engineTone`) saliva di tono in modo lineare con la velocità, senza tenere conto del cambio automatico BF05: nessun cambio marcia udibile e nessun rumore in più ad alta velocità. Un solo volume (`prefs.volume`) per gli effetti; la radio era fissa al 52% (`audio.volume=.52`) senza regolazione.
- **Motore:** nuovo `engineSound` in `city-audio.mjs`, con marcia e giri presi da `gearAt` e dal profilo BF05 del modello (`handlingProfile`). Dentro la marcia il tono sale coi giri; al cambio scende (meno nelle marce lunghe) e la voce cala per un attimo con lo stesso `shiftDip` della spinta; lo scooter a variatore sale continuo e poi si stabilizza; la RETRO ha un suo tono. Gas: filtro più aperto; rilascio: più morbido. Carattere per famiglia: auto, furgone (più cupo), Ape (ronzio brillante del monocilindrico), moto e scooter (più acuti). `engineTone` resta per compatibilità.
- **Rumore delle marce alte:** nuovo strato di rumore (rumore marrone filtrato: rombo/aria/rotolamento) che cresce con la velocità e con la marcia, più forte sotto gas; silenzio da fermi, a piedi e in banca. Livelli bassi (massimo ~0,07–0,09 contro ~0,27 della voce del motore) e un compressore leggero in uscita (`DynamicsCompressor`, se il browser lo ha) contro la saturazione.
- **Traffico:** le voci dei 4 mezzi NPC più vicini usano lo stesso modello con il loro profilo e la velocità reale `agent.v` di BF05.
- **Volumi:** preferenze `{muted, effects, radio}` nella stessa chiave `gta-melito-audio-v1`; il vecchio `volume` diventa EFFETTI, la radio parte dal 52%. `car-radio.mjs` ha `setVolume` (anche prima che esista l'elemento audio; 0 = muto senza staccare lo stream). Menu PAUSA: **SUONI: ON/OFF** generale (zittisce effetti E radio), **EFFETTI / AMBIENTE − 70% ＋**, **RADIO / MUSICA − 52% ＋**, passi da 10 punti. Nota aggiunta sotto la Q37: l'app Impostazioni dello smartphone dovrà contenere questi due volumi.
- **Cache:** `game.mjs?v=158`, `city-audio.mjs?v=003`, `car-radio.mjs?v=002`.
- **Test:** nuovo `bf10-audio.test.mjs` (7 test: marce e cali al cambio sulla Punto, rumore crescente per marcia e velocità e gas/rilascio, variatore dello scooter e RETRO, famiglie diverse e voci del traffico, migrazione e persistenza separata dei volumi, SUONI OFF su effetti e radio e volume applicato all'elemento audio, cablaggio); aggiornati 2 controlli Q09 (4 anelli di rumore invece di 3; preferenze salvate nel nuovo formato). Suite **306/306**.
- **Browser (Chrome headless, richieste esterne bloccate):** accelerazione registrata su Via Roma (rettilineo di 632 m, strada sgombra) con ACCELERA tenuto: Panda 0→100 km/h in 3,8 s, massima 140 km/h, 4 cambi a 32/55/79/107 km/h con tono 118→89, 120→92, 123→97, 128→104 Hz e voce che cala a 0,83–0,89; rumore massimo per marcia 0,003 / 0,010 / 0,021 / 0,040 / 0,069; in rilascio filtro da ~1.900 a 1.210 Hz e rumore 0,049. Ape: 3 marce, cambi a 19 e 38 km/h (152→113, 160→122 Hz), massima 61 km/h. Traffico vicino: voci auto in 1ª e 2ª, Ape, furgone, moto e scooter. Menu pausa su PC 1280×720 e telefono 844×390: clic/tocchi veri, 0 sovrapposizioni, ogni pulsante riceve il tocco, RADIO + porta l'elemento audio da 0,52 a 0,72, SUONI OFF lo porta a 0 e il mix degli effetti a 0, SUONI ON li riporta; valori uguali dopo la ricarica; Invio da tastiera funziona; nessun comando di guida resta premuto dopo la pausa. Nessun errore JS (solo favicon 404).
- **Limiti:** l'audio non è stato ascoltato davvero (Chrome headless): sono verificati solo i parametri calcolati e applicati. Lo SPAZIO non attiva i pulsanti della pausa perché il gioco lo usa come freno a mano (comportamento già esistente, Invio sì). Su PC gli altri pulsanti della pausa hanno ancora lo stile del browser (preesistente). Lo smartphone della Q37 non esiste: i volumi sono nel menu pausa attuale. Non provato su telefono reale.
### 2026-10-20 — Claude (account `ilconsulentelogistico-hue`) — BF11 apertura da PC: solo plancia di gioco, il resto nel menu pausa
- **Richiesta del committente (testuale):** «un altro fix è l'apertura da pc. deve mostrare solo la plancia di gioco, non tutto quello che c'è attorno, tutto il resto va nel menu pausa».
- **Prima (Chrome headless, base integrazione BF01–BF06):** su PC la plancia era una finestra dentro la pagina. Sopra c'erano titolo, barra di stato e barra del confronto strade; sotto i pulsanti, due paragrafi di istruzioni e i crediti. La pagina scorreva: 998 px di altezza a 1280×720, 1244 a 1920×1080, 1032 a 1366×768. Plancia di 1248×504 a 1280×720 e 1468×750 a 1920×1080.
- **Correzione `index.html`:**
  - header, `.hud`, `.road-width-bar`, istruzioni e footer spostati DENTRO il menu PAUSA, in 5 sezioni: STATO · INFO, COMANDI, MAPPA · ZOOM · SUONI (le scorciatoie di prima, immutate), STRUMENTI · CONFRONTO STRADE, CREDITI E LICENZE. Gli ID non cambiano, quindi `game.mjs` aggiorna ora, luogo, mezzo, camera e conteggi come prima;
  - nuovo blocco CSS solo PC: `(min-width:761px) and (pointer:fine)` o `(pointer:none)`. Plancia a 100dvh senza bordo, nessuno scorrimento, nessun pulsante sotto la plancia, pulsante Ⅱ rotondo in alto a sinistra, etichetta della via spostata accanto;
  - indicazione `#pc-prompt` «E · …» solo quando un'azione è davvero a portata: oggetto perduto, negozio, banca, mezzo libero vicino, uscita dalla banca;
  - piccola attribuzione «© OpenStreetMap · ISTAT · menu PAUSA: Esc / P» in fondo alla plancia;
  - su PC il riepilogo `#pause-details` e il doppio CONFRONTA STRADE sono nascosti, perché le stesse voci sono già nelle sezioni;
  - le regole delle schede del menu valgono ora anche su PC. Prima erano scritte solo nel blocco telefono, e su PC il menu era senza stile.
- **Telefono invariato:** il blocco telefono continua a nascondere header/barre/istruzioni/crediti e ora nasconde anche le nuove sezioni e i titoletti, quindi il menu START resta quello di prima.
- **Correzione `game.mjs`:** il tasto P apre e chiude la pausa come Esc, ma non con un negozio aperto, dove i tasti servono per comprare. `boardPrompt()` aggiorna l'indicazione dentro `updateHud`. Cache `game.mjs?v=160`.
- **Test:** nuovo `bf11-pc-board.test.mjs` con 5 test, tutti falliscono sulla base:
  - niente attorno alla plancia;
  - sezioni e contenuti nel menu;
  - tutti gli ID usati da `game.mjs` esistono;
  - blocco PC;
  - telefono invariato;
  - tasti Esc/P e indicazione E.
  Suite **304/304**.
- **Prove Chrome headless dopo, a 1280×720, 1920×1080 e 1366×768:**
  - pagina grande quanto la finestra (nessuna barra), plancia e canvas a 0,0 a tutta finestra, rapporto pixel uguale in orizzontale e verticale (0,659–0,660, nessuna deformazione);
  - header/barre/istruzioni/crediti/pulsanti invisibili all'apertura;
  - indicazione «E · ENTRA IN AUTO» accanto all'auto, nascosta lontano;
  - Esc apre la pausa con le 5 sezioni visibili e l'orologio fermo (stesso minuto dopo 1,2 s); Esc chiude; P apre e chiude; Ⅱ apre; RIPRENDI chiude;
  - CONFRONTA CON PRIMA dal menu porta a «PRIMA · 7,0» e torna indietro;
  - in auto, aprendo la pausa: mezzo «AUTO · … KM/H», ora uguale all'orologio NPC, via VIA ROMA;
  - ridimensionata la finestra al 78%×86%: plancia e canvas seguono, nessuna barra;
  - unico errore, il favicon 404 già noto.
- **Telefono 844×390 con tocchi veri:**
  - stesso layout BF06: FRENO y=172, ACCELERA 242, RETRO 312, volante, levetta, Ⅱ, nessuna indicazione PC né attribuzione;
  - ACCELERA porta l'auto a 11,3;
  - START apre il menu con solo le scorciatoie e il riepilogo, come prima; RIPRENDI chiude.
- **Limiti:**
  - non provato su un PC con schermo touch né su un tablet in verticale, che mantiene il layout di prima;
  - sul telefono crediti e istruzioni restano non visibili, come prima di BF11;
  - con lo smartphone della Q37 queste voci andranno nelle app (nota sotto la Q37);
  - non provato su telefono reale.
### 2026-10-20 — Claude (account `ilconsulentelogistico-hue`) — Area mercatale di Melito da arredare: dati e fogli per i banchi (proposta Q42)
- **Richiesta del committente:** individuare l'area mercatale, segnarla come zona «da arredare» e proporre al proprietario un foglio descrittivo per creare i banchi, con ombrelloni grandi che diventano trasparenti quando il giocatore ci passa sotto.
- **Area trovata:** il mercato settimanale del rione 219, nell'isolato tra Via Praga, Via Dublino, Via Budapest e Via Ginevra, con Via Berlino che parte dall'angolo sud-est. Fonti: Melitonline 28/10/2025 («tra via Dublino e via Praga, nel rione 219») e 09/04/2026 («via Berlino»), OSM con due tettoie `building=roof` al centro. Non c'è nessun `amenity=marketplace` in OSM. La riqualificazione è in corso fino al 30/09/2027. Il giorno (venerdì) viene solo da elenchi non ufficiali: non verificato. Il numero di posteggi non è stato trovato. Seconda area: mercato ortofrutticolo comunale in Corso Europa 496 (da Waze).
- **File:**
  - `MERCATO_MELITO.md`: fonti, area, coordinate di gioco e WGS84, stato DA ARREDARE, regole proposte;
  - `data/market-area.json`: non usato dal gioco, `used_by_game:false`, `verified` per voce;
  - `mercato-banchi.csv`: 14 tipi di banco, 23 banchi indicativi;
  - `mercato-requisiti.csv`: R01–R16, con R01 gli ombrelloni trasparenti come i tetti di `roof-reveal.mjs` e R16 le tettoie OSM da rendere pensilina;
  - in `TODO.md` la proposta **Q42**, `[ ]`.
- **Test:** nuovo `mercato-dati.test.mjs` (2 test: dati validi, strade presenti nella mappa, nessun vertice stradale dentro l'area, CSV coerenti, R01 presente). Suite **304/304**.
- **Browser (Chrome headless, PC e telefono):** oggi l'area è una piazzetta pavimentata con due alberi, circondata da baie di sosta. Le tettoie al centro sono disegnate come un edificio pieno e non sono camminabili.
- **Non eseguito:** conferma con il SUAP del Comune di giorno, orari, posteggi e sede provvisoria durante i lavori; nessun banco o ombrellone implementato (lo farà la Q42).


### 2026-10-20 — ChatGPT/GitHub — Merge pacchetti del collaboratore BF01–BF11 e mercato
- **Merge effettivi su main:** [PR #41](https://github.com/CzekUns/Effettokarmagra/pull/41) (BF01–BF06), commit `ab918915e6d6ce1fda2b6ecab55db63ee4bde9aa`; dopo retarget da `gta-melito-bf-integrazione` a `main`, [PR #48](https://github.com/CzekUns/Effettokarmagra/pull/48) (BF07–BF11 + preparazione area mercatale), commit `b18201962468b6c9bdc21d67c4b2cc27a81786d5`. I due merge sono confermati dall'API GitHub.
- **Modifiche arrivate nel gioco:** collisioni e parcheggi/spawn, friggitore al banco, accelerazione con cambio arcade, pedali invertiti, incroci/semafori simulati, lavavetri, varchi di confine, suono marce e volumi, interfaccia PC più pulita. La nuova Q42 mercato contiene **soltanto dati/documentazione**, non i banchi.
- **Verifiche disponibili nei PR:** il collaboratore dichiara suite Node **302/302** sul primo ramo e **340/340** sul secondo, con verifiche Chrome headless; l'operatore merge ha confrontato contenuti, liste file, compatibilità GitHub e commit ma **non ha rieseguito** localmente Node, Chrome o Android. Nessuna conferma di deploy Pages da queste sole risposte.
- **Limiti:** le PR singole #35–#40 e #42–#47 erano ancora aperte come alternative ridondanti al momento del merge; l'autore si è impegnato a chiuderle. La PR #34 (sprite, autore diverso) non è stata unita perché GitHub la segnalava non mergeable. In BF01 il collaboratore segnala ancora un raro caso di incastro presso lo spawn.
- **Da fare:** collaudo fisico su telefono e verifica deploy, registrare con onestà le checkbox BF dopo QA, controllare #34 separatamente e proseguire con la coda restante Q13–Q42 senza duplicare i pacchetti già uniti.
### 2026-10-20 — Claude (account `ilconsulentelogistico-hue`) — BF12 recinti: mura, cancelli, guardiole e galleria Atlante di vetro
- **Segnalazione del committente:** villa comunale, complesso Municipio/Carabinieri/piscina, «parco GB» di fronte all'area mercatale, parco Prima Casa e galleria Atlante. Il gioco non aveva recinti.
- **Fonti** (dettagli e affidabilità in `RECINTI_MELITO.md`):
  - API OSM 0.6, perché Overpass non risponde dal server: 9 riquadri, 33.308 nodi, 4.533 vie. In OSM ci sono 16 muri e un solo perimetro completo, quello della villa comunale (way 567826231, con i cancelli 5464543101/5464543102).
  - Foto aerea Esri World Imagery, usata solo per ricalcare a vista: nessuna immagine nel repository.
  - Ricerca web: solo annunci. Il «Parco GB» sarebbe in Corso Europa 374, a circa 440 m dal mercato, quindi non confermato.
- **`enclosures.mjs`:**
  - Il perimetro OSM o ricalcato diventa un contorno su griglia di 1 m, tolte la carreggiata e il marciapiede disegnati delle strade che delimitano l'isolato (strade pubbliche e strade con nome).
  - Ogni strada, vialetto o servizio che attraversa il perimetro ha un'apertura. Il muro si apre anche sulle corsie pedonali vicine ai cancelli.
  - Sbarre nei recinti privati: abbassate di notte (22–6) per il giocatore, alzate per i mezzi NPC entro 11 m.
  - Guardiola placeholder con guardia (sprite vigile).
  - Collisione dei veicoli basata sulla profondità di contatto: chi tocca un muro può sempre staccarsene o scivolare lungo, ma non entrarci.
  - Preparazione in 80–130 ms in Node, ripetuta anche al cambio di larghezza strade.
- **`game.mjs`:**
  - carica `data/enclosures.json`, che è facoltativo;
  - prepara i recinti prima delle baie BF02 e dei pedoni;
  - `validWalk` esclude le mura;
  - `carBlocked` e `canKnockbackMove` rispettano mura e sbarre;
  - disegna le mura nelle tile statiche, sotto i tetti e nella trasparenza dei tetti; cancelli, sbarre e guardiole nel livello dinamico.
- **`city-art.mjs`:** profilo «vetro» per la galleria Atlante, con facciate a vetrate, montanti e riflessi, tetto rosato e atrio vetrato. Il poligono OSM non cambia.
- **Cache:** `game.mjs?v=163`, `city-art.mjs?v=130`, `enclosures.mjs?v=001` (nuovo).
- **Test:** nuovo `bf12-enclosures.test.mjs` con 8 test: dati, recinti preparati, mura mai su strade o marciapiedi e nessuna strada tagliata, mura che bloccano e uscita sempre possibile, sbarra giorno/notte/NPC, nessun intrappolato, vetro, cablaggio. Ho reso compatibile il controllo di ordine di BF02. Suite **348/348**.
- **Browser** (Chrome headless, server di produzione molto carico, carico medio 14–30):
  - 3 minuti tra i recinti: 0 pedoni dentro le mura, 0 pedoni fermi vicino alle mura, 0 auto ferme vicino alle mura, 0 errori JavaScript;
  - fotogramma: mediana 16,7 ms in entrambi i rami, 95° percentile 83 ms in entrambi i rami (dovuto al carico, uguale con e senza i recinti);
  - prova di stress BF01: 0 compenetrazioni e 0 NPC fermi, sia prima sia dopo. Resta in entrambi lo stesso caso noto di auto incastrata vicino alla partenza (#35);
  - sbarra del Municipio con tasti veri: di giorno l'auto entra per 81 m (50 FPS); alle 23:30 si ferma 4,1 m prima del cancello (25 FPS);
  - foto PC di giorno e di notte con pioggia, foto telefono 844×390.
- **Limiti:**
  - parco Prima Casa non localizzato;
  - funzioni degli edifici del complesso Municipio non verificate;
  - piscina in rovina non disegnata;
  - niente ponti;
  - porte dei residenti dentro i recinti scartate;
  - la guardia è un placeholder;
  - non provato su telefono reale.

### 2026-10-20 — Claude (account `ilconsulentelogistico-hue`) — BF13 foto aerea Esri come sovramappa di confronto e audit dei dettagli mancanti
- **Richiesta del committente:** «prova a usare sempre esri world imagery per vedere dove servono dettagli, come overmappa di rendering».
- **Codice:** nuovo `satellite-overlay.mjs`, con conversione esatta tra coordinate di gioco, WGS84 e tile Web Mercator, scelta dello zoom delle tile dalla camera (z15–19), cache LRU di 96 tile e al massimo 12 richieste in corso. Senza rete nessun errore e nuovo tentativo dopo 20 s.
  - `game.mjs`: la sovramappa nasce alla prima accensione e si disegna per ultima sopra la scena, in trasparenza: così si vedono insieme il gioco e la foto, e al 100% si ricalca.
  - `index.html`: in PAUSA › STRUMENTI c'è «SATELLITE: ON/OFF» con opacità − / ＋ (25/50/75/100%); attribuzione a schermo mentre è accesa e nei crediti. `?satellite=50` per le prove. Niente preferenze salvate.
- **Cache:** `game.mjs?v=164`, `satellite-overlay.mjs?v=001`.
- **Test:** nuovo `bf13-satellite.test.mjs` con 9 test: conversione uguale a `osm.mjs` entro 0,06 m, Municipio nella tile 18/141435/98357, tile adiacenti senza fessure, zoom dalla camera, 0 richieste da spenta, cache limitata, assenza di rete, opacità e `?satellite=`, cablaggio, foglio audit valido e nessuna tile nel repo. Suite **349/349**.
- **Browser** (Chrome headless, server molto carico per altri lavori, tile servite da una cache di lavoro fuori dal repo):
  - PC 1280×720 e telefono 844×390: 0 richieste a sovramappa spenta; da accesa 20–54 tile per 3 zone (Via Roma, Piazza Santo Stefano, Municipio), 0 errori; attribuzione visibile; nessuna sovrapposizione con stick, volante e pedali; 0 errori JS (solo il 404 del favicon).
  - Allineamento con le sagome OSM: 1,7 / 2,1 / 3,8 m, senza una direzione costante (impronte OSM e tetti in prospettiva).
  - Costo: la chiamata `draw` della sovramappa richiede 0,1–0,3 ms (mediana). I tempi per fotogramma non sono significativi su questa macchina: 40 ms da spenta e 70–81 ms da accesa, cioè 12–25 FPS, sotto 20 FPS con la sovramappa accesa. Da rimisurare su un dispositivo vero.
- **Audit:** `AUDIT_SATELLITE.md` e `audit-satellite.csv`, con 50 segnalazioni: 24 da analisi automatica verificate a vista, 2 di sintesi, 24 a vista sulle coppie gioco/foto del centro. Circa 330 tile scaricate una sola volta.
  - Risultato principale: 135 dei 553 edifici segnaposto stanno su prati, campi o alberi, compreso un campo da calcio in Via delle Palme.
- **Limiti:** foto di data incerta; alberi che nascondono le mura; usi degli edifici solo ipotizzati; non provato su un telefono reale.
### 2026-10-20 — Claude (account `ilconsulentelogistico-hue`) — Q13 reazioni dei passanti, densità per zona e ora, ore di punta del traffico
- **Decisione del committente (Simone, 20/10):** si riparte dalla Q13 in ordine anche se i BF sono ancora in PR; aggiunta richiesta: ore di punta del traffico alle 8 e alle 20. Lavoro sopra il pacchetto BF01–BF11 (ramo `pacco`).
- **Prima (pacco, Chrome headless, giocatore fermo 25 s per zona):** pedoni in camera Via Roma 3 (sera 4), Piazza Santo Stefano 3, Corso Europa 1–2, periferia 0; entro 120 m 0–4; nessuna reazione: un'auto si fermava solo a un passo dal pedone; un residente Q01 aspettava di uscire in mezzo a una traversa (in carreggiata in 92 campioni su 93).
- **Nuovi moduli:**
  - `npc-reactions.mjs`: scansarsi a gradi (si gira a guardare, affretta il passo, salta di lato fuori dalla sagoma del mezzo, mai in un muro; poi il recupero esistente lo riporta sul marciapiede; cooldown 4 s, il salto resta permesso se l'urto è imminente); attesa del **varco vero corsia per corsia** al cordolo degli incroci senza semaforo e prima di attraversare; **attraversamento a metà isolato** verso il marciapiede opposto (anche vie larghe e sensi unici, mai tra due auto in sosta); **soste in vetrina** davanti ai negozi con nome; **clacson NPC** solo se a bloccare è il giocatore o un pedone in carreggiata (12 s per auto, 4 s in città, max 3 in 20 s; prima la scelta stava nell'audio e non scattava mai).
  - `npc-density.mjs`: gli stessi passanti anonimi si spostano dove c'è vita (metri di marciapiede pesati da negozi OSM, Via Roma/Piazza Santo Stefano, gerarchia) e per ora (curva continua, notte bassa, pranzo e sera alti). Lontani dal giocatore (>420 m) restano fermi senza costo; vicino arrivano **solo fuori camera** (fascia 24–64 m oltre il bordo, verso la camera) o **uscendo da un portone Q03 in vista** (la porta si apre, due passi fino al marciapiede); di notte quelli in più se ne vanno fuori vista. Nessun NPC aggiunto o tolto.
  - `traffic-rush.mjs`: curva oraria `trafficTargetAt(minuti)` → 70 mezzi alle 3, 140 di giorno, 190 alle 8:00 e alle 20:00 (±1 h di salita e discesa, al massimo 2 mezzi per minuto di gioco); in `updateTraffic` imposta `state.trafficTarget` e i mezzi entrano/escono dai varchi BF09 (`balanceTraffic`).
- **Altre correzioni:** `roads.mjs` le auto NPC frenano morbide e si fermano prima di un pedone sulla corsia (`yieldPed`); `routinePosition` non scartava più i tratti lunghi (un pedone a metà dei 511 m di Via Roma restava in recupero per sempre); i pedoni non entrano nei marciapiedi che passano dentro gli edifici per più dell'8% del tratto (`graph.isWalkBlocked`, prima un passante restava 21 s dentro un palazzo in Via Lavinaio); `npc-social.mjs` niente chiacchiere durante una reazione e il salto scioglie il gruppo; case dei residenti mai in carreggiata.
- **Cache:** `game.mjs?v=162`, `roads.mjs?v=153`, `npc-commute.mjs?v=008`, `npc-social.mjs?v=003`, nuovi `npc-reactions.mjs?v=001`, `npc-density.mjs?v=001`, `traffic-rush.mjs?v=001`.
- **Test:** nuovi `q13-reactions.test.mjs` (13: minaccia solo nel corridoio del mezzo e con la velocità vera; reazione a gradi guarda→affretta→salta, mai nel muro, poi rientra; cooldown; attraversamento con varco e auto NPC che frena; auto che si ferma davanti a un pedone e riparte; cordolo dell'incrocio; varco corsia per corsia e pazienza con margine minimo; clacson con i limiti; allarme clacson; lavoratori al posto; pendolari/porte/indoor esclusi; vetrine; cablaggio), `q13-density.test.mjs` (6: curva oraria, zone, arrivi solo fuori camera e graduali, congelati lontani, notte, uscite dai portoni), `q13-rush.test.mjs` (2: curva 70/140/190 senza scalini, cablaggio con i varchi); adattati 4 controlli di cablaggio (BF02, BF03, BF07, BF09, Q11). Suite **361/361** (pacco 340/340).
- **Browser (Chrome headless, una prova alla volta, server condiviso e carico: i tempi assoluti sono gonfiati; FPS misurati a fine lavoro alle 8:00: Q13 45,6 desktop / 52,6 telefono, pacco 27,8 / 46,1):**
  - pedoni in camera, giocatore fermo 25 s, 10:00 (21:30): Via Roma 3 → **11,7** (4 → 9,2), Piazza Santo Stefano 3,2 → 5,8 (3,2 → 4), Corso Europa 1,6 → 1,1 (1,6 → 0,5), periferia 0 → 0,4; entro 120 m 3 → 20 in Via Roma e 4 → 16 in piazza; telefono 844×390: Via Roma 2,7 → 9,5;
  - **0 comparse e 0 sparizioni in camera**, 0 salti di posizione, 0 pedoni nei muri, 0 pedoni fermi in carreggiata (prima 92/93 campioni); 1–6 uscite dai portoni per zona;
  - reazioni viste in 25 s: attraversamenti 1–11, attese al cordolo 0–2, auto che frenano per un pedone 2–5, clacson NPC 0–2;
  - ore di punta: 70 mezzi alle 3:00, 190 alle 8:00, 140 alle 13:00, 190 alle 20:00 (desktop e telefono), 0 mezzi comparsi o spariti in camera;
  - costo per fotogramma (A/B nella stessa sessione, a turni, mediana; A/A pacco/pacco differisce del 15%): 10:00 desktop 5,6 → 3,9 ms; 8:00 desktop 10,2 → 7,6 ms con 186 mezzi invece di 140; 8:00 telefono 7,7 → 5,9; 20:00 telefono 9,3 → 6,1; 3:00 telefono 5,5 → 2,9 (i passanti lontani fermi valgono più dei mezzi in più);
  - prova di stress BF01 alle 8:00 (90+ s di guida automatica, due giri): compenetrazioni massime **0**, auto NPC ferme in vista 0, 17 urti nel secondo giro, fughe 2/2 e 6/6;
  - interruzioni con un mezzo lanciato sul marciapiede: chiacchiera Q11 sciolta ("pericolo"), nessuno resta in chiacchiera o in recupero dopo 13 s; oggetto perduto Q05: il proprietario salta durante la ricerca, l'evento si chiude "ritrovato", deviazione chiusa; porta Q03: sulla soglia solo uno sguardo, la soglia si completa, nessuno stato appeso; pendolare Q12: non salta, il ciclo prosegue (TO_BIKE → PULL_OUT → RIDE).
- **Limiti:** non provato su Android reale; in camera Piazza Santo Stefano, Corso Europa e periferia restano poco popolate (i portoni Q03 esistono solo vicino a Via Roma, gli altri arrivano a piedi da fuori camera); vetrine verificate in Node, non viste nelle zone misurate; ore di punta senza meno auto in sosta (le baie BF02 restano uguali a ogni ora); gli attraversamenti ai semafori restano quelli di BF07; i tempi assoluti sono di un server carico, contano i confronti A/B.
### 2026-10-20 — Claude (account `ilconsulentelogistico-hue`) — Q42 mercato settimanale: banchi segnaposto, ombrelloni, venditori e clienti
- **Richiesta del committente (20/10):** «puoi anche mettere degli omini e dei placeholder, gli ombrelloni li puoi creare tu, solo per i banchi metti dei placeholder poi eventualmente si creano in pixelart».
- **Nuovo `market.mjs`, collegato a `game.mjs`:**
  - **Calendario:** `npc-agenda.mjs` conta i giorni (`npcDay`/`npcWeekday`) e il giorno 0 della partita è un venerdì, visibile nell'HUD.
  - **Orari:** il venerdì (dato non verificato) montaggio 6:30–7:30, mercato 7:30–13:30, smontaggio 13:30–14:30, tutti graduali. Ogni venditore arriva fino a 45 minuti prima. `?mercato=1` per le prove.
  - **Banchi:** 14 tipi dal foglio, disposti in 6 file deterministiche. Sulla mappa reale ne entrano 15–16.
    - Misure reali × 1,9.
    - Mai su edifici, carreggiata o linea dei pedoni (almeno 2,5 m dal bordo); mai su alberi, panchine, cassonetti, porte o baie. La tela sollevata non copre chiome né auto in sosta.
    - Davanti a ogni banco restano due posti per i clienti.
    - Sono segnaposto disegnati qui, messi in sprite una volta montati; `MARKET_ART` è il punto di aggancio per l'arte definitiva.
    - Fuori orario restano i posteggi gialli numerati.
  - **Ombrelloni:** pixel art procedurale in cache, nei colori del foglio.
    - Forme: quadrati a 4 falde con spicchi a strisce che convergono al pomolo, mantovana smerlata, nervature e luce da nord-ovest; tondi a 8 spicchi; tenda rettangolare a strisce.
    - Hanno ombra, palo e tela sollevata (2.5D); ondeggiano col vento e di più con la pioggia.
    - **R01:** sfumano come i tetti (`easeRoofReveal`) quando il giocatore, a piedi o in auto, è sotto o accanto al banco.
  - **Persone:** venditori e clienti usano gli sprite dei pedoni esistenti e vivono in `state.market.people`, fuori da `state.people`.
    - Venditori: si girano verso il cliente, si muovono un poco dietro il bancone e lanciano voci rare se il giocatore è vicino.
    - Clienti: fino a 16 che comprano (22 contando chi arriva o se ne va), di più la mattina tardi. Arrivano dai marciapiedi delle 4 vie, si muovono su una griglia di 1 m (A*), comprano a 1–3 banchi per 5–15 s ed escono.
    - Compaiono e spariscono solo fuori vista; se l'area non si vede si portano subito allo stato dovuto.
    - Sono nell'indice delle collisioni come pedoni e possono essere urtati (non letale).
  - **Collisioni:** i banchi fermano il giocatore a piedi, i veicoli (con la regola di BF01: la mossa che esce dalla sovrapposizione è sempre permessa) e le spinte degli urti; gli ombrelloni no.
- **Cache:** `game.mjs?v=162`, `npc-agenda.mjs?v=002` (in game e market), `market.mjs?v=001`.
- **Test:**
  - nuovo `q42-market.test.mjs`, 10 test: calendario, coerenza con CSV e `data/market-area.json`, posizionamento, banchi solidi e regola BF01, R01, percorsi, mattinata fuori vista, clienti in vista senza comparse, montaggio e smontaggio graduali, cablaggio;
  - aggiornati `mercato-dati.test.mjs` (stato «prima-versione-placeholder») e `steering-wheel.test.mjs` (`updateHud` usa `npcWeekday`);
  - suite **350/350**.
- **Browser (Chrome headless, prove una alla volta con `nice`, server carico):**
  - montaggio dalle 6:10: 0→14 banchi montati tra 6:32 e 7:02, fino a 12 banchi in montaggio contemporaneo;
  - smontaggio dalle 13:15: graduale dalle 13:38;
  - 3 minuti di giro a piedi dentro il mercato dalle 9:30: comparse e sparizioni in vista 0, persone dentro banchi o edifici 0, persone bloccate 0, 13 clienti arrivati a piedi, 33 acquisti, fino a 37 persone;
  - R01 su PC e telefono: ombrellone 1,00 trasparente col giocatore davanti, 0 lontano, 1,00 con l'auto accanto; l'auto non entra nel banco e indietro è libera;
  - foto alle 6:40, alle 10:30, alle 15:00, alle 21:30 con pioggia, alle 10:30 con pioggia e sul telefono;
  - FPS alle 10:30 nel mercato: PC 50–60 contro 37–50 senza mercato, telefono 844×390 51–56 contro 55–59, misure molto rumorose per il carico. Durante le prove lunghe in parallelo, prima dell'avviso, gli FPS erano 12–27;
  - prova di stress BF01, 90 s: compenetrazioni 0, NPC fermi in vista 0. Un incastro del pilota automatico vicino alla partenza, in Via Roma (1135, 1253), con un residente a 1,6 m: è il caso già noto di BF01, lontano dal mercato;
  - 0 errori JS.
- **Limiti:**
  - entrano 15–16 dei 23 banchi indicativi;
  - vie attorno non chiuse (R06), niente vigile (R11), suoni (R10) e pulizia finale (R14);
  - la pensilina OSM resta un edificio pieno (R16);
  - banchi segnaposto in attesa di pixel art, nessuna animazione dedicata di venditori e clienti;
  - non provato su telefono reale.
