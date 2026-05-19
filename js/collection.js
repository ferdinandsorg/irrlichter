(function () {
  "use strict";

  var DATA_URL = "data/collection.json";
  var COLLECTION_PREVIEW_KEY = "irrlichter:collection:preview";
  var MASONRY_DEBOUNCE_MS = 120;
  var masonryRaf = null;
  var masonryResizeTimer = null;
  var masonryResizeAttached = false;

  function masonryColumnCount() {
    var w = document.documentElement.clientWidth;
    if (w < 640) return 1;
    if (w < 1024) return 2;
    return 3;
  }

  function scheduleCollectionMasonry(grid) {
    if (!grid) return;
    if (masonryRaf !== null) {
      cancelAnimationFrame(masonryRaf);
    }
    masonryRaf = requestAnimationFrame(function () {
      masonryRaf = null;
      relayoutCollectionMasonry(grid);
    });
  }

  function relayoutCollectionMasonry(grid) {
    if (!grid || !grid.hasAttribute("data-collection-grid")) return;

    var allCards = [].slice.call(grid.querySelectorAll(".card"));
    if (allCards.length === 0) return;

    var frag = document.createDocumentFragment();
    var i;
    for (i = 0; i < allCards.length; i++) {
      frag.appendChild(allCards[i]);
    }

    var shells = grid.querySelectorAll(
      ".collection-masonry__col, .collection-masonry__hidden"
    );
    for (i = 0; i < shells.length; i++) {
      shells[i].remove();
    }

    var visibleCount = 0;
    for (i = 0; i < allCards.length; i++) {
      if (!allCards[i].classList.contains("hidden-by-filter")) {
        visibleCount++;
      }
    }

    var hiddenBin = el("div", {
      class: "collection-masonry__hidden",
      "aria-hidden": "true"
    });
    grid.appendChild(hiddenBin);

    if (visibleCount === 0) {
      for (i = 0; i < allCards.length; i++) {
        hiddenBin.appendChild(allCards[i]);
      }
      return;
    }

    var n = masonryColumnCount();
    var columns = [];
    for (i = 0; i < n; i++) {
      var col = el("div", { class: "collection-masonry__col" });
      columns.push({ el: col });
      grid.appendChild(col);
    }

    function shortestColumnIndex() {
      var best = 0;
      var j;
      for (j = 1; j < columns.length; j++) {
        if (columns[j].el.scrollHeight < columns[best].el.scrollHeight) {
          best = j;
        }
      }
      return best;
    }

    for (i = 0; i < allCards.length; i++) {
      var card = allCards[i];
      if (card.classList.contains("hidden-by-filter")) {
        hiddenBin.appendChild(card);
      } else {
        columns[shortestColumnIndex()].el.appendChild(card);
      }
    }
  }

  function bindCollectionMasonryImageLoads(grid) {
    grid.querySelectorAll("img.card-media__img").forEach(function (img) {
      if (img.complete) return;
      img.addEventListener(
        "load",
        function () {
          scheduleCollectionMasonry(grid);
        },
        { once: true }
      );
    });
  }

  function attachCollectionMasonryResize() {
    if (masonryResizeAttached) return;
    masonryResizeAttached = true;
    window.addEventListener("resize", function () {
      clearTimeout(masonryResizeTimer);
      masonryResizeTimer = setTimeout(function () {
        var g = document.querySelector("[data-collection-grid]");
        if (g) scheduleCollectionMasonry(g);
      }, MASONRY_DEBOUNCE_MS);
    });
  }

  function notifyCollectionSurfacesChanged() {
    document.dispatchEvent(new CustomEvent("irrlichter:collection-rendered"));
  }

  function text(node, value) {
    node.textContent = value == null ? "" : String(value);
    return node;
  }

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (key) {
        var value = attrs[key];
        if (value == null || value === false) return;
        if (key === "class") {
          node.className = value;
        } else if (key === "dataset") {
          Object.keys(value).forEach(function (k) {
            node.dataset[k] = value[k];
          });
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

  function typeLabelDe(type) {
    var m = {
      image: "Bild",
      video: "Video",
      text: "Text",
      audio: "Audio"
    };
    return m[type] || type || "";
  }

  function formatDateDe(iso) {
    if (!iso) return "";
    var s = String(iso).slice(0, 10);
    var p = s.split("-");
    if (p.length !== 3) return String(iso);
    return p[2] + "." + p[1] + "." + p[0];
  }

  function buildMedia(item) {
    var media = item.media || {};
    var alt = media.alt || "";
    var src = media.src || "";

    if (item.type === "image" && src) {
      return el("div", { class: "card-media card-media--image" }, [
        el("img", {
          class: "card-media__img",
          src: src,
          alt: alt,
          loading: "lazy",
          decoding: "async"
        })
      ]);
    }
    if (item.type === "video" && src) {
      return el("div", { class: "card-media card-media--video" }, [
        el("video", {
          class: "card-media__video",
          controls: true,
          preload: "metadata",
          playsinline: true,
          poster: media.poster || null
        }, [
          el("source", { src: src, type: "video/mp4" }),
          document.createTextNode(alt)
        ])
      ]);
    }
    if (item.type === "audio" && src) {
      var playLabel = (item.title || "Audio") + ": abspielen";
      var playGlyph = el(
        "span",
        { class: "material-symbols-sharp", "aria-hidden": "true" },
        ["play_arrow"]
      );
      return el("div", { class: "card-audio-player" }, [
        el("div", { class: "card-audio-player__ui" }, [
          el(
            "button",
            {
              type: "button",
              class: "card-audio-player__play",
              "aria-label": playLabel
            },
            [playGlyph]
          ),
          el("span", { class: "card-audio-player__times" }, [
            el("span", { class: "card-audio-time-current" }, ["0:00"]),
            el("span", { class: "card-audio-sep", "aria-hidden": "true" }, ["\u2014"]),
            el("span", { class: "card-audio-time-total" }, ["0:00"])
          ]),
          el("div", {
            class: "card-audio-progress",
            role: "progressbar",
            tabindex: "0",
            "aria-valuemin": "0",
            "aria-valuemax": "0",
            "aria-valuenow": "0",
            "aria-label": "Wiedergabeposition"
          }, [
            el("div", { class: "card-audio-progress__fill" })
          ])
        ]),
        el("audio", {
          class: "card-audio__native",
          preload: "metadata"
        }, [
          el("source", { src: src, type: "audio/mpeg" })
        ])
      ]);
    }
    if (item.type === "text") {
      return el("div", { class: "card-lead" }, [
        el("p", { class: "card-lead__text" }, [item.summary || ""])
      ]);
    }
    return el("div", { class: "card-media card-media--empty" });
  }

  function buildSearchBlob(item) {
    var parts = [
      item.title,
      item.summary,
      item.date,
      item.type,
      item.location,
      item.coordinates,
      (item.tags || []).join(" ")
    ];
    return parts
      .filter(function (p) {
        return p != null && String(p).trim() !== "";
      })
      .join(" ")
      .toLowerCase();
  }

  function buildCardHead(item) {
    return el("div", { class: "card-head" }, [
      el("h3", { class: "card-title" }, [item.title || ""]),
      el("p", { class: "card-meta" }, [
        el("span", { class: "card-meta__date" }, [formatDateDe(item.date)]),
        el("span", { class: "card-meta__sep", "aria-hidden": "true" }, ["\u2014"]),
        el("span", { class: "card-meta__type" }, [typeLabelDe(item.type)])
      ])
    ]);
  }

  function buildCardSummary(item) {
    return el("p", { class: "card-summary" }, [item.summary || ""]);
  }

  function buildTags(item) {
    return el("div", { class: "card-tags", role: "group", "aria-label": "Tags" }, (item.tags || []).map(function (t) {
      return el("button", {
        type: "button",
        class: "card-tag",
        "data-tag": t,
        title: 'Nach Tag filtern: "' + t + '"'
      }, [t]);
    }));
  }

  function buildCard(item) {
    var tagsAttr = (item.tags || []).join(",");
    var t = item.type || "";
    var mod = t ? " card--" + t : "";
    var children = [];
    var mediaBlock = buildMedia(item);

    if (t === "text") {
      children.push(mediaBlock);
      children.push(buildCardHead(item));
      if (item.location && String(item.location).trim()) {
        children.push(el("p", { class: "card-summary card-summary--context" }, [
          String(item.location)
        ]));
      }
      children.push(buildTags(item));
    } else {
      children.push(mediaBlock);
      children.push(buildCardHead(item));
      children.push(buildCardSummary(item));
      children.push(buildTags(item));
    }

    return el("article", {
      class: "card" + mod,
      "data-type": t,
      "data-tags": tagsAttr,
      "data-search-blob": buildSearchBlob(item)
    }, children);
  }

  function wireAudioCard(article) {
    var audio = article.querySelector(".card-audio__native");
    if (!audio) return;
    var btn = article.querySelector(".card-audio-player__play");
    var current = article.querySelector(".card-audio-time-current");
    var total = article.querySelector(".card-audio-time-total");
    var fill = article.querySelector(".card-audio-progress__fill");
    var track = article.querySelector(".card-audio-progress");
    var titleEl = article.querySelector(".card-title");
    var titleText = (titleEl && titleEl.textContent.trim()) || "Audio";

    function fmt(sec) {
      sec = Math.max(0, Math.floor(sec || 0));
      var m = Math.floor(sec / 60);
      var s = sec % 60;
      return m + ":" + (s < 10 ? "0" : "") + s;
    }

    function setPlayUi(playing) {
      if (!btn) return;
      var glyph = btn.querySelector(".material-symbols-sharp");
      if (glyph) {
        text(glyph, playing ? "pause" : "play_arrow");
      }
      btn.setAttribute(
        "aria-label",
        titleText + (playing ? ": pausieren" : ": abspielen")
      );
    }

    function syncProgressA11y() {
      if (!track) return;
      if (isFinite(audio.duration) && audio.duration > 0) {
        track.setAttribute("aria-valuemax", String(Math.floor(audio.duration)));
        track.setAttribute(
          "aria-valuenow",
          String(Math.floor(audio.currentTime))
        );
      } else {
        track.setAttribute("aria-valuemax", "0");
        track.setAttribute("aria-valuenow", "0");
      }
    }

    function onMeta() {
      if (total && isFinite(audio.duration)) {
        text(total, fmt(audio.duration));
      }
      syncProgressA11y();
    }

    function onTime() {
      if (current) text(current, fmt(audio.currentTime));
      if (fill && isFinite(audio.duration) && audio.duration > 0) {
        fill.style.width =
          Math.min(100, (audio.currentTime / audio.duration) * 100) + "%";
      }
      syncProgressA11y();
    }

    function scrubToClientX(clientX) {
      if (!track || !isFinite(audio.duration) || audio.duration <= 0) return;
      var rect = track.getBoundingClientRect();
      var w = rect.width;
      if (w < 1) return;
      var ratio = Math.min(1, Math.max(0, (clientX - rect.left) / w));
      try {
        audio.currentTime = ratio * audio.duration;
      } catch (err) {}
    }

    var scrubbing = false;

    if (track) {
      track.addEventListener("pointerdown", function (e) {
        if (e.pointerType === "mouse" && e.button !== 0) return;
        scrubbing = true;
        try {
          track.setPointerCapture(e.pointerId);
        } catch (err) {}
        scrubToClientX(e.clientX);
        e.preventDefault();
      });
      track.addEventListener("pointermove", function (e) {
        if (!scrubbing) return;
        scrubToClientX(e.clientX);
      });
      track.addEventListener("pointerup", function (e) {
        if (!scrubbing) return;
        scrubbing = false;
        try {
          track.releasePointerCapture(e.pointerId);
        } catch (err) {}
      });
      track.addEventListener("pointercancel", function (e) {
        scrubbing = false;
        try {
          track.releasePointerCapture(e.pointerId);
        } catch (err) {}
      });
      track.addEventListener("lostpointercapture", function () {
        scrubbing = false;
      });
      track.addEventListener("keydown", function (e) {
        if (!isFinite(audio.duration) || audio.duration <= 0) return;
        var step = 5;
        if (e.key === "ArrowRight" || e.key === "ArrowUp") {
          e.preventDefault();
          audio.currentTime = Math.min(
            audio.duration,
            audio.currentTime + step
          );
        } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
          e.preventDefault();
          audio.currentTime = Math.max(0, audio.currentTime - step);
        } else if (e.key === "Home") {
          e.preventDefault();
          audio.currentTime = 0;
        } else if (e.key === "End") {
          e.preventDefault();
          audio.currentTime = audio.duration;
        } else if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          var r = track.getBoundingClientRect();
          scrubToClientX(r.left + r.width / 2);
        }
      });
    }

    if (btn) {
      btn.addEventListener("click", function (ev) {
        ev.stopPropagation();
        if (audio.paused) {
          audio.play().catch(function () {});
        } else {
          audio.pause();
        }
      });
    }

    audio.addEventListener("play", function () {
      setPlayUi(true);
    });
    audio.addEventListener("pause", function () {
      setPlayUi(false);
    });
    audio.addEventListener("ended", function () {
      setPlayUi(false);
      if (fill) fill.style.width = "0%";
      if (current) text(current, fmt(0));
      syncProgressA11y();
    });

    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("durationchange", onMeta);
    audio.addEventListener("timeupdate", onTime);
    setPlayUi(!audio.paused);
    onMeta();
    onTime();
  }

  function unique(values) {
    var seen = Object.create(null);
    var out = [];
    values.forEach(function (v) {
      if (v == null || v === "") return;
      if (!seen[v]) {
        seen[v] = true;
        out.push(v);
      }
    });
    return out;
  }

  function fillSelect(select, values, allLabel) {
    if (!select) return;
    while (select.options.length > 1) {
      select.remove(1);
    }
    if (select.options.length === 0) {
      select.appendChild(new Option(allLabel, "all"));
    }
    values.forEach(function (v) {
      select.appendChild(new Option(v, v));
    });
  }

  function applyFilters(grid, typeSelect, tagSelect, searchInput) {
    var selectedType = (typeSelect && typeSelect.value) || "all";
    var selectedTag = (tagSelect && tagSelect.value) || "all";
    var q = (searchInput && searchInput.value && searchInput.value.trim().toLowerCase()) || "";
    var cards = grid.querySelectorAll(".card");
    cards.forEach(function (card) {
      var cardType = card.getAttribute("data-type") || "";
      var cardTags = (card.getAttribute("data-tags") || "").split(",");
      var haystack = card.getAttribute("data-search-blob") || "";
      var typeMatch = selectedType === "all" || cardType === selectedType;
      var tagMatch = selectedTag === "all" || cardTags.indexOf(selectedTag) !== -1;
      var searchMatch = !q || haystack.indexOf(q) !== -1;
      card.classList.toggle("hidden-by-filter", !(typeMatch && tagMatch && searchMatch));
    });

    grid.querySelectorAll(".card-tag").forEach(function (btn) {
      var t = btn.getAttribute("data-tag") || "";
      var on = selectedTag !== "all" && t === selectedTag;
      btn.classList.toggle("card-tag--active", on);
    });

    scheduleCollectionMasonry(grid);
  }

  function render(items) {
    var grid = document.querySelector("[data-collection-grid]");
    if (!grid) return;
    grid.innerHTML = "";
    grid.setAttribute("aria-busy", "false");

    if (!Array.isArray(items) || items.length === 0) {
      grid.appendChild(el("p", { class: "loading-note" }, [
        "Keine Eintraege vorhanden."
      ]));
      notifyCollectionSurfacesChanged();
      return;
    }

    var sorted = items.slice().sort(function (a, b) {
      return String(b.date || "").localeCompare(String(a.date || ""));
    });

    sorted.forEach(function (item) {
      grid.appendChild(buildCard(item));
    });

    grid.querySelectorAll(".card--audio").forEach(wireAudioCard);

    var types = unique(sorted.map(function (i) { return i.type; }));
    var tags = unique([].concat.apply([], sorted.map(function (i) {
      return i.tags || [];
    }))).sort();

    var typeSelect = document.querySelector("[data-filter-type]");
    var tagSelect = document.querySelector("[data-filter-tag]");
    var searchInput = document.querySelector("[data-filter-search]");
    fillSelect(typeSelect, types, "Alle Typen");
    fillSelect(tagSelect, tags, "Alle Tags");

    var run = function () {
      applyFilters(grid, typeSelect, tagSelect, searchInput);
    };
    if (typeSelect) typeSelect.addEventListener("change", run);
    if (tagSelect) tagSelect.addEventListener("change", run);
    if (searchInput) searchInput.addEventListener("input", run);
    run();
    grid.addEventListener("click", function (e) {
      var tagBtn = e.target && e.target.closest && e.target.closest("button.card-tag");
      if (!tagBtn || !grid.contains(tagBtn)) return;
      e.preventDefault();
      var tagVal = tagBtn.getAttribute("data-tag") || "";
      if (!tagSelect || !tagVal) return;
      var hasOption = false;
      for (var i = 0; i < tagSelect.options.length; i++) {
        if (tagSelect.options[i].value === tagVal) {
          hasOption = true;
          break;
        }
      }
      if (!hasOption) return;
      tagSelect.value = tagVal;
      run();
      tagSelect.focus();
    });

    scheduleCollectionMasonry(grid);
    bindCollectionMasonryImageLoads(grid);
    attachCollectionMasonryResize();
    notifyCollectionSurfacesChanged();
  }

  function showError(message) {
    var grid = document.querySelector("[data-collection-grid]");
    if (!grid) return;
    grid.innerHTML = "";
    grid.setAttribute("aria-busy", "false");
    grid.appendChild(el("p", { class: "error-note" }, [message]));
    notifyCollectionSurfacesChanged();
  }

  function readCollectionPreview() {
    try {
      var raw = sessionStorage.getItem(COLLECTION_PREVIEW_KEY);
      if (!raw) return null;
      var data = JSON.parse(raw);
      return Array.isArray(data) ? data : null;
    } catch (err) {
      return null;
    }
  }

  function showPreviewNote(grid) {
    if (!grid) return;
    var note = el("p", { class: "meta preview-note" }, [
      "Anzeige: Vorschau aus der Admin-Sitzung (nicht die Datei auf dem Server). " +
        "Dauerhaft: JSON im Admin herunterladen und als data/collection.json ablegen. " +
        "Tab schliessen setzt die Vorschau zurueck."
    ]);
    grid.insertBefore(note, grid.firstChild);
    scheduleCollectionMasonry(grid);
  }

  document.addEventListener("DOMContentLoaded", function () {
    var preview = readCollectionPreview();
    if (preview) {
      var grid = document.querySelector("[data-collection-grid]");
      render(preview);
      showPreviewNote(grid);
      return;
    }

    fetch(DATA_URL, { cache: "no-cache" })
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then(render)
      .catch(function (err) {
        showError(
          "Sammlung konnte nicht geladen werden (" + err.message + "). " +
          "Bitte ueber einen Web-Server oeffnen (z. B. python3 -m http.server)."
        );
      });
  });
})();
