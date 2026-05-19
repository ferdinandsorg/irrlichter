(function () {
  "use strict";

  var DATA_URL = "data/events.json";

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (key) {
        var value = attrs[key];
        if (value == null || value === false) return;
        if (key === "class") {
          node.className = value;
        } else {
          node.setAttribute(key, value === true ? "" : value);
        }
      });
    }
    if (children) {
      children.forEach(function (child) {
        if (child == null) return;
        if (typeof child === "string") {
          node.appendChild(document.createTextNode(child));
        } else {
          node.appendChild(child);
        }
      });
    }
    return node;
  }

  function buildItem(event) {
    var children = [
      el("h3", {}, [event.title || ""]),
      el("p", { class: "meta" }, [
        el("time", { datetime: event.date || "" }, [event.date || ""]),
        " \u00b7 " + (event.location || "")
      ]),
      el("p", {}, [event.description || ""])
    ];
    if (event.link) {
      children.push(el("p", {}, [
        el("a", { href: event.link, rel: "noopener" }, ["Weitere Informationen"])
      ]));
    }
    return el("li", {}, children);
  }

  function render(events) {
    var list = document.querySelector("[data-event-list]");
    if (!list) return;
    list.innerHTML = "";
    list.setAttribute("aria-busy", "false");

    if (!Array.isArray(events) || events.length === 0) {
      list.appendChild(el("li", { class: "loading-note" }, [
        "Keine Termine vorhanden."
      ]));
      return;
    }

    var sorted = events.slice().sort(function (a, b) {
      return String(a.date || "").localeCompare(String(b.date || ""));
    });

    sorted.forEach(function (event) {
      list.appendChild(buildItem(event));
    });
  }

  function showError(message) {
    var list = document.querySelector("[data-event-list]");
    if (!list) return;
    list.innerHTML = "";
    list.setAttribute("aria-busy", "false");
    list.appendChild(el("li", { class: "error-note" }, [message]));
  }

  document.addEventListener("DOMContentLoaded", function () {
    fetch(DATA_URL, { cache: "no-cache" })
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then(render)
      .catch(function (err) {
        showError(
          "Termine konnten nicht geladen werden (" + err.message + "). " +
          "Bitte ueber einen Web-Server oeffnen (z. B. python3 -m http.server)."
        );
      });
  });
})();
