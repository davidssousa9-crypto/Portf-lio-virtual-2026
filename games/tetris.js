/* ============================================================
   TETRIS MINI — 10 × 20 board with keyboard and touch controls.
   ============================================================ */

import { createLoop } from "./core/loop.js";
import { createKeys } from "./core/input.js";
import { setupCanvas, drawGrid, pixelText } from "./core/pixel.js";

const COLS = 10;
const ROWS = 20;
const CELL = 24;
const W = COLS * CELL;
const H = ROWS * CELL;

const SHAPES = {
  I: { color: "#12C2ED", matrix: [[1, 1, 1, 1]] },
  J: { color: "#124AED", matrix: [[1, 0, 0], [1, 1, 1]] },
  L: { color: "#ED7812", matrix: [[0, 0, 1], [1, 1, 1]] },
  O: { color: "#F6C53A", matrix: [[1, 1], [1, 1]] },
  S: { color: "#BCED12", matrix: [[0, 1, 1], [1, 1, 0]] },
  T: { color: "#894AED", matrix: [[0, 1, 0], [1, 1, 1]] },
  Z: { color: "#ED3D91", matrix: [[1, 1, 0], [0, 1, 1]] }
};

const KEYS = Object.keys(SHAPES);

function rotate(matrix) {
  return matrix[0].map((_, index) => matrix.map((row) => row[index]).reverse());
}

