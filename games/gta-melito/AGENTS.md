# Istruzioni per ChatGPT Work / agenti — GTA Melito

Ambito: solo `games/gta-melito/`. Questo è il gioco GTA Melito di Uns Arcade, **non Ninomon** né gli altri giochi della repository.

## Passaggio di mano obbligatorio — QUALSIASI intervento

**Regola permanente per tutti: persone, agenti AI, ChatGPT e Work.** Chi lavora in questo gioco deve consultare l'ultima voce di [WORK_LOG.md](./WORK_LOG.md) **prima** di iniziare e lasciare una nuova voce **prima di consegnare o terminare la sessione**. Questa regola vale per codice, grafica, asset, AI, missioni, mappa, bug, refactoring e documentazione, non soltanto per i lavori estetici.

Il log può essere breve (5–10 righe), ma deve dire chiaramente **cosa è stato fatto**, **come e in quali file**, **quali test/verifiche sono stati fatti o non fatti**, **cosa resta da fare** e **dove riprendere**. Indicare commit/branch/PR se noti. Se la sessione non ha concluso il lavoro, registrare ciò che è stato tentato e i blocchi incontrati. Aggiungere le voci in fondo senza eliminare lo storico; includere il log nel commit delle modifiche quando possibile. Non inventare deploy o test. Una risposta in chat **non sostituisce** il registro in repository.

[VISUAL_PROGRESS.md](./VISUAL_PROGRESS.md) rimane obbligatorio *in aggiunta* per gli interventi grafici dettagliati; [WORK_LOG.md](./WORK_LOG.md) è il riepilogo universale per i passaggi di mano. Si applicano anche le [regole generali della repository](../../AGENTS.md).

## Missione vincolante

**Proseguire lo sviluppo concreto della resa visiva**, non limitarsi a produrre un piano: trasformare Melito in un'interpretazione **pixel art 2.5D dall'alto, giocabile e riconoscibile** rispetto alla Melito di Napoli reale. Iniziare dal centro storico, **Piazza Santo Stefano**, e continuare progressivamente con le altre aree del paese. Il committente vuole vedere un miglioramento tangibile nel gioco.

**PRIMA DI MODIFICARE:** leggi [HANDOFF_WORK_REALISMO.md](./HANDOFF_WORK_REALISMO.md) e le ultime voci di [WORK_LOG.md](./WORK_LOG.md). L'handoff contiene stato verificato, file chiave, fonti, priorità, metodo di lavoro, test e criteri di accettazione. Dopo ogni sessione aggiorna il registro operativo e, se hai lavorato sulla grafica, anche [VISUAL_PROGRESS.md](./VISUAL_PROGRESS.md).

## Coerenza grafica fra strada e interni — regola permanente

**Un solo gioco, un solo stile visivo.** Ogni interno accessibile (banche e futuri negozi, case, uffici) mantiene la stessa **pixel art 2.5D dall'alto, scala del personaggio, orientamento, palette urbana, ombre e materiali** della mappa esterna. Usare il **medesimo sprite/renderer e le stesse animazioni del protagonista**, senza ridisegnarlo in uno stile distinto quando attraversa una porta. Gli interni possono usare una telecamera separata e stanze in sezione con muri bassi, ma non devono diventare schermate frontali, ambienti fantasy/Zelda o mini-giochi visivamente estranei. Conservare movimento touch/PC, collisioni con arredi e uscita verso il mondo originale. Prima di consegnare testare proporzioni e leggibilità su telefono e desktop. Documentare nel WORK_LOG.

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
