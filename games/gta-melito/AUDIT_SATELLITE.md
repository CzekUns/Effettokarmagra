# Audit con foto aerea — dove mancano dettagli (20 ottobre 2026)

**Richiesta del committente (20/10/2026):** «prova a usare sempre esri world imagery per vedere dove servono dettagli, come overmappa di rendering».

Il foglio [audit-satellite.csv](./audit-satellite.csv) ha **50 segnalazioni**, una per riga. È pensato per decidere i prossimi lavori.

| Colonna | Contenuto |
|---|---|
| `id` | identificativo |
| `zona_strada` | zona o strada |
| `x`, `y` | coordinate di gioco, in metri |
| `categoria` | tipo di problema |
| `cosa_si_vede_in_foto` | cosa mostra la foto aerea |
| `cosa_ce_nel_gioco` | cosa c'è oggi nel gioco |
| `priorita` | P0, P1, P2 |
| `lavoro_suggerito` | Q o BF suggerita |
| `note` | osservazioni |

## Riferimento visivo e licenza
- **Immagini:** Esri, Maxar, Earthstar Geographics e la comunità GIS — *Esri World Imagery*. Tile `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}`.
- Nel repository **non c'è nessuna immagine satellitare**, solo coordinate e descrizioni ricavate guardando le foto. Tutto è una **stima da foto aerea, non verificata sul posto**.
- I dati «ufficiali» vanno aggiunti a OpenStreetMap con un account OSM e poi importati nel gioco (ODbL). La foto non sostituisce OSM.
- Nel gioco la stessa foto si può accendere come **sovramappa di confronto**: PAUSA › STRUMENTI › «SATELLITE», con opacità al 25, 50, 75 o 100%. Per le prove c'è `?satellite=50`. Si scarica solo quando è accesa, si vede solo in quella zona e riparte sempre spenta.

## Metodo
1. **Allineamento.** La mappa del gioco usa la proiezione lineare lon/lat di `osm.mjs`, le tile sono Web Mercator. `satellite-overlay.mjs` converte gli spigoli di ogni tile in coordinate di gioco; in una tile la differenza tra le due proiezioni è sotto il centimetro.
   - Lo scarto misurato tra le sagome OSM e i tetti in foto è di **1,7–3,8 m**, su tre zone: Via Roma, Piazza Santo Stefano, Municipio.
   - Lo scarto non va sempre nella stessa direzione: è la normale differenza tra le impronte OSM e i tetti fotografati in prospettiva, non un errore della conversione. La conversione coincide con `osm.mjs` entro 0,06 m.
2. **Foto.** Circa 330 tile, scaricate una sola volta e tenute in una cache di lavoro fuori dal repository: zoom 17 per tutta Melito, zoom 18 per il centro (Via Roma, Municipio e mercato, Corso Europa ovest e sud), zoom 19 per le prove della sovramappa.
3. **Confronto automatico.** Ogni sagoma del gioco e celle di 25 m su tutto il territorio comunale.
   - Il verde è misurato con l'indice 2G−R−B, i tetti in coppo con soglie sul rosso.
   - Ne risultano gli edifici segnaposto su prati e campi, le grandi aree verdi senza niente e i tetti in foto senza edificio nel gioco.
4. **Confronto a vista.** Coppie di screenshot del gioco e della foto con la stessa camera e la stessa griglia di coordinate. I candidati automatici sono stati verificati uno per uno a vista e da qui vengono le segnalazioni `M`. Coordinate a vista: ±15 m.

## Le 10 priorità
1. **A25 — I segnaposto riempiono il verde.** 135 dei 553 edifici segnaposto di `urban-infill.mjs` stanno su prati, campi o alberi. Serve un nuovo BF: l'infill deve saltare le aree verdi; la foto o OSM `landuse/leisure` possono fare da maschera.
2. **A01 — Campo da calcio in Via delle Palme**, coperto da 9 palazzine segnaposto. Va tolto l'infill ed è un candidato ideale per la Q32 (campetti).
3. **M01, M02, M06 — Parchi alberati intorno al Municipio e giardino con vialetto diagonale**, probabilmente la villa comunale: oggi ci sono case segnaposto. Collegati a BF12 (recinti).
4. **A17 — Grande edificio a tetto rosso con due cortili in Via Saragat**, vicino al Municipio, assente: c'è un gruppo di case segnaposto.
5. **A21 — Parrocchia a croce con sagrato in Via delle Magnolie**, assente.
6. **M12, M13 — Campi da tennis, calcetto e terra rossa a sud di Corso Europa**: impianti per la Q32.
7. **A19, A20 — Centro storico intorno a Via Roma e Via Pizzone**: case fitte in foto, piazzali vuoti nel gioco (Q15).
8. **A08, A10, A14, M22 — Svincoli e viadotti della superstrada**, oggi incroci a raso: nuova Q per ponti e livelli. Il parco Prima Casa è in parte sotto un viadotto.
9. **M04 — Area mercatale del rione 219**: in foto è un lotto di cantiere con macerie; va coordinata con la Q42.
10. **M11 — Lunga struttura in diagonale**: forse la linea metropolitana EAV con una stazione, da verificare in OSM (`railway=*`).

## Limiti
- **Data della foto:** non è nota con precisione. Cantieri, demolizioni e campi possono essere cambiati.
- **Alberi:** coprono mura, vialetti e parcheggi. Nelle zone alberate la classificazione è prudente.
- **Analisi automatica:** con soglie di colore, quindi va sempre controllata. Le righe A01–A24 sono state verificate a vista sui provini; A25 e A26 sono sintesi.
- **Usi degli edifici:** scuola, caserma, parrocchia ecc. sono **ipotesi** dalla forma: da verificare.
