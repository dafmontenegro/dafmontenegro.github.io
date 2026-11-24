---
title: "Phenotype: Any Face as a Paper Doll"
description: "Give it a photo and it draws that face as a paper cut-out doll you can dress and save. Give it two, and it draws the doll that is their child."
summary: "Give it a photo of a face and it draws that face as a paper cut-out doll you can dress and save. Give it two faces and it draws the doll that is their child, with half of the features of each. Everything is measured and drawn in your own browser, and no photo ever leaves your device. This page explains every step and every number behind it."
date: 2026-11-24
lastmod: 2026-11-24
featureAlt: "A small pale robot with a red bulb on its head, the doll that is nobody yet, among paper cut-out dolls read from faces"
coverAlt: "A small pale robot with a red bulb on its head, the doll that is nobody yet, among paper cut-out dolls read from faces"
coverCaption: "A doll that is nobody yet, and dolls read from faces of nobody"
thumbnailAlt: "Phenotype, any face as a paper doll"
categories: ["art", "software"]
tags: ["generative-art", "computer-vision", "mediapipe", "avatars", "cut-out-animation", "caricature", "privacy", "javascript"]
phenotype: true
---

Give this page a photo of a face and it draws that face as **a paper doll**: a big head on a small body, cut out of flat coloured paper. Yours, a friend's, anyone's. Then dress it: glasses, a beard, a crown, a coat or a suit, a paper of another colour behind it. Save it as a picture, or send it to someone.

{{< phenotype sample="AQAAtn-Okr7ikXen8C_D8qBuVUy7h1cAAIA-AKGCo0iBhNmNkr2Yjw" wear="glasses=round,beard=0.9,outfit=suit,coat=#8a8676,tie=#8c1c2c" paper="night" >}}

It all happens in your browser. The photo is not uploaded anywhere: the page looks at it, draws the doll and forgets it.

These dolls were read from photos of faces that belong to nobody, made by a model:

{{< phenotype-specimens >}}

## Two faces, one doll

Now give it **two faces**. It draws the doll that is their child: **half of the features of each**. Maybe the eyes, the nose and the hair of one, and the face shape, the eyebrows and the mouth of the other. If you made your doll above, it is already in the first place. Mix again, and you meet a sibling.

{{< phenotype part="mix" >}}

A phenotype is what can be seen of a living thing: the colour of its eyes, the shape of its nose. That is all this project works with. It never knows who you are. It only looks at what shows, and draws it.

This is a **draft of a research project**, written as I build it. Everything below is how it works, step by step, with the reason for every number. Where something does not work well, it says so.

## What happens to your photo

**It never leaves your device.** There is no server behind this page: no account, no upload, no database. The photo is opened by your browser, measured by your browser, and dropped. You can check it: open the page, turn the network off, and it still works after the first photo.

**Nothing is kept either.** Not the photo, and not the doll: save it as a picture, or it is gone when you close the page. While the page is open, a doll is **40 bytes**: 37 small numbers and a count of generations. Those numbers describe a drawing ("eyes a bit larger than most, fringe over half the forehead"). They cannot be turned back into your photo, and they are too coarse to recognise a person.

## The steps

1. **Open the photo.** Any image your browser can read. It is turned upright if the phone saved it sideways, and shrunk to 1600 pixels on its longer side.
2. **Find the face.** MediaPipe's Face Landmarker marks 478 points on it.
3. **Crop it upright.** A square around the face, turned so the eyes are level.
4. **Find the hair.** A second small model marks which pixels are hair.
5. **Measure.** 18 proportions from the points, 7 numbers about the hair, 4 colours, how much beard, and what is worn: glasses and the hairstyle.
6. **Compare with other faces.** Each proportion becomes "how far from most people".
7. **Write the genome.** 37 numbers, one byte each.
8. **Inherit.** Two faces give one doll: three feature groups from each.
9. **Draw.** The genome becomes a doll cut out of paper.

Each one in detail:

### 1 to 4. Reading the face

