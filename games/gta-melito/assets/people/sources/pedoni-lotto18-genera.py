#!/usr/bin/env python3
"""Quattro personaggi × quattro direzioni × quattro frame, adattati dalla tavola madre."""
from collections import deque
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

HERE = Path(__file__).resolve().parent
LOTTO = 18
ASSETS = HERE.parent
REF = ASSETS / 'pedoni-4x4frames-24x40-rgba.png'
PREVIOUS_LOTTO = 17
PREVIOUS = ASSETS / f'pedoni-lotto{PREVIOUS_LOTTO}-4x4frames-24x40-rgba.png'
ATLAS = ASSETS / f'pedoni-lotto{LOTTO}-4x4frames-24x40-rgba.png'
SHEET = HERE / 'sheet.png'
CW, CH = 24, 40
BG = (242, 238, 223)
OUT = (28, 27, 28, 255)
SRC = (0, 0, 0, 2) if LOTTO == 17 else (2, 0, 1, 2)

PALETTE = {
    'navy': (33, 46, 74), 'grey': (90, 91, 94), 'blue': (54, 75, 98),
    'skin': (226, 152, 100), 'shadow_skin': (163, 112, 79),
    'dark': (38, 32, 30), 'brown': (80, 49, 31), 'ochre': (152, 97, 35),
    'lightgrey': (163, 156, 149), 'tan': (103, 73, 41),
    'cream': (220, 202, 178), 'yellow': (225, 160, 8),
}
SKINS = ((211, 145, 101), (229, 175, 127), (174, 111, 79), (191, 128, 88))
SHADOWS = ((150, 95, 68), (163, 116, 83), (121, 74, 54), (133, 84, 62))

# Ombra, luce, pantaloni per ognuno; i toni chiari restano sotto 210 sui bordi.
CLOTHES = (
    ((31, 63, 111), (58, 101, 157), (39, 55, 91)),
    ((185, 182, 160), (203, 199, 177), (56, 58, 69)),
    ((41, 105, 70), (76, 153, 91), (38, 88, 60)),
    ((31, 31, 40), (54, 51, 59), (29, 29, 37)),
) if LOTTO == 17 else (
    ((187, 165, 105), (206, 187, 132), (92, 112, 115)),
    ((196, 110, 58), (210, 151, 84), (65, 81, 110)),
    ((52, 78, 132), (90, 117, 162), (46, 63, 104)),
    ((114, 98, 79), (158, 139, 110), (66, 66, 71)),
)


def recolor(cell, who):
    px = cell.load()
    shade, light, trousers = CLOTHES[who]
    for y in range(CH):
        for x in range(CW):
            r, g, b, a = px[x, y]
            if not a:
                px[x, y] = (0, 0, 0, 0)
                continue
            rgb = (r, g, b)
            if rgb == PALETTE['skin']:
                px[x, y] = (*SKINS[who], 255)
            elif rgb == PALETTE['shadow_skin']:
                px[x, y] = (*SHADOWS[who], 255)
            elif 14 <= y <= 33 and 7 <= x <= 17:
                if y >= 26 and rgb in (PALETTE['navy'], PALETTE['blue'], PALETTE['grey']):
                    px[x, y] = (*trousers, 255)
                elif rgb in (PALETTE['navy'], PALETTE['dark'], PALETTE['tan']):
                    px[x, y] = (*shade, 255)
                elif rgb in (PALETTE['blue'], PALETTE['brown'], PALETTE['lightgrey']):
                    px[x, y] = (*light, 255)
                elif rgb in (PALETTE['ochre'], PALETTE['cream'], PALETTE['yellow']):
                    px[x, y] = (*light, 255)
    return cell


def dot_on_body(d, alpha, xy, color):
    x, y = xy
    if 0 <= x < CW and 0 <= y < CH and alpha.getpixel(xy):
        d.point(xy, fill=color)


