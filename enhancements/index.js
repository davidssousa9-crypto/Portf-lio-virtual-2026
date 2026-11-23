/* ============================================================
   Enhancements boot — additive layer over the frozen portfolio.
   ============================================================ */

import { createDockMenu } from "./dock-menu.js";
import { initMotion } from "./motion.js";
import { createAudioEngine } from "./audio-engine.js";
import { createGameManager } from "../games/core/manager.js";

export function initEnhancements({
  config,
  audio = null,
  character = null,
  reducedMotion = false,
  ticker = null,
  announce = () => {}
} = {}) {
  const dock = document.getElementById("dock");

  const dockMenu = createDockMenu({ dock, audio });
  const audioEngine = createAudioEngine({
    enabled: audio?.isEnabled?.() ?? false
  });
  const games = createGameManager({
    config,
    audio,
    audioEngine,
    character,
    announce
  });

  const motion = initMotion({ config, ticker, reducedMotion });

  const query = new URLSearchParams(window.location.search);
  let lab = null;
  if (query.get("debug") === "1") {
    import("../character/lab.js").then(({ initCharacterLab }) => {
      lab = initCharacterLab({
        canvas: document.getElementById("characterCanvas"),
        stage: document.getElementById("heroStage"),
        config,
        getMode: () => character?.getMode?.() || "creative",
        reducedMotion
      });
    }).catch((error) => console.warn("[character-lab]", error));
  }

  return {
    dockMenu,
    motion,
    games,
    audioEngine,
    lab: () => lab,
    destroy() {
      motion?.destroy();
      games?.destroy();
      audioEngine?.destroy();
      dockMenu?.destroy();
      lab?.destroy?.();
    }
  };
}
