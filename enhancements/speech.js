/* ============================================================
   Speech bubbles — pixel dialogue for the character / NPC guide.
   Additive UI, anchored over the hero stage.
   ============================================================ */

const TYPE_MS = 26;

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export function createSpeechBubble({
  host = null,
  lines = [],
  reducedMotion = false,
  onShow = null,
  className = ""
} = {}) {
  if (!host || !lines.length) return null;

  const bubble = document.createElement("div");
  bubble.className = `speech-bubble ${className}`.trim();
  bubble.setAttribute("role", "status");
  bubble.setAttribute("aria-live", "polite");
  bubble.setAttribute("aria-atomic", "true");

  const label = document.createElement("p");
  label.className = "speech-bubble__label";
  label.textContent = "DAVID.EXE";

  const text = document.createElement("p");
  text.className = "speech-bubble__text";

  const close = document.createElement("button");
  close.type = "button";
  close.className = "speech-bubble__close";
  close.setAttribute("aria-label", "Fechar balão de fala");
  close.textContent = "x";

  bubble.append(label, text, close);
  host.appendChild(bubble);

  let runId = 0;
  let typing = 0;
  let visible = false;
  let destroyed = false;

  function stopTyping() {
    if (typing) {
      window.clearInterval(typing);
      typing = 0;
    }
  }

  function hide() {
    visible = false;
    bubble.classList.remove("is-visible");
  }

  function typeLine(line, id) {
    stopTyping();
    text.textContent = reducedMotion ? line : "";
    if (reducedMotion) return Promise.resolve();
    return new Promise((resolve) => {
      let index = 0;
      typing = window.setInterval(() => {
        if (destroyed || id !== runId) {
          stopTyping();
          resolve();
          return;
        }
        index += 1;
        text.textContent = line.slice(0, index);
        if (index >= line.length) {
          stopTyping();
          resolve();
        }
      }, TYPE_MS);
    });
  }

  async function showLine(line, duration = 5200) {
    const id = ++runId;
    visible = true;
    bubble.classList.add("is-visible");
    onShow?.(line);
    await typeLine(line, id);
    if (destroyed || id !== runId) return;
    await wait(duration);
    if (!destroyed && id === runId) hide();
  }

  close.addEventListener("click", () => {
    runId += 1;
    stopTyping();
    hide();
  });

  async function sequence() {
    for (const line of lines) {
      if (destroyed) return;
      await showLine(line, 4600);
      if (destroyed) return;
      await wait(900);
    }
  }

  let started = false;
  function start(delay = 1400) {
    if (started || destroyed) return;
    started = true;
    window.setTimeout(() => {
      if (!destroyed) sequence();
    }, delay);
  }

  return {
    element: bubble,
    start,
    show: showLine,
    hide,
    isVisible: () => visible,
    destroy() {
      destroyed = true;
      stopTyping();
      bubble.remove();
    }
  };
}
