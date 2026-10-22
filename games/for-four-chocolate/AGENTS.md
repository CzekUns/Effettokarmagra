# AGENTS — For Four Chocolate (istruzioni obbligatorie)

**Valido per ogni collaboratore umano o agente AI che modifica file sotto `games/for-four-chocolate/`.**
Queste istruzioni integrano `/AGENTS.md`. Ultima decisione dell'utente: **22 ottobre 2026**.

## Reference grafica UNICA approvata

![Unica reference grafica da riprodurre](./references/gameplay-mgs-vr-artboard.webp)

**[APRIRE LA REFERENCE APPROVATA](./references/gameplay-mgs-vr-artboard.webp)**

> **Regola inderogabile:** per TUTTI i nuovi asset grafici e per il rendering di *For Four Chocolate* si deve usare **solo questa immagine come fonte visiva dello stile finale**. Non reinterpretare il design scegliendo un'altra estetica, non continuare i manichini low-poly attuali e non usare le vecchie immagini generate, i PNG degli sprite 24×40 o gli screenshot del prototipo come riferimenti stilistici alternativi.

- La reference approvata ha **camera dall'alto obliqua con proporzioni di gioco vicine a Metal Gear Solid: VR Missions per PS1**, ma **texture, colori e illuminazione molto più vivi, saturi e ricchi**. Il richiamo a MGS è una guida per *giocabilità e punto di vista*, **non autorizza a cambiare lo stile grafico dell'immagine approvata**.
- Ipno deve assomigliare al personaggio della tavola: figura **umana dettagliata e riconoscibile**, proporzioni credibili rispetto agli scaffali; cappello di paglia e camicia nera/rossa fantasia, non testa sferica e busto a cubi. Agenti **POLICIE** analogamente definiti e correttamente proporzionati.
- Scaffali tridimensionali **fitti di prodotti e confezioni**, frigoriferi luminosi, insegne coerenti, pavimento riflettente ma leggibile, contrasti caldi/freddi, ombre e zone di sorveglianza. Non basta inserire qualche colore in più o arrotondare box/cilindri.
- La tavola comprende pannelli esplicativi con parole italiane: sono **didascalie** e non fanno parte della UI finale. Dentro il supermercato devono prevalere **cartelli in ceco**. Non copiare il collage come fondale.
- Le foto `references/ipno-foto-1.webp`, `ipno-foto-2.webp` e `totore-capellone.webp` restano fonti **per le identità dei personaggi**, **non** sono ulteriori art-style reference.
- `assets/ps1-sample-*.png`, `assets/sheet.png`, `STILE_PERSONAGGI.md` e le copertine precedenti restano soltanto **documentazione storica della versione respinta**; non vanno usati per decidere il look futuro.

## Fase gameplay semidefinitivo (22 ottobre 2026) — incarichi attivi
La scena campione è stata pubblicata tramite PR #98 e le quattro cioccolate iniziali tramite PR #99; **l'utente ha autorizzato a espandere il gameplay**. Leggere il nuovo [PIANO_GAMEPLAY_SEMIDEFINITIVO.md](./PIANO_GAMEPLAY_SEMIDEFINITIVO.md), che supera le sole limitazioni di perimetro del primo campione. Il collaboratore `ilconsulentelogistico-hue` è incaricato degli issue [#100 (sprite)](https://github.com/CzekUns/Effettokarmagra/issues/100), [#101 (supermercato e spawn)](https://github.com/CzekUns/Effettokarmagra/issues/101) e [#102 (reazione sorveglianza)](https://github.com/CzekUns/Effettokarmagra/issues/102). Aprire PR separate, **nessun merge automatico**. Rimane assoluto il vincolo grafico della reference sopra.

## Finali a Praga e condivisione WhatsApp (richiesta 22 ottobre 2026)
Il prossimo incarico narrativo del collaboratore è [issue #107](https://github.com/CzekUns/Effettokarmagra/issues/107), descritto in [FINALI_E_CONDIVISIONE.md](./FINALI_E_CONDIVISIONE.md): due scene animate di uscita a Praga, cattura con ufficio/battuta ceca/scala mobile/multa/cameo Capellone con cintura di salame, e **condivisione del risultato tramite un pulsante WhatsApp in entrambi i finali**, indipendentemente dal punteggio. La foto del gruppo dei ragazzi è ora disponibile **solo come miniatura ridotta** in [references/gruppo-ragazzi-foto.webp](./references/gruppo-ragazzi-foto.webp); l'originale resta fuori dalla repo. Usare questa precisa foto per il cast e non creare doppioni di Ipno o Capellone. La reference di stile approvata resta l'unica per il disegno.

## Obblighi per ogni PR che riguarda grafica, personaggi, inquadratura o asset

1. **Aprire e osservare la reference sopra PRIMA di creare asset o modificare il renderer.** Descrivere in PR che cosa si è riprodotto della tavola, cosa differisce e perché.
2. **Non sostituire il gioco attuale in produzione con un mockup.** Una schermata fissa, lo stesso artwork ritagliato sul fondale o texture falsamente “3D” non sono una realizzazione interattiva. Il gioco deve poter muovere Ipno, avere collisioni, telecamere/guardie e oggetti prelevabili dagli scaffali.
3. **Primo obiettivo: una scena realmente giocabile e rifinita**, preferibilmente reparto frigoriferi e scaffale cioccolata, con Ipno animato a scala umana, un agente, una CCTV e un prelievo da scaffale. Usare e migliorare `sample-ps1.html` su un percorso di prova senza compromettere `index.html`.
4. Allegare **screenshot reali del gioco renderizzato** in landscape desktop e Android (o viewport mobile documentata), **a fianco della stessa reference**; includere breve valutazione di somiglianza su *proporzioni, qualità dei personaggi, dettaglio scaffali, vivacità colori, luci e camera*.
5. **Non considerare completato il lavoro** se l'esito somiglia ancora a pupazzi assemblati con primitive geometriche o al vecchio prototipo desaturato. Correggere o descrivere il blocco, non chiamarlo “stile approvato”.
6. Fare test collisione/visuale/prelievo, verifica touch **landscape** e controllo di console/performance; riportare nel `WORK_LOG.md` ciò che è stato effettivamente verificato.
7. **Aprire una PR separata per la nuova grafica** e richiedere un'approvazione visiva esplicita dell'utente prima di un merge che sostituisca la direzione artistica corrente.

## Gameplay da non perdere

Il personaggio **può essere visto mentre si muove** senza essere arrestato per la sola presenza; **non deve essere visto durante il prelievo**. Le cioccolate sono **sugli scaffali**, mai sul pavimento: servono avvicinamento, comando `PRENDI`, animazione e verifica di non visibilità per tutta l'azione. Le zone hanno rischio differenziato e alcune diventano più sorvegliate dopo il prelievo. Su telefono **schermo orizzontale obbligatorio**, controlli touch sovrapposti e HUD discreta. Consultare [REFERENCE_GAMEPLAY.md](./REFERENCE_GAMEPLAY.md) per i dettagli.

**Precedenza grafica:** questo file + l'immagine indicata prevalgono sulle istruzioni stilistiche eventualmente discordanti in `DIREZIONE_ARTISTICA_PS1.md`, `STILE_PERSONAGGI.md`, `OBIETTIVO-FOR-FOUR-CHOCOLATE.md`, issue o PR precedenti. Non cambia il gioco senza revisione: cambia la regola di produzione dei nuovi asset.
