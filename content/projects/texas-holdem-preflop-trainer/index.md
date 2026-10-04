---
title: "Texas Hold'em Preflop: What Every Starting Hand Is Worth"
description: "Exact preflop odds for all 169 Texas Hold'em starting hands: equity against 1 to 8 opponents, against ranges, and the all-in decision. Every figure computed, not quoted."
summary: "Every one of the 169 starting hands in Texas Hold'em, worked out from scratch: how often each one wins, what it is worth against one opponent or eight, how it does against a player who only plays strong hands, and when calling an all-in makes money. The figures come from complete enumeration where that is possible and from simulation with measured error where it is not, and the page says which is which, every time."
date: 2026-10-03
lastmod: 2026-10-03
featureAlt: "A cartoon card shark in a dealer's vest, pushing a stack of chips across a felt table while holding the ace of hearts and the ace of spades"
coverAlt: "A cartoon card shark in a dealer's vest, pushing a stack of chips across a felt table while holding the ace of hearts and the ace of spades"
coverCaption: "The card shark, holding the best starting hand there is"
thumbnailAlt: "A cartoon card shark in a dealer's vest, pushing a stack of chips across a felt table while holding the ace of hearts and the ace of spades"
categories: ["software", "mathematics"]
tags: ["poker", "texas-holdem", "preflop", "probability", "combinatorics", "monte-carlo", "equity", "poker-odds", "enumeration", "c"]
preflop: true
---

You are dealt two cards. Before anything else happens, you have to decide
whether to put money in. That decision is the most common one in poker and the
easiest to get wrong, because the honest answer to "is this hand any good?"
turns out to depend on things the question does not mention.

This page works it out from scratch. Every figure on it was computed for it —
nothing is quoted from a book, and nothing is rounded off from memory — and
every figure says whether it is **exact** or **estimated**, because those are
different kinds of claim and mixing them is how people end up trusting numbers
they should not.

## 1. The tools

Everything below is explained further down, with its method and its
limitations. Start by playing with it.

### 1.1 All 169 hands at once

The grid every poker player already knows how to read, with real numbers
behind it. Rows and columns run from the ace down to the two. **Pairs lie on
the diagonal, same-suit hands above it, different-suit hands below.**

Change what the shading means with the control above it. Hover, tap or arrow
onto any cell for that hand's figures, and open the table underneath to read
all 169 as text.

{{< preflop-grid >}}

A note on how that is drawn, since it is a chart and charts can lie. Colour
carries one continuous quantity, so the scale is a **single hue from light to
dark** — not a rainbow, which would invent categories the data does not have,
and not red-to-green, which roughly one man in twelve cannot read. The cells
carry each hand's **name** and not its value: a number printed in all 169
cells is unreadable at that size. Every value is one hover away and all of
them are in the table, because a colour scale on its own is not something
everybody can read.

### 1.2 Your own two cards

The grid works in hand types. A player holds two specific cards. Pick them
here and see both at once — and watch what changing a suit does, which is
nothing at all unless it changes whether the two match.

{{< preflop-picker >}}

### 1.3 One hand against another

Every figure here is exact: all 1,712,304 possible boards for the matchup,
counted. Wins, ties and losses are separate because they are different
outcomes — a tie pays half, not nothing.

{{< preflop-headsup >}}

### 1.4 Calling an all-in

