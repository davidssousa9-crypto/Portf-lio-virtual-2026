export const PPE_CONFIG = {
  storageKey: "agrvai-ppe-game-v1",
  schedule: {
    days: [
      { id: "monday", label: "SEGUNDA", short: "SEG", jsDay: 1 },
      { id: "tuesday", label: "TERÇA", short: "TER", jsDay: 2 },
      { id: "wednesday", label: "QUARTA", short: "QUA", jsDay: 3 },
      { id: "thursday", label: "QUINTA", short: "QUI", jsDay: 4 },
      { id: "friday", label: "SEXTA", short: "SEX", jsDay: 5 }
    ],
    slots: [
      {
        id: "morning",
        label: "8H ÀS 10H",
        startMinute: 480,
        endMinute: 600,
        activities: [
          { label: "ATIVIDADES", type: "activities" },
          { label: "ATIVIDADES", type: "activities" },
          { label: "ATIVIDADES", type: "activities" },
          { label: "ATIVIDADES", type: "activities" },
          { label: "ATIVIDADES", type: "activities" }
        ]
      },
      {
        id: "afternoon",
        label: "13:20H ÀS 18:20",
        startMinute: 800,
        endMinute: 1100,
        activities: [
          { label: "SESI/SENAI", type: "training" },
          { label: "SENAI/SESI", type: "training" },
          { label: "SESI/SENAI", type: "training" },
          { label: "SESI/SENAI", type: "training" },
          { label: "SENAI", type: "training" }
        ]
      },
      {
        id: "evening",
        label: "19:00 ÀS 22:00",
        startMinute: 1140,
        endMinute: 1320,
        activities: [
          { label: "ESTUDOS", type: "study" },
          { label: "CONTRATURNO", type: "contraturno" },
          { label: "CONTRATURNO", type: "contraturno" },
          { label: "CONTRATURNO", type: "contraturno" },
          { label: "REVISÃO", type: "review", boss: true }
        ]
      }
    ]
  },
  weeklyBoss: {
    dayId: "friday",
    activityType: "review",
    label: "WEEKLY BOSS"
  },
  editablePlaceholders: {
    // Gameplay values are examples and can be edited without changing the schedule.
    timerMinutes: 25,
    maxEnergy: 100,
    energyCostPerBlock: 18,
    levelBaseXP: 100,
    levelStepXP: 50,
    xpByType: {
      activities: 10,
      training: 15,
      study: 20,
      contraturno: 15,
      review: 25
    },
    statNames: {
      focus: "FOCUS",
      knowledge: "KNOWLEDGE",
      discipline: "DISCIPLINE"
    },
    statGainsByType: {
      activities: { focus: 2, knowledge: 1, discipline: 1 },
      training: { focus: 1, knowledge: 3, discipline: 1 },
      study: { focus: 2, knowledge: 2, discipline: 2 },
      contraturno: { focus: 1, knowledge: 2, discipline: 2 },
      review: { focus: 2, knowledge: 3, discipline: 2 }
    },
    subtasksByType: {
      activities: ["Separar o material necessário", "Definir o próximo passo"],
      training: ["Rever os apontamentos", "Registrar uma dúvida"],
      study: ["Escolher um tópico", "Anotar o que aprendeu"],
      contraturno: ["Definir uma meta", "Registrar o resultado"],
      review: ["Listar os pontos principais", "Rever uma questão difícil"]
    },
    bossQuizPrompt: "PLACEHOLDER EDITÁVEL: escreva aqui uma pergunta de revisão semanal."
  },
  settingsDefaults: {
    sound: false,
    vibration: false,
    gamepadHints: true,
    scanlines: false
  }
};

const DAY_IDS = PPE_CONFIG.schedule.days.map((day) => day.id);
const BLOCKS = PPE_CONFIG.schedule.slots.flatMap((slot) =>
  PPE_CONFIG.schedule.days.map((day, dayIndex) => ({
    id: `${day.id}:${slot.id}`,
    day,
    dayIndex,
    slot,
    activity: slot.activities[dayIndex],
    isBoss:
      day.id === PPE_CONFIG.weeklyBoss.dayId &&
      slot.activities[dayIndex].type === PPE_CONFIG.weeklyBoss.activityType
  }))
);

function pad(value) {
  return String(value).padStart(2, "0");
}

function dateKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function mondayOf(date) {
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function currentWeekKey() {
  return dateKey(mondayOf(new Date()));
}

function createDefaultState() {
  const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches || false;
  return {
    version: 1,
    weekKey: currentWeekKey(),
    progress: {},
    notes: {},
    quizAnswers: {},
    checklist: {},
    energyByDay: {},
    clearedDays: [],
    clearedDates: [],
    daySummaries: {},
    achievements: [],
    xp: 0,
    stats: { focus: 0, knowledge: 0, discipline: 0 },
    streak: 0,
    mode: "table",
    selectedBlock: null,
    timer: null,
    settings: {
      ...PPE_CONFIG.settingsDefaults,
      reducedEffects: reducedMotion
    }
  };
}

function initState() {
  let saved;
  try {
    const raw = window.localStorage.getItem(PPE_CONFIG.storageKey);
    if (!raw) return createDefaultState();
    saved = JSON.parse(raw);
  } catch (error) {
    console.warn("[PPE] Saved progress is unavailable; using in-memory progress.", error);
    return createDefaultState();
  }

  if (!saved || typeof saved !== "object" || Array.isArray(saved)) {
    console.warn("[PPE] Saved progress has an invalid shape; using a clean save slot.");
    return createDefaultState();
  }

  const fresh = createDefaultState();
  const state = {
    ...fresh,
    ...saved,
    progress: saved.progress && typeof saved.progress === "object" ? saved.progress : {},
    notes: saved.notes && typeof saved.notes === "object" ? saved.notes : {},
    quizAnswers:
      saved.quizAnswers && typeof saved.quizAnswers === "object" ? saved.quizAnswers : {},
    checklist: saved.checklist && typeof saved.checklist === "object" ? saved.checklist : {},
    energyByDay:
      saved.energyByDay && typeof saved.energyByDay === "object" ? saved.energyByDay : {},
    clearedDays: Array.isArray(saved.clearedDays) ? saved.clearedDays : [],
    clearedDates: Array.isArray(saved.clearedDates) ? saved.clearedDates : [],
    daySummaries:
      saved.daySummaries && typeof saved.daySummaries === "object" ? saved.daySummaries : {},
    achievements: Array.isArray(saved.achievements) ? saved.achievements : [],
    stats: { ...fresh.stats, ...(saved.stats || {}) },
    settings: { ...fresh.settings, ...(saved.settings || {}) }
  };

  if (state.weekKey !== fresh.weekKey) {
    state.weekKey = fresh.weekKey;
    state.progress = {};
    state.notes = {};
    state.quizAnswers = {};
    state.checklist = {};
    state.energyByDay = {};
    state.clearedDays = [];
    state.daySummaries = {};
    state.timer = null;
  }
  return state;
}

export function initPpeSchedule() {
  const root = document.getElementById("ppeExperience");
  const table = document.getElementById("ppeScheduleTable");
  if (!root || !table) return null;

  const elements = {
    headers: document.getElementById("ppeWeekdayHeaders"),
    body: document.getElementById("ppeScheduleBody"),
    tablePanel: root.querySelector('[data-ppe-panel="table"]'),
    mapPanel: root.querySelector('[data-ppe-panel="map"]'),
    mapTrack: document.getElementById("ppeMapTrack"),
    detail: document.getElementById("ppeDetailPanel"),
    detailTitle: document.getElementById("ppeDetailTitle"),
    detailType: document.getElementById("ppeDetailType"),
    detailDuration: document.getElementById("ppeDetailDuration"),
    detailReward: document.getElementById("ppeDetailReward"),
    dialogText: document.getElementById("ppeDialogText"),
    checklist: document.getElementById("ppeChecklist"),
    notes: document.getElementById("ppeNotes"),
    quiz: document.getElementById("ppeQuiz"),
    quizPrompt: document.getElementById("ppeQuizPrompt"),
    quizAnswer: document.getElementById("ppeQuizAnswer"),
    bossMenu: document.getElementById("ppeBossMenu"),
    timer: document.getElementById("ppeTimer"),
    timerLabel: document.getElementById("ppeTimerLabel"),
    timerBar: document.getElementById("ppeTimerBar"),
    timerProgress: document.getElementById("ppeTimerProgress"),
    timerStrip: document.getElementById("ppeTimerStrip"),
    globalTimerLabel: document.getElementById("ppeGlobalTimerLabel"),
    globalTimerBar: document.getElementById("ppeGlobalTimerBar"),
    energyLabel: document.getElementById("ppeEnergyLabel"),
    energyBar: document.getElementById("ppeEnergyBar"),
    nextLabel: document.getElementById("ppeNextLabel"),
    nextCountdown: document.getElementById("ppeNextCountdown"),
    nowBadge: document.getElementById("ppeNowBadge"),
    level: document.getElementById("ppeLevel"),
    xp: document.getElementById("ppeXP"),
    levelXP: document.getElementById("ppeLevelXP"),
    levelXPBar: document.getElementById("ppeLevelXPBar"),
    streak: document.getElementById("ppeStreak"),
    bossHP: document.getElementById("ppeBossHP"),
    bossHPLabel: document.getElementById("ppeBossHPLabel"),
    daySummary: document.getElementById("ppeDaySummary"),
    daySummaryText: document.getElementById("ppeDaySummaryText"),
    settings: document.getElementById("ppeSettings"),
    settingsButton: root.querySelector('[data-ppe-action="settings"]'),
    gamepadHint: document.getElementById("ppeGamepadHint"),
    toast: document.getElementById("ppeToast"),
    live: document.getElementById("ppeLive"),
    effects: document.getElementById("ppeEffects"),
    resetDialog: document.getElementById("ppeResetDialog")
  };
  const state = initState();
  state.mode = state.mode === "map" ? "map" : "table";
  const controller = new AbortController();
  const { signal } = controller;
  const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  let clockInterval = 0;
  let timerInterval = 0;
  let toastTimeout = 0;
  let noteSaveTimeout = 0;
  let longPressTimeout = 0;
  let longPressBlockId = null;
  let longPressStart = null;
  let suppressClickBlockId = null;
  let gamepadRaf = 0;
  let gamepadIndex = null;
  let previousGamepadButtons = [];
  let lastGamepadMove = 0;
  let audioContext = null;
  let scheduleObserver = null;
  let storageWarningShown = false;

  function getBlock(blockId) {
    return BLOCKS.find((block) => block.id === blockId) || null;
  }

  function getCell(blockId) {
    return table.querySelector(`[data-block-id="${blockId}"]`);
  }

  function getDayDate(dayId) {
    const dayIndex = DAY_IDS.indexOf(dayId);
    if (dayIndex < 0) return null;
    const [year, month, day] = state.weekKey.split("-").map(Number);
    const result = new Date(year, month - 1, day);
    result.setDate(result.getDate() + dayIndex);
    return result;
  }

  function getTodayDay(date = new Date()) {
    return PPE_CONFIG.schedule.days.find((day) => day.jsDay === date.getDay()) || null;
  }

  function getProgress(blockId) {
    return state.progress[blockId] || null;
  }

  function isComplete(blockId) {
    return getProgress(blockId)?.status === "complete";
  }

  function isSkipped(blockId) {
    return getProgress(blockId)?.status === "skipped";
  }

  function makeElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }

  function announce(message) {
    elements.live.textContent = "";
    window.setTimeout(() => {
      elements.live.textContent = message;
    }, 20);
  }

  function showToast(title, message = "") {
    window.clearTimeout(toastTimeout);
    elements.toast.replaceChildren();
    elements.toast.append(
      makeElement("b", "ppe-toast__title", title),
      makeElement("span", "ppe-toast__message", message)
    );
    elements.toast.hidden = false;
    requestAnimationFrame(() => elements.toast.classList.add("is-visible"));
    toastTimeout = window.setTimeout(() => {
      elements.toast.classList.remove("is-visible");
      window.setTimeout(() => {
        elements.toast.hidden = true;
      }, 220);
    }, 2800);
    announce(message ? `${title}. ${message}` : title);
  }

  function saveState() {
    try {
      window.localStorage.setItem(PPE_CONFIG.storageKey, JSON.stringify(state));
    } catch (error) {
      if (!storageWarningShown) {
        storageWarningShown = true;
        console.warn("[PPE] Progress is only stored in memory for this session.", error);
        showToast("SAVE OFFLINE", "O armazenamento está indisponível; o progresso ficará nesta sessão.");
      }
    }
  }

  function activityClass(type) {
    return `ppe-badge ppe-badge--${type}`;
  }

  function renderSchedule() {
    elements.headers.replaceChildren();
    elements.body.replaceChildren();

    const timeHeading = makeElement("th", "ppe-time-heading", "HORÁRIOS");
    timeHeading.scope = "col";
    timeHeading.setAttribute("role", "columnheader");
    elements.headers.appendChild(timeHeading);

    PPE_CONFIG.schedule.days.forEach((day) => {
      const heading = makeElement("th", "ppe-day-heading");
      heading.scope = "col";
      heading.setAttribute("role", "columnheader");
      heading.dataset.weekday = String(day.jsDay);
      heading.dataset.dayId = day.id;
      heading.append(
        makeElement("span", "ppe-day-heading__name", day.label),
        makeElement("span", "ppe-today-tag", "TODAY"),
        makeElement("span", "ppe-day-count", "0/3"),
        makeElement("span", "ppe-day-cleared", "★")
      );
      elements.headers.appendChild(heading);
    });

    PPE_CONFIG.schedule.slots.forEach((slot, slotIndex) => {
      const row = makeElement("tr", "ppe-slot-row");
      row.setAttribute("role", "row");
      row.dataset.slotId = slot.id;
      row.dataset.startMinute = String(slot.startMinute);
      row.dataset.endMinute = String(slot.endMinute);

      const time = makeElement("th", "ppe-time-cell");
      time.scope = "row";
      time.setAttribute("role", "rowheader");
      time.append(
        makeElement("span", "ppe-time-cell__label", slot.label),
        makeElement("span", "ppe-now-badge", "NOW")
      );
      row.appendChild(time);
      elements.body.appendChild(row);

      PPE_CONFIG.schedule.days.forEach((day, dayIndex) => {
        const activity = slot.activities[dayIndex];
        const block = BLOCKS.find((entry) => entry.day.id === day.id && entry.slot.id === slot.id);
        if (!block) throw new Error(`Missing PPE block for ${day.id}/${slot.id}.`);

        const cell = makeElement("td", "ppe-block-cell");
        cell.setAttribute("role", "gridcell");
        cell.dataset.blockId = block.id;
        cell.dataset.dayId = day.id;
        cell.dataset.dayIndex = String(dayIndex);
        cell.dataset.slotIndex = String(slotIndex);
        cell.dataset.weekday = String(day.jsDay);
        cell.tabIndex = state.selectedBlock === block.id ? 0 : -1;
        cell.setAttribute("aria-selected", String(state.selectedBlock === block.id));
        cell.setAttribute(
          "aria-label",
          `${day.label}, ${slot.label}: ${activity.label}${block.isBoss ? ", WEEKLY BOSS" : ""}`
        );

        const badge = makeElement("span", activityClass(activity.type), activity.label);
        cell.appendChild(badge);
        if (block.isBoss) cell.appendChild(makeElement("small", "ppe-boss-tag", "WEEKLY BOSS"));

        const pellets = makeElement("span", "ppe-cell-pellets");
        pellets.setAttribute("aria-hidden", "true");
        for (let index = 0; index < 3; index += 1) {
          pellets.appendChild(makeElement("i", ""));
        }
        cell.append(
          makeElement("span", "ppe-now-badge", "NOW"),
          pellets,
          makeElement("span", "ppe-cell-eater"),
          makeElement("span", "ppe-cell-status")
        );
        row.appendChild(cell);
      });
    });

    table.setAttribute("aria-rowcount", String(PPE_CONFIG.schedule.slots.length + 1));
    table.setAttribute("aria-colcount", String(PPE_CONFIG.schedule.days.length + 1));
  }

  function updateSelectionVisuals() {
    table.querySelectorAll("[data-block-id]").forEach((cell) => {
      const selected = cell.dataset.blockId === state.selectedBlock;
      cell.classList.toggle("is-selected", selected);
      cell.tabIndex = selected ? 0 : -1;
      cell.setAttribute("aria-selected", String(selected));
    });
    renderMap();
  }

  function updateCell(block, animate = false) {
    const cell = getCell(block.id);
    if (!cell) return;

    const record = getProgress(block.id);
    const completed = record?.status === "complete";
    const skipped = record?.status === "skipped";
    const newlyCompleted = completed && !cell.classList.contains("is-complete");
    cell.classList.toggle("is-complete", completed);
    cell.classList.toggle("is-skipped", skipped);
    cell.dataset.status = completed ? "complete" : skipped ? "skipped" : "pending";
    const pellets = cell.querySelector(".ppe-cell-pellets");
    const status = cell.querySelector(".ppe-cell-status");
    pellets.hidden = completed && !newlyCompleted;
    status.textContent = completed ? "✓" : skipped ? "—" : "";
    if (newlyCompleted && animate && !root.classList.contains("ppe-reduced-effects")) {
      cell.classList.add("is-eating");
      window.setTimeout(() => {
        if (!cell.isConnected) return;
        cell.classList.remove("is-eating");
        pellets.hidden = true;
      }, 620);
    }
    cell.setAttribute(
      "aria-label",
      `${block.day.label}, ${block.slot.label}: ${block.activity.label}, ${
        completed ? "concluído" : skipped ? "ignorado" : "pendente"
      }${block.isBoss ? ", WEEKLY BOSS" : ""}`
    );
  }

  function renderDayProgress() {
    PPE_CONFIG.schedule.days.forEach((day) => {
      const header = table.querySelector(`thead [data-day-id="${day.id}"]`);
      if (!header) return;
      const completed = PPE_CONFIG.schedule.slots.filter(
        (slot) => getProgress(`${day.id}:${slot.id}`)?.status === "complete"
      ).length;
      const count = header.querySelector(".ppe-day-count");
      const cleared = header.querySelector(".ppe-day-cleared");
      count.textContent = `${completed}/${PPE_CONFIG.schedule.slots.length}`;
      cleared.hidden = completed !== PPE_CONFIG.schedule.slots.length;
      header.classList.toggle("is-cleared", completed === PPE_CONFIG.schedule.slots.length);
    });
  }

  function renderMap() {
    elements.mapTrack.replaceChildren();
    PPE_CONFIG.schedule.days.forEach((day) => {
      const completeCount = PPE_CONFIG.schedule.slots.filter(
        (slot) => getProgress(`${day.id}:${slot.id}`)?.status === "complete"
      ).length;
      const isCleared = completeCount === PPE_CONFIG.schedule.slots.length;
      const selectedDay = getBlock(state.selectedBlock)?.day.id === day.id;
      const node = makeElement("button", "ppe-stage-node");
      node.type = "button";
      node.dataset.dayId = day.id;
      node.setAttribute("aria-pressed", String(selectedDay));
      node.classList.toggle("is-selected", selectedDay);
      node.classList.toggle("is-cleared", isCleared);
      node.append(
        makeElement("span", "ppe-stage-node__index", `0${day.jsDay}`),
        makeElement("b", "ppe-stage-node__name", day.label),
        makeElement("span", "ppe-stage-node__progress", `${completeCount}/3`),
        makeElement("span", "ppe-stage-node__stamp", isCleared ? "★ CLEARED" : "☆")
      );
      elements.mapTrack.appendChild(node);
    });
  }

  function getLevelInfo() {
    let remainingXP = state.xp;
    let level = 1;
    let threshold = PPE_CONFIG.editablePlaceholders.levelBaseXP;
    while (remainingXP >= threshold) {
      remainingXP -= threshold;
      level += 1;
      threshold += PPE_CONFIG.editablePlaceholders.levelStepXP;
    }
    return { level, currentXP: remainingXP, nextXP: threshold };
  }

  function setMeter(meter, value, max) {
    const clamped = Math.max(0, Math.min(max, value));
    meter.setAttribute("aria-valuemax", String(max));
    meter.setAttribute("aria-valuenow", String(Math.round(clamped)));
    meter.querySelector("i").style.transform = `scaleX(${max ? clamped / max : 0})`;
  }

  function getBossHP() {
    const regularBlocks = BLOCKS.filter((block) => !block.isBoss);
    const completed = regularBlocks.filter((block) => isComplete(block.id)).length;
    if (isComplete(getBossBlock().id)) return 0;
    return Math.max(0, Math.round(100 * (1 - completed / regularBlocks.length)));
  }

  function getBossBlock() {
    return BLOCKS.find((block) => block.isBoss);
  }

  function renderHUD() {
    const levelInfo = getLevelInfo();
    elements.level.textContent = pad(levelInfo.level);
    elements.xp.textContent = String(state.xp);
    elements.levelXP.textContent = `${levelInfo.currentXP} / ${levelInfo.nextXP} XP`;
    setMeter(elements.levelXPBar, levelInfo.currentXP, levelInfo.nextXP);
    elements.streak.textContent = String(state.streak);

    const today = getTodayDay();
    const energy = today
      ? state.energyByDay[today.id] ?? PPE_CONFIG.editablePlaceholders.maxEnergy
      : PPE_CONFIG.editablePlaceholders.maxEnergy;
    elements.energyLabel.textContent = `${energy} / ${PPE_CONFIG.editablePlaceholders.maxEnergy}`;
    setMeter(elements.energyBar, energy, PPE_CONFIG.editablePlaceholders.maxEnergy);

    Object.entries(PPE_CONFIG.editablePlaceholders.statNames).forEach(([id, label]) => {
      const stat = root.querySelector(`[data-stat="${id}"]`);
      const value = Math.max(0, Math.min(100, Number(state.stats[id]) || 0));
      stat.querySelector("span").textContent = label;
      stat.querySelector("b").textContent = String(value);
      setMeter(stat.querySelector(".ppe-stat__track"), value, 100);
    });

    const bossHP = getBossHP();
    elements.bossHPLabel.textContent = isComplete(getBossBlock().id) ? "DEFEATED" : `${bossHP}%`;
    setMeter(elements.bossHP, bossHP, 100);
  }

  function applySettings() {
    root.classList.toggle("has-scanlines", state.settings.scanlines);
    root.classList.toggle(
      "ppe-reduced-effects",
      state.settings.reducedEffects || reducedMotionQuery.matches
    );
    elements.gamepadHint.hidden = !state.settings.gamepadHints;
    root.querySelectorAll("[data-ppe-setting]").forEach((input) => {
      input.checked = Boolean(state.settings[input.dataset.ppeSetting]);
    });
  }

  function renderMode() {
    root.querySelectorAll("[data-ppe-mode]").forEach((button) => {
      const active = button.dataset.ppeMode === state.mode;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    elements.tablePanel.hidden = state.mode !== "table";
    elements.mapPanel.hidden = state.mode !== "map";
  }

  function durationFor(block) {
    return Number(PPE_CONFIG.editablePlaceholders.timerMinutesByType?.[block.activity.type]) ||
      PPE_CONFIG.editablePlaceholders.timerMinutes;
  }

  function checklistItems(block) {
    return PPE_CONFIG.editablePlaceholders.subtasksByType[block.activity.type] || [];
  }

  function renderChecklist(block) {
    elements.checklist.replaceChildren();
    const checkedItems = state.checklist[block.id] || [];
    checklistItems(block).forEach((text, index) => {
      const label = makeElement("label", "ppe-check-item");
      const input = makeElement("input", "");
      input.type = "checkbox";
      input.dataset.checklistBlock = block.id;
      input.dataset.checklistIndex = String(index);
      input.checked = Boolean(checkedItems[index]);
      label.append(input, makeElement("span", "", text));
      elements.checklist.appendChild(label);
    });
  }

  function renderDetail(block, moveFocus = false) {
    if (!block) return;
    const record = getProgress(block.id);
    elements.detail.hidden = false;
    elements.detailTitle.textContent = block.activity.label;
    elements.detailType.textContent = block.activity.label;
    elements.detailDuration.textContent = `${durationFor(block)} MIN`;
    elements.detailReward.textContent = `+${PPE_CONFIG.editablePlaceholders.xpByType[block.activity.type]} XP`;

    const message = block.isBoss
      ? `${block.day.label} · ${block.slot.label}. WEEKLY BOSS: escolha Study, Quiz, Notes ou Skip.`
      : `${block.day.label} · ${block.slot.label}. Escolha uma ação para continuar.`;
    elements.dialogText.textContent = message;
    elements.dialogText.classList.remove("is-typing");
    requestAnimationFrame(() => elements.dialogText.classList.add("is-typing"));

    renderChecklist(block);
    elements.notes.value = state.notes[block.id] || "";
    elements.bossMenu.hidden = !block.isBoss;
    elements.quiz.hidden = true;
    elements.quizAnswer.value = state.quizAnswers[block.id] || "";
    elements.timer.hidden = !state.timer || state.timer.blockId !== block.id;

    const completed = record?.status === "complete";
    const skipped = record?.status === "skipped";
    const startButton = root.querySelector('[data-ppe-action="timer-start"]');
    const completeButton = root.querySelector('[data-ppe-action="complete"]');
    const skipButton = root.querySelector('[data-ppe-action="skip"]');
    startButton.disabled = completed || skipped;
    completeButton.disabled = completed;
    skipButton.disabled = completed || skipped;
    startButton.textContent =
      state.timer?.blockId === block.id && state.timer.paused ? "RESUME" : "START";
    if (completed) elements.dialogText.textContent = `BLOCK COMPLETE: ${block.activity.label}.`;
    if (skipped) elements.dialogText.textContent = `BLOCK SKIPPED: ${block.activity.label}.`;

    updateTimerUI();
    if (moveFocus) root.querySelector('[data-ppe-action="close-panel"]').focus();
  }

  function selectBlock(blockId, { openPanel = false, focusPanel = false } = {}) {
    const block = getBlock(blockId);
    if (!block) return;
    state.selectedBlock = blockId;
    updateSelectionVisuals();
    if (openPanel) renderDetail(block, focusPanel);
  }

  function openSelectedBlock() {
    if (!state.selectedBlock) return;
    selectBlock(state.selectedBlock, { openPanel: true, focusPanel: true });
    playSound("select");
  }

  function closeDetail(restoreFocus = true) {
    elements.detail.hidden = true;
    elements.quiz.hidden = true;
    if (restoreFocus) {
      const focusTarget =
        state.mode === "map"
          ? elements.mapTrack.querySelector(`[data-day-id="${getBlock(state.selectedBlock)?.day.id}"]`)
          : getCell(state.selectedBlock);
      focusTarget?.focus();
    }
  }

  function updateSelectionAndFocus(blockId) {
    selectBlock(blockId);
    if (state.mode === "table") getCell(blockId)?.focus();
    else {
      const dayId = getBlock(blockId)?.day.id;
      elements.mapTrack.querySelector(`[data-day-id="${dayId}"]`)?.focus();
    }
    playSound("move");
  }

  function moveGridSelection(dx, dy) {
    const current = getBlock(state.selectedBlock) || BLOCKS[0];
    if (state.mode === "map") {
      const nextDayIndex = Math.max(
        0,
        Math.min(PPE_CONFIG.schedule.days.length - 1, current.dayIndex + dx + dy)
      );
      const day = PPE_CONFIG.schedule.days[nextDayIndex];
      const next = firstIncompleteBlock(day.id);
      if (next) updateSelectionAndFocus(next.id);
      return;
    }

    const slotIndex = PPE_CONFIG.schedule.slots.findIndex((slot) => slot.id === current.slot.id);
    const nextDayIndex = Math.max(
      0,
      Math.min(PPE_CONFIG.schedule.days.length - 1, current.dayIndex + dx)
    );
    const nextSlotIndex = Math.max(
      0,
      Math.min(PPE_CONFIG.schedule.slots.length - 1, slotIndex + dy)
    );
    const next = BLOCKS.find(
      (block) =>
        block.dayIndex === nextDayIndex &&
        block.slot.id === PPE_CONFIG.schedule.slots[nextSlotIndex].id
    );
    if (next) updateSelectionAndFocus(next.id);
  }

  function firstIncompleteBlock(dayId) {
    return (
      PPE_CONFIG.schedule.slots
        .map((slot) => getBlock(`${dayId}:${slot.id}`))
        .find((block) => block && !isComplete(block.id)) || getBlock(`${dayId}:morning`)
    );
  }

  function getBlockDate(dayId) {
    const day = getDayDate(dayId);
    return day ? dateKey(day) : "";
  }

  function dayComplete(dayId) {
    return PPE_CONFIG.schedule.slots.every((slot) => isComplete(`${dayId}:${slot.id}`));
  }

  function allBlocksComplete() {
    return BLOCKS.every((block) => isComplete(block.id));
  }

  function calculateLevel(xp = state.xp) {
    let level = 1;
    let remaining = xp;
    let threshold = PPE_CONFIG.editablePlaceholders.levelBaseXP;
    while (remaining >= threshold) {
      remaining -= threshold;
      level += 1;
      threshold += PPE_CONFIG.editablePlaceholders.levelStepXP;
    }
    return level;
  }

  function updateBlockView(block) {
    updateCell(block, true);
    renderDayProgress();
    renderHUD();
    renderMap();
    updateCurrentState();
    if (!elements.detail.hidden && state.selectedBlock === block.id) {
      renderDetail(block);
    }
  }

  function completeBlock(blockId, source = "manual") {
    const block = getBlock(blockId);
    if (!block || isComplete(blockId)) return;
    if (state.timer?.blockId === blockId) {
      window.clearInterval(timerInterval);
      timerInterval = 0;
      state.timer = null;
    }

    const completedBefore = BLOCKS.filter((entry) => isComplete(entry.id)).length;
    const previousLevel = calculateLevel();
    const reward = Number(PPE_CONFIG.editablePlaceholders.xpByType[block.activity.type]) || 0;
    const gains = PPE_CONFIG.editablePlaceholders.statGainsByType[block.activity.type] || {};
    const energy = state.energyByDay[block.day.id] ?? PPE_CONFIG.editablePlaceholders.maxEnergy;

    state.progress[blockId] = { status: "complete", completedAt: Date.now(), source };
    state.xp += reward;
    state.energyByDay[block.day.id] = Math.max(
      0,
      energy - PPE_CONFIG.editablePlaceholders.energyCostPerBlock
    );
    Object.entries(gains).forEach(([stat, value]) => {
      state.stats[stat] = Math.min(100, (Number(state.stats[stat]) || 0) + Number(value));
    });

    if (dayComplete(block.day.id)) updateStreakAndSummary(block.day.id);
    if (completedBefore === 0) {
      unlockAchievement("first-block", "FIRST BLOCK COMPLETED", "Seu primeiro bloco foi concluído.");
    }
    if (block.isBoss) {
      unlockAchievement("boss-defeated", "BOSS DEFEATED", "A revisão semanal foi concluída.");
    }
    if (allBlocksComplete()) {
      unlockAchievement("week-cleared", "WEEK CLEARED", "Todos os blocos desta semana foram concluídos.");
    }

    saveState();
    updateBlockView(block);
    playSound("complete");
    vibrate([18, 30, 18]);
    spawnConfetti();

    const newLevel = calculateLevel();
    if (newLevel > previousLevel) {
      root.classList.add("is-level-up");
      window.setTimeout(() => root.classList.remove("is-level-up"), 520);
      showToast("RANK UP!", `LVL. ${pad(newLevel)} reached.`);
      playSound("level");
    }
    announce(`${block.day.label}, ${block.slot.label}, ${block.activity.label} concluído. +${reward} XP.`);
  }

  function skipBlock(blockId) {
    const block = getBlock(blockId);
    if (!block || isComplete(blockId) || isSkipped(blockId)) return;
    state.progress[blockId] = { status: "skipped", skippedAt: Date.now() };
    saveState();
    updateBlockView(block);
    showToast("BLOCK SKIPPED", `${block.activity.label} ficou disponível para revisão.`);
    playSound("select");
  }

  function getCurrentDayIndex(date = new Date()) {
    return PPE_CONFIG.schedule.days.findIndex((day) => day.jsDay === date.getDay());
  }

  function updateCurrentState() {
    const now = new Date();
    const weekday = now.getDay();
    const minutes = now.getHours() * 60 + now.getMinutes();
    const todayDay = PPE_CONFIG.schedule.days.find((day) => day.jsDay === weekday);
    const todaySlot = PPE_CONFIG.schedule.slots.find(
      (slot) => minutes >= slot.startMinute && minutes < slot.endMinute
    );

    table.querySelectorAll("thead [data-weekday]").forEach((heading) => {
      const isToday = Number(heading.dataset.weekday) === weekday;
      heading.classList.toggle("is-today", isToday);
      heading.querySelector(".ppe-today-tag").hidden = !isToday;
      if (isToday) heading.setAttribute("aria-current", "date");
      else heading.removeAttribute("aria-current");
    });

    table.querySelectorAll("tbody [data-weekday]").forEach((cell) => {
      const isToday = Number(cell.dataset.weekday) === weekday;
      cell.classList.toggle("is-today", isToday);
      const block = getBlock(cell.dataset.blockId);
      const blockDate = getDayDate(block.day.id);
      const isPast =
        blockDate &&
        (dateKey(blockDate) < dateKey(now) ||
          (dateKey(blockDate) === dateKey(now) && block.slot.endMinute <= minutes));
      cell.classList.toggle(
        "is-missed",
        Boolean(isPast) && !isComplete(block.id) && !isSkipped(block.id)
      );
    });

    table.querySelectorAll("tbody tr[data-slot-id]").forEach((row) => {
      const slot = PPE_CONFIG.schedule.slots.find((item) => item.id === row.dataset.slotId);
      const isNow = Boolean(todayDay && todaySlot && todaySlot.id === slot.id);
      row.classList.toggle("is-current-slot", isNow);
      row.querySelector(".ppe-now-badge").hidden = !isNow;
      row.querySelectorAll("[data-block-id]").forEach((cell) => {
        const isCurrent = isNow && cell.dataset.dayId === todayDay.id;
        cell.classList.toggle("is-now", isCurrent);
        const badge = cell.querySelector(".ppe-now-badge");
        if (badge) badge.hidden = !isCurrent;
      });
    });

    elements.nowBadge.hidden = !Boolean(todayDay && todaySlot);
    updateNextCountdown(now);
  }

  function findNextBlock(now) {
    for (let offset = 0; offset <= 7; offset += 1) {
      const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
      const day = PPE_CONFIG.schedule.days.find((item) => item.jsDay === date.getDay());
      if (!day) continue;

      for (const slot of PPE_CONFIG.schedule.slots) {
        const candidate = new Date(date);
        candidate.setHours(Math.floor(slot.startMinute / 60), slot.startMinute % 60, 0, 0);
        if (candidate > now) return { date: candidate, day, slot };
      }
    }
    return null;
  }

  function updateNextCountdown(now = new Date()) {
    const next = findNextBlock(now);
    if (!next) {
      elements.nextLabel.textContent = "NEXT BLOCK";
      elements.nextCountdown.textContent = "--:--";
      return;
    }
    const seconds = Math.max(0, Math.floor((next.date.getTime() - now.getTime()) / 1000));
    const days = Math.floor(seconds / 86_400);
    const hours = Math.floor((seconds % 86_400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    elements.nextLabel.textContent = `NEXT · ${next.day.short} ${next.slot.label}`;
    elements.nextCountdown.textContent = `${days ? `${days}D ` : ""}${pad(hours)}:${pad(minutes)}:${pad(remainingSeconds)}`;
  }

  function renderDaySummary(dayId) {
    const summary = state.daySummaries[dayId];
    if (!summary) {
      elements.daySummary.hidden = true;
      return;
    }
    elements.daySummaryText.textContent = summary;
    elements.daySummary.hidden = false;
  }

  function firstBlockForToday() {
    const todayIndex = getCurrentDayIndex();
    if (todayIndex >= 0) {
      const today = PPE_CONFIG.schedule.days[todayIndex];
      const minutes = new Date().getHours() * 60 + new Date().getMinutes();
      const currentSlot = PPE_CONFIG.schedule.slots.find(
        (slot) => minutes >= slot.startMinute && minutes < slot.endMinute
      );
      if (currentSlot) {
        const current = getBlock(`${today.id}:${currentSlot.id}`);
        if (current && !isComplete(current.id)) return current;
      }
      const incomplete = firstIncompleteBlock(today.id);
      if (incomplete && !isComplete(incomplete.id)) return incomplete;
    }
    return BLOCKS.find((block) => !isComplete(block.id)) || BLOCKS[0];
  }

  function setMode(mode) {
    if (mode !== "table" && mode !== "map") return;
    state.mode = mode;
    saveState();
    renderMode();
    renderMap();
  }

  function applySetting(name, value) {
    state.settings[name] = Boolean(value);
    applySettings();
    saveState();
    if (name === "sound" && value) playSound("select");
    if (name === "vibration" && value) vibrate([12]);
  }

  function openSettings() {
    elements.settings.hidden = false;
    elements.settingsButton.setAttribute("aria-expanded", "true");
    elements.settings.querySelector("input")?.focus();
  }

  function closeSettings() {
    elements.settings.hidden = true;
    elements.settingsButton.setAttribute("aria-expanded", "false");
    elements.settingsButton.focus();
  }

  function openResetDialog() {
    if (!elements.resetDialog.open) elements.resetDialog.showModal();
  }

  function renderAll() {
    renderSchedule();
    BLOCKS.forEach((block) => updateCell(block));
    updateSelectionVisuals();
    renderDayProgress();
    renderHUD();
    renderMode();
    renderMap();
    renderDaySummary(getTodayDay()?.id || "");
    applySettings();
    updateCurrentState();
    updateTimerUI();
  }

  function observeScheduleEntrance() {
    const schedule = root.querySelector(".ppe-schedule");
    if (!schedule) return;
    if (!("IntersectionObserver" in window)) {
      schedule.classList.add("in-view");
      return;
    }
    scheduleObserver = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      schedule.classList.add("in-view");
      scheduleObserver?.disconnect();
      scheduleObserver = null;
    }, { threshold: 0.1 });
    scheduleObserver.observe(schedule);
  }

  function calculateTimerRemaining() {
    if (!state.timer) return 0;
    return state.timer.paused
      ? state.timer.remainingMs
      : Math.max(0, state.timer.endsAt - Date.now());
  }

  function formatTimer(milliseconds) {
    const seconds = Math.max(0, Math.ceil(milliseconds / 1000));
    return `${pad(Math.floor(seconds / 60))}:${pad(seconds % 60)}`;
  }

  function updateTimerUI() {
    const timer = state.timer;
    if (!timer) {
      elements.timer.hidden = true;
      elements.timerStrip.hidden = true;
      return;
    }

    const remaining = calculateTimerRemaining();
    const total = Math.max(1, timer.durationMs);
    const percentage = Math.max(0, Math.min(1, remaining / total));
    const label = formatTimer(remaining);
    elements.timerStrip.hidden = false;
    elements.globalTimerLabel.textContent = label;
    elements.globalTimerBar.querySelector("i").style.transform = `scaleX(${percentage})`;
    elements.globalTimerBar.setAttribute("aria-valuenow", String(Math.round(percentage * 100)));

    const showingTimer = state.selectedBlock === timer.blockId && !elements.detail.hidden;
    elements.timer.hidden = !showingTimer;
    if (showingTimer) {
      elements.timerLabel.textContent = label;
      elements.timerBar.style.transform = `scaleX(${percentage})`;
      elements.timerProgress.setAttribute("aria-valuenow", String(Math.round(percentage * 100)));
    }

    root.querySelectorAll('[data-ppe-action="timer-pause"]').forEach((button) => {
      button.textContent = timer.paused ? "RESUME" : "PAUSE";
    });
  }

  function startTimer(blockId) {
    const block = getBlock(blockId);
    if (!block || isComplete(blockId)) return;
    if (state.timer) {
      if (state.timer.blockId === blockId && state.timer.paused) {
        state.timer.paused = false;
        state.timer.endsAt = Date.now() + state.timer.remainingMs;
        saveState();
        startTimerTicker();
        updateTimerUI();
        return;
      }
      showToast("TIMER BUSY", "Pause ou encerre o timer ativo antes de iniciar outro bloco.");
      playSound("error");
      return;
    }

    const durationMs = durationFor(block) * 60_000;
    state.timer = {
      blockId,
      durationMs,
      remainingMs: durationMs,
      endsAt: Date.now() + durationMs,
      paused: false
    };
    saveState();
    startTimerTicker();
    updateTimerUI();
    playSound("select");
    announce(`Timer iniciado para ${block.activity.label}.`);
  }

  function pauseTimer() {
    if (!state.timer) return;
    if (state.timer.paused) {
      state.timer.paused = false;
      state.timer.endsAt = Date.now() + state.timer.remainingMs;
      startTimerTicker();
    } else {
      state.timer.remainingMs = calculateTimerRemaining();
      state.timer.paused = true;
      window.clearInterval(timerInterval);
      timerInterval = 0;
    }
    saveState();
    updateTimerUI();
  }

  function abortTimer() {
    if (!state.timer) return;
    window.clearInterval(timerInterval);
    timerInterval = 0;
    state.timer = null;
    saveState();
    updateTimerUI();
    showToast("TIMER ABORTED", "O bloco continua disponível.");
  }

  function updateTimer() {
    if (!state.timer || state.timer.paused) return;
    if (state.timer.endsAt <= Date.now()) {
      const blockId = state.timer.blockId;
      window.clearInterval(timerInterval);
      timerInterval = 0;
      state.timer = null;
      saveState();
      completeBlock(blockId, "timer");
      updateTimerUI();
      return;
    }
    updateTimerUI();
  }

  function startTimerTicker() {
    window.clearInterval(timerInterval);
    timerInterval = window.setInterval(updateTimer, 1000);
  }

  function playSound(effect) {
    if (!state.settings.sound) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      showToast("AUDIO UNAVAILABLE", "Este navegador não oferece Web Audio.");
      return;
    }
    if (!audioContext) audioContext = new AudioContextClass();
    if (audioContext.state === "suspended") {
      audioContext.resume().catch((error) => console.warn("[PPE] Audio context could not resume.", error));
    }

    const sounds = {
      move: { frequency: 270, duration: 0.045, type: "square" },
      select: { frequency: 410, duration: 0.08, type: "triangle" },
      complete: { frequency: 660, duration: 0.16, type: "square" },
      level: { frequency: 880, duration: 0.24, type: "triangle" },
      achievement: { frequency: 740, duration: 0.18, type: "triangle" },
      error: { frequency: 150, duration: 0.1, type: "square" }
    };
    const sound = sounds[effect] || sounds.select;
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const startAt = audioContext.currentTime;
    oscillator.type = sound.type;
    oscillator.frequency.setValueAtTime(sound.frequency, startAt);
    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.exponentialRampToValueAtTime(0.06, startAt + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + sound.duration);
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start(startAt);
    oscillator.stop(startAt + sound.duration);
  }

  function vibrate(pattern) {
    if (!state.settings.vibration || typeof navigator.vibrate !== "function") return;
    navigator.vibrate(pattern);
  }

  function spawnConfetti() {
    if (root.classList.contains("ppe-reduced-effects")) return;
    const colors = ["lime", "amber", "cyan", "magenta", "orange"];
    for (let index = 0; index < 14; index += 1) {
      const particle = makeElement("i", `ppe-confetti ppe-confetti--${colors[index % colors.length]}`);
      const angle = (Math.PI * 2 * index) / 14;
      particle.style.setProperty("--ppe-dx", `${Math.cos(angle) * (26 + (index % 4) * 8)}px`);
      particle.style.setProperty("--ppe-dy", `${Math.sin(angle) * (26 + (index % 4) * 8)}px`);
      elements.effects.appendChild(particle);
      window.setTimeout(() => particle.remove(), 620);
    }
  }

  function updateStreakAndSummary(dayId) {
    if (state.clearedDays.includes(dayId)) return false;
    state.clearedDays.push(dayId);
    const clearedDate = getBlockDate(dayId);
    if (clearedDate) state.clearedDates.push(clearedDate);
    const dates = [...new Set(state.clearedDates)].sort();
    state.clearedDates = dates.slice(-30);
    let streak = 0;
    for (let index = dates.length - 1; index >= 0; index -= 1) {
      if (index < dates.length - 1) {
        const current = dates[index].split("-").map(Number);
        const next = dates[index + 1].split("-").map(Number);
        const gap =
          (Date.UTC(next[0], next[1] - 1, next[2]) -
            Date.UTC(current[0], current[1] - 1, current[2])) /
          86_400_000;
        if (gap !== 1) break;
      }
      streak += 1;
    }
    state.streak = streak;

    const dayStats = { focus: 0, knowledge: 0, discipline: 0 };
    const dayXP = PPE_CONFIG.schedule.slots.reduce((sum, slot) => {
      const block = getBlock(`${dayId}:${slot.id}`);
      if (!block || !isComplete(block.id)) return sum;
      const gains = PPE_CONFIG.editablePlaceholders.statGainsByType[block.activity.type] || {};
      Object.keys(dayStats).forEach((stat) => {
        dayStats[stat] += Number(gains[stat]) || 0;
      });
      return sum + (Number(PPE_CONFIG.editablePlaceholders.xpByType[block.activity.type]) || 0);
    }, 0);
    state.daySummaries[dayId] =
      `DAY COMPLETE: +${dayXP} XP · STREAK ${state.streak} · FOCUS +${dayStats.focus} · KNOWLEDGE +${dayStats.knowledge} · DISCIPLINE +${dayStats.discipline}`;
    renderDaySummary(dayId);
    table.querySelectorAll(`[data-day-id="${dayId}"]`).forEach((cell) => {
      cell.classList.add("is-line-clearing");
    });
    window.setTimeout(() => {
      table.querySelectorAll(`[data-day-id="${dayId}"]`).forEach((cell) => {
        cell.classList.remove("is-line-clearing");
      });
    }, 700);
    showToast("DAY CLEARED", `${dayId.toUpperCase()} complete.`);
    if (state.streak >= 3) {
      unlockAchievement("three-day-streak", "3-DAY STREAK", "Três dias concluídos em sequência.");
    }
    return true;
  }

  function unlockAchievement(id, title, detail) {
    if (state.achievements.includes(id)) return;
    state.achievements.push(id);
    showToast(title, detail);
    playSound("achievement");
  }

  function renderDaySummary(dayId) {
    const summary = state.daySummaries[dayId];
    elements.daySummary.hidden = !summary;
    if (summary) elements.daySummaryText.textContent = summary;
  }

  function runBossQuiz(block) {
    elements.quiz.hidden = false;
    elements.quizPrompt.textContent = PPE_CONFIG.editablePlaceholders.bossQuizPrompt;
    elements.quizAnswer.value = state.quizAnswers[block.id] || "";
    elements.quizAnswer.focus();
  }

  function submitBossQuiz() {
    const block = getBlock(state.selectedBlock);
    const answer = elements.quizAnswer.value.trim();
    if (!block?.isBoss || !answer) {
      showToast("ANSWER REQUIRED", "Escreva uma resposta antes de concluir a revisão.");
      playSound("error");
      return;
    }
    state.quizAnswers[block.id] = answer;
    state.notes[block.id] = [state.notes[block.id], `QUIZ: ${answer}`].filter(Boolean).join("\n");
    saveState();
    completeBlock(block.id, "quiz");
  }

  function startReset() {
    if (elements.resetDialog.open) elements.resetDialog.close();
    state.progress = {};
    state.notes = {};
    state.quizAnswers = {};
    state.checklist = {};
    state.energyByDay = {};
    state.clearedDays = [];
    state.clearedDates = [];
    state.daySummaries = {};
    state.achievements = [];
    state.xp = 0;
    state.stats = { focus: 0, knowledge: 0, discipline: 0 };
    state.streak = 0;
    state.timer = null;
    state.selectedBlock = firstBlockForToday().id;
    window.clearInterval(timerInterval);
    timerInterval = 0;
    elements.detail.hidden = true;
    elements.daySummary.hidden = true;
    saveState();
    renderAll();
    showToast("SAVE SLOT CLEARED", "O progresso foi resetado.");
  }

  function formatBlockName(block) {
    return `${block.day.label} · ${block.slot.label} · ${block.activity.label}`;
  }

  function selectDayStage(dayId) {
    const block = firstIncompleteBlock(dayId);
    if (block) {
      selectBlock(block.id, { openPanel: true, focusPanel: true });
      playSound("select");
    }
  }

  function handleBossAction(action) {
    const block = getBlock(state.selectedBlock);
    if (!block?.isBoss) return;
    if (action === "study") startTimer(block.id);
    else if (action === "quiz") runBossQuiz(block);
    else if (action === "notes") elements.notes.focus();
    else if (action === "skip") skipBlock(block.id);
  }

  function handleAction(action) {
    if (action === "settings") {
      if (elements.settings.hidden) openSettings();
      else closeSettings();
    } else if (action === "settings-close") closeSettings();
    else if (action === "reset-open") openResetDialog();
    else if (action === "reset-cancel") elements.resetDialog.close();
    else if (action === "reset-confirm") startReset();
    else if (action === "summary-close") elements.daySummary.hidden = true;
    else if (action === "close-panel") closeDetail();
    else if (action === "timer-start" && state.selectedBlock) startTimer(state.selectedBlock);
    else if (action === "timer-pause") pauseTimer();
    else if (action === "timer-abort") abortTimer();
    else if (action === "complete" && state.selectedBlock) completeBlock(state.selectedBlock);
    else if (action === "skip" && state.selectedBlock) skipBlock(state.selectedBlock);
    else if (action === "quiz-submit") submitBossQuiz();
  }

  function onClick(event) {
    const modeButton = event.target.closest("[data-ppe-mode]");
    if (modeButton) {
      setMode(modeButton.dataset.ppeMode);
      playSound("select");
      return;
    }

    const actionButton = event.target.closest("[data-ppe-action]");
    if (actionButton) {
      handleAction(actionButton.dataset.ppeAction);
      return;
    }

    const bossButton = event.target.closest("[data-boss-action]");
    if (bossButton) {
      handleBossAction(bossButton.dataset.bossAction);
      return;
    }

    const stage = event.target.closest(".ppe-stage-node");
    if (stage) {
      selectDayStage(stage.dataset.dayId);
      return;
    }

    const cell = event.target.closest("[data-block-id]");
    if (!cell || !table.contains(cell)) return;
    if (suppressClickBlockId === cell.dataset.blockId) {
      suppressClickBlockId = null;
      return;
    }
    selectBlock(cell.dataset.blockId, { openPanel: true, focusPanel: true });
    playSound("select");
  }

  function onKeydown(event) {
    if (event.key === "Escape") {
      if (elements.resetDialog.open) elements.resetDialog.close();
      else if (!elements.settings.hidden) closeSettings();
      else if (!elements.detail.hidden) closeDetail();
      return;
    }

    const cell = event.target.closest?.("[data-block-id]");
    if (cell && table.contains(cell)) {
      const key = event.key.toLowerCase();
      const directions = {
        arrowleft: [-1, 0],
        a: [-1, 0],
        arrowright: [1, 0],
        d: [1, 0],
        arrowup: [0, -1],
        w: [0, -1],
        arrowdown: [0, 1],
        s: [0, 1]
      };
      if (directions[key]) {
        event.preventDefault();
        moveGridSelection(...directions[key]);
      } else if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        selectBlock(cell.dataset.blockId, { openPanel: true, focusPanel: true });
        playSound("select");
      }
      return;
    }

    const stage = event.target.closest?.(".ppe-stage-node");
    if (stage && ["ArrowLeft", "ArrowRight", "a", "d"].includes(event.key)) {
      event.preventDefault();
      moveGridSelection(event.key === "ArrowLeft" || event.key.toLowerCase() === "a" ? -1 : 1, 0);
      return;
    }
    if (stage && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      selectDayStage(stage.dataset.dayId);
    }
  }

  function onFocusIn(event) {
    const cell = event.target.closest?.("[data-block-id]");
    if (cell && table.contains(cell) && state.selectedBlock !== cell.dataset.blockId) {
      selectBlock(cell.dataset.blockId);
    }
  }

  function onChange(event) {
    const setting = event.target.closest("[data-ppe-setting]");
    if (setting) {
      applySetting(setting.dataset.ppeSetting, setting.checked);
      return;
    }
    const checkbox = event.target.closest("[data-checklist-block]");
    if (checkbox) {
      const blockId = checkbox.dataset.checklistBlock;
      const index = Number(checkbox.dataset.checklistIndex);
      const checked = state.checklist[blockId] || [];
      checked[index] = checkbox.checked;
      state.checklist[blockId] = checked;
      saveState();
      return;
    }
    if (event.target === elements.notes && state.selectedBlock) {
      window.clearTimeout(noteSaveTimeout);
      state.notes[state.selectedBlock] = elements.notes.value;
      saveState();
    }
  }

  function onInput(event) {
    if (event.target === elements.notes && state.selectedBlock) {
      state.notes[state.selectedBlock] = elements.notes.value;
      window.clearTimeout(noteSaveTimeout);
      noteSaveTimeout = window.setTimeout(saveState, 220);
    }
  }

  function onPointerDown(event) {
    if (event.pointerType !== "touch") return;
    const cell = event.target.closest?.("[data-block-id]");
    if (!cell || !table.contains(cell)) return;
    longPressBlockId = cell.dataset.blockId;
    longPressStart = { x: event.clientX, y: event.clientY };
    window.clearTimeout(longPressTimeout);
    longPressTimeout = window.setTimeout(() => {
      if (!longPressBlockId) return;
      suppressClickBlockId = longPressBlockId;
      const blockId = longPressBlockId;
      longPressBlockId = null;
      selectBlock(blockId);
      completeBlock(blockId, "long-press");
    }, 560);
  }

  function cancelLongPress() {
    longPressBlockId = null;
    longPressStart = null;
    window.clearTimeout(longPressTimeout);
  }

  function onPointerMove(event) {
    if (!longPressBlockId || !longPressStart) return;
    if (Math.hypot(event.clientX - longPressStart.x, event.clientY - longPressStart.y) > 10) {
      cancelLongPress();
    }
  }

  function onGamepadConnected(event) {
    gamepadIndex = event.gamepad.index;
    state.gamepadConnected = true;
    elements.gamepadHint.textContent = "⌖ GAMEPAD: CONNECTED";
    showToast("GAMEPAD CONNECTED", "D-pad move · A select · B close.");
    gamepadRaf = requestAnimationFrame(pollGamepad);
  }

  function onGamepadDisconnected(event) {
    if (event.gamepad.index !== gamepadIndex) return;
    state.gamepadConnected = false;
    gamepadIndex = null;
    window.cancelAnimationFrame(gamepadRaf);
    elements.gamepadHint.textContent = "⌖ GAMEPAD: —";
    showToast("GAMEPAD DISCONNECTED");
  }

  function pollGamepad() {
    if (!state.gamepadConnected || gamepadIndex === null) return;
    const pad = navigator.getGamepads?.()[gamepadIndex];
    if (!pad) {
      gamepadRaf = requestAnimationFrame(pollGamepad);
      return;
    }

    const buttons = pad.buttons.map((button) => button.pressed);
    const justPressed = (index) => Boolean(buttons[index] && !previousGamepadButtons[index]);
    const now = performance.now();
    let dx = 0;
    let dy = 0;
    if (buttons[14] || pad.axes[0] < -0.55) dx = -1;
    else if (buttons[15] || pad.axes[0] > 0.55) dx = 1;
    if (buttons[12] || pad.axes[1] < -0.55) dy = -1;
    else if (buttons[13] || pad.axes[1] > 0.55) dy = 1;
    if ((dx || dy) && now - lastGamepadMove > 170) {
      moveGridSelection(dx, dy);
      lastGamepadMove = now;
    }
    if (justPressed(0)) openSelectedBlock();
    if (justPressed(1)) closeDetail();
    previousGamepadButtons = buttons;
    gamepadRaf = requestAnimationFrame(pollGamepad);
  }

  function startClock() {
    window.clearInterval(clockInterval);
    clockInterval = window.setInterval(() => {
      updateCurrentState();
      renderHUD();
    }, 1000);
  }

  root.addEventListener("click", onClick, { signal });
  root.addEventListener("keydown", onKeydown, { signal });
  root.addEventListener("focusin", onFocusIn, { signal });
  root.addEventListener("change", onChange, { signal });
  root.addEventListener("input", onInput, { signal });
  root.addEventListener("pointerdown", onPointerDown, { signal });
  root.addEventListener("pointermove", onPointerMove, { signal });
  root.addEventListener("pointerup", cancelLongPress, { signal });
  root.addEventListener("pointercancel", cancelLongPress, { signal });
  root.addEventListener("pointerleave", cancelLongPress, { signal });
  window.addEventListener("gamepadconnected", onGamepadConnected, { signal });
  window.addEventListener("gamepaddisconnected", onGamepadDisconnected, { signal });
  reducedMotionQuery.addEventListener?.("change", applySettings);
  document.addEventListener("visibilitychange", updateCurrentState, { signal });

  state.selectedBlock = getBlock(state.selectedBlock)?.id || firstBlockForToday().id;
  renderAll();
  observeScheduleEntrance();
  startClock();
  if (state.timer && !state.timer.paused) {
    if (state.timer.endsAt <= Date.now()) {
      const expiredBlock = state.timer.blockId;
      state.timer = null;
      completeBlock(expiredBlock, "timer");
    } else {
      startTimerTicker();
      updateTimerUI();
    }
  }
  if (navigator.getGamepads) {
    for (const gamepad of navigator.getGamepads()) {
      if (gamepad?.connected) {
        onGamepadConnected({ gamepad });
        break;
      }
    }
  }
  return {
    state,
    destroy() {
      controller.abort();
      window.clearInterval(clockInterval);
      window.clearInterval(timerInterval);
      window.clearTimeout(toastTimeout);
      window.clearTimeout(noteSaveTimeout);
      window.clearTimeout(longPressTimeout);
      window.cancelAnimationFrame(gamepadRaf);
      scheduleObserver?.disconnect();
      reducedMotionQuery.removeEventListener?.("change", applySettings);
      if (audioContext) audioContext.close();
    }
  };
}
