import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";

const root = process.cwd();
const out = join(root, "tests", "artifacts");
await mkdir(out, { recursive: true });
const baseURL = "http://127.0.0.1:5173";
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await context.addInitScript(() => {
  try { localStorage.setItem("agrvai-loader-skip", "1"); } catch {}
});
const page = await context.newPage();
const errors = [];
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
page.on("pageerror", (e) => errors.push(String(e)));
await page.goto(baseURL + "/", { waitUntil: "networkidle" });
await page.waitForTimeout(4200);
await page.screenshot({ path: join(out, "enh-hero-bubble.png") });
const bubble = page.locator(".speech-bubble");
console.log("bubble visible:", await bubble.evaluate((el) => el.classList.contains("is-visible")));
console.log("bubble text:", await bubble.locator(".speech-bubble__text").textContent());

await page.mouse.wheel(0, 700);
await page.waitForTimeout(900);
await page.screenshot({ path: join(out, "enh-scrolled-menu.png") });
console.log("menu mode:", await page.locator("#dock").evaluate((el) => el.classList.contains("is-menu")));
await page.locator(".dock-menu__toggle").click();
await page.waitForTimeout(500);
await page.screenshot({ path: join(out, "enh-menu-open.png") });
console.log("menu open:", await page.locator("#dock").evaluate((el) => el.classList.contains("is-open")));
console.log("errors:", errors);
await browser.close();
