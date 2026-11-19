/* ============================================================
   MAIN.JS — boot, config application, mode switching, dialogs.
   Edit copy, colours, links and sections in src/config.js.
   ============================================================ */

import { CONFIG } from "./src/config.js";
import { createAudio } from "./audio.js";
import { createCharacter } from "./character.js";
import { createPacNav } from "./pacnav.js";
import { createTopNav } from "./topnav.js";
import { glitchText, glitchLogo, spawnConfetti } from "./glitch.js";
import { renderLogo } from "./src/logo.js";
import { ICONS, iconSVG, soundIconSVG } from "./src/pixel-art.js";
import { initSections } from "./sections.js";
import { initLoader } from "./loader/index.js";

/* ============================================================
   ENVIRONMENT
   ============================================================ */
const root = document.documentElement;
const reducedQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
let reduced = reducedQuery.matches;

document.documentElement.classList.add("js");

/* Additive boot loader: no-op when disabled or skipped. */
initLoader({ config: CONFIG, reducedMotion: reduced });

/* ============================================================
   SHARED TICKER — one RAF, paused when the tab is hidden
   ============================================================ */
function createTicker() {
  const subscribers = new Set();
  let raf = 0;
  let running = false;
  let last = performance.now();

  const frame = (now) => {
    if (document.hidden) {
      running = false;
      raf = 0;
      return;
    }
    const dt = Math.min(64, now - last);
    last = now;
    subscribers.forEach((fn) => {
      try {
        fn(now, dt);
      } catch (error) {
        console.error("Ticker subscriber failed", error);
      }
    });
    raf = requestAnimationFrame(frame);
  };

  const start = () => {
    if (running || document.hidden) return;
    running = true;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  };

  const stop = () => {
    running = false;
    cancelAnimationFrame(raf);
    raf = 0;
  };

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
    else start();
  });

  return {
    add(fn) {
      subscribers.add(fn);
      start();
      return () => subscribers.delete(fn);
    },
    start,
    stop
  };
}

/* ============================================================
   AUDIO + LIVE REGION
   ============================================================ */
const ticker = createTicker();
const audio = createAudio({
  volume: CONFIG.audio.volume,
  mutedByDefault: CONFIG.audio.mutedByDefault,
  storageKey: CONFIG.storage.sound,
  config: CONFIG.audio
});
const liveRegion = document.getElementById("liveRegion");
let announceTimer = 0;

function announce(message) {
  if (!liveRegion) return;
  window.clearTimeout(announceTimer);
  liveRegion.textContent = "";
  announceTimer = window.setTimeout(() => {
    liveRegion.textContent = message;
  }, 40);
}

/* ============================================================
   CONFIG → DOM
   ============================================================ */
function applyTokens() {
  const colors = CONFIG.colors;
  const tokens = {
    bg: colors.bg,
    ink: colors.ink,
    text: colors.ink,
    lime: colors.lime,
    "lime-logo": colors.limeLogo,
    gold: colors.gold,
    yellow: colors.gold,
    cyan: colors.cyan,
    purple: colors.purple,
    orange: colors.orange,
    magenta: colors.magenta,
    blue: colors.blue,
    red: colors.red,
    "logo-shadow": colors.logoShadow
  };

  Object.entries(tokens).forEach(([key, value]) => {
    root.style.setProperty(`--${key}`, value);
  });

  root.style.setProperty("--font-body", CONFIG.fonts.body);
  root.style.setProperty("--font-display", CONFIG.fonts.display);
  root.style.setProperty("--font-pixel", CONFIG.fonts.pixel);

  const theme = document.querySelector('meta[name="theme-color"]');
  if (theme) theme.setAttribute("content", colors.bg);

  const description = document.querySelector('meta[name="description"]');
  if (description) description.setAttribute("content", CONFIG.meta.description);
  document.title = CONFIG.meta.title;
}

let logoParts = null;

