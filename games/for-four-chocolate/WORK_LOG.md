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
