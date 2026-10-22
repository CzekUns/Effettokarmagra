# For Four Chocolate — passaggio a gameplay semidefinitivo

**22 ottobre 2026 — brief affidato al collaboratore.** Questo documento definisce la prossima fase di `reference-play.html`. Le attività vanno sviluppate dal collaboratore in **PR separate**; ChatGPT gestisce verifica e merge quando richiesto dall'utente. **Non sono già implementate**.

## Principi già approvati da preservare
- L'**unico riferimento artistico** è [gameplay-mgs-vr-artboard.webp](./references/gameplay-mgs-vr-artboard.webp), secondo [AGENTS.md](./AGENTS.md): supermercato 3D illustrato, colori accesi, prodotti fitti, Ipno/POLICIE riconoscibili e proporzionati. MGS VR Missions resta riferimento per la *telecamera e gameplay*, non un'alternativa alla tavola.
- Su mobile **solo landscape**, comandi touch esistenti, camera dinamica follow / orbita / zoom. Il movimento va mantenuto coerente con la rotazione della camera.
- **Essere visti camminando è consentito**: nessun arresto per la sola presenza. Furto = **interazione con cioccolata fisicamente presente sugli scaffali**, mai raccolta sul pavimento; essere visti **durante** il prelievo provoca intervento reale della sicurezza.
- Preservare `index.html` e `sample-ps1.html` come versioni precedenti finché il gioco nuovo non viene approvato. Evitare di sostituire il renderer con uno screenshot statico.

## Lotto A — Sprite di movimento multidirezionali anche per gli agenti

**Problema:** ora i personaggi selezionano vista frontale/posteriore/laterale, ma parte delle pose di camminata e di prelievo è soltanto frontale: nelle altre direzioni l'avatar sembra scivolare.

**Consegna:**
1. **Ipno e tutti gli agenti POLICIE:** `idle` + `walk` per **fronte, retro, sinistra, destra**; minimo **quattro frame distinti per ciascuna camminata/direzione**. Anche `crouch-walk` e `take` di Ipno coerenti con direzione del movimento/scaffale, e `run/chase` per gli agenti in preparazione del lotto C. `turn`/transizioni se utili, senza rallentare.
2. Animazione scelta **dalla direzione reale del movimento rispetto alla camera**, non dall'orientamento statico; cambio di vista durante orbit della camera senza freeze né salti di scala; idle quando il personaggio è fermo, piedi non scivolano.
3. Sprite/sheet/atlanti trasparenti, pivot dei piedi, scala e illuminazione coerenti; niente parole sulle texture specchiate. Ridurre texture e richieste HTTP con atlas quando opportuno. Prima produrre una **comparison sheet** di Ipno e guardia per tutte le direzioni con esempi screenshot reali in corsia.
4. Personaggi esistenti restano chiaramente riconoscibili secondo la sola tavola approvata.

**Accettazione:** movimento completo in ogni direzione a camera ferma/ruotata; poliziotti pattugliano con animazioni credibili; niente scivolamenti, texture bianche, ritagli o personaggi sproporzionati. Test JS per selettore stati/direzioni e screenshot browser.

## Lotto B — Supermercato molto più esteso, cioccolata distribuita realmente

**Consegna:**
1. Portare la superficie percorribile a **minimo 3–4 volte l'attuale**. Mappa a stanze/corsie e 5–6 reparti distinti: cioccolato/dolciumi, latticini e frigoriferi, bevande, alimentari, promozioni, casse e uscita. Percorsi alternativi, incroci, zone di copertura, spazi aperti e passaggi stretti credibili. Evitare una singola sala enorme ripetuta.
2. **Più cioccolate rispetto alle attuali quattro posizioni fisse:** predisporre **12–20 punti di spawn sugli scaffali** e attivarne **8–12 per partita** (scelti con seed per test e variabilità). L'obiettivo resta **prelevarne 4 ed uscire**; le altre sono opzionali per bonus/record o semplicemente più scelte di percorso. Prelievi esclusivamente dai **ripiani** a distanza breve; barre di avanzamento/prompt vicino al prodotto e scaffale corretto, nessun disco luminoso spacciato per prodotto a terra.
3. Spawn senza sovrapposizioni e senza oggetti irraggiungibili; prima validare la raggiungibilità con test di path/reach e la coerenza collisioni/linee di vista. Ogni prodotto ha stato `available/taking/collected` e zona di competenza.
4. Camera segue Ipno lungo tutto il negozio con occlusione corretta (pareti/scaffali davanti semitrasparenti solo quando necessario), radar o minimappa leggibile su una mappa più grande. Aggiornare UI `X/4`, uscita, scoring.
5. Ottimizzare per browser mobile: geometrie riutilizzate/instanziate, atlas texture, rendering dei reparti non visibili ridotto; evitare di quadruplicare semplicemente tutte le luci dinamiche.

