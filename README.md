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

## Biagio Gelo: Scootercross

Terzo titolo di Arcade Club, in stile vecchio motocross arcade, con Biagio riconoscibile dall'abbigliamento della reference (cappellino rosso, occhiali bianchi, maglietta blu, pantaloncini beige e tracolla) su uno **scooter bordeaux con bauletto**. Il personaggio e il mezzo sono un asset SVG nativo realizzato appositamente per il gioco.

- Pista mediterranea a scorrimento laterale lunga 6.300 unità, rampe, salti, barili, monete e traguardo.
- Controlli PC: frecce o WASD per accelerare, frenare, cabrare e picchiare; barra spaziatrice per il turbo; P per la pausa.
- Controlli smartphone: pulsanti ampi sotto il gioco, pressione continua, turbo dedicato.
- Fisica arcade con gravità, rotazione in volo, atterraggi ed eventuali cadute; tre vite.
- Bonus salti e monete, turbo ricaricabile, punteggio, cronometro e record nel browser.
- Musica ed effetti sonori 8-bit generati con Web Audio e disattivabili.
- Alla fine della corsa o dopo il game over: pulsante WhatsApp che condivide il punteggio e rimanda direttamente al gioco.
- Il gioco è interamente statico in HTML/CSS/JS + SVG e non dipende da framework esterni.

## Tecnologia

Pagine statiche e JavaScript nativo, senza backend né librerie esterne obbligatorie. I record locali sono salvati nel browser. Il catalogo è gestito come un semplice file JavaScript per funzionare anche su GitHub Pages senza server.