function applyLogo() {
  const logo = document.getElementById("logo");
  const mount = document.getElementById("logoMount");
  if (logo) logo.setAttribute("aria-label", CONFIG.logo.ariaLabel);
  logoParts = renderLogo(mount, {
    text: CONFIG.logo.text,
    colors: CONFIG.colors
  });
}

function applyHero() {
  const title = document.getElementById("heroTitle");
  if (title) {
    const lines = CONFIG.hero.lines;
    const nodes = lines.map((line, index) => {
      const span = document.createElement("span");
      span.className = "hero__line";
      if (index === 0 && line.length) {
        const first = document.createElement("span");
        first.className = "hero__initial";
        first.id = "heroInitial";
        first.textContent = line[0];
        span.append(first, document.createTextNode(line.slice(1)));
      } else {
        span.textContent = line;
      }
      return span;
    });
    title.replaceChildren(...nodes);
  }

  const subtitle = document.getElementById("heroSubtitle");
  if (subtitle) {
    subtitle.replaceChildren(
      ...CONFIG.hero.subtitleLines.map((line) => {
        const span = document.createElement("span");
        span.className = "hero__subline";
        span.textContent = line;
        return span;
      })
    );
  }

  const canvas = document.getElementById("characterCanvas");
  if (canvas) canvas.setAttribute("aria-label", CONFIG.hero.characterAria);
}

function applyCopy() {
  Object.entries(CONFIG.copy).forEach(([id, copy]) => {
    const section = document.getElementById(id);
    if (!section) return;

    const kicker = section.querySelector(".kicker");
    if (kicker && copy.kicker) {
      const dot = document.createElement("span");
      dot.className = "kicker__dot";
      dot.setAttribute("aria-hidden", "true");
      kicker.replaceChildren(dot, document.createTextNode(` ${copy.kicker}`));
    }

    const title = section.querySelector("h2");
    if (title && copy.title) {
      title.replaceChildren();
      if (Array.isArray(copy.title)) {
        copy.title.forEach((line, index) => {
          if (index) title.appendChild(document.createElement("br"));
          title.appendChild(document.createTextNode(line));
        });
      } else {
        title.textContent = copy.title;
      }
    }

    const lead = section.querySelector(".lead");
    if (lead && copy.lead) lead.textContent = copy.lead;
    const body = section.querySelector(".body");
    if (body && copy.body) body.textContent = copy.body;
  });

  const dialogTitle = document.getElementById("contactDialogTitle");
  if (dialogTitle) dialogTitle.textContent = CONFIG.contact.dialogTitle;

  const intro = document.querySelector(".win-dialog__intro");
  if (intro) {
    const parts = CONFIG.contact.intro.split("*");
    intro.replaceChildren();
    parts.forEach((part, index) => {
      if (index > 0) {
        const star = document.createElement("span");
        star.className = "lime";
        star.textContent = "*";
        intro.append(star);
      }
      intro.append(document.createTextNode(part));
    });
  }

  const successTitle = document.querySelector(".form-success__title");
  if (successTitle) successTitle.textContent = CONFIG.contact.successTitle;
  const successText = document.querySelector(
    "#formSuccess p:not(.form-success__title)"
  );
  if (successText) successText.textContent = CONFIG.contact.successText;
  const successButton = document.querySelector(
    "#formSuccess [data-close-contact]"
  );
  if (successButton) successButton.textContent = CONFIG.contact.successButton;

  const playerBase = document.getElementById("playerBase");
  if (playerBase) playerBase.textContent = CONFIG.location.city;

  const clock = document.querySelector(".world__time");
  if (clock) {
    const time = clock.querySelector("#localTime");
    const dot = clock.querySelector(".dot-live");
    clock.textContent = "";
    if (dot) clock.appendChild(dot);
    clock.append(document.createTextNode(` ${CONFIG.location.city} `));
    const cityTime = document.createElement("b");
    cityTime.id = "localTime";
    cityTime.textContent = time?.textContent || "--:--";
    clock.appendChild(cityTime);
  }
}

