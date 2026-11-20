/* ============================================================
   PAC-DODGE — collect dots, dodge three ghosts, survive 45s.
   ============================================================ */

import { createLoop } from "./core/loop.js";
import { createKeys, bindSwipe } from "./core/input.js";
import { setupCanvas, pixelText } from "./core/pixel.js";

const LAYOUT = [
  "###############",
  "#.............#",
  "#.###.###.###.#",
  "#.............#",
  "#.###.#.#.###.#",
  "#.....#.#.....#",
  "#.###.#.#.###.#",
  "#.............#",
  "#.###.###.###.#",
  "#.............#",
  "#.###.###.###.#",
  "#.............#",
  "###############"
];

const CELL = 30;
const OFFSET = 15;
const W = LAYOUT[0].length * CELL + OFFSET * 2;
const H = LAYOUT.length * CELL + OFFSET * 2;
const DURATION = 45;
const DIRS = [
  { x: 1, y: 0 },
  { x: -1, y: 0 },
  { x: 0, y: 1 },
  { x: 0, y: -1 }
];
const GHOST_COLORS = ["#ED3D91", "#12C2ED", "#ED7812"];

function isWall(x, y) {
  if (y < 0 || y >= LAYOUT.length) return true;
  const row = LAYOUT[y];
  if (x < 0 || x >= row.length) return true;
  return row[x] === "#";
}

