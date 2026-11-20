/* ============================================================
   AUDIO ENGINE — Howler music bed + zzfx sound effects.
   Shares the existing `agrvai-sound-enabled` preference and only
   starts after a real gesture. Safe to instantiate on any page.
   ============================================================ */

import { Howl } from "howler";
import { zzfx } from "zzfx";

const STORAGE_KEY = "agrvai-sound-enabled";

/* zzfx parameter presets: volume, randomness, frequency, attack,
   sustain, release, shape, curve, slide, delta, jump, jumpTime,
   repeat, noise, modulation, bitCrush, delay, sustainVol, decay */
const SFX = {
  click: [0.7, 0, 740, 0, 0.01, 0.06, 1, 1.5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.5, 0.03],
  coin: [0.8, 0, 880, 0, 0.01, 0.13, 1, 1.6, 0, 0, 520, 0.05, 0, 0, 0, 0, 0, 0.6, 0.05],
  jump: [0.7, 0, 420, 0, 0.01, 0.12, 1, 1.4, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0.5, 0.04],
  hit: [0.9, 0, 170, 0, 0.01, 0.16, 3, 1, 0, 0, 0, 0, 0, 0.35, 0, 0, 0, 0.5, 0.1],
  shoot: [0.5, 0, 620, 0, 0.01, 0.09, 1, 1, -3, 0, 0, 0, 0, 0, 0, 0, 0, 0.4, 0.04],
  explosion: [1, 0, 110, 0, 0.04, 0.4, 3, 1, -2, 0, 0, 0, 0, 0.75, 0, 8, 0, 0.4, 0.2],
  power: [0.8, 0, 520, 0, 0.02, 0.22, 1, 1.1, 0, 0, 0, 0, 0.09, 0, 0, 0, 0, 0.5, 0.08],
  lose: [0.8, 0, 300, 0, 0.03, 0.35, 3, 1, -4, 0, 0, 0, 0, 0.2, 0, 0, 0, 0.5, 0.12],
  win: [1, 0, 660, 0, 0.02, 0.18, 1, 1.4, 4, 0, 0, 0, 0.1, 0, 0, 0, 0, 0.6, 0.06]
};

let engineCount = 0;

function readEnabled() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "1") return true;
    if (stored === "0") return false;
  } catch {
    /* storage can be blocked */
  }
  return false;
}

/* ------------------------------------------------------------
   Music bed: a tiny generated chiptune loop (no external asset).
   ------------------------------------------------------------ */
