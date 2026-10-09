/* Catalogo unico della sala giochi.
 * Aggiungi qui un oggetto quando pubblichi un nuovo gioco in games/<slug>/.
 * status: "live" per giocabile, "soon" per in preparazione.
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
    subtitle: "Pesca Grossa",
    genre: "Pesca / Riflessi",
    description: "Lancia l'amo, aspetta che abbocchi e recupera la lenza senza spezzarla. Riuscirai a prendere il pesce d'oro?",
    href: "./games/pesca-grossa/",
    artwork: "./assets/biaggio-power.svg",
    decoration: "./games/pesca-grossa/fish.svg",
    support: "Telefono e PC",
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
    description: "Nino e il suo Ninomon Gialluca esplorano nove creature street fra binari e sottopassi. Il professor Vincenzo ti affida il primo compagno: nuove sprite originali, battaglie e Ninodex!",
    href: "./games/ninomon/",
    artwork: "./games/ninomon/cover.svg?v=2",
    support: "Telefono e PC · Capitolo 0",
    status: "live",
    accent: "aqua"
  }
];
