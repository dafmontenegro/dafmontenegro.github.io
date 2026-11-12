// Kuantan (/kuantan/): generative paper marbling, the patterns and colours I
// love and that calm me. Named after the beach where Nanami Kento wanted to rest
// (/blog/nanami-kento/), whose last line links here. The paint and the shader are
// in kuantan-paper.js, concatenated before this file.
//
// Every few minutes the design changes, and within a design the palette changes
// now and then while the pattern keeps flowing.
//
// Keys: ← → change design, ↑ ↓ change palette, I shows the names, Space holds the
// design, F full screen, H the help. On a touch screen: a tap shows the names, a
// swipe changes the design (sideways) or the palette (up, down), a long press
// opens the help. The rotation itself shows nothing.

const label = document.getElementById("label");
const sheets = [new Sheet(), new Sheet()];
let front = 0, design = 0, palette = 0, fading = 0, rotating = true;
let designTimer = 0, paletteTimer = 0, labelTimer = 0;

const randomOther = (n, current) => {
  if (n < 2) return 0;
  let i;
  do i = Math.floor(Math.random() * n); while (i === current);
  return i;
};
const between = ([min, max]) => min + Math.random() * (max - min);

/** Crossfade to a design and palette; keepBath keeps the pattern and changes only the colours. */
function show(nextDesign, nextPalette, keepBath = false) {
  design = (nextDesign + DESIGNS.length) % DESIGNS.length;
  palette = (nextPalette + PALETTES.length) % PALETTES.length;
  const previous = sheets[front];
  front = 1 - front;
  sheets[front].show(design, PALETTES[palette], keepBath ? previous : null);
  sheets[front].draw(0);
  sheets[front].canvas.classList.add("on");
  previous.canvas.classList.remove("on");
  fading = FADE_SECONDS + 0.2; // keep drawing the old sheet while it fades out
  schedule(!keepBath);
}

function schedule(newDesign = true) {
  clearTimeout(paletteTimer);
  if (newDesign) clearTimeout(designTimer);
  if (!rotating || document.hidden) return;
  if (newDesign) designTimer = setTimeout(() => show(randomOther(DESIGNS.length, design), randomOther(PALETTES.length, palette)), between(DESIGN_MINUTES) * 60000);
  paletteTimer = setTimeout(() => show(design, randomOther(PALETTES.length, palette), true), between(PALETTE_SECONDS) * 1000);
}

/** Shows a line at the bottom left for a moment: the design and palette, after a change by hand or on I. */
function announce(text, ms = 2000) {
  label.textContent = text;
  label.classList.add("on");
  clearTimeout(labelTimer);
  labelTimer = setTimeout(() => label.classList.remove("on"), ms);
}

let last = 0;
function frame(now) {
  const dt = last ? Math.min((now - last) / 1000, 0.1) : 0;
  last = now;
  sheets[front].draw(dt);
  if (fading > 0) {
    fading -= dt;
    sheets[1 - front].draw(dt);
  }
  requestAnimationFrame(frame);
}

document.addEventListener("visibilitychange", () => {
  last = 0; // no jump after the page was hidden (requestAnimationFrame stops meanwhile)
  if (document.hidden) {
    clearTimeout(designTimer);
    clearTimeout(paletteTimer);
  } else schedule();
});
const help = document.getElementById("help");
const touch = matchMedia("(pointer: coarse)").matches;
help.querySelector(touch ? ".keys" : ".touch").hidden = true;
function toggleHelp(open = help.hidden) {
  help.hidden = !open;
  if (open) label.classList.remove("on");
}
const step = {
  nextDesign: () => show(design + 1, randomOther(PALETTES.length, palette)),
  prevDesign: () => show(design - 1, randomOther(PALETTES.length, palette)),
  nextPalette: () => show(design, palette + 1, true),
  prevPalette: () => show(design, palette - 1, true),
  pause: () => { rotating = !rotating; schedule(); },
};
const status = () => `${DESIGNS[design]} · ${PALETTES[palette].name}${rotating ? "" : " · held"}`;

window.addEventListener("keydown", (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  if (key === "ArrowRight") step.nextDesign();
  else if (key === "ArrowLeft") step.prevDesign();
  else if (key === "ArrowUp") step.prevPalette();
  else if (key === "ArrowDown") step.nextPalette();
  else if (key === " ") step.pause();
  else if (key === "i") { if (!help.hidden) toggleHelp(false); }
  else if (key === "h" || key === "?") { toggleHelp(); return e.preventDefault(); }
  else if (key === "Escape") { toggleHelp(false); return; }
  else if (key === "f") { toggleFullscreen(); return e.preventDefault(); }
  else return;
  announce(status(), key === "i" ? 4000 : 2000);
  e.preventDefault();
});
function toggleFullscreen() {
  const el = document.documentElement;
  if (document.fullscreenElement || document.webkitFullscreenElement) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
  else (el.requestFullscreen || el.webkitRequestFullscreen)?.call(el);
}
// On a touch screen: a tap shows the name, a swipe sideways changes the design, a swipe
// up or down the palette, and a long press opens the help. A mouse click does nothing.
let down = null, holdTimer = 0;
window.addEventListener("pointerdown", (e) => {
  if (e.pointerType === "mouse") return;
  down = { x: e.clientX, y: e.clientY, t: performance.now(), held: false };
  clearTimeout(holdTimer);
  holdTimer = setTimeout(() => { if (down) { down.held = true; toggleHelp(true); } }, 600);
});
window.addEventListener("pointermove", (e) => {
  if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 12) clearTimeout(holdTimer);
});
window.addEventListener("pointerup", (e) => {
  clearTimeout(holdTimer);
  if (!down || e.pointerType === "mouse") return;
  const dx = e.clientX - down.x, dy = e.clientY - down.y, { held } = down;
  down = null;
  if (held) return;
  if (!help.hidden) return toggleHelp(false);
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 40) return announce(status(), 4000);
  if (Math.abs(dx) > Math.abs(dy)) (dx < 0 ? step.nextDesign : step.prevDesign)();
  else (dy < 0 ? step.nextPalette : step.prevPalette)();
  announce(status());
});
window.addEventListener("pointercancel", () => { clearTimeout(holdTimer); down = null; });
window.addEventListener("contextmenu", (e) => { if (touch) e.preventDefault(); });
help.addEventListener("click", () => toggleHelp(false));
window.addEventListener("dblclick", toggleFullscreen);
let idle = 0;
window.addEventListener("mousemove", () => {
  document.body.classList.remove("idle");
  clearTimeout(idle);
  idle = setTimeout(() => document.body.classList.add("idle"), 2500);
});

// ?design=N&palette=M (1-based) open a given pair, for testing
const params = new URLSearchParams(location.search);
const pick = (name, n) => (params.has(name) ? parseInt(params.get(name), 10) - 1 : Math.floor(Math.random() * n));
show(pick("design", DESIGNS.length), pick("palette", PALETTES.length));
announce("Kuantan");
requestAnimationFrame(frame);
