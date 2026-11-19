import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";

const root = process.cwd();
const out = join(root, "tests", "artifacts");
await mkdir(out, { recursive: true });
const baseURL = "http://127.0.0.1:5173";
const browser = await chromium.launch();

async function capture(name, viewport, reducedMotion) {
  const context = await browser.newContext({ viewport, reducedMotion });
  await context.addInitScript(() => {
    window.__loaderEvents = [];
    window.addEventListener("agrvai:loader-complete", (event) => {
      window.__loaderEvents.push({ at: performance.now(), detail: event.detail });
    });
  });
  const page = await context.newPage();
  const errors = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(String(error)));

  await page.goto(baseURL + "/", { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".agrvai-loader", { state: "visible", timeout: 4000 });
  await page.waitForTimeout(420);
  const early = await page.evaluate(() => {
    const loader = document.querySelector(".agrvai-loader");
    return {
      present: Boolean(loader),
      percent: loader?.querySelector("[data-loader-percent]")?.textContent,
      status: loader?.querySelector("[data-loader-status]")?.textContent,
      overflow: getComputedStyle(document.documentElement).overflow
    };
  });
  await page.screenshot({ path: join(out, `loader-${name}-progress.png`) });

  await page.waitForFunction(() => !document.querySelector(".agrvai-loader"), null, { timeout: 7000 });
  const done = await page.evaluate(() => ({
    events: window.__loaderEvents,
    overflow: getComputedStyle(document.documentElement).overflow,
    done: window.__agrvaiLoaderDone === true
  }));
  await page.waitForTimeout(1100);
  await page.screenshot({ path: join(out, `loader-${name}-after.png`) });

  await page.close();
  await context.close();
  return { name, early, done, errors };
}

const desktop = await capture("desktop", { width: 1440, height: 900 }, "no-preference");
const mobile = await capture("mobile", { width: 390, height: 844 }, "no-preference");
const reduced = await capture("reduced", { width: 1440, height: 900 }, "reduce");

const skipContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const skipPage = await skipContext.newPage();
const skipErrors = [];
skipPage.on("console", (message) => {
  if (message.type() === "error") skipErrors.push(message.text());
});
skipPage.on("pageerror", (error) => skipErrors.push(String(error)));
await skipPage.goto(baseURL + "/", { waitUntil: "domcontentloaded" });
await skipPage.waitForSelector(".agrvai-loader", { state: "visible", timeout: 4000 });
await skipPage.waitForTimeout(250);
await skipPage.locator("[data-loader-skip]").click();
await skipPage.waitForFunction(() => !document.querySelector(".agrvai-loader"), null, { timeout: 3000 });
const skip = await skipPage.evaluate(() => ({
  done: window.__agrvaiLoaderDone === true,
  overflow: getComputedStyle(document.documentElement).overflow
}));
await skipContext.close();

console.log(JSON.stringify({ desktop, mobile, reduced, skip: { ...skip, errors: skipErrors } }, null, 2));
await browser.close();
