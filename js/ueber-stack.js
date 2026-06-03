/** Über page: scroll-linked scale on .ueber-pillars-stack cards (page-ueber only). */
(function () {
  "use strict";

  function initUeberPillarsStack() {
    var stack = document.querySelector(".ueber-pillars-stack");
    if (!stack || !document.body.classList.contains("page-ueber")) {
      return;
    }

    var cards = stack.querySelectorAll(".ueber-stack-card");
    if (cards.length < 2) {
      return;
    }

    var card1 = cards[0];
    var card2 = cards[1];
    var motionOk = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var raf = 0;

    function readScaleMin() {
      var value = parseFloat(
        getComputedStyle(stack).getPropertyValue("--ueber-stack-scale-min")
      );
      return isNaN(value) ? 0.94 : value;
    }

    function update() {
      if (!motionOk) {
        card1.style.removeProperty("--ueber-stack-scale");
        return;
      }

      var c1 = card1.getBoundingClientRect();
      var c2 = card2.getBoundingClientRect();
      var overlap = c1.bottom - c2.top;

      if (overlap <= 0) {
        card1.style.setProperty("--ueber-stack-scale", "1");
        return;
      }

      var range = Math.max(card1.offsetHeight * 0.5, 1);
      var progress = Math.min(1, overlap / range);
      var scaleMin = readScaleMin();
      var scale = 1 - progress * (1 - scaleMin);
      card1.style.setProperty("--ueber-stack-scale", String(scale));
    }

    function scheduleUpdate() {
      if (raf) {
        return;
      }
      raf = window.requestAnimationFrame(function () {
        raf = 0;
        update();
      });
    }

    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);

    if (typeof ResizeObserver !== "undefined") {
      var ro = new ResizeObserver(scheduleUpdate);
      ro.observe(stack);
      ro.observe(card1);
      ro.observe(card2);
    }

    scheduleUpdate();
  }

  document.addEventListener("DOMContentLoaded", initUeberPillarsStack);
})();
