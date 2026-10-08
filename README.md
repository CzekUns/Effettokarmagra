# Arcade Club — Sala giochi

Raccolta di giochi arcade indipendenti in HTML, CSS e JavaScript, ospitata da GitHub Pages. La pagina iniziale presenta automaticamente i titoli registrati nel catalogo.

## Indirizzi

- **Sala giochi:** https://czekuns.github.io/Effettokarmagra/
- **Biagio Gelo in Effetto Karmagra:** https://czekuns.github.io/Effettokarmagra/games/effetto-karmagra/
- **Biagio Gelo — Pesca Grossa:** https://czekuns.github.io/Effettokarmagra/games/pesca-grossa/
- **Biagio Gelo: Scootercross:** https://czekuns.github.io/Effettokarmagra/games/scootercross/

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

Terzo arcade: **motocross a scorrimento laterale**, ispirato alla leggibilità e alla palette dei vecchi arcade 8-bit. Si gioca con **telefono orizzontale** o su PC. Sul telefono tenuto in verticale compare un invito a ruotarlo.

- Ambientazione pixel art di **Via Roma a Melito di Napoli**, con edifici residenziali, balconi, tende da negozio, attività commerciali, lampioni, alberi, marciapiede e auto parcheggiate. Interpretazione stilizzata: non riproduzione esatta degli edifici o della geometria stradale.
- Sprite vettoriale 8-bit laterale `games/scootercross/assets/biagio-side-pixel.svg`: Biagio con cappello rosso, occhiali bianchi, maglia blu, pantaloncini beige, sullo scooter bordeaux con bauletto.
- Canvas **480×270**, disegnato a pixel netti e ingrandito senza antialias.
- Fisica arcade: accelerazione, frenata, salto manuale, gravità, inclinazione dello scooter in volo, atterraggio, ostacoli e tre vite.
- **Comandi touch**, ai lati del campo: FRENA, ACCELERA, SALTA, INCLINA SU, INCLINA GIÙ, TURBO.
- **PC:** frecce o WASD per accelerare, frenare e inclinarsi, spazio per saltare, Shift per turbo, P per pausa.
- Monete, bonus di salto e atterraggio, tempo, progresso, record salvato nel browser, musica elettronica 8-bit, effetti sonori sintetizzati.
- A fine partita: condivisione WhatsApp del punteggio, con link diretto al gioco.

Questo sostituisce la precedente variante a scorrimento verticale. Altri asset prototipali rimangono nella cartella del gioco, senza essere caricati dalla versione attiva.

## Tecnologia

Pagine statiche e JavaScript nativo, senza backend né librerie esterne obbligatorie. I record locali sono salvati nel browser. Il catalogo è gestito come un semplice file JavaScript per funzionare anche su GitHub Pages senza server.
