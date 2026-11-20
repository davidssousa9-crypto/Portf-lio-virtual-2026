/* ============================================================
   NPC GUIDE — static creative character portrait with a typing
   speech bubble. No game loop, no interference with the page.
   ============================================================ */

import { getCharacterPixels } from "../character.js";

export function createGuide({ canvas, bubble, reducedMotion = false }) {
  if (!canvas || !bubble) {
    return { say() {}, destroy() {} };
  }

  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  const pixels = getCharacterPixels("creative");
  const cell = 7;
  const offsetX = Math.round((canvas.width - 28 * cell) / 2);
  const offsetY = Math.round((canvas.height - 30 * cell) / 2);
  let typeTimer = 0;
  let holdTimer = 0;

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pixels.forEach((pixel) => {
      ctx.fillStyle = pixel.color;
      ctx.fillRect(offsetX + pixel.x * cell, offsetY + pixel.y * cell, cell, cell);
    });
  }

  function clearTimers() {
    window.clearInterval(typeTimer);
    window.clearTimeout(holdTimer);
  }

  function say(text, { hold = 5200 } = {}) {
    if (!text) return;
    clearTimers();
    bubble.classList.remove("is-visible");
    void bubble.offsetWidth;
    bubble.classList.add("is-visible");
    bubble.setAttribute("aria-live", "polite");

    if (reducedMotion) {
      bubble.textContent = text;
      if (hold) holdTimer = window.setTimeout(() => bubble.classList.remove("is-visible"), hold);
      return;
    }

    let index = 0;
    bubble.textContent = "";
    typeTimer = window.setInterval(() => {
      index += 1;
      bubble.textContent = text.slice(0, index);
      if (index >= text.length) {
        window.clearInterval(typeTimer);
        if (hold) {
          holdTimer = window.setTimeout(
            () => bubble.classList.remove("is-visible"),
            hold
          );
        }
      }
    }, 22);
  }

  draw();
  say("Bem-vindo à base. Escolha um mundo e comece pelo flashcard mais difícil.", {
    hold: 6200
  });

  return {
    say,
    destroy() {
      clearTimers();
      bubble.textContent = "";
    }
  };
}
