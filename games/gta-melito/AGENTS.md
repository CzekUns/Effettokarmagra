# Istruzioni per ChatGPT Work / agenti — GTA Melito

Ambito: solo `games/gta-melito/`. Questo è il gioco GTA Melito di Uns Arcade, **non Ninomon** né gli altri giochi della repository.

## Coordinamento multi-agente — sviluppo TODO delegato

- **Collaboratore `ilconsulentelogistico-hue`:** responsabile di **implementare la prima Q non completata** di `TODO.md` (una Q per PR, senza saltare Q aperte); branch separato dalla `main`, test reali, commit e **Pull Request**. Il suo handoff è [issue #28](https://github.com/CzekUns/Effettokarmagra/issues/28).
- **Revisore ChatGPT/GitHub principale:** controlla le PR, test, diff, conflitti e regole del gioco, poi fa merge solo se sufficientemente verificate; altrimenti richiede correzioni. Può sviluppare **bugfix, test e funzionalità indipendenti dalle Q attualmente assegnate**, senza modificare gli stessi file del collaboratore, preferibilmente su branch separati.
- Il collaboratore ha permessi `write`, ma **non deve fare commit diretti su `main`** per le attività Q: soltanto PR. Non marcare una Q completata senza integrazione e prove; se la PR è incompleta, mantenere `[ ]`.
- Non confondere **assegnazione dell'issue** con avvio dell'agente: l'AI dell'altro account deve ricevere istruzioni e operare realmente. Nessun agente deve dichiarare svolta un'attività delegata senza codice/test/PR verificabili.
- Se la revisione richiede modifiche, preferire commenti o commit sul branch della PR; **mai** duplicare lo sviluppo della stessa Q su `main` in parallelo.

## Eccezione di priorità temporanea — bugfix BF01–BF06 (20 ottobre 2026)

In seguito a problemi di collisioni, spawn/parcheggi e guida riferiti dall'utente, il collaboratore `ilconsulentelogistico-hue` esegue prima la coda ordinata **[BUGFIX_TODO.md](./BUGFIX_TODO.md)**, registrata nell'[issue #32](https://github.com/CzekUns/Effettokarmagra/issues/32). **Una BF per PR** con test/log; non prendere una nuova Q di `TODO.md` finché BF01–BF06 non sono integrate, poi riprendere **Q13**. Questa regola prevale temporaneamente sul principio «prima Q aperta», senza spuntare o perdere Q13–Q24. Se esiste già una PR Q in corso, non cancellarla: coordinarne lo stato prima di lavorare sugli stessi file. L'assegnazione all'account GitHub non attiva l'AI esterna.

## Passaggio di mano obbligatorio — QUALSIASI intervento

**Regola permanente per tutti: persone, agenti AI, ChatGPT e Work.** Chi lavora in questo gioco deve consultare l'ultima voce di [WORK_LOG.md](./WORK_LOG.md) **prima** di iniziare e lasciare una nuova voce **prima di consegnare o terminare la sessione**. Questa regola vale per codice, grafica, asset, AI, missioni, mappa, bug, refactoring e documentazione, non soltanto per i lavori estetici.

Il log può essere breve (5–10 righe), ma deve dire chiaramente **cosa è stato fatto**, **come e in quali file**, **quali test/verifiche sono stati fatti o non fatti**, **cosa resta da fare** e **dove riprendere**. Indicare commit/branch/PR se noti. Se la sessione non ha concluso il lavoro, registrare ciò che è stato tentato e i blocchi incontrati. Aggiungere le voci in fondo senza eliminare lo storico; includere il log nel commit delle modifiche quando possibile. Non inventare deploy o test. Una risposta in chat **non sostituisce** il registro in repository.

[VISUAL_PROGRESS.md](./VISUAL_PROGRESS.md) rimane obbligatorio *in aggiunta* per gli interventi grafici dettagliati; [WORK_LOG.md](./WORK_LOG.md) è il riepilogo universale per i passaggi di mano. Si applicano anche le [regole generali della repository](../../AGENTS.md).

## Missione vincolante

**Proseguire lo sviluppo concreto della resa visiva**, non limitarsi a produrre un piano: trasformare Melito in un'interpretazione **pixel art 2.5D dall'alto, giocabile e riconoscibile** rispetto alla Melito di Napoli reale. Iniziare dal centro storico, **Piazza Santo Stefano**, e continuare progressivamente con le altre aree del paese. Il committente vuole vedere un miglioramento tangibile nel gioco.

**PRIMA DI MODIFICARE:** leggi [HANDOFF_WORK_REALISMO.md](./HANDOFF_WORK_REALISMO.md) e le ultime voci di [WORK_LOG.md](./WORK_LOG.md). L'handoff contiene stato verificato, file chiave, fonti, priorità, metodo di lavoro, test e criteri di accettazione. Dopo ogni sessione aggiorna il registro operativo e, se hai lavorato sulla grafica, anche [VISUAL_PROGRESS.md](./VISUAL_PROGRESS.md).

## Coerenza grafica fra strada e interni — regola permanente

**Un solo gioco, un solo stile visivo.** Ogni interno accessibile (banche e futuri negozi, case, uffici) mantiene la stessa **pixel art 2.5D dall'alto, scala del personaggio, orientamento, palette urbana, ombre e materiali** della mappa esterna. Usare il **medesimo sprite/renderer e le stesse animazioni del protagonista**, senza ridisegnarlo in uno stile distinto quando attraversa una porta. Gli interni possono usare una telecamera separata e stanze in sezione con muri bassi, ma non devono diventare schermate frontali, ambienti fantasy/Zelda o mini-giochi visivamente estranei. **La telecamera interna segue il personaggio con lo stesso zoom in unità-mondo della camminata esterna e un leggero incremento (+8%, `BANK_FOOT_ZOOM_MULTIPLIER=1.08`), senza adattare automaticamente tutta la stanza allo schermo; il movimento permette di scoprirla progressivamente.** La camera va limitata ai bordi della scena. Conservare movimento touch/PC, collisioni con arredi e uscita verso il mondo originale. Prima di consegnare testare proporzioni e leggibilità su telefono e desktop. Documentare nel WORK_LOG.

## Incidenti arcade non letali e recupero routine — regola di gameplay

Urti fra auto, moto e pedoni, compreso il protagonista a piedi o in veicolo, possono imprimere una spinta **proporzionale alla velocità del contatto**, senza morti, eliminazioni di NPC o game over. Le collisioni visibili devono rispettare confini e strutture della città; utilizzare la fisica e i controlli condivisi in `impact-physics.mjs`, non implementare effetti incompatibili in singoli moduli. Gli NPC ricordano la **propria zona di origine** e le relative strade/passeggiate; dopo essere stati sbalzati rientrano nel percorso di routine e gli eventuali riposizionamenti avvengono **solo fuori dalla vista**, nella stessa zona, mai in strade casuali distanti. Documentare modifiche e regressioni nel `WORK_LOG.md`.

## Guida touch: volante e pedali separati — regola permanente

In auto e moto, sul lato sinistro della visuale deve comparire **il volante fisico ruotabile con il dito**, al posto della levetta di camminata. Rilasciato il volante, la sterzata torna progressivamente al centro. Sul lato destro, mantenere **ACCELERA sopra FRENO sopra RETRO** come tre pulsanti compatti e indipendenti, utilizzabili insieme allo sterzo (multi-touch). RETRO fa arretrare auto e moto solo mentre è premuto e non richiede altri comandi; il sistema non deve accelerare in avanti quando ACCELERA e RETRO sono entrambi premuti. Girare il volante senza gas NON deve accelerare; il tasto FRENO deve decelerare senza azionare automaticamente la retromarcia. Lo spazio rimane freno a mano da tastiera. A piedi e negli interni ripristinare levetta analogica e pulsante CORRI. Non reintrodurre accelerazione automatica con la sterzata. Fonti di riferimento: `steering-wheel.mjs`, `driving-controls.mjs`, `motorcycles.mjs`, `game.mjs`, `index.html`; regressioni coperte dai test dedicati.

## Pixel art modus — guida obbligatoria per ogni asset

**Prima di creare, ritagliare, caricare o sostituire edifici, persone o veicoli, leggere integralmente [PIXEL_ART_MODUS.md](./PIXEL_ART_MODUS.md).** È lo schema condiviso di stile, prospettiva, crop, alpha, pivot, animazioni, integrazione e prove. Include la regola fondamentale emersa con la Chiesa di Santa Maria delle Grazie: preservare l'immagine master e **non troncare le appendici posteriori**; se il crop viene ampliato, ricalibrare il renderer evitando di riesumare la struttura procedurale sottostante. Per le auto resta valido anche [VEHICLE_ART_GUIDE.md](./VEHICLE_ART_GUIDE.md).


**REFERENCE GRAFICA PERSONAGGI — VINCOLANTE:** prima di generare o modificare **qualsiasi persona/NPC/protagonista**, aprire visivamente **[il primo spritesheet originale dei pedoni](./assets/people/pedoni-4x4frames-24x40-rgba.png)**, usarlo come **riferimento artistico primario** per sagome, proporzioni, palette, dettaglio, prospettiva e frame, e confrontare affiancati i risultati. Il friggitore storico e le precedenti tavole dei quattro mestieri **non sono reference prioritarie**: se divergono dal primo sheet, rifarli secondo il primo sheet. Se non si può aprire il PNG, non iniziare la generazione di persone. Dettagli e checklist obbligatoria nel paragrafo `PERSONE` di `PIXEL_ART_MODUS.md`.

## Modus operandi veicoli — confermato e permanente

Per ogni nuovo veicolo segui rigorosamente [VEHICLE_ART_GUIDE.md](./VEHICLE_ART_GUIDE.md): automobili reali come riferimento, **solo vista dall'alto**, un sheet per modello con colori d'epoca verificabili, ritagli PNG individuali **trasparenti**, scala corretta e introduzione effettiva nel gioco. Lo standard è approvato sulla Panda moderna e Panda Fire già integrate: non tornare ad auto SVG generiche e non generare viste prospettiche per gli sprite definitivi.

## Regole permanenti

1. **Fedeltà locale, grafica originale**: Melito è densamente edificata; strade, palazzi, marciapiedi, insegne documentate e punti notevoli devono somigliarle nell'insieme. Stile coerente di pixel art 2.5D; non trasformare il gioco in una città generica o in una mappa piatta. Tutti gli edifici devono mantenere volume leggibile, incluso l'infill.
2. **Separare fatti e ipotesi**: i 2.056 poligoni OSM sono sagome cartografiche; gli edifici sintetici (attualmente 467, deterministici) sono **placeholder inventati**. NON chiamarli edifici verificati, NON attribuire colori, facciate, livelli o negozi a un singolo ID OSM senza riscontro identificabile. Non dichiarare completato un censimento fotografico inesistente.
3. **Mappe e copyright**: preserva i tracciati e gli ID OSM, attribuzione ODbL/ISTAT. Consulta immagini/Street View solo come riferimento quando le condizioni d'uso lo consentono; **non scaricare, fare scraping, incorporare o ridistribuire fotografie Google Maps/Street View**. Preferisci immagini comunali, beni culturali o fotografie con licenza adeguata, con riferimento esplicito. Non copiare risorse artistiche di GTA/Rockstar.
4. **Niente regressioni**: non rompere camminata, veicoli, missioni, salvataggio, collisioni, traffico, zoom adattivo, minimappa, controllo touch, performance su telefono e GitHub Pages. Lo zoom attuale parte da 5× a piedi e si allarga progressivamente in auto: conservarlo. Il confronto “CONFRONTA CON PRIMA” per le strade deve restare funzionante.
5. **Consegnare modifiche**: fare codice/asset/commit reali in GitHub, verificare con Node 22 e screenshot in browser (desktop + mobile); test verdi NON dimostrano da soli una buona resa grafica. Inserire confronti prima/dopo e descrizione onesta del progresso.
6. **Portata**: non toccare altre cartelle di giochi senza necessità; evitare refactoring non connessi all'obiettivo estetico.

## Prima attività operativa per Work

Apri `https://czekuns.github.io/Effettokarmagra/games/gta-melito/?v=070`, osserva e documenta l'aspetto attuale. Studia gli edifici realmente identificabili di Piazza Santo Stefano e il percorso verso Via Roma e Municipio tramite fonti fotografiche lecite. **Implementa** subito una prima tranche visibile con materiali, tetti, facciate, arredo e fondo stradale più fedeli; confronta screenshot a medesima camera/posizione; poi estendi l'approccio ad altri quartieri. Esegui `node --test games/gta-melito/*.test.mjs games/gta-melito/survey/*.test.mjs` e verifica deploy. Aggiorna `VISUAL_PROGRESS.md` con cosa è stato effettivamente fatto, cosa è solo simulato e cosa rimane da verificare.

Se il lavoro è lungo, procedere per parti **implementate** senza chiedere ulteriori conferme e senza dichiarare eseguite verifiche non compiute.
