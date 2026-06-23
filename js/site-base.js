/**
 * Irrlichter — site root & absolute URLs (load before all other app scripts).
 *
 * Globals:
 *   IRR_SITE_ROOT  — e.g. "" or "/beta"
 *   irrSiteUrl(path) — "/data/foo.json" → "{root}/data/foo.json"
 *   irrDataUrl(file) — "events.json" → irrSiteUrl("/data/events.json")
 *   irrPageKey(pathname) — aktive Nav: "index" | "veranstaltungen" | … (inkl. /beta/)
 *
 * Root detection: script src of site-base.js first, else pathname minus PAGE_SLUGS.
 */
(function (global) {
  "use strict";

  var PAGE_SLUGS = [
    "veranstaltungen",
    "ueber",
    "impressum",
    "datenschutz",
    "admin"
  ];

  var SITE_BASE_SCRIPT_RE = /\/js\/site-base\.js(\?|#|$)/i;

  function rootFromScriptSrc(src) {
    if (!src || !SITE_BASE_SCRIPT_RE.test(src)) {
      return null;
    }
    try {
      var url = new URL(src, global.location.href);
      return url.pathname.replace(/\/js\/site-base\.js$/i, "") || "";
    } catch (err) {
      return null;
    }
  }

  function siteRootFromScript() {
    var fromCurrent = rootFromScriptSrc(
      document.currentScript && document.currentScript.src
    );
    if (fromCurrent !== null) {
      return fromCurrent;
    }

    var scripts = document.getElementsByTagName("script");
    var i;
    for (i = scripts.length - 1; i >= 0; i--) {
      var found = rootFromScriptSrc(scripts[i].src);
      if (found !== null) {
        return found;
      }
    }

    return null;
  }

  function siteRootFromPathname() {
    var segments = (global.location.pathname || "")
      .replace(/\/index\.html?$/i, "")
      .split("/")
      .filter(Boolean);
    if (
      segments.length &&
      PAGE_SLUGS.indexOf(segments[segments.length - 1]) !== -1
    ) {
      segments.pop();
    }
    return segments.length ? "/" + segments.join("/") : "";
  }

  function siteRoot() {
    var fromScript = siteRootFromScript();
    if (fromScript !== null) {
      return fromScript;
    }
    return siteRootFromPathname();
  }

  function siteUrl(path) {
    var normalized = path.charAt(0) === "/" ? path : "/" + path;
    return siteRoot() + normalized;
  }

  /** @param {string} file — "events.json" or "/data/events.json" */
  function irrDataUrl(file) {
    var path =
      file.indexOf("/data/") === 0 ? file : "/data/" + file.replace(/^\//, "");
    return siteUrl(path);
  }

  /** Nav slug: "index" | "veranstaltungen" | "ueber" | … — works under /beta/ */
  function pageKeyFromPathname(pathname) {
    var segments = (pathname || "")
      .replace(/\/index\.html?$/i, "")
      .split("/")
      .filter(Boolean);
    var rootSegs = siteRoot().split("/").filter(Boolean);
    var i;
    for (
      i = 0;
      i < rootSegs.length && segments.length && segments[0] === rootSegs[i];
      i++
    ) {
      segments.shift();
    }
    if (segments.length === 0) {
      return "index";
    }
    var last = segments[segments.length - 1].replace(/\.html$/i, "").toLowerCase();
    if (PAGE_SLUGS.indexOf(last) !== -1) {
      return last;
    }
    return "index";
  }

  global.IRR_SITE_ROOT = siteRoot();
  global.irrSiteUrl = siteUrl;
  global.irrDataUrl = irrDataUrl;
  global.irrPageKey = pageKeyFromPathname;

  function irrGetSiteHeaderOffset() {
    var header = document.querySelector(".site-header");
    if (header) {
      return Math.ceil(header.getBoundingClientRect().height);
    }
    return 0;
  }

  /** Scrollt target so, dass dessen Oberkante direkt unter der fixen Nav sitzt. */
  function irrScrollToAnchor(target) {
    if (!target || !target.getBoundingClientRect) return;
    var reduced =
      global.matchMedia &&
      global.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var offset = irrGetSiteHeaderOffset();
    var scrollEl = document.scrollingElement || document.documentElement;
    var top =
      target.getBoundingClientRect().top +
      (global.pageYOffset || scrollEl.scrollTop || 0) -
      offset;
    global.scrollTo({
      top: Math.max(0, top),
      behavior: reduced ? "auto" : "smooth"
    });
  }

  function irrScrollToHashIfPresent() {
    var hash = global.location && global.location.hash;
    if (!hash || hash.length < 2) return;
    var id = hash.slice(1);
    if (id === "termine") return;
    var target = document.getElementById(id);
    if (id === "anfahrt") {
      var heading = document.getElementById("anfahrt-heading");
      if (heading) target = heading;
    }
    if (!target) return;
    global.requestAnimationFrame(function () {
      irrScrollToAnchor(target);
    });
  }

  global.irrGetSiteHeaderOffset = irrGetSiteHeaderOffset;
  global.irrScrollToAnchor = irrScrollToAnchor;
  global.irrScrollToHashIfPresent = irrScrollToHashIfPresent;

  /** Externe http(s)-Links in neuem Tab — optional scope (Element oder Document). */
  function irrApplyExternalLinkTargets(scope) {
    var root = scope && scope.querySelectorAll ? scope : document;
    var origin = global.location && global.location.origin;
    if (!origin) return;

    root.querySelectorAll("a[href]").forEach(function (anchor) {
      var href = anchor.getAttribute("href") || "";
      if (!/^https?:\/\//i.test(href)) return;
      try {
        if (new URL(href).origin === origin) return;
      } catch (err) {
        return;
      }
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";
    });
  }

  global.irrApplyExternalLinkTargets = irrApplyExternalLinkTargets;

  function onReadyApplyExternalLinks() {
    irrApplyExternalLinkTargets(document);
  }

  function onReadySiteBase() {
    onReadyApplyExternalLinks();
    if (global.location && global.location.hash) {
      if ("scrollRestoration" in global.history) {
        global.history.scrollRestoration = "manual";
      }
      irrScrollToHashIfPresent();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", onReadySiteBase);
  } else {
    onReadySiteBase();
  }

  document.addEventListener("irrlichter:collection-rendered", onReadyApplyExternalLinks);

  try {
    if (localStorage.getItem("irrlichter-text-scale") === "large") {
      document.documentElement.setAttribute("data-text-scale", "large");
    }
  } catch (err) {
    /* ignore */
  }
})(
  typeof window !== "undefined"
    ? window
    : typeof self !== "undefined"
      ? self
      : this
);
