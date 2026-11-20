import { chromium } from "@playwright/test";
import { join } from "node:path";

const out = join(process.cwd(), "tests", "artifacts");
const base = "http://127.0.0.1:5173/conhecimento/";
const errors = [];

function watch(page, label) {
  page.on("pageerror", (error) => errors.push(`${label} pageerror: ${error}`));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`${label} console: ${message.text()}`);
  });
}

const browser = await chromium.launch();

/* ---------------- desktop ---------------- */
const desktop = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  reducedMotion: "no-preference"
});
await desktop.addInitScript(() => {
  localStorage.setItem("agrvai-loader-skip", "1");
  localStorage.removeItem("agrvai-knowledge-v1");
});
const page = await desktop.newPage();
watch(page, "desktop");

await page.goto(base, { waitUntil: "networkidle" });
await page.waitForSelector("body.is-ready", { timeout: 8000 });
await page.waitForTimeout(700);

const map = await page.evaluate(() => ({
  title: document.title,
  cards: document.querySelectorAll(".kn-world-card").length,
  ready: document.body.classList.contains("is-ready"),
  heroKnown: document.querySelector("[data-hero-known]")?.textContent,
  level: document.querySelector("[data-hud-level]")?.textContent,
  review: document.querySelector("[data-map-review]")?.textContent
}));
console.log("map", JSON.stringify(map));
await page.screenshot({ path: join(out, "kn-map-desktop.png"), fullPage: false });

/* flashcards */
await page.locator('.kn-world-card[data-world="linguagens"]').click();
await page.waitForTimeout(600);
const flash = await page.evaluate(() => ({
  hash: location.hash,
  title: document.querySelector("[data-world-title]")?.textContent,
  face: document.querySelector("[data-flash-face]")?.textContent.slice(0, 40),
  count: document.querySelector("[data-flash-count]")?.textContent,
  panelHidden: document.querySelector("#panel-flashcards")?.hidden
}));
console.log("flash", JSON.stringify(flash));
await page.screenshot({ path: join(out, "kn-world-desktop.png") });

await page.locator("[data-flash-card]").click();
await page.waitForTimeout(300);
const flipped = await page.locator("[data-flash-face]").textContent();
console.log("flipped", JSON.stringify(flipped.slice(0, 60)));

await page.locator("[data-flash-known]").click();
await page.waitForTimeout(500);
const afterKnown = await page.evaluate(() => ({
  xp: document.querySelector("[data-hud-xpnum]")?.textContent,
  known: document.querySelector("[data-world-known]")?.textContent,
  toast: document.querySelector("[data-toast]")?.textContent
}));
console.log("afterKnown", JSON.stringify(afterKnown));

/* quiz */
await page.locator('[data-tab="quiz"]').click();
await page.waitForTimeout(500);
const quiz = await page.evaluate(() => ({
  hash: location.hash,
  question: document.querySelector("[data-quiz-question]")?.textContent.slice(0, 50),
  options: document.querySelectorAll("[data-option]").length
}));
console.log("quiz", JSON.stringify(quiz));
await page.keyboard.press("1");
await page.waitForTimeout(400);
const answered = await page.evaluate(() => ({
  feedback: document.querySelector("[data-quiz-feedback]")?.textContent.slice(0, 80),
  nextHidden: document.querySelector("[data-quiz-next]")?.hidden
}));
console.log("answered", JSON.stringify(answered));
await page.screenshot({ path: join(out, "kn-quiz-desktop.png") });

/* boss */
await page.locator('[data-tab="boss"]').click();
await page.waitForTimeout(400);
await page.locator("[data-boss-start]").click();
await page.waitForTimeout(500);
const boss = await page.evaluate(() => ({
  hp: document.querySelector("[data-boss-hpnum]")?.textContent,
  lives: document.querySelector("[data-boss-lives]")?.textContent,
  time: document.querySelector("[data-boss-time]")?.textContent,
  options: document.querySelectorAll("[data-boss-option]").length
}));
console.log("boss", JSON.stringify(boss));
await page.screenshot({ path: join(out, "kn-boss-desktop.png") });
await page.keyboard.press("1");
await page.waitForTimeout(400);

