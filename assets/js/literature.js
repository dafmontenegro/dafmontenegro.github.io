/* The "open at random" button of the Literature space.

   The button is created here rather than in the shortcode (see
   layouts/_shortcodes/quote-random.html) so that a reader without JavaScript is never
   shown a control that cannot do anything. The markup the shortcode leaves behind is an
   empty paragraph; if this file never runs, that paragraph stays empty and the page is
   exactly the page it would otherwise be.

   Loaded by layouts/_partials/extend-head.html on pages that set `literature: true`. */

(function () {
  "use strict";

  var HIGHLIGHT = "cw-quote-lit";
  var HIGHLIGHT_MS = 2200;

  function init() {
    var mount = document.querySelector("[data-quote-random]");
    var quotes = Array.prototype.slice.call(document.querySelectorAll("[data-quote]"));
    if (!mount || quotes.length < 2) return;

    var button = document.createElement("button");
    button.type = "button";
    button.className = "cw-quote-random";
    button.textContent = mount.getAttribute("data-label") || "Open at random";
    mount.appendChild(button);

    /* Remember the last one so the button never answers twice in a row with the same
       quote, which reads as a broken button rather than as chance. */
    var previous = -1;
    var timer = null;

    button.addEventListener("click", function () {
      var index = Math.floor(Math.random() * quotes.length);
      if (index === previous) index = (index + 1) % quotes.length;
      previous = index;

      var quote = quotes[index];
      var still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      quote.scrollIntoView({ behavior: still ? "auto" : "smooth", block: "center" });

      if (timer) {
        window.clearTimeout(timer);
        quotes.forEach(function (q) {
          q.classList.remove(HIGHLIGHT);
        });
      }
      /* Re-adding the class in the same frame would not restart the animation. */
      window.requestAnimationFrame(function () {
        quote.classList.add(HIGHLIGHT);
      });
      timer = window.setTimeout(function () {
        quote.classList.remove(HIGHLIGHT);
        timer = null;
      }, HIGHLIGHT_MS);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
