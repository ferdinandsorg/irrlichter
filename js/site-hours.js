/** Öffnungszeiten — eigenes Stack-Segment, Toggle per Pfadwerkstatt-Link. */
(function () {
  "use strict";

  function getCard() {
    return document.querySelector("[data-info-card]");
  }

  function isHoursOpen(card) {
    return card && card.classList.contains("info-card--hours-open");
  }

  function closeHours(card, panel, trigger) {
    if (!isHoursOpen(card)) return;
    card.classList.remove("info-card--hours-open");
    panel.setAttribute("hidden", "");
    trigger.setAttribute("aria-expanded", "false");
    trigger.setAttribute("aria-label", "Pfadwerkstatt — Öffnungszeiten einblenden");
    document.dispatchEvent(
      new CustomEvent("irrlichter:info-card-toolbar-chrome")
    );
  }

  function openHours(card, panel, trigger) {
    card.classList.add("info-card--hours-open");
    panel.removeAttribute("hidden");
    trigger.setAttribute("aria-expanded", "true");
    trigger.setAttribute("aria-label", "Pfadwerkstatt — Öffnungszeiten ausblenden");
    document.dispatchEvent(
      new CustomEvent("irrlichter:info-card-toolbar-chrome")
    );
  }

  function bindHours() {
    var card = getCard();
    var trigger = document.querySelector("[data-site-status][data-hours-toggle]");
    var panel = document.getElementById("site-hours-panel");
    if (!card || !trigger || !panel) return;

    trigger.setAttribute("aria-controls", "site-hours-panel");
    trigger.setAttribute("aria-expanded", "false");

    trigger.addEventListener("click", function (e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      if (isHoursOpen(card)) {
        closeHours(card, panel, trigger);
      } else {
        openHours(card, panel, trigger);
      }
    });

    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape" || !isHoursOpen(card)) return;
      e.stopPropagation();
      closeHours(card, panel, trigger);
    });

    document.addEventListener(
      "pointerdown",
      function (e) {
        if (!isHoursOpen(card)) return;
        if (e.target.closest("[data-site-status]")) return;
        if (e.target.closest("#site-hours-panel")) return;
        closeHours(card, panel, trigger);
      },
      true
    );

    document.addEventListener("irrlichter:info-card-expanded", function (e) {
      if (e.detail && e.detail.expanded === false) {
        closeHours(card, panel, trigger);
      }
    });
  }

  document.addEventListener("DOMContentLoaded", bindHours);
})();