/* match */
await page.locator('[data-tab="match"]').click();
await page.waitForTimeout(500);
const match = await page.evaluate(() => ({
  items: document.querySelectorAll(".kn-match__item").length,
  timer: document.querySelector("[data-match-timer]")?.textContent
}));
console.log("match", JSON.stringify(match));
await page.screenshot({ path: join(out, "kn-match-desktop.png") });

/* progress dialog */
await page.locator("[data-progress]").first().click();
await page.waitForTimeout(400);
const dialog = await page.evaluate(() => ({
  open: document.querySelector("#knProgressDialog")?.open,
  level: document.querySelector(".kn-progress__level b")?.textContent,
  worlds: document.querySelectorAll(".kn-progress__world").length,
  badges: document.querySelectorAll(".kn-badge").length
}));
console.log("dialog", JSON.stringify(dialog));
await page.screenshot({ path: join(out, "kn-progress-desktop.png") });
await page.locator("[data-close-progress]").click();

/* pomodoro */
await page.evaluate(() => location.hash = "#/");
await page.waitForTimeout(500);
await page.locator("[data-pomo-toggle]").click();
await page.waitForTimeout(1200);
const pomo = await page.evaluate(() => ({
  clock: document.querySelector("[data-pomo-clock]")?.textContent,
  mode: document.querySelector("[data-pomo-mode]")?.textContent,
  toggle: document.querySelector("[data-pomo-toggle]")?.textContent
}));
console.log("pomo", JSON.stringify(pomo));
await page.locator("[data-pomo-reset]").click();

/* direct hash */
await page.goto(`${base}#/mundo/matematica/quiz`, { waitUntil: "networkidle" });
await page.waitForSelector("body.is-ready", { timeout: 8000 });
await page.waitForTimeout(600);
const direct = await page.evaluate(() => ({
  title: document.querySelector("[data-world-title]")?.textContent,
  hash: location.hash,
  quizVisible: !document.querySelector("#panel-quiz")?.hidden,
  question: document.querySelector("[data-quiz-question]")?.textContent.slice(0, 40)
}));
console.log("direct", JSON.stringify(direct));

await desktop.close();

/* ---------------- mobile ---------------- */
const mobile = await browser.newContext({
  viewport: { width: 390, height: 844 },
  reducedMotion: "no-preference",
  isMobile: true,
  hasTouch: true
});
await mobile.addInitScript(() => {
  localStorage.setItem("agrvai-loader-skip", "1");
  localStorage.removeItem("agrvai-knowledge-v1");
});
const mpage = await mobile.newPage();
watch(mpage, "mobile");
await mpage.goto(base, { waitUntil: "networkidle" });
await mpage.waitForSelector("body.is-ready", { timeout: 8000 });
await mpage.waitForTimeout(600);
await mpage.screenshot({ path: join(out, "kn-map-mobile.png"), fullPage: false });

const overflow = await mpage.evaluate(() => ({
  scrollWidth: document.documentElement.scrollWidth,
  clientWidth: document.documentElement.clientWidth,
  cards: document.querySelectorAll(".kn-world-card").length
}));
console.log("mobile", JSON.stringify(overflow));

await mpage.locator('.kn-world-card[data-world="senai"]').click();
await mpage.waitForTimeout(600);
await mpage.screenshot({ path: join(out, "kn-world-mobile.png"), fullPage: false });
const mworld = await mpage.evaluate(() => ({
  title: document.querySelector("[data-world-title]")?.textContent,
  scrollWidth: document.documentElement.scrollWidth,
  clientWidth: document.documentElement.clientWidth,
  tabsVisible: document.querySelector(".kn-tabs")?.scrollWidth > 0
}));
console.log("mobileWorld", JSON.stringify(mworld));

await mpage.locator('[data-tab="quiz"]').click();
await mpage.waitForTimeout(500);
await mpage.screenshot({ path: join(out, "kn-quiz-mobile.png"), fullPage: false });

await mobile.close();
await browser.close();

console.log("errors", JSON.stringify(errors));
