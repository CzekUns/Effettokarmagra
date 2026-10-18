# GTA Melito — TODO di sviluppo NPC e vita cittadina
Aggiornato: 2026-10-19 · Ambito: `games/gta-melito/` · Stato: pianificazione approvata, implementazioni nuove NON ancora iniziate.

## Obiettivo creativo
Rendere Melito credibile e interessante anche quando il giocatore resta fermo: abitanti che escono, hanno mete, incontrano persone, entrano nei locali, prendono mezzi e rientrano. Le attività devono dipendere da ora, luogo, situazione e comportamento del giocatore. Non aumentare semplicemente il numero di pedoni.

**Vertical slice di riferimento:** su Via Roma un residente esce da un edificio, va al suo scooter, parte, parcheggia vicino a una banca, scende, entra, svolge un'attività simulata, esce, riprende lo scooter e torna nella sua zona. L'intero ciclo deve essere plausibile e osservabile senza teletrasporti in vista.

## Stato di partenza (verificare nuovamente prima di sviluppare)
- [x] Mappa OSM stradale/edilizia e punti di interesse già integrati; le facciate stilizzate e i placeholder non sono dati verificati.
- [x] Pedoni con ruoli basilari `commuter`, `errand`, `stroller`; veicoli con `through`, `local`, `courier`, assegnati in `roads.mjs`.
- [x] Guida del giocatore con auto e moto, veicoli parcheggiati, traffico, animazioni, collisioni/urti non letali e ritorno degli NPC nella zona.
- [x] Ingresso del giocatore in banca con telecamera e collisioni in `bank-interior.mjs`.
- [x] Quattro missioni locali, ricompense, salvataggio e controlli touch/desktop.
- [ ] Verificare versione pubblica in un browser desktop e Android landscape: i resoconti passati non equivalgono a test live dell'ultima build.
- [ ] Eseguire la suite completa Node 22 e registrare conteggio/esito; correggere prima eventuali regressioni.

**Nota sui numeri:** il codice più recente configura circa 170 pedoni e 140 veicoli NPC (di cui una quota moto) più veicoli parcheggiati. Sono limiti di simulazione, non obiettivi da aumentare. Misurare il conteggio effettivo a runtime.

## Ordine di lavoro e definizione di fatto
Spuntare una casella solo dopo codice integrato e verifica specifica. Per ciascuna tranche: test automatici, prova visiva (se disponibile), compatibilità touch/PC, aggiornamento versioni cache, `WORK_LOG.md` e, se cambia la grafica, `VISUAL_PROGRESS.md`. Non dichiarare test/deploy mai eseguiti.

### P0 — Benchmark e prima fetta giocabile (prima implementazione)
- [ ] Rileggere `AGENTS.md`, `README.md`, `HANDOFF_WORK_REALISMO.md` e ultime voci di `WORK_LOG.md`.
- [ ] Eseguire `node --test games/gta-melito/*.test.mjs games/gta-melito/survey/*.test.mjs` con Node 22; annotare baseline e condizioni del browser.
- [ ] Riprodurre un percorso iniziale: avvio in Via Roma → Piazza Santo Stefano → veicolo → banca → ritorno; registrare problemi e, quando possibile, screenshot desktop/mobile alla stessa camera.
- [ ] Fotografare/descrivere lo stato NPC in una scena ferma per 3–5 minuti di gioco: movimenti, ripetizioni, densità, soste, collisioni.
- [ ] **Vertical slice 1:** introdurre una piccola coorte deterministica (es. 8–16 abitanti) con casa/méta/routine stabili e attività di uscita → cammino → ingresso simulato → uscita → ritorno, senza cambiare tutta la popolazione in una volta.
- [ ] Mostrare almeno una routine completa e ripetibile nella zona Via Roma/Piazza Santo Stefano, senza bisogno di una missione attiva.
- [ ] Coprire con test il ciclo `spawn → destinazione → attività → ritorno`, i fallback e i casi di destinazione irraggiungibile.
- [ ] Preparare il sistema per la futura transizione a scooter/auto senza accoppiare l'AI al controllo del protagonista.

**Accettazione P0:** osservando per qualche minuto una via, almeno un NPC esegue una sequenza comprensibile fra luoghi; nessun salto visibile, collisione con edifici o blocco permanente; missioni, moto, banca e controlli esistenti continuano a funzionare.

