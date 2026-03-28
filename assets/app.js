const defaultStaff = [
  { name: "លោក សុខ វណ្ណា", image: "./assets/images/twitter.png" },
  { name: "កញ្ញា ចាន់ ដាវី", image: "./assets/images/twitter.png" },
  { name: "លោក ជា ដារ៉ា", image: "./assets/images/twitter.png" },
  { name: "កញ្ញា លឹម ស្រីនាង", image: "./assets/images/twitter.png" },
  { name: "លោក គង់ វិសាល", image: "./assets/images/twitter.png" },
  { name: "កញ្ញា ពេជ្រ រស្មី", image: "./assets/images/twitter.png" },
  { name: "លោក សេង រ៉ាវុធ", image: "./assets/images/twitter.png" },
  { name: "កញ្ញា ឈឹម ដាលីន", image: "./assets/images/twitter.png" }
];
const defaultGifts = [
  { name: "ទឹក Freshy ១កំប៉ុង", type: "cheap", image: "../../vaikaorm/images/gift/freshy.png", quantity: 2, price: null },
  { name: "ត្រីខ ១កំប៉ុង", type: "medium", image: "../../vaikaorm/images/gift/canfish.png", quantity: 2, price: null },
  { name: "Amazon ១កែវ", type: "expensive", image: "../../vaikaorm/images/gift/amazon.png", quantity: 1, price: null },
  { name: "Coca ១កំប៉ុង", type: "cheap", image: "../../vaikaorm/images/gift/coca.png", quantity: 5, price: null },
  { name: "ក្រមា ១", type: "medium", image: "../../vaikaorm/images/gift/kroma.png", quantity: 3, price: null },
  { name: "Tiger ១កំប៉ុង", type: "expensive", image: "../../vaikaorm/images/gift/tigerBeer.png", quantity: 2, price: null }
];
const defaultWinHistory = [
  { staff: "លោក សុខ វណ្ណា", gift: "Coca ១កំប៉ុង (cheap)" },
  { staff: "កញ្ញា ចាន់ ដាវី", gift: "ក្រមា ១ (medium)" },
  { staff: "លោក ជា ដារ៉ា", gift: "Amazon ១កែវ (expensive)" },
  { staff: "លោក គង់ វិសាល", gift: "ទឹក Freshy ១កំប៉ុង (cheap)" },
  { staff: "កញ្ញា ពេជ្រ រស្មី", gift: "Tiger ១កំប៉ុង (expensive)" }
];
const STORAGE_KEYS = window.FoedOffline ? window.FoedOffline.KEYS : { staff: "foed_staff_pool", gifts: "foed_gifts_pool", history: "foed_win_history" };
/** Chance (per spin) that one expensive gift appears among the five pots, when stock exists. Often none. */
const EXPENSIVE_POT_SLOT_CHANCE = 0.38;

const state = { staffPool: [], giftsPool: [], currentStaff: null, canPlayPot: false, spinning: false, winHistory: [], historyCursor: 0, historyTicker: null, potAssignments: [], winningPotElement: null };

const $ = (id) => document.getElementById(id);
const staffInput = $("staffInput");
const giftInput = $("giftInput");
const saveDataBtn = $("saveDataBtn");
const resetFullDataBtn = $("resetFullDataBtn");
const closeSettingsBtn = $("closeSettingsBtn");
const configMessage = $("configMessage");
const staffCount = $("staffCount");
const giftCount = $("giftCount");
const drawStaffBtn = $("drawStaffBtn");
const startBtn = $("startBtn");
const settingsBtn = $("settingsBtn");
const musicToggleBtn = $("musicToggleBtn");
const historyList = $("historyList");
const staffReel = $("staffReel");
const currentStaff = $("currentStaff");
const potsContainer = $("potsContainer");
const previewNextBtn = $("previewNextBtn");
const winFlyPopup = $("winFlyPopup");
const winFlyImage = $("winFlyImage");
const winFlyName = $("winFlyName");
const pots = Array.from(document.querySelectorAll(".pot"));
const winnerStaff = $("winnerStaff");
const winnerStaffImage = $("winnerStaffImage");
const winnerGift = $("winnerGift");
const winnerGiftImage = $("winnerGiftImage");
const resultMessage = $("resultMessage");
const nextRoundBtn = $("nextRoundBtn");
const resultOverlay = $("resultOverlay");
const settingsOverlay = $("settingsOverlay");
const sunburst = $("sunburst");
const confettiCanvas = $("confetti-canvas");
const bgMusic = $("bgMusic");
const khmerBoy = $("khmerBoy");
const boyName = $("boyName");
const boyStaffImage = $("boyStaffImage");
const kaormBlock = document.querySelector(".kaorm-block");
const boyStage = $("boyStage");
const dragHint = $("dragHint");
const gameSteps = $("gameSteps");
const gameStepHint = $("gameStepHint");
const potGuideBubble = $("potGuideBubble");
const spinGuideTarget = $("spinGuideTarget");
const guideSpotSpin = $("guideSpotSpin");
const guideSpotPots = $("guideSpotPots");

