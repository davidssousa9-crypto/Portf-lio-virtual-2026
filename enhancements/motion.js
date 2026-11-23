/* ============================================================
   MOTION — additive smooth scroll, hero entrance, reversible
   section reveals, stepped parallax, micro-interactions and
   page wipes. Everything is gated by CONFIG.features.transitions
   and by the user's reduced-motion preference.
   ============================================================ */

import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({ ignoreMobileResize: true });

const TRANSITION_KEY = "agrvai:page-transition";
const TRANSITION_MAX_AGE = 10_000;
const BAR_COUNT = 9;
const WIPE_MS = 520;
const STEP_EASE = "steps(6)";

function makeCurtain() {
  const curtain = document.createElement("div");
  curtain.className = "page-curtain";
  curtain.setAttribute("aria-hidden", "true");
  for (let index = 0; index < BAR_COUNT; index += 1) {
    const bar = document.createElement("span");
    bar.style.setProperty("--i", String(index));
    curtain.append(bar);
  }
  document.body.append(curtain);
  return curtain;
}

function isInternalPageLink(anchor, event) {
  if (!anchor || event.defaultPrevented) return false;
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;
  if (anchor.target && anchor.target !== "_self") return false;
  if (anchor.hasAttribute("download")) return false;
  if (anchor.dataset.noTransition !== undefined) return false;

  let url;
  try {
    url = new URL(anchor.href, window.location.href);
  } catch {
    return false;
  }
  if (url.origin !== window.location.origin) return false;
  if (url.hash && url.pathname === window.location.pathname && url.search === window.location.search) return false;
  if (url.href === window.location.href) return false;
  return /\.html?$/.test(url.pathname) || url.pathname.endsWith("/");
}

function sectionCopyNodes(section) {
  return section.querySelectorAll(".kicker, h2, .lead, .body");
}

function initHeroEntrance(cleanups) {
  const hero = document.getElementById("hero");
  if (!hero) return null;

  const lines = hero.querySelectorAll(".hero__line");
  const subtitle = hero.querySelectorAll(".hero__subline");
  const modeSwitch = document.getElementById("modeSwitch");
  const stage = document.getElementById("heroStage");
  const dock = document.getElementById("dock");
  const pacnav = document.getElementById("pacNav");
  const targets = [stage, ...lines, ...subtitle, modeSwitch, dock, pacnav].filter(Boolean);

  /* Hide before the loader lifts so the entrance never flashes. */
  gsap.set(lines, { yPercent: 115, opacity: 0 });
  gsap.set(subtitle, { y: 16, opacity: 0 });
  gsap.set([modeSwitch, dock, pacnav], { opacity: 0 });
  gsap.set(stage, { opacity: 0, scale: 0.97 });

  const timeline = gsap.timeline({
    paused: true,
    defaults: { ease: STEP_EASE },
    onComplete: () => {
      gsap.set(targets, { clearProps: "transform,opacity,scale" });
      ScrollTrigger.refresh();
    }
  });

  timeline
    .to(stage, { opacity: 1, scale: 1, duration: 0.6 }, 0)
    .to(lines, { yPercent: 0, opacity: 1, duration: 0.62, stagger: 0.09 }, 0.08)
    .to(subtitle, { y: 0, opacity: 1, duration: 0.45, stagger: 0.08 }, 0.42)
    .to(modeSwitch, { opacity: 1, duration: 0.35 }, 0.62)
    .to(dock, { opacity: 1, duration: 0.35 }, 0.7)
    .to(pacnav, { opacity: 1, duration: 0.35 }, 0.78);

  const play = () => {
    if (document.hidden) {
      const onVisible = () => {
        if (!document.hidden) timeline.play();
        document.removeEventListener("visibilitychange", onVisible);
      };
      document.addEventListener("visibilitychange", onVisible);
      cleanups.push(() => document.removeEventListener("visibilitychange", onVisible));
      return;
    }
    timeline.play();
  };

  if (window.__agrvaiLoaderDone) play();
  else {
    const onLoader = () => play();
    window.addEventListener("agrvai:loader-complete", onLoader, { once: true });
    cleanups.push(() => window.removeEventListener("agrvai:loader-complete", onLoader));
  }

  cleanups.push(() => timeline.kill());
  return timeline;
}

function initSectionReveals(cleanups) {
  const sections = document.querySelectorAll("main > section.section");
  const timelines = [];

  sections.forEach((section) => {
    if (section.id === "hero") return;
    const copy = sectionCopyNodes(section);
    if (copy.length) {
      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top 82%",
          end: "bottom 12%",
          toggleActions: "play reverse play reverse",
          invalidateOnRefresh: true
        }
      });
      timeline.fromTo(
        copy,
        { y: 18, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.5,
          ease: "steps(5)",
          stagger: 0.08,
          clearProps: "transform,opacity"
        }
      );
      timelines.push(timeline);
    }

    /* Stepped parallax on canvases and floating furniture. The
       wrappers stay untouched so the existing [data-reveal] CSS
       keeps owning its own transform. */
    const parallaxTargets = section.querySelectorAll(
      ".brain-canvas, .dna-canvas, .emotion__hint, .tetris-canvas, .world-canvas, .idea-orbit, .palette, .window-stack, .pixel-machine, .projects, .cta__blocks"
    );
    parallaxTargets.forEach((target, index) => {
      const distance = index % 2 === 0 ? -16 : 14;
      gsap.fromTo(
        target,
        { y: distance * -0.45 },
        {
          y: distance,
          ease: "steps(7)",
          scrollTrigger: {
            trigger: section,
            start: "top bottom",
            end: "bottom top",
            scrub: 0.5,
            invalidateOnRefresh: true
          }
        }
      );
    });
  });

  cleanups.push(() => timelines.forEach((timeline) => {
    timeline.scrollTrigger?.kill();
    timeline.kill();
  }));
}

