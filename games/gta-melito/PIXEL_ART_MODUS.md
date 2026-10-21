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
| **PERSONAGGI — REFERENCE PRIMARIA OBBLIGATORIA** | [Prima tavola: quattro pedoni, quattro direzioni](./assets/people/pedoni-4x4frames-24x40-rgba.png) | [pedestrian-sprites.mjs](./pedestrian-sprites.mjs) |
| **Protagonista / nuovi NPC** | [Seconda tavola con protagonista in felpa rossa](./assets/people/pedoni-secondo-lotto-4x4frames-24x40-rgba.png) | [extra-pedestrian-sprites.mjs](./extra-pedestrian-sprites.mjs) |
| **Fogli extra pedoni (CODEX-GH, PROVVISORI)** | [Lotto 2](./assets/people/pedoni-lotto2-4x4frames-24x40-rgba.png) · [Lotto 10](./assets/people/pedoni-lotto10-4x4frames-24x40-rgba.png) · [Lotto 11](./assets/people/pedoni-lotto11-4x4frames-24x40-rgba.png) · [Lotto 12](./assets/people/pedoni-lotto12-4x4frames-24x40-rgba.png) · [Lotto 13](./assets/people/pedoni-lotto13-4x4frames-24x40-rgba.png) · [Lotto 14](./assets/people/pedoni-lotto14-4x4frames-24x40-rgba.png) · [Lotto 17](./assets/people/pedoni-lotto17-4x4frames-24x40-rgba.png) · [Lotto 18](./assets/people/pedoni-lotto18-4x4frames-24x40-rgba.png) · [Lotto 19](./assets/people/pedoni-lotto19-4x4frames-24x40-rgba.png) · [Lotto 20](./assets/people/pedoni-lotto20-4x4frames-24x40-rgba.png) — stesso formato della prima tavola, frame adattati a zone (ragazzini dei lotti 13 e 20 più bassi; sedia a rotelle del lotto 19 con ruote animate); generatori e NOTE in `assets/people/sources/pedoni-lottoN-*` | tabella `PEDESTRIAN_SHEETS` in [extra-pedestrian-sprites.mjs](./extra-pedestrian-sprites.mjs) (kind 7–46), ramo unico in [city-art.mjs](./city-art.mjs) |
| **Personaggio professionale** | [Friggitore in camice bianco: 4 direzioni](./assets/people/friggitore-bianco-4dir-4frames-24x40.png) | [friggitore-sprites.mjs](./friggitore-sprites.mjs) |
| **Quattro mestieri — bozza NON approvata come stile** | [Vecchia tavola da correggere](./assets/people/npc-mestieri-4chars-4dir-4frames-24x40.png) | Deve essere rifatta confrontandola con la **prima tavola pedoni**, prima di essere integrata. |
| **Auto approvata** | [Fiat Panda moderna bianca — PNG](./assets/vehicles/panda-modern-white.png) e [Panda Fire rossa — PNG](./assets/vehicles/panda-fire-red.png) | [car-sprites.mjs](./car-sprites.mjs), [VEHICLE_ART_GUIDE.md](./VEHICLE_ART_GUIDE.md) |
| **Atlante auto** | [Punto / Ypsilon — colori, PNG con alpha](./assets/vehicles/punto-ypsilon-16colors-rgba.png) | [car-sprites.mjs](./car-sprites.mjs) |
| **Moto e scooter** | [16 varianti — atlante PNG](./assets/vehicles/moto-16-40x68-256.png) | [motorcycles.mjs](./motorcycles.mjs) |
| **Mezzi speciali** | [Ape Car](./assets/vehicles/ape-car-top.png) e [furgone dei fritti](./assets/vehicles/furgone-fritti-top.png) | [car-sprites.mjs](./car-sprites.mjs) |
| **Foglio da 16 veicoli** | [Ape e furgoni ambulanti, PNG 4×4](./assets/vehicles/ape-food-16-rgba.png) · [sorgente master](./assets/vehicles/sources/ape-food-16-master.png) | [car-sprites.mjs](./car-sprites.mjs) · [test](./market-vehicles.test.mjs) |

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

### REGOLA OBBLIGATORIA — reference madre per QUALSIASI personaggio

