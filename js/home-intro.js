(function () {
  "use strict";

  var WORD_STAGGER_MS = 72;
  var PARA_GAP_MS = 480;
  var START_DELAY_MS = 350;

  function prefersReducedMotion() {
    return (
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }

  function splitParagraph(para) {
    var text = (para.textContent || "").trim().replace(/\s+/g, " ");
    if (!text) {
      return [];
    }
    var words = text.split(" ");
    para.textContent = "";
    var spans = [];
    var i;
    for (i = 0; i < words.length; i++) {
      var span = document.createElement("span");
      span.className = "home-intro__word";
      span.textContent = words[i];
      para.appendChild(span);
      if (i < words.length - 1) {
        para.appendChild(document.createTextNode(" "));
      }
      spans.push(span);
    }
    return spans;
  }

  function scheduleWordReveal(spans, startDelay) {
    var delay = startDelay;
    var i;
    for (i = 0; i < spans.length; i++) {
      (function (span, ms) {
        window.setTimeout(function () {
          span.classList.add("home-intro__word--in");
        }, ms);
      })(spans[i], delay);
      delay += WORD_STAGGER_MS;
    }
    return delay;
  }

  function initHomeIntro() {
    if (!document.body.classList.contains("page-home")) {
      return;
    }
    var section = document.querySelector(".home-intro");
    if (!section) {
      return;
    }

    var paras = [].slice.call(section.querySelectorAll(".home-intro__para"));
    if (paras.length === 0) {
      return;
    }

    var spanGroups = paras.map(splitParagraph);

    if (prefersReducedMotion()) {
      spanGroups.forEach(function (spans) {
        spans.forEach(function (span) {
          span.classList.add("home-intro__word--in");
        });
      });
      section.classList.add("home-intro--ready");
      return;
    }

    var delay = START_DELAY_MS;
    var pi;
    for (pi = 0; pi < paras.length; pi++) {
      delay = scheduleWordReveal(spanGroups[pi], delay);
      if (pi < paras.length - 1) {
        delay += PARA_GAP_MS;
      }
    }

    window.setTimeout(function () {
      section.classList.add("home-intro--ready");
    }, delay + 200);
  }

  document.addEventListener("DOMContentLoaded", initHomeIntro);
})();
