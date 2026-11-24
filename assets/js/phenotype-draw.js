/* phenotype-draw.js: a genome drawn as a paper cut-out doll.

   Pure functions, no DOM (they run in Node for the tests): the drawing is an SVG as text.

     svg(genome, options)  the doll, in a 200 x 200 box.

   options: { wear, blink, scheme, assemble, label }
     wear      what is worn, not inherited. Only a portrait of a person has it;
               a child never inherits it:
                 glasses    false, 'round' (also true), 'square' or 'shades'
                 frame      a hex colour for the glasses' frame instead of their own
                 beard      0 to 1, as phenotype-measure.js reads it
                 hair       'curls', 'tied' (pulled back into a bun) or 'receding'
                            (hair at the sides, a wisp on top); `curls: true` also works
                 beardColour, beardGrey    a hex colour for the beard; a grey chin
                 moustache, blush, freckles, earrings, lashes, lips    true or false
                 skin       a hex colour instead of the skin read from the photo
                 hat        'beanie', 'bow' or 'crown'
                 coat       a hex colour instead of the paper's own coat
                 outfit     'suit': a jacket open over a white shirt and a tie (`tie`: its colour)
     blink     the frame with the eyes closed.
     scheme    which paper and coat (a number); by default drawn from the genome.
     assemble  mark every piece with its order, so the page can drop them in one
               after another (phenotype.css).

   The doll is built the way cut-out animation is: a few flat pieces of coloured
   paper laid on top of each other (a big head on a small body, hair, eyes,
   brows), each casting a thin shadow on the piece under it, with a little paper
   grain over everything. Nothing has an outline.

   A relative gene is a z-score (0 = like most people). It is multiplied by
   CARICATURE and clamped to +-LIMIT before it moves anything: what is a little
   unusual in a face is drawn clearly unusual, which is what makes a doll
   recognisable, and the clamp keeps every doll inside the range where it is
   still friendly. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./phenotype-measure.js'), require('./phenotype-genome.js'));
  } else root.PhenotypeDraw = factory(root.PhenotypeMeasure, root.PhenotypeGenome);
})(typeof self !== 'undefined' ? self : this, function (M, G) {
  'use strict';

  var CARICATURE = 1.5, LIMIT = 2.2;
  var CX = 100, HEAD_Y = 80;
  // Beard read from a photo (0 to 1): under STUBBLE there is none, over FULL_BEARD it is solid.
  var STUBBLE = 0.35, FULL_BEARD = 0.5;

  // Backdrop, the ground the doll stands on, and its coat. The site's own colours.
  var SCHEMES = [
    { name: 'night', sky: '#26314a', ground: '#e8eef5', coat: '#f01626', trim: '#a00a1b' },
    { name: 'sun', sky: '#facc15', ground: '#fff4c2', coat: '#26314a', trim: '#151c2c' },
    { name: 'sky', sky: '#38bdf8', ground: '#f1f5f9', coat: '#f01626', trim: '#a00a1b' },
    { name: 'rose', sky: '#ff5fa2', ground: '#ffe1ee', coat: '#facc15', trim: '#ca8a04' },
    { name: 'red', sky: '#f01626', ground: '#ffe0e0', coat: '#26314a', trim: '#151c2c' },
    // Chosen by hand only (see DEFAULT_PAPERS): a deep blue.
    { name: 'ocean', sky: '#2a60ad', ground: '#dce8f8', coat: '#444444', trim: '#2a2a2a' }
  ];
  var DEFAULT_PAPERS = 5;   // a doll gets one of the first five on its own
  // Coats a doll can be given instead of its paper's own.
  var COATS = ['#f01626', '#26314a', '#facc15', '#17131c', '#f3ead2', '#1d4fd8', '#15803d', '#ff5fa2', '#7c4dff'];

  var counter = 0;
  function clamp(v, low, high) { return Math.min(high, Math.max(low, v)); }
  function n(v) { return Math.round(v * 10) / 10; }
  function hex(lab) { return M.hex(lab); }
  // A hex colour made darker, for the seam and buttons of a coat.
  function shade(colour, factor) {
    var v = parseInt(colour.slice(1), 16), out = '#';
    [16, 8, 0].forEach(function (shift) { out += ('0' + Math.round(((v >> shift) & 255) * factor).toString(16)).slice(-2); });
    return out;
  }
  function darker(lab, amount) { return [Math.max(0.1, lab[0] - amount), lab[1] * 1.05, lab[2] * 1.02 - 0.008]; }

  /* ---- the model: genes turned into the pieces' sizes and places ---------------- */

  function model(genome, wear) {
    var z = function (name) { return clamp(G.z(genome, name) * CARICATURE, -LIMIT, LIMIT); };
    var value = function (name) { return G.value(genome, name); };
    var m = {};

    // Head: a wide oval. A long face makes it a little narrower and taller, never tall.
    m.rx = 62 - 2.2 * z('faceAspect') + 1.2 * z('jawWidth');
    m.ry = 54 + 1.8 * z('faceAspect') + 0.8 * z('chinLength');
    m.top = HEAD_Y - m.ry;

    // Eyes: two big white discs.
    m.eyeR = clamp(14.5 + 1.4 * z('eyeSize'), 11.5, 17.5);
    m.eyeX = clamp(m.eyeR + 3.5 + 1.6 * z('eyeSpacing'), m.eyeR + 0.8, m.eyeR + 8);
    m.eyeY = HEAD_Y - 3 + 1.4 * z('eyeHeight');
    m.lid = clamp(0.03 - 0.12 * z('eyeOpen'), 0, 0.34);            // how much of the eye the lid covers
    m.eyeTilt = clamp(3 * z('eyeTilt'), -7, 7);

    // Brows: strips of paper.
    m.browY = m.eyeY - m.eyeR - 4.5 - clamp(1.6 * z('browGap'), -2, 4);
    m.browThick = clamp(4.6 + 1.1 * z('browThick'), 3, 7.5);
    m.browTilt = clamp(-4 + 3.5 * z('browTilt'), -11, 8);          // degrees; positive: inner end lower

    // Nose and mouth.
    m.noseY = m.eyeY + m.eyeR + 5 + clamp(1.3 * z('noseLength'), -2.5, 3);
    m.noseW = clamp(5 + 1.2 * z('noseWidth'), 3, 8);
    m.mouthY = Math.min(m.noseY + 10 + clamp(1.2 * z('mouthDrop'), -2, 3), HEAD_Y + m.ry - 9);
    m.mouthW = clamp(13 + 2.6 * z('mouthWidth'), 8, 20);          // half its width
    m.smile = clamp(4 + 2.4 * z('smile'), -3, 9);                 // how far the middle dips below the ends
    m.grin = z('smile') > 1.5;
    m.lipFull = clamp(z('lipFull'), -2, 2);

    // Hair.
    var amount = value('hairAmount');
    m.bald = amount < G.BALD;
    m.cropped = !m.bald && amount < G.THIN_HAIR;
    m.hairUp = m.cropped ? 1.5 : clamp(9 + 3.5 * z('hairTop'), 3, 20);
    m.hairOut = m.cropped ? 0.5 : clamp(3.5 + 2.2 * z('hairSide'), 0.5, 10);
    m.hairLength = clamp(value('hairLength'), 0, 1);
    m.fringe = clamp(value('fringe'), 0, 1);
    m.parting = clamp(value('parting'), -1, 1);
    // A hairstyle chosen by hand: what a photo's hair mask cannot tell.
    var style = wear.hair || (wear.curls ? 'curls' : '');
    m.tied = style === 'tied';           // pulled back into a bun: the forehead clear, nothing falling
    m.receding = style === 'receding';   // hair at the sides and a wisp on top
    if (m.tied) { m.bald = m.cropped = false; m.hairUp = Math.min(m.hairUp, 6); m.hairOut = Math.min(m.hairOut, 2); m.hairLength = 0; m.fringe = 0; }
    if (m.receding) { m.bald = m.cropped = false; m.hairUp = 1; m.hairLength = 0; }
    m.curly = !m.cropped && !m.bald && !m.tied && !m.receding && (style === 'curls' || (G.z(genome, 'hairTop') > 0.5 && m.hairLength < 0.45));
    m.curlsDown = style === 'curls' && !m.cropped && !m.bald && m.hairLength >= 0.3;   // curls chosen on long hair
    m.bulb = value('sprout') > 0.5;

    m.beard = wear.beard >= FULL_BEARD ? 2 : wear.beard >= STUBBLE ? 1 : 0;
    m.glasses = wear.glasses === true ? 'round' : wear.glasses || '';
    m.frame = wear.frame || '';
    m.lashes = !!wear.lashes;
    m.lips = !!wear.lips;
    return m;
  }

  /* ---- the pieces ------------------------------------------------------------------ */

  function ellipse(cx, cy, rx, ry, fill, extra) {
    return '<ellipse cx="' + n(cx) + '" cy="' + n(cy) + '" rx="' + n(rx) + '" ry="' + n(ry) + '" fill="' + fill + '"' + (extra || '') + '/>';
  }

  // The hair in front: everything inside the hair's oval and above the hairline.
  function hairFront(m, id, colour) {
    var rx = m.rx + m.hairOut, top = m.top - m.hairUp;
    var temple = m.cropped ? HEAD_Y - 22 : HEAD_Y - 6;           // where the hairline meets the sides
    var line = m.top + 15 + m.fringe * (m.browY - 6 - (m.top + 15));
    var px = CX + m.parting * m.rx * 0.45;
    var notch = m.fringe > 0.12 && !m.cropped ? Math.min(13, 4 + m.fringe * 16) : 0;
    var left = CX - rx - 2, right = CX + rx + 2;
    var path = 'M' + n(left) + ' ' + n(top - 4) + 'H' + n(right) + 'V' + n(temple) +
      'Q' + n(CX + m.rx * 0.78) + ' ' + n(line - 5) + ' ' + n(px + 9) + ' ' + n(line) +
      (notch ? 'L' + n(px) + ' ' + n(line - notch) + 'L' + n(px - 9) + ' ' + n(line) : 'L' + n(px - 9) + ' ' + n(line)) +
      'Q' + n(CX - m.rx * 0.78) + ' ' + n(line - 5) + ' ' + n(left) + ' ' + n(temple) + 'Z';
    var cy = (top + HEAD_Y + 20) / 2, ry = (HEAD_Y + 20 - top) / 2;
    return '<clipPath id="' + id + '-hair">' + ellipse(CX, cy, rx, ry, '#000') + '</clipPath>' +
      '<g clip-path="url(#' + id + '-hair)"><path d="' + path + '" fill="' + colour + '"/></g>';
  }

  // Curls: a row of paper discs along the top of the hair.
  function curls(m, colour) {
    var rx = m.rx + m.hairOut - 4, ry = m.ry + m.hairUp - 4, out = '';
    for (var i = 0; i <= 8; i++) {
      var angle = Math.PI * (1.08 + 0.84 * i / 8);
      out += '<circle cx="' + n(CX + rx * Math.cos(angle)) + '" cy="' + n(HEAD_Y - 2 + ry * Math.sin(angle)) + '" r="' + (i % 2 ? 10 : 11.5) + '" fill="' + colour + '"/>';
    }
    return out;
  }

  // Hair behind the head, for hair that passes the ears: a rounded sheet down to its length.
  function hairBack(m, colour) {
    if (m.bald || m.cropped || m.hairLength < 0.3) return '';
    var rx = m.rx + m.hairOut + 3, top = m.top - m.hairUp;
    var bottom = HEAD_Y + 30 + m.hairLength * 62;
    return '<path d="M' + n(CX - rx) + ' ' + n(HEAD_Y) + 'A' + n(rx) + ' ' + n(HEAD_Y - top) + ' 0 0 1 ' + n(CX + rx) + ' ' + n(HEAD_Y) +
      'V' + n(bottom - 12) + 'Q' + n(CX + rx) + ' ' + n(bottom) + ' ' + n(CX + rx - 14) + ' ' + n(bottom) +
      'H' + n(CX - rx + 14) + 'Q' + n(CX - rx) + ' ' + n(bottom) + ' ' + n(CX - rx) + ' ' + n(bottom - 12) + 'Z" fill="' + colour + '"/>';
  }

  // Curls chosen on long hair: discs down both edges of the sheet behind the head.
  function curlsBack(m, colour) {
    var rx = m.rx + m.hairOut + 3, bottom = HEAD_Y + 30 + m.hairLength * 62, out = '';
    for (var y = HEAD_Y - 4, i = 0; y <= bottom - 4; y += 13, i++) {
      [-1, 1].forEach(function (side) {
        out += '<circle cx="' + n(CX + side * (rx + (i % 2 ? 1 : -2))) + '" cy="' + n(y) + '" r="' + (i % 2 ? 9 : 10.5) + '" fill="' + colour + '"/>';
      });
    }
    for (var x = CX - rx + 10, j = 0; x <= CX + rx - 10; x += 14, j++) {
      out += '<circle cx="' + n(x) + '" cy="' + n(bottom - 2) + '" r="' + (j % 2 ? 9 : 10.5) + '" fill="' + colour + '"/>';
    }
    return out;
  }

  // A receding hairline: a tuft of hair behind the head at each side, from the temples to the ears...
  function hairSides(m, colour) {
    // Mostly hidden behind the head: only a narrow crescent shows at each side.
    return ellipse(CX - m.rx + 5, HEAD_Y - 8, 10, 26, colour) + ellipse(CX + m.rx - 5, HEAD_Y - 8, 10, 26, colour);
  }
  // ...and a thin wisp left on top.
  function hairWisp(m, id, colour) {
    return '<g clip-path="url(#' + id + '-head)" opacity="0.72">' + ellipse(CX, m.top - 3, m.rx * 0.6, 9, colour) + '</g>';
  }

  function eye(m, side, genome, blink, skin) {
    var x = CX + side * m.eyeX, y = m.eyeY, r = m.eyeR;
    var turn = ' transform="rotate(' + n(-side * m.eyeTilt) + ' ' + n(x) + ' ' + n(y) + ')"';
    if (blink) {
      return ellipse(x, y, r, r * 1.08, skin.shade, turn) +
        '<path d="M' + n(x - r + 3) + ' ' + n(y + 2) + 'Q' + n(x) + ' ' + n(y + 7) + ' ' + n(x + r - 3) + ' ' + n(y + 2) + '" fill="none" stroke="#2a1c1c" stroke-width="2.2" stroke-linecap="round"/>';
    }
    // The pupil sits a little toward the nose, as eyes looking at you do at this size.
    var px = x - side * r * 0.22, py = y + r * 0.08;
    var out = ellipse(x, y, r, r * 1.08, '#ffffff', turn) +
      // The iris and pupil are one group: the page moves it so the doll looks at the pointer.
      '<g class="ph-pupil" data-reach="' + n(r * 0.3) + '"><circle cx="' + n(px) + '" cy="' + n(py) + '" r="' + n(r * 0.5) + '" fill="' + hex(genome.colours.eye) + '"/>' +
      '<circle cx="' + n(px) + '" cy="' + n(py) + '" r="' + n(r * 0.27) + '" fill="#17131c"/>' +
      // A point of light: without it a large pupil stares.
      '<circle cx="' + n(px - r * 0.14) + '" cy="' + n(py - r * 0.16) + '" r="' + n(r * 0.1) + '" fill="#ffffff"/></g>';
    if (m.lashes) {
      // Three short strokes at the outer top of the eye.
      [28, 48, 68].forEach(function (degrees) {
        var t = degrees * Math.PI / 180, ex = x + side * r * Math.sin(t), ey = y - r * 1.08 * Math.cos(t);
        out += '<path d="M' + n(ex) + ' ' + n(ey) + 'L' + n(ex + side * 6 * Math.sin(t)) + ' ' + n(ey - 6 * Math.cos(t)) + '" stroke="#17131c" stroke-width="2.2" stroke-linecap="round"/>';
      });
    }
    if (m.lid > 0.02) {
      // A lid: a slice of skin-coloured paper over the top of the eye.
      var cut = y - r * 1.08 + 2 * r * 1.08 * m.lid;
      out += '<clipPath id="' + m.id + '-lid' + (side < 0 ? 'l' : 'r') + '"><rect x="' + n(x - r - 2) + '" y="' + n(y - r * 1.2 - 2) + '" width="' + n(2 * r + 4) + '" height="' + n(cut - (y - r * 1.2 - 2)) + '"/></clipPath>' +
        '<g clip-path="url(#' + m.id + '-lid' + (side < 0 ? 'l' : 'r') + ')">' + ellipse(x, y, r + 0.6, r * 1.08 + 0.6, skin.shade, turn) + '</g>';
    }
    return out;
  }

  function brow(m, side, colour) {
    var x = CX + side * m.eyeX, w = m.eyeR * 1.5;
    return '<rect x="' + n(x - w / 2) + '" y="' + n(m.browY - m.browThick / 2) + '" width="' + n(w) + '" height="' + n(m.browThick) + '" rx="' + n(m.browThick / 2) +
      '" fill="' + colour + '" transform="rotate(' + n(-side * m.browTilt) + ' ' + n(x) + ' ' + n(m.browY) + ')"/>';
  }

  function mouth(m, genome, bearded) {
    var y = m.mouthY, w = m.mouthW, ink = bearded ? hex([0.86, 0.04, 0.02]) : '#2a1c1c';
    if (m.grin) {
      // An open smile: a dark half-moon with a strip of teeth.
      var d = 'M' + n(CX - w) + ' ' + n(y - 2) + 'H' + n(CX + w) + 'Q' + n(CX + w) + ' ' + n(y + 11) + ' ' + CX + ' ' + n(y + 11) + 'Q' + n(CX - w) + ' ' + n(y + 11) + ' ' + n(CX - w) + ' ' + n(y - 2) + 'Z';
      return '<path d="' + d + '" fill="#3a1418"/><rect x="' + n(CX - w + 2.5) + '" y="' + n(y - 2) + '" width="' + n(2 * w - 5) + '" height="4" fill="#ffffff"/>';
    }
    var out = '';
    // Lips: drawn when they are full, or when lipstick is put on.
    var full = m.lips ? Math.max(m.lipFull, 1) : m.lipFull;
    if (full > 0.5 && !bearded) {
      out += '<path d="M' + n(CX - w * 0.72) + ' ' + n(y + m.smile * 0.55) + 'Q' + CX + ' ' + n(y + m.smile + 5 + full * 1.6) + ' ' + n(CX + w * 0.72) + ' ' + n(y + m.smile * 0.55) +
        'Q' + CX + ' ' + n(y + m.smile) + ' ' + n(CX - w * 0.72) + ' ' + n(y + m.smile * 0.55) + 'Z" fill="' + (m.lips ? '#d4526a' : hex(genome.colours.lips)) + '"/>';
    }
    return out + '<path d="M' + n(CX - w) + ' ' + n(y) + 'Q' + CX + ' ' + n(y + 2 * m.smile) + ' ' + n(CX + w) + ' ' + n(y) + '" fill="none" stroke="' + ink + '" stroke-width="2.6" stroke-linecap="round"/>';
  }

  // A beard: the lower face from under the nose, rising along the jaw to the ears.
  function beard(m, id, colour, opacity) {
    var under = m.noseY + 3.5, side = HEAD_Y + 12;
    var d = 'M' + n(CX - m.rx - 2) + ' ' + n(side) + 'Q' + n(CX - m.rx * 0.62) + ' ' + n(under + 9) + ' ' + n(CX - m.mouthW - 4) + ' ' + n(under) +
      'H' + n(CX + m.mouthW + 4) + 'Q' + n(CX + m.rx * 0.62) + ' ' + n(under + 9) + ' ' + n(CX + m.rx + 2) + ' ' + n(side) +
      'V' + n(HEAD_Y + m.ry + 4) + 'H' + n(CX - m.rx - 2) + 'Z';
    return '<g clip-path="url(#' + id + '-head)" opacity="' + opacity + '"><path d="' + d + '" fill="' + colour + '"/></g>';
  }

  // Glasses: round gold wire, square dark frames, or shades.
  function glasses(m) {
    var kind = m.glasses, r = m.eyeR + 3.2, out = '';
    var frame = m.frame || (kind === 'round' ? '#d4a02a' : '#17131c'), width = kind === 'round' ? 2.6 : 3.2;
    [-1, 1].forEach(function (side) {
      var x = CX + side * m.eyeX;
      if (kind === 'square') {
        out += '<rect x="' + n(x - r) + '" y="' + n(m.eyeY - r * 0.86) + '" width="' + n(2 * r) + '" height="' + n(r * 1.72) + '" rx="5" fill="#ffffff" fill-opacity="0.14" stroke="' + frame + '" stroke-width="' + width + '"/>';
      } else if (kind === 'shades') {
        out += '<circle cx="' + n(x) + '" cy="' + n(m.eyeY) + '" r="' + n(r) + '" fill="#17131c" fill-opacity="0.94" stroke="' + frame + '" stroke-width="' + width + '"/>' +
          '<path d="M' + n(x - r * 0.55) + ' ' + n(m.eyeY - r * 0.35) + 'L' + n(x - r * 0.15) + ' ' + n(m.eyeY - r * 0.62) + '" stroke="#ffffff" stroke-opacity="0.55" stroke-width="2.4" stroke-linecap="round"/>';
      } else {
        out += '<circle cx="' + n(x) + '" cy="' + n(m.eyeY) + '" r="' + n(r) + '" fill="#ffffff" fill-opacity="0.14" stroke="' + frame + '" stroke-width="' + width + '"/>';
      }
      out += '<path d="M' + n(x + side * r) + ' ' + n(m.eyeY - 2) + 'L' + n(CX + side * (m.rx - 1)) + ' ' + n(m.eyeY - 5) + '" stroke="' + frame + '" stroke-width="' + width + '" stroke-linecap="round"/>';
    });
    var gap = m.eyeX - r;
    return out + (gap > 0.6 ? '<path d="M' + n(CX - gap) + ' ' + n(m.eyeY - 2) + 'Q' + CX + ' ' + n(m.eyeY - 5) + ' ' + n(CX + gap) + ' ' + n(m.eyeY - 2) + '" fill="none" stroke="' + frame + '" stroke-width="' + width + '"/>' : '');
  }

  // A moustache: two leaves of paper under the nose.
  function moustache(m, colour) {
    var y = m.noseY + 5.5, w = Math.max(11, m.mouthW * 0.95);
    return '<path d="M' + CX + ' ' + n(y - 1.5) + 'Q' + n(CX - w * 0.5) + ' ' + n(y - 4.5) + ' ' + n(CX - w) + ' ' + n(y + 3.5) +
      'Q' + n(CX - w * 0.45) + ' ' + n(y + 5) + ' ' + CX + ' ' + n(y + 2) +
      'Q' + n(CX + w * 0.45) + ' ' + n(y + 5) + ' ' + n(CX + w) + ' ' + n(y + 3.5) +
      'Q' + n(CX + w * 0.5) + ' ' + n(y - 4.5) + ' ' + CX + ' ' + n(y - 1.5) + 'Z" fill="' + colour + '"/>';
  }

  // Hats sit on the hair. A beanie with a folded brim, a bow, or a paper crown.
  function hat(m, kind, colour, trim) {
    var top = m.bald ? m.top : m.top - m.hairUp, rx = m.rx + (m.bald ? 0 : m.hairOut) + 2;
    if (kind === 'beanie') {
      var brim = m.top + 23;
      return '<path d="M' + n(CX - rx) + ' ' + n(brim) + 'A' + n(rx) + ' ' + n(brim - top + 5) + ' 0 0 1 ' + n(CX + rx) + ' ' + n(brim) + 'Z" fill="' + colour + '"/>' +
        '<rect x="' + n(CX - rx - 2) + '" y="' + n(brim - 7) + '" width="' + n(2 * rx + 4) + '" height="13" rx="6.5" fill="' + trim + '"/>';
    }
    if (kind === 'bow') {
      var x = CX + m.rx * 0.5, y = top + 9;
      return '<g transform="rotate(18 ' + n(x) + ' ' + n(y) + ')"><path d="M' + n(x) + ' ' + n(y) + 'L' + n(x - 19) + ' ' + n(y - 11) + 'V' + n(y + 11) + 'Z" fill="' + colour + '"/>' +
        '<path d="M' + n(x) + ' ' + n(y) + 'L' + n(x + 19) + ' ' + n(y - 11) + 'V' + n(y + 11) + 'Z" fill="' + colour + '"/>' +
        '<circle cx="' + n(x) + '" cy="' + n(y) + '" r="5.5" fill="' + trim + '"/></g>';
    }
    if (kind === 'crown') {
      var base = top + 17, w = 30, d = 'M' + n(CX - w) + ' ' + n(base);
      [[-w, -19], [-w / 2, -8], [0, -23], [w / 2, -8], [w, -19]].forEach(function (pt) { d += 'L' + n(CX + pt[0]) + ' ' + n(base + pt[1]); });
      return '<path d="' + d + 'L' + n(CX + w) + ' ' + n(base) + 'Z" fill="#facc15"/>' +
        '<rect x="' + n(CX - w) + '" y="' + n(base - 6) + '" width="' + (2 * w) + '" height="7" fill="#ca8a04"/>' +
        '<circle cx="' + CX + '" cy="' + n(base - 2.5) + '" r="2.6" fill="#f01626"/><circle cx="' + n(CX - 16) + '" cy="' + n(base - 2.5) + '" r="2" fill="#38bdf8"/><circle cx="' + n(CX + 16) + '" cy="' + n(base - 2.5) + '" r="2" fill="#38bdf8"/>';
    }
    return '';
  }

  /* Which backdrop a doll gets when nobody chooses one: always the same for the same face. */
  function schemeIndex(genome) {
    var code = G.encode({ generation: 0, genes: genome.genes, colours: genome.colours }), h = 0;
    for (var i = 0; i < code.length; i++) h = (h * 31 + code.charCodeAt(i)) >>> 0;
    return h % DEFAULT_PAPERS;
  }

  function schemeOf(genome, options) {
    if (options.scheme != null) return SCHEMES[((options.scheme % SCHEMES.length) + SCHEMES.length) % SCHEMES.length];
    return SCHEMES[schemeIndex(genome)];
  }

  /* ---- the doll ---------------------------------------------------------------------- */

  function svg(genome, options) {
    options = options || {};
    var given = options.wear || {};
    var wear = { glasses: given.glasses || false, frame: given.frame, beard: given.beard || 0, curls: !!given.curls, hair: given.hair || '', lashes: given.lashes, lips: given.lips };
    var m = model(genome, wear);
    var id = m.id = 'ph' + (++counter);
    var scheme = schemeOf(genome, options);
    // A suit with no colour chosen is navy, whatever the paper's own coat is.
    var chosen = given.coat || (given.outfit === 'suit' ? '#26314a' : '');
    var coat = chosen || scheme.coat, trim = chosen ? shade(chosen, 0.62) : scheme.trim;
    // The skin as it was read, or the tone the reader chose instead.
    var skinLab = given.skin ? M.hexToOklab(given.skin) : genome.colours.skin;
    var skin = { lit: hex(skinLab), shade: hex(darker(skinLab, 0.07)) };
    var hair = hex(genome.colours.hair), hairDark = hex(darker(genome.colours.hair, 0.08));
    var browColour = genome.colours.hair[0] < skinLab[0] - 0.12 ? hex(darker(genome.colours.hair, 0.04)) : hex(darker(skinLab, 0.32));
    var beardColour = given.beardColour || hex(M.mixLab(skinLab, genome.colours.hair, 0.9));
    var paper = ' filter="url(#' + id + '-paper)"';
    // With `assemble`, each piece carries its place in the order, and the page's stylesheet
    // drops them in one after another.
    var order = 0;
    var piece = function (content) {
      if (!content) return '';
      return '<g' + paper + (options.assemble ? ' class="ph-piece" style="--ph-order:' + (order++) + '"' : '') + '>' + content + '</g>';
    };

    var defs = '<defs>' +
      // Each piece of paper casts a thin shadow on what is under it.
      '<filter id="' + id + '-paper" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="1.4" stdDeviation="0.9" flood-color="#000" flood-opacity="0.28"/></filter>' +
      // Paper grain: fine noise, drawn faintly over everything.
      '<filter id="' + id + '-grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="7"/>' +
      '<feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.1 0.62"/></filter>' +
      '<clipPath id="' + id + '-head">' + ellipse(CX, HEAD_Y, m.rx, m.ry, '#000') + '</clipPath>' +
      '<clipPath id="' + id + '-card"><rect width="200" height="200"/></clipPath></defs>';

    var body = '';
    // Backdrop and the ground, a low hill of paper.
    body += '<rect width="200" height="200" fill="' + scheme.sky + '"/>';
    body += piece('<path d="M-10 176Q100 158 210 176V210H-10Z" fill="' + scheme.ground + '"/>');
    // Hair behind everything.
    if (m.tied) body += piece('<circle cx="' + n(CX + m.rx * 0.42) + '" cy="' + n(m.top - 5) + '" r="15" fill="' + hairDark + '"/>');
    else if (m.receding) body += piece(hairSides(m, hairDark));
    else body += piece(hairBack(m, hairDark) + (m.curlsDown ? curlsBack(m, hairDark) : ''));
    // Feet, arms, coat, hands.
    body += piece(ellipse(CX - 19, 187, 21, 6.5, '#17131c') + ellipse(CX + 19, 187, 21, 6.5, '#17131c'));
    body += piece(ellipse(CX - 40, 153, 11, 22, coat, ' transform="rotate(14 ' + (CX - 40) + ' 153)"') +
      ellipse(CX + 40, 153, 11, 22, coat, ' transform="rotate(-14 ' + (CX + 40) + ' 153)"'));
    var torso = '<path d="M' + (CX - 31) + ' 122H' + (CX + 31) + 'L' + (CX + 40) + ' 178Q' + CX + ' 190 ' + (CX - 40) + ' 178Z" fill="' + coat + '"/>';
    if (given.outfit === 'suit') {
      // A suit: the jacket open in a V over a white shirt, a tie, the lapels and one button.
      var tie = given.tie || '#c1121f';
      body += piece(torso) +
        piece('<path d="M' + (CX - 16) + ' 122H' + (CX + 16) + 'L' + CX + ' 166Z" fill="#f8f8f5"/>') +
        piece('<path d="M' + (CX - 4) + ' 128H' + (CX + 4) + 'L' + (CX + 5.5) + ' 152L' + CX + ' 160L' + (CX - 5.5) + ' 152Z" fill="' + tie + '"/>') +
        '<path d="M' + (CX - 16) + ' 122L' + CX + ' 166L' + (CX + 16) + ' 122" fill="none" stroke="' + trim + '" stroke-width="2.4" stroke-linejoin="round"/>' +
        '<path d="M' + CX + ' 166V184" stroke="' + trim + '" stroke-width="2"/>' +
        '<circle cx="' + (CX + 5) + '" cy="174" r="2.2" fill="' + trim + '"/>';
    } else {
      body += piece(torso +
        '<path d="M' + CX + ' 126V184" stroke="' + trim + '" stroke-width="2"/>' +
        '<circle cx="' + (CX + 6) + '" cy="150" r="2.2" fill="' + trim + '"/><circle cx="' + (CX + 6) + '" cy="164" r="2.2" fill="' + trim + '"/>');
    }
    body += piece(ellipse(CX - 45, 171, 8.5, 8, skin.lit) + ellipse(CX + 45, 171, 8.5, 8, skin.lit));
    // The head and what is on it.
    if (m.curly) body += piece(curls(m, hairDark));
    body += piece(ellipse(CX, HEAD_Y, m.rx, m.ry, skin.lit));
    if (m.receding) body += hairWisp(m, id, hair);
    if (m.beard) body += beard(m, id, beardColour, m.beard === 2 ? 1 : 0.4);
    // A beard going grey at the chin.
    if (m.beard && given.beardGrey) body += '<g clip-path="url(#' + id + '-head)" opacity="0.5">' + ellipse(CX, m.mouthY + 14, m.mouthW * 0.8, 7.5, '#b9b3ab') + '</g>';
    body += '<path d="M' + n(CX - m.noseW) + ' ' + n(m.noseY) + 'Q' + CX + ' ' + n(m.noseY + 4.5) + ' ' + n(CX + m.noseW) + ' ' + n(m.noseY) + '" fill="none" stroke="' + skin.shade + '" stroke-width="2.4" stroke-linecap="round"/>';
    if (given.blush) body += ellipse(CX - m.eyeX - 4, m.eyeY + m.eyeR + 7, 8, 5, '#ff5f7e', ' opacity="0.38"') + ellipse(CX + m.eyeX + 4, m.eyeY + m.eyeR + 7, 8, 5, '#ff5f7e', ' opacity="0.38"');
    if (given.freckles) {
      [[-1, 0, 0], [-1, 5, 2.5], [-1, -5, 2.5], [1, 0, 0], [1, 5, 2.5], [1, -5, 2.5]].forEach(function (f) {
        body += '<circle cx="' + n(CX + f[0] * (m.eyeX + 3) + f[1]) + '" cy="' + n(m.eyeY + m.eyeR + 5 + f[2]) + '" r="1.3" fill="' + skin.shade + '"/>';
      });
    }
    if (m.beard === 2 && !m.grin) {
      // On a full beard a thin line gets lost: the closed mouth is a small lip of rose paper.
      var mw = m.mouthW, my = m.mouthY;
      body += '<path d="M' + n(CX - mw) + ' ' + n(my) + 'Q' + CX + ' ' + n(my + 2 * m.smile + 5) + ' ' + n(CX + mw) + ' ' + n(my) + 'Q' + CX + ' ' + n(my + 2 * m.smile - 1) + ' ' + n(CX - mw) + ' ' + n(my) + 'Z" fill="#d98a86"/>';
    } else body += mouth(m, genome, m.beard === 2);
    if (given.moustache) body += piece(moustache(m, beardColour));
    body += piece(eye(m, -1, genome, options.blink, skin) + eye(m, 1, genome, options.blink, skin));
    if (!m.bald && !m.receding) body += piece(hairFront(m, id, hair));
    body += piece(brow(m, -1, browColour) + brow(m, 1, browColour));
    if (given.earrings) body += piece('<circle cx="' + n(CX - m.rx + 1) + '" cy="' + n(HEAD_Y + 17) + '" r="4" fill="#facc15"/><circle cx="' + n(CX + m.rx - 1) + '" cy="' + n(HEAD_Y + 17) + '" r="4" fill="#facc15"/>');
    if (m.glasses) body += piece(glasses(m));
    if (given.hat) body += piece(hat(m, given.hat, coat, trim));
    if (m.bulb) {
      var crown = m.bald ? m.top : m.top - m.hairUp;
      body += piece('<rect x="' + (CX - 1.6) + '" y="' + n(crown - 11) + '" width="3.2" height="13" fill="#94a3b8"/>' +
        '<circle cx="' + CX + '" cy="' + n(crown - 14) + '" r="6" fill="#ff3838"/><circle cx="' + (CX - 2) + '" cy="' + n(crown - 16) + '" r="1.6" fill="#ffd0d0"/>');
    }
    body += '<rect width="200" height="200" filter="url(#' + id + '-grain)" opacity="0.26" style="mix-blend-mode:multiply"/>';

    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" role="img" aria-label="' +
      (options.label || 'A paper cut-out doll') + '">' + defs + '<g clip-path="url(#' + id + '-card)">' + body + '</g></svg>';
  }

  return { SCHEMES: SCHEMES, STUBBLE: STUBBLE, FULL_BEARD: FULL_BEARD, CARICATURE: CARICATURE, LIMIT: LIMIT, COATS: COATS, model: model, schemeIndex: schemeIndex, svg: svg };
});
