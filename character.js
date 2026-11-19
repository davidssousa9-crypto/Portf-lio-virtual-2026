/* ============================================================
   CHARACTER.JS — 28 × 30 procedural pixel portrait
   Original character restored: brown wavy crop, long face,
   white tee with a light-blue 333 chest mark, developer
   jacket (no hood). The glasses are the new 13 px frame.
   ============================================================ */

const GRID_W = 28;
const GRID_H = 30;
const F_LINE = 9; // top row of the glasses frame
const DOTS = "............................";

/* ---------- CREATIVE: base head, neck, jaw ---------- */
const BASE = [
  DOTS, DOTS, DOTS, DOTS, DOTS,
  "........111111111111........",
  ".......11111111111111.......",
  ".......11111111111111.......",
  ".......11111111111111.......",
  ".......11111111111111.......",
  ".......31111111111113.......",
  ".......31111111111113.......",
  ".......31111111111113.......",
  ".......41111111111114.......",
  ".......41111111111114.......",
  ".......31111111111113.......",
  "........111111111111........",
  "........311111111113........",
  ".........1111111111.........",
  "..........11111111..........",
  "...........144441...........",
  "...........1llll1...........",
  "...........1llll1...........",
  "...........1llll1...........",
  DOTS, DOTS, DOTS, DOTS, DOTS, DOTS
];

/* ---------- dark-brown wavy crop (same silhouette) ---------- */
const HAIR = [
  ".........hjhhjhhh...........",
  "........hhxxhhHhhhh.........",
  ".......hhjxxhjhhHhhh........",
  "......hhjhhxxhhhhHHhh.......",
  ".....hjhhxhhhhhhHHhhhh......",
  "....hhjhhhhhhHHHhhhhhhh.....",
  "....hjjhhHHHH..jx....hh.....",
  "....hhjhHH.....j.....hh.....",
  "....hHH........H.....hh.....",
  "....hHj..............hh.....",
  ".....hj..............Hh.....",
  ".....hH..............Hh.....",
  ".....hj..............Hh.....",
  ".....hH..............Hh.....",
  ".....h................h.....",
  "......h..............h......",
  "......hH....................",
  "......hj....................",
  ".......hH...................",
  "........hj..................",
  ".........hH.................",
  DOTS, DOTS, DOTS, DOTS, DOTS, DOTS, DOTS, DOTS, DOTS
];

/* ---------- CREATIVE: straight brows inside the exposed forehead ---------- */
const BROWS = [
  DOTS, DOTS, DOTS, DOTS, DOTS, DOTS, DOTS, DOTS,
  "........bbbb....bbbb........",
  DOTS, DOTS, DOTS, DOTS, DOTS, DOTS, DOTS, DOTS, DOTS, DOTS, DOTS, DOTS, DOTS, DOTS, DOTS, DOTS, DOTS, DOTS, DOTS, DOTS, DOTS
];

/* ---------- SHARED: new v2 frame — 13 px wide, heavy lower rim ---------- */
const GLASSES = [
  DOTS, DOTS, DOTS, DOTS, DOTS, DOTS, DOTS, DOTS, DOTS,
  ".......gggggg.gggggg........",
  ".......gllllgggllllg........",
  ".......gllllglgllllgggg.....",
  ".......gllllglgllllg........",
  "........GGGG...GGGG.........",
  DOTS, DOTS, DOTS, DOTS, DOTS, DOTS, DOTS, DOTS, DOTS, DOTS, DOTS, DOTS, DOTS, DOTS, DOTS, DOTS
];

/* ---------- CREATIVE: both ears, right one more visible ---------- */
const EAR = [
  DOTS, DOTS, DOTS, DOTS, DOTS, DOTS, DOTS, DOTS, DOTS, DOTS, DOTS,
  "......e..............ee.....",
  "......e..............Ee.....",
  "......E..............ee.....",
  DOTS, DOTS, DOTS, DOTS, DOTS, DOTS, DOTS, DOTS, DOTS, DOTS, DOTS, DOTS, DOTS, DOTS, DOTS, DOTS
];

