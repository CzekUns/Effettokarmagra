# GTA Melito — STANDARD APPROVATO DI DESIGN DEI VEICOLI

**Approvato dall'utente il 17 ottobre 2026.** Questo documento è la procedura predefinita per ogni nuova automobile del gioco. Non reinventare il processo a ogni richiesta.

## Stile approvato

Riferimenti visivi iniziali già approvati: **Panda moderna bianca** e **Panda Fire anni '90 rossa**, presenti nel gioco. L'utente ha confermato che risultano bene su strada; fare le auto successive con **la medesima tecnica**, mantenendo coerenza di scala e livello di dettaglio.

1. **Modello automobilistico vero come riferimento:** silhouette e proporzioni riconoscibili per la generazione/anno preciso, senza allungare artificialmente cofano o coda. Non confondere modelli e generazioni (es. Punto 188 ≠ Grande Punto, Ypsilon 2003 ≠ 2011).
2. **Una sola vista esattamente dall'alto (top-down)**: il cofano punta verso l'alto del file (−Y), non isometrica, non laterale, non prospettiva 3/4. Dall'alto devono leggersi tetto, parabrezza, lunotto, specchi, finestrini, fari e fanali.
3. **Sheet per modello con varianti colore**: esattamente stessa sagoma, inquadratura, dimensioni e orientamento in ogni casella; sfondo **bianco neutro** solo sullo sheet di presentazione. Non inserire titoli, loghi, scritte, ombre pesanti o altri elementi dentro il ritaglio di un'auto.
4. **Colori di carrozzeria realmente disponibili** per quella generazione e mercato/anno/allestimento, non un arcobaleno arbitrario. Verificare con brochure/listini/schede ufficiali attendibili ove disponibili. Se un colore non è verificato, etichettarlo come interpretazione e NON come originale di fabbrica. Colori e disponibilità variano per anno/versione. Presentare nomi dei colori e riferimenti quando identificabili.
5. **Ritaglio individuale di ciascuna auto** dal sheet: nessun testo, nessun fondale chiaro sotto il veicolo, **PNG RGBA realmente trasparente**, non un PNG con rettangolo bianco o sfondo beige. Allineare pivot e centro, mantenere una bounding box coerente tra varianti.
6. **Ottimizzare per gioco mobile**: esportazione compatta e compressa, spesso ~88×132 px (come i due asset approvati) se appropriato, dimensioni visive in world units coerenti con la carrozzeria reale e le strade; evitare auto troppo lunghe; mantenere qualità pixel senza sfocare. L'approccio iniziale usa `assets/vehicles/*.png`, `car-sprites.mjs` e `drawCarSprite`.
7. **Usare davvero il PNG in-game**, nella macchina iniziale o tra i veicoli selezionati del traffico; il disegno procedurale vecchio è fallback durante il caricamento. Non limitarsi alla consegna di un'immagine: serve integrare, verificare e distribuire sul sito.
8. **Non alterare fisica o collisioni di nascosto**: ridimensionamento del PNG visivo, centro di rotazione e `angle+Math.PI/2` del file top-facing devono essere calibrati. Mantenere FPS, gameplay, comandi e collisioni; non disegnare un veicolo che visivamente occupa il doppio della sua hitbox.
9. **Verifica reale**: osservare screenshot alla stessa posizione in game (zoom a piedi e in auto), controllare verso anteriore, angoli di rotazione, proporzioni, ritagli/alone chiaro e leggibilità su smartphone; test automatici oltre a verifica browser. Tutti i nuovi asset devono essere segnalati in `VISUAL_PROGRESS.md`.

## Basi già presenti — NON da rifare

- `assets/vehicles/panda-modern-white.png`: Panda moderna, bianco, sprite approvato.
- `assets/vehicles/panda-fire-red.png`: Panda Fire prima serie, rosso, sprite approvato.
- `car-sprites.mjs`: precaricamento, fallback al renderer Canvas, asse frontale e scala.
- Le altre varianti PNG Panda sono state preparate nella conversazione originaria; NON affermare che siano nel repository prima di caricarle.

## Ordine di espansione consigliato

### Lotto 1 — utilitarie italiane che danno subito identità alla città
- **Fiat Punto 188** (1999–2010; decidere versione 3 o 5 porte).
- **Fiat Grande Punto / Punto Evo** (2005–2018; forme differenti, distinguere).
- **Lancia Ypsilon seconda serie** (2003–2011).
- **Fiat Seicento** (1998–2010) o, in alternativa, **Fiat Uno** per il parco più vecchio.

### Lotto 2 — auto italiane cittadine e contemporanee
- **Fiat 500** (2007–2024, distinguere dalla 500e se serve).
- **Lancia Ypsilon terza serie** (2011–2024).
- **Fiat Tipo hatchback** (2016–2025; verifica l'anno di riferimento).
- **Fiat 500L** (2012–2022).

### Lotto 3 — varietà internazionale plausibile
- **Renault Clio**, **Opel Corsa**, **Ford Fiesta**, **Volkswagen Golf**, **Peugeot 208**; scegli la generazione specifica prima di disegnare.
- **Nissan Qashqai**, **Jeep Renegade**, **Dacia Duster** per crossover/SUV.
- **Fiat Doblò**, **Fiat Fiorino/Qubo**, **Fiat Ducato** per consegne e lavoro.
- Eventuali scooter/moto in seguito (asset e collisioni dedicate).

Le liste rappresentano **ipotesi di varietà stradale plausibile**, non statistiche sulla reale diffusione a Melito. I colori e l'anno vanno verificati modello per modello.

## Criterio di accettazione

Per ogni modello consegna: sheet bianco con sole viste top-down e colori, PNG singoli trasparenti/centrati, scheda modello-generazione-anni-colori con fonti, anteprima in-game, integrazione e test. **Prima qualità e coerenza, poi quantità.**
