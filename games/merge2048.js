/* ============================================================
   2048 PIXELS — DOM board, keyboard and swipe.
   ============================================================ */

import { createKeys, bindSwipe } from "./core/input.js";

const SIZE = 4;

function emptyBoard() {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
}

function clone(board) {
  return board.map((row) => [...row]);
}

function addRandom(board) {
  const free = [];
  board.forEach((row, y) => row.forEach((value, x) => {
    if (value === 0) free.push({ x, y });
  }));
  if (!free.length) return false;
  const spot = free[Math.floor(Math.random() * free.length)];
  board[spot.y][spot.x] = Math.random() < 0.9 ? 2 : 4;
  return true;
}

function collapse(line) {
  const compact = line.filter(Boolean);
  const output = [];
  let gained = 0;
  for (let i = 0; i < compact.length; i += 1) {
    if (compact[i] === compact[i + 1]) {
      const merged = compact[i] * 2;
      output.push(merged);
      gained += merged;
      i += 1;
    } else {
      output.push(compact[i]);
    }
  }
  while (output.length < SIZE) output.push(0);
  return { line: output, gained };
}

function rotate(board) {
  const out = emptyBoard();
  for (let y = 0; y < SIZE; y += 1) {
    for (let x = 0; x < SIZE; x += 1) {
      out[x][SIZE - 1 - y] = board[y][x];
    }
  }
  return out;
}

function move(board, direction) {
  let working = clone(board);
  let rotations = 0;
  if (direction === "up") rotations = 1;
  if (direction === "right") rotations = 2;
  if (direction === "down") rotations = 3;
  for (let i = 0; i < rotations; i += 1) working = rotate(working);

  let moved = false;
  let gained = 0;
  working = working.map((row) => {
    const result = collapse(row);
    gained += result.gained;
    if (result.line.some((value, index) => value !== row[index])) moved = true;
    return result.line;
  });

  for (let i = 0; i < (4 - rotations) % 4; i += 1) working = rotate(working);
  return { board: working, moved, gained };
}

function canMove(board) {
  for (let y = 0; y < SIZE; y += 1) {
    for (let x = 0; x < SIZE; x += 1) {
      if (board[y][x] === 0) return true;
      if (x + 1 < SIZE && board[y][x] === board[y][x + 1]) return true;
      if (y + 1 < SIZE && board[y][x] === board[y + 1][x]) return true;
    }
  }
  return false;
}

export function createGame({ shell, api }) {
  const keys = createKeys();
  let board = emptyBoard();
  let score = 0;
  let over = false;
  let won = false;
  let grid = null;

  function build() {
    grid = document.createElement("div");
    grid.className = "pixel-2048";
    grid.setAttribute("role", "grid");
    grid.setAttribute("aria-label", "Tabuleiro 2048. Use as setas ou deslize.");
    for (let index = 0; index < SIZE * SIZE; index += 1) {
      const cell = document.createElement("div");
      cell.className = "pixel-2048__cell";
      cell.dataset.index = String(index);
      grid.append(cell);
    }
    shell.stage.append(grid);
    const unbind = bindSwipe(grid, (direction) => {
      if (direction === "left" || direction === "right" || direction === "up" || direction === "down") {
        play(direction);
      }
    });
    grid.addEventListener("pointerdown", () => grid.focus({ preventScroll: true }), { passive: true });
    grid.dataset.unbind = "1";
    return unbind;
  }

  let unbindSwipe = null;

  function render() {
    if (!grid) return;
    grid.querySelectorAll(".pixel-2048__cell").forEach((cell, index) => {
      const y = Math.floor(index / SIZE);
      const x = index % SIZE;
      const value = board[y][x];
      cell.textContent = value ? String(value) : "";
      cell.dataset.value = String(value);
      cell.classList.toggle("is-filled", value > 0);
    });
  }

  function reset() {
    board = emptyBoard();
    score = 0;
    over = false;
    won = false;
    addRandom(board);
    addRandom(board);
    api.setScore(0);
    api.setStatus("JUNTE OS NÚMEROS ATÉ 2048");
    render();
  }

  function play(direction) {
    if (over) return;
    const result = move(board, direction);
    if (!result.moved) return;
    board = result.board;
    score += result.gained;
    addRandom(board);
    api.setScore(score);
    api.sfx(result.gained > 0 ? "coin" : "click");
    render();

    if (board.some((row) => row.some((value) => value >= 2048)) && !won) {
      won = true;
      over = true;
      api.win({ score, xp: 40, coins: 6, badge: "2048" });
      return;
    }
    if (!canMove(board)) {
      over = true;
      api.gameOver({ score });
    }
  }

  const onKeydown = (event) => {
    const map = {
      ArrowLeft: "left",
      ArrowRight: "right",
      ArrowUp: "up",
      ArrowDown: "down",
      a: "left",
      d: "right",
      w: "up",
      s: "down",
      A: "left",
      D: "right",
      W: "up",
      S: "down"
    };
    const direction = map[event.key];
    if (!direction) return;
    event.preventDefault();
    play(direction);
  };

  return {
    init() {
      unbindSwipe = build();
      reset();
    },
    start() {
      if (over) reset();
      grid?.setAttribute("tabindex", "0");
      grid?.focus({ preventScroll: true });
      window.addEventListener("keydown", onKeydown);
    },
    pause() {
      window.removeEventListener("keydown", onKeydown);
    },
    destroy() {
      window.removeEventListener("keydown", onKeydown);
      unbindSwipe?.();
      keys.destroy();
      grid?.remove();
    }
  };
}
