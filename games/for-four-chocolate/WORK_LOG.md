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
