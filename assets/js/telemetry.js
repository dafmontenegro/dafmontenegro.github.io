/* Telemetry: the events this site sends to Google Analytics 4 beyond what GA records by
   itself (page views, the 90 % scroll, outbound clicks, the downloads it recognises).

   Every event goes through `window.siteTrack(name, params)`, which this file defines and
   which koi.js, pokemon.js and butterflies.js call for what only they can see. It hands the
   event to gtag; where there is no gtag it does nothing, and that is how the site's privacy
   rules carry over without being repeated here: Hugo only adds GA to production builds, and
   the tag is never set up in a browser that sends Do Not Track (see google_analytics.html).
   Under `hugo server` each event is printed to the console instead and kept in
   `window.siteTelemetryLog`, so a change can be checked before it ships.

   What is never sent: anything typed or copied, apart from what is typed into the site's
   own search box (search terms are the point of measuring search, and are cut to 100
   characters); for a copy, only how many characters were copied. No event carries an
   address, a name or an identifier of the visitor.

   Every event, its parameters and why it exists are listed in README.md, which also says
   which parameters need registering in GA as custom dimensions and metrics. GA4 limits that
   matter here: event names of at most 40 characters, parameter values of at most 100, at
   most 25 parameters per event; and `source`, `medium` and `campaign` are read by GA as the
   visit's origin, so no parameter here is called that. */

