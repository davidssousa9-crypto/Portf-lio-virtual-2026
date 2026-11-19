/* ============================================================
   Character calibration lab (?debug=1)
   Reference overlay, 1-px grid with 5-px accents, inspector,
   difference mode, split view, layer isolation and matrix dump.
   ============================================================ */

import {
  CHARACTER_GRIDS,
  DEFAULT_PALETTE,
  GRID_W,
  GRID_H,
  F_LINE
} from "../character.js";

const LAYERS = ["all", "base", "hair", "brows", "glasses", "eyes", "mouth", "ear", "expression", "clothing"];

function paletteFor(config) {
  return {
    ...DEFAULT_PALETTE,
    ...(config?.character?.palette || {}),
    ...(config?.character?.glassesPalette || {}),
    ...(config?.character?.clothesPalette || {})
  };
}

function cssScale(canvas, gridCanvas) {
  const rect = canvas.getBoundingClientRect();
  gridCanvas.width = canvas.width;
  gridCanvas.height = canvas.height;
  gridCanvas.style.width = `${rect.width}px`;
  gridCanvas.style.height = `${rect.height}px`;
}

export function initCharacterLab({
  canvas,
  stage,
  config,
  getMode = () => "creative",
  reducedMotion = false
} = {}) {
  if (!canvas || !stage) return null;

  const palette = paletteFor(config);
  const overlay = document.createElement("canvas");
  overlay.className = "character-lab__overlay";
  overlay.setAttribute("aria-hidden", "true");
  stage.appendChild(overlay);
  const ctx = overlay.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  const buffer = document.createElement("canvas");
  const bctx = buffer.getContext("2d");

  let reference = null;
  let opacity = 0.5;
  let layer = "all";
  let grid = false;
  let difference = false;
  let split = false;
  let inspector = true;
  let destroyed = false;
  let lastPoint = null;

  const panel = document.createElement("aside");
  panel.className = "character-lab";
  panel.setAttribute("aria-label", "Laboratório de calibração do personagem");
  panel.innerHTML = `
    <header class="character-lab__head">
      <strong>&gt; CHARACTER.LAB</strong>
      <button type="button" data-lab="close" aria-label="Fechar laboratório">x</button>
    </header>
    <div class="character-lab__body">
      <label class="character-lab__row">REFERÊNCIA
        <input type="file" accept="image/*" data-lab="ref">
      </label>
      <label class="character-lab__row">OPACIDADE <output data-lab="opacity-value">50%</output>
        <input type="range" min="0" max="100" value="50" data-lab="opacity">
      </label>
      <label class="character-lab__row">CAMADA
        <select data-lab="layer">
          ${LAYERS.map((name) => `<option value="${name}">${name}</option>`).join("")}
        </select>
      </label>
      <div class="character-lab__buttons">
        <button type="button" data-lab="grid">G GRADE</button>
        <button type="button" data-lab="diff">D DIFF</button>
        <button type="button" data-lab="split">SPLIT</button>
        <button type="button" data-lab="print">PRINT MATRIZ</button>
      </div>
      <p class="character-lab__readout" data-lab="readout">col -- row -- hex ------</p>
      <p class="character-lab__hint">O overlay · G grade · D diferença · clique copia "col,row"</p>
      <p class="character-lab__hint" data-lab="status"></p>
    </div>
  `;
  document.body.appendChild(panel);

  const status = panel.querySelector("[data-lab=status]");
  const readout = panel.querySelector("[data-lab=readout]");
  const opacityValue = panel.querySelector("[data-lab=opacity-value]");

  function setStatus(message) {
    status.textContent = message;
  }

  function syncOverlayBox() {
    const rect = canvas.getBoundingClientRect();
    const stageRect = stage.getBoundingClientRect();
    overlay.style.left = `${rect.left - stageRect.left}px`;
    overlay.style.top = `${rect.top - stageRect.top}px`;
    overlay.style.width = `${rect.width}px`;
    overlay.style.height = `${rect.height}px`;
    overlay.width = canvas.width;
    overlay.height = canvas.height;
    buffer.width = canvas.width;
    buffer.height = canvas.height;
  }

  function drawGrid(g) {
    if (!grid) return;
    const unitX = g.canvas.width / GRID_W;
    const unitY = g.canvas.height / GRID_H;
    g.save();
    g.lineWidth = 1;
    for (let x = 0; x <= GRID_W; x += 1) {
      g.strokeStyle = x % 5 === 0 ? "rgba(188,237,18,0.72)" : "rgba(237,237,237,0.16)";
      g.beginPath();
      g.moveTo(x * unitX, 0);
      g.lineTo(x * unitX, g.canvas.height);
      g.stroke();
    }
    for (let y = 0; y <= GRID_H; y += 1) {
      g.strokeStyle = y % 5 === 0 ? "rgba(188,237,18,0.72)" : "rgba(237,237,237,0.16)";
      g.beginPath();
      g.moveTo(0, y * unitY);
      g.lineTo(g.canvas.width, y * unitY);
      g.stroke();
    }
    // F line = glasses frame top, highlighted in magenta.
    g.strokeStyle = "rgba(237,61,145,0.85)";
    g.beginPath();
    g.moveTo(0, F_LINE * unitY);
    g.lineTo(g.canvas.width, F_LINE * unitY);
    g.stroke();
    g.restore();
  }

  function drawMatrixLayer(g) {
    if (layer === "all") {
      drawGrid(g, CHARACTER_GRIDS[getMode()].base);
      return;
    }
    g.globalAlpha = 1;
    if (layer === "eyes") {
      const unitX = g.canvas.width / GRID_W;
      const unitY = g.canvas.height / GRID_H;
      g.fillStyle = palette.k;
      g.fillRect(10 * unitX, (F_LINE + 2) * unitY, unitX * 2, unitY);
      g.fillRect(17 * unitX, (F_LINE + 2) * unitY, unitX * 2, unitY);
      return;
    }
    if (layer === "mouth") {
      const unitX = g.canvas.width / GRID_W;
      const unitY = g.canvas.height / GRID_H;
      g.fillStyle = palette["8"];
      g.fillRect(10 * unitX, 16 * unitY, unitX, unitY);
      g.fillRect(16 * unitX, 16 * unitY, unitX, unitY);
      g.fillStyle = palette.t;
      g.fillRect(11 * unitX, 16 * unitY, unitX * 5, unitY);
      g.fillStyle = palette["7"];
      g.fillRect(12 * unitX, 17 * unitY, unitX * 3, unitY);
      g.fillStyle = palette["6"];
      g.fillRect(15 * unitX, 17 * unitY, unitX, unitY);
      g.fillRect(13 * unitX, 18 * unitY, unitX * 2, unitY);
      return;
    }

    const mode = getMode();
    const layers = CHARACTER_GRIDS[mode] || CHARACTER_GRIDS.creative;
    let rows = layers[layer] || layers.base;
    /* V2 grids are stored already mirrored for the developer mode. */
    const mirrored = false;
    if (mirrored) rows = rows.map((row) => [...row].reverse().join(""));
    const unitX = g.canvas.width / GRID_W;
    const unitY = g.canvas.height / GRID_H;
    for (let y = 0; y < GRID_H; y += 1) {
      for (let x = 0; x < GRID_W; x += 1) {
        const char = rows[y]?.[x];
        if (!char || char === ".") continue;
        g.fillStyle = palette[char] || "#FF00FF";
        g.fillRect(x * unitX, y * unitY, Math.ceil(unitX), Math.ceil(unitY));
      }
    }
  }

  function render() {
    if (destroyed) return;
    syncOverlayBox();
    ctx.clearRect(0, 0, overlay.width, overlay.height);
    bctx.clearRect(0, 0, buffer.width, buffer.height);

    if (difference && reference) {
      bctx.drawImage(canvas, 0, 0, buffer.width, buffer.height);
      bctx.globalCompositeOperation = "difference";
      bctx.drawImage(reference, 0, 0, buffer.width, buffer.height);
      bctx.globalCompositeOperation = "source-over";
      bctx.drawImage(buffer, 0, 0);
      drawGrid(ctx);
      return;
    }

    if (split && reference) {
      const half = overlay.width / 2;
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, half, overlay.height);
      ctx.clip();
      ctx.drawImage(reference, 0, 0, overlay.width, overlay.height);
      ctx.restore();
      ctx.save();
      ctx.beginPath();
      ctx.rect(half, 0, half, overlay.height);
      ctx.clip();
      ctx.drawImage(canvas, 0, 0, overlay.width, overlay.height);
      ctx.restore();
      ctx.fillStyle = "#BCED12";
      ctx.fillRect(half - 1, 0, 2, overlay.height);
      drawGrid(ctx);
      return;
    }

    if (typeof layer === "string" && layer !== "all") {
      ctx.fillStyle = "rgba(18,18,18,0.94)";
      ctx.fillRect(0, 0, overlay.width, overlay.height);
      drawMatrixLayer(ctx);
      drawGrid(ctx);
      return;
    }

    if (reference) {
      ctx.globalAlpha = opacity;
      ctx.drawImage(reference, 0, 0, overlay.width, overlay.height);
      ctx.globalAlpha = 1;
    }
    drawGrid(ctx);
  }

  function loadReferenceFile(file) {
    if (!file) return;
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      reference = image;
      setStatus(`referência ${image.width}×${image.height}`);
      render();
      URL.revokeObjectURL(url);
    };
    image.onerror = () => {
      setStatus("não foi possível ler a imagem");
      URL.revokeObjectURL(url);
    };
    image.src = url;
  }

  panel.addEventListener("change", (event) => {
    const target = event.target;
    if (target.matches("[data-lab=opacity]")) {
      opacity = Number(target.value) / 100;
      opacityValue.textContent = `${target.value}%`;
      render();
    }
    if (target.matches("[data-lab=layer]")) {
      layer = target.value;
      render();
    }
    if (target.matches("[data-lab=ref]")) {
      loadReferenceFile(target.files?.[0]);
    }
  });

  panel.addEventListener("input", (event) => {
    if (event.target.matches("[data-lab=opacity]")) {
      opacity = Number(event.target.value) / 100;
      opacityValue.textContent = `${event.target.value}%`;
      render();
    }
  });

  panel.addEventListener("click", (event) => {
    const action = event.target.closest("[data-lab]")?.dataset.lab;
    if (!action) return;
    if (action === "close") {
      panel.remove();
      overlay.remove();
      destroyed = true;
      return;
    }
    if (action === "grid") {
      grid = !grid;
      event.target.textContent = grid ? "G GRADE ON" : "G GRADE";
      render();
    }
    if (action === "diff") {
      difference = !difference;
      split = false;
      event.target.textContent = difference ? "D DIFF ON" : "D DIFF";
      render();
    }
    if (action === "split") {
      split = !split;
      difference = false;
      event.target.textContent = split ? "SPLIT ON" : "SPLIT";
      render();
    }
    if (action === "print") {
      const mode = getMode();
      console.log(`[CHARACTER.LAB] mode=${mode} layer=${layer}`);
      if (layer === "all") console.log(JSON.stringify(CHARACTER_GRIDS[mode], null, 2));
      else if (CHARACTER_GRIDS[mode]?.[layer]) console.log(CHARACTER_GRIDS[mode][layer].join("\n"));
      else console.log("eyes/mouth are procedural layers");
      setStatus("matriz impressa no console");
    }
  });

  const onKey = (event) => {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement) return;
    const key = event.key.toLowerCase();
    if (key === "o") {
      opacity = opacity >= 0.95 ? 0 : Math.min(1, opacity + 0.1);
      opacityValue.textContent = `${Math.round(opacity * 100)}%`;
      const range = panel.querySelector("[data-lab=opacity]");
      if (range) range.value = String(Math.round(opacity * 100));
      render();
    }
    if (key === "g") {
      grid = !grid;
      render();
    }
    if (key === "d") {
      difference = !difference;
      render();
    }
  };

  function onPointerMove(event) {
    if (!inspector) return;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width) return;
    const nx = (event.clientX - rect.left) / rect.width;
    const ny = (event.clientY - rect.top) / rect.height;
    if (nx < 0 || nx > 1 || ny < 0 || ny > 1) return;
    const col = Math.min(GRID_W - 1, Math.floor(nx * GRID_W));
    const row = Math.min(GRID_H - 1, Math.floor(ny * GRID_H));
    const px = Math.min(canvas.width - 1, Math.floor(nx * canvas.width));
    const py = Math.min(canvas.height - 1, Math.floor(ny * canvas.height));
    let hex = "------";
    try {
      const data = canvas.getContext("2d").getImageData(px, py, 1, 1).data;
      hex = `#${[data[0], data[1], data[2]].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
    } catch {
      hex = "??";
    }
    lastPoint = { col, row };
    readout.textContent = `col ${String(col).padStart(2, "0")} · row ${String(row).padStart(2, "0")} · ${hex} · F${row - F_LINE >= 0 ? "+" : ""}${row - F_LINE}`;
  }

  function copyPoint() {
    if (!lastPoint) return;
    const text = `${lastPoint.col},${lastPoint.row}`;
    navigator.clipboard?.writeText(text).then(
      () => setStatus(`copiado "${text}"`),
      () => setStatus(`ponto ${text}`)
    );
  }

  canvas.addEventListener("pointermove", onPointerMove, { passive: true });
  canvas.addEventListener("click", copyPoint);
  window.addEventListener("keydown", onKey);
  const observer = new ResizeObserver(render);
  observer.observe(canvas);
  render();
  setStatus(reducedMotion ? "movimento reduzido" : "pronto");

  return {
    render,
    destroy() {
      destroyed = true;
      observer.disconnect();
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("click", copyPoint);
      window.removeEventListener("keydown", onKey);
      panel.remove();
      overlay.remove();
    }
  };
}