def details(cell, who, direction, frame):
    d = ImageDraw.Draw(cell)
    alpha = cell.getchannel('A')
    step = (-1, 0, 1, 0)[frame]
    right = direction in (0, 1, 3)
    ax = 18 if right else 3
    joint = 15 if right else 8
    if LOTTO == 17:
        if who == 0:  # Postino: fascia gialla e borsa a tracolla.
            for y in range(17, 26):
                x = 9 + (y - 17) // 3 if right else 15 - (y - 17) // 3
                dot_on_body(d, alpha, (x, y), (224, 174, 45, 255))
            d.line((joint, 20, ax, 22 + step), fill=OUT)
            d.rectangle((ax, 22 + step, ax + 3, 28 + step), fill=OUT)
            d.rectangle((ax + 1, 23 + step, ax + 2, 27 + step), fill=(180, 127, 61, 255))
            d.line((ax + 1, 24 + step, ax + 2, 24 + step), fill=(224, 175, 73, 255))
        elif who == 1:  # Pizzaiolo: grembiule e cartoni tenuti al fianco.
            for y in range(19, 29):
                for x in range(10, 15):
                    dot_on_body(d, alpha, (x, y), (197, 195, 176, 255))
            d.line((9, 22, 15, 22), fill=(104, 76, 62, 255))
            d.line((joint, 22, ax, 23 + step), fill=OUT)
            d.rectangle((ax, 22 + step, ax + 4, 28 + step), fill=OUT)
            for y in (23 + step, 25 + step, 27 + step):
                d.line((ax + 1, y, ax + 3, y), fill=(190, 131, 72, 255))
        elif who == 2:  # Netturbino: giubba verde, fascia arancio, scopa.
            for y in (19, 20, 23):
                for x in range(9, 16):
                    dot_on_body(d, alpha, (x, y), (212, 123, 43, 255))
            d.line((joint, 22, ax, 23), fill=OUT)
            d.line((ax + 1, 17, ax + 1, 35), fill=OUT, width=2)
            d.line((ax + 1, 19, ax + 1, 32), fill=(165, 122, 71, 255))
            d.rectangle((ax - 1, 33, ax + 3, 37), fill=OUT)
            d.line((ax, 34, ax + 2, 34), fill=(155, 115, 65, 255))
        else:  # Prete: talare lunga e colletto bianco.
            for y in range(25, 34):
                for x in range(8, 17):
                    dot_on_body(d, alpha, (x, y), (38, 38, 46, 255))
            d.rectangle((11, 15, 13, 17), fill=OUT)
            d.line((11, 16, 13, 16), fill=(205, 203, 190, 255))
            d.line((12, 18, 12, 30), fill=(78, 75, 82, 255))
    else:
        if who == 0:  # Turista: cappello di paglia e macchina fotografica.
            d.ellipse((5, 5, 19, 10), fill=OUT)
            d.ellipse((7, 3, 17, 9), fill=(189, 156, 91, 255))
            d.line((7, 8, 17, 8), fill=(115, 89, 55, 255))
            d.line((9, 16, 11, 21), fill=OUT)
            d.line((15, 16, 13, 21), fill=OUT)
            d.rectangle((10, 20, 15, 25), fill=OUT)
            d.rectangle((11, 21, 14, 24), fill=(98, 107, 109, 255))
            d.point((12, 22), fill=(181, 185, 165, 255))
        elif who == 1:  # Skateboard sotto un braccio.
            d.line((joint, 20, ax, 22 + step), fill=OUT)
            d.rounded_rectangle((ax, 18 + step, ax + 3, 32 + step), radius=2, fill=OUT)
            d.line((ax + 1, 20 + step, ax + 1, 30 + step), fill=(157, 88, 62, 255))
            d.point((ax + 3, 21 + step), fill=(72, 74, 83, 255))
            d.point((ax + 3, 29 + step), fill=(72, 74, 83, 255))
        elif who == 2:  # Tailleur, tacchi e cartella.
            d.line((9, 19, 12, 23, 15, 19), fill=(179, 159, 151, 255))
            d.line((joint, 20, ax, 22 + step), fill=OUT)
            d.rectangle((ax, 22 + step, ax + 4, 28 + step), fill=OUT)
            d.rectangle((ax + 1, 23 + step, ax + 3, 27 + step), fill=(125, 78, 54, 255))
            d.line((ax + 1, 22 + step, ax + 1, 20 + step, ax + 3, 20 + step,
                    ax + 3, 22 + step), fill=OUT)
        else:  # Anziano con occhiali e giornale.
            if direction == 1:
                d.line((8, 10, 11, 10), fill=OUT)
                d.line((13, 10, 16, 10), fill=OUT)
                d.point((12, 10), fill=(178, 173, 151, 255))
            elif direction in (2, 3):
                d.line((9, 10, 14, 10), fill=OUT)
            d.line((joint, 21, ax, 23 + step), fill=OUT)
            d.rectangle((ax, 22 + step, ax + 4, 28 + step), fill=OUT)
            d.rectangle((ax + 1, 23 + step, ax + 3, 27 + step), fill=(179, 177, 155, 255))
            d.line((ax + 1, 24 + step, ax + 3, 24 + step), fill=(88, 85, 80, 255))
            d.line((ax + 1, 26 + step, ax + 3, 26 + step), fill=(88, 85, 80, 255))
    return cell


