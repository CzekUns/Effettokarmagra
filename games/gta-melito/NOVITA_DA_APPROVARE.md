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
| `calcetto` | Calcetto 5 contro 5 nel campo grande di Via delle Palme | Q32 · Q33 / in revisione | entrare nel campo di Via delle Palme, dentro le linee «E · GIOCA»; i campetti piccoli mostrano l'avviso per il campo grande | — | 9 calciatori arrivano a piedi; ROSSI/BLU e portieri con foglio pixel art 24×40, palla, HUD, touch TIRO/PASSA, ESC/ESCI; traffico visibile, bambini nascosti sul campo in partita. Grafica **PROVVISORIA, da approvare da Simone** |
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


### Lotto 9 grafica — Fiat Doblò II 2010 e Fiat Fiorino III 2008, furgoncini da lavoro (2026-10-21, Claude + CODEX-GH) — grafica PROVVISORIA, da approvare da Simone
| id | Elemento | Lavoro / PR | Dove guardare (esempio) | Ora / parametri | Cosa giudicare |
|---|---|---|---|---|---|
| `lotto9-furgoncini` | Fiat Doblò II (2010) e Fiat Fiorino III (2008): 8 livree ciascuno nel traffico e nei parcheggi (bianco, bianco con fascia, grigio, blu, rosso, giallo, verde scuro, bianco con scritta generica `EDILIZIA` / `FRUTTA`) | Lotto 9 · CODEX-GH / ramo `lotto9` | Via Roma, in mezzo alla strada (VAI A VEDERE porta lì, i furgoncini passano davanti) | giorno | sagome dall'alto (Doblò lungo con tetto piatto nervato, parabrezza ampio e porte scorrevoli; Fiorino più corto e stretto, cabina arrotondata e vano squadrato), livree e scritte generiche (nessuna ditta vera: va bene così?), misure accanto alle altre auto e al corriere (più grandi delle utilitarie, più stretti del corriere, devono restare nella corsia) e somiglianza con lo stile degli altri atlanti |

