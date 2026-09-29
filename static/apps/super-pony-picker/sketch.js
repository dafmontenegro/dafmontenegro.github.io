/* =============================================================
   🐴 SUPER PONY PICKER — random name picker horse race
   by Daniel Felipe Montenegro · https://montenegrodanielfelipe.com

   Made with p5.js. Works standalone (index.html) and in the
   p5.js web editor (paste this file as sketch.js).

   Rules
   - Finish line at 100 steps.
   - Every pony is born with a min step (0–1) and a max step (1–2);
     each turn its base step is a random number between them.
   - Every pony gets 4 mystery boxes of its own: different
     positions and 4 different types (out of 6), hidden until hit.
   - Optional "close race" drafting: ponies behind speed up,
     the leader breaks the wind.
   - Fair: all randomness comes from crypto.getRandomValues and no
     lane has any advantage, so every name has the same chance.

   Editor note: every loop uses braces and there is no do/while,
   because the p5 editor's loop protection breaks on those forms.
   ============================================================= */

// ─── Project info ─────────────────────────────────────────────
const APP_NAME = 'Super Pony Picker';
const APP_URL = 'https://montenegrodanielfelipe.com/projects/super-pony-picker/';

// ─── Rules ────────────────────────────────────────────────────
const META = 100;
const N_OBS = 4;
const MIN_LANES = 2;
const MAX_LANES = 20;
const TICK_MS = 260;
const TICK_FAST_MS = 90;

// Close race (drafting)
const DRAFT_PER_STEP = 0.2;   // +20% per step behind the leader
const DRAFT_MAX = 1.5;        // up to +150%
const LEADER_FACTOR = 0.7;    // the leader moves at 70%

// ─── Scene (NES-style internal resolution) ────────────────────
let W = 320, H = 200;         // current internal resolution (changes with the number of ponies)
const UNIT = 12;              // pixels per step
const LANE_H = 12;
const TRACK_TOP = 46;
const SHEAR = 4;              // 2.5D diagonal
const START_X = 64;
const FINISH_X = START_X + META * UNIT;
const JUMP_MS = 420;
const COUNTDOWN_MS = 2400;
const RES_W = 320;            // results screen width

const PAL = {
  grass: '#80d010', grassDark: '#58a800',
  bush: '#ac7c00', bushLight: '#fce0a8', bushDark: '#503000',
  dirt: '#fc9838', dirtDark: '#e45c10', dirtLight: '#fcb868', line: '#fce0a8',
  weed: '#005800', weedMid: '#00a800', weedLight: '#58d854',
  black: '#000000', white: '#fcfcfc', yellow: '#f8b800', red: '#f83800',
  blue: '#0058f8', skin: '#fcbcb0', dim: '#7c7c7c', mud: '#503000', mudLight: '#881400',
  gold: '#f8b800', silver: '#bcbcbc', bronze: '#c84c0c', cloud: '#505050', rain: '#3cbcfc'
};

const SILKS = [
  { shirt: '#f83800', cap: '#fcfcfc' }, { shirt: '#0058f8', cap: '#f8b800' },
  { shirt: '#00a800', cap: '#fcfcfc' }, { shirt: '#6844fc', cap: '#f878f8' },
  { shirt: '#f8b800', cap: '#f83800' }, { shirt: '#3cbcfc', cap: '#0058f8' },
  { shirt: '#f878f8', cap: '#6844fc' }, { shirt: '#fcfcfc', cap: '#00a800' },
  { shirt: '#fc7460', cap: '#3cbcfc' }, { shirt: '#b8f818', cap: '#0000bc' },
  { shirt: '#940084', cap: '#f8d878' }, { shirt: '#58f898', cap: '#a81000' },
  { shirt: '#e40058', cap: '#fcfcfc' }, { shirt: '#fca044', cap: '#0058f8' },
  { shirt: '#a4e4fc', cap: '#f83800' }, { shirt: '#007800', cap: '#f8b800' },
  { shirt: '#d800cc', cap: '#b8f818' }, { shirt: '#f8d878', cap: '#940084' },
  { shirt: '#bcbcbc', cap: '#e40058' }, { shirt: '#0000bc', cap: '#58f898' }
];
const COATS = [
  ['#a05000', '#402000'], ['#bcbcbc', '#fcfcfc'], ['#6b3a10', '#1a0a00'],
  ['#fce0a8', '#fcfcfc'], ['#505050', '#101010'], ['#c84c0c', '#581000'],
  ['#ac7c00', '#503000'], ['#881400', '#301000'], ['#e8d0b0', '#7c5030']
];

// Random names: biblical characters, in both languages
const BIBLE_NAMES = {
  en: ['Adam', 'Eve', 'Noah', 'Abraham', 'Sarah', 'Isaac', 'Rebekah', 'Jacob', 'Rachel', 'Leah',
    'Joseph', 'Benjamin', 'Moses', 'Aaron', 'Miriam', 'Joshua', 'Caleb', 'Deborah', 'Gideon', 'Samson',
    'Ruth', 'Naomi', 'Boaz', 'Hannah', 'Samuel', 'David', 'Jonathan', 'Abigail', 'Solomon', 'Elijah',
    'Elisha', 'Isaiah', 'Jeremiah', 'Ezekiel', 'Daniel', 'Esther', 'Mordecai', 'Jonah', 'Job', 'Nehemiah',
    'Ezra', 'Methuselah', 'Enoch', 'Abel', 'Seth', 'Goliath', 'Mary', 'Martha', 'Lazarus', 'Peter',
    'Andrew', 'James', 'John', 'Matthew', 'Thomas', 'Philip', 'Luke', 'Mark', 'Paul', 'Barnabas',
    'Silas', 'Timothy', 'Lydia', 'Priscilla', 'Stephen', 'Zacchaeus', 'Elizabeth', 'Zechariah', 'Nicodemus', 'Tabitha'],
  es: ['Adán', 'Eva', 'Noé', 'Abraham', 'Sara', 'Isaac', 'Rebeca', 'Jacob', 'Raquel', 'Lea',
    'José', 'Benjamín', 'Moisés', 'Aarón', 'Miriam', 'Josué', 'Caleb', 'Débora', 'Gedeón', 'Sansón',
    'Rut', 'Noemí', 'Booz', 'Ana', 'Samuel', 'David', 'Jonatán', 'Abigail', 'Salomón', 'Elías',
    'Eliseo', 'Isaías', 'Jeremías', 'Ezequiel', 'Daniel', 'Ester', 'Mardoqueo', 'Jonás', 'Job', 'Nehemías',
    'Esdras', 'Matusalén', 'Enoc', 'Abel', 'Set', 'Goliat', 'María', 'Marta', 'Lázaro', 'Pedro',
    'Andrés', 'Santiago', 'Juan', 'Mateo', 'Tomás', 'Felipe', 'Lucas', 'Marcos', 'Pablo', 'Bernabé',
    'Silas', 'Timoteo', 'Lidia', 'Priscila', 'Esteban', 'Zaqueo', 'Isabel', 'Zacarías', 'Nicodemo', 'Tabita']
};

// Mystery boxes (each pony gets 4 different types)
const EFFECTS = {
  turbo:    { icon: '>>', col: '#f878f8', name: { en: 'TURBO', es: 'TURBO' } },
  estrella: { icon: '*',  col: '#f8b800', name: { en: 'STAR', es: 'ESTRELLA' } },
  barro:    { icon: '~',  col: '#c84c0c', name: { en: 'MUD', es: 'BARRO' } },
  tropiezo: { icon: '!',  col: '#f83800', name: { en: 'TRIP', es: 'TROPIEZO' } },
  viento:   { icon: '<<', col: '#3cbcfc', name: { en: 'WIND', es: 'VIENTO' } },
  dado:     { icon: '@',  col: '#fcfcfc', name: { en: 'DICE', es: 'DADO' } }
};

// ─── Texts ────────────────────────────────────────────────────
const I18N = {
  en: {
    signStart: 'START', signFinish: 'FINISH',
    phaseLineup: 'LINE-UP', phaseReady: 'GET READY', phaseRacing: 'RACING', phaseDone: 'RACE OVER',
    turn: 'TURN', done: 'IN', leader: 'LEADER', last: 'LAST', pressStart: 'PRESS START', go: 'GO!',
    statsTitle: 'BIRTH STATS', colLane: 'PONY', colMin: 'MIN', colMax: 'MAX', colAvg: 'AVG', colTurns: 'TURNS',
    legend: '* FAVORITE   TURNS: ESTIMATE WITHOUT BOXES',
    legendDraft: '* FAVORITE   TURNS: ESTIMATE WITHOUT BOXES OR DRAFTING',
    pressToGo: 'SPACE / ENTER / CLICK TO START',
    results: 'RESULTS', winners: 'WINNERS', losers: 'LAST PLACES', turnsWord: 'TURNS',
    lastPlace: 'LAST', place: 'PLACE', rematch: 'REMATCH', settings: 'SETTINGS', copyBtn: 'COPY', copied: 'COPIED!',
    picked: 'PICKED: ', pickedMany: 'PICKED: ',
    evLineup: 'Check the stats, then press SPACE or ENTER',
    evGate: 'The ponies are at the gate',
    evGo: 'And they are off!',
    evWin: (n) => n + ' wins the race!',
    evFinish: (n, r) => n + ' finishes in place ' + r,
    evTurbo: (n, v) => n + ' hits TURBO: x2 steps for ' + v + ' turns',
    evStar: (n, v) => n + ' grabs a STAR: +' + v + ' steps',
    evMud: (n, v) => n + ' is stuck in MUD for ' + v + (v > 1 ? ' turns' : ' turn'),
    evTrip: (n, v) => n + ' TRIPS: -' + v + ' steps',
    evWind: (n, v) => n + ' faces headWIND: x0.5 for ' + v + ' turns',
    evDice: (n, v) => n + ' rolls the DICE: ' + v + ' steps',
    popTurbo: 'TURBO X2', popMud: 'MUD', popWind: 'WIND', popDice: 'DICE ',
    copyHeader: 'Super Pony Picker results', copyPicked: 'Picked', copyTry: 'Try it',
    // settings screen
    uiTitle: 'SUPER PONY PICKER', uiSub: 'Random name picker horse race',
    uiPonies: 'PONIES', uiPaste: 'PASTE A LIST', uiPasteHint: 'One name per line (or separated by commas). Up to 20.',
    uiApply: 'USE LIST', uiCancel: 'CANCEL', uiPick: 'PICK', uiPickFirst: 'WINNER', uiPickLast: 'LAST PLACE',
    uiHowMany: 'HOW MANY', uiClose: 'CLOSE RACE (DRAFTING)', uiYes: 'YES', uiNo: 'NO',
    uiHelp: '? HOW IT WORKS', uiFull: 'FULLSCREEN', uiRandom: 'RANDOM NAMES', uiStart: 'START',
    uiPlaceholder: 'RANDOM', uiPhoto: 'Click to add a photo (it never leaves your device)',
    uiHint: 'Empty lane = random biblical name · Click a pony to add a photo<br>SPACE: speed x3 · M: sound · F: fullscreen',
    uiFsBlocked: 'Fullscreen is not allowed here (for example inside the p5.js editor preview). Open the game in its own tab.',
    uiLangBtn: 'ES'
  },
  es: {
    signStart: 'SALIDA', signFinish: 'META',
    phaseLineup: 'PRESENTACIÓN', phaseReady: 'PREPARADOS', phaseRacing: 'EN CARRERA', phaseDone: 'CARRERA TERMINADA',
    turn: 'TURNO', done: 'META', leader: 'LÍDER', last: 'ÚLTIMO', pressStart: 'PRESS START', go: '¡YA!',
    statsTitle: 'ESTADÍSTICAS DE NACIMIENTO', colLane: 'PONI', colMin: 'MIN', colMax: 'MAX', colAvg: 'PROM', colTurns: 'TURN',
    legend: '* FAVORITO   TURN: ESTIMADO SIN CONTAR LAS CAJAS',
    legendDraft: '* FAVORITO   TURN: ESTIMADO SIN CAJAS NI REBUFO',
    pressToGo: 'ESPACIO / ENTER / CLIC PARA EMPEZAR',
    results: 'RESULTADOS', winners: 'GANADORES', losers: 'ÚLTIMOS LUGARES', turnsWord: 'TURNOS',
    lastPlace: 'ÚLTIMO', place: 'PUESTO', rematch: 'REVANCHA', settings: 'CONFIGURAR', copyBtn: 'COPIAR', copied: '¡COPIADO!',
    picked: 'ELEGIDO: ', pickedMany: 'ELEGIDOS: ',
    evLineup: 'Revisa las estadísticas y presiona ESPACIO o ENTER',
    evGate: 'Los ponis están en la salida',
    evGo: '¡Arranca la carrera!',
    evWin: (n) => '¡' + n + ' gana la carrera!',
    evFinish: (n, r) => n + ' cruza la meta en el puesto ' + r,
    evTurbo: (n, v) => n + ' activa TURBO: paso x2 por ' + v + ' turnos',
    evStar: (n, v) => n + ' agarra una ESTRELLA: +' + v + ' pasos',
    evMud: (n, v) => n + ' cae en el BARRO: pierde ' + v + (v > 1 ? ' turnos' : ' turno'),
    evTrip: (n, v) => n + ' se TROPIEZA: -' + v + ' pasos',
    evWind: (n, v) => n + ' tiene VIENTO en contra: x0.5 por ' + v + ' turnos',
    evDice: (n, v) => n + ' tira el DADO: ' + v + ' pasos',
    popTurbo: 'TURBO X2', popMud: 'BARRO', popWind: 'VIENTO', popDice: 'DADO ',
    copyHeader: 'Resultados de Super Pony Picker', copyPicked: 'Elegido', copyTry: 'Pruébalo',
    uiTitle: 'SUPER PONY PICKER', uiSub: 'Selector aleatorio de nombres con carrera de ponis',
    uiPonies: 'PONIS', uiPaste: 'PEGAR LISTA', uiPasteHint: 'Un nombre por línea (o separados por comas). Hasta 20.',
    uiApply: 'USAR LISTA', uiCancel: 'CANCELAR', uiPick: 'ELEGIR', uiPickFirst: 'GANADOR', uiPickLast: 'ÚLTIMO LUGAR',
    uiHowMany: 'CUÁNTOS', uiClose: 'CARRERA REÑIDA (REBUFO)', uiYes: 'SÍ', uiNo: 'NO',
    uiHelp: '? CÓMO FUNCIONA', uiFull: 'PANTALLA COMPLETA', uiRandom: 'NOMBRES AL AZAR', uiStart: 'START',
    uiPlaceholder: 'AL AZAR', uiPhoto: 'Clic para poner una foto (nunca sale de tu dispositivo)',
    uiHint: 'Carril vacío = nombre bíblico al azar · Clic en un poni para ponerle foto<br>ESPACIO: velocidad x3 · M: sonido · F: pantalla completa',
    uiFsBlocked: 'Aquí no se permite pantalla completa (por ejemplo, en la vista previa del editor de p5.js). Abre el juego en su propia pestaña.',
    uiLangBtn: 'EN'
  }
};

