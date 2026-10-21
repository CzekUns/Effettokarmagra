#!/usr/bin/env python3
"""Lotto 7: Opel Corsa E e Peugeot 208 I, 4x4 top-down."""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

HERE = Path(__file__).resolve().parent
CW, CH = 40, 60
OUTLINE = (24, 28, 31, 255)
RUBBER = (30, 33, 34, 255)
GLASS = (43, 53, 57, 255)
GLASS_SHADE = (31, 41, 46, 255)
GLASS_REFLECT = (113, 133, 134, 255)
BG = (242, 238, 223)

# Interpretazioni grafiche delle vernici, non campioni certificati.
CORSA_E = [
    ('white', '#deded6'), ('red', '#b53f3c'), ('blue', '#346584'),
    ('silver', '#b0bbbd'), ('graphite', '#626d70'), ('black', '#3c4447'),
    ('yellow', '#d2ae46'), ('orange', '#ba7449'),
]
PEUGEOT_208 = [
    ('white', '#e2dfd6'), ('red', '#a94041'), ('silver', '#b2bbbd'),
    ('sharkgrey', '#687479'), ('black', '#3b4348'), ('virtualblue', '#3e698b'),
    ('darkblue', '#31485f'), ('orangepower', '#c47945'),
]


def rgb(value):
    return tuple(bytes.fromhex(value[1:]))


def tone(color, factor):
    if factor >= 1:
        return tuple(min(255, round(v + (255 - v) * (factor - 1))) for v in color) + (255,)
    return tuple(max(0, round(v * factor)) for v in color) + (255,)


def geometry(corsa):
    if corsa:
        return {
            # Corsa E: coda alta e quasi verticale, cofano compatto, tetto lungo.
            'body': [(13, 6), (26, 6), (29, 10), (31, 17), (31, 46),
                     (29, 53), (26, 55), (13, 55), (10, 53),
                     (8, 46), (8, 17), (10, 10)],
            'hood': [(13, 8), (26, 8), (29, 13), (29, 19), (10, 19), (10, 13)],
            'roof': [(13, 23), (26, 23), (28, 27), (28, 45),
                     (26, 50), (13, 50), (11, 45), (11, 27)],
            'windshield': [(11, 20), (28, 20), (27, 27), (12, 27)],
            'rear': [(12, 46), (27, 46), (26, 51), (13, 51)],
            'wheel_rows': ((15, 23), (42, 50)),
            'left': 8, 'right': 31, 'mirror_y': 24,
        }
    return {
        # 208 I: muso affusolato, tetto che si stringe verso la coda.
        'body': [(14, 5), (25, 5), (28, 9), (30, 16), (30, 37),
                 (29, 46), (26, 52), (23, 54), (16, 54),
                 (13, 52), (10, 46), (9, 37), (9, 16), (11, 9)],
        'hood': [(14, 7), (25, 7), (28, 12), (29, 21), (10, 21), (11, 12)],
        'roof': [(13, 25), (26, 25), (27, 29), (27, 38),
                 (24, 46), (22, 48), (17, 48), (15, 46),
                 (12, 38), (12, 29)],
        'windshield': [(11, 22), (28, 22), (26, 29), (13, 29)],
        'rear': [(15, 44), (24, 44), (25, 49), (14, 49)],
        'wheel_rows': ((15, 23), (40, 49)),
        'left': 9, 'right': 30, 'mirror_y': 25,
    }


