#!/usr/bin/env python3
"""Lotto 1: Grande Punto e Ypsilon III, viste dall'alto, atlas 4x4."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

HERE = Path(__file__).resolve().parent
CW, CH = 40, 60
OUTLINE = (24, 28, 31, 255)
RUBBER = (30, 33, 34, 255)
GLASS = (43, 53, 57, 255)
GLASS_SHADE = (31, 41, 46, 255)
GLASS_REFLECT = (113, 133, 134, 255)

# Toni illustrativi, non codici di vernice. Alzare il nero preserva i dettagli.
GRANDE_PUNTO = [
    ('white', '#d9d9d2'), ('red', '#a73537'), ('blue', '#29436a'),
    ('silver', '#aab6b9'), ('graphite', '#59676d'), ('black', '#3d464b'),
    ('lightblue', '#6b9db5'), ('beige', '#baa98b'),
]
YPSILON_3 = [
    ('white', '#e6e3d8'), ('red', '#a8483f'), ('silver', '#acb4b6'),
    ('graphite', '#667276'), ('black', '#3c4449'), ('blue', '#2e466d'),
    ('beige', '#bba98c'), ('purple', '#775a75'),
]


def rgb(value):
    return tuple(bytes.fromhex(value[1:]))


def tone(color, factor):
    if factor >= 1:
        return tuple(min(255, round(v + (255 - v) * (factor - 1))) for v in color) + (255,)
    return tuple(max(0, round(v * factor)) for v in color) + (255,)


def car(model, paint):
    """Cofano verso -Y. Colori a pochi toni e dettagli sul reticolo 40x60."""
    punto = model == 'grande-punto'
    base = rgb(paint)
    im = Image.new('RGBA', (CW, CH), (0, 0, 0, 0))
    mask = Image.new('L', (CW, CH), 0)
    md = ImageDraw.Draw(mask)
    if punto:
        # Grande Punto: lunghezza e larghezza maggiori, cofano lungo e inclinato.
        body = [(14, 3), (25, 3), (29, 6), (31, 13), (32, 21),
                (32, 46), (30, 53), (27, 56), (12, 56), (9, 53),
                (7, 46), (7, 21), (8, 13), (10, 6)]
        hood = [(14, 5), (25, 5), (29, 12), (30, 19), (9, 19), (10, 12)]
        roof = [(12, 25), (27, 25), (29, 30), (29, 43),
                (27, 47), (12, 47), (10, 43), (10, 30)]
        windshield = [(11, 21), (28, 21), (27, 26), (12, 26)]
        rear_glass = [(13, 46), (26, 46), (26, 49), (13, 49)]
        wheel_rows = ((14, 22), (44, 52))
        mirror_y = 25
    else:
        # Ypsilon III: più corta e stretta, abitacolo alto, coda spiovente.
        body = [(15, 6), (24, 6), (28, 9), (30, 16), (30, 38),
                (29, 46), (26, 53), (23, 55), (16, 55), (13, 53),
                (10, 46), (9, 38), (9, 16), (11, 9)]
        hood = [(15, 8), (24, 8), (27, 13), (28, 17), (11, 17), (12, 13)]
        roof = [(14, 22), (25, 22), (28, 28), (28, 39),
                (26, 46), (23, 50), (16, 50), (13, 46),
                (11, 39), (11, 28)]
        windshield = [(13, 19), (26, 19), (27, 23), (12, 23)]
        rear_glass = [(14, 44), (25, 44), (24, 49), (15, 49)]
        wheel_rows = ((16, 23), (40, 48))
        mirror_y = 24

    md.polygon(body, fill=255)
    for top, bottom in wheel_rows:
        md.rectangle((6 if punto else 8, top, 9 if punto else 10, bottom), fill=255)
        md.rectangle((30 if punto else 29, top, 33 if punto else 31, bottom), fill=255)
    md.rectangle((5 if punto else 7, mirror_y, 9, mirror_y + 1), fill=255)
    md.rectangle((30, mirror_y, 34 if punto else 32, mirror_y + 1), fill=255)

    # Un pixel di contorno; la carrozzeria usa una luce trasversale a 5 toni.
    outer = mask.filter(ImageFilter.MaxFilter(3))
    im.paste(OUTLINE, (0, 0, CW, CH), outer)
    pix = im.load()
    for y in range(CH):
        for x in range(CW):
            if mask.getpixel((x, y)):
                band = min(4, max(0, (x - 7) // 5))
                factor = (1.16, 1.09, 1.02, .88, .72)[band]
                if y < 18:
                    factor += .04
                pix[x, y] = tone(base, factor)
    d = ImageDraw.Draw(im)
    for top, bottom in wheel_rows:
        lx = 6 if punto else 8
        rx = 33 if punto else 31
        d.rectangle((lx, top + 1, lx + 1, bottom - 1), fill=RUBBER)
        d.rectangle((rx - 1, top + 1, rx, bottom - 1), fill=RUBBER)
        d.line((lx + 1, top + 2, lx + 1, bottom - 2), fill=(66, 71, 73, 255))
        d.line((rx - 1, top + 2, rx - 1, bottom - 2), fill=(52, 57, 60, 255))

    # Cofano arrotondato con luce centrale e bordo destro in ombra.
    d.polygon(hood, fill=tone(base, 1.09))
    d.line((hood[0][0] + 1, hood[0][1] + 2, hood[1][0] - 1, hood[1][1] + 2),
           fill=tone(base, 1.30), width=2)
    d.line((hood[1][0], hood[1][1] + 2, hood[2][0], hood[2][1],
            hood[3][0], hood[3][1] - 1), fill=tone(base, .77), width=2)
    d.line((hood[-1][0], hood[-1][1], hood[0][0], hood[0][1] + 3),
           fill=tone(base, 1.23))
    d.line((11 if punto else 13, 18 if punto else 16,
            28 if punto else 26, 18 if punto else 16), fill=tone(base, .73))

    # Cornice dell'abitacolo, montanti e tetto con luce morbida su più toni.
    d.polygon(roof, fill=tone(base, .73))
    d.polygon([(roof[0][0] + 2, roof[0][1] + 3),
               (roof[1][0] - 2, roof[1][1] + 3),
               (roof[2][0] - 2, roof[2][1] + 1),
               (roof[3][0] - 3, roof[3][1] - 2),
               (roof[4][0] - 2, roof[4][1] - 2),
               (roof[-3][0] + 2, roof[-3][1] - 2),
               (roof[-2][0] + 2, roof[-2][1] - 2),
               (roof[-1][0] + 2, roof[-1][1] + 1)],
              fill=tone(base, 1.16))
    d.line((roof[0][0] + 3, roof[0][1] + 4,
            roof[0][0] + 3, roof[-1][1] - 2), fill=tone(base, 1.30), width=2)
    d.line((roof[1][0] - 2, roof[1][1] + 4,
            roof[1][0] - 2, roof[3][1] - 2), fill=tone(base, .82), width=2)
    d.line((17, 31 if punto else 29, 23, 31 if punto else 29),
           fill=tone(base, 1.26), width=2)

    # Parabrezza e lunotto: riflesso diagonale, cornice e montanti visibili.
    d.polygon(windshield, fill=GLASS_SHADE)
    d.polygon([(windshield[0][0] + 2, windshield[0][1] + 1),
               (windshield[1][0] - 2, windshield[1][1] + 1),
               (windshield[2][0] - 2, windshield[2][1] - 1),
               (windshield[3][0] + 2, windshield[3][1] - 1)], fill=GLASS)
    d.line((windshield[0][0] + 3, windshield[0][1] + 1,
            windshield[0][0] + 6, windshield[0][1] + 1), fill=GLASS_REFLECT)
    d.line((windshield[0][0] + 6, windshield[0][1] + 1,
            windshield[0][0] + 9, windshield[0][1] + 3), fill=(77, 100, 105, 255))
    d.line((windshield[1][0] - 5, windshield[1][1] + 2,
            windshield[1][0] - 3, windshield[1][1] + 2), fill=(90, 108, 111, 255))
    d.polygon(rear_glass, fill=GLASS_SHADE)
    d.line((rear_glass[0][0] + 2, rear_glass[0][1] + 1,
            rear_glass[1][0] - 2, rear_glass[1][1] + 1), fill=GLASS)
    d.line((rear_glass[0][0] + 3, rear_glass[0][1] + 1,
            rear_glass[0][0] + 5, rear_glass[0][1] + 2), fill=GLASS_REFLECT)

    # Finestrini laterali piccoli sulla Ypsilon; linee delle porte e maniglie.
    side_x = 10 if punto else 12
    side_r = 29 if punto else 27
    side_top = 28 if punto else 26
    side_end = 44 if punto else 42
    for x in (side_x, side_r):
        d.line((x, side_top, x, side_end), fill=GLASS_SHADE, width=2)
        d.line((x, side_top + 2, x, side_top + 6), fill=(85, 103, 105, 255))
    door_y = 36 if punto else 34
    d.line((7 if punto else 9, door_y, 11 if punto else 12, door_y + 1),
           fill=tone(base, .64))
    d.line((28 if punto else 27, door_y + 1, 32 if punto else 30, door_y),
           fill=tone(base, .58))
    d.line((9 if punto else 11, door_y + 4, 11 if punto else 12, door_y + 4),
           fill=tone(base, 1.34))
    d.line((28 if punto else 27, door_y + 4, 30 if punto else 29, door_y + 4),
           fill=tone(base, 1.27))
    if not punto:
        d.line((11, 39, 15, 47), fill=tone(base, .61), width=2)
        d.line((28, 39, 24, 47), fill=tone(base, .61), width=2)
        d.line((14, 47, 17, 50), fill=tone(base, 1.20))

    # Fari anteriori bianco/giallo, posteriori rosso/arancio in due elementi.
    front_y = 7 if punto else 10
    for x0 in (10 if punto else 12, 26 if punto else 25):
        d.rectangle((x0, front_y, x0 + 3, front_y + 2), fill=(193, 199, 184, 255))
        d.line((x0 + 1, front_y, x0 + 2, front_y), fill=(245, 240, 208, 255))
        d.point((x0 + 1, front_y + 2), fill=(225, 190, 104, 255))
    if punto:
        for x0 in (9, 28):
            d.rectangle((x0, 51, x0 + 2, 54), fill=(151, 31, 27, 255))
            d.line((x0, 51, x0 + 1, 51), fill=(224, 76, 36, 255))
    else:
        for x0 in (10, 28):
            d.rectangle((x0, 43, x0 + 1, 51), fill=(146, 28, 25, 255))
            d.line((x0, 44, x0, 47), fill=(217, 65, 30, 255))
            d.point((x0, 50), fill=(241, 137, 43, 255))
    d.line((15, 54 if punto else 52, 24, 54 if punto else 52),
           fill=tone(base, .62))

    # Specchietti laterali: scuri, con un punto del colore carrozzeria.
    mx = 5 if punto else 7
    rx = 34 if punto else 32
    d.rectangle((mx, mirror_y, mx + 2, mirror_y + 1), fill=OUTLINE)
    d.rectangle((rx - 2, mirror_y, rx, mirror_y + 1), fill=OUTLINE)
    d.point((mx + 1, mirror_y), fill=tone(base, 1.17))
    d.point((rx - 1, mirror_y), fill=tone(base, .83))

    # Il pixel esterno opaco resta sempre scuro: niente alone su fondi chiari.
    alpha = im.getchannel('A')
    pixels = im.load()
    for y in range(1, CH - 1):
        for x in range(1, CW - 1):
            if alpha.getpixel((x, y)) and any(alpha.getpixel(p) == 0 for p in
                                               ((x - 1, y), (x + 1, y),
                                                (x, y - 1), (x, y + 1))):
                pixels[x, y] = OUTLINE
    return im


def main():
    atlas = Image.new('RGBA', (CW * 4, CH * 4), (0, 0, 0, 0))
    paints = [('grande-punto', item) for item in GRANDE_PUNTO]
    paints += [('ypsilon3', item) for item in YPSILON_3]
    for index, (model, (_name, color)) in enumerate(paints):
        atlas.alpha_composite(car(model, color), ((index % 4) * CW, (index // 4) * CH))
    atlas.save(HERE / 'grande-punto-ypsilon3-16-rgba.png', optimize=True)

    # Quinta riga: prime quattro Punto dell'atlante esistente, stessa scala.
    reference_path = HERE / 'riferimento-punto-ypsilon.png'
    if not reference_path.exists():
        raise SystemExit(f'Manca {reference_path.name}: serve per il confronto in sheet.png')
    reference = Image.open(reference_path).convert('RGBA')
    if reference.size != (160, 240):
        raise SystemExit(f'Riferimento inatteso: {reference.size}, atteso 160x240')
    comparison = Image.new('RGBA', (160, 300), (0, 0, 0, 0))
    comparison.alpha_composite(atlas, (0, 0))
    comparison.alpha_composite(reference.crop((0, 0, 160, 60)), (0, 240))
    sheet = Image.new('RGB', comparison.size, (242, 238, 223))
    sheet.paste(comparison, mask=comparison.getchannel('A'))
    sheet.resize((640, 1200), Image.Resampling.NEAREST).save(HERE / 'sheet.png', optimize=True)
    print('Creati atlas 160x240 RGBA e sheet 640x1200 RGB con riga di confronto')


if __name__ == '__main__':
    main()