export function createGame({ shell, api }) {
  const { canvas, ctx } = setupCanvas(shell.stage, W, H);
  const keys = createKeys();
  let board = [];
  let current = null;
  let gravity = 0;
  let gravityStep = 0.72;
  let moveTimer = 0;
  let score = 0;
  let lines = 0;
  let over = false;

  function emptyBoard() {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  }

  function spawn() {
    const key = KEYS[Math.floor(Math.random() * KEYS.length)];
    const shape = SHAPES[key];
    const matrix = shape.matrix.map((row) => [...row]);
    current = {
      key,
      color: shape.color,
      matrix,
      x: Math.floor((COLS - matrix[0].length) / 2),
      y: 0
    };
    if (collides(current.matrix, current.x, current.y)) {
      over = true;
      loop.stop();
      api.gameOver({ score });
    }
  }

  function collides(matrix, ox, oy) {
    for (let y = 0; y < matrix.length; y += 1) {
      for (let x = 0; x < matrix[y].length; x += 1) {
        if (!matrix[y][x]) continue;
        const px = ox + x;
        const py = oy + y;
        if (px < 0 || px >= COLS || py >= ROWS) return true;
        if (py >= 0 && board[py][px]) return true;
      }
    }
    return false;
  }

  function lock() {
    current.matrix.forEach((row, y) => {
      row.forEach((value, x) => {
        if (!value) return;
        const py = current.y + y;
        if (py >= 0) board[py][current.x + x] = current.color;
      });
    });

    let cleared = 0;
    for (let y = ROWS - 1; y >= 0; y -= 1) {
      if (board[y].every(Boolean)) {
        board.splice(y, 1);
        board.unshift(Array(COLS).fill(null));
        cleared += 1;
        y += 1;
      }
    }

    if (cleared) {
      lines += cleared;
      score += [0, 100, 300, 500, 800][cleared] || 800;
      gravityStep = Math.max(0.16, 0.72 - lines * 0.025);
      api.setScore(score);
      api.sfx(cleared >= 3 ? "power" : "coin");
      api.setStatus(`LINHAS ${lines} · ${cleared} LIMPA${cleared > 1 ? "S" : ""}`);
    }
    spawn();
  }

  function move(dx) {
    if (!current || over) return;
    if (!collides(current.matrix, current.x + dx, current.y)) {
      current.x += dx;
      api.sfx("click");
      draw();
    }
  }

  function turn() {
    if (!current || over) return;
    const next = rotate(current.matrix);
    if (!collides(next, current.x, current.y)) {
      current.matrix = next;
      api.sfx("jump");
      draw();
    }
  }

  function stepDown() {
    if (!current || over) return false;
    if (!collides(current.matrix, current.x, current.y + 1)) {
      current.y += 1;
      draw();
      return true;
    }
    lock();
    draw();
    return false;
  }

  function hardDrop() {
    if (!current || over) return;
    while (!collides(current.matrix, current.x, current.y + 1)) current.y += 1;
    lock();
    draw();
  }

  function reset() {
    board = emptyBoard();
    score = 0;
    lines = 0;
    gravity = 0;
    gravityStep = 0.72;
    moveTimer = 0;
    over = false;
    spawn();
    api.setScore(0);
    api.setStatus("← → MOVE · ↑ GIRA · ESPAÇO DROP");
    draw();
  }

  function update(dt) {
    if (over) return;
    const left = keys.has("ArrowLeft", "a", "A");
    const right = keys.has("ArrowRight", "d", "D");
    const soft = keys.has("ArrowDown", "s", "S");
    moveTimer -= dt;
    if ((left || right) && moveTimer <= 0) {
      move(left ? -1 : 1);
      moveTimer = 0.11;
    }
    if (keys.took("ArrowUp", "w", "W")) turn();
    if (keys.took(" ", "Spacebar")) hardDrop();
    keys.clearPressed();

    gravity += dt * (soft ? 8 : 1);
    if (gravity >= gravityStep) {
      gravity = 0;
      stepDown();
    }
    if (!over) draw();
  }

  function draw() {
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, W, H);
    drawGrid(ctx, W, H, CELL, "rgba(237,237,237,0.05)");

    board.forEach((row, y) => {
      row.forEach((color, x) => {
        if (!color) return;
        ctx.fillStyle = color;
        ctx.fillRect(x * CELL + 1, y * CELL + 1, CELL - 2, CELL - 2);
        ctx.fillStyle = "rgba(255,255,255,0.16)";
        ctx.fillRect(x * CELL + 1, y * CELL + 1, CELL - 2, 3);
      });
    });

    if (current) {
      current.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
          if (!value) return;
          const px = (current.x + x) * CELL;
          const py = (current.y + y) * CELL;
          ctx.fillStyle = current.color;
          ctx.fillRect(px + 1, py + 1, CELL - 2, CELL - 2);
          ctx.fillStyle = "rgba(255,255,255,0.2)";
          ctx.fillRect(px + 1, py + 1, CELL - 2, 3);
        });
      });
    }

    pixelText(ctx, `LINHAS ${String(lines).padStart(2, "0")}`, 8, 6, 10, "rgba(237,237,237,0.45)");
  }

  const loop = createLoop(update);

  const touch = document.createElement("div");
  touch.className = "arcade-touch";
  shell.stage.classList.add("has-touch");
  touch.innerHTML = `
    <button type="button" data-touch="left" aria-label="Mover para a esquerda">←</button>
    <button type="button" data-touch="rotate" aria-label="Girar peça">↻</button>
    <button type="button" data-touch="right" aria-label="Mover para a direita">→</button>
    <button type="button" data-touch="down" aria-label="Descer peça">↓</button>
    <button type="button" data-touch="drop" aria-label="Soltar peça">⤓</button>
  `;
  touch.addEventListener("pointerdown", (event) => {
    const action = event.target.closest("[data-touch]")?.dataset.touch;
    if (!action || over) return;
    if (action === "left") move(-1);
    if (action === "right") move(1);
    if (action === "rotate") turn();
    if (action === "down") stepDown();
    if (action === "drop") hardDrop();
  });
  shell.stage.append(touch);

  return {
    init() {
      reset();
    },
    start() {
      if (over) reset();
      loop.start();
    },
    pause() {
      loop.stop();
    },
    destroy() {
      loop.stop();
      keys.destroy();
      touch.remove();
      canvas.remove();
    }
  };
}
