"""Fetch the sprites of the Pokémon that come out of the Poké Ball on the homepage.

They are the animated sprites of Pokémon Black and White, the same set as the carp that
climbs every other page (assets/img/koi/), taken from the PokeAPI sprites repository
(https://github.com/PokeAPI/sprites), which archives them by National Dex number.

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
    "golduck": (55, "Golduck"),
    "mew": (151, "Mew"),
}


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
    (DATA / "sprites.json").write_text(json.dumps(sprites, indent=2) + "\n")


if __name__ == "__main__":
    main()
