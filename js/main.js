/**
 * Global UI: scroll ambient, nav, mobile menu, irrlicht, copy buttons, in-page anchors.
 * Requires site-base.js on pages that use irrSiteUrl (irrlicht assets).
 */
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

  function shouldDisableBackdropBlur() {
    var navConn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    var saveData = !!(navConn && navConn.saveData);
    var lowCores =
      typeof navigator.hardwareConcurrency === "number" &&
      navigator.hardwareConcurrency > 0 &&
      navigator.hardwareConcurrency <= 4;
    var lowMemory =
      typeof navigator.deviceMemory === "number" &&
      navigator.deviceMemory > 0 &&
      navigator.deviceMemory <= 4;
    var reducedMotion =
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    return saveData || lowCores || lowMemory || reducedMotion;
  }

  function applyPerformanceFallbacks() {
    if (!document.body) return;
    document.body.classList.toggle(
      "no-backdrop-blur",
      shouldDisableBackdropBlur()
    );
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
      } else {
        link.removeAttribute("aria-current");
      }
    });
    updateNavCurrentLabel();
  }

  function updateNavCurrentLabel() {
    var label = document.querySelector("[data-nav-current]");
    if (!label) return;
    var current = document.querySelector(".nav-links a[aria-current='page']");
    label.textContent = current ? current.textContent.trim() : "Sammlung";
  }

  function initMobileNav() {
    var bar = document.querySelector(".site-header__bar");
    var nav = document.querySelector(".site-header .nav-links");
    if (!bar || !nav || bar.querySelector("[data-nav-toggle]")) {
      return;
    }

    var mq = window.matchMedia("(max-width: 720px)");

    if (!nav.id) {
      nav.id = "site-nav";
    }

    var currentLabel = document.createElement("p");
    currentLabel.className = "nav-current";
    currentLabel.setAttribute("data-nav-current", "");
    currentLabel.setAttribute("aria-hidden", "true");

    var toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "nav-toggle";
    toggle.setAttribute("data-nav-toggle", "");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-controls", nav.id);
    toggle.innerHTML =
      '<span class="nav-toggle__icon material-symbols-sharp" aria-hidden="true">menu</span>' +
      '<span class="nav-toggle__label">Menü</span>';

    var backdrop = document.createElement("button");
    backdrop.type = "button";
    backdrop.className = "nav-backdrop";
    backdrop.setAttribute("data-nav-backdrop", "");
    backdrop.setAttribute("aria-label", "Menü schließen");
    backdrop.hidden = true;

    bar.insertBefore(currentLabel, nav);
    bar.insertBefore(toggle, nav);
    document.body.appendChild(backdrop);
    bar.classList.add("site-header__bar--mobile-ready");

    var icon = toggle.querySelector(".nav-toggle__icon");
    var main = document.querySelector("main");
    var navCloseMs = 300;
    var navCloseTimer = null;

    function finishNavClose() {
      if (document.documentElement.classList.contains("nav-open")) {
        return;
      }
      backdrop.hidden = true;
      document.body.style.overflow = "";
      if (main && "inert" in main) {
        main.inert = false;
      }
    }

    function setOpen(open) {
      if (navCloseTimer) {
        clearTimeout(navCloseTimer);
        navCloseTimer = null;
      }

      document.documentElement.classList.toggle("nav-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      if (icon) {
        icon.textContent = open ? "close" : "menu";
      }

      if (open) {
        backdrop.hidden = false;
        document.body.style.overflow = "hidden";
        if (main && "inert" in main) {
          main.inert = true;
        }
      } else if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        finishNavClose();
      } else {
        navCloseTimer = window.setTimeout(function () {
          navCloseTimer = null;
          finishNavClose();
        }, navCloseMs);
      }
    }

    toggle.addEventListener("click", function () {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });

    backdrop.addEventListener("click", function () {
      setOpen(false);
      toggle.focus();
    });

    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        if (mq.matches) {
          setOpen(false);
        }
      });
    });

    document.addEventListener("keydown", function (e) {
      if (
        e.key === "Escape" &&
        document.documentElement.classList.contains("nav-open")
      ) {
        setOpen(false);
        toggle.focus();
      }
    });

    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", function () {
        if (!mq.matches) {
          setOpen(false);
        }
      });
    } else if (typeof mq.addListener === "function") {
      mq.addListener(function () {
        if (!mq.matches) {
          setOpen(false);
        }
      });
    }

    updateNavCurrentLabel();
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

  function shouldShowIrrlichtLights() {
    if (!document.body) return false;
    return (
      document.body.classList.contains("page-home") ||
      document.body.classList.contains("page-ueber") ||
      document.body.classList.contains("page-veranstaltungen")
    );
  }

  function removeIrrlichtLightsIfNotHome() {
    if (shouldShowIrrlichtLights()) return;
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

  /** Site root with trailing slash for asset paths (irrlicht SVGs). */
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

  function fadeInIrrlichtPair(back, front, fadeInMs) {
    if (!back || !front) return;
    fadeInMs = fadeInMs || Math.round(randomBetween(280, 900));
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
  }

  function fadeOutIrrlichtPair(back, front, fadeOutMs, onDone) {
    if (!back || !front) return;
    fadeOutMs = fadeOutMs || Math.round(randomBetween(500, 3000));
    back.style.transition =
      "opacity " + fadeOutMs / 1000 + "s cubic-bezier(0.45, 0, 0.55, 1)";
    front.style.transition =
      "opacity " +
      Math.round(fadeOutMs * 0.92) / 1000 +
      "s cubic-bezier(0.45, 0, 0.55, 1)";
    back.style.opacity = "0";
    front.style.opacity = "0";
    if (typeof onDone === "function") {
      window.setTimeout(onDone, fadeOutMs + 80);
    }
  }

  function flareIrrlichtPair(back, front, fadeInMs, holdMs, fadeOutMs, onDone) {
    if (!back || !front) return;
    fadeInMs = fadeInMs || Math.round(randomBetween(280, 900));
    holdMs = holdMs == null ? Math.round(randomBetween(120, 650)) : holdMs;
    fadeOutMs = fadeOutMs || Math.round(randomBetween(500, 3000));
    fadeInIrrlichtPair(back, front, fadeInMs);
    window.setTimeout(function () {
      fadeOutIrrlichtPair(back, front, fadeOutMs, onDone);
    }, fadeInMs + holdMs);
  }

  function initUeberStoryLeadIrrlicht() {
    if (!document.body.classList.contains("page-ueber")) return;
    if (
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }
    var wrap = document.querySelector(".ueber-story__lead-wrap");
    if (!wrap) return;
    var lights = wrap.querySelector(".ueber-story-irrlicht");
    if (!lights) return;
    var back = lights.querySelector(".irrlicht-light--back");
    var front = lights.querySelector(".irrlicht-light--front");
    if (!back || !front) return;

    var canHover =
      window.matchMedia && window.matchMedia("(hover: hover)").matches;

    function showFlare() {
      fadeInIrrlichtPair(back, front, Math.round(randomBetween(320, 720)));
    }

    function hideFlare() {
      fadeOutIrrlichtPair(back, front, Math.round(randomBetween(380, 900)));
    }

    if (canHover) {
      wrap.addEventListener("mouseenter", showFlare);
      wrap.addEventListener("mouseleave", hideFlare);
    }

    wrap.addEventListener("focusin", showFlare);
    wrap.addEventListener("focusout", function (e) {
      if (wrap.contains(e.relatedTarget)) return;
      hideFlare();
    });
  }

  function initIrrlichtLights() {
    if (!shouldShowIrrlichtLights()) return;
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
      flareIrrlichtPair(back, front, fadeInMs, holdMs, fadeOutMs, function () {
        wrap.classList.add("irrlicht-lights--done");
      });
    }, waitMs);
  }

  function initInPageSectionScroll() {
    var links = document.querySelectorAll(
      "a[data-scroll-to-section][href^='#']"
    );
    links.forEach(function (link) {
      link.addEventListener("click", function (e) {
        if (link.classList.contains("info-card__collection-cta--to-top")) {
          return;
        }
        var id = link.getAttribute("href");
        if (!id || id.length < 2) return;
        e.preventDefault();
        if (history.replaceState) {
          history.replaceState(null, "", id);
        } else {
          window.location.hash = id.slice(1);
        }
        var target = document.querySelector(id);
        if (!target) return;
        if (
          id === "#termine" &&
          typeof window.irrScrollToTermine === "function"
        ) {
          window.irrScrollToTermine(target);
        } else {
          var reduced =
            window.matchMedia &&
            window.matchMedia("(prefers-reduced-motion: reduce)").matches;
          target.scrollIntoView({
            behavior: reduced ? "auto" : "smooth",
            block: "start"
          });
        }
      });
    });
  }

  function getInfoCardCtaLabelEl(cta, icon) {
    var labelEl = cta.querySelector(".info-card__collection-cta-label");
    if (!labelEl) {
      labelEl = document.createElement("span");
      labelEl.className = "info-card__collection-cta-label";
      var text = readInfoCardCtaLabel(cta, icon);
      Array.from(cta.childNodes).forEach(function (node) {
        if (node !== icon && node !== labelEl) {
          cta.removeChild(node);
        }
      });
      labelEl.textContent = text;
      cta.insertBefore(labelEl, icon || null);
    }
    return labelEl;
  }

  function readInfoCardCtaLabel(cta, icon) {
    var labelEl = cta.querySelector(".info-card__collection-cta-label");
    if (labelEl) {
      return labelEl.textContent.replace(/\s+/g, " ").trim();
    }
    var label = "";
    cta.childNodes.forEach(function (node) {
      if (node === icon) {
        return;
      }
      if (node.nodeType === Node.TEXT_NODE) {
        label += node.textContent;
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        label += node.textContent;
      }
    });
    return label.replace(/\s+/g, " ").trim();
  }

  function writeInfoCardCtaLabel(cta, icon, label) {
    var labelEl = getInfoCardCtaLabelEl(cta, icon);
    labelEl.textContent = label;
  }

  function restoreHomeCollectionCtaHidden(cta) {
    if (!cta || !document.body.classList.contains("page-home")) {
      return;
    }
    var card = document.getElementById("site-info-card");
    if (!card || !card.classList.contains("info-card--collection-in-view")) {
      return;
    }
    cta.hidden = true;
    cta.setAttribute("aria-hidden", "true");
    cta.setAttribute("tabindex", "-1");
  }

  function scrollPageToTop() {
    var scrollEl = document.scrollingElement || document.documentElement;
    var reduced =
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    scrollEl.scrollTo({
      top: 0,
      left: 0,
      behavior: reduced ? "auto" : "smooth"
    });
    if (history.replaceState) {
      history.replaceState(
        null,
        "",
        window.location.pathname + window.location.search
      );
    }
    window.requestAnimationFrame(function () {
      window.dispatchEvent(new Event("scroll"));
    });
  }

  function initInfoCardCtaScroll() {
    var cta = document.querySelector(".info-card__collection-cta");
    if (!cta) {
      return;
    }

    var ctaIcon = cta.querySelector(".info-card__collection-cta-icon");
    getInfoCardCtaLabelEl(cta, ctaIcon);
    var defaultCtaLabel = readInfoCardCtaLabel(cta, ctaIcon);
    var defaultCtaIcon = ctaIcon ? ctaIcon.textContent.trim() : "south";
    var defaultCtaHref = cta.getAttribute("href") || "";
    var bottomThreshold = 96;
    var scrollTicking = false;
    var pageBottomActive = false;

    function isAtPageBottom() {
      var doc = document.documentElement;
      return (
        window.innerHeight + window.scrollY >=
        doc.scrollHeight - bottomThreshold
      );
    }

    function applyPageBottomMode(toTop) {
      var stateChanged = toTop !== pageBottomActive;
      pageBottomActive = toTop;

      cta.classList.toggle("info-card__collection-cta--to-top", toTop);

      if (toTop) {
        writeInfoCardCtaLabel(cta, ctaIcon, "Nach oben");
        if (ctaIcon) {
          ctaIcon.textContent = "north";
        }
        cta.setAttribute("href", "#");
        cta.setAttribute("aria-label", "Nach oben scrollen");
        cta.setAttribute("role", "button");
        cta.removeAttribute("hidden");
        cta.removeAttribute("aria-hidden");
        cta.removeAttribute("tabindex");
      } else if (stateChanged) {
        writeInfoCardCtaLabel(cta, ctaIcon, defaultCtaLabel);
        if (ctaIcon) {
          ctaIcon.textContent = defaultCtaIcon;
        }
        if (defaultCtaHref) {
          cta.setAttribute("href", defaultCtaHref);
        } else {
          cta.removeAttribute("href");
        }
        cta.removeAttribute("aria-label");
        cta.removeAttribute("role");
        restoreHomeCollectionCtaHidden(cta);
      }

      if (stateChanged) {
        document.dispatchEvent(
          new CustomEvent("irrlichter:info-card-toolbar-chrome")
        );
      }
    }

    function updatePageBottomMode() {
      applyPageBottomMode(isAtPageBottom());
      scrollTicking = false;
    }

    function schedulePageBottomModeUpdate() {
      if (scrollTicking) {
        return;
      }
      scrollTicking = true;
      requestAnimationFrame(updatePageBottomMode);
    }

    cta.addEventListener(
      "click",
      function (e) {
        if (!cta.classList.contains("info-card__collection-cta--to-top")) {
          return;
        }
        e.preventDefault();
        e.stopImmediatePropagation();
        scrollPageToTop();
      },
      true
    );

    window.addEventListener("scroll", schedulePageBottomModeUpdate, {
      passive: true
    });
    window.addEventListener("resize", schedulePageBottomModeUpdate, {
      passive: true
    });
    document.addEventListener(
      "irrlichter:info-card-toolbar-chrome",
      schedulePageBottomModeUpdate
    );
    schedulePageBottomModeUpdate();
  }

  document.addEventListener("irrlichter:scroll-page-top", scrollPageToTop);

  function copyTextToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      var area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.left = "-9999px";
      document.body.appendChild(area);
      area.select();
      try {
        if (document.execCommand("copy")) {
          resolve();
        } else {
          reject(new Error("copy failed"));
        }
      } catch (err) {
        reject(err);
      } finally {
        document.body.removeChild(area);
      }
    });
  }

  /** Buttons with data-copy-text copy to clipboard; optional .ui-button__label feedback. */
  function initCopyTextButtons() {
    var buttons = document.querySelectorAll("[data-copy-text]");
    buttons.forEach(function (button) {
      if (button.dataset.copyBound === "1") {
        return;
      }
      button.dataset.copyBound = "1";
      var defaultLabel = "";
      var labelEl = button.querySelector(".ui-button__label");
      if (labelEl) {
        defaultLabel = labelEl.textContent || "";
      }
      button.addEventListener("click", function () {
        var text = button.getAttribute("data-copy-text");
        if (!text) {
          return;
        }
        copyTextToClipboard(text)
          .then(function () {
            if (!labelEl) {
              return;
            }
            labelEl.textContent = "Adresse kopiert";
            window.setTimeout(function () {
              labelEl.textContent = defaultLabel;
            }, 2000);
          })
          .catch(function () {
            if (!labelEl) {
              return;
            }
            labelEl.textContent = "Kopieren fehlgeschlagen";
            window.setTimeout(function () {
              labelEl.textContent = defaultLabel;
            }, 2000);
          });
      });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    applyPerformanceFallbacks();
    removeIrrlichtLightsIfNotHome();
    markActiveNav();
    initMobileNav();
    initScrollAmbient();
    updateTextMode();
    document.addEventListener("irrlichter:collection-rendered", updateTextMode);
    initIrrlichtLights();
    initUeberStoryLeadIrrlicht();
    initCopyTextButtons();
    initInPageSectionScroll();
    initInfoCardCtaScroll();
  });
})();
