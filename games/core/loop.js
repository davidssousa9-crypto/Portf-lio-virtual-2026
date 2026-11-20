/* ============================================================
   LOOP — small RAF helper with pause/resume and clamped dt.
   ============================================================ */

export function createLoop(update, { maxDelta = 0.05 } = {}) {
  let raf = 0;
  let last = 0;
  let running = false;

  function frame(now) {
    if (!running) return;
    const dt = Math.min(maxDelta, Math.max(0, (now - last) / 1000));
    last = now;
    update(dt, now);
    raf = window.requestAnimationFrame(frame);
  }

  return {
    start() {
      if (running) return;
      running = true;
      last = performance.now();
      raf = window.requestAnimationFrame(frame);
    },
    stop() {
      running = false;
      window.cancelAnimationFrame(raf);
      raf = 0;
    },
    get running() {
      return running;
    }
  };
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function rand(min, max) {
  return min + Math.random() * (max - min);
}

export function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}
