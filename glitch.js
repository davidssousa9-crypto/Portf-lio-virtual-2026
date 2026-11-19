/* ============================================================
   GLITCH.JS — 600ms RGB glitch + pixel confetti.
   All effects are skipped under prefers-reduced-motion.
   ============================================================ */

export function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function random(min, max) {
  return min + Math.random() * (max - min);
}

function forceRestart(element, className) {
  element.classList.remove(className);
  void element.offsetWidth;
  element.classList.add(className);
}

function buildCells(host, colors, duration) {
  const layer = document.createElement("span");
  layer.className = "glitch-cells";
  layer.setAttribute("aria-hidden", "true");

  const count = Math.round(random(3, 6));
  for (let index = 0; index < count; index += 1) {
    const cell = document.createElement("span");
    const size = random(3, 7);
    const palette = [colors.red, colors.blue, colors.lime, colors.magenta];
    cell.className = "glitch-cell";
    cell.style.width = `${size.toFixed(1)}px`;
    cell.style.height = `${size.toFixed(1)}px`;
    cell.style.left = `${random(2, 88).toFixed(1)}%`;
    cell.style.top = `${random(2, 84).toFixed(1)}%`;
    cell.style.background = palette[Math.floor(Math.random() * palette.length)];
    cell.animate(
      [
        { opacity: 0, transform: "translate(0, 0)" },
        { opacity: 1, transform: `translate(${random(-6, 6)}px, 0)` },
        { opacity: 0, transform: `translate(${random(-8, 8)}px, 0)` }
      ],
      {
        duration,
        delay: index * 30,
        easing: "steps(2, end)",
        fill: "both"
      }
    );
    layer.appendChild(cell);
  }

  host.appendChild(layer);
  window.setTimeout(() => layer.remove(), duration + 160);
}

function textFrames(maxShift) {
  const frames = [];
  for (let step = 0; step <= 8; step += 1) {
    frames.push({
      transform: `translateX(${random(-maxShift, maxShift).toFixed(1)}px)`
    });
  }
  return frames;
}

export function glitchText(element, { duration = 600, colors = {} } = {}) {
  if (!element || prefersReducedMotion()) return;

  const palette = {
    cyan: "#12C2ED",
    magenta: "#ED3D91",
    lime: "#BCED12",
    red: "#EE3B3E",
    blue: "#124AED",
    ...colors
  };

  element.querySelectorAll(".glitch-text-ghost, .glitch-cells").forEach((node) =>
    node.remove()
  );
  forceRestart(element, "is-glitching");

  const text = element.textContent;

  [
    { color: palette.cyan, shift: -4 },
    { color: palette.magenta, shift: 4 }
  ].forEach((copy, index) => {
    const ghost = document.createElement("span");
    ghost.className = "glitch-text-ghost glitch-text-ghost--full";
    ghost.setAttribute("aria-hidden", "true");
    ghost.textContent = text;
    ghost.style.color = copy.color;
    ghost.animate(
      [
        { transform: "translateX(0)" },
        { transform: `translateX(${copy.shift}px)` },
        { transform: `translateX(${-copy.shift}px)` },
        { transform: "translateX(0)" }
      ],
      {
        duration,
        delay: index * 24,
        easing: "steps(8, end)",
        fill: "both"
      }
    );
    element.appendChild(ghost);
  });

  const bands = [
    { top: 0, height: 22, color: palette.cyan, shift: 6 },
    { top: 19, height: 26, color: palette.magenta, shift: -5 },
    { top: 47, height: 20, color: palette.cyan, shift: 4 },
    { top: 66, height: 34, color: palette.magenta, shift: -6 }
  ];

  bands.forEach((band, index) => {
    const ghost = document.createElement("span");
    ghost.className = "glitch-text-ghost";
    ghost.setAttribute("aria-hidden", "true");
    ghost.textContent = text;
    ghost.style.color = band.color;
    ghost.style.clipPath = `inset(${band.top}% 0 ${Math.max(
      0,
      100 - band.top - band.height
    )}% 0)`;
    ghost.animate(textFrames(band.shift), {
      duration,
      delay: index * 18,
      easing: "steps(8, end)",
      fill: "both"
    });
    element.appendChild(ghost);
  });

  buildCells(element, palette, duration);

  window.setTimeout(() => {
    element.classList.remove("is-glitching");
    element
      .querySelectorAll(".glitch-text-ghost, .glitch-cells")
      .forEach((node) => node.remove());
  }, duration + 80);
}

