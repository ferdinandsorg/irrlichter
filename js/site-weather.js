/** Live-Wetter für Moorbauer / Malchin — Open-Meteo (kein API-Key). */
(function () {
  "use strict";

  /* Dorfstraße 123, 17139 Malchin — Raster ~1 km Open-Meteo */
  var LAT = 53.767631;
  var LON = 12.779701;
  var CACHE_KEY = "irrlichter-weather-v1";
  var CACHE_TTL_MS = 30 * 60 * 1000;
  var API_URL =
    "https://api.open-meteo.com/v1/forecast?latitude=" +
    LAT +
    "&longitude=" +
    LON +
    "&current=temperature_2m,weather_code&timezone=Europe%2FBerlin";

  function wmoLabel(code) {
    var c = Number(code);
    if (c === 0) return "Klar";
    if (c === 1) return "Heiter";
    if (c === 2) return "Leicht bewölkt";
    if (c === 3) return "Bewölkt";
    if (c === 45 || c === 48) return "Nebel";
    if (c >= 51 && c <= 57) return "Nieselregen";
    if (c >= 61 && c <= 67) return "Regen";
    if (c >= 71 && c <= 77) return "Schnee";
    if (c >= 80 && c <= 82) return "Schauer";
    if (c >= 85 && c <= 86) return "Schneeschauer";
    if (c >= 95 && c <= 99) return "Gewitter";
    return "Wetter";
  }

  function formatLine(tempC, code) {
    var t = Math.round(Number(tempC));
    if (!Number.isFinite(t)) {
      return wmoLabel(code);
    }
    return wmoLabel(code) + ", " + t + "°";
  }

  function readCache() {
    try {
      var raw = sessionStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      var entry = JSON.parse(raw);
      if (
        !entry ||
        typeof entry.text !== "string" ||
        typeof entry.at !== "number" ||
        Date.now() - entry.at > CACHE_TTL_MS
      ) {
        return null;
      }
      return entry.text;
    } catch (err) {
      return null;
    }
  }

  function writeCache(text) {
    try {
      sessionStorage.setItem(
        CACHE_KEY,
        JSON.stringify({ text: text, at: Date.now() })
      );
    } catch (err) {
      /* quota / private mode */
    }
  }

  function clearWeather() {
    document.querySelectorAll("[data-site-weather]").forEach(function (el) {
      el.textContent = "";
      el.setAttribute("hidden", "");
      el.setAttribute("aria-hidden", "true");
    });
  }

  function applyWeather(text) {
    document.querySelectorAll("[data-site-weather]").forEach(function (el) {
      el.textContent = text;
      el.removeAttribute("hidden");
      el.setAttribute("aria-hidden", "false");
    });
  }

  function fetchWeather() {
    return fetch(API_URL, { cache: "default" }).then(function (res) {
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.json();
    });
  }

  function startWeather() {
    if (!document.querySelector("[data-site-weather]")) {
      return;
    }

    clearWeather();

    var cached = readCache();
    if (cached) {
      applyWeather(cached);
      return;
    }

    fetchWeather()
      .then(function (data) {
        var current = data && data.current;
        if (!current) throw new Error("no current");
        var text = formatLine(
          current.temperature_2m,
          current.weather_code
        );
        writeCache(text);
        applyWeather(text);
      })
      .catch(function () {
        clearWeather();
      });
  }

  function scheduleWeather() {
    if (window.requestIdleCallback) {
      window.requestIdleCallback(startWeather, { timeout: 4000 });
    } else {
      window.setTimeout(startWeather, 1);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", scheduleWeather);
  } else {
    scheduleWeather();
  }
})();
