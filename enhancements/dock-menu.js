/* ============================================================
   Dock → arcade menu
   The existing dock items keep their handlers; they are wrapped
   in a panel that becomes a labelled menu after the page scrolls.
   ============================================================ */

export function createDockMenu({
  dock = null,
  audio = null,
  scrollThreshold = 90,
  onOpen = null,
  onClose = null
} = {}) {
  if (!dock) return null;

  const items = Array.from(dock.querySelectorAll(".dock__item"));
  if (!items.length) return null;

  const panel = document.createElement("div");
  panel.className = "dock-menu__panel";
  panel.id = "dockMenuPanel";
  panel.setAttribute("aria-label", "Menu de ferramentas");
  panel.setAttribute("role", "navigation");

  items.forEach((item) => {
    const label = item.getAttribute("aria-label") || item.getAttribute("title") || "Ferramenta";
    item.dataset.dockLabel = label;
    const text = document.createElement("span");
    text.className = "dock__label";
    text.textContent = label;
    item.appendChild(text);
    panel.appendChild(item);
  });

  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "dock-menu__toggle";
  toggle.setAttribute("aria-expanded", "false");
  toggle.setAttribute("aria-controls", panel.id);
  toggle.setAttribute("aria-label", "Abrir menu de ferramentas");
  toggle.innerHTML = `
    <span class="dock-menu__glyph" aria-hidden="true">
      <i></i><i></i><i></i><i></i>
    </span>
    <span class="dock-menu__word">MENU</span>
  `;

  dock.append(panel, toggle);

  let menuMode = false;
  let open = false;
  let lastScroll = -1;

  function setOpen(next) {
    open = Boolean(next) && menuMode;
    dock.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.setAttribute("aria-label", open ? "Fechar menu de ferramentas" : "Abrir menu de ferramentas");
    if (open) onOpen?.(); else onClose?.();
  }

  function setMenuMode(next) {
    if (menuMode === next) return;
    menuMode = next;
    dock.classList.toggle("is-menu", menuMode);
    if (!menuMode) setOpen(false);
  }

  function measure() {
    const y = window.scrollY || document.documentElement.scrollTop || 0;
    if (Math.abs(y - lastScroll) < 4) return;
    lastScroll = y;
    setMenuMode(y > scrollThreshold);
  }

  let raf = 0;
  function onScroll() {
    if (raf) return;
    raf = window.requestAnimationFrame(() => {
      raf = 0;
      measure();
    });
  }

  toggle.addEventListener("click", () => {
    if (!menuMode) return;
    audio?.click?.();
    setOpen(!open);
  });

  items.forEach((item) => {
    item.addEventListener("pointerenter", () => {
      if (open) audio?.hover?.();
    }, { passive: true });
    item.addEventListener("click", () => {
      if (menuMode) window.setTimeout(() => setOpen(false), 60);
    });
  });

  function onKey(event) {
    if (event.key === "Escape" && open) {
      setOpen(false);
      toggle.focus();
    }
  }

  function onOutside(event) {
    if (!open) return;
    if (dock.contains(event.target)) return;
    setOpen(false);
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("keydown", onKey);
  document.addEventListener("pointerdown", onOutside, { passive: true });
  measure();

  return {
    panel,
    toggle,
    setOpen,
    setMenuMode,
    isOpen: () => open,
    isMenuMode: () => menuMode,
    destroy() {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onOutside);
      if (raf) window.cancelAnimationFrame(raf);
    }
  };
}
