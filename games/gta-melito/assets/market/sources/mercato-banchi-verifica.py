#!/usr/bin/env python3
"""Verifica atlante mercato dall'alto e confronto con Ape ortofrutta."""
from collections import deque
from pathlib import Path
from PIL import Image

HERE = Path(__file__).resolve().parent
ATLAS = HERE / 'mercato-banchi-14-teli-4-rgba.png'
SHEET = HERE / 'sheet.png'
APE = HERE / 'riferimento-ape-food.png'
CW, CH, COLS = 64, 48, 6
BG = (242, 238, 223)
WIDTHS = [48, 36, 36, 48, 36, 48, 36, 36, 36, 36, 36, 24, 48, 36]


def on_bg(image):
    result = Image.new('RGB', image.size, BG)
    result.paste(image, mask=image.getchannel('A'))
    return result


def components(alpha):
    remaining = {(x, y) for y in range(CH) for x in range(CW)
                 if alpha.getpixel((x, y))}
    sizes = []
    while remaining:
        queue = deque([remaining.pop()])
        count = 0
        while queue:
            x, y = queue.popleft()
            count += 1
            for p in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
                if p in remaining:
                    remaining.remove(p)
                    queue.append(p)
        sizes.append(count)
    return sorted(sizes, reverse=True)


def check_cell(cell, index):
    faults = []
    a = cell.getchannel('A')
    vals = set(a.get_flattened_data())
    if vals != {0, 255}:
        faults.append(f'cella {index:02}: alpha non binario {sorted(vals)}')
    bounds = a.getbbox()
    if bounds is None:
        return [f'cella {index:02}: vuota']
    if bounds[0] < 4 or bounds[1] < 4 or bounds[2] > CW - 4 or bounds[3] > CH - 4:
        faults.append(f'cella {index:02}: bordo tagliato {bounds}')
    if index < 14 and bounds[2] - bounds[0] != WIDTHS[index] + 2:
        faults.append(f'cella {index:02}: larghezza {bounds[2]-bounds[0]}, '
                      f'attesa {WIDTHS[index]+2} con ombra')
    sizes = components(a)
    if len(sizes) != 1:
        faults.append(f'cella {index:02}: {len(sizes)} componenti opache')
    if not 700 <= sizes[0] <= 2000:
        faults.append(f'cella {index:02}: area anomala {sizes[0]}')
    for p in ((0, 0), (CW - 1, 0), (0, CH - 1), (CW - 1, CH - 1)):
        if a.getpixel(p):
            faults.append(f'cella {index:02}: angolo opaco {p}')
    for y in range(CH):
        for x in range(CW):
            r, g, b, alpha = cell.getpixel((x, y))
            if not alpha and (r, g, b) != (0, 0, 0):
                faults.append(f'cella {index:02}: RGB nel trasparente a {x},{y}')
                break
            if alpha and min(r, g, b) >= 210:
                if any(a.getpixel(p) == 0 for p in
                       ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1))
                       if 0 <= p[0] < CW and 0 <= p[1] < CH):
                    faults.append(f'cella {index:02}: alone chiaro a {x},{y}')
                    break
        if faults:
            break
    # Il lato dei clienti (+Y) deve contenere l'orlo scuro, senza facciata alta.
    if not any(a.getpixel((x, 36)) for x in range(CW)):
        faults.append(f'cella {index:02}: manca orlo anteriore')
    return faults


def main():
    for path in (ATLAS, SHEET, APE):
        if not path.exists():
            raise SystemExit(f'Manca {path.name}: esegui prima genera.py')
    atlas = Image.open(ATLAS)
    sheet = Image.open(SHEET)
    ape = Image.open(APE).convert('RGBA')
    faults = []
    if atlas.mode != 'RGBA' or atlas.size != (384, 144):
        faults.append(f'atlas {atlas.mode} {atlas.size}, atteso RGBA 384x144')
    if sheet.mode != 'RGB' or sheet.size != (1792, 600):
        faults.append(f'sheet {sheet.mode} {sheet.size}, atteso RGB 1792x600')
    if ape.size != (224, 256):
        faults.append(f'Ape {ape.size}, atteso 224x256')
    if faults:
        raise SystemExit('\n'.join(faults))
    variants = []
    for i in range(18):
        x, y = (i % COLS) * CW, (i // COLS) * CH
        cell = atlas.crop((x, y, x + CW, y + CH))
        faults.extend(check_cell(cell, i))
        variants.append(cell.tobytes())
    if len(set(variants)) != 18:
        faults.append('celle ripetute fra banchi o teli')
    zoom, top, gap = 4, 24, 32
    left_w, left_h = 384 * zoom, 144 * zoom
    expected_atlas = on_bg(atlas).resize((left_w, left_h), Image.Resampling.NEAREST)
    if sheet.crop((0, top, left_w, top + left_h)).tobytes() != expected_atlas.tobytes():
        faults.append('sheet: atlante non corrispondente alla scala 4x')
    sample = ape.crop((112, 0, 168, 64))
    expected_ape = on_bg(sample).resize((56 * zoom, 64 * zoom),
                                       Image.Resampling.NEAREST)
    x0, y0 = left_w + gap, top + 8
    if sheet.crop((x0, y0, x0 + 56 * zoom, y0 + 64 * zoom)).tobytes() != expected_ape.tobytes():
        faults.append('sheet: Ape non corrispondente alla scala 4x')
    if faults:
        raise SystemExit('\n'.join(faults))
    print('OK: 18/18 celle, 14 banchi + 4 teli, RGBA 384x144, celle 64x48;')
    print('    dettaglio 2x rispetto a market.mjs PX=4, margini e angoli trasparenti,')
    print('    alpha binario, un corpo, nessun alone, Ape affiancata alla scala 4x.')


if __name__ == '__main__':
    main()
