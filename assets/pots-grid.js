const STORAGE_KEYS = window.FoedOffline ? window.FoedOffline.KEYS : { staff: "foed_staff_pool", gifts: "foed_gifts_pool", history: "foed_win_history" };

const state = {
  staffPool: [],
  giftsPool: [],
  winHistory: [],
  historyCursor: 0,
  historyTicker: null,
  gridAssignments: [],
  currentStaff: null,
  spinning: false,
  shuffling: false,
  canPickPot: false,
  winningPotElement: null,
  finishingWin: false
};

const $ = (id) => document.getElementById(id);

const staffCount = $("staffCount");
const giftCount = $("giftCount");
const potTotalLabel = $("potTotalLabel");
const drawStaffBtn = $("drawStaffBtn");
const startBtn = $("startBtn");
const musicToggleBtn = $("musicToggleBtn");
const reloadFromStorageBtn = $("reloadFromStorageBtn");
const shuffleGridBtn = $("shuffleGridBtn");
const historyList = $("historyList");
const staffReel = $("staffReel");
const currentStaffEl = $("currentStaff");
const potsContainer = $("potsContainer");
const gridHint = $("gridHint");
const emptyGridMessage = $("emptyGridMessage");
const remainingGiftsList = $("remainingGiftsList");
const remainingGiftsPanel = $("remainingGiftsPanel");
const potsGridScroll = $("potsGridScroll");
const winnerStaff = $("winnerStaff");
const winnerStaffImage = $("winnerStaffImage");
const winnerGift = $("winnerGift");
const winnerGiftImage = $("winnerGiftImage");
const resultMessage = $("resultMessage");
const nextRoundBtn = $("nextRoundBtn");
const nextRoundHint = $("nextRoundHint");
const resultOverlay = $("resultOverlay");
const sunburst = $("sunburst");
const confettiCanvas = $("confetti-canvas");
const bgMusic = $("bgMusic");
const winFlyPopup = $("winFlyPopup");
const winFlyImage = $("winFlyImage");
const winFlyName = $("winFlyName");

const REEL_MAX_ITEMS = 36;
const POT_SUSPENSE_MS = 2800;
const STICK_STRIKE_MS = 560;
const KHMER_DIGITS = ["០", "១", "២", "៣", "៤", "៥", "៦", "៧", "៨", "៩"];
const POT_NUMBER_THEME_COUNT = 8;

const confettiFx = window.confetti ? window.confetti.create(confettiCanvas, { resize: true, useWorker: true }) : null;

const FOED_AUDIO = "./assets/audio/";
const clickSfx = new Audio(`${FOED_AUDIO}button-click.mp3`);
const breakSfx = new Audio(`${FOED_AUDIO}breakpot.mp3`);
const brokeheartSfx = new Audio(`${FOED_AUDIO}glass-breaking.mp3`);
const congratsSfx = new Audio(`${FOED_AUDIO}congrate_sound.mp3`);
const spinSfx = new Audio(`${FOED_AUDIO}spinsound.mp3`);
const winPopupSfx = new Audio(`${FOED_AUDIO}you-win-popup.mp3`);
const potWaitBoomSfx = new Audio(`${FOED_AUDIO}${encodeURIComponent("waiting to boom.mp3")}`);

clickSfx.volume = 0.55;
breakSfx.volume = 0.78;
brokeheartSfx.volume = 0.42;
congratsSfx.volume = 0.5;
spinSfx.volume = 0.38;
winPopupSfx.volume = 0.58;
potWaitBoomSfx.volume = 0.72;

const BG_MUSIC_NORMAL = 0.22;
const BG_MUSIC_DUCKED = 0.04;
const BG_MUSIC_SUSPENSE_DUCK = 0.008;
if (bgMusic) bgMusic.volume = BG_MUSIC_NORMAL;

let musicEnabled = true;
let bgMusicDuckTimer = null;
let bgMusicDuckUntil = 0;

function releaseBackgroundDuck() {
  if (bgMusicDuckTimer) {
    clearTimeout(bgMusicDuckTimer);
    bgMusicDuckTimer = null;
  }
  bgMusicDuckUntil = 0;
  if (bgMusic && musicEnabled && !bgMusic.paused) {
    bgMusic.volume = BG_MUSIC_NORMAL;
  }
}

