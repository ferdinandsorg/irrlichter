(function () {
  "use strict";

  var DATASETS = {
    collection: {
      file: "collection.json",
      path: "/data/collection.json",
      label: "Sammlung"
    },
    events: {
      file: "events.json",
      path: "/data/events.json",
      label: "Mitmachen"
    }
  };

  function datasetUrl(key) {
    var path = DATASETS[key].path;
    return typeof irrSiteUrl === "function" ? irrSiteUrl(path) : path;
  }

  var state = {
    dataset: "collection",
    items: []
  };

  /** Gleiche Sitzung: Startseite kann diese Daten statt data/collection.json anzeigen. */
  var COLLECTION_PREVIEW_KEY = "irrlichter:collection:preview";

  // ---------- helpers ----------

  function $(selector, root) {
    return (root || document).querySelector(selector);
  }

  function $$(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function setStatus(message, kind) {
    var node = $("[data-status]");
    if (!node) return;
    node.textContent = message || "";
    node.classList.remove("is-error", "is-success");
    if (kind === "error") node.classList.add("is-error");
    if (kind === "success") node.classList.add("is-success");
  }

  function setFormError(message) {
    var node = $("[data-form-error]");
    if (node) node.textContent = message || "";
  }

  function getField(name) {
    return $('[data-field="' + name + '"]');
  }

  function setFieldValue(name, value) {
    var node = getField(name);
    if (!node) return;
    if (Array.isArray(value)) {
      node.value = value.join(", ");
    } else {
      node.value = value == null ? "" : String(value);
    }
  }

  function readFieldValue(name) {
    var node = getField(name);
    if (!node) return "";
    return node.value.trim();
  }

  function clearForm() {
    var form = $("[data-form]");
    if (!form) return;
    $$("input, textarea, select", form).forEach(function (node) {
      if (node.tagName === "SELECT") {
        node.selectedIndex = 0;
      } else if (node.type === "hidden") {
        node.value = "";
      } else {
        node.value = "";
      }
    });
    setFormError("");
    var heading = $("[data-form-heading]");
    if (heading) heading.textContent = "Neuen Eintrag hinzufuegen";
    var saveBtn = $('[data-action="save"]');
    if (saveBtn) saveBtn.textContent = "Speichern";
  }

  function toggleDatasetFields() {
    $$("[data-only]").forEach(function (node) {
      node.hidden = node.getAttribute("data-only") !== state.dataset;
    });
  }

  function syncCollectionPreview() {
    if (state.dataset !== "collection") return;
    try {
      sessionStorage.setItem(COLLECTION_PREVIEW_KEY, JSON.stringify(state.items));
    } catch (err) {
      /* private mode / quota */
    }
  }

  function clearCollectionPreview() {
    try {
      sessionStorage.removeItem(COLLECTION_PREVIEW_KEY);
    } catch (err) {
      /* ignore */
    }
  }

  // ---------- rendering ----------

  function renderCount() {
    var node = $("[data-count]");
    if (!node) return;
    var n = state.items.length;
    node.textContent =
      n === 0
        ? "Keine Eintraege geladen."
        : n + " Eintrag" + (n === 1 ? "" : "/Eintraege") + " geladen.";
  }

  function renderList() {
    var list = $("[data-list]");
    if (!list) return;
    list.innerHTML = "";

    if (state.items.length === 0) {
      var empty = document.createElement("p");
      empty.className = "meta";
      empty.textContent =
        "Noch nichts geladen. Lade die JSON-Datei vom Server oder aus einer lokalen Datei.";
      list.appendChild(empty);
      renderCount();
      return;
    }

    state.items.forEach(function (item, idx) {
      var entry = document.createElement("div");
      entry.className = "admin-entry";

      var info = document.createElement("div");
      info.className = "admin-entry-info";
      var heading = document.createElement("h3");
      heading.textContent = item.title || "(ohne Titel)";
      info.appendChild(heading);

      var meta = document.createElement("p");
      var parts = [];
      if (item.id) parts.push("ID: " + item.id);
      if (item.date) parts.push(item.date);
      if (state.dataset === "collection" && item.type) parts.push(item.type);
      if (state.dataset === "events") {
        if (item.time) parts.push(item.time);
        if (item.category) parts.push(item.category);
        if (item.location) parts.push(item.location);
      }
      meta.textContent = parts.join(" \u00b7 ");
      info.appendChild(meta);

      entry.appendChild(info);

      var actions = document.createElement("div");
      actions.className = "admin-entry-actions";

      var editBtn = document.createElement("button");
      editBtn.type = "button";
      editBtn.textContent = "Bearbeiten";
      editBtn.addEventListener("click", function () {
        startEdit(idx);
      });
      actions.appendChild(editBtn);

      var delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.className = "danger";
      delBtn.textContent = "Loeschen";
      delBtn.addEventListener("click", function () {
        if (window.confirm('Eintrag "' + (item.title || item.id) + '" wirklich loeschen?')) {
          state.items.splice(idx, 1);
          renderList();
          if (state.dataset === "collection") syncCollectionPreview();
          setStatus("Eintrag geloescht.", "success");
        }
      });
      actions.appendChild(delBtn);

      entry.appendChild(actions);
      list.appendChild(entry);
    });

    renderCount();
  }

  // ---------- form <-> item conversion ----------

  function itemToForm(item) {
    clearForm();
    setFieldValue("__editingId", item.id || "");
    setFieldValue("id", item.id || "");
    setFieldValue("date", item.date || "");
    setFieldValue("title", item.title || "");

    if (state.dataset === "collection") {
      setFieldValue("type", item.type || "image");
      setFieldValue("status", item.status || "published");
      setFieldValue("tags", item.tags || []);
      setFieldValue("summary", item.summary || "");
      var media = item.media || {};
      setFieldValue("media.src", media.src || "");
      setFieldValue("media.alt", media.alt || "");
      setFieldValue("media.poster", media.poster || "");
      setFieldValue("location", item.location || "");
      setFieldValue("coordinates", item.coordinates || "");
    } else {
      setFieldValue("time", item.time || "");
      setFieldValue("category", item.category || "");
      setFieldValue("location", item.location || "");
      setFieldValue("description", item.description || "");
      setFieldValue("link", item.link || "");
      setFieldValue("linkLabel", item.linkLabel || item.link_label || "");
    }
  }

  function formToItem() {
    var id = readFieldValue("id");
    var date = readFieldValue("date");
    var title = readFieldValue("title");

    if (!id) return { error: "ID ist erforderlich." };
    if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
      return { error: "ID darf nur Buchstaben, Zahlen, '-' und '_' enthalten." };
    }
    if (!date) return { error: "Datum ist erforderlich." };
    if (!title) return { error: "Titel ist erforderlich." };

    if (state.dataset === "collection") {
      var type = readFieldValue("type") || "image";
      var summary = readFieldValue("summary");
      if (!summary) return { error: "Zusammenfassung ist erforderlich." };
      var tagsRaw = readFieldValue("tags");
      var tags = tagsRaw
        ? tagsRaw.split(",").map(function (t) { return t.trim(); }).filter(Boolean)
        : [];
      var item = {
        id: id,
        title: title,
        date: date,
        type: type,
        tags: tags,
        summary: summary,
        media: {
          src: readFieldValue("media.src"),
          alt: readFieldValue("media.alt")
        }
      };
      var poster = readFieldValue("media.poster");
      if (poster) item.media.poster = poster;
      var location = readFieldValue("location");
      if (location) item.location = location;
      var coordinates = readFieldValue("coordinates");
      if (coordinates) item.coordinates = coordinates;
      var status = readFieldValue("status");
      if (status) item.status = status;
      return { item: item };
    }

    var location2 = readFieldValue("location");
    var description = readFieldValue("description");
    if (!location2) return { error: "Ort ist erforderlich." };
    if (!description) return { error: "Beschreibung ist erforderlich." };
    var event = {
      id: id,
      date: date,
      title: title,
      location: location2,
      description: description
    };
    var time = readFieldValue("time");
    if (time) event.time = time;
    var category = readFieldValue("category");
    if (category) event.category = category;
    var link = readFieldValue("link");
    if (link) event.link = link;
    var linkLabel = readFieldValue("linkLabel");
    if (linkLabel) event.linkLabel = linkLabel;
    return { item: event };
  }

  function startEdit(idx) {
    var item = state.items[idx];
    if (!item) return;
    itemToForm(item);
    var heading = $("[data-form-heading]");
    if (heading) heading.textContent = 'Eintrag "' + (item.title || item.id) + '" bearbeiten';
    var saveBtn = $('[data-action="save"]');
    if (saveBtn) saveBtn.textContent = "Aenderungen speichern";
    var form = $("[data-form]");
    if (form && form.scrollIntoView) {
      form.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  // ---------- load / save / export ----------

  function loadFromServer() {
    var ds = DATASETS[state.dataset];
    setStatus("Lade " + ds.label + " vom Server...");
    fetch(datasetUrl(state.dataset), { cache: "no-cache" })
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then(function (data) {
        if (!Array.isArray(data)) throw new Error("JSON ist kein Array");
        state.items = data;
        renderList();
        clearForm();
        if (state.dataset === "collection") syncCollectionPreview();
        setStatus(ds.label + " geladen (" + data.length + " Eintraege).", "success");
      })
      .catch(function (err) {
        setStatus("Laden fehlgeschlagen: " + err.message, "error");
      });
  }

  function loadFromFile(file) {
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var data = JSON.parse(String(reader.result));
        if (!Array.isArray(data)) throw new Error("JSON ist kein Array");
        state.items = data;
        renderList();
        clearForm();
        if (state.dataset === "collection") syncCollectionPreview();
        setStatus(
          'Datei "' + file.name + '" geladen (' + data.length + " Eintraege).",
          "success"
        );
      } catch (err) {
        setStatus("Datei nicht lesbar: " + err.message, "error");
      }
    };
    reader.onerror = function () {
      setStatus("Datei konnte nicht gelesen werden.", "error");
    };
    reader.readAsText(file);
  }

  function downloadJson() {
    var ds = DATASETS[state.dataset];
    var json = JSON.stringify(state.items, null, 2) + "\n";
    var blob = new Blob([json], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = ds.file;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    setStatus(
      ds.file + " heruntergeladen. Per FTP nach data/ hochladen, um die Live-Seite zu aktualisieren.",
      "success"
    );
  }

  // ---------- events ----------

  function onSave(event) {
    event.preventDefault();
    setFormError("");
    var result = formToItem();
    if (result.error) {
      setFormError(result.error);
      return;
    }
    var item = result.item;
    var editingId = readFieldValue("__editingId");

    var existingIdx = -1;
    state.items.forEach(function (existing, idx) {
      if (existing.id === item.id) existingIdx = idx;
    });

    if (editingId) {
      var origIdx = -1;
      state.items.forEach(function (existing, idx) {
        if (existing.id === editingId) origIdx = idx;
      });
      if (origIdx === -1) {
        setFormError("Original-Eintrag nicht gefunden.");
        return;
      }
      if (item.id !== editingId && existingIdx !== -1 && existingIdx !== origIdx) {
        setFormError("Neue ID existiert bereits.");
        return;
      }
      state.items[origIdx] = item;
      setStatus('Eintrag "' + (item.title || item.id) + '" aktualisiert.', "success");
    } else {
      if (existingIdx !== -1) {
        setFormError("ID existiert bereits.");
        return;
      }
      state.items.push(item);
      setStatus('Eintrag "' + (item.title || item.id) + '" hinzugefuegt.', "success");
    }

    renderList();
    clearForm();
    if (state.dataset === "collection") syncCollectionPreview();
  }

  function onDatasetChange() {
    var selected = $('input[name="dataset"]:checked');
    if (!selected) return;
    var previous = state.dataset;
    state.dataset = selected.value;
    if (previous === "collection" && state.dataset === "events") {
      clearCollectionPreview();
    }
    state.items = [];
    toggleDatasetFields();
    renderList();
    clearForm();
    setStatus("Datensatz gewechselt: " + DATASETS[state.dataset].label + ". Bitte neu laden.");
  }

  function bind() {
    $$('input[name="dataset"]').forEach(function (radio) {
      radio.addEventListener("change", onDatasetChange);
    });

    var loadBtn = $('[data-action="load-server"]');
    if (loadBtn) loadBtn.addEventListener("click", loadFromServer);

    var fileInput = $("[data-file-input]");
    if (fileInput) {
      fileInput.addEventListener("change", function (e) {
        var file = e.target.files && e.target.files[0];
        loadFromFile(file);
        e.target.value = "";
      });
    }

    var downloadBtn = $('[data-action="download"]');
    if (downloadBtn) downloadBtn.addEventListener("click", downloadJson);

    var resetBtn = $('[data-action="reset"]');
    if (resetBtn) resetBtn.addEventListener("click", function () {
      clearForm();
      setStatus("Formular geleert.");
    });

    var form = $("[data-form]");
    if (form) form.addEventListener("submit", onSave);
  }

  document.addEventListener("DOMContentLoaded", function () {
    bind();
    toggleDatasetFields();
    renderList();
    setStatus(
      "Bereit. Lade Daten vom Server oder via Datei-Upload, um sie zu bearbeiten."
    );
  });
})();
