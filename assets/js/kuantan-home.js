// Kuantan on the homepage (layouts/_partials/kuantan-home.html).
//
// The window: the site's logo, Caesar's Window, is painted with Kuantan's paper,
// alive: its ring and star are the paper, the rest stays the page's colour. Pressed (assets/js/koi.js asks
// window.KuantanHome), the paper grows out of it until it fills the screen and the
// homepage becomes a title card: his photo and name, centred, over the paper. The
// card closes back into the window.
//
// On the card: ← → change the design, ↑ ↓ the palette (a swipe on a phone; a tap
// changes the palette), the bar at the foot has the same, the way to /kuantan/
// itself and Close; Escape closes too.
//
// The window draws a small canvas; the card's two full-screen canvases exist only
// while it is open. Both stop while the tab is hidden.
//
// Kuantan's paint and shader come from kuantan-paper.js, concatenated before this.

(() => {
  const script = document.currentScript;
  const href = (script && script.dataset.kuantan) || "/kuantan/";
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const root = document.documentElement;
  const pick = (n, not = -1) => {
    let i;
    do i = Math.floor(Math.random() * n); while (n > 1 && i === not);
    return i;
  };
  const between = ([min, max]) => min + Math.random() * (max - min);
  // the designs the window and the card start on: the ones that move the most and are loved
  const START = ["Ink rings", "Spiral", "Marble", "Swirls"].map((n) => DESIGNS.indexOf(n)).filter((i) => i >= 0);

  // the window runs faster than the card: at its size, the bath's pace would look still
  const WINDOW_PACE = 4;
  let design = START[pick(START.length)];
  let palette = pick(PALETTES.length);

  // ---- the window ------------------------------------------------------------------

  const logo = document.querySelector("body > header nav a[href='/']");
  if (!logo) return;
  const pane = document.createElement("span");
  pane.className = "cw-window";
  pane.setAttribute("aria-hidden", "true");
  let windowSheet;
  try {
    windowSheet = new Sheet(pane, 0.36);
  } catch {
    return; // no WebGL: the logo stays as it is, and koi.js opens the ball with it
  }
  windowSheet.show(design, PALETTES[palette]);
  // the logo's drawing is the mask: its ring and star are painted with the paper
  const mask = script && script.dataset.mask;
  if (mask) pane.style.setProperty("--cw-mask", `url("${mask}")`);
  logo.classList.add("cw-window-logo");
  logo.prepend(pane);

  let windowTimer = 0;
  function windowNextPalette() {
    palette = pick(PALETTES.length, palette);
    windowSheet.show(design, PALETTES[palette], windowSheet);
    windowTimer = setTimeout(windowNextPalette, between(PALETTE_SECONDS) * 1000);
  }
  windowTimer = setTimeout(windowNextPalette, between(PALETTE_SECONDS) * 1000);

  // ---- the card ------------------------------------------------------------------

  let bath = null, sheets = null, card = null, bar = null, label = null;
  let front = 0, fading = 0, open = false, from = logo, cardTimer = 0;

  function build() {
    bath = document.createElement("div");
    bath.className = "cw-bath";
    bath.setAttribute("aria-hidden", "true");
    try {
      sheets = [new Sheet(bath), new Sheet(bath)];
    } catch {
      return false;
    }

    // his photo and name, as the profile shows them
    card = document.createElement("div");
    card.className = "cw-card";
    const photo = document.querySelector(".cw-avatar img:not(.cw-light):not(.cw-dark)");
    const name = document.querySelector("#main-content h1");
    if (photo) {
      const img = document.createElement("img");
      img.src = photo.currentSrc || photo.src;
      img.alt = "";
      card.append(img);
    }
    const h = document.createElement("p");
    h.textContent = name ? name.textContent.trim() : document.title;
    card.append(h);

    bar = document.createElement("div");
    bar.className = "cw-titlebar";
    bar.innerHTML =
      '<button type="button" data-step="-1" aria-label="Previous design">‹</button>' +
      '<span class="cw-titlebar-name" aria-live="polite"></span>' +
      '<button type="button" data-step="1" aria-label="Next design">›</button>' +
      `<a href="${href}">Open Kuantan</a>` +
      '<button type="button" data-close>Close</button>';
    label = bar.querySelector(".cw-titlebar-name");
    bar.querySelectorAll("[data-step]").forEach((b) => b.addEventListener("click", () => step(Number(b.dataset.step), 0)));
    bar.querySelector("[data-close]").addEventListener("click", close);

    document.body.append(bath, card, bar);

    // on the paper: a tap changes the palette, a swipe the design or the palette
    let down = null;
    bath.addEventListener("pointerdown", (e) => { down = { x: e.clientX, y: e.clientY }; });
    bath.addEventListener("pointerup", (e) => {
      if (!down) return;
      const dx = e.clientX - down.x, dy = e.clientY - down.y;
      down = null;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 40) step(0, 1);
      else if (Math.abs(dx) > Math.abs(dy)) step(dx < 0 ? 1 : -1, 0);
      else step(0, dy < 0 ? 1 : -1);
    });
    return true;
  }

  // The new sheet fades in above the old, which stays opaque until it is covered, so
  // the page under the card never shows through halfway.
  let coverTimer = 0;
  function paint(keepBath) {
    const previous = sheets[front];
    front = 1 - front;
    const next = sheets[front];
    next.show(design, PALETTES[palette], keepBath ? previous : null);
    next.draw(0);
    clearTimeout(coverTimer);
    next.canvas.classList.remove("on", "now");
    next.canvas.style.zIndex = 1;
    previous.canvas.style.zIndex = 0;
    previous.canvas.classList.add("on", "now");
    void next.canvas.offsetWidth;
    next.canvas.classList.add("on");
    coverTimer = setTimeout(() => previous.canvas.classList.remove("on"), FADE_SECONDS * 1000 + 100);
    fading = FADE_SECONDS + 0.2;
    label.textContent = `${DESIGNS[design]} · ${PALETTES[palette].name}`;
    clearTimeout(cardTimer);
    cardTimer = setTimeout(() => step(0, 1), between(PALETTE_SECONDS) * 1000);
  }

  /** dDesign: -1, 0 or 1 (a new design: a new bath); dPalette: the same bath, new colours. */
  function step(dDesign, dPalette) {
    if (!open) return;
    if (dDesign) {
      design = (design + dDesign + DESIGNS.length) % DESIGNS.length;
      palette = pick(PALETTES.length, palette);
    } else palette = (palette + dPalette + PALETTES.length) % PALETTES.length;
    paint(!dDesign);
  }

  // The card grows out of what opened it: a circle from its centre to the far corner.
  function circleFrom(el) {
    const r = el.getBoundingClientRect();
    const x = r.left + r.width / 2, y = r.top + r.height / 2;
    const far = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    bath.style.setProperty("--x", `${x}px`);
    bath.style.setProperty("--y", `${y}px`);
    bath.style.setProperty("--r0", `${r.width / 2}px`);
    bath.style.setProperty("--r1", `${far + 2}px`);
  }

  function openCard(opener = logo) {
    if (open) return true;
    if (!sheets && !build()) return false;
    open = true;
    from = opener;
    // the paper continues the window's: same design, palette and bath, seen closer
    clearTimeout(coverTimer);
    sheets[front].canvas.classList.add("now");
    sheets[front].canvas.classList.remove("on");
    sheets[front].canvas.style.zIndex = 0;
    front = 1 - front;
    sheets[front].show(design, PALETTES[palette], opener === logo ? windowSheet : null);
    sheets[front].draw(0);
    sheets[front].canvas.classList.add("on", "now");
    sheets[front].canvas.style.zIndex = 1;
    label.textContent = `${DESIGNS[design]} · ${PALETTES[palette].name}`;
    clearTimeout(cardTimer);
    cardTimer = setTimeout(() => step(0, 1), between(PALETTE_SECONDS) * 1000);
    circleFrom(opener);
    bath.classList.remove("is-open");
    void bath.offsetWidth; // start the circle small
    root.classList.add("cw-titled");
    bath.classList.add("is-open");
    start();
    return true;
  }

  function close() {
    if (!open) return;
    open = false;
    clearTimeout(cardTimer);
    circleFrom(from);
    bath.classList.remove("is-open");
    root.classList.remove("cw-titled");
    fading = reduced ? 0.1 : 1.2; // keep drawing while the circle closes
    // the window takes the card's colours back with it
    windowSheet.show(design, PALETTES[palette], sheets[front]);
    setTimeout(() => sheets && sheets.forEach((s) => s.canvas.classList.remove("now")), 1300);
  }

  // ---- drawing ---------------------------------------------------------------------

  let raf = 0, last = 0;
  function frame(now) {
    const dt = last ? Math.min((now - last) / 1000, 0.1) : 0;
    last = now;
    if (!open || fading > 0) windowSheet.draw(dt * WINDOW_PACE);
    if (sheets && (open || fading > 0)) {
      sheets[front].draw(dt);
      if (fading > 0) {
        fading -= dt;
        sheets[1 - front].draw(dt);
      }
    }
    raf = requestAnimationFrame(frame);
  }
  function start() {
    if (!raf && !document.hidden) {
      last = 0;
      raf = requestAnimationFrame(frame);
    }
  }
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      cancelAnimationFrame(raf);
      raf = 0;
    } else start();
  });
  start();

  // ---- input ---------------------------------------------------------------------

  document.addEventListener("keydown", (e) => {
    if (!open || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === "Escape") close();
    else if (e.key === "ArrowRight") step(1, 0);
    else if (e.key === "ArrowLeft") step(-1, 0);
    else if (e.key === "ArrowDown") step(0, 1);
    else if (e.key === "ArrowUp") step(0, -1);
    else return;
    e.preventDefault();
  });

  // for koi.js, which handles the logo's click
  window.KuantanHome = { open: (el) => openCard(el || logo) };
})();
