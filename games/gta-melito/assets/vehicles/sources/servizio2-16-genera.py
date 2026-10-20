# Q19 — atlante 4x4 dei veicoli di servizio, coppia 2/2: righe 1-2 carro attrezzi con pianale (8 livree),
# righe 3-4 autobus urbano corto (8 livree). Vista esattamente dall'alto, muso verso l'alto (-Y).
# Stesso metodo e stessa densità di pixel della Q18 (servizio-16-genera.py, circa 7 px per unità di gioco),
# celle 52x124 per far stare l'autobus; RGBA con alpha reale; livree inventate, senza scritte né marchi.
import sys
from PIL import Image

CW, CH = 52, 124
OUT = sys.argv[1]          # atlante RGBA 208x496
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



AMBER = (246, 168, 40, 255)
AMBER_HI = (255, 222, 140, 255)
DECK = (118, 122, 126, 255)
DECK_HI = (152, 157, 161, 255)
DECK_DK = (84, 88, 92, 255)
ROOF_UNIT = (196, 200, 202, 255)
GRILLE = (52, 55, 58, 255)


def tow(liv):
    """Carro attrezzi con pianale: cabina corta con barra luci arancione, pianale in lamiera
    a listelli con sponde basse, verricello dietro la cabina e rampe di carico in coda."""
    c = Cell()
    base, band = liv['cab'], liv.get('band')
    X0, X1 = 6, 45                    # 40 px come il vano del corriere
    Y0 = 20                           # muso
    CAB1 = Y0 + 21                    # fine cabina
    Y1 = 105                          # coda del pianale (86 px in tutto)
    # gomme: anteriore sotto la cabina, due assi dietro
    for yy in (Y0 + 6, Y1 - 26, Y1 - 15):
        c.rect(X0 - 1, yy, X0, yy + 6, RUBBER)
        c.rect(X1, yy, X1 + 1, yy + 6, RUBBER)
    # cabina con cofano corto
    H0, H1 = X0 + 1, X1 - 1
    c.body(H0, Y0 + 1, H1, CAB1, base, r=4)
    c.rect(H0 + 3, Y0, H1 - 3, Y0 + 1, BUMPER)
    c.rect(H0 + 6, Y0, H1 - 6, Y0, BUMPER_HI)
    for x in (H0 + 2, H1 - 6):
        c.rect(x, Y0 + 2, x + 4, Y0 + 3, HEAD)
    c.put(H0 + 1, Y0 + 4, INDICATOR); c.put(H1 - 1, Y0 + 4, INDICATOR)
    mid = (X0 + X1) // 2
    for y in range(Y0 + 3, Y0 + 7):
        c.put(mid, y, shade(base, 1.24)); c.put(mid + 1, y, shade(base, 1.16))
    # parabrezza
    for i, y in enumerate(range(Y0 + 7, Y0 + 12)):
        inset = 4 - min(3, i)
        for x in range(H0 + inset, H1 - inset + 1):
            c.put(x, y, GLASS)
        hx = H0 + inset + 4 + i * 3
        c.put(hx, y, GLASS_HI); c.put(hx + 1, y, GLASS_HI)
    c.rect(H0 + 2, Y0 + 12, H1 - 2, Y0 + 12, GLASS_DK)
    # specchi
    for sx in (H0 - 4, H1 + 1):
        c.rect(sx, Y0 + 8, sx + 3, Y0 + 10, OUTLINE)
        c.rect(sx + 1, Y0 + 9, sx + 2, Y0 + 9, METAL_HI)
    # tetto della cabina e barra luci arancione trasversale
    c.rect(H0 + 3, Y0 + 13, H1 - 3, CAB1 - 2, shade(base, 1.14))
    c.rect(H0 + 5, Y0 + 15, H1 - 5, Y0 + 17, OUTLINE)
    for bx in range(H0 + 6, H1 - 5, 4):
        c.rect(bx, Y0 + 16, bx + 2, Y0 + 16, AMBER)
        c.put(bx + 1, Y0 + 16, AMBER_HI)
    if band:
        c.rect(H0 + 1, CAB1 - 1, H1 - 1, CAB1 - 1, band)
    # stacco e verricello dietro la cabina
    c.rect(X0 + 1, CAB1 + 1, X1 - 1, CAB1 + 2, (34, 36, 39, 255))
    c.rect(mid - 8, CAB1 + 3, mid + 8, CAB1 + 8, METAL_DK)
    c.rect(mid - 7, CAB1 + 4, mid + 7, CAB1 + 7, METAL)
    for x in range(mid - 6, mid + 7, 2):
        c.put(x, CAB1 + 5, METAL_HI)
    c.rect(mid - 1, CAB1 + 9, mid, CAB1 + 12, (40, 40, 40, 255))   # cavo verso il pianale
    # pianale in lamiera: sponde basse nel colore della livrea, listelli longitudinali
    P0 = CAB1 + 3
    c.body(X0, P0, X1, Y1, liv.get('deck', DECK), r=1, light='flat')
    deck = liv.get('deck', DECK)
    for x in range(X0 + 4, X1 - 3, 4):
        for y in range(P0 + 2, Y1 - 6):
            c.put(x, y, shade(deck, .78))
            c.put(x + 1, y, shade(deck, 1.18))
    side = liv.get('rail', base)
    for y in range(P0, Y1 - 5):
        c.put(X0, y, shade(side, .7)); c.put(X0 + 1, y, side); c.put(X0 + 2, y, shade(side, .85))
        c.put(X1, y, shade(side, .7)); c.put(X1 - 1, y, side); c.put(X1 - 2, y, shade(side, .85))
    # ganci di fissaggio sulle sponde
    for y in range(P0 + 8, Y1 - 8, 12):
        c.put(X0 + 3, y, AMBER); c.put(X1 - 3, y, AMBER)
    # cerniera di ribaltamento e rampe di carico in coda
    c.rect(X0 + 1, Y1 - 6, X1 - 1, Y1 - 6, METAL_DK)
    for rx in (X0 + 5, X1 - 14):
        c.rect(rx, Y1 - 5, rx + 9, Y1 + 2, METAL)
        for y in range(Y1 - 4, Y1 + 2, 2):
            c.rect(rx + 1, y, rx + 8, y, METAL_HI)
    # fanali posteriori e luci di ingombro
    for x in (X0 + 1, X1 - 3):
        c.rect(x, Y1 - 4, x + 2, Y1 - 2, TAIL); c.put(x + 1, Y1 - 3, TAIL_HI)
    c.put(X0 + 1, P0 + 2, INDICATOR); c.put(X1 - 1, P0 + 2, INDICATOR)
    if liv.get('dirt'):
        dirty(c, X0, P0, X1, Y1 - 6, liv['dirt'])
    c.outline()
    return c.im


