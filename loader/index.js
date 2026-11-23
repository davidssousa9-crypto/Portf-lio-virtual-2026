/* ============================================================
   AGRVAI BOOT LOADER — additive 8-bit boot sequence
   Emits `agrvai:loader-complete` on window when the reveal starts.
   ============================================================ */

import { getCharacterPixels } from "../character.js";

const SKIP_KEY = "agrvai-loader-skip";
const SESSION_KEY = "agrvai-booted";
const MIN_MS = 1800;
const MIN_REDUCED_MS = 260;
const KNOWLEDGE_MS = 900;
const MAX_MS = 5200;

const LOGS = [
  { at: 0, text: "Loading pixels..." },
  { at: 24, text: "Syncing modes..." },
  { at: 52, text: "Rendering 8-bit..." },
  { at: 78, text: "Loading audio..." },
  { at: 96, text: "Ready." }
];

const BLOCK_COLORS = ["#BCED12", "#12C2ED", "#ED3D91", "#894AED", "#ED7812", "#F6C53A"];

function alreadyDone(detail = {}) {
  window.__agrvaiLoaderDone = true;
  window.dispatchEvent(
    new CustomEvent("agrvai:loader-complete", { detail: { skipped: true, ...detail } })
  );
}

function skipReason() {
  try {
    if (window.localStorage.getItem(SKIP_KEY) === "1") return "preference";
    if (window.sessionStorage.getItem(SESSION_KEY) === "1") return "session";
  } catch {
    /* storage can be blocked */
  }
  return null;
}

function pacmanSVG() {
  return `
    <svg viewBox="0 0 16 16" width="100%" height="100%" shape-rendering="crispEdges" aria-hidden="true">
      <path d="M7 0h4v1h2v1h2v2h1v2h-1v2h-1v2h-2v1H9v1H5v-1H3v-1H1v-2H0V6h1V4h2V2h2V1h2z" fill="#F6C53A"/>
      <rect x="8" y="6" width="8" height="4" fill="#121212"/>
      <rect x="9" y="6" width="7" height="4" fill="#F6C53A"/>
      <rect x="6" y="3" width="1" height="1" fill="#121212"/>
    </svg>
  `;
}

function ghostSVG() {
  return `
    <svg viewBox="0 0 16 16" width="100%" height="100%" shape-rendering="crispEdges" aria-hidden="true">
      <path d="M3 2h10v1h1v1h1v10h-2v-1h-1v1H9v-1H7v1H5v-1H4v1H2V4h1V3h1V2z" fill="#ED3D91"/>
      <rect x="4" y="5" width="3" height="3" fill="#FFFFFF"/>
      <rect x="9" y="5" width="3" height="3" fill="#FFFFFF"/>
      <rect x="5" y="6" width="1" height="1" fill="#121212"/>
      <rect x="10" y="6" width="1" height="1" fill="#121212"/>
      <rect x="4" y="11" width="2" height="1" fill="#FFFFFF"/>
      <rect x="8" y="11" width="2" height="1" fill="#FFFFFF"/>
      <rect x="12" y="11" width="1" height="1" fill="#FFFFFF"/>
    </svg>
  `;
}

function makeTetris(container) {
  const cols = 12;
  const rows = 9;
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const block = document.createElement("span");
      block.style.setProperty("--x", String(col));
      block.style.setProperty("--y", String(row));
      block.style.setProperty("--c", BLOCK_COLORS[(col + row * 3) % BLOCK_COLORS.length]);
      block.style.setProperty("--d", `${((col + row) % 7) * 26}ms`);
      container.append(block);
    }
  }
}

