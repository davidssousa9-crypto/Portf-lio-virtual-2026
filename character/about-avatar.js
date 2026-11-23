const SIZE = 8;
const WIDTH = 20;
const HEIGHT = 40;
const CENTER_X = (WIDTH * SIZE) / 2;
const COLORS = {
  skin: "#EBC29B",
  skinShade: "#DDA07F",
  blush: "#D9937A",
  hair: "#4A1F2E",
  hairDark: "#2E1520",
  hairLight: "#6B2D3D",
  glasses: "#352833",
  pupil: "#0A0A0A",
  teeth: "#E8E8E8",
  lip: "#A85A55",
  shirt: "#26222A",
  shirtShade: "#3A2A2F",
  jacket: "#3A2A2F",
  jacketShade: "#241A22",
  jacketDark: "#261E26",
  blue: "#7FD4FF",
  pants: "#A0A0A0",
  pantsShade: "#7E7E7E",
  outline: "#231C28",
  shoes: "#E8E8E8"
};
const THREE = ["XX", ".X", "XX", ".X", "XX"];
const NUMBER = THREE.map((row) => `${row}.${row}.${row}`);
const DIRECTIONS = [
  "frente",
  "frente em 3/4",
  "perfil direito",
  "costas em 3/4",
  "costas",
  "costas em 3/4",
  "perfil esquerdo",
  "frente em 3/4"
];

function pixel(ctx, x, y, width, height, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x * SIZE, y * SIZE, width * SIZE, height * SIZE);
}

function drawHead(ctx, { back, profile }) {
  if (back) {
    pixel(ctx, 7, 0, 6, 1, COLORS.hairDark);
    pixel(ctx, 5, 1, 10, 2, COLORS.hair);
    pixel(ctx, 3, 3, 14, 6, COLORS.hair);
    pixel(ctx, 2, 5, 3, 8, COLORS.hairDark);
    pixel(ctx, 6, 3, 2, 2, COLORS.hairLight);
    pixel(ctx, 11, 2, 2, 3, COLORS.hairDark);
    pixel(ctx, 2, 14, 3, 1, COLORS.hairDark);
    return;
  }

  pixel(ctx, 4, 5, 12, 10, COLORS.skin);
  pixel(ctx, 5, 15, 10, 2, COLORS.skin);
  pixel(ctx, 15, 10, 2, 3, COLORS.skinShade);
  pixel(ctx, 7, 16, 7, 1, COLORS.skinShade);

  pixel(ctx, 7, 0, 6, 1, COLORS.hairDark);
  pixel(ctx, 5, 1, 10, 1, COLORS.hair);
  pixel(ctx, 4, 2, 12, 2, COLORS.hair);
  pixel(ctx, 3, 4, 14, 2, COLORS.hair);
  pixel(ctx, 2, 6, 4, 8, COLORS.hair);
  pixel(ctx, 2, 7, 2, 4, COLORS.hairDark);
  pixel(ctx, 13, 5, 3, 2, COLORS.hair);
  pixel(ctx, 15, 7, 1, 1, COLORS.hairLight);
  pixel(ctx, 4, 5, 8, 1, COLORS.hair);
  pixel(ctx, 4, 6, 7, 1, COLORS.hair);
  pixel(ctx, 5, 7, 6, 1, COLORS.hair);
  pixel(ctx, 6, 8, 4, 1, COLORS.hair);
  pixel(ctx, 5, 5, 2, 1, COLORS.hairLight);
  pixel(ctx, 8, 6, 2, 1, COLORS.hairDark);
  pixel(ctx, 9, 7, 2, 1, COLORS.hairDark);
  pixel(ctx, 2, 14, 2, 1, COLORS.hairDark);
  pixel(ctx, 3, 15, 2, 1, COLORS.hair);
  pixel(ctx, 2, 10, 2, 4, COLORS.skin);
  pixel(ctx, 3, 11, 1, 2, COLORS.blush);

  if (profile) {
    pixel(ctx, 12, 9, 5, 4, COLORS.glasses);
    pixel(ctx, 13, 10, 3, 2, COLORS.skin);
    pixel(ctx, 14, 11, 1, 1, COLORS.pupil);
    pixel(ctx, 16, 12, 1, 1, COLORS.skinShade);
    pixel(ctx, 11, 14, 3, 1, COLORS.hairDark);
    pixel(ctx, 9, 15, 4, 1, COLORS.teeth);
    pixel(ctx, 10, 16, 2, 1, COLORS.lip);
    return;
  }

  pixel(ctx, 4, 9, 6, 4, COLORS.glasses);
  pixel(ctx, 5, 10, 4, 2, COLORS.skin);
  pixel(ctx, 6, 10, 1, 1, COLORS.pupil);
  pixel(ctx, 11, 9, 6, 4, COLORS.glasses);
  pixel(ctx, 12, 10, 4, 2, COLORS.skin);
  pixel(ctx, 13, 10, 1, 1, COLORS.pupil);
  pixel(ctx, 10, 10, 2, 2, COLORS.glasses);
  pixel(ctx, 16, 10, 2, 1, COLORS.glasses);
  pixel(ctx, 10, 13, 1, 1, COLORS.skinShade);
  pixel(ctx, 5, 14, 2, 1, COLORS.blush);
  pixel(ctx, 13, 14, 2, 1, COLORS.blush);
  pixel(ctx, 7, 14, 7, 1, COLORS.hairDark);
  pixel(ctx, 8, 15, 6, 1, COLORS.teeth);
  pixel(ctx, 8, 16, 5, 1, COLORS.lip);
}

