"""Build the sprite sheets of the guests the footer's clover calls (assets/js/guests.js).

Link comes from The Legend of Zelda: Link's Awakening DX (Game Boy Color):
  - Link himself: the sheet ripped by Mister Mike for The Spriters Resource
    ("Give credit if used"), fetched through the Internet Archive's copy, since the site
    refuses scripted downloads. https://www.spriters-resource.com/game_boy_gbc/thelegendofzeldalinksawakeningdx/asset/9436/
  - The bush he cuts: Zelda Wiki's LADX Grass Sprite (The Spriters Resource, BruceJuice).
The four-leaf clover that comes out of the bush is not in the game: it is drawn here, in
the palette of Link's Awakening DX, from the same outline and greens as the bush.

Kirby comes from Kirby's Adventure (NES): the "Kirby" sheet on The Spriters Resource,
credited to QuadFactor and UltraHype97, fetched through the Internet Archive's copy for
the same reason.
https://www.spriters-resource.com/nes/kirbyadv/asset/49192/
He acts facing left, towards the clover he inhales, and the sheet draws him facing right,
so his frames are mirrored too. Each sits on a 24x24 cell, centred and standing on its
bottom edge, so his feet stay put whether he is small, puffed up or squashed.

Link walks and slashes to the right: the sheet draws him facing left, so his frames are
mirrored. Every frame is placed on a 32x32 cell with his body in the cell's bottom-left
16x16, so the sword can reach up and to the right and he never jumps between frames.

Writes:
  assets/img/nintendo/link.png   row 0: Link's frames, 32x32 each; row 1: bush and clover, 16x16
  assets/img/nintendo/kirby.png  Kirby's frames and effects, 24x24 each, in one row

Run from the repository root (requires Pillow and curl):
  python3 scripts/nintendo/build.py
  python3 scripts/nintendo/build.py --link-sheet path/to/9436.png --kirby-sheet path/to/49192.png
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

LINK_SHEET = ("http://web.archive.org/web/2026id_/"
              "https://www.spriters-resource.com/resources/sheets/9/9436.png")
BUSH = "https://cdn.wikimg.net/en/zeldawiki/images/c/c7/LADX_Grass_Sprite.png"
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
]

# The sheet's two backgrounds: the green page and the navy box behind each frame.
BACKGROUNDS = {(0, 128, 0), (0, 57, 115)}

# Where each frame sits on the sheet (x, y, width, height) and where Link's body is
# inside it once mirrored, so that body lands on the cell's bottom-left 16x16.
FRAMES = [
    # name,        box on the sheet,      mirror, offset of the frame in the 32x32 cell
    ("walk-1",     (35, 11, 16, 16),       True,  (0, 16)),
    ("walk-2",     (52, 11, 16, 16),       True,  (0, 16)),
    ("slash-up",   (169, 121, 16, 32),     True,  (0, 0)),
    ("slash-diag", (186, 124, 29, 29),     True,  (0, 3)),
    ("slash-side", (216, 137, 32, 16),     True,  (0, 16)),
    ("hold-up",    (404, 11, 16, 16),      False, (0, 16)),
    ("face",       (1, 11, 16, 16),        False, (0, 16)),
]

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
    out = Image.new("RGBA", (24 * len(KIRBY_FRAMES), 24), (0, 0, 0, 0))
    for i, (name, (x, y, w, h)) in enumerate(KIRBY_FRAMES):
        frame = sheet.crop((x, y, x + w, y + h)).transpose(Image.FLIP_LEFT_RIGHT)
        out.paste(frame, (24 * i + (24 - w) // 2, 24 - h), frame)
    out.save(KIRBY_OUT, optimize=True)
    print(f"{KIRBY_OUT.relative_to(ROOT)}: {out.width}x{out.height}, frames:",
          ", ".join(name for name, _ in KIRBY_FRAMES))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--link-sheet", help="a local copy of the Link sheet")
    parser.add_argument("--kirby-sheet", help="a local copy of the Kirby sheet")
    args = parser.parse_args()
    source = Image.open(args.link_sheet).convert("RGBA") if args.link_sheet else fetch(LINK_SHEET)
    sheet = clear_background(source)
    bush = fetch(BUSH)

    out = Image.new("RGBA", (32 * len(FRAMES), 48), (0, 0, 0, 0))
    for i, (name, (x, y, w, h), mirror, (ox, oy)) in enumerate(FRAMES):
        frame = sheet.crop((x, y, x + w, y + h))
        if mirror:
            frame = frame.transpose(Image.FLIP_LEFT_RIGHT)
        out.paste(frame, (32 * i + ox, oy), frame)

    # Row 1: the bush, centred on its 16x16 cell, then the clover in the bush's colours.
    out.paste(bush, (1, 32 + 1), bush)
    colours = {"k": (0, 0, 0, 255)}
    bush_greens = sorted({c for c in bush.getdata() if c[3] and sum(c[:3]) > 60},
                         key=lambda c: sum(c[:3]))
    colours["d"] = bush_greens[0]
    colours["g"] = bush_greens[-1] if len(bush_greens) > 1 else (16, 173, 66, 255)
    for j, row in enumerate(CLOVER):
        for i, ch in enumerate(row):
            if ch in colours:
                out.putpixel((16 + i, 32 + j), colours[ch])

    OUT.parent.mkdir(parents=True, exist_ok=True)
    out.save(OUT, optimize=True)
    print(f"{OUT.relative_to(ROOT)}: {out.width}x{out.height}, frames:",
          ", ".join(name for name, *_ in FRAMES))

    kirby = (Image.open(args.kirby_sheet).convert("RGBA") if args.kirby_sheet
             else fetch(KIRBY_SHEET))
    build_kirby(kirby)


if __name__ == "__main__":
    main()
