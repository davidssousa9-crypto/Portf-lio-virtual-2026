import { logoSVG } from "./pixel-art.js";

/* Builds the layered SVG logo:
   base (ink + outline + hard shadow), two chromatic glitch ghosts,
   and empty band / cell overlays used by the glitch pass. */
export function renderLogo(mount, { text, colors }) {
  if (!mount) return null;

  mount.replaceChildren();

  const base = document.createElement("span");
  base.className = "logo__base";
  base.innerHTML = logoSVG(text, {
    fill: "currentColor",
    layers: true,
    shadowColor: colors.logoShadow,
    outlineColor: colors.bg
  });

  const cyan = document.createElement("span");
  cyan.className = "logo__ghost logo__ghost--cyan";
  cyan.setAttribute("aria-hidden", "true");
  cyan.innerHTML = logoSVG(text, {
    fill: colors.cyan,
    layers: false
  });

  const magenta = document.createElement("span");
  magenta.className = "logo__ghost logo__ghost--magenta";
  magenta.setAttribute("aria-hidden", "true");
  magenta.innerHTML = logoSVG(text, {
    fill: colors.magenta,
    layers: false
  });

  const bands = document.createElement("span");
  bands.className = "logo__bands";
  bands.setAttribute("aria-hidden", "true");

  const cells = document.createElement("span");
  cells.className = "logo__cells";
  cells.setAttribute("aria-hidden", "true");

  mount.append(base, cyan, magenta, bands, cells);

  return { base, cyan, magenta, bands, cells };
}
