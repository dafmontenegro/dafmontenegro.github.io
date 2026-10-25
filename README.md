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
| `static/` | Files served as-is: favicons, web manifest, share cards (`og/`), standalone apps (`apps/`) and certificate PDFs (`certificates/`) |

## Customizations

These files override templates from Congo or Hugo. **Review them whenever Congo or Hugo is upgraded**, since each one is a copy of an upstream template with a small change, documented at the top of the file.

| File | Based on | Change |
| --- | --- | --- |
| `layouts/_partials/profile.html` | Congo 2.14 | Eager-loaded author photo with a Caesar's Window badge, which is a button that opens the Poké Ball |
| `layouts/_partials/article-link.html` | Congo 2.14 | List thumbnails cropped from the center instead of Hugo's "smart" crop |
| `layouts/_partials/opengraph.html` | Hugo 0.167 | Shared title is "Page · Daniel Felipe Montenegro" outside the homepage |
| `layouts/_partials/twitter_cards.html` | Hugo 0.167 | Same title change for X cards |
| `layouts/_shortcodes/button.html` | Congo 2.14 | Adds `rel="noopener noreferrer"` to links that open a new tab |
| `layouts/404.html` | Congo 2.14 | 404 page with Caesar's Window, and a line pointing to Roz |
| `layouts/_partials/google_analytics.html` | Hugo 0.167 | Same tag and Do Not Track rule; sets the page's context (content group, colour scheme, viewport band, time zone, automation flag) and two user properties before the first page view. See [Analytics](#analytics) |

These are additions, not overrides:

