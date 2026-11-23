import { expect, test } from "@playwright/test";
import { openKnowledge, skipLoader, trackConsole } from "./helpers";

test.beforeEach(async ({ page }) => {
  await skipLoader(page);
});

test("âncoras congeladas, seções e navegação intactas", async ({ page }) => {
  const errors = trackConsole(page);
  await page.goto("/", { waitUntil: "networkidle" });
  await page.waitForTimeout(400);

  const anchors = [
    "hero",
    "about",
    "pixels",
    "ideas",
    "brain-section",
    "dna",
    "emotion",
    "hands",
    "windows",
    "tetris",
    "cta",
    "world"
  ];
  for (const id of anchors) {
    await expect(page.locator(`#${id}`)).toHaveCount(1);
  }

  const portfolioOrder = await page
    .locator("#ideas, #hands, #dna, #emotion, #brain-section")
    .evaluateAll((sections) => sections.map((section) => section.id));
  expect(portfolioOrder).toEqual([
    "ideas",
    "dna",
    "hands",
    "emotion",
    "brain-section"
  ]);

  await expect(page.locator(".pacnav__item")).toHaveCount(12);
  await expect(page.locator(".dock__item")).toHaveCount(5);
  await expect(page.locator(".topnav__link")).toHaveCount(4);
  await expect(page.locator("#hero .mode-btn")).toHaveCount(3);

  expect(errors).toEqual([]);
});

test("seções de atividades estão organizadas e a seção de janelas chama-se Currículo", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  const sectionOrder = await page
    .locator("#hands, #tetris, #windows")
    .evaluateAll((sections) => sections.map((section) => section.id));

  expect(sectionOrder).toEqual(["hands", "tetris", "windows"]);
  await expect(page.locator("#beauty")).toHaveCount(0);
  await expect(page.locator("body")).not.toContainText("A forma segue a função, mas a beleza conduz.");
  await expect(page.locator("body")).not.toContainText("Três projetos autorais");
  await expect(page.locator("body")).not.toContainText("O sistema mantém a próxima tela");
  await expect(page.locator("body")).not.toContainText("Vestibulum id ligula porta felis");
  await expect(page.locator("#windowsTitle")).toHaveText("Currículo");
  await expect(page.locator(".curriculum-runner")).toHaveCount(0);
  await expect(page.locator("#emotionTitle")).toHaveText("Referências");
  await expect(page.locator("#emotion .lead")).toContainText("todamateria");
  await expect(page.locator("#brainTitle")).toHaveText("Considerações finais");
  await expect(page.locator("#brain-section .lead")).toContainText("Este portfólio reflete");
  await expect(page.locator("#dnaTitle")).toHaveText("História de vida");
  await expect(page.locator("#dna .lead")).toContainText("Meu nome é David Da Silva Sousa");
  await expect(page.locator("#ctaTitle")).toHaveText("Anexos");
  await expect(page.locator("#cta").getByRole("link", { name: /Ver anexos/ })).toHaveAttribute("href", "./anexos.html");
});