**Prima di disegnare, generare con ImageGen, trasformare, ritagliare, animare o approvare qualsiasi sprite umano** (NPC, protagonista, mestiere, antagonista, personaggio speciale, passante), **APRIRE E OSSERVARE PER PRIMO** questo file della repository:

**[REFERENCE UFFICIALE E VINCOLANTE — PRIMO SPRITESHEET DEI PERSONAGGI](./assets/people/pedoni-4x4frames-24x40-rgba.png)**

URL diretto: https://github.com/CzekUns/Effettokarmagra/blob/main/games/gta-melito/assets/people/pedoni-4x4frames-24x40-rgba.png

Il primo sheet è la **fonte di verità artistica** per silhouette, proporzioni anatomiche, dimensioni testa/torace/braccia/gambe, postura vista dall'alto 2.5D, palette, ombreggiatura, livello di dettaglio e animazioni. **Non basta leggere le istruzioni: occorre aprire visivamente il PNG originale e confrontare i nuovi sprite affiancati alla stessa scala**, anche prima di preparare un prompt ImageGen. Nel prompt e nel handoff citare espressamente il file di riferimento; ove possibile passarne anche l'immagine come input.

- **Struttura tecnica da replicare:** celle `24×40 px`; un personaggio ha quattro direzioni `up, down, left, right` e quattro frame reali per ciascuna; un foglio con quattro personaggi è `384×160 px` (16 colonne × 4 righe). Pixel art netta e PNG con trasparenza reale, stessi allineamenti/pivot.
- **Gerarchia reference:** ① **primo sheet pedoni = obbligatorio e prioritario**; ② [secondo sheet pedoni](./assets/people/pedoni-secondo-lotto-4x4frames-24x40-rgba.png) = verifica aggiuntiva; ③ friggitore vecchio e sheet mestieri = esempi storici/bozze, **mai** base grafica primaria se discordanti con il primo sheet.
- **Gate prima della consegna:** confrontare immagini alla scala effettiva del gioco, controllo di proporzioni, silhouette, palette, dettaglio, pose (4×4), animazione e trasparenza. **Se lo stile non coincide, rigenerare/ridisegnare usando la reference originale prima di caricare/integrare**. Non dichiarare un nuovo sheet approvato solo perché le dimensioni corrispondono.
- **Caso concreto da non ripetere (ottobre 2026):** friggitore, vigile, lavavetri e contrabbandiere sono stati prodotti con uno stile diverso; poi è stata fatta una bozza ripartendo dal *friggitore storico*, ma quella fonte è più schematica. Quei quattro NPC **non sono il campione stilistico approvato** e richiedono ancora la verifica/ricreazione basata sul **primo sheet pedoni**. La bozza PR #33 non prevale su questa regola.

**Se la reference originale non è accessibile, sospendere la generazione grafica di persone e recuperare il file: non sostituirla con una descrizione testuale o un altro personaggio.**

1. Creare soggetti coerenti con il quartiere: abiti credibili, variabilità di età, corporatura, professione, accessori, ma **stessa scala** e prospettiva per tutti. Non usare il volto “da ritratto frontale” in una mappa vista dall'alto.
2. **Spritesheet completo per personaggio:** quattro direzioni `up, down, left, right` e almeno **4 frame di camminata** per direzione. Una posa da fermo non deve “camminare sul posto”. Se servono altre azioni (salire, sedersi, lavorare), aggiungere stati espliciti e nuovi frame.
3. Nei frame della stessa direzione: testa/torso omogenei, scarpe e mani **dentro la cella** senza tagli, braccia/gambe alternate visibilmente; piedi allineati alla **stessa riga/pivot** per evitare saltellamenti.
4. **Riferimento attuale:** celle `24×40 px`; le tavole NPC `assets/people/pedoni-4x4frames-24x40-rgba.png` e `pedoni-secondo-lotto-4x4frames-24x40-rgba.png` usano 16 colonne × 4 righe, **4 personaggi × 4 frame** nelle colonne e **4 direzioni** nelle righe. Consultare `pedestrian-sprites.mjs` ed `extra-pedestrian-sprites.mjs` prima di aggiungere personaggi. Celle e coordinate possono evolvere: non assumere un ordine a memoria.
5. Esportare per ogni personaggio **sheet 4×4**, PNG individuali utili per revisioni e, in produzione, uno o pochi atlanti RGBA compressi; dichiarare ordine di righe/colonne in metadati o codice.
6. Associare animazione a velocità/spostamento reali, direzione di marcia e frame idle. Protagonista e NPC devono avere logica visiva separata (non duplicare casualmente il protagonista tra i passanti).
7. Il **protagonista deve essere identico anche negli interni** (banche, locali), salvo animazioni/addobbi intenzionali. Controllare porte, tetti trasparenti, urti, persone davanti e dietro edifici.
8. Veicolo a due ruote: il guidatore **sale visivamente in sella**, cambia stato dal corpo a piedi a quello seduto, non deve comparire doppio (uno a piedi + uno sopra la moto). L'eventuale casco è nello stato di guida.

