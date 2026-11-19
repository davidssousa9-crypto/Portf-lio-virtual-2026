/* ============================================================
   PACNAV.JS — Pac-Man section navigation.
   The marker travels to the active section, eats the pellets on
   the way down, restores them on the way up, and stops its RAF
   as soon as it settles.
   ============================================================ */

import { dotSVG, pacmanSVG } from "./src/pixel-art.js";

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export function createPacNav({
  mount,
  sections = [],
  audio = null,
  reducedMotion = false,
  onNavigate = null,
  timings = {}
} = {}) {
  if (!mount || !sections.length) return null;

  const controller = new AbortController();
  const { signal } = controller;
  const frameTime = timings.pacmanFrame || 125;
  const lerp = timings.navLerp || 0.24;

  let reduced = Boolean(reducedMotion);
  let destroyed = false;
  let viewportHeight = 0;
  let trackHeight = 0;
  let spacing = 60;
  let dotStart = 55;
  let dotSize = 16;
  let pacHeight = 50;
  let hitSize = 44;
  let dotCenters = [];
  let sectionTops = [];
  let buttons = [];
  let activeIndex = -1;
  let currentTop = 0;
  let targetTop = 0;
  let currentShift = 0;
  let targetShift = 0;
  let direction = 0;
  let raf = 0;
  let running = false;
  let lastNow = 0;
  let idleFrames = 0;
  let lastWaka = 0;
  let scrollRaf = 0;

  mount.classList.add("pacnav");
  mount.replaceChildren();

  const viewport = document.createElement("div");
  viewport.className = "pacnav__viewport";

  const track = document.createElement("div");
  track.className = "pacnav__track";

  const tip = document.createElement("div");
  tip.className = "pacnav__tip";
  tip.setAttribute("aria-hidden", "true");

  viewport.appendChild(track);
  mount.append(viewport, tip);

  const homeButton = document.createElement("button");
  homeButton.type = "button";
  homeButton.className = "pacnav__item pacman-item";
  homeButton.setAttribute("aria-label", "Ir para a seção Início");
  homeButton.innerHTML = `<span class="pacman-item__sprite">${pacmanSVG()}</span>`;
  track.appendChild(homeButton);

  const pacSprite = homeButton.querySelector(".pacman-svg");

  const showTip = (button, index) => {
    const buttonRect = button.getBoundingClientRect();
    const mountRect = mount.getBoundingClientRect();
    tip.textContent = sections[index]?.label || "";
    tip.style.top = `${buttonRect.top + buttonRect.height / 2 - mountRect.top}px`;
    tip.classList.add("is-visible");
  };

  const hideTip = () => tip.classList.remove("is-visible");

  const bindButton = (button, index) => {
    button.addEventListener("click", () => navigateTo(index), { signal });
    button.addEventListener(
      "pointerenter",
      () => {
        showTip(button, index);
        audio?.hover?.();
      },
      { passive: true, signal }
    );
    button.addEventListener("pointerleave", hideTip, { signal });
    button.addEventListener(
      "focus",
      () => {
        showTip(button, index);
        audio?.hover?.();
      },
      { signal }
    );
    button.addEventListener("blur", hideTip, { signal });
  };

  bindButton(homeButton, 0);
  buttons = [homeButton];

  sections.slice(1).forEach((section, offset) => {
    const index = offset + 1;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "pacnav__item pacdot";
    button.dataset.index = String(index);
    button.setAttribute("aria-label", `Ir para a seção ${section.label}`);
    button.innerHTML = `<span class="pacdot__sprite">${dotSVG({
      size: 16
    })}</span>`;
    track.appendChild(button);
    bindButton(button, index);
    buttons.push(button);
  });

  function navigateTo(index) {
    const section = sections[index];
    const node = section ? document.getElementById(section.id) : null;
    if (!node) return;
    audio?.click?.();
    onNavigate?.(section, index);
    const behavior = reduced ? "auto" : "smooth";
    if (index === 0) {
      window.scrollTo({ top: 0, behavior });
    } else {
      window.scrollTo({
        top: sectionTops[index] ?? node.offsetTop,
        behavior
      });
    }
  }

  function readMetrics() {
    const styles = getComputedStyle(mount);
    spacing = parseFloat(styles.getPropertyValue("--nav-spacing")) || 60;
    dotStart = parseFloat(styles.getPropertyValue("--nav-dot-start")) || 55;
    dotSize = parseFloat(styles.getPropertyValue("--nav-dot-size")) || 16;
    pacHeight = parseFloat(styles.getPropertyValue("--nav-pac-h")) || 50;
    hitSize = Math.max(
      dotSize + 16,
      parseFloat(styles.getPropertyValue("--nav-hit")) || 44
    );
    viewportHeight = viewport.clientHeight;
  }

  function measureSections() {
    const scrollY = window.scrollY || window.pageYOffset || 0;
    sectionTops = sections.map((section) => {
      if (section.id === "hero") return 0;
      const node = document.getElementById(section.id);
      if (!node) return 0;
      return node.getBoundingClientRect().top + scrollY;
    });
  }

  function measure() {
    readMetrics();
    if (!viewportHeight) return;

    const dotCount = Math.max(0, sections.length - 1);
    const lastDotTop = dotStart + spacing * Math.max(0, dotCount - 1);
    const lastPacTop = lastDotTop + dotSize / 2 - pacHeight / 2;
    trackHeight = Math.max(
      pacHeight,
      lastDotTop + dotSize + 8,
      lastPacTop + pacHeight + 8
    );
    track.style.height = `${trackHeight}px`;

    buttons.forEach((button, index) => {
      if (index === 0) {
        button.style.top = "0px";
        return;
      }
      const dotTop = dotStart + spacing * (index - 1);
      button.style.top = `${dotTop - (hitSize - dotSize) / 2}px`;
    });

    dotCenters = sections.slice(1).map((_, offset) => {
      const dotTop = dotStart + spacing * offset;
      return dotTop + dotSize / 2;
    });

    measureSections();
    const target = targetFor(activeIndex < 0 ? 0 : activeIndex);
    targetTop = target.top;
    targetShift = target.shift;
    currentTop = targetTop;
    currentShift = targetShift;
    paint();
  }

  function targetFor(index) {
    if (index <= 0 || !dotCenters.length) {
      return { top: 0, shift: 0 };
    }
    const center = dotCenters[Math.min(index - 1, dotCenters.length - 1)];
    const top = center - pacHeight / 2;
    const maxShift = Math.max(0, trackHeight - viewportHeight);
    const shift = clamp(top + pacHeight - viewportHeight + 8, 0, maxShift);
    return { top, shift };
  }

  function paint(moving = false) {
    track.style.transform = `translateY(${(-currentShift).toFixed(2)}px)`;
    homeButton.style.top = `${currentTop.toFixed(2)}px`;

    if (pacSprite) {
      pacSprite.style.transform =
        direction < 0 ? "rotate(180deg)" : "rotate(0deg)";
      pacSprite.dataset.frame =
        moving && !reduced
          ? String(Math.floor(performance.now() / frameTime) % 4)
          : "0";
    }

    const center = currentTop + pacHeight / 2;
    buttons.forEach((button, index) => {
      if (index === 0) return;
      const dotCenter = dotCenters[index - 1];
      const eaten = center >= dotCenter - 2;
      if (button.classList.contains("is-eaten") !== eaten) {
        button.classList.toggle("is-eaten", eaten);
      }
    });
  }

  function setActive(index) {
    if (index === activeIndex) return;
    activeIndex = index;
    buttons.forEach((button, buttonIndex) => {
      const current = buttonIndex === index;
      button.classList.toggle("is-active", current);
      if (current) button.setAttribute("aria-current", "true");
      else button.removeAttribute("aria-current");
    });

    const target = targetFor(index);
    targetTop = target.top;
    targetShift = target.shift;
    start();
  }

  function updateActive() {
    const scanY =
      (window.scrollY || window.pageYOffset || 0) + window.innerHeight * 0.5;
    let next = 0;
    for (let index = 0; index < sectionTops.length; index += 1) {
      if (sectionTops[index] <= scanY) next = index;
    }
    setActive(next);
  }

  function start() {
    if (reduced) {
      currentTop = targetTop;
      currentShift = targetShift;
      paint();
      return;
    }
    if (running || destroyed) return;
    running = true;
    idleFrames = 0;
    lastNow = performance.now();
    raf = requestAnimationFrame(step);
  }

  function step(now) {
    if (destroyed) return;
    const dt = Math.min(64, Math.max(0, now - lastNow));
    lastNow = now;
    const ease = 1 - Math.pow(1 - lerp, Math.max(0.5, dt / 16.67));

    currentTop += (targetTop - currentTop) * ease;
    currentShift += (targetShift - currentShift) * ease;

    const delta = targetTop - currentTop;
    const moving =
      Math.abs(delta) > 0.4 || Math.abs(targetShift - currentShift) > 0.4;

    if (!moving) {
      currentTop = targetTop;
      currentShift = targetShift;
    } else if (Math.abs(delta) > 0.8) {
      direction = delta > 0 ? 1 : -1;
    }

    paint(moving);

    if (moving) {
      idleFrames = 0;
      if (now - lastWaka > 150) {
        lastWaka = now;
        audio?.waka?.();
      }
    } else {
      idleFrames += 1;
      if (idleFrames > 1) {
        running = false;
        raf = 0;
        return;
      }
    }

    raf = requestAnimationFrame(step);
  }

  const onScroll = () => {
    if (scrollRaf) return;
    scrollRaf = requestAnimationFrame(() => {
      scrollRaf = 0;
      updateActive();
    });
  };

  const onResize = () => {
    measure();
    updateActive();
  };

  const onVisibility = () => {
    if (document.hidden) {
      cancelAnimationFrame(raf);
      raf = 0;
      running = false;
    } else if (
      Math.abs(targetTop - currentTop) > 0.4 ||
      Math.abs(targetShift - currentShift) > 0.4
    ) {
      start();
    }
  };

  window.addEventListener("scroll", onScroll, { passive: true, signal });
  window.addEventListener("resize", onResize, { passive: true, signal });
  document.addEventListener("visibilitychange", onVisibility, { signal });

  let resizeObserver = null;
  if ("ResizeObserver" in window) {
    resizeObserver = new ResizeObserver(() => {
      measure();
    });
    resizeObserver.observe(viewport);
  }

  measure();
  updateActive();
  currentTop = targetTop;
  currentShift = targetShift;
  paint();

  if (document.fonts?.ready) {
    document.fonts.ready.then(() => {
      if (!destroyed) {
        measure();
        updateActive();
      }
    });
  }

  return {
    measure,
    navigateTo,
    setReducedMotion(value) {
      reduced = Boolean(value);
      if (reduced) {
        currentTop = targetTop;
        currentShift = targetShift;
        paint();
      }
    },
    destroy() {
      destroyed = true;
      cancelAnimationFrame(raf);
      cancelAnimationFrame(scrollRaf);
      raf = 0;
      running = false;
      resizeObserver?.disconnect();
      controller.abort();
      mount.replaceChildren();
    }
  };
}
