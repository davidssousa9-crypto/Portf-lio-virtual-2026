/* ============================================================
   PONG 8-BIT — first to seven, mouse/touch or arrow keys.
   ============================================================ */

import { createLoop, clamp } from "./core/loop.js";
import { createKeys, canvasPoint } from "./core/input.js";
import { setupCanvas, drawGrid, pixelText } from "./core/pixel.js";

const W = 480;
const H = 360;
const WIN = 7;

export function createGame({ shell, api }) {
  const { canvas, ctx } = setupCanvas(shell.stage, W, H);
  const keys = createKeys();
  const player = { x: 18, y: H / 2 - 28, w: 10, h: 56, target: H / 2 };
  const cpu = { x: W - 28, y: H / 2 - 28, w: 10, h: 56 };
  const ball = { x: W / 2, y: H / 2, vx: 190, vy: 120, r: 5 };
  let playerScore = 0;
  let cpuScore = 0;
  let over = false;

  function resetBall(direction = 1) {
    ball.x = W / 2;
    ball.y = H / 2;
    ball.vx = direction * 190;
    ball.vy = (Math.random() > 0.5 ? 1 : -1) * (90 + Math.random() * 80);
  }

  function reset() {
    playerScore = 0;
    cpuScore = 0;
    over = false;
    player.y = H / 2 - player.h / 2;
    player.target = H / 2;
    cpu.y = H / 2 - cpu.h / 2;
    resetBall(Math.random() > 0.5 ? 1 : -1);
    api.setScore(0);
    api.setStatus("PRIMEIRO A 7 PONTOS");
    draw();
  }

  function point(who) {
    api.sfx("coin");
    if (who === "player") playerScore += 1;
    else cpuScore += 1;
    api.setScore(playerScore * 100 + cpuScore);
    if (playerScore >= WIN || cpuScore >= WIN) {
      over = true;
      loop.stop();
      const won = playerScore > cpuScore;
      if (won) api.win({ score: playerScore * 100, xp: 28, coins: 4 });
      else api.gameOver({ score: playerScore * 100 });
      return;
    }
    resetBall(who === "player" ? -1 : 1);
  }

  function update(dt) {
    const speed = 340;
    if (keys.has("ArrowUp", "w", "W")) player.target -= speed * dt;
    if (keys.has("ArrowDown", "s", "S")) player.target += speed * dt;
    player.target = clamp(player.target, player.h / 2, H - player.h / 2);
    player.y += (player.target - player.h / 2 - player.y) * Math.min(1, dt * 18);

    const cpuCenter = cpu.y + cpu.h / 2;
    const target = ball.y;
    const delta = target - cpuCenter;
    const maxSpeed = 250;
    cpu.y += clamp(delta, -maxSpeed * dt, maxSpeed * dt);
    cpu.y = clamp(cpu.y, 0, H - cpu.h);

    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;

    if (ball.y - ball.r < 0) {
      ball.y = ball.r;
      ball.vy = Math.abs(ball.vy);
      api.sfx("hit");
    }
    if (ball.y + ball.r > H) {
      ball.y = H - ball.r;
      ball.vy = -Math.abs(ball.vy);
      api.sfx("hit");
    }

    if (ball.x - ball.r < 0) point("cpu");
    if (ball.x + ball.r > W) point("player");

    const hitPlayer =
      ball.vx < 0 &&
      ball.x - ball.r <= player.x + player.w &&
      ball.x + ball.r >= player.x &&
      ball.y + ball.r >= player.y &&
      ball.y - ball.r <= player.y + player.h;
    if (hitPlayer) {
      ball.x = player.x + player.w + ball.r;
      const hit = (ball.y - (player.y + player.h / 2)) / (player.h / 2);
      ball.vx = Math.abs(ball.vx) * 1.04;
      ball.vy = hit * 260;
      api.sfx("jump");
    }

    const hitCpu =
      ball.vx > 0 &&
      ball.x + ball.r >= cpu.x &&
      ball.x - ball.r <= cpu.x + cpu.w &&
      ball.y + ball.r >= cpu.y &&
      ball.y - ball.r <= cpu.y + cpu.h;
    if (hitCpu) {
      ball.x = cpu.x - ball.r;
      const hit = (ball.y - (cpu.y + cpu.h / 2)) / (cpu.h / 2);
      ball.vx = -Math.abs(ball.vx) * 1.04;
      ball.vy = hit * 260;
      api.sfx("hit");
    }

    draw();
  }

  function draw() {
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, W, H);
    drawGrid(ctx, W, H, 24);

    ctx.strokeStyle = "rgba(237,237,237,0.16)";
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(W / 2, 0);
    ctx.lineTo(W / 2, H);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = "#BCED12";
    ctx.fillRect(player.x, player.y, player.w, player.h);
    ctx.fillStyle = "#ED3D91";
    ctx.fillRect(cpu.x, cpu.y, cpu.w, cpu.h);
    ctx.fillStyle = "#F6C53A";
    ctx.fillRect(ball.x - ball.r, ball.y - ball.r, ball.r * 2, ball.r * 2);

    pixelText(ctx, String(playerScore), W / 2 - 34, 18, 32, "#BCED12", "center");
    pixelText(ctx, String(cpuScore), W / 2 + 34, 18, 32, "#ED3D91", "center");
  }

  const loop = createLoop(update);

  const onPointer = (event) => {
    const point = canvasPoint(canvas, event);
    player.target = point.y;
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