Nothing here is looked up. Move the stack and watch the equity you need move
with it, with the arithmetic printed underneath. The situation is heads-up,
blind against blind, with equal stacks; [section 14](#14-the-all-in-and-a-rule-that-does-not-survive-it)
is where it comes from and what it leaves out.

{{< preflop-allin >}}

### 1.5 Practise the decision

A hand is dealt and you decide. Hands come up in proportion to how many of the
1,326 they stand for, so AKo turns up three times as often as AKs, exactly as
at a table. The yardstick is whether the hand is worth more than an equal
share of the pot — a deliberately crude standard, and
[section 12](#12-is-this-hand-worth-playing) says why.

{{< preflop-trainer >}}

## 2. The two kinds of number on this page

**Exact** means enumeration: every possible case was visited and counted, one
at a time. There is no error bar, because there is no sampling. When this page
says a hand makes a flush on 6.383% of boards, that is 135,240 boards out of
2,118,760, counted.

**Estimated** means simulation: hands were dealt at random, millions of times,
and the answer is the average. Every estimated figure carries its **standard
error** — how far the estimate is typically off. With the sample sizes here
that is about 0.08 percentage points, and the true value lies within about two
of those, 95% of the time.

Where a figure could have been either, it is exact. Simulation appears only
where exact counting is genuinely out of reach, and the page says so each time.

## 3. The game, in one section

Each player gets **two private cards**. Then five **community cards** are
turned face up in the middle, in three stages: the **flop** (three cards), the
**turn** (one), and the **river** (one). Everything before the flop is
**preflop**, which is what this page is about.

At the end, each player makes their best **five-card hand** out of the seven
available to them — their two plus the five in the middle. They may use both
of their own cards, one, or neither.

Hands are ranked by category, weakest to strongest:

| Category | What it is |
| --- | --- |
| High card | Nothing made |
| Pair | Two cards of the same rank |
| Two pair | Two different pairs |
| Three of a kind | Three of the same rank |
| Straight | Five consecutive ranks, any suits |
| Flush | Five cards of one suit |
| Full house | Three of a kind plus a pair |
| Four of a kind | Four of the same rank |
| Straight flush | A straight, all in one suit |

Within a category, the higher cards win. Two pairs of kings beat two pairs of
queens; if both players hold a pair of kings, the next card decides, and so on
down. Only when all five cards match in rank is the pot split.

**Notation.** Ranks are 2 3 4 5 6 7 8 9 T J Q K A. A starting hand is written
as its two ranks plus a letter: **s** for *suited* (both the same suit, like
9♣8♣ = 98s), **o** for *offsuit* (different suits, 9♣8♥ = 98o), and nothing at
all for a pair (AA). The ace is both the highest card and, in the straight
A-2-3-4-5, the lowest.

## 4. Why 169 hands and not 1,326

There are 52 cards and you get two of them, so the number of starting hands is
the number of ways to choose 2 from 52:

```
C(52,2) = (52 × 51) / 2 = 1,326
```

But most of those are the same hand wearing different clothes. **No suit beats
another in Hold'em.** Rename every club a heart and every heart a club, and
you get a deal that is exactly as likely, in which everybody holds a hand of
exactly the same strength against exactly the same opposition. So 9♣8♣ and
9♥8♥ cannot be told apart by anything that matters.

What survives that renaming is only two things: the two ranks, and whether the
suits match. That leaves three families:

| Family | Types | Why | Combinations each | Total |
| --- | --- | --- | --- | --- |
| Pairs (AA … 22) | 13 | one per rank | C(4,2) = 6 | 78 |
| Suited (AKs … 32s) | 78 | C(13,2) pairs of different ranks | 4 | 312 |
| Offsuit (AKo … 32o) | 78 | the same 78 rank pairs | 4 × 3 = 12 | 936 |
| **Total** | **169** | | | **1,326** ✓ |

The 12 offsuit combinations: the high card can be any of 4 suits and the low
card any of the other 3. The 6 pair combinations: choose 2 suits from 4,
without order.

Those **combination counts matter beyond the arithmetic**. They are the
weights to use whenever something is averaged over the 169 types, because a
type that stands for 12 of the 1,326 hands should count twelve times as much
as one that stands for 4. Several of the checks further down depend on exactly
that, so the published data carries the count in a column rather than leaving
the reader to look it up.

## 5. Counting the boards: 2,118,760

To work out what a hand can become, you count what the middle of the table can
be. You hold two cards, so 50 remain, and five of them come out:

```
C(50,5) = 2,118,760
```

A reasonable objection: shouldn't it be 50 × 49 × 48 × 47 × 46 = 254,251,200,
the number of ways to deal five cards in order?

Both are correct counts of different things, and the ratio between them is
exactly 5! = 120, the number of ways to shuffle five cards among themselves.
The question is whether order matters for what we are counting, and for a
finished hand it does not: a flop of 7♦ K♠ 2♣ followed by 5♥ and J♣ gives the
same hand as a flop of 2♣ J♣ 5♥ followed by K♠ and 7♦. The 120 cancels between
the favourable cases and the total, so the probability is the same either way
and the unordered count is 120 times less work.

**When order would matter:** if you were analysing decisions street by street,
because then it matters which cards are known when. For the finished hand at
the river, it does not.

## 6. What a hand can become

For each of the 169 hands, every one of those 2,118,760 boards was dealt and
the resulting hand classified. These are counts, not estimates.

Take **98s**, the suited connector:

| Category | Boards | Probability |
| --- | --- | --- |
| High card | 337,635 | 15.936% |
| Pair | 859,656 | 40.574% |
| Two pair | 461,163 | 21.766% |
| Three of a kind | 90,321 | 4.263% |
| Straight | 180,735 | 8.530% |
| Flush | 135,240 | 6.383% |
| Full house | 47,124 | 2.224% |
| Four of a kind | 2,668 | 0.126% |
| Straight flush | 4,218 | 0.199% |
| **Total** | **2,118,760** | **100%** |

The categories are exclusive — each board counts once, under the best hand it
makes — so they sum to the total exactly. "Straight or better" is the bottom
five added up: **17.462%**.

### 6.1 The same number, by hand

A program that counts 358 million things is easy to trust and hard to check.
So here is the flush, worked out with a pencil, to see whether the program
agrees.

You hold two clubs. Of the 50 cards left, **11 are clubs** and 39 are not. You
have two already, so you need **at least three more clubs** on the board. The
cases do not overlap — a board has exactly three, or exactly four, or exactly
five clubs — so they can simply be added:

| Case | What you choose | Count | Boards |
| --- | --- | --- | --- |
| Exactly 3 clubs | 3 clubs from 11, and 2 of the 39 non-clubs | C(11,3) × C(39,2) = 165 × 741 | 122,265 |
| Exactly 4 clubs | 4 from 11, and 1 of the 39 | C(11,4) × 39 = 330 × 39 | 12,870 |
| All 5 clubs | 5 from 11 | C(11,5) | 462 |
| | | **Subtotal** | **135,597** |

Why multiply: each group of three clubs can be combined with any group of two
non-clubs, and every such pairing is a different board.

And then **the case almost everybody forgets.** You also have a flush if the
board brings five cards of some *other* suit — the flush is on the table and
you play it. For each of the three other suits there are 13 cards and you take
5: 3 × C(13,5) = 3 × 1,287 = **3,861** boards. These cannot overlap with the
cases above, because five diamonds leaves no room for three clubs.

```
135,597 + 3,861 = 139,458 boards
139,458 / 2,118,760 = 6.582%
```

**Does the program agree?** It counted 135,240 boards as "flush" and 4,218 as
"straight flush" — and a straight flush is a flush too. 135,240 + 4,218 =
**139,458**. Exactly. (There is no flush hiding in the full house column,
because seven cards cannot make both.)

### 6.2 "At least one" is easier backwards

With 9-8, how often does the board bring a nine or an eight? There are three
nines and three eights left, so six good cards and 44 others. Counting "at
least one" means counting one, two, three… — but counting **none** is a single
easy case: choose all five board cards from the 44 others.

```
P(none)        = C(44,5) / C(50,5) = 1,086,008 / 2,118,760 = 51.26%
P(at least one) = 1 − 51.26% = 48.74%
```

This is the **complement rule**, and it is worth internalising because "at
least one" questions are everywhere in poker and the backwards version is
almost always the easy one.

### 6.3 Why connectors make straights and aces do not

There are ten possible straights: A-2-3-4-5, 2-3-4-5-6, … , T-J-Q-K-A. Your
two cards help toward a straight only when both fit inside the same window of
five consecutive ranks. Count the windows:

| Hand | Windows containing both cards | Straight or better |
| --- | --- | --- |
| JTs, T9s, 98s, 54s (connected) | 4 | 17.46% – 17.55% |
| Q9s (one gap) | 3 | 14.29% |
| A5s | 1 (A-2-3-4-5) | 13.08% |
| AKs | 1 (T-J-Q-K-A) | 12.02% |
| 32o | 2 (A-5 and 2-6) | 9.33% |
| 72o | 0 | 7.00% |
| K2o | 0 | 6.29% |

More windows, more ways to get there. A-K sits at the edge of the ladder and
can only make the one straight at the top, which is why T9s reaches a straight
or better far more often than AKs does — and why that fact, on its own, tells
you nothing about which hand to play.

### 6.4 Not all pairs are alike

A pocket pair always has the same chance of making a flush, since the suits do
not care which rank they are. But straights are another matter: **a ten or a
five sits inside five of the ten possible straights, while an ace, a king or a
two sits inside only two.** So the middle pairs reach a straight more often:

| Hand | Straight or better | Flush or better |
| --- | --- | --- |
| AA, 22 | 12.580% | 11.362% |
| TT, 55 | 13.707% | 11.362% |

That difference is real but small, and it is not the interesting one. The
sharper version comes from asking what your two cards actually *add* to the
board, which is section 10.

## 7. How we know the counts are right

A program that miscounts one board in ten thousand shifts every number on this
page a little and breaks nothing visibly. So the counting was tied to
something computed independently, long before this code existed.

Take any set of seven cards. It can be split into "two private cards plus a
five-card board" in C(7,2) = **21** ways, and the player's category is the same
in all 21, because it depends on the seven cards and not on which two were
private. So adding up the counts over all 1,326 starting hands counts every
possible seven-card hand exactly 21 times. Divide by 21 and you must land on
the published number of seven-card hands of each category:

| Category | This calculation | Published figure |
| --- | --- | --- |
| High card | 23,294,460 | 23,294,460 |
| Pair | 58,627,800 | 58,627,800 |
| Two pair | 31,433,400 | 31,433,400 |
| Three of a kind | 6,461,620 | 6,461,620 |
| Straight | 6,180,020 | 6,180,020 |
| Flush | 4,047,644 | 4,047,644 |
| Full house | 3,473,184 | 3,473,184 |
| Four of a kind | 224,848 | 224,848 |
| Straight flush | 41,584 | 41,584 |
| **Total** | **133,784,560** | **133,784,560** |

All nine match, with nothing left over when dividing by 21. A mistake in
detecting straights, or flushes, or full houses would have to be cancelled by
an exactly offsetting mistake somewhere else to survive that.

That check covers the *categories*. It says nothing about whether the program
compares two hands of the same category correctly — whether it knows that a
pair of nines with an ace beats a pair of nines with a king. That is checked
separately, and exhaustively: **there are exactly 7,462 distinct five-card hand
values in poker**, a number known for decades, and the evaluator was run over
all 2,598,960 five-card hands to see how many different values it produced. It
produced 7,462. An evaluator that ignored a kicker would merge two hands that
should rank differently and come up short.

And finally, against somebody else's code. Seven chosen matchups were counted
twice over — once by this engine and once by [treys](https://pypi.org/project/treys/),
an independent evaluator — comparing wins, ties and losses as exact integers
rather than comparing the equity, which could agree by luck while the three
counts are wrong. All seven agreed on every count.

## 8. Potential is not the same as winning

Everything above answers "what can this hand become". It does not answer
"should I play it", and the gap between those two is where most poker
intuition goes wrong.

**32o reaches a straight or better 9.33% of the time. AKo reaches one 7.62% of
the time.** 32o makes more straights. It is also, by a distance, the worst
hand in the deck. Making a category more often is worthless if the category
you make is usually smaller than the one your opponent makes with the same
board.

What matters is **equity**: the share of the pot a hand collects on average,
if it is dealt out to the river and shown down. A showdown has three outcomes,
and they are counted separately here because they are different facts:

```
win    your hand is strictly best                 you take 1
tie    k players hold equally best hands          you take 1/k
lose   somebody else is strictly better           you take 0

equity = (wins + sum of 1/k over the ties) / deals
```

The 1/k on a tie is not an approximation or a convenience. A tied pot really
is split k ways, so 1/k really is what you collect. And ties are rarer than
people think, because a better side card is a *win*, not a tie: the pot splits
only when all five cards match in rank.

### 8.1 Every hand against every hand

Equity against one opponent was computed **exactly**, for every ordered pair of
the 169 hands — all 28,561 of them — by dealing out every possible board of
every possible matchup. That is 161 billion hand evaluations, and it is the
table everything else here is built on.

| Hand | Equity vs a random hand | Wins | Ties |
| --- | --- | --- | --- |
| AA | 85.20% | 84.93% | 0.54% |
| AKs | 67.04% | 66.22% | 1.65% |
| 98s | 50.80% | 48.86% | 3.89% |
| 22 | 50.33% | 49.39% | 1.90% |
| 72o | 34.58% | 31.71% | 5.75% |
| 32o | 32.30% | 29.24% | 6.13% |

Notice 98s and 22, which are worth almost exactly the same — and are not the
same hand at all. 98s **ties twice as often**. That is why this page reports
wins, ties and losses separately everywhere: one equity figure hides it.

### 8.2 The check that constrains everything at once

At a table where everybody holds a random hand, nobody has an advantage. The
seats are symmetric, so all the equities must be equal, and since they are
shares of one pot they must add up to 1. Each player is therefore worth exactly
**1/(number of players)**.

So the average over all 1,326 starting hands, weighted by those combination
counts from section 3, must come out at exactly one half. It does — and
because every figure in the matrix is an integer count of boards rather than a
decimal, that check is an equality between two whole numbers, with no rounding
and no "close enough". Both sides are 2,781,381,002,400.

That one check constrains all 28,561 cells together. A mistake anywhere in the
evaluator, the counting or the weighting pushes some hands up and others down
and the average off its mark.

## 9. The average hides the shape

"AKs is worth 67% against a random hand" is an average, and behind it are
1,225 specific hands your opponent might hold. Against some of them AKs is a
huge favourite; against others it is drawing nearly dead. The single figure
says nothing about which.

So each hand was measured against **every hand an opponent can hold**, exactly.
Define it carefully first, because "does this hand beat mine?" has no answer
before the board comes out:

> An opponent's hand **beats** yours when your equity against that specific
> hand is below one half — that is, if the two were turned face up and dealt
> out every possible way, you would collect less than half the pot.

| Your hand | Opponent hands that beat it | Split | You are ahead of |
| --- | --- | --- | --- |
| AA | **0** | 1 | 1,224 |
| AKs | 69 | 3 | 1,153 |
| 22 | 352 | 1 | 872 |
| 98s | 805 | 3 | 417 |
| 72o | 1,086 | 3 | 136 |
| 32o | 1,220 | 3 | **2** |

**Nothing beats aces.** Not one of the 1,225 hands an opponent can hold is a
favourite against them; the only hand that does not lose is the other pair of
aces, which splits. At the other end, 32o is a favourite against exactly two
of them.

And look again at 98s, which has an equity of 50.80% — a hand that gets its
fair share. It is **behind two-thirds of the hands it can face**. Its average
is carried by the times it wins big, not by winning often. That is the whole
argument for publishing a distribution instead of a mean.

## 10. What your cards actually add

Here is a figure that sounds encouraging and is not: 72o makes **two pair or
better on 34% of boards**. That sounds like a playable hand. It is the worst
hand but one.

The catch is that most of those two pairs are sitting on the board, where
every other player at the table has them too. A category you share with
everybody is worth nothing. So: how often do your own two cards actually
improve on what the board gives away for free?

The first way of asking turns out to be a dud, and it is worth seeing why.
Require the best five cards to **include at least one of your own**, and 72o's
"two pair or better" falls from 34.24% to… 34.04%. Across all 169 hands the
largest gap is 0.41 points. The requirement is nearly vacuous, because one of
your cards riding along as a *kicker* satisfies it: the board's two pair plus
your seven as the fifth card does use your seven.

The question has to be sharper. Every board was sorted into one of four
buckets, by comparing your best hand against the hand the board makes alone:

| | Better category | Bigger combination | Only a better side card | Nothing |
| --- | --- | --- | --- | --- |
| **AA** | 94.72% | **4.61%** | 0.17% | 0.50% |
| **KK** | 94.72% | 3.83% | 0.94% | 0.51% |
| **TT** | 94.79% | 1.95% | 2.68% | 0.57% |
| **22** | 94.72% | **0.00%** | 0.00% | 5.28% |
| 72o | 50.95% | 0.07% | 39.85% | 9.13% |
| 32o | 52.37% | 0.00% | 0.30% | **47.33%** |

**Aces and deuces improve the board's category equally often — 94.72% of the
time — and only one of them ever goes further.** A deuce is never a bigger pair
than the board's pair and never a useful side card, so pocket deuces either
make the category or contribute nothing whatsoever. Aces beat the board's own
combination on one board in twenty-two.

And 32o fails to improve on the board at all on nearly **half** of all boards,
against 9% for 72o, because a three and a two lose to the board's own side
cards while a seven often plays as one.

## 11. More than one opponent

Everything so far has been against one opponent. Against several, two things
change, and only one of them is obvious.

The obvious one: your equity falls, because the pot is split among more hands
that might improve. The less obvious one: **the order changes.**

| Hand | 1 opponent | 8 opponents |
| --- | --- | --- |
| AA | 85.20% | 34.55% |
| AKs | 67.04% | 22.64% |
| 98s | 50.80% | 14.55% |
| 22 | 50.33% | 12.48% |
| 72o | 34.58% | 5.40% |
| **32o** | **32.30%** | **6.12%** |

Against one opponent, 32o is the worst hand in the deck and 72o is better than
it. Against eight, **32o is worth more than 72o** — 6.12% against 5.40%, a gap
of fourteen standard errors, so it is not noise. Against a crowd you need a
real hand to win, and 32o makes straights that 7-2 cannot (section 6.3), while
7-2's marginally higher cards stop being worth anything.

These eight-opponent figures are **estimated**, not exact: counting every way
to deal sixteen cards and a board is out of reach. Each is the average of
400,000 simulated showdowns, and each carries its own standard error: 0.075
percentage points for AA, 0.034 for 72o, and never more than 0.08 anywhere in
the table. That is why the gap between 32o and 72o above can be called real
rather than guessed at — it is fourteen times the uncertainty in it.

## 12. Is this hand worth playing?

"Worth playing" needs a yardstick, and there is an obvious one. At a table of
**n** players all holding random hands nobody has an advantage, so each is
worth exactly **1/n** of the pot. A hand worth more than that is pulling more
than its seat.

Call that the **fair share**, and the ratio of a hand's equity to it the
fair-share index. Above 1.00 the hand is above average for that table; below
it, below.

| Hand | 2 players | 6 players | 9 players |
| --- | --- | --- | --- |
| AA | 1.70 | 2.95 | 3.11 |
| AKs | 1.34 | 1.86 | 2.04 |
| 98s | 1.02 | 1.22 | 1.31 |
| 22 | 1.01 | 0.93 | 1.12 |
| 72o | 0.69 | 0.51 | 0.49 |

Two things fall out of that table that no fixed list of "good hands" can tell
you. **22 is above average heads-up, below average six-handed, and above
average again nine-handed** — because at a crowded table the hands that beat it
are busy beating each other, and a pair that holds up is worth more than high
cards that do not improve. And **98s climbs steadily** as the table fills,
while 72o collapses.

You can shade the grid above by the fair-share index at any table size. It is
a crude standard — it knows nothing about position, stack depth, or what the
other players are doing — but it is a standard that can be computed, which is
more than most advice offers.

## 13. Playing against somebody who is not random

Everything so far assumed your opponent holds *any* two cards. Real players
fold their worst hands. So the figures above are the right answer to one
question — what is this hand worth against an unknown hand — and the wrong
answer to "what is this hand worth against *that* player".

A **range** is the set of hands somebody is willing to play, and "top X%" is
the shorthand: rank all 1,326 hands by strength and take the best X%. Ranking
them needs an order, and the only order on this page that is computed rather
than asserted is equity against a random hand, so that is the one used. The
top 5% comes out as twelve hand types:

> **AA KK QQ JJ TT 99 88 AKs 77 AQs AJs AKo**

Two things about that ranking are **choices, not facts**, and they are worth
arguing with. It puts 88 and 77 inside the top 5% ahead of AQs and AJs, and it
contains no suited connectors at all — because it knows nothing about position,
stack depth, or what happens after the flop, all of which good players weigh.
And ranges here are built from whole hand types, never split, so a range asked
for 5% actually covers 5.43%: splitting a type would mean claiming somebody
plays AKo from three suit combinations and folds the fourth, which nobody does.

What happens when the opponent gets choosy:

| Hand | vs any hand | vs top 50% | vs top 20% | vs top 5% |
| --- | --- | --- | --- | --- |
| AA | 85.20% | 85.55% | 85.68% | 82.49% |
| KK | 82.40% | 79.77% | 75.09% | 70.74% |
| AKs | 67.04% | 67.32% | 64.90% | 47.61% |
| TT | 75.01% | 67.50% | 60.91% | 49.24% |
| 98s | 50.80% | 40.91% | 37.41% | 30.48% |
| 22 | 50.33% | 47.73% | 43.80% | 29.16% |

**Aces get better as the opponent gets choosier — up to a point.** AA is worth
*more* against a top-20% range (85.68%) than against a random hand (85.20%),
because a top-20% range is full of offsuit broadway cards that aces crush,
while a random hand might be 65s, which has more ways to get there. Only
against a very tight range does AA finally drop, and only to 82.49%.

**Suited connectors fall apart.** 98s goes from a fair-share hand against
anything to 30.48% against a top-5% range. Against unknown hands it is
average; against strong ones it is a dog.

**And AKs loses a third of its value** the moment the opponent is only playing
premiums — from 67.04% to 47.61%, which is below a coin flip. Hold that
thought.

## 14. The all-in, and a rule that does not survive it

There is a piece of advice everybody repeats: *against an all-in, call only
with JJ+ and AK*. It is worth checking, because checking it needs everything
above plus one thing that is missing.

The missing thing is **pot odds**. Calling an all-in does not need 50% equity,
because some of the money in the pot is not yours any more. Heads-up, blind
against blind, with both players holding **S** big blinds:

```
You are the big blind. They are all-in for S.
Folding leaves you S − 1. Calling costs S − 1 more, for a pot of 2S.

  worth of a call  =  2·S·q − (S − 1)        q = your equity
  equity you need  =  (S − 1) / (2·S)
```

| Stack | 5 bb | 10 bb | 20 bb | 50 bb | 100 bb |
| --- | --- | --- | --- | --- | --- |
| Equity a call needs | 40.00% | 45.00% | 47.50% | 49.00% | 49.50% |

Never 50%, and the shorter the stacks the further below it, because the blinds
are a bigger share of a smaller pot. The
[calculator at the top of this page](#14-calling-an-all-in) does that
arithmetic with whatever hand, range and stack you give it, and shows its
working.

### 14.1 The verdict

**The rule is wrong in both directions, and which direction depends on the
opponent and the stack.**

*Too loose against a tight shove.* Against somebody moving in with only the
top 5%, AKo is a profitable call **only at 5 big blinds**, and AKs only up to
20. Deeper than that, both lose money. The hands that beat AK against a tight
range are precisely the hands a tight player shoves. The rule tells you to
call and lose.

*Too tight against anything else.* Against a top-20% shove — still selective —
**26 hands** are profitable calls at 10 big blinds and **19** at 20, against
the rule's six. Every pair down to 66 or 77 is in there, along with most of the
ace-broadways the rule throws away.

A fixed list of hands cannot be right, because it names neither of the two
things that decide the answer: **the opponent's range sets your equity, and
the stack depth sets the equity you need.** What survives is the rule's shape —
pairs and ace-broadways really do dominate every calling range here, and
against a tight shove nothing outside them calls profitably. It is a fair
summary of which hands matter and a poor one of where the line falls.

## 15. Estimated figures, and how far to trust them

Most of this page is exact. The equity against two or more opponents is not,
because counting every way to deal sixteen cards and a board is out of reach.
Those figures come from simulation, and a simulation without an error bar is
an opinion.

The error of an average falls as one over the square root of the number of
trials:

```
standard error = √( variance / trials )
```

which is why quadrupling the work only halves the error. At 400,000 trials per
figure the standard error here is at most **0.08 percentage points**, and the
true value lies within about two of those, 95% of the time.

That is the theory. The check is that it actually happens:

| Trials | Error against the exact answer | Error the run claimed |
| --- | --- | --- |
| 25,000 | 0.3031 pp | 0.3032 pp |
| 100,000 | 0.1662 pp | 0.1516 pp |
| 400,000 | 0.0757 pp | 0.0758 pp |

Quadrupling the trials cut the error by 1.82 and then 2.20 times, against the
2.00 predicted. And at every size, **the error the runs actually have matches
the error they report**, within 10%. That was measured against the exact
one-opponent figures from the matrix — the truth, not another simulation.

## 16. Two things that surprise people

### 16.1 Your own cards change your opponent's odds

Cards you cannot see do not change anything: an opponent's unseen hand is as
unknown to you as the deck. But cards you *can* see do, including your own.

Holding AA, there is exactly **one** way left for an opponent to also hold
aces — one combination out of the 1,225 available to them, instead of 6 out of
1,326. Your two aces removed five of the six. That is why the all-in tool above
works out how often somebody folds from the actual count of hands they could
hold given yours, rather than from a fixed percentage: holding AA they fold a
top-5% range 95.5102% of the time, and holding 72o, 94.3673%.

This is also why an all-in preflop is not decided by the two cards. The hands
are turned face up and **the whole board is still dealt** — flop, turn and
river — and the best five of seven wins. The only way to win without a board is
for everybody to fold.

### 16.2 Unequal stacks make more than one pot

Every figure on this page assumes both players have the same stack. When they
do not, a hand can create **side pots**, and the rule is that you can only win
from each opponent as much as you yourself put in.

Three players go all-in: A has 20,000, B has 11,000, C has 20,000.

- **Main pot:** everybody can cover 11,000, so 3 × 11,000 = **33,000**, and
  all three play for it.
- **Side pot:** A and C each have 9,000 left over, so 2 × 9,000 = **18,000**,
  and only A and C can win it. B cannot: B never put in enough.

If B has the best hand, B wins 33,000 and the better of A and C takes the
18,000. Nothing on this page models that — the all-in tool assumes equal
stacks — but the arithmetic above is all of it.

## 17. What this does not model

Stating this plainly matters more than any figure above, because every number
here is the right answer to a narrower question than "how should I play".

- **No betting.** Hands here go to showdown. Real poker is mostly about
  getting opponents to fold, which nothing here measures.
- **No position.** Acting last is worth a great deal and is invisible here.
- **No postflop play.** A hand that plays well after the flop is worth more
  than its preflop equity; one that does not, less. That is most of the
  argument for suited connectors, and this page cannot make it.
- **No unequal stacks, so no side pots** (section 16.2), and no antes.
- **No opponent who reacts.** In the all-in tool the opponent's range is a
  fixed input. That matters: at 10 big blinds against somebody calling the top
  20%, *every one of the 169 hands* is a profitable shove, 32o included. That
  is the correct answer to the question asked, and it is not advice — a real
  opponent who noticed would call far wider and most of those shoves would stop
  working. Finding ranges that are stable against each other is a game-theory
  problem this page does not solve.
- **No tournament prize structure.** A chip is worth a chip here; in a
  tournament it is not.
- **The ranking is a choice.** Ordering hands by equity against a random hand
  is defensible and computed, but it is not how strong players rank hands
  (section 13).

## 18. Where the numbers came from, and how to check them

Every figure on this page is produced by an engine built for it:
[**holdem-preflop-equity**](https://github.com/dafmontenegro/holdem-preflop-equity).
It rebuilds every table from nothing with one command, validates each one
before writing it, and **refuses to publish a table that failed its own
check**. Among those checks:

- The nine hand categories must reproduce the published seven-card hand
  counts, all nine, with no remainder (section 7).
- The evaluator must produce exactly 7,462 distinct five-card hand values.
- The head-to-head matrix must be its own mirror, and must average to exactly
  one half — checked as an equality between two integers.
- The distribution of "how many opponents beat you" is computed exactly for up
  to four opponents by inclusion-exclusion, and separately by brute force,
  walking every deal one at a time. The two agree.
- Seven matchups are counted again by an independent evaluator written by
  other people.

### The data

Everything this page draws is published, and documented field by field:

- [**hands.json**](https://github.com/dafmontenegro/holdem-preflop-equity/blob/master/web/hands.json)
  — one record per starting hand: equity against 1 to 8 opponents and against
  every range, the nine potential categories, the four-way split of what your
  cards add, and the distribution against all 1,225 opponent hands.
- [**headsup-matrix.json**](https://github.com/dafmontenegro/holdem-preflop-equity/blob/master/web/headsup-matrix.json)
  — the exact 169 × 169 matrix, as wins and ties. All 28,561 cells.
- [**DATA_DICTIONARY.md**](https://github.com/dafmontenegro/holdem-preflop-equity/blob/master/web/DATA_DICTIONARY.md)
  — what every field means, and for each one whether it is exact or estimated.

Probabilities in those files are integers in ten-thousandths: divide by 10,000.
The rounding is bounded by half a ten-thousandth, which is finer than anything
shown here and finer than the simulation's own error.

The fuller tables the engine writes — wide CSVs with the raw integer counts
rather than rounded probabilities — are not committed, because they are
generated and large. `make` rebuilds all of them in about twenty minutes.

If you think a number on this page is wrong, those files are where to start,
and if you are right it is a bug worth reporting.