function applySocials() {
  document.querySelectorAll("[data-social]").forEach((link) => {
    const network = link.dataset.social;
    const target = CONFIG.socials[network];
    if (!target) return;
    if (network === "email") {
      link.href = target.startsWith("mailto:") ? target : `mailto:${target}`;
      return;
    }
    link.href = target;
  });
}

/* ============================================================
   MODE SWITCH
   ============================================================ */
const heroStage = document.getElementById("heroStage");
const logo = document.getElementById("logo");
const modeSwitch = document.getElementById("modeSwitch");
const modeMarker = document.getElementById("modeMarker");
const aboutMode = document.getElementById("aboutMode");

let modeButtons = [];
let character = null;
let pacnav = null;
let topnav = null;
let sections = null;
let modeLockUntil = 0;
let mode = readMode();

function readMode() {
  const valid = CONFIG.hero.modes.map((item) => item.id);
  try {
    const stored = window.localStorage.getItem(CONFIG.storage.mode);
    if (valid.includes(stored)) return stored;
  } catch {
    /* storage can be blocked; the configured default wins */
  }
  return valid.includes(CONFIG.hero.defaultMode)
    ? CONFIG.hero.defaultMode
    : valid[0];
}

function persistMode(next) {
  try {
    window.localStorage.setItem(CONFIG.storage.mode, next);
  } catch {
    /* persistence is a nice-to-have */
  }
}

function buildModeSwitch() {
  if (!modeSwitch) return;
  modeSwitch.querySelectorAll(".mode-btn").forEach((button) => button.remove());

  CONFIG.hero.modes.forEach((item) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "mode-btn";
    button.dataset.mode = item.id;
    button.textContent = item.label;
    button.setAttribute("aria-pressed", "false");
    button.addEventListener("click", () => setMode(item.id));
    button.addEventListener("pointerenter", () => audio.hover(), {
      passive: true
    });
    modeSwitch.appendChild(button);
  });

  modeButtons = Array.from(modeSwitch.querySelectorAll(".mode-btn"));
}

function positionMarker() {
  if (!modeMarker) return;
  const active = modeButtons.find((button) => button.dataset.mode === mode);
  if (!active) return;
  const markerHeight = modeMarker.getBoundingClientRect().height || 36;
  const offset = active.offsetTop + (active.offsetHeight - markerHeight) / 2;
  modeMarker.style.setProperty("--marker-y", `${offset.toFixed(2)}px`);
}

function updateModeUI() {
  modeButtons.forEach((button) => {
    const active = button.dataset.mode === mode;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", active ? "true" : "false");
  });
  const activeMode = CONFIG.hero.modes.find((item) => item.id === mode);
  if (aboutMode) aboutMode.textContent = activeMode?.cardLabel || mode.toUpperCase();
  requestAnimationFrame(positionMarker);
}

function setMode(next, { instant = false } = {}) {
  const valid = CONFIG.hero.modes.some((item) => item.id === next);
  if (!valid || next === mode) return;

  const now = performance.now();
  if (!instant && now < modeLockUntil) return;
  if (!instant) modeLockUntil = now + CONFIG.timings.modeLock;

  const animated = !instant && !reduced;
  character?.setMode(next, { instant: !animated });
  mode = next;
  persistMode(mode);
  updateModeUI();

  if (animated) {
    audio.modeSwitch();

    const initial = document.getElementById("heroInitial");
    if (initial) {
      glitchText(initial, {
        duration: CONFIG.timings.glitchDuration,
        colors: CONFIG.colors
      });
    }
    if (logo) {
      glitchLogo(logo, {
        duration: CONFIG.timings.glitchDuration,
        colors: CONFIG.colors
      });
    }

    if (heroStage) {
      const rect = heroStage.getBoundingClientRect();
      spawnConfetti(heroStage, {
        count: 18,
        colors: [
          CONFIG.colors.lime,
          CONFIG.colors.gold,
          CONFIG.colors.cyan,
          CONFIG.colors.magenta,
          CONFIG.colors.purple,
          CONFIG.colors.orange
        ],
        origin: { x: rect.width * 0.5, y: rect.height * 0.48 },
        spread: Math.max(150, rect.width * 0.34),
        cell: 10,
        duration: 700
      });

      heroStage.classList.remove("is-flipping");
      void heroStage.offsetWidth;
      heroStage.classList.add("is-flipping");
      window.setTimeout(
        () => heroStage.classList.remove("is-flipping"),
        CONFIG.timings.modeFlip + 80
      );
    }
  } else {
    audio.click();
  }

  const activeMode = CONFIG.hero.modes.find((item) => item.id === mode);
  announce(`${activeMode?.label || mode} ativo.`);
}

