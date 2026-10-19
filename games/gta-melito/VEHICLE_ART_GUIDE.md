# GTA Melito — STANDARD APPROVATO DI DESIGN DEI VEICOLI

**Approvato dall'utente il 17 ottobre 2026.** Questo documento è la procedura predefinita per ogni nuova automobile del gioco. Non reinventare il processo a ogni richiesta.

## Regola fissa per gli spritesheet (19 ottobre 2026)

**Formato normale: foglio da 16 sprite in griglia 4×4, 8 varianti del primo modello (righe 1–2) e 8 del secondo (righe 3–4).** È lo standard produttivo permanente per i nuovi lotti; le vecchie Panda PNG individuali restano eccezioni. Le otto varianti possono rappresentare colori, generazioni del modello specificate, usura o tipo di carico/allestimento commerciale. Dopo ImageGen si fanno veri crop, allineamento e atlas PNG trasparente a 16 celle, con controllo alpha dei bordi.

**Esempio già pronto:** [Ape Car + street food 16 celle](./assets/vehicles/ape-food-16-rgba.png), [master 1244×1265 px](./assets/vehicles/sources/ape-food-16-master.png). Questa tavola ha **celle 56×64 px, 4×4 = 224×256 px**, con otto Ape (azzurra pulita e verde bottiglia arrugginita, ciascuna vuota / con ferro / ortofrutta / pesce) e otto banchi street food (zeppole/panzerotti, pere/musso, panini, hot dog, cornetti, pizza a portafoglio, pizzette fritte, assortito). I furgoni con tendalino aperto sono sprite da **sosta**; servono versioni con sportelli chiusi per usarli in movimento. L'interpretazione grafica pere/musso è ancora provvisoria.

## Stile approvato

Riferimenti visivi iniziali già approvati: **Panda moderna bianca** e **Panda Fire anni '90 rossa**, presenti nel gioco. L'utente ha confermato che risultano bene su strada; fare le auto successive con **la medesima tecnica**, mantenendo coerenza di scala e livello di dettaglio.

1. **Modello automobilistico vero come riferimento:** silhouette e proporzioni riconoscibili per la generazione/anno preciso, senza allungare artificialmente cofano o coda. Non confondere modelli e generazioni (es. Punto 188 ≠ Grande Punto, Ypsilon 2003 ≠ 2011).
2. **Una sola vista esattamente dall'alto (top-down)**: il cofano punta verso l'alto del file (−Y), non isometrica, non laterale, non prospettiva 3/4. Dall'alto devono leggersi tetto, parabrezza, lunotto, specchi, finestrini, fari e fanali.
3. **Sheet 4×4 con due modelli (8 varianti ciascuno)**: esattamente stessa sagoma, inquadratura, dimensioni e orientamento nelle otto celle di ciascun modello; sfondo **bianco neutro** solo sullo sheet di presentazione. Non inserire titoli, loghi, scritte, ombre pesanti o altri elementi dentro il ritaglio di un'auto.
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

## Bug da non ripetere — trasparenza dell'atlante

Il primo atlante Punto/Ypsilon caricato aveva un rettangolo scuro opaco sullo sfondo. **La sola presenza di un chunk PNG `tRNS` non prova la trasparenza corretta**: bisogna verificare realmente che ciascuno dei 16 angoli di ogni cella dell'atlante abbia **alpha=0** e che un pixel al centro dell'auto abbia alpha>0. Provare il rendering su asfalto e su fondo chiaro. **Risolto il 17 ottobre 2026:** il nuovo atlante `punto-ypsilon-16colors-rgba.png` ha 16 sprite compatti da 40×60 pixel su 4×4 celle, trasparenza reale con `tRNS` (alpha 0 negli angoli di ogni cella) e colori distinti per modello. Il caricamento usa direttamente il PNG, senza alcuna maschera di riparazione in JavaScript. Il vecchio atlante resta solo come archivio per evitare regressioni; `vehicle-alpha.mjs` è rimosso. Le 16 verniciature sono variazioni grafiche indicative, non documentate come codici di fabbrica.


## Nuovi modelli — 18 ottobre 2026

- `seicento-500-16colors-rgba.png`: Fiat Seicento 1998 e Fiat 500 2007, otto colori ciascuna.
- `uno-smart-16colors-rgba.png`: Fiat Uno 1983 e Smart Fortwo 2007, otto colori ciascuna.

Sprite individuali di 40×60 pixel ritagliati da due tavole 4×4: in gioco vengono conservati come due atlanti compressi 160×240, con sfondo **realmente trasparente** e alfa corretto, per ridurre richieste HTTP. 32 nuove varianti sommate alle 16 Punto/Ypsilon già integrate (48 totali più le due Panda). Colori come interpretazione, non tutti verificati nei cataloghi fabbrica. Dimensioni visive per modello differenziate senza cambiare le collisioni. La Smart è una rappresentazione approssimativa, candidata a una successiva rifinitura sulla Fortwo reale.
