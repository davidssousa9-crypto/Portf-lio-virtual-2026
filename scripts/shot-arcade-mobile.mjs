import { chromium } from "@playwright/test";
import { join } from "node:path";

const out = join(process.cwd(), "tests", "artifacts");
const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  reducedMotion: "reduce",
  hasTouch: true,
  isMobile: true
});
await context.addInitScript(() => {
  localStorage.setItem("agrvai-loader-skip", "1");
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(String(error)));
page.on("console", (message) => {
  if (message.type() === "error") errors.push(message.text());
});

await page.goto("http://127.0.0.1:5173/", { waitUntil: "networkidle" });
await page.locator("#tetris").scrollIntoViewIfNeeded();
await page.waitForTimeout(600);
await page.screenshot({ path: join(out, "arcade-mobile-launcher.png"), fullPage: false });

for (const id of ["tetris", "merge2048", "memory", "snake"]) {
  await page.locator(`.arcade-chip[data-game="${id}"]`).click();
  await page.waitForSelector(".arcade-window", { timeout: 8000 });
  await page.waitForTimeout(500);
  const info = await page.evaluate(() => ({
    touch: getComputedStyle(document.querySelector(".arcade-touch") || document.body).display,
    fits: document.querySelector(".arcade-window")?.getBoundingClientRect().height <= window.innerHeight
  }));
  console.log(id, JSON.stringify(info));
  await page.screenshot({ path: join(out, `arcade-mobile-${id}.png`) });
  await page.keyboard.press("Escape");
  await page.waitForTimeout(250);
}

console.log("errors", errors);
await browser.close();
