# GTA Melito — Uns Arcade (prototipo 0.1)

Piccolo gioco arcade originale ispirato alla visuale dall'alto dei GTA degli anni Novanta, ambientato in **Melito di Napoli**. Accesso diretto dal browser, PC e telefono, sulla stessa GitHub Pages degli altri giochi. **Non contiene codice o asset di Rockstar Games.**

## Stato e obiettivi realistici

- Confine amministrativo reale di Melito di Napoli: ISTAT, 1 gennaio 2026 (CC BY).
- Vie, curve, incroci, sagome edilizie e punti d'interesse: importati dai dati OpenStreetMap (ODbL). **Nessuna strada viene inventata con una griglia fittizia.**
- Movimento a piedi, guida top-down, salita/discesa dalle auto, semplici automobili in movimento, pedoni decorativi e minimappa.
- Rendering 2D Canvas con caricamento e disegno solo degli elementi vicini al giocatore.
- Per motivi di prestazioni e fedeltà, le **forme** dei palazzi vengono dai dati OSM, mentre le facciate sono rese con un'estetica rétro originale. Il database OSM può essere incompleto; non garantiamo che contenga *ogni* negozio, strada privata o edificio.
- Le auto del traffico seguono singole geometrie stradali; non implementano ancora una vera rete di percorsi con semafori, incroci e precedenze. Le missioni, la polizia, un sistema di danni e il vero gameplay GTA restano da costruire.

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

Lo script ricava la cartografia OpenStreetMap da una bounding box del confine ISTAT, seleziona gli elementi all'interno del comune, converte le coordinate WGS84 in metri locali e scrive `games/gta-melito/data/melito-map.json`. È previsto un job GitHub Actions (`Build GTA Melito real map`) per generare e aggiornare lo snapshot statico; eventuali protezioni del repository possono richiedere l'esecuzione manuale del workflow.

### Comandi

- **WASD / frecce:** spostamento a piedi, acceleratore/freno e sterzo in auto.
- **E:** entra nell'auto vicina, oppure scendi.
- **Shift:** corsa a piedi.
- **Spazio:** freno a mano.
- **Telefono:** pulsanti direzionali, ENTRA/SCENDI.
- **+ / −:** zoom.
- **⌂:** torna al punto di partenza.

## Sviluppo successivo

1. Verifica geometria e segnalazione strade OSM mancanti.
2. Collisioni, attraversamenti e navigazione del traffico tramite un vero grafo di strade.
3. Edifici e monumenti riconoscibili tramite tile/sprite originali.
4. Missioni locali, NPC, polizia e salvataggio.
5. Ottimizzazione smartphone e verifica con test reali su dispositivi.

Questo è un prototipo di esplorazione, non un GTA 2 completo e non una ricostruzione fotografica degli immobili.
