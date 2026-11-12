// Kuantan (/kuantan/): generative paper marbling, the patterns and colours I
// love and that calm me. Named after the beach where Nanami Kento wanted to rest
// (/blog/nanami-kento/), whose last line links here.
//
// Each design is a real marbling technique, written as the inverse of the
// strokes that make it (after Aubrey Jaffer's mathematical marbling): for each
// pixel the shader asks where its paint came from. A slow noise current keeps
// the bath moving, so nothing ever repeats.
//
// A design is a marbling technique; a palette is the paint. Every few minutes
// the design changes, and within a design the palette changes now and then
// while the pattern keeps flowing.
//
// Keys: ← → change design, ↑ ↓ change palette, Space pauses the rotation, F full
// screen; a tap changes design. Changing by hand shows the names for a moment;
// the rotation shows nothing.

const DESIGN_MINUTES = [3, 5]; // a new design this often
const PALETTE_SECONDS = [60, 100]; // and within it, a new palette this often
const FADE_SECONDS = 3;
const MAX_PIXELS = 1280 * 720; // render budget: the canvas is upscaled smoothly, and marbling is soft
const DENSITY = Number(new URLSearchParams(location.search).get("density")) || 1.4;
const FREQ = Number(new URLSearchParams(location.search).get("freq")) || 2.2;
const SPEED = matchMedia("(prefers-reduced-motion: reduce)").matches ? 0.4 : 1;

// Designs: marbling techniques (see the shader functions of the same number).
const DESIGNS = ["Combed", "Stones", "Ink rings", "Nonpareil", "Chevrons", "Bouquet", "Swirls", "Feathers", "Spiral", "Waves", "Drops", "Marble"];