def bus(liv):
    """Autobus urbano corto: tetto chiaro con due condizionatori e botole, parabrezza panoramico con
    indicatore di linea spento, fasce dei finestrini sui due fianchi (porte a destra), vano motore in coda."""
    c = Cell()
    body, roof, band = liv['body'], liv.get('roof', (226, 228, 226)), liv.get('band')
    X0, X1 = 4, 47                    # 44 px come il camion
    Y0, Y1 = 3, 120                   # 118 px
    for yy in (Y0 + 14, Y1 - 30):
        c.rect(X0 - 1, yy, X0, yy + 8, RUBBER)
        c.rect(X1, yy, X1 + 1, yy + 8, RUBBER)
    # carrozzeria: fianchi nel colore della livrea, tetto chiaro al centro
    c.body(X0, Y0 + 1, X1, Y1, body, r=4)
    c.body(X0 + 5, Y0 + 9, X1 - 5, Y1 - 9, roof, r=2)
    # paraurti, fari e frecce
    c.rect(X0 + 3, Y0, X1 - 3, Y0 + 1, BUMPER)
    c.rect(X0 + 6, Y0, X1 - 6, Y0, BUMPER_HI)
    for x in (X0 + 2, X1 - 6):
        c.rect(x, Y0 + 2, x + 4, Y0 + 3, HEAD)
    c.put(X0 + 2, Y0 + 4, INDICATOR); c.put(X1 - 2, Y0 + 4, INDICATOR)
    # parabrezza panoramico e indicatore di linea (spento, senza numeri)
    for i, y in enumerate(range(Y0 + 4, Y0 + 9)):
        for x in range(X0 + 3, X1 - 2):
            c.put(x, y, GLASS)
        hx = X0 + 6 + i * 4
        c.put(hx, y, GLASS_HI); c.put(hx + 1, y, GLASS_HI)
    c.rect(X0 + 10, Y0 + 9, X1 - 10, Y0 + 10, (24, 26, 28, 255))
    # specchi a pipistrello
    for sx in (X0 - 4, X1 + 1):
        c.rect(sx, Y0 + 3, sx + 3, Y0 + 5, OUTLINE)
        c.rect(sx + 1, Y0 + 4, sx + 2, Y0 + 4, METAL_HI)
    # fasce dei finestrini lungo i fianchi (vetro scuro con riflessi), montanti nel colore
    for y in range(Y0 + 12, Y1 - 12):
        for xx in (X0 + 2, X0 + 3, X1 - 3, X1 - 2):
            c.put(xx, y, GLASS if (y // 3) % 5 else GLASS_HI)
    for y in range(Y0 + 22, Y1 - 12, 14):
        c.rect(X0 + 2, y, X0 + 3, y, body); c.rect(X1 - 3, y, X1 - 2, y, body)
    # porte sul lato destro (anteriore e centrale): vetro più scuro e bordo chiaro
    for dy in (Y0 + 12, Y0 + 56):
        c.rect(X1 - 3, dy, X1 - 2, dy + 9, GLASS_DK)
        c.rect(X1 - 4, dy, X1 - 4, dy + 9, shade(body, 1.25))
    # tetto: due condizionatori e due botole
    mid = (X0 + X1) // 2
    for uy in (Y0 + 20, Y0 + 62):
        c.rect(mid - 11, uy, mid + 11, uy + 14, shade(ROOF_UNIT, .72))
        c.rect(mid - 10, uy + 1, mid + 10, uy + 13, ROOF_UNIT)
        for gx in range(mid - 8, mid + 9, 3):
            c.rect(gx, uy + 3, gx, uy + 11, shade(ROOF_UNIT, .8))
        c.rect(mid - 10, uy + 1, mid + 10, uy + 1, shade(ROOF_UNIT, 1.15))
    for hy in (Y0 + 44, Y0 + 86):
        c.rect(mid - 5, hy, mid + 5, hy + 6, shade(roof, .74))
        c.rect(mid - 4, hy + 1, mid + 4, hy + 5, GLASS_DK)
        c.rect(mid - 4, hy + 1, mid + 4, hy + 1, GLASS_HI)
    # livrea: fascia trasversale sul tetto e filetto lungo i fianchi
    if band:
        c.rect(X0 + 6, Y0 + 38, X1 - 6, Y0 + 41, band)
        c.rect(X0 + 6, Y0 + 42, X1 - 6, Y0 + 42, shade(band, .72))
        for y in range(Y0 + 10, Y1 - 10):
            c.put(X0 + 4, y, band); c.put(X1 - 4, y, band)
    # vano motore in coda con griglia
    c.rect(X0 + 7, Y1 - 8, X1 - 7, Y1 - 3, GRILLE)
    for gx in range(X0 + 9, X1 - 8, 3):
        c.rect(gx, Y1 - 7, gx, Y1 - 4, METAL_HI)
    for x in (X0 + 1, X1 - 3):
        c.rect(x, Y1 - 6, x + 2, Y1 - 2, TAIL); c.put(x + 1, Y1 - 5, TAIL_HI)
    c.rect(X0 + 4, Y1 + 1, X1 - 4, Y1 + 2, BUMPER)
    if liv.get('dirt'):
        dirty(c, X0 + 5, Y0 + 9, X1 - 5, Y1 - 9, liv['dirt'])
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
TOWS = [
    ('giallo', dict(cab=(232, 186, 44), rail=(232, 186, 44))),
    ('arancio', dict(cab=(226, 120, 38), rail=(226, 120, 38))),
    ('bianco-rosso', dict(cab=WHITE, band=(196, 48, 44, 255), rail=(196, 48, 44))),
    ('rosso', dict(cab=(184, 44, 40), rail=(184, 44, 40))),
    ('blu', dict(cab=(46, 86, 156), rail=(46, 86, 156))),
    ('bianco', dict(cab=WHITE, rail=(150, 156, 160))),
    ('grigio-arancio', dict(cab=(120, 126, 132), band=(226, 120, 38, 255), rail=(226, 120, 38))),
    ('giallo-vissuto', dict(cab=(204, 166, 56), rail=(204, 166, 56), dirt=.18)),
]
BUSES = [
    ('arancio', dict(body=(222, 118, 40))),
    ('verde-bianco', dict(body=(52, 132, 78), band=(52, 132, 78, 255))),
    ('blu-bianco', dict(body=(46, 92, 168), band=(46, 92, 168, 255))),
    ('rosso', dict(body=(184, 50, 44))),
    ('bianco-azzurro', dict(body=WHITE, band=(96, 160, 204, 255), roof=(214, 218, 220))),
    ('giallo', dict(body=(230, 188, 52))),
    ('grigio-verde', dict(body=(132, 140, 144), band=(52, 132, 78, 255))),
    ('arancio-vissuto', dict(body=(200, 112, 50), roof=(208, 206, 196), dirt=.16)),
]

atlas = Image.new('RGBA', (CW * 4, CH * 4), (0, 0, 0, 0))
cells = [tow(l) for _, l in TOWS] + [bus(l) for _, l in BUSES]
for i, im in enumerate(cells):
    atlas.alpha_composite(im, ((i % 4) * CW, (i // 4) * CH))
atlas.save(OUT, optimize=True)
k = 4
sheet = Image.new('RGBA', (CW * 4 * k + 50, CH * 4 * k + 50), (255, 255, 255, 255))
for i, im in enumerate(cells):
    sheet.alpha_composite(im.resize((CW * k, CH * k), Image.NEAREST), (10 + (i % 4) * (CW * k + 10), 10 + (i // 4) * (CH * k + 10)))
sheet.convert('RGB').save(SHEET, optimize=True)
print('ok', atlas.size, [n for n, _ in TOWS], [n for n, _ in BUSES])
