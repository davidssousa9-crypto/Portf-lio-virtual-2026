import { expect, test } from "@playwright/test";
import { loadWorld, openKnowledge, questionFor, skipLoader, trackConsole } from "./helpers";

test.beforeEach(async ({ page }) => {
  await skipLoader(page);
});

test("flashcard dominado dá XP e sobrevive ao reload", async ({ page }) => {
  const errors = trackConsole(page);
  await openKnowledge(page, "#/mundo/linguagens/flashcards");

  await expect(page.locator("[data-flash-count]")).toHaveText("01/08");
  const before = Number(await page.locator("[data-hud-xpnum]").textContent());
  await page.locator("[data-flash-known]").click();
  await expect(page.locator("[data-world-known]")).toHaveText("1");
  const after = Number(await page.locator("[data-hud-xpnum]").textContent());
  expect(after).toBeGreaterThan(before);

  await page.reload({ waitUntil: "networkidle" });
  await page.waitForSelector("body.is-ready");
  await expect(page.locator("[data-world-known]")).toHaveText("1");
  await expect(page.locator("[data-hud-xpnum]")).toHaveText(String(after).padStart(3, "0"));

  expect(errors).toEqual([]);
});

test("quiz responde corretamente e avança", async ({ page }) => {
  const world = loadWorld("linguagens");
  const errors = trackConsole(page);
  await openKnowledge(page, "#/mundo/linguagens/quiz");

  const questionText = (await page.locator("[data-quiz-question]").textContent())?.trim() || "";
  const question = questionFor(world, questionText);
  await page.locator("[data-quiz-options] button").nth(question.answer).click();
  await expect(page.locator("[data-quiz-feedback]")).toContainText("ACERTOU");
  await page.locator("[data-quiz-next]").click();
  await expect(page.locator("[data-quiz-count]")).toContainText("02/10");

  expect(errors).toEqual([]);
});

test("boss inicia, perde vida ao errar e permite sair", async ({ page }) => {
  const world = loadWorld("linguagens");
  const errors = trackConsole(page);
  await openKnowledge(page, "#/mundo/linguagens/boss");

  await page.locator("[data-boss-start]").click();
  await expect(page.locator("[data-boss-count]")).toContainText("PERGUNTA 01/08");

  const livesBefore = await page.locator("[data-boss-lives]").textContent();
  const questionText = (await page.locator("[data-boss-question]").textContent())?.trim() || "";
  const question = questionFor(world, questionText);
  const wrong = (question.answer + 1) % question.options.length;
  await page.locator("[data-boss-option]").nth(wrong).click();
  await expect(page.locator("[data-boss-lives]")).not.toHaveText(livesBefore || "");

  await page.locator("[data-back]").click();
  await expect(page.locator(".kn-world-card")).toHaveCount(5);

  expect(errors).toEqual([]);
});

test("progresso abre, exporta JSON e fecha com ESC", async ({ page }) => {
  const errors = trackConsole(page);
  await openKnowledge(page);
  await page.locator(".kn-top__btn[data-progress]").click();
  await expect(page.locator("#knProgressDialog")).toBeVisible();
  await expect(page.locator("[data-export]")).toBeVisible();
  await expect(page.locator("[data-import]")).toBeVisible();

  const downloadPromise = page.waitForEvent("download");
  await page.locator("[data-export]").click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toContain("agrvai");

  await page.keyboard.press("Escape");
  await expect(page.locator("#knProgressDialog")).not.toBeVisible();

  expect(errors).toEqual([]);
});

test("mudo persiste entre portfólio e conhecimento", async ({ page }) => {
  const errors = trackConsole(page);
  await page.goto("/", { waitUntil: "networkidle" });
  await page.waitForTimeout(500);

  /* default is OFF; one click turns it on, the second turns it off */
  await page.locator('[data-dock="sound"]').click();
  await page.waitForTimeout(150);
  await page.locator('[data-dock="sound"]').click();
  await page.waitForTimeout(150);
  await expect(page.locator('[data-dock="sound"]')).toHaveClass(/is-muted/);

  await page.goto("/conhecimento/", { waitUntil: "networkidle" });
  await page.waitForSelector("body.is-ready");
  await expect(page.locator("[data-sound]")).toContainText("SOM: OFF");

  await page.locator("[data-sound]").click();
  await expect(page.locator("[data-sound]")).toContainText("SOM: ON");
  await page.goto("/", { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  await expect(page.locator('[data-dock="sound"]')).not.toHaveClass(/is-muted/);

  expect(errors).toEqual([]);
});