const GAME_STEP_HINTS = {
  1: "ចុច <strong>ចាប់ផ្ដើម</strong> ខាងលើស្ដាំ រួចទៅកណ្ដាលអេក្រង់ ចុច <strong>ចាប់ឈ្មោះបុគ្គលិក</strong> ឲរឡប់ឈ្មោះ។",
  2: "នៅកណ្ដាលអេក្រង់ ចុច <strong>ចាប់ឈ្មោះបុគ្គលិក</strong> ឲរឡប់ចាប់ឈ្មោះ (មើលសញ្ញាក្រឡាកាប់ពណ៌លឿង)។",
  3: "នៅទីលានក្អម រង់ចាំឲ្យ<strong>ក្មេងប្រុសដើរក្រោមក្អម</strong> រួចចុច<strong>ក្អមនោះ</strong>ពេលឈរត្រូវ (មើលសញ្ញាក្រឡាកាប់)។"
};

const confettiFx = window.confetti ? window.confetti.create(confettiCanvas, { resize: true, useWorker: true }) : null;

const FOED_AUDIO = "./assets/audio/";
const clickSfx = new Audio(`${FOED_AUDIO}button-click.mp3`);
const breakSfx = new Audio(`${FOED_AUDIO}breakpot.mp3`);
const brokeheartSfx = new Audio(`${FOED_AUDIO}glass-breaking.mp3`);
const congratsSfx = new Audio(`${FOED_AUDIO}congrate_sound.mp3`);
const spinSfx = new Audio(`${FOED_AUDIO}spinsound.mp3`);
const winPopupSfx = new Audio(`${FOED_AUDIO}you-win-popup.mp3`);
const potWaitBoomSfx = new Audio(`${FOED_AUDIO}${encodeURIComponent("waiting to boom.mp3")}`);
const revealOtherGiftSfx = new Audio(`${FOED_AUDIO}reveal_other_gift.mp3`);

clickSfx.volume = 0.55;
breakSfx.volume = 0.78;
brokeheartSfx.volume = 0.42;
congratsSfx.volume = 0.5;
spinSfx.volume = 0.38;
winPopupSfx.volume = 0.58;
revealOtherGiftSfx.volume = 0.56;

const BG_MUSIC_NORMAL = 0.22;
const BG_MUSIC_DUCKED = 0.04;
if (bgMusic) {
  bgMusic.volume = BG_MUSIC_NORMAL;
}
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

/** Lower background music while a “main” SFX plays; extends if several fire in a row. */
function extendBackgroundDuck(durationMs) {
  if (!musicEnabled || !bgMusic || bgMusic.paused) return;
  const ms = Math.max(400, durationMs);
  const now = Date.now();
  bgMusicDuckUntil = Math.max(bgMusicDuckUntil, now + ms);
  bgMusic.volume = BG_MUSIC_DUCKED;
  if (bgMusicDuckTimer) {
    clearTimeout(bgMusicDuckTimer);
  }
  const wait = Math.max(0, bgMusicDuckUntil - now);
  bgMusicDuckTimer = setTimeout(() => {
    bgMusicDuckTimer = null;
    bgMusicDuckUntil = 0;
    if (musicEnabled && bgMusic && !bgMusic.paused) {
      bgMusic.volume = BG_MUSIC_NORMAL;
    }
  }, wait);
}

const REEL_MAX_ITEMS = 36;
const BOY_HIT_TOLERANCE = 70;
const BOY_STRIKE_CENTER_RATIO = 0.5;
const POT_SUSPENSE_MS = 2800;
const OTHER_REVEAL_MS = 5000;

