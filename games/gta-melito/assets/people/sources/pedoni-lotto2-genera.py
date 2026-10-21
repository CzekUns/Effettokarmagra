#!/usr/bin/env python3
"""Lotto 2: quattro pedoni, quattro direzioni, quattro frame per direzione.

Adattamento a zone dei frame della tavola pedoni originale: mantiene le
camminate e la scala, cambia abiti, accessori e identità.
"""
from collections import deque
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

HERE = Path(__file__).resolve().parent
REF = HERE / 'riferimento-pedoni.png'
ATLAS = HERE / 'pedoni-lotto2-4x4frames-24x40-rgba.png'
SHEET = HERE / 'sheet.png'
CW, CH = 24, 40
BG = (242, 238, 223)
OUT = (28, 27, 28, 255)

# Ogni nuovo soggetto usa uno scheletro di camminata della reference.
# Ordine originale: uomo blu, donna scura, anziano beige, ragazzo giallo.
SOURCE = (2, 3, 0, 1)
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
    pixels = cell.load()
    for y in range(CH):
        for x in range(CW):
            r, g, b, a = pixels[x, y]
            if not a:
                pixels[x, y] = (0, 0, 0, 0)
                continue
            c = (r, g, b, a)
            if who == 0:  # Signora anziana: cardigan malva e gonna bruna.
                if match(c, 'cream'):
                    pixels[x, y] = (161, 139, 150, 255)
                elif match(c, 'lightgrey') and 14 <= y <= 27:
                    pixels[x, y] = (115, 94, 110, 255)
                elif match(c, 'brown') and y >= 25:
                    pixels[x, y] = (82, 64, 59, 255)
                elif match(c, 'ochre') and y >= 25:
                    pixels[x, y] = (119, 91, 77, 255)
            elif who == 1:  # Ragazzo: felpa e zaino petrolio.
                if match(c, 'yellow'):
                    pixels[x, y] = (39, 126, 137, 255)
                elif match(c, 'ochre') and 12 <= y <= 25:
                    pixels[x, y] = (35, 85, 96, 255)
            elif who == 2:  # Uomo: giacca da lavoro grigio ardesia.
                if match(c, 'navy'):
                    pixels[x, y] = (65, 79, 86, 255)
                elif match(c, 'blue'):
                    pixels[x, y] = (105, 120, 122, 255)
                elif match(c, 'grey') and y <= 27:
                    pixels[x, y] = (77, 87, 89, 255)
            else:  # Ragazza: cappotto rosso, capelli conservati.
                if 7 <= x <= 17 and 15 <= y <= 28:
                    if match(c, 'dark'):
                        pixels[x, y] = (153, 44, 46, 255)
                    elif match(c, 'outline'):
                        pixels[x, y] = (92, 28, 32, 255)
                    elif match(c, 'brown'):
                        pixels[x, y] = (177, 58, 54, 255)
                    elif match(c, 'ochre'):
                        pixels[x, y] = (204, 78, 62, 255)
                    elif match(c, 'blue') or match(c, 'navy'):
                        pixels[x, y] = (121, 39, 43, 255)
    return cell


def safe_dot(draw, alpha, x, y, color):
    if 0 <= x < CW and 0 <= y < CH and alpha.getpixel((x, y)):
        draw.point((x, y), fill=color)


