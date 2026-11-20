/* ============================================================
   INPUT — keyboard state, swipe gestures and pointer helpers.
   ============================================================ */

const BLOCK = new Set([
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  " ",
  "Spacebar"
]);

export function createKeys(target = window) {
  const down = new Set();
  const pressed = new Set();

  const onDown = (event) => {
    if (BLOCK.has(event.key)) event.preventDefault();
    if (!down.has(event.key)) pressed.add(event.key);
    down.add(event.key);
  };
  const onUp = (event) => {
    down.delete(event.key);
  };
  const onBlur = () => {
    down.clear();
    pressed.clear();
  };

  target.addEventListener("keydown", onDown, { passive: false });
  target.addEventListener("keyup", onUp);
  window.addEventListener("blur", onBlur);

  return {
    has(...keys) {
      return keys.some((key) => down.has(key));
    },
    took(...keys) {
      const hit = keys.find((key) => pressed.has(key));
      return hit || null;
    },
    clearPressed() {
      pressed.clear();
    },
    destroy() {
      target.removeEventListener("keydown", onDown);
      target.removeEventListener("keyup", onUp);
      window.removeEventListener("blur", onBlur);
      down.clear();
      pressed.clear();
    }
  };
}

export function bindSwipe(element, onSwipe, { threshold = 24 } = {}) {
  let startX = 0;
  let startY = 0;
  let tracking = false;

  const onDown = (event) => {
    tracking = true;
    startX = event.clientX;
    startY = event.clientY;
  };
  const onUp = (event) => {
    if (!tracking) return;
    tracking = false;
    const dx = event.clientX - startX;
    const dy = event.clientY - startY;
    if (Math.abs(dx) < threshold && Math.abs(dy) < threshold) return;
    if (Math.abs(dx) > Math.abs(dy)) onSwipe(dx > 0 ? "right" : "left");
    else onSwipe(dy > 0 ? "down" : "up");
  };
  const onCancel = () => {
    tracking = false;
  };

  element.addEventListener("pointerdown", onDown, { passive: true });
  element.addEventListener("pointerup", onUp, { passive: true });
  element.addEventListener("pointercancel", onCancel, { passive: true });
  element.addEventListener("pointerleave", onCancel, { passive: true });

  return () => {
    element.removeEventListener("pointerdown", onDown);
    element.removeEventListener("pointerup", onUp);
    element.removeEventListener("pointercancel", onCancel);
    element.removeEventListener("pointerleave", onCancel);
  };
}

export function canvasPoint(canvas, event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * canvas.width,
    y: ((event.clientY - rect.top) / rect.height) * canvas.height
  };
}
