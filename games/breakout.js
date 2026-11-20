/* ============================================================
   BREAKOUT — paddle, ball, six rows of pixel bricks.
   ============================================================ */

import { createLoop, clamp } from "./core/loop.js";
import { createKeys, canvasPoint } from "./core/input.js";
import { setupCanvas, drawGrid, pixelText, drawLife } from "./core/pixel.js";

const W = 480;
const H = 420;
const COLORS = ["#ED3D91", "#ED7812", "#F6C53A", "#BCED12", "#12C2ED", "#894AED"];

export function createGame({ shell, api }) {
  const { canvas, ctx } = setupCanvas(shell.stage, W, H);
  const keys = createKeys();
  const paddle = { x: W / 2 - 38, y: H - 24, w: 76, h: 10, target: W / 2 };
  const ball = { x: W / 2, y: H - 48, vx: 150, vy: -210, r: 5 };
  let bricks = [];
  let lives = 3;
  let score = 0;
  let over = false;

  function buildBricks() {
    bricks = [];
    const cols = 8;
    const rows = 5;
    const bw = 48;
    const bh = 16;
    const gap = 8;
    const startX = (W - (cols * bw + (cols - 1) * gap)) / 2;
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        bricks.push({
          x: startX + col * (bw + gap),
          y: 54 + row * (bh + gap),
          w: bw,
          h: bh,
          color: COLORS[row % COLORS.length],
          alive: true
        });
      }
    }
  }

  function resetBall() {
    ball.x = W / 2;
    ball.y = H - 52;
    ball.vx = (Math.random() > 0.5 ? 1 : -1) * 150;
    ball.vy = -220;
    paddle.x = W / 2 - paddle.w / 2;
    paddle.target = W / 2;
  }

  function reset() {
    lives = 3;
    score = 0;
    over = false;
    buildBricks();
    resetBall();
    api.setScore(0);
    api.setStatus("QUEBRE TODOS OS BLOCOS");
    draw();
  }

  function loseLife() {
    lives -= 1;
    api.sfx("lose");
    if (lives <= 0) {
      over = true;
      loop.stop();
      api.gameOver({ score });
      return;
    }
    resetBall();
  }

  function update(dt) {
    const speed = 360;
    if (keys.has("ArrowLeft", "a", "A")) paddle.target -= speed * dt;
    if (keys.has("ArrowRight", "d", "D")) paddle.target += speed * dt;
    paddle.target = clamp(paddle.target, paddle.w / 2, W - paddle.w / 2);
    paddle.x += (paddle.target - paddle.w / 2 - paddle.x) * Math.min(1, dt * 16);
    paddle.x = clamp(paddle.x, 0, W - paddle.w);

    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;

    if (ball.x - ball.r < 0) {
      ball.x = ball.r;
      ball.vx = Math.abs(ball.vx);
      api.sfx("hit");
    }
    if (ball.x + ball.r > W) {
      ball.x = W - ball.r;
      ball.vx = -Math.abs(ball.vx);
      api.sfx("hit");
    }
    if (ball.y - ball.r < 0) {
      ball.y = ball.r;
      ball.vy = Math.abs(ball.vy);
      api.sfx("hit");
    }
    if (ball.y - ball.r > H) loseLife();

    if (
      ball.vy > 0 &&
      ball.y + ball.r >= paddle.y &&
      ball.y - ball.r <= paddle.y + paddle.h &&
      ball.x >= paddle.x - ball.r &&
      ball.x <= paddle.x + paddle.w + ball.r
    ) {
      ball.y = paddle.y - ball.r;
      const hit = (ball.x - (paddle.x + paddle.w / 2)) / (paddle.w / 2);
      ball.vx = hit * 280;
      ball.vy = -Math.abs(ball.vy) * 1.02;
      api.sfx("jump");
    }

    for (const brick of bricks) {
      if (!brick.alive) continue;
      if (
        ball.x + ball.r > brick.x &&
        ball.x - ball.r < brick.x + brick.w &&
        ball.y + ball.r > brick.y &&
        ball.y - ball.r < brick.y + brick.h
      ) {
        brick.alive = false;
        score += 10;
        api.setScore(score);
        api.sfx("coin");
        const overlapX = Math.min(ball.x + ball.r - brick.x, brick.x + brick.w - (ball.x - ball.r));
        const overlapY = Math.min(ball.y + ball.r - brick.y, brick.y + brick.h - (ball.y - ball.r));
        if (overlapX < overlapY) ball.vx = -ball.vx;
        else ball.vy = -ball.vy;
        break;
      }
    }

    if (bricks.every((brick) => !brick.alive)) {
      over = true;
      loop.stop();
      api.win({ score: score + 100, xp: 30, coins: 4 });
    }

    draw();
  }

  function draw() {
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, W, H);
    drawGrid(ctx, W, H, 24);

    bricks.forEach((brick) => {
      if (!brick.alive) return;
      ctx.fillStyle = brick.color;
      ctx.fillRect(brick.x, brick.y, brick.w, brick.h);
      ctx.fillStyle = "rgba(255,255,255,0.18)";
      ctx.fillRect(brick.x, brick.y, brick.w, 3);
    });

    ctx.fillStyle = "#EDEDED";
    ctx.fillRect(paddle.x, paddle.y, paddle.w, paddle.h);
    ctx.fillStyle = "#BCED12";
    ctx.fillRect(paddle.x, paddle.y, paddle.w, 3);

    ctx.fillStyle = "#F6C53A";
    ctx.fillRect(ball.x - ball.r, ball.y - ball.r, ball.r * 2, ball.r * 2);

    for (let index = 0; index < lives; index += 1) {
      drawLife(ctx, 10 + index * 12, H - 18, "#ED3D91");
    }
    pixelText(ctx, `SCORE ${String(score).padStart(4, "0")}`, W - 10, H - 20, 11, "rgba(237,237,237,0.5)", "right");
  }

  const loop = createLoop(update);

  const onPointer = (event) => {
    const point = canvasPoint(canvas, event);
    paddle.target = point.x;
  };
  canvas.addEventListener("pointermove", onPointer, { passive: true });
  canvas.addEventListener("pointerdown", onPointer, { passive: true });

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
      canvas.removeEventListener("pointermove", onPointer);
      canvas.removeEventListener("pointerdown", onPointer);
      canvas.remove();
    }
  };
}
