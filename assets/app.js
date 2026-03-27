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
  { name: "ទឹក Freshy ១កំប៉ុង", type: "cheap", image: "../../vaikaorm/images/gift/freshy.png", quantity: 2 },
  { name: "ត្រីខ ១កំប៉ុង", type: "medium", image: "../../vaikaorm/images/gift/canfish.png", quantity: 2 },
  { name: "Amazon ១កែវ", type: "expensive", image: "../../vaikaorm/images/gift/amazon.png", quantity: 1 },
  { name: "Coca ១កំប៉ុង", type: "cheap", image: "../../vaikaorm/images/gift/coca.png", quantity: 5 },
  { name: "ក្រមា ១", type: "medium", image: "../../vaikaorm/images/gift/kroma.png", quantity: 3 },
  { name: "Tiger ១កំប៉ុង", type: "expensive", image: "../../vaikaorm/images/gift/tigerBeer.png", quantity: 2 }
];
const defaultWinHistory = [
  { staff: "លោក សុខ វណ្ណា", gift: "Coca ១កំប៉ុង (cheap)" },
  { staff: "កញ្ញា ចាន់ ដាវី", gift: "ក្រមា ១ (medium)" },
  { staff: "លោក ជា ដារ៉ា", gift: "Amazon ១កែវ (expensive)" },
  { staff: "លោក គង់ វិសាល", gift: "ទឹក Freshy ១កំប៉ុង (cheap)" },
  { staff: "កញ្ញា ពេជ្រ រស្មី", gift: "Tiger ១កំប៉ុង (expensive)" }
];
const STORAGE_KEYS = {
  staff: "foed_staff_pool",
  gifts: "foed_gifts_pool",
  history: "foed_win_history"
};

const state = { staffPool: [], giftsPool: [], currentStaff: null, canPlayPot: false, spinning: false, winHistory: [], historyCursor: 0, historyTicker: null, potAssignments: [], winningPotElement: null };

const $ = (id) => document.getElementById(id);
const staffInput = $("staffInput");
const giftInput = $("giftInput");
const saveDataBtn = $("saveDataBtn");
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
const dragHint = $("dragHint");
const gameSteps = $("gameSteps");
const potGuideBubble = $("potGuideBubble");

