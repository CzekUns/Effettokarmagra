#!/usr/bin/env python3
"""Lotto 9: Doblò II e Fiorino III, 4x4 celle 52x92 viste dall'alto."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageFont

HERE = Path(__file__).resolve().parent
CW, CH = 52, 92
OUTLINE = (28, 31, 34, 255)
RUBBER = (40, 42, 45, 255)
BUMPER = (66, 70, 74, 255)
BUMPER_HI = (98, 103, 108, 255)
GLASS = (44, 58, 68, 255)
GLASS_DK = (30, 39, 46, 255)
GLASS_HI = (112, 138, 150, 255)
HEAD = (246, 238, 196, 255)
TAIL = (186, 38, 36, 255)
TAIL_HI = (226, 86, 70, 255)
BG = (243, 239, 227)

# Sono interpretazioni grafiche, non campioni vernice.
DOBLO = [
    ('white', '#e2e0d8', None, None),
    ('white-stripe', '#e2e0d8', '#387e9d', None),
    ('grey', '#9ba6a8', None, None),
    ('blue', '#426783', None, None),
    ('red', '#a74743', None, None),
    ('yellow', '#c3a34e', None, None),
    ('darkgreen', '#58694e', None, None),
    ('white-edilizia', '#e2e0d8', None, 'EDILIZIA'),
]
FIORINO = [
    ('white', '#e2e0d8', None, None),
    ('white-stripe', '#e2e0d8', '#a65942', None),
    ('grey', '#9ba6a8', None, None),
    ('blue', '#426783', None, None),
    ('red', '#a74743', None, None),
    ('yellow', '#c3a34e', None, None),
    ('darkgreen', '#58694e', None, None),
    ('white-frutta', '#e2e0d8', None, 'FRUTTA'),
]

# Fonte 3x5 disegnata a pixel: leggibile anche senza font esterni.
LETTERS = {
    'A': ('010','101','111','101','101'),
    'D': ('110','101','101','101','110'),
    'E': ('111','100','110','100','111'),
    'F': ('111','100','110','100','100'),
    'I': ('111','010','010','010','111'),
    'L': ('100','100','100','100','111'),
    'R': ('110','101','110','101','101'),
    'T': ('111','010','010','010','010'),
    'U': ('101','101','101','101','111'),
    'Z': ('111','001','010','100','111'),
}


def rgb(value):
    return tuple(bytes.fromhex(value[1:]))


def tone(base, factor):
    if factor >= 1:
        return tuple(min(255, round(v + (255-v)*(factor-1))) for v in base) + (255,)
    return tuple(max(0, round(v*factor)) for v in base) + (255,)


def word(draw, name, center_x, y, color):
    width = len(name)*4-1
    x0 = center_x-width//2
    for i, letter in enumerate(name):
        for row, bits in enumerate(LETTERS[letter]):
            for col, bit in enumerate(bits):
                if bit == '1':
                    draw.point((x0+i*4+col, y+row), fill=color)


def geometry(doblo):
    if doblo:
        return dict(x0=6, x1=45, y0=7, y1=84, cab_end=29,
                    roof_top=31, roof_bottom=76, wheel=((18,27),(67,76)),
                    mirror=23, round=3)
    return dict(x0=10, x1=41, y0=17, y1=77, cab_end=37,
                roof_top=39, roof_bottom=71, wheel=((27,35),(61,70)),
                mirror=32, round=5)


def van(doblo, item):
    _, paint, stripe, label = item
    base = rgb(paint)
    g = geometry(doblo)
    x0,x1,y0,y1 = (g[k] for k in ('x0','x1','y0','y1'))
    mid = (x0+x1)//2
    im = Image.new('RGBA', (CW,CH), (0,0,0,0))
    mask = Image.new('L', (CW,CH), 0)
    md = ImageDraw.Draw(mask)
    # Corpo squadrato, muso arrotondato e ruote collegate alla sagoma.
    md.rounded_rectangle((x0,y0+1,x1,y1), radius=g['round'], fill=255)
    for wy0,wy1 in g['wheel']:
        md.rectangle((x0-2,wy0,x0+2,wy1), fill=255)
        md.rectangle((x1-2,wy0,x1+2,wy1), fill=255)
    my = g['mirror']
    md.rectangle((x0-4,my,x0+1,my+2), fill=255)
    md.rectangle((x1-1,my,x1+4,my+2), fill=255)
    im.paste(OUTLINE, (0,0,CW,CH), mask.filter(ImageFilter.MaxFilter(3)))
    p = im.load()
    a = mask.load()
    for y in range(CH):
        for x in range(CW):
            if a[x,y]:
                fac = 1.16 if x < x0+5 else 1.09 if x < x0+12 else 1.04 if x < x1-11 else .92 if x < x1-4 else .75
                p[x,y] = tone(base, fac)
    d = ImageDraw.Draw(im)
    # Ruote, passaruota e paraurti.
    for wy0,wy1 in g['wheel']:
        d.rectangle((x0-2,wy0+1,x0,wy1-1), fill=RUBBER)
        d.rectangle((x1,wy0+1,x1+2,wy1-1), fill=RUBBER)
        d.line((x0+1,wy0,x0+4,wy0), fill=tone(base,.61), width=2)
        d.line((x1-4,wy0,x1-1,wy0), fill=tone(base,.58), width=2)
        d.line((x0+1,wy1,x0+4,wy1), fill=tone(base,.61), width=2)
        d.line((x1-4,wy1,x1-1,wy1), fill=tone(base,.58), width=2)
    d.rectangle((x0+5,y0,x1-5,y0+1), fill=BUMPER)
    d.line((x0+8,y0,x1-8,y0), fill=BUMPER_HI)
    d.rectangle((x0+4,y1,x1-4,y1+1), fill=BUMPER)
    d.line((x0+7,y1,x1-7,y1), fill=BUMPER_HI)
    # Fari anteriori del Doblò più larghi; Fiorino piccoli e verticali.
    for lx in (x0+2,x1-6):
        d.polygon([(lx,y0+3),(lx+4,y0+3),(lx+5,y0+6),(lx+2,y0+7)], fill=HEAD)
        d.line((lx+1,y0+3,lx+4,y0+3), fill=(255,251,222,255))
        d.point((lx+4,y0+7), fill=(238,150,44,255))
    # Cofano e parabrezza ampio, riflesso diagonale.
    d.polygon([(x0+5,y0+3),(x1-5,y0+3),(x1-2,y0+12),
               (x0+2,y0+12)], fill=tone(base,1.18))
    d.line((mid,y0+4,mid,y0+10), fill=tone(base,1.27), width=2)
    wy = y0+14
    d.polygon([(x0+3,wy+2),(x0+7,wy),(x1-7,wy),(x1-3,wy+2),
               (x1-3,wy+8),(x0+3,wy+8)], fill=GLASS_DK)
    d.polygon([(x0+5,wy+2),(x1-5,wy+2),(x1-5,wy+7),
               (x0+5,wy+7)], fill=GLASS)
    d.line((x0+8,wy+2,x0+15,wy+2), fill=GLASS_HI, width=2)
    d.line((x0+15,wy+2,x0+20,wy+6), fill=(87,111,119,255))
    d.line((x0+3,wy+9,x1-3,wy+9), fill=tone(base,.59))
    # Specchi e brevi vetrature laterali della cabina.
    for mx in (x0-4,x1+1):
        d.rectangle((mx,my,mx+3,my+2), fill=OUTLINE)
        d.line((mx+1,my+1,mx+2,my+1), fill=BUMPER_HI)
    d.line((x0+1,wy+9,x0+1,g['cab_end']-2), fill=GLASS_DK, width=2)
    d.line((x1-1,wy+9,x1-1,g['cab_end']-2), fill=GLASS_DK, width=2)
    # Stacco del tetto alto e superficie centrale luminosa con nervature.
    rt,rb = g['roof_top'],g['roof_bottom']
    d.rectangle((x0+1,rt-2,x1-1,rt), fill=tone(base,.55))
    d.rectangle((x0+3,rt+1,x1-3,rb), fill=tone(base,1.13))
    d.line((x0+3,rt+2,x0+3,rb-1), fill=tone(base,1.25), width=2)
    d.line((x1-3,rt+2,x1-3,rb-1), fill=tone(base,.75), width=2)
    for ry in range(rt+7,rb-5,8):
        d.line((x0+5,ry,x1-5,ry), fill=tone(base,.86))
        d.line((x0+5,ry+1,x1-5,ry+1), fill=tone(base,1.26))
    # Guide delle porte scorrevoli lungo i due lati.
    for sy in (rt+8,rb-10):
        d.line((x0,sy,x0+4,sy), fill=tone(base,.59))
        d.line((x1-4,sy,x1,sy), fill=tone(base,.59))
    d.line((x0+2,rt+4,x0+2,rb-4), fill=tone(base,.65))
    d.line((x1-2,rt+4,x1-2,rb-4), fill=tone(base,.64))
    if stripe:
        band = rgb(stripe)
        d.rectangle((x0+5,rt+14,x1-5,rt+18), fill=band+(255,))
        d.line((x0+5,rt+19,x1-5,rt+19), fill=tone(band,.72))
        d.line((x0+1,rt+3,x0+1,rb-3), fill=band+(255,), width=2)
        d.line((x1-1,rt+3,x1-1,rb-3), fill=tone(band,.77), width=2)
    if label:
        # Fondo chiaro e lettere molto scure: EDILIZIA/FRUTTA sono generici.
        label_y = rt+22 if doblo else rt+13
        d.rectangle((x0+4,label_y-2,x1-4,label_y+6), fill=(237,232,211,255))
        word(d,label,mid,label_y,(49,62,68,255))
    # Portellone sdoppiato, maniglie, fanali posteriori.
    d.line((mid,rb+1,mid,y1-2), fill=tone(base,.56))
    d.point((mid-2,y1-5), fill=(57,60,60,255))
    d.point((mid+2,y1-5), fill=(57,60,60,255))
    for tx in (x0+1,x1-3):
        d.rectangle((tx,y1-8,tx+2,y1-3), fill=TAIL)
        d.line((tx,y1-8,tx+1,y1-8), fill=TAIL_HI)
        d.point((tx+2,y1-4), fill=(238,150,44,255))
    # Ultimo pixel opaco a contatto col trasparente sempre scuro.
    alpha=im.getchannel('A')
    p=im.load()
    for y in range(1,CH-1):
        for x in range(1,CW-1):
            if alpha.getpixel((x,y)) and any(alpha.getpixel(pt)==0 for pt in
                ((x-1,y),(x+1,y),(x,y-1),(x,y+1))):
                p[x,y]=OUTLINE
    return im


def main():
    atlas=Image.new('RGBA',(CW*4,CH*4),(0,0,0,0))
    variants=[(True,v) for v in DOBLO]+[(False,v) for v in FIORINO]
    for i,(is_doblo,item) in enumerate(variants):
        atlas.alpha_composite(van(is_doblo,item),((i%4)*CW,(i//4)*CH))
    atlas.save(HERE/'doblo-fiorino-16-rgba.png',optimize=True)
    ref=Image.open(HERE/'riferimento-servizio-16-rgba.png').convert('RGBA')
    if ref.size!=(208,368):
        raise SystemExit(f'Riferimento Q18 inatteso: {ref.size}')
    zoom,gap,top=3,28,24
    pw,ph=208*zoom,368*zoom
    sheet=Image.new('RGB',(pw*2+gap,ph+top),BG)
    sd=ImageDraw.Draw(sheet)
    sd.text((8,5),'LOTTO 9: DOBLO II + FIORINO III',fill=(39,39,39),font=ImageFont.load_default())
    sd.text((pw+gap+8,5),'Q18: CORRIERE + NETTEZZA',fill=(39,39,39),font=ImageFont.load_default())
    for art,x in ((atlas,0),(ref,pw+gap)):
        flat=Image.new('RGB',art.size,BG)
        flat.paste(art,mask=art.getchannel('A'))
        sheet.paste(flat.resize((pw,ph),Image.Resampling.NEAREST),(x,top))
    sheet.save(HERE/'sheet.png',optimize=True)
    print('Creati atlante 208x368 RGBA e sheet 1276x1128 RGB, confronto alla scala 3x')


if __name__=='__main__':
    main()
