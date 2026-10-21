# OBIETTIVO — FOR FOUR CHOCOLATE
**Progetto:** Uns Arcade / Arcade Club · **Stato:** vertical slice tecnico giocabile; resa visiva non approvata · **Data:** 21 ottobre 2026

> **DIREZIONE ARTISTICA AGGIORNATA (vincolante):** [DIREZIONE_ARTISTICA_PS1.md](./DIREZIONE_ARTISTICA_PS1.md). L'utente chiede uno stile **Metal Gear Solid PlayStation 1**, con scena tridimensionale e camera dall'alto obliqua. Il prototipo C64-like attuale è **respinto sul piano grafico**. Ogni indicazione di «pixel art» qui sotto è storica e non più valida come obiettivo estetico.

## 1. Visione
Arcade stealth umoristico **For Four Chocolate**, con protagonista **Domenico “Ipno”**. Ambientazione: **supermercato della Repubblica Ceca**, organizzato come un labirinto di corsie, scaffali, casse, varchi, scale mobili e stanza di sicurezza. Visuale **dall'alto o tre-quarti elevato**, leggibile come le sezioni stealth del classico Metal Gear: movimento furtivo, pattuglie, angoli ciechi, ripari e campi visivi espliciti. Stile grafico da **Metal Gear Solid PS1**, con prospettiva alta obliqua e ambiente 3D/2.5D di qualità, profondità reale degli scaffali, materiali, illuminazione e personaggi volumetrici; niente resa Commodore 64 né placeholder primitivi.

## 2. Personaggi e reference visive
- **Domenico Ipno**, personaggio giocabile. Due fotografie fornite dall'utente: una foto di gruppo con **cappello di paglia** e posa accucciata, e una seconda all'aperto con **cappello di paglia, occhiali, camicia fantasia, accovacciato sulla sfera**. Preservare aspetto e riconoscibilità nel ritratto/sprite, adattandolo alla prospettiva del gioco.
- **Totore Capellone**, cameo: terza foto, il giovane con **capelli ricci** e t-shirt scura, in primo piano. Nell'epilogo esce dal supermercato con **un salame al posto della cintura**. Non confondere le foto: le prime due = Ipno, la terza = Totore.
- **Poliziotti cechi:** divise scure con scritta **POLICIE**; distinguere agenti dalle telecamere. Usare riferimenti reali per colori e disposizione delle divise senza riprodurre marchi se non necessari.
- **Supermercato ceco:** corridoi e merce credibili; insegne, etichette e segnaletica in ceco: “Čokoláda”, “Pokladna”, “Východ”, “Akce”. Reference architettonica generica delle catene ceche (es. Lidl, Albert, Billa), senza pretendere di ricreare un negozio reale.
- **Reference fotografiche:** tre immagini allegate dall'utente nella conversazione del **21 ottobre 2026**. Destinazione in repository: `games/for-four-chocolate/references/` con nomi `ipno-foto-1.webp`, `ipno-foto-2.webp`, `totore-capellone.webp`. Le foto sono reference, **non** sprite giocabili. In repo sono state caricate copie WebP molto leggere (~175 px di larghezza) per il brief: per il disegno degli sprite recuperare gli **originali ad alta risoluzione** dalla conversazione del 21 ottobre 2026. Non sostituirle con illustrazioni; non pubblicarle nella pagina di anteprima senza ulteriori decisioni.

## 3. Loop di gioco futuro
1. Ipno entra nel supermercato e si muove per la mappa tra gli scaffali.
2. Il giocatore raccoglie **cioccolato e altri oggetti dagli scaffali**; si tiene conto del bottino e del punteggio.
3. Agenti **POLICIE** pattugliano con routine autonome, waypoint e cono visivo. Telecamere fisse o oscillanti con proprio campo visivo. Scaffali e muri **bloccano la linea di vista** in modo consistente. Segnalare scoperta e inseguimento.
4. Il giocatore cerca di raggiungere l'uscita senza essere individuato; quando esce salvo, il gioco calcola e mostra un **record** e può **condividerlo su WhatsApp** con testo + link al gioco (Web Share API se disponibile, fallback a URL WhatsApp codificato).
5. Se viene scoperto, Ipno è **catturato e accompagnato in una stanza**. Un poliziotto dice in **ceco**, con eventuali sottotitoli italiani: **«Za čtyři čokolády jste urazil Českou republiku!»** (= «Per quattro cioccolate hai offeso la Repubblica Ceca!»), seguito dalla battuta volutamente inglese **«For four chocolate?»**. La formulazione ceca potrà essere rifinita prima dell'implementazione audio.
6. Epilogo comico del fallimento: Ipno **sale la scala mobile ammanettato**, esce e riceve **la multa**; in contemporanea compare il cameo di **Totore Capellone** che esce dal supermercato con un salame usato da cintura.