| File | Purpose |
| --- | --- |
| `layouts/_partials/extend-head.html` | schema.org `Person` data on the homepage and About page, and the per-page assets behind a front matter flag: the book-chapter stylesheet on `bookChapter`, the butterflies assets on `butterflies`, the preflop stylesheet, script and data on `preflop`, and the Literature stylesheet and script on `literature`; plus, on every page, the analytics events through `telemetry.html`, and, unless it sets `koi: false`, the Poké Ball through `koi.html` (Congo hook) |
| `assets/css/custom.css` | Caesar's Window styles for the badge, the 404 page and light/dark variants, and the Ask Roz card and the diagrams (bundled by Congo) |
| `assets/css/certifications.css` | Styles for the Certifications page: the featured Microsoft certification, the lists and the folded Platzi list (loaded only on pages with `certifications: true`) |
| `assets/img/roz/` | Roz waving beside Brightbill, one animated GIF per theme, for the Ask Roz card. Drawn from the same grids as Roz's chat page |
| `data/certifications.json` | Every certification and course certificate (103), with issuer, date, credential ID and verification link: the only source of the Certifications page. A vendor certification can add `certificate` (`image`, a path under `assets/`, and `pdf`, a path under `static/`) to show the certificate in its card, linked to the PDF |
| `assets/img/certifications/` | Certificate images for the featured card, resized to WebP by the `certifications` shortcode; each one is the certificate cropped to its frame, its PDF in `static/certificates/` |
| `layouts/_partials/certification-date.html` | A credential's date, as precise as its source (day or month) |
| `assets/css/butterflies.css` | Styles for the butterflies shortcode: the button, the 3D wings and their beat, and the quote card (loaded only on pages with `butterflies: true`) |
| `assets/js/butterflies.js` | The flight engine behind the butterflies shortcode: the arrivals, the wandering, the dodging and the catching |
| `assets/css/preflop.css` | Styles for the preflop tools: the 13 x 13 grid, the card picker, the panels and the table view (loaded only on pages with `preflop: true`) |
| `assets/js/preflop.js` | The five preflop tools. Reads `assets/data/preflop/hands.json` once and builds whichever tools the page mounts; the head-to-head matrix is fetched on demand, since only one of them needs it |
| `assets/css/literature.css` | Styles for the Literature space: the "open at random" button and the wash of colour left on the quote it lands on, plus the one rule that turns off Congo's own quotation marks, so the quotes keep the punctuation they were published with (loaded only on pages with `literature: true`) |
| `assets/js/literature.js` | The "open at random" button. It builds the button itself, so a reader without JavaScript is never shown a control that cannot work |
| `layouts/_partials/telemetry.html`, `assets/js/telemetry.js` | The site's own analytics events, on every page: the script, and what it needs to know about the page (debug under `hugo server`, the reading time, whether it is the 404) as a JSON block. See [Analytics](#analytics) |
| `layouts/_partials/koi.html`, `koi-runtime.html` | Load the Poké Ball: koi.css and koi.js with the page, and the addresses of everything fetched later (pokemon.js, the sprites, the story's anchor) as a JSON block. `koi-runtime.html` builds, once per build, the fingerprinted sprite list pokemon.js reads |
| `assets/css/koi.css` | Styles for the homepage's Poké Ball, the climb (torii, waterfall, golden trail, carp, the evolution and the dragon's ascent), the text box, and what the homepage's Pokémon do to the photo |
| `assets/js/koi.js` | The carp that climbs the waterfall, and the homepage's Poké Ball. On every long article (a single page, never the homepage, a list of other pages such as `/spaces/`, or a page that sets `climb: false`, as Certifications and the Changelog do), a shiny Magikarp comes out at the foot of the screen's right edge and climbs a pixel waterfall (two columns of falling streaks, foam at its foot) up to a torii as the page is read, leaving a golden trail that glints, framed by the same margin at both ends; at the end of the page it evolves into a Gyarados that rises into the clouds and links to the story in About (`#the-carp-and-the-dragon`); after that the climb is over for that visit, and going back up does not bring the carp out again. Only the scroll starts it; clicking the carp makes it Splash, and on a computer it can be dragged to scroll. Tied to the scroll only: the page is measured on resize, never on scroll, and each frame only writes transforms. Under 768px, where the climb would run over the text, nothing shows while the page is read: only at its end does the carp leap up from the bottom of the screen by its right edge, evolve in a burst of pixel rays and rise off the top of the screen. On the homepage it builds the Poké Ball instead, makes the logo and the photo's badge open it, and shows hints in the games' dialogue boxes: pointing at the ball, the badge and the logo on every visit until the visitor has let out five Pokémon, and after each Pokémon how to open the Pokédex, until it has been opened (`localStorage`, keys `koi-releases` and `koi-dex-opened`). Also holds the games' text box and the pixel-art drawing the Pokémon share |
| `assets/js/pokemon.js` | The homepage's Pokémon, fetched the first time the ball or the badge is pressed there. Each press brings out one act that plays with the photo, and often the rest of the page: Pichu climbs on the photo and evolves into a Pikachu that shocks it; Charmander evolves into a Charizard that roars, flies (its shadow sweeping the page both ways) and dives back with a Fire Blast in its classic 大 shape that flies out at the screen, leaving the photo's rim charred; Munchlax eats its way along the red box and evolves into a Snorlax that sleeps beside the photo until it plays the Poké Flute; Gastly evolves twice in a dimmed page and Gengar turns the photo into its own portrait, as a prank; Ditto transforms into four Pokémon drawn at random from every sprite the site has (so it grows with the roster), flickers through them as it loses its grip, then into the author by turning the page's words into Ditto (by rule, so the text can change freely); Psyduck's headache builds until its Confusion sends the page lurching; Jigglypuff sings the page to sleep and, ignored, draws a moustache on the photo; Abra, Kadabra and Alakazam teleport the photo round the page and bring it home; Eevee evolves by a stone, a sun, a moon or a heart drawn on Caesar's Window (at random, the site's light or dark theme decides between Espeon's sun and Umbreon's moon), and each of its eight evolutions turns the page into its own weather: a flood, lightning, a ring of fire, levitation, a starry night under the rising badge-moon, a storm of leaves, a blizzard, a pink mist in which Sylveon ties a bow tie on the photo's tie; Rotom possesses the theme button and flips the site between light and dark, then leaves it as it was (the class on `<html>` only, never the stored preference); Porygon turns the page into code (every element outlined and labelled as developer tools draw it), Porygon2 streams the page's own markup past and Porygon-Z glitches it until it reboots; and Giratina opens a rift to the Distortion World in the photo, turns the page upside down and, there, comes out of the rift in its Origin Forme on an upright stage over everything, sweeping across the screen trailing shadows. Holding the ball down (it shakes and a ring fills round it; or right-click it, or press the up arrow on it) opens a Pokédex to choose one, Eevee opening a second page with its evolutions; the ones not met yet show as a silhouette and "???", and what has been met is kept in the visitor's own browser (`localStorage`, key `koi-pokedex`). Also MissingNo., the 404 page's visitor: the page tears, it pieces itself together beside Caesar's Window, scrambles the 404, jumps round the window and flees |
| `assets/img/koi/` | The carp, the animated shiny Magikarp of Pokémon Black and White, and the dragon, the shiny Gyarados of Pokémon SoulSilver |
| `assets/img/pokemon/`, `assets/data/pokemon/` | The homepage's Pokémon: their animated Black and White sprites, plus Snorlax asleep and Sylveon (a later Pokémon) from Pokémon Mystery Dungeon, which those games never drew; and their names and sizes. Written by `scripts/pokemon/build.py` |
| `assets/js/clover.js`, `assets/css/clover.css`, `layouts/_partials/clover.html` | The clover in the footer's copyright line, on every page, turned into a button: a press calls a Nintendo guest at random, a long press or a right click opens a games' window to choose one. It fetches `guests.js` and the sprite sheets only the first time it is used |
| `assets/js/guests.js` | The clover's guests, drawn in pixels on a canvas across the bottom of the screen at a small scale, always a whole number of the screen's own pixels (Zelda and her Link, from finer sprites, smaller still): **Link** (Link's Awakening DX) walks in, charges his sword, cuts a bush with a spin attack, picks up the four-leaf clover that bounces out of it and holds it up while the text box says that luck is made, then hops for joy with it; **Zelda and Link** (The Minish Cap) walk to the footer's clover together, she prays, her golden light gathers on it and bursts into a ring, and he raises his sword, which catches the light (courage and wisdom); **Kirby** (Kirby's Adventure) floats in, inhales the footer's clover and copies LUCK, which comes up FIRE, SLEEP and SWORD in turn (a small ability card over his head says which), then spits it back as a star that bursts where the clover was, because luck isn't his to keep, and floats away. While they act, the text box (borrowed from `koi.js` where the page has it) moves to the top of the screen, as Link's Awakening moves it, and the homepage's hints step aside. A random call never repeats the last guest. With reduced motion each guest appears in one pose while the text box speaks |
| `assets/img/nintendo/`, `scripts/nintendo/build.py` | The guests' sprite sheets and the script that writes them from the games' rips on The Spriters Resource (Link by Mister Mike; Zelda by Sonikku and Minish Cap Link by Barubary; Kirby by QuadFactor and UltraHype97) and Zelda Wiki (the bush, by BruceJuice), through the Internet Archive's copies; the clover Link finds is drawn by the script in the game's palette |
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
| `{{< certifications group="vendor" >}}` | One group of `data/certifications.json`: `counts`, `vendor`, `university`, `short` or `platzi`. The page writes the headings in Markdown so they reach the table of contents, and sets `certifications: true` |
| `{{< diagram src="architecture.svg" alt="..." caption="..." >}}` | An SVG from the page bundle, inlined so it is drawn in the site's colours and follows light and dark on its own: the drawing only names `dg-*` classes, coloured in `custom.css`. `alt` describes the whole drawing; `caption` is optional |
| `{{< roz-knowledge file="facts.md" >}}` | One of Roz's knowledge files from the page bundle, rendered as Markdown with its headings one level down. Used only by `/roz-remember/` |
| `{{< ask-roz >}}` | A card inviting the reader to talk to Roz, with her waving; `style="line"` gives a single sentence instead. The address is `rozUrl` in `params.toml` |
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

It downloads each Pokémon's animated *Black and White* sprite from the [PokeAPI sprites](https://github.com/PokeAPI/sprites) repository by National Dex number and records its size. What those games never drew, Snorlax lying asleep and Sylveon, is cut from *Pokémon Mystery Dungeon*'s sheets in [PMDCollab's SpriteCollab](https://github.com/PMDCollab/SpriteCollab), trimmed and made into a GIF. A new Pokémon is a line in its `ROSTER`, plus an act in `assets/js/pokemon.js`. Requires Pillow and curl.

## Analytics

The site uses **Google Analytics 4** (property `G-QMJW2TPVMJ`, set in `config/_default/hugo.toml`). GA records page views, the 90 % scroll, outbound clicks and document downloads by itself; everything else below is sent by the site.

**How it is wired.** `layouts/_partials/google_analytics.html` replaces Hugo's embedded template: same tag, same Do Not Track rule, plus the page's context set before the first page view. `assets/js/telemetry.js` defines `window.siteTrack(name, params)` and listens for what any page can do; `koi.js`, `pokemon.js` and `butterflies.js` call `siteTrack` for what only they can see. Where GA is not set up (development builds, or a browser that sends Do Not Track), `siteTrack` sends nothing.

**Checking a change.** Under `hugo server` every event is printed to the browser console as `[telemetry] name {params}` and kept in `window.siteTelemetryLog`. Nothing reaches GA from a development build.

**Never sent:** anything typed or copied, apart from search terms typed into the site's own search box (cut to 100 characters); for a copy, only its length. No event carries an address, a name or an identifier of the visitor.

### Context on every event

| Parameter | Value | Why |
| --- | --- | --- |
| `content_group` | Home, Blog post, Project, Space, `<Section> list`, Taxonomy, Not found, or a standalone page's name from its address (About, Privacy…) | GA4's built-in "Content group": compare kinds of page without matching paths |
| `color_scheme` | `dark` / `light`, as first shown | Whether a change has to look right in both is a question of how many see each |
| `viewport_band` | `<640`, `640-767`, `768-1023`, `1024-1279`, `1280+` | The widths where the layout changes, not exact pixels |
| `time_zone` | The browser's IANA zone, e.g. `America/Bogota` | Set against GA's city, it separates a reader from a data-centre machine whose clock is elsewhere |
| `webdriver` | `yes` / `no` | `navigator.webdriver`: browsers driven by Selenium, Puppeteer or Playwright say so unless told to hide |
| User property `theme_preference` | `dark`, `light` or `system` | What the visitor chose, not what the page shows |
| User property `pokemon_seen` | 0-12 | How far into the Poké Ball this browser has got |

### Events

| Event | Sent when | Parameters | Question it answers |
| --- | --- | --- | --- |
| `scroll` | 25, 50, 75 and 100 % of a page that scrolls at least half a screen (GA adds 90) | `percent_scrolled` | How far down people read |
| `article_complete` | The footer under an article's text comes into view | `engaged_seconds` (visible time), `reading_minutes` (Hugo's estimate) | Read or skimmed |
| `social_click` | A link to LinkedIn, GitHub, X, Telegram, YouTube, Instagram, Spotify or WhatsApp | `network`, `placement` (header, footer, profile, content), `link_url` | Which profiles get visited, and from where |
| `in_page_link` | A link to a heading of the same page | `link_target`, `placement` (toc, heading, …) | Whether the table of contents is used |
| `file_download` | A Press Kit photograph (GA's own tracking skips images) | `file_name`, `file_extension`, `link_url`, `link_text` | Which photographs are taken |
| `search_open` / `search` / `search_result_click` | The search is opened; 1.5 s after typing stops; a result is chosen | `placement`; `search_term`, `result_count`; `link_url`, `result_position` | What people look for and do not find |
| `theme_toggle` | The light/dark button | `color_scheme` (the one switched to) | |
| `scroll_to_top` | Congo's "back to top" button | `percent_scrolled` | |
| `code_copy` | A code block's copy button | `code_language` | Which snippets are useful |
| `text_copy` | Text copied from the page (at most 10 per page view) | `characters`, `placement` (code, content) | What gets quoted, by size only |
| `embed_interact` | A YouTube, Vimeo or Spotify player takes focus (a click on it) | `embed_provider` | Whether the embeds are played |
| `page_translated` | Chrome's translator translates the page | `language` | How many read the site in another language |
| `page_print` | The page is printed | | |
| `page_not_found` | The 404 page | `missing_path`, `referrer_host` | Broken links, here or elsewhere |
| `js_error` | An error in the site's own scripts (at most 5 per page view) | `error_message`, `error_source` | What breaks, on which browsers |
| `web_vitals` | The page is hidden or left | `lcp_ms`, `cls`, `inp_ms`, `fcp_ms`, `ttfb_ms` (each only where the browser measures it) | How fast the site is for real visitors |
| `pokeball_press` | The ball, the photo's badge or the logo is pressed on the homepage | `trigger` (ball, badge, logo) | Which way in people find |
| `pokemon_release` | A Pokémon comes out | `pokemon`, `chosen_from` (random, pokedex), `first_meeting`, `seen_count` | Which acts are met, and how often by choice |
| `pokemon_act_end` | The photo is given back | `pokemon`, `act_seconds`, `act_failed` | Whether the acts are worth their length |
| `pokeball_busy` | The ball is pressed while a Pokémon is still out | `pokemon` | Impatience with an act |
| `eevee_evolve` | Eevee evolves | `form`, `chosen_from` | |
| `pokedex_open` / `pokedex_page` / `pokedex_dismiss` | The Pokédex opens; its Eevee page opens; it closes without a choice | `trigger` (hold, right_click, arrow_up), `seen_count`; `pokemon`; `method` (escape, outside, ball) | Whether the hidden Pokédex is found |
| `hint_shown` / `hint_dismiss` | A homepage hint appears; it is closed by a touch | `hint` (ball, badge, logo, pokedex_tip) | Whether the hints work |
| `missingno_appear` | MissingNo. appears on the 404 page | | |
| `koi_evolve` | The carp evolves at the end of a page (once per page view) | `mode` (climb, leap) | |
| `koi_splash` / `koi_drag` / `koi_story_click` | The carp is clicked; dragged as a scrollbar (once per page view); the dragon's link to its story is followed | | Whether the carp is played with |
| `butterflies_release` / `butterfly_catch` | The About page's butterflies are released; one is caught | | |
| `quote_random` | Literature's "open at random" button | | |
| `preflop_use` | The first use of each preflop tool on the page | `tool` (grid, picker, headsup, allin) | Which tools are used. The trainer is left out: it tells the reader that nothing it does is sent anywhere |

### Registering the parameters in GA

GA only shows a parameter in its reports once it is registered (**Admin > Custom definitions**), and only from that moment on. `content_group`, `percent_scrolled`, `search_term`, `file_name`, `file_extension`, `link_url` and `link_text` are built in and need nothing.

- **Custom dimensions, event scope:** `color_scheme`, `viewport_band`, `time_zone`, `webdriver`, `network`, `placement`, `link_target`, `code_language`, `embed_provider`, `language`, `missing_path`, `referrer_host`, `error_message`, `error_source`, `tool`, `trigger`, `pokemon`, `chosen_from`, `first_meeting`, `act_failed`, `form`, `method`, `hint`, `mode`.
- **Custom dimensions, user scope:** `theme_preference`, `pokemon_seen`.
- **Custom metrics, event scope:** `engaged_seconds` and `act_seconds` (seconds), `reading_minutes` (minutes), `lcp_ms`, `inp_ms`, `fcp_ms` and `ttfb_ms` (milliseconds), `cls`, `characters`, `result_count`, `result_position`, `seen_count` (standard).

**Configured outside this repo, in GA:** event data retention of 14 months; a data filter, "Solo hostname sitio principal", that keeps only events whose hostname is exactly `montenegrodanielfelipe.com` (copies of the site that kept its tag have sent data under other hostnames), created in Testing on 2026-10-12, which marks events without discarding any until it is made Active; and the link with Search Console. There is no internal-traffic rule: it would need a fixed IP address.

## Assistant

An AI assistant, **Roz** (after the robot of *The Wild Robot*), answers visitors' questions about me; how she is designed is on [her project page](https://montenegrodanielfelipe.com/projects/roz/). Her code lives in its own repository. What lives in the site is **which public pages she may use**:

| File | Purpose |
| --- | --- |
| `content/assistant/index.md` | Which pages the assistant may use: `exclude` keeps a page from it entirely, `catalogOnly` lets it name and link a page without reading it. Any other page in the site's lists is used, so new posts and projects need nothing here |
| `layouts/assistant/page.json` | Builds `/assistant/index.json` with the site: each page with its title, description and URL and, unless excluded, its text with the headings kept |

The page is JSON only, kept out of lists, the sitemap and search, and holds nothing a visitor cannot already read on the site. A change to a page reaches the assistant when her index is rebuilt from the deployed site.

## If One Day I Am Not Here

`content/roz-remember/` (`/roz-remember/`) is a page in no menu, but in the sitemap and open to search engines and archives, so that the more places keep it, the longer it lasts; `content/assistant/index.md` keeps it out of Roz's own index. It holds everything Roz knows about me: how she answers (`voice.md`), the core she reads on every question (`facts.md`), the notes she looks up (`notes.md`) and what I was up to on its date (`now.md`). Roz's code and rules live in a private repository; these three files are copied here by its export script every time her knowledge is rebuilt, so that her knowledge outlives it. The page opens with why, in my words. The `roz-knowledge` shortcode renders each file. Do not edit the four files here: they are overwritten on the next export, which also sets the page's `lastmod`. After every deploy, the workflow asks the Internet Archive to save the homepage and this page, and `static/llms.txt` points AI readers to it.

## Build and Deploy

Every push to `master` runs `.github/workflows/hugo.yaml`, which:

1. Installs Hugo extended at the pinned version.
2. Restores a cache of processed images and Hugo modules, so only new or changed images are processed.
3. Builds with `hugo --gc --minify` using the `baseURL` from `config/_default/hugo.toml`.
4. Publishes `public/` to GitHub Pages.

To preview locally (Hugo extended and Go installed): `hugo server`.

**Roz does not follow a push on her own.** She reads the published site when she is indexed, from her own repository. After a push that changes what she should know, once GitHub Pages has published it, run `npm run sync` there: it waits for the deploy, asks before indexing, and offers the commit of `content/roz-remember/` that the index produces. The push hook below reminds you.

**Git hooks.** `.githooks/` (the same three in Roz's repository), enabled once per clone with `git config core.hooksPath .githooks`:

| Hook | Blocks | Warns or reminds |
| --- | --- | --- |
| `commit-msg` | A message not in Conventional Commits form (`type(scope): subject`); a subject over 72 characters, ending in a period, or without a blank line after it; any AI attribution; Spanish; tailnet names or addresses | A subject that does not read as an imperative; body lines over 100 characters |
| `pre-commit` | `CLAUDE.md`, `CLAUDE.local.md`, `.claude/` and `.env` files; added lines with tailnet names or addresses, which this public history must never hold | |
| `pre-push` | Any commit being pushed whose message carries an AI attribution, even one made with `--no-verify` | That Roz needs `npm run sync` when the push changes `content/`, `data/` or `layouts/` |

`--no-verify` skips them, knowingly, for one commit or push.

**Configured outside this repo, in Cloudflare:** DNS, HTTPS redirects, caching rules for fingerprinted assets, and Email Address Obfuscation (keep it **off**: it rewrites addresses like `user@host` inside code blocks).

## License and Credits

All content © Daniel Felipe Montenegro. All rights reserved.

Third-party works keep their own rights and are credited on the pages where they appear, including the artworks by [Mónica Páez](https://monicapaez.com/), film stills and book covers. The Pokémon sprites are © Nintendo, Creatures Inc. and GAME FREAK inc., from *Pokémon Black and White*, *Pokémon SoulSilver* (the Gyarados) and *Pokémon Mystery Dungeon* (Snorlax asleep, by Spike Chunsoft, via PMDCollab's SpriteCollab). The Congo theme is licensed under the [MIT License](https://github.com/jpanther/congo/blob/dev/LICENSE).