def one_body(cell):
    """Unisce accessori vicini e rimuove solo i frammenti minuscoli."""
    px = cell.load()
    remaining = {(x, y) for y in range(CH) for x in range(CW) if px[x, y][3]}
    components = []
    while remaining:
        start = remaining.pop()
        component = [start]
        queue = deque([start])
        while queue:
            x, y = queue.popleft()
            for nx in range(x - 1, x + 2):
                for ny in range(y - 1, y + 2):
                    pt = (nx, ny)
                    if pt in remaining:
                        remaining.remove(pt)
                        component.append(pt)
                        queue.append(pt)
        components.append(component)
    if not components:
        return cell
    main = max(components, key=len)
    for component in components:
        if component is main:
            continue
        nearest = min(((x0 - x1) ** 2 + (y0 - y1) ** 2, (x0, y0), (x1, y1))
                      for x0, y0 in component for x1, y1 in main)
        if len(component) > 8 and nearest[0] <= 25:
            ImageDraw.Draw(cell).line((*nearest[1], *nearest[2]), fill=OUT)
        else:
            for x, y in component:
                px[x, y] = (0, 0, 0, 0)
    return cell


def main():
    ref = Image.open(REF).convert('RGBA')
    previous = Image.open(PREVIOUS).convert('RGBA')
    assert ref.size == previous.size == (384, 160)
    atlas = Image.new('RGBA', (384, 160), (0, 0, 0, 0))
    for direction in range(4):
        for who, source in enumerate(SRC):
            for frame in range(4):
                sx = (source * 4 + frame) * CW
                cell = ref.crop((sx, direction * CH, sx + CW, (direction + 1) * CH))
                cell = one_body(details(recolor(cell, who), who, direction, frame))
                atlas.alpha_composite(cell, ((who * 4 + frame) * CW, direction * CH))
    atlas.save(ATLAS, optimize=True)
    zoom, gap, top = 3, 30, 22
    w, h = 384 * zoom, 160 * zoom
    sheet = Image.new('RGB', (w * 3 + gap * 2, h + top), BG)
    draw = ImageDraw.Draw(sheet)
    for title, x in ((f'LOTTO {LOTTO}: QUATTRO PEDONI', 0), ('TAVOLA MADRE', w + gap),
                     (f'LOTTO {PREVIOUS_LOTTO}', w * 2 + gap * 2)):
        draw.text((x + 8, 4), title, fill=(41, 43, 43), font=ImageFont.load_default())
    for image, x in ((atlas, 0), (ref, w + gap), (previous, w * 2 + gap * 2)):
        backdrop = Image.new('RGB', image.size, BG)
        backdrop.paste(image, mask=image.getchannel('A'))
        sheet.paste(backdrop.resize((w, h), Image.Resampling.NEAREST), (x, top))
    sheet.save(SHEET, optimize=True)
    print(f'Lotto {LOTTO}: atlante RGBA 384x160 e sheet 3516x502')


if __name__ == '__main__':
    main()
