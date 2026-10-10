/* The carp that climbs the waterfall, and the Poké Ball of the homepage.

   On every page long enough to scroll except the homepage, a shiny Magikarp comes out at
   the foot of the screen's right edge, a waterfall pours down from a torii at its head,
   and the carp climbs the fall as the page is read: its height is how far down the page
   the reader is, and the golden trail behind it is the stretch already climbed. At the
   end of the page it reaches the gate and evolves into a Gyarados, the way the old story
   has the carp that leaps the falls become a dragon; the dragon then rises into the
   clouds. Scrolling back up brings the carp out again. Nothing but the scroll starts it.

   The homepage has a Poké Ball instead, beside the photo's Caesar's Window badge, which
   is a second way to press it: each press releases a Pokémon from assets/js/pokemon.js,
   which is only fetched then.

   This file also holds what the Pokémon share with the carp: the text box the games speak
   through, and the drawing of small pixel art (the torii, clouds, sparkles).

   Written to cost as little as possible on a phone:
   - Nothing runs on its own. The scroll handler is passive and batched to one update per
     animation frame, and the frame only writes: the page is measured when its size
     changes, never while it scrolls, so a frame never forces a layout.
   - Everything that moves does so by `transform` or `opacity`, which the browser
     composites without repainting the page, and classes change only when the state does.
   - Where the climb runs over the text, it hides once the page stops moving and is taken
     out of rendering, so its animated sprite stops playing.

   The carp is the animated shiny Magikarp of Pokémon Black and White; the dragon, the
   shiny Gyarados of Pokémon SoulSilver, the one of the Lake of Rage. Both are served from
   assets/img/koi/. The drawing is in assets/css/koi.css. */

