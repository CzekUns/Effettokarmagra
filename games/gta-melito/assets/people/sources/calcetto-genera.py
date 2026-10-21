"""Four football kits recoloured from the approved original 24x40 pedestrian frames."""
from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
src=Image.open(ROOT/'pedoni-4x4frames-24x40-rgba.png').convert('RGBA')
out=Image.new('RGBA',(384,160))
shirts=[(211,59,51),(45,95,196),(232,196,71),(79,180,106)]
for identity,base in enumerate(shirts):
 for row in range(4):
  for frame in range(4):
   cell=src.crop((frame*24,row*40,(frame+1)*24,(row+1)*40))
   px=cell.load()
   for y in range(11,24):
    for x in range(4,20):
     r,g,b,a=px[x,y]
     if a<180 or max(r,g,b)<33:continue
     # Retain face and hands; recolour coat/shirt mass and leave the dark outline.
     skin=r>g*1.15 and g>b*1.08 and r>105
     if skin:continue
     light=max(.65,min(1.32,(r+g+b)/290))
     px[x,y]=tuple(min(255,round(c*light)) for c in base)+(a,)
   out.alpha_composite(cell,(identity*96+frame*24,row*40))
path=ROOT/'calcetto-4squadre-4dir-4frames-24x40.png'
out.save(path,optimize=True)
print(path,out.size)
