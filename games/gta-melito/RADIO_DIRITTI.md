# Radio in auto — collaudo stream e diritti d'uso (Q14, 20/10/2026)

**Stato: funzione DI PROVA, non definitiva.** Nessuna delle sei emittenti pubblica sul proprio sito un permesso esplicito a usare il flusso dentro siti di terzi. Prima di dichiararla definitiva va chiesto il consenso scritto a ciascuna emittente, oppure va usato un loro player ufficiale incorporabile. Questo documento riporta solo fatti trovati, non è un parere legale.

Il gioco non registra, non ritrasmette e non fa da proxy. Il browser del giocatore si collega direttamente al server di streaming dell'emittente o del suo fornitore, e accanto al nome c'è sempre il collegamento ↗ al sito ufficiale.

## Le sei emittenti

| Emittente | Stream usato | Da dove viene l'URL | Note legali sul sito |
|---|---|---|---|
| Radio Marte | `https://stream1.xdevel.com/audio0s975753-313/stream/icecast.audio` | Incorporato nella pagina di https://www.radiomarte.it/ (stesso URL). App ufficiale di Xdevel (`com.xdevel.radiomarte`) | Solo «Privacy Policy» e «Cookie Policy». Piè di pagina: «© 2025 Radio Marte S.r.l.» |
| Kiss Kiss Napoli | `https://kisskiss.fluidstream.eu/KKNapoli.aac` | Elenco del player ufficiale https://kisskissnapoli.it/wp-content/playerkiss/streams.js (`'radiokissnapoli':'https://kisskiss.fluidstream.eu/KKNapoli.aac'`) | Solo «Privacy Policy» e «Cookie Policy». Piè di pagina: «ONLY RADIO S.R.L.» |
| Radio CRC | `https://stream9.xdevel.com/audio2s975936-745/stream/icecast.audio` | Server Xdevel, che sviluppa l'app ufficiale (`com.xdevel.radiocrc`). Su https://crcnews.it/ **non** c'è un player web pubblico; lo stream si chiama «no name», quindi l'URL **non è confermato** da una pagina ufficiale | Nessuna pagina di termini trovata. Piè di pagina: «Società Editrice: Crc Centro Radio Diffusione Campania srl» |
| Radio Nuova San Giorgio | `https://nr8.newradio.it:19675/stream?ext=.mp3` | Player ufficiale aperto dal sito (`/onair/streaming.php` → http://play5.newradio.it/player/index/3070), da cui il browser riproduce proprio questo URL | Solo il collegamento «Privacy policy» |
| Radio Norba | `https://stream3.xdevel.com/audio0s975885-1008/stream/icecast.audio` | Server Xdevel, che fornisce app e player ufficiali (`com.xdevel.radionorba`, https://play.xdevel.com/12841, metadati `meta1.xdevel.com/song/group/radionorba`). Lo stream si chiama «Radionorba»; sul sito non è pubblicato l'URL audio, solo il video | Privacy e cookie (iubenda). Piè di pagina: «direzione e coordinamento di RadioMediaset S.p.A.» |
| Radio Napoli | `https://kisskiss.fluidstream.eu/RadioNapoli.aac` | Player ufficiale indicato da https://www.radionapoli.it/ (https://players.fluidstream.it/RadioNapoli/) | Privacy e cookie (iubenda). Piè di pagina: «©2025 Radio Napoli», «Le altre radio del gruppo Kiss Kiss» |

Siti consultati il 20/10/2026 tra le 14:40 e le 14:56.

## Correzioni fatte

- **Nuova San Giorgio.** Il vecchio URL `https://ice15.fluidstream.net/sangiorgio.aac` ora reindirizza a `https://str01.fluidstream.net/ric.mp3`, che si presenta come «Radio Italia Charleroy»: era un'altra emittente. Verificato due volte, alle 14:40 e alle 14:56. Ora si usa lo stream del player ufficiale.
- **Radio Napoli.** L'URL precedente funzionava ed era la stessa emittente, ma non compare in nessuna pagina ufficiale. Ora si usa quello del player ufficiale.

## Cosa resta da fare (non tecnico)

1. Chiedere alle sei emittenti il consenso a usare il loro flusso nel gioco, oppure un loro player incorporabile.
2. Senza consenso la radio resta marcata «di prova», com'è ora.
3. Per Radio CRC serve anche la conferma dell'URL ufficiale.
