# PIXEL ART MODUS — GTA Melito
**Manuale operativo permanente per ChatGPT, Work, collaboratori e future chat.**
**Ambito:** `games/gta-melito/` (Uns Arcade). **Revisione iniziale:** 19 ottobre 2026.

## 0. Principio e ordine di lavoro

Lo stile del gioco è una **pixel art originale dall'alto / 2.5D urbano**, leggibile sullo schermo del telefono e coerente tra strade, edifici, veicoli, persone e interni. La telecamera è dall'alto: si vedono soprattutto tetti, sommità, spalle e cofano. Le facciate degli edifici possono mostrare profondità e una piccola estrusione, senza trasformare singoli asset in illustrazioni frontali o isometriche incoerenti. L'obiettivo è far riconoscere **Melito di Napoli**, non realizzare una città generica.

Ordine vincolante per ogni nuovo asset o revisione:
1. **Studiare il gioco**: verificare PNG e moduli esistenti, scala nel Canvas, personaggi/veicoli vicini e vincoli di gioco.
2. **Raccogliere riferimenti** e distinguere luogo/modello reale da dettagli inventati; non incorporare screenshot da servizi cartografici proprietari.
3. **Disegnare/generare la TAVOLA SORGENTE completa**, in alta risoluzione e con soggetto intero, nella prospettiva concordata. Se è richiesta generazione artistica, usare ImageGen per generare o correggere l'immagine, non improvvisare la grafica finale in CSS/SVG.
4. **Far verificare la direzione estetica** quando il soggetto è nuovo o molto riconoscibile. Poi **ritagliare davvero** i soggetti e le pose.
5. **Esportare PNG con alpha autentico**, o WebP trasparente per edifici unici, allineati a pivot, direzione, dimensioni e colori esistenti.
6. **Integrare nel codice** e sostituire il visual precedente: un file presente nella repo che non appare nel gioco non è un'implementazione.
7. **Provare** vari orientamenti, scala a piedi/in auto, sfondo chiaro/scuro, sovrapposizioni, collisioni, browser e mobile; aggiornare test, cache e registri.

**Priorità:** coerenza, sagoma completa, leggibilità e corretto rendering nel gioco prima del numero di nuovi soggetti. Non dichiarare una prova visiva o un deploy senza averli eseguiti.

## Esempi visivi e codice — link diretti

Questi sono **file realmente presenti in questa repository**. I link relativi sono cliccabili su GitHub: aprire gli asset prima di disegnare altre versioni. Gli esempi stabiliscono stile, proporzioni e formato, **non** certificano che ogni dettaglio sia perfetto. Confrontarli anche alla scala reale del gioco.

| Categoria | Immagini di esempio da aprire | Dove vedere l'integrazione |
| --- | --- | --- |
| **Edificio speciale** | [Chiesa Santa Maria delle Grazie — WebP](./assets/buildings/chiesa-santa-maria-delle-grazie-game.webp) | [city-art.mjs](./city-art.mjs), [building-volume.mjs](./building-volume.mjs) |
| **Persona / NPC** | [Prima tavola: quattro pedoni, quattro direzioni](./assets/people/pedoni-4x4frames-24x40-rgba.png) | [pedestrian-sprites.mjs](./pedestrian-sprites.mjs) |
| **Protagonista / nuovi NPC** | [Seconda tavola con protagonista in felpa rossa](./assets/people/pedoni-secondo-lotto-4x4frames-24x40-rgba.png) | [extra-pedestrian-sprites.mjs](./extra-pedestrian-sprites.mjs) |
| **Personaggio professionale** | [Friggitore in camice bianco: 4 direzioni](./assets/people/friggitore-bianco-4dir-4frames-24x40.png) | [friggitore-sprites.mjs](./friggitore-sprites.mjs) |
| **Auto approvata** | [Fiat Panda moderna bianca — PNG](./assets/vehicles/panda-modern-white.png) e [Panda Fire rossa — PNG](./assets/vehicles/panda-fire-red.png) | [car-sprites.mjs](./car-sprites.mjs), [VEHICLE_ART_GUIDE.md](./VEHICLE_ART_GUIDE.md) |
| **Atlante auto** | [Punto / Ypsilon — colori, PNG con alpha](./assets/vehicles/punto-ypsilon-16colors-rgba.png) | [car-sprites.mjs](./car-sprites.mjs) |
| **Moto e scooter** | [16 varianti — atlante PNG](./assets/vehicles/moto-16-40x68-256.png) | [motorcycles.mjs](./motorcycles.mjs) |
| **Mezzi speciali** | [Ape Car](./assets/vehicles/ape-car-top.png) e [furgone dei fritti](./assets/vehicles/furgone-fritti-top.png) | [car-sprites.mjs](./car-sprites.mjs) |

