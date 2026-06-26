/** SVG icons — externe Sprite-Datei (files/icons.svg), kein blockierendes Inline-Sprite. */
(function (global) {
  "use strict";

  var SUBPAGE_RE = /\/(veranstaltungen|ueber|impressum|datenschutz)(\/|$)/i;

  function iconSpriteUrl() {
    if (typeof irrSiteUrl === "function") {
      return irrSiteUrl("/files/icons.svg");
    }
    var path = (global.location && global.location.pathname) || "";
    return SUBPAGE_RE.test(path) ? "../files/icons.svg" : "files/icons.svg";
  }

  function baseIconName(name) {
    return String(name || "").replace(/_outline$/, "");
  }

  function iconSymbolId(name, opts) {
    var base = baseIconName(name);
    return opts && opts.outline ? base + "_outline" : base;
  }

  function symbolHref(symbolId) {
    return iconSpriteUrl() + "#" + symbolId;
  }

  function hrefSymbolId(href) {
    return baseIconName(String(href || "").replace(/^[^#]*#/, ""));
  }

  /** @param {string} name symbol id @param {string} [className] @param {{outline?: boolean}} [opts] */
  function irrIcon(name, className, opts) {
    var symbolId = iconSymbolId(name, opts);
    var href = symbolHref(symbolId);
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "irr-icon" + (className ? " " + className : ""));
    svg.setAttribute("aria-hidden", "true");
    var use = document.createElementNS("http://www.w3.org/2000/svg", "use");
    use.setAttribute("href", href);
    use.setAttributeNS("http://www.w3.org/1999/xlink", "href", href);
    svg.appendChild(use);
    return svg;
  }

  function getIconName(node) {
    if (!node) return "";
    var use = node.querySelector("use");
    if (!use) return "";
    var href =
      use.getAttribute("href") ||
      use.getAttributeNS("http://www.w3.org/1999/xlink", "href") ||
      "";
    return hrefSymbolId(href);
  }

  function setIconName(node, name, opts) {
    if (!node) return;
    var href = symbolHref(iconSymbolId(name, opts));
    var use = node.querySelector("use");
    if (use) {
      use.setAttribute("href", href);
      use.setAttributeNS("http://www.w3.org/1999/xlink", "href", href);
    }
  }

  global.irrIcon = irrIcon;
  global.irrSetIconName = setIconName;
  global.irrGetIconName = getIconName;
})(typeof window !== "undefined" ? window : typeof self !== "undefined" ? self : this);
