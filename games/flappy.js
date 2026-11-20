/* ============================================================
   FLAPPY PIXEL — one button, two pipes, zero mercy.
   ============================================================ */

import { createLoop } from "./core/loop.js";
import { createKeys } from "./core/input.js";
import { setupCanvas, pixelText } from "./core/pixel.js";

const W = 360;
const H = 480;
const GRAVITY = 980;
const FLAP = -300;
const PIPE_W = 58;
const GAP = 132;
const SPEED = 132;

export function createGame({ shell, api }) {
  const { canvas, ctx } = setupCanvas(shell.stage, W, H);
  const keys = createKeys();
  let bird = { y: H / 2, vy: 0 };
  let pipes = [];
  let score = 0;
  let spawnTimer = 0;
  let over = false;
  let started = false;

  function reset() {
    bird = { y: H / 2, vy: 0 };
    pipes = [];
    score = 0;
    spawnTimer = 0.8;
    over = false;
    started = false;
    api.setScore(0);
    api.setStatus("ESPAÇO / TOQUE PARA VOAR");
    draw();
  }

  function flap() {
    if (over) return;
    started = true;
    bird.vy = FLAP;
    api.sfx("jump");
  }

  function update(dt) {
    if (keys.took(" ", "Spacebar", "ArrowUp", "w", "W")) flap();
    keys.clearPressed();

    if (!started) {
      draw();
      return;
    }

    bird.vy += GRAVITY * dt;
    bird.y += bird.vy * dt;

    spawnTimer -= dt;
    if (spawnTimer <= 0) {
      spawnTimer = 1.45;
      const margin = 46;
      const gapY = margin + Math.random() * (H - GAP - margin * 2);
      pipes.push({ x: W + PIPE_W, gapY, passed: false });
    }

    pipes.forEach((pipe) => {
      pipe.x -= SPEED * dt;
    });
    pipes = pipes.filter((pipe) => pipe.x + PIPE_W > -20);

    for (const pipe of pipes) {
      if (!pipe.passed && pipe.x + PIPE_W < 84) {
        pipe.passed = true;
        score += 10;
        api.setScore(score);
        api.sfx("coin");
      }
    }

    const birdBox = { x: 72, y: bird.y - 11, w: 26, h: 22 };
    if (birdBox.y < 0 || birdBox.y + birdBox.h > H - 24) {
      end();
      return;
    }
    for (const pipe of pipes) {
      if (
        birdBox.x + birdBox.w > pipe.x &&
        birdBox.x < pipe.x + PIPE_W &&
        (birdBox.y < pipe.gapY || birdBox.y + birdBox.h > pipe.gapY + GAP)
      ) {
        end();
        return;
      }
    }

    draw();
  }

  function end() {
    if (over) return;
    over = true;
    loop.stop();
    api.sfx("explosion");
    api.gameOver({ score });
  }

  function draw() {
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = "rgba(18,194,237,0.08)";
    for (let x = 0; x < W; x += 24) ctx.fillRect(x, 0, 1, H);

    pipes.forEach((pipe) => {
      ctx.fillStyle = "#1E8A3C";
      ctx.fillRect(pipe.x, 0, PIPE_W, pipe.gapY);
      ctx.fillRect(pipe.x, pipe.gapY + GAP, PIPE_W, H - pipe.gapY - GAP);
      ctx.fillStyle = "#BCED12";
      ctx.fillRect(pipe.x - 4, pipe.gapY - 18, PIPE_W + 8, 18);
      ctx.fillRect(pipe.x - 4, pipe.gapY + GAP, PIPE_W + 8, 18);
    });

    const x = 72;
    const y = bird.y;
    ctx.fillStyle = "#F6C53A";
    ctx.fillRect(x + 4, y - 10, 20, 20);
    ctx.fillRect(x, y - 4, 28, 12);
    ctx.fillStyle = "#ED7812";
    ctx.fillRect(x + 22, y - 2, 8, 6);
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(x + 18, y - 6, 4, 4);

    ctx.fillStyle = "#1B151C";
    ctx.fillRect(0, H - 24, W, 24);
    ctx.fillStyle = "#BCED12";
    for (let x = 0; x < W; x += 16) ctx.fillRect(x, H - 24, 8, 4);

    pixelText(ctx, String(score / 10).padStart(2, "0"), W / 2, 18, 32, "#EDEDED", "center");
  }

  const loop = createLoop(update);
  const onPointer = () => flap();
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
      canvas.removeEventListener("pointerdown", onPointer);
      canvas.remove();
    }
  };
}
