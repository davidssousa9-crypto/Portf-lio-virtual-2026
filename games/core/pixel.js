/* ============================================================
   PIXEL — shared canvas helpers for the arcade cartridges.
   ============================================================ */

export function setupCanvas(stage, width, height, { background = "#0a0a0a" } = {}) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.className = "arcade-canvas";
  canvas.setAttribute("aria-hidden", "true");
  canvas.style.aspectRatio = `${width} / ${height}`;
  stage.append(canvas);
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, width, height);
  return { canvas, ctx, W: width, H: height };
}

export function pixelText(ctx, text, x, y, size = 12, color = "#EDEDED", align = "left") {
  ctx.save();
  ctx.font = `${size}px "Pixelify Sans", "Courier New", monospace`;
  ctx.textAlign = align;
  ctx.textBaseline = "top";
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
  ctx.restore();
}

export function drawGrid(ctx, W, H, step = 20, color = "rgba(237,237,237,0.045)") {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  for (let x = step; x < W; x += step) {
    ctx.beginPath();
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, H);
    ctx.stroke();
  }
  for (let y = step; y < H; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(W, y + 0.5);
    ctx.stroke();
  }
  ctx.restore();
}

export function fillRect(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

export function drawLife(ctx, x, y, color = "#BCED12") {
  fillRect(ctx, x, y, 6, 6, color);
  fillRect(ctx, x + 2, y + 2, 2, 2, "#0a0a0a");
}
