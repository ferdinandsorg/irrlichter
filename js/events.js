/** Veranstaltungen calendar — requires site-base.js (irrDataUrl). */
(function () {
  "use strict";

  function eventsDataUrl() {
    if (typeof irrDataUrl === "function") {
      return irrDataUrl("events.json");
    }
    return (window.IRR_SITE_ROOT || "") + "/data/events.json";
  }
  var WEEKDAYS_FULL = [
    "Sonntag",
    "Montag",
    "Dienstag",
    "Mittwoch",
    "Donnerstag",
    "Freitag",
    "Samstag"
  ];

  var MONTHS_FULL = [
    "Januar",
    "Februar",
    "März",
    "April",
    "Mai",
    "Juni",
    "Juli",
    "August",
    "September",
    "Oktober",
    "November",
    "Dezember"
  ];

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

  function parseEventDate(event) {
    var dateStr = event.date || "";
    var match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
    if (!match) return null;

    var y = parseInt(match[1], 10);
    var m = parseInt(match[2], 10) - 1;
    var d = parseInt(match[3], 10);
    var h = 0;
    var min = 0;
    var timeStr = event.time || "";

    if (timeStr) {
      var tp = timeStr.split(":");
      h = parseInt(tp[0], 10) || 0;
      min = parseInt(tp[1], 10) || 0;
    }

    return new Date(y, m, d, h, min);
  }

  function eventSortKey(event) {
    var dt = parseEventDate(event);
    return dt ? dt.getTime() : 0;
  }

  function isPastEvent(event) {
    var dt = parseEventDate(event);
    if (!dt) return false;
    return dt.getTime() < Date.now();
  }

  function formatTimeLabel(timeStr) {
    if (!timeStr) return "";
    var tp = timeStr.split(":");
    var h = parseInt(tp[0], 10);
    var min = parseInt(tp[1], 10) || 0;
    if (isNaN(h)) return timeStr;
    if (min === 0) return h + " Uhr";
    var hh = h < 10 ? "0" + h : String(h);
    var mm = min < 10 ? "0" + min : String(min);
    return hh + ":" + mm + " Uhr";
  }

  function formatEventDateLabel(dt) {
    return (
      dt.getDate() +
      ". " +
      MONTHS_FULL[dt.getMonth()] +
      " " +
      dt.getFullYear()
    );
  }

  function formatEventDateDisplay(event, dt) {
    if (event.dateLabel) {
      return String(event.dateLabel);
    }
    var desc = (event.description || "").trim();
    var prefix = /^([^—\n]+)\s*—/.exec(desc);
    if (prefix && prefix[1] && /\d/.test(prefix[1])) {
      return prefix[1].trim();
    }
    if (!dt) {
      return event.date || "";
    }
    return formatEventDateLabel(dt);
  }

  function formatEventTimeDisplay(event) {
    if (event.hours) {
      return String(event.hours);
    }
    if (event.time) {
      return formatTimeLabel(event.time);
    }
    var desc = (event.description || "").trim();
    if (/^Den ganzen Tag/i.test(desc)) {
      return "Den ganzen Tag";
    }
    if (event.category === "Pfadwerkstatt") {
      return "täglich 12–20 Uhr";
    }
    return "";
  }

  function formatEventWithLabel(event) {
    if (event.with) {
      return String(event.with);
    }
    var desc = (event.description || "").trim();
    var mit = desc.match(/\bMit\s+[^—.(]+/);
    if (mit) {
      return mit[0].trim();
    }
    return "";
  }

  function buildDatetimeAttr(event) {
    var date = event.date || "";
    if (!date) return "";
    if (event.time) return date + "T" + event.time;
    return date;
  }

  function hasExpandableContent(event) {
    return !!(event.description || event.link);
  }

  function buildDateColumn(event) {
    var dt = parseEventDate(event);
    if (!dt) {
      return el("div", { class: "event-calendar__date-col" }, [
        el("time", { datetime: event.date || "" }, [event.date || ""])
      ]);
    }

    var dateChildren = [
      el("span", { class: "event-calendar__weekday" }, [
        WEEKDAYS_FULL[dt.getDay()]
      ]),
      el(
        "time",
        {
          class: "event-calendar__when",
          datetime: buildDatetimeAttr(event)
        },
        [formatEventDateDisplay(event, dt)]
      )
    ];

    return el("div", { class: "event-calendar__date-col" }, dateChildren);
  }

  function buildSummaryMain(event) {
    var mainChildren = [];
    var timeLabel = formatEventTimeDisplay(event);
    var withLabel = formatEventWithLabel(event);

    if (timeLabel) {
      mainChildren.push(
        el("span", { class: "event-calendar__time type-body" }, [timeLabel])
      );
    }

    mainChildren.push(
      el("h3", { class: "event-calendar__title" }, [event.title || ""])
    );

    if (withLabel) {
      mainChildren.push(
        el("p", { class: "event-calendar__with type-body-small" }, [withLabel])
      );
    } else if (event.location) {
      mainChildren.push(
        el("p", { class: "event-calendar__location" }, [event.location])
      );
    }

    return el("div", { class: "event-calendar__summary-text" }, mainChildren);
  }

  function buildSummary(event) {
    var summaryChildren = [buildDateColumn(event), buildSummaryMain(event)];

    if (hasExpandableContent(event)) {
      summaryChildren.push(
        el("span", {
          class: "material-symbols-sharp event-calendar__chevron",
          "aria-hidden": "true"
        }, ["expand_more"])
      );
    }

    return el("summary", { class: "event-calendar__summary" }, summaryChildren);
  }

  function buildExpandableBody(event) {
    var bodyChildren = [];

    if (event.description) {
      bodyChildren.push(
        el("p", { class: "event-calendar__desc type-body-small" }, [
          event.description
        ])
      );
    }

    if (event.link) {
      var linkLabel =
        event.linkLabel || event.link_label || "Weitere Informationen";
      bodyChildren.push(
        el("p", { class: "event-calendar__more" }, [
          el(
            "a",
            {
              href: event.link,
              rel: "noopener",
              class: "event-calendar__more-link"
            },
            [
              linkLabel,
              el("span", {
                class: "material-symbols-sharp event-calendar__more-icon",
                "aria-hidden": "true"
              }, ["arrow_forward"])
            ]
          )
        ])
      );
    }

    return el("div", { class: "event-calendar__body" }, bodyChildren);
  }

  function buildItem(event, isPast) {
    var rowClass = "event-calendar__row";
    if (isPast) rowClass += " event-calendar__row--past";

    var articleChildren;

    if (hasExpandableContent(event)) {
      articleChildren = [
        el("details", { class: "event-calendar__details" }, [
          buildSummary(event),
          buildExpandableBody(event)
        ])
      ];
    } else {
      articleChildren = [
        el("div", { class: "event-calendar__details event-calendar__details--static" }, [
          el("div", { class: "event-calendar__summary event-calendar__summary--static" }, [
            buildDateColumn(event),
            buildSummaryMain(event)
          ])
        ])
      ];
    }

    return el("li", { class: "event-calendar__item" }, [
      el("article", { class: rowClass }, articleChildren)
    ]);
  }

  function buildGroup(title, events, isPast) {
    if (!events.length) return null;

    var listChildren = events.map(function (event) {
      return buildItem(event, isPast);
    });

    return el("section", { class: "event-calendar__group" }, [
      el("h2", { class: "event-calendar__heading" }, [title]),
      el("ol", { class: "event-calendar__list" }, listChildren)
    ]);
  }

  var TERMINE_HASH = "#termine";
  var TERMINE_ID = "termine";

  function scrollToTermineTarget(target) {
    if (!target) return;
    var reduced =
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target.scrollIntoView({
      behavior: reduced ? "auto" : "smooth",
      block: "start"
    });
  }

  function setCalendarScrollTarget(root) {
    root.querySelectorAll("#" + TERMINE_ID).forEach(function (node) {
      node.removeAttribute("id");
    });

    var heading = root.querySelector(
      ".event-calendar__group .event-calendar__heading"
    );
    if (heading) {
      heading.id = TERMINE_ID;
    }
  }

  function scrollToTermineIfHash() {
    if (window.location.hash !== TERMINE_HASH) return;
    var target = document.getElementById(TERMINE_ID);
    if (!target) return;
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        scrollToTermineTarget(target);
      });
    });
  }

  function render(events) {
    var root = document.querySelector("[data-event-calendar]");
    if (!root) return;
    root.innerHTML = "";
    root.setAttribute("aria-busy", "false");

    if (!Array.isArray(events) || events.length === 0) {
      root.appendChild(
        el("p", { class: "loading-note" }, ["Keine Termine vorhanden."])
      );
      setCalendarScrollTarget(root);
      return;
    }

    var sorted = events.slice().sort(function (a, b) {
      return eventSortKey(a) - eventSortKey(b);
    });

    var upcoming = [];
    var past = [];
    sorted.forEach(function (event) {
      if (isPastEvent(event)) {
        past.push(event);
      } else {
        upcoming.push(event);
      }
    });

    past.reverse();

    var groups = [
      buildGroup("Kommende Termine", upcoming, false),
      buildGroup("Vergangene Termine", past, true)
    ].filter(Boolean);

    if (!groups.length) {
      root.appendChild(
        el("p", { class: "loading-note" }, ["Keine Termine vorhanden."])
      );
      setCalendarScrollTarget(root);
      return;
    }

    groups.forEach(function (group) {
      root.appendChild(group);
    });
    setCalendarScrollTarget(root);
    scrollToTermineIfHash();
    if (typeof window.initEventCalendarDetails === "function") {
      window.initEventCalendarDetails(root);
    }
  }

  function showError(message) {
    var root = document.querySelector("[data-event-calendar]");
    if (!root) return;
    root.innerHTML = "";
    root.setAttribute("aria-busy", "false");
    root.appendChild(el("p", { class: "error-note" }, [message]));
    setCalendarScrollTarget(root);
    scrollToTermineIfHash();
  }

  window.irrScrollToTermine = scrollToTermineTarget;

  document.addEventListener("hashchange", scrollToTermineIfHash);

  if (document.readyState !== "loading") {
    scrollToTermineIfHash();
  }

  document.addEventListener("DOMContentLoaded", function () {
    fetch(eventsDataUrl(), { cache: "no-cache" })
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
