#!/usr/bin/env python3
"""Piccoli sprite RGBA senza filtri: 8x8 piccioni, 12x8 gatti.

Piccioni: 4 frame (terra A/B, volo A/B) x 2 colori (grigio/bianco) = 32x16.
Gatti: 3 frame (cammino A/B, seduto) x 3 colori = 36x24.
"""
from pathlib import Path
from PIL import Image, ImageDraw

OUT = Path(__file__).resolve().parents[1]
INK = (34, 36, 40, 255)
CLEAR = (0, 0, 0, 0)


def pigeon(color, frame):
    im = Image.new('RGBA', (8, 8), CLEAR)
    d = ImageDraw.Draw(im)
    body = {'gray': (105, 111, 116, 255), 'white': (215, 211, 197, 255)}[color]
    light = {'gray': (154, 159, 158, 255), 'white': (243, 239, 221, 255)}[color]
    wing = {'gray': (69, 77, 83, 255), 'white': (168, 175, 178, 255)}[color]
    if frame < 2:
        d.rectangle((2, 3, 5, 5), fill=INK)
        d.rectangle((2, 3, 4, 4), fill=body)
        d.point((3, 3), fill=light)
        d.point((5, 2 if frame == 0 else 3), fill=body)
        d.point((6, 2 if frame == 0 else 4), fill=(185, 129, 82, 255))
        d.point((5, 2 if frame == 0 else 3), fill=INK)
        d.point((4, 4), fill=wing)
        d.point((2, 6), fill=(137, 77, 72, 255))
        d.point((4, 6 if frame == 0 else 5), fill=(137, 77, 72, 255))
    else:
        d.rectangle((3, 3, 4, 5), fill=INK)
        d.rectangle((3, 3, 4, 4), fill=body)
        d.point((4, 2), fill=body)
        d.point((5, 2), fill=(186, 130, 85, 255))
        if frame == 2:
            d.line((1, 2, 2, 3), fill=INK)
            d.line((2, 2, 3, 3), fill=wing)
            d.line((5, 3, 6, 2), fill=INK)
        else:
            d.line((1, 5, 3, 4), fill=INK)
            d.line((4, 4, 6, 5), fill=INK)
            d.point((2, 4), fill=wing)
        d.point((3, 6), fill=(137, 77, 72, 255))
    return im


def cat(color, frame):
    im = Image.new('RGBA', (12, 8), CLEAR)
    d = ImageDraw.Draw(im)
    coat = {'tabby': (139, 100, 66, 255), 'black': (57, 59, 62, 255),
            'white-red': (230, 217, 197, 255)}[color]
    shade = {'tabby': (90, 68, 52, 255), 'black': (33, 35, 38, 255),
             'white-red': (176, 99, 65, 255)}[color]
    light = {'tabby': (177, 137, 91, 255), 'black': (101, 105, 106, 255),
             'white-red': (245, 232, 211, 255)}[color]
    if frame < 2:
        d.rectangle((2, 3, 8, 5), fill=INK)
        d.rectangle((3, 3, 7, 4), fill=coat)
        d.line((3, 3, 6, 3), fill=light)
        d.rectangle((7, 2, 9, 4), fill=INK)
        d.rectangle((8, 2, 8, 3), fill=coat)
        d.point((7, 1), fill=shade)
        d.point((9, 1), fill=shade)
        d.point((9, 3), fill=(230, 198, 112, 255))
        d.line((1, 4, 2, 3), fill=shade)
        d.point((1, 3 if frame == 0 else 5), fill=shade)
        d.point((4 if frame == 0 else 3, 6), fill=INK)
        d.point((7 if frame == 0 else 8, 6), fill=INK)
        if color == 'tabby':
            d.point((4, 4), fill=shade)
            d.point((6, 4), fill=shade)
        if color == 'white-red':
            d.rectangle((4, 3, 5, 4), fill=shade)
    else:
        d.rectangle((3, 3, 8, 6), fill=INK)
        d.rectangle((4, 3, 7, 5), fill=coat)
        d.rectangle((6, 2, 9, 4), fill=INK)
        d.rectangle((7, 2, 8, 3), fill=coat)
        d.point((6, 1), fill=shade)
        d.point((9, 1), fill=shade)
        d.point((8, 3), fill=(232, 202, 124, 255))
        d.point((4, 3), fill=light)
        d.line((2, 5, 3, 6), fill=shade)
        d.point((2, 4), fill=shade)
        if color == 'tabby':
            d.point((5, 4), fill=shade)
            d.point((6, 5), fill=shade)
        if color == 'white-red':
            d.rectangle((5, 3, 6, 4), fill=shade)
    return im


def main():
    birds = Image.new('RGBA', (32, 16), CLEAR)
    for row, color in enumerate(('gray', 'white')):
        for col in range(4):
            birds.alpha_composite(pigeon(color, col), (col * 8, row * 8))
    birds.save(OUT / 'piccioni-8x8.png', optimize=True)
    cats = Image.new('RGBA', (36, 24), CLEAR)
    for row, color in enumerate(('tabby', 'black', 'white-red')):
        for col in range(3):
            cats.alpha_composite(cat(color, col), (col * 12, row * 8))
    cats.save(OUT / 'gatti-12x8.png', optimize=True)
    for name in ('piccioni-8x8.png', 'gatti-12x8.png'):
        print(name, (OUT / name).stat().st_size, 'bytes')


if __name__ == '__main__':
    main()