function extendBackgroundDuck(durationMs, duckedVolume = BG_MUSIC_DUCKED) {
  if (!musicEnabled || !bgMusic || bgMusic.paused) return;
  const ms = Math.max(400, durationMs);
  const now = Date.now();
  bgMusicDuckUntil = Math.max(bgMusicDuckUntil, now + ms);
  bgMusic.volume = duckedVolume;
  if (bgMusicDuckTimer) clearTimeout(bgMusicDuckTimer);
  const wait = Math.max(0, bgMusicDuckUntil - now);
  bgMusicDuckTimer = setTimeout(() => {
    bgMusicDuckTimer = null;
    bgMusicDuckUntil = 0;
    if (musicEnabled && bgMusic && !bgMusic.paused) {
      bgMusic.volume = BG_MUSIC_NORMAL;
    }
  }, wait);
}

function openOverlay(el) {
  el.classList.add("show");
}
function closeOverlay(el) {
  el.classList.remove("show");
}
function randomInt(max) {
  return Math.floor(Math.random() * max);
}

function toKhmerDigits(value) {
  return String(value).replace(/\d/g, (digit) => KHMER_DIGITS[Number(digit)] || digit);
}
function shuffleList(list) {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
function playSfx(audio) {
  if (!musicEnabled) return;
  audio.currentTime = 0;
  audio.play().catch(() => {});
}
function playDuckedSfx(audio, duckMs, duckedVolume = BG_MUSIC_DUCKED) {
  extendBackgroundDuck(duckMs, duckedVolume);
  playSfx(audio);
}
function stopSfx(audio) {
  try {
    audio.pause();
    audio.currentTime = 0;
  } catch (_e) {}
}
function primeSfx(audio) {
  audio.play().then(() => {
    audio.pause();
    audio.currentTime = 0;
  }).catch(() => {});
}
const allGameSfx = [clickSfx, breakSfx, brokeheartSfx, congratsSfx, spinSfx, winPopupSfx, potWaitBoomSfx];
function unlockAllSfx() {
  allGameSfx.forEach(primeSfx);
}
function startBackgroundMusic() {
  if (!bgMusic || !musicEnabled) return;
  bgMusic.volume = BG_MUSIC_NORMAL;
  bgMusic.play().catch(() => {});
}
function stopBackgroundMusic() {
  if (!bgMusic) return;
  bgMusic.pause();
  releaseBackgroundDuck();
}
function updateMusicBtn() {
  if (!musicToggleBtn) return;
  musicToggleBtn.textContent = `តន្ត្រី: ${musicEnabled ? "បើក" : "បិទ"}`;
}

function isPhoneLayout() {
  return typeof window.matchMedia === "function" && window.matchMedia("(max-width: 520px)").matches;
}

function setStaffReelMessage(text, scrollMode = "start") {
  if (!staffReel) return;
  staffReel.innerHTML = "";
  const row = document.createElement("div");
  row.textContent = text;
  staffReel.appendChild(row);
  const slotInner = staffReel.parentElement;
  if (!(slotInner instanceof HTMLElement)) return;
  if (scrollMode === "center" && slotInner.scrollWidth > slotInner.clientWidth) {
    slotInner.scrollLeft = Math.max(0, (slotInner.scrollWidth - slotInner.clientWidth) / 2);
  } else {
    slotInner.scrollLeft = 0;
  }
}

function getPotSuspenseMs() {
  if (typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return 600;
  }
  return POT_SUSPENSE_MS;
}

function getPotBoomSuspenseMs() {
  if (typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return 220;
  }
  return 560;
}

function waitForPotSuspense(el) {
  const ms = getPotSuspenseMs();
  return new Promise((resolve) => {
    const onEnd = (e) => {
      if (e.target !== el) return;
      if (e.animationName !== "potSuspenseGrow") return;
      el.removeEventListener("animationend", onEnd);
      resolve();
    };
    el.addEventListener("animationend", onEnd);
    window.setTimeout(() => {
      el.removeEventListener("animationend", onEnd);
      resolve();
    }, ms + 400);
  });
}

function waitForPotBoomSuspense(el) {
  const ms = getPotBoomSuspenseMs();
  return new Promise((resolve) => {
    const onEnd = (e) => {
      if (e.target !== el) return;
      if (e.animationName !== "potBoomFromSuspense") return;
      el.removeEventListener("animationend", onEnd);
      resolve();
    };
    el.addEventListener("animationend", onEnd);
    window.setTimeout(() => {
      el.removeEventListener("animationend", onEnd);
      resolve();
    }, ms + 250);
  });
}

function normalizeStaff(rawStaff) {
  return rawStaff
    .map((staff) => {
      if (typeof staff === "string") {
        return { name: staff.trim(), image: "./assets/images/twitter.png" };
      }
      const sid = staff.id != null && String(staff.id).trim() !== "" ? String(staff.id).trim() : null;
      const row = {
        name: String(staff.name || "").trim(),
        image: String(staff.image || "./assets/images/twitter.png").trim()
      };
      if (sid) row.id = sid;
      return row;
    })
    .filter((staff) => staff.name);
}

function normalizeGifts(rawGifts) {
  return rawGifts
    .map((g) => {
      const gid = g.id != null && String(g.id).trim() !== "" ? String(g.id).trim() : null;
      const priceRaw = g.price;
      const priceNum = priceRaw == null || priceRaw === "" ? null : Number(priceRaw);
      const row = {
        name: String(g.name || "").trim(),
        type: String(g.type || "medium").trim().toLowerCase(),
        image: String(g.image || "").trim(),
        quantity: Number(g.quantity || 0),
        price: Number.isFinite(priceNum) ? priceNum : null
      };
      if (gid) row.id = gid;
      return row;
    })
    .filter((g) => g.name && g.quantity > 0);
}

function persistPools() {
  localStorage.setItem(STORAGE_KEYS.staff, JSON.stringify(state.staffPool));
  localStorage.setItem(STORAGE_KEYS.gifts, JSON.stringify(state.giftsPool));
}

function persistHistory() {
  localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(state.winHistory));
}

