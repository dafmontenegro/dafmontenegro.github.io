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
    this.key = key;
    this.w = s.width;
    this.h = s.height;
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
     sweeping across the whole screen from left to right. */
  function skyShadow() {
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
          { transform: "translate(" + -w + "px," + window.innerHeight * 0.05 + "px) scaleX(-1)" },
          { transform: "translate(" + window.innerWidth + "px," + window.innerHeight * 0.3 + "px) scaleX(-1)" }
        ],
        { duration: 1700, easing: "linear" }
      )
      .finished.then(function () {
        sky.remove();
      });
  }

  /* Fire Blast over the photo: flames in the shape of 大, blooming out from its middle. */
  function fireBlast(R) {
    var u = R * 0.32;
    var points = [
      [0, -3], [0, -2],
      [-3, -1], [-2, -1], [-1, -1], [0, -1], [1, -1], [2, -1], [3, -1],
      [0, 0],
      [-1, 1], [-2, 2], [1, 1], [2, 2]
    ];
    var flames = [];
    return Promise.all(
      points.map(function (p) {
        var delay = ms(Math.hypot(p[0], p[1] + 1) * 90);
        return wait(delay).then(function () {
          var f = flame(p[0] * u, p[1] * u + 20, 3);
          f.classList.add("pkmn-blast");
          flames.push(f);
        });
      })
    ).then(function () {
      return flames;
    });
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
  function night(on, duration) {
    var veil = document.querySelector(".pkmn-night");
    if (on && !veil) {
      veil = document.createElement("div");
      veil.className = "pkmn-night";
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
    await mon.go(-R - 44, R + 4, 700, "ease-out");
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
    flames.push(flame(-R * 0.3, R + 2, 2));
    await evolve(mon, "charizard");
    await mon.go(-R - 62, R + 8, 300);

    /* The roar: Charizard rears up, the page shakes, a wave of heat washes over it and
       sparks spray from its jaws. */
    told = Koi.say(["CHARIZARD let out a mighty roar!"]);
    var mouth = [mon.x + mon.w * 0.3, mon.y - mon.h * 0.72];
    mon.el.style.transformOrigin = "50% 100%";
    mon.el.animate([{ scale: "1" }, { scale: "1.18" }, { scale: "1.12" }, { scale: "1.18" }, { scale: "1" }], { duration: ms(1100), easing: "ease-in-out" });
    heat();
    tremor(3);
    spray(mouth, 1);
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
    await skyShadow();
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
    photo("is-burning", true);
    flames = flames.concat(await fireBlast(R));
    var sparks = embers([-R * 0.6, 0, R * 0.6], -R * 0.8);
    await told;
    await Koi.say(["The photo caught fire!"]);

    told = Koi.say(["CHARIZARD flew away!"]);
    mon.flip(true);
    await mon.go(R + 220, -window.innerHeight, 1000, "ease-in");
    mon.remove();
    await told;

    told = Koi.say(["The fire burned out.", "The photo is a little toasted."]);
    sparks();
    await putOut(flames);
    photo("is-burning", false);
    await told;
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
    var sleeper = new Mon("snorlax-asleep", -R - 32, R + 14);
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

  /* Ditto lands on the photo and transforms into the other Pokémon of this ball, Pikachu,
     Gengar and Charizard, each in Ditto's own purple. Then it tries the author: it hops
     onto the name under the photo and uses Transform, not on itself but on the page: letter by letter the name, the headline and the line in the
     red box turn into Ditto, in Ditto's purple, wobbling like the jelly it is, until it
     cannot keep it up and every word goes back to what it was.

     What each one becomes is worked out from whatever it says at the time, by rule, so
     the act survives any change to the homepage's text: every word of the name becomes
     "Ditto", and in the headline and the red box the last word of every clause does. */
  var DITTO_LETTERS = "DITO?";
  var DITTO_FORMS = ["pikachu", "gengar", "charizard"];
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

    var mon = new Mon("ditto", R * 0.1, -R - 150);
    mon.el.style.opacity = 0;
    mon.el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: ms(200), fill: "forwards" });
    Koi.say(["Go! DITTO!"]);
    await mon.go(R * 0.1, -R + 6, 700, "cubic-bezier(0.3, 1.5, 0.6, 1)");

    /* On top of the photo it copies the Pokémon that came out of this ball before it,
       one after another, in its own purple and wobbling: it never quite gets the colour. */
    var told = Koi.say(["DITTO used TRANSFORM!"]);
    await told;
    mon.el.classList.add("is-ditto-form");
    for (var f = 0; f < DITTO_FORMS.length; f++) {
      burst(mon.x, mon.y - mon.h / 2);
      mon.show(DITTO_FORMS[f]);
      await mon.hop(mon.x, mon.y, 14, 320);
      await Koi.say(["DITTO transformed into " + name(DITTO_FORMS[f]) + "!"]);
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
    await Koi.say(["It couldn't keep it up!"]);
    burst(mon.x, mon.y - 16);
    await Promise.all(
      transformed.map(function (saved) {
        return morph(saved.el, saved.text.trim());
      })
    );
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
    ditto: { dex: 132, keys: ["ditto", "pikachu", "gengar", "charizard"], play: ditto, weight: 3 },
    pichu: { dex: 172, keys: ["pichu", "pikachu"], play: pichu, weight: 3 },
    munchlax: { dex: 446, keys: ["munchlax", "snorlax", "snorlax-asleep"], play: munchlax, weight: 3 }
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
      keys.forEach(function (act) {
        var known = met.indexOf(act) >= 0;
        var first = data[ACTS[act].keys[0]];
        var item = document.createElement("li");
        var button = document.createElement("button");
        button.type = "button";
        button.className = "pkmn-dex-entry" + (known ? "" : " is-unseen");
        var label = first.name;
        button.setAttribute("aria-label", known ? label : "Unknown Pokémon, number " + ACTS[act].dex);
        button.innerHTML =
          '<span class="pkmn-dex-no">' + pad(ACTS[act].dex) + "</span>" +
          '<img src="' + first.url + '" alt="" width="' + first.width + '" height="' + first.height + '">' +
          '<span class="pkmn-dex-name">' + (known ? label.toUpperCase() : "???") + "</span>";
        button.addEventListener("click", function () {
          closeDex();
          release(act);
        });
        item.appendChild(button);
        list.appendChild(item);
      });
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

  function release(act) {
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
    load()
      .then(function () {
        return preload(ACTS[act].keys);
      })
      .then(function () {
        return Koi.openBall();
      })
      .then(ACTS[act].play)
      .catch(function (error) {
        /* An act that fails must not leave the ball stuck: it is reported, and the photo
           and the ball are given back below. */
        console.error(error);
      })
      .then(function () {
        ["is-zapped", "is-burning", "is-tilted", "is-playing", "is-shadowed", "is-shivering", "is-confused", "is-bumped"].forEach(function (effect) {
          photo(effect, false);
        });
        /* Whatever an act did to the rest of the page is undone, even if it failed. */
        night(false);
        chaos(false);
        undoDitto();
        tremor(0);
        unbite();
        scene.querySelectorAll(".pkmn-portrait").forEach(function (left) {
          left.remove();
        });
        busy = false;
      });
  }

  window.KoiPokemon = { release: release, dex: dex };
})();