**Accettazione:** si attraversano davvero più reparti con camera mobile; varie cioccolate sui diversi scaffali raggiungibili, nessuna a terra; posizioni variabili per run; uscita sbloccata dopo 4 raccolte anche se ce ne sono altre; test seed/collisioni/line-of-sight e screenshot desktop/mobile landscape.

## Lotto C — Sicurezza reattiva reale, escalation e cattura credibile

**Problema:** l'attuale `watchZones` aumenta soltanto velocità/raggio di alcune pattuglie; la cattura può tradursi in una schermata immediata e non mostra una reazione nel mondo.

**Consegna:**
1. Reparti con livelli di sorveglianza **davvero differenti**: frequenza passaggio guardie, punti fissi, rotazione CCTV, campi visivi e zone cieche. Dopo ogni prelievo riuscito aumentano davvero i controlli **nella zona interessata**, con pattuglia deviata/guardia aggiuntiva o CCTV riposizionata/controllo rafforzato; non solo velocità del cono.
2. Se **POLICIE vede Ipno prendere**, parte un evento osservabile: il poliziotto **si volta verso Ipno, richiama l'attenzione, corre/si dirige verso di lui**; altri agenti convergono in base all'allerta; icona/suono di allarme e messaggio coerenti. Se è una **CCTV**, segnala la posizione e una guardia viene inviata: la telecamera non deve arrestare magicamente il giocatore.
3. Stato della sicurezza esplicito: `routine → suspicious (opzionale) → witnessed_theft/alert → pursuit → searching → routine_increased`. Tra stato di allarme e arresto ci deve essere **movimento fisico** e collisione/prossimità: **niente game over istantaneo** o teletrasporto verso Ipno. Inseguimento con percorso attorno a scaffali/muri, senza passaggi attraverso ostacoli. Se perde Ipno di vista, ricerca dell'ultima posizione nota per una finestra temporale (es. 10–15 s) e successivo presidio rafforzato. Se lo raggiunge, blocca il movimento e avvia cattura/interrogatorio/epilogo, inizialmente anche sintetico.
4. **Essere visti passeggiando resta lecito**; sospetto ragionevole può derivare da gesti/condotta, mai arresto automatico. Prelievo iniziato da visibile può essere respinto; se il giocatore **viene visto durante** il prelievo, la risposta di sicurezza deve innescarsi indipendentemente dal completamento della raccolta.
5. Pattuglie e CCTV continuano a funzionare sulla mappa estesa, si ricollocano correttamente dopo inseguimenti e non si accumulano tutte senza limite. La difficoltà cresce per progressione di furti e posizione, non per timer globale opprimente.
6. **Feedback leggibile al giocatore:** guardia che accelera e si dirige verso Ipno, allarme/indicatore della zona a rischio, minimappa aggiornabile; rendere chiaro **chi** ha avvistato l'azione e **da dove** arrivano i soccorsi.

**Accettazione deterministica:**
- Ipno cammina davanti a una guardia → **nessuna cattura**.
- Prelievo non visto → cioccolata ottenuta, zona più sorvegliata con **cambio osservabile di percorso o presenza**.
- POLICIE vede prelievo → **inseguimento fisico** e poi cattura solo a contatto/prossimità, non una modale istantanea.
- CCTV vede prelievo → allarme **e guardia inviata** per una ricerca/inseguimento credibile.
- Copertura dietro scaffale interrompe davvero la linea di vista, ricerca ultima posizione nota; guardie non attraversano muri e non restano in inseguimento infinito.
- Scenario partita con 4 cioccolate e fuga ancora completabile.

## Sequenza lavori e regole di review
- **Ordine consigliato**: A (animazioni) → B (mappa/spawn) → C (IA e reazione reale), ma il collaboratore può aprire PR separate parallele **senza conflitti** e con review intermedia. Evitare una PR monolitica.
- Prima di aprire ogni PR: leggere [AGENTS.md](./AGENTS.md), [REFERENCE_GAMEPLAY.md](./REFERENCE_GAMEPLAY.md) e l'ultima voce [WORK_LOG.md](./WORK_LOG.md).
- Ogni PR include: scope del lotto, test eseguiti e limiti, immagini **catturate dal gioco vero** desktop+mobile in landscape, eventuali prestazioni su dispositivo reale (se disponibili), e differenze rispetto all'artboard approvata. Nessuna nuova art direction senza richiesta esplicita.
- Non dichiarare il gameplay `semidefinitivo` finché **tutti e tre i lotti** non sono giocabili e verificati. Il collaboratore propone PR, l'assistente effettua **solo merge richiesti** dall'utente.