function drawNumber(ctx) {
  const startX = Math.floor((WIDTH - NUMBER[0].length) / 2);
  NUMBER.forEach((row, y) => {
    [...row].forEach((value, x) => {
      if (value === "X") pixel(ctx, startX + x, 23 + y, 1, 1, COLORS.blue);
    });
  });
}

function drawBody(ctx, { back, mode }) {
  const jacket = mode === "developer";

  pixel(ctx, 4, 28, 12, 2, COLORS.outline);
  pixel(ctx, 5, 30, 5, 7, COLORS.outline);
  pixel(ctx, 10, 30, 1, 7, COLORS.outline);
  pixel(ctx, 11, 30, 5, 7, COLORS.outline);
  pixel(ctx, 5, 30, 4, 7, COLORS.pants);
  pixel(ctx, 6, 30, 1, 6, COLORS.pants);
  pixel(ctx, 11, 30, 4, 7, COLORS.pants);
  pixel(ctx, 13, 31, 1, 2, COLORS.pantsShade);

  pixel(ctx, 2, 20, 16, 9, jacket ? COLORS.jacket : COLORS.shirtShade);
  pixel(ctx, 1, 21, 4, 7, jacket ? COLORS.jacketShade : COLORS.shirtShade);
  pixel(ctx, 15, 21, 4, 7, jacket ? COLORS.jacketDark : COLORS.shirtShade);
  pixel(ctx, 1, 28, 3, 2, COLORS.skin);
  pixel(ctx, 16, 28, 2, 2, COLORS.skin);
  pixel(ctx, 4, 21, 12, 7, jacket ? COLORS.jacket : COLORS.shirt);

  if (jacket) {
    pixel(ctx, 8, 21, 5, 7, COLORS.shirt);
    pixel(ctx, 7, 21, 2, 5, COLORS.jacketShade);
    pixel(ctx, 12, 21, 2, 5, COLORS.jacketDark);
    pixel(ctx, 4, 22, 1, 5, COLORS.jacketShade);
    pixel(ctx, 15, 22, 1, 5, COLORS.jacketShade);
  } else if (!back) {
    drawNumber(ctx);
  } else {
    pixel(ctx, 9, 22, 3, 5, COLORS.shirtShade);
  }

  pixel(ctx, 8, 17, 5, 4, COLORS.skin);
  pixel(ctx, 8, 19, 5, 2, jacket ? COLORS.jacketShade : COLORS.shirtShade);
  pixel(ctx, 4, 36, 6, 3, COLORS.outline);
  pixel(ctx, 11, 36, 6, 3, COLORS.outline);
  pixel(ctx, 4, 36, 6, 2, COLORS.shoes);
  pixel(ctx, 11, 36, 6, 2, COLORS.shoes);
  pixel(ctx, 4, 39, 6, 1, COLORS.outline);
  pixel(ctx, 11, 39, 6, 1, COLORS.outline);
}

function directionFor(angle) {
  const index = Math.round(angle / 45) % 8;
  return {
    index,
    back: index >= 3 && index <= 5,
    profile: index === 2 || index === 6,
    mirrored: index >= 5,
    scale: [1, 0.82, 0.62, 0.82, 1, 0.82, 0.62, 0.82][index]
  };
}

export function initAboutAvatar({
  canvas,
  rotationInput,
  angleOutput,
  initialMode = "creative"
} = {}) {
  if (!canvas || !rotationInput || !angleOutput) {
    throw new Error("Os elementos da miniatura 360° não foram encontrados.");
  }

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Não foi possível iniciar o canvas da miniatura.");
  ctx.imageSmoothingEnabled = false;

  let angle = 0;
  let mode = initialMode;
  let pointerX = null;

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const direction = directionFor(angle);
    ctx.save();
    ctx.translate(CENTER_X, 0);
    ctx.scale(direction.mirrored ? -direction.scale : direction.scale, 1);
    ctx.translate(-CENTER_X, 0);
    drawBody(ctx, { ...direction, mode });
    drawHead(ctx, direction);
    ctx.restore();

    angleOutput.value = `${angle}°`;
    angleOutput.textContent = `${angle}°`;
    canvas.setAttribute(
      "aria-label",
      `Miniatura pixel art de corpo inteiro, ${DIRECTIONS[direction.index]}, ${angle} graus`
    );
  }

  function setAngle(value) {
    angle = ((Math.round(value) % 360) + 360) % 360;
    rotationInput.value = String(angle);
    draw();
  }

  function onInput() {
    setAngle(Number(rotationInput.value));
  }

  function onPointerDown(event) {
    pointerX = event.clientX;
    canvas.setPointerCapture(event.pointerId);
    canvas.classList.add("is-dragging");
  }

  function onPointerMove(event) {
    if (pointerX === null) return;
    const delta = event.clientX - pointerX;
    pointerX = event.clientX;
    if (delta) setAngle(angle + delta * 2);
  }

  function onPointerUp() {
    pointerX = null;
    canvas.classList.remove("is-dragging");
  }

  rotationInput.addEventListener("input", onInput);
  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointercancel", onPointerUp);
  setAngle(0);

  return {
    setMode(nextMode) {
      mode = nextMode;
      draw();
    },
    destroy() {
      rotationInput.removeEventListener("input", onInput);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
    }
  };
}
