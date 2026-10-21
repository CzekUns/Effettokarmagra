#!/usr/bin/env python3
"""Banchi visti dall'alto: 14 tipi + 4 superfici di telo, scala PX=4 di market.mjs."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

HERE = Path(__file__).resolve().parent
CW, CH, COLS, ROWS = 32, 24, 6, 3
HI = 2  # 2 pixel dell'atlante per 1 pixel della cache attuale (PX=4).
AW, AH = CW * HI, CH * HI
ATLAS = HERE / 'mercato-banchi-14-teli-4-rgba.png'
SHEET = HERE / 'sheet.png'
APE = HERE / 'riferimento-ape-food.png'
BG = (242, 238, 223)
OUT = (34, 33, 31, 255)
WOOD = (121, 85, 56, 255)
EDGE = (71, 50, 37, 255)
LINEN = (210, 193, 157, 255)
ICE = (185, 210, 216, 255)
SHADOW = (48, 51, 45, 255)
# market.mjs: MARKET_RULES.scale = 1.9 * PERSON_SCALE = 1.52;
# 4 m * 1.52 * PX(4) ≈ 24 px, 3 m ≈ 18 px, 2 m ≈ 12 px.
WIDTHS = [24, 18, 18, 24, 18, 24, 18, 18, 18, 18, 18, 12, 24, 18]


def box(d, x0, y0, x1, y1, fill, outline=OUT):
    d.rectangle((x0, y0, x1, y1), fill=fill, outline=outline)


def dot(d, x, y, color):
    d.point((x, y), fill=color)


def tabletop(d, width, cloth=LINEN, van=False, deep=False):
    """Piano e orlo: clienti verso +Y, luce alto/sinistra."""
    l, r = 16 - width // 2, 16 + width // 2 - 1
    y0 = 3 if deep else 4
    # Ombra corta sul suolo, collegata all'orlo del banco.
    box(d, l + 2, 18, r + 1, 20, SHADOW)
    box(d, l, y0, r, 18, EDGE)
    if van:
        d.rectangle((l + 1, y0 + 1, r - 1, y0 + 4), fill=(209, 202, 181, 255))
        d.line((l + 2, y0 + 1, r - 2, y0 + 1), fill=(236, 225, 196, 255))
        box(d, l + 2, y0 + 6, r - 2, 16, (66, 78, 80, 255))
    else:
        d.rectangle((l + 1, y0 + 1, r - 1, 16), fill=cloth)
        d.line((l + 1, y0 + 1, r - 2, y0 + 1), fill=(238, 219, 181, 255))
        d.line((r - 1, y0 + 2, r - 1, 16), fill=(96, 69, 52, 255))
    d.rectangle((l + 1, 17, r - 1, 18), fill=WOOD)
    d.line((l + 1, 17, r - 2, 17), fill=(174, 127, 79, 255))
    return l, r


def tray(d, x, y, color, variant=0):
    box(d, x, y, x + 6, y + 5, WOOD)
    d.rectangle((x + 1, y + 1, x + 5, y + 4), fill=(83, 64, 42, 255))
    for xx, yy in ((x + 2, y + 2), (x + 4, y + 2), (x + 2, y + 4),
                   (x + 4, y + 4)):
        dot(d, xx, yy, color)
    if variant:
        dot(d, x + 3, y + 3, (236, 211, 120, 255))


def fish(d, x, y):
    d.line((x, y, x + 4, y), fill=(92, 127, 142, 255), width=2)
    d.polygon([(x + 5, y), (x + 7, y - 2), (x + 7, y + 2)],
              fill=(80, 112, 126, 255))
    dot(d, x + 1, y, (220, 226, 219, 255))


def fill_goods(d, kind, l, r):
    # La merce è SEMPRE dentro il piano, vista da sopra, mai appesa frontalmente.
    if kind == 0:  # frutta e verdura
        colors = [(212, 116, 39, 255), (178, 52, 42, 255),
                  (68, 126, 52, 255), (221, 194, 62, 255)]
        for i, (x, y) in enumerate(((l + 2, 6), (l + 10, 6),
                                     (l + 2, 12), (l + 10, 12))):
            tray(d, x, y, colors[i], i == 3)
        box(d, r - 4, 6, r - 2, 8, (147, 156, 148, 255))
        dot(d, r - 3, 7, (225, 218, 178, 255))
    elif kind == 1:  # ghiaccio e pesce
        for x in (l + 2, l + 9):
            box(d, x, 6, x + 6, 16, (43, 93, 129, 255))
            d.rectangle((x + 1, 7, x + 5, 15), fill=ICE)
            fish(d, x, 9)
            fish(d, x, 13)
        dot(d, r - 2, 16, (228, 200, 75, 255))
    elif kind == 2:  # vetrina furgone: salumi/formaggi
        d.rectangle((l + 3, 10, r - 3, 15), fill=(185, 213, 212, 255))
        for i, x in enumerate(range(l + 4, r - 3, 3)):
            dot(d, x, 11, (162, 54, 50, 255) if i % 2 else (235, 216, 157, 255))
            dot(d, x, 13, (234, 217, 177, 255) if i % 2 else (173, 60, 52, 255))
        d.line((l + 3, 9, r - 4, 9), fill=(226, 241, 234, 255))
    elif kind == 3:  # vestiti piegati, jeans e capi
        colors = [(183, 55, 49, 255), (51, 102, 153, 255),
                  (215, 177, 65, 255), (60, 130, 77, 255),
                  (143, 91, 144, 255), (207, 206, 183, 255)]
        for i, x in enumerate(range(l + 2, r - 3, 7)):
            for j, y in enumerate((6, 12)):
                box(d, x, y, x + 5, y + 4, colors[(i + j * 3) % 6])
                d.line((x + 1, y + 2, x + 4, y + 2), fill=(231, 216, 186, 255))
    elif kind == 4:  # scatole e scarpe viste da sopra
        for i, (x, y) in enumerate(((l + 2, 6), (l + 9, 6),
                                     (l + 2, 12), (l + 9, 12))):
            box(d, x, y, x + 5, y + 4, (151, 109, 77, 255))
            d.ellipse((x + 1, y + 1, x + 4, y + 2),
                      fill=(52, 51, 50, 255) if i % 2 else (103, 66, 44, 255))
            dot(d, x + 3, y + 2, (206, 205, 192, 255))
    elif kind == 5:  # pentole e secchi
        for i, x in enumerate((l + 5, l + 13, l + 20)):
            if i == 2:
                box(d, x - 2, 9, x + 2, 15, (66, 132, 169, 255))
                d.line((x - 1, 9, x + 1, 9), fill=(164, 207, 214, 255))
            else:
                d.ellipse((x - 3, 8, x + 3, 14), fill=(134, 151, 154, 255), outline=OUT)
                d.ellipse((x - 1, 10, x + 1, 12), fill=(216, 219, 207, 255))
        dot(d, l + 2, 15, (230, 186, 58, 255))
    elif kind == 6:  # detersivi in flaconi
        colors = [(60, 150, 199, 255), (219, 185, 59, 255),
                  (127, 93, 161, 255)]
        for i, x in enumerate(range(l + 2, r - 2, 4)):
            box(d, x, 8 + i % 2, x + 2, 15, colors[i % 3])
            dot(d, x + 1, 7 + i % 2, (231, 228, 208, 255))
            dot(d, x + 1, 12, (236, 231, 215, 255))
    elif kind == 7:  # palloni, macchinine, scatola
        for x, color in ((l + 5, (196, 55, 47, 255)),
                         (l + 12, (47, 109, 181, 255))):
            d.ellipse((x - 2, 7, x + 2, 11), fill=color, outline=OUT)
            dot(d, x, 9, (235, 224, 182, 255))
        for x, color in ((l + 3, (228, 184, 53, 255)),
                         (l + 10, (74, 143, 76, 255))):
            box(d, x, 13, x + 4, 15, color)
            dot(d, x + 1, 16, OUT)
            dot(d, x + 3, 16, OUT)
    elif kind == 8:  # vasi e fiori dall'alto
        for i, x in enumerate((l + 4, l + 9, l + 14)):
            d.ellipse((x - 2, 7, x + 2, 11), fill=(145, 89, 57, 255), outline=OUT)
            d.ellipse((x - 3, 10, x + 3, 16), fill=(55, 111, 55, 255), outline=OUT)
            for dx, dy in ((-1, 1), (2, 3), (0, 5)):
                dot(d, x + dx, 10 + dy,
                    [(216, 111, 148, 255), (231, 202, 70, 255),
                     (213, 215, 191, 255)][i])
    elif kind == 9:  # borse e cinture arrotolate
        for i, x in enumerate((l + 3, l + 9, l + 14)):
            color = [(53, 47, 43, 255), (113, 73, 47, 255),
                     (154, 113, 67, 255)][i]
            box(d, x, 9, x + 4, 15, color)
            d.arc((x + 1, 6, x + 3, 10), 180, 360, fill=OUT)
            dot(d, x + 2, 12, (210, 166, 72, 255))
    elif kind == 10:  # pacchetti intimo/calze
        colors = [(225, 157, 178, 255), (162, 194, 219, 255),
                  (228, 208, 148, 255)]
        for i, x in enumerate((l + 2, l + 7, l + 12)):
            box(d, x, 7, x + 4, 13, colors[i])
            d.line((x + 1, 10, x + 3, 10), fill=(242, 235, 220, 255))
            d.line((x + 1, 15, x + 3, 15), fill=colors[i], width=2)
    elif kind == 11:  # bigiotteria e occhiali
        d.rectangle((l + 1, 6, r - 1, 16), fill=(64, 49, 75, 255))
        for x in (l + 3, l + 6, l + 9):
            dot(d, x, 8, (218, 183, 83, 255))
            dot(d, x, 12, (205, 210, 207, 255))
        d.ellipse((l + 2, 14, l + 4, 15), outline=OUT)
        d.ellipse((l + 6, 14, l + 8, 15), outline=OUT)
    elif kind == 12:  # porchetta, panini, bibite
        d.ellipse((l + 3, 9, l + 12, 15), fill=(162, 88, 50, 255), outline=OUT)
        d.arc((l + 4, 10, l + 11, 14), 190, 330, fill=(233, 166, 89, 255))
        for x in (l + 15, l + 19):
            d.ellipse((x, 10, x + 3, 13), fill=(224, 190, 129, 255), outline=OUT)
            dot(d, x + 2, 12, (119, 66, 46, 255))
        for x in (l + 17, l + 21):
            box(d, x, 14, x + 1, 16, (151, 54, 48, 255))
    elif kind == 13:  # quattro vaschette di olive/legumi
        colors = [(92, 111, 52, 255), (210, 177, 66, 255),
                  (172, 56, 45, 255), (158, 136, 89, 255)]
        for i, (x, y) in enumerate(((l + 2, 6), (l + 9, 6),
                                     (l + 2, 12), (l + 9, 12))):
            box(d, x, y, x + 5, y + 4, (78, 91, 70, 255))
            for xx, yy in ((x + 2, y + 1), (x + 4, y + 2), (x + 2, y + 3)):
                dot(d, xx, yy, colors[i])


def flat_tarp(d, index):
    """Panno piano visto dall'alto, con pieghe leggere e bordo basso."""
    colors = [((218, 200, 164, 255), (188, 167, 130, 255)),
              ((185, 66, 57, 255), (222, 192, 156, 255)),
              ((60, 108, 149, 255), (218, 214, 190, 255)),
              ((75, 118, 72, 255), (204, 187, 140, 255))]
    base, stripe = colors[index]
    tabletop(d, 24, base)
    for x in range(7, 27, 5):
        d.line((x, 6, x + 2, 15), fill=stripe, width=2)
        d.line((x + 1, 5, x + 3, 8), fill=(233, 219, 186, 255))
    d.line((5, 16, 26, 16), fill=(80, 69, 54, 255))