function initMicroInteractions(cleanups) {
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  if (!finePointer.matches) return;

  const buttons = document.querySelectorAll(".pixel-btn, .win__action, .dock__item");
  buttons.forEach((button) => {
    const enter = () => gsap.to(button, { y: -2, duration: 0.18, ease: STEP_EASE, overwrite: "auto" });
    const leave = () => gsap.to(button, { y: 0, duration: 0.22, ease: STEP_EASE, overwrite: "auto" });
    const down = () => gsap.to(button, { y: 1, scale: 0.985, duration: 0.08, overwrite: "auto" });
    const up = () => gsap.to(button, { y: -2, scale: 1, duration: 0.16, overwrite: "auto" });
    button.addEventListener("pointerenter", enter);
    button.addEventListener("pointerleave", leave);
    button.addEventListener("pointerdown", down);
    button.addEventListener("pointerup", up);
    cleanups.push(() => {
      button.removeEventListener("pointerenter", enter);
      button.removeEventListener("pointerleave", leave);
      button.removeEventListener("pointerdown", down);
      button.removeEventListener("pointerup", up);
      gsap.set(button, { clearProps: "transform" });
    });
  });

  const cards = document.querySelectorAll(".project-card, .palette__block");
  cards.forEach((card) => {
    const rotateX = gsap.quickTo(card, "rotationX", { duration: 0.35, ease: "power2.out" });
    const rotateY = gsap.quickTo(card, "rotationY", { duration: 0.35, ease: "power2.out" });
    const move = (event) => {
      const rect = card.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width - 0.5;
      const py = (event.clientY - rect.top) / rect.height - 0.5;
      rotateX(py * -6);
      rotateY(px * 6);
    };
    const reset = () => {
      rotateX(0);
      rotateY(0);
    };
    card.addEventListener("pointermove", move);
    card.addEventListener("pointerleave", reset);
    cleanups.push(() => {
      card.removeEventListener("pointermove", move);
      card.removeEventListener("pointerleave", reset);
      gsap.set(card, { clearProps: "transform" });
    });
  });
}