function getOtherRevealMs() {
  if (typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return 1200;
  }
  return OTHER_REVEAL_MS;
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
const dragState = {
  active: false,
  pointerId: null,
  grabOffsetX: 0,
  pendingLeft: 0,
  rafId: 0
};

function openOverlay(el) { el.classList.add("show"); }
function closeOverlay(el) { el.classList.remove("show"); }
function randomInt(max) { return Math.floor(Math.random() * max); }
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

function playDuckedSfx(audio, duckMs) {
  extendBackgroundDuck(duckMs);
  playSfx(audio);
}

function stopSfx(audio) {
  try {
    audio.pause();
    audio.currentTime = 0;
  } catch (_e) {}
}

const allGameSfx = [clickSfx, breakSfx, brokeheartSfx, congratsSfx, spinSfx, winPopupSfx, potWaitBoomSfx, revealOtherGiftSfx];

function stopAllGameSfx() {
  allGameSfx.forEach(stopSfx);
  releaseBackgroundDuck();
}
function primeSfx(audio) {
  audio.play().then(() => {
    audio.pause();
    audio.currentTime = 0;
  }).catch(() => {});
}
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
function setDragHint(text) {
  if (!dragHint) return;
  dragHint.textContent = text;
}
function syncGuideTargetRings() {
  if (!guideSpotSpin || !guideSpotPots) return;
  const active = gameSteps?.querySelector(".game-step.active");
  const step = active ? Number(active.getAttribute("data-step") || "1") : 1;

  const placeRing = (el, show, target) => {
    if (!el) return;
    if (!show || !target) {
      el.hidden = true;
      el.setAttribute("aria-hidden", "true");
      return;
    }
    const r = target.getBoundingClientRect();
    if (r.width < 4 || r.height < 4) {
      el.hidden = true;
      el.setAttribute("aria-hidden", "true");
      return;
    }
    const pad = 8;
    el.hidden = false;
    el.setAttribute("aria-hidden", "true");
    el.style.left = `${Math.round(r.left - pad)}px`;
    el.style.top = `${Math.round(r.top - pad)}px`;
    el.style.width = `${Math.round(r.width + pad * 2)}px`;
    el.style.height = `${Math.round(r.height + pad * 2)}px`;
  };

  const spinEl = spinGuideTarget || drawStaffBtn;
  placeRing(guideSpotSpin, step === 2 && Boolean(spinEl), spinEl);
  placeRing(guideSpotPots, step === 3 && Boolean(potsContainer), potsContainer);
}
function setActiveStep(step) {
  if (!gameSteps) return;
  const chips = Array.from(gameSteps.querySelectorAll(".game-step"));
  const progress = Math.max(0, Math.min(1, (Number(step) - 1) / 2));
  gameSteps.style.setProperty("--guide-progress", String(progress));
  chips.forEach((chip) => {
    const n = Number(chip.getAttribute("data-step") || "0");
    const isActive = n === step;
    chip.classList.toggle("active", isActive);
    chip.classList.toggle("completed", n < step);
    if (isActive) {
      chip.setAttribute("aria-current", "step");
    } else {
      chip.removeAttribute("aria-current");
    }
  });
  const joins = gameSteps.querySelectorAll(".game-step-join");
  joins.forEach((join, i) => {
    join.classList.toggle("filled", step > i + 1);
  });
  if (gameStepHint && GAME_STEP_HINTS[step]) {
    gameStepHint.innerHTML = GAME_STEP_HINTS[step];
  }
  requestAnimationFrame(() => {
    requestAnimationFrame(syncGuideTargetRings);
  });
}
function setPotBreakPrompt(active) {
  if (potGuideBubble) {
    potGuideBubble.classList.toggle("show", active);
  }
  if (khmerBoy) {
    khmerBoy.classList.toggle("boy-ready-pots", Boolean(active));
  }
  if (potsContainer) {
    potsContainer.classList.toggle("pots-engaged", Boolean(active));
  }
  pots.forEach((pot) => {
    pot.classList.toggle("pot-attention", active && !pot.disabled);
  });
  if (active) {
    startBoyPotPatrol();
  } else {
    stopBoyPotPatrol();
  }
}
function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
function getBoyCenterX() {
  if (!khmerBoy) return 0;
  const boyRect = khmerBoy.getBoundingClientRect();
  return boyRect.left + (boyRect.width * BOY_STRIKE_CENTER_RATIO);
}
function setBoyLeftPx(leftPx) {
  if (!khmerBoy || !boyStage) return;
  const maxLeft = Math.max(0, boyStage.clientWidth - khmerBoy.offsetWidth);
  khmerBoy.style.left = `${clamp(leftPx, 0, maxLeft)}px`;
}

function getBoyLeftForPot(pot) {
  if (!khmerBoy || !boyStage || !pot) return 0;
  const stageRect = boyStage.getBoundingClientRect();
  const targetCenter = getPotCenterX(pot) - stageRect.left;
  const w = khmerBoy.offsetWidth || 0;
  const maxLeft = Math.max(0, boyStage.clientWidth - w);
  return clamp(targetCenter - (w * BOY_STRIKE_CENTER_RATIO), 0, maxLeft);
}

/** Rest pose: stick points straight up (0°). Strike tilts toward clicked pot via --stick-hit. */
const STICK_REST_DEG = 0;

/** Aim the strike animation toward the clicked pot using horizontal offset (viewport px). */
function applyStickStrikeTowardPot(targetPot) {
  if (!khmerBoy || !boyStage || !targetPot) return;
  const boyCenter = getBoyCenterX();
  const potCenter = getPotCenterX(targetPot);
  const delta = potCenter - boyCenter;
  const stageW = Math.max(1, boyStage.clientWidth);
  const aim = clamp(delta / (stageW * 0.14), -1, 1);
  const hitDeg = STICK_REST_DEG + aim * 28;
  khmerBoy.style.setProperty("--stick-rest", `${STICK_REST_DEG}deg`);
  khmerBoy.style.setProperty("--stick-hit", `${hitDeg}deg`);
}

function clearStickStrikeVars() {
  if (!khmerBoy) return;
  khmerBoy.style.removeProperty("--stick-rest");
  khmerBoy.style.removeProperty("--stick-hit");
}

const boyPatrol = {
  rafId: 0,
  active: false,
  mode: "dwell",
  dwellPotIndex: 0,
  travelFrom: 0,
  travelTo: 0,
  phaseStart: 0
};
/** Move between pots in ~0.52s; linger ~0.82s under each so players notice when to tap. */
const BOY_PATROL_TRAVEL_MS = 520;
const BOY_PATROL_DWELL_MS = 820;

function easeInOutQuad(t) {
  return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
}

function stopBoyPotPatrol() {
  boyPatrol.active = false;
  if (boyPatrol.rafId) {
    cancelAnimationFrame(boyPatrol.rafId);
    boyPatrol.rafId = 0;
  }
}

function boyPatrolTick(now) {
  if (!boyPatrol.active || !khmerBoy || !boyStage || !pots.length) {
    stopBoyPotPatrol();
    return;
  }
  if (!state.canPlayPot || !khmerBoy.classList.contains("boy-ready-pots")) {
    stopBoyPotPatrol();
    return;
  }

  const lefts = pots.map((p) => getBoyLeftForPot(p));
  if (boyPatrol.mode === "dwell") {
    const elapsed = now - boyPatrol.phaseStart;
    const i = boyPatrol.dwellPotIndex % pots.length;
    setBoyLeftPx(lefts[i]);
    if (elapsed >= BOY_PATROL_DWELL_MS) {
      const next = (i + 1) % pots.length;
      boyPatrol.mode = "travel";
      boyPatrol.phaseStart = now;
      boyPatrol.travelFrom = lefts[i];
      boyPatrol.travelTo = lefts[next];
    }
  } else {
    const elapsed = now - boyPatrol.phaseStart;
    const u = clamp(elapsed / BOY_PATROL_TRAVEL_MS, 0, 1);
    setBoyLeftPx(boyPatrol.travelFrom + (boyPatrol.travelTo - boyPatrol.travelFrom) * easeInOutQuad(u));
    if (u >= 1) {
      boyPatrol.dwellPotIndex = (boyPatrol.dwellPotIndex + 1) % pots.length;
      boyPatrol.mode = "dwell";
      boyPatrol.phaseStart = now;
      setBoyLeftPx(lefts[boyPatrol.dwellPotIndex % pots.length]);
    }
  }

  boyPatrol.rafId = window.requestAnimationFrame(boyPatrolTick);
}

function startBoyPotPatrol() {
  stopBoyPotPatrol();
  if (!khmerBoy || !boyStage || !pots.length || !state.canPlayPot) return;
  if (!khmerBoy.classList.contains("boy-ready-pots")) return;
  boyPatrol.active = true;
  boyPatrol.dwellPotIndex = 0;
  boyPatrol.mode = "dwell";
  boyPatrol.phaseStart = performance.now();
  setBoyLeftPx(getBoyLeftForPot(pots[0]));
  boyPatrol.rafId = window.requestAnimationFrame(boyPatrolTick);
}
function queueBoyLeft(leftPx) {
  dragState.pendingLeft = leftPx;
  if (dragState.rafId) return;
  dragState.rafId = window.requestAnimationFrame(() => {
    setBoyLeftPx(dragState.pendingLeft);
    dragState.rafId = 0;
  });
}
function getPotCenterX(pot) {
  const rect = pot.getBoundingClientRect();
  return rect.left + (rect.width / 2);
}
function findClosestPot() {
  if (!pots.length) return null;
  const boyCenter = getBoyCenterX();
  let nearest = pots[0];
  let distance = Math.abs(getPotCenterX(nearest) - boyCenter);
  for (let i = 1; i < pots.length; i += 1) {
    const d = Math.abs(getPotCenterX(pots[i]) - boyCenter);
    if (d < distance) {
      nearest = pots[i];
      distance = d;
    }
  }
  return nearest;
}
/** Weighted pick from gifts with quantity > 0 (by pool index order). */
function weightedPickGiftFromPool(pool, predicate) {
  const eligible = pool.filter((g) => g.quantity > 0 && predicate(g));
  const total = eligible.reduce((sum, g) => sum + g.quantity, 0);
  if (!total) return null;
  let cursor = randomInt(total);
  for (let j = 0; j < eligible.length; j += 1) {
    cursor -= eligible[j].quantity;
    if (cursor < 0) return eligible[j];
  }
  return eligible[eligible.length - 1];
}
function giftToPotAssignment(gift) {
  return {
    index: gift.index,
    id: gift.id,
    name: gift.name,
    type: gift.type,
    image: gift.image,
    price: gift.price
  };
}
function randomEmptyPotIndices(picks) {
  return picks.map((p, i) => (p === null ? i : null)).filter((i) => i !== null);
}
/**
 * Each round: always at least one medium in the five pots (if any medium exists in pool).
 * At most one expensive; ~38% chance to include an expensive when stock allows (often none).
 * Remaining slots filled by weighted random from remaining stock.
 */
function assignGiftsToPots() {
  const n = pots.length;
  const tempPool = state.giftsPool.map((gift, index) => ({ ...gift, index }));
  const picks = Array.from({ length: n }, () => null);

  const mediumGift = weightedPickGiftFromPool(tempPool, (g) => g.type === "medium");
  if (mediumGift) {
    const empties = randomEmptyPotIndices(picks);
    const slot = empties[randomInt(empties.length)];
    picks[slot] = giftToPotAssignment(mediumGift);
    mediumGift.quantity -= 1;
  }

  if (Math.random() < EXPENSIVE_POT_SLOT_CHANCE) {
    const exp = weightedPickGiftFromPool(tempPool, (g) => g.type === "expensive");
    if (exp) {
      const empties = randomEmptyPotIndices(picks);
      if (empties.length) {
        const slot = empties[randomInt(empties.length)];
        picks[slot] = giftToPotAssignment(exp);
        exp.quantity -= 1;
      }
    }
  }

  const hasExpensiveInPots = () => picks.some((p) => p && p.type === "expensive");

  for (let i = 0; i < n; i += 1) {
    if (picks[i] !== null) continue;
    const blockExpensive = hasExpensiveInPots();
    const totalQty = tempPool.reduce((sum, g) => {
      if (g.quantity <= 0) return sum;
      if (blockExpensive && g.type === "expensive") return sum;
      return sum + g.quantity;
    }, 0);
    if (!totalQty) continue;
    let cursor = randomInt(totalQty);
    for (let j = 0; j < tempPool.length; j += 1) {
      const g = tempPool[j];
      if (g.quantity <= 0) continue;
      if (blockExpensive && g.type === "expensive") continue;
      cursor -= g.quantity;
      if (cursor < 0) {
        picks[i] = giftToPotAssignment(g);
        g.quantity -= 1;
        break;
      }
    }
  }

  for (let s = picks.length - 1; s > 0; s -= 1) {
    const t = randomInt(s + 1);
    const tmp = picks[s];
    picks[s] = picks[t];
    picks[t] = tmp;
  }

  state.potAssignments = picks;
}
function clearPotGiftPreviewOnPots() {
  pots.forEach((pot) => {
    pot.classList.remove("preview-active");
    pot.classList.remove("preview-picked");
    const old = pot.querySelector(".pot-gift-on-pot");
    if (old) old.remove();
  });
}
function renderPotGiftPreviewOnPots(activePotIndex = -1, winnerName = "", options = {}) {
  const popIn = Boolean(options && options.popIn);
  const onlyWinning = Boolean(options && options.onlyWinning);
  const onlyOthers = Boolean(options && options.onlyOthers);
  const otherRevealBig = Boolean(options && options.otherRevealBig);
  clearPotGiftPreviewOnPots();
  for (let i = 0; i < pots.length; i += 1) {
    const gift = state.potAssignments[i];
    if (!gift) continue;
    if (onlyOthers) {
      if (i === activePotIndex) continue;
    } else if (onlyWinning && i !== activePotIndex) {
      continue;
    }
    const wrap = document.createElement("div");
    wrap.className = "pot-gift-on-pot";
    const img = document.createElement("img");
    img.src = gift.image || "./assets/images/twitter.png";
    img.alt = gift.name;
    wrap.appendChild(img);
    const label = document.createElement("div");
    label.className = "pot-gift-name";
    label.textContent = gift.name;
    wrap.appendChild(label);
    if (otherRevealBig) {
      wrap.classList.add("pot-gift-other-big");
      wrap.classList.add("pot-gift-other-big-pop");
    }
    if (i === activePotIndex) {
      wrap.classList.add("winning");
      if (popIn) wrap.classList.add("pot-gift-pop-in");
      const winBadge = document.createElement("div");
      winBadge.className = "pot-gift-win-badge";
      winBadge.textContent = `អបអរសាទរ ${winnerName || "អ្នកឈ្នះ"}`;
      wrap.appendChild(winBadge);
    } else if (popIn && activePotIndex >= 0 && !onlyOthers) {
      wrap.classList.add("pot-gift-reveal-soft");
      const dist = Math.abs(i - activePotIndex);
      wrap.style.setProperty("--gift-reveal-delay", String(90 + dist * 110));
    }
    pots[i].appendChild(wrap);
    pots[i].classList.add("preview-active");
    if (i === activePotIndex && !onlyOthers) {
      pots[i].classList.add("preview-picked");
    }
  }
}
function placeNextButtonUnderWinningPot() {
  if (!previewNextBtn || !kaormBlock || !state.winningPotElement) return;
  const blockRect = kaormBlock.getBoundingClientRect();
  const potRect = state.winningPotElement.getBoundingClientRect();
  const centerX = (potRect.left - blockRect.left) + (potRect.width / 2);
  previewNextBtn.style.left = `${Math.max(8, centerX - 92)}px`;
  previewNextBtn.style.right = "auto";
  previewNextBtn.style.bottom = "10px";
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
  const sourceLeft = potRect.left + (potRect.width / 2);
  const sourceTop = potRect.top + (potRect.height / 2);
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
function snapBoyToPot(pot) {
  setBoyLeftPx(getBoyLeftForPot(pot));
}
function isBoyAlignedWithPot(pot) {
  if (!pot) return false;
  const gap = Math.abs(getBoyCenterX() - getPotCenterX(pot));
  const w = pot.offsetWidth || 0;
  const tol = w > 0 ? Math.max(48, Math.min(92, w * 0.48)) : BOY_HIT_TOLERANCE;
  return gap <= tol;
}
function positionBoyToFirstPot() {
  if (!pots.length) return;
  const middleIndex = Math.floor(pots.length / 2);
  snapBoyToPot(pots[middleIndex]);
}

function updateCounts() {
  const totalGiftQty = state.giftsPool.reduce((sum, g) => sum + g.quantity, 0);
  staffCount.textContent = String(state.staffPool.length);
  giftCount.textContent = String(totalGiftQty);
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
function updateBoyProfile(staff) {
  if (!staff) {
    if (boyName) boyName.textContent = "រង់ចាំអ្នកលេង";
    if (boyStaffImage) boyStaffImage.src = "./assets/images/twitter.png";
    return;
  }
  if (boyName) boyName.textContent = staff.name;
  if (boyStaffImage) boyStaffImage.src = staff.image || "./assets/images/twitter.png";
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
  if (state.historyTicker) {
    clearInterval(state.historyTicker);
  }
  renderHistoryPage();
  state.historyTicker = window.setInterval(() => {
    if (!state.winHistory.length) return;
    state.historyCursor = (state.historyCursor + 5) % state.winHistory.length;
    renderHistoryPage();
  }, 5000);
}

function persistPools() {
  localStorage.setItem(STORAGE_KEYS.staff, JSON.stringify(state.staffPool));
  localStorage.setItem(STORAGE_KEYS.gifts, JSON.stringify(state.giftsPool));
}
function persistHistory() {
  localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(state.winHistory));
}

function loadData() {
  const savedStaff = localStorage.getItem(STORAGE_KEYS.staff);
  const savedGifts = localStorage.getItem(STORAGE_KEYS.gifts);
  const savedHistory = localStorage.getItem(STORAGE_KEYS.history);
  state.staffPool = savedStaff ? JSON.parse(savedStaff) : [...defaultStaff];
  state.giftsPool = savedGifts ? JSON.parse(savedGifts) : [...defaultGifts];
  state.winHistory = savedHistory ? JSON.parse(savedHistory) : [...defaultWinHistory];
  state.staffPool = normalizeStaff(state.staffPool);
  state.giftsPool = normalizeGifts(state.giftsPool);
  persistHistory();
  staffInput.value = JSON.stringify(state.staffPool, null, 2);
  giftInput.value = JSON.stringify(state.giftsPool, null, 2);
  updateCounts();
  startHistoryTicker();
}

function saveData() {
  let staff;
  let gifts;
  try {
    staff = JSON.parse(staffInput.value);
  } catch (_err) {
    staff = staffInput.value.split("\n").map((v) => ({ name: v.trim(), image: "./assets/images/twitter.png" })).filter((v) => v.name);
  }
  try {
    gifts = JSON.parse(giftInput.value);
  } catch (_err) {
    configMessage.textContent = "JSON រង្វាន់ មិនត្រឹមត្រូវ";
    return;
  }
  state.staffPool = normalizeStaff(staff);
  state.giftsPool = normalizeGifts(gifts);
  staffInput.value = JSON.stringify(state.staffPool, null, 2);
  giftInput.value = JSON.stringify(state.giftsPool, null, 2);
  persistPools();
  updateCounts();
  configMessage.textContent = "បានរក្សាទុករួចរាល់ (ក្នុងម៉ាស៊ីននេះ)";
}

/** Reload full staff + gifts from `data/foed-lucky-data.json` (or built-in defaults), clear history, persist. */
async function resetAllDataToFullSeed() {
  const ok = window.confirm(
    "ស្ដារបុគ្គលិក និងរង្វាន់ពេញឡើងវិញពីឯកសារដើម និងលុបប្រវត្តិអ្នកឈ្នះទាំងអស់។ បន្ត?"
  );
  if (!ok) return;
  playSfx(clickSfx);
  let staff = [...defaultStaff];
  let gifts = [...defaultGifts];
  try {
    const res = await fetch("./data/foed-lucky-data.json", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.staff) && data.staff.length) staff = data.staff;
      if (Array.isArray(data.gifts) && data.gifts.length) gifts = data.gifts;
    }
  } catch (_e) {
    /* keep defaults */
  }
  state.staffPool = normalizeStaff(staff);
  state.giftsPool = normalizeGifts(gifts);
  if (!state.staffPool.length) state.staffPool = normalizeStaff([...defaultStaff]);
  if (!state.giftsPool.length) state.giftsPool = normalizeGifts([...defaultGifts]);
  state.winHistory = [];
  state.historyCursor = 0;
  persistPools();
  persistHistory();
  if (staffInput) staffInput.value = JSON.stringify(state.staffPool, null, 2);
  if (giftInput) giftInput.value = JSON.stringify(state.giftsPool, null, 2);
  if (configMessage) {
    configMessage.textContent =
      "បានស្ដារបុគ្គលិក និងរង្វាន់ពេញ លុបប្រវត្តិ រក្សាទុកក្នុងម៉ាស៊ីនរួចរាល់។";
  }
  updateCounts();
  startHistoryTicker();
  closeOverlay(resultOverlay);
  sunburst.classList.remove("show");
  prepareNextRound();
}

