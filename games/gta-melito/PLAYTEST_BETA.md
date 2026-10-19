# GTA Melito — collaudo giocabilità (versione Beta PR #29)

La **Stabile** è congelata al commit `affeffb1`; la **Beta** viene generata dal branch della PR #29. La pubblicazione GitHub Pages richiede il workflow `publish-arcade-gta-variants.yml` e la configurazione Pages su **GitHub Actions**. Prima di ogni confronto annotare data, browser, dispositivo e versione Beta.

## Come segnalare
Per ogni prova: **OK / DIFETTO / NON PROVATO**; indicare passaggi esatti, comportamento atteso, comportamento osservato, ora di gioco, screenshot/video se possibile. Non usare la checkbox Q del TODO come certificazione di prova personale.

## Giro iniziale: 10 minuti
1. **Avvio:** apri entrambe le schede dalla homepage; mappa Melito caricata, nessun errore, partenza in Via Roma.
2. **Movimento a piedi:** joystick, corsa, marciapiedi, tetti trasparenti, passaggio dietro edifici e assenza di blocchi.
3. **Guida:** entra/esci da auto e moto; volante touch, accelera, frena, retromarcia; traffico e collisioni non letali.
4. **Banca e missioni:** entra/esci, HUD, timer, minimappa, dialoghi, missioni e salvataggi. Verifica che l'orologio NPC si fermi in banca/pausa senza rompere i timer missione.
5. **Fluidità Android:** 5 minuti in landscape con traffico e NPC; registra rallentamenti, freeze e surriscaldamento.

## Novità Beta da verificare in ordine (Q02–Q12, dichiarate nel branch)
- **Q02 — Orologio e agenda:** fasce mattina/pranzo/pomeriggio/sera/notte; NPC partono in momenti diversi; pausa e banca congelano il tempo NPC.
- **Q03 — Porte:** persone escono da porte plausibili, entrano e ricompaiono dalla stessa; non attraversano muri, non restano invisibili/collidibili dopo l'uscita.
- **Q04 — Giorno/notte:** confronta `?ora=12:00`, `?ora=19:30`, `?ora=21:30`; lampioni, finestre e fari; leggibilità e FPS.
- **Q05 — Mete/negozi:** verifica arrivo davanti a negozi e interazioni senza sovrapposizioni con ingressi o traffico.
- **Q06 — Oggetti urbani:** controlla panchine/arredi e che non blocchino strade, marciapiedi e passaggi.
- **Q07 — Suoni ambientali:** ascolta eventi audio e controlla volume, ripetizioni e assenza di audio bloccato.
- **Q08 — Meteo:** verifica transizioni visive e leggibilità della guida e della mappa.
- **Q09 — Eventi cittadini:** controlla che eventi siano rari, credibili e non impediscano missioni o transito.
- **Q10 — Guida/handling:** confronta con stabile volante, accelerazione, freno, retro e comportamento moto.
- **Q11 — Socialità NPC:** cerca incontri, brevi conversazioni, separazione, interruzione al passaggio di veicoli.
- **Q12 — Spostamenti NPC:** osserva sequenza pedone/mezzo, parcheggio, discesa e ritorno senza duplicati o teletrasporti.

## Priorità e rilascio
**Bloccante:** gioco non parte, crash, controlli inutilizzabili, salvataggi compromessi, missione impossibile, NPC/veicoli bloccati diffusamente. **Alta:** passaggi attraverso muri, duplicazioni, collisioni mancanti, forti cali FPS. **Media:** piccoli errori visivi/audio. In caso di regressione grave usa la Stabile e segnala; il rollback di `main` è separato perché la Beta è pubblicata in una sottocartella.

**Verifiche di questa pubblicazione:** aggiornamenti al catalogo e workflow confermati da commit GitHub; esecuzione effettiva del deploy e prove Node/browser/Android **non ancora confermate**.
