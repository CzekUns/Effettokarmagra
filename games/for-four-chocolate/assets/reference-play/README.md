# Asset della prova grafica

Fonte di stile unica per tutti gli asset: `../../references/gameplay-mgs-vr-artboard.webp`. Le foto dei personaggi non sono state inviate allo strumento. Bitmap derivate con imagegen, poi convertite da PNG a WebP per ridurre il peso. Simone ha approvato l'estetica della scena il 22/10; gli asset rimangono derivati della tavola, non riproduzioni pixel per pixel.

Prompt di produzione, tutti con la tavola come riferimento e senza altri stili:

- `ipno.webp`: personaggio isolato a figura intera, proporzioni adulte, cappello di paglia, occhiali, camicia nera con fiori rossi, pantaloni scuri; resa 3D illustrata ricca, luci ambra/blu, alpha trasparente.
- `ipno-walk.webp`: modifica del primo Ipno; stessi abiti, volto, scala, camera, colori e alpha, gamba e braccia nel passo opposto.
- `ipno-take.webp`: modifica del primo Ipno; stessi elementi invarianti, una mano allungata verso lo scaffale, piedi piantati.
- `policie.webp`: agente ceco in divisa blu scura con scritta POLICIE, adulto a scala coerente, alpha trasparente, stessa luce calda/fredda.
- `customer.webp`: cliente adulta con giacca bordeaux e cestino, scala e stile coerenti, alpha trasparente.
- `fridge.webp`: texture frontale fitta di bibite e latticini, luce fredda ciano e riflessi ambra, senza cornice/UI.
- `chocolate-shelf.webp`: texture frontale fitta di tavolette e snack in viola, rosso, oro e blu, quattro ripiani e prezzi, senza persone/UI.
- `floor.webp`: texture di piastrelle calde lucidate con riflessi ambrati e freddi, vista perpendicolare, senza oggetti/UI.

## Viste aggiunte dopo l'approvazione estetica di Simone (22 ottobre)

`ipno-back.webp`, `ipno-side.webp`, `policie-back.webp`, `policie-side.webp`, `customer-back.webp` e `customer-side.webp` derivano **solo** dalla tavola grafica approvata e dalle rispettive viste frontali come riferimento d'identità. Tre tavole madri a due viste sono state portate a celle uniformi 1024×1536. Il profilo sinistro usa il riflesso del profilo destro. Il confronto di tutti i personaggi alla stessa scala è in `views-comparison.png`; gli screenshot di gioco desktop e mobile landscape sono stati aggiornati.

La cliente ha un lieve alone scuro nei nuovi ritagli, simile a quello della vista frontale già approvata. Gli sprite sono piani orientati verso la camera: le viste rendono leggibile il moto, ma non sono modelli 3D completi né animazioni nuove per tutte le direzioni.

I personaggi hanno sprite trasparenti. Il gioco usa i WebP come texture di Three.js e monta frigoriferi, scaffali, pareti, suolo e collisioni in geometria 3D distinta dalla tavola.
