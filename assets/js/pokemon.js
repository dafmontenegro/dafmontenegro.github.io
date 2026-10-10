/* The Pokémon of the homepage, and the 404 page's visitor.

   Fetched by assets/js/koi.js the first time the Poké Ball (or Caesar's Window on the
   photo) is pressed on the homepage, never before. Each press brings out one Pokémon that
   plays with the author's photo for a few seconds, in a way its kind is known for:
   Pikachu shocks it, Snorlax falls asleep against it until it plays the Poké Flute,
   Gengar casts it into shadow, Ditto copies it. A Pokémon that evolves does so during its act, as in the games, and the text
   box of koi.js narrates it in the games' own words.

   The sprites are the animated ones from Pokémon Black and White, fetched by
   scripts/pokemon/build.py; their sizes and fingerprinted addresses arrive in one JSON
   file. Only the sprites of the act about to play are downloaded.

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
    flash.style.transform = "translate(" + x + "px," + y + "px)";
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
  var SPARKLE = ["..p..", "..p..", "ppwpp", "..p..", "..p.."];
  var SPARKLE_COLOURS = { p: "#f9a8d4", w: "#ffffff" };

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

  /* Charmander walks out from behind the photo and evolves twice; Charizard then flies a
     lap round the photo and away. */
  async function charmander() {
    var R = radius;
    var mon = new Mon("charmander", -R * 0.3, R + 4, BEHIND);
    Koi.say(["Go! CHARMANDER!"]);
    await mon.go(-R - 34, R + 4, 700, "ease-out");
    mon.z(IN_FRONT);
    await evolve(mon, "charmeleon");
    await evolve(mon, "charizard");
    Koi.say(["CHARIZARD used FLY!"]);
    var lap = [];
    var orbit = R + 52;
    for (var a = 180; a <= 540; a += 30) {
      var t = (a * Math.PI) / 180;
      lap.push([Math.cos(t) * orbit, Math.sin(t) * orbit * 0.8 + 40]);
    }
    await mon.go(lap[0][0], lap[0][1], 400);
    await mon.path(lap.slice(1), 1800, "linear");
    await mon.go(orbit + 60, -window.innerHeight * 0.7, 900, "ease-in");
    mon.remove();
  }

  /* Munchlax comes looking for food and evolves; Snorlax sits against the photo, pushing
     it over, and falls asleep there. As in the games, only the Poké Flute wakes it: the
     photo plays it. Both on the left of the photo: the badge takes its bottom right. */
  async function munchlax() {
    var R = radius;
    var mon = new Mon("munchlax", -R * 0.3, R + 4, BEHIND);
    Koi.say(["Go! MUNCHLAX!"]);
    await mon.go(-R - 30, R + 4, 600, "ease-out");
    mon.z(IN_FRONT);
    await Koi.say(["MUNCHLAX is looking for something to eat..."]);
    await evolve(mon, "snorlax");
    await mon.go(-R - 14, R + 6, 400);
    photo("is-tilted", true);
    var told = Koi.say(["SNORLAX used REST!", "SNORLAX fell asleep against the photo!"]);
    for (var i = 0; i < 4; i++) {
      float(ZED, ZED_COLOURS, mon.x - 10, mon.y - mon.h, [-24, -50], 1600, i * 700);
    }
    await told;
    photo("is-tilted", false);
    photo("is-playing", true);
    for (var n = 0; n < 6; n++) {
      float(NOTE, NOTE_COLOURS, (n % 2 ? 1 : -1) * R * 0.5, -R - 6, [(n % 2 ? 1 : -1) * 18, -46], 1400, n * 260);
    }
    await Koi.say(["The photo played the POKé FLUTE!", "Now, that's a catchy tune!"]);
    photo("is-playing", false);
    await Koi.say(["SNORLAX woke up!"]);
    await mon.hop(-R - 26, R + 6, 14, 400);
    mon.z(BEHIND);
    await mon.go(-R * 0.2, R + 6, 700);
    mon.remove();
  }

  /* Gastly seeps out of the photo's shadow and evolves twice; Gengar licks the photo,
     which shivers, and vanishes back into the shadow. */
  async function gastly() {
    var R = radius;
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
    var told = Koi.say(["GENGAR vanished into the shadows!"]);
    mon.z(BEHIND);
    mon.go(0, 0, 700, "ease-in");
    await mon.fade(700);
    photo("is-shadowed", false);
    await told;
    mon.remove();
  }

  /* Ditto lands on the photo and transforms into it: a copy of the photo a few pixels
     across, recoloured in Ditto's purple, with Ditto's face, as its transformations so
     often keep. Then it gives up and slides away. */
  async function ditto() {
    var R = radius;
    var mon = new Mon("ditto", R * 0.25, -R - 150);
    mon.el.style.opacity = 0;
    mon.el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: ms(200), fill: "forwards" });
    Koi.say(["Go! DITTO!"]);
    await mon.go(R * 0.25, -R + 6, 700, "cubic-bezier(0.3, 1.5, 0.6, 1)");
    await wait(300);
    var copy = copyOfPhoto(56);
    var told = Koi.say(["DITTO used TRANSFORM!"]);
    burst(mon.x, mon.y - 16);
    if (copy) {
      mon.el.style.visibility = "hidden";
      copy.style.transform = "translate(" + (mon.x - 28) + "px," + (mon.y - 56) + "px)";
      copy.style.zIndex = IN_FRONT;
      scene.appendChild(copy);
    }
    await told;
    await Koi.say(["DITTO transformed into you!", "...but it couldn't get the face right."]);
    burst(mon.x, mon.y - 16);
    if (copy) copy.remove();
    mon.el.style.visibility = "";
    mon.z(BEHIND);
    await mon.go(R * 0.1, -R * 0.4, 600, "ease-in");
    await mon.fade(200);
    mon.remove();
  }

  /* The photo, as Ditto copies it. Returns nothing where the photo cannot be read. */
  function copyOfPhoto(size) {
    var source = avatar.querySelector("img");
    if (!source || !source.complete) return null;
    var PIXELS = 20;
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
    /* Each pixel's brightness, mapped to one of four shades of Ditto's purple, inside a
       circle like the photo's. */
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
    /* Ditto's face: two dots and a line of a smile. */
    ctx.fillStyle = "#1f1235";
    [[7, 8], [12, 8], [8, 12], [9, 13], [10, 13], [11, 12]].forEach(function (q) {
      ctx.fillRect(q[0], q[1], 1, 1);
    });
    canvas.className = "pkmn-prop pkmn-copy";
    canvas.style.width = canvas.style.height = size + "px";
    return canvas;
  }

  /* Psyduck waddles out with its headache, which spins the photo round; when it finally
     clears, it evolves into Golduck, who walks off composed. On the left of the photo,
     clear of the badge. */
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
    await Koi.say(["It hurt itself in its confusion!"]);
    await mon.hop(mon.x, mon.y, 16, 350);
    await evolve(mon, "golduck");
    mon.z(BEHIND);
    await mon.go(-R * 0.3, R + 4, 800);
    mon.remove();
  }

  /* Mew, the rare one: the photo floats on its psychic power while Mew circles it,
     leaving sparkles, and it is gone before anyone can throw a ball. */
  async function mew() {
    var R = radius;
    var mon = new Mon("mew", -R - 40, -R * 0.4);
    mon.el.style.opacity = 0;
    mon.el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: ms(500), fill: "forwards" });
    photo("is-levitating", true);
    var told = Koi.say(["A wild MEW appeared!"]);
    var lap = [];
    var orbit = R + 46;
    for (var a = 200; a <= 560; a += 20) {
      var t = (a * Math.PI) / 180;
      lap.push([Math.cos(t) * orbit, Math.sin(t) * orbit * 0.75 + 30]);
    }
    var sparkles = still()
      ? 0
      : setInterval(function () {
          float(SPARKLE, SPARKLE_COLOURS, mon.x - 5, mon.y - mon.h / 2, [0, 12], 900);
        }, 160);
    await mon.go(lap[0][0], lap[0][1], 500);
    await mon.path(lap.slice(1), 2600, "linear");
    clearInterval(sparkles);
    await told;
    var fled = Koi.say(["The wild MEW fled!"]);
    await mon.go(mon.x + 40, -window.innerHeight * 0.6, 600, "ease-in");
    photo("is-levitating", false);
    await fled;
    mon.remove();
  }

  /* The 404 page's visitor: MissingNo., the glitch that turns up where something is
     missing. It is not a sprite: its block of garbage is drawn anew a few times a second,
     in the shape of the original, a reversed L of scrambled tiles, beside Caesar's Window. */
  async function missingno() {
    var stage = document.createElement("div");
    stage.className = "pkmn";
    stage.setAttribute("aria-hidden", "true");
    document.body.appendChild(stage);
    var canvas = document.createElement("canvas");
    var TILE = 4;
    var COLS = 6;
    var ROWS = 8;
    canvas.width = TILE * COLS;
    canvas.height = TILE * ROWS;
    canvas.className = "pkmn-prop pkmn-glitch";
    canvas.style.width = canvas.width * 3 + "px";
    canvas.style.height = canvas.height * 3 + "px";
    var ctx = canvas.getContext("2d");
    var colours = ["#1f2937", "#6b7280", "#d1d5db", "#ffffff", "#7c3aed", "#f472b6"];
    function scramble() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (var ty = 0; ty < ROWS; ty++) {
        for (var tx = 0; tx < COLS; tx++) {
          if (ty < 4 && tx < 3) continue; // the empty corner of the L
          for (var p = 0; p < TILE * TILE; p++) {
            ctx.fillStyle = colours[(Math.random() * colours.length) | 0];
            ctx.fillRect(tx * TILE + (p % TILE), ty * TILE + ((p / TILE) | 0), 1, 1);
          }
        }
      }
    }
    scramble();
    var width = canvas.width * 3;
    var height = canvas.height * 3;
    var window404 = document.querySelector(".cw-404-window");
    var r = window404 ? window404.getBoundingClientRect() : { right: window.innerWidth / 2, top: 120, height: 0 };
    var x = Math.min(r.right + 32, window.innerWidth - width - 12);
    var y = r.top + r.height / 2 - height / 2;
    canvas.style.transform = "translate(" + x + "px," + y + "px)";
    stage.appendChild(canvas);
    var noise = still() ? 0 : setInterval(scramble, 140);
    await Koi.say(["A wild MISSINGNO. appeared!", "It came looking for this page too."]);
    await wait(2500);
    clearInterval(noise);
    stage.remove();
  }

  var ACTS = {
    pichu: { keys: ["pichu", "pikachu"], play: pichu, weight: 3 },
    charmander: { keys: ["charmander", "charmeleon", "charizard"], play: charmander, weight: 3 },
    munchlax: { keys: ["munchlax", "snorlax"], play: munchlax, weight: 3 },
    gastly: { keys: ["gastly", "haunter", "gengar"], play: gastly, weight: 3 },
    ditto: { keys: ["ditto"], play: ditto, weight: 3 },
    psyduck: { keys: ["psyduck", "golduck"], play: psyduck, weight: 3 },
    mew: { keys: ["mew"], play: mew, weight: 1 } // the rare one: about one press in 17
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
        ["is-zapped", "is-tilted", "is-playing", "is-shadowed", "is-shivering", "is-confused", "is-levitating"].forEach(function (effect) {
          photo(effect, false);
        });
        busy = false;
      });
  }

  window.KoiPokemon = { release: release };
})();
