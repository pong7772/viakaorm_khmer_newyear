const defaultStaff = [
  { name: "លោក សុខ វណ្ណា", image: "./assets/images/twitter.png" },
  { name: "កញ្ញា ចាន់ ដាវី", image: "./assets/images/twitter.png" },
  { name: "លោក ជា ដារ៉ា", image: "./assets/images/twitter.png" }
];
const defaultGifts = [
  { name: "ទឹក Freshy ១កំប៉ុង", type: "cheap", image: "../../vaikaorm/images/gift/freshy.png", quantity: 2 },
  { name: "ត្រីខ ១កំប៉ុង", type: "medium", image: "../../vaikaorm/images/gift/canfish.png", quantity: 2 },
  { name: "Amazon ១កែវ", type: "expensive", image: "../../vaikaorm/images/gift/amazon.png", quantity: 1 }
];

const state = { staffPool: [], giftsPool: [], currentStaff: null, canPlayPot: false, spinning: false, winHistory: [], historyCursor: 0, historyTicker: null };

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
function setupBoyDrag() {
  if (!khmerBoy || !kaormBlock) return;

  khmerBoy.addEventListener("pointerdown", (event) => {
    dragState.active = true;
    dragState.pointerId = event.pointerId;
    const boyRect = khmerBoy.getBoundingClientRect();
    dragState.grabOffsetX = event.clientX - boyRect.left;
    khmerBoy.classList.add("dragging");
    khmerBoy.setPointerCapture(event.pointerId);
    setDragHint("អូសក្មេងប្រុសទៅក្រោមក្អមដែលអ្នកចង់វៃ");
  });

  khmerBoy.addEventListener("pointermove", (event) => {
    if (!dragState.active || event.pointerId !== dragState.pointerId || !kaormBlock) return;
    const blockRect = kaormBlock.getBoundingClientRect();
    queueBoyLeft(event.clientX - blockRect.left - dragState.grabOffsetX);
  });

  const onPointerRelease = (event) => {
    if (!dragState.active || event.pointerId !== dragState.pointerId) return;
    dragState.active = false;
    dragState.pointerId = null;
    if (dragState.rafId) {
      window.cancelAnimationFrame(dragState.rafId);
      dragState.rafId = 0;
    }
    khmerBoy.classList.remove("dragging");
    const nearestPot = findClosestPot();
    if (nearestPot) {
      snapBoyToPot(nearestPot);
    }
    setDragHint("ចុចក្អមដែលនៅលើក្បាលក្មេងប្រុស ដើម្បីវៃយករង្វាន់");
  };

  khmerBoy.addEventListener("pointerup", onPointerRelease);
  khmerBoy.addEventListener("pointercancel", onPointerRelease);
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
  }, 4000);
}

function persistPools() {
  localStorage.setItem("foed_staff_pool", JSON.stringify(state.staffPool));
  localStorage.setItem("foed_gifts_pool", JSON.stringify(state.giftsPool));
}

function loadData() {
  const savedStaff = localStorage.getItem("foed_staff_pool");
  const savedGifts = localStorage.getItem("foed_gifts_pool");
  const savedHistory = localStorage.getItem("foed_win_history");
  state.staffPool = savedStaff ? JSON.parse(savedStaff) : [...defaultStaff];
  state.giftsPool = savedGifts ? JSON.parse(savedGifts) : [...defaultGifts];
  state.winHistory = savedHistory ? JSON.parse(savedHistory) : [];
  state.staffPool = normalizeStaff(state.staffPool);
  state.giftsPool = normalizeGifts(state.giftsPool);
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
    pot.disabled = !state.canPlayPot;
  });
}

function enablePots(enabled) {
  state.canPlayPot = enabled;
  pots.forEach((pot) => { pot.disabled = !enabled; });
}

async function spinStaffReel() {
  if (state.spinning) return;
  if (!state.staffPool.length) { configMessage.textContent = "គ្មានបុគ្គលិកនៅសល់"; openOverlay(settingsOverlay); return; }
  if (!state.giftsPool.length) { configMessage.textContent = "គ្មានរង្វាន់នៅសល់"; openOverlay(settingsOverlay); return; }

  state.spinning = true;
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
      duration: reelNames.length * 85,
      easing: "cubic-bezier(0.2, 0.8, 0.15, 1)",
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
  enablePots(true);
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
  window.setTimeout(speakKhmerCongrats, 800);
  if (!confettiFx) return;
  confettiFx({ particleCount: 70, spread: 82, origin: { y: 0.65 } });
}

function completeRound(giftInfo) {
  const staffIndex = state.staffPool.findIndex((staff) => staff.name === state.currentStaff.name);
  if (staffIndex !== -1) state.staffPool.splice(staffIndex, 1);

  state.giftsPool[giftInfo.index].quantity -= 1;
  if (state.giftsPool[giftInfo.index].quantity <= 0) state.giftsPool.splice(giftInfo.index, 1);

  persistPools();
  updateCounts();

  winnerStaff.textContent = state.currentStaff?.name || "-";
  if (state.currentStaff?.image) {
    winnerStaffImage.src = state.currentStaff.image;
    winnerStaffImage.style.display = "inline-block";
  } else {
    winnerStaffImage.src = "./assets/images/twitter.png";
    winnerStaffImage.style.display = "inline-block";
  }
  winnerGift.textContent = `${giftInfo.gift.name} (${giftInfo.gift.type})`;
  if (giftInfo.gift.image) {
    winnerGiftImage.src = giftInfo.gift.image;
    winnerGiftImage.style.display = "block";
  } else {
    winnerGiftImage.style.display = "none";
  }
  resultMessage.textContent = "អបអរសាទរ! បានទទួលរង្វាន់";
  state.winHistory.unshift({
    staff: state.currentStaff?.name || "-",
    gift: `${giftInfo.gift.name} (${giftInfo.gift.type})`
  });
  state.winHistory = state.winHistory.slice(0, 120);
  state.historyCursor = 0;
  localStorage.setItem("foed_win_history", JSON.stringify(state.winHistory));
  renderHistoryPage();
  celebrate();
  openOverlay(resultOverlay);
}

function onPotClick(target) {
  if (!state.currentStaff || !state.canPlayPot) return;
  if (!isBoyAlignedWithPot(target)) {
    playSfx(clickSfx);
    playSfx(brokeheartSfx);
    setDragHint("សូមអូសក្មេងប្រុសអោយចំក្រោមក្អមនេះសិន");
    return;
  }

  snapBoyToPot(target);
  if (khmerBoy) {
    khmerBoy.classList.remove("strike");
    void khmerBoy.offsetWidth;
    khmerBoy.classList.add("strike");
  }
  target.classList.add("drop-kaorm");
  playSfx(breakSfx);
  enablePots(false);
  const giftInfo = pickGift();
  if (!giftInfo) {
    playSfx(brokeheartSfx);
    resultMessage.textContent = "រង្វាន់អស់ហើយ";
    openOverlay(resultOverlay);
    return;
  }
  setTimeout(() => completeRound(giftInfo), 450);
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
  positionBoyToFirstPot();
  setDragHint("អូសក្មេងប្រុសទៅក្រោមក្អម ហើយចុចក្អមនោះដើម្បីវៃ");
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
updateMusicBtn();
setupBoyDrag();
window.addEventListener("resize", positionBoyToFirstPot);
window.addEventListener("click", startBackgroundMusic, { once: true });
