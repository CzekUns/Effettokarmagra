# WORK LOG — For Four Chocolate

## 2026-10-21 — ChatGPT / avvio concept
- **Fatto:** creata la pagina di anteprima (non giocabile), illustrazione SVG provvisoria, documento OBIETTIVO; integrata una voce preview cliccabile nel catalogo della home.
- **Come:** files `games/for-four-chocolate/index.html`, `cover.svg`, `OBIETTIVO-FOR-FOUR-CHOCOLATE.md`; catalogo `arcade/catalog.js` e script della home.
- **Verifiche:** controllo di struttura dei percorsi e delle stringhe; nessun test browser end-to-end e nessun test gameplay, che non esiste ancora.
- **Foto reference:** tre foto utente (Ipno 1, Ipno 2, Totore) ricevute in questa conversazione; verificare presenza e qualità dei file `references/*.webp` e conservare l'ordine di attribuzione stabilito nell'obiettivo.
- **Da fare:** confermare reference disponibili, decidere stile sprite e costruire prima un vertical slice stealth con telecamere, guardie, scaffali e uscita. Le scene comiche e il sistema record arriveranno dopo.
- **Riferimenti:** repository `CzekUns/Effettokarmagra`, branch `main`; l'anteprima non va conteggiata tra i giochi completati.

## 2026-10-21 — ChatGPT / caricamento reference e verifica
- **Fatto:** pubblicate in `references/` tre copie WebP ottimizzate delle foto originali: `ipno-foto-1.webp`, `ipno-foto-2.webp`, `totore-capellone.webp`; aggiornato README Arcade Club.
- **Come:** blob binari GitHub via Git Data API (commit `2ff3e712ab20f03025fc17c3684c2d8ab76ccc8f`), con associazione ai soggetti come nell'obiettivo.
- **Verifiche:** elenco GitHub conferma file da 2740, 2736 e 1868 byte e nomi corretti. Sintassi JS di `catalog.js` verificata. Navigazione reale nel browser e deploy Pages: **non eseguiti**.
- **Limitazioni:** questi file sono miniature di reference (~175 px larghezza), non gli originali ad alta risoluzione; i JPEG originali restano allegati alla conversazione utente del 21/10/2026, da recuperare prima di realizzare sprite definitivi.
- **Da fare:** usare le immagini sorgenti ad alta risoluzione in fase di disegno. Non presentare i file miniature come asset finali.

## 2026-10-21 — Codex CODEX-GH2 / prima tavola personaggi
- **Fatto:** bibbia di stile e tavola madre provvisoria per Ipno, POLICIE e cliente; quattro direzioni e quattro frame a scala comune, con confronto affiancato.
- **Come:** `STILE_PERSONAGGI.md`, `generate-sprites.mjs`, `assets/*.png`; nessun volto fotografico riprodotto.
- **Verifiche:** test Node della griglia, palette, altezza e trasparenza superato; confronto visivo locale del foglio eseguito. Screenshot `assets/style-in-game.png` catturato nel browser dal vertical slice locale: i tre personaggi sono vicini alla stessa scala.
- **Da fare:** sottoporre la tavola a Simone; usare gli originali delle foto per gli sprite definitivi. Il gioco resta anteprima.
- **Riferimenti:** ramo `ffc-stile`; PR in preparazione, nessun merge.

## 2026-10-21 — Codex CODEX-GH2 / lotto 1 vertical slice stealth
- **Fatto:** prima mappa giocabile del supermercato con quattro tavolette, uscita sbloccata dal bottino, movimento tastiera/touch, due pattuglie POLICIE, telecamera, coni visivi, stati calmo/sospetto/allarme e cattura.
- **Come:** `logic.mjs` contiene mappa e regole pure; `game.mjs`, `index.html` e `style.css` disegnano scena e interfaccia usando la tavola madre provvisoria.
- **Verifiche:** `node --check` e test Node superati (collisione, linea di vista, campo visivo, stati, raccolta, uscita, raggiungibilità della mappa); fogli sprite verificati. Browser Chromium: tastiera e pulsante a schermo muovono Ipno, nessun errore JavaScript, sprite caricati, controllo visivo desktop/mobile e screenshot in gioco con i tre personaggi alla stessa scala. Cattura e uscita verificate nei test Node, non giocate fino in fondo nel browser.
- **Limitazioni:** palette e figure sono **PROVVISORIE, da approvare da Simone**. Il catalogo resta «anteprima»; record, WhatsApp, interrogatorio ed epilogo sono dei lotti successivi.
- **Da fare:** recuperare le foto originali ad alta risoluzione prima degli sprite definitivi; far approvare a Simone la tavola di stile, poi questo lotto senza merge autonomo.
- **Riferimenti:** ramo `ffc-lotto1`, screenshot di prova in `/home/ubuntu/codex-gh2-lavoro/sim-lotto1/`; PR in preparazione.