let LANG = 'en';
function T(txtKey) {
  const d = I18N[LANG] || I18N.en;
  return txtKey in d ? d[txtKey] : I18N.en[txtKey];
}

// ─── Fair randomness (crypto) ─────────────────────────────────
const RNG_BUF = new Uint32Array(256);
let rngIdx = 256;
function rand01() {
  if (rngIdx >= RNG_BUF.length) {
    const c = window.crypto || window.msCrypto;
    if (c && c.getRandomValues) {
      c.getRandomValues(RNG_BUF);
    } else {
      for (let i = 0; i < RNG_BUF.length; i++) {
        RNG_BUF[i] = Math.floor(Math.random() * 4294967296);
      }
    }
    rngIdx = 0;
  }
  return RNG_BUF[rngIdx++] / 4294967296;
}
function rnd(a, b) {
  return a + rand01() * (b - a);
}
function randInt(a, b) {        // integer in [a, b]
  return a + Math.floor(rand01() * (b - a + 1));
}
function shuffleArr(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand01() * (i + 1));
    const t = arr[i];
    arr[i] = arr[j];
    arr[j] = t;
  }
  return arr;
}

// ─── Global state ─────────────────────────────────────────────
let cnv, ctx, gameEl;
let race = null;
let L = null;                 // layout of the current race
let phase = 'setup';          // setup · ready · countdown · racing · finishing · results
let camX = 0;
let readyAt = 0, goAt = 0, lastTick = 0, raceStart = 0, raceEnd = 0, lastNow = 0;
let fast = false, muted = false;
let uiButtons = [];
let confetti = [], rainDrops = [];
let copiedAt = -1e9;
let laneNames = [];
let laneCount = 6;
let pickMode = 'first';       // 'first' = winner(s) · 'last' = last place(s)
let pickCount = 1;
let closeRace = true;
let langChosen = false;     // true only after the user presses EN/ES
const customPhotos = [];
const photoCache = {};
const worldCache = {};

// =============================================================
//                         p5 LIFECYCLE
// =============================================================
function setup() {
  gameEl = document.getElementById('spp-game');
  if (!gameEl) {                      // p5 editor: build the container
    gameEl = document.createElement('div');
    gameEl.id = 'spp-game';
    document.body.appendChild(gameEl);
    document.body.style.margin = '0';
    document.body.style.background = '#000';
    document.body.style.overflow = 'hidden';
  }
  cnv = createCanvas(W, H);
  cnv.parent(gameEl);
  pixelDensity(1);
  noSmooth();
  ctx = drawingContext;

  loadSettings();
  injectGameCSS();
  buildSetupUI();
  buildHelpUI();
  setupPointer();
  applyLang();

  if (window.ResizeObserver) {
    new ResizeObserver(() => fitCanvas()).observe(gameEl);
  }
  document.addEventListener('fullscreenchange', () => setTimeout(fitCanvas, 50));
  fitCanvas();
}

function windowResized() {
  fitCanvas();
}

// The canvas always fits inside the game box, keeping its aspect
function fitCanvas() {
  if (!cnv || !gameEl) {
    return;
  }
  const gb = gameEl.getBoundingClientRect();
  const bw = gb.width || window.innerWidth;
  const bh = gb.height || window.innerHeight;
  const s = Math.min(bw / W, bh / H);
  const st = cnv.elt.style;
  st.position = 'absolute';
  st.left = '50%';
  st.top = '50%';
  st.transform = 'translate(-50%, -50%)';
  st.width = Math.floor(W * s) + 'px';
  st.height = Math.floor(H * s) + 'px';
  st.imageRendering = 'pixelated';
  st.display = 'block';
}

function setRes(w, h) {
  if (w !== W || h !== H) {
    W = w;
    H = h;
    resizeCanvas(w, h);
    pixelDensity(1);
    fitCanvas();
  }
}

function draw() {
  const now = millis();
  const dt = Math.min(100, now - (lastNow || now));
  lastNow = now;
  uiButtons = [];

  if (phase === 'setup' || !race) {
    const la = layoutFor(laneCount);
    setRes(la.w, la.h);
    ctx = drawingContext;
    ctx.imageSmoothingEnabled = false;
    drawAttract(now, la);
  } else if (phase === 'results') {
    setRes(RES_W, resultsHeight(race.horses.length));
    ctx = drawingContext;
    ctx.imageSmoothingEnabled = false;
    drawResults(now);
  } else {
    setRes(L.w, L.h);
    ctx = drawingContext;
    ctx.imageSmoothingEnabled = false;
    updateRace(now, dt);
    drawRace(now);
  }
}

// Everything adapts to the number of ponies
function layoutFor(n) {
  const trackBottom = TRACK_TOP + n * LANE_H;
  const miniRow = n <= 10 ? 2 : 1;
  const panelY = trackBottom + 14;
  const panelH = 4 + 18 + n * miniRow + 4;
  const h = panelY + panelH + 3;
  const w = Math.max(184, Math.round(h * 1.6));
  return { n, trackBottom, miniRow, panelY, panelH, w, h, worldW: FINISH_X + n * SHEAR + w };
}

function resultsHeight(n) {
  const rows = Math.ceil(n / 5);
  return Math.max(200, 188 + rows * 9 + 3);
}

// =============================================================
//                        DRAWING HELPERS
// =============================================================
function R(x, y, w, h, col) {
  ctx.fillStyle = col;
  ctx.fillRect(Math.round(x), Math.round(y), w, h);
}

function hash2(x, y) {
  let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function shade(hexCol, f) {
  const n = parseInt(hexCol.slice(1), 16);
  const ch = (v) => Math.max(0, Math.min(255, Math.round(v * f)));
  return 'rgb(' + ch(n >> 16) + ',' + ch((n >> 8) & 255) + ',' + ch(n & 255) + ')';
}

// 3x5 bitmap font
const GLYPHS = {
  A: [2, 5, 7, 5, 5], B: [6, 5, 6, 5, 6], C: [3, 4, 4, 4, 3], D: [6, 5, 5, 5, 6], E: [7, 4, 6, 4, 7],
  F: [7, 4, 6, 4, 4], G: [3, 4, 5, 5, 3], H: [5, 5, 7, 5, 5], I: [7, 2, 2, 2, 7], J: [1, 1, 1, 5, 2],
  K: [5, 5, 6, 5, 5], L: [4, 4, 4, 4, 7], M: [5, 7, 7, 5, 5], N: [6, 5, 5, 5, 5], O: [2, 5, 5, 5, 2],
  P: [6, 5, 6, 4, 4], Q: [2, 5, 5, 6, 3], R: [6, 5, 6, 5, 5], S: [3, 4, 2, 1, 6], T: [7, 2, 2, 2, 2],
  U: [5, 5, 5, 5, 7], V: [5, 5, 5, 5, 2], W: [5, 5, 7, 7, 5], X: [5, 5, 2, 5, 5], Y: [5, 5, 2, 2, 2],
  Z: [7, 1, 2, 4, 7],
  0: [7, 5, 5, 5, 7], 1: [2, 6, 2, 2, 7], 2: [6, 1, 2, 4, 7], 3: [6, 1, 2, 1, 6], 4: [5, 5, 7, 1, 1],
  5: [7, 4, 6, 1, 6], 6: [3, 4, 6, 5, 2], 7: [7, 1, 2, 2, 2], 8: [2, 5, 2, 5, 2], 9: [2, 5, 3, 1, 6],
  ':': [0, 2, 0, 2, 0], '.': [0, 0, 0, 0, 2], '-': [0, 0, 7, 0, 0], '!': [2, 2, 2, 0, 2],
  '?': [6, 1, 2, 0, 2], '/': [1, 1, 2, 4, 4], '+': [0, 2, 7, 2, 0], '(': [1, 2, 2, 2, 1],
  ')': [4, 2, 2, 2, 4], ',': [0, 0, 0, 2, 4], "'": [2, 2, 0, 0, 0], '<': [1, 2, 4, 2, 1],
  '>': [4, 2, 1, 2, 4], '#': [5, 7, 5, 7, 5], '*': [5, 2, 7, 2, 5], '~': [0, 3, 6, 0, 0],
  '@': [5, 0, 2, 0, 5], '&': [2, 5, 2, 5, 3], ' ': [0, 0, 0, 0, 0]
};

// Accented capitals: base glyph + a mark drawn one pixel row above
const ACCENTED = {
  'Á': ['A', 'acute'], 'É': ['E', 'acute'], 'Í': ['I', 'acute'], 'Ó': ['O', 'acute'], 'Ú': ['U', 'acute'],
  'Ñ': ['N', 'tilde'], 'Ü': ['U', 'diaer']
};
const MARKS = { acute: [[2, -1]], tilde: [[0, -1], [1, -1], [2, -1]], diaer: [[0, -1], [2, -1]] };

function cleanText(s) {
  let out = '';
  for (const ch of String(s).replace(/[¡¿]/g, '').toUpperCase()) {
    out += ACCENTED[ch] ? ch : ch.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }
  return out;
}

function tw(s, sc) {
  const k = sc || 1;
  return s.length ? s.length * 4 * k - k : 0;
}

function drawText(s, x, y, col, sc, shadow) {
  const k = sc || 1;
  if (shadow) {
    const o = Math.min(k, 2);
    drawText(s, x + o, y + o, shadow, k);
  }
  ctx.fillStyle = col;
  let cx = Math.round(x);
  const cy = Math.round(y);
  for (const ch of s) {
    const acc = ACCENTED[ch];
    const g = GLYPHS[acc ? acc[0] : ch] || GLYPHS[' '];
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 3; c++) {
        if (g[r] & (4 >> c)) {
          ctx.fillRect(cx + c * k, cy + r * k, k, k);
        }
      }
    }
    if (acc) {
      for (const m of MARKS[acc[1]]) {
        ctx.fillRect(cx + m[0] * k, cy + m[1] * k - Math.floor(k / 2), k, k);
      }
    }
    cx += 4 * k;
  }
}

