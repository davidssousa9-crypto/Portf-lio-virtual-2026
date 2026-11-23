/* ============================================================
   PIXEL-ART — bitmaps, SVG builders and logo glyphs.
   Everything ships as vectors; no raster assets.
   ============================================================ */

/* ---------- 5 × 7 arcade glyphs ---------- */
export const GLYPHS = {
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  B: ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
  C: ["01111", "10000", "10000", "10000", "10000", "10000", "01111"],
  D: ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  F: ["11111", "10000", "10000", "11110", "10000", "10000", "10000"],
  G: ["01110", "10001", "10000", "10111", "10001", "10001", "01110"],
  H: ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
  I: ["11111", "00100", "00100", "00100", "00100", "00100", "11111"],
  J: ["00111", "00010", "00010", "00010", "00010", "10010", "01100"],
  K: ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
  L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
  M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
  N: ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
  O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  P: ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
  Q: ["01110", "10001", "10001", "10001", "10101", "10010", "01101"],
  R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  S: ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
  T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
  U: ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
  V: ["10001", "10001", "10001", "10001", "10001", "01010", "00100"],
  W: ["10001", "10001", "10001", "10101", "10101", "11011", "10001"],
  X: ["10001", "10001", "01010", "00100", "01010", "10001", "10001"],
  Y: ["10001", "10001", "01010", "00100", "00100", "00100", "00100"],
  Z: ["11111", "00001", "00010", "00100", "01000", "10000", "11111"],
  0: ["01110", "10011", "10101", "10101", "11001", "10001", "01110"],
  1: ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
  2: ["01110", "10001", "00001", "00010", "00100", "01000", "11111"],
  3: ["11110", "00001", "00001", "01110", "00001", "00001", "11110"],
  4: ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
  5: ["11111", "10000", "11110", "00001", "00001", "10001", "01110"],
  6: ["01110", "10000", "11110", "10001", "10001", "10001", "01110"],
  7: ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
  8: ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
  9: ["01110", "10001", "10001", "01111", "00001", "00001", "01110"],
  "'": ["00100", "00100", "01000", "00000", "00000", "00000", "00000"],
  ".": ["00000", "00000", "00000", "00000", "00000", "00110", "00110"],
  "-": ["00000", "00000", "00000", "11111", "00000", "00000", "00000"],
  " ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"]
};

/* ---------- logo ---------- */
function logoRuns(text, cell, originX, originY) {
  const chars = [...text.toUpperCase()];
  const runs = [];

  chars.forEach((char, index) => {
    const glyph = GLYPHS[char] || GLYPHS[" "];
    const letterX = index * 6;
    glyph.forEach((row, rowIndex) => {
      let start = -1;
      for (let x = 0; x <= 5; x += 1) {
        const filled = x < 5 && row[x] === "1";
        if (filled && start < 0) start = x;
        if (!filled && start >= 0) {
          runs.push({
            x: originX + (letterX + start) * cell,
            y: originY + rowIndex * cell,
            width: (x - start) * cell,
            height: cell
          });
          start = -1;
        }
      }
    });
  });

  return runs;
}

function rectAttributes(run, pad = 0) {
  const n = (value) => Number(value.toFixed(2));
  return `x="${n(run.x - pad)}" y="${n(run.y - pad)}" width="${n(
    run.width + pad * 2
  )}" height="${n(run.height + pad * 2)}"`;
}

/**
 * Builds the JLD-style LED logo as a crisp SVG.
 * `layers: false` returns only the lime ink (used by glitch copies).
 */
export function logoSVG(
  text,
  {
    cell = 7,
    boxWidth = 293,
    boxHeight = 61,
    fill = "currentColor",
    layers = true,
    outline = 4,
    shadow = 4,
    shadowColor = "#262626",
    outlineColor = "#121212"
  } = {}
) {
  const chars = [...text.toUpperCase()];
  const columns = chars.length * 5 + Math.max(0, chars.length - 1);
  const innerWidth = columns * cell;
  const innerHeight = 7 * cell;
  const originX = (boxWidth - innerWidth) / 2;
  const originY = (boxHeight - innerHeight) / 2 - 2;
  const runs = logoRuns(text, cell, originX, originY);

  const ink = runs
    .map((run) => `<rect ${rectAttributes(run)}/>`)
    .join("");
  const outlineRects = layers
    ? runs
        .map((run) => `<rect ${rectAttributes(run, outline)}/>`)
        .join("")
    : "";
  const shadowRects = layers
    ? runs
        .map(
          (run) =>
            `<rect ${rectAttributes(
              { ...run, x: run.x + shadow, y: run.y + shadow },
              outline
            )}/>`
        )
        .join("")
    : "";

  return `<svg class="logo__svg" viewBox="0 0 ${boxWidth} ${boxHeight}" width="100%" height="100%" shape-rendering="crispEdges" aria-hidden="true" focusable="false">
    ${layers ? `<g class="logo__shadow" fill="${shadowColor}">${shadowRects}</g>` : ""}
    ${
      layers
        ? `<g class="logo__outline" fill="${outlineColor}">${outlineRects}</g>`
        : ""
    }
    <g class="logo__ink" fill="${fill}">${ink}</g>
  </svg>`;
}

