"""Build the sprite sheets of the guests the footer's clover calls (assets/js/guests.js).

Link comes from The Legend of Zelda: Link's Awakening DX (Game Boy Color):
  - Link himself: the sheet ripped by Mister Mike for The Spriters Resource
    ("Give credit if used"), fetched through the Internet Archive's copy, since the site
    refuses scripted downloads. https://www.spriters-resource.com/game_boy_gbc/thelegendofzeldalinksawakeningdx/asset/9436/
  - The bush he cuts: Zelda Wiki's LADX Grass Sprite (The Spriters Resource, BruceJuice).
The four-leaf clover that comes out of the bush is not in the game: it is drawn here, in
the palette of Link's Awakening DX, from the same outline and greens as the bush.

Zelda comes from The Legend of Zelda: The Minish Cap (GBA): the "Princess Zelda" sheet on
The Spriters Resource, ripped by Sonikku, fetched through the Internet Archive's copy.
https://www.spriters-resource.com/game_boy_advance/thelegendofzeldatheminishcap/asset/22716/
She walks to the right as the sheet draws her, so nothing of hers is mirrored. Each frame
sits on a 48x48 cell, centred and standing on its bottom edge; the golden light she calls
is centred on its cell instead.
Link comes with her, from the same game, so the two match: the "Link (Cap)" sheet ripped
by Barubary, fetched the same way, on the same sheet as hers and the same cells. He walks
to the left as his sheet draws him.
https://www.spriters-resource.com/game_boy_advance/thelegendofzeldatheminishcap/asset/6369/

Kirby comes from Kirby's Adventure (NES): the "Kirby" sheet on The Spriters Resource,
credited to QuadFactor and UltraHype97, fetched through the Internet Archive's copy for
the same reason.
https://www.spriters-resource.com/nes/kirbyadv/asset/49192/
He acts facing left, towards the clover he inhales, and the sheet draws him facing right,
so his frames are mirrored too. Each sits on a 24x24 cell, centred and standing on its
bottom edge, so his feet stay put whether he is small, puffed up or squashed.

Link walks and slashes to the right: the sheet draws him facing left, so his frames are
mirrored. Every frame is placed on a 48x48 cell with his body on the cell's middle 16x16,
so the sword can reach out on every side during the spin attack and he never jumps
between frames.

Kirby's sword frames are larger than his others (39x44, the swing around him), so they
have a row of their own, on 40x44 cells, as the sheet draws them.

Writes:
  assets/img/nintendo/link.png   row 0: Link's frames, 48x48 each; row 1: bush and clover, 16x16
  assets/img/nintendo/kirby.png  row 0: Kirby's frames and effects, 24x24; row 1: his sword, 40x44
  assets/img/nintendo/zelda.png  Zelda's frames, her light and Minish Cap Link's, 48x48 each, in one row

Run from the repository root (requires Pillow and curl):
  python3 scripts/nintendo/build.py
  python3 scripts/nintendo/build.py --link-sheet path/to/9436.png --kirby-sheet path/to/49192.png \
      --zelda-sheet path/to/22716.png --mc-link-sheet path/to/6369.png
      (copies saved before, for when the Internet Archive is unreachable)
"""

import argparse
import io
import subprocess
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "assets" / "img" / "nintendo" / "link.png"
KIRBY_OUT = ROOT / "assets" / "img" / "nintendo" / "kirby.png"
ZELDA_OUT = ROOT / "assets" / "img" / "nintendo" / "zelda.png"

LINK_SHEET = ("http://web.archive.org/web/2026id_/"
              "https://www.spriters-resource.com/resources/sheets/9/9436.png")
BUSH = "https://cdn.wikimg.net/en/zeldawiki/images/c/c7/LADX_Grass_Sprite.png"
ZELDA_SHEET = ("http://web.archive.org/web/20220430034707id_/"
               "https://www.spriters-resource.com/resources/sheets/21/22716.png")
MC_LINK_SHEET = ("http://web.archive.org/web/20211021061928id_/"
                 "https://www.spriters-resource.com/resources/sheets/6/6369.png")
