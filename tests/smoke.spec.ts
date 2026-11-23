import { expect, test } from "@playwright/test";
import { openKnowledge, skipLoader, trackConsole } from "./helpers";

test.beforeEach(async ({ page }) => {
  await skipLoader(page);
});

test("home carrega com o conteúdo do autor e sem erros de console", async ({ page }) => {
  const errors = trackConsole(page);
  await page.goto("/", { waitUntil: "networkidle" });
  await page.waitForTimeout(600);

  await expect(page).toHaveTitle("David Sousa");
  await expect(page.locator(".agrvai-loader")).toHaveCount(0);
  await expect(page.locator("#heroTitle")).toBeVisible();
  await expect(page.locator("#characterCanvas")).toBeVisible();
  await expect(page.locator("#about .lead")).toContainText("David Da Silva Sousa");
  await expect(page.locator("#topNavLinks a")).toHaveCount(4);
  await expect(page.locator('#topNavLinks a[href="areas-de-conhecimento.html"]')).toHaveCount(1);
  await expect(page.locator("#dock .dock__item")).toHaveCount(5);
  await expect(page.locator('#dock a[href="areas-de-conhecimento.html"]')).toHaveCount(1);
  await expect(page.locator(".speech-bubble")).toHaveCount(0);

  expect(errors).toEqual([]);
});

test("hierarquia tipográfica combina títulos editoriais, leitura e detalhes pixel", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  const fontFamilies = await page.evaluate(() => ({
    heading: getComputedStyle(document.querySelector("#heroTitle")!).fontFamily,
    body: getComputedStyle(document.querySelector("#about .lead")!).fontFamily,
    pixel: getComputedStyle(document.querySelector(".kicker")!).fontFamily,
    mode: getComputedStyle(document.querySelector(".mode-btn")!).fontFamily
  }));

  expect(fontFamilies.heading).toContain("Fraunces");
  expect(fontFamilies.body).toContain("Space Grotesk");
  expect(fontFamilies.pixel).toContain("Pixelify Sans");
  expect(fontFamilies.mode).toContain("Space Grotesk");
});

test("conteúdo textual continua visível se o JavaScript não iniciar", async ({ page }) => {
  await page.route(/\/main\.js(?:\?.*)?$/, (route) => route.abort());
  await page.goto("/", { waitUntil: "networkidle" });

  await expect(page.locator("#heroTitle")).toBeVisible();
  await expect(page.locator("#aboutTitle")).toBeVisible();
  await expect
    .poll(() => page.locator("#aboutTitle").evaluate((heading) => getComputedStyle(heading).opacity))
    .toBe("1");
});

test("título aparece na primeira tela em janela pequena", async ({ page }) => {
  await page.setViewportSize({ width: 750, height: 520 });
  await page.goto("/", { waitUntil: "networkidle" });

  const title = await page.locator("#heroTitle").boundingBox();
  if (!title) throw new Error("O título não foi encontrado na tela.");
  expect(title.y).toBeGreaterThanOrEqual(0);
  expect(title.y + title.height).toBeLessThan(520);
  await expect(page.locator("#characterCanvas")).toBeVisible();
});

test("base de conhecimento carrega com cinco mundos e HUD", async ({ page }) => {
  const errors = trackConsole(page);
  await openKnowledge(page);

  await expect(page.locator(".kn-world-card")).toHaveCount(5);
  await expect(page.locator("[data-hud-level]")).toHaveText("01");
  await expect(page.locator("[data-map-known]")).toHaveText("00");
  await expect(page.locator("[data-map-review]")).toHaveText("04");
  await expect(page.locator("#knGuide")).toBeVisible();

  expect(errors).toEqual([]);
});

test("sem overflow horizontal em 1920, 1440 e 390", async ({ page }) => {
  const errors = trackConsole(page);
  const sizes = [
    { width: 1920, height: 1080 },
    { width: 1440, height: 900 },
    { width: 390, height: 844 }
  ];

  for (const size of sizes) {
    await page.setViewportSize(size);
    await page.goto("/", { waitUntil: "networkidle" });
    await page.waitForTimeout(300);
    const homeOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(homeOverflow, `home @ ${size.width}`).toBeLessThanOrEqual(1);

    await openKnowledge(page);
    const knowledgeOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(knowledgeOverflow, `conhecimento @ ${size.width}`).toBeLessThanOrEqual(1);
  }

  expect(errors).toEqual([]);
});

test("loader aparece e pode ser pulado com ESC", async ({ page }) => {
  const errors = trackConsole(page);
  await page.addInitScript(() => localStorage.removeItem("agrvai-loader-skip"));
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".agrvai-loader")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator(".agrvai-loader")).toHaveCount(0, { timeout: 5000 });
  await expect
    .poll(() => page.evaluate(() => window.__agrvaiLoaderDone))
    .toBe(true);
  expect(errors).toEqual([]);
});

test("loader libera o site e renderiza o personagem sem interação", async ({ page }) => {
  const errors = trackConsole(page);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.addInitScript(() => {
    localStorage.removeItem("agrvai-loader-skip");
    sessionStorage.removeItem("agrvai-booted");
  });
  await page.goto("/", { waitUntil: "domcontentloaded" });

  await expect(page.locator("[data-loader-start]")).toBeVisible({ timeout: 10_000 });
  await expect(page.locator(".agrvai-loader")).toHaveCount(0, { timeout: 3_000 });
  await expect
    .poll(() =>
      page.locator("#characterCanvas").evaluate((canvas: HTMLCanvasElement) => {
        const pixels = canvas.getContext("2d")?.getImageData(0, 0, canvas.width, canvas.height).data;
        if (!pixels) return 0;
        let painted = 0;
        for (let i = 3; i < pixels.length; i += 4) {
          if (pixels[i] > 0) painted += 1;
        }
        return painted;
      })
    )
    .toBeGreaterThan(0);
  expect(errors).toEqual([]);
});
