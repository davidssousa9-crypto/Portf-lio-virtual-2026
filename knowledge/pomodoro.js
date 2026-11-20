/* ============================================================
   POMODORO — focus/rest cycles driven by timestamps, so a
   throttled tab cannot drift. The app owns rendering and XP.
   ============================================================ */

export function createPomodoro({
  focus = 25 * 60,
  rest = 5 * 60,
  onTick = null,
  onComplete = null,
  onModeChange = null
} = {}) {
  let mode = "focus";
  let remaining = focus;
  let running = false;
  let endAt = 0;
  let timer = 0;

  function state() {
    return {
      mode,
      remaining,
      running,
      total: mode === "focus" ? focus : rest
    };
  }

  function tick() {
    remaining = Math.max(0, Math.round((endAt - Date.now()) / 1000));
    onTick?.(state());
    if (remaining <= 0) finish();
  }

  function start() {
    if (running) return state();
    running = true;
    endAt = Date.now() + remaining * 1000;
    timer = window.setInterval(tick, 250);
    onTick?.(state());
    return state();
  }

  function pause() {
    if (!running) return state();
    remaining = Math.max(0, Math.round((endAt - Date.now()) / 1000));
    running = false;
    window.clearInterval(timer);
    timer = 0;
    onTick?.(state());
    return state();
  }

  function toggle() {
    return running ? pause() : start();
  }

  function reset() {
    window.clearInterval(timer);
    timer = 0;
    running = false;
    mode = "focus";
    remaining = focus;
    onModeChange?.(mode);
    onTick?.(state());
    return state();
  }

  function finish() {
    window.clearInterval(timer);
    timer = 0;
    running = false;
    const finished = mode;
    mode = finished === "focus" ? "rest" : "focus";
    remaining = mode === "focus" ? focus : rest;
    onComplete?.(finished);
    onModeChange?.(mode);
    onTick?.(state());
  }

  function skip() {
    window.clearInterval(timer);
    timer = 0;
    running = false;
    mode = mode === "focus" ? "rest" : "focus";
    remaining = mode === "focus" ? focus : rest;
    onModeChange?.(mode);
    onTick?.(state());
    return state();
  }

  onTick?.(state());

  return {
    start,
    pause,
    toggle,
    reset,
    skip,
    state,
    destroy() {
      window.clearInterval(timer);
      timer = 0;
      running = false;
    }
  };
}

export function formatClock(seconds) {
  const safe = Math.max(0, Math.round(seconds));
  return `${String(Math.floor(safe / 60)).padStart(2, "0")}:${String(safe % 60).padStart(2, "0")}`;
}