(function () {
  "use strict";

  var NS = "http://www.w3.org/2000/svg";
  var PX = 2; // CSS px per pixel of the hand-drawn art
  var BALL = 40; // px, the homepage's ball at the edge of a wide screen
  var BALL_NARROW = 48; // px, on a narrow one: the size of Congo's scroll-to-top button,
  // and the smallest target a finger can press comfortably
  var EDGE = 12; // px between the ball, or the climb's line, and the right edge
  var BOTTOM = 40; // px from the bottom of the screen to Congo's scroll-to-top button
  var BOTTOM_WIDE = 16; // px from the bottom of a wide screen to the homepage's ball
  /* The climb is framed evenly: the gate stands as far from the head of the screen as the
     foot of the fall from its foot. */
  var MARGIN = 24;
  var GATE_TOP_NARROW = 84; // on a narrow screen the gate stands under the header instead
  var FOOT_NARROW = 96; // and the fall ends above the scroll-to-top button
  var CARP_REACH = 26; // px from the tilted carp's centre to its lowest pixel, as measured
  var MIN_SCROLL = 0.5; // pages scrolling less than this share of a screen get no climb
  var EVOLVE_AT = 0.995; // share of the page read that counts as reaching the gate
  var REBIRTH_BELOW = 0.9; // after the dragon has gone, scrolling back under this share
  var BIRTH_MS = 650; // the carp coming out and the waterfall pouring
  var SWIM_MS = 220; // ms after the last scroll the fish stops swimming
  var REST_MS = 1800; // ms after that before the climb hides, on a narrow screen
  var TYPE_MS = 28; // ms per letter in the text box
  var HOLD_MS = 1100; // ms a line stays once it is typed out
  /* The in-game evolution: both forms as silhouettes, swapped faster and faster until the
     new one holds. Each number is how long one form stays before the swap. */
  var FLICKER = [340, 300, 260, 220, 190, 160, 135, 115, 95, 80, 66, 55, 46, 40, 36, 32];
  /* What happens after the dragon holds, in ms from that moment: the trail drains, clouds
     gather, the dragon rises into them, and the stage is cleared. */
  var DRAIN_AT = 900;
  var CLOUDS_AT = 2200;
  var ASCEND_AT = 3000;
  var GONE_AT = 4800;

  /* The art, one string per row of pixels and one letter per colour; "." is empty. */
  var TORII = [
    "k..............k",
    "kkkkkkkkkkkkkkkk",
    ".kkkkkkkkkkkkkk.",
    "..rrrrrrrrrrrr..",
    "....rr.yy.rr....",
    ".rrrrrrrrrrrrrr.",
    ".dddddddddddddd.",
    "....rr....rr....",
    "....rr....rr....",
    "....rd....rd....",
    "....rd....rd....",
    "....rd....rd....",
    "...kkkk..kkkk..."
  ];
  var TORII_COLOURS = { k: "var(--koi-ink)", r: "#e0402a", d: "#a8281a", y: "#f2c14e" };
  /* Outlined, so a white cloud still shows on the light theme's white page. */
  var CLOUD = [
    ".....oooo.......",
    "...oowwwwoo.oo..",
    "..owwwwwwwwowwo.",
    ".owwwwwwwwwwwwwo",
    "owwwwwwwwwwwwwwo",
    "owwwwwwwwwwwwwwo",
    ".oggwwwwwwgggggo",
    "..oggggggggggoo.",
    "...oooooooooo..."
  ];
  var CLOUD_COLOURS = { w: "#ffffff", g: "#c7d2fe", o: "#94a3b8" };
  var SPARKLE = ["..y..", "..y..", "yywyy", "..y..", "..y.."];
  var SPARKLE_COLOURS = { y: "#ffd34d", w: "#ffffff" };

  var config = document.getElementById("koi-sprites");
  if (!config) return;
  var sprites;
  try {
    sprites = JSON.parse(config.textContent);
  } catch (e) {
    return;
  }

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  var root = document.documentElement;

  /* ---------------------------------------------------------------------------------
     Pixel art: each row is drawn as runs of one colour, so a drawing costs a handful of
     rectangles rather than one per pixel. */

  function pixelMarkup(rows, colours) {
    var out = "";
    rows.forEach(function (row, y) {
      for (var x = 0; x < row.length; ) {
        var c = row[x];
        var run = 1;
        while (x + run < row.length && row[x + run] === c) run++;
        if (c !== ".") {
          out += '<rect x="' + x + '" y="' + y + '" width="' + run + '" height="1" fill="' + colours[c] + '"/>';
        }
        x += run;
      }
    });
    return out;
  }

  function pixels(rows, colours, className, size) {
    var svg = document.createElementNS(NS, "svg");
    var w = rows[0].length;
    var h = rows.length;
    svg.setAttribute("viewBox", "0 0 " + w + " " + h);
    svg.setAttribute("width", w * (size || PX));
    svg.setAttribute("height", h * (size || PX));
    svg.setAttribute("shape-rendering", "crispEdges");
    svg.setAttribute("aria-hidden", "true");
    if (className) svg.setAttribute("class", className);
    svg.innerHTML = pixelMarkup(rows, colours);
    return svg;
  }

  /* ---------------------------------------------------------------------------------
     The text box. What it says is queued, typed out letter by letter as in the games,
     and read whole to assistive technology, which is never given a word letter by letter. */

  var box, boxShown, boxLive;
  var queue = Promise.resolve();
  var pending = 0;

  function buildBox() {
    box = document.createElement("div");
    box.className = "koi-box";
    boxShown = document.createElement("span");
    boxShown.className = "koi-box-text";
    boxShown.setAttribute("aria-hidden", "true");
    boxLive = document.createElement("span");
    boxLive.className = "koi-box-live";
    boxLive.setAttribute("role", "status");
    box.appendChild(boxShown);
    box.appendChild(boxLive);
    document.body.appendChild(box);
  }

  function say(lines) {
    pending++;
    queue = queue
      .then(function () {
        var chain = Promise.resolve();
        lines.forEach(function (line) {
          chain = chain.then(function () {
            return type(line);
          });
        });
        return chain;
      })
      .then(function () {
        pending--;
        if (!pending) box.classList.remove("is-open");
      });
    return queue;
  }

  function type(line) {
    if (!box) buildBox();
    box.classList.add("is-open");
    boxLive.textContent = line;
    return new Promise(function (resolve) {
      if (reduced.matches) {
        boxShown.textContent = line;
        setTimeout(resolve, HOLD_MS + line.length * TYPE_MS);
        return;
      }
      var i = 0;
      (function next() {
        boxShown.textContent = line.slice(0, ++i);
        if (i < line.length) setTimeout(next, TYPE_MS);
        else setTimeout(resolve, HOLD_MS);
      })();
    });
  }

  /* ---------------------------------------------------------------------------------
     Shared state. */

  var classes = {}; // the classes set, so each is only touched on a change

  /* Elements are told apart by their first class, which never changes. */
  function set(element, name, on) {
    var key = element.classList[0] + ":" + name;
    if (classes[key] === on) return;
    classes[key] = on;
    element.classList.toggle(name, on);
  }

  /* Takes a class off and puts it back, so the CSS animations it starts play again. The
     class comes back on the next frame rather than after reading the layout, which would
     make the browser lay out the page there and then, in the middle of a scroll. */
  function replay(element, name) {
    var key = element.classList[0] + ":" + name;
    element.classList.remove(name);
    classes[key] = true;
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        if (classes[key]) element.classList.add(name);
      });
    });
  }

  /* ---------------------------------------------------------------------------------
     The homepage's Poké Ball. */

  var ball = null;
  var loading = null;

  function buildBall() {
    ball = document.createElement("button");
    ball.type = "button";
    ball.className = "koi-ball";
    ball.title = "Open the Poké Ball";
    ball.setAttribute("aria-label", "Open the Poké Ball");
    /* A drawn ball rather than pixel art: it is a control, and sits beside the site's own
       buttons, so it is drawn like them. The top half is a group of its own, so it can open
       on its hinge; the band and the button stay with the bottom. The light of the button
       is what glows on hover. */
    ball.innerHTML =
      '<svg viewBox="0 0 32 32" width="26" height="26" aria-hidden="true">' +
      "<defs>" +
      '<radialGradient id="koi-ball-red" cx="34%" cy="28%" r="78%">' +
      '<stop offset="0" stop-color="#ff8a7a"/><stop offset=".45" stop-color="#e3350d"/>' +
      '<stop offset="1" stop-color="#9a1b0a"/></radialGradient>' +
      '<radialGradient id="koi-ball-white" cx="38%" cy="18%" r="95%">' +
      '<stop offset="0" stop-color="#ffffff"/><stop offset=".55" stop-color="#eef2f7"/>' +
      '<stop offset="1" stop-color="#aab4c3"/></radialGradient>' +
      "</defs>" +
      '<g class="koi-ball-top">' +
      '<path d="M2 16a14 14 0 0 1 28 0z" fill="url(#koi-ball-red)"/>' +
      '<path d="M2 16a14 14 0 0 1 28 0" fill="none" stroke="#1f2937" stroke-width="1.5"/>' +
      '<ellipse cx="10.4" cy="8.6" rx="4.2" ry="2.1" transform="rotate(-38 10.4 8.6)" fill="#fff" opacity=".6"/>' +
      "</g>" +
      '<g class="koi-ball-bottom">' +
      '<path d="M2 16a14 14 0 0 0 28 0z" fill="url(#koi-ball-white)"/>' +
      '<path d="M2 16a14 14 0 0 0 28 0" fill="none" stroke="#1f2937" stroke-width="1.5"/>' +
      '<rect x="2" y="14.7" width="28" height="2.6" fill="#1f2937"/>' +
      '<circle cx="16" cy="16" r="4.8" fill="#1f2937"/>' +
      '<circle cx="16" cy="16" r="3.3" fill="#f8fafc" stroke="#cbd5e1" stroke-width=".6"/>' +
      '<circle class="koi-ball-light" cx="16" cy="16" r="1.6" fill="#e2e8f0"/>' +
      "</g></svg>";
    document.body.appendChild(ball);
    ball.addEventListener("click", release);
    /* Caesar's Window, on the photo, is a second way to press the ball; it spins on its
       centre as it does. */
    document.querySelectorAll("[data-koi-release]").forEach(function (element) {
      element.addEventListener("click", function () {
        replay(element, "is-spinning");
        release();
      });
    });
  }

  /* In the bottom corner of a wide screen; on a narrow one, where Congo's scroll-to-top
     button would be (the homepage does not scroll, so it never shows there). The edge is
     the document's width, not the window's: where the system's scrollbar takes up room
     (Windows, Linux), the window's width includes it. */
  function placeBall() {
    var narrow = window.innerWidth < 768;
    var main = document.getElementById("main-content") || document.body;
    var size = narrow ? BALL_NARROW : BALL;
    var left = narrow ? main.getBoundingClientRect().right - size : root.clientWidth - EDGE - size;
    ball.style.width = ball.style.height = size + "px";
    ball.style.left = left + "px";
    ball.style.bottom = (narrow ? BOTTOM : BOTTOM_WIDE) + "px";
  }

  /* The ball opens with a flash. Resolves when whatever comes out of it should appear. */
  function openBall() {
    if (ball) replay(ball, "is-opening");
    return new Promise(function (resolve) {
      setTimeout(resolve, ball && !reduced.matches ? 280 : 0);
    });
  }

  /* Fetches assets/js/pokemon.js the first time, and hands it the press. */
  function release(name) {
    if (!loading) {
      loading = new Promise(function (resolve, reject) {
        var script = document.createElement("script");
        script.src = sprites.pokemon;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }
    loading.then(function () {
      if (window.KoiPokemon) window.KoiPokemon.release(typeof name === "string" ? name : undefined);
    });
  }

  /* ---------------------------------------------------------------------------------
     The climb. */

  var layer, gate, fall, trail, fish, carp, dragon, story;
  var room = 0; // how far the page scrolls, in px
  var long = false; // whether the page scrolls enough to be climbed
  var narrow = false; // whether the climb has to run over the text
  var col = 0; // px from the left of the screen to the line the climb runs along
  var rest = 0; // px from the top of the screen to the carp at the foot of the fall
  var gateY = 0; // px from the top of the screen to the middle of the gate
  var fallTop = 0; // px from the top of the screen to the head of the waterfall
  var fallBottom = 0; // and to its foot

  /* hidden: the carp has not come out yet. born: it is out and climbing. evolving: from
     the gate to the dragon's ascent, a sequence nothing interrupts. ascended: the dragon
     has gone, and the carp comes out again when the reader goes back up the page. */
  var stage = "hidden";
  var gliding = false; // the carp swimming from the foot of the fall to the reader's height
  var gateOpacity = -1;
  var lastY = window.scrollY;
  var frame = 0;
  var timers = [];
  var swimTimer = 0;
  var restTimer = 0;
  var drag = null;
  var splashing = false;

  function later(fn, ms) {
    timers.push(setTimeout(fn, ms));
  }

  function buildClimb() {
    layer = document.createElement("div");
    layer.className = "koi";
    /* Decoration: hidden from assistive technology, which is offered the story itself on
       the About page instead. */
    layer.setAttribute("aria-hidden", "true");

    gate = pixels(TORII, TORII_COLOURS, "koi-gate");

    fall = document.createElement("div");
    fall.className = "koi-fall";
    trail = document.createElement("div");
    trail.className = "koi-trail";
    fall.appendChild(trail);

    /* The fish is a point the script slides up and down; its body is what the CSS
       animates (the splash, the ascent), so the two never fight over one transform. */
    fish = document.createElement("div");
    fish.className = "koi-fish";
    var body = document.createElement("div");
    body.className = "koi-body";

    carp = document.createElement("img");
    carp.className = "koi-sprite koi-carp";
    carp.src = sprites.carp;
    carp.alt = "";
    carp.draggable = false;
    carp.decoding = "async";

    dragon = document.createElement("img");
    dragon.className = "koi-sprite koi-dragon";
    dragon.alt = "";
    dragon.draggable = false;
    dragon.decoding = "async";

    /* Out of the tab order: the layer is hidden from assistive technology, and a link
       inside it must not be reachable by keyboard either. */
    story = document.createElement("a");
    story.className = "koi-story";
    story.href = sprites.story;
    story.tabIndex = -1;
    story.title = "Why a carp becomes a dragon";
    story.appendChild(dragon);

    body.appendChild(carp);
    body.appendChild(story);
    for (var i = 0; i < 4; i++) {
      body.appendChild(pixels(SPARKLE, SPARKLE_COLOURS, "koi-sparkle koi-sparkle-" + i));
    }
    for (var j = 0; j < 3; j++) {
      body.appendChild(pixels(CLOUD, CLOUD_COLOURS, "koi-cloud koi-cloud-" + j));
    }
    fish.appendChild(body);

    layer.appendChild(fall);
    layer.appendChild(gate);
    layer.appendChild(fish);
    document.body.appendChild(layer);

    carp.addEventListener("pointerdown", onPointerDown);
    carp.addEventListener("pointermove", onPointerMove);
    carp.addEventListener("pointerup", onPointerUp);
    carp.addEventListener("pointercancel", function () {
      drag = null;
      set(layer, "is-dragged", false);
    });
  }

  /* Everything that needs the page's size, read in one go. Runs when the page or the
     window changes size, never on a plain scroll.

     Where the page has a margin (768px and up, Congo's md breakpoint) the climb runs up
     the very edge of the screen, like a scrollbar of its own, framed by the same margin
     at its head and its foot. On a narrower screen there is no margin, so it runs up the
     line of Congo's scroll-to-top button, from above that button to under the header. */
  function measure() {
    room = root.scrollHeight - window.innerHeight;
    long = room > window.innerHeight * MIN_SCROLL;
    narrow = window.innerWidth < 768;
    set(layer, "is-narrow", narrow);

    var main = document.getElementById("main-content") || document.body;
    col = narrow ? main.getBoundingClientRect().right - BALL_NARROW / 2 : root.clientWidth - EDGE - BALL / 2;

    var gateTop = narrow ? GATE_TOP_NARROW : MARGIN;
    gateY = gateTop + (TORII.length * PX) / 2;
    fallTop = gateTop + TORII.length * PX - 2;
    fallBottom = window.innerHeight - (narrow ? FOOT_NARROW : MARGIN);
    rest = fallBottom - CARP_REACH;

    gate.style.top = gateTop + "px";
    gate.style.left = col - (TORII[0].length * PX) / 2 + "px";
    fall.style.top = fallTop + "px";
    fall.style.left = col + "px";
    fall.style.height = Math.max(0, fallBottom - fallTop) + "px";
    fish.style.left = col + "px";
  }

  function scrolled() {
    return room > 0 ? Math.min(1, Math.max(0, window.scrollY / room)) : 0;
  }

  /* One frame of the climb: where the fish is, how much of the trail is gold, how bright
     the gate. */
  function place(p) {
    var y = rest + (gateY - rest) * p;
    fish.style.transform = "translate3d(0," + y.toFixed(1) + "px,0)";
    var climbed = Math.min(1, (fallBottom - y) / Math.max(1, fallBottom - fallTop));
    trail.style.transform = "scaleY(" + climbed.toFixed(4) + ")";

    var glow = Math.round((0.45 + 0.55 * Math.max(0, (p - 0.5) / 0.5)) * 50) / 50;
    if (glow !== gateOpacity) {
      gateOpacity = glow;
      gate.style.opacity = glow;
    }

    /* The dragon is only fetched once the carp is half way there: most visits never reach
       the end of the page, and they should not pay for a sprite they never see. */
    if (p > 0.5 && !dragon.getAttribute("src")) fetchDragon();
    if (p >= EVOLVE_AT) evolve();
  }

  /* Decoded as soon as it arrives, so the evolution does not have to decode it in the
     very frame it starts. */
  function fetchDragon() {
    dragon.src = sprites.dragon;
    if (dragon.decode) dragon.decode().catch(function () {});
  }

  /* The carp comes out at the foot of the fall, the torii appears and the waterfall pours
     from it; then the carp swims to the height the reader is at. */
  function birth(p) {
    timers.forEach(clearTimeout);
    timers = [];
    stage = "born";
    ["is-evolving", "shows-dragon", "is-evolved", "is-flashing", "is-sparkling", "is-draining",
      "is-clouded", "is-ascending", "is-splashing", "is-born"].forEach(function (name) {
      set(layer, name, false);
    });
    set(fish, "is-down", false);
    place(0);
    wake(REST_MS + BIRTH_MS);
    set(layer, "is-on", true);
    replay(layer, "is-born");
    /* Off again once the entrance has played, so that no later change of animation on the
       same elements can make it play twice. */
    later(function () {
      set(layer, "is-born", false);
    }, BIRTH_MS + 300);
    if (p <= 0) return;
    gliding = true;
    later(function () {
      set(layer, "is-gliding", true);
      place(Math.min(p, EVOLVE_AT - 0.001));
      later(function () {
        gliding = false;
        set(layer, "is-gliding", false);
        place(scrolled());
      }, 700);
    }, BIRTH_MS);
  }

  function evolve() {
    if (stage !== "born") return;
    stage = "evolving";
    hold();
    if (!dragon.getAttribute("src")) fetchDragon();
    set(fish, "is-down", false);
    say(["What? MAGIKARP is evolving!"]);

    if (reduced.matches) {
      finish();
      return;
    }
    set(layer, "is-evolving", true);
    var step = 0;
    (function flicker() {
      if (step === FLICKER.length) {
        finish();
        return;
      }
      /* Even steps show the carp, odd ones the dragon, ending on the dragon. */
      set(layer, "shows-dragon", step % 2 === 1);
      later(flicker, FLICKER[step]);
      step++;
    })();
  }

  /* The dragon holds, the gate gives way in a shower of sparkles, the trail drains up
     into the dragon, clouds gather under it and it rises into the sky, as the dragons of
     the legend do. */
  function finish() {
    set(layer, "is-evolving", false);
    set(layer, "shows-dragon", true);
    set(layer, "is-evolved", true);
    replay(layer, "is-flashing");
    replay(layer, "is-sparkling");
    say(["Congratulations! Your MAGIKARP evolved into GYARADOS!"]);
    later(function () {
      set(layer, "is-draining", true);
    }, DRAIN_AT);
    later(function () {
      set(layer, "is-clouded", true);
    }, CLOUDS_AT);
    later(function () {
      set(layer, "is-ascending", true);
    }, ASCEND_AT);
    later(function () {
      stage = "ascended";
      set(layer, "is-on", false);
      wake(REST_MS);
    }, GONE_AT);
  }

  function face(direction) {
    if (stage !== "born") return;
    set(fish, "is-down", direction === "down");
  }

  /* MAGIKARP used SPLASH! As in the games, nothing happens. */
  function splash() {
    if (splashing || stage !== "born") return;
    splashing = true;
    replay(layer, "is-splashing");
    hold();
    say(["MAGIKARP used SPLASH!", "But nothing happened!"]).then(function () {
      splashing = false;
      set(layer, "is-splashing", false);
      wake(REST_MS);
    });
  }

  /* On a narrow screen there is no margin to swim in, so the climb runs over the text.
     It only shows while the page moves, and steps aside once the reader stops to read. */
  function wake(ms) {
    set(layer, "is-resting", false);
    clearTimeout(restTimer);
    restTimer = setTimeout(function () {
      if (stage === "evolving" || splashing) return;
      set(layer, "is-resting", true);
    }, ms);
  }

  function hold() {
    clearTimeout(restTimer);
    set(layer, "is-resting", false);
  }

  /* On a computer the carp can be dragged up and down the fall, which scrolls the page
     with it: the climb doubles as a scrollbar. A click that does not move is a Splash.
     On a touch screen a drag already scrolls the page, so the carp only answers taps. */
  function onPointerDown(e) {
    if (stage !== "born") return;
    drag = { mouse: e.pointerType === "mouse", y: e.clientY, moved: false };
    if (drag.mouse) {
      e.preventDefault();
      carp.setPointerCapture(e.pointerId);
      set(layer, "is-dragged", true);
    }
  }

  function onPointerMove(e) {
    if (!drag || !drag.mouse) return;
    if (Math.abs(e.clientY - drag.y) > 3) drag.moved = true;
    if (!drag.moved) return;
    var p = Math.min(1, Math.max(0, (rest - e.clientY) / (rest - gateY)));
    /* "instant": the page sets scroll-behavior: smooth, which would make the page lag
       behind the hand. */
    window.scrollTo({ top: p * room, behavior: "instant" });
  }

  function onPointerUp() {
    if (drag && !drag.moved) splash();
    drag = null;
    set(layer, "is-dragged", false);
  }

  function onScroll() {
    if (frame) return;
    frame = requestAnimationFrame(function () {
      frame = 0;
      var y = window.scrollY;
      if (y !== lastY) face(y > lastY ? "up" : "down");
      lastY = y;
      if (!long) return;

      if (stage === "hidden" || (stage === "ascended" && scrolled() < REBIRTH_BELOW)) {
        birth(scrolled());
        return;
      }
      if (stage !== "born" || gliding) return;

      place(scrolled());
      set(layer, "is-swimming", true);
      clearTimeout(swimTimer);
      swimTimer = setTimeout(function () {
        set(layer, "is-swimming", false);
      }, SWIM_MS);
      wake(REST_MS);
    });
  }

  /* A change of size moves the climb, but it is not the reader moving: the fish is put in
     its new place without waking it. */
  function onResize() {
    measure();
    if (stage === "born" && !gliding) place(Math.min(scrolled(), EVOLVE_AT - 0.001));
  }

  /* ---------------------------------------------------------------------------------
     Start. */

  function start() {
    /* The text box is built while the browser has nothing else to do, rather than in the
       frame of its first line, which on a long page is the frame the carp evolves in. */
    (window.requestIdleCallback || setTimeout)(function () {
      if (!box) buildBox();
    });

    if (sprites.home) {
      buildBall();
      placeBall();
      window.addEventListener("resize", placeBall, { passive: true });
      return;
    }

    /* The 404 page has a visitor of its own. */
    if (sprites.missing) {
      setTimeout(function () {
        release("missingno");
      }, 900);
    }

    buildClimb();
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    /* Images and embeds keep changing the page's height after it loads. Congo's <body> is
       exactly one screen tall and lets the page overflow it, so it is the content that is
       watched, not the body. */
    var content = document.getElementById("main-content");
    if ("ResizeObserver" in window) new ResizeObserver(onResize).observe(content || document.body);

    /* On a long page the carp comes out on its own: on arrival where there is a margin to
       swim in, and with the first scroll where it would cover the text. */
    if (long && !narrow) {
      setTimeout(function () {
        if (stage === "hidden") birth(scrolled());
      }, 500);
    }
  }

  /* What assets/js/pokemon.js borrows. */
  window.Koi = {
    say: say,
    pixels: pixels,
    openBall: openBall,
    reduced: reduced,
    runtime: sprites.runtime,
    wiggle: function () {
      if (ball) replay(ball, "is-wiggling");
    }
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
