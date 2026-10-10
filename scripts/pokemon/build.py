"""Fetch the sprites of the Pokémon that come out of the Poké Ball on the homepage.

They are the animated sprites of Pokémon Black and White, the same set as the carp that
climbs every other page (assets/img/koi/), taken from the PokeAPI sprites repository
(https://github.com/PokeAPI/sprites), which archives them by National Dex number.

A form the games of that generation never had, a Mega Evolution, has no Black and White
sprite; for those the script takes the repository's own still pixel sprite of the form,
listed under the form's PokeAPI id rather than the Dex number.

Writes:
  assets/img/pokemon/<pokemon>.gif     the animated sprite, as published (.png when still)
  assets/data/pokemon/sprites.json     each one's name and size, read by the site

Run from the repository root (requires Pillow and curl):
  python3 scripts/pokemon/build.py
"""

import io
import json
import subprocess
from pathlib import Path

from PIL import Image

REPOSITORY = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/"
ANIMATED = REPOSITORY + "versions/generation-v/black-white/animated/{id}.gif"
STILL = REPOSITORY + "{id}.png"
ROOT = Path(__file__).resolve().parents[2]
IMG = ROOT / "assets" / "img" / "pokemon"
DATA = ROOT / "assets" / "data" / "pokemon"

# Every form an act shows, by key: (PokeAPI id, name as the games print it, source). The
# id is the National Dex number for an animated sprite, and the form's own id for a still.
ROSTER = {
    "pichu": (172, "Pichu", ANIMATED),
    "pikachu": (25, "Pikachu", ANIMATED),
    "bulbasaur": (1, "Bulbasaur", ANIMATED),
    "ivysaur": (2, "Ivysaur", ANIMATED),
    "venusaur": (3, "Venusaur", ANIMATED),
    "charmander": (4, "Charmander", ANIMATED),
    "charmeleon": (5, "Charmeleon", ANIMATED),
    "charizard": (6, "Charizard", ANIMATED),
    "charizard-mega-x": (10034, "Mega Charizard X", STILL),
    "squirtle": (7, "Squirtle", ANIMATED),
    "wartortle": (8, "Wartortle", ANIMATED),
    "blastoise": (9, "Blastoise", ANIMATED),
    "munchlax": (446, "Munchlax", ANIMATED),
    "snorlax": (143, "Snorlax", ANIMATED),
    "gastly": (92, "Gastly", ANIMATED),
    "haunter": (93, "Haunter", ANIMATED),
    "gengar": (94, "Gengar", ANIMATED),
    "ditto": (132, "Ditto", ANIMATED),
    "psyduck": (54, "Psyduck", ANIMATED),
}


def fetch(url):
    # Through curl rather than urllib: python.org's macOS builds ship without the system's
    # certificates, and curl verifies TLS with them out of the box.
    return subprocess.run(["curl", "-fsSL", url], check=True, capture_output=True).stdout


def main():
    IMG.mkdir(parents=True, exist_ok=True)
    DATA.mkdir(parents=True, exist_ok=True)
    sprites = {}
    for key, (number, name, source) in ROSTER.items():
        sprite = fetch(source.format(id=number))
        width, height = Image.open(io.BytesIO(sprite)).size
        filename = f"{key}.{source.rsplit('.', 1)[1]}"
        (IMG / filename).write_bytes(sprite)
        sprites[key] = {"name": name, "file": f"img/pokemon/{filename}", "width": width, "height": height}
        print(f"{name}: {width}x{height}, {len(sprite) // 1024} KB")
    (DATA / "sprites.json").write_text(json.dumps(sprites, indent=2) + "\n")


if __name__ == "__main__":
    main()