function drawTextC(s, cx, y, col, sc, shadow) {
  drawText(s, Math.round(cx - tw(s, sc) / 2), y, col, sc, shadow);
}

function wrapLines(sentence, maxChars) {
  const lines = [''];
  for (const word of sentence.split(' ')) {
    const cur = lines[lines.length - 1];
    if ((cur ? cur.length + 1 : 0) + word.length <= maxChars) {
      lines[lines.length - 1] = cur ? cur + ' ' + word : word;
    } else {
      lines.push(word.slice(0, maxChars));
    }
  }
  return lines;
}

// =============================================================
//                    SPRITES: PONY + JOCKEY
// =============================================================
// Frames 0-3 gallop · 4 jump · 5 standing
const LEG_FRAMES = [
  { bn: -0.9, bf: -0.5, fn: 0.9, ff: 0.6, len: 7, bob: 0 },
  { bn: -0.3, bf: 0.1, fn: 0.3, ff: -0.2, len: 7, bob: -1 },
  { bn: 0.5, bf: 0.3, fn: -0.5, ff: -0.3, len: 7, bob: 0 },
  { bn: 0.1, bf: -0.3, fn: -0.1, ff: 0.3, len: 7, bob: -1 },
  { bn: -1.1, bf: -0.8, fn: 1.2, ff: 0.9, len: 5, bob: 0 },
  { bn: 0, bf: 0.15, fn: 0, ff: 0.15, len: 7, bob: 0 }
];
const SPR_W = 26, SPR_H = 27;
const SPR_NOSE_X = 23, SPR_BASE_Y = 23;

function buildSprite(coat, silk, f) {
  const c = document.createElement('canvas');
  c.width = SPR_W;
  c.height = SPR_H;
  const g = c.getContext('2d');
  const LG = LEG_FRAMES[f];
  const body = coat[0], mane = coat[1];
  const far = shade(body, 0.65);
  const Rs = (x, y, w, h, col) => {
    g.fillStyle = col;
    g.fillRect(1 + x, 2 + y + LG.bob, w, h);
  };
  const leg = (hx, a, col) => {
    for (let i = 0; i < LG.len; i++) {
      Rs(hx + Math.round(a * i), 15 + i, 1, 1, col);
    }
  };

  leg(8, LG.bf, far);
  leg(15, LG.ff, far);
  Rs(2, 10, 3, 1, mane);
  Rs(1, 11, 2, 2, mane);
  if (f % 2 === 0) {
    Rs(0, 13, 2, 2, mane);
  } else {
    Rs(1, 13, 1, 3, mane);
  }
  Rs(4, 10, 1, 4, body);
  Rs(5, 10, 12, 5, body);
  Rs(6, 15, 10, 1, body);
  Rs(6, 10, 8, 1, shade(body, 1.2));
  Rs(15, 6, 3, 5, body);
  Rs(16, 4, 3, 3, body);
  Rs(18, 4, 4, 3, body);
  Rs(21, 6, 2, 2, body);
  Rs(17, 3, 1, 1, body);
  Rs(15, 5, 1, 4, mane);
  Rs(16, 3, 1, 2, mane);
  Rs(19, 5, 1, 1, PAL.black);
  leg(6, LG.bn, body);
  leg(13, LG.fn, body);
  Rs(8, 11, 4, 3, PAL.white);
  Rs(8, 8, 4, 2, PAL.white);
  Rs(10, 10, 2, 2, '#202020');
  Rs(9, 5, 4, 3, silk.shirt);
  Rs(13, 6, 2, 2, silk.shirt);
  Rs(15, 7, 1, 1, PAL.skin);
  Rs(12, 2, 3, 3, PAL.skin);
  Rs(11, 1, 4, 2, silk.cap);
  Rs(15, 2, 1, 1, silk.cap);

  // 1px black outline
  const img = g.getImageData(0, 0, SPR_W, SPR_H);
  const d = img.data;
  const out = new Uint8ClampedArray(d);
  const opaque = (x, y) => x >= 0 && y >= 0 && x < SPR_W && y < SPR_H && d[(y * SPR_W + x) * 4 + 3] > 0;
  for (let y = 0; y < SPR_H; y++) {
    for (let x = 0; x < SPR_W; x++) {
      const i = (y * SPR_W + x) * 4;
      if (d[i + 3] === 0 && (opaque(x - 1, y) || opaque(x + 1, y) || opaque(x, y - 1) || opaque(x, y + 1))) {
        out[i] = 0;
        out[i + 1] = 0;
        out[i + 2] = 0;
        out[i + 3] = 255;
      }
    }
  }
  g.putImageData(new ImageData(out, SPR_W, SPR_H), 0, 0);
  return c;
}

const spriteCache = [];
function spritesForLane(k) {
  if (!spriteCache[k]) {
    const coat = COATS[(k * 4) % COATS.length];
    spriteCache[k] = LEG_FRAMES.map((_, f) => buildSprite(coat, SILKS[k % SILKS.length], f));
  }
  return spriteCache[k];
}

// =============================================================
//                           WORLD
// =============================================================
function laneTop(k) {
  return TRACK_TOP + k * LANE_H;
}
function laneOff(k) {
  return k * SHEAR;
}

function getWorld(n) {
  const wKey = n + '|' + LANG;
  if (!worldCache[wKey]) {
    const keys = Object.keys(worldCache);
    if (keys.length > 6) {
      delete worldCache[keys[0]];
    }
    worldCache[wKey] = buildWorld(layoutFor(n));
  }
  return worldCache[wKey];
}

function buildWorld(la) {
  const n = la.n;
  const WW = la.worldW, WH = la.h;
  const c = document.createElement('canvas');
  c.width = WW;
  c.height = WH;
  const g = c.getContext('2d');
  const Rw = (x, y, w, h, col) => {
    g.fillStyle = col;
    g.fillRect(x, y, w, h);
  };
  const saved = ctx;
  ctx = g;

  Rw(0, 0, WW, WH, PAL.grass);
  for (let y = 2; y < WH; y += 6) {
    if (y >= 28 && y < la.trackBottom + 12) {
      continue;
    }
    for (let x = 0; x < WW; x += 8) {
      const h = hash2(x, y);
      if (h < 0.45) {
        const ox = x + (Math.floor(h * 100) % 6);
        Rw(ox, y + 1, 1, 1, PAL.grassDark);
        Rw(ox + 1, y, 1, 1, PAL.grassDark);
        Rw(ox + 2, y + 1, 1, 1, PAL.grassDark);
      }
    }
  }

  // fence + bushes
  Rw(0, 33, WW, 1, PAL.bushLight);
  Rw(0, 34, WW, 1, PAL.bushDark);
  for (let x = 0; x < WW; x += 16) {
    Rw(x, 30, 2, 8, PAL.bushLight);
    Rw(x + 2, 30, 1, 8, PAL.bushDark);
  }
  const BUSH = ['..bbbb..', '.bccbbb.', 'bccbbbbd', 'bcbbbbbd', 'bbbbbbdd', '.dddddd.'];
  const BUSH_COL = { b: PAL.bush, c: PAL.bushLight, d: PAL.bushDark };
  for (let x = 0; x < WW; x += 8) {
    const yb = 38 + (hash2(x, 1) < 0.5 ? 0 : 1);
    for (let ry = 0; ry < BUSH.length; ry++) {
      const row = BUSH[ry];
      for (let rx = 0; rx < row.length; rx++) {
        if (row[rx] !== '.') {
          Rw(x + rx, yb + ry, 1, 1, BUSH_COL[row[rx]]);
        }
      }
    }
  }

  // track
  const trackH = n * LANE_H;
  Rw(0, TRACK_TOP, WW, trackH, PAL.dirt);
  const speckles = Math.floor(WW * trackH * 0.04);
  for (let i = 0; i < speckles; i++) {
    const x = Math.floor(hash2(i, 7) * WW);
    const y = TRACK_TOP + Math.floor(hash2(i, 11) * trackH);
    Rw(x, y, 1, 1, hash2(i, 13) < 0.6 ? PAL.dirtDark : PAL.dirtLight);
  }
  for (let k = 1; k < n; k++) {
    for (let x = (laneOff(k) % 12) - 12; x < WW; x += 12) {
      Rw(x, laneTop(k), 6, 1, PAL.line);
    }
  }
  Rw(0, TRACK_TOP - 1, WW, 1, PAL.black);
  Rw(0, TRACK_TOP, WW, 1, PAL.line);
  Rw(0, la.trackBottom, WW, 1, PAL.dirtDark);
  Rw(0, la.trackBottom + 1, WW, 1, PAL.black);

  // start line, lane numbers and diagonal finish line
  for (let k = 0; k < n; k++) {
    const top = laneTop(k);
    Rw(START_X + laneOff(k) - 1, top + 1, 2, LANE_H - 1, PAL.white);
    drawText(String(k + 1), START_X + laneOff(k) + 4, top + 4, PAL.line);
    const fx = FINISH_X + laneOff(k);
    for (let yy = 1; yy < LANE_H; yy += 2) {
      for (let xx = 0; xx < 4; xx += 2) {
        const white = ((yy >> 1) + (xx >> 1)) % 2 === 0;
        Rw(fx + xx - 2, top + yy, 2, 2, white ? PAL.white : PAL.black);
      }
    }
  }

  // signs
  const sign = (label, cx, bg, fg) => {
    const w = tw(label);
    const x = Math.round(cx - w / 2);
    Rw(x + Math.floor(w / 2), 28, 1, 5, PAL.black);
    Rw(x - 3, 18, w + 6, 10, PAL.black);
    Rw(x - 2, 19, w + 4, 8, bg);
    drawText(label, x, 20, fg);
  };
  sign(T('signStart'), START_X, PAL.white, PAL.black);
  for (let u = 25; u < META; u += 25) {
    sign(String(u), START_X + u * UNIT, PAL.bushLight, PAL.black);
  }
  sign(T('signFinish'), FINISH_X, PAL.red, PAL.white);

  // weeds under the track
  Rw(0, la.trackBottom + 2, WW, 10, PAL.weed);
  for (let x = 0; x < WW; x++) {
    const h = 2 + Math.floor(hash2(x, 3) * 8);
    Rw(x, la.trackBottom + 12 - h, 1, h, PAL.weedMid);
    if (hash2(x, 5) < 0.3) {
      Rw(x, la.trackBottom + 12 - h, 1, 1, PAL.weedLight);
    }
  }

  ctx = saved;
  return c;
}

// =============================================================
//                         RACE ENGINE
// =============================================================
function pickSpots() {
  for (let tries = 0; tries < 500; tries++) {
    const s = [];
    for (let k = 0; k < N_OBS; k++) {
      s.push(randInt(8, 93));
    }
    s.sort((a, b) => a - b);
    let ok = true;
    for (let k = 1; k < s.length; k++) {
      if (s[k] - s[k - 1] < 8) {
        ok = false;
      }
    }
    if (ok) {
      return s;
    }
  }
  return [20, 40, 60, 80];
}

function rollVal(t) {
  if (t === 'turbo') { return randInt(2, 4); }     // turns at x2
  if (t === 'estrella') { return randInt(3, 7); }  // extra steps
  if (t === 'barro') { return randInt(1, 3); }     // turns lost
  if (t === 'tropiezo') { return randInt(2, 6); }  // steps back
  if (t === 'viento') { return randInt(2, 4); }    // turns at x0.5
  return 0;                                        // dice: rolled when hit
}

function randomNames(count, exclude) {
  const used = new Set((exclude || []).map((s) => cleanText(s)));
  const pool = shuffleArr(BIBLE_NAMES[LANG].filter((nm) => !used.has(cleanText(nm))));
  const out = [];
  for (let i = 0; i < count; i++) {
    out.push(pool[i % pool.length] || ('Pony ' + (i + 1)));
  }
  return out;
}

