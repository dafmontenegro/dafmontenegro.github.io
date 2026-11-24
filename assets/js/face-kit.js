/* face-kit.js: finding a face in a photo, in the reader's own browser.

   Shared by the pages that read faces (Phenotype, Meiosis). Nothing here sends
   anything anywhere: the photo is decoded, searched and measured on the device,
   by MediaPipe's Face Landmarker (478 points per face) and, when asked, its
   hair segmenter. MediaPipe's runtime and the two models are served by this
   site (static/vendor/mediapipe/), pinned to one version; nothing is fetched
   from a third party, and nothing at all until the first photo is given.

   The page passes the addresses in a JSON block (layouts/_partials/face-kit.html):
     <script type="application/json" id="face-kit-sources">
       {"bundle": ..., "wasmLoader": ..., "wasmBinary": ..., "landmarker": ..., "hair": ...}

   API (everything returns a Promise):

     FaceKit.load(source, maxSide = 1600) -> canvas
       `source` is a File, a Blob or a URL. The photo comes back upright (EXIF
       rotation applied), flattened on white if it had transparency, and no
       larger than `maxSide` on its longer side. Rejects with a FaceKit.Error
       when the browser cannot read the file.

     FaceKit.find(canvas) -> {image, points, faces, notes}
       The largest face. `points` is an array of 478 [x, y, z] in pixels of
       `image`, which is `canvas` or the variant the face was found in: the
       search is forgiving, as the photos are whatever people have at hand.
       No face at first -> it tries again with a border (faces that fill the
       frame), smaller (very large photos) and turned by 90, 270 and 180
       degrees (sideways photos); a face found lying on its side is turned
       upright and read again. `notes` says in plain words what it had to
       do; `faces` is how many it saw. Rejects with a FaceKit.Error only when
       there is no face at all.

     FaceKit.align(found, {size = 512, scale = 1, backdrop}) -> {image, points}
       The face cropped and turned upright by the FFHQ recipe (a square
       oriented by the eyes and the mouth; NVlabs/ffhq-dataset), `size` pixels
       a side. `scale` widens the square: 1 is FFHQ's own crop, 1.5 shows more
       hair and shoulders. `points` are the same 478 points in the crop. Where
       the square leaves the photo it is filled with the photo's mean colour,
       or, with `backdrop: 'photo'`, with the photo itself out of focus.

     FaceKit.hair(canvas) -> {width, height, data}
       MediaPipe's hair segmenter on a (cropped) portrait: `data` is a
       Uint8Array, one byte per pixel, 1 where there is hair.

     FaceKit.Error: what went wrong, in words fit to show the reader. */