KIRBY_SHEET = ("http://web.archive.org/web/20260217070846im_/"
               "https://www.spriters-resource.com/media/assets/46/49192.png")

# The Kirby sheet's two backgrounds: the slate page and the blue box behind each frame.
KIRBY_BACKGROUNDS = {(84, 110, 140), (116, 154, 212)}

# Kirby's frames, in the order guests.js reads them, by their box on the sheet.
KIRBY_FRAMES = [
    ("stand",     (6, 24, 16, 16)),
    ("blink",     (26, 24, 16, 16)),
    ("float-1",   (99, 75, 24, 24)),
    ("float-2",   (127, 75, 24, 24)),
    ("deflate",   (160, 75, 24, 24)),
    ("air",       (248, 83, 16, 16)),
    ("inhale",    (103, 273, 16, 16)),
    ("suction-1", (123, 273, 16, 16)),
    ("suction-2", (143, 273, 16, 16)),
    ("mouthful",  (63, 107, 24, 24)),
    ("squash",    (200, 273, 24, 16)),
    ("front",     (180, 273, 16, 16)),
    ("star-1",    (6, 140, 16, 16)),
    ("star-2",    (26, 140, 16, 16)),
    ("star-3",    (46, 140, 16, 16)),
    ("star-4",    (66, 140, 16, 16)),
    ("poof-1",    (91, 140, 16, 16)),
    ("poof-2",    (111, 140, 16, 16)),
    ("poof-3",    (131, 140, 16, 16)),
    ("spit",      (185, 107, 24, 24)),
    ("puff-up",   (66, 75, 24, 24)),
    ("sleep-1",   (6, 819, 16, 16)),
    ("sleep-2",   (26, 819, 16, 16)),
    ("sleep-3",   (46, 819, 16, 16)),
    ("bubble",    (66, 819, 8, 16)),
    ("fire-flash", (26, 857, 16, 16)),
    ("fire-1",    (46, 857, 16, 16)),
    ("fire-2",    (66, 857, 16, 16)),
    ("fire-3",    (86, 857, 16, 16)),
    ("fire-4",    (106, 857, 16, 16)),
]

# Sword Kirby's swing, 39x44 each, kept whole: the sword goes round him and up, glints and
# stays raised, as Link holds up a treasure.
KIRBY_SWORD = [(x, 1283, 39, 44) for x in (6, 49, 92, 135, 178, 221, 264, 307)]

# The sheet's two backgrounds: the green page and the navy box behind each frame.
BACKGROUNDS = {(0, 128, 0), (0, 57, 115)}

# Where each frame sits on the sheet (x, y, width, height), whether it is mirrored, and where
# Link's body is inside it once mirrored, so that body lands on the cell's middle 16x16.
FRAMES = [
    # name,        box on the sheet,      mirror, his body in the (mirrored) frame
    ("walk-1",     (35, 11, 16, 16),       True,  (0, 0)),
    ("walk-2",     (52, 11, 16, 16),       True,  (0, 0)),
    ("slash-up",   (169, 121, 16, 32),     True,  (0, 16)),
    ("slash-diag", (186, 124, 29, 29),     True,  (0, 13)),
    ("slash-side", (216, 137, 32, 16),     True,  (0, 0)),
    ("hold-up",    (404, 11, 16, 16),      False, (0, 0)),
    ("face",       (1, 11, 16, 16),        False, (0, 0)),
    # Charging the sword before the spin attack: held out, then flashing.
    ("charge-1",   (137, 168, 27, 16),     True,  (0, 0)),
    ("charge-2",   (193, 168, 27, 16),     True,  (0, 0)),
    # The spin attack, the sword going all the way round him.
    ("spin-1",     (1, 228, 28, 29),       True,  (12, 0)),
    ("spin-2",     (30, 228, 32, 16),      True,  (16, 0)),
    ("spin-3",     (63, 215, 29, 29),      True,  (13, 13)),
    ("spin-4",     (93, 212, 16, 32),      True,  (0, 16)),
    ("spin-5",     (110, 215, 27, 29),     True,  (0, 13)),
    ("spin-6",     (138, 228, 32, 16),     True,  (0, 0)),
    ("spin-7",     (171, 228, 29, 28),     True,  (0, 0)),
    ("spin-8",     (201, 228, 16, 32),     True,  (0, 0)),
]

