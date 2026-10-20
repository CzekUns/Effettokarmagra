# Recinti di Melito: mura, cancelli e guardiole (BF12)

**Segnalazione del committente, 20/10/2026, testuale:** «sembra che le "mura private" non sono contemplate: esempio 1 la villa comunale, esempio 2 il complesso municipio/carabinieri/piscina comunale diroccata, esempio 3 il parco GB che si trova se non erro proprio di fronte all'area mercatale, sono strutture private con cancelli o guardiola. poi c'è la galleria atlante che non sono riuscito a vedere, ma è un palazzo di vetro, è nei pressi di uno dei due uffici postali, c'è il parco prima casa che si trova sotto il ponte della superstrada per una parte, anch'esso con mura e guardiola».

**Dati:** [`data/enclosures.json`](./data/enclosures.json). **Codice:** [`enclosures.mjs`](./enclosures.mjs). Coordinate di gioco con la stessa proiezione di `data/melito-map.json`.

## Fonti (consultate il 20/10/2026)
- **OpenStreetMap** (© OpenStreetMap contributors, ODbL). Estratto dall'API OSM 0.6 sul riquadro del comune, perché Overpass non rispondeva dal server.
  - Il gioco usa solo gli identificativi e le geometrie citati qui sotto.
  - In OSM i recinti sono pochi: 16 muri (`barrier=wall`) in tutta l'area e un solo perimetro completo, quello della villa comunale.
- **Foto aerea Esri World Imagery,** usata come riferimento visivo per ricalcare a vista perimetri, accessi e guardiole.
  - Le coordinate sono stime (`verificato:false`). Nessuna immagine è inclusa nel repository.
  - Dove gli alberi coprono le mura si segue il bordo dell'isolato.
- **Ricerca web pubblica:** solo annunci immobiliari ed elenchi.
  - Nessun sito istituzionale descrive questi recinti.
  - Per il «Parco GB» gli annunci indicano Corso Europa 374 con accesso da Via Madonnelle.
  - Per il «Parco Atlante» gli annunci indicano un complesso residenziale su Corso Europa.

## I luoghi

| Recinto | Stato nel gioco | Perimetro | Accessi | Fonte e affidabilità |
|---|---|---|---|---|
| **Villa comunale** | mura con ringhiera, cancelli pedonali | OSM way 567826231 (`barrier=wall`, `leisure=park`) | cancelli OSM 5464543102 (nord) e 5464543101 (est), più le aperture dove i vialetti OSM attraversano il perimetro | **verificato** con OSM; foto aerea coerente (area verde con vialetti) |
| **Complesso Municipio – Carabinieri – piscina comunale** | muro, 2 cancelli carrabili con sbarra, guardiola; torre del serbatoio a scacchi e rudere della piscina (vedi sotto) | ricalco a vista dell'isolato tra Via Madrid, Via Budapest, Via Salvatore Di Giacomo e la strada di servizio del Municipio | i due innesti della strada di servizio su Via Salvatore Di Giacomo | **stima**. In OSM ci sono solo il nodo «Municipio di Melito di Napoli» (5515667279) e l'edificio 733703600. Sulla foto aerea si vedono un edificio tondo con cupola (probabile piscina), un grande edificio a tetto piatto e un lotto demolito. Le funzioni dei singoli edifici, compresa la caserma dei Carabinieri, non sono verificate. |
| **Recinto di fronte all'area mercatale** (forse il «Parco GB») | muro, cancello carrabile con sbarra, guardiola | ricalco a vista dell'isolato a sud di Via Ginevra, tra il campo incolto a ovest, Via Berlino e Via Oslo. Il lato nord corre lungo il muro OSM 404895514. | cancello stimato sul viale interno che parte da Via Ginevra (1170, 993) | **stima**. Il varco tra i muri OSM 404895514 e 574674017 è l'imbocco di Via Berlino, una strada pubblica, non un cancello. Il nome «Parco GB» non è confermato: gli annunci lo collocano in Corso Europa 374, a circa 440 m. |
| **Parco Prima Casa** | **non disegnato** | — | — | Non trovato né in OSM né nelle fonti web. Serve una via o un punto sulla mappa. |
| **Galleria Atlante** (palazzo di vetro) | facciate in vetro e atrio vetrato sul tetto | edificio OSM 794814541 (`building=commercial`), poligono invariato | — | **probabile**: è accanto al «Parco Atlante» (OSM 794814538) e all'«Ufficio Postale Melito 2» (OSM 7434108725). Sulla foto aerea si vedono l'atrio centrale vetrato a V e le torrette tonde. |

