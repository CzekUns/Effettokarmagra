#!/usr/bin/env python3
"""Lotto 5: Fiat Tipo hatchback 2016 e Fiat 500L 2012, 4x4 top-down."""
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

# Interpretazioni grafiche dei colori Fiat, non campioni vernice certificati.
TIPO = [
    ('white', '#dddcd5'), ('silver', '#acb8ba'), ('graphite', '#687276'),
    ('sand', '#bbaa8f'), ('bronze', '#917761'), ('red', '#a83c3e'),
    ('blue', '#31577a'), ('black', '#3d464a'),
]
CINQUECENTO_L = [
    ('white', '#e3e0d8'), ('red', '#b03e3d'), ('silver', '#b3babb'),
    ('graphite', '#667176'), ('black', '#3c4448'), ('blue', '#3f698b'),
    ('yellow', '#d3ad4e'), ('green', '#5a8071'),
]


def rgb(value):
    return tuple(bytes.fromhex(value[1:]))


def tone(color, factor):
    if factor >= 1:
        return tuple(min(255, round(v + (255 - v) * (factor - 1))) for v in color) + (255,)
    return tuple(max(0, round(v * factor)) for v in color) + (255,)


def geometry(tipo):
    if tipo:
        return {
            'body': [(13, 3), (26, 3), (30, 7), (32, 15), (32, 46),
                     (30, 53), (27, 56), (12, 56), (9, 53), (7, 46),
                     (7, 15), (9, 7)],
            'hood': [(13, 5), (26, 5), (29, 11), (30, 20), (9, 20), (10, 11)],
            'roof': [(12, 25), (27, 25), (29, 30), (29, 43),
                     (27, 47), (12, 47), (10, 43), (10, 30)],
            'windshield': [(10, 21), (29, 21), (27, 27), (12, 27)],
            'rear': [(12, 46), (27, 46), (27, 51), (12, 51)],
            'wheel_rows': ((14, 23), (43, 52)),
            'left': 7, 'right': 32, 'mirror_y': 25,
        }
    return {
        # Monovolume 500L: frontale corto, abitacolo alto che occupa quasi
        # tutta la lunghezza, fiancate tonde e coda verticale.
        'body': [(14, 6), (25, 6), (29, 9), (32, 15), (33, 41),
                 (31, 49), (28, 54), (11, 54), (8, 49), (6, 41),
                 (7, 15), (10, 9)],
        'hood': [(14, 8), (25, 8), (29, 12), (30, 17), (9, 17), (10, 12)],
        'roof': [(12, 18), (27, 18), (30, 22), (30, 46),
                 (27, 51), (12, 51), (9, 46), (9, 22)],
        'windshield': [(11, 18), (28, 18), (28, 24), (11, 24)],
        'rear': [(11, 45), (28, 45), (27, 51), (12, 51)],
        'wheel_rows': ((15, 23), (42, 50)),
        'left': 6, 'right': 33, 'mirror_y': 22,
    }