LINK_CELL = 48

# Zelda's frames by their box on the sheet, and whether each is her (standing on the
# cell's bottom edge) or her light (centred on the cell).
ZELDA_BACKGROUNDS = {(255, 255, 255), (16, 128, 88), (64, 176, 136)}
ZELDA_FRAMES = (
    [(f"walk-{i + 1}", (x, 27, 16, 32), False) for i, x in enumerate(range(1, 139, 17))]
    + [
        ("front",     (1, 1, 32, 24),     False),
        ("surprised", (67, 95, 32, 32),   False),
        ("smile",     (133, 95, 32, 32),  False),
        ("pray-1",    (133, 163, 32, 32), False),
        ("pray-2",    (166, 163, 32, 32), False),
        ("pray-3",    (199, 163, 32, 32), False),
        ("glow-1",    (58, 246, 32, 32),  True),
        ("glow-2",    (107, 246, 32, 32), True),
        ("glow-3",    (148, 246, 48, 40), True),
        ("glow-4",    (197, 246, 48, 48), True),
        ("burst-1",   (1, 197, 48, 48),   True),
        ("burst-2",   (50, 197, 48, 48),  True),
        ("burst-3",   (99, 197, 48, 48),  True),
        ("burst-4",   (148, 197, 48, 48), True),
        ("burst-5",   (197, 197, 48, 48), True),
    ]
)
ZELDA_CELL = 48

# Minish Cap Link, after Zelda's frames on the same sheet.
MC_LINK_BACKGROUNDS = {(64, 176, 136)}
MC_LINK_FRAMES = (
    [(f"link-walk-{i + 1}", box, False) for i, box in enumerate([
        (412, 77, 20, 21), (445, 77, 20, 21), (476, 77, 20, 22), (510, 78, 23, 22),
        (540, 78, 19, 22), (573, 77, 19, 22), (609, 77, 19, 22), (636, 77, 20, 22)])]
    + [
        ("link-front", (15, 77, 18, 23),  False),
        ("link-raise", (80, 256, 20, 23), False),
        ("link-cheer", (47, 223, 18, 25), False),
        ("blade",      (52, 285, 7, 15),  True),
        ("glint",      (129, 284, 13, 16), True),
    ]
)

# The clover, 16x16: k outline, g light green, d dark green (the bush's own colours).
CLOVER = [
    "................",
    "....kkk..kkk....",
    "...kgggkkgggk...",
    "...kggdgdgggk...",
    ".kkkkgggdggkkkk.",
    "kgggkkggdgkkgggk",
    "kgdddddgddddgdgk",
    "kggggggdgggggggk",
    ".kgggkkgdkkgggk.",
    "..kkkkggdgkkkk..",
    "...kgggdgdggk...",
    "...kgggkkdggk...",
    "....kkk..kdk....",
    "..........kdk...",
    "...........kk...",
    "................",
]


def fetch(url):
    data = subprocess.run(["curl", "-sSL", "-A", "Mozilla/5.0", url],
                          check=True, capture_output=True).stdout
    return Image.open(io.BytesIO(data)).convert("RGBA")


def clear_background(image, backgrounds=BACKGROUNDS):
    pixels = image.load()
    for y in range(image.height):
        for x in range(image.width):
            if pixels[x, y][:3] in backgrounds:
                pixels[x, y] = (0, 0, 0, 0)
    return image