## 2026-10-21 — ChatGPT / integrazione pull request
- **Fatto:** unite in sequenza PR #94 (tavola personaggi) e PR #95 (vertical slice stealth) su `main`; PR #95 riorientata da `ffc-stile` a `main` dopo il primo merge.
- **Come e dove:** merge commit #94 `1ca240461b4d31d31d6a24e3f616f8da444dc457`; merge commit #95 `303cb3e15305393ff9074eb212f2305e0494c57f`. File del gioco sotto `games/for-four-chocolate/`; voce nel catalogo ancora `preview`.
- **Verifiche e stato:** GitHub segnala entrambe le PR chiuse e merged, zero PR aperte dopo i merge. Ispezionate nel connettore immagine `assets/sheet.png` e screenshot `assets/style-in-game.png`: sprite essenziali con grafica ancora provvisoria. Il collaborator segnala test Node e prova Chromium superati; **non rieseguiti in questa sessione**. Al controllo post-merge i due workflow di deploy del secondo merge erano `in_progress`.
- **Da fare:** verificare il deploy completato e il gameplay dal browser. Migliorare la grafica delle corsie, decorazioni e sprite a partire dalle reference originali; ottenere approvazione del design definitivo. Aggiungere punteggi/WhatsApp e scene narrative nei lotti successivi.
- **Riferimenti:** https://github.com/CzekUns/Effettokarmagra/pull/94 · https://github.com/CzekUns/Effettokarmagra/pull/95

## 2026-10-21 — ChatGPT / correzione direzione grafica su feedback utente
- **Feedback:** l'utente voleva una resa come **Metal Gear Solid PlayStation 1**; l'attuale scena a quadrettoni e figure 24×40 appare invece come un gioco Commodore 64. Il bersaglio estetico precedente è esplicitamente respinto.
- **Fatto:** creata la direzione artistica vincolante `DIREZIONE_ARTISTICA_PS1.md`, corretta la priorità nel documento obiettivo e dichiarata storica/superata la bibbia sprite `STILE_PERSONAGGI.md`.
- **Come e dove:** in futuro mantenere `logic.mjs` e la logica stealth ma sostituire il renderer 2D a tile con una scena a profondità reale, camera elevata e obliqua, modelli low-poly/materiali/luci, campo visivo e ambientazione ceca credibile.
- **Verifiche:** aggiornamenti documentali; **nessuna modifica al renderer**, nessuno screenshot grafico PS1, nessun test browser/deploy grafico svolto in questa sessione.
- **Da fare:** prima una singola scena campione in gioco per approvazione visiva, poi resto del livello. Vietato continuare a produrre altri sprite retro 24×40 come base finale.

## 2026-10-21 — Codex CODEX-GH2 / campione 3D PS1 per revisione
- **Fatto:** scena WebGL separata in `sample-ps1.html`, con camera alta obliqua, due corsie di scaffali pieni, casse, segnaletica ceca, luci, Ipno con cappello/occhiali, agente POLICIE e CCTV. Movimento con tastiera e touch, pattuglia, campi visivi che si fermano agli scaffali, sospetto/allarme/cattura.
- **Come:** rendering in `ps1-sample.mjs` con Three.js r186 vendorizzato localmente (MIT); logica di collisione e visibilità isolata in `ps1-sample-logic.mjs`, ispirata al vertical slice esistente. Il prototipo su `index.html` rimane disponibile per confronto.
- **Verifiche:** test Node della nuova logica e del vecchio prototipo; Chromium desktop 1200×930 e viewport mobile 390×844, WebGL avviato, nessun errore JavaScript, tastiera funzionante, nessun overflow mobile. Screenshot reali in `assets/ps1-sample-desktop.png` e `assets/ps1-sample-mobile.png`.
- **Limitazioni:** **grafica provvisoria, da approvare da Simone**. Personaggi e prodotti sono modelli geometrici di esempio, senza uso di volti fotografici; su dispositivo Android reale resta da verificare il frame rate. Bottino, secondo agente, storia e punteggio seguono solo dopo il giudizio visivo. Il catalogo resta «anteprima».
- **Riferimento:** ramo `ffc-ps1-campione`, PR separata da sottoporre a Simone senza merge autonomo.

