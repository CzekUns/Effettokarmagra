# Area mercatale di Melito — PRIMA VERSIONE CON SEGNAPOSTO

**Stato:** `prima-versione-placeholder` (Q42, 20/10/2026). Il gioco usa l'area tramite `market.mjs`: banchi **segnaposto** dei 14 tipi del foglio, ombrelloni in pixel art procedurale che sfumano quando ci si passa sotto (R01), un venditore per banco e clienti che arrivano dalle vie, comprano ed escono. Il mercato si tiene il venerdì di gioco (il giorno 0 della partita è un venerdì), con montaggio 6:30–7:30, mercato 7:30–13:30 e smontaggio 13:30–14:30; `?mercato=1` lo monta ogni giorno per le prove. L'arte definitiva dei banchi si aggancia da `MARKET_ART` in `market.mjs`. Richiesta iniziale del committente, 20/10/2026: «area mercatale di melito, identificala e segnala come zona diciamo da "arredare" … ci vogliono gli ombrelloni grandi che se ci passo sotto vanno in trasparenza e vedo la bancarella».

## Dove si trova
- **Mercato settimanale, rione 219:** l'isolato tra **Via Praga** (ovest), **Via Dublino** (nord), **Via Budapest** (est) e **Via Ginevra** (sud). Via Berlino prosegue a sud-est dall'angolo Budapest/Ginevra.
  - La stampa locale lo colloca «tra via Dublino e via Praga, nel rione 219» (Melitonline, 28/10/2025). Un altro articolo dice «mercato settimanale di via Berlino» (Melitonline, 09/04/2026): è la via che parte proprio dall'angolo sud-est dell'isolato, quindi le due fonti sono compatibili ma non identiche.
  - In OpenStreetMap non c'è un `amenity=marketplace`. Dentro l'isolato ci sono due tettoie (`building=roof`, way 733703612 e 733703644, al centro dell'isolato) e aree a prato o arbusti: è coerente con un'area mercato all'aperto con pini e aiuole.
- **Coordinate di gioco** (metri proiettati di `data/melito-map.json`):
  - poligono indicativo, già rientrato di 5 m dagli assi stradali per lasciare carreggiata e marciapiede: (1137, 925) · (1199, 923) · (1200, 970) · (1139, 975);
  - centro: (1168, 948);
  - superficie circa 62 × 47 m;
  - tettoie OSM: x 1162–1172, y 934–961.
- **WGS84:** centro 40,924042 N · 14,231179 E. Il poligono è in `data/market-area.json`.
- **Strade nel grafo del gioco:** tutte residenziali a doppio senso e larghe 7, tranne il tratto sud di Via Berlino, che è a senso unico. Le verifica `mercato-dati.test.mjs`.

## Cosa c'è oggi nel gioco
Screenshot in Chrome headless del 20/10/2026, PC 1280×720 e telefono 844×390, con il personaggio al centro dell'area:
- l'isolato appare come una piazzetta pavimentata con due alberi e una panchina, e baie di sosta (BF02) sui quattro lati;
- al centro le due tettoie OSM (`building=roof`) sono disegnate come **un edificio pieno con il tetto in tegole**, e sono anche un ostacolo: il centro dell'area non è camminabile;
- per il mercato vanno trattate come **pensilina aperta**, con il tetto trasparente e i banchi sotto (requisito R16);
- nessun traffico NPC dentro l'isolato; una sola auto in sosta entro 45 m.

## Giorno, orari, posteggi — da confermare
- **Giorno:** **venerdì**, secondo due elenchi non ufficiali: Italia Ambulante, visto solo come estratto di ricerca perché il sito non è raggiungibile, e oraridiapertura24, che riporta 08:00–12:00 ma come indirizzo il Municipio. **Non verificato** con il Comune.
- **Posteggi:** numero **non trovato** nelle fonti pubbliche consultate.
- **Lavori in corso:** riqualificazione da 2.858.704 €, finanziata dalla Città Metropolitana. Il cantiere è stato recintato a ottobre 2025 e la fine lavori è prevista il **30/09/2027**; nascerà uno spazio polifunzionale per mercati, fiere ed eventi. Durante i lavori il mercato potrebbe svolgersi altrove: **non verificato**.
- **Seconda area:** il **mercato ortofrutticolo comunale**, struttura con stand in concessione, in **Corso Europa 496** (da Waze, non verificato su fonti ufficiali). Non è il mercato settimanale; la sua posizione esatta sulla mappa resta da trovare.
- Da chiedere al SUAP del Comune di Melito: giorno e orari ufficiali, numero di posteggi, sede provvisoria durante i lavori.

## Regole proposte per il gioco
- **Quando:** il mercato c'è il giorno di mercato e la mattina, seguendo l'orologio NPC della Q02. Montaggio all'alba, pieno tra le 8 e le 13, smontaggio entro le 14, area vuota il pomeriggio. Se l'orologio non conta i giorni della settimana, serve un contatore giorni. Per le prove si usa `?mercato=1`.
- **Strade:** nel giorno di mercato Via Dublino, Via Praga (tratto lungo l'area), Via Ginevra e Via Budapest sono chiuse al traffico NPC. Sono coinvolti:
  - BF03: niente spawn né svolte verso le vie chiuse, che non devono diventare trappole;
  - BF07: incroci e precedenze ai bordi della chiusura;
  - BF09: i varchi di confine non c'entrano, l'area è interna al comune.
- **Sosta:** le baie di BF02 dentro e lungo l'area si svuotano fuori vista prima del montaggio.
- **Collisioni:** i banchi sono ostacoli fissi, gli ombrelloni no. Il giocatore deve avere sempre una mossa per uscire (regola BF01).
- **Ombrelloni trasparenti:** passando sotto un ombrellone a piedi o in veicolo, si dissolve come i tetti degli edifici (`roof-reveal.mjs`) e lascia vedere banco e venditore. È il requisito R01.
- **Onestà:** l'area mercatale è reale (fonti sotto); banchi, merci, prezzi e venditori sono di fantasia, e il gioco lo dichiara.

## Per chi crea i banchi
- **`mercato-banchi.csv`:** una riga per tipo di banco, 14 tipi per 23 banchi indicativi. Per ognuno ci sono misure reali in metri, copertura (ombrellone, tenda, furgone-negozio), diametro, forma e colori dell'ombrellone, merce, sprite necessari, palette, animazioni NPC, suono, posizione e priorità P0/P1/P2.
- **`mercato-requisiti.csv`:** requisiti tecnici R01–R16, ciascuno con criterio di accettazione e moduli coinvolti.
- **Scala:** le misure sono **reali**. Nel gioco i veicoli sono disegnati più grandi del vero: una Panda reale è lunga circa 3,7 m, la sua sagoma di collisione 6,3 unità e lo sprite circa 8,5. Per coerenza con auto e persone, moltiplica le misure per circa **1,7–2,3** e prova la densità finale nell'area.
- **Ordine consigliato:**
  1. P0: frutta e verdura, abbigliamento, ombrellone trasparente, collisioni e posizionamento;
  2. P1: il resto;
  3. P2: i dettagli.

## Fonti (consultate il 20/10/2026)
- Melitonline, «Avviata la riqualificazione del mercatino: 2,8 mln per un nuovo spazio polifunzionale», 28/10/2025 — https://www.melitonline.net/giornale/mercatino-melito-riqualificazione/
- Melitonline, «Melito davanti al bivio: rilanciare il commercio per ridisegnare la città», 09/04/2026 — https://www.melitonline.net/giornale/melito-bivio-commercio-ridisegnare-citta/
- Melitonline, «Mercato ortofrutticolo, prorogata l'occupazione degli stand», 20/04/2026 — https://www.melitonline.net/giornale/melito-mercato-ortofrutticolo-prorogata-loccupazione-degli-stand-scadenza-fissata-per-il-5-maggio/
- oraridiapertura24, «Mercato Settimanale» Melito di Napoli — https://www.oraridiapertura24.it/filiale/Melito%2520di%2520Napoli-Mercato%2520Settimanale-663728S.html
- Italia Ambulante, mercati in provincia di Napoli, solo estratto di ricerca — http://www.italiambulante.it/mercati/elenco.php?id_provincia=napoli
- Waze, Mercato Ortofrutticolo Melito, Corso Europa 496
- OpenStreetMap © OpenStreetMap contributors (ODbL), API 0.6, bbox 14.2300,40.9232,14.2322,40.9250
