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

Quarto titolo di Arcade Club: **RPG urbano a turni in stile console portatile anni '90**. Disegni originali, senza copiare asset Pokémon.

**Rifacimento grafico:**
- Framebuffer **160×144**, reso pixelated dal browser; metatile **16×16** composti da pattern **8×8**.
- Renderer separato `games/ninomon/retro.js`: 23 modelli di tile, tre palette da quattro colori opachi, senza sfumature né antialiasing.
- Scalo ferroviario con binari, vagoni, recinzioni e magazzini; sottopasso con pilastri, grate e pozzanghere; strada di servizio con saracinesche e asfalto rotto.
- Introduzione al **Lago dei Ninomon** con Nino e **Gianlluca (due L)**: sette brevi dialoghi con box inferiore.
- Nino, Gianlluca, passanti e mostriciattoli originali a pixel. Front sprite e back sprite per ogni creatura.
- Schermata battaglia a 160×144 con sfondi diversi per zona, PS, Fiato e finestre pixel; menu mosse 2×2.
- Scocca NINOBOY con D-pad, pulsanti A/B, margini safe-area e pagina scorrevole per schermi piccoli. Grafica definitiva dei personaggi da creare sulle reference.

**Gameplay:** tre ambienti esplorabili, NPC dialoganti, tre avvistamenti, Ninodex e salvataggi nel browser. Dopo una battaglia vinta si scatta la fotografia. `battle.js`: 32 mosse in otto categorie, quattro gradi, Fiato, effetti di stato, quattro mosse equipaggiate, squadre e Fuga. Le tecniche avanzate si sbloccano con le scoperte, senza livelli esperienza.

**Comandi:** D-pad e A Esamina / B Ninodex su telefono. PC frecce o WASD per camminare, E/Invio per esaminare, I Ninodex, 1–4 mosse, F Fiato, Esc Fuga.

File: `games/ninomon/index.html`, `games/ninomon/retro.js`, `games/ninomon/game.js`, `games/ninomon/battle.js`, `games/ninomon/cover.svg`.

## Tecnologia

Pagine statiche e JavaScript nativo, senza backend né librerie esterne obbligatorie. I record locali sono salvati nel browser. Il catalogo è gestito come un semplice file JavaScript per funzionare anche su GitHub Pages senza server.
