# Arcade Club — Sala giochi

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
│       ├── index.html             # Pesca touch + tastiera
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

## Biagio Gelo — Pesca Grossa

Secondo arcade giocabile, con lo **stesso SVG di Biagio calvo e vestito di nero** usato nel potenziamento di Effetto Karmagra (`assets/biaggio-power.svg`), caricato tramite percorso relativo `../../assets/biaggio-power.svg`.

- Visuale dall'alto: Biagio pesca da un pontile.
- Tocca il lago per lanciare o usa il pulsante **LANCIA** per mirare automaticamente a un pesce.
- Aspetta l'abboccata, poi tieni premuto **RECUPERA** e rilascialo quando cresce la tensione, altrimenti la lenza si spezza.
- Quattro pesci con punteggi e resistenze diversi: sardina, orata, spigola, pesce d'oro.
- Sfida a tempo da 90 secondi, bonus per catture consecutive, record salvato nel browser.
- Supporto mobile, mouse, frecce + spazio; piccoli effetti e accompagnamento audio sintetizzato.
- Nessuna risorsa esterna o backend.

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
- **Framebuffer nativo 320×288 pixel**; guscio NINOBOY e schermo sul telefono mantengono le stesse dimensioni fisiche. L'area visibile rimane **10×9 caselle**, quindi non cambia lo zoom né il movimento.
- **Metatile 32×32** con microdettagli a livello di singolo pixel. Sei-otto colori di scena per zona; asfalto crepato, traversine, recinzioni, cemento, saracinesche, graffiti e dettagli del quartiere. Nessun filtro sfocato o gradiente.
- **Atlante ad alta definizione 656×912** `games/ninomon/assets/ninomon-snes-atlas.png` derivato dalle reference originali fornite dall'utente: 36 frame dei tre personaggi, i mostri fronte/retro, due pose del professor Vincenzo e i dettagli stradali. La palette PNG è ottimizzata a 48 colori con trasparenza conservata.
- **Sprite più fini, stessa grandezza apparente:** Nino, Gialluca e Vincenzo sono disegnati sul nuovo framebuffer con sprite sorgente 48×64, proiettati a circa 34×49; in battaglia gli avversari utilizzano sprite sorgente 112×112 e visualizzazione 100×100.
- **Battaglie SNES-like a 320×288:** ambientazioni ferroviarie, sottopasso e saracinesche; pannelli PS/Fiato, nuove dimensioni del testo e menu mosse 2×2.
- **Introduzione al Lago dei Ninomon** con le pose del professor Vincenzo, Nino, Gialluca e sette dialoghi. Rimane disponibile la funzione per rivederla dalla Ninodex.
- `retro.js` resta come fallback grafico; `snes.js` abilita la nuova qualità quando gli asset sono disponibili. L'interfaccia HTML conserva la croce direzionale, A/B, safe-area e scorrimento sui display piccoli.

**Gameplay aggiornato:** tre ambienti esplorabili con **nove avvistamenti** e movimento a passi di una casella alla volta (animazione 170 ms/tile), collisioni con ostacoli, Ninomon e NPC. I passanti effettuano piccole pattuglie con movimento interpolato; il protagonista usa sprite multi-frame per i passi e il Ninomon attivo lo segue visivamente sulla mappa. Dopo il primo avvistamento sono possibili anche **incontri casuali rari**, con periodo di sicurezza tra uno e l'altro.
- **Tre indizi di quartiere:** tabellone dei treni, graffito sotto il ponte e scatola delle prove. Si esaminano, vengono riportati nella Ninodex e danno un **bonus permanente di +1 Fiato massimo** a tutte le creature della squadra.
- **Checkpoint automatico:** posizione, zona, indizi e avanzamento dell'introduzione salvati in locale. Una partita ripresa non ripete la scena iniziale; dalla Ninodex si può rivedere l’assegnazione di **Gialluca da parte del professor Vincenzo** senza perdere i progressi. "Nuova partita" azzera i progressi solo dopo conferma.
- **Battaglie:** 32 mosse in otto categorie, quattro gradi, Fiato, effetti di stato, quattro mosse equipaggiate e Fuga. Le categorie hanno **vantaggi e resistenze** che influenzano il danno. Durante la lotta è possibile **cambiare Ninomon** tra quelli già fotografati: ogni cambio consuma un turno, i PS individuali restano persi fino alla fine della sfida e, se uno va KO, deve entrare un compagno ancora in piedi.
- Fotografia e registrazione nella Ninodex soltanto dopo una vittoria; le mosse di grado superiore si sbloccano con gli avvistamenti senza livelli esperienza.

**Comandi:** D-pad e A Esamina / B Ninodex su telefono. PC frecce o WASD per camminare, E/Invio per esaminare, I Ninodex, 1–4 mosse, C per cambiare Ninomon, F Fiato, Esc Fuga.

File: `games/ninomon/index.html`, `games/ninomon/retro.js`, `games/ninomon/snes.js`, `games/ninomon/game.js`, `games/ninomon/battle.js`, `games/ninomon/assets/ninomon-atlas.png`, `games/ninomon/assets/ninomon-snes-atlas.png`, `games/ninomon/assets/atlas.json`, `games/ninomon/cover.svg`.

## Tecnologia

Pagine statiche e JavaScript nativo, senza backend né librerie esterne obbligatorie. I record locali sono salvati nel browser. Il catalogo è gestito come un semplice file JavaScript per funzionare anche su GitHub Pages senza server.
