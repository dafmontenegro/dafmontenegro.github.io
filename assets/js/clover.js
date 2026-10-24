/* The clover at the foot of every page.

   There is a clover in the footer because I am lucky, and because I believe luck is made
   (About, "About Me"). Tapping it calls a Nintendo guest, chosen at random; holding it, or
   right-clicking it, opens a small menu to choose which one. Who the guests are and what
   they do lives in assets/js/guests.js, which is only fetched the first time the clover is
   used, with its sprite sheet; their addresses arrive in #clover-guests (layouts/_partials/
   clover.html).

   The clover is the emoji in the footer's copyright line. It is turned into a button here
   rather than in the template, so the line stays as Congo writes it from the config. */
(function () {
  "use strict";

  var config = {};
  try {
    config = JSON.parse(document.getElementById("clover-guests").textContent);
  } catch (e) {
    return;
  }

  var CLOVER = "🍀"; // 🍀
  var HOLD_MS = 450; // how long a press must last to open the menu instead
  var button, menu;
  var loading = null;
  var playing = false;
  var holdTimer = 0;
  var held = false;

  /* guests.js, fetched once, with the integrity Hugo computed for it. */
  function load() {
    if (!loading) {
      loading = new Promise(function (resolve, reject) {
        var script = document.createElement("script");
        script.src = config.script;
        if (config.integrity) {
          script.integrity = config.integrity;
          script.crossOrigin = "anonymous";
        }
        script.onload = function () {
          window.CloverGuests ? resolve(window.CloverGuests) : reject(new Error("no guests"));
        };
        script.onerror = reject;
        document.head.appendChild(script);
      }).catch(function (error) {
        loading = null;
        throw error;
      });
    }
    return loading;
  }

  function play(id) {
    if (playing) return;
    playing = true;
    button.classList.add("is-busy");
    load()
      .then(function (guests) {
        return guests.play(id, config, button);
      })
      .catch(function () {})
      .then(function () {
        playing = false;
        button.classList.remove("is-busy");
      });
  }

  /* ---------------------------------------------------------------------------------
     The menu: one button per guest, above the clover. */

  function openMenu() {
    if (playing) return;
    load().then(function (guests) {
      if (!menu) buildMenu(guests);
      menu.hidden = false;
      button.setAttribute("aria-expanded", "true");
      var first = menu.querySelector("button");
      if (first) first.focus();
      setTimeout(function () {
        document.addEventListener("pointerdown", outside, true);
      });
    });
  }

  function closeMenu(refocus) {
    if (!menu || menu.hidden) return;
    menu.hidden = true;
    button.setAttribute("aria-expanded", "false");
    document.removeEventListener("pointerdown", outside, true);
    if (refocus) button.focus();
  }

  function outside(event) {
    if (!menu.contains(event.target) && event.target !== button) closeMenu(false);
  }

  function buildMenu(guests) {
    menu = document.createElement("div");
    menu.className = "cw-guests";
    menu.id = "cw-guests";
    menu.setAttribute("role", "group");
    menu.setAttribute("aria-label", "Choose a guest");
    menu.hidden = true;
    var title = document.createElement("p");
    title.className = "cw-guests-title";
    title.textContent = "Who's coming?";
    menu.appendChild(title);
    guests.list.forEach(function (guest) {
      var choice = document.createElement("button");
      choice.type = "button";
      choice.className = "cw-guests-choice";
      var face = document.createElement("span");
      face.className = "cw-guests-face cw-guests-face-" + guest.id;
      face.setAttribute("aria-hidden", "true");
      if (config[guest.id]) face.style.backgroundImage = "url(" + config[guest.id] + ")";
      choice.appendChild(face);
      var name = document.createElement("span");
      name.textContent = guest.name;
      choice.appendChild(name);
      choice.addEventListener("click", function () {
        closeMenu(true);
        play(guest.id);
      });
      menu.appendChild(choice);
    });
    menu.addEventListener("keydown", function (event) {
      if (event.key === "Escape") closeMenu(true);
    });
    button.parentNode.appendChild(menu);
    button.setAttribute("aria-controls", menu.id);
  }

  /* ---------------------------------------------------------------------------------
     The clover itself. A short press calls a guest at random; a long one, or a right
     click, opens the menu. Holding must not select text or open the phone's own menu. */

  function wrap() {
    var footer = document.querySelector("body > div footer.py-10, footer.py-10") || document.querySelector("footer:last-of-type");
    if (!footer) return null;
    var walker = document.createTreeWalker(footer, NodeFilter.SHOW_TEXT);
    var node;
    while ((node = walker.nextNode())) {
      var at = node.nodeValue.indexOf(CLOVER);
      if (at === -1) continue;
      var after = node.splitText(at);
      after.nodeValue = after.nodeValue.slice(CLOVER.length);
      var wrapper = document.createElement("span");
      wrapper.className = "cw-clover-wrap";
      var clover = document.createElement("button");
      clover.type = "button";
      clover.className = "cw-clover";
      clover.textContent = CLOVER;
      clover.setAttribute("aria-label", "Lucky clover: press for a surprise guest, hold to choose one");
      clover.setAttribute("aria-expanded", "false");
      clover.title = "Press for a surprise guest · hold to choose";
      wrapper.appendChild(clover);
      node.parentNode.insertBefore(wrapper, after);
      return clover;
    }
    return null;
  }

  function start() {
    button = wrap();
    if (!button) return;

    button.addEventListener("pointerdown", function (event) {
      if (event.button !== 0) return;
      held = false;
      clearTimeout(holdTimer);
      holdTimer = setTimeout(function () {
        held = true;
        if (navigator.vibrate) navigator.vibrate(10);
        openMenu();
      }, HOLD_MS);
    });
    ["pointerup", "pointerleave", "pointercancel"].forEach(function (type) {
      button.addEventListener(type, function () {
        clearTimeout(holdTimer);
      });
    });
    button.addEventListener("click", function (event) {
      if (held) {
        held = false;
        event.preventDefault();
        return;
      }
      if (menu && !menu.hidden) {
        closeMenu(false);
        return;
      }
      play(null);
    });
    button.addEventListener("contextmenu", function (event) {
      event.preventDefault();
      clearTimeout(holdTimer);
      held = true;
      openMenu();
    });
    /* Fetch the guests while the visitor is reaching for the clover, so they arrive
       without a wait. */
    button.addEventListener("pointerenter", load, { once: true });
    button.addEventListener("focus", load, { once: true });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
