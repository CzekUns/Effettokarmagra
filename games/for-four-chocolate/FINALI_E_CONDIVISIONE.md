# For Four Chocolate — finali a Praga e condivisione WhatsApp
**Richiesta utente: 22 ottobre 2026 · Da implementare dal collaboratore.**

## Vincoli comuni
- Due finali **giocati come brevi sequenze animate**, non semplici pannelli di testo o poster: (A) uscita volontaria; (B) cattura da parte di POLICIE dopo un prelievo visto.
- **Ambedue finiscono all'esterno del supermercato a Praga**, con architettura urbana ceca, insegne appropriate e continuità camera/personaggi. Nessuna ambientazione generica senza elementi riconoscibili di Praga.
- Mantenere **l'unica reference artistica approvata** `references/gameplay-mgs-vr-artboard.webp` e le regole `AGENTS.md`; cinematica e animazioni coerenti con il rendering del gioco, non fotomontaggi statici.
- Il gameplay corrente (#106) consente **prelievi illimitati e uscita quando si vuole**. Le battute con «quattro cioccolate / for four chocolate» sono il *titolo/gag fissa* del gioco: **non richiedono che il giocatore ne abbia raccolte esattamente quattro**.
- Includere transizione camera, animazione dei personaggi, avanzamento dialoghi sottotitolati, tasto *Salta* e *Continua/Riprova* con controlli touch landscape e tastiera. Bloccare gli input gameplay durante le cutscene; prevenire scene avviate due volte.
- Non visualizzare direttamente fotografie reali dei ragazzi nel gioco; sono **reference per disegnare sprite/asset illustrati** nello stesso stile degli altri personaggi.

## A — Finale uscita volontaria (esito positivo)
1. Ipno raggiunge e attraversa l'uscita **quando vuole**, con qualsiasi quantitativo di cioccolate (anche 0).
2. Breve transizione attraverso la porta, camera passa all'esterno in **una strada/piazza riconoscibile di Praga**.
3. **Un gruppo di ragazzi lo aspetta e lo accoglie festeggiando** (saluti, braccia alzate, incoraggiamento, piccole animazioni individuali). Riferimento del gruppo: **[references/gruppo-ragazzi-foto.webp](./references/gruppo-ragazzi-foto.webp)** — anteprima **ridotta a 200×128 px**, ritagliata dalla fotografia fornita nella conversazione del 22 ottobre 2026. Ipno con cappello di paglia è al centro, Capellone riccio all'estrema destra. L'**originale a risoluzione maggiore non è stato pubblicato**. Il collaboratore deve partire da questa reference precisa e richiedere l'originale solo se indispensabile per identificare i dettagli, evitando una foto di gruppo differente.
4. **Nella fotografia del gruppo sono già presenti Ipno e Capellone**: NON duplicarli creando una seconda copia di Ipno o di Capellone. Ipno è il giocatore che entra nella scena ed è accolto, e le pose degli altri soggetti della foto vanno adattate per comporre **un solo Ipno e un solo Capellone**. Nella scena positiva Capellone può essere parte del gruppo; niente salame-cintura fuori dal cameo previsto per la cattura, salvo diversa approvazione.
5. Schermata risultato **successo**: numero di cioccolate raccolte, importo in Kč (1 Kč per cioccolata), record locale aggiornato *solo* uscendo volontariamente, pulsanti **«Condividi su WhatsApp»** e **«Rigioca»**.

## B — Finale cattura / game over
1. Quando un agente raggiunge e ferma realmente Ipno dopo averlo sorpreso nel prelievo (o essere stato inviato da una CCTV), avvia la cutscene di arresto. **Non catturare Ipno per il solo fatto di essere visto mentre cammina.**
2. Ipno viene **condotto in un ufficio** della sicurezza/polizia. Inquadratura con Ipno, scrivania, agente POLICIE.
3. **Battuta obbligatoria del poliziotto in ceco**, sottotitolata in italiano, con stacco comico in inglese:
   - Ceco: **«Za čtyři čokolády jste urazil Českou republiku!»**
   - Italiano: «Per quattro cioccolate hai offeso la Repubblica Ceca!»
   - Poi, in inglese: **«For four chocolate!»** (mantenere appositamente questa formulazione come gag, senza correggerla).
   - Audio ceco opzionale se non disponibile una lettura verificata; testo/sottotitoli obbligatori. Evitare voci sintetiche di bassa qualità come requisito bloccante.
4. Ipno viene scortato fuori dall'ufficio, **sale su una scala mobile animata** e arriva alla strada esterna a **Praga**.
5. **Un agente gli consegna la multa**, resa visibile e credibile nella scena. Attualmente regola di gameplay: **50 Kč di penalità**, coerente con il sistema di punteggio implementato.
6. **Cameo visivo di Capellone**, personaggio della reference: passa sullo sfondo all'esterno indossando **una cintura fatta con un salame**, senza enfatizzarlo o fermare la scena. Deve essere percepibile a chi lo nota ma non è il focus. Un solo Capellone.
7. Schermata risultato **cattura** con cioccolate raccolte, multa 50 Kč, saldo effettivo e record precedente **non sovrascritto**, pulsanti **«Condividi su WhatsApp»** e **«Rigioca»**.

## Condivisione WhatsApp — obbligatoria su ENTRAMBI i finali
- Mostrare sempre un **pulsante reale «Condividi su WhatsApp»**, sia dopo l'uscita spontanea sia dopo la cattura. Non soltanto un generico pulsante «Condividi» o una funzione attiva su successo.
- Testi precompilati **diversi e divertenti** in base all'esito, da costruire dinamicamente con i dati reali della partita: `outcome`, `chocolates`, `crowns`, `fine`, `best`, link pubblico al gioco. Nessun dato personale.
- Esempio successo: `🍫 For Four Chocolate! Sono uscito dal supermercato di Praga con 14 cioccolate (14 Kč)! 🥳 Il mio record è 14 Kč. Riesci a fare meglio? [link al gioco]`.
- Esempio cattura: `🚨 For Four Chocolate! Mi hanno beccato a Praga con 7 cioccolate. Multa: 50 Kč; saldo: -43 Kč. 😅 Tu riesci a farla franca? [link al gioco]`.
- Condividere via **URL WhatsApp dedicato** `https://wa.me/?text=${encodeURIComponent(message)}` (oppure schema ufficiale equivalente), chiamato direttamente da un *click/tap* dell'utente; prevedere fallback browser/desktop e gestione popup bloccato. `navigator.share` può essere supportato come opzione aggiuntiva, **non come unico percorso**.
- Il link nel messaggio deve portare alla **versione giocabile pubblica effettiva**, non al repository o agli asset, né a una URL di branch temporaneo.
- Per testare messaggi deterministici, isolare la funzione `buildWhatsAppShareText(result, gameUrl)` dalla UI, con test Node per entrambi i casi (anche 0 cioccolate, score negativo, Unicode/Kč, escaping URL); test manuale browser desktop e viewport mobile in landscape. Non inviare il messaggio automaticamente: l'utente apre WhatsApp e decide se spedirlo.

## Criteri di accettazione — PR dedicata
- [ ] Uscita volontaria → Praga → gruppo che festeggia → risultato → WhatsApp; **nessun doppione di Ipno/Capellone**.
- [ ] Cattura da furto visto → ufficio → battuta in ceco + «For four chocolate!» → scala mobile → Praga → multa → cameo salame-cintura → risultato → WhatsApp.
- [ ] Due messaggi WhatsApp corretti e distinti, link alla demo funzionante, pulsante attivo su entrambi i finali.
- [ ] Record aggiornato solo per uscita, penalità 50 Kč visibile su cattura.
- [ ] Animazioni, dialoghi, gesture/skip e risultato funzionano su desktop e landscape Android. Test reale Android quando disponibile; indicare onestamente se non eseguito.
- [ ] Screenshot **autentici del browser** delle due scene a Praga, ufficio, scala mobile e schermate risultato, senza spacciare artwork compositi per screenshot.
- [ ] `AGENTS.md`, test, `WORK_LOG.md` aggiornati; PR separata da non mergiare autonomamente.

**Nota su privacy della reference di gruppo:** è una fotografia reale di persone, utilizzabile unicamente come reference e non come immagine di gioco. È stata caricata solo una **miniatura 200×128 px** nella repository pubblica come riferimento operativo per il collaboratore, non l'originale integrale. Non pubblicare la fotografia come schermata di gioco né condividerne altre versioni ingrandite senza necessità.