// Palettes: the paint in the bath, in band order. A number after a colour is its share (default 10).
const PALETTES = [
  { name: "Endpaper", colors: [["#12a0a0", 15], ["#f5e8cc", 9], ["#c8102e", 17], ["#f5e8cc", 5], ["#0a4a66", 15], ["#f7c21a", 5], ["#f5e8cc", 7], ["#17788c", 15], ["#990a1f", 12]] },
  { name: "Red, black, white", colors: [["#d10a1e", 22], ["#0b0b0b", 20], ["#f4f1ea", 16], ["#8c0613", 12], ["#1c1c1c", 14], ["#ffffff", 6], ["#e8252f", 10]] },
  { name: "Sukuna", colors: [["#120607", 18], ["#7a0b14", 16], ["#c3121f", 18], ["#e9dccb", 12], ["#1f0a0c", 16], ["#d9a441", 5], ["#a10d1a", 15]] },
  { name: "Gojo", colors: [["#0b0f2e", 18], ["#3b2bd6", 16], ["#7a4bff", 14], ["#4fd7ff", 14], ["#f2f6ff", 10], ["#ff3fb4", 6], ["#1a1f6b", 22]] },
  { name: "Nanami", colors: [["#0a1a3f", 18], ["#1d4fd8", 16], ["#5fd4f4", 12], ["#eaf6ff", 8], ["#0e2f7a", 16], ["#e6b53a", 4], ["#2b7fe0", 14], ["#071030", 12]] },
  { name: "David", colors: [["#ffd400", 18], ["#0d0d0d", 18], ["#00e0ff", 14], ["#ff2a6d", 12], ["#f4f4f4", 8], ["#1a1446", 16], ["#ffd400", 6], ["#0d0d0d", 8]] },
  { name: "Lucy", colors: [["#1b0f3b", 18], ["#7c4dff", 16], ["#00e5ff", 14], ["#ff7ad9", 12], ["#e8f7ff", 8], ["#2b2b6b", 18], ["#00b3ff", 14]] },
  { name: "Night City", colors: [["#ff2e88", 16], ["#16e0ff", 14], ["#fff03a", 8], ["#3a0f6e", 20], ["#0b0620", 18], ["#9b3dff", 14]] },
  { name: "Lofi", colors: [["#ff7eb6", 16], ["#ffb38a", 14], ["#b28dff", 16], ["#ffe3f1", 10], ["#6c5ce7", 16], ["#ffd166", 10], ["#ff9ecb", 12]] },
  { name: "Pixel sunset", colors: [["#ff4e50", 16], ["#fc913a", 14], ["#f9d62e", 10], ["#2e1f5e", 18], ["#8a2be2", 14], ["#ff7eb6", 12], ["#1a1238", 10]] },
  { name: "Bauhaus", colors: [["#e2231a", 18], ["#0b0b0b", 16], ["#f7f3e8", 20], ["#1f4fd1", 18], ["#ffcf00", 12], ["#f7f3e8", 10]] },
  { name: "Pop", colors: [["#e3001b", 18], ["#ff5fa2", 14], ["#00a36c", 14], ["#ffd500", 10], ["#111111", 14], ["#fdf6ec", 14], ["#e3001b", 8]] },
  { name: "Klein and gold", colors: [["#002fa7", 26], ["#0b0b2a", 16], ["#d4af37", 8], ["#f3eee0", 12], ["#1b4fd8", 20], ["#002fa7", 10]] },
  { name: "Rosa mexicano", colors: [["#e4007c", 18], ["#ff6f00", 14], ["#ffd60a", 10], ["#00a6a6", 14], ["#2b0a3d", 16], ["#fff1e6", 10], ["#e4007c", 8]] },
  { name: "Tropical", colors: [["#ff2d55", 16], ["#00c2a8", 16], ["#ffb300", 12], ["#2f1b69", 16], ["#fff4e0", 10], ["#ff6b00", 14]] },
  { name: "Matisse", colors: [["#1f4fd1", 20], ["#ff6f5e", 18], ["#ffd23a", 14], ["#7fd8b6", 16], ["#fbf6ea", 26]] },
  { name: "Ottoman", colors: [["#1f3f8f", 20], ["#d99a2b", 16], ["#c23b5a", 16], ["#2e8b7a", 16], ["#e2623a", 14], ["#efe2c4", 18]] },
  { name: "Sumi", colors: [["#f2ebdc", 26], ["#1b1b22", 16], ["#f2ebdc", 18], ["#25407a", 16], ["#f2ebdc", 14], ["#d2402c", 10]] },
  { name: "Peacock", colors: [["#0f7a55", 18], ["#173a9c", 18], ["#e2b33c", 12], ["#5b2a8c", 14], ["#f6efdc", 14], ["#1aa3a0", 16]] },
  { name: "Victorian", colors: [["#7a1530", 12], ["#e8b931", 10], ["#1b2f6b", 12], ["#f4ead2", 10], ["#3f7d4e", 12], ["#e0603c", 10], ["#2a8fa8", 12], ["#f4ead2", 8]] },
  { name: "Carnival", colors: [["#e0237d", 16], ["#ff8c1a", 14], ["#0fa3a3", 16], ["#ffe14d", 12], ["#fdf3e1", 14], ["#6b2fbf", 14], ["#fdf3e1", 6]] },
  { name: "Red and cream", colors: [["#c8102e", 26], ["#f6f1e7", 18], ["#7d0a1d", 16], ["#ff3b3b", 10], ["#f6f1e7", 10], ["#3a0610", 20]] },
];

const VERTEX = "attribute vec2 a; void main() { gl_Position = vec4(a, 0.0, 1.0); }";

