/* ============================================================
   WHACK-A-PIXEL — thirty seconds, nine holes, one tiny mole.
   ============================================================ */

import { createLoop } from "./core/loop.js";
import { canvasPoint } from "./core/input.js";
import { setupCanvas, drawGrid, pixelText } from "./core/pixel.js";

const W = 480;
const H = 420;
const DURATION = 30;

export function createGame({ shell, api }) {
  const { canvas, ctx } = setupCanvas(shell.stage, W, H);
  const holes = [];
  for (let row = 0; row < 3; row += 1) {
    for (let col = 0; col < 3; col += 1) {
      holes.push({
        x: 72 + col * 132,
        y: 86 + row * 108,
        w: 84,
        h: 64,
        active: false,
        until: 0,
        next: 0
      });
    }
  }
  let score = 0;
  let time = DURATION;
  let over = false;
  let spawnTimer = 0;
  let combo = 0;
  let lastHit = 0;

  function reset() {
    score = 0;
    time = DURATION;
    over = false;
    spawnTimer = 0.4;
    combo = 0;
    lastHit = 0;
    holes.forEach((hole) => {
      hole.active = false;
      hole.until = 0;
      hole.next = 0;
    });
    api.setScore(0);
    api.setStatus(`TEMPO ${DURATION}s`);
    draw();
  }

  function spawn() {
    const free = holes.filter((hole) => !hole.active);
    if (!free.length) return;
    const hole = free[Math.floor(Math.random() * free.length)];
    hole.active = true;
    hole.until = 0.62 + Math.random() * 0.34;
  }

  function update(dt) {
    time -= dt;
    spawnTimer -= dt;
    if (spawnTimer <= 0) {
      spawn();
      spawnTimer = 0.46 + Math.random() * 0.3;
    }
    holes.forEach((hole) => {
      if (!hole.active) return;
      hole.until -= dt;
      if (hole.until <= 0) {
        hole.active = false;
        combo = 0;
      }
    });
    api.setStatus(`TEMPO ${Math.max(0, Math.ceil(time))}s · COMBO x${Math.max(1, combo)}`);
    if (time <= 0) {
      over = true;
      loop.stop();
      api.gameOver({ score });
      return;
    }
    draw();
  }

  function hit(event) {
    if (over) return;
    const point = canvasPoint(canvas, event);
    for (const hole of holes) {
      if (!hole.active) continue;
      if (
        point.x >= hole.x &&
        point.x <= hole.x + hole.w &&
        point.y >= hole.y &&
        point.y <= hole.y + hole.h
      ) {
        const now = performance.now();
        combo = now - lastHit < 900 ? combo + 1 : 1;
        lastHit = now;
        const gain = 10 + Math.min(20, combo * 2);
        score += gain;
        hole.active = false;
        api.setScore(score);
        api.sfx("coin");
        api.setStatus(`+${gain} · COMBO x${combo}`);
        break;
      }
    }
  }

  function drawMole(hole) {
    const x = hole.x + 20;
    const y = hole.y + 8;
    ctx.fillStyle = "#C98B6C";
    ctx.fillRect(x, y, 44, 42);
    ctx.fillStyle = "#E5B98F";
    ctx.fillRect(x + 6, y + 6, 32, 30);
    ctx.fillStyle = "#231C28";
    ctx.fillRect(x + 12, y + 14, 6, 6);
    ctx.fillRect(x + 26, y + 14, 6, 6);
    ctx.fillRect(x + 18, y + 26, 8, 4);
    ctx.fillStyle = "#ED3D91";
    ctx.fillRect(x + 20, y + 30, 4, 3);
  }

  function draw() {
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, W, H);
    drawGrid(ctx, W, H, 24);

    holes.forEach((hole) => {
      ctx.fillStyle = "#1B151C";
      ctx.fillRect(hole.x - 6, hole.y - 6, hole.w + 12, hole.h + 12);
      ctx.fillStyle = "#0F0F10";
      ctx.fillRect(hole.x, hole.y, hole.w, hole.h);
      ctx.strokeStyle = "rgba(188,237,18,0.22)";
      ctx.strokeRect(hole.x + 0.5, hole.y + 0.5, hole.w - 1, hole.h - 1);
      if (hole.active) drawMole(hole);
    });

    pixelText(ctx, `SCORE ${String(score).padStart(4, "0")}`, 12, 12, 14, "#BCED12");
    pixelText(ctx, `${Math.max(0, Math.ceil(time))}s`, W - 12, 12, 14, time < 8 ? "#ED3D91" : "#EDEDED", "right");
  }

  const loop = createLoop(update);
  canvas.addEventListener("pointerdown", hit, { passive: true });

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
      canvas.removeEventListener("pointerdown", hit);
      canvas.remove();
    }
  };
}
