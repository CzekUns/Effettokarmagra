#!/usr/bin/env python3
"""Lotto 14: quattro pedoni, quattro direzioni, quattro frame per direzione.

Adattamento a zone dei frame della tavola pedoni originale: mantiene le
camminate e la scala, cambia abiti, accessori e identità.
"""
from collections import deque
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

HERE = Path(__file__).resolve().parent
REF = HERE / 'riferimento-pedoni.png'
PREVIOUS = HERE / 'riferimento-lotto13.png'
ATLAS = HERE / 'pedoni-lotto14-4x4frames-24x40-rgba.png'
SHEET = HERE / 'sheet.png'
CW, CH = 24, 40
BG = (242, 238, 223)
OUT = (28, 27, 28, 255)

# Ogni nuovo soggetto usa uno scheletro di camminata della reference.
# Ordine originale: uomo blu, donna scura, anziano beige, ragazzo giallo.
SOURCE = (0, 1, 0, 1)
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
    """Ricolora la tavola madre a zone; conserva camminata e silhouette."""
    px=cell.load()
    skins=((205,140,100),(227,175,134),(176,115,82),(191,125,91))
    shadows=((148,94,68),(165,120,89),(125,75,55),(134,82,61))
    for y in range(CH):
        for x in range(CW):
            r,g,b,a=px[x,y]
            if not a:px[x,y]=(0,0,0,0);continue
            c=(r,g,b,a)
            if match(c,'skin'):px[x,y]=(*skins[who],255)
            elif match(c,'shadow_skin'):px[x,y]=(*shadows[who],255)
            elif who==0: # Canottiera bianca e bermuda estivi.
                if 8<=x<=16 and 15<=y<=25:
                    if match(c,'navy') or match(c,'blue'):px[x,y]=(205,204,189,255)
                    elif match(c,'grey'):px[x,y]=(231,226,205,255)
                elif 25<=y<=32 and (match(c,'blue') or match(c,'navy')):
                    px[x,y]=(126,139,111,255)
            elif who==1: # Signora elegante in blu.
                if 7<=x<=17 and 15<=y<=31:
                    if match(c,'dark'):px[x,y]=(48,87,142,255)
                    elif match(c,'brown'):px[x,y]=(70,110,161,255)
                    elif match(c,'ochre'):px[x,y]=(107,148,185,255)
                    elif match(c,'blue') or match(c,'navy'):px[x,y]=(40,69,113,255)
            elif who==2: # Studente: giacca verde salvia.
                if match(c,'navy'):px[x,y]=(72,107,99,255)
                elif match(c,'blue'):px[x,y]=(104,143,126,255)
                elif match(c,'grey') and y<=27:px[x,y]=(74,100,91,255)
            else: # Abito lungo azzurro petrolio.
                if 7<=x<=17 and 15<=y<=33:
                    if match(c,'dark'):px[x,y]=(42,97,104,255)
                    elif match(c,'brown'):px[x,y]=(57,131,130,255)
                    elif match(c,'ochre'):px[x,y]=(88,166,155,255)
                    elif match(c,'blue') or match(c,'navy'):px[x,y]=(35,75,87,255)
    return cell


def safe_dot(draw,alpha,x,y,color):
    if 0<=x<CW and 0<=y<CH and alpha.getpixel((x,y)):
        draw.point((x,y),fill=color)


def details(cell,who,direction,frame):
    d=ImageDraw.Draw(cell)
    alpha=cell.getchannel('A')
    step=(-1,0,1,0)[frame]
    if who==0:
        # Spalline della canottiera, pelle alle braccia, bermuda.
        for xx in (9,15):
            for yy in range(15,20):safe_dot(d,alpha,xx,yy,(124,122,108,255))
        for xx in (9,14):
            for yy in range(27,31):safe_dot(d,alpha,xx,yy,(146,154,117,255))
        d.line((10,23,14,23),fill=(183,183,166,255))
        d.line((8,5,11,4,14,5,17,7),fill=(52,40,35,255),width=2)
    elif who==1:
        # Cappello a falda e nastro color cielo, vestito blu.
        d.ellipse((6,4,18,10),fill=OUT)
        d.ellipse((8,3,16,8),fill=(87,124,170,255))
        d.line((7,7,17,7),fill=(180,191,185,255),width=2)
        d.line((9,4,14,4),fill=(148,178,196,255))
        if direction==1:
            d.line((9,18,15,18),fill=(117,154,188,255))
            d.line((10,26,14,26),fill=(124,159,187,255))
        elif direction==0:
            d.line((9,19,15,19),fill=(106,144,183,255))
    elif who==2:
        # Occhiali e cartellina tenuta al fianco.
        if direction==1:
            d.line((8,9,11,9),fill=OUT)
            d.line((13,9,16,9),fill=OUT)
            d.point((12,9),fill=(111,117,105,255))
            for xx in (9,10,14,15):d.point((xx,10),fill=(125,149,152,255))
        elif direction in (2,3):
            d.line((9,9,14,9),fill=OUT)
            d.point((10,10),fill=(125,149,152,255))
        bx=17 if direction in (0,1,3) else 3
        d.line((15 if bx>12 else 8,19,bx+1,21+step),fill=OUT)
        d.rectangle((bx,21+step,bx+3,27+step),fill=OUT)
        d.rectangle((bx+1,22+step,bx+2,26+step),fill=(177,146,93,255))
        d.line((bx+1,22+step,bx+2,22+step),fill=(220,188,127,255))
    else:
        # Velo corallo/ocra avvolto sul capo, volto lasciato libero davanti.
        d.ellipse((7,3,17,13),fill=OUT)
        d.ellipse((8,4,16,12),fill=(174,82,73,255))
        d.line((9,4,15,4),fill=(225,142,97,255),width=2)
        if direction==1:
            d.ellipse((10,7,14,11),fill=(191,125,91,255))
            d.line((8,12,10,16),fill=(223,136,91,255),width=2)
            d.line((16,12,14,16),fill=(203,112,79,255),width=2)
        else:
            d.line((8,11,10,17),fill=(224,136,91,255),width=2)
            d.line((16,11,14,17),fill=(207,112,78,255),width=2)
        # L'orlo del vestito è lungo, ma lascia liberi i piedi animati.
        for xx in range(9,16):safe_dot(d,alpha,xx,30,(88,165,155,255))
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
        raise SystemExit(f'Lotto 13 inatteso: {previous.size}, atteso 384x160')
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
    draw.text((8, 4), 'LOTTO 14: QUATTRO PEDONI', fill=(41, 43, 43), font=ImageFont.load_default())
    draw.text((w + gap + 8, 4), 'TAVOLA MADRE', fill=(41, 43, 43),
              font=ImageFont.load_default())
    draw.text((w * 2 + gap * 2 + 8, 4), 'LOTTO 13', fill=(41, 43, 43),
              font=ImageFont.load_default())
    for image, x in ((atlas, 0), (ref, w + gap), (previous, w * 2 + gap * 2)):
        backdrop = Image.new('RGB', image.size, BG)
        backdrop.paste(image, mask=image.getchannel('A'))
        sheet.paste(backdrop.resize((w, h), Image.Resampling.NEAREST), (x, top))
    sheet.save(SHEET, optimize=True)
    print('Creati atlante 384x160 RGBA e confronto a tre tavole 3516x502 RGB')


if __name__ == '__main__':
    main()