function newRace(rawNames, opts) {
  const given = rawNames.filter((s) => s && s.trim());
  const fillers = randomNames(rawNames.length, given);
  let fi = 0;
  const horses = rawNames.map((raw, k) => {
    const name = raw && raw.trim() ? raw.trim() : fillers[fi++];
    const types = shuffleArr(Object.keys(EFFECTS)).slice(0, N_OBS);
    const spots = pickSpots();
    return {
      name, label: cleanText(name), lane: k,
      lo: rand01(), hi: 1 + rand01(),
      silk: SILKS[k % SILKS.length], sprites: spritesForLane(k),
      pos: 0, prev: 0, vis: 0, raw: 0, tie: 0,
      stun: 0, boost: 0, boostMul: 1,
      done: false, rank: 0, finishTurn: 0, moving: false,
      jumpAt: -1e9, popups: [],
      boxes: spots.map((at, i) => ({ at, type: types[i], val: rollVal(types[i]), hit: false, hitAt: 0 }))
    };
  });
  return {
    horses, pickMode: opts.pickMode, pickCount: opts.pickCount, closeRace: opts.closeRace,
    turn: 0, nextRank: 1, events: [], eventAt: 0
  };
}

function pushEvent(msg, now) {
  race.events.unshift(cleanText(msg));
  race.events.length = Math.min(race.events.length, 3);
  race.eventAt = now;
}

function popup(h, txt, col, now) {
  h.popups.push({ txt: cleanText(txt), col, at: now });
}

function tickRace(now) {
  race.turn++;
  const finishers = [];
  sfx(100 + rand01() * 40, 0.03, 'triangle', 0.03);

  let lead = 0;
  for (const h of race.horses) {
    if (!h.done && h.pos > lead) {
      lead = h.pos;
    }
  }

  for (const h of race.horses) {
    h.prev = h.pos;
    if (h.done) {
      continue;
    }
    if (h.stun > 0) {
      h.stun--;
      continue;
    }
    let adv = rnd(h.lo, h.hi);            // base step: always within [lo, hi]
    if (race.closeRace) {
      const gap = lead - h.pos;
      adv *= gap < 0.001 ? LEADER_FACTOR : 1 + Math.min(DRAFT_MAX, gap * DRAFT_PER_STEP);
    }
    if (h.boost > 0) {
      adv *= h.boostMul;
      h.boost--;
      if (h.boost === 0) {
        h.boostMul = 1;
      }
    }
    let np = h.pos + adv;
    for (const b of h.boxes) {
      if (!b.hit && h.pos < b.at && np >= b.at) {
        np = hitBox(h, b, now);
        break;
      }
    }
    h.pos = Math.max(0, np);
    if (h.pos >= META) {
      h.raw = h.pos;
      h.done = true;
      h.finishTurn = race.turn;
      h.tie = rand01();
      finishers.push(h);
    }
  }

  // Same turn: whoever went furthest past the line wins (random if exact tie)
  finishers.sort((a, b) => b.raw - a.raw || a.tie - b.tie);
  for (const h of finishers) {
    h.rank = race.nextRank++;
    if (h.rank === 1) {
      pushEvent(T('evWin')(h.name), now);
      melody([523, 659, 784, 1047], 0.1);
    } else {
      pushEvent(T('evFinish')(h.name, h.rank), now);
      sfx(600 + h.rank * 20, 0.1);
    }
  }
}

function hitBox(h, b, now) {
  b.hit = true;
  b.hitAt = now;
  h.jumpAt = now;
  const e = EFFECTS[b.type];
  let p = b.at, good = true, popTxt = '', msg = '';

  if (b.type === 'turbo') {
    h.boost = b.val; h.boostMul = 2;
    popTxt = T('popTurbo');
    msg = T('evTurbo')(h.name, b.val);
  } else if (b.type === 'estrella') {
    p += b.val;
    popTxt = '+' + b.val;
    msg = T('evStar')(h.name, b.val);
  } else if (b.type === 'barro') {
    h.stun = b.val; good = false;
    popTxt = T('popMud');
    msg = T('evMud')(h.name, b.val);
  } else if (b.type === 'tropiezo') {
    p -= b.val; good = false;
    popTxt = '-' + b.val;
    msg = T('evTrip')(h.name, b.val);
  } else if (b.type === 'viento') {
    h.boost = b.val; h.boostMul = 0.5; good = false;
    popTxt = T('popWind');
    msg = T('evWind')(h.name, b.val);
  } else {
    b.val = randInt(-6, 6);
    p += b.val; good = b.val >= 0;
    const sv = (b.val >= 0 ? '+' : '') + b.val;
    popTxt = T('popDice') + sv;
    msg = T('evDice')(h.name, sv);
  }

  popup(h, popTxt, e.col, now);
  pushEvent(msg, now);
  if (good) {
    melody([660, 880], 0.07);
  } else {
    melody([300, 200], 0.09);
  }
  return p;
}

function startRace(rawNames, opts) {
  race = newRace(rawNames, opts);
  L = layoutFor(race.horses.length);
  race.world = getWorld(race.horses.length);
  setRes(L.w, L.h);
  camX = 0;
  lastTick = 0;
  phase = 'ready';                 // waits for SPACE / ENTER / click
  readyAt = millis();
  hideSetup();
  pushEvent(T('evLineup'), millis());
  sfx(440, 0.15);
}

function beginCountdown() {
  if (phase !== 'ready' || millis() - readyAt < 400) {
    return;
  }
  goAt = millis() + COUNTDOWN_MS;
  phase = 'countdown';
  pushEvent(T('evGate'), millis());
  sfx(440, 0.15);
}

function updateRace(now, dt) {
  if (phase === 'countdown') {
    const n = Math.ceil((goAt - now) / (COUNTDOWN_MS / 3));
    if (race.lastBeep !== n && n >= 1) {
      race.lastBeep = n;
      if (n < 3) {
        sfx(440, 0.15);
      }
    }
    if (now >= goAt) {
      phase = 'racing';
      raceStart = now;
      lastTick = now;
      sfx(880, 0.35);
      pushEvent(T('evGo'), now);
    }
  }

  const tickMs = fast ? TICK_FAST_MS : TICK_MS;
  if (phase === 'racing' && now - lastTick >= tickMs) {
    tickRace(now);
    lastTick = now - lastTick > tickMs * 2 ? now : lastTick + tickMs;
    if (race.horses.every((h) => h.done)) {
      phase = 'finishing';
      raceEnd = now;
    }
  }

  const t = phase === 'racing' ? Math.min(1, (now - lastTick) / tickMs) : 1;
  for (const h of race.horses) {
    const lerped = h.prev + (h.pos - h.prev) * t;
    if (h.done) {
      const target = Math.max(lerped, META + 4);
      h.vis = Math.min(target, Math.max(h.vis, lerped) + dt * 0.004);
      h.moving = h.vis < target - 0.01;
    } else {
      h.vis = lerped;
      h.moving = phase === 'racing' && h.stun === 0;
    }
  }

  // camera: follows the ponies still running (the fight for last place)
  const running = race.horses.filter((h) => !h.done);
  let target;
  if (phase === 'countdown' || phase === 'ready') {
    target = 0;
  } else if (running.length) {
    const xs = running.map((h) => START_X + h.vis * UNIT + laneOff(h.lane));
    target = Math.max(Math.max(...xs) - (W - 40), Math.min(...xs) - 40);
  } else {
    target = FINISH_X + 4 * UNIT - W * 0.6;
  }
  target = Math.max(0, Math.min(L.worldW - W, target));
  camX += (target - camX) * Math.min(1, dt * 0.004);

  if (phase === 'finishing' && now - raceEnd > 1800) {
    phase = 'results';
    initCelebration();
    melody([392, 523, 659, 784, 659, 784, 1047], 0.13);
    setTimeout(() => melody([311, 294, 277, 247], 0.3), 1300);
  }
}

// =============================================================
//                        RACE DRAWING
// =============================================================
function drawBox(b, k, cx, now) {
  const x = START_X + Math.round(b.at * UNIT) + laneOff(k) - 4 - cx;
  if (x < -12 || x > W + 2) {
    return;
  }
  const y = laneTop(k) + 2;
  if (!b.hit) {
    const bob = Math.floor(now / 300 + b.at) % 2 ? 0 : -1;
    R(x + 1, y + 2, 9, 8, PAL.dirtDark);
    R(x, y + bob, 9, 8, PAL.black);
    R(x + 1, y + 1 + bob, 7, 6, PAL.yellow);
    R(x + 1, y + 1 + bob, 7, 1, PAL.bushLight);
    drawText('?', x + 3, y + 2 + bob, PAL.black);
  } else {
    const e = EFFECTS[b.type];
    R(x, y, 9, 8, PAL.black);
    R(x + 1, y + 1, 7, 6, PAL.mud);
    drawText(e.icon, x + Math.round((9 - tw(e.icon)) / 2), y + 2, e.col);
    const age = now - b.hitAt;
    if (age < 350) {
      const g = Math.floor(age / 35);
      ctx.strokeStyle = e.col;
      ctx.lineWidth = 1;
      ctx.strokeRect(x - g + 0.5, y - g + 0.5, 9 + 2 * g - 1, 8 + 2 * g - 1);
    }
  }
}

function drawRace(now) {
  const cx = Math.round(camX);
  ctx.drawImage(race.world, cx, 0, W, H, 0, 0, W, H);

  for (const h of race.horses) {
    for (const b of h.boxes) {
      drawBox(b, h.lane, cx, now);
    }
  }

  for (const h of race.horses) {
    const k = h.lane;
    const top = laneTop(k);
    const base = top + 10;
    const noseX = Math.round(START_X + h.vis * UNIT + laneOff(k) - cx);
    const dj = now - h.jumpAt;
    const jumpY = dj < JUMP_MS ? -Math.round(Math.sin((Math.PI * dj) / JUMP_MS) * 7) : 0;
    let frame = 5;
    if (jumpY < 0) {
      frame = 4;
    } else if (h.moving) {
      frame = Math.floor(now / (fast ? 50 : 85) + k * 1.3) % 4;
    }
    let sx = noseX - SPR_NOSE_X;
    if (h.stun > 0 && phase === 'racing') {
      sx += Math.floor(now / 60) % 2 ? 1 : -1;
    }

    if (noseX < 2) {
      const tag = '<' + h.label.slice(0, 8);
      R(0, top + 2, tw(tag) + 4, 8, h.silk.shirt);
      drawText(tag, 2, top + 3, PAL.black);
      continue;
    }
    if (sx > W) {
      const tag = h.rank ? '#' + h.rank + '>' : '>';
      const w = tw(tag) + 4;
      R(W - w, top + 2, w, 8, h.silk.shirt);
      drawText(tag, W - w + 2, top + 3, PAL.black);
      continue;
    }

    R(sx + 4, base + 1, 16, 1, PAL.dirtDark);

    if (h.boost > 0 && h.boostMul > 1 && phase === 'racing') {
      for (let i = 0; i < 3; i++) {
        R(sx - 6 - ((Math.floor(now / 20) + i * 7) % 14), base - 12 + i * 4, 6, 1, EFFECTS.turbo.col);
      }
    }
    if (h.boost > 0 && h.boostMul < 1 && phase === 'racing') {
      for (let i = 0; i < 3; i++) {
        R(noseX + 6 + ((Math.floor(now / 30) + i * 5) % 12), base - 14 + i * 4, 5, 1, EFFECTS.viento.col);
      }
    }
    if (h.stun > 0 && phase === 'racing') {
      R(sx + 5, base - 1, 5, 2, PAL.mud);
      R(sx + 13, base - 1, 6, 2, PAL.mud);
      drawText('Z', sx + 22, top - 8 - (Math.floor(now / 200) % 3), PAL.white, 1, PAL.black);
    }

    ctx.drawImage(h.sprites[frame], sx, base - SPR_BASE_Y + jumpY);
    drawText(h.label, sx - tw(h.label) - 1, top + 4, PAL.white, 1, PAL.black);
    if (phase === 'countdown' || phase === 'ready') {
      const st = h.lo.toFixed(2) + '-' + h.hi.toFixed(2);
      R(noseX + 11, top + 2, tw(st) + 4, 9, PAL.black);
      drawText(st, noseX + 13, top + 4, PAL.yellow);
    }
    if (h.rank) {
      drawText(String(h.rank), noseX + 3, top + 3, PAL.yellow, 1, PAL.black);
    }

    h.popups = h.popups.filter((p) => now - p.at < 1200);
    h.popups.forEach((p, i) => {
      const age = now - p.at;
      const col = Math.floor(age / 100) % 2 ? p.col : PAL.white;
      const stack = (h.popups.length - 1 - i) * 7;
      drawTextC(p.txt, noseX - 10, top - 10 - stack - Math.floor(age / 150), col, 1, PAL.black);
    });
  }

  drawHud(now);
}

