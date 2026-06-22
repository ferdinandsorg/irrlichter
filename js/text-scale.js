/** Mobile text scale — Toggle im Vollbild-Menü (scrollt mit), oberhalb der Info-Card. */
(function () {
  "use strict";

  var STORAGE_KEY = "irrlichter-text-scale";

  function isLarge() {
    return document.documentElement.getAttribute("data-text-scale") === "large";
  }

  function apply(scale) {
    if (scale === "large") {
      document.documentElement.setAttribute("data-text-scale", "large");
    } else {
      document.documentElement.removeAttribute("data-text-scale");
    }
  }

  function readStored() {
    try {
      return localStorage.getItem(STORAGE_KEY) === "large" ? "large" : "normal";
    } catch (err) {
      return "normal";
    }
  }

  function persist(scale) {
    try {
      if (scale === "large") {
        localStorage.setItem(STORAGE_KEY, "large");
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (err) {
      /* ignore */
    }
  }

  function updateToggle(btn) {
    if (!btn) {
      btn = document.querySelector("[data-text-scale-toggle]");
    }
    if (!btn) {
      return;
    }
    var large = isLarge();
    btn.setAttribute("aria-pressed", large ? "true" : "false");
    btn.setAttribute(
      "aria-label",
      large ? "Text verkleinern" : "Text vergrößern"
    );
    btn.classList.toggle("text-scale-toggle--active", large);
    var label = btn.querySelector(".text-scale-toggle__label");
    if (label) {
      label.textContent = large ? "Text verkleinern" : "Text vergrößern";
    }
  }

  function setTextScale(scale) {
    apply(scale === "large" ? "large" : "normal");
    persist(scale === "large" ? "large" : "normal");
    updateToggle();
  }

  function initTextScaleToggle() {
    if (document.querySelector("[data-text-scale-toggle]")) {
      updateToggle();
      return;
    }

    var nav = document.querySelector(".site-header .nav-links");
    if (!nav) {
      return;
    }

    var footer = document.createElement("div");
    footer.className = "nav-links__footer";

    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "text-scale-toggle";
    btn.setAttribute("data-text-scale-toggle", "");
    btn.setAttribute("aria-pressed", "false");
    btn.innerHTML =
      '<span class="material-symbols-sharp text-scale-toggle__icon" aria-hidden="true">text_increase</span>' +
      '<span class="text-scale-toggle__label">Text vergrößern</span>';

    footer.appendChild(btn);
    nav.appendChild(footer);

    btn.addEventListener("click", function () {
      setTextScale(isLarge() ? "normal" : "large");
    });

    updateToggle(btn);
  }

  apply(readStored());

  if (typeof window !== "undefined") {
    window.irrSetTextScale = setTextScale;
  }

  document.addEventListener("DOMContentLoaded", initTextScaleToggle);
})();
