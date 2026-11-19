/* ============================================================
   Enhancements boot — additive layer over the frozen portfolio.
   ============================================================ */

import "./styles.css";
import { createSpeechBubble } from "./speech.js";
import { createDockMenu } from "./dock-menu.js";

export function initEnhancements({
  config,
  audio = null,
  character = null,
  reducedMotion = false
} = {}) {
  const hero = document.getElementById("hero");
  const dock = document.getElementById("dock");
  const speechLines = config?.character?.speech || [
    "oi, meu nome é David",
    "bem vindo ao meu portfólio"
  ];

  const dockMenu = createDockMenu({ dock, audio });

  const speech = createSpeechBubble({
    host: hero,
    lines: speechLines,
    reducedMotion
  });

  const startSpeech = () => speech?.start(600);
  let loaderDone = false;
  window.addEventListener("agrvai:loader-complete", () => {
    loaderDone = true;
    startSpeech();
  }, { once: true });
  window.setTimeout(() => {
    if (!loaderDone) startSpeech();
  }, reducedMotion ? 900 : 2200);

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
    lab: () => lab,
    destroy() {
      dockMenu?.destroy();
      speech?.destroy();
      lab?.destroy?.();
    }
  };
}