export function initLoader({ config = {}, reducedMotion = false } = {}) {
  const enabled = config?.features?.loader !== false;
  if (!enabled) {
    alreadyDone({ reason: "disabled" });
    return { destroy() {}, done: true };
  }

  const reason = skipReason();
  if (reason || window.__agrvaiLoaderDone) {
    alreadyDone({ reason: reason || "preference" });
    return { destroy() {}, done: true };
  }

  const overlay = document.createElement("div");
  overlay.className = "agrvai-loader";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-label", "Carregando o portfolio AGRVAI");
  overlay.innerHTML = `
    <div class="agrvai-loader__scan" aria-hidden="true"></div>
    <div class="agrvai-loader__tetris" aria-hidden="true"></div>
    <section class="agrvai-loader__panel">
      <p class="agrvai-loader__topline">
        <span>AGRVAI // BOOT.SYS</span>
        <span class="agrvai-loader__signal" aria-hidden="true"></span>
      </p>

      <div class="agrvai-loader__grid">
        <div class="agrvai-loader__visual">
          <canvas class="agrvai-loader__portrait" width="224" height="240" aria-hidden="true"></canvas>
          <span class="agrvai-loader__caption">CHARACTER.SYS</span>
        </div>

        <div class="agrvai-loader__content">
          <p class="agrvai-loader__logo">AGRVAI</p>
          <p class="agrvai-loader__tagline">PORTFOLIO 8-BIT / BOOT SEQUENCE</p>

          <div class="agrvai-loader__log" data-loader-log aria-hidden="true"></div>

          <div class="agrvai-loader__bar" role="progressbar" aria-label="Progresso do carregamento" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" style="--p:0">
            <span class="agrvai-loader__fill" data-loader-fill></span>
            <span class="agrvai-loader__ticks" aria-hidden="true"></span>
            <span class="agrvai-loader__pacman" data-loader-pac aria-hidden="true">${pacmanSVG()}</span>
            <span class="agrvai-loader__ghost" data-loader-ghost aria-hidden="true">${ghostSVG()}</span>
          </div>

          <div class="agrvai-loader__readout">
            <p class="agrvai-loader__status" data-loader-status aria-live="polite">Loading pixels...</p>
            <p class="agrvai-loader__percent"><span data-loader-percent>000</span><span aria-hidden="true">%</span></p>
          </div>
        </div>
      </div>

      <div class="agrvai-loader__footer">
        <p class="agrvai-loader__hint">CARREGANDO EXPERIENCIA 8-BIT<span class="agrvai-loader__caret" aria-hidden="true">_</span></p>
        <button class="agrvai-loader__skip" type="button" data-loader-skip>PULAR <span>[ESC]</span></button>
        <button class="agrvai-loader__start" type="button" data-loader-start hidden>PRESS START <span aria-hidden="true">▶</span></button>
      </div>
    </section>
  `;

  document.body.append(overlay);
  document.documentElement.classList.add("is-loader-active");

  const panel = overlay.querySelector(".agrvai-loader__panel");
  panel.setAttribute("tabindex", "-1");
  panel.focus({ preventScroll: true });

  const bar = overlay.querySelector(".agrvai-loader__bar");
  const fill = overlay.querySelector("[data-loader-fill]");
  const percentEl = overlay.querySelector("[data-loader-percent]");
  const statusEl = overlay.querySelector("[data-loader-status]");
  const logEl = overlay.querySelector("[data-loader-log]");
  const skipButton = overlay.querySelector("[data-loader-skip]");
  const startButton = overlay.querySelector("[data-loader-start]");
  const pac = overlay.querySelector("[data-loader-pac]");
  const ghost = overlay.querySelector("[data-loader-ghost]");
  makeTetris(overlay.querySelector(".agrvai-loader__tetris"));

  const reduced = Boolean(reducedMotion);
  const isKnowledge = window.location.pathname.includes("/conhecimento");
  const minMs = reduced ? MIN_REDUCED_MS : isKnowledge ? KNOWLEDGE_MS : MIN_MS;
  const startedAt = performance.now();
  const keyController = new AbortController();

  const portrait = overlay.querySelector(".agrvai-loader__portrait");
  const portraitCtx = portrait.getContext("2d");
  portraitCtx.imageSmoothingEnabled = false;
  const CELL = 8;
  const pixels = getCharacterPixels("creative");
  let seed = 1337;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let i = pixels.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [pixels[i], pixels[j]] = [pixels[j], pixels[i]];
  }
  let shownPixels = 0;

  function drawPortrait(count) {
    const clamped = Math.max(0, Math.min(pixels.length, count));
    if (clamped === shownPixels) return;
    if (clamped < shownPixels) {
      portraitCtx.clearRect(0, 0, portrait.width, portrait.height);
      shownPixels = 0;
    }
    /* Paint only what is new: the final progress jump used to repaint
       the whole portrait in a single long task. */
    for (let i = shownPixels; i < clamped; i += 1) {
      const pixel = pixels[i];
      portraitCtx.fillStyle = pixel.color;
      portraitCtx.fillRect(pixel.x * CELL, pixel.y * CELL, CELL, CELL);
    }
    shownPixels = clamped;
  }

  let progress = 0;
  let shownPercent = -1;
  let stepIndex = -1;
  let typedIndex = -1;
  let typeTimer = 0;
  let ready = false;
  let finished = false;
  let raf = 0;
  let removeTimer = 0;
  let revealTimer = 0;
  let readyTimer = 0;
  let blinkTimer = 0;
  let eatTimer = 0;
  let autoTimer = 0;
  let startShown = false;
  let eaten = false;

  function typeLine(text) {
    window.clearInterval(typeTimer);
    let index = 0;
    statusEl.textContent = "";
    typeTimer = window.setInterval(() => {
      index += 1;
      statusEl.textContent = text.slice(0, index);
      if (index >= text.length) window.clearInterval(typeTimer);
    }, 18);
  }

  function pushLog(text) {
    const line = document.createElement("span");
    line.textContent = `> ${text}`;
    logEl.append(line);
    while (logEl.childElementCount > 4) logEl.firstElementChild?.remove();
  }

  function setProgress(value) {
    progress = Math.max(0, Math.min(100, value));
    fill.style.width = `${progress}%`;
    bar.style.setProperty("--p", String(progress));
    bar.setAttribute("aria-valuenow", String(Math.round(progress)));

    const percent = String(Math.round(progress)).padStart(3, "0");
    if (shownPercent !== Math.round(progress)) {
      shownPercent = Math.round(progress);
      percentEl.textContent = percent;
    }

    let nextStep = 0;
    for (let i = 0; i < LOGS.length; i += 1) {
      if (progress >= LOGS[i].at) nextStep = i;
    }
    if (nextStep !== stepIndex) {
      if (stepIndex >= 0 && LOGS[stepIndex]) pushLog(LOGS[stepIndex].text);
      stepIndex = nextStep;
      typedIndex = nextStep;
      typeLine(LOGS[nextStep].text);
    }

    const revealCount = Math.floor((progress / 100) * pixels.length);
    drawPortrait(revealCount);

    if (progress >= 94) overlay.classList.add("is-ready");
    if (progress >= 99.5 && ready && !eaten) {
      eaten = true;
      window.clearTimeout(eatTimer);
      eatTimer = window.setTimeout(() => {
        ghost.classList.add("is-eaten");
        pac.classList.add("is-eaten");
      }, 360);
    }
  }

  function markReady() {
    if (ready) return;
    ready = true;
    if (progress >= 99.5) setProgress(100);
  }

  /* Real work: fonts, document load, images, one paint and sprite map. */
  const tasks = [];
  if (document.fonts?.ready) tasks.push(document.fonts.ready.catch(() => {}));
  if (document.readyState === "complete") tasks.push(Promise.resolve());
  else {
    tasks.push(
      new Promise((resolve) => {
        window.addEventListener("load", resolve, { once: true, signal: keyController.signal });
      })
    );
  }
  [...document.images].forEach((image) => {
    if (image.complete) return;
    if (typeof image.decode === "function") tasks.push(image.decode().catch(() => {}));
    else {
      tasks.push(
        new Promise((resolve) => {
          image.addEventListener("load", resolve, { once: true });
          image.addEventListener("error", resolve, { once: true });
        })
      );
    }
  });
  tasks.push(
    new Promise((resolve) => {
      window.requestAnimationFrame(() => window.requestAnimationFrame(resolve));
    })
  );
  tasks.push(Promise.resolve()); // sprite map is already built synchronously
  let resolved = 0;
  tasks.forEach((task) => {
    Promise.resolve(task).finally(() => {
      resolved += 1;
      if (resolved >= tasks.length) markReady();
    });
  });
  readyTimer = window.setTimeout(markReady, MAX_MS - 500);

  function reveal() {
    document.documentElement.classList.remove("is-loader-active");
    window.__agrvaiLoaderDone = true;
    try {
      window.sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      /* storage can be blocked */
    }
    window.dispatchEvent(
      new CustomEvent("agrvai:loader-complete", {
        detail: { skipped: false, reason: "ready", duration: Math.round(performance.now() - startedAt) }
      })
    );
  }

  function leave(skipped = false) {
    if (finished) return;
    finished = true;
    window.clearInterval(typeTimer);
    window.cancelAnimationFrame(raf);
    window.clearTimeout(readyTimer);
    window.clearTimeout(blinkTimer);
    window.clearTimeout(eatTimer);
    window.clearTimeout(autoTimer);
    setProgress(100);
    overlay.classList.add("is-complete");
    startButton.hidden = true;
    skipButton.disabled = true;

    if (reduced) {
      overlay.classList.add("is-out");
      window.setTimeout(() => {
        reveal();
        overlay.remove();
      }, 180);
      return;
    }

    overlay.classList.add("is-exiting");
    revealTimer = window.setTimeout(() => {
      overlay.classList.add("is-sinking");
      reveal();
    }, skipped ? 380 : 720);
    removeTimer = window.setTimeout(() => {
      keyController.abort();
      overlay.remove();
    }, skipped ? 900 : 1450);
  }

  function frame(now) {
    if (finished) return;
    const elapsed = now - startedAt;
    const t = Math.min(1, elapsed / minMs);
    const eased = 1 - Math.pow(1 - t, 3);
    const taskRatio = tasks.length ? resolved / tasks.length : 1;
    let target = 6 + eased * 82;
    if (taskRatio > 0) target = Math.max(target, 6 + taskRatio * 86);
    if (ready && elapsed >= minMs * 0.8) target = Math.max(target, 94);
    if (ready && elapsed >= minMs) target = 100;
    if (elapsed >= MAX_MS) target = 100;

    const delta = target - progress;
    if (delta > 0) setProgress(progress + Math.max(0.35, delta * 0.16));

    if (progress >= 99.6 && (ready || elapsed >= MAX_MS)) {
      overlay.classList.add("is-ready");
      if (!startShown) {
        startShown = true;
        if (isKnowledge) {
          /* Study pages get a short, self-running boot. */
          autoTimer = window.setTimeout(() => leave(false), reduced ? 120 : 180);
        } else {
          window.setTimeout(() => {
            if (finished) return;
            startButton.hidden = false;
            startButton.focus({ preventScroll: true });
          }, 520);
          autoTimer = window.setTimeout(
            () => leave(false),
            reduced ? 900 : 1800
          );
        }
      }
    }
    raf = window.requestAnimationFrame(frame);
  }

  function unlockAudio() {
    window.dispatchEvent(new CustomEvent("agrvai:audio-unlock"));
  }

  function onKeydown(event) {
    if (event.key === "Escape") {
      event.preventDefault();
      unlockAudio();
      leave(true);
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      if (document.activeElement === skipButton) return;
      event.preventDefault();
      unlockAudio();
      leave(true);
      return;
    }
    if (event.key === "Tab") {
      const focusables = [startButton.hidden ? null : startButton, skipButton].filter(Boolean);
      if (!focusables.length) return;
      const current = focusables.indexOf(document.activeElement);
      const next = event.shiftKey
        ? (current - 1 + focusables.length) % focusables.length
        : (current + 1) % focusables.length;
      event.preventDefault();
      focusables[next].focus();
    }
  }

  function onFirstGesture() {
    unlockAudio();
  }

  skipButton.addEventListener("click", () => leave(true));
  startButton.addEventListener("click", () => {
    unlockAudio();
    leave(false);
  });
  overlay.addEventListener("pointerdown", onFirstGesture, { once: true });
  document.addEventListener("keydown", onKeydown, { signal: keyController.signal });

  setProgress(0);
  raf = window.requestAnimationFrame(frame);

  return {
    element: overlay,
    done: false,
    skip: () => leave(true),
    destroy() {
      finished = true;
      window.clearInterval(typeTimer);
      window.cancelAnimationFrame(raf);
      window.clearTimeout(removeTimer);
      window.clearTimeout(revealTimer);
      window.clearTimeout(readyTimer);
      window.clearTimeout(blinkTimer);
      window.clearTimeout(eatTimer);
      window.clearTimeout(autoTimer);
      keyController.abort();
      document.documentElement.classList.remove("is-loader-active");
      overlay.remove();
    }
  };
}