### Tavola NPC a quattro identità — esempio mestieri (20 ottobre 2026)

**ATTENZIONE: tavola precedente, DA RIVEDERE prima di usarla come modello artistico. Confronto obbligatorio con la prima tavola pedoni indicata sopra.** La [tavola 384×160 in PNG RGBA](./assets/people/npc-mestieri-4chars-4dir-4frames-24x40.png) contiene **4 personaggi × 4 direzioni × 4 frame di camminata = 64 celle** da `24×40 px`. Le **16 colonne** si dividono in quattro gruppi successivi da quattro frame; le **quattro righe** sono `up`, `down`, `left`, `right`, nell'ordine già adottato dal gioco.

| Colonne (zero-based) | Identità | Dettagli identificativi |
| --- | --- | --- |
| 0–3 | Friggitore | Camice da salumiere/macellaio, cuffietta bassa bianca; non tocco da chef alto. |
| 4–7 | Vigile urbano | Uniforme blu scuro, cappello bianco/blu, distintivo. |
| 8–11 | Lavavetri ai semafori | Vestiario verde, tergivetro e secchio azzurro: gli oggetti sono inclusi nei frame. |
| 12–15 | Contrabbandiere | Abiti civili, borsello/marsupio sotto l'ascella con tracolla visibile. |

Ritagli singoli: [friggitore](./assets/people/npc-friggitore-4dir-4frames.png), [vigile](./assets/people/npc-vigile-4dir-4frames.png), [lavavetri](./assets/people/npc-lavavetri-4dir-4frames.png), [contrabbandiere](./assets/people/npc-contrabbandiere-4dir-4frames.png). Ogni ritaglio è `96×160` con 4 frame orizzontali e quattro direzioni verticali; l'atlante principale è trasparente, i frame hanno il medesimo pivot ai piedi e non perdono mani o oggetti al bordo. **Sono asset grafici predisposti, non NPC già attivi nel mondo**: un'implementazione successiva dovrà collegare loader, renderer, distribuzione sul territorio, animazione e routine contestuali senza modificare le collisioni per adattarle al disegno. Non rimuovere il vecchio friggitore già integrato prima della sostituzione verificata.


### Sheet mestieri dalla reference primaria — APPROVATO PER IL GIOCO (20 ottobre 2026)

**Asset ufficiale in uso per gli NPC di mestiere**: [`npc-mestieri-prima-reference-384x160.png`](./assets/people/npc-mestieri-prima-reference-384x160.png), derivato dal [primo foglio dei pedoni](./assets/people/pedoni-4x4frames-24x40-rgba.png). Il committente **ha approvato l'uso dei nuovi asset**, poi la [PR #34](https://github.com/CzekUns/Effettokarmagra/pull/34) è stata risolta e integrata in `main` il 20 ottobre 2026. La vecchia tavola `npc-mestieri-4chars-4dir-4frames-24x40.png` resta nell'archivio per confronto e **non è più caricata** dal renderer dei mestieri.

