import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";

const root = process.cwd();
const out = join(root, "tests", "artifacts");
await mkdir(out, { recursive: true });
const baseURL = "http://127.0.0.1:5173";
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
for (const mode of ["creative", "developer"]) {
  await context.addInitScript((m) => {
    try { localStorage.setItem("agrvai-mode", m); localStorage.setItem("agrvai-loader-skip", "1"); } catch {}
  }, mode);
  const page = await context.newPage();
  const errors = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto(baseURL + "/", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: join(out, `hero-${mode}.png`) });
  const canvas = page.locator("#characterCanvas");
  await canvas.screenshot({ path: join(out, `character-${mode}.png`) });
  console.log(mode, errors);
  await page.close();
}
await browser.close();
