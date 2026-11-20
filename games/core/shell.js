/* ============================================================
   ARCADE SHELL — retro window, HUD strip, pause, game-over and
   focus management shared by every mini-game.
   ============================================================ */

import { xpProgress } from "./hud.js";

function pad(value, size = 2) {
  return String(Math.max(0, Math.round(Number(value) || 0))).padStart(size, "0");
}

export function createGameShell({
  game,
  hudState,
  onClose = null,
  onPause = null,
  onRetry = null
} = {}) {
  const controller = new AbortController();
  const { signal } = controller;
  const previousFocus = document.activeElement;
  const resizeCallbacks = new Set();

  const overlay = document.createElement("div");
  overlay.className = "arcade";
  overlay.dataset.game = game.id;
  overlay.style.setProperty("--arcade-accent", game.accent || "var(--lime)");
  overlay.innerHTML = `
    <div class="arcade__backdrop" data-arcade-backdrop></div>
    <section class="arcade-window" role="dialog" aria-modal="true" aria-labelledby="arcadeTitle" tabindex="-1">
      <header class="arcade-window__bar">
        <span class="arcade-window__title" id="arcadeTitle">
          <i class="arcade-window__led" aria-hidden="true"></i>
          ARCADE.EXE <span>/</span> ${game.title}
        </span>
        <span class="arcade-window__controls">
          <button type="button" class="arcade-window__btn" data-arcade-pause aria-label="Pausar jogo" title="Pausar (P)">II</button>
          <button type="button" class="arcade-window__btn" data-arcade-close aria-label="Fechar jogo" title="Fechar (ESC)">×</button>
        </span>
      </header>

      <div class="arcade-hud" aria-label="Progresso do jogador">
        <span class="arcade-hud__lvl">LVL <b data-hud-level>01</b></span>
        <span class="arcade-hud__xp" title="Experiência">
          <i data-hud-xp style="--xp:0"></i>
        </span>
        <span class="arcade-hud__coins" title="Moedas">◆ <b data-hud-coins>000</b></span>
        <span class="arcade-hud__score">SCORE <b data-hud-score>00000</b></span>
        <span class="arcade-hud__record">REC <b data-hud-record>00000</b></span>
      </div>

      <div class="arcade-window__screen">
        <div class="arcade-stage" data-arcade-stage></div>
        <div class="arcade-over" data-arcade-over hidden>
          <p class="arcade-over__title" data-arcade-over-title>GAME OVER</p>
          <p class="arcade-over__score">SCORE <b data-arcade-final>0</b></p>
          <p class="arcade-over__reward" data-arcade-reward></p>
          <div class="arcade-over__actions">
            <button type="button" class="pixel-btn pixel-btn--solid" data-arcade-retry>INSERT COIN <span aria-hidden="true">▶</span></button>
            <button type="button" class="pixel-btn" data-arcade-exit>SAIR</button>
          </div>
        </div>
      </div>

      <footer class="arcade-window__foot">
        <p class="arcade-window__status" data-arcade-status aria-live="polite">${game.subtitle || "PRONTO."}</p>
        <p class="arcade-window__hint" data-arcade-hint>${game.hint || "SETAS / TOQUE · P PAUSA · ESC FECHA"}</p>
      </footer>
    </section>
  `;

  document.body.append(overlay);
  document.documentElement.classList.add("is-arcade-open");

  const windowNode = overlay.querySelector(".arcade-window");
  const stage = overlay.querySelector("[data-arcade-stage]");
  const over = overlay.querySelector("[data-arcade-over]");
  const overTitle = overlay.querySelector("[data-arcade-over-title]");
  const finalScore = overlay.querySelector("[data-arcade-final]");
  const reward = overlay.querySelector("[data-arcade-reward]");
  const status = overlay.querySelector("[data-arcade-status]");
  const hint = overlay.querySelector("[data-arcade-hint]");
  const scoreEl = overlay.querySelector("[data-hud-score]");
  const recordEl = overlay.querySelector("[data-hud-record]");
  const levelEl = overlay.querySelector("[data-hud-level]");
  const xpEl = overlay.querySelector("[data-hud-xp]");
  const coinsEl = overlay.querySelector("[data-hud-coins]");
  const pauseBtn = overlay.querySelector("[data-arcade-pause]");
  const retryBtn = overlay.querySelector("[data-arcade-retry]");

  let paused = false;
  let overState = null;

  function setHud(state) {
    if (!state) return;
    const level = state.level || xpProgress(state.xp || 0).level;
    levelEl.textContent = pad(level);
    const ratio = Number(state.ratio ?? 0);
    xpEl.style.setProperty("--xp", String(Math.max(0, Math.min(1, ratio))));
    coinsEl.textContent = pad(state.coins, 3);
    recordEl.textContent = pad(state.records?.[game.id] || 0, 5);
  }

  function setScore(value) {
    scoreEl.textContent = pad(value, 5);
  }

  function setRecord(value) {
    recordEl.textContent = pad(value, 5);
  }

  function setStatus(text) {
    status.textContent = text;
  }

  function setHint(text) {
    hint.textContent = text;
  }

  function setPaused(value) {
    paused = Boolean(value);
    pauseBtn.textContent = paused ? "▶" : "II";
    pauseBtn.setAttribute("aria-label", paused ? "Continuar jogo" : "Pausar jogo");
    overlay.classList.toggle("is-paused", paused);
    if (paused) setStatus("PAUSADO — P PARA CONTINUAR");
    onPause?.(paused);
  }

  function togglePause() {
    if (overState) return;
    setPaused(!paused);
  }

  function showGameOver({ score = 0, message = "GAME OVER", detail = "" } = {}) {
    overState = { score, message };
    setPaused(false);
    over.hidden = false;
    overTitle.textContent = message;
    finalScore.textContent = pad(score, 5);
    reward.textContent = detail;
    setScore(score);
    setStatus(message);
    retryBtn.focus({ preventScroll: true });
  }

  function hideGameOver() {
    overState = null;
    over.hidden = true;
    reward.textContent = "";
    windowNode.focus({ preventScroll: true });
  }

  function onResize(callback) {
    resizeCallbacks.add(callback);
    return () => resizeCallbacks.delete(callback);
  }

  const observer = new ResizeObserver(() => {
    resizeCallbacks.forEach((callback) => {
      try {
        callback(stage.clientWidth, stage.clientHeight);
      } catch (error) {
        console.warn("[arcade] resize callback failed", error);
      }
    });
  });
  observer.observe(stage);

  function focusables() {
    return Array.from(
      windowNode.querySelectorAll(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ).filter((node) => node.getClientRects().length > 0 && !node.closest("[hidden]"));
  }

  function onKeydown(event) {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose?.();
      return;
    }
    if (event.key === "p" || event.key === "P") {
      if (event.target instanceof HTMLInputElement) return;
      event.preventDefault();
      togglePause();
      return;
    }
    if (event.key !== "Tab") return;
    const nodes = focusables();
    if (!nodes.length) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  overlay.querySelector("[data-arcade-close]").addEventListener("click", () => onClose?.(), { signal });
  overlay.querySelector("[data-arcade-exit]").addEventListener("click", () => onClose?.(), { signal });
  overlay.querySelector("[data-arcade-backdrop]").addEventListener("click", () => onClose?.(), { signal });
  pauseBtn.addEventListener("click", togglePause, { signal });
  retryBtn.addEventListener("click", () => {
    hideGameOver();
    onRetry?.();
  }, { signal });
  document.addEventListener("keydown", onKeydown, { signal });

  setHud(hudState);
  setScore(0);
  windowNode.focus({ preventScroll: true });

  return {
    overlay,
    stage,
    setHud,
    setScore,
    setRecord,
    setStatus,
    setHint,
    setPaused,
    showGameOver,
    hideGameOver,
    onResize,
    isPaused: () => paused,
    destroy() {
      controller.abort();
      observer.disconnect();
      resizeCallbacks.clear();
      overlay.remove();
      document.documentElement.classList.remove("is-arcade-open");
      if (previousFocus instanceof HTMLElement) previousFocus.focus({ preventScroll: true });
    }
  };
}