/* ============================================================
   LEFT TOOLBAR
   ============================================================ */
let soundToggle = null;

function buildDock() {
  const dock = document.getElementById("dock");
  if (!dock) return;

  dock.replaceChildren();

  CONFIG.toolbar.items.forEach((item) => {
    const isSound = item.id === "sound";
    const node = document.createElement(isSound ? "button" : "a");
    node.className = "dock__item";
    node.dataset.dock = item.id;
    node.title = item.ariaLabel;
    node.setAttribute("aria-label", item.ariaLabel);

    if (isSound) {
      node.type = "button";
      node.id = "soundToggle";
      node.setAttribute("aria-pressed", "false");
      node.innerHTML = soundIconSVG({
        unit: CONFIG.toolbar.iconUnit,
        color: "currentColor"
      });
    } else {
      if (item.href) node.href = item.href;
      if (item.action === "contact") node.dataset.openContact = "";
      node.innerHTML = iconSVG(ICONS[item.icon], {
        unit: CONFIG.toolbar.iconUnit,
        color: "currentColor"
      });
    }

    node.addEventListener("pointerenter", () => audio.hover(), {
      passive: true
    });

    if (!isSound && item.action !== "contact") {
      node.addEventListener("click", () => audio.click());
    }

    dock.appendChild(node);
  });

  soundToggle = document.getElementById("soundToggle");
  soundToggle?.addEventListener("click", () => {
    const enabled = audio.toggle();
    updateSoundUI();
    announce(enabled ? "Som ativado." : "Som desativado.");
  });
}

function updateSoundUI() {
  if (!soundToggle) return;
  const enabled = audio.isEnabled();
  soundToggle.classList.toggle("is-muted", !enabled);
  soundToggle.setAttribute("aria-pressed", enabled ? "true" : "false");
  soundToggle.title = CONFIG.toolbar.items[0]?.ariaLabel || "Som";
}

/* ============================================================
   LOGO GLITCH
   ============================================================ */
let logoHoverAt = 0;

logo?.addEventListener("pointerenter", () => {
  audio.hover();
  if (reduced) return;
  const now = performance.now();
  if (now - logoHoverAt < CONFIG.timings.logoHoverCooldown) return;
  logoHoverAt = now;
  glitchLogo(logo, {
    duration: CONFIG.timings.glitchDuration,
    colors: CONFIG.colors
  });
});

logo?.addEventListener("click", () => audio.back());

/* ============================================================
   CONTACT DIALOG
   ============================================================ */
const contactDialog = document.getElementById("contactDialog");
const contactForm = document.getElementById("contactForm");
const formSuccess = document.getElementById("formSuccess");
let submitTimer = 0;
let submitToken = 0;

function focusableIn(dialog) {
  return Array.from(
    dialog.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  ).filter(
    (node) => node.getClientRects().length > 0 && !node.closest("[hidden]")
  );
}

