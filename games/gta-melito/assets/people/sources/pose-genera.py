#!/usr/bin/env python3
"""Deriva quattro pose ferme dai frame frontale/laterale dei fogli pedoni esistenti.

Output: 96x160 RGBA, 4 personaggi in colonne; righe seduto, rilassato A,
rilassato B, appoggiato. Nessun intervento sui fogli di camminata.
"""
from pathlib import Path
from PIL import Image, ImageDraw

PEOPLE = Path(__file__).resolve().parents[1]
CELL = (24, 40)
BASE = ["madre", "secondo-lotto", "lotto2", "lotto10", "lotto11", "lotto12",
        "lotto13", "lotto14", "lotto17", "lotto18", "lotto19", "lotto20"]
SHEETS = BASE + [f"{source}-var{variant}" for variant in (1, 2) for source in
                 ["madre", "lotto2", "lotto10", "lotto11", "lotto12", "lotto13",
                  "lotto14", "lotto17", "lotto18", "lotto19", "lotto20"]]


def source_path(name):
    return PEOPLE / ("pedoni-4x4frames-24x40-rgba.png" if name == "madre" else
                     f"pedoni-{name}-4x4frames-24x40-rgba.png")


def color_at(im, x, y, default=(68, 69, 72, 255)):
    for yy in range(y, min(y + 8, 39)):
        for xx in range(x, min(x + 7, 23)):
            c = im.getpixel((xx, yy))
            if c[3] > 220:
                return c
    return default


def safe(im):
    """Le pose mantengono un pixel trasparente sui quattro lati della cella."""
    draw = ImageDraw.Draw(im)
    draw.rectangle((0, 0, 23, 0), fill=(0, 0, 0, 0))
    draw.rectangle((0, 39, 23, 39), fill=(0, 0, 0, 0))
    draw.rectangle((0, 0, 0, 39), fill=(0, 0, 0, 0))
    draw.rectangle((23, 0, 23, 39), fill=(0, 0, 0, 0))
    return im


def seated(front):
    out = Image.new("RGBA", CELL)
    box = front.getbbox() or (5, 5, 19, 38)
    # Tronco e testa scendono di 6 px; le gambe piegate diventano due cosce
    # orizzontali e due scarpe sul bordo basso, coerenti con i colori del frame.
    cut = min(29, max(22, box[3] - 10))
    out.alpha_composite(front.crop((0, 0, 24, cut)), (0, 6))
    draw = ImageDraw.Draw(out)
    trouser = color_at(front, 10, cut, (68, 65, 74, 255))
    shoe = color_at(front, 10, 35, (34, 37, 43, 255))
    edge = (34, 36, 42, 255)
    draw.rectangle((7, 32, 17, 34), fill=edge)
    draw.rectangle((8, 32, 16, 33), fill=trouser)
    draw.rectangle((7, 35, 10, 37), fill=trouser)
    draw.rectangle((14, 35, 17, 37), fill=trouser)
    draw.rectangle((6, 37, 10, 38), fill=shoe)
    draw.rectangle((14, 37, 18, 38), fill=shoe)
    return safe(out)


def relaxed(front, gesture):
    # La base laterale permette ai membri di un gruppo di guardarsi fra loro.
    out = front.copy()
    draw = ImageDraw.Draw(out)
    box = front.getbbox() or (6, 3, 18, 38)
    # Una manica piegata dal fianco al petto. Il secondo frame alza la mano:
    # l'animazione resta lenta e discreta, senza muovere i piedi.
    right = min(20, max(15, box[2] - 2))
    y = max(17, min(25, box[1] + 17))
    sleeve = color_at(front, right - 2, y, (72, 88, 101, 255))
    outline = (32, 35, 40, 255)
    hand = color_at(front, 10, max(4, box[1] + 4), (194, 137, 102, 255))
    draw.line([(right, y + 6), (right + 1, y + 3), (right - 2, y + (0 if gesture else 2))], fill=outline, width=3)
    draw.line([(right, y + 5), (right, y + 3), (right - 2, y + (0 if gesture else 2))], fill=sleeve, width=1)
    draw.point((right - 3, y + (0 if gesture else 2)), fill=hand)
    return safe(out)


def leaning(side):
    out = Image.new("RGBA", CELL)
    box = side.getbbox() or (5, 4, 19, 38)
    cut = max(22, min(30, box[3] - 8))
    out.alpha_composite(side.crop((0, 0, 24, cut)), (2, 1))
    lower = side.crop((0, cut, 24, 39))
    out.alpha_composite(lower, (0, cut))
    draw = ImageDraw.Draw(out)
    trouser = color_at(side, 10, cut, (66, 66, 72, 255))
    shoe = color_at(side, 11, 35, (35, 35, 40, 255))
    draw.line([(13, 32), (10, 35), (15, 37)], fill=(32, 34, 39, 255), width=4)
    draw.line([(13, 32), (10, 35), (15, 37)], fill=trouser, width=2)
    draw.rectangle((14, 37, 18, 38), fill=shoe)
    return safe(out)


def build(name):
    source = Image.open(source_path(name)).convert("RGBA")
    if source.size != (384, 160):
        raise ValueError(f"{name}: size {source.size}")
    sheet = Image.new("RGBA", (96, 160))
    for person in range(4):
        x = person * 96
        front = source.crop((x, 40, x + 24, 80))
        side = source.crop((x, 80, x + 24, 120))
        for row, pose in enumerate((seated(front), relaxed(side, False), relaxed(side, True), leaning(side))):
            sheet.alpha_composite(pose, (person * 24, row * 40))
    dest = PEOPLE / f"pose-{name}.png"
    sheet.save(dest, optimize=True, compress_level=9)
    return dest


if __name__ == "__main__":
    total = 0
    for name in SHEETS:
        dest = build(name)
        total += dest.stat().st_size
        print(f"{dest.name}: {dest.stat().st_size} B")
    print(f"TOTALE {len(SHEETS)} fogli: {total} B")
    if total >= 1_000_000:
        raise SystemExit("Il totale supera 1 MB")
