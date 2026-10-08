# Effetto Karmagra — Il giovane Biaggio Gelo

Primo prototipo **giocabile** di un arcade top-down originale da labirinto, basato sul personaggio della reference.

## Avvio e pubblicazione

Apri `index.html` in un browser moderno, oppure attiva **Settings → Pages → Deploy from a branch → main → /(root)**.

Indirizzo previsto dopo l'attivazione: https://czekuns.github.io/Effettokarmagra/

## Come si gioca

- **Computer:** frecce oppure WASD; barra spaziatrice per pausa.
- **Telefono:** scorri il dito sul labirinto o usa i pulsanti direzionali.
- **Palline bianche:** +10 punti, raccoglile per finire il livello.
- **Pillole grandi:** +50 punti, attivano l'effetto Karmagra per 9 secondi.
- **Biaggio normale:** cappello rosso, occhiali bianchi, maglietta blu, pantaloncini beige, tracolla.
- **Biaggio potenziato:** calvo e vestito di nero.
- **Signorine:** nemiche con gonne lunghe; dopo una pillola, indossano gonne corte e possono essere catturate (+200 punti).
- Tre vite, record salvato nel browser, livelli con labirinti differenti, audio opzionale.

## File

- `index.html` — gioco completo, HTML/CSS/JavaScript Canvas, con layout responsive.
- `assets/biaggio-normal.svg` e `assets/biaggio-power.svg` — protagonista.
- `assets/lady-red-long.svg`, `assets/lady-red-short.svg` — signorina rossa.
- Altre tre coppie equivalenti: `violet`, `green`, `gold`.
- `assets/pill.svg` — pillola grande.

**Asset vettoriali nativi:** modificabili da SVG senza raster incorporati. Tutte le risorse sono locali al progetto e non richiedono framework o CDN.

## Stato e limiti

MVP giocabile: asset stilizzati in SVG che riprendono abbigliamento e palette della reference, ancora da raffinare fino alla profondità e ricchezza della mockup. Il test automatico della logica di movimento e raccolta palline è passato; la resa nei vari browser e la configurazione GitHub Pages devono essere verificate separatamente.
