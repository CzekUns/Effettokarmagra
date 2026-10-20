# Q18 — atlante 4x4 dei veicoli di servizio: righe 1-2 furgone del corriere (8 livree), righe 3-4 camion
# della nettezza urbana con compattatore (8 livree). Vista esattamente dall'alto, muso verso l'alto (-Y).
# Pixel art disegnata a mano via codice, celle 52x92, RGBA con alpha reale; livree inventate, senza scritte.
import sys
from PIL import Image

CW, CH = 52, 92
OUT = sys.argv[1]          # atlante RGBA 208x368
SHEET = sys.argv[2]        # tavola di presentazione su bianco (x4)

OUTLINE = (28, 31, 34, 255)
GLASS = (44, 58, 68, 255)
GLASS_HI = (112, 138, 150, 255)
GLASS_DK = (30, 39, 46, 255)
RUBBER = (40, 42, 45, 255)
BUMPER = (66, 70, 74, 255)
BUMPER_HI = (98, 103, 108, 255)
HEAD = (246, 238, 196, 255)
INDICATOR = (238, 150, 44, 255)
TAIL = (186, 38, 36, 255)
TAIL_HI = (226, 86, 70, 255)
BEACON = (250, 160, 30, 255)
BEACON_HI = (255, 214, 120, 255)
METAL = (98, 104, 110, 255)
METAL_HI = (138, 145, 150, 255)
METAL_DK = (66, 71, 76, 255)


def shade(c, k):
    """k>1 schiarisce verso il bianco, k<1 scurisce."""
    r, g, b = c[:3]
    if k >= 1:
        t = k - 1
        return (int(r + (255 - r) * t), int(g + (255 - g) * t), int(b + (255 - b) * t), 255)
    return (int(r * k), int(g * k), int(b * k), 255)


class Cell:
    def __init__(self):
        self.im = Image.new('RGBA', (CW, CH), (0, 0, 0, 0))
        self.px = self.im.load()

    def put(self, x, y, c):
        if 0 <= x < CW and 0 <= y < CH:
            self.px[x, y] = c

    def rect(self, x0, y0, x1, y1, c):
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1):
                self.put(x, y, c)

    def body(self, x0, y0, x1, y1, base, r=3, light='center'):
        """Pannello con angoli arrotondati e luce dall'alto a sinistra: centro chiaro, fianchi scuri."""
        w = x1 - x0
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1):
                dx = min(x - x0, x1 - x)
                dy = min(y - y0, y1 - y)
                if dx < r and dy < r and (r - dx) ** 2 + (r - dy) ** 2 > r * r + 1:
                    continue
                t = (x - x0) / max(1, w)
                if dx == 0 or dy == 0:
                    c = shade(base, .62)
                elif dx == 1:
                    c = shade(base, .80) if t > .5 else shade(base, .9)
                elif t < .22:
                    c = shade(base, 1.06)
                elif t > .78:
                    c = shade(base, .9)
                else:
                    c = shade(base, 1.12) if light == 'center' else base
                self.put(x, y, c)

    def outline(self):
        im = self.im
        src = im.copy()
        sp = src.load()
        for y in range(CH):
            for x in range(CW):
                if sp[x, y][3] == 0:
                    for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
                        if 0 <= nx < CW and 0 <= ny < CH and sp[nx, ny][3] > 0 and sp[nx, ny] != OUTLINE:
                            self.px[x, y] = OUTLINE
                            break