/* ---------- CREATIVE: nose bridge, tip, cheek blush (mouth dynamic) ---------- */
const EXPRESSION = [
  DOTS, DOTS, DOTS, DOTS, DOTS, DOTS, DOTS, DOTS, DOTS, DOTS, DOTS, DOTS,
  ".............d..............",
  DOTS,
  ".............dd.............",
  "............3dd3............",
  "........55........55........",
  DOTS, DOTS, DOTS, DOTS, DOTS, DOTS, DOTS, DOTS, DOTS, DOTS, DOTS, DOTS, DOTS
];

/* ---------- CREATIVE: v2 white tee with stepped collar ---------- */
const CREATIVE_CLOTHING = [
  DOTS, DOTS, DOTS, DOTS, DOTS, DOTS, DOTS, DOTS, DOTS, DOTS, DOTS, DOTS, DOTS, DOTS, DOTS, DOTS, DOTS, DOTS, DOTS, DOTS,
  ".........w.......w..........",
  "........ww.......ww.........",
  "......wwwWWW....WWWwww......",
  "....wwWWWWWWwwwwWWWWWWww....",
  "...wwWWWWWWWWWWWWWWWWWWww...",
  "...WWWWwWWWWWWWWWWWWwWWWW...",
  "..wwWWWwWWWWWWWWWWWWwWWWww..",
  ".wwWWWWwWWWWWWWWWWWWwWWWWww.",
  ".wWWWWWwWWWWWWWWWWWWwWWWWWw.",
  ".wWWWWWwWWWWWWWWWWWWwWWWWWw."
];

/* ---------- DEVELOPER: v2 dark jacket with seams and panels ---------- */
const DEVELOPER_CLOTHING = [
  DOTS, DOTS, DOTS, DOTS, DOTS, DOTS, DOTS, DOTS, DOTS, DOTS, DOTS, DOTS, DOTS, DOTS, DOTS, DOTS, DOTS, DOTS, DOTS, DOTS,
  ".........K.......K..........",
  ".......KKKK.....KKK.........",
  "......KKKKKX....KKKXXX......",
  "....XXXXXXXXXXXXXXXXXXXX....",
  "...XXKXXKXXKDDDKXXXKXXKXX...",
  "...XXKXXKXXKDDDKXXXKXXKXX...",
  "..KXXKXXKXXKDDDKXXXKXXKXXK..",
  ".VKXXKXXXXXKDDDKXXXXXXKXXKV.",
  ".VKXXKXXXXXKDDDKXXXXXXKXXKV.",
  ".VKVVKVVVVVKDDDKVVVVVVKVVKV."
];

/* Palettes: character chars → colour. */
const DEFAULT_PALETTE = {
  "1": "#E8BE96", // skin base + deterministic noise below
  "l": "#EDC7A0", // skin light
  "3": "#C98B6C", // strong shadow
  "4": "#DDA383", // mid shadow / blush base
  "5": "#DDA383", // blush
  "6": "#D99A7E", // chin / lower lip edge
  "7": "#A85F58", // lip
  "u": "#C97F72", // soft lower lip
  "d": "#C98B6C", // nose shadow
  "m": "#4A1E2A", // mouth dark
  "t": "#E6E6E6", // teeth
  "k": "#0F0F10", // eyes
  "b": "#3A1A26", // brows
  "h": "#4A2A1A", // dark-brown hair
  "H": "#2C180F", // hair shadow
  "j": "#6D452B", // hair wave light
  "x": "#9A6A3E", // hair shine
  "g": "#2A2028", // glasses frame
  "G": "#1B151C", // glasses shadow
  "L": "#D8EDEF", // glass lens
  "M": "#B4D6DA", // glass lens shade
  "q": "#FFFFFF", // glass highlight
  "Q": "#C9A45C", // shirt buttons
  "chest": "#7FD4FF", // creative chest mark (333)
  "e": "#E0A582", // ear
  "E": "#C98B6C", // ear inner
  "W": "#F7F4EC", // shirt
  "w": "#D8D2C7", // shirt shadow
  "v": "#C9C9C9", // shirt deep shadow
  "c": "#FFFDF7", // shirt collar
  "J": "#232026", // black jacket
  "K": "#141216", // jacket shadow
  "D": "#2B2430", // jacket deep panel
  "V": "#342C40", // navy inside
  "P": "#3B353F", // jacket lapel
  "C": "#2A2230", // high collar
  "Z": "#332A38", // seam
  "S": "#C98B6C", // glasses skin shadow
  "cyan": "#12C2ED",
  "magenta": "#ED3D91",
  "lime": "#BCED12",
  "yellow": "#F6C53A",
  "purple": "#894AED",
  "orange": "#ED7812",
  "red": "#EE3B3E",
  "redLight": "#FF6B6B",
  "redDark": "#B71C1C"
};

