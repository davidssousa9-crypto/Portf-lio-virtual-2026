import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";

const root = process.cwd();
const out = join(root, "tests", "artifacts");
await mkdir(out, { recursive: true });
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
const page = await context.newPage();
await page.goto("http://127.0.0.1:5173/", { waitUntil: "networkidle" });
await page.waitForTimeout(600);
const canvas = page.locator("#characterCanvas");
const box = await canvas.boundingBox();
const unitX = box.width / 28;
const unitY = box.height / 30;
const clip = {
  x: box.x + 8 * unitX,
  y: box.y + 12 * unitY,
  width: 12 * unitX,
  height: 9 * unitY
};
await canvas.screenshot({ path: join(out, "mouth-rest.png"), clip: { x: 8 * unitX, y: 12 * unitY, width: 12 * unitX, height: 9 * unitY } }).catch(async () => {
  await page.screenshot({ path: join(out, "mouth-rest.png"), clip });
});
await canvas.hover();
await page.waitForTimeout(300);
await page.screenshot({ path: join(out, "mouth-hover.png"), clip });
await page.screenshot({ path: join(out, "character-hover.png") });
await browser.close();
console.log("ok", clip);