export function glitchLogo(element, { duration = 600, colors = {} } = {}) {
  if (!element || prefersReducedMotion()) return;

  const palette = {
    cyan: "#12C2ED",
    magenta: "#ED3D91",
    lime: "#BCED12",
    red: "#EE3B3E",
    blue: "#124AED",
    ...colors
  };

  const baseSvg = element.querySelector(".logo__base svg");
  const bandsHost = element.querySelector(".logo__bands");
  if (!baseSvg || !bandsHost) return;

  bandsHost.replaceChildren();
  element.querySelectorAll(".glitch-cells").forEach((node) => node.remove());
  forceRestart(element, "is-glitching");

  const bands = [
    { top: 3, height: 18, shift: 6, color: palette.cyan },
    { top: 21, height: 24, shift: -6, color: palette.magenta },
    { top: 46, height: 20, shift: 5, color: palette.cyan },
    { top: 63, height: 24, shift: -4, color: palette.magenta }
  ];

  bands.forEach((band, index) => {
    const wrap = document.createElement("span");
    wrap.className = "glitch-logo-band";
    wrap.style.clipPath = `inset(${band.top}% 0 ${Math.max(
      0,
      100 - band.top - band.height
    )}% 0)`;

    const svg = baseSvg.cloneNode(true);
    svg.querySelectorAll(".logo__shadow, .logo__outline").forEach((node) =>
      node.remove()
    );
    const ink = svg.querySelector(".logo__ink");
    if (ink) ink.setAttribute("fill", band.color);
    wrap.appendChild(svg);
    bandsHost.appendChild(wrap);

    wrap.animate(textFrames(band.shift), {
      duration,
      delay: index * 20,
      easing: "steps(8, end)",
      fill: "both"
    });
  });

  buildCells(element, palette, duration);

  window.setTimeout(() => {
    element.classList.remove("is-glitching");
    bandsHost.replaceChildren();
    element.querySelectorAll(".glitch-cells").forEach((node) => node.remove());
  }, duration + 80);
}

/* ---------- confetti ---------- */
export function spawnConfetti(
  container,
  {
    count = 14,
    colors = [],
    origin = null,
    cell = 8,
    duration = 720,
    spread = 220
  } = {}
) {
  if (!container || prefersReducedMotion()) return;

  const rect = container.getBoundingClientRect();
  const ox = origin?.x ?? rect.width / 2;
  const oy = origin?.y ?? rect.height / 2;
  const palette = colors.length
    ? colors
    : ["#BCED12", "#F6C53A", "#12C2ED", "#ED3D91", "#894AED", "#ED7812"];

  for (let index = 0; index < count; index += 1) {
    const piece = document.createElement("span");
    const pieceCell = Math.max(3, Math.round(cell * random(0.55, 1.1)));
    const angle = random(-Math.PI * 0.95, Math.PI * 0.95);
    const distance = random(spread * 0.35, spread);
    const dx = Math.cos(angle) * distance;
    const dy = Math.sin(angle) * distance * 0.72 + random(20, 90);
    const color = palette[Math.floor(Math.random() * palette.length)];

    piece.className = "confetti";
    piece.setAttribute("aria-hidden", "true");
    piece.style.width = `${pieceCell}px`;
    piece.style.height = `${pieceCell}px`;
    piece.style.left = `${ox}px`;
    piece.style.top = `${oy}px`;
    piece.style.background = color;
    container.appendChild(piece);

    piece.animate(
      [
        { transform: "translate(-50%, -50%) translate(0, 0)", opacity: 1 },
        {
          transform: `translate(-50%, -50%) translate(${dx.toFixed(
            1
          )}px, ${dy.toFixed(1)}px)`,
          opacity: index % 3 === 0 ? 0.2 : 1
        },
        {
          transform: `translate(-50%, -50%) translate(${dx.toFixed(
            1
          )}px, ${(dy + 26).toFixed(1)}px)`,
          opacity: 0
        }
      ],
      {
        duration,
        delay: index * 12,
        easing: "steps(6, end)",
        fill: "both"
      }
    );

    window.setTimeout(() => piece.remove(), duration + 240 + index * 12);
  }
}
