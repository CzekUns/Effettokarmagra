# GTA Melito — Uns Arcade (prototipo 0.1)

> **PASSAGGIO DI CONSEGNE PER CHATGPT WORK:** leggi [AGENTS.md](./AGENTS.md) e soprattutto
> [HANDOFF_WORK_REALISMO.md](./HANDOFF_WORK_REALISMO.md).
> Obiettivo: migliorare davvero l'estetica del gioco fino a renderla riconoscibile
> come Melito di Napoli in pixel art 2.5D, con prove visive e fonti attendibili.
> **Passaggio di mano obbligatorio:** chiunque tocchi il progetto (persona o AI) deve leggere e aggiornare
> [WORK_LOG.md](./WORK_LOG.md) alla fine della sessione, indicando cosa ha fatto, come, verifiche e prossime azioni.
> Per gli interventi grafici aggiorna **anche** [VISUAL_PROGRESS.md](./VISUAL_PROGRESS.md).
> La modellazione OSM e quella fotografica **non sono equivalenti**.

Piccolo gioco arcade originale ispirato alla visuale dall'alto dei GTA degli anni Novanta, ambientato in **Melito di Napoli**. Accesso diretto dal browser, PC e telefono, sulla stessa GitHub Pages degli altri giochi. **Non contiene codice o asset di Rockstar Games.**

## Campagna 0.4: quattro missioni locali
- **Il primo contatto:** incontri il personaggio immaginario Nico tra Via Roma e Piazza Santo Stefano.
- **Il giro del centro:** attraversi Piazza Santo Stefano, Municipio e Piazza Immacolata, con un tempo limite.
- **La staffetta:** percorso da Piazza Immacolata fino ai due uffici postali passando per Corso Europa.
- **La firma della città:** circuito finale attraverso Largo Cinque Via, Piazza Santo Stefano e Via Roma.
- Obiettivi agganciati ai nomi/posizioni OSM con approssimazione al punto stradale percorribile. Le missioni, le buste, Nico e i contatti **sono finzione** e non coinvolgono realmente Comune, Poste o negozi.
- Interazione esplicita (F o pulsante), dialoghi, tempi, ricompense e salvataggio locale nel browser sotto `gta-melito-campaign-v3`.
- Otto luoghi localizzati, indicatore obiettivo sul mondo, minimappa e mappa della città completa con segnalini.
- Ricompense complessive completando tutte le missioni: **€795 virtuali e 40 punti rispetto**. I timer si fermano mentre dialoghi e mappa sono aperti.
- Tastiera: **F** interagisci, **M** mappa; mobile: pulsante missione e pulsante MAPPA.

## Stato e obiettivi realistici