function resetPots() {
  pots.forEach((pot) => {
    pot.classList.remove("drop-kaorm");
    pot.classList.remove("pot-focus");
    pot.classList.remove("pot-jiggle");
    pot.classList.remove("pot-impact");
    pot.classList.remove("pot-attention");
    pot.classList.remove("pot-suspense");
    pot.classList.remove("pot-boom-suspense");
    pot.classList.remove("pot-boom");
    pot.classList.remove("pot-misaligned");
    pot.disabled = !state.canPlayPot;
  });
}

function enablePots(enabled) {
  state.canPlayPot = enabled;
  pots.forEach((pot) => {
    pot.disabled = !enabled;
    if (!enabled) {
      pot.classList.remove("pot-attention");
    }
  });
}

async function spinStaffReel() {
  if (state.spinning) return;
  if (!state.staffPool.length) { configMessage.textContent = "គ្មានបុគ្គលិកនៅសល់"; openOverlay(settingsOverlay); return; }
  if (!state.giftsPool.length) { configMessage.textContent = "គ្មានរង្វាន់នៅសល់"; openOverlay(settingsOverlay); return; }

  playSfx(clickSfx);
  state.spinning = true;
  setActiveStep(2);
  setPotBreakPrompt(false);
  drawStaffBtn.disabled = true;
  enablePots(false);
  closeOverlay(resultOverlay);
  sunburst.classList.remove("show");
  staffReel.style.transform = "translateY(0)";

  let reelNames = shuffleList(state.staffPool);
  while (reelNames.length && reelNames.length < REEL_MAX_ITEMS) {
    reelNames = reelNames.concat(shuffleList(state.staffPool));
  }
  reelNames = reelNames.slice(0, REEL_MAX_ITEMS);
  state.currentStaff = reelNames[reelNames.length - 1];

  const spinAnimMs = reelNames.length * 62 + 500;
  playDuckedSfx(spinSfx, spinAnimMs);
  if (khmerBoy) {
    khmerBoy.classList.add("boy-spinning");
  }

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
    if (khmerBoy) {
      khmerBoy.classList.remove("boy-spinning");
    }
  }
  reelAnimation.cancel();
  staffReel.innerHTML = `<div>${state.currentStaff.name}</div>`;
  currentStaff.textContent = state.currentStaff.name;
  updateBoyProfile(state.currentStaff);
  spinSfx.pause();
  spinSfx.currentTime = 0;
  assignGiftsToPots();
  clearPotGiftPreviewOnPots();
  enablePots(true);
  setActiveStep(3);
  setDragHint(`ឈ្មោះចេញហើយ: ${state.currentStaff.name}។ រង់ចាំឲ្យក្មេងប្រុសដើរក្រោមក្អម រួចចុចក្អមដែលចង់វាយ។`);
  setPotBreakPrompt(true);
  state.spinning = false;
}