test("botão do currículo abre a página com formação e projetos", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await page.locator("#windows").scrollIntoViewIfNeeded();
  await page.locator("#windows").getByRole("link", { name: /Ver currículo/ }).click();

  await expect(page).toHaveURL(/\/curriculo\.html$/);
  await expect(page.locator(".subject-name")).toHaveText("David Da Silva Sousa");
  await expect(page.getByRole("heading", { name: "Formação" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Projetos" })).toBeVisible();
});

test("botão Ver anexos abre os registros do acervo", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await page.locator("#cta").scrollIntoViewIfNeeded();
  await page.locator("#cta").getByRole("link", { name: /Ver anexos/ }).click();

  await expect(page).toHaveURL(/\/anexos\.html$/);
  await expect(page.locator(".subject-name")).toHaveText("Galeria de artes");
  await expect(page.locator(".photo-frame")).toHaveCount(26);
  await expect(page.locator('[data-photo-frame^="archive-"]')).toHaveCount(26);
  await expect(page.locator('[data-photo-frame="archive-01"] .frame-caption span')).toHaveText("Apresentação sobre Indústrias");
  await expect(page.locator('[data-photo-frame="archive-26"] .frame-caption span')).toHaveText("Visita à Virtex");
});

test("modal de contato abre e fecha sem erros", async ({ page }) => {
  const errors = trackConsole(page);
  await page.goto("/", { waitUntil: "networkidle" });
  await page.waitForTimeout(400);

  await page.locator('[data-dock="contact"]').click();
  await expect(page.locator("#contactDialog")).toBeVisible();
  await page.locator("[data-close-contact]").first().click();
  await expect(page.locator("#contactDialog")).not.toBeVisible();

  expect(errors).toEqual([]);
});

test("arcade abre um jogo, pausa e fecha", async ({ page }) => {
  const errors = trackConsole(page);
  await page.goto("/", { waitUntil: "networkidle" });
  await page.waitForTimeout(500);

  await expect(page.locator(".arcade-chip")).toHaveCount(10);
  await page.locator('.arcade-chip[data-game="memory"]').click();
  const windowNode = page.locator(".arcade-window");
  await expect(windowNode).toBeVisible();
  await expect(windowNode.locator("[data-hud-level]")).toBeVisible();

  await windowNode.locator("[data-arcade-pause]").click();
  await expect(windowNode.locator("[data-arcade-status]")).toContainText(/PAUSA/i);
  await page.keyboard.press("Escape");
  await expect(page.locator(".arcade-window")).toHaveCount(0);

  expect(errors).toEqual([]);
});

test("modo criativo/desenvolvedor alterna e persiste", async ({ page }) => {
  const errors = trackConsole(page);
  await page.goto("/", { waitUntil: "networkidle" });
  await page.waitForTimeout(400);

  const developer = page.locator('.mode-btn[data-mode="developer"]');
  await developer.click();
  await expect(developer).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#aboutMode")).toHaveText("DESENVOLVEDOR");
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(400);
  await expect(page.locator('.mode-btn[data-mode="developer"]')).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#aboutMode")).toHaveText("DESENVOLVEDOR");

  const holiday = page.locator('.mode-btn[data-mode="holiday"]');
  await holiday.click();
  await expect(holiday).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#aboutMode")).toHaveText("FÉRIAS");
  await page.waitForTimeout(750);
  const santaRedPixels = await page.locator("#characterCanvas").evaluate((canvas: HTMLCanvasElement) => {
    const context = canvas.getContext("2d");
    if (!context) return 0;
    const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
    let count = 0;
    for (let index = 0; index < data.length; index += 4) {
      if (data[index] === 198 && data[index + 1] === 40 && data[index + 2] === 40) {
        count += 1;
      }
    }
    return count;
  });
  expect(santaRedPixels).toBeGreaterThan(0);
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(400);
  await expect(page.locator('.mode-btn[data-mode="holiday"]')).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#aboutMode")).toHaveText("FÉRIAS");

  expect(errors).toEqual([]);
});

test("menu e ícone de conhecimento levam à página de áreas de conhecimento", async ({ page }) => {
  const errors = trackConsole(page);
  await page.goto("/", { waitUntil: "networkidle" });
  await page.waitForTimeout(400);

  await page.locator('#dock a[data-dock="knowledge"]').click();
  await expect(page).toHaveURL(/\/areas-de-conhecimento\.html$/);
  await expect(page.locator("#consoleTop a[data-subject]")).toHaveCount(5);

  await page.goto("/", { waitUntil: "networkidle" });
  await page.locator('#topNavLinks a[href="areas-de-conhecimento.html"]').click();
  await expect(page).toHaveURL(/\/areas-de-conhecimento\.html$/);
  await expect(page.locator("#consoleTop a[data-subject]")).toHaveCount(5);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/", { waitUntil: "networkidle" });
  await page.locator("#topNavToggle").click();
  await page.locator('#topNavMenu a[href="areas-de-conhecimento.html"]').click();
  await expect(page).toHaveURL(/\/areas-de-conhecimento\.html$/);
  await expect(page.locator("#consoleTop a[data-subject]")).toHaveCount(5);

  expect(errors).toEqual([]);
});

test("conhecimento mantém layout em 1920 e 390", async ({ page }) => {
  const errors = trackConsole(page);
  for (const size of [
    { width: 1920, height: 1080 },
    { width: 390, height: 844 }
  ]) {
    await page.setViewportSize(size);
    await openKnowledge(page);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(overflow, `conhecimento @ ${size.width}`).toBeLessThanOrEqual(1);
    await expect(page.locator(".kn-world-card")).toHaveCount(5);
  }
  expect(errors).toEqual([]);
});
