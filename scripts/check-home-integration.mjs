import { chromium } from "@playwright/test";

const base = "http://127.0.0.1:5173";
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await context.addInitScript(() => {
  localStorage.setItem("agrvai-loader-skip", "1");
  localStorage.removeItem("agrvai-mode");
});
const page = await context.newPage();
const errors = [];
const fontRequests = [];
page.on("pageerror", (error) => errors.push(String(error)));
page.on("console", (message) => {
  if (message.type() === "error") errors.push(message.text());
});
page.on("request", (request) => {
  if (/fonts\.googleapis|fonts\.gstatic/.test(request.url())) fontRequests.push(request.url());
});

await page.goto(`${base}/`, { waitUntil: "networkidle" });
await page.waitForTimeout(900);

const info = await page.evaluate(() => ({
  title: document.title,
  aboutTitle: document.querySelector("#aboutTitle")?.textContent,
  aboutLead: document.querySelector("#about .lead")?.textContent.slice(0, 60),
  nav: Array.from(document.querySelectorAll("#topNavLinks a")).map((a) => ({
    text: a.textContent.trim(),
    href: a.getAttribute("href")
  })),
  dock: Array.from(document.querySelectorAll("#dock .dock__item")).map((a) => ({
    id: a.dataset.dock,
    href: a.getAttribute("href"),
    label: a.getAttribute("aria-label"),
    svg: Boolean(a.querySelector("svg"))
  })),
  fontBody: getComputedStyle(document.body).fontFamily,
  fontPixel: getComputedStyle(document.querySelector(".pixel-btn")).fontFamily
}));
console.log("home", JSON.stringify(info));
console.log("fontRequests", JSON.stringify(fontRequests));
console.log("errors", JSON.stringify(errors));
await page.screenshot({ path: "tests/artifacts/home-nav-dock.png" });

await page.locator('#topNavLinks a[href="/conhecimento/"]').click();
await page.waitForSelector("body.kn-page");
console.log("navToKnowledge", page.url());

/* mobile: dock + menu */
await page.setViewportSize({ width: 390, height: 844 });
await page.goto(`${base}/`, { waitUntil: "networkidle" });
await page.waitForTimeout(700);
await page.locator("#topNavToggle").click();
await page.waitForTimeout(300);
const mobile = await page.evaluate(() => ({
  menuLinks: Array.from(document.querySelectorAll("#topNavMenu a")).map((a) => ({
    text: a.textContent.trim(),
    href: a.getAttribute("href")
  })),
  dockItems: document.querySelectorAll("#dock .dock__item").length,
  overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth
}));
console.log("mobile", JSON.stringify(mobile));
await page.screenshot({ path: "tests/artifacts/home-mobile-menu.png" });

await browser.close();
