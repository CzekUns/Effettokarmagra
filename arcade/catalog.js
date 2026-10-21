/* Catalogo unico della sala giochi.
 * Aggiungi qui un oggetto quando pubblichi un nuovo gioco in games/<slug>/.
 * status: "live" per giocabile, "preview" per anteprima cliccabile, "soon" senza link.
 * Gli URL sono relativi alla root di GitHub Pages.
 */
window.ARCADE_CATALOG = [
  {
    id: "effetto-karmagra",
    title: "Biagio Gelo",
    subtitle: "in Effetto Karmagra",
    genre: "Labirinto / Inseguimento",
    description: "Palline bianche, signorine e Karmagra. Fuggi, cambia look e punta al record.",
    href: "./games/effetto-karmagra/",
    artwork: "./assets/biaggio-normal.svg",
    decoration: "./assets/pill.svg",
    support: "Telefono e PC",
    status: "live",
    accent: "gold",
    recordKey: "effetto-karmagra-best"
  },
  {
    id: "pesca-grossa",
    title: "Biagio Gelo",
    subtitle: "Pesca Grossa 2.0",
    genre: "Pesca / Carriera",
    description: "Dal Lago Patria al Golfo di Napoli: 31 specie, meteo e orari, esche, frizione e combattimenti veri. Commissioni, Pescepedia, varianti Karmagra e cinque pesci leggendari. E c'è ancora la sfida da 90 secondi.",
    href: "./games/pesca-grossa/",
    artwork: "./assets/biaggio-power.svg",
    decoration: "./games/pesca-grossa/fish.svg",
    support: "Telefono e PC · Carriera + sfida 90″",
    status: "live",
    accent: "aqua",
    recordKey: "biagio-pesca-record"
  },
  {
    id: "scootercross",
    title: "Biagio Gelo",
    subtitle: "Scootercross",
    genre: "Motocross / 8-bit",
    description: "Biagio sul suo scooter bordeaux attraversa Via Roma a Melito: salta ostacoli, raccogli monete e conquista il traguardo in un nuovo scenario pixel art!",
    href: "./games/scootercross/",
    artwork: "./games/scootercross/assets/biagio-scooter-illustrated.png",
    support: "Telefono orizzontale e PC",
    status: "live",
    accent: "orange",
    recordKey: "biagio-scootercross-best"
  },
  {
    id: "ninomon",
    title: "I Ninomon",
    subtitle: "Cronache di strada",
    genre: "RPG / Battaglie a turni",
    description: "I Ninomon: SNES Street Edition! Stessa console, pixel più piccoli e più dettagli; nove Ninomon, sprite originali di Nino e Gialluca, prof. Vincenzo e battaglie a turni.",
    href: "./games/ninomon/",
    artwork: "./games/ninomon/cover.svg?v=2",
    support: "Telefono e PC · Capitolo 0",
    status: "live",
    accent: "aqua"
  },
  {
    id: "gta-melito-stable",
    title: "GTA: Melito",
    subtitle: "Versione stabile · precedente",
    genre: "Open world / Guida",
    description: "Versione precedente congelata, da usare come riferimento se la sperimentale presenta problemi.",
    href: "./games/gta-melito-stable/",
    artwork: "./games/gta-melito/cover.svg",
    support: "Telefono e PC · Stabile",
    status: "live",
    accent: "aqua"
  },
  {
    id: "gta-melito",
    title: "GTA: Melito",
    subtitle: "Versione sperimentale · Q02–Q12",
    genre: "Open world / Guida",
    description: "Melito in stile top-down rétro: palazzi del centro storico, cupola di Santa Maria delle Grazie, negozi geolocalizzati, pedoni e auto ridisegnati. Missioni disponibili.",
    href: "./games/gta-melito/",
    artwork: "./games/gta-melito/cover.svg",
    support: "Telefono e PC · Beta, da collaudare",
    status: "live",
    accent: "orange"
  },
  {
    id: "for-four-chocolate",
    title: "For Four Chocolate",
    subtitle: "Domenico Ipno · Missione cioccolato",
    genre: "Stealth / Commedia",
    description: "Un supermercato ceco, quattro cioccolate e un labirinto sorvegliato da telecamere e POLICIE. L'anteprima del prossimo arcade è pronta.",
    href: "./games/for-four-chocolate/",
    artwork: "./games/for-four-chocolate/cover.svg",
    support: "Concept · non giocabile",
    status: "preview",
    accent: "orange"
  }
];