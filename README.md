# Arcade Club — Sala giochi

> **GTA Melito — consegna a ChatGPT Work:** [handoff per il realismo grafico](./games/gta-melito/HANDOFF_WORK_REALISMO.md)
> (con [istruzioni agenti](./games/gta-melito/AGENTS.md) e [registro avanzamento](./games/gta-melito/VISUAL_PROGRESS.md)).

Raccolta di giochi arcade indipendenti in HTML, CSS e JavaScript, ospitata da GitHub Pages. La pagina iniziale presenta automaticamente i titoli registrati nel catalogo.

## Indirizzi

- **Sala giochi:** https://czekuns.github.io/Effettokarmagra/
- **Biagio Gelo in Effetto Karmagra:** https://czekuns.github.io/Effettokarmagra/games/effetto-karmagra/
- **Biagio Gelo — Pesca Grossa:** https://czekuns.github.io/Effettokarmagra/games/pesca-grossa/
- **Biagio Gelo: Scootercross:** https://czekuns.github.io/Effettokarmagra/games/scootercross/
- **I Ninomon — Cronache di strada:** https://czekuns.github.io/Effettokarmagra/games/ninomon/

GitHub Pages: `Settings → Pages → Deploy from a branch → main → /(root)`.

## Organizzazione

```text
/
├── index.html                     # Home Arcade Club: raccolta dei giochi
├── arcade/
│   └── catalog.js                 # Elenco centralizzato dei titoli
├── games/
│   ├── effetto-karmagra/
│   │   └── index.html             # Primo gioco completo
│   └── pesca-grossa/
│       ├── index.html             # Pagina, stile e pannelli (touch + tastiera)
│       ├── rules.js               # Regole: pesci, combattimento, economia, giornate
│       ├── game.js                # Input, pannelli, ciclo di gioco
│       ├── art.js                 # Motore grafico: acqua, luoghi, pesci, luce e meteo
│       ├── rules.test.js          # Test delle regole (node)
│       ├── WORK_LOG.md            # Registro degli interventi
│       └── fish.svg               # Icona vettoriale del gioco
│   └── scootercross/
│       ├── index.html             # Terzo gioco con fisica arcade
│       └── assets/
│           └── biagio-scooter.svg # Biagio sullo scooter bordeaux con bauletto
├── assets/                        # SVG condivisi del primo gioco
│   ├── biaggio-normal.svg
│   ├── biaggio-power.svg
│   ├── lady-*-long.svg
│   ├── lady-*-short.svg
│   └── pill.svg
└── README.md
```

## Come aggiungere un arcade

1. Crea una cartella `games/nome-del-gioco/` e inserisci il suo `index.html` giocabile.
2. Aggiungi gli asset del gioco, preferibilmente nella sua cartella o in una sottocartella dedicata.
3. Apri `arcade/catalog.js` e aggiungi una voce all'array `window.ARCADE_CATALOG`, per esempio:

```js
{
  id: "nome-del-gioco",
  title: "Nome del gioco",
  subtitle: "Una nuova avventura",
  genre: "Arcade / Azione",
  description: "Una descrizione breve per la scheda.",
  href: "./games/nome-del-gioco/",
  artwork: "./games/nome-del-gioco/copertina.svg",
  support: "Telefono e PC",
  status: "live"
}
```

La home crea automaticamente la nuova scheda. Imposta `status: "soon"` per un titolo in preparazione: apparirà nella raccolta senza link giocabile. Le proprietà opzionali `decoration` e `recordKey` consentono di mostrare un elemento grafico aggiuntivo e il record personale.

Il gioco esistente rimane separato e continua a funzionare anche quando si aggiungono nuove schede. Per tornare al catalogo, ogni gioco può includere il link `../../index.html`.

## Biagio Gelo in Effetto Karmagra

Arcade top-down con labirinto 15×15, palline bianche, potenziamento Karmagra, signorine con cambio di gonna, punteggio, tre vite e livelli successivi.

- **PC:** frecce, WASD e barra spaziatrice per la pausa.
- **Telefono:** tastierino direzionale sotto il labirinto oppure swipe.
- **Karmagra:** effetto temporaneo di 9 secondi; Biagio diventa calvo e veste di nero; le signorine indossano una gonna corta.
- **Colonna sonora:** musica 8-bit originale sintetizzata con Web Audio, con tasto ON/OFF.
- **Grafica:** 10 asset personaggio SVG nativi + capsula SVG. Asset condivisi in `assets/`; il gioco li richiama tramite `../../assets/`.

