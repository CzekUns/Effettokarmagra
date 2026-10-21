#!/usr/bin/env python3
"""Quattro personaggi × quattro direzioni × quattro frame, adattati dalla tavola madre."""
from collections import deque
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

HERE = Path(__file__).resolve().parent
LOTTO = 19
ASSETS = HERE.parent
REF = ASSETS / 'pedoni-4x4frames-24x40-rgba.png'
PREVIOUS_LOTTO = 18
PREVIOUS = ASSETS / f'pedoni-lotto{PREVIOUS_LOTTO}-4x4frames-24x40-rgba.png'
ATLAS = ASSETS / f'pedoni-lotto{LOTTO}-4x4frames-24x40-rgba.png'
SHEET = HERE / 'sheet.png'
CW, CH = 24, 40
BG = (242, 238, 223)
OUT = (28, 27, 28, 255)
SRC = (1, 1, 0, 0)

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
    ((113, 65, 98), (160, 106, 129), (57, 71, 112)),
    ((85, 128, 96), (125, 167, 116), (70, 90, 111)),
    ((49, 67, 112), (89, 108, 155), (53, 63, 82)),
    ((188, 108, 53), (211, 149, 66), (51, 69, 94)),
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
    if who == 0:  # Mamma e bambino piccolo, tenuti per mano.
        x = 18 if right else 2
        hand = 15 if right else 8
        d.ellipse((x, 16, x + 4, 22), fill=OUT)
        d.ellipse((x + 1, 18, x + 3, 21), fill=(198, 135, 94, 255))
        d.line((x + 1, 17, x + 3, 17), fill=(83, 52, 35, 255))
        d.rectangle((x, 22, x + 4, 30), fill=OUT)
        d.rectangle((x + 1, 23, x + 3, 29), fill=(225, 157, 72, 255))
        d.line((x + 1, 30, x + 1, 36), fill=OUT, width=2)
        d.line((x + 3, 30, x + 3, 36), fill=OUT, width=2)
        d.line((hand, 22, x + (0 if right else 4), 25), fill=OUT)
        d.point((x + 2, 25), fill=(243, 195, 91, 255))
    elif who == 1:  # Ragazza e cane al guinzaglio.
        x = 17 if right else 2
        hand = 15 if right else 8
        d.line((hand, 23, x + 2, 31), fill=OUT)
        d.rectangle((x, 31, x + 4, 35), fill=OUT)
        d.rectangle((x + 1, 32, x + 3, 34), fill=(157, 114, 75, 255))
        hx = x + 3 if right else x
        d.rectangle((hx, 28, hx + 2, 32), fill=OUT)
        d.point((hx + 1, 29), fill=(190, 145, 93, 255))
        d.point((hx + 2, 30), fill=(203, 179, 121, 255))
        d.line((x + 1, 35, x + 1, 37), fill=OUT)
        d.line((x + 3, 35, x + 3, 37), fill=OUT)
        d.line((x, 31, x - 1 if x > 5 else x + 5, 29), fill=OUT)
    elif who == 2:  # Sedia a rotelle: sostituisce gambe e passi con ruote animate.
        px = cell.load()
        for y in range(27, 39):
            for x in range(4, 22):
                px[x, y] = (0, 0, 0, 0)
        d = ImageDraw.Draw(cell)
        d.rectangle((7, 25, 17, 30), fill=OUT)
        d.line((8, 26, 16, 26), fill=(97, 117, 145, 255))
        d.line((8, 29, 18, 33), fill=OUT, width=2)
        d.line((7, 30, 17, 32), fill=OUT, width=2)
        for cx in (7, 18):
            d.ellipse((cx - 3, 29, cx + 3, 37), fill=OUT)
            d.ellipse((cx - 2, 31, cx + 2, 35), fill=(89, 97, 108, 255))
            spokes = ((cx, 31, cx, 35), (cx - 2, 31, cx + 2, 35),
                      (cx - 2, 33, cx + 2, 33), (cx - 2, 35, cx + 2, 31))
            d.line(spokes[frame], fill=(174, 178, 169, 255))
            d.point((cx, 33), fill=OUT)
        d.line((16, 23, 20, 25), fill=OUT)
    else:  # Cubo colorato del delivery sulle spalle.
        x = 3 if direction in (0, 2) else 15
        d.rectangle((x, 14, x + 6, 27), fill=OUT)
        d.rectangle((x + 1, 15, x + 5, 25), fill=(207, 121, 56, 255))
        d.line((x + 1, 17, x + 5, 17), fill=(234, 177, 76, 255))
        d.line((x + 1, 23, x + 5, 23), fill=(121, 66, 47, 255))
        d.line((x + (6 if x < 10 else 0), 18, 12, 20), fill=OUT, width=2)
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
