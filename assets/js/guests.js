/* The guests the footer's clover calls (assets/js/clover.js), drawn in pixels at the foot
   of the screen. Fetched the first time the clover is used.

   Link, from The Legend of Zelda: Link's Awakening DX: a bush springs up, he walks in,
   charges his sword and cuts it with a spin attack, and out of it bounces a four-leaf
   clover, which he picks up and holds up as Link holds up every treasure, while the
   games' text box says that luck is made. In Zelda, rupees and hearts come out of the
   grass you cut; here, the clover. Then he hops for joy, twice, with the clover still over
   his head, and goes on his way.

   Zelda and Link, from The Legend of Zelda: The Minish Cap: they walk to the footer's
   clover together, and she is surprised to find it; she prays, her golden light gathers
   on the clover and bursts into a ring, and he raises his sword, which catches the light.
   Courage and wisdom, the two halves of the lesson: luck is made, and knowing it. The
   clover keeps a glow while they speak; then they go on together, past it.

   Kirby, from Kirby's Adventure: he floats in, lands beside the footer's clover, inhales
   it and swallows it, and LUCK becomes his copy ability. Luck can be anything, so he
   tries it out: a card over his head spins and lands on FIRE (embers fly), then SLEEP
   (he dozes off, z's rise), then SWORD, which he raises as Link raises a treasure. But
   luck isn't his to keep, so he spits it back as a star, which bursts where the clover
   was; the clover is there again, he hops for joy, turns round and floats away.

   Their sheets are assets/img/nintendo/link.png, zelda.png and kirby.png, written by
   scripts/nintendo/build.py, which says where every frame comes from.

   Everything is drawn on one canvas, fixed to the bottom of the screen and as wide as it,
   at a small whole-number scale so the pixels stay square. It catches no clicks. While
   they act, the text box moves to the top of the screen (clover.css). With reduced
   motion, nobody walks: each guest appears in one pose while the text box speaks. */