function renderHistoryPage() {
  if (!historyList) return;
  historyList.classList.remove("fade-in");
  const list = state.winHistory;
  if (!list.length) {
    historyList.innerHTML = "<div class=\"history-item\">មិនទាន់មានប្រវត្តិអ្នកឈ្នះ</div>";
    return;
  }
  const start = state.historyCursor % list.length;
  const shown = [];
  for (let i = 0; i < Math.min(5, list.length); i += 1) {
    shown.push(list[(start + i) % list.length]);
  }
  historyList.innerHTML = shown.map((item) => `<div class="history-item"><strong>${item.staff}</strong> - ${item.gift}</div>`).join("");
  requestAnimationFrame(() => historyList.classList.add("fade-in"));
}

function startHistoryTicker() {
  if (state.historyTicker) clearInterval(state.historyTicker);
  renderHistoryPage();
  state.historyTicker = window.setInterval(() => {
    if (!state.winHistory.length) return;
    state.historyCursor = (state.historyCursor + 5) % state.winHistory.length;
    renderHistoryPage();
  }, 5000);
}

async function loadDataFromJsonFile() {
  const res = await fetch("./data/foed-lucky-data.json", { cache: "no-store" });
  if (!res.ok) return null;
  const data = await res.json();
  return data;
}

async function loadData() {
  const savedStaff = localStorage.getItem(STORAGE_KEYS.staff);
  const savedGifts = localStorage.getItem(STORAGE_KEYS.gifts);
  const savedHistory = localStorage.getItem(STORAGE_KEYS.history);
  let staff = savedStaff ? JSON.parse(savedStaff) : null;
  let gifts = savedGifts ? JSON.parse(savedGifts) : null;
  if (!staff || !staff.length || !gifts || !gifts.length) {
    try {
      const data = await loadDataFromJsonFile();
      if (data) {
        if (Array.isArray(data.staff) && data.staff.length) staff = data.staff;
        if (Array.isArray(data.gifts) && data.gifts.length) gifts = data.gifts;
      }
    } catch (_e) {
      /* ignore */
    }
  }
  state.staffPool = normalizeStaff(Array.isArray(staff) ? staff : []);
  state.giftsPool = normalizeGifts(Array.isArray(gifts) ? gifts : []);
  state.winHistory = savedHistory ? JSON.parse(savedHistory) : [];
  if (!Array.isArray(state.winHistory)) state.winHistory = [];
  persistHistory();
  updateCounts();
  startHistoryTicker();
}

function updateCounts() {
  const totalGiftQty = state.giftsPool.reduce((sum, g) => sum + g.quantity, 0);
  if (staffCount) staffCount.textContent = String(state.staffPool.length);
  if (giftCount) giftCount.textContent = String(totalGiftQty);
  if (potTotalLabel) potTotalLabel.textContent = String(state.gridAssignments.length);
  renderRemainingGiftsPanel();
}

