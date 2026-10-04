#!/usr/bin/env python3
"""Build the Literature space from the archived X posts.

The open journal kept on X between 2022 and 2024 was exported to a JSONL file, one post
per line. This script turns the part of it that is literature into
content/spaces/literature/index.md, and copies the artworks that travelled with the
quotes into that page bundle.

It exists so the page can be rebuilt rather than hand-edited: if more posts are ever
recovered, add them to the archive, list them in curation.json and run this again.

    python3 scripts/literature/build.py --archive ~/Documents/tweets_dafmontenegro

What the script decides on its own, and what it is told:

  - It splits each post into the quote, its attribution and the artwork's reference by
    the rules in `split_post` below. Those rules are deterministic and documented, but
    they cannot read every post correctly, so curation.json carries an explicit override
    for each post they get wrong. A post that is neither parsed nor overridden stops the
    build rather than being published half-right.
  - It never rewrites a quote. Whatever ends up between the shortcode tags is the text as
    it was published, down to the punctuation. The one exception is listed post by post
    in curation.json under "body", for the posts whose quote lived inside an image and
    had to be transcribed by hand.
  - Dates are the ones lived, not the ones stored: the archive records UTC and the posts
    were written in Bogota, so every timestamp is shifted by -5 hours before its date is
    taken. Two posts land on the previous day that way.

The page is not only the X archive. A line found since then is added as an entry in
curation.json whose id is not a post id, carrying at least "body" and "date"; it is
rendered like any other piece, without a link back to a post that does not exist. Adding
one by hand to index.md would not survive the next run, which is what this is for.
"""

from __future__ import annotations

import argparse
import json
import re
import shutil
import sys
from datetime import datetime, timedelta
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parent.parent
BUNDLE = REPO / "content" / "spaces" / "literature"
IMG_DIR = BUNDLE / "img"
OUT = BUNDLE / "index.md"

# The posts were written from Bogota, which is UTC-5 all year round.
BOGOTA = timedelta(hours=-5)

# "Homer, W. (1890). Summer night." - the reference form used under the paintings.
FICHA = re.compile(r"^[A-ZÁÉÍÓÚÑ][\w\-'’]*\s*,\s*[A-Z]\.(?:\s*-?\s*[A-Z]\.)?\s*\(\d{4}\)\.?\s*\S")

# The characters a quote is closed with across the archive: straight, curly and angled.
CLOSERS = "\"”»"


def split_post(text: str, has_media: bool) -> tuple[str, str | None, str | None]:
    """Split a post into (quote, attribution, artwork reference).

    The posts follow one shape, with parts left out rather than rearranged:

        "<quote>"
        <attribution>

        <artwork reference>

    So the reference, when there is one, is the last blank-line-separated block, and the
    attribution is whatever trails the last closing quotation mark. Returning None for a
    part means "not found here", and the caller decides whether that is allowed.
    """
    text = text.replace("\xa0", " ").strip()
    blocks = [b.strip() for b in re.split(r"\n\s*\n", text) if b.strip()]

    credit = None
    if len(blocks) > 1 and (FICHA.match(blocks[-1]) or (has_media and len(blocks[-1]) < 40)):
        credit = blocks.pop()
    rest = "\n".join(blocks)

    # The last closing quote with a short, single-line tail after it. Scanning from the
    # end matters: a quote that contains quotation marks of its own would otherwise be
    # cut at the first one.
    cite = None
    body = rest
    for m in reversed(list(re.finditer(f"[{CLOSERS}]", rest))):
        if m.start() == 0:
            continue  # an opening quote, not a closing one
        # The attribution follows the quote either on the same line or on the next one,
        # so the break is stripped before asking whether what is left is a single line.
        tail = rest[m.end():].strip(" .,\n\r\t")
        if tail and "\n" not in tail and len(tail) <= 140:
            body, cite = rest[: m.end()], tail.strip()
            break

    return body.strip(), cite, credit


def load_archive(archive: Path) -> dict[str, dict]:
    path = archive / "tweets.jsonl"
    if not path.exists():
        sys.exit(f"archive not found: {path}")
    with path.open(encoding="utf-8") as fh:
        return {t["id"]: t for t in (json.loads(line) for line in fh)}


def lived_date(post: dict) -> str:
    stamp = datetime.strptime(post["datetime_utc"], "%Y-%m-%dT%H:%M:%S.%fZ") + BOGOTA
    return stamp.strftime("%Y-%m-%d")


def shortcode(piece: dict) -> str:
    args = []
    for key in ("cite", "note", "date", "url", "image", "alt", "image2", "alt2", "credit"):
        value = piece.get(key)
        if value:
            if '"' in value:
                sys.exit(f"quote shortcode: {key} of {piece['id']} contains a double quote")
            args.append(f'  {key}="{value}"')
    head = "{{< quote\n" + "\n".join(args) + " >}}"
    return f"{head}\n{piece['body']}\n{{{{< /quote >}}}}"