(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  var CELL = 48; // Link's frames are 48x48, his body on the middle 16x16
  var ITEMS = 48; // where the bush and the clover sit on Link's sheet
  var LINK = {
    walk: [0, 1], slash: [2, 3, 4], hold: 5, face: 6, charge: [7, 8],
    spin: [9, 10, 11, 12, 13, 14, 15, 16]
  };
  var WALK_SPEED = 62; // sprite pixels per second, close to the game's
  var STEP_MS = 130; // how long each walking frame lasts
  var STAGE_H = 58; // sprite pixels: room for the clover held above his head

  var KIRBY = {
    stand: 0, blink: 1, float: [2, 3], deflate: 4, air: 5, inhale: 6, suction: [7, 8],
    mouthful: 9, squash: 10, front: 11, star: [12, 13, 14, 15], poof: [16, 17, 18],
    spit: 19, puffUp: 20, sleep: [21, 22, 23], bubble: 24, fireFlash: 25,
    fire: [26, 27, 28, 29]
  };
  var K = 24; // Kirby's frames are 24x24, standing on the cell's bottom edge
  var SWORD = { w: 40, h: 44, top: 24, body: 16, feet: 35 }; // his sword row, below the rest

  var ZELDA = {
    walk: [0, 1, 2, 3, 4, 5, 6, 7, 8], front: 9, surprised: 10, smile: 11, pray: [12, 13, 14],
    glow: [15, 16, 17, 18], burst: [19, 20, 21, 22, 23],
    link: { walk: [24, 25, 26, 27, 28, 29, 30, 31], front: 32, raise: 33, cheer: 34, blade: 35, glint: 36 }
  };
  var Z = 48; // Zelda's frames are 48x48, standing on the cell's bottom edge
  var ZELDA_SPEED = 30; // an easy walk: they are in no hurry

  var LINES = {
    link: ["You got a Four-Leaf Clover!", "Luck isn't found: it's made, one cut at a time."],
    zelda: ["Link and Zelda found the clover!", "Courage to make your luck, and the wisdom to know it's made."],
    kirby: ["Kirby inhaled the clover!", "Copy ability: LUCK! And luck can be anything..."],
    kirbyEnd: ["But luck isn't his to keep: everyone has to make their own."]
  };

  var images = {};
  function image(url) {
    if (!images[url]) {
      images[url] = new Promise(function (resolve, reject) {
        var img = new Image();
        img.onload = function () {
          resolve(img);
        };
        img.onerror = reject;
        img.src = url;
      });
    }
    return images[url];
  }

  function dark() {
    return document.documentElement.classList.contains("dark");
  }

  /* ---------------------------------------------------------------------------------
     The text box. The site's own (window.Koi, assets/js/koi.js) where the page has it;
     otherwise a plain one of its own, read whole to assistive technology. */

  function say(lines) {
    if (window.Koi && window.Koi.say) return window.Koi.say(lines);
    var box = document.createElement("div");
    box.className = "cw-guest-say";
    box.setAttribute("role", "status");
    document.body.appendChild(box);
    return lines
      .reduce(function (chain, line) {
        return chain.then(function () {
          box.textContent = line;
          return wait(1400 + line.length * 40);
        });
      }, Promise.resolve())
      .then(function () {
        box.remove();
      });
  }

  function wait(ms) {
    return new Promise(function (resolve) {
      setTimeout(resolve, ms);
    });
  }

  /* ---------------------------------------------------------------------------------
     The stage: a canvas across the bottom of the screen. Sizes are in sprite pixels;
     `scale` is how many screen pixels each one takes. */

  /* How many screen pixels each sprite pixel takes: small, as a guest at the foot of the
     page should be, but whole so the pixels stay square. */
  function pixelScale(size) {
    var ratio = window.devicePixelRatio || 1;
    var base = window.innerWidth < 640 ? 2 : 3;
    // Whole in device pixels: on a phone at 3x, a size of 2/3 is 4 device pixels each.
    return Math.max(1, Math.round(base * (size || 1) * ratio)) / ratio;
  }

  /* `size` shrinks a guest drawn from larger sprites (The Minish Cap's) to sit beside the
     others. */
  function Stage(height, size) {
    this.scale = pixelScale(size);
    this.w = Math.ceil(window.innerWidth / this.scale);
    this.h = Math.max(STAGE_H, height || 0);
    this.ground = this.h - 2; // where feet stand
    var ratio = window.devicePixelRatio || 1;
    var canvas = (this.canvas = document.createElement("canvas"));
    canvas.className = "cw-guest-stage";
    canvas.setAttribute("aria-hidden", "true");
    canvas.width = Math.round(window.innerWidth * ratio);
    canvas.height = Math.round(this.h * this.scale * ratio);
    canvas.style.height = this.h * this.scale + "px";
    this.ctx = canvas.getContext("2d");
    this.ctx.setTransform(this.scale * ratio, 0, 0, this.scale * ratio, 0, 0);
    this.ctx.imageSmoothingEnabled = false;
    document.body.appendChild(canvas);
    document.body.classList.add("cw-guest-on");
  }

  Stage.prototype.clear = function () {
    this.ctx.clearRect(0, 0, this.w + 1, this.h + 1);
  };

  Stage.prototype.remove = function () {
    this.canvas.remove();
    document.body.classList.remove("cw-guest-on");
  };

  /* A stage tall enough to reach the footer's clover (plus `above`), and where the clover
     is on it, in sprite pixels. */
  function stageToClover(clover, above, size) {
    var rect = clover.getBoundingClientRect();
    var scale = pixelScale(size);
    var reach = Math.ceil((window.innerHeight - rect.top) / scale) + (above || 6);
    var stage = new Stage(Math.min(reach, 160), size);
    var top = window.innerHeight - stage.h * stage.scale; // the stage's top, on screen
    stage.spot = {
      x: (rect.left + rect.width / 2) / stage.scale,
      y: (rect.top + rect.height / 2 - top) / stage.scale
    };
    return stage;
  }

  /* Runs `step(elapsed, dt)` and then `draw()` on every frame for `ms` milliseconds, or
     until `step` returns true, or until `until` (a promise) settles. */
  function run(ms, step, draw, until) {
    return new Promise(function (resolve) {
      var start = null;
      var last = null;
      var done = false;
      if (until) {
        until.then(function () {
          done = true;
        });
      }
      function frame(now) {
        if (start === null) start = last = now;
        var elapsed = now - start;
        var dt = Math.min(now - last, 50) / 1000;
        last = now;
        var finished = step(elapsed, dt) === true;
        draw();
        if (done || finished || (ms && elapsed >= ms)) resolve();
        else requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    });
  }

  /* Plays `plan`, a list of [frame, ms], calling `show(frame)` as each one starts. */
  function sequence(plan, show, draw, each) {
    var total = plan.reduce(function (sum, step) {
      return sum + step[1];
    }, 0);
    return run(total, function (elapsed, dt) {
      var t = 0;
      for (var i = 0; i < plan.length - 1; i++) {
        t += plan[i][1];
        if (elapsed < t) break;
      }
      show(plan[i][0], i);
      if (each) each(dt);
    }, draw);
  }

  /* Two small stars that take turns around a point. */
  function twinkle(ctx, cx, cy, t, spread) {
    var r = spread || 1;
    var spots = Math.floor(t * 4) % 2 ? [[-9, -6], [8, 2]] : [[7, -8], [-8, 4]];
    ctx.fillStyle = dark() ? "#fff6b0" : "#d97706";
    spots.forEach(function (o) {
      var x = Math.round(cx + o[0] * r);
      var y = Math.round(cy + o[1] * r);
      ctx.fillRect(x, y - 1, 1, 3);
      ctx.fillRect(x - 1, y, 3, 1);
    });
  }

  /* ---------------------------------------------------------------------------------
     Link. */

  function link(sheet) {
    var stage = new Stage();
    var ctx = stage.ctx;
    var g = stage.ground;
    var bushX = Math.round(stage.w * 0.6) - 8; // the bush's left edge
    var s = {
      x: -16, // Link's body, left edge
      frame: LINK.walk[0],
      bush: 0, // 0 none, 1 standing
      bushHop: 0,
      pieces: [],
      clover: null, // {x, y}
      sparkle: 0,
      hop: 0
    };

    function draw() {
      stage.clear();
      if (s.bush) {
        ctx.drawImage(sheet, 0, ITEMS, 16, 16, bushX, g - 15 - Math.round(s.bushHop), 16, 16);
      }
      s.pieces.forEach(function (p) {
        if (p.age > 0.45 && Math.floor(p.age * 20) % 2) return; // blink before vanishing
        ctx.drawImage(sheet, p.sx, ITEMS + p.sy, 8, 8, Math.round(p.x), Math.round(p.y), 8, 8);
      });
      if (s.frame !== null) {
        ctx.drawImage(sheet, s.frame * CELL, 0, CELL, CELL, Math.round(s.x) - 16, g - 32 - Math.round(s.hop), CELL, CELL);
      }
      if (s.clover) {
        ctx.drawImage(sheet, 16, ITEMS, 16, 16, Math.round(s.clover.x), Math.round(s.clover.y), 16, 16);
        if (s.sparkle) twinkle(ctx, s.clover.x + 8, s.clover.y + 8, s.sparkle);
      }
    }

    function physics(dt) {
      s.pieces.forEach(function (p) {
        p.age += dt;
        p.vy += 260 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
      });
      s.pieces = s.pieces.filter(function (p) {
        return p.age < 0.8;
      });
    }

    function walkTo(target) {
      return run(0, function (elapsed, dt) {
        physics(dt);
        s.x = Math.min(target, s.x + WALK_SPEED * dt);
        s.frame = LINK.walk[Math.floor(elapsed / STEP_MS) % 2];
        return s.x >= target;
      }, draw);
    }

    function cut() {
      s.bush = 0;
      [[0, 0, -34, -70], [8, 0, 30, -78], [0, 8, -22, -44], [8, 8, 26, -50]].forEach(function (q) {
        s.pieces.push({ sx: 1 + q[0], sy: 1 + q[1], x: bushX + q[0], y: g - 15 + q[1], vx: q[2], vy: q[3], age: 0 });
      });
    }

    function show(frame) {
      s.frame = frame;
    }

    if (reduced.matches) {
      s.frame = LINK.hold;
      s.x = Math.round(stage.w / 2) - 8;
      s.clover = { x: s.x, y: g - 32 + 2 };
      draw();
      return say(LINES.link).then(function () {
        stage.remove();
      });
    }

    return run(240, function (elapsed) {
      s.bush = 1;
      s.bushHop = Math.sin(Math.min(elapsed / 240, 1) * Math.PI) * 3;
    }, draw)
      .then(function () {
        s.bushHop = 0;
        return walkTo(bushX - 22);
      })
      .then(function () {
        /* He charges his sword: held out, then flashing once it is ready. */
        var plan = [[LINK.charge[0], 380]];
        for (var i = 0; i < 8; i++) plan.push([LINK.charge[i % 2 ? 0 : 1], 70]);
        return sequence(plan, show, draw, physics);
      })
      .then(function () {
        /* The spin attack: the sword goes all the way round, and the bush is cut as it
           comes back to where it started. */
        var order = [6, 7, 0, 1, 2, 3, 4, 5];
        var plan = order.map(function (i) {
          return [LINK.spin[i], 55];
        });
        plan.push([LINK.charge[0], 220]);
        return sequence(plan, function (frame, i) {
          s.frame = frame;
          if (i >= order.length - 1 && s.bush) cut();
        }, draw, physics);
      })
      .then(function () {
        /* The clover pops out of the cut bush and bounces to the ground, as rupees do. */
        s.frame = LINK.face;
        var floor = g - 15;
        var c = { x: bushX, y: floor, vx: 10, vy: -95 };
        var bounces = 0;
        return run(0, function (elapsed, dt) {
          physics(dt);
          c.vy += 300 * dt;
          c.x += c.vx * dt;
          c.y += c.vy * dt;
          if (c.y >= floor) {
            c.y = floor;
            c.vy = -c.vy * 0.4;
            bounces++;
          }
          s.clover = { x: c.x, y: c.y };
          return bounces >= 3 && elapsed > 500;
        }, draw);
      })
      .then(function () {
        return walkTo(s.clover.x - 6);
      })
      .then(function () {
        /* He picks it up and holds it over his head. */
        var from = { x: s.clover.x, y: s.clover.y };
        var hand = { x: s.x, y: g - 32 + 2 };
        s.frame = LINK.hold;
        return run(260, function (elapsed, dt) {
          physics(dt);
          var t = Math.min(elapsed / 260, 1);
          s.clover = { x: from.x + (hand.x - from.x) * t, y: from.y + (hand.y - from.y) * t };
        }, draw);
      })
      .then(function () {
        var spoken = say(LINES.link);
        return run(0, function (elapsed, dt) {
          physics(dt);
          s.sparkle = elapsed / 1000 + 0.01;
        }, draw, spoken);
      })
      .then(function () {
        /* The clover is his: he hops for joy, twice, holding it up. */
        var hand = { x: s.x, y: g - 32 + 2 };
        return run(1300, function (elapsed, dt) {
          physics(dt);
          var t = elapsed % 650;
          s.hop = t < 360 ? Math.sin((t / 360) * Math.PI) * 6 : 0;
          s.clover = { x: hand.x, y: hand.y - s.hop };
          s.sparkle = elapsed / 1000 + 0.01;
        }, draw);
      })
      .then(function () {
        s.clover = null;
        s.sparkle = 0;
        s.frame = LINK.face;
        return run(250, function () {}, draw);
      })
      .then(function () {
        s.hop = 0;
        return walkTo(stage.w + 20);
      })
      .then(function () {
        stage.remove();
      });
  }

  /* ---------------------------------------------------------------------------------
     Zelda, and Link with her, both from The Minish Cap. The stage reaches up to the
     footer's clover, where her light gathers. */

  function zelda(sheet, clover) {
    var stage = stageToClover(clover, 26, 2 / 3);
    var ctx = stage.ctx;
    var g = stage.ground;
    var spot = stage.spot;
    var fromRight = stage.w - spot.x > spot.x; // they come from the side with more room
    var m = fromRight ? -1 : 1; // the way they walk, in and then on past the clover
    var edge = fromRight ? stage.w + 14 : -14;
    var her = { x: edge, stop: Math.round(spot.x - m * 13), frame: ZELDA.walk[0] };
    var him = { x: edge - m * 30, stop: Math.round(spot.x - m * 33), frame: ZELDA.link.walk[0] };
    var s = { light: null, sparkle: 0, blade: false, glint: 0 };

    /* Zelda's sheet draws her facing right, and Link's draws him facing left. */
    function cell(frame, cx, top, flip) {
      var x = Math.round(cx - Z / 2);
      var y = Math.round(top);
      if (!flip) {
        ctx.drawImage(sheet, frame * Z, 0, Z, Z, x, y, Z, Z);
        return;
      }
      ctx.save();
      ctx.translate(x + Z, y);
      ctx.scale(-1, 1);
      ctx.drawImage(sheet, frame * Z, 0, Z, Z, 0, 0, Z, Z);
      ctx.restore();
    }

    function draw() {
      stage.clear();
      if (s.light !== null) cell(s.light, spot.x, spot.y - Z / 2, false);
      cell(him.frame, him.x, g - Z, him.flip);
      cell(her.frame, her.x, g - Z, her.flip);
      if (s.blade) {
        /* The sword in his raised hand, and its glint at the tip. */
        var hand = him.x + (him.flip ? -8 : 8);
        cell(ZELDA.link.blade, hand, g - Z - 1, false);
        if (s.glint && Math.floor(s.glint * 6) % 3) cell(ZELDA.link.glint, hand, g - Z - 9, false);
      }
      if (s.sparkle) twinkle(ctx, spot.x, spot.y, s.sparkle, 1.2);
    }

    function face(who, walking) {
      // Walking, each faces the way they go; standing, both face us.
      if (who === her) her.flip = walking && m < 0;
      else him.flip = walking && m > 0;
    }

    /* Both walk to their marks, each at the same pace; done when both are there. */
    function walkTo(herTarget, himTarget) {
      face(her, true);
      face(him, true);
      // On a wide screen the walk is long: they step up a little, so it never takes much
      // over 5 s.
      var speed = Math.max(ZELDA_SPEED, Math.abs(herTarget - her.x) / 5);
      return run(0, function (elapsed, dt) {
        var arrived = true;
        [[her, herTarget, ZELDA.walk], [him, himTarget, ZELDA.link.walk]].forEach(function (w) {
          var who = w[0];
          if ((w[1] - who.x) * m > 0) {
            who.x = m > 0 ? Math.min(w[1], who.x + speed * dt) : Math.max(w[1], who.x - speed * dt);
            who.frame = w[2][Math.floor(elapsed / (110 * ZELDA_SPEED / speed)) % w[2].length];
            arrived = false;
          }
        });
        return arrived;
      }, draw);
    }

    function done() {
      clover.classList.remove("is-blessed");
      stage.remove();
    }

    if (reduced.matches) {
      her.x = her.stop;
      him.x = him.stop;
      her.frame = ZELDA.pray[2];
      him.frame = ZELDA.link.raise;
      s.blade = true;
      clover.classList.add("is-blessed");
      draw();
      return say(LINES.zelda).then(done);
    }

    return walkTo(her.stop, him.stop)
      .then(function () {
        /* They turn to us, and she finds the clover. */
        face(her, false);
        face(him, false);
        him.frame = ZELDA.link.front;
        return sequence([[ZELDA.front, 300], [ZELDA.surprised, 700], [ZELDA.front, 200]], function (frame) {
          her.frame = frame;
        }, draw);
      })
      .then(function () {
        /* She prays, and her light gathers on the clover and bursts into a ring. */
        return sequence([[ZELDA.pray[0], 140], [ZELDA.pray[1], 140], [ZELDA.pray[2], 300]], function (frame) {
          her.frame = frame;
        }, draw);
      })
      .then(function () {
        var plan = ZELDA.glow.map(function (f) {
          return [f, 170];
        }).concat(ZELDA.burst.map(function (f) {
          return [f, 95];
        }));
        return sequence(plan, function (frame, i) {
          s.light = frame;
          if (i === ZELDA.glow.length) clover.classList.add("is-blessed");
        }, draw);
      })
      .then(function () {
        /* He raises his sword, and it catches the light. */
        s.light = null;
        him.frame = ZELDA.link.raise;
        s.blade = true;
        return run(700, function (elapsed) {
          s.glint = elapsed / 1000 + 0.01;
        }, draw);
      })
      .then(function () {
        her.frame = ZELDA.smile;
        var spoken = say(LINES.zelda);
        return run(0, function (elapsed) {
          s.sparkle = elapsed / 1000 + 0.01;
          s.glint = elapsed / 1000 + 0.71;
        }, draw, spoken);
      })
      .then(function () {
        /* A cheer, and they go on together, past the clover. */
        s.blade = false;
        s.glint = 0;
        s.sparkle = 0;
        him.frame = ZELDA.link.cheer;
        return run(600, function () {}, draw);
      })
      .then(function () {
        var away = fromRight ? -24 : stage.w + 24;
        return walkTo(away, away - m * 30);
      })
      .then(done, function (error) {
        done();
        throw error;
      });
  }

  /* ---------------------------------------------------------------------------------
     Kirby. The stage reaches up to the footer's clover, so he can draw it in. */

  /* The wind Kirby inhales is white, as in the game; on the light theme it would vanish,
     so there it is drawn in slate instead. */
  function windSheet(sheet) {
    if (dark()) return sheet;
    var copy = document.createElement("canvas");
    copy.width = sheet.width;
    copy.height = sheet.height;
    var c = copy.getContext("2d");
    c.drawImage(sheet, 0, 0);
    c.globalCompositeOperation = "source-in";
    c.fillStyle = "#64748b";
    c.fillRect(0, 0, copy.width, copy.height);
    return copy;
  }

  /* The copy ability's name, in a small box over his head, as the game shows it. Letters
     are 3x5 pixels. */
  var FONT = {
    F: ["###", "#..", "##.", "#..", "#.."], I: ["###", ".#.", ".#.", ".#.", "###"],
    R: ["##.", "#.#", "##.", "#.#", "#.#"], E: ["###", "#..", "##.", "#..", "###"],
    S: ["###", "#..", "###", "..#", "###"], L: ["#..", "#..", "#..", "#..", "###"],
    P: ["##.", "#.#", "##.", "#..", "#.."], W: ["#.#", "#.#", "#.#", "###", "#.#"],
    O: ["###", "#.#", "#.#", "#.#", "###"], D: ["##.", "#.#", "#.#", "#.#", "##."],
    U: ["#.#", "#.#", "#.#", "#.#", "###"], C: ["###", "#..", "#..", "#..", "###"],
    K: ["#.#", "#.#", "##.", "#.#", "#.#"], Z: ["###", "..#", ".#.", "#..", "###"]
  };
  var ABILITIES = ["FIRE", "SLEEP", "SWORD", "LUCK"];

  function label(ctx, text, cx, top) {
    var w = text.length * 4 + 3;
    var x = Math.round(cx - w / 2);
    var y = Math.max(1, Math.round(top));
    ctx.fillStyle = dark() ? "#f8fafc" : "#0f172a";
    ctx.fillRect(x, y, w, 9);
    ctx.fillStyle = dark() ? "#0f172a" : "#f8fafc";
    ctx.fillRect(x + 1, y + 1, w - 2, 7);
    ctx.fillStyle = dark() ? "#f8fafc" : "#0f172a";
    for (var n = 0; n < text.length; n++) {
      var glyph = FONT[text[n]];
      for (var j = 0; j < 5; j++) {
        for (var i = 0; i < 3; i++) {
          if (glyph[j][i] === "#") ctx.fillRect(x + 2 + n * 4 + i, y + 2 + j, 1, 1);
        }
      }
    }
  }

  function kirby(sheet, clover, items) {
    var wind = windSheet(sheet);
    var stage = stageToClover(clover, 6);
    var ctx = stage.ctx;
    var g = stage.ground;
    var spot = stage.spot;
    var faceRight = spot.x > stage.w - 40; // no room on its right: come from the left
    var dir = faceRight ? 1 : -1;
    var land = Math.round(spot.x - dir * 22); // where Kirby's centre stands
    var s = {
      x: faceRight ? -16 : stage.w + 16, y: g - 30, frame: KIRBY.float[0], sword: null,
      fx: [], clover: null, star: null, sparkle: 0, ability: null, bubble: 0,
      flip: faceRight, // the sheet draws him facing left
      bits: [] // embers, z's and sparks: {kind, x, y, vx, vy, age, life}
    };
    var lastDraw = null;

    function sprite(frame, cx, feet, flip) {
      var source = KIRBY.suction.indexOf(frame) !== -1 ? wind : sheet;
      var x = Math.round(cx - K / 2);
      var y = Math.round(feet - K);
      if (!flip) {
        ctx.drawImage(source, frame * K, 0, K, K, x, y, K, K);
        return;
      }
      ctx.save();
      ctx.translate(x + K, y);
      ctx.scale(-1, 1);
      ctx.drawImage(source, frame * K, 0, K, K, 0, 0, K, K);
      ctx.restore();
    }

    /* A frame of his sword row: 40x44, his body 16 pixels from its left (he faces left
       on the sheet) and his feet 35 pixels down. */
    function swordSprite(i, cx, feet, flip) {
      var y = Math.round(feet - SWORD.feet);
      if (!flip) {
        ctx.drawImage(sheet, i * SWORD.w, SWORD.top, SWORD.w, SWORD.h, Math.round(cx - SWORD.body), y, SWORD.w, SWORD.h);
        return;
      }
      var x = Math.round(cx - (SWORD.w - SWORD.body));
      ctx.save();
      ctx.translate(x + SWORD.w, y);
      ctx.scale(-1, 1);
      ctx.drawImage(sheet, i * SWORD.w, SWORD.top, SWORD.w, SWORD.h, 0, 0, SWORD.w, SWORD.h);
      ctx.restore();
    }

    /* Small things that fly off him, moved here so every phase can drop some in. */
    function bits() {
      var now = performance.now();
      var dt = lastDraw === null ? 0 : Math.min(now - lastDraw, 50) / 1000;
      lastDraw = now;
      s.bits.forEach(function (b) {
        b.age += dt;
        b.x += b.vx * dt;
        b.y += b.vy * dt;
      });
      s.bits = s.bits.filter(function (b) {
        return b.age < b.life;
      });
      s.bits.forEach(function (b) {
        if (b.kind === "ember") {
          ctx.fillStyle = b.age < b.life / 2 ? "#fbbf24" : "#ea580c";
          ctx.fillRect(Math.round(b.x), Math.round(b.y), 1, 1);
        } else if (b.kind === "spark") {
          ctx.fillStyle = dark() ? "#fff6b0" : "#d97706";
          var x = Math.round(b.x);
          var y = Math.round(b.y);
          ctx.fillRect(x, y - 1, 1, 3);
          ctx.fillRect(x - 1, y, 3, 1);
        } else {
          ctx.fillStyle = dark() ? "#cbd5e1" : "#475569";
          FONT.Z.forEach(function (row, j) {
            for (var i = 0; i < 3; i++) if (row[i] === "#") ctx.fillRect(Math.round(b.x) + i, Math.round(b.y) + j, 1, 1);
          });
        }
      });
    }

    /* A ring of sparks around him, as each ability lands. */
    function burst() {
      for (var i = 0; i < 8; i++) {
        var a = (i / 8) * Math.PI * 2;
        s.bits.push({ kind: "spark", x: s.x, y: s.y - 8, vx: Math.cos(a) * 34, vy: Math.sin(a) * 34, age: 0, life: 0.45 });
      }
    }

    function draw() {
      stage.clear();
      s.fx.forEach(function (f) {
        sprite(f.frame, f.x, f.y, s.flip);
      });
      if (s.clover) {
        ctx.drawImage(items, 16, ITEMS, 16, 16, Math.round(s.clover.x - 8), Math.round(s.clover.y - 8), 16, 16);
      }
      if (s.star) sprite(s.star.frame, s.star.x, s.star.y + 8, false);
      if (s.sword !== null) swordSprite(s.sword, s.x, s.y, s.flip);
      else sprite(s.frame, s.x, s.y, s.flip);
      bits();
      if (s.bubble) sprite(KIRBY.bubble, s.x + dir * 9, s.y - 10 - Math.sin(s.bubble * 3) * 2, false);
      if (s.sparkle) twinkle(ctx, s.x, s.y - 12, s.sparkle, 1.4);
      if (s.ability) label(ctx, s.ability, s.x, s.y - (s.sword !== null ? 48 : 30));
    }

    function show(frame) {
      s.frame = frame;
    }

    /* The ability card spins through the abilities and stops on `name`, with a ring of
       sparks; the first spin is the longest. */
    var spins = 0;
    function roulette(name) {
      s.sword = null;
      s.frame = KIRBY.front;
      var spin = spins++ ? 360 : 560;
      var landed = false;
      return run(spin + 260, function (elapsed) {
        s.ability = elapsed < spin ? ABILITIES[Math.floor(elapsed / 65) % ABILITIES.length] : name;
        if (elapsed >= spin && !landed) {
          landed = true;
          burst();
        }
      }, draw);
    }

    function done() {
      clover.classList.remove("is-taken");
      stage.remove();
    }

    if (reduced.matches) {
      s.x = land;
      s.y = g;
      s.frame = KIRBY.front;
      s.sparkle = 0.01;
      s.ability = "LUCK";
      draw();
      return say(LINES.kirby.concat(LINES.kirbyEnd)).then(done);
    }

    return run(1500, function (elapsed) {
      /* Floating in, puffed up, flapping, and drifting down to land beside the clover. */
      var t = Math.min(elapsed / 1500, 1);
      var from = faceRight ? -16 : stage.w + 16;
      s.x = from + (land - from) * (1 - Math.pow(1 - t, 2));
      s.y = g - 30 * (1 - t) - Math.sin(elapsed / 160) * 2 * (1 - t);
      s.frame = KIRBY.float[Math.floor(elapsed / 180) % 2];
    }, draw)
      .then(function () {
        s.y = g;
        s.frame = KIRBY.deflate;
        var puff = { frame: KIRBY.air, x: land + dir * 12, y: g - 4 };
        s.fx = [puff];
        return run(420, function (elapsed, dt) {
          puff.x += dir * 40 * dt;
          if (elapsed > 260) {
            s.fx = [];
            s.frame = KIRBY.stand;
          }
        }, draw);
      })
      .then(function () {
        return run(360, function (elapsed) {
          s.frame = elapsed > 180 && elapsed < 260 ? KIRBY.blink : KIRBY.stand;
        }, draw);
      })
      .then(function () {
        /* He inhales; the wind draws the clover out of the footer and into his mouth. */
        s.frame = KIRBY.inhale;
        var gust = { frame: KIRBY.suction[0], x: land + dir * 16, y: g };
        s.fx = [gust];
        clover.classList.add("is-taken");
        var mouth = { x: land + dir * 8, y: g - 9 };
        return run(900, function (elapsed) {
          gust.frame = KIRBY.suction[Math.floor(elapsed / 90) % 2];
          var t = Math.max(0, Math.min((elapsed - 250) / 550, 1));
          var ease = t * t;
          s.clover = t < 1 ? {
            x: spot.x + (mouth.x - spot.x) * ease,
            y: spot.y + (mouth.y - spot.y) * ease
          } : null;
        }, draw);
      })
      .then(function () {
        s.fx = [];
        s.clover = null;
        s.frame = KIRBY.mouthful;
        return run(520, function () {}, draw);
      })
      .then(function () {
        /* A gulp, and LUCK becomes his copy ability. */
        return sequence([[KIRBY.squash, 160], [KIRBY.front, 260]], show, draw);
      })
      .then(function () {
        s.ability = "LUCK";
        var spoken = say(LINES.kirby);
        return run(0, function (elapsed) {
          s.frame = KIRBY.front;
          s.sparkle = elapsed / 1000 + 0.01;
        }, draw, spoken);
      })
      .then(function () {
        /* Luck can be anything: first it comes up FIRE, and he breathes it. */
        s.sparkle = 0;
        return roulette("FIRE");
      })
      .then(function () {
        var plan = [[KIRBY.fireFlash, 200]];
        for (var i = 0; i < 16; i++) plan.push([KIRBY.fire[i % 4], 70]);
        plan.push([KIRBY.front, 350]);
        var next = 200;
        var t = 0;
        return sequence(plan, show, draw, function (dt) {
          t += dt * 1000;
          while (t >= next && next < 1300) {
            s.bits.push({ kind: "ember", x: s.x + dir * 9, y: s.y - 7 + Math.random() * 4, vx: dir * (30 + Math.random() * 30), vy: -10 - Math.random() * 20, age: 0, life: 0.5 + Math.random() * 0.3 });
            next += 40;
          }
        });
      })
      .then(function () {
        /* Then SLEEP: he dozes off on the spot, a bubble at his nose, and wakes with a start. */
        return roulette("SLEEP");
      })
      .then(function () {
        var nextZ = 700;
        return run(2300, function (elapsed) {
          if (elapsed >= nextZ && elapsed < 1700) {
            s.bits.push({ kind: "z", x: s.x - dir * 4, y: s.y - 20, vx: -dir * 6, vy: -9, age: 0, life: 1.2 });
            nextZ += 450;
          }
          if (elapsed < 1900) {
            s.ability = elapsed < 600 ? "SLEEP" : null; // asleep, he shows nothing
            s.frame = KIRBY.sleep[Math.min(Math.floor(elapsed / 300), 2)];
            s.bubble = elapsed > 600 ? elapsed / 1000 : 0;
            s.y = g;
          } else {
            s.bubble = 0;
            s.ability = "SLEEP";
            s.frame = KIRBY.front;
            s.y = g - Math.sin(Math.min((elapsed - 1900) / 400, 1) * Math.PI) * 6;
          }
        }, draw);
      })
      .then(function () {
        /* Then SWORD: one swing round, and he raises it as Link raises a treasure. */
        s.y = g;
        return roulette("SWORD");
      })
      .then(function () {
        var plan = [0, 1, 2, 3, 4].map(function (i) {
          return [i, 75];
        }).concat([[5, 110], [6, 110], [7, 900]]);
        return sequence(plan, function (i) {
          s.sword = i;
        }, draw).then(function () {
          burst();
          return run(380, function (elapsed) {
            s.y = g - Math.sin(Math.min(elapsed / 380, 1) * Math.PI) * 5;
          }, draw);
        });
      })
      .then(function () {
        /* But luck isn't his to keep. */
        s.sword = null;
        s.ability = "LUCK";
        s.frame = KIRBY.front;
        return run(0, function () {}, draw, say(LINES.kirbyEnd));
      })
      .then(function () {
        /* He spits it back as a star, which bursts where the clover was. */
        s.ability = null;
        s.frame = KIRBY.spit;
        var start = { x: land + dir * 12, y: g - 10 };
        return run(560, function (elapsed) {
          var t = Math.min(elapsed / 560, 1);
          s.star = {
            frame: KIRBY.star[Math.floor(elapsed / 70) % 4],
            x: start.x + (spot.x - start.x) * t,
            y: start.y + (spot.y - start.y) * t - Math.sin(t * Math.PI) * 10
          };
        }, draw);
      })
      .then(function () {
        var at = s.star;
        clover.classList.remove("is-taken");
        return run(260, function (elapsed) {
          s.frame = KIRBY.stand;
          s.star = { frame: KIRBY.poof[Math.min(Math.floor(elapsed / 85), 2)], x: at.x, y: at.y };
        }, draw);
      })
      .then(function () {
        /* The clover is back: a hop of joy, and a blink. */
        s.star = null;
        return run(720, function (elapsed) {
          s.y = g - Math.sin(Math.min(elapsed / 360, 1) * Math.PI) * 7;
          s.frame = elapsed > 480 && elapsed < 580 ? KIRBY.blink : elapsed < 360 ? KIRBY.front : KIRBY.stand;
        }, draw);
      })
      .then(function () {
        /* He turns round, puffs up again and floats back the way he came. */
        s.y = g;
        s.flip = !faceRight;
        return run(0, function (elapsed, dt) {
          s.frame = elapsed < 200 ? KIRBY.puffUp : KIRBY.float[Math.floor(elapsed / 180) % 2];
          if (elapsed >= 200) {
            s.x -= dir * 55 * dt;
            s.y = Math.max(g - 24, s.y - 22 * dt);
          }
          return s.x < -20 || s.x > stage.w + 20;
        }, draw);
      })
      .then(done, function (error) {
        done();
        throw error;
      });
  }

  /* ---------------------------------------------------------------------------------
     The guests, and the one called last, so a random call never repeats it. */

  var last = null;

  window.CloverGuests = {
    /* Each guest's face in the menu (clover.js): a frame of its sheet and how large. */
    list: [
      { id: "link", name: "Link", face: { sheet: "link", x: 6 * CELL + 16, y: 16, w: 16, h: 16, size: 2 } },
      { id: "zelda", name: "Zelda", face: { sheet: "zelda", x: ZELDA.front * Z + 8, y: 24, w: 32, h: 24, size: 4 / 3 } },
      { id: "kirby", name: "Kirby", face: { sheet: "kirby", x: 4, y: 8, w: 16, h: 16, size: 2 } }
    ],
    play: function (id, config, clover) {
      var ids = this.list.map(function (guest) {
        return guest.id;
      });
      if (!id) {
        var pool = ids.length > 1 ? ids.filter(function (each) { return each !== last; }) : ids;
        id = pool[Math.floor(Math.random() * pool.length)];
      }
      last = id;
      if (id === "kirby") {
        return Promise.all([image(config.kirby), image(config.link)]).then(function (sheets) {
          return kirby(sheets[0], clover, sheets[1]);
        });
      }
      if (id === "zelda") {
        return image(config.zelda).then(function (sheet) {
          return zelda(sheet, clover);
        });
      }
      return image(config.link).then(link);
    }
  };
})();