function renderRemainingGiftsPanel() {
  if (!remainingGiftsList) return;
  const pool = state.giftsPool.filter((g) => g.quantity > 0);
  remainingGiftsList.textContent = "";
  if (!pool.length) {
    const empty = document.createElement("div");
    empty.className = "remaining-gifts-empty";
    empty.textContent = "គ្មានរង្វាន់នៅសល់";
    remainingGiftsList.appendChild(empty);
    if (remainingGiftsPanel) remainingGiftsPanel.classList.add("remaining-gifts-panel--empty");
    return;
  }
  if (remainingGiftsPanel) remainingGiftsPanel.classList.remove("remaining-gifts-panel--empty");
  pool.forEach((g) => {
    const card = document.createElement("div");
    card.className = "remaining-gift-card";
    card.setAttribute("role", "listitem");
    const thumb = document.createElement("div");
    thumb.className = "remaining-gift-thumb";
    const img = document.createElement("img");
    img.src = (g.image || "").trim() || "./assets/images/twitter.png";
    img.alt = "";
    img.width = 56;
    img.height = 56;
    img.loading = "lazy";
    img.decoding = "async";
    thumb.appendChild(img);
    const meta = document.createElement("div");
    meta.className = "remaining-gift-meta";
    const nameEl = document.createElement("span");
    nameEl.className = "remaining-gift-name";
    nameEl.textContent = g.name || "";
    const qtyEl = document.createElement("span");
    qtyEl.className = "remaining-gift-qty";
    qtyEl.textContent = `× ${g.quantity}`;
    meta.appendChild(nameEl);
    meta.appendChild(qtyEl);
    card.appendChild(thumb);
    card.appendChild(meta);
    remainingGiftsList.appendChild(card);
  });
}

