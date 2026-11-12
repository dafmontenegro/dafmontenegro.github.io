---
title: "Kuantan: Generative Paper Marbling"
description: "Twelve designs of marbled paper drawn live in WebGL, each a real marbling technique, in twenty-two vivid palettes: the patterns and colors that calm me."
summary: "Marbled paper that never dries: twelve designs, each a real marbling technique, drawn live in the browser in twenty-two vivid palettes, flowing slowly and never repeating. The patterns and colors I love most, and the ones that calm me."
date: 2026-11-11
lastmod: 2026-11-11
featureAlt: "Fine bands of yellow, black, cyan and pink paint curled into eddies, in the Marble design of Kuantan"
coverAlt: "Fine bands of yellow, black, cyan and pink paint curled into eddies, in the Marble design of Kuantan"
coverCaption: "Marble, in the David palette"
thumbnailAlt: "Kuantan, generative paper marbling"
categories: ["art", "software"]
palettes:
  - name: "Endpaper"
    image: "img/palettes/01-endpaper.jpg"
    about: "Turquoise, carmine, cream and a thread of gold: the colors of old marbled endpapers, and the ones it all started with"
  - name: "Red, black, white"
    image: "img/palettes/02-red-black-white.jpg"
    about: "My favorite combination, never the prettiest and always the strongest. Red is my color"
  - name: "Sukuna"
    image: "img/palettes/03-sukuna.jpg"
    about: "Near black, blood reds, bone and a sliver of gold, from *Jujutsu Kaisen*"
  - name: "Gojo"
    image: "img/palettes/04-gojo.jpg"
    about: "Night blue, violet, cyan and a flash of pink: his Hollow Purple"
  - name: "Nanami"
    image: "img/palettes/05-nanami.jpg"
    about: "Navy and cobalt with a touch of gold, for the man the page is named for"
  - name: "David"
    image: "img/palettes/06-david.jpg"
    about: "The yellow and black of his jacket, with cyan and pink neon, from *Cyberpunk: Edgerunners*"
  - name: "Lucy"
    image: "img/palettes/07-lucy.jpg"
    about: "Violet and cyan, her hair and the Moon she dreamed of"
  - name: "Night City"
    image: "img/palettes/08-night-city.jpg"
    about: "Neon pink, cyan and yellow on a deep purple night"
  - name: "Lofi"
    image: "img/palettes/09-lofi.jpg"
    about: "Soft pink, peach, lavender and butter yellow, like the lofi cities I keep on in the background"
  - name: "Pixel sunset"
    image: "img/palettes/10-pixel-sunset.jpg"
    about: "Red, orange and yellow over purple, a pixel-art city at dusk"
  - name: "Bauhaus"
    image: "img/palettes/11-bauhaus.jpg"
    about: "Red, blue and yellow with black and cream: the primaries, plainly"
  - name: "Pop"
    image: "img/palettes/12-pop.jpg"
    about: "Red, pink, green and yellow, loud on purpose"
  - name: "Klein and gold"
    image: "img/palettes/13-klein-and-gold.jpg"
    about: "Yves Klein's blue with a little gold and cream"
  - name: "Rosa mexicano"
    image: "img/palettes/14-rosa-mexicano.jpg"
    about: "Mexican pink with orange, yellow and turquoise"
  - name: "Tropical"
    image: "img/palettes/15-tropical.jpg"
    about: "Coral red, teal, amber and orange on deep indigo"
  - name: "Matisse"
    image: "img/palettes/16-matisse.jpg"
    about: "Cobalt, coral, yellow and mint on cream, like his paper cut-outs"
  - name: "Ottoman"
    image: "img/palettes/17-ottoman.jpg"
    about: "Lapis, ochre, rose madder, green and cream, the colors of old ebru"
  - name: "Sumi"
    image: "img/palettes/18-sumi.jpg"
    about: "Black and indigo ink on rice paper, with one red ring like a seal"
  - name: "Peacock"
    image: "img/palettes/19-peacock.jpg"
    about: "Emerald, sapphire, gold and violet"
  - name: "Victorian"
    image: "img/palettes/20-victorian.jpg"
    about: "Burgundy, gold, navy, green and cream, the papers inside nineteenth-century books"
  - name: "Carnival"
    image: "img/palettes/21-carnival.jpg"
    about: "Magenta, orange, teal, yellow and violet"
  - name: "Red and cream"
    image: "img/palettes/22-red-and-cream.jpg"
    about: "Reds from carmine to almost black, on cream"
