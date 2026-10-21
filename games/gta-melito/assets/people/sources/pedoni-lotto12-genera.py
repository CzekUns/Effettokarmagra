#!/usr/bin/env python3
"""Lotto 12: quattro pedoni, quattro direzioni, quattro frame per direzione.

Adattamento a zone dei frame della tavola pedoni originale: mantiene le
camminate e la scala, cambia abiti, accessori e identità.
"""
from collections import deque
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

HERE = Path(__file__).resolve().parent
REF = HERE / 'riferimento-pedoni.png'
PREVIOUS = HERE / 'riferimento-lotto11.png'
ATLAS = HERE / 'pedoni-lotto12-4x4frames-24x40-rgba.png'
SHEET = HERE / 'sheet.png'
CW, CH = 24, 40
BG = (242, 238, 223)
OUT = (28, 27, 28, 255)

# Ogni nuovo soggetto usa uno scheletro di camminata della reference.
# Ordine originale: uomo blu, donna scura, anziano beige, ragazzo giallo.
SOURCE = (2, 2, 3, 1)
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
    """Abiti e carnagioni nuovi sui frame madre, mantenendo passo e alpha."""
    px=cell.load()
    skins=((202,151,116),(218,169,130),(166,104,74),(192,129,93))
    shadows=((146,101,75),(158,116,85),(117,69,49),(138,86,63))
    for y in range(CH):
        for x in range(CW):
            r,g,b,a=px[x,y]
            if not a:px[x,y]=(0,0,0,0);continue
            c=(r,g,b,a)
            if match(c,'skin'):px[x,y]=(*skins[who],255)
            elif match(c,'shadow_skin'):px[x,y]=(*shadows[who],255)
            elif who==0: # Nonno: giacca grigio chiaro, pantaloni bruni.
                if match(c,'cream'):px[x,y]=(160,166,157,255)
                elif match(c,'lightgrey') and 14<=y<=27:px[x,y]=(111,118,113,255)
                elif y>=25 and (match(c,'brown') or match(c,'ochre')):
                    px[x,y]=(97,81,67,255)
            elif who==1: # Nonna: vestito lilla a fiori, scarpe scure.
                if match(c,'cream'):px[x,y]=(158,102,131,255)
                elif match(c,'lightgrey') and 14<=y<=29:px[x,y]=(119,76,107,255)
                elif y>=25 and (match(c,'brown') or match(c,'ochre')):
                    px[x,y]=(126,79,107,255)
            elif who==2: # Ragazzo: maglietta gialla e jeans petrolio.
                if match(c,'yellow'):px[x,y]=(230,176,40,255)
                elif match(c,'ochre') and 12<=y<=26:px[x,y]=(178,121,24,255)
                elif y>=27 and (match(c,'brown') or match(c,'dark')):
                    px[x,y]=(48,76,89,255)
            else: # Ragazza: giacca di jeans, pantaloni scuri.
                if 7<=x<=17 and 15<=y<=27:
                    if match(c,'dark'):px[x,y]=(57,98,132,255)
                    elif match(c,'brown'):px[x,y]=(78,130,162,255)
                    elif match(c,'ochre'):px[x,y]=(112,156,181,255)
                    elif match(c,'blue') or match(c,'navy'):px[x,y]=(42,75,110,255)
    return cell


def safe_dot(draw,alpha,x,y,color):
    if 0<=x<CW and 0<=y<CH and alpha.getpixel((x,y)):
        draw.point((x,y),fill=color)


