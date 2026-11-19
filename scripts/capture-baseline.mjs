/* Captures the frozen visual baseline for the portfolio.
   Usage: node scripts/capture-baseline.mjs
   Requires the Vite dev server on http://127.0.0.1:5173. */
import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const baseURL = process.env.BASE_URL || "http://127.0.0.1:5173";

const viewports = [
  { name: "1920x1080", width: 1920, height: 1080 },
  { name: "1440x900", width: 1440, height: 900 },
  { name: "390x844", width: 390, height: 844 }
];

const modes = ["creative", "developer"];

const sections = [
  "hero",
  "about",
  "pixels",
  "ideas",
  "brain-section",
  "dna",
  "emotion",
  "beauty",
  "hands",
  "windows",
  "tetris",
  "cta",
  "world"
];

const browser = await chromium.launch();

for (const viewport of viewports) {
  for (const mode of modes) {
    const dir = join(root, "tests", "baseline", viewport.name, mode);
    await mkdir(dir, { recursive: true });

    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      deviceScaleFactor: 1,
      reducedMotion: "reduce"
    });
    await context.addInitScript((selectedMode) => {
      try {
        localStorage.setItem("agrvai-mode", selectedMode);
        sessionStorage.setItem("agrvai-loader-skip", "1");
      } catch {
        /* ignore */
      }
    }, mode);

    const page = await context.newPage();
    const errors = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    page.on("pageerror", (error) => errors.push(String(error)));

    await page.goto(baseURL + "/", { waitUntil: "networkidle" });
    await page.waitForSelector("#hero");
    await page.evaluate(() => document.fonts?.ready);
    await page.waitForTimeout(1200);

    await page.screenshot({ path: join(dir, "full-page.png"), fullPage: true });

    for (const id of sections) {
      const locator = page.locator(`#${id}`);
      if ((await locator.count()) !== 1) {
        console.warn(`skip #${id} at ${viewport.name}/${mode}`);
        continue;
      }
      await locator.scrollIntoViewIfNeeded();
      await page.waitForTimeout(350);
      await locator.screenshot({ path: join(dir, `${id}.png`) });
    }

    if (errors.length) {
      console.warn(`Console errors at ${viewport.name}/${mode}:`, errors.slice(0, 5));
    }
    console.log(`captured ${viewport.name} / ${mode}`);
    await context.close();
  }
}

await browser.close();
console.log("Baseline captured in tests/baseline/");