## 2026-10-21 — ChatGPT / merge campione PS1
- **Fatto:** unita la PR #97 su `main`, mantenendo la scena 3D in `sample-ps1.html` separata da `index.html` (vertical slice 2D preesistente) e il catalogo in stato `preview`.
- **Come e dove:** merge commit `f5b8e6c501d460bfd0ed379cafab4b85fab31d55`; nuovi file `ps1-sample.mjs`, `ps1-sample-logic.mjs`, CSS, test, screenshot e Three.js locale con licenza MIT.
- **Verifiche:** GitHub conferma PR #97 merged e nessuna PR aperta; screenshot desktop e mobile della PR esaminati. Test automatici e gameplay Android **non rieseguiti qui**. Al controllo subito dopo il merge, i workflow di deploy erano `in_progress`.
- **Da fare:** valutazione grafica dell'utente e test Android del campione, prima di estendere il rendering 3D al gioco intero. Non presentare questo esempio come grafica definitiva né sostituire automaticamente la pagina principale.
- **Riferimenti:** https://github.com/CzekUns/Effettokarmagra/pull/97 · https://czekuns.github.io/Effettokarmagra/games/for-four-chocolate/sample-ps1.html

## 2026-10-22 — ChatGPT / nuove reference gameplay e correzione logica
- **Fatto:** creato `REFERENCE_GAMEPLAY.md` come guida vincolante per MGS VR Missions (camera/proporzioni), art direction vividissima illustrata (colori/texture), inquadratura gameplay dei frigoriferi, movimento landscape e controlli touch.
- **Nuove meccaniche:** furto da scaffali con tasto PRENDI, movimento visibile consentito, riconoscimento del **prelievo visto** come evento incriminante, sicurezza variabile e incremento locale dopo il prelievo.
- **Come:** aggiornato anche `OBIETTIVO-FOR-FOUR-CHOCOLATE.md`; direttiva per il collaboratore attraverso issue #96. Non confondere l'immagine ImageGen con asset pronti da integrare.
- **Verifiche:** documentazione soltanto; non sono state prodotte modifiche funzionali al gioco in questa sessione, né test/deploy di gameplay.
- **Da fare:** ottenere ed allegare la nuova reference visiva di gameplay; costruire un unico campione di reparto frigoriferi con un agente, CCTV, un prodotto su scaffale, screenshot reali desktop/mobile e verifica Android landscape.

## 2026-10-22 — ChatGPT / tavola visiva consegnata al collaboratore
- **Fatto:** generata una tavola illustrata di gameplay ispirata a MGS VR Missions, salvata la sua **anteprima WebP** nella repository e incorporata in `REFERENCE_GAMEPLAY.md`.
- **Dove:** `games/for-four-chocolate/references/gameplay-mgs-vr-artboard.webp` (720 px, file verificato in GitHub); versione maggiore in conversazione del 22 ottobre 2026.
- **Brief al collaboratore:** commento aggiornato su issue #96, con reference incorporata e indicazioni su proporzioni, personaggi, texture e gameplay. I cartelli italiani sono didascalie della tavola, in gioco serve segnaletica ceca.
- **Verifiche:** asset WebP recuperabile con SHA `cd77033fc00aeb9e38e870224871fb607dda8ddf`. Nessuna modifica a renderer/motore e nessun test in browser del nuovo aspetto; asset **solo reference**.
- **Da fare:** collaboratore realizza *una sola scena 3D in game* dei frigoriferi con Ipno, agente e CCTV e meccanica di prelievo; screenshot desktop+mobile landscape per approvazione prima del merge grafico.
- **Riferimenti:** `REFERENCE_GAMEPLAY.md`, issue #96.

