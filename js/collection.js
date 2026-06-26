/** Home Sammlung scatter + filters — requires site-base.js (irrDataUrl). */
(function () {
  "use strict";

  function collectionDataUrl() {
    if (typeof irrDataUrl === "function") {
      return irrDataUrl("collection.json");
    }
    return (window.IRR_SITE_ROOT || "") + "/data/collection.json";
  }
  var SCATTER_DEBOUNCE_MS = 120;
  var SCATTER_DENSITY_EPS = 0.01;
  var SCATTER_MAX_ATTEMPTS = 80;
  var SCATTER_PADDING = 16;
  /** Feste Parameter fuer Kartenpositionen (sparse); Scroll aendert nur Opazitaet/Skalierung. */
  var SCATTER_LAYOUT_DENSITY = 0;
  var scatterRaf = null;
  var scatterResizeTimer = null;
  var scatterResizeAttached = false;
  var scatterScrollAttached = false;
  var lastScatterDensity = null;

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function hashSeed(str) {
    var h = 2166136261;
    var i;
    for (i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function createRng(seed) {
    var s = seed >>> 0;
    return function () {
      s += 0x6d2b79f5;
      var t = Math.imul(s ^ (s >>> 15), 1 | s);
      t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function readScrollDensity() {
    var v = getComputedStyle(document.documentElement)
      .getPropertyValue("--scroll-shift")
      .trim();
    var n = parseFloat(v);
    return isNaN(n) ? 0 : Math.min(1, Math.max(0, n));
  }

  function rectsCollide(a, b, gapX, gapY) {
    var padY = Math.max(a.h, b.h) * 0.06;
    return !(
      a.x + a.w + gapX <= b.x ||
      b.x + b.w + gapX <= a.x ||
      a.y + a.h + gapY + padY <= b.y ||
      b.y + b.h + gapY + padY <= a.y
    );
  }

  function collidesAny(rect, placed, gapX, gapY) {
    var i;
    for (i = 0; i < placed.length; i++) {
      if (rectsCollide(rect, placed[i], gapX, gapY)) {
        return true;
      }
    }
    return false;
  }

  function updateCollectionScatterDensity(grid, density) {
    if (!grid) return;
    density = Math.min(1, Math.max(0, density));
    if (
      lastScatterDensity !== null &&
      Math.abs(density - lastScatterDensity) < SCATTER_DENSITY_EPS
    ) {
      return;
    }
    lastScatterDensity = density;
    grid.style.setProperty("--collection-density", String(density));
  }

  function scheduleCollectionScatter(grid, force) {
    if (!grid) return;
    if (scatterRaf !== null) {
      if (!force) return;
      cancelAnimationFrame(scatterRaf);
    }
    scatterRaf = requestAnimationFrame(function () {
      scatterRaf = null;
      relayoutCollectionScatter(grid);
      updateCollectionScatterDensity(grid, readScrollDensity());
    });
  }

  function collectionSortKey(item) {
    var raw = String(item.date || "").trim();
    if (!raw) return 0;
    var match = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw);
    if (match) {
      return new Date(
        parseInt(match[1], 10),
        parseInt(match[2], 10) - 1,
        parseInt(match[3], 10)
      ).getTime();
    }
    return raw;
  }

  function relayoutCollectionScatter(grid) {
    if (!grid || !grid.hasAttribute("data-collection-grid")) return;

    var layoutDensity = SCATTER_LAYOUT_DENSITY;

    var allCards = [].slice.call(grid.querySelectorAll(".card"));
    if (allCards.length === 0) {
      grid.style.minHeight = "";
      return;
    }

    var frag = document.createDocumentFragment();
    var i;
    for (i = 0; i < allCards.length; i++) {
      frag.appendChild(allCards[i]);
    }

    var shells = grid.querySelectorAll(".collection-scatter__hidden");
    for (i = 0; i < shells.length; i++) {
      shells[i].remove();
    }

    var hiddenBin = el("div", {
      class: "collection-scatter__hidden",
      "aria-hidden": "true"
    });
    grid.appendChild(hiddenBin);

    var visible = [];
    for (i = 0; i < allCards.length; i++) {
      var card = allCards[i];
      card.style.position = "";
      card.style.left = "";
      card.style.top = "";
      card.style.width = "";
      card.style.visibility = "";
      if (card.classList.contains("hidden-by-filter")) {
        hiddenBin.appendChild(card);
      } else {
        visible.push(card);
      }
    }

    if (visible.length === 0) {
      grid.style.minHeight = "";
      return;
    }

    var containerWidth = grid.clientWidth;
    if (containerWidth <= 0) {
      return;
    }

    var mobile = containerWidth < 640;
    var cardWidth = mobile ? containerWidth : Math.min(438, containerWidth);
    var minGapX = lerp(mobile ? 32 : 48, 16, layoutDensity);
    var minGapY = lerp(mobile ? 48 : 72, 20, layoutDensity);
    var xSpread = mobile ? 0.2 : 1;

    var sizes = [];
    for (i = 0; i < visible.length; i++) {
      card = visible[i];
      card.style.position = "absolute";
      card.style.visibility = "hidden";
      card.style.width = cardWidth + "px";
      card.style.left = "0";
      card.style.top = "0";
      card.style.contentVisibility = "visible";
      grid.appendChild(card);
      var seedStr =
        card.getAttribute("data-item-id") ||
        card.getAttribute("data-search-blob") ||
        String(i);
      sizes.push({
        card: card,
        w: card.offsetWidth,
        h: card.offsetHeight,
        seed: hashSeed(seedStr)
      });
      card.style.contentVisibility = "";
    }

    var placed = [];
    var chronoMinY = SCATTER_PADDING;

    for (i = 0; i < sizes.length; i++) {
      var item = sizes[i];
      var rng = createRng(item.seed);
      var w = item.w;
      var h = item.h;
      var maxX = Math.max(0, containerWidth - w);
      var placedRect = null;
      var attempt;

      for (attempt = 0; attempt < SCATTER_MAX_ATTEMPTS; attempt++) {
        var x;
        if (mobile) {
          x = maxX * 0.5 + (rng() - 0.5) * maxX * xSpread;
        } else {
          x = rng() * maxX;
        }
        x = Math.max(0, Math.min(maxX, x));
        var y = chronoMinY + (attempt > 0 ? minGapY * attempt : 0);
        var rect = { x: x, y: y, w: w, h: h };
        if (!collidesAny(rect, placed, minGapX, minGapY)) {
          placedRect = rect;
          break;
        }
      }

      if (!placedRect) {
        var fx = mobile
          ? Math.max(0, (containerWidth - w) * 0.5)
          : rng() * maxX;
        fx = Math.max(0, Math.min(maxX, fx));
        placedRect = {
          x: fx,
          y: chronoMinY,
          w: w,
          h: h
        };
        while (collidesAny(placedRect, placed, minGapX, minGapY)) {
          placedRect.y += minGapY;
        }
      }

      item.card.style.visibility = "";
      item.card.style.left = placedRect.x + "px";
      item.card.style.top = placedRect.y + "px";
      item.card.style.setProperty("--card-stack", String(i));
      placed.push(placedRect);
      chronoMinY = Math.max(
        chronoMinY,
        placedRect.y + placedRect.h + minGapY
      );
    }

    var totalH = SCATTER_PADDING;
    for (i = 0; i < placed.length; i++) {
      totalH = Math.max(totalH, placed[i].y + placed[i].h + SCATTER_PADDING);
    }
    grid.style.minHeight = totalH + "px";
  }

  function applyMediaWrapAspect(wrap, width, height) {
    if (!wrap || !width || !height) return;
    wrap.style.aspectRatio = String(width) + " / " + String(height);
  }

  function captureVideoPosterFromFirstFrame(video, grid) {
    if (!video || video.getAttribute("poster") || video.poster) return;
    if (video.dataset.posterFromFrame === "1") return;

    video.muted = true;
    video.playsInline = true;

    function markPosterReady() {
      var wrap = video.closest(".card-media--video");
      if (wrap) {
        wrap.classList.add("card-media--has-poster");
      }
    }

    function drawFrame() {
      if (!video.videoWidth || !video.videoHeight) return;
      var canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      var ctx = canvas.getContext("2d");
      if (!ctx) return;
      try {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        video.poster = canvas.toDataURL("image/jpeg", 0.85);
        video.dataset.posterFromFrame = "1";
        markPosterReady();
        if (grid) scheduleCollectionScatter(grid, true);
      } catch (err) {
        /* z. B. cross-origin */
      }
    }

    function seekToFirstFrame() {
      var onSeeked = function () {
        video.removeEventListener("seeked", onSeeked);
        drawFrame();
      };
      video.addEventListener("seeked", onSeeked);
      try {
        var t = 0.04;
        if (isFinite(video.duration) && video.duration > 0) {
          t = Math.min(0.04, video.duration * 0.01);
        }
        video.currentTime = t;
      } catch (err) {
        drawFrame();
      }
    }

    if (video.readyState >= 2) {
      seekToFirstFrame();
    } else {
      video.addEventListener("loadeddata", seekToFirstFrame, { once: true });
      video.addEventListener("loadedmetadata", seekToFirstFrame, { once: true });
    }
  }

  function wireCardMediaAspect(card, grid) {
    var img = card.querySelector("img.card-media__img");
    if (img) {
      function onImgReady() {
        if (grid) scheduleCollectionScatter(grid, true);
      }
      if (img.complete) {
        onImgReady();
      } else {
        img.addEventListener("load", onImgReady, { once: true });
      }
    }

    var video = card.querySelector("video.card-media__video");
    if (video) {
      captureVideoPosterFromFirstFrame(video, grid);

      function onVideoMeta() {
        if (video.videoWidth && video.videoHeight) {
          applyMediaWrapAspect(
            video.closest(".card-media"),
            video.videoWidth,
            video.videoHeight
          );
        }
        if (grid) scheduleCollectionScatter(grid, true);
      }
      if (video.readyState >= 1) {
        onVideoMeta();
      }
      video.addEventListener("loadedmetadata", onVideoMeta, { once: true });
    }
  }

  function pauseCardVideos() {
    document.querySelectorAll("video.card-media__video").forEach(function (video) {
      video.pause();
    });
  }

  function openLightbox(payload) {
    if (!window.irrMediaLightbox) return;
    pauseCardVideos();
    window.irrMediaLightbox.open(payload);
  }

  function wireCardMediaLightbox(card) {
    var imgWrap = card.querySelector(".card-media--image");
    if (imgWrap) {
      var img = imgWrap.querySelector("img.card-media__img");
      if (!img) return;
      var imgLabel = (img.alt && img.alt.trim()) || "Bild";
      imgWrap.setAttribute("role", "button");
      imgWrap.setAttribute("tabindex", "0");
      imgWrap.setAttribute("aria-label", imgLabel + " vergrößern");

      function openImage() {
        openLightbox({
          kind: "image",
          src: img.currentSrc || img.src,
          alt: img.alt || ""
        });
      }

      imgWrap.addEventListener("click", openImage);
      imgWrap.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openImage();
        }
      });
    }

    var videoWrap = card.querySelector(".card-media--video");
    if (videoWrap) {
      var video = videoWrap.querySelector("video.card-media__video");
      if (!video) return;
      var titleEl = card.querySelector(".card-title");
      var videoLabel = (titleEl && titleEl.textContent.trim()) || "Video";
      videoWrap.setAttribute("role", "button");
      videoWrap.setAttribute("tabindex", "0");
      videoWrap.setAttribute("aria-label", videoLabel + " in Vollbild abspielen");

      function openVideo() {
        openLightbox({
          kind: "video",
          src: video.currentSrc || video.src || "",
          poster: video.getAttribute("poster") || ""
        });
      }

      videoWrap.addEventListener("click", openVideo);
      videoWrap.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openVideo();
        }
      });
    }
  }

  function bindCollectionMediaLightbox(grid) {
    if (!grid) return;
    grid.querySelectorAll(".card").forEach(wireCardMediaLightbox);
  }

  function bindCollectionScatterMediaLoads(grid) {
    grid.querySelectorAll(".card").forEach(function (card) {
      wireCardMediaAspect(card, grid);
    });
  }

  function attachCollectionScatterResize() {
    if (scatterResizeAttached) return;
    scatterResizeAttached = true;
    window.addEventListener("resize", function () {
      clearTimeout(scatterResizeTimer);
      scatterResizeTimer = setTimeout(function () {
        var g = document.querySelector("[data-collection-grid]");
        if (g) scheduleCollectionScatter(g, true);
      }, SCATTER_DEBOUNCE_MS);
    });
  }

  function attachCollectionScatterScroll() {
    if (scatterScrollAttached) return;
    scatterScrollAttached = true;
    document.addEventListener("irrlichter:scroll-ambient", function (e) {
      var grid = document.querySelector("[data-collection-grid]");
      if (!grid) return;
      var t =
        e.detail && e.detail.t !== undefined && e.detail.t !== null
          ? e.detail.t
          : readScrollDensity();
      updateCollectionScatterDensity(grid, t);
    });
  }

  function notifyCollectionSurfacesChanged() {
    document.dispatchEvent(new CustomEvent("irrlichter:collection-rendered"));
  }

  var COLLECTION_TOOLBAR_STACK_MQ = "(max-width: 430px)";

  function bindCollectionToolbarLayout(toolbar) {
    var layoutRaf = null;
    var stackMq =
      typeof window.matchMedia === "function"
        ? window.matchMedia(COLLECTION_TOOLBAR_STACK_MQ)
        : null;

    function updateCollectionToolbarLayout() {
      if (layoutRaf) {
        cancelAnimationFrame(layoutRaf);
      }
      layoutRaf = requestAnimationFrame(function () {
        layoutRaf = null;
        if (toolbar.hasAttribute("hidden")) {
          toolbar.classList.remove("collection-toolbar--stacked");
          return;
        }
        var stacked = stackMq && stackMq.matches;
        toolbar.classList.toggle("collection-toolbar--stacked", !!stacked);
      });
    }

    if (typeof ResizeObserver === "function") {
      var ro = new ResizeObserver(updateCollectionToolbarLayout);
      ro.observe(toolbar);
      var stack = toolbar.closest(".info-card__stack");
      if (stack) {
        ro.observe(stack);
      }
    }

    window.addEventListener("resize", updateCollectionToolbarLayout, {
      passive: true
    });
    if (stackMq && typeof stackMq.addEventListener === "function") {
      stackMq.addEventListener("change", updateCollectionToolbarLayout);
    } else if (stackMq && typeof stackMq.addListener === "function") {
      stackMq.addListener(updateCollectionToolbarLayout);
    }
    document.addEventListener(
      "irrlichter:collection-rendered",
      updateCollectionToolbarLayout
    );

    if (typeof MutationObserver === "function") {
      var mo = new MutationObserver(updateCollectionToolbarLayout);
      mo.observe(toolbar, {
        attributes: true,
        attributeFilter: ["hidden"]
      });
    }

    return updateCollectionToolbarLayout;
  }

  function initCollectionToolbarReveal() {
    var section = document.getElementById("sammlung");
    var card = document.getElementById("site-info-card");
    var toolbar = document.querySelector("[data-collection-toolbar]");
    var cta = document.querySelector("[data-scroll-to-collection]");
    if (!section || !card || !toolbar) {
      return;
    }

    var updateCollectionToolbarLayout = bindCollectionToolbarLayout(toolbar);
    var scrollToCollectionPending = false;

    function setCollectionChromeInView(inView) {
      card.classList.toggle("info-card--collection-in-view", inView);
      toolbar.hidden = !inView;
      toolbar.setAttribute("aria-hidden", inView ? "false" : "true");
      if (cta) {
        if (cta.classList.contains("info-card__collection-cta--to-top")) {
          /* Sichtbarkeit bei Seitenende — main.js */
        } else if (inView) {
          cta.hidden = true;
          cta.setAttribute("aria-hidden", "true");
          cta.setAttribute("tabindex", "-1");
        } else {
          cta.removeAttribute("hidden");
          cta.removeAttribute("aria-hidden");
          cta.removeAttribute("tabindex");
        }
      }
      updateCollectionToolbarLayout();
      document.dispatchEvent(
        new CustomEvent("irrlichter:info-card-toolbar-chrome", {
          detail: { collectionInView: inView }
        })
      );
    }

    if (cta) {
      cta.addEventListener("click", function (e) {
        if (cta.classList.contains("info-card__collection-cta--to-top")) {
          e.preventDefault();
          e.stopPropagation();
          document.dispatchEvent(
            new CustomEvent("irrlichter:scroll-page-top")
          );
          return;
        }
        e.preventDefault();
        scrollToCollectionPending = true;
        setCollectionChromeInView(true);
        var reduced =
          window.matchMedia &&
          window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        section.scrollIntoView({
          behavior: reduced ? "auto" : "smooth",
          block: "start"
        });
      });
    }

    if (typeof IntersectionObserver === "undefined") {
      setCollectionChromeInView(true);
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.target !== section) {
            return;
          }
          if (entry.isIntersecting) {
            scrollToCollectionPending = false;
            setCollectionChromeInView(true);
            return;
          }
          if (!scrollToCollectionPending) {
            setCollectionChromeInView(false);
          }
        });
      },
      { threshold: 0.02, rootMargin: "0px 0px -4% 0px" }
    );
    observer.observe(section);
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

  function mediaMimeType(src, kind) {
    var ext = (src || "").split("?")[0].split(".").pop().toLowerCase();
    if (kind === "video") {
      if (ext === "mov") return "video/quicktime";
      if (ext === "webm") return "video/webm";
      return "video/mp4";
    }
    if (kind === "audio") {
      if (ext === "m4a") return "audio/mp4";
      if (ext === "mp3") return "audio/mpeg";
      if (ext === "wav") return "audio/wav";
      return "audio/mpeg";
    }
    return "";
  }

  function buildMedia(item, mediaIndex) {
    var media = item.media || {};
    var alt = media.alt || "";
    var src = media.src || "";
    var eager = typeof mediaIndex === "number" && mediaIndex < 2;

    if (item.type === "image" && src) {
      var imgAttrs = {
        class: "card-media__img",
        src: src,
        alt: alt,
        loading: eager ? "eager" : "lazy",
        decoding: "async"
      };
      if (eager) {
        imgAttrs.fetchPriority = "high";
      }
      return el("div", { class: "card-media card-media--image" }, [
        el("img", imgAttrs)
      ]);
    }
    if (item.type === "video" && src) {
      var videoAttrs = {
        class: "card-media__video",
        preload: "metadata",
        playsinline: true,
        muted: true,
        src: src
      };
      if (media.poster) {
        videoAttrs.poster = media.poster;
      }
      var playGlyph =
        typeof irrIcon === "function"
          ? irrIcon("play_arrow", "card-media__play-icon")
          : el("span", {
              class: "irr-icon card-media__play-icon",
              "aria-hidden": "true"
            }, ["▶"]);
      return el("div", { class: "card-media card-media--video" }, [
        el("video", videoAttrs, [
          el("source", { src: src, type: mediaMimeType(src, "video") }),
          document.createTextNode(alt)
        ]),
        el("span", { class: "card-media__play", "aria-hidden": "true" }, [
          el("span", { class: "card-media__play-btn" }, [playGlyph])
        ])
      ]);
    }
    if (item.type === "audio" && src) {
      var playLabel = (item.title || "Audio") + ": abspielen";
      var playGlyph =
        typeof irrIcon === "function"
          ? irrIcon("play_arrow")
          : el("span", { class: "irr-icon", "aria-hidden": "true" }, ["▶"]);
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
          el("source", { src: src, type: mediaMimeType(src, "audio") })
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

  function buildCard(item, cardIndex) {
    var tagsAttr = (item.tags || []).join(",");
    var t = item.type || "";
    var mod = t ? " card--" + t : "";
    var children = [];
    var mediaBlock = buildMedia(item, cardIndex);

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

    var attrs = {
      class: "card" + mod,
      "data-type": t,
      "data-tags": tagsAttr,
      "data-search-blob": buildSearchBlob(item)
    };
    if (item.id) {
      attrs["data-item-id"] = String(item.id);
    }
    return el("article", attrs, children);
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
      var glyph = btn.querySelector(".irr-icon");
      if (glyph && typeof irrSetIconName === "function") {
        irrSetIconName(glyph, playing ? "pause" : "play_arrow");
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

  function selectHasOption(select, value) {
    if (!select || !value) return false;
    var i;
    for (i = 0; i < select.options.length; i++) {
      if (select.options[i].value === value) {
        return true;
      }
    }
    return false;
  }

  function wireSearchGlyph(searchInput) {
    var control = searchInput.closest(".collection-toolbar__control");
    var glyphBtn =
      control && control.querySelector("[data-search-glyph-btn]");
    var glyph = glyphBtn && glyphBtn.querySelector(".collection-toolbar__glyph");
    if (!glyphBtn || !glyph) return;

    function syncGlyph() {
      var hasQuery = searchInput.value.trim().length > 0;
      if (typeof irrSetIconName === "function") {
        irrSetIconName(glyph, hasQuery ? "close" : "search", { outline: true });
      }
      glyphBtn.setAttribute("aria-label", hasQuery ? "Suche leeren" : "Suche");
    }

    function clearSearch() {
      searchInput.value = "";
      syncGlyph();
      searchInput.dispatchEvent(new Event("input", { bubbles: true }));
      searchInput.focus();
    }

    glyphBtn.addEventListener("click", function (e) {
      e.preventDefault();
      if (searchInput.value.trim()) {
        clearSearch();
      } else {
        searchInput.focus();
      }
    });

    searchInput.addEventListener("input", syncGlyph);
    syncGlyph();
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

    updateFilterEmptyState(grid, typeSelect, tagSelect, searchInput);
    scheduleCollectionScatter(grid, true);
  }

  function getFilterState(typeSelect, tagSelect, searchInput) {
    var hasType = typeSelect && typeSelect.value !== "all";
    var hasTag = tagSelect && tagSelect.value !== "all";
    var hasSearch =
      searchInput && searchInput.value.trim().length > 0;
    return {
      hasFilters: hasType || hasTag,
      hasSearch: hasSearch
    };
  }

  function filterResetLabel(state) {
    if (state.hasFilters && state.hasSearch) {
      return "Filter/Suche zurücksetzen";
    }
    if (state.hasSearch) {
      return "Suche zurücksetzen";
    }
    if (state.hasFilters) {
      return "Filter zurücksetzen";
    }
    return "Filter/Suche zurücksetzen";
  }

  function resetActiveFilters(grid, typeSelect, tagSelect, searchInput) {
    if (typeSelect) typeSelect.value = "all";
    if (tagSelect) tagSelect.value = "all";
    if (searchInput && searchInput.value.trim()) {
      searchInput.value = "";
      searchInput.dispatchEvent(new Event("input", { bubbles: true }));
    } else {
      applyFilters(grid, typeSelect, tagSelect, searchInput);
    }
  }

  function buildFilterEmptyState(state, onReset) {
    var resetBtn = el(
      "button",
      {
        type: "button",
        class: "collection-filter-empty__reset",
        "data-collection-filter-reset": ""
      },
      [filterResetLabel(state)]
    );
    resetBtn.addEventListener("click", function (e) {
      e.preventDefault();
      onReset();
    });
    return el(
      "div",
      {
        class: "collection-filter-empty",
        "data-collection-filter-empty": ""
      },
      [
        el("p", { class: "collection-filter-empty__text" }, [
          "Leider keine Ergebnisse."
        ]),
        el("p", { class: "collection-filter-empty__action" }, [resetBtn])
      ]
    );
  }

  function updateFilterEmptyState(grid, typeSelect, tagSelect, searchInput) {
    var cards = grid.querySelectorAll(".card");
    var note = grid.querySelector("[data-collection-filter-empty]");

    if (!cards.length) {
      if (note) note.remove();
      return;
    }

    var visibleCount = 0;
    var i;
    for (i = 0; i < cards.length; i++) {
      if (!cards[i].classList.contains("hidden-by-filter")) {
        visibleCount++;
      }
    }

    if (visibleCount === 0) {
      var state = getFilterState(typeSelect, tagSelect, searchInput);
      if (!note) {
        note = buildFilterEmptyState(state, function () {
          resetActiveFilters(grid, typeSelect, tagSelect, searchInput);
        });
        grid.appendChild(note);
      } else {
        var resetBtn = note.querySelector("[data-collection-filter-reset]");
        if (resetBtn) {
          resetBtn.textContent = filterResetLabel(state);
        }
      }
    } else if (note) {
      note.remove();
    }
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
      var ka = collectionSortKey(a);
      var kb = collectionSortKey(b);
      if (typeof ka === "number" && typeof kb === "number") {
        return kb - ka;
      }
      return String(kb).localeCompare(String(ka));
    });

    sorted.forEach(function (item, index) {
      grid.appendChild(buildCard(item, index));
    });

    grid.querySelectorAll(".card--audio").forEach(wireAudioCard);

    bindCollectionMediaLightbox(grid);

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
    if (searchInput) {
      searchInput.addEventListener("input", run);
      wireSearchGlyph(searchInput);
    }
    var filterForm = document.querySelector("[data-filters]");
    if (filterForm) {
      filterForm.addEventListener("submit", function (e) {
        e.preventDefault();
      });
    }
    run();
    grid.addEventListener("click", function (e) {
      var tagBtn = e.target && e.target.closest && e.target.closest("button.card-tag");
      if (!tagBtn || !grid.contains(tagBtn)) return;
      e.preventDefault();
      var tagVal = tagBtn.getAttribute("data-tag") || "";
      if (!tagSelect || !tagVal || !selectHasOption(tagSelect, tagVal)) return;

      tagSelect.value = tagSelect.value === tagVal ? "all" : tagVal;
      run();
    });

    scheduleCollectionScatter(grid, true);
    bindCollectionScatterMediaLoads(grid);
    attachCollectionScatterResize();
    attachCollectionScatterScroll();
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

  document.addEventListener("DOMContentLoaded", function () {
    if (window.irrMediaLightbox) {
      window.irrMediaLightbox.init();
    }
    initCollectionToolbarReveal();

    fetch(collectionDataUrl(), { cache: "no-cache" })
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
