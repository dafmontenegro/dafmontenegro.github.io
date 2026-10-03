/* preflop.js — the Texas Hold'em preflop grid.
 *
 * Loaded only by pages that set `preflop` in their front matter. Everything it
 * draws comes from assets/data/preflop/hands.json, which is produced by the
 * engine at github.com/dafmontenegro/holdem-preflop-equity and documented
 * field by field in that repository's web/DATA_DICTIONARY.md. No number is
 * computed here that is not either in that file or a stated formula.
 *
 * WHAT THIS FILE DECIDES, AND WHY
 * -------------------------------
 * The grid is a heatmap: 169 cells, position carrying identity and colour
 * carrying one continuous quantity. Three choices follow from that and are
 * worth stating, because each is a place where this kind of chart usually goes
 * wrong.
 *
 * ONE HUE, LIGHT TO DARK. Colour here encodes magnitude, so the ramp is a
 * single hue stepped from light to dark. Not a rainbow, which would invent
 * categories the data does not have, and not red-to-green, which is invisible
 * to a tenth of men. The steps are named steps of a validated blue scale, and
 * the dark-theme ramp is a separately chosen set rather than the light one
 * lightened — which is why changing the theme re-renders rather than letting
 * the browser flip anything.
 *
 * NO NUMBER IN THE CELLS. A value printed in all 169 cells is unreadable at
 * this density, so a cell carries only its hand's name, which is identity. The
 * value is one hover, one tap or one arrow key away in the hand sheet, and all
 * 169 of them are in the table underneath. That table is not a courtesy: a
 * continuous colour scale cannot be read by everyone, so every value it
 * encodes exists as text.
 *
 * THE SHEET RATHER THAN A FLOATING TOOLTIP. A tooltip that follows the pointer
 * has nowhere to go on a phone and nothing to say to a keyboard. A panel in
 * fixed position below the grid shows the same thing to a mouse, a finger and
 * an arrow key, which is the requirement a tooltip is usually a shortcut to.
 */

