(function () {
  "use strict";

  function getCard() {
    return document.querySelector("[data-info-card]");
  }

  function isExpanded(card) {
    return card && card.classList.contains("info-card--expanded");
  }

  function setExpanded(card, expanded) {
    if (!card) return;
    var details = card.querySelector(".info-card__details");
    card.classList.toggle("info-card--expanded", expanded);
    document.body.classList.toggle("info-card-expanded", expanded);
    if (details) {
      if (expanded) {
        details.removeAttribute("hidden");
      } else {
        details.setAttribute("hidden", "");
      }
    }
    card.setAttribute("aria-expanded", expanded ? "true" : "false");
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

  function bindCard(card) {
    var logoPanel = card.querySelector(".info-card__logo");
    var home = card.querySelector("[data-info-card-home]");
    if (!logoPanel) return;

    card.setAttribute("aria-expanded", "false");

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
