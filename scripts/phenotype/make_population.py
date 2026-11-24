"""Draw the synthetic faces Phenotype's population statistics are measured on.

Each face is a vector drawn from the latent DPM of DiffAE (FFHQ 256), a small
diffusion model that produces vectors shaped like real faces' vectors, decoded
at 256 px in 20 steps. They are faces of nobody: no photograph of a person is
involved. The generator is the engine of Meiosis; run this with its Python,
from its `engine/` folder:

    cd <meiosis>/engine
    .venv/bin/python <site>/scripts/phenotype/make_population.py --count 400 --out <folder>

Seeds start at 1000 so they never coincide with the sample faces shown on the
pages (seeds 1 to 32).
"""

from __future__ import annotations

import argparse
from pathlib import Path

from meiosis.diffae_backend import DiffAEModel


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    parser.add_argument("--count", type=int, default=400)
    parser.add_argument("--first-seed", type=int, default=1000)
    parser.add_argument("--out", type=Path, required=True)
    args = parser.parse_args()
    args.out.mkdir(parents=True, exist_ok=True)
    model = DiffAEModel(decode_steps=20)
    for seed in range(args.first_seed, args.first_seed + args.count):
        path = args.out / f"face-{seed:05d}.png"
        if not path.exists():
            model.decode(model.sample(seed), seed=seed).save(path)
            print(path.name, flush=True)


if __name__ == "__main__":
    main()