function buildMusicUrl() {
  const sampleRate = 22050;
  const bpm = 112;
  const step = 60 / bpm / 4;
  const steps = 64;
  const total = Math.ceil(step * steps * sampleRate) + sampleRate * 0.25;
  const buffer = new Float32Array(total);

  const midi = (note) => 440 * Math.pow(2, (note - 69) / 12);
  const melody = [69, 72, 76, 79, 76, 72, 69, 67, 69, 72, 76, 81, 79, 76, 72, 69];
  const bass = [45, 45, 45, 45, 41, 41, 41, 41, 43, 43, 43, 43, 40, 40, 40, 40];

  const square = (phase, duty = 0.5) => (phase % 1 < duty ? 1 : -1);

  for (let index = 0; index < steps; index += 1) {
    const start = Math.floor(index * step * sampleRate);
    const length = Math.floor(step * sampleRate);

    /* melody every other 16th, one octave sparkle */
    if (index % 2 === 0) {
      const note = melody[(index / 2) % melody.length];
      const freq = midi(note);
      for (let i = 0; i < length; i += 1) {
        const t = i / sampleRate;
        const env = Math.min(1, t * 90) * Math.exp(-t * 4.5);
        buffer[start + i] += square(t * freq, 0.25) * env * 0.14;
      }
    }

    /* bass on every quarter */
    if (index % 4 === 0) {
      const note = bass[(index / 4) % bass.length];
      const freq = midi(note);
      for (let i = 0; i < length * 2; i += 1) {
        const t = i / sampleRate;
        const env = Math.min(1, t * 60) * Math.exp(-t * 2.6);
        buffer[start + i] += square(t * freq, 0.5) * env * 0.1;
      }
    }

    /* noise hat on the off-beat */
    if (index % 4 === 2) {
      for (let i = 0; i < Math.floor(length * 0.35); i += 1) {
        const t = i / sampleRate;
        buffer[start + i] += (Math.random() * 2 - 1) * Math.exp(-t * 55) * 0.035;
      }
    }
  }

  /* soft clip + fade the seam */
  const fade = Math.floor(sampleRate * 0.02);
  for (let i = 0; i < total; i += 1) {
    buffer[i] = Math.max(-1, Math.min(1, buffer[i]));
    if (i < fade) buffer[i] *= i / fade;
    if (i > total - fade) buffer[i] *= (total - i) / fade;
  }

  const dataSize = total * 2;
  const wav = new ArrayBuffer(44 + dataSize);
  const view = new DataView(wav);
  const write = (offset, text) => {
    for (let i = 0; i < text.length; i += 1) view.setUint8(offset + i, text.charCodeAt(i));
  };
  write(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  write(8, "WAVE");
  write(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  write(36, "data");
  view.setUint32(40, dataSize, true);
  for (let i = 0; i < total; i += 1) {
    view.setInt16(44 + i * 2, Math.round(buffer[i] * 32767), true);
  }

  return URL.createObjectURL(new Blob([wav], { type: "audio/wav" }));
}

export function createAudioEngine({ enabled = null, volume = 0.22 } = {}) {
  let on = enabled === null ? readEnabled() : Boolean(enabled);
  let unlocked = false;
  let music = null;
  let musicUrl = null;
  let disposed = false;
  engineCount += 1;

  function persist() {
    try {
      window.localStorage.setItem(STORAGE_KEY, on ? "1" : "0");
    } catch {
      /* no-op */
    }
  }

  function ensureMusic() {
    if (music || disposed) return music;
    try {
      musicUrl = buildMusicUrl();
      music = new Howl({
        src: [musicUrl],
        format: ["wav"],
        loop: true,
        volume
      });
    } catch {
      music = null;
    }
    return music;
  }

  function startMusic() {
    if (!on || !unlocked || disposed) return;
    const track = ensureMusic();
    if (track && !track.playing()) track.play();
  }

  function stopMusic() {
    music?.pause();
  }

  function unlock() {
    if (unlocked || disposed) return;
    unlocked = true;
    startMusic();
  }

  function setEnabled(value, { silent = false } = {}) {
    on = Boolean(value);
    persist();
    if (on) {
      unlock();
      startMusic();
      if (!silent) sfx("click");
    } else {
      stopMusic();
    }
    window.dispatchEvent(
      new CustomEvent("agrvai:sound-change", { detail: { enabled: on } })
    );
    return on;
  }

  function sfx(name) {
    if (!on || disposed) return;
    const preset = SFX[name];
    if (!preset) return;
    try {
      zzfx(...preset);
    } catch {
      /* sound is a nice-to-have */
    }
  }

  const onSoundChange = (event) => {
    const next = Boolean(event.detail?.enabled);
    if (next === on) return;
    on = next;
    if (on) {
      unlock();
      startMusic();
    } else {
      stopMusic();
    }
  };

  const onUnlock = () => unlock();
  const onGesture = () => {
    unlock();
    window.removeEventListener("pointerdown", onGesture);
    window.removeEventListener("keydown", onGesture);
  };
  const onStorage = (event) => {
    if (event.key !== STORAGE_KEY) return;
    on = event.newValue === "1";
    if (on) startMusic();
    else stopMusic();
    window.dispatchEvent(
      new CustomEvent("agrvai:sound-change", {
        detail: { enabled: on, external: true }
      })
    );
  };
  const onVisibility = () => {
    if (document.hidden) stopMusic();
    else if (on) startMusic();
  };

  window.addEventListener("agrvai:sound-change", onSoundChange);
  window.addEventListener("agrvai:audio-unlock", onUnlock);
  window.addEventListener("storage", onStorage);
  window.addEventListener("pointerdown", onGesture, { passive: true });
  window.addEventListener("keydown", onGesture);
  document.addEventListener("visibilitychange", onVisibility);
  if (window.__agrvaiLoaderDone) unlock();

  return {
    sfx,
    unlock,
    startMusic,
    stopMusic,
    setEnabled,
    isEnabled: () => on,
    destroy() {
      disposed = true;
      window.removeEventListener("agrvai:sound-change", onSoundChange);
      window.removeEventListener("agrvai:audio-unlock", onUnlock);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("pointerdown", onGesture);
      window.removeEventListener("keydown", onGesture);
      document.removeEventListener("visibilitychange", onVisibility);
      music?.unload();
      if (musicUrl) URL.revokeObjectURL(musicUrl);
      music = null;
      musicUrl = null;
      engineCount -= 1;
    }
  };
}

export function getAudioEngineCount() {
  return engineCount;
}
