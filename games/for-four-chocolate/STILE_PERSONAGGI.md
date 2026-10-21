# AVVISO — DOCUMENTO GRAFICO SUPERATO (22 OTTOBRE 2026)

**UNICA REFERENCE ARTISTICA APPROVATA:** [gameplay-mgs-vr-artboard.webp](./references/gameplay-mgs-vr-artboard.webp). Vietato trattare gli sprite di questo documento come uno stile alternativo. Attenersi a [AGENTS.md](./AGENTS.md).


**Questa tavola pixel art 24×40 / 20 colori NON è più la specifica artistica attiva.** L'utente ha esplicitamente richiesto una resa **Metal Gear Solid PS1**, non Commodore 64. La fonte normativa aggiornata è **[DIREZIONE_ARTISTICA_PS1.md](./DIREZIONE_ARTISTICA_PS1.md)**. Conserviamo la documentazione qui sotto per la tracciabilità del prototipo e i test, ma nessun nuovo collaboratore deve riproporne la scala, i vincoli cromatici o il renderer come versione finale.

---

# Stile dei personaggi — tavola iniziale

**Stato: PROVVISORIO, da approvare da Simone.** Questa bibbia fissa le regole per Ipno, POLICIE, clienti, cassieri e Totore. Gli sprite non riproducono i volti delle fotografie.

## Griglia e proporzioni

- Pixel art nativa, senza sfumature: cella **24 × 40 px**. Ogni figura occupa 36 px in altezza e ha la stessa scala nel gioco.
- Direzioni nello stesso ordine per tutti: fronte, retro, sinistra, destra. **Quattro frame** per direzione: fermo e tre passi.
- Testa circa 10 × 10 px; spalle 14 px; busto 13 px; gambe 11 px. Contorno di **1 px** colore `#151b2e`.
- Luce dall'alto a sinistra: bordo chiaro a sinistra, ombra a destra. Nessun antialias o alone; trasparenza solo 0 o 255.
- L'ambiente usa gli stessi colori e lo stesso contorno. Segnaletica in ceco con un solo carattere monospaziato pixel.

## Palette unica

Massimo 24 colori. La tavola iniziale usa questi 20:

| Uso | Colori |
|---|---|
| Contorno, notte, ombre | `#151b2e`, `#26334c`, `#35465e` |
| Pavimento e scaffali | `#52677a`, `#718b91`, `#9eaaa1` |
| Pelle, quattro toni | `#6f493d`, `#a86c50`, `#d39a72`, `#f0c498` |
| Paglia e cioccolato | `#9b673c`, `#d8a14f`, `#ffda83` |
| POLICIE | `#243d65`, `#426491`, `#b9d9e8` |
| Camicia Ipno, cliente, allarme | `#744d86`, `#e993af`, `#4f9e9a`, `#e65f66` |

## Tratti fissi della tavola madre

- **Ipno:** cappello di paglia con tesa larga, occhiali scuri, camicia fantasia viola/rosa. I due riferimenti in repo sono miniature; gli originali serviranno per la versione definitiva.
- **POLICIE:** berretto e divisa blu scuro, banda chiara; la scritta POLICIE si legge nell'interfaccia e nei ritratti, non sulla cella minuscola.
- **Cliente:** figura civile con maglia turchese. Qui è un confronto di scala, non ancora un personaggio attivo.
- **Totore:** capelli ricci e maglia scura, da aggiungere solo dopo l'approvazione dello stile e dopo la reference ad alta risoluzione.

Lo script `generate-sprites.mjs` è l'unica tavola madre: genera i tre model sheet con fermo e camminata in quattro direzioni e `sheet.png` con le tre figure affiancate. Il confronto è ingrandito 4× senza interpolazione: le celle originali restano 24×40. Nessun nuovo personaggio si disegna fuori da quello script.

## Controllo visivo nella scena

`assets/style-in-game.png` mostra Ipno, un agente e il cliente vicini nel vertical slice locale. Le posizioni sono state avvicinate solo nello script di prova browser, senza modificare il gioco pubblicato. Tutti e tre sono renderizzati dallo stesso codice e alla stessa scala. L'immagine serve a Simone per giudicare lo stile prima di estendere il cast.