**ATTENZIONE — CHIESA:** il WebP linkato documenta la versione **attualmente presente nel progetto**, ma il suo *retro appare troncato*. Non copiarne il taglio come esempio corretto: usare la tavola ImageGen originale completa quando disponibile, recuperare l'estensione posteriore e ricontrollare il posizionamento nel gioco. **La tavola originale ImageGen non è attualmente archiviata nella repository**: non inventare un link GitHub al master; va prima trasferito lì con una verifica del contenuto.

**Per nuove chat e altri agenti:** aprire **almeno un esempio della categoria interessata** e il suo modulo di rendering prima di produrre l'asset. Se i link non sono raggiungibili, usare i percorsi indicati nella cartella `assets/` della repo e annotare il problema nel WORK_LOG.

## 1. Regole comuni di disegno

| Aspetto | Regola |
| --- | --- |
| Prospettiva | Top-down per mezzi; dall'alto / 2.5D controllato per architettura e persone. **Non** frontale, laterale o 3/4 incoerente. |
| Luce | Una direzione coerente, prevalentemente **alto/sinistra (NO)**, con ombre corte verso basso/destra (SE); niente ombre duplicate in PNG e renderer. |
| Materiali | Palette urbana campana: intonaco crema/ocra, mattoni e tegole dove appropriati, asfalto, grigi del cemento, colori usati ma credibili. Dettagli solo se restano leggibili alla scala di gioco. |
| Forma | Prima silhouette, poi massa/volumi, poi grandi zone cromatiche, infine piccoli dettagli. Mai ingrandire un modello senza correggere l'ingombro. |
| Pixel | Dettagli nitidi, contorni non eccessivi, **nearest-neighbor in gioco** quando adatto allo sprite; niente sfocatura o antialias che crei aloni. |
| Alpha | Sfondo **trasparente**, mai rettangolo bianco/nero/beige. Testare il valore alpha anche all'interno delle celle dell'atlante; il chunk `tRNS` da solo non garantisce una trasparenza corretta. |
| Sorgenti | Conservare, quando disponibili, tavola originale non ritagliata, versione master trasparente, crop finali e metadati di allineamento: non degradare la fonte a ogni revisione. |
| Compatibilità | Disegno e fisica/collisioni sono separati. Non modificare hitbox, OSM, routine o controlli soltanto per far “entrare” il PNG. |

### Ritaglio corretto: errore da non ripetere

**Non tagliare mai un tetto, campanile, alettone, specchietto, ruota, piede o mano** per rispettare un rettangolo scelto a priori. Ritagliare dalla *sorgente completa* dopo aver individuato tutti i pixel del soggetto e degli elementi sporgenti, poi aggiungere un margine controllato. Verificare i quattro lati e gli angoli a zoom ingrandito.

