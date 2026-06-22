(function () {
  "use strict";

  function getCard() {
    return document.querySelector("[data-info-card]");
  }

  function isExpanded(card) {
    return card && card.classList.contains("info-card--expanded");
  }

  var layoutMetricsRaf = null;
  var layoutMetricsPostTransitionTimer = null;
  var STACK_TRANSITION_MS = 400;

  function getStack(card) {
    return card.querySelector(".info-card__stack") || card;
  }

  function syncFooterContentHeight() {
    var footerInner = document.querySelector(".site-footer .inner");
    if (!footerInner) return;
    var footerH = Math.ceil(footerInner.offsetHeight);
    if (footerH > 0) {
      document.documentElement.style.setProperty(
        "--footer-content-height",
        footerH + "px"
      );
    }
  }

  function syncInfoCardLayoutMetrics(card) {
    if (!card) return;
    var stack = getStack(card);
    var height = Math.ceil(stack.offsetHeight);
    if (height > 0) {
      document.documentElement.style.setProperty(
        "--info-card-stack-height",
        height + "px"
      );
    }
    syncFooterContentHeight();
  }

  function scheduleInfoCardLayoutMetrics(card) {
    if (!card) return;
    if (layoutMetricsRaf) {
      cancelAnimationFrame(layoutMetricsRaf);
    }
    layoutMetricsRaf = requestAnimationFrame(function () {
      layoutMetricsRaf = requestAnimationFrame(function () {
        layoutMetricsRaf = null;
        syncInfoCardLayoutMetrics(card);
      });
    });
  }

  function scheduleInfoCardLayoutMetricsAfterChange(card) {
    scheduleInfoCardLayoutMetrics(card);
    if (layoutMetricsPostTransitionTimer) {
      window.clearTimeout(layoutMetricsPostTransitionTimer);
    }
    layoutMetricsPostTransitionTimer = window.setTimeout(function () {
      layoutMetricsPostTransitionTimer = null;
      syncInfoCardLayoutMetrics(card);
    }, STACK_TRANSITION_MS);
  }

  function bindInfoCardLayoutMetrics(card) {
    var stack = getStack(card);
    var meta = card.querySelector("[data-control-bar-meta]");
    var hours = document.getElementById("site-hours-panel");

    scheduleInfoCardLayoutMetrics(card);
    window.addEventListener(
      "resize",
      function () {
        scheduleInfoCardLayoutMetrics(card);
      },
      { passive: true }
    );
    document.addEventListener("irrlichter:info-card-expanded", function () {
      scheduleInfoCardLayoutMetricsAfterChange(card);
    });
    document.addEventListener(
      "irrlichter:info-card-toolbar-chrome",
      function () {
        scheduleInfoCardLayoutMetricsAfterChange(card);
      }
    );

    stack.addEventListener("transitionend", function (e) {
      if (e.target !== stack) return;
      if (e.propertyName === "width" || e.propertyName === "height") {
        scheduleInfoCardLayoutMetrics(card);
      }
    });

    if (typeof ResizeObserver === "function") {
      var ro = new ResizeObserver(function () {
        scheduleInfoCardLayoutMetrics(card);
      });
      ro.observe(stack);
      if (meta) {
        ro.observe(meta);
      }
      if (hours) {
        ro.observe(hours);
      }
    }

    if (meta && typeof MutationObserver === "function") {
      var mo = new MutationObserver(function () {
        scheduleInfoCardLayoutMetricsAfterChange(card);
      });
      mo.observe(meta, {
        attributes: true,
        attributeFilter: ["hidden", "class"]
      });
    }

    if (hours && typeof MutationObserver === "function") {
      var hoursMo = new MutationObserver(function () {
        scheduleInfoCardLayoutMetricsAfterChange(card);
      });
      hoursMo.observe(hours, {
        attributes: true,
        attributeFilter: ["hidden", "class"]
      });
    }

    if (typeof MutationObserver === "function") {
      var cardMo = new MutationObserver(function () {
        scheduleInfoCardLayoutMetricsAfterChange(card);
      });
      cardMo.observe(card, {
        attributes: true,
        attributeFilter: ["class"]
      });
    }

    if (typeof document.fonts !== "undefined" && document.fonts.ready) {
      document.fonts.ready.then(function () {
        syncInfoCardLayoutMetrics(card);
      });
    }
  }

  function setExpanded(card, expanded) {
    if (!card) return;
    var hasControlBar = card.classList.contains("info-card--has-toolbar");
    var controlMeta = card.querySelector("[data-control-bar-meta]");
    var details = card.querySelector(".info-card__details");

    card.classList.toggle("info-card--expanded", expanded);
    document.body.classList.toggle("info-card-expanded", expanded);

    if (hasControlBar) {
      if (controlMeta) {
        controlMeta.removeAttribute("hidden");
      }
      if (details) {
        details.setAttribute("hidden", "");
      }
    } else if (details) {
      if (expanded) {
        details.removeAttribute("hidden");
      } else {
        details.setAttribute("hidden", "");
      }
    }

    card.setAttribute("aria-expanded", expanded ? "true" : "false");
    document.dispatchEvent(
      new CustomEvent("irrlichter:info-card-expanded", {
        detail: { expanded: expanded }
      })
    );
    scheduleInfoCardLayoutMetricsAfterChange(card);
  }

  function toggleExpanded(card) {
    setExpanded(card, !isExpanded(card));
  }

  function onDocumentPointerDown(e) {
    var card = getCard();
    if (!card || !isExpanded(card)) return;
    if (e.target.closest("[data-info-card]")) return;
    setExpanded(card, false);
  }

  function onKeydown(e) {
    var card = getCard();
    if (!card || !isExpanded(card)) return;
    if (e.key === "Escape") {
      e.preventDefault();
      setExpanded(card, false);
    }
  }

  function bindHomeKeydown(home, card) {
    home.addEventListener("keydown", function (e) {
      if (e.key !== "Enter" && e.key !== " ") return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      toggleExpanded(card);
    });
  }

  function bindToolbarWrap(card) {
    var toolbar = card.querySelector(".info-card__toolbar");
    var logo = card.querySelector(".info-card__logo");
    var cta = card.querySelector(".info-card__collection-cta");
    if (!toolbar || !logo || !cta) return;

    var wrapRaf = null;

    function updateToolbarWrap() {
      if (wrapRaf) {
        cancelAnimationFrame(wrapRaf);
      }
      wrapRaf = requestAnimationFrame(function () {
        wrapRaf = null;
        if (cta.hasAttribute("hidden")) {
          toolbar.classList.remove("info-card__toolbar--wrapped");
          return;
        }
        /* Ohne --wrapped messen: volle CTA-Breite wuerde den Umbruch festhalten. */
        toolbar.classList.remove("info-card__toolbar--wrapped");
        void toolbar.offsetHeight;
        var wrapped = cta.offsetTop > logo.offsetTop + 1;
        toolbar.classList.toggle("info-card__toolbar--wrapped", wrapped);
      });
    }

    if (typeof ResizeObserver === "function") {
      var ro = new ResizeObserver(updateToolbarWrap);
      ro.observe(toolbar);
      ro.observe(logo);
      ro.observe(cta);
    }

    window.addEventListener("resize", updateToolbarWrap, { passive: true });
    document.addEventListener("irrlichter:info-card-expanded", updateToolbarWrap);
    document.addEventListener(
      "irrlichter:info-card-toolbar-chrome",
      updateToolbarWrap
    );

    if (typeof MutationObserver === "function") {
      var mo = new MutationObserver(updateToolbarWrap);
      mo.observe(cta, { attributes: true, attributeFilter: ["hidden"] });
      var collectionToolbar = card.querySelector("[data-collection-toolbar]");
      if (collectionToolbar) {
        mo.observe(collectionToolbar, {
          attributes: true,
          attributeFilter: ["hidden"]
        });
      }
    }

    updateToolbarWrap();
  }

  function bindCard(card) {
    var logoPanel = card.querySelector(".info-card__logo");
    var home = card.querySelector("[data-info-card-home]");
    if (!logoPanel) return;

    card.setAttribute("aria-expanded", "false");
    bindInfoCardLayoutMetrics(card);
    bindToolbarWrap(card);

    logoPanel.addEventListener("click", function (e) {
      if (e.target.closest(".info-card__details")) return;

      var homeEl = e.target.closest("[data-info-card-home]");
      if (
        homeEl &&
        (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)
      ) {
        return;
      }
      if (homeEl) {
        e.preventDefault();
      }

      toggleExpanded(card);
    });

    if (home) {
      home.setAttribute(
        "aria-label",
        "Irrlichter — Info ein- oder ausklappen. Mit Strg- oder Cmd-Klick zur Startseite."
      );
      bindHomeKeydown(home, card);
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    var card = getCard();
    if (!card) return;
    bindCard(card);
    document.addEventListener("pointerdown", onDocumentPointerDown, true);
    document.addEventListener("keydown", onKeydown);
  });
})();