tags: ["generative-art", "marbling", "ebru", "suminagashi", "webgl", "glsl", "shaders", "javascript", "color"]
---
**Kuantan** is marbled paper that never dries. Paint floats on a bath, a comb is drawn through it, a stylus stirs it, and the pattern keeps moving, slowly, without ever repeating. I made it because these designs, patterns and colors are some of the things I love most, and watching them calms me. It runs full screen on my second monitor when I am not using it.

[**Open Kuantan**](/kuantan/) | [**The designs**](#the-designs) | [**The palettes**](#the-palettes) | [**How it is made**](#how-it-is-made)

It starts on a design and a palette at random. Every few minutes the design changes, and within a design the palette changes now and then while the pattern keeps flowing. The arrow keys change the design (left, right) and the palette (up, down), the space bar holds the rotation, and **F** goes full screen; on a phone, a tap changes the design.

## Why "Kuantan"

All Nanami Kento wanted was peace: to go to Kuantan, in Malaysia, rest by the sea and read. [My post about him](/blog/nanami-kento/) ends hoping that he finally got his beach. This is mine: a place to rest my eyes.

## The Designs

Each design is a real marbling technique, or, in Marble's case, the bath simply stirred. In a tray, the marbler lays the paint on water and draws tools through it, one stroke after another. Here every pixel asks the opposite question: **where did my paint come from?** It undoes the strokes in reverse order, last one first, and reads the color that was laid there before anything moved. That idea, and the formulas for each stroke, come from Aubrey Jaffer's mathematical marbling (see [References](#references)).

### Combed

![Combed, in the Endpaper palette: bands of turquoise, carmine and cream pulled up into flames](img/designs/01-combed.jpg "Combed · Endpaper")

The first one, and the one that started everything. Bands of paint, a comb pulled up through them with uneven pressure, and one wavy stroke across. The flames are the comb's tines: paint right by a tine travels far, paint between them barely moves.

### Stones

![Stones, in the Lucy palette: flat stones of violet, cyan, pink and night blue, each with the faint rings of its drop, and pale veins between them](img/designs/02-stones.jpg "Stones · Lucy")

The oldest Turkish style, *battal* ebru: drops of paint, each its own size, that crowd each other into stones. The paint stays flat, as it does on the bath; inside each stone the faint rings of the drop that made it still show, and a thin vein of the bath runs between neighbours.

### Ink Rings

![Ink Rings, in the Sumi palette: rings of black, indigo and vermilion ink on rice paper](img/designs/03-ink-rings.jpg "Ink Rings · Sumi")

*Suminagashi*, "floating ink", the Japanese way: ink touched to water again and again at a few points, spreading in rings. Every new drop pushes the older ink outward while keeping its area, so the older rings thin as they travel, and where two drops meet, their rings press against each other.

### Nonpareil

![Nonpareil, in the Victorian palette: many thin bands of burgundy, gold, navy, green and cream combed into small scallops](img/designs/04-nonpareil.jpg "Nonpareil · Victorian")

"Without equal", the classic paper of nineteenth-century bookbinding: many thin bands, combed with a fine comb, then rocked by a gentle wave.

### Chevrons

![Chevrons, in the Night City palette: upright bands of neon pink, cyan, yellow and purple folded into zigzags](img/designs/05-chevrons.jpg "Chevrons · Night City")

*Gel-git*, "come and go" in Turkish: upright bands combed one way and then back, into zigzags.

### Bouquet

![Bouquet, in the Carnival palette: fine bands of magenta, orange, teal and yellow drawn into plumes](img/designs/06-bouquet.jpg "Bouquet · Carnival")

A nonpareil with a wide comb drawn through it in waves, which gathers the fine bands into plumes.

### Swirls

![Swirls, in the Pop palette: fine bands of red, pink, green, yellow and black wound around a slow vortex](img/designs/07-swirls.jpg "Swirls · Pop")

A few slow stirs with a stylus: each one winds the bands around a point and, minutes later, unwinds them.

### Feathers

![Feathers, in the Red, black, white palette: fine red, black and white bands drawn up and down into feathers](img/designs/08-feathers.jpg "Feathers · Red, black, white")

A nonpareil, and then a wide comb whose tines go up and down by turns: each tine drags the fine bands into a feather. The pull fades to nothing halfway between two tines, so the paper never tears.

### Spiral

![Spiral, in the Gojo palette: bands of night blue, violet, cyan and pink wound into one large spiral](img/designs/09-spiral.jpg "Spiral · Gojo")

One large stir that slowly winds the whole bath around a point that drifts.

### Waves

![Waves, in the Nanami palette: bands of navy, cobalt, cyan and a thread of gold rolled by crossing waves](img/designs/10-waves.jpg "Waves · Nanami")

Bands rolled by two slow waves that cross each other, the way the Turkish *şal* (shawl) papers ripple.

### Drops

![Drops, in the Rosa mexicano palette: drops of pink, orange, yellow and turquoise opening in rings over combed bands](img/designs/11-drops.jpg "Drops · Rosa mexicano")

Drops fallen on combed bands, as in *hatip* ebru: each one opens in rings and pushes the bands aside around it.

### Marble

![Marble, in the David palette: fine bands of yellow, black, cyan and pink curled into eddies of every size](img/designs/12-marble.jpg "Marble · David")

Paint stirred freely instead of combed: eddies of every size, each turning its own way, wind the fine bands around themselves and into each other. The one I would keep on if I could keep only one.

## The Palettes

Any design can take any palette. A palette is the paint in the bath, in the order it is laid down, each color with its share; changing it only changes the colors, never the pattern under them. Each preview below is the same design, Marble.

{{< palettes >}}

## How It Is Made

It is one page and one script of about 20 KB, with no libraries: a WebGL fragment shader that paints every pixel of the screen, every frame.

- **Undoing the strokes.** A comb's tine moves the paint near it by `L · λ / (d + λ)`, where `d` is the distance to the tine: a lot right by it, almost nothing far away. A drop of radius `r` pushes the paint around it outward while keeping its area: a point at distance `ρ` from its center came from `ρ · √(1 − r²/ρ²)`. Each design is a short sequence of these, undone in reverse.
- **The bath's current.** Under every design, a slow current of noise (a warp of the coordinates by layered noise, itself warped) keeps the paint drifting, so no two minutes look the same.
- **Threads.** Real paint laid in several passes leaves thin light lines along each band. In the designs with wide bands, three such threads run inside every turn of the palette, exactly along the band, so a wide band never reads as flat color.
- **Clean edges.** Each pixel averages four samples across its width. Where the bands get finer than a pixel, they blend into the palette's average color instead of shimmering; where the pattern jumps, at the edge of a drop, the edge stays crisp.
- **Changing colors without changing the pattern.** Two canvases take turns: the new palette is painted on the same bath, at the same moment, and fades in over the old one.
- **Gentle on the machine.** It draws at most about a million pixels and lets the browser scale them up, which suits something this soft; it stops when the page is not visible, and slows down for anyone who asks the system for reduced motion.

## References

- Aubrey Jaffer, [Mathematical Marbling](http://people.csail.mit.edu/jaffer/Marbling/How-To): the strokes of real marbling as formulas, and the idea of undoing them.
- Amanda Ghassaei, [Digital Marbling](https://blog.amandaghassaei.com/2022/10/25/digital-marbling/): marbling as a simulation, beautifully explained.
- [Paint Toys: Marbling](https://paint.toys/marbling/about): marbling to play with in the browser.