function pickGift() {
  const total = state.giftsPool.reduce((sum, g) => sum + g.quantity, 0);
  if (!total) return null;
  let cursor = randomInt(total);
  for (let i = 0; i < state.giftsPool.length; i += 1) {
    cursor -= state.giftsPool[i].quantity;
    if (cursor < 0) return { gift: state.giftsPool[i], index: i };
  }
  return null;
}

function celebrate() {
  if (sunburst) sunburst.classList.add("show");
  playDuckedSfx(congratsSfx, 10000);
  if (!confettiFx) return;
  confettiFx({ particleCount: 14, spread: 58, origin: { y: 0.65 } });
}

async function completeRound(giftInfo) {
  const staffIndex = state.staffPool.findIndex((staff) => staff.name === state.currentStaff.name);

  if (staffIndex !== -1) state.staffPool.splice(staffIndex, 1);

  state.giftsPool[giftInfo.index].quantity -= 1;
  if (state.giftsPool[giftInfo.index].quantity <= 0) state.giftsPool.splice(giftInfo.index, 1);

  persistPools();
  updateCounts();

  const giftPrice = giftInfo.gift.price;
  const giftLabel = giftPrice != null && Number.isFinite(giftPrice)
    ? `${giftInfo.gift.name} `
    : `${giftInfo.gift.name}`;

  winnerStaff.textContent = state.currentStaff?.name || "-";
  winnerStaffImage.src = state.currentStaff?.image || "./assets/images/twitter.png";
  winnerStaffImage.style.display = "block";
  winnerGift.textContent = giftLabel;
  winnerGiftImage.src = giftInfo.gift.image || "./assets/images/twitter.png";
  winnerGiftImage.style.display = "block";
  resultMessage.textContent = "អបអរសាទរ! បានទទួលរង្វាន់";
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
  setDragHint(`អបអរសាទរ ${state.currentStaff?.name || ""}! រង្វាន់: ${giftInfo.gift.name}`);
  if (previewNextBtn) {
    previewNextBtn.textContent = "ចាប់ផ្តើមជុំបន្ទាប់";
    previewNextBtn.classList.add("show");
    placeNextButtonUnderWinningPot();
  }
}