def build_kirby(source):
    sheet = clear_background(source, KIRBY_BACKGROUNDS)
    width = max(24 * len(KIRBY_FRAMES), 40 * len(KIRBY_SWORD))
    out = Image.new("RGBA", (width, 24 + 44), (0, 0, 0, 0))
    for i, (name, (x, y, w, h)) in enumerate(KIRBY_FRAMES):
        frame = sheet.crop((x, y, x + w, y + h)).transpose(Image.FLIP_LEFT_RIGHT)
        out.paste(frame, (24 * i + (24 - w) // 2, 24 - h), frame)
    for i, (x, y, w, h) in enumerate(KIRBY_SWORD):
        frame = sheet.crop((x, y, x + w, y + h)).transpose(Image.FLIP_LEFT_RIGHT)
        out.paste(frame, (40 * i, 24), frame)
    out.save(KIRBY_OUT, optimize=True)
    print(f"{KIRBY_OUT.relative_to(ROOT)}: {out.width}x{out.height}, frames:",
          ", ".join(name for name, _ in KIRBY_FRAMES), f"+ {len(KIRBY_SWORD)} sword frames")


def build_zelda(source, link_source):
    zelda = clear_background(source, ZELDA_BACKGROUNDS)
    link = clear_background(link_source, MC_LINK_BACKGROUNDS)
    frames = [(f, zelda) for f in ZELDA_FRAMES] + [(f, link) for f in MC_LINK_FRAMES]
    out = Image.new("RGBA", (ZELDA_CELL * len(frames), ZELDA_CELL), (0, 0, 0, 0))
    for i, ((name, (x, y, w, h), centred), sheet) in enumerate(frames):
        frame = sheet.crop((x, y, x + w, y + h))
        top = (ZELDA_CELL - h) // 2 if centred else ZELDA_CELL - h
        out.paste(frame, (ZELDA_CELL * i + (ZELDA_CELL - w) // 2, top), frame)
    out.save(ZELDA_OUT, optimize=True)
    print(f"{ZELDA_OUT.relative_to(ROOT)}: {out.width}x{out.height}, frames:",
          ", ".join(name for (name, *_), _ in frames))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--link-sheet", help="a local copy of the Link sheet")
    parser.add_argument("--kirby-sheet", help="a local copy of the Kirby sheet")
    parser.add_argument("--zelda-sheet", help="a local copy of the Zelda sheet")
    parser.add_argument("--mc-link-sheet", help="a local copy of the Minish Cap Link sheet")
    args = parser.parse_args()
    source = Image.open(args.link_sheet).convert("RGBA") if args.link_sheet else fetch(LINK_SHEET)
    sheet = clear_background(source)
    bush = fetch(BUSH)

    C = LINK_CELL
    out = Image.new("RGBA", (C * len(FRAMES), C + 16), (0, 0, 0, 0))
    for i, (name, (x, y, w, h), mirror, (bx, by)) in enumerate(FRAMES):
        frame = sheet.crop((x, y, x + w, y + h))
        if mirror:
            frame = frame.transpose(Image.FLIP_LEFT_RIGHT)
        out.paste(frame, (C * i + 16 - bx, 16 - by), frame)

    # Row 1: the bush, centred on its 16x16 cell, then the clover in the bush's colours.
    out.paste(bush, (1, C + 1), bush)
    colours = {"k": (0, 0, 0, 255)}
    bush_greens = sorted({c for c in bush.getdata() if c[3] and sum(c[:3]) > 60},
                         key=lambda c: sum(c[:3]))
    colours["d"] = bush_greens[0]
    colours["g"] = bush_greens[-1] if len(bush_greens) > 1 else (16, 173, 66, 255)
    for j, row in enumerate(CLOVER):
        for i, ch in enumerate(row):
            if ch in colours:
                out.putpixel((16 + i, C + j), colours[ch])

    OUT.parent.mkdir(parents=True, exist_ok=True)
    out.save(OUT, optimize=True)
    print(f"{OUT.relative_to(ROOT)}: {out.width}x{out.height}, frames:",
          ", ".join(name for name, *_ in FRAMES))

    kirby = (Image.open(args.kirby_sheet).convert("RGBA") if args.kirby_sheet
             else fetch(KIRBY_SHEET))
    build_kirby(kirby)

    zelda = (Image.open(args.zelda_sheet).convert("RGBA") if args.zelda_sheet
             else fetch(ZELDA_SHEET))
    mc_link = (Image.open(args.mc_link_sheet).convert("RGBA") if args.mc_link_sheet
               else fetch(MC_LINK_SHEET))
    build_zelda(zelda, mc_link)


if __name__ == "__main__":
    main()
