/* phenotype-measure.js: a face as a handful of measurements.

   Pure functions, no DOM: they run the same in the browser and in Node (where the
   tests and the population statistics use them).

   measure(points, pixels, hair) -> {traits, colours, pose, worn}

     points  478 [x, y, z] landmarks of one face (MediaPipe Face Mesh order), in
             pixels of an upright crop of the face (FaceKit.align, scale 1.5).
     pixels  {width, height, data}: that crop's RGBA bytes (an ImageData).
     hair    {width, height, data}: 1 where the hair segmenter saw hair, or null.

   Every length is first taken on the face turned to look straight ahead
   (`frontal`), and divided by the face's own width or height, so the numbers
   do not depend on how large the face is in the photo, how far it was, or (as
   far as the landmarks' depth allows) which way it was turned.

   The traits are raw ratios here. Turning them into "more than most people /
   less than most people" needs a population to compare with; that happens in
   phenotype-genome.js with the statistics in assets/data/phenotype/population.json. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.PhenotypeMeasure = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* ---- colour: sRGB <-> OKLab (Björn Ottosson, 2020) ----------------------
     Colours are averaged and mixed in OKLab, where equal steps look equal and
     the midpoint of two colours is the colour the eye expects, not a muddy one. */

  function toLinear(c) {
    c /= 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  }
  function fromLinear(c) {
    c = c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
    return Math.round(Math.min(1, Math.max(0, c)) * 255);
  }
  function rgbToOklab(r, g, b) {
    r = toLinear(r); g = toLinear(g); b = toLinear(b);
    var l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
    var m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
    var s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
    return [0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
      1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
      0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s];
  }
  function oklabToRgb(lab) {
    var l = Math.pow(lab[0] + 0.3963377774 * lab[1] + 0.2158037573 * lab[2], 3);
    var m = Math.pow(lab[0] - 0.1055613458 * lab[1] - 0.0638541728 * lab[2], 3);
    var s = Math.pow(lab[0] - 0.0894841775 * lab[1] - 1.2914855480 * lab[2], 3);
    return [fromLinear(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
      fromLinear(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
      fromLinear(-0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s)];
  }
  function hex(lab) {
    var c = oklabToRgb(lab);
    return '#' + c.map(function (v) { return (v < 16 ? '0' : '') + v.toString(16); }).join('');
  }
  function hexToOklab(text) {
    var n = parseInt(text.replace('#', ''), 16);
    return rgbToOklab((n >> 16) & 255, (n >> 8) & 255, n & 255);
  }
  function mixLab(a, b, t) {
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  }

  function median(values) {
    if (!values.length) return NaN;
    var sorted = Array.prototype.slice.call(values).sort(function (a, b) { return a - b; });
    var mid = sorted.length >> 1;
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  /* The colour of the pixels that pass `keep(x, y)` inside a box, in OKLab.

     With `rank` 0.5 it is the median of each coordinate: a highlight, a shadow
     or a strand of hair across the patch does not drag it, as it would a mean.

     With a higher `rank` it is the colour at that rank of *lightness*: the
     pixels are ordered from dark to light, the one at `rank` gives the
     lightness, and the hue comes from the median of the pixels within 0.04 of
     it. That is how skin and irises are read: what a person sees as "the colour
     of the skin" is its lit part, not the average with the shadow under the
     cheekbone, the rim of the glasses or the lashes.

     Returns null when fewer than 12 pixels pass. */
  function sampleColour(pixels, x0, y0, x1, y1, keep, rank, into) {
    var L = into ? into.L : [], A = into ? into.A : [], B = into ? into.B : [];
    x0 = Math.max(0, Math.floor(x0)); y0 = Math.max(0, Math.floor(y0));
    x1 = Math.min(pixels.width - 1, Math.ceil(x1)); y1 = Math.min(pixels.height - 1, Math.ceil(y1));
    for (var y = y0; y <= y1; y++) {
      for (var x = x0; x <= x1; x++) {
        if (keep && !keep(x, y)) continue;
        var i = (y * pixels.width + x) * 4;
        var lab = rgbToOklab(pixels.data[i], pixels.data[i + 1], pixels.data[i + 2]);
        L.push(lab[0]); A.push(lab[1]); B.push(lab[2]);
      }
    }
    return into ? null : rankedColour({ L: L, A: A, B: B }, rank);
  }

  function rankedColour(set, rank) {
    var L = set.L, A = set.A, B = set.B;
    if (L.length < 12) return null;
    if (rank == null || rank === 0.5) return [median(L), median(A), median(B)];
    var sorted = L.slice().sort(function (a, b) { return a - b; });
    var level = sorted[Math.min(sorted.length - 1, Math.floor(rank * sorted.length))];
    var nearA = [], nearB = [];
    for (var i = 0; i < L.length; i++) {
      if (Math.abs(L[i] - level) <= 0.04) { nearA.push(A[i]); nearB.push(B[i]); }
    }
    return [level, median(nearA), median(nearB)];
  }

  function inDisc(centre, radius) {
    return function (x, y) { return Math.hypot(x - centre[0], y - centre[1]) <= radius; };
  }

  function insidePolygon(polygon, x, y) {
    var inside = false;
    for (var i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      var a = polygon[i], b = polygon[j];
      if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) inside = !inside;
    }
    return inside;
  }

  function polygonColour(pixels, polygon) {
    var xs = polygon.map(function (p) { return p[0]; }), ys = polygon.map(function (p) { return p[1]; });
    return sampleColour(pixels, Math.min.apply(null, xs), Math.min.apply(null, ys),
      Math.max.apply(null, xs), Math.max.apply(null, ys),
      function (x, y) { return insidePolygon(polygon, x + 0.5, y + 0.5); });
  }

  /* ---- the face turned to look straight ahead ------------------------------
     MediaPipe gives each point a depth z on the scale of x. Three points fix the
     head's own axes: the outer corners of the eyes give "across", the forehead
     and the chin give "down", and their cross product "out of the face". Writing
     every point in those axes undoes the head's turn, tilt and nod, so a width
     measured there is the face's width, not its width as seen from the side. */

  function sub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
  function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
  function crossProduct(a, b) {
    return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  }
  function unit(a) { var n = Math.sqrt(dot(a, a)) || 1; return [a[0] / n, a[1] / n, a[2] / n]; }

  var EYE_OUTER_LEFT = 33, EYE_OUTER_RIGHT = 263, FOREHEAD = 10, CHIN = 152;

  function headAxes(points) {
    var across = unit(sub(points[EYE_OUTER_RIGHT], points[EYE_OUTER_LEFT]));
    var roughDown = sub(points[CHIN], points[FOREHEAD]);
    var out = unit(crossProduct(across, roughDown));
    var down = crossProduct(out, across);
    return { across: across, down: down, out: out };
  }

  function frontal(points) {
    var axes = headAxes(points);
    var origin = points[168];  // the bridge of the nose, between the eyes
    return points.map(function (p) {
      var d = sub(p, origin);
      return [dot(d, axes.across), dot(d, axes.down), dot(d, axes.out)];
    });
  }

  /* How far the head is turned (yaw) and nodded (pitch), in degrees, read from
     the same axes. Used to tell the reader when a photo is too far from frontal,
     and to test that the traits do not depend on it. */
  function pose(points) {
    var axes = headAxes(points);
    return {
      yaw: Math.atan2(axes.across[2], axes.across[0]) * 180 / Math.PI,
      pitch: Math.atan2(axes.down[2], axes.down[1]) * 180 / Math.PI,
      roll: Math.atan2(axes.across[1], axes.across[0]) * 180 / Math.PI
    };
  }

  /* ---- the measurements ---------------------------------------------------- */

  // Brow rows, outer end to inner end. Left = image-left.
  var BROW_UPPER_LEFT = [70, 63, 105, 66, 107], BROW_LOWER_LEFT = [46, 53, 52, 65, 55];
  var BROW_UPPER_RIGHT = [300, 293, 334, 296, 336], BROW_LOWER_RIGHT = [276, 283, 282, 295, 285];
  var LOWER_LIP = [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 308, 324, 318, 402, 317, 14, 87, 178, 88, 95, 78];

  /* `asSeen` skips the turn to frontal and measures the points as the camera saw them.
     Only the comparison of the two uses it (scripts/phenotype/statistics.mjs). */
  function geometry(points, asSeen) {
    var q = asSeen ? points : frontal(points);
    var X = function (i) { return q[i][0]; }, Y = function (i) { return q[i][1]; };
    var faceWidth = Math.abs(X(454) - X(234));
    var faceHeight = Y(152) - Y(10);
    var widthOf = function (a, b) { return Math.abs(X(b) - X(a)); };
    var mean = function (a, b) { return (a + b) / 2; };

    var eyeWidthLeft = widthOf(33, 133), eyeWidthRight = widthOf(362, 263);
    var browTilt = function (lower) {  // positive: the inner end sits lower than the outer (a frown line)
      var outer = q[lower[0]], inner = q[lower[4]];
      return (inner[1] - outer[1]) / Math.abs(inner[0] - outer[0]);
    };
    var browThick = function (upper, lower) {
      var total = 0;
      for (var i = 1; i < 4; i++) total += Math.abs(q[lower[i]][1] - q[upper[i]][1]);
      return total / 3 / faceHeight;
    };
    return {
      faceAspect: faceHeight / faceWidth,
      jawWidth: widthOf(172, 397) / faceWidth,
      chinWidth: widthOf(150, 379) / faceWidth,
      chinLength: (Y(152) - Y(17)) / faceHeight,
      eyeSpacing: widthOf(133, 362) / faceWidth,
      eyeSize: mean(eyeWidthLeft, eyeWidthRight) / faceWidth,
      eyeOpen: mean((Y(145) - Y(159)) / eyeWidthLeft, (Y(374) - Y(386)) / eyeWidthRight),
      // positive: the outer corner sits higher than the inner one (upturned eyes)
      eyeTilt: mean((Y(133) - Y(33)) / eyeWidthLeft, (Y(362) - Y(263)) / eyeWidthRight),
      eyeHeight: (mean(Y(33), Y(263)) - Y(10)) / faceHeight,
      browGap: mean(Y(159) - Y(52), Y(386) - Y(282)) / faceHeight,
      browTilt: mean(browTilt(BROW_LOWER_LEFT), browTilt(BROW_LOWER_RIGHT)),
      browThick: mean(browThick(BROW_UPPER_LEFT, BROW_LOWER_LEFT), browThick(BROW_UPPER_RIGHT, BROW_LOWER_RIGHT)),
      noseLength: (Y(2) - Y(168)) / faceHeight,
      noseWidth: widthOf(129, 358) / faceWidth,
      mouthWidth: widthOf(61, 291) / faceWidth,
      mouthDrop: (mean(Y(13), Y(14)) - Y(2)) / faceHeight,
      lipFull: ((Y(13) - Y(0)) + (Y(17) - Y(14))) / faceHeight,
      // positive: the corners sit above the middle of the mouth (a smile)
      smile: (mean(Y(13), Y(14)) - mean(Y(61), Y(291))) / faceWidth
    };
  }

  /* Hair, read from the segmenter's mask around the landmarks (image
     coordinates of the upright crop; the head's turn is not undone here, a mask
     has no depth). Lengths are in face heights, widths in face widths. */
  function hairShape(points, hair, crop) {
    var sx = hair.width / crop.width, sy = hair.height / crop.height;
    var at = function (x, y) {
      x = Math.round(x * sx); y = Math.round(y * sy);
      if (x < 0 || y < 0 || x >= hair.width || y >= hair.height) return 0;
      return hair.data[y * hair.width + x] ? 1 : 0;
    };
    var left = points[234][0], right = points[454][0];
    var top = points[10][1], chin = points[152][1];
    var centre = (left + right) / 2;
    var faceWidth = right - left, faceHeight = chin - top;
    var eyes = (points[33][1] + points[263][1]) / 2;
    var browTop = Math.min(points[105][1], points[334][1]);
    var x, y, n;

    var total = 0;
    for (var i = 0; i < hair.data.length; i++) if (hair.data[i]) total++;
    var amount = total / (sx * sy) / (faceWidth * faceHeight);

    // Top: how far above the forehead point the hair reaches, over the middle of the head.
    var highest = top;
    for (y = 0; y < top; y++) {
      n = 0;
      for (x = centre - faceWidth * 0.3; x <= centre + faceWidth * 0.3; x += 2) n += at(x, y);
      if (n >= 4) { highest = y; break; }
    }
    // Side: how much hair there is beside the face, between the eyes and the mouth.
    var rows = 0, beside = 0;
    for (y = eyes; y <= points[13][1]; y += 2) {
      n = 0;
      for (x = left - faceWidth * 0.7; x < left; x++) n += at(x, y);
      for (x = right + 1; x <= right + faceWidth * 0.7; x++) n += at(x, y);
      beside += n / 2; rows++;
    }
    // Length: the lowest row that still has a fair amount of hair beside or below the face.
    var lowest = eyes;
    for (y = crop.height - 1; y > eyes; y--) {
      n = 0;
      for (x = left - faceWidth * 0.7; x <= right + faceWidth * 0.7; x++) n += at(x, y);
      if (n >= faceWidth * 0.12) { lowest = y; break; }
    }
    // Fringe: the share of the forehead that is covered, and which half has more.
    var covered = [0, 0], cells = [0, 0];
    for (y = top + faceHeight * 0.02; y < browTop - faceHeight * 0.02; y += 2) {
      for (x = left + faceWidth * 0.15; x <= right - faceWidth * 0.15; x += 2) {
        var half = x < centre ? 0 : 1;
        covered[half] += at(x, y); cells[half]++;
      }
    }
    var fringeLeft = cells[0] ? covered[0] / cells[0] : 0, fringeRight = cells[1] ? covered[1] / cells[1] : 0;
    return {
      hairAmount: amount,
      hairTop: (top - highest) / faceHeight,
      hairSide: rows ? beside / rows / faceWidth : 0,
      hairLength: (lowest - eyes) / faceHeight,
      // how much of the crop below the eyes the hair could have reached: at 1 the hair
      // runs off the picture and its true length is unknown
      hairRoom: (crop.height - 1 - eyes) / faceHeight,
      fringe: (fringeLeft + fringeRight) / 2,
      parting: (fringeLeft - fringeRight) / (fringeLeft + fringeRight + 0.05)
    };
  }

  // Where the skin is read: cheeks, forehead, the bridge of the nose and the chin.
  var SKIN_POINTS = [205, 425, 50, 280, 187, 411, 123, 352, 151, 9, 108, 337, 197, 199];
  // The lit part of the skin and of the iris: the lightness that 60 % (65 %) of the pixels stay
  // under. Higher, and the shine on a dark skin is taken for its colour; at the median, the
  // shadow under sunglasses is.
  var SKIN_RANK = 0.60, IRIS_RANK = 0.65;
  // Hair is read at its darker part: the mask also holds the shine on the hair and, where
  // the hair is thin, the scalp under it. Eyebrows even more so: skin shows between the hairs.
  var HAIR_RANK = 0.35, BROW_RANK = 0.15;

  function colours(points, pixels, hair) {
    var faceWidth = points[454][0] - points[234][0];
    var patch = faceWidth * 0.045;
    var hairAt = function () { return 0; };
    if (hair) {
      var sx = hair.width / pixels.width, sy = hair.height / pixels.height;
      hairAt = function (x, y, reach) {
        var hx = Math.round(x * sx), hy = Math.round(y * sy), w = hair.width, d = hair.data;
        if (hx < reach || hy < reach || hx >= w - reach || hy >= hair.height - reach) return 0;
        if (!reach) return d[hy * w + hx];
        // With a reach: only where the neighbours are hair too (the mask's edge is half background).
        return d[hy * w + hx] && d[hy * w + hx - reach] && d[hy * w + hx + reach] && d[(hy - reach) * w + hx] && d[(hy + reach) * w + hx];
      };
    }
    // Skin: every pixel of fourteen small discs, hair left out, read at its lit part.
    var skinSet = { L: [], A: [], B: [] };
    SKIN_POINTS.forEach(function (i) {
      var c = points[i], near = inDisc(c, patch);
      sampleColour(pixels, c[0] - patch, c[1] - patch, c[0] + patch, c[1] + patch,
        function (x, y) { return near(x, y) && !hairAt(x, y, 0); }, null, skinSet);
    });
    var skin = rankedColour(skinSet, SKIN_RANK);
    var lips = polygonColour(pixels, LOWER_LIP.map(function (i) { return points[i]; }));
    // Iris: the ring between the pupil and the rim, both eyes together, without the eyelids.
    var irisSet = { L: [], A: [], B: [] };
    [[468, 469, 159, 145], [473, 474, 386, 374]].forEach(function (e) {
      var c = points[e[0]], r = Math.hypot(points[e[1]][0] - c[0], points[e[1]][1] - c[1]);
      var lidTop = points[e[2]][1], lidBottom = points[e[3]][1];
      sampleColour(pixels, c[0] - r, c[1] - r, c[0] + r, c[1] + r, function (x, y) {
        var d = Math.hypot(x - c[0], y - c[1]);
        return d >= r * 0.45 && d <= r * 0.9 && y > lidTop + 1 && y < lidBottom - 1;
      }, null, irisSet);
    });
    var iris = rankedColour(irisSet, IRIS_RANK), irisDark = rankedColour(irisSet, 0.35);
    var hairColour = null;
    if (hair) {
      hairColour = sampleColour(pixels, 0, 0, pixels.width - 1, pixels.height - 1, function (x, y) {
        return (x + y) % 3 === 0 && hairAt(x, y, 2);  // a third of the pixels is plenty
      }, HAIR_RANK);
    }
    // The scalp: a patch a tenth of a face height above the top of the forehead. On a
    // shaved or very short head the segmenter sees no hair, but this patch is not skin-coloured.
    var faceHeight = points[152][1] - points[10][1];
    var crown = [points[10][0], points[10][1] - faceHeight * 0.10];
    var scalp = sampleColour(pixels, crown[0] - patch * 1.5, crown[1] - patch, crown[0] + patch * 1.5, crown[1] + patch);
    // The eyebrows, at their darker part (the hairs, not the skin between them).
    var browSet = { L: [], A: [], B: [] };
    [[BROW_UPPER_LEFT, BROW_LOWER_LEFT], [BROW_UPPER_RIGHT, BROW_LOWER_RIGHT]].forEach(function (rows) {
      var polygon = rows[0].concat(rows[1].slice().reverse()).map(function (i) { return points[i]; });
      var xs = polygon.map(function (p) { return p[0]; }), ys = polygon.map(function (p) { return p[1]; });
      sampleColour(pixels, Math.min.apply(null, xs), Math.min.apply(null, ys), Math.max.apply(null, xs), Math.max.apply(null, ys),
        function (x, y) { return insidePolygon(polygon, x + 0.5, y + 0.5); }, null, browSet);
    });
    var brow = rankedColour(browSet, BROW_RANK);
    var found = { skin: skin, lips: lips, iris: iris, irisDark: irisDark, hair: hairColour, scalp: scalp, brow: brow,
      beard: beard(points, pixels, patch, hairColour || scalp) };
    // Undo a dark photo: every colour is lifted by the same gain (see exposureGain).
    var gain = exposureGain(points, pixels);
    ['skin', 'lips', 'iris', 'irisDark', 'hair', 'scalp', 'brow'].forEach(function (name) {
      // The lift never takes the skin past SKIN_LIFT_TOP: beyond it a dim photo of a tanned
      // face comes out pale and pink.
      var lift = name === 'skin' && found.skin ? Math.min(gain, Math.max(1, SKIN_LIFT_TOP / found.skin[0])) : gain;
      if (found[name]) found[name] = found[name].map(function (v) { return v * lift; });
    });
    found.gain = gain;
    return found;
  }

  // The lightness the brightest parts of a well-exposed face reach (the whites of the eyes,
  // teeth, the shine on the skin), and the most a dark photo is lifted.
  var FACE_WHITE = 0.9, MAX_GAIN = 1.5, SKIN_LIFT_TOP = 0.80;
  var FACE_BOX = [234, 454, 10, 152];   // left, right, top and bottom of the face

  /* How much a photo has to be lifted to be well exposed, 1 or more.

     A dark skin and a dark photo give the same pixels on the cheek, but not in the whites
     of the eyes: on any well-exposed face, something is nearly white. So the lightness that
     only 3 % of the face's pixels exceed is taken as the photo's "white", and if it falls
     short of FACE_WHITE, everything is scaled up to reach it. OKLab is linear enough in this
     range for one factor to serve lightness and colour alike. */
  function exposureGain(points, pixels) {
    var x0 = Math.max(0, Math.floor(points[FACE_BOX[0]][0])), x1 = Math.min(pixels.width - 1, Math.ceil(points[FACE_BOX[1]][0]));
    var y0 = Math.max(0, Math.floor(points[FACE_BOX[2]][1])), y1 = Math.min(pixels.height - 1, Math.ceil(points[FACE_BOX[3]][1]));
    var light = [];
    for (var y = y0; y <= y1; y += 3) {
      for (var x = x0; x <= x1; x += 3) {
        var i = (y * pixels.width + x) * 4;
        light.push(rgbToOklab(pixels.data[i], pixels.data[i + 1], pixels.data[i + 2])[0]);
      }
    }
    if (light.length < 50) return 1;
    light.sort(function (a, b) { return a - b; });
    var white = light[Math.floor(light.length * 0.97)];
    return Math.min(MAX_GAIN, Math.max(1, FACE_WHITE / Math.max(white, 0.01)));
  }

  // Where a beard is read: the upper lip and the front of the chin, which face the light.
  // The jaw and the underside of the chin grow a beard too, but they are in shadow on most
  // photos, and a shadow reads as a beard. It is compared with skin no beard reaches
  // (forehead, cheekbones, nose bridge).
  var BEARD_POINTS = [164, 167, 393, 200, 199, 32, 262];
  var BARE_POINTS = [151, 9, 108, 337, 197, 50, 280, 123, 352];
  // OKLab distance under which the hair is too close to the skin to tell a beard by its colour.
  var HAIR_LIKE_SKIN = 0.12;

  /* How much beard, 0 to 1: how far the lower face has moved from the colour of the bare
     skin toward the colour of the hair (the projection of one difference on the other).
     A shadow under the chin moves it a little, a full beard all the way. When the hair is
     nearly skin-coloured there is no direction to project on, and only the darkening counts. */
  function beard(points, pixels, patch, hair) {
    var gather = function (indices) {
      var set = { L: [], A: [], B: [] };
      indices.forEach(function (i) {
        var c = points[i], near = inDisc(c, patch);
        sampleColour(pixels, c[0] - patch, c[1] - patch, c[0] + patch, c[1] + patch, near, null, set);
      });
      return rankedColour(set, 0.5);
    };
    var low = gather(BEARD_POINTS), bare = gather(BARE_POINTS);
    if (!low || !bare) return 0;
    var toHair = hair ? sub(hair, bare) : [0, 0, 0], reach = dot(toHair, toHair);
    var amount = reach > HAIR_LIKE_SKIN * HAIR_LIKE_SKIN ? dot(sub(low, bare), toHair) / reach : (bare[0] - low[0]) / 0.25;
    return Math.min(1, Math.max(0, amount));
  }

  /* ---- what is worn, read from the photo --------------------------------------
     Glasses, a receding hairline and curls are not part of a
     face's proportions, and a doll does not inherit them, but a doll without them does
     not look like its person. They are read here as well as a photo allows and handed
     over apart from the traits, as a first guess the reader can change.

     Method. The thresholds below were set on 49 faces whose answer I could see: 17 photos
     of real people and 32 synthetic faces; 21 of them wear glasses, 3 have a receding
     hairline. The first rules were set on 29 of them; tried on the other 20 they missed
     8 of 12 wire frames, the ridge rule was added, and the thresholds were then set on
     all 49. So there is no untouched set left, and the count that follows says the rules
     fit these faces, not how often they are right in general: glasses 48 of 49 (one tinted
     wire frame missed, no face without glasses given a pair), hairline 49 of 49. Curls
     rest on one real face and give two false alarms in the 49 (a headscarf, and long
     straight hair): they are the weakest of the three. */

  var RIM = 0.17;            // a lower rim this strong is a frame on its own
  var RIM_WITH_BRIDGE = 0.12, BRIDGE = 0.10;   // a weaker rim counts with a clear bridge over the nose
  var WIRE = 0.048, WIRE_QUARTILE = 0.033;     // a thin ridge under the eyes, in the middle column and in the weaker ones
  var SHADES_SOCKET = 0.40, SHADES_RIM = 0.10; // the eye socket this much darker than the cheek: dark lenses
  var THICK_RIM = 0.24;      // from here the frame is drawn thick and square, under it thin and round
  var BARE_CROWN = 0.25, SCARCE_HAIR = 0.30;   // a receding hairline: this much bare head over the forehead, and little hair
  var SCALP_LIKE = 0.25;     // OKLab distance under which the hair mask's colour is taken for scalp
  var CURL_TEXTURE = 0.085, CURL_LENGTH = 0.30; // curls: long hair whose inside is this uneven

  function worn(points, pixels, hair, shape, shades) {
    var W = pixels.width, HT = pixels.height, data = pixels.data;
    var cache = {};
    var light = function (x, y) {
      x = Math.max(0, Math.min(W - 1, Math.round(x))); y = Math.max(0, Math.min(HT - 1, Math.round(y)));
      var i = y * W + x;
      if (cache[i] == null) cache[i] = rgbToOklab(data[i * 4], data[i * 4 + 1], data[i * 4 + 2])[0];
      return cache[i];
    };
    // A thin dark or light line on skin: how far a pixel is from the mean of the two pixels
    // `reach` above and below it.
    var P = points, faceHeight = P[152][1] - P[10][1];
    var reach = 2 * Math.max(2, Math.round(faceHeight * 0.012));
    var line = function (x, y) { return Math.abs(light(x, y) - (light(x, y - reach) + light(x, y + reach)) / 2); };
    var x, y, best;

    // The bridge of a frame: a line across the nose, between the eyes.
    var bx0 = P[133][0] + (P[362][0] - P[133][0]) * 0.25, bx1 = P[133][0] + (P[362][0] - P[133][0]) * 0.75;
    var bridge = 0;
    for (y = P[168][1] - faceHeight * 0.04; y <= P[197][1]; y++) {
      var sum = 0, count = 0;
      for (x = bx0; x <= bx1; x++) { sum += light(x, y) - (light(x, y - reach) + light(x, y + reach)) / 2; count++; }
      bridge = Math.max(bridge, Math.abs(sum / count));
    }
    // The lower rim: under each eye, the strongest line in every column. A frame crosses
    // all of them; a wrinkle or a shadow only some, so the median is what counts.
    var columns = [], rimSet = { L: [], A: [], B: [] };
    [[133, 33, 145], [362, 263, 374]].forEach(function (eye) {
      var x0 = Math.min(P[eye[0]][0], P[eye[1]][0]), x1 = Math.max(P[eye[0]][0], P[eye[1]][0]);
      for (x = x0 + (x1 - x0) * 0.15; x <= x1 - (x1 - x0) * 0.15; x += 2) {
        best = 0; var where = 0;
        for (y = P[eye[2]][1] + faceHeight * 0.035; y <= P[eye[2]][1] + faceHeight * 0.17; y++) {
          var v = line(x, y);
          if (v > best) { best = v; where = y; }
        }
        columns.push(best);
        var i = (Math.max(0, Math.min(HT - 1, Math.round(where))) * W + Math.max(0, Math.min(W - 1, Math.round(x)))) * 4;
        var lab = rgbToOklab(data[i], data[i + 1], data[i + 2]);
        rimSet.L.push(lab[0]); rimSet.A.push(lab[1]); rimSet.B.push(lab[2]);
      }
    });
    var rim = median(columns);
    // A wire frame is too faint for that. It is looked for as a ridge: a pixel lighter (or
    // darker) than BOTH the pixel just above and the one just below, which a thin line is
    // and the edge of a shadow or of a bag under the eye is not. A frame gives a ridge in
    // nearly every column, so even the weaker columns (the lower quartile) must show it.
    var near = Math.max(2, Math.round(faceHeight * 0.008)), ridges = [];
    [[133, 33, 145], [362, 263, 374]].forEach(function (eye) {
      var x0 = Math.min(P[eye[0]][0], P[eye[1]][0]), x1 = Math.max(P[eye[0]][0], P[eye[1]][0]);
      for (x = x0 + (x1 - x0) * 0.1; x <= x1 - (x1 - x0) * 0.1; x++) {
        best = 0;
        for (y = P[eye[2]][1] + faceHeight * 0.03; y <= P[eye[2]][1] + faceHeight * 0.2; y++) {
          var up = light(x, y) - light(x, y - near), down = light(x, y) - light(x, y + near);
          if (up * down > 0) best = Math.max(best, Math.min(Math.abs(up), Math.abs(down)));
        }
        ridges.push(best);
      }
    });
    ridges.sort(function (a, b) { return a - b; });
    var wire = ridges.length > 8 && median(ridges) >= WIRE && ridges[Math.floor(ridges.length * 0.25)] >= WIRE_QUARTILE;
    // Dark lenses: the eye socket against the cheek.
    var disc = function (c) {
      var values = [], r = faceHeight * 0.03;
      for (var yy = c[1] - r; yy <= c[1] + r; yy += 2) for (var xx = c[0] - r; xx <= c[0] + r; xx += 2) values.push(light(xx, yy));
      return median(values);
    };
    var socket = (disc(P[159]) + disc(P[386]) + disc(P[145]) + disc(P[374])) / 4 / ((disc(P[205]) + disc(P[425])) / 2);

    var glasses = '';
    if (socket < SHADES_SOCKET && rim >= SHADES_RIM) glasses = 'shades';
    else if (wire || rim >= RIM || (rim >= RIM_WITH_BRIDGE && bridge >= BRIDGE)) glasses = rim >= THICK_RIM ? 'square' : 'round';
    // A thick frame has a colour of its own; a thin one is too mixed with the skin to read.
    var frame = null;
    if (glasses === 'square') {
      frame = rankedColour(rimSet, 0.1);   // its darkest part: the rest is mixed with the skin behind it
      if (frame) frame = frame.map(function (value) { return value * shades.gain; });
    }

    // Hair: a receding hairline, or curls.
    var style = '';
    if (hair && shape) {
      var sx = hair.width / W, sy = hair.height / HT;
      var at = function (hx, hy) {
        hx = Math.round(hx * sx); hy = Math.round(hy * sy);
        return hx < 0 || hy < 0 || hx >= hair.width || hy >= hair.height ? 0 : hair.data[hy * hair.width + hx] ? 1 : 0;
      };
      var faceWidth = P[454][0] - P[234][0], centre = (P[234][0] + P[454][0]) / 2;
      // How far above the forehead point the head stays bare, over its middle third.
      var bare = 0, reached = false;
      for (y = P[10][1]; y >= 0 && y > P[10][1] - faceHeight * 0.45; y--) {
        var cells = 0, covered = 0;
        for (x = centre - faceWidth * 0.17; x <= centre + faceWidth * 0.17; x += 2) { covered += at(x, y); cells++; }
        if (covered / cells > 0.5) { reached = true; break; }
        bare++;
      }
      if (reached && bare / faceHeight >= BARE_CROWN && shape.hairAmount < SCARCE_HAIR) style = 'receding';
      else if (shape.hairLength / Math.max(shape.hairRoom, 1e-6) >= CURL_LENGTH) {
        // How uneven the inside of the hair is: curls make light and shadow alternate.
        var texture = 0, inside = 0;
        for (y = 6; y < HT - 6; y += 2) {
          for (x = 6; x < W - 6; x += 2) {
            if (at(x, y) && at(x - 5, y) && at(x + 5, y) && at(x, y - 5) && at(x, y + 5)) {
              texture += Math.abs(light(x, y) - light(x + 3, y)) + Math.abs(light(x, y) - light(x, y + 3)); inside++;
            }
          }
        }
        if (inside > 500 && texture / inside >= CURL_TEXTURE) style = 'curls';
      }
    }
    return { glasses: glasses, frame: frame, hair: style, signals: { rim: rim, bridge: bridge, socket: socket, wire: wire } };
  }

  function measure(points, pixels, hair) {
    var traits = geometry(points);
    var shades = colours(points, pixels, hair);
    var shape = null;
    if (hair) {
      shape = hairShape(points, hair, pixels);
      for (var key in shape) traits[key] = shape[key];
      // Little hair, and what the mask holds is nearly skin-coloured: it is mostly scalp, not
      // hair. The eyebrows are hair of the same colour, and the landmarks say where they are.
      if (shape.hairAmount < SCARCE_HAIR && shades.brow && shades.hair && shades.skin &&
          Math.hypot(shades.hair[0] - shades.skin[0], shades.hair[1] - shades.skin[1], shades.hair[2] - shades.skin[2]) < SCALP_LIKE) {
        shades.hair = shades.brow;
      }
    }
    var wearing = worn(points, pixels, hair, shape, shades);
    // With glasses the lit part of the iris is a reflection on the lens: read it darker.
    if (wearing.glasses && shades.irisDark) shades.iris = shades.irisDark;
    if (shades.skin) {
      traits.skinLight = shades.skin[0];
      // How far the scalp patch is from the skin's colour (OKLab distance): near 0 on a
      // bald head, large under a crop of very short hair (or a hat).
      if (shades.scalp) {
        traits.scalp = Math.hypot(shades.scalp[0] - shades.skin[0], shades.scalp[1] - shades.skin[1], shades.scalp[2] - shades.skin[2]);
      }
    }
    return { traits: traits, colours: shades, pose: pose(points), worn: wearing };
  }

  return {
    measure: measure, geometry: geometry, hairShape: hairShape, colours: colours, frontal: frontal, pose: pose,
    rgbToOklab: rgbToOklab, oklabToRgb: oklabToRgb, hex: hex, hexToOklab: hexToOklab, mixLab: mixLab,
    median: median, insidePolygon: insidePolygon
  };
});
