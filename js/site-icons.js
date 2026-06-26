/** Inline SVG sprite + irrIcon() — Material Symbols Sharp als SVG.
 *  Standard: FILL 1 (fill1-Pfade). FILL 0: irrIcon(name, cls, { outline: true }) → name_outline */
(function (global) {
  "use strict";

  var SPRITE =
    '<svg xmlns="http://www.w3.org/2000/svg" hidden aria-hidden="true" focusable="false" id="irr-icon-sprite">' +
    '<symbol id="arrow_forward" viewBox="0 -960 960 960"><path fill="currentColor" d="M647-440H160v-80h487L423-744l57-56 320 320-320 320-57-56 224-224Z"/></symbol>' +
    '<symbol id="arrow_forward_outline" viewBox="0 -960 960 960"><path fill="currentColor" d="M647-440H160v-80h487L423-744l57-56 320 320-320 320-57-56 224-224Z"/></symbol>' +
    '<symbol id="close" viewBox="0 -960 960 960"><path fill="currentColor" d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"/></symbol>' +
    '<symbol id="close_outline" viewBox="0 -960 960 960"><path fill="currentColor" d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"/></symbol>' +
    '<symbol id="content_copy" viewBox="0 -960 960 960"><path fill="currentColor" d="M280-240v-640h520v640H280ZM120-80v-640h80v560h440v80H120Z"/></symbol>' +
    '<symbol id="content_copy_outline" viewBox="0 -960 960 960"><path fill="currentColor" d="M280-240v-640h520v640H280Zm80-80h360v-480H360v480ZM120-80v-640h80v560h440v80H120Zm240-240v-480 480Z"/></symbol>' +
    '<symbol id="expand_more" viewBox="0 -960 960 960"><path fill="currentColor" d="M480-345 240-585l56-56 184 184 184-184 56 56-240 240Z"/></symbol>' +
    '<symbol id="expand_more_outline" viewBox="0 -960 960 960"><path fill="currentColor" d="M480-345 240-585l56-56 184 184 184-184 56 56-240 240Z"/></symbol>' +
    '<symbol id="mail" viewBox="0 -960 960 960"><path fill="currentColor" d="M80-160v-640h800v640H80Zm400-280 320-200v-80L480-520 160-720v80l320 200Z"/></symbol>' +
    '<symbol id="mail_outline" viewBox="0 -960 960 960"><path fill="currentColor" d="M80-160v-640h800v640H80Zm400-280L160-640v400h640v-400L480-440Zm0-80 320-200H160l320 200ZM160-640v-80 480-400Z"/></symbol>' +
    '<symbol id="menu" viewBox="0 -960 960 960"><path fill="currentColor" d="M120-240v-80h720v80H120Zm0-200v-80h720v80H120Zm0-200v-80h720v80H120Z"/></symbol>' +
    '<symbol id="menu_outline" viewBox="0 -960 960 960"><path fill="currentColor" d="M120-240v-80h720v80H120Zm0-200v-80h720v80H120Zm0-200v-80h720v80H120Z"/></symbol>' +
    '<symbol id="north" viewBox="0 -960 960 960"><path fill="currentColor" d="M440-80v-647L256-544l-56-56 280-280 280 280-56 57-184-184v647h-80Z"/></symbol>' +
    '<symbol id="north_outline" viewBox="0 -960 960 960"><path fill="currentColor" d="M440-80v-647L256-544l-56-56 280-280 280 280-56 57-184-184v647h-80Z"/></symbol>' +
    '<symbol id="north_east" viewBox="0 -960 960 960"><path fill="currentColor" d="m216-160-56-56 464-464H360v-80h400v400h-80v-264L216-160Z"/></symbol>' +
    '<symbol id="north_east_outline" viewBox="0 -960 960 960"><path fill="currentColor" d="m216-160-56-56 464-464H360v-80h400v400h-80v-264L216-160Z"/></symbol>' +
    '<symbol id="pause" viewBox="0 -960 960 960"><path fill="currentColor" d="M560-200v-560h160v560H560Zm-320 0v-560h160v560H240Z"/></symbol>' +
    '<symbol id="play_arrow" viewBox="0 -960 960 960"><path fill="currentColor" d="M320-200v-560l440 280-440 280Z"/></symbol>' +
    '<symbol id="search" viewBox="0 -960 960 960"><path fill="currentColor" d="M784-120 532-372q-30 24-69 38t-83 14q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l252 252-56 56ZM380-400q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z"/></symbol>' +
    '<symbol id="search_outline" viewBox="0 -960 960 960"><path fill="currentColor" d="M784-120 532-372q-30 24-69 38t-83 14q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l252 252-56 56ZM380-400q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z"/></symbol>' +
    '<symbol id="south" viewBox="0 -960 960 960"><path fill="currentColor" d="M480-80 200-360l56-56 184 183v-647h80v647l184-184 56 57L480-80Z"/></symbol>' +
    '<symbol id="south_outline" viewBox="0 -960 960 960"><path fill="currentColor" d="M480-80 200-360l56-56 184 183v-647h80v647l184-184 56 57L480-80Z"/></symbol>' +
    '<symbol id="text_increase" viewBox="0 -960 960 960"><path fill="currentColor" d="m40-200 210-560h100l210 560h-96l-51-143H187l-51 143H40Zm176-224h168l-82-232h-4l-82 232Zm504 104v-120H600v-80h120v-120h80v120h120v80H800v120h-80Z"/></symbol>' +
    '<symbol id="text_increase_outline" viewBox="0 -960 960 960"><path fill="currentColor" d="m40-200 210-560h100l210 560h-96l-51-143H187l-51 143H40Zm176-224h168l-82-232h-4l-82 232Zm504 104v-120H600v-80h120v-120h80v120h120v80H800v120h-80Z"/></symbol>' +
    "</svg>";

  function injectIconSprite() {
    if (document.getElementById("irr-icon-sprite")) {
      return;
    }
    var tpl = document.createElement("template");
    tpl.innerHTML = SPRITE;
    var node = tpl.content.firstChild;
    if (document.body) {
      document.body.insertBefore(node, document.body.firstChild);
    } else {
      document.addEventListener("DOMContentLoaded", function () {
        injectIconSprite();
      });
    }
  }

  function baseIconName(name) {
    return String(name || "").replace(/_outline$/, "");
  }

  function iconSymbolId(name, opts) {
    var base = baseIconName(name);
    return opts && opts.outline ? base + "_outline" : base;
  }

  /** @param {string} name symbol id @param {string} [className] @param {{outline?: boolean}} [opts] */
  function irrIcon(name, className, opts) {
    var symbolId = iconSymbolId(name, opts);
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "irr-icon" + (className ? " " + className : ""));
    svg.setAttribute("aria-hidden", "true");
    var use = document.createElementNS("http://www.w3.org/2000/svg", "use");
    var href = "#" + symbolId;
    use.setAttribute("href", href);
    use.setAttributeNS("http://www.w3.org/1999/xlink", "href", href);
    svg.appendChild(use);
    return svg;
  }

  function getIconName(node) {
    if (!node) return "";
    var use = node.querySelector("use");
    if (!use) return "";
    var href = use.getAttribute("href") || use.getAttributeNS("http://www.w3.org/1999/xlink", "href") || "";
    return baseIconName(href.replace(/^#/, ""));
  }

  function setIconName(node, name, opts) {
    if (!node) return;
    var symbolId = iconSymbolId(name, opts);
    var use = node.querySelector("use");
    if (use) {
      var href = "#" + symbolId;
      use.setAttribute("href", href);
      use.setAttributeNS("http://www.w3.org/1999/xlink", "href", href);
    }
  }

  global.irrIcon = irrIcon;
  global.irrSetIconName = setIconName;
  global.irrGetIconName = getIconName;
  global.irrInjectIconSprite = injectIconSprite;

  injectIconSprite();
})(typeof window !== "undefined" ? window : typeof self !== "undefined" ? self : this);
