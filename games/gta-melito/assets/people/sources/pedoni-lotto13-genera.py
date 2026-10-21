#!/usr/bin/env python3
"""Lotto 13: quattro pedoni, quattro direzioni, quattro frame per direzione.

Adattamento a zone dei frame della tavola pedoni originale: mantiene le
camminate e la scala, cambia abiti, accessori e identità.
"""
from collections import deque
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

HERE = Path(__file__).resolve().parent
REF = HERE / 'riferimento-pedoni.png'
PREVIOUS = HERE / 'riferimento-lotto12.png'
ATLAS = HERE / 'pedoni-lotto13-4x4frames-24x40-rgba.png'
SHEET = HERE / 'sheet.png'
CW, CH = 24, 40
BG = (242, 238, 223)
OUT = (28, 27, 28, 255)

# Ogni nuovo soggetto usa uno scheletro di camminata della reference.
# Ordine originale: uomo blu, donna scura, anziano beige, ragazzo giallo.
SOURCE = (0, 2, 3, 0)
PALETTE = {
    'outline': (1, 1, 1),
    'dark': (38, 32, 30),
    'navy': (33, 46, 74),
    'grey': (90, 91, 94),
    'blue': (54, 75, 98),
    'skin': (226, 152, 100),
    'brown': (80, 49, 31),
    'ochre': (152, 97, 35),
    'lightgrey': (163, 156, 149),
    'shadow_skin': (163, 112, 79),
    'tan': (103, 73, 41),
    'cream': (220, 202, 178),
    'yellow': (225, 160, 8),
}


def match(c, key):
    return c[:3] == PALETTE[key]


def edit_colors(cell,who,direction):
    """Ricolorazione a zone dei frame originali, senza alterare il passo."""
    px=cell.load()
    skins=((176,118,85),(223,165,125),(196,136,97),(205,147,106))
    shades=((123,76,57),(162,113,83),(140,91,64),(147,99,72))
    for y in range(CH):
        for x in range(CW):
            r,g,b,a=px[x,y]
            if not a:px[x,y]=(0,0,0,0);continue
            c=(r,g,b,a)
            if match(c,'skin'):px[x,y]=(*skins[who],255)
            elif match(c,'shadow_skin'):px[x,y]=(*shades[who],255)
            elif who==0: # Operaio: gilet arancione e pantaloni scuri.
                if 7<=x<=17 and 14<=y<=26:
                    if match(c,'navy') or match(c,'blue'):px[x,y]=(194,93,35,255)
                    elif match(c,'grey'):px[x,y]=(224,122,43,255)
                elif y>=26 and (match(c,'navy') or match(c,'blue')):
                    px[x,y]=(67,75,70,255)
            elif who==1: # Signora con giacca chiara e gonna blu.
                if match(c,'cream'):px[x,y]=(170,170,148,255)
                elif match(c,'lightgrey') and 14<=y<=26:px[x,y]=(131,136,123,255)
                elif y>=25 and (match(c,'brown') or match(c,'ochre')):
                    px[x,y]=(68,83,106,255)
            elif who==2: # Ragazzino: felpa verde chiaro.
                if match(c,'yellow'):px[x,y]=(97,166,112,255)
                elif match(c,'ochre') and 13<=y<=28:px[x,y]=(66,120,82,255)
            else: # Barista: camicia bianca, pantaloni antracite.
                if 8<=x<=16 and 14<=y<=24:
                    if match(c,'navy') or match(c,'blue'):px[x,y]=(207,204,188,255)
                    elif match(c,'grey'):px[x,y]=(228,222,201,255)
                elif y>=26 and (match(c,'blue') or match(c,'navy')):
                    px[x,y]=(50,52,57,255)
    return cell


def safe_dot(draw,alpha,x,y,color):
    if 0<=x<CW and 0<=y<CH and alpha.getpixel((x,y)):
        draw.point((x,y),fill=color)


def details(cell,who,direction,frame):
    d=ImageDraw.Draw(cell)
    alpha=cell.getchannel('A')
    step=(-1,0,1,0)[frame]
    if who==0:
        # Bretelle, due bande catarifrangenti e pantaloni da lavoro.
        for xx in (8,15):
            for yy in range(15,25):
                safe_dot(d,alpha,xx,yy,(96,64,40,255))
        for yy in (18,23):
            for xx in range(8,17):
                safe_dot(d,alpha,xx,yy,(239,208,89,255))
        if direction==1:
            d.line((10,16,14,16),fill=(239,208,89,255))
        for xx in (9,14):
            for yy in (29,32):safe_dot(d,alpha,xx,yy,(92,102,94,255))
    elif who==1:
        # Carrello davanti quando frontale, al fianco quando di profilo.
        d.line((8,6,10,4,14,4,16,6),fill=(105,82,67,255),width=2)
        if direction==1:
            x0,x1,y0,y1=7,17,24+step,32+step
            d.line((11,19,11,23+step),fill=OUT)
        elif direction==0:
            x0,x1,y0,y1=7,17,15+step,23+step
            d.line((12,23,12,22+step),fill=OUT)
        elif direction==2:
            x0,x1,y0,y1=2,9,22+step,31+step
            d.line((8,19,7,23+step),fill=OUT)
        else:
            x0,x1,y0,y1=15,22,22+step,31+step
            d.line((16,19,17,23+step),fill=OUT)
        d.rectangle((x0,y0,x1,y1),fill=OUT)
        d.rectangle((x0+1,y0+1,x1-1,y1-1),fill=(157,119,86,255))
        # Scacchi su tessuto; sempre in pixel netti.
        for yy in range(y0+1,y1,2):
            for xx in range(x0+1,x1,2):
                if (xx+yy)%4<2:d.point((xx,yy),fill=(224,198,154,255))
        for wx in (x0+1,x1-1):
            d.point((wx,min(38,y1+1)),fill=OUT)
    elif who==2:
        # Pallone sotto il braccio, linee scure a pentagono.
        bx=17 if direction in (0,1,3) else 4
        d.line((15 if bx>12 else 8,18,bx,21+step),fill=OUT)
        d.ellipse((bx-2,20+step,bx+3,25+step),fill=OUT)
        d.ellipse((bx-1,21+step,bx+2,24+step),fill=(215,190,135,255))
        d.point((bx,22+step),fill=(84,79,67,255))
        d.point((bx+1,23+step),fill=(84,79,67,255))
    else:
        # Grembiule nero dalla vita alle cosce, camicia chiara e tasca.
        if direction==1:
            d.line((9,16,12,19,15,16),fill=(237,229,207,255))
        for yy in range(20,29):
            for xx in range(9,16):
                safe_dot(d,alpha,xx,yy,(39,41,43,255))
        d.line((9,21,15,21),fill=(93,93,90,255))
        if direction==1:
            d.rectangle((11,23,13,25),fill=(76,77,75,255))
    p=cell.load()
    for yy in range(CH):
        for xx in range(CW):
            if p[xx,yy][3]==0:p[xx,yy]=(0,0,0,0)
    return cell


