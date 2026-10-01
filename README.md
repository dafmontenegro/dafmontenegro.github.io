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
| `assets/` | Files processed by Hugo: author photo, Caesar's Window (SVG and PNG), color scheme and custom CSS |
| `static/` | Files served as-is: favicons, web manifest, share cards (`og/`) and standalone apps (`apps/`) |

## Customizations

These files override templates from Congo or Hugo. **Review them whenever Congo or Hugo is upgraded**, since each one is a copy of an upstream template with a small change, documented at the top of the file.

| File | Based on | Change |
| --- | --- | --- |
| `layouts/_partials/profile.html` | Congo 2.14 | Eager-loaded author photo with a Caesar's Window badge |
| `layouts/_partials/article-link.html` | Congo 2.14 | List thumbnails cropped from the center instead of Hugo's "smart" crop |
| `layouts/_partials/opengraph.html` | Hugo 0.167 | Shared title is "Page · Daniel Felipe Montenegro" outside the homepage |
| `layouts/_partials/twitter_cards.html` | Hugo 0.167 | Same title change for X cards |
| `layouts/_shortcodes/button.html` | Congo 2.14 | Adds `rel="noopener noreferrer"` to links that open a new tab |
| `layouts/404.html` | Congo 2.14 | 404 page with Caesar's Window |

These are additions, not overrides:

| File | Purpose |
| --- | --- |
| `layouts/_partials/extend-head.html` | schema.org `Person` data on the homepage and About page (Congo hook) |
| `assets/css/custom.css` | Caesar's Window styles for the badge, the 404 page and light/dark variants (bundled by Congo) |

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

### Shortcodes

On top of Congo's own (`alert`, `button`, `katex`, `lead`…) and Hugo's (`youtube`, `vimeo`…):

| Shortcode | Use |
| --- | --- |
| `{{< gifv src="img/clip.webm" alt="..." width="640" height="266" >}}` | A muted, looping, inline video that behaves like a GIF at a fraction of the size |
| `{{< spotify type="playlist" id="..." height="compact" >}}` | Spotify embed (`album`, `track`, `playlist` or `artist`) |
| `{{< super-pony-picker >}}` | Embeds the [Super Pony Picker](https://montenegrodanielfelipe.com/projects/super-pony-picker/) game served from `static/apps/` |

For YouTube embeds, prefer `{{< youtube id="..." loading="lazy" >}}`. Privacy settings for YouTube, Vimeo and Google Analytics live in `config/_default/hugo.toml`.

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

Third-party works keep their own rights and are credited on the pages where they appear, including the artworks by [Mónica Páez](https://monicapaez.com/), film stills and book covers. The Congo theme is licensed under the [MIT License](https://github.com/jpanther/congo/blob/dev/LICENSE).