Per una modifica del tipo «prima tagliato a x; ora deve essere a x·b»:
- tornare **all'originale**, non all'ultimo crop; annotare `sourceRect=(sx,sy,sw,sh)` e l'estensione desiderata;
- allargare **la/e dimensione/i della sorgente realmente necessarie** per includere la protuberanza (es. parte posteriore del tetto), senza aggiungere spazi vuoti casuali;
- conservare le proporzioni originali; **mai stirare** indipendentemente larghezza e altezza per riempire la vecchia bounding box;
- adattare coerentemente posizione, dimensioni **in unità mondo** e punto di ancoraggio nel renderer, così facciata, porta, campanile e punto di collisione rimangono allineati;
- provare **master intero → crop trasparente → WebP/PNG finale → scena reale**. Un crop riuscito sulla tavola può ancora risultare troncato per clipping, scala, tile-culling o un altro edificio sottostante.

Se un'immagine è troppo stretta si **espande il crop**, non si ridisegna obbligatoriamente il soggetto. Se il problema è nel rendering si corregge il posizionamento in codice, non si deforma l'immagine.

## 2. EDIFICI — procedurali e monumenti riconoscibili

**Prima di disegnare**: leggere `data/melito-map.json`, `city-art.mjs`, `building-volume.mjs`, `survey/` e verificare posizione, impronta OSM, proporzioni, rapporto con strade e vicini. La sagoma OSM è una base cartografica, **non** una fotografia dell'edificio. Gli edifici sintetici sono solo placeholders.

### Edificio ordinario
1. Usare sagoma OSM o placeholder assegnato; rispettare collocazione e viabilità.
2. Disegnare volume con tetto **leggibile dall'alto**, una o più facciate visibili, dettagli essenziali, ombra e profondità dello stesso linguaggio visivo.
3. Varianti di materiale deterministiche e coerenti con la categoria, senza attribuire piani/colori inventati come fatti verificati.
4. Lasciare `drawCityBuildings` e la logica delle collisioni in sintonia: un edificio senza volume o una parete che scivola sulla strada è un errore.
5. Confrontare a zoom fisso con palazzi vicini e pedoni; ridurre dettagli che diventano rumore.

### Monumento / edificio con asset dedicato
1. Riconoscere **ID OSM preciso**, contorno, facciata, ingresso, cupole, ali, retro, torre e appendici.
2. Generare **l'intero edificio** in un'immagine master ampia. Orientare dall'alto nella direzione della mappa; **non** tagliare i volumi dietro il tetto principale.
3. Ritagliare PNG/WebP trasparente contenente **tutta la sagoma**; mantenere proporzioni e punto di ancoraggio. La dimensione del WebP non deve necessariamente coincidere con la bounding box OSM se l'opera si estende oltre, ma **non** si devono inventare collisioni o travalicare strade con disegno errato.
4. **Un solo renderer per lo stesso edificio**: se si sceglie uno sprite/WebP completo, disabilitare esplicitamente per quell'ID vecchio tetto, pareti, ombre, parapetti, cornici, lotti e campanile procedurali. Non lasciare “il vecchio modello sotto”.
5. Assicurarsi che **tile cache, zoom, reveal trasparente e culling** non taglino l'asset all'uscita dal poligono; conservare il comportamento di camminata, ingresso, porte, strada e missioni.
6. Valutare prima/dopo in scena, non soltanto sul PNG.

**Caso concreto da ricordare — Chiesa di Santa Maria delle Grazie**: OSM way `733703815`, file `assets/buildings/chiesa-santa-maria-delle-grazie-game.webp`. Il primo crop del master ha perso parte del corpo posteriore; le prossime modifiche devono partire **dalla tavola ImageGen originale completa**, ampliare il ritaglio **verso il retro** e ricalibrare in game origine e dimensioni, senza deformare facciata e cupola. Il vecchio disegno Canvas per la chiesa è stato eliminato: **mai riattivarlo per mascherare trasparenze o riparare il WebP**. Mantenere l'OSM per la fisica. La chiesa di Piedigrotta resta indipendente.

## 3. PERSONE — protagonista e NPC