const FRAGMENT = `
#extension GL_OES_standard_derivatives : enable
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform vec2 uSeed;
uniform float uFreq; // how many times the palette repeats in a band of the bath
uniform float uScale; // how much of the bath fits on the screen: more is denser
uniform int uTech;
uniform vec3 uPal[9];
uniform float uCut[9];
uniform vec3 uVein;
uniform vec3 uAvg;

vec3 hash3(vec3 p) {
  p = vec3(dot(p, vec3(127.1, 311.7, 74.7)), dot(p, vec3(269.5, 183.3, 246.1)), dot(p, vec3(113.5, 271.9, 124.6)));
  return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}
vec2 hash2(vec2 p) {
  return fract(sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)))) * 43758.5453);
}
float noise(vec3 p) {
  vec3 i = floor(p), f = fract(p), u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(dot(hash3(i), f), dot(hash3(i + vec3(1, 0, 0)), f - vec3(1, 0, 0)), u.x),
        mix(dot(hash3(i + vec3(0, 1, 0)), f - vec3(0, 1, 0)), dot(hash3(i + vec3(1, 1, 0)), f - vec3(1, 1, 0)), u.x), u.y),
    mix(mix(dot(hash3(i + vec3(0, 0, 1)), f - vec3(0, 0, 1)), dot(hash3(i + vec3(1, 0, 1)), f - vec3(1, 0, 1)), u.x),
        mix(dot(hash3(i + vec3(0, 1, 1)), f - vec3(0, 1, 1)), dot(hash3(i + vec3(1, 1, 1)), f - vec3(1, 1, 1)), u.x), u.y),
    u.z);
}
float fbm(vec3 p) {
  float s = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) {
    s += a * noise(p);
    p = vec3(p.xy * mat2(1.6, 1.2, -1.2, 1.6), p.z * 1.3 + 3.1);
    a *= 0.5;
  }
  return s;
}

// The slow current of the bath: a two-level domain warp, evolving in time.
vec2 flow(vec2 p, float t, float amount) {
  vec2 o = p + uSeed;
  vec2 q = vec2(fbm(vec3(o * 0.7, t * 0.025)), fbm(vec3(o * 0.7 + vec2(5.2, 1.3), t * 0.025)));
  vec2 r = vec2(fbm(vec3(o * 0.9 + 2.0 * q + vec2(1.7, 9.2), t * 0.035)),
                fbm(vec3(o * 0.9 + 2.0 * q + vec2(8.3, 2.8), t * 0.035)));
  return p + amount * r;
}

// Jaffer's tine line: paint near a tine moves by L * lambda / (d + lambda).
float tine(float x, float spacing, float phase, float L, float lambda) {
  float d = abs(fract(x / spacing + phase) - 0.5) * spacing;
  return L * lambda / (d + lambda);
}

// The paint laid in the bath, as bands of the palette.
vec3 paint(float x) {
  x = fract(x);
  for (int i = 0; i < 9; i++) if (x < uCut[i]) return uPal[i];
  return uPal[8];
}
// Bands with antialiasing: four samples across the pixel's footprint. Where the
// bands get finer than a pixel they blend into the palette's average colour
// instead of shimmering (moiré). A jump in s (the edge of a drop, where one pattern meets another) is not fine
// bands: there the edge stays crisp, never averaged into a seam.
vec3 bands(float s) {
  float w = fwidth(s);
  if (w > 1.5) return paint(s);
  vec3 c = 0.25 * (paint(s - 0.375 * w) + paint(s - 0.125 * w) + paint(s + 0.125 * w) + paint(s + 0.375 * w));
  return mix(c, uAvg, smoothstep(0.12, 0.5, w));
}
vec3 combed(float s) {
  return bands(s) * (1.0 + 0.02 * sin(s * 190.0)); // fine hairlines left by the comb
}

// Threads: inside a wide band, the thin lines real paint leaves when it is laid
// in several passes. They run exactly along the band (same s), a few light ones
// and a darker one near each edge, and fade out where they would be finer than
// a pixel, so they never shimmer.
vec3 threaded(float s) {
  s *= uFreq; // more turns of the palette across the same swirl: finer bands
  vec3 color = combed(s);
  float w = fwidth(s);
  float fade = 1.0 - smoothstep(0.004, 0.012, w);
  if (fade <= 0.0) return color;
  float x = fract(s);
  float k = floor(s);
  vec3 light = mix(color, uVein, 0.8);
  vec3 dark = color * 0.62;
  float a = 0.0;
  // three light threads at fixed places in each turn of the palette, each its own width
  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    float at = fract(0.17 + fi * 0.31 + 0.07 * sin(k * 3.1 + fi));
    float half_ = 0.0016 + 0.0012 * fi;
    float d = abs(x - at);
    d = min(d, 1.0 - d);
    a = max(a, 1.0 - smoothstep(half_, half_ + w, d));
  }
  color = mix(color, light, a * fade);
  // a darker line just inside every change of colour
  vec3 here = paint(s), ahead = paint(s + 0.006);
  float edge = step(0.001, distance(here, ahead));
  color = mix(color, dark, edge * 0.5 * fade);
  return color;
}

vec2 rotate(vec2 v, float a) { float c = cos(a), s = sin(a); return vec2(c * v.x - s * v.y, s * v.x + c * v.y); }

// 0 · Combed: bands, a comb pulled up with uneven pressure, a wavy stroke.
vec3 classic(vec2 p, float t) {
  p = flow(p + uSeed, t, 0.6); // strong enough to flow, not so strong it folds into islands
  float pressure = 0.1 + 0.16 * smoothstep(-0.4, 0.4, noise(vec3(p.x * 0.8, 3.7, t * 0.02)));
  p.y -= tine(p.x, 0.26, t * 0.008, pressure, 0.03);
  p.x += 0.07 * sin(p.y * 7.0 + t * 0.06);
  float s = p.y * 0.85 + 0.25 * fbm(vec3(p * 1.7, t * 0.014 + 7.0));
  return threaded(s);
}

// 1 · Stones (ebru battal): drops of paint, each its own size, crowding each other
// into rounded stones. A drop's paint gathers at its rim, and a thin vein of the
// bath shows between neighbours.
vec3 stones(vec2 p, float t) {
  p = flow(p, t, 0.6) * 2.4;
  vec2 g = floor(p), f = fract(p);
  float d1 = 9.0, d2 = 9.0;
  vec2 id = vec2(0.0);
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 o = vec2(float(i), float(j));
    vec2 h = hash2(g + o);
    vec2 pt = o + 0.5 + 0.35 * sin(t * 0.05 + 6.2831 * h) - f;
    // weighted by the drop's size, so the borders between stones curve
    float size = 0.75 + 0.5 * hash2(g + o + 5.0).x;
    float d = length(pt) / size;
    if (d < d1) { d2 = d1; d1 = d; id = g + o; } else if (d < d2) { d2 = d; }
  }
  vec3 color = paint(hash2(id + 17.0).x);
  float e = (d2 - d1) / (d2 + d1); // 0 on a border, growing toward the middle
  color *= 0.84 + 0.16 * smoothstep(0.0, 0.18, e); // the darker rim
  float vein = 1.0 - smoothstep(0.006, 0.018 + fwidth(e), e);
  return mix(color, uVein, vein);
}

// 2 · Ink rings (suminagashi): ink dropped again and again at a few points,
// spreading in rings. Each drop pushes the older paint outward while keeping its
// area, so the older rings thin as they travel; their edges bleed a little.
vec3 rings(vec2 p, float t) {
  p = flow(p, t, 0.5);
  float aspect = uRes.x / uRes.y * uScale;
  for (int i = 0; i < 4; i++) {
    float k = float(i);
    vec2 h = hash2(uSeed + k * 7.31);
    vec2 c = vec2(aspect * (0.1 + 0.8 * h.x), 1.4 * (0.15 + 0.7 * h.y));
    c += 0.15 * vec2(sin(t * 0.031 + k * 2.0), cos(t * 0.027 + k * 1.3));
    float R2 = pow(0.75 + 0.12 * sin(t * 0.02 + k * 2.4), 2.0);
    vec2 d = p - c;
    float L2 = dot(d, d);
    if (L2 < R2) {
      // uneven ring widths, and a slightly ragged edge where the ink bleeds
      float s = sqrt(L2) * (5.0 + 1.5 * h.y) + 0.35 * fbm(vec3(d * 3.0, t * 0.03 + k)) - t * 0.03 + k * 0.37;
      s += 0.04 * noise(vec3(d * 40.0, k));
      return combed(s);
    }
    p = c + d * sqrt(1.0 - R2 / L2);
  }
  return uPal[0]; // bare paper
}

// 3 · Nonpareil: many thin bands combed with a fine comb, then a gentle wave.
vec3 nonpareil(vec2 p, float t) {
  p = flow(p, t, 0.3);
  p.y -= tine(p.x, 0.075, t * 0.004, 0.08, 0.015);
  p.x += 0.03 * sin(p.y * 10.0 + t * 0.05);
  return combed(p.y * 2.4 + 0.1 * fbm(vec3(p * 2.0, t * 0.02)));
}

// 4 · Chevrons (gel-git): upright bands combed back and forth.
vec3 chevrons(vec2 p, float t) {
  p = flow(p, t, 0.6);
  // the comb goes one way, then back: a continuous zigzag, its points slightly rounded
  float z = abs(fract(p.y / 0.4 + t * 0.003) - 0.5) * 4.0 - 1.0;
  p.x -= 0.14 * z * (1.0 - 0.15 * z * z);
  return threaded(p.x * 1.6 + 0.2 * fbm(vec3(p * 1.5, t * 0.02)));
}

// 5 · Bouquet: a nonpareil, then a wide comb drawn through it in waves.
vec3 bouquet(vec2 p, float t) {
  p = flow(p, t, 0.3);
  p.y -= tine(p.x, 0.07, t * 0.004, 0.06, 0.014);
  p.y += tine(p.x, 0.42, t * 0.006, 0.32 * (0.6 + 0.4 * sin(t * 0.05)), 0.07);
  p.x += 0.06 * sin(p.y * 6.0 + t * 0.04);
  return combed(p.y * 1.8);
}

// 6 · Swirls: a few slow vortices that wind and unwind the bands.
vec3 swirls(vec2 p, float t) {
  p = flow(p, t, 0.4);
  float aspect = uRes.x / uRes.y * uScale;
  for (int i = 0; i < 3; i++) {
    float k = float(i);
    vec2 h = hash2(uSeed + k * 3.7);
    vec2 c = vec2(aspect * (0.15 + 0.7 * h.x), 1.4 * (0.2 + 0.6 * h.y));
    c += 0.15 * vec2(sin(t * 0.023 + k), cos(t * 0.019 + k * 2.0));
    vec2 d = p - c;
    float wind = 7.0 * sin(t * 0.012 + k * 2.1);
    p = c + rotate(d, -wind * 0.22 / (length(d) + 0.22));
  }
  return threaded(p.y * 2.0 + 0.2 * fbm(vec3(p * 1.4, t * 0.02)));
}

// 7 · Feathers: a nonpareil, then a wide comb drawn through it, its tines going
// up and down by turns: each tine drags the fine bands into a feather. The pull
// fades to nothing halfway between tines, so nothing tears. As always the strokes
// are undone in reverse: the wide comb first, then the fine one.
vec3 feathers(vec2 p, float t) {
  p = flow(p, t, 0.25);
  float spacing = 0.24, lambda = 0.04;
  float u = p.x / spacing + t * 0.004;
  float d = abs(fract(u) - 0.5) * spacing;
  float dir = mod(floor(u), 2.0) < 1.0 ? 1.0 : -1.0;
  p.y += dir * 0.28 * (lambda / (d + lambda) - lambda / (0.5 * spacing + lambda));
  p.y -= tine(p.x, 0.06, t * 0.004, 0.05, 0.012); // the nonpareil, combed up
  return combed(p.y * 2.6 + 0.05 * fbm(vec3(p * 2.0, t * 0.02)));
}

// 8 · Spiral: one large stir that slowly winds the whole bath.
vec3 spiral(vec2 p, float t) {
  p = flow(p, t, 0.35);
  float aspect = uRes.x / uRes.y * uScale;
  vec2 c = vec2(aspect * 0.5, 0.7) + 0.2 * vec2(sin(t * 0.017), cos(t * 0.013));
  vec2 d = p - c;
  float wind = 5.0 + 4.0 * sin(t * 0.009);
  p = c + rotate(d, -wind * 0.45 / (length(d) + 0.45));
  return threaded(p.y * 2.2 + 0.25 * fbm(vec3(p * 1.2, t * 0.02)));
}

// 9 · Waves: bands rolled by two slow crossing waves (the Turkish shawl pattern).
vec3 waves(vec2 p, float t) {
  p = flow(p, t, 0.5);
  p.y += 0.18 * sin(p.x * 2.2 + t * 0.03);
  p.x += 0.12 * sin(p.y * 3.1 - t * 0.025);
  p.y += 0.06 * sin(p.x * 6.3 - t * 0.04);
  return threaded(p.y * 2.0);
}

// 10 · Drops: drops of paint fallen on combed bands, each spreading in rings.
vec3 drops(vec2 p, float t) {
  p = flow(p, t, 0.4);
  vec2 q = p * 1.5;
  vec2 g = floor(q);
  vec2 push = vec2(0.0);
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 o = g + vec2(float(i), float(j));
    vec2 h = hash2(o + uSeed);
    vec2 pc = o + 0.5 + 0.3 * sin(t * 0.05 + 6.2831 * h);
    float R2 = 0.11 + 0.03 * sin(t * 0.04 + 6.2831 * h.y);
    vec2 d = q - pc;
    float L2 = dot(d, d);
    if (L2 < R2) return combed(L2 / 0.05 - t * 0.02 + h.x * 3.0);
    // each drop pushes the bands aside (area-preserving), fading out with distance
    push += d * (1.0 - sqrt(1.0 - R2 / L2)) * smoothstep(1.3, 0.7, sqrt(L2));
  }
  q -= push;
  return threaded(q.y * 1.4 + 0.15 * fbm(vec3(q, t * 0.02)));
}

// 11 · Marble: liquid paint stirred by many hands. Eddies of every size, each
// turning its own way, wind fine bands around themselves and into each other,
// the way paint curls when it is stirred freely rather than combed.
vec3 marble(vec2 p, float t) {
  p = flow(p, t, 0.55);
  float aspect = uRes.x / uRes.y * uScale;
  for (int i = 0; i < 9; i++) {
    float k = float(i);
    vec2 h = hash2(uSeed + k * 5.13);
    vec2 c = vec2(aspect * h.x, uScale * h.y);
    c += 0.12 * vec2(sin(t * 0.017 + k * 1.7), cos(t * 0.015 + k * 2.3));
    float r = 0.08 + 0.22 * hash2(uSeed + k * 9.7).x; // small and large eddies
    float spin = (mod(k, 2.0) < 1.0 ? 1.0 : -1.0) * (4.0 + 2.0 * sin(t * 0.011 + k));
    vec2 d = p - c;
    p = c + rotate(d, spin * r / (length(d) + r) * exp(-dot(d, d) / (9.0 * r * r)));
  }
  return threaded(p.y * 1.3 + 0.35 * fbm(vec3(p * 1.1, t * 0.02)));
}

void main() {
  vec2 p = gl_FragCoord.xy / uRes.y * uScale;
  float t = uTime;
  vec3 color;
  if (uTech == 0) color = classic(p, t);
  else if (uTech == 1) color = stones(p, t);
  else if (uTech == 2) color = rings(p, t);
  else if (uTech == 3) color = nonpareil(p, t);
  else if (uTech == 4) color = chevrons(p, t);
  else if (uTech == 5) color = bouquet(p, t);
  else if (uTech == 6) color = swirls(p, t);
  else if (uTech == 7) color = feathers(p, t);
  else if (uTech == 8) color = spiral(p, t);
  else if (uTech == 9) color = waves(p, t);
  else if (uTech == 10) color = drops(p, t);
  else color = marble(p, t);
  // paper grain, fixed to the sheet
  color += 0.018 * (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - 0.5);
  gl_FragColor = vec4(color, 1.0);
}
`;

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);

