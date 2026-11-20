/* ============================================================
   INVADERS — defend the last pixel line.
   ============================================================ */

import { createLoop, clamp } from "./core/loop.js";
import { createKeys, canvasPoint } from "./core/input.js";
import { setupCanvas, drawGrid, pixelText, drawLife } from "./core/pixel.js";

const W = 480;
const H = 420;
const ROWS = 4;
const COLS = 7;

export function createGame({ shell, api }) {
  const { canvas, ctx } = setupCanvas(shell.stage, W, H);
  const keys = createKeys();
  const player = { x: W / 2 - 14, y: H - 38, w: 28, h: 12 };
  let enemies = [];
  let bullets = [];
  let enemyBullets = [];
  let direction = 1;
  let stepTimer = 0;
  let enemyStep = 0.55;
  let shootTimer = 0;
  let lives = 3;
  let score = 0;
  let over = false;
  let pointerTarget = null;

  function buildEnemies() {
    enemies = [];
    for (let row = 0; row < ROWS; row += 1) {
      for (let col = 0; col < COLS; col += 1) {
        enemies.push({
          x: 52 + col * 54,
          y: 58 + row * 40,
          w: 30,
          h: 22,
          row,
          alive: true
        });
      }
    }
  }

  function reset() {
    buildEnemies();
    bullets = [];
    enemyBullets = [];
    direction = 1;
    stepTimer = 0;
    enemyStep = 0.55;
    shootTimer = 0;
    lives = 3;
    score = 0;
    over = false;
    player.x = W / 2 - player.w / 2;
    api.setScore(0);
    api.setStatus("DEFENDA A ÚLTIMA LINHA");
    draw();
  }

  function shoot() {
    if (over || shootTimer > 0) return;
    shootTimer = 0.24;
    bullets.push({ x: player.x + player.w / 2 - 2, y: player.y - 6, vy: -360 });
    api.sfx("shoot");
  }

  function hitPlayer() {
    lives -= 1;
    api.sfx("explosion");
    if (lives <= 0) {
      over = true;
      loop.stop();
      api.gameOver({ score });
    }
  }

  function update(dt) {
    shootTimer = Math.max(0, shootTimer - dt);
    if (keys.has("ArrowLeft", "a", "A")) player.x -= 300 * dt;
    if (keys.has("ArrowRight", "d", "D")) player.x += 300 * dt;
    if (pointerTarget !== null) {
      player.x += (pointerTarget - player.w / 2 - player.x) * Math.min(1, dt * 18);
    }
    player.x = clamp(player.x, 6, W - player.w - 6);
    if (keys.took(" ", "Spacebar")) shoot();
    keys.clearPressed();

    stepTimer += dt;
    if (stepTimer >= enemyStep) {
      stepTimer = 0;
      let minX = Infinity;
      let maxX = -Infinity;
      enemies.forEach((enemy) => {
        if (!enemy.alive) return;
        minX = Math.min(minX, enemy.x);
        maxX = Math.max(maxX, enemy.x + enemy.w);
      });
      if (minX === Infinity) return;
      if ((direction > 0 && maxX + 12 > W - 12) || (direction < 0 && minX - 12 < 12)) {
        direction *= -1;
        enemies.forEach((enemy) => {
          if (enemy.alive) enemy.y += 16;
        });
      } else {
        enemies.forEach((enemy) => {
          if (enemy.alive) enemy.x += direction * 12;
        });
      }
      if (enemies.some((enemy) => enemy.alive && enemy.y + enemy.h >= player.y)) {
        over = true;
        loop.stop();
        api.gameOver({ score });
        return;
      }
    }

    bullets = bullets.filter((bullet) => {
      bullet.y += bullet.vy * dt;
      return bullet.y > -10;
    });

    for (const bullet of bullets) {
      for (const enemy of enemies) {
        if (!enemy.alive) continue;
        if (
          bullet.x + 4 > enemy.x &&
          bullet.x < enemy.x + enemy.w &&
          bullet.y < enemy.y + enemy.h &&
          bullet.y + 10 > enemy.y
        ) {
          enemy.alive = false;
          bullet.y = -20;
          score += 10;
          api.setScore(score);
          api.sfx("hit");
          break;
        }
      }
    }

    if (Math.random() < dt * (0.5 + (ROWS * COLS - enemies.filter((e) => e.alive).length) * 0.03)) {
      const shooters = enemies.filter((enemy) => enemy.alive);
      if (shooters.length) {
        const shooter = shooters[Math.floor(Math.random() * shooters.length)];
        enemyBullets.push({
          x: shooter.x + shooter.w / 2 - 2,
          y: shooter.y + shooter.h,
          vy: 180 + Math.random() * 80
        });
      }
    }

    enemyBullets = enemyBullets.filter((bullet) => {
      bullet.y += bullet.vy * dt;
      if (
        bullet.y + 8 > player.y &&
        bullet.y < player.y + player.h &&
        bullet.x + 4 > player.x &&
        bullet.x < player.x + player.w
      ) {
        hitPlayer();
        return false;
      }
      return bullet.y < H + 10;
    });

    if (enemies.every((enemy) => !enemy.alive)) {
      over = true;
      loop.stop();
      api.win({ score: score + 200, xp: 32, coins: 5 });
      return;
    }

    draw();
  }

  function draw() {
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, W, H);
    drawGrid(ctx, W, H, 24);

    enemies.forEach((enemy) => {
      if (!enemy.alive) return;
      const color = ["#ED3D91", "#ED7812", "#F6C53A", "#BCED12"][enemy.row % 4];
      ctx.fillStyle = color;
      ctx.fillRect(enemy.x + 4, enemy.y, enemy.w - 8, 4);
      ctx.fillRect(enemy.x, enemy.y + 4, enemy.w, 8);
      ctx.fillRect(enemy.x + 6, enemy.y + 12, 5, 6);
      ctx.fillRect(enemy.x + enemy.w - 11, enemy.y + 12, 5, 6);
      ctx.fillStyle = "#0a0a0a";
      ctx.fillRect(enemy.x + 7, enemy.y + 7, 4, 4);
      ctx.fillRect(enemy.x + enemy.w - 11, enemy.y + 7, 4, 4);
    });

    ctx.fillStyle = "#12C2ED";
    ctx.fillRect(player.x, player.y, player.w, player.h);
    ctx.fillStyle = "#BCED12";
    ctx.fillRect(player.x + player.w / 2 - 3, player.y - 6, 6, 6);

    ctx.fillStyle = "#F6C53A";
    bullets.forEach((bullet) => ctx.fillRect(bullet.x, bullet.y, 4, 10));
    ctx.fillStyle = "#ED3D91";
    enemyBullets.forEach((bullet) => ctx.fillRect(bullet.x, bullet.y, 4, 8));

    for (let index = 0; index < lives; index += 1) {
      drawLife(ctx, 10 + index * 12, H - 18, "#BCED12");
    }
    pixelText(ctx, `SCORE ${String(score).padStart(4, "0")}`, W - 10, H - 20, 11, "rgba(237,237,237,0.5)", "right");
  }

  const loop = createLoop(update);

  const onPointerMove = (event) => {
    const point = canvasPoint(canvas, event);
    pointerTarget = point.x;
  };
  const onPointerDown = (event) => {
    const point = canvasPoint(canvas, event);
    pointerTarget = point.x;
    shoot();
  };
  const onPointerLeave = () => {
    pointerTarget = null;
  };
  canvas.addEventListener("pointermove", onPointerMove, { passive: true });
  canvas.addEventListener("pointerdown", onPointerDown, { passive: true });
  canvas.addEventListener("pointerleave", onPointerLeave, { passive: true });

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
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      canvas.remove();
    }
  };
}
