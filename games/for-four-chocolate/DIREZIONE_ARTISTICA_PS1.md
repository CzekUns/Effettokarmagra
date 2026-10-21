# DIREZIONE ARTISTICA VINCOLANTE — FOR FOUR CHOCOLATE
**Aggiornamento originario: 21 ottobre 2026 · Correzione successiva: 22 ottobre 2026**

> **GERARCHIA GRAFICA — 22 OTTOBRE:** l'unica reference grafica approvata è **[questa tavola](./references/gameplay-mgs-vr-artboard.webp)**, obbligatoria come descritto in **[AGENTS.md](./AGENTS.md)**. Tutti i riferimenti a Metal Gear/VR Missions qui sotto valgono solo per **telecamera, gameplay e proporzioni**, senza sostituire colori vivi, texture dense, personaggi definiti e illuminazione dell'immagine unica. Qualsiasi vecchia copertina, screenshot, tavola di stile, precedente render 3D o pixel art è storico e non approvato come alternativa.

> **Target: Metal Gear Solid per PlayStation 1 (1998), non Commodore 64.**
> La versione con pavimento a scacchiera, sprite 24×40, palette 20 colori, bordi netti e blocchi dall'alto è stata respinta come **troppo rudimentale**. È un prototipo di LOGICA utile per le meccaniche, non il riferimento estetico. Non usare più quei vincoli grafici come specifiche definitive.

## 1. North star visiva

Ricreare il *feeling* della telecamera e dei livelli stealth di **Metal Gear Solid su PS1**, con una resa resa moderna e leggibile su mobile: **supermercato ceco tridimensionale**, personaggi con volume reale, scaffali alti, casse, merci, luci fluorescenti, ombre, strutture con profondità e coni di sorveglianza. L'ambiente deve apparire come **un luogo reale stilizzato**, non una scacchiera con pedine.

Riferimenti concettuali (non copiare asset, personaggi, interfaccia o materiale protetto):
- **Metal Gear Solid (PS1):** inquadratura dall'alto obliqua, ambienti low-poly reali, lettura tattica dei corridoi, pattuglie, controllo della visuale e tensione stealth;
- un **supermercato realmente riconoscibile nella Repubblica Ceca**, corsie di generi alimentari con confezioni e cartelli cechi;
- **solo** l'artboard [gameplay-mgs-vr-artboard.webp](./references/gameplay-mgs-vr-artboard.webp) per **colori, texture, personaggi, luci, densità delle confezioni e ambiente**. Tutte le altre illustrazioni precedenti sono escluse.

## 2. Requisiti di resa

1. **Geometria 3D / vera profondità:** preferibilmente WebGL (es. Three.js o motore equivalente) su GitHub Pages; camera alta inclinata in prospettiva, visibili facciate degli scaffali, superfici superiori e dei fianchi, prospettiva coerente durante il movimento. Ammesso 2.5D soltanto se raggiunge un risultato visivo comparabile, non finto pseudo-3D ottenuto stirando le vecchie piastrelle.
2. **Scenografia:** scaffali con prodotti distinguibili (cioccolata, snack, bibite, confezioni), casse, cartellonistica, carrelli, vetrine, porte, illuminazione, eventuale scala mobile nel futuro epilogo. Poche geometrie copiate all'infinito; variazione credibile per reparto.
3. **Materiali e luci:** texture leggere ma leggibili, palette naturalistica da interno, contrasto controllato, ombre di contatto, luce artificiale diffusa (fluorescente) e accenti di sicurezza. Il look può richiamare il low-poly PS1 senza replicarne difetti estremi.
4. **Personaggi:** Ipno riconoscibile (cappello di paglia, occhiali, fisionomia ispirata alle due foto, vestiti coerenti), poliziotti cechi con divisa blu scura POLICIE, clienti proporzionati con volume corporeo. Il vecchio foglio 24×40 non è approvato come grafica finale.
5. **Stealth leggibile:** coni di visione a pavimento in trasparenza, telecamera animata con fascio che ruota, pattuglie riconoscibili, ripari che interrompono davvero la visuale; allarme con feedback visivo coerente. Eventuale minimappa/radar discreta.
6. **Camera e occlusione:** vista alta inclinata fissa o con follow morbido; pareti e scaffali vicini possono diventare semitrasparenti o usare inquadrature scelte in modo da non nascondere Ipno. Non sacrificare la leggibilità delle traiettorie o della raccolta.
7. **Responsive:** browser su PC e smartphone, touch semplici, frame rate accettabile su dispositivi medi e fallback di qualità (ridurre ombre/dettagli senza cambiare lo stile). Niente backend obbligatorio.
8. **Tono:** furtivo ma comico. I dialoghi, multa, scala mobile e cameo di Totore con il salame appartengono alle fasi narrative successive.

## 3. Anti-pattern / rifiutati
- Spritesheet 24×40 ingranditi di molti fattori come rappresentazione finale dei personaggi;
- pavimento a quadrettoni blu/grigi e oggetti rappresentati come rettangoli piatti;
- massimale rigido di 20–24 colori, bordi pixel spessi, font tutto a pixel 5×7;
- salvataggio del look precedente con sole ombre CSS, filtri, sfocature o overlay;
- vista completamente ortogonale che annulli l'altezza degli scaffali;
- produzione di tanti nuovi asset prima di una singola **schermata rappresentativa giocabile** esaminata dall'utente.

## 4. Cosa riutilizzare
**Conservare** `logic.mjs` e i test di stealth come base logica di collisioni, linee di vista, raccolta e pattuglie. **Sostituire** l'attuale renderer `game.mjs`, le rappresentazioni a tiles 2D e le regole estetiche del documento `STILE_PERSONAGGI.md`; i vecchi PNG restano storici / fallback tecnico, non il modello per le nuove illustrazioni. Verificare la separazione logica/rendering e adattare gli input a movimento fluido e diagonale, se necessario, mantenendo test.

## 5. Metodo di realizzazione (ordine obbligatorio)
**Fase A — campione grafico:** creare una singola *scena rappresentativa* con camera dall'alto obliqua, **Ipno + un agente + telecamera + due corsie complete**, materiali, luci e un cono visivo. Mettere a confronto uno screenshot reale in browser e la presente direzione artistica. Chiedere approvazione dell'estetica prima di scalare.

**Fase B — vertical slice completo:** dopo l'approvazione, integrare 4 cioccolate, tutte le corsie, due pattuglie, UI e uscita mantenendo i test.

**Fase C — narrativa e record:** solo dopo, WhatsApp, record, arresto, interrogatorio ceco, scala mobile, multa e Totore Capellone.

## 6. Criteri di accettazione per il campione
- Screenshot reale del browser: scena chiaramente **3D o 2.5D avanzato**, scaffali leggibili in altezza, prospettiva e ombreggiatura; no tavolato C64.
- Ipno, agente e telecamera chiaramente diversi per forma e comportamento; Ipno visivamente identificabile.
- Si può camminare dietro gli scaffali, essere schermati dalla vista e attraversare il campo visivo dell'agente.
- Nessun errore JavaScript bloccante, scena visibile su PC e Android; prestazioni dignitose.
- Non dichiarare la grafica definitiva né fare merge di una nuova estetica senza un confronto visivo rappresentativo.

**Priorità delle istruzioni:** questa direzione artistica *sostituisce* le prescrizioni pixel-art in `OBIETTIVO-FOR-FOUR-CHOCOLATE.md` e `STILE_PERSONAGGI.md`. Le meccaniche e la trama precedenti restano valide.
