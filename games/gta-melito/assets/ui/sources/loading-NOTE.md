# Lotto 4 — schermata di caricamento

Le due immagini finali derivano dai render reali di Via Roma alle 19:10 forniti da Claude: `render-1280x720.png` e `render-844x390.png`. Il generatore mantiene le dimensioni originali e i pixel netti. Nel render desktop rimuove il segnaposto giallo del giocatore copiando una piccola zona di asfalto dallo stesso fotogramma; nel taglio telefono il segnaposto non compare. Aggiunge una vignettatura leggera agli angoli e una fascia scura graduale che comincia al 78% dell'altezza. Titolo, testo, barra e pulsante restano HTML: nessun testo è aggiunto alle immagini.

## File prodotti

- `genera.py`: postproduzione ripetibile dei due render con Pillow e NumPy; nessun ridimensionamento o filtro di sfocatura.
- `loading-1280x720.png`: 1280 × 720 px, 177.804 byte.
- `loading-844x390.png`: 844 × 390 px, 159.300 byte.
- `verifica.py`: controllo indipendente dal generatore e dalla cartella corrente; verifica dimensioni, PNG, peso sotto 400.000 byte, fascia, vignetta, fedeltà alla scena, nitidezza e assenza del segnaposto giallo.
- `NOTE.md`: istruzioni per l'integrazione.

## Collegamento in `index.html`

Copiare i PNG finali, per esempio in `assets/loading/`. Nella regola esistente di `.loading`, sostituire il fondo uniforme e allineare gli elementi HTML nella parte bassa. Non aggiungere un'altra sfumatura CSS sopra l'immagine: è già nel PNG.

```css
.loading {
  background-color: #111419;
  background-image: url('./assets/loading/loading-1280x720.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  image-rendering: pixelated;
  justify-content: flex-end;
  padding: 24px;
}
@media (max-width: 680px) {
  .loading {
    background-image: url('./assets/loading/loading-844x390.png');
    background-size: cover;
    background-position: center;
    gap: 4px;
    padding: 8px 10px;
  }
  .loading h2 { font-size: 18px; }
  .loading p { font-size: 11px; line-height: 1.2; }
}
```

Il CSS attuale usa `justify-content:center`, quindi quel valore va aggiornato quando si collega lo sfondo. La sezione `.loading` ora contiene titolo, testo e pulsante `RIPROVA`, ma non una barra HTML: Claude può aggiungerla nella PR e controllare che titolo, testo e barra entrino nella fascia bassa anche sul telefono. Se il testo di errore è più lungo, servirà verificare anche quello stato nel browser.

## Verifica

Eseguiti `python3 genera.py` e, da `/tmp`, `python3 /home/ubuntu/codex-gh-lavoro/lotto4/verifica.py`: **2 immagini su 2 valide**. La zona bassa ha circa il 35–36% della luminosità dei render; i dettagli centrali conservano la nitidezza. I due PNG sono stati controllati a vista. Nessun file del repository è stato modificato e nulla è stato pubblicato.
