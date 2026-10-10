# dafmontenegro.github.io

Source of [**montenegrodanielfelipe.com**](https://montenegrodanielfelipe.com/), the personal website of **Daniel Felipe Montenegro**: projects, blog posts and personal spaces about cinema, music, faith and more. [dafmontenegro.com](https://dafmontenegro.com/) redirects to it.

The site's symbol is **Caesar's Window**, the hypocycloid Caesar draws in *Rise of the Planet of the Apes* to remember his home. Read why it matters to me in the [About page](https://montenegrodanielfelipe.com/about/#caesars-window).

## Stack

- [**Hugo**](https://gohugo.io/) 0.167 (extended), pinned in the deploy workflow.
- [**Congo**](https://github.com/jpanther/congo) 2.14, imported as a Hugo module (`go.mod`), with the custom `montenegro` color scheme.
- **GitHub Pages** for hosting, built and deployed by GitHub Actions.
- **Cloudflare** in front of GitHub Pages (DNS, HTTPS and caching).

## Structure

| Path | What it holds |
| --- | --- |
| `config/_default/` | Site, language, menu, markup and theme configuration |
| `content/` | Pages as Markdown page bundles: `blog/`, `projects/`, `spaces/`, `about/` and standalone pages |
| `layouts/` | Overrides of Congo and Hugo templates, plus custom shortcodes (see below) |
| `assets/` | Files processed by Hugo: author photo, Caesar's Window (SVG and PNG), color scheme, stylesheets, scripts and the data the preflop tools read |
| `static/` | Files served as-is: favicons, web manifest, share cards (`og/`) and standalone apps (`apps/`) |

## Customizations

These files override templates from Congo or Hugo. **Review them whenever Congo or Hugo is upgraded**, since each one is a copy of an upstream template with a small change, documented at the top of the file.

| File | Based on | Change |
| --- | --- | --- |
| `layouts/_partials/profile.html` | Congo 2.14 | Eager-loaded author photo with a Caesar's Window badge, which is a button that opens the Poké Ball |
| `layouts/_partials/article-link.html` | Congo 2.14 | List thumbnails cropped from the center instead of Hugo's "smart" crop |
| `layouts/_partials/opengraph.html` | Hugo 0.167 | Shared title is "Page · Daniel Felipe Montenegro" outside the homepage |
| `layouts/_partials/twitter_cards.html` | Hugo 0.167 | Same title change for X cards |
| `layouts/_shortcodes/button.html` | Congo 2.14 | Adds `rel="noopener noreferrer"` to links that open a new tab |
| `layouts/404.html` | Congo 2.14 | 404 page with Caesar's Window |

These are additions, not overrides:

| File | Purpose |
| --- | --- |
| `layouts/_partials/extend-head.html` | schema.org `Person` data on the homepage and About page, and the per-page assets behind a front matter flag: the book-chapter stylesheet on `bookChapter`, the butterflies assets on `butterflies`, the preflop stylesheet, script and data on `preflop`, and the Literature stylesheet and script on `literature`; plus, on every page unless it sets `koi: false`, the Poké Ball through `koi.html` (Congo hook) |
| `assets/css/custom.css` | Caesar's Window styles for the badge, the 404 page and light/dark variants (bundled by Congo) |
| `assets/css/butterflies.css` | Styles for the butterflies shortcode: the button, the 3D wings and their beat, and the quote card (loaded only on pages with `butterflies: true`) |
| `assets/js/butterflies.js` | The flight engine behind the butterflies shortcode: the arrivals, the wandering, the dodging and the catching |
| `assets/css/preflop.css` | Styles for the preflop tools: the 13 x 13 grid, the card picker, the panels and the table view (loaded only on pages with `preflop: true`) |
| `assets/js/preflop.js` | The five preflop tools. Reads `assets/data/preflop/hands.json` once and builds whichever tools the page mounts; the head-to-head matrix is fetched on demand, since only one of them needs it |
| `assets/css/literature.css` | Styles for the Literature space: the "open at random" button and the wash of colour left on the quote it lands on, plus the one rule that turns off Congo's own quotation marks, so the quotes keep the punctuation they were published with (loaded only on pages with `literature: true`) |
| `assets/js/literature.js` | The "open at random" button. It builds the button itself, so a reader without JavaScript is never shown a control that cannot work |
| `layouts/_partials/koi.html`, `koi-runtime.html` | Load the Poké Ball: koi.css and koi.js with the page, and the addresses of everything fetched later (pokemon.js, the sprites, the story's anchor) as a JSON block. `koi-runtime.html` builds, once per build, the fingerprinted sprite list pokemon.js reads |
| `assets/css/koi.css` | Styles for the homepage's Poké Ball, the climb (torii, waterfall, golden trail, carp, the evolution and the dragon's ascent), the text box, and what the homepage's Pokémon do to the photo |
| `assets/js/koi.js` | The carp that climbs the waterfall, and the homepage's Poké Ball. On every long page but the homepage, a shiny Magikarp comes out at the foot of the screen's right edge and climbs a waterfall up to a torii as the page is read, leaving a golden trail, framed by the same margin at both ends; at the end of the page it evolves into a Gyarados that rises into the clouds and links to the story in About (`#the-carp-and-the-dragon`). Only the scroll starts it; clicking the carp makes it Splash, and on a computer it can be dragged to scroll. Tied to the scroll only: the page is measured on resize, never on scroll, and each frame only writes transforms. Under 768px it starts hidden, shows while the page moves and hides when it stops. On the homepage it builds the Poké Ball instead. Also holds the games' text box and the pixel-art drawing the Pokémon share |
| `assets/js/pokemon.js` | The homepage's Pokémon, fetched the first time the ball or the badge is pressed there. Each press brings out one Pokémon that plays with the photo and evolves during its act: Pichu, Charmander, Munchlax, Gastly, Ditto, Psyduck and, rarely, Mew. Holding the ball down (or right-clicking it, or pressing the up arrow on it) opens a Pokédex to choose one; the ones not met yet show as a silhouette and "???", and what has been met is kept in the visitor's own browser (`localStorage`, key `koi-pokedex`). Also MissingNo., the 404 page's visitor: the page tears, it pieces itself together beside Caesar's Window, scrambles the 404, jumps round the window and flees |
| `assets/img/koi/` | The carp, the animated shiny Magikarp of Pokémon Black and White, and the dragon, the shiny Gyarados of Pokémon SoulSilver |
| `assets/img/pokemon/`, `assets/data/pokemon/` | The homepage's Pokémon: their animated Black and White sprites, and their names and sizes. Written by `scripts/pokemon/build.py` |
| `static/fonts/press-start-2p-latin.woff2` | The text box's typeface, [Press Start 2P](https://fonts.google.com/specimen/Press+Start+2P) (SIL Open Font License), Latin glyphs only |
| `assets/data/preflop/` | The figures the tools draw, generated by [holdem-preflop-equity](https://github.com/dafmontenegro/holdem-preflop-equity) and documented field by field there. Fingerprinted by Hugo along with the code, so a change to the numbers busts the cache with it |

## Writing Content

Every post or project is a **page bundle**: a folder with an `index.md` and its images.

```
content/projects/my-project/
├── index.md
├── feature.jpg      # cover, list thumbnail and share image
└── img/             # images used in the text
```

- **Cover (`feature.*`):** use **4:3** (for example 1200×900) so list thumbnails show it whole.
- **Front matter:** `title`, `description` (160 characters or less, used by search engines), `summary` (shown in lists), `date`, `lastmod`, `featureAlt`, `coverAlt`, `coverCaption`, `thumbnailAlt`, `categories` and `tags`.
- **Raw HTML is disabled** in Markdown (`markup.goldmark.renderer.unsafe = false`). Use shortcodes for anything embedded.
- **Section pages** (Projects, Blog, Spaces…) use the share cards in `static/og/` through their `images` front matter. Pages without an image fall back to `static/og/default.jpg`.

### Press Kit

`content/press/` is an **unlisted** page bundle holding the photographs people ask for. Its images are page resources, so Hugo publishes each file untouched at `/press/<file>` — full resolution, original bytes — while the page itself shows previews it resizes. Nothing else in the repository needs to change to add one: drop the file in the bundle and add its row.

It is deliberately hard to arrive at by accident, not hidden: `build.list = never` keeps it out of every list, `sitemap.disable` out of the sitemap, and `robots: "noindex, nofollow"` out of search results. The URL is given out, not found.

### Shortcodes

On top of Congo's own (`alert`, `button`, `katex`, `lead`…) and Hugo's (`youtube`, `vimeo`…):

| Shortcode | Use |
| --- | --- |
| `{{< gifv src="img/clip.webm" alt="..." width="640" height="266" >}}` | A muted, looping, inline video that behaves like a GIF at a fraction of the size |
| `{{< spotify type="playlist" id="..." height="compact" >}}` | Spotify embed (`album`, `track`, `playlist` or `artist`) |
| `{{< super-pony-picker >}}` | Embeds the [Super Pony Picker](https://montenegrodanielfelipe.com/projects/super-pony-picker/) game served from `static/apps/` |
| `{{< butterflies label="..." >}}` | A button that brings yellow butterflies drifting in from the edges of the page. Their wings turn in 3D on a hinge at the body, they dodge the pointer, one that is caught shows a line of *Cien años de soledad*, and they fade out after a few seconds. The page must also set `butterflies: true` in its front matter |
| `{{< quote cite="..." date="2023-04-07" url="..." image="img/art.jpg" alt="..." credit="..." >}}` | One quote of the open journal: the text verbatim (line breaks kept, nothing parsed as Markdown), its attribution, the artwork it travelled with and a link to the original post. `cite`, `image`, `alt` and `credit` are optional, `date` and `url` are not |
| `{{< quote-random >}}` | A button that jumps to one of the quotes on the page at random and lights it for a moment. The page must also set `literature: true` in its front matter |
| `{{< preflop-grid >}}` | The 13 x 13 grid of all 169 Texas Hold'em starting hands, shaded by a metric the reader chooses, with a legend, a hand panel and a table view |
| `{{< preflop-picker >}}` | Pick two real cards and read what that hand is worth |
| `{{< preflop-headsup >}}` | One hand against another: wins, ties and losses |
| `{{< preflop-allin >}}` | Whether calling an all-in makes money, with the arithmetic shown |
| `{{< preflop-trainer >}}` | Deals a hand and asks for a decision, keeping the streak in the reader's own browser |

The five `preflop-*` shortcodes share one page's data and one stylesheet, so a page using any of them sets `preflop: true` once in its front matter.

The `quote` shortcode needs nothing of its own, but `quote-random` does, so a page using it sets `literature: true` once in its front matter.

For YouTube embeds, prefer `{{< youtube id="..." loading="lazy" >}}`. Privacy settings for YouTube, Vimeo and Google Analytics live in `config/_default/hugo.toml`.

## Generated Content

The Literature space is **not hand-written**: `content/spaces/literature/index.md` is built from the archived X posts, so it can be rebuilt if more of them are ever recovered.

```
scripts/literature/
├── build.py        # reads the archive, writes index.md and copies the artwork
└── curation.json   # what enters, how it is grouped, and every per-post correction
```

```sh
python3 scripts/literature/build.py --archive ~/Documents/tweets_dafmontenegro
```

An artwork named in `curation.json` without a `source` is one that never travelled through a post — a film still, say — and is expected to be committed to the page bundle already; the build stops if it is missing. A piece can carry a pair of plates (`image2`/`alt2`), shown side by side where there is room.

**The page keeps growing.** A line found since the journal left X is added as an entry in `curation.json` whose id is not a post id, carrying at least `body` and `date`, and listed in the section it belongs to; it renders like any other piece, with its date as plain text instead of a link to a post that does not exist. Editing `index.md` by hand does not survive the next run, which is the point.

`build.py` splits each post into the quote, its attribution and the artwork's reference by documented rules, and **stops the build** rather than publishing a post those rules cannot read; the corrections live in `curation.json`, alongside the quotes that had to be transcribed out of an image. Quotes are emitted verbatim. Dates are shifted to `America/Bogota` before the day is taken, so each piece carries the day it was written rather than the UTC one. Requires Pillow.

### Pokémon Sprites

The homepage's Pokémon are fetched, not hand-placed, so the roster can grow:

```sh
python3 scripts/pokemon/build.py
```

It downloads each Pokémon's animated *Black and White* sprite from the [PokeAPI sprites](https://github.com/PokeAPI/sprites) repository by National Dex number and records its size. A new Pokémon is a line in its `ROSTER`, plus an act in `assets/js/pokemon.js`. Requires Pillow and curl.

## Build and Deploy

Every push to `master` runs `.github/workflows/hugo.yaml`, which:

1. Installs Hugo extended at the pinned version.
2. Restores a cache of processed images and Hugo modules, so only new or changed images are processed.
3. Builds with `hugo --gc --minify` using the `baseURL` from `config/_default/hugo.toml`.
4. Publishes `public/` to GitHub Pages.

To preview locally (Hugo extended and Go installed): `hugo server`.

**Configured outside this repo, in Cloudflare:** DNS, HTTPS redirects, caching rules for fingerprinted assets, and Email Address Obfuscation (keep it **off**: it rewrites addresses like `user@host` inside code blocks).

## License and Credits

All content © Daniel Felipe Montenegro. All rights reserved.

Third-party works keep their own rights and are credited on the pages where they appear, including the artworks by [Mónica Páez](https://monicapaez.com/), film stills and book covers. The Pokémon sprites are © Nintendo, Creatures Inc. and GAME FREAK inc., from *Pokémon Black and White* and, for the Gyarados, *Pokémon SoulSilver*. The Congo theme is licensed under the [MIT License](https://github.com/jpanther/congo/blob/dev/LICENSE).
