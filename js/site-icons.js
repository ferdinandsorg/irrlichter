/** SVG icons — Sprite (files/icons.svg) + Inline-Pfade für Media-Controls. */
(function (global) {
  "use strict";

  var SUBPAGE_RE = /\/(veranstaltungen|ueber|impressum|datenschutz)(\/|$)/i;

  var INLINE_ICON_PATHS = {
    play_arrow: "M320-200v-560l440 280-440 280Z",
    pause: "M560-200v-560h160v560H560Zm-320 0v-560h160v560H240Z",
    close:
      "m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z",
    fullscreen:
      "M120-120v-200h80v120h120v80H120Zm520 0v-80h120v-120h80v200H640ZM120-640v-200h200v80H200v120h-80Zm640 0v-120H640v-80h200v200h-80Z"
  };

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

  /** Inline path icon — zuverlässig in Buttons/Controls (opsz 24, viewBox -960). */
  function irrInlineIcon(name, className) {
    var d = INLINE_ICON_PATHS[name];
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "irr-icon" + (className ? " " + className : ""));
    svg.setAttribute("viewBox", "0 -960 960 960");
    svg.setAttribute("aria-hidden", "true");
    var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("fill", "currentColor");
    if (d) {
      path.setAttribute("d", d);
    }
    svg.appendChild(path);
    return svg;
  }

  function irrSetInlineIcon(svg, name) {
    if (!svg) return;
    var path = svg.querySelector("path");
    var d = INLINE_ICON_PATHS[name];
    if (path && d) {
      path.setAttribute("d", d);
    }
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

  global.irrInlineIcon = irrInlineIcon;
  global.irrSetInlineIcon = irrSetInlineIcon;
  global.irrIcon = irrIcon;
  global.irrSetIconName = setIconName;
  global.irrGetIconName = getIconName;
})(typeof window !== "undefined" ? window : typeof self !== "undefined" ? self : this);