def render(index):
    image = Image.new('RGBA', (CW, CH), (0, 0, 0, 0))
    d = ImageDraw.Draw(image)
    if index >= 14:
        flat_tarp(d, index - 14)
    else:
        van = index in (2, 12)
        cloth = ICE if index == 1 else LINEN
        l, r = tabletop(d, WIDTHS[index], cloth, van, deep=index == 12)
        fill_goods(d, index, l, r)
    return image


def detail_hi(image, index):
    """Dettagli a un pixel sulla base ingrandita: merce e luce simili all'Ape."""
    d = ImageDraw.Draw(image)
    # Granulosità moderata del telo e venatura dell'orlo, senza sporcare il contorno.
    px = image.load()
    for y in range(10, 33):
        for x in range(9, 56):
            r, g, b, a = px[x, y]
            if not a or (r, g, b) not in ((210, 193, 157), (185, 210, 216)):
                continue
            if (x * 17 + y * 23 + index * 11) % 29 == 0:
                px[x, y] = (max(0, r - 13), max(0, g - 12), max(0, b - 10), 255)
    low_width = WIDTHS[index] if index < 14 else 24
    left = (16 - low_width // 2) * 2
    right = (16 + low_width // 2 - 1) * 2 + 1
    d.line((left + 2, 35, right - 2, 35), fill=(183, 135, 84, 255))
    for x in range(left + 4, right - 5, 9):
        d.line((x, 36, x + 3, 36), fill=(93, 62, 42, 255))

    def fruit_crate(x, y, color):
        box(d, x, y, x + 13, y + 10, (111, 75, 46, 255))
        d.rectangle((x + 2, y + 2, x + 11, y + 8), fill=(73, 58, 37, 255))
        d.line((x + 1, y + 1, x + 12, y + 1), fill=(199, 151, 91, 255))
        for dx, dy in ((3, 3), (8, 3), (4, 7), (9, 7)):
            d.ellipse((x + dx, y + dy, x + dx + 3, y + dy + 3),
                      fill=color, outline=(73, 60, 37, 255))
            dot(d, x + dx + 1, y + dy, (240, 211, 142, 255))
        d.line((x + 2, y + 9, x + 11, y + 9), fill=(172, 118, 69, 255))

    if index == 0:
        for x, y, color in ((12, 12, (223, 131, 43, 255)),
                            (28, 12, (196, 57, 47, 255)),
                            (12, 24, (72, 138, 59, 255)),
                            (28, 24, (224, 193, 66, 255))):
            fruit_crate(x, y, color)
        box(d, 47, 11, 52, 17, (113, 127, 124, 255))
        d.line((48, 13, 51, 13), fill=(231, 227, 197, 255))
    elif index == 1:
        for x in (18, 33):
            box(d, x, 11, x + 12, 32, (44, 91, 125, 255))
            d.rectangle((x + 2, 13, x + 10, 30), fill=(205, 224, 224, 255))
            for yy in (16, 22, 28):
                d.ellipse((x + 2, yy, x + 8, yy + 3),
                          fill=(108, 143, 153, 255), outline=(53, 89, 106, 255))
                d.polygon([(x + 8, yy + 1), (x + 11, yy - 1), (x + 11, yy + 4)],
                          fill=(83, 119, 135, 255))
                dot(d, x + 3, yy + 1, (231, 236, 224, 255))
            for dx, yy in ((3, 14), (9, 20), (5, 26)):
                dot(d, x + dx, yy, (243, 247, 236, 255))
        d.ellipse((43, 29, 47, 33), fill=(235, 207, 74, 255), outline=OUT)
    elif index == 2:
        # Vetrina refrigerata: riflesso diagonale, salami e formaggi distinti.
        d.line((23, 19, 48, 32), fill=(224, 242, 237, 255), width=1)
        for x, color in ((20, (166, 55, 50, 255)), (27, (239, 219, 160, 255)),
                         (34, (181, 60, 52, 255)), (41, (241, 225, 177, 255))):
            d.ellipse((x, 23, x + 4, 28), fill=color, outline=(75, 70, 59, 255))
            dot(d, x + 2, 24, (250, 234, 190, 255))
    elif index == 3:
        colors = [(182, 54, 51, 255), (53, 105, 166, 255),
                  (225, 181, 63, 255), (63, 137, 82, 255),
                  (145, 94, 147, 255), (219, 212, 193, 255)]
        for i, (x, y) in enumerate(((12, 12), (26, 12), (40, 12),
                                     (12, 24), (26, 24), (40, 24))):
            box(d, x, y, x + 10, y + 8, colors[i])
            d.line((x + 2, y + 2, x + 8, y + 2), fill=(234, 218, 188, 255))
            d.line((x + 3, y + 5, x + 7, y + 5), fill=(75, 65, 57, 255))
            dot(d, x + 2, y + 6, (244, 226, 192, 255))
    elif index == 4:
        for i, (x, y) in enumerate(((18, 12), (32, 12), (18, 24), (32, 24))):
            box(d, x, y, x + 11, y + 8,
                (157, 112, 78, 255) if i % 2 else (176, 133, 94, 255))
            shoe = (55, 54, 50, 255) if i % 2 else (112, 72, 48, 255)
            d.polygon([(x + 2, y + 2), (x + 7, y + 2), (x + 7, y + 4),
                       (x + 10, y + 5), (x + 9, y + 7), (x + 3, y + 6)],
                      fill=shoe, outline=OUT)
            d.line((x + 4, y + 3, x + 6, y + 3), fill=(216, 205, 176, 255))
    elif index == 5:
        for x in (18, 34):
            d.ellipse((x - 6, 15, x + 6, 27), fill=(133, 149, 150, 255), outline=OUT)
            d.ellipse((x - 4, 17, x + 4, 25), fill=(202, 211, 207, 255),
                      outline=(98, 116, 118, 255))
            d.line((x - 7, 20, x - 5, 20), fill=OUT, width=2)
            d.line((x + 5, 20, x + 7, 20), fill=OUT, width=2)
            dot(d, x - 2, 18, (240, 236, 219, 255))
        box(d, 47, 18, 54, 30, (67, 135, 172, 255))
        d.line((49, 19, 52, 19), fill=(167, 211, 220, 255))
    elif index == 6:
        colors = [(59, 149, 201, 255), (231, 189, 57, 255),
                  (132, 96, 168, 255)]
        for i, x in enumerate(range(18, 43, 7)):
            box(d, x, 15 + i % 2, x + 5, 29, colors[i % 3])
            box(d, x + 1, 12 + i % 2, x + 3, 15 + i % 2,
                (230, 230, 214, 255))
            d.rectangle((x + 1, 22, x + 4, 25), fill=(230, 231, 218, 255))
            dot(d, x + 2, 23, (96, 115, 116, 255))
    elif index == 7:
        for x, color in ((25, (202, 55, 48, 255)),
                         (39, (51, 112, 181, 255))):
            d.ellipse((x - 5, 13, x + 5, 23), fill=color, outline=OUT)
            d.arc((x - 3, 15, x + 3, 21), 15, 160, fill=(243, 225, 179, 255))
            dot(d, x, 18, (239, 216, 173, 255))
        for x, color in ((21, (229, 182, 51, 255)),
                         (37, (69, 146, 76, 255))):
            box(d, x, 27, x + 10, 32, color)
            d.line((x + 2, 28, x + 7, 28), fill=(238, 223, 173, 255))
            dot(d, x + 2, 33, OUT)
            dot(d, x + 8, 33, OUT)
    elif index == 8:
        colors = [(215, 105, 145, 255), (232, 202, 70, 255),
                  (218, 224, 205, 255)]
        for i, x in enumerate((22, 32, 42)):
            d.ellipse((x - 5, 15, x + 5, 26), fill=(56, 111, 53, 255), outline=OUT)
            d.ellipse((x - 3, 17, x + 3, 24), fill=(70, 139, 62, 255))
            for dx, dy in ((-3, -3), (2, -2), (-1, 2), (3, 4)):
                d.ellipse((x + dx, 19 + dy, x + dx + 2, 21 + dy),
                          fill=colors[i], outline=(76, 102, 56, 255))
            dot(d, x, 19, (241, 195, 71, 255))
    elif index == 9:
        for i, x in enumerate((20, 32, 44)):
            colors = [(59, 49, 45, 255), (114, 72, 47, 255),
                      (158, 116, 67, 255)]
            box(d, x - 4, 18, x + 5, 29, colors[i])
            d.arc((x - 2, 12, x + 3, 21), 180, 360, fill=OUT, width=2)
            d.line((x - 2, 21, x + 3, 21), fill=(194, 156, 91, 255))
            dot(d, x, 24, (223, 184, 82, 255))
    elif index == 10:
        colors = [(225, 157, 178, 255), (163, 197, 222, 255),
                  (232, 212, 152, 255)]
        for i, x in enumerate((17, 28, 39)):
            box(d, x, 14, x + 9, 27, colors[i])
            d.line((x + 2, 17, x + 7, 17), fill=(245, 235, 218, 255))
            d.line((x + 2, 21, x + 7, 21), fill=(141, 139, 136, 255))
            d.line((x + 3, 30, x + 7, 30), fill=colors[i], width=2)
    elif index == 11:
        for x in (21, 26, 31, 36):
            d.ellipse((x, 16, x + 3, 19), outline=(230, 198, 98, 255), width=1)
            dot(d, x + 1, 22, (229, 222, 206, 255))
            dot(d, x + 2, 25, (184, 149, 190, 255))
        d.ellipse((23, 29, 29, 33), outline=OUT)
        d.ellipse((34, 29, 40, 33), outline=OUT)
        d.line((29, 31, 34, 31), fill=OUT)
    elif index == 12:
        d.ellipse((14, 17, 34, 31), fill=(163, 86, 47, 255), outline=OUT)
        d.arc((17, 19, 31, 27), 200, 340, fill=(239, 166, 85, 255), width=2)
        for x in (39, 48):
            d.ellipse((x, 18, x + 7, 25), fill=(226, 187, 116, 255), outline=OUT)
            d.line((x + 1, 22, x + 6, 22), fill=(120, 70, 42, 255))
        # Due piccole paste salate/dolci illustrative sul piano del furgone.
        for x in (40, 49):
            d.ellipse((x, 28, x + 5, 33), fill=(210, 151, 79, 255), outline=OUT)
            dot(d, x + 2, 29, (247, 216, 144, 255))
    elif index == 13:
        colors = [(96, 115, 52, 255), (214, 179, 65, 255),
                  (178, 57, 45, 255), (164, 140, 89, 255)]
        for i, (x, y) in enumerate(((18, 12), (33, 12), (18, 24), (33, 24))):
            box(d, x, y, x + 12, y + 10, (84, 96, 75, 255))
            d.rectangle((x + 2, y + 2, x + 10, y + 8), fill=(53, 64, 48, 255))
            for dx, dy in ((3, 3), (7, 3), (4, 6), (9, 7)):
                d.ellipse((x + dx, y + dy, x + dx + 2, y + dy + 2),
                          fill=colors[i])
            d.line((x + 1, y + 1, x + 11, y + 1), fill=(190, 198, 155, 255))
    else:  # Teli: pieghe ampie e morbide su superficie piana.
        palette = [(216, 198, 163, 255), (187, 64, 55, 255),
                   (59, 107, 148, 255), (76, 117, 72, 255)]
        c = palette[index - 14]
        for x in range(13, 46, 11):
            d.line((x, 11, x + 7, 26), fill=(231, 214, 181, 255), width=2)
            d.line((x + 2, 12, x + 9, 27), fill=c, width=2)
        d.line((11, 33, 52, 33), fill=(99, 83, 65, 255))
    return image


def on_bg(image):
    out = Image.new('RGB', image.size, BG)
    out.paste(image, mask=image.getchannel('A'))
    return out


def main():
    atlas = Image.new('RGBA', (AW * COLS, AH * ROWS), (0, 0, 0, 0))
    for i in range(18):
        high = render(i).resize((AW, AH), Image.Resampling.NEAREST)
        atlas.alpha_composite(detail_hi(high, i), ((i % COLS) * AW, (i // COLS) * AH))
    atlas.save(ATLAS, optimize=True)
    ape = Image.open(APE).convert('RGBA')
    if ape.size != (224, 256):
        raise SystemExit(f'Reference Ape inattesa: {ape.size}')
    # Cella 2: Ape ortofrutta dall'alto, con cassette e piano di vendita.
    sample = ape.crop((112, 0, 168, 64))
    zoom, top, gap = 4, 24, 32
    left_w, left_h = atlas.width * zoom, atlas.height * zoom
    sheet = Image.new('RGB', (left_w + gap + 56 * zoom, left_h + top), BG)
    d = ImageDraw.Draw(sheet)
    d.text((4, 4), '14 BANCHI + 4 TELI — VISTA DALL ALTO', fill=OUT[:3],
           font=ImageFont.load_default())
    d.text((left_w + gap + 4, 4), 'APE ORTOFRUTTA, STESSA SCALA 4x',
           fill=OUT[:3], font=ImageFont.load_default())
    sheet.paste(on_bg(atlas).resize((left_w, left_h), Image.Resampling.NEAREST),
                (0, top))
    sheet.paste(on_bg(sample).resize((56 * zoom, 64 * zoom),
                                    Image.Resampling.NEAREST),
                (left_w + gap, top + 8))
    sheet.save(SHEET, optimize=True)
    print('Creati atlas 384x144 RGBA e sheet 1792x600 RGB con Ape alla scala 4x')


if __name__ == '__main__':
    main()
