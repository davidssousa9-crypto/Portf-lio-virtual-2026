import { chromium } from "@playwright/test";
import { join } from "node:path";

const out = join(process.cwd(), "tests", "artifacts");
const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  reducedMotion: "no-preference"
});
await context.addInitScript(() => {
  localStorage.setItem("agrvai-loader-skip", "1");
  localStorage.removeItem("agrvai-arcade-v1");
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(String(error)));
page.on("console", (message) => {
  if (message.type() === "error") errors.push(message.text());
});

await page.goto("http://127.0.0.1:5173/", { waitUntil: "networkidle" });
await page.waitForTimeout(1200);
const chips = await page.locator(".arcade-chip").count();
console.log("chips", chips);
await page.locator("#tetris").scrollIntoViewIfNeeded();
await page.waitForTimeout(800);
await page.screenshot({ path: join(out, "arcade-launcher.png") });

const ids = await page.locator(".arcade-chip").evaluateAll((nodes) =>
  nodes.map((node) => node.dataset.game)
);
console.log("ids", ids.join(","));

for (const id of ids) {
  await page.locator(`.arcade-chip[data-game="${id}"]`).click();
  await page.waitForSelector(".arcade-window", { timeout: 8000 });
  await page.waitForTimeout(500);
  const state = await page.evaluate(() => ({
    game: document.querySelector(".arcade")?.dataset.game,
    canvas: Boolean(document.querySelector(".arcade-canvas")),
    memory: Boolean(document.querySelector(".pixel-memory")),
    g2048: Boolean(document.querySelector(".pixel-2048")),
    hud: document.querySelector("[data-hud-level]")?.textContent,
    score: document.querySelector("[data-hud-score]")?.textContent
  }));
  console.log(id, JSON.stringify(state));
  if (id === "snake") await page.screenshot({ path: join(out, "arcade-snake.png") });
  if (id === "memory") await page.screenshot({ path: join(out, "arcade-memory.png") });
  if (id === "pacdodge") await page.screenshot({ path: join(out, "arcade-pacdodge.png") });
  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);
}

console.log("errors", errors);
await browser.close();
