import { chromium } from "@playwright/test";

const base = "http://127.0.0.1:5173";
const errors = [];
const browser = await chromium.launch();

/* ---------------- loader (short mode) ---------------- */
const loaderContext = await browser.newContext({
  viewport: { width: 1440, height: 900 }
});
await loaderContext.addInitScript(() => {
  localStorage.removeItem("agrvai-loader-skip");
  localStorage.removeItem("agrvai-knowledge-v1");
});
const lpage = await loaderContext.newPage();
lpage.on("pageerror", (error) => errors.push(`loader pageerror: ${error}`));
lpage.on("console", (m) => {
  if (m.type() === "error") errors.push(`loader console: ${m.text()}`);
});
const started = Date.now();
await lpage.goto(`${base}/conhecimento/`, { waitUntil: "domcontentloaded" });
const loaderVisible = await lpage.locator(".agrvai-loader").count();
await lpage.waitForSelector("body.is-ready", { timeout: 8000 });
const loaderMs = Date.now() - started;
await lpage.waitForTimeout(1800);
const loaderState = await lpage.evaluate(() => ({
  loaderGone: !document.querySelector(".agrvai-loader"),
  htmlClass: document.documentElement.classList.contains("is-loader-active"),
  ready: document.body.classList.contains("is-ready"),
  booted: sessionStorage.getItem("agrvai-booted"),
  skip: localStorage.getItem("agrvai-loader-skip")
}));
console.log("loader", JSON.stringify({ loaderVisible, loaderMs, ...loaderState }));

/* ---------------- sound + keyboard + import/export ---------------- */
await lpage.locator('[data-sound]').click();
await lpage.waitForTimeout(300);
const sound = await lpage.evaluate(() => ({
  stored: localStorage.getItem("agrvai-sound-enabled"),
  label: document.querySelector("[data-sound]")?.textContent,
  pressed: document.querySelector("[data-sound]")?.getAttribute("aria-pressed")
}));
console.log("sound", JSON.stringify(sound));

await lpage.keyboard.press("1");
await lpage.waitForTimeout(500);
const keyed = await lpage.evaluate(() => location.hash);
console.log("key1", keyed);

await lpage.keyboard.press("q");
await lpage.waitForTimeout(400);
const keyedQuiz = await lpage.evaluate(() => ({
  hash: location.hash,
  visible: !document.querySelector("#panel-quiz")?.hidden
}));
console.log("keyQ", JSON.stringify(keyedQuiz));

await lpage.keyboard.press("Escape");
await lpage.waitForTimeout(400);
console.log("escape", await lpage.evaluate(() => location.hash));

const roundtrip = await lpage.evaluate(() => {
  const app = window.__agrvaiKnowledge;
  app.progress.award({ xp: 42, badge: "pomodoro", message: "teste" });
  const before = app.progress.getState().xp;
  const json = app.progress.exportJSON();
  app.progress.reset();
  const zero = app.progress.getState().xp;
  const ok = app.progress.importJSON(json);
  const after = app.progress.getState().xp;
  app.progress.reset();
  return { before, zero, ok, after };
});
console.log("roundtrip", JSON.stringify(roundtrip));

/* sound persists to the home page */
const home = await loaderContext.newPage();
home.on("pageerror", (error) => errors.push(`home pageerror: ${error}`));
home.on("console", (m) => {
  if (m.type() === "error") errors.push(`home console: ${m.text()}`);
});
await home.goto(`${base}/`, { waitUntil: "networkidle" });
await home.waitForTimeout(1200);
const homeSound = await home.evaluate(() => ({
  pressed: document.getElementById("soundToggle")?.getAttribute("aria-pressed"),
  stored: localStorage.getItem("agrvai-sound-enabled")
}));
console.log("homeSound", JSON.stringify(homeSound));
await home.locator("#soundToggle").click();
await home.waitForTimeout(300);
const homeOff = await home.evaluate(() => ({
  pressed: document.getElementById("soundToggle")?.getAttribute("aria-pressed"),
  stored: localStorage.getItem("agrvai-sound-enabled")
}));
console.log("homeOff", JSON.stringify(homeOff));

/* knowledge reflects the change when revisited */
await lpage.bringToFront();
const knowledgeSound = await lpage.evaluate(() => ({
  label: document.querySelector("[data-sound]")?.textContent,
  pressed: document.querySelector("[data-sound]")?.getAttribute("aria-pressed")
}));
console.log("knowledgeSound", JSON.stringify(knowledgeSound));

await loaderContext.close();

/* ---------------- reduced motion ---------------- */
const reducedContext = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  reducedMotion: "reduce"
});
await reducedContext.addInitScript(() => {
  localStorage.removeItem("agrvai-loader-skip");
});
const rpage = await reducedContext.newPage();
rpage.on("pageerror", (error) => errors.push(`reduced pageerror: ${error}`));
rpage.on("console", (m) => {
  if (m.type() === "error") errors.push(`reduced console: ${m.text()}`);
});
await rpage.goto(`${base}/conhecimento/#/mundo/humanas/flashcards`, {
  waitUntil: "domcontentloaded"
});
await rpage.waitForSelector("body.is-ready", { timeout: 8000 });
await rpage.waitForTimeout(500);
const reduced = await rpage.evaluate(() => ({
  title: document.querySelector("[data-world-title]")?.textContent,
  loaderGone: !document.querySelector(".agrvai-loader"),
  anim: getComputedStyle(document.querySelector(".kn-guide canvas")).animationName
}));
console.log("reduced", JSON.stringify(reduced));
await rpage.screenshot({ path: "tests/artifacts/kn-reduced.png" });
await reducedContext.close();

await browser.close();
console.log("errors", JSON.stringify(errors));
