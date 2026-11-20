/* ============================================================
   ARCADE HUD — XP, levels, coins, badges and per-game records.
   One localStorage document, one CustomEvent for every change.
   ============================================================ */

const STORAGE_KEY = "agrvai-arcade-v1";
const XP_PER_LEVEL = 120;

const DEFAULT_STATE = {
  xp: 0,
  coins: 0,
  plays: 0,
  badges: [],
  records: {},
  lastGame: null
};

function readState() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATE };
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_STATE,
      ...parsed,
      badges: Array.isArray(parsed.badges) ? parsed.badges : [],
      records: parsed.records && typeof parsed.records === "object" ? parsed.records : {}
    };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

function persist(state) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* storage can be blocked */
  }
}

export function levelFor(xp) {
  return Math.floor(Math.max(0, xp) / XP_PER_LEVEL) + 1;
}

export function xpProgress(xp) {
  const safe = Math.max(0, xp);
  return {
    level: levelFor(safe),
    current: safe % XP_PER_LEVEL,
    needed: XP_PER_LEVEL,
    ratio: (safe % XP_PER_LEVEL) / XP_PER_LEVEL
  };
}

export function createHud({ onChange = null } = {}) {
  let state = readState();

  function emit(detail = {}) {
    const snapshot = getState();
    window.dispatchEvent(new CustomEvent("agrvai:arcade-update", { detail: snapshot }));
    onChange?.(snapshot, detail);
    return snapshot;
  }

  function save() {
    persist(state);
    return emit();
  }

  function getState() {
    return {
      ...state,
      ...xpProgress(state.xp),
      records: { ...state.records },
      badges: [...state.badges]
    };
  }

  function award({
    game = "arcade",
    score = 0,
    xp = 0,
    coins = 0,
    badge = null,
    message = ""
  } = {}) {
    const safeScore = Math.max(0, Math.round(Number(score) || 0));
    const previous = state.records[game] || 0;
    const record = safeScore > previous;
    if (record) state.records[game] = safeScore;

    const gainedXp = Math.max(0, Math.round(xp || 10 + safeScore / 12));
    const gainedCoins = Math.max(0, Math.round(coins || 1 + safeScore / 80));
    state.xp += gainedXp;
    state.coins += gainedCoins;
    state.plays += 1;
    state.lastGame = game;

    if (badge && !state.badges.includes(badge)) state.badges.push(badge);
    if (record && previous > 0 && !state.badges.includes(`${game}:recorde`)) {
      state.badges.push(`${game}:recorde`);
    }
    if (state.plays === 1 && !state.badges.includes("primeiro-jogo")) {
      state.badges.push("primeiro-jogo");
    }

    const snapshot = save();
    window.dispatchEvent(
      new CustomEvent("agrvai:arcade-award", {
        detail: {
          game,
          score: safeScore,
          record,
          previous,
          xp: gainedXp,
          coins: gainedCoins,
          badge,
          message,
          state: snapshot
        }
      })
    );
    return { ...snapshot, gainedXp, gainedCoins, record, previous };
  }

  function reset() {
    state = { ...DEFAULT_STATE, records: {}, badges: [] };
    persist(state);
    return emit({ reset: true });
  }

  function exportState() {
    return JSON.stringify(getState(), null, 2);
  }

  function importState(raw) {
    try {
      const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
      if (!parsed || typeof parsed !== "object") return false;
      state = {
        ...DEFAULT_STATE,
        xp: Math.max(0, Number(parsed.xp) || 0),
        coins: Math.max(0, Number(parsed.coins) || 0),
        plays: Math.max(0, Number(parsed.plays) || 0),
        badges: Array.isArray(parsed.badges) ? parsed.badges.slice(0, 80) : [],
        records:
          parsed.records && typeof parsed.records === "object"
            ? Object.fromEntries(
                Object.entries(parsed.records)
                  .filter(([, value]) => Number.isFinite(Number(value)))
                  .map(([key, value]) => [key, Math.max(0, Number(value))])
              )
            : {},
        lastGame: typeof parsed.lastGame === "string" ? parsed.lastGame : null
      };
      persist(state);
      emit({ imported: true });
      return true;
    } catch {
      return false;
    }
  }

  return {
    getState,
    award,
    reset,
    exportState,
    importState,
    levelFor,
    xpProgress,
    destroy() {
      onChange = null;
    }
  };
}