const SKIN_NOISE = ["#E9C099", "#E7BC93", "#E8BE96", "#EAC29B"];

const THREE = ["XXX", "..X", "XXX", "..X", "XXX"];

function normalizeGrid(rows) {
  return rows.map((row) => (row + DOTS).slice(0, GRID_W));
}

const GRIDS = {
  creative: {
    base: normalizeGrid(BASE),
    hair: normalizeGrid(HAIR),
    brows: normalizeGrid(BROWS),
    glasses: normalizeGrid(GLASSES),
    ear: normalizeGrid(EAR),
    expression: normalizeGrid(EXPRESSION),
    clothing: normalizeGrid(CREATIVE_CLOTHING)
  },
  developer: {
    base: normalizeGrid(BASE),
    hair: normalizeGrid(HAIR),
    brows: normalizeGrid(BROWS),
    glasses: normalizeGrid(GLASSES),
    ear: normalizeGrid(EAR),
    expression: normalizeGrid(EXPRESSION),
    clothing: normalizeGrid(DEVELOPER_CLOTHING)
  }
};

/* Read-only views for the calibration lab and future game hooks. */
export const CHARACTER_GRIDS = GRIDS;
export { GRID_W, GRID_H, F_LINE, DEFAULT_PALETTE };

function mirrorGrid(rows) {
  return rows.map((row) => [...row].reverse().join(""));
}

/* Mirror the head layers for Developer mode. */
const MIRRORED_HEAD = {
  base: mirrorGrid(GRIDS.creative.base),
  hair: mirrorGrid(GRIDS.creative.hair),
  brows: mirrorGrid(GRIDS.creative.brows),
  glasses: mirrorGrid(GRIDS.developer.glasses),
  ear: mirrorGrid(GRIDS.creative.ear),
  expression: mirrorGrid(GRIDS.creative.expression)
};

/* ============================================================
   RENDERER
   ============================================================ */