## 2026-10-22 — ChatGPT / vincolo grafico definitivo unico
- **Decisione esplicita utente:** usare **solo** `references/gameplay-mgs-vr-artboard.webp` come riferimento **artistico ufficiale e obbligatorio**; nessun altro artwork/stile può guidare il collaboratore. Le foto di Ipno/Totore rimangono reference d'identità e non di stile.
- **Fatto:** creato `games/for-four-chocolate/AGENTS.md` (istruzioni vincolanti a ogni collaboratore per la sottocartella) e aggiunto richiamo nel `AGENTS.md` root; aggiornati `REFERENCE_GAMEPLAY.md`, `DIREZIONE_ARTISTICA_PS1.md`, `OBIETTIVO-FOR-FOUR-CHOCOLATE.md`, `STILE_PERSONAGGI.md` per eliminare interpretazioni estetiche alternative.
- **Passaggio al collaboratore:** aggiornata [issue #96](https://github.com/CzekUns/Effettokarmagra/issues/96), assegnata a `ilconsulentelogistico-hue`; direttiva con image preview, checklist di screenshot browser, regole prelievo e criterio di non-merge senza approvazione visiva.
- **Stato/verifiche:** file reference preesistente verificato sul ramo `main` con SHA blob `cd77033fc00aeb9e38e870224871fb607dda8ddf`. Non sono stati creati asset alternativi o modificato il gioco; nessuna validazione artistica di un nuovo build eseguita in questa sessione.
- **Da fare:** collaboratore sviluppa scena reale 3D, confronta screenshot con **sola** tavola approvata, presenta PR per giudizio dell'utente; registrare eventuali scostamenti e correzioni.

## 2026-10-22 — Codex CODEX-GH2 / nuova prova giocabile dalla tavola definitiva
- **Fatto:** `reference-play.html` offre una scena WebGL separata con frigoriferi, tre scaffali, Ipno in due pose di cammino e una di prelievo, un agente POLICIE, CCTV, cliente, cioccolata sullo scaffale, uscita, HUD e minimappa. Movimento visibile consentito; prelievo visto blocca/cattura; sorveglianza locale aumenta dopo il bottino. Touch solo landscape con overlay in verticale.
- **Come:** la sola tavola `references/gameplay-mgs-vr-artboard.webp` guida 8 asset bitmap derivati (`assets/reference-play/`), applicati a geometria 3D e personaggi piani; la logica pura è in `reference-play-logic.mjs`. Il gioco e il sample precedenti restano accessibili. Valutazione comparata in `REFERENCE_FIDELITY.md`.
- **Verifiche:** 15 test Node superati, nessun errore di console nel browser; screenshot reali 1280×720 e mobile landscape 844×390, overlay verticale e comandi touch presenti. Test browser del prelievo, aumento sorveglianza e uscita superato.
- **Limiti:** il risultato **non è ancora la grafica esatta** della tavola: texture scaffali ripetute e personaggi piani, non modelli completi. Solo anteprima della tavola 720×405 nel repo; originale richiesto a Simone. Rendering software EC2 1–2 FPS, dato non valido per Android con GPU; prova reale Android non eseguita. Non approvato per sostituire `index.html`.
- **Da fare:** confrontare con originale ad alta risoluzione, correggere gli scarti visivi e misurare su Android reale; giudizio esplicito di Simone prima del merge.
- **Riferimento:** ramo `ffc-reference-giocabile`; PR grafica separata da proporre in bozza.

## 2026-10-22 — ChatGPT / merge PR #98
- **Fatto:** dopo l'approvazione esplicita dell'utente, la PR #98 «prova giocabile dalla reference definitiva (bozza)» è stata contrassegnata pronta per revisione e unita in `main` con merge commit `34cbf733075c8ddf694f071337fbe616bbdb9856`.
- **Come e dove:** aggiunge una scena di prova separata in `games/for-four-chocolate/reference-play.html` con risorse in `assets/reference-play/`, logica e test separati; preserva `index.html` e `sample-ps1.html` per confronto.
- **Verifiche:** GitHub conferma `merged: true`; i 15 test Node e il browser sono dichiarati dal collaboratore nella PR, non rieseguiti durante questo merge. Controllo Android reale non eseguito; prestazioni da verificare.
- **Da fare:** apertura della pagina demo pubblicata, valutazione grafica alla luce dell'unica reference approvata e test prestazioni su telefono. La PR era una bozza di resa, non un'approvazione della grafica definitiva.
- **Riferimenti:** https://github.com/CzekUns/Effettokarmagra/pull/98 ; https://czekuns.github.io/Effettokarmagra/games/for-four-chocolate/reference-play.html

## 2026-10-22 — ChatGPT / camera realmente mobile nel reference-play
- **Problema segnalato dall'utente:** la telecamera della demo sembrava completamente immobile; la semplice interpolazione originaria da lontano non dava l'effetto di camera dinamica richiesto.
- **Fatto:** integrato vero camera rig fluido `reference-camera.mjs` nel renderer `reference-play.mjs`; camera avvicinata che **segue e anticipa Ipno** e inquadratura che trasla visibilmente; rotazione orbitale controllabile (pulsanti ↶/↷ o trascinamento sulla scena), zoom (+/− o rotella) e ricentraggio. I comandi direzionali restano relativi allo schermo quando si ruota la camera.
- **Mobile:** comandi camera aggiunti anche in landscape, mantenendo joystick/D-pad PRENDI/ACCOVACCIATI esistenti. Su tastiera Z/X ruotano, R ripristina, +/- zoom. HTML/CSS hanno cache busting v2.
- **Verifiche:** sintassi JS verificata in runtime JavaScript, moduli e controlli incrociati; test di comportamento rig eseguiti con simulazione JS (followX da 0 a 3.56, cambio posizione reale). Aggiunto `reference-camera.test.mjs` per prove Node; **non eseguiti** test Chromium end-to-end o su Android fisico in questa sessione.
- **Restano da fare:** verificare in browser reale che camera e controlli funzionino su touch/Android; eventuale occlusione scaffali in primo piano e rotazioni automatiche in punti critici. Non cambiare la reference grafica unica.
- **Riferimenti:** `games/for-four-chocolate/reference-play.html`, `reference-camera.mjs`, `reference-play.mjs`, `reference-camera.test.mjs`.

## 2026-10-22 — Codex CODEX-GH2 / quattro cioccolate e viste direzionali
- **Decisione di Simone:** estetica della scena approvata; proseguire sul gameplay ancora in bozza e sui personaggi frontali.
- **Fatto:** nella scena `reference-play.html` quattro confezioni sono prelevabili dagli scaffali, la seconda pattuglia copre il lato est, la sorveglianza aumenta solo nella zona del prelievo e l'uscita si sblocca dopo tutte e quattro. Essere visti camminando resta consentito; durante il prelievo causa cattura. Ipno, guardie e cliente scelgono fronte, retro o profilo rispetto alla camera orbitale; il profilo opposto viene riflesso.
- **Grafica:** artboard approvata come sola guida estetica, viste frontali esistenti usate solo per mantenere l'identità. Confronto alla stessa scala in `assets/reference-play/views-comparison.png`; screenshot reali desktop e mobile landscape aggiornati. Dettagli e scarti in `REFERENCE_FIDELITY.md`.
- **Verifiche:** test Node su collisioni, visibilità, quattro prelievi, escalation locale, uscita e selezione delle viste; Chromium desktop e mobile landscape senza errori JavaScript e senza overflow; nel browser quattro prelievi e fuga completati, uscita anticipata negata.
- **Limiti:** sprite piani con tre viste e due pose frontali, non modelli corporei continui; cliente con lieve alone scuro già presente nell'asset frontale; test Android reale non eseguito. Chromium software sulla EC2 rende a circa 1 FPS, quindi non misura le prestazioni su telefono. `index.html` e il catalogo restano nella fase precedente.

## 2026-10-22 — ChatGPT / merge PR #99
- **Fatto:** su richiesta dell'utente, unita in `main` la PR #99 «For Four Chocolate: quattro prelievi e viste dei personaggi» (merge commit `1ff726fcf76d6d74f8599605b90d086464429ed5`).
- **Contenuto dichiarato:** quattro cioccolate da scaffali distinti, due pattuglie POLICIE con escalation locale, viste fronte/retro/profilo dei personaggi in `reference-play.html`.
- **Verifiche:** GitHub conferma merge riuscito. Il collaboratore dichiara 20 test Node superati e verifiche Chromium; **non rieseguiti qui**, Android reale non testato.
- **Limiti:** sprite personaggi ancora 2D su scena 3D; facciate scaffali con texture ripetute; la tavola unica approvata resta la fonte artistica obbligatoria.
- **Da fare:** controllo deploy e verifica diretta della demo con telecamera ruotata e quattro prelievi su smartphone landscape; continuare affinamento grafico.
- **Riferimenti:** https://github.com/CzekUns/Effettokarmagra/pull/99 · https://czekuns.github.io/Effettokarmagra/games/for-four-chocolate/reference-play.html

## 2026-10-22 — ChatGPT / consegna fase gameplay semidefinitivo al collaboratore
- **Richiesta utente:** dopo l'approvazione della bozza grafica, serviranno sprite di movimento in **tutte le direzioni anche per POLICIE**, un supermercato **molto più grande**, più cioccolate che compaiono sugli scaffali, controlli più intensi progressivamente e **reazioni reali** di guardie/CCTV che assistono al prelievo.
- **Delega esplicita:** «Sì il collaboratore se ne occupa»; **non modificato il gameplay** dall'assistente. Creato `PIANO_GAMEPLAY_SEMIDEFINITIVO.md` con tre lotti dettagliati e criteri di accettazione; aggiornati `AGENTS.md`, `REFERENCE_GAMEPLAY.md`, `OBIETTIVO-FOR-FOUR-CHOCOLATE.md` per indirizzare il collaboratore verso la nuova fase, salvaguardando l'unico stile approvato.
- **Issue assegnati a `ilconsulentelogistico-hue`:** [#100 animazioni 4 direzioni](https://github.com/CzekUns/Effettokarmagra/issues/100); [#101 mappa 3–4× e 12–20 spawn candidabili con 8–12 attivi](https://github.com/CzekUns/Effettokarmagra/issues/101); [#102 sicurezza reattiva e inseguimenti fisici](https://github.com/CzekUns/Effettokarmagra/issues/102). Quattro cioccolate restano l'obiettivo di vittoria; tutte le confezioni sono sugli scaffali.
- **Verifiche:** creazione file/issues e assegnatario confermati dal connettore GitHub. Nessuna PR, gameplay implementato, test Node, screenshot o test Android eseguiti da ChatGPT in questa sessione.
- **Da fare:** collaboratore produce **PR distinte** con test e screenshot reali; ChatGPT confronta e unisce solo previa indicazione utente. Distinguere avvistamento di Ipno che passeggia (consentito) da prelievo sorpreso (allarme, convergenza, inseguimento/cattura e ricerca senza attraversare muri).

## 2026-10-22 — Codex CODEX-GH2 / lotto A animazioni multidirezionali
- **Fatto:** Ipno e i due agenti usano camminate a quattro fotogrammi per fronte, retro, sinistra e destra. Ipno ha passo basso direzionale e prelievo orientato verso lo scaffale; le guardie hanno corsa direzionale pronta per il lotto C. Gli agenti di profilo sinistro hanno tavole autonome, senza scritte ribaltate.
- **Come:** 15 atlanti WebP a quattro celle e tre pose singole trasparenti, con piedi/scala normalizzati. La selezione delle animazioni segue il movimento reale e l'orbita della camera; fermandosi contro uno scaffale i fotogrammi non avanzano. La sola artboard `references/gameplay-mgs-vr-artboard.webp` ha guidato lo stile.
- **Verifiche:** 22 test Node superati; ispezione di tutte le 64 celle previste, con quattro fotogrammi distinti per ogni atlante e tavola di confronto alla stessa scala. Chromium headless desktop 1280×720 e mobile landscape 844×390: texture caricate, nessun errore JS, comandi touch visibili, nessun overflow, overlay verticale presente. Screenshot reali aggiornati in `assets/reference-play/`. Rendering software EC2: 1–2 FPS; non rappresenta le prestazioni Android con GPU.
- **Limiti:** sprite piani; il profilo sinistro accovacciato e il prelievo a sinistra di Ipno sono riflessi del destro. Le pose di corsa non appaiono ancora durante una partita, perché l'inseguimento sarà nel lotto C. Nessuna prova su Android fisico.

## 2026-10-22 — Codex CODEX-GH2 / lotto B supermercato e distribuzione cioccolata
- **Fatto:** mappa percorribile di 22×20 m (circa 3,85 volte l'area precedente), con reparti dolci, alimentari, bevande, promozioni, frigoriferi e casse; sette scaffali/espositori, divisori e vie alternative, quattro guardie in pattuglia e minimappa aggiornata. Diciotto punti candidati sono sui ripiani, dieci attivi per partita con scelta riproducibile tramite seed; tutte le aree con cioccolata hanno almeno un prodotto. Quattro prelievi sbloccano l'uscita, gli altri danno punti extra. I prodotti hanno stato `available/taking/collected`.
- **Come:** geometria, collisioni, linee di vista, posizioni dei prodotti e radar condividono i dati di `reference-play-logic.mjs`. La camera segue Ipno anche ai bordi della mappa; gli scaffali che lo coprono vengono attenuati. Il catalogo e `index.html` restano invariati.
- **Verifiche:** 25 test Node superati sul ramo integrato A+B, incluso controllo di raggiungibilità di tutti i 18 punti e dell'uscita, seed e stati prodotti. Chromium reale: desktop 1280×720 e viewport mobile landscape 844×390 senza errori JS/overflow, controlli touch visibili; prova browser di quattro prelievi, sei prodotti rimasti, uscita e nuova partita con seed diverso. Screenshot integrati in `assets/reference-play/desktop-gameplay.png`, `mobile-landscape-gameplay.png` e `shelf-gameplay.png`.
- **Limiti:** gli espositori aggiunti sono geometrici e ripetono texture della sola artboard approvata; un negozio più ampio rende più evidente questa ripetizione. Browser software EC2 a 0–1 FPS nel ramo integrato, non misura Android con GPU; prova su telefono fisico mancante. La sicurezza reagisce ancora come prima del lotto C.

## 2026-10-22 — Codex CODEX-GH2 / lotto C sicurezza reattiva
- **Fatto:** un prelievo visto genera `alert → pursuit → searching → routine_increased`, con fonte guardia o CCTV esplicita. Due guardie vengono inviate attraverso i corridoi, si voltano e corrono verso Ipno; la cattura arriva solo al contatto. Persa la vista, cercano l'ultima posizione per 12 secondi e tornano alla pattuglia. Un prelievo nascosto devia una guardia della stessa zona verso il ripiano e alza la sorveglianza locale. Passeggiare in vista resta lecito.
- **Come:** percorso su griglia calcolato intorno a scaffali e divisori, ricalcolato mentre Ipno si sposta; spostamento con collisione a ogni passo. Le guardie usano le pose di corsa del lotto A. HUD, coni e minimappa distinguono allarme da guardia/CCTV, inseguitori e ultima posizione nota. Nessuna nuova fonte grafica oltre all'artboard approvata.
- **Verifiche:** 31 test Node superati, inclusi intervento di guardia, invio della CCTV, deviazioni ripetute dopo furti nascosti, ricerca/ritorno, percorso libero da tutte le guardie ai 18 ripiani, camminata lecita e partita con quattro cioccolate/fuga. Browser Chromium desktop: scenari di inseguimento e CCTV con HUD e minimappa corretti; mobile landscape 844×390: allarme CCTV, touch visibile, nessun overflow. Screenshot reali `assets/reference-play/policie-pursuit.png`, `cctv-alert.png`, `cctv-mobile-landscape.png`, con seed e posizioni di prova impostati nel test.
- **Limiti:** due inseguitori per allarme e una CCTV fissa nella mappa; niente audio d'allarme. Prestazioni Android fisico non misurate. Il browser software EC2 resta troppo lento per misurare la fluidità su un telefono con GPU.

## 2026-10-22 — ChatGPT / merge sequenziale lotti A–C (#103–#105)
- **Fatto:** dopo richiesta «Merga», integrate nell'ordine le tre PR della fase semidefinitiva: [#103](https://github.com/CzekUns/Effettokarmagra/pull/103) sprite animati multidirezionali (commit `1cb16a606ebf4d4fb4187036af06b8669ec75954`); [#104](https://github.com/CzekUns/Effettokarmagra/pull/104) mappa ampliata e cioccolate sui ripiani (commit `e9cd25cbc8d18789ab43d45ecbf071f90209723a`); [#105](https://github.com/CzekUns/Effettokarmagra/pull/105) allerta reattiva e inseguimento reale (commit `7552bd83d83044d3e90fa24cc4f42aead5bb2a8a`).
- **Come:** le PR erano impilate su rami precedenti; retarget a `main` dopo ciascun merge. GitHub ha confermato `merged:true` per tutte e tre. `reference-play.html` è la pagina di prova aggiornata; `index.html` non viene sostituita.
- **Decisione su #106:** la PR [#106](https://github.com/CzekUns/Effettokarmagra/pull/106), già aperta, introduce progressione **illimitata**, uscita sempre disponibile, multa e joypad: cambia la regola originaria dell'uscita dopo quattro cioccolate. **Non unita** in questo passaggio, perché l'utente aveva ricevuto raccomandazione di valutare il cambio di regole separatamente. Retarget della PR aperta a `main` per futura scelta esplicita.
- **Verifiche:** i test Node/Chromium risultano dichiarati nelle rispettive PR; **non rieseguiti in questa sessione**. Nessuna prova su Android reale, grafica ancora provvisoria per il collaboratore.
- **Da fare:** controllare il deploy e gameplay su smartphone landscape; valutare la PR #106 separatamente e, solo se approvata, fare ulteriore merge. Preservare unica reference grafica.

## 2026-10-22 — Codex CODEX-GH2 / raccolta infinita, record e joypad
- **Decisione di Simone:** prelievi senza limite, più CCTV e poi POLICIE con l'aumento delle cioccolate, `!` sopra le guardie allertate, uscita volontaria in qualunque momento, 1 Kč per cioccolata e multa di 50 Kč alla cattura. Sul telefono, joypad al posto dei tasti direzionali.
- **Fatto:** dieci confezioni attive vengono rifornite su altri punti dei 18 ripiani dopo ciascun prelievo. La partita comincia con una CCTV e nessuna pattuglia; nuove CCTV arrivano a 2/4/6/9/12 cioccolate, le guardie a 5/7/10/13/16/19/23/27. La CCTV può chiamare un agente anche prima della prima soglia. Il limite è sei CCTV e otto guardie; i prelievi restano illimitati. Le guardie mostrano `!` durante l'allarme. Uscendo, il record in corone si salva nel browser; cattura = bottino − 50 Kč, senza cambiare il record. Il joypad analogico ha zona morta e torna al centro quando il dito si solleva.
- **Verifiche:** 32 test Node superati, compresi 30 prelievi consecutivi, soglie, uscita immediata e multa; Chromium desktop con 10 prelievi, 5 CCTV, 3 guardie, `!`, fuga da 10 Kč e cattura successiva da −47 Kč senza sovrascrivere il record. Viewport mobile landscape 844×390: joypad visibile, trascinamento con movimento proporzionale e rilascio che ferma Ipno, nessun overflow o errore JS. Screenshot reali `assets/reference-play/progression-desktop.png` e `joypad-mobile-landscape.png`.
- **Limiti:** il record è locale al browser/dispositivo; prova su Android fisico ancora mancante. Il Chromium software EC2 ha 0–2 FPS e non misura la fluidità su telefono con GPU. L'uscita a zero cioccolate registra zero, per scelta di consentire la fuga in ogni momento.

## 2026-10-22 — ChatGPT / merge PR #106 dopo verifica completezza
- **Fatto:** su verifica dell'utente «Sicuro di aver fatto tutti i merge?», confermato che #103, #104 e #105 erano già unite mentre #106 era ancora aperta. Dopo l'aggiornamento del ramo della #106 e la risoluzione del conflitto documentale, GitHub ha confermato il **merge #106 riuscito** in `main` (commit `e8ff0256ac1dab0340c748d79e5b70ff03e0cd43`).
- **Funzioni aggiunte (secondo la PR):** raccolta senza limite e ripiani riforniti, uscita sempre disponibile, progressione di CCTV e agenti per soglie, `!` di allarme, joypad analogico mobile, punteggio in Kč, record locale e multa da 50 Kč in caso di cattura.
- **Verifiche:** merge confermato da GitHub; il collaboratore riporta 32 test Node e prove Chromium, **non rieseguiti da ChatGPT**. Android fisico e qualità delle prestazioni GPU ancora non verificati.
- **Nota di processo:** il precedente riferimento a #106 «non unita» è storico e si riferisce allo stato precedente a questo merge. Con questo commit risultano integrate le PR #103–#106; eventuali PR nuove richiedono successivo controllo.
- **Da fare:** verifica del deploy e del gioco dal browser mobile, in particolare risposta delle guardie dopo prelievo osservato e comportamento del joypad. La reference grafica unica resta obbligatoria.

## 2026-10-22 — ChatGPT / Finali Praga + WhatsApp sempre condivisibile
- **Richiesta utente:** creare **due finali narrativi animati**: uscita volontaria a Praga accolta dal gruppo di ragazzi; cattura → ufficio con frase ceca «Za čtyři čokolády jste urazil Českou republiku!» e «For four chocolate!» → scala mobile → esterno Praga → multa 50 Kč → cameo sullo sfondo di Capellone con cintura di salame.
- **Cast:** foto della comitiva inviata in questa conversazione il 22 ottobre 2026. La foto contiene già Ipno e Capellone: **non duplicarli**. Essendo una foto con più persone, **non caricata pubblicamente nella repo**; servirà trasmissione autorizzata al collaboratore prima del disegno del gruppo. Il vecchio `ipno-foto-1.webp` è un'altra foto, non la sostituisce.
- **WhatsApp:** richiesta esplicita dell'utente di **condividere il risultato qualunque sia l'esito**, quindi pulsante dedicato per vincita e game over, messaggi dinamici separati con bottino, multa/saldo, record e URL pubblico. L'invio deve restare volontario.
- **Fatto:** creato `FINALI_E_CONDIVISIONE.md`, issue [#107](https://github.com/CzekUns/Effettokarmagra/issues/107) assegnata a `ilconsulentelogistico-hue`, aggiornato `AGENTS.md`.
- **Verifiche e stato:** incarico/documentazione pubblicati su `main`; **nessuna scena, grafica o condivisione WhatsApp implementata**, nessun test o deploy di queste funzioni effettuato da ChatGPT. Il collaboratore deve produrre PR separata con screenshot autentici, test e verifica Android.

## 2026-10-22 — ChatGPT / caricata miniatura reference gruppo
- **Correzione:** dopo la domanda dell'utente sulla disponibilità dell'immagine, caricata su `main` la reference `references/gruppo-ragazzi-foto.webp` (miniatura **200×128 px**, ridotta dalla foto del 22 ottobre 2026), blob `deca3685cc89d9f4a0dc56ba96c7bdc2ec456013`, commit binario `60c531d865f4c69bdcae66a2a7c653562569398e`.
- **Portata:** questo supera la precedente nota «non caricata». L'originale non è stato caricato; la miniatura serve al collaboratore della issue #107 per comporre il gruppo (senza duplicare Ipno e Capellone), **non** come asset del gioco.
- **Verifiche:** caricamento binario su `main` confermato; rendering finale/animazioni e test gameplay non svolti.

## 2026-10-22 — ChatGPT / riparata WebP reference gruppo del finale
- **Segnalazione collaboratore** (screenshot utente): `references/gruppo-ragazzi-foto.webp` nel GitHub era un WebP corrotto/troncato: lunghezza 3.510 byte vs 4.004 dichiarati nel contenitore RIFF, file non decodificabile. La precedente conferma di upload non includeva verifica integrità ed era quindi inesatta.
- **Fatto:** caricato il **blob WebP completo e valido** dalla miniatura originale disponibile, 200×128 px / 4.004 byte. Nuovo SHA blob `6947971422b0e0c0b4699fb531ebca8cc1ff8f65`, commit su `main` `041ab2761e2b93f6fb37e0964e854e3c7d7d9105`. File originale con header e immagine verificati in PIL; SHA e 4.004 byte verificati nuovamente su GitHub.
- **Handoff:** commento sulla issue [#107](https://github.com/CzekUns/Effettokarmagra/issues/107) a `ilconsulentelogistico-hue` con URL raw, invito a riscaricare e validare il file prima del lavoro. Nessuna necessità di toccare l'attuale gioco.
- **Da fare:** collaboratore produce le sequenze finali, versione WhatsApp sui due esiti e screenshot reali da PR; se necessita maggiore definizione rispetto alla miniatura chiedere la foto originale. Evitare nuovi upload base64 senza verifica delle dimensioni RIFF e SHA.
