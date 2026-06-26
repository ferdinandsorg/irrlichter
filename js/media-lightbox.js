/** Shared fullscreen lightbox for collection + team photos. */
(function () {
  "use strict";

  var lightboxRoot = null;
  var lightboxImg = null;
  var lightboxVideo = null;
  var lightboxCloseBtn = null;
  var lightboxOpen = false;
  var lightboxLastFocus = null;

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

  function initMediaLightbox() {
    if (lightboxRoot) return;

    lightboxImg = el("img", {
      class: "collection-lightbox__img",
      alt: "",
      decoding: "async",
      hidden: true
    });
    lightboxVideo = el("video", {
      class: "collection-lightbox__video",
      controls: true,
      playsinline: true,
      preload: "metadata",
      hidden: true
    });
    lightboxCloseBtn = el(
      "button",
      {
        type: "button",
        class: "ui-button ui-button--icon-leading collection-lightbox__close",
        "aria-label": "Schließen"
      },
      [
        typeof irrIcon === "function"
          ? irrIcon("close", "ui-button__icon ui-button__icon--lead")
          : el("span", { class: "irr-icon ui-button__icon ui-button__icon--lead", "aria-hidden": "true" }, ["×"]),
        el("span", { class: "ui-button__label" }, ["Schließen"])
      ]
    );

    lightboxRoot = el("div", {
      class: "collection-lightbox",
      hidden: true,
      role: "dialog",
      "aria-modal": "true",
      "aria-label": "Medienansicht"
    }, [
      el("div", { class: "collection-lightbox__backdrop" }),
      el("div", { class: "collection-lightbox__stage" }, [lightboxImg, lightboxVideo]),
      lightboxCloseBtn
    ]);

    document.body.appendChild(lightboxRoot);

    lightboxCloseBtn.addEventListener("click", closeMediaLightbox);
    lightboxRoot
      .querySelector(".collection-lightbox__backdrop")
      .addEventListener("click", closeMediaLightbox);

    document.addEventListener("keydown", function (e) {
      if (!lightboxOpen || e.key !== "Escape") return;
      e.preventDefault();
      closeMediaLightbox();
    });
  }

  function startLightboxVideoPlayback() {
    var playPromise = lightboxVideo.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(function () {});
    }
  }

  function openMediaLightbox(payload) {
    if (!payload || !payload.kind) return;
    initMediaLightbox();

    if (payload.kind === "image") {
      lightboxImg.hidden = false;
      lightboxVideo.hidden = true;
      lightboxVideo.pause();
      lightboxVideo.removeAttribute("src");
      lightboxVideo.load();
      lightboxImg.src = payload.src || "";
      lightboxImg.alt = payload.alt || "";
    } else if (payload.kind === "video") {
      lightboxImg.hidden = true;
      lightboxImg.removeAttribute("src");
      lightboxVideo.hidden = false;
      lightboxVideo.src = payload.src || "";
      if (payload.poster) {
        lightboxVideo.setAttribute("poster", payload.poster);
      } else {
        lightboxVideo.removeAttribute("poster");
      }
    } else {
      return;
    }

    lightboxLastFocus = document.activeElement;
    lightboxRoot.hidden = false;
    lightboxOpen = true;
    document.body.classList.add("collection-lightbox-open");
    lightboxCloseBtn.focus();

    if (payload.kind === "video") {
      if (lightboxVideo.readyState >= 2) {
        startLightboxVideoPlayback();
      } else {
        lightboxVideo.addEventListener("canplay", startLightboxVideoPlayback, {
          once: true
        });
      }
    }
  }

  function closeMediaLightbox() {
    if (!lightboxRoot || !lightboxOpen) return;
    lightboxOpen = false;
    lightboxRoot.hidden = true;
    document.body.classList.remove("collection-lightbox-open");
    lightboxVideo.pause();
    lightboxVideo.removeAttribute("src");
    lightboxVideo.load();
    lightboxImg.removeAttribute("src");
    if (lightboxLastFocus && typeof lightboxLastFocus.focus === "function") {
      lightboxLastFocus.focus();
    }
    lightboxLastFocus = null;
  }

  window.irrMediaLightbox = {
    init: initMediaLightbox,
    open: openMediaLightbox,
    close: closeMediaLightbox
  };
})();