/** One canvas, one WebGL program, showing one design and palette at a time. */
class Sheet {
  constructor() {
    this.canvas = document.createElement("canvas");
    document.body.prepend(this.canvas);
    const gl = this.canvas.getContext("webgl", { antialias: false, alpha: false, powerPreference: "low-power" });
    if (!gl || !gl.getExtension("OES_standard_derivatives")) throw new Error("WebGL unavailable");
    const program = gl.createProgram();
    for (const [type, src] of [[gl.VERTEX_SHADER, VERTEX], [gl.FRAGMENT_SHADER, FRAGMENT]]) {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, src);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
      gl.attachShader(program, shader);
    }
    gl.linkProgram(program);
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    this.gl = gl;
    this.u = Object.fromEntries(["uRes", "uTime", "uSeed", "uTech", "uPal", "uCut", "uVein", "uAvg", "uScale", "uFreq"].map((n) => [n, gl.getUniformLocation(program, n)]));
  }

  /** Paint `design` with `palette`; with `from`, continue that sheet's bath so only the colours change. */
  show(design, palette, from) {
    const gl = this.gl;
    const entries = palette.colors.map((c) => (Array.isArray(c) ? c : [c, 10]));
    const total = entries.reduce((sum, [, w]) => sum + w, 0);
    const colors = new Float32Array(27);
    const cuts = new Float32Array(9).fill(2);
    let sum = 0;
    entries.slice(0, 9).forEach(([c, w], i) => {
      colors.set(hex(c), i * 3);
      sum += w / total;
      cuts[i] = sum;
    });
    // veins between stones take the palette's lightest colour
    const light = entries.map(([c]) => hex(c)).sort((x, y) => (y[0] + y[1] + y[2]) - (x[0] + x[1] + x[2]))[0];
    gl.uniform3fv(this.u.uPal, colors);
    gl.uniform1fv(this.u.uCut, cuts);
    gl.uniform3fv(this.u.uVein, light);
    const avg = [0, 1, 2].map((k) => entries.reduce((acc, [c, w]) => acc + hex(c)[k] * w, 0) / total);
    gl.uniform3fv(this.u.uAvg, avg);
    gl.uniform1i(this.u.uTech, design);
    this.seed = from ? from.seed : [Math.random() * 40, Math.random() * 40];
    this.time = from ? from.time : Math.random() * 500; // a different bath every time
    gl.uniform2f(this.u.uSeed, ...this.seed);
    gl.uniform1f(this.u.uScale, DENSITY);
    gl.uniform1f(this.u.uFreq, FREQ);
  }

  draw(dt) {
    const { gl, canvas } = this;
    const ratio = Math.min(window.devicePixelRatio || 1, Math.sqrt(MAX_PIXELS / (window.innerWidth * window.innerHeight)));
    const w = Math.round(window.innerWidth * ratio), h = Math.round(window.innerHeight * ratio);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
    }
    this.time += dt * SPEED;
    gl.uniform2f(this.u.uRes, w, h);
    gl.uniform1f(this.u.uTime, this.time);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
}

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