(function () {
  "use strict";

  var config = {};
  try {
    config = JSON.parse(document.getElementById("telemetry-config").textContent) || {};
  } catch (e) {}

  var log = [];
  if (config.debug) window.siteTelemetryLog = log;

  function track(name, params) {
    params = params || {};
    if (typeof window.gtag === "function") window.gtag("event", name, params);
    if (config.debug) {
      log.push({ name: name, params: params });
      console.info("[telemetry]", name, params);
    }
  }
  window.siteTrack = track;

  /* An event sent at most once per page view, under `key`. */
  var sent = {};
  function once(key, name, params) {
    if (sent[key]) return;
    sent[key] = true;
    track(name, params);
  }

  /* GA cuts longer values itself; cutting them here keeps what is logged in debug equal to
     what GA keeps. */
  function cut(text) {
    return String(text || "").slice(0, 100);
  }

  /* Where on the page a control is: the site's header or footer, the homepage's profile
     (the section holding the photo, its links included), or the page's content. */
  function placement(element) {
    if (element.closest("body > header")) return "header";
    if (element.closest("body > footer, article > footer")) return "footer";
    var section = element.closest("section");
    if (section && section.querySelector(".cw-avatar")) return "profile";
    return "content";
  }

  /* Seconds the page has been visible, not merely open in a tab behind another. */
  var visibleMs = 0;
  var visibleSince = document.visibilityState === "visible" ? performance.now() : null;
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible") {
      visibleSince = performance.now();
    } else if (visibleSince !== null) {
      visibleMs += performance.now() - visibleSince;
      visibleSince = null;
    }
  });
  function visibleSeconds() {
    var ms = visibleMs + (visibleSince === null ? 0 : performance.now() - visibleSince);
    return Math.round(ms / 1000);
  }

  /* ---------------------------------------------------------------------------------
     How far down the page. GA's own `scroll` event fires at 90 % only; this adds 25, 50,
     75 and 100 under the same name and the same `percent_scrolled` parameter, so the one
     built-in "Percent scrolled" dimension shows all five. A page that scrolls less than
     half a screen is not counted: on it, the first pixel would already be "100 %". */

  var MARKS = [25, 50, 75, 100];
  var depthFrame = 0;
  function measureDepth() {
    depthFrame = 0;
    var room = document.documentElement.scrollHeight - window.innerHeight;
    if (room < window.innerHeight * 0.5) return;
    var percent = (window.scrollY / room) * 100;
    MARKS.forEach(function (mark) {
      /* 100 % is "within a pixel or two of the end": scroll positions are fractional and
         some browsers stop just short. */
      if (percent >= (mark === 100 ? 99.5 : mark)) once("scroll" + mark, "scroll", { percent_scrolled: mark });
    });
  }
  window.addEventListener("scroll", function () {
    if (!depthFrame) depthFrame = requestAnimationFrame(measureDepth);
  }, { passive: true });

  /* ---------------------------------------------------------------------------------
     Reaching the end of an article: the footer under its text coming into view. Sent with
     how long the page had been visible and the reading time Hugo estimates for it, so a
     read can be told from a skim (finishing a 10-minute post in 20 seconds is a skim). */

  function watchArticleEnd() {
    if (!config.readingMinutes || !("IntersectionObserver" in window)) return;
    var end = document.querySelector("article > footer");
    if (!end) return;
    var observer = new IntersectionObserver(function (entries) {
      if (!entries.some(function (entry) { return entry.isIntersecting; })) return;
      observer.disconnect();
      once("article_complete", "article_complete", {
        engaged_seconds: visibleSeconds(),
        reading_minutes: config.readingMinutes
      });
    });
    observer.observe(end);
  }

  /* ---------------------------------------------------------------------------------
     Clicks, all through one listener on the document. Capture phase, so a handler that
     stops the click from bubbling (the homepage's logo does) cannot hide it. */

  var NETWORKS = {
    "linkedin.com": "linkedin",
    "github.com": "github",
    "x.com": "x",
    "twitter.com": "x",
    "t.me": "telegram",
    "youtube.com": "youtube",
    "instagram.com": "instagram",
    "open.spotify.com": "spotify",
    "wa.me": "whatsapp"
  };
  var IMAGE_FILE = /\.(jpe?g|png|webp|gif|svg|avif)$/i;
  var preflopUsed = {};

  function network(host) {
    host = host.replace(/^www\./, "");
    return NETWORKS[host] || null;
  }

  function onLink(link) {
    var url;
    try {
      url = new URL(link.href, location.href);
    } catch (e) {
      return;
    }

    var social = network(url.hostname);
    if (social) {
      track("social_click", { network: social, placement: placement(link), link_url: cut(url.href) });
      return;
    }

    if (link.closest("#search-results")) {
      var results = Array.prototype.slice.call(document.querySelectorAll("#search-results a"));
      track("search_result_click", { link_url: cut(url.pathname), result_position: results.indexOf(link) + 1 });
      return;
    }

    var samePage = url.origin === location.origin && url.pathname === location.pathname;
    if (samePage && url.hash) {
      track("in_page_link", {
        link_target: cut(decodeURIComponent(url.hash)),
        placement: link.closest("#TableOfContents") ? "toc" : link.closest("h1, h2, h3, h4, h5, h6") ? "heading" : placement(link)
      });
      return;
    }

    /* GA's own download tracking only knows documents and archives; the Press Kit's
       photographs are images, which it ignores. They are sent under GA's own event name
       and parameters, so they land in the same report. */
    if (url.origin === location.origin && IMAGE_FILE.test(url.pathname)) {
      var file = url.pathname.split("/").pop();
      track("file_download", {
        file_name: cut(decodeURIComponent(file)),
        file_extension: file.split(".").pop().toLowerCase(),
        link_url: cut(url.href),
        link_text: cut(link.textContent.trim())
      });
    }
  }

  document.addEventListener("click", function (event) {
    var target = event.target;
    if (!(target instanceof Element)) return;

    var link = target.closest("a[href]");
    if (link) {
      if (link.id === "to-top" || link.closest("#to-top")) {
        var room = document.documentElement.scrollHeight - window.innerHeight;
        track("scroll_to_top", { percent_scrolled: room > 0 ? Math.round((window.scrollY / room) * 100) : 0 });
        return;
      }
      onLink(link);
      return;
    }

    if (target.closest("[id^='appearance-switcher']")) {
      /* Congo flips the class in its own listener on the same click; read it after. */
      setTimeout(function () {
        track("theme_toggle", { color_scheme: document.documentElement.classList.contains("dark") ? "dark" : "light" });
      });
      return;
    }
    if (target.closest("[id^='search-button']")) {
      track("search_open", { placement: placement(target) });
      return;
    }
    var copy = target.closest(".copy-button");
    if (copy) {
      /* Congo puts the button inside the block's .highlight wrapper; Hugo's highlighter
         names the language on the <code>. */
      var code = copy.closest(".highlight");
      code = code && code.querySelector("code[data-lang]");
      track("code_copy", { code_language: code ? code.getAttribute("data-lang") : "(none)" });
      return;
    }
    if (target.closest("[data-cw-butterflies]")) {
      track("butterflies_release");
      return;
    }
    if (target.closest(".cw-quote-random")) {
      track("quote_random");
      return;
    }
    preflop(target);
  }, true);

  /* The preflop tools: the first time each one on the page is used, by a click or by a
     change of one of its menus. Only that it was used, not what was chosen. The trainer is
     left out entirely, because it tells the reader, in so many words, that nothing it does
     is sent anywhere. */
  function preflop(target) {
    var mount = target.closest("[data-preflop]");
    if (!mount) return;
    var tool = mount.getAttribute("data-preflop");
    if (tool === "trainer" || preflopUsed[tool]) return;
    preflopUsed[tool] = true;
    track("preflop_use", { tool: tool });
  }
  document.addEventListener("change", function (event) {
    if (event.target instanceof Element) preflop(event.target);
  }, true);

  /* ---------------------------------------------------------------------------------
     The site's search (Congo's modal): what is searched for, once the visitor has paused
     typing, and how many results it found. */

  var searchTimer = 0;
  var lastTerm = "";
  document.addEventListener("input", function (event) {
    if (!(event.target instanceof Element) || event.target.id !== "search-query") return;
    clearTimeout(searchTimer);
    searchTimer = setTimeout(function () {
      var term = event.target.value.trim();
      if (term.length < 2 || term === lastTerm) return;
      lastTerm = term;
      track("search", {
        search_term: cut(term),
        result_count: document.querySelectorAll("#search-results a").length
      });
    }, 1500);
  });

  /* ---------------------------------------------------------------------------------
     Copying text: how much, and whether from code. Never what. The code blocks' copy
     button copies through a hidden textarea, which is skipped here: it is counted above. */

  var copies = 0;
  document.addEventListener("copy", function (event) {
    var target = event.target instanceof Element ? event.target : null;
    if (target && target.closest("input, textarea")) return;
    if (++copies > 10) return;
    var selection = String(window.getSelection() || "");
    if (!selection) return;
    track("text_copy", {
      characters: selection.length,
      placement: target && target.closest("pre, code") ? "code" : "content"
    });
  });

  /* ---------------------------------------------------------------------------------
     Embedded players (YouTube, Vimeo, Spotify) live in frames the page cannot see into.
     What it can see is the page losing focus to one of them, which is what a click on a
     player does. Once per player per page view. */

  var embedsTouched = typeof WeakSet === "function" ? new WeakSet() : null;
  window.addEventListener("blur", function () {
    setTimeout(function () {
      var frame = document.activeElement;
      if (!frame || frame.tagName !== "IFRAME" || !embedsTouched || embedsTouched.has(frame)) return;
      embedsTouched.add(frame);
      var host = "";
      try {
        host = new URL(frame.src).hostname.replace(/^www\./, "");
      } catch (e) {}
      var provider = /youtube/.test(host) ? "youtube" : /vimeo/.test(host) ? "vimeo" : /spotify/.test(host) ? "spotify" : host || "(unknown)";
      track("embed_interact", { embed_provider: provider });
    });
  });

  /* ---------------------------------------------------------------------------------
     Errors in the site's own scripts, at most five per page view. Errors raised by
     browser extensions and by other sites' scripts are left out: they are not this site's
     to fix, and a cross-origin error arrives as a bare "Script error." anyway. */

  var errors = 0;
  function reportError(message, sourceUrl, line, column) {
    if (errors >= 5) return;
    if (sourceUrl) {
      try {
        if (new URL(sourceUrl, location.href).origin !== location.origin) return;
      } catch (e) {
        return;
      }
    }
    errors++;
    track("js_error", {
      error_message: cut(message),
      /* The script's file name and position; "(caught)" for an error a script caught and
         reported itself, or a rejected promise, neither of which says where it began. */
      error_source: cut(sourceUrl ? sourceUrl.split("/").pop().split("?")[0] + ":" + (line || 0) + ":" + (column || 0) : "(caught)")
    });
  }
  window.addEventListener("error", function (event) {
    if (event.message === "Script error." || !event.filename) return;
    reportError(event.message, event.filename, event.lineno, event.colno);
  });
  window.addEventListener("unhandledrejection", function (event) {
    var reason = event.reason;
    reportError("Unhandled rejection: " + (reason && reason.message ? reason.message : String(reason)), null);
  });
  /* For the scripts that catch their own errors and recover (pokemon.js), so a failure
     that leaves nothing broken on screen still gets counted. */
  window.siteReportError = function (error, where) {
    reportError((where ? where + ": " : "") + (error && error.message ? error.message : String(error)), null);
  };

  /* ---------------------------------------------------------------------------------
     Core Web Vitals, measured in the visitor's browser and sent once, when the page is
     hidden (closed, left or put behind another tab), which is when their values are
     final. Computed the way Google's web-vitals library defines them:

     - LCP, Largest Contentful Paint: when the largest image or block of text was drawn.
     - CLS, Cumulative Layout Shift: how much the page jumped about on its own. Shifts are
       grouped into windows of at most 5 s with gaps under 1 s; CLS is the worst window.
     - INP, Interaction to Next Paint: how long the page took to answer a tap, click or
       key. The worst interaction, or with 50 or more, the worst after skipping one per 50,
       so a single freak does not stand for a long visit.
     - FCP, First Contentful Paint, and TTFB, Time To First Byte: when anything was first
       drawn, and when the server's answer began to arrive.

     Only Chromium browsers report LCP, CLS and INP; elsewhere those parameters are left
     out rather than sent as zero. */

  var vitals = {};
  var clsWindow = 0;
  var clsWindowStart = 0;
  var clsLast = 0;
  var interactions = {};

  function observe(type, handler, options) {
    try {
      var observer = new PerformanceObserver(function (list) {
        list.getEntries().forEach(handler);
      });
      observer.observe(Object.assign({ type: type, buffered: true }, options || {}));
    } catch (e) {}
  }

  if ("PerformanceObserver" in window) {
    observe("largest-contentful-paint", function (entry) {
      vitals.lcp_ms = Math.round(entry.startTime);
    });
    observe("layout-shift", function (entry) {
      if (entry.hadRecentInput) return;
      if (clsWindow && entry.startTime - clsLast < 1000 && entry.startTime - clsWindowStart < 5000) {
        clsWindow += entry.value;
      } else {
        clsWindow = entry.value;
        clsWindowStart = entry.startTime;
      }
      clsLast = entry.startTime;
      vitals.cls = Math.max(vitals.cls || 0, clsWindow);
    });
    observe("event", function (entry) {
      if (!entry.interactionId) return;
      interactions[entry.interactionId] = Math.max(interactions[entry.interactionId] || 0, entry.duration);
    }, { durationThreshold: 40 });
    observe("paint", function (entry) {
      if (entry.name === "first-contentful-paint") vitals.fcp_ms = Math.round(entry.startTime);
    });
  }

  function sendVitals() {
    var params = {};
    Object.keys(vitals).forEach(function (key) {
      params[key] = vitals[key];
    });
    if ("cls" in params) params.cls = Math.round(params.cls * 1000) / 1000;
    var durations = Object.keys(interactions).map(function (id) {
      return interactions[id];
    }).sort(function (a, b) {
      return b - a;
    });
    if (durations.length) params.inp_ms = Math.round(durations[Math.min(Math.floor(durations.length / 50), durations.length - 1)]);
    try {
      var navigation = performance.getEntriesByType("navigation")[0];
      if (navigation && navigation.responseStart > 0) params.ttfb_ms = Math.round(navigation.responseStart);
    } catch (e) {}
    if (!Object.keys(params).length) return;
    params.transport_type = "beacon";
    once("web_vitals", "web_vitals", params);
  }
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden") sendVitals();
  });
  window.addEventListener("pagehide", sendVitals);

  /* ---------------------------------------------------------------------------------
     A page read through the browser's translator. Google Translate, the one built into
     Chrome, marks <html> with a `translated-ltr` or `translated-rtl` class and sets its
     `lang` to the language it translated into. The site is written in English for a
     largely Spanish-speaking audience, so this says how many read it in another tongue. */

  if ("MutationObserver" in window) {
    var html = document.documentElement;
    var translation = new MutationObserver(function () {
      if (/\btranslated-(ltr|rtl)\b/.test(html.className)) {
        translation.disconnect();
        once("page_translated", "page_translated", { language: cut(html.lang || "(unknown)") });
      }
    });
    translation.observe(html, { attributes: true, attributeFilter: ["class", "lang"] });
  }

  window.addEventListener("beforeprint", function () {
    once("page_print", "page_print");
  });

  /* ---------------------------------------------------------------------------------
     The 404 page: which address was missing and where the visitor came from, so a broken
     link, on this site or on another, can be found and fixed. */

  if (config.notFound) {
    var referrer = "(none)";
    try {
      if (document.referrer) referrer = new URL(document.referrer).hostname;
    } catch (e) {}
    track("page_not_found", { missing_path: cut(location.pathname + location.search), referrer_host: cut(referrer) });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", watchArticleEnd);
  else watchArticleEnd();
})();
