/* phenotype.js: the page around the dolls (layouts/_shortcodes/phenotype.html).

   The page has two parts. The first turns a photo of any face into a paper doll
   that can be dressed and saved (`{{< phenotype >}}`). The second takes two
   faces and draws the doll that is their child (`{{< phenotype part="mix" >}}`);
   its first place takes the doll made in the first part, without asking for the
   photo again.

   The reading of the face is in face-kit.js; the measuring, the genome and the
   drawing are in phenotype-measure.js, phenotype-genome.js and phenotype-draw.js,
   which have no DOM in them and are tested on their own. This file only joins
   them to the page:

   * a photo is read on the device, turned into a genome, and dropped;
   * nothing is stored: no photo, no genome, no doll. What the reader makes
     lives in memory until the page is closed, unless they save the picture;
   * each mount point's fallback text stays until the first drawing, so a reader
     without JavaScript reads what the tool is instead of an empty box. */
(function () {
  'use strict';

  var G = window.PhenotypeGenome, D = window.PhenotypeDraw, M = window.PhenotypeMeasure;
  var CROP = { size: 512, scale: 1.5 };
  var TURNED = 25;  // degrees of yaw or pitch past which the reader is told the likeness suffers

  function track(name, params) { if (typeof window.siteTrack === 'function') window.siteTrack(name, params || {}); }

  function element(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  /* A doll in its frame: the drawing is an SVG, written by phenotype-draw.js. */
  function paint(frame, genome, options) {
    frame.innerHTML = D.svg(genome, options);
    look(frame);
  }

  /* Every doll on the page looks at the pointer (or the finger). The drawing puts each
     iris in a group with how far it may move; here that group is pushed toward the pointer. */
  var pointer = null, looking = false;
  function look(scope) {
    if (!pointer) return;
    Array.prototype.forEach.call((scope || document).querySelectorAll('.ph-pupil'), function (pupil) {
      var box = pupil.ownerSVGElement.getBoundingClientRect();
      if (!box.width) return;
      var dx = pointer.x - (box.left + box.width / 2), dy = pointer.y - (box.top + box.height * 0.4);
      var far = Math.sqrt(dx * dx + dy * dy) || 1, pull = Math.min(1, far / (box.width * 0.6));
      var reach = parseFloat(pupil.getAttribute('data-reach')) || 4;
      pupil.setAttribute('transform', 'translate(' + (dx / far * pull * reach).toFixed(2) + ' ' + (dy / far * pull * reach).toFixed(2) + ')');
    });
  }
  function watchPointer() {
    window.addEventListener('pointermove', function (event) {
      pointer = { x: event.clientX, y: event.clientY };
      if (looking) return;
      looking = true;
      window.requestAnimationFrame(function () { looking = false; look(); });
    }, { passive: true });
  }

  /* Scraps of paper thrown from a doll's card when it is made. */
  var SCRAPS = ['#f01626', '#facc15', '#38bdf8', '#ff5fa2', '#f3ead2', '#2f4a9c'];
  function confetti(figure) {
    if (stillness) return;
    var cloud = element('div', 'phenotype-confetti');
    for (var i = 0; i < 26; i++) {
      var scrap = element('span'), angle = Math.random() * Math.PI * 2, far = 5 + Math.random() * 8;
      scrap.style.cssText = 'background:' + SCRAPS[i % SCRAPS.length] + ';--ph-x:' + (Math.cos(angle) * far).toFixed(1) + 'rem;--ph-y:' +
        (Math.sin(angle) * far - 3).toFixed(1) + 'rem;--ph-turn:' + Math.round(Math.random() * 720 - 360) + 'deg;animation-delay:' + Math.round(Math.random() * 120) + 'ms';
      cloud.append(scrap);
    }
    figure.append(cloud);
    setTimeout(function () { cloud.remove(); }, 1700);
  }

  /* A tap on a doll: it hops. */
  function hop(canvas) {
    canvas.addEventListener('click', function () {
      canvas.classList.remove('phenotype-hop');
      void canvas.offsetWidth;
      canvas.classList.add('phenotype-hop');
    });
  }

  function card(className, caption) {
    var figure = element('figure', 'phenotype-card ' + className);
    var canvas = element('div', 'phenotype-art');
    var text = element('figcaption', 'phenotype-caption', caption);
    figure.append(canvas, text);
    return { figure: figure, canvas: canvas, caption: text };
  }

  var stillness = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // The dolls blink now and then.
  function blinking(root, draw) {
    if (stillness) return;
    (function wait() {
      setTimeout(function () {
        if (document.hidden || !root.isConnected) return wait();
        draw(true);
        setTimeout(function () { draw(false); wait(); }, 150);
      }, 2600 + Math.random() * 2800);
    })();
  }

  function button(className, text) {
    var node = element('button', className, text);
    node.type = 'button';
    return node;
  }

  /* A file picker behind a button; a photo can also be dropped on the part. */
  function photoInput(root, onFile) {
    var picker = element('input');
    picker.type = 'file';
    picker.accept = 'image/*';
    picker.hidden = true;
    picker.addEventListener('change', function () {
      if (picker.files && picker.files[0]) onFile(picker.files[0]);
      picker.value = '';
    });
    root.addEventListener('dragover', function (event) { event.preventDefault(); });
    root.addEventListener('drop', function (event) {
      event.preventDefault();
      var file = event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0];
      if (file) onFile(file);
    });
    return picker;
  }

  // A doll as a picture: its SVG drawn on a canvas, 1024 pixels a side.
  function picture(genome, options) {
    return new Promise(function (resolve, reject) {
      var image = new Image();
      var url = URL.createObjectURL(new Blob([D.svg(genome, options)], { type: 'image/svg+xml' }));
      image.onload = function () {
        var canvas = document.createElement('canvas');
        canvas.width = canvas.height = 1024;
        canvas.getContext('2d').drawImage(image, 0, 0, 1024, 1024);
        URL.revokeObjectURL(url);
        canvas.toBlob(function (blob) { blob ? resolve(blob) : reject(new Error('no picture')); }, 'image/png');
      };
      image.onerror = reject;
      image.src = url;
    });
  }

  function download(genome, options, name) {
    return picture(genome, options).then(function (blob) {
      var anchor = document.createElement('a');
      anchor.href = URL.createObjectURL(blob);
      anchor.download = name + '.png';
      anchor.click();
      setTimeout(function () { URL.revokeObjectURL(anchor.href); }, 1000);
    });
  }

  // On a phone, the picture can go straight to another app through the share sheet.
  function canSend() {
    try {
      return !!(navigator.canShare && window.File && navigator.canShare({ files: [new File([''], 'doll.png', { type: 'image/png' })] }));
    } catch (e) { return false; }
  }
  function send(genome, options, name) {
    return picture(genome, options).then(function (blob) {
      return navigator.share({ files: [new File([blob], name + '.png', { type: 'image/png' })], title: 'My paper doll' });
    }).catch(function () { /* the reader closed the sheet */ });
  }

  /* What the two parts of the page share: the reader as a doll, from the last photo.
     It lives in memory only; closing the page forgets it. */
  var session = {
    portrait: null,                       // the reader's face as a genome
    wear: plainWear(0),                   // what the reader wears: drawn on the portrait, never inherited
    measuredBeard: 0,
    scheme: null,                         // the paper chosen for the portrait; null = the face's own
    watchers: []
  };
  function plainWear(beard) {
    return { glasses: false, beard: beard, moustache: false, hair: '', hat: '', coat: '', skin: '', blush: false, freckles: false, earrings: false, lashes: false, lips: false };
  }
  // The wardrobe: what each row offers. A swatch row shows colours, the others words.
  var WARDROBE = [
    { key: 'glasses', label: 'Glasses', options: [['None', false], ['Round', 'round'], ['Square', 'square'], ['Shades', 'shades']] },
    { key: 'beard', label: 'Beard', options: [['None', 0], ['Stubble', 0.45], ['Full', 0.9]], toggles: [['moustache', 'Moustache']] },
    { key: 'hair', label: 'Hair', options: [['As read', ''], ['Curls', 'curls'], ['Tied back', 'tied'], ['Receding', 'receding']] },
    { key: 'hat', label: 'On top', options: [['Nothing', ''], ['Beanie', 'beanie'], ['Bow', 'bow'], ['Crown', 'crown']] },
    { label: 'Details', toggles: [['lashes', 'Lashes'], ['lips', 'Lipstick'], ['blush', 'Blush'], ['freckles', 'Freckles'], ['earrings', 'Earrings']] }
  ];
  var SKIN_TONES = ['#f6dccb', '#f1c9a8', '#e3b08f', '#cf9a74', '#b47c56', '#946244', '#6f4630', '#4a2e22'];
  function pick(list) { return list[Math.floor(Math.random() * list.length)]; }
  function changed() { session.watchers.forEach(function (redraw) { redraw(); }); }
  function wornPortrait(extra) {
    var options = { wear: session.wear, label: 'Your face as a paper doll' };
    if (session.scheme != null) options.scheme = session.scheme;
    if (extra) Object.keys(extra).forEach(function (key) { options[key] = extra[key]; });
    return options;
  }

  /* A photo becomes a genome. `busy(on, message)` belongs to the part that asked. */
  function readPhoto(file, population, busy) {
    busy(true, 'Reading the face. The first time, the reader itself has to load (about 8 MB, once).');
    var started = Date.now();
    return window.FaceKit.load(file)
      .then(window.FaceKit.find)
      .then(function (found) {
        return window.FaceKit.align(found, CROP).then(function (crop) {
          return window.FaceKit.hair(crop.image).then(function (hair) {
            var pixels = crop.image.getContext('2d').getImageData(0, 0, crop.image.width, crop.image.height);
            var measurement = M.measure(crop.points, pixels, hair);
            // The photo's pixels are not needed past this line; nothing keeps them.
            crop.image.width = crop.image.height = 0;
            found.image.width = found.image.height = 0;
            var said = found.notes.slice();
            if (Math.abs(measurement.pose.yaw) > TURNED || Math.abs(measurement.pose.pitch) > TURNED) {
              said.push('The face is turned away from the camera; a photo looking straight at it gives a closer doll.');
            }
            return { genome: G.fromMeasurement(measurement, population), beard: measurement.colours.beard || 0,
              worn: measurement.worn || {}, notes: said, ms: Date.now() - started };
          });
        });
      });
  }

  /* What a photo shows its person wearing: the beard, the glasses and their frame, the
     hairstyle. A first guess; every one of them can be changed in the wardrobe. */
  function wearFrom(result) {
    var wear = plainWear(result.beard >= D.FULL_BEARD ? result.beard : result.beard >= D.STUBBLE ? 0.45 : 0);
    var seen = result.worn || {};
    wear.glasses = seen.glasses || false;
    if (seen.frame) wear.frame = M.hex(seen.frame);
    wear.hair = seen.hair || '';
    return wear;
  }

  /* The photo's doll becomes the session's portrait. */
  function portray(result) {
    session.portrait = result.genome;
    session.measuredBeard = result.beard;
    session.wear = wearFrom(result);
    session.scheme = null;
  }

  function failure(error) {
    return error && error.name === 'FaceKitError' ? error.message
      : 'Something went wrong while reading the photo. Try another one.';
  }

  /* ---- part one: any face as a paper doll ---- */
  function mountMe(root, population) {
    // Until a photo arrives, the frame shows a doll written in the page:
    // its code, what it wears (g, b, s) and the name of its paper.
    var marks = root.getAttribute('data-wear') || '';
    var sample = G.decode(root.getAttribute('data-sample') || '') || G.resident();
    var sampleWear = { glasses: marks.indexOf('g') >= 0, beard: marks.indexOf('b') >= 0 ? 0.9 : marks.indexOf('s') >= 0 ? 0.45 : 0 };
    var samplePaper = D.SCHEMES.map(function (scheme) { return scheme.name; }).indexOf(root.getAttribute('data-paper') || '');

    root.textContent = '';
    root.classList.add('phenotype-ready');

    var me = card('phenotype-doll', '');
    hop(me.canvas);
    var story = element('p', 'phenotype-story');
    story.setAttribute('aria-live', 'polite');

    /* ---- the wardrobe ---- */
    var wardrobe = element('div', 'phenotype-wardrobe');
    var refresh = [];   // one function per control, to show what is on
    function row(label) {
      var line = element('div', 'phenotype-row');
      line.setAttribute('role', 'group');
      line.setAttribute('aria-label', label);
      line.append(element('span', 'phenotype-row-label', label));
      var choices = element('div', 'phenotype-row-choices');
      line.append(choices);
      wardrobe.append(line);
      return choices;
    }
    function control(parent, className, text, isOn, onClick) {
      var node = button(className, text);
      node.addEventListener('click', function () { onClick(); changed(); });
      refresh.push(function () { node.setAttribute('aria-pressed', isOn() ? 'true' : 'false'); });
      parent.append(node);
      return node;
    }
    function currentPaper() { return session.scheme != null ? session.scheme : D.schemeIndex(session.portrait); }

    var papers = row('Paper');
    D.SCHEMES.forEach(function (scheme, index) {
      var dot = control(papers, 'phenotype-swatch', '', function () { return currentPaper() === index; }, function () { session.scheme = index; });
      dot.setAttribute('aria-label', scheme.name + ' paper');
      dot.title = scheme.name;
      dot.style.background = scheme.sky;
    });
    var coats = row('Coat');
    D.COATS.forEach(function (colour) {
      var dot = control(coats, 'phenotype-swatch', '', function () { return session.wear.coat === colour; },
        function () { session.wear.coat = session.wear.coat === colour ? '' : colour; });
      dot.setAttribute('aria-label', 'Coat ' + colour);
      dot.style.background = colour;
    });
    // The skin tone is read from the photo, and light can fool that reading. Here the person
    // sets it themselves; pressing the chosen tone again goes back to the one that was read.
    var tones = row('Skin');
    SKIN_TONES.forEach(function (colour) {
      var dot = control(tones, 'phenotype-swatch', '', function () { return session.wear.skin === colour; },
        function () { session.wear.skin = session.wear.skin === colour ? '' : colour; });
      dot.setAttribute('aria-label', 'Skin tone ' + colour);
      dot.style.background = colour;
    });
    WARDROBE.forEach(function (entry) {
      var choices = row(entry.label);
      (entry.options || []).forEach(function (option) {
        control(choices, 'phenotype-chip', option[0], function () {
          var now = session.wear[entry.key];
          if (entry.key === 'beard') return option[1] === 0 ? now < D.STUBBLE : option[1] < D.FULL_BEARD ? now >= D.STUBBLE && now < D.FULL_BEARD : now >= D.FULL_BEARD;
          return (now === true ? 'round' : now) === option[1];
        }, function () {
          // A full beard keeps the density the photo showed, if it showed one.
          session.wear[entry.key] = entry.key === 'beard' && option[1] >= D.FULL_BEARD ? Math.max(session.measuredBeard, option[1]) : option[1];
          if (entry.key === 'glasses') delete session.wear.frame;   // the colour read from the photo belonged to the frame it had
        });
      });
      (entry.toggles || []).forEach(function (toggle) {
        control(choices, 'phenotype-chip', toggle[1], function () { return !!session.wear[toggle[0]]; },
          function () { session.wear[toggle[0]] = !session.wear[toggle[0]]; });
      });
    });

    var add = button('phenotype-button phenotype-primary', 'Make my doll');
    var save = button('phenotype-button', 'Save my doll');
    var share = button('phenotype-button', 'Send it');
    var surprise = button('phenotype-button', 'Surprise me');
    var picker = photoInput(root, onPhoto);
    var actions = element('div', 'phenotype-actions');
    actions.append(save, share, surprise, add, picker);

    var notes = element('p', 'phenotype-notes');
    notes.setAttribute('role', 'status');
    var privacy = element('p', 'phenotype-privacy',
      'The photo is read on this device and never leaves it. Nothing is uploaded, and nothing is kept.');

    root.append(me.figure, story, wardrobe, actions, notes, privacy);

    var assemble = false;   // the next drawing drops its pieces in, one after another
    function draw(blink) {
      var mine = !!session.portrait;
      if (mine) paint(me.canvas, session.portrait, wornPortrait({ blink: !!blink, assemble: assemble }));
      else paint(me.canvas, sample, { wear: sampleWear, scheme: samplePaper >= 0 ? samplePaper : null, blink: !!blink, label: 'The author of this page as a paper doll' });
      assemble = false;
      me.caption.textContent = mine ? 'You' : 'This one is me';
      story.textContent = mine
        ? 'Here you are, cut out of paper. Dress it, change its paper, and take it with you.'
        : 'Give this page a photo of a face, yours or anyone’s, and it draws that face as a paper doll.';
      wardrobe.hidden = save.hidden = surprise.hidden = !mine;
      share.hidden = !mine || !canSend();
      add.textContent = mine ? 'Try another photo' : 'Make my doll';
      add.classList.toggle('phenotype-primary', !mine);
      save.classList.toggle('phenotype-primary', mine);
      if (mine) refresh.forEach(function (show) { show(); });
    }

    function busy(on, message) {
      root.classList.toggle('phenotype-busy', on);
      add.disabled = on;
      if (message != null) notes.textContent = message;
    }

    function onPhoto(file) {
      return readPhoto(file, population, busy).then(function (result) {
        portray(result);
        assemble = !stillness;
        changed();
        confetti(me.figure);
        busy(false, result.notes.join(' '));
        track('phenotype_portrait', {});
      }).catch(function (error) { busy(false, failure(error)); });
    }

    add.addEventListener('click', function () { picker.click(); });
    surprise.addEventListener('click', function () {
      var keep = session.wear.beard;
      session.wear = plainWear(Math.random() < 0.6 ? keep : pick([0, 0.45, 0.9]));
      session.wear.glasses = pick([false, false, 'round', 'square', 'shades']);
      session.wear.hat = pick(['', '', 'beanie', 'bow', 'crown']);
      session.wear.coat = pick(D.COATS);
      session.wear.blush = Math.random() < 0.3;
      session.wear.freckles = Math.random() < 0.25;
      session.scheme = Math.floor(Math.random() * D.SCHEMES.length);
      assemble = !stillness;
      changed();
    });
    save.addEventListener('click', function () {
      download(session.portrait, wornPortrait(), 'phenotype-me');
      track('phenotype_save', { which: 'portrait' });
    });
    share.addEventListener('click', function () {
      send(session.portrait, wornPortrait(), 'phenotype-me');
      track('phenotype_send', {});
    });

    session.watchers.push(function () { draw(false); });
    blinking(root, draw);
    draw();
    // For the tests and the curious: the same functions the buttons use.
    root.phenotype = { session: session, onPhoto: onPhoto, draw: draw };
  }

  /* ---- part two: two faces, and the doll that is their child ---- */
  function mountMix(root, population) {
    var state = {
      a: null, b: null,   // each parent chosen here: { genome, wear }
      child: null, from: null,
      again: 0,           // which sibling: 0 is the first child of these two
      key: ''             // the parents and sibling the child on screen was made from
    };

    root.textContent = '';
    root.classList.add('phenotype-ready');

    function slot(name, caption) {
      var part = card('phenotype-parent', caption);
      var choose = button('phenotype-chip', 'Choose a photo');
      var picker = element('input');
      picker.type = 'file';
      picker.accept = 'image/*';
      picker.hidden = true;
      picker.addEventListener('change', function () {
        if (picker.files && picker.files[0]) onPhoto(name, picker.files[0]);
        picker.value = '';
      });
      choose.addEventListener('click', function () { picker.click(); });
      part.figure.append(choose, picker);
      part.choose = choose;
      return part;
    }
    var first = slot('a', 'First face'), second = slot('b', 'Second face');
    var parents = element('div', 'phenotype-parents phenotype-mix');
    parents.append(first.figure, element('span', 'phenotype-plus', '+'), second.figure);

    var child = card('phenotype-doll', '');
    hop(child.canvas);
    var story = element('p', 'phenotype-story');
    story.setAttribute('aria-live', 'polite');

    var again = button('phenotype-button', 'Mix again');
    var save = button('phenotype-button phenotype-primary', 'Save the child');
    var share = button('phenotype-button', 'Send it');
    var actions = element('div', 'phenotype-actions');
    actions.append(save, share, again);

    var notes = element('p', 'phenotype-notes');
    notes.setAttribute('role', 'status');
    var privacy = element('p', 'phenotype-privacy',
      'Both photos are read on this device and never leave it. Nothing is uploaded, and nothing is kept.');

    root.append(parents, child.figure, story, actions, notes, privacy);

    /* The first place takes the doll made above, dressed as it is, until a photo is chosen for it. */
    function parent(name) {
      if (state[name]) return { genome: state[name].genome, options: { wear: state[name].wear }, own: false };
      if (name === 'a' && session.portrait) return { genome: session.portrait, options: wornPortrait(), own: true };
      return null;
    }

    function draw(blink) {
      var a = parent('a'), b = parent('b');
      [[first, a, 'First face'], [second, b, 'Second face']].forEach(function (entry) {
        var part = entry[0], who = entry[1];
        if (who) {
          var options = { blink: !!blink, label: entry[2] + ' as a paper doll' };
          Object.keys(who.options).forEach(function (key) { options[key] = who.options[key]; });
          paint(part.canvas, who.genome, options);
        } else {
          part.canvas.innerHTML = '<div class="phenotype-empty" aria-hidden="true">?</div>';
        }
        part.caption.textContent = who && who.own ? 'Your doll' : entry[2];
        part.choose.textContent = who ? 'Change photo' : 'Choose a photo';
      });

      var born = false;
      if (a && b) {
        var key = G.encode(a.genome) + G.encode(b.genome) + state.again;
        if (key !== state.key) {
          var outcome = G.inherit(a.genome, b.genome, state.again);
          state.child = outcome.child; state.from = outcome.from; state.key = key;
          born = true;
        }
      } else {
        state.child = null; state.from = null; state.key = '';
      }

      if (state.child) {
        paint(child.canvas, state.child, { blink: !!blink, assemble: born && !stillness, label: 'The child of the two faces, as a paper doll' });
        var mine = a.own ? 'your ' : 'the first face’s ';
        story.textContent = 'It has ' + mine + G.inheritedWords(state.from, 'doll') + ', and the second face’s ' +
          G.inheritedWords(state.from, 'visitor') + '. Its skin is halfway between the two.';
        if (born) { confetti(child.figure); track('phenotype_mix', { again: state.again }); }
      } else {
        // Until there are two faces, the place of the child is kept by a small robot: nobody yet.
        paint(child.canvas, G.resident(), { blink: !!blink, label: 'A small robot, nobody yet' });
        story.textContent = a ? 'Your doll is in. Choose a second face, and this doll becomes the child of the two.'
          : 'Choose two faces, and this doll becomes their child: half of the features of each.';
      }
      child.caption.textContent = state.child ? 'Their child' : 'Nobody yet';
      again.hidden = save.hidden = !state.child;
      share.hidden = !state.child || !canSend();
    }

    function busy(on, message) {
      root.classList.toggle('phenotype-busy', on);
      first.choose.disabled = second.choose.disabled = on;
      if (message != null) notes.textContent = message;
    }

    function onPhoto(name, file) {
      return readPhoto(file, population, busy).then(function (result) {
        state[name] = { genome: result.genome, wear: wearFrom(result) };
        state.again = 0;
        busy(false, result.notes.join(' '));
        draw();
      }).catch(function (error) { busy(false, failure(error)); });
    }

    // A photo dropped on this part goes to the first place that is free, or replaces the second.
    root.addEventListener('dragover', function (event) { event.preventDefault(); });
    root.addEventListener('drop', function (event) {
      event.preventDefault();
      var file = event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0];
      if (file) onPhoto(parent('a') ? 'b' : 'a', file);
    });

    again.addEventListener('click', function () { state.again += 1; draw(); });
    save.addEventListener('click', function () {
      download(state.child, {}, 'phenotype-child');
      track('phenotype_save', { which: 'child' });
    });
    share.addEventListener('click', function () { send(state.child, {}, 'phenotype-child'); });

    session.watchers.push(function () { draw(false); });
    blinking(root, draw);
    draw();
    // For the tests and the curious: the same functions the buttons use.
    root.phenotype = { state: state, session: session, onPhoto: onPhoto, draw: draw };
  }

  /* The specimen sheet (layouts/_shortcodes/phenotype-specimens.html): dolls read from faces
     that belong to nobody, each written in the page as its 54 characters. */
  function specimens(root) {
    var codes = (root.getAttribute('data-dolls') || '').split(/\s+/).filter(Boolean);
    root.textContent = '';
    root.classList.add('phenotype-ready');
    codes.forEach(function (entry, index) {
      // code, then optional marks: g = glasses, b = beard, s = stubble.
      var parts = entry.split(':'), genome = G.decode(parts[0]), marks = parts[1] || '';
      if (!genome) return;
      var canvas = element('div', 'phenotype-art');
      paint(canvas, genome, { scheme: index, label: 'A paper doll read from a face that belongs to nobody',
        wear: { glasses: marks.indexOf('g') >= 0, beard: marks.indexOf('b') >= 0 ? 0.9 : marks.indexOf('s') >= 0 ? 0.45 : 0 } });
      root.append(canvas);
    });
  }

  function start() {
    var block = document.getElementById('phenotype-population');
    if (!block || !G || !D || !M) return;
    var population = JSON.parse(block.textContent);
    Array.prototype.forEach.call(document.querySelectorAll('[data-phenotype="me"]'), function (root) { mountMe(root, population); });
    Array.prototype.forEach.call(document.querySelectorAll('[data-phenotype="mix"]'), function (root) { mountMix(root, population); });
    Array.prototype.forEach.call(document.querySelectorAll('[data-phenotype="specimens"]'), specimens);
    if (!stillness) watchPointer();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