function trapFocus(dialog) {
  if (!dialog) return;
  dialog.addEventListener("keydown", (event) => {
    if (event.key !== "Tab") return;
    const focusables = focusableIn(dialog);
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
}

function lockScroll() {
  document.body.classList.add("has-dialog");
}

function unlockScroll() {
  if (!contactDialog?.open) document.body.classList.remove("has-dialog");
}

function resetContactErrors() {
  contactForm?.querySelectorAll(".field__error").forEach((error) => {
    error.textContent = "";
  });
  contactForm?.querySelectorAll("[aria-invalid]").forEach((field) => {
    field.removeAttribute("aria-invalid");
  });
}

function resetContactDialog() {
  window.clearTimeout(submitTimer);
  submitToken += 1;
  contactForm?.reset();
  resetContactErrors();
  if (contactForm) contactForm.hidden = false;
  if (formSuccess) formSuccess.hidden = true;
  const submit = contactForm?.querySelector('button[type="submit"]');
  if (submit) {
    submit.disabled = false;
    submit.removeAttribute("aria-busy");
  }
}

function openContact() {
  if (!contactDialog) return;
  resetContactDialog();
  audio.click();
  if (typeof contactDialog.showModal === "function") contactDialog.showModal();
  else contactDialog.setAttribute("open", "");
  lockScroll();
  window.setTimeout(() => {
    document.getElementById("fieldName")?.focus({ preventScroll: true });
  }, 40);
  announce("Formulário de contato aberto.");
}

function closeContact() {
  if (!contactDialog) return;
  if (contactDialog.open) contactDialog.close();
  else contactDialog.removeAttribute("open");
  unlockScroll();
}

function setError(field, message) {
  if (!field) return false;
  field.setAttribute("aria-invalid", "true");
  const errorMap = {
    fieldName: "errName",
    fieldEmail: "errEmail",
    fieldWebsite: "errWebsite",
    fieldMessage: "errMessage"
  };
  const error = document.getElementById(errorMap[field.id]);
  if (error) error.textContent = message;
  return false;
}

function clearError(field) {
  if (!field) return;
  field.removeAttribute("aria-invalid");
  const errorMap = {
    fieldName: "errName",
    fieldEmail: "errEmail",
    fieldWebsite: "errWebsite",
    fieldMessage: "errMessage"
  };
  const error = document.getElementById(errorMap[field.id]);
  if (error) error.textContent = "";
}

function validUrl(value) {
  try {
    const withProtocol = /^[a-z]+:\/\//i.test(value) ? value : `https://${value}`;
    const url = new URL(withProtocol);
    return Boolean(url.hostname && url.hostname.includes("."));
  } catch {
    return false;
  }
}

function validateContact() {
  const name = document.getElementById("fieldName");
  const email = document.getElementById("fieldEmail");
  const website = document.getElementById("fieldWebsite");
  const message = document.getElementById("fieldMessage");
  let firstInvalid = null;

  const fail = (field, msg) => {
    if (!field) return;
    setError(field, msg);
    if (!firstInvalid) firstInvalid = field;
  };

  if (!name?.value.trim() || name.value.trim().length < 2) {
    fail(name, "Me diga seu nome — mínimo de dois caracteres.");
  }
  if (!email?.value.trim()) {
    fail(email, "Um endereço de e-mail é obrigatório.");
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) {
    fail(email, "Esse e-mail não parece válido. Verifique o formato.");
  }
  if (website?.value.trim() && !validUrl(website.value.trim())) {
    fail(website, "Use uma URL válida, por exemplo https://estudio.com.");
  }
  if (!message?.value.trim() || message.value.trim().length < 10) {
    fail(message, "Escreva uma ou duas frases — pelo menos 10 caracteres.");
  }

  if (firstInvalid) {
    firstInvalid.focus({ preventScroll: false });
    audio.error();
    announce("O formulário tem erros. Verifique os campos destacados.");
    return false;
  }
  return true;
}

contactForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!validateContact()) return;

  const submit = contactForm.querySelector('button[type="submit"]');
  if (submit) {
    submit.disabled = true;
    submit.setAttribute("aria-busy", "true");
  }
  const token = ++submitToken;
  submitTimer = window.setTimeout(() => {
    if (token !== submitToken || !contactDialog?.open) return;
    contactForm.hidden = true;
    if (formSuccess) formSuccess.hidden = false;
    if (submit) {
      submit.disabled = false;
      submit.removeAttribute("aria-busy");
    }
    audio.success();
    announce("Mensagem validada e enviada. Obrigado.");
    window.setTimeout(() => {
      formSuccess
        ?.querySelector("[data-close-contact]")
        ?.focus({ preventScroll: true });
    }, 30);
  }, CONFIG.timings.contactDelay);
});