## Biagio Gelo — Pesca Grossa 2.0

Secondo arcade giocabile, con lo **stesso SVG di Biagio calvo e vestito di nero** usato nel potenziamento di Effetto Karmagra (`assets/biaggio-power.svg`). Dall'ottobre 2026 è un gioco di pesca con **carriera**, ispirato alle meccaniche dei migliori giochi del genere (ombre e abboccate alla Animal Crossing, tensione/frizione/energia del pesce dei simulatori, giornate e ghiacciaia alla Dredge, pesci leggendari alla Stardew Valley).

- **Due modalità:** *Carriera* (giornate dalle 5:00 alle 21:00, fino a mezzanotte con la lanterna; salvataggio automatico) e *Sfida 90 secondi* (la modalità classica; il record resta in `biagio-pesca-record` e compare nella home).
- **Quattro luoghi:** Lago Patria, Porto di Pozzuoli (Abbonamento Cumana), Scogli di Posillipo (lo scooter di Scootercross riparato) e Golfo al largo (gozzo a motore). Fondali diversi, profondità visibile sul mirino, rocce e tane.
- **31 specie** con orari, meteo, profondità ed esche preferite, misura minima reale e taglia variabile (lunghezza e peso). **Cinque leggendari** con condizioni speciali, svelate dalle bottiglie con messaggio. Specie protette (anguilla, tonno rosso) solo da fotografare e liberare.
- **Abboccata:** le ombre si avvicinano all'esca, assaggiano (il galleggiante trema) e poi abboccano: si ferra solo quando va sotto. Ferrata perfetta = pesce più stanco e qualità migliore. Le esche artificiali vanno recuperate lentamente.
- **Combattimento:** tensione, filo ceduto ed energia del pesce. Il pesce tira, fugge, salta, si riposa o punta alla tana; si piega la canna dal lato opposto (◀ ▶, scorrendo il dito sul pulsante o con ←/→) e si regola la **frizione** (morbida/media/dura). Si perde per lenza spezzata, bobina vuota, lenza lasca o pesce intanato.
- **Economia:** ghiacciaia con capienza e freschezza, pescheria, bottega (13 esche, 4 canne, 3 mulinelli, 4 lenze, 4 ghiacciaie, guadino, lanterna, ecoscandaglio), commissioni giornaliere dei personaggi (fama che sblocca l'attrezzatura), controlli della Guardia Costiera sul pescato sotto misura.
- **Karma e varianti Karmagra:** liberare pesci e togliere rifiuti dall'acqua aumenta il karma; più karma = più pesci rari e più varianti Karmagra viola (valore ×3).
- **Meteo e luce:** sereno, nuvoloso, vento (sposta il lancio), pioggia, nebbia, burrasca; alba, tramonto e notte; mangianze con i gabbiani.
- **Pescepedia** con record, orari ed esche scoperte, collezione di oggetti e statistiche.
- **Biagio animato e skin:** Biagio è disegnato e animato (lancio, combattimento, espressioni, trofeo col pesce sopra la testa). Dal Guardaroba si sceglie tra tre personaggi, ognuno in due stili (vettoriale deluxe e pixel art): Biagio Gelo tatuato, il giovane Biagio col cappellino rosso, e «Pescato!», una cernia gigante che tiene Biagio in braccio.
- **Grafica:** canvas alla risoluzione reale dello schermo con caustiche, raggi di sole, riflessi, schiuma, alba/tramonto/notte con luna e lucciole, nebbia e pioggia; luoghi illustrati (pontile e canneto, Rione Terra, tufo di Posillipo, Faraglioni); interfaccia con icone SVG, pannelli in vetro e carte delle catture per rarità. Su dispositivi lenti la qualità si abbassa da sola.
- Condivisione del punteggio della sfida su WhatsApp. Nessuna risorsa esterna o backend.
- **Test:** `node games/pesca-grossa/rules.test.js` (dati coerenti, ogni specie pescabile, bilanciamento dei combattimenti, economia, commissioni, salvataggi).

## Biagio Gelo: Scootercross — Via Roma, Melito

Terzo arcade: corsa a scorrimento laterale in **telefono orizzontale** o su PC. Il gioco invita a ruotare lo smartphone quando è in verticale.

- Scenario 16-bit in pixel art ispirato a **Via Roma a Melito di Napoli**, con facciate differenti, balconi, tende, negozi, alberi e auto parcheggiate. È una reinterpretazione illustrata, non una ricostruzione geografica esatta.
- Personaggio in PNG pixel art `games/scootercross/assets/biagio-scooter-illustrated.png`, con fallback allo sprite SVG: Biagio con cappellino rosso, occhiali bianchi e scooter bordeaux col bauletto.
- Canvas 480×270 a scorrimento laterale, salti, buche, barili, monete, turbo e tre vite.
- **Controlli touch, lato sinistro:** SALTA e IMPENNA, pulsanti tondi.
- **Controlli touch, lato destro:** FRENO tondo più piccolo, accanto ad ACCELERA grande e tondo. TURBO rimane un pulsante compatto sotto la pista.
- **Impennata a rischio:** tieni premuto IMPENNA mentre vai a velocità sufficiente. La barra EQUILIBRIO sale e accumuli punti; rilascia prima del rosso o ti ribalti perdendo una vita. Il punteggio rimane acquisito anche dopo un ribaltamento.
- **PC:** → o D accelera, ← o A frena, Spazio salta, ↑ o W impenna, ↓ o S inclina avanti durante i salti, Shift turbo, P pausa.
- Record personale in locale e suoni chiptune; a fine partita, link **Condividi il punteggio su WhatsApp**, presente anche nel menu superiore durante la corsa. Il messaggio contiene il punteggio corrente e il link diretto al gioco.

## I Ninomon — Cronache di strada (Capitolo 0)

Quarto titolo di Arcade Club: **RPG urbano a turni in stile console portatile anni '90**. Sprite PNG originali forniti dall’utente, senza utilizzare materiale Pokémon.

**Grafica SNES Street Edition (9 ottobre 2026):**
- **Framebuffer nativo 320×317 pixel**; guscio NINOBOY e schermo sul telefono mantengono le stesse dimensioni fisiche. L'area visibile è circa **10×10 caselle**, quindi non cambia lo zoom né il movimento.
- **Metatile 32×32** con microdettagli a livello di singolo pixel. Sei-otto colori di scena per zona; asfalto crepato, traversine, recinzioni, cemento, saracinesche, graffiti e dettagli del quartiere. Nessun filtro sfocato o gradiente.
- **Pavimentazioni continue dai tileset originali:** `games/ninomon/assets/street-floor-tiles.png` (320×96) contiene 30 campioni autentici da 32×32, dieci per area: lastroni crepati e pietrisco allo scalo, cemento umido e ghiaia al sottopasso, asfalto consumato e segnaletica nel vicolo. Ora coprono **ogni tile del terreno**, con variazioni deterministiche in gruppi e pozzanghere/linee stradali in punti sensati. Le vecchie decorazioni PNG casuali sono ridotte a pochi props ambientali contestuali.
- **Rendering sicuro su Android:** se l'atlante delle superfici tarda a caricarsi, vengono disegnati i vecchi tile procedurali; la cache viene aggiornata appena l'immagine arriva. Collisioni, percorsi e salvataggi restano invariati.
- **Atlante ad alta definizione 656×912** `games/ninomon/assets/ninomon-snes-atlas.png` derivato dalle reference originali fornite dall'utente: 36 frame dei tre personaggi, i mostri fronte/retro, due pose del professor Vincenzo e i dettagli stradali. La palette PNG è ottimizzata a 48 colori con trasparenza conservata.
- **Sprite più fini, stessa grandezza apparente:** Nino, Gialluca e Vincenzo sono disegnati sul nuovo framebuffer con sprite sorgente 48×64, proiettati a circa 34×49; in battaglia gli avversari utilizzano sprite sorgente 112×112 e visualizzazione 100×100.
- **Battaglie SNES-like a 320×288:** ambientazioni ferroviarie, sottopasso e saracinesche; pannelli PS/Fiato, nuove dimensioni del testo e menu mosse 2×2.
- **Apertura da JRPG portatile classico:** schermata titolo NINOBOY, ingresso del professor Vincenzo a figura grande, spiegazione del mondo, presentazione di Gialluca come primo Ninomon, presentazione del trainer Nino, consegna della Ninodex e partenza dal lago verso lo scalo. Sette dialoghi illustrati con scene diverse; si procede con il pulsante a schermo o con A. Lo sprite di Vincenzo, il front sprite di Gialluca e lo sprite HD di Nino provengono dalle reference dell'utente. Il filmato introduttivo può essere rivisto dalla Ninodex senza cancellare il salvataggio.
- `retro.js` resta come fallback grafico; `snes.js` abilita la nuova qualità quando gli asset sono disponibili. L'interfaccia HTML conserva la croce direzionale, A/B, safe-area e scorrimento sui display piccoli.

**Gameplay aggiornato:** tre ambienti esplorabili con **dieci avvistamenti** e movimento a passi di una casella alla volta (animazione 170 ms/tile), collisioni con ostacoli, Ninomon e NPC. I passanti effettuano piccole pattuglie con movimento interpolato; il protagonista usa sprite multi-frame per i passi e il Ninomon attivo lo segue visivamente sulla mappa. Dopo il primo avvistamento sono possibili anche **incontri casuali rari**, con periodo di sicurezza tra uno e l'altro.
- **Tre indizi di quartiere:** tabellone dei treni, graffito sotto il ponte e scatola delle prove. Si esaminano, vengono riportati nella Ninodex e danno un **bonus permanente di +1 Fiato massimo** a tutte le creature della squadra.
- **Checkpoint automatico:** posizione, zona, indizi e avanzamento dell'introduzione salvati in locale. Una partita ripresa non ripete la scena iniziale; dalla Ninodex si può rivedere l’assegnazione di **Gialluca da parte del professor Vincenzo** senza perdere i progressi. "Nuova partita" azzera i progressi solo dopo conferma.
- **Battaglie a turni rinnovate:** 32 mosse in otto categorie e quattro gradi; ordine delle azioni deciso da **priorità, velocità e stato**. Le mosse base sono veloci, le mosse più forti richiedono più Fiato e quelle massime agiscono più lentamente. Precisione, vantaggi di tipo, bonus del quartiere e condizioni (stordito, appestato, impiastricciato, scivoloso, intimorito) incidono sui turni.
- **Contromosse leggibili:** prima di scegliere il giocatore vede la **prossima mossa del nemico** e il danno stimato. Può attaccare, **difendersi** (riduce i danni a circa il 45% e recupera Fiato), riprendere Fiato, cambiare Ninomon oppure fuggire. Il nemico decide in anticipo e rispetta la mossa annunciata; un cambio volontario usa il turno, mentre il cambio obbligatorio dopo un KO non subisce un colpo gratuito.
- **Presentazione combattimenti:** sequenza attacco/risposta, sprite che avanzano, flash del colpo, danni visibili, barre PS, stati, messaggi e suoni. Sul telefono un tocco sul display salta la sequenza senza saltare il risultato. Quattro mosse equipaggiate a schermata, pulsanti grandi per recupero, difesa, cambio e fuga. I PS della squadra restano persi fino alla fine della singola lotta; fotografare il Ninomon richiede vincere.
- Fotografia e registrazione nella Ninodex soltanto dopo una vittoria; le mosse di grado superiore si sbloccano con gli avvistamenti senza livelli esperienza.

**Comandi:** D-pad e A Esamina / B Ninodex su telefono. PC frecce o WASD per camminare, E/Invio per esaminare, I Ninodex, 1–4 mosse, C per cambiare Ninomon, F Fiato, G Difendi, Esc Fuga. Durante le animazioni Enter/Spazio/Esc permettono di avanzare subito.

File: `games/ninomon/index.html`, `games/ninomon/retro.js`, `games/ninomon/snes.js`, `games/ninomon/game.js`, `games/ninomon/battle.js`, `games/ninomon/assets/ninomon-atlas.png`, `games/ninomon/assets/ninomon-snes-atlas.png`, `games/ninomon/assets/atlas.json`, `games/ninomon/cover.svg`.


## Missioni di strada — Ninomon (10 ottobre 2026)

Otto missioni originali attraversano la città 8×8 e coinvolgono abitanti, allenatori, indizi e nuovi quartieri: **Il pezzo cancellato**, **La notte senza musica**, **Le cassette di Carmela**, **Il sacco che cammina**, **L'ultima consegna di Toni**, **Frequenza fantasma**, **La crew attraversa la città**, **L'ultima firma**.

- **★ MISSIONI** nella parte alta della console (o **Q** su PC) apre il diario con obiettivi, ricompense e missioni disponibili. Si può seguire una missione e MAPPA segnala il quadrante obiettivo.
- Una **Q** sopra la testa identifica personaggi che offrono o avanzano missioni e gli allenatori collegati all'obiettivo seguito.
- Completare le quest dà reputazione e oggetti narrativi da collezione; tre ricompense danno +1 Fiato massimo ciascuna, cumulabili con il bonus degli indizi originali.
- La logica è in games/ninomon/quests.js e i progressi sono nel checkpoint ninomon-save-v2, campo quests. Le partite precedenti restano compatibili e i traguardi già raggiunti vengono riconosciuti.
- Test: node games/ninomon/quests.test.js (in aggiunta ai test del mondo, combattimenti e sprite).

## Tecnologia

Pagine statiche e JavaScript nativo, senza backend né librerie esterne obbligatorie. I record locali sono salvati nel browser. Il catalogo è gestito come un semplice file JavaScript per funzionare anche su GitHub Pages senza server.


## GTA Melito — Open world top-down (prototipo 0.4, ottobre 2026)

Quinto gioco di Arcade Club: esplorazione di Melito di Napoli a piedi e in auto, con geometria urbana reale ricavata da OpenStreetMap (ODbL). Il confine del comune è quello ISTAT 2026 (CC BY), conservato in `games/gta-melito/data/boundary.json`.

- **Gioca:** https://czekuns.github.io/Effettokarmagra/games/gta-melito/
- **Controlli:** WASD/frecce; E entra/esci dall'auto; Shift corri; spazio freno a mano; pulsanti touch, zoom e minimappa.
- **Cartografia:** lo snapshot `games/gta-melito/data/melito-map.json` è generato da `node scripts/build-melito-map.mjs` e da GitHub Actions. Se ancora assente, il gioco tenta il download diretto dai server Overpass e la cache locale. In assenza di dati reali non mostra una città inventata.
- **Stato:** mappa topografica, forme dei palazzi, guida, incroci collegati da un grafo OSM, traffico che svolta, sagome dei palazzi con tetti/ombre, marciapiedi e arredo urbano rétro; semafori, missioni narrative avanzate e architetture iconiche da rifinire. Il prototipo 0.3 aggiunge quattro missioni tra luoghi OSM reali, personaggi fittizi, salvataggi locali e mappa missioni. I motori esaminati come riferimento includono Anywhere City Web (MIT) e Punjab Stories (MIT); la prima versione usa Canvas per garantire leggerezza su GitHub Pages.

Guida completa e licenze: [games/gta-melito/README.md](games/gta-melito/README.md).

### GTA Melito 0.4 — resa urbana e accessibilità touch

- Interfaccia di gioco non selezionabile su pressione prolungata; pannello missioni ripiegato per dare priorità alla mappa.
- Rendering 2D rinnovato di strade, tetti storici/moderni, personaggi e veicoli; riconoscibili la chiesa di Santa Maria delle Grazie e l'area del Municipio, a partire dai footprint OSM e da riferimenti comunali pubblici.
- Insegne con nomi OSM vicino alle strade, ricreazione estetica **non fotografica** degli edifici.

### Sopralluogo GTA Melito, dal confine (0.4.1)

Un registro OSM di 2.056 edifici divisi in 34 settori, con mappa consultabile in `games/gta-melito/survey/` e 47 prime schede individuali di stile, ancora da validare su foto. I link Google Maps e Street View aprono il provider senza incorporarne immagini. Il prossimo settore è S003.

## For Four Chocolate — anteprima (21 ottobre 2026)

**In preparazione, non ancora giocabile.** [Pagina di anteprima](./games/for-four-chocolate/) · [Obiettivo e specifiche](./games/for-four-chocolate/OBIETTIVO-FOR-FOUR-CHOCOLATE.md) · [Registro di sviluppo](./games/for-four-chocolate/WORK_LOG.md).

Stealth arcade con Domenico Ipno in un supermercato ceco: guardie POLICIE, telecamere, cioccolato, fuga, record e futuro epilogo comico. Le [reference fotografiche ottimizzate](./games/for-four-chocolate/references/) contengono due immagini di Ipno con cappello di paglia e una di Totore Capellone. Sono **reference**, non sprite finali. La home usa `status: "preview"`, cliccabile ma esclusa dal conteggio dei giochi giocabili.
