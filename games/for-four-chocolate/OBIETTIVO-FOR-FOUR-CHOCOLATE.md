# OBIETTIVO — FOR FOUR CHOCOLATE
**Progetto:** Uns Arcade / Arcade Club · **Stato:** concept approvato, solo anteprima pubblicata · **Data:** 21 ottobre 2026

## 1. Visione
Arcade stealth umoristico **For Four Chocolate**, con protagonista **Domenico “Ipno”**. Ambientazione: **supermercato della Repubblica Ceca**, organizzato come un labirinto di corsie, scaffali, casse, varchi, scale mobili e stanza di sicurezza. Visuale **dall'alto o tre-quarti elevato**, leggibile come le sezioni stealth del classico Metal Gear: movimento furtivo, pattuglie, angoli ciechi, ripari e campi visivi espliciti. Stile grafico curato, coerente, art direction pixel art ad alta leggibilità; niente placeholder procedurali grossolani quando ci sono asset dedicati.

## 2. Personaggi e reference visive
- **Domenico Ipno**, personaggio giocabile. Due fotografie fornite dall'utente: una foto di gruppo con **cappello di paglia** e posa accucciata, e una seconda all'aperto con **cappello di paglia, occhiali, camicia fantasia, accovacciato sulla sfera**. Preservare aspetto e riconoscibilità nel ritratto/sprite, adattandolo alla prospettiva del gioco.
- **Totore Capellone**, cameo: terza foto, il giovane con **capelli ricci** e t-shirt scura, in primo piano. Nell'epilogo esce dal supermercato con **un salame al posto della cintura**. Non confondere le foto: le prime due = Ipno, la terza = Totore.
- **Poliziotti cechi:** divise scure con scritta **POLICIE**; distinguere agenti dalle telecamere. Usare riferimenti reali per colori e disposizione delle divise senza riprodurre marchi se non necessari.
- **Supermercato ceco:** corridoi e merce credibili; insegne, etichette e segnaletica in ceco: “Čokoláda”, “Pokladna”, “Východ”, “Akce”. Reference architettonica generica delle catene ceche (es. Lidl, Albert, Billa), senza pretendere di ricreare un negozio reale.
- **Reference fotografiche:** tre immagini allegate dall'utente nella conversazione del **21 ottobre 2026**. Destinazione in repository: `games/for-four-chocolate/references/` con nomi `ipno-foto-1.webp`, `ipno-foto-2.webp`, `totore-capellone.webp`. Le foto sono reference, **non** sprite giocabili. Non sostituirle con illustrazioni; non pubblicarle nella pagina di anteprima senza ulteriori decisioni.

## 3. Loop di gioco futuro
1. Ipno entra nel supermercato e si muove per la mappa tra gli scaffali.
2. Il giocatore raccoglie **cioccolato e altri oggetti dagli scaffali**; si tiene conto del bottino e del punteggio.
3. Agenti **POLICIE** pattugliano con routine autonome, waypoint e cono visivo. Telecamere fisse o oscillanti con proprio campo visivo. Scaffali e muri **bloccano la linea di vista** in modo consistente. Segnalare scoperta e inseguimento.
4. Il giocatore cerca di raggiungere l'uscita senza essere individuato; quando esce salvo, il gioco calcola e mostra un **record** e può **condividerlo su WhatsApp** con testo + link al gioco (Web Share API se disponibile, fallback a URL WhatsApp codificato).
5. Se viene scoperto, Ipno è **catturato e accompagnato in una stanza**. Un poliziotto dice in **ceco**, con eventuali sottotitoli italiani: **«Za čtyři čokolády jste urazil Českou republiku!»** (= «Per quattro cioccolate hai offeso la Repubblica Ceca!»), seguito dalla battuta volutamente inglese **«For four chocolate?»**. La formulazione ceca potrà essere rifinita prima dell'implementazione audio.
6. Epilogo comico del fallimento: Ipno **sale la scala mobile ammanettato**, esce e riceve **la multa**; in contemporanea compare il cameo di **Totore Capellone** che esce dal supermercato con un salame usato da cintura.

## 4. Specifiche future (non ancora implementate)
- **Visuale e collisioni:** top-down tattico / 3/4; navigazione continua o tile-based da decidere in prototipo, niente prospettiva laterale.
- **Stealth:** NPC con direzione di sguardo, ostacoli opachi, triangoli/coni di visione per agenti e telecamere, stati calmo/sospetto/allarme/inseguimento.
- **Bilanciamento:** variabilità di round, difficoltà progressiva, scelta tra rischio e bottino, punteggio di uscita; il titolo allude alle **quattro cioccolate**.
- **Interfaccia:** responsive desktop + mobile, controlli touch e tastiera, leggibilità dei coni visivi, pause e riavvio.
- **Grafica:** usare `cover.svg` solo come **illustrazione provvisoria di anteprima**. Prima di creare spritesheet definitivi, rielaborare le foto di Ipno e Totore nel medesimo stile, con rotazioni/movimenti coerenti e sfondi trasparenti.
- **Tecnologia:** statico HTML/CSS/JS su GitHub Pages, salvataggio punteggi in `localStorage`, nessun backend obbligatorio.
- **Privacy/uso delle reference:** fotografie fornite dall'utente da utilizzare come guida grafica, senza riprodurre volti reali di terzi non necessari.

## 5. Limite dell'intervento richiesto ora
**SOLO predisposizione iniziale:** scheda nella home Arcade Club **cliccabile come ANTEPRIMA**, pagina introduttiva chiaramente **non giocabile**, illustrazione provvisoria, file obiettivo e reference fotografiche. **NON** creare ancora mappa giocabile, poliziotti, IA, scena dell'arresto, punteggi o pulsanti WhatsApp non funzionanti.

## 6. Accettazione
- La home espone **For Four Chocolate** con link corretto verso `games/for-four-chocolate/`; non lo conta tra i giochi giocabili.
- La pagina mostra il concept e torna alla home senza errori o finte funzionalità.
- La documentazione e le reference guidano le prossime sessioni senza confondere i personaggi.
- Ogni passaggio va registrato in `WORK_LOG.md` secondo `AGENTS.md`.
