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
    genre: "Corsa / 8-bit",
    description: "Attraversa Corso Europa a Melito in un arcade verticale: evita o salta i barili, raccogli monete e batti il record sullo scooter bordeaux!",
    href: "./games/scootercross/",
    artwork: "./games/scootercross/assets/biagio-top-pixel.svg",
    support: "Telefono e PC",
    status: "live",
    accent: "orange",
    recordKey: "biagio-scootercross-best"
  }
];