### P1 — Identità, agenda e orologio della città
- [ ] Aggiungere un **orologio di gioco** accelerato, deterministico, con slot mattina/pranzo/pomeriggio/sera/notte; non legarlo all'ora reale del dispositivo.
- [ ] Definire un'identità leggera per NPC (id, seed, ruolo, zona di casa, destinazione, stato, mezzo opzionale, orario, timer, relazioni opzionali).
- [ ] Implementare una state machine esplicita: `AT_HOME`, `EXITING`, `WALK_TO_TARGET`, `WAITING`, `ACTING`, `SOCIALIZING`, `RETURNING`, `BOARDING`, `RIDING`, `PARKING`, `ENTERING`; solo gli stati necessari vanno attivati nella prima tranche.
- [ ] Agende diverse per residente, lavoratore, cliente, pensionato, passante, corriere, rider/motociclista e gruppo; evitare che tutti partano contemporaneamente.
- [ ] Dare un comportamento a NPC senza meta valida: pausa, passeggiata breve o ritorno alla zona; mai ciclo infinito o spawn impossibile.
- [ ] Rendere stabili casualità, mete e durate usando id/seed: la stessa sessione non deve cambiare comportamento in modo arbitrario a ogni frame.
- [ ] Prevedere pausa/riapertura mappa, dialoghi e interni; decidere esplicitamente se il tempo di gioco avanza o si ferma, preservando timer missioni.
- [ ] Aggiungere test dei passaggi temporali e delle transizioni di stato.

**Accettazione P1:** a diverse ore simulate variano attività e presenze; la stessa sequenza è riproducibile a seed fissato e non rompe salvataggio/campagna.

### P2 — Destinazioni vere e porte degli edifici
- [ ] Costruire un catalogo leggero di **destinazioni** derivato da POI OSM, ingressi già definiti e punti tecnicamente accessibili: casa, bar, negozio, banca, ufficio, panchina, punto di incontro, parcheggio.
- [ ] Separare `dato reale OSM`, `entrata simulata`, `attività inventata`: non attribuire negozi inventati a veri civici.
- [ ] Trovare punti di accesso **fuori dalle sagome e raggiungibili dal marciapiede**; validare con `validWalk`, collisioni, confine e geometria stradale.
- [ ] Permettere a un NPC di raggiungere l'ingresso, fermarsi, entrare, continuare un'attività astratta e uscire dalla stessa porta dopo un tempo coerente.
- [ ] Non far scomparire NPC in mezzo alla carreggiata o attraversare muri visibili; transizione alla porta con microanimazione/occlusione credibile.
- [ ] Limitare capienza e affollamenti presso una porta; impedire che gli NPC si accatastino nello stesso punto.
- [ ] Per le banche usare la posizione degli ingressi di `bank-interior.mjs`, senza costringere a renderizzare tutti gli interni NPC contemporaneamente.
- [ ] Progettare un'interfaccia riutilizzabile per i futuri interni accessibili al giocatore.
- [ ] Testare entrate assenti, porte bloccate, collisioni e conservazione dell'identità fra ingresso/uscita.

**Accettazione P2:** gli edifici diventano sorgenti/destinazioni credibili di persone; tutte le sparizioni/ricomparse avvengono in punti d'ingresso plausibili.

### P3 — Socialità e soste
- [ ] Introdurre incontri fra conoscenti con distanza e probabilità condizionate: avvicinamento, orientamento reciproco, sosta, saluto, separazione.
- [ ] Consentire piccoli gruppi di 2–3 NPC davanti a bar, piazze e luoghi di ritrovo, evitando collisioni e ingombri dei passaggi.
- [ ] Aggiungere attività stanziali a tempo: panchina, vetrina, attesa, telefono, conversazione; riutilizzare animazioni e asset disponibili.
- [ ] Piccoli fumetti contestuali, brevi e poco frequenti, leggibili a zoom 5× senza invadere minimappa, controlli o missioni; nessun dialogo di massa.
- [ ] Mantenere i timer delle conversazioni e vie di fuga: se arriva un veicolo, uno scontro o l'ora di partire, il gruppo si scioglie.
- [ ] Variare durate, direzioni e frequenza in maniera deterministica; impedire che tutti i pedoni facciano simultaneamente la stessa azione.
- [ ] Testare gruppi, reset stato, memoria a breve termine ed eventuali interruzioni.

**Accettazione P3:** in 3–5 minuti compaiono alcune interazioni spontanee, distribuite e comprensibili, senza bloccare marciapiedi o traffico.

