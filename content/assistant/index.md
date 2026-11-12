---
# The public pages the site's assistant may use, built with the site at
# /assistant/index.json by layouts/assistant/page.json. Nothing renders as HTML.
#
# A page in `exclude` never reaches it in any form; a page in `catalogOnly` can be
# named and linked, but its text is never given to the model. A page in `hidden` is
# kept out of the site's lists (build.list: never) but may still be named and linked,
# never read. Every other page in the site's lists is fair game, so a new post or
# project is picked up on the next build.
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
    - /spaces/paw-prints/
    # Pages about the site rather than about Daniel (the changelog is read: Roz tells what is new)
    - /press/
    - /roz-remember/
    - /privacy/
  catalogOnly:
    # Named and linked, not read
    - /about/
  hidden:
    # Easter eggs Roz may lead to: the page itself, not only its project page
    - /kuantan/
---
