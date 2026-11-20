/* ============================================================
   PIXEL SNAKE — grid snake with swipe and keyboard controls.
   ============================================================ */

import { createLoop } from "./core/loop.js";
import { createKeys, bindSwipe } from "./core/input.js";
import { setupCanvas, drawGrid, pixelText } from "./core/pixel.js";

const COLS = 20;
const ROWS = 20;
const CELL = 22;

export function createGame({ shell, api }) {
  const { canvas, ctx, W, H } = setupCanvas(shell.stage, COLS * CELL, ROWS * CELL);
  const keys = createKeys();
  const unbindSwipe = bindSwipe(canvas, (direction) => turn(direction));
  let snake = [];
  let dir = { x: 1, y: 0 };
  let nextDir = { x: 1, y: 0 };
  let food = { x: 12, y: 10 };
  let score = 0;
  let timer = 0;
  let stepMs = 140;
  let over = false;

  function reset() {
    snake = [
      { x: 7, y: 10 },
      { x: 6, y: 10 },
      { x: 5, y: 10 }
    ];
    dir = { x: 1, y: 0 };
    nextDir = { x: 1, y: 0 };
    score = 0;
    timer = 0;
    stepMs = 140;
    over = false;
    placeFood();
    api.setScore(0);
    api.setStatus("COMIDA = +10 PX");
    draw();
  }

  function placeFood() {
    let guard = 0;
    do {
      food = {
        x: Math.floor(Math.random() * COLS),
        y: Math.floor(Math.random() * ROWS)
      };
      guard += 1;
    } while (guard < 200 && snake.some((part) => part.x === food.x && part.y === food.y));
  }

  function turn(direction) {
    if (over) return;
    const map = {
      up: { x: 0, y: -1 },
      down: { x: 0, y: 1 },
      left: { x: -1, y: 0 },
      right: { x: 1, y: 0 }
    };
    const next = map[direction];
    if (!next) return;
    if (next.x === -dir.x && next.y === -dir.y) return;
    nextDir = next;
  }

  function step() {
    dir = nextDir;
    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
    if (
      head.x < 0 ||
      head.x >= COLS ||
      head.y < 0 ||
      head.y >= ROWS ||
      snake.some((part) => part.x === head.x && part.y === head.y)
    ) {
      over = true;
      loop.stop();
      api.sfx("lose");
      api.gameOver({ score });
      return;
    }
    snake.unshift(head);
    if (head.x === food.x && head.y === food.y) {
      score += 10;
      api.setScore(score);
      api.sfx("coin");
      stepMs = Math.max(72, stepMs - 4);
      placeFood();
    } else {
      snake.pop();
    }
  }

  function draw() {
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, W, H);
    drawGrid(ctx, W, H, CELL, "rgba(237,237,237,0.04)");

    ctx.fillStyle = "#ED3D91";
    ctx.fillRect(food.x * CELL + 4, food.y * CELL + 4, CELL - 8, CELL - 8);
    ctx.fillStyle = "#F6C53A";
    ctx.fillRect(food.x * CELL + 8, food.y * CELL + 8, 4, 4);

    snake.forEach((part, index) => {
      ctx.fillStyle = index === 0 ? "#BCED12" : index % 2 === 0 ? "#12C2ED" : "#0E9DBF";
      ctx.fillRect(part.x * CELL + 2, part.y * CELL + 2, CELL - 4, CELL - 4);
    });

    const head = snake[0];
    if (head) {
      ctx.fillStyle = "#0a0a0a";
      const ox = dir.x * 4;
      const oy = dir.y * 4;
      ctx.fillRect(head.x * CELL + 7 + ox, head.y * CELL + 7 + oy, 3, 3);
      ctx.fillRect(head.x * CELL + 13 + ox, head.y * CELL + 7 + oy, 3, 3);
    }

    pixelText(ctx, `REC ${String(Math.max(score, 0)).padStart(3, "0")}`, 8, 6, 10, "rgba(237,237,237,0.35)");
  }

  const loop = createLoop((dt) => {
    const up = keys.took("ArrowUp", "w", "W");
    const down = keys.took("ArrowDown", "s", "S");
    const left = keys.took("ArrowLeft", "a", "A");
    const right = keys.took("ArrowRight", "d", "D");
    if (up) turn("up");
    if (down) turn("down");
    if (left) turn("left");
    if (right) turn("right");
    keys.clearPressed();

    timer += dt;
    if (timer >= stepMs / 1000) {
      timer = 0;
      step();
      if (!over) draw();
    }
  });

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
      unbindSwipe();
      canvas.remove();
    }
  };
}
