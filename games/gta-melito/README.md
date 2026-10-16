# GTA Melito — Uns Arcade (prototipo 0.1)

Piccolo gioco arcade originale ispirato alla visuale dall'alto dei GTA degli anni Novanta, ambientato in **Melito di Napoli**. Accesso diretto dal browser, PC e telefono, sulla stessa GitHub Pages degli altri giochi. **Non contiene codice o asset di Rockstar Games.**

## Stato e obiettivi realistici

- Confine amministrativo reale di Melito di Napoli: ISTAT, 1 gennaio 2026 (CC BY).
- Vie, curve, incroci, sagome edilizie e punti d'interesse: importati dai dati OpenStreetMap (ODbL). **Nessuna strada viene inventata con una griglia fittizia.**
- Movimento a piedi, guida arcade top-down con auto guidabili, salita/discesa, freno a mano, corsa, camera con inseguimento morbido e minimappa.
- **Viabilità a grafo**: 1.423 nodi geografici e 73 intersezioni con almeno tre diramazioni nell'estrazione del 16 ottobre 2026 (rete delimitata dal confine ISTAT); il traffico può scegliere una svolta e proseguire in un'altra via, con rispetto delle strade a senso unico.
- Pedoni animati sulle vie percorribili a piedi, traffico distribuito nei quartieri e rallentamenti tra auto sullo stesso segmento.
- Edifici con impronte OSM (2.056 sagome), tetti in pixel art, facciate proiettate, ombre, lucernari, impianti e variazioni cromatiche deterministiche.
- Carreggiate con larghezze approssimative differenziate per gerarchia OSM, marciapiedi, strisce pedonali in corrispondenza degli incroci.
- Arredo urbano **fictional/decorativo** generato proceduralmente (alberi, lampioni, cassonetti, scooter parcheggiati, panchine). Non corrisponde all'inventario reale di Melito.
- **Insegne illustrative** per i 57 punti d'interesse OSM nominati: testo e posizione derivano dalla cartografia, ma l'aspetto della targa è una rappresentazione inventata.
- Comandi touch con freno e corsa dedicati, controlli PC, zoom e navigazione camera fluida.
- Rendering 2D Canvas con caricamento e disegno solo degli elementi vicini al giocatore.
- Per motivi di prestazioni e fedeltà, le **forme** dei palazzi vengono dai dati OSM, mentre le facciate e gli elementi sul tetto sono resi con un'estetica rétro originale. Il database OSM può essere incompleto; non garantiamo che contenga *ogni* negozio, strada privata o edificio.
- Le auto del traffico ora percorrono il grafo OSM e possono svoltare agli incroci; precedenze, semafori, collisioni complesse e pianificazione di destinazioni sono ancora semplificati. Missioni, polizia, danni e gameplay GTA completo restano da costruire.

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

- **WASD / frecce:** spostamento a piedi, acceleratore/freno e sterzo in auto.
- **E:** entra nell'auto vicina, oppure scendi.
- **Shift:** corsa a piedi.
- **Spazio:** freno a mano.
- **Telefono:** pulsanti direzionali, ENTRA/SCENDI, FRENO e CORRI.
- **+ / −:** zoom.
- **⌂:** torna al punto di partenza.\n\nPer verificare topologia, passaggio fra segmenti e reali geometrie:\n\n```bash\nnode --test games/gta-melito/gta-melito.test.mjs\n```\n\nC'è anche un workflow `GTA Melito 0.2 validation` che esegue i test ad ogni modifica al gioco.

## Sviluppo successivo

1. Verifica geometria e segnalazione strade OSM mancanti.
2. Collisioni, attraversamenti e navigazione del traffico tramite un vero grafo di strade.
3. Edifici e monumenti riconoscibili tramite tile/sprite originali.
4. Missioni locali, NPC, polizia e salvataggio.
5. Ottimizzazione smartphone e verifica con test reali su dispositivi.

Questa è la versione 0.2 del prototipo di esplorazione urbana. I dati geografici sono reali; alcuni allestimenti grafici e gli NPC sono inventati. Non è un GTA 2 completo né una ricostruzione fotografica degli immobili.