## Complesso del Municipio: serbatoio a scacchi, piscina interrata, caserma (aggiornamento del 20/10/2026)
Richiesta del committente, testuale: «vedi su internet il complesso del municipio/piscina/carabinieri e capisci. la piscina abbandonata è interrata e ospita anche l'acquedotto/serbatoio che è diciamo una torre un po' simbolo, fatta a scacchi».

- **Torre del serbatoio idrico (landmark).**
  - Dalla foto aerea Esri World Imagery si vede bene la vasca **a fungo**, con la copertura a spicchi (circa 27 m di diametro), e il fusto al centro dell'edificio tondo OSM 733703519, affacciato su Via Madrid. Il fusto parte da circa (1313, 825) in coordinate di gioco.
  - In OSM non è mappata e la ricerca web non ha trovato foto consultabili. Il sito di Melitonline blocca il download delle immagini.
  - La scacchiera **rosso/bianca** e l'altezza (40 unità di gioco) sono **stime**, da confermare.
  - Nel gioco: fusto e vasca a scacchi, cappello a spicchi, ombra lunga, trasparenza quando il giocatore passa sotto o accanto, luce rossa notturna (dettaglio artistico).
- **Ex piscina comunale di via Madrid (rudere, interrata).**
  - Melitonline (23/02/2025) riporta che la bonifica del rudere si è conclusa: lavori dal 16/09/2024 al 15/01/2025, con rifiuti e amianto rimossi, e che la struttura non è mai stata usata come impianto sportivo.
  - Nel gioco l'edificio tondo è un rudere: muri bassi spezzati e copertura in parte crollata sopra la vasca vuota interrata.
  - La vasca è disegnata come stima, perché sulla foto aerea l'edificio è coperto da un tetto piano scuro. Ha bordi, parete in ombra, piastrelle sbiadite e crepate, erbacce e una scaletta arrugginita; con la pioggia compaiono pozzanghere (Q08).
  - Resta il poligono OSM, quindi è un ostacolo e nessuno ci cade dentro.
- **Caserma dei Carabinieri.** Elenchi pubblici (reteimprese, virgilio) danno la Tenenza in Via Salvatore Di Giacomo 38. L'edificio però non è identificato con certezza, quindi nel gioco **non c'è nessuna insegna «CARABINIERI»**. Gli accessi del complesso restano i due varchi con sbarra su Via Salvatore Di Giacomo.

## Regole nel gioco
- **Posizione delle mura.** Seguono la linea OSM o quella ricalcata. Nel gioco però strade e marciapiedi sono disegnati più larghi del vero, quindi le mura stanno sempre **oltre il marciapiede disegnato**: metà larghezza visuale della strada + `SIDEWALK_OUTER` + 1. I poligoni OSM degli edifici non vengono toccati.
- **Nessuna strada chiusa.** Ogni strada, vialetto o servizio che attraversa un perimetro ha un'apertura:
  - per i veicoli, la carreggiata più i due marciapiedi;
  - per i vialetti, il vialetto più un margine.

  Il muro si interrompe anche dove una corsia pedonale gli corre accanto vicino al cancello.
- **Cancelli.**
  - I pedoni passano sempre.
  - Nei recinti privati i varchi carrabili hanno una sbarra: alzata di giorno; abbassata **di notte (22–6)** per il giocatore; si alza per i mezzi NPC dei residenti quando uno è entro 11 m.
  - La villa comunale ha solo cancelli pedonali.
- **Guardiole.** Una guardiola placeholder accanto al cancello principale dei recinti privati, con una guardia ferma (sprite «vigile», placeholder).
- **Collisioni.**
  - Le mura fermano pedoni (tramite `validWalk`), veicoli e spinte degli urti.
  - Un veicolo che tocca un muro può sempre staccarsene, come in BF01: è vietato solo andare più a fondo.
  - Le mura si ricalcolano anche al confronto delle larghezze stradali.
- **Limiti.**
  - Le porte dei residenti (Q03) che stanno dentro un recinto non generano residenti, perché il percorso fino al marciapiede passerebbe dal muro.
  - Il gioco non ha ancora i ponti, quindi la superstrada resta al suolo.

## Cosa serve per completare
1. **Parco Prima Casa:** una via, un civico o un punto sulla mappa.
2. **Parco GB:** conferma di nome e posizione, perché gli annunci e la segnalazione non coincidono.
3. **Complesso Municipio:** colori veri della torre a scacchi, quale edificio è la caserma dei Carabinieri, dove sta la guardiola reale e se il lato sud ha un muro.
