/* ============================================================
   AGRVAI BOOT LOADER — additive overlay
   Shows a short 8-bit boot sequence, then emits
   `agrvai:loader-complete` on window.
   ============================================================ */

import "./styles.css";

const SKIP_KEY = "agrvai-loader-skip";
const MIN_MS = 1450;
const MIN_REDUCED_MS = 260;
const MAX_MS = 4600;

const STEPS = [
  { at: 0, label: "ACENDENDO O FLIPERAMA" },
  { at: 24, label: "CARREGANDO SPRITES" },
  { at: 52, label: "CALIBRANDO PIXELS" },
  { at: 76, label: "LIGANDO O SOM" },
  { at: 96, label: "PRONTO" }
];

function alreadyDone(detail = {}) {
  window.__agrvaiLoaderDone = true;
  window.dispatchEvent(
    new CustomEvent("agrvai:loader-complete", { detail: { skipped: true, ...detail } })
  );
}

function canSkip() {
  try {
    return window.localStorage.getItem(SKIP_KEY) === "1";
  } catch {
    return false;
  }
}

export function initLoader({ config = {}, reducedMotion = false } = {}) {
  const enabled = config?.features?.loader !== false;
  if (!enabled) {
    alreadyDone({ reason: "disabled" });
    return { destroy() {}, done: true };
  }

  if (canSkip() || window.__agrvaiLoaderDone) {
    alreadyDone({ reason: "preference" });
    return { destroy() {}, done: true };
  }

  const overlay = document.createElement("div");
  overlay.className = "agrvai-loader";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-label", "Carregando o portfólio AGRVAI");
  overlay.innerHTML = `
    <div class="agrvai-loader__scan" aria-hidden="true"></div>
    <section class="agrvai-loader__panel">
      <p class="agrvai-loader__topline">
        <span>AGRVAI // SISTEMA</span>
        <span class="agrvai-loader__signal" aria-hidden="true"></span>
      </p>
      <p class="agrvai-loader__logo">AGRVAI</p>
      <p class="agrvai-loader__tagline">PORTFÓLIO 8-BIT / BOOT SEQUENCE</p>

      <div class="agrvai-loader__bar" role="progressbar" aria-label="Progresso do carregamento" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
        <span class="agrvai-loader__fill" data-loader-fill></span>
        <span class="agrvai-loader__ticks" aria-hidden="true"></span>
      </div>

      <div class="agrvai-loader__readout">
        <p class="agrvai-loader__status" data-loader-status aria-live="polite">ACENDENDO O FLIPERAMA</p>
        <p class="agrvai-loader__percent"><span data-loader-percent>000</span><span aria-hidden="true">%</span></p>
      </div>

      <div class="agrvai-loader__footer">
        <p class="agrvai-loader__hint">CARREGANDO EXPERIÊNCIA 8-BIT<span class="agrvai-loader__caret" aria-hidden="true">_</span></p>
        <button class="agrvai-loader__skip" type="button" data-loader-skip>PULAR <span>[ESC]</span></button>
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
  const skipButton = overlay.querySelector("[data-loader-skip]");

  const reduced = Boolean(reducedMotion);
  const minMs = reduced ? MIN_REDUCED_MS : MIN_MS;
  const startedAt = performance.now();
  const keyController = new AbortController();

  let progress = 0;
  let shownPercent = -1;
  let stepIndex = -1;
  let ready = false;
  let finished = false;
  let raf = 0;
  let removeTimer = 0;
  let fadeTimer = 0;
  let readyTimer = 0;

  function setProgress(value) {
    progress = Math.max(0, Math.min(100, value));
    fill.style.width = `${progress}%`;
    bar.setAttribute("aria-valuenow", String(Math.round(progress)));

    const percent = String(Math.round(progress)).padStart(3, "0");
    if (percent !== String(shownPercent).padStart(3, "0")) {
      shownPercent = Math.round(progress);
      percentEl.textContent = percent;
    }

    let nextStep = 0;
    for (let i = 0; i < STEPS.length; i += 1) {
      if (progress >= STEPS[i].at) nextStep = i;
    }
    if (nextStep !== stepIndex) {
      stepIndex = nextStep;
      statusEl.textContent = STEPS[nextStep].label;
    }
  }

  function markReady() {
    ready = true;
  }

  if (document.readyState === "complete") markReady();
  else window.addEventListener("load", markReady, { once: true, signal: keyController.signal });
  document.fonts?.ready.then(markReady).catch(() => {});
  readyTimer = window.setTimeout(markReady, MAX_MS - 400);

  function leave(skipped = false) {
    if (finished) return;
    finished = true;
    window.cancelAnimationFrame(raf);
    window.clearTimeout(removeTimer);
    window.clearTimeout(fadeTimer);
    setProgress(100);

    overlay.classList.add("is-complete");
    document.documentElement.classList.remove("is-loader-active");

    const duration = Math.round(performance.now() - startedAt);
    window.__agrvaiLoaderDone = true;

    const outDelay = reduced || skipped ? 0 : 340;
    fadeTimer = window.setTimeout(() => {
      overlay.classList.add("is-out");
      window.dispatchEvent(
        new CustomEvent("agrvai:loader-complete", {
          detail: { skipped, reason: skipped ? "user" : "ready", duration }
        })
      );
      removeTimer = window.setTimeout(() => {
        keyController.abort();
        overlay.remove();
      }, reduced ? 20 : 560);
    }, outDelay);

    skipButton.disabled = true;
  }

  function frame(now) {
    if (finished) return;
    const elapsed = now - startedAt;
    const t = Math.min(1, elapsed / minMs);
    const eased = 1 - Math.pow(1 - t, 3);
    let target = 8 + eased * 84;
    if (ready && elapsed >= minMs * 0.8) target = Math.max(target, 94);
    if (ready && elapsed >= minMs) target = 100;
    if (elapsed >= MAX_MS) target = 100;

    const delta = target - progress;
    if (delta > 0) setProgress(progress + Math.max(0.35, delta * 0.16));

    if (progress >= 99.6 && (ready || elapsed >= MAX_MS)) {
      leave(false);
      return;
    }
    raf = window.requestAnimationFrame(frame);
  }

  function onKeydown(event) {
    if (event.key === "Escape") {
      event.preventDefault();
      leave(true);
      return;
    }
    if (event.key === "Tab") {
      event.preventDefault();
      skipButton.focus();
    }
  }

  skipButton.addEventListener("click", () => leave(true));
  document.addEventListener("keydown", onKeydown, { signal: keyController.signal });

  setProgress(0);
  raf = window.requestAnimationFrame(frame);

  return {
    element: overlay,
    done: false,
    skip: () => leave(true),
    destroy() {
      finished = true;
      window.cancelAnimationFrame(raf);
      window.clearTimeout(removeTimer);
      window.clearTimeout(fadeTimer);
      window.clearTimeout(readyTimer);
      keyController.abort();
      document.documentElement.classList.remove("is-loader-active");
      overlay.remove();
    }
  };
}
