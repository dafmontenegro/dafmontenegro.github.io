/* preflop.js — the Texas Hold'em preflop tools.
 *
 * Loaded only by pages that set `preflop` in their front matter. Everything
 * drawn here comes from assets/data/preflop/hands.json, produced by the engine
 * at github.com/dafmontenegro/holdem-preflop-equity and documented field by
 * field in that repository's web/DATA_DICTIONARY.md. No number is computed
 * here that is not either in that file or a formula this page states in full.
 *
 * HOW THE PAGE IS PUT TOGETHER
 * ----------------------------
 * Several tools sit at different points in the article, and they share one
 * download. Each is a `<div data-preflop="name">` written by its own Hugo
 * shortcode; this script fetches the data once and builds whichever ones the
 * page asked for. The head-to-head matrix is ten times the size of everything
 * else and only one tool needs it, so it is fetched the first time that tool
 * is used and not before.
 *
 * WHAT IS DECIDED HERE, AND WHY
 * -----------------------------
 * ONE HUE, LIGHT TO DARK. Colour encodes magnitude, so the ramp is a single
 * hue. Not a rainbow, which invents categories the data does not have, and not
 * red-to-green, which roughly one man in twelve cannot read. The dark-theme
 * ramp is its own validated set of steps rather than the light one lightened,
 * which is why a theme change re-renders instead of letting the browser flip
 * anything.
 *
 * NO NUMBER IN THE CELLS. A value printed in all 169 cells is unreadable at
 * that density, so a cell carries its hand's name, which is identity. The
 * value is one hover, one tap or one arrow key away, and all 169 are in the
 * table underneath. That table is not a courtesy: a continuous colour scale
 * cannot be read by everyone, so every value the colour carries exists as
 * text.
 *
 * PANELS, NOT FLOATING TOOLTIPS. A tooltip that follows the pointer has
 * nowhere to go on a phone and nothing to say to a keyboard. A panel in fixed
 * position shows a mouse, a finger and an arrow key the same thing.
 *
 * THE ALL-IN NUMBERS ARE COMPUTED, NOT LOOKED UP. Every one is two lines of
 * arithmetic over figures already downloaded, so the page does the arithmetic
 * while the reader moves the stack, and shows the formula it used.
 */

