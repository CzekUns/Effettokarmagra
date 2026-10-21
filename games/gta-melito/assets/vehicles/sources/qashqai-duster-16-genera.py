#!/usr/bin/env python3
"""Lotto 8: Nissan Qashqai J11 e Dacia Duster I, 4x4 top-down."""
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
QASHQAI_J11 = [
    ('white', '#e3e0d7'), ('red', '#aa4244'), ('silver', '#b4bcbc'),
    ('graphite', '#687176'), ('black', '#3e4448'), ('blue', '#426586'),
    ('bronze', '#9c7960'), ('burgundy', '#7f4148'),
]
DUSTER_1 = [
    ('white', '#e1ded4'), ('beige', '#ae9a7d'), ('darkgreen', '#59694f'),
    ('silver', '#abb5b6'), ('graphite', '#636d70'), ('black', '#3c4243'),
    ('blue', '#4b687c'), ('brown', '#866b56'),
]


def rgb(value):
    return tuple(bytes.fromhex(value[1:]))


def tone(color, factor):
    if factor >= 1:
        return tuple(min(255, round(v + (255 - v) * (factor - 1))) for v in color) + (255,)
    return tuple(max(0, round(v * factor)) for v in color) + (255,)


def geometry(qashqai):
    if qashqai:
        return {
            # J11: muso a V, spalle rastremate, lunotto inclinato.
            'body': [(13, 4), (26, 4), (30, 9), (33, 16), (33, 42),
                     (31, 50), (27, 55), (24, 56), (15, 56),
                     (12, 55), (8, 50), (6, 42), (6, 16), (9, 9)],
            'hood': [(13, 6), (26, 6), (29, 11), (31, 21), (8, 21), (10, 11)],
            'roof': [(13, 25), (26, 25), (29, 29), (29, 44),
                     (26, 49), (13, 49), (10, 44), (10, 29)],
            'windshield': [(9, 22), (30, 22), (28, 29), (11, 29)],
            'rear': [(13, 46), (26, 46), (27, 51), (12, 51)],
            'wheel_rows': ((16, 25), (42, 51)),
            'left': 6, 'right': 33, 'mirror_y': 26,
        }
    return {
        # Duster I: parafanghi pronunciati e corpo più rettangolare.
        'body': [(12, 5), (27, 5), (31, 9), (33, 14), (33, 50),
                 (30, 55), (9, 55), (6, 50), (6, 14), (8, 9)],
        'hood': [(12, 7), (27, 7), (30, 12), (31, 19), (8, 19), (9, 12)],
        'roof': [(11, 23), (28, 23), (30, 27), (30, 48),
                 (27, 51), (12, 51), (9, 48), (9, 27)],
        'windshield': [(9, 20), (30, 20), (29, 27), (10, 27)],
        'rear': [(11, 47), (28, 47), (29, 52), (10, 52)],
        'wheel_rows': ((15, 25), (43, 53)),
        'left': 6, 'right': 33, 'mirror_y': 25,
    }