### P4 — Ciclo completo pedone ↔ scooter/auto
- [ ] Unificare l'identità dell'NPC a piedi e alla guida: salire su un mezzo non deve creare una seconda copia del personaggio.
- [ ] Collegare NPC a un veicolo fisico parcheggiato/riservato, con id del proprietario e controllo di disponibilità.
- [ ] Implementare sequenza `walk to vehicle → unlock/board → drive route → find parking → dismount → walk to destination`.
- [ ] Riusare `roads.mjs`, `motorcycles.mjs`, `vehicle-entry.mjs`, `motorcycle-parking.mjs`, `traffic-collision.mjs` senza riscrivere la guida del giocatore.
- [ ] Garantire che il motociclista sia disegnato sopra la moto solo quando effettivamente a bordo; NPC a piedi nella stessa identità dopo la discesa.
- [ ] Riservare/parcheggiare soltanto in posizioni libere e con strada percorribile; non bloccare ingressi, incroci o veicoli del giocatore.
- [ ] Gestire veicolo irraggiungibile, sottratto dal giocatore, parcheggio pieno, incidente, uscita impedita e NPC fuori vista.
- [ ] Nessun doppio conteggio in popolazione/traffico e nessuna ricomparsa evidente sullo schermo.
- [ ] Realizzare **Vertical slice 2** completo: residente → scooter → banca → scooter → rientro.
- [ ] Testare ciclo, collisioni, ownership del mezzo, ingresso banca e continuità nelle telecamere.

**Accettazione P4:** una sequenza completa con moto è riproducibile senza duplicazioni, mezzi fantasma o animazioni incoerenti.

### P5 — Reazioni al mondo e al protagonista
- [ ] Pedoni attendono un varco utile per attraversare, tenendo conto di traffico e velocità dei mezzi.
- [ ] Pedoni si scansano quando arriva una moto/auto troppo vicina, con reazioni graduate e cooldown.
- [ ] NPC reagiscono a urti lievi, ostacoli e corse del giocatore con breve animazione, variazione di percorso o fumetto.
- [ ] Automobilisti fermi dietro un ostacolo possono suonare il clacson con cooldown e senza spam.
- [ ] NPC impegnati in conversazioni interrompono temporaneamente l'attività in caso di pericolo, poi recuperano la propria agenda.
- [ ] Alcuni personaggi persistenti riconoscono incontri precedenti col giocatore, senza introdurre sistemi complessi di reputazione prima che siano necessari.
- [ ] Mantenere gli urti **non letali** già implementati e i recuperi fuori campo; nessuna morte/game over impliciti.
- [ ] Testare rate limit degli eventi, ripresa della routine, blocchi e impatti in auto/scooter.

**Accettazione P5:** il giocatore influenza la vita attorno a sé ma non paralizza la simulazione; niente spam o reazioni continue a ogni frame.

### P6 — Distribuzione della popolazione e prestazioni
- [ ] Ridurre i pedoni che camminano senza scopo: preferire meno persone visibili con attività leggibili anziché densità uniforme.
- [ ] Distribuire spawn, attività, mezzi e soste in base a orario e caratteristiche delle zone; non riempire piazze, incroci o corsie.
- [ ] Distinguere **simulazione dettagliata nella viewport** e **simulazione astratta lontano**: timer/eventi/posizioni logiche fuori vista, render e pathfinding ridotti.
- [ ] Imporre budget a percorsi, selezione mete, collisioni, messaggi e ricalcoli ogni tick; usare indici spaziali e cache esistenti.
- [ ] Impedire teletrasporti in camera e verificare anche entrata/uscita dalla viewport.
- [ ] Ripulire risorse di NPC fuori zona senza perdere l'avanzamento delle routine.
- [ ] Misurare costo per frame, occupazione memoria e fluidità su Android modesto in landscape oltre che desktop.
- [ ] Rivedere con prove l'eventuale cap 170 pedoni/140 mezzi: non aumentarlo senza dimostrare performance accettabili.
- [ ] Preparare contatori debug disattivabili: stati NPC, interni simulati, gruppi sociali, mezzi occupati, path failures, FPS.

**Accettazione P6:** a telecamera ferma la città resta viva senza cali marcati, blocchi o spawn visibili; le missioni restano giocabili.