def car(model, paint):
    corsa = model == 'corsa-e'
    cfg = geometry(corsa)
    base = rgb(paint)
    im = Image.new('RGBA', (CW, CH), (0, 0, 0, 0))
    mask = Image.new('L', (CW, CH), 0)
    md = ImageDraw.Draw(mask)
    md.polygon(cfg['body'], fill=255)
    left, right = cfg['left'], cfg['right']
    for top, bottom in cfg['wheel_rows']:
        md.rectangle((left - 1, top, left + 2, bottom), fill=255)
        md.rectangle((right - 2, top, right + 1, bottom), fill=255)
    my = cfg['mirror_y']
    md.rectangle((left - 2, my, left + 1, my + 1), fill=255)
    md.rectangle((right - 1, my, right + 2, my + 1), fill=255)
    im.paste(OUTLINE, (0, 0, CW, CH), mask.filter(ImageFilter.MaxFilter(3)))
    px = im.load()
    for y in range(CH):
        for x in range(CW):
            if mask.getpixel((x, y)):
                band = min(4, max(0, (x - 6) // 6))
                factor = (1.16, 1.09, 1.02, .88, .72)[band]
                if y < 20:
                    factor += .04
                px[x, y] = tone(base, factor)
    d = ImageDraw.Draw(im)
    for top, bottom in cfg['wheel_rows']:
        d.rectangle((left - 1, top + 1, left, bottom - 1), fill=RUBBER)
        d.rectangle((right, top + 1, right + 1, bottom - 1), fill=RUBBER)
        d.line((left, top + 2, left, bottom - 2), fill=(66, 71, 73, 255))
        d.line((right, top + 2, right, bottom - 2), fill=(52, 57, 60, 255))

    hood = cfg['hood']
    d.polygon(hood, fill=tone(base, 1.09))
    d.line((hood[0][0] + 1, hood[0][1] + 2,
            hood[1][0] - 1, hood[1][1] + 2), fill=tone(base, 1.30), width=2)
    d.line((hood[1][0], hood[1][1] + 2, hood[2][0], hood[2][1],
            hood[3][0], hood[3][1] - 1), fill=tone(base, .77), width=2)
    d.line((hood[-1][0], hood[-1][1], hood[0][0], hood[0][1] + 3),
           fill=tone(base, 1.23))
    if corsa:
        d.line((11, 19, 28, 19), fill=tone(base, .73))
        d.line((15, 7, 24, 7), fill=tone(base, 1.30))
    else:
        d.line((11, 21, 28, 21), fill=tone(base, .73))
        d.line((15, 7, 24, 7), fill=tone(base, 1.30))

    roof = cfg['roof']
    d.polygon(roof, fill=tone(base, .72))
    if corsa:
        inside = [(15, 28), (24, 28), (27, 31), (27, 44),
                  (25, 47), (14, 47), (12, 44), (12, 31)]
    else:
        inside = [(15, 30), (24, 30), (26, 33), (25, 39),
                  (23, 45), (16, 45), (14, 39), (13, 33)]
    d.polygon(inside, fill=tone(base, 1.16))
    d.line((inside[0][0] + 1, inside[0][1] + 2,
            inside[-1][0] + 1, inside[-1][1] - 2),
           fill=tone(base, 1.30), width=2)
    d.line((inside[1][0] - 1, inside[1][1] + 2,
            inside[3][0] - 1, inside[3][1] - 2),
           fill=tone(base, .82), width=2)
    d.line((16 if corsa else 17, 31 if corsa else 33,
            23 if corsa else 22, 31 if corsa else 33),
           fill=tone(base, 1.27), width=2)
    if not corsa:
        # Linea convergente verso il portellone della 208.
        d.line((14, 37, 17, 44), fill=tone(base, .81))
        d.line((25, 37, 22, 44), fill=tone(base, .79))

    windshield = cfg['windshield']
    d.polygon(windshield, fill=GLASS_SHADE)
    d.polygon([(windshield[0][0] + 2, windshield[0][1] + 1),
               (windshield[1][0] - 2, windshield[1][1] + 1),
               (windshield[2][0] - 2, windshield[2][1] - 1),
               (windshield[3][0] + 2, windshield[3][1] - 1)], fill=GLASS)
    d.line((windshield[0][0] + 3, windshield[0][1] + 1,
            windshield[0][0] + 8, windshield[0][1] + 1), fill=GLASS_REFLECT)
    d.line((windshield[0][0] + 7, windshield[0][1] + 1,
            windshield[0][0] + 10, windshield[0][1] + 3),
           fill=(77, 100, 105, 255))
    rear = cfg['rear']
    d.polygon(rear, fill=GLASS_SHADE)
    d.line((rear[0][0] + 2, rear[0][1] + 1,
            rear[1][0] - 2, rear[1][1] + 1), fill=GLASS)
    d.line((rear[0][0] + 3, rear[0][1] + 1,
            rear[0][0] + 6, rear[0][1] + 2), fill=GLASS_REFLECT)

    # Corsa con abitacolo lungo; 208 con vetratura che si stringe dietro.
    side_l, side_r = (11, 28) if corsa else (12, 27)
    side_top, side_bottom = (28, 43) if corsa else (30, 40)
    for x in (side_l, side_r):
        d.line((x, side_top, x, side_bottom), fill=GLASS_SHADE, width=2)
        d.line((x, side_top + 2, x, side_top + 8),
               fill=(85, 103, 105, 255))
        d.point((x, side_top + 3), fill=GLASS_REFLECT)
    for yy in ((35, 43) if corsa else (36, 42)):
        d.line((left, yy, left + 4, yy + 1), fill=tone(base, .60))
        d.line((right - 4, yy + 1, right, yy), fill=tone(base, .58))
        d.line((left + 2, yy + 3, left + 4, yy + 3), fill=tone(base, 1.31))
        d.line((right - 4, yy + 3, right - 2, yy + 3), fill=tone(base, 1.26))

    # Corsa E: fari a freccia verso il centro; 208: fari sottili e allungati.
    if corsa:
        for points in ([(10, 11), (13, 9), (18, 12), (14, 13), (10, 14)],
                       [(29, 11), (26, 9), (21, 12), (25, 13), (29, 14)]):
            d.polygon(points, fill=(193, 199, 184, 255))
            d.line((points[0][0], points[0][1], points[1][0], points[1][1]),
                   fill=(245, 240, 208, 255))
            d.point(points[2], fill=(225, 190, 104, 255))
        for x0 in (9, 27):
            d.rectangle((x0, 48, x0 + 3, 52), fill=(153, 31, 28, 255))
            d.line((x0, 48, x0 + 2, 48), fill=(228, 79, 42, 255))
            d.point((x0 + 2, 52), fill=(241, 137, 43, 255))
        d.line((15, 53, 24, 53), fill=tone(base, .62))
    else:
        for points in ([(11, 9), (15, 8), (18, 9), (15, 12), (10, 14)],
                       [(28, 9), (24, 8), (21, 9), (24, 12), (29, 14)]):
            d.polygon(points, fill=(190, 199, 188, 255))
            d.line((points[0][0], points[0][1], points[1][0], points[1][1]),
                   fill=(245, 241, 210, 255))
            d.point(points[-1], fill=(225, 190, 104, 255))
        for x0 in (10, 26):
            d.polygon([(x0, 47), (x0 + 3, 48), (x0 + 3, 51),
                       (x0 + 1, 52)], fill=(151, 31, 27, 255))
            d.line((x0, 47, x0 + 2, 48), fill=(225, 70, 34, 255))
            d.point((x0 + 2, 51), fill=(241, 137, 43, 255))
        d.line((15, 52, 24, 52), fill=tone(base, .62))

    d.rectangle((left - 2, my, left, my + 1), fill=OUTLINE)
    d.rectangle((right, my, right + 2, my + 1), fill=OUTLINE)
    d.point((left - 1, my), fill=tone(base, 1.17))
    d.point((right + 1, my), fill=tone(base, .83))

    # Il bordo esterno resta scuro su qualsiasi sfondo: niente alone chiaro.
    alpha = im.getchannel('A')
    px = im.load()
    for y in range(1, CH - 1):
        for x in range(1, CW - 1):
            if alpha.getpixel((x, y)) and any(alpha.getpixel(p) == 0 for p in
                                               ((x - 1, y), (x + 1, y),
                                                (x, y - 1), (x, y + 1))):
                px[x, y] = OUTLINE
    return im


def main():
    atlas = Image.new('RGBA', (160, 240), (0, 0, 0, 0))
    paints = [('corsa-e', color) for _name, color in CORSA_E]
    paints += [('peugeot-208', color) for _name, color in PEUGEOT_208]
    for index, (model, color) in enumerate(paints):
        atlas.alpha_composite(car(model, color), ((index % 4) * CW, (index // 4) * CH))
    atlas.save(HERE / 'corsa-e-208-16-rgba.png', optimize=True)

    reference = Image.open(HERE / 'riferimento-lotto1.png').convert('RGBA')
    if reference.size != (160, 240):
        raise SystemExit(f'Riferimento lotto 1 inatteso: {reference.size}')
    zoom, gap, top = 4, 32, 24
    panel_w, panel_h = 160 * zoom, 240 * zoom
    sheet = Image.new('RGB', (panel_w * 2 + gap, panel_h + top), BG)
    sd = ImageDraw.Draw(sheet)
    sd.text((8, 5), 'LOTTO 7: CORSA E + PEUGEOT 208',
            fill=(40, 40, 40), font=ImageFont.load_default())
    sd.text((panel_w + gap + 8, 5), 'LOTTO 1: GRANDE PUNTO + YPSILON III',
            fill=(40, 40, 40), font=ImageFont.load_default())
    for art, x in ((atlas, 0), (reference, panel_w + gap)):
        flat = Image.new('RGB', art.size, BG)
        flat.paste(art, mask=art.getchannel('A'))
        sheet.paste(flat.resize((panel_w, panel_h), Image.Resampling.NEAREST), (x, top))
    sheet.save(HERE / 'sheet.png', optimize=True)
    print('Creati atlas 160x240 RGBA e sheet 1312x984 RGB, confronto alla scala 4x')


if __name__ == '__main__':
    main()
