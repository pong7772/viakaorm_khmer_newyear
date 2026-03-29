
(function () {
  const KEYS = {
    staff: "foed_staff_pool",
    gifts: "foed_gifts_pool",
    history: "foed_win_history"
  };

  function parseJson(key, fallback) {
    try {
      const t = localStorage.getItem(key);
      return t ? JSON.parse(t) : fallback;
    } catch (_e) {
      return fallback;
    }
  }

  function exportPayload() {
    return {
      version: 1,
      staff: parseJson(KEYS.staff, []),
      gifts: parseJson(KEYS.gifts, []),
      history: parseJson(KEYS.history, []),
      exportedAt: new Date().toISOString()
    };
  }

  async function payloadToText() {
    return JSON.stringify(exportPayload(), null, 2);
  }

  function importPayload(obj) {
    if (!obj || typeof obj !== "object") throw new Error("Invalid file");
    let n = 0;
    if (Array.isArray(obj.staff)) {
      localStorage.setItem(KEYS.staff, JSON.stringify(obj.staff));
      n += 1;
    }
    if (Array.isArray(obj.gifts)) {
      localStorage.setItem(KEYS.gifts, JSON.stringify(obj.gifts));
      n += 1;
    }
    if (Array.isArray(obj.history)) {
      localStorage.setItem(KEYS.history, JSON.stringify(obj.history));
      n += 1;
    }
    if (!n) throw new Error("JSON គ្មាន staff / gifts / history");
  }

  /** Trigger browser download (save to Downloads, then you can move into project `data/`). */
  function downloadExport(filename) {
    const name = filename || "foed-lucky-data.json";
    const blob = new Blob([JSON.stringify(exportPayload(), null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
  }

  /** Chrome/Edge: let user pick a .json path to write (optional). */
  async function saveExportWithPicker(suggestedName) {
    const text = await payloadToText();
    const name = suggestedName || "foed-lucky-data.json";
    if (typeof window.showSaveFilePicker === "function") {
      const handle = await window.showSaveFilePicker({
        suggestedName: name,
        types: [{ description: "JSON", accept: { "application/json": [".json"] } }]
      });
      const writable = await handle.createWritable();
      await writable.write(text);
      await writable.close();
      return true;
    }
    downloadExport(name);
    return false;
  }

  window.FoedOffline = {
    KEYS,
    loadStaff: () => parseJson(KEYS.staff, []),
    loadGifts: () => parseJson(KEYS.gifts, []),
    loadHistory: () => parseJson(KEYS.history, []),
    saveStaff: (arr) => localStorage.setItem(KEYS.staff, JSON.stringify(arr)),
    saveGifts: (arr) => localStorage.setItem(KEYS.gifts, JSON.stringify(arr)),
    saveHistory: (arr) => localStorage.setItem(KEYS.history, JSON.stringify(arr)),
    exportPayload,
    importPayload,
    downloadExport,
    saveExportWithPicker
  };
})();
