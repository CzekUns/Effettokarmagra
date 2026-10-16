# GTA Melito — censimento individuale degli edifici

## Punto di partenza e ordine

Si parte **dal margine nord-occidentale del comune**, allineando una griglia metrica di **350 m × 500 m** all'origine nord-occidentale della proiezione ISTAT/OSM. La prima particella edificata del percorso è **way OSM 733646047**, nelle vicinanze di Via Colonne di Giugliano; si prosegue verso est attraverso i fabbricati fra Via Appia, Via Etna e Via Vesuvio.

Il percorso è un **serpentino senza salti**: nella prima fascia nord si procede da ovest verso est, nella seconda da est verso ovest, e così via fino al confine sud. Le celle prive di fabbricati sono saltate, ma **nessuno dei 2.056 edifici della mappa viene escluso**.

## Stato reale del lavoro al 16 ottobre 2026

- **2.056 / 2.056**: impronte planimetriche OSM già acquisite, indicizzate per edificio.
- **47 / 2.056**: edifici dei settori **S001–S002** già dotati di scheda individuale, area e asse geometrico calcolati dal loro poligono OSM; palette grafica provvisoria.
- **0 / 2.056**: facciate **fotograficamente identificate** con corrispondenza certa immagine ↔ edificio. Le bozze di colore o forma del tetto NON sono prove fotografiche.
- **Prossimo settore**: **S003** (fascia nord, x 700–1.050 m, y 0–500 m nella proiezione di gioco), **19 edifici**, partendo dal primo a nord.
- **34 settori edificati** sull'intera mappa comunale; vedi lista in `building-register.json`.

Non attribuire mai una foto di un immobile generico di Via Etna/Via Appia a un way OSM specifico soltanto perché si trova nella stessa zona. Senza vista leggibile di civico e impronta, rimane **riferimento di quartiere**.

## Fonti

1. **OpenStreetMap**, ID univoci dei singoli edifici, superfici e alcuni tag residenziale/industriale. Le superfici e le direzioni degli edifici derivano esclusivamente dalla geometria OSM, non dalle foto. ODbL, © OpenStreetMap contributors.
2. **Google Maps e Street View**: il visualizzatore `survey/index.html` contiene il link alla posizione esatta di ogni building ID con il formato ufficiale di Maps URLs (https://developers.google.com/maps/documentation/urls/get-started?hl=it). La panoramica più vicina può mostrare una facciata diversa o essere assente; va controllata visivamente prima di creare una scheda verificata.
3. **Riferimenti fotografici di zona**, NON associati a un way OSM:
   - Via Etna, coordinate generali e Google Maps: https://www.blia.it/in/59288-82232
   - Foto e annunci di zona Via Etna: https://www.idealista.it/geo/vendita-case/via-etna-melito-di-napoli-napoli/
   - Tipologia di capannoni Via Appia (localizzazione esatta non pubblicata): https://www.idealista.it/immobile/21428821/

Le immagini Google Maps e di portali immobiliari **non sono scaricate, copiate o integrate nel gioco**. I link servono solo alla verifica. Colori di facciata e tetti nei primi settori sono **palette provvisorie in stile pixel art**, NON copie degli edifici fotografati.

## File

- `building-register.json`: registro individuale, per ciascun ID OSM: settore, coordinate metriche WGS84, tag OSM, strada OSM nominata più vicina (non è un indirizzo verificato), e stato.
- `sector-001-002.json`: 47 profili grafici provvisori per altrettanti singoli edifici, con OSM ID, area, asse geometrico, colori e assenza esplicita di validazione foto.
- `visual-profiles.mjs`: applica i profili specifici per ID al renderer, senza cambiare la geometria.
- `index.html` e `viewer.mjs`: archivio consultabile; aprono Google Maps, Street View e OSM per ogni ID.
- `survey.test.mjs`: controlli di copertura, OSM ID, contiguità e integrazione visuale.

Per proseguire su un settore bisogna confrontare **una facciata per volta**, conservare nel profilo i riferimenti verificabili (foto, panoramica, data), aggiornare `photoVerified` **solo dopo osservazione effettiva**, quindi applicare colori, materiali, piani e balconi documentati. La disponibilità di foto non garantisce una corrispondenza, che resta da verificare.

**Ordine dei prossimi interventi**: S003 → S004 → … → S034. Nessuna missione del gioco necessita di modifica per aggiornare gli edifici.
