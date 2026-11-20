/* ============================================================
   KNOWLEDGE PROGRESS — one local document for all five worlds.
   Cards known, quiz/boss/match records, XP, streak, badges,
   Pomodoro sessions and JSON import/export.
   ============================================================ */

import { WORLDS } from "./worlds.js";

const STORAGE_KEY = "agrvai-knowledge-v1";
const XP_PER_LEVEL = 100;

const EMPTY_WORLD = () => ({
  known: [],
  quizBest: 0,
  quizAttempts: 0,
  bossBest: 0,
  bossWins: 0,
  matchBest: 0,
  lastSeen: null
});

function defaultWorlds() {
  return Object.fromEntries(WORLDS.map((world) => [world.id, EMPTY_WORLD()]));
}

function defaultState() {
  return {
    version: 1,
    xp: 0,
    streak: 0,
    lastDay: null,
    worlds: defaultWorlds(),
    badges: [],
    pomodoros: 0
  };
}

function todayKey() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function yesterdayKey() {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function readState() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    return sanitize(JSON.parse(raw));
  } catch {
    return defaultState();
  }
}

function clampNumber(value, max = Number.MAX_SAFE_INTEGER) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.min(max, Math.max(0, number));
}

function sanitize(raw) {
  const state = defaultState();
  if (!raw || typeof raw !== "object") return state;

  state.xp = clampNumber(raw.xp);
  state.streak = clampNumber(raw.streak, 999);
  state.pomodoros = clampNumber(raw.pomodoros, 9999);
  state.lastDay = typeof raw.lastDay === "string" ? raw.lastDay : null;
  state.badges = Array.isArray(raw.badges)
    ? raw.badges.filter((badge) => typeof badge === "string").slice(0, 40)
    : [];

  WORLDS.forEach((world) => {
    const source = raw.worlds?.[world.id];
    if (!source || typeof source !== "object") return;
    const validCards = new Set(world.flashcards.map((card) => card.id));
    state.worlds[world.id] = {
      known: Array.isArray(source.known)
        ? source.known.filter((id) => validCards.has(id)).slice(0, validCards.size)
        : [],
      quizBest: clampNumber(source.quizBest, world.questions.length * 100),
      quizAttempts: clampNumber(source.quizAttempts, 9999),
      bossBest: clampNumber(source.bossBest, 9999),
      bossWins: clampNumber(source.bossWins, 9999),
      matchBest: clampNumber(source.matchBest, 9999),
      lastSeen: typeof source.lastSeen === "string" ? source.lastSeen : null
    };
  });

  return state;
}

export function levelFor(xp) {
  return Math.floor(Math.max(0, xp) / XP_PER_LEVEL) + 1;
}

export function levelProgress(xp) {
  const safe = Math.max(0, xp);
  return {
    level: levelFor(safe),
    current: safe % XP_PER_LEVEL,
    needed: XP_PER_LEVEL,
    ratio: (safe % XP_PER_LEVEL) / XP_PER_LEVEL
  };
}