function drawHud(now) {
  const horses = race.horses;
  let title = T('phaseReady');
  if (phase === 'ready') { title = T('phaseLineup'); }
  if (phase === 'racing') { title = T('phaseRacing'); }
  if (phase === 'finishing') { title = T('phaseDone'); }
  if (phase !== 'racing' || Math.floor(now / 500) % 2 === 0) {
    drawText(title, 4, 3, PAL.white, 1, PAL.black);
  }
  if (fast) {
    drawText('X3', 4 + tw(title) + 5, 3, PAL.red, 1, PAL.black);
  }
  const done = horses.filter((h) => h.done).length;
  drawText(T('turn') + ' ' + String(race.turn).padStart(3, '0') + '  ' + T('done') + ' ' + done + '/' + horses.length,
    4, 11, PAL.yellow, 1, PAL.black);

  if (phase !== 'ready' && phase !== 'countdown') {
    const byPos = [...horses].sort((a, b) => (a.rank || 999) - (b.rank || 999) || b.pos - a.pos);
    const lt = T('leader') + ' ' + byPos[0].label;
    const ut = T('last') + ' ' + byPos[byPos.length - 1].label;
    drawText(lt, W - 4 - tw(lt), 3, PAL.white, 1, PAL.black);
    drawText(ut, W - 4 - tw(ut), 11, PAL.red, 1, PAL.black);
  }

  // bottom panel: last event (up to 2 lines) + minimap
  const py = L.panelY, ph = L.panelH;
  R(3, py, W - 6, ph, PAL.black);
  R(3, py, W - 6, 1, PAL.white);
  R(3, py + ph - 1, W - 6, 1, PAL.white);
  R(3, py, 1, ph, PAL.white);
  R(W - 4, py, 1, ph, PAL.white);
  const lines = wrapLines(race.events[0] || '', Math.floor((W - 14) / 4)).slice(0, 2);
  const evCol = now - race.eventAt < 600 ? PAL.yellow : PAL.white;
  lines.forEach((ln, i) => drawText(ln, 7, py + 3 + i * 8, evCol));

  const mx = 8, mw = W - 16, my = py + 21, mr = L.miniRow;
  for (const h of horses) {
    const y = my + h.lane * mr;
    R(mx, y, mw, 1, '#402000');
    for (const b of h.boxes) {
      if (!b.hit) {
        R(mx + Math.round((b.at / META) * (mw - 4)) + 1, y, 1, 1, PAL.yellow);
      }
    }
    const px = mx + Math.round((Math.min(h.vis, META) / META) * (mw - 4));
    R(px, y, 4, mr, h.silk.shirt);
  }
  R(mx + mw - 1, my, 1, horses.length * mr, PAL.white);

  if (phase === 'ready') {
    drawStatsPanel(now);
  } else if (phase === 'countdown') {
    const n = Math.max(1, Math.ceil((goAt - now) / (COUNTDOWN_MS / 3)));
    drawTextC(String(n), W / 2, Math.round(L.trackBottom / 2) + 8, PAL.white, 5, PAL.black);
  } else if (phase === 'racing' && now - raceStart < 700) {
    drawTextC(T('go'), W / 2, Math.round(L.trackBottom / 2) + 8, PAL.yellow, 5, PAL.black);
  }
}

// Table with the stats every pony was born with
function drawStatsPanel(now) {
  const hs = race.horses;
  const n = hs.length;
  const wide = W >= 300;
  const rowH = n <= 10 ? 10 : 8;
  const pw = wide ? Math.min(W - 12, 292) : W - 12;
  const x0 = Math.round((W - pw) / 2);
  const ph = 23 + n * rowH + (wide ? 22 : 12);
  const y0 = Math.max(18, Math.round((L.panelY - ph) / 2));

  ctx.fillStyle = 'rgba(0,0,0,0.95)';
  ctx.fillRect(x0, y0, pw, ph);
  R(x0, y0, pw, 1, PAL.white);
  R(x0, y0 + ph - 1, pw, 1, PAL.white);
  R(x0, y0, 1, ph, PAL.white);
  R(x0 + pw - 1, y0, 1, ph, PAL.white);
  drawTextC(T('statsTitle'), x0 + pw / 2, y0 + 4, PAL.yellow);

  const cName = x0 + 5, cMin = x0 + 66, cMax = cMin + 22, cAvg = cMax + 22, cEst = cAvg + 24;
  const bx = cEst + 24, bw = Math.min(116, x0 + pw - 6 - bx);
  const hy = y0 + 14;
  drawText(T('colLane'), cName, hy, PAL.dim);
  drawText(T('colMin'), cMin, hy, PAL.dim);
  drawText(T('colMax'), cMax, hy, PAL.dim);
  drawText(T('colAvg'), cAvg, hy, PAL.dim);
  if (wide) {
    drawText(T('colTurns'), cEst, hy, PAL.dim);
    drawText('0', bx - 1, hy, PAL.dim);
    drawText('1', bx + Math.round(bw / 2) - 1, hy, PAL.dim);
    drawText('2', bx + bw - 3, hy, PAL.dim);
  }

  let fav = hs[0];
  for (const h of hs) {
    if (h.lo + h.hi > fav.lo + fav.hi) {
      fav = h;
    }
  }

  hs.forEach((h, i) => {
    const y = y0 + 23 + i * rowH;
    const avg = (h.lo + h.hi) / 2;
    const nm = h.label.slice(0, 12);
    R(cName, y + 1, 3, 3, h.silk.shirt);
    drawText(nm, cName + 5, y, h === fav ? PAL.gold : PAL.white);
    if (h === fav) {
      drawText('*', cName + 5 + tw(nm) + 2, y, PAL.gold);
    }
    drawText(h.lo.toFixed(2), cMin, y, PAL.white);
    drawText(h.hi.toFixed(2), cMax, y, PAL.white);
    drawText(avg.toFixed(2), cAvg, y, PAL.yellow);
    if (wide) {
      drawText('~' + Math.round(META / avg), cEst, y, PAL.white);
      R(bx, y + 2, bw, 1, '#303030');
      R(bx + Math.round(bw / 2), y, 1, 5, '#303030');
      const a = bx + Math.round((h.lo / 2) * bw);
      const b = bx + Math.round((h.hi / 2) * bw);
      R(a, y + 1, Math.max(1, b - a), 3, h.silk.shirt);
      R(bx + Math.round((avg / 2) * bw), y, 1, 5, PAL.white);
    }
  });

  if (wide) {
    drawText(race.closeRace ? T('legendDraft') : T('legend'), x0 + 5, y0 + ph - 20, PAL.dim);
  }
  if (Math.floor(now / 450) % 2 === 0) {
    drawTextC(T('pressToGo'), x0 + pw / 2, y0 + ph - 10, PAL.white);
  }
}

function drawAttract(now, la) {
  const world = getWorld(la.n);
  const scroll = Math.floor(now / 30) % (FINISH_X - START_X);
  ctx.drawImage(world, scroll, 0, W, H, 0, 0, W, H);
  for (let k = 0; k < la.n; k++) {
    const bob = Math.round(Math.sin(now / 400 + k) * 10);
    const frame = Math.floor(now / 85 + k * 1.3) % 4;
    ctx.drawImage(spritesForLane(k)[frame], Math.round(W * 0.45) + bob + laneOff(k) - SPR_NOSE_X, laneTop(k) + 10 - SPR_BASE_Y);
  }
  if (Math.floor(now / 500) % 2 === 0) {
    drawText(T('pressStart'), 4, 3, PAL.white, 1, PAL.black);
  }
}

// =============================================================
//              RESULTS: PODIUM + LAST PLACES IN THE RAIN
// =============================================================
const CROWN = ['Y.Y.Y', 'YYYYY', 'YRYRY', 'YYYYY'];

function initCelebration() {
  confetti = [];
  for (let i = 0; i < 60; i++) {
    confetti.push(newConfetti(true));
  }
  rainDrops = [];
  for (let i = 0; i < 40; i++) {
    rainDrops.push({ x: rnd(168, 312), y: rnd(56, 184), v: rnd(1.6, 2.4) });
  }
}

function newConfetti(anyY) {
  const cols = SILKS.slice(0, 9).map((s) => s.shirt).concat([PAL.white, PAL.gold]);
  return {
    x: rnd(4, 154), y: anyY ? rnd(-150, 0) : rnd(-20, -2),
    vy: rnd(0.4, 0.9), ph: rnd(0, 6.28),
    c: cols[Math.floor(Math.random() * cols.length)]
  };
}

function getPhoto(h) {
  const src = customPhotos[h.lane];
  if (!src) {
    return null;
  }
  const cacheKey = 'lane' + h.lane + ':' + src.length;
  if (!photoCache[cacheKey]) {
    const img = new Image();
    img.onerror = () => { img.failed = true; };
    img.src = src;
    photoCache[cacheKey] = img;
  }
  const img = photoCache[cacheKey];
  return (img.complete && img.naturalWidth > 0 && !img.failed) ? img : null;
}

// Square-cropped photo; if there is none, the lane's pony
function drawPortrait(h, x, y, s, border) {
  R(x - 1, y - 1, s + 2, s + 2, border || PAL.white);
  const img = getPhoto(h);
  if (img) {
    const side = Math.min(img.naturalWidth, img.naturalHeight);
    const ox = (img.naturalWidth - side) / 2;
    const oy = (img.naturalHeight - side) / 2;
    ctx.drawImage(img, ox, oy, side, side, x, y, s, s);
  } else {
    R(x, y, s, s, shade(h.silk.shirt, 0.35));
    if (s >= SPR_W) {
      ctx.drawImage(h.sprites[5], x + Math.floor((s - SPR_W) / 2), y + Math.floor((s - SPR_H) / 2) + 1);
    } else {
      ctx.drawImage(h.sprites[5], 5, 1, 21, 21, x, y, s, s);
    }
  }
}

// ── Canvas buttons (real pointer position, works in p5 1.x and 2.x) ──
const ptr = { x: -1, y: -1 };

function pointerToCanvas(e) {
  const r = cnv.elt.getBoundingClientRect();
  ptr.x = (e.clientX - r.left) * W / r.width;
  ptr.y = (e.clientY - r.top) * H / r.height;
}

function setupPointer() {
  cnv.elt.addEventListener('pointermove', pointerToCanvas);
  cnv.elt.addEventListener('pointerleave', () => { ptr.x = -1; ptr.y = -1; });
  cnv.elt.addEventListener('pointerdown', (e) => {
    pointerToCanvas(e);
    if (phase === 'ready') {
      beginCountdown();
      return;
    }
    if (phase !== 'results') {
      return;
    }
    for (const b of uiButtons) {
      if (ptr.x >= b.x && ptr.x < b.x + b.w && ptr.y >= b.y && ptr.y < b.y + b.h) {
        sfx(520, 0.06);
        b.onClick();
        return;
      }
    }
  });
}

function pxButton(label, x, y, onClick) {
  const w = tw(label) + 10, hgt = 13;
  const hover = ptr.x >= x && ptr.x < x + w && ptr.y >= y && ptr.y < y + hgt;
  R(x, y, w, hgt, PAL.white);
  R(x + 1, y + 1, w - 2, hgt - 2, hover ? PAL.yellow : PAL.black);
  drawText(label, x + 5, y + 4, hover ? PAL.black : PAL.white);
  uiButtons.push({ x, y, w, h: hgt, onClick });
  return w;
}

function pickedHorses(sorted) {
  const n = sorted.length;
  const k = Math.max(1, Math.min(race.pickCount, n - 1));
  return race.pickMode === 'last' ? sorted.slice(n - k).reverse() : sorted.slice(0, k);
}

