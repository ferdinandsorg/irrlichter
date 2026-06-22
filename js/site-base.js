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
})(
  typeof window !== "undefined"
    ? window
    : typeof self !== "undefined"
      ? self
      : this
);
