# Pesca Grossa — registro di lavoro

Registro operativo del gioco `games/pesca-grossa/` (regole in [`AGENTS.md`](../../AGENTS.md)). Aggiungere le nuove voci in fondo.

## 2026-10-19 — Pesca Grossa 2.0 (Claude, Claude Code)

**Fatto**
- Il gioco a tempo da 90 secondi è diventato una **carriera** con giornate: 4 luoghi (Lago Patria, Porto di Pozzuoli, Scogli di Posillipo, Golfo), 31 specie con orari/meteo/profondità/esche, 5 leggendari, specie protette, taglie minime, varianti Karmagra, karma, meteo e ciclo giorno/notte, mangianze, rifiuti e tesori.
- Nuova pesca: ombre visibili, assaggi e abboccata con ferrata a tempo (perfetta/normale/troppo presto), esche artificiali da recuperare.
- Nuovo combattimento: tensione, frizione regolabile, filo in bobina, energia del pesce, azioni del pesce (tira, fuga, salto, riposo, tana) e canna da piegare dal lato opposto. Quattro modi di perdere il pesce.
- Economia: ghiacciaia (capienza e freschezza), pescheria, bottega con esche e attrezzatura, commissioni con fama, Guardia Costiera, Pescepedia, collezione, statistiche, salvataggio in `localStorage` (`biagio-pesca-carriera-v1`).
- La **Sfida 90 secondi** resta e usa il nuovo motore; il record continua a stare in `biagio-pesca-record` (letto dalla home).

**Come e dove**
- `rules.js`: dati e simulazione pura (nessun DOM, caso iniettato), esposta come `window.PESCA_RULES`. `game.js`: canvas, input (touch, mouse, tastiera), pannelli e ciclo di gioco; espone `window.PESCA_GAME` per i test nel browser. `index.html`: struttura e stile.
- Struttura come Ninomon: script classici con `?v=2`, nessuna libreria esterna.
- Bilanciamento del combattimento tarato con simulazioni: un giocatore che gestisce tensione e lato prende quasi tutto con l'attrezzatura adatta; chi tiene sempre premuto spezza la lenza sui pesci grossi; i leggendari chiedono attrezzatura e tecnica.
- Idee dalle meccaniche di Stardew Valley (leggendari, qualità), Animal Crossing (ombre, assaggi, finestra di ferrata più corta per i rari), Dredge (giornate, ghiacciaia, varianti aberranti → Karmagra con contatore di sfortuna), simulatori (tensione/frizione/bobina, pesci con stili diversi).

**Verifiche e stato**
- `node games/pesca-grossa/rules.test.js`: ok (dati coerenti, ogni specie pescabile, bilanciamento, frizione, economia, commissioni, fine giornata con multa, salvataggi, Pescepedia, punti).
- Prova in Chrome headless (puppeteer, fuori dal repository) su telefono 390×844 e desktop 1280×900: menu, carriera, combattimento vinto da un bot, scheda cattura, bottega, mappa, commissioni, ghiacciaia, Pescepedia, i 4 luoghi con meteo e ore diverse, fine giornata → giorno 2, sfida 90 secondi giocata da un bot. Nessun errore JavaScript.
- **Non eseguito:** prova su telefono reale (vibrazione, multitouch con due dita, audio); le emoji nel browser di prova non avevano il font, sui telefoni si vedono.
- Non aggiunto un workflow GitHub Actions per i test (il token usato non ha il permesso `workflow`).

**Da fare**
- Provarlo su telefoni veri e ritoccare i numeri (velocità del tempo, prezzi, frequenza delle abboccate) in base a come lo gioca la gente.
- Idee successive: torneo di pesca settimanale, barca che si sposta nel Golfo, cucina del pescato con Zi' Teresa, obiettivi/trofei, sprite disegnati per i pesci al posto delle forme vettoriali.

**Riferimenti**
- Branch `pesca-grossa-2`, pull request verso `main`.

## 2026-10-19 — Grafica premium (Claude, Claude Code)

**Fatto**
- Nuovo motore grafico `art.js` (PESCA_ART): disegno alla risoluzione reale dello schermo (fino a 2x), fondali con sabbia/rocce/alghe e dettagli sommersi (colonne romane, ricci, stelle marine, posidonia), caustiche animate, raggi di sole, scintillii nella direzione del sole, onde, schiuma sulla riva e attorno agli scogli.
- Luoghi illustrati: Lago Patria (prato, alberi, sentiero, pontile in legno con secchio e cassetta, barchetta, canneto mosso dal vento, ninfee in fiore), Porto di Pozzuoli (tetti e cupola del Rione Terra, banchina in tufo, bitte, cassette, rete, lampioni, molo, gozzi ormeggiati, pali con cozze), Scogli di Posillipo (tufo giallo con macchia mediterranea, scogli affioranti), Golfo (gozzo, Capri e Faraglioni, boa, scia).
- Luce e meteo: alba e tramonto caldi, notte blu con luna, stelle riflesse, lucciole e lanterna; ombre delle nuvole, pioggia, vento, nebbia che scorre, lampi in burrasca; vignettatura; gabbiani di passaggio; vibrazione dello schermo su ferrata, salti e rotture.
- Pesci: ombre sfumate in cache, varianti Karmagra e leggendari con alone, illustrazioni dettagliate (gradienti, scaglie, pinne con raggi, segni tipici delle specie) per scheda cattura e Pescepedia; galleggiante, esche artificiali, canna con animazione di lancio.
- Interfaccia nuova: icone SVG disegnate a mano (niente emoji), HUD con icone, pannelli in vetro, pulsante principale con stati colorati (lancia/attesa/ferra/recupera), barre con bagliore e soglia della frizione, selettore esca e frizione a segmenti, barra strumenti carriera con badge, avvisi animati (in basso, per non coprire Biagio), carta della cattura colorata per rarità, Pescepedia con barra di avanzamento e cornici per rarità, scatola delle esche.