function drawResults(now) {
  const G = 140;
  const sorted = [...race.horses].sort((a, b) => a.rank - b.rank);
  const n = sorted.length;
  const picked = pickedHorses(sorted);
  const isPicked = (h) => picked.includes(h);
  const nl = race.pickMode === 'last' ? picked.length : Math.max(1, Math.min(2, n - 1));
  const losers = sorted.slice(n - nl).reverse();   // last place first
  const blink = Math.floor(now / 250) % 2 === 0;

  R(0, 0, W, H, PAL.black);
  drawTextC(T('results'), W / 2, 4, PAL.yellow, 2, PAL.black);
  const bw1 = pxButton(T('rematch'), 4, 3, rematch);
  pxButton(T('copyBtn'), 4 + bw1 + 3, 3, copyResults);
  pxButton(T('settings'), W - 4 - (tw(T('settings')) + 10), 3, openConfig);

  // banner with who was picked
  const names = picked.map((h) => h.label).join(', ');
  const banner = (picked.length > 1 ? T('pickedMany') : T('picked')) + names;
  R(0, 19, W, 11, PAL.red);
  drawTextC(banner.slice(0, Math.floor((W - 8) / 4)), W / 2, 22, blink ? PAL.yellow : PAL.white);
  if (now - copiedAt < 1500) {
    R(W / 2 - 30, 31, 60, 10, PAL.white);
    drawTextC(T('copied'), W / 2, 33, PAL.black);
  }

  // columns
  R(160, 34, 1, 148, '#303030');
  drawTextC(T('winners'), 80, 36, PAL.gold);
  R(80 - tw(T('winners')) / 2 - 4, 43, tw(T('winners')) + 8, 1, PAL.gold);
  drawTextC(T('losers'), 240, 36, PAL.red);
  R(240 - tw(T('losers')) / 2 - 4, 43, tw(T('losers')) + 8, 1, PAL.red);

  // ─────── WINNERS: podium ───────
  R(0, G, 160, 44, PAL.grass);
  R(0, G, 160, 2, PAL.weedLight);
  const bw = 46;
  const podium = [
    { place: 2, x: 8,   h: 46, col: PAL.silver },
    { place: 1, x: 57,  h: 60, col: PAL.gold },
    { place: 3, x: 106, h: 36, col: PAL.bronze }
  ];
  for (const p of podium) {
    const h = sorted[p.place - 1];
    if (!h) {
      continue;
    }
    const top = G - p.h, cxp = p.x + bw / 2;
    if (isPicked(h) && blink) {
      R(p.x - 3, top - 3, bw + 6, p.h + 3, PAL.yellow);
    }
    R(p.x - 1, top - 1, bw + 2, p.h + 1, PAL.black);
    R(p.x, top, bw, p.h, p.col);
    R(p.x, top, bw, 2, shade(p.col, 1.35));
    R(p.x, G - 4, bw, 4, shade(p.col, 0.6));
    drawTextC(String(p.place), cxp, top + 7, PAL.black, 3);

    const jump = p.place === 1 ? Math.round(Math.abs(Math.sin(now / 160)) * 4) : 0;
    let headY;
    if (getPhoto(h)) {
      const s = 26;
      drawPortrait(h, cxp - s / 2, top - s - 3 - jump, s, PAL.white);
      headY = top - s - 4 - jump;
    } else {
      const fr = p.place === 1 ? Math.floor(now / 140) % 4 : 5;
      const sy = top - SPR_BASE_Y - 2 - jump;
      ctx.drawImage(h.sprites[fr], cxp - 13, sy);
      headY = sy + 1;
    }
    if (p.place === 1) {
      for (let r = 0; r < CROWN.length; r++) {
        for (let c = 0; c < CROWN[r].length; c++) {
          const ch = CROWN[r][c];
          if (ch !== '.') {
            R(cxp - 2 + c, headY - 5 + r, 1, 1, ch === 'Y' ? PAL.gold : PAL.red);
          }
        }
      }
    }
    R(cxp - 2, G + 4, 4, 1, h.silk.shirt);
    drawTextC(h.label.slice(0, 11), cxp, G + 7, isPicked(h) ? PAL.yellow : PAL.white, 1, PAL.black);
    drawTextC(h.finishTurn + ' ' + T('turnsWord'), cxp, G + 15, PAL.weed);
  }

  for (const c of confetti) {
    c.y += c.vy;
    c.ph += 0.08;
    R(Math.round(c.x + Math.sin(c.ph) * 4), Math.round(c.y), Math.abs(Math.cos(c.ph)) > 0.5 ? 2 : 1, 2, c.c);
    if (c.y > G - 2) {
      Object.assign(c, newConfetti(false));
    }
  }

  // ─────── LAST PLACES: cards in the rain ───────
  R(178, 50, 124, 8, PAL.cloud);
  R(190, 45, 40, 6, PAL.cloud);
  R(244, 44, 44, 7, PAL.cloud);
  R(172, 56, 136, 5, shade(PAL.cloud, 0.8));
  for (const d of rainDrops) {
    d.y += d.v;
    if (d.y > 182) {
      d.y = rnd(62, 68);
      d.x = rnd(168, 312);
    }
    R(Math.round(d.x), Math.round(d.y), 1, 3, PAL.rain);
  }

  const cw = 46, gap = 4;
  const total = losers.length * cw + (losers.length - 1) * gap;
  const x0 = Math.round(240 - total / 2);
  losers.forEach((h, k) => {
    const x = x0 + k * (cw + gap), y = 72;
    const worst = k === 0;
    if (isPicked(h) && blink) {
      R(x - 3, y - 3, cw + 6, 90, PAL.yellow);
    }
    R(x - 1, y - 1, cw + 2, 86, worst ? PAL.red : PAL.dim);
    R(x, y, cw, 84, '#101018');
    R(x, y, cw, 10, worst ? PAL.red : '#303030');
    const head = worst ? T('lastPlace') : T('place') + ' ' + h.rank;
    drawTextC(head.slice(0, 11), x + cw / 2, y + 3, PAL.white);

    drawPortrait(h, x + 7, y + 14, 32, worst ? PAL.red : PAL.white);
    const tear = Math.floor(now / 90 + k * 7) % 12;
    R(x + 30, y + 26 + tear, 1, 2, PAL.rain);

    drawTextC(String(h.rank), x + cw / 2, y + 50, worst ? PAL.red : PAL.white, 2);
    drawTextC(h.label.slice(0, 11), x + cw / 2, y + 64, isPicked(h) ? PAL.yellow : PAL.white);
    drawTextC(h.finishTurn + ' ' + T('turnsWord'), x + cw / 2, y + 73, PAL.dim);
  });

  // ─────── FULL TABLE ───────
  const ty = 184;
  R(0, ty, W, H - ty, '#101018');
  R(0, ty, W, 1, PAL.white);
  sorted.forEach((h, i) => {
    const x = 5 + (i % 5) * 63;
    const y = ty + 4 + Math.floor(i / 5) * 9;
    let col = PAL.white;
    if (i < 3) { col = PAL.gold; }
    if (i >= n - nl) { col = PAL.red; }
    if (isPicked(h)) {
      R(x - 2, y - 1, 62, 7, PAL.yellow);
      col = PAL.black;
    }
    R(x, y + 1, 3, 3, h.silk.shirt);
    drawText(String(i + 1), x + 5, y, col);
    drawText(h.label.slice(0, 10), x + 14, y, col);
  });
}

function copyResults() {
  const sorted = [...race.horses].sort((a, b) => a.rank - b.rank);
  const picked = pickedHorses(sorted);
  const lines = ['🐴 ' + T('copyHeader') + ':'];
  sorted.forEach((h, i) => lines.push((i + 1) + '. ' + h.name));
  lines.push('');
  lines.push('✅ ' + T('copyPicked') + ': ' + picked.map((h) => h.name).join(', '));
  lines.push(T('copyTry') + ': ' + APP_URL);
  const txt = lines.join('\n');
  const done = () => { copiedAt = millis(); };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(txt).then(done).catch(() => fallbackCopy(txt, done));
  } else {
    fallbackCopy(txt, done);
  }
}

function fallbackCopy(txt, done) {
  const ta = document.createElement('textarea');
  ta.value = txt;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand('copy');
    done();
  } catch (e) {
    // clipboard not available
  }
  ta.remove();
}

function rematch() {
  startRace(race.horses.map((h) => h.name), { pickMode, pickCount, closeRace });
}

function openConfig() {
  phase = 'setup';
  showSetup();
}

// =============================================================
//                            INPUT
// =============================================================
function keyPressed() {
  if (phase === 'setup') {
    return;
  }
  if (phase === 'ready') {
    if (key === ' ' || key === 'Enter') {
      beginCountdown();
      return false;
    }
  }
  if (key === 'f' || key === 'F') {
    toggleFullscreen();
    return;
  }
  if (phase === 'results') {
    if (key === 'Enter' || key === 'r' || key === 'R') {
      rematch();
    }
    if (key === 'c' || key === 'C') {
      openConfig();
    }
    return;
  }
  if (key === ' ') {
    fast = !fast;
    return false;
  }
  if (key === 'm' || key === 'M') {
    muted = !muted;
  }
}

// =============================================================
//                    CHIPTUNE SOUND (WebAudio)
// =============================================================
let actx = null;
function sfx(freq, dur, type, vol) {
  if (muted) {
    return;
  }
  try {
    if (!actx) {
      actx = new (window.AudioContext || window.webkitAudioContext)();
    }
    const t = actx.currentTime;
    const d = dur || 0.1;
    const o = actx.createOscillator();
    const g = actx.createGain();
    o.type = type || 'square';
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(vol || 0.05, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g);
    g.connect(actx.destination);
    o.start(t);
    o.stop(t + d);
  } catch (e) {
    // no audio available
  }
}

function melody(notes, stepSec) {
  notes.forEach((f, i) => {
    setTimeout(() => sfx(f, stepSec * 0.9), i * stepSec * 1000);
  });
}

// =============================================================
//                 FULLSCREEN + LANGUAGE + STORAGE
// =============================================================
function goFullscreen() {
  const el = gameEl;
  const req = el.requestFullscreen || el.webkitRequestFullscreen;
  if (document.fullscreenElement || document.webkitFullscreenElement) {
    return;
  }
  const blocked = () => {
    const m = document.getElementById('spp-fsmsg');
    if (m) {
      m.style.display = 'block';
      m.textContent = T('uiFsBlocked');
    }
  };
  if (!req || document.fullscreenEnabled === false) {
    blocked();
    return;
  }
  try {
    const p = req.call(el);
    if (p && p.catch) {
      p.catch(blocked);
    }
  } catch (e) {
    blocked();
  }
}

function toggleFullscreen() {
  if (document.fullscreenElement || document.webkitFullscreenElement) {
    const exit = document.exitFullscreen || document.webkitExitFullscreen;
    if (exit) {
      exit.call(document);
    }
  } else {
    goFullscreen();
  }
}

const STORE_KEY = 'super-pony-picker';

function loadSettings() {
  let s = {};
  try {
    s = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
  } catch (e) {
    s = {};
  }
  if (Array.isArray(s.names)) { laneNames = s.names.slice(0, MAX_LANES); }
  if (s.count >= MIN_LANES && s.count <= MAX_LANES) { laneCount = s.count; }
  if (s.pickMode === 'last') { pickMode = 'last'; }
  if (s.pickCount >= 1 && s.pickCount <= 3) { pickCount = s.pickCount; }
  if (s.closeRace === false) { closeRace = false; }
  // English by default; Spanish only if the link asks for it (?lang=es)
  // or the user picked it before with the EN/ES button
  const urlLang = new URLSearchParams(location.search).get('lang');
  if (urlLang === 'es' || urlLang === 'en') {
    LANG = urlLang;
  } else if (s.langChosen && (s.lang === 'es' || s.lang === 'en')) {
    LANG = s.lang;
    langChosen = true;
  } else {
    LANG = 'en';
  }
}

function storeSettings() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify({
      names: laneNames, count: laneCount, pickMode, pickCount, closeRace,
      lang: langChosen ? LANG : undefined, langChosen
    }));
  } catch (e) {
    // storage not available
  }
}

function setLang(l) {
  LANG = l === 'es' ? 'es' : 'en';
  langChosen = true;
  storeSettings();
  applyLang();
}