1. Creare soggetti coerenti con il quartiere: abiti credibili, variabilità di età, corporatura, professione, accessori, ma **stessa scala** e prospettiva per tutti. Non usare il volto “da ritratto frontale” in una mappa vista dall'alto.
2. **Spritesheet completo per personaggio:** quattro direzioni `up, down, left, right` e almeno **4 frame di camminata** per direzione. Una posa da fermo non deve “camminare sul posto”. Se servono altre azioni (salire, sedersi, lavorare), aggiungere stati espliciti e nuovi frame.
3. Nei frame della stessa direzione: testa/torso omogenei, scarpe e mani **dentro la cella** senza tagli, braccia/gambe alternate visibilmente; piedi allineati alla **stessa riga/pivot** per evitare saltellamenti.
4. **Riferimento attuale:** celle `24×40 px`; le tavole NPC `assets/people/pedoni-4x4frames-24x40-rgba.png` e `pedoni-secondo-lotto-4x4frames-24x40-rgba.png` usano 16 colonne × 4 righe, **4 personaggi × 4 frame** nelle colonne e **4 direzioni** nelle righe. Consultare `pedestrian-sprites.mjs` ed `extra-pedestrian-sprites.mjs` prima di aggiungere personaggi. Celle e coordinate possono evolvere: non assumere un ordine a memoria.
5. Esportare per ogni personaggio **sheet 4×4**, PNG individuali utili per revisioni e, in produzione, uno o pochi atlanti RGBA compressi; dichiarare ordine di righe/colonne in metadati o codice.
6. Associare animazione a velocità/spostamento reali, direzione di marcia e frame idle. Protagonista e NPC devono avere logica visiva separata (non duplicare casualmente il protagonista tra i passanti).
7. Il **protagonista deve essere identico anche negli interni** (banche, locali), salvo animazioni/addobbi intenzionali. Controllare porte, tetti trasparenti, urti, persone davanti e dietro edifici.
8. Veicolo a due ruote: il guidatore **sale visivamente in sella**, cambia stato dal corpo a piedi a quello seduto, non deve comparire doppio (uno a piedi + uno sopra la moto). L'eventuale casco è nello stato di guida.

## 4. VEICOLI — automobili, moto, Ape, furgoni

**Fonte di dettaglio vincolante:** [VEHICLE_ART_GUIDE.md](./VEHICLE_ART_GUIDE.md). Questo documento non la sostituisce.

1. Modello riconoscibile, **generazione corretta**, dimensioni coerenti con la strada: auto vere come riferimento artistico lecito. Non allungare Panda/Punto/Ypsilon o ingrandire uno scooter fino alla scala di un furgone.
2. **Veicoli: una vista ESATTAMENTE top-down** per ciascuna variante. Fronte verso **−Y del PNG**: il gioco può ruotarlo con `angle+Math.PI/2`. No isometrie.
3. Un modello per sheet; stessi pivot, forma, rotazione e dimensioni in tutte le varianti colore. Dove possibile, colori di produzione verificati per anno/allestimento; altrimenti dichiarare “varianti illustrative”.
4. Sprite singoli realmente trasparenti; poi atlante ottimizzato. Dimensioni già viste in repo (sono **esempi, non obblighi universali**): Panda `88×132`; utilitarie `40×60`/cella; moto `40×68`/cella (16 modelli/vernici in `160×272`).
5. Auto: tettuccio, parabrezza, lunotto, fari e specchietti con silhouette pulita. Moto: **due ruote**, manubrio, sella, cupolino e, se necessario, cavalletto; i piccoli mezzi non devono sembrare vecchie auto Canvas.
6. Se una moto è **parcheggiata**, mostrare sella **vuota** e renderla effettivamente guidabile. Se è **in corsa**, disegnare un guidatore sopra con proporzioni e orientamento corretti; mai una moto nuova sopra la “vecchia moto” procedurale.
7. Il rendering visivo non deve cambiare di nascosto collisioni, sterzo o accelerazione; usare i moduli dedicati. NPC e protagonista possono entrare/salire/scendere soltanto se la logica di gioco gestisce realmente quello stato. Controllare E/pulsante touch e l'indicazione del mezzo più vicino.
8. **Riferimenti codice:** `car-sprites.mjs`, `motorcycles.mjs`, `vehicle-entry.mjs`, `game.mjs` e, per l'Ape/furgone, `assets/vehicles/`. Usare asset già approvati come benchmark.