(function () {
  "use strict";

  /* ---------------------------------------------------------------------
   * The colour ramps
   * ------------------------------------------------------------------ */

  /* Named steps of one blue scale. Light theme runs light-to-dark on a white
   * surface; the dark theme ramp runs the other way on a slate surface, so in
   * both the end nearest the surface means "near nothing" and the end furthest
   * from it means "most". Both were checked against their own surface rather
   * than assumed from each other. */
  var RAMPS = {
    light: ["#cde2fb", "#b7d3f6", "#9ec5f4", "#86b6ef", "#6da7ec", "#5598e7",
            "#3987e5", "#2a78d6", "#256abf", "#1c5cab", "#184f95", "#104281"],
    dark: ["#104281", "#184f95", "#1c5cab", "#256abf", "#2a78d6", "#3987e5",
           "#5598e7", "#6da7ec", "#86b6ef", "#9ec5f4", "#b7d3f6", "#cde2fb"]
  };

  var RANKS = "AKQJT98765432";

  /* ---------------------------------------------------------------------
   * The metrics a cell can be shaded by
   * ------------------------------------------------------------------ */

  /* Each metric says how to read a value off a hand's record, how to write it
   * out, and — the part that matters most on this page — whether it is exact
   * or estimated. Nothing is displayed without that being said somewhere. */
  function buildMetrics(meta) {
    var metrics = [];

    for (var n = 1; n <= 8; n++) {
      metrics.push({
        id: "opponents-" + n,
        group: "Equity against random hands",
        label: n === 1 ? "1 opponent" : n + " opponents",
        read: (function (index) {
          return function (hand) { return hand.equityVsOpponents[index]; };
        })(n - 1),
        error: (function (index) {
          return function (hand) { return hand.equityVsOpponentsError[index]; };
        })(n - 1),
        exact: false,
        caption: "Share of the pot against " + n +
          (n === 1 ? " opponent" : " opponents") + " holding random hands."
      });
    }

    meta.rangePercents.forEach(function (percent, index) {
      metrics.push({
        id: "range-" + percent,
        group: "Equity against a range",
        label: "Opponent plays top " + percent + "%",
        read: function (hand) { return hand.equityVsRanges[index]; },
        exact: true,
        caption: "Share of the pot against one opponent playing only the " +
          "strongest " + percent + "% of hands."
      });
    });

    meta.categoryNames.forEach(function (name, index) {
      if (index < 2) { return; }     /* high card and one pair say little */
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
          " or better. This is not the chance of winning: a category you " +
          "share with the whole table is worth nothing."
      });
    });

    return metrics;
  }

  /* ---------------------------------------------------------------------
   * Small helpers
   * ------------------------------------------------------------------ */

  function percent(value, scale, places) {
    return (value / scale * 100).toFixed(places === undefined ? 1 : places) + "%";
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

  function currentRamp() {
    return document.documentElement.classList.contains("dark")
      ? RAMPS.dark : RAMPS.light;
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

  function hexToRgb(hex) {
    return [parseInt(hex.slice(1, 3), 16),
            parseInt(hex.slice(3, 5), 16),
            parseInt(hex.slice(5, 7), 16)];
  }

  /* ---------------------------------------------------------------------
   * The widget
   * ------------------------------------------------------------------ */

  function build(root, data) {
    var meta = data.meta;
    var scale = meta.scale;
    var hands = data.hands;
    var byHand = {};
    hands.forEach(function (hand) { byHand[hand.hand] = hand; });

    var metrics = buildMetrics(meta);
    var metric = metrics[0];
    var selected = "AA";

    root.textContent = "";
    root.setAttribute("data-ready", "true");

    /* --- controls, one row above everything they scope --- */
    var controls = document.createElement("div");
    controls.className = "preflop-controls";

    var control = document.createElement("label");
    control.className = "preflop-control";
    var controlLabel = document.createElement("span");
    controlLabel.textContent = "Shade the grid by";
    var select = document.createElement("select");

    var groups = {};
    metrics.forEach(function (entry) {
      if (!groups[entry.group]) {
        groups[entry.group] = document.createElement("optgroup");
        groups[entry.group].label = entry.group;
        select.appendChild(groups[entry.group]);
      }
      var option = document.createElement("option");
      option.value = entry.id;
      option.textContent = entry.label;
      groups[entry.group].appendChild(option);
    });

    control.appendChild(controlLabel);
    control.appendChild(select);
    controls.appendChild(control);
    root.appendChild(controls);

    /* --- grid --- */
    var grid = document.createElement("div");
    grid.className = "preflop-grid";
    grid.setAttribute("role", "grid");
    grid.setAttribute("aria-label",
      "All 169 Texas Hold'em starting hands. Rows and columns run from ace " +
      "down to two; pairs lie on the diagonal, same-suit hands above it and " +
      "different-suit hands below.");

    var cells = {};
    hands.forEach(function (hand) {
      var where = position(hand.hand);
      var cell = document.createElement("button");
      cell.type = "button";
      cell.className = "preflop-cell";
      cell.textContent = hand.hand;
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

    /* --- legend: a continuous scale is unreadable without one --- */
    var legend = document.createElement("div");
    legend.className = "preflop-legend";
    var legendLow = document.createElement("span");
    var legendBar = document.createElement("div");
    legendBar.className = "preflop-legend-bar";
    var legendHigh = document.createElement("span");
    legend.appendChild(legendLow);
    legend.appendChild(legendBar);
    legend.appendChild(legendHigh);
    root.appendChild(legend);

    var caption = document.createElement("p");
    caption.className = "preflop-sheet-note";
    root.appendChild(caption);

    /* --- hand sheet --- */
    var sheet = document.createElement("div");
    sheet.className = "preflop-sheet";
    var sheetHand = document.createElement("p");
    sheetHand.className = "preflop-sheet-hand";
    var figures = document.createElement("dl");
    figures.className = "preflop-figures";
    sheet.appendChild(sheetHand);
    sheet.appendChild(figures);
    root.appendChild(sheet);

    /* --- table view --- */
    var details = document.createElement("details");
    details.className = "preflop-table-toggle";
    var summary = document.createElement("summary");
    summary.textContent = "Read all 169 as a table";
    var tableWrap = document.createElement("div");
    tableWrap.className = "preflop-table-wrap";
    var table = document.createElement("table");
    table.className = "preflop-table";
    tableWrap.appendChild(table);
    details.appendChild(summary);
    details.appendChild(tableWrap);
    root.appendChild(details);

    /* --- rendering --- */

    function range() {
      var lowest = Infinity, highest = -Infinity;
      hands.forEach(function (hand) {
        var value = metric.read(hand);
        if (value < lowest) { lowest = value; }
        if (value > highest) { highest = value; }
      });
      return { lowest: lowest, highest: highest };
    }

    function paint() {
      var ramp = currentRamp();
      var span = range();
      var width = span.highest - span.lowest || 1;

      hands.forEach(function (hand) {
        var fraction = (metric.read(hand) - span.lowest) / width;
        var cell = cells[hand.hand];
        cell.style.backgroundColor = shade(fraction, ramp);
        cell.style.color = fraction > 0.55
          ? "var(--pf-on-pale)" : "var(--pf-on-deep)";
        /* The accessible name carries the value, so a screen reader gets what
           the colour is carrying for everyone else. */
        cell.setAttribute("aria-label",
          hand.hand + ", " + metric.label + ": " +
          percent(metric.read(hand), scale, 2));
      });

      legendBar.style.background = "linear-gradient(to right," +
        ramp.join(",") + ")";
      legendLow.textContent = percent(span.lowest, scale);
      legendHigh.textContent = percent(span.highest, scale);
      caption.textContent = metric.caption + " " +
        (metric.exact
          ? "Exact: every possible board counted."
          : "Estimated by simulation; the hand sheet gives the error.");
    }

    function fill(dl, entries) {
      dl.textContent = "";
      entries.forEach(function (entry) {
        var wrap = document.createElement("div");
        wrap.className = "preflop-figure";
        var term = document.createElement("dt");
        term.textContent = entry.term;
        var value = document.createElement("dd");
        value.textContent = entry.value;
        if (entry.note) {
          var note = document.createElement("span");
          note.className = "preflop-figure-note";
          note.textContent = entry.note;
          value.appendChild(note);
        }
        wrap.appendChild(term);
        wrap.appendChild(value);
        dl.appendChild(wrap);
      });
    }

    function show(name) {
      var hand = byHand[name];
      var shown = metric.read(hand);
      var error = metric.error ? metric.error(hand) : null;

      sheetHand.textContent = hand.hand;

      fill(figures, [
        {
          term: metric.label,
          value: percent(shown, scale, 2),
          note: error
            ? "± " + percent(error, scale, 2) + " (one standard error)"
            : "exact"
        },
        {
          term: "Rank of 169",
          value: String(hand.rank),
          note: "top " + percent(hand.percentile, scale) + " of all hands"
        },
        {
          term: "Against one random hand",
          value: percent(hand.equityVsRandom, scale, 2),
          note: "wins " + percent(hand.winVsRandom, scale) +
            ", ties " + percent(hand.tieVsRandom, scale)
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
      if (cells[selected]) { cells[selected].setAttribute("aria-pressed", "false"); }
      selected = name;
      cells[name].setAttribute("aria-pressed", "true");
      show(name);
    }

    function buildTable() {
      table.textContent = "";
      var head = document.createElement("thead");
      var headRow = document.createElement("tr");
      ["Hand", "Rank", metric.label, "Against one random hand"].forEach(function (text) {
        var th = document.createElement("th");
        th.scope = "col";
        th.textContent = text;
        headRow.appendChild(th);
      });
      head.appendChild(headRow);
      table.appendChild(head);

      var body = document.createElement("tbody");
      hands.forEach(function (hand) {
        var row = document.createElement("tr");
        [hand.hand, String(hand.rank),
         percent(metric.read(hand), scale, 2),
         percent(hand.equityVsRandom, scale, 2)].forEach(function (text, index) {
          var cell = document.createElement(index === 0 ? "th" : "td");
          if (index === 0) { cell.scope = "row"; }
          cell.textContent = text;
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

    /* The theme's ramp is chosen, not flipped, so a theme change re-renders. */
    new MutationObserver(paint).observe(document.documentElement,
      { attributes: true, attributeFilter: ["class"] });

    paint();
    choose(selected);
  }

  /* ---------------------------------------------------------------------
   * Start-up
   * ------------------------------------------------------------------ */

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
        mounts.forEach(function (mount) { build(mount, data); });
      })
      .catch(function () {
        mounts.forEach(function (mount) {
          mount.textContent = "The figures could not be loaded. Every number " +
            "they would have shown is in the data files linked below.";
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