export function createProgress() {
  let state = readState();
  const listeners = new Set();

  function persist() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage can be blocked */
    }
  }

  function snapshot() {
    const worlds = {};
    let knownTotal = 0;
    let cardTotal = 0;
    WORLDS.forEach((world) => {
      const entry = state.worlds[world.id] || EMPTY_WORLD();
      knownTotal += entry.known.length;
      cardTotal += world.flashcards.length;
      worlds[world.id] = {
        ...entry,
        known: [...entry.known],
        cards: entry.known.length,
        cardsTotal: world.flashcards.length,
        cardRatio: entry.known.length / world.flashcards.length,
        quizTotal: world.questions.length
      };
    });
    const cardRatio = cardTotal ? knownTotal / cardTotal : 0;
    return {
      ...state,
      worlds,
      ...levelProgress(state.xp),
      knownTotal,
      cardTotal,
      cardRatio
    };
  }

  function emit(detail = {}) {
    const current = snapshot();
    persist();
    window.dispatchEvent(
      new CustomEvent("agrvai:knowledge-update", { detail: current })
    );
    listeners.forEach((listener) => listener(current, detail));
    return current;
  }

  function touchDay() {
    const today = todayKey();
    if (state.lastDay === today) return false;
    state.streak = state.lastDay === yesterdayKey() ? state.streak + 1 : 1;
    state.lastDay = today;
    return true;
  }

  function award({ xp = 0, badge = null, message = "" } = {}) {
    const gained = Math.max(0, Math.round(Number(xp) || 0));
    state.xp += gained;
    const newBadges = [];
    if (badge && !state.badges.includes(badge)) {
      state.badges.push(badge);
      newBadges.push(badge);
    }
    touchDay();
    const current = emit({ award: true });
    if (gained || newBadges.length || message) {
      window.dispatchEvent(
        new CustomEvent("agrvai:knowledge-award", {
          detail: { xp: gained, badge, newBadges, message, state: current }
        })
      );
    }
    return current;
  }

  function markCard(worldId, cardId, known = true) {
    const entry = state.worlds[worldId];
    if (!entry) return snapshot();
    const set = new Set(entry.known);
    const had = set.has(cardId);
    if (known) set.add(cardId);
    else set.delete(cardId);
    entry.known = [...set];
    entry.lastSeen = new Date().toISOString();
    if (known && !had) {
      return award({ xp: 4, badge: null, message: "Flashcard dominado" });
    }
    return emit({ card: true });
  }

  function recordQuiz(worldId, { score = 0, correct = 0, total = 0 } = {}) {
    const entry = state.worlds[worldId];
    if (!entry) return snapshot();
    const safe = clampNumber(score, 9999);
    const record = safe > entry.quizBest;
    entry.quizBest = Math.max(entry.quizBest, safe);
    entry.quizAttempts += 1;
    entry.lastSeen = new Date().toISOString();
    const perfect = total > 0 && correct === total;
    const current = award({
      xp: 12 + Math.round(safe / 20),
      badge: perfect ? `${worldId}:gabarito` : null,
      message: perfect ? "Gabarito perfeito!" : "Quiz concluído"
    });
    if (record) {
      const again = award({ xp: 8, message: "Novo recorde no quiz" });
      return again;
    }
    return current;
  }

  function recordBoss(worldId, { score = 0, win = false } = {}) {
    const entry = state.worlds[worldId];
    if (!entry) return snapshot();
    const safe = clampNumber(score, 9999);
    entry.bossBest = Math.max(entry.bossBest, safe);
    if (win) entry.bossWins += 1;
    entry.lastSeen = new Date().toISOString();
    return award({
      xp: win ? 45 : 15,
      badge: win ? `${worldId}:boss` : null,
      message: win ? "Chefe derrotado!" : "Boa tentativa no chefe"
    });
  }

  function recordMatch(worldId, { score = 0, won = false } = {}) {
    const entry = state.worlds[worldId];
    if (!entry) return snapshot();
    const safe = clampNumber(score, 9999);
    entry.matchBest = Math.max(entry.matchBest, safe);
    entry.lastSeen = new Date().toISOString();
    return award({
      xp: won ? 24 : 8,
      badge: won ? `${worldId}:match` : null,
      message: won ? "Todos os pares ligados" : "Partida encerrada"
    });
  }

  function completePomodoro() {
    state.pomodoros += 1;
    return award({
      xp: 20,
      badge: state.pomodoros >= 1 ? "pomodoro" : null,
      message: "Ciclo de foco concluído"
    });
  }

  function reset() {
    state = defaultState();
    persist();
    return emit({ reset: true });
  }

  function exportJSON() {
    return JSON.stringify(snapshot(), null, 2);
  }

  function importJSON(raw) {
    try {
      const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
      if (!parsed || typeof parsed !== "object") return false;
      state = sanitize(parsed);
      persist();
      emit({ imported: true });
      return true;
    } catch {
      return false;
    }
  }

  return {
    getState: snapshot,
    award,
    markCard,
    recordQuiz,
    recordBoss,
    recordMatch,
    completePomodoro,
    reset,
    exportJSON,
    importJSON,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    }
  };
}
