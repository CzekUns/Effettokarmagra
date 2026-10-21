#!/usr/bin/env python3
"""Lotto 10: quattro pedoni, quattro direzioni, quattro frame per direzione.

Adattamento a zone dei frame della tavola pedoni originale: mantiene le
camminate e la scala, cambia abiti, accessori e identità.
"""
from collections import deque
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

HERE = Path(__file__).resolve().parent
REF = HERE / 'riferimento-pedoni.png'
LOTTO2 = HERE / 'riferimento-lotto2.png'
ATLAS = HERE / 'pedoni-lotto10-4x4frames-24x40-rgba.png'
SHEET = HERE / 'sheet.png'
CW, CH = 24, 40
BG = (242, 238, 223)
OUT = (28, 27, 28, 255)

# Ogni nuovo soggetto usa uno scheletro di camminata della reference.
# Ordine originale: uomo blu, donna scura, anziano beige, ragazzo giallo.
SOURCE = (2, 3, 1, 0)
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
    """Ricolora zone dei frame originali; alpha e passo restano quelli madre."""
    pixels = cell.load()
    skin = ((197, 145, 115), (183, 123, 88), (174, 116, 85), (222, 159, 113))[who]
    skin_shadow = ((141, 96, 76), (130, 82, 58), (122, 76, 56), (159, 106, 73))[who]
    for y in range(CH):
        for x in range(CW):
            r, g, b, a = pixels[x, y]
            if not a:
                pixels[x, y] = (0, 0, 0, 0)
                continue
            c = (r, g, b, a)
            if match(c, 'skin'):
                pixels[x, y] = (*skin, 255)
            elif match(c, 'shadow_skin'):
                pixels[x, y] = (*skin_shadow, 255)
            elif who == 0:  # Signora anziana: cappotto carbone, gonna marrone.
                if match(c, 'cream'):
                    pixels[x, y] = (68, 71, 74, 255)
                elif match(c, 'lightgrey') and 14 <= y <= 27:
                    pixels[x, y] = (104, 108, 108, 255)
                elif match(c, 'brown') and y >= 25:
                    pixels[x, y] = (75, 58, 54, 255)
                elif match(c, 'ochre') and y >= 25:
                    pixels[x, y] = (108, 85, 69, 255)
            elif who == 1:  # Ragazzo: felpa blu scuro e zaino verde spento.
                if match(c, 'yellow'):
                    pixels[x, y] = (56, 78, 103, 255)
                elif match(c, 'ochre') and 12 <= y <= 25:
                    pixels[x, y] = (39, 58, 74, 255)
            elif who == 2:  # Donna: giacca chiara con bordo scuro.
                if 8 <= x <= 16 and 15 <= y <= 27:
                    if match(c, 'dark'):
                        pixels[x, y] = (172, 166, 150, 255)
                    elif match(c, 'brown'):
                        pixels[x, y] = (189, 181, 161, 255)
                    elif match(c, 'ochre'):
                        pixels[x, y] = (207, 195, 170, 255)
                    elif match(c, 'blue') or match(c, 'navy'):
                        pixels[x, y] = (120, 116, 105, 255)
            else:  # Uomo: abito blu notte, camicia chiara.
                if match(c, 'navy'):
                    pixels[x, y] = (39, 54, 72, 255)
                elif match(c, 'blue'):
                    pixels[x, y] = (71, 87, 103, 255)
                elif match(c, 'grey') and y <= 27:
                    pixels[x, y] = (55, 68, 77, 255)
    return cell


def safe_dot(draw, alpha, x, y, color):
    if 0 <= x < CW and 0 <= y < CH and alpha.getpixel((x, y)):
        draw.point((x, y), fill=color)


