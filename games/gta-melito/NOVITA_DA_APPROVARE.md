# GTA Melito — NOVITÀ grafiche PROVVISORIE da approvare

**Stato aggiornato 20 ottobre 2026:** il committente ha **approvato l'uso dei nuovi asset nel gioco**, compresi gli sprite dei quattro mestieri realizzati sulla prima reference pedoni, integrati con la PR #34. La sezione NOVITÀ resta disponibile per segnalare rifiniture grafiche e collaudi successivi; la precedente dicitura «DA APPROVARE» non blocca più l'uso degli asset già importati. L'approvazione d'uso non equivale a convalida delle funzioni non provate su Android.

**Per il merger e per il committente.** Questi elementi grafici e visivi sono stati aggiunti da Claude (account GitHub `ilconsulentelogistico-hue`) e sono **PROVVISORI**: li approva o li boccia il committente (Simone). La grafica definitiva può rifarla il proprietario, nello stile originale (`PIXEL_ART_MODUS.md`, `VEHICLE_ART_GUIDE.md`).

**Nel gioco:** menu PAUSA › **NOVITÀ · DA APPROVARE** (BF15).
- **VAI A VEDERE:** porta il giocatore a piedi davanti a un esempio vero, con l'ora, il meteo o il mercato giusti. **TORNA DOVE ERI** riporta posto, mezzo, ora e foto aerea com'erano.
- **MI PIACE / DA RIFARE:** il giudizio resta solo nel browser. **COPIA GIUDIZI** lo prepara come testo da incollare nella chat o in una issue.

**Regola:** ogni nuovo elemento grafico provvisorio va aggiunto **qui** e in `novita.mjs`, così lo si può trovare e giudicare (vedi `AGENTS.md`).

**Coordinate:** sono unità di gioco sulla mappa reale. Partenza in Via Roma, circa (1179, 1303); VAI A VEDERE sceglie l'esempio più vicino alla partenza. Per vedere a mano si possono usare i parametri dell'URL: `?ora=HH:MM`, `?meteo=pioggia`, `?mercato=1`, `?satellite=50`.