/** Changing by hand shows the design and palette for a moment. */
function announce(text = `${DESIGNS[design]} · ${PALETTES[palette].name}`) {
  label.textContent = text;
  label.classList.add("on");
  clearTimeout(labelTimer);
  labelTimer = setTimeout(() => label.classList.remove("on"), 2000);
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
window.addEventListener("keydown", (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  if (e.key === "ArrowRight") show(design + 1, randomOther(PALETTES.length, palette));
  else if (e.key === "ArrowLeft") show(design - 1, randomOther(PALETTES.length, palette));
  else if (e.key === "ArrowUp") show(design, palette - 1, true);
  else if (e.key === "ArrowDown") show(design, palette + 1, true);
  else if (e.key === " ") { rotating = !rotating; schedule(); return e.preventDefault(); }
  else if (e.key === "f" || e.key === "F") { toggleFullscreen(); return e.preventDefault(); }
  else return;
  announce();
  e.preventDefault();
});
function toggleFullscreen() {
  const el = document.documentElement;
  if (document.fullscreenElement || document.webkitFullscreenElement) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
  else (el.requestFullscreen || el.webkitRequestFullscreen)?.call(el);
}
// a tap (not a scroll or a drag) changes design
let down = null;
window.addEventListener("pointerdown", (e) => { down = { x: e.clientX, y: e.clientY, t: performance.now() }; });
window.addEventListener("pointerup", (e) => {
  if (!down || e.pointerType === "mouse") return;
  const still = Math.hypot(e.clientX - down.x, e.clientY - down.y) < 12 && performance.now() - down.t < 400;
  down = null;
  if (still) { show(design + 1, randomOther(PALETTES.length, palette)); announce(); }
});
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