def details(cell, who, direction, frame):
    d = ImageDraw.Draw(cell)
    alpha = cell.getchannel('A')
    step = (-1, 0, 1, 0)[frame]
    if who == 0:
        # Capelli corti grigi: una corona che lascia visibile il volto.
        hy = 6 if direction == 1 else 5
        d.line((8, hy + 4, 8, hy + 2, 10, hy, 14, hy, 16, hy + 2, 16, hy + 4),
               fill=OUT, width=2)
        d.line((9, hy + 2, 11, hy + 1, 14, hy + 1),
               fill=(171, 169, 164, 255), width=2)
        d.line((8, hy + 4, 9, hy + 5), fill=(119, 116, 115, 255))
        d.line((16, hy + 4, 15, hy + 5), fill=(104, 103, 104, 255))
        # Borsa della spesa: piccolo sacchetto con manico unito alla mano.
        bx = 17 if direction in (0, 1, 3) else 4
        by = 22 + step
        d.line((bx, 18, bx + 1, 21 + step), fill=OUT, width=1)
        d.rectangle((bx - 1, by, bx + 3, by + 5), fill=OUT)
        d.rectangle((bx, by + 1, bx + 2, by + 4), fill=(135, 104, 73, 255))
        d.line((bx, by + 1, bx + 2, by + 1), fill=(183, 146, 102, 255))
    elif who == 1:
        # Fascia e padiglioni delle cuffie, più due cinghie dello zaino.
        d.line((8, 9, 8, 6, 10, 4, 14, 4, 16, 6, 16, 9),
               fill=(119, 128, 128, 255), width=1)
        for x in (7, 16):
            d.rectangle((x, 8, x + 1, 11), fill=OUT)
            d.line((x, 9, x, 10), fill=(120, 133, 133, 255))
        for x in (8, 15):
            for y in range(15, 19):
                safe_dot(d, alpha, x, y, (29, 57, 62, 255))
        if direction == 0:
            for x in range(9, 15):
                safe_dot(d, alpha, x, 17, (74, 158, 160, 255))
    elif who == 2:
        # Colletto e cravatta, leggibili soprattutto frontalmente.
        if direction == 1:
            for x, y in ((10, 15), (11, 16), (13, 16), (14, 15)):
                safe_dot(d, alpha, x, y, (203, 198, 182, 255))
            for y in (17, 18, 19, 20):
                safe_dot(d, alpha, 12, y, (120, 47, 48, 255))
        elif direction in (2, 3):
            for y in range(16, 19):
                safe_dot(d, alpha, 12, y, (194, 185, 166, 255))
        for x in (7, 16):
            safe_dot(d, alpha, x, 20, (139, 147, 144, 255))
    else:
        # Rever e fila di bottoni sul cappotto.
        if direction == 1:
            d.line((9, 16, 12, 20), fill=(207, 86, 73, 255))
            d.line((15, 16, 12, 20), fill=(103, 31, 35, 255))
            for y in (22, 25):
                safe_dot(d, alpha, 12, y, (224, 165, 112, 255))
        elif direction == 0:
            for y in range(18, 26):
                safe_dot(d, alpha, 12, y, (193, 66, 57, 255))
    # Cancella RGB residuo dei pixel trasparenti, senza cambiare il soggetto.
    pix = cell.load()
    for y in range(CH):
        for x in range(CW):
            if pix[x, y][3] == 0:
                pix[x, y] = (0, 0, 0, 0)
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
        if len(component) <= 3:
            for x, y in component:
                px[x, y] = (0, 0, 0, 0)
    return cell


def main():
    if not REF.exists():
        raise SystemExit('Manca riferimento-pedoni.png, copia locale della reference obbligatoria')
    ref = Image.open(REF).convert('RGBA')
    if ref.size != (384, 160):
        raise SystemExit(f'Reference inattesa: {ref.size}, attesa 384x160')
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
    sheet = Image.new('RGB', (w * 2 + gap, h + top), BG)
    draw = ImageDraw.Draw(sheet)
    draw.text((8, 4), 'LOTTO 2: NUOVI PEDONI', fill=(41, 43, 43), font=ImageFont.load_default())
    draw.text((w + gap + 8, 4), 'REFERENCE ESISTENTE', fill=(41, 43, 43),
              font=ImageFont.load_default())
    for image, x in ((atlas, 0), (ref, w + gap)):
        backdrop = Image.new('RGB', image.size, BG)
        backdrop.paste(image, mask=image.getchannel('A'))
        sheet.paste(backdrop.resize((w, h), Image.Resampling.NEAREST), (x, top))
    sheet.save(SHEET, optimize=True)
    print('Creati atlante 384x160 RGBA e confronto affiancato 2334x502 RGB')


if __name__ == '__main__':
    main()
