---
title: "Super Pony Picker: Random Name Picker"
description: "Free online random name picker: enter up to 20 names and watch an 8-bit pony race pick a winner. Fair and fun for classrooms, teams and giveaways."
summary: "A free and fair random name picker disguised as an 8-bit horse race. Enter up to 20 names, choose whether to pick the winner or the last one (1, 2 or 3 people) and watch the ponies race through turbos, stars, mud and dice rolls to the podium. Built with p5.js, the Web Crypto API and live chiptune sound, it runs entirely in your browser."
date: 2026-09-28
lastmod: 2026-09-28
featureAlt: "Seven 8-bit ponies racing mid-race past a cheering crowd in Super Pony Picker"
coverAlt: "Seven 8-bit ponies racing mid-race past a cheering crowd in Super Pony Picker"
coverCaption: "Super Pony Picker"
thumbnailAlt: "Seven 8-bit ponies racing mid-race past a cheering crowd in Super Pony Picker"
categories: ["software", "games"]
tags: ["random-name-picker", "name-picker", "random-picker", "raffle", "giveaway", "horse-race", "game", "8-bit", "pixel-art", "retro", "p5js", "javascript", "web-audio", "chiptune", "randomness"]
---
**Super Pony Picker** is a **free online random name picker** that turns every draw into a retro horse race full of mystery boxes, photo finishes and a podium at the end. Type or paste up to **20 names**, press start and let the ponies decide. It's fair, it's instant and nobody can say the draw was rigged: everyone watched the race.

[**Play fullscreen**](/apps/super-pony-picker/) | [**How it works**](#3-how-the-race-works) | [**Is it fair?**](#2-is-it-fair)

{{< super-pony-picker >}}

## 1. How to Use It

1. Choose how many ponies will run (**2 to 20**). The track, the camera and every screen adjust automatically.
2. Write the names, or use **Paste a list** to add everyone at once. Empty lanes get a **random biblical name**, so you can also race just for fun.
3. Choose **Who gets picked?**: the winner or the last one, and **how many people**: 1, 2 or 3.
4. Press **Start**, check each pony's birth stats and press **Space**, **Enter** or click to start the race.
5. When the race ends you get the podium, the last places and the picked names. Use **Copy** to share the result.

{{< alert "lightbulb" >}}
You can click on any pony in the settings to give it a **photo**. It never leaves your device, and it shows up on the podium (or in the rain, if that person finishes last).
{{< /alert >}}

## 2. Is It Fair?

Yes, and it's built to be:

- Every random number comes from your browser's **cryptographic random generator** (`crypto.getRandomValues`), not from `Math.random`.
- Each pony is born with **new random stats and new mystery boxes in every race**.
- No lane, position or name order gives any advantage, so **every name has exactly the same chance** of being picked.
- Ties at the finish line are broken by how far past the line each pony went, and at random if even that is equal.
- Names and photos **never leave your browser**. Names are only remembered locally for next time.

## 3. How the Race Works

### 3.1 The ponies

The finish line is at **100 steps**. Every pony is born with a **minimum step** (between 0 and 1) and a **maximum step** (between 1 and 2). On every turn it moves a random amount between the two. Before the start you can see a table with every pony's stats, its average step and the favorite of the race.

### 3.2 Mystery boxes

Every pony has **4 mystery boxes** in its own lane, at positions different from everyone else's (between step 8 and 93) and with **4 different types** drawn from these 6. They stay hidden as a **?** until the pony hits them:

| Box | Type | Effect |
| :-- | :--: | :-- |
| **Turbo** | Good | Steps ×2 for 2 to 4 turns |
| **Star** | Good | Jumps ahead +3 to +7 steps |
| **Mud** | Bad | Stuck for 1 to 3 turns |
| **Trip** | Bad | Falls back 2 to 6 steps |
| **Wind** | Bad | Steps ×0.5 for 2 to 4 turns |
| **Dice** | Luck | Rolled when hit: −6 to +6 steps |

A few rules make things interesting: only **one box per turn** can be triggered, a star or the dice can throw a pony **past another box** (and that box is lost), turbo and wind **don't stack**, and falling back **never re-triggers** used boxes.

### 3.3 Close race (drafting)

With **close race** turned on, ponies behind get **+20% per step** behind the leader (up to +150%) and the leader breaks the wind, moving at **70%**. In simulations of 2,000 races with 7 ponies, the gap between first and last place dropped from about 65 turns to about 8, and the favorite's win rate went from 75% to around 38%. A full race takes about **25 seconds**, and Space speeds it up ×3.

## 4. What Can You Use It For?

- **Classrooms:** pick a student to answer, present or go first.
- **Teams and meetings:** who runs the stand-up, who takes notes, who presents next.
- **Giveaways and raffles:** pick one or several winners in front of everyone.
- **Friends and family:** who pays, who drives, who chooses the movie, who washes the dishes.
- **Streams and events:** a random picker that is actually fun to watch.

## 5. Frequently Asked Questions

### Is it really random?
Yes. It uses the same cryptographic random generator that browsers use for security, and all the randomness is drawn fresh for every race.

### How many names can I enter?
From 2 to 20 per race. Lanes you leave empty get random biblical names.

### Can I pick more than one person?
Yes. Pick 1, 2 or 3 people, either from the top of the race (winners) or from the bottom (last places).

### Does it work on phones and in fullscreen?
Yes. It adapts to any screen, and you can go fullscreen with the button or the **F** key.

### Is it available in Spanish?
Yes. The game starts in **English** and you can switch to **Spanish** with the **ES** button in the settings; it remembers your choice. You can also open it directly in Spanish: [**Super Pony Picker en español**](/apps/super-pony-picker/?lang=es).

## 6. Tools and Technologies

- [**p5.js**](https://p5js.org/): drawing loop, canvas and input.
- **Web Crypto API**: fair randomness with `crypto.getRandomValues`.
- **Web Audio API**: chiptune sound effects generated live, no audio files.
- A hand-made **3×5 pixel font**, sprites drawn pixel by pixel with a 1px outline, and a NES-style 2.5D track inspired by *Excitebike*.

## 7. En español

**Super Pony Picker** es un **selector aleatorio de nombres gratis y online** con forma de carrera de caballos 8-bit. Escribe o pega hasta 20 nombres, responde **¿a quién elegimos?** (al ganador o al último) y **¿cuántas personas?** (1, 2 o 3), y deja que los ponis decidan. Es **justo**: usa el generador aleatorio criptográfico del navegador y ningún carril tiene ventaja, así que todos los nombres tienen la misma probabilidad. El juego está en inglés y en español, y se usa directamente arriba o en [**pantalla completa**](/apps/super-pony-picker/?lang=es).