The reading is done by [MediaPipe](https://ai.google.dev/edge/mediapipe/solutions/guide), Google's open library for this kind of task, running as WebAssembly in the browser. I serve it from this site, pinned to version 1.2.0, so nothing is fetched from anyone else. It only loads when you give the first photo: about **8 MB**, once.

- The **Face Landmarker** (3.8 MB) returns 478 points per face, each with a position and a depth. If there are several faces, the largest is used.
- The search is forgiving, because the photos are whatever people have at hand. If no face is found, it tries again with a border around the photo (for faces that fill the frame), then smaller, then turned by 90, 270 and 180 degrees. Only a photo with no face at all is refused.
- The crop follows the recipe of the [FFHQ dataset](https://github.com/NVlabs/ffhq-dataset): a square set by the eyes and the mouth, widened 1.5 times here so the hair fits, at 512 pixels.
- The **hair segmenter** (0.8 MB) labels each pixel of that crop as hair or not.

On this Mac, in Chrome without a graphics card (the same conditions as the tests), a photo takes about **70 ms** once the reader is loaded: 40 to find the face, 22 for the hair, 8 to measure. A phone is slower, but this is not heavy work.

### 5. Measuring

Before measuring anything, **the face is turned to look straight ahead**. A width measured on a face seen from the side is not that face's width. Each point has a depth, so three of them fix the head's own axes: the outer corners of the eyes give "across", forehead and chin give "down", and their cross product gives "out of the face". Written in those axes, the points no longer depend on how the head was turned.

Does it work? I measured 400 faces and looked at how much each proportion still followed the head's pose. The lower the number, the better:

| Average correlation of the 18 proportions with | As the camera saw it | Turned to frontal |
| --- | --- | --- |
| How far the head is turned sideways | 0.21 | **0.15** |
| How far it is nodded up or down | 0.36 | **0.22** |

So it helps, and it is not perfect: the depth MediaPipe estimates from one photo is approximate. Face length was the worst case, 0.70 with the sideways turn, and it dropped to 0.08. The height of the eyes still follows the nod (0.65). When a face is turned more than 25 degrees, the page says so and suggests a photo looking at the camera.

Every length is divided by the face's own width or height, so it does not matter how large the face is in the photo. The 18 proportions:

| Group | What is measured |
| --- | --- |
| Face | Height over width; jaw width; chin width; chin length |
| Eyes | Distance between them; size; how open; tilt; how high on the face |
| Eyebrows | Distance to the eye; tilt; thickness |
| Nose | Length; width |
| Mouth | Width; distance to the nose; fullness of the lips; smile |

**Hair** comes from the hair pixels: how far it rises above the forehead, how much there is beside the face, where it ends, how much of the forehead it covers, and which side has more (the parting).

**Colours** are read in [OKLab](https://bottosson.github.io/posts/oklab/), a colour space where the midpoint of two colours is the colour the eye expects.

- **Skin:** 14 small patches on cheeks, forehead, nose and chin, with hair pixels left out. I do not take the average. I order the pixels from dark to light and take the one that 60 % stay under. What we call "the colour of someone's skin" is its lit part, not the average with the shadow under the cheekbone or the rim of the glasses. At 70 % the shine on dark skin was taken for its colour; at the median, the shadow of sunglasses was.
- **Eyes:** the ring between the pupil and the rim of the iris, both eyes, without the eyelids, read the same way at 65 %.
- **Hair:** the median of the hair pixels away from the mask's edge.
- **Lips:** the median inside the lower lip.

**A dark photo is lifted first.** A dark skin and a dark photo give the same pixels on the cheek, but not in the whites of the eyes: on a well-exposed face, something is nearly white. So I take the lightness that only 3 % of the face's pixels exceed as the photo's "white". If it falls short, every colour is scaled up until it gets there, by 1.5 times at most.

**The beard** is read as a colour too: how far the upper lip and the front of the chin have moved from the colour of the forehead toward the colour of the hair. I first read it along the jaw, and the highest scores went to people standing in shade, because the jaw is in shadow on most photos. The upper lip and the chin face the light. On my twelve photos it reads 0.57 to 1; on the synthetic faces without a beard, 0.46 at most. The line is at 0.5.

Colours from a photo still carry some of its light, so each is pulled into the range where it reads right in a drawing: skin stays in the narrow wedge of hues that skin has, hair is never pure black (its shadow must still show), and an iris is lightened, because in a photo it is small and dark.

### 6. Comparing with other faces

A number like "eyes are 0.19 of the face's width" says nothing alone. It matters only against other faces. So each proportion becomes a **z-score**: how many standard deviations it sits from the average.

For that I needed many faces, and I did not want to use anyone's. The statistics are measured on **400 synthetic faces**: faces of nobody, drawn by a generative model ([DiffAE](https://github.com/phizaz/diffae), trained on FFHQ). They went through exactly the code that reads your photo, in a real browser, so the statistics cannot drift from what the page computes. Of the 400, the 231 within 15 degrees of frontal set the averages.

The limit is honest: a model trained on FFHQ reproduces FFHQ's population, which is not the world's. A face far from that population gets larger z-scores than it should.

### 7. The genome

| Kind | How many | What it holds |
| --- | --- | --- |
| Relative genes | 20 | A z-score, clamped to ±3: "like most people" is the middle |
| Absolute genes | 5 | A measurement on a fixed scale: hair length, fringe, parting, amount of hair, and the bulb |
| Colours | 4 | Eyes, hair, skin, lips: three numbers each |

That is 37 numbers, one byte each. With a version byte and two bytes for the generation, **40 bytes**, which fit in **54 characters** of text. The dolls of nobody on this page are written that way in its source.

The **bulb** is the one gene no photo has. It belongs to the small robot that keeps the child's place until there are two faces.

**What you wear is not in the genome.** Glasses, a beard and a hairstyle are drawn on your own portrait and stay with you: a child never inherits them. The page reads them from the photo as a first guess, and the wardrobe lets you change every one:

- **The beard** is how far the lower face has moved from the colour of the skin toward the colour of the hair.
- **Glasses** are a line under each eye. A thick frame is a strong line, and its colour is read too. A wire frame is too faint for that, so it is looked for as a ridge: a pixel lighter or darker than both the pixel above and the one below, which a thin line is and the edge of a shadow is not. Dark lenses are an eye socket much darker than the cheek.
- **A receding hairline** is a head that stays bare well above the forehead, with little hair in all.
- **Curls** are long hair whose inside alternates light and shadow.

I set those rules on 49 faces whose answer I could see: 17 photos of real people and 32 synthetic faces. On those same faces, glasses come out right on 48 (one tinted wire frame is missed, and nobody without glasses is given a pair) and the hairline on all 49. That says the rules fit these faces, not how often they are right in general. Curls are the weakest: they rest on one real face, and a headscarf and one head of long straight hair were taken for curls.

The rest of the wardrobe is a choice, not a reading: the coat, the paper, what sits on the head, lashes, lipstick, blush, freckles and earrings. The skin tone is read, but you can set it yourself.

### 8. Inheriting

A family says "your eyes, his nose". A doll inherits the same way: **whole features, not averages**.

- Six groups have a shape: face, eyes, eyebrows, nose, mouth, hair. The child takes **three from one face** and **three from the other**. Colour goes with its group: the iris with the eyes, the hair colour with the hair.
- Which three is drawn at random, but the draw is seeded with both genomes. The same two faces always give the same first child, the same second one, and so on.
- **Skin and lips are not picked.** They are the midpoint between the two.

A child can be a parent in turn. Then half of it comes from the new face, and what it had from its own parents is halved: a quarter each, on average.

One lineage: a doll that is nobody, mixed with five faces in a row:

{{< phenotype-specimens dolls="AQAATcOzZpGzmYCAgIBqWWZ3gF6mgIAAAAAA_8NeZ7V9dex-fM59eA AQABTcOzZpR5X7SegIBq1m9neLhpgIAAAAAA_5qJg7V9deGEhL-Mgg AQACTcOzZl-Yo5K7gIBqnHFWMXZAgIAAAAAA_4CDjbV9ddSIjLeSig AQADTcOzZnKPlbVLgIBqe3WTfG-DgIAAAAAA_4CIi7V9ddKOjrWYig AQAETcOzZkKTqoaQgIBqe3VXTj1TgFgAAIA4AK19dmuKj9ORkbqejQ AQAFXZRjhW1EfJmogIBqe3VXTj1Tmqat9IHhAICPkWSNjNOTkr-ejg" class="phenotype-line" >}}

**The doll that is nobody** is drawn by hand, not measured from anyone. It is a small robot, a cousin of [Roz]({{< ref "projects/roz" >}}), this site's assistant: pale metal, no hair, cyan eyes and a red bulb on its head. On this page it keeps the child's place until two faces arrive.

### 9. Drawing

The doll is drawn the way cut-out animation is made: **a few flat pieces of coloured paper**, laid on top of each other. I grew up on cartoons made like that, and it suits this project: a face reduced to a handful of shapes is exactly what a genome of 37 numbers can hold.

- **Pieces.** A big head on a small body, hair, two big round eyes, eyebrows, a line for the mouth. Nothing has an outline. Each piece casts a thin shadow on the one under it, and a little paper grain lies over everything.
- **One gene, one move.** The eyes' size, their distance, how much the lid covers; the eyebrows' height, thickness and tilt; the mouth's width and curve; the head's proportions; where the hair ends, how much forehead it covers, where it parts. Hair that stands high gets a row of paper curls.
- **Exaggerate.** Each z-score is multiplied by 1.5 before it moves anything. That is what a caricaturist does: what is a little unusual in a face is drawn clearly unusual. Without it, every doll looks like the average doll.
- **Stay friendly.** After that, each is clamped to ±2.2, and most faces rest in a small smile. No face can produce a frightening doll.

It blinks every few seconds, follows your pointer or your finger with its eyes, and hops if you tap it, unless your device asks for less motion.

## What does not work yet

- **Light is still taken for skin, sometimes.** Lifting a dark photo fixes most cases, but a face half in shade, or lit by a coloured light, still gives a doll that is too dark or too pale.
- **Tinted or rimless glasses can be missed,** and a thin frame is always drawn round and golden: its shape and colour are too mixed with the skin to read. A fair or grey beard on fair skin is not seen, because it is read by its colour.
- **Hair tied back looks short.** From the front, a bun is not in the picture. The wardrobe has a row to set the hairstyle by hand: curls, tied back, receding.
- **Skin tone depends on the light.** A dim photo gives a darker skin, and a flash on a dark skin gives a lighter one: on three synthetic faces with dark skin, two came out clearly too light. I have not tested it on photos of real people with dark skin. So the wardrobe has a row of skin tones, and the choice is yours, not the camera's.
- **Hats are read as hair,** or hide it. A headscarf becomes hair of its colour; a cap can give a shaved head in the cap's colour.
- **Very short hair** is missed by the hair model. The page checks whether the top of the head is skin-coloured: if not, it draws a close crop instead of a bald head.
- **A smile changes the mouth.** A wide smile measures as a wide mouth. The doll is of the photo, not of the person.
- **Long hair is cut by the frame.** If it runs off the photo, its real length is unknown.
- **The comparison population is FFHQ's,** as said above.

## How it is tested

- **The logic** (measuring, genome, inheritance, drawing) has no browser in it and is tested alone: 13 tests, among them that turning a face by 20 degrees does not change its measurements, that a doll written as text gives back the same doll, that inheritance always takes exactly three groups, and that 300 random genomes each draw a doll, whatever they wear.
- **The page** is driven in headless Chrome at phone width with photos of faces: a photo becomes a doll, the wardrobe dresses it (every paper, glasses, hats and details), two faces give their child, with the doll made above already in the first place, "Mix again" gives a sibling, and the picture is drawn for saving.

## Licences

- [MediaPipe](https://github.com/google-ai-edge/mediapipe) Tasks Vision 1.2.0, the Face Landmarker and the hair segmenter: Apache 2.0, by Google.
- The crop follows [FFHQ](https://github.com/NVlabs/ffhq-dataset)'s alignment recipe, by NVIDIA.
- OKLab is Björn Ottosson's, in the public domain.
- The synthetic faces come from [DiffAE](https://github.com/phizaz/diffae) (MIT), by Preechakul et al.
- The doll and the code are mine, and live in [this site's repository](https://github.com/dafmontenegro/dafmontenegro.github.io).