def car(model, paint):
    qashqai = model == 'qashqai-j11'
    cfg = geometry(qashqai)
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
    if qashqai:
        d.line((9, 21, 30, 21), fill=tone(base, .73))
        d.line((15, 7, 24, 7), fill=tone(base, 1.30))
        d.line((19, 9, 19, 16), fill=tone(base, 1.23))
    else:
        d.line((9, 19, 30, 19), fill=tone(base, .73))
        d.line((13, 8, 26, 8), fill=tone(base, 1.30))
        d.line((11, 10, 28, 10), fill=tone(base, .83))

    roof = cfg['roof']
    d.polygon(roof, fill=tone(base, .72))
    if qashqai:
        inside = [(14, 29), (25, 29), (28, 32), (28, 43),
                  (25, 47), (14, 47), (11, 43), (11, 32)]
    else:
        inside = [(12, 27), (27, 27), (29, 30), (29, 47),
                  (27, 49), (12, 49), (10, 47), (10, 30)]
    d.polygon(inside, fill=tone(base, 1.16))
    d.line((inside[0][0] + 1, inside[0][1] + 2,
            inside[-1][0] + 1, inside[-1][1] - 2),
           fill=tone(base, 1.30), width=2)
    d.line((inside[1][0] - 1, inside[1][1] + 2,
            inside[3][0] - 1, inside[3][1] - 2),
           fill=tone(base, .82), width=2)
    d.line((16 if qashqai else 14, 33 if qashqai else 33,
            23 if qashqai else 25, 33 if qashqai else 33),
           fill=tone(base, 1.27), width=2)
    if qashqai:
        d.line((13, 40, 15, 46), fill=tone(base, .81))
        d.line((26, 40, 24, 46), fill=tone(base, .79))
    else:
        d.line((14, 38, 14, 47), fill=tone(base, .83))
        d.line((25, 38, 25, 47), fill=tone(base, .77))

    # Barre longitudinali: scure sui lati, luci sul bordo interno.
    rail_left, rail_right = (10, 29) if qashqai else (9, 30)
    rail_bottom = 47 if qashqai else 50
    for rail_x in (rail_left, rail_right):
        d.line((rail_x, 27, rail_x, rail_bottom), fill=(40, 44, 45, 255), width=2)
        d.line((rail_x + (1 if rail_x < 20 else -1), 29,
                rail_x + (1 if rail_x < 20 else -1), rail_bottom - 2),
               fill=(142, 148, 139, 255))
        d.point((rail_x, 27), fill=(202, 202, 180, 255))
        d.point((rail_x, rail_bottom), fill=(62, 66, 64, 255))

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

    # Qashqai con vetri rastremati; Duster con finestre grandi e regolari.
    side_l, side_r = (11, 28) if qashqai else (10, 29)
    side_top, side_bottom = (29, 43) if qashqai else (28, 46)
    for x in (side_l, side_r):
        d.line((x, side_top, x, side_bottom), fill=GLASS_SHADE, width=2)
        d.line((x, side_top + 2, x, side_top + 8),
               fill=(85, 103, 105, 255))
        d.point((x, side_top + 3), fill=GLASS_REFLECT)
    for yy in ((36, 44) if qashqai else (36, 45)):
        d.line((left, yy, left + 4, yy + 1), fill=tone(base, .60))
        d.line((right - 4, yy + 1, right, yy), fill=tone(base, .58))
        d.line((left + 2, yy + 3, left + 4, yy + 3), fill=tone(base, 1.31))
        d.line((right - 4, yy + 3, right - 2, yy + 3), fill=tone(base, 1.26))

    # J11: fari a V; Duster: gruppi ottici squadrati e paraurti robusto.
    if qashqai:
        for points in ([(9, 11), (13, 9), (17, 11), (14, 14), (8, 16)],
                       [(30, 11), (26, 9), (22, 11), (25, 14), (31, 16)]):
            d.polygon(points, fill=(193, 199, 184, 255))
            d.line((points[0][0], points[0][1], points[1][0], points[1][1]),
                   fill=(245, 240, 208, 255))
            d.point(points[2], fill=(225, 190, 104, 255))
        for x0 in (8, 27):
            d.polygon([(x0, 48), (x0 + 4, 49), (x0 + 4, 53),
                       (x0 + 1, 52)], fill=(153, 31, 28, 255))
            d.line((x0, 48, x0 + 3, 49), fill=(228, 79, 42, 255))
            d.point((x0 + 3, 52), fill=(241, 137, 43, 255))
        d.line((14, 54, 25, 54), fill=tone(base, .62))
    else:
        for x0 in (8, 26):
            d.rectangle((x0, 9, x0 + 5, 12), fill=(190, 199, 188, 255))
            d.line((x0 + 1, 9, x0 + 4, 9), fill=(245, 241, 210, 255))
            d.point((x0 + 4, 12), fill=(225, 190, 104, 255))
        d.rectangle((15, 9, 24, 10), fill=(44, 48, 46, 255))
        for x0 in (7, 27):
            d.rectangle((x0, 49, x0 + 5, 53), fill=(151, 31, 27, 255))
            d.line((x0 + 1, 49, x0 + 4, 49), fill=(225, 70, 34, 255))
            d.point((x0 + 4, 53), fill=(241, 137, 43, 255))
        d.rectangle((15, 54, 24, 55), fill=(60, 61, 57, 255))

    # Passaruota: tratti di plastica scura intorno alle gomme.
    for top, bottom in cfg['wheel_rows']:
        d.line((left + 1, top, left + 3, top), fill=(40, 42, 40, 255), width=2)
        d.line((right - 3, top, right - 1, top), fill=(40, 42, 40, 255), width=2)
        d.line((left + 1, bottom, left + 3, bottom), fill=(40, 42, 40, 255), width=2)
        d.line((right - 3, bottom, right - 1, bottom), fill=(40, 42, 40, 255), width=2)

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
    paints = [('qashqai-j11', color) for _name, color in QASHQAI_J11]
    paints += [('duster-1', color) for _name, color in DUSTER_1]
    for index, (model, color) in enumerate(paints):
        atlas.alpha_composite(car(model, color), ((index % 4) * CW, (index // 4) * CH))
    atlas.save(HERE / 'qashqai-duster-16-rgba.png', optimize=True)

    reference = Image.open(HERE / 'riferimento-lotto1.png').convert('RGBA')
    if reference.size != (160, 240):
        raise SystemExit(f'Riferimento lotto 1 inatteso: {reference.size}')
    zoom, gap, top = 4, 32, 24
    panel_w, panel_h = 160 * zoom, 240 * zoom
    sheet = Image.new('RGB', (panel_w * 2 + gap, panel_h + top), BG)
    sd = ImageDraw.Draw(sheet)
    sd.text((8, 5), 'LOTTO 8: QASHQAI J11 + DUSTER I',
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