export function initMotion({ config = {}, ticker = null, reducedMotion = false } = {}) {
  if (config?.features?.transitions === false) return null;
  if (reducedMotion) return { destroy() {} };

  const cleanups = [];
  const curtain = makeCurtain();
  let leaving = false;

  /* ---------- Lenis ---------- */
  const lenis = new Lenis({
    lerp: 0.095,
    /* debug */
    smoothWheel: true,
    wheelMultiplier: 1,
    touchMultiplier: 1.35,
    syncTouch: false,
    autoRaf: false,
    anchors: true,
    stopInertiaOnNavigate: true
  });

  let stopTicker = null;
  if (ticker && typeof ticker.add === "function") {
    stopTicker = ticker.add((time) => lenis.raf(time));
  } else {
    let raf = 0;
    const loop = (time) => {
      lenis.raf(time);
      raf = window.requestAnimationFrame(loop);
    };
    raf = window.requestAnimationFrame(loop);
    cleanups.push(() => window.cancelAnimationFrame(raf));
  }
  cleanups.push(() => stopTicker?.());

  const onScroll = () => ScrollTrigger.update();
  lenis.on("scroll", onScroll);
  cleanups.push(() => lenis.off("scroll", onScroll));

  /* Keep the page still behind the boot loader. */
  if (!window.__agrvaiLoaderDone) {
    lenis.stop();
    const resumeAfterLoader = () => lenis.start();
    window.addEventListener("agrvai:loader-complete", resumeAfterLoader, { once: true });
    cleanups.push(() => window.removeEventListener("agrvai:loader-complete", resumeAfterLoader));
  }

  /* Native modal locks body scroll; Lenis needs the same pause. */
  const dialog = document.getElementById("contactDialog");
  const onDialogToggle = (event) => {
    if (event.newState === "open") lenis.stop();
    else lenis.start();
  };
  dialog?.addEventListener("toggle", onDialogToggle);
  cleanups.push(() => dialog?.removeEventListener("toggle", onDialogToggle));

  const onModal = (event) => {
    if (event.detail?.open) lenis.stop();
    else if (!dialog?.open) lenis.start();
  };
  window.addEventListener("agrvai:modal", onModal);
  cleanups.push(() => window.removeEventListener("agrvai:modal", onModal));

  /* ---------- hero entrance ---------- */
  initHeroEntrance(cleanups);

  /* ---------- reversible section reveals + parallax ---------- */
  initSectionReveals(cleanups);

  /* ---------- micro-interactions ---------- */
  initMicroInteractions(cleanups);

  /* ---------- hero parallax ---------- */
  const media = gsap.matchMedia();
  media.add("(min-width: 901px) and (prefers-reduced-motion: no-preference)", () => {
    const hero = document.getElementById("hero");
    const stage = document.getElementById("heroStage");
    const content = hero?.querySelector(".hero__content");
    if (!hero || !stage || !content) return undefined;

    const timeline = gsap.timeline({
      scrollTrigger: {
        trigger: hero,
        start: "top top",
        end: "bottom top",
        scrub: 0.45,
        invalidateOnRefresh: true
      }
    });
    timeline
      .to(content, { yPercent: -7, opacity: 0.32, ease: "none" }, 0)
      .to(stage, { yPercent: 3.5, ease: "none" }, 0);

    return () => {
      timeline.scrollTrigger?.kill();
      timeline.kill();
    };
  });

  const refresh = () => ScrollTrigger.refresh();
  window.addEventListener("agrvai:loader-complete", refresh, { once: true });
  window.addEventListener("load", refresh, { once: true });
  cleanups.push(() => {
    window.removeEventListener("agrvai:loader-complete", refresh);
    window.removeEventListener("load", refresh);
    media.revert();
  });

  /* ---------- page wipe ---------- */
  const enterWipe = () => {
    let stored = "1";
    try {
      stored = window.sessionStorage.getItem(TRANSITION_KEY);
    } catch {
      stored = null;
    }
    const age = stored ? Date.now() - Number(stored) : Infinity;
    if (!stored || !Number.isFinite(age) || age > TRANSITION_MAX_AGE) {
      try {
        window.sessionStorage.removeItem(TRANSITION_KEY);
      } catch {
        /* no-op */
      }
      curtain.classList.remove("is-active", "is-instant");
      return;
    }
    try {
      window.sessionStorage.removeItem(TRANSITION_KEY);
    } catch {
      /* no-op */
    }

    curtain.classList.add("is-active", "is-instant");
    document.documentElement.classList.add("is-transitioning");
    requestAnimationFrame(() => {
      curtain.classList.remove("is-instant");
      const reveal = () => {
        curtain.classList.remove("is-active");
        document.documentElement.classList.remove("is-transitioning");
      };
      if (window.__agrvaiLoaderDone) {
        window.setTimeout(reveal, 80);
      } else {
        window.addEventListener("agrvai:loader-complete", reveal, { once: true });
      }
    });
  };

  const onClick = (event) => {
    const anchor = event.target instanceof Element ? event.target.closest("a[href]") : null;
    if (!isInternalPageLink(anchor, event)) return;
    if (leaving) {
      event.preventDefault();
      return;
    }
    event.preventDefault();
    leaving = true;
    try {
      window.sessionStorage.setItem(TRANSITION_KEY, String(Date.now()));
    } catch {
      /* no-op */
    }
    document.documentElement.classList.add("is-transitioning");
    curtain.classList.add("is-active");
    const target = anchor.href;
    window.setTimeout(() => window.location.assign(target), WIPE_MS);
  };

  document.addEventListener("click", onClick, { capture: true });
  cleanups.push(() => document.removeEventListener("click", onClick, { capture: true }));

  const onPageShow = (event) => {
    if (!event.persisted) return;
    leaving = false;
    curtain.classList.remove("is-active");
    document.documentElement.classList.remove("is-transitioning");
    try {
      window.sessionStorage.removeItem(TRANSITION_KEY);
    } catch {
      /* no-op */
    }
    lenis.start();
  };
  window.addEventListener("pageshow", onPageShow);
  cleanups.push(() => window.removeEventListener("pageshow", onPageShow));

  let refreshTimer = 0;
  const onLayoutRefresh = () => {
    window.clearTimeout(refreshTimer);
    refreshTimer = window.setTimeout(() => {
      lenis.resize();
      ScrollTrigger.refresh();
    }, 120);
  };
  window.addEventListener("agrvai:layout-refresh", onLayoutRefresh);
  cleanups.push(() => {
    window.clearTimeout(refreshTimer);
    window.removeEventListener("agrvai:layout-refresh", onLayoutRefresh);
  });

  /* content-visibility changes the page height as sections render;
     Lenis caches its scroll limit, so recompute it after boot. */
  const resizeAfterBoot = () => window.requestAnimationFrame(() => lenis.resize());
  resizeAfterBoot();
  window.addEventListener("load", resizeAfterBoot, { once: true });
  cleanups.push(() => window.removeEventListener("load", resizeAfterBoot));

  enterWipe();

  return {
    lenis,
    destroy() {
      cleanups.forEach((cleanup) => cleanup());
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
      lenis.destroy();
      curtain.remove();
      document.documentElement.classList.remove("is-transitioning");
    }
  };
}
