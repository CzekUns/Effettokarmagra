# GTA Melito — registro operativo e passaggi di mano

Questo registro è **obbligatorio** per chiunque intervenga in `games/gta-melito/`: sviluppatori, agenti AI, ChatGPT e Work. Va letto prima di riprendere il progetto e aggiornato **al termine di ogni sessione**, anche se la lavorazione è parziale. Conservare tutte le voci in ordine cronologico, aggiungendo le nuove **in fondo**.

Usare voci **brevi (indicativamente 5–10 righe)**, ma abbastanza precise da permettere a un altro operatore di continuare senza dover leggere le conversazioni precedenti. Il formato consigliato è:

```md
### AAAA-MM-GG — Operatore/strumento — Attività
- **Fatto:** cosa è stato effettivamente aggiunto, corretto o analizzato.
- **Come/dove:** metodo, scelte tecniche e percorsi dei file coinvolti.
- **Verifiche/stato:** test, screenshot, deploy eseguiti e relativo esito; oppure «non eseguiti».
- **Da fare:** prossime azioni, limiti, bug aperti e rischi di regressione.
- **Riferimenti:** commit/PR/branch/link utili, se disponibili.
```

**Regole pratiche:**
- Una voce per sessione/passaggio di mano, non una per ogni singola modifica o messaggio.
- Scrivere quello che si è davvero fatto, non dichiarare realizzate intenzioni o prove non verificate.
- Aggiornare il registro nello stesso commit del lavoro quando possibile; in caso di commit multipli, riassumere il risultato finale e indicare il riferimento.
- Non cancellare voci precedenti; annotare eventuali correzioni in una nuova voce.
- `VISUAL_PROGRESS.md` mantiene i dettagli delle modifiche grafiche; questo `WORK_LOG.md` raccoglie il **passaggio operativo per tutte le attività** (grafica, gameplay, AI, mappe, fisica, bug, prestazioni, documentazione).
- Leggere anche [`AGENTS.md`](./AGENTS.md), [`HANDOFF_WORK_REALISMO.md`](./HANDOFF_WORK_REALISMO.md) e le ultime voci di [`VISUAL_PROGRESS.md`](./VISUAL_PROGRESS.md) quando pertinenti.

---

### 2026-10-18 — ChatGPT/GitHub — Regola di handoff permanente
- **Fatto:** introdotto un obbligo di log per ogni sessione e un registro operativo separato da quello grafico.
- **Come/dove:** nuove istruzioni generali in `/AGENTS.md`; questo registro in `games/gta-melito/WORK_LOG.md`. Aggiornati anche `games/gta-melito/AGENTS.md` e `games/gta-melito/README.md`, che puntano al registro.
- **Verifiche/stato:** sola documentazione; test di gioco e screenshot non eseguiti; nessuna logica o asset modificato.
- **Da fare:** per il prossimo intervento leggere le istruzioni e gli ultimi aggiornamenti, lavorare sul compito richiesto, quindi aggiungere qui il riepilogo di consegna con i file e i test realmente toccati.
- **Riferimenti:** branch `main`, repository `CzekUns/Effettokarmagra`; commit generali `ba8660f`, creazione registro `5359afd`, istruzioni locali `b745fce`, README `082dec6`.