export function createGame({ shell, api }) {
  const { canvas, ctx } = setupCanvas(shell.stage, W, H);
  const keys = createKeys();
  const unbindSwipe = bindSwipe(canvas, (direction) => {
    const map = {
      up: { x: 0, y: -1 },
      down: { x: 0, y: 1 },
      left: { x: -1, y: 0 },
      right: { x: 1, y: 0 }
    };
    desired = map[direction] || desired;
  });

  let dots = new Set();
  let player = { x: 1, y: 1 };
  let desired = { x: 0, y: 0 };
  let ghosts = [];
  let lives = 3;
  let score = 0;
  let time = DURATION;
  let playerTimer = 0;
  let invuln = 0;
  let over = false;
  let facing = { x: 1, y: 0 };

  function resetDots() {
    dots = new Set();
    LAYOUT.forEach((row, y) => {
      [...row].forEach((cell, x) => {
        if (cell !== ".") return;
        if (x === 1 && y === 1) return;
        dots.add(`${x}:${y}`);
      });
    });
  }

  function resetPositions() {
    player = { x: 1, y: 1 };
    desired = { x: 0, y: 0 };
    facing = { x: 1, y: 0 };
    ghosts = [
      { x: 13, y: 1, color: GHOST_COLORS[0], timer: 0, dir: { x: -1, y: 0 } },
      { x: 1, y: 11, color: GHOST_COLORS[1], timer: 0.1, dir: { x: 1, y: 0 } },
      { x: 13, y: 11, color: GHOST_COLORS[2], timer: 0.2, dir: { x: -1, y: 0 } }
    ];
  }

  function reset() {
    resetDots();
    resetPositions();
    lives = 3;
    score = 0;
    time = DURATION;
    playerTimer = 0;
    invuln = 0;
    over = false;
    api.setScore(0);
    api.setStatus("COLETE OS PONTOS E FUJA");
    draw();
  }

  function validMoves(x, y) {
    return DIRS.filter((dir) => !isWall(x + dir.x, y + dir.y));
  }

  function movePlayer() {
    if (!desired.x && !desired.y) return;
    const nx = player.x + desired.x;
    const ny = player.y + desired.y;
    if (isWall(nx, ny)) return;
    player.x = nx;
    player.y = ny;
    facing = { ...desired };
    const key = `${nx}:${ny}`;
    if (dots.delete(key)) {
      score += 10;
      api.setScore(score);
      api.sfx("coin");
    }
  }

  function moveGhost(ghost) {
    const options = validMoves(ghost.x, ghost.y);
    if (!options.length) return;
    const forward = options.filter(
      (dir) => !(dir.x === -ghost.dir.x && dir.y === -ghost.dir.y)
    );
    const pool = forward.length ? forward : options;
    let choice;
    if (Math.random() < 0.22) {
      choice = pool[Math.floor(Math.random() * pool.length)];
    } else {
      choice = pool.reduce((best, dir) => {
        const distance =
          Math.abs(ghost.x + dir.x - player.x) + Math.abs(ghost.y + dir.y - player.y);
        if (!best || distance < best.distance) return { dir, distance };
        return best;
      }, null).dir;
    }
    ghost.dir = choice;
    ghost.x += choice.x;
    ghost.y += choice.y;
  }

  function loseLife() {
    if (invuln > 0) return;
    lives -= 1;
    invuln = 1.4;
    api.sfx("explosion");
    if (lives <= 0) {
      over = true;
      loop.stop();
      api.gameOver({ score });
      return;
    }
    resetPositions();
  }

  function update(dt) {
    invuln = Math.max(0, invuln - dt);
    time -= dt;
    if (time <= 0) {
      over = true;
      loop.stop();
      api.gameOver({ score: score + lives * 50 });
      return;
    }

    if (keys.has("ArrowLeft", "a", "A")) desired = { x: -1, y: 0 };
    else if (keys.has("ArrowRight", "d", "D")) desired = { x: 1, y: 0 };
    else if (keys.has("ArrowUp", "w", "W")) desired = { x: 0, y: -1 };
    else if (keys.has("ArrowDown", "s", "S")) desired = { x: 0, y: 1 };

    playerTimer += dt;
    if (playerTimer >= 0.13) {
      playerTimer = 0;
      movePlayer();
    }

    ghosts.forEach((ghost) => {
      ghost.timer += dt;
      if (ghost.timer >= 0.27) {
        ghost.timer = 0;
        moveGhost(ghost);
      }
      if (ghost.x === player.x && ghost.y === player.y) loseLife();
    });

    if (dots.size === 0 && !over) {
      over = true;
      loop.stop();
      api.win({ score: score + Math.round(time) * 10 + 200, xp: 36, coins: 6 });
      return;
    }

    api.setStatus(`PONTOS ${score} · VIDAS ${lives} · ${Math.max(0, Math.ceil(time))}s`);
    draw();
  }

  function drawPac(x, y) {
    const cx = OFFSET + x * CELL + CELL / 2;
    const cy = OFFSET + y * CELL + CELL / 2;
    const radius = CELL * 0.36;
    const mouth = Math.abs(Math.sin(performance.now() / 120)) * 0.7;
    const angle = Math.atan2(facing.y, facing.x);
    ctx.fillStyle = "#F6C53A";
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, angle + mouth, angle - mouth + Math.PI * 2);
    ctx.closePath();
    ctx.fill();
  }

  function drawGhost(ghost) {
    const x = OFFSET + ghost.x * CELL + 5;
    const y = OFFSET + ghost.y * CELL + 5;
    const size = CELL - 10;
    ctx.fillStyle = ghost.color;
    ctx.fillRect(x, y + 4, size, size - 4);
    ctx.fillRect(x + 4, y, size - 8, 6);
    ctx.fillRect(x - 2, y + size - 8, 6, 8);
    ctx.fillRect(x + size - 4, y + size - 8, 6, 8);
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(x + 5, y + 9, 5, 6);
    ctx.fillRect(x + size - 10, y + 9, 5, 6);
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(x + 7, y + 11, 3, 3);
    ctx.fillRect(x + size - 8, y + 11, 3, 3);
  }

  function draw() {
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, W, H);

    LAYOUT.forEach((row, y) => {
      [...row].forEach((cell, x) => {
        const px = OFFSET + x * CELL;
        const py = OFFSET + y * CELL;
        if (cell === "#") {
          ctx.fillStyle = "#18264A";
          ctx.fillRect(px, py, CELL, CELL);
          ctx.fillStyle = "rgba(18,194,237,0.18)";
          ctx.fillRect(px + 2, py + 2, CELL - 4, 3);
        } else {
          ctx.fillStyle = "#07070a";
          ctx.fillRect(px, py, CELL, CELL);
        }
      });
    });

    ctx.fillStyle = "#F6C53A";
    dots.forEach((key) => {
      const [x, y] = key.split(":").map(Number);
      ctx.fillRect(OFFSET + x * CELL + CELL / 2 - 3, OFFSET + y * CELL + CELL / 2 - 3, 6, 6);
    });

    ghosts.forEach(drawGhost);
    if (invuln <= 0 || Math.floor(performance.now() / 120) % 2 === 0) drawPac(player.x, player.y);

    pixelText(ctx, `VIDAS ${lives}`, 8, H - 14, 10, "rgba(237,237,237,0.5)");
    pixelText(ctx, `${Math.max(0, Math.ceil(time))}s`, W - 8, H - 14, 10, "rgba(237,237,237,0.5)", "right");
  }

  const loop = createLoop(update);

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
