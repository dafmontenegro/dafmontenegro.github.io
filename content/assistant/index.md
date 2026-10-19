---
# The knowledge the site's assistant answers from, built with the site at
# /assistant/index.json by layouts/assistant/page.json. Nothing renders as HTML.
#
# The assistant reads assets/assistant/facts.md whole, plus a catalog of the pages
# below and the text of the ones it retrieves for each question. A page in `exclude`
# never reaches it in any form; a page in `catalogOnly` can be named and linked, but
# its text is never given to the model. Every other page in the site's lists is
# fair game, so a new post or project is picked up on the next build.
title: "Assistant knowledge"
outputs: ["json"]
build:
  list: never
  render: always
sitemap:
  disable: true
assistant:
  exclude:
    # Personal pages
    - /blog/my-birthday/
    - /blog/a-house-in-the-middle-of-nowhere/
    - /thoughts/
    - /spaces/paw-prints/
    # Pages about the site rather than about Daniel
    - /press/
    - /privacy/
    - /changelog/
  catalogOnly:
    # Named and linked, not read
    - /about/
---
