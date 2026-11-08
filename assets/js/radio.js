/* The radio on the Music page (see layouts/_shortcodes/radio.html). A small yellow car
   waits on a ground line with its reflection under it. Pressed, its headlights come on,
   it hops, and it comes apart pixel by pixel in a shower of sparks to put itself back
   together as a tabletop radio; the radio lights its dial and tunes in a few song titles
   between bursts of static, the way Bumblebee, in Transformers, speaks through the
   radio. Left alone, it turns back into a car, and never the one it was: the yellow
   Beetle and the yellow Camaro take turns, the way Bumblebee traded one for the other.
   Which of the two is parked first is luck.

   The drawings are original pixel art, defined below as grids. The messages come from
   data/radio.json, through a <script type="application/json"> that
   layouts/_partials/extend-head.html writes into the head. */
(function () {
  "use strict";

  const root = document.querySelector("[data-cw-radio-root]");
  const source = document.querySelector("script.cw-radio-messages");
  if (!root || !source) return;

  let messages = [];
  try {
    messages = JSON.parse(source.textContent).messages || [];
  } catch (e) {
    return;
  }
  if (!messages.length) return;

  const button = root.querySelector("[data-cw-radio]");
  const canvas = root.querySelector(".cw-radio-canvas");
  const bubble = root.querySelector(".cw-radio-bubble");
  const ctx = canvas.getContext("2d");
  const still = window.matchMedia("(prefers-reduced-motion: reduce)");

  // ------------------------------------------------------------------ the drawings

  const PALETTE = {
    Y: "#f7c21b", // body
    L: "#ffde5c", // highlight
    D: "#c48d0b", // shade
    K: "#16181d", // outline, stripes, tyres, frames
    G: "#9fe4ff", // glass, lit
    B: "#3d97d1", // glass, deep
    C: "#e6e8ec", // chrome
    S: "#8a909b", // steel: hubcaps, speaker cloth, knobs
    N: "#3a3d45", // speaker cloth, dark
    H: "#fffbe0", // headlights
    R: "#e8413a", // tail lights, needle, antenna tip
    W: "#f8f0d4", // dial face
  };

  // The Beetle, "el bocho": side view, facing right. 38 x 18.
  const BEETLE = [
    "              KKKKKKKKK               ",
    "           KKKLLLLLLLLLKK             ",
    "          KYLLYYYYYYYYYYYK            ",
    "         KYYGGGGGGGKGGGGGYK           ",
    "        KYYGGGGGGGGKGGGGGGYK          ",
    "       KYYYGBBBBBBBKBBBBBBGYK         ",
    "      KYYYYKKKKKKKKKKKKKKKKYYK        ",
    "     KYYYYYYYYYYYYYYYYYYYYYYYYKK      ",
    "    KYYYYYYYYYYYYYYYYYYYYYYYYYYYKK    ",
    "   KLLLKKKKKYYYYYYYYYYYYYYYKKKKKLLKK  ",
    "  KRYYKKSSSKKYYYYYKYYYYYYYKKSSSKKYYHK ",
    "  KRYKKSCCCSKKYYYYKYYYYYYKKSCCCSKKYHK ",
    "  KYYKSCSSSCSKYYYYKYYYYYYKSCSSSCSKYYK ",
    "  KDDKSCSKSCSKDDDDDDDDDDDKSCSKSCSKDDK ",
    " KCCCKSCSSSCSKDDDDDDDDDDDKSCSSSCSKCCCK",
    "  KKKKKSCCCSKKKKKKKKKKKKKKKSCCCSKKKK  ",
    "      KKSSSKK             KKSSSKK     ",
    "       KKKKK               KKKKK      ",
  ];

  // The Camaro, with the black stripe down its hood: side view, facing right. 45 x 16.
  const CAMARO = [
    "             KKKKKKKKKKKKKK                  ",
    "           KKLLLLLLLLLLLLLLKK                ",
    "          KYGGGGGGGGGKGGGGGGGYKK             ",
    "         KYGGGGGGGGGGKGGGGGGGGGYKK           ",
    "        KYYGBBBBBBBBBKBBBBBBBBBGYYKK         ",
    "    KKKKYYYKKKKKKKKKKKKKKKKKKKKKYYYLLLLLLLLKK",
    "   KLLLLYYYYYYYYYYYYYYYYYYYYYYYYYYYKKKKKKKKYK",
    "  KRRYYKKKKKYYYYYYYYYYYYYYYYYYYYYKKKKKYYYYYHK",
    "  KRRYKKSSSKKYYYYYYYYYYYYYYYYYYYKKSSSKKYYYYHK",
    "  KYYKKSCCCSKKKYYYYYYYYYYYYYYYYKKSCCCSKKYYYYK",
    "  KDDKSCSSSCSKDDDDDDDDDDDDDDDDDKSCSSSCSKDDDDK",
    " KCCCKSCSKSCSKDDDDDDDDDDDDDDDDDKSCSKSCSKDCCCK",
    "  KKKKSCSSSCSKKKKKKKKKKKKKKKKKKKSCSSSCSKKKKK ",
    "     KKSCCCSKK                 KKSCCCSKK     ",
    "      KKSSSKK                   KKSSSKK      ",
    "       KKKKK                     KKKKK       ",
  ];

  // The radio: a tabletop set with the car's stripes across its top, a speaker, a dial,
  // two knobs and an antenna. 32 x 22.
  const RADIO = [
    "                           R    ",
    "                          K     ",
    "                          K     ",
    "                         K      ",
    "                         K      ",
    "    KKKKKKKKKKKKKKKKKKKKKKKK    ",
    "  KKLLLLLLLKKLLLKKLLLLLLLLLLKK  ",
    " KYLLLLLLLLKKLLLKKLLLLLLLLLLLYK ",
    " KYYYYYYYYYYYYYYYYYYYYYYYYYYYYK ",
    " KYKKKKKKKKKKKKKKYKKKKKKKKKKKYK ",
    " KYKNSNSNSNSNSNSKYKWWWWWWWWWWKYK",
    " KYKSNSNSNSNSNSNKYKWWWWWWWWWWKYK",
    " KYKNSNSNSNSNSNSKYKWKWKWKWKWWKYK",
    " KYKSNSNSNSNSNSNKYKWWWWWWWWWWKYK",
    " KYKNSNSNSNSNSNSKYKKKKKKKKKKKKYK",
    " KYKSNSNSNSNSNSNKYYYYYYYYYYYYYYK",
    " KYKNSNSNSNSNSNSKYYYKKKYYYKKKYYK",
    " KYKSNSNSNSNSNSNKYYKSCSKYKSCSKYK",
    " KYKKKKKKKKKKKKKKYYYKKKYYYKKKYYK",
    " KDDDDDDDDDDDDDDDDDDDDDDDDDDDDDK",
    "  KKKKKKKKKKKKKKKKKKKKKKKKKKKKK ",
    "    KK                    KK    ",
  ];

  // The stage: W columns, the ground under row GROUND - 1, and REFLECT rows of
  // reflection below it, like a car on a wet floor.
  const W = 48;
  const GROUND = 24;
  const REFLECT = 8;
  const H = GROUND + REFLECT;
  const SCALE = 5;

  function pixels(grid, ox) {
    const out = [];
    const oy = GROUND - grid.length;
    grid.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        const c = row[x];
        if (c !== " ") out.push({ x: x + ox, y: y + oy, c: PALETTE[c], k: c });
      }
    });
    return out;
  }

  const CARS = [
    { pixels: pixels(BEETLE, 5), label: "A small yellow Beetle. Press it." },
    { pixels: pixels(CAMARO, 2), label: "A yellow Camaro with a black stripe. Press it." },
  ];
  const radioPixels = pixels(RADIO, 8);

  // The dial window (its cream face), the speaker cloth and the headlights.
  const DIAL_FACE = radioPixels.filter((p) => p.k === "W");
  const DIAL = {
    y: Math.min(...DIAL_FACE.map((p) => p.y)),
    h: 4,
    x0: Math.min(...DIAL_FACE.map((p) => p.x)),
    x1: Math.max(...DIAL_FACE.map((p) => p.x)),
  };
  const GRILLE = radioPixels.filter((p) => (p.k === "N" || p.k === "S") && p.x < 8 + 16);
  const WAVES = [
    [[6, 14], [5, 15], [5, 16], [5, 17], [6, 18]],
    [[4, 13], [3, 14], [3, 15], [3, 16], [3, 17], [3, 18], [4, 19]],
  ];

  // Pair every pixel of a car with one of the radio, in reading order from left to
  // right, so the car folds up column by column into the set. The longer list sets the
  // count; the shorter one lends some of its pixels twice.
  const order = (a, b) => a.x - b.x || a.y - b.y;
  function pairsFor(carPixels) {
    const from = carPixels.slice().sort(order);
    const to = radioPixels.slice().sort(order);
    const n = Math.max(from.length, to.length);
    const pairs = [];
    for (let i = 0; i < n; i++) {
      pairs.push([from[Math.floor((i * from.length) / n)], to[Math.floor((i * to.length) / n)]]);
    }
    return pairs;
  }

  // ------------------------------------------------------------------ drawing

  function size() {
    const ratio = window.devicePixelRatio || 1;
    canvas.width = W * SCALE * ratio;
    canvas.height = H * SCALE * ratio;
    ctx.setTransform(SCALE * ratio, 0, 0, SCALE * ratio, 0, 0);
    ctx.imageSmoothingEnabled = false;
  }

  function hex(c) {
    return [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
  }

  function mix(a, b, t) {
    const p = hex(a);
    const q = hex(b);
    return `rgb(${p.map((v, i) => Math.round(v + (q[i] - v) * t)).join(",")})`;
  }

  function dot(x, y, c, alpha = 1) {
    ctx.globalAlpha = alpha;
    ctx.fillStyle = c;
    ctx.fillRect(x, y, 1, 1);
    ctx.globalAlpha = 1;
  }

  // The reflection: the same pixel, mirrored under the ground line and fading with
  // depth. Anything above the ground is mirrored; the antenna's tip lands too deep
  // to show, which is right.
  function reflect(x, y, c, alpha = 1) {
    const depth = GROUND - 1 - y;
    if (depth < 0 || depth >= REFLECT) return;
    dot(x, GROUND + depth, c, alpha * 0.28 * (1 - depth / REFLECT));
  }

  function paint(list, dx = 0, dy = 0) {
    ctx.clearRect(0, 0, W, H);
    for (const p of list) {
      dot(p.x + dx, p.y + dy, p.c);
      reflect(p.x + dx, p.y + dy, p.c);
    }
  }

  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  // A car with its headlights on: the beam spreads to the right of the lights.
  function paintCar(car, beam = 0, dy = 0) {
    paint(car.pixels, 0, dy);
    if (!beam) return;
    for (const p of car.pixels) {
      if (p.k !== "H") continue;
      for (let i = 1; i <= 6; i++) {
        const a = beam * 0.55 * (1 - i / 7);
        dot(p.x + i, p.y + dy, PALETTE.H, a);
        if (i > 2) {
          dot(p.x + i, p.y + dy - 1, PALETTE.H, a * 0.5);
          dot(p.x + i, p.y + dy + 1, PALETTE.H, a * 0.5);
        }
      }
    }
  }

  // t from 0 (car) to 1 (radio). Each pixel leaves a little after the one to its left
  // and arcs up on its way, so the car seems to unfold rather than dissolve; a few
  // sparks fly off the pixels in flight.
  function morphFrame(pairs, t) {
    ctx.clearRect(0, 0, W, H);
    for (const [a, b] of pairs) {
      const delay = (a.x / W) * 0.45;
      const k = ease(Math.min(1, Math.max(0, (t - delay) / 0.55)));
      const x = Math.round(a.x + (b.x - a.x) * k);
      const y = Math.round(a.y + (b.y - a.y) * k - Math.sin(k * Math.PI) * 4);
      const c = mix(a.c, b.c, k);
      dot(x, y, c);
      reflect(x, y, c);
      if (k > 0 && k < 1 && Math.random() < 0.04) {
        dot(x + Math.round(Math.random() * 4 - 2), y - 1 - Math.round(Math.random() * 3), Math.random() < 0.5 ? PALETTE.G : PALETTE.L, 0.8);
      }
    }
  }

  let needle = DIAL.x0 + 3;
  let lit = false;
  let wave = -1;

  function paintRadio(noise = 0) {
    paint(radioPixels);
    if (lit) {
      for (const p of DIAL_FACE) {
        dot(p.x, p.y, PALETTE.G);
        reflect(p.x, p.y, PALETTE.G);
      }
      // the lit dial spills a little light onto the body around it
      for (let x = DIAL.x0 - 1; x <= DIAL.x1 + 1; x++) {
        dot(x, DIAL.y - 2, PALETTE.G, 0.18);
        dot(x, DIAL.y + DIAL.h + 1, PALETTE.G, 0.18);
      }
    }
    if (wave >= 0) {
      WAVES.forEach((arc, i) => {
        if (i > wave) return;
        for (const [x, y] of arc) {
          dot(x, y, PALETTE.Y, 0.9 - i * 0.3); // left of the speaker
          dot(W - 1 - x, y, PALETTE.Y, 0.9 - i * 0.3); // and its mirror on the right
          reflect(x, y, PALETTE.Y, 0.9 - i * 0.3);
          reflect(W - 1 - x, y, PALETTE.Y, 0.9 - i * 0.3);
        }
      });
    }
    // The needle, across the dial.
    const nx = Math.round(needle);
    ctx.fillStyle = PALETTE.R;
    ctx.fillRect(nx, DIAL.y, 1, DIAL.h);
    reflect(nx, DIAL.y + DIAL.h - 1, PALETTE.R);
    // Static: the speaker cloth flickers.
    if (noise) {
      for (const p of GRILLE) {
        if (Math.random() < noise) dot(p.x, p.y, Math.random() < 0.5 ? PALETTE.L : PALETTE.K);
      }
    }
  }

  // The station's number, from where the needle sits on the dial.
  function frequency() {
    const span = DIAL.x1 - 1 - (DIAL.x0 + 1);
    const fm = 88 + ((needle - DIAL.x0 - 1) / span) * 20;
    return `${fm.toFixed(1)} FM`;
  }

  // ------------------------------------------------------------------ sound

  // Radio static, made on the spot: no audio files. Only ever after a press, and quiet.
  let audio = null;
  function context() {
    audio = audio || new (window.AudioContext || window.webkitAudioContext)();
    return audio;
  }

  function hiss(seconds) {
    try {
      const ac = context();
      const frames = Math.floor(ac.sampleRate * seconds);
      const buffer = ac.createBuffer(1, frames, ac.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < frames; i++) data[i] = Math.random() * 2 - 1;
      const noise = ac.createBufferSource();
      noise.buffer = buffer;
      const band = ac.createBiquadFilter();
      band.type = "bandpass";
      band.frequency.value = 1700;
      band.Q.value = 0.8;
      const gain = ac.createGain();
      const now = ac.currentTime;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.05, now + 0.03);
      gain.gain.linearRampToValueAtTime(0, now + seconds);
      noise.connect(band).connect(gain).connect(ac.destination);
      noise.start();
    } catch (e) {
      /* no sound, no matter */
    }
  }

  // The sound of the change: a few quick mechanical clicks climbing up, even quieter.
  function whirr(seconds) {
    try {
      const ac = context();
      const now = ac.currentTime;
      for (let i = 0; i < 7; i++) {
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        osc.type = "square";
        osc.frequency.value = 180 + i * 90;
        const at = now + (i * seconds) / 7;
        gain.gain.setValueAtTime(0, at);
        gain.gain.linearRampToValueAtTime(0.012, at + 0.01);
        gain.gain.linearRampToValueAtTime(0, at + 0.07);
        osc.connect(gain).connect(ac.destination);
        osc.start(at);
        osc.stop(at + 0.08);
      }
    } catch (e) {
      /* no sound, no matter */
    }
  }

  // ------------------------------------------------------------------ timing

  const wait = (ms) => new Promise((done) => setTimeout(done, ms));

  function animate(ms, frame) {
    return new Promise((done) => {
      if (still.matches) {
        frame(1);
        return done();
      }
      const start = performance.now();
      function step(now) {
        const t = Math.min(1, (now - start) / ms);
        frame(t);
        if (t < 1) requestAnimationFrame(step);
        else done();
      }
      requestAnimationFrame(step);
    });
  }

  // ------------------------------------------------------------------ the act

  let state = "car"; // car | changing | radio | tuning
  let carIndex = Math.floor(Math.random() * CARS.length); // which car is parked first is luck
  let car = CARS[carIndex];
  let idle = null;
  let deck = [];

  function next() {
    if (!deck.length) {
      deck = messages.map((_, i) => i);
      for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
      }
    }
    return messages[deck.pop()];
  }

  function say(html, isStatic) {
    bubble.hidden = false;
    bubble.innerHTML = html;
    bubble.classList.toggle("is-static", Boolean(isStatic));
    requestAnimationFrame(() => bubble.classList.add("is-on"));
  }

  function hush() {
    bubble.classList.remove("is-on");
  }

  function escape(text) {
    const span = document.createElement("span");
    span.textContent = text;
    return span.innerHTML;
  }

  async function tune(target) {
    const start = needle;
    hiss(0.5);
    await animate(500, (t) => {
      needle = start + (target - start) * ease(t) + (t < 1 ? Math.sin(t * 40) * 0.6 : 0);
      paintRadio(0.5 * (1 - t) + 0.1);
      say(`<span class="cw-radio-title">kshhh…</span><span class="cw-radio-from">${frequency()}</span>`, true);
    });
    needle = target;
    paintRadio();
  }

  async function transform(toRadio) {
    state = "changing";
    hush();
    if (toRadio) {
      // The headlights come on, twice, before it moves.
      await animate(520, (t) => paintCar(car, Math.abs(Math.sin(t * Math.PI * 2))));
      await animate(420, (t) => paintCar(car, 1, -Math.round(Math.abs(Math.sin(t * Math.PI * 2)) * 2)));
      whirr(1.1);
      const pairs = pairsFor(car.pixels);
      await animate(1100, (t) => morphFrame(pairs, t));
      paintRadio();
    } else {
      // Back to a car, and never the same one twice in a row.
      carIndex = (carIndex + 1) % CARS.length;
      car = CARS[carIndex];
      const pairs = pairsFor(car.pixels);
      await animate(420, (t) => paint(radioPixels, 0, -Math.round(Math.abs(Math.sin(t * Math.PI * 2)))));
      await animate(1100, (t) => morphFrame(pairs, 1 - t));
      await animate(360, (t) => paintCar(car, 1 - t));
    }
    button.setAttribute("aria-label", toRadio ? "A radio. Press it to tune in." : car.label);
  }

  async function broadcast() {
    state = "tuning";
    lit = true;
    clearTimeout(idle);
    const message = next();
    for (const part of message) {
      const station = DIAL.x0 + 1 + Math.floor(Math.random() * (DIAL.x1 - DIAL.x0 - 1));
      await tune(station);
      say(`<span class="cw-radio-title">${escape(part.title)}</span><span class="cw-radio-from">${escape(part.from)}</span>`);
      if (still.matches) {
        await wait(2000);
      } else {
        await animate(2000, (t) => {
          wave = Math.floor(t * 10) % 3 - 1;
          paintRadio();
        });
        wave = -1;
        paintRadio();
      }
    }
    await wait(1200);
    hush();
    lit = false;
    paintRadio();
    state = "radio";
    idle = setTimeout(async () => {
      if (state !== "radio") return;
      await transform(false);
      state = "car";
    }, 7000); // left alone seven seconds, it is a car again
  }

  button.addEventListener("click", async () => {
    if (state === "car") {
      await transform(true);
      await broadcast();
    } else if (state === "radio") {
      await broadcast();
    }
  });

  size();
  paintCar(car);
  button.setAttribute("aria-label", car.label);
  window.addEventListener("resize", () => {
    size();
    if (state === "car") paintCar(car);
    else if (state === "radio") paintRadio();
  });
})();