async function onPotClick(target) {
  if (!state.currentStaff || !state.canPlayPot) return;
  if (!isBoyAlignedWithPot(target)) {
    playSfx(clickSfx);
    target.classList.remove("pot-misaligned");
    void target.offsetWidth;
    target.classList.add("pot-misaligned");
    setDragHint("រង់ចាំឲ្យក្មេងប្រុសនៅក្រោមក្អមនេះ រួចចុចម្តងទៀត។");
    return;
  }

  setPotBreakPrompt(false);
  enablePots(false);

  const potIndex = Number(target.dataset.pot || "0") - 1;
  const assignedGift = state.potAssignments[potIndex];
  state.winningPotElement = target;

  if (kaormBlock) {
    kaormBlock.classList.remove("hit-flash");
    void kaormBlock.offsetWidth;
    kaormBlock.classList.add("hit-flash");
  }

  pots.forEach((pot) => {
    pot.classList.remove("pot-jiggle");
  });

  target.classList.remove("pot-jiggle", "pot-boom", "pot-impact", "pot-misaligned", "pot-boom-suspense", "pot-suspense");
  void target.offsetWidth;
  target.classList.add("pot-focus");

  const hasOtherGifts = pots.some((_, i) => i !== potIndex && state.potAssignments[i]);
  if (hasOtherGifts) {
    const otherRevealMs = getOtherRevealMs();
    playDuckedSfx(revealOtherGiftSfx, otherRevealMs + 500);
    renderPotGiftPreviewOnPots(potIndex, "", { onlyOthers: true, otherRevealBig: true });
    await new Promise((resolve) => window.setTimeout(resolve, otherRevealMs));
    stopSfx(revealOtherGiftSfx);
    clearPotGiftPreviewOnPots();
  }

  target.classList.remove("pot-suspense", "pot-boom", "pot-boom-suspense");
  void target.offsetWidth;
  target.classList.add("pot-suspense");

  if (khmerBoy) {
    applyStickStrikeTowardPot(target);
    khmerBoy.classList.remove("strike");
    void khmerBoy.offsetWidth;
    khmerBoy.classList.add("strike");
  }

  const suspenseMs = getPotSuspenseMs();
  playDuckedSfx(potWaitBoomSfx, suspenseMs + 800);
  await waitForPotSuspense(target);
  stopSfx(potWaitBoomSfx);

  target.classList.remove("pot-suspense");
  void target.offsetWidth;
  target.classList.add("pot-boom-suspense");
  playDuckedSfx(breakSfx, 4200);

  if (!assignedGift) {
    await waitForPotBoomSuspense(target);
    playDuckedSfx(brokeheartSfx, 3800);
    resultMessage.textContent = "រង្វាន់អស់ហើយ";
    openOverlay(resultOverlay);
    return;
  }

  const giftInfo = {
    index: assignedGift.index,
    gift: {
      name: assignedGift.name,
      type: assignedGift.type,
      image: assignedGift.image,
      id: assignedGift.id,
      price: assignedGift.price
    }
  };

  window.setTimeout(() => {
    renderPotGiftPreviewOnPots(potIndex, state.currentStaff?.name || "", { popIn: true, onlyWinning: false });
  }, 320);

  await waitForPotBoomSuspense(target);
  await animateWinPopupToPot(giftInfo, target);
  renderPotGiftPreviewOnPots(potIndex, state.currentStaff?.name || "", { onlyWinning: false });
  await completeRound(giftInfo);
}