## 5. Validazione di crop, alpha, pivot e integrazione

**Controlli tecnici obbligatori per ogni nuovo/aggiornato asset:**
- Soggetto **intero**: bounding box dei pixel alpha>0 verificata; margine su tutti i lati, inclusi punti sporgenti/retro e frame estremi della camminata. La sagoma non deve toccare il confine per un crop involontario.
- **Alpha reale** in ogni cella: testare angoli e almeno un punto interno senza modificare parti scure del soggetto. Evitare sfondo bianco/nero rimasto nella maschera; provare sprite su sfondo chiaro e asfaltato.
- **Pivot stabile**: estremità del tetto, baricentro auto, piedi del pedone o sella moto devono restare nello stesso punto in ogni variante/fotogramma. Verificare orientamento a 0, 90°, 180°, 270°.
- **Dimensione e rapporto**: larghezza e altezza in pixel, rettangolo sorgente, destinazione in world-units, aspect ratio e offsets documentati. Nessuna deformazione per nascondere un errore di ritaglio.
- **Rendering una sola volta**: nessuna vecchia grafica procedural sovrapposta al nuovo asset. Verificare anche ombra, label, strato di tetti, reveal e bordi delle tile.
- **Prestazioni**: atlas condivisi dove utile, caricamento una volta sola, fallback sensato, niente nuova fetch o reimpostazione di texture per ogni frame. Immagini di produzione compresse, master separato.
- **Test**: validazione dimensioni PNG/WEBP, alpha, ID e mappatura frames; smoke di import e disegno; test gameplay dei casi pertinenti; verifica browser desktop/mobile a **stessa camera e zoom** prima/dopo; preferire screenshot reali alla sola anteprima ricostruita. Se non si dispone del browser, dichiarare «verifica visiva non eseguita».

**Rilasciare davvero:** commit, versione cache aggiornata su import e `index.html`, test Node pertinenti, controllo esiti CI/deploy, link alla build giusta. Non dare per pubblicata una PR non mergiata. Per lavoro condiviso seguire [AGENTS.md](./AGENTS.md): issue/Q assegnate al collaboratore → branch/PR dedicata; evitare conflitti su `main`.

## 6. Handoff per la chat successiva (modello da compilare)

| Campo | Da registrare prima di chiudere |
| --- | --- |
| Soggetto | Edificio/OSM ID, umano/identità o veicolo/modello e anno. |
| Materiale sorgente | Percorso master, versione e riferimenti con uso consentito; che cosa è ipotesi. |
| Ritaglio/crop | `sourceRect` e margini, frame/direzioni, dimensioni, pivot, orientamento e alpha. |
| Output | Asset esatti, atlas layout, codice renderer/loader, stato del vecchio asset. |
| Integrazione | In quale zona/veicolo/NPC compare in gioco; cosa succede alle collisioni. |
| Test / screenshot | Node, mobile, desktop, prima/dopo con stessa camera: **eseguiti o no**. |
| Distribuzione | Branch/PR, commit, versione cache, stato CI e deploy. |
| Lavoro successivo | Difetti visivi ancora presenti; esperimenti non conclusi. |

**Registro obbligatorio:** appendere la sessione a [WORK_LOG.md](./WORK_LOG.md); quando il lavoro riguarda asset o resa grafica, annotare anche [VISUAL_PROGRESS.md](./VISUAL_PROGRESS.md). Non attribuire a test automatici la conferma della qualità estetica, né dare per reali edifici/verniciature ipotizzati.