export function createCharacter({
  canvas,
  stage,
  hero,
  config = {},
  audio = null,
  reducedMotion = false,
  initialMode = "creative"
}) {
  const ctx = canvas.getContext("2d", { alpha: true });
  const palette = {
    ...DEFAULT_PALETTE,
    ...(config.character?.palette || {}),
    ...(config.character?.glassesPalette || {}),
    ...(config.character?.clothesPalette || {})
  };
  const timing = {
    blinkMin: 3000,
    blinkMax: 5000,
    blinkDuration: 120,
    breathMs: 1200,
    jumpMs: 150,
    winkEvery: 12000,
    winkDuration: 220,
    transition: 700,
    ...(config.character || {})
  };
  const controller = new AbortController();
  const signal = controller.signal;

  let mode = initialMode === "developer" ? "developer" : "creative";
  let transitionFrom = mode;
  let transitionStart = -1e9;
  let reduced = Boolean(reducedMotion);
  let unit = 1;
  let dpr = 1;
  let width = 0;
  let height = 0;
  let hover = false;
  let jumpUntil = 0;
  let blinkUntil = 0;
  let nextBlink = 0;
  let winkUntil = 0;
  let nextWink = 0;
  let winkGlitchUntil = 0;
  let headCache = {};
  let bodyCache = {};

  const pointer = { inside: false, x: 14, y: 12 };

  const offscreen = {
    frame: document.createElement("canvas"),
    pixel: document.createElement("canvas"),
    tint: document.createElement("canvas")
  };
  const frameCtx = offscreen.frame.getContext("2d");
  const pixelCtx = offscreen.pixel.getContext("2d");
  const tintCtx = offscreen.tint.getContext("2d");

  [ctx, frameCtx, pixelCtx, tintCtx].forEach((c) => { c.imageSmoothingEnabled = false; });

  function makeCanvas(w, h) {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const g = c.getContext("2d");
    g.imageSmoothingEnabled = false;
    return c;
  }

  function skinNoise(x, y) {
    const h = (((x + 1) * 374761393) ^ ((y + 1) * 668265263) ^ 0x9E3779B9) >>> 0;
    return SKIN_NOISE[h % SKIN_NOISE.length];
  }

  function drawGrid(g, grid, { mirror = false, dx = 0 } = {}) {
    for (let y = 0; y < GRID_H; y += 1) {
      const row = grid[y] || DOTS;
      for (let x = 0; x < GRID_W; x += 1) {
        const char = row[x];
        if (!char || char === "." || char === " ") continue;
        let color = palette[char];
        if (!color) continue;
        if (char === "1") color = skinNoise(x, y);
        let px = mirror ? GRID_W - 1 - x : x;
        px += dx;
        if (px < 0 || px >= GRID_W) continue;
        g.fillStyle = color;
        g.fillRect(px * unit, y * unit, unit, unit);
      }
    }
  }

  function buildHead(targetMode) {
    const c = makeCanvas(width, height);
    const g = c.getContext("2d");
    g.imageSmoothingEnabled = false;
    const isDev = targetMode === "developer";
    const head = isDev ? MIRRORED_HEAD : GRIDS.creative;
    const opts = { mirror: isDev, dx: isDev ? 1 : 0 };
    drawGrid(g, head.base, opts);
    drawGrid(g, head.hair, opts);
    drawGrid(g, head.ear, opts);
    drawGrid(g, head.brows, opts);
    drawGrid(g, head.glasses, opts);
    drawGrid(g, head.expression, opts);
    return c;
  }

  function buildBody(targetMode) {
    const c = makeCanvas(width, height);
    const g = c.getContext("2d");
    g.imageSmoothingEnabled = false;
    drawGrid(g, GRIDS[targetMode].clothing);
    return c;
  }

  function buildCaches() {
    headCache = {
      creative: buildHead("creative"),
      developer: buildHead("developer")
    };
    bodyCache = {
      creative: buildBody("creative"),
      developer: buildBody("developer")
    };
  }

  function fill(g, x, y, w, h, color) {
    g.fillStyle = color;
    g.fillRect(Math.round(x * unit), Math.round(y * unit), Math.round(w * unit), Math.round(h * unit));
  }

  function drawEyes(g, targetMode, offsetY, { blink = false, winkSide = null, centered = false } = {}) {
    const dx = targetMode === "developer" ? 1 : 0;
    const eyeRow = 11;
    let ox = 0;
    let oy = 0;
    if (!centered && pointer.inside) {
      ox = Math.max(-1, Math.min(1, Math.round(pointer.x - 13.5)));
      oy = Math.max(0, Math.min(1, Math.round(pointer.y - eyeRow - 1)));
    }

    const drawEye = (baseX, side) => {
      const closed = blink || winkSide === side;
      if (closed) {
        g.fillStyle = palette.k;
        g.fillRect((baseX + dx) * unit, (eyeRow + 1) * unit + offsetY, unit * 2, unit);
        return;
      }
      const x = baseX + dx + ox;
      const y = eyeRow + oy;
      g.fillStyle = palette.k;
      g.fillRect(x * unit, y * unit + offsetY, unit * 2, unit * 2);
      g.fillStyle = palette.q;
      g.fillRect((x + 1) * unit, y * unit + offsetY, unit, unit);
    };

    drawEye(9, "left");
    drawEye(16, "right");
  }

  function drawMouth(g, targetMode, offsetY, open = false) {
    const dx = targetMode === "developer" ? 1 : 0;
    const at = (x, y, w, h, color) => {
      g.fillStyle = color;
      g.fillRect((x + dx) * unit, y * unit + offsetY, w * unit, h * unit);
    };

    at(10, 16, 1, 1, palette.m);
    at(17, 16, 1, 1, palette.m);

    if (open) {
      at(11, 16, 6, 1, palette.t);
      at(11, 17, 6, 1, palette.m);
      at(12, 18, 4, 1, palette["7"]);
    } else {
      at(11, 17, 6, 1, palette.m);
      at(12, 18, 4, 1, palette.u);
    }
  }

  function drawChestMark(g, offsetY) {
    const cell = Math.max(1, Math.round(unit / 2));
    const gap = cell;
    const digitWidth = cell * 3;
    const totalWidth = digitWidth * 3 + gap * 2;
    const x0 = Math.round(13.5 * unit - totalWidth / 2);
    const y0 = Math.round(25.2 * unit + offsetY);
    g.fillStyle = palette.chest || "#7FD4FF";

    for (let digit = 0; digit < 3; digit += 1) {
      const dx = x0 + digit * (digitWidth + gap);
      for (let row = 0; row < THREE.length; row += 1) {
        for (let col = 0; col < 3; col += 1) {
          if (THREE[row][col] !== "X") continue;
          g.fillRect(dx + col * cell, y0 + row * cell, cell, cell);
        }
      }
    }
  }

  function drawCharacter(g, targetMode, jumpY, bodyY, opts = {}) {
    g.drawImage(headCache[targetMode], 0, jumpY);
    drawEyes(g, targetMode, jumpY, opts);
    drawMouth(g, targetMode, jumpY, Boolean(opts.open));
    g.drawImage(bodyCache[targetMode], 0, bodyY + jumpY);
    if (targetMode === "creative") drawChestMark(g, bodyY + jumpY);
  }

  function composeFrame(targetMode, jumpY = 0, bodyY = 0, opts = {}) {
    frameCtx.clearRect(0, 0, width, height);
    drawCharacter(frameCtx, targetMode, jumpY, bodyY, opts);
  }

  function drawTint(color, offsetX, offsetY, alpha) {
    tintCtx.clearRect(0, 0, width, height);
    tintCtx.globalCompositeOperation = "source-over";
    tintCtx.drawImage(offscreen.frame, 0, 0);
    tintCtx.globalCompositeOperation = "source-in";
    tintCtx.fillStyle = color;
    tintCtx.fillRect(0, 0, width, height);
    tintCtx.globalCompositeOperation = "source-over";
    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = alpha;
    ctx.drawImage(offscreen.tint, offsetX, offsetY);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  }

  function drawGlitchSlices(intensity = 1) {
    const band = Math.max(3, Math.round(unit * 0.9));
    const maxOffset = Math.max(2, Math.round(unit * 0.22 * intensity));
    for (let y = 0; y < height; y += band) {
      const h = Math.min(band, height - y);
      const offset = Math.round((Math.random() * 2 - 1) * maxOffset);
      ctx.drawImage(offscreen.frame, 0, y, width, h, offset, y, width, h);
    }
  }

  function drawTetrominoBurst(seed = 0) {
    const shapes = [
      [[0, 0], [1, 0], [2, 0], [3, 0]],
      [[0, 0], [0, 1], [1, 1], [2, 1]],
      [[1, 0], [2, 0], [0, 1], [1, 1]],
      [[0, 0], [1, 0], [1, 1], [2, 1]],
      [[0, 0], [1, 0], [0, 1], [1, 1]],
      [[0, 0], [0, 1], [0, 2], [1, 2]]
    ];
    const colors = [palette.lime, palette.cyan, palette.magenta, palette.purple, palette.orange, palette.yellow];
    const count = 7;
    for (let i = 0; i < count; i += 1) {
      const shape = shapes[(i + seed) % shapes.length];
      const color = colors[(i * 3 + seed) % colors.length];
      const ox = Math.floor(Math.random() * (GRID_W - 4));
      const oy = Math.floor(Math.random() * 16);
      ctx.fillStyle = color;
      for (const [sx, sy] of shape) {
        ctx.fillRect((ox + sx) * unit, (oy + sy) * unit, unit, unit);
      }
    }
  }

  function drawPixelated(block) {
    const pw = Math.max(1, Math.ceil(width / block));
    const ph = Math.max(1, Math.ceil(height / block));
    if (offscreen.pixel.width !== pw || offscreen.pixel.height !== ph) {
      offscreen.pixel.width = pw;
      offscreen.pixel.height = ph;
      pixelCtx.imageSmoothingEnabled = false;
    }
    pixelCtx.clearRect(0, 0, pw, ph);
    pixelCtx.drawImage(offscreen.frame, 0, 0, width, height, 0, 0, pw, ph);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(offscreen.pixel, 0, 0, pw, ph, 0, 0, width, height);
  }

  function renderTransition(now, elapsed) {
    const useMode = elapsed < 350 ? transitionFrom : mode;
    composeFrame(useMode, 0, 0, { centered: true, now });

    ctx.clearRect(0, 0, width, height);

    if (elapsed < 240) {
      drawGlitchSlices(1.35);
      drawTint(palette.cyan, Math.round(unit * 0.2), 0, 0.34);
      drawTint(palette.magenta, -Math.round(unit * 0.2), 0, 0.28);
      drawTetrominoBurst(Math.floor(elapsed / 40));
      return;
    }

    let block = 1;
    if (elapsed < 300) block = 8;
    else if (elapsed < 420) block = 4;
    else if (elapsed < 540) block = 2;

    if (block > 1) drawPixelated(block);
    else ctx.drawImage(offscreen.frame, 0, 0);
  }

  function renderGlitchFrame(now, jumpY, bodyY) {
    const blink = now < blinkUntil;
    const wink = now < winkUntil;
    const winkSide = wink ? (mode === "developer" ? "right" : "left") : null;
    composeFrame(mode, jumpY, bodyY, {
      blink,
      winkSide,
      centered: false,
      open: hover,
      now
    });
    ctx.clearRect(0, 0, width, height);
    drawGlitchSlices(0.9);
    drawTint(palette.cyan, Math.round(unit * 0.12), 0, 0.22);
    drawTint(palette.magenta, -Math.round(unit * 0.12), 0, 0.18);
  }

  function update(now) {
    if (!width || !height) return;
    if (reduced) {
      blinkUntil = 0;
      winkUntil = 0;
      ctx.clearRect(0, 0, width, height);
      drawCharacter(ctx, mode, 0, 0, { centered: true, now });
      return;
    }

    if (now >= nextBlink) {
      blinkUntil = now + timing.blinkDuration;
      nextBlink = now + timing.blinkMin + Math.random() * (timing.blinkMax - timing.blinkMin);
    }

    if (now >= nextWink && now - transitionStart > 900) {
      winkUntil = now + timing.winkDuration;
      winkGlitchUntil = now + timing.winkDuration;
      nextWink = now + timing.winkEvery + Math.random() * 2000;
    }

    const jumpY = now < jumpUntil ? -2 * unit : 0;
    const bodyY = Math.floor(now / timing.breathMs) % 2 === 0 ? 0 : unit;
    const elapsed = now - transitionStart;

    if (elapsed >= 0 && elapsed < timing.transition) {
      renderTransition(now, elapsed);
      return;
    }

    if (now < winkGlitchUntil) {
      renderGlitchFrame(now, jumpY, bodyY);
      return;
    }

    const blink = now < blinkUntil;
    const wink = now < winkUntil;
    const winkSide = wink ? (mode === "developer" ? "right" : "left") : null;

    ctx.clearRect(0, 0, width, height);
    drawCharacter(ctx, mode, jumpY, bodyY, {
      blink,
      winkSide,
      open: hover,
      now
    });
  }

  function resize() {
    if (!stage) return;
    const rect = stage.getBoundingClientRect();
    if (rect.height < 40) return;
    dpr = Math.min(window.devicePixelRatio || 1, 3);
    const configured = Number(config.character?.pixelSize);
    const mobileUnit = Math.max(
      8,
      Math.min(13, window.innerWidth * (config.character?.mobileVw || 0.032))
    );
    const cssUnit =
      window.innerWidth <= 900
        ? mobileUnit
        : configured > 0
          ? configured
          : Math.max(4, Math.floor(rect.height / GRID_H));
    const nextUnit = Math.max(2, Math.round(cssUnit * dpr));
    if (nextUnit === unit && width) return;

    unit = nextUnit;
    width = GRID_W * unit;
    height = GRID_H * unit;
    canvas.width = width;
    canvas.height = height;
    canvas.style.width = `${(width / dpr).toFixed(2)}px`;
    canvas.style.height = `${(height / dpr).toFixed(2)}px`;
    ctx.imageSmoothingEnabled = false;

    for (const c of Object.values(offscreen)) {
      c.width = width;
      c.height = height;
    }
    frameCtx.imageSmoothingEnabled = false;
    pixelCtx.imageSmoothingEnabled = false;
    tintCtx.imageSmoothingEnabled = false;

    buildCaches();
    nextBlink = performance.now() + timing.blinkMin;
    nextWink = performance.now() + timing.winkEvery;
  }

  function jump() {
    if (reduced) return;
    jumpUntil = performance.now() + timing.jumpMs;
  }

  function setMode(nextMode, { instant = false } = {}) {
    if (nextMode !== "creative" && nextMode !== "developer") return;
    if (nextMode === mode) return;
    transitionFrom = mode;
    mode = nextMode;
    transitionStart = instant || reduced ? -1e9 : performance.now();
  }

  function setReducedMotion(value) {
    reduced = Boolean(value);
    if (reduced) {
      blinkUntil = 0;
      winkUntil = 0;
      winkGlitchUntil = 0;
      transitionStart = -1e9;
    }
  }

  /* Additive hooks for the mini-games. They do not alter the resting frame. */
  function setGameActive(value) {
    pointer.inside = !value;
    if (value) {
      pointer.x = 14;
      pointer.y = 12;
    }
  }

  function lookAt(x, y) {
    const px = Number(x);
    const py = Number(y);
    if (!Number.isFinite(px) || !Number.isFinite(py)) return;
    pointer.inside = true;
    pointer.x = Math.max(0, Math.min(GRID_W, px));
    pointer.y = Math.max(0, Math.min(GRID_H, py));
  }

  function celebrate() {
    jump();
    if (!reduced) winkUntil = performance.now() + timing.winkDuration;
  }

  function onPointerMove(event) {
    if (event.pointerType === "touch") return;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    pointer.inside = true;
    pointer.x = ((event.clientX - rect.left) / rect.width) * GRID_W;
    pointer.y = ((event.clientY - rect.top) / rect.height) * GRID_H;
  }

  function onPointerLeave() {
    pointer.inside = false;
    pointer.x = 14;
    pointer.y = 12;
  }

  hero?.addEventListener("pointermove", onPointerMove, { passive: true, signal });
  hero?.addEventListener("pointerleave", onPointerLeave, { signal });
  canvas.addEventListener("pointerenter", (event) => {
    if (event.pointerType === "touch") return;
    hover = true;
    audio?.hover?.();
  }, { signal });
  canvas.addEventListener("pointerleave", () => { hover = false; }, { signal });

  const activate = () => {
    jump();
    audio?.click?.();
  };
  canvas.addEventListener("click", activate, { signal });
  canvas.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      activate();
    }
  }, { signal });

  const observer = new ResizeObserver(resize);
  if (stage) observer.observe(stage);
  window.addEventListener("resize", resize, { passive: true, signal });

  resize();
  if (!width) requestAnimationFrame(resize);

  return {
    update,
    resize,
    setMode,
    setReducedMotion,
    setGameActive,
    lookAt,
    celebrate,
    jump,
    getMode: () => mode,
    destroy() {
      observer.disconnect();
      controller.abort();
    }
  };
}