Atlante `assets/vehicles/doblo-fiorino-16-rgba.png` (208×368, 16 celle **52×92** come l'atlante di servizio del corriere) disegnato da codice da CODEX-GH (`assets/vehicles/sources/doblo-fiorino-16-genera.py`, note in `doblo-fiorino-16-NOTE.md`). Collegato nel gioco da Claude: è il primo atlante extra con una cella diversa da 40×60, quindi `car-sprites.mjs` ora accetta `cell` e `body` nella voce del modello e disegna solo il rettangolo opaco della cella alla misura `MODEL_DRAW_SIZE` (Doblò `[5.9,9.6]`, Fiorino `[5.5,8.9]`). Se Simone boccia le sagome o le scritte, il generatore si corregge e si rigenera l'atlante (aggiornando `body` se cambia il rettangolo opaco); se boccia le misure, si ritocca `MODEL_DRAW_SIZE`. Con questo lotto le auto del traffico sono 146: il passo `CAR_TRAFFIC_STRIDE` resta 7 (coprimo con 146), quindi tutte le auto continuano a uscire.


### Lotti 10–12 grafica — 12 pedoni nuovi (2026-10-21, Claude + CODEX-GH) — grafica PROVVISORIA, da approvare da Simone
| id | Elemento | Lavoro / PR | Dove guardare (esempio) | Ora / parametri | Cosa giudicare |
|---|---|---|---|---|---|
| `lotto10-12-pedoni` | Lotti 10–12: 12 pedoni nuovi fra la gente in strada — lotto 10: signora anziana con cappotto e borsa della spesa, ragazzo con felpa e zaino, donna con giacca chiara e borsa a tracolla, uomo in giacca con cravatta e valigetta; lotto 11: ragazza col telefono, uomo robusto con maglietta a righe, donna col vestito corallo, sportivo in tuta; lotto 12: nonno con coppola e bastone, nonna col vestito a fiori, ragazzo con le cuffie, ragazza con la giacca di jeans | Lotti 10–12 · CODEX-GH / ramo `lotto10` (fogli di CODEX-GH, integrati da Claude) | Via Roma, vicino alla partenza: VAI A VEDERE porta dal nuovo pedone più vicino | — | frame adattati a zone dalla tavola madre (`assets/people/pedoni-lotto10|11|12-4x4frames-24x40-rgba.png`, note in `assets/people/sources/`): vestiti, colori, capelli e accessori (coppola, bastone, cuffie, telefono, borse, zaini, valigetta); stesse pose e scala degli altri pedoni; giudicare in tutte e quattro le direzioni e se i 12 sono abbastanza diversi fra loro e dal lotto 2 |

Tre atlanti 384×160 (celle 24×40) generati da codice da CODEX-GH (`assets/people/sources/pedoni-lottoN-genera.py`, note in `pedoni-lottoN-NOTE.md`). Collegati nel gioco da Claude in un commit unico con una tabella generale dei fogli extra (`PEDESTRIAN_SHEETS` in `extra-pedestrian-sprites.mjs`, kind 11–22, totale 23): se Simone boccia un personaggio, si corregge il suo generatore e si rigenera il PNG, senza toccare il codice.


### Lotti 13–14 grafica — 8 pedoni nuovi (2026-10-21, Claude + CODEX-GH) — grafica PROVVISORIA, da approvare da Simone
| id | Elemento | Lavoro / PR | Dove guardare (esempio) | Ora / parametri | Cosa giudicare |
|---|---|---|---|---|---|
| `lotto13-14-pedoni` | Lotti 13–14: 8 pedoni nuovi fra la gente in strada — lotto 13: operaio con gilet arancione, signora con il carrello della spesa a quadri, ragazzino con felpa verde e pallone (più basso di proposito), barista con camicia bianca e grembiule nero; lotto 14: uomo estivo in canottiera e bermuda, signora elegante con cappello a falda e vestito blu, studente con giacca salvia, occhiali e cartellina, donna con velo corallo e abito lungo petrolio | Lotti 13–14 · CODEX-GH / ramo `lotto13` (fogli di CODEX-GH, integrati da Claude) | Via Roma, vicino alla partenza: VAI A VEDERE porta dal nuovo pedone più vicino | — | frame adattati a zone dalla tavola madre (`assets/people/pedoni-lotto13|14-4x4frames-24x40-rgba.png`, note in `assets/people/sources/`): vestiti, colori, carnagioni e accessori (gilet, carrello, pallone, grembiule, cappello, occhiali, cartellina, velo); stesse pose e scala degli altri pedoni; **l'altezza del ragazzino in gioco va bene?**; giudicare in tutte e quattro le direzioni (il carrello cambia lato) e se gli 8 sono abbastanza diversi fra loro e dai lotti precedenti |

Due atlanti 384×160 (celle 24×40) generati da codice da CODEX-GH (`assets/people/sources/pedoni-lotto13|14-genera.py`, note in `pedoni-lotto13|14-NOTE.md`). Collegati nel gioco da Claude con due righe nella tabella generale dei fogli extra (`PEDESTRIAN_SHEETS` in `extra-pedestrian-sprites.mjs`, kind 23–30, totale 31): se Simone boccia un personaggio, si corregge il suo generatore e si rigenera il PNG, senza toccare il codice.

### Lotto 15 — Dialoghi con volto: barra di testo in basso e riquadro del personaggio (2026-10-21, Claude + CODEX-GH) — PROVVISORIO, da approvare da Simone
| id | Elemento | Lavoro / PR | Dove guardare (esempio) | Ora / parametri | Cosa giudicare |
|---|---|---|---|---|---|
| `dialogo-volti` | Dialoghi con volto: barra scura in basso con nome in maiuscolo, testo a macchina da scrivere e pulsante AVANTI; riquadro a sinistra con il volto di chi parla (6 volti artwork cel-shaded: nonna severa, meccanico, ragazza con le cuffie, vigile urbano, barista anziano, ragazzo quindicenne) | Lotto 15 · CODEX-GH / ramo `dialogo` | PAUSA › NOVITÀ › `dialogo-volti` › **PROVA**: apre un dialogo di esempio di 6 battute (una per volto); si avanza con un tocco sulla barra, INVIO, SPAZIO o AVANTI, ESC chiude | — (PC e telefono in orizzontale) | posizione e larghezza della barra, leggibilità del testo, dimensione e stile del riquadro del volto, i sei volti (stile artwork anni 2000, coerente col gioco?), che sul telefono non copra i pulsanti touch; mentre è aperta il personaggio sta fermo ma il paese continua |

Volti in `assets/portraits/` (PNG 256×256 dai JPG 1024×1024 di CODEX-GH; prompt e note in `assets/portraits/sources/lotto15-NOTE.md`). Nessun aggancio alle missioni esistenti: se Simone approva, le battute di `campaign.mjs` passeranno da questa barra (oggi usano il riquadro centrale). Per un volto nuovo: PNG 256×256 nello stesso stile + una riga in `PORTRAITS` di `dialogue.mjs` (vedi `AGENTS.md`, «Dialoghi con volto»).

### Lotti 17–20 — 16 pedoni di CODEX-GH (21 ottobre 2026) — PROVVISORIO, da approvare da Simone

| id | Elemento | Lavoro / PR | Dove guardare | Ora / parametri | Cosa giudicare |
|---|---|---|---|---|---|
| `lotto17-20-pedoni` | Sedici personaggi nei fogli 17–20: postino, pizzaiolo, netturbino, prete; turista, ragazzo con skateboard, donna in tailleur, anziano col giornale; mamma col bambino, ragazza col cane, uomo in sedia a rotelle, delivery; nonna con scopa, scolaro, uomo in tuta col telefono, donna col carrello | Lotti 17–20 · CODEX-GH / ramo `lotto17`, PR da aprire da Claude | Via Roma: PAUSA › NOVITÀ › VAI A VEDERE cerca il pedone dei kind 31–46 più vicino | giorno | Stile e leggibilità dei 16 soggetti; in particolare bambino e cane nella cella 24×40, sedia a rotelle con ruote animate, scolaro più basso; pose nelle quattro direzioni e scala accanto agli altri passanti. Grafica **PROVVISORIA, da approvare da Simone**. |

### Schermate di caricamento a rotazione — artwork di Melito (21 ottobre 2026, CODEX-GH) — PROVVISORIO, da approvare da Simone

| id | Elemento | Lavoro / PR | Dove guardare | Ora / parametri | Cosa giudicare |
|---|---|---|---|---|---|
| `caricamento-artwork` | Sei artwork (mercato, campetto, villa comunale, Via Roma con pizzeria, mercato all’alba, festa patronale) più il render del gioco, alternati all’avvio | Caricamento · CODEX-GH / ramo `caricamento`, PR a cura di Claude | PAUSA › NOVITÀ › `caricamento-artwork` › PROVA; riaprire il gioco per vedere la rotazione | PC 1280×720; telefono orizzontale 844×390 | Coerenza con Melito, varietà delle scene, leggibilità di titolo e barra in basso; le artwork sono **PROVVISORIE, da approvare da Simone**. |

I file sono in `assets/ui/loading-art-*`; la scena del Municipio è esclusa perché la torre raffigurata non è corretta. `loading-screens.mjs` conserva l’ultimo id nel browser e seleziona un’altra scena all’avvio successivo. `loading` resta HTML; la fascia scura è CSS.

### Varianti di colore dei pedoni (21 ottobre 2026, CODEX-GH) — PROVVISORIO, da approvare da Simone

| id | Elemento | Lavoro / PR | Dove guardare | Ora / parametri | Cosa giudicare |
|---|---|---|---|---|---|
| `varianti-pedoni` | Due varianti di abiti e capelli per 11 fogli di pedoni già presenti; 88 kind nuovi, 47–134 | Varianti pedoni · CODEX-GH / ramo `varianti`, PR a cura di Claude | PAUSA › NOVITÀ › `varianti-pedoni` › VAI A VEDERE cerca il nuovo pedone più vicino su Via Roma | giorno, scala normale e screenshot 3× | Colori distinguibili, coerenza con la pixel art, leggibilità in camminata e carnagioni lasciate come nell'originale. **PROVVISORIO, da approvare da Simone**. |

I 22 PNG stanno in `assets/people/`; il generatore unico è `assets/people/sources/varianti-genera.py`. Peso dei nuovi PNG: 765.427 byte, sotto 1 MB. I kind precedenti 0–46 restano invariati; il gioco legge già `PEDESTRIAN_KIND_COUNT` per passanti, residenti e clienti.

### Vita di quartiere — persone ferme (21 ottobre 2026, CODEX-GH) — PROVVISORIO, da approvare da Simone

| id | Elemento | Lavoro / PR | Dove guardare | Ora / parametri | Cosa giudicare |
|---|---|---|---|---|---|
| `vita-di-quartiere` | Gruppi di 2–3 davanti ai locali, alle chiese e al mercato; panchine occupate; due anziani al Municipio | Vita di quartiere · CODEX-GH / ramo `quartiere`, PR a cura di Claude | PAUSA › NOVITÀ › `vita-di-quartiere` › VAI A VEDERE, gruppetto più vicino | 11:00, più presenze 10–13 e 17–21 | Densità, naturalezza delle pose e dei cambi di sguardo, assenza di ostacoli su strada e ingressi. **PROVVISORIO, da approvare da Simone**. |

`npc-idle.mjs` prende gli ancoraggi dai dati OSM caricati e dalle panchine/banchi già costruiti dal gioco. Non sono stati trovati un circolo localizzabile o tavolini all'aperto; non sono stati inventati. Le figure non entrano nelle collisioni e usano gli sprite già approvati o provvisori.

### Pose ferme per vita di quartiere (21 ottobre 2026, CODEX-GH) — PROVVISORIO, da approvare da Simone

| Voce | Cosa guardare | Lavoro | Dove | Quando | Stato |
|---|---|---|---|---|---|
| `pose-fermi` | Seduti sulle panchine, gesto alternato nei gruppetti, alcuni appoggiati ai bar | Pose ferme · CODEX-GH / ramo `pose`, PR a cura di Claude | PAUSA › NOVITÀ › `pose-fermi` › VAI A VEDERE | 11:00 | 34 fogli derivati, 227 KB totali; **PROVVISORIO, da approvare da Simone**. |

### Giochi di strada (21 ottobre 2026, CODEX-GH) — PROVVISORIO, da approvare da Simone

| Voce | Cosa guardare | Lavoro | Dove | Quando | Stato |
|---|---|---|---|---|---|
| `giochi-di-strada` | Bambini che si passano il pallone e anziani seduti a carte | Giochi di strada · CODEX-GH / ramo `giochi-strada`, PR a cura di Claude | PAUSA › NOVITÀ › `giochi-di-strada` › VAI A VEDERE | 17:30; bambini 16–20 scuola / 10–20 weekend, carte 9–12 e 16–19 | Posizioni e leggibilità da giudicare; **PROVVISORIO, da approvare da Simone**. |

### Animali di strada (21 ottobre 2026, CODEX-GH) — PROVVISORIO, da approvare da Simone

| Voce | Cosa guardare | Lavoro | Dove | Quando | Stato |
|---|---|---|---|---|---|
| `animali-di-strada` | Piccioni nelle piazze che si alzano in volo; gatti presso muretti e auto in sosta | Animali di strada · CODEX-GH / ramo `animali`, PR a cura di Claude | PAUSA › NOVITÀ › `animali-di-strada` › VAI A VEDERE | Sempre | Sprite e densità da giudicare; **PROVVISORIO, da approvare da Simone**. |