**Come e dove**
- `art.js` riceve lo stato del gioco e una piccola vista (ora, punta della canna, gittata, notte/lanterna/ecoscandaglio); `game.js` non disegna più nulla direttamente.
- Livelli statici (fondale e terraferma) preparati una volta per luogo; ombre dei pesci pre-sfumate. Se il dispositivo è lento il motore abbassa da solo la risoluzione e poi spegne caustiche/raggi/scintillii. Con un pannello aperto l'acqua si ridisegna a un quarto della frequenza.
- Regole di gioco invariate (`rules.js` non toccato in questo passaggio).

**Verifiche e stato**
- `node games/pesca-grossa/rules.test.js`: ok.
- Prova in Chrome headless (telefono 390×844 e desktop 1280×900): menu, mattina, combattimento vinto da un bot, carta della cattura, bottega, mappa, commissioni, ghiacciaia, Pescepedia, i 4 luoghi in 8 combinazioni di ora/meteo, fine giornata → giorno 2, sfida giocata da un bot. Nessun errore JavaScript.
- Disegno di un fotogramma nel browser di prova: circa 8 ms (senza scheda grafica). **Non eseguito:** prova su telefoni veri di fascia bassa.

**Da fare**
- Verificare fluidità e leggibilità su telefoni reali; eventualmente sprite disegnati a mano per i pesci e per Biagio in barca.

**Riferimenti**
- Branch `pesca-grossa-2`, PR #25.

## 2026-10-19 — Biagio animato e tre skin (Claude, Claude Code)

**Fatto**
- Biagio non è più l'SVG fermo `assets/biaggio-power.svg`: è disegnato e animato in `art.js` (respiro, sguardo verso galleggiante o pesce, canna che si carica nel lancio, corpo che si piega all'indietro con la tensione, manovella del mulinello che gira mentre si recupera, sudore con la lenza al limite).
- Espressioni: tranquillo, attento quando il galleggiante trema, sorpreso all'abboccata, concentrato e poi a denti stretti nel combattimento, deluso quando il pesce scappa, felice nel trofeo.
- Trofeo: alla cattura Biagio solleva il pesce sopra la testa per circa un secondo; in carriera la scheda della cattura si apre dopo.
- Canna più lunga e dettagliata (sughero, anelli, mulinello). Punta della canna spostata a (446,228) in `game.js` (`TIP0`), mano in `HAND`.
- Tre skin scelte dal Guardaroba (pulsante a forma di maglietta in alto e voce nel menu), con anteprime animate; la scelta resta in `biagio-pesca-prefs`:
  - **base**: pelato, canottiera nera, occhiali bianchi, braccia tatuate (fasce tribali, onde, ancora, rosa), cuore «MAMMA» sul petto, stella sul collo, orecchino e catenina d'oro;
  - **giovane**: cappellino rosso, maglietta blu, tracolla nera, pantaloncini color sabbia, come negli sprite di Effetto Karmagra e Scootercross;
  - **pesce** («Pescato!»): una cernia gigante col cappello da pescatore tiene Biagio in braccio come un trofeo; i suoi occhi seguono la lenza e la bocca reagisce all'azione.

**Verifiche e stato**
- `node games/pesca-grossa/rules.test.js`: ok. Prova in Chrome headless: le tre skin in attesa, combattimento e trofeo; guardaroba su telefono e desktop; giro completo carriera e sfida. Nessun errore JavaScript.
- **Non eseguito:** prova su telefono vero.

**Riferimenti**
- Branch `pesca-grossa-skin`.

## 2026-10-19 — Skin rifatte in due stili: vettoriale deluxe e pixel art (Claude, Claude Code)

**Fatto**
- Su richiesta, ognuno dei tre personaggi (Biagio Gelo tatuato, il giovane Biagio, «Pescato!» con la cernia gigante) ora esiste in **due stili**, per sei skin in tutto:
  - **vettoriale deluxe:** contorni marcati, ombre a due toni stile cartone animato, braccia modellate come muscoli (bicipite, avambraccio, polso), mani con pollice e dita, tatuaggi pieni e colorati (fiamme tribali, anello al gomito, rosa con foglie, ancora con cima, puntini al polso), cuore «MAMMA», cornetto rosso portafortuna, cuciture e fibbie, mulinello con bobina e archetto; cappellino con logo «B»; cernia con pinna dorsale, opercoli, squame, macchie e cappello cucito;
  - **pixel art:** sprite a bassa risoluzione (48×84 pixel ingranditi ×3) con palette limitata e contorno scuro automatico, ridisegnato a ogni fotogramma: braccia, canna, mulinello, espressioni, trofeo e cernia sono tutti in pixel.
- Guardaroba con le schede «Vettoriale» e «Pixel art»; la scelta (personaggio e stile) resta in `biagio-pesca-prefs`.

**Verifiche e stato**
- `node games/pesca-grossa/rules.test.js`: ok. Prova in Chrome headless: le sei skin in attesa, combattimento e trofeo; guardaroba con le due schede su telefono e desktop; giro completo carriera e sfida. Nessun errore JavaScript.
- **Non eseguito:** prova su telefono vero.

**Riferimenti**
- Branch `pesca-grossa-skin`, PR #27.
