/** Öffnungszeiten in der Control Bar — Klick auf [data-site-status]. */
(function () {
  "use strict";

  function closeHours(meta, panel, trigger) {
    if (!meta.classList.contains("control-bar__meta--hours-open")) return;
    meta.classList.remove("control-bar__meta--hours-open");
    panel.setAttribute("hidden", "");
    trigger.setAttribute("aria-expanded", "false");
    document.dispatchEvent(
      new CustomEvent("irrlichter:info-card-toolbar-chrome")
    );
  }

  function openHours(meta, panel, trigger) {
    meta.classList.add("control-bar__meta--hours-open");
    panel.removeAttribute("hidden");
    trigger.setAttribute("aria-expanded", "true");
    document.dispatchEvent(
      new CustomEvent("irrlichter:info-card-toolbar-chrome")
    );
  }

  function bindHours() {
    var meta = document.querySelector("[data-control-bar-meta]");
    var trigger = document.querySelector("[data-site-status][data-hours-toggle]");
    var panel = document.getElementById("site-hours-panel");
    if (!meta || !trigger || !panel) return;

    trigger.setAttribute("aria-controls", "site-hours-panel");
    trigger.setAttribute("aria-expanded", "false");

    trigger.addEventListener("click", function (e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      if (meta.classList.contains("control-bar__meta--hours-open")) {
        closeHours(meta, panel, trigger);
      } else {
        openHours(meta, panel, trigger);
      }
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        closeHours(meta, panel, trigger);
      }
    });

    document.addEventListener(
      "pointerdown",
      function (e) {
        if (!meta.classList.contains("control-bar__meta--hours-open")) return;
        if (e.target.closest("[data-site-status]")) return;
        if (e.target.closest("#site-hours-panel")) return;
        closeHours(meta, panel, trigger);
      },
      true
    );
  }

  document.addEventListener("DOMContentLoaded", bindHours);
})();
