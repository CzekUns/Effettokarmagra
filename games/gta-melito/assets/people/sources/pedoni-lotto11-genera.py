#!/usr/bin/env python3
"""Lotto 11: quattro pedoni, quattro direzioni, quattro frame per direzione.

Adattamento a zone dei frame della tavola pedoni originale: mantiene le
camminate e la scala, cambia abiti, accessori e identità.
"""
from collections import deque
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

HERE = Path(__file__).resolve().parent
REF = HERE / 'riferimento-pedoni.png'
PREVIOUS = HERE / 'riferimento-lotto10.png'
ATLAS = HERE / 'pedoni-lotto11-4x4frames-24x40-rgba.png'
SHEET = HERE / 'sheet.png'
CW, CH = 24, 40
BG = (242, 238, 223)
OUT = (28, 27, 28, 255)

# Ogni nuovo soggetto usa uno scheletro di camminata della reference.
# Ordine originale: uomo blu, donna scura, anziano beige, ragazzo giallo.
SOURCE = (1, 2, 1, 3)
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


def edit_colors(cell, who, direction):
    """Adatta i colori della tavola madre, mantenendo alpha e passo."""
    px=cell.load()
    skins=((202,143,108),(170,106,77),(224,164,123),(186,126,88))
    shadows=((144,96,73),(120,73,53),(163,111,83),(133,86,61))
    for y in range(CH):
        for x in range(CW):
            r,g,b,a=px[x,y]
            if not a:
                px[x,y]=(0,0,0,0);continue
            c=(r,g,b,a)
            if match(c,'skin'):
                px[x,y]=(*skins[who],255)
            elif match(c,'shadow_skin'):
                px[x,y]=(*shadows[who],255)
            elif who==0: # Ragazza: maglia bianca e jeans blu.
                if 8<=x<=16 and 15<=y<=26:
                    if match(c,'dark'):px[x,y]=(204,202,189,255)
                    elif match(c,'brown'):px[x,y]=(224,220,204,255)
                    elif match(c,'ochre'):px[x,y]=(238,231,209,255)
                elif y>=27 and (match(c,'brown') or match(c,'ochre')):
                    px[x,y]=(70,91,113,255)
            elif who==1: # Uomo robusto: maglietta estiva e pantaloncini.
                if match(c,'cream'):px[x,y]=(202,170,108,255)
                elif match(c,'lightgrey') and 14<=y<=26:px[x,y]=(154,116,83,255)
                elif y>=25 and (match(c,'brown') or match(c,'ochre')):
                    px[x,y]=(95,103,99,255)
            elif who==2: # Vestito corallo.
                if 7<=x<=17 and 15<=y<=29:
                    if match(c,'dark'):px[x,y]=(178,65,66,255)
                    elif match(c,'brown'):px[x,y]=(213,92,77,255)
                    elif match(c,'ochre'):px[x,y]=(230,120,89,255)
                    elif match(c,'navy') or match(c,'blue'):px[x,y]=(139,50,56,255)
            else: # Sportivo: tuta chiara, scarpe grigio perla.
                if match(c,'yellow'):px[x,y]=(173,188,182,255)
                elif match(c,'ochre') and 12<=y<=28:px[x,y]=(120,150,153,255)
                elif match(c,'brown') and y>=28:px[x,y]=(155,166,165,255)
    return cell


def safe_dot(draw,alpha,x,y,color):
    if 0<=x<CW and 0<=y<CH and alpha.getpixel((x,y)):
        draw.point((x,y),fill=color)


def details(cell,who,direction,frame):
    d=ImageDraw.Draw(cell)
    alpha=cell.getchannel('A')
    step=(-1,0,1,0)[frame]
    if who==0:
        # Capelli raccolti, coda/ciocca dietro e telefono nella mano.
        d.ellipse((10,3,14,7),fill=(57,38,32,255))
        d.line((9,5,8,8,9,11),fill=(58,37,31,255),width=2)
        if direction==0:
            d.line((14,7,16,11,15,14),fill=OUT,width=2)
            d.line((14,8,15,12),fill=(82,51,36,255))
        phone_x=17 if direction in (0,1,3) else 3
        d.line((15 if phone_x>12 else 8,19,phone_x+1,21),fill=OUT)
        d.rectangle((phone_x,20+step,phone_x+2,24+step),fill=OUT)
        d.point((phone_x+1,21+step),fill=(102,156,166,255))
        if direction==1:
            d.line((10,16,14,16),fill=(241,231,212,255))
    elif who==1:
        # Maglietta a righe, busto più largo, pantaloncini.
        d.line((7,6,10,5,14,5,17,7),fill=(62,44,37,255),width=2)
        for yy,color in ((16,(185,91,69,255)),(19,(65,127,132,255)),
                         (22,(185,91,69,255))):
            for xx in range(6,19):
                safe_dot(d,alpha,xx,yy,color)
        for xx in (8,9,14,15):
            for yy in (27,28):
                safe_dot(d,alpha,xx,yy,(106,116,103,255))
        if direction==1:
            d.line((7,14,17,14),fill=(203,175,116,255))
    elif who==2:
        # Vestito corallo con due toni e borsa beige al fianco.
        if direction==1:
            d.line((9,17,12,20,15,17),fill=(238,143,104,255))
            d.line((9,25,15,25),fill=(233,125,93,255))
        elif direction==0:
            d.line((10,19,14,19),fill=(224,110,83,255))
        bx=17 if direction in (0,1,3) else 4
        d.line((bx,19,bx+1,22+step),fill=OUT)
        d.rectangle((bx-1,23+step,bx+3,28+step),fill=OUT)
        d.rectangle((bx,24+step,bx+2,27+step),fill=(178,145,104,255))
        d.line((bx,24+step,bx+2,24+step),fill=(218,185,134,255))
    else:
        # Tuta sportiva chiara, bande sulle maniche, sneakers.
        d.line((8,6,11,4,15,5,17,7),fill=(75,66,52,255),width=2)
        for xx in (8,15):
            for yy in range(16,25):
                safe_dot(d,alpha,xx,yy,(72,131,141,255))
        for xx in (10,14):
            for yy in range(27,34):
                safe_dot(d,alpha,xx,yy,(79,137,143,255))
        # Un pixel sul piede proteso nei due frame di passo.
        if frame in (1,3):
            foot_y=37
            row=[x for x in range(3,21) if alpha.getpixel((x,foot_y))]
            if row:
                edge=(min(row)-1) if frame==1 else (max(row)+1)
                d.point((edge,foot_y),fill=(66,79,81,255))
    # Rimuove RGB residuo sotto alpha 0.
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
        raise SystemExit(f'Lotto 10 inatteso: {previous.size}, atteso 384x160')
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
    draw.text((8, 4), 'LOTTO 11: QUATTRO PEDONI', fill=(41, 43, 43), font=ImageFont.load_default())
    draw.text((w + gap + 8, 4), 'TAVOLA MADRE', fill=(41, 43, 43),
              font=ImageFont.load_default())
    draw.text((w * 2 + gap * 2 + 8, 4), 'LOTTO 10', fill=(41, 43, 43),
              font=ImageFont.load_default())
    for image, x in ((atlas, 0), (ref, w + gap), (previous, w * 2 + gap * 2)):
        backdrop = Image.new('RGB', image.size, BG)
        backdrop.paste(image, mask=image.getchannel('A'))
        sheet.paste(backdrop.resize((w, h), Image.Resampling.NEAREST), (x, top))
    sheet.save(SHEET, optimize=True)
    print('Creati atlante 384x160 RGBA e confronto a tre tavole 3516x502 RGB')


if __name__ == '__main__':
    main()