(function () {
  'use strict';

  // Landmark indices (MediaPipe Face Mesh). "Image-left" is the left of the picture.
  var IMAGE_LEFT_EYE = [33, 160, 158, 133, 153, 144];
  var IMAGE_RIGHT_EYE = [362, 385, 387, 263, 373, 380];
  var MOUTH_CORNERS = [61, 291];

  var MAX_FACES = 6;
  // MediaPipe's default. Lower, it also "finds" faces in curtains and collars.
  var MIN_CONFIDENCE = 0.5;
  // Beyond this roll (degrees) the photo is turned upright and read again.
  var MAX_ROLL = 30;
  var MIN_SIDE = 256;

  function KitError(message) {
    this.name = 'FaceKitError';
    this.message = message;
  }
  KitError.prototype = Object.create(Error.prototype);

  var sources = null;
  function addresses() {
    if (!sources) {
      var block = document.getElementById('face-kit-sources');
      if (!block) throw new KitError('This page is missing the face reader.');
      sources = JSON.parse(block.textContent);
    }
    return sources;
  }

  var visionPromise = null;
  var landmarkerPromise = null;
  var hairPromise = null;

  function vision() {
    if (!visionPromise) visionPromise = import(addresses().bundle);
    return visionPromise;
  }

  function fileset() {
    return { wasmLoaderPath: addresses().wasmLoader, wasmBinaryPath: addresses().wasmBinary };
  }

  function landmarker() {
    if (!landmarkerPromise) {
      landmarkerPromise = vision().then(function (v) {
        return v.FaceLandmarker.createFromOptions(fileset(), {
          // The CPU delegate: a still photo takes a fraction of a second, and it
          // behaves the same on every phone, with or without WebGL.
          baseOptions: { modelAssetPath: addresses().landmarker, delegate: 'CPU' },
          runningMode: 'IMAGE',
          numFaces: MAX_FACES,
          minFaceDetectionConfidence: MIN_CONFIDENCE
        });
      });
      landmarkerPromise.catch(function () { landmarkerPromise = null; });
    }
    return landmarkerPromise;
  }

  function hairSegmenter() {
    if (!hairPromise) {
      hairPromise = vision().then(function (v) {
        return v.ImageSegmenter.createFromOptions(fileset(), {
          baseOptions: { modelAssetPath: addresses().hair, delegate: 'CPU' },
          runningMode: 'IMAGE',
          outputCategoryMask: true,
          outputConfidenceMasks: false
        });
      });
      hairPromise.catch(function () { hairPromise = null; });
    }
    return hairPromise;
  }

  function makeCanvas(width, height) {
    var canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(width));
    canvas.height = Math.max(1, Math.round(height));
    return canvas;
  }

  function context(canvas) {
    return canvas.getContext('2d', { willReadFrequently: true });
  }

  /* ---- load -------------------------------------------------------------- */

  function decode(blob) {
    if (window.createImageBitmap) {
      return createImageBitmap(blob, { imageOrientation: 'from-image' }).catch(function () {
        return decodeWithImage(blob);
      });
    }
    return decodeWithImage(blob);
  }

  function decodeWithImage(blob) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(blob);
      var image = new Image();
      image.onload = function () { URL.revokeObjectURL(url); resolve(image); };
      image.onerror = function () {
        URL.revokeObjectURL(url);
        reject(new KitError('This browser cannot read that file. A JPEG or PNG always works.'));
      };
      image.src = url;
    });
  }

  function load(source, maxSide) {
    maxSide = maxSide || 1600;
    var blob = typeof source === 'string'
      ? fetch(source).then(function (response) {
        if (!response.ok) throw new KitError('The photo could not be fetched.');
        return response.blob();
      })
      : Promise.resolve(source);
    return blob.then(decode).then(function (picture) {
      var width = picture.naturalWidth || picture.width;
      var height = picture.naturalHeight || picture.height;
      if (!width || !height) throw new KitError('That file has no picture in it.');
      var scale = Math.min(1, maxSide / Math.max(width, height));
      var canvas = makeCanvas(width * scale, height * scale);
      var ctx = context(canvas);
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(picture, 0, 0, canvas.width, canvas.height);
      if (picture.close) picture.close();
      return canvas;
    }, function (error) {
      throw error instanceof KitError ? error
        : new KitError('This browser cannot read that file. A JPEG or PNG always works.');
    });
  }

  /* ---- find -------------------------------------------------------------- */

  function meanColour(canvas) {
    var one = makeCanvas(1, 1);
    var ctx = context(one);
    ctx.drawImage(canvas, 0, 0, 1, 1);
    var d = ctx.getImageData(0, 0, 1, 1).data;
    return 'rgb(' + d[0] + ',' + d[1] + ',' + d[2] + ')';
  }

  function resized(canvas, scale) {
    var out = makeCanvas(canvas.width * scale, canvas.height * scale);
    var ctx = context(out);
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(canvas, 0, 0, out.width, out.height);
    return out;
  }

  function bordered(canvas) {
    var pad = Math.round(Math.max(canvas.width, canvas.height) * 0.35);
    var out = makeCanvas(canvas.width + 2 * pad, canvas.height + 2 * pad);
    var ctx = context(out);
    ctx.fillStyle = meanColour(canvas);
    ctx.fillRect(0, 0, out.width, out.height);
    ctx.drawImage(canvas, pad, pad);
    return out;
  }

  function smaller(canvas) {
    return resized(canvas, Math.min(1, 640 / Math.max(canvas.width, canvas.height)));
  }

  function turned(canvas, quarterTurns) {
    var swap = quarterTurns % 2 === 1;
    var out = makeCanvas(swap ? canvas.height : canvas.width, swap ? canvas.width : canvas.height);
    var ctx = context(out);
    ctx.translate(out.width / 2, out.height / 2);
    ctx.rotate(quarterTurns * Math.PI / 2);
    ctx.drawImage(canvas, -canvas.width / 2, -canvas.height / 2);
    return out;
  }

  /* How far the face is turned in the picture plane, in degrees (0 = upright): the
     angle of the line between the eyes. The landmark indices are anatomical, so this
     holds for a face lying on its side. */
  function roll(points) {
    var a = centroid(points, IMAGE_LEFT_EYE), b = centroid(points, IMAGE_RIGHT_EYE);
    return Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI;
  }

  /* The canvas turned by `degrees` (clockwise positive), enlarged to hold all of it. */
  function rotated(canvas, degrees) {
    var r = degrees * Math.PI / 180, c = Math.abs(Math.cos(r)), s = Math.abs(Math.sin(r));
    var out = makeCanvas(canvas.width * c + canvas.height * s, canvas.width * s + canvas.height * c);
    var ctx = context(out);
    ctx.fillStyle = meanColour(canvas);
    ctx.fillRect(0, 0, out.width, out.height);
    ctx.translate(out.width / 2, out.height / 2);
    ctx.rotate(r);
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(canvas, -canvas.width / 2, -canvas.height / 2);
    return out;
  }

  function detect(detector, canvas) {
    var result = detector.detect(canvas);
    return (result.faceLandmarks || []).map(function (face) {
      return face.map(function (p) {
        // MediaPipe scales z like x: both by the image width.
        return [p.x * canvas.width, p.y * canvas.height, p.z * canvas.width];
      });
    });
  }

  function extent(points) {
    var minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (var i = 0; i < points.length; i++) {
      minX = Math.min(minX, points[i][0]); maxX = Math.max(maxX, points[i][0]);
      minY = Math.min(minY, points[i][1]); maxY = Math.max(maxY, points[i][1]);
    }
    return (maxX - minX) * (maxY - minY);
  }

  function find(canvas) {
    return landmarker().then(function (detector) {
      var notes = [];
      var image = canvas;
      if (Math.min(image.width, image.height) < MIN_SIDE) {
        image = resized(image, MIN_SIDE / Math.min(image.width, image.height));
        notes.push('The photo is very small; it was enlarged first.');
      }
      var attempts = [
        [null, function (c) { return c; }],
        ['The face fills the frame; it was found after adding a border.', bordered],
        [null, smaller],
        ['The photo was sideways; it was turned upright.', function (c) { return turned(c, 1); }],
        ['The photo was sideways; it was turned upright.', function (c) { return turned(c, 3); }],
        ['The photo was upside down; it was turned upright.', function (c) { return turned(c, 2); }]
      ];
      for (var i = 0; i < attempts.length; i++) {
        var candidate = attempts[i][1](image);
        var faces = detect(detector, candidate);
        if (!faces.length) continue;
        if (attempts[i][0]) notes.push(attempts[i][0]);
        faces.sort(function (a, b) { return extent(b) - extent(a); });
        // A face lying on its side is found, but its landmarks are poor. Turn the
        // picture so the face is upright and read it again.
        var angle = roll(faces[0]);
        if (Math.abs(angle) > MAX_ROLL) {
          var upright = rotated(candidate, -angle);
          var again = detect(detector, upright);
          if (again.length) {
            again.sort(function (a, b) { return extent(b) - extent(a); });
            candidate = upright; faces = again;
            notes.push('The face was turned in the photo; the photo was turned upright.');
          }
        }
        if (faces.length > 1) notes.push(faces.length + ' faces in the photo; the largest one was used.');
        return { image: candidate, points: faces[0], faces: faces.length, notes: notes };
      }
      throw new KitError('No face found. Any photo works as long as a face is visible: ' +
        'try one where it is larger or better lit.');
    }, function (error) {
      throw error instanceof KitError ? error
        : new KitError('The face reader could not be loaded. Check the connection and try again.');
    });
  }

  /* ---- align ------------------------------------------------------------- */

  function centroid(points, indices) {
    var x = 0, y = 0;
    for (var i = 0; i < indices.length; i++) { x += points[indices[i]][0]; y += points[indices[i]][1]; }
    return [x / indices.length, y / indices.length];
  }

  function align(found, options) {
    options = options || {};
    var size = options.size || 512;
    var widen = options.scale || 1;
    var points = found.points;
    // By anatomical index, not by position in the picture, so a turned face keeps its sides.
    var eyeLeft = centroid(points, IMAGE_LEFT_EYE);
    var eyeRight = centroid(points, IMAGE_RIGHT_EYE);
    var m1 = points[MOUTH_CORNERS[0]], m2 = points[MOUTH_CORNERS[1]];
    var eyeAvg = [(eyeLeft[0] + eyeRight[0]) / 2, (eyeLeft[1] + eyeRight[1]) / 2];
    var eyeToEye = [eyeRight[0] - eyeLeft[0], eyeRight[1] - eyeLeft[1]];
    var eyeToMouth = [(m1[0] + m2[0]) / 2 - eyeAvg[0], (m1[1] + m2[1]) / 2 - eyeAvg[1]];
    // FFHQ's oriented square: x = eye_to_eye - rot90(eye_to_mouth), half-side
    // max(2 |eye_to_eye|, 1.8 |eye_to_mouth|), centred 0.1 eye_to_mouth below the eyes.
    var x = [eyeToEye[0] + eyeToMouth[1], eyeToEye[1] - eyeToMouth[0]];
    var length = Math.hypot(x[0], x[1]);
    var half = Math.max(Math.hypot(eyeToEye[0], eyeToEye[1]) * 2.0,
      Math.hypot(eyeToMouth[0], eyeToMouth[1]) * 1.8) * widen;
    var ux = x[0] / length, uy = x[1] / length;       // the square's x axis, unit
    var centre = [eyeAvg[0] + eyeToMouth[0] * 0.1, eyeAvg[1] + eyeToMouth[1] * 0.1];
    var k = size / (2 * half);                         // source pixels -> crop pixels

    var canvas = makeCanvas(size, size);
    var ctx = context(canvas);
    ctx.fillStyle = meanColour(found.image);
    ctx.fillRect(0, 0, size, size);
    if (options.backdrop === 'photo') {
      // Where the square leaves the photo, show the photo itself out of focus instead
      // of a flat colour: the whole photo, reduced to a few pixels and stretched over
      // the square. The sharp photo is then drawn on top.
      var tiny = makeCanvas(12, 12);
      var tinyCtx = context(tiny);
      tinyCtx.imageSmoothingQuality = 'high';
      tinyCtx.drawImage(found.image, 0, 0, 12, 12);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(tiny, 1, 1, 10, 10, 0, 0, size, size);
    }
    ctx.imageSmoothingQuality = 'high';
    // p' = k R (p - centre) + size / 2, with R turning the square's x axis onto the canvas's.
    ctx.setTransform(k * ux, -k * uy, k * uy, k * ux,
      size / 2 - k * (ux * centre[0] + uy * centre[1]),
      size / 2 - k * (-uy * centre[0] + ux * centre[1]));
    ctx.drawImage(found.image, 0, 0);
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    var moved = points.map(function (p) {
      var dx = p[0] - centre[0], dy = p[1] - centre[1];
      return [size / 2 + k * (ux * dx + uy * dy), size / 2 + k * (-uy * dx + ux * dy), k * p[2]];
    });
    return Promise.resolve({ image: canvas, points: moved, sourceFaceSide: 2 * half });
  }

  /* ---- hair -------------------------------------------------------------- */

  function hair(canvas) {
    return hairSegmenter().then(function (segmenter) {
      var result = segmenter.segment(canvas);
      var mask = result.categoryMask;
      var data = new Uint8Array(mask.getAsUint8Array());
      var out = { width: mask.width, height: mask.height, data: data };
      if (result.close) result.close();
      return out;
    }, function () {
      throw new KitError('The hair reader could not be loaded. Check the connection and try again.');
    });
  }

  window.FaceKit = { load: load, find: find, align: align, hair: hair, Error: KitError };
})();
