/* Golden butterflies: the engine behind the `butterflies` shortcode.

   A press on the button bursts a cloud of butterflies out of it in every direction.
   They wander, they steer away from the pointer, and one that is caught settles and
   shows the line of "Cien años de soledad" it was carrying. After a while each one
   fades out, so the page is given back to the reader without being swept.

   Everything lives in one fixed layer that only exists while butterflies are in the
   air, and the loop stops the moment the last one is gone, so an untouched page pays
   nothing for this.

   The drawing is in assets/css/butterflies.css: the wings are elements turning in 3D
   on a hinge at the body, not an SVG squeezed toward its spine. */

(function () {
  "use strict";

  var SWARM = 210; // butterflies per press
  var MAX = 420; // in the air at once, however fast the button is pressed
  var DODGE_RADIUS = 210; // px around the pointer the cloud tries to avoid
  var DODGE_FORCE = 2100; // px/s² pushing a butterfly away at the very centre
  var LIFE = 21; // seconds, the same for every one of them
  var FADE = 2.1; // seconds of fading in, and again of fading out
  var BIRTH_WINDOW = 12000; // ms over which they appear, one by one
  var PULL = 0.3; // how hard each one chases its own drifting destination
  var QUOTE_MS = 7000; // how long a caught butterfly rests before flying on

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

  var layer = null;
  var flock = [];
  var frame = null;
  var last = 0;
  var quotes = [];
  var lastQuote = -1;
  var openQuote = null;
  var pointer = { x: -1e4, y: -1e4, live: false };
  var live = null; // polite live region, so the press is not silent to a screen reader

  /* ----------------------------------------------------------------- drawing */

  /* One wing, drawn as the left one and mirrored by CSS for the right. The hinge is
     the right edge of the box, which is where the body sits, so rotating the element
     about that edge turns the wing on the body the way a real one does.

     The outline is traced, not drawn: a photographed sulphur was thresholded against
     its white background, the contour of one wing read off row by row and column by
     column, simplified, and smoothed into these curves. A half-wing measures 0.880
     wide to 1 tall on the specimen, which is why the box is 89 by 100. The forewing
     and the hindwing come out as one closed shape with the shallow notch the real
     one has, rather than as two lobes with a gap.

     The gradient needs an id, and an id has to be unique in the document, so each
     butterfly builds its own: sharing one would make every wing in the cloud take
     the colours of whichever butterfly was created first. */
  var uid = 0;

  function wing(id) {
    return "<svg viewBox=\"0 0 89 100\" aria-hidden=\"true\" focusable=\"false\"><defs><linearGradient id=\"" + id + "\" x1=\"1\" y1=\"0.3\" x2=\"0.05\" y2=\"0.85\"><stop offset=\"0\" class=\"cw-bf-s1\"/><stop offset=\"0.38\" class=\"cw-bf-s2\"/><stop offset=\"1\" class=\"cw-bf-s3\"/></linearGradient></defs><path class=\"cw-bf-plate\" d=\"M89.0 33.0C85.5 29.8 75.5 18.3 68.0 14.0C60.5 9.7 51.3 9.0 44.0 7.0C36.7 5.0 30.2 3.2 24.0 2.0C17.8 0.8 11.0 -1.0 7.0 0.0C3.0 1.0 -0.7 2.7 0.0 8.0C0.7 13.3 8.3 25.5 11.0 32.0C13.7 38.5 14.3 43.7 16.0 47.0C17.7 50.3 18.8 50.8 21.0 52.0C23.2 53.2 28.5 52.5 29.0 54.0C29.5 55.5 25.2 58.5 24.0 61.0C22.8 63.5 22.2 66.8 22.0 69.0C21.8 71.2 21.3 70.8 23.0 74.0C24.7 77.2 28.7 84.3 32.0 88.0C35.3 91.7 39.3 94.0 43.0 96.0C46.7 98.0 50.3 99.5 54.0 100.0C57.7 100.5 61.0 101.0 65.0 99.0C69.0 97.0 74.0 90.2 78.0 88.0C82.0 85.8 87.2 86.3 89.0 86.0Z\" fill=\"url(#" + id + ")\"/><path class=\"cw-bf-blush\" d=\"M89.0 34.0C85.8 32.3 76.2 26.0 70.0 24.0C63.8 22.0 57.0 21.0 52.0 22.0C47.0 23.0 42.3 26.0 40.0 30.0C37.7 34.0 37.3 40.7 38.0 46.0C38.7 51.3 42.7 56.7 44.0 62.0C45.3 67.3 43.7 73.3 46.0 78.0C48.3 82.7 53.7 87.7 58.0 90.0C62.3 92.3 66.8 92.8 72.0 92.0C77.2 91.2 86.2 86.2 89.0 85.0Z\"/><path class=\"cw-bf-vein\" d=\"M85 30C64 24 38 16 12 7M85 37C62 33 36 27 13 23M85 43C62 42 38 40 17 41M85 49C64 50 44 52 24 55M85 58C64 61 44 67 29 76M85 66C66 72 50 80 38 90M85 74C70 81 60 89 52 96\"/><ellipse class=\"cw-bf-eyespot\" cx=\"40\" cy=\"23\" rx=\"2.2\" ry=\"1.7\"/><ellipse class=\"cw-bf-eyespot\" cx=\"30\" cy=\"70\" rx=\"1.7\" ry=\"1.3\"/><path class=\"cw-bf-costa\" d=\"M89 33C75 20 52 9 24 2 15 1 7 0 7 0\"/></svg>";
  }


  var BODY =
    "<svg class=\"cw-bf-body\" viewBox=\"0 0 178 100\" aria-hidden=\"true\" focusable=\"false\"><path class=\"cw-bf-feeler\" d=\"M86 20C81 12 72 5 61 1M92 20c5-8 14-15 25-19\"/><circle class=\"cw-bf-trunk\" cx=\"61\" cy=\"1\" r=\"1.9\"/><circle class=\"cw-bf-trunk\" cx=\"117\" cy=\"1\" r=\"1.9\"/><path class=\"cw-bf-abdomen\" d=\"M89 32c2.4 0 3.4 2.2 3.4 6.2 0 9.4-1.1 24-3.4 28.5-2.3-4.5-3.4-19.1-3.4-28.5 0-4 1-6.2 3.4-6.2Z\"/><path class=\"cw-bf-fuzz\" d=\"M82 28l-5-4M83 35l-6-2M96 28l5-4M95 35l6-2\"/><ellipse class=\"cw-bf-thorax\" cx=\"89\" cy=\"28\" rx=\"4.4\" ry=\"6.4\"/><ellipse class=\"cw-bf-trunk\" cx=\"89\" cy=\"20\" rx=\"3.2\" ry=\"2.8\"/></svg>";

  function sprite() {
    var id = "cwbf" + ++uid;
    return (
      '<div class="cw-bf-lift"><div class="cw-bf-sprite">' +
      '<div class="cw-bf-wing cw-bf-wing-l">' + wing(id) + "</div>" +
      '<div class="cw-bf-wing cw-bf-wing-r">' + wing(id) + "</div>" +
      BODY +
      "</div></div>"
    );
  }

  /* Lemon into amber, the colours a sulphur actually wears. Never twice the same. */
  var PALETTE = [
    { deep: "#f6b26b", mid: "#f8dc4e", pale: "#fdf3a6", blush: "#f4a460" },
    { deep: "#f3a95c", mid: "#f6d646", pale: "#fcf0a0", blush: "#f0995a" },
    { deep: "#f8bd7e", mid: "#fae366", pale: "#fef7c0", blush: "#f6b06e" },
    { deep: "#eda04e", mid: "#f3cf3f", pale: "#fbeb9c", blush: "#e8934a" },
    { deep: "#f9c78e", mid: "#fbe878", pale: "#fef9cc", blush: "#f7bb80" }
  ];

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function pick(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  /* ------------------------------------------------------------------- layer */

  function getLayer() {
    if (!layer) {
      layer = document.createElement("div");
      layer.className = "cw-swarm";
      document.body.appendChild(layer);
    }
    return layer;
  }

  function dropLayerIfEmpty() {
    if (layer && !flock.length && !openQuote) {
      layer.remove();
      layer = null;
    }
  }

  /* --------------------------------------------------------------- the cloud */

  function spawn() {
    var tone = pick(PALETTE);
    var w = window.innerWidth;
    var h = window.innerHeight;

    var bf = {
      el: document.createElement("div"),
      /* Anywhere on the page, but not evenly: scattered uniformly they pile up in
         the middle, because the middle is where most of the area is. Pushing the
         draw outward puts them around the edges first and lets the wandering fill
         the centre in its own time, which is what made the old edge version read
         well without having to make them enter from off screen. */
      x: 0,
      y: 0,
      /* Mostly small, a few close. The curve matters more than the range: drawn
         evenly you get a field of equal-looking insects, weighted toward the small
         end you get a deep sky with the odd one passing near. */
      scale: 0.22 + Math.pow(Math.random(), 2) * 0.6,
      age: 0,
      resting: false,
      restUntil: 0,
      leaving: false
    };

    /* Wandering, not travelling. Two slow sine terms at frequencies that do not
       divide into each other turn the heading continuously and never repeat the same
       path twice, which is what makes it read as a drift rather than as a waypoint
       being followed. A third does the same to the speed, so they dawdle and hurry. */
    /* Most of them turn up around the rim, the rest anywhere on the page.

       Birthing every single one on the perimeter is what drew the ring: born
       together on the edge and steered alike, they close in as one front. Letting
       four in ten appear inland breaks the front without losing the feeling that
       they are coming in from outside. Measured against an even scattering, this
       mix plus a gentler pull cuts the deviation from 30 to 17.

       The perimeter draw itself walks the frame rather than sweeping an angle: a
       uniform angle does not give a uniform point on a rectangle, and the corners
       come out thin. */
    if (Math.random() < 0.6) {
      var inW = Math.max(60, w - 80);
      var inH = Math.max(60, h - 80);
      var walk = rand(0, 2 * (inW + inH));
      if (walk < inW) {
        bf.x = 40 + walk; bf.y = 40;
      } else if (walk < inW + inH) {
        bf.x = w - 40; bf.y = 40 + (walk - inW);
      } else if (walk < 2 * inW + inH) {
        bf.x = w - 40 - (walk - inW - inH); bf.y = h - 40;
      } else {
        bf.x = 40; bf.y = h - 40 - (walk - 2 * inW - inH);
      }
      /* Scatter each one off the line, mostly inward, so the rim is a band and not
         a drawn rectangle. A few start just outside and drift in. */
      bf.x += rand(-70, 40) * (bf.x > w / 2 ? 1 : -1);
      bf.y += rand(-70, 40) * (bf.y > h / 2 ? 1 : -1);
    } else {
      bf.x = rand(40, Math.max(60, w - 40));
      bf.y = rand(40, Math.max(60, h - 40));
    }
    bf.heading = rand(0, Math.PI * 2);
    bf.base = rand(26, 74) * (0.5 + bf.scale);
    bf.w1 = rand(0.13, 0.32); bf.p1 = rand(0, 99);
    bf.w2 = rand(0.38, 0.92); bf.p2 = rand(0, 99);
    bf.w3 = rand(0.13, 0.34); bf.p3 = rand(0, 99);
    /* Its own somewhere to be, and its own mind about getting there. Pulling every
       one of them toward the same centre with the same force is what drew a ring:
       born together on the rim and steered identically, they close in as one front.
       Separate destinations and separate strengths break that up completely. */
    bf.pull = rand(0.2, 1.5);
    bf.retarget = 0;
    bf.a1 = rand(0.5, 1.3); bf.a2 = rand(0.2, 0.6);
    bf.vx = Math.cos(bf.heading) * bf.base;
    bf.vy = Math.sin(bf.heading) * bf.base;
    bf.shown = bf.heading; // the drawn heading, eased behind the real one

    bf.el.className = "cw-bf";
    bf.el.style.setProperty("--cw-bf-deep", tone.deep);
    bf.el.style.setProperty("--cw-bf-mid", tone.mid);
    bf.el.style.setProperty("--cw-bf-pale", tone.pale);
    bf.el.style.setProperty("--cw-bf-blush", tone.blush);
    bf.el.style.setProperty("--cw-bf-flap", Math.round(150 + bf.scale * 230 + rand(-20, 20)) + "ms");
    bf.el.style.setProperty("--cw-bf-bob", (2 + bf.scale * 7).toFixed(1) + "px");
    bf.el.style.setProperty("--cw-bf-haze", (0.5 + bf.scale * 0.5).toFixed(2));
    /* Put the viewer somewhere different for each one. Most are seen from above,
       which is how you usually meet a butterfly, but a quarter are passing side on
       and a few are going away from you, seen from behind and a little below. That
       spread is most of what separates a sky from a sheet of stickers. */
    var view = Math.random();
    var tilt, yaw;
    if (view < 0.55) {
      tilt = rand(-46, -16); // from above
      yaw = rand(-28, 28);
    } else if (view < 0.82) {
      tilt = rand(-26, 6); // side on, nearly level with it
      yaw = (Math.random() < 0.5 ? -1 : 1) * rand(44, 78);
    } else {
      tilt = rand(8, 46); // going away, seen from behind and below
      yaw = rand(-34, 34);
    }
    bf.el.style.setProperty("--cw-bf-tilt", Math.round(tilt) + "deg");
    bf.el.style.setProperty("--cw-bf-yaw", Math.round(yaw) + "deg");
    bf.el.style.setProperty("--cw-bf-roll", Math.round(rand(-22, 22)) + "deg");
    bf.el.innerHTML = sprite();
    if (bf.scale < 0.32) {
      /* The far ones are not catchable. A 12px target is a frustration rather than
         a game, and eighty of them taking pointer events would fight the page for
         every click. */
      bf.el.style.pointerEvents = "none";
    } else {
      bf.el.addEventListener("pointerdown", function (event) {
        event.preventDefault();
        catchButterfly(bf);
      });
    }
    /* Start the beat at a random point in its cycle, or the whole cloud flaps in
       unison and the illusion collapses. */
    bf.el.querySelectorAll(".cw-bf-wing, .cw-bf-lift").forEach(function (node) {
      node.style.animationDelay = "-" + Math.round(rand(0, 600)) + "ms";
    });

    getLayer().appendChild(bf.el);
    place(bf);
    requestAnimationFrame(function () {
      bf.el.classList.add("cw-bf-visible");
    });
    flock.push(bf);
    return bf;
  }

  function place(bf, dt) {
    var want = Math.atan2(bf.vy, bf.vx); // the sprite faces up, hence the quarter turn below
    if (dt) {
      /* Follow the heading, do not snap to it. Taken raw, the wobble makes the
         drawing jitter; eased, the same wobble reads as the butterfly leaning
         into its own swing. */
      var diff = Math.atan2(Math.sin(want - bf.shown), Math.cos(want - bf.shown));
      bf.shown += diff * Math.min(1, dt * 6);
    } else {
      bf.shown = want;
    }
    bf.el.style.transform =
      "translate3d(" + bf.x.toFixed(1) + "px," + bf.y.toFixed(1) + "px,0)" +
      " rotate(" + (bf.shown + Math.PI / 2).toFixed(3) + "rad)" +
      " scale(" + bf.scale.toFixed(2) + ")";
  }

  function remove(bf) {
    var i = flock.indexOf(bf);
    if (i !== -1) flock.splice(i, 1);
    bf.el.remove();
    dropLayerIfEmpty();
  }

  function fadeOut(bf) {
    if (bf.leaving) return;
    bf.leaving = true;
    bf.el.classList.remove("cw-bf-visible");
    window.setTimeout(function () {
      remove(bf);
    }, FADE * 1000 + 120);
  }

  /* ------------------------------------------------------------------ flight */

  function step(now) {
    var dt = Math.min((now - last) / 1000, 0.05); // a backgrounded tab must not teleport the cloud
    last = now;

    var w = window.innerWidth;
    var h = window.innerHeight;

    for (var i = flock.length - 1; i >= 0; i--) {
      var bf = flock[i];
      bf.age += dt;

      if (bf.resting) {
        if (now >= bf.restUntil) takeOff(bf);
        continue;
      }

      /* The heading turns continuously instead of being nudged in steps: this is the
         whole difference between a drift and a stutter. */
      bf.heading +=
        (Math.sin(bf.age * bf.w1 + bf.p1) * bf.a1 + Math.sin(bf.age * bf.w2 + bf.p2) * bf.a2) * dt;

      /* Each one drifts toward a place of its own, re-chosen every few seconds, so
         the cloud never moves as one body. */
      if (bf.age > bf.retarget) {
        bf.retarget = bf.age + rand(2.5, 6);
        bf.tx = rand(w * 0.02, w * 0.98);
        bf.ty = rand(h * 0.02, h * 0.98);
      }
      var want = Math.atan2(bf.ty - bf.y, bf.tx - bf.x);
      var turn = Math.atan2(Math.sin(want - bf.heading), Math.cos(want - bf.heading));
      bf.heading += turn * (PULL * bf.pull) * dt;

      /* And a firm, separate shove back inside if one is about to leave the page.
         This is containment only; it does no steering while they are on screen, so
         it cannot shepherd them into a shape. */
      var out = Math.max(
        (40 - bf.x) / 120, (bf.x - (w - 40)) / 120,
        (40 - bf.y) / 120, (bf.y - (h - 40)) / 120
      );
      if (out > 0) {
        var home = Math.atan2(h / 2 - bf.y, w / 2 - bf.x);
        var back = Math.atan2(Math.sin(home - bf.heading), Math.cos(home - bf.heading));
        bf.heading += back * Math.min(1, out) * 2.6 * dt;
      }

      var speed = bf.base * (0.72 + 0.4 * Math.sin(bf.age * bf.w3 + bf.p3));
      bf.vx = Math.cos(bf.heading) * speed;
      bf.vy = Math.sin(bf.heading) * speed;

      /* Steer away from the pointer: the closer it is, the harder the push, so a
         butterfly swerves in an arc instead of jumping. */
      if (pointer.live) {
        var dx = bf.x + 36 * bf.scale - pointer.x;
        var dy = bf.y + 20 * bf.scale - pointer.y;
        var dist = Math.hypot(dx, dy);
        if (dist < DODGE_RADIUS && dist > 0.5) {
          var push = (1 - dist / DODGE_RADIUS) * DODGE_FORCE * dt;
          bf.vx += (dx / dist) * push;
          bf.vy += (dy / dist) * push;
          bf.heading = Math.atan2(bf.vy, bf.vx);
        }
      }

      bf.x += bf.vx * dt;
      bf.y += bf.vy * dt;
      place(bf, dt);

      /* Every one of them lives exactly as long as every other, and they were born
         one by one, so they go out one by one in the order they arrived: the page
         thins rather than emptying all at once. */
      if (bf.age > LIFE - FADE) fadeOut(bf);
    }

    if (flock.length) {
      frame = requestAnimationFrame(step);
    } else {
      frame = null;
      dropLayerIfEmpty();
    }
  }

  function start() {
    if (frame === null && flock.length) {
      last = performance.now();
      frame = requestAnimationFrame(step);
    }
  }

  /* ------------------------------------------------------- catching and quotes */

  function catchButterfly(bf) {
    if (bf.resting || bf.leaving) return;
    bf.resting = true;
    bf.restUntil = performance.now() + QUOTE_MS;
    bf.age -= QUOTE_MS / 1000 + 2; // a butterfly in the hand must not expire mid-sentence
    bf.el.classList.add("cw-bf-resting");
    showQuote(bf);
  }

  function takeOff(bf) {
    bf.resting = false;
    bf.el.classList.remove("cw-bf-resting");
    var angle = rand(0, Math.PI * 2);
    var speed = rand(110, 190);
    bf.vx = Math.cos(angle) * speed;
    bf.vy = Math.sin(angle) * speed;
    if (openQuote && openQuote.owner === bf) closeQuote();
    start();
  }

  function showQuote(bf) {
    if (!quotes.length) return;
    closeQuote();

    var index = Math.floor(Math.random() * quotes.length);
    if (quotes.length > 1 && index === lastQuote) index = (index + 1) % quotes.length;
    lastQuote = index;
    var quote = quotes[index];

    var card = document.createElement("div");
    card.className = "cw-bf-quote";
    card.setAttribute("role", "status");
    var text = document.createElement("p");
    text.textContent = "«" + quote.text + "»";
    card.appendChild(text);
    if (quote.source) {
      var cite = document.createElement("cite");
      cite.textContent = "— " + quote.source;
      card.appendChild(cite);
    }

    getLayer().appendChild(card);
    openQuote = { el: card, owner: bf };

    /* Sit the card next to the butterfly, then pull it back inside the viewport:
       plenty of them are caught near an edge, where a card would hang off screen. */
    var box = card.getBoundingClientRect();
    var left = Math.min(Math.max(bf.x + 40, 12), window.innerWidth - box.width - 12);
    var top = bf.y + 36 + box.height > window.innerHeight
      ? Math.max(bf.y - box.height - 14, 12)
      : bf.y + 36;
    card.style.left = Math.round(left) + "px";
    card.style.top = Math.round(top) + "px";
    requestAnimationFrame(function () {
      card.classList.add("cw-bf-quote-visible");
    });
  }

  function closeQuote() {
    if (!openQuote) return;
    var card = openQuote.el;
    openQuote = null;
    card.classList.remove("cw-bf-quote-visible");
    window.setTimeout(function () {
      card.remove();
      dropLayerIfEmpty();
    }, 300);
  }

  /* -------------------------------------------------------------- the button */

  function releaseSwarm() {
    if (reduced.matches) {
      stillSwarm();
      return;
    }

    var room = Math.max(0, MAX - flock.length);
    var n = Math.min(SWARM, room);
    for (var i = 0; i < n; i++) {
      /* Spread over the window, one by one. Because they all live exactly as long,
         they will later go out in the same order and at the same pace. */
      var when = (i / Math.max(n - 1, 1)) * BIRTH_WINDOW + rand(0, 260);
      window.setTimeout(function () {
        spawn();
        start();
      }, when);
    }
    announce("Butterflies appear across the page and wander. Catch one to read a line of the novel.");
  }

  /* With reduced motion asked for, nothing flies: a few butterflies simply appear
     around the button, can still be caught for their line, and fade away. */
  function stillSwarm() {
    for (var i = 0; i < 7; i++) {
      var bf = spawn();
      bf.base = 0;
      place(bf);
      (function (one) {
        window.setTimeout(function () {
          if (!one.resting) fadeOut(one);
        }, LIFE * 1000);
      })(bf);
    }
    announce("Seven butterflies rest on the page. Select one to read a line of the novel.");
  }

  function announce(message) {
    if (!live) {
      live = document.createElement("p");
      live.className = "cw-sr-only";
      live.setAttribute("aria-live", "polite");
      document.body.appendChild(live);
    }
    live.textContent = message;
  }

  /* ------------------------------------------------------------------- wiring */

  function readQuotes() {
    var found = [];
    document.querySelectorAll("script.cw-bf-quotes").forEach(function (node) {
      try {
        found = found.concat(JSON.parse(node.textContent));
      } catch (error) {
        /* A malformed list costs the quotes, never the butterflies. */
      }
    });
    quotes = found;
  }

  function init() {
    readQuotes();

    document.addEventListener("click", function (event) {
      var button = event.target.closest("[data-cw-butterflies]");
      if (button) {
        releaseSwarm();
        return;
      }
      /* A click anywhere else lets the caught one go. */
      if (openQuote && !event.target.closest(".cw-bf-quote")) closeQuote();
    });

    document.addEventListener("pointermove", function (event) {
      if (event.pointerType === "touch") return; // a finger is a catch, not a threat
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.live = true;
    }, { passive: true });

    document.addEventListener("pointerleave", function () {
      pointer.live = false;
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") closeQuote();
    });

    window.addEventListener("resize", closeQuote);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