/* ---------- toolbar icons (bitmaps from the brief) ---------- */
export const ICONS = {
  soundMuted: [
    "....#......",
    "...##......",
    ".####......",
    "#####.#...#",
    "#####..#.#.",
    "#####...#..",
    "#####..#.#.",
    ".####.#...#",
    "...##......",
    "....#......"
  ],
  soundOn: [
    "....#......",
    "...##......",
    ".####.#....",
    "#####..#.#.",
    "#####...#..",
    "#####...#..",
    "#####..#.#.",
    ".####.#....",
    "...##......",
    "....#......"
  ],
  phone: [
    ".######.",
    "########",
    "#......#",
    "#......#",
    "#......#",
    "#......#",
    "#......#",
    "#......#",
    "#......#",
    "########",
    "###..###",
    "########",
    ".######."
  ],
  controller: [
    ".##########.",
    "###.######.#",
    "##...####..#",
    "###.######.#",
    "############",
    "############",
    "####....####",
    "###......###",
    ".##......##."
  ],
  folder: [
    ".####.......",
    "######......",
    "############",
    "#..........#",
    "############",
    "############",
    "############",
    "############",
    "############",
    "############"
  ],
  book: [
    "..#......#..",
    ".#.#....#.#.",
    "#...#..#...#",
    "#....##....#",
    "#....##....#",
    "#....##....#",
    "#....##....#",
    "#....##....#",
    ".##########."
  ]
};

const DOT = [
  "..##..",
  ".####.",
  "######",
  "######",
  ".####.",
  "..##.."
];

function matrixRects(matrix, colorFor) {
  const rects = [];
  matrix.forEach((row, y) => {
    let start = -1;
    let color = null;
    for (let x = 0; x <= row.length; x += 1) {
      const next = x < row.length ? colorFor(row[x]) : null;
      if (next && next === color && start >= 0) continue;
      if (start >= 0) {
        rects.push(
          `<rect x="${start}" y="${y}" width="${x - start}" height="1" fill="${color}"/>`
        );
        start = -1;
        color = null;
      }
      if (next) {
        start = x;
        color = next;
      }
    }
  });
  return rects.join("");
}

export function iconSVG(matrix, { unit = 4.46, color = "currentColor" } = {}) {
  const rows = matrix.length;
  const columns = matrix[0].length;
  const rects = matrixRects(matrix, (char) => (char === "#" ? color : null));
  return `<svg class="dock__icon" width="${(columns * unit).toFixed(2)}" height="${(
    rows * unit
  ).toFixed(2)}" viewBox="0 0 ${columns} ${rows}" shape-rendering="crispEdges" aria-hidden="true" focusable="false">${rects}</svg>`;
}

export function soundIconSVG({ unit = 4.46, color = "currentColor" } = {}) {
  const rows = 10;
  const columns = 11;
  const on = matrixRects(ICONS.soundOn, (char) =>
    char === "#" ? color : null
  );
  const muted = matrixRects(ICONS.soundMuted, (char) =>
    char === "#" ? color : null
  );
  return `<svg class="dock__icon dock__icon--sound" width="${(
    columns * unit
  ).toFixed(2)}" height="${(rows * unit).toFixed(
    2
  )}" viewBox="0 0 ${columns} ${rows}" shape-rendering="crispEdges" aria-hidden="true" focusable="false">
    <g class="sound-on">${on}</g>
    <g class="sound-off">${muted}</g>
  </svg>`;
}

/* ---------- pellets ---------- */
export function dotSVG({ size = 16, color = "#F6C53A" } = {}) {
  const rects = matrixRects(DOT, (char) => (char === "#" ? color : null));
  return `<svg width="${size}" height="${size}" viewBox="0 0 6 6" shape-rendering="crispEdges" aria-hidden="true" focusable="false">${rects}</svg>`;
}

/* ---------- Pac-Man frames (facing down, mouth at the bottom) ---------- */
const PACMAN_OPEN = [
  "....#####....",
  "..#########..",
  ".###########.",
  ".###########.",
  "######.######",
  "######.######",
  "######.######",
  "#####...#####",
  ".####...####.",
  ".####...####.",
  "..##.....##.."
];

function fillCells(matrix, cells) {
  return matrix.map((row, y) => {
    const chars = [...row];
    cells.forEach(([x, cy]) => {
      if (cy === y) chars[x] = "#";
    });
    return chars.join("");
  });
}

const PACMAN_HALF = fillCells(PACMAN_OPEN, [
  [6, 4],
  [6, 5],
  [6, 6],
  [6, 7],
  [6, 8],
  [5, 9],
  [6, 9],
  [7, 9],
  [5, 10],
  [6, 10],
  [7, 10]
]);

const PACMAN_CLOSED = fillCells(PACMAN_OPEN, [
  [6, 4],
  [6, 5],
  [6, 6],
  [5, 7],
  [6, 7],
  [7, 7],
  [5, 8],
  [6, 8],
  [7, 8],
  [5, 9],
  [6, 9],
  [7, 9],
  [4, 10],
  [5, 10],
  [6, 10],
  [7, 10],
  [8, 10]
]);

export const PACMAN_FRAMES = [
  PACMAN_OPEN,
  PACMAN_HALF,
  PACMAN_CLOSED,
  PACMAN_HALF
];

export function pacmanSVG({ width = 59, height = 50, color = "#F6C53A" } = {}) {
  const frames = PACMAN_FRAMES.map((matrix, index) => {
    const rects = matrixRects(matrix, (char) => (char === "#" ? color : null));
    return `<g class="pacman-frame" data-frame="${index}">${rects}</g>`;
  }).join("");

  return `<svg class="pacman-svg" data-frame="0" width="${width}" height="${height}" viewBox="0 0 13 11" shape-rendering="crispEdges" aria-hidden="true" focusable="false">${frames}</svg>`;
}
