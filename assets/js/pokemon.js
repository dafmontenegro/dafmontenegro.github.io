/* The Pokémon of the homepage, and the 404 page's visitor.

   Fetched by assets/js/koi.js the first time the Poké Ball (or Caesar's Window on the
   photo) is pressed on the homepage, never before. Each press brings out one Pokémon that
   plays with the author's photo, and with the rest of the page, in a way its kind is
   known for: Pikachu shocks it, Charmander sets it alight, Snorlax falls asleep against
   it until it plays the Poké Flute, Gengar takes its place as a prank, Ditto turns the page
   into Ditto, and Psyduck's headache sends the whole page lurching. A Pokémon that
   evolves does so during its act, as in the games, and the text box of koi.js narrates
   it in the games' own words.

   The sprites are the animated ones from Pokémon Black and White, fetched by
   scripts/pokemon/build.py; their sizes and fingerprinted addresses arrive in one JSON
   file. Only the sprites of the act about to play are downloaded.

   Holding the ball down opens a Pokédex instead (koi.js decides which), to choose the
   act: every one is listed, the ones not yet met as a silhouette and "???".

   Everything moves with the Web Animations API, on `transform` and `opacity`, which the
   browser composites without repainting the page; nothing runs between acts. */

(function () {
  "use strict";

  var Koi = window.Koi;
  if (!Koi) return;

  /* The in-game evolution, shorter than the carp's: both forms flash in turn, faster and
     faster, until the new one holds. Each number is how long one form stays. */
  var FLICKER = [260, 220, 180, 150, 120, 95, 75, 60, 48, 40];
  var BEHIND = 0; // z-index of a Pokémon behind the photo
  var IN_FRONT = 3; // and in front of it, and of the badge

  var data = null;
  var busy = false;
  var previous = "";
  var avatar, scene, radius;

  function still() {
    return Koi.reduced.matches;
  }

  /* With reduced motion every move is instant: the act still happens, without travel. */
  function ms(duration) {
    return still() ? 0 : duration;
  }

  function wait(duration) {
    return new Promise(function (resolve) {
      setTimeout(resolve, duration);
    });
  }

  function load() {
    if (data) return Promise.resolve(data);
    return fetch(Koi.runtime)
      .then(function (response) {
        return response.json();
      })
      .then(function (json) {
        data = json;
        return data;
      });
  }

  /* An act's sprites, decoded before it starts, so no frame of it is blank. */
  function preload(keys) {
    return Promise.all(
      keys.map(function (key) {
        var img = new Image();
        img.src = data[key].url;
        return img.decode().catch(function () {});
      })
    );
  }

  function name(key) {
    return data[key].name.toUpperCase();
  }

  /* ---------------------------------------------------------------------------------
     A Pokémon in the scene. (x, y) is the point under its feet, in px from the centre of
     the photo; the photo's rim is `radius` away. */

  /* Sprites drawn from another game at a heavier scale, shown smaller to stand as tall as
     the rest: applied every time the sprite is shown, so it is never seen at the wrong
     size, even for a frame of an evolution. */
  var DRAWN_AT = { sylveon: 0.8 };

  function Mon(key, x, y, z) {
    this.el = document.createElement("img");
    this.el.className = "pkmn-sprite";
    this.el.alt = "";
    this.el.decoding = "async";
    this.x = x;
    this.y = y;
    this.show(key);
    this.z(z === undefined ? IN_FRONT : z);
    scene.appendChild(this.el);
  }

  Mon.prototype.show = function (key) {
    var s = data[key];
    var k = DRAWN_AT[key] || 1;
    this.key = key;
    this.w = Math.round(s.width * k);
    this.h = Math.round(s.height * k);
    this.el.src = s.url;
    this.el.width = s.width;
    this.el.height = s.height;
    this.el.style.transform = this.at(this.x, this.y);
  };

  /* The sprites face left; a flipped one faces right, towards the photo from its left. */
  Mon.prototype.at = function (x, y) {
    return "translate(" + (x - this.w / 2).toFixed(1) + "px," + (y - this.h).toFixed(1) + "px)" + (this.flipped ? " scaleX(-1)" : "");
  };

  Mon.prototype.flip = function (on) {
    this.flipped = on;
    this.el.style.transform = this.at(this.x, this.y);
  };

  /* Draws the sprite at `k` times its size, keeping its feet where they are; for a pose
     taken from another game, drawn at another scale than the Pokémon's other sprites. */
  Mon.prototype.resize = function (k) {
    this.w = Math.round(this.w * k);
    this.h = Math.round(this.h * k);
    this.el.width = this.w;
    this.el.height = this.h;
    this.el.style.transform = this.at(this.x, this.y);
  };

  Mon.prototype.z = function (z) {
    this.el.style.zIndex = z;
  };

  /* Moves through a list of [x, y] points; the last one is where it stays. */
  Mon.prototype.path = function (points, duration, easing) {
    var self = this;
    var frames = [{ transform: this.at(this.x, this.y) }].concat(
      points.map(function (p) {
        return { transform: self.at(p[0], p[1]) };
      })
    );
    var end = points[points.length - 1];
    this.x = end[0];
    this.y = end[1];
    this.el.style.transform = this.at(this.x, this.y);
    return this.el.animate(frames, { duration: ms(duration), easing: easing || "ease-in-out" }).finished;
  };

  Mon.prototype.go = function (x, y, duration, easing) {
    return this.path([[x, y]], duration, easing);
  };

  /* A jump to (x, y), `height` px over the higher of the two ends. */
  Mon.prototype.hop = function (x, y, height, duration) {
    var top = Math.min(this.y, y) - height;
    return this.path([[(this.x + x) / 2, top], [x, y]], duration, "ease-in-out");
  };

  Mon.prototype.fade = function (duration) {
    return this.el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: ms(duration), fill: "forwards" }).finished;
  };

  Mon.prototype.remove = function () {
    this.el.remove();
  };

  /* Goes back behind the photo and is gone: it walks in towards the middle, where the
     photo covers the whole of it, fading on the way, so it is never seen cut off by the
     photo's rim and then vanish all at once. */
  function hide(mon, duration) {
    duration = duration || 900;
    mon.z(BEHIND);
    var going = mon.go((mon.x < 0 ? -1 : 1) * radius * 0.15, radius * 0.35 + mon.h * 0.5, duration, "ease-in");
    mon.el.animate([{ opacity: 1 }, { opacity: 1, offset: 0.45 }, { opacity: 0 }], { duration: ms(duration), fill: "forwards" });
    return going.then(function () {
      mon.remove();
    });
  }

  /* A flash where something changes form. */
  function burst(x, y) {
    var flash = document.createElement("div");
    flash.className = "pkmn-burst";
    /* Placed by left and top, never by transform: the flash animates `scale`, which the
       browser applies before `transform` and would scale the offset with it. The same goes
       for every prop below that pulses, spins or wobbles. */
    flash.style.left = x + "px";
    flash.style.top = y + "px";
    flash.style.zIndex = IN_FRONT + 1;
    scene.appendChild(flash);
    setTimeout(function () {
      flash.remove();
    }, 900);
  }

  /* A small pixel drawing that rises from (x, y) and fades: a heart, a bolt, a Z. */
  function float(art, colours, x, y, rise, duration, delay, size) {
    if (still()) return;
    var svg = Koi.pixels(art, colours, "pkmn-prop", size || 2);
    svg.style.zIndex = IN_FRONT;
    scene.appendChild(svg);
    var from = "translate(" + x + "px," + y + "px)";
    var to = "translate(" + (x + rise[0]) + "px," + (y + rise[1]) + "px)";
    svg
      .animate(
        [
          { transform: from + " scale(0.4)", opacity: 0 },
          { transform: from + " scale(1)", opacity: 1, offset: 0.2 },
          { transform: to + " scale(1)", opacity: 0 }
        ],
        { duration: duration, delay: delay || 0, fill: "both", easing: "ease-out" }
      )
      .finished.then(function () {
        svg.remove();
      });
  }

  /* A note of the Poké Flute: born small at the flute's bell, it grows as it rises and
     drifts, like coloured smoke, and fades high above. */
  function note(colours, x, y, dx, dy) {
    var svg = Koi.pixels(NOTE, colours, "pkmn-prop", 3);
    svg.style.zIndex = IN_FRONT;
    scene.appendChild(svg);
    var at = function (k, scale) {
      return "translate(" + (x + dx * k) + "px," + (y + dy * k) + "px) scale(" + scale + ")";
    };
    svg
      .animate(
        [
          { transform: at(0, 0.3), opacity: 0 },
          { transform: at(0.1, 0.5), opacity: 1, offset: 0.1 },
          { transform: at(0.6, 1.3), opacity: 0.95, offset: 0.6 },
          { transform: at(1, 1.9), opacity: 0 }
        ],
        { duration: 2600, easing: "ease-out" }
      )
      .finished.then(function () {
        svg.remove();
      });
  }

  /* What the Pokémon do to the photo, as a class on its box (assets/css/koi.css). */
  function photo(effect, on) {
    avatar.classList.toggle(effect, on);
  }

  /* The evolution: the Pokémon stops, both forms flash in turn faster and faster until the
     new one holds. As in the games, nobody moves on before the text box has finished. */
  function evolve(mon, to) {
    var from = mon.key;
    var told = Koi.say(["What? " + name(from) + " is evolving!"]);
    var steps = still() ? [] : FLICKER;
    mon.el.classList.add("is-silhouette");
    return (function swap(i) {
      if (i === steps.length) {
        mon.show(to);
        mon.el.classList.remove("is-silhouette");
        burst(mon.x, mon.y - mon.h / 2);
        return told.then(function () {
          return Koi.say(["Congratulations! Your " + name(from) + " evolved into " + name(to) + "!"]);
        });
      }
      mon.show(i % 2 ? from : to);
      return wait(steps[i]).then(function () {
        return swap(i + 1);
      });
    })(0);
  }

  /* A pixel drawing that flies from one point to another and is gone: an ember. */
  function shoot(art, colours, from, to, duration, size) {
    if (still()) return Promise.resolve();
    var svg = Koi.pixels(art, colours, "pkmn-prop", size || 2);
    svg.style.zIndex = IN_FRONT;
    scene.appendChild(svg);
    return svg
      .animate(
        [
          { transform: "translate(" + from[0] + "px," + from[1] + "px)" },
          { transform: "translate(" + to[0] + "px," + to[1] + "px)" }
        ],
        { duration: duration, easing: "ease-in", fill: "forwards" }
      )
      .finished.then(function () {
        svg.remove();
      });
  }

  /* A flame that stands where it is put, its base at (x, y), flickering through its three
     drawings, until it is put out. `size` is CSS px per pixel. */
  function flame(x, y, size) {
    size = size || 3;
    var svg = Koi.pixelFrames(FIRE, FIRE_COLOURS, "pkmn-prop pkmn-fire", size);
    svg.style.zIndex = IN_FRONT;
    svg.style.left = x - (9 * size) / 2 + "px";
    svg.style.top = y - 13 * size + "px";
    svg.style.setProperty("--pkmn-fire-delay", -Math.random() * 0.36 + "s");
    scene.appendChild(svg);
    return svg;
  }

  /* Sparks rising off a fire, until the returned function is called. */
  function embers(xs, y) {
    if (still()) return function () {};
    var rising = setInterval(function () {
      var x = xs[(Math.random() * xs.length) | 0];
      float(SPARK, SPARK_COLOURS, x + (Math.random() - 0.5) * 20, y, [(Math.random() - 0.5) * 30, -70 - Math.random() * 50], 1100, 0, 2);
    }, 90);
    return function () {
      clearInterval(rising);
    };
  }

  /* Sparks sprayed from a mouth, towards `side` (1 right, -1 left). */
  function spray(from, side) {
    if (still()) return;
    for (var i = 0; i < 16; i++) {
      var angle = (Math.random() - 0.5) * 1.6;
      var reach = 50 + Math.random() * 70;
      float(SPARK, SPARK_COLOURS, from[0], from[1], [side * Math.cos(angle) * reach, Math.sin(angle) * reach - 20], 700, i * 30, 2);
    }
  }

  /* A wave of heat over the whole page. */
  function heat() {
    if (still()) return;
    var wave = document.createElement("div");
    wave.className = "pkmn-heat";
    wave.setAttribute("aria-hidden", "true");
    var r = avatar.getBoundingClientRect();
    wave.style.setProperty("--x", r.left + r.width / 2 + "px");
    wave.style.setProperty("--y", r.top + r.height / 2 + "px");
    document.body.appendChild(wave);
    setTimeout(wave.remove.bind(wave), 1200);
  }

  /* A shadow on the ground under a Pokémon's feet. */
  function ground(x, y) {
    var shadow = document.createElement("div");
    shadow.className = "pkmn-ground";
    shadow.style.left = x + "px";
    shadow.style.top = y + "px";
    shadow.style.zIndex = BEHIND;
    scene.appendChild(shadow);
    return shadow;
  }

  /* Charizard's shadow, flying high over the page: its silhouette, four times its size,
     sweeping across the whole screen, left to right (way 1) or back (way -1), facing the
     way it flies. */
  function skyShadow(way) {
    if (still()) return Promise.resolve();
    var sky = document.createElement("div");
    sky.className = "pkmn";
    sky.setAttribute("aria-hidden", "true");
    var shape = document.createElement("img");
    var c = data.charizard;
    shape.src = c.url;
    shape.alt = "";
    shape.className = "pkmn-sky-shadow";
    shape.width = c.width * 4;
    shape.height = c.height * 4;
    sky.appendChild(shape);
    document.body.appendChild(sky);
    var w = c.width * 4;
    return shape
      .animate(
        [
          way > 0
            ? { transform: "translate(" + -w + "px," + window.innerHeight * 0.05 + "px) scaleX(-1)" }
            : { transform: "translate(" + window.innerWidth + "px," + window.innerHeight * 0.4 + "px)" },
          way > 0
            ? { transform: "translate(" + window.innerWidth + "px," + window.innerHeight * 0.3 + "px) scaleX(-1)" }
            : { transform: "translate(" + -w + "px," + window.innerHeight * 0.15 + "px)" }
        ],
        { duration: 1700, easing: "linear" }
      )
      .finished.then(function () {
        sky.remove();
      });
  }

  /* Fire Blast over the photo: flames in the shape of 大. It is born as one small flame in
     the middle of the photo and grows out into the whole character, every flame travelling
     out from the middle as it swells. The flames are gathered in one group, centred on the
     photo, so the whole character can then be thrown at once; it resolves with that group
     once the fire is fully grown. */
  function fireBlast(R) {
    var u = R * 0.32;
    var points = [
      [0, -3], [0, -2],
      [-3, -1], [-2, -1], [-1, -1], [0, -1], [1, -1], [2, -1], [3, -1],
      [0, 0],
      [-1, 1], [-2, 2], [1, 1], [2, 2]
    ];
    var GROW = 1300;
    var group = document.createElement("div");
    group.className = "pkmn-blast";
    group.style.zIndex = IN_FRONT;
    scene.appendChild(group);
    points.forEach(function (p) {
      var f = flame(p[0] * u, p[1] * u + 20, 3);
      group.appendChild(f);
      var reach = Math.hypot(p[0], p[1] + 1);
      f.animate(
        [
          { transform: "translate(" + -p[0] * u + "px," + -(p[1] + 1) * u + "px) scale(0.1)", opacity: 0 },
          { transform: "translate(" + -p[0] * u * 0.7 + "px," + -(p[1] + 1) * u * 0.7 + "px) scale(0.35)", opacity: 1, offset: 0.25 },
          { transform: "translate(0,0) scale(1)", opacity: 1 }
        ],
        { duration: ms(GROW), delay: ms(reach * 60), easing: "cubic-bezier(0.3, 0.9, 0.4, 1.15)", fill: "backwards" }
      );
    });
    return wait(ms(GROW + 3.2 * 60)).then(function () {
      return group;
    });
  }

  /* The photo's rim, charred: a ring of soot darkening to the very edge, its inner margin
     torn ragged by noise, so it reads as burnt paper rather than a drawn circle. Every
     scorch is torn differently. */
  var scorches = 0;

  function charred(R) {
    var id = "pkmn-char-" + scorches++;
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 100 100");
    svg.setAttribute("class", "pkmn-scorch");
    svg.style.left = -R + "px";
    svg.style.top = -R + "px";
    svg.style.width = svg.style.height = R * 2 + "px";
    svg.innerHTML =
      "<defs>" +
      '<radialGradient id="' + id + '-g">' +
      '<stop offset="0.58" stop-color="#451a03" stop-opacity="0"/>' +
      '<stop offset="0.74" stop-color="#78350f" stop-opacity="0.55"/>' +
      '<stop offset="0.86" stop-color="#1c0a02" stop-opacity="0.9"/>' +
      '<stop offset="1" stop-color="#0c0502" stop-opacity="1"/>' +
      "</radialGradient>" +
      '<filter id="' + id + '-f" x="-10%" y="-10%" width="120%" height="120%">' +
      '<feTurbulence type="fractalNoise" baseFrequency="0.08" numOctaves="3" seed="' + ((Math.random() * 999) | 0) + '"/>' +
      '<feDisplacementMap in="SourceGraphic" scale="18"/>' +
      "</filter>" +
      '<clipPath id="' + id + '-c"><circle cx="50" cy="50" r="50"/></clipPath>' +
      "</defs>" +
      '<g clip-path="url(#' + id + '-c)">' +
      '<circle cx="50" cy="50" r="56" fill="url(#' + id + '-g)" filter="url(#' + id + '-f)"/>' +
      "</g>";
    return svg;
  }

  function putOut(flames) {
    return Promise.all(
      flames.map(function (svg) {
        return svg.animate([{ opacity: 1 }, { opacity: 0 }], { duration: ms(500), fill: "forwards" }).finished.then(function () {
          svg.remove();
        });
      })
    );
  }

  /* Darkness over the whole page but the photo, which is lifted above it. */
  function night(on, duration, deep) {
    var veil = document.querySelector(".pkmn-night");
    if (on && !veil) {
      veil = document.createElement("div");
      /* `deep`: a real night, even and dark, the same over the light theme as the dark. */
      veil.className = "pkmn-night" + (deep ? " is-deep" : "");
      veil.setAttribute("aria-hidden", "true");
      var r = avatar.getBoundingClientRect();
      veil.style.setProperty("--x", r.left + r.width / 2 + "px");
      veil.style.setProperty("--y", r.top + r.height / 2 + "px");
      document.body.appendChild(veil);
      avatar.classList.add("is-lifted");
    } else if (!on && veil) {
      veil.animate([{ opacity: 1 }, { opacity: 0 }], { duration: ms(duration || 600), fill: "forwards" }).finished.then(function () {
        veil.remove();
        avatar.classList.remove("is-lifted");
      });
    }
  }

  /* The parts of the page a Pokémon can get its hands on. */
  function page(selector) {
    return document.querySelector(selector);
  }

  /* The page coming apart: header, content and footer each lurch their own way. Turned
     off, each part eases back from wherever the lurch had left it, rather than snapping
     into place: its pose at that instant is read, the lurch removed, and the pose
     animated back to none. Returns when the page is settled. */
  function chaos(on) {
    var settling = [];
    ["body > header", "#main-content", "body footer"].forEach(function (selector, i) {
      var el = page(selector);
      if (!el) return;
      var name = "pkmn-chaos-" + i;
      if (on) {
        el.classList.toggle(name, !still());
        return;
      }
      if (!el.classList.contains(name)) return;
      var pose = getComputedStyle(el);
      var from = { transform: pose.transform, filter: pose.filter };
      el.classList.remove(name);
      settling.push(
        el.animate([from, { transform: "none", filter: "none" }], {
          duration: ms(1100),
          easing: "cubic-bezier(0.34, 1.4, 0.5, 1)"
        }).finished
      );
    });
    return Promise.all(settling);
  }

  /* ---------------------------------------------------------------------------------
     The pixel props. One string per row, one letter per colour; "." is empty. */

  var HEART = [".rr.rr.", "rrrrrrr", "rrrrrrr", ".rrrrr.", "..rrr..", "...r..."];
  var HEART_COLOURS = { r: "#f43f5e" };
  var BOLT = ["...yy.", "..yy..", ".yy...", "yyyyy.", "...yy.", "..yy..", ".yy...", "yy....", "y....."];
  var BOLT_COLOURS = { y: "#facc15" };
  var ZED = ["zzzzz", "...z.", "..z..", ".z...", "zzzzz"];
  var ZED_COLOURS = { z: "#93c5fd" };
  var NOTE = ["..nnn", "..n.n", "..n.n", "..n..", "nnn..", "nnn.."];
  var NOTE_COLOURS = [{ n: "#a78bfa" }, { n: "#f472b6" }, { n: "#38bdf8" }, { n: "#facc15" }];
  /* The Poké Flute: a pale recorder, as the games' bag icon draws it. */
  var FLUTE = [
    "..oooooooooooooo..",
    ".owwkwwkwwkwwwwwwo",
    "oowwwwwwwwwwwwwwwo",
    ".owwwwwwwwwwwwwwbo",
    "..oooooooooooooo.."
  ];
  var FLUTE_COLOURS = { o: "#475569", w: "#e0f2fe", k: "#1e3a8a", b: "#38bdf8" };
  var QUESTION = [".qqq.", "q...q", "....q", "...q.", "..q..", ".....", "..q.."];
  var QUESTION_COLOURS = { q: "#60a5fa" };
  /* A flame in three drawings, shown in turn: leaning left, leaning right, standing tall. */
  var FIRE = [
    [
      "....r....",
      "...rr....",
      "...ror...",
      "..roor...",
      "..rooor..",
      ".rooyor..",
      ".royyoor.",
      "rooyyyor.",
      "royyyyyor",
      "royywyyor",
      "royywwyor",
      ".royyyor.",
      "..rrrrr.."
    ],
    [
      ".....r...",
      ".....rr..",
      "....ror..",
      "...roor..",
      "..rooor..",
      "..rooyor.",
      ".rooyyor.",
      ".royyyoor",
      "royyyyyor",
      "royywyyor",
      "royywwyor",
      ".royyyor.",
      "..rrrrr.."
    ],
    [
      "....r....",
      "....r....",
      "...ror...",
      "...ror...",
      "..rooor..",
      "..royor..",
      ".rooyyor.",
      ".royyyor.",
      "royyyyyor",
      "royywyyor",
      "royywwyor",
      ".royyyor.",
      "..rrrrr.."
    ]
  ];
  var FIRE_COLOURS = { r: "#b91c1c", o: "#f97316", y: "#fde047", w: "#fffbeb" };
  var DROP = [".b.", "bbb", "bwb", ".b."];
  var LEAF = ["...gg", "..ggg", ".gglg", "ggg..", "g...."];
  var SNOW = [".w.w.", "..w..", "wwwww", "..w..", ".w.w."];
  var PINK = ["..p..", "..p..", "ppwpp", "..p..", "..p.."];
  var RING = [".yyy.", "y...y", "y...y", "y...y", ".yyy."];
  var BUBBLE = [".bb.", "b..b", "b..b", ".bb."];
  var EEVEE_ART = {
    drop: [DROP, { b: "#38bdf8", w: "#e0f2fe" }],
    bolt: [["...yy.", "..yy..", ".yy...", "yyyyy.", "...yy.", "..yy..", ".yy...", "yy....", "y....."], { y: "#facc15" }],
    spark: [[".oo.", "oyyo", "oyyo", ".oo."], { o: "#f97316", y: "#fde047" }],
    leaf: [LEAF, { g: "#22c55e", l: "#bbf7d0" }],
    snow: [SNOW, { w: "#e0f2fe" }],
    pink: [PINK, { p: "#f9a8d4", w: "#ffffff" }],
    ring: [RING, { y: "#facc15" }]
  };
  /* Kadabra's spoon. */
  var SPOON = ["..ss", ".sss", ".ss.", "s...", "s...", "s..."];
  var SPOON_COLOURS = { s: "#cbd5e1" };
  var SPARK = ["yy", "yy"];
  var SPARK_COLOURS = { y: "#fde047" };
  var FIREBALL = [".ooo.", "oyyyo", "oyyyo", "oyyyo", ".ooo."];
  var FIREBALL_COLOURS = { o: "#f97316", y: "#fde047" };
  var CRUMB = ["cc", "cc"];
  var CRUMB_COLOURS = { c: "#b91c1c" };

  /* ---------------------------------------------------------------------------------
     The acts. */

  /* Pichu peeks out from behind the photo, climbs on top of it and is so happy there that
     it evolves, as Pichu does through friendship. Pikachu then shocks the photo. */
  async function pichu() {
    var R = radius;
    var mon = new Mon("pichu", R * 0.4, R * 0.55, BEHIND);
    Koi.say(["Go! PICHU!"]);
    await mon.go(R + 22, R * 0.55, 500, "ease-out");
    await wait(500);
    setTimeout(function () {
      mon.z(IN_FRONT);
    }, ms(250));
    await mon.hop(R * 0.35, -R + 8, 46, 650);
    for (var i = 0; i < 3; i++) {
      float(HEART, HEART_COLOURS, mon.x - 6 + i * 6, mon.y - 50, [i * 6 - 6, -40], 1300, i * 300);
    }
    await Koi.say(["PICHU looks very happy up here!"]);
    await evolve(mon, "pikachu");
    var told = Koi.say(["PIKACHU used THUNDERBOLT!"]);
    photo("is-zapped", true);
    [[-R - 16, -R * 0.6], [R + 4, -R * 0.2], [-R - 10, R * 0.4], [R * 0.6, R * 0.7]].forEach(function (p, k) {
      float(BOLT, BOLT_COLOURS, p[0], p[1], [0, 10], 700, k * 120);
    });
    await told;
    photo("is-zapped", false);
    mon.z(BEHIND);
    await mon.hop(R * 0.2, -R * 0.2, 30, 500);
    await mon.fade(250);
    mon.remove();
  }

  /* Charmander spits embers at the photo, which catches fire at its rim. It evolves twice,
     facing the photo all along; Charizard lets out a roar that shakes the page, sets the
     whole photo ablaze with a Flamethrower, and flies a lap round it trailing fire before
     it is gone into the sky. The fire burns down, and the photo is left a little toasted. */
  async function charmander() {
    var R = radius;
    var mon = new Mon("charmander", -R * 0.3, R + 4, BEHIND);
    mon.flip(true);
    Koi.say(["Go! CHARMANDER!"]);
    await mon.go(-R - 58, R + 4, 700, "ease-out");
    mon.z(IN_FRONT);
    await wait(300);

    var told = Koi.say(["CHARMANDER used EMBER!"]);
    for (var i = 0; i < 3; i++) {
      shoot(FIREBALL, FIREBALL_COLOURS, [mon.x + 14, mon.y - mon.h * 0.75], [-R * 0.85, R * 0.45 - i * 10], 380);
      await wait(ms(220));
    }
    var flames = [flame(-R * 0.85, R * 0.6), flame(-R * 0.6, R * 0.85, 2)];
    await told;

    await evolve(mon, "charmeleon");
    await evolve(mon, "charizard");
    /* Charizard is twice Charmander's size: it steps back to give the photo room. */
    await mon.go(-R - 92, R + 8, 400);

    /* The roar: Charizard rears up, the page shakes, a wave of heat washes over it and
       sparks spray from its jaws. */
    told = Koi.say(["CHARIZARD let out a mighty roar!"]);
    var mouth = [mon.x + mon.w * 0.3, mon.y - mon.h * 0.72];
    mon.el.style.transformOrigin = "50% 100%";
    mon.el.animate([{ scale: "1" }, { scale: "1.18" }, { scale: "1.12" }, { scale: "1.18" }, { scale: "1" }], { duration: ms(1100), easing: "ease-in-out" });
    heat();
    tremor(3);
    spray(mouth, 1);
    /* Charmander's embers go out under the roar: the scene is clear for what follows. */
    putOut(flames);
    flames = [];
    await wait(ms(1000));
    tremor(0);
    await told;

    /* Fly: it crouches and takes off, its shadow on the ground shrinking under it; then,
       high above, its shadow sweeps across the whole page. */
    told = Koi.say(["CHARIZARD used FLY!"]);
    var shadow = ground(mon.x, mon.y);
    await mon.hop(mon.x, mon.y, 6, 220);
    shadow.animate([{ opacity: 0.5, scale: "1" }, { opacity: 0, scale: "0.2" }], { duration: ms(800), fill: "forwards" });
    await mon.go(mon.x + 30, -window.innerHeight, 800, "ease-in");
    shadow.remove();
    /* It circles overhead: its shadow sweeps across the page one way, then back. */
    await skyShadow(1);
    await wait(ms(300));
    await skyShadow(-1);
    await told;

    /* Fire Blast: it dives back down beside the photo and lands with a thud, spits a ball
       of fire into it, and the fire blooms over the photo in the shape the move has had
       since the first games: the character 大, "great". */
    told = Koi.say(["CHARIZARD used FIRE BLAST!"]);
    mon.flip(false);
    mon.x = R + 64;
    mon.y = -window.innerHeight;
    mon.el.style.transform = mon.at(mon.x, mon.y);
    await mon.go(R + 64, R + 8, 550, "ease-in");
    tremor(3);
    setTimeout(function () {
      tremor(0);
    }, ms(300));
    await wait(ms(350));
    mouth = [mon.x - mon.w * 0.3, mon.y - mon.h * 0.72];
    await shoot(FIREBALL, FIREBALL_COLOURS, mouth, [-6, -R * 0.35], 320, 4);
    /* The 大 forms over the photo, then flies out of it at whoever is watching, growing
       until it leaves the screen in a wave of heat; it only crosses the photo's face in
       passing. The photo is left burning at the rim. */
    var blast = await fireBlast(R);
    await wait(ms(250));
    heat();
    tremor(2);
    photo("is-burning", true);
    await blast.animate([{ transform: "scale(1)", opacity: 1 }, { transform: "scale(7)", opacity: 0 }], { duration: ms(800), easing: "ease-in", fill: "forwards" }).finished;
    blast.remove();
    tremor(0);
    var sparks = embers([-R * 0.8, -R * 0.4, R * 0.4, R * 0.8], -R * 0.7);
    await told;
    await Koi.say(["The photo caught fire!"]);

    told = Koi.say(["CHARIZARD flew away!"]);
    mon.flip(true);
    await mon.go(R + 220, -window.innerHeight, 1000, "ease-in");
    mon.remove();
    await told;

    /* The fire burns out and leaves its mark: the photo's rim charred, for a while. */
    told = Koi.say(["The fire burned out.", "The photo is a little toasted."]);
    sparks();
    var scorch = charred(R);
    scene.appendChild(scorch);
    scorch.animate([{ opacity: 0 }, { opacity: 1 }], { duration: ms(800), fill: "forwards" });
    await putOut(flames);
    photo("is-burning", false);
    await told;
    await wait(ms(800));
    await scorch.animate([{ opacity: 1 }, { opacity: 0 }], { duration: ms(1600), easing: "ease-in", fill: "forwards" }).finished;
    scorch.remove();
  }

  /* Munchlax comes looking for food and eats its way along the red box under the photo,
     a bite at a time. It evolves; Snorlax lies down against the photo, pushing it over, and
     sleeps there, and only the Poké Flute wakes it, as in the games: the photo plays it. */
  var bitten = null;

  async function munchlax() {
    var R = radius;
    var box = page("#main-content .rounded-md.bg-primary-100");
    var mon = new Mon("munchlax", -R * 0.3, R + 4, BEHIND);
    Koi.say(["Go! MUNCHLAX!"]);
    await mon.go(-R - 30, R + 4, 600, "ease-out");
    mon.z(IN_FRONT);
    await Koi.say(["MUNCHLAX is looking for something to eat..."]);

    if (box) {
      var a = avatar.getBoundingClientRect();
      var b = box.getBoundingClientRect();
      var cx = a.left + a.width / 2;
      var top = b.top - (a.top + a.height / 2) + 2;
      var bites = [];
      var lines = [
        "MUNCHLAX took a bite out of the page!",
        "MUNCHLAX is still hungry!",
        "Munch... munch...",
        "MUNCHLAX ate its fill!"
      ];
      await mon.hop(b.left - cx + 30, top, 40, 700);
      for (var k = 0; k < lines.length; k++) {
        var at = 30 + k * 30;
        if (k) await mon.hop(b.left - cx + at, top, 12, 300);
        var told = Koi.say([lines[k]]);
        for (var chew = 0; chew < 2; chew++) await mon.hop(mon.x, top, 6, 180);
        bites.push(at);
        bite(box, bites);
        for (var c = 0; c < 5; c++) {
          float(CRUMB, CRUMB_COLOURS, mon.x - 10 + c * 5, top + 4, [c * 5 - 12, 34], 900, c * 70);
        }
        await told;
      }
      await mon.hop(-R - 30, R + 4, 40, 700);
    }

    await evolve(mon, "snorlax");

    /* Falling asleep, slowly: it sways as it yawns, sinks, and settles lying down against
       the photo, which gives under its weight. The standing sprite and the lying one
       cross-fade where it sinks, so the change of pose is never a jump. */
    var told2 = Koi.say(["SNORLAX is getting sleepy..."]);
    /* Lying beside the photo, to its left, not across it. */
    /* A little larger than its sheet, to match the standing Snorlax it replaces. */
    /* Placed where it was approved before the sprite was trimmed: the old sheet had 10px
       of empty space under it and sat 3px off centre, 12px and 4px at this scale. */
    var sleeper = new Mon("snorlax-asleep", -R - 28, R + 2);
    sleeper.resize(1.2);
    sleeper.el.style.opacity = 0;
    var base = mon.at(mon.x, mon.y);
    mon.el.style.transformOrigin = "50% 100%";
    await mon.el.animate(
      [
        { transform: base },
        { transform: base + " rotate(-7deg)" },
        { transform: base + " rotate(6deg)" },
        { transform: base + " rotate(-5deg)" },
        { transform: base + " rotate(0deg)" }
      ],
      { duration: ms(1800), easing: "ease-in-out" }
    ).finished;
    await told2;
    var settle = { duration: ms(700), easing: "ease-in", fill: "forwards" };
    mon.el.animate([{ transform: base, opacity: 1 }, { transform: base + " scale(1.15, 0.55)", opacity: 0 }], settle);
    await sleeper.el.animate([{ opacity: 0 }, { opacity: 1 }], settle).finished;
    sleeper.el.style.opacity = 1;
    mon.el.style.visibility = "hidden";
    photo("is-tilted", true);
    var snoring = still()
      ? 0
      : setInterval(function () {
          float(ZED, ZED_COLOURS, sleeper.x - 16, sleeper.y - sleeper.h, [-30, -60], 1800, 0, 3);
        }, 700);
    await Koi.say(["SNORLAX used REST!", "SNORLAX fell asleep against the photo!"]);

    /* The photo takes out the Poké Flute and plays it: notes stream out of the flute in
       waves of colour, rising high over the page. */
    /* Held at the photo's right rim, above the badge, its bell pointing out of the photo
       and up; Snorlax sleeps on the other side. */
    var flute = Koi.pixels(FLUTE, FLUTE_COLOURS, "pkmn-prop pkmn-flute", 3);
    flute.style.left = R * 0.66 + "px";
    flute.style.top = -R * 0.42 + "px";
    flute.style.zIndex = IN_FRONT;
    scene.appendChild(flute);
    photo("is-playing", true);
    var n = 0;
    var tune = still()
      ? 0
      : setInterval(function () {
          var drift = Math.sin(n / 2) * 40;
          note(NOTE_COLOURS[n % NOTE_COLOURS.length], R * 0.66 + 48, -R * 0.42 - 22, 40 + drift, -230 - (n % 3) * 30);
          n++;
        }, 170);
    await Koi.say(["The photo played the POKé FLUTE!", "Now, that's a catchy tune!"]);
    clearInterval(tune);
    clearInterval(snoring);
    photo("is-playing", false);
    flute.remove();

    /* Waking: the lying sprite fades as the standing one stretches back up. */
    photo("is-tilted", false);
    mon.el.style.visibility = "";
    mon.el.getAnimations().forEach(function (anim) {
      anim.cancel();
    });
    var wake = { duration: ms(600), easing: "ease-out" };
    sleeper.el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: ms(600), fill: "forwards" });
    await mon.el.animate(
      [
        { transform: base + " scale(1.15, 0.55)", opacity: 0 },
        { transform: base + " scale(0.92, 1.12)", opacity: 1, offset: 0.7 },
        { transform: base, opacity: 1 }
      ],
      wake
    ).finished;
    sleeper.remove();
    await Koi.say(["SNORLAX woke up!"]);
    await mon.hop(-R - 30, R + 6, 30, 650);
    await hide(mon, 1000);
  }

  /* Munchlax's bites out of the red box: round bites off its top edge, cut with a mask,
     so the box itself is never touched and comes back whole when the mask goes. */
  function bite(box, xs) {
    var layers = xs
      .map(function (x) {
        return "radial-gradient(circle 14px at " + x + "px 0, transparent 96%, #000 100%)";
      })
      .join(",");
    box.style.webkitMask = layers;
    box.style.mask = layers;
    box.style.webkitMaskComposite = xs
      .map(function () {
        return "source-in";
      })
      .join(",");
    box.style.maskComposite = "intersect";
    bitten = box;
  }

  function unbite() {
    if (!bitten) return;
    ["webkitMask", "mask", "webkitMaskComposite", "maskComposite"].forEach(function (property) {
      bitten.style[property] = "";
    });
    bitten = null;
  }

  /* Gastly seeps out of the photo's shadow while the page dims, and evolves twice. Gengar
     licks the photo, which shivers, then uses Phantom Force: it sinks into the photo, and
     the photo slowly becomes Gengar's own portrait, a prank rather than a fright. Then
     everything eases back: the portrait dissolves into the photo again, Gengar slips out
     from behind it and sinks back into the shadows as the light comes back with it. */
  async function gastly() {
    var R = radius;
    night(true);
    photo("is-shadowed", true);
    var mon = new Mon("gastly", -R * 0.2, -R * 0.1, BEHIND);
    mon.el.style.opacity = 0;
    await wait(ms(500));
    Koi.say(["Go! GASTLY!"]);
    mon.el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: ms(600), fill: "forwards" });
    await mon.go(-R - 40, -R * 0.15, 900, "ease-out");
    mon.z(IN_FRONT);
    await evolve(mon, "haunter");
    await evolve(mon, "gengar");
    await mon.go(-R - 14, -R * 0.05, 300);
    photo("is-shivering", true);
    await Koi.say(["GENGAR used LICK!", "The photo is shivering!"]);
    photo("is-shivering", false);

    var told = Koi.say(["GENGAR used PHANTOM FORCE!"]);
    mon.z(BEHIND);
    mon.go(0, R * 0.3, 600, "ease-in");
    await mon.fade(600);

    /* Gengar's portrait, in the photo's own circle: its sprite, large, on the purple of
       its shadows, fading in over the photo like a picture developing. */
    var portrait = document.createElement("div");
    portrait.className = "pkmn-portrait";
    portrait.style.left = -R + "px";
    portrait.style.top = -R + "px";
    portrait.style.width = portrait.style.height = R * 2 + "px";
    var face = document.createElement("img");
    face.src = data.gengar.url;
    face.alt = "";
    face.width = data.gengar.width * 1.7;
    face.height = data.gengar.height * 1.7;
    portrait.appendChild(face);
    scene.appendChild(portrait);
    await portrait.animate([{ opacity: 0, filter: "blur(6px)" }, { opacity: 1, filter: "blur(0)" }], { duration: ms(1100), easing: "ease-out", fill: "forwards" }).finished;
    await told;
    await Koi.say(["GENGAR took the photo's place!"]);
    await Koi.say(["It was just a prank!"]);

    /* And back, slowly: the portrait dissolves into the photo, Gengar slips out from behind
       it, and as it sinks away the dark and the photo's shade lift with it. */
    await portrait.animate([{ opacity: 1, filter: "blur(0)" }, { opacity: 0, filter: "blur(6px)" }], { duration: ms(1500), easing: "ease-in-out", fill: "forwards" }).finished;
    portrait.remove();
    mon.el.getAnimations().forEach(function (anim) {
      anim.cancel();
    });
    mon.z(IN_FRONT);
    mon.el.style.opacity = 0;
    mon.el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: ms(1000), fill: "forwards" });
    await mon.go(R + 34, R * 0.15, 1000, "ease-out");
    await mon.hop(mon.x, mon.y, 10, 400);
    var gone = Koi.say(["GENGAR vanished into the shadows!"]);
    await wait(ms(400));
    mon.z(BEHIND);
    mon.go(0, 0, 1400, "ease-in-out");
    await mon.fade(1400);
    /* Only once it has gone does the light come back, slowly, the photo sweeping through
       green to its own colours: the photo's usual quick transition is lengthened for it. */
    var picture = avatar.firstElementChild;
    picture.style.transition = "filter " + ms(2000) / 1000 + "s ease-in-out";
    night(false, 2000);
    photo("is-shadowed", false);
    await gone;
    await wait(ms(1200));
    picture.style.transition = "";
    mon.remove();
  }

  /* Ditto lands on the photo and transforms into four of the other Pokémon of this ball,
     drawn at random each time from every sprite the site has, each in Ditto's own purple. Then it tries the author: it hops
     onto the name under the photo and uses Transform, not on itself but on the page: letter by letter the name, the headline and the line in the
     red box turn into Ditto, in Ditto's purple, wobbling like the jelly it is, until it
     cannot keep it up and every word goes back to what it was.

     What each one becomes is worked out from whatever it says at the time, by rule, so
     the act survives any change to the homepage's text: every word of the name becomes
     "Ditto", and in the headline and the red box the last word of every clause does. */
  var DITTO_LETTERS = "DITO?";
  var DITTO_COPIES = 4; // how many Pokémon Ditto copies before it tries the author
  /* Sprites that are poses or forms of a Pokémon already listed, not Pokémon of their own:
     Ditto does not copy someone lying asleep. */
  var DITTO_SKIPS = ["ditto", "snorlax-asleep"];

  /* Whom Ditto copies this time: any of the Pokémon the site has sprites for, drawn afresh
     on every press, so it grows with the roster without being told. */
  function dittoForms() {
    var pool = Object.keys(data).filter(function (key) {
      return DITTO_SKIPS.indexOf(key) < 0;
    });
    for (var i = pool.length - 1; i > 0; i--) {
      var j = (Math.random() * (i + 1)) | 0;
      var swap = pool[i];
      pool[i] = pool[j];
      pool[j] = swap;
    }
    return pool.slice(0, DITTO_COPIES);
  }
  var transformed = [];

  async function ditto() {
    var R = radius;
    var section = avatar.parentElement;
    var heading = section.querySelector("h1");
    var headline = section.querySelector("h2");
    var box = page("#main-content .rounded-md.bg-primary-100");
    var targets = [
      [heading, true],
      [headline, false],
      [box && box.lastElementChild, false]
    ]
      .filter(function (target) {
        return target[0];
      })
      .map(function (target) {
        return [target[0], dittoify(target[0].textContent.trim(), target[1])];
      });

    /* Only the sprites of this time's copies are fetched, while Ditto drops in. */
    var forms = dittoForms();
    var ready = preload(forms);
    var mon = new Mon("ditto", R * 0.1, -R - 150);
    mon.el.style.opacity = 0;
    mon.el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: ms(200), fill: "forwards" });
    Koi.say(["Go! DITTO!"]);
    await mon.go(R * 0.1, -R + 6, 700, "cubic-bezier(0.3, 1.5, 0.6, 1)");

    /* On top of the photo it copies four of the ball's Pokémon, one after another, in its
       own purple and wobbling: it never quite gets the colour. */
    var told = Koi.say(["DITTO used TRANSFORM!"]);
    await Promise.all([told, ready]);
    mon.el.classList.add("is-ditto-form");
    for (var f = 0; f < forms.length; f++) {
      burst(mon.x, mon.y - mon.h / 2);
      mon.show(forms[f]);
      await mon.hop(mon.x, mon.y, 14, 320);
      await Koi.say(["DITTO transformed into " + name(forms[f]) + "!"]);
    }
    burst(mon.x, mon.y - mon.h / 2);
    mon.show("ditto");
    mon.el.classList.remove("is-ditto-form");

    /* And then it tries its hardest copy: the author, by way of the page's own words. */
    await Koi.say(["Now DITTO wants to transform into YOU!"]);
    if (heading) {
      var a = avatar.getBoundingClientRect();
      var h = heading.getBoundingClientRect();
      await mon.hop(h.right - (a.left + a.width / 2) - 20, h.top - (a.top + a.height / 2) + 6, 40, 650);
    }
    told = Koi.say(["DITTO used TRANSFORM!"]);
    burst(mon.x, mon.y - 16);
    transformed = targets.map(function (target) {
      return { el: target[0], text: target[0].textContent };
    });
    targets.forEach(function (target) {
      target[0].setAttribute("aria-label", target[0].textContent.trim());
      target[0].classList.add("pkmn-dittoed");
    });
    await Promise.all(
      targets.map(function (target) {
        return morph(target[0], target[1]);
      })
    );
    await told;
    await Koi.say(["DITTO transformed into... DITTO?"]);
    /* It loses its grip on every shape at once: it flickers through all four copies,
       faster and faster, while the page's words come back, and collapses into a puddle of
       itself. */
    var losing = Koi.say(["It couldn't keep it up!"]);
    burst(mon.x, mon.y - 16);
    var restoring = Promise.all(
      transformed.map(function (saved) {
        return morph(saved.el, saved.text.trim());
      })
    );
    if (!still()) {
      mon.el.classList.add("is-ditto-form");
      var beat = 220;
      for (var k = 0; k < forms.length * 3; k++) {
        mon.show(forms[k % forms.length]);
        await wait(beat);
        beat = Math.max(50, beat * 0.82);
      }
      mon.show("ditto");
      mon.el.classList.remove("is-ditto-form");
      burst(mon.x, mon.y - 16);
      mon.el.style.transformOrigin = "50% 100%";
      await mon.el.animate([{ scale: "1 1" }, { scale: "1.6 0.4" }, { scale: "0.9 1.15" }, { scale: "1 1" }], { duration: ms(700), easing: "ease-out" }).finished;
    }
    await restoring;
    await losing;
    undoDitto();
    await mon.hop(R + 30, R + 4, 40, 650);
    await mon.hop(R + 60, R + 4, 18, 350);
    await hide(mon);
  }

  /* A text as Ditto would have it: every word "Ditto", or only the last word before each
     comma, full stop or other mark that ends a clause, and the one at the very end. */
  function dittoify(text, everyWord) {
    var WORD = /[A-Za-zÀ-ÖØ-öø-ÿ'’-]+/g;
    if (everyWord) return text.replace(WORD, "Ditto");
    return text.replace(/([^,.;:!?]*?)([A-Za-zÀ-ÖØ-öø-ÿ'’-]+)(\s*(?:[,.;:!?]+|$))/g, function (all, before, word, end) {
      return before + "Ditto" + end;
    });
  }

  /* Changes an element's text into another, a few more letters settling every step, the
     rest still Ditto's scramble. */
  async function morph(el, to) {
    var from = el.textContent.trim();
    var length = Math.max(from.length, to.length);
    var STEPS = still() ? 0 : 12;
    for (var k = 1; k <= STEPS; k++) {
      var settled = Math.round((length * k) / STEPS);
      var out = "";
      for (var i = 0; i < length; i++) {
        if (i < settled) out += to.charAt(i);
        else if (from.charAt(i) === " " || to.charAt(i) === " ") out += " ";
        else out += DITTO_LETTERS.charAt((Math.random() * DITTO_LETTERS.length) | 0);
      }
      el.textContent = out;
      await wait(55);
    }
    el.textContent = to;
  }

  /* Puts every word Ditto took back as it was, whether the act finished or not. */
  function undoDitto() {
    transformed.forEach(function (saved) {
      saved.el.textContent = saved.text;
      saved.el.classList.remove("pkmn-dittoed");
      saved.el.removeAttribute("aria-label");
    });
    transformed = [];
  }

  /* Psyduck waddles out with its headache, which spins the photo round. The headache
     builds, a step at a time, the page trembling harder and a psychic glow rising round
     Psyduck, until it lets loose a Confusion that sends the whole page lurching. Then, as
     the Pokédex says of it, it remembers nothing: it wanders off the wrong way, walks
     into the photo, and leaves as confused as it came. */
  async function psyduck() {
    var R = radius;
    var mon = new Mon("psyduck", -R * 0.4, R + 4, BEHIND);
    Koi.say(["Go! PSYDUCK!"]);
    await mon.go(-R - 26, R + 4, 600, "ease-out");
    mon.z(IN_FRONT);
    var told = Koi.say(["PSYDUCK is confused!"]);
    for (var i = 0; i < 3; i++) {
      float(QUESTION, QUESTION_COLOURS, mon.x - 10 + i * 10, mon.y - mon.h - 4, [0, -22], 1200, i * 350);
    }
    photo("is-confused", true);
    await told;
    photo("is-confused", false);

    /* The build-up: three steps, each a little worse. */
    var steps = [
      "PSYDUCK's headache is getting worse...",
      "PSYDUCK is holding its head...",
      "Something is about to happen..."
    ];
    for (var k = 0; k < steps.length; k++) {
      told = Koi.say([steps[k]]);
      tremor(k + 1);
      mon.el.classList.add("is-psychic-" + (k + 1));
      for (var q = 0; q <= k; q++) {
        float(QUESTION, QUESTION_COLOURS, mon.x - 14 + q * 12, mon.y - mon.h - 4, [0, -26], 1100, q * 200, 2 + (k > 1 ? 1 : 0));
      }
      for (var hops = 0; hops < 2 + k; hops++) await mon.hop(mon.x, mon.y, 6 + k * 3, 260 - k * 40);
      await told;
      await wait(ms(400));
    }

    told = Koi.say(["PSYDUCK used CONFUSION!"]);
    tremor(0);
    flash();
    chaos(true);
    for (var z = 0; z < 10; z++) {
      float(QUESTION, QUESTION_COLOURS, (Math.random() - 0.5) * R * 3.4, (Math.random() - 0.5) * R * 2.4, [0, -34], 1100, z * 140, 3);
    }
    await told;
    await wait(ms(1200));
    await chaos(false);
    [1, 2, 3].forEach(function (level) {
      mon.el.classList.remove("is-psychic-" + level);
    });

    /* And it forgets all of it. */
    await wait(ms(500));
    told = Koi.say(["...", "PSYDUCK doesn't remember a thing."]);
    float(QUESTION, QUESTION_COLOURS, mon.x - 5, mon.y - mon.h - 4, [0, -20], 1600, 0, 3);
    await told;
    await mon.go(-R * 0.75, R + 4, 700);
    photo("is-bumped", true);
    await mon.hop(-R - 20, R + 4, 14, 350);
    photo("is-bumped", false);
    await Koi.say(["PSYDUCK walked into the photo."]);
    await hide(mon, 1000);
  }

  /* The page trembling under Psyduck's headache, from 1 (barely) to 3; 0 stops it. */
  function tremor(level) {
    if (still()) return;
    ["body > header", "#main-content", "body footer"].forEach(function (selector) {
      var el = page(selector);
      if (!el) return;
      [1, 2, 3].forEach(function (l) {
        el.classList.toggle("pkmn-tremor-" + l, l === level);
      });
    });
  }

  /* A flash over the whole page, for the moment the Confusion goes off. */
  function flash() {
    if (still()) return;
    var light = document.createElement("div");
    light.className = "pkmn-flash";
    light.setAttribute("aria-hidden", "true");
    document.body.appendChild(light);
    setTimeout(function () {
      light.remove();
    }, 700);
  }


  /* ---------------------------------------------------------------------------------
     Eevee. Eevee evolves by a stone, or by friendship by day or by night, and here the
     photo provides the means: a stone appears on Caesar's Window, the badge on the photo,
     or the photo shines like the sun or the moon. Pressed at random, the evolution is drawn
     at random, friendship following the site's theme (light for Espeon's day, dark for
     Umbreon's night); from the Pokédex any one of them can be chosen. Each evolution then
     shows the page what it can do, in a weather of its own. */

  var EEVEE_PATHS = {
    vaporeon: { dex: 134, stone: "water", stoneName: "WATER STONE", move: "VAPOREON used WATER GUN!", after: "The page is flooding!", show: flood },
    jolteon: { dex: 135, stone: "thunder", stoneName: "THUNDER STONE", move: "JOLTEON used THUNDER!", after: "Lightning struck the photo!", show: thunder },
    flareon: { dex: 136, stone: "fire", stoneName: "FIRE STONE", move: "FLAREON used FIRE SPIN!", after: "The photo is trapped in a ring of fire!", show: fireSpin },
    espeon: { dex: 196, charm: "sun", line: "Caesar's Window is shining like the sun!", move: "ESPEON used PSYCHIC!", after: "The whole page is floating!", show: psychic },
    umbreon: { dex: 197, charm: "moon", line: "Caesar's Window is shining like the moon!", move: "UMBREON used MOONLIGHT!", after: "Night fell over the page.", show: moonlight },
    leafeon: { dex: 470, stone: "leaf", stoneName: "LEAF STONE", move: "LEAFEON used LEAF STORM!", after: "A gust of leaves swept the page!", show: leafStorm },
    glaceon: { dex: 471, stone: "ice", stoneName: "ICE STONE", move: "GLACEON used BLIZZARD!", after: "The photo froze solid!", show: blizzard },
    sylveon: { dex: 700, charm: "heart", line: "Caesar's Window turned into a heart!", move: "SYLVEON used DAZZLING GLEAM!", after: "SYLVEON tied its bow on the photo!", show: dazzlingGleam }
  };
  var EEVEE_FORMS = Object.keys(EEVEE_PATHS);
  var moonGem = null; // the moon left on the badge for Umbreon's Moonlight

  /* Where the text box sits, so nothing is scattered behind it. */
  function clearOfBox(x, y) {
    return y < window.innerHeight - 130;
  }

  /* The evolution stones, drawn: a gem of the element's colour with its symbol inside.
     The ice stone is a cut crystal, so it never reads as the water stone. */
  var ROUND = [
    "....bbbb....",
    "..bbbbbbbb..",
    ".bbbbbbbbbb.",
    ".bbbbbbbbbb.",
    "bbbbbbbbbbbb",
    "bbbbbbbbbbbb",
    "bbbbbbbbbbbb",
    "bbbbbbbbbbbd",
    ".bbbbbbbbbd.",
    ".bbbbbbbbdd.",
    "..bbbbbbdd..",
    "....dddd...."
  ];
  var CRYSTAL = [
    ".....bb.....",
    "....bbbb....",
    "...bbbbbb...",
    "..bbbbbbbb..",
    ".bbbbbbbbbb.",
    "bbbbbbbbbbbb",
    "bbbbbbbbbbbd",
    ".bbbbbbbbbd.",
    "..bbbbbbbd..",
    "...bbbbbd...",
    "....bbdd....",
    ".....dd....."
  ];
  /* Friendship and affection, drawn on the badge instead of a stone: the sun of Espeon's
     day, the moon of Umbreon's night, the heart of Sylveon's affection. */
  var CHARMS = {
    sun: [[
      ".....y.....",
      ".y...y...y.",
      "..y.ooo.y..",
      "...ooooo...",
      "..ooowooo..",
      "yyoowwwooyy",
      "..ooowooo..",
      "...ooooo...",
      "..y.ooo.y..",
      ".y...y...y.",
      ".....y....."
    ], { y: "#fde047", o: "#f59e0b", w: "#fffbeb" }],
    moon: [[
      "....mmm....",
      "..mmmm.....",
      ".mmmm......",
      ".mmm.......",
      "mmmm.......",
      "mmmd.......",
      "mmmd.......",
      ".mmmd......",
      ".mmmmd...m.",
      "..mmmmmmm..",
      "....mmm...."
    ], { m: "#fef3c7", d: "#fbbf24" }],
    heart: [[
      "..pp...pp..",
      ".pppp.pppp.",
      "ppwpppppppp",
      "pwppppppppp",
      "ppppppppppp",
      ".ppppppppp.",
      "..ppppppp..",
      "...ppppp...",
      "....ppp....",
      ".....p....."
    ], { p: "#f472b6", w: "#ffffff" }]
  };

  /* Sylveon's bow, tied on the photo. */
  var BOW = [
    "dd.........dd",
    "dpd.......dpd",
    "dpwd.....dppd",
    "dpwpd...dpppd",
    "dpppdd.ddpppd",
    "dppppdddppppd",
    "dpppdd.ddpppd",
    "dppd..dpd.dpd",
    "ddd..dpd..ddd",
    ".....dpd.....",
    "....dpd.dd...",
    "....dd...d..."
  ];
  var BOW_COLOURS = { p: "#f9a8d4", d: "#be185d", w: "#fdf2f8" };

  var SYMBOLS = {
    water: ["..s...", ".sss..", "sssss.", "sssss.", ".sss..", "......"],
    thunder: ["...ss.", "..ss..", ".ssss.", "...ss.", "..ss..", ".s...."],
    fire: ["..s...", ".ss.s.", ".ssss.", "ssssss", "ssssss", ".ssss."],
    leaf: ["....ss", "..sss.", ".ssss.", "ssss..", "s.s...", "s....."],
    ice: [".s.s..", "..s...", "sssss.", "..s...", ".s.s..", "......"]
  };
  var STONE_COLOURS = {
    water: { b: "#3b82f6", d: "#1e3a8a", s: "#e0f2fe" },
    thunder: { b: "#facc15", d: "#a16207", s: "#7c2d12" },
    fire: { b: "#f97316", d: "#9a3412", s: "#fde047" },
    leaf: { b: "#22c55e", d: "#14532d", s: "#dcfce7" },
    ice: { b: "#a5f3fc", d: "#0e7490", s: "#ffffff" }
  };

  function stoneArt(stone) {
    var base = stone === "ice" ? CRYSTAL : ROUND;
    var symbol = SYMBOLS[stone];
    return base.map(function (row, y) {
      return row
        .split("")
        .map(function (c, x) {
          var sy = y - 3;
          var sx = x - 3;
          if (c !== "." && sy >= 0 && sy < symbol.length && symbol[sy][sx] === "s") return "s";
          return c;
        })
        .join("");
    });
  }

  async function eevee(chosen) {
    var R = radius;
    var badge = page(".cw-avatar .cw-badge");
    var form = chosen;
    if (!form) {
      /* At random: a stone, affection, or friendship, which the theme decides. */
      var draw = EEVEE_FORMS.filter(function (f) {
        return f !== "espeon" && f !== "umbreon";
      }).concat(["friendship"]);
      form = draw[(Math.random() * draw.length) | 0];
      if (form === "friendship") form = document.documentElement.classList.contains("dark") ? "umbreon" : "espeon";
    }
    var path = EEVEE_PATHS[form];
    see("eevee:" + form);
    var kind;
    var loading = preload([form]);

    var mon = new Mon("eevee", R * 0.3, R + 4, BEHIND);
    Koi.say(["Go! EEVEE!"]);
    await mon.go(R + 48, R + 4, 700, "ease-out");
    /* A layer above the stone it is about to touch, so it is never seen behind it. */
    mon.z(IN_FRONT + 1);
    await Koi.say(["EEVEE is curious about Caesar's Window..."]);
    await mon.hop(R + 32, R + 4, 16, 380);
    await mon.hop(R + 40, R + 4, 10, 300);

    /* The stone, drawn on the badge, glinting; or the photo's light. */
    var stone = null;
    var glints = 0;
    var b = badge ? badge.getBoundingClientRect() : null;
    var a = avatar.getBoundingClientRect();
    var bx = b ? b.left + b.width / 2 - (a.left + a.width / 2) : R * 0.75;
    var by = b ? b.top + b.height / 2 - (a.top + a.height / 2) : R * 0.75;
    /* A stone, or a charm (the sun, the moon, a heart), drawn on the badge, glinting. */
    var kind = path.stone || path.charm;
    stone = path.stone
      ? Koi.pixels(stoneArt(path.stone), STONE_COLOURS[path.stone], "pkmn-prop pkmn-stone-gem", 3)
      : Koi.pixels(CHARMS[path.charm][0], CHARMS[path.charm][1], "pkmn-prop pkmn-stone-gem", 3);
    stone.style.left = bx - 17 + "px";
    stone.style.top = by - 17 + "px";
    stone.style.zIndex = IN_FRONT;
    scene.appendChild(stone);
    if (badge) badge.classList.add("pkmn-stone", "pkmn-stone-" + kind);
    burst(bx, by);
    glints = still()
      ? 0
      : setInterval(function () {
          float(PINK, { p: "#fef9c3", w: "#ffffff" }, bx + (Math.random() - 0.5) * 50, by + (Math.random() - 0.5) * 50, [0, -14], 700, 0, 2);
        }, 180);
    if (path.stone) {
      await Koi.say(["A " + path.stoneName + " appeared on Caesar's Window!"]);
      await mon.hop(bx + 26, R + 4, 18, 380);
      await Koi.say(["EEVEE touched the " + path.stoneName + "!"]);
    } else {
      await Koi.say([path.line]);
      await mon.hop(bx + 26, R + 4, 18, 380);
      await Koi.say(["EEVEE is very fond of you!"]);
    }
    await loading;
    clearInterval(glints);
    /* Umbreon's moon stays on the badge through the evolution: it is the moon that then
       rises into the sky. Every other stone or charm is used up. */
    moonGem = form === "umbreon" ? stone : null;
    if (stone && !moonGem) {
      burst(bx, by);
      stone.remove();
    }
    await evolve(mon, form);
    if (badge && !moonGem) badge.classList.remove("pkmn-stone", "pkmn-stone-" + kind);

    /* The evolution walks a few steps away from Caesar's Window, which it has just used,
       to give its show room. */
    await mon.go(R + 78, R + 4, 700, "ease-in-out");

    var told = Koi.say([path.move]);
    await path.show(mon, told, path.after);

    /* And walks back behind the photo, as every Pokémon does, the photo being the curtain
       they come and go behind. From where it stands it is clear of the badge, so it goes
       behind the badge too, never across it. */
    await hide(mon, 1500);
  }

  /* A layer over the whole page for an evolution's weather; gone when the act is. */
  function weather() {
    var sky = document.createElement("div");
    sky.className = "pkmn pkmn-weather";
    sky.setAttribute("aria-hidden", "true");
    document.body.appendChild(sky);
    return sky;
  }

  /* A pixel drawing travelling across the weather layer, from (x0, y0) to (x1, y1). */
  function drift(sky, art, colours, size, x0, y0, x1, y1, duration, spin) {
    var svg = Koi.pixels(art, colours, "pkmn-prop", size);
    sky.appendChild(svg);
    svg
      .animate(
        [
          { transform: "translate(" + x0 + "px," + y0 + "px) rotate(0deg)", opacity: 0 },
          { opacity: 1, offset: 0.1 },
          { opacity: 1, offset: 0.85 },
          { transform: "translate(" + x1 + "px," + y1 + "px) rotate(" + (spin || 0) + "deg)", opacity: 0 }
        ],
        { duration: duration, easing: "linear" }
      )
      .finished.then(function () {
        svg.remove();
      });
  }

  function every(ms_, fn) {
    if (still()) return function () {};
    var id = setInterval(fn, ms_);
    return function () {
      clearInterval(id);
    };
  }

  async function finishWeather(sky, told, after) {
    await told;
    await Koi.say([after]);
    await wait(ms(600));
  }

  /* Vaporeon: the page floods from the bottom, bubbles rise, and the photo floats on it. */
  async function flood(mon, told, after) {
    var sky = weather();
    var water = document.createElement("div");
    water.className = "pkmn-flood";
    sky.appendChild(water);
    photo("is-floating", true);
    var bubbles = every(110, function () {
      var x = Math.random() * window.innerWidth;
      drift(sky, BUBBLE, { b: "#e0f2fe" }, 2 + ((Math.random() * 2) | 0), x, window.innerHeight, x + (Math.random() - 0.5) * 30, window.innerHeight * 0.55, 1800);
    });
    await finishWeather(sky, told, after);
    await wait(ms(1200));
    bubbles();
    water.classList.add("is-draining");
    photo("is-floating", false);
    await wait(ms(1300));
    sky.remove();
  }

  /* Jolteon: three bolts of lightning from the top of the screen strike the photo, each
     with a flash of the whole screen. */
  async function thunder(mon, told, after) {
    var sky = weather();
    var a = avatar.getBoundingClientRect();
    var cx = a.left + a.width / 2;
    var top = a.top + 8;
    for (var k = 0; k < 3; k++) {
      var bolt = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      bolt.setAttribute("class", "pkmn-strike");
      bolt.setAttribute("width", window.innerWidth);
      bolt.setAttribute("height", window.innerHeight);
      var x = cx + (k - 1) * 18;
      var points = [];
      var steps = 9;
      for (var i = 0; i <= steps; i++) {
        points.push(x + (i === steps ? 0 : (Math.random() - 0.5) * 60) + "," + (top * i) / steps);
      }
      bolt.innerHTML =
        '<polyline points="' + points.join(" ") + '" fill="none" stroke="#fde047" stroke-width="7" stroke-linejoin="bevel"/>' +
        '<polyline points="' + points.join(" ") + '" fill="none" stroke="#fffbeb" stroke-width="3" stroke-linejoin="bevel"/>';
      sky.appendChild(bolt);
      flash();
      photo("is-zapped", true);
      tremor(2);
      await wait(ms(260));
      bolt.remove();
      tremor(0);
      photo("is-zapped", false);
      await wait(ms(420));
    }
    var sparks = every(140, function () {
      var angle = Math.random() * Math.PI * 2;
      float(EEVEE_ART.bolt[0], EEVEE_ART.bolt[1], Math.cos(angle) * radius * 1.05, Math.sin(angle) * radius * 1.05, [Math.cos(angle) * 24, Math.sin(angle) * 24], 600, 0, 2);
    });
    await finishWeather(sky, told, after);
    sparks();
    sky.remove();
  }

  /* Flareon: a ring of fire spinning round the photo, and a wave of heat. */
  async function fireSpin(mon, told, after) {
    var R = radius;
    var ring = document.createElement("div");
    ring.className = "pkmn-firespin";
    ring.style.zIndex = IN_FRONT;
    scene.appendChild(ring);
    for (var deg = 0; deg < 360; deg += 36) {
      var t = (deg * Math.PI) / 180;
      var f = flame(Math.cos(t) * (R + 16), Math.sin(t) * (R + 16) + 18, 3);
      ring.appendChild(f);
    }
    heat();
    photo("is-burning", true);
    var sparks = embers([-R, -R * 0.5, 0, R * 0.5, R], -R);
    await finishWeather(null, told, after);
    sparks();
    await ring.animate([{ opacity: 1 }, { opacity: 0 }], { duration: ms(700), fill: "forwards" }).finished;
    ring.remove();
    photo("is-burning", false);
  }

  /* Leafeon: a storm of leaves blows across the whole page, which sways in the gust. */
  async function leafStorm(mon, told, after) {
    var sky = weather();
    sway(true);
    var leaves = every(60, function () {
      var y = Math.random() * window.innerHeight;
      drift(sky, LEAF, { g: Math.random() < 0.5 ? "#22c55e" : "#16a34a", l: "#bbf7d0" }, 3, -30, y, window.innerWidth + 30, y + (Math.random() - 0.3) * 160, 1500 + Math.random() * 800, 540);
    });
    await finishWeather(sky, told, after);
    leaves();
    sway(false);
    await wait(ms(1600));
    sky.remove();
  }

  /* Glaceon: a blizzard over the whole page, drawn as two sheets of snow that drift down
     and across without end (a background moving, not hundreds of flakes, so it stays
     smooth on a phone), frost creeping in from the screen's edges, and the photo
     freezing slowly. Everything eases in and out together. */
  async function blizzard(mon, told, after) {
    var sky = weather();
    sky.classList.add("pkmn-blizzard");
    ["is-far", "is-near"].forEach(function (depth) {
      var snow = document.createElement("div");
      snow.className = "pkmn-snow " + depth;
      sky.appendChild(snow);
    });
    var frost = document.createElement("div");
    frost.className = "pkmn-frost";
    sky.appendChild(frost);
    photo("is-frozen", true);
    await finishWeather(sky, told, after);
    photo("is-frozen", false);
    await sky.animate([{ opacity: 1 }, { opacity: 0 }], { duration: ms(1600), easing: "ease-in-out", fill: "forwards" }).finished;
    sky.remove();
  }

  /* Espeon: Psychic lifts the photo, turning slowly, and the whole page floats with it,
     in a pink shimmer. */
  async function psychic(mon, told, after) {
    var R = radius;
    photo("is-levitating", true);
    floatPage(true);
    var shimmer = every(120, function () {
      var angle = Math.random() * Math.PI * 2;
      float(PINK, { p: "#f9a8d4", w: "#ffffff" }, Math.cos(angle) * (R + 20), Math.sin(angle) * (R + 20), [0, -20], 900, 0, 3);
    });
    await finishWeather(null, told, after);
    shimmer();
    floatPage(false);
    photo("is-levitating", false);
    await wait(ms(900));
  }

  /* Umbreon: the moon on Caesar's Window rises into the sky; a deep night falls over the
     page, the same in the light theme as in the dark; stars come out one by one, never on
     the photo or the text box; a shooting star crosses now and then; the moon's light
     falls on the photo's rim and Umbreon's rings glow. Then it all fades together. */
  async function moonlight(mon, told, after) {
    var badge = page(".cw-avatar .cw-badge");
    var from = (moonGem || badge || avatar).getBoundingClientRect();
    var a = avatar.getBoundingClientRect();
    var W = window.innerWidth;
    var H = window.innerHeight;
    night(true, 0, true);
    var sky = weather();
    var SIZE = 66; // the moon: 11 pixels at 6px
    /* High in the empty sky to the right of the photo, under the header's links. */
    var mx = Math.min(W - SIZE - 16, a.right + (W - a.right) * 0.45);
    var my = Math.max(90, a.top - SIZE * 0.6);
    var moon = Koi.pixels(CHARMS.moon[0], CHARMS.moon[1], "pkmn-prop pkmn-moon", 6);
    moon.style.transform = "translate(" + (from.left + from.width / 2 - SIZE / 2) + "px," + (from.top + from.height / 2 - SIZE / 2) + "px) scale(0.5)";
    sky.appendChild(moon);
    /* The gem on the badge and the moon in the sky are one: the moon takes over exactly
       where the gem was, and the badge goes back to Caesar's Window. */
    if (moonGem) {
      moonGem.remove();
      moonGem = null;
    }
    if (badge) badge.classList.remove("pkmn-stone", "pkmn-stone-moon");
    await moon.animate(
      [
        { transform: moon.style.transform },
        { transform: "translate(" + mx + "px," + my + "px) scale(1)" }
      ],
      { duration: ms(2000), easing: "cubic-bezier(0.45, 0, 0.25, 1)", fill: "forwards" }
    ).finished;

    /* Stars, one by one, anywhere but on the photo, the moon or the text box. */
    var placed = 0;
    for (var tries = 0; placed < 34 && tries < 400; tries++) {
      var sx = Math.random() * W;
      var sy = Math.random() * H * 0.7;
      var onPhoto = Math.hypot(sx - (a.left + a.width / 2), sy - (a.top + a.height / 2)) < a.width / 2 + 30;
      var onMoon = Math.hypot(sx - (mx + SIZE / 2), sy - (my + SIZE / 2)) < SIZE;
      if (onPhoto || onMoon || !clearOfBox(sx, sy)) continue;
      var star = Koi.pixels(PINK, { p: "#fef9c3", w: "#ffffff" }, "pkmn-prop pkmn-star", 2);
      star.style.left = sx + "px";
      star.style.top = sy + "px";
      star.style.animationDelay = ms(placed * 60) / 1000 + "s, " + -Math.random() * 2 + "s";
      sky.appendChild(star);
      placed++;
    }

    /* The moon's light, from the moon to the photo's rim, and the photo silvered by it. */
    var cx = a.left + a.width / 2;
    var cy = a.top + a.height / 2;
    var dx = cx - (mx + SIZE / 2);
    var dy = cy - (my + SIZE / 2);
    var beam = document.createElement("div");
    beam.className = "pkmn-moonbeam";
    beam.style.left = mx + SIZE / 2 + "px";
    beam.style.top = my + SIZE / 2 + "px";
    beam.style.height = Math.max(0, Math.hypot(dx, dy) - a.width / 2) + "px";
    beam.style.rotate = Math.atan2(-dx, dy) + "rad";
    sky.insertBefore(beam, moon);
    photo("is-moonlit", true);
    mon.el.classList.add("is-ringed");
    var shooting = every(1700, function () {
      var trail = document.createElement("div");
      trail.className = "pkmn-shooting";
      trail.style.top = Math.random() * Math.min(my, H * 0.25) + "px";
      sky.appendChild(trail);
      setTimeout(trail.remove.bind(trail), 1100);
    });
    await finishWeather(sky, told, after);
    await wait(ms(600));

    /* Dawn: everything fades at once, at the same pace. */
    shooting();
    mon.el.classList.remove("is-ringed");
    photo("is-moonlit", false);
    night(false, 1800);
    await sky.animate([{ opacity: 1 }, { opacity: 0 }], { duration: ms(1800), easing: "ease-in-out", fill: "forwards" }).finished;
    sky.remove();
  }

  /* Sylveon: Dazzling Gleam, a flash of white light from Sylveon with white and gold stars
     scattering and twinkling; then Sylveon ties its bow on the photo, which glows a soft
     pink, and hops for joy, hearts rising from it as it does. */
  async function dazzlingGleam(mon, told, after) {
    var R = radius;
    var sky = weather();
    var m = mon.el.getBoundingClientRect();
    var cx = m.left + m.width / 2;
    var cy = m.top + m.height / 2;
    var gleam = document.createElement("div");
    gleam.className = "pkmn-gleam";
    gleam.style.left = cx + "px";
    gleam.style.top = cy + "px";
    sky.appendChild(gleam);
    flash();
    if (!still()) {
      for (var i = 0; i < 26; i++) {
        var angle = (i / 26) * Math.PI * 2;
        var reach = 140 + Math.random() * 240;
        var tx = cx + Math.cos(angle) * reach;
        var ty = cy + Math.sin(angle) * reach;
        if (!clearOfBox(tx, ty)) ty = Math.min(ty, window.innerHeight - 140);
        drift(sky, PINK, { p: i % 3 ? "#ffffff" : "#fde68a", w: "#fffbeb" }, 3, cx, cy, tx, ty, 1500);
      }
    }
    await wait(ms(900));

    /* The bow, tied on top of the photo. */
    var SIZE = 4;
    var bow = Koi.pixels(BOW, BOW_COLOURS, "pkmn-prop pkmn-bow", SIZE);
    bow.style.left = (-BOW[0].length * SIZE) / 2 + "px";
    bow.style.top = -R - (BOW.length * SIZE) / 2 + 6 + "px";
    bow.style.zIndex = IN_FRONT;
    scene.appendChild(bow);
    photo("is-charmed", true);
    var hearts = every(380, function () {
      float(CHARMS.heart[0], CHARMS.heart[1], mon.x - 10 + Math.random() * 20, mon.y - mon.h, [(Math.random() - 0.5) * 50, -70], 1600, 0, 2);
    });
    for (var h = 0; h < 3; h++) await mon.hop(mon.x, mon.y, 12, 380);
    await finishWeather(sky, told, after);
    hearts();
    photo("is-charmed", false);
    await bow.animate([{ opacity: 1 }, { opacity: 0, transform: "translateY(-10px)" }], { duration: ms(900), easing: "ease-in", fill: "forwards" }).finished;
    bow.remove();
    sky.remove();
  }

  /* The page swaying in a gust, and the page floating on Psychic. */
  function sway(on) {
    ["body > header", "body > div.relative"].forEach(function (selector) {
      var el = page(selector);
      if (el) el.classList.toggle("pkmn-sway", on && !still());
    });
  }

  function floatPage(on) {
    ["body > header", "body > div.relative"].forEach(function (selector) {
      var el = page(selector);
      if (el) el.classList.toggle("pkmn-afloat", on && !still());
    });
  }

  /* ---------------------------------------------------------------------------------
     Jigglypuff sings into its microphone, and the whole page falls asleep, as everyone
     does in the anime. Then it sees nobody listened, jumps up and down in a fury, and does
     what it does in the anime: its microphone is also a marker, and it draws on the face
     of whoever slept. Here, a moustache on the photo, drawn pixel by pixel, left there for
     a while after the page wakes up. */

  /* The moustache, in pixels: a handlebar, its ends curling up. */
  var MUSTACHE = [
    "k............k",
    "kk.kkk..kkk.kk",
    ".kkkkkkkkkkkk.",
    "..kkkk..kkkk.."
  ];
  var MUSTACHE_COLOURS = { k: "#111827" };
  /* Jigglypuff's microphone: a round grey head on a dark handle. */
  var MIC = [".ggg.", "gwggg", "ggggg", ".ggg.", "..h..", "..h..", "..h..", "..h.."];
  var MIC_COLOURS = { g: "#cbd5e1", w: "#ffffff", h: "#f472b6" };
  /* The vein of anger the games draw over a furious Pokémon. */
  var ANGER = ["r.r.r", ".r.r.", "r...r", ".r.r.", "r.r.r"];
  var ANGER_COLOURS = { r: "#ef4444" };
  /* Where the upper lip is on the author's photo, as a share of the photo's radius from
     its centre, and the tilt of the smile. Measured on assets/img/daniel-felipe-montenegro
     .jpg: a new photo needs these measured again. */
  var LIP = { x: -0.07, y: -0.42, tilt: -7 };

  async function jigglypuff() {
    var R = radius;
    var mon = new Mon("jigglypuff", -R * 0.3, R + 4, BEHIND);
    var mic = Koi.pixels(MIC, MIC_COLOURS, "pkmn-prop pkmn-mic", 3);
    mic.style.zIndex = IN_FRONT + 1;
    scene.appendChild(mic);
    /* The microphone stays in Jigglypuff's hand, wherever it hops: placed every frame
       from where the sprite is drawn. */
    var holding = true;
    var hand = function () {
      if (!holding || !mic.isConnected) return;
      var m = mon.el.getBoundingClientRect();
      var c = scene.getBoundingClientRect();
      mic.style.left = m.right - c.left - 10 + "px";
      mic.style.top = m.top - c.top + m.height * 0.35 + "px";
      requestAnimationFrame(hand);
    };
    requestAnimationFrame(hand);

    Koi.say(["Go! JIGGLYPUFF!"]);
    await mon.go(-R - 40, R + 4, 700, "ease-out");
    mon.z(IN_FRONT);
    await mon.hop(-R - 40, R + 4, 14, 350);

    var told = Koi.say(["JIGGLYPUFF used SING!"]);
    mic.classList.add("is-singing");
    var n = 0;
    var song = still()
      ? 0
      : setInterval(function () {
          var m = mic.getBoundingClientRect();
          var c = scene.getBoundingClientRect();
          note(NOTE_COLOURS[n % 2 ? 1 : 0], m.left - c.left, m.top - c.top, (n % 2 ? 1 : -1) * 40, -170);
          n++;
        }, 260);
    /* It sways as it sings. */
    var base = mon.at(mon.x, mon.y);
    mon.el.style.transformOrigin = "50% 100%";
    var sway = mon.el.animate([{ transform: base + " rotate(-6deg)" }, { transform: base + " rotate(6deg)" }], { duration: ms(520), direction: "alternate", iterations: Infinity, easing: "ease-in-out" });
    await wait(ms(1400));
    lull(true);
    await told;
    told = Koi.say(["Jiggly... puff... jiggly... puff..."]);
    for (var z = 0; z < 4; z++) float(ZED, ZED_COLOURS, (z % 2 ? 1 : -1) * R * 0.4, -R * 0.6, [z * 6, -60], 1800, z * 500, 3);
    await told;
    clearInterval(song);
    sway.cancel();
    mic.classList.remove("is-singing");
    await Koi.say(["The whole page fell asleep!"]);

    /* Nobody listened: it puffs up, goes red and jumps up and down in a fury, the page
       shaking every time it lands. */
    await Koi.say(["JIGGLYPUFF looks around...", "Nobody listened to its song!"]);
    told = Koi.say(["JIGGLYPUFF is furious!"]);
    mon.el.classList.add("is-furious");
    var vein = Koi.pixels(ANGER, ANGER_COLOURS, "pkmn-prop pkmn-anger", 3);
    vein.style.zIndex = IN_FRONT + 1;
    vein.style.left = mon.x + 8 + "px";
    vein.style.top = mon.y - mon.h - 18 + "px";
    scene.appendChild(vein);
    mon.el.style.scale = "1.3";
    for (var jump = 0; jump < 4; jump++) {
      await mon.hop(mon.x + (jump % 2 ? 6 : -6), mon.y, 26, 300);
      tremor(2);
      setTimeout(function () {
        tremor(0);
      }, ms(120));
      vein.style.left = mon.x + 8 + "px";
    }
    /* The fury spends itself: it deflates slowly and the vein fades, before it moves on. */
    var calm = { duration: ms(600), easing: "ease-out", fill: "forwards" };
    vein.animate([{ opacity: 1 }, { opacity: 0 }], calm);
    await mon.el.animate([{ scale: "1.3" }, { scale: "1" }], calm).finished;
    mon.el.getAnimations().forEach(function (anim) {
      if (anim.effect && anim.effect.getKeyframes().some(function (k) { return k.scale; })) anim.cancel();
    });
    mon.el.style.scale = "";
    await told;
    vein.remove();

    /* It climbs onto the photo and draws the moustache on the upper lip, the marker
       travelling along it as the pixels appear. */
    var lipX = LIP.x * R;
    var lipY = LIP.y * R;
    var size = Math.max(2, Math.round((R * 0.4) / MUSTACHE[0].length));
    var width = MUSTACHE[0].length * size;
    told = Koi.say(["JIGGLYPUFF used its marker!"]);
    await mon.hop(lipX - width / 2 - 30, lipY + 30, 50, 650);
    var mustache = Koi.pixels(MUSTACHE, MUSTACHE_COLOURS, "pkmn-prop pkmn-mustache", size);
    mustache.style.left = lipX - width / 2 + "px";
    mustache.style.top = lipY - (MUSTACHE.length * size) / 2 + "px";
    mustache.style.rotate = LIP.tilt + "deg";
    mustache.style.zIndex = IN_FRONT;
    scene.appendChild(mustache);
    holding = false;
    var DRAW = ms(1400);
    mustache.animate([{ clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0 0 0)" }], { duration: DRAW, easing: "steps(" + MUSTACHE[0].length + ")", fill: "forwards" });
    /* The microphone is held upside down as a marker: its head is the nib, touching the
       lip where the next pixels appear, and it travels along the moustache in step with
       them, rising with the tilt of the smile. */
    var nib = 7.5; // half the microphone's width, so its head is centred on the line
    var rise = width * Math.sin((-LIP.tilt * Math.PI) / 180);
    mic.style.transformOrigin = "50% 0";
    mic.animate(
      [
        { left: lipX - width / 2 - nib + "px", top: lipY + rise / 2 - 2 + "px", rotate: "160deg" },
        { left: lipX + width / 2 - nib + "px", top: lipY - rise / 2 - 2 + "px", rotate: "160deg" }
      ],
      { duration: DRAW, easing: "steps(" + MUSTACHE[0].length + ")", fill: "forwards" }
    );
    await wait(DRAW + 200);

    /* Done, the microphone goes back to Jigglypuff's hand: from where it stopped, turned
       the right way up again, and then held as before. */
    mic.getAnimations().forEach(function (anim) {
      anim.commitStyles();
      anim.cancel();
    });
    var m = mon.el.getBoundingClientRect();
    var c = scene.getBoundingClientRect();
    await mic.animate(
      [
        { left: mic.style.left, top: mic.style.top, rotate: "160deg" },
        { left: m.right - c.left - 10 + "px", top: m.top - c.top + m.height * 0.35 + "px", rotate: "0deg" }
      ],
      { duration: ms(500), easing: "ease-in-out", fill: "forwards" }
    ).finished;
    mic.getAnimations().forEach(function (anim) {
      anim.cancel();
    });
    mic.style.rotate = "";
    mic.style.transformOrigin = "";
    holding = true;
    requestAnimationFrame(hand);
    await told;
    await Koi.say(["JIGGLYPUFF drew on the photo!"]);
    mon.el.classList.remove("is-furious");

    lull(false);
    await Koi.say(["The page woke up!"]);
    await Koi.say(["...with a little souvenir."]);
    await mon.hop(-R - 40, R + 4, 40, 600);
    mic.animate([{ opacity: 1 }, { opacity: 0 }], { duration: ms(600), fill: "forwards" });
    await hide(mon);
    mic.remove();
    /* The souvenir stays a while after Jigglypuff has gone. */
    await wait(ms(4000));
    await mustache.animate([{ opacity: 1 }, { opacity: 0 }], { duration: ms(1600), fill: "forwards" }).finished;
    mustache.remove();
  }

  /* The whole page falling asleep: a heavy, blurred dusk over all of it but the photo,
     which is lifted above it. */
  function lull(on) {
    var veil = document.querySelector(".pkmn-lull");
    if (on && !veil) {
      veil = document.createElement("div");
      veil.className = "pkmn-lull";
      veil.setAttribute("aria-hidden", "true");
      document.body.appendChild(veil);
      avatar.classList.add("is-lifted");
    } else if (!on && veil) {
      veil.animate([{ opacity: 1 }, { opacity: 0 }], { duration: ms(900), fill: "forwards" }).finished.then(function () {
        veil.remove();
        avatar.classList.remove("is-lifted");
      });
    }
  }

  /* ---------------------------------------------------------------------------------
     Rotom, the Pokémon that slips into machines, slips into the site's light switch:
     the theme button. Possessed, it flips the site between light and dark until Rotom
     tires of it and pops back out, and the site is left as the reader had it. The class
     on <html> is changed directly, never the preference Congo stores, so nothing of this
     outlives the act. */

  var themeWas = null;

  async function rotom() {
    var R = radius;
    var root = document.documentElement;
    var switcher = Array.prototype.slice.call(document.querySelectorAll("[id^='appearance-switcher']")).filter(function (el) {
      return el.offsetParent;
    })[0];
    var mon = new Mon("rotom", 0, -R * 0.2, BEHIND);
    mon.el.style.opacity = 0;
    mon.el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: ms(400), fill: "forwards" });
    Koi.say(["Go! ROTOM!"]);
    mon.z(IN_FRONT);
    await mon.path([[-R - 40, -R * 0.6], [R + 40, -R * 0.8], [R + 50, R * 0.3]], 1300, "ease-in-out");
    await Koi.say(["ROTOM is looking for something to possess..."]);
    if (!switcher) {
      await hide(mon);
      return;
    }

    var a = avatar.getBoundingClientRect();
    var s = switcher.getBoundingClientRect();
    var sx = s.left + s.width / 2 - (a.left + a.width / 2);
    var sy = s.top + s.height / 2 - (a.top + a.height / 2) + mon.h / 2;
    await mon.go(sx, sy, 900, "ease-in");
    burst(sx, sy - mon.h / 2);
    await mon.fade(200);
    switcher.classList.add("pkmn-possessed");

    var told = Koi.say(["ROTOM possessed the light switch!"]);
    themeWas = root.classList.contains("dark");
    /* Sparks crackle off the possessed button for as long as Rotom is in it. */
    var crackle = still()
      ? 0
      : setInterval(function () {
          var angle = Math.random() * Math.PI * 2;
          float(EEVEE_ART.bolt[0], { y: "#fb923c" }, sx + Math.cos(angle) * 16, sy - mon.h / 2 + Math.sin(angle) * 16, [Math.cos(angle) * 30, Math.sin(angle) * 30], 500, 0, 2);
        }, 120);
    var flips = still() ? [] : [500, 400, 300, 220, 160, 120, 100, 100, 140, 220, 400];
    for (var i = 0; i < flips.length; i++) {
      root.classList.toggle("dark");
      await wait(flips[i]);
    }
    await told;
    await Koi.say(["The lights are going crazy!"]);
    for (var j = 0; j < 4 && !still(); j++) {
      root.classList.toggle("dark");
      await wait(600);
    }
    clearInterval(crackle);
    restoreTheme();
    switcher.classList.remove("pkmn-possessed");

    mon.el.getAnimations().forEach(function (anim) {
      anim.cancel();
    });
    mon.el.style.opacity = 1;
    burst(sx, sy - mon.h / 2);
    await Koi.say(["ROTOM popped out of the switch!"]);
    await mon.go(R + 50, R * 0.3, 900, "ease-out");
    await hide(mon);
  }

  function restoreTheme() {
    if (themeWas === null) return;
    document.documentElement.classList.toggle("dark", themeWas);
    themeWas = null;
  }

  /* ---------------------------------------------------------------------------------
     Giratina, the Renegade, banished to the Distortion World. The photo darkens and opens
     into a rift to that world; Giratina comes out of it in its Altered Forme, then uses
     Shadow Force and drags the page through the rift with it: in the Distortion World the
     page hangs upside down, and Giratina takes its Origin Forme, as it does there. Then it
     goes back through the rift, the page rights itself, and the rift closes with the same
     slow sweep of colour as Gengar's prank. */

  async function giratina() {
    var R = radius;
    night(true);
    photo("is-shadowed", true);
    var rift = document.createElement("div");
    rift.className = "pkmn-rift";
    rift.style.left = -R + "px";
    rift.style.top = -R + "px";
    rift.style.width = rift.style.height = R * 2 + "px";
    scene.appendChild(rift);
    await rift.animate([{ opacity: 0, scale: "0.3" }, { opacity: 1, scale: "1" }], { duration: ms(1200), easing: "ease-out", fill: "forwards" }).finished;
    await Koi.say(["A rift opened in the photo!"]);

    var mon = new Mon("giratina", 0, R * 0.4);
    var base = mon.at(mon.x, mon.y);
    mon.el.style.transformOrigin = "50% 70%";
    mon.el.animate([{ transform: base + " scale(0.1)", opacity: 0 }, { transform: base + " scale(1)", opacity: 1 }], { duration: ms(1400), easing: "ease-out" });
    await wait(ms(1400));
    var told = Koi.say(["GIRATINA appeared from the DISTORTION WORLD!"]);
    await mon.go(R + 70, -R * 0.1, 1200, "ease-in-out");
    await told;

    told = Koi.say(["GIRATINA used SHADOW FORCE!"]);
    await mon.go(0, R * 0.4, 800, "ease-in");
    base = mon.at(mon.x, mon.y);
    await mon.el.animate([{ transform: base + " scale(1)", opacity: 1 }, { transform: base + " scale(0.1)", opacity: 0 }], { duration: ms(700), easing: "ease-in", fill: "forwards" }).finished;
    upside(true);
    await told;
    await wait(ms(900));
    await Koi.say(["The page was dragged into the DISTORTION WORLD!"]);

    mon.remove();

    /* In the Distortion World, Giratina comes out on a stage of its own over everything,
       never upside down itself: from the rift, wherever the turned page has put it, it
       swells to twice its size in the middle of the screen and sweeps across it, facing
       the way it flies, trailing shadows of itself, then shrinks back into the rift. On
       the turned page itself it would be upside down at the bottom of the screen, dimmed
       by the dark, and lost. */
    var sky = weather();
    var c = data["giratina-origin"];
    var giant = document.createElement("img");
    giant.className = "pkmn-giant";
    giant.src = c.url;
    giant.alt = "";
    giant.width = c.width;
    giant.height = c.height;
    sky.appendChild(giant);
    var W = window.innerWidth;
    var H = window.innerHeight;
    var BIG = Math.min(2.2, (W * 0.4) / c.width);
    var gate = rift.getBoundingClientRect();
    var gx = gate.left + gate.width / 2;
    var gy = gate.top + gate.height / 2;
    var at = function (x, y, scale, right) {
      return "translate(" + (x - c.width / 2) + "px," + (y - c.height / 2) + "px) scale(" + (right ? -scale : scale) + "," + scale + ")";
    };
    var fly = function (frames, duration, easing) {
      return giant.animate(frames, { duration: ms(duration), easing: easing || "ease-in-out", fill: "forwards" }).finished;
    };
    var shadows = every(90, function () {
      var ghost = giant.cloneNode();
      ghost.classList.add("is-ghost");
      ghost.style.transform = getComputedStyle(giant).transform;
      sky.appendChild(ghost);
      ghost.animate([{ opacity: 0.4 }, { opacity: 0 }], { duration: 700, fill: "forwards" }).finished.then(function () {
        ghost.remove();
      });
    });

    await fly([{ transform: at(gx, gy, 0.15), opacity: 0 }, { transform: at(W * 0.5, H * 0.42, BIG), opacity: 1 }], 1300, "ease-out");
    told = Koi.say(["GIRATINA changed to its ORIGIN FORME!"]);
    await fly([{ transform: at(W * 0.5, H * 0.42, BIG) }, { transform: at(W * 0.18, H * 0.3, BIG * 0.85) }], 1100);
    await fly([{ transform: at(W * 0.18, H * 0.3, BIG * 0.85, true) }, { transform: at(W * 0.82, H * 0.5, BIG * 0.85, true) }], 1700);
    await fly([{ transform: at(W * 0.82, H * 0.5, BIG * 0.85) }, { transform: at(W * 0.5, H * 0.42, BIG) }], 1100);
    await told;

    told = Koi.say(["GIRATINA returned to the DISTORTION WORLD."]);
    await fly([{ transform: at(W * 0.5, H * 0.42, BIG), opacity: 1 }, { transform: at(gx, gy, 0.15), opacity: 0 }], 1100, "ease-in");
    shadows();
    sky.remove();
    upside(false);
    await wait(ms(1400));
    var picture = avatar.firstElementChild;
    picture.style.transition = "filter " + ms(2000) / 1000 + "s ease-in-out";
    rift.animate([{ opacity: 1, scale: "1" }, { opacity: 0, scale: "0.3" }], { duration: ms(1500), easing: "ease-in", fill: "forwards" });
    night(false, 2000);
    photo("is-shadowed", false);
    await told;
    await wait(ms(1500));
    rift.remove();
    picture.style.transition = "";
  }

  /* The page upside down: the header and everything under it each turned on their own
     middle, slowly. */
  function upside(on) {
    ["body > header", "body > div.relative"].forEach(function (selector) {
      var el = page(selector);
      if (!el) return;
      el.classList.add("pkmn-turnable");
      el.classList.toggle("pkmn-upside", on && !still());
    });
  }

  /* ---------------------------------------------------------------------------------
     Abra sleeps eighteen hours a day, and teleports in its sleep: it sends the photo
     elsewhere on the page. It evolves; Kadabra, bending its spoon, sends it here and there
     faster; it evolves again, and Alakazam brings it home with Psychic. */

  var moved = null;

  async function abra() {
    var R = radius;
    moved = avatar.firstElementChild;
    /* Where the photo lands, worked out on the screen as it is, phone or desktop: anywhere
       the whole photo fits with a margin, below the header and above the text box at the
       bottom, as shares of that box. Each spot is turned into an offset from the photo's
       own place. On a phone the box is narrow and tall, so the photo jumps up and down
       more than sideways; on a desktop, the other way round. */
    var a = avatar.getBoundingClientRect();
    var r = a.width / 2;
    var homeX = a.left + r;
    var homeY = a.top + r;
    var MARGIN = 12;
    var left = MARGIN + r;
    var right = Math.max(left, window.innerWidth - MARGIN - r);
    var top = MARGIN + r + 60; // under the header's links
    var bottom = Math.max(top, window.innerHeight - r - 110); // above the text box
    var spot = function (fx, fy) {
      return [left + (right - left) * fx - homeX, top + (bottom - top) * fy - homeY];
    };
    var spots = [spot(0.05, 0.3), spot(0.95, 0.05), spot(0.5, 1), spot(0.05, 0.85), spot(0.95, 0.6), [0, 0]];

    var mon = new Mon("abra", -R * 0.3, R + 4, BEHIND);
    Koi.say(["Go! ABRA!"]);
    await mon.go(-R - 34, R + 4, 700, "ease-out");
    mon.z(IN_FRONT);
    for (var z = 0; z < 3; z++) float(ZED, ZED_COLOURS, mon.x - 6, mon.y - mon.h, [-20, -50], 1600, z * 500, 2);
    await Koi.say(["ABRA is fast asleep..."]);
    var told = Koi.say(["ABRA used TELEPORT in its sleep!"]);
    await teleport(spots[0]);
    await told;
    await Koi.say(["The photo was teleported!"]);

    await evolve(mon, "kadabra");
    var spoon = Koi.pixels(SPOON, SPOON_COLOURS, "pkmn-prop pkmn-spoon", 3);
    spoon.style.left = mon.x - 30 + "px";
    spoon.style.top = mon.y - mon.h * 0.7 + "px";
    spoon.style.zIndex = IN_FRONT;
    scene.appendChild(spoon);
    told = Koi.say(["KADABRA used TELEPORT!", "Again! And again!"]);
    for (var t = 1; t < spots.length - 1; t++) {
      await teleport(spots[t]);
      await wait(ms(450));
    }
    await told;
    spoon.remove();

    await evolve(mon, "alakazam");
    told = Koi.say(["ALAKAZAM used PSYCHIC!"]);
    mon.el.classList.add("is-psychic-2");
    moved.classList.add("pkmn-psychic-hold");
    moved.style.transition = "transform " + ms(1600) / 1000 + "s cubic-bezier(0.3, 1.3, 0.5, 1)";
    moved.style.transform = "";
    await wait(ms(1700));
    moved.classList.remove("pkmn-psychic-hold");
    mon.el.classList.remove("is-psychic-2");
    await told;
    await Koi.say(["ALAKAZAM put the photo back where it belongs."]);
    moved.style.transition = "";
    moved = null;
    await hide(mon);
  }

  /* The photo vanishing with a flash and appearing elsewhere, (dx, dy) from its place. */
  async function teleport(spot) {
    var r = moved.getBoundingClientRect();
    var a = avatar.getBoundingClientRect();
    var cx = r.left + r.width / 2 - (a.left + a.width / 2);
    var cy = r.top + r.height / 2 - (a.top + a.height / 2);
    burst(cx, cy);
    moved.style.transition = "none";
    await moved.animate([{ opacity: 1, scale: "1" }, { opacity: 0, scale: "0.2 1.4" }], { duration: ms(180), fill: "forwards" }).finished;
    moved.style.transform = "translate(" + spot[0] + "px," + spot[1] + "px)";
    burst(spot[0], spot[1]);
    await moved.animate([{ opacity: 0, scale: "0.2 1.4" }, { opacity: 1, scale: "1" }], { duration: ms(220), fill: "forwards" }).finished;
    moved.getAnimations().forEach(function (anim) {
      anim.cancel();
    });
  }

  function homePicture() {
    if (!moved) return;
    moved.getAnimations().forEach(function (anim) {
      anim.cancel();
    });
    moved.style.transform = "";
    moved.style.transition = "";
    moved.classList.remove("pkmn-psychic-hold");
    moved = null;
  }

  /* The 404 page's visitor: MissingNo., the glitch the first games turned up where
     something was missing. It is not a sprite: its block of garbage is drawn anew a few
     times a second, in the shape of the original, a reversed L of scrambled tiles.

     It is a scene of its own, and never on screen without the text box saying what it
     is: the page tears, MissingNo. pieces itself together beside Caesar's Window and
     scrambles the 404, jumps round the window glitching it at every landing, and comes
     apart again as it flees. */
  var TILE = 4; // pixels per tile
  var COLS = 6;
  var ROWS = 8;
  var SCALE = 3; // CSS px per pixel
  var GLITCH = ["#1f2937", "#6b7280", "#d1d5db", "#ffffff", "#7c3aed", "#f472b6"];
  var SCRAMBLE = "4044?#%&@$0Ø▓░▒";

  async function missingno() {
    var stage = document.createElement("div");
    stage.className = "pkmn";
    stage.setAttribute("aria-hidden", "true");
    document.body.appendChild(stage);

    var canvas = document.createElement("canvas");
    canvas.width = TILE * COLS;
    canvas.height = TILE * ROWS;
    canvas.className = "pkmn-prop pkmn-glitch";
    var width = canvas.width * SCALE;
    var height = canvas.height * SCALE;
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    var ctx = canvas.getContext("2d");

    /* The tiles of the L, in a shuffled order: it appears and disappears a tile at a time. */
    var tiles = [];
    for (var ty = 0; ty < ROWS; ty++) {
      for (var tx = 0; tx < COLS; tx++) {
        if (!(ty < 4 && tx < 3)) tiles.push([tx, ty]);
      }
    }
    tiles.sort(function () {
      return Math.random() - 0.5;
    });
    var shown = 0;
    function scramble() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (var t = 0; t < shown; t++) {
        for (var p = 0; p < TILE * TILE; p++) {
          ctx.fillStyle = GLITCH[(Math.random() * GLITCH.length) | 0];
          ctx.fillRect(tiles[t][0] * TILE + (p % TILE), tiles[t][1] * TILE + ((p / TILE) | 0), 1, 1);
        }
      }
    }

    var win = document.querySelector(".cw-404-window");
    var heading = document.querySelector(".cw-404 h1");
    var r = win ? win.getBoundingClientRect() : { left: window.innerWidth / 2 - 80, right: window.innerWidth / 2 + 80, top: 120, bottom: 280, height: 160 };
    var mid = r.top + r.height / 2 - height / 2;
    /* Where it lands, round the window: right, above left, left, below right, and right
       again, kept inside the screen. */
    var spots = [
      [r.right + 28, mid],
      [r.left - width - 28, r.top - 20],
      [r.left - width - 36, mid + 30],
      [r.right + 12, r.bottom - height + 30],
      [r.right + 28, mid]
    ].map(function (spot) {
      return [
        Math.max(12, Math.min(spot[0], window.innerWidth - width - 12)),
        Math.max(12, Math.min(spot[1], window.innerHeight - height - 110))
      ];
    });
    function land(spot) {
      canvas.style.transform = "translate(" + spot[0] + "px," + spot[1] + "px)";
    }

    var noise = still() ? 0 : setInterval(scramble, 120);

    /* The page tears. */
    if (!still()) {
      var tear = document.createElement("div");
      tear.className = "pkmn-tear";
      stage.appendChild(tear);
      setTimeout(function () {
        tear.remove();
      }, 500);
      await wait(350);
    }

    /* It pieces itself together, a tile at a time. */
    land(spots[0]);
    stage.appendChild(canvas);
    /* Each line is queued before the one before it ends, so the box never closes while
       MissingNo. is on screen. */
    var told = Koi.say(["A wild MISSINGNO. appeared!"]);
    var next = Koi.say(["It came looking for this page too."]);
    for (shown = 0; shown < tiles.length; shown += 3) {
      scramble();
      await wait(ms(40));
    }
    shown = tiles.length;
    scramble();

    /* The 404 does not survive it. */
    if (heading && !still()) {
      var original = heading.textContent;
      heading.setAttribute("aria-label", original.trim());
      for (var k = 0; k < 14; k++) {
        heading.textContent = original.trim().replace(/./g, function () {
          return SCRAMBLE[(Math.random() * SCRAMBLE.length) | 0];
        });
        await wait(80);
      }
      heading.textContent = original;
      heading.removeAttribute("aria-label");
    }
    await told;

    /* It jumps round the window, which glitches every time it lands. */
    var fled = null;
    if (!still()) {
      for (var j = 1; j < spots.length; j++) {
        if (j === spots.length - 1) fled = Koi.say(["The wild MISSINGNO. fled!"]);
        canvas.style.visibility = "hidden";
        await wait(100);
        land(spots[j]);
        canvas.style.visibility = "";
        if (win) {
          win.classList.add("is-glitched");
          setTimeout(win.classList.remove.bind(win.classList, "is-glitched"), 160);
        }
        await wait(400);
      }
    }
    if (!fled) fled = Koi.say(["The wild MISSINGNO. fled!"]);
    await next;

    /* And it flees, coming apart as it goes. */
    told = fled;
    while (shown > 0) {
      shown -= 3;
      scramble();
      await wait(ms(40));
    }
    clearInterval(noise);
    stage.remove();
    await told;
  }

  /* Every act, with the National Dex number it is listed under in the Pokédex. */
  var ACTS = {
    charmander: { dex: 4, keys: ["charmander", "charmeleon", "charizard"], play: charmander, weight: 3 },
    psyduck: { dex: 54, keys: ["psyduck"], play: psyduck, weight: 3 },
    gastly: { dex: 92, keys: ["gastly", "haunter", "gengar"], play: gastly, weight: 3 },
    ditto: { dex: 132, keys: ["ditto"], play: ditto, weight: 3 },
    pichu: { dex: 172, keys: ["pichu", "pikachu"], play: pichu, weight: 3 },
    munchlax: { dex: 446, keys: ["munchlax", "snorlax", "snorlax-asleep"], play: munchlax, weight: 3 },
    jigglypuff: { dex: 39, keys: ["jigglypuff"], play: jigglypuff, weight: 3 },
    abra: { dex: 63, keys: ["abra", "kadabra", "alakazam"], play: abra, weight: 3 },
    eevee: { dex: 133, keys: ["eevee"], play: eevee, weight: 3, variants: EEVEE_FORMS },
    rotom: { dex: 479, keys: ["rotom"], play: rotom, weight: 3 },
    giratina: { dex: 487, keys: ["giratina", "giratina-origin"], play: giratina, weight: 2 }
  };

  /* A weighted draw, never the same act twice in a row. */
  function draw() {
    var pool = Object.keys(ACTS).filter(function (key) {
      return key !== previous;
    });
    var total = pool.reduce(function (sum, key) {
      return sum + ACTS[key].weight;
    }, 0);
    var roll = Math.random() * total;
    for (var i = 0; i < pool.length; i++) {
      roll -= ACTS[pool[i]].weight;
      if (roll < 0) return pool[i];
    }
    return pool[0];
  }

  /* ---------------------------------------------------------------------------------
     The Pokédex: what holding the ball down opens. It lists every act, and any of them
     can be chosen. The ones this visitor has already met show their name and sprite; the
     others are a silhouette and "???", and choosing one is how it is met. What has been
     met is remembered in this browser only, and nothing breaks where it cannot be. */

  var SEEN = "koi-pokedex";
  var dexMenu = null;

  function seen() {
    try {
      return JSON.parse(localStorage.getItem(SEEN)) || [];
    } catch (e) {
      return [];
    }
  }

  function see(act) {
    try {
      var list = seen();
      if (list.indexOf(act) < 0) {
        list.push(act);
        localStorage.setItem(SEEN, JSON.stringify(list));
      }
    } catch (e) {}
  }

  function pad(n) {
    return ("00" + n).slice(-3);
  }

  function dex(ball) {
    if (dexMenu) {
      closeDex();
      return;
    }
    load().then(function () {
      /* Only what is still on the list counts: a visitor may have met Pokémon this page no
         longer has. */
      var met = seen().filter(function (act) {
        return ACTS[act];
      });
      var keys = Object.keys(ACTS).sort(function (a, b) {
        return ACTS[a].dex - ACTS[b].dex;
      });

      dexMenu = document.createElement("div");
      dexMenu.className = "pkmn-dex";
      dexMenu.setAttribute("role", "dialog");
      dexMenu.setAttribute("aria-label", "Pokédex");
      var title = document.createElement("p");
      title.className = "pkmn-dex-title";
      title.innerHTML = "<span>POKéDEX</span><span>SEEN " + met.length + "/" + keys.length + "</span>";
      dexMenu.appendChild(title);

      var list = document.createElement("ul");
      var all = seen();
      /* One entry: its number, sprite and name, or a silhouette and "???" when not yet
         met. `more` marks one that opens a page of its own. */
      function entry(no, sprite, label, known, choose, more) {
        var item = document.createElement("li");
        var button = document.createElement("button");
        button.type = "button";
        button.className = "pkmn-dex-entry" + (known ? "" : " is-unseen");
        button.setAttribute("aria-label", known ? label : "Unknown Pokémon, number " + no);
        button.innerHTML =
          '<span class="pkmn-dex-no">' + (no === null ? "" : pad(no)) + "</span>" +
          (sprite ? '<img src="' + sprite.url + '" alt="" width="' + sprite.width + '" height="' + sprite.height + '">' : "<span></span>") +
          '<span class="pkmn-dex-name">' + (known ? label.toUpperCase() : "???") + (more ? " ▸" : "") + "</span>";
        button.addEventListener("click", choose);
        item.appendChild(button);
        list.appendChild(item);
        return button;
      }
      /* The Pokédex's first page: every Pokémon. One with variants (Eevee) opens a second
         page instead of playing at once, so its evolutions never crowd the list. */
      function front() {
        list.innerHTML = "";
        title.innerHTML = "<span>POKéDEX</span><span>SEEN " + met.length + "/" + keys.length + "</span>";
        keys.forEach(function (act) {
          var first = data[ACTS[act].keys[0]];
          if (ACTS[act].variants) {
            entry(ACTS[act].dex, first, first.name, met.indexOf(act) >= 0, function () {
              variants(act);
            }, true);
          } else {
            entry(ACTS[act].dex, first, first.name, met.indexOf(act) >= 0, function () {
              closeDex();
              release(act);
            });
          }
        });
      }
      /* The second page: back, the Pokémon at random, then each of its variants. */
      function variants(act) {
        list.innerHTML = "";
        var forms = ACTS[act].variants;
        var count = forms.filter(function (form) {
          return all.indexOf(act + ":" + form) >= 0;
        }).length;
        var first = data[ACTS[act].keys[0]];
        title.innerHTML = "<span>" + first.name.toUpperCase() + "</span><span>SEEN " + count + "/" + forms.length + "</span>";
        entry(null, null, "◂ Back", true, front).focus();
        entry(ACTS[act].dex, first, "Random", true, function () {
          closeDex();
          release(act);
        });
        forms.forEach(function (form) {
          entry(EEVEE_PATHS[form].dex, data[form], data[form].name, all.indexOf(act + ":" + form) >= 0, function () {
            closeDex();
            release(act, form);
          });
        });
      }
      front();
      dexMenu.appendChild(list);

      /* Above the ball, its right edge on the ball's. */
      var r = ball.getBoundingClientRect();
      dexMenu.style.right = window.innerWidth - r.right + "px";
      dexMenu.style.bottom = window.innerHeight - r.top + 10 + "px";
      document.body.appendChild(dexMenu);

      dexMenu.addEventListener("keydown", onDexKey);
      setTimeout(function () {
        document.addEventListener("pointerdown", onOutside);
      });
      dexMenu.dexBall = ball;
      dexMenu.querySelector("button").focus();
    });
  }

  function closeDex() {
    if (!dexMenu) return;
    var ball = dexMenu.dexBall;
    document.removeEventListener("pointerdown", onOutside);
    dexMenu.remove();
    dexMenu = null;
    if (ball) ball.focus({ preventScroll: true });
  }

  function onOutside(e) {
    if (dexMenu && !dexMenu.contains(e.target) && e.target !== dexMenu.dexBall) closeDex();
  }

  /* Up and down move through the list, as in the games; Escape closes it. */
  function onDexKey(e) {
    var buttons = Array.prototype.slice.call(dexMenu.querySelectorAll("button"));
    var at = buttons.indexOf(document.activeElement);
    if (e.key === "Escape") {
      e.preventDefault();
      closeDex();
    } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      var next = (at + (e.key === "ArrowDown" ? 1 : -1) + buttons.length) % buttons.length;
      buttons[next].focus();
    }
  }

  function release(act, variant) {
    if (busy) {
      Koi.wiggle();
      return;
    }
    if (act === "missingno") {
      busy = true;
      missingno().then(function () {
        busy = false;
      });
      return;
    }
    avatar = document.querySelector(".cw-avatar");
    if (!avatar) return;
    if (!scene) {
      scene = document.createElement("div");
      scene.className = "pkmn-scene";
      scene.setAttribute("aria-hidden", "true");
      avatar.appendChild(scene);
    }
    radius = avatar.offsetWidth / 2;
    busy = true;
    act = act || draw();
    previous = act;
    see(act);
    return load()
      .then(function () {
        return preload(ACTS[act].keys);
      })
      .then(function () {
        return Koi.openBall();
      })
      .then(function () {
        return ACTS[act].play(variant);
      })
      .catch(function (error) {
        /* An act that fails must not leave the ball stuck: it is reported, and the photo
           and the ball are given back below. */
        console.error(error);
      })
      .then(function () {
        ["is-zapped", "is-burning", "is-tilted", "is-playing", "is-shadowed", "is-shivering", "is-confused", "is-bumped", "is-floating", "is-frozen", "is-levitating", "is-moonlit", "is-charmed"].forEach(function (effect) {
          photo(effect, false);
        });
        /* Whatever an act did to the rest of the page is undone, even if it failed. */
        night(false);
        chaos(false);
        undoDitto();
        moonGem = null;
        tremor(0);
        unbite();
        scene.querySelectorAll(".pkmn-portrait, .pkmn-scorch, .pkmn-aura, .pkmn-rift, .pkmn-mustache, .pkmn-spoon, .pkmn-mic, .pkmn-anger, .pkmn-firespin, .pkmn-stone-gem, .pkmn-bow").forEach(function (left) {
          left.remove();
        });
        lull(false);
        upside(false);
        sway(false);
        floatPage(false);
        document.querySelectorAll(".pkmn-weather").forEach(function (left) {
          left.remove();
        });
        restoreTheme();
        homePicture();
        document.querySelectorAll(".pkmn-sprite.is-ringed").forEach(function (el) {
          el.classList.remove("is-ringed");
        });
        document.querySelectorAll(".pkmn-stone, .pkmn-possessed").forEach(function (el) {
          el.className = el.className.replace(/\bpkmn-(stone|possessed)\S*/g, "").trim();
        });
        busy = false;
      });
  }

  window.KoiPokemon = { release: release, dex: dex };
})();