| id | Elemento | Lavoro / PR | Dove guardare (esempio) | Ora / parametri | Cosa giudicare |
|---|---|---|---|---|---|
| `semafori` | Semafori di gioco, alone notturno e linee d'arresto | BF07 / #48 | incrocio con semaforo più vicino alla partenza, circa (784, 1522) | `?ora=21:30` | palo e lanterna, alone di notte, linea d'arresto; sono semafori simulati, non quelli reali |
| `frecce` | Frecce delle auto NPC prima di svoltare | BF07 / #48 | stesso incrocio | giorno | lampeggio dal lato giusto negli ultimi 30 m |
| `lavavetri` | Lavavetri ai semafori, con il tergivetro | BF08 / #48 | accanto al semaforo, circa (778, 1538) | giorno, col rosso | si avvicina dal lato guida e passa il tergivetro disegnato sul vetro |
| `varchi` | Varchi di confine: taglio dritto e imbocco a trapezio | BF09 / #48 | varco più vicino, circa (1955, 1042) | — | la strada finisce nel buio con l'imbocco sfumato; le auto entrano e spariscono |
| `baie` | Fascia di sosta con le linee bianche | BF02 / #41 | Via Roma, circa (1193, 1308) | — | linee degli stalli: mai in carreggiata |
| `recinti` | Mura e recinzioni, cancelli pedonali | BF12 / #50 | villa comunale, cancello circa (1341, 1221) | — | muretto con ringhiera, cancelli |
| `guardiole` | Cancelli carrabili con sbarra, guardiola e guardia | BF12 / #50 | cancello con sbarra più vicino, circa (1170, 993) | di notte (22–6) la sbarra resta giù | sbarra, guardiola e guardia (segnaposto) |
| `atlante` | Galleria Atlante in vetro | BF12 / #50 | edificio accanto all'Ufficio Postale Melito 2, circa (1294, 2158) | — | facciate e atrio a vetrate azzurre (identificazione probabile) |
| `torre` | Torre del serbatoio a scacchi | BF12 / #50 | complesso del Municipio, Via Madrid, circa (1314, 825) | `?ora=12:00` | fusto e vasca a scacchi (colori stimati), ombra; trasparenza quando ci passi sotto |
| `piscina` | Piscina comunale interrata in rovina | BF12 / #50 | sotto la torre, circa (1316, 829) | `?meteo=pioggia` per le pozzanghere | vasca vuota e crepata, scaletta, erbacce, muri spezzati |
| `mercato` | Mercato: banchi dei 14 tipi (dal lotto 3 con gli sprite visti dall'alto), ombrelloni, venditori | Q42 / #52 | rione 219, centro (1168, 948) | `?mercato=1&ora=10:30` | banchi dei 14 tipi, ombrelloni, venditori e clienti |
| `ombrelloni` | Ombrelloni che diventano trasparenti | Q42 / #52 | un banco del mercato, circa (1175, 947) | `?mercato=1&ora=10:30` | passandoci sotto sfumano come i tetti |
| `posteggi` | Posteggi gialli numerati del mercato | Q42 / #52 | (1168, 948) | `?ora=16:00` | stalli gialli fuori orario |
| `ape` | Ape Car: 16 varianti d'epoca | Q16 / #55 | Ape più vicina alla partenza, circa (1262, 1188) | — | 8 tinte e 8 «vissute»; tinte interpretate, non codici Piaggio |
| `ambulante` | Banco dell'ambulante: pannello AMBULANTE · MELITO | Q17 / #56 | friggitore più vicino, circa (1347, 1176) | — | prompt «E · COMPRA …» e pannello con il menù di fantasia |
| `satellite` | Foto aerea Esri come sovramappa di confronto | BF13 / #49 | Piazza Santo Stefano, circa (1093, 1121) | `?satellite=50` | allineamento e leggibilità della foto al 50% |
| `corsie` | Corsie fuori dagli edifici nelle vie strette | Q15 / #57 | Via Francesco Rossi, circa (1075, 1087) | — | le auto NPC non passano più sotto la sagoma della chiesa |
| `pulsante` | Pulsante azione attenuato sul telefono | Q15 / #57 | sul telefono, a piedi lontano da tutto | — | il pulsante è spento invece di dire «ENTRA IN AUTO» |
| `calcetto` | Campetti e partita di calcetto 5 contro 5 | Q32 · Q33 / in revisione | cancello del campetto più vicino alla partenza (Corso Europa, circa (1010, 1878); l'altro è in Via delle Palme, circa (535, 1181)), poi «E · GIOCA A CALCETTO» | — | erba, porte, rete, recinzione e fari del campetto; nella partita: campo, calciatori 7×9 pixel con maglie a due colori (ROSSI/BLU, portieri giallo/verde), freccia gialla del giocatore attivo, levetta e pulsanti TIRO/PASSA/CAMBIO |
| `scala` | Veicoli e persone più piccoli, parcheggi fuori dalle corsie | BF14 / in arrivo | si attiva quando c'è | — | proporzioni rispetto alle strade e agli stalli |
| `transenne` | Transenne del mercato | Q42 R06 / non ancora | — | — | non ancora nel gioco |
| `corriere` | Furgone del corriere | Q18 / in arrivo | si attiva quando c'è | — | cabina e vano, livrea inventata |
| `nettezza` | Camion della nettezza urbana | Q18 / in arrivo | si attiva quando c'è | — | compattatore, livrea inventata |
| `passeggeri` | Passeggeri su auto e scooter | Q21 / in arrivo | si attiva quando c'è | — | passeggeri visibili in marcia, «E · DAI UN PASSAGGIO» |

### Aggiunta Q39–Q41 (2026-10-20, Claude) — non ancora in `novita.mjs`
| id | Elemento | Lavoro / PR | Dove guardare (esempio) | Ora / parametri | Cosa giudicare |
|---|---|---|---|---|---|
| `rider` | App RIDER: pannello, riga HUD gialla, frecce gialle sull'asfalto, linea sulla minimappa, cubo giallo sul mezzo | Q39–Q41 / ramo `q39` | sali sullo scooter vicino alla partenza, premi `J` (o PAUSA › 🛵 RIDER) e accetta un'offerta | — | leggibilità di cubo, frecce e freccia attorno al giocatore a zoom scooter; pannello su telefono |
| `lotto2-pedoni` | Lotto 2: quattro nuovi pedoni (signora anziana con la borsa, ragazzo con lo zaino, uomo in giacca da lavoro, ragazza col cappotto rosso) | Lotto 2 grafica / in revisione (foglio di CODEX-GH, integrato da Claude) | Via Roma, vicino alla partenza, circa (1179, 1303): VAI A VEDERE porta dal nuovo pedone più vicino | — | frame adattati a zone dalla tavola madre (`assets/people/pedoni-lotto2-4x4frames-24x40-rgba.png`, anteprima 3× in `assets/people/sources/`): vestiti, colori, capelli e accessori; stesse pose e scala degli altri pedoni; giudicare in tutte e quattro le direzioni |
| `lotto3-banchi` | Lotto 3: banchi del mercato visti dall'alto (14 tipi) al posto dei segnaposto | Lotto 3 grafica / in revisione (foglio di CODEX-GH, integrato da Claude) | mercato del rione 219, centro (1168, 948): VAI A VEDERE porta davanti a un banco | `?mercato=1&ora=10:30` | piano di ogni banco con la merce del suo tipo (`assets/market/mercato-banchi-14-teli-4-rgba.png`, anteprima 4× in `assets/market/sources/`), orlo di legno e ombra verso i clienti, lettura a scala strada, direzione dei banchi nelle sei file, dissolvenza durante il montaggio (6:30–7:30); i 4 teli T1–T4 del foglio non sono usati; ombrelloni, venditori e clienti invariati |
| `gare` | Gare clandestine arcade (finzione): partenza, anelli, frecce, avversari | Q34 / in revisione | partenza GARA 1 su Via Colonne di Giugliano, circa (345, 445); GARA 2 su Via Signorelli, circa (8, 927) | in auto, «E · GARA» | bandiera e cerchio, anelli gialli, frecce, sprite avversari, cronometro in alto |

### Torre del serbatoio a scacchi rossi (20 ottobre 2026)
Al Municipio in Via Madrid (circa x=1314, y=825), PAUSA › NOVITÀ › TORRE: il PNG rosso/crema sostituisce integralmente il precedente rendering procedurale. Giudicare posizione, scala e trasparenza al passaggio; nessuna nuova geometria è stata aggiunta. I colori rossi sono stati richiesti dall'utente; i dettagli sono artistici.

### Lotto 1 grafica — Fiat Grande Punto e Lancia Ypsilon III (2026-10-21, Claude + CODEX-GH) — grafica PROVVISORIA, da approvare da Simone
| id | Elemento | Lavoro / PR | Dove guardare (esempio) | Ora / parametri | Cosa giudicare |
|---|---|---|---|---|---|
| `lotto1-auto` | Fiat Grande Punto (2005) e Lancia Ypsilon III (2011): 8 tinte ciascuna nel traffico e nei parcheggi | Lotto 1 · CODEX-GH / ramo `lotto1` | Via Roma, in mezzo alla strada (VAI A VEDERE porta lì, le auto passano davanti) | giorno | sagome dall'alto (musetto arrotondato e fari a goccia della Grande Punto; fianchi stretti e lunotto piccolo della Ypsilon), tinte e somiglianza con lo stile degli altri atlanti; tinte interpretate, non codici vernice |

Atlante `assets/vehicles/grande-punto-ypsilon3-16-rgba.png` (160×240, 16 celle 40×60) disegnato da codice da CODEX-GH (`assets/vehicles/sources/grande-punto-ypsilon3-16-genera.py`, anteprima `grande-punto-ypsilon3-16-sheet.png`). Collegato nel gioco da Claude; se Simone boccia le sagome, il generatore si corregge e si rigenera l'atlante.

### Lotto 4 grafica — sfondo della schermata di caricamento (2026-10-21, Claude + CODEX-GH) — grafica PROVVISORIA, da approvare da Simone — non in `novita.mjs` (si vede ricaricando la pagina, non serve VAI A VEDERE)
| id | Elemento | Lavoro / PR | Dove guardare (esempio) | Ora / parametri | Cosa giudicare |
|---|---|---|---|---|---|
| `lotto4-caricamento` | Schermata di caricamento «CARICO MELITO…» con lo sfondo di un render del gioco (Via Roma alle 19:10, post-prodotto: vignetta e fascia scura in basso) al posto del fondo verde uniforme | Lotto 4 grafica / ramo `lotto4` (render e post-produzione di CODEX-GH, collegato da Claude) | si vede ricaricando la pagina, sia su PC sia sul telefono (orizzontale usa l'immagine 844×390) | — | leggibilità di titolo, testo e barra sulla fascia scura; scena riconoscibile e pixel netti; sul telefono il taglio dell'immagine; se bocciato basta ripristinare il fondo uniforme nel CSS di `.loading` |

Immagini `assets/ui/loading-1280x720.png` e `assets/ui/loading-844x390.png` (PNG RGB, sotto 400 KB), NOTE di CODEX-GH in `assets/ui/sources/loading-NOTE.md`. La barra di caricamento è decorativa (solo CSS), non misura un avanzamento vero.


### Lotto 5 grafica — Fiat Tipo 2016 e Fiat 500L 2012 (2026-10-21, Claude + CODEX-GH) — grafica PROVVISORIA, da approvare da Simone
| id | Elemento | Lavoro / PR | Dove guardare (esempio) | Ora / parametri | Cosa giudicare |
|---|---|---|---|---|---|
| `lotto5-auto` | Fiat Tipo hatchback (2016) e Fiat 500L (2012): 8 tinte ciascuna nel traffico e nei parcheggi | Lotto 5 · CODEX-GH / ramo `lotto5` | Via Roma, in mezzo alla strada (VAI A VEDERE porta lì, le auto passano davanti) | giorno | sagome dall'alto (Tipo più lunga e bassa, cofano esteso, fanali posteriori orizzontali; 500L corta e tozza, tetto lungo, vetri grandi, fari tondi), tinte, misure accanto alle altre auto (Tipo un po' più lunga, 500L un po' più larga della Punto) e somiglianza con lo stile degli altri atlanti; tinte interpretate, non codici vernice |

Atlante `assets/vehicles/tipo-500l-16-rgba.png` (160×240, 16 celle 40×60) disegnato da codice da CODEX-GH (`assets/vehicles/sources/tipo-500l-16-genera.py`, note con le fonti delle tinte in `tipo-500l-16-NOTE.md`). Collegato nel gioco da Claude; se Simone boccia le sagome, il generatore si corregge e si rigenera l'atlante; se boccia le misure, si ritocca `MODEL_DRAW_SIZE` in `car-sprites.mjs`.


### Lotto 6 grafica — Renault Clio IV 2012 e Volkswagen Golf VII 2012 (2026-10-21, Claude + CODEX-GH) — grafica PROVVISORIA, da approvare da Simone
| id | Elemento | Lavoro / PR | Dove guardare (esempio) | Ora / parametri | Cosa giudicare |
|---|---|---|---|---|---|
| `lotto6-auto` | Renault Clio IV (2012) e Volkswagen Golf VII (2012): 8 tinte ciascuna nel traffico e nei parcheggi | Lotto 6 · CODEX-GH / ramo `lotto6` | Via Roma, in mezzo alla strada (VAI A VEDERE porta lì, le auto passano davanti) | giorno | sagome dall'alto (Clio corta e arrotondata, muso curvo, fari a goccia; Golf più lunga, larga e squadrata, tetto piatto, fari stretti), tinte, misure accanto alle altre auto (Clio poco più lunga della Punto 188, Golf la più grande delle compatte) e somiglianza con lo stile degli altri atlanti; tinte interpretate, non codici vernice |

Atlante `assets/vehicles/clio4-golf7-16-rgba.png` (160×240, 16 celle 40×60) disegnato da codice da CODEX-GH (`assets/vehicles/sources/clio4-golf7-16-genera.py`, note con le fonti delle tinte in `clio4-golf7-16-NOTE.md`). Collegato nel gioco da Claude; se Simone boccia le sagome, il generatore si corregge e si rigenera l'atlante; se boccia le misure, si ritocca `MODEL_DRAW_SIZE` in `car-sprites.mjs`. Con questo lotto le auto del traffico sono 98: il passo con cui il traffico sceglie i modelli non è più il 7 fisso (7 divide 98: sarebbero uscite solo 14 auto su 98) ma un passo coprimo con il numero di auto (`CAR_TRAFFIC_STRIDE`, oggi 9): cambia quindi l'ordine in cui si vedono le auto, non quali.


### Lotti 7 e 8 grafica — Opel Corsa E 2014, Peugeot 208 2012, Nissan Qashqai J11 2013 e Dacia Duster 2010 (2026-10-21, Claude + CODEX-GH) — grafica PROVVISORIA, da approvare da Simone
| id | Elemento | Lavoro / PR | Dove guardare (esempio) | Ora / parametri | Cosa giudicare |
|---|---|---|---|---|---|
| `lotto7-auto` | Opel Corsa E (2014) e Peugeot 208 prima serie (2012): 8 tinte ciascuna nel traffico e nei parcheggi | Lotto 7 · CODEX-GH / ramo `lotto7` | Via Roma, in mezzo alla strada (VAI A VEDERE porta lì, le auto passano davanti) | giorno | sagome dall'alto (Corsa con coda alta, tetto lungo e fari a freccia; 208 con fari allungati e tetto che si restringe verso la coda), tinte, misure accanto alle altre auto (entrambe della taglia della Punto 188) e somiglianza con lo stile degli altri atlanti; tinte interpretate, non codici vernice (alcune tinte 208 sono del 2015) |
| `lotto8-auto` | Nissan Qashqai J11 (2013) e Dacia Duster prima serie (2010): 8 tinte ciascuna nel traffico e nei parcheggi | Lotto 8 · CODEX-GH / ramo `lotto7` (lotto unico con il 7) | Via Roma, in mezzo alla strada (VAI A VEDERE porta lì, le auto passano davanti) | giorno | sagome dall'alto (Qashqai con muso a V, spalle e lunotto rastremati; Duster squadrata, coda verticale, paraurti scuri, passaruota marcati; entrambe con barre sul tetto), tinte (il verde scuro Duster è una scelta artistica), misure accanto alle altre auto (un po' più grandi delle utilitarie, devono restare nella corsia) e somiglianza con lo stile degli altri atlanti |

Atlanti `assets/vehicles/corsa-e-208-16-rgba.png` e `assets/vehicles/qashqai-duster-16-rgba.png` (160×240, 16 celle 40×60 ciascuno) disegnati da codice da CODEX-GH (`assets/vehicles/sources/corsa-e-208-16-genera.py` e `qashqai-duster-16-genera.py`, note con le fonti delle tinte in `corsa-e-208-16-NOTE.md` e `qashqai-duster-16-NOTE.md`). Collegati nel gioco da Claude in un commit unico; se Simone boccia le sagome, il generatore si corregge e si rigenera l'atlante; se boccia le misure, si ritocca `MODEL_DRAW_SIZE` in `car-sprites.mjs`. Con questi lotti le auto del traffico sono 130: il passo `CAR_TRAFFIC_STRIDE` si ricalcola da solo e torna 7 (coprimo con 130), quindi tutte le auto continuano a uscire.