def shorten_child(cell):
    """Riduce la figura a circa 30 px e lascia i piedi nella fascia bassa."""
    small=cell.resize((19,31),Image.Resampling.NEAREST)
    out=Image.new('RGBA',(CW,CH),(0,0,0,0))
    out.alpha_composite(small,(2,8))
    return out


def remove_tiny_fragments(cell):
    """Pulisce frammenti isolati e riunisce una mano alla manica vicina."""
    px=cell.load()
    remaining={(x,y) for y in range(CH) for x in range(CW) if px[x,y][3]}
    components=[]
    while remaining:
        start=remaining.pop();component=[start];queue=deque([start])
        while queue:
            x,y=queue.popleft()
            for nx in range(x-1,x+2):
                for ny in range(y-1,y+2):
                    pt=(nx,ny)
                    if pt in remaining:
                        remaining.remove(pt);component.append(pt);queue.append(pt)
        components.append(component)
    if not components:return cell
    main=max(components,key=len)
    for component in components:
        if component is main:continue
        if len(component)<=8:
            for x,y in component:px[x,y]=(0,0,0,0)
            continue
        # La reference ha in alcuni frame un braccio a 1–2 px dal busto.
        near=min(((x0-x1)**2+(y0-y1)**2,(x0,y0),(x1,y1))
                 for x0,y0 in component for x1,y1 in main)
        if near[0]<=16:
            ImageDraw.Draw(cell).line((*near[1],*near[2]),fill=OUT)
        else:
            for x,y in component:px[x,y]=(0,0,0,0)
    return cell


def main():
    if not REF.exists():
        raise SystemExit('Manca riferimento-pedoni.png, copia locale della reference obbligatoria')
    ref = Image.open(REF).convert('RGBA')
    if ref.size != (384, 160):
        raise SystemExit(f'Reference inattesa: {ref.size}, attesa 384x160')
    previous = Image.open(PREVIOUS).convert('RGBA')
    if previous.size != (384, 160):
        raise SystemExit(f'Lotto 12 inatteso: {previous.size}, atteso 384x160')
    atlas = Image.new('RGBA', ref.size, (0, 0, 0, 0))
    for direction in range(4):
        for who, source in enumerate(SOURCE):
            for frame in range(4):
                sx = (source * 4 + frame) * CW
                cell = ref.crop((sx, direction * CH, sx + CW, (direction + 1) * CH))
                cell = details(edit_colors(cell, who, direction), who, direction, frame)
                if who == 2:
                    cell = shorten_child(cell)
                cell = remove_tiny_fragments(cell)
                atlas.alpha_composite(cell, ((who * 4 + frame) * CW, direction * CH))
    atlas.save(ATLAS, optimize=True)

    zoom, gap, top = 3, 30, 22
    w, h = 384 * zoom, 160 * zoom
    sheet = Image.new('RGB', (w * 3 + gap * 2, h + top), BG)
    draw = ImageDraw.Draw(sheet)
    draw.text((8, 4), 'LOTTO 13: QUATTRO PEDONI', fill=(41, 43, 43), font=ImageFont.load_default())
    draw.text((w + gap + 8, 4), 'TAVOLA MADRE', fill=(41, 43, 43),
              font=ImageFont.load_default())
    draw.text((w * 2 + gap * 2 + 8, 4), 'LOTTO 12', fill=(41, 43, 43),
              font=ImageFont.load_default())
    for image, x in ((atlas, 0), (ref, w + gap), (previous, w * 2 + gap * 2)):
        backdrop = Image.new('RGB', image.size, BG)
        backdrop.paste(image, mask=image.getchannel('A'))
        sheet.paste(backdrop.resize((w, h), Image.Resampling.NEAREST), (x, top))
    sheet.save(SHEET, optimize=True)
    print('Creati atlante 384x160 RGBA e confronto a tre tavole 3516x502 RGB')


if __name__ == '__main__':
    main()
