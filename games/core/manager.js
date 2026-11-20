/* ============================================================
   GAME MANAGER — launcher chips, dynamic imports, lifecycle,
   HUD awards and the Konami easter egg.
   ============================================================ */

import { createHud } from "./hud.js";
import { createGameShell } from "./shell.js";
import { GAMES, gameById } from "../registry.js";
import "../styles.css";

const KONAMI = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "b",
  "a"
];

const pad = (value, size = 2) => String(Math.max(0, Math.round(Number(value) || 0))).padStart(size, "0");

function makeChip(meta, state) {
  const chip = document.createElement("button");
  chip.type = "button";
  chip.className = "arcade-chip";
  chip.dataset.game = meta.id;
  chip.style.setProperty("--accent", meta.accent);
  chip.innerHTML = `
    <span class="arcade-chip__code" aria-hidden="true">${meta.code}</span>
    <span class="arcade-chip__body">
      <b>${meta.title}</b>
      <small>${meta.tag} · REC <span data-chip-record>${pad(state.records?.[meta.id] || 0, 5)}</span></small>
    </span>
    <span class="arcade-chip__play" aria-hidden="true">▶</span>
  `;
  chip.setAttribute("aria-label", `Jogar ${meta.title}`);
  return chip;
}

export function createGameManager({
  config = {},
  audio = null,
  audioEngine = null,
  character = null,
  announce = () => {}
} = {}) {
  if (config?.features?.minigames === false) {
    return { open() {}, close() {}, destroy() {}, get active() { return null; } };
  }

  const controller = new AbortController();
  const { signal } = controller;
  const hud = createHud();
  const section = document.getElementById("tetris");
  let launcher = null;
  let grid = null;
  let levelEl = null;
  let coinsEl = null;
  let xpEl = null;
  let active = null;
  let openToken = 0;
  let konamiIndex = 0;
  let toastTimer = 0;

  function toast(message) {
    let node = document.querySelector(".arcade-toast");
    if (!node) {
      node = document.createElement("p");
      node.className = "arcade-toast";
      node.setAttribute("role", "status");
      document.body.append(node);
    }
    node.textContent = message;
    node.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => node.classList.remove("is-visible"), 2400);
  }

  function buildLauncher() {
    if (!section) return;
    launcher = document.createElement("div");
    launcher.className = "arcade-launcher";
    launcher.dataset.reveal = "";
    launcher.style.setProperty("--delay", "160ms");
    launcher.innerHTML = `
      <div class="arcade-launcher__head">
        <p class="arcade-launcher__kicker">NÍVEL 11.5 / ARCADE</p>
        <h3 class="arcade-launcher__title">Escolha um cartucho.</h3>
        <p class="arcade-launcher__meta">
          <span data-arcade-level>LVL 01</span>
          <span data-arcade-coins>◆ 000</span>
          <span data-arcade-xp>XP 000/120</span>
        </p>
      </div>
      <div class="arcade-launcher__grid" data-arcade-grid></div>
      <p class="arcade-launcher__hint">10 JOGOS · PROGRESSO SALVO LOCALMENTE · KONAMI ↑↑↓↓←→←→BA</p>
    `;
    grid = launcher.querySelector("[data-arcade-grid]");
    levelEl = launcher.querySelector("[data-arcade-level]");
    coinsEl = launcher.querySelector("[data-arcade-coins]");
    xpEl = launcher.querySelector("[data-arcade-xp]");

    const state = hud.getState();
    GAMES.forEach((meta) => {
      const chip = makeChip(meta, state);
      chip.addEventListener("click", () => open(meta.id), { signal });
      chip.addEventListener("pointerenter", () => audio?.hover?.(), { passive: true, signal });
      grid.append(chip);
    });

    (section.querySelector(".wrap") || section).append(launcher);
    updateLauncher(state);
  }

  function updateLauncher(state = hud.getState()) {
    if (!launcher) return;
    levelEl.textContent = `LVL ${pad(state.level)}`;
    coinsEl.textContent = `◆ ${pad(state.coins, 3)}`;
    xpEl.textContent = `XP ${pad(state.current, 3)}/${state.needed}`;
    grid?.querySelectorAll(".arcade-chip").forEach((chip) => {
      const record = chip.querySelector("[data-chip-record]");
      if (record) record.textContent = pad(state.records?.[chip.dataset.game] || 0, 5);
    });
  }

  function endGame(result = {}) {
    if (!active || active.ended) return;
    active.ended = true;
    const meta = active.meta;
    const score = Math.max(0, Math.round(Number(result.score) || 0));
    active.game?.pause?.();
    character?.setGameActive?.(false);

    const award = hud.award({
      game: meta.id,
      score,
      xp: result.xp,
      coins: result.coins,
      badge: result.badge || null
    });
    active.shell.setHud(award);
    active.shell.setRecord(award.records[meta.id] || score);
    active.shell.showGameOver({
      score,
      message: result.win ? "VITÓRIA!" : "GAME OVER",
      detail: `+${award.gainedXp} XP · +${award.gainedCoins} ◆${award.record ? " · NOVO RECORDE" : ""}`
    });
    audioEngine?.sfx(result.win ? "win" : "lose");
    character?.celebrateWin?.();
    announce(`${meta.title}: ${score} pontos. ${award.record ? "Novo recorde." : ""}`);
    window.dispatchEvent(
      new CustomEvent("agrvai:game-end", {
        detail: { id: meta.id, score, win: Boolean(result.win), award }
      })
    );
  }

  async function open(id) {
    const meta = gameById(id);
    if (!meta) return;
    close();
    const token = ++openToken;
    audio?.click?.();
    audioEngine?.sfx("click");
    window.dispatchEvent(new CustomEvent("agrvai:modal", { detail: { open: true } }));

    try {
      const module = await meta.load();
      if (token !== openToken) return;
      const shell = createGameShell({
        game: meta,
        hudState: hud.getState(),
        onClose: () => close(),
        onPause: (paused) => {
          if (!active || active.ended) return;
          if (paused) active.game?.pause?.();
          else active.game?.start?.();
        },
        onRetry: () => {
          const nextId = active?.meta?.id || meta.id;
          close();
          open(nextId);
        }
      });

      const api = {
        shell,
        stage: shell.stage,
        onResize: shell.onResize,
        setScore: shell.setScore,
        setStatus: shell.setStatus,
        setHint: shell.setHint,
        isPaused: shell.isPaused,
        sfx: (name) => audioEngine?.sfx(name),
        ui: audio,
        gameOver: (result) => endGame(result),
        win: (result) => endGame({ ...result, win: true }),
        character: {
          lookAt: (x, y) => character?.lookAt?.(x, y),
          celebrate: () => character?.celebrate?.(),
          jump: () => character?.jump?.(),
          setActive: (value) => character?.setGameActive?.(value)
        }
      };

      const game = module.createGame({ shell, api });
      active = { meta, module, game, shell, ended: false };
      character?.setGameActive?.(true);
      await game.init?.();
      if (token !== openToken) return;
      game.start?.();
      audioEngine?.sfx("power");
      announce(`${meta.title} iniciado.`);
      window.dispatchEvent(new CustomEvent("agrvai:game-open", { detail: { id: meta.id } }));
    } catch (error) {
      console.warn("[arcade] falha ao abrir o jogo", error);
      toast("CARTUCHO COM DEFEITO — TENTE OUTRO");
      close();
    }
  }

  function close() {
    openToken += 1;
    if (!active) {
      document.documentElement.classList.remove("is-arcade-open");
      window.dispatchEvent(new CustomEvent("agrvai:modal", { detail: { open: false } }));
      return;
    }
    const meta = active.meta;
    active.ended = true;
    try {
      active.game?.destroy?.();
    } catch (error) {
      console.warn("[arcade] destroy falhou", error);
    }
    active.shell?.destroy?.();
    active = null;
    character?.setGameActive?.(false);
    window.dispatchEvent(new CustomEvent("agrvai:modal", { detail: { open: false } }));
    window.dispatchEvent(new CustomEvent("agrvai:game-close", { detail: { id: meta.id } }));
  }

  function onKeydown(event) {
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    const expected = KONAMI[konamiIndex];
    if (key === expected) {
      konamiIndex += 1;
      if (konamiIndex >= KONAMI.length) {
        konamiIndex = 0;
        hud.award({
          game: "easter-egg",
          xp: 20,
          coins: 5,
          badge: "konami",
          message: "Código Konami"
        });
        toast("KONAMI! +5 MOEDAS · ABRINDO CARTUCHO");
        const meta = GAMES[Math.floor(Math.random() * GAMES.length)];
        open(meta.id);
      }
    } else {
      konamiIndex = key === KONAMI[0] ? 1 : 0;
    }
  }

  const onArcadeOpen = (event) => {
    open(event.detail?.id || GAMES[0].id);
  };
  const onHudUpdate = (event) => updateLauncher(event.detail);

  buildLauncher();
  document.addEventListener("keydown", onKeydown, { signal });
  window.addEventListener("agrvai:arcade-open", onArcadeOpen, { signal });
  window.addEventListener("agrvai:arcade-update", onHudUpdate, { signal });

  return {
    open,
    close,
    hud,
    get active() {
      return active?.meta?.id || null;
    },
    destroy() {
      controller.abort();
      window.clearTimeout(toastTimer);
      close();
      launcher?.remove();
      document.querySelector(".arcade-toast")?.remove();
      hud.destroy();
    }
  };
}
