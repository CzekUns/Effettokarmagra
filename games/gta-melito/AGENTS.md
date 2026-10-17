# Istruzioni per ChatGPT Work / agenti — GTA Melito

Ambito: solo `games/gta-melito/`. Questo è il gioco GTA Melito di Uns Arcade, **non Ninomon** né gli altri giochi della repository.

## Missione vincolante

**Proseguire lo sviluppo concreto della resa visiva**, non limitarsi a produrre un piano: trasformare Melito in un'interpretazione **pixel art 2.5D dall'alto, giocabile e riconoscibile** rispetto alla Melito di Napoli reale. Iniziare dal centro storico, **Piazza Santo Stefano**, e continuare progressivamente con le altre aree del paese. Il committente vuole vedere un miglioramento tangibile nel gioco.

**LEGGI PER PRIMO:** [HANDOFF_WORK_REALISMO.md](./HANDOFF_WORK_REALISMO.md). Contiene stato verificato, file chiave, fonti, priorità, metodo di lavoro, test e criteri di accettazione. Dopo ogni sessione registra il lavoro in [VISUAL_PROGRESS.md](./VISUAL_PROGRESS.md).

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
