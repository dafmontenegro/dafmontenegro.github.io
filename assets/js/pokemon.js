/* The Pokémon of the homepage, and the 404 page's visitor.

   Fetched by assets/js/koi.js the first time the Poké Ball (or Caesar's Window on the
   photo) is pressed on the homepage, never before. Each press brings out one Pokémon that
   plays with the author's photo, and with the rest of the page, in a way its kind is
   known for: Pikachu shocks it, Charmander sets it alight, Snorlax falls asleep on it
   until it plays the Poké Flute, Gengar takes it into the shadows, Ditto turns into it,
   Psyduck's headache sends the whole page lurching, and the three Kanto starters evolve
   side by side until Charizard Mega Evolves and flies off. A Pokémon that evolves does so during its act, as in the games, and the text
   box of koi.js narrates it in the games' own words.

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

  Mon.prototype.at = function (x, y) {
    return "translate(" + (x - this.w / 2).toFixed(1) + "px," + (y - this.h).toFixed(1) + "px)";
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
  function float(art, colours, x, y, rise, duration, delay) {
    if (still()) return;
    var svg = Koi.pixels(art, colours, "pkmn-prop", 2);
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

  /* What the Pokémon do to the photo, as a class on its box (assets/css/koi.css). */
  function photo(effect, on) {
    avatar.classList.toggle(effect, on);
  }

  /* Evolution: the Pokémon stop, every form flashes in turn with the next, faster and
     faster, until the new ones hold. As in the games, nobody moves on before the text box
     has finished saying so. One or several at once: the Kanto starters evolve together. */
  function evolveAll(mons, tos) {
    var froms = mons.map(function (mon) {
      return mon.key;
    });
    var one = mons.length === 1;
    var told = Koi.say([one ? "What? " + name(froms[0]) + " is evolving!" : "What? Your POKéMON are evolving!"]);
    var steps = still() ? [] : FLICKER;
    mons.forEach(function (mon) {
      mon.el.classList.add("is-silhouette");
    });
    return (function swap(i) {
      if (i === steps.length) {
        mons.forEach(function (mon, k) {
          mon.show(tos[k]);
          mon.el.classList.remove("is-silhouette");
          burst(mon.x, mon.y - mon.h / 2);
        });
        var names = tos.map(name);
        var into = names.length === 1 ? names[0] : names.slice(0, -1).join(", ") + " and " + names[names.length - 1];
        return told.then(function () {
          return Koi.say([one ? "Congratulations! Your " + name(froms[0]) + " evolved into " + into + "!" : "Congratulations! They evolved into " + into + "!"]);
        });
      }
      mons.forEach(function (mon, k) {
        mon.show(i % 2 ? froms[k] : tos[k]);
      });
      return wait(steps[i]).then(function () {
        return swap(i + 1);
      });
    })(0);
  }

  function evolve(mon, to) {
    return evolveAll([mon], [to]);
  }

  /* Mega Evolution: the Mega Stone answers, a sphere of every colour closes round the
     Pokémon, and it comes out of it changed. */
  async function megaEvolve(mon, to, stone) {
    var told = Koi.say([stone + " is reacting to the Key Stone!"]);
    var sphere = document.createElement("div");
    sphere.className = "pkmn-mega";
    sphere.style.left = mon.x + "px";
    sphere.style.top = mon.y - mon.h / 2 + "px";
    sphere.style.zIndex = IN_FRONT + 1;
    scene.appendChild(sphere);
    mon.el.classList.add("is-silhouette");
    await wait(ms(1300));
    mon.show(to);
    mon.el.classList.remove("is-silhouette");
    sphere.remove();
    burst(mon.x, mon.y - mon.h / 2);
    await told;
    await Koi.say([name(mon.key.replace(/-mega.*/, "")) + " has Mega Evolved into " + name(to) + "!"]);
  }

  /* A pixel drawing that flies from one point to another and is gone: a fireball, a
     drop of water. */
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

  /* A flame that stands where it is put, flickering, until it is put out. */
  function flame(x, y, colours) {
    var svg = Koi.pixels(FLAME, colours, "pkmn-prop pkmn-flicker", 2);
    svg.style.zIndex = IN_FRONT;
    svg.style.left = x - 7 + "px";
    svg.style.top = y - 18 + "px";
    svg.style.animationDelay = -Math.random() + "s";
    scene.appendChild(svg);
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
  function night(on) {
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
      veil.animate([{ opacity: 1 }, { opacity: 0 }], { duration: ms(600) }).finished.then(function () {
        veil.remove();
        avatar.classList.remove("is-lifted");
      });
    }
  }

  /* The parts of the page a Pokémon can get its hands on. */
  function page(selector) {
    return document.querySelector(selector);
  }

  /* The page coming apart: header, content and footer each lurch their own way. */
  function chaos(on) {
    ["body > header", "#main-content", "body footer"].forEach(function (selector, i) {
      var el = page(selector);
      if (el) el.classList.toggle("pkmn-chaos-" + i, on && !still());
    });
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
  var NOTE_COLOURS = { n: "#a78bfa" };
  var QUESTION = [".qqq.", "q...q", "....q", "...q.", "..q..", ".....", "..q.."];
  var QUESTION_COLOURS = { q: "#60a5fa" };
  var FLAME = ["...r...", "..rr...", "..ror..", ".rorr..", ".roorr.", "rooyorr", "royyyor", "royyyor", ".ryyyr."];
  var FIRE_COLOURS = { r: "#dc2626", o: "#f97316", y: "#fde047" };
  var BLUE_FIRE_COLOURS = { r: "#1e3a8a", o: "#3b82f6", y: "#bae6fd" };
  var FIREBALL = [".ooo.", "oyyyo", "oyyyo", "oyyyo", ".ooo."];
  var DROP = [".b.", "bbb", "bwb", ".b."];
  var DROP_COLOURS = { b: "#38bdf8", w: "#e0f2fe" };
  var CRUMB = ["cc", "cc"];
  var CRUMB_COLOURS = { c: "#b91c1c" };
  var GRIN = [
    "rrr................rrr",
    ".rrrr............rrrr.",
    "..rrrr..........rrrr..",
    "...rr............rr...",
    "......................",
    "w....................w",
    "ww..................ww",
    ".wwwwwwwwwwwwwwwwwwww.",
    "..wkwwkwwkwwkwwkwwkw..",
    "...wwwwwwwwwwwwwwww...",
    ".....wwwwwwwwwwww....."
  ];
  var GRIN_COLOURS = { r: "#ef4444", w: "#f8fafc", k: "#4c1d95" };

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

  /* Charmander, on its own: it spits embers at the photo, which catches fire round its
     rim, and looks very pleased with itself until the flames die down. */
  async function charmander() {
    var R = radius;
    var mon = new Mon("charmander", -R * 0.3, R + 4, BEHIND);
    Koi.say(["Go! CHARMANDER!"]);
    await mon.go(-R - 40, R + 4, 700, "ease-out");
    mon.z(IN_FRONT);
    await wait(300);
    var told = Koi.say(["CHARMANDER used EMBER!"]);
    for (var i = 0; i < 3; i++) {
      shoot(FIREBALL, FIRE_COLOURS, [mon.x + 6, mon.y - mon.h * 0.75], [-R * 0.75 + i * 18, R * 0.35 - i * 26], 380);
      await wait(ms(200));
    }
    await wait(ms(250));
    photo("is-burning", true);
    var flames = [];
    for (var a = 15; a <= 165; a += 25) {
      var t = (a * Math.PI) / 180;
      flames.push(flame(Math.cos(t) * R, Math.sin(t) * R + 4, FIRE_COLOURS));
    }
    await told;
    await Koi.say(["The photo caught fire!"]);
    await Koi.say(["CHARMANDER looks very proud of itself."]);
    await putOut(flames);
    photo("is-burning", false);
    mon.z(BEHIND);
    await mon.go(-R * 0.3, R + 4, 700);
    mon.remove();
  }

  /* The three Kanto starters, together: Bulbasaur, Charmander and Squirtle come out round
     the photo and evolve side by side, twice. Venusaur fires a Solar Beam into the sky,
     Blastoise its Hydro Pump, and Charizard Mega Evolves into Mega Charizard X and flies
     a lap of the photo trailing blue fire before it is gone. */
  async function kanto() {
    var R = radius;
    var leaf = new Mon("bulbasaur", -R * 0.3, R + 4, BEHIND);
    var shell = new Mon("squirtle", R * 0.3, R + 4, BEHIND);
    var fire = new Mon("charmander", 0, -R * 0.2, BEHIND);
    Koi.say(["Go! BULBASAUR! CHARMANDER! SQUIRTLE!"]);
    await Promise.all([leaf.go(-R - 38, R + 4, 700, "ease-out"), shell.go(R + 58, R + 4, 700, "ease-out")]);
    leaf.z(IN_FRONT);
    shell.z(IN_FRONT);
    setTimeout(function () {
      fire.z(IN_FRONT);
    }, ms(250));
    await fire.hop(0, -R + 8, 50, 650);
    await evolveAll([leaf, fire, shell], ["ivysaur", "charmeleon", "wartortle"]);
    await evolveAll([leaf, fire, shell], ["venusaur", "charizard", "blastoise"]);

    var told = Koi.say(["VENUSAUR used SOLAR BEAM!"]);
    photo("is-sunlit", true);
    var beam = document.createElement("div");
    beam.className = "pkmn-beam";
    beam.style.zIndex = IN_FRONT;
    beam.style.left = leaf.x - 6 + "px";
    beam.style.top = leaf.y - leaf.h * 0.7 + "px";
    scene.appendChild(beam);
    await told;
    beam.remove();
    photo("is-sunlit", false);

    told = Koi.say(["BLASTOISE used HYDRO PUMP!"]);
    for (var d = 0; d < 14; d++) {
      shoot(DROP, DROP_COLOURS, [shell.x - 18, shell.y - shell.h * 0.8], [shell.x - 120 - Math.random() * 60, -R - 140 - Math.random() * 80], 700, 3);
      await wait(ms(90));
    }
    await told;

    await megaEvolve(fire, "charizard-mega-x", "CHARIZARDITE X");
    told = Koi.say(["MEGA CHARIZARD X used FLY!"]);
    var lap = [];
    var orbit = R + 60;
    for (var a = 270; a <= 630; a += 30) {
      var t = (a * Math.PI) / 180;
      lap.push([Math.cos(t) * orbit, Math.sin(t) * orbit * 0.75 + 30]);
    }
    var trail = still()
      ? 0
      : setInterval(function () {
          float(FLAME, BLUE_FIRE_COLOURS, fire.x - 7, fire.y - fire.h * 0.3, [0, 16], 700);
        }, 110);
    await fire.go(lap[0][0], lap[0][1], 400);
    await fire.path(lap.slice(1), 2200, "linear");
    await fire.go(orbit + 80, -window.innerHeight * 0.8, 900, "ease-in");
    clearInterval(trail);
    fire.remove();
    await told;

    leaf.z(BEHIND);
    shell.z(BEHIND);
    await Promise.all([leaf.go(-R * 0.3, R + 4, 700), shell.go(R * 0.3, R + 4, 700)]);
    leaf.remove();
    shell.remove();
  }

  /* Munchlax comes looking for food and takes a bite out of the page: the red box under
     the photo. It evolves; Snorlax climbs on top of the photo and falls asleep there,
     squashing it, and only the Poké Flute wakes it, as in the games: the photo plays it. */
  async function munchlax() {
    var R = radius;
    var banner = page("#main-content .rounded-md.bg-primary-100");
    var mon = new Mon("munchlax", -R * 0.3, R + 4, BEHIND);
    Koi.say(["Go! MUNCHLAX!"]);
    await mon.go(-R - 30, R + 4, 600, "ease-out");
    mon.z(IN_FRONT);
    await Koi.say(["MUNCHLAX is looking for something to eat..."]);
    if (banner) {
      var a = avatar.getBoundingClientRect();
      var b = banner.getBoundingClientRect();
      var bx = b.left - (a.left + a.width / 2) + 46;
      var by = b.top - (a.top + a.height / 2) + 2;
      await mon.hop(bx, by, 40, 700);
      var told = Koi.say(["MUNCHLAX took a bite out of the page!"]);
      banner.classList.add("pkmn-bitten");
      for (var c = 0; c < 6; c++) {
        float(CRUMB, CRUMB_COLOURS, bx - 14 + c * 6, by + 4, [c * 4 - 10, 30], 900, c * 80);
      }
      await mon.hop(bx, by, 8, 220);
      await mon.hop(bx, by, 8, 220);
      await told;
      await mon.hop(-R - 30, R + 4, 40, 700);
    }
    await evolve(mon, "snorlax");
    await mon.hop(0, -R + 26, 60, 750);
    photo("is-squashed", true);
    var told2 = Koi.say(["SNORLAX used REST!", "SNORLAX fell asleep on top of the photo!"]);
    for (var i = 0; i < 4; i++) {
      float(ZED, ZED_COLOURS, mon.x + 18, mon.y - mon.h, [24, -50], 1600, i * 700);
    }
    await told2;
    photo("is-playing", true);
    for (var n = 0; n < 6; n++) {
      float(NOTE, NOTE_COLOURS, (n % 2 ? 1 : -1) * (R + 10), R * 0.2, [(n % 2 ? 1 : -1) * 18, -46], 1400, n * 260);
    }
    await Koi.say(["The photo played the POKé FLUTE!", "Now, that's a catchy tune!"]);
    photo("is-playing", false);
    await Koi.say(["SNORLAX woke up!"]);
    photo("is-squashed", false);
    await mon.hop(-R - 30, R + 6, 30, 650);
    mon.z(BEHIND);
    await mon.go(-R * 0.2, R + 6, 700);
    mon.remove();
  }

  /* Gastly seeps out of the photo's shadow while the whole page goes dark, and evolves
     twice. Gengar licks the photo, which shivers, then uses Phantom Force: it sinks into
     the photo and takes it into the shadows, leaving its grin where the photo was, until
     it bursts back out and the light comes back. */
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
    mon.go(0, R * 0.3, 500, "ease-in");
    await mon.fade(500);
    photo("is-taken", true);
    var grin = Koi.pixels(GRIN, GRIN_COLOURS, "pkmn-prop pkmn-grin", 4);
    grin.style.zIndex = IN_FRONT;
    grin.style.left = "-44px";
    grin.style.top = "-22px";
    scene.appendChild(grin);
    await told;
    await Koi.say(["The photo vanished into the shadows!"]);
    grin.remove();
    burst(0, 0);
    photo("is-taken", false);
    mon.el.getAnimations().forEach(function (anim) {
      anim.cancel();
    });
    mon.z(IN_FRONT);
    await mon.go(R + 34, R * 0.15, 250, "ease-out");
    await Koi.say(["GENGAR came back out of the shadows!"]);
    var gone = Koi.say(["GENGAR vanished into the shadows!"]);
    mon.z(BEHIND);
    mon.go(0, 0, 700, "ease-in");
    await mon.fade(700);
    night(false);
    photo("is-shadowed", false);
    await gone;
    mon.remove();
  }

  /* Ditto lands on the photo and transforms into it: the whole photo turns into Ditto,
     the photo's own pixels recoloured in Ditto's purple, with Ditto's face, wobbling like
     the jelly it is. It cannot help itself and copies the site's logo and the badge too,
     then cannot hold any of it and lets go of everything at once. */
  async function ditto() {
    var R = radius;
    var mon = new Mon("ditto", R * 0.25, -R - 150);
    mon.el.style.opacity = 0;
    mon.el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: ms(200), fill: "forwards" });
    Koi.say(["Go! DITTO!"]);
    await mon.go(R * 0.25, -R + 6, 700, "cubic-bezier(0.3, 1.5, 0.6, 1)");
    await wait(300);
    var told = Koi.say(["DITTO used TRANSFORM!"]);
    burst(0, 0);
    mon.el.style.visibility = "hidden";
    var copy = copyOfPhoto(R * 2);
    if (copy) {
      copy.style.left = -R + "px";
      copy.style.top = -R + "px";
      copy.style.zIndex = 1;
      scene.appendChild(copy);
    }
    await told;
    await Koi.say(["DITTO transformed into you!"]);
    /* The header has one logo per theme, the other one hidden: both are copied. */
    var copied = Array.prototype.slice.call(document.querySelectorAll("body > header img"));
    var badge = page(".cw-avatar .cw-badge");
    if (badge) copied.push(badge);
    copied.forEach(function (el) {
      el.classList.add("pkmn-dittoed");
    });
    await Koi.say(["...and into everything else it could find!"]);
    await Koi.say(["But it couldn't keep it up!"]);
    copied.forEach(function (el) {
      el.classList.remove("pkmn-dittoed");
    });
    burst(0, 0);
    if (copy) copy.remove();
    mon.el.style.visibility = "";
    await mon.hop(R + 30, R + 4, 40, 600);
    await mon.hop(R + 60, R + 4, 18, 350);
    mon.z(BEHIND);
    await mon.go(R * 0.3, R + 4, 600);
    mon.remove();
  }

  /* The photo, as Ditto copies it: shrunk to a few pixels, each mapped to one of four
     shades of Ditto's purple, inside the photo's circle, with Ditto's face on top. Returns
     nothing where the photo cannot be read. */
  function copyOfPhoto(size) {
    var source = avatar.querySelector("img");
    if (!source || !source.complete) return null;
    var PIXELS = 24;
    var canvas = document.createElement("canvas");
    canvas.width = canvas.height = PIXELS;
    var ctx = canvas.getContext("2d");
    var image;
    try {
      ctx.drawImage(source, 0, 0, PIXELS, PIXELS);
      image = ctx.getImageData(0, 0, PIXELS, PIXELS);
    } catch (e) {
      return null;
    }
    var shades = [[74, 44, 102], [127, 86, 166], [176, 130, 214], [228, 200, 245]];
    var d = image.data;
    for (var i = 0; i < d.length; i += 4) {
      var p = i / 4;
      var x = (p % PIXELS) - PIXELS / 2 + 0.5;
      var y = Math.floor(p / PIXELS) - PIXELS / 2 + 0.5;
      var light = (0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]) / 255;
      var shade = shades[Math.min(3, Math.floor(light * 4.2))];
      d[i] = shade[0];
      d[i + 1] = shade[1];
      d[i + 2] = shade[2];
      d[i + 3] = x * x + y * y <= (PIXELS / 2) * (PIXELS / 2) ? 255 : 0;
    }
    ctx.putImageData(image, 0, 0);
    /* Ditto's face: two dots and a wide, wobbly smile. */
    ctx.fillStyle = "#1f1235";
    [[8, 9], [9, 9], [15, 9], [16, 9], [8, 10], [16, 10], [9, 14], [10, 15], [11, 15], [12, 15], [13, 15], [14, 14]].forEach(function (q) {
      ctx.fillRect(q[0], q[1], 1, 1);
    });
    canvas.className = "pkmn-prop pkmn-copy pkmn-jelly";
    canvas.style.width = canvas.style.height = size + "px";
    return canvas;
  }

  /* Psyduck waddles out with its headache, which spins the photo round. It gets worse
     until Psyduck lets loose a Confusion that sends the whole page lurching, and leaves
     as confused as it came. */
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
    told = Koi.say(["PSYDUCK's headache is getting worse..."]);
    for (var k = 0; k < 3; k++) await mon.hop(mon.x, mon.y, 10, 260);
    await told;
    told = Koi.say(["PSYDUCK used CONFUSION!"]);
    chaos(true);
    for (var q = 0; q < 8; q++) {
      float(QUESTION, QUESTION_COLOURS, (Math.random() - 0.5) * R * 3, (Math.random() - 0.5) * R * 2, [0, -30], 1100, q * 150);
    }
    await told;
    await wait(ms(900));
    chaos(false);
    await Koi.say(["It hurt itself in its confusion!"]);
    await mon.hop(mon.x, mon.y, 18, 400);
    await Koi.say(["PSYDUCK is still confused..."]);
    mon.z(BEHIND);
    await mon.go(-R * 0.3, R + 4, 800);
    mon.remove();
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

  /* Every act, with the National Dex number it is listed under in the Pokédex and, where
     it is more than one Pokémon, the name it is listed as. */
  var ACTS = {
    kanto: { dex: 1, title: "Kanto trio", keys: ["bulbasaur", "ivysaur", "venusaur", "charmander", "charmeleon", "charizard", "charizard-mega-x", "squirtle", "wartortle", "blastoise"], play: kanto, weight: 2 },
    charmander: { dex: 4, keys: ["charmander"], play: charmander, weight: 3 },
    psyduck: { dex: 54, keys: ["psyduck"], play: psyduck, weight: 3 },
    gastly: { dex: 92, keys: ["gastly", "haunter", "gengar"], play: gastly, weight: 3 },
    ditto: { dex: 132, keys: ["ditto"], play: ditto, weight: 3 },
    pichu: { dex: 172, keys: ["pichu", "pikachu"], play: pichu, weight: 3 },
    munchlax: { dex: 446, keys: ["munchlax", "snorlax"], play: munchlax, weight: 3 }
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
      var met = seen();
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
        var label = ACTS[act].title || first.name;
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
        ["is-zapped", "is-burning", "is-sunlit", "is-squashed", "is-playing", "is-shadowed", "is-shivering", "is-taken", "is-confused"].forEach(function (effect) {
          photo(effect, false);
        });
        /* Whatever an act did to the rest of the page is undone, even if it failed. */
        night(false);
        chaos(false);
        var bitten = page(".pkmn-bitten");
        if (bitten) bitten.classList.remove("pkmn-bitten");
        busy = false;
      });
  }

  window.KoiPokemon = { release: release, dex: dex };
})();
