"""Fetch the sprites of the Pokémon that come out of the Poké Ball on the homepage.

They are the animated sprites of Pokémon Black and White, the same set as the carp that
climbs every other page (assets/img/koi/), taken from the PokeAPI sprites repository
(https://github.com/PokeAPI/sprites), which archives them by National Dex number.

One pose those games never drew is taken from elsewhere: Snorlax asleep, lying down, from
Pokémon Mystery Dungeon (Spike Chunsoft's own sprite, archived by PMDCollab's SpriteCollab,
https://github.com/PMDCollab/SpriteCollab). Its frames of breathing are cut from the sheet
and made into a GIF at twice their size, close to the scale of the other sprites.

Writes:
  assets/img/pokemon/<pokemon>.gif     the animated sprite, as published
  assets/data/pokemon/sprites.json     each one's name and size, read by the site

Run from the repository root (requires Pillow and curl):
  python3 scripts/pokemon/build.py
"""

import io
import json
import subprocess
from pathlib import Path

from PIL import Image

SOURCE = (
    "https://raw.githubusercontent.com/PokeAPI/sprites/master/"
    "sprites/pokemon/versions/generation-v/black-white/animated/{dex}.gif"
)
ROOT = Path(__file__).resolve().parents[2]
IMG = ROOT / "assets" / "img" / "pokemon"
DATA = ROOT / "assets" / "data" / "pokemon"

# Every form an act shows, by key: (National Dex number, name as the games print it).
ROSTER = {
    "pichu": (172, "Pichu"),
    "pikachu": (25, "Pikachu"),
    "charmander": (4, "Charmander"),
    "charmeleon": (5, "Charmeleon"),
    "charizard": (6, "Charizard"),
    "munchlax": (446, "Munchlax"),
    "snorlax": (143, "Snorlax"),
    "gastly": (92, "Gastly"),
    "haunter": (93, "Haunter"),
    "gengar": (94, "Gengar"),
    "ditto": (132, "Ditto"),
    "psyduck": (54, "Psyduck"),
    "jigglypuff": (39, "Jigglypuff"),
    "abra": (63, "Abra"),
    "kadabra": (64, "Kadabra"),
    "alakazam": (65, "Alakazam"),
    "eevee": (133, "Eevee"),
    "vaporeon": (134, "Vaporeon"),
    "jolteon": (135, "Jolteon"),
    "flareon": (136, "Flareon"),
    "espeon": (196, "Espeon"),
    "umbreon": (197, "Umbreon"),
    "leafeon": (470, "Leafeon"),
    "glaceon": (471, "Glaceon"),
    "rotom": (479, "Rotom"),
    "giratina": (487, "Giratina"),
    # A form is filed under the Dex number and the form's name.
    "giratina-origin": ("487-origin", "Giratina"),
}


# Poses from SpriteCollab, by key: (National Dex number, name, animation, row of the sheet).
PMD = "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/sprite/{dex}/"
POSES = {
    "snorlax-asleep": ("0143", "Snorlax", "Sleep", 0),
}
PMD_SCALE = 2


def fetch(url):
    # Through curl rather than urllib: python.org's macOS builds ship without the system's
    # certificates, and curl verifies TLS with them out of the box.
    return subprocess.run(["curl", "-fsSL", url], check=True, capture_output=True).stdout


def main():
    IMG.mkdir(parents=True, exist_ok=True)
    DATA.mkdir(parents=True, exist_ok=True)
    sprites = {}
    for key, (dex, name) in ROSTER.items():
        gif = fetch(SOURCE.format(dex=dex))
        width, height = Image.open(io.BytesIO(gif)).size
        (IMG / f"{key}.gif").write_bytes(gif)
        sprites[key] = {"name": name, "file": f"img/pokemon/{key}.gif", "width": width, "height": height}
        print(f"{name}: {width}x{height}, {len(gif) // 1024} KB")
    for key, (dex, name, anim, row) in POSES.items():
        sprites[key] = pose(key, dex, name, anim, row)
    (DATA / "sprites.json").write_text(json.dumps(sprites, indent=2) + "\n")


def pose(key, dex, name, anim, row):
    """One row of a SpriteCollab sheet as an animated GIF, timed by the sheet's AnimData."""
    import xml.etree.ElementTree as ET

    data = ET.fromstring(fetch(PMD.format(dex=dex) + "AnimData.xml"))
    node = next(a for a in data.find("Anims") if a.find("Name").text == anim)
    width = int(node.find("FrameWidth").text)
    height = int(node.find("FrameHeight").text)
    ticks = [int(d.text) for d in node.find("Durations")]
    sheet = Image.open(io.BytesIO(fetch(PMD.format(dex=dex) + f"{anim}-Anim.png"))).convert("RGBA")
    frames = [
        sheet.crop((i * width, row * height, (i + 1) * width, (row + 1) * height)).resize(
            (width * PMD_SCALE, height * PMD_SCALE), Image.NEAREST
        )
        for i in range(len(ticks))
    ]
    out = IMG / f"{key}.gif"
    # SpriteCollab times frames in ticks of the games' 60 frames per second.
    frames[0].save(out, save_all=True, append_images=frames[1:], duration=[t * 1000 // 60 for t in ticks],
                   loop=0, disposal=2)
    print(f"{name} ({anim}): {width * PMD_SCALE}x{height * PMD_SCALE}, {out.stat().st_size // 1024} KB")
    return {"name": name, "file": f"img/pokemon/{key}.gif", "width": width * PMD_SCALE, "height": height * PMD_SCALE}


if __name__ == "__main__":
    main()
