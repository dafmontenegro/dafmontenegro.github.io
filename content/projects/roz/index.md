---
title: "Roz"
description: "How Roz, the assistant that answers questions about me from this website, is designed: the idea, the search that decides what she reads, and her rules."
summary: "Roz answers questions about me in the visitor's language, from what this website publishes and a set of notes written for her, with links to where each answer comes from. This is how she is designed: the idea behind her, her architecture, the search that decides what she reads, and the rules that keep her honest."
date: 2026-10-18
lastmod: 2026-10-21
featureAlt: "Roz, a pixel-art robot with a red flower on her head, waving beside Brightbill the gosling, next to the words: Ask me about Daniel Felipe Montenegro"
coverAlt: "Roz, a pixel-art robot with a red flower on her head, waving beside Brightbill the gosling"
coverCaption: "Roz and Brightbill, drawn by hand in pixel art, after the robot of The Wild Robot."
thumbnailAlt: "Roz, a pixel-art robot, and Brightbill the gosling"
categories: ["software"]
tags: ["rag", "retrieval-augmented-generation", "llm", "embeddings", "semantic-search", "evaluation", "prompt-engineering", "conversational-ai", "javascript", "pixel-art"]
---

**Roz** is the assistant of this website. You ask her about me, in your language, and she answers from what is published here, with links to the pages her answers come from.

[**Talk to Roz**](https://roz.montenegrodanielfelipe.com)

She is named after Roz, the robot of *The Wild Robot*, who was built to complete tasks and ends up raising an orphaned gosling, Brightbill, and learning to love. That is why the gosling walks beside her on the page.

## The idea

This website holds a lot: projects, reviews, the films I love, the lines I keep from books. Nobody reads all of it, and some of the best parts are deep inside. I wanted to be able to ask it questions.

Four principles shaped every decision:

- **Only about me.** She is not a general chatbot: no code, no homework, no trivia, and she never pretends to be me.
- **Only from what is written.** Every answer comes from the site or from notes I wrote for her. If neither says it, she says she doesn't know instead of guessing.
- **Show the source.** When an answer comes from a page, she links to it, so the reader can check her and keep reading.
- **Careful with what is personal.** Some topics are not hers to tell, and for those she has one kind, consistent answer.

And one that is not a rule but matters as much: she should be pleasant to talk to. Warm, brief, and a little playful.

## Architecture

Roz works in two moments. When the site changes, an indexer reads it and prepares what she can know. When someone asks, she searches that knowledge and writes the answer from it.

{{< diagram src="architecture.svg" alt="Architecture of Roz. When the site changes, its public pages and a set of private curated notes go into an indexer, which splits, embeds and stores them as knowledge: notes, passages and vectors. On every question, the question goes to a search that finds the closest passages in that knowledge; a language model receives the rules, the notes and those passages, and streams back an answer with links." >}}

- **Two sources.** The website's public pages, exactly what any visitor can read, minus a few personal pages left out on purpose; and a file of curated notes about me, written for her in short, plain sentences, which is never published.
- **The indexer** splits each page into passages of a few paragraphs, along its headings, and turns each passage into a vector with a multilingual embedding model: a list of numbers that places texts with similar meaning close together. A passage that did not change keeps its vector, so after an edit only the edit is processed again.
- **On every question,** the question becomes a vector the same way, it is compared with every passage, and only the closest are kept. The language model then receives her rules, the notes, the list of pages she may link and those passages, nothing else, and its answer reaches the browser word by word, as it is written.

Because the embedding model is multilingual, a question in Spanish finds passages written in English, and she answers in whatever language she is asked.

The rules and the notes open every prompt unchanged, so they are cached between questions: the only new work each time is the question and its passages.

## Deciding what she reads

The search decides what the model reads, and so, more than anything else, the quality of the answer.

The first rule was the usual one: every passage above a similarity floor, up to five. It looked reasonable and wasn't. Embedding scores are crowded: almost every passage scored between 0.40 and 0.50 against any question, so the floor let five through nearly every time, and many of them had nothing to do with the question. Asked for my favorite color, she was reading about a machine learning project.

The rule now looks at the best match and keeps only what is close to it:

{{< diagram src="retrieval.svg" alt="Ten passages scored between 0.40 and 0.52 against one question. Before, the five highest were sent to the model, because all of them were above the floor. Now only the three within 0.04 of the best one are sent." caption="The same ten passages under both rules." >}}

- above a floor of 0.42;
- within 0.04 of the best passage, unless it scores 0.55 or more on its own;
- at most three from one page, so a long page cannot crowd out the rest, and five in all.

Those numbers were not guessed. I built a test bench: **63 questions**, each labelled with the pages it needs, and the same embedding model running on my laptop, whose vectors match the production ones at a cosine similarity of 0.9995. Every candidate rule was measured against it:

| | Before | After |
| --- | --- | --- |
| Needed pages found | 31 / 35 | **33 / 35** |
| Passages sent per question | 4.8 | **3.0** |
| Unrelated passages per question | 2.3 | **1.4** |

A question comparing two of my RAG projects used to receive five passages from one of them and none from the other; now it gets both. Every change to the search is measured on this bench before it ships.

## Rules that keep her honest

A language model is very good at sounding right. Most of her rules are about making sure she is.

- **Quotes are verbatim.** Quotation marks only hold words I published, in the language I wrote them. Early on she translated one of my lines into Spanish and presented it in quotes, as if I had said it that way. Now the notes mark every quote with its language, and everything else is paraphrased.
- **"I don't know" is a good answer.** When the site and the notes say nothing, she says so, and those questions show me what is worth writing down next.
- **Some questions have a set answer.** Questions about herself, about what is private, or attempts to make her break her rules each have a defined reply, so her tone never depends on the luck of one generation. Even those are written to vary in their wording.
- **Language is ambiguous.** In Spanish, *querer* means both *to want* and *to love*, and "¿qué es lo que más quiere?" was answered as the second when it meant the first. The two now have separate rules. Real conversations find cases like this one that testing never does.

## Talking to her

The page is part of the design too. Roz and Brightbill are drawn by hand in pixel art, in a light and a dark version. Answers appear as they are written. Each one ends with two suggested questions to keep the conversation going, and can be rated, copied or shared. The interface speaks Spanish or English, following the visitor.

Around her there are the protections any public assistant needs: a check that the visitor is a person, and limits on how many questions one visitor can ask, so that a script cannot take her away from everyone else. Every release of Roz has a version number, and every answer is recorded with the version that wrote it, so when an answer is wrong I know which version of her said it and whether the fix is already out. What she records is described in the [privacy policy](/privacy/#roz-the-sites-assistant).

## What comes next

- **An answer-level bench**, like the one built for the search, so changes to her rules are measured on dozens of questions instead of a handful.
- **A guided tour** of the site, for visitors who don't know what to ask.

If you want to see how she answers, she is one click away: [**ask her anything about me**](https://roz.montenegrodanielfelipe.com).
