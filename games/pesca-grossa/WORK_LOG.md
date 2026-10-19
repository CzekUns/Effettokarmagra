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