## 3A. Regole stealth aggiornate (22 ottobre 2026) — PRIORITÀ ALTA
- Ipno può **essere visto mentre cammina**: trovarsi nel supermercato non comporta una cattura automatica. La visibilità ordinaria non equivale a furto in flagrante.
- **La cioccolata si preleva dagli scaffali**, usando un'interazione e un'animazione, mai raccogliendo oggetti sparsi sul pavimento.
- La condizione di rischio reale è **essere visto nel momento del prelievo**. Il giocatore deve scegliere l'istante in cui guardie e CCTV non possono vederlo; se già esposto, il prelievo può essere negato; se viene visto durante l'azione, scatta un intervento/cattura.
- Le zone hanno sorveglianza **eterogenea**; una zona può essere più/meno sicura a seconda di pattuglie, orari e telecamere.
- **Dopo ogni prelievo alcune zone diventano più sorvegliate**, specialmente quella interessata, con pattuglie/campi CCTV aggiornati. Lo stealth è adattivo e progressivo.
- Per i dettagli grafici e mobile vedi **[REFERENCE_GAMEPLAY.md](./REFERENCE_GAMEPLAY.md)**; Metal Gear Solid **VR Missions** è la guida principale per le proporzioni e la camera.

## 4. Specifiche future (non ancora implementate)
- **Visuale e collisioni:** telecamera obliqua **3D in stile MGS PS1**; la logica tile-based del prototipo può essere riutilizzata, ma non impone resa a quadrettoni né sprite 24×40 in output. Il movimento finale dovrà risultare fluido.
- **Stealth:** NPC con direzione di sguardo, ostacoli opachi, triangoli/coni di visione per agenti e telecamere, stati calmo/sospetto/allarme/inseguimento.
- **Bilanciamento:** variabilità di round, difficoltà progressiva, scelta tra rischio e bottino, punteggio di uscita; il titolo allude alle **quattro cioccolate**.
- **Interfaccia:** responsive desktop + mobile, controlli touch e tastiera, leggibilità dei coni visivi, pause e riavvio.
- **Grafica:** [direzione PS1 vincolante](./DIREZIONE_ARTISTICA_PS1.md). `cover.svg` è un'immagine provvisoria; i PNG 24×40 e il generatore originario sono solo riferimenti tecnici storici. Personaggi e scaffali devono avere volume e prospettiva. Usare le foto originali per modellare/renderizzare Ipno e Totore nei rispettivi momenti.
- **Tecnologia:** statico HTML/CSS/JS su GitHub Pages, salvataggio punteggi in `localStorage`, nessun backend obbligatorio.
- **Privacy/uso delle reference:** fotografie fornite dall'utente da utilizzare come guida grafica, senza riprodurre volti reali di terzi non necessari.

## 5. Limite dell'intervento richiesto ora
**Nota storica:** questa sezione descriveva il primo incarico, ormai superato. Le PR #94 e #95 hanno pubblicato un **vertical slice tecnico giocabile**, ma la resa a quadrettoni/sprite miniaturizzati è stata criticata. Ora il prossimo traguardo non è aggiungere funzionalità: è sostituire la grafica con il **campione PS1**, da validare prima del resto.

## 6. Accettazione
- La home espone **For Four Chocolate** con link corretto verso `games/for-four-chocolate/`; non lo conta tra i giochi giocabili.
- La pagina mostra oggi un prototipo giocabile; la prossima revisione deve soddisfare i criteri grafici della direzione PS1 prima di essere considerata esteticamente approvata.
- La documentazione e le reference guidano le prossime sessioni senza confondere i personaggi.
- Ogni passaggio va registrato in `WORK_LOG.md` secondo `AGENTS.md`.