// Updates everything that has text (game UI and, if present, the page)
function applyLang() {
  document.documentElement.lang = LANG;
  document.querySelectorAll('[data-lang]').forEach((el) => {
    el.hidden = el.getAttribute('data-lang') !== LANG;
  });
  document.querySelectorAll('[data-set-lang]').forEach((el) => {
    el.setAttribute('aria-pressed', String(el.getAttribute('data-set-lang') === LANG));
  });
  renderSetupTexts();
  renderLanes();
  renderHelp();
}

// =============================================================
//                    SETTINGS SCREEN (DOM)
// =============================================================
function injectGameCSS() {
  if (document.getElementById('spp-css')) {
    return;
  }
  const style = document.createElement('style');
  style.id = 'spp-css';
  style.textContent = `
@import url('https://fonts.googleapis.com/css2?family=Pixelify+Sans:wght@400;600;700&display=swap');
#spp-game { position: relative; width: 100%; height: 100vh; height: 100svh; background: #000; overflow: hidden; }
#spp-game:fullscreen { height: 100vh; }
.spp-ov { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
  background: rgba(0,0,0,.6); padding: 12px; box-sizing: border-box; z-index: 10;
  font-family: "Pixelify Sans", ui-monospace, monospace; color: #fcfcfc; }
.spp-ov.hidden { display: none; }
.spp-ov * { box-sizing: border-box; }
.spp-ov .box { background: #000; border: 4px solid #fcfcfc; box-shadow: 0 0 0 4px #000, 0 0 0 8px #0058f8;
  padding: 18px; width: 100%; max-width: 720px; max-height: 100%; overflow: auto;
  font-size: 15px; line-height: 1.5; }
.spp-ov .top { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
.spp-ov h2 { font-size: 26px; color: #f8b800; margin: 0; font-weight: 700; line-height: 1.1; letter-spacing: 1px; }
.spp-ov .sub { color: #9a9a9a; font-size: 13px; margin: 4px 0 0; }
.spp-ov .row { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin: 12px 0; flex-wrap: wrap; }
.spp-ov .lanes { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 16px; margin: 12px 0; }
@media (max-width: 560px) { .spp-ov .lanes { grid-template-columns: 1fr; } .spp-ov .box { font-size: 14px; } }
.spp-ov .lane { display: flex; align-items: center; gap: 8px; }
.spp-ov .lane img { width: 40px; height: 40px; image-rendering: pixelated; flex: none; cursor: pointer;
  border: 2px dashed #7c7c7c; object-fit: cover; background: #202020; }
.spp-ov .lane img.photo { border: 2px solid #f8b800; }
.spp-ov .lane span { color: #7c7c7c; flex: none; width: 22px; }
.spp-ov input[type=text], .spp-ov select, .spp-ov textarea { font: inherit; color: #fcfcfc; background: #000;
  border: 2px solid #fcfcfc; padding: 6px 8px; width: 100%; min-width: 0; border-radius: 0; }
.spp-ov input[type=text] { text-transform: uppercase; }
.spp-ov select { width: auto; }
.spp-ov textarea { min-height: 120px; resize: vertical; line-height: 1.6; }
.spp-ov input::placeholder, .spp-ov textarea::placeholder { color: #7c7c7c; }
.spp-ov input:focus, .spp-ov select:focus, .spp-ov textarea:focus, .spp-ov button:focus-visible { outline: 2px solid #f8b800; outline-offset: 2px; }
.spp-ov label.radio { cursor: pointer; margin-left: 10px; white-space: nowrap; }
.spp-ov input[type=radio] { accent-color: #f83800; }
.spp-ov .btns { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; margin-top: 14px; }
.spp-ov button { font: inherit; color: #fcfcfc; background: #000; border: 3px solid #fcfcfc;
  padding: 9px 12px; cursor: pointer; border-radius: 0; }
.spp-ov button:hover { background: #fcfcfc; color: #000; }
.spp-ov button.primary { background: #f83800; }
.spp-ov button.primary:hover { background: #f8b800; color: #000; }
.spp-ov button.small { padding: 4px 8px; font-size: 13px; }
.spp-ov .hint { color: #9a9a9a; text-align: center; margin: 12px 0 0; font-size: 12px; }
.spp-ov .paste { border: 2px dashed #7c7c7c; padding: 10px; margin: 10px 0; }
/* The main buttons always stay visible, even with 20 lanes */
#spp-setup .btns { position: sticky; bottom: -18px; background: #000; padding: 10px 0 12px; margin: 10px 0 0; z-index: 2; }
/* Compact mode for short screens (for example, embedded in a page or a phone in landscape) */
@media (max-height: 560px) {
  .spp-ov { padding: 6px; }
  .spp-ov .box { padding: 10px 12px; font-size: 13px; line-height: 1.3; box-shadow: 0 0 0 3px #000, 0 0 0 5px #0058f8; border-width: 3px; }
  .spp-ov h2 { font-size: 20px; }
  .spp-ov .sub, #spp-setup .hint { display: none; }
  .spp-ov .row { margin: 6px 0; }
  .spp-ov .lanes { gap: 5px 12px; margin: 6px 0; }
  .spp-ov .lane img { width: 26px; height: 26px; }
  .spp-ov input[type=text], .spp-ov select { padding: 3px 6px; }
  .spp-ov button { padding: 6px 8px; }
  #spp-setup .btns { bottom: -10px; padding: 6px 0 8px; margin-top: 6px; gap: 6px; }
  #spp-help .box { font-size: 13px; }
}
.spp-ov .paste p { margin: 0 0 8px; color: #9a9a9a; font-size: 13px; }
#spp-help .box { box-shadow: 0 0 0 4px #000, 0 0 0 8px #f8b800; font-size: 15px; line-height: 1.55; }
#spp-help h3 { font-size: 17px; color: #3cbcfc; margin: 18px 0 6px; font-weight: 600; }
#spp-help p { margin: 6px 0; }
#spp-help .y { color: #f8b800; } #spp-help .r { color: #f83800; }
#spp-help .boxes { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 16px; margin: 8px 0; }
@media (max-width: 560px) { #spp-help .boxes { grid-template-columns: 1fr; } }
#spp-help .bx { display: flex; gap: 10px; align-items: center; border: 2px solid #303030; padding: 8px; }
#spp-help .bx img { width: 45px; height: 40px; image-rendering: pixelated; flex: none; }
#spp-help .bx b { display: block; font-weight: normal; margin-bottom: 4px; }
#spp-help .tag { font-size: 11px; padding: 1px 5px; margin-left: 6px; }
#spp-help .good { background: #00a800; } #spp-help .bad { background: #f83800; } #spp-help .luck { background: #6844fc; }
#spp-help ul { margin: 4px 0; padding-left: 18px; } #spp-help li { margin: 4px 0; }
`;
  document.head.appendChild(style);
}

let setupEl = null;

function buildSetupUI() {
  setupEl = document.createElement('div');
  setupEl.id = 'spp-setup';
  setupEl.className = 'spp-ov';
  setupEl.innerHTML = `
    <div class="box" role="dialog" aria-labelledby="spp-title">
      <div class="top">
        <div><h2 id="spp-title"></h2><p class="sub" id="spp-sub"></p></div>
        <button id="spp-lang" type="button" class="small" aria-label="Language / Idioma"></button>
      </div>
      <div class="row">
        <label for="spp-count" id="spp-l-count"></label>
        <span><select id="spp-count"></select> <button id="spp-pastebtn" type="button" class="small"></button></span>
      </div>
      <div class="paste" id="spp-paste" hidden>
        <p id="spp-pastehint"></p>
        <textarea id="spp-pastearea" aria-labelledby="spp-pastehint"></textarea>
        <div class="btns">
          <button id="spp-pastecancel" type="button" class="small"></button>
          <button id="spp-pasteok" type="button" class="small primary"></button>
        </div>
      </div>
      <div id="spp-lanes" class="lanes"></div>
      <div class="row">
        <span id="spp-l-pick"></span>
        <span>
          <label class="radio"><input type="radio" name="spp-pick" value="first"> <span id="spp-l-first"></span></label>
          <label class="radio"><input type="radio" name="spp-pick" value="last"> <span id="spp-l-last"></span></label>
        </span>
      </div>
      <div class="row">
        <span id="spp-l-many"></span>
        <span>
          <label class="radio"><input type="radio" name="spp-many" value="1"> 1</label>
          <label class="radio"><input type="radio" name="spp-many" value="2"> 2</label>
          <label class="radio"><input type="radio" name="spp-many" value="3"> 3</label>
        </span>
      </div>
      <div class="row">
        <span id="spp-l-close"></span>
        <span>
          <label class="radio"><input type="radio" name="spp-close" value="1"> <span id="spp-l-yes"></span></label>
          <label class="radio"><input type="radio" name="spp-close" value="0"> <span id="spp-l-no"></span></label>
        </span>
      </div>
      <div class="btns">
        <button id="spp-helpbtn" type="button"></button>
        <button id="spp-fs" type="button"></button>
        <button id="spp-rand" type="button"></button>
        <button id="spp-start" type="button" class="primary"></button>
      </div>
      <p id="spp-fsmsg" class="hint" style="color:#f83800;display:none"></p>
      <p class="hint" id="spp-hint"></p>
      <input id="spp-file" type="file" accept="image/*" hidden>
    </div>`;
  gameEl.appendChild(setupEl);

  const $ = (id) => document.getElementById(id);
  const countSel = $('spp-count');
  for (let v = MIN_LANES; v <= MAX_LANES; v++) {
    const o = document.createElement('option');
    o.value = String(v);
    o.textContent = String(v);
    countSel.appendChild(o);
  }
  countSel.value = String(laneCount);
  countSel.addEventListener('change', () => {
    laneCount = Number(countSel.value);
    renderLanes();
    storeSettings();
  });

  const radios = (name, current, onChange) => {
    document.querySelectorAll('input[name=' + name + ']').forEach((r) => {
      r.checked = r.value === String(current);
      r.addEventListener('change', () => {
        onChange(r.value);
        storeSettings();
      });
    });
  };
  radios('spp-pick', pickMode, (v) => { pickMode = v; });
  radios('spp-many', pickCount, (v) => { pickCount = Number(v); });
  radios('spp-close', closeRace ? '1' : '0', (v) => { closeRace = v === '1'; });

  $('spp-lang').addEventListener('click', () => setLang(LANG === 'es' ? 'en' : 'es'));
  $('spp-helpbtn').addEventListener('click', showHelp);
  $('spp-fs').addEventListener('click', toggleFullscreen);
  $('spp-rand').addEventListener('click', () => {
    laneNames = randomNames(laneCount, []);
    renderLanes();
    storeSettings();
  });
  $('spp-start').addEventListener('click', beginFromSetup);

  $('spp-pastebtn').addEventListener('click', () => {
    $('spp-paste').hidden = false;
    $('spp-pastearea').value = laneNames.slice(0, laneCount).filter((s) => s && s.trim()).join('\n');
    $('spp-pastearea').focus();
  });
  $('spp-pastecancel').addEventListener('click', () => { $('spp-paste').hidden = true; });
  $('spp-pasteok').addEventListener('click', () => {
    const list = $('spp-pastearea').value.split(/[\n,;]+/).map((s) => s.trim()).filter(Boolean).slice(0, MAX_LANES);
    if (list.length) {
      laneNames = list.map((s) => s.slice(0, 14));
      laneCount = Math.max(MIN_LANES, list.length);
      countSel.value = String(laneCount);
    }
    $('spp-paste').hidden = true;
    renderLanes();
    storeSettings();
  });

  setupEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA' && e.target.tagName !== 'BUTTON') {
      beginFromSetup();
    }
  });

  let fileLane = -1;
  const fileInp = $('spp-file');
  fileInp.addEventListener('change', () => {
    const f = fileInp.files && fileInp.files[0];
    if (!f || fileLane < 0) {
      return;
    }
    const reader = new FileReader();
    const lane = fileLane;
    reader.onload = () => {
      customPhotos[lane] = reader.result;
      renderLanes();
    };
    reader.readAsDataURL(f);
    fileInp.value = '';
  });
  setupEl.pickPhoto = (k) => {
    fileLane = k;
    fileInp.click();
  };
}

