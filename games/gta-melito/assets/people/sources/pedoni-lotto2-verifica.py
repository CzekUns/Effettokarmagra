#!/usr/bin/env python3
"""Verifica tecnica dell'atlante pedoni e del confronto con la reference."""
from pathlib import Path
from PIL import Image

HERE = Path(__file__).resolve().parent
ATLAS = HERE / 'pedoni-lotto2-4x4frames-24x40-rgba.png'
REF = HERE / 'riferimento-pedoni.png'
SHEET = HERE / 'sheet.png'
CW, CH = 24, 40
BG = (242, 238, 223)
SOURCE = (2, 3, 0, 1)


def rgba_on_bg(image):
    out = Image.new('RGB', image.size, BG)
    out.paste(image, mask=image.getchannel('A'))
    return out


def check_cell(cell, char, direction, frame, reference):
    label = f'personaggio {char + 1}, direzione {direction + 1}, frame {frame + 1}'
    faults = []
    alpha = cell.getchannel('A')
    vals = set(alpha.get_flattened_data())
    if vals != {0, 255}:
        faults.append(f'{label}: alpha non binario {sorted(vals)}')
    bbox = alpha.getbbox()
    if bbox is None:
        faults.append(f'{label}: cella vuota')
        return faults
    if bbox[0] < 1 or bbox[1] < 1 or bbox[2] > CW - 1 or bbox[3] > CH - 1:
        faults.append(f'{label}: soggetto a contatto con il bordo {bbox}')
    if not 32 <= bbox[3] <= 39:
        faults.append(f'{label}: piedi fuori posizione {bbox}')
    area = sum(1 for value in alpha.get_flattened_data() if value)
    if not 280 <= area <= 510:
        faults.append(f'{label}: area anomala {area}')
    for p in ((0, 0), (CW - 1, 0), (0, CH - 1), (CW - 1, CH - 1)):
        if alpha.getpixel(p):
            faults.append(f'{label}: angolo opaco {p}')
    for y in range(CH):
        for x in range(CW):
            r, g, b, a = cell.getpixel((x, y))
            if a == 0 and (r, g, b) != (0, 0, 0):
                faults.append(f'{label}: RGB residuo nel trasparente a {x},{y}')
                break
            if a and min(r, g, b) >= 210:
                edge = any(alpha.getpixel((nx, ny)) == 0 for nx, ny in
                           ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1))
                           if 0 <= nx < CW and 0 <= ny < CH)
                if edge:
                    faults.append(f'{label}: alone chiaro a {x},{y}')
                    break
        if faults:
            break
    # L'adattamento non deve alterare dimensioni e posa della reference.
    original = reference.getchannel('A')
    overlap = sum(1 for y in range(CH) for x in range(CW)
                  if alpha.getpixel((x, y)) and original.getpixel((x, y)))
    original_area = sum(1 for v in original.get_flattened_data() if v)
    if overlap < original_area * .92:
        faults.append(f'{label}: posa non allineata alla reference')
    return faults


def main():
    for p in (ATLAS, REF, SHEET):
        if not p.exists():
            raise SystemExit(f'Manca {p.name}: esegui prima python3 genera.py')
    atlas = Image.open(ATLAS)
    ref = Image.open(REF).convert('RGBA')
    sheet = Image.open(SHEET)
    faults = []
    if atlas.mode != 'RGBA' or atlas.size != (384, 160):
        faults.append(f'atlante {atlas.mode} {atlas.size}, atteso RGBA 384x160')
    if ref.size != (384, 160):
        faults.append(f'reference {ref.size}, atteso 384x160')
    if sheet.mode != 'RGB' or sheet.size != (2334, 502):
        faults.append(f'sheet {sheet.mode} {sheet.size}, atteso RGB 2334x502')
    if faults:
        raise SystemExit('\n'.join(faults))
    for direction in range(4):
        for char, source in enumerate(SOURCE):
            frames = []
            for frame in range(4):
                col = char * 4 + frame
                box = (col * CW, direction * CH, (col + 1) * CW, (direction + 1) * CH)
                src_col = source * 4 + frame
                src_box = (src_col * CW, direction * CH,
                           (src_col + 1) * CW, (direction + 1) * CH)
                cell = atlas.crop(box)
                faults.extend(check_cell(cell, char, direction, frame, ref.crop(src_box)))
                frames.append(cell.tobytes())
            if len(set(frames)) != 4:
                faults.append(f'personaggio {char + 1}, direzione {direction + 1}: frame ripetuti')
    for char in range(4):
        front = [atlas.crop(((char * 4) * CW, row * CH,
                             (char * 4 + 1) * CW, (row + 1) * CH)).tobytes()
                 for row in range(4)]
        if len(set(front)) != 4:
            faults.append(f'personaggio {char + 1}: direzioni ripetute')
    zoom, gap, top = 3, 30, 22
    w, h = 384 * zoom, 160 * zoom
    expected_new = rgba_on_bg(atlas).resize((w, h), Image.Resampling.NEAREST)
    expected_ref = rgba_on_bg(ref).resize((w, h), Image.Resampling.NEAREST)
    if sheet.crop((0, top, w, top + h)).tobytes() != expected_new.tobytes():
        faults.append('sheet: atlante nuovo non corrispondente o scala diversa')
    if sheet.crop((w + gap, top, 2 * w + gap, top + h)).tobytes() != expected_ref.tobytes():
        faults.append('sheet: reference non corrispondente o scala diversa')
    if faults:
        raise SystemExit('\n'.join(faults))
    print('OK: 64/64 celle, 4 personaggi × 4 direzioni × 4 frame, RGBA 384x160;')
    print('    piedi dentro cella, margini e angoli trasparenti, alpha binario, nessun alone chiaro;')
    print('    camminate distinte e confronto con reference alla stessa scala 3x.')


if __name__ == '__main__':
    main()