contactForm?.querySelectorAll("input, textarea").forEach((field) => {
  field.addEventListener("input", () => clearError(field));
});

contactDialog?.addEventListener("click", (event) => {
  if (event.target.closest("[data-close-contact]")) {
    event.preventDefault();
    closeContact();
  }
});
contactDialog?.addEventListener("close", () => {
  unlockScroll();
  submitToken += 1;
  window.clearTimeout(submitTimer);
});
trapFocus(contactDialog);

document.addEventListener("click", (event) => {
  const opener = event.target.closest("[data-open-contact]");
  if (!opener) return;
  event.preventDefault();
  openContact();
});

/* ============================================================
   REDUCED MOTION
   ============================================================ */
function applyReducedMotion(value) {
  reduced = Boolean(value);
  character?.setReducedMotion(reduced);
  pacnav?.setReducedMotion(reduced);
  sections?.setReducedMotion(reduced);
  root.classList.toggle("is-reduced", reduced);
}

const onReducedChange = (event) => applyReducedMotion(event.matches);
if (typeof reducedQuery.addEventListener === "function") {
  reducedQuery.addEventListener("change", onReducedChange);
} else if (typeof reducedQuery.addListener === "function") {
  reducedQuery.addListener(onReducedChange);
}

/* ============================================================
   BOOT
   ============================================================ */
applyTokens();
applyLogo();
applyHero();
applyCopy();
applySocials();
buildModeSwitch();
buildDock();

topnav = createTopNav({
  mount: document.getElementById("topNav"),
  items: CONFIG.nav.items,
  sections: CONFIG.sections,
  cta: CONFIG.nav.cta,
  menuTitle: CONFIG.nav.menuTitle,
  audio,
  onNavigate: (item) => announce(`Navegando para ${item.label}.`)
});

character = createCharacter({
  canvas: document.getElementById("characterCanvas"),
  stage: heroStage,
  hero: document.getElementById("hero"),
  config: CONFIG,
  audio,
  reducedMotion: reduced,
  initialMode: mode
});

pacnav = createPacNav({
  mount: document.getElementById("pacNav"),
  sections: CONFIG.sections,
  audio,
  reducedMotion: reduced,
  timings: CONFIG.timings,
  onNavigate: (section) => announce(`Indo para a seção ${section.label}.`)
});

sections = initSections({
  config: CONFIG,
  ticker,
  audio,
  reducedMotion: reduced,
  announce
});

applyReducedMotion(reduced);
updateModeUI();
updateSoundUI();
positionMarker();
window.addEventListener("resize", positionMarker, { passive: true });
document.fonts?.ready.then(() => {
  positionMarker();
  pacnav?.measure();
  topnav?.measure();
});

/* shared character loop */
ticker.add((now) => character?.update(now));

/* additive enhancement layer: speech bubbles, dock menu, character lab */
import("./enhancements/index.js")
  .then(({ initEnhancements }) =>
    initEnhancements({
      config: CONFIG,
      audio,
      character,
      reducedMotion: reduced
    })
  )
  .catch((error) => console.warn("[enhancements]", error));


/* intro glitch, once the first paint has settled */
if (!reduced) {
  window.setTimeout(() => {
    if (document.hidden) return;
    const initial = document.getElementById("heroInitial");
    if (initial) {
      glitchText(initial, {
        duration: CONFIG.timings.glitchDuration,
        colors: CONFIG.colors
      });
    }
    if (logo) {
      glitchLogo(logo, {
        duration: CONFIG.timings.glitchDuration,
        colors: CONFIG.colors
      });
    }
  }, CONFIG.timings.loadGlitchDelay);
}

window.addEventListener("pagehide", () => ticker.stop());
