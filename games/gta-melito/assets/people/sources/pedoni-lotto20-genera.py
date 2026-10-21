#!/usr/bin/env python3
"""Quattro personaggi × quattro direzioni × quattro frame, adattati dalla tavola madre."""
from collections import deque
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

HERE = Path(__file__).resolve().parent
LOTTO = 20
ASSETS = HERE.parent
REF = ASSETS / 'pedoni-4x4frames-24x40-rgba.png'
PREVIOUS_LOTTO = 19
PREVIOUS = ASSETS / f'pedoni-lotto{PREVIOUS_LOTTO}-4x4frames-24x40-rgba.png'
ATLAS = ASSETS / f'pedoni-lotto{LOTTO}-4x4frames-24x40-rgba.png'
SHEET = HERE / 'sheet.png'
CW, CH = 24, 40
BG = (242, 238, 223)
OUT = (28, 27, 28, 255)
SRC = (2, 0, 0, 1)

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
    ((95, 87, 76), (150, 129, 106), (69, 65, 67)),
    ((48, 94, 146), (83, 135, 181), (58, 79, 113)),
    ((64, 107, 112), (105, 150, 147), (50, 73, 87)),
    ((169, 85, 68), (206, 125, 95), (67, 83, 108)),
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


def details(cell: Image.Image, who: int, direction: int, frame: int) -> Image.Image:
    d = ImageDraw.Draw(cell)
    step = (-1, 0, 1, 0)[frame]
    right = direction != 2
    x = 18 if right else 2
    hand = 15 if right else 8
    if who == 0:  # Nonna: grembiule e scopa tenuta in mano.
        d.polygon((9, 19, 15, 19, 16, 29, 8, 29), fill=OUT)
        d.polygon((10, 20, 14, 20, 15, 28, 9, 28), fill=(195, 177, 143, 255))
        d.line((10, 21, 14, 21), fill=(107, 85, 71, 255))
        d.line((hand, 22, x + 1, 24), fill=OUT)
        d.line((x + 1, 16, x + 1, 34), fill=OUT, width=2)
        d.line((x + 1, 18, x + 1, 32), fill=(149, 109, 69, 255))
        d.rectangle((x - 1, 33, x + 3, 37), fill=OUT)
        d.line((x, 34, x + 2, 34), fill=(168, 129, 75, 255))
    elif who == 1:  # Ragazzino: cartella, grembiule azzurro, figura già ridotta.
        d.ellipse((8, 9, 16, 18), fill=OUT)
        if direction != 0:
            d.ellipse((9, 12, 15, 17), fill=(210, 149, 104, 255))
        d.line((9, 11, 15, 11), fill=(65, 45, 35, 255), width=2)
        d.line((12, 17, 12, 21), fill=OUT)
        d.polygon((9, 20, 15, 20, 16, 32, 8, 32), fill=OUT)
        d.polygon((10, 21, 14, 21, 15, 31, 9, 31), fill=(82, 132, 175, 255))
        d.line((11, 21, 13, 21), fill=(193, 183, 158, 255))
        bx = 3 if direction in (0, 2) else 17
        d.rectangle((bx, 22, bx + 4, 29), fill=OUT)
        d.rectangle((bx + 1, 23, bx + 3, 28), fill=(137, 76, 53, 255))
        d.line((bx + (4 if bx < 10 else 0), 23, 12, 24), fill=OUT)
        d.line((bx + 1, 25, bx + 3, 25), fill=(190, 120, 68, 255))
    elif who == 2:  # Uomo in tuta: telefono all'orecchio.
        for y in (20, 23):
            d.line((9, y, 15, y), fill=(151, 180, 166, 255))
        d.line((hand, 21, x - 1 if right else x + 3, 15), fill=OUT, width=2)
        d.line((x, 9, x, 15), fill=OUT, width=2)
        d.line((x, 10, x, 13), fill=(83, 98, 109, 255))
        d.point((x, 12), fill=(151, 178, 165, 255))
    else:  # Donna con carrello da mercato pieno.
        d.line((hand, 21, x + (0 if right else 4), 24), fill=OUT)
        d.line((x + (0 if right else 4), 24, x + (0 if right else 4), 29), fill=OUT)
        d.rectangle((x, 27, x + 4, 35), fill=OUT)
        d.rectangle((x + 1, 28, x + 3, 34), fill=(62, 127, 114, 255))
        d.ellipse((x, 24, x + 2, 29), fill=(212, 160, 66, 255))
        d.ellipse((x + 2, 25, x + 4, 29), fill=(190, 98, 79, 255))
        d.point((x + 1, 36), fill=OUT)
        d.point((x + 3, 36), fill=OUT)
        d.line((x + 1, 31, x + 3, 31), fill=(134, 175, 149, 255))
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
                if who == 1:
                    small = cell.resize((19, 31), Image.Resampling.NEAREST)
                    cell = Image.new('RGBA', (CW, CH), (0, 0, 0, 0))
                    cell.alpha_composite(small, (2, 8))
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
