# Ninomon – 72 pavimenti (batch 01)
Tre aree (**Scalo ferroviario, Sottopasso, Vicolo urbano**), 24 ritagli per area, 72 in totale.

- `floor-source-64.png`: texture archivio **64×64** ciascuna, 24 colonne × 3 righe (1536×192). Conserva maggior dettaglio.
- `floor-game-32.png`: atlas ottimizzato **32×32**, 24 colonne × 3 righe (768×96). Collegato al renderer `snes.js`.
- `floor-manifest.json`: indice **zero-based**, rettangoli di crop e categorie per evitare che binari e tombini finiscano sul pavimento casualmente.

Tutti i pavimenti sono **completamente opachi**. I 72 ritagli sono estratti dalla tavola ambientale originale, con un piccolo adattamento di dimensione per uniformare le celle; **non sono ancora autotile seamless**. I vecchi pavimenti e la grafica procedurale restano come fallback se la nuova immagine non viene caricata.

## Come estrarre i singoli tile dagli atlanti

```python
from PIL import Image
import json
root="games/ninomon/assets/pavements/"
m=json.load(open(root+"floor-manifest.json"))
img=Image.open(root+"floor-source-64.png")
for zone in m["zones"].values():
    for tile in zone["tiles"]:
        x,y,w,h=tile["sourceRect"]
        img.crop((x,y,x+w,y+h)).save(root+tile["id"]+".png")
```

Per mantenere aggiornato il gioco, aggiornare anche `floor-manifest.json` se si sostituisce un tile o cambia la posizione.