- **Formato master:** 384×160 px con quattro identità da 4 direzioni × 4 fotogrammi, celle 24×40, righe `up/down/left/right`.
- **Ordine personaggi:** friggitore 0–3 (camice bianco), vigile 4–7 (uniforme blu), lavavetri 8–11 (verde e tergivetro), contrabbandiere 12–15 (borsello a tracolla).
- **Ritagli individuali:** [friggitore](./assets/people/npc-prima-reference-friggitore-96x160.png), [vigile](./assets/people/npc-prima-reference-vigile-96x160.png), [lavavetri](./assets/people/npc-prima-reference-lavavetri-96x160.png), [contrabbandiere](./assets/people/npc-prima-reference-contrabbandiere-96x160.png).
- **Attivazione reale:** `profession-sprites.mjs` carica il master nuovo, richiamato da `city-art.mjs` e `game.mjs` con versioni cache aggiornate; il test `approved-profession-sprites.test.mjs` verifica struttura dei file e collegamenti. I vecchi PNG non sono stati eliminati; questo cambio riguarda solo il disegno, non le routine o collisioni.
- **QA residuo:** collaudo visivo con browser Android reale, proporzioni e direzioni in marcia/idle da verificare sul campo. L'approvazione per l'utilizzo non sostituisce automaticamente la prova di giocabilità.


## 4. VEICOLI — automobili, moto, Ape, furgoni

### Standard predefinito sheet veicoli: 16 sprite, 8 per modello

**Ogni nuovo foglio di veicoli deve normalmente contenere 16 varianti su griglia 4×4: 8 di un modello (prime 2 righe) + 8 di un secondo modello (ultime 2 righe).** Il riferimento è la struttura degli atlanti auto Punto/Ypsilon, Seicento/500, Uno/Smart. Le Panda singole già presenti sono eccezioni storiche, non un precedente per nuovi lotti da due modelli.

**Una variante non è necessariamente un colore:** si possono differenziare gli otto sprite anche per usura, merci trasportate, accessori o allestimento commerciale. Es.: questo [foglio Ape Car + furgoni ambulanti](./assets/vehicles/ape-food-16-rgba.png) contiene 8 Ape (due colori azzurro / verde bottiglia arrugginito × quattro carichi: vuoto, ferro, ortofrutta e pesce) e 8 furgoni ambulanti (zeppole e panzerotti, 'o pere e 'o musso, panini, hot dog, cornetti, pizza a portafoglio, pizzette fritte, misto). La variante pere/musso è **illustrativa ancora da rifinire** rispetto alla fotografia di riferimento.

**Procedura obbligatoria:** conservare il master completo; ritagliare davvero tutti e 16 i soggetti; non amputare retrovisori, ruote, cassoni o tende laterali; centrare nella rispettiva cella con margine e pivot costanti; creare un unico PNG compatto con alpha **effettivo in ciascuna cella**. Annotare in codice l'ordine delle 16 celle, dimensioni, scala e cache. Con tendalini aperti, preferire la comparsa **da parcheggiati**; in marcia dovranno avere una posa chiusa oppure restare esclusi dal traffico. Effettuare prove Node e screenshot alla scala della mappa, oltre all'ispezione dei PNG.



**Fonte di dettaglio vincolante:** [VEHICLE_ART_GUIDE.md](./VEHICLE_ART_GUIDE.md). Questo documento non la sostituisce.

1. Modello riconoscibile, **generazione corretta**, dimensioni coerenti con la strada: auto vere come riferimento artistico lecito. Non allungare Panda/Punto/Ypsilon o ingrandire uno scooter fino alla scala di un furgone.
2. **Veicoli: una vista ESATTAMENTE top-down** per ciascuna variante. Fronte verso **−Y del PNG**: il gioco può ruotarlo con `angle+Math.PI/2`. No isometrie.
3. Un foglio 4×4 per **due modelli**, otto varianti per ciascuno; per tutte le otto varianti dello stesso modello usare pivot, scala, orientamento e proporzioni coerenti. Dove possibile, colori di produzione verificati per anno/allestimento; altrimenti dichiarare “varianti illustrative”.
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

### Torre del serbatoio di Via Madrid — nuova grafica (20 ottobre 2026)
La [pixel art rossa/crema](./assets/buildings/serbatoio-melito-scacchi-rossi.png) (PNG RGBA 1254×1254) è stata prodotta per la torre a fungo di Via Madrid. Il **rosso** è la correzione esplicita del committente; dettagli e altezza restano interpretazioni, senza foto pubblica diretta verificata. Il vecchio **placeholder procedurale è sostituito**, non disegnato sotto il nuovo asset. Crop in `municipio-landmarks.mjs`: `x=350,y=62,width=555,height=1128`, nearest-neighbor, ancorato al basamento OSM con proiezione in alto-sinistra. Restano ombra dinamica, fade passando sotto e luce di notte. Verificare scala e occlusioni su browser/Android.