### P7 — Ambientazione, contenuti e progressione futura (dopo il sistema NPC)
- [ ] Tabelle di attività specifiche per bar, negozi, uffici, banche, consegne e piazze; utilizzare solo punti realmente identificati come tali.
- [ ] Ciclo giorno/notte con differenze di affluenza e aperture, senza introdurre costose simulazioni grafiche premature.
- [ ] NPC ricorrenti riconoscibili (Nico e pochi altri) con itinerari e interazioni collegate alle missioni.
- [ ] Eventi ambientali rari e non scriptati a vista (consegna, incontro, discussione, attesa taxi/ride, veicolo che cerca parcheggio).
- [ ] Ripensare le quattro missioni per sfruttare gli NPC realmente simulati, senza cancellare i progressi salvati.
- [ ] Dare valore a denaro e rispetto con attività e servizi coerenti: progettare prima l'economia, non aggiungere numeri senza utilità.
- [ ] Rifinire sprite di pose/soste/interazioni e feedback sonori brevi, con diritti e stile coerenti.
- [ ] Estendere progressivamente dal centro a Piazza Immacolata, Corso Europa e altri quartieri, dopo prova del vertical slice.

**Accettazione P7:** ciò che succede in città produce opportunità di gioco, non solo scenografia.

## Specifiche trasversali e vincoli non negoziabili
- [ ] Non alterare arbitrariamente geometrie e ID OSM; conservare attribuzioni e distinguere tutti i placeholder sintetici.
- [ ] Riutilizzare asset dall'alto in pixel art 2.5D e mantenere trasparenze/occlusioni dei tetti, sprite e zoom a piedi/in auto.
- [ ] Non rompere partenza in Via Roma, ingresso banca, moto del giocatore, parcheggi, urti, collisioni, minimappa e missioni.
- [ ] Supportare tastiera e joystick touch landscape, menu pausa e salvataggi esistenti; evitare nuove dipendenze pesanti.
- [ ] Evitare dinamiche di discesa/entrata impossibili e pop-in visibili, e non far passare NPC sui tetti o dentro muri.
- [ ] Non copiare artwork GTA/Rockstar né foto terze senza diritti.
- [ ] Isolare la logica AI in moduli testabili invece di gonfiare ulteriormente `game.mjs`; conservare compatibilità con la pipeline GitHub Pages.
- [ ] Scrivere test unitari/simulazione a seed fisso per scheduler, path, porte, soste, relazione NPC↔mezzo, urti, recupero e regressioni.
- [ ] Eseguire quando possibile uno smoke test visivo PC + Android landscape per ogni tranche; distinguere nel log verifiche fatte da verifiche ancora aperte.
- [ ] Aggiornare `WORK_LOG.md` dopo **ogni** sessione (anche parziale); modifiche grafiche anche in `VISUAL_PROGRESS.md`.

## Criteri di consegna per l'automazione di sviluppo
1. Iniziare da **P0**, non da P7. Leggere TODO aggiornata, istruzioni AGENTS e ultimo WORK_LOG: potrebbero esserci modifiche successive.
2. Implementare realmente la prima tranche utile nel gioco e relativi test, preferendo una vertical slice funzionante a una grande riscrittura incompleta.
3. Aggiornare queste checkbox solo per ciò che è stato verificato. Continuare con P1/P2 solo se P0 è stabile e c'è margine nella sessione.
4. Commit di codice e test nel branch appropriato con passaggio di consegne nel WORK_LOG; se non si riesce a scrivere su GitHub, dichiarare blocco e fornire patch completa.
5. Nel riepilogo indicare commit, cosa il giocatore può vedere/fare, test realmente eseguiti e prossimo punto esatto da implementare.


## Prototipo radio in auto — integrazione separata dalla roadmap NPC
- [x] Creare sintonizzatore HTMLAudio con sei emittenti richieste, solo in auto; cambio stazione, ON/OFF, link sito emittente, messaggi errore/autoplay, salvataggio locale.
- [x] Integrare controlli su tastiera e schermo touch con arresto audio all'uscita dall'auto e al reset.
- [x] Scrivere test di selezione/stato radio e verifiche sintattiche isolate; eseguite 4 prove logiche in sandbox V8, tutte riuscite.
- [ ] Eseguire la suite Node 22 completa dopo le modifiche e verificare GitHub Actions/Pages sul commit definitivo.
- [ ] Provare realmente su Chrome/Firefox desktop e Android landscape la riproduzione di **ognuna delle sei stazioni**; classificare flussi validi, errori HTTP, AAC/MP3, limitazioni HTTPS e autoplay.
- [ ] Confermare permesso/termini delle emittenti per incorporare lo streaming nel gioco pubblico, oppure utilizzare soltanto collegamenti verso i lettori ufficiali.
- [ ] Chiedere se estendere l'ascolto anche alle moto; per ora la radio è riservata alle auto.