function prepareNextRound() {
  stopSfx(winPopupSfx);
  stopSfx(congratsSfx);
  releaseBackgroundDuck();
  if (khmerBoy) {
    khmerBoy.classList.remove("boy-spinning", "strike");
    clearStickStrikeVars();
  }
  closeOverlay(resultOverlay);
  sunburst.classList.remove("show");
  state.currentStaff = null;
  currentStaff.textContent = "មិនទាន់មាន";
  staffReel.innerHTML = "<div>រង់ចាំចាប់ឈ្មោះ...</div>";
  updateBoyProfile(null);
  drawStaffBtn.disabled = false;
  enablePots(false);
  resetPots();
  state.potAssignments = [];
  state.winningPotElement = null;
  if (previewNextBtn) {
    previewNextBtn.classList.remove("show");
    previewNextBtn.textContent = "បន្ទាប់";
    previewNextBtn.style.left = "";
    previewNextBtn.style.right = "14px";
    previewNextBtn.style.bottom = "8px";
  }
  clearPotGiftPreviewOnPots();
  positionBoyToFirstPot();
  setActiveStep(2);
  setPotBreakPrompt(false);
  setDragHint("ចុច ចាប់ឈ្មោះបុគ្គលិក នៅកណ្ដាល ដើម្បីចាប់ឈ្មោះ");
  if (!state.staffPool.length || !state.giftsPool.length) {
    drawStaffBtn.disabled = true;
    resultMessage.textContent = "ហ្គេមបញ្ចប់: មិនមានបុគ្គលិក ឬ រង្វាន់នៅសល់";
    openOverlay(resultOverlay);
  }
}

