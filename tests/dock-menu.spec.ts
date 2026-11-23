import { expect, test } from "@playwright/test";
import { skipLoader } from "./helpers";

test.beforeEach(async ({ page }) => {
  await skipLoader(page);
});

test("menu do dock contém todos os atalhos em desktop e celular", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/", { waitUntil: "networkidle" });
  await page.evaluate(() => window.scrollTo(0, 320));

  const dock = page.locator("#dock");
  const toggle = page.locator(".dock-menu__toggle");
  await expect(toggle).toBeVisible();
  await toggle.click();
  await expect(dock).toHaveClass(/is-open/);

  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await expect
      .poll(() =>
        page.locator(".dock-menu__panel").evaluate((panel) => {
          const panelRect = panel.getBoundingClientRect();
          const labels = Array.from(panel.querySelectorAll(".dock__label"));
          return {
            left: panelRect.left,
            right: panelRect.right,
            labelsInside: labels.every((label) => {
              const rect = label.getBoundingClientRect();
              return rect.left >= panelRect.left && rect.right <= panelRect.right;
            })
          };
        })
      )
      .toEqual({ left: expect.any(Number), right: expect.any(Number), labelsInside: true });

    const bounds = await page.locator(".dock-menu__panel").evaluate((panel) => {
      const rect = panel.getBoundingClientRect();
      return { left: rect.left, right: rect.right };
    });
    expect(bounds.left).toBeGreaterThanOrEqual(0);
    expect(bounds.right).toBeLessThanOrEqual(width);
  }
});
