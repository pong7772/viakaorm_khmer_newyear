(function () {
  const O = window.FoedOffline;
  const $ = (id) => document.getElementById(id);

  let editingStaffId = null;
  let editingGiftId = null;
  let staffListCache = [];
  let giftListCache = [];

  function setStatus(text, ok) {
    const el = $("dashStatus");
    if (!el) return;
    el.textContent = text;
    el.classList.toggle("ok", ok === true);
    el.classList.toggle("err", ok === false);
  }

  function showMsg(elId, text, type) {
    const el = $(elId);
    if (!el) return;
    el.textContent = text || "";
    if (type === "error") {
      el.classList.add("error");
      el.classList.remove("success");
    } else if (type === "success") {
      el.classList.add("success");
      el.classList.remove("error");
    } else {
      el.classList.remove("error", "success");
    }
  }

  function bindImageFallback(img) {
    img.addEventListener("error", function onErr() {
      img.removeEventListener("error", onErr);
      img.src = "./assets/images/twitter.png";
    });
  }

  async function withDisabled(el, fn) {
    if (el) el.disabled = true;
    try {
      return await fn();
    } finally {
      if (el) el.disabled = false;
    }
  }

  function ensureStaffIds(list) {
    const arr = Array.isArray(list) ? list : [];
    let changed = false;
    const out = arr
      .filter((s) => s && typeof s === "object")
      .map((s) => {
        if (s.id) return s;
        changed = true;
        return { ...s, id: crypto.randomUUID() };
      });
    if (changed) O.saveStaff(out);
    return out;
  }

  function ensureGiftIds(list) {
    const arr = Array.isArray(list) ? list : [];
    let changed = false;
    const out = arr
      .filter((g) => g && typeof g === "object")
      .map((g) => {
        if (g.id) return g;
        changed = true;
        return { ...g, id: crypto.randomUUID() };
      });
    if (changed) O.saveGifts(out);
    return out;
  }

  function mapStaffRow(r) {
    const raw = (r.image || "").trim();
    return {
      id: r.id,
      name: r.name || "",
      image_url: raw,
      image: raw || "./assets/images/twitter.png"
    };
  }

  function mapGiftRow(r) {
    const raw = (r.image || "").trim();
    return {
      id: r.id,
      name: r.name || "",
      type: String(r.type || "medium").toLowerCase(),
      quantity: Number(r.quantity) || 0,
      price: r.price == null ? null : Number(r.price),
      image_url: raw,
      image: raw || "./assets/images/twitter.png"
    };
  }

  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = () => reject(new Error("មិនអាចអានឯកសាររូប"));
      r.readAsDataURL(file);
    });
  }

  async function resolveImage(fileInput, urlInput, existing) {
    const f = fileInput.files && fileInput.files[0];
    if (f) return readFileAsDataUrl(f);
    const u = (urlInput.value || "").trim();
    if (u) return u;
    return existing || "";
  }

  function setPreview(imgEl, src) {
    if (!imgEl) return;
    if (!src) {
      imgEl.hidden = true;
      imgEl.removeAttribute("src");
      return;
    }
    imgEl.hidden = false;
    imgEl.src = src;
  }

  function wirePreview(fileInput, urlInput, imgEl) {
    const refresh = () => {
      const f = fileInput.files && fileInput.files[0];
      if (f) {
        const r = new FileReader();
        r.onload = () => setPreview(imgEl, r.result);
        r.readAsDataURL(f);
        return;
      }
      const u = (urlInput.value || "").trim();
      setPreview(imgEl, u || null);
    };
    fileInput.addEventListener("change", refresh);
    urlInput.addEventListener("input", refresh);
  }

  function resetStaffForm() {
    editingStaffId = null;
    $("staffName").value = "";
    $("staffImageUrl").value = "";
    $("staffImageFile").value = "";
    setPreview($("staffPreview"), null);
    $("staffFormTitle").textContent = "បន្ថែមបុគ្គលិក";
    $("staffCancelBtn").hidden = true;
    showMsg("staffMsg", "", null);
  }

  function resetGiftForm() {
    editingGiftId = null;
    $("giftName").value = "";
    $("giftType").value = "medium";
    $("giftQty").value = "1";
    $("giftPrice").value = "";
    $("giftImageUrl").value = "";
    $("giftImageFile").value = "";
    setPreview($("giftPreview"), null);
    $("giftFormTitle").textContent = "បន្ថែមរង្វាន់";
    $("giftCancelBtn").hidden = true;
    showMsg("giftMsg", "", null);
  }

  function loadStaffTable() {
    const raw = ensureStaffIds(O.loadStaff());
    staffListCache = raw.map(mapStaffRow);
    const tb = $("staffTableBody");
    tb.innerHTML = "";
    for (const r of staffListCache) {
      const tr = document.createElement("tr");
      const tdImg = document.createElement("td");
      const im = document.createElement("img");
      im.className = "dash-preview";
      im.alt = "";
      im.src = r.image;
      im.referrerPolicy = "no-referrer";
      bindImageFallback(im);
      tdImg.appendChild(im);
      const tdName = document.createElement("td");
      tdName.textContent = r.name || "";
      const tdAct = document.createElement("td");
      tdAct.className = "cell-actions";
      const bEdit = document.createElement("button");
      bEdit.type = "button";
      bEdit.textContent = "កែ";
      bEdit.dataset.act = "edit";
      bEdit.dataset.id = r.id;
      const bDel = document.createElement("button");
      bDel.type = "button";
      bDel.textContent = "លុប";
      bDel.dataset.act = "del";
      bDel.dataset.id = r.id;
      tdAct.appendChild(bEdit);
      tdAct.appendChild(bDel);
      tr.appendChild(tdImg);
      tr.appendChild(tdName);
      tr.appendChild(tdAct);
      tb.appendChild(tr);
    }
  }

  function loadGiftTable() {
    const raw = ensureGiftIds(O.loadGifts());
    giftListCache = raw.map(mapGiftRow);
    const tb = $("giftTableBody");
    tb.innerHTML = "";
    for (const r of giftListCache) {
      const tr = document.createElement("tr");
      const tdImg = document.createElement("td");
      const im = document.createElement("img");
      im.className = "dash-preview";
      im.alt = "";
      im.src = r.image;
      im.referrerPolicy = "no-referrer";
      bindImageFallback(im);
      tdImg.appendChild(im);
      const tdName = document.createElement("td");
      tdName.textContent = r.name || "";
      const tdType = document.createElement("td");
      tdType.textContent = r.type || "";
      const tdQty = document.createElement("td");
      tdQty.textContent = String(r.quantity ?? 0);
      const tdPrice = document.createElement("td");
      tdPrice.textContent = r.price == null || !Number.isFinite(r.price) ? "—" : String(r.price);
      const tdAct = document.createElement("td");
      tdAct.className = "cell-actions";
      const bEdit = document.createElement("button");
      bEdit.type = "button";
      bEdit.textContent = "កែ";
      bEdit.dataset.act = "edit";
      bEdit.dataset.id = r.id;
      const bDel = document.createElement("button");
      bDel.type = "button";
      bDel.textContent = "លុប";
      bDel.dataset.act = "del";
      bDel.dataset.id = r.id;
      tdAct.appendChild(bEdit);
      tdAct.appendChild(bDel);
      tr.appendChild(tdImg);
      tr.appendChild(tdName);
      tr.appendChild(tdType);
      tr.appendChild(tdQty);
      tr.appendChild(tdPrice);
      tr.appendChild(tdAct);
      tb.appendChild(tr);
    }
  }

  async function loadHistoryTable() {
    showMsg("historyMsg", "កំពុងផ្ទុក…", null);
    const tb = $("historyTableBody");
    try {
      const rows = O.loadHistory();
      if (!tb) return;
      tb.innerHTML = "";
      for (const r of rows) {
        const tr = document.createElement("tr");
        const t0 = document.createElement("td");
        if (r.at) {
          const d = new Date(r.at);
          t0.textContent = !Number.isNaN(d.getTime()) ? d.toLocaleString() : "—";
        } else {
          t0.textContent = "—";
        }
        const t1 = document.createElement("td");
        t1.textContent = r.staff || "";
        const t2 = document.createElement("td");
        t2.textContent = r.gift || "";
        tr.appendChild(t0);
        tr.appendChild(t1);
        tr.appendChild(t2);
        tb.appendChild(tr);
      }
      showMsg("historyMsg", rows.length ? `បានបង្ហាញ ${rows.length} ជួរ` : "គ្មានទិន្នន័យ", "success");
    } catch (e) {
      showMsg("historyMsg", e.message || String(e), "error");
    }
  }

  function activatePanel(name) {
    document.querySelectorAll(".dash-tab").forEach((b) => {
      const on = b.getAttribute("data-panel") === name;
      b.classList.toggle("active", on);
      b.setAttribute("aria-selected", on ? "true" : "false");
    });
    document.querySelectorAll(".dash-panel").forEach((p) => {
      p.classList.toggle("active", p.id === "panel-" + name);
    });
  }

  document.querySelectorAll(".dash-tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      const panel = btn.getAttribute("data-panel");
      activatePanel(panel);
      if (panel === "history") {
        loadHistoryTable();
      }
    });
  });

  $("staffTableBody").addEventListener("click", async (ev) => {
    const t = ev.target;
    if (!(t instanceof HTMLElement) || t.tagName !== "BUTTON") return;
    const id = t.dataset.id;
    const act = t.dataset.act;
    if (!id) return;
    if (act === "edit") {
      const row = staffListCache.find((s) => s.id === id);
      if (!row) return;
      editingStaffId = id;
      $("staffName").value = row.name || "";
      $("staffImageUrl").value = row.image_url || "";
      $("staffImageFile").value = "";
      $("staffFormTitle").textContent = "កែបុគ្គលិក";
      $("staffCancelBtn").hidden = false;
      setPreview($("staffPreview"), $("staffImageUrl").value || row.image || null);
      showMsg("staffMsg", "", null);
      return;
    }
    if (act === "del") {
      if (!confirm("លុបបុគ្គលិកនេះ?")) return;
      try {
        const list = O.loadStaff().filter((s) => s.id !== id);
        O.saveStaff(list);
        await loadStaffTable();
        if (editingStaffId === id) resetStaffForm();
        showMsg("staffMsg", "បានលុប", "success");
      } catch (e) {
        showMsg("staffMsg", e.message || String(e), "error");
      }
    }
  });

  $("giftTableBody").addEventListener("click", async (ev) => {
    const t = ev.target;
    if (!(t instanceof HTMLElement) || t.tagName !== "BUTTON") return;
    const id = t.dataset.id;
    const act = t.dataset.act;
    if (!id) return;
    if (act === "edit") {
      const row = giftListCache.find((g) => g.id === id);
      if (!row) return;
      editingGiftId = id;
      $("giftName").value = row.name || "";
      $("giftType").value = (row.type || "medium").toLowerCase();
      $("giftQty").value = String(row.quantity ?? 0);
      $("giftPrice").value = row.price == null || !Number.isFinite(row.price) ? "" : String(row.price);
      $("giftImageUrl").value = row.image_url || "";
      $("giftImageFile").value = "";
      $("giftFormTitle").textContent = "កែរង្វាន់";
      $("giftCancelBtn").hidden = false;
      setPreview($("giftPreview"), row.image || null);
      showMsg("giftMsg", "", null);
      return;
    }
    if (act === "del") {
      if (!confirm("លុបរង្វាន់នេះ?")) return;
      try {
        const list = O.loadGifts().filter((g) => g.id !== id);
        O.saveGifts(list);
        await loadGiftTable();
        if (editingGiftId === id) resetGiftForm();
        showMsg("giftMsg", "បានលុប", "success");
      } catch (e) {
        showMsg("giftMsg", e.message || String(e), "error");
      }
    }
  });

  $("staffSaveBtn").addEventListener("click", () => {
    const btn = $("staffSaveBtn");
    withDisabled(btn, async () => {
      try {
        const name = $("staffName").value.trim();
        if (!name) {
          showMsg("staffMsg", "សូមបញ្ចូលឈ្មោះ", "error");
          return;
        }
        const staffRow = editingStaffId ? staffListCache.find((s) => s.id === editingStaffId) : null;
        const existing = staffRow ? staffRow.image_url || "" : "";
        const imageStr = await resolveImage($("staffImageFile"), $("staffImageUrl"), existing);
        const image = imageStr.trim() || "./assets/images/twitter.png";
        let list = ensureStaffIds(O.loadStaff());
        if (editingStaffId) {
          list = list.map((s) =>
            s.id === editingStaffId ? { ...s, name, image } : s
          );
          showMsg("staffMsg", "រក្សាទុករួច", "success");
        } else {
          list.push({ id: crypto.randomUUID(), name, image });
          showMsg("staffMsg", "បានបន្ថែម", "success");
        }
        O.saveStaff(list);
        resetStaffForm();
        loadStaffTable();
      } catch (e) {
        showMsg("staffMsg", e.message || String(e), "error");
      }
    });
  });

  $("staffCancelBtn").addEventListener("click", () => resetStaffForm());

  $("giftSaveBtn").addEventListener("click", () => {
    const btn = $("giftSaveBtn");
    withDisabled(btn, async () => {
      try {
        const name = $("giftName").value.trim();
        if (!name) {
          showMsg("giftMsg", "សូមបញ្ចូលឈ្មោះរង្វាន់", "error");
          return;
        }
        const quantity = Number($("giftQty").value);
        if (!Number.isFinite(quantity) || quantity < 0 || !Number.isInteger(quantity)) {
          showMsg("giftMsg", "ចំនួនត្រូវជាលេខគត់ ០ ឡើង", "error");
          return;
        }
        const priceRaw = $("giftPrice").value.trim();
        let price = null;
        if (priceRaw !== "") {
          const p = Number(priceRaw);
          if (!Number.isFinite(p) || p < 0) {
            showMsg("giftMsg", "តម្លៃមិនត្រឹមត្រូវ", "error");
            return;
          }
          price = p;
        }
        const giftRow = editingGiftId ? giftListCache.find((g) => g.id === editingGiftId) : null;
        const existing = giftRow ? giftRow.image_url || "" : "";
        const imageStr = await resolveImage($("giftImageFile"), $("giftImageUrl"), existing);
        const image = imageStr.trim();
        const type = $("giftType").value;
        let list = ensureGiftIds(O.loadGifts());
        if (editingGiftId) {
          list = list.map((g) =>
            g.id === editingGiftId ? { ...g, name, image, quantity, price, type } : g
          );
          showMsg("giftMsg", "រក្សាទុករួច", "success");
        } else {
          list.push({
            id: crypto.randomUUID(),
            name,
            image,
            quantity,
            price,
            type
          });
          showMsg("giftMsg", "បានបន្ថែម", "success");
        }
        O.saveGifts(list);
        resetGiftForm();
        loadGiftTable();
      } catch (e) {
        showMsg("giftMsg", e.message || String(e), "error");
      }
    });
  });

  $("giftCancelBtn").addEventListener("click", () => resetGiftForm());

  $("historyRefreshBtn").addEventListener("click", () => {
    const btn = $("historyRefreshBtn");
    withDisabled(btn, () => loadHistoryTable());
  });

  $("exportFileBtn").addEventListener("click", () => {
    const btn = $("exportFileBtn");
    withDisabled(btn, async () => {
      try {
        const usedPicker = await O.saveExportWithPicker("foed-lucky-data.json");
        showMsg(
          "exportMsg",
          usedPicker
            ? "បានរក្សាទុកឯកសារ (អ្នកអាចរើសថត ឧ. data/ ក្នុងគម្រោង)"
            : "បានទាញចេញ — ពិនិត្យថត Downloads រួយយកទៅ data/ បាន",
          "success"
        );
      } catch (e) {
        if (e && e.name === "AbortError") {
          showMsg("exportMsg", "បានបោះបង់", null);
          return;
        }
        showMsg("exportMsg", e.message || String(e), "error");
      }
    });
  });

  $("importFileInput").addEventListener("change", () => {
    const input = $("importFileInput");
    const f = input.files && input.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const obj = JSON.parse(String(reader.result || "{}"));
        O.importPayload(obj);
        loadStaffTable();
        loadGiftTable();
        showMsg("exportMsg", "នាំចូលរួច — ផ្ទុកទំព័រល្បែងឡើងវិញដើម្បីឃើញផ្លាស់ប្ដូរ", "success");
      } catch (e) {
        showMsg("exportMsg", e.message || String(e), "error");
      }
      input.value = "";
    };
    reader.onerror = () => showMsg("exportMsg", "មិនអាចអានឯកសារ", "error");
    reader.readAsText(f, "UTF-8");
  });

  wirePreview($("staffImageFile"), $("staffImageUrl"), $("staffPreview"));
  wirePreview($("giftImageFile"), $("giftImageUrl"), $("giftPreview"));

  function boot() {
    if (!O) {
      setStatus("កំហុស — គ្មាន offline-storage.js", false);
      return;
    }
    setStatus("រត់ក្រៅបណ្ដាញ — ទិន្នន័យនៅ localStorage", true);
    try {
      loadStaffTable();
      loadGiftTable();
    } catch (e) {
      setStatus("កំហុសផ្ទុក", false);
      showMsg("staffMsg", e.message || String(e), "error");
    }
  }

  boot();
})();
