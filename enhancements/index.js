/* ============================================================
   Enhancements boot — additive layer over the frozen portfolio.
   ============================================================ */

import "./styles.css";
import { createSpeechBubble } from "./speech.js";
import { createDockMenu } from "./dock-menu.js";
import { initMotion } from "./motion.js";

export function initEnhancements({
  config,
  audio = null,
  character = null,
  reducedMotion = false,
  ticker = null
} = {}) {
  const hero = document.getElementById("hero");
  const dock = document.getElementById("dock");
  const speechLines = config?.character?.speech || [
    "oi, meu nome é David",
    "bem vindo ao meu portfólio"
  ];

  const dockMenu = createDockMenu({ dock, audio });

  const motion = initMotion({ config, ticker, reducedMotion });

  const speech = createSpeechBubble({
    host: hero,
    lines: speechLines,
    reducedMotion
  });

  let speechFallback = 0;
  const startSpeech = (delay = 600) => {
    window.clearTimeout(speechFallback);
    speech?.start(delay);
  };
  if (window.__agrvaiLoaderDone) {
    startSpeech(reducedMotion ? 0 : 600);
  } else {
    window.addEventListener("agrvai:loader-complete", () => {
      startSpeech(reducedMotion ? 0 : 600);
    }, { once: true });
    speechFallback = window.setTimeout(() => {
      if (!window.__agrvaiLoaderDone) startSpeech(reducedMotion ? 0 : 600);
    }, reducedMotion ? 1200 : 2800);
  }

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
    speech,
    motion,
    lab: () => lab,
    destroy() {
      window.clearTimeout(speechFallback);
      motion?.destroy();
      dockMenu?.destroy();
      speech?.destroy();
      lab?.destroy?.();
    }
  };
}