def build_pieces(archive: dict[str, dict], curation: dict) -> list[dict]:
    """Turn the curated post ids into the pieces the page is made of.

    A piece is usually one post. A thread whose text is one sentence cut up by the
    character limit is listed in "merges" and becomes a single piece, joined back
    together; a thread whose parts are separate quotes with an artwork each stays as
    separate pieces.
    """
    overrides = curation["pieces"]
    merged_into = {}
    for group in curation["merges"]:
        for member in group[1:]:
            merged_into[member] = group[0]

    pieces = {}
    for group in curation["merges"]:
        lead = archive[group[0]]
        # The parts are stitched back together before being split, not after: each part on
        # its own is a fragment with an unclosed quotation mark and no attribution, and
        # only the whole sentence can be read correctly.
        joined = curation["joins"].get(group[0], " ").join(archive[m]["text"].strip() for m in group)
        body, cite, credit = split_post(joined, any(archive[m]["media"] for m in group))
        pieces[group[0]] = {
            "id": group[0],
            "body": body,
            "cite": cite,
            "credit": credit,
            "date": lived_date(lead),
            "url": lead["url"],
        }

    for post_id in curation["order"]:
        if post_id in pieces or post_id in merged_into:
            continue
        if post_id not in archive:
            # A line written down since the journal left X: it has no post behind it, so
            # everything it shows has to be in curation.json already.
            own = overrides.get(post_id, {})
            for required in ("body", "date"):
                if not own.get(required):
                    sys.exit(f"{post_id} is not in the archive, so curation.json must give it a {required!r}")
            pieces[post_id] = {"id": post_id, "cite": None, "credit": None, "url": None, **own}
            continue
        post = archive[post_id]
        body, cite, credit = split_post(post["text"], bool(post["media"]))
        pieces[post_id] = {
            "id": post_id,
            "body": body,
            "cite": cite,
            "credit": credit,
            "date": lived_date(post),
            "url": post["url"],
        }

    for post_id, piece in pieces.items():
        override = overrides.get(post_id, {})
        piece.update(override)
        # A post listed as uncited was published with no attribution at all. Say so here
        # too: a post that is nothing but a quoted line would otherwise have its own text
        # read back as its author.
        if post_id in curation["uncited"] and "cite" not in override:
            piece["cite"] = None
        if not piece["body"]:
            sys.exit(f"{post_id}: empty quote, and curation.json gives it no body")

    return pieces


def copy_artwork(archive: Path, pieces: dict, curation: dict) -> None:
    """Copy the artworks the page uses into the bundle, at a sane width.

    Only the files actually referenced are copied, and the source is named per piece in
    curation.json, because the archive's filenames carry post ids rather than subjects.
    """
    try:
        from PIL import Image
    except ImportError:
        sys.exit("Pillow is required to prepare the artwork: pip install Pillow")

    IMG_DIR.mkdir(parents=True, exist_ok=True)
    for post_id, piece in pieces.items():
        own = curation["pieces"].get(post_id, {})
        for name_key, source_key in (("image", "source"), ("image2", "source2")):
            prepare(archive, piece.get(name_key), own.get(source_key), Image, post_id)


def prepare(archive: Path, name: str | None, source: str | None, Image, post_id: str) -> None:
    """Copy one artwork out of the archive, unless it already lives in the bundle.

    An entry with no "source" names a file that is committed to the page bundle rather than
    pulled from the archive: a film still, say, which never travelled through a post.
    """
    if not name:
        return
    if not source:
        if not (BUNDLE / name).exists():
            sys.exit(f"{post_id}: {name} has no source in the archive and is not in the bundle")
        return
    src, dst = archive / source, BUNDLE / name
    if not src.exists():
        sys.exit(f"{post_id}: artwork not found in the archive: {src}")
    image = Image.open(src).convert("RGB")
    if image.width > 1280:
        image = image.resize((1280, round(image.height * 1280 / image.width)), Image.LANCZOS)
    dst.parent.mkdir(parents=True, exist_ok=True)
    image.save(dst, "JPEG", quality=85, optimize=True, progressive=True)


def render(pieces: dict, curation: dict) -> str:
    parts = [curation["front_matter"].rstrip(), "", curation["intro"].strip(), ""]
    for section in curation["sections"]:
        parts += ["---", "", f"## {section['heading']}", ""]
        if section.get("note"):
            parts += [section["note"].strip(), ""]
        for post_id in section["ids"]:
            # The note travels inside the figure (see the `quote` shortcode), not as a
            # paragraph of its own between two quotes, where a reader could not tell
            # which of the two lines it belonged to.
            parts += [shortcode(pieces[post_id]), ""]
    parts += ["---", "", curation["outro"].strip()]
    return "\n".join(parts).rstrip() + "\n"


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--archive", type=Path, required=True, help="folder holding tweets.jsonl and media/")
    args = ap.parse_args()

    archive_dir = args.archive.expanduser()
    archive = load_archive(archive_dir)
    curation = json.loads((HERE / "curation.json").read_text(encoding="utf-8"))

    listed = [i for s in curation["sections"] for i in s["ids"]]
    if sorted(listed) != sorted(set(listed)):
        sys.exit("curation.json: a post is listed in more than one section")
    stray = [i for i in listed if i not in archive and i not in curation["pieces"]]
    if stray:
        sys.exit(f"curation.json lists ids that are neither in the archive nor defined here: {stray}")

    pieces = build_pieces(archive, curation)
    unparsed = [
        i for i in listed
        if pieces[i]["cite"] is None and i not in curation["uncited"] and i in archive
    ]
    if unparsed:
        sys.exit(
            "no attribution could be read from these posts, and curation.json neither "
            f"overrides them nor lists them as deliberately uncited:\n  " + "\n  ".join(unparsed)
        )

    copy_artwork(archive_dir, pieces, curation)
    OUT.write_text(render({i: pieces[i] for i in listed}, curation), encoding="utf-8")
    print(f"{OUT.relative_to(REPO)}: {len(listed)} pieces in {len(curation['sections'])} sections")


if __name__ == "__main__":
    main()
