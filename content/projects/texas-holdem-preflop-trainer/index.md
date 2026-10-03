---
title: "Texas Hold'em Preflop: What Every Starting Hand Is Worth"
description: "Exact preflop odds for all 169 Texas Hold'em starting hands: equity against 1 to 8 opponents, against ranges, and the all-in decision. Every figure computed, not quoted."
summary: "Every one of the 169 starting hands in Texas Hold'em, worked out from scratch: how often each one wins, what it is worth against one opponent or eight, how it does against a player who only plays strong hands, and when calling an all-in makes money. The figures come from complete enumeration where that is possible and from simulation with measured error where it is not, and the page says which is which, every time."
date: 2026-10-03
lastmod: 2026-10-03
featureAlt: "The 13 by 13 grid of all 169 Texas Hold'em starting hands, each shaded by how much of the pot it wins against a random hand"
coverAlt: "The 13 by 13 grid of all 169 Texas Hold'em starting hands, each shaded by how much of the pot it wins against a random hand"
coverCaption: "All 169 starting hands, shaded by exact equity against one random hand"
thumbnailAlt: "The 13 by 13 grid of all 169 Texas Hold'em starting hands, each shaded by how much of the pot it wins against a random hand"
categories: ["software", "mathematics"]
tags: ["poker", "texas-holdem", "preflop", "probability", "combinatorics", "monte-carlo", "equity", "poker-odds", "enumeration", "c"]
preflop: true
---

Draft in progress. The interactive grid below is live; the written article is
being added section by section.

{{< preflop-grid >}}

## Where the numbers come from

Every figure on this page was computed for it. Nothing is quoted from a book
or a website, and nothing is rounded off from memory. The engine that produced
them is [holdem-preflop-equity](https://github.com/dafmontenegro/holdem-preflop-equity),
and it rebuilds every table from nothing with one command.

Two kinds of number appear here, and they are never mixed:

- **Exact** figures come from enumeration: every possible board counted, one
  at a time. There is no error bar, because there is no sampling — the counts
  are the counts.
- **Estimated** figures come from simulation, and every one carries the
  standard error of its own sample.

Which of the two a figure is gets stated wherever it appears.
