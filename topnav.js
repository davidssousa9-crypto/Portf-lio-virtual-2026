/* ============================================================
   TOPNAV.JS — fixed arcade HUD navigation.
   Builds the primary links and the mobile NAVIGATION.SYS panel,
   tracks the active section, and paints the scroll progress line.
   ============================================================ */

const pad2 = (value) => String(value).padStart(2, "0");

export function createTopNav({
  mount,
  items = [],
  sections = [],
  cta = null,
  menuTitle = "NAVEGACAO.SYS",
  audio = null,
  onNavigate = null
} = {}) {
  if (!mount) return null;

  const controller = new AbortController();
  const { signal } = controller;

  const linksMount = mount.querySelector("#topNavLinks");
  const menuMount = mount.querySelector("#topNavMenu");
  const toggle = mount.querySelector("#topNavToggle");
  const toggleLabel = toggle?.querySelector(".topnav__toggle-label");
  const levelValue = mount.querySelector("#topNavLevelValue");
  const levelTotal = mount.querySelector("#topNavLevelTotal");
  const progress = mount.querySelector("#topNavProgress");
  const desktopCta = mount.querySelector(".topnav__cta");
  const desktopCtaLabel = desktopCta?.querySelector(".topnav__cta-label");

  const entries = items
    .map((item) => {
      if (item.href) {
        return { ...item, index: -1, level: item.level || "★", external: true };
      }
      const index = sections.findIndex((section) => section.id === item.id);
      if (index < 0) return null;
      return { ...item, index, level: pad2(index + 1) };
    })
    .filter(Boolean);

  let activeId = "";
  let sectionTops = [];
  let menuOpen = false;
  let scrollRaf = 0;
  let resizeRaf = 0;

  if (levelTotal) levelTotal.textContent = String(sections.length);

  if (cta && desktopCta) {
    desktopCta.href = cta.href || "#cta";
    if (desktopCtaLabel) desktopCtaLabel.textContent = cta.label || "Contato";
  }

  function handleNavigate(entry) {
    audio?.click?.();
    onNavigate?.(entry);
    closeMenu({ focusToggle: true });
  }

  function createDesktopLink(entry) {
    const link = document.createElement("a");
    link.className = "topnav__link";
    link.href = entry.href || `#${entry.id}`;
    if (!entry.external) link.dataset.navId = entry.id;

    const mark = document.createElement("span");
    mark.className = "topnav__link-mark";
    mark.setAttribute("aria-hidden", "true");
    link.append(mark, document.createTextNode(entry.label));

    link.addEventListener("pointerenter", () => audio?.hover?.(), {
      passive: true,
      signal
    });
    link.addEventListener("click", () => handleNavigate(entry), { signal });
    return link;
  }

  function createMenuLink(entry) {
    const link = document.createElement("a");
    link.className = "topnav-menu__link";
    link.href = entry.href || `#${entry.id}`;
    if (!entry.external) link.dataset.navId = entry.id;

    const index = document.createElement("span");
    index.className = "topnav-menu__idx";
    index.setAttribute("aria-hidden", "true");
    index.textContent = entry.level;

    const label = document.createElement("span");
    label.className = "topnav-menu__label";
    label.textContent = entry.label;

    const arrow = document.createElement("span");
    arrow.className = "topnav-menu__arrow";
    arrow.setAttribute("aria-hidden", "true");
    arrow.textContent = "▶";

    link.append(index, label, arrow);
    link.addEventListener("pointerenter", () => audio?.hover?.(), {
      passive: true,
      signal
    });
    link.addEventListener("click", () => handleNavigate(entry), { signal });
    return link;
  }

  if (linksMount) {
    linksMount.replaceChildren(...entries.map(createDesktopLink));
  }

  if (menuMount) {
    const windowNode = document.createElement("div");
    windowNode.className = "topnav-menu__window";

    const bar = document.createElement("div");
    bar.className = "win__bar topnav-menu__bar";

    const title = document.createElement("span");
    title.className = "win__title";
    const icon = document.createElement("i");
    icon.className = "win__icon win__icon--lime";
    icon.setAttribute("aria-hidden", "true");
    title.append(icon, document.createTextNode(menuTitle));

    const close = document.createElement("button");
    close.type = "button";
    close.className = "win__btn topnav-menu__close";
    close.setAttribute("aria-label", "Fechar menu de navegação");
    close.textContent = "×";
    close.addEventListener(
      "click",
      () => {
        audio?.back?.();
        closeMenu({ focusToggle: true });
      },
      { signal }
    );

    bar.append(title, close);

    const body = document.createElement("div");
    body.className = "topnav-menu__body";

    const nav = document.createElement("nav");
    nav.setAttribute("aria-label", "Navegação por seções");
    nav.append(...entries.map(createMenuLink));
    body.append(nav);

    if (cta) {
      const contact = document.createElement("a");
      contact.className = "pixel-btn pixel-btn--solid topnav-menu__cta";
      contact.href = cta.href || "#cta";
      contact.dataset.openContact = "";

      const contactLabel = document.createElement("span");
      contactLabel.textContent = cta.label || "Contato";

      const arrow = document.createElement("span");
      arrow.setAttribute("aria-hidden", "true");
      arrow.textContent = "▶";

      contact.append(contactLabel, arrow);
      contact.addEventListener("pointerenter", () => audio?.hover?.(), {
        passive: true,
        signal
      });
      contact.addEventListener("click", () => closeMenu(), { signal });
      body.append(contact);
    }

    const foot = document.createElement("div");
    foot.className = "topnav-menu__foot";

    const player = document.createElement("span");
    player.className = "topnav-menu__player";
    const led = document.createElement("i");
    led.setAttribute("aria-hidden", "true");
    player.append(led, document.createTextNode("P1 · PRONTO"));

    const hint = document.createElement("span");
    hint.textContent = "ESCOLHA UM NÍVEL";

    foot.append(player, hint);
    windowNode.append(bar, body, foot);
    menuMount.replaceChildren(windowNode);
  }

  desktopCta?.addEventListener("pointerenter", () => audio?.hover?.(), {
    passive: true,
    signal
  });

  function openMenu() {
    if (!menuMount || !toggle) return;
    menuOpen = true;
    menuMount.hidden = false;
    toggle.setAttribute("aria-expanded", "true");
    if (toggleLabel) toggleLabel.textContent = "Fechar";
    audio?.click?.();
  }

  function closeMenu({ focusToggle = false } = {}) {
    if (!menuMount || !toggle) return;
    const wasOpen = menuOpen || !menuMount.hidden;
    menuOpen = false;
    menuMount.hidden = true;
    toggle.setAttribute("aria-expanded", "false");
    if (toggleLabel) toggleLabel.textContent = "Menu";
    if (focusToggle && wasOpen) {
      requestAnimationFrame(() => toggle.focus({ preventScroll: true }));
    }
  }

  toggle?.addEventListener(
    "click",
    () => {
      if (menuOpen) {
        audio?.back?.();
        closeMenu({ focusToggle: true });
        return;
      }
      openMenu();
    },
    { signal }
  );

  function setActive(id) {
    if (id === activeId) return;
    activeId = id;
    mount.querySelectorAll("[data-nav-id]").forEach((link) => {
      const current = link.dataset.navId === id;
      link.classList.toggle("is-active", current);
      if (current) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  }

  function update() {
    if (!sections.length) return;

    const scrollY = window.scrollY || window.pageYOffset || 0;
    const scan = scrollY + window.innerHeight * 0.5;
    let index = 0;

    for (let i = 0; i < sectionTops.length; i += 1) {
      if (sectionTops[i] <= scan) index = i;
    }

    const current = sections[index];
    if (current) setActive(current.id);
    if (levelValue) levelValue.textContent = pad2(index + 1);

    if (progress) {
      const max = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight
      );
      const ratio = Math.min(1, Math.max(0, scrollY / max));
      progress.style.transform = `scaleX(${ratio.toFixed(4)})`;
    }
  }

  function measure() {
    const scrollY = window.scrollY || window.pageYOffset || 0;
    sectionTops = sections.map((section) => {
      if (section.id === "hero") return 0;
      const node = document.getElementById(section.id);
      return node ? node.getBoundingClientRect().top + scrollY : 0;
    });
    update();
  }

  const onScroll = () => {
    if (scrollRaf) return;
    scrollRaf = requestAnimationFrame(() => {
      scrollRaf = 0;
      update();
    });
  };

  const onResize = () => {
    if (resizeRaf) return;
    resizeRaf = requestAnimationFrame(() => {
      resizeRaf = 0;
      if (window.innerWidth > 900) closeMenu();
      measure();
    });
  };

  const onKeydown = (event) => {
    if (event.key === "Escape" && menuOpen) {
      audio?.back?.();
      closeMenu({ focusToggle: true });
    }
  };

  const onPointerDown = (event) => {
    if (menuOpen && !mount.contains(event.target)) closeMenu();
  };

  window.addEventListener("scroll", onScroll, { passive: true, signal });
  window.addEventListener("resize", onResize, { passive: true, signal });
  document.addEventListener("keydown", onKeydown, { signal });
  document.addEventListener("pointerdown", onPointerDown, { signal });

  measure();

  return {
    measure,
    closeMenu,
    destroy() {
      cancelAnimationFrame(scrollRaf);
      cancelAnimationFrame(resizeRaf);
      controller.abort();
      menuMount?.setAttribute("hidden", "");
    }
  };
}
