#!/usr/bin/env python3
"""Due tavolozze pronte per ogni foglio pedoni richiesto; nessun filtro a runtime.

Uso: python3 assets/people/sources/varianti-genera.py
I 64 frame, l'alpha e il contorno restano pixel per pixel nella posizione originale.
"""
from pathlib import Path
from PIL import Image

PEOPLE = Path(__file__).resolve().parents[1]
SOURCES = ('madre', 'lotto2', 'lotto10', 'lotto11', 'lotto12', 'lotto13',
           'lotto14', 'lotto17', 'lotto18', 'lotto19', 'lotto20')
INK = {(38, 32, 30), (1, 1, 1), (30, 26, 23), (28, 23, 19), (0, 0, 0)}
# Ogni personaggio riceve una coppia giacca/pantaloni/capelli. I colori si
# modulano in base alla luminanza originaria: restano luci e ombre a due toni.
PALETTES = {
    1: ((41, 126, 137), (154, 62, 88), (175, 116, 37), (103, 83, 152)),
    2: ((73, 106, 179), (197, 90, 62), (69, 134, 81), (193, 145, 46)),
}
TROUSERS = {
    1: ((49, 66, 106), (63, 82, 72), (67, 56, 80), (53, 81, 87)),
    2: ((76, 67, 100), (42, 78, 105), (86, 68, 53), (55, 60, 86)),
}
HAIR = {
    1: ((84, 55, 49), (117, 74, 42), (67, 57, 83), (108, 81, 47)),
    2: ((69, 51, 72), (137, 96, 55), (73, 64, 47), (102, 58, 48)),
}


def is_skin(rgb):
    """Riconosce le carnagioni calde delle tavole esistenti, ombre incluse.

    È intenzionalmente prudente: alcuni marroni dei vestiti restano uguali,
    ma nessuna pelle va ricolorata come una giacca.
    """
    r, g, b = rgb
    return (r >= 105 and .62 <= g / r <= .91 and .43 <= b / g <= .92
            and r > g > b and r - b >= 27)


def tinted(rgb, target):
    luminance = (rgb[0] * 30 + rgb[1] * 59 + rgb[2] * 11) / 100
    factor = max(.45, min(1.32, .42 + luminance / 175))
    return tuple(min(255, round(channel * factor)) for channel in target)


def recolor(source, variant, source_index):
    output = source.copy()
    src, dst = source.load(), output.load()
    for y in range(source.height):
        local_y = y % 40
        for x in range(source.width):
            r, g, b, a = src[x, y]
            if not a or (r, g, b) in INK or is_skin((r, g, b)):
                continue
            person = ((x // 24) // 4 + source_index) % 4
            if local_y < 11:
                target = HAIR[variant][person]
            elif local_y < 27:
                target = PALETTES[variant][person]
            elif local_y < 36:
                target = TROUSERS[variant][person]
            else:
                continue  # suole e ombra a terra restano identiche
            dst[x, y] = (*tinted((r, g, b), target), a)
    return output


def main():
    total = 0
    for index, name in enumerate(SOURCES):
        src_name = f'pedoni-{name}-4x4frames-24x40-rgba.png' if name != 'madre' else 'pedoni-4x4frames-24x40-rgba.png'
        source = Image.open(PEOPLE / src_name).convert('RGBA')
        if source.size != (384, 160):
            raise ValueError(f'{src_name}: dimensioni inattese {source.size}')
        for variant in (1, 2):
            dest = PEOPLE / f'pedoni-{name}-var{variant}-4x4frames-24x40-rgba.png'
            recolor(source, variant, index).save(dest, optimize=True)
            total += dest.stat().st_size
            print(f'{dest.name}: {dest.stat().st_size} byte')
    print(f'TOTALE NUOVI PNG: {total} byte')
    if total > 1_000_000:
        raise SystemExit('Limite di 1 MB superato: avvisare Simone prima di integrare')


if __name__ == '__main__':
    main()
