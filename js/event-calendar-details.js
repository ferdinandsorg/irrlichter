/** Veranstaltungen: animated expand/collapse for .event-calendar__details (page-veranstaltungen). */
(function () {
  "use strict";

  var DURATION_MS = 280;
  var EASING = "cubic-bezier(0.22, 1, 0.36, 1)";

  function clearAnimatedStyles(details, body) {
    details.style.height = "";
    details.style.overflow = "";
    details.style.transition = "";
    body.style.opacity = "";
    body.style.transition = "";
  }

  function bindDetailsAnimation(details) {
    if (details.dataset.eventCalendarBound === "1") {
      return;
    }

    var summary = details.querySelector(".event-calendar__summary");
    var body = details.querySelector(".event-calendar__body");
    if (!summary || !body) {
      return;
    }

    details.dataset.eventCalendarBound = "1";

    summary.addEventListener("click", function (e) {
      var isOpen = details.open;
      var closedHeight = summary.offsetHeight;
      var startHeight = details.offsetHeight;
      var endHeight;

      if (details.dataset.eventCalendarAnimating === "1") {
        e.preventDefault();
        return;
      }

      e.preventDefault();
      details.dataset.eventCalendarAnimating = "1";
      details.style.overflow = "hidden";
      details.style.height = startHeight + "px";

      if (isOpen) {
        endHeight = closedHeight;
        body.style.opacity = "1";
        body.style.transition = "opacity " + DURATION_MS / 1000 + "s " + EASING;
        details.style.transition = "height " + DURATION_MS / 1000 + "s " + EASING;

        window.requestAnimationFrame(function () {
          body.style.opacity = "0";
          details.style.height = endHeight + "px";
        });

        window.setTimeout(function () {
          details.open = false;
          clearAnimatedStyles(details, body);
          delete details.dataset.eventCalendarAnimating;
        }, DURATION_MS);
        return;
      }

      details.open = true;
      endHeight = details.scrollHeight;
      body.style.opacity = "0";
      body.style.transition = "opacity " + DURATION_MS / 1000 + "s " + EASING;
      details.style.transition = "height " + DURATION_MS / 1000 + "s " + EASING;

      window.requestAnimationFrame(function () {
        details.style.height = endHeight + "px";
        body.style.opacity = "1";
      });

      window.setTimeout(function () {
        clearAnimatedStyles(details, body);
        delete details.dataset.eventCalendarAnimating;
      }, DURATION_MS);
    });
  }

  function initEventCalendarDetails(root) {
    if (!document.body.classList.contains("page-veranstaltungen")) {
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    var scope = root && root.querySelectorAll ? root : document;
    scope.querySelectorAll(".event-calendar__details").forEach(bindDetailsAnimation);
  }

  window.initEventCalendarDetails = initEventCalendarDetails;
})();
