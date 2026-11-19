/* ============================================================
   CHARACTER.JS — 28 × 30 layered pixel portrait (V2)
   Spec: wine hair, 13 px glasses with skin lenses, stepped
   mouth, dark developer jacket / white creative tee + heart.
   The public API is unchanged for the calibration lab and games.
   ============================================================ */

const GRID_W = 28;
const GRID_H = 30;
const F_LINE = 9; // top row of the glasses frame
const DOTS = ".".repeat(GRID_W);

/* ------------------------------------------------------------
   tiny grid helpers
   ------------------------------------------------------------ */
const blank = () => Array.from({ length: GRID_H }, () => Array(GRID_W).fill("."));

function put(grid, x, y, char) {
  if (x < 0 || x >= GRID_W || y < 0 || y >= GRID_H) return;
  grid[y][x] = char;
}

function rect(grid, x, y, w, h, char) {
  for (let row = y; row < y + h; row += 1) {
    for (let col = x; col < x + w; col += 1) put(grid, col, row, char);
  }
}

function toRows(grid) {
  return grid.map((row) => row.join(""));
}

function mirrorRows(rows) {
  return rows.map((row) => [...row].reverse().join(""));
}

function hash(x, y, seed = 0) {
  let h = ((x + 1) * 374761393 + (y + 1) * 668265263 + seed * 1442695041) ^ 0x9e3779b9;
  h = (h ^ (h >>> 13)) * 1274126177;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

/* ------------------------------------------------------------
   BASE — face, forehead band, jaw, neck
   ------------------------------------------------------------ */
function buildBase() {
  const g = blank();

  /* face slab */
  rect(g, 7, 5, 14, 10, "1"); // rows F-4 .. F+5
  rect(g, 8, 15, 12, 2, "1"); // rows F+6 .. F+7
  rect(g, 9, 17, 10, 2, "1"); // rows F+8 .. F+9
  rect(g, 10, 19, 8, 1, "1"); // row F+10

  /* side shading + fixed-seed skin variation */
  for (let y = 5; y <= 14; y += 1) {
    put(g, 7, y, "3");
    put(g, 8, y, hash(8, y, 1) > 0.5 ? "3" : "1");
    put(g, 19, y, hash(19, y, 2) > 0.5 ? "5" : "1");
    put(g, 20, y, "5");
  }

  /* forehead band at the hairline (F-4) */
  rect(g, 7, 5, 11, 1, "6");
  put(g, 6, 5, "6");
  put(g, 18, 5, "6");

  /* forehead below the fringe: base skin with noise */
  for (let y = 6; y <= 8; y += 1) {
    for (let x = 9; x <= 18; x += 1) {
      const n = hash(x, y, 3);
      put(g, x, y, n < 0.2 ? "2" : n > 0.84 ? "3" : "1");
    }
  }

  /* cheeks (F+5) + medium row (F+6) */
  rect(g, 9, 14, 3, 1, "6");
  rect(g, 13, 14, 2, 1, "6");
  rect(g, 17, 14, 2, 1, "6");
  put(g, 19, 14, "6");
  for (let x = 8; x <= 19; x += 1) {
    put(g, x, 15, hash(x, 15, 4) > 0.55 ? "3" : "1");
  }

  /* lower lip / chin band */
  put(g, 13, 18, "r");
  put(g, 14, 18, "r");

  /* chin base, rounded corners in 1 px */
  rect(g, 10, 19, 8, 1, "1");
  put(g, 10, 19, "6");
  put(g, 17, 19, "6");
  put(g, 11, 19, "5");
  put(g, 16, 19, "5");

  /* neck: 7 px top, 5 px, then the 4 px light base */
  rect(g, 10, 20, 7, 1, "6");
  rect(g, 11, 20, 5, 1, "5");
  rect(g, 11, 21, 5, 1, "4");
  rect(g, 11, 22, 4, 1, "4");

  return toRows(g);
}

/* ------------------------------------------------------------
   HAIR — wine mass, irregular top, loose strands, nape
   ------------------------------------------------------------ */
function hairTone(x, y) {
  const n = hash(x, y, 11);
  if (n < 0.26) return "A";
  if (n < 0.56) return "a";
  if (n < 0.82) return "c";
  return "C";
}

function buildHair() {
  const g = blank();
  const bands = [
    [7, 19],
    [5, 21],
    [4, 22],
    [4, 22],
    [5, 23]
  ];

  bands.forEach(([from, to], y) => {
    for (let x = from; x <= to; x += 1) {
      if (y === 0 && (x === 10 || x === 15)) continue; // irregular, partially cut top
      if (y === 4 && (x === 8 || x === 19)) continue;
      put(g, x, y, hairTone(x, y));
    }
  });

  /* isolated strand on the side opposite the ear (row 1) */
  put(g, 4, 1, "a");

  /* sides: opposite ear ends at the glasses line; ear side reaches F+1 */
  for (let x = 5; x <= 6; x += 1) {
    for (let y = 5; y <= 9; y += 1) put(g, x, y, hairTone(x, y));
  }
  put(g, 7, 8, "l"); // 1 px of light skin piercing the hair at F-1
  put(g, 7, 9, "a");

  for (let x = 18; x <= 22; x += 1) {
    for (let y = 5; y <= 10; y += 1) put(g, x, y, hairTone(x, y));
  }

  /* fringe: 2 irregular rows above the brows */
  for (let x = 5; x <= 8; x += 1) put(g, x, 6, hairTone(x, 6));
  for (let x = 15; x <= 22; x += 1) put(g, x, 6, hairTone(x, 6));
  for (let x = 5; x <= 8; x += 1) put(g, x, 7, hairTone(x, 7));
  for (let x = 10; x <= 12; x += 1) put(g, x, 7, hairTone(x, 7));
  for (let x = 15; x <= 22; x += 1) put(g, x, 7, hairTone(x, 7));

  /* 1 px shine at F-3, opposite the ear */
  put(g, 7, 6, "s");

  /* sideburn below the temple + loose hair on the cheek */
  put(g, 21, 12, "y");
  put(g, 22, 12, "y");
  put(g, 20, 16, "n");

  /* nape: 4 px wide, 2 rows, outside the jaw on the ear side */
  rect(g, 19, 18, 4, 1, "n");
  rect(g, 19, 19, 4, 1, "N");

  return toRows(g);
}

/* ------------------------------------------------------------
   BROWS — F-1, 3 px left / 2 px right over the lenses
   ------------------------------------------------------------ */
function buildBrows() {
  const g = blank();
  rect(g, 9, 8, 3, 1, "B");
  rect(g, 15, 8, 2, 1, "B");
  return toRows(g);
}

/* ------------------------------------------------------------
   GLASSES — 13 px frame, 4 x 3 lenses, bridge, heavy lower rim
   ------------------------------------------------------------ */
function buildGlasses() {
  const g = blank();

  /* F: top bar with a 1 px skin gap at the nose */
  rect(g, 7, 9, 6, 1, "g");
  rect(g, 14, 9, 6, 1, "g");

  /* F+1: bridge (inner frames) + lens interiors */
  put(g, 7, 10, "g");
  rect(g, 8, 10, 4, 1, "l");
  rect(g, 12, 10, 3, 1, "g");
  rect(g, 15, 10, 4, 1, "l");
  put(g, 19, 10, "g");

  /* F+2: lenses + nose gap + temple toward the ear */
  put(g, 7, 11, "g");
  rect(g, 8, 11, 4, 1, "l");
  put(g, 12, 11, "g");
  put(g, 14, 11, "g");
  rect(g, 15, 11, 4, 1, "l");
  put(g, 19, 11, "g");
  rect(g, 20, 11, 3, 1, "g");

  /* F+3 */
  put(g, 7, 12, "g");
  rect(g, 8, 12, 4, 1, "l");
  put(g, 12, 12, "g");
  put(g, 14, 12, "g");
  rect(g, 15, 12, 4, 1, "l");
  put(g, 19, 12, "g");

  /* F+4: heavier 4 px lower rim on each lens */
  rect(g, 8, 13, 4, 1, "G");
  rect(g, 15, 13, 4, 1, "G");

  /* opposite side outer frame is 1 px taller (F-1 .. F+3) */
  put(g, 7, 8, "g");

  return toRows(g);
}

/* ------------------------------------------------------------
   EAR — 2 x 4 on the creative side (mirrored for developer)
   ------------------------------------------------------------ */
function buildEar() {
  const g = blank();
  for (let y = 11; y <= 14; y += 1) {
    put(g, 21, y, "e");
    put(g, 22, y, "e");
  }
  put(g, 21, 11, "6");
  put(g, 21, 12, "l");
  put(g, 21, 13, "6");
  put(g, 21, 14, "6");
  return toRows(g);
}

/* ------------------------------------------------------------
   EXPRESSION — nose shadow / blush accents
   ------------------------------------------------------------ */
function buildExpression() {
  const g = blank();
  put(g, 13, 13, "5");
  put(g, 13, 14, "6");
  put(g, 14, 14, "6");
  put(g, 13, 15, "5");
  return toRows(g);
}

/* ------------------------------------------------------------
   CREATIVE CLOTHING — white tee, stepped collar, folds
   ------------------------------------------------------------ */
function buildCreativeClothing() {
  const g = blank();

  /* collar tips rising beside the neck and falling to the shoulders */
  put(g, 9, 20, "f");
  put(g, 17, 20, "f");
  put(g, 8, 21, "f");
  put(g, 18, 21, "f");

  /* shoulders start at F+13 with 16 px, then 20, 22, 22, 25 */
  rect(g, 6, 22, 16, 1, "q");
  put(g, 6, 22, "f");
  put(g, 21, 22, "f");
  put(g, 7, 22, "f");
  put(g, 19, 22, "f");

  rect(g, 4, 23, 20, 1, "q");
  put(g, 4, 23, "f");
  put(g, 23, 23, "f");
  rect(g, 11, 23, 4, 1, "f"); // 4 px front collar

  rect(g, 3, 24, 22, 1, "q");
  rect(g, 3, 25, 22, 1, "q");
  put(g, 3, 24, "f");
  put(g, 24, 24, "f");
  put(g, 3, 25, "f");
  put(g, 24, 25, "f");

  for (let y = 26; y <= 29; y += 1) {
    rect(g, 2, y, 25, 1, "q");
    put(g, 2, y, "f");
    put(g, 26, y, "f");
  }

  /* 1 px vertical folds, one on each side of the chest */
  for (let y = 24; y <= 29; y += 1) {
    put(g, 9, y, "f");
    put(g, 18, y, "f");
  }

  return toRows(g);
}

/* ------------------------------------------------------------
   DEVELOPER CLOTHING — dark jacket, center panel, stripes
   ------------------------------------------------------------ */
function buildDeveloperClothing() {
  const g = blank();

  /* collar tip beside the jaw + dark flaps around the neck */
  put(g, 9, 19, "K");
  put(g, 18, 19, "K");
  rect(g, 6, 20, 4, 1, "K");
  rect(g, 17, 20, 3, 1, "K");
  rect(g, 7, 21, 4, 1, "K");
  rect(g, 16, 21, 3, 1, "K");

  /* shoulders */
  rect(g, 6, 22, 16, 1, "X");
  put(g, 6, 22, "V");
  put(g, 21, 22, "V");
  put(g, 10, 22, "K");
  put(g, 15, 22, "K");

  rect(g, 4, 23, 20, 1, "X");
  put(g, 4, 23, "V");
  put(g, 23, 23, "V");
  rect(g, 12, 23, 3, 1, "D");
  put(g, 11, 23, "K");
  put(g, 15, 23, "K");

  rect(g, 3, 24, 22, 1, "X");
  rect(g, 3, 25, 22, 1, "X");
  put(g, 3, 24, "V");
  put(g, 24, 24, "V");
  put(g, 3, 25, "V");
  put(g, 24, 25, "V");

  for (let y = 26; y <= 29; y += 1) {
    rect(g, 2, y, 25, 1, "X");
    put(g, 2, y, "V");
    put(g, 26, y, "V");
  }

  /* 3 px center panel flanked by 1 px dark columns */
  for (let y = 24; y <= 29; y += 1) {
    rect(g, 12, y, 3, 1, "D");
    put(g, 11, y, "K");
    put(g, 15, y, "K");
  }

  /* one short stripe + two long stripes on each side (2 px gaps) */
  for (let y = 24; y <= 26; y += 1) {
    put(g, 9, y, "K");
    put(g, 18, y, "K");
  }
  for (let y = 23; y <= 29; y += 1) {
    put(g, 7, y, "K");
    put(g, 20, y, "K");
  }
  for (let y = 24; y <= 29; y += 1) {
    put(g, 5, y, "K");
    put(g, 22, y, "K");
  }

  return toRows(g);
}

/* ------------------------------------------------------------
   palettes
   ------------------------------------------------------------ */
const DEFAULT_PALETTE = {
  /* skin */
  "1": "#E9C29B",
  "2": "#ECC7A1",
  "3": "#E8BE96",
  "4": "#EBC59E",
  "5": "#E5B98F",
  "6": "#DDA383",
  "7": "#C98B6C",
  l: "#EBC59E",
  r: "#D99A7E",
  e: "#E8B58C",

  /* hair */
  a: "#4B1E2C",
  A: "#381722",
  c: "#62283A",
  C: "#55233A",
  s: "#8A5A5E",
  y: "#5A2A3C",
  n: "#3F1A2A",
  N: "#4B1E2C",
  B: "#3B1D2D",

  /* glasses */
  g: "#3A2A38",
  G: "#2B1E2B",

  /* face details */
  k: "#0F0F10",
  m: "#3F1A2A",
  t: "#E6E6E6",
  p: "#A85F58",
  "8": "#3F1A2A",

  /* clothing */
  q: "#FFFFFF",
  f: "#E6E6E6",
  X: "#322A30",
  V: "#2B2430",
  K: "#231C28",
  D: "#2D2830",

  /* aliases kept for older tools / config overrides */
  h: "#4B1E2C",
  H: "#381722",
  j: "#62283A",
  x: "#8A5A5E",
  W: "#F7F4EC",
  w: "#D8D2C7",
  "7": "#A85F58",
  u: "#C97F72",
  d: "#C98B6C",
  Q: "#C9A45C",
  J: "#232026",
  P: "#3B353F",
  chest: "#7FD4FF",
  cyan: "#12C2ED",
  magenta: "#ED3D91",
  lime: "#BCED12",
  yellow: "#F6C53A",
  purple: "#894AED",
  orange: "#ED7812",
  red: "#EE3B3E"
};

const SKIN_CHARS = new Set(["1", "2", "3", "4", "5", "6", "7", "l", "r", "e"]);
const SKIN_NOISE = ["#E9C099", "#E7BC93", "#E8BE96", "#EAC29B"];

const CREATIVE_HEAD = {
  base: buildBase(),
  hair: buildHair(),
  brows: buildBrows(),
  glasses: buildGlasses(),
  ear: buildEar(),
  expression: buildExpression()
};

const DEVELOPER_HEAD = {
  base: mirrorRows(CREATIVE_HEAD.base),
  hair: mirrorRows(CREATIVE_HEAD.hair),
  brows: mirrorRows(CREATIVE_HEAD.brows),
  glasses: mirrorRows(CREATIVE_HEAD.glasses),
  ear: mirrorRows(CREATIVE_HEAD.ear),
  expression: mirrorRows(CREATIVE_HEAD.expression)
};

const GRIDS = {
  creative: {
    ...CREATIVE_HEAD,
    clothing: buildCreativeClothing()
  },
  developer: {
    ...DEVELOPER_HEAD,
    clothing: buildDeveloperClothing()
  }
};

/* Read-only views for the calibration lab, loader and games. */
export const CHARACTER_GRIDS = GRIDS;
export { GRID_W, GRID_H, F_LINE, DEFAULT_PALETTE };

/* ------------------------------------------------------------
   static pixel map (loader assembly / game mascots)
   ------------------------------------------------------------ */
export function getCharacterPixels(mode = "creative") {
  const target = mode === "developer" ? "developer" : "creative";
  const layers = GRIDS[target];
  const map = new Map();
  const add = (x, y, char) => {
    if (x < 0 || x >= GRID_W || y < 0 || y >= GRID_H) return;
    const color = DEFAULT_PALETTE[char];
    if (!color) return;
    map.set(`${x}:${y}`, { x, y, color });
  };

  ["base", "hair", "brows", "glasses", "ear", "expression", "clothing"].forEach((name) => {
    const rows = layers[name] || [];
    rows.forEach((row, y) => {
      [...row].forEach((char, x) => {
        if (char === "." || char === " ") return;
        add(x, y, char);
      });
    });
  });

  /* resting eyes (developer frame is the base frame) */
  [[10, 11], [11, 11], [17, 11], [18, 11]].forEach(([x, y]) => add(x, y, "k"));

  /* resting mouth */
  add(10, 16, "m");
  add(16, 16, "m");
  for (let x = 11; x <= 15; x += 1) add(x, 16, "t");
  for (let x = 12; x <= 14; x += 1) add(x, 17, "p");
  add(15, 17, "r");
  add(13, 18, "r");
  add(14, 18, "r");

  /* fine-grid heart for the creative tee */
  if (target === "creative") {
    const heart = [
      "XXX...XXX",
      "XXXX.XXXX",
      ".XXXXXXX.",
      "..XXXXX..",
      "...XXX...",
      "....X...."
    ];
    const cell = 1 / 3;
    const x0 = 13.5 - 4.5 * cell;
    const y0 = 25;
    heart.forEach((row, ry) => {
      [...row].forEach((char, rx) => {
        if (char !== "X") return;
        add(Math.round(x0 + rx * cell), Math.round(y0 + ry * cell), "heart");
      });
    });
  }

  return [...map.values()];
}

/* heart color is not a matrix char; expose it for the loader */
DEFAULT_PALETTE.heart = "#E53935";

/* ============================================================
   RENDERER
   ============================================================ */

function shade(hex, amount) {
  const value = hex.replace("#", "");
  const num = parseInt(value.length === 3 ? value.split("").map((c) => c + c).join("") : value, 16);
  const r = Math.max(0, Math.min(255, ((num >> 16) & 255) + amount));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 255) + amount));
  const b = Math.max(0, Math.min(255, (num & 255) + amount));
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

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
  let winUntil = 0;
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

  function skinNoise(x, y, char) {
    const base = palette[char] || DEFAULT_PALETTE[char];
    if (!base) return "#FF00FF";
    const n = hash(x, y, char.charCodeAt(0));
    const amount = Math.round((n - 0.5) * 0.06 * 255); // ±3% luminosity
    return shade(base, amount);
  }

  function drawGrid(g, grid, { dx = 0 } = {}) {
    for (let y = 0; y < GRID_H; y += 1) {
      const row = grid[y] || DOTS;
      for (let x = 0; x < GRID_W; x += 1) {
        const char = row[x];
        if (!char || char === "." || char === " ") continue;
        let color = palette[char];
        if (!color) continue;
        if (SKIN_CHARS.has(char)) color = skinNoise(x, y, char);
        const px = x + dx;
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
    const head = GRIDS[targetMode];
    drawGrid(g, head.base);
    drawGrid(g, head.hair);
    drawGrid(g, head.brows);
    drawGrid(g, head.glasses);
    drawGrid(g, head.ear);
    drawGrid(g, head.expression);
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

  function drawEyes(g, offsetY, { blink = false, winkSide = null, centered = false } = {}) {
    const eyeRow = F_LINE + 2;
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
        g.fillRect((baseX + ox) * unit, (eyeRow + 1) * unit + offsetY, unit * 2, unit);
        return;
      }
      g.fillStyle = palette.k;
      g.fillRect((baseX + ox) * unit, (eyeRow + oy) * unit + offsetY, unit * 2, unit);
    };

    drawEye(10, "left");
    drawEye(17, "right");
  }

  function drawMouth(g, offsetY, open = false) {
    const at = (x, y, w, h, color) => {
      g.fillStyle = color;
      g.fillRect(x * unit, y * unit + offsetY, w * unit, h * unit);
    };

    /* F+7: dark corners + 5 px teeth */
    at(10, 16, 1, 1, palette.m);
    at(16, 16, 1, 1, palette.m);
    at(11, 16, 5, 1, palette.t);

    if (open) {
      at(11, 17, 5, 1, palette.m);
      at(12, 18, 3, 1, palette.p);
      at(12, 19, 3, 1, palette.m);
    } else {
      /* F+8: 3 px lip + 1 px rosy side; F+9: 2 px rosy chin */
      at(12, 17, 3, 1, palette.p);
      at(15, 17, 1, 1, palette.r);
      at(13, 18, 2, 1, palette.r);
    }
  }

  const HEART = [
    "XXX...XXX",
    "XXXX.XXXX",
    ".XXXXXXX.",
    "..XXXXX..",
    "...XXX...",
    "....X...."
  ];

  function drawHeart(g, offsetY, now) {
    const cell = unit / 3;
    const pulse = now % 1500 < 150 ? -1 : 0;
    const x0 = 13.5 * unit - 4.5 * cell;
    const y0 = 25 * unit + offsetY + pulse * cell;
    g.fillStyle = palette.heart || "#E53935";
    for (let row = 0; row < HEART.length; row += 1) {
      for (let col = 0; col < HEART[row].length; col += 1) {
        if (HEART[row][col] !== "X") continue;
        g.fillRect(
          Math.round(x0 + col * cell),
          Math.round(y0 + row * cell),
          Math.ceil(cell),
          Math.ceil(cell)
        );
      }
    }
  }

  function drawCharacter(g, targetMode, jumpY, bodyY, opts = {}) {
    g.drawImage(headCache[targetMode], 0, jumpY);
    drawEyes(g, jumpY, opts);
    drawMouth(g, jumpY, Boolean(opts.open));
    g.drawImage(bodyCache[targetMode], 0, bodyY + jumpY);
    if (targetMode === "creative") drawHeart(g, bodyY + jumpY, opts.now || performance.now());
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
      winUntil = 0;
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
    const winY = now < winUntil ? -unit : 0;
    const bodyY = Math.floor(now / timing.breathMs) % 2 === 0 ? 0 : unit;
    const elapsed = now - transitionStart;

    if (elapsed >= 0 && elapsed < timing.transition) {
      renderTransition(now, elapsed);
      return;
    }

    if (now < winkGlitchUntil) {
      renderGlitchFrame(now, jumpY + winY, bodyY);
      return;
    }

    const blink = now < blinkUntil;
    const wink = now < winkUntil;
    const winkSide = wink ? (mode === "developer" ? "right" : "left") : null;

    ctx.clearRect(0, 0, width, height);
    drawCharacter(ctx, mode, jumpY + winY, bodyY, {
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
      winUntil = 0;
      transitionStart = -1e9;
    }
  }

  /* Additive hooks for the mini-games. They do not alter the resting frame. */
  function setGameActive(value) {
    pointer.inside = Boolean(value);
    if (!value) {
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

  function celebrateWin() {
    if (reduced) return;
    winUntil = performance.now() + 520;
    winkUntil = performance.now() + timing.winkDuration;
    nextWink = performance.now() + timing.winkEvery;
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
    celebrateWin,
    jump,
    getMode: () => mode,
    destroy() {
      observer.disconnect();
      controller.abort();
    }
  };
}
