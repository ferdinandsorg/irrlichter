(function () {
  "use strict";

  var DATA_URL = "/data/open.json";

  function applyOpenStatus(data) {
    if (!data || typeof data.open !== "boolean") return;

    var statusEl = document.querySelector("[data-site-status]");
    var stateEl = document.querySelector("[data-site-status-state]");
    var open = data.open;

    if (stateEl) {
      stateEl.textContent = open ? "geöffnet" : "geschlossen";
    }
    if (statusEl) {
      statusEl.classList.toggle("control-bar__status--open", open);
      statusEl.classList.toggle("control-bar__status--closed", !open);
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    if (!document.querySelector("[data-control-bar-meta]")) {
      return;
    }

    fetch(DATA_URL, { cache: "no-cache" })
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then(applyOpenStatus)
      .catch(function () {
        /* Fallback bleibt HTML-Default */
      });
  });
})();
