# Regole permanenti per chi lavora in Effettokarmagra

Questo file si applica all'intera repository, a persone, agenti AI e sessioni ChatGPT/Work. Le regole specifiche in un `AGENTS.md` di sottocartella si aggiungono a queste.

## Obbligo di registro e passaggio di consegne

**Ogni sessione che analizza o modifica un progetto e viene consegnata a un altro operatore deve lasciare un breve log nel repository.** Non serve scrivere un rapporto lungo: è sufficiente un aggiornamento concreto di 5–10 righe, purché chi subentra possa ripartire senza ricostruire il lavoro dalla chat.

1. **Prima di lavorare**, leggere gli `AGENTS.md` applicabili, il README del progetto e le ultime voci del suo `WORK_LOG.md` (o del registro di handoff indicato localmente).
2. **Prima di chiudere la sessione o passare la mano**, aggiungere **in fondo** al `WORK_LOG.md` del progetto una voce con data, autore/strumento quando noto e:
   - **Fatto:** interventi conclusi, distinguendoli da tentativi o idee.
   - **Come e dove:** approccio adottato, file/asset/funzioni interessati e decisioni importanti.
   - **Verifiche e stato:** test, controllo visivo, commit/deploy effettivamente eseguiti o non eseguiti; problemi noti.
   - **Da fare:** prossimo passo concreto, lavoro incompleto e punti di attenzione per chi subentra.
   - **Riferimenti:** branch, commit/PR o link utili se disponibili.
3. Se il progetto non dispone ancora di `WORK_LOG.md`, crearlo nella sua cartella al primo intervento. Per **GTA Melito** il registro obbligatorio è [`games/gta-melito/WORK_LOG.md`](./games/gta-melito/WORK_LOG.md).
4. **Conservare la storia:** aggiungere nuove voci senza cancellare o riscrivere quelle di operatori precedenti. Preferire log salvato nello stesso commit delle modifiche; quando non è possibile, aggiornarlo comunque prima del passaggio di mano.
5. **Niente risultati inventati:** se non è stato effettuato un test o un deploy, scrivere «non eseguito». Se la sessione termina con lavoro parziale o senza modifiche, annotare che cosa è stato esaminato e perché ci si è fermati.
6. Non sostituire il log con un semplice messaggio in chat, una descrizione di commit o una lista di intenzioni. Il repository è la fonte condivisa per gli handoff.

Per GTA Melito valgono anche [le istruzioni locali](./games/gta-melito/AGENTS.md); i lavori grafici devono continuare ad aggiornare anche `VISUAL_PROGRESS.md`. Il `WORK_LOG.md` resta il riepilogo operativo generale per **qualsiasi** tipo di intervento, inclusi gameplay, asset, bug, mappa, performance e documentazione.

## For Four Chocolate — unica reference grafica obbligatoria

Ogni collaboratore deve prima leggere [`games/for-four-chocolate/AGENTS.md`](./games/for-four-chocolate/AGENTS.md). Per il gioco esiste **una sola reference grafica approvata**: [`references/gameplay-mgs-vr-artboard.webp`](./games/for-four-chocolate/references/gameplay-mgs-vr-artboard.webp); vecchi asset, screenshot e bozzetti non possono fungere da alternativa estetica. Prima di sostituire la grafica occorre una PR con screenshot autentici di gioco per verifica visiva.