- Confine amministrativo reale di Melito di Napoli: ISTAT, 1 gennaio 2026 (CC BY).
- Vie, curve, incroci, sagome edilizie e punti d'interesse: importati dai dati OpenStreetMap (ODbL). **Nessuna strada viene inventata con una griglia fittizia.**
- Movimento a piedi, guida arcade top-down con auto guidabili, salita/discesa, freno a mano, corsa, camera con inseguimento morbido e minimappa.
- **Incidenti arcade non letali**: auto/moto possono sbalzare via pedoni, altre vetture e il protagonista; entità e giocatore si rialzano/riprendono senza morti o rimozioni, con spinta proporzionale alla velocità e recupero dopo l'urto.
- **Nuovi sprite di quartiere (2026-10-19):** Piaggio Ape Car azzurra, furgone ambulante immaginario dei fritti con scritta «FRITTI», più friggitore NPC in camice e cappello bianchi. PNG palette alfa autentici, vista dall'alto (88×132 veicoli; 96×160, 4 direzioni × 4 passi per la persona). Entrambi i mezzi sono disponibili negli skin del traffico e dei parcheggi, con guida standard della classe auto; un pedone della coorte locale usa l'animazione del friggitore. Arte già integrata, ma **non** sono ancora implementati triciclo a tre ruote con fisica propria, varianti colore, sosta commerciale interattiva o acquisto: restano negli obiettivi Q16–Q17.
- **Routine NPC con zona di riferimento**: ogni pedone o veicolo conserva la zona e le strade d'origine; le svolte privilegiano il ritorno e gli eventuali riposizionamenti, necessari dopo incidenti o stalli, avvengono fuori camera vicino alla propria area, non in una strada casuale della città.
- **Viabilità a grafo**: 1.423 nodi geografici e 73 intersezioni con almeno tre diramazioni nell'estrazione del 16 ottobre 2026 (rete delimitata dal confine ISTAT); il traffico può scegliere una svolta e proseguire in un'altra via, con rispetto delle strade a senso unico.
- Pedoni animati sulle vie percorribili a piedi, traffico distribuito nei quartieri e rallentamenti tra auto sullo stesso segmento.
- Edifici con impronte OSM (2.056 sagome), tetti in pixel art, facciate proiettate, ombre, lucernari, impianti e variazioni cromatiche deterministiche.
- Carreggiate con larghezze approssimative differenziate per gerarchia OSM, marciapiedi, strisce pedonali in corrispondenza degli incroci.
- Arredo urbano **fictional/decorativo** generato proceduralmente (alberi, lampioni, cassonetti, scooter parcheggiati, panchine). Non corrisponde all'inventario reale di Melito.
- **Insegne illustrative** per i 57 punti d'interesse OSM nominati: testo e posizione derivano dalla cartografia, ma l'aspetto della targa è una rappresentazione inventata.
- **Comandi touch contestuali:** a piedi levetta analogica e CORRI; in auto o moto il controllo sinistro diventa un **volante rotante** e a destra compaiono, dall’alto, **FRENO**, **ACCELERA** e **RETRO**, in tre pulsanti più compatti. RETRO è un comando tenuto premuto e alimenta la retromarcia (auto e moto); sterzo e pedali funzionano contemporaneamente. Se ACCELERA e RETRO vengono premuti insieme, i due comandi si neutralizzano. Frenata di servizio distinta dal freno a mano (Spazio da tastiera).
- Rendering 2D Canvas con caricamento e disegno solo degli elementi vicini al giocatore.
- Per motivi di prestazioni e fedeltà, le **forme** dei palazzi vengono dai dati OSM, mentre le facciate e gli elementi sul tetto sono resi con un'estetica rétro originale. Il database OSM può essere incompleto; non garantiamo che contenga *ogni* negozio, strada privata o edificio.
- Le auto del traffico ora percorrono il grafo OSM e possono svoltare agli incroci; precedenze, semafori, collisioni complesse e pianificazione di destinazioni sono ancora semplificati. Missioni, polizia, danni e gameplay GTA completo restano da costruire.
- **Incroci e semafori (BF07, 20/10/2026):** le auto e le moto del traffico si fermano alla linea d'arresto, non impegnano l'incrocio se all'uscita non c'è posto, danno la precedenza alla strada di rango maggiore (a parità, a chi arriva da destra; chi gira a sinistra cede a chi arriva di fronte), passano una alla volta sulle traiettorie in conflitto e lampeggiano la freccia prima di svoltare. **Semafori simulati, di gioco, non rilevati:** l'istantanea OSM non contiene nodi `highway=traffic_signals`, quindi gli 8 semafori sono posizionati con una regola sugli incroci principali (`junctions.mjs`, `SIGNALS_SIMULATED`) e **non** corrispondono ai semafori reali di Melito; lo dice anche la scheda PAUSA. Ciclo di 30 s legato all'orologio di gioco; i pedoni che vanno dritti attraversano con il verde della propria via.
- **Lavavetri ai semafori (BF08, 20/10/2026):** un lavavetri accanto a 7 dei semafori di gioco. Col rosso, se la prima auto della coda è ferma (anche quella del giocatore; non le moto) e il rosso che resta basta, passa davanti al paraurti sulle strisce, si ferma al finestrino del lato guida, lava il parabrezza 3–6 s e torna sul marciapiede; al giallo o al verde rientra subito e l'auto lo aspetta. Personaggio e posti sono di gioco, come i semafori.

## Fonti e licenze