def car(model, paint):
    tipo = model == 'tipo'
    cfg = geometry(tipo)
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
    if tipo:
        d.line((11, 19, 28, 19), fill=tone(base, .73))
        d.line((15, 7, 24, 7), fill=tone(base, 1.30))
    else:
        # Il corto cofano e i fari tondi separano la 500L dalla Tipo.
        d.line((12, 16, 27, 16), fill=tone(base, .73))
        d.line((17, 13, 22, 13), fill=(178, 180, 169, 255))

    roof = cfg['roof']
    d.polygon(roof, fill=tone(base, .72))
    if tipo:
        inside = [(15, 28), (24, 28), (27, 31), (27, 42),
                  (25, 45), (14, 45), (12, 42), (12, 31)]
    else:
        inside = [(13, 22), (26, 22), (28, 25), (28, 45),
                  (26, 49), (13, 49), (11, 45), (11, 25)]
    d.polygon(inside, fill=tone(base, 1.16))
    d.line((inside[0][0] + 1, inside[0][1] + 2,
            inside[-1][0] + 1, inside[-1][1] - 2),
           fill=tone(base, 1.30), width=2)
    d.line((inside[1][0] - 1, inside[1][1] + 2,
            inside[3][0] - 1, inside[3][1] - 2),
           fill=tone(base, .82), width=2)
    d.line((16 if tipo else 15, 31 if tipo else 28,
            23 if tipo else 24, 31 if tipo else 28),
           fill=tone(base, 1.27), width=2)
    if not tipo:
        # Linee della grande superficie piana del tetto della monovolume.
        d.line((14, 37, 25, 37), fill=tone(base, 1.07))
        d.line((14, 39, 25, 39), fill=tone(base, .95))

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

    # Finestrini laterali molto più lunghi sulla 500L.
    side_l, side_r = (10, 29) if tipo else (9, 30)
    side_top, side_bottom = (29, 43) if tipo else (24, 45)
    for x in (side_l, side_r):
        d.line((x, side_top, x, side_bottom), fill=GLASS_SHADE, width=2)
        d.line((x, side_top + 2, x, side_top + (7 if tipo else 12)),
               fill=(85, 103, 105, 255))
        d.point((x, side_top + 3), fill=GLASS_REFLECT)
    for yy in ((35, 42) if tipo else (33, 42)):
        d.line((left, yy, left + 4, yy + 1), fill=tone(base, .60))
        d.line((right - 4, yy + 1, right, yy), fill=tone(base, .58))
        d.line((left + 2, yy + 3, left + 4, yy + 3), fill=tone(base, 1.31))
        d.line((right - 4, yy + 3, right - 2, yy + 3), fill=tone(base, 1.26))

    # Tipo: gruppi ottici anteriori affilati e posteriori orizzontali.
    # 500L: punti luce frontali tondi, posteriori più alti/verticali.
    if tipo:
        for x0 in (9, 27):
            d.rectangle((x0, 7, x0 + 4, 9), fill=(193, 199, 184, 255))
            d.line((x0 + 1, 7, x0 + 3, 7), fill=(245, 240, 208, 255))
            d.point((x0 + 1, 9), fill=(225, 190, 104, 255))
        for x0 in (9, 27):
            d.rectangle((x0, 50, x0 + 4, 52), fill=(153, 31, 28, 255))
            d.line((x0 + 1, 50, x0 + 3, 50), fill=(228, 79, 42, 255))
            d.point((x0 + 3, 52), fill=(241, 137, 43, 255))
        d.line((15, 54, 24, 54), fill=tone(base, .62))
    else:
        for cx in (12, 27):
            d.ellipse((cx - 2, 10, cx + 2, 14), fill=(185, 190, 181, 255))
            d.point((cx, 11), fill=(249, 240, 203, 255))
            d.point((cx - 1, 13), fill=(225, 190, 104, 255))
        for x0 in (8, 30):
            d.rectangle((x0, 46, x0 + 1, 51), fill=(151, 31, 27, 255))
            d.line((x0, 46, x0, 48), fill=(225, 70, 34, 255))
            d.point((x0, 50), fill=(241, 137, 43, 255))
        d.line((14, 52, 25, 52), fill=tone(base, .62))

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
    paints = [('tipo', color) for _name, color in TIPO]
    paints += [('500l', color) for _name, color in CINQUECENTO_L]
    for index, (model, color) in enumerate(paints):
        atlas.alpha_composite(car(model, color), ((index % 4) * CW, (index // 4) * CH))
    atlas.save(HERE / 'tipo-500l-16-rgba.png', optimize=True)

    reference = Image.open(HERE / 'riferimento-lotto1.png').convert('RGBA')
    if reference.size != (160, 240):
        raise SystemExit(f'Riferimento lotto 1 inatteso: {reference.size}')
    zoom, gap, top = 4, 32, 24
    panel_w, panel_h = 160 * zoom, 240 * zoom
    sheet = Image.new('RGB', (panel_w * 2 + gap, panel_h + top), BG)
    sd = ImageDraw.Draw(sheet)
    sd.text((8, 5), 'LOTTO 5: TIPO 2016 + 500L 2012',
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