function renderSetupTexts() {
  if (!setupEl) {
    return;
  }
  const setTxt = (id, txt, html) => {
    const el = document.getElementById(id);
    if (el) {
      if (html) {
        el.innerHTML = txt;
      } else {
        el.textContent = txt;
      }
    }
  };
  setTxt('spp-title', T('uiTitle'));
  setTxt('spp-sub', T('uiSub'));
  setTxt('spp-lang', T('uiLangBtn'));
  setTxt('spp-l-count', T('uiPonies'));
  setTxt('spp-pastebtn', T('uiPaste'));
  setTxt('spp-pastehint', T('uiPasteHint'));
  setTxt('spp-pasteok', T('uiApply'));
  setTxt('spp-pastecancel', T('uiCancel'));
  setTxt('spp-l-pick', T('uiPick'));
  setTxt('spp-l-first', T('uiPickFirst'));
  setTxt('spp-l-last', T('uiPickLast'));
  setTxt('spp-l-many', T('uiHowMany'));
  setTxt('spp-l-close', T('uiClose'));
  setTxt('spp-l-yes', T('uiYes'));
  setTxt('spp-l-no', T('uiNo'));
  setTxt('spp-helpbtn', T('uiHelp'));
  setTxt('spp-fs', '\u26F6 ' + T('uiFull'));
  setTxt('spp-rand', T('uiRandom'));
  setTxt('spp-start', '\u25B6 ' + T('uiStart'));
  setTxt('spp-hint', T('uiHint'), true);
  const fsm = document.getElementById('spp-fsmsg');
  if (fsm && fsm.style.display === 'block') {
    fsm.textContent = T('uiFsBlocked');
  }
}

function renderLanes() {
  const lanesEl = document.getElementById('spp-lanes');
  if (!lanesEl) {
    return;
  }
  lanesEl.innerHTML = '';
  for (let k = 0; k < laneCount; k++) {
    const row = document.createElement('div');
    row.className = 'lane';
    const img = document.createElement('img');
    if (customPhotos[k]) {
      img.src = customPhotos[k];
      img.className = 'photo';
    } else {
      img.src = spritesForLane(k)[5].toDataURL();
    }
    img.alt = 'Pony ' + (k + 1);
    img.title = T('uiPhoto');
    img.addEventListener('click', () => setupEl.pickPhoto(k));
    const lbl = document.createElement('span');
    lbl.textContent = String(k + 1);
    const inp = document.createElement('input');
    inp.type = 'text';
    inp.maxLength = 14;
    inp.placeholder = T('uiPlaceholder');
    inp.value = laneNames[k] || '';
    inp.setAttribute('aria-label', T('uiPonies') + ' ' + (k + 1));
    inp.addEventListener('input', () => {
      laneNames[k] = inp.value;
      storeSettings();
    });
    row.append(img, lbl, inp);
    lanesEl.appendChild(row);
  }
}

function beginFromSetup() {
  goFullscreen();
  storeSettings();
  const names = [];
  for (let k = 0; k < laneCount; k++) {
    names.push(laneNames[k] || '');
  }
  startRace(names, { pickMode, pickCount, closeRace });
}

function hideSetup() {
  setupEl.classList.add('hidden');
}

function showSetup() {
  renderLanes();
  setupEl.classList.remove('hidden');
}

// =============================================================
//                "HOW IT WORKS" SCREEN (DOM)
// =============================================================
function boxIconURL(type) {
  const c = document.createElement('canvas');
  c.width = 9;
  c.height = 8;
  const saved = ctx;
  ctx = c.getContext('2d');
  if (type === '?') {
    R(0, 0, 9, 8, PAL.black);
    R(1, 1, 7, 6, PAL.yellow);
    R(1, 1, 7, 1, PAL.bushLight);
    drawText('?', 3, 2, PAL.black);
  } else {
    const e = EFFECTS[type];
    R(0, 0, 9, 8, PAL.black);
    R(1, 1, 7, 6, PAL.mud);
    drawText(e.icon, Math.round((9 - tw(e.icon)) / 2), 2, e.col);
  }
  ctx = saved;
  return c.toDataURL();
}

const HELP = {
  en: {
    title: 'HOW IT WORKS', ok: 'GOT IT',
    kind: { good: 'GOOD', bad: 'BAD', luck: 'LUCK' },
    boxes: {
      turbo: 'Steps <span class="y">x2</span> for <span class="y">2 to 4</span> turns.',
      estrella: 'Jumps ahead <span class="y">+3 to +7</span> steps.',
      barro: 'Stuck for <span class="r">1 to 3</span> turns.',
      tropiezo: 'Falls back <span class="r">2 to 6</span> steps.',
      viento: 'Steps <span class="r">x0.5</span> for <span class="r">2 to 4</span> turns.',
      dado: 'Rolled when hit: from <span class="r">-6</span> to <span class="y">+6</span> steps.'
    },
    body: (boxes, q) => `
      <h3>1. THE PONIES</h3>
      <p>The first pony to reach <span class="y">100 steps</span> wins.</p>
      <p>Every pony is born with a <span class="y">min step</span> (0 to 1) and a <span class="y">max step</span> (1 to 2).
        Each turn it moves a random amount between the two. You can see these stats before the start.</p>
      <h3>2. MYSTERY BOXES</h3>
      <p>Every pony has <span class="y">4 boxes</span> in its own lane:</p>
      <ul>
        <li>At positions different from everyone else's (between step 8 and 93).</li>
        <li>With <span class="y">4 different types</span>, drawn from these 6.</li>
        <li>Hidden until hit: <img alt="? box" src="${q}" style="width:27px;height:24px;image-rendering:pixelated;vertical-align:middle"> nobody knows what's inside.</li>
      </ul>
      <div class="boxes">${boxes}</div>
      <h3>3. BOX RULES</h3>
      <ul>
        <li>When a pony hits a box it <span class="y">jumps</span>, stops on it and the box is revealed.</li>
        <li>Only <span class="y">one box per turn</span>.</li>
        <li>If a star or the dice throw it past another box, <span class="r">that box is lost</span>.</li>
        <li>Turbo and wind <span class="y">don't stack</span>: the latest replaces the previous one.</li>
        <li>Falling back <span class="y">never re-triggers</span> used boxes.</li>
      </ul>
      <h3>4. CLOSE RACE (DRAFTING)</h3>
      <p>If enabled, ponies behind get <span class="y">+20%</span> per step behind the leader (up to +150%),
        and the leader breaks the wind and moves at <span class="r">70%</span>. You can turn it off in the settings.</p>
      <h3>5. IS IT FAIR?</h3>
      <p>Yes. All randomness comes from your browser's <span class="y">cryptographic random generator</span>,
        stats and boxes are drawn again every race, and no lane has any advantage.
        <span class="y">Every name has exactly the same chance</span> of being picked.
        Photos and names never leave your device.</p>
      <h3>6. CONTROLS</h3>
      <p><span class="y">SPACE / ENTER</span> start after the line-up · <span class="y">SPACE</span> speed x3 ·
        <span class="y">M</span> sound · <span class="y">F</span> fullscreen · Results: <span class="y">R</span> rematch,
        <span class="y">C</span> settings.</p>`
  },
  es: {
    title: 'CÓMO FUNCIONA', ok: 'ENTENDIDO',
    kind: { good: 'BUENA', bad: 'MALA', luck: 'SUERTE' },
    boxes: {
      turbo: 'Paso <span class="y">x2</span> durante <span class="y">2 a 4</span> turnos.',
      estrella: 'Avanza de una <span class="y">+3 a +7</span> pasos.',
      barro: 'Se queda quieto <span class="r">1 a 3</span> turnos.',
      tropiezo: 'Retrocede <span class="r">2 a 6</span> pasos.',
      viento: 'Paso <span class="r">x0.5</span> durante <span class="r">2 a 4</span> turnos.',
      dado: 'Se tira al pisarlo: de <span class="r">-6</span> a <span class="y">+6</span> pasos.'
    },
    body: (boxes, q) => `
      <h3>1. LOS PONIS</h3>
      <p>Gana el primero en llegar a <span class="y">100 pasos</span>.</p>
      <p>Cada poni nace con un <span class="y">paso mínimo</span> (0 a 1) y un <span class="y">paso máximo</span> (1 a 2).
        En cada turno avanza un número al azar entre esos dos. Antes de arrancar se ven sus estadísticas.</p>
      <h3>2. LAS CAJAS SORPRESA</h3>
      <p>Cada poni tiene <span class="y">4 cajas</span> en su propio carril:</p>
      <ul>
        <li>En posiciones distintas a las de los demás (entre el paso 8 y el 93).</li>
        <li>Con <span class="y">4 tipos diferentes</span> entre sí, sorteados de estos 6.</li>
        <li>Ocultas hasta que las pisa: <img alt="caja ?" src="${q}" style="width:27px;height:24px;image-rendering:pixelated;vertical-align:middle"> nadie sabe qué tienen.</li>
      </ul>
      <div class="boxes">${boxes}</div>
      <h3>3. REGLAS DE LAS CAJAS</h3>
      <ul>
        <li>Al pisar una caja el poni <span class="y">salta</span>, se detiene en ella y se revela.</li>
        <li>Solo se activa <span class="y">una caja por turno</span>.</li>
        <li>Si una estrella o el dado lo lanzan más allá de otra caja, <span class="r">esa caja se pierde</span>.</li>
        <li>Turbo y viento <span class="y">no se suman</span>: el último reemplaza al anterior.</li>
        <li>Si retrocede, <span class="y">no vuelve a activar</span> cajas ya usadas.</li>
      </ul>
      <h3>4. CARRERA REÑIDA (REBUFO)</h3>
      <p>Si está activada: los de atrás van <span class="y">+20%</span> por cada paso que estén detrás del líder
        (hasta +150%), y el que va adelante corta el viento y avanza al <span class="r">70%</span>. Se puede apagar en la configuración.</p>
      <h3>5. ¿ES JUSTO?</h3>
      <p>Sí. Todo el azar sale del <span class="y">generador aleatorio criptográfico</span> de tu navegador,
        las estadísticas y cajas se sortean de nuevo en cada carrera y ningún carril tiene ventaja.
        <span class="y">Todos los nombres tienen exactamente la misma probabilidad</span> de salir elegidos.
        Las fotos y nombres nunca salen de tu dispositivo.</p>
      <h3>6. CONTROLES</h3>
      <p><span class="y">ESPACIO / ENTER</span> arrancar después de la presentación · <span class="y">ESPACIO</span> velocidad x3 ·
        <span class="y">M</span> sonido · <span class="y">F</span> pantalla completa · En resultados: <span class="y">R</span> revancha,
        <span class="y">C</span> configurar.</p>`
  }
};

let helpEl = null;
const BOX_KIND = { turbo: 'good', estrella: 'good', barro: 'bad', tropiezo: 'bad', viento: 'bad', dado: 'luck' };

function buildHelpUI() {
  helpEl = document.createElement('div');
  helpEl.id = 'spp-help';
  helpEl.className = 'spp-ov hidden';
  gameEl.appendChild(helpEl);
  helpEl.addEventListener('click', (e) => {
    if (e.target === helpEl) {
      hideHelp();
    }
  });
  helpEl.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' || e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      hideHelp();
    }
  });
}

function renderHelp() {
  if (!helpEl) {
    return;
  }
  const H_ = HELP[LANG];
  const boxesHtml = Object.keys(EFFECTS).map((t) =>
    '<div class="bx"><img alt="" src="' + boxIconURL(t) + '"><div><b>' + EFFECTS[t].name[LANG] +
    '<span class="tag ' + BOX_KIND[t] + '">' + H_.kind[BOX_KIND[t]] + '</span></b>' + H_.boxes[t] + '</div></div>').join('');
  helpEl.innerHTML = `
    <div class="box" role="dialog" aria-labelledby="spp-help-title">
      <h2 id="spp-help-title" style="text-align:center">${H_.title}</h2>
      ${H_.body(boxesHtml, boxIconURL('?'))}
      <div class="btns"><button id="spp-help-ok" type="button" class="primary">${H_.ok}</button></div>
    </div>`;
  document.getElementById('spp-help-ok').addEventListener('click', hideHelp);
}

function showHelp() {
  helpEl.classList.remove('hidden');
  document.getElementById('spp-help-ok').focus();
}

function hideHelp() {
  helpEl.classList.add('hidden');
  const b = document.getElementById('spp-helpbtn');
  if (b) {
    b.focus();
  }
}
