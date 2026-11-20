/* ============================================================
   AUDIO.JS — square-wave arcade kit.
   Starts muted, persists the preference, and only ever makes
   sound after a real user gesture.
   ============================================================ */

export function createAudio({
  volume = 0.4,
  mutedByDefault = true,
  storageKey = "agrvai-sound-enabled",
  config = {}
} = {}) {
  const settings = {
    hover: { freq: 880, duration: 0.04, gain: 0.018 },
    click: { from: 660, to: 990, duration: 0.08, gain: 0.04 },
    mode: [523.25, 659.25, 783.99, 1046.5],
    modeNote: 0.06,
    waka: [300, 200],
    wakaDuration: 0.06,
    wakaGain: 0.035,
    ...config
  };

  let audioContext = null;
  let master = null;
  let enabled = !mutedByDefault;
  let unlocked = false;
  let lastHover = 0;
  let lastWaka = 0;
  let wakaFlip = 0;

  const AudioCtor = window.AudioContext || window.webkitAudioContext;

  try {
    const stored = window.localStorage.getItem(storageKey);
    if (stored === "1") enabled = true;
    if (stored === "0") enabled = false;
  } catch {
    /* storage can be blocked; default mute wins */
  }

  function persist() {
    try {
      window.localStorage.setItem(storageKey, enabled ? "1" : "0");
    } catch {
      /* persistence is a nice-to-have */
    }
  }

  function ensure() {
    if (!AudioCtor) return null;
    if (!audioContext) {
      try {
        audioContext = new AudioCtor();
        master = audioContext.createGain();
        master.gain.value = volume;
        master.connect(audioContext.destination);
      } catch {
        audioContext = null;
      }
    }
    return audioContext;
  }

  function unlock() {
    if (unlocked) return;
    const ac = ensure();
    if (!ac) return;
    unlocked = true;
    if (ac.state === "suspended") ac.resume().catch(() => {});
    window.dispatchEvent(new CustomEvent("agrvai:audio-unlock"));
  }

  const unlockEvents = ["pointerdown", "keydown", "touchstart"];
  const onFirstGesture = () => {
    unlock();
    unlockEvents.forEach((type) =>
      window.removeEventListener(type, onFirstGesture)
    );
  };
  unlockEvents.forEach((type) =>
    window.addEventListener(type, onFirstGesture, { passive: true })
  );

  function tone({
    from = 660,
    to = null,
    duration = 0.06,
    delay = 0,
    type = "square",
    gain = 0.04
  } = {}) {
    if (!enabled || !unlocked) return;
    const ac = ensure();
    if (!ac || !master) return;
    try {
      const start = ac.currentTime + delay;
      const osc = ac.createOscillator();
      const env = ac.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(from, start);
      if (to) osc.frequency.linearRampToValueAtTime(to, start + duration);
      env.gain.setValueAtTime(0.0001, start);
      env.gain.exponentialRampToValueAtTime(gain, start + 0.008);
      env.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      osc.connect(env);
      env.connect(master);
      osc.start(start);
      osc.stop(start + duration + 0.02);
    } catch {
      /* audio is a nice-to-have, never a crash */
    }
  }

  function hover() {
    if (!enabled) return;
    const now = performance.now();
    if (now - lastHover < 70) return;
    lastHover = now;
    tone({
      from: settings.hover.freq,
      duration: settings.hover.duration,
      gain: settings.hover.gain
    });
  }

  function click() {
    tone({
      from: settings.click.from,
      to: settings.click.to,
      duration: settings.click.duration,
      gain: settings.click.gain
    });
  }

  function back() {
    tone({ from: 420, to: 320, duration: 0.05, type: "triangle", gain: 0.03 });
  }

  function modeSwitch() {
    settings.mode.forEach((freq, index) => {
      tone({
        from: freq,
        duration: settings.modeNote,
        delay: index * settings.modeNote,
        gain: 0.038
      });
    });
  }

  function waka() {
    if (!enabled) return;
    const now = performance.now();
    if (now - lastWaka < 80) return;
    lastWaka = now;
    const freq = settings.waka[wakaFlip % settings.waka.length];
    wakaFlip += 1;
    tone({
      from: freq,
      duration: settings.wakaDuration,
      gain: settings.wakaGain
    });
  }

  function success() {
    [783.99, 1046.5, 1318.5].forEach((freq, index) => {
      tone({ from: freq, duration: 0.1, delay: index * 0.07, type: "triangle", gain: 0.04 });
    });
  }

  function error() {
    tone({ from: 190, to: 120, duration: 0.14, type: "sawtooth", gain: 0.032 });
  }

  function setEnabled(value, { silent = false } = {}) {
    enabled = Boolean(value);
    persist();
    if (enabled) {
      unlock();
      if (!silent) click();
    }
    window.dispatchEvent(
      new CustomEvent("agrvai:sound-change", { detail: { enabled } })
    );
    return enabled;
  }

  function toggle() {
    unlock();
    if (!enabled) {
      setEnabled(true);
    } else {
      setEnabled(false);
    }
    return enabled;
  }

  return {
    unlock,
    click,
    hover,
    back,
    modeSwitch,
    waka,
    success,
    error,
    setEnabled,
    toggle,
    isEnabled: () => enabled,
    isMuted: () => !enabled
  };
}