function prefersReducedMotion() {
  return typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

async function runPotsShuffleAnimation() {
  if (!potsContainer) return;
  if (prefersReducedMotion()) {
    buildGiftGridFromPool();
    renderPots();
    updateCounts();
    return;
  }

  state.shuffling = true;
  if (potsGridScroll) potsGridScroll.classList.add("pots-grid-shuffling");

  const existing = [...potsContainer.querySelectorAll(".pot-grid")];
  if (existing.length) {
    playDuckedSfx(spinSfx, 1600);
    await Promise.all(
      existing.map((el, i) => {
        const jitter = ((i * 17) % 9) * 22;
        return el
          .animate(
            [
              { opacity: 1, transform: "scale(1) rotate(0deg)" },
              { opacity: 0.12, transform: `scale(0.55) rotate(${(i % 5) - 2}deg) translateY(8px)` }
            ],
            { duration: 520, delay: jitter, easing: "cubic-bezier(0.4, 0, 0.82, 0.45)", fill: "forwards" }
          )
          .finished.catch(() => {});
      })
    );
    await new Promise((r) => window.setTimeout(r, 120));
  }

  buildGiftGridFromPool();
  renderPots();

  const fresh = [...potsContainer.querySelectorAll(".pot-grid")];
  const n = fresh.length;
  if (n) {
    playDuckedSfx(spinSfx, Math.min(1200, 400 + n * 14));
    const cap = 1600;
    const stagger = n > 48 ? 10 : n > 24 ? 14 : 20;
    fresh.forEach((el, i) => {
      const delay = Math.min(i * stagger, cap);
      el
        .animate(
          [
            { opacity: 0, transform: "scale(0.45) translateY(16px)" },
            { opacity: 1, transform: "scale(1) translateY(0)" }
          ],
          { duration: 380, delay, easing: "cubic-bezier(0.22, 1.15, 0.36, 1)", fill: "forwards" }
        )
        .finished.catch(() => {});
    });
    const waitMs = Math.min(n * stagger + 420, cap + 480);
    await new Promise((r) => window.setTimeout(r, waitMs));
  }

  try {
    spinSfx.pause();
    spinSfx.currentTime = 0;
  } catch (_e) {}

  if (potsGridScroll) potsGridScroll.classList.remove("pots-grid-shuffling");
  state.shuffling = false;
  updateCounts();
}

function checkGameOver() {
  if (!state.staffPool.length || !state.giftsPool.length) {
    if (drawStaffBtn) drawStaffBtn.disabled = true;
    if (resultMessage) {
      resultMessage.textContent = "ហ្គេមបញ្ចប់: មិនមានបុគ្គលិក ឬ រង្វាន់នៅសល់";
    }
    if (nextRoundHint) nextRoundHint.hidden = true;
    openOverlay(resultOverlay);
  } else if (nextRoundHint) {
    nextRoundHint.hidden = false;
  }
}

async function finishWinAndReshuffle() {
  if (state.finishingWin) return;
  state.finishingWin = true;
  try {
    stopSfx(winPopupSfx);
    stopSfx(congratsSfx);
    releaseBackgroundDuck();
    closeOverlay(resultOverlay);
    if (sunburst) sunburst.classList.remove("show");
    state.currentStaff = null;
    if (currentStaffEl) currentStaffEl.textContent = "មិនទាន់មាន";
    setStaffReelMessage("រង់ចាំចាប់ឈ្មោះ...", "start");
    if (drawStaffBtn) drawStaffBtn.disabled = false;
    setGridPickEnabled(false);
    if (gridHint) {
      gridHint.innerHTML = "ចុច <strong>ចាប់ឈ្មោះបុគ្គលិក</strong> រួចជ្រើសក្អមមួយដោយចុច។ ក្អមត្រូវបានច្របល់ឡើងវិញ។";
    }

    await runPotsShuffleAnimation();
    checkGameOver();
  } finally {
    state.finishingWin = false;
  }
}

function expandPoolToShuffledAssignments(pool) {
  const instances = [];
  pool.forEach((g) => {
    const base = {
      giftId: g.id != null ? String(g.id) : null,
      name: g.name,
      image: g.image,
      type: g.type,
      price: g.price
    };
    for (let q = 0; q < g.quantity; q += 1) {
      instances.push({ ...base });
    }
  });
  return shuffleList(instances);
}

function buildGiftGridFromPool() {
  state.gridAssignments = expandPoolToShuffledAssignments(state.giftsPool);
  updateCounts();
}

function decrementGiftInPool(ref) {
  const id = ref.giftId != null ? ref.giftId : ref.id;
  let i = id ? state.giftsPool.findIndex((g) => g.id === id) : -1;
  if (i === -1) {
    i = state.giftsPool.findIndex((g) => g.name === ref.name);
  }
  if (i === -1) return null;
  const row = state.giftsPool[i];
  row.quantity -= 1;
  const poolIndex = i;
  if (row.quantity <= 0) {
    state.giftsPool.splice(i, 1);
  }
  return { index: poolIndex, gift: row };
}

function renderPots() {
  if (!potsContainer) return;
  potsContainer.innerHTML = "";
  const n = state.gridAssignments.length;
  if (emptyGridMessage) {
    emptyGridMessage.hidden = n > 0;
  }
  if (!n) {
    updateCounts();
    return;
  }

  for (let i = 0; i < n; i += 1) {
    const assignment = state.gridAssignments[i];
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "kaorm pot pot-grid";
    btn.dataset.slotIndex = String(i);
    btn.dataset.pot = String(i + 1);
    btn.setAttribute("aria-label", `ក្អម ${i + 1}`);
    btn.disabled = !state.canPickPot;

    const num = document.createElement("span");
    num.className = "pot-number pot-grid-number";
    num.textContent = toKhmerDigits(i + 1);
    num.dataset.tone = String(i % POT_NUMBER_THEME_COUNT);
    num.setAttribute("aria-hidden", "true");
    btn.appendChild(num);

    potsContainer.appendChild(btn);
  }
  updateCounts();
}

function setGridPickEnabled(on) {
  state.canPickPot = on;
  if (!potsContainer) return;
  potsContainer.querySelectorAll(".pot-grid:not(.pot-grid-broken)").forEach((btn) => {
    btn.disabled = !on;
    if (on) {
      btn.classList.add("pot-grid-pickable");
    } else {
      btn.classList.remove("pot-grid-pickable");
    }
  });
}

function celebrate() {
  if (sunburst) sunburst.classList.add("show");
  playDuckedSfx(congratsSfx, 10000);
  if (!confettiFx) return;
  confettiFx({ particleCount: 14, spread: 58, origin: { y: 0.65 } });
}

async function animateWinPopupToPot(giftInfo, targetPot) {
  if (!winFlyPopup || !winFlyImage || !winFlyName || !targetPot) return;
  winFlyImage.src = giftInfo.gift.image || "./assets/images/twitter.png";
  winFlyName.textContent = giftInfo.gift.name;
  winFlyPopup.classList.add("surprise");
  winFlyPopup.classList.add("show");
  winFlyPopup.classList.add("win-fly-popup--boom");
  playDuckedSfx(winPopupSfx, 7200);
  const potRect = targetPot.getBoundingClientRect();
  const sourceLeft = potRect.left + potRect.width / 2;
  const sourceTop = potRect.top + potRect.height / 2;
  winFlyPopup.style.left = `${sourceLeft}px`;
  winFlyPopup.style.top = `${sourceTop}px`;
  winFlyPopup.style.transform = "translate3d(-50%, -50%, 0) scale(0.12)";

  try {
    const boomReveal = winFlyPopup.animate(
      [
        { left: `${sourceLeft}px`, top: `${sourceTop}px`, transform: "translate3d(-50%, -50%, 0) scale(0.12)", opacity: 0.28 },
        { left: `${sourceLeft}px`, top: `${sourceTop}px`, transform: "translate3d(-50%, -50%, 0) scale(1.38)", opacity: 1 },
        { left: `${sourceLeft}px`, top: `${sourceTop}px`, transform: "translate3d(-50%, -50%, 0) scale(1.12)", opacity: 1 }
      ],
      { duration: 520, easing: "cubic-bezier(0.16, 0.88, 0.22, 1)", fill: "forwards" }
    );
    await boomReveal.finished;

    const centerReveal = winFlyPopup.animate(
      [
        { left: `${sourceLeft}px`, top: `${sourceTop}px`, transform: "translate3d(-50%, -50%, 0) scale(1.12)", opacity: 1 },
        { left: "50%", top: "50%", transform: "translate3d(-50%, -50%, 0) scale(1.22)", opacity: 1 }
      ],
      { duration: 420, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)", fill: "forwards" }
    );
    await centerReveal.finished;
    await new Promise((resolve) => window.setTimeout(resolve, 1200));
  } finally {
    winFlyPopup.classList.remove("win-fly-popup--boom");
  }

  winFlyPopup.classList.remove("surprise");
  winFlyPopup.classList.remove("show");
}

function showGiftOnPot(btn, assignment, winnerName) {
  const wrap = document.createElement("div");
  wrap.className = "pot-gift-on-pot winning pot-gift-on-pot--grid";
  const img = document.createElement("img");
  img.src = assignment.image || "./assets/images/twitter.png";
  img.alt = assignment.name;
  wrap.appendChild(img);
  const label = document.createElement("div");
  label.className = "pot-gift-name";
  label.textContent = assignment.name;
  wrap.appendChild(label);
  const winBadge = document.createElement("div");
  winBadge.className = "pot-gift-win-badge";
  winBadge.textContent = `អបអរសាទរ ${winnerName || "អ្នកឈ្នះ"}`;
  wrap.appendChild(winBadge);
  wrap.classList.add("pot-gift-pop-in");
  btn.appendChild(wrap);
  btn.classList.add("preview-active", "preview-picked");
}

async function completeRound(giftInfo) {
  const staffIndex = state.staffPool.findIndex((staff) => staff.name === state.currentStaff.name);
  if (staffIndex !== -1) state.staffPool.splice(staffIndex, 1);

  const dec = decrementGiftInPool(giftInfo.gift);
  if (!dec) {
    resultMessage.textContent = "មិនអាចដករង្វាន់ពីស្តុក";
  }

  persistPools();
  updateCounts();

  const giftLabel = `${giftInfo.gift.name}`;

  winnerStaff.textContent = state.currentStaff?.name || "-";
  winnerStaffImage.src = state.currentStaff?.image || "./assets/images/twitter.png";
  winnerStaffImage.style.display = "block";
  winnerGift.textContent = giftLabel;
  winnerGiftImage.src = giftInfo.gift.image || "./assets/images/twitter.png";
  winnerGiftImage.style.display = "block";
  resultMessage.textContent = "អបអរសាទរ! បានទទួលរង្វាន់";
  if (nextRoundHint) nextRoundHint.hidden = false;
  state.winHistory.unshift({
    staff: state.currentStaff?.name || "-",
    gift: giftLabel,
    at: new Date().toISOString()
  });
  state.winHistory = state.winHistory.slice(0, 120);
  state.historyCursor = 0;
  persistHistory();
  renderHistoryPage();
  celebrate();
  openOverlay(resultOverlay);
  if (gridHint) {
    gridHint.textContent = `អបអរសាទរ ${state.currentStaff?.name || ""}! រង្វាន់: ${giftInfo.gift.name}`;
  }
}

async function onGridPotClick(target) {
  if (state.shuffling) return;
  if (!state.currentStaff || !state.canPickPot) {
    playSfx(clickSfx);
    if (gridHint) {
      gridHint.innerHTML = "សូមចុច <strong>ចាប់ឈ្មោះបុគ្គលិក</strong> មុនពេលជ្រើសក្អម។";
    }
    return;
  }
  if (target.classList.contains("pot-grid-broken")) return;

  setGridPickEnabled(false);
  state.winningPotElement = target;

  const slotIndex = Number(target.dataset.slotIndex || "0");
  const assignment = state.gridAssignments[slotIndex];
  if (!assignment) {
    setGridPickEnabled(true);
    return;
  }

  target.classList.remove("pot-jiggle", "pot-boom", "pot-impact", "pot-boom-suspense", "pot-suspense");
  void target.offsetWidth;
  target.classList.add("pot-focus");

  const reducedStick = typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const stickStrikeMs = reducedStick ? 200 : STICK_STRIKE_MS;
  const stickImpactDelayMs = reducedStick ? 80 : Math.round(stickStrikeMs * 0.43);

  await new Promise((resolve) => {
    window.setTimeout(() => {
      target.classList.remove("pot-impact");
      void target.offsetWidth;
      target.classList.add("pot-impact");
      playSfx(clickSfx);
    }, stickImpactDelayMs);
    window.setTimeout(() => {
      target.classList.remove("pot-impact");
    }, stickImpactDelayMs + 400);
    window.setTimeout(() => {
      target.classList.remove("pot-impact");
      resolve();
    }, stickStrikeMs);
  });

  void target.offsetWidth;
  target.classList.add("pot-suspense");

  const suspenseMs = getPotSuspenseMs();
  playDuckedSfx(potWaitBoomSfx, suspenseMs + 800, BG_MUSIC_SUSPENSE_DUCK);
  await waitForPotSuspense(target);
  stopSfx(potWaitBoomSfx);

  target.classList.remove("pot-suspense");
  void target.offsetWidth;
  target.classList.add("pot-boom-suspense");
  playDuckedSfx(breakSfx, 4200);

  const giftInfo = {
    gift: {
      name: assignment.name,
      type: assignment.type,
      image: assignment.image,
      id: assignment.giftId,
      price: assignment.price
    }
  };

  window.setTimeout(() => {
    showGiftOnPot(target, assignment, state.currentStaff?.name || "");
  }, 320);

  await waitForPotBoomSuspense(target);
  await animateWinPopupToPot(giftInfo, target);

  target.classList.add("pot-grid-broken");
  target.classList.remove("pot-focus", "pot-boom-suspense", "pot-impact");
  target.disabled = true;
  target.classList.remove("pot-grid-pickable");

  await completeRound(giftInfo);
}

async function spinStaffReel() {
  if (state.spinning || state.shuffling) return;
  if (!state.staffPool.length) {
    if (isPhoneLayout()) {
      window.alert("គ្មានបុគ្គលិកនៅសល់។ សូមកំណត់ទិន្នន័យនៅផ្ទាំងគ្រប់គ្រង។");
    }
    return;
  }
  if (!state.giftsPool.length) {
    if (isPhoneLayout()) {
      window.alert("គ្មានរង្វាន់នៅសល់។ សូមកំណត់ទិន្នន័យនៅផ្ទាំងគ្រប់គ្រង។");
    }
    return;
  }

  playSfx(clickSfx);
  state.spinning = true;
  setGridPickEnabled(false);
  if (drawStaffBtn) drawStaffBtn.disabled = true;
  closeOverlay(resultOverlay);
  if (sunburst) sunburst.classList.remove("show");
  staffReel.style.transform = "translateY(0)";

  let reelNames = shuffleList(state.staffPool);
  while (reelNames.length && reelNames.length < REEL_MAX_ITEMS) {
    reelNames = reelNames.concat(shuffleList(state.staffPool));
  }
  reelNames = reelNames.slice(0, REEL_MAX_ITEMS);
  state.currentStaff = reelNames[reelNames.length - 1];

  const spinAnimMs = reelNames.length * 62 + 500;
  playDuckedSfx(spinSfx, spinAnimMs);

  const fragment = document.createDocumentFragment();
  reelNames.forEach((staff) => {
    const row = document.createElement("div");
    row.textContent = staff.name;
    fragment.appendChild(row);
  });

  staffReel.innerHTML = "";
  staffReel.appendChild(fragment);

  let rowHeight = 96;
  for (const row of staffReel.children) {
    if (row instanceof HTMLElement) {
      rowHeight = Math.max(rowHeight, row.offsetHeight || 96);
    }
  }
  for (const row of staffReel.children) {
    if (row instanceof HTMLElement) {
      row.style.minHeight = `${rowHeight}px`;
    }
  }
  requestAnimationFrame(() => {
    const slotInner = staffReel.parentElement;
    if (slotInner instanceof HTMLElement && slotInner.scrollWidth > slotInner.clientWidth) {
      slotInner.scrollLeft = Math.max(0, (slotInner.scrollWidth - slotInner.clientWidth) / 2);
    }
  });
  const travelY = (reelNames.length - 1) * rowHeight;
  const reelAnimation = staffReel.animate(
    [{ transform: "translateY(0)" }, { transform: `translateY(-${travelY}px)` }],
    {
      duration: reelNames.length * 62,
      easing: "linear",
      iterations: 1,
      fill: "forwards"
    }
  );

  try {
    await reelAnimation.finished;
  } finally {
    /* no-op */
  }
  reelAnimation.cancel();
  setStaffReelMessage(state.currentStaff.name, "center");
  currentStaffEl.textContent = state.currentStaff.name;
  spinSfx.pause();
  spinSfx.currentTime = 0;
  setGridPickEnabled(true);
  state.spinning = false;
  if (gridHint) {
    gridHint.innerHTML = `ឈ្មោះចេញហើយ: <strong>${state.currentStaff.name}</strong> — ចុចក្អមមួយដើម្បីបំបែក។`;
  }
}

async function requestShuffleGrid() {
  if (state.spinning || state.shuffling) return;
  if (state.currentStaff) {
    const ok = window.confirm("មានអ្នកលេងកំពុងជ្រើសរើស។ ច្របល់ឡើងវិញនឹងចាប់ផ្តើមជុំថ្មី។ បន្ត?");
    if (!ok) return;
    state.currentStaff = null;
    if (currentStaffEl) currentStaffEl.textContent = "មិនទាន់មាន";
    setStaffReelMessage("រង់ចាំចាប់ឈ្មោះ...", "start");
    if (drawStaffBtn) drawStaffBtn.disabled = false;
    setGridPickEnabled(false);
    closeOverlay(resultOverlay);
  }
  playSfx(clickSfx);
  await runPotsShuffleAnimation();
  if (drawStaffBtn) drawStaffBtn.disabled = false;
  checkGameOver();
}

if (reloadFromStorageBtn) {
  reloadFromStorageBtn.addEventListener("click", () => {
    playSfx(clickSfx);
    void (async () => {
      await loadData();
      state.currentStaff = null;
      if (currentStaffEl) currentStaffEl.textContent = "មិនទាន់មាន";
      setStaffReelMessage("រង់ចាំចាប់ឈ្មោះ...", "start");
      setGridPickEnabled(false);
      closeOverlay(resultOverlay);
      await runPotsShuffleAnimation();
      if (drawStaffBtn) drawStaffBtn.disabled = false;
      checkGameOver();
    })();
  });
}

if (shuffleGridBtn) {
  shuffleGridBtn.addEventListener("click", () => {
    void requestShuffleGrid();
  });
}

startBtn.addEventListener("click", () => {
  unlockAllSfx();
  playSfx(clickSfx);
  startBackgroundMusic();
});

drawStaffBtn.addEventListener("click", () => {
  void spinStaffReel();
});

nextRoundBtn.addEventListener("click", () => {
  playSfx(clickSfx);
  void finishWinAndReshuffle();
});

musicToggleBtn.addEventListener("click", () => {
  musicEnabled = !musicEnabled;
  if (musicEnabled) {
    startBackgroundMusic();
  } else {
    stopBackgroundMusic();
    allGameSfx.forEach(stopSfx);
    releaseBackgroundDuck();
  }
  updateMusicBtn();
});

if (potsContainer) {
  potsContainer.addEventListener("click", (event) => {
    const t = event.target;
    const btn = t instanceof Element ? t.closest("button.pot-grid") : null;
    if (btn instanceof HTMLButtonElement) {
      void onGridPotClick(btn);
    }
  });
}

(function boot() {
  void (async () => {
    await loadData();
    buildGiftGridFromPool();
    renderPots();
    updateCounts();
    if (drawStaffBtn) drawStaffBtn.disabled = false;
    setGridPickEnabled(false);
    checkGameOver();
    updateMusicBtn();
  })();
})();

window.addEventListener("click", startBackgroundMusic, { once: true });