saveDataBtn.addEventListener("click", () => {
  playSfx(clickSfx);
  saveData();
});
if (resetFullDataBtn) {
  resetFullDataBtn.addEventListener("click", () => {
    void resetAllDataToFullSeed();
  });
}
settingsBtn.addEventListener("click", () => {
  playSfx(clickSfx);
  openOverlay(settingsOverlay);
});
closeSettingsBtn.addEventListener("click", () => {
  playSfx(clickSfx);
  closeOverlay(settingsOverlay);
});
startBtn.addEventListener("click", () => {
  unlockAllSfx();
  playSfx(clickSfx);
  closeOverlay(settingsOverlay);
  startBackgroundMusic();
});
drawStaffBtn.addEventListener("click", spinStaffReel);
nextRoundBtn.addEventListener("click", () => {
  playSfx(clickSfx);
  prepareNextRound();
});
if (previewNextBtn) {
  previewNextBtn.addEventListener("click", () => {
    playSfx(clickSfx);
    prepareNextRound();
  });
}
musicToggleBtn.addEventListener("click", () => {
  musicEnabled = !musicEnabled;
  if (musicEnabled) {
    startBackgroundMusic();
  } else {
    stopBackgroundMusic();
    stopAllGameSfx();
  }
  updateMusicBtn();
});
potsContainer.addEventListener("click", (event) => {
  const target = event.target;
  if (target instanceof HTMLButtonElement && target.classList.contains("pot")) {
    void onPotClick(target);
  }
});

(function boot() {
  loadData();
  openOverlay(settingsOverlay);
  prepareNextRound();
  setActiveStep(1);
  updateMusicBtn();
})();
window.addEventListener("resize", () => {
  positionBoyToFirstPot();
  if (khmerBoy && khmerBoy.classList.contains("boy-ready-pots") && state.canPlayPot) {
    stopBoyPotPatrol();
    startBoyPotPatrol();
  }
  syncGuideTargetRings();
});
window.addEventListener("click", startBackgroundMusic, { once: true });
