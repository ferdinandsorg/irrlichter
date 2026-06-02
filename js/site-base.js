(function (global) {
  "use strict";

  var PAGE_SLUGS = [
    "veranstaltungen",
    "ueber",
    "impressum",
    "datenschutz",
    "admin"
  ];

  function siteRootFromScript() {
    var script = document.currentScript;
    if (script && script.src && /\/js\/site-base\.js(\?|#|$)/i.test(script.src)) {
      try {
        var url = new URL(script.src, global.location.href);
        return url.pathname.replace(/\/js\/site-base\.js$/i, "") || "";
      } catch (err) {
        /* ignore */
      }
    }

    var scripts = document.getElementsByTagName("script");
    var i;
    for (i = scripts.length - 1; i >= 0; i--) {
      var src = scripts[i].src;
      if (!src) continue;
      if (/\/js\/site-base\.js(\?|#|$)/i.test(src)) {
        try {
          var scriptUrl = new URL(src, global.location.href);
          return scriptUrl.pathname.replace(/\/js\/site-base\.js$/i, "") || "";
        } catch (err2) {
          /* ignore */
        }
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

  global.IRR_SITE_ROOT = siteRoot();
  global.irrSiteUrl = siteUrl;
})(
  typeof window !== "undefined"
    ? window
    : typeof self !== "undefined"
      ? self
      : this
);