def courier(liv):
    """Furgone compatto da corriere (tipo Doblò/Kangoo a tetto alto): cofano, parabrezza inclinato,
    cabina e vano di carico più largo con tetto rialzato."""
    c = Cell()
    base, band, roof = liv['body'], liv.get('band'), liv.get('roof', liv['body'])
    X0, X1 = 6, 45          # vano: 40 px di larghezza
    Y0, Y1 = 13, 78         # 66 px di lunghezza
    H0, H1 = X0 + 2, X1 - 2  # cofano e cabina più stretti del vano
    # gomme (passaruota) appena sporgenti
    for yy in (21, 64):
        c.rect(H0 - 1 if yy < 40 else X0 - 1, yy, (H0 if yy < 40 else X0), yy + 6, RUBBER)
        c.rect((H1 if yy < 40 else X1), yy, (H1 + 1 if yy < 40 else X1 + 1), yy + 6, RUBBER)
    # cofano + cabina
    c.body(H0, Y0 + 1, H1, Y0 + 26, base, r=5)
    # vano di carico
    c.body(X0, Y0 + 24, X1, Y1, roof, r=2)
    # paraurti anteriore
    c.rect(H0 + 3, Y0, H1 - 3, Y0 + 1, BUMPER)
    c.rect(H0 + 6, Y0, H1 - 6, Y0, BUMPER_HI)
    # fari obliqui e frecce
    for i in range(3):
        c.rect(H0 + 1 + i, Y0 + 2 + i, H0 + 3 + i, Y0 + 2 + i, HEAD)
        c.rect(H1 - 3 - i, Y0 + 2 + i, H1 - 1 - i, Y0 + 2 + i, HEAD)
    c.put(H0 + 1, Y0 + 5, INDICATOR); c.put(H1 - 1, Y0 + 5, INDICATOR)
    # cofano: costola centrale chiara e due nervature laterali
    mid = (H0 + H1) // 2
    for y in range(Y0 + 3, Y0 + 11):
        c.put(mid, y, shade(base, 1.24)); c.put(mid + 1, y, shade(base, 1.18))
        c.put(H0 + 6, y, shade(base, .9)); c.put(H1 - 6, y, shade(base, .9))
    # parabrezza a trapezio, più largo verso la cabina
    for i, y in enumerate(range(Y0 + 11, Y0 + 18)):
        inset = 5 - min(4, (i + 1) // 2)
        for x in range(H0 + inset, H1 - inset + 1):
            c.put(x, y, GLASS)
        hx = H0 + inset + 3 + i * 2
        c.put(hx, y, GLASS_HI); c.put(hx + 1, y, GLASS_HI)
    c.rect(H0 + 2, Y0 + 18, H1 - 2, Y0 + 18, GLASS_DK)
    # specchietti
    for sx, hx in ((H0 - 4, H0 - 3), (H1 + 1, H1 + 2)):
        c.rect(sx, Y0 + 13, sx + 3, Y0 + 15, OUTLINE); c.rect(hx, Y0 + 14, hx + 1, Y0 + 14, BUMPER_HI)
    # finestrini laterali e tetto della cabina
    for y in range(Y0 + 18, Y0 + 24):
        c.put(H0 + 1, y, GLASS_DK); c.put(H1 - 1, y, GLASS_DK)
    c.rect(H0 + 4, Y0 + 19, H1 - 4, Y0 + 22, shade(base, 1.16))
    # gradino del tetto alto: ombra e spigolo chiaro
    c.rect(X0 + 1, Y0 + 25, X1 - 1, Y0 + 25, shade(roof, .5))
    c.rect(X0 + 1, Y0 + 26, X1 - 1, Y0 + 26, shade(roof, 1.22))
    # pannello del tetto rialzato (bordo) e nervature
    for y in range(Y0 + 28, Y1 - 4):
        c.put(X0 + 4, y, shade(roof, .82)); c.put(X1 - 4, y, shade(roof, .82))
    for y in range(Y0 + 32, Y1 - 7, 7):
        c.rect(X0 + 5, y, X1 - 5, y, shade(roof, .86))
        c.rect(X0 + 5, y + 1, X1 - 5, y + 1, shade(roof, 1.18))
    # oblò di aerazione sul tetto
    c.rect(mid - 3, Y0 + 30, mid + 3, Y0 + 32, shade(roof, .7))
    c.rect(mid - 2, Y0 + 30, mid + 2, Y0 + 30, shade(roof, 1.25))
    # livrea: fascia sui fianchi del vano e, se prevista, una banda sul tetto
    if band:
        for y in range(Y0 + 27, Y1 - 3):
            c.put(X0 + 1, y, band); c.put(X0 + 2, y, shade(band, .8))
            c.put(X1 - 1, y, band); c.put(X1 - 2, y, shade(band, .8))
        if liv.get('roofband'):
            c.rect(X0 + 5, Y0 + 44, X1 - 5, Y0 + 48, band)
            c.rect(X0 + 5, Y0 + 49, X1 - 5, Y0 + 49, shade(band, .75))
    # porte posteriori a battente, fanali verticali e paraurti
    c.rect(mid, Y1 - 9, mid, Y1 - 1, shade(roof, .55))
    c.put(mid - 2, Y1 - 5, shade(roof, .45)); c.put(mid + 2, Y1 - 5, shade(roof, .45))
    for x in (X0 + 1, X1 - 2):
        c.rect(x, Y1 - 6, x + 1, Y1 - 1, TAIL)
        c.put(x, Y1 - 5, TAIL_HI)
    c.rect(X0 + 3, Y1 + 1, X1 - 3, Y1 + 2, BUMPER)
    c.rect(X0 + 6, Y1 + 1, X1 - 6, Y1 + 1, BUMPER_HI)
    if liv.get('dirt'):
        dirty(c, X0, Y0 + 24, X1, Y1, liv['dirt'])
    c.outline()
    return c.im


def compactor(liv):
    """Camion della nettezza urbana: cabina larga e piatta, cassone compattatore nervato, vasca posteriore."""
    c = Cell()
    base, body, band = liv['cab'], liv['body'], liv.get('band')
    X0, X1 = 4, 47          # 44 px: gli specchi restano dentro la cella
    Y0, Y1 = 2, 88          # 87 px
    # gomme: anteriore e due assi posteriori
    for yy in (8, 56, 66):
        c.rect(X0 - 1, yy, X0, yy + 7, RUBBER)
        c.rect(X1, yy, X1 + 1, yy + 7, RUBBER)
    # cabina avanzata
    c.body(X0 + 1, Y0 + 1, X1 - 1, Y0 + 17, base, r=3)
    c.rect(X0 + 2, Y0, X1 - 2, Y0 + 1, BUMPER)
    c.rect(X0 + 5, Y0, X1 - 5, Y0, BUMPER_HI)
    for x in (X0 + 2, X1 - 6):
        c.rect(x, Y0 + 2, x + 4, Y0 + 3, HEAD)
    c.put(X0 + 2, Y0 + 4, INDICATOR); c.put(X1 - 2, Y0 + 4, INDICATOR)
    # parabrezza panoramico
    for i, y in enumerate(range(Y0 + 4, Y0 + 9)):
        for x in range(X0 + 3, X1 - 2):
            c.put(x, y, GLASS)
        hx = X0 + 7 + i * 3
        c.put(hx, y, GLASS_HI); c.put(hx + 1, y, GLASS_HI)
    c.rect(X0 + 3, Y0 + 9, X1 - 3, Y0 + 9, GLASS_DK)
    # specchi grandi da camion
    for sx in (X0 - 4, X1 + 1):
        c.rect(sx, Y0 + 4, sx + 3, Y0 + 7, OUTLINE)
        c.rect(sx + 1, Y0 + 5, sx + 2, Y0 + 6, METAL_HI)
    # tetto della cabina con i due lampeggianti arancioni
    c.rect(X0 + 5, Y0 + 11, X1 - 5, Y0 + 15, shade(base, 1.14))
    for bx in (X0 + 9, X1 - 12):
        c.rect(bx, Y0 + 12, bx + 3, Y0 + 14, BEACON)
        c.put(bx + 1, Y0 + 12, BEACON_HI); c.put(bx + 2, Y0 + 13, BEACON_HI)
    # stacco scuro tra cabina e cassone
    c.rect(X0 + 2, Y0 + 18, X1 - 2, Y0 + 20, (34, 36, 39, 255))
    # cassone compattatore: arrotondato e nervato
    c.body(X0, Y0 + 21, X1, Y0 + 70, body, r=3)
    for y in range(Y0 + 26, Y0 + 69, 6):
        c.rect(X0 + 2, y, X1 - 2, y, shade(body, .8))
        c.rect(X0 + 2, y + 1, X1 - 2, y + 1, shade(body, 1.16))
    if band:
        for y in range(Y0 + 23, Y0 + 69):
            c.put(X0 + 1, y, band); c.put(X0 + 2, y, shade(band, .82))
            c.put(X1 - 1, y, band); c.put(X1 - 2, y, shade(band, .82))
        if liv.get('roofband'):
            c.rect(X0 + 4, Y0 + 40, X1 - 4, Y0 + 45, band)
            c.rect(X0 + 4, Y0 + 46, X1 - 4, Y0 + 46, shade(band, .72))
    # vasca di carico posteriore in metallo, con pistoni e alzacassonetti
    c.body(X0 + 1, Y0 + 71, X1 - 1, Y1 - 2, METAL, r=2, light='flat')
    c.rect(X0 + 4, Y0 + 72, X1 - 4, Y0 + 72, METAL_HI)
    for px_ in (X0 + 9, X1 - 10):
        c.rect(px_, Y0 + 73, px_ + 1, Y1 - 4, METAL_HI)
        c.rect(px_ + 2, Y0 + 73, px_ + 2, Y1 - 4, METAL_DK)
    c.rect(X0 + 13, Y0 + 77, X1 - 13, Y0 + 79, (54, 58, 62, 255))
    c.rect(X0 + 4, Y1 - 3, X1 - 4, Y1 - 1, (48, 51, 55, 255))
    c.rect(X0 + 6, Y1 - 2, X1 - 6, Y1 - 2, METAL_HI)
    # fanali posteriori e luci di ingombro arancioni
    for x in (X0 + 1, X1 - 3):
        c.rect(x, Y1 - 6, x + 2, Y1 - 3, TAIL); c.put(x + 1, Y1 - 5, TAIL_HI)
    c.put(X0 + 1, Y0 + 23, INDICATOR); c.put(X1 - 1, Y0 + 23, INDICATOR)
    if liv.get('dirt'):
        dirty(c, X0, Y0 + 21, X1, Y0 + 70, liv['dirt'])
    c.outline()
    return c.im


def dirty(c, x0, y0, x1, y1, amount):
    """Usura: poche macchie di sporco a chiazze (non rumore), deterministiche, solo sulla carrozzeria."""
    seed = 98765
    def rnd():
        nonlocal seed
        seed = (seed * 1103515245 + 12345) & 0x7fffffff
        return seed / 0x7fffffff
    keep = (GLASS, GLASS_HI, GLASS_DK, TAIL, TAIL_HI, HEAD, INDICATOR, OUTLINE, BEACON, BEACON_HI)
    blobs = int((x1 - x0) * (y1 - y0) * amount / 40)
    for _ in range(blobs):
        cx, cy, r = x0 + 2 + rnd() * (x1 - x0 - 4), y0 + 2 + rnd() * (y1 - y0 - 4), 1 + rnd() * 2.2
        for y in range(int(cy - r), int(cy + r) + 1):
            for x in range(int(cx - r), int(cx + r) + 1):
                if (x - cx) ** 2 + (y - cy) ** 2 <= r * r and 0 <= x < CW and 0 <= y < CH:
                    p = c.px[x, y]
                    if p[3] and p not in keep:
                        k = .82 if (x + y) % 3 else .74
                        c.px[x, y] = (int(p[0] * k + 18), int(p[1] * k + 12), int(p[2] * k + 2), 255)
    # rigature di ruggine lungo il bordo posteriore
    for x in range(x0 + 3, x1 - 3, 5):
        for y in range(y1 - 2 - int(rnd() * 4), y1 - 1):
            p = c.px[x, y]
            if p[3] and p not in keep:
                c.px[x, y] = (128, 84, 52, 255)


WHITE = (232, 234, 232)
COURIERS = [
    ('bianco', dict(body=WHITE)),
    ('bianco-fascia-blu', dict(body=WHITE, band=(46, 92, 168, 255), roofband=True)),
    ('bianco-fascia-verde', dict(body=WHITE, band=(44, 138, 82, 255))),
    ('argento', dict(body=(176, 182, 186))),
    ('grigio-scuro', dict(body=(92, 98, 104))),
    ('blu-notte', dict(body=(38, 58, 104), band=(214, 220, 228, 255))),
    ('azzurro', dict(body=(106, 166, 204), band=WHITE + (255,), roofband=True)),
    ('bianco-vissuto', dict(body=(214, 212, 202), dirt=.18)),
]
GREEN = (52, 132, 78)
TRUCKS = [
    ('verde', dict(cab=GREEN, body=GREEN, band=WHITE + (255,))),
    ('bianco-verde', dict(cab=WHITE, body=WHITE, band=GREEN + (255,), roofband=True)),
    ('bianco-blu', dict(cab=WHITE, body=WHITE, band=(46, 92, 168, 255), roofband=True)),
    ('arancio', dict(cab=(226, 132, 44), body=(226, 132, 44), band=WHITE + (255,))),
    ('grigio', dict(cab=WHITE, body=(150, 156, 160), band=GREEN + (255,))),
    ('verde-scuro', dict(cab=(34, 92, 58), body=(34, 92, 58))),
    ('bianco-arancio', dict(cab=WHITE, body=WHITE, band=(226, 132, 44, 255))),
    ('verde-vissuto', dict(cab=(62, 120, 76), body=(62, 120, 76), band=(208, 210, 200, 255), dirt=.2)),
]

atlas = Image.new('RGBA', (CW * 4, CH * 4), (0, 0, 0, 0))
cells = [courier(l) for _, l in COURIERS] + [compactor(l) for _, l in TRUCKS]
for i, im in enumerate(cells):
    atlas.alpha_composite(im, ((i % 4) * CW, (i // 4) * CH))
atlas.save(OUT, optimize=True)
k = 4
sheet = Image.new('RGBA', (CW * 4 * k + 50, CH * 4 * k + 50), (255, 255, 255, 255))
for i, im in enumerate(cells):
    sheet.alpha_composite(im.resize((CW * k, CH * k), Image.NEAREST), (10 + (i % 4) * (CW * k + 10), 10 + (i // 4) * (CH * k + 10)))
sheet.convert('RGB').save(SHEET, optimize=True)
print('ok', atlas.size, [n for n, _ in COURIERS], [n for n, _ in TRUCKS])
