/* ============================================================
   SECTIONS.JS — every scroll narrative in one shared RAF
   ============================================================ */

const DEFAULTS = {
  bg: "#121212",
  text: "#EDEDED",
  lime: "#BCED12",
  yellow: "#F6C53A",
  cyan: "#12C2ED",
  magenta: "#ED3D91",
  purple: "#894AED",
  orange: "#ED7812",
  red: "#EE3B3E"
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function pad3(value) {
  return String(Math.max(0, Math.round(value))).padStart(3, "0");
}

function hash(x, y) {
  let h = (x * 374761393 + y * 668265263) ^ 0x9e3779b9;
  h = (h ^ (h >>> 13)) * 1274126177;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

function progressOf(node, startFactor = 0.9, endFactor = -0.15) {
  if (!node) return 0;
  const rect = node.getBoundingClientRect();
  const vh = window.innerHeight || 1;
  const start = vh * startFactor;
  const end = vh * endFactor;
  return clamp((start - rect.top) / Math.max(1, start - end), 0, 1);
}

function createLocalTicker() {
  const subscribers = new Set();
  let raf = 0;
  let last = performance.now();
  const loop = (now) => {
    const dt = Math.min(64, now - last);
    last = now;
    subscribers.forEach((fn) => fn(now, dt));
    raf = requestAnimationFrame(loop);
  };
  return {
    add(fn) {
      subscribers.add(fn);
      if (!raf) raf = requestAnimationFrame(loop);
      return () => subscribers.delete(fn);
    }
  };
}

export function initSections({
  config = {},
  ticker = null,
  audio = null,
  reducedMotion = false,
  announce = () => {}
}) {
  const colors = { ...DEFAULTS, ...(config.colors || {}) };
  const t = config.timings || {};
  const bus = ticker && typeof ticker.add === "function" ? ticker : createLocalTicker();
  const cleanups = [];
  let reduced = Boolean(reducedMotion);

  /* ----------------------------------------------------------
     reveal on scroll
     ---------------------------------------------------------- */
  const revealNodes = document.querySelectorAll("[data-reveal]");
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("in-view");
          entry.target.classList.remove("reveal-pending");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.14, rootMargin: "0px 0px -6% 0px" }
    );
    revealNodes.forEach((node) => {
      node.classList.add("reveal-pending");
      observer.observe(node);
    });
    cleanups.push(() => observer.disconnect());
  } else {
    revealNodes.forEach((node) => node.classList.add("in-view"));
  }

  function watch(node, onChange) {
    const state = { visible: false };
    if (!node || !("IntersectionObserver" in window)) {
      state.visible = true;
      return state;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        state.visible = Boolean(entry?.isIntersecting);
        onChange?.(state.visible);
      },
      { threshold: 0.02, rootMargin: "12% 0px 12% 0px" }
    );
    observer.observe(node);
    cleanups.push(() => observer.disconnect());
    return state;
  }

  /* ----------------------------------------------------------
     16 × 16 pixel spark grid
     ---------------------------------------------------------- */
  function initPixelGrid() {
    const grid = document.getElementById("pixelGrid");
    const readout = document.getElementById("pixelProgress");
    const section = document.getElementById("pixels");
    if (!grid || !section) return;

    const ICON = [
      ".......XX.......",
      ".......XX.......",
      "......XXXX......",
      "......XXXX......",
      "..X...XXXX...X..",
      "..XXX.XXXX.XXX..",
      "...XXXXXXXXXX...",
      "....XXXXXXXX....",
      "XXXXXXX..XXXXXXX",
      "....XXXXXXXX....",
      "...XXXXXXXXXX...",
      "..XXX.XXXX.XXX..",
      "..X...XXXX...X..",
      "......XXXX......",
      "......XXXX......",
      ".......XX......."
    ];

    const cells = [];
    const iconCells = [];
    const restCells = [];

    grid.innerHTML = "";
    for (let y = 0; y < 16; y += 1) {
      for (let x = 0; x < 16; x += 1) {
        const isIcon = ICON[y]?.[x] === "X";
        const cell = document.createElement("span");
        cell.className = "px";
        cell.setAttribute("aria-hidden", "true");

        let color = "#3B3B3B";
        if (isIcon) {
          const ring = Math.min(Math.abs(x - 7.5), Math.abs(y - 7.5));
          if (ring < 2) color = colors.lime;
          else if (ring < 5) color = colors.cyan;
          else color = colors.yellow;
        }
        cell.style.setProperty("--px-color", color);
        grid.appendChild(cell);

        const record = {
          el: cell,
          isIcon,
          order: isIcon
            ? 0
            : 1,
          distance: Math.hypot(x - 7.5, y - 7.5) + hash(x, y) * 2.2
        };
        cells.push(record);
        (isIcon ? iconCells : restCells).push(record);
      }
    }

    iconCells.sort((a, b) => a.distance - b.distance);
    restCells.sort((a, b) => a.distance - b.distance);
    const order = [...iconCells, ...restCells];

    const state = watch(section);
    let lastLit = -1;
    let rafClass = 0;

    const update = () => {
      if (!state.visible) return;
      const progress = progressOf(section, 0.92, -0.2);
      const lit = Math.round(progress * 256);
      if (lit === lastLit) return;
      lastLit = lit;
      cancelAnimationFrame(rafClass);
      rafClass = requestAnimationFrame(() => {
        order.forEach((record, index) => {
          const on = index < lit;
          record.el.classList.toggle("is-on", on);
          record.el.classList.toggle("is-hot", on && record.isIcon);
        });
        if (readout) readout.textContent = pad3(lit);
      });
    };

    bus.add(update);
    update();
    cleanups.push(() => cancelAnimationFrame(rafClass));
  }

  /* ----------------------------------------------------------
     pixel brain
     ---------------------------------------------------------- */
  function initBrain() {
    const canvas = document.getElementById("brainCanvas");
    const section = document.getElementById("brain-section");
    if (!canvas || !section) return;

    const W = 240;
    const H = 180;
    const CELL = 4;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;

    const state = watch(section);

    const isBrain = (gx, gy) => {
      const x = gx + 0.5;
      const y = gy + 0.5;
      const left = ((x - 21) / 15.5) ** 2 + ((y - 21) / 13.6) ** 2 < 1;
      const right = ((x - 39) / 15.5) ** 2 + ((y - 21) / 13.6) ** 2 < 1;
      const stem = x > 25.5 && x < 34.5 && y > 31 && y < 41 - Math.abs(x - 30) * 0.9;
      const topNotch = y < 15.5 && Math.abs(x - 30) < 2.6;
      const bottomNotch = y > 31.5 && Math.abs(x - 30) < 2 && y < 36;
      const folded = Math.abs(y - (18 + Math.sin(x * 0.65) * 4)) < 1.2 && x > 10 && x < 50;
      return (left || right || stem) && !topNotch && !bottomNotch && !folded;
    };

    const cellData = [];
    const fills = [colors.purple, "#6A3BA0", "#4D2878", colors.magenta, "#7C43A8"];
    const sparkSeeds = [
      { x: 0.3, y: 0.4, phase: 0.2, color: colors.lime },
      { x: 0.44, y: 0.56, phase: 1.4, color: colors.cyan },
      { x: 0.58, y: 0.34, phase: 2.2, color: colors.yellow },
      { x: 0.67, y: 0.55, phase: 3.1, color: colors.lime },
      { x: 0.51, y: 0.7, phase: 4.4, color: colors.magenta }
    ];

    for (let gy = 0; gy < H / CELL; gy += 1) {
      for (let gx = 0; gx < W / CELL; gx += 1) {
        if (!isBrain(gx, gy)) continue;
        const edge =
          !isBrain(gx - 1, gy) ||
          !isBrain(gx + 1, gy) ||
          !isBrain(gx, gy - 1) ||
          !isBrain(gx, gy + 1);
        const h = hash(gx, gy);
        let color = edge ? "#2B173D" : fills[Math.floor(h * fills.length)];
        if (!edge && h > 0.9) color = "#A671FF";
        if (!edge && h < 0.06) color = colors.magenta;
        cellData.push({ gx, gy, color });
      }
    }

    function draw(now) {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "#0B0B0B";
      ctx.fillRect(0, 0, W, H);

      ctx.fillStyle = "rgba(237,237,237,0.045)";
      for (let y = 8; y < H; y += 16) {
        for (let x = 8; x < W; x += 16) ctx.fillRect(x, y, 1, 1);
      }
      ctx.fillStyle = "rgba(237,237,237,0.06)";
      ctx.fillRect(0, Math.floor(H / 2), W, 1);

      for (const cell of cellData) {
        ctx.fillStyle = cell.color;
        ctx.fillRect(cell.gx * CELL, cell.gy * CELL, CELL - 1, CELL - 1);
      }

      for (const spark of sparkSeeds) {
        const pulse = reduced ? 0.65 : (Math.sin(now / 430 + spark.phase) + 1) / 2;
        if (pulse < 0.22) continue;
        const x = Math.round(spark.x * W);
        const y = Math.round(spark.y * H);
        const size = pulse > 0.7 ? 4 : 2;
        ctx.fillStyle = `rgba(255,255,255,${0.06 + pulse * 0.2})`;
        ctx.fillRect(x - 8, y - 8, 16, 16);
        ctx.fillStyle = spark.color;
        ctx.fillRect(x - size, y - size / 2, size * 2, size);
        ctx.fillRect(x - size / 2, y - size, size, size * 2);
      }

      if (!reduced) {
        const scan = Math.floor((now / 46) % H);
        ctx.fillStyle = "rgba(184,242,26,0.12)";
        ctx.fillRect(0, scan, W, 1);
      }
    }

    bus.add((now) => {
      if (!state.visible) return;
      draw(now);
    });
    draw(performance.now());
  }

  /* ----------------------------------------------------------
     DNA helix
     ---------------------------------------------------------- */
  function initDna() {
    const canvas = document.getElementById("dnaCanvas");
    const section = document.getElementById("dna");
    if (!canvas || !section) return;

    const W = 320;
    const H = 360;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;

    const state = watch(section);
    const STEPS = 19;
    const strandA = [colors.lime, colors.cyan];
    const strandB = [colors.cyan, colors.magenta];

    function draw(now) {
      const progress = progressOf(section, 0.96, -0.25);
      const phase = reduced ? progress * Math.PI * 2.4 : progress * Math.PI * 2.4 + now * 0.00075;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "#0A0A0A";
      ctx.fillRect(0, 0, W, H);

      ctx.fillStyle = "rgba(237,237,237,0.05)";
      for (let y = 12; y < H; y += 18) {
        for (let x = 12; x < W; x += 18) ctx.fillRect(x, y, 1, 1);
      }

      const centerX = W / 2;
      const amplitude = 62;
      const top = 26;
      const bottom = H - 26;

      for (let i = 0; i < STEPS; i += 1) {
        const y = top + (i / (STEPS - 1)) * (bottom - top);
        const angle = phase + i * 0.47;
        const sway = Math.sin(angle);
        const depth = (Math.cos(angle) + 1) / 2;
        const x1 = centerX + sway * amplitude;
        const x2 = centerX - sway * amplitude;

        if (i < STEPS - 1) {
          const yNext = top + ((i + 1) / (STEPS - 1)) * (bottom - top);
          const angleNext = phase + (i + 1) * 0.47;
          const swayNext = Math.sin(angleNext);
          ctx.fillStyle = "rgba(214,58,138,0.18)";
          for (let p = 0; p < 4; p += 1) {
            const f = p / 4;
            const rx = centerX + (sway + (swayNext - sway) * f) * amplitude;
            const ry = y + (yNext - y) * f;
            ctx.fillRect(Math.round(rx), Math.round(ry), 2, 2);
          }
        }

        ctx.fillStyle = "rgba(214,58,138,0.32)";
        const run = Math.abs(x2 - x1);
        const steps = Math.max(2, Math.floor(run / 8));
        for (let p = 1; p < steps; p += 1) {
          const px = x1 + ((x2 - x1) / steps) * p;
          ctx.fillRect(Math.round(px), Math.round(y), 3, 2);
        }

        const size1 = 5 + Math.round(depth * 5);
        const size2 = 5 + Math.round((1 - depth) * 5);
        ctx.fillStyle = strandA[i % 2];
        ctx.fillRect(Math.round(x1 - size1 / 2), Math.round(y - size1 / 2), size1, size1);
        ctx.fillStyle = "rgba(0,0,0,0.35)";
        ctx.fillRect(Math.round(x1 - size1 / 2), Math.round(y + size1 / 2 - 1), size1, 1);

        ctx.fillStyle = strandB[i % 2];
        ctx.fillRect(Math.round(x2 - size2 / 2), Math.round(y - size2 / 2), size2, size2);
        ctx.fillStyle = "rgba(255,255,255,0.18)";
        ctx.fillRect(Math.round(x2 - size2 / 2), Math.round(y - size2 / 2), 1, 1);

        if (i % 3 === 0) {
          ctx.fillStyle = "rgba(237,237,237,0.45)";
          ctx.fillRect(Math.round(centerX - 1), Math.round(y), 2, 2);
        }
      }

      ctx.fillStyle = "rgba(184,242,26,0.26)";
      ctx.fillRect(26, 16, 54, 1);
      ctx.fillRect(W - 80, H - 17, 54, 1);
      ctx.fillStyle = colors.lime;
      ctx.fillRect(32, 13, 3, 3);
      ctx.fillRect(W - 38, H - 20, 3, 3);
    }

    bus.add((now) => {
      if (!state.visible) return;
      draw(now);
    });
    draw(performance.now());
  }

  /* ----------------------------------------------------------
     emotion field — hearts + stars react to the pointer
     ---------------------------------------------------------- */
  function initEmotion() {
    const section = document.getElementById("emotion");
    const canvas = document.getElementById("emotionCanvas");
    if (!section || !canvas) return;

    const ctx = canvas.getContext("2d");
    const state = watch(section);
    const pointer = { x: -9999, y: -9999, inside: false };
    let w = 0;
    let h = 0;
    let dpr = 1;
    let drawn = false;

    const palette = [colors.magenta, colors.red, colors.lime, colors.cyan, colors.yellow, colors.purple];
    const HEART = ["XX.XX", "XXXXX", "XXXXX", ".XXX.", "..X.."];
    const STAR = ["..X..", "..X..", "XXXXX", ".XXX.", ".X.X.", "X...X"];

    const random = (() => {
      let seed = 93241;
      return () => {
        seed = (seed * 1664525 + 1013904223) >>> 0;
        return seed / 4294967296;
      };
    })();

    const particles = Array.from({ length: 30 }, (_, index) => ({
      nx: index % 5 === 0 ? 0.04 + random() * 0.38 : 0.4 + random() * 0.58,
      ny: 0.08 + random() * 0.84,
      type: index % 4 === 0 ? "star" : "heart",
      color: palette[index % palette.length],
      size: index % 7 === 0 ? 4 : 2 + Math.floor(random() * 2),
      phase: random() * Math.PI * 2,
      speed: 0.4 + random() * 1.1,
      ox: 0,
      oy: 0
    }));

    function resize() {
      const rect = section.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const nextW = Math.round(rect.width * dpr);
      const nextH = Math.round(rect.height * dpr);
      if (nextW === canvas.width && nextH === canvas.height) {
        w = rect.width;
        h = rect.height;
        return;
      }
      canvas.width = nextW;
      canvas.height = nextH;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = false;
      w = rect.width;
      h = rect.height;
    }

    function drawShape(type, x, y, size, color, alpha) {
      const rows = type === "star" ? STAR : HEART;
      ctx.globalAlpha = alpha;
      for (let row = 0; row < rows.length; row += 1) {
        for (let col = 0; col < rows[row].length; col += 1) {
          if (rows[row][col] !== "X") continue;
          ctx.fillStyle = color;
          ctx.fillRect(x + col * size, y + row * size, size, size);
        }
      }
      if (size > 2) {
        ctx.fillStyle = "#FFFFFF";
        ctx.globalAlpha = alpha * 0.3;
        ctx.fillRect(x + size, y + size, size, size);
      }
      ctx.globalAlpha = 1;
    }

    function draw(now) {
      if (!w || !h) resize();
      if (!w || !h) return;
      ctx.clearRect(0, 0, w, h);

      const time = reduced ? 0 : now;

      for (const particle of particles) {
        const baseX = particle.nx * w;
        const baseY = particle.ny * h + Math.sin(time / 1100 * particle.speed + particle.phase) * 7;

        let targetX = 0;
        let targetY = 0;
        if (!reduced && pointer.inside) {
          const dx = baseX - pointer.x;
          const dy = baseY - pointer.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 130 && dist > 0.01) {
            const force = (1 - dist / 130) * 34;
            targetX = (dx / dist) * force;
            targetY = (dy / dist) * force;
          }
        }
        particle.ox += (targetX - particle.ox) * (reduced ? 1 : 0.16);
        particle.oy += (targetY - particle.oy) * (reduced ? 1 : 0.16);

        const x = Math.round(baseX + particle.ox);
        const y = Math.round(baseY + particle.oy);
        drawShape(particle.type, x, y, particle.size, particle.color, 0.56);
      }

      drawn = true;
    }

    const observer = new ResizeObserver(() => {
      resize();
      draw(performance.now());
    });
    observer.observe(section);
    cleanups.push(() => observer.disconnect());

    section.addEventListener(
      "pointermove",
      (event) => {
        if (event.pointerType === "touch") return;
        const rect = section.getBoundingClientRect();
        pointer.x = event.clientX - rect.left;
        pointer.y = event.clientY - rect.top;
        pointer.inside = true;
      },
      { passive: true }
    );
    section.addEventListener("pointerleave", () => {
      pointer.inside = false;
    });

    bus.add((now) => {
      if (!state.visible) return;
      if (reduced && drawn) return;
      draw(now);
    });
    resize();
    draw(performance.now());
  }

  /* ----------------------------------------------------------
     project sprites
     ---------------------------------------------------------- */
  function initSprites() {
    function paintBackground(ctx) {
      ctx.clearRect(0, 0, 192, 192);
      ctx.fillStyle = "rgba(237,237,237,0.08)";
      for (let y = 20; y < 192; y += 42) {
        for (let x = 20; x < 192; x += 42) {
          ctx.fillRect(x, y, 1, 7);
          ctx.fillRect(x - 3, y + 3, 7, 1);
        }
      }
      ctx.fillStyle = "rgba(0,0,0,0.4)";
      ctx.fillRect(32, 160, 128, 8);
    }

    function paintGhost(canvas) {
      const ctx = canvas.getContext("2d");
      ctx.imageSmoothingEnabled = false;
      paintBackground(ctx);
      const rows = [
        "....XXXXXXXX....",
        "..XXXXXXXXXXXX..",
        ".XXXXXXXXXXXXXX.",
        "XXXXXXXXXXXXXXXX",
        "XXWWWXXXXXXWWWXX",
        "XXWWWXXXXXXWWWXX",
        "XXWKWXXXXXXWKWXX",
        "XXWKWXXXXXXWKWXX",
        "XXXXXXXXXXXXXXXX",
        "XXXXXXXXXXXXXXXX",
        "XXXXXXXXXXXXXXXX",
        "XXXXXXXXXXXXXXXX",
        "XXXXXXXXXXXXXXXX",
        "XX.XXXX.XXXX.XXX",
        "X...XX...XX...X.",
        "....X.....X....."
      ];
      const cell = 10;
      const ox = 16;
      const oy = 10;
      for (let y = 0; y < rows.length; y += 1) {
        for (let x = 0; x < 16; x += 1) {
          const ch = rows[y][x];
          if (!ch || ch === ".") continue;
          let color = colors.cyan;
          if (x > 10 || y > 12) color = "#169CB4";
          if (ch === "W") color = "#EDEDED";
          if (ch === "K") color = "#121212";
          ctx.fillStyle = color;
          ctx.fillRect(ox + x * cell, oy + y * cell, cell, cell);
        }
      }
      ctx.fillStyle = "rgba(255,255,255,0.18)";
      ctx.fillRect(26, 30, 26, 6);
      ctx.fillStyle = colors.magenta;
      ctx.fillRect(158, 30, 8, 8);
    }

    function paintCassette(canvas) {
      const ctx = canvas.getContext("2d");
      ctx.imageSmoothingEnabled = false;
      paintBackground(ctx);

      ctx.fillStyle = "#080808";
      ctx.fillRect(17, 49, 160, 100);
      ctx.fillStyle = colors.orange;
      ctx.fillRect(16, 42, 160, 100);
      ctx.fillStyle = "#B8560D";
      ctx.fillRect(16, 126, 160, 16);
      ctx.fillStyle = "#F9A25E";
      ctx.fillRect(16, 42, 160, 5);

      ctx.fillStyle = "#161616";
      ctx.fillRect(30, 55, 132, 34);
      ctx.fillStyle = "#2C2C2C";
      ctx.fillRect(36, 61, 120, 22);
      ctx.fillStyle = colors.lime;
      ctx.fillRect(42, 69, 36, 4);
      ctx.fillRect(84, 69, 24, 4);
      ctx.fillStyle = "rgba(237,237,237,0.4)";
      ctx.fillRect(116, 67, 32, 2);
      ctx.fillRect(116, 72, 24, 2);

      const drawDisc = (cx, cy, radius, body, hole) => {
        for (let y = -radius; y <= radius; y += 3) {
          for (let x = -radius; x <= radius; x += 3) {
            if (x * x + y * y > radius * radius) continue;
            ctx.fillStyle = x * x + y * y < 9 ? hole : body;
            ctx.fillRect(Math.round(cx + x), Math.round(cy + y), 3, 3);
          }
        }
      };

      drawDisc(65, 108, 24, "#0F0F0F", colors.orange);
      drawDisc(127, 108, 24, "#0F0F0F", colors.orange);
      ctx.fillStyle = "#EDEDED";
      ctx.fillRect(62, 105, 6, 6);
      ctx.fillRect(124, 105, 6, 6);

      ctx.fillStyle = colors.lime;
      ctx.fillRect(48, 91, 3, 3);
      ctx.fillRect(141, 91, 3, 3);
      ctx.fillStyle = "rgba(0,0,0,0.4)";
      ctx.fillRect(76, 130, 40, 4);
      ctx.fillStyle = "#EDEDED";
      ctx.fillRect(84, 130, 2, 4);
      ctx.fillRect(92, 130, 2, 4);
      ctx.fillRect(100, 130, 2, 4);
      ctx.fillRect(108, 130, 2, 4);
    }

    function paintRocket(canvas) {
      const ctx = canvas.getContext("2d");
      ctx.imageSmoothingEnabled = false;
      paintBackground(ctx);

      const rows = [
        ".......WW.......",
        "......WWWW......",
        "......WCCW......",
        ".....WWCCWW.....",
        ".....WWCCWW.....",
        "....WWWWWWWW....",
        "....WPLLLLPW....",
        "....WPLLLLPW....",
        "....WPLLLLPW....",
        "....WPLLLLPW....",
        "....WPLLLLPW....",
        "....WPLLLLPW....",
        "....WPLLLLPW....",
        "...WWPLLLLPWW...",
        "...FFPLLLLPFF...",
        "..FFFLLLLLLFFF..",
        "..FFFFFFFFFFFF..",
        "...FFFFFFFFFF...",
        "....OOYYYYOO....",
        ".....OYYYYO.....",
        "......OYYO......",
        ".......OO......."
      ];
      const cell = 8;
      const ox = 32;
      const oy = 12;
      for (let y = 0; y < rows.length; y += 1) {
        for (let x = 0; x < 16; x += 1) {
          const ch = rows[y][x];
          if (!ch || ch === ".") continue;
          let color = colors.purple;
          if (ch === "W") color = "#FFFFFF";
          if (ch === "C") color = colors.cyan;
          if (ch === "L") color = "#A78BFA";
          if (ch === "F") color = colors.lime;
          if (ch === "O") color = colors.orange;
          if (ch === "Y") color = colors.yellow;
          ctx.fillStyle = color;
          ctx.fillRect(ox + x * cell, oy + y * cell, cell, cell);
        }
      }
      ctx.fillStyle = "rgba(255,255,255,0.22)";
      ctx.fillRect(47, 24, 10, 10);
    }

    const painters = { ghost: paintGhost, cassette: paintCassette, rocket: paintRocket };
    document.querySelectorAll(".sprite-canvas").forEach((canvas) => {
      const type = canvas.dataset.sprite;
      const painter = painters[type];
      if (painter) painter(canvas);
    });
  }

  /* ----------------------------------------------------------
     retro windows
     ---------------------------------------------------------- */
  function initWindows() {
    const stack = document.getElementById("windowStack");
    const restore = document.getElementById("restoreWindows");
    if (!stack) return;

    const closeWindow = (win, focusNext = true) => {
      const title = win.querySelector(".win__title")?.textContent?.trim() || "janela";
      win.classList.remove("is-min");
      win.classList.add("is-closed");
      const active = document.activeElement;
      if (active && win.contains(active)) {
        if (focusNext) restore?.focus({ preventScroll: true });
        else active.blur();
      }
      announce(`Fechando ${title}.`);
      audio?.back?.();
    };

    stack.addEventListener("click", (event) => {
      const button = event.target.closest("[data-win], [data-dismiss]");
      if (!button || !stack.contains(button)) return;
      const win = button.closest(".win");
      if (!win) return;
      const action = button.dataset.win || "dismiss";

      if (action === "yes") {
        audio?.click?.();
        announce("Abrindo os projetos selecionados.");
        return;
      }

      event.preventDefault();

      if (action === "min") {
        const minimized = win.classList.toggle("is-min");
        const title = win.querySelector(".win__title")?.textContent?.trim() || "janela";
        button.textContent = minimized ? "+" : "_";
        button.setAttribute(
          "aria-label",
          `${minimized ? "Restaurar" : "Minimizar"} ${title}`
        );
        announce(`${minimized ? "Minimizando" : "Restaurando"} ${title}.`);
        audio?.click?.();
        return;
      }

      if (action === "close") {
        closeWindow(win);
        return;
      }

      closeWindow(win);
    });

    restore?.addEventListener("click", () => {
      stack.querySelectorAll(".win").forEach((win) => {
        win.classList.remove("is-closed", "is-min");
        const minButton = win.querySelector('[data-win="min"]');
        if (minButton) {
          minButton.textContent = "_";
          minButton.setAttribute(
            "aria-label",
            `Minimizar ${win.querySelector(".win__title")?.textContent?.trim() || "janela"}`
          );
        }
      });
      const first = stack.querySelector(".win__btn");
      first?.focus({ preventScroll: true });
      announce("Todas as janelas restauradas.");
      audio?.success?.();
    });
  }

  /* ----------------------------------------------------------
     auto Tetris
     ---------------------------------------------------------- */
  function initTetris() {
    const canvas = document.getElementById("tetrisCanvas");
    const section = document.getElementById("tetris");
    const nextButton = document.getElementById("tetrisNext");
    const linesEl = document.getElementById("tetrisLines");
    const piecesEl = document.getElementById("tetrisPieces");
    const flashEl = document.getElementById("tetrisFlash");
    if (!canvas || !section) return;

    const COLS = 10;
    const ROWS = 16;
    const CELL = 30;
    canvas.width = COLS * CELL;
    canvas.height = ROWS * CELL;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;

    const SHAPES = [
      { cells: [[0, 0], [1, 0], [2, 0], [3, 0]], color: colors.cyan },
      { cells: [[0, 0], [1, 0], [0, 1], [1, 1]], color: colors.yellow },
      { cells: [[1, 0], [0, 1], [1, 1], [2, 1]], color: colors.purple },
      { cells: [[0, 0], [0, 1], [1, 1], [2, 1]], color: colors.orange },
      { cells: [[0, 1], [1, 1], [1, 0], [2, 0]], color: colors.lime },
      { cells: [[0, 0], [0, 1], [0, 2], [1, 2]], color: colors.magenta },
      { cells: [[0, 0], [1, 0], [2, 0], [2, 1]], color: colors.red }
    ];

    const piecePalette = [colors.cyan, colors.yellow, colors.magenta, colors.lime, colors.purple, colors.orange];
    const state = watch(section);
    let board = [];
    let current = null;
    let queue = [];
    let pieces = 0;
    let lines = 0;
    let spawnAt = performance.now() + 320;
    let resetAt = 0;
    let lastNow = performance.now();
    let flashTimer = 0;
    let reducedDrawn = false;

    function emptyBoard() {
      return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
    }

    function seedBoard() {
      board = emptyBoard();
      for (let x = 0; x < COLS; x += 1) {
        if (x >= 3 && x <= 6) continue;
        board[ROWS - 1][x] = piecePalette[x % piecePalette.length];
      }
      board[ROWS - 2][0] = colors.purple;
      board[ROWS - 2][1] = colors.purple;
      board[ROWS - 2][9] = colors.orange;
      pieces = 0;
      lines = 0;
      updateCounters();
    }

    function updateCounters() {
      if (linesEl) linesEl.textContent = pad3(lines);
      if (piecesEl) piecesEl.textContent = pad3(pieces);
    }

    function rotate(cells, turns) {
      let result = cells.map(([x, y]) => [x, y]);
      for (let turn = 0; turn < turns % 4; turn += 1) {
        result = result.map(([x, y]) => [y, -x]);
      }
      const minX = Math.min(...result.map(([x]) => x));
      const minY = Math.min(...result.map(([, y]) => y));
      return result.map(([x, y]) => [x - minX, y - minY]);
    }

    function canPlace(cells, x, y) {
      return cells.every(([cx, cy]) => {
        const px = x + cx;
        const py = y + cy;
        if (px < 0 || px >= COLS || py >= ROWS) return false;
        if (py < 0) return true;
        return !board[py][px];
      });
    }

    function chooseColumn(width) {
      const options = COLS - width + 1;
      if (options <= 0) return 0;
      let bestX = 0;
      let bestScore = Infinity;
      for (let x = 0; x < options; x += 1) {
        let height = 0;
        for (let cx = 0; cx < width; cx += 1) {
          for (let y = 0; y < ROWS; y += 1) {
            if (board[y][x + cx]) {
              height = Math.max(height, ROWS - y);
              break;
            }
          }
        }
        const noise = Math.random() * 2.4;
        const score = height + noise;
        if (score < bestScore) {
          bestScore = score;
          bestX = x;
        }
      }
      return bestX;
    }

    function spawn(now) {
      const preset = queue.shift();
      let shapeIndex = preset ? preset.shape : Math.floor(Math.random() * SHAPES.length);
      let turns = preset ? preset.rot : Math.floor(Math.random() * 4);
      let cells = rotate(SHAPES[shapeIndex].cells, turns);
      const width = Math.max(...cells.map(([x]) => x)) + 1;
      const x = preset ? preset.x : chooseColumn(width);
      const height = Math.max(...cells.map(([, y]) => y)) + 1;
      current = {
        cells,
        x,
        y: -height,
        color: SHAPES[shapeIndex].color,
        timer: 0
      };
      spawnAt = 0;
    }

    function clearLines() {
      const fullRows = [];
      board.forEach((row, index) => {
        if (row.every(Boolean)) fullRows.push(index);
      });
      if (!fullRows.length) return 0;
      board = board.filter((_, index) => !fullRows.includes(index));
      while (board.length < ROWS) board.unshift(Array(COLS).fill(null));
      lines += fullRows.length;
      updateCounters();
      showFlash();
      return fullRows.length;
    }

    function showFlash() {
      if (!flashEl) return;
      window.clearTimeout(flashTimer);
      flashEl.classList.remove("is-flash");
      void flashEl.offsetWidth;
      flashEl.classList.add("is-flash");
      flashTimer = window.setTimeout(() => flashEl.classList.remove("is-flash"), 1350);
    }

    function lockPiece(now) {
      if (!current) return;
      let topOut = false;
      current.cells.forEach(([cx, cy]) => {
        const x = current.x + cx;
        const y = current.y + cy;
        if (y < 0) {
          topOut = true;
          return;
        }
        if (x >= 0 && x < COLS && y < ROWS) board[y][x] = current.color;
      });
      current = null;
      pieces += 1;
      updateCounters();
      const cleared = topOut ? 0 : clearLines();
      if (cleared) {
        audio?.success?.();
        announce(`Linhas concluídas: ${lines}.`);
        spawnAt = now + 520;
      } else {
        spawnAt = now + (reduced ? 280 : 180);
      }
      if (topOut) {
        resetAt = now + 700;
        spawnAt = 0;
      }
    }

    function landingY() {
      if (!current) return 0;
      let y = current.y;
      while (canPlace(current.cells, current.x, y + 1)) y += 1;
      return y;
    }

    function drawBlock(x, y, color, alpha = 1) {
      if (y < 0) return;
      const px = x * CELL;
      const py = y * CELL;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;
      ctx.fillRect(px + 1, py + 1, CELL - 2, CELL - 2);
      ctx.fillStyle = "rgba(255,255,255,0.24)";
      ctx.fillRect(px + 3, py + 3, CELL - 10, 4);
      ctx.fillRect(px + 3, py + 7, 4, CELL - 14);
      ctx.fillStyle = "rgba(0,0,0,0.28)";
      ctx.fillRect(px + 3, py + CELL - 7, CELL - 6, 4);
      ctx.fillRect(px + CELL - 7, py + 7, 4, CELL - 14);
      ctx.globalAlpha = 1;
    }

    function render() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#090909";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "rgba(237,237,237,0.045)";
      for (let x = 1; x < COLS; x += 1) ctx.fillRect(x * CELL, 0, 1, canvas.height);
      for (let y = 1; y < ROWS; y += 1) {
        for (let x = 0; x < COLS; x += 1) {
          if ((x + y) % 2 === 0) ctx.fillRect(x * CELL + 14, y * CELL, 2, 2);
        }
      }

      for (let y = 0; y < ROWS; y += 1) {
        for (let x = 0; x < COLS; x += 1) {
          if (board[y][x]) drawBlock(x, y, board[y][x]);
        }
      }

      if (current) {
        const ghostY = landingY();
        if (ghostY > current.y) {
          current.cells.forEach(([cx, cy]) => {
            const x = current.x + cx;
            const y = ghostY + cy;
            if (y < 0) return;
            ctx.globalAlpha = 0.22;
            ctx.fillStyle = current.color;
            ctx.fillRect(x * CELL + 4, y * CELL + 4, CELL - 8, CELL - 8);
            ctx.globalAlpha = 1;
          });
        }
        current.cells.forEach(([cx, cy]) => drawBlock(current.x + cx, current.y + cy, current.color));
      }

      ctx.fillStyle = "rgba(184,242,26,0.2)";
      ctx.fillRect(0, 0, canvas.width, 2);
    }

    function stepDown(now) {
      if (!current) {
        if (now >= spawnAt) spawn(now);
        return;
      }
      const interval = Math.max(52, 100 - pieces * 2);
      current.timer += Math.min(64, now - lastNow);
      if (current.timer < interval) return;
      current.timer = 0;
      if (canPlace(current.cells, current.x, current.y + 1)) {
        current.y += 1;
      } else {
        lockPiece(now);
      }
    }

    seedBoard();
    current = null;
    queue = [{ shape: 0, rot: 0, x: 3 }];
    render();

    const observerVisible = state;

    bus.add((now) => {
      if (!observerVisible.visible) {
        lastNow = now;
        return;
      }
      if (reduced) {
        if (!reducedDrawn) {
          render();
          reducedDrawn = true;
        }
        lastNow = now;
        return;
      }
      reducedDrawn = false;
      if (resetAt && now >= resetAt) {
        resetAt = 0;
        seedBoard();
        queue = [{ shape: 0, rot: 0, x: 3 }];
        current = null;
      }
      if (!current && now >= spawnAt) spawn(now);
      stepDown(now);
      lastNow = now;
      render();
    });

    nextButton?.addEventListener("click", () => {
      audio?.click?.();
      const now = performance.now();
      if (!current) {
        spawn(now);
      } else {
        while (canPlace(current.cells, current.x, current.y + 1)) current.y += 1;
        lockPiece(now);
        spawnAt = now + 280;
      }
      render();
      announce("Peça posicionada.");
    });

    cleanups.push(() => window.clearTimeout(flashTimer));
  }

  /* ----------------------------------------------------------
     pixel world map + live clock
     ---------------------------------------------------------- */
  function initWorld() {
    const canvas = document.getElementById("worldCanvas");
    const section = document.getElementById("world");
    const clockEl = document.getElementById("localTime");
    if (!canvas || !section) return;

    const W = 960;
    const H = 480;
    const GW = 80;
    const GH = 40;
    const CELL = 12;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;

    const polygons = [
      [[8, 7], [16, 6], [24, 5], [29, 7], [26, 10], [24, 13], [22, 15], [21, 19], [19, 20], [17, 17], [16, 14], [13, 13], [10, 11], [7, 9]],
      [[25, 2], [30, 2], [32, 5], [29, 7], [26, 5]],
      [[19, 20], [22, 20], [23, 22], [21, 23], [19, 22]],
      [[21, 22], [27, 22], [30, 26], [29, 31], [26, 35], [23, 33], [22, 28], [20, 25]],
      [[36, 6], [44, 6], [46, 9], [43, 11], [39, 12], [35, 10], [34, 8]],
      [[35, 13], [44, 13], [46, 17], [44, 22], [41, 26], [38, 29], [35, 27], [33, 22], [33, 17]],
      [[45, 7], [58, 5], [68, 7], [72, 11], [69, 15], [63, 16], [60, 14], [57, 17], [53, 18], [51, 15], [48, 14], [46, 11]],
      [[52, 15], [57, 15], [56, 19], [54, 21], [52, 18]],
      [[61, 17], [67, 17], [68, 21], [64, 23], [61, 20]],
      [[69, 11], [71, 11], [70, 14], [68, 13]],
      [[63, 27], [72, 27], [74, 30], [70, 33], [65, 33], [62, 30]],
      [[74, 31], [76, 31], [75, 34], [73, 33]],
      [[34, 4], [36, 4], [36, 6], [34, 6]],
      [[47, 27], [49, 27], [49, 30], [47, 29]]
    ];

    function inPoly(x, y, poly) {
      let inside = false;
      for (let i = 0, j = poly.length - 1; i < poly.length; j = i, i += 1) {
        const xi = poly[i][0];
        const yi = poly[i][1];
        const xj = poly[j][0];
        const yj = poly[j][1];
        if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
          inside = !inside;
        }
      }
      return inside;
    }

    function isLand(x, y) {
      return polygons.some((poly) => inPoly(x + 0.5, y + 0.5, poly));
    }

    const mapCache = document.createElement("canvas");
    mapCache.width = W;
    mapCache.height = H;
    const mapCtx = mapCache.getContext("2d");
    mapCtx.imageSmoothingEnabled = false;
    mapCtx.fillStyle = "#080A08";
    mapCtx.fillRect(0, 0, W, H);

    mapCtx.fillStyle = "rgba(237,237,237,0.035)";
    for (let y = 12; y < H; y += 24) {
      for (let x = 12; x < W; x += 24) mapCtx.fillRect(x, y, 1, 1);
    }

    const landColors = ["#1B2A22", "#20342A", "#243B2F", "#1A2720"];
    for (let gy = 0; gy < GH; gy += 1) {
      for (let gx = 0; gx < GW; gx += 1) {
        if (!isLand(gx, gy)) continue;
        const coast =
          !isLand(gx - 1, gy) ||
          !isLand(gx + 1, gy) ||
          !isLand(gx, gy - 1) ||
          !isLand(gx, gy + 1);
        const h = hash(gx, gy);
        const color = coast ? "#3A5A42" : landColors[Math.floor(h * landColors.length)];
        mapCtx.fillStyle = color;
        mapCtx.fillRect(gx * CELL + (coast ? 0 : 1), gy * CELL + (coast ? 0 : 1), coast ? CELL : CELL - 1, coast ? CELL : CELL - 1);
        if (!coast && h > 0.92) {
          mapCtx.fillStyle = "rgba(184,242,26,0.22)";
          mapCtx.fillRect(gx * CELL + 4, gy * CELL + 4, 3, 3);
        }
      }
    }

    mapCtx.fillStyle = "rgba(30,200,232,0.08)";
    mapCtx.fillRect(0, 20 * CELL, W, 1);
    mapCtx.fillStyle = "rgba(237,237,237,0.08)";
    for (let x = 0; x < W; x += 36) mapCtx.fillRect(x, 20 * CELL - 1, 18, 2);

    const cities = [
      { gx: 28.8, gy: 25.2, color: colors.lime, phase: 0, main: true },
      { gx: 25.6, gy: 12.3, color: colors.cyan, phase: 1.1 },
      { gx: 35.8, gy: 7.6, color: colors.magenta, phase: 2.2 },
      { gx: 70.2, gy: 12.2, color: colors.yellow, phase: 3.3 },
      { gx: 39.6, gy: 28.9, color: colors.orange, phase: 4.4 },
      { gx: 71.6, gy: 31.4, color: colors.purple, phase: 5.5 }
    ].map((city) => ({
      ...city,
      x: (city.gx / GW) * W,
      y: (city.gy / GH) * H
    }));

    const state = watch(section);
    const timeZone = config.world?.timeZone || config.location?.timeZone || "America/Fortaleza";
    let lastClock = 0;
    let clockFormatter = null;
    try {
      clockFormatter = new Intl.DateTimeFormat("en-GB", {
        timeZone,
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      });
    } catch {
      clockFormatter = null;
    }

    function updateClock(force = false) {
      if (!clockEl) return;
      const now = Date.now();
      if (!force && now - lastClock < 1000) return;
      lastClock = now;
      clockEl.textContent = clockFormatter ? clockFormatter.format(new Date()) : new Date().toTimeString().slice(0, 5);
    }

    function dottedArc(a, b, height) {
      ctx.fillStyle = "rgba(184,242,26,0.14)";
      for (let i = 5; i < 36; i += 6) {
        const f = i / 36;
        const x = a.x + (b.x - a.x) * f;
        const y = a.y + (b.y - a.y) * f - Math.sin(Math.PI * f) * height;
        ctx.fillRect(Math.round(x), Math.round(y), 2, 2);
      }
    }

    function draw(now) {
      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(mapCache, 0, 0);

      const main = cities[0];
      for (let i = 1; i < cities.length; i += 1) dottedArc(main, cities[i], 36 + i * 8);

      for (const city of cities) {
        const pulse = reduced ? 0.55 : (Math.sin(now / 540 + city.phase) + 1) / 2;
        const size = 8 + pulse * 16;

        ctx.globalAlpha = 0.22 + (1 - pulse) * 0.18;
        ctx.fillStyle = city.color;
        const half = Math.round(size / 2);
        ctx.fillRect(Math.round(city.x) - half, Math.round(city.y) - half, size, 2);
        ctx.fillRect(Math.round(city.x) - half, Math.round(city.y) + half - 2, size, 2);
        ctx.fillRect(Math.round(city.x) - half, Math.round(city.y) - half, 2, size);
        ctx.fillRect(Math.round(city.x) + half - 2, Math.round(city.y) - half, 2, size);
        ctx.globalAlpha = 1;

        ctx.fillStyle = city.color;
        ctx.fillRect(Math.round(city.x) - 3, Math.round(city.y) - 3, 6, 6);
        ctx.fillStyle = "rgba(255,255,255,0.65)";
        ctx.fillRect(Math.round(city.x) - 1, Math.round(city.y) - 1, 2, 2);

        if (city.main) {
          ctx.fillStyle = "rgba(184,242,26,0.45)";
          ctx.fillRect(Math.round(city.x) - 22, Math.round(city.y), 12, 1);
          ctx.fillRect(Math.round(city.x) + 10, Math.round(city.y), 12, 1);
          ctx.fillRect(Math.round(city.x), Math.round(city.y) - 22, 1, 12);
          ctx.fillRect(Math.round(city.x), Math.round(city.y) + 10, 1, 12);
        }
      }

      if (!reduced) {
        const sweep = Math.floor((now / 80) % W);
        ctx.fillStyle = "rgba(184,242,26,0.05)";
        ctx.fillRect(sweep, 0, 1, H);
      }
    }

    bus.add((now) => {
      if (!state.visible) return;
      draw(now);
      updateClock();
    });

    updateClock(true);
    draw(performance.now());
  }

  /* ----------------------------------------------------------
     back to top
     ---------------------------------------------------------- */
  function initBackToTop() {
    const button = document.getElementById("backToTop");
    if (!button) return;
    button.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
      audio?.back?.();
    });
  }

  initPixelGrid();
  initBrain();
  initDna();
  initEmotion();
  initSprites();
  initWindows();
  initTetris();
  initWorld();
  initBackToTop();

  return {
    setReducedMotion(value) {
      reduced = Boolean(value);
    },
    destroy() {
      cleanups.forEach((fn) => fn());
      cleanups.length = 0;
    }
  };
}
