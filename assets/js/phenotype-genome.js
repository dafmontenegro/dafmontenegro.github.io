/* phenotype-genome.js: the doll's genome, and how it is inherited.

   Pure functions, no DOM (they run in Node for the tests).

   A genome is 37 numbers in seven groups, plus a generation count:

     face   faceAspect jawWidth chinWidth chinLength
     eyes   eyeSpacing eyeSize eyeOpen eyeTilt eyeHeight + the iris colour
     brows  browGap browTilt browThick
     nose   noseLength noseWidth
     mouth  mouthWidth mouthDrop lipFull smile
     hair   hairTop hairSide hairLength fringe parting hairAmount sprout + the hair colour
     skin   the skin colour and the lip colour

   Each gene is one number between 0 and 1, stored in one byte:

   * a *relative* gene (20 of them) says where the face stands among other
     faces: the measurement's z-score (how many standard deviations from the
     population mean, see population.json), clamped to +-3 and mapped onto
     0..1, so 0.5 is "like most people";
   * an *absolute* gene (5) is the measurement itself on a fixed scale (how
     much of the forehead the fringe covers, say), because "half covered" means
     the same on every face;
   * a colour (4) is three numbers, its OKLab coordinates.

   So a genome is 40 bytes: a version, the generation (two bytes) and the 37
   numbers. Written in base64url it is 54 characters of text, which is how
   a page writes a doll in its source. It is a description of a drawing, coarse on purpose: it cannot be
   turned back into the photo, and it is not a face print. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./phenotype-measure.js'));
  else root.PhenotypeGenome = factory(root.PhenotypeMeasure);
})(typeof self !== 'undefined' ? self : this, function (M) {
  'use strict';

  var VERSION = 1;
  var Z_LIMIT = 3;
  // Hair area, in face areas: under BALD there is none to draw, under THIN_HAIR it is a close crop.
  var BALD = 0.06, THIN_HAIR = 0.22;
  // OKLab distance between the scalp patch and the skin above which a hairless head counts as cropped, not bald.
  var CROPPED_SCALP = 0.12;

  // [name, group, kind, low, high]: `kind` z = relative, a = absolute on [low, high].
  var SCALARS = [
    ['faceAspect', 'face', 'z'], ['jawWidth', 'face', 'z'], ['chinWidth', 'face', 'z'], ['chinLength', 'face', 'z'],
    ['eyeSpacing', 'eyes', 'z'], ['eyeSize', 'eyes', 'z'], ['eyeOpen', 'eyes', 'z'], ['eyeTilt', 'eyes', 'z'],
    ['eyeHeight', 'eyes', 'z'],
    ['browGap', 'brows', 'z'], ['browTilt', 'brows', 'z'], ['browThick', 'brows', 'z'],
    ['noseLength', 'nose', 'z'], ['noseWidth', 'nose', 'z'],
    ['mouthWidth', 'mouth', 'z'], ['mouthDrop', 'mouth', 'z'], ['lipFull', 'mouth', 'z'], ['smile', 'mouth', 'z'],
    ['hairTop', 'hair', 'z'], ['hairSide', 'hair', 'z'],
    ['hairLength', 'hair', 'a', 0, 1], ['fringe', 'hair', 'a', 0, 1], ['parting', 'hair', 'a', -1, 1],
    ['hairAmount', 'hair', 'a', 0, 1.5], ['sprout', 'hair', 'a', 0, 1]
  ];
  var COLOURS = [['eye', 'eyes'], ['hair', 'hair'], ['skin', 'skin'], ['lips', 'skin']];
  var GROUPS = ['face', 'eyes', 'brows', 'nose', 'mouth', 'hair', 'skin'];
  // What each group is called when the page says what the doll got from whom.
  var GROUP_WORDS = { face: 'face shape', eyes: 'eyes', brows: 'eyebrows', nose: 'nose', mouth: 'mouth',
    hair: 'hair', skin: 'skin' };

  function clamp(v, low, high) { return Math.min(high, Math.max(low, v)); }

  /* ---- colours made fit for a drawing -------------------------------------
     A colour sampled from a photo carries the photo's light. Each one is pulled
     into the range where it still reads as what it is in a flat drawing. */

  function polar(lab) { return { L: lab[0], C: Math.hypot(lab[1], lab[2]), h: Math.atan2(lab[2], lab[1]) }; }
  function cartesian(p) { return [p.L, p.C * Math.cos(p.h), p.C * Math.sin(p.h)]; }
  var DEG = Math.PI / 180;

  function skinColour(lab) {
    if (!lab) return M.hexToOklab('#c99672');
    var p = polar(lab);
    p.L = clamp(p.L, 0.36, 0.90);
    // Skin lies in a narrow wedge of hue (reds to yellows) with moderate colour;
    // outside it the sample is a coloured light or a filter, not the skin.
    p.h = clamp(p.h, 30 * DEG, 78 * DEG);
    // A third of the way toward a warm 55 degrees: photos of faces lean pink under
    // daylight and flash, and a flat pink reads as sunburn on a doll.
    p.h += (55 * DEG - p.h) * 0.33;
    p.C = clamp(p.C * 1.1, 0.045, 0.09);   // never ashen, never orange
    return cartesian(p);
  }
  function hairColour(lab) {
    if (!lab) return M.hexToOklab('#4a362b');
    var p = polar(lab);
    p.L = clamp(p.L, 0.20, 0.93);   // never pure black: the drawing's own lines must still show
    p.C = clamp(p.C, 0, 0.19);
    return cartesian(p);
  }
  function eyeColour(lab) {
    if (!lab) return M.hexToOklab('#5b3a26');
    var p = polar(lab);
    // An iris in a photo is small and dark; lifted and strengthened so its colour shows at doll size.
    p.L = clamp(p.L * 1.25 + 0.12, 0.30, 0.68);
    // Warm irises (browns, hue 20 to 100 degrees) keep a modest colour, or brown turns
    // red; cool ones (greens, greys, blues) may be stronger, they are what gets noticed.
    var warm = p.h > 20 * DEG && p.h < 100 * DEG;
    if (warm) { p.h = clamp(p.h, 48 * DEG, 100 * DEG); p.L = Math.min(p.L, 0.5); }
    p.C = clamp(p.C * 1.5 + 0.015, 0.03, warm ? 0.075 : 0.13);
    return cartesian(p);
  }
  function lipColour(lab, skin) {
    // Halfway between the sampled lips and a rosier, slightly darker skin: lipstick
    // still shows, a washed-out sample still gives lips.
    var rosy = [skin[0] - 0.07, skin[1] + 0.035, skin[2] - 0.005];
    return lab ? M.mixLab(rosy, [clamp(lab[0], 0.3, 0.85), clamp(lab[1], 0, 0.16), clamp(lab[2], -0.03, 0.08)], 0.5) : rosy;
  }

  /* ---- from a measurement -------------------------------------------------- */

  // Absolute genes from the raw measurements (see phenotype-measure.js for their units).
  function absolute(name, traits) {
    switch (name) {
      // The hair's lowest point, from the eyes down, as a share of the room the picture
      // gives it: 0 ends at the eyes, 1 runs off the picture.
      case 'hairLength':
        if (traits.hairLength == null) return 0.3;
        // Hair that runs off the bottom of the picture has an unknown length: it is drawn long
        // (past the shoulders), not as long as hair can be.
        var share = traits.hairLength / Math.max(traits.hairRoom, 1e-6);
        return share >= 0.97 ? 0.8 : share;
      case 'fringe': return traits.fringe == null ? 0.2 : traits.fringe;
      case 'parting': return traits.parting == null ? 0 : traits.parting;
      // Hair area in face areas (the face's width times its height).
      case 'hairAmount': return traits.hairAmount == null ? 0.7 : traits.hairAmount;
      // The resident's own gene: no photo has it.
      case 'sprout': return 0;
    }
    return 0;
  }

  function fromMeasurement(measurement, population) {
    var genes = {};
    SCALARS.forEach(function (gene) {
      var name = gene[0], value;
      if (gene[2] === 'z') {
        var stats = population.traits[name];
        var raw = measurement.traits[name];
        var z = raw == null || !stats ? 0 : (raw - stats.mean) / stats.std;
        value = (clamp(z, -Z_LIMIT, Z_LIMIT) + Z_LIMIT) / (2 * Z_LIMIT);
      } else {
        value = (absolute(name, measurement.traits) - gene[3]) / (gene[4] - gene[3]);
      }
      genes[name] = clamp(value, 0, 1);
    });
    var skin = skinColour(measurement.colours.skin);
    var hair = measurement.colours.hair;
    // A cropped head: the segmenter found (almost) no hair, yet the scalp is not skin-coloured.
    // It is drawn as a close crop in the scalp's colour.
    if (genes.hairAmount * 1.5 < THIN_HAIR && measurement.traits.scalp > CROPPED_SCALP && measurement.colours.scalp) {
      genes.hairAmount = (BALD + THIN_HAIR) / 2 / 1.5;
      hair = measurement.colours.scalp;
      genes.fringe = 0; genes.hairLength = 0;
    }
    return {
      generation: 0, genes: genes,
      colours: { skin: skin, hair: hairColour(hair), eye: eyeColour(measurement.colours.iris),
        lips: lipColour(measurement.colours.lips, skin) }
    };
  }

  /* A relative gene as a z-score again, for the drawing. */
  function z(genome, name) { return genome.genes[name] * 2 * Z_LIMIT - Z_LIMIT; }
  /* An absolute gene on its own scale. */
  function value(genome, name) {
    for (var i = 0; i < SCALARS.length; i++) {
      if (SCALARS[i][0] === name) return SCALARS[i][3] + genome.genes[name] * (SCALARS[i][4] - SCALARS[i][3]);
    }
    return 0;
  }

  /* ---- bytes and the link -------------------------------------------------- */

  var LAB_RANGE = [[0, 1], [-0.4, 0.4], [-0.4, 0.4]];

  function toBytes(genome) {
    var bytes = [VERSION, (genome.generation >> 8) & 255, genome.generation & 255];
    SCALARS.forEach(function (gene) { bytes.push(Math.round(clamp(genome.genes[gene[0]], 0, 1) * 255)); });
    COLOURS.forEach(function (colour) {
      var lab = genome.colours[colour[0]];
      for (var k = 0; k < 3; k++) {
        bytes.push(Math.round(clamp((lab[k] - LAB_RANGE[k][0]) / (LAB_RANGE[k][1] - LAB_RANGE[k][0]), 0, 1) * 255));
      }
    });
    return bytes;
  }

  function fromBytes(bytes) {
    if (!bytes || bytes[0] !== VERSION || bytes.length !== 3 + SCALARS.length + 3 * COLOURS.length) return null;
    var genome = { generation: (bytes[1] << 8) | bytes[2], genes: {}, colours: {} };
    var at = 3;
    SCALARS.forEach(function (gene) { genome.genes[gene[0]] = bytes[at++] / 255; });
    COLOURS.forEach(function (colour) {
      genome.colours[colour[0]] = [0, 1, 2].map(function (k) {
        return LAB_RANGE[k][0] + bytes[at++] / 255 * (LAB_RANGE[k][1] - LAB_RANGE[k][0]);
      });
    });
    return genome;
  }

  var ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

  function encode(genome) {
    var bytes = toBytes(genome), text = '';
    for (var i = 0; i < bytes.length; i += 3) {
      var n = (bytes[i] << 16) | ((bytes[i + 1] || 0) << 8) | (bytes[i + 2] || 0);
      text += ALPHABET[(n >> 18) & 63] + ALPHABET[(n >> 12) & 63];
      if (i + 1 < bytes.length) text += ALPHABET[(n >> 6) & 63];
      if (i + 2 < bytes.length) text += ALPHABET[n & 63];
    }
    return text;
  }

  function decode(text) {
    if (typeof text !== 'string' || !/^[A-Za-z0-9_-]+$/.test(text)) return null;
    var bytes = [];
    for (var i = 0; i < text.length; i += 4) {
      var c = [0, 1, 2, 3].map(function (k) { return i + k < text.length ? ALPHABET.indexOf(text[i + k]) : -1; });
      var n = (c[0] << 18) | ((c[1] < 0 ? 0 : c[1]) << 12) | ((c[2] < 0 ? 0 : c[2]) << 6) | (c[3] < 0 ? 0 : c[3]);
      bytes.push((n >> 16) & 255);
      if (c[2] >= 0) bytes.push((n >> 8) & 255);
      if (c[3] >= 0) bytes.push(n & 255);
    }
    return fromBytes(bytes);
  }

  /* ---- inheritance ---------------------------------------------------------
     The child takes whole feature groups, as a family says "your eyes, his
     nose": of the six groups with a shape (face, eyes, brows, nose, mouth,
     hair), three come from each parent, whole, colour included (the iris with
     the eyes, the hair colour with the hair). Which three is drawn by a small
     random generator seeded with both genomes, so the same two parents always
     have the same child. The skin and the lips are not picked: they are the
     midpoint of the parents' colours, in OKLab. */

  function hash(text) {  // FNV-1a, 32 bits
    var h = 0x811c9dc5;
    for (var i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 0x01000193); }
    return h >>> 0;
  }
  function generator(seed) {  // mulberry32
    return function () {
      seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* `again` (a number, optional) draws another child of the same two parents: a sibling. */
  function inherit(doll, visitor, again) {
    var random = generator(hash(encode(doll) + '+' + encode(visitor) + (again ? '#' + again : '')));
    var picked = GROUPS.filter(function (g) { return g !== 'skin'; });
    for (var i = picked.length - 1; i > 0; i--) {  // Fisher-Yates
      var j = Math.floor(random() * (i + 1));
      var swap = picked[i]; picked[i] = picked[j]; picked[j] = swap;
    }
    var from = { skin: 'both' };
    picked.forEach(function (group, index) { from[group] = index < picked.length / 2 ? 'visitor' : 'doll'; });
    var child = { generation: doll.generation + 1, genes: {}, colours: {} };
    SCALARS.forEach(function (gene) {
      child.genes[gene[0]] = (from[gene[1]] === 'visitor' ? visitor : doll).genes[gene[0]];
    });
    COLOURS.forEach(function (colour) {
      var name = colour[0], group = colour[1];
      child.colours[name] = group === 'skin'
        ? M.mixLab(doll.colours[name], visitor.colours[name], 0.5)
        : (from[group] === 'visitor' ? visitor : doll).colours[name].slice();
    });
    return { child: child, from: from };
  }

  /* "your eyes, your nose and your hair" */
  function inheritedWords(from, who) {
    var words = GROUPS.filter(function (g) { return from[g] === who; }).map(function (g) { return GROUP_WORDS[g]; });
    if (words.length < 2) return words.join('');
    return words.slice(0, -1).join(', ') + ' and ' + words[words.length - 1];
  }

  /* ---- the resident: generation 0 ------------------------------------------
     Drawn by hand, not measured from anyone. It is a small robot, a cousin of
     Roz, the site's assistant: pale metal, no hair, cyan eyes, a red bulb on
     its head. It starts as nobody, so what it later takes from people shows. */
  function resident() {
    var genes = {};
    SCALARS.forEach(function (gene) { genes[gene[0]] = gene[2] === 'z' ? 0.5 : 0; });
    var set = function (name, zScore) { genes[name] = (zScore + Z_LIMIT) / (2 * Z_LIMIT); };
    set('faceAspect', -1.2); set('jawWidth', 1.6); set('chinWidth', 1.2); set('chinLength', -0.6);
    set('eyeSpacing', 0.4); set('eyeSize', 1.2); set('eyeOpen', 0.6);
    set('browThick', -0.5); set('browGap', 1.5); set('noseLength', -0.9); set('noseWidth', -0.6);
    set('mouthWidth', -0.2); set('smile', 0.9); set('lipFull', -0.8);
    genes.sprout = 1;
    return {
      generation: 0, genes: genes,
      colours: { skin: M.hexToOklab('#dfe7ee'), hair: M.hexToOklab('#94a3b8'), eye: M.hexToOklab('#22c7e8'),
        lips: M.hexToOklab('#b6c2d1') }
    };
  }

  return {
    VERSION: VERSION, BALD: BALD, THIN_HAIR: THIN_HAIR, SCALARS: SCALARS, COLOURS: COLOURS, GROUPS: GROUPS, GROUP_WORDS: GROUP_WORDS,
    fromMeasurement: fromMeasurement, z: z, value: value, encode: encode, decode: decode,
    inherit: inherit, inheritedWords: inheritedWords, resident: resident,
    skinColour: skinColour, hairColour: hairColour, eyeColour: eyeColour, lipColour: lipColour
  };
});
