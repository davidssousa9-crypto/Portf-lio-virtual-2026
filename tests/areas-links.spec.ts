import { expect, test } from "@playwright/test";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

test("cada cartucho abre a página e as imagens da área correspondente como arquivo local", async ({ page }) => {
  const areasPage = pathToFileURL(resolve("areas-de-conhecimento.html")).href;
  await page.goto(areasPage, { waitUntil: "domcontentloaded" });

  const subjects = {
    linguagens: "Linguagens",
    natureza: "Natureza",
    matematica: "Matemática",
    humanas: "Humanas",
    senai: "SENAI"
  };

  for (const [id, name] of Object.entries(subjects)) {
    const cartridge = page.locator(`#consoleTop a[data-subject="${id}"]`);
    await expect(cartridge).toHaveAttribute("href", `areas/${id}/index.html`);
    await cartridge.click();
    await expect(page).toHaveURL(new RegExp(`/areas/${id}/index\\.html$`));
    await expect(page.locator(".subject-name")).toHaveText(name);
    await expect.poll(() =>
      page.locator(".image-gallery img").first().evaluate((image: HTMLImageElement) => image.naturalWidth > 0)
    ).toBe(true);
    await page.getByRole("link", { name: "Voltar" }).click();
    await expect(page).toHaveURL(/\/areas-de-conhecimento\.html$/);
  }
});

test("cada cartucho abre sua página no servidor do site", async ({ page }) => {
  await page.goto("/areas-de-conhecimento.html", { waitUntil: "domcontentloaded" });

  for (const [id, name] of Object.entries({
    linguagens: "Linguagens",
    natureza: "Natureza",
    matematica: "Matemática",
    humanas: "Humanas",
    senai: "SENAI"
  })) {
    await page.locator(`#consoleTop a[data-subject="${id}"]`).click();
    await expect(page).toHaveURL(new RegExp(`/areas/${id}/index\\.html$`));
    await expect(page.locator(".subject-name")).toHaveText(name);
    await page.getByRole("link", { name: "Voltar" }).click();
    await expect(page).toHaveURL(/\/areas-de-conhecimento\.html$/);
  }
});

test("páginas de atividade compartilham visual pixelado, fontes e datas", async ({ page }) => {
  for (const [id, name] of Object.entries({
    linguagens: "Linguagens",
    natureza: "Natureza",
    matematica: "Matemática",
    humanas: "Humanas",
    senai: "SENAI"
  })) {
    await page.goto(`/areas/${id}/index.html`, { waitUntil: "domcontentloaded" });
    await expect(page.locator(".subject-name")).toHaveText(name);
    await expect(page.locator(".subject-name")).toHaveCSS("font-family", /Fraunces/);
    await expect(page.locator(".activity-date").first()).toHaveCSS("font-family", /Pixelify Sans/);
    await expect(page.locator(".hero-sub")).toHaveCSS("font-family", /Space Grotesk/);

    const activityCount = await page.locator(".image-gallery img").count();
    await expect(page.locator(".activity-item")).toHaveCount(activityCount);
    await expect(page.locator(".activity-date")).toHaveCount(activityCount);
    for (const date of await page.locator(".activity-date").allTextContents()) {
      expect(date.trim()).toMatch(/^(?:\d{2}\/\d{2}\/\d{2}|DATA A CONFIRMAR)$/);
    }

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(overflow, `${id} must not overflow horizontally`).toBeLessThanOrEqual(1);
  }
});

test("todas as páginas de atividade exibem os Eixos 1 a 4", async ({ page }) => {
  for (const id of ["linguagens", "natureza", "matematica", "humanas", "senai"]) {
    await page.goto(`/areas/${id}/index.html`, { waitUntil: "domcontentloaded" });
    await expect(page.locator(".eixo-container")).toHaveCount(4);
    await expect(page.locator(".eixo-heading h2")).toHaveText([
      "Eixo 1", "Eixo 2", "Eixo 3", "Eixo 4"
    ]);

    const expectedPlaceholders = ["linguagens", "natureza", "humanas"].includes(id) ? 2 : id === "senai" ? 1 : 0;
    await expect(page.locator(".activity-pending")).toHaveCount(expectedPlaceholders);
  }
});
