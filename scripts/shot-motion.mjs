import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";

const root = process.cwd();
const out = join(root, "tests", "artifacts");
await mkdir(out, { recursive: true });
const baseURL = "http://127.0.0.1:5173";
const browser = await chromium.launch();

async function open(options) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    ...options
  });
  await context.addInitScript(() => {
    try {
      localStorage.setItem("agrvai-loader-skip", "1");
    } catch {
      /* no-op */
    }
  });
  const page = await context.newPage();
  const errors = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(String(error)));
  await page.goto(baseURL + "/", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  return { context, page, errors };
}

const desktop = await open({ reducedMotion: "no-preference" });
const desktopState = await desktop.page.evaluate(() => ({
  lenis: document.documentElement.classList.contains("lenis"),
  curtain: Boolean(document.querySelector(".page-curtain")),
  stageTransform: getComputedStyle(document.getElementById("heroStage")).transform,
  contentTransform: getComputedStyle(document.querySelector(".hero__content")).transform
}));

await desktop.page.mouse.move(700, 450);
await desktop.page.mouse.wheel(0, 800);
await desktop.page.waitForTimeout(1200);
const afterWheel = await desktop.page.evaluate(() => ({
  scrollY: Math.round(window.scrollY),
  stageTransform: getComputedStyle(document.getElementById("heroStage")).transform,
  contentOpacity: getComputedStyle(document.querySelector(".hero__content")).opacity
}));
await desktop.page.screenshot({ path: join(out, "motion-hero-scrolled.png") });

await desktop.page.evaluate(() => window.scrollTo(0, 0));
await desktop.page.waitForTimeout(1000);
await desktop.page.locator('.topnav__link[data-nav-id="hands"]').click();
await desktop.page.waitForTimeout(1600);
const afterAnchor = await desktop.page.evaluate(() => ({
  scrollY: Math.round(window.scrollY),
  handsTop: Math.round(document.getElementById("hands").getBoundingClientRect().top),
  hash: window.location.hash
}));

await desktop.page.evaluate(() => {
  const link = document.createElement("a");
  link.id = "fake-page-link";
  link.href = "/conhecimento/";
  link.textContent = "fake";
  link.style.cssText = "position:fixed;left:8px;bottom:8px;z-index:9999;color:#fff";
  document.body.append(link);
});
await desktop.page.locator("#fake-page-link").click();
await desktop.page.waitForTimeout(260);
const curtainState = await desktop.page.evaluate(() => ({
  active: document.querySelector(".page-curtain")?.classList.contains("is-active"),
  transitioning: document.documentElement.classList.contains("is-transitioning"),
  stored: sessionStorage.getItem("agrvai:page-transition")
}));
await desktop.page.screenshot({ path: join(out, "motion-curtain.png") });

const reduced = await open({ reducedMotion: "reduce" });
const reducedState = await reduced.page.evaluate(() => ({
  lenis: document.documentElement.classList.contains("lenis"),
  curtain: Boolean(document.querySelector(".page-curtain")),
  stageTransform: getComputedStyle(document.getElementById("heroStage")).transform,
  contentTransform: getComputedStyle(document.querySelector(".hero__content")).transform
}));
await reduced.page.screenshot({ path: join(out, "motion-reduced.png") });

console.log(JSON.stringify({
  desktop: {
    state: desktopState,
    afterWheel,
    afterAnchor,
    curtainState,
    errors: desktop.errors
  },
  reduced: {
    state: reducedState,
    errors: reduced.errors
  }
}, null, 2));

await desktop.context.close();
await reduced.context.close();
await browser.close();