(function () {
  "use strict";

  /* =====================================================================
   * Constants
   * ================================================================== */

  var RANKS = "AKQJT98765432";
  var SUITS = [
    { letter: "s", symbol: "♠", name: "spades" },
    { letter: "h", symbol: "♥", name: "hearts" },
    { letter: "d", symbol: "♦", name: "diamonds" },
    { letter: "c", symbol: "♣", name: "clubs" }
  ];

  /* Named steps of one blue scale. Light theme runs light-to-dark on a white
   * surface; the dark theme ramp runs the other way on a slate surface, so in
   * both the end nearest the surface means "least" and the far end "most".
   * Each was checked against its own surface rather than assumed from the
   * other. */
  var RAMPS = {
    light: ["#cde2fb", "#b7d3f6", "#9ec5f4", "#86b6ef", "#6da7ec", "#5598e7",
            "#3987e5", "#2a78d6", "#256abf", "#1c5cab", "#184f95", "#104281"],
    dark: ["#104281", "#184f95", "#1c5cab", "#256abf", "#2a78d6", "#3987e5",
           "#5598e7", "#6da7ec", "#86b6ef", "#9ec5f4", "#b7d3f6", "#cde2fb"]
  };

  /* Stack depths the all-in tool offers, in big blinds. The short end is where
   * push-or-fold actually lives; 100 is there to show the required equity
   * converging on one half. */
  var STACKS = [5, 8, 10, 12, 15, 20, 25, 30, 40, 50, 75, 100];

  /* =====================================================================
   * Small helpers
   * ================================================================== */

  function element(tag, className, text) {
    var node = document.createElement(tag);
    if (className) { node.className = className; }
    if (text !== undefined) { node.textContent = text; }
    return node;
  }

  function percent(value, scale, places) {
    return (value / scale * 100).toFixed(places === undefined ? 1 : places) + "%";
  }

  function signed(value, places) {
    return (value >= 0 ? "+" : "−") + Math.abs(value).toFixed(places);
  }

  /* Where a hand sits in the conventional grid: pairs on the diagonal, same
   * suit above it, different suits below. Worth more than any strength-sorted
   * arrangement, because a reader who knows poker can already find a hand. */
  function position(hand) {
    var high = RANKS.indexOf(hand.charAt(0));
    var low = RANKS.indexOf(hand.charAt(1));

    if (hand.length === 2) { return { row: high, column: high }; }
    if (hand.charAt(2) === "s") {
      return { row: Math.min(high, low), column: Math.max(high, low) };
    }
    return { row: Math.max(high, low), column: Math.min(high, low) };
  }

  /* The hand type two concrete cards make, e.g. "As" + "Kh" -> "AKo". */
  function handOf(first, second) {
    var highIndex = Math.min(RANKS.indexOf(first.charAt(0)),
                             RANKS.indexOf(second.charAt(0)));
    var lowIndex = Math.max(RANKS.indexOf(first.charAt(0)),
                            RANKS.indexOf(second.charAt(0)));

    if (highIndex === lowIndex) { return RANKS.charAt(highIndex) + RANKS.charAt(highIndex); }
    return RANKS.charAt(highIndex) + RANKS.charAt(lowIndex) +
      (first.charAt(1) === second.charAt(1) ? "s" : "o");
  }

  function currentRamp() {
    return document.documentElement.classList.contains("dark")
      ? RAMPS.dark : RAMPS.light;
  }

  function hexToRgb(hex) {
    return [parseInt(hex.slice(1, 3), 16),
            parseInt(hex.slice(3, 5), 16),
            parseInt(hex.slice(5, 7), 16)];
  }

  /* A colour from the ramp, interpolated between its named steps. */
  function shade(fraction, ramp) {
    var clamped = Math.max(0, Math.min(1, fraction));
    var scaled = clamped * (ramp.length - 1);
    var first = Math.floor(scaled);
    var second = Math.min(first + 1, ramp.length - 1);
    var mix = scaled - first;
    var a = hexToRgb(ramp[first]);
    var b = hexToRgb(ramp[second]);

    return "rgb(" + Math.round(a[0] + (b[0] - a[0]) * mix) + "," +
      Math.round(a[1] + (b[1] - a[1]) * mix) + "," +
      Math.round(a[2] + (b[2] - a[2]) * mix) + ")";
  }

  function onThemeChange(handler) {
    new MutationObserver(handler).observe(document.documentElement,
      { attributes: true, attributeFilter: ["class"] });
  }

  /* A labelled control. Every tool's controls sit in one row above everything
   * they scope, never one set per panel. */
  function control(parent, labelText, options, onChange) {
    var wrap = element("label", "preflop-control");
    wrap.appendChild(element("span", null, labelText));

    var select = element("select");
    options.forEach(function (option) {
      var node = element("option", null, option.label);
      node.value = option.value;
      select.appendChild(node);
    });
    select.addEventListener("change", onChange);

    wrap.appendChild(select);
    parent.appendChild(wrap);
    return select;
  }

  function figures(parent, entries) {
    var list = element("dl", "preflop-figures");
    entries.forEach(function (entry) {
      var wrap = element("div", "preflop-figure");
      wrap.appendChild(element("dt", null, entry.term));
      var value = element("dd", null, entry.value);
      if (entry.note) {
        value.appendChild(element("span", "preflop-figure-note", entry.note));
      }
      wrap.appendChild(value);
      list.appendChild(wrap);
    });
    parent.textContent = "";
    parent.appendChild(list);
  }

  /* =====================================================================
   * Module: the 13 x 13 grid
   * ================================================================== */

  /* Each metric says how to read a value off a hand's record, how to caption
   * it, and whether it is exact or estimated. Nothing is shown without that
   * last part being said. */
  function gridMetrics(meta) {
    var metrics = [];

    for (var n = 1; n <= 8; n++) {
      metrics.push({
        id: "opponents-" + n,
        group: "Equity against random hands",
        label: n === 1 ? "1 opponent" : n + " opponents",
        read: (function (i) {
          return function (hand) { return hand.equityVsOpponents[i]; };
        })(n - 1),
        error: (function (i) {
          return function (hand) { return hand.equityVsOpponentsError[i]; };
        })(n - 1),
        exact: false,
        caption: "Share of the pot against " + n +
          (n === 1 ? " opponent" : " opponents") + " holding random hands."
      });
    }

    /* The fair share: what a hand is worth measured against what any hand
     * would be worth at that table. Above 1 means the hand is pulling more
     * than its weight. This is the one metric here that is a ratio rather
     * than a probability, so it is formatted differently. */
    for (var m = 1; m <= 8; m++) {
      metrics.push({
        id: "fairshare-" + m,
        group: "Fair share",
        label: (m + 1) + " players",
        read: (function (i, players) {
          return function (hand) {
            return hand.equityVsOpponents[i] * players;
          };
        })(m - 1, m + 1),
        exact: false,
        ratio: true,
        caption: "Equity divided by an equal share of the pot, at a table of " +
          (m + 1) + ". Above 1.00 the hand is worth more than its seat."
      });
    }

    meta.rangePercents.forEach(function (percentage, index) {
      metrics.push({
        id: "range-" + percentage,
        group: "Equity against a range",
        label: "Opponent plays top " + percentage + "%",
        read: function (hand) { return hand.equityVsRanges[index]; },
        exact: true,
        caption: "Share of the pot against one opponent playing only the " +
          "strongest " + percentage + "% of hands."
      });
    });

    meta.categoryNames.forEach(function (name, index) {
      if (index < 2) { return; }      /* high card and one pair say little */
      metrics.push({
        id: "potential-" + index,
        group: "Potential: how often you make",
        label: name.charAt(0).toUpperCase() + name.slice(1) + " or better",
        read: function (hand) {
          var total = 0;
          for (var i = index; i < hand.potential.length; i++) {
            total += hand.potential[i];
          }
          return total;
        },
        exact: true,
        caption: "How often your five best cards finish as " + name +
          " or better. Not the chance of winning: a category the whole table " +
          "shares is worth nothing."
      });
    });

    return metrics;
  }

  function buildGrid(root, data) {
    var scale = data.meta.scale;
    var hands = data.hands;
    var byHand = data.byHand;
    var metrics = gridMetrics(data.meta);
    var metric = metrics[0];
    var selected = "AA";

    var controls = element("div", "preflop-controls");
    root.appendChild(controls);

    var wrap = element("label", "preflop-control");
    wrap.appendChild(element("span", null, "Shade the grid by"));
    var select = element("select");
    var groups = {};
    metrics.forEach(function (entry) {
      if (!groups[entry.group]) {
        groups[entry.group] = element("optgroup");
        groups[entry.group].label = entry.group;
        select.appendChild(groups[entry.group]);
      }
      var option = element("option", null, entry.label);
      option.value = entry.id;
      groups[entry.group].appendChild(option);
    });
    wrap.appendChild(select);
    controls.appendChild(wrap);

    var grid = element("div", "preflop-grid");
    grid.setAttribute("role", "group");
    grid.setAttribute("aria-label",
      "All 169 Texas Hold'em starting hands. Rows and columns run from ace " +
      "down to two; pairs lie on the diagonal, same-suit hands above it, " +
      "different-suit hands below.");

    var cells = {};
    hands.forEach(function (hand) {
      var where = position(hand.hand);
      var cell = element("button", "preflop-cell", hand.hand);
      cell.type = "button";
      cell.style.gridRow = where.row + 1;
      cell.style.gridColumn = where.column + 1;
      cell.setAttribute("aria-pressed", "false");
      cell.addEventListener("mouseenter", function () { show(hand.hand); });
      cell.addEventListener("focus", function () { show(hand.hand); });
      cell.addEventListener("click", function () { choose(hand.hand); });
      cells[hand.hand] = cell;
      grid.appendChild(cell);
    });
    root.appendChild(grid);

    var legend = element("div", "preflop-legend");
    var legendLow = element("span");
    var legendBar = element("div", "preflop-legend-bar");
    var legendHigh = element("span");
    legend.appendChild(legendLow);
    legend.appendChild(legendBar);
    legend.appendChild(legendHigh);
    root.appendChild(legend);

    var caption = element("p", "preflop-sheet-note");
    root.appendChild(caption);

    var sheet = element("div", "preflop-sheet");
    var sheetHand = element("p", "preflop-sheet-hand");
    var sheetFigures = element("div");
    sheet.appendChild(sheetHand);
    sheet.appendChild(sheetFigures);
    root.appendChild(sheet);

    var details = element("details", "preflop-table-toggle");
    details.appendChild(element("summary", null, "Read all 169 as a table"));
    var tableWrap = element("div", "preflop-table-wrap");
    var table = element("table", "preflop-table");
    tableWrap.appendChild(table);
    details.appendChild(tableWrap);
    root.appendChild(details);

    function format(value) {
      return metric.ratio ? (value / scale).toFixed(2) : percent(value, scale, 2);
    }

    function paint() {
      var ramp = currentRamp();
      var lowest = Infinity, highest = -Infinity;
      hands.forEach(function (hand) {
        var value = metric.read(hand);
        if (value < lowest) { lowest = value; }
        if (value > highest) { highest = value; }
      });
      var width = highest - lowest || 1;

      hands.forEach(function (hand) {
        var fraction = (metric.read(hand) - lowest) / width;
        var cell = cells[hand.hand];
        cell.style.backgroundColor = shade(fraction, ramp);
        cell.style.color = fraction > 0.55
          ? "var(--pf-on-pale)" : "var(--pf-on-deep)";
        cell.setAttribute("aria-label",
          hand.hand + ", " + metric.label + ": " + format(metric.read(hand)));
      });

      legendBar.style.background =
        "linear-gradient(to right," + ramp.join(",") + ")";
      legendLow.textContent = format(lowest);
      legendHigh.textContent = format(highest);
      caption.textContent = metric.caption + " " + (metric.exact
        ? "Exact: every possible board counted."
        : "Estimated by simulation; the panel below gives the error.");
    }

    function show(name) {
      var hand = byHand[name];
      var error = metric.error ? metric.error(hand) : null;

      sheetHand.textContent = hand.hand;
      figures(sheetFigures, [
        {
          term: metric.label,
          value: format(metric.read(hand)),
          note: error ? "± " + percent(error, scale, 2) +
            " (one standard error)" : "exact"
        },
        {
          term: "Rank of 169",
          value: String(hand.rank),
          note: "top " + percent(hand.percentile, scale) + " of all hands"
        },
        {
          term: "Against one random hand",
          value: percent(hand.equityVsRandom, scale, 2),
          note: "wins " + percent(hand.winVsRandom, scale) + ", ties " +
            percent(hand.tieVsRandom, scale)
        },
        {
          term: "Opponent hands that beat it",
          value: hand.opponentHands.beatYou + " of 1,225",
          note: hand.opponentHands.splitWithYou + " split, " +
            hand.opponentHands.loseToYou + " lose"
        }
      ]);
    }

    function choose(name) {
      if (cells[selected]) {
        cells[selected].setAttribute("aria-pressed", "false");
      }
      selected = name;
      cells[name].setAttribute("aria-pressed", "true");
      show(name);
    }

    function buildTable() {
      table.textContent = "";
      var head = element("thead");
      var headRow = element("tr");
      ["Hand", "Rank", metric.label, "Against one random hand"]
        .forEach(function (text) {
          var th = element("th", null, text);
          th.scope = "col";
          headRow.appendChild(th);
        });
      head.appendChild(headRow);
      table.appendChild(head);

      var body = element("tbody");
      hands.forEach(function (hand) {
        var row = element("tr");
        [hand.hand, String(hand.rank), format(metric.read(hand)),
         percent(hand.equityVsRandom, scale, 2)].forEach(function (text, index) {
          var cell = element(index === 0 ? "th" : "td", null, text);
          if (index === 0) { cell.scope = "row"; }
          row.appendChild(cell);
        });
        body.appendChild(row);
      });
      table.appendChild(body);
    }

    select.addEventListener("change", function () {
      metrics.forEach(function (entry) {
        if (entry.id === select.value) { metric = entry; }
      });
      paint();
      show(selected);
      if (details.open) { buildTable(); }
    });
    details.addEventListener("toggle", function () {
      if (details.open) { buildTable(); }
    });

    onThemeChange(paint);
    paint();
    choose(selected);
  }

  /* =====================================================================
   * Module: pick two real cards
   * ================================================================== */

  /* The grid works in hand types; a player holds two specific cards. This
   * turns one into the other, which is also the clearest way to show what the
   * suits do and do not change: swap a suit and the figures below move only
   * when the two cards stop matching. */
  function buildPicker(root, data) {
    var scale = data.meta.scale;
    var chosen = [];

    var instructions = element("p", "preflop-sheet-note",
      "Choose two cards. Suits matter only in whether they match: every " +
      "same-suit combination of two ranks has identical odds, which is why " +
      "1,326 possible hands collapse to 169 kinds.");
    root.appendChild(instructions);

    var deck = element("div", "preflop-deck");
    var buttons = {};

    SUITS.forEach(function (suit) {
      var row = element("div", "preflop-deck-row");
      row.setAttribute("role", "group");
      row.setAttribute("aria-label", suit.name);

      RANKS.split("").forEach(function (rank) {
        var code = rank + suit.letter;
        var button = element("button", "preflop-card");
        button.type = "button";
        button.dataset.suit = suit.letter;
        button.setAttribute("aria-pressed", "false");
        button.setAttribute("aria-label",
          rank + " of " + suit.name);
        button.appendChild(element("span", "preflop-card-rank", rank));
        button.appendChild(element("span", "preflop-card-suit", suit.symbol));
        button.addEventListener("click", function () { toggle(code); });
        buttons[code] = button;
        row.appendChild(button);
      });
      deck.appendChild(row);
    });
    root.appendChild(deck);

    var sheet = element("div", "preflop-sheet");
    var sheetHand = element("p", "preflop-sheet-hand");
    var sheetNote = element("p", "preflop-sheet-note");
    var sheetFigures = element("div");
    sheet.appendChild(sheetHand);
    sheet.appendChild(sheetNote);
    sheet.appendChild(sheetFigures);
    root.appendChild(sheet);

    function toggle(code) {
      var at = chosen.indexOf(code);
      if (at >= 0) {
        chosen.splice(at, 1);
      } else {
        if (chosen.length === 2) {
          buttons[chosen[0]].setAttribute("aria-pressed", "false");
          chosen.shift();
        }
        chosen.push(code);
      }
      Object.keys(buttons).forEach(function (key) {
        buttons[key].setAttribute("aria-pressed",
          chosen.indexOf(key) >= 0 ? "true" : "false");
      });
      render();
    }

    function render() {
      if (chosen.length < 2) {
        sheetHand.textContent = chosen.length === 1
          ? "One more card" : "Choose two cards";
        sheetNote.textContent = "";
        sheetFigures.textContent = "";
        return;
      }

      var name = handOf(chosen[0], chosen[1]);
      var hand = data.byHand[name];
      var suited = chosen[0].charAt(1) === chosen[1].charAt(1);

      sheetHand.textContent = chosen[0].charAt(0) +
        SUITS.filter(function (s) { return s.letter === chosen[0].charAt(1); })[0].symbol +
        " " + chosen[1].charAt(0) +
        SUITS.filter(function (s) { return s.letter === chosen[1].charAt(1); })[0].symbol +
        "  —  " + name;

      sheetNote.textContent = "Ranked " + hand.rank + " of 169. " +
        (hand.combos === 6 ? "A pocket pair: 6 of the 1,326 possible hands."
         : suited ? "Same suit: 4 of the 1,326 possible hands."
         : "Different suits: 12 of the 1,326 possible hands.");

      var improvement = hand.improvement;
      figures(sheetFigures, [
        {
          term: "Against 1 opponent",
          value: percent(hand.equityVsRandom, scale, 2),
          note: "exact · wins " + percent(hand.winVsRandom, scale) +
            ", ties " + percent(hand.tieVsRandom, scale)
        },
        {
          term: "Against 8 opponents",
          value: percent(hand.equityVsOpponents[7], scale, 2),
          note: "± " + percent(hand.equityVsOpponentsError[7], scale, 2) +
            " · fair share is " + (100 / 9).toFixed(1) + "%"
        },
        {
          term: "Against a top 10% opponent",
          value: percent(hand.equityVsRanges[1], scale, 2),
          note: "exact"
        },
        {
          term: "Hands that beat it",
          value: hand.opponentHands.beatYou + " of 1,225",
          note: "median equity " +
            percent(hand.opponentHands.medianEquity, scale) +
            ", worst " + percent(hand.opponentHands.lowestEquity, scale)
        },
        {
          term: "Makes a straight or better",
          value: percent(hand.potential[4] + hand.potential[5] +
            hand.potential[6] + hand.potential[7] + hand.potential[8], scale, 2),
          note: "exact"
        },
        {
          term: "Your cards beat the board",
          value: percent(improvement[0] + improvement[1], scale, 1),
          note: "better category " + percent(improvement[0], scale) +
            ", bigger combination " + percent(improvement[1], scale)
        }
      ]);
    }

    render();
  }

  /* =====================================================================
   * Module: one hand against another
   * ================================================================== */

  function buildHeadsUp(root, data) {
    var scale = data.meta.scale;
    var ordered = data.hands.slice().sort(function (a, b) {
      return a.rank - b.rank;
    });
    var options = ordered.map(function (hand) {
      return { value: hand.hand, label: hand.hand + "  (rank " + hand.rank + ")" };
    });

    var controls = element("div", "preflop-controls");
    var heroSelect = control(controls, "Your hand", options, update);
    var villainSelect = control(controls, "Their hand", options, update);
    villainSelect.value = "KK";
    root.appendChild(controls);

    var note = element("p", "preflop-sheet-note",
      "Exact: every one of the 1,712,304 possible boards for this matchup, " +
      "counted. Wins, ties and losses are reported separately because they " +
      "are different outcomes — a tie pays half, not nothing.");
    root.appendChild(note);

    var sheet = element("div", "preflop-sheet");
    var sheetHand = element("p", "preflop-sheet-hand");
    var sheetFigures = element("div");
    sheet.appendChild(sheetHand);
    sheet.appendChild(sheetFigures);
    root.appendChild(sheet);

    var matrix = null;
    var loading = false;

    function update() {
      if (!matrix) {
        if (!loading) { load(); }
        return;
      }
      draw();
    }

    function load() {
      loading = true;
      sheetHand.textContent = "Loading the matrix…";
      data.loadMatrix().then(function (loaded) {
        matrix = loaded;
        draw();
      }).catch(function () {
        sheetHand.textContent = "The matrix could not be loaded.";
        sheetFigures.textContent = "";
      });
    }

    function draw() {
      var hero = heroSelect.value;
      var villain = villainSelect.value;
      var i = matrix.index[hero] * 169 + matrix.index[villain];
      var win = matrix.win[i];
      var tie = matrix.tie[i];
      var lose = scale - win - tie;
      var equity = win + tie / 2;

      sheetHand.textContent = hero + "  vs  " + villain;
      figures(sheetFigures, [
        { term: "Your equity", value: percent(equity, scale, 2),
          note: "wins plus half the ties" },
        { term: "You win", value: percent(win, scale, 2) },
        { term: "Split pot", value: percent(tie, scale, 2) },
        { term: "You lose", value: percent(lose, scale, 2) }
      ]);
    }

    load();
  }

  /* =====================================================================
   * Module: the all-in decision
   * ================================================================== */

  /* Nothing here is looked up. The situation is heads-up, blind against blind,
   * both players holding the same stack of S big blinds, and the whole model
   * is the two lines of arithmetic printed on screen. Money is counted in
   * expected final stacks, which sidesteps every argument about whether a
   * posted blind is still yours. */
  function buildAllIn(root, data) {
    var scale = data.meta.scale;
    var ordered = data.hands.slice().sort(function (a, b) { return a.rank - b.rank; });

    var controls = element("div", "preflop-controls");
    var handSelect = control(controls,
      "Your hand",
      ordered.map(function (hand) {
        return { value: hand.hand, label: hand.hand + "  (rank " + hand.rank + ")" };
      }), update);
    handSelect.value = "AKo";

    var rangeSelect = control(controls,
      "They move in with",
      data.meta.rangePercents.map(function (p, i) {
        return { value: String(i), label: "the top " + p + "% of hands" };
      }), update);
    rangeSelect.value = "2";

    var stackSelect = control(controls,
      "Effective stack",
      STACKS.map(function (s) {
        return { value: String(s), label: s + " big blinds" };
      }), update);
    stackSelect.value = "20";
    root.appendChild(controls);

    var verdict = element("p", "preflop-verdict");
    root.appendChild(verdict);

    var sheet = element("div", "preflop-sheet");
    var sheetFigures = element("div");
    sheet.appendChild(sheetFigures);
    root.appendChild(sheet);

    var workings = element("pre", "preflop-workings");
    root.appendChild(workings);

    function update() {
      var hand = data.byHand[handSelect.value];
      var rangeIndex = parseInt(rangeSelect.value, 10);
      var stack = parseInt(stackSelect.value, 10);

      var equity = hand.equityVsRanges[rangeIndex] / scale;
      var required = (stack - 1) / (2 * stack);
      var value = 2 * stack * equity - (stack - 1);

      verdict.textContent = value > 0
        ? "Calling makes money: " + signed(value, 3) + " big blinds."
        : "Calling loses money: " + signed(value, 3) + " big blinds. Fold.";
      verdict.dataset.good = value > 0 ? "true" : "false";

      figures(sheetFigures, [
        { term: "Your equity", value: (equity * 100).toFixed(2) + "%",
          note: "exact, against the top " +
            data.meta.rangePercents[rangeIndex] + "%" },
        { term: "Equity you need", value: (required * 100).toFixed(2) + "%",
          note: "at " + stack + " big blinds" },
        { term: "Margin", value: signed((equity - required) * 100, 2) + " pp" },
        { term: "Worth", value: signed(value, 3) + " bb",
          note: "against folding" }
      ]);

      workings.textContent =
        "You are the big blind. They are all-in for " + stack + " bb.\n" +
        "Folding leaves you " + (stack - 1) + " bb. Calling costs " +
        (stack - 1) + " more and plays for a pot of " + (2 * stack) + ".\n\n" +
        "  equity needed  = (S - 1) / (2S)\n" +
        "                 = (" + stack + " - 1) / " + (2 * stack) +
        "  =  " + (required * 100).toFixed(2) + "%\n\n" +
        "  worth of a call = 2S*q - (S - 1)\n" +
        "                  = " + (2 * stack) + " × " +
        equity.toFixed(4) + " - " + (stack - 1) + "\n" +
        "                  = " + signed(value, 3) + " big blinds\n\n" +
        "Never 50%: the blinds are already in the pot, and the shorter the\n" +
        "stacks the larger a share of it they are.";
    }

    update();
  }

  /* =====================================================================
   * Module: the trainer
   * ================================================================== */

  /* Deals a hand and asks for a decision. Hands are drawn in proportion to how
   * many of the 1,326 they stand for, so AKo turns up three times as often as
   * AKs, exactly as it would at a table. Drawing uniformly from the 169 types
   * would quietly over-deal pairs by a factor of two.
   *
   * The yardstick is the fair share: at a table of n+1 players an average hand
   * is worth 1/(n+1) of the pot, so a hand worth more than that is one worth
   * playing. That is a deliberately crude standard and the feedback says so:
   * position, stack depth and what the other players do are all outside it.
   *
   * The streak is kept in this browser and nowhere else. */
  function buildTrainer(root, data) {
    var scale = data.meta.scale;
    var STORAGE = "preflop-trainer";

    var pool = [];
    data.hands.forEach(function (hand) {
      for (var i = 0; i < hand.combos; i++) { pool.push(hand); }
    });

    var controls = element("div", "preflop-controls");
    var tableSelect = control(controls, "Players at the table",
      [2, 3, 4, 5, 6, 7, 8, 9].map(function (players) {
        return { value: String(players), label: players + " players" };
      }), function () { deal(); });
    tableSelect.value = "6";
    root.appendChild(controls);

    var sheet = element("div", "preflop-sheet");
    var dealt = element("p", "preflop-sheet-hand");
    var prompt = element("p", "preflop-sheet-note");
    var actions = element("div", "preflop-actions");
    var playButton = element("button", "preflop-action", "Play it");
    var foldButton = element("button", "preflop-action", "Fold");
    var nextButton = element("button", "preflop-action", "Next hand");
    playButton.type = foldButton.type = nextButton.type = "button";
    actions.appendChild(playButton);
    actions.appendChild(foldButton);
    actions.appendChild(nextButton);
    var feedback = element("p", "preflop-feedback");
    var score = element("p", "preflop-sheet-note");
    sheet.appendChild(dealt);
    sheet.appendChild(prompt);
    sheet.appendChild(actions);
    sheet.appendChild(feedback);
    sheet.appendChild(score);
    root.appendChild(sheet);

    var current = null;
    var tally = load();

    function load() {
      try {
        var saved = window.localStorage.getItem(STORAGE);
        if (saved) { return JSON.parse(saved); }
      } catch (error) { /* private window, or storage turned off */ }
      return { right: 0, total: 0, streak: 0, best: 0 };
    }

    function save() {
      try {
        window.localStorage.setItem(STORAGE, JSON.stringify(tally));
      } catch (error) { /* nothing to do, and nothing lost that matters */ }
    }

    function deal() {
      current = pool[Math.floor(Math.random() * pool.length)];
      var suits = dealSuits(current);

      dealt.textContent = suits;
      prompt.textContent = "At a table of " + tableSelect.value +
        ", is this hand worth more than an equal share of the pot?";
      feedback.textContent = "";
      feedback.dataset.good = "";
      playButton.disabled = foldButton.disabled = false;
      nextButton.hidden = true;
      showScore();
    }

    /* A plausible pair of suited or offsuit cards for the dealt type, picked
     * only so the reader sees cards rather than a code. */
    function dealSuits(hand) {
      var first = SUITS[Math.floor(Math.random() * 4)];
      var second = first;
      if (hand.hand.length === 2 || hand.hand.charAt(2) === "o") {
        while (second === first) {
          second = SUITS[Math.floor(Math.random() * 4)];
        }
      }
      return hand.hand.charAt(0) + first.symbol + "  " +
        hand.hand.charAt(1) + second.symbol;
    }

    function answer(played) {
      var players = parseInt(tableSelect.value, 10);
      var equity = current.equityVsOpponents[players - 2] / scale;
      var share = 1 / players;
      var worthPlaying = equity > share;
      var right = played === worthPlaying;

      tally.total++;
      if (right) {
        tally.right++;
        tally.streak++;
        if (tally.streak > tally.best) { tally.best = tally.streak; }
      } else {
        tally.streak = 0;
      }
      save();

      feedback.textContent = (right ? "Right. " : "Not quite. ") +
        current.hand + " is worth " + (equity * 100).toFixed(2) +
        "% at a table of " + players + ", against an equal share of " +
        (share * 100).toFixed(2) + "%. " +
        (worthPlaying ? "It pulls more than its seat." : "It does not.");
      feedback.dataset.good = right ? "true" : "false";

      playButton.disabled = foldButton.disabled = true;
      nextButton.hidden = false;
      showScore();
    }

    function showScore() {
      score.textContent = tally.total
        ? tally.right + " of " + tally.total + " right · streak " +
          tally.streak + " · best " + tally.best +
          " · kept in this browser only"
        : "Nothing is sent anywhere; your streak is kept in this browser only.";
    }

    playButton.addEventListener("click", function () { answer(true); });
    foldButton.addEventListener("click", function () { answer(false); });
    nextButton.addEventListener("click", deal);

    deal();
  }

  /* =====================================================================
   * Start-up
   * ================================================================== */

  var MODULES = {
    grid: buildGrid,
    picker: buildPicker,
    headsup: buildHeadsUp,
    allin: buildAllIn,
    trainer: buildTrainer
  };

  function start() {
    var mounts = document.querySelectorAll("[data-preflop]");
    if (!mounts.length) { return; }

    var sources = document.getElementById("preflop-sources");
    if (!sources) { return; }
    var urls = JSON.parse(sources.textContent);

    fetch(urls.hands)
      .then(function (response) {
        if (!response.ok) { throw new Error("HTTP " + response.status); }
        return response.json();
      })
      .then(function (data) {
        data.byHand = {};
        data.hands.forEach(function (hand) { data.byHand[hand.hand] = hand; });

        /* The matrix is ten times the size of everything else and only the
         * hand-versus-hand tool wants it, so it is fetched once, on demand,
         * and shared by anything that asks afterwards. */
        var matrixPromise = null;
        data.loadMatrix = function () {
          if (!matrixPromise) {
            matrixPromise = fetch(urls.matrix)
              .then(function (response) {
                if (!response.ok) { throw new Error("HTTP " + response.status); }
                return response.json();
              })
              .then(function (matrix) {
                matrix.index = {};
                matrix.hands.forEach(function (hand, i) { matrix.index[hand] = i; });
                return matrix;
              });
          }
          return matrixPromise;
        };

        Array.prototype.forEach.call(mounts, function (mount) {
          var builder = MODULES[mount.dataset.preflop];
          if (!builder) { return; }
          mount.textContent = "";
          mount.setAttribute("data-ready", "true");
          builder(mount, data);
        });
      })
      .catch(function () {
        Array.prototype.forEach.call(mounts, function (mount) {
          mount.textContent = "The figures could not be loaded. Every number " +
            "they would have shown is published as plain data, linked at the " +
            "end of this page.";
          mount.className = "preflop-status";
        });
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
