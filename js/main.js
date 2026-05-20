(function () {
  "use strict";

  var root = document.documentElement;
  var scrollRaf = null;
  var currentTextMode = null;
  /**
   * Textmodus aus --scroll-shift (color-mix/oklch ist per getComputedStyle nicht parsebar).
   * dark = dunkle Schrift (oben / ~50 %), light = helle Schrift (unten).
   */
  var SCROLL_SHIFT_LIGHT_TEXT_ON = 0.56;
  var SCROLL_SHIFT_DARK_TEXT_ON = 0.48;

  function readScrollShift() {
    var inline = root.style.getPropertyValue("--scroll-shift");
    if (inline && String(inline).trim() !== "") {
      var n = parseFloat(inline);
      if (!isNaN(n)) return Math.min(1, Math.max(0, n));
    }
    var computed = getComputedStyle(root).getPropertyValue("--scroll-shift").trim();
    var c = parseFloat(computed);
    return isNaN(c) ? 0 : Math.min(1, Math.max(0, c));
  }

  function updateTextMode() {
    var t = readScrollShift();
    var mode;

    if (currentTextMode === "light") {
      mode = t < SCROLL_SHIFT_DARK_TEXT_ON ? "dark" : "light";
    } else if (currentTextMode === "dark") {
      mode = t >= SCROLL_SHIFT_LIGHT_TEXT_ON ? "light" : "dark";
    } else {
      mode = t >= SCROLL_SHIFT_LIGHT_TEXT_ON ? "light" : "dark";
    }

    currentTextMode = mode;
    root.setAttribute("data-text-mode", mode);
  }

  function markActiveNav() {
    var segs = (window.location.pathname || "")
      .split("/")
      .filter(function (s) {
        return s;
      });
    var current = (segs.pop() || "index").toLowerCase();
    var key = current.replace(/\.html$/i, "");
    var links = document.querySelectorAll(".nav-links a[data-nav]");
    links.forEach(function (link) {
      if (link.getAttribute("data-nav") === key) {
        link.setAttribute("aria-current", "page");
      }
    });
  }

  function isHomePage() {
    if (!document.body || !document.body.classList.contains("page-home")) {
      return false;
    }
    var path = (window.location.pathname || "").split("/").filter(Boolean);
    var leaf = (path.length ? path[path.length - 1] : "index").replace(
      /\.html$/i,
      ""
    );
    return !leaf || leaf === "index";
  }

  function removeIrrlichtLightsIfNotHome() {
    if (isHomePage()) return;
    var el = document.getElementById("irrlicht-lights");
    if (el && el.parentNode) {
      el.parentNode.removeChild(el);
    }
  }

  function homeIntroScrollOffset() {
    var intro = document.querySelector(".home-intro");
    if (intro) {
      return intro.offsetHeight;
    }
    return window.innerHeight || document.documentElement.clientHeight || 0;
  }

  function scrollProgress() {
    var el = document.scrollingElement || document.documentElement;
    var scrollTop = el.scrollTop;
    var max = el.scrollHeight - el.clientHeight;

    if (isHomePage()) {
      var introEnd = homeIntroScrollOffset();
      if (scrollTop <= introEnd) {
        return 0;
      }
      var range = max - introEnd;
      if (range <= 0) {
        return 1;
      }
      return Math.min(1, Math.max(0, (scrollTop - introEnd) / range));
    }

    if (max <= 0) {
      return 0;
    }
    return Math.min(1, Math.max(0, scrollTop / max));
  }

  function applyScrollAmbient() {
    var raw = scrollProgress();
    var t = raw;
    if (
      window.matchMedia &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      t = Math.pow(raw, 0.9);
    }
    root.style.setProperty("--scroll-shift", String(t));
    updateTextMode();
    document.dispatchEvent(
      new CustomEvent("irrlichter:scroll-ambient", { detail: { t: t } })
    );
    scrollRaf = null;
  }

  function onScrollOrResize() {
    if (scrollRaf !== null) {
      return;
    }
    scrollRaf = window.requestAnimationFrame(applyScrollAmbient);
  }

  function initScrollAmbient() {
    applyScrollAmbient();
    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize, { passive: true });
    window.addEventListener("load", onScrollOrResize, { passive: true });
    if (typeof ResizeObserver !== "undefined") {
      var ro = new ResizeObserver(onScrollOrResize);
      ro.observe(document.documentElement);
    }
  }

  function randomBetween(min, max) {
    return min + Math.random() * (max - min);
  }

  function scriptBaseUrl() {
    if (typeof irrSiteUrl === "function") {
      return irrSiteUrl("/");
    }
    var scripts = document.getElementsByTagName("script");
    for (var i = scripts.length - 1; i >= 0; i--) {
      var src = scripts[i].src || "";
      if (/\/js\/main\.js(\?|$)/i.test(src)) {
        return src.replace(/\/js\/main\.js(\?.*)?$/i, "/");
      }
    }
    return "";
  }

  function initIrrlichtLights() {
    if (!isHomePage()) return;
    if (document.getElementById("irrlicht-lights")) return;
    if (
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }
    var main = document.querySelector("main#content");
    if (!main || !main.parentNode) return;

    var base = scriptBaseUrl();
    var imgBack = (base || "") + "assets/images/light-back.svg";
    var imgFront = (base || "") + "assets/images/light-front.svg";

    var wrap = document.createElement("div");
    wrap.id = "irrlicht-lights";
    wrap.className = "irrlicht-lights";
    wrap.setAttribute("aria-hidden", "true");
    wrap.innerHTML =
      '<div class="irrlicht-light irrlicht-light--back" data-irrlicht-layer="back">' +
      '<div class="irrlicht-light__img-wrap"><img src="' +
      imgBack +
      '" alt="" decoding="async"/></div></div>' +
      '<div class="irrlicht-light irrlicht-light--front" data-irrlicht-layer="front">' +
      '<div class="irrlicht-light__img-wrap"><img src="' +
      imgFront +
      '" alt="" decoding="async"/></div></div>';

    main.parentNode.insertBefore(wrap, main);

    var back = wrap.querySelector(".irrlicht-light--back");
    var front = wrap.querySelector(".irrlicht-light--front");
    if (!back || !front) return;

    var waitMs = Math.round(randomBetween(500, 3000));
    var fadeInMs = Math.round(randomBetween(280, 900));
    var holdMs = Math.round(randomBetween(120, 650));
    var fadeOutMs = Math.round(randomBetween(500, 3000));

    window.setTimeout(function flareIn() {
      back.style.transition =
        "opacity " + fadeInMs / 1000 + "s cubic-bezier(0.22, 1, 0.36, 1)";
      front.style.transition =
        "opacity " +
        Math.round(fadeInMs * 0.88) / 1000 +
        "s cubic-bezier(0.22, 1, 0.36, 1)";

      window.requestAnimationFrame(function () {
        back.style.opacity = String(randomBetween(0.88, 1));
        front.style.opacity = String(randomBetween(0.92, 1));
      });

      window.setTimeout(function flareOut() {
        back.style.transition =
          "opacity " + fadeOutMs / 1000 + "s cubic-bezier(0.45, 0, 0.55, 1)";
        front.style.transition =
          "opacity " +
          Math.round(fadeOutMs * 0.92) / 1000 +
          "s cubic-bezier(0.45, 0, 0.55, 1)";
        back.style.opacity = "0";
        front.style.opacity = "0";

        window.setTimeout(function () {
          wrap.classList.add("irrlicht-lights--done");
        }, fadeOutMs + 80);
      }, fadeInMs + holdMs);
    }, waitMs);
  }

  function initInPageSectionScroll() {
    var links = document.querySelectorAll(
      "a[data-scroll-to-section][href^='#']"
    );
    links.forEach(function (link) {
      link.addEventListener("click", function (e) {
        var id = link.getAttribute("href");
        if (!id || id.length < 2) return;
        var target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        var reduced =
          window.matchMedia &&
          window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        target.scrollIntoView({
          behavior: reduced ? "auto" : "smooth",
          block: "start"
        });
        if (history.replaceState) {
          history.replaceState(null, "", id);
        } else {
          window.location.hash = id.slice(1);
        }
      });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    removeIrrlichtLightsIfNotHome();
    markActiveNav();
    initScrollAmbient();
    updateTextMode();
    document.addEventListener("irrlichter:collection-rendered", updateTextMode);
    initIrrlichtLights();
    initInPageSectionScroll();
  });
})();