def details(cell, who, direction, frame):
    d = ImageDraw.Draw(cell)
    alpha = cell.getchannel('A')
    step = (-1, 0, 1, 0)[frame]
    if who == 0:
        # Capelli grigio chiaro corti, cappotto con bavero e borsa della spesa.
        hy = 6 if direction == 1 else 5
        d.line((8, hy + 4, 8, hy + 2, 10, hy, 14, hy, 16, hy + 2, 16, hy + 4),
               fill=OUT, width=2)
        d.line((9, hy + 2, 11, hy + 1, 14, hy + 1),
               fill=(183, 181, 173, 255), width=2)
        d.line((9, hy + 4, 9, hy + 5), fill=(122, 121, 119, 255))
        if direction == 1:
            d.line((9, 16, 12, 19, 15, 16), fill=(150, 150, 140, 255))
            for yy in (22, 25):
                safe_dot(d, alpha, 12, yy, (177, 154, 123, 255))
        bx = 17 if direction in (0, 1, 3) else 4
        by = 22 + step
        d.line((bx, 18, bx + 1, 21 + step), fill=OUT)
        d.rectangle((bx - 1, by, bx + 3, by + 5), fill=OUT)
        d.rectangle((bx, by + 1, bx + 2, by + 4), fill=(126, 101, 76, 255))
        d.line((bx, by + 1, bx + 2, by + 1), fill=(183, 150, 103, 255))
    elif who == 1:
        # Cappuccio attorno al volto e zaino visibile da dietro.
        d.line((8, 11, 7, 8, 8, 5, 11, 3, 14, 3, 17, 5, 18, 8, 16, 11),
               fill=OUT, width=2)
        d.line((9, 6, 11, 4, 14, 4, 16, 6), fill=(89, 112, 131, 255))
        d.line((8, 9, 9, 11), fill=(90, 108, 125, 255))
        d.line((16, 9, 15, 11), fill=(88, 105, 121, 255))
        for x in (8, 15):
            for yy in range(15, 19):
                safe_dot(d, alpha, x, yy, (35, 50, 57, 255))
        if direction == 0:
            d.rectangle((9, 15, 15, 22), fill=OUT)
            d.rectangle((10, 16, 14, 21), fill=(80, 112, 98, 255))
            d.line((10, 17, 14, 17), fill=(126, 151, 128, 255))
    elif who == 2:
        # Borsa a tracolla: fascia diagonale sulla giacca e borsa al fianco.
        if direction == 1:
            d.line((9, 15, 15, 23), fill=(69, 56, 48, 255), width=2)
            d.line((10, 15, 15, 22), fill=(137, 104, 76, 255))
            d.rectangle((16, 22 + step, 19, 27 + step), fill=OUT)
            d.rectangle((17, 23 + step, 18, 26 + step), fill=(121, 87, 64, 255))
        elif direction == 0:
            d.line((15, 15, 9, 23), fill=(75, 57, 44, 255), width=2)
            d.rectangle((4, 22 + step, 7, 27 + step), fill=OUT)
            d.rectangle((5, 23 + step, 6, 26 + step), fill=(121, 87, 64, 255))
        else:
            bx = 17 if direction == 3 else 4
            d.line((11, 16, bx + 1, 22), fill=(77, 58, 45, 255))
            d.rectangle((bx, 22 + step, bx + 3, 27 + step), fill=OUT)
            d.rectangle((bx + 1, 23 + step, bx + 2, 26 + step), fill=(121, 87, 64, 255))
    else:
        # Camicia, cravatta rossa e valigetta tenuta dalla mano.
        if direction == 1:
            for x,y in ((10,15),(11,16),(13,16),(14,15)):
                safe_dot(d,alpha,x,y,(204,199,184,255))
            for yy in (17,18,19,20):
                safe_dot(d,alpha,12,yy,(132,51,49,255))
        elif direction in (2,3):
            for yy in range(16,19):
                safe_dot(d,alpha,12,yy,(192,186,173,255))
        if direction != 0:
            bx = 17 if direction in (1,3) else 3
            d.line((bx+1,19,bx+1,22+step), fill=OUT)
            d.rectangle((bx,22+step,bx+4,27+step), fill=OUT)
            d.rectangle((bx+1,23+step,bx+3,26+step), fill=(89,67,53,255))
            d.line((bx+1,23+step,bx+3,23+step), fill=(145,114,79,255))
        else:
            d.line((16,19,17,23+step), fill=OUT)
            d.rectangle((16,23+step,20,28+step), fill=OUT)
            d.rectangle((17,24+step,19,27+step), fill=(89,67,53,255))
    # Nessun RGB nascosto sotto l'alpha zero.
    px = cell.load()
    for y in range(CH):
        for x in range(CW):
            if px[x, y][3] == 0:
                px[x, y] = (0, 0, 0, 0)
    return cell


def remove_tiny_fragments(cell):
    """Toglie pixel isolati presenti in qualche frame della reference."""
    px = cell.load()
    remaining = {(x, y) for y in range(CH) for x in range(CW) if px[x, y][3]}
    while remaining:
        start = remaining.pop()
        component = [start]
        queue = deque([start])
        while queue:
            x, y = queue.popleft()
            for nx in range(x - 1, x + 2):
                for ny in range(y - 1, y + 2):
                    point = (nx, ny)
                    if point in remaining:
                        remaining.remove(point)
                        component.append(point)
                        queue.append(point)
        if len(component) <= 8:
            for x, y in component:
                px[x, y] = (0, 0, 0, 0)
    return cell


def main():
    if not REF.exists():
        raise SystemExit('Manca riferimento-pedoni.png, copia locale della reference obbligatoria')
    ref = Image.open(REF).convert('RGBA')
    if ref.size != (384, 160):
        raise SystemExit(f'Reference inattesa: {ref.size}, attesa 384x160')
    lotto2 = Image.open(LOTTO2).convert('RGBA')
    if lotto2.size != (384, 160):
        raise SystemExit(f'Lotto 2 inatteso: {lotto2.size}, atteso 384x160')
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
    draw.text((8, 4), 'LOTTO 10: QUATTRO PEDONI', fill=(41, 43, 43), font=ImageFont.load_default())
    draw.text((w + gap + 8, 4), 'TAVOLA MADRE', fill=(41, 43, 43),
              font=ImageFont.load_default())
    draw.text((w * 2 + gap * 2 + 8, 4), 'LOTTO 2', fill=(41, 43, 43),
              font=ImageFont.load_default())
    for image, x in ((atlas, 0), (ref, w + gap), (lotto2, w * 2 + gap * 2)):
        backdrop = Image.new('RGB', image.size, BG)
        backdrop.paste(image, mask=image.getchannel('A'))
        sheet.paste(backdrop.resize((w, h), Image.Resampling.NEAREST), (x, top))
    sheet.save(SHEET, optimize=True)
    print('Creati atlante 384x160 RGBA e confronto a tre tavole 3516x502 RGB')


if __name__ == '__main__':
    main()