- **OpenStreetMap contributors**, https://www.openstreetmap.org/copyright — Open Database License (ODbL 1.0). I dati stradali ed edilizi derivano dalla community OSM.
- **ISTAT** e `guglielmo/geojson-italy`, https://github.com/guglielmo/geojson-italy — confine comunale ufficiale riferito al 1 gennaio 2026, dati CC BY. Conservare l'attribuzione in caso di distribuzione.
- Approccio alla guida 2D ispirato a **Punjab Stories** di Hnjra, https://github.com/harmanhanjra/punjab-stories (MIT, © 2026 Hnjra). Il gioco contiene una nostra implementazione Canvas originale, non una copia delle risorse GTA.
- Non utilizzare Google Maps come sorgente per estrarre o ridisegnare il database cartografico.

## Dati reali: come funziona l'importazione

Il browser legge `data/boundary.json` (i confini veri) e cerca `data/melito-map.json`. Se il file esiste, è subito giocabile senza chiamare Overpass. In mancanza, tenta di scaricare da Overpass strade, sagome degli edifici e POI, poi memorizza la mappa nel browser. Se la rete non è disponibile il gioco segnala chiaramente l'errore invece di sostituire Melito con una città finta.

Da un ambiente Node 22+ dotato di rete, nella root della repo:

```bash
node scripts/build-melito-map.mjs
```

Lo script ricava la cartografia OpenStreetMap da una bounding box del confine ISTAT, interseca i tratti stradali con il confine comunale reale per escludere tratti extra-comunali, converte le coordinate WGS84 in metri locali e scrive `games/gta-melito/data/melito-map.json`. È previsto un job GitHub Actions (`Build GTA Melito real map`) per generare e aggiornare lo snapshot statico; eventuali protezioni del repository possono richiedere l'esecuzione manuale del workflow.

### Comandi

- **WASD / frecce:** a piedi spostamento libero; alla guida A/D (sinistra/destra) per sterzare, W (su) per accelerare, S (giù) per retromarcia. Girare il volante senza premere il gas non avvia il veicolo.
- **E:** entra nell'auto vicina, oppure scendi.
- **Shift:** corsa a piedi.
- **Spazio:** freno a mano.
- **Telefono:** pulsanti direzionali, ENTRA/SCENDI, FRENO e CORRI.
- **+ / −:** zoom.
- **⌂:** torna al punto di partenza.\n\nPer verificare topologia, passaggio fra segmenti e reali geometrie:\n\n```bash\nnode --test games/gta-melito/*.test.mjs\n```\n\nC'è anche un workflow `GTA Melito campaign validation` che esegue i test ad ogni modifica al gioco.

## Sviluppo successivo

1. Verifica geometria e segnalazione strade OSM mancanti.
2. Collisioni, attraversamenti e navigazione del traffico tramite un vero grafo di strade.
3. Edifici e monumenti riconoscibili tramite tile/sprite originali.
4. Missioni locali, NPC, polizia e salvataggio.
5. Ottimizzazione smartphone e verifica con test reali su dispositivi.

Questa è la versione 0.4 del prototipo di esplorazione urbana con campagna narrativa di prova. I dati geografici sono reali; alcuni allestimenti grafici e gli NPC sono inventati. Non è un GTA 2 completo né una ricostruzione fotografica degli immobili.

## Aggiornamento estetico 0.4 — mappa al centro

