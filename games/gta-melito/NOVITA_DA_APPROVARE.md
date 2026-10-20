# GTA Melito — NOVITÀ grafiche PROVVISORIE da approvare

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
| `mercato` | Mercato: banchi placeholder, ombrelloni, venditori | Q42 / #52 | rione 219, centro (1168, 948) | `?mercato=1&ora=10:30` | banchi provvisori dei 14 tipi, ombrelloni, venditori e clienti |
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
| `gare` | Gare clandestine arcade (finzione): partenza, anelli, frecce, avversari | Q34 / in revisione | partenza GARA 1 su Via Colonne di Giugliano, circa (345, 445); GARA 2 su Via Signorelli, circa (8, 927) | in auto, «E · GARA» | bandiera e cerchio, anelli gialli, frecce, sprite avversari, cronometro in alto |