const confettiFx = window.confetti ? window.confetti.create(confettiCanvas, { resize: true, useWorker: true }) : null;
const clickSfx = new Audio("./audio/button-click.mp3");
const breakSfx = new Audio("./audio/glass-breaking.mp3");
const brokeheartSfx = new Audio("./audio/brokeheart.mp3");
const congratsSfx = new Audio("./audio/ss.mp3");
const spinSfx = new Audio("./audio/ToyToy.mp3");
spinSfx.volume = 0.2;
congratsSfx.volume = 0.42;
brokeheartSfx.volume = 0.45;
breakSfx.volume = 0.75;
clickSfx.volume = 0.5;
if (bgMusic) {
  bgMusic.volume = 0.22;
}
let musicEnabled = true;
const REEL_MAX_ITEMS = 36;
const BOY_HIT_TOLERANCE = 70;
const BOY_STRIKE_CENTER_RATIO = 0.52;
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
function speakKhmerCongrats() {
  if (!musicEnabled || !("speechSynthesis" in window)) return;
  const synth = window.speechSynthesis;
  const utterance = new SpeechSynthesisUtterance("អបអរសាទរ!");
  utterance.lang = "km-KH";
  utterance.rate = 0.95;
  utterance.pitch = 1.02;

  const voices = synth.getVoices();
  const preferredVoice = voices.find((voice) => voice.lang.toLowerCase().startsWith("km"))
    || voices.find((voice) => voice.lang.toLowerCase().startsWith("en"));
  if (preferredVoice) {
    utterance.voice = preferredVoice;
  }

  synth.cancel();
  synth.speak(utterance);
}
function primeSfx(audio) {
  audio.play().then(() => {
    audio.pause();
    audio.currentTime = 0;
  }).catch(() => {});
}
function unlockAllSfx() {
  [clickSfx, breakSfx, brokeheartSfx, congratsSfx, spinSfx].forEach(primeSfx);
}
function startBackgroundMusic() {
  if (!bgMusic || !musicEnabled) return;
  bgMusic.play().catch(() => {});
}
function stopBackgroundMusic() {
  if (!bgMusic) return;
  bgMusic.pause();
}
function updateMusicBtn() {
  if (!musicToggleBtn) return;
  musicToggleBtn.textContent = `តន្ត្រី: ${musicEnabled ? "បើក" : "បិទ"}`;
}
function setDragHint(text) {
  if (!dragHint) return;
  dragHint.textContent = text;
}
function setActiveStep(step) {
  if (!gameSteps) return;
  const chips = Array.from(gameSteps.querySelectorAll(".game-step"));
  chips.forEach((chip) => {
    const current = Number(chip.getAttribute("data-step") || "0");
    chip.classList.toggle("active", current === step);
  });
}
function setPotBreakPrompt(active) {
  if (potGuideBubble) {
    potGuideBubble.classList.toggle("show", active);
  }
  pots.forEach((pot) => {
    pot.classList.toggle("pot-attention", active && !pot.disabled);
  });
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
  if (!khmerBoy || !kaormBlock) return;
  const maxLeft = Math.max(0, kaormBlock.clientWidth - khmerBoy.offsetWidth);
  khmerBoy.style.left = `${clamp(leftPx, 0, maxLeft)}px`;
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
function assignGiftsToPots() {
  const tempPool = state.giftsPool.map((gift, index) => ({ ...gift, index }));
  const picks = [];
  for (let i = 0; i < pots.length; i += 1) {
    const totalQty = tempPool.reduce((sum, gift) => sum + gift.quantity, 0);
    if (!totalQty) {
      picks.push(null);
      continue;
    }
    let cursor = randomInt(totalQty);
    let picked = null;
    for (let j = 0; j < tempPool.length; j += 1) {
      cursor -= tempPool[j].quantity;
      if (cursor < 0) {
        picked = tempPool[j];
        tempPool[j].quantity -= 1;
        break;
      }
    }
    picks.push(picked ? {
      index: picked.index,
      name: picked.name,
      type: picked.type,
      image: picked.image
    } : null);
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
function renderPotGiftPreviewOnPots(activePotIndex = -1, winnerName = "") {
  clearPotGiftPreviewOnPots();
  for (let i = 0; i < pots.length; i += 1) {
    const gift = state.potAssignments[i];
    if (!gift) continue;
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
    if (i === activePotIndex) {
      wrap.classList.add("winning");
      const winBadge = document.createElement("div");
      winBadge.className = "pot-gift-win-badge";
      winBadge.textContent = `អបអរសាទរ ${winnerName || "អ្នកឈ្នះ"}`;
      wrap.appendChild(winBadge);
    }
    pots[i].appendChild(wrap);
    pots[i].classList.add("preview-active");
    if (i === activePotIndex) {
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
  const potRect = targetPot.getBoundingClientRect();
  const sourceLeft = potRect.left + (potRect.width / 2);
  const sourceTop = potRect.top + (potRect.height / 2);
  winFlyPopup.style.left = `${sourceLeft}px`;
  winFlyPopup.style.top = `${sourceTop}px`;
  winFlyPopup.style.transform = "translate3d(-50%, -50%, 0) scale(0.2)";

  const boomReveal = winFlyPopup.animate(
    [
      { left: `${sourceLeft}px`, top: `${sourceTop}px`, transform: "translate3d(-50%, -50%, 0) scale(0.2)", opacity: 0.3 },
      { left: `${sourceLeft}px`, top: `${sourceTop}px`, transform: "translate3d(-50%, -50%, 0) scale(1.18)", opacity: 1 },
      { left: `${sourceLeft}px`, top: `${sourceTop}px`, transform: "translate3d(-50%, -50%, 0) scale(0.95)", opacity: 1 }
    ],
    { duration: 420, easing: "cubic-bezier(0.18, 0.86, 0.25, 1)", fill: "forwards" }
  );
  await boomReveal.finished;

  const centerReveal = winFlyPopup.animate(
    [
      { left: `${sourceLeft}px`, top: `${sourceTop}px`, transform: "translate3d(-50%, -50%, 0) scale(0.95)", opacity: 1 },
      { left: "50%", top: "50%", transform: "translate3d(-50%, -50%, 0) scale(1.05)", opacity: 1 }
    ],
    { duration: 360, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)", fill: "forwards" }
  );
  await centerReveal.finished;
  await new Promise((resolve) => window.setTimeout(resolve, 1200));

  winFlyPopup.classList.remove("surprise");
  winFlyPopup.classList.remove("show");
}
function snapBoyToPot(pot) {
  if (!khmerBoy || !kaormBlock || !pot) return;
  const blockRect = kaormBlock.getBoundingClientRect();
  const targetCenter = getPotCenterX(pot) - blockRect.left;
  const newLeft = targetCenter - (khmerBoy.offsetWidth * BOY_STRIKE_CENTER_RATIO);
  setBoyLeftPx(newLeft);
}
function isBoyAlignedWithPot(pot) {
  const gap = Math.abs(getBoyCenterX() - getPotCenterX(pot));
  return gap <= BOY_HIT_TOLERANCE;
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
      return {
        name: String(staff.name || "").trim(),
        image: String(staff.image || "./assets/images/twitter.png").trim()
      };
    })
    .filter((staff) => staff.name);
}
function normalizeGifts(rawGifts) {
  return rawGifts
    .map((g) => ({
      name: String(g.name || "").trim(),
      type: String(g.type || "medium").trim().toLowerCase(),
      image: String(g.image || "").trim(),
      quantity: Number(g.quantity || 0)
    }))
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
  // Ensure dummy history is persisted on first run and always synced in localStorage.
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
  configMessage.textContent = "បានរក្សាទុករួចរាល់";
}

function resetPots() {
  pots.forEach((pot) => {
    pot.classList.remove("drop-kaorm");
    pot.classList.remove("pot-focus");
    pot.classList.remove("pot-jiggle");
    pot.classList.remove("pot-impact");
    pot.classList.remove("pot-attention");
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

  state.spinning = true;
  setActiveStep(2);
  setPotBreakPrompt(false);
  drawStaffBtn.disabled = true;
  enablePots(false);
  closeOverlay(resultOverlay);
  sunburst.classList.remove("show");
  playSfx(spinSfx);
  staffReel.style.transform = "translateY(0)";

  let reelNames = shuffleList(state.staffPool);
  while (reelNames.length && reelNames.length < REEL_MAX_ITEMS) {
    reelNames = reelNames.concat(shuffleList(state.staffPool));
  }
  reelNames = reelNames.slice(0, REEL_MAX_ITEMS);
  state.currentStaff = reelNames[reelNames.length - 1];

  const fragment = document.createDocumentFragment();
  reelNames.forEach((staff) => {
    const row = document.createElement("div");
    row.textContent = staff.name;
    fragment.appendChild(row);
  });

  staffReel.innerHTML = "";
  staffReel.appendChild(fragment);

  const firstRow = staffReel.firstElementChild;
  const rowHeight = firstRow instanceof HTMLElement ? firstRow.offsetHeight || 96 : 96;
  const travelY = (reelNames.length - 1) * rowHeight;
  const reelAnimation = staffReel.animate(
    [
      { transform: "translateY(0)", filter: "blur(0px)" },
      { filter: "blur(1px)", offset: 0.55 },
      { transform: `translateY(-${travelY}px)`, filter: "blur(0px)" }
    ],
    {
      duration: reelNames.length * 62,
      easing: "linear",
      iterations: 1,
      fill: "forwards"
    }
  );

  await reelAnimation.finished;
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
  setDragHint(`ឈ្មោះចេញហើយ: ${state.currentStaff.name}។ សូមចុចក្អមមួយ ដើម្បីវាយ`);
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
  sunburst.classList.add("show");
  playSfx(congratsSfx);
  window.setTimeout(speakKhmerCongrats, 520);
  if (!confettiFx) return;
  confettiFx({ particleCount: 24, spread: 65, origin: { y: 0.65 } });
}

function completeRound(giftInfo) {
  const staffIndex = state.staffPool.findIndex((staff) => staff.name === state.currentStaff.name);
  if (staffIndex !== -1) state.staffPool.splice(staffIndex, 1);

  state.giftsPool[giftInfo.index].quantity -= 1;
  if (state.giftsPool[giftInfo.index].quantity <= 0) state.giftsPool.splice(giftInfo.index, 1);

  persistPools();
  updateCounts();

  winnerStaff.textContent = state.currentStaff?.name || "-";
  winnerStaffImage.src = state.currentStaff?.image || "./assets/images/twitter.png";
  winnerStaffImage.style.display = "block";
  winnerGift.textContent = `${giftInfo.gift.name} (${giftInfo.gift.type})`;
  winnerGiftImage.src = giftInfo.gift.image || "./assets/images/twitter.png";
  winnerGiftImage.style.display = "block";
  resultMessage.textContent = "អបអរសាទរ! បានទទួលរង្វាន់";
  state.winHistory.unshift({
    staff: state.currentStaff?.name || "-",
    gift: `${giftInfo.gift.name} (${giftInfo.gift.type})`
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

function onPotClick(target) {
  if (!state.currentStaff || !state.canPlayPot) return;
  setPotBreakPrompt(false);
  snapBoyToPot(target);
  target.classList.add("pot-focus");
  target.classList.add("pot-jiggle");
  if (kaormBlock) {
    kaormBlock.classList.remove("hit-flash");
    void kaormBlock.offsetWidth;
    kaormBlock.classList.add("hit-flash");
  }
  pots.forEach((pot) => {
    if (pot !== target) {
      pot.classList.remove("pot-jiggle");
      void pot.offsetWidth;
      pot.classList.add("pot-jiggle");
    }
  });
  const potIndex = Number(target.dataset.pot || "0") - 1;
  const assignedGift = state.potAssignments[potIndex];
  state.winningPotElement = target;
  renderPotGiftPreviewOnPots(potIndex, state.currentStaff?.name || "");
  if (khmerBoy) {
    khmerBoy.classList.remove("strike");
    void khmerBoy.offsetWidth;
    khmerBoy.classList.add("strike");
  }
  target.classList.remove("pot-jiggle");
  target.classList.remove("pot-boom");
  void target.offsetWidth;
  target.classList.add("pot-boom");
  target.classList.add("pot-impact");
  playSfx(breakSfx);
  enablePots(false);
  if (!assignedGift) {
    playSfx(brokeheartSfx);
    resultMessage.textContent = "រង្វាន់អស់ហើយ";
    openOverlay(resultOverlay);
    return;
  }
  const giftInfo = {
    index: assignedGift.index,
    gift: {
      name: assignedGift.name,
      type: assignedGift.type,
      image: assignedGift.image
    }
  };
  window.setTimeout(async () => {
    await animateWinPopupToPot(giftInfo, target);
    renderPotGiftPreviewOnPots(potIndex, state.currentStaff?.name || "");
    completeRound(giftInfo);
  }, 120);
}

function prepareNextRound() {
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
  setDragHint("ចុចក្អមណាមួយ ដើម្បីឲក្មេងប្រុសវៃដោយស្វ័យប្រវត្តិ");
  if (!state.staffPool.length || !state.giftsPool.length) {
    drawStaffBtn.disabled = true;
    resultMessage.textContent = "ហ្គេមបញ្ចប់: មិនមានបុគ្គលិក ឬ រង្វាន់នៅសល់";
    openOverlay(resultOverlay);
  }
}

saveDataBtn.addEventListener("click", saveData);
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
  }
  updateMusicBtn();
});
potsContainer.addEventListener("click", (event) => {
  const target = event.target;
  if (target instanceof HTMLButtonElement && target.classList.contains("pot")) onPotClick(target);
});

loadData();
openOverlay(settingsOverlay);
prepareNextRound();
setActiveStep(1);
updateMusicBtn();
window.addEventListener("resize", positionBoyToFirstPot);
window.addEventListener("click", startBackgroundMusic, { once: true });