- L'interfaccia non seleziona più il testo dei tasti con pressioni prolungate; il testo del sito esterno rimane normale e il focus da tastiera resta visibile.
- Il riquadro delle missioni è **chiuso all'avvio**: resta accessibile dal piccolo tasto `MISSIONI`, mentre `F` continua a interagire con gli obiettivi. Nessuna nuova missione.
- Nuova resa del terreno e delle carreggiate che mantiene il tracciato OSM, marciapiedi, cordoli e segnaletica distinti per classe di strada.
- Nuovo renderer dei tetti/corpi di fabbrica con materiali coerenti: tetti in cotto e intonaco nell'area storica, edifici residenziali, condomini, civici, attività commerciali e capannoni; balconi, abbaini, canne fumarie e ombre sono *interpretazioni*, non ricostruzioni certificate.
- **Chiesa di Santa Maria delle Grazie**: sagoma OSM originale, modello a cupola con lanterna, motivato dalla pianta centrale reale documentata dal Comune e dal FAI (https://comune.melito.na.it/vivere-il-comune/luoghi/chiesa-di-santa-maria-delle-grazie/ ; https://fondoambiente.it/luoghi/chiesa-di-santa-maria-delle-grazie-melito-di-napoli). L'altra chiesa mantiene una rappresentazione diversa.
- **Municipio**: edificio associato all'OSM ID 733703600 vicino al POI del municipio, con tetto rosso e cornici chiare coerenti con la documentazione fotografica comunale (https://comune.melito.na.it/vivere-il-comune/). Associazione cartografica prossima, da verificare sul posto.
- **47 insegne/ingressi illustrati** generati dai POI con nome OSM in prossimità di una strada e abbastanza vicini da sostenere un posizionamento di facciata; nessun esercizio inventato da promuovere come realmente esistente.
- Pedoni, personaggio principale, scooter, auto e furgoni ridisegnati in Canvas con sagoma top-down leggibile, ombra, passo animato e dettagli.
- Il file OSM può includere metadati extra sugli edifici (tipologia, piani quando disponibili, forma/materiale del tetto), conservati nel database statico. Per i dati mancanti il disegno rimane *plausibile ma non certificato*.
- I precedenti moduli `visuals.mjs`, `roads.mjs`, `campaign.mjs` e `landmark-art.mjs` restano disponibili e il motore delle missioni è invariato.

Riferimenti visuali pubblici: Comune di Melito e FAI; **non vengono copiate fotografie o tessere proprietarie** nel gioco. Per riprodurre con maggiore precisione uno specifico prospetto serviranno fotografie originali con autorizzazione, orientamento dell'edificio e particolari architettonici.

### Pavimentazioni e densità urbana (0.4)

La colorazione del suolo è una stima in base alla concentrazione di edifici e strade OSM: cemento e pietra nelle zone costruite, verde nei settori meno urbanizzati. Non è una carta catastale degli usi del suolo. La resa pixel art è sempre un'interpretazione artistica. La strada, la posizione dei negozi e le sagome edilizie restano geolocalizzate. Il modulo `city-art.mjs` gestisce lo stile, `storefronts.mjs` proietta i negozi OSM sulla strada più vicina. Il tasto MISSIONI apre il motore già presente senza coprire la visuale di default.

## Sopralluogo progressivo dal confine (0.4.1)

Il censimento integrale degli edifici OSM è iniziato dal bordo nord-occidentale, usando una griglia di 34 settori. Nel primo passaggio sono state catalogate tutte le 2.056 impronte e sono stati assegnati 47 **profili estetici provvisori** su 47 building ID dei primi due settori. **Nessuna facciata è ancora verificata con Google Street View.** Il sopralluogo consultabile è in [survey/index.html](./survey/index.html); il protocollo completo e le fonti sono in [survey/README.md](./survey/README.md). I nomi stradali sono associazioni per prossimità da OSM, non numeri civici. Per fotografia fedele occorre validare edificio per edificio prima di segnare `photoVerified`.

## GTA Melito 0.4.2 — proporzioni delle strade corrette

Il feedback sulla mappa era fondato: le carreggiate erano troppo strette rispetto ad auto e pedoni (ad esempio `residential=7` contro un'auto larga circa 4–5 unità nel rendering). La nuova scala arcade usa `road-widths.mjs` e produce:

| Classe OSM | Prima (unità del gioco) | Ora | Differenza |
| --- | ---: | ---: | ---: |
| Residenziale | 7 | **13,3** | +90% |
| Terziaria | 9 | **15,5** | +72% |
| Secondaria | 11 | **17,6** | +60% |
| Servizio | 5 | **9** | +80% |
| Principale | 13 | **19,5** | +50% |

La larghezza arcade è una **correzione di proporzioni visive**, non una misura certificata delle carreggiate reali. L'archivio geografico OSM `melito-map.json` non viene alterato, e gli edifici restano sulle impronte originali; eventuali larghezze reali andranno ricavate strada per strada. Il nuovo valore è usato coerentemente per asfalto, cordoli, marciapiedi, attraversamenti, NPC sul bordo strada, offset delle corsie del traffico, insegne e collisione dell'auto guidata. I pedonali vengono ampliati solo moderatamente.

## GTA Melito 0.4.3 — confronto visivo immediato

L'utente non percepiva l'aumento introdotto con 0.4.2. La 0.4.3 aumenta ulteriormente le dimensioni arcade delle carreggiate principali (residenziale 7 → **15,4 unità grafiche**) e rende più evidente il margine di asfalto. Soprattutto aggiunge una barra **CONFRONTA CON PRIMA** che alterna senza ricaricare la pagina tra il vecchio rendering 7 e il nuovo 15,4, ricalcolando anche grafo viario, AI, collocazione pedoni e oggetti stradali. Non sono misure reali delle strade.

Per prevenire moduli obsoleti nel browser, l'HTML carica `game.mjs?v=043` e i moduli modificati importano `road-widths.mjs?v=043` come singola istanza condivisa. Chi ha la pagina vecchia in cache deve aprire il link versione `?v=043` o fare ricarica forzata.

## 0.4.4 — Piazza Santo Stefano: primo anello di scan

- Nuova priorità: prima Piazza Santo Stefano, anello circolare di raggio **190 m**. **58 edifici** con profili specifici e forme OSM in `survey/piazza-santo-stefano.json`.
- Uno solo dei 58 è identificato fotograficamente: **Chiesa di Santa Maria delle Grazie**, way OSM 733703815. Foto pubbliche e schede Comune/FAI/ICCD descrivono facciata barocca chiara, cupola e campanile in mattoni con orologio. La loro rappresentazione in pianta resta illustrativa e non è un rilievo 3D.
- Altri 57: colori e materiali **provvisori**, non derivati da foto certe dei singoli edifici.
- L'archivio ora si apre direttamente su Piazza Santo Stefano, con filtri per ritornare ai settori precedenti. Il censimento completo delle 2.056 sagome continua a esistere.
- I profili OSM nuovi si caricano in ordine dopo quelli precedenti; motore missioni e tracciati viari non sono stati modificati.

## 0.5.0 — PRIMA PASSATA GRAFICA DI TUTTA MELITO

**Copertura completata delle 2.056 sagome edificio** dell’archivio OpenStreetMap attuale. Ogni building way ha una **scheda estetica individuale**, con categoria derivata dai tag OSM, area calcolata dalla pianta, direzione prevalente, colori delle facciate/tetti, sagoma visiva e dettagli procedurali ripetibili: balconi, terrazze, volumi tecnici, piccoli cortili, serbatoi e pannelli decorativi ove coerenti. La grafica è utilizzata dal renderer Canvas tramite `survey/town-visuals.json` e `survey/visual-profiles.mjs`.

**Non equivale a una scansione completa di Google Street View:** 2.055 facciate su 2.056 NON sono state confrontate con una fotografia individuata con certezza. Colori, piani non taggati, balconi e dettagli restano interpretazioni artistiche non certificate. Santa Maria delle Grazie è l'unico edificio identificato in fotografia tramite fonti pubbliche in questa fase. **Non dichiariamo verificati i 2.055 edifici stimati.**

I profili sono prodotti deterministicamente da `survey/town-generator.mjs` usando le sole geometrie/tipologie OpenStreetMap e il registro OSM originale; nessuna immagine Google viene scaricata. Il catalogo originario per settori (34) e le 47 vecchie schede sono conservati, così come le 58 schede individuali del primo anello di Piazza Santo Stefano. Il visualizzatore `survey/index.html` espone tutta la città, anelli concentrici dalla piazza e tutti i 34 settori, con link Maps/Street View per continuare in seguito la verifica fotografica e con il numero corretto di schede complete.

## 0.6.0 — Fill urbano e telecamera automatica

Il territorio reale di Melito è fortemente urbanizzato. Il precedente renderer rappresentava con **verde erboso** ogni zona senza impronta edificio OSM: questo era un errore concettuale, perché una zona non registrata su OSM non è automaticamente un prato. Il nuovo fondo è **urbano, con cortili pavimentati, piazzali e toni cemento/pietra**; piccole zone verdi rimangono solo come dettaglio illustrativo, non come parchi georeferenziati. La densità di alberi generici sulle strade è ridotta.

Il modulo `urban-infill.mjs` posiziona deterministicamente edifici **PLACEHOLDER** nei vuoti del tessuto stradale, guidandosi tramite strade OSM, margini di carreggiata, densità degli edifici reali e confine comunale. Esclude Piazza Santo Stefano e il Municipio, intersezioni con edifici OSM, strade e pezzi di territorio poco supportati dalla presenza di fabbricati mappati. I placeholder:
- hanno ID sintetici negativi e sono colorati/rappresentati in pixel art;
- non alterano le 2.056 sagome immobiliari OSM certificate come geometrie della fonte;
- **non sono rilievi reali** e possono differire dalla presenza effettiva di immobili;
- entrano nelle collisioni di gioco per impedire al personaggio di attraversare i loro muri;
- sono conteggiati separatamente dal numero di edifici OpenStreetMap nel pannello HUD.

La **telecamera automatica** (`camera-zoom.mjs`) si inizializza a **5× a piedi** (zoom massimo), scala a **4,65×** durante lo sprint e in auto parte attorno a **3,35×**, arretrando progressivamente fino a circa **1,87×** a 28 unità di velocità. Il rapporto ottico è definito dalla scala Canvas: a velocità più alta si vede **più strada in anticipo**, quindi il moltiplicatore numerico diminuisce. Interpolazione morbida indipendente dal frame rate. I pulsanti +/− regolano il fattore preferito, il nuovo pulsante **AUTO** ripristina l'adattamento standard.

Le distanze reali e l'esatta occupazione urbanistica richiedono cartografie comunali aerofotogrammetriche: consultare [strumenti urbanistici e tavole del Comune](https://comune.melito.na.it/edilizia-privata/documentazione-edilizia-privata/strumenti-urbanistici-e-tavole/), inclusi elaborati 1:2.000 e 1:5.000. I placeholder non sostituiscono tali fonti.

## GTA Melito 0.7.0 — volume su ogni fabbricato (17 ottobre 2026)

**Tutti** gli edifici OSM (2.056) e i placeholder del generatore urbano (467 con la cartografia OSM corrente) sono estrusi tramite un'unica funzione `drawCityBuildings`, ora con **una sola ordinazione di profondità** per entrambi gli insiemi. Il nuovo modulo `building-volume.mjs` calcola per **ogni singolo poligono**, indipendentemente dalla superficie e dalla categoria, un'altezza minima di estrusione di **9 unità di gioco**, che cresce con i piani modellati o l'altezza già associata. Le pareti visibili rispettano l'orientamento dei poligoni OSM, anche quando i punti sono in ordine inverso. Colori differenziati tra fronti, fasce dei piani, finestre, balconi dove previsto, marcapiani, spigoli, cornici dei tetti e ombre portate rendono gli edifici leggibili in stile 2,5D. Le chiese e il municipio **conservano i tetti unici**, ma adesso hanno lo stesso trattamento volumetrico delle altre costruzioni.

Le **impronte planimetriche OSM non cambiano** e i placeholder restano identificati come ricostruzioni artificiali; l'altezza non documentata rimane una scelta estetica e non una misura fotografica. Test specifici controllano che non esistano sagome con volume nullo e che tutte le tipologie mostrino fiancate e ombra, anche per gli annessi di superficie minima. Il rapporto dello zoom automatico resta quello della versione 0.6.

## Panda top-down in gioco — skin PNG (2026-10-17)

La macchina iniziale, parcheggiata a pochi metri dal punto di partenza su Via Roma, è ora disegnata utilizzando **la Panda moderna bianca vista dall'alto**, ritagliata dallo spritesheet fornito dall'utente. Anche alcune auto parcheggiate nel traffico usano **la Panda Fire anni '90 rossa**. Asset PNG originali in `assets/vehicles/panda-modern-white.png` e `assets/vehicles/panda-fire-red.png`, 88×132, sfondo trasparente, ricampionati dall'artwork con palette ottimizzata. Non provengono da fotografie Street View.

Il modulo `car-sprites.mjs` precarica entrambi gli asset, adatta dimensioni e orientamento della vista: **il frontale nel PNG è in alto, mentre il modello matematico di guida punta verso +X con angolo zero**, quindi la sprite viene ruotata di `angle + Math.PI/2`. La Panda moderna appare lunga 8,75 unità e larga 5,5 (leggermente accorciata rispetto all'illustrazione). La vecchia Fire è 8,55 × 5,1. Il motore di guida, la fisica, i punti di collisione e gli agenti del traffico **non cambiano**. Se il PNG non è ancora disponibile, viene automaticamente disegnata la precedente auto Canvas.

Attenzione: soltanto la starter car e una selezione di auto parcheggiate hanno per ora queste skin; il resto del traffico mantiene il renderer procedurale. Il catalogo degli altri 14 colori esiste nel pacchetto di asset locale ma non è ancora integrato nella repo.

## Fiat Punto 188 e Lancia Ypsilon 2003 — 16 sprites top-down

Aggiunto `assets/vehicles/punto-ypsilon-16colors-atlas.png`: atlante PNG **trasparente** di 160 × 240 pixel, 4 colonne × 4 righe (16 varianti da 40 × 60). Le prime due righe sono la **Fiat Punto 188** (bianco, rosso, blu, argento, grigio scuro, nero, verde chiaro, beige/champagne), le ultime due la **Lancia Ypsilon 2003** (bianco, nero, argento, grigio scuro, blu notte, azzurro, bordeaux, beige/champagne). Immagini ritagliate da due sheet illustrati con punto di vista esclusivamente dall'alto, poi convertite in PNG indicizzato leggero per funzionare sul telefono. I singoli PNG più dettagliati e gli sheet su bianco sono disponibili nell'archivio ZIP consegnato in chat. **ATTENZIONE**: palette ispirate a vernici plausibili per l'epoca, non tutte le varianti verificate su listini d'epoca o come codici colore ufficiali.

`car-sprites.mjs` precarica il nuovo atlante e associa ogni variante a un rettangolo di sorgente in `drawImage`. Il motore applica scala Panda/compatte coerente e rotazione `angle + Math.PI/2`. Ora seleziona Punto/Ypsilon anche per alcune auto parcheggiate e auto AI in movimento, lasciando parte del traffico procedurale per varietà. La Panda moderna bianca resta la vettura iniziale; la Panda Fire rossa resta parcheggiata. **Fisica, collisioni, salvataggio e comandi invariati**.

### Correzione del rettangolo nero delle nuove auto (2026-10-17)

Segnalazione dell'utente confermata: il PNG atlante Punto/Ypsilon da 160×240 era stato appiattito sopra un fondale scuro, quindi `drawImage` riproduceva un rettangolo intorno alle 16 auto. **Non attribuire il problema allo stile o al Canvas di gioco:** la trasparenza RGBA del precedente PNG era errata.

Fix v104: `vehicle-alpha.mjs` contiene i contorni (envelope delle silhouette derivato dai crop RGBA originali) dei modelli Punto/Ypsilon. In `car-sprites.mjs` il PNG viene caricato in un Canvas ausiliario, viene azzerato l'alpha e l'RGB di tutto il fondale esterno alla silhouette e solo il Canvas riparato è messo a disposizione del renderer. Se non è possibile creare il Canvas, si mantiene il fallback con l'auto disegnata proceduralmente: **non si ripristina mai la vecchia immagine col rettangolo**. Le Panda già approvate rimangono inalterate. Lo stamp della pagina sale a v104 per svuotare le cache dei moduli. Questo è un fix dell'immagine renderizzata: l'originale PNG opaco nella repo resta come ingresso legacy al passaggio di ripristino; nuovi atlanti devono invece essere prodotti con canale alpha corretto direttamente nel file.


## Radio in auto — prova sperimentale (v136, 19 ottobre 2026)

- Selezione di sei emittenti reali: **Radio Marte, Radio Kiss Kiss Napoli** (non quella nazionale), **Radio CRC, Radio Nuova San Giorgio, Radio Norba e Radio Napoli**.
- La radio compare **soltanto a bordo delle auto**: pulsanti ◀ / ▶▶ per cambiare stazione, ▶ / ■ per accendere, spegnere o riprovare. Da tastiera: `R` successiva, `Shift+R` precedente, `T` on/off. Su scooter e moto rimane spenta. Entrando in auto tenta di avviarsi, scendendo si interrompe.
- Un link ↗ apre la pagina della stazione. In caso di errore/autoplay bloccato, il pannello mostra lo stato e permette un nuovo tocco. Le preferenze vengono salvate localmente.
- **I sei URL HTTPS sono candidati reperiti online, non verificati con una prova di ascolto reale su Android o desktop.** Lo streaming può essere rifiutato, spostato o risultare incompatibile con il browser; l'app non scarica/ritrasmette/archivia alcun brano, apre direttamente il server dell'emittente. Prima di mantenere la funzione in una pubblicazione stabile, chiarire condizioni d'uso e permessi dell'integrazione con ciascuna emittente.
- Logica e test: `car-radio.mjs`, `car-radio.test.mjs`. Una prova di funzioni in sandbox JavaScript non sostituisce ascolto reale o verifica legale.

<!-- Q02: five-slot fictional NPC agenda is being integrated; see TODO for status. -->

## Varchi di confine (BF09, 20 ottobre 2026)

Le strade carrabili che OpenStreetMap continua oltre il confine ISTAT vengono tagliate da `osm.mjs` (`clipPolyline`). L'ultimo nodo di ognuna è un **varco** verso un altro comune. Sulla mappa attuale sono 70: trunk 12, primary 4, secondary 2, tertiary 4, unclassified 7, residential 22, service 16, track 3.
- **Traffico.** Un'auto o moto NPC che arriva a un varco in uscita prosegue nel buio oltre il taglio e sfuma fino a sparire (sparizione controllata). Al suo posto un'altra auto entra da un varco in entrata libero, uscendo dal buio. Il numero di mezzi resta costante e nessun mezzo compare o sparisce a metà strada. Ai varchi non ci sono più inversioni a U, e i sensi unici che escono dal comune non sono più capolinea (BF03).
- **Varchi esclusi.** Un varco il cui tratto nel buio passa sotto un edificio disegnato oltre il confine resta nei dati, ma il traffico non lo usa.
- **Grafica.** Le strade finiscono con un taglio dritto lungo il confine, senza estremità arrotondate. Al varco un imbocco a trapezio fa proseguire asfalto e marciapiedi per 16 m, restringendoli un poco e sfumandoli nell'area nera.
- **Dati per il futuro.** `state.borderGates` (prodotto da `borderGateList` in `border-gates.mjs`) elenca ogni varco con:
  - `id` stabile (`osmWay@x,y`);
  - coordinate di gioco e WGS84 (`lon`, `lat`);
  - angolo verso l'esterno, nome e tipo della strada, OSM way;
  - sensi ammessi (`entrata`, `uscita`, `entrambi`);
  - `usatoDalTraffico`;
  - `comune`, lasciato **vuoto** perché il comune confinante non è nei dati.

  È la base per collegare in futuro le mappe dei comuni vicini.
- **Numero di mezzi.** `balanceTraffic` (`roads.mjs`) porta il traffico al numero `state.trafficTarget` (oggi 140), sempre passando dai varchi. Le ore di punta (Q13) possono quindi cambiare il numero di mezzi senza far comparire auto in vista.
- **Giocatore.** Il giocatore non attraversa il confine: resta come prima.

## Recinti, cancelli e guardiole (BF12)

`enclosures.mjs` disegna le mura perimetrali, i cancelli e le guardiole dei recinti elencati in `data/enclosures.json`: villa comunale, complesso Municipio con Carabinieri e piscina comunale, recinto di fronte all'area mercatale (forse il «Parco GB», da verificare). La galleria Atlante, edificio di vetro, è riconosciuta come «probabile».
- **Perimetro:** dove OSM ha il perimetro, il gioco lo segue (villa comunale: muro e due cancelli OSM). Altrove il perimetro è **ricalcato a vista** e marcato `verificato:false`.
- **Mura:** non stanno mai sulla carreggiata né sul marciapiede disegnati, ma appena oltre.
- **Cancelli:** ogni strada o vialetto che attraversa il perimetro ha un'apertura, quindi nessuna strada resta chiusa.
- **Notte:** dalle 22 alle 6 le sbarre dei recinti privati sono abbassate per il giocatore e si alzano per i mezzi NPC; i pedoni passano sempre.
- **Mancanti:** il «Parco Prima Casa» non è disegnato perché non è stato localizzato. Le fonti sono in `RECINTI_MELITO.md`.

Riferimento visivo: Esri World Imagery (consultata il 20/10/2026), usata solo per stime a vista delle coordinate; nessuna immagine satellitare è inclusa nel repository.
