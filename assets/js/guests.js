/* The guests the footer's clover calls (assets/js/clover.js), drawn in pixels at the foot
   of the screen. Fetched the first time the clover is used.

   Link, from The Legend of Zelda: Link's Awakening DX: a bush springs up, he walks in,
   cuts it, and out of it comes a four-leaf clover, which he holds up as Link holds up
   every treasure, while the games' text box says that luck is made. In Zelda, rupees and
   hearts come out of the grass you cut; here, the clover. His sprite sheet is
   assets/img/nintendo/link.png, written by scripts/nintendo/build.py, which says where
   every frame comes from.

   Kirby, from Kirby's Adventure: he floats in, lands beside the footer's clover, inhales
   it and swallows it, and LUCK becomes his copy ability; but it isn't his to keep, so he
   spits it back as a star, which bursts where the clover was, and the clover is there
   again. His sheet is assets/img/nintendo/kirby.png, from the same script.

   Everything is drawn on one canvas, fixed to the bottom of the screen and as wide as it,
   at a whole-number scale so the pixels stay square. It catches no clicks. With reduced
   motion, nobody walks: Link appears holding the clover while the text box speaks. */
(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  var CELL = 32; // Link's frames are 32x32, his body in the bottom-left 16x16
  var LINK = { walk: [0, 1], slash: [2, 3, 4], hold: 5 };
  var WALK_SPEED = 62; // sprite pixels per second, close to the game's
  var STEP_MS = 130; // how long each walking frame lasts
  var STAGE_H = 58; // sprite pixels: room for the clover held above his head

  var KIRBY = {
    stand: 0, blink: 1, float: [2, 3], deflate: 4, air: 5, inhale: 6, suction: [7, 8],
    mouthful: 9, squash: 10, front: 11, star: [12, 13, 14, 15], poof: [16, 17, 18],
    spit: 19, puffUp: 20
  };
  var K = 24; // Kirby's frames are 24x24, standing on the cell's bottom edge

  var LINES = {
    link: ["You got a Four-Leaf Clover!", "Luck isn't found: it's made, one cut at a time."],
    kirby: ["Kirby inhaled the clover!", "Copy ability: LUCK. But it isn't his to keep..."]
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

  function Stage(height) {
    this.scale = window.innerWidth < 640 ? 3 : 4;
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
    document.documentElement.style.setProperty("--cw-stage-h", this.h * this.scale + "px");
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

  /* ---------------------------------------------------------------------------------
     Link. */

  function link(sheet) {
    var stage = new Stage();
    var ctx = stage.ctx;
    var g = stage.ground;
    var bushX = Math.round(stage.w * 0.6) - 8; // the bush's left edge
    var s = {
      x: -CELL, // Link's cell, left edge
      frame: LINK.walk[0],
      bush: 0, // 0 none, 1 standing
      bushHop: 0,
      pieces: [],
      clover: null, // {x, y}
      sparkle: 0
    };

    function cell(frame, x, y) {
      ctx.drawImage(sheet, frame * CELL, 0, CELL, CELL, Math.round(x), Math.round(y), CELL, CELL);
    }

    function draw() {
      stage.clear();
      if (s.bush) {
        ctx.drawImage(sheet, 0, 32, 16, 16, bushX, g - 15 - Math.round(s.bushHop), 16, 16);
      }
      s.pieces.forEach(function (p) {
        if (p.age > 0.45 && Math.floor(p.age * 20) % 2) return; // blink before vanishing
        ctx.drawImage(sheet, p.sx, 32 + p.sy, 8, 8, Math.round(p.x), Math.round(p.y), 8, 8);
      });
      if (s.frame !== null) cell(s.frame, s.x, g - CELL);
      if (s.clover) {
        ctx.drawImage(sheet, 16, 32, 16, 16, Math.round(s.clover.x), Math.round(s.clover.y), 16, 16);
        if (s.sparkle) sparkle(s.clover.x + 8, s.clover.y + 8, s.sparkle);
      }
    }

    /* Two small stars that take turns around the clover. */
    function sparkle(cx, cy, t) {
      var spots = Math.floor(t * 4) % 2 ? [[-9, -6], [8, 2]] : [[7, -8], [-8, 4]];
      ctx.fillStyle = "#fff6b0";
      spots.forEach(function (o) {
        var x = Math.round(cx + o[0]);
        var y = Math.round(cy + o[1]);
        ctx.fillRect(x, y - 1, 1, 3);
        ctx.fillRect(x - 1, y, 3, 1);
      });
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

    if (reduced.matches) {
      s.frame = LINK.hold;
      s.x = Math.round(stage.w / 2) - 8;
      s.clover = { x: s.x, y: g - CELL + 2 };
      draw();
      return say(LINES.link).then(function () {
        stage.remove();
      });
    }

    var hand = { x: 0, y: 0 };
    return run(240, function (elapsed) {
      s.bush = 1;
      s.bushHop = Math.sin(Math.min(elapsed / 240, 1) * Math.PI) * 3;
    }, draw)
      .then(function () {
        s.bushHop = 0;
        return walkTo(bushX - 17);
      })
      .then(function () {
        var plan = [[LINK.slash[0], 90], [LINK.slash[1], 70], [LINK.slash[2], 260]];
        var at = 0;
        return run(420, function (elapsed, dt) {
          physics(dt);
          var t = 0;
          for (var i = 0; i < plan.length; i++) {
            t += plan[i][1];
            if (elapsed < t) break;
          }
          var next = plan[Math.min(i, plan.length - 1)][0];
          if (next === LINK.slash[2] && s.bush) cut();
          s.frame = next;
          at = elapsed;
        }, draw);
      })
      .then(function () {
        /* The clover springs out of the cut bush and flies up into Link's hands. */
        var from = { x: bushX, y: g - 16 };
        hand = { x: s.x, y: g - CELL + 2 };
        return run(620, function (elapsed, dt) {
          physics(dt);
          var t = Math.min(elapsed / 620, 1);
          s.clover = {
            x: from.x + (hand.x - from.x) * t,
            y: from.y + (hand.y - from.y) * t - Math.sin(t * Math.PI) * 18
          };
          if (t > 0.6) s.frame = LINK.hold;
        }, draw);
      })
      .then(function () {
        s.frame = LINK.hold;
        s.clover = hand;
        var spoken = say(LINES.link);
        return run(0, function (elapsed, dt) {
          physics(dt);
          s.sparkle = elapsed / 1000 + 0.01;
        }, draw, spoken);
      })
      .then(function () {
        s.clover = null;
        s.sparkle = 0;
        return walkTo(stage.w + 4);
      })
      .then(function () {
        stage.remove();
      });
  }

  /* ---------------------------------------------------------------------------------
     Kirby. The stage reaches up to the footer's clover, so he can draw it in. */

  /* The wind Kirby inhales is white, as in the game; on the light theme it would vanish,
     so there it is drawn in slate instead. */
  function windSheet(sheet) {
    if (document.documentElement.classList.contains("dark")) return sheet;
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

  function kirby(sheet, clover, items) {
    var wind = windSheet(sheet);
    var rect = clover.getBoundingClientRect();
    var scale = window.innerWidth < 640 ? 3 : 4;
    var reach = Math.ceil((window.innerHeight - rect.top) / scale) + 6;
    var stage = new Stage(Math.min(reach, 140));
    var ctx = stage.ctx;
    var g = stage.ground;
    var top = window.innerHeight - stage.h * stage.scale; // the stage's top, on screen
    var spot = { // the clover's centre, in sprite pixels
      x: (rect.left + rect.width / 2) / stage.scale,
      y: (rect.top + rect.height / 2 - top) / stage.scale
    };
    var faceRight = spot.x > stage.w - 40; // no room on its right: come from the left
    var dir = faceRight ? 1 : -1;
    var land = Math.round(spot.x - dir * 22); // where Kirby's centre stands
    var s = { x: faceRight ? -16 : stage.w + 16, y: g - 30, frame: KIRBY.float[0], fx: [], clover: null, star: null, sparkle: 0 };

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

    function draw() {
      stage.clear();
      s.fx.forEach(function (f) {
        sprite(f.frame, f.x, f.y, faceRight);
      });
      if (s.clover) {
        ctx.drawImage(items, 16, 32, 16, 16, Math.round(s.clover.x - 8), Math.round(s.clover.y - 8), 16, 16);
      }
      if (s.star) sprite(s.star.frame, s.star.x, s.star.y + 8, false);
      sprite(s.frame, s.x, s.y, faceRight);
      if (s.sparkle) twinkle(s.x, s.y - 12, s.sparkle);
    }

    function twinkle(cx, cy, t) {
      var spots = Math.floor(t * 4) % 2 ? [[-13, -8], [12, 2]] : [[11, -10], [-12, 4]];
      ctx.fillStyle = "#fff6b0";
      spots.forEach(function (o) {
        var x = Math.round(cx + o[0]);
        var y = Math.round(cy + o[1]);
        ctx.fillRect(x, y - 1, 1, 3);
        ctx.fillRect(x - 1, y, 3, 1);
      });
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
      draw();
      return say(LINES.kirby).then(done);
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
        return run(420, function (elapsed) {
          s.frame = elapsed < 160 ? KIRBY.squash : KIRBY.front;
        }, draw);
      })
      .then(function () {
        var spoken = say(LINES.kirby);
        return run(0, function (elapsed) {
          s.frame = KIRBY.front;
          s.sparkle = elapsed / 1000 + 0.01;
        }, draw, spoken);
      })
      .then(function () {
        /* He spits it back as a star, which bursts where the clover was. */
        s.sparkle = 0;
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
        /* He puffs up again and floats away. */
        s.star = null;
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

  var ACTS = { link: link, kirby: kirby };
  var last = null;

  window.CloverGuests = {
    list: [{ id: "link", name: "Link" }, { id: "kirby", name: "Kirby" }],
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
      return image(config[id]).then(function (sheet) {
        return ACTS[id](sheet);
      });
    }
  };
})();
