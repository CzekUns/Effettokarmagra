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

Quarto gioco di Arcade Club. Un RPG urbano con Nino, Gianlluca (due L), esplorazione, combattimenti a turni e raccolta di fotografie nella Ninodex.

- **Tre zone** con personaggi ed esplorazione: scalo ferroviario, sottopasso, strada di servizio.
- **Il combattimento è reale:** si attiva quando Nino esamina un Ninomon, premendo SFIDA. La foto viene registrata nella Ninodex soltanto dopo una vittoria.
- **32 mosse** (`8 categorie × 4 gradi`): Rutto, Sputo, Cacca, Puzza, Pipì, Rottami, Schiamazzo e Sfiga. Grado = complessità/potenza della mossa; il Ninomon non sale di livello.
- **4 mosse equipaggiate** per Ninomon, con potenza, precisione, consumo di Fiato, vantaggio ambientale ed effetti di stato (stordito, impiastricciato, appestato, scivoloso, intimorito).
- **Fiato:** 6 punti iniziali e massimi, recupero +1 per round. Azione Riprendi Fiato recupera ulteriori 3 punti; Fuga interrompe la sfida senza fotografia.
- **Tecniche avanzate:** un set di Grado 3 si sblocca con due avvistamenti, quello di Grado 4 con tre; non esiste una progressione per livelli del personaggio.
- **Squadra:** un Ninomon provvisorio prestato da Gianlluca apre la partita; le creature fotografate possono essere scelte come Ninomon attivo dalla Ninodex. Scelta e catture vengono salvate in locale.
- **Interfaccia mobile Game Boy:** scocca NINOBOY con schermo interno, quattro tasti direzionali, A/B, cornice di sicurezza, gestione safe-area del telefono; modalità battaglia con quattro grandi pulsanti delle mosse, Riprendi Fiato e Fuga.
- Gestione dello zoom nel gioco: meta viewport a scala iniziale bloccata, touch-action sullo schermo e sulla croce direzionale per evitare zoom accidentale. L'interfaccia resta nel normale flusso della pagina e può scorrere su display estremamente piccoli, senza tagliare i comandi.
- **PC:** frecce/WASD per camminare, E/Invio per esaminare, I per la Ninodex, numeri 1–4 per le mosse, F per il Fiato, Esc per fuggire.
- I personaggi e i Ninomon hanno ancora **grafica provvisoria**, in attesa delle reference originali. Nessuna risorsa Pokémon copiata.

File principali: `games/ninomon/index.html` (scocca e UI), `games/ninomon/game.js` (avventura), `games/ninomon/battle.js` (regole dei turni e catalogo mosse), `games/ninomon/cover.svg`.

## Tecnologia

Pagine statiche e JavaScript nativo, senza backend né librerie esterne obbligatorie. I record locali sono salvati nel browser. Il catalogo è gestito come un semplice file JavaScript per funzionare anche su GitHub Pages senza server.
