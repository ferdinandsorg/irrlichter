(function (global) {
  "use strict";

  var PAGE_SLUGS = [
    "mitmachen",
    "das-projekt",
    "impressum",
    "datenschutz",
    "admin"
  ];

  function siteRoot() {
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