def details(cell,who,direction,frame):
    d=ImageDraw.Draw(cell)
    alpha=cell.getchannel('A')
    step=(-1,0,1,0)[frame]
    if who==0:
        # Coppola bassa e bastone in mano, punta sopra il margine inferiore.
        d.ellipse((7,4,17,9),fill=OUT)
        d.ellipse((8,5,16,8),fill=(79,82,74,255))
        d.line((8,8,17,8),fill=(45,48,45,255),width=2)
        d.line((11,5,14,5),fill=(122,126,112,255))
        cx=18 if direction in (0,1,3) else 4
        hand_x=16 if cx>12 else 7
        d.line((hand_x,20,cx,21+step),fill=OUT)
        d.line((cx,21+step,cx,34),fill=(74,55,40,255),width=2)
        d.point((cx,34),fill=OUT)
        d.point((cx+1 if cx<12 else cx-1,34),fill=(111,82,54,255))
    elif who==1:
        # Chignon grigio e fiori puntiformi sul vestito.
        d.ellipse((9,3,15,8),fill=OUT)
        d.line((10,4,14,4),fill=(184,181,171,255),width=2)
        d.line((8,7,9,10),fill=(149,146,139,255),width=2)
        d.line((16,7,15,10),fill=(143,139,134,255),width=2)
        for xx,yy in ((9,17),(14,18),(11,21),(16,23),(8,25),(13,27)):
            safe_dot(d,alpha,xx,yy,(216,190,125,255))
            safe_dot(d,alpha,xx+1,yy,(231,208,160,255))
        if direction==1:
            d.line((10,16,14,16),fill=(198,139,158,255))
    elif who==2:
        # Cuffie azzurre chiaramente separate dalla maglia gialla.
        d.line((8,9,8,6,10,4,14,4,16,6,16,9),fill=(102,166,184,255))
        for hx in (7,16):
            d.rectangle((hx,8,hx+1,11),fill=OUT)
            d.line((hx,9,hx,10),fill=(93,155,176,255))
        if direction==0:
            d.line((9,16,15,16),fill=(245,200,73,255))
        if direction==1:
            d.line((10,21,14,21),fill=(178,121,24,255))
    else:
        # Giacca denim con bottoni chiari; zaino bordeaux.
        if direction==0:
            d.rectangle((8,15,16,23),fill=OUT)
            d.rectangle((9,16,15,22),fill=(115,67,75,255))
            d.line((10,17,14,17),fill=(170,112,112,255))
            d.point((12,21),fill=(207,158,116,255))
        else:
            for xx in (8,16):
                for yy in range(16,20):
                    safe_dot(d,alpha,xx,yy,(81,47,57,255))
            if direction==1:
                d.line((9,16,12,19,15,16),fill=(137,175,190,255))
                for yy in (21,24):safe_dot(d,alpha,12,yy,(197,187,157,255))
            else:
                bx=17 if direction==3 else 4
                d.rectangle((bx,18+step,bx+2,24+step),fill=OUT)
                d.rectangle((bx+1,19+step,bx+1,23+step),fill=(113,67,76,255))
    p=cell.load()
    for yy in range(CH):
        for xx in range(CW):
            if p[xx,yy][3]==0:p[xx,yy]=(0,0,0,0)
    return cell


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
        raise SystemExit(f'Lotto 11 inatteso: {previous.size}, atteso 384x160')
    atlas = Image.new('RGBA', ref.size, (0, 0, 0, 0))
    for direction in range(4):
        for who, source in enumerate(SOURCE):
            for frame in range(4):
                sx = (source * 4 + frame) * CW
                cell = ref.crop((sx, direction * CH, sx + CW, (direction + 1) * CH))
                cell = remove_tiny_fragments(details(
                    edit_colors(cell, who, direction), who, direction, frame))
                atlas.alpha_composite(cell, ((who * 4 + frame) * CW, direction * CH))
    atlas.save(ATLAS, optimize=True)

    zoom, gap, top = 3, 30, 22
    w, h = 384 * zoom, 160 * zoom
    sheet = Image.new('RGB', (w * 3 + gap * 2, h + top), BG)
    draw = ImageDraw.Draw(sheet)
    draw.text((8, 4), 'LOTTO 12: QUATTRO PEDONI', fill=(41, 43, 43), font=ImageFont.load_default())
    draw.text((w + gap + 8, 4), 'TAVOLA MADRE', fill=(41, 43, 43),
              font=ImageFont.load_default())
    draw.text((w * 2 + gap * 2 + 8, 4), 'LOTTO 11', fill=(41, 43, 43),
              font=ImageFont.load_default())
    for image, x in ((atlas, 0), (ref, w + gap), (previous, w * 2 + gap * 2)):
        backdrop = Image.new('RGB', image.size, BG)
        backdrop.paste(image, mask=image.getchannel('A'))
        sheet.paste(backdrop.resize((w, h), Image.Resampling.NEAREST), (x, top))
    sheet.save(SHEET, optimize=True)
    print('Creati atlante 384x160 RGBA e confronto a tre tavole 3516x502 RGB')


if __name__ == '__main__':
    main()
